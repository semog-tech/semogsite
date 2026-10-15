/**
 * Incorporadoras · lançamento. Sem pin: a pergunta sobe por máscara e "no radar?" ganha
 * peso; a frase vem linha a linha, o botão e a linha das parceiras sobem em seguida. Na
 * saída, a coluna lavanda cresce com a rolagem até encostar no convite da proposta.
 * Também marca "Construtora" no pedido de proposta desta página, se ninguém escolheu ainda.
 *
 * @param {import("../../core/tipos.js").ContextoCena} ctx
 */
export default function init(ctx) {
  const { gsap, root, util } = ctx;
  const titulo = exigir(root, ".ln-titulo");
  util.revelarTexto(titulo, { duracao: 1.3, stagger: 0.11 });
  util.revelarTexto(exigir(root, ".ln-texto"), { gatilho: titulo, atraso: 0.35 });
  const subir = gsap.fromTo(
    [exigir(root, ".ln-acoes"), exigir(root, ".ln-parceiras")],
    { clipPath: "inset(0% 0% 100% 0%)", y: 21 },
    {
      clipPath: "inset(0% 0% 0% 0%)",
      y: 0,
      duration: 1,
      ease: "expo.out",
      stagger: 0.12,
      delay: 0.7,
      clearProps: "clipPath,transform",
      scrollTrigger: { trigger: titulo, start: "top 80%", toggleActions: "play none none none" },
    },
  );
  util.aoImprimir(() => subir.progress(1));
  sair(ctx);
  marcarConstrutora();
}

/** @param {Element} raiz @param {string} seletor @returns {HTMLElement} */
function exigir(raiz, seletor) {
  const el = raiz.querySelector(seletor);
  if (!(el instanceof HTMLElement)) throw new Error(`[cena lancamento] falta ${seletor}.`);
  return el;
}

/** A coluna lavanda cresce do pé da cena até encostar no convite da proposta. */
function sair({ gsap, root }) {
  gsap.fromTo(
    exigir(root, ".ln-veu"),
    { scaleY: 0 },
    {
      scaleY: 1,
      ease: "none",
      scrollTrigger: {
        trigger: exigir(root, ".ln-saida"),
        start: "top bottom",
        end: "bottom bottom",
        scrub: 0.7,
      },
    },
  );
}

/**
 * Quem pede proposta a partir desta página é, quase sempre, construtora: a opção já chega
 * marcada no "Você é" (e continua trocável). Sem o pedido na página, só avisa.
 */
function marcarConstrutora() {
  const form = document.querySelector("#proposta form[data-formulario-proposta]");
  const opcao = form?.querySelector('input[name="perfil"][value="construtora"]');
  if (!(form instanceof HTMLFormElement) || !(opcao instanceof HTMLInputElement)) {
    console.warn("[cena lancamento] pedido de proposta sem a opção Construtora; nada marcado.");
    return;
  }
  if (!form.querySelector('input[name="perfil"]:checked')) opcao.checked = true;
}
