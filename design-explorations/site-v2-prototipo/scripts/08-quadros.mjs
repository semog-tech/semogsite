/* Cena 08 · quadros, emenda com a 07 e interação, nos dois navegadores, 1440 e 390 (rode
   depois do build). Para cada viewport:
   - emenda 07→08: prints com o topo da 08 a 100%, 80% e 62% da tela, mais a posição da
     costura em capturas/08/emenda.json (a medição por pixel é feita fora, sobre os PNGs);
   - entrada em quadros e amostragem do botão "Continuar" (não pode piscar);
   - as duas etapas com clique de mouse real: vazio, telefone incompleto, Continuar, Voltar,
     Continuar de novo e Pedir proposta.
   Grava capturas/08-video.webm (Chromium, 1440×900). Sai com 1 em erro de console, de
   página, de rede ou scroll horizontal. */
import { chromium, firefox } from "playwright";
import { mkdirSync, renameSync, rmSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "../serve.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const PASTA = join(RAIZ, "capturas", "08");
const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
];
const ARGS_CHROMIUM = { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] };

function ouvirErros(pagina, erros) {
  pagina.on("console", (msg) => {
    if (msg.type() === "error") erros.push(`console: ${msg.text()}`);
  });
  pagina.on("pageerror", (erro) => erros.push(`página: ${erro.message}`));
  pagina.on("requestfailed", (req) => erros.push(`requisição: ${req.url()}`));
}

async function topoDe(pagina, id) {
  return pagina.evaluate(
    (alvo) => Math.round(document.getElementById(alvo).getBoundingClientRect().top + scrollY),
    id,
  );
}

async function rolarPara(pagina, y) {
  await pagina.evaluate((alvo) => window.scrollTo(0, alvo), y);
  await pagina.waitForTimeout(900);
  await pagina.evaluate((alvo) => window.scrollTo(0, alvo), y);
}

/** Topo da 08 a 100%, 80% e 62% da altura da tela; devolve onde a costura caiu. */
async function emenda(pagina, prefixo) {
  const vh = pagina.viewportSize().height;
  const medidas = [];
  for (const fracao of [1, 0.8, 0.62]) {
    const topo = await topoDe(pagina, "proposta");
    await rolarPara(pagina, topo - Math.round(vh * fracao));
    await pagina.waitForTimeout(600);
    const costura = await pagina.evaluate(() =>
      Math.round(document.getElementById("proposta").getBoundingClientRect().top),
    );
    const arquivo = `${prefixo}-emenda-${Math.round(fracao * 100)}.png`;
    await pagina.screenshot({ path: arquivo });
    medidas.push({ arquivo, costura });
  }
  return medidas;
}

