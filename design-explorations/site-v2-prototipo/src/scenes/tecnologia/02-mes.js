/**
 * Tecnologia · mês, a cena-assinatura. Um pin só, com uma ideia: um mês de condomínio é um
 * traço contínuo, e a tecnologia trabalha em cada momento dele. Ao chegar, a folha do mês
 * abre de cima, a IA passa pela convenção (nas casas antes do dia 1) e cada regra recebe o
 * visto de uma pessoa; o primeiro momento sobe por máscara.
 * Fixado, cada momento tem um patamar de leitura; entre um e outro o traço corre os dias até
 * o dia do momento seguinte, o nó de cada dia acende quando ele passa, a casa do dia abre a
 * partir do traço, a regra da convenção que age ali ganha peso e o texto troca por máscara.
 * No fim, o traço sai pelas casas do mês seguinte, que abrem em marinho e crescem até cobrir
 * a tela: a evolução sobe nesse marinho, sem emenda.
 *
 * O traço é medido num relógio de dias (data-c no SVG, gerado com o desenho): numa semana,
 * uma casa vale um dia; cada virada de semana vale meio. O desenho inteiro é uma função
 * desse relógio (desenhar), e o pin só move o relógio: rolar para trás desfaz na ordem certa.
 *
 * @param {import("../../core/tipos.js").ContextoCena} ctx
 */
export default function init(ctx) {
  const { root, util } = ctx;
  const partes = buscarPartes(root);
  root.classList.add("ms-pin");
  const relogio = { c: 0 };
  const desenhar = () => desenharMes(partes, relogio.c);
  desenhar();
  const tl = util.pinScrub(root, {
    alvo: partes.palco,
    distancia: `+=${Math.round(DURACAO * TELAS_POR_UNIDADE * 100)}%`,
    patamares: "pausas",
  });
  coreografar(ctx, tl, partes, relogio, desenhar);
  // Tema e desenho saem do tempo da timeline a cada render e a cada refresh (o ScrollTrigger
  // renderiza em silêncio quando recalcula).
  const sincronizar = () => {
    aplicarTema(root, tl.time() >= LIMIAR_TEMA ? "marinho" : "claro");
    desenhar();
  };
  tl.eventCallback("onUpdate", sincronizar);
  ctx.ScrollTrigger.addEventListener("refresh", sincronizar);
  entrar(ctx, partes);
  util.aoImprimir(() => {
    aplicarTema(root, "claro");
    desenharMes(partes, partes.relogioFinal);
  });
}

/* ---- Ritmo ------------------------------------------------------------------------
   A timeline do pin é medida em "unidades": cada momento ocupa uma (transição + patamar de
   leitura) e uma unidade vale 0,85 tela de rolagem, como o percurso de Incorporadoras. */

const TELAS_POR_UNIDADE = 0.85;
/** Patamar do primeiro momento antes da primeira troca (ele já entrou antes do pin). */
const PATAMAR_INICIAL = 0.6;
const PASSO = 1;
const TRANSICAO = 0.55;
const MOMENTOS = 6;
/** Dia em que cada momento acontece; o primeiro (a convenção) é antes do dia 1. */
const DIAS = [null, 1, 9, 23, 26, 30];
/** O traço sai pelas casas do mês seguinte e elas abrem; depois crescem até a borda. */
const SAIDA = 0.45;
const COBRIR = 0.55;
const INICIO_SAIDA = PATAMAR_INICIAL + (MOMENTOS - 1) * PASSO;
const INICIO_COBRIR = INICIO_SAIDA + SAIDA;
/**
 * A evolução sobe por cima dos últimos SOBREPOSICAO_TELAS do pin (margem negativa de 45svh
 * em 03-evolucao.css), a partir de 30% da cobertura: quando as casas do mês seguinte fecham a
 * tela, o título dela já está no terço de baixo, e a tela nunca fica só de marinho. Os dois
 * números andam juntos.
 */
const SOBREPOSICAO_TELAS = 0.45;
const CAUDA = SOBREPOSICAO_TELAS / TELAS_POR_UNIDADE - 0.7 * COBRIR;
const DURACAO = INICIO_COBRIR + COBRIR + CAUDA;
/** Com 80% da cobertura a borda de cima já passou da linha do header. */
const LIMIAR_TEMA = INICIO_COBRIR + COBRIR * 0.8;
/**
 * Regras da convenção (na ordem do SVG: vencimento, multa, juros, quórum) e o trecho do
 * relógio em que cada uma age: as três primeiras do vencimento ao acordo, o quórum na
 * assembleia.
 */
const REGRAS_AGINDO = [
  [9.6, 24.4],
  [9.6, 24.4],
  [9.6, 24.4],
  [27, 28.6],
];

