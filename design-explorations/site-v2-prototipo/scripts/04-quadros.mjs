/* Quadros e vídeo da cena 04 (tecnologia), que vive num pin longo.
   Rode depois do build. Rola até frações do pin e salva um print por fração:
     capturas/04-quadros/<navegador>-<largura>-<pp>.png
   Com --video, grava capturas/04-video.webm (1440×900, Chromium) rolando a cena em
   velocidade de leitura. Sai com código 1 se houver erro de console, de página ou de rede,
   ou scroll horizontal.
     --navegador chromium|firefox (padrão: os dois)   --largura 1440|390 (padrão: as duas)
     --passo 0.08 (fração do pin entre quadros)        --video (só o vídeo) */
import { chromium, firefox } from "playwright";
import { mkdirSync, renameSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "../serve.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const PASTA = join(RAIZ, "capturas", "04-quadros");
const NAVEGADORES = { chromium, firefox };
const ALTURAS = { 1440: 900, 390: 844 };
/** WebGL por software no Chromium headless (as outras cenas usam WebGL). */
const OPCOES = {
  chromium: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] },
  firefox: {},
};

function lerArgs(argv) {
  const args = { navegadores: [], larguras: [], passo: 0.05, video: false };
  const fila = [...argv];
  while (fila.length) {
    const opcao = fila.shift();
    if (opcao === "--video") {
      args.video = true;
      continue;
    }
    const valor = fila.shift();
    if (valor === undefined) throw new Error(`Falta o valor de ${opcao}.`);
    if (opcao === "--navegador") args.navegadores.push(valor);
    else if (opcao === "--largura") args.larguras.push(Number(valor));
    else if (opcao === "--passo") args.passo = Number(valor);
    else throw new Error(`Opção desconhecida: ${opcao}`);
  }
  return args;
}

function ouvirErros(pagina) {
  const erros = [];
  pagina.on("console", (msg) => {
    if (msg.type() === "error") erros.push(`console: ${msg.text()}`);
  });
  pagina.on("pageerror", (erro) => erros.push(`página: ${erro.message}`));
  pagina.on("requestfailed", (req) => erros.push(`requisição: ${req.url()}`));
  return erros;
}

/** Início e extensão do pin da cena, em px de rolagem. */
function medirPin(pagina) {
  return pagina.evaluate(() => {
    const palco = document.querySelector("#tecnologia .tec-palco");
    const espaco = palco?.parentElement;
    if (!palco || !espaco?.classList.contains("pin-spacer")) throw new Error("Pin não montado.");
    const inicio = espaco.getBoundingClientRect().top + window.scrollY;
    return { inicio, extensao: espaco.offsetHeight - window.innerHeight };
  });
}

async function rolar(pagina, y) {
  await pagina.evaluate((alvo) => window.scrollTo(0, alvo), y);
  await pagina.waitForTimeout(900);
  await pagina.evaluate((alvo) => window.scrollTo(0, alvo), y);
  await pagina.waitForTimeout(1300);
}

async function abrir(navegador, url, viewport, video) {
  const contexto = await navegador.newContext({
    viewport,
    ...(video ? { recordVideo: { dir: PASTA, size: viewport } } : {}),
  });
  const pagina = await contexto.newPage();
  const erros = ouvirErros(pagina);
  await pagina.goto(url, { waitUntil: "load" });
  await pagina.waitForFunction(() => document.documentElement.classList.contains("motion"));
  return { contexto, pagina, erros };
}

async function quadros(navegador, nome, url, largura, passo) {
  const { contexto, pagina, erros } = await abrir(navegador, url, {
    width: largura,
    height: ALTURAS[largura],
  });
  try {
    const pin = await medirPin(pagina);
    await rolar(pagina, pin.inicio - ALTURAS[largura] * 0.5);
    await pagina.screenshot({ path: join(PASTA, `${nome}-${largura}-antes.png`) });
    for (let f = 0; f <= 1.0001; f += passo) {
      await rolar(pagina, pin.inicio + pin.extensao * Math.min(1, f));
      const pp = String(Math.round(f * 100)).padStart(3, "0");
      await pagina.screenshot({ path: join(PASTA, `${nome}-${largura}-${pp}.png`) });
    }
    // Saída: o palco se esvazia enquanto a seção sai da tela.
    for (const fracao of [0.25, 0.5, 0.75]) {
      await rolar(pagina, pin.inicio + pin.extensao + ALTURAS[largura] * fracao);
      const nome2 = `${nome}-${largura}-depois-${Math.round(fracao * 100)}.png`;
      await pagina.screenshot({ path: join(PASTA, nome2) });
    }
    const horizontal = await pagina.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    if (horizontal) erros.push("scroll horizontal");
    console.log(`  ${nome} ${largura}: quadros salvos`);
  } finally {
    await contexto.close();
  }
  return erros.map((e) => `[${nome} ${largura}] ${e}`);
}

/** Rola a cena inteira em velocidade de leitura (rodinha, passos curtos). */
async function video(url) {
  const navegador = await chromium.launch(OPCOES.chromium);
  const { contexto, pagina, erros } = await abrir(
    navegador,
    url,
    { width: 1440, height: 900 },
    true,
  );
  try {
    const pin = await medirPin(pagina);
    await pagina.evaluate((y) => window.scrollTo(0, y), pin.inicio - 900);
    await pagina.waitForTimeout(1200);
    await pagina.mouse.move(720, 450);
    const total = pin.extensao + 1800;
    for (let feito = 0; feito < total; feito += 60) {
      await pagina.mouse.wheel(0, 60);
      await pagina.waitForTimeout(70);
    }
    await pagina.waitForTimeout(1500);
  } finally {
    const gravado = await pagina.video()?.path();
    await contexto.close();
    await navegador.close();
    if (gravado) renameSync(gravado, join(RAIZ, "capturas", "04-video.webm"));
  }
  return erros;
}

async function main() {
  const args = lerArgs(process.argv.slice(2));
  mkdirSync(PASTA, { recursive: true });
  const servidor = await servir();
  const problemas = [];
  try {
    if (args.video) {
      problemas.push(...(await video(servidor.url)));
    } else {
      const nomes = args.navegadores.length ? args.navegadores : Object.keys(NAVEGADORES);
      const larguras = args.larguras.length ? args.larguras : [1440, 390];
      for (const nome of nomes) {
        const navegador = await NAVEGADORES[nome].launch(OPCOES[nome]);
        try {
          for (const largura of larguras) {
            problemas.push(...(await quadros(navegador, nome, servidor.url, largura, args.passo)));
          }
        } finally {
          await navegador.close();
        }
      }
    }
  } finally {
    await servidor.fechar();
  }
  if (problemas.length) {
    console.error(`\n${problemas.length} problema(s):\n  ${problemas.join("\n  ")}`);
    process.exit(1);
  }
  console.log("\nSem erro de console, de página, de rede nem scroll horizontal.");
}

main().catch((erro) => {
  console.error(`\nFalhou: ${erro?.stack ?? String(erro)}`);
  process.exit(1);
});
