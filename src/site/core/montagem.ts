import type Lenis from 'lenis'
import { conteudo } from '../conteudo/conteudo'
import { coletarDesligamentos, desligarTudo, type Reportar } from './ganchos'
import { iniciarImpressao } from './impressao'
import {
  criarLenis,
  gsap,
  marcarMotionQuandoPronto,
  ScrollTrigger,
  SplitText,
  vigiarAltura,
} from './motion'
import { assentarPosicao, irAoTopoParaMontar, reancorar, vigiarPrimeiraInteracao } from './posicao'
import { iniciarTema } from './tema'
import type { ContextoCena, InitCena, ListaCenas } from './tipos'
import * as util from './util'

/**
 * Monta as cenas de uma página e devolve o desmonte (portado de main.js do protótipo). Cada
 * cena roda num gsap.context com escopo na própria seção: seletores em texto ficam restritos a
 * ela e, se a cena lançar, tudo o que criou é revertido, a seção volta ao HTML estático e as
 * outras seguem. O que não é GSAP (Lenis, ticker, listeners, observers) sai no desmonte.
 * A função pública se divide em três: ligar a infraestrutura, montar as cenas e desmontar.
 */
export type { Reportar }
export type OpcoesMontagem = { reportar: Reportar; criarLenis?: typeof criarLenis }

type Base = Omit<ContextoCena, 'root' | 'reportar'>
type Estado = { montando: boolean; encerrado: boolean }
type Apoio = { reportar: Reportar; estado: Estado }
type ApoioCenas = Apoio & { base: Base }
type Desligamentos = Array<() => void>
type Infra = {
  lenis: Lenis | null
  yHerdado: number
  interacao: ReturnType<typeof vigiarPrimeiraInteracao>
  motion: ReturnType<typeof marcarMotionQuandoPronto>
}

/** Uma cena montada: a seção, o contexto e o que ela registrou para desligar no `init`. */
type Cena = {
  id: string
  root: HTMLElement
  contexto: gsap.Context
  desligamentos: Desligamentos
  marcas: Marcas
}

/**
 * `class` e `data-*` da seção antes do init. O `revert` do GSAP não desfaz o que a cena pôs
 * direto no `classList` (o ranking marca `ranking-com-palco`), e o CSS de palco fixado
 * continuaria valendo com a cena morta: os textos ficariam um sobre o outro.
 */
type Marcas = { classe: string; dados: Array<[nome: string, valor: string]> }

function lerMarcas(root: HTMLElement): Marcas {
  const dados = Array.from(root.attributes)
    .filter(({ name }) => name.startsWith('data-'))
    .map(({ name, value }): [string, string] => [name, value])
  return { classe: root.className, dados }
}

function restaurarMarcas(root: HTMLElement, { classe, dados }: Marcas): void {
  root.className = classe
  for (const { name } of Array.from(root.attributes)) {
    if (name.startsWith('data-')) root.removeAttribute(name)
  }
  for (const [nome, valor] of dados) root.setAttribute(nome, valor)
}

/**
 * Desfaz o que a cena montou: o contexto, os gatilhos criados fora dele (depois de await), os
 * desligamentos que ela registrou (`util.aoRolar`, `util.lacoVisivel`,
 * `util.registrarDesligamento`), só os dela, e as classes e `data-*` que pôs na seção.
 */
function neutralizarCena(cena: Cena, reportar: Reportar): void {
  const { id, root, contexto, desligamentos } = cena
  contexto.revert()
  for (const gatilho of ScrollTrigger.getAll()) {
    const alvo = gatilho.trigger
    if (alvo instanceof Element && root.contains(alvo)) gatilho.kill(true)
  }
  for (const desligar of desligamentos) {
    try {
      desligar()
    } catch (erro) {
      reportar(erro, `cena:${id}:neutralizar`)
    }
  }
  restaurarMarcas(root, cena.marcas)
  root.dataset.cenaErro = ''
}

function tratarFalhaDeCena(cena: Cena, erro: unknown, { reportar, estado }: Apoio): void {
  reportar(erro, `cena:${cena.id}`)
  try {
    neutralizarCena(cena, reportar)
  } catch (erroLimpeza) {
    reportar(erroLimpeza, `cena:${cena.id}:neutralizar`)
  }
  // Exceção no meio de um refresh deixa os pins das OUTRAS cenas sem espaçador. Fora da
  // montagem, um refresh global no próximo tique remonta todos.
  if (!estado.montando) {
    gsap.delayedCall(0, () => {
      if (!estado.encerrado) ScrollTrigger.refresh(true)
    })
  }
}

type Execucao = { retorno: unknown; erros: unknown[]; desligamentos: Desligamentos }

/**
 * Roda o init no contexto da cena. O `Context.add` do GSAP 3.15 não tem try/finally: se o init
 * lançasse aqui dentro, o `_context` global ficaria preso neste contexto e os das cenas
 * seguintes nasceriam como filhos dele. Por isso o erro é guardado DENTRO da função e só
 * tratado depois que o `add` terminou. O valor devolvido continua sendo o do init (o GSAP
 * guarda a limpeza em `_r`).
 */
function executarInit(contexto: gsap.Context, init: InitCena, ctx: ContextoCena): Execucao {
  const execucao: Execucao = { retorno: undefined, erros: [], desligamentos: [] }
  execucao.desligamentos = coletarDesligamentos(() => {
    execucao.retorno = contexto.add(() => {
      try {
        return init(ctx)
      } catch (erro) {
        execucao.erros.push(erro)
        return undefined
      }
    })
  })
  return execucao
}

