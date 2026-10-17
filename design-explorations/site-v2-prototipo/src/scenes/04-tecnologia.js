/**
 * Cena 04 · Tecnologia Semog, a cena-assinatura. Num palco fixado, os mesmos itens (um por
 * condomínio) contam a prestação de contas inteira: números do ERP descem e são conferidos,
 * viram folhas, as folhas viram um PDF com sumário e abas, o PDF é assinado, condensa num
 * QR de barras, e o QR se abre no campo de condomínios do Semog One. Um único traço
 * marinho costura tudo. À esquerda, a legenda do passo ativo entra por máscara; a trilha
 * leva a cada passo. Sem JS, a seção é um documento com os cinco passos em lista.
 *
 * Módulos: 04-tecnologia-base (dados fixos), -layout (medidas), -poses (roteiro),
 * -percurso (o traço) e -desenho (canvas).
 *
 * @param {import("../core/tipos.js").ContextoCena} ctx
 */
import { criarBase, sorteador } from "./04-tecnologia-base.js";
import { criarAtlas, criarCores, frenteDaOnda, pintarQuadro } from "./04-tecnologia-desenho.js";
import { medirGeometria } from "./04-tecnologia-layout.js";
import { montarPercurso, trechoVisivel } from "./04-tecnologia-percurso.js";
import {
  ADENDO,
  CAMPOS,
  CAMPOS_FOLHA,
  FOLHAS,
  ITENS_ONE,
  PASSOS,
  atrasoDoCentro,
  calcularFolhas,
  calcularPoses,
  conteudoFolhas,
  criarMapa,
  erpEmQueda,
  faixa,
  misturarFolhas,
  misturarItens,
  novaPose,
  suave,
  trechoAtual,
} from "./04-tecnologia-poses.js";

const FONTES = ["400 12px Saira", "500 12px Saira", "400 12px Barlow"];

export default function init(ctx) {
  const { root, util, gsap } = ctx;
  const palco = exigir(root, ".tec-palco");
  const n = condominiosDoContexto(ctx.conteudo.tecnologia.contexto);
  prepararTextos(ctx);
  root.classList.add("tec-com-palco");
  /** p é o tempo da história (0 a 1), já com os patamares descontados da rolagem. */
  const estado = { p: 0, formar: 0 };
  const legenda = criarLegenda(ctx);
  const mapa = criarMapa(ctx.estreito());
  // O pin nasce já, na ordem da página; o palco só desenha depois de medido.
  const tl = util.pinScrub(root, {
    alvo: palco,
    distancia: `+=${Math.round(mapa.total * 100)}%`,
    scrub: 0.7,
    // A timeline é um tween só (a rolagem inteira): os patamares vêm do mapa, não de pausas.
    patamares: () => mapa.patamares(),
  });
  // O pin termina com o último patamar formado (custos por categoria) sobre fundo já
  // branco; o palco sai da tela pela própria rolagem e a cena 05 entra sem tela vazia.
  const rolagem = { r: 0 };
  tl.to(rolagem, {
    r: 1,
    duration: 1,
    onUpdate: () => {
      estado.p = mapa.historia(rolagem.r);
      legenda.aplicar(estado.p);
    },
  });
  legenda.aplicar(0);
  gsap.to(estado, {
    formar: 1,
    ease: "none",
    scrollTrigger: { trigger: root, start: "top 85%", end: "top top", scrub: 0.6 },
  });
  ligarTrilha(root, tl, ctx.lenis, mapa);
  montarPalco(ctx, { palco, estado, base: criarBase(n) });
}

/** @param {ParentNode} raiz @param {string} seletor @returns {HTMLElement} */
function exigir(raiz, seletor) {
  const el = raiz.querySelector(seletor);
  if (!(el instanceof HTMLElement)) throw new Error(`[cena tecnologia] falta ${seletor}.`);
  return el;
}

/** Quantos condomínios: o número antes de "condomínios" no contexto (o fato mora lá). */
function condominiosDoContexto(contexto) {
  const m = /(\d[\d.]*)\s+condomínios/.exec(contexto);
  if (!m) throw new Error("[cena tecnologia] o contexto não traz o número de condomínios.");
  return Number(m[1].replace(/\./g, ""));
}

