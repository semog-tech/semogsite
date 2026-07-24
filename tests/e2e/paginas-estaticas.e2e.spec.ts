import { expect, test } from '@playwright/test'

const ROTAS = [
  '/',
  '/semog',
  '/solucoes',
  '/garante',
  '/incorporadoras',
  '/contato',
  '/proposta',
  '/privacidade',
  '/termos',
]

test.describe('páginas servidas do conteúdo estático', () => {
  for (const rota of ROTAS) {
    test(`${rota} responde 200 com h1`, async ({ page }) => {
      const res = await page.goto(`http://localhost:3000${rota}`)
      expect(res?.status()).toBe(200)
      await expect(page.locator('h1').first()).toBeVisible()
    })
  }

  test('home mantém a faixa de prova e a seção do app', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    await expect(page.locator('.hero-proof')).toBeVisible()
    await expect(page.locator('.app-rating')).toBeVisible()
  })

  test('rota inexistente ainda dá 404', async ({ page }) => {
    const res = await page.goto('http://localhost:3000/rota-que-nao-existe-123')
    expect(res?.status()).toBe(404)
  })
})
