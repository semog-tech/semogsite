import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mapLead } from '@/lib/exact/map-lead'
import { propostaRapidaSchema } from '@/lib/form-schemas'
import { FORMATO_DO_PROTOCOLO, gerarProtocolo } from '@/lib/protocolo'
import { respostaComLotacao } from './helpers/lotacaoExperience'

/**
 * Proposta curta ("contato rápido") da triagem do botão de WhatsApp. O que se
 * defende aqui é a decisão central da spec: ela NÃO é um formulário novo. Grava
 * como `form = 'proposta'` pelo mesmo pipeline, para seguir nos crons do Exact e
 * do Ads e nos botões de desfecho, e se distingue só pelo `data.variante` e
 * pelo `protocolo`. Mesmos dublês de `submit-form.int.spec.ts`.
 */

const queryMock = vi.fn()
const sendMailMock = vi.fn()
const verifyTurnstileMock = vi.fn()
const headersMock = vi.fn()
const cookiesMock = vi.fn()
const pushLeadMock = vi.fn()

vi.mock('server-only', () => ({}))
vi.mock('@/lib/exact/push-lead', () => ({
  pushLeadToExact: (...args: unknown[]) => pushLeadMock(...args),
}))
vi.mock('@/lib/db', () => ({ query: (...args: unknown[]) => queryMock(...args) }))
vi.mock('@/lib/sendgrid', () => ({ sendMail: (...args: unknown[]) => sendMailMock(...args) }))
vi.mock('@/lib/turnstile', () => ({
  verifyTurnstile: (...args: unknown[]) => verifyTurnstileMock(...args),
}))
vi.mock('next/headers', () => ({
  headers: (...args: unknown[]) => headersMock(...args),
  cookies: (...args: unknown[]) => cookiesMock(...args),
}))

const { submitPropostaRapida } = await import('@/app/(frontend)/_actions/submit-form')

const valida = {
  nome: 'Maria Souza',
  telefone: '+5581999501388',
  nomeCondominio: 'Residencial Aurora',
  cidade: 'Recife e região',
}

/** IP diferente por teste: o rate limit em memória sobrevive entre os `it`. */
let ipSeq = 0
function proximoIp() {
  ipSeq += 1
  return { get: (name: string) => (name === 'x-forwarded-for' ? `198.51.100.${ipSeq}` : null) }
}

/** O INSERT em `cms.leads` (a primeira query de uma proposta). */
function insert(): [string, unknown[]] {
  const chamada = queryMock.mock.calls.find(([sql]) =>
    /insert into cms\.leads/i.test(sql as string),
  )
  if (!chamada) throw new Error('nenhum INSERT em cms.leads')
  return chamada as [string, unknown[]]
}

describe('propostaRapidaSchema', () => {
  it('aceita só nome, WhatsApp, condomínio opcional e cidade', () => {
    expect(propostaRapidaSchema.safeParse(valida).success).toBe(true)
    const { nomeCondominio: _, ...semCondominio } = valida
    expect(propostaRapidaSchema.safeParse(semCondominio).success).toBe(true)
  })

  it('não exige tipo nem e-mail, que o formulário completo exige', () => {
    const r = propostaRapidaSchema.safeParse(valida)
    expect(r.success && Object.keys(r.data).sort()).toEqual([
      'cidade',
      'nome',
      'nomeCondominio',
      'telefone',
    ])
  })

  it.each([
    [{ ...valida, nome: '  ' }, 'nome', 'Informe seu nome.'],
    [{ ...valida, telefone: '' }, 'telefone', 'Informe seu WhatsApp.'],
    [{ ...valida, telefone: '+55819' }, 'telefone', 'Informe um WhatsApp válido.'],
    [{ ...valida, cidade: '' }, 'cidade', 'Selecione a cidade do condomínio.'],
    [{ ...valida, cidade: 'Fortaleza' }, 'cidade', 'Selecione a cidade do condomínio.'],
  ])('recusa %o com a mensagem da spec', (entrada, campo, mensagem) => {
    const r = propostaRapidaSchema.safeParse(entrada)
    expect(r.success).toBe(false)
    const issue = r.error?.issues.find((i) => i.path[0] === campo)
    expect(issue?.message).toBe(mensagem)
  })

  it('limita nome e condomínio a 120 caracteres', () => {
    const longo = 'a'.repeat(121)
    expect(propostaRapidaSchema.safeParse({ ...valida, nome: longo }).success).toBe(false)
    expect(propostaRapidaSchema.safeParse({ ...valida, nomeCondominio: longo }).success).toBe(false)
  })
})

