/* Gestão · navegação entre as páginas, âncoras, recarga no meio e coerência do pin da mesa do
   síndico (rode depois do build). Por HTTP e por file://, em Chromium e Firefox, 1440×900:
   - home → "Gestão" (header, com aria-current na própria página) → "A Semog" (header) →
     "Incorporadoras" (header) → "Gestão completa" (rodapé) → logo → home → "Gestão" (menu do
     celular, aberto pelo botão) → "Unidades" (index.html#unidades) → e, de volta a Gestão,
     "Semog Garante", "Tecnologia" e "Incorporadoras" pelos blocos de "Vá além": cada página
     abre com o <main data-pagina> certo, sem erro;
   - administracao-de-condominios.html#mesa-do-sindico, #quem-atende, #troca-de-administradora,
     #perguntas-gestao, #proposta: a seção fica sob o header;
   - "Ver o que sai da mesa do síndico" e "Pedir proposta" da abertura levam às suas seções;
   - recarga com a página rolada até o meio do pin: sem erro, e a página remonta;
   - em cada patamar do pin, o momento visível bate com src/conteudo.json, as tarefas já
     pousadas nas frentes são as das frentes feitas e "decidir" só acende no último.
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
const PAGINA = "administracao-de-condominios.html";
const MESA = CONTEUDO.gestaoPagina.mesa;
const MOMENTOS = MESA.momentos;
/** Igual a scenes/gestao/02-mesa.js: patamar inicial, passo, cobertura e cauda. */
const TELAS_POR_UNIDADE = 0.8;
const COBRIR = 0.55;
const RITMO = {
  inicial: 0.6,
  passo: 1,
  total: 0.6 + (MOMENTOS.length - 1) + COBRIR + (0.45 / TELAS_POR_UNIDADE - 0.7 * COBRIR),
};
/** O que cada patamar mostra: tarefas pousadas (as das frentes feitas) e "decidir" aceso. */
const ESPERADO = MOMENTOS.map((_, i) => ({
  pousadas: MESA.frentes.slice(0, i).reduce((soma, f) => soma + f.tarefas.length, 0),
  aceso: i === MOMENTOS.length - 1,
}));
const FOLGA_ANCORA = 12;
const SECOES = [
  "mesa-do-sindico",
  "quem-atende",
  "troca-de-administradora",
  "perguntas-gestao",
  "proposta",
];

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
  const link = '.nav a[data-pagina-link="gestao"]';
  await pagina.goto(`${base}index.html`, { waitUntil: "load" });
  await esperarPronta(pagina, "home");
  await clicarEIr(pagina, link, "gestao");
  if ((await pagina.getAttribute(link, "aria-current")) !== "page") {
    falhas.push(`link "Gestão" sem aria-current na própria página`);
  }
  await clicarEIr(pagina, '.nav a[data-pagina-link="semog"]', "semog");
  if (await pagina.getAttribute(link, "aria-current")) {
    falhas.push(`link "Gestão" com aria-current em A Semog`);
  }
  await clicarEIr(pagina, '.nav a[data-pagina-link="incorporadoras"]', "incorporadoras");
  await pagina.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await pagina.waitForTimeout(1500);
  await clicarEIr(pagina, '.rodape a[href="administracao-de-condominios.html"]', "gestao");
  await clicarEIr(pagina, ".cabecalho .marca", "home");
  await pagina.setViewportSize({ width: 390, height: 844 });
  await pagina.click("[data-menu]");
  await pagina.waitForTimeout(400);
  await clicarEIr(pagina, '.painel-menu a[data-pagina-link="gestao"]', "gestao");
  await pagina.setViewportSize({ width: 1440, height: 900 });
  await pagina.waitForTimeout(800);
  await clicarEIr(pagina, '.nav a[href="index.html#unidades"]', "home");
  await pagina.waitForTimeout(1500);
  const distancia = await topoDe(pagina, "unidades");
  if (Math.abs(distancia) > FOLGA_ANCORA) {
    falhas.push(`index.html#unidades a partir de Gestão: seção a ${distancia}px do header`);
  }
  for (const [href, id] of [
    ["garante.html", "garante"],
    ["tecnologia.html", "tecnologia"],
    ["incorporadoras.html", "incorporadoras"],
  ]) {
    await pagina.goto(`${base}${PAGINA}`, { waitUntil: "load" });
    await esperarPronta(pagina, "gestao");
    await pagina.evaluate(() =>
      document.querySelector(".gat-links")?.scrollIntoView({ block: "center" }),
    );
    await pagina.waitForTimeout(2500);
    await clicarEIr(pagina, `.gat-link[href="${href}"]`, id);
  }
}

