/**
 * Cena 05 · ranking. Abre com a chamada de liderança (a mais bem posicionada do Norte
 * e Nordeste) e depois a explica pelos números, num palco fixado: um campo de pontos (as administradoras da base Superlógica) se filtra no Top 200, depois
 * no G20 Condo, e um único ponto acende em marinho na 5ª posição e viaja até virar a
 * régua de onde nasce o "5º". Depois do pin, a linha dos três ciclos no G20 se desenha e a foto
 * abre. Sem canvas 2D a cena segue só com o texto, que é a versão completa.
 *
 * @param {import("../core/tipos.js").ContextoCena} ctx
 */

/** Ranking Top 200 e G20 Condo: os nomes são os tamanhos dos grupos. */
const TOP = 200;
const G20 = 20;
/** Índice do ponto da Semog: a posição no ranking, contando de zero. */
const PONTO_SEMOG = 4;

/** Trechos da rolagem fixada (p de 0 a 1) em que o campo muda de forma. */
const FASES = {
  // Enquanto a chamada ocupa o palco, o campo fica velado; depois acende por inteiro.
  revela: [0.06, 0.16],
  top: [0.2, 0.4],
  g20: [0.5, 0.64],
  marca: [0.64, 0.7],
  regua: [0.7, 0.85],
};
/**
 * Janelas dos passos, na ordem do HTML (a chamada é o primeiro): [entra de, entra até] e
 * [sai de, sai até]. A chamada entra na chegada, antes do pin (ela mora no alto do palco,
 * então já aparece com a seção a ~80% da tela) e por isso sai cedo. Os passos ocupam o mesmo lugar, então
 * um só entra quando o anterior acabou de sair: encadeados, sem sobrepor letra.
 */
const PASSOS = [
  { entra: null, sai: [0.06, 0.12] },
  { entra: [0.12, 0.2], sai: [0.3, 0.35] },
  { entra: [0.35, 0.43], sai: [0.55, 0.6] },
  { entra: [0.6, 0.67], sai: [0.75, 0.8] },
];
const MANCHETE = { numeral: [0.81, 0.9], peso: [0.83, 0.97], frase: [0.85, 0.94] };
/**
 * Onde o toque assenta: a chamada no começo do pin, o meio de cada passo inteiro na tela
 * (entre acabar de entrar e começar a sair) e a manchete no fim.
 */
const PATAMARES = [
  0,
  ...PASSOS.slice(1).map(({ entra, sai }) => ((entra?.[1] ?? 0) + sai[0]) / 2),
  1,
];
/** Chegada (antes do pin) em que a chamada sobe da máscara. */
const CHAMADA_CHEGADA = [0.15, 0.65];
/** Peso final do "5º": 550 equilibra com os títulos leves da página. */
const PESO_NUMERAL = 550;

/** @param {number} v @param {number} a @param {number} b */
const faixa = (v, a, b) => (v <= a ? 0 : v >= b ? 1 : (v - a) / (b - a));
/** @param {number} a @param {number} b @param {number} t */
const lerp = (a, b, t) => a + (b - a) * t;

export default function init(ctx) {
  const { root, util, gsap } = ctx;
  const palco = /** @type {HTMLElement} */ (root.querySelector(".ranking-palco"));
  root.classList.add("ranking-com-palco");
  /** @type {EstadoRanking} */
  const estado = { p: 0, chegada: 0 };

  const textos = montarTextos(ctx);
  const aplicar = () => textos.aplicar(estado);
  const tl = util.pinScrub(root, {
    alvo: palco,
    // No celular os passos ficam mais longos: o toque assenta no meio de cada um, e com 200%
    // eles ficavam a ~0,5 tela um do outro, menos que um flick curto.
    distancia: ctx.estreito() ? "+=300%" : "+=215%",
    patamares: () => PATAMARES,
  });
  tl.to(estado, { p: 1, duration: 1, onUpdate: aplicar });
  gsap.to(estado, {
    chegada: 1,
    ease: "none",
    onUpdate: aplicar,
    scrollTrigger: { trigger: root, start: "top 95%", end: "top 15%", scrub: 0.6 },
  });
  aplicar();

  ligarCampo(ctx, palco, estado);
  animarHistorico(ctx);
  const foto = root.querySelector(".ranking-foto");
  if (foto instanceof HTMLElement) util.revelarQuadro(foto);
}

