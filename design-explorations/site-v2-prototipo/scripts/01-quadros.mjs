/* Verificação da cena 01 (abertura) e do formulário de proposta. Rode depois do build.
   Chromium (SwiftShader) e Firefox, em 1440×900, 1280×800 e 390×844:
   - mede: "Preocupe-se" numa linha só; título e formulário dentro da borda do header;
     título e botão "Continuar" na primeira dobra;
   - exercita: erros da etapa 1 (vazio, telefone incompleto), avanço para a etapa 2,
     voltar, erros da etapa 2 e envio de demonstração;
   - captura: capturas/01/<navegador>-<largura>-<passo>.png e, no Chromium 1440, a troca
     de foto do carrossel no meio da cortina.
   Com --video grava capturas/01-video.webm (Chromium 1440). Sai com 1 se algo falhar. */
import { chromium, firefox } from "playwright";
import { mkdirSync, renameSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "../serve.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const PASTA = join(RAIZ, "capturas", "01");
const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 390, height: 844 },
];
const NAVEGADORES = {
  chromium: () =>
    chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] }),
  firefox: () => firefox.launch(),
};
const falhas = [];
const falhar = (rotulo, msg) => falhas.push(`[${rotulo}] ${msg}`);

function ouvirErros(pagina, rotulo) {
  pagina.on("console", (m) => m.type() === "error" && falhar(rotulo, `console: ${m.text()}`));
  pagina.on("pageerror", (e) => falhar(rotulo, `página: ${e.message}`));
}