async function ancoras(pagina, base, falhas) {
  for (const id of SECOES) {
    await pagina.goto(`${base}${PAGINA}#${id}`, { waitUntil: "load" });
    await esperarPronta(pagina, "gestao");
    await pagina.waitForTimeout(1200);
    const distancia = await topoDe(pagina, id);
    if (Math.abs(distancia) > FOLGA_ANCORA) {
      falhas.push(`${PAGINA}#${id}: seção a ${distancia}px do header`);
    }
  }
}

async function linksDaAbertura(pagina, base, falhas) {
  for (const [seletor, id] of [
    ['#administracao-de-condominios .gab-acoes a[href="#mesa-do-sindico"]', "mesa-do-sindico"],
    ['#administracao-de-condominios .gab-acoes a[href="#proposta"]', "proposta"],
  ]) {
    await pagina.goto(`${base}${PAGINA}`, { waitUntil: "load" });
    await esperarPronta(pagina, "gestao");
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
    const espaco = document.querySelector("#mesa-do-sindico .gme-palco")?.parentElement;
    if (!espaco?.classList.contains("pin-spacer")) throw new Error("Mesa sem pin-spacer.");
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
 * O que o palco mostra: os títulos de momento no lugar, quantas tarefas já pousaram nas
 * frentes (sem deslocamento) e se "decidir" está aceso (o realce inteiro).
 */
function lerPalco(pagina) {
  return pagina.evaluate(() => {
    const noLugar = (el) => {
      const caixa = el.getBoundingClientRect();
      const mascara = el.parentElement?.getBoundingClientRect();
      return mascara && Math.abs(caixa.top - mascara.top) < 4;
    };
    const titulos = [...document.querySelectorAll(".gme-momento-titulo .gme-in")]
      .filter(noLugar)
      .map((el) => el.textContent?.trim());
    const pousadas = [...document.querySelectorAll(".gme-cartao")].filter((el) => {
      const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
      return Math.abs(m.m41) < 0.5 && Math.abs(m.m42) < 0.5;
    }).length;
    const realce = document.querySelector(".gme-realce").getBoundingClientRect().width;
    const decidir = document.querySelector(".gme-decidir").getBoundingClientRect().width;
    return { titulos, pousadas, aceso: realce > decidir - 3 };
  });
}

async function patamares(pagina, falhas, rotulo) {
  const { inicio, distancia } = await medirPin(pagina);
  for (let i = 0; i < MOMENTOS.length; i += 1) {
    const t = i === 0 ? 0.3 : RITMO.inicial + (i - 1) * RITMO.passo + 0.8;
    await irPara(pagina, Math.round(inicio + (distancia * t) / RITMO.total));
    const visto = await lerPalco(pagina);
    const esperado = ESPERADO[i];
    const problemas = [];
    if (visto.titulos.length !== 1 || visto.titulos[0] !== MOMENTOS[i].titulo) {
      problemas.push(`títulos ${JSON.stringify(visto.titulos)}, esperado ${MOMENTOS[i].titulo}`);
    }
    for (const chave of ["pousadas", "aceso"]) {
      if (visto[chave] !== esperado[chave]) {
        problemas.push(`${chave} ${visto[chave]}, esperado ${esperado[chave]}`);
      }
    }
    if (problemas.length) falhas.push(`${rotulo} patamar ${i}: ${problemas.join("; ")}`);
  }
}

async function recargaNoMeio(pagina, base, falhas, rotulo) {
  await pagina.goto(`${base}${PAGINA}`, { waitUntil: "load" });
  await esperarPronta(pagina, "gestao");
  const { inicio, distancia } = await medirPin(pagina);
  await irPara(pagina, Math.round(inicio + distancia / 2));
  await pagina.reload({ waitUntil: "load" });
  await esperarPronta(pagina, "gestao");
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
    await pagina.goto(`${base}${PAGINA}`, { waitUntil: "load" });
    await esperarPronta(pagina, "gestao");
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
  console.log("\nNavegação, âncoras, links, recarga e patamares da mesa: tudo certo.");
}

main().catch((erro) => {
  console.error(erro?.stack ?? String(erro));
  process.exit(1);
});
