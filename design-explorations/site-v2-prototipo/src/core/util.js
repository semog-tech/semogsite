/* Utilidades compartilhadas pelas cenas (ctx.util): formatação pt-BR, contador,
   revelação de texto e de quadro por máscara, entrada em lote, pin + scrub, laços e
   relógios que só andam com a cena visível, canvas com DPR limitado e ganchos de
   rolagem e impressão. Tudo que anda por quadro usa o ticker do GSAP (um único rAF). */
import { gsap, ScrollTrigger, SplitText } from "./motion.js";

export { corDoToken } from "./cores.js";
export { criarDinamica } from "./dinamica.js";

/* ---- Formatação ---------------------------------------------------------------- */

/** "1.234" ou "1.234,5". @param {number} valor @param {number} [casas] */
export function formatarNumero(valor, casas = 0) {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

/** Recebe fração: 0.123 → "12,3%". @param {number} fracao @param {number} [casas] */
export function formatarPercentual(fracao, casas = 1) {
  return fracao.toLocaleString("pt-BR", {
    style: "percent",
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

/* ---- Tela ---------------------------------------------------------------------- */

const consultaEstreita = window.matchMedia("(max-width: 760px)");

/** Verdadeiro em tela estreita (até 760px), lido na hora. */
export function estreito() {
  return consultaEstreita.matches;
}

/** Densidade de pixels limitada: 1,5 no celular, 2 no desktop. Canvas e WebGL usam esta. */
export function dprMaximo() {
  return Math.min(window.devicePixelRatio || 1, estreito() ? 1.5 : 2);
}

/**
 * Ajusta o canvas 2D ao tamanho exibido, com DPR limitado, e devolve contexto e medidas
 * em pixels CSS. Chame de novo quando o tamanho mudar (ScrollTrigger "refresh").
 * @param {HTMLCanvasElement} canvas
 * @returns {{ ctx: CanvasRenderingContext2D, w: number, h: number }}
 */
export function prepararCanvas2D(canvas) {
  const caixa = canvas.getBoundingClientRect();
  const dpr = dprMaximo();
  canvas.width = Math.max(1, Math.round(caixa.width * dpr));
  canvas.height = Math.max(1, Math.round(caixa.height * dpr));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D indisponível.");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w: caixa.width, h: caixa.height };
}

/* ---- Impressão ----------------------------------------------------------------- */

/** @type {Set<() => void>} */
const ganchosImpressao = new Set();

/**
 * Registra o que deve acontecer antes de imprimir (ex.: escrever o valor final).
 * As animações de ScrollTrigger já são levadas ao fim pelo core.
 * @param {() => void} callback
 */
export function aoImprimir(callback) {
  ganchosImpressao.add(callback);
  return () => ganchosImpressao.delete(callback);
}

/** Uso interno do core/impressao.js. */
export function executarGanchosImpressao() {
  for (const gancho of ganchosImpressao) {
    try {
      gancho();
    } catch (erro) {
      console.error("[impressão] Gancho falhou.", erro);
    }
  }
}

/* ---- Rolagem e laços ----------------------------------------------------------- */

/**
 * Chama `callback` no máximo uma vez por quadro enquanto houver rolagem ou resize
 * (nativa ou Lenis). Roda no ticker do GSAP, sem rAF próprio.
 * @param {() => void} callback
 * @param {import("lenis").default | null} [lenis]
 * @returns {() => void} desliga o gancho
 */
export function aoRolar(callback, lenis = null) {
  let sujo = true;
  const marcar = () => {
    sujo = true;
  };
  const tique = () => {
    if (!sujo) return;
    sujo = false;
    callback();
  };
  window.addEventListener("scroll", marcar, { passive: true });
  window.addEventListener("resize", marcar);
  const desligarLenis = lenis ? lenis.on("scroll", marcar) : () => {};
  gsap.ticker.add(tique);
  return () => {
    window.removeEventListener("scroll", marcar);
    window.removeEventListener("resize", marcar);
    desligarLenis();
    gsap.ticker.remove(tique);
  };
}

/**
 * Laço de desenho no ticker do GSAP que só roda com o root na tela e a aba visível.
 * @param {Element} root
 * @param {(tempo: number) => void} desenhar tempo em segundos (gsap.ticker.time)
 * @returns {() => void} desliga o laço
 */
export function lacoVisivel(root, desenhar) {
  let ativo = ScrollTrigger.isInViewport(root);
  const gatilho = ScrollTrigger.create({
    trigger: root,
    start: "top bottom",
    end: "bottom top",
    onToggle: (self) => {
      ativo = self.isActive;
    },
  });
  const tique = (tempo) => {
    if (ativo && !document.hidden) desenhar(tempo);
  };
  gsap.ticker.add(tique);
  return () => {
    gsap.ticker.remove(tique);
    gatilho.kill();
  };
}

/**
 * Relógio que só anda com o root na tela e a aba visível (carrosséis, rodízios).
 * Nasce pausado se o root estiver fora da tela.
 * @param {Element} root
 * @param {number} segundos intervalo entre tiques
 * @param {() => void} aoTicar
 * @param {(pausado: boolean) => void} [aoAlternar] avisa quando para ou volta, para quem
 *   precisa parar junto (Ken Burns, barra de progresso)
 * @returns {gsap.core.Tween} o relógio
 */
export function relogioVisivel(root, segundos, aoTicar, aoAlternar) {
  let visivel = ScrollTrigger.isInViewport(root);
  const relogio = gsap.to(
    {},
    { duration: segundos, repeat: -1, onRepeat: aoTicar, paused: !visivel },
  );
  const atualizar = () => {
    const pausado = document.hidden || !visivel;
    if (relogio.paused() === pausado) return;
    relogio.paused(pausado);
    aoAlternar?.(pausado);
  };
  ScrollTrigger.create({
    trigger: root,
    start: "top bottom",
    end: "bottom top",
    onToggle: (self) => {
      visivel = self.isActive;
      atualizar();
    },
  });
  document.addEventListener("visibilitychange", atualizar);
  return relogio;
}

/* ---- Entradas ------------------------------------------------------------------ */

/**
 * @typedef {Object} OpcoesContador
 * @property {number} para Valor final.
 * @property {number} [de] Valor inicial. Padrão 0.
 * @property {(valor: number) => string} [formatar] Padrão formatarNumero.
 * @property {boolean} [inteiro] Arredonda cada quadro. Padrão true.
 * @property {number} [duracao] Segundos. Padrão 1.4.
 * @property {Element | false} [gatilho] Elemento que dispara ao entrar na tela; false = já.
 * @property {string} [inicio] Início do ScrollTrigger. Padrão "top 85%".
 */

/**
 * Conta de `de` até `para` escrevendo em `el`. O HTML deve trazer o valor final escrito,
 * para leitura sem JS; na impressão, o valor final é garantido.
 * @param {HTMLElement} el
 * @param {OpcoesContador} opcoes
 * @returns {gsap.core.Tween}
 */
export function contador(el, opcoes) {
  const { para, de = 0, formatar = formatarNumero, inteiro = true, duracao = 1.4 } = opcoes;
  const { gatilho = el, inicio = "top 85%" } = opcoes;
  if (!Number.isFinite(para) || !Number.isFinite(de)) {
    throw new TypeError("contador: 'para' e 'de' precisam ser números finitos.");
  }
  const estado = { valor: de };
  const escrever = (v) => {
    el.textContent = formatar(inteiro ? Math.round(v) : v);
  };
  const tween = gsap.to(estado, {
    valor: para,
    duration: duracao,
    ease: "power2.out",
    onStart: () => escrever(de),
    onUpdate: () => escrever(estado.valor),
    onComplete: () => escrever(para),
    scrollTrigger: gatilho ? { trigger: gatilho, start: inicio, once: true } : undefined,
  });
  aoImprimir(() => {
    tween.progress(1);
    escrever(para);
  });
  return tween;
}

/**
 * @typedef {Object} OpcoesLote
 * @property {(tl: gsap.core.Timeline, item: HTMLElement) => void} animar Monta a entrada de um
 *   item numa timeline pausada (tl.from…); o estado inicial aplica na hora.
 * @property {string} [inicio] Início do gatilho de cada item. Padrão "top 85%".
 * @property {number} [cascata] Segundos entre itens que entram juntos. Padrão 0.12.
 */

/**
 * Entrada em lote: cada item anima quando ELE entra na tela, e não quando o topo do grupo
 * entra. Numa grade larga os itens da mesma linha entram juntos, em cascata; empilhados no
 * celular, cada um espera a sua vez.
 * @param {gsap.DOMTarget} alvos
 * @param {OpcoesLote} opcoes
 * @returns {gsap.core.Timeline[]} uma timeline por item, na ordem dos alvos
 */
export function entrarEmLote(alvos, opcoes) {
  const { animar, inicio = "top 85%", cascata = 0.12 } = opcoes;
  /** @type {HTMLElement[]} */
  const itens = gsap.utils.toArray(alvos);
  const entradas = itens.map((item) => {
    const tl = gsap.timeline({ paused: true });
    animar(tl, item);
    return tl;
  });
  if (!itens.length) return entradas;
  ScrollTrigger.batch(itens, {
    start: inicio,
    once: true,
    onEnter: (lote) => {
      lote.forEach((item, i) => {
        const tl = entradas[itens.indexOf(/** @type {HTMLElement} */ (item))];
        // play() numa timeline já no fim não faz nada: nada pisca de volta.
        if (tl) gsap.delayedCall(i * cascata, () => tl.play());
      });
    },
  });
  aoImprimir(() => {
    for (const tl of entradas) tl.progress(1);
  });
  return entradas;
}

/**
 * @typedef {Object} OpcoesRevelacao
 * @property {"linhas" | "palavras"} [tipo] Padrão "linhas".
 * @property {Element | false} [gatilho] Padrão o próprio elemento; false = anima já.
 * @property {string} [inicio] Padrão "top 80%".
 * @property {boolean | number} [scrub] Se definido, acompanha a rolagem em vez de tocar uma vez.
 * @property {string} [fim] Fim do scrub. Padrão "bottom 45%".
 * @property {number} [duracao] Segundos por linha/palavra. Padrão 0.9.
 * @property {number} [stagger] Padrão 0.08 (linhas) ou 0.04 (palavras).
 * @property {number} [atraso] Segundos. Padrão 0.
 */

/**
 * Toca uma vez e não volta, SEM `once`: o SplitText recria este gatilho quando a fonte
 * chega ou a largura muda, às vezes com a página já rolada. Um gatilho novo mede no
 * primeiro evento de rolagem e força a medida dos outros novos; um `once` que já passou
 * se mata no meio desse laço e o GSAP lê `.end` de um índice que sumiu (Firefox, /#unidades).
 * Com toggleActions o gatilho fica vivo e a animação, no fim.
 * @param {Element | false} gatilho @param {OpcoesRevelacao} o
 */
function gatilhoRevelacao(gatilho, o) {
  if (!gatilho) return undefined;
  const base = { trigger: gatilho, start: o.inicio ?? "top 80%" };
  if (o.scrub === undefined || o.scrub === false) {
    return { ...base, toggleActions: "play none none none" };
  }
  return { ...base, end: o.fim ?? "bottom 45%", scrub: o.scrub === true ? 1 : o.scrub };
}

/** Peso variável de 250 a 650 nos `.peso` de dentro do elemento, na mesma timeline. */
function animarPesos(tl, el) {
  const pesos = el.querySelectorAll(".peso");
  if (!pesos.length) return;
  tl.fromTo(
    pesos,
    { fontVariationSettings: '"wght" 250' },
    { fontVariationSettings: '"wght" 650', duration: 1.5, ease: "power2.inOut" },
    0.45,
  );
}

/**
 * Revela texto por máscara, linha a linha ou palavra a palavra (SplitText com mask).
 * Se houver `.peso` dentro, a mesma timeline anima o peso variável de 250 a 650.
 * Re-divide sozinho quando a fonte carrega ou a largura muda (devolver a timeline no
 * onSplit faz o SplitText refazê-la com o progresso). O SplitText mantém o texto
 * acessível (aria-label no elemento). Sem JS, o texto aparece inteiro.
 * @param {HTMLElement} el
 * @param {OpcoesRevelacao} [opcoes]
 * @returns {SplitText}
 */
export function revelarTexto(el, opcoes = {}) {
  const porLinha = (opcoes.tipo ?? "linhas") === "linhas";
  const { gatilho = el, duracao = 0.9, atraso = 0 } = opcoes;
  /** @type {gsap.core.Timeline | null} */
  let atual = null;
  aoImprimir(() => atual?.progress(1));
  return SplitText.create(el, {
    type: porLinha ? "lines" : "words",
    mask: porLinha ? "lines" : "words",
    autoSplit: true,
    linesClass: "revela-linha",
    wordsClass: "revela-palavra",
    onSplit(self) {
      atual = gsap.timeline({ delay: atraso, scrollTrigger: gatilhoRevelacao(gatilho, opcoes) });
      atual.from(porLinha ? self.lines : self.words, {
        yPercent: 110,
        duration: duracao,
        ease: "expo.out",
        stagger: opcoes.stagger ?? (porLinha ? 0.08 : 0.04),
      });
      animarPesos(atual, el);
      return atual;
    },
  });
}

/**
 * Quadro de foto: a moldura abre de baixo para cima, a imagem assenta de um zoom e
 * depois tem parallax interno. Espera `<figure>` com `.moldura > img` e figcaption opcional.
 * Cortina por clip-path na moldura: não use em moldura que contém canvas WebGL (Chromium
 * mostra área sem pintura); aí use transform.
 * @param {HTMLElement} quadro
 * @returns {gsap.core.Timeline | null}
 */
export function revelarQuadro(quadro) {
  const moldura = quadro.querySelector(".moldura");
  const imagem = moldura?.querySelector("img");
  if (!moldura || !imagem) {
    console.error("[revelarQuadro] quadro sem .moldura > img.", quadro);
    return null;
  }
  const tl = gsap
    .timeline({ scrollTrigger: { trigger: quadro, start: "top 82%", once: true } })
    .fromTo(
      moldura,
      { clipPath: "inset(100% 0% 0% 0%)" },
      { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "expo.inOut" },
    )
    .from(imagem, { scale: 1.3, duration: 1.8, ease: "expo.out" }, 0.2);
  const legenda = quadro.querySelector("figcaption");
  if (legenda) {
    tl.from(legenda, { yPercent: 40, autoAlpha: 0, duration: 0.9, ease: "expo.out" }, 0.9);
  }
  gsap.fromTo(
    imagem,
    { yPercent: -5 },
    {
      yPercent: 5,
      ease: "none",
      scrollTrigger: { trigger: moldura, start: "top bottom", end: "bottom top", scrub: 0.7 },
    },
  );
  aoImprimir(() => tl.progress(1));
  return tl;
}

/**
 * Troca um texto curto por máscara: o antigo sobe e sai, o novo sobe e entra.
 * O pai precisa ter overflow: clip.
 * @param {HTMLElement} el
 * @param {string} texto
 */
export function trocarTexto(el, texto) {
  return gsap
    .timeline()
    .to(el, { yPercent: -110, duration: 0.5, ease: "expo.in" })
    .call(() => {
      el.textContent = texto;
    })
    .fromTo(el, { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: "expo.out" });
}

/* ---- Pin ----------------------------------------------------------------------- */

/**
 * Aparelho só de toque (celular, tablet): ScrollTrigger.isTouch === 1, que é
 * "(hover: none), (pointer: coarse)". Notebook com tela de toque e mouse dá 2 e fica de fora.
 */
export function soToque() {
  return ScrollTrigger.isTouch === 1;
}

/** Pausa menor que esta fração da timeline não é patamar de leitura (é respiro de cascata). */
const PAUSA_MINIMA = 0.01;
/** Opções de tween que não animam nada: um `.to({}, { duration })` só ocupa tempo. */
const CHAVES_DE_CONTROLE = new Set([
  "duration",
  "ease",
  "delay",
  "immediateRender",
  "overwrite",
  "data",
  "id",
  "callbackScope",
  "onStart",
  "onUpdate",
  "onComplete",
]);

/**
 * Trechos [início, fim] em que algum tween anima, em tempo da timeline raiz. Um tween com
 * `data: "respiro"` (movimento vivo que continua dentro do patamar) não conta.
 */
function trechosAnimados(tl, deslocamento = 0, saida = /** @type {[number, number][]} */ ([])) {
  for (const filho of tl.getChildren(false, true, true)) {
    const inicio = deslocamento + filho.startTime();
    if (filho instanceof gsap.core.Timeline) {
      trechosAnimados(filho, inicio, saida);
    } else if (
      filho.totalDuration() > 0 &&
      filho.vars.data !== "respiro" &&
      Object.keys(filho.vars).some((chave) => !CHAVES_DE_CONTROLE.has(chave))
    ) {
      saida.push([inicio, inicio + filho.totalDuration()]);
    }
  }
  return saida;
}

/**
 * Patamares de leitura tirados da própria coreografia: o meio de cada pausa (trecho em que
 * nada anima) da timeline, em progresso (0 a 1), mais o começo e o fim do pin. A pausa
 * que encosta no começo vale 0 e a que encosta no fim vale 1, para não haver dois pontos
 * com a mesma imagem.
 * @param {gsap.core.Timeline} tl
 * @returns {number[]}
 */
export function pausasDaTimeline(tl) {
  const total = tl.duration();
  if (!(total > 0)) return [0, 1];
  const trechos = trechosAnimados(tl).sort((a, b) => a[0] - b[0]);
  const pontos = [0, 1];
  let livreDesde = 0;
  for (const [inicio, fim] of [...trechos, [total, total]]) {
    if (inicio - livreDesde >= total * PAUSA_MINIMA && livreDesde > 0 && inicio < total) {
      pontos.push((livreDesde + inicio) / 2 / total);
    }
    livreDesde = Math.max(livreDesde, fim);
  }
  return pontos.sort((a, b) => a - b);
}

/**
 * Snap nos patamares de leitura, só em aparelho só de toque: no dedo, o arrasto tem inércia
 * nativa e atravessa os patamares; a roda do mouse anda em passos e não precisa. Quando o
 * gesto termina (o ScrollTrigger espera o dedo sair da tela e a inércia parar), a rolagem
 * escorrega até o patamar mais próximo NA DIREÇÃO do gesto. Fora do pin não age (o
 * ScrollTrigger só faz snap entre start e end). No desktop devolve undefined: sem snap.
 * @param {() => number[]} progressos pontos de 0 a 1, lidos na hora de cada snap
 * @returns {ScrollTrigger.SnapVars | undefined}
 */
export function snapPatamares(progressos) {
  if (!soToque()) return undefined;
  return {
    snapTo: (valor, self) => ScrollTrigger.snapDirectional(progressos())(valor, self?.direction),
    // A inércia do dedo já aconteceu (nativa). Sem isto o ScrollTrigger soma outra, medida
    // pelo progresso da animação, que com scrub ainda corre atrás da rolagem: o snap pulava
    // patamares e às vezes ia até a ponta do pin.
    inertia: false,
    duration: { min: 0.25, max: 0.6 },
    delay: 0.08,
    ease: "power2.out",
  };
}

/**
 * @typedef {Object} OpcoesPin
 * @property {HTMLElement} [alvo] Elemento fixado. Padrão: o root da cena.
 * @property {string | number} [distancia] Quanto de rolagem dura o pin. Padrão "+=150%".
 * @property {boolean | number} [scrub] Padrão 0.7 (faixa aceita: 0,6 a 0,8).
 * @property {string} [inicio] Padrão "top top".
 * @property {"pausas" | (() => number[])} [patamares] Onde o toque assenta (snapPatamares):
 *   "pausas" tira da coreografia (pausasDaTimeline); a função devolve progressos de 0 a 1.
 *   Os pontos ficam em data-patamares no alvo, para as verificações.
 * @property {(self: ScrollTrigger) => void} [aoAtualizar]
 */

/**
 * Pin + scrub padronizado: devolve uma timeline (ease "none") ligada à rolagem.
 * Crie no init, de forma síncrona: os pins são calculados na ordem de criação.
 * @param {HTMLElement} root
 * @param {OpcoesPin} [opcoes]
 * @returns {gsap.core.Timeline}
 */
export function pinScrub(root, opcoes = {}) {
  const alvo = opcoes.alvo ?? root;
  const { patamares } = opcoes;
  // A timeline ainda não existe aqui: os pontos são lidos depois, quando a cena já a montou.
  /** @type {gsap.core.Timeline | null} */
  let tl = null;
  const progressos = () => {
    if (patamares === "pausas") return tl ? pausasDaTimeline(tl) : [0, 1];
    return patamares ? patamares() : [];
  };
  tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: alvo,
      pin: alvo,
      start: opcoes.inicio ?? "top top",
      end: opcoes.distancia ?? "+=150%",
      scrub: opcoes.scrub ?? 0.7,
      snap: patamares ? snapPatamares(progressos) : undefined,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: opcoes.aoAtualizar,
      onRefresh: patamares
        ? () => {
            alvo.dataset.patamares = progressos()
              .map((p) => p.toFixed(4))
              .join(" ");
          }
        : undefined,
    },
  });
  return tl;
}
