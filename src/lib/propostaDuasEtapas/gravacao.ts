import 'server-only'
import { cookies, headers } from 'next/headers'
import { consentimentoDeAnuncio, paisDaRequisicao } from '@/lib/adsConsent'
import {
  ATTRIBUTION_COOKIE,
  buildAttributionFields,
  parseAttributionCookie,
} from '@/lib/attribution'
import { CONSENT_COOKIE_NAME } from '@/lib/consent'
import { query } from '@/lib/db'
import { extractLeadColumns } from '@/lib/forms'
import { AMBIENTE_FIELD, ambienteAtual } from '@/lib/leads/ambiente'
import { destinatariosPorUf } from '@/lib/leads/destinatarios'
import { COLUNAS_DA_LINHA, type LinhaDoLead } from '@/lib/leads/linha'

/**
 * SQL das duas etapas (spec 4.2, R4 a R6). Uma linha por lead; quem conclui a linha também a
 * reivindica (`envio_em = now()`) no mesmo comando, e é isso que impede o cron de enviá-la de novo.
 * Cada consulta começa com uma etiqueta em comentário, lida pelos testes.
 */

export type ContextoDoEnvio = {
  origem: Record<string, string>
  gclid: string | null
  adsConsent: string
}

/** Atribuição (cookie de 1ª parte), ambiente e consentimento de anúncio, como o formulário antigo. */
export async function contextoDoEnvio(): Promise<ContextoDoEnvio> {
  const jar = await cookies()
  const campos = buildAttributionFields(parseAttributionCookie(jar.get(ATTRIBUTION_COOKIE)?.value))
  const origem: Record<string, string> = { [AMBIENTE_FIELD]: ambienteAtual() }
  for (const campo of campos) origem[`origem — ${campo.label}`] = campo.value
  const adsConsent = consentimentoDeAnuncio(
    jar.get(CONSENT_COOKIE_NAME)?.value,
    paisDaRequisicao(await headers()),
  )
  return { origem, gclid: extractLeadColumns(origem).gclid ?? null, adsConsent }
}

function destinoDe(dados: Record<string, string>): string {
  return destinatariosPorUf(dados.uf).join(', ')
}

const TOKEN_DENTRO_DE_30_MIN = "created_at > now() - interval '30 minutes'"

/**
 * Nome do condomínio comparável: sem acentos, minúsculas, espaços colapsados e aparados. Em SQL, e
 * não no Node, porque compara com o valor já gravado na linha.
 */
function nomeNormalizado(expr: string): string {
  return `btrim(regexp_replace(lower(regexp_replace(normalize(${expr}, NFD), '[\\u0300-\\u036f]', '', 'g')), '[[:space:]]+', ' ', 'g'))`
}

/**
 * Mesma pessoa, mesmo condomínio: telefone E.164 igual e nome do condomínio normalizado igual.
 * Telefone sozinho não basta: o síndico de dois condomínios usa o mesmo número para os dois.
 */
function mesmaPessoa(linha: string, novos: string): string {
  return `${linha}->>'telefone' = ${novos}->>'telefone'
          and ${nomeNormalizado(`${linha}->>'nomeCondominio'`)} = ${nomeNormalizado(`${novos}->>'nomeCondominio'`)}`
}

export async function inserirEtapa1(
  dados: Record<string, string>,
  ctx: ContextoDoEnvio,
  token: string,
): Promise<string> {
  const { rows } = await query<{ id: string }>(
    `/* proposta:inserir-etapa1 */
     insert into cms.leads (form, data, gclid, email, ads_consent, notificado_para, etapa, token_envio, envio_em)
     values ('proposta', $1, $2, $3, $4, $5, 1, $6, null) returning id`,
    [
      { ...dados, ...ctx.origem },
      ctx.gclid,
      dados.email ?? null,
      ctx.adsConsent,
      destinoDe(dados),
      token,
    ],
  )
  const id = rows[0]?.id
  if (!id) throw new Error('INSERT da etapa 1 não devolveu id.')
  return id
}

/** "Voltar" (R6): corrige a etapa 1 da mesma linha. O e-mail sai do `data` se a pessoa o apagou. */
export async function atualizarEtapa1(
  token: string,
  dados: Record<string, string>,
): Promise<boolean> {
  const { rowCount } = await query(
    `/* proposta:atualizar-etapa1 */
     update cms.leads set data = (data - 'email') || $2::jsonb, email = $3, notificado_para = $4
      where token_envio = $1 and etapa = 1 and envio_em is null and ${TOKEN_DENTRO_DE_30_MIN}`,
    [token, dados, dados.email ?? null, destinoDe(dados)],
  )
  return (rowCount ?? 0) > 0
}

/**
 * Etapa 1 com Turnstile novo e cookie de uma linha anterior (R5/R6): é a mesma pessoa voltando
 * (token vencido, ou página recarregada) só se telefone e condomínio baterem com a linha; então a
 * corrige enquanto o cron não a reivindicou, sem o limite dos 30 min. Outro telefone ou outro
 * condomínio é formulário novo: nada muda aqui, a action grava linha nova e a anterior segue
 * pendente para o cron. `created_at` NÃO muda: o cron mede os 45 min a partir dele, e renová-lo
 * adiaria o envio a cada volta. Linha já reivindicada não é tocada.
 */
