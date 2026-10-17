/* Verificação das landings de cidade (rode depois do build). Para cada landing do
   paginas.json ("landing": true), em Chromium e Firefox, 1440×900 e 390×844, por HTTP:
   - formulário acima da dobra: o botão "Continuar" termina dentro da primeira tela;
   - o estado da cidade vem escolhido e a cidade da etapa 2 vem preenchida;
   - as duas etapas com clique de mouse por coordenada (locator.click rolaria a página):
     erro com campos vazios, etapa 1 válida, etapa 2, aviso de demonstração, e a página
     não rola sozinha no caminho;
   - peso do que a página baixa na carga (HTML, CSS, JS, fontes, imagens) e no total
     depois de rolar até o fim;
   - LCP (Chromium) e CLS acumulado na carga e na rolagem;
   - varredura de telas vazias: a página é rolada uma tela por vez; em cada parada há
     conteúdo visível, e o print vai para capturas/cidade-varredura/.
   Sai com código 1 se algo falhar (inclui erro de console, de página e de rede).
   Opções: --navegador chromium|firefox (padrão: os dois), --pagina <id> (pode repetir). */
import { chromium, firefox } from "playwright";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "../serve.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const SAIDA = join(RAIZ, "capturas", "cidade-varredura");
const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
];
const NAVEGADORES = { chromium, firefox };
const DEMO_FINAL = "Demonstração: nada foi enviado.";

function lerArgs(argv) {
  const args = { navegadores: [], paginas: [] };
  for (let i = 0; i < argv.length; i += 2) {
    const [opcao, valor] = [argv[i], argv[i + 1]];
    if (valor === undefined) throw new Error(`Falta o valor de ${opcao}.`);
    if (opcao === "--navegador") args.navegadores.push(valor);
    else if (opcao === "--pagina") args.paginas.push(valor);
    else throw new Error(`Opção desconhecida: ${opcao}`);
  }
  return args;
}

function landings(args) {
  const paginas = JSON.parse(readFileSync(join(RAIZ, "src", "paginas.json"), "utf8"));
  const conteudo = JSON.parse(readFileSync(join(RAIZ, "src", "conteudo.json"), "utf8"));
  return paginas
    .filter((p) => p.landing && (!args.paginas.length || args.paginas.includes(p.id)))
    .map((p) => {
      const cidade = conteudo.cidades[p.dados.split(".")[1]];
      return { id: p.id, saida: p.saida, uf: cidade.uf, nome: cidade.nome };
    });
}

/** @param {string} origem só o que vem dela conta no peso (o antivírus desta máquina injeta script no Firefox) */
function ouvir(pagina, origem) {
  const erros = [];
  const bytes = { carga: new Map(), total: new Map() };
  let carregou = false;
  pagina.on("console", (m) => m.type() === "error" && erros.push(`console: ${m.text()}`));
  pagina.on("pageerror", (e) => erros.push(`página: ${e.message}`));
  pagina.on("requestfailed", (r) => erros.push(`rede: ${r.url()} (${r.failure()?.errorText})`));
  pagina.on("response", async (resposta) => {
    if (!resposta.url().startsWith(origem)) return;
    try {
      const corpo = await resposta.body();
      const tipo = resposta.request().resourceType();
      for (const mapa of carregou ? [bytes.total] : [bytes.carga, bytes.total]) {
        mapa.set(tipo, (mapa.get(tipo) ?? 0) + corpo.length);
      }
    } catch {
      // Resposta sem corpo (redirecionamento, 204): não conta peso.
    }
  });
  return { erros, bytes, marcarCarga: () => (carregou = true) };
}

/** Liga os observadores de LCP e CLS antes de qualquer script da página. */
async function observarVitais(contexto) {
  await contexto.addInitScript(() => {
    const v = { lcp: 0, lcpAlvo: "", cls: 0, deslocou: [] };
    Object.defineProperty(window, "__vitais", { value: v });
    try {
      new PerformanceObserver((lista) => {
        for (const e of lista.getEntries()) {
          v.lcp = e.startTime;
          const el = e.element;
          v.lcpAlvo = el ? `${el.tagName.toLowerCase()}.${el.className}` : "(removido)";
        }
      }).observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      v.lcp = -1; // Navegador sem LCP (Firefox): informado como indisponível.
    }
    try {
      new PerformanceObserver((lista) => {
        for (const e of lista.getEntries()) {
          if (e.hadRecentInput) continue;
          v.cls += e.value;
          // Quem se moveu e quando: o que explica um CLS acima de zero.
          for (const fonte of e.sources ?? []) {
            const n = fonte.node;
            const nome = n?.nodeType === 1 ? `${n.tagName.toLowerCase()}.${n.className}` : "#texto";
            v.deslocou.push(`${nome}@${Math.round(e.startTime)}ms`);
          }
        }
      }).observe({ type: "layout-shift", buffered: true });
    } catch {
      v.cls = -1;
    }
  });
}

