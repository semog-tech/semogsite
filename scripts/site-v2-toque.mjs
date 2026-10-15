/* Toque · flicks dentro das cenas presas (rode depois do build). Celular emulado de verdade
   (390×844, deviceScaleFactor 3, isMobile, hasTouch) no Chromium com SwiftShader: em cada pin
   com data-patamares, parte de um patamar e faz flicks de toque (Input.dispatchTouchEvent com
   carimbo de tempo: o dedo anda a uma velocidade fixa e solta), lento, médio e rápido para a
   frente e médio para trás. A inércia é a nativa do Chromium completo (channel "chromium"); o
   headless-shell não faz fling, e o Input.synthesizeScrollGesture não rola nada nele. Depois do gesto e de 1,5 s parado, registra
   o progresso do pin: tem de estar num patamar (±0,02), e o flick médio anda no máximo dois.
   No desktop (1440×900, mouse), a roda para entre dois patamares e a rolagem não pode se mexer
   sozinha depois (sem snap).
   Sai com código 1 se algo falhar. Opções: --cena <id> (repete), --sem-desktop, --relatorio
   (só imprime a tabela, sem cobrar os critérios: para medir a linha de base).
   Uso: node scripts/site-v2-toque.mjs --url <endereço> --cena <id> [--cena <id>] [--sem-desktop] [--relatorio] */
import { chromium } from '@playwright/test'

const ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
/** Velocidade do dedo (px/s) e quanto ele arrasta (px) antes de soltar. */
const FLICKS = [
  { nome: 'lento', velocidade: 600, arrasto: 180, sentido: 1 },
  { nome: 'médio', velocidade: 1800, arrasto: 300, sentido: 1 },
  { nome: 'rápido', velocidade: 3600, arrasto: 420, sentido: 1 },
  { nome: 'médio ↑', velocidade: 1800, arrasto: 300, sentido: -1 },
]
/** Intervalo entre os touchmove: um quadro a 60 Hz. */
const QUADRO_S = 1 / 60
const TOLERANCIA = 0.02
const MAXIMO_MEDIO = 2

function lerArgs(argv) {
  const args = { url: '', cenas: [], desktop: true, relatorio: false }
  const fila = [...argv]
  while (fila.length) {
    const opcao = fila.shift()
    if (opcao === '--cena') args.cenas.push(fila.shift())
    else if (opcao === '--sem-desktop') args.desktop = false
    else if (opcao === '--relatorio') args.relatorio = true
    else if (opcao === '--url') args.url = fila.shift()
    else throw new Error(`Opção desconhecida: ${opcao}`)
  }
  if (!args.url || !args.cenas.length) throw new Error('Obrigatórios: --url e --cena.')
  return args
}

async function abrir(pagina, url) {
  await pagina.goto(url, { waitUntil: 'load' })
  await pagina.waitForFunction(() => document.documentElement.classList.contains('motion'), null, {
    timeout: 15000,
  })
  await pagina.waitForTimeout(1200)
}

/** Geometria do pin da cena: começo, extensão e patamares, lidos do DOM (pin-spacer). */
function geometria(pagina, id) {
  return pagina.evaluate((alvoId) => {
    const alvo = document.querySelector(`#${alvoId} [data-patamares]`)
    const espaco = alvo?.parentElement
    if (!(alvo instanceof HTMLElement) || !espaco?.classList.contains('pin-spacer')) {
      throw new Error(`#${alvoId}: pin com data-patamares não encontrado`)
    }
    const inicio = espaco.getBoundingClientRect().top + window.scrollY
    const extensao = espaco.offsetHeight - alvo.offsetHeight
    const patamares = (alvo.dataset.patamares ?? '').split(' ').map(Number)
    return { inicio, extensao, patamares }
  }, id)
}

async function progresso(pagina, geo) {
  const y = await pagina.evaluate(() => window.scrollY)
  return (y - geo.inicio) / geo.extensao
}

/** Espera a rolagem parar (inércia e snap) e mais 1,5 s. */
async function assentar(pagina) {
  let anterior = -1
  for (let i = 0; i < 40; i += 1) {
    await pagina.waitForTimeout(150)
    const y = await pagina.evaluate(() => window.scrollY)
    if (Math.abs(y - anterior) < 0.5) break
    anterior = y
  }
  await pagina.waitForTimeout(1500)
}

async function irPara(pagina, geo, p) {
  await pagina.evaluate((y) => window.scrollTo(0, y), Math.round(geo.inicio + p * geo.extensao))
  await assentar(pagina)
}

/** Índice do patamar mais próximo e a distância até ele. */
function maisProximo(patamares, p) {
  let indice = 0
  for (let i = 1; i < patamares.length; i += 1) {
    if (Math.abs(patamares[i] - p) < Math.abs(patamares[indice] - p)) indice = i
  }
  return { indice, distancia: Math.abs(patamares[indice] - p) }
}

/** O dedo desce (ou sobe) em linha reta, um touchmove por quadro, e solta ainda andando. */
async function flick(cdp, { velocidade, arrasto, sentido }) {
  const y0 = sentido > 0 ? 680 : 160
  const quadros = Math.max(2, Math.round(arrasto / velocidade / QUADRO_S))
  const passo = arrasto / quadros
  const t0 = Date.now() / 1000
  const tocar = (type, k) =>
    cdp.send('Input.dispatchTouchEvent', {
      type,
      timestamp: t0 + k * QUADRO_S,
      touchPoints: type === 'touchEnd' ? [] : [{ x: 195, y: y0 - sentido * passo * k, id: 1 }],
    })
  await tocar('touchStart', 0)
  for (let k = 1; k <= quadros; k += 1) {
    await tocar('touchMove', k)
    await new Promise((ok) => setTimeout(ok, QUADRO_S * 1000))
  }
  await tocar('touchEnd', quadros)
}

