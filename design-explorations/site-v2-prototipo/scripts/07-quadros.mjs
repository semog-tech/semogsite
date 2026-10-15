/* Quadros e vídeo da cena 07 (comunidade). Rode depois do build:
     node scripts/07-quadros.mjs            quadros Chromium + Firefox (1440 e 390) e vídeo
   Quadros em capturas/07-quadros/<navegador>-<largura>-NN.png, vídeo em capturas/07-video.webm.
   O Chromium headless perde o contexto WebGL logo ao criar (sem GPU); aqui ele sobe com
   SwiftShader para o gradiente vivo aparecer como num navegador de verdade. */
import { chromium, firefox } from "playwright";
import { mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "../serve.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const PASTA = join(RAIZ, "capturas", "07-quadros");
const ARGS_CHROMIUM = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"];
// Passos em alturas de tela a partir do topo da seção: começa na emenda com a cena 06 e
// vai até a emenda com a 08 (fim da seção no meio da tela).
const INICIO = -0.8;
const PASSO = 0.45;

function ouvirErros(pagina, erros) {
  pagina.on("console", (m) => m.type() === "error" && erros.push(`console: ${m.text()}`));
  pagina.on("pageerror", (e) => erros.push(`página: ${e.message}`));
}

async function topoDaSecao(pagina) {
  return pagina.evaluate(() => {
    const el = document.getElementById("comunidade");
    if (!el) throw new Error("#comunidade ausente");
    return Math.round(el.getBoundingClientRect().top + window.scrollY);
  });
}

async function quadros(nome, tipo, url, viewport, erros) {
  const navegador = await tipo.launch(nome === "chromium" ? { args: ARGS_CHROMIUM } : {});
  try {
    const pagina = await navegador.newPage({ viewport });
    ouvirErros(pagina, erros);
    await pagina.goto(url, { waitUntil: "load" });
    await pagina.waitForFunction(() => document.documentElement.classList.contains("motion"));
    const topo = await topoDaSecao(pagina);
    const fim = await pagina.evaluate(() => {
      const el = document.getElementById("comunidade");
      return el ? Math.round(el.getBoundingClientRect().bottom + window.scrollY) : 0;
    });
    for (let i = 0; ; i += 1) {
      const y = Math.round(topo + (INICIO + i * PASSO) * viewport.height);
      if (y > fim - viewport.height * 0.4) break;
      await pagina.evaluate((alvo) => window.scrollTo(0, alvo), y);
      await pagina.waitForTimeout(900);
      await pagina.evaluate((alvo) => window.scrollTo(0, alvo), y);
      await pagina.waitForTimeout(1300);
      const arquivo = join(PASTA, `${nome}-${viewport.width}-${String(i).padStart(2, "0")}.png`);
      await pagina.screenshot({ path: arquivo });
    }
    const largo = await pagina.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    if (largo) erros.push(`${nome} ${viewport.width}: scroll horizontal`);
  } finally {
    await navegador.close();
  }
}

async function video(url, erros) {
  const pastaVideo = join(PASTA, "video-tmp");
  const navegador = await chromium.launch({ args: ARGS_CHROMIUM });
  try {
    const contexto = await navegador.newContext({
      viewport: { width: 1440, height: 900 },
      recordVideo: { dir: pastaVideo, size: { width: 1440, height: 900 } },
    });
    const pagina = await contexto.newPage();
    ouvirErros(pagina, erros);
    await pagina.goto(url, { waitUntil: "load" });
    await pagina.waitForFunction(() => document.documentElement.classList.contains("motion"));
    const topo = await topoDaSecao(pagina);
    await pagina.evaluate((alvo) => window.scrollTo(0, alvo), topo - 1100);
    await pagina.waitForTimeout(1500);
    await pagina.mouse.move(720, 450);
    const total = await pagina.evaluate(() => {
      const el = document.getElementById("comunidade");
      return el ? el.getBoundingClientRect().bottom + 300 : 0;
    });
    for (let andado = 0; andado < total; andado += 60) {
      await pagina.mouse.wheel(0, 60);
      await pagina.waitForTimeout(120);
    }
    await pagina.waitForTimeout(1500);
    await contexto.close();
    const [arquivo] = readdirSync(pastaVideo);
    renameSync(join(pastaVideo, arquivo), join(RAIZ, "capturas", "07-video.webm"));
  } finally {
    await navegador.close();
    rmSync(pastaVideo, { recursive: true, force: true });
  }
}

async function main() {
  rmSync(PASTA, { recursive: true, force: true });
  mkdirSync(PASTA, { recursive: true });
  const servidor = await servir();
  const erros = [];
  try {
    for (const [nome, tipo] of [
      ["chromium", chromium],
      ["firefox", firefox],
    ]) {
      for (const viewport of [
        { width: 1440, height: 900 },
        { width: 390, height: 844 },
      ]) {
        await quadros(nome, tipo, servidor.url, viewport, erros);
      }
    }
    if (!process.argv.includes("--sem-video")) await video(servidor.url, erros);
  } finally {
    await servidor.fechar();
  }
  if (erros.length) {
    console.error(`${erros.length} problema(s):\n  ${erros.join("\n  ")}`);
    process.exit(1);
  }
  console.log("Quadros e vídeo prontos, sem erro de console nem scroll horizontal.");
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
