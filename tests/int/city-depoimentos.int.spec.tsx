import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

/**
 * Os depoimentos das landings de cidade eram fictícios (nome, cargo e prédio
 * inventados no protótipo) e foram trocados em 06/10/2026 por trechos de
 * avaliações reais do Google. Estes testes travam as regras que impedem a
 * volta do inventado: o `role` é só a origem e o mês, nunca um cargo; praça
 * sem avaliação não mostra a seção; e nada disso vira `Review` no JSON-LD.
 */

vi.mock('@/app/(frontend)/_actions/submit-form', () => ({
  submitForm: vi.fn(async () => ({ ok: true })),
}))

// O widget real injeta script e iframe, que não existem no jsdom.
vi.mock('@/components/forms/Turnstile', () => ({
  Turnstile: () => null,
}))

import { CityLanding } from '@/components/city/CityLanding'
import { CITY_LANDINGS } from '@/data/cityLandings'
import { cityLandingJsonLd } from '@/lib/seo'

const TITULO_DEPOIMENTOS = 'A voz de quem vive nossos resultados.'
const ROLE_GOOGLE =
  /^Avaliação no Google · (jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\/20\d\d$/

describe('depoimentos das landings de cidade', () => {
  for (const data of Object.values(CITY_LANDINGS)) {
    it(`${data.city}: até 3, com origem e mês no lugar do cargo`, () => {
      expect(data.testimonials.length).toBeLessThanOrEqual(3)
      for (const t of data.testimonials) {
        expect(t.role).toMatch(ROLE_GOOGLE)
        // Primeiro nome + inicial do sobrenome (ou sufixo já abreviado).
        expect(t.name).toMatch(/^[\p{Lu}][\p{L}]+( [\p{Lu}][\p{L}]+)* [\p{Lu}][\p{Ll}]?\.$/u)
      }
    })
  }

  it('Campina Grande não tem avaliação no Google, então não tem depoimento', () => {
    expect(CITY_LANDINGS['campina-grande'].testimonials).toEqual([])
  })

  it('sem depoimento, a seção some inteira — título incluído', () => {
    render(<CityLanding data={CITY_LANDINGS['campina-grande']} />)
    expect(screen.queryByText(TITULO_DEPOIMENTOS)).toBeNull()
    expect(screen.queryByText(/Quem já é Semog em/)).toBeNull()
  })

  it('com depoimento, a seção aparece com os trechos', () => {
    const recife = CITY_LANDINGS.recife
    render(<CityLanding data={recife} />)
    expect(screen.getByText(TITULO_DEPOIMENTOS)).toBeTruthy()
    for (const t of recife.testimonials) expect(screen.getByText(t.quote)).toBeTruthy()
  })

  it('o JSON-LD não publica avaliação própria como dado estruturado', () => {
    for (const data of Object.values(CITY_LANDINGS)) {
      const json = JSON.stringify(cityLandingJsonLd(data.slug, data.faq))
      expect(json).not.toMatch(/"Review"|aggregateRating|reviewRating/)
    }
  })
})
