import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Triagem do botão flutuante de WhatsApp. O que se defende aqui:
 *
 * - sem JavaScript o botão continua sendo o link direto do WhatsApp;
 * - cada caminho leva a mensagem exata da spec, e o `LeadClickTracker` não a
 *   troca pela genérica (a armadilha descrita na spec);
 * - a confirmação, com protocolo e "Continuar no WhatsApp", só aparece depois
 *   de a action devolver `ok: true`.
 */

const submitPropostaRapidaMock = vi.fn()
vi.mock('@/app/(frontend)/_actions/submit-form', () => ({
  submitPropostaRapida: (...args: unknown[]) => submitPropostaRapidaMock(...args),
}))

// Mesmo dublê de `proposta-cidade`: o widget real injeta script e iframe.
vi.mock('@/components/forms/Turnstile', () => ({
  Turnstile: ({ onToken }: { onToken: (token: string) => void }) => (
    <button onClick={() => onToken('token-de-teste')} type="button">
      turnstile
    </button>
  ),
}))

vi.mock('@/providers/ConsentProvider', () => ({
  useConsent: () => ({ consent: { analytics: true }, decided: true }),
}))

import { LeadClickTracker } from '@/components/analytics/LeadClickTracker'
import { WhatsAppFloat } from '@/components/layout/WhatsAppFloat'
import { TriagemWhatsApp } from '@/components/triagem/TriagemWhatsApp'

const WA = 'https://wa.me/551130034506'

/** `href` que a spec manda para cada caminho, com a mensagem codificada. */
function linkEsperado(mensagem: string) {
  return `${WA}?text=${encodeURIComponent(mensagem)}`
}

// O jsdom tem `<dialog>` mas não `showModal`/`close`. O dublê faz o mínimo que
// o componente usa: o atributo `open` e o evento `close`.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
})

const gtag = vi.fn()
const sendBeacon = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  window.gtag = gtag
  Object.defineProperty(navigator, 'sendBeacon', { value: sendBeacon, configurable: true })
  window.history.replaceState(null, '', '/')
})

afterEach(() => {
  window.gtag = undefined
})

/** O `Blob` do jsdom não tem `.text()`; o `FileReader` tem. */
function lerBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader()
    leitor.onload = () => resolve(String(leitor.result))
    leitor.onerror = () => reject(leitor.error)
    leitor.readAsText(blob)
  })
}

/** Monta a triagem já hidratada e abre o menu. */
async function abrirTriagem() {
  render(<TriagemWhatsApp whatsappHref={WA} />)
  const botao = await screen.findByRole('button', { name: 'Falar com a Semog' })
  fireEvent.click(botao)
  return botao
}

describe('sem JavaScript', () => {
  it('o HTML do servidor é o link direto do WhatsApp, sem triagem', async () => {
    const html = renderToString(await WhatsAppFloat())

    expect(html).toContain(`href="${WA}"`)
    expect(html).toMatch(/^<a class="wa-float"/)
    expect(html).not.toContain('<dialog')
    expect(html).not.toContain('<button')
  })
})

describe('menu da triagem', () => {
  it('depois de hidratar, o botão abre o diálogo e registra triagem_aberta', async () => {
    const botao = await abrirTriagem()

    expect(botao.getAttribute('aria-haspopup')).toBe('dialog')
    expect(botao.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('heading', { name: 'Como podemos ajudar?' })).toBeTruthy()
    expect(gtag).toHaveBeenCalledWith('event', 'triagem_aberta', { page_path: '/' })
  })

  it('cada caminho de WhatsApp leva a mensagem exata da spec e a marca do caminho', async () => {
    await abrirTriagem()

    const cliente = screen.getByRole('link', { name: /Sou cliente: 2ª via e atendimento/ })
    expect(cliente.getAttribute('href')).toBe(
      linkEsperado('Olá! Sou cliente e quero a segunda via do boleto.'),
    )
    expect(cliente.getAttribute('data-wa-caminho')).toBe('cliente')

    const outro = screen.getByRole('link', { name: /Outro assunto/ })
    expect(outro.getAttribute('href')).toBe(
      linkEsperado('Olá! Vim pelo site e tenho outra dúvida.'),
    )
    expect(outro.getAttribute('data-wa-caminho')).toBe('outro')

    const portal = screen.getByRole('link', { name: 'Acessar a área do cliente' })
    expect(portal.getAttribute('href')).toBe(
      'https://semog.superlogica.net/clients/areadocondomino',
    )
  })

  it('Fechar devolve o foco ao botão e recolhe o aria-expanded', async () => {
    const botao = await abrirTriagem()

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    // A saída é animada: o `close()` vem depois da animação.
    await waitFor(() => expect(botao.getAttribute('aria-expanded')).toBe('false'))
    expect(document.activeElement).toBe(botao)
  })
})

