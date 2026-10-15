/* Posição da página em volta da montagem das cenas.
   As cenas criam os ScrollTriggers no init. ScrollTrigger.create() (e todo gatilho que não
   é de timeline) faz o refresh do próprio gatilho na hora, e esse refresh força o dos
   gatilhos anteriores que ainda não mediram. Com a página JÁ ROLADA nesse momento (recarga
   no meio da página, restauração de rolagem do host do Artifact, quem rola durante a
   primeira carga lenta, link com #âncora), um gatilho `once` que já ficou para trás
   dispara e se mata no meio desse laço; o GSAP então lê `.end` de um índice que sumiu
   ("Cannot read properties of undefined (reading 'end')"). A exceção derruba a cena que
   estava criando o gatilho e deixa os pins das outras revertidos.
   Por isso: a página vai ao topo antes das cenas (no topo nenhum `once` passou), um
   refresh global mede tudo de uma vez, e só então ela volta para onde estava, ou para a
   âncora do endereço. Tudo na mesma tarefa: não chega a pintar o topo. */
import { ScrollTrigger } from "./motion.js";

/** Elemento da âncora do endereço (#unidades), se existir. */
function alvoDaAncora() {
  if (location.hash.length < 2) return null;
  let id = location.hash.slice(1);
  try {
    id = decodeURIComponent(id);
  } catch {
    // Hash malformado (% solto): usa como veio; getElementById só não acha.
  }
  const alvo = document.getElementById(id);
  return alvo instanceof HTMLElement ? alvo : null;
}

/**
 * Rola sem animação para um y ou para um elemento (descontando o scroll-padding-top do
 * <html>, como as âncoras do Lenis). Mantém o Lenis e o ScrollTrigger em dia.
 * @param {import("lenis").default | null} lenis
 * @param {number | HTMLElement} destino
 */
function rolarAgora(lenis, destino) {
  if (lenis) {
    // O Lenis guarda o limite de rolagem da última medida; os pins acabaram de aumentar a
    // página e, sem remedir, o destino seria cortado no limite antigo.
    lenis.resize();
    lenis.scrollTo(destino, { immediate: true, force: true });
  } else {
    let y = destino;
    if (destino instanceof HTMLElement) {
      const folga = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop);
      y = destino.getBoundingClientRect().top + window.scrollY - (folga || 0);
    }
    window.scrollTo(0, Number(y));
  }
  ScrollTrigger.update();
}

/**
 * Leva a página ao topo antes de as cenas criarem os gatilhos.
 * @param {import("lenis").default | null} lenis
 * @returns {number} o y em que a página estava, para `assentarPosicao`
 */
export function irAoTopoParaMontar(lenis) {
  const y = window.scrollY;
  if (y > 0) rolarAgora(lenis, 0);
  return y;
}

/**
 * Depois que TODAS as cenas criaram os gatilhos: refresh global (que mede numa cópia da
 * lista, sem o problema acima) e volta à âncora do endereço ou ao y anterior.
 * @param {import("lenis").default | null} lenis
 * @param {number} y
 */
export function assentarPosicao(lenis, y) {
  ScrollTrigger.refresh(true);
  const ancora = alvoDaAncora();
  if (ancora) rolarAgora(lenis, ancora);
  else if (y > 0) rolarAgora(lenis, y);
}

let pessoaRolou = false;
for (const evento of ["wheel", "touchstart", "keydown", "pointerdown"]) {
  window.addEventListener(
    evento,
    () => {
      pessoaRolou = true;
    },
    { once: true, passive: true },
  );
}

/**
 * Quando fontes e imagens chegam, os pins são recalculados e a âncora muda de lugar; o
 * Firefox ainda refaz por conta própria o pulo para a âncora durante a carga, medindo
 * antes de os pins existirem (/#unidades caía em Ranking). Se a pessoa ainda não mexeu
 * na página (roda, toque, tecla, clique), volta à âncora.
 * @param {import("lenis").default | null} lenis
 */
export function reancorar(lenis) {
  const ancora = alvoDaAncora();
  if (!ancora || pessoaRolou) return;
  rolarAgora(lenis, ancora);
}
