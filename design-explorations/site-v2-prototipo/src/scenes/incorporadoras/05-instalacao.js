/**
 * Incorporadoras · instalação. Sem pin: título por máscara com "no dia da instalação."
 * ganhando peso; o fio desce com a leitura (ponta a 60% da tela) e acende o nó de cada
 * item; o nome e o texto sobem linha a linha.
 *
 * @param {import("../../core/tipos.js").ContextoCena} ctx
 */
export default function init(ctx) {
  const { gsap, root, util, ScrollTrigger } = ctx;
  const titulo = exigir(root, ".it-titulo");
  util.revelarTexto(titulo, { duracao: 1.2 });
  util.revelarTexto(exigir(root, ".it-lead"), { gatilho: titulo, atraso: 0.3 });
  const fio = exigir(root, ".it-fio");
  const nos = Array.from(root.querySelectorAll(".it-no"));
  const medirFio = () => {
    const base = exigir(root, ".it-lista").getBoundingClientRect().top;
    const [primeiro, ultimo] = [nos[0], nos[nos.length - 1]].map(
      (no) => no.getBoundingClientRect().top - base + 5,
    );
    fio.style.setProperty("--it-fio-topo", `${Math.round(primeiro)}px`);
    fio.style.setProperty("--it-fio", `${Math.round(ultimo - primeiro)}px`);
  };
  medirFio();
  ScrollTrigger.addEventListener("refreshInit", medirFio);
  gsap.fromTo(
    exigir(root, ".it-fio-traco"),
    { scaleY: 0 },
    {
      scaleY: 1,
      ease: "none",
      scrollTrigger: { trigger: fio, start: "top 60%", end: "bottom 60%", scrub: 0.7 },
    },
  );
  for (const item of root.querySelectorAll(".it-item")) entrarItem(ctx, item);
}

/** @param {Element} raiz @param {string} seletor @returns {HTMLElement} */
function exigir(raiz, seletor) {
  const el = raiz.querySelector(seletor);
  if (!(el instanceof HTMLElement)) throw new Error(`[cena instalacao] falta ${seletor}.`);
  return el;
}

/** O nó acende quando a ponta do fio passa; o nome e os textos sobem por máscara. */
function entrarItem({ gsap, util }, item) {
  gsap.fromTo(
    exigir(item, ".it-no"),
    { scale: 0 },
    {
      scale: 1,
      duration: 0.6,
      ease: "back.out(2.2)",
      scrollTrigger: {
        trigger: exigir(item, ".it-no"),
        start: "top 60%",
        toggleActions: "play none none reverse",
      },
    },
  );
  const nome = exigir(item, ".it-nome");
  util.revelarTexto(nome, { inicio: "top 85%", duracao: 1.1 });
  for (const [i, texto] of Array.from(item.querySelectorAll(".it-textos > p")).entries()) {
    if (texto instanceof HTMLElement) {
      util.revelarTexto(texto, { gatilho: nome, inicio: "top 85%", atraso: 0.2 + i * 0.2 });
    }
  }
}
