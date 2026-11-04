import 'server-only'

import type { ConversaoMarketing } from './payload'

export type ResultadoMarketing =
  | { status: 'enviado'; eventUuid: string }
  | { status: 'erro' | 'incerto'; codigo: string }

/** Sem retries HTTP internos: cada POST precisa consumir uma reserva durável. */
export async function converterNoMarketing(
  apiKey: string,
  conversao: ConversaoMarketing,
): Promise<ResultadoMarketing> {
  const endpoint = new URL('https://api.rd.services/platform/conversions')
  endpoint.searchParams.set('api_key', apiKey)
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(conversao),
      signal: AbortSignal.timeout(5000),
      redirect: 'error',
    })
    return await lerResposta(response)
  } catch {
    // O erro de fetch pode conter a URL com api_key: nunca logar nem enviar ao Sentry.
    return { status: 'incerto', codigo: 'rede_timeout_ou_resposta_invalida' }
  }
}

async function lerResposta(response: Response): Promise<ResultadoMarketing> {
  if (!response.ok) {
    const terminal =
      response.status >= 400 && response.status < 500 && ![408, 429].includes(response.status)
    return { status: terminal ? 'erro' : 'incerto', codigo: `http_${response.status}` }
  }
  const data: unknown = await response.json()
  if (
    data &&
    typeof data === 'object' &&
    'event_uuid' in data &&
    typeof data.event_uuid === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.event_uuid)
  ) {
    return { status: 'enviado', eventUuid: data.event_uuid }
  }
  return { status: 'incerto', codigo: 'resposta_invalida' }
}
