import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Telas da 2ª via dentro da triagem (S5). O que se defende aqui:
 *
 * - com a flag desligada, "Sou cliente" continua o link de WhatsApp da fase 1;
 * - os textos da spec, inclusive o do código, que nunca revela se o CPF existe;
 * - valor em reais a partir de centavos, "valor indisponível" no lugar de zero;
 * - o link do boleto só existe na aba nova, nunca no GA4;
 * - consulta expirada (cookie ausente) e resposta atrasada não levam a pessoa
 *   para a tela errada.
 *
 * As Server Actions são dublês: o que vai ao app e aos cookies tem teste
 * próprio em `segunda-via-actions.int.spec.ts`.
 */

const acoes = vi.hoisted(() => ({
  solicitarCodigo: vi.fn(),
  reenviarCodigo: vi.fn(),
  confirmarCodigo: vi.fn(),
  listarCobrancas: vi.fn(),
  abrirBoleto: vi.fn(),
  encerrarConsulta: vi.fn(),
}))
vi.mock('@/app/(frontend)/_actions/segunda-via', () => acoes)

vi.mock('@/app/(frontend)/_actions/submit-form', () => ({ submitPropostaRapida: vi.fn() }))

// Mesmo dublê da triagem: o widget real injeta script e iframe.
vi.mock('@/components/forms/Turnstile', () => ({
  Turnstile: ({ onToken }: { onToken: (token: string) => void }) => (
    <button onClick={() => onToken('token-de-teste')} type="button">
      turnstile
    </button>
  ),
}))

import { TriagemWhatsApp } from '@/components/triagem/TriagemWhatsApp'

const WA = 'https://wa.me/551130034506'
const CPF = '529.982.247-25'
const U1 = { ref: 'U'.repeat(22), condominio: 'Condomínio Exemplo A', unidade: 'Apto 302' }
const U2 = { ref: 'V'.repeat(22), condominio: 'Condomínio Exemplo B', unidade: 'Casa 4' }
const A_VENCER = {
  ref: 'C'.repeat(22),
  vencimento: '2026-10-10',
  valorCentavos: 45000,
  vencida: false,
}
const VENCIDA = {
  ref: 'D'.repeat(22),
  vencimento: '2026-09-10',
  valorCentavos: 123456,
  vencida: true,
}
const SEM_VALOR = {
  ref: 'E'.repeat(22),
  vencimento: '2026-11-10',
  valorCentavos: null,
  vencida: false,
}
const URL_BOLETO = 'https://semog.superlogica.net/clients/areadocondomino/exemplo?id=1'

function linkEsperado(mensagem: string) {
  return `${WA}?text=${encodeURIComponent(mensagem)}`
}

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
  window.history.replaceState(null, '', '/')
  acoes.solicitarCodigo.mockResolvedValue({ tipo: 'ok', reenvioEmSegundos: 60 })
  acoes.reenviarCodigo.mockResolvedValue({ tipo: 'ok', reenvioEmSegundos: 60 })
  acoes.confirmarCodigo.mockResolvedValue({ tipo: 'ok', unidades: [U1] })
  acoes.listarCobrancas.mockResolvedValue({
    tipo: 'ok',
    situacao: 'aberto',
    haRestritas: false,
    cobrancas: [A_VENCER, VENCIDA],
  })
  acoes.abrirBoleto.mockResolvedValue({ tipo: 'ok', url: URL_BOLETO })
  acoes.encerrarConsulta.mockResolvedValue(undefined)
})

const windowOpen = vi.fn()

beforeEach(() => {
  window.open = windowOpen
})

afterEach(() => {
  window.gtag = undefined
})

function dialogo(): HTMLDialogElement {
  const d = document.querySelector('dialog')
  if (!d) throw new Error('diálogo ausente')
  return d
}