/** Visibilidade do botão "Continuar" a cada 100 ms: a fração revelada nunca pode cair. */
async function amostrarBotao(pagina) {
  return pagina.evaluate(async () => {
    const acoes = document.querySelector("#proposta .fp-acoes");
    const amostras = [];
    for (let i = 0; i < 28; i++) {
      const caixa = acoes.getBoundingClientRect();
      const clip = getComputedStyle(acoes).clipPath;
      const fundo = clip.match(/inset\(\S+ \S+ ([\d.]+)%/);
      const revelado = clip === "none" ? 1 : fundo ? 1 - Number(fundo[1]) / 100 : 1;
      amostras.push(Math.round(revelado * 100) / 100 + (caixa.height ? 0 : -9));
      await new Promise((r) => setTimeout(r, 100));
    }
    return amostras;
  });
}

async function quadrosDaEntrada(pagina, prefixo) {
  const topo = await topoDe(pagina, "proposta");
  const vh = pagina.viewportSize().height;
  await pagina.evaluate((y) => window.scrollTo(0, y), topo - Math.round(vh * 0.4));
  const amostras = await amostrarBotao(pagina);
  await pagina.screenshot({ path: `${prefixo}-1-entrada.png` });
  await rolarPara(pagina, topo);
  await pagina.waitForTimeout(1500);
  await pagina.screenshot({ path: `${prefixo}-2-assentado.png` });
  return amostras;
}

/** Clique de mouse real no centro do elemento (sem a rolagem automática do locator). */
async function clicar(pagina, seletor) {
  const caixa = await pagina.locator(seletor).first().boundingBox();
  if (!caixa) throw new Error(`Sem caixa para ${seletor}`);
  await pagina.mouse.click(caixa.x + caixa.width / 2, caixa.y + caixa.height / 2);
}

async function texto(pagina, seletor) {
  return (await pagina.locator(seletor).textContent())?.trim() ?? "";
}

async function etapas(pagina, prefixo) {
  const form = "#proposta .proposta-form";
  await pagina.evaluate((s) => document.querySelector(s).scrollIntoView(), form);
  await pagina.waitForTimeout(1500);
  const r = {};
  await clicar(pagina, `${form} [data-etapa="1"] .botao`);
  await pagina.waitForTimeout(500);
  r.vazio = await texto(pagina, "#proposta-condominio-erro");
  await pagina.screenshot({ path: `${prefixo}-3-erros.png` });
  await clicar(pagina, "#proposta-condominio");
  await pagina.keyboard.type("Condomínio de teste");
  await pagina.selectOption("#proposta-uf", "PB");
  await clicar(pagina, "#proposta-telefone");
  await pagina.keyboard.type("8399");
  await clicar(pagina, `${form} [data-etapa="1"] .botao`);
  await pagina.waitForTimeout(500);
  r.telefone = await texto(pagina, "#proposta-telefone-erro");
  await pagina.screenshot({ path: `${prefixo}-4-telefone.png` });
  await clicar(pagina, "#proposta-telefone");
  await pagina.keyboard.type("9998888");
  r.mascara = await pagina.inputValue("#proposta-telefone");
  await clicar(pagina, `${form} [data-etapa="1"] .botao`);
  await pagina.waitForTimeout(1600);
  r.etapaAposContinuar = await pagina.getAttribute(form, "data-etapa-ativa");
  r.status1 = await texto(pagina, `${form} [data-status]`);
  await pagina.screenshot({ path: `${prefixo}-5-etapa2.png` });
  await clicar(pagina, `${form} [data-acao="voltar"]`);
  await pagina.waitForTimeout(1600);
  r.etapaAposVoltar = await pagina.getAttribute(form, "data-etapa-ativa");
  r.condominioMantido = await pagina.inputValue("#proposta-condominio");
  await pagina.screenshot({ path: `${prefixo}-6-voltar.png` });
  await clicar(pagina, `${form} [data-etapa="1"] .botao`);
  await pagina.waitForTimeout(1600);
  await clicar(pagina, `${form} [data-etapa="2"] .botao`);
  await pagina.waitForTimeout(500);
  r.nomeVazio = await texto(pagina, "#proposta-nome-erro");
  await clicar(pagina, "#proposta-nome");
  await pagina.keyboard.type("Pessoa de teste");
  await clicar(pagina, `#proposta [data-grupo="perfil"] label:has(input[value="sindico"])`);
  await clicar(pagina, `#proposta [data-grupo="cliente"] label:has(input[value="nao"])`);
  await clicar(pagina, `${form} [data-etapa="2"] .botao`);
  await pagina.waitForTimeout(900);
  r.status2 = await texto(pagina, `${form} [data-status]`);
  r.url = pagina.url();
  await pagina.screenshot({ path: `${prefixo}-7-envio.png` });
  return r;
}

async function rodar(nomeNav, tipo, opcoes, url, erros, emendas) {
  const navegador = await tipo.launch(opcoes);
  try {
    for (const viewport of VIEWPORTS) {
      const contexto = await navegador.newContext({ viewport });
      const pagina = await contexto.newPage();
      const errosAqui = [];
      ouvirErros(pagina, errosAqui);
      await pagina.goto(url, { waitUntil: "load" });
      await pagina.waitForFunction(() => document.documentElement.classList.contains("motion"));
      const prefixo = join(PASTA, `${nomeNav}-${viewport.width}`);
      emendas.push({ nav: nomeNav, ...viewport, medidas: await emenda(pagina, prefixo) });
      // Página nova para a entrada: a emenda já disparou a cena.
      await pagina.goto(url, { waitUntil: "load" });
      await pagina.waitForFunction(() => document.documentElement.classList.contains("motion"));
      const amostras = await quadrosDaEntrada(pagina, prefixo);
      const r = await etapas(pagina, prefixo);
      const horizontal = await pagina.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      if (horizontal) errosAqui.push("scroll horizontal");
      console.log(`${nomeNav} ${viewport.width} botão:`, amostras.join(" "));
      console.log(`${nomeNav} ${viewport.width}:`, JSON.stringify(r));
      erros.push(...errosAqui.map((e) => `[${nomeNav} ${viewport.width}] ${e}`));
      await contexto.close();
    }
  } finally {
    await navegador.close();
  }
}

async function gravarVideo(url, erros) {
  const navegador = await chromium.launch(ARGS_CHROMIUM);
  const pastaVideo = join(PASTA, "video-tmp");
  try {
    const contexto = await navegador.newContext({
      viewport: { width: 1440, height: 900 },
      recordVideo: { dir: pastaVideo, size: { width: 1440, height: 900 } },
    });
    const pagina = await contexto.newPage();
    ouvirErros(pagina, erros);
    await pagina.goto(url, { waitUntil: "load" });
    await pagina.waitForFunction(() => document.documentElement.classList.contains("motion"));
    const topo = await topoDe(pagina, "proposta");
    await pagina.evaluate((y) => window.scrollTo(0, y), topo - 1500);
    await pagina.waitForTimeout(1200);
    for (let i = 0; i < 15; i++) {
      await pagina.mouse.wheel(0, 100);
      await pagina.waitForTimeout(170);
    }
    await pagina.waitForTimeout(3000);
    await clicar(pagina, "#proposta-condominio");
    await pagina.keyboard.type("Condomínio de teste", { delay: 60 });
    await pagina.selectOption("#proposta-uf", "PE");
    await clicar(pagina, "#proposta-telefone");
    await pagina.keyboard.type("81999998888", { delay: 60 });
    await clicar(pagina, "#proposta .proposta-form [data-etapa='1'] .botao");
    await pagina.waitForTimeout(2200);
    for (let i = 0; i < 8; i++) {
      await pagina.mouse.wheel(0, 120);
      await pagina.waitForTimeout(200);
    }
    await pagina.waitForTimeout(1500);
    await contexto.close();
    const [arquivo] = readdirSync(pastaVideo);
    renameSync(join(pastaVideo, arquivo), join(RAIZ, "capturas", "08-video.webm"));
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
  const emendas = [];
  try {
    await rodar("chromium", chromium, ARGS_CHROMIUM, servidor.url, erros, emendas);
    await rodar("firefox", firefox, {}, servidor.url, erros, emendas);
    if (!process.argv.includes("--sem-video")) await gravarVideo(servidor.url, erros);
  } finally {
    await servidor.fechar();
  }
  writeFileSync(join(PASTA, "emenda.json"), JSON.stringify(emendas, null, 2));
  if (erros.length) {
    console.error(`\n${erros.length} problema(s):\n  ${erros.join("\n  ")}`);
    process.exit(1);
  }
  console.log("\nSem erro de console, de página, de rede nem scroll horizontal.");
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
