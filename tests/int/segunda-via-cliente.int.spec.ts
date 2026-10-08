import { createHmac } from 'node:crypto'
import { inspect } from 'node:util'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { assinarPedido } from '@/lib/segundaVia/assinatura'

/** `server-only` lança no jsdom do Vitest — mesma neutralização dos outros specs. */
vi.mock('server-only', () => ({}))

const { chamarSegundaVia } = await import('@/lib/segundaVia/cliente')

const SEGREDO = 's'.repeat(32)
const REF = 'A'.repeat(22)
const TOKEN = 'T'.repeat(43)
const CPF = '52998224725'
const IP = '1.2.3.4'
const URL_ORIGINAL = process.env.SEMOGAPP_API_URL
const SEGREDO_ORIGINAL = process.env.SEMOGAPP_SEGUNDA_VIA_SEGREDO

function resposta(status: number, corpo?: unknown): Response {
  return new Response(corpo === undefined ? null : JSON.stringify(corpo), { status })
}

/**
 * Tudo o que chegou aos espiões do console, como texto. `JSON.stringify`
 * transforma um `Error` em `{}` e esconderia o vazamento justamente no caminho
 * de exceção; aqui o erro entra com nome, mensagem e pilha.
 */
function textoDosLogs(espioes: { mock: { calls: unknown[][] } }[]): string {
  const serializa = (v: unknown): string =>
    v instanceof Error ? `${v.name}: ${v.message} ${v.stack ?? ''}` : inspect(v, { depth: 8 })
  return espioes.flatMap((e) => e.mock.calls.flat().map(serializa)).join('\n')
}

function fetchRetornando(r: Response) {
  return vi.fn<typeof fetch>(async () => r)
}

beforeEach(() => {
  process.env.SEMOGAPP_API_URL = 'https://app.exemplo.test'
  process.env.SEMOGAPP_SEGUNDA_VIA_SEGREDO = SEGREDO
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  if (URL_ORIGINAL === undefined) delete process.env.SEMOGAPP_API_URL
  else process.env.SEMOGAPP_API_URL = URL_ORIGINAL
  if (SEGREDO_ORIGINAL === undefined) delete process.env.SEMOGAPP_SEGUNDA_VIA_SEGREDO
  else process.env.SEMOGAPP_SEGUNDA_VIA_SEGREDO = SEGREDO_ORIGINAL
})

describe('assinarPedido', () => {
  it('assina "<ts>.<corpo cru>" com HMAC-SHA256 hex (vetor fixo calculado com node:crypto)', () => {
    const h = assinarPedido(SEGREDO, '{"a":1}', 1_700_000_000)
    expect(h['X-Semog-Timestamp']).toBe('1700000000')
    expect(h['X-Semog-Assinatura']).toBe(
      'sha256=da54d054c6c42cc9950b89a9afffe7bcdafff0cea3bd354ab40fe78e1e527905',
    )
  })
})