/* ---- Textos ------------------------------------------------------------------- */

/**
 * Números do contexto contam ao entrar; a frase depois dos dois-pontos do primeiro passo
 * ganha peso. Tudo a partir do texto já renderizado do conteudo.json.
 * @param {import("../core/tipos.js").ContextoCena} ctx
 */
function prepararTextos({ root, util }) {
  const contexto = exigir(root, ".tec-contexto");
  const texto = contexto.textContent ?? "";
  const partes = [];
  let ultimo = 0;
  for (const m of texto.matchAll(/\b\d{1,3}(?:\.\d{3})*\b/g)) {
    partes.push(texto.slice(ultimo, m.index));
    const span = document.createElement("span");
    span.className = "num tec-num";
    span.textContent = m[0];
    partes.push(span);
    ultimo = (m.index ?? 0) + m[0].length;
  }
  partes.push(texto.slice(ultimo));
  contexto.replaceChildren(...partes);
  for (const span of contexto.querySelectorAll(".tec-num")) {
    const para = Number((span.textContent ?? "0").replace(/\./g, ""));
    util.contador(/** @type {HTMLElement} */ (span), { para, gatilho: root, inicio: "top 60%" });
  }
  enfatizarConferencia(exigir(root, '[data-passo="0"] p'));
}

/** "...: se um total não bate, o documento não sai." → o trecho final em peso. */
function enfatizarConferencia(p) {
  const texto = p.textContent ?? "";
  const corte = texto.indexOf(": ");
  if (corte < 0) return;
  const enfase = document.createElement("em");
  enfase.className = "peso";
  enfase.textContent = texto.slice(corte + 2);
  p.replaceChildren(texto.slice(0, corte + 2), enfase);
}

/** Textos do palco, do parcial (marcados como TEXTO-NOVO lá). @returns {import("./04-tecnologia-desenho.js").RotulosPalco} */
function lerRotulos(root, n, util) {
  const todos = (nome) =>
    Array.from(
      root.querySelectorAll(`[data-rotulo="${nome}"]`),
      (el) => el.textContent?.trim() ?? "",
    );
  const um = (nome) => {
    const [texto] = todos(nome);
    if (!texto) throw new Error(`[cena tecnologia] falta o rótulo "${nome}" no parcial.`);
    return texto;
  };
  return {
    folhas: todos("folha"),
    assinaturas: todos("assinatura"),
    parecer: um("parecer"),
    url: um("url"),
    confere: um("confere"),
    adendo: um("adendo"),
    original: um("original"),
    historico: um("historico"),
    convencao: um("convencao"),
    condominios: `${util.formatarNumero(n)} ${um("condominios")}`,
  };
}

/* ---- Legenda ------------------------------------------------------------------ */

/**
 * Passo ativo entra por máscara (linhas sobem de baixo), o anterior sai por cima, com
 * sobreposição. O título do passo ganha peso. A trilha mostra o progresso dentro do passo.
 * @param {import("../core/tipos.js").ContextoCena} ctx
 */
