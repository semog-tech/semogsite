import { readdirSync } from 'node:fs'
import path from 'node:path'
import { expect, test } from '@playwright/test'

const SLUG_DESTAQUE = 'previsao-orcamentaria-guia-sindico'

/**
 * Todos os posts publicados, da mesma fonte que a página lê
 * (`content/blog/*.mdx`). Playwright roda com cwd na raiz do repo, mesma
 * premissa de `src/lib/blog.ts`.
 */
const SLUGS_PUBLICADOS = readdirSync(path.resolve(process.cwd(), 'content/blog'))
  .filter((arquivo) => arquivo.endsWith('.mdx'))
  .map((arquivo) => arquivo.replace(/\.mdx$/, ''))

test.describe('Blog (MDX, sem Payload)', () => {
  // Sem contagem fixa de propósito: era o `toHaveCount(6)` daqui que deixava
  // cinco posts sem nenhum link interno no índice passar por verde, e trocar
  // por 12 só adiaria o problema pro próximo post. O que o índice precisa
  // garantir é que todo post publicado é alcançável a partir dele — o destaque
  // conta tanto quanto a grade.
  test('/blog dá link interno para todos os posts publicados', async ({ page }) => {
    expect(SLUGS_PUBLICADOS.length).toBeGreaterThan(0)

    await page.goto('http://localhost:3000/blog')
    await expect(page.locator('.featured')).toBeVisible()

    const linkados = new Set(
      await page
        .locator('a[href^="/blog/"]')
        .evaluateAll((links) => links.map((link) => link.getAttribute('href'))),
    )
    const semLinkNoIndice = SLUGS_PUBLICADOS.filter((slug) => !linkados.has(`/blog/${slug}`))

    expect(semLinkNoIndice).toEqual([])
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
    // `.first()`: a política passou a citar o canal de privacidade em mais de
    // uma seção (direitos do titular e imagem em eventos) e o modo estrito do
    // Playwright derruba o locator com dois resultados. O que o teste prova é
    // que o MDX renderiza com canal de contato — não quantos links existem.
    await expect(page.locator('.legal-body a[href^="mailto:"]').first()).toBeVisible()
  })

  test('/termos renderiza o texto legal em MDX', async ({ page }) => {
    await page.goto('http://localhost:3000/termos')
    await expect(page.locator('h1')).toHaveText('Termos de Uso')
    await expect(page.locator('.legal-body')).toContainText(
      'Estes Termos de Uso regulam a utilização do site',
    )
  })
})
