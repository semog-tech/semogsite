/**
 * Cena 04 · base do palco, independente do layout: os N itens (um por condomínio), as
 * sementes do enxame, os números do ledger, o QR feito de barras e as categorias de custo.
 *
 * Os números do ledger são textura: valores sorteados com semente fixa, sem rótulo, sem
 * moeda e sem nome de condomínio. A única promessa que eles fazem é a da cena: cada total
 * é a soma real da sua coluna. Inteiros simples, sem cifra nem formato de moeda: leem como
 * abstração, não como extrato.
 */

export const COLUNAS_ERP = 6;
export const COLUNAS_CAMPO = 22;
/** QR: grade de barras 1:2 (o padrão do rebrand), 28 colunas por 14 linhas. */
export const QR = { colunas: 28, linhas: 14 };
/** Localizador do QR: 7 colunas por 4 linhas de barras, nos três cantos. */
const LOCALIZADOR = { colunas: 7, linhas: 4 };
/** Pesos das categorias de custo (abstratos) e onde fica a linha dos parecidos. */
const PESOS_CATEGORIAS = [44, 36, 31, 28, 25, 22, 19, 15];
const REFERENCIA_CATEGORIAS = [0.8, 1.1, 0.72, 1, 0.7, 1.15, 0.85, 1.05];

/** Sorteio determinístico (mulberry32): a cena é a mesma a cada visita. */
export function sorteador(semente) {
  let s = semente >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Inteiro em dígitos corridos, sem separador de milhar nem decimal. @param {number} v */
export const formatarValor = (v) => String(v);

/** Divide n itens em k colunas consecutivas. @param {number} n @param {number} k */
function repartir(n, k) {
  const base = Math.floor(n / k);
  const sobra = n % k;
  let ini = 0;
  return Array.from({ length: k }, (_, j) => {
    const qtd = base + (j < sobra ? 1 : 0);
    const coluna = { ini, qtd };
    ini += qtd;
    return coluna;
  });
}

/** Desenho fixo de um localizador, em células relativas ao canto. */
function celulasLocalizador() {
  const celulas = [];
  for (let r = 0; r < LOCALIZADOR.linhas; r++) {
    for (let c = 0; c < LOCALIZADOR.colunas; c++) {
      const borda = r === 0 || r === LOCALIZADOR.linhas - 1 || c === 0 || c === 6;
      const miolo = c >= 2 && c <= 4 && r > 0 && r < LOCALIZADOR.linhas - 1;
      if (borda || miolo) celulas.push({ c, r });
    }
  }
  return celulas;
}

/**
 * Módulos escuros do QR, exatamente n, ordenados por linha e coluna. Não é um QR legível:
 * é a ilustração do QR, com os três localizadores e miolo sorteado.
 * @param {number} n @param {() => number} sortear
 */
function modulosQr(n, sortear) {
  const cantos = [
    { c: 0, r: 0 },
    { c: QR.colunas - LOCALIZADOR.colunas, r: 0 },
    { c: 0, r: QR.linhas - LOCALIZADOR.linhas },
  ];
  const escuros = cantos.flatMap((o) =>
    celulasLocalizador().map(({ c, r }) => ({ c: o.c + c, r: o.r + r })),
  );
  const reservado = (c, r) =>
    cantos.some((o) => c >= o.c - 1 && c <= o.c + 7 && r >= o.r - 1 && r <= o.r + 4);
  const livres = [];
  for (let r = 0; r < QR.linhas; r++) {
    for (let c = 0; c < QR.colunas; c++) if (!reservado(c, r)) livres.push({ c, r });
  }
  for (let i = livres.length - 1; i > 0; i--) {
    const j = Math.floor(sortear() * (i + 1));
    [livres[i], livres[j]] = [livres[j], livres[i]];
  }
  const todos = escuros.concat(livres.slice(0, Math.max(0, n - escuros.length)));
  if (todos.length < n) throw new Error(`QR comporta ${todos.length} barras; a cena pede ${n}.`);
  return todos.slice(0, n).sort((a, b) => a.r - b.r || a.c - b.c);
}

/** Contagem por categoria proporcional aos pesos, somando exatamente n. @param {number} n */
function contarCategorias(n) {
  const soma = PESOS_CATEGORIAS.reduce((a, b) => a + b, 0);
  const contagem = PESOS_CATEGORIAS.map((p) => Math.floor((p / soma) * n));
  let falta = n - contagem.reduce((a, b) => a + b, 0);
  for (let j = 0; falta > 0; j = (j + 1) % contagem.length, falta--) contagem[j] += 1;
  return contagem;
}

/**
 * Cada item ganha uma categoria e uma vaga na pilha dela. Os itens seguem a ordem das
 * colunas do campo (e, dentro da coluna, de baixo para cima): na passagem do campo para as
 * categorias, cada barra anda pouco.
 * @param {number} n
 */
function categorias(n) {
  const contagem = contarCategorias(n);
  const linhas = Math.ceil(n / COLUNAS_CAMPO);
  const ordem = Array.from({ length: n }, (_, i) => i).sort(
    (a, b) =>
      (a % COLUNAS_CAMPO) - (b % COLUNAS_CAMPO) ||
      linhas - Math.floor(a / COLUNAS_CAMPO) - (linhas - Math.floor(b / COLUNAS_CAMPO)),
  );
  const cat = new Int8Array(n);
  const vaga = new Int16Array(n);
  let j = 0;
  let usados = 0;
  for (const i of ordem) {
    while (usados >= contagem[j]) {
      j += 1;
      usados = 0;
    }
    cat[i] = j;
    vaga[i] = usados;
    usados += 1;
  }
  return { cat, vaga, contagem, referencia: REFERENCIA_CATEGORIAS };
}

/**
 * @typedef {Object} BaseTecnologia
 * @property {number} n
 * @property {Float32Array} sementes
 * @property {Int32Array} valores
 * @property {Float32Array} nivel cor de repouso no campo (0 a 1)
 * @property {Float32Array} nivelNovo cor depois da onda de atualização
 * @property {{ ini: number, qtd: number }[]} colunas
 * @property {number[]} totais soma de cada coluna
 * @property {{ c: number, r: number }[]} modulos
 * @property {ReturnType<typeof categorias>} categorias
 */

/** @param {number} n @returns {BaseTecnologia} */
export function criarBase(n) {
  const sortear = sorteador(20260504);
  const sementes = new Float32Array(n);
  const valores = new Int32Array(n);
  const nivel = new Float32Array(n);
  const nivelNovo = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    sementes[i] = sortear();
    valores[i] = 100 + Math.floor(sortear() * 9900);
    nivel[i] = 0.1 + sortear() * 0.42;
    nivelNovo[i] = Math.min(0.9, Math.max(0.06, nivel[i] + (sortear() - 0.4) * 0.5));
  }
  const colunas = repartir(n, COLUNAS_ERP);
  const totais = colunas.map(({ ini, qtd }) => {
    let soma = 0;
    for (let i = ini; i < ini + qtd; i++) soma += valores[i];
    return soma;
  });
  return {
    n,
    sementes,
    valores,
    nivel,
    nivelNovo,
    colunas,
    totais,
    modulos: modulosQr(n, sortear),
    categorias: categorias(n),
  };
}
