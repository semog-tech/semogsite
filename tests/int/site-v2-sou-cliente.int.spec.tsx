import { fireEvent, render, screen, within } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const acoes = vi.hoisted(() => ({
  solicitarCodigo: vi.fn(),
  reenviarCodigo: vi.fn(),
  confirmarCodigo: vi.fn(),
  listarCobrancas: vi.fn(),
  abrirBoleto: vi.fn(),
  encerrarConsulta: vi.fn(),
}))
vi.mock('@/app/(frontend)/_actions/segunda-via', () => acoes)
vi.mock('@/components/forms/Turnstile', () => ({ Turnstile: () => null }))
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))
vi.mock('@/providers/ConsentProvider', () => ({
  useConsent: () => ({ consent: { analytics: true }, decided: true }),
}))

import { LeadClickTracker } from '@/components/analytics/LeadClickTracker'
import {
  linkWhatsApp,
  MENSAGEM_DE_ATENDIMENTO,
  MENSAGEM_DO_CLIENTE,
  SECOES_FORA_DO_ADS,
} from '@/lib/triagem'
import { GatilhoSouCliente } from '@/site/cliente/GatilhoSouCliente'
import { PainelSouCliente } from '@/site/cliente/PainelSouCliente'

// O jsdom tem <dialog> mas não showModal/close (o mesmo dublê dos testes da triagem).
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
beforeEach(() => {
  vi.clearAllMocks()
  window.gtag = gtag
  acoes.encerrarConsulta.mockResolvedValue(undefined)
})

/** O Blob do jsdom não tem `text()`; o FileReader dele lê. */
function lerBlob(blob: Blob): Promise<string> {
  return new Promise((resolver, rejeitar) => {
    const leitor = new FileReader()
    leitor.onload = () => resolver(String(leitor.result))
    leitor.onerror = () => rejeitar(leitor.error)
    leitor.readAsText(blob)
  })
}

function dialogo(): HTMLDialogElement {
  const d = document.querySelector('dialog.sou-cliente')
  if (!(d instanceof HTMLDialogElement)) throw new Error('painel ausente')
  return d
}

