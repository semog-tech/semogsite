import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * A trava de estado atual da página de desfecho.
 *
 * O e-mail de "Outra cidade" vai para TRÊS responsáveis com o mesmo link. Sem
 * esta parada, o segundo a abrir marcaria por cima sem saber que alguém já
 * respondeu — dois cliques concorrentes disfarçados de correção. Com ela, a
 * tela primeiro diz o que está registrado e só então oferece a mudança.
 *
 * É comportamento de tela, então o teste é de tela: a Server Action é dublê
 * aqui (a gravação tem cobertura própria em `desfecho-registrar`).
 */

const registrarMock = vi.fn(async () => ({
  ok: true as const,
  desfecho: 'fechou' as const,
  motivo: null,
}))

vi.mock('@/app/(interno)/_actions/registrar-desfecho', () => ({
  registrarDesfecho: (...args: unknown[]) => registrarMock(...(args as [])),
}))

import { FormularioDesfecho, type LeadEmAvaliacao } from '@/components/desfecho/FormularioDesfecho'

/** Lead sem desfecho — o caso do primeiro clique no e-mail. */
const NOVO: LeadEmAvaliacao = {
  id: '42',
  token: 'token-de-teste',
  desfecho: null,
  motivo: null,
  registradoEm: null,
  avisados: 1,
}

/** Lead que alguém já respondeu. */
const RESPONDIDO: LeadEmAvaliacao = {
  ...NOVO,
  desfecho: 'fechou',
  registradoEm: '16/09/2026, 14:32',
}

const opcoesDeDesfecho = () => screen.queryAllByRole('radio', { name: /em negociação/i })
const botaoConfirmar = () => screen.queryByRole('button', { name: /confirmar/i })
const botaoAlterar = () => screen.getByRole('button', { name: /alterar resposta/i })

describe('FormularioDesfecho — lead ainda sem resposta', () => {
  beforeEach(() => vi.clearAllMocks())

  it('vai direto ao formulário, sem parada intermediária', () => {
    render(<FormularioDesfecho lead={NOVO} statusInicial={null} />)

    expect(opcoesDeDesfecho()).toHaveLength(1)
    expect(botaoConfirmar()).toBeTruthy()
    expect(screen.queryByText(/já foi marcado/i)).toBeNull()
  })

  it('o status clicado no e-mail chega pré-selecionado', () => {
    render(<FormularioDesfecho lead={NOVO} statusInicial="nao_evoluiu" />)

    const escolhido = screen.getByRole('radio', { name: /não evoluiu/i }) as HTMLInputElement
    expect(escolhido.checked).toBe(true)
  })
})

describe('FormularioDesfecho — lead que já foi respondido', () => {
  beforeEach(() => vi.clearAllMocks())

  it('mostra o registro atual e NÃO oferece o formulário de cara', () => {
    render(<FormularioDesfecho lead={RESPONDIDO} statusInicial={null} />)

    expect(screen.getByText(/já foi marcado como Fechou/i)).toBeTruthy()
    expect(screen.getByText(/16\/09\/2026, 14:32/)).toBeTruthy()
    // O que torna a trava uma trava: as opções não estão na tela.
    expect(opcoesDeDesfecho()).toHaveLength(0)
    expect(botaoConfirmar()).toBeNull()
  })

  it('o status clicado no e-mail NÃO pula a parada', () => {
    // O caso concorrente é exatamente este: a pessoa clicou "Fechou" no e-mail
    // e o lead já está marcado. Se o `s` da URL fizesse o formulário aparecer
    // direto, a trava não valeria nada justamente quando importa.
    render(<FormularioDesfecho lead={RESPONDIDO} statusInicial="nao_e_lead" />)

    expect(opcoesDeDesfecho()).toHaveLength(0)
    expect(screen.getByText(/já foi marcado/i)).toBeTruthy()
  })

  it('mostra o motivo quando o registro é "não é lead"', () => {
    render(
      <FormularioDesfecho
        lead={{ ...RESPONDIDO, desfecho: 'nao_e_lead', motivo: 'segunda_via_boleto' }}
        statusInicial={null}
      />,
    )

    expect(screen.getByText(/segunda via de boleto/i)).toBeTruthy()
  })

  it('"Alterar resposta" abre o formulário, com a escolha do e-mail pré-selecionada', () => {
    render(<FormularioDesfecho lead={RESPONDIDO} statusInicial="nao_evoluiu" />)

    fireEvent.click(botaoAlterar())

    expect(opcoesDeDesfecho()).toHaveLength(1)
    const escolhido = screen.getByRole('radio', { name: /não evoluiu/i }) as HTMLInputElement
    expect(escolhido.checked).toBe(true)
    expect(screen.getByText(/substituindo o registro/i)).toBeTruthy()
  })

  it('nada é gravado só por abrir a página', () => {
    render(<FormularioDesfecho lead={RESPONDIDO} statusInicial="fechou" />)
    fireEvent.click(botaoAlterar())

    expect(registrarMock).not.toHaveBeenCalled()
  })
})

describe('FormularioDesfecho — aviso de e-mail com vários responsáveis', () => {
  beforeEach(() => vi.clearAllMocks())

  it('avisa quando o e-mail foi para mais de uma pessoa', () => {
    render(<FormularioDesfecho lead={{ ...RESPONDIDO, avisados: 3 }} statusInicial={null} />)

    expect(screen.getByText(/foi para 3 responsáveis/i)).toBeTruthy()
  })

  it('não avisa quando foi para uma caixa só — ali o autor é conhecido', () => {
    render(<FormularioDesfecho lead={{ ...RESPONDIDO, avisados: 1 }} statusInicial={null} />)

    expect(screen.queryByText(/responsáveis/i)).toBeNull()
  })

  it('lead antigo (sem o dado) não inventa um número', () => {
    // `notificado_para` é NULL nas linhas gravadas antes da coluna existir. A
    // tela cala sobre o assunto em vez de afirmar "1 responsável".
    render(<FormularioDesfecho lead={{ ...RESPONDIDO, avisados: 0 }} statusInicial={null} />)

    expect(screen.queryByText(/responsáveis/i)).toBeNull()
  })
})