describe('chamarSegundaVia: Review Focus 5 (semogapp lento ou fora)', () => {
  it('timeout de 10 s vira indisponivel e o fetch é chamado UMA vez', async () => {
    const fetchFalso = vi.fn<typeof fetch>(() => new Promise<Response>(() => {}))
    vi.useFakeTimers()
    const p = chamarSegundaVia('solicitar', { cpf: CPF, ipCliente: IP }, { fetch: fetchFalso })
    await vi.advanceTimersByTimeAsync(10_001)
    await expect(p).resolves.toEqual({ tipo: 'indisponivel' })
    expect(fetchFalso).toHaveBeenCalledTimes(1)
  })

  it('não desiste antes dos 10 s', async () => {
    const corpo = { desafio: TOKEN, reenvioEmSegundos: 60 }
    const fetchLento = vi.fn<typeof fetch>(
      () => new Promise<Response>((ok) => setTimeout(() => ok(resposta(202, corpo)), 9_000)),
    )
    vi.useFakeTimers()
    const p = chamarSegundaVia('solicitar', { cpf: CPF, ipCliente: IP }, { fetch: fetchLento })
    await vi.advanceTimersByTimeAsync(9_001)
    await expect(p).resolves.toEqual({ tipo: 'ok', ...corpo })
  })

  it('exceção do fetch (DNS, conexão) vira indisponivel, sem retry', async () => {
    const fetchFalso = vi.fn<typeof fetch>(async () => {
      throw new TypeError('fetch failed')
    })
    await expect(
      chamarSegundaVia('solicitar', { cpf: CPF, ipCliente: IP }, { fetch: fetchFalso }),
    ).resolves.toEqual({ tipo: 'indisponivel' })
    expect(fetchFalso).toHaveBeenCalledTimes(1)
  })

  it('502 do proxy, 500, JSON quebrado e status fora do contrato viram indisponivel', async () => {
    const casos: Response[] = [
      new Response('<html>Bad Gateway</html>', { status: 502 }),
      resposta(500, { erro: 'x' }),
      new Response('{quebrado', { status: 202 }),
      resposta(200, { desafio: TOKEN, reenvioEmSegundos: 60 }), // 200 não é contrato do /solicitar
      resposta(202, { desafio: 'curto', reenvioEmSegundos: 60 }), // ref fora do formato
      resposta(202, { desafio: TOKEN }), // falta campo
    ]
    for (const r of casos) {
      const fetchFalso = fetchRetornando(r)
      await expect(
        chamarSegundaVia('solicitar', { cpf: CPF, ipCliente: IP }, { fetch: fetchFalso }),
      ).resolves.toEqual({ tipo: 'indisponivel' })
    }
  })
})

describe('chamarSegundaVia: requisição', () => {
  it('assina o corpo cru enviado, com nonce UUID v4 e ipCliente; nenhum log contém o CPF', async () => {
    const espioes = (['log', 'info', 'warn', 'error', 'debug'] as const).map((m) =>
      vi.spyOn(console, m).mockImplementation(() => {}),
    )
    const fetchFalso = fetchRetornando(resposta(202, { desafio: TOKEN, reenvioEmSegundos: 60 }))
    await chamarSegundaVia(
      'solicitar',
      { cpf: CPF, ipCliente: IP },
      { fetch: fetchFalso, agora: () => 1_700_000_000 },
    )

    const [url, init] = fetchFalso.mock.calls[0]
    expect(url).toBe('https://app.exemplo.test/publico/segunda-via/solicitar')
    expect(init?.method).toBe('POST')
    const corpoEnviado = String(init?.body)
    const json = JSON.parse(corpoEnviado) as Record<string, unknown>
    expect(json.cpf).toBe(CPF)
    expect(json.ipCliente).toBe(IP)
    expect(json.nonce).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    )

    const h = new Headers(init?.headers)
    const esperado = createHmac('sha256', SEGREDO)
      .update(`1700000000.${corpoEnviado}`)
      .digest('hex')
    expect(h.get('X-Semog-Timestamp')).toBe('1700000000')
    expect(h.get('X-Semog-Assinatura')).toBe(`sha256=${esperado}`)
    expect(h.get('Content-Type')).toBe('application/json')

    expect(textoDosLogs(espioes)).not.toContain(CPF)
  })

  it('cada chamada leva um nonce diferente', async () => {
    const fetchFalso = vi.fn<typeof fetch>(async () => resposta(204))
    await chamarSegundaVia('encerrar', { sessao: TOKEN }, { fetch: fetchFalso })
    await chamarSegundaVia('encerrar', { sessao: TOKEN }, { fetch: fetchFalso })
    const nonces = fetchFalso.mock.calls.map(
      (c) => (JSON.parse(String(c[1]?.body)) as { nonce: string }).nonce,
    )
    expect(new Set(nonces).size).toBe(2)
  })

  it('não segue redirecionamento (o corpo assinado não pode ir parar em outro lugar)', async () => {
    const fetchFalso = fetchRetornando(resposta(202, { desafio: TOKEN, reenvioEmSegundos: 60 }))
    await chamarSegundaVia('solicitar', { cpf: CPF, ipCliente: IP }, { fetch: fetchFalso })
    expect(fetchFalso.mock.calls[0][1]?.redirect).toBe('error')
  })
})