function montarCena(id: string, init: InitCena, apoio: ApoioCenas): gsap.Context | null {
  const root = document.getElementById(id)
  if (!root) {
    apoio.reportar(new Error(`<section id="${id}"> não está na página.`), `cena:${id}`)
    return null
  }
  const marcas = lerMarcas(root)
  const contexto = gsap.context(() => {}, root)
  const ctx: ContextoCena = {
    ...apoio.base,
    root,
    reportar: (erro, parte) => apoio.reportar(erro, `cena:${id}:${parte}`),
  }
  const { retorno, erros, desligamentos } = executarInit(contexto, init, ctx)
  const cena: Cena = { id, root, contexto, desligamentos, marcas }
  if (erros.length > 0) {
    tratarFalhaDeCena(cena, erros[0], apoio)
  } else if (retorno instanceof Promise) {
    retorno.catch((erro: unknown) => tratarFalhaDeCena(cena, erro, apoio))
  }
  return contexto
}

/** Preenche `contextos` à medida que monta, para o desmonte de emergência ver os já criados. */
function montarCenas(cenas: ListaCenas, apoio: ApoioCenas, contextos: gsap.Context[]): void {
  for (const [id, init] of cenas) {
    const contexto = montarCena(id, init, apoio)
    if (contexto) contextos.push(contexto)
  }
}

/** Ligar: Lenis, topo e promessa de `html.motion`. Cada item registra como se desliga. */
function ligarInfraestrutura(opcoes: OpcoesMontagem, desligar: Desligamentos): Infra {
  const restauracaoAntes = history.scrollRestoration
  history.scrollRestoration = 'manual'
  desligar.push(() => {
    history.scrollRestoration = restauracaoAntes
  })
  const lenisCriado = (opcoes.criarLenis ?? criarLenis)((erro) => opcoes.reportar(erro, 'lenis'))
  desligar.push(lenisCriado.desligar)
  const interacao = vigiarPrimeiraInteracao()
  desligar.push(interacao.desligar)
  // As cenas montam com a página no topo; ver core/posicao.ts.
  const yHerdado = irAoTopoParaMontar(lenisCriado.lenis)
  const motion = marcarMotionQuandoPronto()
  desligar.push(motion.cancelar)
  return { lenis: lenisCriado.lenis, yHerdado, interacao, motion }
}

/** Depois de TODAS as cenas: posição, tema, impressão, altura e reancoragem. */
function ligarAposCenas(infra: Infra, { reportar, estado }: Apoio, desligar: Desligamentos): void {
  const ligar = (origem: string, ligacao: () => () => void) => {
    try {
      desligar.push(ligacao())
    } catch (erro) {
      reportar(erro, origem)
    }
  }
  assentarPosicao(infra.lenis, infra.yHerdado)
  ligar('tema', () => iniciarTema(infra.lenis))
  ligar('impressão', () => iniciarImpressao(reportar))
  ligar('altura', vigiarAltura)
  infra.motion.pronto.then(
    () => {
      if (!estado.encerrado) reancorar(infra.lenis, infra.interacao.rolou)
    },
    (erro: unknown) => reportar(erro, 'motion'),
  )
}

/** Desmontar: reverte as cenas, mata os gatilhos e desliga tudo o que não é GSAP. */
function criarDesmonte(
  contextos: gsap.Context[],
  { reportar, estado }: Apoio,
  desligar: Desligamentos,
): () => void {
  return () => {
    estado.encerrado = true
    for (const contexto of [...contextos].reverse()) contexto.revert()
    for (const gatilho of ScrollTrigger.getAll()) gatilho.kill()
    for (const erro of desligarTudo()) reportar(erro, 'desmonte')
    for (const desligamento of [...desligar].reverse()) {
      try {
        desligamento()
      } catch (erro) {
        reportar(erro, 'desmonte')
      }
    }
    document.documentElement.classList.remove('motion')
  }
}

function criarBase(infra: Infra): Base {
  return {
    gsap,
    ScrollTrigger,
    SplitText,
    lenis: infra.lenis,
    util,
    conteudo,
    pronto: infra.motion.pronto,
    estreito: util.estreito,
  }
}

/**
 * Qualquer exceção fora das cenas (Lenis, topo, assentar a posição) é reportada como
 * `montagem`, desliga o que já foi ligado e devolve um desmonte vazio: a exceção não sai para o
 * `useGSAP`, que deixaria o contexto global do GSAP preso e trocaria a página pela tela de erro.
 * A página fica em HTML estático.
 */
export function montarPagina(cenas: ListaCenas, opcoes: OpcoesMontagem): () => void {
  const apoio: Apoio = {
    reportar: opcoes.reportar,
    estado: { montando: false, encerrado: false },
  }
  const desligar: Desligamentos = []
  const contextos: gsap.Context[] = []
  const desmontar = criarDesmonte(contextos, apoio, desligar)
  try {
    const infra = ligarInfraestrutura(opcoes, desligar)
    apoio.estado.montando = true
    montarCenas(cenas, { ...apoio, base: criarBase(infra) }, contextos)
    apoio.estado.montando = false
    ligarAposCenas(infra, apoio, desligar)
    return desmontar
  } catch (erro) {
    opcoes.reportar(erro, 'montagem')
    try {
      desmontar()
    } catch (erroDesmonte) {
      opcoes.reportar(erroDesmonte, 'desmonte')
    }
    return () => {}
  }
}
