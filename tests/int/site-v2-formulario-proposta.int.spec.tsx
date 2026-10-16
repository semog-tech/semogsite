import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MENSAGENS } from '@/lib/propostaDuasEtapas/schema'

const etapa1Mock = vi.fn()
const etapa2Mock = vi.fn()
const completaMock = vi.fn()
const captureExceptionMock = vi.fn()
const gtag = vi.fn()

vi.mock('@/app/(site)/_actions/proposta-duas-etapas', () => ({
  enviarEtapa1: (...a: unknown[]) => etapa1Mock(...a),
  enviarEtapa2: (...a: unknown[]) => etapa2Mock(...a),
  enviarPropostaCompleta: (...a: unknown[]) => completaMock(...a),
}))
vi.mock('@/components/forms/Turnstile', () => ({
  Turnstile: ({ onToken }: { onToken: (t: string) => void }) => (
    <button type="button" onClick={() => onToken('token-teste')}>
      verificação
    </button>
  ),
}))
vi.mock('@/site/formularios/proposta/cortina', () => ({
  trocarEtapa: () => ({ progress: () => undefined }),
}))
vi.mock('@sentry/nextjs', () => ({
  captureException: (...a: unknown[]) => captureExceptionMock(...a),
}))

const { FormularioProposta } = await import('@/site/formularios/proposta/FormularioProposta')
const { TEXTOS } = await import('@/site/formularios/proposta/textos')

function montar() {
  const { container } = render(<FormularioProposta id="teste" />)
  const form = container.querySelector('form')
  if (!form) throw new Error('sem form')
  return { container, form }
}
function etapaAtiva(form: HTMLFormElement) {
  return form.getAttribute('data-etapa-ativa')
}
function preencherEtapa1(uf = 'PB') {
  fireEvent.change(screen.getByLabelText('Nome do condomínio'), { target: { value: 'Aurora' } })
  fireEvent.change(screen.getByLabelText('Estado'), { target: { value: uf } })
  fireEvent.change(screen.getByLabelText('Telefone com DDD'), { target: { value: '83999501388' } })
}
async function chegarNaEtapa2(form: HTMLFormElement, uf = 'PB') {
  etapa1Mock.mockResolvedValue({ ok: true, etapa: 1 })
  fireEvent.click(screen.getByText('verificação'))
  preencherEtapa1(uf)
  fireEvent.click(screen.getByRole('button', { name: /Continuar/ }))
  await waitFor(() => expect(etapaAtiva(form)).toBe('2'))
}
function preencherEtapa2() {
  fireEvent.change(screen.getByLabelText('Seu nome'), { target: { value: 'Maria' } })
  fireEvent.click(screen.getByLabelText('João Pessoa'))
  fireEvent.click(screen.getByLabelText('Síndico'))
  fireEvent.click(screen.getByLabelText('Não'))
}
function eventos(nome: string) {
  return gtag.mock.calls.filter(([tipo, evento]) => tipo === 'event' && evento === nome)
}

beforeEach(() => {
  vi.resetAllMocks()
  window.gtag = gtag
  window.history.replaceState({}, '', '/previa-v2')
})
afterEach(() => {
  window.gtag = undefined
})

