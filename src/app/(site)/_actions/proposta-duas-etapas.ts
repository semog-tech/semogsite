'use server'

/**
 * **Só exporte função async deste arquivo** (mesma regra de `(frontend)/_actions/submit-form.ts`):
 * todo export de um módulo `'use server'` vira Server Action, inclusive um `export type`, e isso já
 * derrubou a captação por 12 dias. Tipos vêm de `@/lib/propostaDuasEtapas/resultado`.
 *
 * Pedido de proposta em duas etapas (spec 4.2). As três actions nunca lançam: devolvem
 * `ResultadoEtapa`. Uma linha por lead; Exact, e-mail e Ads saem uma vez, pela pós-gravação, só
 * quando a linha é concluída (aqui) ou quando o cron reivindica a etapa 1 parada há 45 min.
 */

import { randomUUID } from 'node:crypto'
import { clienteIp } from '@/lib/clienteIp'
import type { LinhaDoLead } from '@/lib/leads/linha'
import { processarPosGravacao } from '@/lib/leads/posGravacao'
import { reportarFalhaDoLead } from '@/lib/leads/reportar'
import {
  apagarTokenDaEtapa,
  gravarTokenDaEtapa,
  lerTokenDaEtapa,
} from '@/lib/propostaDuasEtapas/cookie'
import {
  absorverComTurnstile,
  atualizarEtapa1,
  concluirEtapa2,
  contextoDoEnvio,
  inserirCompleta,
  inserirEtapa1,
  reaproveitarEtapa1,
} from '@/lib/propostaDuasEtapas/gravacao'
import type { ResultadoEtapa, ResultadoFalha } from '@/lib/propostaDuasEtapas/resultado'
import {
  dadosDaEtapa1,
  dadosDaEtapa2,
  type Etapa2Dados,
  errosPorCampo,
  etapa1Schema,
  etapa2Schema,
  propostaCompletaSchema,
} from '@/lib/propostaDuasEtapas/schema'
import { rateLimit } from '@/lib/rate-limit'
import { verifyTurnstile } from '@/lib/turnstile'

const FALHA: ResultadoFalha = {
  ok: false,
  motivo: 'falha',
  mensagem: 'Não conseguimos registrar seu pedido agora.',
}
const MUITAS: ResultadoFalha = {
  ok: false,
  motivo: 'recusado',
  mensagem: 'Muitas tentativas, tente em instantes.',
}
const ANTI_ROBO: ResultadoFalha = {
  ok: false,
  motivo: 'recusado',
  mensagem: 'A verificação de segurança falhou. Tente de novo.',
}
const PRECISA_VERIFICAR: ResultadoFalha = { ok: false, motivo: 'precisa_verificar' }

/** Cota por IP e janela de 1 min (DP11). Rate limit antes do Turnstile, como o formulário antigo. */
function dentroDoLimite(chave: 'proposta' | 'proposta-etapa2', ip: string | undefined): boolean {
  const max = chave === 'proposta' ? 5 : 10
  return rateLimit(`${chave}:${ip ?? 'anon'}`, { max, windowMs: 60_000 }).ok
}

/** Exact, e-mail e Ads. Nunca muda a resposta: o lead já está salvo. */
async function depoisDeGravar(linha: LinhaDoLead): Promise<void> {
  try {
    await processarPosGravacao(linha, 'acao')
  } catch (erro) {
    reportarFalhaDoLead('pos_gravacao', erro, { leadId: linha.id, origem: 'acao' })
  }
}

/**
 * Cookie depois da gravação, fora do try dela: a linha já está salva (e, nas etapas que concluem,
 * reivindicada), então uma falha aqui não pode virar "falha" na tela nem impedir o pós-gravação;
 * a nova tentativa da pessoa duplicaria o lead. Vai ao Sentry, sem dado pessoal.
 */
async function mexerNoCookie(operacao: () => Promise<void>, origem: string): Promise<void> {
  try {
    await operacao()
  } catch (erro) {
    reportarFalhaDoLead('cookie', erro, { origem })
  }
}

