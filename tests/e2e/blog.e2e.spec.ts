import { expect, test } from '@playwright/test'

const SLUG_DESTAQUE = 'previsao-orcamentaria-guia-sindico'

test.describe('Blog (MDX, sem Payload)', () => {
  test('/blog lista o destaque + 6 posts da grade', async ({ page }) => {
    await page.goto('http://localhost:3000/blog')
    await expect(page.locator('.featured')).toBeVisible()
    await expect(page.locator('.posts .post')).toHaveCount(6)
  })

  test('o destaque não se repete na grade', async ({ page }) => {
    await page.goto('http://localhost:3000/blog')
    await expect(page.locator(`.posts a[href="/blog/${SLUG_DESTAQUE}"]`)).toHaveCount(0)
  })

  test('/blog/<slug> renderiza título, corpo em MDX e relacionados', async ({ page }) => {
    const res = await page.goto(`http://localhost:3000/blog/${SLUG_DESTAQUE}`)
    expect(res?.status()).toBe(200)
    await expect(page.locator('h1')).toContainText('Previsão orçamentária')
    // Corpo (MDX) — trecho do primeiro parágrafo, checado contra produção.
    await expect(page.locator('.article-body')).toContainText(
      'Um orçamento bem construído não é uma peça de burocracia',
    )
    // "Em resumo" — keyTakeaways.
    await expect(page.locator('.article-resumo')).toContainText(
      'Separe despesa recorrente de investimento pontual',
    )
    // Meta com tempo de leitura (frontmatter, não mais Payload).
    await expect(page.locator('.article-meta')).toContainText('11 min de leitura')
    // "Continue lendo" — relacionados, nunca o próprio post.
    await expect(page.locator('.article-related-head')).toBeVisible()
    await expect(page.locator(`.posts a[href="/blog/${SLUG_DESTAQUE}"]`)).toHaveCount(0)
  })

  test('rota inexistente em /blog ainda dá 404', async ({ page }) => {
    const res = await page.goto('http://localhost:3000/blog/post-que-nao-existe-123')
    expect(res?.status()).toBe(404)
  })

  test('/privacidade renderiza o texto legal em MDX', async ({ page }) => {
    await page.goto('http://localhost:3000/privacidade')
    await expect(page.locator('h1')).toHaveText('Política de Privacidade')
    await expect(page.locator('.legal-body')).toContainText(
      'Esta Política de Privacidade descreve como a Semog',
    )
    await expect(page.locator('.legal-body a[href^="mailto:"]')).toBeVisible()
  })

  test('/termos renderiza o texto legal em MDX', async ({ page }) => {
    await page.goto('http://localhost:3000/termos')
    await expect(page.locator('h1')).toHaveText('Termos de Uso')
    await expect(page.locator('.legal-body')).toContainText(
      'Estes Termos de Uso regulam a utilização do site',
    )
  })
})