/**
 * @typedef {Object} EstadoRanking
 * @property {number} p progresso da cena fixada, 0 a 1
 * @property {number} chegada aproximação da seção antes do pin, 0 a 1
 */

/* ---- Texto por máscara, dirigido pela rolagem ------------------------------------ */

/**
 * Cada texto vira uma timeline pausada (entra de baixo, sai para cima, linha a linha);
 * a rolagem escolhe o tempo. O SplitText refaz as linhas quando a largura muda.
 * @param {import("../core/tipos.js").ContextoCena} ctx
 */
function montarTextos(ctx) {
  const { root, gsap, SplitText } = ctx;
  const passos = Array.from(root.querySelectorAll(".ranking-passo")).map((passo) =>
    Array.from(passo.querySelectorAll("[data-texto]")).map((el) =>
      dividir(SplitText, el, "lines", (partes) => linhaDeIdaEVolta(gsap, partes, el)),
    ),
  );
  const frase = dividir(SplitText, root.querySelector(".ranking-entre"), "words", (partes) =>
    gsap
      .timeline({ paused: true })
      .fromTo(
        partes,
        { yPercent: 110 },
        { yPercent: 0, duration: 1, ease: "expo.out", stagger: 0.06 },
      ),
  );
  const numeral = /** @type {HTMLElement} */ (root.querySelector(".ranking-posicao"));
  const subir = gsap.quickSetter(numeral, "yPercent");
  const expoOut = gsap.parseEase("expo.out");
  const pesoEase = gsap.parseEase("power2.inOut");

  return {
    /** @param {EstadoRanking} e */
    aplicar(e) {
      passos.forEach((textosDoPasso, k) => {
        const { entra, sai } = PASSOS[k];
        const dentro = entra
          ? faixa(e.p, entra[0], entra[1])
          : faixa(e.chegada, ...CHAMADA_CHEGADA);
        const fora = faixa(e.p, sai[0], sai[1]);
        textosDoPasso.forEach((texto, j) =>
          texto.posicionar(Math.max(0, dentro - j * 0.18) / (1 - j * 0.18), fora),
        );
      });
      subir(135 * (1 - expoOut(faixa(e.p, ...MANCHETE.numeral))));
      const peso = lerp(250, PESO_NUMERAL, pesoEase(faixa(e.p, ...MANCHETE.peso)));
      numeral.style.fontVariationSettings = `"wght" ${peso.toFixed(0)}`;
      frase.posicionar(faixa(e.p, ...MANCHETE.frase), 0);
    },
  };
}

/**
 * Divide o elemento em linhas ou palavras com máscara e guarda a timeline atual.
 * @param {import("../core/tipos.js").ContextoCena["SplitText"]} SplitText
 * @param {Element | null} el
 * @param {"lines" | "words"} tipo
 * @param {(partes: Element[]) => gsap.core.Timeline} montar
 */
function dividir(SplitText, el, tipo, montar) {
  /** @type {{ tl: gsap.core.Timeline | null, dentro: number, fora: number }} */
  const atual = { tl: null, dentro: 0, fora: 0 };
  const posicionar = () => {
    const tl = atual.tl;
    if (!tl) return;
    const meio = tl.labels.meio ?? tl.duration();
    const tempo = atual.fora > 0 ? meio + atual.fora * (tl.duration() - meio) : atual.dentro * meio;
    tl.time(tempo);
  };
  if (!(el instanceof HTMLElement)) throw new Error("[cena ranking] texto da cena ausente.");
  SplitText.create(el, {
    type: tipo,
    mask: tipo,
    autoSplit: true,
    linesClass: "revela-linha",
    wordsClass: "revela-palavra",
    onSplit(self) {
      atual.tl = montar(tipo === "lines" ? self.lines : self.words);
      posicionar();
      return atual.tl;
    },
  });
  return {
    /** @param {number} dentro 0 a 1 @param {number} fora 0 a 1 */
    posicionar(dentro, fora) {
      atual.dentro = Math.min(1, Math.max(0, dentro));
      atual.fora = fora;
      posicionar();
    },
  };
}

/**
 * Linhas entram de baixo e saem para cima; o `.peso` de dentro ganha peso na entrada.
 * @param {typeof import("gsap").gsap} gsap @param {Element[]} linhas @param {Element} el
 */
