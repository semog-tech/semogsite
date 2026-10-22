import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isExactEligible } from '@/lib/exact/map-lead'
import { GCLID_FIELD, TIPO_CLIQUE_FIELD } from '@/lib/forms'
import { CANAL_INDISPONIVEL, resolverOrigem } from '@/lib/origemDoLead'
import { FORMATO_DO_PROTOCOLO } from '@/lib/protocolo'

/**
 * As duas correções de 22/10/2026 no pipeline de `submit-form.ts`:
 *
 * 1. **Origem do lead** — cookie quando existe; senão o que o navegador manda
 *    junto do envio, validado; senão uma marca explícita de indisponível (o
 *    lead 218, do Instagram no iOS, foi gravado sem nenhuma linha de origem).
 * 2. **Proposta curta duplicada** — mesmo telefone de uma proposta das últimas
 *    24 h: grava ligada à anterior, sem card no Exact e sem e-mail interno
 *    (leads 220 e 221, dois cards para a mesma pessoa).
 *
 * Mesmos dublês de `submit-form.int.spec.ts`; o banco aqui é uma tabela em
 * memória que aplica o corte de data da consulta, para que "fora de 24 h" seja
 * decidido pelo código e não pelo dublê.
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

const { submitForm, submitPropostaRapida } = await import('@/app/(frontend)/_actions/submit-form')

const FONTE = 'origem — Origem lida de'
const CANAL = 'origem — Canal (origem)'

/** IP diferente por chamada: o rate limit em memória sobrevive entre os `it`. */
let ipSeq = 0
function proximoIp() {
  ipSeq += 1
  return { get: (name: string) => (name === 'x-forwarded-for' ? `192.0.2.${ipSeq}` : null) }
}

/** Cookie `semog-attrib` como o `AttributionTracker` grava (JSON em `encodeURIComponent`). */
function comCookieDeAtribuicao(valor: unknown) {
  const cru = encodeURIComponent(JSON.stringify(valor))
  return { get: (nome: string) => (nome === 'semog-attrib' ? { value: cru } : undefined) }
}
const semCookie = { get: () => undefined }

type LinhaFalsa = { id: string; created_at: string; form: string; data: Record<string, string> }
let tabela: LinhaFalsa[] = []

/**
 * Banco em memória para o SELECT de duplicidade. Cada filtro só vale se o SQL
 * o pede: o dublê não pode aplicar por conta própria a regra que o teste confere.
 */
function bancoFalso(sql: string, params: unknown[] = []) {
  if (/insert into cms\.leads/i.test(sql)) return { rows: [{ id: '500' }], rowCount: 1 }
  if (/select id, data->>'telefone'/i.test(sql)) {
    const corte = new Date(String(params[0])).getTime()
    const soProposta = /form = 'proposta'/.test(sql)
    const semDuplicadas = /data->>'duplicaDe' is null/.test(sql)
    const rows = tabela
      .filter((l) => !soProposta || l.form === 'proposta')
      .filter((l) => !semDuplicadas || !l.data.duplicaDe)
      .filter((l) => /created_at > \$1/.test(sql) && new Date(l.created_at).getTime() > corte)
      .map((l) => ({
        id: l.id,
        telefone: l.data.telefone ?? null,
        // Só devolve as colunas que o SQL pede: sem elas, a comparação falha.
        ...(/data->>'cidade' as cidade/.test(sql) ? { cidade: l.data.cidade ?? null } : {}),
        ...(/data->>'nomeCondominio' as nome_condominio/.test(sql)
          ? { nome_condominio: l.data.nomeCondominio ?? null }
          : {}),
      }))
    return { rows, rowCount: rows.length }
  }
  return { rows: [], rowCount: 0 }
}

/** O `data` (jsonb) do INSERT em `cms.leads`. */
function dataDoInsert(): Record<string, string> {
  const chamada = queryMock.mock.calls.find(([sql]) => /insert into cms\.leads/i.test(String(sql)))
  if (!chamada) throw new Error('nenhum INSERT em cms.leads')
  const params = chamada[1] as unknown[]
  return params[1] as Record<string, string>
}

/** As colunas do INSERT: [form, data, gclid, email, ads_consent, notificado_para]. */
function paramsDoInsert(): unknown[] {
  const chamada = queryMock.mock.calls.find(([sql]) => /insert into cms\.leads/i.test(String(sql)))
  if (!chamada) throw new Error('nenhum INSERT em cms.leads')
  return chamada[1] as unknown[]
}

const proposta = {
  tipo: 'Condomínio residencial',
  nome: 'Maria Souza',
  nomeCondominio: 'Residencial Aurora',
  email: 'maria@example.com',
  telefone: '+5591999501388',
  cidade: 'Belém e região',
}

