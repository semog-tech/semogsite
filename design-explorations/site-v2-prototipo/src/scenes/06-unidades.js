/**
 * Cena 06 · unidades "perto de cada condomínio". As quatro Unidades em grade áurea
 * alternada: cada moldura abre por cortina reta e a foto assenta do zoom; o nome da cidade
 * sobe por máscara e a avaliação do Google entra linha a linha. Uma única rota, medida nos
 * pontos reais do DOM, corre no vão entre foto e texto de Recife a Belém (na margem, no
 * celular): a ponta acompanha a rolagem e, ao chegar a uma cidade, o marco enche e o nome
 * ganha peso.
 *
 * @param {import("../core/tipos.js").ContextoCena} ctx
 */
export default function init({ gsap, ScrollTrigger, root, util, estreito }) {
  const titulo = root.querySelector(".unidades-titulo");
  if (titulo instanceof HTMLElement) {
    enfatizarTitulo(titulo);
    util.revelarTexto(titulo, { duracao: 1.1 });
  }
  const lead = root.querySelector(".unidades-lead");
  if (lead instanceof HTMLElement) {
    util.revelarTexto(lead, { gatilho: titulo ?? lead, atraso: 0.45 });
  }
  /** @type {HTMLElement[]} */
  const unidades = Array.from(root.querySelectorAll(".unidade"));
  for (const unidade of unidades) revelarUnidade(gsap, util, unidade, estreito());
  ligarRota(gsap, ScrollTrigger, util, root, unidades);
  revelarAviso(gsap, root);
}

/**
 * O trecho depois da vírgula do título ("perto de cada condomínio.") vira a ênfase por
 * peso. O texto vem do conteudo.json; sem vírgula, o título fica como está.
 * @param {HTMLElement} titulo
 */
function enfatizarTitulo(titulo) {
  const texto = (titulo.textContent ?? "").trim();
  const corte = texto.indexOf(", ");
  if (corte < 0) return;
  const enfase = document.createElement("em");
  enfase.className = "peso";
  enfase.textContent = texto.slice(corte + 2);
  titulo.textContent = texto.slice(0, corte + 2);
  titulo.append(enfase);
}

/**
 * Entrada encadeada de uma Unidade: moldura e foto (core), depois o nome da cidade por
 * máscara, a linha da Unidade e o link, e por fim cada avaliação. Lado a lado, o texto
 * espera a cortina andar; empilhado, cada bloco entra quando ele chega à tela.
 * @param {import("../core/tipos.js").Gsap} gsap @param {import("../core/tipos.js").Util} util
 * @param {HTMLElement} unidade @param {boolean} empilhado
 */
function revelarUnidade(gsap, util, unidade, empilhado) {
  const quadro = unidade.querySelector(".unidade-quadro");
  if (quadro instanceof HTMLElement) util.revelarQuadro(quadro);
  const cidade = unidade.querySelector(".unidade-cidade");
  const gatilho = empilhado ? cidade : unidade;
  const atraso = empilhado ? 0 : 0.5;
  if (cidade instanceof HTMLElement && gatilho) {
    util.revelarTexto(cidade, { gatilho, inicio: "top 82%", atraso, duracao: 1.2 });
  }
  gsap.fromTo(
    unidade.querySelectorAll(".unidade-uf, .unidade-link"),
    { clipPath: "inset(0% 0% 100% 0%)", y: 21 },
    {
      clipPath: "inset(0% 0% -20% 0%)",
      y: 0,
      duration: 1,
      ease: "expo.out",
      stagger: 0.1,
      delay: atraso + 0.45,
      scrollTrigger: { trigger: gatilho ?? unidade, start: "top 82%", once: true },
    },
  );
  for (const voz of unidade.querySelectorAll(".voz")) {
    if (voz instanceof HTMLElement) revelarVoz(gsap, util, voz, empilhado ? 0 : 0.3);
  }
}

/**
 * Aspas desenhadas da esquerda, citação linha a linha por máscara, autoria por último.
 * @param {import("../core/tipos.js").Gsap} gsap @param {import("../core/tipos.js").Util} util
 * @param {HTMLElement} voz @param {number} atraso
 */
function revelarVoz(gsap, util, voz, atraso) {
  const scrollTrigger = { trigger: voz, start: "top 85%", once: true };
  gsap.fromTo(
    voz.querySelector(".voz-aspas"),
    { clipPath: "inset(0% 100% 0% 0%)" },
    {
      clipPath: "inset(0% 0% 0% 0%)",
      duration: 0.8,
      ease: "expo.out",
      delay: atraso,
      scrollTrigger,
    },
  );
  const texto = voz.querySelector(".voz-texto p");
  if (texto instanceof HTMLElement) {
    util.revelarTexto(texto, {
      gatilho: voz,
      inicio: "top 85%",
      atraso: atraso + 0.2,
      duracao: 1.1,
    });
  }
  gsap.fromTo(
    voz.querySelector(".voz-autor"),
    { clipPath: "inset(0% 0% 100% 0%)", y: 13 },
    {
      clipPath: "inset(0% 0% -20% 0%)",
      y: 0,
      duration: 0.9,
      ease: "expo.out",
      delay: atraso + 0.75,
      scrollTrigger,
    },
  );
}

