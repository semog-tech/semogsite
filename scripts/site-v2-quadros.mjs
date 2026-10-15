/* Quadros de uma cena presa do site v2: abre a página, espera html.motion, mede o pin da cena
   (pin-spacer + data-patamares) e fotografa a tela em 0, 25, 50, 75 e 100% do pin, para
   comparar lado a lado o site no Next com o protótipo (mesmos quadros nas mesmas posições).
   Uso: node scripts/site-v2-quadros.mjs --url <endereço> --cena <id> --saida <pasta>
        [--navegador chromium|firefox] [--largura 1440|390]
   Sai com código 1 se houver erro de página, erro de console, resposta >= 400 ou scroll
   horizontal. */
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { chromium, firefox } from '@playwright/test'

const PROGRESSOS = [0, 0.25, 0.5, 0.75, 1]
/** Espera depois de rolar: deixa o scrub (0,7 s) e o Lenis assentarem antes do print. */
const ASSENTAR_MS = 1500

function lerArgs(argv) {
  const args = { navegador: 'chromium', largura: 1440 }
  const fila = [...argv]
  while (fila.length) {
    const opcao = fila.shift()
    const valor = fila.shift()
    if (valor === undefined) throw new Error(`Opção sem valor: ${opcao}`)
    if (opcao === '--url') args.url = valor
    else if (opcao === '--cena') args.cena = valor
    else if (opcao === '--saida') args.saida = valor
    else if (opcao === '--navegador') args.navegador = valor
    else if (opcao === '--largura') args.largura = Number(valor)
    else throw new Error(`Opção desconhecida: ${opcao}`)
  }
  if (!args.url || !args.cena || !args.saida) {
    throw new Error('Obrigatórios: --url, --cena e --saida.')
  }
  return args
}

/** Começo e extensão do pin da cena, lidos do pin-spacer. */
function geometria(pagina, id) {
  return pagina.evaluate((alvoId) => {
    const alvo = document.querySelector(`#${alvoId} [data-patamares]`)
    const espaco = alvo?.parentElement
    if (!(alvo instanceof HTMLElement) || !espaco?.classList.contains('pin-spacer')) {
      throw new Error(`#${alvoId}: pin com data-patamares não encontrado`)
    }
    return {
      inicio: espaco.getBoundingClientRect().top + window.scrollY,
      extensao: espaco.offsetHeight - alvo.offsetHeight,
    }
  }, id)
}

async function rolarAte(pagina, y) {
  await pagina.evaluate((alvoY) => window.scrollTo(0, alvoY), y)
  await pagina.waitForTimeout(ASSENTAR_MS)
  const real = await pagina.evaluate(() => window.scrollY)
  if (Math.abs(real - y) <= 2) return
  await pagina.evaluate((alvoY) => window.scrollTo(0, alvoY), y)
  await pagina.waitForTimeout(ASSENTAR_MS)
}

async function main() {
  const args = lerArgs(process.argv.slice(2))
  const tipo = args.navegador === 'firefox' ? firefox : chromium
  const navegador = await tipo.launch()
  const falhas = []
  try {
    const altura = args.largura < 761 ? 844 : 900
    const contexto = await navegador.newContext({
      viewport: { width: args.largura, height: altura },
    })
    const pagina = await contexto.newPage()
    pagina.on('pageerror', (erro) => falhas.push(`pageerror: ${erro.message}`))
    pagina.on('console', (msg) => {
      if (msg.type() === 'error') falhas.push(`console: ${msg.text()}`)
    })
    pagina.on('response', (resposta) => {
      if (resposta.status() >= 400) falhas.push(`HTTP ${resposta.status()} ${resposta.url()}`)
    })
    await pagina.goto(args.url, { waitUntil: 'load' })
    await pagina.waitForFunction(
      () => document.documentElement.classList.contains('motion'),
      null,
      {
        timeout: 15000,
      },
    )
    await pagina.waitForTimeout(1200)
    const geo = await geometria(pagina, args.cena)
    mkdirSync(args.saida, { recursive: true })
    for (const p of PROGRESSOS) {
      await rolarAte(pagina, Math.round(geo.inicio + p * geo.extensao))
      const rotulo = String(Math.round(p * 100)).padStart(3, '0')
      const nome = `${args.cena}-${args.navegador}-${args.largura}-${rotulo}.png`
      await pagina.screenshot({ path: path.join(args.saida, nome) })
    }
    const horizontal = await pagina.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    )
    if (horizontal) falhas.push('scroll horizontal')
  } finally {
    await navegador.close()
  }
  if (falhas.length) {
    console.error(`${falhas.length} falha(s):\n- ${falhas.join('\n- ')}`)
    process.exitCode = 1
    return
  }
  console.log(`Quadros salvos em ${args.saida}`)
}

main().catch((erro) => {
  console.error(erro)
  process.exitCode = 1
})
