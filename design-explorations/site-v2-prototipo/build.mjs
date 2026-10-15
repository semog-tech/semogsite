/* Monta dist/: app.js (IIFE, abre por file://), app.css, uma página HTML por entrada de
   src/paginas.json (os parciais da lista "secoes" no esqueleto src/page.html, marcas
   {{caminho}} resolvidas de src/conteudo.json e {{pagina.campo}} da própria entrada) e
   src/assets. As páginas do site usam app.js e app.css; as landings de Google Ads
   ("landing": true) e as páginas leves ("leve": true: proposta, contato, 404) usam
   landing.js e landing.css, um pacote mínimo sem Lenis, pins nem as cenas das outras
   páginas. As páginas de leitura ("pacote": "leitura": blog, posts,
   Privacidade e Termos) usam leitura.js e leitura.css: header completo, rolagem nativa,
   sem GSAP; o texto delas vem de src/leitura/ (MDX) por leitura.mjs, como {{leitura.…}}.
   Também barra o que a identidade proíbe no CSS. Falha alto e claro. */
import { build } from "esbuild";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { ErroLeitura, montarLeitura } from "./leitura.mjs";

const RAIZ = dirname(fileURLToPath(import.meta.url));
const SRC = join(RAIZ, "src");
const DIST = join(RAIZ, "dist");

class ErroBuild extends Error {}

/** Lê texto normalizando CRLF → LF (o disco no Windows tem CRLF). */
function lerTexto(caminho) {
  return readFileSync(caminho, "utf8").replace(/\r\n/g, "\n");
}

function limparDist() {
  if (basename(DIST) !== "dist" || dirname(DIST) !== RAIZ) {
    throw new ErroBuild(`Caminho de saída inesperado: ${DIST}`);
  }
  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(DIST, { recursive: true });
}

/**
 * @typedef {{ id: string, arquivo: string }} Secao arquivo = "NN-nome" ou "pasta/NN-nome"
 * @typedef {Object} Pagina
 * @property {string} id vai para <main data-pagina>; o main.js escolhe as cenas por ele
 * @property {string} saida nome do HTML em dist/ ("index.html" é a home)
 * @property {string} titulo @property {string} descricao pode ter {{marcas}} do conteúdo
 * @property {string} inicio prefixo dos links para as âncoras da home ("" na própria home)
 * @property {string} rodape @property {Secao[]} secoes
 * @property {boolean} landing opcional: landing de Google Ads (pacote "landing", header enxuto)
 * @property {boolean} leve opcional: página de serviço no pacote "landing", com o header
 *   completo (proposta, contato, 404)
 * @property {string} dados opcional: caminho no conteúdo que vira {{dados.…}} nesta página
 *   (ex.: "cidades.recife"); assim uma lista de cenas serve a várias páginas
 * @property {"app" | "landing" | "leitura"} pacote nome do JS e do CSS da página: "landing"
 *   se `landing` ou `leve`; senão o declarado ("leitura") ou "app"
 * @property {string} proposta derivado: aonde levam "Seja Semog" e "Pedir proposta":
 *   "#proposta" se a página tem o pedido (a cena #proposta, ou o formulário #proposta da
 *   abertura nas landings), senão "proposta.html"
 */

const PACOTES = ["app", "landing", "leitura"];

const CAMPOS_PAGINA = ["id", "saida", "titulo", "descricao", "inicio", "rodape"];
/** Marcas {{pagina.campo}} aceitas no esqueleto: os campos obrigatórios e os derivados. */
const MARCAS_PAGINA = [...CAMPOS_PAGINA, "pacote", "proposta"];

/** @param {unknown} secoes @param {string} pagina */
function validarSecoes(secoes, pagina) {
  if (!Array.isArray(secoes) || secoes.length === 0) {
    throw new ErroBuild(`Página "${pagina}": "secoes" precisa ser uma lista não vazia.`);
  }
  const ids = new Set();
  for (const item of secoes) {
    if (
      typeof item?.id !== "string" ||
      !/^(?:[a-z0-9-]+\/)?\d{2}-[a-z0-9-]+$/.test(item?.arquivo ?? "")
    ) {
      throw new ErroBuild(`Seção inválida na página "${pagina}": ${JSON.stringify(item)}`);
    }
    if (ids.has(item.id)) throw new ErroBuild(`Id repetido na página "${pagina}": ${item.id}`);
    ids.add(item.id);
  }
}

