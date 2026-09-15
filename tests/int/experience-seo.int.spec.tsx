import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ExperienceHero } from '@/components/experience/ExperienceHero'
import { EXPERIENCE_EVENT as E } from '@/data/experienceEvent'
import { experienceDescription, experienceEventJsonLd } from '@/lib/experienceSeo'

/**
 * O local do evento é a informação que manda a pessoa para um lugar físico num
 * sábado de manhã — e até 14/09/2026 ele só estava travado em
 * `tests/e2e/experience.e2e.spec.ts`, que `.github/workflows/ci.yml` NÃO roda
 * (o workflow tem biome, tsc, check:server-actions, vitest e build; passo de
 * Playwright, nenhum). Na prática, reverter `venue` para "Praia do Cabo
 * Branco" saía verde na CI.
 *
 * Cada asserção aqui é dupla de propósito:
 * - contra o LITERAL, para o valor confirmado não voltar sozinho ao rascunho;
 * - contra `EXPERIENCE_EVENT`, para o JSON-LD e o texto da dobra não poderem
 *   divergir do dado sem ninguém ver.
 * Uma só das duas não cobre: a primeira deixa a página digitar o local à mão,
 * a segunda passa para qualquer valor.
 */
const LOCAL = 'Centro de Atendimento ao Turista Adaptado'
const LOGRADOURO = 'Avenida Cabo Branco'
const REFERENCIA = "em frente à Sapore D'Italia"
const HORARIO = '07h30 às 10h'

describe('JSON-LD do Semog Experience', () => {
  it('descreve um Event com data, horário e o local confirmado', () => {
    expect(experienceEventJsonLd['@type']).toBe('Event')
    expect(experienceEventJsonLd.startDate).toBe('2026-09-26T07:30:00-03:00')
    expect(experienceEventJsonLd.endDate).toBe('2026-09-26T10:00:00-03:00')
    expect(experienceEventJsonLd.offers.price).toBe('0')
  })

  it('aponta o rich result para o local confirmado, vindo do dado', () => {
    const local = experienceEventJsonLd.location
    expect(local.name).toBe(LOCAL)
    expect(local.name).toBe(E.venue)

    // O ponto de referência é o que coloca a pessoa no lugar certo na orla —
    // some daqui e o rich result vira só um nome de prédio público.
    expect(local.description).toContain(REFERENCIA)
    expect(local.description).toContain(E.venueReference)
    expect(local.description).toContain(E.district)

    // Sem logradouro o Google localiza o evento na cidade inteira, não na
    // orla — e a landing existe justamente para levar alguém a um ponto da
    // Avenida Cabo Branco num sábado de manhã.
    expect(local.address.streetAddress).toBe(LOGRADOURO)
    expect(local.address.streetAddress).toBe(E.street)

    expect(local.address.addressLocality).toBe(E.city)
    expect(local.address.addressRegion).toBe(E.uf)
  })
})

describe('descrição da busca', () => {
  it('anuncia o mesmo local e o mesmo horário da página', () => {
    expect(experienceDescription).toContain(LOCAL)
    expect(experienceDescription).toContain(E.venue)
    expect(experienceDescription).toContain(HORARIO)
    expect(experienceDescription).toContain(E.timeLabel)
  })

  it('cabe no que a SERP mostra', () => {
    // O fecho "e kit praia" saiu justamente por isto: com ele o texto ia a 168
    // caracteres e o Google cortava o fim. Ver o comentário em `experienceSeo`.
    expect(experienceDescription.length).toBeLessThanOrEqual(160)
  })
})

describe('ExperienceHero', () => {
  it('anuncia o local confirmado antes da dobra', () => {
    const { container } = render(<ExperienceHero />)
    const texto = container.textContent ?? ''
    expect(texto).toContain(LOCAL)
    expect(texto).toContain(E.venue)
    expect(texto).toContain(HORARIO)
    expect(texto).toContain(E.timeLabel)
    // A ressalva da prefeitura saiu com a confirmação do local.
    expect(texto).not.toMatch(/a confirmar|prefeitura/i)
  })
})
