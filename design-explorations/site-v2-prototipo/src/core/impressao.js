/* Impressão: antes de imprimir, abre todos os <details>, desliga os ScrollTriggers (pins
   voltam ao lugar) e leva TODA animação ligada à rolagem ao estado final, inclusive as de
   gatilho único que ainda não dispararam (cenas fixadas por pin têm gancho próprio): quem imprime sem rolar a página não pode receber
   texto com opacidade zero. Depois roda os ganchos registrados pelas cenas. Ao voltar
   para a tela, cada animação retoma o progresso que tinha. Ouve beforeprint e
   matchMedia("print"), porque o segundo também dispara na emulação de mídia. */
import { ScrollTrigger } from "./motion.js";
import { executarGanchosImpressao } from "./util.js";

let imprimindo = false;
/** @type {HTMLDetailsElement[]} */
let fechados = [];
/** @type {Array<[gsap.core.Animation, number]>} */
let progressos = [];

/** Estado final de cada animação dirigida por ScrollTrigger; guarda o progresso anterior. */
function concluirAnimacoes() {
  progressos = [];
  for (const gatilho of ScrollTrigger.getAll()) {
    gatilho.disable(true);
    const animacao = gatilho.animation;
    // Cena fixada (pin) conta uma sequência em que o fim pode não ser o estado legível: ela
    // volta ao estado inicial do HTML e ajusta o que precisar com util.aoImprimir.
    if (!animacao || gatilho.pin) continue;
    progressos.push([animacao, animacao.progress()]);
    animacao.progress(1);
  }
}

/**
 * Fotos com loading="lazy" fora da tela ainda não baixaram e saem como caixa cinza na
 * impressão. Passam a eager: depois da carga (para não disputar banda com a primeira
 * dobra) e de novo no beforeprint, para quem imprime antes disso.
 */
function carregarFotosAdiadas() {
  for (const img of document.querySelectorAll('img[loading="lazy"]')) {
    if (img instanceof HTMLImageElement) img.loading = "eager";
  }
}

const ESPERA_FOTOS_MS = 2000;

function agendarFotosAdiadas() {
  const agendar = () => window.setTimeout(carregarFotosAdiadas, ESPERA_FOTOS_MS);
  if (document.readyState === "complete") agendar();
  else window.addEventListener("load", agendar, { once: true });
}

function prepararImpressao() {
  if (imprimindo) return;
  imprimindo = true;
  carregarFotosAdiadas();
  fechados = Array.from(document.querySelectorAll("details:not([open])"));
  for (const d of fechados) d.open = true;
  concluirAnimacoes();
  executarGanchosImpressao();
}

function restaurarTela() {
  if (!imprimindo) return;
  imprimindo = false;
  for (const d of fechados) d.open = false;
  fechados = [];
  for (const [animacao, progresso] of progressos) animacao.progress(progresso);
  progressos = [];
  for (const gatilho of ScrollTrigger.getAll()) gatilho.enable();
  ScrollTrigger.refresh();
}

export function iniciarImpressao() {
  agendarFotosAdiadas();
  window.addEventListener("beforeprint", prepararImpressao);
  window.addEventListener("afterprint", restaurarTela);
  const midia = window.matchMedia("print");
  midia.addEventListener("change", (e) => (e.matches ? prepararImpressao() : restaurarTela()));
}
