/**
 * Semog Garante · papéis. Sem pin: o título sobe por máscara assim que aparece (ele chega por
 * cima da cobertura do caixa). A fila acompanha a rolagem: o traço céu corre de um papel ao
 * outro (no celular, de cima para baixo) e o nó de cada papel acende quando o traço chega a ele;
 * o nome e o que ele faz sobem por máscara uma vez. O header acompanha o trecho sob ele
 * (marinho em cima, claro no fim da descida).
 *
 * @param {import("../../core/tipos.js").ContextoCena} ctx
 */
export default function init(ctx) {
  const { root, util } = ctx;
  util.revelarTexto(exigir(root, ".gp-titulo"), { inicio: "top bottom", duracao: 1.2 });
  correrFila(ctx);
  entrarPapeis(ctx);
  seguirTema(ctx);
}

/** @param {Element} raiz @param {string} seletor @returns {HTMLElement} */
function exigir(raiz, seletor) {
  const el = raiz.querySelector(seletor);
  if (!(el instanceof HTMLElement)) throw new Error(`[cena papeis] falta ${seletor}.`);
  return el;
}

/**
 * O traço e os nós presos à rolagem (scrub 0,7), entre a fila entrar a 85% da tela e chegar a
 * 35%: o traço vai de 0 a 1 em velocidade constante e cada nó acende quando ele passa.
 * @param {import("../../core/tipos.js").ContextoCena} ctx
 */
function correrFila({ gsap, root }) {
  const fila = exigir(root, ".gp-fila");
  const nos = Array.from(root.querySelectorAll(".gp-no"));
  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: { trigger: fila, start: "top 85%", end: "top 35%", scrub: 0.7 },
  });
  tl.fromTo(fila, { "--gp-progresso": 0 }, { "--gp-progresso": 1, duration: 1 }, 0);
  nos.forEach((no, i) => {
    tl.fromTo(
      no,
      { scale: 0 },
      { scale: 1, duration: 0.08, ease: "back.out(2.2)" },
      Math.max(0, i / Math.max(1, nos.length - 1) - 0.04),
    );
  });
}

/** Nome e texto de cada papel sobem por máscara quando ele chega à tela. */
function entrarPapeis({ root, util }) {
  util.entrarEmLote(root.querySelectorAll(".gp-papel"), {
    inicio: "top 85%",
    cascata: 0.12,
    animar: (tl, item) => {
      tl.fromTo(
        item.querySelectorAll(".gp-quem, .gp-faz"),
        { clipPath: "inset(0% 0% 100% 0%)", y: 21 },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          y: 0,
          duration: 1.1,
          ease: "expo.out",
          stagger: 0.1,
          clearProps: "clipPath,transform",
        },
        0,
      );
    },
  });
}

/**
 * O header lê o data-tema da seção; aqui ele muda com o trecho sob a linha do header: marinho
 * até 55% da descida, onde a luminosidade do gradiente cruza o meio, e claro daí em diante.
 * @param {import("../../core/tipos.js").ContextoCena} ctx
 */
function seguirTema({ root, ScrollTrigger, util }) {
  ScrollTrigger.create({
    trigger: exigir(root, ".gp-descida"),
    start: "55% top+=68",
    end: "bottom top+=68",
    onToggle: (self) => {
      root.dataset.tema = self.isActive ? "claro" : "marinho";
    },
  });
  util.aoImprimir(() => {
    root.dataset.tema = "marinho";
  });
}
