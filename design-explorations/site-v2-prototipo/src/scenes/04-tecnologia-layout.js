/**
 * Cena 04 · layout do palco: mede a área livre (ao lado da legenda no desktop, acima dela
 * no celular) e calcula onde cada etapa mora: colunas do ERP, folhas, documento com abas,
 * assinaturas, cartão do QR, campo de condomínios e colunas de custo. Só medidas; as poses
 * dos itens ficam em 04-tecnologia-poses.js.
 */
import { COLUNAS_CAMPO, COLUNAS_ERP, QR } from "./04-tecnologia-base.js";

/** @typedef {{ x: number, y: number, w: number, h: number }} Caixa */

/** @param {number} x @param {number} y @param {number} w @param {number} h @returns {Caixa} */
export const caixa = (x, y, w, h) => ({ x, y, w, h });

/**
 * Área livre do palco, em px do palco.
 * @param {HTMLElement} legendas @param {DOMRect} palco @param {boolean} compacta
 */
export function medirArea(legendas, palco, compacta) {
  const cab = document.querySelector("[data-cabecalho]")?.getBoundingClientRect().height ?? 68;
  if (compacta) {
    const y0 = cab + 13;
    return { ...caixa(16, y0, palco.width - 32, palco.height * 0.55 - y0), compacta };
  }
  const l = legendas.getBoundingClientRect();
  const x0 = l.right - palco.left + 55;
  const x1 = palco.width - Math.max(34, (palco.width - 1200) / 2);
  const y0 = cab + 34;
  return { ...caixa(x0, y0, x1 - x0, palco.height - 55 - y0), compacta };
}

/** @typedef {ReturnType<typeof medirArea>} Area */

/**
 * Colunas do ledger: linhas de número em cima, sublinhado e total embaixo.
 * @param {Area} A @param {import("./04-tecnologia-base.js").BaseTecnologia} base
 */
export function layoutErp(A, base) {
  const gap = Math.min(48, Math.max(20, A.w * 0.05));
  const colW = (A.w - COLUNAS_ERP * gap) / COLUNAS_ERP;
  // O total é o maior número da coluna: a fonte dele cabe na largura da coluna.
  const fonteTotal = Math.min(13, colW / 6.4);
  const yU = A.y + A.h - fonteTotal * 2.6;
  const yTop = A.y + 8;
  const maxLinhas = Math.max(...base.colunas.map((c) => c.qtd));
  const lh = (yU - 10 - yTop) / maxLinhas;
  return {
    gap,
    colW,
    colX: Array.from({ length: COLUNAS_ERP }, (_, k) => A.x + k * (colW + gap)),
    yTop,
    yU,
    lh,
    fonte: Math.max(5, Math.min(12.5, lh * 0.74, colW / 6.2)),
    fonteTotal,
  };
}

/** Seis folhas em grade 3 × 2, proporção A4. @param {Area} A @returns {Caixa[]} */
export function layoutFolhas(A) {
  const gap = A.w * 0.035;
  const h = Math.min((A.h - gap) / 2, ((A.w - 2 * gap) / 3) * Math.SQRT2);
  const w = h / Math.SQRT2;
  const x0 = A.x + (A.w - (3 * w + 2 * gap)) / 2;
  const y0 = A.y + (A.h - (2 * h + gap)) / 2;
  return Array.from({ length: 6 }, (_, k) =>
    caixa(x0 + (k % 3) * (w + gap), y0 + Math.floor(k / 3) * (h + gap), w, h),
  );
}

/** Linha do sumário k, em fração da altura da capa. @param {number} k */
export const ySumario = (k) => 0.2 + k * 0.074;

/**
 * Documento: capa com sumário, seis folhas empilhadas atrás, abas à direita com rótulo,
 * duas assinaturas e a folha do parecer que sai da pilha.
 * @param {Area} A @param {number} rotuloW largura do maior rótulo de aba
 */
