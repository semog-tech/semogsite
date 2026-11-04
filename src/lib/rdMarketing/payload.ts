import type { Attribution } from '@/lib/attribution'
import { parseConsentCookie } from '@/lib/consent'
import { isExactEligible } from '@/lib/exact/map-lead'
import type { FormType } from '@/lib/forms'

export type ConversaoMarketing = {
  event_type: 'CONVERSION'
  event_family: 'CDP'
  payload: {
    conversion_identifier: 'pedido-proposta-site' | 'contato-site'
    name: string
    email?: string
    phone?: string
    mobile_phone?: string
    city?: string
    job_title?: string
    company_name?: string
    client_tracking_id?: string
    traffic_source?: string
    traffic_medium?: string
    traffic_campaign?: string
    legal_bases: { category: 'communications'; type: 'legitimate_interest'; status: 'granted' }[]
  }
}

type CookiesMarketing = { get: (name: string) => { value: string } | undefined }
export type ContextoMarketing = {
  cookies: CookiesMarketing
  atribuicao: Attribution | null
  permitido: boolean
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** A API documenta `_rdtrk` UUID; o loader atual também usa `rdtrk` JSON com `id`. */
export function identificadorDoVisitante(raw: string | undefined): string | undefined {
  if (!raw || raw.length > 4096) return undefined
  try {
    const decoded = decodeURIComponent(raw)
    if (UUID.test(decoded)) return decoded
    const parsed: unknown = JSON.parse(decoded)
    if (parsed && typeof parsed === 'object' && 'id' in parsed) {
      return typeof parsed.id === 'string' && UUID.test(parsed.id) ? parsed.id : undefined
    }
  } catch {
    // Cookie ausente/malformado não impede o pedido nem a conversão sem tracking.
  }
  return undefined
}

function consentimentoSalvo(cookies: CookiesMarketing) {
  const raw = cookies.get('semog-consent')?.value
  if (!raw) return null
  try {
    return parseConsentCookie(decodeURIComponent(raw))
  } catch {
    return null
  }
}

function trackingDoVisitante(cookies: CookiesMarketing): string | undefined {
  if (consentimentoSalvo(cookies)?.analytics === false) return undefined
  return (
    identificadorDoVisitante(cookies.get('_rdtrk')?.value) ??
    identificadorDoVisitante(cookies.get('rdtrk')?.value)
  )
}

function camposDoContato(data: Record<string, string>) {
  const phone = data.telefone?.trim() || undefined
  return {
    name: data.nome,
    email: data.email?.trim() || undefined,
    phone,
    mobile_phone: phone,
    city: data.cidade || undefined,
    job_title: data.cargo || undefined,
    company_name: data.nomeCondominio || undefined,
  }
}

/** Só captação aprovada; não inventa e-mail para a proposta curta nem consentimento. */
export function montarConversaoMarketing(
  form: FormType,
  data: Record<string, string>,
  contexto: ContextoMarketing,
): ConversaoMarketing | null {
  const permitido = consentimentoSalvo(contexto.cookies)?.marketing ?? contexto.permitido
  if (!permitido || !isExactEligible(form, data)) return null
  const contato = camposDoContato(data)
  if (!contato.email && !contato.phone) return null
  const first = contexto.atribuicao?.first
  return {
    event_type: 'CONVERSION',
    event_family: 'CDP',
    payload: {
      conversion_identifier: form === 'proposta' ? 'pedido-proposta-site' : 'contato-site',
      ...contato,
      client_tracking_id: trackingDoVisitante(contexto.cookies),
      traffic_source: first?.source || undefined,
      traffic_medium: first?.medium || undefined,
      traffic_campaign: first?.campaign || undefined,
      legal_bases: [{ category: 'communications', type: 'legitimate_interest', status: 'granted' }],
    },
  }
}
