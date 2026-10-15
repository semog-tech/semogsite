/* Navegação entre as páginas, âncoras, recarga no meio e coerência do pin da história
   (rode depois do build). Por HTTP e por file://, em Chromium e Firefox, 1440×900:
   - home → "A Semog" (header) → logo → home → "A Semog" (rodapé) → "Unidades" (header,
     index.html#unidades): cada página abre com o <main data-pagina> certo, sem erro;
   - semog.html#historia, #principios, #pessoas, #depoimentos, #assembleia,
     #proposta: a seção fica sob o
     header (folga de 12px);
   - recarga com a página rolada até o meio do pin: sem erro, e a página remonta;
   - em cada patamar do pin, o ano grande e o marco visível batem com src/conteudo.json.
   Sai com código 1 se algo falhar. Opções: --navegador chromium|firefox, --so-http, --so-file. */
import { chromium, firefox } from "playwright";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { servir } from "../serve.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const NAVEGADORES = { chromium, firefox };
const ARGS = { chromium: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"], firefox: [] };
const CONTEUDO = JSON.parse(readFileSync(join(RAIZ, "src", "conteudo.json"), "utf8"));
const MARCOS = CONTEUDO.aSemog.historia.marcos;
/** Igual a scenes/semog/02-historia.js: patamar inicial, passo, cobertura e cauda (1 tela). */
const RITMO = { inicial: 0.55, passo: 1, total: 0.55 + 9 + 0.75 + 1 / 0.72 };
const FOLGA_ANCORA = 12;

function lerArgs(argv) {
  const args = { navegadores: [], http: true, file: true };
  const fila = [...argv];
  while (fila.length) {
    const opcao = fila.shift();
    if (opcao === "--navegador") args.navegadores.push(fila.shift());
    else if (opcao === "--so-http") args.file = false;
    else if (opcao === "--so-file") args.http = false;
    else throw new Error(`Opção desconhecida: ${opcao}`);
  }
  return args;
}

async function esperarPronta(pagina, id) {
  await pagina.waitForFunction(
    (esperado) =>
      document.documentElement.classList.contains("motion") &&
      document.querySelector("main")?.dataset.pagina === esperado,
    id,
    { timeout: 10000 },
  );
  await pagina.waitForTimeout(1200);
}

/** Clica e espera a outra página montar. */
async function clicarEIr(pagina, seletor, id) {
  await Promise.all([pagina.waitForEvent("load"), pagina.click(seletor)]);
  await esperarPronta(pagina, id);
}

async function topoDe(pagina, id) {
  return pagina.evaluate((alvo) => {
    const el = document.getElementById(alvo);
    if (!el) throw new Error(`#${alvo} ausente`);
    const cab = document.querySelector("[data-cabecalho]")?.getBoundingClientRect().bottom ?? 0;
    return Math.round(el.getBoundingClientRect().top - cab);
  }, id);
}

async function navegar(pagina, base, falhas) {
  await pagina.goto(`${base}index.html`, { waitUntil: "load" });
  await esperarPronta(pagina, "home");
  await clicarEIr(pagina, '.nav a[data-pagina-link="semog"]', "semog");
  const atual = await pagina.getAttribute('.nav a[data-pagina-link="semog"]', "aria-current");
  if (atual !== "page") falhas.push(`link "A Semog" sem aria-current na própria página`);
  await clicarEIr(pagina, ".cabecalho .marca", "home");
  await pagina.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await pagina.waitForTimeout(1500);
  await clicarEIr(pagina, '.rodape a[href="semog.html"]', "semog");
  await clicarEIr(pagina, '.nav a[href="index.html#unidades"]', "home");
  await pagina.waitForTimeout(1500);
  const distancia = await topoDe(pagina, "unidades");
  if (Math.abs(distancia) > FOLGA_ANCORA) {
    falhas.push(`index.html#unidades a partir de A Semog: seção a ${distancia}px do header`);
  }
}

async function ancoras(pagina, base, falhas) {
  for (const id of ["historia", "principios", "pessoas", "depoimentos", "assembleia", "proposta"]) {
    await pagina.goto(`${base}semog.html#${id}`, { waitUntil: "load" });
    await esperarPronta(pagina, "semog");
    await pagina.waitForTimeout(1200);
    const distancia = await topoDe(pagina, id);
    if (Math.abs(distancia) > FOLGA_ANCORA) {
      falhas.push(`semog.html#${id}: seção a ${distancia}px do header`);
    }
  }
}

/** Início e distância do pin (o pin-spacer tem a altura do palco + distância). */
function medirPin(pagina) {
  return pagina.evaluate(() => {
    const espaco = document.querySelector("#historia .hist-palco")?.parentElement;
    if (!espaco?.classList.contains("pin-spacer")) throw new Error("História sem pin-spacer.");
    const inicio = espaco.getBoundingClientRect().top + window.scrollY;
    return { inicio, distancia: espaco.offsetHeight - window.innerHeight };
  });
}

async function irPara(pagina, y) {
  await pagina.evaluate((v) => window.scrollTo(0, v), y);
  await pagina.waitForTimeout(700);
  await pagina.evaluate((v) => window.scrollTo(0, v), y);
  await pagina.waitForTimeout(1500);
}

/** O que o palco mostra: ano grande (ou "Hoje") e o título do marco que está no lugar. */
function lerPalco(pagina) {
  return pagina.evaluate(() => {
    const visivel = (el) => {
      const caixa = el.getBoundingClientRect();
      const mascara = el.parentElement?.getBoundingClientRect();
      return mascara && Math.abs(caixa.top - mascara.top) < 4;
    };
    const hoje = document.querySelector(".hist-ano-hoje");
    const numero = document.querySelector(".hist-ano-numero");
    const ano = hoje && visivel(hoje) ? hoje.textContent?.trim() : numero?.textContent?.trim();
    const titulos = [...document.querySelectorAll(".hist-marco-titulo .hist-in")]
      .filter(visivel)
      .map((el) => el.textContent?.trim());
    return { ano, titulos };
  });
}

async function patamares(pagina, falhas, rotulo) {
  const { inicio, distancia } = await medirPin(pagina);
  for (let i = 0; i < MARCOS.length; i += 1) {
    const t = i === 0 ? 0.25 : RITMO.inicial + (i - 1) * RITMO.passo + 0.75;
    await irPara(pagina, Math.round(inicio + (distancia * t) / RITMO.total));
    const { ano, titulos } = await lerPalco(pagina);
    const esperado = MARCOS[i];
    if (ano !== esperado.data || titulos.length !== 1 || titulos[0] !== esperado.titulo) {
      falhas.push(
        `${rotulo} patamar ${i}: mostra ${ano} / ${JSON.stringify(titulos)}, esperado ${esperado.data} / ${esperado.titulo}`,
      );
    }
  }
}

async function recargaNoMeio(pagina, base, falhas, rotulo) {
  await pagina.goto(`${base}semog.html`, { waitUntil: "load" });
  await esperarPronta(pagina, "semog");
  const { inicio, distancia } = await medirPin(pagina);
  await irPara(pagina, Math.round(inicio + distancia / 2));
  await pagina.reload({ waitUntil: "load" });
  await esperarPronta(pagina, "semog");
  // Depois da recarga, onde quer que ela pouse, o palco precisa estar coerente.
  const { titulos } = await lerPalco(pagina);
  if (titulos.length > 1) falhas.push(`${rotulo} recarga: dois marcos ao mesmo tempo`);
  await patamares(pagina, falhas, `${rotulo} após recarga`);
}

async function rodar(nome, base, rotulo) {
  const navegador = await NAVEGADORES[nome].launch({ args: ARGS[nome] });
  const falhas = [];
  try {
    const contexto = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
    const pagina = await contexto.newPage();
    pagina.on("console", (m) => m.type() === "error" && falhas.push(`console: ${m.text()}`));
    pagina.on("pageerror", (e) => falhas.push(`página: ${e.message}`));
    await navegar(pagina, base, falhas);
    await ancoras(pagina, base, falhas);
    await recargaNoMeio(pagina, base, falhas, rotulo);
    await contexto.close();
  } finally {
    await navegador.close();
  }
  console.log(`  ${rotulo}: ${falhas.length ? `${falhas.length} falha(s)` : "ok"}`);
  return falhas.map((f) => `[${rotulo}] ${f}`);
}

async function main() {
  const args = lerArgs(process.argv.slice(2));
  const nomes = args.navegadores.length ? args.navegadores : Object.keys(NAVEGADORES);
  const servidor = args.http ? await servir() : null;
  const bases = [];
  if (servidor) bases.push(["http", servidor.url]);
  if (args.file) bases.push(["file", pathToFileURL(join(RAIZ, "dist")).href + "/"]);
  const falhas = [];
  try {
    for (const nome of nomes) {
      for (const [modo, base] of bases)
        falhas.push(...(await rodar(nome, base, `${nome} ${modo}`)));
    }
  } finally {
    await servidor?.fechar();
  }
  if (falhas.length) {
    console.error(`\n${falhas.length} falha(s):\n  ${falhas.join("\n  ")}`);
    process.exit(1);
  }
  console.log("\nNavegação, âncoras, recarga e patamares do pin: tudo certo.");
}

main().catch((erro) => {
  console.error(erro?.stack ?? String(erro));
  process.exit(1);
});