function linhaDeIdaEVolta(gsap, linhas, el) {
  const tl = gsap
    .timeline({ paused: true })
    .fromTo(
      linhas,
      { yPercent: 110 },
      { yPercent: 0, duration: 1, ease: "expo.out", stagger: 0.1 },
    );
  const pesos = el.querySelectorAll(".peso");
  if (pesos.length) {
    tl.fromTo(
      pesos,
      { fontVariationSettings: '"wght" 250' },
      { fontVariationSettings: '"wght" 600', duration: 1, ease: "power2.inOut" },
      0.3,
    );
  }
  return tl
    .addLabel("meio")
    .fromTo(
      linhas,
      { yPercent: 0 },
      { yPercent: -110, duration: 0.7, ease: "expo.in", stagger: 0.06, immediateRender: false },
    );
}

/* ---- Campo de pontos (canvas 2D) ---------------------------------------------------- */

/**
 * @typedef {Object} Geometria
 * @property {number} w @property {number} h
 * @property {boolean} compacta
 * @property {Float32Array} campo x, y por ponto (canto superior esquerdo)
 * @property {Float32Array} fileira x, y por ponto do Top 200
 * @property {Float32Array} resto x, y dos 180 que ficam na fileira quando o G20 sobe
 * @property {Float32Array} grupo x, y por ponto do G20
 * @property {{ x: number, y: number, w: number, h: number }} regua
 * @property {{ ponto: number, fileiraW: number, fileiraH: number, grupoW: number, grupoH: number }} tam
 * @property {{ x: number, y: number }} centro
 */

/**
 * @param {import("../core/tipos.js").ContextoCena} ctx
 * @param {HTMLElement} palco @param {EstadoRanking} estado
 */
function ligarCampo(ctx, palco, estado) {
  const { root, util, ScrollTrigger, conteudo } = ctx;
  const canvas = root.querySelector(".ranking-campo");
  if (!(canvas instanceof HTMLCanvasElement)) throw new Error("[cena ranking] canvas ausente.");
  const sementes = criarSementes(conteudo.ranking.total);
  /** @type {{ ctx: CanvasRenderingContext2D, w: number, h: number } | null} */
  let pintura = null;
  /** @type {Geometria | null} */
  let geo = null;
  let cor = "";
  const montar = () => {
    if (!document.documentElement.classList.contains("motion")) return;
    try {
      // O canvas só tem tamanho quando aparece: a classe vem antes da medida.
      root.classList.add("ranking-com-campo");
      pintura = util.prepararCanvas2D(canvas);
      geo = medirGeometria(root, palco, sementes, ctx.estreito());
      cor = `rgb(${util.corDoToken("--marinho").join(" ")})`;
    } catch (erro) {
      pintura = null;
      root.classList.remove("ranking-com-campo");
      console.error("[cena ranking] campo indisponível; a cena segue só com o texto.", erro);
    }
  };
  ScrollTrigger.addEventListener("refresh", montar);
  montar();
  const quadro = criarQuadro(sementes.n);
  util.lacoVisivel(root, (tempo) => {
    if (!pintura || !geo) return;
    calcularQuadro(quadro, { geo, sementes, estado, tempo });
    desenhar(pintura, quadro, cor);
  });
}

/** Números pseudoaleatórios estáveis (mulberry32): o campo é o mesmo a cada visita. */
function aleatorio(semente) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Por ponto: a casa no campo (ordem embaralhada, para que o Top 200 venha de todo lado),
 * a fase do respiro, o brilho e o atraso de cada movimento.
 * @param {number} n
 */
function criarSementes(n) {
  const sorte = aleatorio(3500);
  const casa = Uint32Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(sorte() * (i + 1));
    [casa[i], casa[j]] = [casa[j], casa[i]];
  }
  const jitter = Float32Array.from({ length: n * 2 }, () => sorte());
  const fase = Float32Array.from({ length: n }, () => sorte() * Math.PI * 2);
  const brilho = Float32Array.from({ length: n }, () => sorte());
  const atraso = Float32Array.from({ length: n }, () => sorte());
  return { n, casa, jitter, fase, brilho, atraso };
}

/**
 * @param {HTMLElement} root @param {HTMLElement} palco
 * @param {ReturnType<typeof criarSementes>} s @param {boolean} compacta
 * @returns {Geometria}
 */
