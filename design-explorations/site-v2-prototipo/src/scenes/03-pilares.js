/**
 * Cena 03 · pilares. Os três pilares são o símbolo III do logo. No desktop eles sobem do
 * chão em sequência quando o palco chega; com o palco fixado, cada face frontal vira uma
 * coluna de leitura, uma depois da outra. Abaixo de 1100px o texto vem empilhado e o III
 * fecha a cena. Na saída, a luz das faces desce em feixes e o marinho vira gelo.
 *
 * @param {import("../core/tipos.js").ContextoCena} ctx
 */
const DESKTOP = "(min-width: 1100px)";
/** Onde a descida já está clara o bastante para o header passar ao tema gelo. */
const DESCIDA_CLARA = 0.4;

export default function init(ctx) {
  const { gsap, root, util } = ctx;
  const palco = root.querySelector(".pilares-palco");
  const descida = root.querySelector(".pilares-descida");
  const titulo = root.querySelector(".pilares-titulo");
  if (
    !(palco instanceof HTMLElement) ||
    !(descida instanceof HTMLElement) ||
    !(titulo instanceof HTMLElement)
  ) {
    throw new Error("Estrutura da cena pilares incompleta.");
  }
  enfatizarUltimaOracao(titulo);
  prepararDestaques(root);
  util.revelarTexto(titulo, { duracao: 1.1 });

  const mm = gsap.matchMedia(root);
  mm.add(DESKTOP, () => montarDesktop(ctx, palco));
  mm.add(`not all and ${DESKTOP}`, () => montarEmpilhado(ctx));

  montarDescida(ctx, descida);
}

/* ---- Texto ---------------------------------------------------------------------- */

/** A última oração do título ("com uma equipe só.") ganha ênfase de peso. */
function enfatizarUltimaOracao(titulo) {
  const texto = titulo.textContent?.trim() ?? "";
  const corte = texto.lastIndexOf(", ");
  if (corte < 0) return;
  const enfase = document.createElement("em");
  enfase.className = "peso";
  enfase.textContent = texto.slice(corte + 2);
  titulo.replaceChildren(document.createTextNode(`${texto.slice(0, corte + 1)} `), enfase);
}

/**
 * Destaques tirados do próprio texto (que vem do conteudo.json): no Semog Garante, o
 * primeiro percentual vira numeral grande; na Cobrança, a primeira frase vira frase-guia.
 * Sem JS o parágrafo inteiro continua lá.
 * @param {HTMLElement} root
 */
function prepararDestaques(root) {
  const garante = root.querySelector('[data-destaque="percentual"]');
  const percentual = garante?.textContent?.match(/\d+%/)?.[0];
  if (garante && percentual) {
    const numeral = document.createElement("span");
    numeral.className = "pilar-numeral linha";
    numeral.setAttribute("aria-hidden", "true");
    const interno = document.createElement("span");
    interno.className = "linha-interna peso";
    interno.textContent = percentual;
    numeral.append(interno);
    garante.before(numeral);
  }
  const cobranca = root.querySelector('[data-destaque="frase"]');
  const texto = cobranca?.textContent?.trim() ?? "";
  const fim = texto.indexOf(". ");
  if (cobranca && fim > 0) {
    const frase = document.createElement("p");
    frase.className = "pilar-frase";
    frase.textContent = texto.slice(0, fim + 1);
    cobranca.before(frase);
    cobranca.textContent = texto.slice(fim + 2);
  }
}

/** Blocos de texto de uma face, na ordem de leitura. @param {Element} pilar */
function blocosDaFace(pilar) {
  return Array.from(pilar.querySelectorAll(".pilar-titulo, .pilar-frase, .pilar-texto"));
}

/* ---- Desktop -------------------------------------------------------------------- */

/**
 * @param {import("../core/tipos.js").ContextoCena} ctx
 * @param {HTMLElement} palco
 */
function montarDesktop(ctx, palco) {
  const { gsap, ScrollTrigger, root, util } = ctx;
  const pilares = gsap.utils.toArray(".pilares-fila .pilar", root);
  const subida = gsap
    .timeline({ scrollTrigger: { trigger: palco, start: "top 70%", once: true } })
    .from(".pilares-fila .pilar-corpo", {
      yPercent: 112,
      duration: 1.3,
      ease: "expo.out",
      stagger: 0.16,
    });

  // Um pin, uma ideia: as faces viram colunas de leitura, uma depois da outra.
  const leitura = util.pinScrub(root, { alvo: palco, distancia: "+=150%", scrub: 0.7 });
  pilares.forEach((pilar, i) => lerFace(ctx, leitura, pilar, i * 0.7));
  leitura.to({}, { duration: 0.35 });
  util.aoImprimir(() => {
    subida.progress(1);
    leitura.progress(1);
  });
  // Ao cruzar 1100px depois da carga, este pin nasce depois dos de baixo: reordena.
  ScrollTrigger.sort();
}

/**
 * Uma face: título, destaque e texto sobem por máscara linha a linha, a luz atravessa a
 * face e o numeral ganha peso.
 * @param {import("../core/tipos.js").ContextoCena} ctx
 * @param {gsap.core.Timeline} leitura
 * @param {HTMLElement} pilar
 * @param {number} inicio
 */
