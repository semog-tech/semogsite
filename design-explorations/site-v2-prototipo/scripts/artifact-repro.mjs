/* Reprodução local do Artifact do claude.ai (rode depois do build).
   O host embrulha dist/index.html (documento completo, com doctype) dentro do <body> de um
   esqueleto próprio, com reset de fonte/fundo e padding de safe-area no :root, e serve a
   página num iframe com sandbox, de outra origem, ao lado de app.js, app.css e assets/.
   Aqui: origem "conteúdo" serve o documento embrulhado e os arquivos de dist/; origem
   "host" serve a moldura com o iframe. Fontes, imagens, app.js e app.css chegam com atraso
   (1 a 3 s, via Playwright route) para imitar a primeira carga lenta.
   Rola a página inteira com a roda do mouse (o caminho do Lenis), um quadro a cada ~60vh:
     capturas/artifact/<navegador>-<nn>.png
   e registra, por quadro, o estado das cenas (pins, canvas da 02). Sai com código 1 se
   houver erro de console/página ou se a cena 02 não tiver canvas medido e barras pintadas.
   Opções: --navegador chromium|firefox (padrão: os dois), --sem-atraso, --atraso 1000-3000,
           --moldura 1493.6x1102.4, --dpr 1.25, --janela (com janela, barra de rolagem real),
           --quadros <n> (para depois de n quadros), --rolar-cedo <px> (rola até <px> antes de o app.js chegar, como quem não espera a carga),
           --classe-host "<classes>" (o <html> do host já tem class: a nossa se perde). */
import { chromium, firefox } from "playwright";
import { createServer } from "node:http";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
// REPRO_DIST aponta outro build (ex.: um dist antigo, para o antes/depois).
const DIST = process.env.REPRO_DIST ?? join(RAIZ, "dist");
const PASTA = process.env.REPRO_SAIDA ?? join(RAIZ, "capturas", "artifact");
const VIEWPORT = { width: 1520, height: 1130 };
const SANDBOX = "allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups";
const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".map": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

function lerArgs(argv) {
  // Moldura e DPR medidos no claude.ai (Chrome do Leandro, Windows a 125%): o iframe tem
  // tamanho fracionário, 1493,6 × 1102,4 px CSS.
  const args = {
    navegadores: [],
    atraso: [1000, 3000],
    classeHost: "",
    moldura: [1493.6, 1102.4],
    dpr: 1.25,
  };
  const fila = [...argv];
  while (fila.length) {
    const opcao = fila.shift();
    if (opcao === "--sem-atraso") {
      args.atraso = null;
      continue;
    }
    if (opcao === "--janela") {
      args.janela = true;
      continue;
    }
    const valor = fila.shift();
    if (valor === undefined) throw new Error(`Falta o valor de ${opcao}.`);
    if (opcao === "--navegador") args.navegadores.push(valor);
    else if (opcao === "--classe-host") args.classeHost = valor;
    else if (opcao === "--atraso") args.atraso = valor.split("-").map(Number);
    else if (opcao === "--moldura") args.moldura = valor.split("x").map(Number);
    else if (opcao === "--dpr") args.dpr = Number(valor);
    else if (opcao === "--rolar-cedo") args.rolarCedo = Number(valor);
    else if (opcao === "--quadros") args.quadros = Number(valor);
    else throw new Error(`Opção desconhecida: ${opcao}`);
  }
  return args;
}

/** O esqueleto do host, com o nosso documento inteiro dentro do <body>. */
function embrulhar(classeHost) {
  const nosso = readFileSync(join(DIST, "index.html"), "utf8");
  const classe = classeHost ? ` class="${classeHost}"` : "";
  return `<!doctype html>
<html${classe}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>
:root{color-scheme:light;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)}
body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#faf9f5;color:#141413}
img{max-width:100%}
[hidden]:not([hidden=until-found i]){display:none!important}
</style>
</head>
<body>
${nosso}
</body>
</html>`;
}

