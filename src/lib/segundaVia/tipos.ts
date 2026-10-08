/**
 * Corpos e respostas da API pública de 2ª via do semogapp, espelhando a seção
 * "Contrato da API" da spec. Tipos puros, sem 'use server': servem ao cliente
 * HTTP, às Server Actions e às telas. `nonce` não aparece nos corpos porque o
 * cliente o acrescenta sozinho.
 */

export type RotaSegundaVia =
  | 'solicitar'
  | 'reenviar'
  | 'confirmar'
  | 'cobrancas'
  | 'link'
  | 'encerrar'

export type UnidadePublica = { ref: string; condominio: string; unidade: string }

export type CobrancaPublica = {
  ref: string
  /** AAAA-MM-DD */
  vencimento: string
  /** Centavos inteiros, sempre o valor de emissão; `null` = o ERP não trouxe valor legível. */
  valorCentavos: number | null
  vencida: boolean
  /**
   * `false`: a cobrança foi baixada e não pode mais ser paga pelo link (o app
   * responderia 409 a `/link`). A tela mostra o boleto sem "Abrir boleto" e
   * nunca pede o link. Normalizado em `cliente.ts` a partir de
   * `disponivelPeloLink`/`motivoIndisponivel` do app.
   */
  disponivelPeloLink: boolean
}

export type SituacaoCobrancas = 'aberto' | 'sem_aberto' | 'indeterminado'

/** Corpo (sem `nonce`) de cada rota. */
export type CorposSegundaVia = {
  solicitar: { cpf: string; ipCliente: string }
  reenviar: { desafio: string; ipCliente: string }
  confirmar: { desafio: string; codigo: string; ipCliente: string }
  cobrancas: { sessao: string; unidade: string; ipCliente: string }
  link: { sessao: string; unidade: string; cobranca: string; ipCliente: string }
  encerrar: { sessao: string }
}

export type Limite = { tipo: 'limite'; tentarEmSegundos: number }
export type Indisponivel = { tipo: 'indisponivel' }

export type RespostaSolicitar =
  | { tipo: 'ok'; desafio: string; reenvioEmSegundos: number }
  | { tipo: 'entrada_invalida' }
  | Limite
  | Indisponivel

export type RespostaReenviar =
  | { tipo: 'ok'; reenvioEmSegundos: number }
  | { tipo: 'expirado' }
  | Limite
  | Indisponivel

export type RespostaConfirmar =
  | { tipo: 'ok'; sessao: string; expiraEmSegundos: number; unidades: UnidadePublica[] }
  | { tipo: 'incorreto'; tentativasRestantes: number }
  | { tipo: 'expirado' }
  | { tipo: 'bloqueado' }
  | Limite
  | Indisponivel

export type RespostaCobrancas =
  | { tipo: 'ok'; situacao: SituacaoCobrancas; haRestritas: boolean; cobrancas: CobrancaPublica[] }
  | { tipo: 'sessao_invalida' }
  | { tipo: 'referencia_invalida' }
  | Indisponivel

export type RespostaLink =
  | { tipo: 'ok'; url: string }
  | { tipo: 'cobranca_indisponivel' }
  | { tipo: 'sessao_invalida' }
  | { tipo: 'referencia_invalida' }
  | Indisponivel

export type RespostaEncerrar = { tipo: 'ok' } | Indisponivel

export type RespostasSegundaVia = {
  solicitar: RespostaSolicitar
  reenviar: RespostaReenviar
  confirmar: RespostaConfirmar
  cobrancas: RespostaCobrancas
  link: RespostaLink
  encerrar: RespostaEncerrar
}

export type CorpoDe<R extends RotaSegundaVia> = CorposSegundaVia[R]
export type RespostaDe<R extends RotaSegundaVia> = RespostasSegundaVia[R]

/**
 * Resultados das Server Actions (`_actions/segunda-via.ts`), o que o navegador
 * recebe. Partem das respostas do app sem os tokens (`desafio`, `sessao`), que
 * ficam só nos cookies HttpOnly, e somam os casos decididos no próprio site.
 */

/** `SEGUNDA_VIA_ATIVA` diferente de `'true'`: nada é chamado. */
export type Desligada = { tipo: 'desligada' }

export type ResultadoSolicitar =
  | { tipo: 'ok'; reenvioEmSegundos: number }
  | Exclude<RespostaSolicitar, { tipo: 'ok' }>
  | { tipo: 'anti_robo' }
  | Desligada

/** Sem cookie de desafio, `expirado` (o redutor leva à tela de consulta expirada). */
export type ResultadoReenviar = RespostaReenviar | Desligada

/** `formato`: código fora de 6 dígitos, recusado sem gastar tentativa no app. */
export type ResultadoConfirmar =
  | { tipo: 'ok'; unidades: UnidadePublica[] }
  | Exclude<RespostaConfirmar, { tipo: 'ok' }>
  | { tipo: 'formato' }
  | Desligada

/** Sem cookie de sessão, `sessao_invalida` (Review Focus 4), nunca `indisponivel`. */
export type ResultadoCobrancas = RespostaCobrancas | Desligada

export type ResultadoLink = RespostaLink | Desligada