export function layoutDoc(A, rotuloW) {
  const reserva = rotuloW + (A.compacta ? 40 : 64);
  const h = Math.min(A.h * 0.86, (A.w - reserva) * Math.SQRT2);
  const w = h / Math.SQRT2;
  const capa = caixa(A.x + (A.w - (w + reserva)) / 2, A.y + (A.h - h) / 2, w, h);
  const passo = A.compacta ? 2 : 3;
  const pilha = Array.from({ length: 6 }, (_, k) =>
    caixa(capa.x + (k + 1) * passo, capa.y + (k + 1) * passo, w, h),
  );
  const abaW = Math.max(10, w * 0.06);
  const abaH = h * 0.044;
  const abas = pilha.map((folha, k) =>
    caixa(folha.x + w, capa.y + (ySumario(k) + 0.007) * h - abaH / 2, abaW, abaH),
  );
  const linhaAss = capa.y + h * 0.86;
  const assinaturas = [0.09, 0.55].map((fx) =>
    caixa(capa.x + fx * w, linhaAss, w * 0.36, h * 0.05),
  );
  const parecerW = w * 0.52;
  const parecer = caixa(capa.x + w * 0.9, capa.y + h * 0.3, parecerW, parecerW * Math.SQRT2);
  return { capa, pilha, abas, assinaturas, parecer };
}

/** Cartão do QR, moldura, endereço, adendo e histórico. @param {Area} A */
export function layoutQr(A) {
  const s = Math.min(A.w * (A.compacta ? 0.5 : 0.44), A.h - (A.compacta ? 70 : 120));
  const vaoAdendo = A.compacta ? 21 : 34;
  const grupo = s * 1.42 + vaoAdendo;
  const cartao = caixa(A.x + Math.max(0, (A.w - grupo) / 2), A.y + (A.h - (s + 80)) / 2, s, s);
  const m = A.compacta ? 8 : 13;
  const moldura = caixa(cartao.x - m, cartao.y - m, s + 2 * m, s + 2 * m);
  const adendoW = s * 0.42;
  return {
    cartao,
    moldura,
    url: {
      x: moldura.x + (A.compacta ? 8 : 12),
      y: moldura.y + moldura.h + (A.compacta ? 21 : 34),
    },
    adendo: caixa(cartao.x + s + vaoAdendo, cartao.y + s * 0.12, adendoW, adendoW * Math.SQRT2),
    barra: barrasQr(cartao),
  };
}

/** Medidas das barras dentro do cartão. @param {Caixa} cartao */
function barrasQr(cartao) {
  const margem = cartao.w * 0.08;
  const passoX = (cartao.w - 2 * margem) / QR.colunas;
  const passoY = (cartao.h - 2 * margem) / QR.linhas;
  const w = passoX * 0.74;
  return {
    x0: cartao.x + margem,
    y0: cartao.y + margem,
    passoX,
    passoY,
    w,
    h: passoY - (passoX - w),
  };
}

/** Campo de condomínios: barras 1:2 em 22 colunas. @param {Area} A @param {number} n */
export function layoutCampo(A, n) {
  const linhas = Math.ceil(n / COLUNAS_CAMPO);
  const passoX = Math.min((A.w * 0.94) / COLUNAS_CAMPO, (A.h * 0.62) / (linhas * 1.58));
  const barW = passoX * 0.58;
  const vao = passoX - barW;
  const passoY = barW * 2 + vao;
  const gradeW = COLUNAS_CAMPO * passoX - vao;
  const gradeH = linhas * passoY - vao;
  const x0 = A.x + (A.w - gradeW) / 2;
  const y0 = A.y + (A.h - gradeH) * 0.42;
  return {
    grade: caixa(x0, y0, gradeW, gradeH),
    barW,
    barH: barW * 2,
    passoX,
    passoY,
    vao,
    base: y0 + gradeH + (A.compacta ? 21 : 34),
    linhas,
  };
}

/** Coordenada da célula i do campo. @param {ReturnType<typeof layoutCampo>} campo @param {number} i */
export function celula(campo, i) {
  const c = i % COLUNAS_CAMPO;
  const r = Math.floor(i / COLUNAS_CAMPO);
  return caixa(
    campo.grade.x + c * campo.passoX,
    campo.grade.y + r * campo.passoY,
    campo.barW,
    campo.barH,
  );
}

/**
 * Colunas de custo por categoria, assentadas na linha de base do campo.
 * @param {Area} A @param {ReturnType<typeof layoutCampo>} campo @param {import("./04-tecnologia-base.js").BaseTecnologia["categorias"]} cats
 */