const rapida = {
  nome: 'Maria',
  telefone: '+5583999501388',
  cidade: 'João Pessoa e região',
}

const contato = {
  nome: 'Fulano de Tal',
  email: 'fulano@example.com',
  mensagem: 'Mensagem de teste automatizado.',
}

/** O que o navegador do Instagram mandaria: home com `fbclid`. */
const doInstagram = JSON.stringify({
  first: { fbclid: 'IwAR2xYz_abc-123', landing: '/', ts: '2026-10-06T14:00:00.000Z' },
  last: { fbclid: 'IwAR2xYz_abc-123', landing: '/', ts: '2026-10-06T14:00:00.000Z' },
})

beforeEach(() => {
  vi.resetAllMocks()
  tabela = []
  queryMock.mockImplementation(async (sql: string, params?: unknown[]) => bancoFalso(sql, params))
  sendMailMock.mockResolvedValue({ ok: true })
  verifyTurnstileMock.mockResolvedValue(true)
  cookiesMock.mockResolvedValue(semCookie)
  pushLeadMock.mockResolvedValue({ ok: true, exactLeadId: 777 })
  headersMock.mockImplementation(async () => proximoIp())
})

describe('origem do lead — cookie, campo do navegador ou marca de indisponível', () => {
  it('cookie presente: usa o cookie e ignora o campo do navegador', async () => {
    cookiesMock.mockResolvedValue(
      comCookieDeAtribuicao({
        first: { source: 'google', medium: 'organic', landing: '/contato' },
        last: { source: 'google', medium: 'organic', landing: '/contato' },
      }),
    )

    const r = await submitForm('proposta', proposta, 'token', doInstagram)

    expect(r.ok).toBe(true)
    const data = dataDoInsert()
    expect(data[CANAL]).toBe('Busca orgânica (google)')
    expect(data['origem — Página de entrada']).toBe('/contato')
    expect(data[FONTE]).toBe('cookie do site')
  })

  it.each([
    ['proposta completa', () => submitForm('proposta', proposta, 'token', doInstagram)],
    ['contato', () => submitForm('contato', contato, 'token', doInstagram)],
    ['proposta rápida', () => submitPropostaRapida(rapida, 'token', doInstagram)],
  ])('cookie ausente: %s usa o campo do navegador', async (_nome, enviar) => {
    const r = await enviar()

    expect(r.ok).toBe(true)
    const data = dataDoInsert()
    expect(data[CANAL]).toBe('Redes sociais (Meta)')
    expect(data['origem — Página de entrada']).toBe('/')
    expect(data[FONTE]).toBe('dados do navegador enviados com o formulário')
  })

  it('campo malicioso: cada valor fora da regra é descartado, o válido ao lado fica', async () => {
    const malicioso = JSON.stringify({
      first: {
        fbclid: 'IwAR-valido_1',
        campaign: '<script>alert(1)</script>',
        source: 'a'.repeat(201),
        gclid: 'abc"; drop table cms.leads; --',
        referrer: 'javascript:alert(1)',
        landing: 'https://evil.example/phish',
        ts: 'ontem',
        extra: 'campo que não existe',
      },
      last: { __proto__: { gclid: 'herdado' } },
    })

    const r = await submitForm('proposta', proposta, 'token', malicioso)

    expect(r.ok).toBe(true)
    const data = dataDoInsert()
    expect(data[CANAL]).toBe('Redes sociais (Meta)')
    expect(data[FONTE]).toBe('dados do navegador enviados com o formulário')
    expect(data[GCLID_FIELD]).toBeUndefined()
    expect(paramsDoInsert()[2]).toBeNull() // coluna gclid
    expect(data['origem — Campanha']).toBeUndefined()
    expect(data['origem — Página de entrada']).toBeUndefined()
    expect(data['origem — Veio do site']).toBeUndefined()
    expect(JSON.stringify(data)).not.toMatch(/script|drop table|evil|herdado|extra/)
  })

  it.each([
    ['JSON inválido', '{"first": '],
    [
      'acima do teto de tamanho',
      JSON.stringify({ first: { fbclid: 'a' }, lixo: 'x'.repeat(9000) }),
    ],
    ['não é string', { first: { fbclid: 'IwAR-valido' } }],
    ['nenhum campo válido', JSON.stringify({ first: { gclid: '<img src=x>' } })],
    ['array', JSON.stringify([{ fbclid: 'IwAR' }])],
  ])('campo recusado (%s) vira origem indisponível', async (_caso, campo) => {
    const r = await submitForm('proposta', proposta, 'token', campo)

    expect(r.ok).toBe(true)
    expect(dataDoInsert()[CANAL]).toBe(CANAL_INDISPONIVEL)
  })

  it('nenhum dos dois: grava a marca explícita, nunca vazio', async () => {
    const r = await submitForm('proposta', proposta, 'token')

    expect(r.ok).toBe(true)
    const data = dataDoInsert()
    expect(data[CANAL]).toBe(CANAL_INDISPONIVEL)
    expect(data[FONTE]).toBe('nenhuma fonte')
    // A marca vai também ao e-mail interno, na seção de origem.
    const notificacao = sendMailMock.mock.calls[0]?.[0] as { react: { props: unknown } }
    expect(JSON.stringify(notificacao.react.props)).toContain(CANAL_INDISPONIVEL)
  })

  it('cookie corrompido conta como ausente e cai para o campo do navegador', async () => {
    cookiesMock.mockResolvedValue({
      get: (nome: string) => (nome === 'semog-attrib' ? { value: '%E0%A4%A' } : undefined),
    })

    await submitForm('proposta', proposta, 'token', doInstagram)

    expect(dataDoInsert()[FONTE]).toBe('dados do navegador enviados com o formulário')
  })
})

