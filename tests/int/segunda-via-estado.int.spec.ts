import { describe, expect, it } from 'vitest'
import {
  type AcaoSegundaVia,
  type EstadoSegundaVia,
  estadoInicial,
  etapaVisivel,
  reduzirSegundaVia,
  reenvioHabilitado,
  segundosParaReenvio,
} from '@/components/triagem/segunda-via/estado'
import type { CobrancaPublica, RespostaConfirmar, UnidadePublica } from '@/lib/segundaVia/tipos'

const U1: UnidadePublica = { ref: 'U'.repeat(22), condominio: 'Condomínio X', unidade: 'Apto 302' }
const U2: UnidadePublica = { ref: 'V'.repeat(22), condominio: 'Condomínio Y', unidade: 'Casa 4' }
const C1: CobrancaPublica = {
  ref: 'C'.repeat(22),
  vencimento: '2026-10-10',
  valorCentavos: 45000,
  vencida: false,
}

function aplicar(inicial: EstadoSegundaVia, ...acoes: AcaoSegundaVia[]): EstadoSegundaVia {
  return acoes.reduce(reduzirSegundaVia, inicial)
}

const T0 = 1_000_000

const solicitado: AcaoSegundaVia = {
  tipo: 'solicitar_respondido',
  agora: T0,
  resposta: { tipo: 'ok', desafio: 'D'.repeat(22), reenvioEmSegundos: 60 },
}

function confirmadoCom(unidades: UnidadePublica[]): AcaoSegundaVia {
  return {
    tipo: 'confirmar_respondido',
    agora: T0,
    resposta: { tipo: 'ok', sessao: 'S'.repeat(22), expiraEmSegundos: 900, unidades },
  }
}

function cobrancasOk(
  situacao: 'aberto' | 'sem_aberto' | 'indeterminado',
  haRestritas: boolean,
  cobrancas: CobrancaPublica[],
): AcaoSegundaVia {
  return {
    tipo: 'cobrancas_respondido',
    resposta: { tipo: 'ok', situacao, haRestritas, cobrancas },
  }
}

const escolherCobranca: AcaoSegundaVia = { tipo: 'escolher_cobranca', ref: C1.ref }

const emBoletosUmaUnidade = () => aplicar(estadoInicial, solicitado, confirmadoCom([U1]))
const emBoletosVarias = () =>
  aplicar(estadoInicial, solicitado, confirmadoCom([U1, U2]), {
    tipo: 'escolher_unidade',
    ref: U1.ref,
  })
const emBoleto = () =>
  aplicar(emBoletosUmaUnidade(), cobrancasOk('aberto', false, [C1]), escolherCobranca)

describe('etapas', () => {
  it('uma unidade pula "unidades" e mostra Etapa N de 3; várias mostram de 4', () => {
    expect(etapaVisivel(estadoInicial)).toEqual({ atual: 1, total: 3 })
    const cod = aplicar(estadoInicial, solicitado)
    expect(cod.tela).toBe('codigo')
    expect(etapaVisivel(cod)).toEqual({ atual: 2, total: 3 })

    const uma = aplicar(cod, confirmadoCom([U1]))
    expect(uma.tela).toBe('boletos')
    expect(uma.unidade).toEqual(U1)
    expect(etapaVisivel(uma)).toEqual({ atual: 3, total: 3 })

    const varias = aplicar(cod, confirmadoCom([U1, U2]))
    expect(varias.tela).toBe('unidades')
    expect(etapaVisivel(varias)).toEqual({ atual: 3, total: 4 })
    const boletos = aplicar(varias, { tipo: 'escolher_unidade', ref: U2.ref })
    expect(boletos.tela).toBe('boletos')
    expect(boletos.unidade).toEqual(U2)
    expect(etapaVisivel(boletos)).toEqual({ atual: 4, total: 4 })
  })

  it('a tela de falha mantém a etapa em que a falha aconteceu', () => {
    const falha = aplicar(estadoInicial, {
      tipo: 'solicitar_respondido',
      agora: T0,
      resposta: { tipo: 'indisponivel' },
    })
    expect(falha.tela).toBe('falha')
    expect(etapaVisivel(falha)).toEqual({ atual: 1, total: 3 })
  })
})

