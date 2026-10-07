import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CorpoDe, RespostaCobrancas, RespostaDe, RotaSegundaVia } from '@/lib/segundaVia/tipos'

/**
 * Server Actions da 2ª via com as fronteiras mockadas: `next/headers` (IP e
 * cookies), Turnstile e o cliente HTTP do semogapp. O rate limit em memória é
 * o real; cada teste usa um IP próprio para não herdar a contagem de outro.
 */

const chamarMock = vi.fn()
const verifyTurnstileMock = vi.fn()
const headersMock = vi.fn()
const cookiesMock = vi.fn()

vi.mock('server-only', () => ({}))

vi.mock('@/lib/segundaVia/cliente', () => ({
  chamarSegundaVia: (...args: unknown[]) => chamarMock(...args),
}))

vi.mock('@/lib/turnstile', () => ({
  verifyTurnstile: (...args: unknown[]) => verifyTurnstileMock(...args),
}))

vi.mock('next/headers', () => ({
  headers: (...args: unknown[]) => headersMock(...args),
  cookies: (...args: unknown[]) => cookiesMock(...args),
}))

const {
  solicitarCodigo,
  reenviarCodigo,
  confirmarCodigo,
  listarCobrancas,
  abrirBoleto,
  encerrarConsulta,
} = await import('@/app/(frontend)/_actions/segunda-via')

const CPF = '529.982.247-25'
const CPF_DIGITOS = '52998224725'
const DESAFIO = 'D'.repeat(43)
const SESSAO = 'S'.repeat(43)
const REF_UNIDADE = 'U'.repeat(22)
const REF_COBRANCA = 'C'.repeat(22)
const URL_BOLETO = 'https://semog.superlogica.net/clients/areadocondomino/segundavia?id=abc'

type OpcoesCookie = Record<string, unknown>

/** `ReadonlyRequestCookies` falso: guarda valor e atributos do último `set`. */
function lojaDeCookies(inicial: Record<string, string> = {}) {
  const valores = new Map(Object.entries(inicial))
  const atributos = new Map<string, OpcoesCookie>()
  const apagados: string[] = []
  return {
    valores,
    atributos,
    apagados,
    get: (nome: string) =>
      valores.has(nome) ? { name: nome, value: valores.get(nome) } : undefined,
    set: (nome: string, valor: string, opcoes: OpcoesCookie = {}) => {
      valores.set(nome, valor)
      atributos.set(nome, opcoes)
    },
    delete: (arg: string | { name: string }) => {
      const nome = typeof arg === 'string' ? arg : arg.name
      valores.delete(nome)
      apagados.push(nome)
    },
  }
}

let cookies = lojaDeCookies()
let ipSeq = 0

function usarIp(ip: string | null) {
  headersMock.mockResolvedValue({
    get: (n: string) => (n === 'x-forwarded-for' ? ip : null),
  })
}

/** Responde cada rota do app com o que o teste mandar. */
function appResponde<R extends RotaSegundaVia>(rota: R, resposta: RespostaDe<R>) {
  chamarMock.mockImplementation(async (r: RotaSegundaVia) => {
    if (r !== rota) throw new Error(`rota inesperada: ${r}`)
    return resposta
  })
}

function corpoEnviado<R extends RotaSegundaVia>(): CorpoDe<R> {
  return chamarMock.mock.calls[0]?.[1] as CorpoDe<R> // as: o teste conhece a rota chamada
}

const FLAG_ORIGINAL = process.env.SEGUNDA_VIA_ATIVA

beforeEach(() => {
  process.env.SEGUNDA_VIA_ATIVA = 'true'
  cookies = lojaDeCookies()
  cookiesMock.mockImplementation(async () => cookies)
  ipSeq += 1
  usarIp(`10.0.0.${ipSeq}`)
  verifyTurnstileMock.mockResolvedValue(true)
})

afterEach(() => {
  vi.restoreAllMocks()
  chamarMock.mockReset()
  verifyTurnstileMock.mockReset()
  if (FLAG_ORIGINAL === undefined) delete process.env.SEGUNDA_VIA_ATIVA
  else process.env.SEGUNDA_VIA_ATIVA = FLAG_ORIGINAL
})

