import { expect, test } from '@playwright/test'
import { home } from '../../content/pages/home'

/**
 * Os itens da faixa de prova como o conteúdo os declara. O teste compara a
 * página com esta lista em vez de repetir os textos à mão: quando o item
 * `35 anos` saiu de `content/pages/home.ts` (27/08/2026, pra abrir espaço ao
 * G20), a cópia escrita aqui ficou vermelha e assim permaneceu — a suíte e2e
 * não roda na CI, então ninguém viu.
 */
const ITENS_DA_PROVA = home.layout.flatMap((bloco) =>
  bloco.blockType === 'hero' ? (bloco.proofItems ?? []) : [],
)

test.describe('Home redesenhada', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/')
  })

  test('mostra a faixa de prova acima da dobra', async ({ page }) => {
    expect(ITENS_DA_PROVA.length).toBeGreaterThan(0)

    const proof = page.locator('.hero-proof')
    await expect(proof).toBeVisible()
    await expect(proof.locator('.hero-proof-item')).toHaveCount(ITENS_DA_PROVA.length)
    for (const item of ITENS_DA_PROVA) {
      await expect(proof).toContainText(item.value)
      await expect(proof).toContainText(item.label)
    }
  })

  test('os números aparecem em faixa, sem o mapa', async ({ page }) => {
    await expect(page.getByText('Liderança não se declara')).toBeVisible()
    await expect(page.locator('svg[data-brazil-map]')).toHaveCount(0)
  })

  test('os pilares estão em colunas', async ({ page }) => {
    await expect(page.locator('.pillars-columns')).toHaveCount(1)
    await expect(page.locator('.pillar-row')).toHaveCount(0)
  })

  test('tem uma seção do aplicativo com nota e selos das lojas', async ({ page }) => {
    await expect(page.locator('.app-rating')).toBeVisible()
    await expect(page.getByRole('link', { name: /app store/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /google play/i }).first()).toBeVisible()
  })

  test('o CTA final oferece um segundo caminho', async ({ page }) => {
    const actions = page.locator('.final-cta-actions a')
    await expect(actions).toHaveCount(2)
  })

  test('a página não rola na horizontal em 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.reload()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    )
    expect(overflow).toBe(false)
  })
})
