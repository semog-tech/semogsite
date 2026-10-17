/**
 * A Semog · manifesto. A frase da casa sobe linha a linha por máscara assim que a página
 * fica pronta, e "Esse trabalho é nosso." ganha peso na mesma timeline. O header acompanha
 * a passagem do marinho para a luz. Os cinco números
 * entram em cascata quando chegam à tela: o rótulo sobe, o número sobe e conta.
 *
 * @param {import("../../core/tipos.js").ContextoCena} ctx
 */
export default function init(ctx) {
  const { root, util } = ctx;
  const titulo = root.querySelector(".mf-titulo");
  if (!(titulo instanceof HTMLElement)) throw new Error("[cena a-semog] falta .mf-titulo.");
  ctx.pronto
    .then(() => util.revelarTexto(titulo, { gatilho: false, duracao: 1.2, stagger: 0.09 }))
    .catch((erro) => console.error("[cena a-semog] o manifesto não entrou.", erro));
  entrarNumeros(ctx);
  seguirTema(ctx);
}

/**
 * O header lê o tema da seção: marinho enquanto o trecho escuro está sob ele, claro quando a
 * luz (a partir de 62% da seção) chega à linha do header.
 * @param {import("../../core/tipos.js").ContextoCena} ctx
 */
function seguirTema({ root, ScrollTrigger, util }) {
  ScrollTrigger.create({
    trigger: root,
    start: "62% top+=68",
    onToggle: (self) => {
      root.dataset.tema = self.isActive ? "claro" : "marinho";
    },
  });
  util.aoImprimir(() => {
    root.dataset.tema = "marinho";
  });
}

/** Cada número: rótulo e valor sobem juntos; o valor conta a partir de zero. */
function entrarNumeros({ gsap, root, util }) {
  util.entrarEmLote(root.querySelectorAll(".mf-numero"), {
    inicio: "top 92%",
    cascata: 0.1,
    animar: (tl, item) => {
      tl.fromTo(
        item.querySelectorAll(".mf-in"),
        { yPercent: 110 },
        { yPercent: 0, duration: 1.1, ease: "expo.out", stagger: 0.08 },
        0.35,
      );
      const valor = item.querySelector("[data-conta]");
      if (valor instanceof HTMLElement) tl.add(contar(gsap, valor), 0.35);
    },
  });
}

/**
 * Tween de contagem na timeline do item (o HTML já traz o valor final, para quem lê sem JS).
 * @param {import("../../core/tipos.js").Gsap} gsap @param {HTMLElement} el
 */
function contar(gsap, el) {
  const para = Number(el.dataset.conta);
  if (!Number.isFinite(para))
    throw new Error(`[cena a-semog] data-conta inválido: ${el.dataset.conta}`);
  const { prefixo = "", sufixo = "" } = el.dataset;
  const estado = { valor: 0 };
  const escrever = (v) => {
    el.textContent = `${prefixo}${Math.round(v).toLocaleString("pt-BR")}${sufixo}`;
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