/** `token`: o da linha nova, para gravar no cookie; `null` quando a linha do cookie foi corrigida. */
async function gravarEtapa1(
  dados: Record<string, string>,
  turnstileToken: string | null,
): Promise<{ token: string | null } | ResultadoFalha> {
  try {
    const ip = await clienteIp()
    if (!dentroDoLimite('proposta', ip)) return MUITAS
    const token = await lerTokenDaEtapa()
    if (token && (await atualizarEtapa1(token, dados))) return { token: null }
    if (!turnstileToken) return PRECISA_VERIFICAR
    if (!(await verifyTurnstile(turnstileToken, ip))) return ANTI_ROBO
    // Token vencido, Turnstile novo: a linha do cookie, se o cron ainda não a enviou (sem duplicata).
    if (token && (await reaproveitarEtapa1(token, dados))) return { token: null }
    const novo = randomUUID()
    await inserirEtapa1(dados, await contextoDoEnvio(), novo)
    return { token: novo }
  } catch (erro) {
    reportarFalhaDoLead('gravacao', erro, { origem: 'etapa1' })
    return FALHA
  }
}

export async function enviarEtapa1(
  valores: unknown,
  turnstileToken: string | null,
): Promise<ResultadoEtapa> {
  const lido = etapa1Schema.safeParse(valores)
  if (!lido.success) return { ok: false, motivo: 'campos', erros: errosPorCampo(lido.error.issues) }
  const gravado = await gravarEtapa1(dadosDaEtapa1(lido.data), turnstileToken)
  if ('ok' in gravado) return gravado
  const { token } = gravado
  if (token) await mexerNoCookie(() => gravarTokenDaEtapa(token), 'etapa1')
  return { ok: true, etapa: 1 }
}

async function gravarEtapa2(dados: Etapa2Dados): Promise<LinhaDoLead | ResultadoFalha> {
  try {
    if (!dentroDoLimite('proposta-etapa2', await clienteIp())) return MUITAS
    const token = await lerTokenDaEtapa()
    if (!token) return PRECISA_VERIFICAR
    const linha = await concluirEtapa2(token, dadosDaEtapa2(dados))
    return linha ?? PRECISA_VERIFICAR
  } catch (erro) {
    reportarFalhaDoLead('gravacao', erro, { origem: 'etapa2' })
    return FALHA
  }
}

export async function enviarEtapa2(valores: unknown): Promise<ResultadoEtapa> {
  const lido = etapa2Schema.safeParse(valores)
  if (!lido.success) return { ok: false, motivo: 'campos', erros: errosPorCampo(lido.error.issues) }
  const gravado = await gravarEtapa2(lido.data)
  if ('ok' in gravado) return gravado
  await mexerNoCookie(apagarTokenDaEtapa, 'etapa2')
  await depoisDeGravar(gravado)
  return { ok: true, etapa: 2 }
}

async function gravarCompleta(
  dados: Record<string, string>,
  turnstileToken: string,
): Promise<LinhaDoLead | ResultadoFalha> {
  try {
    const ip = await clienteIp()
    if (!dentroDoLimite('proposta', ip)) return MUITAS
    if (!turnstileToken) return PRECISA_VERIFICAR
    if (!(await verifyTurnstile(turnstileToken, ip))) return ANTI_ROBO
    const token = await lerTokenDaEtapa()
    const absorvida = token ? await absorverComTurnstile(token, dados) : null
    return absorvida ?? (await inserirCompleta(dados, await contextoDoEnvio()))
  } catch (erro) {
    reportarFalhaDoLead('gravacao', erro, { origem: 'completa' })
    return FALHA
  }
}

export async function enviarPropostaCompleta(
  valores: unknown,
  turnstileToken: string,
): Promise<ResultadoEtapa> {
  const lido = propostaCompletaSchema.safeParse(valores)
  if (!lido.success) return { ok: false, motivo: 'campos', erros: errosPorCampo(lido.error.issues) }
  const gravado = await gravarCompleta(
    { ...dadosDaEtapa1(lido.data), ...dadosDaEtapa2(lido.data) },
    turnstileToken,
  )
  if ('ok' in gravado) return gravado
  await mexerNoCookie(apagarTokenDaEtapa, 'completa')
  await depoisDeGravar(gravado)
  return { ok: true, etapa: 2 }
}
