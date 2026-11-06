import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * O /contato disparava `generate_lead` no assunto "Proposta comercial". O assunto saiu do
 * formulário em 17/10/2026 (Leandro): quem quer proposta é levado ao formulário de Proposta, que
 * mede o lead por conta própria. Aqui se defende que o assunto sumiu, que o caminho para a
 * Proposta está na tela e que o Contato não dispara `generate_lead` em caso nenhum (atendimento
 * a cliente inflaria a contagem e o custo por lead).
 */

vi.mock('@/app/(frontend)/_actions/submit-form', () => ({
  submitForm: vi.fn(async () => ({ ok: true })),
}))

// Mesmo dublê dos demais testes de formulário: o contrato usado é só o `onToken`.
vi.mock('@/components/forms/Turnstile', () => ({
  Turnstile: ({ onToken }: { onToken: (token: string) => void }) => (
    <button onClick={() => onToken('token-de-teste')} type="button">
      turnstile
    </button>
  ),
}))

import { submitForm } from '@/app/(frontend)/_actions/submit-form'
import { ContactForm } from '@/components/forms/ContactForm'

// O jsdom não tem ResizeObserver; `useEnvioVisivelNoErro` o usa quando o envio dá erro.
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    disconnect() {}
  },
)

const gtag = vi.fn()

function preencher(assunto: string) {
  fireEvent.change(screen.getByLabelText(/^nome/i), { target: { value: 'Maria Souza' } })
  fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'maria@exemplo.com.br' } })
  fireEvent.change(screen.getByLabelText(/assunto/i), { target: { value: assunto } })
  fireEvent.change(screen.getByLabelText(/mensagem/i), { target: { value: 'Quero conversar.' } })
  fireEvent.click(screen.getByRole('button', { name: /turnstile/i }))
}

function enviar() {
  const botao = screen.getByRole('button', { name: /enviar/i }) as HTMLButtonElement
  fireEvent.click(botao)
}

const eventosGenerateLead = () => gtag.mock.calls.filter(([, nome]) => nome === 'generate_lead')

describe('ContactForm — generate_lead', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.gtag = gtag
  })
  afterEach(() => {
    window.gtag = undefined
  })

  it('"Proposta comercial" não é mais assunto; a tela aponta o formulário de Proposta', () => {
    render(<ContactForm />)
    // `as`: o rótulo "Assunto" pertence ao <select> renderizado pelo `Field as="select"`.
    const assunto = screen.getByLabelText(/assunto/i) as HTMLSelectElement
    const valores = Array.from(assunto.options).map((o) => o.value)
    const rotulos = Array.from(assunto.options).map((o) => o.textContent)

    expect(valores).not.toContain('proposta-comercial')
    expect(rotulos).not.toContain('Proposta comercial')
    expect(valores).toContain('outro')
    const link = screen.getByRole('link', { name: /formulário de proposta/i })
    expect(link.getAttribute('href')).toBe('/proposta')
  })

  it('não dispara em atendimento a cliente', async () => {
    render(<ContactForm />)
    preencher('segunda-via-boleto')
    enviar()
    await screen.findByRole('status')

    expect(vi.mocked(submitForm)).toHaveBeenCalled()
    expect(eventosGenerateLead()).toHaveLength(0)
  })

  it('não dispara quando o envio falha (resposta de erro)', async () => {
    vi.mocked(submitForm).mockResolvedValueOnce({ ok: false, message: 'Falhou.' })
    render(<ContactForm />)
    preencher('outro')
    enviar()
    await screen.findByRole('alert')

    expect(eventosGenerateLead()).toHaveLength(0)
  })

  it('não dispara quando a Server Action lança', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(submitForm).mockRejectedValueOnce(new Error('rede'))
    render(<ContactForm />)
    preencher('outro')
    enviar()
    await screen.findByRole('alert')

    expect(eventosGenerateLead()).toHaveLength(0)
  })
})