describe('voltar', () => {
  it('codigo→cpf, boleto→boletos, boletos→unidades', () => {
    expect(aplicar(estadoInicial, solicitado, { tipo: 'voltar' }).tela).toBe('cpf')

    const lista = aplicar(emBoletosVarias(), cobrancasOk('aberto', false, [C1]))
    const boleto = aplicar(lista, escolherCobranca)
    expect(boleto.tela).toBe('boleto')
    const deVolta = aplicar(boleto, { tipo: 'voltar' })
    expect(deVolta.tela).toBe('boletos')
    expect(deVolta.boletos).toEqual(lista.boletos)

    const unidades = aplicar(deVolta, { tipo: 'voltar' })
    expect(unidades.tela).toBe('unidades')
    expect(unidades.unidade).toBeNull()
    expect(unidades.boletos).toEqual({ modo: 'carregando' })
  })

  it('onde o protótipo não define voltar, nada muda', () => {
    expect(aplicar(estadoInicial, { tipo: 'voltar' })).toBe(estadoInicial)
    // Com uma unidade só, "unidades" foi pulada: voltar ao código pediria outro código.
    const uma = emBoletosUmaUnidade()
    expect(aplicar(uma, { tipo: 'voltar' })).toBe(uma)
    const unidades = aplicar(estadoInicial, solicitado, confirmadoCom([U1, U2]))
    expect(aplicar(unidades, { tipo: 'voltar' })).toBe(unidades)
  })
})

describe('sessão expirada (Review Focus 4)', () => {
  it.each([
    ['unidades', () => aplicar(estadoInicial, solicitado, confirmadoCom([U1, U2]))],
    ['boletos', emBoletosUmaUnidade],
    ['boleto', emBoleto],
  ])('sessao_expirada em %s vai para "expirada" e descarta os dados', (_nome, monta) => {
    const e = aplicar(monta(), { tipo: 'sessao_expirada' })
    expect(e.tela).toBe('expirada')
    expect(e.unidades).toEqual([])
    expect(e.unidade).toBeNull()
    expect(e.boletos).toEqual({ modo: 'carregando' })
  })

  it('sessao_invalida do app em /cobrancas ou /link também vai para "expirada"', () => {
    const c = aplicar(emBoletosUmaUnidade(), {
      tipo: 'cobrancas_respondido',
      resposta: { tipo: 'sessao_invalida' },
    })
    expect(c.tela).toBe('expirada')
    const l = aplicar(emBoleto(), {
      tipo: 'link_respondido',
      resposta: { tipo: 'sessao_invalida' },
    })
    expect(l.tela).toBe('expirada')
  })

  it('antes do código, sessao_expirada não faz nada; "expirada" recomeça pelo CPF', () => {
    const cod = aplicar(estadoInicial, solicitado)
    expect(aplicar(cod, { tipo: 'sessao_expirada' })).toBe(cod)
    const exp = aplicar(emBoletosUmaUnidade(), { tipo: 'sessao_expirada' })
    expect(aplicar(exp, { tipo: 'recomecar' })).toEqual(estadoInicial)
  })
})

describe('tela de boletos', () => {
  it('indeterminado nunca vira lista vazia: modo "nao_consultou"', () => {
    const base = emBoletosUmaUnidade()
    expect(aplicar(base, cobrancasOk('indeterminado', false, [])).boletos).toEqual({
      modo: 'nao_consultou',
    })
    // Mesmo que o app mande itens junto de "indeterminado", não se exibe lista.
    expect(aplicar(base, cobrancasOk('indeterminado', false, [C1])).boletos).toEqual({
      modo: 'nao_consultou',
    })
    expect(
      aplicar(base, { tipo: 'cobrancas_respondido', resposta: { tipo: 'indisponivel' } }).boletos,
    ).toEqual({ modo: 'nao_consultou' })
  })

  it('"aberto" sem nenhum item liberável e sem restrição não vira "sem boletos"', () => {
    expect(aplicar(emBoletosUmaUnidade(), cobrancasOk('aberto', false, [])).boletos).toEqual({
      modo: 'nao_consultou',
    })
  })

  it('"sem_aberto" que traz itens é incoerente: nao_consultou', () => {
    expect(aplicar(emBoletosUmaUnidade(), cobrancasOk('sem_aberto', false, [C1])).boletos).toEqual({
      modo: 'nao_consultou',
    })
  })

  it('só restritas: aviso de restrição, sem lista', () => {
    expect(aplicar(emBoletosUmaUnidade(), cobrancasOk('aberto', true, [])).boletos).toEqual({
      modo: 'so_restritas',
    })
    expect(aplicar(emBoletosUmaUnidade(), cobrancasOk('sem_aberto', true, [])).boletos).toEqual({
      modo: 'so_restritas',
    })
  })

  it('sem boleto e sem restrição: modo "sem_boletos" (texto de não-quitação)', () => {
    expect(aplicar(emBoletosUmaUnidade(), cobrancasOk('sem_aberto', false, [])).boletos).toEqual({
      modo: 'sem_boletos',
    })
  })

  it('lista com restritas guarda o aviso junto da lista', () => {
    expect(aplicar(emBoletosUmaUnidade(), cobrancasOk('aberto', true, [C1])).boletos).toEqual({
      modo: 'lista',
      cobrancas: [C1],
      haRestritas: true,
    })
  })

  it('escolher cobrança desconhecida ou fora do modo lista não faz nada', () => {
    const lista = aplicar(emBoletosUmaUnidade(), cobrancasOk('aberto', false, [C1]))
    expect(aplicar(lista, { tipo: 'escolher_cobranca', ref: 'X'.repeat(22) })).toBe(lista)
    const vazia = aplicar(emBoletosUmaUnidade(), cobrancasOk('sem_aberto', false, []))
    expect(aplicar(vazia, escolherCobranca)).toBe(vazia)
  })

  it('escolher unidade desconhecida não faz nada', () => {
    const unidades = aplicar(estadoInicial, solicitado, confirmadoCom([U1, U2]))
    expect(aplicar(unidades, { tipo: 'escolher_unidade', ref: 'X'.repeat(22) })).toBe(unidades)
  })
})

