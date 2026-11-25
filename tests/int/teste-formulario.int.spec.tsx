import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Teste A/B do formulário do topo das landings de cidade (25/11/2026). O que se
 * defende aqui: a atribuição é estável (cookie de 1ª parte, sorteio só uma vez),
 * `?form=` força sem regravar, o script em linha funciona sozinho como texto, a
 * página mostra só um formulário, e cada braço manda a sua variante ao servidor
 * e ao `generate_lead`. O envio do `b` até o mapa do RD fica em
 * `teste-formulario-envio.int.spec.ts`.
 */

vi.mock('@/app/(frontend)/_actions/submit-form', () => ({
  submitForm: vi.fn(async () => ({ ok: true, message: 'Recebemos sua mensagem!' })),
  submitPropostaRapida: vi.fn(async () => ({
    ok: true,
    message: 'Recebemos sua mensagem!',
    protocolo: 'SG-ABC234',
  })),
}))

// Mesmo dublê de `proposta-cidade`: o widget real injeta script e iframe.
vi.mock('@/components/forms/Turnstile', () => ({
  Turnstile: ({ onToken }: { onToken: (token: string) => void }) => (
    <button onClick={() => onToken('token-de-teste')} type="button">
      turnstile
    </button>
  ),
}))

import { submitForm, submitPropostaRapida } from '@/app/(frontend)/_actions/submit-form'
import { PropostaFormAb } from '@/components/forms/PropostaFormAb'
import {
  ATRIBUTO_TESTE_FORMULARIO,
  aplicarTesteFormulario,
  COOKIE_TESTE_FORMULARIO,
  MAX_AGE_TESTE_FORMULARIO,
  PARAMETRO_TESTE_FORMULARIO,
  scriptTesteFormulario,
  TESTE_FORMULARIO_FIELD,
  varianteNoNavegador,
} from '@/lib/testeFormulario'

const CONFIG = {
  cookie: COOKIE_TESTE_FORMULARIO,
  maxAge: MAX_AGE_TESTE_FORMULARIO,
  parametro: PARAMETRO_TESTE_FORMULARIO,
  atributo: ATRIBUTO_TESTE_FORMULARIO,
}

function cookieDoTeste(): string | undefined {
  return document.cookie
    .split('; ')
    .find((par) => par.startsWith(`${COOKIE_TESTE_FORMULARIO}=`))
    ?.split('=')[1]
}

function limpar() {
  // biome-ignore lint/suspicious/noDocumentCookie: limpeza do cookie entre testes no jsdom.
  document.cookie = `${COOKIE_TESTE_FORMULARIO}=; max-age=0; path=/`
  document.documentElement.removeAttribute(ATRIBUTO_TESTE_FORMULARIO)
  window.history.replaceState({}, '', '/administradora-de-condominios-recife')
}

// jsdom não implementa a rolagem usada pelo seletor de país.
const scrollIntoViewOriginal = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'scrollIntoView',
)
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  })
})
afterAll(() => {
  if (scrollIntoViewOriginal) {
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', scrollIntoViewOriginal)
  } else {
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView')
  }
})

beforeEach(() => {
  vi.clearAllMocks()
  limpar()
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  limpar()
})

