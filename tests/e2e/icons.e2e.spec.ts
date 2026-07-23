import { expect, test } from '@playwright/test'

test.describe('Ícones do site', () => {
  test('serve o icon.svg e o apple-icon.png', async ({ request }) => {
    const icon = await request.get('http://localhost:3000/icon.svg')
    expect(icon.status()).toBe(200)
    expect(icon.headers()['content-type']).toContain('image/svg+xml')

    const apple = await request.get('http://localhost:3000/apple-icon.png')
    expect(apple.status()).toBe(200)
    expect(apple.headers()['content-type']).toContain('image/png')
  })

  test('a home declara o ícone no <head>', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    const icon = page.locator('link[rel="icon"]')
    await expect(icon).toHaveCount(1)
  })
})
