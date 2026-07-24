import { expect, test } from '@playwright/test'

test.describe('Home', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/')
  })

  test('tem o título e a headline da Semog', async ({ page }) => {
    await expect(page).toHaveTitle(/Semog/)
    await expect(page.locator('h1').first()).toContainText('Preocupe-se apenas')
  })

  test('declara o idioma como pt-BR', async ({ page }) => {
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR')
  })

  test('tem uma hierarquia de títulos sem furos', async ({ page }) => {
    const h1 = await page.locator('h1').count()
    expect(h1, 'a página deve ter exatamente um h1').toBe(1)
    expect(await page.locator('h2').count()).toBeGreaterThan(0)
  })

  test('toda imagem tem alt', async ({ page }) => {
    const semAlt = await page.locator('img:not([alt])').count()
    expect(semAlt).toBe(0)
  })

  test('a navegação principal leva às páginas institucionais', async ({ page }) => {
    for (const [rotulo, href] of [
      ['A Semog', '/semog'],
      ['Soluções', '/solucoes'],
      ['Contato', '/contato'],
    ] as const) {
      await expect(page.locator(`nav a[href="${href}"]`).first()).toContainText(rotulo)
    }
  })

  test('o CTA principal leva para a proposta', async ({ page }) => {
    await expect(page.locator('a[href="/proposta"]').first()).toBeVisible()
  })
})

test.describe('Páginas institucionais', () => {
  for (const rota of ['/semog', '/solucoes', '/garante', '/contato', '/proposta', '/blog']) {
    test(`${rota} responde 200 e tem h1`, async ({ page }) => {
      const res = await page.goto(`http://localhost:3000${rota}`)
      expect(res?.status()).toBe(200)
      await expect(page.locator('h1').first()).toBeVisible()
    })
  }
})

test.describe('404', () => {
  test('rota inexistente devolve 404 com título próprio', async ({ page }) => {
    const res = await page.goto('http://localhost:3000/rota-que-nao-existe-123')
    expect(res?.status()).toBe(404)
    await expect(page).toHaveTitle(/não encontrada/i)
  })
})