async function abrirTriagem(segundaViaAtiva: boolean) {
  render(<TriagemWhatsApp whatsappHref={WA} segundaViaAtiva={segundaViaAtiva} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Falar com a Semog' }))
}

async function irAoCpf() {
  await abrirTriagem(true)
  fireEvent.click(screen.getByRole('button', { name: /Sou cliente: 2ª via e atendimento/ }))
  await screen.findByRole('heading', { name: 'Segunda via do boleto' })
}

async function irAoCodigo() {
  await irAoCpf()
  fireEvent.change(screen.getByLabelText(/^CPF/), { target: { value: CPF } })
  fireEvent.click(screen.getByRole('button', { name: 'turnstile' }))
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
  await screen.findByRole('heading', { name: 'Digite o código' })
}

async function irAosBoletos() {
  await irAoCodigo()
  fireEvent.change(screen.getByLabelText('Código'), { target: { value: '123456' } })
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar código' }))
  await screen.findByRole('heading', { name: 'Boletos em aberto' })
  await screen.findByText('Vence em 10/10/2026')
}

/** Nome dos eventos `segunda_via_*` enviados ao GA4, na ordem. */
function eventosSegundaVia() {
  return gtag.mock.calls.filter((c) => String(c[1]).startsWith('segunda_via_'))
}

describe('flag SEGUNDA_VIA_ATIVA', () => {
  it('flag desligada: "Sou cliente" continua sendo o link de WhatsApp da fase 1', async () => {
    await abrirTriagem(false)

    const cliente = screen.getByRole('link', { name: /Sou cliente: 2ª via e atendimento/ })
    expect(cliente.getAttribute('href')).toBe(
      linkEsperado('Olá! Sou cliente e quero a segunda via do boleto.'),
    )
    expect(cliente.getAttribute('data-wa-caminho')).toBe('cliente')
    expect(dialogo().classList.contains('triagem-painel--expandido')).toBe(false)
  })

  it('flag ligada: "Sou cliente" abre a tela de CPF e o diálogo ganha o estado expandido', async () => {
    await irAoCpf()

    expect(dialogo().classList.contains('triagem-painel--expandido')).toBe(true)
    expect(screen.getByText('Etapa 1 de 3')).toBeTruthy()
    expect(gtag).toHaveBeenCalledWith('event', 'triagem_caminho', { caminho: 'cliente' })
    // Voltar ao menu desfaz a expansão.
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }))
    await screen.findByRole('heading', { name: 'Como podemos ajudar?' })
    expect(dialogo().classList.contains('triagem-painel--expandido')).toBe(false)
  })
})

