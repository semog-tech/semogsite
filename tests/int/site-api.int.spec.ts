import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SiteApiErro } from '@/lib/siteApi'

/**
 * Cliente da Data API (`src/lib/siteApi.ts`). O que estes testes defendem:
 *
 * - o token do KMS é reaproveitado e só trocado perto do vencimento — assinar
 *   a cada clique custaria uma ida ao KMS por requisição;
 * - o vencimento que manda é o `exp` gravado pelo KMS, quando for mais curto
 *   que o pedido (a política do emissor pode encurtar);
 * - toda falha vira `SiteApiErro` tipado, e o token nunca entra na mensagem.
 */

vi.mock('server-only', () => ({}))

const signMock = vi.fn()
vi.mock('@vercel/kms', () => ({ signJWT: (...args: unknown[]) => signMock(...args) }))

const fetchMock = vi.fn()

const AGORA = Date.parse('2026-10-30T12:00:00Z')

/** JWT com a forma real (três partes base64url); a assinatura não é conferida aqui. */
function jwt(expEmS: number, marca: string): string {
  const parte = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')
  return `${parte({ alg: 'RS256' })}.${parte({ exp: expEmS, marca })}.assinatura-${marca}`
}

const TOKEN_A = jwt(AGORA / 1000 + 300, 'a')
const TOKEN_B = jwt(AGORA / 1000 + 600, 'b')

function resposta(status: number, corpo = ''): Response {
  return new Response(corpo || null, { status })
}

/** Módulo novo a cada teste: o cache do token vive no escopo do módulo. */
async function cliente() {
  vi.resetModules()
  return import('@/lib/siteApi')
}

const CLIQUE = {
  p_gclid: 'gclid-1',
  p_page: '/garante',
  p_section: 'rodape',
  p_ads_consent: 'granted',
} as const

