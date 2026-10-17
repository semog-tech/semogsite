/**
 * Tecnologia · conferência. Sem pin: a frase sobe por máscara e "A gente confere." ganha
 * peso; o lead vem linha a linha. Cada par entra quando chega à tela: o que a plataforma faz
 * sobe, o traço se desenha até o visto, o visto se desenha e a pessoa sobe na ponta dele
 * (cada passo começa a ~70% do anterior). Na saída, a coluna lavanda cresce com a rolagem até
 * encostar no convite da proposta.
 *
 * @param {import("../../core/tipos.js").ContextoCena} ctx
 */
export default function init(ctx) {
  const { root, util } = ctx;
  const titulo = exigir(root, ".cf-titulo");
  util.revelarTexto(titulo, { duracao: 1.2 });
  util.revelarTexto(exigir(root, ".cf-lead"), { gatilho: titulo, atraso: 0.35 });
  const cabeca = ctx.gsap.fromTo(
    exigir(root, ".cf-cabeca").children,
    { clipPath: "inset(0% 0% 100% 0%)", y: 13 },
    {
      clipPath: "inset(0% 0% 0% 0%)",
      y: 0,
      duration: 1,
      ease: "expo.out",
      stagger: 0.12,
      clearProps: "clipPath,transform",
      scrollTrigger: {
        trigger: exigir(root, ".cf-tabela"),
        start: "top 85%",
        toggleActions: "play none none none",
      },
    },
  );
  util.aoImprimir(() => cabeca.progress(1));
  ligarPares(ctx);
  sair(ctx);
}

/** @param {Element} raiz @param {string} seletor @returns {Element} */
function exigir(raiz, seletor) {
  const el = raiz.querySelector(seletor);
  if (!el) throw new Error(`[cena conferencia] falta ${seletor}.`);
  return el;
}

/** Plataforma → traço → visto → pessoa, encadeados. */
function ligarPares({ root, util }) {
  const subir = (/** @type {gsap.core.Timeline} */ tl, /** @type {Element} */ el, t) =>
    tl.fromTo(
      el,
      { clipPath: "inset(0% 0% 100% 0%)", y: 21 },
      {
        clipPath: "inset(0% 0% 0% 0%)",
        y: 0,
        duration: 1,
        ease: "expo.out",
        clearProps: "clipPath,transform",
      },
      t,
    );
  util.entrarEmLote(root.querySelectorAll(".cf-par"), {
    inicio: "top 85%",
    cascata: 0.18,
    animar: (tl, par) => {
      subir(tl, exigir(par, ".cf-maquina"), 0);
      tl.fromTo(
        exigir(par, ".cf-traco i"),
        { scaleX: 0 },
        { scaleX: 1, duration: 1.1, ease: "expo.inOut" },
        0.35,
      ).fromTo(
        exigir(par, ".cf-visto path"),
        { strokeDasharray: 1, strokeDashoffset: 1 },
        { strokeDashoffset: 0, duration: 0.45, ease: "power2.out" },
        1.15,
      );
      subir(tl, exigir(par, ".cf-pessoa"), 1.2);
    },
  });
}

/** A coluna lavanda cresce do pé da cena até encostar no convite da proposta. */
function sair({ gsap, root }) {
  gsap.fromTo(
    exigir(root, ".cf-veu"),
    { scaleY: 0 },
    {
      scaleY: 1,
      ease: "none",
      scrollTrigger: {
        trigger: exigir(root, ".cf-saida"),
        start: "top bottom",
        end: "bottom bottom",
        scrub: 0.7,
      },
    },
  );
}
