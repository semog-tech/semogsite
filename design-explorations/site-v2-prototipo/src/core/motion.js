/* Lenis dirigido pelo ticker do GSAP, conforme o README do Lenis 1.3: o ScrollTrigger
   é atualizado a cada rolagem e o lagSmoothing fica desligado. O ticker do GSAP é o
   ÚNICO requestAnimationFrame da página: laços de desenho entram nele (util.lacoVisivel).
   O movimento NÃO consulta prefers-reduced-motion: decisão do Leandro. */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, SplitText);
/* Celular: a barra de endereço que some e volta muda a altura da janela; sem isto cada vez
   seria um refresh e os pins saltariam. O 3.15 já liga sozinho em aparelho só de toque;
   aqui fica explícito. O layout usa svh, que não muda com a barra. normalizeScroll e o
   syncTouch do Lenis ficaram de fora: medidos, o primeiro encurta todo flick rápido da
   página (rolagem pesada) e o segundo faz qualquer flick andar um patamar só. */
ScrollTrigger.config({ ignoreMobileResize: true });

/**
 * Cria o Lenis e o liga ao GSAP. Se falhar, a página segue com rolagem nativa.
 * As âncoras descontam o header sozinhas: o Lenis lê o scroll-padding-top do <html>.
 * @returns {Lenis | null}
 */
export function iniciarLenis() {
  try {
    // allowNestedScroll: uma caixa com rolagem própria (menu aberto) só segura o gesto
    // enquanto ainda tem para onde rolar. respectReducedMotion: false, pela decisão acima.
    const lenis = new Lenis({
      autoRaf: false,
      anchors: true,
      allowNestedScroll: true,
      respectReducedMotion: false,
    });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((tempo) => lenis.raf(tempo * 1000));
    gsap.ticker.lagSmoothing(0);
    return lenis;
  } catch (erro) {
    console.error("[motion] Lenis não iniciou; rolagem nativa.", erro);
    return null;
  }
}

const ESPERA_MAXIMA_MS = 5000;

/**
 * Espera fontes e o evento load, sem nunca rejeitar e nunca mais que 5 s: o pior caso é
 * não esperar. Sem o teto, uma imagem presa seguraria a entrada da abertura para sempre.
 */
async function esperarCarregamento() {
  const load =
    document.readyState === "complete"
      ? Promise.resolve()
      : new Promise((resolver) => window.addEventListener("load", resolver, { once: true }));
  const fontes = document.fonts ? document.fonts.ready : Promise.resolve();
  const teto = new Promise((resolver) => window.setTimeout(resolver, ESPERA_MAXIMA_MS));
  try {
    await Promise.race([Promise.all([load, fontes]), teto]);
  } catch (erro) {
    console.error("[motion] Falha esperando fontes/carregamento.", erro);
  }
}

/**
 * Marca `html.motion` depois que fontes e assets carregaram e recalcula os gatilhos.
 * CSS de estado inicial escondido fica sob `html.js:not(.motion)` ou é criado pelo GSAP.
 * @returns {Promise<void>} resolve quando a página está pronta para as entradas
 */
export async function marcarMotionQuandoPronto() {
  await esperarCarregamento();
  document.documentElement.classList.add("motion");
  ScrollTrigger.refresh();
}

const ESPERA_RECALCULO_MS = 180;
const midiaImpressao = window.matchMedia("print");

/**
 * Recalcula os ScrollTriggers quando a altura do <main> muda (cena que cresce depois de
 * montar, imagem que chega, fonte que troca a quebra de linha), uma vez por rajada.
 * A altura de referência é a medida depois de cada refresh, porque o próprio refresh
 * desfaz e refaz os pins: só uma diferença real dispara outro.
 */
export function vigiarAltura() {
  const main = document.querySelector("main");
  if (!(main instanceof HTMLElement) || typeof ResizeObserver === "undefined") {
    console.error("[motion] Sem <main> ou ResizeObserver; a altura não é vigiada.");
    return;
  }
  let referencia = main.offsetHeight;
  let espera = 0;
  ScrollTrigger.addEventListener("refresh", () => {
    referencia = main.offsetHeight;
  });
  const agendar = () => {
    window.clearTimeout(espera);
    espera = window.setTimeout(() => {
      if (midiaImpressao.matches || main.offsetHeight === referencia) return;
      ScrollTrigger.refresh();
    }, ESPERA_RECALCULO_MS);
  };
  new ResizeObserver(agendar).observe(main);
  for (const img of document.images) {
    if (!img.complete) img.addEventListener("load", agendar, { once: true });
  }
  document.fonts?.ready.then(agendar, (erro) =>
    console.error("[motion] fonts.ready falhou.", erro),
  );
}

export { gsap, ScrollTrigger, SplitText };