function medirGeometria(root, palco, s, compacta) {
  const caixa = palco.getBoundingClientRect();
  const area = medirArea(root, caixa, compacta);
  const tam = {
    ponto: compacta ? 2 : 2.5,
    fileiraW: compacta ? 1.5 : 2,
    fileiraH: compacta ? 8 : 13,
    grupoW: compacta ? 3 : 4,
    grupoH: compacta ? 34 : 55,
  };
  return {
    w: caixa.width,
    h: caixa.height,
    compacta,
    campo: poseCampo(s, area),
    fileira: poseFileira(area, tam, compacta ? 4 : 2, TOP),
    resto: poseFileira(area, tam, compacta ? 4 : 2, TOP - G20),
    grupo: poseGrupo(area, tam),
    regua: medirRegua(root, caixa, compacta),
    tam,
    centro: { x: (area.x0 + area.x1) / 2, y: (area.y0 + area.y1) / 2 },
  };
}

/**
 * Área livre do campo: à direita dos passos no desktop, acima deles no celular.
 * @param {HTMLElement} root @param {DOMRect} caixa @param {boolean} compacta
 */
function medirArea(root, caixa, compacta) {
  const grade = /** @type {HTMLElement} */ (root.querySelector(".ranking-grade"));
  const passos = /** @type {HTMLElement} */ (root.querySelector(".ranking-passos"));
  const g = grade.getBoundingClientRect();
  const l = passos.getBoundingClientRect();
  const cabecalho =
    document.querySelector("[data-cabecalho]")?.getBoundingClientRect().height ?? 68;
  if (compacta) {
    return {
      x0: g.left - caixa.left,
      x1: g.right - caixa.left,
      y0: cabecalho + 21,
      y1: l.top - caixa.top - 34,
    };
  }
  return {
    x0: l.right - caixa.left + 55,
    x1: g.right - caixa.left,
    y0: cabecalho + 34,
    y1: caixa.height - 55,
  };
}

/** Grade com tremor: cobre a área sem formar padrão. */
function poseCampo(s, a) {
  const w = a.x1 - a.x0;
  const h = a.y1 - a.y0;
  const colunas = Math.max(1, Math.round(Math.sqrt((s.n * w) / h)));
  const linhas = Math.ceil(s.n / colunas);
  const pose = new Float32Array(s.n * 2);
  for (let i = 0; i < s.n; i++) {
    const c = s.casa[i];
    const col = c % colunas;
    const lin = Math.floor(c / colunas);
    pose[i * 2] = a.x0 + ((col + s.jitter[i * 2]) / colunas) * w;
    pose[i * 2 + 1] = a.y0 + ((lin + s.jitter[i * 2 + 1]) / linhas) * h;
  }
  return pose;
}

/**
 * Fileiras (duas no desktop, quatro no celular) na ordem do ranking. Serve ao Top 200 e, quando o G20 sobe,
 * aos 180 que ficam: eles se reacomodam na largura toda, sem deixar buraco.
 */
function poseFileira(a, tam, fileiras, quantos) {
  const porFileira = quantos / fileiras;
  const passo = (a.x1 - a.x0) / porFileira;
  const vao = 13;
  const cy = (a.y0 + a.y1) / 2;
  const pose = new Float32Array(quantos * 2);
  for (let i = 0; i < quantos; i++) {
    const f = Math.floor(i / porFileira);
    pose[i * 2] = a.x0 + ((i % porFileira) + 0.5) * passo - tam.fileiraW / 2;
    pose[i * 2 + 1] = cy + (f - fileiras / 2) * (tam.fileiraH + vao) + vao / 2;
  }
  return pose;
}

/** O G20 espaçado na largura da área, com a base na mesma linha da fileira. */
function poseGrupo(a, tam) {
  const passo = (a.x1 - a.x0) / G20;
  const base = (a.y0 + a.y1) / 2 + tam.fileiraH / 2;
  const pose = new Float32Array(G20 * 2);
  for (let i = 0; i < G20; i++) {
    pose[i * 2] = a.x0 + (i + 0.5) * passo - tam.grupoW / 2;
    pose[i * 2 + 1] = base - tam.grupoH;
  }
  return pose;
}

