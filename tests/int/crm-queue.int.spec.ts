import { describe, expect, it } from 'vitest'
import { backoffCrm, type EstadoFila, podeProcessarFila, predicadoFila } from '@/lib/crm/queue'

const agora = new Date('2026-11-04T12:00:00Z').getTime()
const data = (offset: number) => new Date(agora + offset)
const pendente: EstadoFila = {
  crm_provider: null,
  crm_status: 'pendente',
  crm_deal_id: null,
  exact_lead_id: null,
  crm_attempts: 0,
  exact_attempts: 0,
  created_at: data(-3600_000),
  crm_travado_ate: null,
  crm_reconciliar_em: null,
  crm_proxima_tentativa_em: data(-1000),
}

describe('decisão pura usada pelo consumidor da fila e predicado compartilhado', () => {
  it.each([4, 5])('teto de tentativas (%d)', (crm_attempts) => {
    expect(podeProcessarFila({ ...pendente, crm_attempts }, 'rdstation', agora)).toBe(
      crm_attempts < 5,
    )
  })
  it('teto histórico do Exact é respeitado, sem bloquear RD', () => {
    expect(podeProcessarFila({ ...pendente, exact_attempts: 5 }, 'exact', agora)).toBe(false)
    expect(podeProcessarFila({ ...pendente, exact_attempts: 5 }, 'rdstation', agora)).toBe(true)
  })
  it.each([-1, 0, 1])('lease relativo a agora (%d ms)', (offset) => {
    expect(
      podeProcessarFila({ ...pendente, crm_travado_ate: data(offset) }, 'rdstation', agora),
    ).toBe(offset < 0)
  })
  it.each([-1, 0, 1])('próxima tentativa relativa a agora (%d ms)', (offset) => {
    expect(
      podeProcessarFila(
        { ...pendente, crm_proxima_tentativa_em: data(offset) },
        'rdstation',
        agora,
      ),
    ).toBe(offset <= 0)
  })
  it('conciliação agendada ignora janela48h, deal salvo e teto, mas respeita lease e provedor', () => {
    const lead = {
      ...pendente,
      crm_deal_id: 'card',
      crm_attempts: 5,
      created_at: data(-49 * 3600_000),
      crm_reconciliar_em: data(-1000),
    }
    expect(podeProcessarFila(lead, 'rdstation', agora)).toBe(true)
    expect(podeProcessarFila(lead, 'exact', agora)).toBe(false)
    expect(podeProcessarFila({ ...lead, crm_provider: 'exact' }, 'rdstation', agora)).toBe(false)
    expect(podeProcessarFila({ ...lead, crm_travado_ate: data(1000) }, 'rdstation', agora)).toBe(
      false,
    )
    expect(podeProcessarFila({ ...lead, crm_reconciliar_em: data(1000) }, 'rdstation', agora)).toBe(
      false,
    )
  })
  it('pendente comum fora48h não é enviado', () => {
    expect(
      podeProcessarFila({ ...pendente, created_at: data(-48 * 3600_000) }, 'rdstation', agora),
    ).toBe(false)
  })
  it('SELECT e reserva compartilham as mesmas decisões de lease, backoff, teto e conciliação', () => {
    const select = predicadoFila('$1', '$2')
    const reserva = predicadoFila('$2', '$3')
    expect(select.replaceAll('$2', '$3').replaceAll('$1', '$2')).toBe(reserva)
    expect(select).toContain('crm_travado_ate < now()')
    expect(select).toContain('crm_proxima_tentativa_em <= now()')
    expect(select).toContain('crm_attempts < $2')
    expect(select).toContain('crm_reconciliar_em <= now()) or (')
  })
  it('backoff impede payload determinístico de ocupar a próxima leva', () => {
    expect([1, 2, 3, 4, 5].map(backoffCrm)).toEqual(
      [15, 60, 240, 960, 1440].map((minutos) => minutos * 60_000),
    )
  })
})

describe('estado terminal não volta à fila', () => {
  it.each([
    'duplicado',
    'esgotado',
  ])('%s exclui inclusive conciliação já agendada', (crm_status) => {
    const estado = { ...pendente, crm_status, crm_reconciliar_em: data(-1000) }
    expect(podeProcessarFila(estado, 'rdstation', agora)).toBe(false)
    expect(podeProcessarFila(estado, 'exact', agora)).toBe(false)
    expect(predicadoFila('$1', '$2')).toContain("crm_status not in ('duplicado', 'esgotado')")
  })
})
