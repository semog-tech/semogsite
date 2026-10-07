import type {
  CobrancaPublica,
  Desligada,
  RespostaCobrancas,
  RespostaConfirmar,
  RespostaLink,
  RespostaReenviar,
  RespostaSolicitar,
  ResultadoConfirmar,
  ResultadoSolicitar,
  UnidadePublica,
} from '@/lib/segundaVia/tipos'

/**
 * Redutor puro das telas da 2ª via. Sem DOM, sem relógio próprio (o `agora`
 * vem na ação, em ms) e sem I/O: as telas chamam as Server Actions e despacham
 * o resultado tal como veio. Aceita a resposta da API e o resultado da action
 * (que chega sem os tokens e com os casos decididos no site); `desligada` não
 * entra: a tela a despacha como `falhou`.
 *
 * O estado NUNCA guarda CPF, código, token de desafio/sessão nem a URL do
 * boleto (credencial): isso fica nos cookies HttpOnly ou só na ação que abre
 * a aba.
 */

export type TelaSegundaVia =
  | 'cpf'
  | 'codigo'
  | 'unidades'
  | 'boletos'
  | 'boleto'
  | 'expirada'
  | 'falha'

/** Reenvio só depois de 60 s: o piso vale mesmo que o app diga menos. */
const REENVIO_MINIMO_S = 60

export type ErroCpf =
  | { tipo: 'entrada_invalida' }
  | { tipo: 'anti_robo' }
  | { tipo: 'limite'; tentarEmSegundos: number }

export type ErroCodigo =
  | { tipo: 'incorreto'; tentativasRestantes: number }
  | { tipo: 'expirado' }
  | { tipo: 'bloqueado' }
  | { tipo: 'limite'; tentarEmSegundos: number }
  /** Código fora de 6 dígitos, recusado no site sem gastar tentativa. */
  | { tipo: 'formato' }

/**
 * Conteúdo da tela de boletos. `carregando` e `nao_consultou` são estados
 * distintos de "sem boletos": situação indeterminada nunca vira lista vazia.
 */
export type BoletosDaUnidade =
  | { modo: 'carregando' }
  | { modo: 'lista'; cobrancas: CobrancaPublica[]; haRestritas: boolean }
  | { modo: 'so_restritas' }
  | { modo: 'sem_boletos' }
  | { modo: 'nao_consultou' }

export type EstadoSegundaVia = {
  tela: TelaSegundaVia
  /** Tela em que a falha aconteceu; só tem valor quando `tela === 'falha'`. */
  falhaEm: TelaSegundaVia | null
  erroCpf: ErroCpf | null
  erroCodigo: ErroCodigo | null
  /** ms do relógio injetado a partir do qual o reenvio é permitido. */
  reenvioLiberadoEm: number | null
  unidades: UnidadePublica[]
  unidade: UnidadePublica | null
  boletos: BoletosDaUnidade
  cobranca: CobrancaPublica | null
  /** A cobrança aberta deixou de estar disponível entre a lista e o clique. */
  avisoLink: 'cobranca_indisponivel' | null
}

export const estadoInicial: EstadoSegundaVia = {
  tela: 'cpf',
  falhaEm: null,
  erroCpf: null,
  erroCodigo: null,
  reenvioLiberadoEm: null,
  unidades: [],
  unidade: null,
  boletos: { modo: 'carregando' },
  cobranca: null,
  avisoLink: null,
}

type AoSolicitar = RespostaSolicitar | Exclude<ResultadoSolicitar, Desligada>
type AoConfirmar = RespostaConfirmar | Exclude<ResultadoConfirmar, Desligada>

export type AcaoSegundaVia =
  | { tipo: 'solicitar_respondido'; agora: number; resposta: AoSolicitar }
  | { tipo: 'reenviar_respondido'; agora: number; resposta: RespostaReenviar }
  | { tipo: 'confirmar_respondido'; agora: number; resposta: AoConfirmar }
  | { tipo: 'escolher_unidade'; ref: string }
  | { tipo: 'cobrancas_respondido'; resposta: RespostaCobrancas }
  | { tipo: 'escolher_cobranca'; ref: string }
  | { tipo: 'link_respondido'; resposta: RespostaLink }
  | { tipo: 'voltar' }
  /** O cookie da sessão já não existe no navegador (Review Focus 4). */
  | { tipo: 'sessao_expirada' }
  /** Nova consulta da lista ("Tentar de novo" depois de não conseguir consultar). */
  | { tipo: 'reconsultar' }
  /** A action lançou (rede) ou a 2ª via foi desligada no meio do fluxo. */
  | { tipo: 'falhou' }
  | { tipo: 'recomecar' }