/** @param {HTMLElement} root */
function buscarPartes(root) {
  /** @param {string} seletor @returns {HTMLElement} */
  const achar = (seletor) => {
    const el = root.querySelector(seletor);
    if (!(el instanceof HTMLElement)) throw new Error(`[cena mes] falta ${seletor}.`);
    return el;
  };
  /** @param {string} seletor @returns {SVGGraphicsElement[]} */
  const todos = (seletor) => Array.from(root.querySelectorAll(seletor));
  /** @type {HTMLElement[]} */
  const momentos = [];
  for (const el of root.querySelectorAll(".ms-momento")) {
    if (el instanceof HTMLElement) momentos.push(el);
  }
  const calendario = root.querySelector(".ms-calendario");
  const seguinte = root.querySelector(".ms-seguinte");
  const leitura = root.querySelector(".ms-conv-leitura");
  if (
    momentos.length !== MOMENTOS ||
    !(calendario instanceof SVGSVGElement) ||
    !seguinte ||
    !(leitura instanceof SVGRectElement)
  ) {
    throw new Error(`[cena mes] esperava ${MOMENTOS} momentos e o calendário inteiro.`);
  }
  const pecas = todos(".ms-traco").map((el) => ({
    el,
    c0: numero(el, "c0"),
    c1: numero(el, "c1"),
  }));
  return {
    palco: achar(".ms-palco"),
    titulo: achar(".ms-titulo"),
    janela: achar(".ms-janela"),
    legenda: achar(".ms-legenda > span"),
    cobertura: achar(".ms-cobertura"),
    calendario,
    momentos,
    pecas,
    nos: todos(".ms-no").map((el) => ({ el, c: numero(el, "c") })),
    casas: [...todos(".ms-celula"), seguinte].map(casa),
    leitura,
    regras: todos(".ms-regra"),
    alvos: alvosDoRelogio(root),
    relogioFinal: Math.max(...pecas.map((p) => p.c1)),
  };
}

/** Lê data-<nome> numérico; ausente ou inválido é erro do desenho. */
function numero(/** @type {Element} */ el, /** @type {string} */ nome) {
  const valor = Number(el.getAttribute(`data-${nome}`));
  if (!Number.isFinite(valor)) throw new Error(`[cena mes] data-${nome} inválido.`);
  return valor;
}

/** Casa do calendário: o fundo que abre e os textos que acendem com ele. */
function casa(/** @type {Element} */ g) {
  const fundo = g.querySelector("rect");
  if (!(fundo instanceof SVGRectElement)) throw new Error("[cena mes] casa sem fundo.");
  return { c: numero(g, "c"), fundo, textos: Array.from(g.querySelectorAll("text")) };
}

/** O relógio no fim de cada momento: 0 antes do dia 1, depois o relógio do dia do momento. */
function alvosDoRelogio(/** @type {HTMLElement} */ root) {
  return DIAS.map((dia) => {
    if (dia === null) return 0;
    const no = root.querySelector(`.ms-no[data-dia="${dia}"]`);
    if (!no) throw new Error(`[cena mes] falta o nó do dia ${dia}.`);
    return numero(no, "c");
  });
}

/* ---- Desenho: função do relógio --------------------------------------------------------- */

const limitar = (/** @type {number} */ v) => Math.min(1, Math.max(0, v));
/** Ease-in-out seno, para o que abre por conta própria (nó, casa, peso da regra). */
const suave = (/** @type {number} */ v) => 0.5 - Math.cos(Math.PI * limitar(v)) / 2;

/**
 * Põe o mês no estado do relógio `c`: o traço desenhado até c, o nó de cada dia aceso quando o
 * traço chega a ele (acende nos 0,3 dia antes), as
 * casas cujo dia chegou abertas (a casa começa a abrir 0,45 dia antes, para estar aberta
 * quando o traço chega) e o peso das regras que agem agora.
 * @param {ReturnType<typeof buscarPartes>} partes @param {number} c
 */
function desenharMes(partes, c) {
  for (const p of partes.pecas) {
    p.el.style.strokeDashoffset = String(1 - limitar((c - p.c0) / (p.c1 - p.c0)));
  }
  for (const no of partes.nos) {
    no.el.style.transform = `scale(${suave((c - no.c + 0.3) / 0.3)})`;
  }
  for (const casa of partes.casas) {
    const f = suave((c - casa.c + 0.45) / 0.45);
    casa.fundo.style.transform = `scaleY(${f})`;
    for (const texto of casa.textos) texto.style.opacity = String(limitar(f * 2 - 1));
  }
  partes.regras.forEach((regra, i) => {
    const [de, ate] = REGRAS_AGINDO[i];
    const agindo = Math.min(suave((c - de) / 0.4), suave((ate - c) / 0.4));
    regra.style.setProperty("--ms-peso", String(Math.round(400 + 250 * agindo)));
  });
}