describe('link', () => {
  it('ok não muda o estado: a URL (credencial) nunca entra no estado', () => {
    const e = emBoleto()
    expect(
      aplicar(e, {
        tipo: 'link_respondido',
        resposta: { tipo: 'ok', url: 'https://semog.superlogica.net/x' },
      }),
    ).toBe(e)
  })

  it('cobrança indisponível volta à lista pedindo nova consulta', () => {
    const e = aplicar(emBoleto(), {
      tipo: 'link_respondido',
      resposta: { tipo: 'cobranca_indisponivel' },
    })
    expect(e.tela).toBe('boletos')
    expect(e.boletos).toEqual({ modo: 'carregando' })
    expect(e.avisoLink).toBe('cobranca_indisponivel')
  })

  it('o aviso some quando a nova consulta responde', () => {
    const e = aplicar(
      emBoleto(),
      { tipo: 'link_respondido', resposta: { tipo: 'cobranca_indisponivel' } },
      cobrancasOk('aberto', false, [C1]),
    )
    expect(e.avisoLink).toBeNull()
  })

  it('indisponível vai para "falha" na etapa do boleto', () => {
    const e = aplicar(emBoleto(), {
      tipo: 'link_respondido',
      resposta: { tipo: 'indisponivel' },
    })
    expect(e.tela).toBe('falha')
    expect(etapaVisivel(e)).toEqual({ atual: 3, total: 3 })
  })
})

describe('código', () => {
  const confirmar = (resposta: RespostaConfirmar) =>
    aplicar(aplicar(estadoInicial, solicitado), {
      tipo: 'confirmar_respondido',
      agora: T0,
      resposta,
    })

  it('incorreto guarda tentativasRestantes e continua na tela do código', () => {
    const e = confirmar({ tipo: 'incorreto', tentativasRestantes: 2 })
    expect(e.tela).toBe('codigo')
    expect(e.erroCodigo).toEqual({ tipo: 'incorreto', tentativasRestantes: 2 })
  })

  it('bloqueado e expirado têm mensagens (tipos) próprias', () => {
    expect(confirmar({ tipo: 'bloqueado' }).erroCodigo).toEqual({ tipo: 'bloqueado' })
    expect(confirmar({ tipo: 'expirado' }).erroCodigo).toEqual({ tipo: 'expirado' })
  })

  it('limite por IP guarda o tempo de espera', () => {
    expect(confirmar({ tipo: 'limite', tentarEmSegundos: 120 }).erroCodigo).toEqual({
      tipo: 'limite',
      tentarEmSegundos: 120,
    })
  })

  it('app indisponível na confirmação vai para "falha", não para lista vazia', () => {
    expect(confirmar({ tipo: 'indisponivel' }).tela).toBe('falha')
  })

  it('confirmação sem nenhuma unidade vai para "falha" (a tela manda ao WhatsApp)', () => {
    expect(aplicar(aplicar(estadoInicial, solicitado), confirmadoCom([])).tela).toBe('falha')
  })

  it('erro anterior some quando o código é aceito', () => {
    const errado = confirmar({ tipo: 'incorreto', tentativasRestantes: 1 })
    expect(aplicar(errado, confirmadoCom([U1])).erroCodigo).toBeNull()
  })
})