describe('chamarSegundaVia: configuração', () => {
  it.each([
    ['sem SEMOGAPP_API_URL', () => delete process.env.SEMOGAPP_API_URL],
    ['sem segredo', () => delete process.env.SEMOGAPP_SEGUNDA_VIA_SEGREDO],
    [
      'segredo com menos de 32 bytes',
      () => (process.env.SEMOGAPP_SEGUNDA_VIA_SEGREDO = 's'.repeat(31)),
    ],
    ['URL inválida', () => (process.env.SEMOGAPP_API_URL = 'isto não é url')],
    [
      'URL http fora de localhost',
      () => (process.env.SEMOGAPP_API_URL = 'http://app.exemplo.test'),
    ],
  ])('%s: indisponivel sem chamar fetch', async (_nome, ajusta) => {
    ajusta()
    const fetchFalso = vi.fn<typeof fetch>()
    await expect(
      chamarSegundaVia('solicitar', { cpf: CPF, ipCliente: IP }, { fetch: fetchFalso }),
    ).resolves.toEqual({ tipo: 'indisponivel' })
    expect(fetchFalso).not.toHaveBeenCalled()
  })

  it('aceita http em localhost (desenvolvimento)', async () => {
    process.env.SEMOGAPP_API_URL = 'http://localhost:3001'
    const fetchFalso = fetchRetornando(resposta(204))
    await expect(
      chamarSegundaVia('encerrar', { sessao: TOKEN }, { fetch: fetchFalso }),
    ).resolves.toEqual({ tipo: 'ok' })
  })
})

describe('chamarSegundaVia: 401 de assinatura', () => {
  it('loga a falha sem corpo e devolve indisponivel', async () => {
    const erro = vi.spyOn(console, 'error').mockImplementation(() => {})
    const fetchFalso = fetchRetornando(resposta(401, { erro: 'assinatura' }))
    await expect(
      chamarSegundaVia('solicitar', { cpf: CPF, ipCliente: IP }, { fetch: fetchFalso }),
    ).resolves.toEqual({ tipo: 'indisponivel' })
    expect(erro).toHaveBeenCalledTimes(1)
    expect(erro).toHaveBeenCalledWith('Falha de assinatura com o semogapp')
  })
})

