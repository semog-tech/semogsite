/* Captura de cada cena (rode depois do build; `pnpm capturar` faz os dois).
   Serve dist/ por HTTP (ou abre por file:// com --file), abre cada página de
   src/paginas.json, rola até cada <section> dela, espera a cena assentar e salva o
   viewport em 1440×900 e 390×844:
     capturas/<cena>-<largura>.png                   (home, Chromium)
     capturas/<página>/<cena>-<largura>.png          (outras páginas, Chromium)
     capturas/firefox/[<página>/]<cena>-<largura>.png (Firefox, se instalado)
   Falha (código 1) com erro de console, erro de página, requisição que falhou ou scroll
   horizontal. Opções:
     --pagina <id>        só essa página (pode repetir; padrão: todas)
     --cena <id>          só essa cena (pode repetir)
     --navegador <nome>   chromium ou firefox (padrão: os dois)
     --file               abre dist/index.html por file:// em vez de HTTP
     --espera <ms>        espera depois de rolar (padrão 1500, mínimo 1500) */
import { chromium, firefox } from "playwright";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { servir } from "../serve.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const PASTA = join(RAIZ, "capturas");
const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
];
const NAVEGADORES = { chromium, firefox };
// O Lenis ainda corre depois do scrollTo; a posição é corrigida depois deste intervalo.
const ASSENTAR_LENIS_MS = 900;

function lerArgs(argv) {
  const args = { paginas: [], cenas: [], navegadores: [], file: false, espera: 1500 };
  const fila = [...argv];
  while (fila.length) {
    const opcao = fila.shift();
    if (opcao === "--file") {
      args.file = true;
      continue;
    }
    const valor = fila.shift();
    if (valor === undefined) throw new Error(`Falta o valor de ${opcao}.`);
    if (opcao === "--pagina") args.paginas.push(valor);
    else if (opcao === "--cena") args.cenas.push(valor);
    else if (opcao === "--navegador") args.navegadores.push(valor);
    else if (opcao === "--espera") args.espera = Math.max(1500, Number(valor) || 0);
    else throw new Error(`Opção desconhecida: ${opcao}`);
  }
  return args;
}

/**
 * Páginas a capturar, cada uma com as cenas que passam no filtro (na ordem da página).
 * @returns {Array<{ id: string, saida: string, cenas: string[] }>}
 */
function paginasACapturar(args) {
  const lista = JSON.parse(readFileSync(join(RAIZ, "src", "paginas.json"), "utf8"));
  for (const id of args.paginas) {
    if (!lista.some((p) => p.id === id)) throw new Error(`Página desconhecida: ${id}`);
  }
  const escolhidas = args.paginas.length ? lista.filter((p) => args.paginas.includes(p.id)) : lista;
  const todas = escolhidas.flatMap((p) => p.secoes.map((s) => s.id));
  for (const id of args.cenas) if (!todas.includes(id)) throw new Error(`Cena desconhecida: ${id}`);
  return escolhidas
    .map((p) => {
      const ids = p.secoes.map((s) => s.id);
      const cenas = args.cenas.length ? ids.filter((id) => args.cenas.includes(id)) : ids;
      return { id: p.id, saida: p.saida, cenas };
    })
    .filter((p) => p.cenas.length);
}

/** Liga os ouvidos de erro da página; devolve a lista que vai sendo preenchida. */
function ouvirErros(pagina) {
  const erros = [];
  pagina.on("console", (msg) => {
    if (msg.type() === "error") erros.push(`console: ${msg.text()}`);
  });
  pagina.on("pageerror", (erro) => erros.push(`página: ${erro.message}`));
  pagina.on("requestfailed", (req) =>
    erros.push(`requisição: ${req.url()} (${req.failure()?.errorText ?? "?"})`),
  );
  return erros;
}