function lerFace(ctx, leitura, pilar, inicio) {
  blocosDaFace(pilar).forEach((bloco, j) => linhasNoPin(ctx, leitura, bloco, inicio + j * 0.16));
  // A luz atravessa a face de cima para baixo enquanto ela vira coluna de leitura.
  const brilho = pilar.querySelector(".pilar-brilho");
  if (brilho) {
    leitura.fromTo(
      brilho,
      { yPercent: 0 },
      { yPercent: 325, duration: 1.2, ease: "power1.inOut" },
      inicio,
    );
  }
  const numeral = pilar.querySelector(".pilar-numeral .linha-interna");
  if (numeral) {
    leitura
      .from(numeral, { yPercent: 110, duration: 0.6, ease: "expo.out" }, inicio + 0.12)
      .fromTo(
        numeral,
        { fontVariationSettings: '"wght" 250' },
        { fontVariationSettings: '"wght" 650', duration: 0.8, ease: "power2.inOut" },
        inicio + 0.3,
      );
  }
}

/**
 * Máscara por linha dentro da timeline do pin. As linhas dependem da largura e da fonte:
 * cada re-divisão troca a sub-timeline no mesmo lugar e a sincroniza com a rolagem atual.
 * @param {import("../core/tipos.js").ContextoCena} ctx
 * @param {gsap.core.Timeline} leitura
 * @param {Element} bloco
 * @param {number} posicao
 */
function linhasNoPin({ gsap, SplitText }, leitura, bloco, posicao) {
  /** @type {gsap.core.Timeline | null} */
  let parte = null;
  SplitText.create(bloco, {
    type: "lines",
    mask: "lines",
    autoSplit: true,
    linesClass: "revela-linha",
    onSplit(self) {
      if (parte) {
        leitura.remove(parte);
        parte.kill();
      }
      parte = gsap.timeline().from(self.lines, {
        yPercent: 110,
        duration: 0.6,
        ease: "expo.out",
        stagger: 0.05,
      });
      leitura.add(parte, posicao);
      parte.totalTime(gsap.utils.clamp(0, parte.totalDuration(), leitura.time() - posicao));
    },
  });
}

/* ---- Empilhado (abaixo de 1100px) ---------------------------------------------- */

/** @param {import("../core/tipos.js").ContextoCena} ctx */
function montarEmpilhado({ gsap, root, util }) {
  for (const pilar of root.querySelectorAll(".pilares-fila .pilar")) {
    for (const bloco of blocosDaFace(pilar)) util.revelarTexto(bloco);
    const numeral = pilar.querySelector(".pilar-numeral .linha-interna");
    if (numeral) {
      gsap
        .timeline({ scrollTrigger: { trigger: numeral, start: "top 85%", once: true } })
        .from(numeral, { yPercent: 110, duration: 1, ease: "expo.out" })
        .fromTo(
          numeral,
          { fontVariationSettings: '"wght" 250' },
          { fontVariationSettings: '"wght" 650', duration: 1.5, ease: "power2.inOut" },
          0.45,
        );
    }
  }
  const subida = gsap
    .timeline({ scrollTrigger: { trigger: ".pilares-iii", start: "top 80%", once: true } })
    .from(".pilares-iii .pilar-corpo", {
      yPercent: 112,
      duration: 1.3,
      ease: "expo.out",
      stagger: 0.16,
    });
  util.aoImprimir(() => subida.progress(1));
}

/* ---- Descida -------------------------------------------------------------------- */

/**
 * Os feixes continuam as faces para baixo enquanto o fundo vai do marinho ao gelo, e uma
 * faixa de luz desce por eles com a rolagem. Quando a parte clara passa sob o header, a
 * seção assume o tema gelo (o header copia o tema da seção).
 * @param {import("../core/tipos.js").ContextoCena} ctx
 * @param {HTMLElement} descida
 */
function montarDescida({ gsap, ScrollTrigger, root, util }, descida) {
  // A faixa de luz desce pelos feixes, um depois do outro, na ordem de leitura.
  gsap.fromTo(
    ".feixe-luz",
    { yPercent: 0 },
    {
      yPercent: 500,
      ease: "none",
      stagger: 0.12,
      scrollTrigger: { trigger: descida, start: "top bottom", end: "bottom bottom", scrub: 0.7 },
    },
  );
  const temaOriginal = root.dataset.tema ?? "marinho";
  ScrollTrigger.create({
    trigger: descida,
    start: () => `top+=${Math.round(descida.offsetHeight * DESCIDA_CLARA)} top+=${alturaHeader()}`,
    end: "max",
    onToggle: (self) => {
      root.dataset.tema = self.isActive ? "gelo" : temaOriginal;
    },
  });
  // Impressa, a seção é marinho inteira: com o tema gelo preso (rolou além da descida),
  // o texto saía marinho sobre marinho.
  util.aoImprimir(() => {
    root.dataset.tema = temaOriginal;
  });
}

/** Altura do header em px, lida do token --cab. */
function alturaHeader() {
  const valor = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--cab"));
  return Number.isFinite(valor) ? valor : 0;
}
