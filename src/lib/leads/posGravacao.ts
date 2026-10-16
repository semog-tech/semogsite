import 'server-only'
import ContactAutoReply from '@/emails/ContactAutoReply'
import ContactNotification from '@/emails/ContactNotification'
import { ingerirConversoes, lerConfigAds, obterTokenAds, tipoDeClique } from '@/lib/ads/conversoes'
import { query } from '@/lib/db'
import { botoesDeDesfecho } from '@/lib/desfechoToken'
import { isExactEligible } from '@/lib/exact/map-lead'
import { pushLeadToExact } from '@/lib/exact/push-lead'
import { TIPO_CLIQUE_FIELD } from '@/lib/forms'
import { sendMail } from '@/lib/sendgrid'
import { ambienteLiberaEnvio } from './ambiente'
import { dadosParaOExact, type LinhaDoLead } from './linha'
import { reportarFalhaDoLead } from './reportar'

/**
 * Depois da gravação: Exact, e-mail interno (+ aviso ao lead) e conversão do Ads, **uma vez cada**,
 * para uma linha que quem chama já reivindicou (`envio_em` gravado no mesmo UPDATE que a concluiu,
 * ou no UPDATE de reivindicação do cron). Marcadores: `exact_lead_id` (Exact), `envio_em`
 * (e-mails: quem reivindicou envia, ninguém reenvia) e `uploaded_to_ads` + `transactionId` (Ads).
 * **Nunca lança:** cada passo tem o próprio try/catch, vai ao Sentry sem dado pessoal e não impede
 * os outros (D1: falha do Ads não derruba o Exact; o lote diário retenta).
 */

export type OrigemDoEnvio = 'acao' | 'cron'

export type ResumoPosGravacao = {
  exact: 'enviado' | 'falhou' | 'nao_enviado' | 'bloqueado'
  email: 'enviado' | 'falhou' | 'sem_destino' | 'bloqueado'
  ads: 'enviado' | 'falhou' | 'sem_clique' | 'nao_elegivel' | 'sem_configuracao' | 'bloqueado'
}

type ContextoDoEnvio = { leadId: string; origem: OrigemDoEnvio }

const BLOQUEADO: ResumoPosGravacao = { exact: 'bloqueado', email: 'bloqueado', ads: 'bloqueado' }

export async function processarPosGravacao(
  linha: LinhaDoLead,
  origem: OrigemDoEnvio,
): Promise<ResumoPosGravacao> {
  if (!ambienteLiberaEnvio(linha.data)) {
    console.info(
      `[lead] ${linha.id}: ambiente ${linha.data.ambiente}; nada sai (Exact, e-mail, Ads).`,
    )
    return BLOQUEADO
  }
  const contexto = { leadId: linha.id, origem }
  const exact = await enviarAoExact(linha, contexto)
  const email = await enviarEmails(linha, contexto)
  const ads = await enviarAoAds(linha, contexto)
  return { exact, email, ads }
}

async function enviarAoExact(
  linha: LinhaDoLead,
  contexto: ContextoDoEnvio,
): Promise<ResumoPosGravacao['exact']> {
  if (!isExactEligible(linha.form, linha.data)) return 'nao_enviado'
  try {
    const push = await pushLeadToExact(linha.form, dadosParaOExact(linha))
    if (!push) return 'nao_enviado'
    await query(
      `update cms.leads
          set exact_lead_id = $1, exact_error = $2, exact_attempts = exact_attempts + 1
        where id = $3`,
      [
        push.ok ? push.exactLeadId : null,
        push.ok ? (push.personError ?? null) : push.error,
        linha.id,
      ],
    )
    if (push.ok) return 'enviado'
    reportarFalhaDoLead(
      'exact',
      new Error('Exact recusou ou não respondeu (detalhe em exact_error)'),
      contexto,
    )
    return 'falhou'
  } catch (erro) {
    reportarFalhaDoLead('exact', erro, contexto)
    return 'falhou'
  }
}

/** Rótulos e ordem do e-mail interno do formulário de duas etapas. */
const ROTULOS: readonly (readonly [chave: string, rotulo: string])[] = [
  ['nomeCondominio', 'Nome do condomínio'],
  ['uf', 'Estado'],
  ['telefone', 'Telefone'],
  ['email', 'E-mail'],
  ['nome', 'Seu nome'],
  ['cargo', 'Você é'],
  ['cidade', 'Cidade'],
  ['unidades', 'Nº de unidades (aprox.)'],
  ['cliente', 'Já é cliente Semog?'],
]

