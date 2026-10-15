/**
 * Incorporadoras · abertura. Quando a página fica pronta, a promessa sobe linha a linha e
 * "bem antes das chaves." ganha peso; a moldura da obra abre de baixo ~30% depois, com a
 * foto assentando do zoom; o lead e as ações vêm em seguida. Os quatro números entram em
 * cascata quando chegam à tela e contam.
 *
 * @param {import("../../core/tipos.js").ContextoCena} ctx
 */
export default function init(ctx) {
  const { root, util } = ctx;
  const titulo = exigir(root, ".ab-titulo");
  const foto = abrirFoto(ctx);
  ctx.pronto
    .then(() => {
      util.revelarTexto(titulo, { gatilho: false, duracao: 1.2, stagger: 0.09 });
      util.revelarTexto(exigir(root, ".ab-lead"), { gatilho: false, atraso: 0.45 });
      ctx.gsap.delayedCall(0.35, () => foto.play());
      subirAcoes(ctx);
    })
    .catch((erro) => console.error("[cena incorporadoras] a abertura não entrou.", erro));
  entrarNumeros(ctx);
}

/** @param {Element} raiz @param {string} seletor @returns {HTMLElement} */
function exigir(raiz, seletor) {
  const el = raiz.querySelector(seletor);
  if (!(el instanceof HTMLElement)) throw new Error(`[cena incorporadoras] falta ${seletor}.`);
  return el;
}

/**
 * A cortina da moldura nasce fechada na montagem e toca depois do título; o parallax
 * interno acompanha a rolagem desde já.
 * @param {import("../../core/tipos.js").ContextoCena} ctx
 */
function abrirFoto({ gsap, root, util }) {
  const moldura = exigir(root, ".ab-foto .moldura");
  const img = exigir(moldura, "img");
  const tl = gsap
    .timeline({ paused: true })
    .fromTo(
      moldura,
      { clipPath: "inset(100% 0% 0% 0%)" },
      { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "expo.inOut" },
    )
    .fromTo(img, { scale: 1.3 }, { scale: 1, duration: 1.8, ease: "expo.out" }, 0.2)
    .fromTo(
      exigir(root, ".ab-foto figcaption"),
      { yPercent: 40, autoAlpha: 0 },
      { yPercent: 0, autoAlpha: 1, duration: 0.9, ease: "expo.out" },
      0.9,
    );
  gsap.fromTo(
    img,
    { yPercent: -5 },
    {
      yPercent: 5,
      ease: "none",
      scrollTrigger: { trigger: moldura, start: "top bottom", end: "bottom top", scrub: 0.7 },
    },
  );
  util.aoImprimir(() => tl.progress(1));
  return tl;
}

/** Botão e link sobem juntos por máscara, depois do lead. */
function subirAcoes({ gsap, root }) {
  gsap.fromTo(
    exigir(root, ".ab-acoes").children,
    { clipPath: "inset(0% 0% 100% 0%)", y: 21 },
    {
      clipPath: "inset(0% 0% 0% 0%)",
      y: 0,
      duration: 1,
      ease: "expo.out",
      stagger: 0.1,
      delay: 0.75,
      clearProps: "clipPath,transform",
    },
  );
}

/** Cada número: rótulo e valor sobem juntos; o valor conta a partir de zero. */
function entrarNumeros({ gsap, root, util }) {
  util.entrarEmLote(root.querySelectorAll(".ab-numero"), {
    inicio: "top 95%",
    cascata: 0.1,
    animar: (tl, item) => {
      tl.fromTo(
        item.querySelectorAll(".ab-in"),
        { yPercent: 110 },
        { yPercent: 0, duration: 1.1, ease: "expo.out", stagger: 0.08 },
        0.6,
      );
      const valor = item.querySelector("[data-conta]");
      if (valor instanceof HTMLElement) tl.add(contar(gsap, valor), 0.6);
    },
  });
}

/**
 * Tween de contagem na timeline do item (o HTML já traz o valor final, para quem lê sem JS).
 * @param {import("../../core/tipos.js").Gsap} gsap @param {HTMLElement} el
 */
function contar(gsap, el) {
  const para = Number(el.dataset.conta);
  if (!Number.isFinite(para)) {
    throw new Error(`[cena incorporadoras] data-conta inválido: ${el.dataset.conta}`);
  }
  const prefixo = el.dataset.prefixo ?? "";
  const estado = { valor: 0 };
  const escrever = (/** @type {number} */ v) => {
    el.textContent = `${prefixo}${Math.round(v).toLocaleString("pt-BR")}`;
  };
  return gsap.to(estado, {
    valor: para,
    duration: 1.6,
    ease: "power3.out",
    onStart: () => escrever(0),
    onUpdate: () => escrever(estado.valor),
    onComplete: () => escrever(para),
  });
}
