import { expect, test } from '@playwright/test'

/**
 * A landing do Experience vive num route group irmão (`(evento)`) com root
 * layout próprio. O que estes testes protegem é justamente o isolamento: a
 * página não pode ter saída que não seja a inscrição (sem header, sem rodapé
 * de navegação, sem WhatsApp flutuante) e, do outro lado, o layout novo não
 * pode vazar para o resto do site.
 *
 * Os seletores são os reais do site — `header.nav` (`Nav.tsx`),
 * `footer.footer` (`FooterView.tsx`) e `.wa-float` (`WhatsAppFloat.tsx`) —,
 * não os `site-header`/`site-footer` genéricos: o plano manda conferir antes
 * de rodar, e esses nomes não existem no projeto.
 *
 * URLs absolutas porque `baseURL` está comentado em `playwright.config.ts`;
 * é a convenção dos outros specs em `tests/e2e/`.
 */
const URL_EXPERIENCE = 'http://localhost:3000/experience'

test.describe('Landing do Experience', () => {
  test('abre sem a navegação do site', async ({ page }) => {
    await page.goto(URL_EXPERIENCE)
    await expect(page.locator('header.nav')).toHaveCount(0)
    await expect(page.locator('footer.footer')).toHaveCount(0)
    await expect(page.locator('.wa-float')).toHaveCount(0)
  })

  /**
   * Escopado no hero de propósito. Data, local e vagas se repetem pela página
   * (rodapé, legenda da foto do local, seção de inscrição) e sem o escopo o
   * modo estrito do Playwright derruba o teste por ambiguidade — o que ele
   * precisa provar é que a informação aparece ANTES da dobra, sem rolagem.
   */
  test('anuncia data, local e vagas', async ({ page }) => {
    await page.goto(URL_EXPERIENCE)
    const hero = page.locator('.hero')
    await expect(hero.getByText('26 de setembro de 2026')).toBeVisible()
    await expect(hero.getByText('Praia do Cabo Branco')).toBeVisible()
    await expect(hero.getByText(/200 vagas/i)).toBeVisible()
  })

  test('a home continua com header e rodapé', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    await expect(page.locator('header.nav')).toHaveCount(1)
    await expect(page.locator('footer.footer')).toHaveCount(1)
  })
})