describe('tela do CPF', () => {
  it('valida no navegador antes de chamar a action e mascara o CPF', async () => {
    await irAoCpf()
    const campo = screen.getByLabelText(/^CPF/) as HTMLInputElement

    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    expect((await screen.findByRole('alert')).textContent).toBe('Informe seu CPF.')

    fireEvent.change(campo, { target: { value: '12345678900' } })
    expect(campo.value).toBe('123.456.789-00')
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByRole('alert').textContent).toBe('Informe um CPF válido.')

    fireEvent.change(campo, { target: { value: CPF } })
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByRole('alert').textContent).toBe('Confirme a verificação anti-robô.')
    expect(acoes.solicitarCodigo).not.toHaveBeenCalled()
  })

  it('traz o texto LGPD com a Política de Privacidade e o link do WhatsApp', async () => {
    await irAoCpf()

    expect(dialogo().textContent).toContain('O site não guarda o CPF.')
    const politica = screen.getByRole('link', { name: 'Política de Privacidade' })
    expect(politica.getAttribute('href')).toBe('/privacidade')
    const wa = screen.getByRole('link', { name: 'Prefiro falar no WhatsApp' })
    expect(wa.getAttribute('href')).toBe(
      linkEsperado('Olá! Sou cliente e quero a segunda via do boleto.'),
    )
  })

  it('anti-robô recusado no servidor mostra o erro e pede nova verificação', async () => {
    acoes.solicitarCodigo.mockResolvedValue({ tipo: 'anti_robo' })
    await irAoCpf()
    fireEvent.change(screen.getByLabelText(/^CPF/), { target: { value: CPF } })
    fireEvent.click(screen.getByRole('button', { name: 'turnstile' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    expect((await screen.findByRole('alert')).textContent).toBe('Confirme a verificação anti-robô.')
    expect(acoes.solicitarCodigo).toHaveBeenCalledWith('52998224725', 'token-de-teste')
  })
})

describe('tela do código', () => {
  it('tela do código mostra o texto fixo e nunca um e-mail, exista o CPF ou não', async () => {
    await irAoCodigo()

    expect(
      screen.getByText(
        'Se este CPF tiver cadastro conosco, enviamos um código de 6 dígitos para o e-mail cadastrado. Ele vale por 10 minutos. Pode levar até 2 minutos para chegar.',
      ),
    ).toBeTruthy()
    expect(dialogo().textContent).not.toMatch(/@|\*\*\*/)
    expect(screen.getByText('Etapa 2 de 3')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Reenviar código em \d+ s/ })).toHaveProperty(
      'disabled',
      true,
    )
    const semEmail = screen.getByRole('link', { name: 'Não tenho acesso a esse e-mail' })
    expect(semEmail.getAttribute('href')).toBe(
      linkEsperado('Olá! Sou cliente e não tenho acesso ao meu e-mail cadastrado.'),
    )
  })

  it('campo do código: autocomplete="one-time-code", inputMode numeric, aceita colar "123-456"', async () => {
    await irAoCodigo()
    const campo = screen.getByLabelText('Código') as HTMLInputElement

    expect(campo.getAttribute('autocomplete')).toBe('one-time-code')
    expect(campo.getAttribute('inputmode')).toBe('numeric')
    fireEvent.change(campo, { target: { value: '123-456' } })
    expect(campo.value).toBe('123456')
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar código' }))
    await waitFor(() => expect(acoes.confirmarCodigo).toHaveBeenCalledWith('123456'))
  })

  it('código curto não chama a action; incorreto mostra as tentativas restantes', async () => {
    acoes.confirmarCodigo.mockResolvedValue({ tipo: 'incorreto', tentativasRestantes: 2 })
    await irAoCodigo()
    const campo = screen.getByLabelText('Código')

    fireEvent.change(campo, { target: { value: '123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar código' }))
    expect(screen.getByRole('alert').textContent).toBe('O código tem 6 dígitos.')
    expect(acoes.confirmarCodigo).not.toHaveBeenCalled()

    fireEvent.change(campo, { target: { value: '654321' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar código' }))
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toBe('Código incorreto. Restam 2 tentativas.'),
    )
  })

  it.each([
    [{ tipo: 'bloqueado' }, 'Você usou as 3 tentativas. Peça um novo código.'],
    [{ tipo: 'incorreto', tentativasRestantes: 1 }, 'Código incorreto. Resta 1 tentativa.'],
  ])('erro %o mostra a mensagem da spec', async (resposta, mensagem) => {
    acoes.confirmarCodigo.mockResolvedValue(resposta)
    await irAoCodigo()
    fireEvent.change(screen.getByLabelText('Código'), { target: { value: '654321' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar código' }))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe(mensagem))
  })
})

describe('código expirado e cadastro sem unidade', () => {
  it('código expirado: texto direto e um clique em "Começar de novo" leva ao CPF vazio', async () => {
    acoes.confirmarCodigo.mockResolvedValue({ tipo: 'expirado' })
    await irAoCodigo()
    fireEvent.change(screen.getByLabelText('Código'), { target: { value: '654321' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar código' }))
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toBe(
        'Este código expirou. Comece de novo pelo CPF.',
      ),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Começar de novo' }))
    await screen.findByRole('heading', { name: 'Segunda via do boleto' })
    expect((screen.getByLabelText(/^CPF/) as HTMLInputElement).value).toBe('')
  })

  it('código aceito sem nenhuma unidade: tela de falha e evento segunda_via_falhou', async () => {
    acoes.confirmarCodigo.mockResolvedValue({ tipo: 'ok', unidades: [] })
    await irAoCodigo()
    fireEvent.change(screen.getByLabelText('Código'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar código' }))
    await screen.findByRole('heading', { name: 'Não conseguimos consultar' })
    expect(gtag).toHaveBeenCalledWith('event', 'segunda_via_falhou', {
      etapa: 'codigo',
      motivo: 'sem_unidade',
    })
  })
})

describe('unidades e boletos', () => {
  it('com duas unidades, a pessoa escolhe a unidade (Etapa 3 de 4)', async () => {
    acoes.confirmarCodigo.mockResolvedValue({ tipo: 'ok', unidades: [U1, U2] })
    await irAoCodigo()
    fireEvent.change(screen.getByLabelText('Código'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar código' }))

    await screen.findByRole('heading', { name: 'Escolha a unidade' })
    expect(screen.getByText('Etapa 3 de 4')).toBeTruthy()
    expect(
      screen.getByText('Seu CPF está ligado a mais de uma unidade. Escolha qual.'),
    ).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Casa 4/ }))

    await screen.findByRole('heading', { name: 'Boletos em aberto' })
    await waitFor(() => expect(acoes.listarCobrancas).toHaveBeenCalledWith(U2.ref))
    expect(screen.getByText('Etapa 4 de 4')).toBeTruthy()
  })

  it('lista: "Vence em 10/10/2026", valor em reais a partir de centavos, "Vencido"/"A vencer", sem competência', async () => {
    await irAosBoletos()
    const lista = screen.getByRole('list', { name: 'Boletos em aberto' })

    expect(screen.getByText(/Unidade:/).textContent).toBe(
      'Unidade: Apto 302 · Condomínio Exemplo A',
    )
    expect(within(lista).getByText('Vence em 10/10/2026')).toBeTruthy()
    expect(within(lista).getByText('Vence em 10/09/2026')).toBeTruthy()
    expect(lista.textContent?.replace(/\s/g, ' ')).toContain('R$ 450,00')
    expect(lista.textContent?.replace(/\s/g, ' ')).toContain('R$ 1.234,56')
    expect(within(lista).getByText('A vencer')).toBeTruthy()
    expect(within(lista).getByText('Vencido')).toBeTruthy()
    expect(lista.textContent).not.toMatch(
      /compet|janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro/i,
    )
  })

  it('valorCentavos null mostra "valor indisponível", nunca R$ 0,00', async () => {
    acoes.listarCobrancas.mockResolvedValue({
      tipo: 'ok',
      situacao: 'aberto',
      haRestritas: false,
      cobrancas: [SEM_VALOR],
    })
    await irAoCodigo()
    fireEvent.change(screen.getByLabelText('Código'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar código' }))

    // Ausência de dado, não um valor: fora do <strong> dos valores, com a classe do cinza.
    const indisponivel = await screen.findByText('valor indisponível')
    expect(indisponivel.tagName).toBe('SPAN')
    expect(indisponivel.classList.contains('tr-indisponivel')).toBe(true)
    expect(dialogo().textContent).not.toMatch(/R\$\s0,00/)
  })

  it('item vencido traz a nota de encargos; tela do boleto vencido traz a explicação do original', async () => {
    await irAosBoletos()
    const nota =
      'Valor de emissão. Pagando depois do vencimento, os juros e a multa entram automaticamente.'
    const itemVencido = screen.getByRole('button', { name: /10\/09\/2026/ })
    expect(itemVencido.textContent).toContain(nota)
    const itemAVencer = screen.getByRole('button', { name: /10\/10\/2026/ })
    expect(itemAVencer.textContent).not.toContain(nota)

    fireEvent.click(itemVencido)
    await screen.findByRole('heading', { name: 'Seu boleto' })
    const explicacao = screen.getByText(
      'Este boleto já venceu, mas ainda pode ser pago. Ao abrir, a página mostra o valor do dia para pagar hoje. Se preferir imprimir o boleto original, o banco também aceita e cobra os juros automaticamente.',
    )
    // Nota informativa, não erro: o alerta vermelho é só a pill "Vencido".
    const caixa = explicacao.closest('p')
    expect(caixa?.classList.contains('tr-nota-vencido')).toBe(true)
    expect(caixa?.classList.contains('tr-erro')).toBe(false)
    expect(caixa?.getAttribute('role')).toBeNull()
  })

  it('com restritas: aviso + link WhatsApp com data-wa-caminho="restrita" e a mensagem exata', async () => {
    acoes.listarCobrancas.mockResolvedValue({
      tipo: 'ok',
      situacao: 'aberto',
      haRestritas: true,
      cobrancas: [A_VENCER],
    })
    await irAosBoletos()

    expect(
      screen.getByText('Há cobranças desta unidade que precisam ser tratadas com a equipe.'),
    ).toBeTruthy()
    const link = screen.getByRole('link', { name: /Falar com a equipe no WhatsApp/ })
    expect(link.getAttribute('data-wa-caminho')).toBe('restrita')
    expect(link.getAttribute('href')).toBe(
      linkEsperado('Olá! Sou cliente e preciso tratar de cobranças com a equipe.'),
    )
  })

  it('sem boletos: texto de não-quitação; indeterminado: "não conseguimos consultar", nunca "sem boletos"', async () => {
    acoes.listarCobrancas.mockResolvedValueOnce({
      tipo: 'ok',
      situacao: 'indeterminado',
      haRestritas: false,
      cobrancas: [],
    })
    await irAoCodigo()
    fireEvent.change(screen.getByLabelText('Código'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar código' }))

    expect(
      await screen.findByText(
        'Não conseguimos consultar os boletos agora. Tente de novo em alguns minutos ou fale com a equipe.',
      ),
    ).toBeTruthy()
    expect(dialogo().textContent).not.toContain('Não encontramos boletos')

    acoes.listarCobrancas.mockResolvedValueOnce({
      tipo: 'ok',
      situacao: 'sem_aberto',
      haRestritas: false,
      cobrancas: [],
    })
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(
      await screen.findByText('Não encontramos boletos em aberto para esta unidade.'),
    ).toBeTruthy()
    expect(
      screen.getByText(
        'Isso não é uma declaração de quitação. Para confirmar a situação da unidade, fale com a equipe.',
      ),
    ).toBeTruthy()
  })
})

describe('tela do boleto', () => {
  it('"Abrir boleto" abre nova aba sem opener nem referrer e o aviso de não encaminhar está junto', async () => {
    await irAosBoletos()
    fireEvent.click(screen.getByRole('button', { name: /10\/10\/2026/ }))
    await screen.findByRole('heading', { name: 'Seu boleto' })

    const abrir = await screen.findByRole('button', { name: 'Abrir boleto' })
    expect(acoes.abrirBoleto).toHaveBeenCalledWith(U1.ref, A_VENCER.ref)
    const bloco = abrir.closest('.tr-acoes')
    expect(bloco?.textContent).toContain(
      'Este link abre o boleto com seus dados pessoais. Não encaminhe para outras pessoas.',
    )
    fireEvent.click(abrir)
    expect(windowOpen).toHaveBeenCalledWith(URL_BOLETO, '_blank', 'noopener,noreferrer')
  })

  it('a URL do boleto (credencial) não aparece em nenhum lugar do DOM', async () => {
    await irAosBoletos()
    fireEvent.click(screen.getByRole('button', { name: /10\/10\/2026/ }))
    await screen.findByRole('button', { name: 'Abrir boleto' })

    const html = document.documentElement.outerHTML
    expect(html).not.toContain(URL_BOLETO)
    expect(html).not.toContain('areadocondomino/exemplo')
  })

  it('sem lista depois da cobrança sumir, o aviso não promete "lista atualizada"', async () => {
    acoes.abrirBoleto.mockResolvedValue({ tipo: 'cobranca_indisponivel' })
    await irAosBoletos()
    acoes.listarCobrancas.mockResolvedValue({
      tipo: 'ok',
      situacao: 'sem_aberto',
      haRestritas: false,
      cobrancas: [],
    })
    fireEvent.click(screen.getByRole('button', { name: /10\/10\/2026/ }))

    await screen.findByText('Não encontramos boletos em aberto para esta unidade.')
    expect(screen.getByRole('status').textContent).toBe('Este boleto não está mais disponível.')
  })

  it('cobrança indisponível volta à lista, avisa e reconsulta (nunca fica em "carregando")', async () => {
    acoes.abrirBoleto.mockResolvedValue({ tipo: 'cobranca_indisponivel' })
    await irAosBoletos()
    expect(acoes.listarCobrancas).toHaveBeenCalledTimes(1)
    acoes.listarCobrancas.mockResolvedValue({
      tipo: 'ok',
      situacao: 'aberto',
      haRestritas: false,
      cobrancas: [VENCIDA],
    })
    fireEvent.click(screen.getByRole('button', { name: /10\/10\/2026/ }))

    await screen.findByRole('heading', { name: 'Boletos em aberto' })
    await waitFor(() => expect(acoes.listarCobrancas).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('Vence em 10/09/2026')).toBeTruthy()
    expect(screen.queryByText('Vence em 10/10/2026')).toBeNull()
    expect(screen.getByText(/Este boleto não está mais disponível/).textContent).toBe(
      'Este boleto não está mais disponível. Mostramos a lista atualizada.',
    )
  })
})

describe('consulta expirada e falhas', () => {
  it('cookie de sessão ausente (sessao_invalida) leva a "consulta expirou" e recomeça pelo CPF', async () => {
    acoes.listarCobrancas.mockResolvedValue({ tipo: 'sessao_invalida' })
    await irAoCodigo()
    fireEvent.change(screen.getByLabelText('Código'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar código' }))

    expect(
      await screen.findByText('Por segurança, sua consulta expirou. Comece de novo.'),
    ).toBeTruthy()
    expect(gtag).toHaveBeenCalledWith('event', 'segunda_via_falhou', {
      etapa: 'boletos',
      motivo: 'sessao',
    })
    fireEvent.click(screen.getByRole('button', { name: 'Começar de novo' }))
    await screen.findByRole('heading', { name: 'Segunda via do boleto' })
    expect((screen.getByLabelText(/^CPF/) as HTMLInputElement).value).toBe('')
  })

  it('app fora do ar: "não conseguimos consultar" + WhatsApp, motivo indisponivel', async () => {
    acoes.solicitarCodigo.mockResolvedValue({ tipo: 'indisponivel' })
    await irAoCpf()
    fireEvent.change(screen.getByLabelText(/^CPF/), { target: { value: CPF } })
    fireEvent.click(screen.getByRole('button', { name: 'turnstile' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    await screen.findByRole('heading', { name: 'Não conseguimos consultar' })
    const wa = screen.getByRole('link', { name: /Falar no WhatsApp/ })
    expect(wa.getAttribute('href')).toBe(
      linkEsperado('Olá! Sou cliente e quero a segunda via do boleto.'),
    )
    expect(gtag).toHaveBeenCalledWith('event', 'segunda_via_falhou', {
      etapa: 'cpf',
      motivo: 'indisponivel',
    })
  })

  it('action que lança (rede) vai para a falha, sem tela em branco', async () => {
    acoes.solicitarCodigo.mockRejectedValue(new Error('rede'))
    const erro = vi.spyOn(console, 'error').mockImplementation(() => {})
    await irAoCpf()
    fireEvent.change(screen.getByLabelText(/^CPF/), { target: { value: CPF } })
    fireEvent.click(screen.getByRole('button', { name: 'turnstile' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    await screen.findByRole('heading', { name: 'Não conseguimos consultar' })
    expect(erro).toHaveBeenCalled()
    erro.mockRestore()
  })

  it('flag desligada no meio do fluxo (desligada) vai para a falha com WhatsApp', async () => {
    acoes.confirmarCodigo.mockResolvedValue({ tipo: 'desligada' })
    await irAoCodigo()
    fireEvent.change(screen.getByLabelText('Código'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar código' }))
    await screen.findByRole('heading', { name: 'Não conseguimos consultar' })
  })
})

describe('respostas atrasadas e clique duplo', () => {
  it('clique duplo em "Continuar" chama a action uma vez só', async () => {
    let responder: (v: unknown) => void = () => {}
    acoes.solicitarCodigo.mockReturnValue(new Promise((r) => (responder = r)))
    await irAoCpf()
    fireEvent.change(screen.getByLabelText(/^CPF/), { target: { value: CPF } })
    fireEvent.click(screen.getByRole('button', { name: 'turnstile' }))
    const continuar = screen.getByRole('button', { name: 'Continuar' })
    fireEvent.click(continuar)
    fireEvent.click(continuar)

    expect(acoes.solicitarCodigo).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Verificando…' })).toBeTruthy()
    await act(async () => responder({ tipo: 'ok', reenvioEmSegundos: 60 }))
    await screen.findByRole('heading', { name: 'Digite o código' })
  })

  it('resposta que chega depois de fechar a triagem é descartada e encerra a sessão', async () => {
    let responder: (v: unknown) => void = () => {}
    acoes.confirmarCodigo.mockReturnValue(new Promise((r) => (responder = r)))
    await irAoCodigo()
    fireEvent.change(screen.getByLabelText('Código'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar código' }))
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    await waitFor(() => expect(acoes.encerrarConsulta).toHaveBeenCalledTimes(1))

    await act(async () => responder({ tipo: 'ok', unidades: [U1] }))
    expect(screen.queryByRole('heading', { name: 'Boletos em aberto' })).toBeNull()
    expect(acoes.listarCobrancas).not.toHaveBeenCalled()
    // O "ok" atrasado gravou o cookie de sessão: a sessão é encerrada de novo.
    await waitFor(() => expect(acoes.encerrarConsulta).toHaveBeenCalledTimes(2))
    expect(eventosSegundaVia().map((c) => c[1])).not.toContain('segunda_via_codigo_validado')
  })
})

describe('consulta nova depois de fechar', () => {
  it('resposta atrasada não encerra a consulta que começou depois dela', async () => {
    let responder: (v: unknown) => void = () => {}
    acoes.confirmarCodigo.mockReturnValueOnce(new Promise((r) => (responder = r)))
    await irAoCodigo()
    fireEvent.change(screen.getByLabelText('Código'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar código' }))
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    await waitFor(() => expect(acoes.encerrarConsulta).toHaveBeenCalledTimes(1))

    // A pessoa reabre e começa outra consulta antes de a resposta velha chegar.
    fireEvent.click(screen.getByRole('button', { name: 'Falar com a Semog' }))
    fireEvent.click(screen.getByRole('button', { name: /Sou cliente: 2ª via e atendimento/ }))
    await screen.findByRole('heading', { name: 'Segunda via do boleto' })

    await act(async () => responder({ tipo: 'ok', unidades: [U1] }))
    expect(acoes.encerrarConsulta).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('heading', { name: 'Segunda via do boleto' })).toBeTruthy()
  })

  it('Voltar da tela do CPF fica desabilitado com o pedido do código em voo', async () => {
    let responder: (v: unknown) => void = () => {}
    acoes.solicitarCodigo.mockReturnValue(new Promise((r) => (responder = r)))
    await irAoCpf()
    expect(screen.getByRole('button', { name: 'Voltar' })).toHaveProperty('disabled', false)
    fireEvent.change(screen.getByLabelText(/^CPF/), { target: { value: CPF } })
    fireEvent.click(screen.getByRole('button', { name: 'turnstile' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(screen.getByRole('button', { name: 'Voltar' })).toHaveProperty('disabled', true)
    await act(async () => responder({ tipo: 'ok', reenvioEmSegundos: 60 }))
    await screen.findByRole('heading', { name: 'Digite o código' })
  })
})

describe('fechar, acessibilidade e medição', () => {
  it('fechar o diálogo chama encerrarConsulta e limpa o estado', async () => {
    await irAosBoletos()
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    await waitFor(() => expect(acoes.encerrarConsulta).toHaveBeenCalledTimes(1))

    fireEvent.click(screen.getByRole('button', { name: 'Falar com a Semog' }))
    expect(screen.getByRole('heading', { name: 'Como podemos ajudar?' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Sou cliente: 2ª via e atendimento/ }))
    await screen.findByRole('heading', { name: 'Segunda via do boleto' })
    expect((screen.getByLabelText(/^CPF/) as HTMLInputElement).value).toBe('')
  })

  it('fechar sem ter entrado na 2ª via não chama encerrarConsulta', async () => {
    await abrirTriagem(true)
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(acoes.encerrarConsulta).not.toHaveBeenCalled()
  })

  it('o diálogo inteiro tem data-clarity-mask="true"', async () => {
    await irAosBoletos()
    expect(dialogo().getAttribute('data-clarity-mask')).toBe('true')
  })

  it('GA4: cada evento dispara uma vez por ação e nenhum parâmetro contém CPF, unidade, valor ou URL', async () => {
    acoes.listarCobrancas.mockResolvedValue({
      tipo: 'ok',
      situacao: 'aberto',
      haRestritas: true,
      cobrancas: [A_VENCER, VENCIDA],
    })
    await irAosBoletos()
    fireEvent.click(screen.getByRole('button', { name: /10\/09\/2026/ }))
    fireEvent.click(await screen.findByRole('button', { name: 'Abrir boleto' }))

    expect(eventosSegundaVia()).toEqual([
      ['event', 'segunda_via_solicitada'],
      ['event', 'segunda_via_codigo_validado', { unidades: 'uma' }],
      ['event', 'segunda_via_restrita'],
      ['event', 'segunda_via_boleto_aberto', { vencida: true }],
    ])
    const tudo = JSON.stringify(gtag.mock.calls)
    for (const proibido of [
      '52998224725',
      '529.982',
      'Apto 302',
      'Exemplo A',
      '1234',
      '450',
      'superlogica',
      U1.ref,
      A_VENCER.ref,
    ]) {
      expect(tudo).not.toContain(proibido)
    }
  })

  it('sem boleto registra segunda_via_sem_boleto uma vez', async () => {
    acoes.listarCobrancas.mockResolvedValue({
      tipo: 'ok',
      situacao: 'sem_aberto',
      haRestritas: false,
      cobrancas: [],
    })
    await irAoCodigo()
    fireEvent.change(screen.getByLabelText('Código'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar código' }))
    await screen.findByText('Não encontramos boletos em aberto para esta unidade.')

    const nomes = eventosSegundaVia().map((c) => c[1])
    expect(nomes.filter((n) => n === 'segunda_via_sem_boleto')).toHaveLength(1)
  })

  it('aria-live anuncia erros; título recebe foco a cada troca de tela', async () => {
    acoes.confirmarCodigo.mockResolvedValueOnce({ tipo: 'incorreto', tentativasRestantes: 2 })
    await irAoCodigo()
    expect(document.activeElement?.textContent).toBe('Digite o código')

    fireEvent.change(screen.getByLabelText('Código'), { target: { value: '654321' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar código' }))
    const alerta = await screen.findByRole('alert')
    expect(alerta.textContent).toBe('Código incorreto. Restam 2 tentativas.')

    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }))
    await screen.findByRole('heading', { name: 'Segunda via do boleto' })
    await waitFor(() => expect(document.activeElement?.textContent).toBe('Segunda via do boleto'))
  })
})
