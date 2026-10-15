/**
 * A Semog · princípios. Sem pin: a própria rolagem desce do marinho ao branco. Um fio de
 * ponta reta acompanha a leitura (a ponta fica na altura de 60% da tela) e, ao chegar a
 * cada nome, acende o nó dele; nome e texto sobem por máscara. Na Dinâmica, o mesh do
 * rebrand é vivo (WebGL, só com a zona na tela). O header acompanha o mundo sob ele.
 *
 * @param {import("../../core/tipos.js").ContextoCena} ctx
 */
export default function init(ctx) {
  const { gsap, root, util, ScrollTrigger } = ctx;
  const fio = exigir(root, ".pr-fio");
  const ultimoNo = exigir(root, ".pr-zona--dinamica .pr-no");
  const medirFio = () => {
    const altura = ultimoNo.getBoundingClientRect().top - root.getBoundingClientRect().top + 5;
    fio.style.setProperty("--pr-fio", `${Math.round(altura)}px`);
  };
  medirFio();
  ScrollTrigger.addEventListener("refreshInit", medirFio);
  gsap.fromTo(
    exigir(root, ".pr-fio-traco"),
    { scaleY: 0 },
    {
      scaleY: 1,
      ease: "none",
      scrollTrigger: { trigger: fio, start: "top 60%", end: "bottom 60%", scrub: 0.7 },
    },
  );
  for (const zona of root.querySelectorAll(".pr-zona")) entrarZona(ctx, zona);
  seguirTema(ctx);
  ligarMesh(ctx);
}

/** @param {Element} root @param {string} seletor @returns {HTMLElement} */
function exigir(root, seletor) {
  const el = root.querySelector(seletor);
  if (!(el instanceof HTMLElement)) throw new Error(`[cena principios] falta ${seletor}.`);
  return el;
}

/**
 * O nó acende quando a ponta do fio (60% da tela) passa por ele; o nome sobe por máscara e
 * o texto vem linha a linha logo depois.
 * @param {import("../../core/tipos.js").ContextoCena} ctx @param {Element} zona
 */
function entrarZona({ gsap, util }, zona) {
  const nome = exigir(zona, ".pr-nome");
  const no = exigir(zona, ".pr-no");
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
  util.revelarTexto(nome, { gatilho: nome, inicio: "top 82%", duracao: 1.2 });
  util.revelarTexto(exigir(zona, ".pr-texto"), {
    gatilho: nome,
    inicio: "top 82%",
    atraso: 0.25,
  });
}

/**
 * O header lê o data-tema da seção; aqui ele muda com a zona sob a linha do header. Na
 * Transparência, o trecho de cima ainda é escuro: passa a gelo a 40% da zona, onde a
 * luminosidade do gradiente cruza o meio.
 * @param {import("../../core/tipos.js").ContextoCena} ctx
 */
function seguirTema({ root, ScrollTrigger, util }) {
  const linha = "top+=68";
  /** @type {Array<[string, string, string, string]>} */
  const trechos = [
    [".pr-zona--retidao", "top", "bottom", "marinho"],
    [".pr-zona--transparencia", "top", "40%", "marinho"],
    [".pr-zona--transparencia", "40%", "bottom", "gelo"],
    [".pr-zona--dinamica", "top", "bottom", "claro"],
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

/**
 * Mesh vivo na Dinâmica. A mancha de névoa (cinza) segue `esc`: fica fora do quadro, para
 * o mesh ficar só em branco, céu e lavanda. Sem WebGL (Firefox headless, contexto
 * perdido), segue o mesh em CSS que já está por baixo: a cena avisa e não quebra.
 * @param {import("../../core/tipos.js").ContextoCena} ctx
 */
function ligarMesh({ root, util, ScrollTrigger }) {
  const zona = exigir(root, ".pr-zona--dinamica");
  const canvas = zona.querySelector(".pr-mesh");
  if (!(canvas instanceof HTMLCanvasElement)) throw new Error("[cena principios] falta o canvas.");
  /** @type {ReturnType<typeof util.criarDinamica> | null} */
  let mesh = null;
  const desligar = () => {
    mesh = null;
    canvas.hidden = true;
  };
  try {
    mesh = util.criarDinamica(canvas, { esc: [1.6, 1.4], escuro: 0, aoFalhar: desligar });
    mesh.redimensionar();
    mesh.desenhar(0);
  } catch (erro) {
    console.warn("[cena principios] mesh sem WebGL; segue o mesh em CSS.", erro);
    desligar();
    return;
  }
  ScrollTrigger.addEventListener("refresh", () => mesh?.redimensionar());
  util.lacoVisivel(zona, (tempo) => mesh?.desenhar(tempo));
}
