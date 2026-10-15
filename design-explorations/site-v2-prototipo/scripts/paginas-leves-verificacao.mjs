/* Verificação das páginas leves: proposta.html, contato.html e 404.html (rode depois do
   build). Em Chromium e Firefox, 1440×900 e 390×844, por HTTP e por file://:
   - Proposta: o formulário (até o "Continuar") termina dentro da primeira tela; as duas
     etapas com clique de mouse por coordenada (locator.click rolaria a página): erro com
     campos vazios, etapa 1 válida, etapa 2, aviso de demonstração; a página não rola
     sozinha; ?perfil=construtora chega com "Construtora" marcado na etapa 2;
   - Contato: nenhum link de discagem nem de WhatsApp; o formulário de mensagem envia só a
     demonstração; vazio, o navegador barra e nada aparece;
   - 404: os cinco caminhos de volta com o destino certo;
   - navegação por clique: "Fale com a gente" (header e menu do celular) leva a contato.html;
     "Seja Semog" leva a proposta.html nas páginas sem a cena de proposta e fica em
     #proposta na home; da 404, "Pedir proposta" leva à proposta;
   - varredura: cada página rolada uma tela por vez, com print em
     capturas/paginas-leves/<navegador>-<protocolo>/.
   Sai com código 1 se algo falhar (inclui erro de console, de página e de rede).
   Opções: --navegador chromium|firefox (padrão: os dois), --so-http, --so-file. */
import { chromium, firefox } from "playwright";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { servir } from "../serve.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const SAIDA = join(RAIZ, "capturas", "paginas-leves");
const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
];
const NAVEGADORES = { chromium, firefox };
const conteudo = JSON.parse(readFileSync(join(RAIZ, "src", "conteudo.json"), "utf8"));
const DEMO_FINAL = conteudo.proposta.demo;
const ETAPA1 = '#proposta .fp-etapa[data-etapa="1"] button[type="submit"]';
const ETAPA2 = '#proposta .fp-etapa[data-etapa="2"] button[type="submit"]';

function lerArgs(argv) {
  const args = { navegadores: [], http: true, file: true };
  for (let i = 0; i < argv.length; i++) {
    const opcao = argv[i];
    if (opcao === "--so-http") args.file = false;
    else if (opcao === "--so-file") args.http = false;
    else if (opcao === "--navegador") args.navegadores.push(argv[++i]);
    else throw new Error(`Opção desconhecida: ${opcao}`);
  }
  return args;
}

function ouvir(pagina) {
  const erros = [];
  pagina.on("console", (m) => m.type() === "error" && erros.push(`console: ${m.text()}`));
  pagina.on("pageerror", (e) => erros.push(`página: ${e.message}`));
  pagina.on("requestfailed", (r) => erros.push(`rede: ${r.url()} (${r.failure()?.errorText})`));
  return erros;
}

async function abrir(pagina, url) {
  await pagina.goto(url, { waitUntil: "load" });
  await pagina.waitForFunction(() => document.documentElement.classList.contains("motion"), {
    timeout: 8000,
  });
  await pagina.waitForTimeout(1800); // entradas de CSS da primeira dobra
}

/** Caixa do alvo; se estiver fora da tela, rola com a roda do mouse até ele (como alguém faria). */
async function caixaVisivel(pagina, seletor) {
  const alvo = pagina.locator(seletor).first();
  for (let tentativa = 0; tentativa < 6; tentativa++) {
    const caixa = await alvo.boundingBox();
    if (!caixa) throw new Error(`${seletor} sem caixa (invisível?).`);
    const altura = pagina.viewportSize()?.height ?? 0;
    if (caixa.y >= 0 && caixa.y + caixa.height <= altura) return caixa;
    await pagina.mouse.move(10, altura / 2);
    await pagina.mouse.wheel(0, caixa.y + caixa.height / 2 - altura / 2);
    await pagina.waitForTimeout(700);
  }
  throw new Error(`${seletor} não chegou à tela rolando.`);
}

async function clicar(pagina, seletor) {
  const c = await caixaVisivel(pagina, seletor);
  await pagina.mouse.click(c.x + c.width / 2, c.y + c.height / 2);
}