describe('flag SEGUNDA_VIA_ATIVA', () => {
  it('flag desligada: nenhuma chamada ao semogapp', async () => {
    process.env.SEGUNDA_VIA_ATIVA = 'false'
    cookies = lojaDeCookies({ segvia_desafio: DESAFIO, segvia_sessao: SESSAO })
    const desligada = { tipo: 'desligada' }
    await expect(solicitarCodigo(CPF, 'tok')).resolves.toEqual(desligada)
    await expect(reenviarCodigo()).resolves.toEqual(desligada)
    await expect(confirmarCodigo('123456')).resolves.toEqual(desligada)
    await expect(listarCobrancas(REF_UNIDADE)).resolves.toEqual(desligada)
    await expect(abrirBoleto(REF_UNIDADE, REF_COBRANCA)).resolves.toEqual(desligada)
    await encerrarConsulta()
    expect(chamarMock).not.toHaveBeenCalled()
    expect(verifyTurnstileMock).not.toHaveBeenCalled()
    // Desligada, encerrar ainda limpa os cookies.
    expect(cookies.valores.size).toBe(0)
  })

  it('variável ausente também desliga', async () => {
    delete process.env.SEGUNDA_VIA_ATIVA
    await expect(solicitarCodigo(CPF, 'tok')).resolves.toEqual({ tipo: 'desligada' })
    expect(chamarMock).not.toHaveBeenCalled()
  })
})

describe('solicitarCodigo', () => {
  it('CPF inválido no servidor → entrada_invalida sem chamar o app nem o Turnstile', async () => {
    for (const cpf of ['529.982.247-24', '111.111.111-11', '', '123']) {
      await expect(solicitarCodigo(cpf, 'tok')).resolves.toEqual({ tipo: 'entrada_invalida' })
    }
    // Argumento que não é string (a action recebe o que o navegador mandar).
    await expect(solicitarCodigo(42 as unknown as string, 'tok')).resolves.toEqual({
      tipo: 'entrada_invalida',
    }) // as: simula um cliente adulterado
    expect(chamarMock).not.toHaveBeenCalled()
    expect(verifyTurnstileMock).not.toHaveBeenCalled()
  })

  it('Turnstile recusado → anti_robo sem chamar o app', async () => {
    verifyTurnstileMock.mockResolvedValue(false)
    await expect(solicitarCodigo(CPF, 'tok')).resolves.toEqual({ tipo: 'anti_robo' })
    expect(chamarMock).not.toHaveBeenCalled()
    expect(cookies.valores.size).toBe(0)
  })

  it('token do Turnstile vazio → anti_robo sem chamar a Cloudflare', async () => {
    await expect(solicitarCodigo(CPF, '')).resolves.toEqual({ tipo: 'anti_robo' })
    expect(verifyTurnstileMock).not.toHaveBeenCalled()
    expect(chamarMock).not.toHaveBeenCalled()
  })

  it('rate limit em memória 5/min por IP no solicitar', async () => {
    usarIp('10.9.9.9')
    appResponde('solicitar', { tipo: 'ok', desafio: DESAFIO, reenvioEmSegundos: 60 })
    for (let i = 0; i < 5; i++) {
      await expect(solicitarCodigo(CPF, 'tok')).resolves.toMatchObject({ tipo: 'ok' })
    }
    const sexta = await solicitarCodigo(CPF, 'tok')
    expect(sexta.tipo).toBe('limite')
    if (sexta.tipo === 'limite') {
      expect(sexta.tentarEmSegundos).toBeGreaterThan(0)
      expect(sexta.tentarEmSegundos).toBeLessThanOrEqual(60)
    }
    expect(chamarMock).toHaveBeenCalledTimes(5)
    // Outro IP não herda o limite.
    usarIp('10.9.9.10')
    await expect(solicitarCodigo(CPF, 'tok')).resolves.toMatchObject({ tipo: 'ok' })
  })

  it('solicitar ok grava cookie do desafio HttpOnly/Secure/Strict/600 e NÃO devolve o desafio ao cliente', async () => {
    usarIp('203.0.113.7')
    appResponde('solicitar', { tipo: 'ok', desafio: DESAFIO, reenvioEmSegundos: 60 })
    const r = await solicitarCodigo(CPF, 'tok')
    expect(r).toEqual({ tipo: 'ok', reenvioEmSegundos: 60 })
    expect(JSON.stringify(r)).not.toContain(DESAFIO)
    expect(cookies.valores.get('segvia_desafio')).toBe(DESAFIO)
    expect(cookies.atributos.get('segvia_desafio')).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 600,
    })
    expect(corpoEnviado<'solicitar'>()).toEqual({ cpf: CPF_DIGITOS, ipCliente: '203.0.113.7' })
    expect(chamarMock.mock.calls[0]?.[0]).toBe('solicitar')
    expect(verifyTurnstileMock).toHaveBeenCalledWith('tok', '203.0.113.7')
  })

  it('erros do app passam adiante sem gravar cookie', async () => {
    for (const resposta of [
      { tipo: 'entrada_invalida' },
      { tipo: 'limite', tentarEmSegundos: 30 },
      { tipo: 'indisponivel' },
    ] as const) {
      appResponde('solicitar', resposta)
      await expect(solicitarCodigo(CPF, 'tok')).resolves.toEqual(resposta)
    }
    expect(cookies.valores.size).toBe(0)
  })
})

