import 'server-only'

import type { ExactLeadInput, ExactPersonInput } from './map-lead'

/**
 * Client mínimo do Exact Spotter — só o que o formulário do site precisa
 * (`POST /LeadsAdd` e `POST /PersonsAdd`). O `semogapp` tem um client completo
 * com rate-limit e paginação; aqui são duas chamadas pontuais de baixo volume,
 * e o retry fica a cargo do cron, então duplicar um punhado de linhas custa
 * menos que acoplar o site à API do VPS.
 *
 * O contrato real da API está documentado em
 * `scripts/probe-exact-create-lead.ts` — em vários pontos ele não bate com o
 * PDF oficial da Exact.
 */

const TIMEOUT_MS = 8_000

function baseUrl(): string {
  return (process.env.EXACT_SPOTTER_BASE_URL || 'https://api.exactspotter.com/v3').replace(
    /\/$/,
    '',
  )
}

/** Sem token, tudo vira no-op — é o que mantém preview e `next dev` fora do CRM. */
export function exactEnabled(): boolean {
  return Boolean(process.env.EXACT_SPOTTER_TOKEN)
}

async function request(path: string, init: { method: 'GET' | 'POST'; body?: unknown }) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${baseUrl()}${path}`, {
      method: init.method,
      headers: {
        token_exact: process.env.EXACT_SPOTTER_TOKEN as string,
        'content-type': 'application/json',
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
      signal: controller.signal,
    })
    const text = await res.text()
    let parsed: unknown = null
    try {
      parsed = text ? JSON.parse(text) : null
    } catch {
      parsed = text.slice(0, 200)
    }
    if (!res.ok) {
      throw new Error(
        `Exact ${init.method} ${path} falhou (${res.status}): ${JSON.stringify(parsed).slice(0, 200)}`,
      )
    }
    return parsed
  } finally {
    clearTimeout(timer)
  }
}

/** `POST /LeadsAdd` responde `{ "@odata.context": …, "value": <id> }`. */
function extractId(body: unknown): number | null {
  if (typeof body === 'number') return body
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>
    for (const key of ['value', 'id', 'leadId']) {
      const candidate = record[key]
      if (typeof candidate === 'number') return candidate
      if (typeof candidate === 'string' && /^\d+$/.test(candidate)) return Number(candidate)
    }
  }
  return null
}

/**
 * Cria o lead e devolve o id.
 *
 * O corpo é aninhado (`{ duplicityValidation, validateEmail, lead }`) porque é
 * o formato do `LeadCriacaoAtualizacaoODataDTO`; corpo plano é recusado com um
 * 400 genérico. `duplicityValidation: false` é decisão do produto — o mesmo
 * condomínio pedindo proposta de novo entra como lead novo em vez de sumir.
 *
 * Quando a resposta não traz o id, busca o lead recém-criado pelo telefone —
 * chave que acabamos de gravar e que a listagem devolve como `phone1`
 * (DDI + número, sem `+`).
 */
export async function createLead(lead: ExactLeadInput): Promise<number> {
  const created = await request('/LeadsAdd', {
    method: 'POST',
    body: { duplicityValidation: false, validateEmail: false, lead },
  })

  const id = extractId(created)
  if (id) return id

  if (!lead.phone) {
    throw new Error('Exact criou o lead mas não devolveu id, e não há telefone pra buscar.')
  }
  const telefone = `${lead.ddiPhone ?? '55'}${lead.phone}`
  const filtro = encodeURIComponent(`phone1 eq '${telefone}'`)
  const found = await request(`/Leads?$filter=${filtro}&$orderby=registerDate desc&$top=1`, {
    method: 'GET',
  })
  const encontrado = (found as { value?: Array<{ id: number }> })?.value?.[0]?.id
  if (!encontrado) throw new Error('Exact criou o lead mas não foi possível recuperar o id.')
  return encontrado
}

export async function createPerson(person: ExactPersonInput & { leadId: number }): Promise<void> {
  await request('/PersonsAdd', { method: 'POST', body: person })
}
