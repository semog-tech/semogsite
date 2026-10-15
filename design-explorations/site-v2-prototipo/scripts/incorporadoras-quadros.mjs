/* Incorporadoras · quadros ao longo do pin do percurso, emendas entre cenas e vídeo de
   leitura (rode depois do build). Saídas em capturas/incorporadoras-quadros/:
     <navegador>-<largura>-pin-<nn>.png   a cada 5% do pin do #percurso (espera 1,2 s)
     <navegador>-<largura>-emenda-<a>-<b>.png  e um relatório das linhas de pixel das junções
     video-<largura>.webm                 Chromium, rolagem contínua da página inteira
   Sai com código 1 se houver erro de console/página ou degrau de cor numa junção.
   Opções: --navegador chromium|firefox, --sem-video, --so-video, --largura 1440|390. */
import { chromium, firefox } from "playwright";
import { mkdirSync, renameSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "../serve.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const PASTA = join(RAIZ, "capturas", "incorporadoras-quadros");
const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
];
const NAVEGADORES = { chromium, firefox };
const ARGS = { chromium: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"], firefox: [] };
/** Junções a medir: [cena de cima, cena de baixo]. */
const EMENDAS = [
  ["incorporadoras", "convivencia"],
  ["convivencia", "percurso"],
  ["percurso", "ganhos"],
  ["ganhos", "instalacao"],
  ["instalacao", "lancamento"],
  ["lancamento", "proposta"],
];
/** Diferença máxima (0–255 por canal) entre a linha de cima e a de baixo de uma junção,
    no percentil 90 das faixas: um degrau só na coluna de 38,2% ainda aparece. */
const DEGRAU_MAXIMO = 6;

function lerArgs(argv) {
  const args = { navegadores: [], video: true, quadros: true, larguras: [] };
  const fila = [...argv];
  while (fila.length) {
    const opcao = fila.shift();
    if (opcao === "--sem-video") args.video = false;
    else if (opcao === "--so-video") args.quadros = false;
    else if (opcao === "--navegador") args.navegadores.push(fila.shift());
    else if (opcao === "--largura") args.larguras.push(Number(fila.shift()));
    else throw new Error(`Opção desconhecida: ${opcao}`);
  }
  return args;
}

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

/** Rola até y (o Lenis ainda corre depois do scrollTo: corrige e espera). */
async function irPara(pagina, y, espera) {
  await pagina.evaluate((v) => window.scrollTo(0, v), y);
  await pagina.waitForTimeout(700);
  await pagina.evaluate((v) => window.scrollTo(0, v), y);
  await pagina.waitForTimeout(espera);
}

/** Início e distância do pin do percurso (o pin-spacer tem a altura do palco + distância). */
function medirPin(pagina) {
  return pagina.evaluate(() => {
    const palco = document.querySelector("#percurso .pc-palco");
    const espaco = palco?.parentElement;
    if (!espaco?.classList.contains("pin-spacer")) throw new Error("Percurso sem pin-spacer.");
    const inicio = espaco.getBoundingClientRect().top + window.scrollY;
    return { inicio, distancia: espaco.offsetHeight - window.innerHeight };
  });
}

async function quadrosDoPin(pagina, prefixo) {
  const { inicio, distancia } = await medirPin(pagina);
  for (let i = 0; i <= 20; i += 1) {
    await irPara(pagina, Math.round(inicio + (distancia * i) / 20), 1200);
    const nome = `${prefixo}-pin-${String(i * 5).padStart(3, "0")}.png`;
    await pagina.screenshot({ path: join(PASTA, nome) });
  }
}

/**
 * Para cada junção: rola até ela ficar no meio da tela, fotografa e compara as linhas de
 * pixel logo acima e logo abaixo, em 40 faixas verticais (percentil 90: tolera um traço
 * de texto que cruze a linha, não um degrau de cor numa coluna inteira).
 */
async function emendas(pagina, prefixo) {
  const problemas = [];
  for (const [a, b] of EMENDAS) {
    const y = await pagina.evaluate((id) => {
      const el = document.getElementById(id);
      if (!el) throw new Error(`#${id} ausente`);
      return el.getBoundingClientRect().top + window.scrollY;
    }, b);
    const meio = Math.round(y - (await pagina.evaluate(() => window.innerHeight)) / 2);
    await irPara(pagina, meio, 1400);
    const arquivo = join(PASTA, `${prefixo}-emenda-${a}-${b}.png`);
    await pagina.screenshot({ path: arquivo });
    const medida = await pagina.evaluate(async (id) => {
      const topo = Math.round(document.getElementById(id).getBoundingClientRect().top);
      return { topo, alto: window.innerHeight, largo: window.innerWidth };
    }, b);
    const degrau = await compararLinhas(pagina, arquivo, medida);
    const texto = `${prefixo} ${a}→${b}: junção em y=${medida.topo}, degrau (p90) ${degrau}`;
    console.log(`  ${texto}`);
    if (degrau > DEGRAU_MAXIMO) problemas.push(texto);
  }
  return problemas;
}

/** Lê o PNG num canvas da própria página e mede a diferença entre y-3 e y+3. */
async function compararLinhas(pagina, arquivo, { topo, largo }) {
  const { readFileSync } = await import("node:fs");
  const dados = readFileSync(arquivo).toString("base64");
  return pagina.evaluate(
    async ({ dados, topo, largo }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${dados}`;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext("2d");
      if (!ctx) throw new Error("sem canvas 2d");
      ctx.drawImage(img, 0, 0);
      const escala = img.width / largo;
      const y = Math.round(topo * escala);
      const cima = ctx.getImageData(0, Math.max(0, y - 3), img.width, 1).data;
      const baixo = ctx.getImageData(0, Math.min(img.height - 1, y + 3), img.width, 1).data;
      const faixas = [];
      const passo = Math.max(4, Math.floor(img.width / 40));
      for (let x = 0; x < img.width; x += passo) {
        const i = x * 4;
        faixas.push(
          Math.max(
            Math.abs(cima[i] - baixo[i]),
            Math.abs(cima[i + 1] - baixo[i + 1]),
            Math.abs(cima[i + 2] - baixo[i + 2]),
          ),
        );
      }
      faixas.sort((p, q) => p - q);
      return faixas[Math.floor(faixas.length * 0.9)];
    },
    { dados, topo, largo },
  );
}

async function gravarVideo(url, largura, erros) {
  const viewport = VIEWPORTS.find((v) => v.width === largura) ?? VIEWPORTS[0];
  const pastaVideo = join(PASTA, `video-tmp-${largura}`);
  const navegador = await chromium.launch({ args: ARGS.chromium });
  try {
    const contexto = await navegador.newContext({
      viewport,
      recordVideo: { dir: pastaVideo, size: viewport },
    });
    const pagina = await abrir(contexto, url, `video ${largura}`, erros);
    await pagina.waitForTimeout(2500);
    const total = await pagina.evaluate(() => document.documentElement.scrollHeight);
    // Velocidade de leitura: ~ uma tela a cada 2,4 s (roda do mouse, o caminho do Lenis).
    await pagina.mouse.move(viewport.width / 2, viewport.height / 2);
    for (let y = 0; y < total; y += 120) {
      await pagina.mouse.wheel(0, 120);
      await pagina.waitForTimeout(Math.round((2400 * 120) / viewport.height));
    }
    await pagina.waitForTimeout(1500);
    const video = pagina.video();
    await contexto.close();
    if (!video) throw new Error("vídeo não gravado");
    renameSync(await video.path(), join(PASTA, `video-${largura}.webm`));
  } finally {
    await navegador.close();
    rmSync(pastaVideo, { recursive: true, force: true });
  }
}

async function main() {
  const args = lerArgs(process.argv.slice(2));
  mkdirSync(PASTA, { recursive: true });
  const servidor = await servir();
  const url = new URL("incorporadoras.html", servidor.url).href;
  const erros = [];
  const problemas = [];
  try {
    const nomes = args.navegadores.length ? args.navegadores : Object.keys(NAVEGADORES);
    const larguras = args.larguras.length ? args.larguras : VIEWPORTS.map((v) => v.width);
    if (args.quadros) {
      for (const nome of nomes) {
        const navegador = await NAVEGADORES[nome].launch({ args: ARGS[nome] });
        try {
          for (const viewport of VIEWPORTS.filter((v) => larguras.includes(v.width))) {
            const contexto = await navegador.newContext({ viewport });
            const prefixo = `${nome}-${viewport.width}`;
            const pagina = await abrir(contexto, url, prefixo, erros);
            await quadrosDoPin(pagina, prefixo);
            problemas.push(...(await emendas(pagina, prefixo)));
            await contexto.close();
            console.log(`  ${prefixo}: quadros e emendas prontos`);
          }
        } finally {
          await navegador.close();
        }
      }
    }
    if (args.video) {
      for (const largura of larguras) await gravarVideo(url, largura, erros);
      console.log("  vídeos prontos");
    }
  } finally {
    await servidor.fechar();
  }
  const tudo = [...erros, ...problemas.map((p) => `degrau: ${p}`)];
  if (tudo.length) {
    console.error(`\n${tudo.length} problema(s):\n  ${tudo.join("\n  ")}`);
    process.exit(1);
  }
  console.log("\nSem erro de console/página e sem degrau nas junções.");
}

main().catch((erro) => {
  console.error(erro?.stack ?? String(erro));
  process.exit(1);
});
