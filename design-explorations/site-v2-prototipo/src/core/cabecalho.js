/* Menu do header em tela estreita. Independe do GSAP: funciona mesmo se o movimento
   falhar. Fecha ao escolher um link e com Esc (o foco volta ao botão). */

export function iniciarMenu() {
  const cabecalho = document.querySelector("[data-cabecalho]");
  const botao = cabecalho?.querySelector("[data-menu]");
  const painel = cabecalho?.querySelector(".painel-menu");
  if (!(cabecalho instanceof HTMLElement) || !(botao instanceof HTMLElement) || !painel) {
    console.error("[menu] Header, botão [data-menu] ou .painel-menu ausente.");
    return;
  }
  const aberto = () => botao.getAttribute("aria-expanded") === "true";
  const definir = (abrir) => {
    botao.setAttribute("aria-expanded", String(abrir));
    cabecalho.toggleAttribute("data-menu-aberto", abrir);
  };
  botao.addEventListener("click", () => definir(!aberto()));
  painel.addEventListener("click", (evento) => {
    if (evento.target instanceof Element && evento.target.closest("a")) definir(false);
  });
  document.addEventListener("keydown", (evento) => {
    if (evento.key !== "Escape" || !aberto()) return;
    definir(false);
    botao.focus();
  });
}
