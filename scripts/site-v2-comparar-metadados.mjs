/* Comparação do <head> por URL, antes e depois (spec 6; fase 3 do site v2).
   "Antes" é o site no ar; "depois", o build local da feat/site-v2. A lista de URLs sai do
   sitemap.xml do "antes"; as páginas de leitura são comparadas com a prévia (/previa-v2/...),
   que é a página que vai para a URL real na virada 1.
   Compara status, title, description, canonical, og:title, og:description, og:url, og:type,
   og:image, o que a og:image responde (status e content-type) e o JSON-LD (todos os blocos, chaves em ordem), e o conjunto de URLs dos dois
   sitemaps. Diferença fora de DIFERENCAS_EXPLICADAS, ou explicada que não aconteceu, sai com
   código 1.
   No site no ar só há GET de leitura, uma URL por vez, com pausa entre as páginas e User-Agent
   identificável.
   Uso: node scripts/site-v2-comparar-metadados.mjs [--antes https://www.semog.com.br]
        [--depois http://localhost:3100] [--saida relatorio.json] */
import { writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const PREFIXO_DA_LEITURA = '/previa-v2'
const LEITURA = /^\/(?:blog(?:\/[a-z0-9-]+)?|privacidade|termos)$/
/** Páginas institucionais da fase 4 que já estão na prévia (a home é /previa-v2). */
const INSTITUCIONAL =
  /^\/(?:semog|administracao-de-condominios|garante|incorporadoras|solucoes|proposta|contato)?$/
const PAUSA_MS = 700
const USER_AGENT = 'semog-site-v2-comparar-metadados (verificacao interna; so GET de leitura)'
const CAMPOS = [
  'status',
  'title',
  'description',
  'canonical',
  'og:title',
  'og:description',
  'og:url',
  'og:type',
  'og:image',
  'og:image resolve',
  'jsonld',
]

/** Diferenças esperadas desta fase, por URL e campo, com o motivo (texto reescrito de propósito). */
const DIFERENCAS_EXPLICADAS = {
  '/contato': {
    motivo: 'título sem o WhatsApp, decisão do Leandro de 16/10 (TITULO_DO_CONTATO)',
    campos: ['title', 'og:title'],
  },
  '/blog': {
    motivo:
      'a URL de og:image é a mesma, mas no ar ela dá 404 (não existia rota de OG para o índice); a rota nova a serve com 200 image/png',
    campos: ['og:image resolve'],
  },
  '/blog/assembleia-virtual-validade-juridica': {
    motivo: 'título e meta.title reescritos sem o termo vedado (spec 6)',
    campos: ['title', 'og:title', 'jsonld'],
  },
  '/blog/g20-superlogica-next-2026': {
    motivo: 'texto do protótipo: "mais de 3.500 administradoras" e Ranking Top 200 (spec 2)',
    campos: ['title', 'og:title', 'jsonld'],
  },
}

const ENTIDADES = {
  '&amp;': '&',
  '&quot;': '"',
  '&#x27;': "'",
  '&#39;': "'",
  '&lt;': '<',
  '&gt;': '>',
}

function decodificar(texto) {
  return texto.replace(/&(?:amp|quot|lt|gt|#x27|#39);/g, (entidade) => ENTIDADES[entidade])
}

function atributos(tag) {
  const lidos = {}
  for (const [, nome, valor] of tag.matchAll(/([a-zA-Z:-]+)="([^"]*)"/g)) {
    lidos[nome] = decodificar(valor)
  }
  return lidos
}

function ordenar(valor) {
  if (Array.isArray(valor)) return valor.map(ordenar)
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(
      Object.keys(valor)
        .sort()
        .map((chave) => [chave, ordenar(valor[chave])]),
    )
  }
  return valor
}

/**
 * Campos do <head> que o Google lê. Procura no <head> (um <title> de SVG no corpo não conta) e,
 * sem <head>, no HTML inteiro. O JSON-LD é lido do documento todo: as páginas o põem no corpo.
 */
export function lerCabeca(html) {
  const cabeca = /<head[^>]*>([\s\S]*?)<\/head>/.exec(html)?.[1] ?? html
  const metas = [...cabeca.matchAll(/<meta\s[^>]*>/g)].map((achado) => atributos(achado[0]))
  const meta = (chave, nome) => metas.find((attrs) => attrs[chave] === nome)?.content ?? null
  const links = [...cabeca.matchAll(/<link\s[^>]*>/g)].map((achado) => atributos(achado[0]))
  const titulo = /<title>([\s\S]*?)<\/title>/.exec(cabeca)?.[1]
  const blocos = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  return {
    title: titulo === undefined ? null : decodificar(titulo),
    description: meta('name', 'description'),
    canonical: links.find((attrs) => attrs.rel === 'canonical')?.href ?? null,
    'og:title': meta('property', 'og:title'),
    'og:description': meta('property', 'og:description'),
    'og:url': meta('property', 'og:url'),
    'og:type': meta('property', 'og:type'),
    'og:image': meta('property', 'og:image'),
    jsonld: JSON.stringify(blocos.map((achado) => ordenar(JSON.parse(achado[1])))),
  }
}

/** No build local, a página que vai para a URL real na virada 1 é a da prévia. */
export function destinoNoDepois(caminho) {
  if (LEITURA.test(caminho)) return `${PREFIXO_DA_LEITURA}${caminho}`
  if (INSTITUCIONAL.test(caminho)) {
    return caminho === '/' ? PREFIXO_DA_LEITURA : `${PREFIXO_DA_LEITURA}${caminho}`
  }
  return caminho
}

function lerArgs(argv) {
  const args = { antes: 'https://www.semog.com.br', depois: 'http://localhost:3100', saida: null }
  const fila = [...argv]
  while (fila.length) {
    const opcao = fila.shift()
    const valor = fila.shift()
    if (valor === undefined) throw new Error(`Opção sem valor: ${opcao}`)
    if (opcao === '--antes') args.antes = valor.replace(/\/+$/, '')
    else if (opcao === '--depois') args.depois = valor.replace(/\/+$/, '')
    else if (opcao === '--saida') args.saida = valor
    else throw new Error(`Opção desconhecida: ${opcao}`)
  }
  return args
}

function pausar(ms) {
  return new Promise((resolver) => setTimeout(resolver, ms))
}

async function baixar(url) {
  const resposta = await fetch(url, {
    method: 'GET',
    redirect: 'manual',
    headers: { 'user-agent': USER_AGENT },
    signal: AbortSignal.timeout(30_000),
  })
  // Texto lido do disco ou da rede passa por normalização de quebra de linha antes de regex.
  const html = resposta.status === 200 ? (await resposta.text()).replace(/\r\n?/g, '\n') : ''
  return { status: resposta.status, html }
}

function caminhosDoSitemap(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((achado) => new URL(achado[1]).pathname)
}

async function compararSitemaps(args, problemas) {
  const antes = await baixar(`${args.antes}/sitemap.xml`)
  await pausar(PAUSA_MS)
  const depois = await baixar(`${args.depois}/sitemap.xml`)
  if (antes.status !== 200 || depois.status !== 200) {
    throw new Error(`sitemap.xml respondeu ${antes.status} (antes) e ${depois.status} (depois)`)
  }
  const deAntes = caminhosDoSitemap(antes.html)
  const deDepois = caminhosDoSitemap(depois.html)
  const somem = deAntes.filter((caminho) => !deDepois.includes(caminho))
  const aparecem = deDepois.filter((caminho) => !deAntes.includes(caminho))
  if (somem.length) problemas.push(`sitemap: some(m) ${somem.join(', ')}`)
  if (aparecem.length) problemas.push(`sitemap: aparece(m) ${aparecem.join(', ')}`)
  return deAntes
}

/**
 * O que a URL de og:image responde (status e content-type), pedida na mesma origem da página:
 * a metadata declara o host de produção, e o build local precisa ser medido no próprio host.
 */
async function resolverImagem(origem, imagem) {
  if (!imagem) return null
  await pausar(PAUSA_MS)
  const resposta = await fetch(new URL(new URL(imagem).pathname, origem), {
    method: 'GET',
    redirect: 'manual',
    headers: { 'user-agent': USER_AGENT },
    signal: AbortSignal.timeout(30_000),
  })
  await resposta.arrayBuffer()
  return `${resposta.status} ${resposta.headers.get('content-type') ?? 'sem content-type'}`
}

async function compararUrl(args, caminho) {
  const destino = destinoNoDepois(caminho)
  const antes = await baixar(`${args.antes}${caminho}`)
  const depois = await baixar(`${args.depois}${destino}`)
  const cabecaAntes = { status: String(antes.status), ...lerCabeca(antes.html) }
  const cabecaDepois = { status: String(depois.status), ...lerCabeca(depois.html) }
  cabecaAntes['og:image resolve'] = await resolverImagem(args.antes, cabecaAntes['og:image'])
  cabecaDepois['og:image resolve'] = await resolverImagem(args.depois, cabecaDepois['og:image'])
  return CAMPOS.filter((campo) => cabecaAntes[campo] !== cabecaDepois[campo]).map((campo) => ({
    caminho,
    destino,
    campo,
    antes: cabecaAntes[campo],
    depois: cabecaDepois[campo],
    explicada: DIFERENCAS_EXPLICADAS[caminho]?.campos.includes(campo)
      ? DIFERENCAS_EXPLICADAS[caminho].motivo
      : null,
  }))
}

async function main() {
  const args = lerArgs(process.argv.slice(2))
  const problemas = []
  const caminhos = await compararSitemaps(args, problemas)
  const diferencas = []
  for (const caminho of caminhos) {
    await pausar(PAUSA_MS)
    diferencas.push(...(await compararUrl(args, caminho)))
  }
  for (const d of diferencas) {
    const marca = d.explicada ? `explicada (${d.explicada})` : 'NÃO EXPLICADA'
    console.log(`${d.caminho} → ${d.destino} · ${d.campo} · ${marca}`)
    console.log(`  antes:  ${d.antes}`)
    console.log(`  depois: ${d.depois}`)
    if (!d.explicada) problemas.push(`${d.caminho}: ${d.campo} difere`)
  }
  for (const [caminho, { campos }] of Object.entries(DIFERENCAS_EXPLICADAS)) {
    for (const campo of campos) {
      if (!diferencas.some((d) => d.caminho === caminho && d.campo === campo)) {
        problemas.push(`${caminho}: ${campo} estava na lista de explicadas e não mudou`)
      }
    }
  }
  if (args.saida) {
    writeFileSync(args.saida, JSON.stringify({ caminhos, diferencas, problemas }, null, 2))
  }
  console.log(`\n${caminhos.length} URLs comparadas, ${diferencas.length} diferença(s).`)
  if (problemas.length) {
    console.error(`${problemas.length} problema(s):\n  ${problemas.join('\n  ')}`)
    process.exit(1)
  }
  console.log('Sem diferença não explicada.')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((erro) => {
    console.error(erro?.stack ?? String(erro))
    process.exit(1)
  })
}
