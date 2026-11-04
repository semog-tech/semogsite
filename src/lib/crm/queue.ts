import type { CrmProvider } from './provider'

export const ESPERA_CONCILIACAO_MS = 30 * 60_000
export const MAX_TENTATIVAS_CRM = 5
export const LOTE_CRM = 25
export const LEASE_CRM_MS = 5 * 60_000

export type EstadoFila = {
  crm_provider: CrmProvider | null
  crm_status: string
  crm_deal_id: string | null
  exact_lead_id: string | null
  crm_attempts: number
  exact_attempts: number
  created_at: Date | string
  crm_travado_ate: Date | string | null
  crm_reconciliar_em: Date | string | null
  crm_proxima_tentativa_em: Date | string
}

/** Espelha o predicado SQL e também protege o consumidor contra resultado obsoleto. */
export function podeProcessarFila(
  estado: EstadoFila,
  provider: CrmProvider,
  agora = Date.now(),
): boolean {
  if (['duplicado', 'esgotado'].includes(estado.crm_status)) return false
  if (estado.crm_provider && estado.crm_provider !== provider) return false
  if (estado.crm_travado_ate && new Date(estado.crm_travado_ate).getTime() >= agora) return false
  if (new Date(estado.crm_proxima_tentativa_em).getTime() > agora) return false
  const conciliar =
    provider === 'rdstation' &&
    estado.crm_reconciliar_em !== null &&
    new Date(estado.crm_reconciliar_em).getTime() <= agora
  if (conciliar) return true
  return (
    !estado.crm_deal_id &&
    !estado.exact_lead_id &&
    estado.crm_attempts < MAX_TENTATIVAS_CRM &&
    (provider !== 'exact' || estado.exact_attempts < MAX_TENTATIVAS_CRM) &&
    new Date(estado.created_at).getTime() > agora - 48 * 3600_000
  )
}

/** Só aceita posições internas fixas; nenhuma parte do SQL vem do visitante. */
export function predicadoFila(provider: '$1' | '$2', teto: '$2' | '$3'): string {
  const conciliar = `(${provider} = 'rdstation' and crm_reconciliar_em <= now())`
  return `crm_status not in ('duplicado', 'esgotado')
    and (crm_provider is null or crm_provider = ${provider})
    and (crm_travado_ate is null or crm_travado_ate < now())
    and crm_proxima_tentativa_em <= now()
    and (${conciliar} or (
      crm_deal_id is null and exact_lead_id is null
      and crm_attempts < ${teto}
      and (${provider} <> 'exact' or exact_attempts < ${teto})
      and created_at > now() - interval '48 hours'))`
}

export function deveRecriar(postIniciadoEm: Date | null | undefined, agora = Date.now()): boolean {
  return (
    Boolean(postIniciadoEm) &&
    agora - new Date(postIniciadoEm ?? 0).getTime() >= ESPERA_CONCILIACAO_MS
  )
}

export function backoffCrm(tentativas: number): number {
  return Math.min(24 * 60, 15 * 4 ** Math.max(0, tentativas - 1)) * 60_000
}
