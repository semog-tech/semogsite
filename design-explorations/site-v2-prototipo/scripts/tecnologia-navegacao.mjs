/* Tecnologia · navegação entre as quatro páginas, âncoras, recarga no meio e coerência do pin
   do mês (rode depois do build). Por HTTP e por file://, em Chromium e Firefox, 1440×900:
   - home → "Tecnologia" (header, com aria-current na própria página) → "A Semog" (header) →
     "Incorporadoras" (header) → "Tecnologia" (rodapé) → logo → home → "Tecnologia" (menu do
     celular, aberto pelo botão) → "Unidades" (index.html#unidades): cada página abre com o
     <main data-pagina> certo, sem erro;
   - tecnologia.html#mes, #evolucao, #conferencia, #proposta: a seção fica sob o header;
   - "Ver o mês" e "Pedir proposta" da abertura levam às suas seções;
   - recarga com a página rolada até o meio do pin: sem erro, e a página remonta;
   - em cada patamar do pin, o momento visível bate com src/conteudo.json, as casas abertas
     são as dos dias até o momento e o traço chegou ao dia do momento (e não passou dele).
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
const MOMENTOS = CONTEUDO.tecnologia.pagina.mes.momentos;
/** Igual a scenes/tecnologia/02-mes.js: patamar inicial, passo, saída, cobertura e cauda. */
const TELAS_POR_UNIDADE = 0.85;
const COBRIR = 0.55;
const RITMO = {
  inicial: 0.6,
  passo: 1,
  total: 0.6 + 5 + 0.45 + COBRIR + (0.45 / TELAS_POR_UNIDADE - 0.7 * COBRIR),
};
/** Dia de cada momento e as casas que precisam estar abertas no patamar dele. */
const DIAS = [0, 1, 9, 23, 26, 30];
const CASAS = [1, 10, 13, 17, 21, 23, 26, 30];
const FOLGA_ANCORA = 12;
const SECOES = ["mes", "evolucao", "conferencia", "proposta"];

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
  const link = '.nav a[data-pagina-link="tecnologia"]';
  await pagina.goto(`${base}index.html`, { waitUntil: "load" });
  await esperarPronta(pagina, "home");
  await clicarEIr(pagina, link, "tecnologia");
  if ((await pagina.getAttribute(link, "aria-current")) !== "page") {
    falhas.push(`link "Tecnologia" sem aria-current na própria página`);
  }
  await clicarEIr(pagina, '.nav a[data-pagina-link="semog"]', "semog");
  if (await pagina.getAttribute(link, "aria-current")) {
    falhas.push(`link "Tecnologia" com aria-current em A Semog`);
  }
  await clicarEIr(pagina, '.nav a[data-pagina-link="incorporadoras"]', "incorporadoras");
  await pagina.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await pagina.waitForTimeout(1500);
  await clicarEIr(pagina, '.rodape a[href="tecnologia.html"]', "tecnologia");
  await clicarEIr(pagina, ".cabecalho .marca", "home");
  await pagina.setViewportSize({ width: 390, height: 844 });
  await pagina.click("[data-menu]");
  await pagina.waitForTimeout(400);
  await clicarEIr(pagina, '.painel-menu a[data-pagina-link="tecnologia"]', "tecnologia");
  await pagina.setViewportSize({ width: 1440, height: 900 });
  await pagina.waitForTimeout(800);
  await clicarEIr(pagina, '.nav a[href="index.html#unidades"]', "home");
  await pagina.waitForTimeout(1500);
  const distancia = await topoDe(pagina, "unidades");
  if (Math.abs(distancia) > FOLGA_ANCORA) {
    falhas.push(`index.html#unidades a partir de Tecnologia: seção a ${distancia}px do header`);
  }
}

async function ancoras(pagina, base, falhas) {
  for (const id of SECOES) {
    await pagina.goto(`${base}tecnologia.html#${id}`, { waitUntil: "load" });
    await esperarPronta(pagina, "tecnologia");
    await pagina.waitForTimeout(1200);
    const distancia = await topoDe(pagina, id);
    if (Math.abs(distancia) > FOLGA_ANCORA) {
      falhas.push(`tecnologia.html#${id}: seção a ${distancia}px do header`);
    }
  }
}

