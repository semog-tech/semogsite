/**
 * Gestão · perguntas. Sem pin: o título sobe por máscara e o caminho para outra dúvida vem
 * em seguida; cada pergunta entra quando chega à tela. Abrir uma pergunta é do próprio
 * <details>; quando ela abre, a resposta sobe por máscara (fechar é imediato). Na saída, a
 * coluna lavanda cresce com a rolagem até encostar no convite da proposta.
 *
 * @param {import("../../core/tipos.js").ContextoCena} ctx
 */
export default function init(ctx) {
  const { gsap, root, util } = ctx;
  const titulo = exigir(root, ".gpf-titulo");
  util.revelarTexto(titulo, { duracao: 1.2 });
  const outra = gsap.fromTo(
    exigir(root, ".gpf-outra").children,
    { clipPath: "inset(0% 0% 100% 0%)", y: 13 },
    {
      clipPath: "inset(0% 0% 0% 0%)",
      y: 0,
      duration: 1,
      ease: "expo.out",
      stagger: 0.1,
      clearProps: "clipPath,transform",
      scrollTrigger: { trigger: titulo, start: "top 80%", toggleActions: "play none none none" },
      delay: 0.4,
    },
  );
  util.aoImprimir(() => outra.progress(1));
  entrarPerguntas(ctx);
  abrirComMascara(ctx);
  sair(ctx);
}

/** @param {Element} raiz @param {string} seletor @returns {HTMLElement} */
function exigir(raiz, seletor) {
  const el = raiz.querySelector(seletor);
  if (!(el instanceof HTMLElement)) throw new Error(`[cena perguntas-gestao] falta ${seletor}.`);
  return el;
}

/** Cada bloco abre de baixo, por máscara, quando chega à tela. */
function entrarPerguntas({ root, util }) {
  util.entrarEmLote(root.querySelectorAll(".gpf-item"), {
    inicio: "top 90%",
    cascata: 0.08,
    animar: (tl, item) => {
      tl.fromTo(
        item,
        { clipPath: "inset(0% 0% 100% 0%)", y: 21 },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          y: 0,
          duration: 1,
          ease: "expo.out",
          clearProps: "clipPath,transform",
        },
        0,
      );
    },
  });
}

/** Ao abrir, a resposta sobe por máscara; ao fechar, o <details> fecha sozinho. */
function abrirComMascara({ gsap, root }) {
  for (const item of root.querySelectorAll(".gpf-item")) {
    if (!(item instanceof HTMLDetailsElement)) continue;
    const texto = item.querySelector(".gpf-resposta p");
    if (!texto) throw new Error("[cena perguntas-gestao] pergunta sem resposta.");
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      gsap.fromTo(
        texto,
        { yPercent: 60, clipPath: "inset(0% 0% 100% 0%)" },
        {
          yPercent: 0,
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 0.9,
          ease: "expo.out",
          clearProps: "clipPath,transform",
        },
      );
    });
  }
}

/** A coluna lavanda cresce do pé da cena até encostar no convite da proposta. */
function sair({ gsap, root }) {
  gsap.fromTo(
    exigir(root, ".gpf-veu"),
    { scaleY: 0 },
    {
      scaleY: 1,
      ease: "none",
      scrollTrigger: {
        trigger: exigir(root, ".gpf-saida"),
        start: "top bottom",
        end: "bottom bottom",
        scrub: 0.7,
      },
    },
  );
}