export function layoutCustos(A, campo, cats) {
  const porLinha = 3;
  const k = cats.contagem.length;
  const colPasso = campo.grade.w / k;
  const linhasMax = Math.max(...cats.contagem.map((q) => Math.ceil(q / porLinha)));
  const fundo = campo.base - 8;
  const escala = Math.min(
    (colPasso * 0.74) / (porLinha * campo.passoX),
    (fundo - A.y - 21) / (linhasMax * campo.passoY),
    1,
  );
  const passoX = campo.passoX * escala;
  const passoY = campo.passoY * escala;
  const colW = porLinha * passoX - campo.vao * escala;
  const colunas = cats.contagem.map((q, j) => {
    const linhas = Math.ceil(q / porLinha);
    const ref = Math.max(1, Math.round(linhas * cats.referencia[j]));
    const x = campo.grade.x + j * colPasso + (colPasso - colW) / 2;
    return { x, w: colW, linhas, ref, yRef: fundo - ref * passoY + (campo.vao * escala) / 2 };
  });
  return { porLinha, passoX, passoY, escala, fundo, colunas };
}

/** Linhas da convenção e quais são as cláusulas que a leitura destaca. */
export const CONVENCAO = { linhas: 18, chave: [4, 9, 13] };

/**
 * Folhas avulsas do Semog One: o comprovante (que vira uma célula do campo) e a
 * convenção (lida, com visto humano ao lado).
 * @param {Area} A @param {ReturnType<typeof layoutCampo>} campo @param {number} n
 */
export function layoutAvulsas(A, campo, n) {
  const g = campo.grade;
  const alvo = Math.min(n - 1, 2 * COLUNAS_CAMPO + 15);
  const cel = celula(campo, alvo);
  const compW = Math.max(44, campo.passoX * 3.2);
  const comp = caixa(g.x + g.w * 0.74, g.y - campo.passoY * 0.5, compW, compW * 1.32);
  const sComp = Math.max(14, cel.h * 0.62);
  const convW = Math.min(A.w * 0.26, 230, (A.h * 0.8) / Math.SQRT2);
  const conv = caixa(
    g.x + g.w - convW,
    A.y + (A.h - convW * Math.SQRT2) * 0.35,
    convW,
    convW * Math.SQRT2,
  );
  const passo = 0.7 / CONVENCAO.linhas;
  const sConv = A.compacta ? 13 : 18;
  return {
    alvo,
    celAlvo: cel,
    comp,
    vistoComp: { x: cel.x + cel.w + 4, y: cel.y + cel.h * 0.5, s: sComp },
    conv,
    vistoConv: {
      x: conv.x - sConv * 1.5,
      y: conv.y + (0.2 + CONVENCAO.chave[1] * passo) * conv.h,
      s: sConv,
    },
  };
}

/**
 * Mede o palco inteiro. `larguraNumero` nasce vazio: quem cria o atlas dos números o
 * preenche (a fonte do ledger depende da altura das colunas).
 * @param {Object} o
 * @param {HTMLElement} o.legendas @param {HTMLElement} o.palco @param {boolean} o.compacta
 * @param {import("./04-tecnologia-base.js").BaseTecnologia} o.base
 * @param {number[][][]} o.conteudo retângulos de cada folha (04-tecnologia-poses.js)
 * @param {(fonte: string, texto: string) => number} o.medirTexto
 * @param {{ folhas: string[], url: string }} o.rotulos
 */
export function medirGeometria({ legendas, palco, compacta, base, conteudo, medirTexto, rotulos }) {
  const caixaPalco = palco.getBoundingClientRect();
  const area = medirArea(legendas, caixaPalco, compacta);
  const tamanhos = {
    pequeno: compacta ? 9.5 : 12,
    rotulo: compacta ? 10.5 : 13.5,
    url: compacta ? 13 : 18,
  };
  const rotuloW = Math.max(
    ...rotulos.folhas.map((t) => medirTexto(`500 ${tamanhos.rotulo}px Saira`, t)),
  );
  const campo = layoutCampo(area, base.n);
  return {
    largura: caixaPalco.width,
    altura: caixaPalco.height,
    area,
    tamanhos,
    conteudo,
    larguraNumero: new Float32Array(base.n),
    erp: layoutErp(area, base),
    folhas: layoutFolhas(area),
    doc: layoutDoc(area, rotuloW),
    qr: { ...layoutQr(area), urlW: medirTexto(`400 ${tamanhos.url}px Saira`, rotulos.url) },
    campo,
    custos: layoutCustos(area, campo, base.categorias),
    avulsas: layoutAvulsas(area, campo, base.n),
  };
}

/** @typedef {ReturnType<typeof medirGeometria>} Geometria */