describe('LeadClickTracker com os links da triagem', () => {
  it('não reescreve a mensagem e mede pela seção do caminho', async () => {
    render(<LeadClickTracker />)
    await abrirTriagem()

    const cliente = screen.getByRole('link', { name: /Sou cliente/ }) as HTMLAnchorElement
    const antes = cliente.href
    cliente.addEventListener('click', (e) => e.preventDefault())
    fireEvent.click(cliente)

    expect(cliente.href).toBe(antes)
    expect(decodeURIComponent(cliente.href)).toContain('Sou cliente e quero a segunda via')
    expect(gtag).toHaveBeenCalledWith(
      'event',
      'whatsapp_click',
      expect.objectContaining({ link_section: 'triagem_cliente', link_url: WA }),
    )
    const corpo = await lerBlob(sendBeacon.mock.calls[0]?.[1] as Blob)
    expect(JSON.parse(corpo)).toEqual({ page: '/', section: 'triagem_cliente' })
  })

  it('link de WhatsApp fora da triagem continua ganhando a mensagem genérica', () => {
    render(
      <>
        <LeadClickTracker />
        <a href={WA}>WhatsApp do rodapé</a>
      </>,
    )
    const link = screen.getByRole('link', { name: 'WhatsApp do rodapé' }) as HTMLAnchorElement
    link.addEventListener('click', (e) => e.preventDefault())
    fireEvent.click(link)

    expect(new URL(link.href).searchParams.get('text')).toContain('Vim pelo site da Semog')
  })
})

describe('proposta curta', () => {
  /** Vai do menu à proposta e preenche o mínimo válido. */
  async function preencherProposta() {
    await abrirTriagem()
    fireEvent.click(screen.getByRole('button', { name: /Quero uma proposta/ }))
    fireEvent.change(screen.getByLabelText(/seu nome/i), { target: { value: 'Maria Souza' } })
    fireEvent.change(screen.getByLabelText(/^whatsapp/i), { target: { value: '81999501388' } })
    fireEvent.click(screen.getByRole('button', { name: 'turnstile' }))
  }

  it('na landing de cidade, a cidade já vem escolhida com a dica', async () => {
    window.history.replaceState(null, '', '/administradora-de-condominios-recife')
    await abrirTriagem()
    fireEvent.click(screen.getByRole('button', { name: /Quero uma proposta/ }))

    const cidade = screen.getByLabelText(/cidade do condomínio/i) as HTMLSelectElement
    expect(cidade.value).toBe('Recife e região')
    expect(screen.getByText('Já vem com Recife porque você está na página de Recife.')).toBeTruthy()
  })

  it('sem cidade escolhida, mostra o erro da spec e não envia', async () => {
    await preencherProposta()
    fireEvent.click(screen.getByRole('button', { name: 'Pedir proposta' }))

    expect(await screen.findByText('Selecione a cidade do condomínio.')).toBeTruthy()
    expect(submitPropostaRapidaMock).not.toHaveBeenCalled()
  })

  it('ok: confirma com protocolo e o WhatsApp leva a mensagem com o protocolo', async () => {
    submitPropostaRapidaMock.mockResolvedValue({ ok: true, protocolo: 'SG-7K4M2Q' })
    await preencherProposta()
    fireEvent.change(screen.getByLabelText(/cidade do condomínio/i), {
      target: { value: 'Belém e região' },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Pedir proposta' }))
    })

    expect(await screen.findByRole('heading', { name: 'Pedido recebido' })).toBeTruthy()
    expect(screen.getByText('SG-7K4M2Q')).toBeTruthy()
    const continuar = screen.getByRole('link', { name: /Continuar no WhatsApp/ })
    expect(continuar.getAttribute('href')).toBe(
      linkEsperado('Olá! Acabei de pedir uma proposta pelo site. Protocolo SG-7K4M2Q.'),
    )
    expect(continuar.getAttribute('data-wa-caminho')).toBe('proposta')

    const [valores, token] = submitPropostaRapidaMock.mock.calls[0] as [
      Record<string, string>,
      string,
    ]
    expect(valores).toMatchObject({ nome: 'Maria Souza', cidade: 'Belém e região' })
    expect(valores.telefone).toBe('+5581999501388')
    expect(token).toBe('token-de-teste')
    expect(gtag).toHaveBeenCalledWith('event', 'generate_lead', {
      form: 'proposta',
      variante: 'contato_rapido',
      currency: 'BRL',
      value: 1,
    })
  })

  it('falha na gravação: fica no formulário, mostra a falha e nenhum protocolo', async () => {
    submitPropostaRapidaMock.mockResolvedValue({
      ok: false,
      message: 'Erro ao enviar. Tente novamente.',
    })
    await preencherProposta()
    fireEvent.change(screen.getByLabelText(/cidade do condomínio/i), {
      target: { value: 'Outra cidade' },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Pedir proposta' }))
    })

    expect(await screen.findByText('Erro ao enviar. Tente novamente.')).toBeTruthy()
    expect(screen.queryByRole('link', { name: /Continuar no WhatsApp/ })).toBeNull()
    expect(screen.queryByText(/Protocolo/)).toBeNull()
    expect(gtag).not.toHaveBeenCalledWith('event', 'generate_lead', expect.anything())
  })
})
