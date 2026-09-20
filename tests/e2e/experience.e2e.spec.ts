import { expect, test } from '@playwright/test'
import { EXPERIENCE_EVENT as E } from '../../src/data/experienceEvent'
import { eventoJaAconteceu } from '../../src/lib/experienceEstado'

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

/**
 * O estado da landing depende da data — passado o dia do evento ela vira
 * registro, sem CTA, sem oferta no JSON-LD e sem promessa de vaga na dobra.
 *
 * Isto NÃO é o teste se adaptando ao que encontrou: o valor sai da mesma
 * função que a página usa para decidir (`eventoJaAconteceu`, com o fuso do
 * evento), a partir da data em `EXPERIENCE_EVENT`. É determinístico — só muda
 * de ramo quando a realidade muda —, e cada ramo afirma o que aquele estado
 * obriga, inclusive o que ele proíbe.
 *
 * Sem isto, três asserções passariam a falhar em 27/09/2026 sem ninguém ver:
 * a CI não roda Playwright.
 */
const EVENTO_PASSOU = eventoJaAconteceu(new Date())

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
    await expect(hero.getByText(E.dateLabel)).toBeVisible()
    await expect(hero.getByText(E.venue)).toBeVisible()

    // O número vem do banco; indisponibilidade informa a ausência sem inventar capacidade.
    if (EVENTO_PASSOU) {
      // Encerrado: a dobra vira registro. Prometer vaga aqui seria falso.
      await expect(hero.getByText(/\d+ vagas/i)).toHaveCount(0)
      await expect(hero.getByText(/já aconteceu/i)).toBeVisible()
    } else {
      // Aberto ("Gratuito · N vagas") ou esgotado ("As N vagas foram preenchidas").
      await expect(hero.locator('.seats')).toHaveText(/\d+ vagas|Vagas limitadas/i)
      if ((await hero.locator('.seats').textContent())?.includes('Vagas limitadas')) {
        await expect(page.getByRole('status')).toContainText('Não foi possível consultar as vagas')
      }
    }
  })

  test('a home continua com header e rodapé', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    await expect(page.locator('header.nav')).toHaveCount(1)
    await expect(page.locator('footer.footer')).toHaveCount(1)
  })

  /**
   * O JSON-LD é o que faz o evento aparecer como rich result de evento na
   * busca (data, local e "gratuito" na própria SERP). `.first()` porque a
   * página só tem um bloco: o layout do `(evento)` não injeta nenhum outro.
   */
  test('publica JSON-LD de evento com data e local', async ({ page }) => {
    await page.goto(URL_EXPERIENCE)
    const raw = await page.locator('script[type="application/ld+json"]').first().textContent()
    const jsonLd = JSON.parse(raw ?? '{}')
    expect(jsonLd['@type']).toBe('Event')
    expect(jsonLd.startDate).toContain(E.date)
    expect(jsonLd.location.name).toBe(E.venue)
    expect(jsonLd.location.address.streetAddress).toBe(E.street)

    // Depois do evento não há oferta a publicar — `offers` some do JSON-LD
    // inteiro (ver `experienceSeo`), e ler `.price` ali daria TypeError.
    if (EVENTO_PASSOU || (await page.getByRole('status').count()) > 0) {
      expect(jsonLd.offers).toBeUndefined()
    } else {
      expect(jsonLd.offers.price).toBe('0')
    }
  })

  test('os CTAs levam ao formulário enquanto há inscrição', async ({ page }) => {
    await page.goto(URL_EXPERIENCE)
    const ctas = page.locator('a[href="#inscricao"]')

    if (EVENTO_PASSOU) {
      // Encerrada a edição, os CTAs saem de cena de propósito: não há destino.
      // A seção continua existindo, como registro do que foi.
      expect(await ctas.count()).toBe(0)
      await expect(page.locator('#inscricao')).toHaveCount(1)
      return
    }

    expect(await ctas.count()).toBeGreaterThanOrEqual(2)
    await ctas.first().click()
    await expect(page.locator('#inscricao')).toBeInViewport()
  })
})