/** Medidas da primeira dobra, lidas do DOM depois da entrada. */
function medir(pagina) {
  return pagina.evaluate(() => {
    const caixa = (sel) => document.querySelector(sel).getBoundingClientRect();
    const palavra = document.querySelector(".abertura-inteira");
    const alturaLinha = parseFloat(getComputedStyle(palavra).fontSize);
    return {
      cabecalhoDireita: caixa(".cabecalho-faixa").right,
      tituloDireita: caixa(".abertura-titulo").right,
      palavraDireita: caixa(".abertura-inteira").right,
      formDireita: caixa(".abertura-form").right,
      tituloTopo: caixa(".abertura-titulo").top,
      palavraAltura: palavra.getBoundingClientRect().height,
      alturaLinha,
      botaoBase: caixa('#abertura .fp-etapa[data-etapa="1"] .botao').bottom,
      viewport: innerHeight,
      rolagemX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  });
}

function conferirDobra(m, rotulo) {
  if (m.palavraAltura > m.alturaLinha * 1.4) falhar(rotulo, "'Preocupe-se' quebrou de linha");
  const borda = m.cabecalhoDireita + 0.5;
  for (const chave of ["tituloDireita", "palavraDireita", "formDireita"]) {
    if (m[chave] > borda) falhar(rotulo, `${chave} ${m[chave]} passa do header ${borda}`);
  }
  if (m.tituloTopo < 60) falhar(rotulo, `título sob o header (${m.tituloTopo})`);
  if (m.botaoBase > m.viewport) falhar(rotulo, `Continuar abaixo da dobra (${m.botaoBase})`);
  if (m.rolagemX) falhar(rotulo, "scroll horizontal");
}

const texto = (pagina, sel) => pagina.locator(sel).innerText();

/** Clique de mouse no centro do elemento, como uma pessoa. O locator.click() do Playwright
    rola a página sozinho em alguns casos (rolou 728 px depois de um erro), o que mascara
    o comportamento real. */
async function clicar(pagina, alvo) {
  const caixa = await (typeof alvo === "string" ? pagina.locator(alvo) : alvo).boundingBox();
  if (!caixa) throw new Error(`Sem caixa para clicar: ${alvo}`);
  await pagina.mouse.click(caixa.x + caixa.width / 2, caixa.y + caixa.height / 2);
}

async function exercitarEtapa1(pagina, rotulo, foto) {
  const continuar = pagina.locator('#abertura .fp-etapa[data-etapa="1"] .botao');
  await clicar(pagina, continuar);
  await foto("1-erros-vazio");
  if (!(await texto(pagina, "#abertura-telefone-erro")).includes("DDD"))
    falhar(rotulo, "sem erro de telefone vazio");
  await pagina.fill("#abertura-condominio", "Condomínio de teste");
  await pagina.selectOption("#abertura-uf", "PE");
  await pagina.locator("#abertura-telefone").pressSequentially("819999");
  await clicar(pagina, continuar);
  await foto("2-telefone-incompleto");
  const erroTel = await texto(pagina, "#abertura-telefone-erro");
  if (!erroTel.includes("incompleto")) falhar(rotulo, `erro de telefone incompleto: "${erroTel}"`);
  await pagina.locator("#abertura-telefone").pressSequentially("98888");
  const tel = await pagina.inputValue("#abertura-telefone");
  if (tel !== "(81) 99999-8888") falhar(rotulo, `máscara deu "${tel}"`);
  await clicar(pagina, continuar);
  await pagina.waitForTimeout(1600);
  await foto("3-etapa-2");
  const ativa = await pagina.getAttribute(".abertura-form", "data-etapa-ativa");
  if (ativa !== "2") falhar(rotulo, `não avançou (etapa ${ativa})`);
  if (!(await texto(pagina, ".abertura-form [data-status]")).includes("Demonstração"))
    falhar(rotulo, "sem aviso de demonstração da etapa 1");
}

async function exercitarEtapa2(pagina, rotulo, foto) {
  await clicar(pagina, '#abertura [data-acao="voltar"]');
  await pagina.waitForTimeout(1600);
  await foto("4-voltou");
  const y = await pagina.evaluate(() => scrollY);
  // No celular o fill() do Playwright rola até o campo; a checagem vale para o desktop.
  if (y > 0 && pagina.viewportSize().width > 760)
    falhar(rotulo, `a página rolou sozinha (${y} px) ao trocar de etapa`);
  if ((await pagina.inputValue("#abertura-telefone")) !== "(81) 99999-8888")
    falhar(rotulo, "voltar perdeu o telefone");
  await clicar(pagina, '#abertura .fp-etapa[data-etapa="1"] .botao');
  await pagina.waitForTimeout(1600);
  const pedir = pagina.locator('#abertura .fp-etapa[data-etapa="2"] .botao');
  await clicar(pagina, pedir);
  await foto("5-erros-etapa-2");
  if (!(await texto(pagina, "#abertura-perfil-erro"))) falhar(rotulo, "sem erro de perfil");
  await pagina.fill("#abertura-nome", "Pessoa de teste");
  await pagina.check('#abertura input[name="perfil"][value="sindico"]');
  await pagina.check('#abertura input[name="cliente"][value="nao"]');
  await clicar(pagina, pedir);
  await pagina.waitForTimeout(400);
  await foto("6-enviado");
  if (!(await texto(pagina, ".abertura-form [data-status]")).includes("nada foi enviado"))
    falhar(rotulo, "sem aviso final de demonstração");
}

async function carrossel(pagina, foto) {
  // A troca acontece 2 s + 6,5 s depois da entrada; captura no meio da cortina e depois.
  await pagina.waitForTimeout(4900);
  for (let i = 0; i < 4; i++) {
    await foto(`7-cortina-${i}`);
    await pagina.waitForTimeout(250);
  }
  await pagina.waitForTimeout(1200);
  await foto("8-depois-da-troca");
}

async function rodar(nome, url, viewport) {
  const rotulo = `${nome} ${viewport.width}`;
  const navegador = await NAVEGADORES[nome]();
  const contexto = await navegador.newContext({ viewport });
  const pagina = await contexto.newPage();
  ouvirErros(pagina, rotulo);
  const foto = (passo) =>
    pagina.screenshot({ path: join(PASTA, `${nome}-${viewport.width}-${passo}.png`) });
  try {
    await pagina.goto(url, { waitUntil: "load" });
    await pagina.waitForFunction(() => document.documentElement.classList.contains("motion"));
    await pagina.waitForTimeout(3500);
    await foto("0-dobra");
    conferirDobra(await medir(pagina), rotulo);
    if (nome === "chromium" && viewport.width === 1440) await carrossel(pagina, foto);
    await exercitarEtapa1(pagina, rotulo, foto);
    await exercitarEtapa2(pagina, rotulo, foto);
  } finally {
    await contexto.close();
    await navegador.close();
  }
  console.log(`  ${rotulo}: feito`);
}

async function gravarVideo(url) {
  const navegador = await NAVEGADORES.chromium();
  const viewport = { width: 1440, height: 900 };
  const contexto = await navegador.newContext({
    viewport,
    recordVideo: { dir: PASTA, size: viewport },
  });
  const pagina = await contexto.newPage();
  await pagina.goto(url, { waitUntil: "load" });
  await pagina.waitForTimeout(10000); // entrada + uma troca de foto
  await pagina.fill("#abertura-condominio", "Condomínio de teste");
  await pagina.selectOption("#abertura-uf", "PB");
  await pagina.locator("#abertura-telefone").pressSequentially("83988887777", { delay: 60 });
  await clicar(pagina, '#abertura .fp-etapa[data-etapa="1"] .botao');
  await pagina.waitForTimeout(2200);
  await clicar(pagina, '#abertura [data-acao="voltar"]');
  await pagina.waitForTimeout(2200);
  await pagina.mouse.wheel(0, 500);
  await pagina.waitForTimeout(1500);
  const video = pagina.video();
  await contexto.close();
  await navegador.close();
  if (video) renameSync(await video.path(), join(RAIZ, "capturas", "01-video.webm"));
}

/** Sem JS: o formulário é um só, com as duas etapas visíveis e sem botão "Continuar". */
async function semJs(url) {
  const navegador = await NAVEGADORES.chromium();
  for (const viewport of [VIEWPORTS[0], VIEWPORTS[2]]) {
    const contexto = await navegador.newContext({ viewport, javaScriptEnabled: false });
    const pagina = await contexto.newPage();
    await pagina.goto(url, { waitUntil: "load" });
    const visivel = await pagina.locator("#abertura-nome").isVisible();
    const continuar = await pagina
      .locator('#abertura .fp-etapa[data-etapa="1"] .botao')
      .isVisible();
    if (!visivel || continuar)
      falhar(`sem JS ${viewport.width}`, "etapa 2 oculta ou Continuar visível");
    await pagina.locator(".abertura-form").screenshot({
      path: join(PASTA, `sem-js-${viewport.width}-formulario.png`),
    });
    await contexto.close();
  }
  await navegador.close();
}

async function main() {
  mkdirSync(PASTA, { recursive: true });
  const servidor = await servir();
  try {
    for (const nome of Object.keys(NAVEGADORES)) {
      for (const viewport of VIEWPORTS) await rodar(nome, servidor.url, viewport);
    }
    await semJs(servidor.url);
    if (process.argv.includes("--video")) await gravarVideo(servidor.url);
  } finally {
    await servidor.fechar();
  }
  if (falhas.length) {
    console.error(`\n${falhas.length} falha(s):\n  ${falhas.join("\n  ")}`);
    process.exit(1);
  }
  console.log("\nSem falhas.");
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
