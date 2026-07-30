import { expect, test } from '@playwright/test'

/**
 * Regressão dos globais de layout (header/footer/company) após saírem do
 * Payload (`findGlobal`) pra `content/site.ts` — confere que os três
 * server components (`HeaderServer`/`FooterServer`/`WhatsAppFloat`) seguem
 * renderizando os mesmos dados de produção (fonte: `src/seed/globals.ts`).
 */

test.describe('header (global content/site.ts)', () => {
  test('nav principal tem os links institucionais', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    const nav = page.locator('.nav-links')
    for (const [rotulo, href] of [
      ['A Semog', '/semog'],
      ['Soluções', '/solucoes'],
      ['Incorporadoras', '/incorporadoras'],
      ['Blog', '/blog'],
      ['Contato', '/contato'],
    ] as const) {
      await expect(nav.locator(`a[href="${href}"]`)).toContainText(rotulo)
    }
  })

  test('CTA e área do cliente apontam pros destinos certos', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    await expect(page.locator('.nav-cta')).toHaveAttribute('href', '/proposta')
    await expect(page.locator('.nav-secondary')).toHaveAttribute(
      'href',
      'https://semog.superlogica.net/clients/areadocondomino',
    )
  })
})

test.describe('footer (global content/site.ts)', () => {
  test('tem as 3 colunas de links com título e itens certos', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    const grid = page.locator('.footer-grid')

    const institucional = grid.locator('div', {
      has: page.getByRole('heading', { name: 'Institucional' }),
    })
    await expect(institucional.locator('a[href="/semog"]')).toContainText('A Semog')
    await expect(institucional.locator('a[href="/blog"]')).toContainText('Blog')

    const solucoes = grid.locator('div', { has: page.getByRole('heading', { name: 'Soluções' }) })
    await expect(solucoes.locator('a[href="/garante"]')).toContainText('Semog Garante')
    await expect(solucoes.locator('a[href="/administracao-de-condominios"]')).toContainText(
      'Administração de condomínios',
    )

    const ondeEstamos = grid.locator('div', {
      has: page.getByRole('heading', { name: 'Onde estamos' }),
    })
    await expect(
      ondeEstamos.locator('a[href="/administradora-de-condominios-recife"]'),
    ).toContainText('Recife')
    await expect(
      ondeEstamos.locator('a[href="/administradora-de-condominios-belem"]'),
    ).toContainText('Belém')
  })

  test('tem os links legais e o slogan do foot-cta', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    await expect(page.locator('.foot-cta .slog')).toContainText('Preocupe-se apenas')
    await expect(page.locator('.foot-cta .slog em')).toContainText('em morar.')

    const legal = page.locator('.legal')
    await expect(legal.locator('a[href="/privacidade"]')).toContainText('Privacidade')
    await expect(legal.locator('a[href="/termos"]')).toContainText('Termos de uso')
  })
})

test.describe('WhatsApp float (global content/site.ts)', () => {
  test('botão flutuante aponta pro número real da Semog', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    await expect(page.locator('.wa-float')).toHaveAttribute('href', 'https://wa.me/551130034506')
  })
})
