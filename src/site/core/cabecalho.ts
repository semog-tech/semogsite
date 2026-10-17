/* Menu do cabeçalho em tela estreita. Independe do GSAP: liga mesmo se o movimento falhar.
   Fecha ao escolher um item (link ou botão), com Esc (o foco volta ao botão) e quando a tela alarga
   além do ponto em que o menu existe. Aberto, o Tab fica preso entre o botão e os itens do painel
   (DP13 do plano da fase 4). */

/** O mesmo ponto do CSS (`@media (max-width: 1080px)` em base.css). */
export const LARGURA_DO_MENU = '(max-width: 1080px)'

function itensDoPainel(painel: Element): HTMLElement[] {
  return Array.from(painel.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'))
}

export function iniciarMenu(): () => void {
  const cabecalho = document.querySelector('[data-cabecalho]')
  const botao = cabecalho?.querySelector('[data-menu]')
  const painel = cabecalho?.querySelector('.painel-menu')
  if (!(cabecalho instanceof HTMLElement) || !(botao instanceof HTMLElement) || !painel) {
    throw new Error('[menu] Cabeçalho, botão [data-menu] ou .painel-menu ausente.')
  }
  const midia = window.matchMedia(LARGURA_DO_MENU)
  const aberto = () => botao.getAttribute('aria-expanded') === 'true'
  const definir = (abrir: boolean) => {
    botao.setAttribute('aria-expanded', String(abrir))
    cabecalho.toggleAttribute('data-menu-aberto', abrir)
  }
  const aoClicarBotao = () => definir(!aberto())
  const aoClicarPainel = (evento: Event) => {
    if (evento.target instanceof Element && evento.target.closest('a, button')) definir(false)
  }
  const aoMudarLargura = () => {
    if (!midia.matches && aberto()) definir(false)
  }
  const prenderTab = (evento: KeyboardEvent) => {
    const ciclo = [botao, ...itensDoPainel(painel)]
    const primeiro = ciclo[0]
    const ultimo = ciclo[ciclo.length - 1]
    const ativo = document.activeElement
    if (evento.shiftKey && ativo === primeiro) {
      evento.preventDefault()
      ultimo.focus()
    } else if (!evento.shiftKey && ativo === ultimo) {
      evento.preventDefault()
      primeiro.focus()
    } else if (!ciclo.some((item) => item === ativo)) {
      evento.preventDefault()
      primeiro.focus()
    }
  }
  const aoTeclar = (evento: KeyboardEvent) => {
    if (!aberto()) return
    if (evento.key === 'Escape') {
      definir(false)
      botao.focus()
    } else if (evento.key === 'Tab') {
      prenderTab(evento)
    }
  }
  botao.addEventListener('click', aoClicarBotao)
  painel.addEventListener('click', aoClicarPainel)
  document.addEventListener('keydown', aoTeclar)
  midia.addEventListener('change', aoMudarLargura)
  return () => {
    botao.removeEventListener('click', aoClicarBotao)
    painel.removeEventListener('click', aoClicarPainel)
    document.removeEventListener('keydown', aoTeclar)
    midia.removeEventListener('change', aoMudarLargura)
  }
}
