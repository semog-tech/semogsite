import { render } from '@react-email/render'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { limparAfterCrm, rodarAfterCrm } from './helpers/afterCrm'
import { respostaComLotacao } from './helpers/lotacaoExperience'
import { configurarRd } from './helpers/rdstation'

/**
 * O braço `b` do teste A/B das landings envia só nome, WhatsApp e condomínio
 * (opcional), com a cidade da landing oculta. Requisito do comercial para o RD:
 * no mínimo nome, telefone ou e-mail, e a Unidade. Aqui o envio passa de verdade
 * pelo schema e pela action (`submitPropostaRapida`), e o `data` que ela entrega
 * ao CRM é o mesmo que alimenta o mapa do RD (`negocioRd`/`contatoRd`) — que
 * precisa sair com telefone e `unidade_semog`. Mesmos dublês de
 * `proposta-rapida.int.spec.ts`.
 */

const queryMock = vi.fn()
const sendMailMock = vi.fn()
const verifyTurnstileMock = vi.fn()
const headersMock = vi.fn()
const cookiesMock = vi.fn()
const pushLeadMock = vi.fn()

vi.mock('server-only', () => ({}))
vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/server')>()),
  after: (await import('./helpers/afterCrm')).agendarAfterCrm,
}))
vi.mock('@/lib/crm/send-lead', () => ({
  enviarLeadAoCrm: (...args: unknown[]) => pushLeadMock(...args),
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

const actions = await import('@/app/(frontend)/_actions/submit-form')
const { configRd } = await import('@/lib/crm/rdstation/config')
const { contatoRd, negocioRd } = await import('@/lib/crm/rdstation/map-lead')
const { mapLead } = await import('@/lib/exact/map-lead')
const { propostaRapidaSchema, propostaSchema } = await import('@/lib/form-schemas')
const { CITY_LANDINGS } = await import('@/data/cityLandings')

/** O que o `PropostaCurtaForm` manda numa landing de Recife. */
const envioB = {
  nome: 'Maria Souza',
  telefone: '+5581999501388',
  nomeCondominio: '',
  cidade: 'Recife e região',
  testeFormulario: 'b',
}

let ipSeq = 0
function proximoIp() {
  ipSeq += 1
  return { get: (name: string) => (name === 'x-forwarded-for' ? `198.51.100.${ipSeq}` : null) }
}

function insert(): [string, unknown[]] {
  const chamada = queryMock.mock.calls.find(([sql]) =>
    /insert into cms\.leads/i.test(sql as string),
  )
  if (!chamada) throw new Error('nenhum INSERT em cms.leads')
  return chamada as [string, unknown[]]
}

beforeEach(() => {
  vi.resetAllMocks()
  limparAfterCrm()
  queryMock.mockImplementation(async (sql: string) => respostaComLotacao(sql, '321'))
  sendMailMock.mockResolvedValue({ ok: true })
  verifyTurnstileMock.mockResolvedValue(true)
  cookiesMock.mockResolvedValue({ get: () => undefined })
  pushLeadMock.mockResolvedValue({ ok: true })
  headersMock.mockResolvedValue(proximoIp())
})
afterEach(() => {
  vi.unstubAllEnvs()
})

describe('schemas aceitam a variante do teste e só ela', () => {
  it('a e b passam; outro valor é recusado; ausente continua valendo (triagem, outras páginas)', () => {
    expect(propostaRapidaSchema.safeParse(envioB).success).toBe(true)
    expect(propostaRapidaSchema.safeParse({ ...envioB, testeFormulario: 'c' }).success).toBe(false)
    const { testeFormulario: _, ...semTeste } = envioB
    expect(propostaRapidaSchema.safeParse(semTeste).success).toBe(true)

    const completa = {
      tipo: 'Condomínio residencial',
      nome: 'Maria Souza',
      email: 'maria@exemplo.com.br',
      telefone: '+5581999501388',
      cidade: 'Recife e região',
    }
    const r = propostaSchema.safeParse({ ...completa, testeFormulario: 'a' })
    expect(r.success && r.data.testeFormulario).toBe('a')
    expect(propostaSchema.safeParse({ ...completa, testeFormulario: 'x' }).success).toBe(false)
  })
})

describe('envio do braço b', () => {
  it('grava a variante na linha do lead, como proposta', async () => {
    const result = await actions.submitPropostaRapida(envioB, 'token')
    await rodarAfterCrm()

    expect(result.ok).toBe(true)
    const [, params] = insert()
    expect(params[0]).toBe('proposta')
    expect(params[1]).toMatchObject({
      nome: 'Maria Souza',
      telefone: '+5581999501388',
      cidade: 'Recife e região',
      testeFormulario: 'b',
    })
  })

  /**
   * As quatro landings, com a cidade que cada uma põe no hidden
   * (`CITY_LANDINGS[…].cidadeNoFormulario`), a Unidade que o RD deve receber
   * (o mapa de `.env.example`, o mesmo de produção) e o comercial que recebe o
   * e-mail (`PROPOSTA_CIDADE_TO` em `submit-form.ts`).
   */
  const PRACAS = [
    { landing: 'recife', unidade: 'Recife', para: ['ivan@semog.com.br'] },
    { landing: 'joao-pessoa', unidade: 'João Pessoa', para: ['comercial.pb@semog.com.br'] },
    { landing: 'campina-grande', unidade: 'Campina Grande', para: ['comercial.pb@semog.com.br'] },
    { landing: 'belem', unidade: 'Belém', para: ['galvao@semog.com.br'] },
  ] as const

  it('cobre as quatro landings de cidade', () => {
    expect(Object.keys(CITY_LANDINGS).sort()).toEqual(PRACAS.map((p) => p.landing).sort())
  })

  it.each(PRACAS)('$landing: chega ao RD com nome, telefone e unidade_semog $unidade', async ({
    landing,
    unidade,
  }) => {
    configurarRd()
    vi.stubEnv(
      'RD_CRM_UNIDADES_POR_CIDADE',
      JSON.stringify({
        'Recife e região': 'Recife',
        'João Pessoa e região': 'João Pessoa',
        'Campina Grande e região': 'Campina Grande',
        'Belém e região': 'Belém',
      }),
    )
    const cidade = CITY_LANDINGS[landing].cidadeNoFormulario
    await actions.submitPropostaRapida({ ...envioB, cidade }, 'token')
    await rodarAfterCrm()

    expect(pushLeadMock).toHaveBeenCalledTimes(1)
    const [formType, data, leadId] = pushLeadMock.mock.calls[0] as [
      'proposta',
      Record<string, string>,
      string,
    ]
    expect(formType).toBe('proposta')
    expect(leadId).toBe('321')
    expect(data.cidade).toBe(cidade)

    const contato = contatoRd(data)
    expect(contato.name).toBe('Maria Souza')
    expect(contato.phones).toEqual([{ phone: '+5581999501388', type: 'mobile' }])
    expect(contato.emails).toEqual([])

    const negocio = negocioRd(formType, data, leadId, configRd())
    expect(negocio.custom_fields).toMatchObject({ id_lead_site: '321', unidade_semog: unidade })
    expect(String(negocio.custom_fields.dados_proposta)).toContain('testeFormulario: b')
  })

  it.each(PRACAS)('$landing: o e-mail vai a $para com nome, WhatsApp, cidade e a variante', async ({
    landing,
    para,
  }) => {
    const cidade = CITY_LANDINGS[landing].cidadeNoFormulario
    await actions.submitPropostaRapida({ ...envioB, cidade }, 'token')
    await rodarAfterCrm()

    expect(sendMailMock).toHaveBeenCalledTimes(1)
    const [mail] = sendMailMock.mock.calls[0] as [{ to: string[]; react: React.ReactElement }]
    expect(mail.to).toEqual(para)
    const texto = await render(mail.react, { plainText: true })
    expect(texto).toContain('Maria Souza')
    expect(texto).toContain('+5581999501388')
    expect(texto).toContain(cidade)
    expect(texto).toContain('Teste A/B do formulário (variante)')
  })

  it('no Exact a origem diz que veio da landing, não do botão de WhatsApp', async () => {
    await actions.submitPropostaRapida(envioB, 'token')
    await rodarAfterCrm()

    const [, data] = pushLeadMock.mock.calls[0] as [string, Record<string, string>]
    const { lead } = mapLead('proposta', data, 'sdr@example.com')
    expect(lead.description).toContain('formulário curto da landing de cidade (teste A/B)')
    expect(lead.description).not.toContain('botão de WhatsApp')
    expect(lead.description).toContain('sem e-mail nem tipo')
  })

  it('no Exact, com condomínio informado, a origem não diz que veio só com nome e WhatsApp', async () => {
    await actions.submitPropostaRapida({ ...envioB, nomeCondominio: 'Ed. Aurora' }, 'token')
    await rodarAfterCrm()

    const [, data] = pushLeadMock.mock.calls[0] as [string, Record<string, string>]
    expect(data.nomeCondominio).toBe('Ed. Aurora')
    const { lead } = mapLead('proposta', data, 'sdr@example.com')
    expect(lead.description).not.toMatch(/só com nome/)
    expect(lead.description).toContain('se informado, condomínio')
  })

  it('Turnstile recusado não grava nada (as proteções valem para o b)', async () => {
    verifyTurnstileMock.mockResolvedValue(false)
    const result = await actions.submitPropostaRapida(envioB, 'token')

    expect(result.ok).toBe(false)
    expect(queryMock.mock.calls.some(([sql]) => /insert into cms\.leads/i.test(sql))).toBe(false)
  })
})

describe('envio do braço a', () => {
  it('grava testeFormulario a na linha do lead', async () => {
    const result = await actions.submitForm(
      'proposta',
      {
        tipo: 'Condomínio residencial',
        nome: 'Maria Souza',
        email: 'maria@exemplo.com.br',
        telefone: '+5581999501388',
        cidade: 'Recife e região',
        testeFormulario: 'a',
      },
      'token',
    )
    await rodarAfterCrm()

    expect(result.ok).toBe(true)
    const [, params] = insert()
    expect(params[1]).toMatchObject({ testeFormulario: 'a', email: 'maria@exemplo.com.br' })
  })
})