async function digitar(pagina, seletor, texto) {
  await clicar(pagina, seletor);
  await pagina.keyboard.type(texto, { delay: 10 });
}

const scrollY = (pagina) => pagina.evaluate(() => Math.round(window.scrollY));

/** Proposta: dobra, erro, duas etapas, demonstração. */
async function verificarProposta(pagina, base, viewport, pasta, falhas) {
  await abrir(pagina, new URL("proposta.html", base).href);
  const botao = await pagina.locator(ETAPA1).boundingBox();
  const fundo = Math.round((botao?.y ?? 9999) + (botao?.height ?? 0));
  if (fundo > viewport.height)
    falhas.push(`proposta: "Continuar" termina em ${fundo}px (dobra ${viewport.height})`);
  await pagina.screenshot({ path: join(pasta, `proposta-${viewport.width}-dobra.png`) });
  const y0 = await scrollY(pagina);
  await clicar(pagina, ETAPA1);
  await pagina.waitForTimeout(300);
  if (!(await pagina.textContent("#pp-condominio-erro")))
    falhas.push("proposta: etapa 1 vazia não mostrou erro");
  await pagina.screenshot({ path: join(pasta, `proposta-${viewport.width}-erro.png`) });
  await digitar(pagina, "#pp-condominio", "Condomínio de teste");
  await clicar(pagina, "#pp-uf");
  await pagina.keyboard.press("Escape"); // fecha a lista nativa, se abriu
  await pagina.keyboard.type("Pernambuco");
  await digitar(pagina, "#pp-telefone", "81999998888");
  await clicar(pagina, ETAPA1);
  await pagina.waitForTimeout(1500);
  const etapa = await pagina.getAttribute("#proposta form", "data-etapa-ativa");
  const uf = await pagina.inputValue("#pp-uf");
  if (uf !== "PE") falhas.push(`proposta: estado "${uf}" depois de digitar Pernambuco`);
  if (etapa !== "2") falhas.push(`proposta: etapa ativa ${etapa} depois de "Continuar"`);
  await pagina.screenshot({ path: join(pasta, `proposta-${viewport.width}-etapa2.png`) });
  const y1 = await scrollY(pagina);
  if (Math.abs(y1 - y0) > 1) falhas.push(`proposta: a página rolou sozinha (${y0} → ${y1})`);
  await digitar(pagina, "#pp-nome", "Pessoa de teste");
  await clicar(pagina, '#proposta input[name="perfil"][value="sindico"]');
  await clicar(pagina, '#proposta input[name="cliente"][value="nao"]');
  await clicar(pagina, ETAPA2);
  await pagina.waitForTimeout(400);
  const status = (await pagina.textContent("#proposta [data-status]"))?.trim();
  if (status !== DEMO_FINAL) falhas.push(`proposta: status final "${status}"`);
  await pagina.screenshot({ path: join(pasta, `proposta-${viewport.width}-enviado.png`) });
  return { continuarAte: fundo, etapa, status };
}

/** ?perfil=construtora: "Construtora" marcado quando a etapa 2 aparece. */
async function verificarPerfil(pagina, base, viewport, pasta, falhas) {
  await abrir(pagina, new URL("proposta.html?perfil=construtora", base).href);
  await digitar(pagina, "#pp-condominio", "Edifício de teste");
  await clicar(pagina, "#pp-uf");
  await pagina.keyboard.press("Escape");
  await pagina.keyboard.type("Paraíba");
  await digitar(pagina, "#pp-telefone", "83988887777");
  await clicar(pagina, ETAPA1);
  await pagina.waitForTimeout(1500);
  const marcado = await pagina.isChecked('#proposta input[name="perfil"][value="construtora"]');
  if (!marcado) falhas.push("?perfil=construtora: Construtora não veio marcada");
  await pagina.screenshot({ path: join(pasta, `proposta-${viewport.width}-construtora.png`) });
  return { construtora: marcado };
}

