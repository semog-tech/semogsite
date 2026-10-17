/* Tema do header: copia o data-tema da <section> que está sob a linha do header e
   marca o link da navegação da seção atual. Lê o DOM a cada quadro de rolagem, então
   funciona com pin do ScrollTrigger (a seção fixada continua sob a linha). Também
   liga o fundo do header (data-rolou) depois do primeiro respiro de rolagem. */
import { ScrollTrigger } from "./motion.js";
import { aoRolar } from "./util.js";

const ROLAGEM_PARA_FUNDO = 8;

/** @param {HTMLElement} cabecalho */
function linhaDeLeitura(cabecalho) {
  return cabecalho.getBoundingClientRect().bottom + 1;
}

/** @param {HTMLElement[]} secoes @param {number} y */
function secaoSobLinha(secoes, y) {
  for (const secao of secoes) {
    const caixa = secao.getBoundingClientRect();
    if (caixa.top <= y && caixa.bottom > y) return secao;
  }
  return null;
}

/** @param {HTMLElement} cabecalho @param {HTMLElement} secao */
function aplicar(cabecalho, secao) {
  const tema = secao.dataset.tema;
  if (tema && cabecalho.dataset.tema !== tema) cabecalho.dataset.tema = tema;
  for (const link of cabecalho.querySelectorAll("[data-secao-link]")) {
    if (link.getAttribute("data-secao-link") === secao.id) {
      link.setAttribute("aria-current", "location");
    } else link.removeAttribute("aria-current");
  }
}

/**
 * Liga a troca de tema. Chame depois que as cenas montaram seus pins.
 * @param {import("lenis").default | null} lenis
 */
export function iniciarTema(lenis) {
  const cabecalho = document.querySelector("[data-cabecalho]");
  if (!(cabecalho instanceof HTMLElement)) {
    console.error("[tema] Header [data-cabecalho] não encontrado.");
    return;
  }
  /** @type {HTMLElement[]} */
  const secoes = Array.from(
    document.querySelectorAll("main section[data-tema], footer[data-tema]"),
  );
  const atualizar = () => {
    const secao = secaoSobLinha(secoes, linhaDeLeitura(cabecalho));
    if (secao) aplicar(cabecalho, secao);
    cabecalho.toggleAttribute("data-rolou", window.scrollY > ROLAGEM_PARA_FUNDO);
  };
  aoRolar(atualizar, lenis);
  // Um refresh pode mover as seções sem evento de rolagem (cena que cresceu, pin recalculado).
  ScrollTrigger.addEventListener("refresh", atualizar);
  atualizar();
}