describe('atribuição da variante', () => {
  it('sorteia 50/50 pelo Math.random: abaixo de 0,5 é a, a partir de 0,5 é b', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.49)
    expect(aplicarTesteFormulario(CONFIG)).toBe('a')
    limpar()
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    expect(aplicarTesteFormulario(CONFIG)).toBe('b')
  })

  it('grava o sorteio no cookie e marca o <html>', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9)
    aplicarTesteFormulario(CONFIG)

    expect(cookieDoTeste()).toBe('b')
    expect(document.documentElement.getAttribute(ATRIBUTO_TESTE_FORMULARIO)).toBe('b')
  })

  it('é estável: a próxima visita lê o cookie e não sorteia de novo', () => {
    const sorteio = vi.spyOn(Math, 'random').mockReturnValue(0.1)
    expect(aplicarTesteFormulario(CONFIG)).toBe('a')
    document.documentElement.removeAttribute(ATRIBUTO_TESTE_FORMULARIO) // nova página

    sorteio.mockReturnValue(0.9)
    for (let i = 0; i < 5; i++) expect(aplicarTesteFormulario(CONFIG)).toBe('a')
    expect(sorteio).toHaveBeenCalledTimes(1)
  })

  it('cookie com valor estranho é sorteado de novo, nunca vira variante', () => {
    // biome-ignore lint/suspicious/noDocumentCookie: preparação do cenário no jsdom.
    document.cookie = `${COOKIE_TESTE_FORMULARIO}=c; path=/`
    vi.spyOn(Math, 'random').mockReturnValue(0.7)

    expect(aplicarTesteFormulario(CONFIG)).toBe('b')
    expect(cookieDoTeste()).toBe('b')
  })

  it('?form=b força a variante nesta visita sem tocar no cookie', () => {
    // biome-ignore lint/suspicious/noDocumentCookie: preparação do cenário no jsdom.
    document.cookie = `${COOKIE_TESTE_FORMULARIO}=a; path=/`
    window.history.replaceState({}, '', '/administradora-de-condominios-recife?form=b')
    const sorteio = vi.spyOn(Math, 'random')

    expect(aplicarTesteFormulario(CONFIG)).toBe('b')
    expect(cookieDoTeste()).toBe('a')
    expect(sorteio).not.toHaveBeenCalled()
  })

  it('?form=a sem cookie força o a e não grava cookie (o teste manual não entra no sorteio)', () => {
    window.history.replaceState({}, '', '/administradora-de-condominios-recife?form=a')

    expect(aplicarTesteFormulario(CONFIG)).toBe('a')
    expect(cookieDoTeste()).toBeUndefined()
  })

  it('?form= inválido é ignorado e cai no sorteio', () => {
    window.history.replaceState({}, '', '/administradora-de-condominios-recife?form=x')
    vi.spyOn(Math, 'random').mockReturnValue(0.2)

    expect(aplicarTesteFormulario(CONFIG)).toBe('a')
    expect(cookieDoTeste()).toBe('a')
  })

  it('o script em linha roda sozinho como texto (sem import nem constante de fora)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.8)
    // Executa o texto exatamente como o navegador executa o <script>.
    new Function(scriptTesteFormulario())()

    expect(document.documentElement.getAttribute(ATRIBUTO_TESTE_FORMULARIO)).toBe('b')
    expect(cookieDoTeste()).toBe('b')
  })

  it('varianteNoNavegador usa a marca do script; sem ela (navegação pelo cliente), decide', () => {
    document.documentElement.setAttribute(ATRIBUTO_TESTE_FORMULARIO, 'b')
    const sorteio = vi.spyOn(Math, 'random').mockReturnValue(0.1)
    expect(varianteNoNavegador()).toBe('b')
    expect(sorteio).not.toHaveBeenCalled()

    document.documentElement.removeAttribute(ATRIBUTO_TESTE_FORMULARIO)
    expect(varianteNoNavegador()).toBe('a')
    expect(cookieDoTeste()).toBe('a')
  })

  it('a chave gravada no lead é a mesma do schema', () => {
    expect(TESTE_FORMULARIO_FIELD).toBe('testeFormulario')
  })
})

