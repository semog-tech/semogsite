/* Páginas de leitura: lê os posts e os documentos legais em MDX (src/leitura/, cópia de
   semogsite/content/) e devolve o que as marcas {{leitura.…}} enxergam no build. O MDX é
   convertido por um conversor mínimo, só para o subconjunto que esses arquivos usam:
   ## e ###, parágrafo, lista com - e com 1., citação com >, tabela simples com |,
   **negrito**, *itálico*, [link](url) e os componentes <PostImage /> e <PostVideo />.
   Qualquer outra coisa derruba o build, em vez de sair como texto cru na página. */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

export class ErroLeitura extends Error {}

/** @param {string} caminho */
function lerTexto(caminho) {
  return readFileSync(caminho, "utf8").replace(/\r\n/g, "\n");
}

/** @param {string} texto */
function escapar(texto) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ---- Frontmatter ------------------------------------------------------------------
   YAML mínimo: `chave: "texto"`, `chave: 9`, e `chave:` seguida de um nível com
   `  sub: "texto"` (objeto) ou `  - "texto"` (lista). */

/** @param {string} bruto @param {string} origem */
function valorYaml(bruto, origem) {
  if (/^-?\d+$/.test(bruto)) return Number(bruto);
  if (bruto.startsWith('"')) return JSON.parse(bruto);
  throw new ErroLeitura(`${origem}: valor de frontmatter não suportado: ${bruto}`);
}

/** Lista ou objeto do nível de dentro de `chave:`; o tipo sai da primeira linha. */
function nivelDeDentro(dados, chave, ehLista, origem) {
  dados[chave] ??= ehLista ? [] : {};
  if (Array.isArray(dados[chave]) !== ehLista) {
    throw new ErroLeitura(`${origem}: "${chave}" mistura lista e objeto.`);
  }
  return dados[chave];
}

/** @param {string} bloco @param {string} origem @returns {Record<string, any>} */
function lerFrontmatter(bloco, origem) {
  /** @type {Record<string, unknown>} */
  const dados = {};
  /** @type {string | null} */
  let aberta = null;
  for (const linha of bloco.split("\n")) {
    if (!linha.trim()) continue;
    const raiz = /^([A-Za-z]+):(?: (.+))?$/.exec(linha);
    const item = /^ {2}- (.+)$/.exec(linha);
    const sub = /^ {2}([A-Za-z]+): (.+)$/.exec(linha);
    if (raiz) {
      aberta = raiz[2] === undefined ? raiz[1] : null;
      if (raiz[2] !== undefined) dados[raiz[1]] = valorYaml(raiz[2], origem);
    } else if (aberta && item) {
      nivelDeDentro(dados, aberta, true, origem).push(valorYaml(item[1], origem));
    } else if (aberta && sub) {
      nivelDeDentro(dados, aberta, false, origem)[sub[1]] = valorYaml(sub[2], origem);
    } else {
      throw new ErroLeitura(`${origem}: linha de frontmatter não suportada: ${linha}`);
    }
  }
  return dados;
}

/** @param {string} texto @param {string} origem */
function separarFrontmatter(texto, origem) {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(texto);
  if (!m) throw new ErroLeitura(`${origem}: sem frontmatter.`);
  return { dados: lerFrontmatter(m[1], origem), corpo: texto.slice(m[0].length) };
}

/* ---- Texto em linha ---------------------------------------------------------------- */

/**
 * @typedef {Object} Ambiente
 * @property {string} origem arquivo, para as mensagens de erro
 * @property {(href: string) => string} link traduz o destino de um link do MDX
 * @property {Record<string, Midia>} midia
 * @typedef {{ src: string, alt: string, largura: number, altura: number }} Midia
 */

