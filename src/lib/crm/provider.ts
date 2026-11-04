import 'server-only'

export type CrmProvider = 'exact' | 'rdstation'

/** Ausência mantém Exact; erro de digitação falha fechado, nunca escolhe outro CRM. */
export function crmProvider(): CrmProvider {
  const provider = process.env.CRM_PROVIDER ?? 'exact'
  if (provider === 'exact' || provider === 'rdstation') return provider
  throw new Error('CRM_PROVIDER inválido: use exact ou rdstation')
}