describe('PropostaFormAb na página', () => {
  it('no HTML do servidor vão os dois formulários, e o CSS decide qual aparece', () => {
    const html = renderToString(<PropostaFormAb cidade="Recife e região" />)

    expect(html).toContain('in-data-[form-ab=b]:hidden')
    expect(html).toContain('hidden in-data-[form-ab=b]:block')
    expect(html.match(/<form/g)).toHaveLength(2)
  })

  it('com a variante b marcada, só o formulário curto fica no DOM', () => {
    document.documentElement.setAttribute(ATRIBUTO_TESTE_FORMULARIO, 'b')
    const { container } = render(<PropostaFormAb cidade="Recife e região" />)

    expect(container.querySelectorAll('form')).toHaveLength(1)
    expect(screen.queryByLabelText(/e-mail/i)).toBeNull()
    expect(screen.queryByLabelText(/tipo de condomínio/i)).toBeNull()
    expect(screen.getByLabelText(/seu nome/i)).toBeInstanceOf(HTMLInputElement)
    expect(screen.getByLabelText(/whatsapp/i)).toBeInstanceOf(HTMLInputElement)
    expect(
      container.querySelector<HTMLInputElement>('input[type="hidden"][name="cidade"]')?.value,
    ).toBe('Recife e região')
  })

  it('com a variante a marcada, só o formulário atual fica no DOM', () => {
    document.documentElement.setAttribute(ATRIBUTO_TESTE_FORMULARIO, 'a')
    const { container } = render(<PropostaFormAb cidade="Recife e região" />)

    expect(container.querySelectorAll('form')).toHaveLength(1)
    expect(screen.getByLabelText(/e-mail/i)).toBeInstanceOf(HTMLInputElement)
    expect(screen.getByLabelText(/tipo de condomínio/i)).toBeInstanceOf(HTMLSelectElement)
  })

  it('braço b: envia pela proposta curta com testeFormulario b e marca o generate_lead', async () => {
    const gtag = vi.fn()
    vi.stubGlobal('gtag', gtag)
    document.documentElement.setAttribute(ATRIBUTO_TESTE_FORMULARIO, 'b')
    render(<PropostaFormAb cidade="João Pessoa e região" />)

    fireEvent.change(screen.getByLabelText(/seu nome/i), { target: { value: 'Maria Souza' } })
    fireEvent.change(screen.getByLabelText(/whatsapp/i), { target: { value: '83999501388' } })
    fireEvent.click(screen.getByRole('button', { name: /turnstile/i }))
    fireEvent.click(screen.getByRole('button', { name: /quero minha proposta/i }))

    await waitFor(() => expect(submitPropostaRapida).toHaveBeenCalledTimes(1))
    expect(submitForm).not.toHaveBeenCalled()
    const [valores, token] = vi.mocked(submitPropostaRapida).mock.calls[0]
    expect(valores).toMatchObject({
      nome: 'Maria Souza',
      telefone: '+5583999501388',
      cidade: 'João Pessoa e região',
      testeFormulario: 'b',
    })
    expect(token).toBe('token-de-teste')

    await screen.findByText(/pelo WhatsApp informado/i)
    expect(gtag).toHaveBeenCalledWith('event', 'generate_lead', {
      form: 'proposta',
      variante: 'contato-rapido',
      teste_formulario: 'b',
      currency: 'BRL',
      value: 1,
    })
  })

  it('braço b: sem nome nem WhatsApp não envia e mostra os erros', async () => {
    document.documentElement.setAttribute(ATRIBUTO_TESTE_FORMULARIO, 'b')
    render(<PropostaFormAb cidade="Recife e região" />)

    fireEvent.click(screen.getByRole('button', { name: /turnstile/i }))
    fireEvent.click(screen.getByRole('button', { name: /quero minha proposta/i }))

    expect(await screen.findByText('Informe seu nome.')).toBeTruthy()
    expect(screen.getByText('Informe seu WhatsApp.')).toBeTruthy()
    expect(submitPropostaRapida).not.toHaveBeenCalled()
  })

  it('braço a: envia a proposta completa com testeFormulario a e marca o generate_lead', async () => {
    const gtag = vi.fn()
    vi.stubGlobal('gtag', gtag)
    document.documentElement.setAttribute(ATRIBUTO_TESTE_FORMULARIO, 'a')
    render(<PropostaFormAb cidade="Recife e região" />)

    fireEvent.change(screen.getByLabelText(/seu nome/i), { target: { value: 'Maria Souza' } })
    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: 'maria@exemplo.com.br' },
    })
    fireEvent.change(screen.getByLabelText(/whatsapp/i), { target: { value: '81999501388' } })
    fireEvent.change(screen.getByLabelText(/tipo de condomínio/i), {
      target: { value: 'Condomínio residencial' },
    })
    fireEvent.click(screen.getByRole('button', { name: /turnstile/i }))
    fireEvent.click(screen.getByRole('button', { name: /quero minha proposta/i }))

    await waitFor(() => expect(submitForm).toHaveBeenCalledTimes(1))
    const [form, valores] = vi.mocked(submitForm).mock.calls[0]
    expect(form).toBe('proposta')
    expect(valores).toMatchObject({ cidade: 'Recife e região', testeFormulario: 'a' })

    await screen.findByText(/pelo WhatsApp ou e-mail informado/i)
    expect(gtag).toHaveBeenCalledWith('event', 'generate_lead', {
      form: 'proposta',
      teste_formulario: 'a',
      currency: 'BRL',
      value: 1,
    })
  })
})