/** @returns {Pagina[]} */
function lerPaginas() {
  const lista = JSON.parse(lerTexto(join(SRC, "paginas.json")));
  if (!Array.isArray(lista) || lista.length === 0) {
    throw new ErroBuild("src/paginas.json precisa ser uma lista não vazia de páginas.");
  }
  const saidas = new Set();
  for (const pagina of lista) {
    for (const campo of CAMPOS_PAGINA) {
      if (typeof pagina?.[campo] !== "string") {
        throw new ErroBuild(`Página sem "${campo}" em paginas.json: ${JSON.stringify(pagina?.id)}`);
      }
    }
    if (!/^[a-z0-9-]+\.html$/.test(pagina.saida) || saidas.has(pagina.saida)) {
      throw new ErroBuild(`Saída inválida ou repetida em paginas.json: ${pagina.saida}`);
    }
    saidas.add(pagina.saida);
    validarSecoes(pagina.secoes, pagina.id);
    normalizarOpcionais(pagina);
  }
  if (!saidas.has("index.html")) throw new ErroBuild("paginas.json precisa de uma index.html.");
  return lista;
}

/**
 * Campos opcionais com tipo conferido e os derivados: o pacote (ver pacoteDaPagina); o
 * destino do "Seja Semog", de a página ter ou não o pedido de proposta.
 * @param {Pagina} pagina
 */
function normalizarOpcionais(pagina) {
  pagina.landing ??= false;
  pagina.leve ??= false;
  pagina.dados ??= "";
  if (
    typeof pagina.landing !== "boolean" ||
    typeof pagina.leve !== "boolean" ||
    typeof pagina.dados !== "string"
  ) {
    throw new ErroBuild(`Página "${pagina.id}": "landing" e "leve" são booleanos; "dados", texto.`);
  }
  pagina.pacote = pacoteDaPagina(pagina);
  const temPedido = pagina.landing || pagina.secoes.some((s) => s.id === "proposta");
  pagina.proposta = temPedido ? "#proposta" : "proposta.html";
}

/**
 * "landing" para landings e páginas leves; senão o declarado ("leitura") ou "app". Declarar
 * outro pacote junto de `landing`/`leve` é contradição e falha.
 * @param {Pagina} pagina
 */
function pacoteDaPagina(pagina) {
  const declarado = pagina.pacote;
  if (pagina.landing || pagina.leve) {
    if (declarado !== undefined && declarado !== "landing") {
      throw new ErroBuild(`Página "${pagina.id}": "landing"/"leve" com pacote "${declarado}".`);
    }
    return "landing";
  }
  const pacote = declarado ?? "app";
  if (!PACOTES.includes(pacote)) {
    throw new ErroBuild(`Página "${pagina.id}": pacote "${pacote}" desconhecido.`);
  }
  return pacote;
}

/**
 * Cada cena tem os três arquivos: parcial (com o id certo), JS e CSS de mesmo nome. No
 * pacote "landing" (landings e páginas leves) e no "leitura" não há JS de cena: só o
 * pacote "app" monta cenas.
 * @param {Secao} secao @param {boolean} comJs
 */
function lerParcial({ id, arquivo }, comJs) {
  const irmaos = [`sections/${arquivo}.html`, `scenes/${arquivo}.css`];
  if (comJs) irmaos.push(`scenes/${arquivo}.js`);
  for (const irmao of irmaos) {
    if (!existsSync(join(SRC, irmao))) throw new ErroBuild(`Falta src/${irmao} da cena "${id}".`);
  }
  const html = lerTexto(join(SRC, "sections", `${arquivo}.html`));
  if (!html.includes(`id="${id}"`)) {
    throw new ErroBuild(`src/sections/${arquivo}.html não contém a <section id="${id}"> esperada.`);
  }
  return html.trimEnd();
}