/** @param {string} texto @param {Ambiente} amb */
function emLinha(texto, amb) {
  return escapar(texto)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, rotulo, href) => {
      return `<a href="${escapar(amb.link(href.replace(/&amp;/g, "&")))}">${rotulo}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

/** id de âncora a partir do título: sem acento, minúsculo, hífens. @param {string} texto */
function ancora(texto) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/* ---- Componentes -------------------------------------------------------------------- */

/** @param {string} tag @param {Ambiente} amb */
function atributos(tag, amb) {
  /** @type {Record<string, string>} */
  const attrs = {};
  for (const [, nome, valor] of tag.matchAll(/(\w+)="([^"]*)"/g)) attrs[nome] = valor;
  return {
    attrs,
    /** @param {string} nome */
    midia(nome) {
      const arquivo = attrs[nome];
      const item = arquivo ? amb.midia[arquivo] : undefined;
      if (!item) throw new ErroLeitura(`${amb.origem}: mídia "${arquivo}" fora de midia.json.`);
      return item;
    },
  };
}

/** @param {string} legenda */
function figcaption(legenda) {
  return legenda ? `<figcaption>${escapar(legenda)}</figcaption>` : "";
}

/** @param {string} tag @param {Ambiente} amb */
function postImage(tag, amb) {
  const { attrs, midia } = atributos(tag, amb);
  const foto = midia("file");
  return (
    `<figure class="artigo-figura"><img src="${escapar(foto.src)}" alt="${escapar(foto.alt)}" ` +
    `width="${foto.largura}" height="${foto.altura}" loading="lazy" decoding="async" />` +
    `${figcaption(attrs.caption ?? "")}</figure>`
  );
}

/** Vídeo nativo com poster, sem pré-carga: só baixa quando alguém dá play. */
function postVideo(tag, amb) {
  const { attrs, midia } = atributos(tag, amb);
  const video = midia("file");
  const poster = midia("poster");
  const proporcao = attrs.aspectRatio ?? `${video.largura} / ${video.altura}`;
  const vertical = video.altura > video.largura ? " artigo-figura--vertical" : "";
  return (
    `<figure class="artigo-figura${vertical}"><video controls playsinline preload="none" ` +
    `poster="${escapar(poster.src)}" aria-label="${escapar(video.alt)}" ` +
    `style="aspect-ratio: ${escapar(proporcao)}"><source src="${escapar(video.src)}" ` +
    `type="video/mp4" />Seu navegador não reproduz este vídeo.</video>` +
    `${figcaption(attrs.caption ?? "")}</figure>`
  );
}

const COMPONENTES = { PostImage: postImage, PostVideo: postVideo };

/* ---- Blocos ------------------------------------------------------------------------- */

/** Tabela simples: cabeçalho, linha de traços e linhas. @param {string[]} linhas @param {Ambiente} amb */
function tabela(linhas, amb) {
  const celulas = (linha) =>
    linha
      .replace(/^\||\|$/g, "")
      .split("|")
      .map((c) => emLinha(c.trim(), amb));
  if (linhas.length < 2 || !/^\|?[\s:|-]+\|?$/.test(linhas[1])) {
    throw new ErroLeitura(`${amb.origem}: tabela sem a linha de separação.`);
  }
  const cabeca = celulas(linhas[0])
    .map((c) => `<th scope="col">${c}</th>`)
    .join("");
  const corpo = linhas
    .slice(2)
    .map(
      (l) =>
        `<tr>${celulas(l)
          .map((c) => `<td>${c}</td>`)
          .join("")}</tr>`,
    )
    .join("");
  return `<div class="artigo-tabela"><table><thead><tr>${cabeca}</tr></thead><tbody>${corpo}</tbody></table></div>`;
}

/** Tipos de linha que formam bloco; o resto é parágrafo. */
const LINHA = {
  titulo: /^(#{2,3}) (.+)$/,
  ul: /^- (.+)$/,
  ol: /^\d+\. (.+)$/,
  citacao: /^> ?(.*)$/,
  tabela: /^\|.*\|$/,
  componente: /^<([A-Z][A-Za-z]+)\b[^>]*\/>$/,
};

/** Agrupa linhas consecutivas do mesmo tipo. @param {string} corpo */
function blocos(corpo) {
  /** @type {Array<{ tipo: string, linhas: string[] }>} */
  const lista = [];
  for (const linha of corpo.split("\n")) {
    if (!linha.trim()) {
      lista.push({ tipo: "vazio", linhas: [] });
      continue;
    }
    const tipo = Object.keys(LINHA).find((t) => LINHA[t].test(linha)) ?? "p";
    const ultimo = lista.at(-1);
    const junta = ultimo && ultimo.tipo === tipo && !["titulo", "componente"].includes(tipo);
    if (junta) ultimo.linhas.push(linha);
    else lista.push({ tipo, linhas: [linha] });
  }
  return lista.filter((b) => b.tipo !== "vazio");
}

/**
 * @param {{ tipo: string, linhas: string[] }} bloco @param {Ambiente} amb
 * @param {Array<{ id: string, texto: string }>} indice h2 do texto, na ordem
 * @param {Set<string>} ids já usados na página
 */
function blocoHtml({ tipo, linhas }, amb, indice, ids) {
  const conteudo = (re) => linhas.map((l) => emLinha(re.exec(l)[1], amb));
  if (tipo === "titulo") {
    const [, marcas, texto] = LINHA.titulo.exec(linhas[0]);
    let id = ancora(texto);
    while (ids.has(id)) id += "-2";
    ids.add(id);
    const nivel = marcas.length;
    if (nivel === 2) indice.push({ id, texto });
    return `<h${nivel} id="${id}">${emLinha(texto, amb)}</h${nivel}>`;
  }
  if (tipo === "ul" || tipo === "ol") {
    return `<${tipo}>${conteudo(LINHA[tipo])
      .map((i) => `<li>${i}</li>`)
      .join("")}</${tipo}>`;
  }
  if (tipo === "citacao")
    return `<blockquote><p>${conteudo(LINHA.citacao).join(" ")}</p></blockquote>`;
  if (tipo === "tabela") return tabela(linhas, amb);
  if (tipo === "componente") {
    const nome = LINHA.componente.exec(linhas[0])[1];
    const montar = COMPONENTES[nome];
    if (!montar) throw new ErroLeitura(`${amb.origem}: componente <${nome}> não suportado.`);
    return montar(linhas[0], amb);
  }
  if (linhas.some((l) => /^\s*<|^#|^\s/.test(l))) {
    throw new ErroLeitura(`${amb.origem}: bloco não suportado: ${linhas[0].slice(0, 60)}`);
  }
  return `<p>${emLinha(linhas.join(" "), amb)}</p>`;
}

/**
 * Corpo MDX → HTML e o índice dos h2.
 * @param {string} corpo @param {Ambiente} amb @param {string[]} reservados ids da página
 */
function converterCorpo(corpo, amb, reservados) {
  /** @type {Array<{ id: string, texto: string }>} */
  const indice = [];
  const ids = new Set(reservados);
  const html = blocos(corpo)
    .map((b) => blocoHtml(b, amb, indice, ids))
    .join("\n");
  return { html, indice };
}

/* ---- Posts e documentos ------------------------------------------------------------- */

const DATA = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "America/Recife",
});

/** Ids das seções das páginas de leitura: um título do texto não pode repeti-los. */
const IDS_DA_PAGINA = ["conteudo", "artigo", "leia-tambem", "proposta", "cookies", "blog-indice"];

/** Minutos de leitura: o do frontmatter; sem ele, 200 palavras por minuto. */
function minutosDeLeitura(dados, corpo) {
  if (typeof dados.readingTime === "number") return dados.readingTime;
  return Math.max(1, Math.round(corpo.split(/\s+/).filter(Boolean).length / 200));
}

/** @param {string} pasta @returns {Array<{ nome: string, texto: string }>} */
function lerPasta(pasta) {
  return readdirSync(pasta)
    .filter((nome) => nome.endsWith(".mdx"))
    .sort()
    .map((nome) => ({ nome, texto: lerTexto(join(pasta, nome)) }));
}

/** Traduz um link do MDX para este protótipo. */
function tradutorDeLinks(config, completos) {
  return (href) => {
    if (!href.startsWith("/")) return href;
    if (href in config.links) return config.links[href];
    const post = /^\/blog\/([a-z0-9-]+)$/.exec(href);
    if (post && completos.has(post[1])) return `blog-${post[1]}.html`;
    return config.siteAtual + href;
  };
}

/** @param {{ nome: string, texto: string }} arquivo @param {object} ctx */
function lerPost({ nome, texto }, ctx) {
  const origem = `src/leitura/blog/${nome}`;
  const { dados, corpo } = separarFrontmatter(texto, origem);
  for (const campo of ["title", "slug", "date", "category", "excerpt"]) {
    if (typeof dados[campo] !== "string") throw new ErroLeitura(`${origem}: sem "${campo}".`);
  }
  const categoria = ctx.categorias.find((c) => c.slug === dados.category);
  if (!categoria) throw new ErroLeitura(`${origem}: categoria "${dados.category}" desconhecida.`);
  const local = ctx.completos.has(dados.slug);
  const heroi =
    String(dados.heroImage ?? "")
      .split("/")
      .pop() ?? "";
  return {
    slug: dados.slug,
    titulo: dados.title,
    resumo: dados.excerpt,
    data: dados.date,
    dataTexto: DATA.format(new Date(dados.date)),
    categoria,
    minutos: minutosDeLeitura(dados, corpo),
    local,
    href: local ? `blog-${dados.slug}.html` : `${ctx.blogUrl}/${dados.slug}`,
    imagem: ctx.midia[heroi] ?? null,
    emResumo: Array.isArray(dados.keyTakeaways) ? dados.keyTakeaways : [],
    corpo,
    origem,
  };
}

/** Resumo de um post para listas (sem o corpo). */
function cartao(post) {
  const { slug, titulo, resumo, dataTexto, categoria, minutos, local, href } = post;
  return { slug, titulo, resumo, dataTexto, categoria, minutos, local, href };
}

/**
 * "Leia também": dois posts, primeiro os da mesma categoria, depois os que têm página
 * aqui, depois os mais recentes.
 */
function leiaTambem(post, todos) {
  const nota = (p) => (p.categoria.slug === post.categoria.slug ? 0 : 2) + (p.local ? 0 : 1);
  return todos
    .filter((p) => p.slug !== post.slug)
    .sort((a, b) => nota(a) - nota(b) || b.data.localeCompare(a.data))
    .slice(0, 2)
    .map(cartao);
}

/** Converte o corpo e acrescenta o que a página do post usa. */
function paginaDoPost(post, todos, ctx) {
  const amb = { origem: post.origem, link: ctx.link, midia: ctx.midia };
  const { html, indice } = converterCorpo(post.corpo, amb, IDS_DA_PAGINA);
  return {
    ...cartao(post),
    imagem: post.imagem,
    emResumo: post.emResumo,
    corpoHtml: html,
    indice,
    temIndice: indice.length >= 3,
    leiaTambem: leiaTambem(post, todos),
    // Campos dos documentos legais, vazios aqui: o modelo de artigo é o mesmo.
    atualizacao: "",
    citaCookies: false,
  };
}

/** @param {{ nome: string, texto: string }} arquivo @param {object} ctx */
function lerLegal({ nome, texto }, ctx) {
  const origem = `src/leitura/legal/${nome}`;
  const { dados, corpo } = separarFrontmatter(texto, origem);
  for (const campo of ["title", "slug", "updatedText"]) {
    if (typeof dados[campo] !== "string") throw new ErroLeitura(`${origem}: sem "${campo}".`);
  }
  const amb = { origem, link: ctx.link, midia: ctx.midia };
  const { html, indice } = converterCorpo(corpo, amb, IDS_DA_PAGINA);
  return {
    slug: dados.slug,
    titulo: dados.title,
    atualizacao: dados.updatedText,
    corpoHtml: html,
    indice,
    temIndice: indice.length >= 3,
    // O texto aponta para #cookies ("ao final desta página"): a página diz o que há lá.
    citaCookies: corpo.includes("](#cookies)"),
    // Campos dos posts, vazios aqui: o modelo de artigo é o mesmo.
    categoria: null,
    resumo: "",
    imagem: null,
    emResumo: [],
  };
}

/** Posts por data, do mais recente; todo post "completo" precisa ter MDX. */
function lerPosts(pasta, ctx) {
  const posts = lerPasta(join(pasta, "blog"))
    .map((arquivo) => lerPost(arquivo, ctx))
    .sort((a, b) => b.data.localeCompare(a.data));
  for (const slug of ctx.completos) {
    if (!posts.some((p) => p.slug === slug)) {
      throw new ErroLeitura(`Post completo sem MDX: ${slug}`);
    }
  }
  return posts;
}

/** O índice do blog: o destaque (com foto), os demais e as categorias com post. */
function indiceDoBlog(posts, categorias) {
  const [destaque, ...demais] = posts;
  return {
    destaque: { ...cartao(destaque), imagem: destaque.imagem },
    demais: demais.map(cartao),
    total: posts.length,
    categorias: categorias
      .map((c) => ({ ...c, total: posts.filter((p) => p.categoria.slug === c.slug).length }))
      .filter((c) => c.total > 0),
  };
}

/**
 * Tudo o que as páginas de leitura usam, sob {{leitura.…}}.
 * @param {string} src pasta src/ @param {{ marca: { blogUrl: string } }} conteudo
 */
export function montarLeitura(src, conteudo) {
  const pasta = join(src, "leitura");
  const config = JSON.parse(lerTexto(join(pasta, "leitura.json")));
  const completos = new Set(config.completos);
  const ctx = {
    categorias: config.categorias,
    completos,
    midia: JSON.parse(lerTexto(join(pasta, "midia.json"))).arquivos,
    blogUrl: conteudo.marca.blogUrl,
    link: tradutorDeLinks(config, completos),
  };
  const posts = lerPosts(pasta, ctx);
  const legal = lerPasta(join(pasta, "legal")).map((arquivo) => lerLegal(arquivo, ctx));
  return {
    ...indiceDoBlog(posts, config.categorias),
    posts: Object.fromEntries(
      posts.filter((p) => p.local).map((p) => [p.slug, paginaDoPost(p, posts, ctx)]),
    ),
    legal: Object.fromEntries(legal.map((doc) => [doc.slug, doc])),
  };
}