async function centro(pagina, seletor) {
  const caixa = await pagina.locator(seletor).first().boundingBox();
  if (!caixa) throw new Error(`${seletor} sem caixa (invisível?).`);
  return { x: caixa.x + caixa.width / 2, y: caixa.y + caixa.height / 2, caixa };
}

async function clicar(pagina, seletor) {
  const { x, y } = await centro(pagina, seletor);
  await pagina.mouse.click(x, y);
}

async function digitar(pagina, seletor, texto) {
  await clicar(pagina, seletor);
  await pagina.keyboard.type(texto, { delay: 12 });
}

/** Dobra, estado e cidade pré-preenchidos. */
async function conferirDobra(pagina, alvo, viewport, falhas) {
  const botao = await centro(pagina, '#proposta .fp-etapa[data-etapa="1"] button[type="submit"]');
  const fundo = Math.round(botao.caixa.y + botao.caixa.height);
  const uf = await pagina.inputValue("#cidade-uf");
  const cidade = await pagina.inputValue("#cidade-cidade");
  if (fundo > viewport.height)
    falhas.push(`"Continuar" termina em ${fundo}px (dobra ${viewport.height})`);
  if (uf !== alvo.uf) falhas.push(`estado ${uf || "vazio"}, esperado ${alvo.uf}`);
  if (cidade !== alvo.nome) falhas.push(`cidade "${cidade}", esperada "${alvo.nome}"`);
  return { continuarAte: fundo, uf, cidade };
}

/** As duas etapas por clique real. */
async function exercitarEtapas(pagina, falhas) {
  const y0 = await pagina.evaluate(() => window.scrollY);
  await clicar(pagina, '#proposta .fp-etapa[data-etapa="1"] button[type="submit"]');
  await pagina.waitForTimeout(300);
  const erroVazio = await pagina.textContent("#cidade-condominio-erro");
  if (!erroVazio) falhas.push("etapa 1 vazia não mostrou erro");
  await digitar(pagina, "#cidade-condominio", "Condomínio de teste");
  await digitar(pagina, "#cidade-telefone", "81999998888");
  await clicar(pagina, '#proposta .fp-etapa[data-etapa="1"] button[type="submit"]');
  await pagina.waitForTimeout(1500);
  const etapa = await pagina.getAttribute("#proposta", "data-etapa-ativa");
  if (etapa !== "2") falhas.push(`etapa ativa ${etapa} depois de "Continuar"`);
  await digitar(pagina, "#cidade-nome", "Pessoa de teste");
  await clicar(pagina, '#proposta input[name="perfil"][value="sindico"]');
  await clicar(pagina, '#proposta input[name="cliente"][value="nao"]');
  await clicar(pagina, '#proposta .fp-etapa[data-etapa="2"] button[type="submit"]');
  await pagina.waitForTimeout(300);
  const status = (await pagina.textContent("#proposta [data-status]"))?.trim();
  if (status !== DEMO_FINAL) falhas.push(`status final "${status}"`);
  const y1 = await pagina.evaluate(() => window.scrollY);
  if (Math.abs(y1 - y0) > 1) falhas.push(`a página rolou sozinha (${y0} → ${y1})`);
  return { erroVazio, etapa, status, rolou: y1 - y0 };
}

/** Do fim da página, o "Pedir proposta" do header leva ao formulário e põe o foco nele. */
async function conferirAtalho(pagina, falhas) {
  await clicar(pagina, ".cab-proposta");
  await pagina.waitForTimeout(1800);
  const r = await pagina.evaluate(() => ({
    topo: Math.round(document.getElementById("proposta").getBoundingClientRect().top),
    foco: document.activeElement?.id ?? "",
  }));
  if (r.topo < 0 || r.topo > innerHeightLimite(pagina))
    falhas.push(`atalho: formulário em ${r.topo}px`);
  if (!r.foco.startsWith("cidade-")) falhas.push(`atalho: foco em "${r.foco}"`);
  return r;
}

/** Metade da altura da janela: o formulário precisa chegar à metade de cima. */
function innerHeightLimite(pagina) {
  return Math.round((pagina.viewportSize()?.height ?? 0) / 2);
}

