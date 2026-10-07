import { createHmac } from 'node:crypto'

/**
 * Assinatura dos pedidos ao semogapp: `HMAC-SHA256(segredo, "<ts>.<corpo cru>")`
 * em hex, com `ts` em segundos Unix. O app confere o mesmo esquema
 * (`agentBotAssinatura.ts`), então o corpo assinado precisa ser exatamente a
 * string enviada.
 */
export function assinarPedido(
  segredo: string,
  corpo: string,
  agoraSegundos: number,
): { 'X-Semog-Timestamp': string; 'X-Semog-Assinatura': string } {
  const timestamp = String(agoraSegundos)
  const hex = createHmac('sha256', segredo).update(`${timestamp}.${corpo}`).digest('hex')
  return { 'X-Semog-Timestamp': timestamp, 'X-Semog-Assinatura': `sha256=${hex}` }
}