/* ---- Entrada (antes do pin) ------------------------------------------------------------- */

/**
 * Toca uma vez quando a cena chega: a folha abre de cima, a IA passa pela convenção e cada
 * regra recebe o visto; o primeiro momento sobe.
 * @param {import("../../core/tipos.js").ContextoCena} ctx
 * @param {ReturnType<typeof buscarPartes>} partes
 */
function entrar(ctx, partes) {
  const { gsap, root, util } = ctx;
  util.revelarTexto(partes.titulo, { gatilho: root, inicio: "top 72%" });
  const tl = gsap.timeline({
    scrollTrigger: { trigger: root, start: "top 72%", toggleActions: "play none none none" },
  });
  tl.fromTo(
    partes.janela,
    { clipPath: "inset(0% 0% 100% 0%)" },
    { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "expo.inOut" },
    0,
  )
    // A entrada sobe os blocos do primeiro momento, não as linhas .ms-in de dentro: estas são
    // do pin, e uma entrada tardia (recarga no meio do pin) as traria de volta por cima.
    .fromTo(
      partes.momentos[0].children,
      { clipPath: "inset(0% 0% 100% 0%)", y: 34 },
      {
        clipPath: "inset(0% 0% 0% 0%)",
        y: 0,
        duration: 1.2,
        ease: "expo.out",
        stagger: 0.09,
        clearProps: "clipPath,transform",
      },
      0.3,
    )
    .fromTo(
      partes.legenda,
      { yPercent: 110 },
      { yPercent: 0, duration: 1.2, ease: "expo.out" },
      0.6,
    );
  lerConvencao(gsap, tl, partes, 0.9);
  desenharFluxo(tl, partes.momentos[0], 1.1, 1.4);
  util.aoImprimir(() => tl.progress(1));
}

/**
 * A IA lê: uma faixa céu varre a convenção e as regras que ela passa ficam legíveis. A gente
 * confere: depois da varredura, cada regra recebe o visto, uma de cada vez.
 * @param {import("../../core/tipos.js").Gsap} gsap @param {gsap.core.Timeline} tl
 * @param {ReturnType<typeof buscarPartes>} partes @param {number} t
 */
function lerConvencao(gsap, tl, partes, t) {
  const textos = partes.regras.map((r) => r.querySelector("text"));
  const vistos = partes.regras.map((r) => r.querySelector(".ms-visto"));
  gsap.set(vistos, { strokeDasharray: 1, strokeDashoffset: 1 });
  gsap.set(textos, { opacity: 0.3 });
  tl.fromTo(partes.leitura, { opacity: 0 }, { opacity: 0.7, duration: 0.2, ease: "none" }, t)
    .fromTo(partes.leitura, { x: 0 }, { x: 297, duration: 1.3, ease: "power2.inOut" }, t)
    .to(partes.leitura, { opacity: 0, duration: 0.3, ease: "none" }, t + 1.2)
    // A varredura chega à coluna da esquerda em ~0,1 s e à da direita em ~0,7 s.
    .to(textos, { opacity: 0.62, duration: 0.3, ease: "none", stagger: 0.3 }, t + 0.1)
    .to(vistos, { strokeDashoffset: 0, duration: 0.45, ease: "power2.out", stagger: 0.24 }, t + 1.5)
    .to(textos, { opacity: 1, duration: 0.3, ease: "none", stagger: 0.24 }, t + 1.6);
}

/**
 * O fluxo do momento: o traço corre da primeira à última etapa e cada nó acende quando ele
 * passa. Na timeline do pin, com o scrub; na entrada, uma vez.
 * @param {gsap.core.Timeline} tl @param {HTMLElement} momento @param {number} t
 * @param {number} duracao
 */
function desenharFluxo(tl, momento, t, duracao) {
  const linha = momento.querySelector(".ms-fluxo-linha");
  const nos = Array.from(momento.querySelectorAll(".ms-fluxo-passos i"));
  if (!linha || !nos.length) throw new Error("[cena mes] momento sem fluxo.");
  tl.fromTo(
    linha,
    { scaleX: 0 },
    { scaleX: 1, duration: duracao, ease: "power2.inOut", immediateRender: false },
    t,
  ).fromTo(
    nos,
    { scale: 0 },
    {
      scale: 1,
      duration: duracao * 0.25,
      ease: "back.out(2.2)",
      stagger: (duracao * 0.85) / Math.max(1, nos.length - 1),
      immediateRender: false,
    },
    t,
  );
}

/* ---- Coreografia do pin ------------------------------------------------------------------ */

/**
 * @param {import("../../core/tipos.js").ContextoCena} ctx @param {gsap.core.Timeline} tl
 * @param {ReturnType<typeof buscarPartes>} partes @param {{ c: number }} relogio
 * @param {() => void} desenhar
 */
