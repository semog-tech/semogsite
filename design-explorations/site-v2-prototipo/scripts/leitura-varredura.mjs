/* Verificação das páginas de leitura (rode depois do build). Para cada página com
   "pacote": "leitura" em src/paginas.json, Chromium e Firefox, 1440 e 390:
   - print da página inteira em capturas/leitura-varredura/<navegador>/<página>-<largura>.png;
   - erro de console, de página ou de rede, e scroll horizontal;
   - varredura de telas vazias: a página é percorrida em passos de uma tela e cada passo
     precisa ter algum texto, foto ou campo visível abaixo do header;
   - nos artigos: corpo do texto (px) e caracteres por linha (mediana dos parágrafos com
     3+ linhas); a barra de progresso vai de 0 a 1;
   - no índice do blog: o filtro "Finanças" deixa só os posts de Finanças;
   - links internos do índice e do "Leia também" abrem uma página existente.
   Por HTTP e por file:// (--file). Impressão do post em PDF (Chromium) com --pdf.
   Sai com código 1 se algo falhar. */
import { chromium, firefox } from "playwright";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { servir } from "../serve.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const PASTA = join(RAIZ, "capturas", "leitura-varredura");
const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
];
const NAVEGADORES = { chromium, firefox };
const args = process.argv.slice(2);
const PORFILE = args.includes("--file");

const paginas = JSON.parse(readFileSync(join(RAIZ, "src", "paginas.json"), "utf8")).filter(
  (p) => p.pacote === "leitura",
);

function ouvirErros(pagina) {
  const erros = [];
  pagina.on("console", (msg) => msg.type() === "error" && erros.push(`console: ${msg.text()}`));
  pagina.on("pageerror", (erro) => erros.push(`página: ${erro.message}`));
  pagina.on("requestfailed", (req) =>
    erros.push(`requisição: ${req.url()} (${req.failure()?.errorText ?? "?"})`),
  );
  return erros;
}

/** Passos de uma tela sem nada visível abaixo do header. */
function telasVazias(pagina) {
  return pagina.evaluate(async () => {
    const cab = document.querySelector("[data-cabecalho]")?.getBoundingClientRect().height ?? 0;
    const alvos = Array.from(
      document.querySelectorAll("main :is(p, h1, h2, h3, li, img, video, input, select, a)"),
    );
    const vazias = [];
    const altura = document.documentElement.scrollHeight;
    for (let y = 0; y < altura - 10; y += window.innerHeight) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
      const algum = alvos.some((el) => {
        const r = el.getBoundingClientRect();
        const estilo = getComputedStyle(el);
        return (
          r.bottom > cab + 20 &&
          r.top < window.innerHeight - 20 &&
          r.width > 0 &&
          r.height > 0 &&
          estilo.visibility !== "hidden" &&
          Number(estilo.opacity) > 0.05
        );
      });
      const noRodape =
        (document.querySelector(".rodape")?.getBoundingClientRect().top ?? Infinity) <
        window.innerHeight * 0.5;
      if (!algum && !noRodape) vazias.push(y);
    }
    window.scrollTo(0, 0);
    return vazias;
  });
}

/** Corpo do texto e caracteres por linha nos parágrafos do artigo. */
function medirLinhas(pagina) {
  return pagina.evaluate(() => {
    const corpo = document.querySelector("[data-corpo-leitura]");
    if (!corpo) return null;
    const medidas = [];
    // Conta caractere a caractere em que linha cada um caiu; vale só a linha cheia (a
    // última de cada parágrafo fica de fora).
    for (const p of corpo.querySelectorAll(":scope > p")) {
      const porLinha = new Map();
      const andar = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
      for (let no = andar.nextNode(); no; no = andar.nextNode()) {
        for (let i = 0; i < no.length; i++) {
          const range = document.createRange();
          range.setStart(no, i);
          range.setEnd(no, i + 1);
          const r = range.getClientRects()[0];
          if (!r) continue;
          const linha = Math.round(r.top / 4);
          porLinha.set(linha, (porLinha.get(linha) ?? 0) + 1);
        }
      }
      const contagens = [...porLinha.entries()].sort((a, b) => a[0] - b[0]).map((e) => e[1]);
      medidas.push(...contagens.slice(0, -1));
    }
    medidas.sort((a, b) => a - b);
    const p = corpo.querySelector("p");
    const estilo = p ? getComputedStyle(p) : null;
    return {
      corpoPx: estilo ? parseFloat(estilo.fontSize) : 0,
      entrelinha: estilo ? parseFloat(estilo.lineHeight) / parseFloat(estilo.fontSize) : 0,
      fonte: estilo?.fontFamily ?? "",
      larguraPx: Math.round(corpo.getBoundingClientRect().width),
      paragrafos: medidas.length,
      caracteresPorLinha: medidas.length ? Math.round(medidas[Math.floor(medidas.length / 2)]) : 0,
      minimo: Math.round(medidas[0] ?? 0),
      maximo: Math.round(medidas.at(-1) ?? 0),
    };
  });
}

async function progresso(pagina) {
  return pagina.evaluate(async () => {
    const barra = document.querySelector("[data-progresso]");
    if (!barra) return null;
    const ler = () => new DOMMatrix(getComputedStyle(barra).transform).a;
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 200));
    const inicio = ler();
    const corpo = document.querySelector("[data-corpo-leitura]").getBoundingClientRect();
    window.scrollTo(0, corpo.bottom + window.scrollY - window.innerHeight + 2);
    await new Promise((r) => setTimeout(r, 200));
    const fim = ler();
    window.scrollTo(0, 0);
    return { inicio, fim };
  });
}