export function camposDoEmail(data: Record<string, string>): { label: string; value: string }[] {
  return ROTULOS.filter(([chave]) => data[chave]).map(([chave, label]) => ({
    label,
    value: chave === 'cliente' ? (data[chave] === 'sim' ? 'Sim' : 'Não') : (data[chave] ?? ''),
  }))
}

function origemDoEmail(data: Record<string, string>): { label: string; value: string }[] {
  const prefixo = 'origem — '
  return Object.entries(data)
    .filter(([chave, valor]) => chave.startsWith(prefixo) && valor)
    .map(([chave, valor]) => ({ label: chave.slice(prefixo.length), value: valor }))
}

function tituloDoEnvio(linha: LinhaDoLead): string {
  if (linha.data.cliente === 'sim') return 'Proposta (já é cliente Semog)'
  if (linha.etapa === 1) return 'Proposta (só etapa 1)'
  return 'Proposta'
}

async function enviarEmails(
  linha: LinhaDoLead,
  contexto: ContextoDoEnvio,
): Promise<ResumoPosGravacao['email']> {
  const destino = (linha.notificado_para ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (destino.length === 0) {
    // Lead que a equipe não vai saber que existe: não pode passar em silêncio.
    reportarFalhaDoLead(
      'email',
      new Error('Lead sem destinatário (notificado_para vazio)'),
      contexto,
    )
    return 'sem_destino'
  }
  try {
    const formTitle = tituloDoEnvio(linha)
    const desfecho = isExactEligible(linha.form, linha.data)
      ? (botoesDeDesfecho(linha.id) ?? undefined)
      : undefined
    const aviso = await sendMail({
      to: destino,
      subject: `Novo contato via ${formTitle}`,
      react: ContactNotification({
        formTitle,
        fields: camposDoEmail(linha.data),
        attribution: origemDoEmail(linha.data),
        desfecho,
      }),
    })
    if (!aviso.ok)
      reportarFalhaDoLead('email', new Error('SendGrid recusou a notificação interna'), contexto)
    await enviarAvisoAoLead(linha, contexto)
    return aviso.ok ? 'enviado' : 'falhou'
  } catch (erro) {
    reportarFalhaDoLead('email', erro, contexto)
    return 'falhou'
  }
}

/** Aviso automático ao lead: como hoje (`ContactAutoReply`), uma vez, só se houver e-mail (R3). */
async function enviarAvisoAoLead(linha: LinhaDoLead, contexto: ContextoDoEnvio): Promise<void> {
  const email = linha.data.email
  if (!email) return
  const resposta = await sendMail({
    to: email,
    subject: 'Recebemos seu contato — Semog',
    react: ContactAutoReply({ name: linha.data.nome || undefined }),
  })
  if (!resposta.ok)
    reportarFalhaDoLead('email', new Error('SendGrid recusou o aviso ao lead'), contexto)
}

async function enviarAoAds(
  linha: LinhaDoLead,
  contexto: ContextoDoEnvio,
): Promise<ResumoPosGravacao['ads']> {
  // Mesmo critério do Exact: captação e não cliente (spec 4.4).
  if (!isExactEligible(linha.form, linha.data)) return 'nao_elegivel'
  if (!linha.gclid) return 'sem_clique'
  const config = lerConfigAds()
  if (!config) return 'sem_configuracao'
  try {
    const token = await obterTokenAds(config)
    if (!token) throw new Error('Google não devolveu token de acesso')
    const resultado = await ingerirConversoes(token, config, config.acaoProposta, [
      {
        transactionId: `lead-${linha.id}`,
        tipoDeClique: tipoDeClique(linha.data[TIPO_CLIQUE_FIELD]),
        clique: linha.gclid,
        criadoEm: linha.created_at,
        adsConsent: linha.ads_consent,
      },
    ])
    if (!resultado.ok) {
      reportarFalhaDoLead('ads', new Error(`Data Manager respondeu ${resultado.status}`), contexto)
      return 'falhou'
    }
    await query('update cms.leads set uploaded_to_ads = true where id = $1', [linha.id])
    return 'enviado'
  } catch (erro) {
    reportarFalhaDoLead('ads', erro, contexto)
    return 'falhou'
  }
}