/** Escapa texto para HTML (conteúdo e atributo). @param {string} texto */
function escaparHtml(texto) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const FILTROS = {
  /** 3500 → "3.500" */
  numero: (valor) => {
    if (typeof valor !== "number") throw new ErroBuild(`Filtro |numero recebeu ${typeof valor}.`);
    return valor.toLocaleString("pt-BR");
  },
};

/** Segue "a.b.0.c" dentro do contexto; caminho inexistente derruba. */
function resolverValor(contexto, caminho) {
  let atual = contexto;
  for (const parte of caminho.split(".")) {
    if (atual === null || typeof atual !== "object" || !(parte in atual)) {
      throw new ErroBuild(`Marca {{${caminho}}} não existe em src/conteudo.json.`);
    }
    atual = atual[parte];
  }
  return atual;
}

/** Como resolverValor, mas só aceita texto ou número (o que vai escrito na página). */
function resolverCaminho(contexto, caminho) {
  const atual = resolverValor(contexto, caminho);
  if (typeof atual !== "string" && typeof atual !== "number") {
    throw new ErroBuild(`Marca {{${caminho}}} aponta para algo que não é texto nem número.`);
  }
  return atual;
}

/**
 * Troca {{caminho}} e {{caminho|filtro}} pelo valor de src/conteudo.json, escapado. A
 * exceção é |html, que entra sem escapar: só para campos terminados em "Html", que são
 * o corpo já convertido por leitura.mjs (que escapa o texto do MDX).
 */
function aplicarConteudo(html, conteudo) {
  return html.replace(/\{\{([a-zA-Z0-9_.-]+)(?:\|([a-z]+))?\}\}/g, (_marca, caminho, filtro) => {
    const valor = resolverCaminho(conteudo, caminho);
    if (filtro === "html") {
      if (!caminho.endsWith("Html")) throw new ErroBuild(`|html só em campo "…Html": ${caminho}`);
      return String(valor);
    }
    if (!filtro) return escaparHtml(String(valor));
    if (!(filtro in FILTROS)) throw new ErroBuild(`Filtro desconhecido: |${filtro}`);
    return escaparHtml(FILTROS[filtro](valor));
  });
}

/* ---- Blocos ---------------------------------------------------------------------
   {{#cada lista}}…{{/cada}} repete o miolo para cada item (dentro dele, {{item.campo}} ou
   {{item}}; num bloco aninhado, o item de dentro encobre o de fora). {{#se x}}…{{/se}} só
   entra se x tiver valor (lista vazia, texto vazio e false não entram); {{#sem x}} é o
   contrário. {{#igual a b}}…{{/igual}} entra se os dois valores forem iguais e
   {{#diferente a b}}…{{/diferente}}, se não forem. Caminho
   inexistente derruba, como nas marcas. Página sem bloco sai igual à de antes. */

