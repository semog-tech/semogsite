/**
 * Incorporadoras · ganhos. Sem pin: a própria rolagem desce do marinho ao branco. Um fio de
 * ponta reta acompanha a leitura (a ponta fica na altura de 60% da tela) e, ao chegar a
 * cada zona, acende o nó dela; o nome sobe por máscara e ganha peso, o texto vem linha a
 * linha. Na marca, as quatro praças abrem em cascata. O header acompanha o mundo sob ele.
 *
 * @param {import("../../core/tipos.js").ContextoCena} ctx
 */
export default function init(ctx) {
  const { gsap, root, util, ScrollTrigger } = ctx;
  const fio = exigir(root, ".gn-fio");
  const ultimoNo = exigir(root, ".gn-zona--marca .gn-no");
  const medirFio = () => {
    const altura = ultimoNo.getBoundingClientRect().top - root.getBoundingClientRect().top + 5;
    fio.style.setProperty("--gn-fio", `${Math.round(altura)}px`);
  };
  medirFio();
  ScrollTrigger.addEventListener("refreshInit", medirFio);
  gsap.fromTo(
    exigir(root, ".gn-fio-traco"),
    { scaleY: 0 },
    {
      scaleY: 1,
      ease: "none",
      scrollTrigger: { trigger: fio, start: "top 60%", end: "bottom 60%", scrub: 0.7 },
    },
  );
  // O título é a primeira coisa depois da cobertura do percurso: entra assim que aparece.
  util.revelarTexto(exigir(root, ".gn-titulo"), { inicio: "top bottom" });
  for (const zona of root.querySelectorAll(".gn-zona")) entrarZona(ctx, zona);
  abrirPracas(ctx);
  seguirTema(ctx);
}

/** @param {Element} raiz @param {string} seletor @returns {HTMLElement} */
function exigir(raiz, seletor) {
  const el = raiz.querySelector(seletor);
  if (!(el instanceof HTMLElement)) throw new Error(`[cena ganhos] falta ${seletor}.`);
  return el;
}

/**
 * O nó acende quando a ponta do fio (60% da tela) passa por ele; o nome sobe por máscara e
 * o texto e o apoio vêm linha a linha logo depois.
 * @param {import("../../core/tipos.js").ContextoCena} ctx @param {Element} zona
 */
function entrarZona({ gsap, util }, zona) {
  const nome = exigir(zona, ".gn-nome");
  const no = exigir(zona, ".gn-no");
  gsap.fromTo(
    no,
    { scale: 0 },
    {
      scale: 1,
      duration: 0.6,
      ease: "back.out(2.2)",
      scrollTrigger: { trigger: no, start: "top 60%", toggleActions: "play none none reverse" },
    },
  );
  // A entrega vem logo depois da cobertura do percurso: entra assim que aparece, para o
  // marinho nunca ficar sozinho na tela.
  const inicio = zona.classList.contains("gn-zona--entrega") ? "top bottom" : "top 82%";
  util.revelarTexto(nome, { gatilho: nome, inicio, duracao: 1.2 });
  util.revelarTexto(exigir(zona, ".gn-texto"), { gatilho: nome, inicio, atraso: 0.25 });
  util.revelarTexto(exigir(zona, ".gn-apoio"), { gatilho: nome, inicio, atraso: 0.45 });
}

/** Cada praça: moldura abre de baixo e a foto assenta de 1,3; em cascata de 0,12 s. */
function abrirPracas({ root, util }) {
  util.entrarEmLote(root.querySelectorAll(".gn-cidade"), {
    inicio: "top 88%",
    cascata: 0.12,
    animar: (tl, cidade) => {
      tl.fromTo(
        exigir(cidade, ".moldura"),
        { clipPath: "inset(100% 0% 0% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "expo.inOut" },
      )
        .from(exigir(cidade, "img"), { scale: 1.3, duration: 1.8, ease: "expo.out" }, 0.2)
        .from(
          exigir(cidade, "figcaption"),
          { yPercent: 60, autoAlpha: 0, duration: 0.9, ease: "expo.out" },
          0.9,
        );
    },
  });
}

/**
 * O header lê o data-tema da seção; aqui ele muda com a zona sob a linha do header. No
 * cliente, o trecho de cima ainda é escuro: passa a gelo a 40% da zona, onde a
 * luminosidade do gradiente cruza o meio.
 * @param {import("../../core/tipos.js").ContextoCena} ctx
 */
function seguirTema({ root, ScrollTrigger, util }) {
  const linha = "top+=68";
  /** @type {Array<[string, string, string, string]>} */
  const trechos = [
    [".gn-topo", "top", "bottom", "marinho"],
    [".gn-zona--entrega", "top", "bottom", "marinho"],
    [".gn-zona--cliente", "top", "40%", "marinho"],
    [".gn-zona--cliente", "40%", "bottom", "gelo"],
    [".gn-zona--marca", "top", "bottom", "claro"],
  ];
  for (const [seletor, de, ate, tema] of trechos) {
    ScrollTrigger.create({
      trigger: exigir(root, seletor),
      start: `${de} ${linha}`,
      end: `${ate} ${linha}`,
      onToggle: (self) => {
        if (self.isActive) root.dataset.tema = tema;
      },
    });
  }
  util.aoImprimir(() => {
    root.dataset.tema = "marinho";
  });
}
