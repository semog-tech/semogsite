import type { Dinamica } from '@/site/core/dinamica'
import type { ContextoCena } from '@/site/core/tipos'

/**
 * Cena dos princípios (A Semog). Sem pin: a própria rolagem desce do marinho ao branco. Um fio de
 * ponta reta acompanha a leitura (a ponta fica na altura de 60% da tela) e, ao chegar a cada
 * nome, acende o nó dele; nome e texto sobem por máscara. Na Dinâmica, o mesh do rebrand é vivo
 * (WebGL, só com a zona na tela). O cabeçalho acompanha o mundo sob ele.
 */
export function cenaPrincipios(ctx: ContextoCena): void {
  const { gsap, root, util, ScrollTrigger } = ctx
  const fio = exigir(root, '.pr-fio')
  const ultimoNo = exigir(root, '.pr-zona--dinamica .pr-no')
  const medirFio = () => {
    const altura = ultimoNo.getBoundingClientRect().top - root.getBoundingClientRect().top + 5
    fio.style.setProperty('--pr-fio', `${Math.round(altura)}px`)
  }
  medirFio()
  ScrollTrigger.addEventListener('refreshInit', medirFio)
  // O ouvinte e a medida postos fora do GSAP saem no desmonte (ou se a cena quebrar).
  util.registrarDesligamento(() => {
    ScrollTrigger.removeEventListener('refreshInit', medirFio)
    fio.style.removeProperty('--pr-fio')
  })
  gsap.fromTo(
    exigir(root, '.pr-fio-traco'),
    { scaleY: 0 },
    {
      scaleY: 1,
      ease: 'none',
      scrollTrigger: { trigger: fio, start: 'top 60%', end: 'bottom 60%', scrub: 0.7 },
    },
  )
  for (const zona of Array.from(root.querySelectorAll('.pr-zona'))) entrarZona(ctx, zona)
  seguirTema(ctx)
  ligarMesh(ctx)
}

function exigir(raiz: Element, seletor: string): HTMLElement {
  const el = raiz.querySelector(seletor)
  if (!(el instanceof HTMLElement)) throw new Error(`[cena principios] falta ${seletor}.`)
  return el
}

/**
 * O nó acende quando a ponta do fio (60% da tela) passa por ele; o nome sobe por máscara e o
 * texto vem linha a linha logo depois.
 */
function entrarZona({ gsap, util }: ContextoCena, zona: Element): void {
  const nome = exigir(zona, '.pr-nome')
  const no = exigir(zona, '.pr-no')
  gsap.fromTo(
    no,
    { scale: 0 },
    {
      scale: 1,
      duration: 0.6,
      ease: 'back.out(2.2)',
      scrollTrigger: { trigger: no, start: 'top 60%', toggleActions: 'play none none reverse' },
    },
  )
  util.revelarTexto(nome, { gatilho: nome, inicio: 'top 82%', duracao: 1.2 })
  util.revelarTexto(exigir(zona, '.pr-texto'), {
    gatilho: nome,
    inicio: 'top 82%',
    atraso: 0.25,
  })
}

/**
 * O cabeçalho lê o data-tema da seção; aqui ele muda com a zona sob a linha do cabeçalho. Na
 * Transparência, o trecho de cima ainda é escuro: passa a gelo a 40% da zona, onde a
 * luminosidade do gradiente cruza o meio.
 */
function seguirTema({ root, ScrollTrigger, util }: ContextoCena): void {
  const linha = 'top+=68'
  const trechos: ReadonlyArray<readonly [string, string, string, string]> = [
    ['.pr-zona--retidao', 'top', 'bottom', 'marinho'],
    ['.pr-zona--transparencia', 'top', '40%', 'marinho'],
    ['.pr-zona--transparencia', '40%', 'bottom', 'gelo'],
    ['.pr-zona--dinamica', 'top', 'bottom', 'claro'],
  ]
  for (const [seletor, de, ate, tema] of trechos) {
    ScrollTrigger.create({
      trigger: exigir(root, seletor),
      start: `${de} ${linha}`,
      end: `${ate} ${linha}`,
      onToggle: (self) => {
        if (self.isActive) root.dataset.tema = tema
      },
    })
  }
  util.aoImprimir(() => {
    root.dataset.tema = 'marinho'
  })
}

/**
 * Mesh vivo na Dinâmica. A mancha de névoa (cinza) segue `esc`: fica fora do quadro, para o mesh
 * ficar só em branco, céu e lavanda. Sem WebGL (Firefox headless, contexto perdido), segue o mesh
 * em CSS que já está por baixo: a cena reporta e não quebra.
 */
function ligarMesh({ root, util, ScrollTrigger, reportar }: ContextoCena): void {
  const zona = exigir(root, '.pr-zona--dinamica')
  const canvas = zona.querySelector('.pr-mesh')
  if (!(canvas instanceof HTMLCanvasElement)) throw new Error('[cena principios] falta o canvas.')
  let mesh: Dinamica | null = null
  const desligar = () => {
    mesh = null
    canvas.hidden = true
  }
  // O `hidden` é posto fora do GSAP: o canvas volta no desmonte.
  util.registrarDesligamento(() => {
    canvas.hidden = false
  })
  try {
    mesh = util.criarDinamica(canvas, { esc: [1.6, 1.4], escuro: 0, aoFalhar: desligar })
    mesh.redimensionar()
    mesh.desenhar(0)
  } catch (erro) {
    reportar(erro, 'dinamica')
    desligar()
    return
  }
  const redimensionar = () => mesh?.redimensionar()
  ScrollTrigger.addEventListener('refresh', redimensionar)
  util.registrarDesligamento(() => ScrollTrigger.removeEventListener('refresh', redimensionar))
  util.lacoVisivel(zona, (tempo) => mesh?.desenhar(tempo))
}