describe('chamarSegundaVia: mapeamento por rota', () => {
  it('solicitar: 202 ok, 400 entrada_invalida, 429 limite, 503 indisponivel', async () => {
    const c = { cpf: CPF, ipCliente: IP }
    const ok = { desafio: TOKEN, reenvioEmSegundos: 60 }
    await expect(
      chamarSegundaVia('solicitar', c, { fetch: fetchRetornando(resposta(202, ok)) }),
    ).resolves.toEqual({ tipo: 'ok', ...ok })
    await expect(
      chamarSegundaVia('solicitar', c, {
        fetch: fetchRetornando(resposta(400, { erro: 'entrada_invalida' })),
      }),
    ).resolves.toEqual({ tipo: 'entrada_invalida' })
    await expect(
      chamarSegundaVia('solicitar', c, {
        fetch: fetchRetornando(resposta(429, { erro: 'limite', tentarEmSegundos: 90 })),
      }),
    ).resolves.toEqual({ tipo: 'limite', tentarEmSegundos: 90 })
    await expect(
      chamarSegundaVia('solicitar', c, {
        fetch: fetchRetornando(resposta(503, { erro: 'indisponivel' })),
      }),
    ).resolves.toEqual({ tipo: 'indisponivel' })
  })

  it('reenviar: 202 ok, 410 expirado, 429 limite', async () => {
    const c = { desafio: TOKEN, ipCliente: IP }
    await expect(
      chamarSegundaVia('reenviar', c, {
        fetch: fetchRetornando(resposta(202, { reenvioEmSegundos: 60 })),
      }),
    ).resolves.toEqual({ tipo: 'ok', reenvioEmSegundos: 60 })
    await expect(
      chamarSegundaVia('reenviar', c, {
        fetch: fetchRetornando(resposta(410, { erro: 'desafio_expirado' })),
      }),
    ).resolves.toEqual({ tipo: 'expirado' })
    await expect(
      chamarSegundaVia('reenviar', c, {
        fetch: fetchRetornando(resposta(429, { erro: 'limite', tentarEmSegundos: 30 })),
      }),
    ).resolves.toEqual({ tipo: 'limite', tentarEmSegundos: 30 })
  })

  it('confirmar: ok com unidades, incorreto, expirado, bloqueado, limite', async () => {
    const c = { desafio: TOKEN, codigo: '123456', ipCliente: IP }
    const unidades = [{ ref: REF, condominio: 'Edifício Sol', unidade: 'Apto 302' }]
    await expect(
      chamarSegundaVia('confirmar', c, {
        fetch: fetchRetornando(resposta(200, { sessao: TOKEN, expiraEmSegundos: 900, unidades })),
      }),
    ).resolves.toEqual({ tipo: 'ok', sessao: TOKEN, expiraEmSegundos: 900, unidades })
    await expect(
      chamarSegundaVia('confirmar', c, {
        fetch: fetchRetornando(resposta(401, { erro: 'incorreto', tentativasRestantes: 2 })),
      }),
    ).resolves.toEqual({ tipo: 'incorreto', tentativasRestantes: 2 })
    await expect(
      chamarSegundaVia('confirmar', c, {
        fetch: fetchRetornando(resposta(401, { erro: 'expirado' })),
      }),
    ).resolves.toEqual({ tipo: 'expirado' })
    await expect(
      chamarSegundaVia('confirmar', c, {
        fetch: fetchRetornando(resposta(401, { erro: 'bloqueado' })),
      }),
    ).resolves.toEqual({ tipo: 'bloqueado' })
    await expect(
      chamarSegundaVia('confirmar', c, {
        fetch: fetchRetornando(resposta(429, { erro: 'limite', tentarEmSegundos: 5 })),
      }),
    ).resolves.toEqual({ tipo: 'limite', tentarEmSegundos: 5 })
  })

  it('confirmar: expiraEmSegundos 0 (cookie nasceria morto) vira indisponivel', async () => {
    const c = { desafio: TOKEN, codigo: '123456', ipCliente: IP }
    const unidades = [{ ref: REF, condominio: 'Edifício Sol', unidade: 'Apto 302' }]
    await expect(
      chamarSegundaVia('confirmar', c, {
        fetch: fetchRetornando(resposta(200, { sessao: TOKEN, expiraEmSegundos: 0, unidades })),
      }),
    ).resolves.toEqual({ tipo: 'indisponivel' })
  })

  it('confirmar: unidade fora do formato derruba a resposta inteira', async () => {
    const c = { desafio: TOKEN, codigo: '123456', ipCliente: IP }
    const ruim = [{ ref: REF, condominio: 'Edifício Sol' }]
    await expect(
      chamarSegundaVia('confirmar', c, {
        fetch: fetchRetornando(
          resposta(200, { sessao: TOKEN, expiraEmSegundos: 900, unidades: ruim }),
        ),
      }),
    ).resolves.toEqual({ tipo: 'indisponivel' })
  })

  it('cobrancas: ok preserva valorCentavos nulo; sessão e referência inválidas', async () => {
    const c = { sessao: TOKEN, unidade: REF, ipCliente: IP }
    const cobrancas = [
      { ref: REF, vencimento: '2026-10-10', valorCentavos: 15050, vencida: false },
      { ref: 'B'.repeat(22), vencimento: '2026-09-10', valorCentavos: null, vencida: true },
    ]
    await expect(
      chamarSegundaVia('cobrancas', c, {
        fetch: fetchRetornando(
          resposta(200, { situacao: 'aberto', haRestritas: false, cobrancas }),
        ),
      }),
    ).resolves.toEqual({
      tipo: 'ok',
      situacao: 'aberto',
      haRestritas: false,
      // App anterior aos campos de baixa: sem eles, o item segue disponível.
      cobrancas: cobrancas.map((x) => ({ ...x, disponivelPeloLink: true })),
    })
    await expect(
      chamarSegundaVia('cobrancas', c, {
        fetch: fetchRetornando(resposta(401, { erro: 'sessao_invalida' })),
      }),
    ).resolves.toEqual({ tipo: 'sessao_invalida' })
    await expect(
      chamarSegundaVia('cobrancas', c, {
        fetch: fetchRetornando(resposta(404, { erro: 'referencia_invalida' })),
      }),
    ).resolves.toEqual({ tipo: 'referencia_invalida' })
  })

  it.each([
    ['valor float', { ref: REF, vencimento: '2026-10-10', valorCentavos: 150.5, vencida: false }],
    [
      'valor string',
      { ref: REF, vencimento: '2026-10-10', valorCentavos: '15050', vencida: false },
    ],
    [
      'vencimento fora de AAAA-MM-DD',
      { ref: REF, vencimento: '10/10/2026', valorCentavos: 100, vencida: false },
    ],
  ])('cobrancas: item com %s vira indisponivel', async (_nome, item) => {
    const c = { sessao: TOKEN, unidade: REF, ipCliente: IP }
    const corpo = { situacao: 'aberto', haRestritas: false, cobrancas: [item] }
    await expect(
      chamarSegundaVia('cobrancas', c, { fetch: fetchRetornando(resposta(200, corpo)) }),
    ).resolves.toEqual({ tipo: 'indisponivel' })
  })

  it.each([
    ['disponível', { disponivelPeloLink: true }, true],
    ['baixado', { disponivelPeloLink: false, motivoIndisponivel: 'baixa' }, false],
    ['false sem motivo', { disponivelPeloLink: false }, false],
    ['motivo desconhecido', { disponivelPeloLink: false, motivoIndisponivel: 'outro' }, false],
    ['true com motivo', { disponivelPeloLink: true, motivoIndisponivel: 'baixa' }, false],
    ['não booleano', { disponivelPeloLink: 'true' }, false],
    ['motivo sem o booleano', { motivoIndisponivel: 'baixa' }, false],
    ['sem os dois campos (app antigo)', {}, true],
  ])('cobrancas: item %s → disponivelPeloLink %s, sem invalidar a lista', async (_nome, extra, esperado) => {
    const c = { sessao: TOKEN, unidade: REF, ipCliente: IP }
    const base = { ref: REF, vencimento: '2026-06-10', valorCentavos: 12345, vencida: true }
    const corpo = { situacao: 'aberto', haRestritas: false, cobrancas: [{ ...base, ...extra }] }
    await expect(
      chamarSegundaVia('cobrancas', c, { fetch: fetchRetornando(resposta(200, corpo)) }),
    ).resolves.toEqual({
      tipo: 'ok',
      situacao: 'aberto',
      haRestritas: false,
      cobrancas: [{ ...base, disponivelPeloLink: esperado }],
    })
  })

  it('cobrancas: situação desconhecida vira indisponivel', async () => {
    const c = { sessao: TOKEN, unidade: REF, ipCliente: IP }
    const corpo = { situacao: 'quitado', haRestritas: false, cobrancas: [] }
    await expect(
      chamarSegundaVia('cobrancas', c, { fetch: fetchRetornando(resposta(200, corpo)) }),
    ).resolves.toEqual({ tipo: 'indisponivel' })
  })

  it('link: ok com host da Superlógica; 409 cobranca_indisponivel', async () => {
    const c = { sessao: TOKEN, unidade: REF, cobranca: REF, ipCliente: IP }
    const url = 'https://semog.superlogica.net/clients/areadocondomino/segundavia?id=abc'
    await expect(
      chamarSegundaVia('link', c, { fetch: fetchRetornando(resposta(200, { url })) }),
    ).resolves.toEqual({ tipo: 'ok', url })
    await expect(
      chamarSegundaVia('link', c, {
        fetch: fetchRetornando(resposta(409, { erro: 'cobranca_indisponivel' })),
      }),
    ).resolves.toEqual({ tipo: 'cobranca_indisponivel' })
  })

  it.each([
    'https://evil.example/boleto',
    'http://semog.superlogica.net/x',
    'https://semog.superlogica.net.evil.example/x',
    'https://semog.superlogica.net:8443/x',
    'https://user:senha@semog.superlogica.net/x',
    'https://semog.superlogica.net/x#frag',
    'https://semog.superlogica.net\\@evil.example/x',
    'javascript:alert(1)',
    'nao-e-url',
  ])('link com URL %s vira indisponivel (host conferido de novo no site)', async (url) => {
    const c = { sessao: TOKEN, unidade: REF, cobranca: REF, ipCliente: IP }
    await expect(
      chamarSegundaVia('link', c, { fetch: fetchRetornando(resposta(200, { url })) }),
    ).resolves.toEqual({ tipo: 'indisponivel' })
  })

  it('encerrar: 204 ok', async () => {
    await expect(
      chamarSegundaVia('encerrar', { sessao: TOKEN }, { fetch: fetchRetornando(resposta(204)) }),
    ).resolves.toEqual({ tipo: 'ok' })
  })
})

