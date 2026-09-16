import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * `cidade` virou obrigatória na Proposta em 16/09/2026. O servidor recusando
 * sozinho já tem cobertura em `submit-form.int.spec.ts`; o que se testa aqui é
 * o lado da TELA, e especificamente o risco desta mudança: um campo
 * obrigatório que o usuário não enxerga.
 *
 * Nas landings de unidade a cidade não é perguntada — ela vem pronta de quem
 * renderiza (`CityLanding` passa `data.cidadeNoFormulario`) e viaja num campo
 * oculto. Se esse valor faltasse, o formulário recusaria o envio apontando um
 * campo que não está na página, e ninguém descobriria até um lead sumir. Por
 * isso o componente mostra o select sempre que a cidade NÃO foi informada, e é
 * essa regra que estes testes defendem.
 */

vi.mock('@/app/(frontend)/_actions/submit-form', () => ({
  submitForm: vi.fn(async () => ({ ok: true })),
}))

// Mesmo dublê de `experience-form`: o widget real injeta script e iframe, que
// não existem no jsdom. O contrato usado pelo formulário é só o `onToken`.
vi.mock('@/components/forms/Turnstile', () => ({
  Turnstile: ({ onToken }: { onToken: (token: string) => void }) => (
    <button onClick={() => onToken('token-de-teste')} type="button">
      turnstile
    </button>
  ),
}))

import { submitForm } from '@/app/(frontend)/_actions/submit-form'
import { PropostaForm } from '@/components/forms/PropostaForm'

/**
 * O `<form>` a que um botão pertence. `getByRole` devolve `HTMLElement`, que
 * não declara `.form` — a propriedade só existe nos elementos de formulário.
 */
function formularioDoBotao(nome: RegExp): HTMLFormElement {
  const botao = screen.getByRole('button', { name: nome }) as HTMLButtonElement
  const form = botao.form
  if (!form) throw new Error(`botão ${nome} não está dentro de um <form>`)
  return form
}

/** O campo oculto de cidade, quando existe. */
function cidadeOculta(container: HTMLElement): HTMLInputElement | null {
  return container.querySelector('input[type="hidden"][name="cidade"]')
}

/** Preenche o mínimo do formulário compacto e resolve o Turnstile. */
function preencherCompacto() {
  fireEvent.change(screen.getByLabelText(/seu nome/i), { target: { value: 'Maria Souza' } })
  fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'maria@exemplo.com.br' } })
  fireEvent.change(screen.getByLabelText(/whatsapp/i), { target: { value: '83999501388' } })
  // Na variante compacta o rótulo é "Tipo de condomínio"; na completa, "O que
  // você representa?". É o mesmo campo `tipo`.
  fireEvent.change(screen.getByLabelText(/tipo de condomínio/i), {
    target: { value: 'Condomínio residencial' },
  })
  fireEvent.click(screen.getByRole('button', { name: /turnstile/i }))
}

describe('PropostaForm — cidade nas landings de unidade', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('com a cidade informada, o campo não é perguntado — vai oculto e preenchido', () => {
    const { container } = render(<PropostaForm compact cidade="Recife e região" />)

    expect(cidadeOculta(container)?.value).toBe('Recife e região')
    expect(screen.queryByLabelText(/cidade do condomínio/i)).toBeNull()
  })

  it('cada praça leva a SUA cidade, não a primeira da lista', () => {
    const { container } = render(<PropostaForm compact cidade="Belém e região" />)

    expect(cidadeOculta(container)?.value).toBe('Belém e região')
  })

  it('a cidade informada chega à Server Action no envio', async () => {
    render(<PropostaForm compact cidade="Campina Grande e região" />)
    preencherCompacto()
    fireEvent.submit(formularioDoBotao(/quero minha proposta/i))

    await waitFor(() => expect(submitForm).toHaveBeenCalled())
    const [, valores] = vi.mocked(submitForm).mock.calls[0]
    expect((valores as { cidade?: string }).cidade).toBe('Campina Grande e região')
  })

  it('SEM cidade informada o select aparece — campo obrigatório nunca fica invisível', () => {
    // É o caso de uma página nova que esqueça de passar a cidade. O formulário
    // degrada para perguntar, em vez de travar o envio apontando um campo que
    // não está na tela.
    const { container } = render(<PropostaForm compact />)

    expect(cidadeOculta(container)).toBeNull()
    expect(screen.getByLabelText(/cidade do condomínio/i)).toBeInstanceOf(HTMLSelectElement)
  })

  it('`withCityField` continua perguntando, mesmo com cidade informada', () => {
    const { container } = render(<PropostaForm compact withCityField cidade="Recife e região" />)

    expect(cidadeOculta(container)).toBeNull()
    expect(screen.getByLabelText(/cidade do condomínio/i)).toBeInstanceOf(HTMLSelectElement)
  })
})

describe('PropostaForm — cidade nas páginas sem contexto de cidade', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('o select é obrigatório e o placeholder não diz mais "(opcional)"', () => {
    render(<PropostaForm />)

    const select = screen.getByLabelText(/cidade do condomínio/i) as HTMLSelectElement
    expect(select.required).toBe(true)
    expect(select.querySelector('option')?.textContent).not.toMatch(/opcional/i)
  })

  it('as cinco opções estão na lista, "Outra cidade" inclusive', () => {
    render(<PropostaForm />)

    const select = screen.getByLabelText(/cidade do condomínio/i) as HTMLSelectElement
    const valores = Array.from(select.options)
      .map((o) => o.value)
      .filter(Boolean)
    expect(valores).toEqual([
      'Recife e região',
      'João Pessoa e região',
      'Campina Grande e região',
      'Belém e região',
      'Outra cidade',
    ])
  })

  it('enviar sem escolher a cidade não chama a Server Action e mostra o erro', async () => {
    render(<PropostaForm />)

    fireEvent.change(screen.getByLabelText(/seu nome/i), { target: { value: 'Maria Souza' } })
    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: 'maria@exemplo.com.br' },
    })
    fireEvent.change(screen.getByLabelText(/whatsapp/i), { target: { value: '83999501388' } })
    fireEvent.change(screen.getByLabelText(/o que você representa/i), {
      target: { value: 'Condomínio residencial' },
    })
    fireEvent.click(screen.getByRole('button', { name: /turnstile/i }))
    fireEvent.submit(formularioDoBotao(/turnstile/i))

    expect(await screen.findByText(/selecione a cidade do condomínio/i)).toBeTruthy()
    expect(submitForm).not.toHaveBeenCalled()
  })
})
