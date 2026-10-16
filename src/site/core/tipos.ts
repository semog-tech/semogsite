import type { gsap } from 'gsap'
import type { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { SplitText } from 'gsap/SplitText'
import type Lenis from 'lenis'
import type { conteudo } from '../conteudo/conteudo'
import type { Reportar } from './ganchos'
import type * as util from './util'

/**
 * O que cada cena recebe no `init(ctx)` (o mesmo contrato do protótipo). Regras da porta:
 * pins nascem no init, de forma síncrona; laço só por `util.lacoVisivel`; todo
 * `addEventListener` fora do GSAP precisa sair no desmonte: o init devolve uma função de
 * limpeza (o `gsap.context` a chama no `revert`) ou usa `util.aoRolar`/`util.lacoVisivel`.
 */
export type ContextoCena = {
  gsap: typeof gsap
  ScrollTrigger: typeof ScrollTrigger
  SplitText: typeof SplitText
  /** `null` se o Lenis falhou; a rolagem nativa segue. */
  lenis: Lenis | null
  util: typeof util
  conteudo: typeof conteudo
  /**
   * Resolve quando fontes e load chegaram e `html.motion` foi marcada (no máximo ~5 s). Rejeita
   * com `DesmontadoAntesDoPronto` se a página desmontar antes; o `.catch` da cena manda a
   * `ctx.reportar`, que ignora esse caso.
   */
  pronto: Promise<void>
  /** A `<section>` da cena. Selecione sempre a partir dela. */
  root: HTMLElement
  /** Verdadeiro em tela estreita (até 760px), lido na hora. */
  estreito: () => boolean
  /**
   * Leva ao Sentry (via `montarPagina`) a falha de uma PARTE da cena que degrada sem derrubá-la,
   * por exemplo o canvas indisponível ou a foto sem `.moldura > img`. `origem` é o nome da
   * parte (`'campo'`, `'quadro'`); a montagem a grava como `cena:<id>:<origem>`. Nunca use
   * `console.error` sozinho para isso: a constraint do plano manda a falha ao Sentry.
   */
  reportar: Reportar
}

export type InitCena = (ctx: ContextoCena) => unknown

/** id da `<section>` e init, na ordem da página. */
export type ListaCenas = ReadonlyArray<readonly [id: string, init: InitCena]>
