/* Varredura lado a lado das páginas institucionais do site v2 (fase 4): para cada página, abre a
   versão no Next (prévia) e a do protótipo, rola até cada seção (main > section[id]), espera a
   cena assentar e fotografa as duas, para comparar os quadros. Em Chromium e Firefox, 1440 e 390.
   Acusa erro de console, de página e de rede, resposta >= 400, html.motion que não chega, scroll
   horizontal e seção que existe num lado e não no outro.
   Ruído conhecido, fora da conta (o mesmo de scripts/site-v2-leitura.mjs): o cookie __cf_bm de
   imagem de CDN de terceiro no Firefox e, só com --build-sem-env, o aviso do Turnstile sem chave.
   Uso: node scripts/site-v2-institucional.mjs --next http://localhost:3100
        --prototipo http://127.0.0.1:4180 --saida <pasta> [--pagina home] [--pagina semog]
        [--navegador chromium|firefox] [--largura 1440|390] [--build-sem-env]
   Sai com código 1 se algo falhar. */
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { chromium, firefox } from '@playwright/test'

const PAGINAS = {
  home: { next: '/previa-v2', prototipo: '/index.html' },
  semog: { next: '/previa-v2/semog', prototipo: '/semog.html' },
  gestao: {
    next: '/previa-v2/administracao-de-condominios',
    prototipo: '/administracao-de-condominios.html',
  },
  garante: { next: '/previa-v2/garante', prototipo: '/garante.html' },
  incorporadoras: { next: '/previa-v2/incorporadoras', prototipo: '/incorporadoras.html' },
  tecnologia: { next: '/previa-v2/tecnologia', prototipo: '/tecnologia.html' },
  solucoes: { next: '/previa-v2/solucoes', prototipo: null },
  proposta: { next: '/previa-v2/proposta', prototipo: '/proposta.html' },
  contato: { next: '/previa-v2/contato', prototipo: '/contato.html' },
  'nao-encontrada': { next: '/previa-v2/nao-encontrada', prototipo: '/404.html' },
}
const ALTURAS = { 1440: 900, 390: 844 }
const NAVEGADORES = { chromium, firefox }
const ASSENTAR_MS = 1500
const RUIDO_DE_TERCEIRO = /Cookie .__cf_bm. has been rejected for invalid domain/
const RUIDO_SEM_ENV = /\[turnstile\] NEXT_PUBLIC_TURNSTILE_SITE_KEY ausente/

function lerArgs(argv) {
  const args = {
    next: null,
    prototipo: null,
    saida: null,
    paginas: [],
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
    if (opcao === '--next') args.next = valor.replace(/\/+$/, '')
    else if (opcao === '--prototipo') args.prototipo = valor.replace(/\/+$/, '')
    else if (opcao === '--saida') args.saida = valor
    else if (opcao === '--pagina') args.paginas.push(valor)
    else if (opcao === '--navegador') args.navegadores = [valor]
    else if (opcao === '--largura') args.larguras = [Number(valor)]
    else throw new Error(`Opção desconhecida: ${opcao}`)
  }
  if (!args.next || !args.prototipo || !args.saida) {
    throw new Error('Obrigatórios: --next, --prototipo e --saida.')
  }
  if (args.paginas.length === 0) args.paginas = Object.keys(PAGINAS)
  for (const pagina of args.paginas) {
    if (!(pagina in PAGINAS)) throw new Error(`Página desconhecida: ${pagina}`)
  }
  if (!args.navegadores.every((nome) => nome in NAVEGADORES)) {
    throw new Error('--navegador deve ser chromium ou firefox.')
  }
  if (!args.larguras.every((largura) => largura in ALTURAS)) {
    throw new Error('--largura deve ser 1440 ou 390.')
  }
  return args
}

function ouvirErros(pagina, args, marca, problemas) {
  pagina.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const texto = msg.text()
    if (RUIDO_DE_TERCEIRO.test(texto) || (args.semEnv && RUIDO_SEM_ENV.test(texto))) return
    problemas.push(`${marca}: console: ${texto}`)
  })
  pagina.on('pageerror', (erro) => problemas.push(`${marca}: página: ${erro.message}`))
  pagina.on('requestfailed', (req) =>
    problemas.push(`${marca}: requisição: ${req.url()} (${req.failure()?.errorText ?? '?'})`),
  )
  pagina.on('response', (resp) => {
    if (resp.status() >= 400) problemas.push(`${marca}: ${resp.status()} em ${resp.url()}`)
  })
}

