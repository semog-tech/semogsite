/**
 * Incorporadoras · convivência. Sem pin: o título sobe por máscara e "A Semog entrega a
 * convivência." ganha peso; o argumento vem linha a linha. Cada reclamação sobe, o traço
 * se desenha da esquerda para a direita até o passo que cuida dela, e o passo sobe na
 * ponta do traço.
 *
 * @param {import("../../core/tipos.js").ContextoCena} ctx
 */
export default function init(ctx) {
  const { root, util } = ctx;
  const titulo = exigir(root, ".cv-titulo");
  util.revelarTexto(titulo, { duracao: 1.2 });
  const texto = exigir(root, ".cv-texto");
  util.revelarTexto(texto, { inicio: "top 85%" });
  util.revelarTexto(exigir(root, ".cv-apoio"), { gatilho: texto, inicio: "top 85%", atraso: 0.2 });
  util.revelarTexto(exigir(root, ".cv-riscos-titulo"), { inicio: "top 88%" });
  ligarRiscos(ctx);
}

/** @param {Element} raiz @param {string} seletor @returns {HTMLElement} */
function exigir(raiz, seletor) {
  const el = raiz.querySelector(seletor);
  if (!(el instanceof HTMLElement)) throw new Error(`[cena convivencia] falta ${seletor}.`);
  return el;
}

/** Reclamação → traço → nó → passo, encadeados (cada um começa a ~70% do anterior). */
function ligarRiscos({ root, util }) {
  util.entrarEmLote(root.querySelectorAll(".cv-risco"), {
    inicio: "top 88%",
    cascata: 0.18,
    animar: (tl, item) => {
      tl.fromTo(
        exigir(item, ".cv-de"),
        { clipPath: "inset(0% 0% 100% 0%)", y: 21 },
        { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 1, ease: "expo.out" },
        0,
      )
        .fromTo(
          exigir(item, ".cv-traco i"),
          { scaleX: 0 },
          { scaleX: 1, duration: 1.1, ease: "expo.inOut" },
          0.35,
        )
        .fromTo(
          exigir(item, ".cv-traco b"),
          { scale: 0 },
          { scale: 1, duration: 0.5, ease: "back.out(2.2)" },
          1.3,
        )
        .fromTo(
          exigir(item, ".cv-para"),
          { clipPath: "inset(0% 0% 100% 0%)", y: 21 },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            y: 0,
            duration: 1,
            ease: "expo.out",
            clearProps: "clipPath,transform",
          },
          1.05,
        );
    },
  });
}
