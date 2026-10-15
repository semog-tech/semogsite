/**
 * Gestão · troca de administradora. Sem pin: o título sobe por máscara e "sem interromper
 * nada." ganha peso. Os dois trilhos andam com a rolagem (scrub 0,7) pela mesma variável
 * --gtr-p: o traço da troca e as marcas dos boletos ficam marinho juntos. Cada passo sobe
 * quando o traço chega ao seu nó (uma vez); o ponto de cada nó no trilho é medido a cada
 * refresh, porque no celular o trilho fica em pé.
 *
 * @param {import("../../core/tipos.js").ContextoCena} ctx
 */
export default function init(ctx) {
  const { gsap, root, util } = ctx;
  util.revelarTexto(exigir(root, ".gtr-titulo"), { duracao: 1.2, stagger: 0.09 });
  const faixa = exigir(root, ".gtr-faixa");
  const trilho = exigir(root, ".gtr-trilho");
  const passos = Array.from(root.querySelectorAll(".gtr-passo")).filter(
    (el) => el instanceof HTMLElement,
  );
  if (passos.length !== 3) throw new Error("[cena troca-de-administradora] esperava 3 passos.");
  const entradas = passos.map((passo) => montarPasso(gsap, passo));
  /** @type {number[]} */
  let limiares = medirLimiares(trilho, passos);
  const avancar = (/** @type {number} */ p) => {
    entradas.forEach((tl, i) => {
      if (p >= limiares[i] && tl.progress() === 0 && !tl.isActive()) tl.play();
    });
  };
  // O onUpdate pode rodar já na criação (o scrub renderiza o estado inicial): lê a corrida
  // só depois que ela existe.
  /** @type {gsap.core.Tween | null} */
  let corrida = null;
  corrida = gsap.fromTo(
    faixa,
    { "--gtr-p": 0 },
    {
      "--gtr-p": 1,
      ease: "none",
      scrollTrigger: { trigger: faixa, start: "top 78%", end: "bottom 62%", scrub: 0.7 },
      onUpdate: () => {
        if (corrida) avancar(corrida.progress());
      },
    },
  );
  ctx.ScrollTrigger.addEventListener("refresh", () => {
    limiares = medirLimiares(trilho, passos);
    if (corrida) avancar(corrida.progress());
  });
  const fim = corrida;
  util.aoImprimir(() => {
    fim.progress(1);
    for (const tl of entradas) tl.progress(1);
  });
}

/** @param {Element} raiz @param {string} seletor @returns {HTMLElement} */
function exigir(raiz, seletor) {
  const el = raiz.querySelector(seletor);
  if (!(el instanceof HTMLElement)) {
    throw new Error(`[cena troca-de-administradora] falta ${seletor}.`);
  }
  return el;
}

/**
 * Entrada de um passo, pausada: o nó assenta e o título e o texto sobem por máscara.
 * @param {import("../../core/tipos.js").Gsap} gsap @param {HTMLElement} passo
 */
function montarPasso(gsap, passo) {
  const no = passo.querySelector(".gtr-no");
  const textos = passo.querySelectorAll(".gtr-passo-titulo, .gtr-passo-texto");
  return gsap
    .timeline({ paused: true })
    .fromTo(no, { scale: 0 }, { scale: 1, duration: 0.6, ease: "back.out(2)" }, 0)
    .fromTo(
      textos,
      { clipPath: "inset(0% 0% 100% 0%)", y: 21 },
      {
        clipPath: "inset(0% 0% 0% 0%)",
        y: 0,
        duration: 1.1,
        ease: "expo.out",
        stagger: 0.08,
        clearProps: "clipPath,transform",
      },
      0.1,
    );
}

/**
 * Fração do trilho (0 a 1) em que fica o nó de cada passo: em x no desktop, em y no celular
 * (o trilho mais alto que largo está em pé).
 * @param {HTMLElement} trilho @param {HTMLElement[]} passos
 */
function medirLimiares(trilho, passos) {
  const caixa = trilho.getBoundingClientRect();
  const emPe = caixa.height > caixa.width;
  return passos.map((passo) => {
    const no = passo.querySelector(".gtr-no")?.getBoundingClientRect();
    if (!no) throw new Error("[cena troca-de-administradora] passo sem nó.");
    const ponto = emPe
      ? (no.top + no.height / 2 - caixa.top) / caixa.height
      : (no.left + no.width / 2 - caixa.left) / caixa.width;
    return Math.min(1, Math.max(0, ponto));
  });
}