function falha(estado: EstadoSegundaVia): EstadoSegundaVia {
  if (estado.tela === 'falha') return estado
  return { ...estado, tela: 'falha', falhaEm: estado.tela }
}

/** Sessão encerrada: descarta tudo o que veio depois do código. */
function expirada(estado: EstadoSegundaVia): EstadoSegundaVia {
  return {
    ...estado,
    tela: 'expirada',
    falhaEm: null,
    unidades: [],
    unidade: null,
    boletos: estadoInicial.boletos,
    cobranca: null,
    avisoLink: null,
  }
}

function liberaEm(agora: number, segundos: number): number {
  return agora + Math.max(segundos, REENVIO_MINIMO_S) * 1000
}

function aoSolicitar(estado: EstadoSegundaVia, agora: number, r: AoSolicitar) {
  switch (r.tipo) {
    case 'ok':
      return {
        ...estado,
        tela: 'codigo' as const,
        erroCpf: null,
        erroCodigo: null,
        reenvioLiberadoEm: liberaEm(agora, r.reenvioEmSegundos),
      }
    case 'entrada_invalida':
    case 'anti_robo':
      return { ...estado, erroCpf: r }
    case 'limite':
      return { ...estado, erroCpf: r }
    case 'indisponivel':
      return falha(estado)
  }
}

function aoReenviar(estado: EstadoSegundaVia, agora: number, r: RespostaReenviar) {
  switch (r.tipo) {
    case 'ok':
      return {
        ...estado,
        erroCodigo: null,
        reenvioLiberadoEm: liberaEm(agora, r.reenvioEmSegundos),
      }
    case 'limite':
      return {
        ...estado,
        erroCodigo: r,
        reenvioLiberadoEm: agora + r.tentarEmSegundos * 1000,
      }
    case 'expirado':
      return expirada(estado)
    case 'indisponivel':
      return falha(estado)
  }
}

function comUnidades(estado: EstadoSegundaVia, unidades: UnidadePublica[]): EstadoSegundaVia {
  const base = { ...estado, erroCodigo: null, unidades, boletos: estadoInicial.boletos }
  // Cadastro mudou entre o envio e a confirmação: sem unidade, a tela manda ao WhatsApp.
  if (unidades.length === 0) return falha(base)
  if (unidades.length === 1) return { ...base, tela: 'boletos', unidade: unidades[0] ?? null }
  return { ...base, tela: 'unidades', unidade: null }
}

function aoConfirmar(estado: EstadoSegundaVia, r: AoConfirmar): EstadoSegundaVia {
  switch (r.tipo) {
    case 'ok':
      return comUnidades(estado, r.unidades)
    case 'incorreto':
    case 'expirado':
    case 'bloqueado':
    case 'limite':
    case 'formato':
      return { ...estado, erroCodigo: r }
    case 'indisponivel':
      return falha(estado)
  }
}

/** Traduz a resposta de `/cobrancas` sem nunca transformar dúvida em "sem boletos". */
export function boletosDa(r: Extract<RespostaCobrancas, { tipo: 'ok' }>): BoletosDaUnidade {
  const temLista = r.cobrancas.length > 0
  if (r.situacao === 'aberto' && temLista) {
    return { modo: 'lista', cobrancas: r.cobrancas, haRestritas: r.haRestritas }
  }
  if (r.situacao === 'aberto' && r.haRestritas) return { modo: 'so_restritas' }
  if (r.situacao === 'sem_aberto' && !temLista) {
    return r.haRestritas ? { modo: 'so_restritas' } : { modo: 'sem_boletos' }
  }
  // Indeterminado, ou resposta incoerente (aberto sem nada liberável, sem_aberto com itens).
  return { modo: 'nao_consultou' }
}

function aoListar(estado: EstadoSegundaVia, r: RespostaCobrancas): EstadoSegundaVia {
  switch (r.tipo) {
    case 'ok':
      return { ...estado, boletos: boletosDa(r), avisoLink: null }
    case 'sessao_invalida':
    case 'referencia_invalida':
      return expirada(estado)
    case 'indisponivel':
      return { ...estado, boletos: { modo: 'nao_consultou' } }
  }
}