describe('"Sou cliente" (spec 5, DP6)', () => {
  it('sem JS e antes de hidratar, o gatilho é o WhatsApp de cliente, marcado como atendimento', () => {
    const html = renderToStaticMarkup(
      <GatilhoSouCliente origem="cabecalho">Sou cliente</GatilhoSouCliente>,
    )
    expect(html).toContain('data-wa-caminho="cliente"')
    // Quem não escolheu nada recebe a mensagem de atendimento, não a da 2ª via.
    expect(html).toContain(`href="${linkWhatsApp(MENSAGEM_DE_ATENDIMENTO)}"`)
    const daSegundaVia = renderToStaticMarkup(
      <GatilhoSouCliente origem="contato" tela="segunda-via">
        2ª via
      </GatilhoSouCliente>,
    )
    expect(daSegundaVia).toContain(`href="${linkWhatsApp(MENSAGEM_DO_CLIENTE)}"`)
  })

  it('hidratado, é um botão que abre o painel; o painel não tem proposta e mede a abertura', () => {
    render(
      <>
        <GatilhoSouCliente origem="cabecalho">Sou cliente</GatilhoSouCliente>
        <PainelSouCliente segundaViaAtiva={false} />
      </>,
    )
    const botao = screen.getByRole('button', { name: 'Sou cliente' })
    expect(botao.getAttribute('href')).toBeNull()
    fireEvent.click(botao)
    expect(dialogo().hasAttribute('open')).toBe(true)
    const painel = within(dialogo())
    expect(painel.getByText('Atendimento ao condômino')).toBeTruthy()
    expect(painel.getByText('Área do cliente')).toBeTruthy()
    expect(dialogo().textContent).not.toMatch(/proposta/i)
    expect(gtag).toHaveBeenCalledWith(
      'event',
      'sou_cliente_aberto',
      expect.objectContaining({ origem: 'cabecalho' }),
    )
  })

  it('o WhatsApp do painel é atendimento: triagem_whatsapp_click em triagem_cliente, fora do Ads', () => {
    render(
      <>
        <LeadClickTracker />
        <GatilhoSouCliente origem="rodape">Sou cliente</GatilhoSouCliente>
        <PainelSouCliente segundaViaAtiva={false} />
      </>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Sou cliente' }))
    const link = within(dialogo()).getByRole('link', { name: /Atendimento ao condômino/ })
    expect(link.getAttribute('href')).toBe(linkWhatsApp(MENSAGEM_DE_ATENDIMENTO))
    expect(link.getAttribute('data-wa-caminho')).toBe('cliente')
    fireEvent.click(link)
    expect(gtag).toHaveBeenCalledWith(
      'event',
      'triagem_whatsapp_click',
      expect.objectContaining({ link_section: 'triagem_cliente' }),
    )
    expect(gtag).not.toHaveBeenCalledWith('event', 'whatsapp_click', expect.anything())
    expect(SECOES_FORA_DO_ADS).toContain('triagem_cliente')
    expect(SECOES_FORA_DO_ADS).toContain('triagem_restrita')
  })

  it('com a 2ª via ligada, o atalho direto abre o fluxo de hoje, com a saída para o WhatsApp marcada', async () => {
    render(
      <>
        <GatilhoSouCliente origem="contato" tela="segunda-via">
          2ª via
        </GatilhoSouCliente>
        <PainelSouCliente segundaViaAtiva />
      </>,
    )
    fireEvent.click(screen.getByRole('button', { name: '2ª via' }))
    expect(await screen.findByText(/Informe o CPF cadastrado/)).toBeTruthy()
    const saida = within(dialogo()).getByRole('link', { name: 'Prefiro falar no WhatsApp' })
    expect(saida.getAttribute('data-wa-caminho')).toBe('cliente')
  })

  it('fechar devolve o foco ao gatilho e destrava a página', () => {
    render(
      <>
        <GatilhoSouCliente origem="cabecalho">Sou cliente</GatilhoSouCliente>
        <PainelSouCliente segundaViaAtiva={false} />
      </>,
    )
    const botao = screen.getByRole('button', { name: 'Sou cliente' })
    fireEvent.click(botao)
    expect(document.documentElement.classList.contains('sc-travado')).toBe(true)
    fireEvent.click(within(dialogo()).getByRole('button', { name: 'Fechar' }))
    expect(dialogo().hasAttribute('open')).toBe(false)
    expect(document.documentElement.classList.contains('sc-travado')).toBe(false)
    expect(document.activeElement).toBe(botao)
  })

  it('modo de falha: o link do servidor (antes de hidratar) também sai como atendimento, e o comercial segue lead', () => {
    const beacon = vi.fn(() => true)
    Object.defineProperty(navigator, 'sendBeacon', { value: beacon, configurable: true })
    const { container } = render(<LeadClickTracker />)
    // O HTML do servidor, colado como chegaria antes do React: o link wa.me marcado.
    container.insertAdjacentHTML(
      'beforeend',
      renderToStaticMarkup(<GatilhoSouCliente origem="rodape">Sou cliente</GatilhoSouCliente>),
    )
    // Um WhatsApp comercial sem marca (o de hoje no site antigo), para contraste.
    container.insertAdjacentHTML('beforeend', `<a href="${linkWhatsApp('oi')}">Comercial</a>`)
    const cliente = within(container).getByRole('link', { name: 'Sou cliente' })
    cliente.addEventListener('click', (evento) => evento.preventDefault())
    fireEvent.click(cliente)
    expect(gtag).toHaveBeenCalledTimes(1)
    expect(gtag).toHaveBeenLastCalledWith(
      'event',
      'triagem_whatsapp_click',
      expect.objectContaining({ link_section: 'triagem_cliente' }),
    )
    expect(gtag).not.toHaveBeenCalledWith('event', 'whatsapp_click', expect.anything())
    // A mensagem de atendimento não é trocada pela de captação.
    expect(cliente.getAttribute('href')).toBe(linkWhatsApp(MENSAGEM_DE_ATENDIMENTO))
    expect(beacon).toHaveBeenCalledTimes(1)

    const comercial = within(container).getByRole('link', { name: 'Comercial' })
    comercial.addEventListener('click', (evento) => evento.preventDefault())
    fireEvent.click(comercial)
    expect(gtag).toHaveBeenLastCalledWith(
      'event',
      'whatsapp_click',
      expect.objectContaining({ link_section: 'conteudo' }),
    )
  })

  it('o beacon do clique de atendimento leva a seção triagem_cliente (que o cron do Ads ignora)', async () => {
    const enviados: Blob[] = []
    Object.defineProperty(navigator, 'sendBeacon', {
      value: (_url: string, corpo: Blob) => {
        enviados.push(corpo)
        return true
      },
      configurable: true,
    })
    render(
      <>
        <LeadClickTracker />
        <GatilhoSouCliente origem="cabecalho">Sou cliente</GatilhoSouCliente>
        <PainelSouCliente segundaViaAtiva={false} />
      </>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Sou cliente' }))
    const link = within(dialogo()).getByRole('link', { name: /2ª via do boleto/ })
    expect(link.getAttribute('href')).toBe(linkWhatsApp(MENSAGEM_DO_CLIENTE))
    link.addEventListener('click', (evento) => evento.preventDefault())
    fireEvent.click(link)
    expect(enviados).toHaveLength(1)
    const corpo: unknown = JSON.parse(await lerBlob(enviados[0]))
    expect(corpo).toMatchObject({ section: 'triagem_cliente' })
    expect(SECOES_FORA_DO_ADS).toContain('triagem_cliente')
  })

  it('com a 2ª via desligada, o atalho direto abre o menu, que a oferece pelo WhatsApp', () => {
    render(
      <>
        <GatilhoSouCliente origem="contato" tela="segunda-via">
          2ª via
        </GatilhoSouCliente>
        <PainelSouCliente segundaViaAtiva={false} />
      </>,
    )
    fireEvent.click(screen.getByRole('button', { name: '2ª via' }))
    const painel = within(dialogo())
    expect(painel.getByText('Escolha o que você precisa.')).toBeTruthy()
    expect(
      painel.getByRole('link', { name: /2ª via do boleto/ }).getAttribute('data-wa-caminho'),
    ).toBe('cliente')
    expect(painel.queryByText(/Informe o CPF cadastrado/)).toBeNull()
  })

  it('fechar depois de usar a 2ª via encerra a consulta no servidor; sem usá-la, não', async () => {
    render(
      <>
        <GatilhoSouCliente origem="cabecalho">Sou cliente</GatilhoSouCliente>
        <PainelSouCliente segundaViaAtiva />
      </>,
    )
    const botao = screen.getByRole('button', { name: 'Sou cliente' })
    fireEvent.click(botao)
    fireEvent.click(within(dialogo()).getByRole('button', { name: 'Fechar' }))
    expect(acoes.encerrarConsulta).not.toHaveBeenCalled()

    fireEvent.click(botao)
    fireEvent.click(within(dialogo()).getByRole('button', { name: /2ª via do boleto/ }))
    expect(await screen.findByText(/Informe o CPF cadastrado/)).toBeTruthy()
    fireEvent.click(within(dialogo()).getByRole('button', { name: 'Fechar' }))
    await vi.waitFor(() => expect(acoes.encerrarConsulta).toHaveBeenCalledTimes(1))
    expect(document.activeElement).toBe(botao)
  })

  it('desmontar com o painel aberto destrava a página e para de ouvir os gatilhos', () => {
    const { unmount } = render(
      <>
        <GatilhoSouCliente origem="cabecalho">Sou cliente</GatilhoSouCliente>
        <PainelSouCliente segundaViaAtiva={false} />
      </>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Sou cliente' }))
    expect(document.documentElement.classList.contains('sc-travado')).toBe(true)
    unmount()
    expect(document.documentElement.classList.contains('sc-travado')).toBe(false)
    expect(document.querySelector('dialog.sou-cliente')).toBeNull()
    expect(gtag).toHaveBeenCalledTimes(1)
    window.dispatchEvent(
      new CustomEvent('semog:sou-cliente', {
        detail: { origem: 'rodape', tela: 'menu', gatilho: null },
      }),
    )
    expect(gtag).toHaveBeenCalledTimes(1)
  })

  it('Tab do último controle volta ao primeiro, e Shift+Tab do primeiro vai ao último', () => {
    render(
      <>
        <GatilhoSouCliente origem="cabecalho">Sou cliente</GatilhoSouCliente>
        <PainelSouCliente segundaViaAtiva={false} />
      </>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Sou cliente' }))
    const controles = Array.from(dialogo().querySelectorAll<HTMLElement>('a[href], button'))
    const primeiro = controles[0]
    const ultimo = controles[controles.length - 1]
    if (!primeiro || !ultimo) throw new Error('painel sem controles')
    expect(primeiro.getAttribute('aria-label')).toBe('Fechar')
    expect(ultimo.textContent).toMatch(/Área do cliente/)
    ultimo.focus()
    fireEvent.keyDown(ultimo, { key: 'Tab' })
    expect(document.activeElement).toBe(primeiro)
    fireEvent.keyDown(primeiro, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(ultimo)
    // No meio, o navegador cuida: nada é impedido.
    const meio = controles[1]
    if (!meio) throw new Error('painel sem controle do meio')
    meio.focus()
    expect(fireEvent.keyDown(meio, { key: 'Tab' })).toBe(true)
    expect(document.activeElement).toBe(meio)
    // Do título (tabindex -1, antes do Fechar), Shift+Tab vai ao último.
    const titulo = dialogo().querySelector('h2')
    if (!(titulo instanceof HTMLElement)) throw new Error('painel sem título')
    titulo.focus()
    fireEvent.keyDown(titulo, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(ultimo)
  })

  it('aberto pelo menu do celular, fechar devolve o foco ao botão Menu (o do item sumiu com o menu)', () => {
    render(
      <>
        <header data-cabecalho="">
          <button type="button" data-menu="">
            Menu
          </button>
          <GatilhoSouCliente origem="menu">Sou cliente</GatilhoSouCliente>
        </header>
        <PainelSouCliente segundaViaAtiva={false} />
      </>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Sou cliente' }))
    fireEvent.click(within(dialogo()).getByRole('button', { name: 'Fechar' }))
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Menu' }))
  })
})