describe('ipCliente repassado ao app', () => {
  it.each([
    ['IPv4', '198.51.100.4', '198.51.100.4'],
    ['IPv6', '2001:db8::1', '2001:db8::1'],
    ['primeiro da lista', '198.51.100.5, 10.0.0.1', '198.51.100.5'],
    ['ausente', null, 'anon'],
    ['lixo', 'nao-e-ip', 'anon'],
    ['com porta', '198.51.100.6:4444', 'anon'],
    ['injeção', '1.2.3.4"}', 'anon'],
  ])('%s → %s', async (_nome, header, esperado) => {
    usarIp(header)
    appResponde('solicitar', { tipo: 'ok', desafio: DESAFIO, reenvioEmSegundos: 60 })
    await solicitarCodigo(CPF, 'tok')
    expect(corpoEnviado<'solicitar'>().ipCliente).toBe(esperado)
    // O Turnstile só recebe IP com formato válido.
    const ipTurnstile = verifyTurnstileMock.mock.calls[0]?.[1]
    expect(ipTurnstile).toBe(esperado === 'anon' ? undefined : esperado)
  })
})

describe('reenviarCodigo', () => {
  it('sem cookie de desafio → expirado, sem chamar o app', async () => {
    await expect(reenviarCodigo()).resolves.toEqual({ tipo: 'expirado' })
    expect(chamarMock).not.toHaveBeenCalled()
  })

  it('cookie de desafio malformado → expirado e apagado, sem chamar o app', async () => {
    cookies = lojaDeCookies({ segvia_desafio: 'curto' })
    await expect(reenviarCodigo()).resolves.toEqual({ tipo: 'expirado' })
    expect(chamarMock).not.toHaveBeenCalled()
    expect(cookies.valores.has('segvia_desafio')).toBe(false)
  })

  it('ok renova o cookie do desafio; expirado do app apaga', async () => {
    usarIp('198.51.100.20')
    cookies = lojaDeCookies({ segvia_desafio: DESAFIO })
    appResponde('reenviar', { tipo: 'ok', reenvioEmSegundos: 60 })
    await expect(reenviarCodigo()).resolves.toEqual({ tipo: 'ok', reenvioEmSegundos: 60 })
    expect(corpoEnviado<'reenviar'>()).toEqual({ desafio: DESAFIO, ipCliente: '198.51.100.20' })
    expect(cookies.atributos.get('segvia_desafio')).toMatchObject({ maxAge: 600 })

    appResponde('reenviar', { tipo: 'expirado' })
    await expect(reenviarCodigo()).resolves.toEqual({ tipo: 'expirado' })
    expect(cookies.valores.has('segvia_desafio')).toBe(false)
  })
})