describe('CPF', () => {
  it('limite e entrada inválida ficam na tela do CPF', () => {
    const lim = aplicar(estadoInicial, {
      tipo: 'solicitar_respondido',
      agora: T0,
      resposta: { tipo: 'limite', tentarEmSegundos: 30 },
    })
    expect(lim.tela).toBe('cpf')
    expect(lim.erroCpf).toEqual({ tipo: 'limite', tentarEmSegundos: 30 })
    const inv = aplicar(estadoInicial, {
      tipo: 'solicitar_respondido',
      agora: T0,
      resposta: { tipo: 'entrada_invalida' },
    })
    expect(inv.tela).toBe('cpf')
    expect(inv.erroCpf).toEqual({ tipo: 'entrada_invalida' })
  })

  it('o erro do CPF some quando a solicitação é aceita', () => {
    const lim = aplicar(estadoInicial, {
      tipo: 'solicitar_respondido',
      agora: T0,
      resposta: { tipo: 'limite', tentarEmSegundos: 30 },
    })
    expect(aplicar(lim, solicitado).erroCpf).toBeNull()
  })
})

describe('reenvio (relógio injetado)', () => {
  it('só habilita depois de 60 s', () => {
    const e = aplicar(estadoInicial, solicitado)
    expect(reenvioHabilitado(e, T0)).toBe(false)
    expect(segundosParaReenvio(e, T0)).toBe(60)
    expect(reenvioHabilitado(e, T0 + 59_999)).toBe(false)
    expect(segundosParaReenvio(e, T0 + 59_001)).toBe(1)
    expect(reenvioHabilitado(e, T0 + 60_000)).toBe(true)
    expect(segundosParaReenvio(e, T0 + 60_000)).toBe(0)
  })

  it('nunca habilita antes de 60 s, mesmo se o app mandar menos', () => {
    const e = aplicar(estadoInicial, {
      tipo: 'solicitar_respondido',
      agora: T0,
      resposta: { tipo: 'ok', desafio: 'D'.repeat(22), reenvioEmSegundos: 5 },
    })
    expect(reenvioHabilitado(e, T0 + 5_000)).toBe(false)
  })

  it('reenviar reinicia a contagem e limpa o erro do código', () => {
    const errado = aplicar(estadoInicial, solicitado, {
      tipo: 'confirmar_respondido',
      agora: T0 + 61_000,
      resposta: { tipo: 'incorreto', tentativasRestantes: 1 },
    })
    const e = aplicar(errado, {
      tipo: 'reenviar_respondido',
      agora: T0 + 62_000,
      resposta: { tipo: 'ok', reenvioEmSegundos: 60 },
    })
    expect(e.erroCodigo).toBeNull()
    expect(reenvioHabilitado(e, T0 + 100_000)).toBe(false)
    expect(reenvioHabilitado(e, T0 + 122_000)).toBe(true)
  })

  it('reenvio com limite segura o botão pelo tempo informado', () => {
    const e = aplicar(estadoInicial, solicitado, {
      tipo: 'reenviar_respondido',
      agora: T0 + 61_000,
      resposta: { tipo: 'limite', tentarEmSegundos: 90 },
    })
    expect(e.erroCodigo).toEqual({ tipo: 'limite', tentarEmSegundos: 90 })
    expect(reenvioHabilitado(e, T0 + 61_000 + 89_000)).toBe(false)
    expect(reenvioHabilitado(e, T0 + 61_000 + 90_000)).toBe(true)
  })

  it('desafio expirado no reenvio manda recomeçar; indisponível vai a "falha"', () => {
    const exp = aplicar(estadoInicial, solicitado, {
      tipo: 'reenviar_respondido',
      agora: T0 + 61_000,
      resposta: { tipo: 'expirado' },
    })
    expect(exp.tela).toBe('expirada')
    const fal = aplicar(estadoInicial, solicitado, {
      tipo: 'reenviar_respondido',
      agora: T0 + 61_000,
      resposta: { tipo: 'indisponivel' },
    })
    expect(fal.tela).toBe('falha')
  })

  it('fora da tela do código não há reenvio', () => {
    expect(reenvioHabilitado(estadoInicial, T0 + 1_000_000)).toBe(false)
  })
})
