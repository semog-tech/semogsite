import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * O GA4 subcontava lead porque o /contato nunca disparava `generate_lead`, mesmo
 * com o lead de "proposta comercial" indo ao Google Ads e ao Exact pelo servidor.
 * Aqui se defende os dois lados: dispara só em proposta comercial com sucesso, e
 * nunca em atendimento a cliente nem em falha (que inflariam o custo por lead).
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

  it('dispara uma vez, com o formato padrão, em proposta comercial com sucesso', async () => {
    render(<ContactForm />)
    preencher('proposta-comercial')
    enviar()
    await screen.findByRole('status')

    expect(eventosGenerateLead()).toEqual([
      ['event', 'generate_lead', { form: 'contato', currency: 'BRL', value: 1 }],
    ])
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
    preencher('proposta-comercial')
    enviar()
    await screen.findByRole('alert')

    expect(eventosGenerateLead()).toHaveLength(0)
  })

  it('não dispara quando a Server Action lança', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(submitForm).mockRejectedValueOnce(new Error('rede'))
    render(<ContactForm />)
    preencher('proposta-comercial')
    enviar()
    await screen.findByRole('alert')

    expect(eventosGenerateLead()).toHaveLength(0)
  })
})
