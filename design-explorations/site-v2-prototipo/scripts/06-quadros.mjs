/* Cena 06 · quadros ao longo da cena e vídeo de leitura (rode depois do build).
   Quadros: rola em passos pela #unidades e espera 1,4 s por quadro, em Chromium e Firefox,
   1440×900 e 390×844 → capturas/06-quadros/<navegador>-<largura>-<n>.png.
   Vídeo: Chromium 1440×900, rolagem contínua em velocidade de leitura →
   capturas/06-video.webm. Sai com código 1 se houver erro de console ou de página. */
import { chromium, firefox } from "playwright";
import { mkdirSync, renameSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "../serve.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const PASTA = join(RAIZ, "capturas", "06-quadros");
const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
];

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

/** Topo e altura da cena, em coordenadas da página. */
function medirCena(pagina) {
  return pagina.evaluate(() => {
    const el = /** @type {HTMLElement} */ (document.getElementById("unidades"));
    const r = el.getBoundingClientRect();
    return { topo: r.top + window.scrollY, altura: r.height };
  });
}

async function quadros(nome, tipo, url, erros) {
  const navegador = await tipo.launch();
  try {
    for (const viewport of VIEWPORTS) {
      const contexto = await navegador.newContext({ viewport });
      const pagina = await abrir(contexto, url, `${nome} ${viewport.width}`, erros);
      const { topo, altura } = await medirCena(pagina);
      const passos = viewport.width > 760 ? 8 : 12;
      for (let i = 0; i <= passos; i++) {
        const y = Math.round(
          topo - viewport.height * 0.3 + ((altura - viewport.height * 0.4) * i) / passos,
        );
        await pagina.evaluate((alvo) => window.scrollTo(0, alvo), y);
        await pagina.waitForTimeout(900);
        await pagina.evaluate((alvo) => window.scrollTo(0, alvo), y);
        await pagina.waitForTimeout(1400);
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
  const navegador = await chromium.launch();
  const pastaVideo = join(PASTA, "video-tmp");
  try {
    const viewport = { width: 1440, height: 900 };
    const contexto = await navegador.newContext({
      viewport,
      recordVideo: { dir: pastaVideo, size: viewport },
    });
    const pagina = await abrir(contexto, url, "vídeo", erros);
    const { topo, altura } = await medirCena(pagina);
    const inicio = Math.round(topo - viewport.height);
    await pagina.evaluate((y) => window.scrollTo(0, y), inicio);
    await pagina.waitForTimeout(1500);
    // Rodinha em passos curtos: ~240 px/s, velocidade de leitura com o Lenis suavizando.
    await pagina.mouse.move(720, 450);
    const fim = topo + altura;
    for (let y = inicio; y < fim; y += 60) {
      await pagina.mouse.wheel(0, 60);
      await pagina.waitForTimeout(250);
    }
    await pagina.waitForTimeout(1500);
    const caminho = await pagina.video()?.path();
    await contexto.close();
    if (caminho) renameSync(caminho, join(RAIZ, "capturas", "06-video.webm"));
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
    const so = process.argv.includes("--so-video")
      ? []
      : [
          ["chromium", chromium],
          ["firefox", firefox],
        ];
    for (const [nome, tipo] of so) await quadros(nome, tipo, servidor.url, erros);
    if (!process.argv.includes("--sem-video")) await video(servidor.url, erros);
  } finally {
    await servidor.fechar();
  }
  if (erros.length) {
    console.error(erros.join("\n"));
    process.exit(1);
  }
  console.log("ok: quadros em capturas/06-quadros, vídeo em capturas/06-video.webm");
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