function criarLegenda({ gsap, SplitText, ScrollTrigger, root, util, pronto }) {
  const passos = Array.from(root.querySelectorAll(".tec-passo"));
  const splits = passos.map((li) =>
    SplitText.create(li.querySelectorAll(".tec-revela"), {
      type: "lines",
      mask: "lines",
      linesClass: "revela-linha",
      autoSplit: true,
    }),
  );
  const linhas = (k) => splits[k].lines;
  const botoes = Array.from(root.querySelectorAll("[data-ir]"));
  const estado = { ativo: -1, entrou: false };
  const trocar = criarTroca(gsap, passos, linhas, estado);
  const marcarSub = criarSub(gsap, passos);
  gsap.set(linhas(0), { yPercent: 110 });
  ScrollTrigger.create({
    trigger: root,
    start: "top 65%",
    once: true,
    onEnter: () => {
      estado.entrou = true;
      if (estado.ativo >= 0) trocar(estado.ativo, true);
    },
  });
  entradaDoTitulo(gsap, util, root);
  // Com html.motion a legenda muda de corpo e de largura: as linhas são refeitas na medida
  // nova (o autoSplit só vigia a largura do elemento, não o corpo do texto).
  pronto.then(
    () => {
      for (const split of splits) split.split();
      if (!estado.entrou && estado.ativo >= 0) gsap.set(linhas(estado.ativo), { yPercent: 110 });
    },
    (erro) =>
      console.error("[cena tecnologia] pronto falhou; legenda fica na medida inicial.", erro),
  );
  util.aoImprimir(() => {
    gsap.set(
      splits.flatMap((s) => s.lines),
      { yPercent: 0 },
    );
  });
  return {
    /** @param {number} p */
    aplicar(p) {
      const k = indiceEm(PASSOS, p);
      if (k !== estado.ativo) trocar(k, estado.entrou);
      marcarTrilha(botoes, k, p);
      marcarSub(p);
    },
  };
}

/** Título por linhas; subtítulo e contexto (que tem números que contam) por máscara em bloco. */
function entradaDoTitulo(gsap, util, root) {
  util.revelarTexto(exigir(root, ".tec-titulo"), { gatilho: root, inicio: "top 70%" });
  gsap.fromTo(
    [exigir(root, ".tec-sub"), exigir(root, ".tec-contexto")],
    { clipPath: "inset(0% 0% 100% 0%)", y: 21 },
    {
      clipPath: "inset(0% 0% -20% 0%)",
      y: 0,
      duration: 1.1,
      ease: "expo.out",
      stagger: 0.12,
      delay: 0.25,
      scrollTrigger: { trigger: root, start: "top 70%", once: true },
    },
  );
}

/** Índice do último início ≤ p. @param {number[]} inicios @param {number} p */
function indiceEm(inicios, p) {
  let k = -1;
  inicios.forEach((ini, j) => {
    if (p >= ini) k = j;
  });
  return k;
}

/** Monta a troca de passo (saída por cima, entrada por baixo, peso no título). */
function criarTroca(gsap, passos, linhas, estado) {
  return (k, animar) => {
    const anterior = estado.ativo;
    estado.ativo = k;
    passos.forEach((li, j) => {
      if (j !== k && j !== anterior) li.classList.remove("ativo", "saindo");
    });
    const entra = passos[k];
    if (anterior >= 0 && anterior !== k)
      sairPasso(gsap, passos[anterior], linhas(anterior), estado, anterior);
    entra.classList.remove("saindo");
    entra.classList.add("ativo");
    if (!animar) return;
    const atraso = anterior >= 0 && anterior !== k ? 0.3 : 0;
    gsap.fromTo(
      linhas(k),
      { yPercent: 110 },
      {
        yPercent: 0,
        duration: 0.9,
        ease: "expo.out",
        stagger: 0.05,
        delay: atraso,
        overwrite: true,
      },
    );
    gsap.fromTo(
      entra.querySelector("h3"),
      { fontVariationSettings: '"wght" 250' },
      {
        fontVariationSettings: '"wght" 520',
        duration: 1.3,
        ease: "power2.inOut",
        delay: atraso + 0.15,
        overwrite: true,
      },
    );
  };
}

function sairPasso(gsap, li, linhas, estado, indice) {
  li.classList.remove("ativo");
  li.classList.add("saindo");
  gsap.to(linhas, {
    yPercent: -110,
    duration: 0.45,
    ease: "expo.in",
    stagger: 0.02,
    overwrite: true,
    onComplete: () => {
      if (estado.ativo !== indice) li.classList.remove("saindo");
    },
  });
}

/** Botão atual e progresso dentro de cada passo (--prog de 0 a 1). */
function marcarTrilha(botoes, k, p) {
  botoes.forEach((botao, j) => {
    const fim = PASSOS[j + 1] ?? 1;
    const prog = j < k ? 1 : j === k ? faixa(p, PASSOS[j], fim) : 0;
    botao.style.setProperty("--prog", prog.toFixed(3));
    if (j === k) botao.setAttribute("aria-current", "step");
    else botao.removeAttribute("aria-current");
  });
}