const ABRE_BLOCO =
  /\{\{#(cada|se|sem|igual|diferente) ([a-zA-Z0-9_.-]+)(?: ([a-zA-Z0-9_.-]+))?\}\}/;

/** @param {unknown} valor */
function temValor(valor) {
  if (Array.isArray(valor)) return valor.length > 0;
  return valor !== false && valor !== "" && valor !== null && valor !== undefined;
}

/** Índice do {{/tipo}} que fecha o bloco aberto antes de `desde` (blocos do mesmo tipo aninham). */
function fimDoBloco(html, tipo, desde) {
  const marcas = new RegExp(`\\{\\{(?:#${tipo} [^}]+|/${tipo})\\}\\}`, "g");
  marcas.lastIndex = desde;
  let nivel = 1;
  for (let m = marcas.exec(html); m; m = marcas.exec(html)) {
    nivel += m[0].startsWith("{{#") ? 1 : -1;
    if (nivel === 0) return m.index;
  }
  throw new ErroBuild(`Bloco {{#${tipo}}} sem {{/${tipo}}}.`);
}

/** @param {RegExpExecArray} abertura [marca, tipo, a, b] @param {string} miolo @param {object} contexto */
function expandirBloco([marca, tipo, a, b], miolo, contexto) {
  const comparacao = tipo === "igual" || tipo === "diferente";
  if (comparacao !== (b !== undefined)) throw new ErroBuild(`Bloco malformado: ${marca}`);
  const valor = resolverValor(contexto, a);
  if (tipo === "cada") {
    if (!Array.isArray(valor)) throw new ErroBuild(`${marca}: ${a} não é uma lista.`);
    return valor.map((item) => renderizar(miolo, { ...contexto, item })).join("");
  }
  const entra = comparacao
    ? (valor === resolverValor(contexto, b)) === (tipo === "igual")
    : temValor(valor) === (tipo === "se");
  return entra ? renderizar(miolo, contexto) : "";
}

const MARCA_DE_BLOCO = /\{\{[#/](?:cada|se|sem|igual|diferente)\b[^}]*\}\}/g;
const LINHA_SO_DE_BLOCOS = new RegExp(
  String.raw`^[ \t]*((?:${MARCA_DE_BLOCO.source}[ \t]*)+)\n`,
  "gm",
);

/**
 * Uma linha só de marcas de bloco (o Prettier junta "{{/se}} {{#sem x}}" na mesma linha)
 * some com a indentação, os espaços e a quebra: o bloco que não entra não deixa linha em
 * branco, e a página sem bloco ativo sai byte a byte como antes.
 * @param {string} html
 */
function soltarBlocos(html) {
  return html.replace(LINHA_SO_DE_BLOCOS, (_linha, marcas) =>
    marcas.match(MARCA_DE_BLOCO).join(""),
  );
}

/** Blocos e marcas, da esquerda para a direita. @param {string} html @param {object} contexto */
function renderizar(html, contexto) {
  const abertura = ABRE_BLOCO.exec(html);
  if (!abertura) return aplicarConteudo(html, contexto);
  const inicioMiolo = abertura.index + abertura[0].length;
  const fim = fimDoBloco(html, abertura[1], inicioMiolo);
  return (
    aplicarConteudo(html.slice(0, abertura.index), contexto) +
    expandirBloco(abertura, html.slice(inicioMiolo, fim), contexto) +
    renderizar(html.slice(fim + `{{/${abertura[1]}}}`.length), contexto)
  );
}

/**
 * O que as marcas da página enxergam: o conteúdo, a própria entrada (para {{#se pagina.x}})
 * e, se a página declarar "dados", o objeto apontado, como {{dados.…}}.
 * @param {Pagina} pagina @param {Record<string, unknown>} conteudo
 */
function contextoDaPagina(pagina, conteudo) {
  for (const reservado of ["pagina", "dados", "item"]) {
    if (reservado in conteudo) throw new ErroBuild(`conteudo.json não pode ter "${reservado}".`);
  }
  const dados = pagina.dados ? resolverValor(conteudo, pagina.dados) : {};
  if (dados === null || typeof dados !== "object" || Array.isArray(dados)) {
    throw new ErroBuild(`Página "${pagina.id}": "dados" precisa apontar para um objeto.`);
  }
  return { ...conteudo, pagina, dados };
}

/**
 * {{pagina.campo}} vem da entrada de paginas.json (escapado; pode trazer {{marcas}} do
 * conteúdo, resolvidas no passo seguinte). O link da página atual ganha aria-current.
 * @param {string} html @param {Pagina} pagina
 */
function aplicarPagina(html, pagina) {
  const comCampos = html.replace(/\{\{pagina\.([a-z]+)\}\}/g, (marca, campo) => {
    if (!MARCAS_PAGINA.includes(campo)) throw new ErroBuild(`Marca desconhecida: ${marca}`);
    return escaparHtml(pagina[campo]);
  });
  return comCampos.replaceAll(
    `data-pagina-link="${pagina.id}"`,
    `data-pagina-link="${pagina.id}" aria-current="page"`,
  );
}

/** @param {Pagina} pagina @param {string} esqueleto @param {unknown} conteudo */
function montarPagina(pagina, esqueleto, conteudo) {
  const contexto = contextoDaPagina(pagina, conteudo);
  const parciais = pagina.secoes.map((secao) => lerParcial(secao, pagina.pacote === "app"));
  const corpo = renderizar(soltarBlocos(parciais.join("\n\n")), contexto);
  const [antes, depois] = soltarBlocos(esqueleto)
    .split("{{secoes}}")
    .map((parte) => renderizar(aplicarPagina(parte, pagina), contexto));
  const html = antes + corpo + depois;
  const sobra = html.match(/\{\{[^}]*\}\}/);
  if (sobra) throw new ErroBuild(`Marca não resolvida em ${pagina.saida}: ${sobra[0]}`);
  writeFileSync(join(DIST, pagina.saida), html);
}

/** @param {Pagina[]} paginas */
function montarHtml(paginas) {
  const esqueleto = lerTexto(join(SRC, "page.html"));
  const marcas = esqueleto.split("{{secoes}}").length - 1;
  if (marcas !== 1)
    throw new ErroBuild(`page.html deve ter exatamente um {{secoes}}; tem ${marcas}.`);
  const conteudo = JSON.parse(lerTexto(join(SRC, "conteudo.json")));
  if ("leitura" in conteudo) throw new ErroBuild('conteudo.json não pode ter "leitura".');
  try {
    conteudo.leitura = montarLeitura(SRC, conteudo);
  } catch (erro) {
    if (erro instanceof ErroLeitura) throw new ErroBuild(erro.message);
    throw erro;
  }
  for (const pagina of paginas) montarPagina(pagina, esqueleto, conteudo);
}

/** Comentários e blocos :root viram espaço, preservando as quebras de linha. */
function semRootNemComentario(css) {
  const branco = (trecho) => trecho.replace(/[^\n]/g, " ");
  return css.replace(/\/\*[\s\S]*?\*\//g, branco).replace(/:root\s*\{[\s\S]*?\n\}/g, branco);
}

/** O que a identidade proíbe: hex fora do :root, ponta arredondada, caixa-alta espaçada. */
const PROIBIDOS = [
  [/#[0-9a-fA-F]{3,8}\b/, "cor em hex fora do :root (use token)"],
  [
    /border-radius\s*:(?!\s*(?:0|var\(--raio\))\s*(?:;|$))/,
    "border-radius diferente de 0 (ponta reta)",
  ],
  [/text-transform\s*:\s*uppercase/, "caixa-alta (estilo editorial é proibido)"],
  [/font-family\s*:[^;]*(?<!sans-)\bserif\b/, "fonte serifada"],
  [/stroke-linecap\s*:\s*(round|square)/, "ponta de traço que não é butt"],
];

function verificarCss(arquivos) {
  const falhas = [];
  for (const arquivo of arquivos) {
    const linhas = semRootNemComentario(lerTexto(arquivo)).split("\n");
    linhas.forEach((linha, i) => {
      for (const [padrao, motivo] of PROIBIDOS) {
        if (padrao.test(linha)) falhas.push(`${relative(RAIZ, arquivo)}:${i + 1} ${motivo}`);
      }
    });
  }
  if (falhas.length) throw new ErroBuild(`CSS fora da identidade:\n  ${falhas.join("\n  ")}`);
}

/** Pastas das cenas do pacote "landing": o CSS delas vai só para landing.css, nesta ordem
    (a de cidade primeiro: o 00-comum dela traz as entradas .revelar e o .peso-fixo). */
const PASTAS_LANDING = ["cidade", "proposta", "contato", "nao-encontrada"];
/** Pasta das cenas das páginas de leitura: o CSS dela vai só para leitura.css. */
const PASTA_LEITURA = "leitura";

/**
 * CSS da pasta por nome; depois o das subpastas (cenas de outras páginas), também por nome.
 * @param {string} pasta @param {string[]} [fora] subpastas que ficam de fora
 */
function cssOrdenado(pasta, fora = []) {
  const itens = readdirSync(pasta, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const proprios = itens.filter((i) => i.isFile() && i.name.endsWith(".css"));
  const subpastas = itens.filter((i) => i.isDirectory() && !fora.includes(i.name));
  return [
    ...proprios.map((i) => join(pasta, i.name)),
    ...subpastas.flatMap((i) => cssOrdenado(join(pasta, i.name))),
  ];
}

/** @param {string[]} arquivos @param {string} saida */
function concatenarCss(arquivos, saida) {
  const partes = arquivos.map((caminho) => {
    const rotulo = relative(RAIZ, caminho).replace(/\\/g, "/");
    return `/* ==== ${rotulo} ==== */\n${lerTexto(caminho).trimEnd()}\n`;
  });
  writeFileSync(join(DIST, saida), partes.join("\n"));
}

/**
 * app.css: lenis.css → tokens.css → base.css → core/*.css → scenes/NN-*.css →
 * scenes/<página>/NN-*.css (menos as do pacote "landing" e a de leitura). landing.css:
 * tokens.css → base.css → o formulário de proposta → scenes/<pasta>/NN-*.css de cada
 * PASTAS_LANDING. Sem Lenis: as páginas do pacote "landing" rolam nativo.
 * leitura.css: tokens.css → base.css → o formulário de proposta → a cena 08-proposta →
 * scenes/leitura/NN-*.css. Também sem Lenis.
 */
function montarCss() {
  const base = [join(SRC, "styles", "tokens.css"), join(SRC, "styles", "base.css")];
  const cenas = join(SRC, "scenes");
  const formulario = join(SRC, "core", "formulario-proposta.css");
  const app = [
    ...base,
    ...cssOrdenado(join(SRC, "core")),
    ...cssOrdenado(cenas, [...PASTAS_LANDING, PASTA_LEITURA]),
  ];
  const landing = [
    ...base,
    formulario,
    ...PASTAS_LANDING.flatMap((pasta) => cssOrdenado(join(cenas, pasta))),
  ];
  const leitura = [
    ...base,
    formulario,
    join(cenas, "08-proposta.css"),
    ...cssOrdenado(join(cenas, PASTA_LEITURA)),
  ];
  verificarCss([...new Set([...app, ...landing, ...leitura])]);
  concatenarCss([join(RAIZ, "node_modules", "lenis", "dist", "lenis.css"), ...app], "app.css");
  concatenarCss(landing, "landing.css");
  concatenarCss(leitura, "leitura.css");
}

async function montarJs() {
  await build({
    entryPoints: {
      app: join(SRC, "main.js"),
      landing: join(SRC, "landing.js"),
      leitura: join(SRC, "leitura.js"),
    },
    outdir: DIST,
    bundle: true,
    format: "iife",
    platform: "browser",
    target: ["es2022"],
    minify: true,
    sourcemap: "linked",
    legalComments: "eof",
    charset: "utf8",
    logLevel: "warning",
  });
}

function copiarAssets() {
  const origem = join(SRC, "assets");
  if (!existsSync(origem)) throw new ErroBuild(`Pasta de assets ausente: ${origem}`);
  cpSync(origem, join(DIST, "assets"), { recursive: true });
}

async function main() {
  const inicio = performance.now();
  limparDist();
  const paginas = lerPaginas();
  montarHtml(paginas);
  montarCss();
  await montarJs();
  copiarAssets();
  const ms = Math.round(performance.now() - inicio);
  const resumo = paginas.map((p) => `${p.saida} (${p.secoes.length} cenas)`).join(", ");
  console.log(`dist/ pronto: ${resumo}, ${ms} ms.`);
}

main().catch((erro) => {
  const mensagem = erro instanceof ErroBuild ? erro.message : (erro?.stack ?? String(erro));
  console.error(`\nBuild falhou: ${mensagem}\n`);
  process.exit(1);
});
