import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/app/(frontend)/_actions/submit-form', () => ({
  submitForm: vi.fn(async () => ({ ok: true })),
}))

// O widget real da Cloudflare injeta um <script> externo e um iframe — nada
// disso existe no jsdom. O dublê expõe o único contrato que o formulário usa:
// um `onToken` que ele chama quando o desafio passa.
vi.mock('@/components/forms/Turnstile', () => ({
  Turnstile: ({ onToken }: { onToken: (token: string) => void }) => (
    <button onClick={() => onToken('token-de-teste')} type="button">
      turnstile
    </button>
  ),
}))

import { submitForm } from '@/app/(frontend)/_actions/submit-form'
import { ExperienceForm } from '@/components/forms/ExperienceForm'
import { EXPERIENCE_EVENT as E } from '@/data/experienceEvent'

const botaoEnviar = () => screen.getByRole('button', { name: /garantir minha vaga/i })
const aceiteImagem = () =>
  screen.getByRole('checkbox', { name: /uso da minha imagem/i }) as HTMLInputElement

/** Preenche o mínimo válido e resolve o Turnstile, sem submeter. */
function preencher() {
  fireEvent.change(screen.getByLabelText(/nome completo/i), {
    target: { value: 'Maria Souza' },
  })
  fireEvent.change(screen.getByLabelText(/e-mail/i), {
    target: { value: 'maria@exemplo.com.br' },
  })
  fireEvent.change(screen.getByLabelText(/whatsapp/i), { target: { value: '83999501388' } })
  fireEvent.click(aceiteImagem())
  fireEvent.click(screen.getByRole('button', { name: /turnstile/i }))
}

describe('ExperienceForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exige nome, e-mail, WhatsApp e o aceite de imagem', async () => {
    render(<ExperienceForm />)
    fireEvent.click(botaoEnviar())

    expect(await screen.findByText(/informe seu nome completo/i)).toBeDefined()
    expect(await screen.findByText(/e-mail válido/i)).toBeDefined()
    expect(await screen.findByText(/informe seu whatsapp/i)).toBeDefined()
    expect(await screen.findByText(/autorizar o uso de imagem/i)).toBeDefined()
    expect(vi.mocked(submitForm)).not.toHaveBeenCalled()
  })

  it('não deixa o aceite de imagem pré-marcado', () => {
    render(<ExperienceForm />)
    expect(aceiteImagem().checked).toBe(false)
  })

  it('envia como inscrição do Experience, com o WhatsApp em E.164', async () => {
    render(<ExperienceForm />)
    preencher()
    fireEvent.click(botaoEnviar())

    await screen.findByRole('status')

    expect(vi.mocked(submitForm)).toHaveBeenCalledWith(
      'experience',
      expect.objectContaining({
        nome: 'Maria Souza',
        email: 'maria@exemplo.com.br',
        telefone: '+5583999501388',
        aceiteImagem: true,
      }),
      'token-de-teste',
    )
  })

  it('confirma repetindo data, horário e local, sem prometer e-mail', async () => {
    render(<ExperienceForm />)
    preencher()
    fireEvent.click(botaoEnviar())

    const confirmacao = await screen.findByRole('status')
    expect(confirmacao.textContent).toContain(E.dateLabel)
    expect(confirmacao.textContent).toContain(E.timeLabel)
    expect(confirmacao.textContent).toContain(E.venue)
    // Nenhum e-mail de confirmação do evento existe hoje (o auto-reply que sai
    // é o genérico do site) — prometer um seria mentir para quem se inscreveu.
    expect(confirmacao.textContent).not.toMatch(/e-mail/i)
  })
})