function aoLink(estado: EstadoSegundaVia, r: RespostaLink): EstadoSegundaVia {
  switch (r.tipo) {
    case 'ok':
      return estado
    case 'cobranca_indisponivel':
      return {
        ...estado,
        tela: 'boletos',
        cobranca: null,
        boletos: estadoInicial.boletos,
        avisoLink: 'cobranca_indisponivel',
      }
    case 'sessao_invalida':
    case 'referencia_invalida':
      return expirada(estado)
    case 'indisponivel':
      return falha(estado)
  }
}

function escolherUnidade(estado: EstadoSegundaVia, ref: string): EstadoSegundaVia {
  const unidade = estado.unidades.find((u) => u.ref === ref)
  if (estado.tela !== 'unidades' || !unidade) return estado
  return { ...estado, tela: 'boletos', unidade, boletos: estadoInicial.boletos, avisoLink: null }
}

function escolherCobranca(estado: EstadoSegundaVia, ref: string): EstadoSegundaVia {
  if (estado.tela !== 'boletos' || estado.boletos.modo !== 'lista') return estado
  const cobranca = estado.boletos.cobrancas.find((c) => c.ref === ref)
  return cobranca ? { ...estado, tela: 'boleto', cobranca } : estado
}

function voltar(estado: EstadoSegundaVia): EstadoSegundaVia {
  switch (estado.tela) {
    case 'codigo':
      return { ...estado, tela: 'cpf', erroCodigo: null, reenvioLiberadoEm: null }
    case 'boleto':
      return { ...estado, tela: 'boletos', cobranca: null }
    case 'boletos':
      // Com uma unidade só, "unidades" foi pulada; voltar ao código pediria outro.
      if (estado.unidades.length < 2) return estado
      return {
        ...estado,
        tela: 'unidades',
        unidade: null,
        boletos: estadoInicial.boletos,
        avisoLink: null,
      }
    default:
      return estado
  }
}

function reconsultar(estado: EstadoSegundaVia): EstadoSegundaVia {
  if (estado.tela !== 'boletos') return estado
  return { ...estado, boletos: estadoInicial.boletos }
}

function aoSessaoExpirar(estado: EstadoSegundaVia): EstadoSegundaVia {
  const posCodigo =
    estado.tela === 'unidades' || estado.tela === 'boletos' || estado.tela === 'boleto'
  return posCodigo ? expirada(estado) : estado
}

export function reduzirSegundaVia(
  estado: EstadoSegundaVia,
  acao: AcaoSegundaVia,
): EstadoSegundaVia {
  switch (acao.tipo) {
    case 'solicitar_respondido':
      return aoSolicitar(estado, acao.agora, acao.resposta)
    case 'reenviar_respondido':
      return aoReenviar(estado, acao.agora, acao.resposta)
    case 'confirmar_respondido':
      return aoConfirmar(estado, acao.resposta)
    case 'escolher_unidade':
      return escolherUnidade(estado, acao.ref)
    case 'cobrancas_respondido':
      return aoListar(estado, acao.resposta)
    case 'escolher_cobranca':
      return escolherCobranca(estado, acao.ref)
    case 'link_respondido':
      return aoLink(estado, acao.resposta)
    case 'voltar':
      return voltar(estado)
    case 'sessao_expirada':
      return aoSessaoExpirar(estado)
    case 'reconsultar':
      return reconsultar(estado)
    case 'falhou':
      return falha(estado)
    case 'recomecar':
      return estadoInicial
  }
}

/** Reenvio só habilita na tela do código e depois do prazo (relógio injetado, ms). */
export function reenvioHabilitado(estado: EstadoSegundaVia, agora: number): boolean {
  return (
    estado.tela === 'codigo' &&
    estado.reenvioLiberadoEm !== null &&
    segundosParaReenvio(estado, agora) === 0
  )
}

export function segundosParaReenvio(estado: EstadoSegundaVia, agora: number): number {
  if (estado.reenvioLiberadoEm === null) return 0
  return Math.max(0, Math.ceil((estado.reenvioLiberadoEm - agora) / 1000))
}

/** Antes de saber quantas unidades há, o indicador conta 3 etapas (o caminho comum). */
export function etapaVisivel(estado: EstadoSegundaVia): { atual: number; total: 3 | 4 } {
  const total = estado.unidades.length > 1 ? 4 : 3
  const tela = estado.tela === 'falha' ? (estado.falhaEm ?? 'cpf') : estado.tela
  switch (tela) {
    case 'codigo':
      return { atual: 2, total }
    case 'unidades':
      return { atual: 3, total }
    case 'boletos':
    case 'boleto':
      return { atual: total, total }
    default:
      return { atual: 1, total }
  }
}