describe('gbraid e wbraid guardam o tipo do clique', () => {
  it.each([
    ['gbraid', { gbraid: '0AAAAAo-gbraid_x' }],
    ['wbraid', { wbraid: 'CkQKCAjw-wbraid_y' }],
  ])('%s: valor na coluna gclid e o tipo em campo próprio', async (tipo, clique) => {
    const toque = { ...clique, landing: '/' }
    cookiesMock.mockResolvedValue(comCookieDeAtribuicao({ first: toque, last: toque }))

    await submitForm('proposta', proposta, 'token')

    const valor = Object.values(clique)[0]
    const data = dataDoInsert()
    expect(data[GCLID_FIELD]).toBe(valor)
    expect(data[TIPO_CLIQUE_FIELD]).toBe(tipo)
    expect(data[CANAL]).toBe('Google Ads (tráfego pago)')
    expect(paramsDoInsert()[2]).toBe(valor)
  })

  it('gclid não ganha a linha de tipo (ausente = gclid, como os leads antigos)', async () => {
    const toque = { gclid: 'Cj0KCQjw-gclid', gbraid: '0AAAA-gbraid', landing: '/' }
    cookiesMock.mockResolvedValue(comCookieDeAtribuicao({ first: toque, last: toque }))

    await submitForm('proposta', proposta, 'token')

    expect(dataDoInsert()[GCLID_FIELD]).toBe('Cj0KCQjw-gclid')
    expect(dataDoInsert()[TIPO_CLIQUE_FIELD]).toBeUndefined()
  })

  it('gbraid chega também pelo campo do navegador, quando falta o cookie', () => {
    const toque = { wbraid: 'CkQKCAjw-wbraid_y', landing: '/' }
    const origem = resolverOrigem(undefined, JSON.stringify({ first: toque, last: toque }))
    expect(origem.fonte).toBe('navegador')
    expect(origem.atribuicao?.first.wbraid).toBe('CkQKCAjw-wbraid_y')
  })
})

