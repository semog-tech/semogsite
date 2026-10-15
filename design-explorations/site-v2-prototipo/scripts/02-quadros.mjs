/* Cena 02 · quadros ao longo do pin e vídeo de leitura (rode depois do build).
   Quadros: posições fixas da #condominios (antes, ao longo do pin, depois), espera 1,4 s
   por quadro, em Chromium e Firefox, 1440×900 e 390×844 →
   capturas/02-quadros/<navegador>-<largura>-<n>.png.
   Vídeo: Chromium 1440×900, rolagem contínua em velocidade de leitura →
   capturas/02-video.webm. Sai com código 1 se houver erro de console ou de página.
   Opções: --sem-video, --so-video, --navegador chromium|firefox. */
import { chromium, firefox } from "playwright";
import { mkdirSync, renameSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "../serve.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const PASTA = join(RAIZ, "capturas", "02-quadros");
const VIEWPORTS = [
  { viewport: { width: 1440, height: 900 } },
  { viewport: { width: 390, height: 844 } },
  // O iframe do Artifact publicado, com o Windows em 125%.
  { viewport: { width: 1494, height: 1102 }, deviceScaleFactor: 1.25 },
];
// Posições em telas a partir do início do pin (a timeline da cena é medida em telas):
// antes, número, patamar dos números, cobertura, cena 03 subindo, depois.
const MARCAS = [
  -0.5, 0, 0.45, 0.9, 1.2, 1.5, 1.85, 2.2, 2.5, 2.7, 2.82, 2.94, 3.06, 3.2, 3.62, 3.9,
];
// Chromium com WebGL em software, como o verificador roda.
const ARGS = { chromium: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"], firefox: [] };

function ouvirErros(pagina, rotulo, erros) {
  pagina.on("console", (m) => m.type() === "error" && erros.push(`${rotulo} console: ${m.text()}`));
  pagina.on("pageerror", (e) => erros.push(`${rotulo} página: ${e.message}`));
}

async function abrir(contexto, url, rotulo, erros) {
  const pagina = await contexto.newPage();
  ouvirErros(pagina, rotulo, erros);
  await pagina.goto(url, { waitUntil: "load" });
  await pagina.waitForFunction(() => document.documentElement.classList.contains("motion"));
  return pagina;
}

/** Topo da cena e quanto dura o pin, em px da página. */
function medirCena(pagina) {
  return pagina.evaluate(() => {
    const el = /** @type {HTMLElement} */ (document.getElementById("condominios"));
    const r = el.getBoundingClientRect();
    return { topo: r.top + window.scrollY, pin: r.height - window.innerHeight };
  });
}

async function irPara(pagina, y) {
  await pagina.evaluate((alvo) => window.scrollTo(0, alvo), y);
  await pagina.waitForTimeout(900);
  await pagina.evaluate((alvo) => window.scrollTo(0, alvo), y);
  await pagina.waitForTimeout(1400);
}

async function quadros(nome, tipo, url, erros) {
  const navegador = await tipo.launch({ args: ARGS[nome] });
  try {
    for (const opcoes of VIEWPORTS) {
      const { viewport } = opcoes;
      const contexto = await navegador.newContext(opcoes);
      const pagina = await abrir(contexto, url, `${nome} ${viewport.width}`, erros);
      const { topo, pin } = await medirCena(pagina);
      for (const [i, marca] of MARCAS.entries()) {
        const y = Math.min(topo + marca * viewport.height, topo + pin + viewport.height * 0.3);
        await irPara(pagina, Math.round(y));
        const n = String(i).padStart(2, "0");
        await pagina.screenshot({ path: join(PASTA, `${nome}-${viewport.width}-${n}.png`) });
      }
      const largo = await pagina.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      if (largo) erros.push(`${nome} ${viewport.width}: scroll horizontal`);
      await contexto.close();
    }
  } finally {
    await navegador.close();
  }
}

async function video(url, erros) {
  const navegador = await chromium.launch({ args: ARGS.chromium });
  const pastaVideo = join(PASTA, "video-tmp");
  try {
    const viewport = { width: 1440, height: 900 };
    const contexto = await navegador.newContext({
      viewport,
      recordVideo: { dir: pastaVideo, size: viewport },
    });
    const pagina = await abrir(contexto, url, "vídeo", erros);
    const { topo, pin } = await medirCena(pagina);
    const inicio = Math.round(topo - viewport.height);
    await pagina.evaluate((y) => window.scrollTo(0, y), inicio);
    await pagina.waitForTimeout(1500);
    // Rodinha em passos curtos: ~240 px/s, velocidade de leitura com o Lenis suavizando.
    await pagina.mouse.move(720, 450);
    const fim = topo + pin + viewport.height * 0.6;
    for (let y = inicio; y < fim; y += 60) {
      await pagina.mouse.wheel(0, 60);
      await pagina.waitForTimeout(250);
    }
    await pagina.waitForTimeout(1500);
    const caminho = await pagina.video()?.path();
    await contexto.close();
    if (caminho) renameSync(caminho, join(RAIZ, "capturas", "02-video.webm"));
  } finally {
    await navegador.close();
    rmSync(pastaVideo, { recursive: true, force: true });
  }
}

function navegadores() {
  const i = process.argv.indexOf("--navegador");
  const todos = [
    ["chromium", chromium],
    ["firefox", firefox],
  ];
  if (process.argv.includes("--so-video")) return [];
  return i >= 0 ? todos.filter(([nome]) => nome === process.argv[i + 1]) : todos;
}

async function main() {
  rmSync(PASTA, { recursive: true, force: true });
  mkdirSync(PASTA, { recursive: true });
  const servidor = await servir(4302);
  const erros = [];
  try {
    for (const [nome, tipo] of navegadores()) await quadros(nome, tipo, servidor.url, erros);
    if (!process.argv.includes("--sem-video")) await video(servidor.url, erros);
  } finally {
    await servidor.fechar();
  }
  if (erros.length) {
    console.error(erros.join("\n"));
    process.exit(1);
  }
  console.log("ok: quadros em capturas/02-quadros, vídeo em capturas/02-video.webm");
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