/** Rola uma tela por vez; em cada parada, conteúdo visível e print. */
async function varrer(pagina, nome, alvo, viewport, falhas) {
  const altura = await pagina.evaluate(() => document.documentElement.scrollHeight);
  const vazias = [];
  let passo = 0;
  for (let y = 0; y < altura; y += viewport.height, passo++) {
    await pagina.evaluate((alvoY) => window.scrollTo(0, alvoY), y);
    await pagina.waitForTimeout(1300);
    const visiveis = await pagina.evaluate(() => {
      const seletor =
        "main h1, main h2, main h3, main p, main li, main dd, main img, main summary, main blockquote, footer a";
      let n = 0;
      for (const el of document.querySelectorAll(seletor)) {
        const r = el.getBoundingClientRect();
        if (r.bottom < 68 || r.top > innerHeight || r.width === 0 || r.height === 0) continue;
        const estilo = getComputedStyle(el);
        if (estilo.visibility === "hidden" || Number(estilo.opacity) === 0) continue;
        n++;
      }
      return n;
    });
    if (visiveis === 0) vazias.push(y);
    const pasta = join(SAIDA, nome, alvo.id);
    mkdirSync(pasta, { recursive: true });
    await pagina.screenshot({
      path: join(pasta, `${viewport.width}-${String(passo).padStart(2, "0")}.png`),
    });
  }
  if (vazias.length) falhas.push(`telas vazias em y=${vazias.join(", ")}`);
  return { paradas: passo, vazias };
}

async function verificar(navegador, nome, alvo, viewport, url) {
  const contexto = await navegador.newContext({ viewport });
  await observarVitais(contexto);
  const pagina = await contexto.newPage();
  const { erros, bytes, marcarCarga } = ouvir(pagina, new URL(url).origin);
  const falhas = [];
  try {
    await pagina.goto(url, { waitUntil: "load" });
    await pagina.waitForTimeout(1500);
    marcarCarga();
    const dobra = await conferirDobra(pagina, alvo, viewport, falhas);
    const etapas = await exercitarEtapas(pagina, falhas);
    const varredura = await varrer(pagina, nome, alvo, viewport, falhas);
    const atalho = await conferirAtalho(pagina, falhas);
    const vitais = await pagina.evaluate(() => window.__vitais);
    const horizontal = await pagina.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    if (horizontal) falhas.push("scroll horizontal");
    const kb = (mapa) => Object.fromEntries([...mapa].map(([t, b]) => [t, Math.round(b / 1024)]));
    const soma = (mapa) => Math.round([...mapa.values()].reduce((a, b) => a + b, 0) / 1024);
    return {
      rotulo: `${nome} ${alvo.id} ${viewport.width}`,
      dobra,
      etapas,
      varredura,
      atalho,
      vitais,
      pesoCargaKB: soma(bytes.carga),
      pesoCarga: kb(bytes.carga),
      pesoTotalKB: soma(bytes.total),
      falhas: [...erros, ...falhas],
    };
  } finally {
    await contexto.close();
  }
}

async function main() {
  const args = lerArgs(process.argv.slice(2));
  const alvos = landings(args);
  if (!alvos.length) throw new Error("Nenhuma landing no paginas.json.");
  const servidor = await servir();
  const resultados = [];
  try {
    for (const nome of args.navegadores.length ? args.navegadores : Object.keys(NAVEGADORES)) {
      const navegador = await NAVEGADORES[nome].launch(
        nome === "chromium"
          ? { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] }
          : {},
      );
      try {
        for (const alvo of alvos) {
          for (const viewport of VIEWPORTS) {
            const url = new URL(alvo.saida, servidor.url).href;
            const r = await verificar(navegador, nome, alvo, viewport, url);
            resultados.push(r);
            const lcp =
              r.vitais.lcp < 0 ? "n/d" : `${Math.round(r.vitais.lcp)}ms (${r.vitais.lcpAlvo})`;
            const cls = r.vitais.cls < 0 ? "n/d" : r.vitais.cls.toFixed(4);
            console.log(
              `${r.rotulo}: Continuar até ${r.dobra.continuarAte}px · UF ${r.dobra.uf} · cidade ${r.dobra.cidade}` +
                ` · etapas ok=${r.etapas.status === DEMO_FINAL} · LCP ${lcp} · CLS ${cls}` +
                ` · carga ${r.pesoCargaKB} KB ${JSON.stringify(r.pesoCarga)} · total ${r.pesoTotalKB} KB` +
                ` · ${r.varredura.paradas} telas · atalho → ${r.atalho.topo}px, foco ${r.atalho.foco}` +
                (r.vitais.deslocou?.length
                  ? `
   deslocou: ${r.vitais.deslocou.join(", ")}`
                  : "") +
                (r.falhas.length ? `\n   FALHAS: ${r.falhas.join(" | ")}` : ""),
            );
          }
        }
      } finally {
        await navegador.close();
      }
    }
  } finally {
    await servidor.fechar();
  }
  const comFalha = resultados.filter((r) => r.falhas.length);
  if (comFalha.length) {
    console.error(`\n${comFalha.length} combinação(ões) com falha.`);
    process.exit(1);
  }
  console.log(`\n${resultados.length} combinações sem falha.`);
}

main().catch((erro) => {
  console.error(`\nVerificação falhou: ${erro?.stack ?? String(erro)}`);
  process.exit(1);
});