/** Servidor numa porta livre (0 = o sistema escolhe). @param {(url: string) => Promise<{ tipo: string, corpo: string | Buffer } | null>} responder */
function subir(responder) {
  return new Promise((resolver, rejeitar) => {
    const servidor = createServer((req, res) => {
      responder(req.url ?? "/")
        .then((r) => {
          if (!r) res.writeHead(404).end("Não encontrado");
          else
            res
              .writeHead(200, { "Content-Type": r.tipo, "Cache-Control": "no-store" })
              .end(r.corpo);
        })
        .catch((erro) => {
          console.error("[repro] falha servindo", req.url, erro);
          if (!res.headersSent) res.writeHead(500).end("Erro interno");
        });
    });
    servidor.once("error", rejeitar);
    servidor.listen(0, "127.0.0.1", () => {
      const endereco = servidor.address();
      if (!endereco || typeof endereco === "string") return rejeitar(new Error("Sem porta."));
      resolver({
        url: `http://127.0.0.1:${endereco.port}/`,
        fechar: () => new Promise((ok) => servidor.close(() => ok(undefined))),
      });
    });
  });
}

async function subirServidores({ classeHost, moldura: [largura, altura] }) {
  const conteudo = await subir(async (url) => {
    const caminho = decodeURIComponent(new URL(url, "http://x").pathname);
    if (caminho === "/") return { tipo: TIPOS[".html"], corpo: embrulhar(classeHost) };
    const absoluto = normalize(join(DIST, caminho));
    if (!absoluto.startsWith(normalize(DIST))) return null;
    try {
      return {
        tipo: TIPOS[extname(absoluto)] ?? "application/octet-stream",
        corpo: await readFile(absoluto),
      };
    } catch {
      return null; // ausente: 404, e o ouvido de requestfailed/console acusa.
    }
  });
  const host = await subir(async (url) => {
    if (new URL(url, "http://x").pathname !== "/") return null;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>host</title>
<style>html,body{margin:0;height:100%;overflow:hidden}iframe{border:0;width:${largura}px;height:${altura}px;display:block}</style>
</head><body><iframe id="artifact" sandbox="${SANDBOX}" src="${conteudo.url}"></iframe></body></html>`;
    return { tipo: TIPOS[".html"], corpo: html };
  });
  return { conteudo, host };
}

/** Atraso de min a max ms em fontes, imagens, app.js e app.css (determinístico por URL). */
async function atrasar(contexto, [min, max]) {
  await contexto.route(/\.(woff2|jpg|png|webp|svg|js|css)(\?|$)/, async (rota) => {
    const url = rota.request().url();
    let soma = 0;
    for (const c of url) soma = (soma * 31 + c.charCodeAt(0)) >>> 0;
    const ms = min + (soma % (max - min + 1));
    await new Promise((ok) => setTimeout(ok, ms));
    await rota.continue();
  });
}

/** O iframe do artifact, assim que ele existir. @param {import("playwright").Page} pagina */
async function esperarQuadro(pagina) {
  for (let i = 0; i < 200; i++) {
    const quadro = pagina
      .frames()
      .find((f) => f !== pagina.mainFrame() && f.url().startsWith("http"));
    if (quadro) return quadro;
    await pagina.waitForTimeout(50);
  }
  throw new Error("iframe do artifact não carregou.");
}

/** Estado das cenas, lido dentro do iframe. */
function lerEstado(quadro) {
  return quadro.evaluate(() => {
    const raiz = document.documentElement;
    const canvas = document.querySelector("#condominios .cond-campo");
    // __repro é posto pelo addInitScript; o tipo do window não o conhece.
    const contagem = /** @type {{ montagens: number, resizes: number, lendo: boolean }} */ (
      Reflect.get(window, "__repro")
    );
    contagem.lendo = true;
    let pintado = -1;
    if (canvas instanceof HTMLCanvasElement && canvas.width > 1 && canvas.height > 1) {
      const c = canvas.getContext("2d");
      const d = c?.getImageData(0, 0, canvas.width, canvas.height).data;
      pintado = 0;
      if (d) for (let i = 3; i < d.length; i += 4 * 97) if (d[i] > 0) pintado++;
    }
    contagem.lendo = false;
    const pins = [...document.querySelectorAll(".pin-spacer")].map(
      (s) =>
        `${s.firstElementChild?.closest("section")?.id ?? "?"}:${Math.round(s.getBoundingClientRect().height)}`,
    );
    return {
      y: Math.round(window.scrollY),
      janela: `${window.innerWidth}x${window.innerHeight}`,
      montagens: contagem.montagens,
      resizes: contagem.resizes,
      alturaDoc: raiz.scrollHeight,
      alturaJanela: window.innerHeight,
      classesHtml: raiz.className,
      cond: {
        classes: document.getElementById("condominios")?.className,
        erro: document.getElementById("condominios")?.dataset.cenaErro !== undefined,
        canvas:
          canvas instanceof HTMLCanvasElement ? `${canvas.width}x${canvas.height}` : "ausente",
        pintado,
      },
      pins,
    };
  });
}

async function rodar(nome, tipo, urlHost, args, problemas) {
  // --janela abre o navegador com janela: o headless esconde a barra de rolagem clássica
  // do Windows (15 px), que o Chrome de verdade mostra.
  const navegador = await tipo.launch({
    headless: !args.janela,
    args: nome === "chromium" ? ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] : [],
  });
  try {
    const contexto = await navegador.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: args.dpr,
    });
    if (args.atraso) await atrasar(contexto, args.atraso);
    // Conta, dentro do iframe, quantas vezes a página pede o contexto do canvas da 02 (um por
    // montagem, a cada ScrollTrigger refresh) e quantos resize a janela recebe.
    await contexto.addInitScript(() => {
      const contagem = { montagens: 0, resizes: 0 };
      Object.assign(window, { __repro: contagem });
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (...a) {
        if (this.classList.contains("cond-campo") && !contagem.lendo) contagem.montagens++;
        return original.apply(this, a);
      };
      window.addEventListener("resize", () => contagem.resizes++);
    });
    const pagina = await contexto.newPage();
    pagina.on(
      "console",
      (m) => m.type() === "error" && problemas.push(`${nome} console: ${m.text()}`),
    );
    pagina.on("pageerror", (e) => problemas.push(`${nome} página: ${e.message}`));
    pagina.on("requestfailed", (r) => problemas.push(`${nome} requisição: ${r.url()}`));
    await pagina.goto(urlHost, { waitUntil: args.rolarCedo ? "commit" : "load", timeout: 60000 });
    const quadro = await esperarQuadro(pagina);
    if (args.rolarCedo) {
      // Quem abre o artifact rola enquanto a primeira carga (lenta) ainda não trouxe o app.js.
      await quadro.waitForSelector("#condominios", { state: "attached" });
      await quadro.evaluate((y) => window.scrollTo(0, y), args.rolarCedo);
    }
    await quadro.waitForFunction(
      () => document.documentElement.classList.contains("motion"),
      null,
      {
        timeout: 20000,
      },
    );
    await pagina.waitForTimeout(1500);
    mkdirSync(PASTA, { recursive: true });
    const log = [];
    let melhorCond = { pintado: -1, canvas: "" };
    for (let n = 0; n < (args.quadros ?? 120); n++) {
      const estado = await lerEstado(quadro);
      if (estado.cond.pintado > melhorCond.pintado) melhorCond = estado.cond;
      log.push(`${String(n).padStart(2, "0")} ${JSON.stringify(estado)}`);
      await pagina.screenshot({ path: join(PASTA, `${nome}-${String(n).padStart(2, "0")}.png`) });
      if (estado.y + estado.alturaJanela >= estado.alturaDoc - 2) break;
      await pagina.mouse.move(VIEWPORT.width / 2, VIEWPORT.height / 2);
      await pagina.mouse.wheel(0, Math.round(estado.alturaJanela * 0.6));
      await pagina.waitForTimeout(1300);
    }
    console.log(`\n${nome}:\n  ${log.join("\n  ")}`);
    if (melhorCond.pintado <= 0 && !args.rolarCedo) {
      problemas.push(`${nome}: cena 02 sem barras pintadas (canvas ${melhorCond.canvas}).`);
    }
    await contexto.close();
  } finally {
    await navegador.close();
  }
}

async function main() {
  const args = lerArgs(process.argv.slice(2));
  rmSync(PASTA, { recursive: true, force: true });
  const { conteudo, host } = await subirServidores(args);
  const problemas = [];
  try {
    const nomes = args.navegadores.length ? args.navegadores : ["chromium", "firefox"];
    for (const nome of nomes) {
      const tipo = { chromium, firefox }[nome];
      if (!tipo) throw new Error(`Navegador desconhecido: ${nome}`);
      await rodar(nome, tipo, host.url, args, problemas);
    }
  } finally {
    await conteudo.fechar();
    await host.fechar();
  }
  if (problemas.length) {
    console.error(`\n${problemas.length} problema(s):\n  ${problemas.join("\n  ")}`);
    process.exit(1);
  }
  console.log("\nSem erro; a cena 02 pintou barras.");
}

main().catch((erro) => {
  console.error(`\nReprodução falhou: ${erro?.stack ?? String(erro)}`);
  process.exit(1);
});