export async function reaproveitarEtapa1(
  token: string,
  dados: Record<string, string>,
): Promise<boolean> {
  const { rowCount } = await query(
    `/* proposta:reaproveitar-etapa1 */
     update cms.leads set data = (data - 'email') || $2::jsonb, email = $3, notificado_para = $4
      where token_envio = $1 and etapa = 1 and envio_em is null
        and ${mesmaPessoa('data', '$2::jsonb')}`,
    [token, dados, dados.email ?? null, destinoDe(dados)],
  )
  return (rowCount ?? 0) > 0
}

/** Etapa 2 pelo token: válido 30 min, uso único (etapa = 1), e já reivindica a linha. */
export async function concluirEtapa2(
  token: string,
  dados: Record<string, string>,
): Promise<LinhaDoLead | null> {
  const { rows } = await query<LinhaDoLead>(
    `/* proposta:concluir-etapa2 */
     update cms.leads set data = data || $2::jsonb, etapa = 2, envio_em = now()
      where token_envio = $1 and etapa = 1 and envio_em is null and ${TOKEN_DENTRO_DE_30_MIN}
      returning ${COLUNAS_DA_LINHA}`,
    [token, dados],
  )
  return rows[0] ?? null
}

/**
 * Token vencido mas Turnstile novo (R5, DP3): reaproveita a linha do cookie enquanto o cron não a
 * reivindicou, sem o limite dos 30 min, e só se for a mesma pessoa e o mesmo condomínio (a regra de
 * `reaproveitarEtapa1`). Se o cron já enviou, ou se os dados são de outro lead, nada é atualizado e
 * a action grava uma linha nova completa (duplicata aceita pela spec 4.2; sobrescrever, não).
 */
export async function absorverComTurnstile(
  token: string,
  dados: Record<string, string>,
): Promise<LinhaDoLead | null> {
  const { rows } = await query<LinhaDoLead>(
    `/* proposta:absorver */
     update cms.leads
        set data = (data - 'email') || $2::jsonb, email = $3, notificado_para = $4, etapa = 2, envio_em = now()
      where token_envio = $1 and etapa = 1 and envio_em is null
        and ${mesmaPessoa('data', '$2::jsonb')}
      returning ${COLUNAS_DA_LINHA}`,
    [token, dados, dados.email ?? null, destinoDe(dados)],
  )
  return rows[0] ?? null
}

/**
 * Linha nova completa (etapa 2). Nasce reivindicada: `envio_em = now()` escrito no próprio INSERT,
 * e não deixado ao default da coluna, porque o pós-gravação só pode receber linha que quem chama
 * reivindicou no mesmo comando (o cron nunca a pega, e ninguém mais a envia).
 *
 * No MESMO comando, a etapa 1 órfã do mesmo lead (cookie perdido: mesmo telefone E.164 E mesmo
 * nome de condomínio normalizado, mesmo ambiente, pendente, das últimas 2 h) é marcada como
 * substituída: `envio_em` preenchido e
 * `substituida_por` = id da linha nova. Sem isso o cron a enviaria aos 45 min e o lead viraria dois
 * cards no Exact. Disputa com o cron: o UPDATE exige `envio_em is null` e espera a trava da linha;
 * se o cron a reivindicou antes, nada muda e a duplicata fica (aceita pela spec 4.2). O UPDATE do
 * CTE não enxerga a linha que o INSERT acabou de criar (mesmo snapshot), e ela é etapa 2.
 */
export async function inserirCompleta(
  dados: Record<string, string>,
  ctx: ContextoDoEnvio,
): Promise<LinhaDoLead> {
  const { rows } = await query<LinhaDoLead>(
    `/* proposta:inserir-completa */
     with novo as (
       insert into cms.leads (form, data, gclid, email, ads_consent, notificado_para, etapa, envio_em)
       values ('proposta', $1, $2, $3, $4, $5, 2, now()) returning ${COLUNAS_DA_LINHA}
     ), substituidas as (
       update cms.leads l
          set envio_em = now(), data = l.data || jsonb_build_object('substituida_por', novo.id::text)
         from novo
        where l.form = 'proposta' and l.etapa = 1 and l.envio_em is null
          and ${mesmaPessoa('l.data', 'novo.data')}
          and l.data->>'ambiente' = novo.data->>'ambiente'
          and l.created_at > now() - interval '2 hours'
        returning l.id
     )
     select ${COLUNAS_DA_LINHA} from novo`,
    [{ ...dados, ...ctx.origem }, ctx.gclid, dados.email ?? null, ctx.adsConsent, destinoDe(dados)],
  )
  const linha = rows[0]
  if (!linha) throw new Error('INSERT da proposta completa não devolveu a linha.')
  return linha
}
