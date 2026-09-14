import { describe, expect, it } from 'vitest'
import { site } from '@/../content/site'
import { EXPERIENCE_EVENT } from '@/data/experienceEvent'
import { EXPERIENCE_SPONSORS } from '@/data/experienceSponsors'
import { QUANTIDADE_ANUNCIADA } from './helpers/quantidade'

/** '07:30' -> 450. Usado dos dois lados da comparação de horário. */
const emMinutos = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return (h as number) * 60 + (m as number)
}

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
   * Primeiro elo: a grade cabe entre `startTime` e `endTime`, e a primeira
   * aula É o `startTime` (o fim é envelope — a avaliação física e a mesa de
   * café seguem até as 10h, depois da última aula acabar às 09h55).
   */
  it('a programação começa e termina dentro do horário anunciado', () => {
    const inicio = emMinutos(EXPERIENCE_EVENT.startTime)
    const fim = emMinutos(EXPERIENCE_EVENT.endTime)

    expect(emMinutos(EXPERIENCE_EVENT.schedule[0]?.time as string)).toBe(inicio)
    for (const bloco of EXPERIENCE_EVENT.schedule) {
      expect(emMinutos(bloco.time)).toBeGreaterThanOrEqual(inicio)
      expect(emMinutos(bloco.endTime ?? bloco.time)).toBeLessThanOrEqual(fim)
    }
  })

  /**
   * Segundo elo, e o que fecha a corrente: o rótulo anuncia a MESMA janela que
   * a grade cumpre. Este é o teste que pega o erro real — mexer numa aula e
   * esquecer o `timeLabel` deixa o hero, o rodapé, a `<meta description>`, o
   * OG/Twitter e o JSON-LD anunciando um horário que não existe.
   *
   * Sem ele (até 14/09/2026) dava para reverter o rótulo para "07h às 12h" com
   * a suíte inteira verde: `timeLabel` era uma string solta, e a única vez que
   * um teste a citava era comparando o render contra ela mesma.
   *
   * A comparação é em MINUTOS, não em texto: o rótulo é escrito em pt-BR
   * ("07h30 às 10h", com a hora cheia sem os dois zeros) e travar a string
   * inteira reprovaria por formatação, não por horário errado.
   */
  it('o rótulo de horário anuncia a mesma janela que a grade cumpre', () => {
    /** '07h30' -> 450; '10h' -> 600. `NaN` no que não for hora, para o teste cair. */
    const doRotulo = (parte: string) => {
      const casa = parte.trim().match(/^(\d{1,2})h(\d{2})?$/)
      if (!casa) return Number.NaN
      return Number(casa[1]) * 60 + Number(casa[2] ?? 0)
    }

    const [inicioRotulo, fimRotulo] = EXPERIENCE_EVENT.timeLabel.split(/\s+às\s+/)
    expect(doRotulo(inicioRotulo ?? '')).toBe(emMinutos(EXPERIENCE_EVENT.startTime))
    expect(doRotulo(fimRotulo ?? '')).toBe(emMinutos(EXPERIENCE_EVENT.endTime))

    // A mesma janela aparece por extenso na faixa contínua ("Das 07h30 às 10h,
    // sem hora marcada"). É uma segunda cópia do horário no próprio dado, e a
    // que mais fácil envelhece sozinha.
    const comJanela = EXPERIENCE_EVENT.ongoing.filter((o) => /\d{1,2}h/.test(o.text))
    expect(comJanela.length).toBeGreaterThan(0)
    for (const item of comJanela) expect(item.text).toContain(EXPERIENCE_EVENT.timeLabel)
  })

  it('anuncia as três aulas, nesta ordem, com quem conduz cada uma', () => {
    expect(EXPERIENCE_EVENT.schedule.map((s) => [s.time, s.label, s.professional?.name])).toEqual([
      ['07:30', 'Pilates', 'Paloma Menezes'],
      ['08:20', 'Yoga', 'Assis'],
      ['09:10', 'Treino funcional', 'Igor Barros'],
    ])
  })

  /**
   * A água de coco é item da oferta e nunca vem com quantidade — decisão do
   * cliente em 14/09/2026. O teste existe porque o número tende a voltar: ele
   * é o dado que a organização repassa ("compramos 100"), e no texto da faixa
   * ele deixa de ser logística e vira promessa cobrável no dia.
   */
  it('cita a água de coco sem nunca anunciar quantidade', () => {
    const comCoco = EXPERIENCE_EVENT.ongoing
      .map((o) => `${o.title} ${o.text}`)
      .filter((texto) => /coco/i.test(texto))

    expect(comCoco.length).toBeGreaterThan(0)
    // A régua é `QUANTIDADE_ANUNCIADA`, a mesma que `experience-sections` usa
    // no render — o comentário dela diz o que pega e o que não pega, e é lá
    // que se mexe. Dígito sozinho não bastava: "cem águas de coco" é a forma
    // que copy escreve e atravessava a trava inteira.
    //
    // O filtro por `/coco/` acima não é detalhe: os horários da manhã vivem em
    // OUTROS itens da faixa ("Das 07h30 às 10h", na avaliação física) e a
    // regra não pode alcançá-los.
    for (const texto of comCoco) expect(texto).not.toMatch(QUANTIDADE_ANUNCIADA)
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