describe('chamarSegundaVia: caminho de SEMOGAPP_API_URL', () => {
  it.each([
    ['https://app.exemplo.test/api', 'https://app.exemplo.test/api/publico/segunda-via/encerrar'],
    ['https://app.exemplo.test/api/', 'https://app.exemplo.test/api/publico/segunda-via/encerrar'],
    ['https://app.exemplo.test/', 'https://app.exemplo.test/publico/segunda-via/encerrar'],
  ])('%s preserva o prefixo e não duplica a barra', async (base, esperada) => {
    process.env.SEMOGAPP_API_URL = base
    const fetchFalso = fetchRetornando(resposta(204))
    await chamarSegundaVia('encerrar', { sessao: TOKEN }, { fetch: fetchFalso })
    expect(fetchFalso.mock.calls[0][0]).toBe(esperada)
  })

  it.each([
    'https://app.exemplo.test/api?x=1',
    'https://app.exemplo.test/api#frag',
    'https://u:s@app.exemplo.test/api',
  ])('base com query, fragmento ou credencial (%s) não é usada', async (base) => {
    process.env.SEMOGAPP_API_URL = base
    const fetchFalso = vi.fn<typeof fetch>()
    await expect(
      chamarSegundaVia('encerrar', { sessao: TOKEN }, { fetch: fetchFalso }),
    ).resolves.toEqual({ tipo: 'indisponivel' })
    expect(fetchFalso).not.toHaveBeenCalled()
  })
})