function coreografar({ gsap }, tl, partes, relogio, desenhar) {
  gsap.set(
    partes.pecas.map((p) => p.el),
    { strokeDasharray: 1 },
  );
  for (const momento of partes.momentos.slice(1)) {
    gsap.set(momento.querySelectorAll(".ms-in"), { yPercent: 110 });
    gsap.set(momento.querySelector(".ms-fluxo-linha"), { scaleX: 0 });
    gsap.set(momento.querySelectorAll(".ms-fluxo-passos i"), { scale: 0 });
  }
  for (let i = 1; i < MOMENTOS; i += 1) {
    const t = PATAMAR_INICIAL + (i - 1) * PASSO;
    trocarMomento(tl, partes.momentos[i - 1], partes.momentos[i], t);
    desenharFluxo(tl, partes.momentos[i], t + 0.22, TRANSICAO * 0.7);
    andarRelogio(tl, relogio, desenhar, [partes.alvos[i - 1], partes.alvos[i]], t);
  }
  andarRelogio(
    tl,
    relogio,
    desenhar,
    [partes.alvos[MOMENTOS - 1], partes.relogioFinal],
    INICIO_SAIDA,
    SAIDA,
  );
  cobrir(tl, partes);
}

/** O momento antigo sai por cima; o novo sobe por baixo, ~30% depois. */
function trocarMomento(tl, de, para, t) {
  tl.fromTo(
    de.querySelectorAll(".ms-in"),
    { yPercent: 0 },
    { yPercent: -110, duration: 0.26, ease: "power2.in", stagger: 0.04, immediateRender: false },
    t,
  ).fromTo(
    para.querySelectorAll(".ms-in"),
    { yPercent: 110 },
    { yPercent: 0, duration: 0.36, ease: "power3.out", stagger: 0.05, immediateRender: false },
    t + 0.16,
  );
}

/**
 * Move o relógio de um dia a outro; o desenho acompanha a cada render.
 * @param {gsap.core.Timeline} tl @param {{ c: number }} relogio @param {() => void} desenhar
 * @param {[number, number]} trecho @param {number} t @param {number} [duracao]
 */
function andarRelogio(tl, relogio, desenhar, [de, ate], t, duracao = TRANSICAO) {
  tl.fromTo(
    relogio,
    { c: de },
    { c: ate, duration: duracao, ease: "power1.inOut", immediateRender: false, onUpdate: desenhar },
    t,
  );
}

/**
 * As casas do mês seguinte, já abertas em marinho, crescem até cobrir o palco. O recorte
 * inicial sai da geometria do SVG (getBBox não sofre a escala da casa abrindo), a cada
 * refresh (o pin tem invalidateOnRefresh).
 * @param {gsap.core.Timeline} tl @param {ReturnType<typeof buscarPartes>} partes
 */
function cobrir(tl, partes) {
  const fundo = partes.casas[partes.casas.length - 1].fundo;
  const medir = () => {
    const palco = partes.palco.getBoundingClientRect();
    const matriz = partes.calendario.getScreenCTM();
    if (!matriz) return "inset(100% 0px 0px 0px)";
    const caixa = fundo.getBBox();
    const a = new DOMPoint(caixa.x, caixa.y).matrixTransform(matriz);
    const b = new DOMPoint(caixa.x + caixa.width, caixa.y + caixa.height).matrixTransform(matriz);
    const px = (/** @type {number} */ v) => `${Math.max(0, v).toFixed(1)}px`;
    return `inset(${px(a.y - palco.top)} ${px(palco.right - b.x)} ${px(palco.bottom - b.y)} ${px(
      a.x - palco.left,
    )})`;
  };
  tl.fromTo(
    partes.cobertura,
    { clipPath: () => medir() },
    {
      clipPath: "inset(0px 0px 0px 0px)",
      duration: COBRIR,
      ease: "power3.inOut",
      immediateRender: false,
    },
    INICIO_COBRIR,
  ).to({}, { duration: CAUDA }, INICIO_COBRIR + COBRIR);
}

/* ---- Tema --------------------------------------------------------------------------------- */

/**
 * Coberta de marinho, a cena passa a se declarar marinho. O header é atualizado aqui também:
 * o scrub continua depois que a rolagem para, e o core só relê o tema quando há rolagem.
 * @param {HTMLElement} root @param {"claro" | "marinho"} tema
 */
function aplicarTema(root, tema) {
  if (root.dataset.tema === tema) return;
  root.dataset.tema = tema;
  const cabecalho = document.querySelector("[data-cabecalho]");
  if (!(cabecalho instanceof HTMLElement)) return;
  const linha = cabecalho.getBoundingClientRect().bottom + 1;
  const caixa = root.getBoundingClientRect();
  if (caixa.top <= linha && caixa.bottom > linha) cabecalho.dataset.tema = tema;
}
