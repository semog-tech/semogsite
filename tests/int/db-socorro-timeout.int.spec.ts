import { createServer, type Server, type Socket } from 'node:net'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * O socorro do lead não gravado só serve se a falha do banco CHEGAR a tempo.
 * Achado de verificação: com um backend que aceita a conexão e não responde, o
 * `connect` do `pg` pendurava por mais de 20s — sem teto, até o limite da
 * função na Vercel, que mata a Server Action sem e-mail nem Sentry.
 *
 * Aqui o `@/lib/db` é o de verdade, contra dois servidores TCP locais que
 * imitam os dois jeitos de um backend ficar mudo:
 * - aceita o TCP e nunca responde (preso antes de a conexão ficar pronta) —
 *   quem corta é o `connectionTimeoutMillis`;
 * - completa a autenticação e emudece (preso numa consulta) — quem corta é o
 *   `query_timeout`, inclusive dentro da transação do Experience.
 *
 * Os dois tempos são os de produção (8s e 12s), então estes testes demoram.
 */

const sendMailMock = vi.fn()
const captureExceptionMock = vi.fn()

vi.mock('server-only', () => ({}))
vi.mock('@sentry/nextjs', () => ({
  captureException: (...args: unknown[]) => captureExceptionMock(...args),
  flush: async () => true,
}))
vi.mock('@/lib/sendgrid', () => ({ sendMail: (...args: unknown[]) => sendMailMock(...args) }))
vi.mock('@/lib/turnstile', () => ({ verifyTurnstile: async () => true }))
vi.mock('@/lib/exact/push-lead', () => ({ pushLeadToExact: async () => null }))
vi.mock('@/lib/rate-limit', () => ({ rateLimit: () => ({ ok: true }) }))
vi.mock('next/headers', () => ({
  headers: async () => ({ get: () => null }),
  cookies: async () => ({ get: () => undefined }),
}))

const sockets = new Set<Socket>()
const servidores: Server[] = []
const pools: { end: () => Promise<void> }[] = []

/** Sobe um servidor em porta livre; `aoConectar` decide o quanto ele "fala". */
async function subirServidor(aoConectar: (socket: Socket) => void): Promise<number> {
  const servidor = createServer((socket) => {
    sockets.add(socket)
    socket.on('error', () => {})
    aoConectar(socket)
  })
  servidores.push(servidor)
  await new Promise<void>((resolve) => servidor.listen(0, '127.0.0.1', resolve))
  const endereco = servidor.address()
  if (typeof endereco !== 'object' || endereco === null) throw new Error('servidor sem porta')
  return endereco.port
}

/** Mensagem do protocolo do Postgres: tipo (1 byte) + tamanho (int32) + corpo. */
function mensagem(tipo: string, corpo: Buffer): Buffer {
  const cabecalho = Buffer.alloc(5)
  cabecalho.write(tipo, 0, 'latin1')
  cabecalho.writeInt32BE(corpo.length + 4, 1)
  return Buffer.concat([cabecalho, corpo])
}

/**
 * Responde à mensagem de inicialização com AuthenticationOk + ReadyForQuery e
 * depois não diz mais nada: a conexão fica pronta e toda consulta pendura.
 */
function autenticaEEmudece(socket: Socket) {
  socket.once('data', () => {
    const authOk = mensagem('R', Buffer.from([0, 0, 0, 0]))
    const pronto = mensagem('Z', Buffer.from('I', 'latin1'))
    socket.write(Buffer.concat([authOk, pronto]))
  })
}

/** `submitForm` lendo o `@/lib/db` real apontado para esta porta. */
async function submitFormContra(porta: number) {
  vi.resetModules()
  delete (globalThis as { __cmsLeadsPool?: unknown }).__cmsLeadsPool
  vi.stubEnv('DATABASE_URI', `postgresql://cms_user:x@127.0.0.1:${porta}/postgres`)
  const db = await import('@/lib/db')
  pools.push(db.pool)
  const { submitForm } = await import('@/app/(frontend)/_actions/submit-form')
  return submitForm
}

async function cronometrar<T>(fn: () => Promise<T>): Promise<{ valor: T; ms: number }> {
  const inicio = performance.now()
  const valor = await fn()
  return { valor, ms: performance.now() - inicio }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'info').mockImplementation(() => {})
  sendMailMock.mockResolvedValue({ ok: true })
  process.env.CONTACT_TO = 'caixa-do-contato@example.com'
})

afterAll(async () => {
  for (const socket of sockets) socket.destroy()
  await Promise.all(pools.map((pool) => pool.end().catch(() => {})))
  await Promise.all(servidores.map((s) => new Promise((resolve) => s.close(resolve))))
  vi.unstubAllEnvs()
})

describe('banco mudo — o socorro sai dentro do prazo', () => {
  it('aceita o TCP e não responde: o connect corta em ~8s e o e-mail de socorro sai', async () => {
    const porta = await subirServidor(() => {})
    const submitForm = await submitFormContra(porta)

    const { valor, ms } = await cronometrar(() =>
      submitForm(
        'contato',
        { nome: 'Fulano de Tal', email: 'fulano@example.com', mensagem: 'Mensagem de teste.' },
        'token',
      ),
    )

    expect(valor.ok).toBe(true)
    expect(captureExceptionMock).toHaveBeenCalledTimes(1)
    const [{ subject }] = sendMailMock.mock.calls[0] as [{ subject: string }]
    expect(subject).toMatch(/^\[GRAVAÇÃO NÃO CONFIRMADA/)
    // Quem cortou foi o teto de conexão, não outra coisa: nem antes, nem bem depois.
    expect(ms).toBeGreaterThan(7_500)
    expect(ms).toBeLessThan(11_000)
  }, 20_000)

  it('conecta e emudece na transação do Experience: corta em ~12s, sem esperar o rollback', async () => {
    const porta = await subirServidor(autenticaEEmudece)
    const submitForm = await submitFormContra(porta)

    const { valor, ms } = await cronometrar(() =>
      submitForm(
        'experience',
        {
          nome: 'Ana Lima',
          email: 'ana@example.com',
          telefone: '+5583999501388',
          condominio: 'Residencial Cabo Branco',
          aceiteImagem: true,
        },
        'token',
      ),
    )

    expect(valor.vagaAConfirmar).toBe(true)
    expect(captureExceptionMock).toHaveBeenCalledTimes(1)
    const [erro] = captureExceptionMock.mock.calls[0] as [Error]
    expect(erro.message).toBe('Query read timeout')
    expect(sendMailMock).toHaveBeenCalledTimes(1)
    // Um teto de consulta (12s) e não dois: o rollback não foi tentado.
    expect(ms).toBeGreaterThan(11_500)
    expect(ms).toBeLessThan(16_000)
  }, 30_000)
})
