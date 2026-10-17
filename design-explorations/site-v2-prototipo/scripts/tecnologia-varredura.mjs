/* Tecnologia · varredura de telas vazias (rode depois do build). Rola a página inteira
   em passos de meia tela, fotografa cada parada (espera 1,2 s) e mede quanto da tela, abaixo
   do header, é "desenho": a fração de pixels com contraste local (diferença de luminância
   para o vizinho da direita ou de baixo) acima de 24. Fundo chapado e gradiente longo dão
   ~0; texto, traço e foto dão contraste. Abaixo de 0,5% a parada é "vazia" (o mesmo limite
   calibrado em Incorporadoras). Saídas em
   capturas/tecnologia-varredura/<navegador>-<largura>-<nnn>.png.
   Sai com código 1 se houver tela vazia ou erro de console/página.
   Opções: --navegador chromium|firefox, --largura 1440|390. */
import { chromium, firefox } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "../serve.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const PASTA = join(RAIZ, "capturas", "tecnologia-varredura");
const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
];
const NAVEGADORES = { chromium, firefox };
const ARGS = { chromium: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"], firefox: [] };
const LIMITE_VAZIA = 0.005;

function lerArgs(argv) {
  const args = { navegadores: [], larguras: [] };
  const fila = [...argv];
  while (fila.length) {
    const opcao = fila.shift();
    if (opcao === "--navegador") args.navegadores.push(fila.shift());
    else if (opcao === "--largura") args.larguras.push(Number(fila.shift()));
    else throw new Error(`Opção desconhecida: ${opcao}`);
  }
  return args;
}

/** Fração da tela, abaixo do header, com contraste local acima de 24 (luminância 0–255). */
function medirDesenho(pagina, png) {
  return pagina.evaluate(async (dados) => {
    const cab = document.querySelector("[data-cabecalho]")?.getBoundingClientRect().bottom ?? 0;
    const img = new Image();
    img.src = `data:image/png;base64,${dados}`;
    await img.decode();
    const topo = Math.round(cab * (img.height / window.innerHeight));
    const w = img.width;
    const h = img.height - topo;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("sem canvas 2d");
    ctx.drawImage(img, 0, topo, w, h, 0, 0, w, h);
    const px = ctx.getImageData(0, 0, w, h).data;
    const lum = new Float32Array(w * h);
    for (let i = 0; i < w * h; i += 1) {
      lum[i] = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
    }
    let marcados = 0;
    for (let y = 0; y < h - 1; y += 1) {
      for (let x = 0; x < w - 1; x += 1) {
        const i = y * w + x;
        if (Math.max(Math.abs(lum[i] - lum[i + 1]), Math.abs(lum[i] - lum[i + w])) > 24) {
          marcados += 1;
        }
      }
    }
    return marcados / ((w - 1) * (h - 1));
  }, png.toString("base64"));
}

async function varrer(navegador, nome, url, viewport, erros) {
  const contexto = await navegador.newContext({ viewport });
  const pagina = await contexto.newPage();
  const rotulo = `${nome}-${viewport.width}`;
  pagina.on("console", (m) => m.type() === "error" && erros.push(`${rotulo} console: ${m.text()}`));
  pagina.on("pageerror", (e) => erros.push(`${rotulo} página: ${e.message}`));
  await pagina.goto(url, { waitUntil: "load" });
  await pagina.waitForFunction(() => document.documentElement.classList.contains("motion"));
  await pagina.waitForTimeout(1500);
  const total = await pagina.evaluate(() => document.documentElement.scrollHeight);
  const vazias = [];
  const passo = Math.round(viewport.height / 2);
  for (let y = 0, n = 0; y < total - viewport.height / 2; y += passo, n += 1) {
    await pagina.evaluate((v) => window.scrollTo(0, v), y);
    await pagina.waitForTimeout(600);
    await pagina.evaluate((v) => window.scrollTo(0, v), y);
    await pagina.waitForTimeout(1200);
    const png = await pagina.screenshot({
      path: join(PASTA, `${rotulo}-${String(n).padStart(3, "0")}.png`),
    });
    const desenho = await medirDesenho(pagina, png);
    if (desenho < LIMITE_VAZIA) {
      vazias.push(`${rotulo} y=${y}: só ${(desenho * 100).toFixed(2)}% da tela com desenho`);
    }
  }
  await contexto.close();
  console.log(`  ${rotulo}: ${Math.ceil(total / passo)} paradas, ${vazias.length} vazia(s)`);
  return vazias;
}

async function main() {
  const args = lerArgs(process.argv.slice(2));
  mkdirSync(PASTA, { recursive: true });
  const servidor = await servir();
  const url = new URL("tecnologia.html", servidor.url).href;
  const erros = [];
  const vazias = [];
  try {
    const nomes = args.navegadores.length ? args.navegadores : Object.keys(NAVEGADORES);
    const larguras = args.larguras.length ? args.larguras : VIEWPORTS.map((v) => v.width);
    for (const nome of nomes) {
      const navegador = await NAVEGADORES[nome].launch({ args: ARGS[nome] });
      try {
        for (const viewport of VIEWPORTS.filter((v) => larguras.includes(v.width))) {
          vazias.push(...(await varrer(navegador, nome, url, viewport, erros)));
        }
      } finally {
        await navegador.close();
      }
    }
  } finally {
    await servidor.fechar();
  }
  const tudo = [...erros, ...vazias.map((v) => `tela vazia: ${v}`)];
  if (tudo.length) {
    console.error(`\n${tudo.length} problema(s):\n  ${tudo.join("\n  ")}`);
    process.exit(1);
  }
  console.log("\nNenhuma tela vazia e nenhum erro de console/página.");
}

main().catch((erro) => {
  console.error(erro?.stack ?? String(erro));
  process.exit(1);
});
