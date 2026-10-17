import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * `sendMail` com prazo: SendGrid pendurado não pode prender a action nem o cron (que tem teto de
 * duração). `@sendgrid/mail` mocado; o `send` nunca responde e o relógio é falso. O `render` do
 * React Email também é mocado: ele agenda trabalho em timer e travaria sob o relógio falso.
 */

const sendMock = vi.fn()
const setTimeoutMock = vi.fn()

vi.mock('@react-email/render', () => ({ render: async () => '<p>oi</p>' }))

vi.mock('@sendgrid/mail', () => ({
  default: {
    setApiKey: () => undefined,
    setTimeout: (...a: unknown[]) => setTimeoutMock(...a),
    send: (...a: unknown[]) => sendMock(...a),
  },
}))

const { PRAZO_SENDGRID_MS, sendMail } = await import('@/lib/sendgrid')

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubEnv('SENDGRID_API_KEY', 'SG.chave-de-teste')
  vi.stubEnv('SENDGRID_FROM', 'site@semog.com.br')
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
})

describe('sendMail com prazo', () => {
  it('SendGrid que não responde vira { ok: false } no prazo, sem lançar', async () => {
    sendMock.mockReturnValue(new Promise(() => {}))
    vi.useFakeTimers()
    const envio = sendMail({ to: 'a@semog.com.br', subject: 'x', react: <p>oi</p> })
    await vi.advanceTimersByTimeAsync(PRAZO_SENDGRID_MS + 1)
    const resultado = await envio
    expect(resultado.ok).toBe(false)
    expect(resultado.error).toContain(`passou de ${PRAZO_SENDGRID_MS} ms`)
    expect(setTimeoutMock).toHaveBeenCalledWith(PRAZO_SENDGRID_MS)
  })

  it('SendGrid que responde a tempo segue { ok: true }', async () => {
    sendMock.mockResolvedValue([{ statusCode: 202 }, {}])
    const resultado = await sendMail({ to: 'a@semog.com.br', subject: 'x', react: <p>oi</p> })
    expect(resultado).toEqual({ ok: true })
  })
})