/**
 * Itens do Semog One: cada diferencial tem o seu patamar no palco e entra sozinho na
 * legenda, por máscara, quando o palco chega nele. O adendo ganha tom cheio na hora dele.
 */
function criarSub(gsap, passos) {
  const itens = Array.from(passos[4]?.querySelectorAll(".tec-itens li") ?? []);
  const linhasDe = (li) => li.querySelectorAll(".revela-linha");
  let atual = -1;
  return (p) => {
    passos[3]?.querySelector(".tec-adendo")?.classList.toggle("ativo", p >= ADENDO);
    const sub = indiceEm(ITENS_ONE, p);
    if (sub === atual) return;
    const anterior = itens[atual];
    atual = sub;
    itens.forEach((li, j) => li.classList.toggle("ativo", j === sub));
    if (anterior) {
      anterior.classList.add("saindo");
      gsap.to(linhasDe(anterior), {
        yPercent: -110,
        duration: 0.45,
        ease: "expo.in",
        overwrite: true,
        onComplete: () => {
          if (!anterior.classList.contains("ativo")) anterior.classList.remove("saindo");
        },
      });
    }
    const novo = itens[sub];
    if (!novo) return;
    novo.classList.remove("saindo");
    gsap.fromTo(
      linhasDe(novo),
      { yPercent: 110 },
      { yPercent: 0, duration: 0.9, ease: "expo.out", stagger: 0.05, delay: 0.3, overwrite: true },
    );
  };
}

/** Botões da trilha: rolam até o quadro em que o passo já está formado. */
function ligarTrilha(root, tl, lenis, mapa) {
  root.querySelectorAll("[data-ir]").forEach((botao) => {
    botao.addEventListener("click", () => {
      const st = tl.scrollTrigger;
      if (!st) return;
      const alvo = mapa.alvoDaTrilha(Number(botao.getAttribute("data-ir")));
      const y = st.start + (st.end - st.start) * alvo;
      if (lenis) lenis.scrollTo(y, { duration: 1.4 });
      else window.scrollTo({ top: y, behavior: "smooth" });
    });
  });
}

/* ---- Palco -------------------------------------------------------------------- */

/**
 * Liga o canvas: mede no refresh (e quando as fontes chegam), pinta no laço visível.
 * @param {import("../core/tipos.js").ContextoCena} ctx
 * @param {{ palco: HTMLElement, estado: { p: number, formar: number }, base: import("./04-tecnologia-base.js").BaseTecnologia }} o
 */
function montarPalco(ctx, { palco, estado, base }) {
  const { root, util, ScrollTrigger } = ctx;
  const fixos = {
    canvas: /** @type {HTMLCanvasElement} */ (exigir(root, ".tec-campo")),
    legendas: exigir(root, ".tec-legendas"),
    fundo: exigir(root, ".tec-fundo"),
    rotulos: lerRotulos(root, base.n, util),
    cores: criarCores(util.corDoToken),
    conteudo: conteudoFolhas(base, sorteador),
  };
  /** @type {ReturnType<typeof medirPalco> | null} */
  let atual = null;
  const montar = () => {
    // Antes de html.motion o palco ainda não tem a altura de uma tela: nada a medir.
    if (!document.documentElement.classList.contains("motion")) return;
    try {
      atual = medirPalco(ctx, palco, base, fixos);
    } catch (erro) {
      console.error("[cena tecnologia] não foi possível medir o palco.", erro);
      atual = null;
    }
  };
  ScrollTrigger.addEventListener("refresh", montar);
  Promise.all(FONTES.map((f) => document.fonts.load(f)))
    .catch((erro) => console.error("[cena tecnologia] fontes do palco não carregaram.", erro))
    .finally(montar);
  const quadro = {
    pose: novaPose(base.n),
    folhas: new Float32Array(FOLHAS * CAMPOS_FOLHA),
    fundo: -1,
  };
  util.lacoVisivel(root, (tempo) => {
    if (atual) pintar(atual, quadro, estado, tempo, fixos.fundo);
  });
}

