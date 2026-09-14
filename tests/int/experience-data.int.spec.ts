import { describe, expect, it } from 'vitest'
import { site } from '@/../content/site'
import { EXPERIENCE_EVENT } from '@/data/experienceEvent'
import { EXPERIENCE_SPONSORS } from '@/data/experienceSponsors'

describe('EXPERIENCE_EVENT', () => {
  it('acontece em 26/09/2026, um sábado', () => {
    expect(EXPERIENCE_EVENT.date).toBe('2026-09-26')
    // Meio-dia UTC + getUTCDay: sem isso o teste depende do fuso da máquina
    // que roda a suíte e vira sexta-feira em fusos bem a oeste.
    expect(new Date(`${EXPERIENCE_EVENT.date}T12:00:00Z`).getUTCDay()).toBe(6)
  })

  it('oferece 200 vagas', () => {
    expect(EXPERIENCE_EVENT.seats).toBe(200)
  })

  it('tem a programação em ordem cronológica', () => {
    const horas = EXPERIENCE_EVENT.schedule.map((s) => s.time)
    expect(horas).toEqual([...horas].sort())
  })

  it('tem três pilares', () => {
    expect(EXPERIENCE_EVENT.pillars).toHaveLength(3)
  })

  /**
   * A grade toda cabe entre `startTime` e `endTime`. É o teste que pega o erro
   * real: mexer numa aula e esquecer o `timeLabel` deixa o hero, o rodapé, a
   * `<meta description>` e o JSON-LD anunciando um horário que não existe.
   */
  it('a programação começa e termina dentro do horário anunciado', () => {
    const emMinutos = (hhmm: string) => {
      const [h, m] = hhmm.split(':').map(Number)
      return (h as number) * 60 + (m as number)
    }
    const inicio = emMinutos(EXPERIENCE_EVENT.startTime)
    const fim = emMinutos(EXPERIENCE_EVENT.endTime)

    expect(emMinutos(EXPERIENCE_EVENT.schedule[0]?.time as string)).toBe(inicio)
    for (const bloco of EXPERIENCE_EVENT.schedule) {
      expect(emMinutos(bloco.time)).toBeGreaterThanOrEqual(inicio)
      expect(emMinutos(bloco.endTime ?? bloco.time)).toBeLessThanOrEqual(fim)
    }
  })

  it('anuncia as três aulas, nesta ordem, com quem conduz cada uma', () => {
    expect(EXPERIENCE_EVENT.schedule.map((s) => [s.time, s.label, s.professional?.name])).toEqual([
      ['07:30', 'Pilates', 'Paloma Menezes'],
      ['08:20', 'Yoga', 'Assis'],
      ['09:10', 'Treino funcional', 'Igor Barros'],
    ])
  })

  /**
   * O cliente falou em "100 águas de coco" e o evento tem 200 vagas: anunciar
   * o número prometeria menos coco do que gente inscrita. A faixa contínua
   * pode citar a água de coco, nunca a quantidade.
   */
  it('não promete uma quantidade de água de coco menor que o número de vagas', () => {
    const faixa = EXPERIENCE_EVENT.ongoing.map((o) => `${o.title} ${o.text}`).join(' ')
    expect(faixa).toMatch(/água de coco/i)
    expect(faixa).not.toMatch(/\d+\s*(águas?|unidades?|cocos?)/i)
  })

  /**
   * O kit não é entregue no dia: a página manda a pessoa até a filial, então o
   * endereço precisa existir na fonte que `ExperienceKit` consulta. Sem esta
   * garantia, o `find` devolveria `undefined` e a seção mostraria "filial da
   * Semog em João Pessoa" sem dizer onde.
   */
  it('a filial que entrega o kit tem endereço em content/site.ts', () => {
    const unidade = site.company.addresses.find((e) => e.city === EXPERIENCE_EVENT.city)
    expect(unidade?.address).toMatch(/Guarabira/)
  })
})

describe('EXPERIENCE_SPONSORS', () => {
  it('começa com a Superlógica', () => {
    expect(EXPERIENCE_SPONSORS[0]?.name).toBe('Superlógica')
  })

  it('todo patrocinador tem nome e logo', () => {
    for (const s of EXPERIENCE_SPONSORS) {
      expect(s.name.length).toBeGreaterThan(0)
      expect(s.logo).toMatch(/^\/sponsors\/.+\.svg$/)
    }
  })
})