async function linksDaAbertura(pagina, base, falhas) {
  for (const [seletor, id] of [
    ['#semog-one .so-acoes a[href="#mes"]', "mes"],
    ['#semog-one .so-acoes a[href="#proposta"]', "proposta"],
  ]) {
    await pagina.goto(`${base}tecnologia.html`, { waitUntil: "load" });
    await esperarPronta(pagina, "tecnologia");
    await pagina.click(seletor);
    await pagina.waitForTimeout(3000);
    const distancia = await topoDe(pagina, id);
    if (Math.abs(distancia) > FOLGA_ANCORA) {
      falhas.push(`link da abertura para #${id}: seção a ${distancia}px do header`);
    }
  }
}

function medirPin(pagina) {
  return pagina.evaluate(() => {
    const espaco = document.querySelector("#mes .ms-palco")?.parentElement;
    if (!espaco?.classList.contains("pin-spacer")) throw new Error("Mês sem pin-spacer.");
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

/**
 * O que o palco mostra: os títulos de momento no lugar, as casas abertas (fundo em escala
 * cheia) e o último dia cujo nó está aceso.
 */
function lerPalco(pagina) {
  return pagina.evaluate(() => {
    const noLugar = (el) => {
      const caixa = el.getBoundingClientRect();
      const mascara = el.parentElement?.getBoundingClientRect();
      return mascara && Math.abs(caixa.top - mascara.top) < 4;
    };
    const titulos = [...document.querySelectorAll(".ms-momento-titulo .ms-in")]
      .filter(noLugar)
      .map((el) => el.textContent?.trim());
    const casas = [...document.querySelectorAll(".ms-celula")]
      .filter((g) => g.querySelector("rect").getBoundingClientRect().height > 20)
      .map((g) => Number(g.getAttribute("data-dia")))
      .sort((p, q) => p - q);
    const acesos = [...document.querySelectorAll(".ms-no")]
      .filter((n) => n.getBoundingClientRect().width > 3)
      .map((n) => Number(n.getAttribute("data-dia")));
    return { titulos, casas, ultimoDia: acesos.length ? Math.max(...acesos) : 0 };
  });
}

async function patamares(pagina, falhas, rotulo) {
  const { inicio, distancia } = await medirPin(pagina);
  for (let i = 0; i < MOMENTOS.length; i += 1) {
    const t = i === 0 ? 0.3 : RITMO.inicial + (i - 1) * RITMO.passo + 0.8;
    await irPara(pagina, Math.round(inicio + (distancia * t) / RITMO.total));
    const { titulos, casas, ultimoDia } = await lerPalco(pagina);
    const esperado = MOMENTOS[i].titulo;
    const casasEsperadas = CASAS.filter((d) => d <= DIAS[i]);
    const problemas = [];
    if (titulos.length !== 1 || titulos[0] !== esperado) {
      problemas.push(`títulos ${JSON.stringify(titulos)}, esperado ${esperado}`);
    }
    if (JSON.stringify(casas) !== JSON.stringify(casasEsperadas)) {
      problemas.push(
        `casas abertas ${JSON.stringify(casas)}, esperado ${JSON.stringify(casasEsperadas)}`,
      );
    }
    if (ultimoDia !== DIAS[i]) problemas.push(`traço no dia ${ultimoDia}, esperado ${DIAS[i]}`);
    if (problemas.length) falhas.push(`${rotulo} patamar ${i}: ${problemas.join("; ")}`);
  }
}

async function recargaNoMeio(pagina, base, falhas, rotulo) {
  await pagina.goto(`${base}tecnologia.html`, { waitUntil: "load" });
  await esperarPronta(pagina, "tecnologia");
  const { inicio, distancia } = await medirPin(pagina);
  await irPara(pagina, Math.round(inicio + distancia / 2));
  await pagina.reload({ waitUntil: "load" });
  await esperarPronta(pagina, "tecnologia");
  await pagina.waitForTimeout(1500);
  const { titulos } = await lerPalco(pagina);
  if (titulos.length !== 1) {
    falhas.push(
      `${rotulo} recarga: ${titulos.length} momentos ao mesmo tempo ${JSON.stringify(titulos)}`,
    );
  }
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
    await linksDaAbertura(pagina, base, falhas);
    await pagina.goto(`${base}tecnologia.html`, { waitUntil: "load" });
    await esperarPronta(pagina, "tecnologia");
    await patamares(pagina, falhas, rotulo);
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
  console.log("\nNavegação, âncoras, links, recarga e patamares do mês: tudo certo.");
}

main().catch((erro) => {
  console.error(erro?.stack ?? String(erro));
  process.exit(1);
});
