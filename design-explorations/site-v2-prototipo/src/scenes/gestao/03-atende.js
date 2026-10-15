/**
 * Gestão · quem atende. Sem pin: o título sobe por máscara e "e de quem decide." ganha peso;
 * o lead e os tipos vêm em seguida. Cada item entra quando chega à tela (o nó assenta, o
 * título e o texto sobem) e os três caminhos abrem de baixo, em cascata.
 *
 * @param {import("../../core/tipos.js").ContextoCena} ctx
 */
export default function init(ctx) {
  const { gsap, root, util } = ctx;
  const titulo = exigir(root, ".gat-titulo");
  util.revelarTexto(titulo, { duracao: 1.2, stagger: 0.09 });
  util.revelarTexto(exigir(root, ".gat-lead"), { gatilho: titulo, atraso: 0.35 });
  const tipos = gsap.fromTo(
    exigir(root, ".gat-tipos"),
    { clipPath: "inset(0% 0% 100% 0%)", y: 13 },
    {
      clipPath: "inset(0% 0% 0% 0%)",
      y: 0,
      duration: 1,
      ease: "expo.out",
      delay: 0.6,
      clearProps: "clipPath,transform",
      scrollTrigger: { trigger: titulo, start: "top 80%", toggleActions: "play none none none" },
    },
  );
  util.aoImprimir(() => tipos.progress(1));
  entrarItens(ctx);
  entrarCaminhos(ctx);
}

/** @param {Element} raiz @param {string} seletor @returns {HTMLElement} */
function exigir(raiz, seletor) {
  const el = raiz.querySelector(seletor);
  if (!(el instanceof HTMLElement)) throw new Error(`[cena quem-atende] falta ${seletor}.`);
  return el;
}

/** O nó cresce do centro; título, texto e link sobem por máscara logo depois. */
function entrarItens({ root, util }) {
  util.entrarEmLote(root.querySelectorAll(".gat-item"), {
    inicio: "top 88%",
    cascata: 0.12,
    animar: (tl, item) => {
      tl.fromTo(
        item.querySelector("i"),
        { scale: 0 },
        { scale: 1, duration: 0.6, ease: "back.out(2)" },
        0,
      ).fromTo(
        Array.from(item.children).filter((filho) => filho.tagName !== "I"),
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
    },
  });
}

/** O rótulo sobe e cada bloco branco abre de baixo, em cascata. */
function entrarCaminhos({ root, util }) {
  util.entrarEmLote([exigir(root, ".gat-alem-rotulo"), ...root.querySelectorAll(".gat-link")], {
    inicio: "top 92%",
    cascata: 0.1,
    animar: (tl, item) => {
      tl.fromTo(
        item,
        { clipPath: "inset(100% 0% 0% 0%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 1.2,
          ease: "expo.inOut",
          clearProps: "clipPath",
        },
        0,
      );
    },
  });
}