describe('confirmarCodigo', () => {
  it('confirmar com código "123-456" manda "123456"; ok troca cookie de desafio por sessão', async () => {
    usarIp('198.51.100.30')
    cookies = lojaDeCookies({ segvia_desafio: DESAFIO })
    const unidades = [{ ref: REF_UNIDADE, condominio: 'Condomínio X', unidade: 'Apto 302' }]
    appResponde('confirmar', { tipo: 'ok', sessao: SESSAO, expiraEmSegundos: 900, unidades })
    const r = await confirmarCodigo('123-456')
    expect(r).toEqual({ tipo: 'ok', unidades })
    expect(JSON.stringify(r)).not.toContain(SESSAO)
    expect(corpoEnviado<'confirmar'>()).toEqual({
      desafio: DESAFIO,
      codigo: '123456',
      ipCliente: '198.51.100.30',
    })
    expect(cookies.valores.has('segvia_desafio')).toBe(false)
    expect(cookies.apagados).toContain('segvia_desafio')
    expect(cookies.valores.get('segvia_sessao')).toBe(SESSAO)
    expect(cookies.atributos.get('segvia_sessao')).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 900,
    })
  })

  it('confirmar com código de 5 dígitos → formato, sem chamar o app (não gasta tentativa)', async () => {
    cookies = lojaDeCookies({ segvia_desafio: DESAFIO })
    for (const codigo of ['12345', '12a456', '1234567', '']) {
      await expect(confirmarCodigo(codigo)).resolves.toEqual({ tipo: 'formato' })
    }
    await expect(confirmarCodigo(null as unknown as string)).resolves.toEqual({ tipo: 'formato' }) // as: cliente adulterado
    expect(chamarMock).not.toHaveBeenCalled()
    expect(cookies.valores.get('segvia_desafio')).toBe(DESAFIO)
  })

  it('sem cookie de desafio → expirado (não indisponivel), sem chamar o app', async () => {
    await expect(confirmarCodigo('123456')).resolves.toEqual({ tipo: 'expirado' })
    expect(chamarMock).not.toHaveBeenCalled()
  })

  it('incorreto e bloqueado mantêm o desafio (o reenvio usa o mesmo)', async () => {
    cookies = lojaDeCookies({ segvia_desafio: DESAFIO })
    appResponde('confirmar', { tipo: 'incorreto', tentativasRestantes: 2 })
    await expect(confirmarCodigo('123456')).resolves.toEqual({
      tipo: 'incorreto',
      tentativasRestantes: 2,
    })
    appResponde('confirmar', { tipo: 'bloqueado' })
    await expect(confirmarCodigo('123456')).resolves.toEqual({ tipo: 'bloqueado' })
    expect(cookies.valores.get('segvia_desafio')).toBe(DESAFIO)
    expect(cookies.valores.has('segvia_sessao')).toBe(false)
  })
})

describe('listarCobrancas e abrirBoleto (Review Focus 4)', () => {
  it('abrirBoleto sem cookie de sessão → sessao_invalida, a "consulta expirou" do redutor', async () => {
    // O brief dizia `sessao_expirada`; o controlador fixou `sessao_invalida`, que o
    // redutor da S4 já leva à tela "Por segurança, sua consulta expirou".
    await expect(abrirBoleto(REF_UNIDADE, REF_COBRANCA)).resolves.toEqual({
      tipo: 'sessao_invalida',
    })
    expect(chamarMock).not.toHaveBeenCalled()
  })

  it('listarCobrancas sem cookie de sessão → sessao_invalida, nunca indisponivel', async () => {
    await expect(listarCobrancas(REF_UNIDADE)).resolves.toEqual({ tipo: 'sessao_invalida' })
    expect(chamarMock).not.toHaveBeenCalled()
  })

  it('abrirBoleto com ref malformada → referencia_invalida sem chamar o app', async () => {
    cookies = lojaDeCookies({ segvia_sessao: SESSAO })
    for (const [u, c] of [
      ['curta', REF_COBRANCA],
      [REF_UNIDADE, 'com espaço e mais de vinte e dois'],
      [REF_UNIDADE, 123 as unknown as string], // as: cliente adulterado
    ]) {
      await expect(abrirBoleto(u, c)).resolves.toEqual({ tipo: 'referencia_invalida' })
    }
    await expect(listarCobrancas('../x')).resolves.toEqual({ tipo: 'referencia_invalida' })
    expect(chamarMock).not.toHaveBeenCalled()
  })

  it('sessao_invalida do app apaga os cookies', async () => {
    cookies = lojaDeCookies({ segvia_sessao: SESSAO, segvia_desafio: DESAFIO })
    appResponde('link', { tipo: 'sessao_invalida' })
    await expect(abrirBoleto(REF_UNIDADE, REF_COBRANCA)).resolves.toEqual({
      tipo: 'sessao_invalida',
    })
    expect(cookies.valores.size).toBe(0)
  })

  it('listarCobrancas ok repassa a lista e manda sessão, unidade e IP', async () => {
    usarIp('198.51.100.40')
    cookies = lojaDeCookies({ segvia_sessao: SESSAO })
    const resposta: RespostaCobrancas = {
      tipo: 'ok',
      situacao: 'aberto',
      haRestritas: false,
      cobrancas: [
        { ref: REF_COBRANCA, vencimento: '2026-10-10', valorCentavos: 12345, vencida: false },
      ],
    }
    appResponde('cobrancas', resposta)
    await expect(listarCobrancas(REF_UNIDADE)).resolves.toEqual(resposta)
    expect(corpoEnviado<'cobrancas'>()).toEqual({
      sessao: SESSAO,
      unidade: REF_UNIDADE,
      ipCliente: '198.51.100.40',
    })
  })

  it('abrirBoleto ok devolve a URL e não loga nada', async () => {
    const espioes = (['log', 'info', 'warn', 'error', 'debug', 'trace'] as const).map((m) =>
      vi.spyOn(console, m).mockImplementation(() => {}),
    )
    cookies = lojaDeCookies({ segvia_sessao: SESSAO })
    appResponde('link', { tipo: 'ok', url: URL_BOLETO })
    await expect(abrirBoleto(REF_UNIDADE, REF_COBRANCA)).resolves.toEqual({
      tipo: 'ok',
      url: URL_BOLETO,
    })
    expect(corpoEnviado<'link'>()).toMatchObject({
      sessao: SESSAO,
      unidade: REF_UNIDADE,
      cobranca: REF_COBRANCA,
    })
    for (const e of espioes) expect(e).not.toHaveBeenCalled()
  })

  it('cobranca_indisponivel mantém a sessão', async () => {
    cookies = lojaDeCookies({ segvia_sessao: SESSAO })
    appResponde('link', { tipo: 'cobranca_indisponivel' })
    await expect(abrirBoleto(REF_UNIDADE, REF_COBRANCA)).resolves.toEqual({
      tipo: 'cobranca_indisponivel',
    })
    expect(cookies.valores.get('segvia_sessao')).toBe(SESSAO)
  })
})

