/* Quadros ao longo do pin da cena 05 e vídeo da rolagem (rode depois do build).
     node scripts/05-quadros.mjs [--navegador chromium|firefox] [--video]
   Salva capturas/05-quadros/<navegador>-<largura>-<p>.png e, com --video,
   capturas/05-video.webm (Chromium, 1440×900, rolagem por roda em ritmo de leitura).
   Sai com 1 se houver erro de console ou de página. */
import { chromium, firefox } from "playwright";
import { mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "../serve.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const PASTA = join(RAIZ, "capturas", "05-quadros");
const PONTOS = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
const NAVEGADORES = { chromium, firefox };
// O mesmo que a captura oficial: WebGL por software no Chromium headless.
const OPCOES = { chromium: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } };

function ouvirErros(pagina, erros) {
  pagina.on("console", (m) => m.type() === "error" && erros.push(`console: ${m.text()}`));
  pagina.on("pageerror", (e) => erros.push(`página: ${e.message}`));
}

async function irPara(pagina, y) {
  await pagina.evaluate((alvo) => window.scrollTo(0, alvo), y);
  await pagina.waitForTimeout(700);
  await pagina.evaluate((alvo) => window.scrollTo(0, alvo), y);
  await pagina.waitForTimeout(1300);
}

async function quadros(navegador, nome, url, viewport, erros) {
  const contexto = await navegador.newContext({ viewport });
  const pagina = await contexto.newPage();
  ouvirErros(pagina, erros);
  await pagina.goto(url, { waitUntil: "load" });
  await pagina.waitForFunction(() => document.documentElement.classList.contains("motion"));
  await pagina.waitForTimeout(600);
  const { topo, distancia } = await pagina.evaluate(() => {
    const el = document.getElementById("ranking");
    const espaco = el.querySelector(".pin-spacer");
    const topo = el.getBoundingClientRect().top + window.scrollY;
    return { topo, distancia: (espaco?.offsetHeight ?? innerHeight) - innerHeight };
  });
  // Aproximação: a seção sobe com o topo a 85%, 70%, 50% e 30% da tela.
  for (const fracao of [0.85, 0.7, 0.5, 0.3]) {
    await irPara(pagina, Math.round(topo - fracao * viewport.height));
    const nomeArquivo = `${nome}-${viewport.width}-chegada-${Math.round(fracao * 100)}.png`;
    await pagina.screenshot({ path: join(PASTA, nomeArquivo) });
  }
  for (const p of PONTOS) {
    await irPara(pagina, Math.round(topo + p * distancia));
    const arquivo = join(PASTA, `${nome}-${viewport.width}-${String(p).replace(".", "_")}.png`);
    await pagina.screenshot({ path: arquivo });
  }
  for (const [rotulo, seletor] of [
    ["historico", ".ranking-historico"],
    ["foto", ".ranking-foto"],
  ]) {
    const y = await pagina.evaluate((s) => {
      const el = document.querySelector(`#ranking ${s}`);
      return el.getBoundingClientRect().top + window.scrollY - innerHeight * 0.3;
    }, seletor);
    await irPara(pagina, Math.round(y));
    await pagina.screenshot({ path: join(PASTA, `${nome}-${viewport.width}-${rotulo}.png`) });
  }
  const largo = await pagina.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  if (largo) erros.push(`${nome} ${viewport.width}: scroll horizontal`);
  await contexto.close();
}

async function video(url, erros) {
  const tmp = join(RAIZ, "capturas", "05-video-tmp");
  rmSync(tmp, { recursive: true, force: true });
  const navegador = await chromium.launch(OPCOES.chromium);
  const contexto = await navegador.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: tmp, size: { width: 1440, height: 900 } },
  });
  const pagina = await contexto.newPage();
  ouvirErros(pagina, erros);
  await pagina.goto(url, { waitUntil: "load" });
  await pagina.waitForFunction(() => document.documentElement.classList.contains("motion"));
  const inicio = await pagina.evaluate(
    () => document.getElementById("ranking").getBoundingClientRect().top + scrollY - innerHeight,
  );
  await irPara(pagina, Math.round(inicio));
  await pagina.mouse.move(720, 450);
  // ~5,7 telas a 60px por passo, um passo a cada 55 ms: ritmo de quem lê.
  for (let k = 0; k < 85; k++) {
    await pagina.mouse.wheel(0, 60);
    await pagina.waitForTimeout(55);
  }
  await pagina.waitForTimeout(2200);
  await contexto.close();
  await navegador.close();
  const [arquivo] = readdirSync(tmp);
  renameSync(join(tmp, arquivo), join(RAIZ, "capturas", "05-video.webm"));
  rmSync(tmp, { recursive: true, force: true });
}

async function main() {
  const args = process.argv.slice(2);
  const i = args.indexOf("--navegador");
  const nomes = i >= 0 ? [args[i + 1]] : Object.keys(NAVEGADORES);
  mkdirSync(PASTA, { recursive: true });
  const servidor = await servir();
  const erros = [];
  try {
    for (const nome of nomes) {
      const navegador = await NAVEGADORES[nome].launch(OPCOES[nome] ?? {});
      for (const viewport of [
        { width: 1440, height: 900 },
        { width: 390, height: 844 },
      ]) {
        await quadros(navegador, nome, servidor.url, viewport, erros);
      }
      await navegador.close();
    }
    if (args.includes("--video")) await video(servidor.url, erros);
  } finally {
    await servidor.fechar();
  }
  if (erros.length) {
    console.error(erros.join("\n"));
    process.exit(1);
  }
  console.log("Quadros em capturas/05-quadros; sem erro de console.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
