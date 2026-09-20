import { describe, expect, it } from 'vitest'
import { EXPERIENCE_EVENT as E } from '@/data/experienceEvent'
import { estadoDaInscricao, eventoJaAconteceu } from '@/lib/experienceEstado'

/**
 * A regra dos três estados da landing do Experience.
 *
 * Mora em módulo puro justamente para caber aqui sem mock de `pg` nem de
 * `server-only`: o que decide se a página fecha sozinha é aritmética de data e
 * de contagem, e isso tem que ser exercitável direto.
 */

/** Instante UTC a partir de um horário de Recife (UTC-3 o ano inteiro). */
function emRecife(iso: string): Date {
  return new Date(`${iso}-03:00`)
}

describe('eventoJaAconteceu', () => {
  it('é falso no dia do evento, inclusive depois da hora de encerrar', () => {
    expect(eventoJaAconteceu(emRecife(`${E.date}T06:00:00`))).toBe(false)
    expect(eventoJaAconteceu(emRecife(`${E.date}T10:30:00`))).toBe(false)
    // Deliberado: quem abre a página no sábado à tarde procurando o endereço
    // deve encontrar o evento, não um agradecimento. O dia inteiro é "ainda
    // vai acontecer", até o último segundo antes da meia-noite.
    expect(eventoJaAconteceu(emRecife(`${E.date}T23:59:59`))).toBe(false)
  })

  it('vira à meia-noite do dia seguinte, no fuso de Recife', () => {
    expect(eventoJaAconteceu(emRecife('2026-09-27T00:00:01'))).toBe(true)
  })

  /**
   * O bug que este teste existe para impedir. A Vercel roda em UTC e Recife é
   * UTC-3: às 21h do dia 26 na Paraíba já é dia 27 em UTC, com o evento
   * recém-terminado e gente ainda consultando o endereço. Decidir pelo relógio
   * do servidor mostraria "a edição já aconteceu" três horas cedo — e três
   * horas cedo, num sábado, é durante a confraternização.
   *
   * `2026-09-27T00:30:00Z` = 26/09 às 21h30 em Recife.
   */
  it('não encerra três horas cedo por causa do fuso do servidor', () => {
    const meiaNoiteEmUtcAindaDia26EmRecife = new Date('2026-09-27T00:30:00Z')
    expect(meiaNoiteEmUtcAindaDia26EmRecife.toISOString()).toContain('2026-09-27')
    expect(eventoJaAconteceu(meiaNoiteEmUtcAindaDia26EmRecife)).toBe(false)
  })

  it('e o espelho: às 00h30 do dia 27 em Recife o evento já passou', () => {
    // 03h30 UTC = 00h30 em Recife. O servidor e o evento concordam aqui.
    expect(eventoJaAconteceu(new Date('2026-09-27T03:30:00Z'))).toBe(true)
  })
})

describe('estadoDaInscricao', () => {
  const antes = emRecife(`${E.date}T08:00:00`)
  const depois = emRecife('2026-09-27T09:00:00')

  it('fica aberto enquanto sobrar vaga', () => {
    expect(estadoDaInscricao(antes, 0, 73)).toBe('aberto')
    expect(estadoDaInscricao(antes, 73 - 1, 73)).toBe('aberto')
  })

  it('esgota exatamente na vaga de número seats, não uma depois', () => {
    expect(estadoDaInscricao(antes, 73, 73)).toBe('esgotado')
    // Overbooking (a trava do INSERT tem uma janela de milissegundos) não pode
    // reabrir a inscrição por passar do limite.
    expect(estadoDaInscricao(antes, 73 + 3, 73)).toBe('esgotado')
  })

  it('encerrado tem precedência sobre tudo', () => {
    expect(estadoDaInscricao(depois, 0, 73)).toBe('encerrado')
    expect(estadoDaInscricao(depois, 73, 73)).toBe('encerrado')
    expect(estadoDaInscricao(depois, null, 73)).toBe('encerrado')
  })

  /**
   * A regra que evita perder inscrição real: contagem indisponível (banco fora
   * do ar, `DATABASE_URI` ausente no build da CI) **abre**, não fecha.
   *
   * Fechar seria o instinto — "na dúvida, não deixa entrar" — e é o errado
   * aqui: o excesso já está barrado no INSERT, então uma página aberta a mais
   * recusa na hora do envio, enquanto uma página fechada a menos não recusa
   * nada, só manda gente embora.
   */
  it('cai para aberto quando não dá para contar, em vez de fechar', () => {
    expect(estadoDaInscricao(antes, null, 73)).toBe('aberto')
  })
})