describe('encerrarConsulta', () => {
  it('apaga os dois cookies e avisa o app quando há sessão', async () => {
    cookies = lojaDeCookies({ segvia_sessao: SESSAO, segvia_desafio: DESAFIO })
    appResponde('encerrar', { tipo: 'ok' })
    await expect(encerrarConsulta()).resolves.toBeUndefined()
    expect(corpoEnviado<'encerrar'>()).toEqual({ sessao: SESSAO })
    expect(cookies.valores.size).toBe(0)
  })

  it('apaga os cookies mesmo com o app fora', async () => {
    cookies = lojaDeCookies({ segvia_sessao: SESSAO })
    appResponde('encerrar', { tipo: 'indisponivel' })
    await encerrarConsulta()
    expect(cookies.valores.size).toBe(0)
  })

  it('sem sessão: só apaga, não chama o app', async () => {
    cookies = lojaDeCookies({ segvia_desafio: DESAFIO })
    await encerrarConsulta()
    expect(chamarMock).not.toHaveBeenCalled()
    expect(cookies.valores.size).toBe(0)
  })
})

describe('o que volta ao navegador', () => {
  it('nenhum resultado devolvido ao cliente contém desafio, sessao ou CPF', async () => {
    const resultados: unknown[] = []
    appResponde('solicitar', { tipo: 'ok', desafio: DESAFIO, reenvioEmSegundos: 60 })
    resultados.push(await solicitarCodigo(CPF, 'tok'))
    appResponde('reenviar', { tipo: 'ok', reenvioEmSegundos: 60 })
    resultados.push(await reenviarCodigo())
    appResponde('confirmar', {
      tipo: 'ok',
      sessao: SESSAO,
      expiraEmSegundos: 900,
      unidades: [{ ref: REF_UNIDADE, condominio: 'C', unidade: 'U' }],
    })
    resultados.push(await confirmarCodigo('123456'))
    appResponde('cobrancas', {
      tipo: 'ok',
      situacao: 'sem_aberto',
      haRestritas: false,
      cobrancas: [],
    })
    resultados.push(await listarCobrancas(REF_UNIDADE))
    appResponde('link', { tipo: 'ok', url: URL_BOLETO })
    resultados.push(await abrirBoleto(REF_UNIDADE, REF_COBRANCA))
    appResponde('encerrar', { tipo: 'ok' })
    resultados.push(await encerrarConsulta())

    const texto = JSON.stringify(resultados)
    for (const proibido of [DESAFIO, SESSAO, CPF, CPF_DIGITOS]) {
      expect(texto).not.toContain(proibido)
    }
    // E as chaves também não aparecem, nem vazias.
    expect(texto).not.toMatch(/"(desafio|sessao|cpf|expiraEmSegundos)"/)
  })
})