async function erroDe(promessa: Promise<unknown>): Promise<SiteApiErro> {
  try {
    await promessa
  } catch (err) {
    return err as SiteApiErro // as: o teste confere o tipo logo abaixo, com `name`
  }
  throw new Error('a chamada deveria ter falhado')
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(AGORA)
  signMock.mockReset()
  signMock.mockResolvedValueOnce({ token: TOKEN_A }).mockResolvedValueOnce({ token: TOKEN_B })
  fetchMock.mockReset()
  fetchMock.mockImplementation(async () => resposta(204))
  vi.stubGlobal('fetch', fetchMock)
  vi.stubEnv('SUPABASE_URL', 'https://projeto.supabase.co/')
  vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_teste')
  vi.stubEnv('KMS_SITE_API_ISSUER_ID', 'emissor-teste')
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

/** O `Authorization` que a chamada de índice `i` mandou. */
function bearerDa(i: number): string | undefined {
  const init = fetchMock.mock.calls[i]?.[1] as RequestInit | undefined // as: segundo argumento do fetch
  return new Headers(init?.headers).get('authorization') ?? undefined
}

describe('chamarRpc — pedido', () => {
  it('chama a RPC no schema site_api, com a chave publishable e o token do KMS', async () => {
    const { chamarRpc } = await cliente()
    const resultado = await chamarRpc('whatsapp_clique_inserir', CLIQUE)

    expect(resultado).toBeNull()
    expect(signMock).toHaveBeenCalledWith({
      issuerId: 'emissor-teste',
      claims: { sub: 'semogsite' },
      ttl: 300,
    })
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://projeto.supabase.co/rest/v1/rpc/whatsapp_clique_inserir')
    expect(init.method).toBe('POST')
    const headers = new Headers(init.headers)
    expect(headers.get('apikey')).toBe('sb_publishable_teste')
    expect(headers.get('authorization')).toBe(`Bearer ${TOKEN_A}`)
    expect(headers.get('content-profile')).toBe('site_api')
    expect(JSON.parse(String(init.body))).toEqual(CLIQUE)
  })

  it('devolve o JSON quando a função retorna algo', async () => {
    fetchMock.mockImplementation(async () => resposta(200, '{"id":7}'))
    const { chamarRpc } = await cliente()
    expect(await chamarRpc('whatsapp_clique_inserir', CLIQUE)).toEqual({ id: 7 })
  })
})

describe('chamarRpc — token OIDC explícito', () => {
  it('repassa ao signJWT o token OIDC capturado na requisição', async () => {
    const { chamarRpc } = await cliente()
    await chamarRpc('whatsapp_clique_inserir', CLIQUE, 'oidc-da-requisicao')

    expect(signMock).toHaveBeenCalledWith(expect.objectContaining({ token: 'oidc-da-requisicao' }))
  })

  it('sem token OIDC, não manda a opção — o signJWT faz a busca de sempre', async () => {
    const { chamarRpc } = await cliente()
    await chamarRpc('whatsapp_clique_inserir', CLIQUE)

    expect(signMock.mock.calls[0]?.[0]).not.toHaveProperty('token')
  })

  it('com o cache válido, o token OIDC nem é usado', async () => {
    const { chamarRpc } = await cliente()
    await chamarRpc('whatsapp_clique_inserir', CLIQUE, 'oidc-1')
    await chamarRpc('whatsapp_clique_inserir', CLIQUE, 'oidc-2')

    expect(signMock).toHaveBeenCalledTimes(1)
  })

  it('oidcDaRequisicao lê o cabeçalho, e vazio vira undefined', async () => {
    const { oidcDaRequisicao } = await cliente()
    expect(oidcDaRequisicao(new Headers({ 'x-vercel-oidc-token': 'abc' }))).toBe('abc')
    expect(oidcDaRequisicao(new Headers({ 'x-vercel-oidc-token': '' }))).toBeUndefined()
    expect(oidcDaRequisicao(new Headers())).toBeUndefined()
  })
})

describe('chamarRpc — cache do token', () => {
  it('reaproveita o token entre chamadas', async () => {
    const { chamarRpc } = await cliente()
    await chamarRpc('whatsapp_clique_inserir', CLIQUE)
    await chamarRpc('whatsapp_clique_inserir', CLIQUE)

    expect(signMock).toHaveBeenCalledTimes(1)
    expect(bearerDa(1)).toBe(`Bearer ${TOKEN_A}`)
  })

  it('chamadas simultâneas esperam a mesma assinatura', async () => {
    const { chamarRpc } = await cliente()
    await Promise.all([
      chamarRpc('whatsapp_clique_inserir', CLIQUE),
      chamarRpc('whatsapp_clique_inserir', CLIQUE),
      chamarRpc('whatsapp_clique_inserir', CLIQUE),
    ])
    expect(signMock).toHaveBeenCalledTimes(1)
  })

  it('com 61 s de vida ainda usa o mesmo; com 59 s, assina outro', async () => {
    const { chamarRpc } = await cliente()
    await chamarRpc('whatsapp_clique_inserir', CLIQUE)

    vi.setSystemTime(AGORA + 239_000)
    await chamarRpc('whatsapp_clique_inserir', CLIQUE)
    expect(signMock).toHaveBeenCalledTimes(1)

    vi.setSystemTime(AGORA + 241_000)
    await chamarRpc('whatsapp_clique_inserir', CLIQUE)
    expect(signMock).toHaveBeenCalledTimes(2)
    expect(bearerDa(2)).toBe(`Bearer ${TOKEN_B}`)
  })

  it('obedece o exp do KMS quando ele é mais curto que o TTL pedido', async () => {
    signMock.mockReset()
    signMock
      .mockResolvedValueOnce({ token: jwt(AGORA / 1000 + 90, 'curto') })
      .mockResolvedValueOnce({ token: TOKEN_B })
    const { chamarRpc } = await cliente()
    await chamarRpc('whatsapp_clique_inserir', CLIQUE)

    vi.setSystemTime(AGORA + 31_000)
    await chamarRpc('whatsapp_clique_inserir', CLIQUE)
    expect(signMock).toHaveBeenCalledTimes(2)
  })

  it('401 descarta o token; o pedido seguinte assina outro', async () => {
    fetchMock.mockImplementationOnce(async () => resposta(401, '{"code":"PGRST303"}'))
    const { chamarRpc } = await cliente()
    await erroDe(chamarRpc('whatsapp_clique_inserir', CLIQUE))
    await chamarRpc('whatsapp_clique_inserir', CLIQUE)

    expect(signMock).toHaveBeenCalledTimes(2)
    expect(bearerDa(1)).toBe(`Bearer ${TOKEN_B}`)
  })

  it('403 não descarta o token: o papel não muda trocando o token', async () => {
    fetchMock.mockImplementationOnce(async () => resposta(403, '{"code":"42501"}'))
    const { chamarRpc } = await cliente()
    await erroDe(chamarRpc('whatsapp_clique_inserir', CLIQUE))
    await chamarRpc('whatsapp_clique_inserir', CLIQUE)

    expect(signMock).toHaveBeenCalledTimes(1)
  })
})

describe('chamarRpc — erros', () => {
  it.each([
    [401, '{"code":"PGRST303","message":"JWT expired"}', 'PGRST303'],
    [403, '{"code":"42501","message":"permission denied for function x"}', '42501'],
    [500, '<html>bad gateway</html>', null],
  ])('HTTP %i vira SiteApiErro com status e código, sem o token', async (status, corpo, codigo) => {
    fetchMock.mockImplementation(async () => resposta(status, corpo))
    const { chamarRpc } = await cliente()
    const erro = await erroDe(chamarRpc('whatsapp_clique_inserir', CLIQUE))

    expect(erro.name).toBe('SiteApiErro')
    expect(erro.motivo).toBe('http')
    expect(erro.status).toBe(status)
    expect(erro.codigo).toBe(codigo)
    expect(erro.message).toContain(`HTTP ${status}`)
    expect(erro.message).not.toContain(TOKEN_A)
    expect(erro.message).not.toContain('assinatura-a')
  })

  it('RPC sem resposta em 8 s vira erro de prazo e aborta o fetch', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(AGORA)
    let sinal: AbortSignal | undefined
    fetchMock.mockImplementation((_url: string, init: RequestInit) => {
      sinal = init.signal ?? undefined
      return new Promise<Response>(() => {})
    })
    const { chamarRpc } = await cliente()
    const promessa = erroDe(chamarRpc('whatsapp_clique_inserir', CLIQUE))

    await vi.advanceTimersByTimeAsync(7_999)
    expect(sinal?.aborted).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    const erro = await promessa

    expect(erro.motivo).toBe('prazo')
    expect(sinal?.aborted).toBe(true)
    expect(erro.message).not.toContain(TOKEN_A)
  })

  it('KMS sem resposta em 5 s vira erro de prazo, sem chamar a RPC', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(AGORA)
    signMock.mockReset()
    signMock.mockReturnValue(new Promise(() => {}))
    const { chamarRpc } = await cliente()
    const promessa = erroDe(chamarRpc('whatsapp_clique_inserir', CLIQUE))

    await vi.advanceTimersByTimeAsync(5_000)
    const erro = await promessa
    expect(erro.motivo).toBe('prazo')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('KMS recusando vira motivo token, e a próxima chamada tenta de novo', async () => {
    signMock.mockReset()
    signMock
      .mockRejectedValueOnce(new Error('issuer_not_found'))
      .mockResolvedValueOnce({ token: TOKEN_A })
    const { chamarRpc } = await cliente()
    const erro = await erroDe(chamarRpc('whatsapp_clique_inserir', CLIQUE))

    expect(erro.motivo).toBe('token')
    expect(fetchMock).not.toHaveBeenCalled()
    await chamarRpc('whatsapp_clique_inserir', CLIQUE)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('falha de rede vira motivo rede, sem o token', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'))
    const { chamarRpc } = await cliente()
    const erro = await erroDe(chamarRpc('whatsapp_clique_inserir', CLIQUE))

    expect(erro.motivo).toBe('rede')
    expect(erro.message).not.toContain(TOKEN_A)
  })

  it('sem as variáveis de ambiente, recusa antes de chamar KMS ou rede', async () => {
    vi.stubEnv('KMS_SITE_API_ISSUER_ID', '')
    const { chamarRpc } = await cliente()
    const erro = await erroDe(chamarRpc('whatsapp_clique_inserir', CLIQUE))

    expect(erro.motivo).toBe('configuracao')
    expect(signMock).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('recusa SUPABASE_URL sem https', async () => {
    vi.stubEnv('SUPABASE_URL', 'http://projeto.supabase.co')
    const { chamarRpc } = await cliente()
    expect((await erroDe(chamarRpc('whatsapp_clique_inserir', CLIQUE))).motivo).toBe('configuracao')
  })
})

describe('siteApiAtivo', () => {
  it.each([
    ['true', true],
    ['1', false],
    ['TRUE', false],
    ['', false],
  ])('SITE_API_ATIVO=%j → %s', async (valor, esperado) => {
    vi.stubEnv('SITE_API_ATIVO', valor)
    const { siteApiAtivo } = await cliente()
    expect(siteApiAtivo()).toBe(esperado)
  })
})