describe('formulário de proposta em duas etapas (site v2)', () => {
  it('etapa 1 vazia mostra as mensagens do protótipo e não chama o servidor', () => {
    montar()
    fireEvent.click(screen.getByText('verificação'))
    fireEvent.click(screen.getByRole('button', { name: /Continuar/ }))
    expect(screen.getByText(MENSAGENS.condominio)).toBeTruthy()
    expect(screen.getByText(MENSAGENS.uf)).toBeTruthy()
    expect(screen.getByText(MENSAGENS.telefoneVazio)).toBeTruthy()
    expect(etapa1Mock).not.toHaveBeenCalled()
  })

  it('sem o token do Turnstile ainda, não envia e pede para aguardar', () => {
    montar()
    preencherEtapa1()
    fireEvent.click(screen.getByRole('button', { name: /Continuar/ }))
    expect(screen.getByText(TEXTOS.aguardeVerificacao)).toBeTruthy()
    expect(etapa1Mock).not.toHaveBeenCalled()
  })

  it('etapa 1 válida envia com o token, dispara generate_lead uma vez e passa à etapa 2 (R11)', async () => {
    const { form } = montar()
    await chegarNaEtapa2(form)
    expect(etapa1Mock).toHaveBeenCalledWith(
      { nomeCondominio: 'Aurora', uf: 'PB', telefone: '(83) 99950-1388', email: '' },
      'token-teste',
    )
    expect(eventos('generate_lead')).toHaveLength(1)
    expect(eventos('generate_lead')[0]?.[2]).toMatchObject({
      form: 'proposta',
      variante: 'duas_etapas',
    })
  })

  it('duplo clique em Continuar chama o servidor uma vez só (Review Focus)', async () => {
    let liberar: (r: unknown) => void = () => undefined
    etapa1Mock.mockImplementation(
      () =>
        new Promise((r) => {
          liberar = r
        }),
    )
    const { form } = montar()
    fireEvent.click(screen.getByText('verificação'))
    preencherEtapa1()
    const botao = screen.getByRole('button', { name: /Continuar/ })
    fireEvent.click(botao)
    fireEvent.click(botao)
    expect(etapa1Mock).toHaveBeenCalledTimes(1)
    await act(async () => liberar({ ok: true, etapa: 1 }))
    expect(etapaAtiva(form)).toBe('2')
  })

  it('cidade da etapa 2 segue a UF (D2): PB lista as Unidades e "Outra cidade" abre o texto', async () => {
    const { form } = montar()
    await chegarNaEtapa2(form, 'PB')
    expect(screen.getByLabelText('João Pessoa')).toBeTruthy()
    expect(screen.getByLabelText('Campina Grande')).toBeTruthy()
    expect(screen.queryByLabelText(/Qual cidade/)).toBeNull()
    fireEvent.click(screen.getByLabelText('Outra cidade'))
    expect(screen.getByLabelText(/Qual cidade/)).toBeTruthy()
  })

  it('UF sem Unidade mostra só o campo de texto', async () => {
    const { form } = montar()
    await chegarNaEtapa2(form, 'SP')
    expect(screen.queryByLabelText('Outra cidade')).toBeNull()
    expect(screen.getByLabelText(/^Cidade/)).toBeTruthy()
  })

  it('voltar e reenviar a etapa 1 não pede Turnstile nem repete generate_lead; trocar a UF limpa a cidade', async () => {
    const { form } = montar()
    await chegarNaEtapa2(form, 'PB')
    fireEvent.click(screen.getByLabelText('Campina Grande'))
    fireEvent.click(screen.getByRole('button', { name: /Voltar/ }))
    expect(etapaAtiva(form)).toBe('1')
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'PE' } })
    fireEvent.click(screen.getByRole('button', { name: /Continuar/ }))
    await waitFor(() => expect(etapaAtiva(form)).toBe('2'))
    expect(etapa1Mock).toHaveBeenLastCalledWith(expect.objectContaining({ uf: 'PE' }), null)
    expect(eventos('generate_lead')).toHaveLength(1)
    expect(screen.getByLabelText('Recife')).toBeTruthy()
    expect((screen.getByLabelText('Recife') as HTMLInputElement).checked).toBe(false)
  })

  it('etapa 2 concluída mostra o sucesso e dispara lead_qualificado', async () => {
    const { form } = montar()
    await chegarNaEtapa2(form)
    etapa2Mock.mockResolvedValue({ ok: true, etapa: 2 })
    preencherEtapa2()
    fireEvent.click(screen.getByRole('button', { name: /Pedir proposta/ }))
    await waitFor(() => expect(screen.getByText(TEXTOS.sucessoTitulo)).toBeTruthy())
    expect(etapa2Mock).toHaveBeenCalledWith({
      nome: 'Maria',
      perfil: 'sindico',
      cidade: 'João Pessoa',
      unidades: '',
      cliente: 'nao',
    })
    expect(eventos('lead_qualificado')).toHaveLength(1)
    expect(eventos('lead_qualificado')[0]?.[2]).toMatchObject({
      form: 'proposta',
      variante: 'duas_etapas',
      cliente: 'nao',
    })
    expect(form.hidden).toBe(true)
  })

  it('etapa 2 sem escolher a cidade da lista pede a cidade', async () => {
    const { form } = montar()
    await chegarNaEtapa2(form)
    fireEvent.change(screen.getByLabelText('Seu nome'), { target: { value: 'Maria' } })
    fireEvent.click(screen.getByLabelText('Síndico'))
    fireEvent.click(screen.getByLabelText('Não'))
    fireEvent.click(screen.getByRole('button', { name: /Pedir proposta/ }))
    expect(screen.getByText(MENSAGENS.cidade)).toBeTruthy()
    expect(etapa2Mock).not.toHaveBeenCalled()
  })

  it('token perdido: precisa_verificar mostra o Turnstile e reenvia as duas etapas juntas (R5)', async () => {
    const { form } = montar()
    await chegarNaEtapa2(form)
    etapa2Mock.mockResolvedValue({ ok: false, motivo: 'precisa_verificar' })
    completaMock.mockResolvedValue({ ok: true, etapa: 2 })
    preencherEtapa2()
    fireEvent.click(screen.getByRole('button', { name: /Pedir proposta/ }))
    await waitFor(() => expect(screen.getByText(TEXTOS.precisaVerificar)).toBeTruthy())
    fireEvent.click(screen.getByText('verificação'))
    await waitFor(() => expect(screen.getByText(TEXTOS.sucessoTitulo)).toBeTruthy())
    expect(completaMock).toHaveBeenCalledWith(
      {
        nomeCondominio: 'Aurora',
        uf: 'PB',
        telefone: '(83) 99950-1388',
        email: '',
        nome: 'Maria',
        perfil: 'sindico',
        cidade: 'João Pessoa',
        unidades: '',
        cliente: 'nao',
      },
      'token-teste',
    )
  })

  it('falha de gravação mostra os telefones da Unidade da UF e tenta de novo, sem WhatsApp (R8)', async () => {
    etapa1Mock.mockResolvedValue({ ok: false, motivo: 'falha', mensagem: 'x' })
    const { container } = montar()
    fireEvent.click(screen.getByText('verificação'))
    preencherEtapa1('PE')
    fireEvent.click(screen.getByRole('button', { name: /Continuar/ }))
    const alerta = await screen.findByRole('alert')
    expect(alerta.textContent).toContain('(81) 3316-0265')
    expect(alerta.textContent).not.toContain('(91)')
    expect(container.innerHTML).not.toContain('wa.me')
    fireEvent.click(screen.getByRole('button', { name: TEXTOS.tentarDeNovo }))
    await waitFor(() => expect(etapa1Mock).toHaveBeenCalledTimes(2))
    expect(etapa1Mock.mock.calls[1]?.[1]).toBeNull()
  })

  it('action que lança (deploy novo com aba aberta) vira a tela de falha e vai ao Sentry (Review Focus)', async () => {
    etapa1Mock.mockRejectedValue(new Error('Failed to find Server Action'))
    montar()
    fireEvent.click(screen.getByText('verificação'))
    preencherEtapa1()
    fireEvent.click(screen.getByRole('button', { name: /Continuar/ }))
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(captureExceptionMock).toHaveBeenCalledTimes(1)
  })

  it('depois de falha, "Continuar" pede verificação nova em vez de travar em "aguarde" (verificação final)', async () => {
    etapa1Mock.mockResolvedValueOnce({ ok: false, motivo: 'falha', mensagem: 'x' })
    montar()
    fireEvent.click(screen.getByText('verificação'))
    preencherEtapa1()
    fireEvent.click(screen.getByRole('button', { name: /Continuar/ }))
    await screen.findByRole('alert')
    etapa1Mock.mockResolvedValue({ ok: true, etapa: 1 })
    fireEvent.change(screen.getByLabelText('Nome do condomínio'), {
      target: { value: 'Aurora II' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Continuar/ }))
    expect(screen.queryByText(TEXTOS.aguardeVerificacao)).toBeNull()
    expect(screen.getByText(TEXTOS.precisaVerificar)).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(etapa1Mock).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByText('verificação'))
    await waitFor(() => expect(etapa1Mock).toHaveBeenCalledTimes(2))
    expect(etapa1Mock.mock.calls[1]).toEqual([
      expect.objectContaining({ nomeCondominio: 'Aurora II' }),
      'token-teste',
    ])
  })

  it('depois de recusa do Turnstile, idem: "Continuar" mostra um widget novo', async () => {
    etapa1Mock.mockResolvedValueOnce({ ok: false, motivo: 'recusado', mensagem: 'Recusado.' })
    montar()
    fireEvent.click(screen.getByText('verificação'))
    preencherEtapa1()
    fireEvent.click(screen.getByRole('button', { name: /Continuar/ }))
    await screen.findByText('Recusado.')
    fireEvent.click(screen.getByRole('button', { name: /Continuar/ }))
    expect(screen.queryByText(TEXTOS.aguardeVerificacao)).toBeNull()
    expect(screen.getByText(TEXTOS.precisaVerificar)).toBeTruthy()
    expect(screen.getAllByText('verificação')).toHaveLength(1)
  })

  it('"aguarde a verificação" some assim que o token chega', () => {
    montar()
    preencherEtapa1()
    fireEvent.click(screen.getByRole('button', { name: /Continuar/ }))
    expect(screen.getByText(TEXTOS.aguardeVerificacao)).toBeTruthy()
    fireEvent.click(screen.getByText('verificação'))
    expect(screen.queryByText(TEXTOS.aguardeVerificacao)).toBeNull()
  })

  it('a falha leva o foco ao título do bloco de falha, não ao documento', async () => {
    etapa1Mock.mockResolvedValue({ ok: false, motivo: 'falha', mensagem: 'x' })
    montar()
    fireEvent.click(screen.getByText('verificação'))
    preencherEtapa1()
    fireEvent.click(screen.getByRole('button', { name: /Continuar/ }))
    await screen.findByRole('alert')
    expect(document.activeElement?.textContent).toBe(TEXTOS.falhaTitulo)
    expect(document.activeElement?.closest('[role="alert"]')).toBeTruthy()
  })

  it('o erro de um campo some quando ele fica válido; o dos outros fica', async () => {
    const { form } = montar()
    await chegarNaEtapa2(form)
    fireEvent.click(screen.getByRole('button', { name: /Pedir proposta/ }))
    expect(screen.getByText(MENSAGENS.cidade)).toBeTruthy()
    expect(screen.getByText(MENSAGENS.nome)).toBeTruthy()
    fireEvent.click(screen.getByLabelText('João Pessoa'))
    expect(screen.queryByText(MENSAGENS.cidade)).toBeNull()
    expect(screen.getByText(MENSAGENS.nome)).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Seu nome'), { target: { value: 'Maria' } })
    expect(screen.queryByText(MENSAGENS.nome)).toBeNull()
    expect(screen.getByText(MENSAGENS.perfil)).toBeTruthy()
  })

  it('na etapa 1, corrigir o telefone apaga o erro dele sem criar erro nos campos intocados', () => {
    montar()
    fireEvent.click(screen.getByText('verificação'))
    fireEvent.change(screen.getByLabelText('Telefone com DDD'), { target: { value: '8399' } })
    fireEvent.click(screen.getByRole('button', { name: /Continuar/ }))
    expect(screen.getByText(MENSAGENS.telefoneIncompleto)).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Telefone com DDD'), {
      target: { value: '83999501388' },
    })
    expect(screen.queryByText(MENSAGENS.telefoneIncompleto)).toBeNull()
    expect(screen.getByText(MENSAGENS.condominio)).toBeTruthy()
  })

  it('?perfil=construtora pré-marca a etapa 2 (spec 4.1)', () => {
    window.history.replaceState({}, '', '/previa-v2?perfil=construtora')
    montar()
    expect((screen.getByLabelText('Construtora') as HTMLInputElement).checked).toBe(true)
  })

  it('a máscara formata o telefone e aceita colar com +55', () => {
    montar()
    const campo = screen.getByLabelText('Telefone com DDD') as HTMLInputElement
    fireEvent.change(campo, { target: { value: '+55 83 99950-1388' } })
    expect(campo.value).toBe('(83) 99950-1388')
  })
})
