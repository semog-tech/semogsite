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
const VAGAS = 150

describe('JSON-LD do Semog Experience', () => {
  it('descreve um Event com data, horário e o local confirmado', () => {
    const jsonLd = experienceEventJsonLd('aberto')
    expect(jsonLd['@type']).toBe('Event')
    expect(jsonLd.startDate).toBe('2026-09-26T07:30:00-03:00')
    expect(jsonLd.endDate).toBe('2026-09-26T10:00:00-03:00')
    expect(jsonLd.offers?.price).toBe('0')
  })

  it('aponta o rich result para o local confirmado, vindo do dado', () => {
    const local = experienceEventJsonLd('aberto').location
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

  /**
   * O que a busca continua anunciando depois que a inscrição fecha.
   *
   * `EventStatusType` (schema.org) tem exatamente cinco membros e nenhum
   * significa "já realizado", então `eventStatus` é `EventScheduled` nos três
   * estados — quem diz que o evento ficou para trás é o `endDate`. Trocar por
   * `EventCancelled` para "desligar" o rich result afirmaria um cancelamento
   * que não houve, e é a troca que alguém faz de boa fé ao mexer nisto.
   */
  it('publica a disponibilidade que corresponde ao estado da inscrição', () => {
    expect(experienceEventJsonLd('aberto').offers?.availability).toBe('https://schema.org/InStock')
    expect(experienceEventJsonLd('esgotado').offers?.availability).toBe(
      'https://schema.org/SoldOut',
    )

    // Passado o evento não há oferta a publicar: `SoldOut` eterno descreveria
    // uma inscrição que não existe mais.
    expect(experienceEventJsonLd('encerrado').offers).toBeUndefined()
    expect(JSON.stringify(experienceEventJsonLd('encerrado'))).not.toContain('offers')

    for (const estado of ['aberto', 'esgotado', 'encerrado'] as const) {
      expect(experienceEventJsonLd(estado).eventStatus).toBe('https://schema.org/EventScheduled')
    }
  })
})

describe('descrição da busca', () => {
  it('anuncia o mesmo local e o mesmo horário da página', () => {
    const description = experienceDescription('aberto')
    expect(description).toContain(LOCAL)
    expect(description).toContain(E.venue)
    expect(description).toContain(HORARIO)
    expect(description).toContain(E.timeLabel)
  })

  /**
   * O número de vagas é o dado que mais viaja: sai daqui para a SERP, para o
   * card do WhatsApp e para o corpo da página. Ficou de fora da trava até
   * 17/09/2026 — e nesse dia o evento passou de 200 para 150 vagas, o que
   * significa que trocar `${E.seats}` por "200" digitado à mão teria saído
   * verde em biome, tsc, vitest e build.
   *
   * Dupla como as outras: contra o literal, para o 200 não voltar; contra o
   * dado, para a descrição não poder anunciar um número que a página não tem.
   */
  it('anuncia o número de vagas que o evento realmente tem', () => {
    expect(E.seats).toBe(VAGAS)
    expect(experienceDescription('aberto')).toContain(`${VAGAS} vagas`)
    expect(experienceDescription('aberto')).toContain(`${E.seats} vagas`)

    // Fechada a inscrição, a descrição fala das vagas no passado — e o número
    // continua sendo o mesmo dado, não um literal que envelhece à parte.
    expect(experienceDescription('esgotado')).toContain(`As ${E.seats} vagas`)
  })

  it('cabe no que a SERP mostra, nos três estados', () => {
    // O fecho "e kit praia" saiu justamente por isto: com ele o texto ia a 168
    // caracteres e o Google cortava o fim. Ver o comentário em `experienceSeo`.
    for (const estado of ['aberto', 'esgotado', 'encerrado'] as const) {
      expect(experienceDescription(estado).length).toBeLessThanOrEqual(160)
    }
  })
})

describe('ExperienceHero', () => {
  it('anuncia o local confirmado antes da dobra', () => {
    const { container } = render(<ExperienceHero estado="aberto" />)
    const texto = container.textContent ?? ''
    expect(texto).toContain(LOCAL)
    expect(texto).toContain(E.venue)
    expect(texto).toContain(HORARIO)
    expect(texto).toContain(E.timeLabel)
    // A ressalva da prefeitura saiu com a confirmação do local.
    expect(texto).not.toMatch(/a confirmar|prefeitura/i)
  })

  /**
   * O endereço é o que faz alguém sair de casa no sábado — e é justamente nos
   * estados fechados que a pessoa volta à página só para reconferi-lo. Uma
   * "limpeza" do hero que tirasse o bloco `.meta` junto com o CTA quebraria
   * exatamente quem já está inscrito.
   */
  it('mantém data, horário e local na dobra também com a inscrição fechada', () => {
    for (const estado of ['esgotado', 'encerrado'] as const) {
      const { container } = render(<ExperienceHero estado={estado} />)
      const texto = container.textContent ?? ''
      expect(texto).toContain(E.venue)
      expect(texto).toContain(E.timeLabel)
      expect(texto).toContain(E.dateLabel)
    }
  })
})