/** @param {import("../core/tipos.js").Gsap} gsap @param {HTMLElement} root */
function revelarAviso(gsap, root) {
  const aviso = root.querySelector(".unidades-aviso");
  if (!aviso) return;
  gsap.fromTo(
    aviso,
    { clipPath: "inset(0% 100% 0% 0%)" },
    {
      clipPath: "inset(0% 0% 0% 0%)",
      duration: 1,
      ease: "expo.out",
      scrollTrigger: { trigger: aviso, start: "top 92%", once: true },
    },
  );
}

/* ---- Rota ---------------------------------------------------------------------- */

const SVG = "http://www.w3.org/2000/svg";
const LADO_MARCO = 9;
const LADO_MARCO_MARGEM = 7;
const LADO_PONTA = 5;
const AMOSTRAS = 320;

/**
 * @typedef {Object} Parada
 * @property {number} x Coluna da rota nesta Unidade (vão entre foto e texto, ou margem).
 * @property {number} topo Topo da Unidade.
 * @property {number} marco Altura do marco: meio da primeira linha do nome da cidade.
 * @property {number} fim Pé da Unidade.
 */

/**
 * Liga a rota à rolagem: a ponta fica sempre na linha de 62% da tela, convertida em
 * comprimento do traço por uma tabela altura → comprimento (o traço só desce, então a
 * altura é monótona ao longo dele). Scrub 0,7 suaviza.
 * @param {import("../core/tipos.js").Gsap} gsap
 * @param {import("../core/tipos.js").ScrollTriggerEstatico} ScrollTrigger
 * @param {import("../core/tipos.js").Util} util
 * @param {HTMLElement} root @param {HTMLElement[]} unidades
 */
function ligarRota(gsap, ScrollTrigger, util, root, unidades) {
  const lista = root.querySelector(".unidades-lista");
  const svg = lista?.querySelector(".unidades-rota");
  if (!(lista instanceof HTMLElement) || !(svg instanceof SVGSVGElement) || !unidades.length) {
    console.error("[cena unidades] lista ou rota ausente; segue sem a rota.");
    return;
  }
  const rota = montarRota(svg, unidades.length);
  const estado = { progresso: 0 };
  const aplicar = () => aplicarRota(rota, unidades, estado.progresso);
  const remedir = () => {
    medirRota(rota, root, lista, unidades);
    aplicar();
  };
  ScrollTrigger.addEventListener("refresh", remedir);
  remedir();
  gsap.to(estado, {
    progresso: 1,
    ease: "none",
    onUpdate: aplicar,
    scrollTrigger: { trigger: lista, start: "top 62%", end: "bottom 62%", scrub: 0.7 },
  });
  util.aoImprimir(() => {
    estado.progresso = 1;
    aplicar();
  });
}

/** @param {SVGSVGElement} svg @param {number} quantidade */
function montarRota(svg, quantidade) {
  const base = /** @type {SVGPathElement} */ (svg.querySelector(".rota-base"));
  const feita = /** @type {SVGPathElement} */ (svg.querySelector(".rota-feita"));
  const grupo = /** @type {SVGGElement} */ (svg.querySelector(".rota-marcos"));
  const criar = (/** @type {string} */ classe, /** @type {number} */ lado) => {
    const r = document.createElementNS(SVG, "rect");
    r.setAttribute("class", classe);
    r.setAttribute("width", String(lado));
    r.setAttribute("height", String(lado));
    grupo.append(r);
    return r;
  };
  const marcos = Array.from({ length: quantidade }, () => ({
    base: criar("marco-base", LADO_MARCO),
    cheio: criar("marco-cheio", LADO_MARCO),
  }));
  const ponta = criar("rota-ponta", LADO_PONTA);
  return {
    base,
    feita,
    marcos,
    ponta,
    comprimento: 0,
    altura: 0,
    /** @type {Parada[]} */ paradas: [],
    /** @type {{ y: number, c: number }[]} */ tabela: [],
  };
}

/**
 * Lado a lado, a rota corre no meio do vão entre foto e texto; empilhado (celular), na
 * metade da margem esquerda da página, fora do conteúdo.
 * @param {HTMLElement} unidade @param {DOMRect} origem @param {number} margem
 * @returns {Parada}
 */
