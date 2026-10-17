/* Varredura das páginas de leitura do site v2 na prévia (porta de leitura-varredura.mjs do
   protótipo), contra um servidor já de pé. Para o índice do blog, os posts, Privacidade e
   Termos, em Chromium e Firefox, 1440 e 390:
   - print da página inteira em <saida>/<navegador>/<página>-<largura>.png;
   - erro de console, de página ou de rede, resposta diferente de 200, scroll horizontal;
   - telas vazias (cada passo de uma tela precisa ter texto, foto ou campo visível);
   - nos artigos: corpo (px), entrelinha, caracteres por linha (mediana) e a barra de 0 a 1;
   - no índice: o filtro "Finanças" deixa só os 3 de Finanças, e "Todos" volta aos 12;
   - links da leitura (cartões, voltar, Leia também, índice e corpo): âncora com alvo e link
     interno respondendo 200;
   - sem JavaScript: título e texto no HTML, barra de progresso escondida.
   O cabeçalho e o rodapé (fase 1) ficam fora da conferência de links: /tecnologia só existe na
   fase 4.
   Navegador: Playwright headless, cada lançamento com perfil temporário próprio.
   Ruído conhecido, fora da conta: o aviso do Firefox sobre o cookie __cf_bm de imagem de CDN de
   terceiro e, só com --build-sem-env (build sem .env, sem chave do Turnstile), o aviso de que o
   widget não renderizou. Com a chave configurada, esse aviso volta a ser problema.
   Uso: node scripts/site-v2-leitura.mjs --saida <pasta> [--base http://localhost:3100]
        [--navegador chromium|firefox] [--largura 1440|390] [--build-sem-env]
   Sai com código 1 se algo falhar. */
import { mkdirSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { chromium, firefox } from '@playwright/test'

const PREFIXO = '/previa-v2'
const ALTURAS = { 1440: 900, 390: 844 }
const NAVEGADORES = { chromium, firefox }
const ESPERA_MS = 400
const RUIDO_DE_TERCEIRO = /Cookie .__cf_bm. has been rejected for invalid domain/
const RUIDO_SEM_ENV = /\[turnstile\] NEXT_PUBLIC_TURNSTILE_SITE_KEY ausente/

function lerArgs(argv) {
  const args = {
    base: 'http://localhost:3100',
    saida: null,
    navegadores: ['chromium', 'firefox'],
    larguras: [1440, 390],
    semEnv: false,
  }
  const fila = [...argv]
  while (fila.length) {
    const opcao = fila.shift()
    if (opcao === '--build-sem-env') {
      args.semEnv = true
      continue
    }
    const valor = fila.shift()
    if (valor === undefined) throw new Error(`Opção sem valor: ${opcao}`)
    if (opcao === '--base') args.base = valor.replace(/\/+$/, '')
    else if (opcao === '--saida') args.saida = valor
    else if (opcao === '--navegador') args.navegadores = [valor]
    else if (opcao === '--largura') args.larguras = [Number(valor)]
    else throw new Error(`Opção desconhecida: ${opcao}`)
  }
  if (!args.saida) throw new Error('Obrigatório: --saida <pasta>.')
  if (!args.navegadores.every((nome) => nome in NAVEGADORES)) {
    throw new Error('--navegador deve ser chromium ou firefox.')
  }
  if (!args.larguras.every((largura) => largura in ALTURAS)) {
    throw new Error('--largura deve ser 1440 ou 390.')
  }
  return args
}

function paginasDeLeitura() {
  const posts = readdirSync(path.join(process.cwd(), 'content', 'blog'))
    .filter((nome) => nome.endsWith('.mdx'))
    .sort()
    .map((nome) => `/blog/${nome.slice(0, -'.mdx'.length)}`)
  return ['/blog', ...posts, '/privacidade', '/termos']
}

function ouvirErros(pagina, args) {
  const erros = []
  pagina.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const texto = msg.text()
    if (RUIDO_DE_TERCEIRO.test(texto) || (args.semEnv && RUIDO_SEM_ENV.test(texto))) return
    erros.push(`console: ${texto}`)
  })
  pagina.on('pageerror', (erro) => erros.push(`página: ${erro.message}`))
  pagina.on('requestfailed', (req) =>
    erros.push(`requisição: ${req.url()} (${req.failure()?.errorText ?? '?'})`),
  )
  return erros
}

