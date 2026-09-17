import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/app/(frontend)/_actions/submit-form', () => ({
  submitForm: vi.fn(async () => ({ ok: true })),
}))

// O widget real da Cloudflare injeta um <script> externo e um iframe — nada
// disso existe no jsdom. O dublê expõe o único contrato que o formulário usa.
vi.mock('@/components/forms/Turnstile', () => ({
  Turnstile: ({ onToken }: { onToken: (token: string) => void }) => (
    <button onClick={() => onToken('token-de-teste')} type="button">
      turnstile
    </button>
  ),
}))

import { submitForm } from '@/app/(frontend)/_actions/submit-form'
import { ExperienceCta } from '@/components/experience/ExperienceCta'
import { ExperienceSignup } from '@/components/experience/ExperienceSignup'
import { ExperienceForm } from '@/components/forms/ExperienceForm'
import { EXPERIENCE_EVENT as E } from '@/data/experienceEvent'

/**
 * O que cada estado da landing mostra e — mais importante — o que cada um
 * deixa de mostrar.
 *
 * As asserções negativas carregam o peso aqui. O modo de falha desta
 * funcionalidade não é uma tela feia: é a página fechada continuar oferecendo
 * um caminho que não existe mais (um formulário que só vai recusar, um "quero
 * me inscrever" sem inscrição, uma cota de patrocínio de uma manhã que já
 * passou). Nada disso quebra build, tipo ou render.
 */

describe('seção de inscrição, por estado', () => {
  it('aberto: o formulário está lá, com o botão de enviar', () => {
    render(<ExperienceSignup estado="aberto" />)
    expect(screen.getByRole('button', { name: /garantir minha vaga/i })).toBeDefined()
    expect(screen.getByLabelText(/nome completo/i)).toBeDefined()
  })

  it('esgotado: o formulário SAI e o endereço entra no lugar', () => {
    const { container } = render(<ExperienceSignup estado="esgotado" />)

    expect(container.querySelector('form')).toBeNull()
    expect(screen.queryByLabelText(/nome completo/i)).toBeNull()

    // Quem chega aqui agora é, em boa parte, quem já se inscreveu e voltou só
    // para conferir onde é.
    const texto = container.textContent ?? ''
    expect(texto).toContain(E.venue)
    expect(texto).toContain(E.street)
    expect(texto).toContain(E.dateLabel)
    expect(texto).toContain(`As ${E.seats} vagas`)
  })

  it('encerrado: sem formulário, sem promessa de vaga, em coluna única', () => {
    const { container } = render(<ExperienceSignup estado="encerrado" />)

    expect(container.querySelector('form')).toBeNull()
    expect(container.querySelector('section')?.className).toContain('signup-solo')

    const texto = container.textContent ?? ''
    expect(texto).toContain('já aconteceu')
    expect(texto).toContain(E.series)
    // Nada que soe como inscrição ainda aberta.
    expect(texto).not.toMatch(/garanta a sua vaga|garantir minha vaga/i)
  })

  it('só o estado aberto usa o número de vagas como oferta', () => {
    const aberto = render(<ExperienceSignup estado="aberto" />).container.textContent ?? ''
    expect(aberto).toContain(`São ${E.seats} vagas`)

    const esgotado = render(<ExperienceSignup estado="esgotado" />).container.textContent ?? ''
    expect(esgotado).not.toContain(`São ${E.seats} vagas`)
  })
})

describe('faixa de CTA, por estado', () => {
  it('aberto e esgotado mantêm um botão; encerrado não tem para onde mandar', () => {
    const aberto = render(<ExperienceCta estado="aberto" />)
    expect(aberto.container.querySelector('a[href="#inscricao"]')).not.toBeNull()

    const esgotado = render(<ExperienceCta estado="esgotado" />)
    expect(esgotado.container.querySelector('a[href="#inscricao"]')).not.toBeNull()
    expect(esgotado.container.textContent).toContain(`As ${E.seats} vagas`)

    const encerrado = render(<ExperienceCta estado="encerrado" />)
    expect(encerrado.container.querySelector('a')).toBeNull()
    expect(encerrado.container.textContent).toMatch(/obrigado/i)
  })
})

/**
 * A recusa por lotação vista pela pessoa que estava preenchendo — o caminho
 * mais provável de acontecer na vida real, porque a página é servida com ISR e
 * pode estar até um minuto atrás do banco.
 */
