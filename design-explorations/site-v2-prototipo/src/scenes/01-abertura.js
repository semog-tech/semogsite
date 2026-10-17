/**
 * Cena 01 · abertura "Metades". À esquerda, as quatro Unidades Semog em sequência: cada
 * foto entra por uma cortina reta da direita, com a imagem assentando por dentro dela, e
 * respira num Ken Burns lento. À direita, o slogan sobe linha a linha por máscara,
 * "morar." ganha peso, e a etapa 1 do pedido de proposta entra em cascata.
 *
 * Encadeamento: a cortina da foto (expo.inOut 1,3 s) termina quando o título está no
 * meio da subida; o título termina quando o subtítulo sobe; o formulário entra por baixo
 * do subtítulo. Cada passo começa a ~30% do fim do anterior.
 *
 * @param {import("../core/tipos.js").ContextoCena} ctx
 */
export default function init({ gsap, SplitText, root, util, pronto }) {
  const slides = /** @type {HTMLElement[]} */ (Array.from(root.querySelectorAll(".slide")));
  const tl = entrada(gsap, SplitText, root, slides);
  tl.call(() => iniciarCarrossel(gsap, util, root, slides), undefined, 2);
  util.aoImprimir(() => tl.progress(1));
  parallax(gsap, root);
  // A entrada nasce pausada (estado inicial já aplicado) e toca com fontes e fotos prontas.
  pronto.then(
    () => tl.play(),
    (erro) => {
      console.error("[cena abertura] pronto falhou; entrada vai ao fim.", erro);
      tl.progress(1);
    },
  );
}

const DURACAO_SLIDE = 6.5;
const TROCA = 1.3;

/** @param {import("../core/tipos.js").Gsap} gsap */
function entrada(gsap, SplitText, root, slides) {
  const tl = gsap.timeline({ paused: true, delay: 0.1 });
  tl.fromTo(
    root.querySelector(".vitrine-moldura"),
    { clipPath: "inset(100% 0% 0% 0%)" },
    { clipPath: "inset(0% 0% 0% 0%)", duration: TROCA, ease: "expo.inOut" },
  )
    .fromTo(
      slides[0].querySelector("img"),
      { scale: 1.3 },
      { scale: 1.08, duration: 1.8, ease: "expo.out" },
      0.2,
    )
    .from(
      root.querySelectorAll(".abertura-titulo .linha-interna"),
      { yPercent: 110, duration: 1.3, ease: "expo.out", stagger: 0.11 },
      0.7,
    )
    .fromTo(
      root.querySelectorAll(".abertura-titulo .peso"),
      { fontVariationSettings: '"wght" 250' },
      { fontVariationSettings: '"wght" 650', duration: 1.5, ease: "power2.inOut" },
      1.3,
    )
    .from(
      root.querySelector(".vitrine-legenda"),
      { clipPath: "inset(0% 100% 0% 0%)", duration: 1, ease: "expo.out" },
      1.4,
    );
  entradaSubtitulo(SplitText, root.querySelector(".abertura-sub"), tl, 1.15);
  entradaFormulario(root, tl, 1.45);
  return tl;
}

/**
 * O subtítulo sobe por linhas; ao fim da entrada a divisão é desfeita, para o texto
 * voltar a quebrar sozinho se a largura mudar.
 */
function entradaSubtitulo(SplitText, sub, tl, em) {
  if (!(sub instanceof HTMLElement)) return;
  const split = SplitText.create(sub, { type: "lines", mask: "lines", linesClass: "revela-linha" });
  tl.from(split.lines, { yPercent: 110, duration: 1, ease: "expo.out", stagger: 0.08 }, em);
  tl.call(() => split.revert());
}

/**
 * Os campos da etapa 1 entram em cascata por máscara de baixo para cima. Ao fim, o
 * clip-path sai do elemento: ele cortaria o contorno de foco e a mensagem de erro.
 */