/** A régua fica logo abaixo do recorte do numeral: o "5º" nasce dela. */
function medirRegua(root, caixa, compacta) {
  const mascara = /** @type {HTMLElement} */ (root.querySelector(".ranking-posicao-mascara"));
  const r = mascara.getBoundingClientRect();
  return {
    x: r.left - caixa.left,
    y: r.bottom - caixa.top + (compacta ? 5 : 8),
    w: r.width,
    h: compacta ? 2 : 3,
  };
}

/** Buffers do quadro, reaproveitados (nada é alocado no laço). @param {number} n */
function criarQuadro(n) {
  return {
    n,
    x: new Float32Array(n),
    y: new Float32Array(n),
    w: new Float32Array(n),
    h: new Float32Array(n),
    a: new Float32Array(n),
  };
}

const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
/** Cada ponto parte um pouco depois do outro: o movimento corre como onda, não em bloco. */
const local = (t, atraso) => suave(faixa(t, atraso * 0.35, atraso * 0.35 + 0.65));

/**
 * @param {ReturnType<typeof criarQuadro>} q
 * @param {{ geo: Geometria, sementes: ReturnType<typeof criarSementes>, estado: EstadoRanking, tempo: number }} dados
 */
function calcularQuadro(q, { geo, sementes, estado, tempo }) {
  const t = {
    top: faixa(estado.p, ...FASES.top),
    g20: faixa(estado.p, ...FASES.g20),
    revela: faixa(estado.p, ...FASES.revela),
    marca: suave(faixa(estado.p, ...FASES.marca)),
    regua: faixa(estado.p, ...FASES.regua),
    chegada: estado.chegada,
  };
  for (let i = 0; i < q.n; i++) {
    posicionarNoCampo(q, i, { geo, sementes, t, tempo });
    if (i < TOP) alinhar(q, i, { geo, sementes, t });
    else q.a[i] *= 1 - 0.62 * local(t.top, sementes.atraso[i]) - 0.3 * t.regua;
  }
}

/** Pose de partida: o campo, que chega de um pouco mais aberto e respira devagar. */
function posicionarNoCampo(q, i, { geo, sementes, t, tempo }) {
  const atraso = sementes.atraso[i];
  const fase = sementes.fase[i];
  const chegou = local(t.chegada, atraso);
  const abertura = 1 + 0.16 * (1 - chegou);
  const vida = i < TOP ? 1 - local(t.top, atraso) : 1;
  const amplitude = (geo.compacta ? 2 : 3) * vida;
  q.x[i] = geo.centro.x + (geo.campo[i * 2] - geo.centro.x) * abertura;
  q.y[i] = geo.centro.y + (geo.campo[i * 2 + 1] - geo.centro.y) * abertura;
  q.x[i] += Math.sin(tempo * 0.5 + fase) * amplitude;
  q.y[i] += Math.cos(tempo * 0.43 + fase * 1.7) * amplitude;
  q.w[i] = geo.tam.ponto;
  q.h[i] = geo.tam.ponto;
  const brilho = 0.22 + 0.2 * sementes.brilho[i];
  const veu = 0.38 + 0.62 * t.revela;
  q.a[i] = brilho * (0.78 + 0.22 * Math.sin(tempo * 0.9 + fase)) * chegou * veu;
}

/** Top 200 → fileira; G20 → espaçados; o 5º → marinho e régua. */
function alinhar(q, i, { geo, sementes, t }) {
  const atraso = sementes.atraso[i];
  const e1 = local(t.top, atraso);
  mover(q, i, geo.fileira[i * 2], geo.fileira[i * 2 + 1], geo.tam.fileiraW, geo.tam.fileiraH, e1);
  q.a[i] = lerp(q.a[i], 0.55, e1);
  const e2 = local(t.g20, atraso);
  if (i >= G20) {
    const j = (i - G20) * 2;
    mover(q, i, geo.resto[j], geo.resto[j + 1], geo.tam.fileiraW, geo.tam.fileiraH, e2);
    q.a[i] = lerp(q.a[i], 0.12, e2) * (1 - 0.4 * t.regua);
    return;
  }
  mover(q, i, geo.grupo[i * 2], geo.grupo[i * 2 + 1], geo.tam.grupoW, geo.tam.grupoH, e2);
  q.a[i] = lerp(q.a[i], 0.72, e2);
  if (i !== PONTO_SEMOG) {
    q.a[i] = lerp(q.a[i], geo.compacta ? 0.08 : 0.24, t.marca);
    return;
  }
  q.a[i] = lerp(q.a[i], 1, t.marca);
  tracarRegua(q, i, geo, t.regua);
}