describe('proposta rápida duplicada', () => {
  const agora = Date.now()
  const horasAtras = (h: number) => new Date(agora - h * 60 * 60 * 1000).toISOString()

  function anterior(telefone: string, criadaHa: number, extra: Record<string, string> = {}) {
    tabela.push({
      id: '220',
      created_at: horasAtras(criadaHa),
      form: 'proposta',
      data: { nome: 'Maria Souza', telefone, cidade: rapida.cidade, ...extra },
    })
  }

  it('dentro de 24 h: grava ligada à anterior, sem Exact e sem e-mail, com o protocolo novo', async () => {
    anterior('+5583999501388', 0.05)

    const r = await submitPropostaRapida(rapida, 'token', doInstagram)

    expect(r).toMatchObject({ ok: true, message: 'Recebemos sua mensagem!' })
    expect(r.protocolo).toMatch(FORMATO_DO_PROTOCOLO)
    const data = dataDoInsert()
    expect(data.duplicaDe).toBe('220')
    expect(data.protocolo).toBe(r.protocolo)
    expect(data.variante).toBe('contato-rapido')
    expect(pushLeadMock).not.toHaveBeenCalled()
    expect(sendMailMock).not.toHaveBeenCalled()
    expect(r).not.toHaveProperty('duplicada')
  })

  it('mesma cidade e condomínio vazio na curta: é duplicada e notificado_para fica nulo', async () => {
    anterior('+5583999501388', 2, { nomeCondominio: 'Residencial Aurora' })

    await submitPropostaRapida(rapida, 'token')

    expect(dataDoInsert().duplicaDe).toBe('220')
    // [form, data, gclid, email, ads_consent, notificado_para]: nenhum e-mail saiu.
    expect(paramsDoInsert()[5]).toBeNull()
    expect(sendMailMock).not.toHaveBeenCalled()
  })

  it('lead novo continua gravando a quem foi notificado', async () => {
    await submitPropostaRapida(rapida, 'token')

    expect(paramsDoInsert()[5]).toBe('comercial.pb@semog.com.br')
  })

  it('mesmo telefone em OUTRA cidade é pedido novo (síndico com dois condomínios)', async () => {
    anterior('+5583999501388', 1, { cidade: 'Recife e região' })

    await submitPropostaRapida({ ...rapida, cidade: 'Belém e região' }, 'token')

    expect(dataDoInsert().duplicaDe).toBeUndefined()
    expect(pushLeadMock).toHaveBeenCalledTimes(1)
    expect(sendMailMock).toHaveBeenCalled()
    expect(paramsDoInsert()[5]).toBe('galvao@semog.com.br')
  })

  it('mesma cidade com condomínio DIFERENTE é pedido novo', async () => {
    anterior('+5583999501388', 1, { nomeCondominio: 'Residencial Mar Azul' })

    await submitPropostaRapida({ ...rapida, nomeCondominio: 'Edifício Aurora' }, 'token')

    expect(dataDoInsert().duplicaDe).toBeUndefined()
    expect(pushLeadMock).toHaveBeenCalledTimes(1)
  })

  it('mesmo condomínio escrito sem acento e em outra caixa é duplicada', async () => {
    anterior('+5583999501388', 1, { nomeCondominio: 'Edifício  Aurora' })

    await submitPropostaRapida({ ...rapida, nomeCondominio: 'EDIFICIO aurora' }, 'token')

    expect(dataDoInsert().duplicaDe).toBe('220')
    expect(pushLeadMock).not.toHaveBeenCalled()
  })

  it('curta com condomínio e anterior sem condomínio não é duplicada', async () => {
    anterior('+5583999501388', 1)

    await submitPropostaRapida({ ...rapida, nomeCondominio: 'Edifício Aurora' }, 'token')

    expect(dataDoInsert().duplicaDe).toBeUndefined()
  })

  it('fora de 24 h: segue como lead novo, com card e e-mail', async () => {
    anterior('+5583999501388', 25)

    const r = await submitPropostaRapida(rapida, 'token')

    expect(r.ok).toBe(true)
    expect(dataDoInsert().duplicaDe).toBeUndefined()
    expect(pushLeadMock).toHaveBeenCalledTimes(1)
    expect(sendMailMock).toHaveBeenCalled()
  })

  it.each([
    '+55 (83) 99950-1388',
    '(83) 99950-1388',
    '83999501388',
    '5583999501388',
    '+55 83 9 9950 1388',
  ])('telefone gravado como %s é o mesmo de +5583999501388', async (gravado) => {
    anterior(gravado, 1)

    await submitPropostaRapida(rapida, 'token')

    expect(dataDoInsert().duplicaDe).toBe('220')
    expect(pushLeadMock).not.toHaveBeenCalled()
  })

  it('telefone diferente não é duplicada', async () => {
    anterior('+5583999501399', 1)

    await submitPropostaRapida(rapida, 'token')

    expect(dataDoInsert().duplicaDe).toBeUndefined()
    expect(pushLeadMock).toHaveBeenCalledTimes(1)
  })

  it('anterior que já era duplicada não é alvo: a ligação aponta para o lead original', async () => {
    anterior('+5583999501388', 1, { duplicaDe: '219' })

    await submitPropostaRapida(rapida, 'token')

    expect(dataDoInsert().duplicaDe).toBeUndefined()
  })

  it('falha da busca não barra o envio: segue como lead novo', async () => {
    queryMock.mockImplementation(async (sql: string, params?: unknown[]) => {
      if (/select id, data->>'telefone'/i.test(sql)) throw new Error('timeout')
      return bancoFalso(sql, params)
    })

    const r = await submitPropostaRapida(rapida, 'token')

    expect(r.ok).toBe(true)
    expect(dataDoInsert().duplicaDe).toBeUndefined()
    expect(pushLeadMock).toHaveBeenCalledTimes(1)
  })

  it('a busca só roda depois do Turnstile', async () => {
    verifyTurnstileMock.mockResolvedValue(false)

    const r = await submitPropostaRapida(rapida, 'token')

    expect(r.ok).toBe(false)
    expect(queryMock).not.toHaveBeenCalled()
  })

  it('proposta completa não é deduplicada (só a curta)', async () => {
    anterior('+5591999501388', 1)

    await submitForm('proposta', proposta, 'token')

    expect(dataDoInsert().duplicaDe).toBeUndefined()
    expect(pushLeadMock).toHaveBeenCalledTimes(1)
  })

  it('duplicada não é elegível ao Exact, nem pelo cron de retry', () => {
    expect(isExactEligible('proposta', { duplicaDe: '220' })).toBe(false)
    expect(isExactEligible('proposta', {})).toBe(true)
  })
})
