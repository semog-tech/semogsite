// Probe MANUAL — escreve no Exact de produção. Rodar só com OK do dono:
//   pnpm exec tsx --env-file=../semogapp/.env.api scripts/probe-exact-create-lead.ts
//
// Cria um lead marcado como teste com o MESMO payload que `src/lib/exact`
// monta, mostra como o Exact gravou cada campo, cria o contato principal e
// descarta o lead no fim.
//
// RESULTADO (2026-07-29) — o PDF da API mente em três pontos:
//
// 1. O endpoint NÃO é `POST /Leads` (404). É `POST /LeadsAdd` (contato:
//    `POST /PersonsAdd`). A lista de EntitySets de escrita sai do `/$metadata`.
//
// 2. O corpo é ANINHADO, não plano — `LeadCriacaoAtualizacaoODataDTO`:
//      { duplicityValidation: bool, validateEmail: bool, lead: { … } }
//    e dentro de `lead` (`LeadEstruturaCriacaoODataDTO`) `source`, `subSource`,
//    `industry` e `sdrEmail` são STRINGS (o texto cadastrado no Exact), não ids.
//    Só `funnelId` e `organizationId` são números. Mandar id numérico em
//    `source`/`industry` derruba tudo com 400 "dto : An error has occurred".
//
// 3. NÃO existe `customFields` no DTO de criação — mandar o campo quebra o
//    binder. E a v3 não tem endpoint pra gravar VALOR de campo personalizado
//    (`/CustomFieldsLeads` 404; `/CustomFieldsAdd` é criação de campo e recusa
//    o DTO). Isso só existia na API v2 (`api.exactsales.com.br/v2/leads`), que
//    responde 503/timeout — aparentemente desativada. Por isso unidades, papel
//    e tipo de condomínio vão na `description`.
//
// Confirmado gravando certo: `source: "Site"` (e "Anúncio"), `industry:
// "João Pessoa"`, `mktLink`, `description` multilinha com acento, `sdrEmail`,
// e o lead cai em "Entrada" do funil Padrão. `POST /LeadsAdd` devolve
// `{ "@odata.context": "…#Edm.Int32", "value": <id do lead> }`.
//
// CUIDADO: `subSource` com valor inexistente CRIA a sub-origem no tenant em vez
// de recusar (foi assim que "Landing Page" apareceu sob "Anúncio", id 176147).
//
// Limpeza: `/LeadsDelete` não aceita POST (404) — descarte via `POST /LeadsLost`.

const baseUrl = (process.env.EXACT_SPOTTER_BASE_URL ?? 'https://api.exactspotter.com/v3').replace(
  /\/$/,
  '',
)
const token = process.env.EXACT_SPOTTER_TOKEN

if (!token) {
  console.error('Falta EXACT_SPOTTER_TOKEN (use --env-file=../semogapp/.env.api)')
  process.exit(1)
}

const SDR = process.env.EXACT_SDR_EMAIL || 'daiane@semog.com.br'
const TELEFONE_TESTE = '83999990009'

async function call(path: string, method: 'GET' | 'POST', body?: unknown) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { token_exact: token as string, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let parsed: unknown = text.slice(0, 400)
  try {
    parsed = text ? JSON.parse(text) : null
  } catch {
    /* resposta não-JSON: fica o texto cru */
  }
  return { status: res.status, body: parsed }
}

async function main() {
  const criacao = await call('/LeadsAdd', 'POST', {
    duplicityValidation: false,
    validateEmail: false,
    lead: {
      name: '[TESTE API — IGNORAR] Condomínio Probe',
      sdrEmail: SDR,
      funnelId: 24653,
      source: 'Site',
      industry: 'João Pessoa',
      ddiPhone: '55',
      phone: TELEFONE_TESTE,
      mktLink: 'https://semog.com.br/administradora-de-condominios-joao-pessoa',
      description: [
        'Probe automatizado. Descartar.',
        'Informado no site — papel: Síndico(a) · tipo: Condomínio residencial · unidades: 84',
        'Canal (origem): Busca orgânica (google)',
      ].join('\n'),
    },
  })
  console.log('POST /LeadsAdd →', criacao.status, JSON.stringify(criacao.body).slice(0, 300))

  const leadId = (criacao.body as { value?: number })?.value
  if (typeof leadId !== 'number') {
    console.error('Não veio id na resposta — abortando.')
    process.exit(2)
  }

  const pessoa = await call('/PersonsAdd', 'POST', {
    leadId,
    name: 'Fulano Probe',
    email: 'probe@example.com',
    jobTitle: 'Síndico(a)',
    ddiPhone1: '55',
    phone1: TELEFONE_TESTE,
    mainContact: true,
  })
  console.log('POST /PersonsAdd →', pessoa.status, JSON.stringify(pessoa.body).slice(0, 200))

  const lido = await call(`/Leads?$filter=id eq ${leadId}&$top=1`, 'GET')
  const lead = (lido.body as { value?: Array<Record<string, unknown>> }).value?.[0]
  console.log('\n=== como o Exact gravou ===')
  console.log(JSON.stringify(lead, null, 2).slice(0, 2000))

  const contatos = await call(`/Persons?$filter=leadId eq ${leadId}`, 'GET')
  console.log(
    '\ncontatos:',
    JSON.stringify((contatos.body as { value?: unknown[] }).value).slice(0, 500),
  )

  const descarte = await call('/LeadsLost', 'POST', {
    leadId,
    userEmail: SDR,
    reason: 'Descarte automático via API',
  })
  console.log(`\nLead de teste ${leadId} descartado → ${descarte.status}`)
}

main().catch((e) => {
  console.error('probe falhou:', e)
  process.exit(1)
})