describe('chamarSegundaVia: o link do boleto (credencial)', () => {
  const c = { sessao: TOKEN, unidade: REF, cobranca: REF, ipCliente: IP }
  const URL_BOLETO =
    'https://semog.superlogica.net/clients/areadocondomino/segundavia?id=segredo123'

  it('devolve a forma validada pelo parser (href), não a string crua', async () => {
    await expect(
      chamarSegundaVia('link', c, {
        fetch: fetchRetornando(resposta(200, { url: 'https://SEMOG.superlogica.net/x?id=1' })),
      }),
    ).resolves.toEqual({ tipo: 'ok', url: 'https://semog.superlogica.net/x?id=1' })
  })

  function espionarConsole() {
    return (['log', 'info', 'warn', 'error', 'debug', 'trace'] as const).map((m) =>
      vi.spyOn(console, m).mockImplementation(() => {}),
    )
  }

  it.each([
    ['caminho feliz', () => fetchRetornando(resposta(200, { url: URL_BOLETO }))],
    [
      'fetch lança com a URL na mensagem',
      () =>
        vi.fn<typeof fetch>(async () => {
          throw new TypeError(`fetch failed: ${URL_BOLETO}`)
        }),
    ],
    [
      'leitura do corpo lança com a URL na mensagem',
      () =>
        vi.fn<typeof fetch>(async () => {
          const r = resposta(200, { url: URL_BOLETO })
          vi.spyOn(r, 'text').mockRejectedValue(new Error(`corpo: ${URL_BOLETO}`))
          return r
        }),
    ],
    [
      'URL recusada pela segunda conferência',
      () => fetchRetornando(resposta(200, { url: `${URL_BOLETO}#x` })),
    ],
    [
      '401 de assinatura',
      () => fetchRetornando(resposta(401, { erro: 'assinatura', url: URL_BOLETO })),
    ],
  ])('%s: nenhum console.* contém a URL', async (_nome, criaFetch) => {
    const espioes = espionarConsole()
    await chamarSegundaVia('link', c, { fetch: criaFetch() })
    expect(textoDosLogs(espioes)).not.toContain('segredo123')
  })
})