function medirParada(unidade, origem, margem) {
  const caixa = (/** @type {string} */ sel) =>
    /** @type {Element} */ (unidade.querySelector(sel)).getBoundingClientRect();
  const quadro = caixa(".unidade-quadro");
  const texto = caixa(".unidade-texto");
  const cidadeEl = /** @type {Element} */ (unidade.querySelector(".unidade-cidade"));
  const cidade = cidadeEl.getBoundingClientRect();
  const empilhado = quadro.bottom <= texto.top + 1;
  let x = -margem / 2;
  if (!empilhado) {
    x =
      quadro.left < texto.left ? (quadro.right + texto.left) / 2 : (texto.right + quadro.left) / 2;
    x -= origem.left;
  }
  const linha = parseFloat(getComputedStyle(cidadeEl).fontSize) * 0.95;
  const total = unidade.getBoundingClientRect();
  return {
    x: Math.round(x) + 0.5,
    topo: total.top - origem.top,
    marco: cidade.top - origem.top + Math.min(linha, cidade.height) / 2,
    fim: total.bottom - origem.top,
  };
}

/**
 * Monta o traço: desce reto pela coluna da Unidade e, quando a coluna muda de lado, cruza
 * em S no respiro entre uma Unidade e a outra, sem passar sobre foto nem texto.
 * @param {ReturnType<typeof montarRota>} rota @param {HTMLElement} root
 * @param {HTMLElement} lista @param {HTMLElement[]} unidades
 */
function medirRota(rota, root, lista, unidades) {
  const origem = lista.getBoundingClientRect();
  const margem = origem.left - root.getBoundingClientRect().left;
  const p = unidades.map((u) => medirParada(u, origem, margem));
  let d = `M${p[0].x} ${p[0].marco}`;
  for (let i = 1; i < p.length; i++) {
    const a = p[i - 1];
    const c = p[i];
    if (a.x !== c.x) {
      const meio = (a.fim + c.topo) / 2;
      d += ` L${a.x} ${a.fim} C${a.x} ${meio} ${c.x} ${meio} ${c.x} ${c.topo}`;
    }
    d += ` L${c.x} ${c.marco}`;
  }
  rota.base.setAttribute("d", d);
  rota.feita.setAttribute("d", d);
  rota.comprimento = rota.base.getTotalLength();
  rota.altura = origem.height;
  rota.paradas = p;
  rota.tabela = tabelarAltura(rota.base, rota.comprimento);
  rota.feita.style.strokeDasharray = `${rota.comprimento}`;
  posicionarMarcos(rota, p);
}

/**
 * Marcos centrados em cada parada; na margem do celular (x negativo) ficam menores, para
 * não encostar no nome da cidade.
 * @param {ReturnType<typeof montarRota>} rota @param {Parada[]} paradas
 */
function posicionarMarcos(rota, paradas) {
  paradas.forEach((parada, i) => {
    const lado = parada.x < 0 ? LADO_MARCO_MARGEM : LADO_MARCO;
    for (const r of [rota.marcos[i].base, rota.marcos[i].cheio]) {
      r.setAttribute("width", String(lado));
      r.setAttribute("height", String(lado));
      r.setAttribute("x", String(parada.x - lado / 2));
      r.setAttribute("y", String(parada.marco - lado / 2));
    }
  });
}

/** @param {SVGPathElement} caminho @param {number} comprimento */
function tabelarAltura(caminho, comprimento) {
  return Array.from({ length: AMOSTRAS + 1 }, (_, i) => {
    const c = (comprimento * i) / AMOSTRAS;
    return { y: caminho.getPointAtLength(c).y, c };
  });
}

/**
 * Comprimento do traço na altura y (busca binária na tabela, interpolação linear).
 * @param {{ y: number, c: number }[]} tabela @param {number} y
 */
function comprimentoNaAltura(tabela, y) {
  if (!tabela.length || y <= tabela[0].y) return 0;
  const ultimo = tabela[tabela.length - 1];
  if (y >= ultimo.y) return ultimo.c;
  let baixo = 0;
  let alto = tabela.length - 1;
  while (alto - baixo > 1) {
    const meio = (baixo + alto) >> 1;
    if (tabela[meio].y < y) baixo = meio;
    else alto = meio;
  }
  const a = tabela[baixo];
  const b = tabela[alto];
  const t = b.y === a.y ? 1 : (y - a.y) / (b.y - a.y);
  return a.c + (b.c - a.c) * t;
}

/**
 * @param {ReturnType<typeof montarRota>} rota @param {HTMLElement[]} unidades
 * @param {number} progresso 0 a 1 ao longo da lista
 */
function aplicarRota(rota, unidades, progresso) {
  if (!rota.comprimento) return;
  const y = progresso * rota.altura;
  const andado = comprimentoNaAltura(rota.tabela, y);
  rota.feita.style.strokeDashoffset = `${rota.comprimento - andado}`;
  const ponto = rota.base.getPointAtLength(andado);
  rota.ponta.setAttribute("x", String(ponto.x - LADO_PONTA / 2));
  rota.ponta.setAttribute("y", String(ponto.y - LADO_PONTA / 2));
  rota.ponta.style.opacity = andado > 0 && andado < rota.comprimento - 0.5 ? "1" : "0";
  rota.paradas.forEach((parada, i) => {
    const chegou = y >= parada.marco - 1;
    rota.marcos[i].cheio.classList.toggle("ativo", chegou);
    unidades[i].classList.toggle("chegou", chegou);
  });
}