async function verificarContato(pagina, base, viewport, pasta, falhas) {
  await abrir(pagina, new URL("contato.html", base).href);
  const proibidos = await pagina.evaluate(
    () =>
      document.querySelectorAll('a[href^="tel:"], a[href*="wa.me"], a[href*="whatsapp"]').length,
  );
  if (proibidos) falhas.push(`contato: ${proibidos} link(s) de discagem/WhatsApp`);
  await clicar(pagina, '#contato-mensagem button[type="submit"]');
  await pagina.waitForTimeout(300);
  const vazio = (await pagina.textContent("#contato-mensagem [data-status]"))?.trim();
  if (vazio) falhas.push(`contato: formulário vazio mostrou "${vazio}"`);
  await digitar(pagina, "#cm-nome", "Pessoa de teste");
  await digitar(pagina, "#cm-email", "teste@exemplo.com.br");
  await clicar(pagina, "#cm-assunto");
  await pagina.keyboard.press("Escape");
  await pagina.keyboard.type("Imprensa");
  await digitar(pagina, "#cm-mensagem", "Mensagem de teste.");
  await clicar(pagina, '#contato-mensagem button[type="submit"]');
  await pagina.waitForTimeout(400);
  const status = (await pagina.textContent("#contato-mensagem [data-status]"))?.trim();
  const assunto = await pagina.inputValue("#cm-assunto");
  if (assunto !== "Imprensa") falhas.push(`contato: assunto "${assunto}"`);
  if (status !== DEMO_FINAL) falhas.push(`contato: status "${status}"`);
  await pagina.screenshot({ path: join(pasta, `contato-${viewport.width}-enviado.png`) });
  return { status };
}

async function verificar404(pagina, base, viewport, pasta, falhas) {
  await abrir(pagina, new URL("404.html", base).href);
  await pagina.waitForTimeout(1500); // a volta do traço e os links
  await pagina.screenshot({ path: join(pasta, `404-${viewport.width}.png`) });
  const hrefs = await pagina.$$eval("#nao-encontrada .ne-links a", (as) =>
    as.map((a) => a.getAttribute("href")),
  );
  const esperado = [
    "index.html",
    "index.html#unidades",
    "proposta.html",
    "blog.html",
    "contato.html",
  ];
  if (JSON.stringify(hrefs) !== JSON.stringify(esperado))
    falhas.push(`404: links ${JSON.stringify(hrefs)}`);
  return { hrefs };
}

/** Clica e espera a navegação; devolve o arquivo e o hash a que chegou. */
async function clicarENavegar(pagina, seletor) {
  const antes = pagina.url();
  try {
    await Promise.all([
      pagina.waitForURL((u) => u.href !== antes, { waitUntil: "load", timeout: 10000 }),
      clicar(pagina, seletor),
    ]);
  } catch (erro) {
    throw new Error(`clique em ${seletor} (${antes}) não navegou: ${erro.message.split("\n")[0]}`);
  }
  const u = new URL(pagina.url());
  return `${u.pathname.split("/").pop()}${u.hash}`;
}

async function verificarNavegacao(pagina, base, viewport, falhas) {
  const r = {};
  const estreita = viewport.width < 1081;
  const fale = estreita ? '.painel-menu a[href="contato.html"]' : '.nav a[href="contato.html"]';
  await abrir(pagina, new URL("index.html", base).href);
  const sejaHome = await pagina.getAttribute(".cab-acoes .botao", "href");
  if (sejaHome !== "#proposta") falhas.push(`home: "Seja Semog" aponta para ${sejaHome}`);
  if (estreita) await clicar(pagina, "[data-menu]");
  r.home = await clicarENavegar(pagina, fale);
  if (r.home !== "contato.html") falhas.push(`home → "Fale com a gente" chegou em ${r.home}`);
  await pagina.waitForTimeout(1200);
  const atual = await pagina.getAttribute('.nav a[href="contato.html"]', "aria-current");
  if (atual !== "page") falhas.push("contato: o link do header não marca a página atual");
  r.contato = await clicarENavegar(pagina, ".cab-acoes .botao");
  if (r.contato !== "proposta.html") falhas.push(`contato → "Seja Semog" chegou em ${r.contato}`);
  await pagina.waitForTimeout(1200);
  const sejaProposta = await pagina.getAttribute(".cab-acoes .botao", "href");
  if (sejaProposta !== "#proposta") falhas.push(`proposta: "Seja Semog" é ${sejaProposta}`);
  await abrir(pagina, new URL("404.html", base).href);
  r.nao = await clicarENavegar(pagina, '#nao-encontrada a[href="proposta.html"]');
  if (r.nao !== "proposta.html") falhas.push(`404 → "Pedir proposta" chegou em ${r.nao}`);
  return r;
}

