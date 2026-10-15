import type Lenis from 'lenis'
import { conteudo } from '../conteudo/conteudo'
import { desligarTudo, type Reportar } from './ganchos'
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

/** Desfaz o que a cena montou, inclusive gatilhos criados fora do context (depois de await). */
function neutralizarCena(root: HTMLElement, contexto: gsap.Context): void {
  contexto.revert()
  for (const gatilho of ScrollTrigger.getAll()) {
    const alvo = gatilho.trigger
    if (alvo instanceof Element && root.contains(alvo)) gatilho.kill(true)
  }
  root.dataset.cenaErro = ''
}

function tratarFalhaDeCena(
  id: string,
  root: HTMLElement,
  contexto: gsap.Context,
  erro: unknown,
  { reportar, estado }: Apoio,
): void {
  reportar(erro, `cena:${id}`)
  try {
    neutralizarCena(root, contexto)
  } catch (erroLimpeza) {
    reportar(erroLimpeza, `cena:${id}:neutralizar`)
  }
  // Exceção no meio de um refresh deixa os pins das OUTRAS cenas sem espaçador. Fora da
  // montagem, um refresh global no próximo tique remonta todos.
  if (!estado.montando) {
    gsap.delayedCall(0, () => {
      if (!estado.encerrado) ScrollTrigger.refresh(true)
    })
  }
}

function montarCena(id: string, init: InitCena, apoio: ApoioCenas): gsap.Context | null {
  const root = document.getElementById(id)
  if (!root) {
    apoio.reportar(new Error(`<section id="${id}"> não está na página.`), `cena:${id}`)
    return null
  }
  const contexto = gsap.context(() => {}, root)
  const ctx: ContextoCena = {
    ...apoio.base,
    root,
    reportar: (erro, parte) => apoio.reportar(erro, `cena:${id}:${parte}`),
  }
  // O `Context.add` do GSAP 3.15 não tem try/finally: se o init lançasse aqui dentro, o
  // `_context` global ficaria preso neste contexto e os das cenas seguintes nasceriam como
  // filhos dele. Por isso o erro é guardado DENTRO da função e só tratado depois que o `add`
  // terminou. O valor devolvido continua sendo o do init (o GSAP guarda a limpeza em `_r`).
  const erros: unknown[] = []
  const retorno: unknown = contexto.add(() => {
    try {
      return init(ctx)
    } catch (erro) {
      erros.push(erro)
      return undefined
    }
  })
  if (erros.length > 0) {
    tratarFalhaDeCena(id, root, contexto, erros[0], apoio)
  } else if (retorno instanceof Promise) {
    retorno.catch((erro: unknown) => tratarFalhaDeCena(id, root, contexto, erro, apoio))
  }
  return contexto
}

function montarCenas(cenas: ListaCenas, apoio: ApoioCenas): gsap.Context[] {
  const contextos: gsap.Context[] = []
  for (const [id, init] of cenas) {
    const contexto = montarCena(id, init, apoio)
    if (contexto) contextos.push(contexto)
  }
  return contextos
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

export function montarPagina(cenas: ListaCenas, opcoes: OpcoesMontagem): () => void {
  const apoio: Apoio = {
    reportar: opcoes.reportar,
    estado: { montando: false, encerrado: false },
  }
  const desligar: Desligamentos = []
  const infra = ligarInfraestrutura(opcoes, desligar)

  apoio.estado.montando = true
  const base: Base = {
    gsap,
    ScrollTrigger,
    SplitText,
    lenis: infra.lenis,
    util,
    conteudo,
    pronto: infra.motion.pronto,
    estreito: util.estreito,
  }
  const contextos = montarCenas(cenas, { ...apoio, base })
  apoio.estado.montando = false

  ligarAposCenas(infra, apoio, desligar)
  return criarDesmonte(contextos, apoio, desligar)
}