/** Mede, monta poses, atlas e percurso para o tamanho atual do palco. */
function medirPalco(ctx, palco, base, fixos) {
  const { util } = ctx;
  const { ctx: c2d } = util.prepararCanvas2D(fixos.canvas);
  const medirTexto = (fonte, texto) => {
    c2d.font = `${fonte}, system-ui, sans-serif`;
    return c2d.measureText(texto).width;
  };
  const geo = medirGeometria({
    legendas: fixos.legendas,
    palco,
    compacta: ctx.estreito(),
    base,
    conteudo: fixos.conteudo,
    medirTexto,
    rotulos: fixos.rotulos,
  });
  const atlas = criarAtlas(base, geo.erp.fonte, util.dprMaximo(), fixos.cores.marinho);
  geo.larguraNumero.set(atlas.largura);
  return {
    c2d,
    geo,
    atlas,
    base,
    cores: fixos.cores,
    rotulos: fixos.rotulos,
    poses: calcularPoses(geo, base),
    folhas: calcularFolhas(geo),
    perc: montarPercurso(geo),
    centro: atrasoDoCentro(base),
  };
}

/** Pose dos itens e das folhas para o progresso atual. */
function poseDoQuadro(m, quadro, estado) {
  const { de, para, t, trecho } = trechoAtual(estado.p);
  if (!trecho && de === "erp") {
    erpEmQueda(m.poses.erp, m.base, estado.formar, quadro.pose, m.geo.erp.lh * 9);
  } else if (!trecho) {
    quadro.pose.set(m.poses[de]);
  } else {
    const amplitude = Math.min(m.geo.area.w, m.geo.area.h) * 0.06 * trecho.arco;
    const atrasos = trecho.atraso === "centro" ? m.centro : m.base.sementes;
    misturarItens(m.poses[de], m.poses[para], t, quadro.pose, atrasos, m.base.sementes, amplitude);
  }
  if (trecho) misturarFolhas(m.folhas[de], m.folhas[para], t, quadro.folhas);
  else quadro.folhas.set(m.folhas[de]);
}

/**
 * Campo vivo: a onda de atualização segue a ponta do traço sob o campo; uma respiração
 * lenta; e a célula do comprovante fica marinho depois da baixa.
 */
function corDoCampo(m, q, tempo) {
  const k = faixa(q.p, 0.69, 0.715) * (1 - faixa(q.p, 0.905, 0.935));
  if (k <= 0) return;
  const frente = frenteDaOnda(q);
  const largura = m.geo.campo.passoX * 2.5;
  const baixa = faixa(q.p, 0.762, 0.775);
  const { base } = m;
  const { avulsas } = m.geo;
  for (let i = 0; i < base.n; i++) {
    const o = i * CAMPOS;
    const x = q.pose[o];
    const alvo = x > frente ? base.nivelNovo[i] : base.nivel[i];
    const brilho = Math.exp(-(((x - frente) / largura) ** 2)) * 0.45;
    const respiro = 0.035 * Math.sin(tempo * 1.3 + base.sementes[i] * 30);
    q.pose[o + 5] += (alvo - base.nivel[i] + brilho + respiro) * k;
    if (i === avulsas.alvo) q.pose[o + 5] += (1 - q.pose[o + 5]) * baixa * k;
  }
}

/** Um quadro: poses, traço, fundo e pintura. */
function pintar(m, quadro, estado, tempo, fundo) {
  poseDoQuadro(m, quadro, estado);
  const [cauda, cabeca] = trechoVisivel(m.perc, estado.p);
  const q = { ...m, p: estado.p, cabeca, cauda, pose: quadro.pose, folhas: quadro.folhas };
  corDoCampo(m, q, tempo);
  pintarQuadro(m.c2d, q);
  // O palco começa em gelo (a cena 03 termina em gelo) e termina em branco limpo.
  const opacidade = Math.round((1 - suave(faixa(estado.p, 0.45, 0.95))) * 100) / 100;
  if (opacidade !== quadro.fundo) {
    quadro.fundo = opacidade;
    fundo.style.opacity = String(opacidade);
  }
}
