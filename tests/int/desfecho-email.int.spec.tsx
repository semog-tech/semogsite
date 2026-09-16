import { render } from '@react-email/render'
import { describe, expect, it } from 'vitest'
import ContactNotification from '@/emails/ContactNotification'
import { type BotaoDeDesfecho, DESFECHO_ROTULOS, DESFECHOS } from '@/lib/desfecho'

/**
 * Os quatro botões de desfecho no e-mail de notificação interna.
 *
 * Até 16/09/2026 este e-mail não tinha **nenhum link** — estes são os
 * primeiros. O que o teste defende é o par que faz a funcionalidade existir:
 * que os quatro saem no HTML com o `href` que recebemos, e que sem os botões
 * (sem `LEAD_OUTCOME_SECRET` em produção) o e-mail volta a sair exatamente como
 * antes, em vez de mostrar botão quebrado.
 *
 * Renderiza pelo MESMO `render` que `src/lib/sendgrid.ts` usa no envio — um
 * atalho de teste provaria outra coisa.
 */

const FIELDS = [
  { label: 'Seu nome', value: 'Maria Souza' },
  { label: 'Cidade do condomínio', value: 'Recife e região' },
]

/** Os quatro botões como `botoesDeDesfecho` os entrega. */
const BOTOES: BotaoDeDesfecho[] = DESFECHOS.map((status) => ({
  status,
  rotulo: DESFECHO_ROTULOS[status],
  url: `https://www.semog.com.br/desfecho/42?t=token-de-teste&s=${status}`,
}))

async function documento(desfecho?: BotaoDeDesfecho[]): Promise<Document> {
  const html = await render(
    <ContactNotification formTitle="Proposta" fields={FIELDS} desfecho={desfecho} />,
  )
  return new DOMParser().parseFromString(html, 'text/html')
}

/** Os `href` dos links do corpo, na ordem em que aparecem. */
function links(doc: Document): string[] {
  return Array.from(doc.querySelectorAll('a')).map((a) => a.getAttribute('href') ?? '')
}

describe('ContactNotification — botões de desfecho', () => {
  it('renderiza os quatro botões, na ordem, com o href recebido', async () => {
    const doc = await documento(BOTOES)

    expect(links(doc)).toEqual(BOTOES.map((b) => b.url))
  })

  it('cada botão mostra o rótulo em pt-BR do seu status', async () => {
    const doc = await documento(BOTOES)
    const textos = Array.from(doc.querySelectorAll('a')).map((a) => a.textContent?.trim())

    expect(textos).toEqual(['Em negociação', 'Fechou', 'Não evoluiu', 'Não é lead'])
  })

  it('avisa que o clique não registra nada sozinho', async () => {
    // A frase não é enfeite: é o que evita alguém achar que já respondeu ao
    // clicar, e o que explica por que a página pede confirmação.
    const doc = await documento(BOTOES)

    expect(doc.body.textContent).toMatch(/nada é registrado só por clicar/i)
  })

  it('sem botões, o e-mail sai sem nenhum link — como saía antes', async () => {
    const doc = await documento(undefined)

    expect(links(doc)).toEqual([])
    expect(doc.body.textContent).not.toMatch(/Em negociação/)
  })

  it('lista vazia também não renderiza a seção', async () => {
    const doc = await documento([])

    expect(links(doc)).toEqual([])
  })

  it('os campos do lead continuam no e-mail com os botões presentes', async () => {
    const doc = await documento(BOTOES)

    expect(doc.body.textContent).toContain('Maria Souza')
    expect(doc.body.textContent).toContain('Recife e região')
  })
})
