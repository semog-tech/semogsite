import { statSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'

const KB = 1024

// Tamanho real em disco dos 4 clipes — a soma é o "orçamento" de 1 download
// por clipe (o próprio bug: o desenho antigo rebaixava isso a cada volta do
// ciclo). Lido do arquivo em vez de hardcoded para não desalinhar se os
// clipes forem trocados.
const HERO_DIR = join(process.cwd(), 'public', 'hero')
const CLIP_FILES = ['recife.mp4', 'joao-pessoa.mp4', 'campina-grande.mp4', 'belem.mp4']
const CLIPS_TOTAL_BYTES = CLIP_FILES.reduce(
  (sum, file) => sum + statSync(join(HERO_DIR, file)).size,
  0,
)

test.describe('Vídeo de fundo do hero', () => {
  test('não baixa nenhum clipe mais de uma vez em ~30s de ciclo', async ({ page }) => {
    // Precisa cobrir mais de uma volta completa do ciclo (4 clipes de ~5s
    // cada, ~20s de ciclo) para provar que a volta não rebaixa nada. O
    // timeout default do Playwright (30s) não sobra margem pro resto do
    // teste, então damos um teto bem maior.
    test.setTimeout(90_000)

    // `page.on('response')`/content-length não servem aqui: o Chromium faz
    // range requests que se sobrepõem, então contar por resposta HTTP
    // subestima ou superestima o total. `Network.dataReceived` do CDP é o
    // número de bytes que realmente passaram na conexão (true on-wire),
    // que é o que o bug original inflava.
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Network.enable')

    const requestUrls = new Map<string, string>()
    let bytes = 0
    cdp.on('Network.requestWillBeSent', (e) => {
      if (/\/hero\/.*\.mp4/.test(e.request.url)) requestUrls.set(e.requestId, e.request.url)
    })
    cdp.on('Network.dataReceived', (e) => {
      if (requestUrls.has(e.requestId)) bytes += e.encodedDataLength || e.dataLength || 0
    })

    await page.goto('http://localhost:3000/', { waitUntil: 'load' })

    // Janela de carga inicial (~2s): pega o defeito original desta task —
    // carregar a sequência inteira já na carga da página (`preload="auto"`
    // ou `src` atribuído a todos os elementos no mount) — que o teto de 30s
    // acima sozinho NÃO cobre (baixar os 4 clipes uma única vez, ~2,9 MB,
    // fica dentro do orçamento de 1.15x). Em ~2s o desktop já pediu 2 clipes
    // distintos, não 1: o primeiro toca desde o `load()`, e o `tick` de rAF
    // libera o `src` do segundo elemento assim que `shouldPreload` fica
    // verdadeiro — com clipes de ~5,04s e `PRELOAD_LEAD_S = 3`, isso acontece
    // ~2,04s depois do play do primeiro clipe, ou seja, ainda dentro da
    // janela de 2s medida aqui. Por isso o teto é 2, não 1 — apertar pra 1
    // deixaria o teste flaky (a corrida entre o play do 1º clipe e o
    // preload do 2º é sensível a alguns dezenas de ms). Um carregamento eager
    // pediria os 4 de uma vez e estouraria esse teto de 2.
    await page.waitForTimeout(2_000)
    const distinctClipsAt2s = new Set(requestUrls.values()).size
    expect(
      distinctClipsAt2s,
      `pediu ${distinctClipsAt2s} clipes de vídeo distintos em ~2s de carga (esperado: no máx. 2)`,
    ).toBeLessThanOrEqual(2)

    await page.waitForTimeout(28_000)

    // Teto de 1.15x a soma dos 4 clipes: acomoda overhead de range requests
    // (headers repetidos, pequenas sobreposições) sem deixar passar um
    // segundo download completo de qualquer clipe.
    const budget = 1.15 * CLIPS_TOTAL_BYTES
    expect(
      bytes,
      `baixou ${Math.round(bytes / KB)} KB de vídeo (orçamento: ${Math.round(budget / KB)} KB = 1.15x os ${Math.round(CLIPS_TOTAL_BYTES / KB)} KB dos 4 clipes em disco)`,
    ).toBeLessThan(budget)
  })

  test('mostra o poster antes do vídeo decodificar', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    const first = page.locator('section video').first()
    await expect(first).toHaveAttribute('poster', /poster\.webp/)
  })

  test('no mobile usa um clipe só', async ({ page }) => {
    const urls = new Set<string>()
    page.on('request', (req) => {
      if (/\/hero\/.*\.mp4/.test(req.url())) urls.add(req.url())
    })

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('http://localhost:3000/', { waitUntil: 'load' })
    await page.waitForTimeout(3000)

    expect(urls.size).toBeLessThanOrEqual(1)
  })

  test('pode pausar e retomar o vídeo de fundo', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    const button = page.getByRole('button', { name: /pausar vídeo de fundo/i })
    await expect(button).toBeVisible()

    await button.click()
    await expect(page.getByRole('button', { name: /retomar vídeo de fundo/i })).toBeVisible()

    const isPaused = await page.locator('section video').first().evaluate((v: HTMLVideoElement) => v.paused)
    expect(isPaused).toBe(true)
  })
})
