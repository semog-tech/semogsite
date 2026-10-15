/**
 * Tecnologia · abertura. Quando a página fica pronta, "Semog One." sobe por máscara e "One."
 * ganha peso; o lead e as ações vêm em seguida. Logo depois a régua do mês acende: o rótulo
 * sobe e o traço marinho percorre os trinta dias, da esquerda para a direita. Os números
 * entram em cascata quando chegam à tela e contam.
 *
 * @param {import("../../core/tipos.js").ContextoCena} ctx
 */
export default function init(ctx) {
  const { root, util } = ctx;
  const titulo = exigir(root, ".so-titulo");
  const regua = percorrerMes(ctx);
  ctx.pronto
    .then(() => {
      util.revelarTexto(titulo, { gatilho: false, duracao: 1.2, stagger: 0.09 });
      util.revelarTexto(exigir(root, ".so-lead"), { gatilho: false, atraso: 0.45 });
      subirAcoes(ctx);
      ctx.gsap.delayedCall(0.6, () => regua.play());
    })
    .catch((erro) => console.error("[cena semog-one] a abertura não entrou.", erro));
  entrarNumeros(ctx);
}

/** @param {Element} raiz @param {string} seletor @returns {HTMLElement} */
function exigir(raiz, seletor) {
  const el = raiz.querySelector(seletor);
  if (!(el instanceof HTMLElement)) throw new Error(`[cena semog-one] falta ${seletor}.`);
  return el;
}

/** Botão e link sobem juntos por máscara, depois do lead. */
function subirAcoes({ gsap, root }) {
  gsap.fromTo(
    exigir(root, ".so-acoes").children,
    { clipPath: "inset(0% 0% 100% 0%)", y: 21 },
    {
      clipPath: "inset(0% 0% 0% 0%)",
      y: 0,
      duration: 1,
      ease: "expo.out",
      stagger: 0.1,
      delay: 0.75,
      clearProps: "clipPath,transform",
    },
  );
}

/**
 * A régua nasce apagada na montagem e toca depois do título: o rótulo sobe, o trilho abre,
 * o traço corre o mês (as marcas de cada dia acendem com ele) e as pontas "1" e "30" chegam
 * cada uma com o traço.
 * @param {import("../../core/tipos.js").ContextoCena} ctx
 */
function percorrerMes({ gsap, root, util }) {
  const tl = gsap
    .timeline({ paused: true })
    .fromTo(
      exigir(root, ".so-mes-rotulo .so-in"),
      { yPercent: 110 },
      { yPercent: 0, duration: 1, ease: "expo.out" },
      0,
    )
    .fromTo(
      exigir(root, ".so-regua-trilho"),
      { clipPath: "inset(0% 100% 0% 0%)" },
      { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "expo.inOut" },
      0,
    )
    .fromTo(
      exigir(root, ".so-regua-feito"),
      { clipPath: "inset(0% 100% 0% 0%)" },
      { clipPath: "inset(0% 0% 0% 0%)", duration: 2.4, ease: "power2.inOut" },
      0.4,
    )
    .fromTo(
      exigir(root, ".so-regua-pontas").children,
      { yPercent: 60, autoAlpha: 0 },
      { yPercent: 0, autoAlpha: 1, duration: 0.9, ease: "expo.out", stagger: 1.7 },
      0.5,
    );
  util.aoImprimir(() => tl.progress(1));
  return tl;
}

/** Cada número: rótulo e valor sobem juntos; os que são contagem contam a partir de zero. */
function entrarNumeros({ gsap, root, util }) {
  util.entrarEmLote(root.querySelectorAll(".so-numero"), {
    inicio: "top 95%",
    cascata: 0.12,
    animar: (tl, item) => {
      tl.fromTo(
        item.querySelectorAll(".so-in"),
        { yPercent: 110 },
        { yPercent: 0, duration: 1.1, ease: "expo.out", stagger: 0.08 },
        0.7,
      );
      const valor = item.querySelector("[data-conta]");
      if (valor instanceof HTMLElement) tl.add(contar(gsap, valor), 0.7);
    },
  });
}

/**
 * Tween de contagem na timeline do item (o HTML já traz o valor final, para quem lê sem JS).
 * @param {import("../../core/tipos.js").Gsap} gsap @param {HTMLElement} el
 */
function contar(gsap, el) {
  const para = Number(el.dataset.conta);
  if (!Number.isFinite(para)) {
    throw new Error(`[cena semog-one] data-conta inválido: ${el.dataset.conta}`);
  }
  const prefixo = el.dataset.prefixo ?? "";
  const estado = { valor: 0 };
  const escrever = (/** @type {number} */ v) => {
    el.textContent = `${prefixo}${Math.round(v).toLocaleString("pt-BR")}`;
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