/** Rola até o topo da seção (posição recalculada: pins mudam a altura da página). */
async function rolarAte(pagina, id, espera) {
  const ir = () =>
    pagina.evaluate((alvo) => {
      const el = document.getElementById(alvo);
      if (!el) throw new Error(`#${alvo} não está na página.`);
      const y = Math.round(el.getBoundingClientRect().top + window.scrollY);
      window.scrollTo(0, y);
      return y;
    }, id);
  await ir();
  await pagina.waitForTimeout(ASSENTAR_LENIS_MS);
  await ir();
  await pagina.waitForTimeout(espera);
}

async function scrollHorizontal(pagina) {
  return pagina.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
}

/** Home direto em capturas/[firefox/]; as outras páginas numa subpasta com o id delas. */
function pastaDe(nome, pagina) {
  const base = nome === "chromium" ? PASTA : join(PASTA, nome);
  return pagina.id === "home" ? base : join(base, pagina.id);
}

async function capturarViewport(navegador, nome, { url, pagina: entrada }, viewport, args) {
  const contexto = await navegador.newContext({ viewport });
  const pagina = await contexto.newPage();
  const erros = ouvirErros(pagina);
  const falhas = [];
  try {
    await pagina.goto(url, { waitUntil: "load" });
    await pagina.waitForFunction(() => document.documentElement.classList.contains("motion"), {
      timeout: 8000,
    });
    const pasta = pastaDe(nome, entrada);
    mkdirSync(pasta, { recursive: true });
    for (const id of entrada.cenas) {
      await rolarAte(pagina, id, args.espera);
      const arquivo = join(pasta, `${id}-${viewport.width}.png`);
      await pagina.screenshot({ path: arquivo });
      console.log(`  ${nome} ${viewport.width}: ${id} → ${arquivo.slice(RAIZ.length + 1)}`);
    }
    if (await scrollHorizontal(pagina)) falhas.push("scroll horizontal na página");
  } finally {
    await contexto.close();
  }
  return [...erros, ...falhas].map((e) => `[${nome} ${entrada.saida} ${viewport.width}] ${e}`);
}

async function rodarNavegador(nome, alvos, args) {
  let navegador;
  try {
    // Chromium headless sem flags perde o contexto WebGL; SwiftShader mantém.
    navegador = await NAVEGADORES[nome].launch(
      nome === "chromium"
        ? { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] }
        : {},
    );
  } catch (erro) {
    console.warn(`(${nome} não disponível nesta máquina; pulado: ${erro.message.split("\n")[0]})`);
    return [];
  }
  try {
    const problemas = [];
    for (const alvo of alvos) {
      for (const viewport of VIEWPORTS) {
        problemas.push(...(await capturarViewport(navegador, nome, alvo, viewport, args)));
      }
    }
    return problemas;
  } finally {
    await navegador.close();
  }
}

async function main() {
  const args = lerArgs(process.argv.slice(2));
  const paginas = paginasACapturar(args);
  for (const { saida } of paginas) {
    if (!existsSync(join(RAIZ, "dist", saida)))
      throw new Error(`dist/${saida} não existe: rode pnpm build.`);
  }
  const servidor = args.file ? null : await servir();
  const alvos = paginas.map((pagina) => ({
    pagina,
    url: servidor
      ? new URL(pagina.saida, servidor.url).href
      : pathToFileURL(join(RAIZ, "dist", pagina.saida)).href,
  }));
  console.log(`Capturando ${alvos.map((a) => a.url).join(", ")}`);
  const nomes = args.navegadores.length ? args.navegadores : Object.keys(NAVEGADORES);
  const problemas = [];
  try {
    for (const nome of nomes) {
      if (!(nome in NAVEGADORES)) throw new Error(`Navegador desconhecido: ${nome}`);
      problemas.push(...(await rodarNavegador(nome, alvos, args)));
    }
  } finally {
    await servidor?.fechar();
  }
  if (problemas.length) {
    console.error(`\n${problemas.length} problema(s):\n  ${problemas.join("\n  ")}`);
    process.exit(1);
  }
  console.log("\nSem erro de console, de página, de rede nem scroll horizontal.");
}

main().catch((erro) => {
  console.error(`\nCaptura falhou: ${erro?.stack ?? String(erro)}`);
  process.exit(1);
});
