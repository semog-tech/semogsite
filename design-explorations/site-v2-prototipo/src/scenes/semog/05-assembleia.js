/**
 * A Semog · assembleia, a pauta. Sem pin: a folha abre de baixo como as fotos; o título
 * entra por máscara com "à assembleia." ganhando peso. Na lista, o fio desce com a leitura
 * (ponta a 62% da tela) e, ao chegar a cada caixa, desenha o tique; o dado da Semog sobe
 * por máscara junto, e a resposta e o apoio vêm linha a linha. Voltando, o tique se desfaz.
 * Na saída, a coluna lavanda cresce com a rolagem até encostar no convite da proposta.
 *
 * @param {import("../../core/tipos.js").ContextoCena} ctx
 */
export default function init(ctx) {
  const { root, util } = ctx;
  const titulo = exigir(root, ".as-titulo");
  util.revelarTexto(titulo, { duracao: 1.2 });
  util.revelarTexto(exigir(root, ".as-lead"), { gatilho: titulo, atraso: 0.3 });
  assentarFolha(ctx);
  ligarFio(ctx);
  for (const item of root.querySelectorAll(".as-item")) entrarItem(ctx, item);
  sair(ctx);
}

/** @param {Element} raiz @param {string} seletor @returns {HTMLElement} */
function exigir(raiz, seletor) {
  const el = raiz.querySelector(seletor);
  if (!(el instanceof HTMLElement)) throw new Error(`[cena assembleia] falta ${seletor}.`);
  return el;
}

/** @param {Element} raiz @param {string} seletor @returns {SVGGeometryElement} */
function exigirTraco(raiz, seletor) {
  const el = raiz.querySelector(seletor);
  if (!(el instanceof SVGGeometryElement)) throw new Error(`[cena assembleia] falta ${seletor}.`);
  return el;
}

/** A folha abre de baixo para cima (cortina reta) e assenta 34px. */
function assentarFolha({ gsap, root, util }) {
  const folha = exigir(root, ".as-folha");
  const tl = gsap.timeline({ scrollTrigger: { trigger: folha, start: "top 88%", once: true } });
  tl.fromTo(
    folha,
    { clipPath: "inset(100% 0% 0% 0%)", y: 34 },
    {
      clipPath: "inset(0% 0% 0% 0%)",
      y: 0,
      duration: 1.3,
      ease: "expo.inOut",
      clearProps: "clipPath,transform",
    },
  );
  util.aoImprimir(() => tl.progress(1));
}

/** O fio vai do centro da primeira caixa ao da última, desenhado pela rolagem. */
function ligarFio({ gsap, root, ScrollTrigger }) {
  const fio = exigir(root, ".as-fio");
  const lista = exigir(root, ".as-lista");
  const caixas = Array.from(root.querySelectorAll(".as-check"));
  if (caixas.length < 2) throw new Error("[cena assembleia] a pauta precisa de itens.");
  const medir = () => {
    const base = lista.getBoundingClientRect().top;
    const centro = (/** @type {Element} */ c) => {
      const r = c.getBoundingClientRect();
      return r.top + r.height / 2 - base;
    };
    const topo = centro(caixas[0]);
    const fim = centro(caixas[caixas.length - 1]);
    fio.style.setProperty("--as-fio-topo", `${Math.round(topo)}px`);
    fio.style.setProperty("--as-fio", `${Math.round(fim - topo)}px`);
  };
  medir();
  ScrollTrigger.addEventListener("refreshInit", medir);
  gsap.fromTo(
    exigir(root, ".as-fio-traco"),
    { scaleY: 0 },
    {
      scaleY: 1,
      ease: "none",
      scrollTrigger: { trigger: fio, start: "top 62%", end: "bottom 62%", scrub: 0.7 },
    },
  );
}

/** Tique e dado quando a ponta do fio chega à caixa; pergunta e resposta por máscara. */
function entrarItem({ gsap, util }, item) {
  const marca = exigirTraco(item, ".as-check-marca");
  const comprimento = marca.getTotalLength();
  const caixa = item.querySelector(".as-check");
  if (!caixa) throw new Error("[cena assembleia] item sem caixa.");
  gsap.fromTo(
    marca,
    { strokeDasharray: comprimento, strokeDashoffset: comprimento },
    {
      strokeDashoffset: 0,
      duration: 0.55,
      ease: "expo.out",
      scrollTrigger: {
        trigger: caixa,
        start: "center 62%",
        toggleActions: "play none none reverse",
      },
    },
  );
  util.revelarTexto(exigir(item, ".as-pergunta"), { inicio: "top 88%" });
  const resposta = { gatilho: caixa, inicio: "center 66%" };
  util.revelarTexto(exigir(item, ".as-dado"), { ...resposta, duracao: 1.1 });
  util.revelarTexto(exigir(item, ".as-afirmacao"), { ...resposta, atraso: 0.12 });
  util.revelarTexto(exigir(item, ".as-apoio"), { ...resposta, atraso: 0.24 });
}

/** A coluna lavanda cresce do pé da cena até encostar no convite da proposta. */
function sair({ gsap, root }) {
  gsap.fromTo(
    exigir(root, ".as-veu"),
    { scaleY: 0 },
    {
      scaleY: 1,
      ease: "none",
      scrollTrigger: {
        trigger: exigir(root, ".as-saida"),
        start: "top bottom",
        end: "bottom bottom",
        scrub: 0.7,
      },
    },
  );
}