/** Rola uma tela por vez e salva o print de cada parada. */
async function varrer(pagina, base, arquivo, viewport, pasta) {
  await abrir(pagina, new URL(arquivo, base).href);
  const altura = await pagina.evaluate(() => document.documentElement.scrollHeight);
  let passo = 0;
  for (let y = 0; y < altura; y += viewport.height, passo++) {
    await pagina.evaluate((alvoY) => window.scrollTo(0, alvoY), y);
    await pagina.waitForTimeout(1600);
    const nome = `${arquivo.replace(".html", "")}-${viewport.width}-${passo}.png`;
    await pagina.screenshot({ path: join(pasta, "varredura", nome) });
  }
  const largo = await pagina.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  return { paradas: passo, largo };
}

async function rodarViewport(navegador, nome, protocolo, base, viewport) {
  const contexto = await navegador.newContext({ viewport });
  const pagina = await contexto.newPage();
  const erros = ouvir(pagina);
  const falhas = [];
  const pasta = join(SAIDA, `${nome}-${protocolo}`);
  mkdirSync(join(pasta, "varredura"), { recursive: true });
  const r = {};
  try {
    r.proposta = await verificarProposta(pagina, base, viewport, pasta, falhas);
    r.perfil = await verificarPerfil(pagina, base, viewport, pasta, falhas);
    r.contato = await verificarContato(pagina, base, viewport, pasta, falhas);
    r.nao = await verificar404(pagina, base, viewport, pasta, falhas);
    r.navegacao = await verificarNavegacao(pagina, base, viewport, falhas);
    for (const arquivo of ["proposta.html", "contato.html", "404.html"]) {
      const v = await varrer(pagina, base, arquivo, viewport, pasta);
      if (v.largo) falhas.push(`${arquivo}: scroll horizontal`);
      r[`varredura ${arquivo}`] = v.paradas;
    }
  } catch (erro) {
    falhas.push(`exceção: ${erro.message.split("\n")[0]}`);
  } finally {
    await contexto.close();
  }
  const rotulo = `[${nome} ${protocolo} ${viewport.width}]`;
  console.log(`${rotulo} ${JSON.stringify(r)}`);
  return [...erros, ...falhas].map((e) => `${rotulo} ${e}`);
}

async function main() {
  const args = lerArgs(process.argv.slice(2));
  const servidor = args.http ? await servir() : null;
  const bases = [];
  if (servidor) bases.push(["http", servidor.url]);
  if (args.file) bases.push(["file", pathToFileURL(join(RAIZ, "dist") + "/").href]);
  const nomes = args.navegadores.length ? args.navegadores : Object.keys(NAVEGADORES);
  const problemas = [];
  try {
    for (const nome of nomes) {
      const navegador = await NAVEGADORES[nome].launch(
        nome === "chromium"
          ? { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] }
          : {},
      );
      try {
        for (const [protocolo, base] of bases) {
          for (const viewport of VIEWPORTS) {
            problemas.push(...(await rodarViewport(navegador, nome, protocolo, base, viewport)));
          }
        }
      } finally {
        await navegador.close();
      }
    }
  } finally {
    await servidor?.fechar();
  }
  if (problemas.length) {
    console.error(`\n${problemas.length} problema(s):\n  ${problemas.join("\n  ")}`);
    process.exit(1);
  }
  console.log("\nTudo certo: dobra, etapas, perfil, contato, 404, navegação, sem erros.");
}

main().catch((erro) => {
  console.error(`\nVerificação falhou: ${erro?.stack ?? String(erro)}`);
  process.exit(1);
});
