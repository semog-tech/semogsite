import type { ContextoCena } from '@/site/core/tipos'

/**
 * Cena da evolução (Tecnologia). Sem pin: o título sobe por máscara assim que aparece (ele chega
 * por cima da cobertura do mês) e "com a plataforma melhor." ganha peso; o texto vem linha a linha.
 * A linha das semanas acompanha a rolagem: as marcas céu correm da borda esquerda até esta semana,
 * o nó dela acende e o tracejado do que está em desenvolvimento se estende até a borda direita. O
 * cabeçalho acompanha o trecho sob ele (marinho em cima, claro no fim da descida).
 */
export function cenaEvolucao(ctx: ContextoCena): void {
  const { root, util } = ctx
  const titulo = exigir(root, '.ev-titulo')
  util.revelarTexto(titulo, { inicio: 'top bottom', duracao: 1.2 })
  util.revelarTexto(exigir(root, '.ev-texto'), {
    gatilho: titulo,
    inicio: 'top bottom',
    atraso: 0.3,
  })
  correrSemanas(ctx)
  seguirTema(ctx)
}

function exigir(raiz: Element, seletor: string): HTMLElement {
  const el = raiz.querySelector(seletor)
  if (!(el instanceof HTMLElement)) throw new Error(`[cena evolucao] falta ${seletor}.`)
  return el
}

/**
 * Semanas feitas, nó desta semana e o tracejado da próxima, presos à rolagem (scrub 0,7) entre a
 * linha entrar a 85% da tela e chegar a 45%. Os rótulos sobem por máscara uma vez.
 */
function correrSemanas({ gsap, root, util }: ContextoCena): void {
  const linha = exigir(root, '.ev-linha')
  gsap
    .timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: linha, start: 'top 85%', end: 'top 45%', scrub: 0.7 },
    })
    .fromTo(
      exigir(root, '.ev-feito'),
      { clipPath: 'inset(0% 100% 0% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.62 },
      0,
    )
    .fromTo(exigir(root, '.ev-agora'), { scale: 0 }, { scale: 1, duration: 0.1 }, 0.6)
    .fromTo(
      exigir(root, '.ev-proxima'),
      { clipPath: 'inset(0% 100% 0% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.3 },
      0.7,
    )
  const rotulos = gsap.fromTo(
    root.querySelectorAll('.ev-in'),
    { yPercent: 110 },
    {
      yPercent: 0,
      duration: 1,
      ease: 'expo.out',
      stagger: 0.12,
      scrollTrigger: { trigger: linha, start: 'top 55%', toggleActions: 'play none none none' },
    },
  )
  util.aoImprimir(() => rotulos.progress(1))
}

/**
 * O cabeçalho lê o data-tema da seção; aqui ele muda com o trecho sob a linha do cabeçalho:
 * marinho até 55% da descida, onde a luminosidade do gradiente cruza o meio, e claro daí em diante.
 * O tema escrito fora do GSAP volta ao do HTML no desmonte.
 */
function seguirTema({ root, ScrollTrigger, util }: ContextoCena): void {
  const temaOriginal = root.dataset.tema ?? 'marinho'
  util.registrarDesligamento(() => {
    root.dataset.tema = temaOriginal
  })
  ScrollTrigger.create({
    trigger: exigir(root, '.ev-descida'),
    start: '55% top+=68',
    end: 'bottom top+=68',
    onToggle: (self) => {
      root.dataset.tema = self.isActive ? 'claro' : 'marinho'
    },
  })
  util.aoImprimir(() => {
    root.dataset.tema = 'marinho'
  })
}