/**
 * O ponto da Semog vira régua em dois tempos: encolhe numa ponta e viaja até o começo
 * do numeral; lá, com sobreposição, se estica para a direita como um traço desenhado.
 */
function tracarRegua(q, i, geo, t) {
  const r = geo.regua;
  mover(q, i, r.x, r.y, geo.tam.grupoW, r.h, suave(faixa(t, 0, 0.58)));
  q.w[i] = lerp(q.w[i], r.w, suave(faixa(t, 0.42, 1)));
}

/** Interpola o retângulo do ponto até o alvo. */
function mover(q, i, x, y, w, h, t) {
  q.x[i] = lerp(q.x[i], x, t);
  q.y[i] = lerp(q.y[i], y, t);
  q.w[i] = lerp(q.w[i], w, t);
  q.h[i] = lerp(q.h[i], h, t);
}

const NIVEIS = 40;

/**
 * Uma cor só (marinho); a opacidade faz o resto. Pontos agrupados por nível de opacidade
 * para pintar em poucos fill(); o ponto da Semog vai por cima, sozinho.
 * @param {{ ctx: CanvasRenderingContext2D, w: number, h: number }} pintura
 * @param {ReturnType<typeof criarQuadro>} q @param {string} cor
 */
function desenhar({ ctx, w, h }, q, cor) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = cor;
  for (let nivel = 1; nivel <= NIVEIS; nivel++) {
    ctx.globalAlpha = nivel / NIVEIS;
    ctx.beginPath();
    for (let i = 0; i < q.n; i++) {
      if (i === PONTO_SEMOG || Math.round(q.a[i] * NIVEIS) !== nivel) continue;
      ctx.rect(q.x[i], q.y[i], q.w[i], q.h[i]);
    }
    ctx.fill();
  }
  ctx.globalAlpha = q.a[PONTO_SEMOG];
  ctx.fillRect(q.x[PONTO_SEMOG], q.y[PONTO_SEMOG], q.w[PONTO_SEMOG], q.h[PONTO_SEMOG]);
  ctx.globalAlpha = 1;
}

/* ---- Depois do pin: a linha dos ciclos ------------------------------------------- */

/**
 * A linha se desenha da esquerda para a direita (expo.inOut 1,3 s); cada ciclo acende
 * quando a ponta da linha passa por ele: o traço vertical desce e o texto sobe da máscara.
 * @param {import("../core/tipos.js").ContextoCena} ctx
 */
function animarHistorico({ root, gsap, util }) {
  const historico = root.querySelector(".ranking-historico");
  const traco = root.querySelector(".ranking-traco");
  const titulo = root.querySelector(".ranking-historico-titulo");
  if (!historico || !traco || !(titulo instanceof HTMLElement)) return;
  util.revelarTexto(titulo, { gatilho: historico, inicio: "top 82%" });
  const desenho = gsap.parseEase("expo.inOut");
  const DURACAO = 1.3;
  const tl = gsap.timeline({
    scrollTrigger: { trigger: historico, start: "top 82%", once: true },
  });
  tl.fromTo(traco, { scaleX: 0 }, { scaleX: 1, duration: DURACAO, ease: "expo.inOut" }, 0.15);
  const itens = Array.from(root.querySelectorAll(".ranking-ciclos li"));
  itens.forEach((li, k) => {
    const quando = 0.15 + DURACAO * inverso(desenho, k / itens.length);
    tl.fromTo(li, { "--marca": 0 }, { "--marca": 1, duration: 0.6, ease: "expo.out" }, quando);
    tl.from(
      li.querySelectorAll(":scope > span > span"),
      { yPercent: 110, duration: 0.9, ease: "expo.out", stagger: 0.08 },
      quando + 0.05,
    );
  });
  util.aoImprimir(() => tl.progress(1));
}

/** Tempo (0 a 1) em que uma curva monótona chega a `alvo`, por bisseção. */
function inverso(curva, alvo) {
  let a = 0;
  let b = 1;
  for (let k = 0; k < 24; k++) {
    const m = (a + b) / 2;
    if (curva(m) < alvo) a = m;
    else b = m;
  }
  return (a + b) / 2;
}