async function abrir(contexto, url, args, marca, problemas) {
  const pagina = await contexto.newPage()
  ouvirErros(pagina, args, marca, problemas)
  await pagina.goto(url, { waitUntil: 'load' })
  try {
    await pagina.waitForFunction(
      () => document.documentElement.classList.contains('motion'),
      null,
      {
        timeout: 10_000,
      },
    )
  } catch {
    problemas.push(`${marca}: html.motion não chegou em 10 s`)
  }
  return pagina
}

function idsDasSecoes(pagina) {
  return pagina.evaluate(() =>
    Array.from(document.querySelectorAll('main > section[id]')).map((secao) => secao.id),
  )
}

async function rolarAte(pagina, id) {
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    const alvo = await pagina.evaluate((secao) => {
      const el = document.getElementById(secao)
      if (!el) return null
      const y = Math.round(el.getBoundingClientRect().top + window.scrollY)
      window.scrollTo(0, y)
      return y
    }, id)
    if (alvo === null) return false
    await pagina.waitForTimeout(ASSENTAR_MS)
    const real = await pagina.evaluate(() => window.scrollY)
    if (Math.abs(real - alvo) <= 2) return true
  }
  return true
}

async function varrer(pagina, ids, pasta, lado, marca, problemas) {
  for (const id of ids) {
    if (!(await rolarAte(pagina, id))) {
      problemas.push(`${marca}: #${id} ausente`)
      continue
    }
    await pagina.screenshot({ path: path.join(pasta, `${id}-${lado}.png`) })
  }
  const largo = await pagina.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  )
  if (largo) problemas.push(`${marca}: scroll horizontal`)
}

async function conferirPagina(contexto, args, rotulos, problemas) {
  const { nome, id, largura } = rotulos
  const urls = PAGINAS[id]
  const pasta = path.join(args.saida, nome, String(largura), id)
  mkdirSync(pasta, { recursive: true })
  const marca = `${nome} ${largura} ${id}`
  const next = await abrir(contexto, `${args.next}${urls.next}`, args, `${marca} next`, problemas)
  const ids = await idsDasSecoes(next)
  if (ids.length === 0) problemas.push(`${marca} next: nenhuma seção em main`)
  await varrer(next, ids, pasta, 'next', `${marca} next`, problemas)
  await next.close()
  if (!urls.prototipo) return
  const prototipo = await abrir(
    contexto,
    `${args.prototipo}${urls.prototipo}`,
    args,
    `${marca} protótipo`,
    problemas,
  )
  const doPrototipo = await idsDasSecoes(prototipo)
  const faltam = doPrototipo.filter((secao) => !ids.includes(secao))
  const sobram = ids.filter((secao) => !doPrototipo.includes(secao))
  if (faltam.length) problemas.push(`${marca}: seções do protótipo ausentes no Next: ${faltam}`)
  if (sobram.length) problemas.push(`${marca}: seções do Next fora do protótipo: ${sobram}`)
  await varrer(
    prototipo,
    ids.filter((secao) => doPrototipo.includes(secao)),
    pasta,
    'prototipo',
    `${marca} protótipo`,
    problemas,
  )
  await prototipo.close()
}

const args = lerArgs(process.argv.slice(2))
const problemas = []
for (const nome of args.navegadores) {
  const navegador = await NAVEGADORES[nome].launch()
  try {
    for (const largura of args.larguras) {
      const contexto = await navegador.newContext({
        viewport: { width: largura, height: ALTURAS[largura] },
      })
      for (const id of args.paginas) {
        await conferirPagina(contexto, args, { nome, id, largura }, problemas)
      }
      await contexto.close()
    }
  } finally {
    await navegador.close()
  }
}
if (problemas.length) {
  console.error(problemas.join('\n'))
  process.exit(1)
}
console.log(
  `ok: ${args.paginas.length} páginas × ${args.navegadores.length} navegadores × ${args.larguras.length} larguras`,
)