function entradaFormulario(root, tl, em) {
  const itens = root.querySelectorAll(".abertura-form .entrada");
  tl.fromTo(
    itens,
    { clipPath: "inset(0% 0% 100% 0%)", y: 21 },
    {
      clipPath: "inset(0% 0% 0% 0%)",
      y: 0,
      duration: 1,
      ease: "expo.out",
      stagger: 0.09,
      clearProps: "clipPath,transform",
    },
    em,
  );
}

/** A foto desce devagar enquanto a página sobe (a moldura tem folga no alto para isso). */
function parallax(gsap, root) {
  gsap.to(root.querySelector(".vitrine-moldura"), {
    yPercent: 6,
    ease: "none",
    scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: 0.7 },
  });
}

/* ---- Carrossel das Unidades ----------------------------------------------------- */

/** Respiração lenta: só escala, sempre ≥ 1, então a foto nunca descobre a de baixo. */
function kenBurns(gsap, slide) {
  return gsap.fromTo(
    slide.querySelector("img"),
    { scale: 1.08 },
    { scale: 1, duration: DURACAO_SLIDE + TROCA, ease: "none" },
  );
}

function encherPasso(gsap, passo) {
  return gsap.fromTo(
    passo,
    { "--passo": 0 },
    { "--passo": 1, duration: DURACAO_SLIDE, ease: "none" },
  );
}

/**
 * A próxima foto entra por cortina reta da direita e a imagem assenta por dentro dela
 * (5% → 0, menos que a folga do Ken Burns: nenhuma borda aparece). A anterior fica
 * parada embaixo e, coberta, volta a ficar fechada.
 */
function trocarSlide(gsap, anterior, proxima) {
  gsap.set(anterior, { zIndex: 1 });
  gsap.set(proxima, { zIndex: 2, clipPath: "inset(0% 0% 0% 100%)" });
  gsap.fromTo(
    proxima.querySelector("img"),
    { xPercent: 5 },
    { xPercent: 0, duration: TROCA, ease: "expo.inOut" },
  );
  gsap.to(proxima, {
    clipPath: "inset(0% 0% 0% 0%)",
    duration: TROCA,
    ease: "expo.inOut",
    onComplete: () => gsap.set(anterior, { zIndex: 0, clipPath: "inset(0% 0% 0% 100%)" }),
  });
}

/**
 * O relógio só anda com a cena na tela e a aba visível; Ken Burns e barra de
 * progresso param junto.
 */
function iniciarCarrossel(gsap, util, root, slides) {
  const legenda = root.querySelector("[data-cidade-atual]");
  const passos = Array.from(root.querySelectorAll(".vitrine-passos i"));
  gsap.set(slides.slice(1), { visibility: "visible", clipPath: "inset(0% 0% 0% 100%)", zIndex: 0 });
  gsap.set(slides[0], { zIndex: 1 });
  const estado = {
    atual: 0,
    respiro: kenBurns(gsap, slides[0]),
    passo: encherPasso(gsap, passos[0]),
  };

  const avancar = () => {
    const anterior = slides[estado.atual];
    estado.atual = (estado.atual + 1) % slides.length;
    const proxima = slides[estado.atual];
    trocarSlide(gsap, anterior, proxima);
    estado.respiro.kill();
    estado.respiro = kenBurns(gsap, proxima);
    if (legenda instanceof HTMLElement) util.trocarTexto(legenda, proxima.dataset.cidade ?? "");
    estado.passo.kill();
    passos.forEach((el, i) => gsap.set(el, { "--passo": i < estado.atual ? 1 : 0 }));
    estado.passo = encherPasso(gsap, passos[estado.atual]);
  };
  const relogio = util.relogioVisivel(root, DURACAO_SLIDE, avancar, (pausado) => {
    estado.respiro.paused(pausado);
    estado.passo.paused(pausado);
  });
  if (relogio.paused()) {
    estado.respiro.pause();
    estado.passo.pause();
  }
}
