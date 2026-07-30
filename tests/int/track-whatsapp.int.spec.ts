import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mensagemWhatsApp } from '@/components/analytics/LeadClickTracker'

/**
 * Beacon `/api/track/whatsapp`. O ponto crítico é que o `gclid` sai do cookie
 * de 1ª parte no SERVIDOR — nunca do corpo do pedido, que é público e não
 * confiável. E que a rota nunca atrapalhe o clique: 204 mesmo se o banco cair.
 */

const queryMock = vi.fn()
const cookieGet = vi.fn()

vi.mock('@/lib/db', () => ({ query: (...args: unknown[]) => queryMock(...args) }))
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: (name: string) => cookieGet(name) }),
}))

const { POST } = await import('@/app/api/track/whatsapp/route')

function req(body: unknown, origin = 'https://www.semog.com.br'): Request {
  const headers = new Headers({ 'content-type': 'application/json' })
  if (origin) headers.set('origin', origin)
  return new Request('https://www.semog.com.br/api/track/whatsapp', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

/** Cookie `semog-attrib` como o AttributionTracker grava (JSON URI-encoded). */
function attribCookie(attr: unknown) {
  return { value: encodeURIComponent(JSON.stringify(attr)) }
}

describe('POST /api/track/whatsapp', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    queryMock.mockResolvedValue({ rows: [] })
    cookieGet.mockReturnValue(undefined)
  })

  afterEach(() => vi.restoreAllMocks())

  it('grava o clique com o gclid lido do cookie (first-touch)', async () => {
    cookieGet.mockReturnValue(
      attribCookie({ first: { gclid: 'gclid-do-cookie' }, last: { gclid: 'gclid-last' } }),
    )

    const res = await POST(
      req({ page: '/administradora-de-condominios-recife', section: 'conteudo' }),
    )

    expect(res.status).toBe(204)
    expect(queryMock).toHaveBeenCalledTimes(1)
    const [sql, params] = queryMock.mock.calls[0] as [string, unknown[]]
    expect(sql).toMatch(/insert into cms\.whatsapp_clicks/i)
    expect(params).toEqual(['gclid-do-cookie', '/administradora-de-condominios-recife', 'conteudo'])
  })

  it('cai no last-touch quando o first não tem gclid', async () => {
    cookieGet.mockReturnValue(attribCookie({ first: {}, last: { gclid: 'so-no-last' } }))
    await POST(req({ page: '/', section: 'botao_flutuante' }))
    const [, params] = queryMock.mock.calls[0] as [string, unknown[]]
    expect(params[0]).toBe('so-no-last')
  })

  it('IGNORA gclid mandado no corpo — só o cookie vale', async () => {
    cookieGet.mockReturnValue(undefined)
    await POST(req({ page: '/', section: 'conteudo', gclid: 'gclid-forjado-pelo-cliente' }))

    const [, params] = queryMock.mock.calls[0] as [string, unknown[]]
    expect(params[0]).toBeNull()
    expect(JSON.stringify(params)).not.toContain('gclid-forjado-pelo-cliente')
  })

  it('grava clique orgânico (sem gclid) — serve pra contar o canal', async () => {
    await POST(req({ page: '/garante', section: 'rodape' }))
    const [, params] = queryMock.mock.calls[0] as [string, unknown[]]
    expect(params).toEqual([null, '/garante', 'rodape'])
  })

  it('sanea a página (tira query/hash) e recusa seção inventada', async () => {
    await POST(req({ page: '/proposta?utm_source=x#form', section: 'seção-inventada' }))
    const [, params] = queryMock.mock.calls[0] as [string, unknown[]]
    expect(params[1]).toBe('/proposta')
    expect(params[2]).toBeNull()
  })

  it('recusa página que não é caminho relativo (nada de URL externa)', async () => {
    await POST(req({ page: 'https://evil.example/x', section: 'conteudo' }))
    const [, params] = queryMock.mock.calls[0] as [string, unknown[]]
    expect(params[1]).toBeNull()
  })

  it('403 pra origin de fora do domínio', async () => {
    const res = await POST(req({ page: '/' }, 'https://evil.example'))
    expect(res.status).toBe(403)
    expect(queryMock).not.toHaveBeenCalled()
  })

  it('aceita subdomínio de semog.com.br', async () => {
    const res = await POST(req({ page: '/' }, 'https://semog.com.br'))
    expect(res.status).toBe(204)
  })

  it('204 mesmo se o banco falhar — medição nunca quebra o clique', async () => {
    queryMock.mockRejectedValue(new Error('banco fora'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await POST(req({ page: '/', section: 'conteudo' }))
    expect(res.status).toBe(204)
  })
})

describe('mensagemWhatsApp', () => {
  it('nomeia a cidade quando o clique vem de uma landing de cidade', () => {
    expect(mensagemWhatsApp('/administradora-de-condominios-recife')).toContain('em Recife.')
    expect(mensagemWhatsApp('/administradora-de-condominios-joao-pessoa')).toContain(
      'em João Pessoa.',
    )
    expect(mensagemWhatsApp('/administradora-de-condominios-belem')).toContain('em Belém.')
    expect(mensagemWhatsApp('/administradora-de-condominios-campina-grande')).toContain(
      'em Campina Grande.',
    )
  })

  it('cai na mensagem genérica fora das landings, sem citar cidade errada', () => {
    const msg = mensagemWhatsApp('/garante')
    expect(msg).toContain('do meu condomínio.')
    expect(msg).not.toMatch(/Recife|João Pessoa|Belém|Campina/)
  })

  it('tolera barra no fim (o pathname pode vir normalizado ou não)', () => {
    expect(mensagemWhatsApp('/administradora-de-condominios-recife/')).toContain('em Recife.')
  })
})