async function filtro(pagina) {
  return pagina.evaluate(async () => {
    const link = document.querySelector('.bi-filtro[href="#categoria-financas"]');
    if (!link) return { erro: "sem filtro Finanças" };
    link.click();
    await new Promise((r) => setTimeout(r, 400));
    const visiveis = Array.from(document.querySelectorAll(".bi-item")).filter(
      (li) => li.getBoundingClientRect().height > 0,
    );
    const categorias = [...new Set(visiveis.map((li) => li.dataset.categoria))];
    location.hash = "#todos";
    await new Promise((r) => setTimeout(r, 300));
    const todos = Array.from(document.querySelectorAll(".bi-item")).filter(
      (li) => li.getBoundingClientRect().height > 0,
    ).length;
    return { financas: visiveis.length, categorias, todos };
  });
}

function linksInternos(pagina) {
  return pagina.evaluate(() =>
    Array.from(
      document.querySelectorAll(".bi-lista a, #leia-tambem a, .rodape-legal a, .nav a"),
      (a) => a.getAttribute("href"),
    ).filter((h) => h && !/^(https?:|mailto:|#)/.test(h)),
  );
}

async function rodar(nome, base) {
  const navegador = await NAVEGADORES[nome].launch(
    nome === "chromium" ? { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } : {},
  );
  const problemas = [];
  const relatorio = [];
  try {
    for (const viewport of VIEWPORTS) {
      for (const p of paginas) {
        const contexto = await navegador.newContext({ viewport });
        const pagina = await contexto.newPage();
        const erros = ouvirErros(pagina);
        const marca = `[${nome} ${viewport.width} ${p.saida}]`;
        await pagina.goto(new URL(p.saida, base).href, { waitUntil: "load" });
        await pagina.waitForFunction(() => document.documentElement.classList.contains("motion"));
        await pagina.waitForTimeout(1300);
        const vazias = await telasVazias(pagina);
        if (vazias.length) problemas.push(`${marca} telas vazias em y=${vazias.join(", ")}`);
        const linhas = await medirLinhas(pagina);
        const barra = await progresso(pagina);
        if (barra && (barra.inicio > 0.01 || barra.fim < 0.98)) {
          problemas.push(`${marca} progresso ${JSON.stringify(barra)}`);
        }
        if (p.saida === "blog.html") {
          const f = await filtro(pagina);
          relatorio.push(`${marca} filtro ${JSON.stringify(f)}`);
          if (f.financas !== 3 || f.categorias.join() !== "financas" || f.todos !== 12) {
            problemas.push(`${marca} filtro ${JSON.stringify(f)}`);
          }
        }
        for (const href of await linksInternos(pagina)) {
          const alvo = href.split("#")[0];
          if (alvo && !existsSync(join(RAIZ, "dist", alvo))) {
            problemas.push(`${marca} link para ${href} sem página`);
          }
        }
        if (linhas)
          relatorio.push(`${marca} ${JSON.stringify(linhas)} progresso ${JSON.stringify(barra)}`);
        if (await pagina.evaluate(() => document.documentElement.scrollWidth > innerWidth)) {
          problemas.push(`${marca} scroll horizontal`);
        }
        const pasta = join(PASTA, PORFILE ? `${nome}-file` : nome);
        mkdirSync(pasta, { recursive: true });
        await pagina.screenshot({
          path: join(pasta, `${p.saida.replace(".html", "")}-${viewport.width}.png`),
          fullPage: true,
        });
        problemas.push(...erros.map((e) => `${marca} ${e}`));
        await contexto.close();
      }
    }
    if (nome === "chromium" && args.includes("--pdf")) {
      const contexto = await navegador.newContext();
      const pagina = await contexto.newPage();
      for (const p of paginas.filter((x) => x.saida.startsWith("blog-") || x.id === "termos")) {
        await pagina.goto(new URL(p.saida, base).href, { waitUntil: "load" });
        await pagina.waitForTimeout(4000); // as fotos adiadas passam a eager 2 s depois da carga
        await pagina.emulateMedia({ media: "print" });
        await pagina.waitForLoadState("networkidle");
        mkdirSync(PASTA, { recursive: true });
        await pagina.pdf({
          path: join(PASTA, `${p.saida.replace(".html", "")}.pdf`),
          format: "A4",
        });
      }
      await contexto.close();
    }
  } finally {
    await navegador.close();
  }
  return { problemas, relatorio };
}

async function main() {
  const servidor = PORFILE ? null : await servir();
  const base = servidor ? servidor.url : pathToFileURL(join(RAIZ, "dist") + "/").href;
  const problemas = [];
  try {
    for (const nome of Object.keys(NAVEGADORES)) {
      const r = await rodar(nome, base);
      console.log(r.relatorio.join("\n"));
      problemas.push(...r.problemas);
    }
  } finally {
    await servidor?.fechar();
  }
  if (problemas.length) {
    console.error(`\n${problemas.length} problema(s):\n  ${problemas.join("\n  ")}`);
    process.exit(1);
  }
  console.log(`\nLeitura ok (${PORFILE ? "file://" : "HTTP"}): sem erro, sem tela vazia.`);
}

main().catch((erro) => {
  console.error(erro?.stack ?? String(erro));
  process.exit(1);
});
