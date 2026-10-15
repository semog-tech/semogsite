/* Quadros e vídeo da cena 03 (rode depois do build).
   Rola em passos do fim da cena 02 até o começo da cena 04 e salva um quadro por passo em
   capturas/03-quadros/<navegador>-<largura>-NN.png (espera 1,3 s por quadro). Mede a
   descida em duas colunas (vão e feixe) e acusa degrau: salto entre linhas vizinhas acima
   da inclinação local, depois da média horizontal que apaga o grão. Com --video, grava capturas/03-video.webm
   (Chromium, 1440×900) rolando pela roda do mouse em velocidade de leitura.
   Falha (código 1) com erro de console/página, scroll horizontal ou degrau na descida.
     --navegador <nome>  chromium ou firefox (padrão: os dois)
     --video             grava o vídeo */
import { chromium, firefox } from "playwright";
import { mkdirSync, renameSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "../serve.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const PASTA = join(RAIZ, "capturas", "03-quadros");
const VIEWPORTS = [
  { width: 1440, height: 900, passos: 12 },
  { width: 390, height: 844, passos: 10 },
];
const NAVEGADORES = { chromium, firefox };
const ESPERA_QUADRO_MS = 1300;
// Degrau máximo aceito acima da inclinação local (0–255, média de 41 px de largura).
const DEGRAU_MAXIMO = 2;

function lerArgs(argv) {
  const args = { navegadores: [], video: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--video") args.video = true;
    else if (argv[i] === "--navegador") args.navegadores.push(argv[++i]);
    else throw new Error(`Opção desconhecida: ${argv[i]}`);
  }
  if (!args.navegadores.length) args.navegadores = Object.keys(NAVEGADORES);
  return args;
}

function ouvirErros(pagina) {
  const erros = [];
  pagina.on("console", (msg) => {
    if (msg.type() === "error") erros.push(`console: ${msg.text()}`);
  });
  pagina.on("pageerror", (erro) => erros.push(`página: ${erro.message}`));
  return erros;
}

/** Topo e base da cena e da descida, em coordenadas do documento. */
function medir(pagina) {
  return pagina.evaluate(() => {
    const abs = (el) => {
      const r = el.getBoundingClientRect();
      return { topo: r.top + window.scrollY, base: r.bottom + window.scrollY };
    };
    const cena = document.getElementById("pilares");
    const descida = cena?.querySelector(".pilares-descida");
    if (!cena || !descida) throw new Error("#pilares ou .pilares-descida ausente.");
    const cab = document.querySelector("[data-cabecalho]")?.getBoundingClientRect().bottom ?? 0;
    return { cena: abs(cena), descida: abs(descida), alto: window.innerHeight, cab };
  });
}

async function rolar(pagina, y) {
  await pagina.evaluate((alvo) => window.scrollTo(0, alvo), y);
  await pagina.waitForTimeout(700);
  await pagina.evaluate((alvo) => window.scrollTo(0, alvo), y);
  await pagina.waitForTimeout(ESPERA_QUADRO_MS);
}

/** Luminância média por linha numa faixa vertical do PNG (decodificado num canvas). */
async function perfil(pagina, png, x, largura) {
  return pagina.evaluate(
    async ({ b64, x, largura }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const g = c.getContext("2d");
      g.drawImage(img, 0, 0);
      const dados = g.getImageData(x, 0, largura, img.height).data;
      const linhas = [];
      for (let y = 0; y < img.height; y++) {
        const soma = [0, 0, 0];
        for (let i = 0; i < largura; i++) {
          const k = (y * largura + i) * 4;
          for (let ch = 0; ch < 3; ch++) soma[ch] += dados[k + ch];
        }
        linhas.push(soma.map((s) => s / largura));
      }
      return linhas;
    },
    { b64: png.toString("base64"), x, largura },
  );
}

/**
 * Maior degrau dentro de [de, ate): o salto entre linhas vizinhas que passa da inclinação
 * local (média dos saltos de 3 a 8 linhas antes e depois). Rampa íngreme e lisa não conta;
 * faixa de banding ou emenda conta.
 */
function maiorDegrau(linhas, de, ate) {
  const salto = (y, ch) => Math.abs(linhas[y][ch] - linhas[y - 1][ch]);
  let maior = { salto: 0, y: -1 };
  for (let y = Math.max(9, de); y < Math.min(linhas.length - 9, ate); y++) {
    for (let ch = 0; ch < 3; ch++) {
      const vizinhos = [-8, -7, -6, -5, -4, -3, 3, 4, 5, 6, 7, 8].map((d) => salto(y + d, ch));
      const local = vizinhos.reduce((a, b) => a + b, 0) / vizinhos.length;
      const excesso = salto(y, ch) - local;
      if (excesso > maior.salto) maior = { salto: excesso, y };
    }
  }
  return maior;
}

/** Colunas de medida: centro do vão entre o 1º e o 2º pilar, e centro do 2º feixe. */
function colunasDeMedida(pagina) {
  return pagina.evaluate(() => {
    const feixes = document.querySelectorAll("#pilares .feixe");
    const a = feixes[0].getBoundingClientRect();
    const b = feixes[1].getBoundingClientRect();
    return { vao: Math.round((a.right + b.left) / 2), feixe: Math.round((b.left + b.right) / 2) };
  });
}

async function verificarDescida(pagina, medidas, rotulo) {
  const falhas = [];
  const { descida, alto } = medidas;
  const colunas = await colunasDeMedida(pagina);
  for (let y = descida.topo - alto * 0.5; y < descida.base; y += alto * 0.5) {
    await rolar(pagina, Math.round(y));
    const png = await pagina.screenshot();
    const topoNaTela = Math.round(descida.topo - y);
    const baseNaTela = Math.round(descida.base - y);
    // Fora da medida: a barra do header (borda própria) e o que já é a cena 04.
    const de = Math.max(topoNaTela - 40, medidas.cab + 4);
    // Entra 60 px na cena 04: a junção também é medida.
    const ate = Math.min(alto, baseNaTela + 60);
    for (const [nome, x] of Object.entries(colunas)) {
      const linhas = await perfil(pagina, png, Math.max(0, x - 20), 41);
      const { salto, y: onde } = maiorDegrau(linhas, de, ate);
      const texto = `${rotulo} rolagem ${Math.round(y)} coluna ${nome}: maior degrau ${salto.toFixed(2)} na linha ${onde}`;
      console.log(`  ${texto}`);
      if (salto > DEGRAU_MAXIMO) falhas.push(`degrau: ${texto}`);
    }
  }
  return falhas;
}

/**
 * Junção com a cena 04, de lado a lado: com a base da descida no meio da tela, compara a
 * cor média das 12 linhas acima com a das 12 abaixo em toda a largura (faixas de 41 px).
 */
async function verificarJuncao(pagina, medidas, rotulo) {
  const { descida, alto } = medidas;
  await rolar(pagina, Math.round(descida.base - alto / 2));
  const linha = await pagina.evaluate(
    () => document.querySelector("#pilares .pilares-descida").getBoundingClientRect().bottom,
  );
  const png = await pagina.screenshot();
  const largura = pagina.viewportSize()?.width ?? 0;
  const y = Math.round(linha);
  let pior = { diferenca: 0, x: -1 };
  for (let x = 0; x + 41 <= largura; x += 41) {
    const linhas = await perfil(pagina, png, x, 41);
    const media = (de, ate) =>
      [0, 1, 2].map((ch) => {
        let soma = 0;
        for (let i = de; i < ate; i++) soma += linhas[i][ch];
        return soma / (ate - de);
      });
    const acima = media(y - 12, y);
    const abaixo = media(y, y + 12);
    const diferenca = Math.max(...acima.map((v, ch) => Math.abs(v - abaixo[ch])));
    if (diferenca > pior.diferenca) pior = { diferenca, x };
  }
  const texto = `${rotulo} junção com a 04 (linha ${y}): maior diferença ${pior.diferenca.toFixed(2)} em x=${pior.x}`;
  console.log(`  ${texto}`);
  return pior.diferenca > DEGRAU_MAXIMO ? [`degrau: ${texto}`] : [];
}

async function quadros(navegador, nome, url, viewport) {
  const contexto = await navegador.newContext({
    viewport: { width: viewport.width, height: viewport.height },
  });
  const pagina = await contexto.newPage();
  const erros = ouvirErros(pagina);
  const falhas = [];
  try {
    await pagina.goto(url, { waitUntil: "load" });
    await pagina.waitForFunction(() => document.documentElement.classList.contains("motion"));
    const medidas = await medir(pagina);
    const { cena, alto } = medidas;
    const de = cena.topo - alto * 0.6;
    const ate = cena.base - alto * 0.4;
    for (let i = 0; i < viewport.passos; i++) {
      const y = Math.round(de + ((ate - de) * i) / (viewport.passos - 1));
      await rolar(pagina, y);
      const arquivo = join(PASTA, `${nome}-${viewport.width}-${String(i).padStart(2, "0")}.png`);
      await pagina.screenshot({ path: arquivo });
      console.log(`  ${nome} ${viewport.width}: rolagem ${y} → ${arquivo.slice(RAIZ.length + 1)}`);
    }
    falhas.push(...(await verificarDescida(pagina, medidas, `${nome} ${viewport.width}`)));
    falhas.push(...(await verificarJuncao(pagina, medidas, `${nome} ${viewport.width}`)));
    const horizontal = await pagina.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    if (horizontal) falhas.push("scroll horizontal");
  } finally {
    await contexto.close();
  }
  return [...erros, ...falhas].map((e) => `[${nome} ${viewport.width}] ${e}`);
}

async function video(url) {
  const pastaVideo = join(RAIZ, "capturas", "03-video-tmp");
  const navegador = await chromium.launch();
  const tamanho = { width: 1440, height: 900 };
  try {
    const contexto = await navegador.newContext({
      viewport: tamanho,
      recordVideo: { dir: pastaVideo, size: tamanho },
    });
    const pagina = await contexto.newPage();
    await pagina.goto(url, { waitUntil: "load" });
    await pagina.waitForFunction(() => document.documentElement.classList.contains("motion"));
    const { cena, alto } = await medir(pagina);
    await rolar(pagina, Math.round(cena.topo - alto * 0.8));
    await pagina.mouse.move(720, 450);
    // ~450 px/s: 30 px a cada 66 ms, pela roda (o Lenis suaviza como numa rolagem real).
    const distancia = cena.base - cena.topo + alto * 0.6;
    for (let feito = 0; feito < distancia; feito += 30) {
      await pagina.mouse.wheel(0, 30);
      await pagina.waitForTimeout(66);
    }
    await pagina.waitForTimeout(1500);
    const gravado = pagina.video();
    await contexto.close();
    const origem = await gravado?.path();
    if (!origem) throw new Error("Vídeo não gravado.");
    renameSync(origem, join(RAIZ, "capturas", "03-video.webm"));
    console.log("  vídeo → capturas/03-video.webm");
  } finally {
    await navegador.close();
    rmSync(pastaVideo, { recursive: true, force: true });
  }
}

async function main() {
  const args = lerArgs(process.argv.slice(2));
  mkdirSync(PASTA, { recursive: true });
  const servidor = await servir();
  const problemas = [];
  try {
    for (const nome of args.navegadores) {
      const navegador = await NAVEGADORES[nome].launch();
      try {
        for (const viewport of VIEWPORTS) {
          problemas.push(...(await quadros(navegador, nome, servidor.url, viewport)));
        }
      } finally {
        await navegador.close();
      }
    }
    if (args.video) await video(servidor.url);
  } finally {
    await servidor.fechar();
  }
  if (problemas.length) {
    console.error(`\n${problemas.length} problema(s):\n  ${problemas.join("\n  ")}`);
    process.exit(1);
  }
  console.log("\nSem problemas.");
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