describe('recusa por lotação, na tela', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function preencherEEnviar() {
    fireEvent.change(screen.getByLabelText(/nome completo/i), {
      target: { value: 'Maria Souza' },
    })
    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: 'maria@exemplo.com.br' },
    })
    fireEvent.change(screen.getByLabelText(/whatsapp/i), { target: { value: '83999501388' } })
    fireEvent.click(screen.getByRole('checkbox', { name: /uso da minha imagem/i }))
    fireEvent.click(screen.getByRole('button', { name: /turnstile/i }))
    fireEvent.click(screen.getByRole('button', { name: /garantir minha vaga/i }))
  }

  it('diz que as vagas acabaram e que a inscrição NÃO foi registrada', async () => {
    vi.mocked(submitForm).mockResolvedValueOnce({
      ok: false,
      esgotado: true,
      message: `As ${E.seats} vagas foram preenchidas enquanto você preenchia o formulário.`,
    })

    const { container } = render(<ExperienceForm />)
    preencherEEnviar()

    // A frase que impede alguém de ir à praia no sábado achando que entrou.
    expect(await screen.findByText(/não foi registrada/i)).toBeDefined()
    expect(container.textContent).toMatch(/não adianta enviar de novo/i)
    // E o aviso de que nem e-mail vai chegar — senão a ausência dele viraria
    // "deve ter dado certo".
    expect(container.textContent).toMatch(/não vai receber e-mail de confirmação/i)
  })

  it('tira o formulário de cena em vez de convidar a tentar de novo', async () => {
    vi.mocked(submitForm).mockResolvedValueOnce({ ok: false, esgotado: true })

    const { container } = render(<ExperienceForm />)
    preencherEEnviar()
    await screen.findByText(/não foi registrada/i)

    expect(container.querySelector('form')).toBeNull()
    expect(screen.queryByRole('button', { name: /garantir minha vaga/i })).toBeNull()
  })

  /**
   * A recusa não pode se parecer com a confirmação: são dois blocos com o mesmo
   * desenho, e trocar um pelo outro num refactor daria a alguém não inscrito a
   * tela de "Inscrição recebida!".
   */
  it('nunca se parece com a confirmação de inscrição', async () => {
    vi.mocked(submitForm).mockResolvedValueOnce({ ok: false, esgotado: true })

    const { container } = render(<ExperienceForm />)
    preencherEEnviar()
    await screen.findByText(/não foi registrada/i)

    expect(container.textContent).not.toMatch(/inscrição recebida/i)
    expect(container.querySelector('.signup-done')).toBeNull()
    expect(container.querySelector('[role="alert"]')).not.toBeNull()
  })

  /**
   * As duas metades da tela não podem discordar. Enquanto o card dizia "sua
   * inscrição não foi registrada", a coluna ao lado seguia anunciando "Garanta
   * a sua vaga / São N vagas" — no exato momento em que a pessoa mais precisa
   * entender o que houve. O estado vive acima das duas colunas, em
   * `ExperienceSignupAberto`, e é por isso que este teste renderiza a SEÇÃO, e
   * não o formulário sozinho.
   */
  it('a coluna ao lado para de oferecer vaga junto com o formulário', async () => {
    vi.mocked(submitForm).mockResolvedValueOnce({ ok: false, esgotado: true })

    const { container } = render(<ExperienceSignup estado="aberto" />)
    expect(container.textContent).toContain('Garanta a sua vaga')

    preencherEEnviar()
    await screen.findByText(/não foi registrada/i)

    const texto = container.textContent ?? ''
    expect(texto).not.toContain('Garanta a sua vaga')
    expect(texto).not.toContain(`São ${E.seats} vagas`)
    expect(texto).toContain(`As ${E.seats} vagas`)
    // O texto de "já estava esgotado ao abrir" não serve aqui: quem acabou de
    // ser recusado não "garantiu a sua".
    expect(texto).not.toMatch(/Se você garantiu a sua/i)
  })

  it('e o sucesso continua sendo sucesso', async () => {
    vi.mocked(submitForm).mockResolvedValueOnce({ ok: true })

    const { container } = render(<ExperienceForm />)
    preencherEEnviar()

    expect(await screen.findByText(/inscrição recebida/i)).toBeDefined()
    expect(container.textContent).not.toMatch(/não foi registrada/i)
  })
})