describe('gerarProtocolo', () => {
  it('sai no formato SG- + 6 caracteres de Crockford, sem I, L, O nem U', () => {
    for (let i = 0; i < 500; i++) {
      const protocolo = gerarProtocolo()
      expect(protocolo).toMatch(FORMATO_DO_PROTOCOLO)
      expect(protocolo.slice(3)).not.toMatch(/[ILOU]/)
    }
  })

  it('não repete em sequência (é aleatório, não contador)', () => {
    const vistos = new Set(Array.from({ length: 200 }, () => gerarProtocolo()))
    expect(vistos.size).toBe(200)
  })
})

describe('submitPropostaRapida', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    queryMock.mockImplementation(async (sql: string) => respostaComLotacao(sql, '321'))
    sendMailMock.mockResolvedValue({ ok: true })
    verifyTurnstileMock.mockResolvedValue(true)
    cookiesMock.mockResolvedValue({ get: () => undefined })
    pushLeadMock.mockResolvedValue({ ok: true, exactLeadId: 777 })
    headersMock.mockResolvedValue(proximoIp())
  })

  it('grava como form proposta, com variante, protocolo e e-mail nulo', async () => {
    const result = await submitPropostaRapida(valida, 'token')

    expect(result.ok).toBe(true)
    expect(result.protocolo).toMatch(FORMATO_DO_PROTOCOLO)

    const [, params] = insert()
    expect(params[0]).toBe('proposta')
    expect(params[1]).toMatchObject({
      nome: 'Maria Souza',
      telefone: '+5581999501388',
      cidade: 'Recife e região',
      variante: 'contato-rapido',
      protocolo: result.protocolo,
    })
    // coluna `email` de cms.leads
    expect(params[3]).toBeNull()
  })

  it('entrega ao Exact como proposta, com o mesmo protocolo da tela', async () => {
    const result = await submitPropostaRapida(valida, 'token')

    expect(pushLeadMock).toHaveBeenCalledTimes(1)
    const [formType, data] = pushLeadMock.mock.calls[0] as [string, Record<string, string>]
    expect(formType).toBe('proposta')
    expect(data.variante).toBe('contato-rapido')
    expect(data.protocolo).toBe(result.protocolo)

    // E o que o Exact recebe diz à SDR de onde veio — o mesmo `data` que o cron
    // `push-exact-leads` relê do banco no retry.
    const { lead } = mapLead('proposta', data, 'sdr@example.com')
    expect(lead.description).toContain(
      `Origem: contato rápido pelo botão de WhatsApp do site. Protocolo ${result.protocolo}.`,
    )
    expect(lead.description).not.toContain('Origem: formulário de proposta do site.')
  })

  it('notifica a praça da cidade, com protocolo e desfecho; não tenta auto-reply sem e-mail', async () => {
    vi.stubEnv('LEAD_OUTCOME_SECRET', 'segredo-de-teste')
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    const result = await submitPropostaRapida(valida, 'token')

    expect(sendMailMock).toHaveBeenCalledTimes(1)
    expect(JSON.stringify(sendMailMock.mock.calls[0])).toContain('desfecho/321?t=')
    vi.unstubAllEnvs()
    const [mail] = sendMailMock.mock.calls[0] as [{ to: string[]; subject: string }]
    expect(mail.to).toEqual(['ivan@semog.com.br'])
    expect(mail.subject).toBe('Novo contato via Proposta (contato rápido)')
    expect(JSON.stringify(sendMailMock.mock.calls[0])).toContain(result.protocolo as string)
    expect(info).toHaveBeenCalledWith('[submit-form] lead sem e-mail — auto-reply não enviado.')
    info.mockRestore()
  })

  it('validação recusada não grava nem devolve protocolo', async () => {
    const result = await submitPropostaRapida({ ...valida, telefone: '' }, 'token')

    expect(result.ok).toBe(false)
    expect(result.errors?.telefone).toBe('Informe seu WhatsApp.')
    expect(result.protocolo).toBeUndefined()
    expect(queryMock).not.toHaveBeenCalled()
  })

  it('banco fora: falha sem protocolo — a tela nunca confirma o que não foi gravado', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    queryMock.mockRejectedValue(new Error('connection refused'))

    const result = await submitPropostaRapida(valida, 'token')

    expect(result.ok).toBe(false)
    expect(result.protocolo).toBeUndefined()
    expect(pushLeadMock).not.toHaveBeenCalled()
  })

  it('Turnstile recusado não grava', async () => {
    verifyTurnstileMock.mockResolvedValue(false)
    const result = await submitPropostaRapida(valida, 'token-invalido')

    expect(result.ok).toBe(false)
    expect(result.protocolo).toBeUndefined()
    expect(queryMock).not.toHaveBeenCalled()
  })
})