function telasVazias(pagina) {
  return pagina.evaluate(async (espera) => {
    const cab = document.querySelector('[data-cabecalho]')?.getBoundingClientRect().height ?? 0
    const alvos = Array.from(
      document.querySelectorAll('main :is(p, h1, h2, h3, li, img, video, input, select, a)'),
    )
    const vazias = []
    const altura = document.documentElement.scrollHeight
    for (let y = 0; y < altura - 10; y += window.innerHeight) {
      window.scrollTo({ top: y, behavior: 'instant' })
      await new Promise((resolver) => setTimeout(resolver, espera))
      const algum = alvos.some((el) => {
        const r = el.getBoundingClientRect()
        const estilo = getComputedStyle(el)
        return (
          r.bottom > cab + 20 &&
          r.top < window.innerHeight - 20 &&
          r.width > 0 &&
          r.height > 0 &&
          estilo.visibility !== 'hidden' &&
          Number(estilo.opacity) > 0.05
        )
      })
      const noRodape =
        (document.querySelector('.rodape')?.getBoundingClientRect().top ??
          Number.POSITIVE_INFINITY) <
        window.innerHeight * 0.5
      if (!algum && !noRodape) vazias.push(y)
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
    return vazias
  }, ESPERA_MS)
}

function medirLinhas(pagina) {
  return pagina.evaluate(() => {
    const corpo = document.querySelector('[data-corpo-leitura]')
    if (!corpo) return null
    const medidas = []
    // Conta em que linha cada caractere caiu; vale só a linha cheia (a última fica de fora).
    for (const p of corpo.querySelectorAll(':scope > p')) {
      const porLinha = new Map()
      const andar = document.createTreeWalker(p, NodeFilter.SHOW_TEXT)
      for (let no = andar.nextNode(); no; no = andar.nextNode()) {
        for (let i = 0; i < no.length; i++) {
          const faixa = document.createRange()
          faixa.setStart(no, i)
          faixa.setEnd(no, i + 1)
          const r = faixa.getClientRects()[0]
          if (!r) continue
          const linha = Math.round(r.top / 4)
          porLinha.set(linha, (porLinha.get(linha) ?? 0) + 1)
        }
      }
      const contagens = [...porLinha.entries()].sort((a, b) => a[0] - b[0]).map((e) => e[1])
      medidas.push(...contagens.slice(0, -1))
    }
    medidas.sort((a, b) => a - b)
    const p = corpo.querySelector('p')
    const estilo = p ? getComputedStyle(p) : null
    return {
      corpoPx: estilo ? Number.parseFloat(estilo.fontSize) : 0,
      entrelinha: estilo
        ? Number.parseFloat(estilo.lineHeight) / Number.parseFloat(estilo.fontSize)
        : 0,
      larguraPx: Math.round(corpo.getBoundingClientRect().width),
      caracteresPorLinha: medidas.length ? medidas[Math.floor(medidas.length / 2)] : 0,
    }
  })
}

function progresso(pagina) {
  return pagina.evaluate(async (espera) => {
    const barra = document.querySelector('[data-progresso]')
    const corpo = document.querySelector('[data-corpo-leitura]')
    if (!barra || !corpo) return null
    const ler = () => new DOMMatrix(getComputedStyle(barra).transform).a
    window.scrollTo({ top: 0, behavior: 'instant' })
    await new Promise((resolver) => setTimeout(resolver, espera))
    const inicio = ler()
    const caixa = corpo.getBoundingClientRect()
    window.scrollTo({
      top: caixa.bottom + window.scrollY - window.innerHeight + 2,
      behavior: 'instant',
    })
    await new Promise((resolver) => setTimeout(resolver, espera))
    const fim = ler()
    window.scrollTo({ top: 0, behavior: 'instant' })
    return { inicio, fim }
  }, ESPERA_MS)
}

function filtro(pagina) {
  return pagina.evaluate(async (espera) => {
    const visiveis = () =>
      Array.from(document.querySelectorAll('.bi-item')).filter(
        (li) => li.getBoundingClientRect().height > 0,
      )
    const link = document.querySelector('.bi-filtro[href="#categoria-financas"]')
    if (!(link instanceof HTMLElement)) return { erro: 'sem filtro Finanças' }
    link.click()
    await new Promise((resolver) => setTimeout(resolver, espera))
    const financas = visiveis()
    const categorias = [...new Set(financas.map((li) => li.getAttribute('data-categoria')))]
    location.hash = '#todos'
    await new Promise((resolver) => setTimeout(resolver, espera))
    return { financas: financas.length, categorias, todos: visiveis().length }
  }, ESPERA_MS)
}

async function conferirLinks(pagina, base, marca, problemas) {
  const hrefs = await pagina.evaluate(() =>
    Array.from(
      document.querySelectorAll(
        '.bi-lista a, #leia-tambem a, .artigo-voltar, .artigo-indice a, .artigo-corpo a',
      ),
      (a) => a.getAttribute('href') ?? '',
    ),
  )
  for (const href of new Set(hrefs)) {
    if (href.startsWith('#')) {
      const existe = await pagina.evaluate(
        (id) => document.getElementById(id) !== null,
        href.slice(1),
      )
      if (!existe) problemas.push(`${marca} âncora ${href} sem alvo`)
    } else if (href.startsWith('/')) {
      const resposta = await fetch(new URL(href, base), { method: 'HEAD', redirect: 'manual' })
      if (resposta.status !== 200)
        problemas.push(`${marca} link ${href} respondeu ${resposta.status}`)
    }
  }
}

async function conferirSemJs(navegador, url, marca, problemas) {
  const contexto = await navegador.newContext({ javaScriptEnabled: false })
  try {
    const pagina = await contexto.newPage()
    await pagina.goto(url, { waitUntil: 'load' })
    const estado = await pagina.evaluate(() => ({
      h1: document.querySelector('h1')?.textContent?.trim() ?? '',
      paragrafos: document.querySelectorAll('[data-corpo-leitura] p, .bi-item').length,
      barraVisivel: (() => {
        const barra = document.querySelector('.artigo-progresso')
        return barra ? getComputedStyle(barra).display !== 'none' : false
      })(),
    }))
    if (!estado.h1 || estado.paragrafos === 0)
      problemas.push(`${marca} sem JS: sem título ou sem texto`)
    if (estado.barraVisivel) problemas.push(`${marca} sem JS: barra de progresso visível`)
  } finally {
    await contexto.close()
  }
}

async function varrerPagina(navegador, args, caminho, largura, problemas) {
  const nome = caminho.slice(1).replaceAll('/', '-')
  const marca = `[${navegador.browserType().name()} ${largura} ${caminho}]`
  const url = `${args.base}${PREFIXO}${caminho}`
  const contexto = await navegador.newContext({
    viewport: { width: largura, height: ALTURAS[largura] },
  })
  try {
    const pagina = await contexto.newPage()
    const erros = ouvirErros(pagina, args)
    const resposta = await pagina.goto(url, { waitUntil: 'load' })
    if (resposta?.status() !== 200) problemas.push(`${marca} respondeu ${resposta?.status()}`)
    await pagina.waitForFunction(() => document.documentElement.classList.contains('motion'))
    await pagina.waitForTimeout(1300)
    const vazias = await telasVazias(pagina)
    if (vazias.length) problemas.push(`${marca} telas vazias em y=${vazias.join(', ')}`)
    const linhas = await medirLinhas(pagina)
    const barra = await progresso(pagina)
    if (barra && (barra.inicio > 0.01 || barra.fim < 0.98)) {
      problemas.push(`${marca} progresso ${JSON.stringify(barra)}`)
    }
    if (caminho === '/blog') {
      const f = await filtro(pagina)
      console.log(`${marca} filtro ${JSON.stringify(f)}`)
      if (f.financas !== 3 || f.categorias?.join() !== 'financas' || f.todos !== 12) {
        problemas.push(`${marca} filtro ${JSON.stringify(f)}`)
      }
    }
    await conferirLinks(pagina, args.base, marca, problemas)
    if (linhas) console.log(`${marca} ${JSON.stringify(linhas)} progresso ${JSON.stringify(barra)}`)
    if (await pagina.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) {
      problemas.push(`${marca} scroll horizontal`)
    }
    const pasta = path.join(args.saida, navegador.browserType().name())
    mkdirSync(pasta, { recursive: true })
    await pagina.screenshot({ path: path.join(pasta, `${nome}-${largura}.png`), fullPage: true })
    problemas.push(...erros.map((erro) => `${marca} ${erro}`))
  } finally {
    await contexto.close()
  }
  if (largura === 1440) await conferirSemJs(navegador, url, marca, problemas)
}

async function main() {
  const args = lerArgs(process.argv.slice(2))
  const problemas = []
  for (const nomeDoNavegador of args.navegadores) {
    const navegador = await NAVEGADORES[nomeDoNavegador].launch()
    try {
      for (const largura of args.larguras) {
        for (const caminho of paginasDeLeitura()) {
          await varrerPagina(navegador, args, caminho, largura, problemas)
        }
      }
    } finally {
      await navegador.close()
    }
  }
  if (problemas.length) {
    console.error(`\n${problemas.length} problema(s):\n  ${problemas.join('\n  ')}`)
    process.exit(1)
  }
  console.log('\nLeitura ok: sem erro, sem tela vazia, links e filtro conferidos.')
}

main().catch((erro) => {
  console.error(erro?.stack ?? String(erro))
  process.exit(1)
})
