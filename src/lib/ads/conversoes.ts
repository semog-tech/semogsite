import 'server-only'
import { JWT } from 'google-auth-library'
import { paraDataManager } from '@/lib/adsConsent'
import type { CliqueDoGoogle } from '@/lib/attribution'
import { comPrazo } from '@/lib/prazo'

/**
 * Data Manager API (`events:ingest`), o método novo do Google para conversão offline. Extraído do
 * cron `upload-ads-conversions` para que a conversão do formulário suba na hora, junto com o Exact
 * (D1), e o cron diário use o mesmo corpo. Idempotência: `transactionId` estável por linha
 * (`lead-<id>`, `wa-<id>`); o Google não conta duas vezes o mesmo.
 */

const INGEST_URL = 'https://datamanager.googleapis.com/v1/events:ingest'
const SCOPE = 'https://www.googleapis.com/auth/datamanager'

/**
 * Prazo de cada chamada ao Google (token e ingest). O envio roda dentro da Server Action da etapa 2:
 * Google pendurado não pode prender a resposta (D1). Estourou = falha do Ads, vai ao Sentry e o lote
 * diário retenta (o `transactionId` evita contar duas vezes).
 */
export const PRAZO_ADS_MS = 5000

export type TipoDeClique = CliqueDoGoogle['tipo']

export type ConfigAds = {
  login: string
  customer: string
  acaoProposta: string
  acaoWhatsapp?: string
  subject: string
  saJson: string
}

export type EventoDeConversao = {
  transactionId: string
  tipoDeClique: TipoDeClique
  clique: string
  criadoEm: string | Date
  adsConsent: string | null
}

export type ResultadoIngest = { ok: boolean; status: number; resposta: string }

/** Tipo gravado em `data` (`TIPO_CLIQUE_FIELD`); ausente ou desconhecido = gclid, o formato de hoje. */
export function tipoDeClique(valor: string | null | undefined): TipoDeClique {
  return valor === 'gbraid' || valor === 'wbraid' ? valor : 'gclid'
}

export function lerConfigAds(
  // Não `NodeJS.ProcessEnv`: os @types/node exigem `NODE_ENV` ali (mesmo motivo de `ambienteAtual`).
  env: Readonly<Record<string, string | undefined>> = process.env,
): ConfigAds | null {
  const login = env.GOOGLE_ADS_LOGIN_CUSTOMER_ID
  const customer = env.GOOGLE_ADS_CUSTOMER_ID
  const acaoProposta = env.GOOGLE_ADS_CONVERSION_ACTION_ID
  const subject = env.GOOGLE_ADS_IMPERSONATED_EMAIL
  const saJson = env.GOOGLE_SA_JSON
  if (!login || !customer || !acaoProposta || !subject || !saJson) return null
  return {
    login,
    customer,
    acaoProposta,
    acaoWhatsapp: env.GOOGLE_ADS_WHATSAPP_CONVERSION_ACTION_ID || undefined,
    subject,
    saJson,
  }
}

export async function obterTokenAds(
  config: ConfigAds,
  prazoMs = PRAZO_ADS_MS,
): Promise<string | null> {
  // `as`: é o JSON da conta de serviço que nós mesmos configuramos; os dois campos são obrigatórios nele.
  const sa = JSON.parse(config.saJson) as { client_email: string; private_key: string }
  const jwt = new JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: [SCOPE],
    subject: config.subject,
  })
  return (await comPrazo(jwt.authorize(), prazoMs, 'Token do Google')).access_token ?? null
}

export function corpoDoIngest(
  config: ConfigAds,
  destinoId: string,
  eventos: readonly EventoDeConversao[],
) {
  return {
    destinations: [
      {
        operatingAccount: { accountType: 'GOOGLE_ADS', accountId: config.customer },
        loginAccount: { accountType: 'GOOGLE_ADS', accountId: config.login },
        productDestinationId: destinoId,
      },
    ],
    events: eventos.map((e) => ({
      // gclid, gbraid e wbraid são campos distintos em AdIdentifiers (referência da API).
      adIdentifiers: { [e.tipoDeClique]: e.clique },
      conversionValue: 1,
      currency: 'BRL',
      eventTimestamp: new Date(e.criadoEm).toISOString(),
      transactionId: e.transactionId,
      eventSource: 'WEB',
      // Consentimento por evento: vence o do lote (ver `paraDataManager`, `@/lib/adsConsent`).
      consent: {
        adUserData: paraDataManager(e.adsConsent),
        adPersonalization: paraDataManager(e.adsConsent),
      },
    })),
  }
}

/** Uma chamada por ação de conversão. Tudo ou nada: a API não devolve status por evento. */
export async function ingerirConversoes(
  token: string,
  config: ConfigAds,
  destinoId: string,
  eventos: readonly EventoDeConversao[],
  prazoMs = PRAZO_ADS_MS,
): Promise<ResultadoIngest> {
  // O sinal aborta a conexão (e a leitura do corpo); `comPrazo` garante o fim mesmo se algo ignorar o sinal.
  const signal = AbortSignal.timeout(prazoMs)
  return comPrazo(enviar(token, config, destinoId, eventos, signal), prazoMs, 'Data Manager')
}

async function enviar(
  token: string,
  config: ConfigAds,
  destinoId: string,
  eventos: readonly EventoDeConversao[],
  signal: AbortSignal,
): Promise<ResultadoIngest> {
  const res = await fetch(INGEST_URL, {
    signal,
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(corpoDoIngest(config, destinoId, eventos)),
  })
  const json: unknown = await res.json()
  return { ok: res.ok, status: res.status, resposta: JSON.stringify(json).slice(0, 300) }
}