/** Um flick a partir do patamar `de`; devolve a linha da tabela. */
async function medirFlick(pagina, cdp, geo, de, flickVars) {
  await irPara(pagina, geo, geo.patamares[de])
  const antes = await progresso(pagina, geo)
  await flick(cdp, flickVars)
  await assentar(pagina)
  const depois = await progresso(pagina, geo)
  const dentro = depois >= -0.001 && depois <= 1.001
  const { indice, distancia } = maisProximo(geo.patamares, depois)
  const partiu = maisProximo(geo.patamares, antes)
  return {
    flick: flickVars.nome,
    preparo: partiu.indice === de && partiu.distancia <= TOLERANCIA,
    de: Number(antes.toFixed(3)),
    para: Number(depois.toFixed(3)),
    patamar: dentro ? indice : null,
    noPatamar: dentro && distancia <= TOLERANCIA,
    avancou: dentro ? indice - de : null,
  }
}

/** Patamar de partida: o segundo (há para onde ir nos dois sentidos). */
function partida(geo) {
  return Math.min(1, geo.patamares.length - 2)
}

async function celular(navegador, base, cenas, falhas, relatorio) {
  const contexto = await navegador.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  })
  const pagina = await contexto.newPage()
  const erros = []
  pagina.on('pageerror', (e) => erros.push(e.message))
  // O 404 vem pela resposta, com a URL; a mensagem de console dele não diz qual recurso.
  pagina.on('response', (r) => r.status() >= 400 && erros.push(`HTTP ${r.status()} ${r.url()}`))
  pagina.on('console', (m) => {
    if (m.type() === 'error' && !m.text().startsWith('Failed to load resource'))
      erros.push(m.text())
  })
  const cdp = await contexto.newCDPSession(pagina)
  const linhas = []
  for (const [arquivo, id] of cenas) {
    await abrir(pagina, `${base}${arquivo}`)
    const toque = await pagina.evaluate(
      () => matchMedia('(hover: none), (pointer: coarse)').matches,
    )
    if (!toque) falhas.push(`${id}: a emulação não casou (hover: none), (pointer: coarse)`)
    const geo = await geometria(pagina, id)
    for (const f of FLICKS) {
      const linha = { cena: id, ...(await medirFlick(pagina, cdp, geo, partida(geo), f)) }
      linhas.push(linha)
      if (!linha.preparo) falhas.push(`${id} ${f.nome}: não assentou no patamar de partida`)
      if (relatorio) continue
      if (linha.patamar !== null && !linha.noPatamar) {
        falhas.push(`${id} ${f.nome}: parou em ${linha.para}, fora de patamar`)
      }
      if (f.nome === 'médio' && (linha.avancou === null || linha.avancou > MAXIMO_MEDIO)) {
        falhas.push(`${id} médio: avançou ${linha.avancou ?? 'para fora do pin'}`)
      }
      if (f.nome === 'médio ↑' && linha.avancou !== null && linha.avancou >= 0) {
        falhas.push(`${id} médio ↑: não voltou (avançou ${linha.avancou})`)
      }
    }
  }
  console.table(linhas)
  if (erros.length) falhas.push(...erros.map((e) => `celular: ${e}`))
  await contexto.close()
}

/** Desktop: a roda para entre dois patamares e a rolagem fica onde parou. */
async function desktop(navegador, base, cenas, falhas) {
  const contexto = await navegador.newContext({ viewport: { width: 1440, height: 900 } })
  const pagina = await contexto.newPage()
  for (const [arquivo, id] of cenas) {
    await abrir(pagina, `${base}${arquivo}`)
    const geo = await geometria(pagina, id)
    const meio = (geo.patamares[1] + geo.patamares[2]) / 2
    await irPara(pagina, geo, geo.patamares[1])
    await pagina.mouse.move(720, 450)
    const passos = Math.max(1, Math.round(((meio - geo.patamares[1]) * geo.extensao) / 100))
    for (let i = 0; i < passos; i += 1) await pagina.mouse.wheel(0, 100)
    // Lenis termina a suavização; depois disso, nada pode mover a rolagem.
    await pagina.waitForTimeout(1200)
    const parado = await pagina.evaluate(() => window.scrollY)
    await pagina.waitForTimeout(1500)
    const depois = await pagina.evaluate(() => window.scrollY)
    const p = await progresso(pagina, geo)
    console.log(`desktop ${id}: parou em ${p.toFixed(3)}, moveu ${depois - parado}px depois`)
    if (Math.abs(depois - parado) > 1) falhas.push(`desktop ${id}: rolagem andou sozinha`)
  }
  await contexto.close()
}

const args = lerArgs(process.argv.slice(2))
const cenas = args.cenas.map((id) => [args.url, id])
const navegador = await chromium.launch({ channel: 'chromium', args: ARGS })
const falhas = []
try {
  await celular(navegador, '', cenas, falhas, args.relatorio)
  if (args.desktop) await desktop(navegador, '', cenas, falhas)
} finally {
  await navegador.close()
}
if (falhas.length) {
  console.error(`\n${falhas.length} falha(s):\n- ${falhas.join('\n- ')}`)
  process.exit(1)
}
console.log('\nToque e desktop: tudo certo.')
