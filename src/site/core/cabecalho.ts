/* Menu do cabeçalho em tela estreita. Independe do GSAP: liga mesmo se o movimento falhar.
   Fecha ao escolher um link e com Esc (o foco volta ao botão). */

export function iniciarMenu(): () => void {
  const cabecalho = document.querySelector('[data-cabecalho]')
  const botao = cabecalho?.querySelector('[data-menu]')
  const painel = cabecalho?.querySelector('.painel-menu')
  if (!(cabecalho instanceof HTMLElement) || !(botao instanceof HTMLElement) || !painel) {
    throw new Error('[menu] Cabeçalho, botão [data-menu] ou .painel-menu ausente.')
  }
  const aberto = () => botao.getAttribute('aria-expanded') === 'true'
  const definir = (abrir: boolean) => {
    botao.setAttribute('aria-expanded', String(abrir))
    cabecalho.toggleAttribute('data-menu-aberto', abrir)
  }
  const aoClicarBotao = () => definir(!aberto())
  const aoClicarPainel = (evento: Event) => {
    if (evento.target instanceof Element && evento.target.closest('a')) definir(false)
  }
  const aoTeclar = (evento: KeyboardEvent) => {
    if (evento.key !== 'Escape' || !aberto()) return
    definir(false)
    botao.focus()
  }
  botao.addEventListener('click', aoClicarBotao)
  painel.addEventListener('click', aoClicarPainel)
  document.addEventListener('keydown', aoTeclar)
  return () => {
    botao.removeEventListener('click', aoClicarBotao)
    painel.removeEventListener('click', aoClicarPainel)
    document.removeEventListener('keydown', aoTeclar)
  }
}
