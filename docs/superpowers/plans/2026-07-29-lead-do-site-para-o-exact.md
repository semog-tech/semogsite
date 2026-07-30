# Lead do site → Exact Spotter — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** toda submissão de proposta no site vira lead no funil do Exact Spotter, sem intervenção manual.

**Architecture:** três módulos novos no `semogsite` (`client` HTTP, `map-lead` puro, `push-lead` orquestrador). A Server Action `submitForm` chama o push depois do `INSERT` em `cms.leads`, em best-effort; um cron diário reenvia o que falhou. O `semogapp` não é tocado.

**Tech Stack:** Next.js 15 (Server Actions + route handlers), `pg`, `libphonenumber-js/min`, vitest, Biome.

**Spec:** `docs/superpowers/specs/2026-07-29-lead-do-site-para-o-exact-design.md`

> **Status (2026-07-29): Tasks 1–5 executadas.** A Task 1 (probe) derrubou a
> premissa do contrato: o endpoint é `POST /LeadsAdd` com corpo aninhado em
> `{ lead: … }`, `source`/`industry` são **strings**, e **campo personalizado
> não é gravável pela v3** — unidades/papel/tipo foram todos pra `description`.
> O código implementado segue o contrato real (ver
> `scripts/probe-exact-create-lead.ts`), não os trechos das Tasks 2 e 3 abaixo,
> que estão preservados como registro do que se acreditava antes do probe.
> Falta só a Task 6 (ligar em produção).

## Global Constraints

- Base do Exact: `https://api.exactspotter.com/v3`; auth por header `token_exact: <token>`; rate limit 30 req/20 s (irrelevante no volume atual, mas não fazer loops apertados).
- Funil `24653` ("Padrão"). SDR default `daiane@semog.com.br`. Origens: `Site` **137471**, `Anúncio` **135724**. Regiões (`industry`): Campina Grande **247270**, Belém **247271**, Recife **247272**, João Pessoa **247273**. Campos personalizados: unidades **125381**, participação **125366**, tipo de condomínio **125373**.
- `duplicityValidation: false` — sempre cria.
- Elegibilidade: form `proposta` sempre; form `contato` só com `assunto === 'proposta-comercial'`.
- Sem `EXACT_SPOTTER_TOKEN` no ambiente, o push é **no-op silencioso** (previews e `next dev` não escrevem no CRM).
- Nada pode derrubar a submissão do formulário: o `INSERT` em `cms.leads` continua sendo o único passo obrigatório.
- Testes em `tests/int/*.int.spec.ts` (vitest, `pnpm run test:int`). Código em `src/`, checado com `pnpm run check` (Biome). Comentários e mensagens de commit em pt-BR, como o resto do repo.
- **Windows/CRLF:** o Biome local infla erros de fim de linha; a fonte de verdade é o CI. Rodar `pnpm run check` (que escreve) antes de commitar e ignorar ruído de CRLF.

---

### Task 1: Probe canário — descobrir o formato real do `POST /Leads`

Duas coisas não estão documentadas e precisam ser confirmadas **antes** de escrever o mapeamento: (a) `source`/`industry` no corpo do POST aceitam o **id numérico** ou a **string** do valor; (b) `customFields` recebe `{id: <id do campo>, value: <texto da opção>}` ou `{id: <id da opção>}`. E (c) se a resposta do POST devolve o `id` do lead criado.

Escreve no CRM de produção — **exige OK explícito do dono antes de rodar**. Cria um lead marcado como teste e descarta no fim.

**Files:**
- Create: `scripts/probe-exact-create-lead.ts` (fora de `src/`, execução manual, não entra no bundle)

**Interfaces:**
- Consumes: nada.
- Produces: as três respostas acima, registradas como comentário no topo do próprio script (mesmo padrão dos probes do `semogapp`, que documentam o resultado no cabeçalho).

- [ ] **Step 1: Escrever o script**

```ts
// scripts/probe-exact-create-lead.ts
//
// Probe MANUAL — escreve no Exact de produção. Rodar com OK do dono:
//   pnpm exec tsx --env-file=.env scripts/probe-exact-create-lead.ts
//
// Descobre: (1) `source`/`industry` aceitam id numérico ou string;
//           (2) formato de `customFields`;
//           (3) se o POST devolve o id do lead criado.
//
// RESULTADO (preencher após rodar):
//   ...

const baseUrl = (process.env.EXACT_SPOTTER_BASE_URL ?? 'https://api.exactspotter.com/v3').replace(/\/$/, '')
const token = process.env.EXACT_SPOTTER_TOKEN

if (!token) {
  console.error('Falta EXACT_SPOTTER_TOKEN (use --env-file=.env)')
  process.exit(1)
}

const MARCA = '[TESTE API — IGNORAR]'

async function call(path: string, method: 'GET' | 'POST', body?: unknown) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { token_exact: token as string, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let parsed: unknown = text.slice(0, 400)
  try {
    parsed = JSON.parse(text)
  } catch {
    /* resposta não-JSON: fica o texto cru */
  }
  return { status: res.status, body: parsed }
}

async function main() {
  // Tentativa A: ids numéricos + customFields {id do campo, value texto}
  const payloadA = {
    name: `${MARCA} Condomínio Probe A`,
    sdrEmail: 'daiane@semog.com.br',
    funnelId: 24653,
    duplicityValidation: false,
    source: 137471,
    industry: 247273,
    ddiPhone: '55',
    phone: '83999990001',
    description: 'Probe automatizado. Descartar.',
    customFields: [
      { id: 125381, value: '84' },
      { id: 125366, value: 'Sindico Morador' },
      { id: 125373, value: 'Residencial Vertical' },
    ],
  }
  const a = await call('/Leads', 'POST', payloadA)
  console.log('\n=== Tentativa A (ids numéricos) ===')
  console.log(JSON.stringify(a, null, 2).slice(0, 1500))

  // Tentativa B (só se A falhar): strings no lugar dos ids
  let b: Awaited<ReturnType<typeof call>> | null = null
  if (a.status >= 400) {
    const payloadB = { ...payloadA, name: `${MARCA} Condomínio Probe B`, source: 'Site', industry: 'João Pessoa' }
    b = await call('/Leads', 'POST', payloadB)
    console.log('\n=== Tentativa B (strings) ===')
    console.log(JSON.stringify(b, null, 2).slice(0, 1500))
  }

  // Achar o lead criado (confirma se o POST devolveu id ou se precisamos buscar)
  const busca = await call(`/Leads?$filter=phone1 eq '5583999990001'&$orderby=registerDate desc&$top=3`, 'GET')
  console.log('\n=== Lead criado (busca por telefone) ===')
  console.log(JSON.stringify(busca.body, null, 2).slice(0, 2500))

  const criados = ((busca.body as { value?: Array<{ id: number; lead: string }> }).value ?? [])
    .filter((l) => l.lead.includes('TESTE API'))

  // Campos personalizados como ficaram gravados
  for (const l of criados) {
    const cf = await call(`/LeadsCustomFields?$filter=leadid eq ${l.id}`, 'GET')
    console.log(`\n=== customFields do lead ${l.id} ===`)
    console.log(JSON.stringify(cf.body, null, 2).slice(0, 1500))

    // Contato principal
    const p = await call('/Persons', 'POST', {
      leadId: l.id,
      name: 'Fulano Probe',
      email: 'probe@example.com',
      jobTitle: 'Síndico(a)',
      ddiPhone1: '55',
      phone1: '83999990001',
      mainContact: true,
    })
    console.log(`=== POST /Persons lead ${l.id} → ${p.status}`, JSON.stringify(p.body).slice(0, 300))
  }

  // LIMPEZA: descarta os leads de teste
  for (const l of criados) {
    const d = await call('/LeadsLost', 'POST', {
      leadId: l.id,
      userEmail: 'daiane@semog.com.br',
      reason: 'Descarte automático via API',
    })
    console.log(`=== Descartado lead ${l.id} → ${d.status}`)
  }

  console.log('\nLeads de teste criados e descartados:', criados.map((l) => l.id))
}

main().catch((e) => {
  console.error('probe falhou:', e)
  process.exit(1)
})
```

- [ ] **Step 2: Pedir OK e rodar**

Confirmar com o dono que pode escrever no CRM. Depois, com `EXACT_SPOTTER_TOKEN` e `EXACT_SPOTTER_BASE_URL` num `.env` local (copiar do `.env.api` do `semogapp`):

Run: `pnpm exec tsx --env-file=.env scripts/probe-exact-create-lead.ts`
Expected: um `201` (ou `200`) na tentativa A ou B; o lead aparece na busca; os `customFields` voltam preenchidos; os leads de teste terminam descartados.

- [ ] **Step 3: Registrar o resultado no cabeçalho do script**

Preencher o bloco `RESULTADO` com: qual tentativa passou, formato de `customFields` que gravou certo, e se o POST devolveu o id (ou se foi preciso buscar por telefone). **As Tasks 2 e 3 dependem dessas respostas.**

- [ ] **Step 4: Conferir no Exact que não sobrou lixo**

Run: verificar em `/Leads?$filter=stage eq 'Descartado'` que os leads `[TESTE API — IGNORAR]` estão descartados (fora do pipeline ativo).

- [ ] **Step 5: Commit**

```bash
git add scripts/probe-exact-create-lead.ts
git commit -m "chore(exact): probe do POST /Leads (formato de source/industry/customFields)"
```

---

### Task 2: `map-lead.ts` — mapeamento puro do lead

Função pura, sem I/O: recebe o mesmo `jsonb` que é gravado em `cms.leads.data` (campos do form + chaves `origem — ...`) e devolve os payloads do Exact. Receber o jsonb (e não o objeto validado do Zod) é proposital: é a **única** coisa que o cron de retry tem em mãos, então os dois caminhos usam exatamente o mesmo mapeamento.

**Files:**
- Create: `src/lib/exact/map-lead.ts`
- Test: `tests/int/exact-map-lead.int.spec.ts`

**Interfaces:**
- Consumes: `FormType` de `@/lib/forms`; `GCLID_FIELD` de `@/lib/forms`; `parsePhoneNumberFromString` de `libphonenumber-js/min`.
- Produces:
  - `type ExactLeadPayload` / `type ExactPersonInput` / `type MappedLead = { lead: ExactLeadPayload; person: ExactPersonInput }`
  - `function isExactEligible(formType: FormType, data: Record<string, string>): boolean`
  - `function mapLead(formType: FormType, data: Record<string, string>, sdrEmail: string): MappedLead`

- [ ] **Step 1: Escrever os testes que falham**

```ts
// tests/int/exact-map-lead.int.spec.ts
import { describe, expect, it } from 'vitest'
import { isExactEligible, mapLead } from '@/lib/exact/map-lead'

const SDR = 'daiane@semog.com.br'

const propostaData: Record<string, string> = {
  tipo: 'Condomínio residencial',
  nome: 'Maria Souza',
  nomeCondominio: 'Residencial Aurora',
  cargo: 'Síndico(a)',
  email: 'maria@example.com',
  telefone: '+5583999501388',
  cidade: 'João Pessoa e região',
  unidades: '84',
  mensagem: 'Queremos uma proposta.',
}

describe('isExactEligible', () => {
  it('proposta é sempre elegível', () => {
    expect(isExactEligible('proposta', propostaData)).toBe(true)
  })

  it('contato só é elegível com assunto proposta-comercial', () => {
    expect(isExactEligible('contato', { assunto: 'proposta-comercial' })).toBe(true)
    expect(isExactEligible('contato', { assunto: 'segunda-via-boleto' })).toBe(false)
    expect(isExactEligible('contato', {})).toBe(false)
  })
})

describe('mapLead — lead', () => {
  it('usa o nome do condomínio como nome do lead', () => {
    expect(mapLead('proposta', propostaData, SDR).lead.name).toBe('Residencial Aurora')
  })

  it('cai no nome da pessoa quando não há condomínio', () => {
    const { lead } = mapLead('proposta', { ...propostaData, nomeCondominio: '' }, SDR)
    expect(lead.name).toBe('Maria Souza')
  })

  it('quebra o E.164 em ddi + número nacional', () => {
    const { lead } = mapLead('proposta', propostaData, SDR)
    expect(lead.ddiPhone).toBe('55')
    expect(lead.phone).toBe('83999501388')
  })

  it('telefone ausente ou inválido não vira campo vazio', () => {
    const { lead } = mapLead('proposta', { ...propostaData, telefone: '' }, SDR)
    expect(lead.ddiPhone).toBeUndefined()
    expect(lead.phone).toBeUndefined()
  })

  it('mapeia a cidade para o id de região (industry)', () => {
    expect(mapLead('proposta', propostaData, SDR).lead.industry).toBe(247273)
    expect(mapLead('proposta', { ...propostaData, cidade: 'Recife e região' }, SDR).lead.industry).toBe(247272)
  })

  it('"Outra cidade" não define industry', () => {
    const { lead } = mapLead('proposta', { ...propostaData, cidade: 'Outra cidade' }, SDR)
    expect(lead.industry).toBeUndefined()
  })

  it('lead com gclid entra como origem Anúncio', () => {
    const comGclid = { ...propostaData, 'origem — gclid (Google Ads)': 'Cj0KCQ-fake' }
    expect(mapLead('proposta', comGclid, SDR).lead.source).toBe(135724)
  })

  it('lead sem sinal de mídia paga entra como origem Site', () => {
    expect(mapLead('proposta', propostaData, SDR).lead.source).toBe(137471)
  })

  it('canal classificado como pago também entra como Anúncio', () => {
    const pago = { ...propostaData, 'origem — Canal (origem)': 'Google Ads (tráfego pago)' }
    expect(mapLead('proposta', pago, SDR).lead.source).toBe(135724)
  })

  it('página de entrada vira mktLink', () => {
    const comLanding = { ...propostaData, 'origem — Página de entrada': 'https://semog.com.br/administradora-de-condominios-joao-pessoa' }
    expect(mapLead('proposta', comLanding, SDR).lead.mktLink).toContain('joao-pessoa')
  })

  it('funil, SDR e duplicidade são fixos', () => {
    const { lead } = mapLead('proposta', propostaData, SDR)
    expect(lead.funnelId).toBe(24653)
    expect(lead.sdrEmail).toBe(SDR)
    expect(lead.duplicityValidation).toBe(false)
  })
})

describe('mapLead — campos personalizados', () => {
  it('mapeia unidades, papel e tipo', () => {
    const { lead } = mapLead('proposta', propostaData, SDR)
    expect(lead.customFields).toEqual([
      { id: 125381, value: '84' },
      { id: 125366, value: 'Sindico Morador' },
      { id: 125373, value: 'Residencial Vertical' },
    ])
  })

  it('campos ausentes não viram entrada vazia', () => {
    const { lead } = mapLead('proposta', { nome: 'X', email: 'x@y.com', tipo: '', cargo: '', unidades: '' }, SDR)
    expect(lead.customFields).toEqual([])
  })

  it('opções sem correspondência caem em Outros / Outra modalidade', () => {
    const { lead } = mapLead('proposta', { ...propostaData, cargo: 'Morador(a)', tipo: 'Associação' }, SDR)
    expect(lead.customFields).toContainEqual({ id: 125366, value: 'Condômino' })
    expect(lead.customFields).toContainEqual({ id: 125373, value: 'Outra modalidade' })
  })
})

describe('mapLead — descrição', () => {
  it('carrega a mensagem, os valores crus do site e a origem', () => {
    const comOrigem = {
      ...propostaData,
      'origem — Canal (origem)': 'Busca orgânica (google)',
      'origem — Página de entrada': 'https://semog.com.br/proposta',
    }
    const { lead } = mapLead('proposta', comOrigem, SDR)
    expect(lead.description).toContain('Queremos uma proposta.')
    expect(lead.description).toContain('Síndico(a)')
    expect(lead.description).toContain('Condomínio residencial')
    expect(lead.description).toContain('84')
    expect(lead.description).toContain('Busca orgânica (google)')
    expect(lead.description).toContain('semog.com.br/proposta')
  })

  it('form de contato leva o assunto na descrição', () => {
    const { lead } = mapLead('contato', {
      nome: 'João', email: 'j@x.com', telefone: '+5581999998888',
      assunto: 'proposta-comercial', mensagem: 'Quero proposta para 3 prédios.',
    }, SDR)
    expect(lead.name).toBe('João')
    expect(lead.description).toContain('proposta-comercial')
    expect(lead.description).toContain('3 prédios')
  })
})

describe('mapLead — contato principal', () => {
  it('monta a pessoa com cargo cru e telefone quebrado', () => {
    const { person } = mapLead('proposta', propostaData, SDR)
    expect(person).toEqual({
      name: 'Maria Souza',
      email: 'maria@example.com',
      jobTitle: 'Síndico(a)',
      ddiPhone1: '55',
      phone1: '83999501388',
      mainContact: true,
    })
  })
})
```

- [ ] **Step 2: Rodar os testes e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/exact-map-lead.int.spec.ts`
Expected: FAIL — `Failed to resolve import "@/lib/exact/map-lead"`.

- [ ] **Step 3: Implementar**

```ts
// src/lib/exact/map-lead.ts
import { parsePhoneNumberFromString } from 'libphonenumber-js/min'
import { type FormType, GCLID_FIELD } from '@/lib/forms'

/**
 * Tradução do lead do site pro vocabulário do Exact Spotter. Função **pura**:
 * a entrada é o mesmo `jsonb` gravado em `cms.leads.data` (campos do form +
 * chaves `origem — …` da atribuição), porque é tudo que o cron de retry tem em
 * mãos — assim submit e retry compartilham o mesmo mapeamento, sem depender do
 * cookie que só existe no request original.
 *
 * Ids sondados no tenant em 2026-07-29 (ver o spec em docs/superpowers/specs).
 */

const FUNIL_PADRAO = 24653
const SOURCE_SITE = 137471
const SOURCE_ANUNCIO = 135724

/** "Mercado" no Exact é usado como região comercial. */
const REGIAO_POR_CIDADE: Record<string, number> = {
  'Recife e região': 247272,
  'João Pessoa e região': 247273,
  'Campina Grande e região': 247270,
  'Belém e região': 247271,
}

const CF_UNIDADES = 125381
const CF_PARTICIPACAO = 125366
const CF_TIPO = 125373

/**
 * Mapeamento aproximado por decisão explícita (2026-07-29): as opções do site
 * não distinguem síndico morador de profissional, nem residencial vertical de
 * horizontal. O valor cru vai junto na `description` pra quem qualificar poder
 * corrigir sem ter que voltar ao e-mail.
 */
const PARTICIPACAO_POR_CARGO: Record<string, string> = {
  'Síndico(a)': 'Sindico Morador',
  'Conselheiro(a)': 'Conselheiro',
  'Morador(a)': 'Condômino',
  'Incorporador(a) / Construtora': 'Construtora',
  Outro: 'Outros',
}

const TIPO_CONDOMINIO: Record<string, string> = {
  'Condomínio residencial': 'Residencial Vertical',
  'Condomínio comercial': 'Comercial',
  Associação: 'Outra modalidade',
  Incorporadora: 'Outra modalidade',
}

const CANAL_FIELD = 'origem — Canal (origem)'
const LANDING_FIELD = 'origem — Página de entrada'

export type ExactCustomField = { id: number; value: string }

export type ExactLeadPayload = {
  name: string
  sdrEmail: string
  funnelId: number
  duplicityValidation: false
  source: number
  industry?: number
  ddiPhone?: string
  phone?: string
  mktLink?: string
  description: string
  customFields: ExactCustomField[]
}

export type ExactPersonInput = {
  name: string
  email?: string
  jobTitle?: string
  ddiPhone1?: string
  phone1?: string
  mainContact: true
}

export type MappedLead = { lead: ExactLeadPayload; person: ExactPersonInput }

/**
 * Só pedido de proposta entra no CRM. Os outros assuntos do form de Contato são
 * atendimento a quem já é cliente (2ª via, CND, acordo…) e sujariam o pipeline
 * — mesma regra que o cron do Google Ads usa pra decidir o que é captação.
 */
export function isExactEligible(formType: FormType, data: Record<string, string>): boolean {
  if (formType === 'proposta') return true
  return data.assunto === 'proposta-comercial'
}

/** `+5583999501388` → `{ ddi: '55', nacional: '83999501388' }`; `null` se não parsear. */
function splitPhone(raw: string | undefined): { ddi: string; nacional: string } | null {
  if (!raw) return null
  const parsed = parsePhoneNumberFromString(raw)
  if (!parsed) return null
  return { ddi: parsed.countryCallingCode, nacional: parsed.nationalNumber }
}

/** Tudo que veio da atribuição, em linhas legíveis pra `description`. */
function linhasDeOrigem(data: Record<string, string>): string[] {
  return Object.entries(data)
    .filter(([key, value]) => key.startsWith('origem — ') && value)
    .map(([key, value]) => `${key.replace('origem — ', '')}: ${value}`)
}

function nonEmpty(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export function mapLead(
  formType: FormType,
  data: Record<string, string>,
  sdrEmail: string,
): MappedLead {
  const phone = splitPhone(nonEmpty(data.telefone))

  // Mídia paga vira origem "Anúncio" pra Daiane ver na hora que o lead custou
  // dinheiro. O gclid cobre gclid/gbraid/wbraid (a atribuição funde os três
  // nesse rótulo); o canal classificado cobre msclkid e utm_medium=cpc.
  const pago = Boolean(nonEmpty(data[GCLID_FIELD])) || /tráfego pago/i.test(data[CANAL_FIELD] ?? '')

  const customFields: ExactCustomField[] = []
  const unidades = nonEmpty(data.unidades)
  if (unidades) customFields.push({ id: CF_UNIDADES, value: unidades })
  const participacao = PARTICIPACAO_POR_CARGO[nonEmpty(data.cargo) ?? '']
  if (participacao) customFields.push({ id: CF_PARTICIPACAO, value: participacao })
  const tipo = TIPO_CONDOMINIO[nonEmpty(data.tipo) ?? '']
  if (tipo) customFields.push({ id: CF_TIPO, value: tipo })

  // Valores CRUS do site na descrição: o mapeamento acima é aproximado de
  // propósito, então o que a pessoa realmente marcou tem que sobreviver.
  const informado = [
    nonEmpty(data.cargo) && `papel: ${data.cargo}`,
    nonEmpty(data.tipo) && `tipo: ${data.tipo}`,
    unidades && `unidades: ${unidades}`,
    nonEmpty(data.cidade) && `cidade: ${data.cidade}`,
    nonEmpty(data.assunto) && `assunto: ${data.assunto}`,
    nonEmpty(data.email) && `e-mail: ${data.email}`,
  ].filter(Boolean) as string[]

  const descricao = [
    nonEmpty(data.mensagem),
    informado.length ? `Informado no site — ${informado.join(' · ')}` : undefined,
    ...linhasDeOrigem(data),
  ].filter(Boolean) as string[]

  return {
    lead: {
      name: nonEmpty(data.nomeCondominio) ?? nonEmpty(data.nome) ?? 'Lead do site',
      sdrEmail,
      funnelId: FUNIL_PADRAO,
      duplicityValidation: false,
      source: pago ? SOURCE_ANUNCIO : SOURCE_SITE,
      industry: REGIAO_POR_CIDADE[nonEmpty(data.cidade) ?? ''],
      ddiPhone: phone?.ddi,
      phone: phone?.nacional,
      mktLink: nonEmpty(data[LANDING_FIELD]),
      description: descricao.join('\n'),
      customFields,
    },
    person: {
      name: nonEmpty(data.nome) ?? 'Contato do site',
      email: nonEmpty(data.email),
      jobTitle: nonEmpty(data.cargo),
      ddiPhone1: phone?.ddi,
      phone1: phone?.nacional,
      mainContact: true,
    },
  }
}
```

> Se a Task 1 tiver mostrado que `source`/`industry` querem **string**, trocar os
> valores dos mapas por texto (`'Site'`, `'Anúncio'`, `'João Pessoa'`, …) e os
> tipos de `number` pra `string` — e ajustar os testes correspondentes. Se
> `customFields` quiser o **id da opção**, trocar os mapas de texto por mapas de
> id (`'Síndico(a)': 125367` etc., ids no spec).

- [ ] **Step 4: Rodar os testes e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/exact-map-lead.int.spec.ts`
Expected: PASS (todos os testes do arquivo).

- [ ] **Step 5: Lint e commit**

```bash
pnpm run check
git add src/lib/exact/map-lead.ts tests/int/exact-map-lead.int.spec.ts
git commit -m "feat(exact): mapeamento puro do lead do site pro Exact"
```

---

### Task 3: `client.ts` + `push-lead.ts` — chamada HTTP e orquestração

**Files:**
- Create: `src/lib/exact/client.ts`
- Create: `src/lib/exact/push-lead.ts`
- Test: `tests/int/exact-push-lead.int.spec.ts`

**Interfaces:**
- Consumes: `mapLead`, `isExactEligible`, `ExactLeadPayload`, `ExactPersonInput` (Task 2).
- Produces:
  - `client.ts`: `function exactEnabled(): boolean`; `async function createLead(payload: ExactLeadPayload): Promise<number>`; `async function createPerson(input: ExactPersonInput & { leadId: number }): Promise<void>`
  - `push-lead.ts`: `type PushResult = { ok: true; exactLeadId: number; personError?: string } | { ok: false; error: string }`; `async function pushLeadToExact(formType: FormType, data: Record<string, string>): Promise<PushResult | null>` (`null` = não elegível ou integração desligada)

- [ ] **Step 1: Escrever os testes que falham**

```ts
// tests/int/exact-push-lead.int.spec.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * `pushLeadToExact`: elegibilidade → POST /Leads → POST /Persons. Mocka o
 * `fetch` global; nada sai da máquina.
 */

const fetchMock = vi.fn()
const ENV = { EXACT_SPOTTER_BASE_URL: 'https://exact.test/v3', EXACT_SPOTTER_TOKEN: 'tok-teste' }

const { pushLeadToExact } = await import('@/lib/exact/push-lead')

const proposta: Record<string, string> = {
  tipo: 'Condomínio residencial',
  nome: 'Maria Souza',
  nomeCondominio: 'Residencial Aurora',
  cargo: 'Síndico(a)',
  email: 'maria@example.com',
  telefone: '+5583999501388',
  cidade: 'João Pessoa e região',
  unidades: '84',
  mensagem: 'Queremos uma proposta.',
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubGlobal('fetch', fetchMock)
  for (const [k, v] of Object.entries(ENV)) vi.stubEnv(k, v)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('pushLeadToExact', () => {
  it('cria lead e contato principal e devolve o id', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(201, { value: 51199001 }))
      .mockResolvedValueOnce(jsonResponse(201, {}))

    const result = await pushLeadToExact('proposta', proposta)

    expect(result).toEqual({ ok: true, exactLeadId: 51199001 })
    expect(fetchMock).toHaveBeenCalledTimes(2)

    const [leadUrl, leadInit] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(leadUrl).toBe('https://exact.test/v3/Leads')
    expect((leadInit.headers as Record<string, string>).token_exact).toBe('tok-teste')
    expect(JSON.parse(leadInit.body as string)).toMatchObject({
      name: 'Residencial Aurora',
      funnelId: 24653,
      phone: '83999501388',
    })

    const [personUrl, personInit] = fetchMock.mock.calls[1] as [string, RequestInit]
    expect(personUrl).toBe('https://exact.test/v3/Persons')
    expect(JSON.parse(personInit.body as string)).toMatchObject({
      leadId: 51199001,
      name: 'Maria Souza',
      mainContact: true,
    })
  })

  it('não elegível não chama a API', async () => {
    const result = await pushLeadToExact('contato', { assunto: 'segunda-via-boleto', nome: 'X' })
    expect(result).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sem token configurado é no-op', async () => {
    vi.stubEnv('EXACT_SPOTTER_TOKEN', '')
    const result = await pushLeadToExact('proposta', proposta)
    expect(result).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('erro no POST /Leads devolve ok:false com o status', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(400, { error: 'name is required' }))

    const result = await pushLeadToExact('proposta', proposta)

    expect(result).toMatchObject({ ok: false })
    expect((result as { error: string }).error).toMatch(/400/)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('lead criado com contato falhando ainda é sucesso (com personError)', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(201, { value: 51199002 }))
      .mockResolvedValueOnce(jsonResponse(500, { error: 'boom' }))

    const result = await pushLeadToExact('proposta', proposta)

    expect(result).toMatchObject({ ok: true, exactLeadId: 51199002 })
    expect((result as { personError?: string }).personError).toMatch(/500/)
  })

  it('resposta sem id busca o lead recém-criado pelo telefone', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(201, {}))
      .mockResolvedValueOnce(jsonResponse(200, { value: [{ id: 51199003 }] }))
      .mockResolvedValueOnce(jsonResponse(201, {}))

    const result = await pushLeadToExact('proposta', proposta)

    expect(result).toMatchObject({ ok: true, exactLeadId: 51199003 })
    const [buscaUrl] = fetchMock.mock.calls[1] as [string]
    expect(buscaUrl).toContain('/Leads?')
    expect(decodeURIComponent(buscaUrl)).toContain('5583999501388')
  })

  it('timeout de rede vira ok:false, não exceção', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network down'))
    const result = await pushLeadToExact('proposta', proposta)
    expect(result).toMatchObject({ ok: false })
    expect((result as { error: string }).error).toMatch(/network down/)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/exact-push-lead.int.spec.ts`
Expected: FAIL — `Failed to resolve import "@/lib/exact/push-lead"`.

- [ ] **Step 3: Implementar o client**

```ts
// src/lib/exact/client.ts
import 'server-only'

import type { ExactLeadPayload, ExactPersonInput } from './map-lead'

/**
 * Client mínimo do Exact Spotter — só o que o formulário do site precisa
 * (`POST /Leads` e `POST /Persons`). O `semogapp` tem um client completo com
 * rate-limit e paginação; aqui são duas chamadas pontuais de baixo volume, e o
 * retry fica a cargo do cron, então duplicar 100 linhas custa menos que
 * acoplar o site à API do VPS.
 */

const TIMEOUT_MS = 8_000

function baseUrl(): string {
  return (process.env.EXACT_SPOTTER_BASE_URL || 'https://api.exactspotter.com/v3').replace(/\/$/, '')
}

/** Sem token, tudo vira no-op — é o que mantém preview e `next dev` fora do CRM. */
export function exactEnabled(): boolean {
  return Boolean(process.env.EXACT_SPOTTER_TOKEN)
}

async function request(path: string, init: { method: 'GET' | 'POST'; body?: unknown }) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${baseUrl()}${path}`, {
      method: init.method,
      headers: {
        token_exact: process.env.EXACT_SPOTTER_TOKEN as string,
        'content-type': 'application/json',
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
      signal: controller.signal,
    })
    const text = await res.text()
    let parsed: unknown = null
    try {
      parsed = text ? JSON.parse(text) : null
    } catch {
      parsed = text.slice(0, 200)
    }
    if (!res.ok) {
      throw new Error(`Exact ${init.method} ${path} falhou (${res.status}): ${JSON.stringify(parsed).slice(0, 200)}`)
    }
    return parsed
  } finally {
    clearTimeout(timer)
  }
}

/** Extrai o id do lead de qualquer um dos formatos que a API devolve. */
function extractId(body: unknown): number | null {
  if (typeof body === 'number') return body
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>
    for (const key of ['value', 'id', 'leadId']) {
      const candidate = record[key]
      if (typeof candidate === 'number') return candidate
      if (typeof candidate === 'string' && /^\d+$/.test(candidate)) return Number(candidate)
    }
  }
  return null
}

/**
 * Cria o lead e devolve o id. Quando a resposta não traz o id (a API do Exact
 * é irregular nisso), busca o lead recém-criado pelo telefone — chave que
 * acabamos de gravar e que a listagem devolve como `phone1` (DDI + número).
 */
export async function createLead(payload: ExactLeadPayload): Promise<number> {
  const created = await request('/Leads', { method: 'POST', body: payload })
  const id = extractId(created)
  if (id) return id

  if (!payload.phone) throw new Error('Exact criou o lead mas não devolveu id, e não há telefone pra buscar.')
  const telefone = `${payload.ddiPhone ?? '55'}${payload.phone}`
  const filtro = encodeURIComponent(`phone1 eq '${telefone}'`)
  const found = await request(`/Leads?$filter=${filtro}&$orderby=registerDate desc&$top=1`, { method: 'GET' })
  const encontrado = (found as { value?: Array<{ id: number }> })?.value?.[0]?.id
  if (!encontrado) throw new Error('Exact criou o lead mas não foi possível recuperar o id.')
  return encontrado
}

export async function createPerson(input: ExactPersonInput & { leadId: number }): Promise<void> {
  await request('/Persons', { method: 'POST', body: input })
}
```

- [ ] **Step 4: Implementar a orquestração**

```ts
// src/lib/exact/push-lead.ts
import 'server-only'

import type { FormType } from '@/lib/forms'
import { createLead, createPerson, exactEnabled } from './client'
import { isExactEligible, mapLead } from './map-lead'

/**
 * Envia um lead do site pro Exact. **Nunca lança** — o chamador (Server Action
 * do formulário e cron de retry) trata o resultado como best-effort: o lead já
 * está salvo em `cms.leads` e os e-mails já saíram.
 *
 * `null` significa "não havia o que fazer": lead não elegível (atendimento a
 * cliente, não captação) ou integração desligada por falta de token.
 */

export type PushResult =
  | { ok: true; exactLeadId: number; personError?: string }
  | { ok: false; error: string }

/** E-mail da SDR que recebe os leads do site. Env pra não precisar de deploy se mudar. */
function sdrEmail(): string {
  return process.env.EXACT_SDR_EMAIL || 'daiane@semog.com.br'
}

export async function pushLeadToExact(
  formType: FormType,
  data: Record<string, string>,
): Promise<PushResult | null> {
  if (!isExactEligible(formType, data)) return null
  if (!exactEnabled()) return null

  const { lead, person } = mapLead(formType, data, sdrEmail())

  let exactLeadId: number
  try {
    exactLeadId = await createLead(lead)
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }

  // Contato é complemento: se falhar, o card já existe e reenviar o lead só
  // criaria duplicata. Reporta o erro junto do sucesso.
  try {
    await createPerson({ ...person, leadId: exactLeadId })
  } catch (err) {
    return {
      ok: true,
      exactLeadId,
      personError: err instanceof Error ? err.message : String(err),
    }
  }

  return { ok: true, exactLeadId }
}
```

- [ ] **Step 5: Rodar os testes e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/exact-push-lead.int.spec.ts`
Expected: PASS.

- [ ] **Step 6: Lint e commit**

```bash
pnpm run check
git add src/lib/exact/client.ts src/lib/exact/push-lead.ts tests/int/exact-push-lead.int.spec.ts
git commit -m "feat(exact): client HTTP e orquestração do push de lead"
```

---

### Task 4: Colunas em `cms.leads` + ligação na Server Action

**Files:**
- Create: `db/leads-exact.sql`
- Modify: `src/app/(frontend)/_actions/submit-form.ts` (bloco do `INSERT`, ~linha 158)
- Test: `tests/int/submit-form.int.spec.ts` (acrescentar casos; não quebrar os existentes)

**Interfaces:**
- Consumes: `pushLeadToExact` (Task 3).
- Produces: colunas `exact_lead_id`, `exact_error`, `exact_attempts` em `cms.leads` — lidas pelo cron da Task 5.

- [ ] **Step 1: Escrever a migração**

```sql
-- db/leads-exact.sql
-- Colunas de controle do push pro Exact Spotter. `exact_lead_id` preenchido =
-- lead criado no CRM (e chave pra cruzar com o leads_cache do app);
-- `exact_error` guarda o último erro no banco, não só no log da Vercel;
-- `exact_attempts` limita o retry do cron.
alter table cms.leads
  add column if not exists exact_lead_id  bigint,
  add column if not exists exact_error    text,
  add column if not exists exact_attempts smallint not null default 0;

-- Índice parcial pro SELECT do cron (pendentes recentes) — a tabela é pequena
-- hoje, mas o predicado é o mesmo da query e sai de graça.
create index if not exists leads_exact_pendentes_idx
  on cms.leads (created_at)
  where exact_lead_id is null;
```

- [ ] **Step 2: Aplicar no Supabase**

Aplicar em `qvxlkovrxfqigeaopvui` (projeto `semog`) via MCP do Supabase (`apply_migration`, nome `leads_exact_columns`) ou `psql "$DATABASE_URI" -f db/leads-exact.sql`.
Expected: `ALTER TABLE` / `CREATE INDEX` sem erro; re-rodar é inócuo (tudo `if not exists`).

- [ ] **Step 3: Escrever os testes novos**

Acrescentar ao final de `tests/int/submit-form.int.spec.ts` (e adicionar o mock de `@/lib/exact/push-lead` junto dos outros `vi.mock` no topo do arquivo):

```ts
// junto dos outros mocks, no topo do arquivo:
const pushLeadMock = vi.fn()
vi.mock('@/lib/exact/push-lead', () => ({
  pushLeadToExact: (...args: unknown[]) => pushLeadMock(...args),
}))
// e no beforeEach existente:
//   pushLeadMock.mockResolvedValue(null)
//   queryMock.mockResolvedValue({ rows: [{ id: '99' }], rowCount: 1 })

describe('submitForm — push pro Exact', () => {
  const proposta = {
    tipo: 'Condomínio residencial',
    nome: 'Maria Souza',
    nomeCondominio: 'Residencial Aurora',
    email: 'maria@example.com',
    telefone: '+5583999501388',
    cidade: 'João Pessoa e região',
  }

  it('proposta empurra pro Exact e grava o id', async () => {
    headersMock.mockResolvedValue(fakeHeaders('203.0.113.20'))
    pushLeadMock.mockResolvedValue({ ok: true, exactLeadId: 51199001 })

    const result = await submitForm('proposta', proposta, 'test-token')

    expect(result.ok).toBe(true)
    expect(pushLeadMock).toHaveBeenCalledTimes(1)
    const [formType, data] = pushLeadMock.mock.calls[0] as [string, Record<string, string>]
    expect(formType).toBe('proposta')
    expect(data.nomeCondominio).toBe('Residencial Aurora')

    const update = queryMock.mock.calls.find(([sql]) => /update cms\.leads/i.test(sql as string))
    expect(update).toBeDefined()
    expect((update as [string, unknown[]])[1][0]).toBe(51199001)
  })

  it('falha no Exact não derruba a submissão e grava o erro', async () => {
    headersMock.mockResolvedValue(fakeHeaders('203.0.113.21'))
    pushLeadMock.mockResolvedValue({ ok: false, error: 'Exact POST /Leads falhou (500)' })

    const result = await submitForm('proposta', proposta, 'test-token')

    expect(result.ok).toBe(true)
    const update = queryMock.mock.calls.find(([sql]) => /update cms\.leads/i.test(sql as string))
    expect((update as [string, unknown[]])[1][0]).toBeNull()
    expect((update as [string, unknown[]])[1][1]).toMatch(/500/)
  })

  it('exceção inesperada no push não derruba a submissão', async () => {
    headersMock.mockResolvedValue(fakeHeaders('203.0.113.22'))
    pushLeadMock.mockRejectedValue(new Error('boom'))

    const result = await submitForm('proposta', proposta, 'test-token')

    expect(result.ok).toBe(true)
  })

  it('lead não elegível (push devolve null) não faz UPDATE', async () => {
    headersMock.mockResolvedValue(fakeHeaders('203.0.113.23'))
    pushLeadMock.mockResolvedValue(null)

    await submitForm('contato', contatoValido, 'test-token')

    const update = queryMock.mock.calls.find(([sql]) => /update cms\.leads/i.test(sql as string))
    expect(update).toBeUndefined()
  })
})
```

- [ ] **Step 4: Rodar e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/submit-form.int.spec.ts`
Expected: FAIL — nenhum `update cms.leads` acontece ainda.

- [ ] **Step 5: Ligar na Server Action**

Em `src/app/(frontend)/_actions/submit-form.ts`, importar o push e trocar o `INSERT` (linhas ~158-163) por:

```ts
import { pushLeadToExact } from '@/lib/exact/push-lead'

// … dentro de submitForm, no lugar do await query('insert into cms.leads …'):
    const { rows: inserted } = await query<{ id: string }>(
      `insert into cms.leads (form, data, gclid, email) values ($1, $2, $3, $4) returning id`,
      [formType, leadData, gclid ?? null, email ?? null],
    )
    const leadRowId = inserted[0]?.id

    // Exact é best-effort, igual aos e-mails: o lead já está salvo acima. Um CRM
    // fora do ar (ou um payload que ele recuse) não pode virar erro pra quem
    // preencheu o formulário — o cron `push-exact-leads` retenta depois.
    if (leadRowId) {
      try {
        const push = await pushLeadToExact(formType, leadData)
        if (push) {
          await query(
            `update cms.leads
                set exact_lead_id = $1, exact_error = $2, exact_attempts = exact_attempts + 1
              where id = $3`,
            [
              push.ok ? push.exactLeadId : null,
              push.ok ? (push.personError ?? null) : push.error,
              leadRowId,
            ],
          )
        }
      } catch (exactErr) {
        console.error('[submit-form] push pro Exact falhou (lead já salvo):', exactErr)
      }
    }
```

Atualizar o comentário de bloco do `submitForm` (linhas ~99-110) pra citar o passo do Exact no pipeline.

- [ ] **Step 6: Rodar a suíte inteira**

Run: `pnpm run test:int`
Expected: PASS — inclusive os testes antigos de `submit-form` (o form de contato sem assunto comercial continua fazendo **um** `query`, porque `pushLeadToExact` devolve `null`).

- [ ] **Step 7: Lint e commit**

```bash
pnpm run check
git add db/leads-exact.sql src/app/\(frontend\)/_actions/submit-form.ts tests/int/submit-form.int.spec.ts
git commit -m "feat(exact): submissão do site cria lead no CRM (best-effort)"
```

---

### Task 5: Cron de retry + configuração

**Files:**
- Create: `src/app/api/cron/push-exact-leads/route.ts`
- Modify: `vercel.json`
- Modify: `docs/DEPLOY.md` (seção de variáveis de ambiente)
- Test: `tests/int/cron-exact.int.spec.ts`

**Interfaces:**
- Consumes: `pushLeadToExact` (Task 3); colunas da Task 4.
- Produces: rota `GET /api/cron/push-exact-leads` protegida por `CRON_SECRET`.

- [ ] **Step 1: Escrever os testes que falham**

```ts
// tests/int/cron-exact.int.spec.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Cron `push-exact-leads`: varre leads recentes que ainda não entraram no CRM e
 * reenvia. `@/lib/db` e `@/lib/exact/push-lead` mockados.
 */

const queryMock = vi.fn()
const pushLeadMock = vi.fn()

vi.mock('@/lib/db', () => ({ query: (...args: unknown[]) => queryMock(...args) }))
vi.mock('@/lib/exact/push-lead', () => ({
  pushLeadToExact: (...args: unknown[]) => pushLeadMock(...args),
}))

const { GET } = await import('@/app/api/cron/push-exact-leads/route')

function fakeRequest(bearer?: string): Request {
  const headers = new Headers()
  if (bearer !== undefined) headers.set('authorization', `Bearer ${bearer}`)
  return new Request('http://localhost/api/cron/push-exact-leads', { headers })
}

const pendente = {
  id: '42',
  form: 'proposta',
  data: { nome: 'Maria', nomeCondominio: 'Aurora', email: 'm@x.com', telefone: '+5583999501388' },
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubEnv('CRON_SECRET', 'segredo-de-teste')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('cron push-exact-leads', () => {
  it('sem bearer correto devolve 401 e não consulta o banco', async () => {
    const res = await GET(fakeRequest('errado'))
    expect(res.status).toBe(401)
    expect(queryMock).not.toHaveBeenCalled()
  })

  it('reenvia pendente e grava o id', async () => {
    queryMock.mockResolvedValueOnce({ rows: [pendente] }).mockResolvedValueOnce({ rows: [] })
    pushLeadMock.mockResolvedValue({ ok: true, exactLeadId: 777 })

    const res = await GET(fakeRequest('segredo-de-teste'))
    const body = (await res.json()) as { ok: boolean; enviados: number; falhas: number }

    expect(res.status).toBe(200)
    expect(body).toMatchObject({ ok: true, enviados: 1, falhas: 0 })
    expect(pushLeadMock).toHaveBeenCalledWith('proposta', pendente.data)

    const update = queryMock.mock.calls.find(([sql]) => /update cms\.leads/i.test(sql as string))
    expect((update as [string, unknown[]])[1][0]).toBe(777)
  })

  it('falha continua contabilizada e não interrompe o lote', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [pendente, { ...pendente, id: '43' }] })
      .mockResolvedValue({ rows: [] })
    pushLeadMock
      .mockResolvedValueOnce({ ok: false, error: 'Exact fora do ar' })
      .mockResolvedValueOnce({ ok: true, exactLeadId: 778 })

    const res = await GET(fakeRequest('segredo-de-teste'))
    const body = (await res.json()) as { enviados: number; falhas: number }

    expect(body).toMatchObject({ enviados: 1, falhas: 1 })
    expect(pushLeadMock).toHaveBeenCalledTimes(2)
  })

  it('nada pendente não chama a API', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] })
    const res = await GET(fakeRequest('segredo-de-teste'))
    expect((await res.json()).enviados).toBe(0)
    expect(pushLeadMock).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/cron-exact.int.spec.ts`
Expected: FAIL — rota inexistente.

- [ ] **Step 3: Implementar a rota**

```ts
// src/app/api/cron/push-exact-leads/route.ts
import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { pushLeadToExact } from '@/lib/exact/push-lead'
import type { FormType } from '@/lib/forms'

/**
 * Cron (Vercel) — rede de segurança do push pro Exact. O caminho normal é
 * síncrono na Server Action do formulário; aqui só passam os leads em que
 * aquele push falhou (CRM fora do ar, timeout, payload recusado).
 *
 * Janela de 48 h e teto de 5 tentativas: um payload que o Exact recusa por
 * regra (não por indisponibilidade) não fica sendo reenviado pra sempre — o
 * motivo continua legível em `exact_error`, e o lead nunca se perde, porque
 * está em `cms.leads` e já gerou e-mail pra equipe no momento do envio.
 *
 * Diário (`vercel.json`) porque o plano pode ser Hobby, que limita cron a
 * 1×/dia. Em Pro, subir a frequência é só mudar o `schedule`.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const WINDOW_HOURS = 48
const MAX_ATTEMPTS = 5

type PendingRow = { id: string; form: FormType; data: Record<string, string> }

export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const cutoff = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString()

    // Mesma regra de elegibilidade de `isExactEligible`, aplicada em SQL pra não
    // trazer do banco o que nunca seria enviado (atendimento a cliente).
    const { rows: pendentes } = await query<PendingRow>(
      `select id, form, data from cms.leads
        where exact_lead_id is null
          and created_at > $1
          and exact_attempts < $2
          and (form = 'proposta' or (form = 'contato' and data->>'assunto' = 'proposta-comercial'))
        order by created_at asc`,
      [cutoff, MAX_ATTEMPTS],
    )

    let enviados = 0
    let falhas = 0

    // Sequencial de propósito: o volume é de poucos leads e o Exact limita a
    // 30 requisições por 20 s.
    for (const lead of pendentes) {
      const push = await pushLeadToExact(lead.form, lead.data)
      if (!push) continue
      if (push.ok) enviados += 1
      else falhas += 1

      await query(
        `update cms.leads
            set exact_lead_id = $1, exact_error = $2, exact_attempts = exact_attempts + 1
          where id = $3`,
        [
          push.ok ? push.exactLeadId : null,
          push.ok ? (push.personError ?? null) : push.error,
          lead.id,
        ],
      )
    }

    return NextResponse.json({ ok: falhas === 0, considerados: pendentes.length, enviados, falhas })
  } catch (err) {
    console.error('[cron/push-exact-leads] erro:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
```

- [ ] **Step 4: Registrar o cron**

```json
{
  "crons": [
    { "path": "/api/cron/upload-ads-conversions", "schedule": "0 6 * * *" },
    { "path": "/api/cron/push-exact-leads", "schedule": "0 7 * * *" }
  ]
}
```

- [ ] **Step 5: Rodar a suíte inteira**

Run: `pnpm run test:int`
Expected: PASS em todos os arquivos.

- [ ] **Step 6: Documentar as variáveis**

Em `docs/DEPLOY.md`, na seção de variáveis de ambiente, acrescentar:

```markdown
### Exact Spotter (CRM)

| Variável | Valor | Obrigatória |
|---|---|---|
| `EXACT_SPOTTER_BASE_URL` | `https://api.exactspotter.com/v3` | sim (pra ligar) |
| `EXACT_SPOTTER_TOKEN` | token gerado em Configurações → Integrações no Exact (mesmo do `.env.api` do semogapp) | sim (pra ligar) |
| `EXACT_SDR_EMAIL` | `daiane@semog.com.br` | não (default no código) |

Sem `EXACT_SPOTTER_TOKEN` a integração fica desligada e o formulário funciona
como antes — é por isso que o deploy pode subir antes das variáveis existirem.
Configurar **só em produção**: em preview, o push deve continuar desligado pra
não criar lead de teste no CRM.
```

- [ ] **Step 7: Commit**

```bash
pnpm run check
git add src/app/api/cron/push-exact-leads/route.ts tests/int/cron-exact.int.spec.ts vercel.json docs/DEPLOY.md
git commit -m "feat(exact): cron diário de retry do push de lead"
```

---

### Task 6: Ligar em produção e validar ponta a ponta

**Files:** nenhum (configuração e verificação).

**Interfaces:**
- Consumes: tudo acima.

- [ ] **Step 1: Subir o código**

```bash
git push origin main
```

Deploy automático na Vercel (push na `main` deploya).

- [ ] **Step 2: Configurar as variáveis em produção**

Na Vercel (projeto do site) → Settings → Environment Variables → **Production apenas**:
`EXACT_SPOTTER_BASE_URL`, `EXACT_SPOTTER_TOKEN`, `EXACT_SDR_EMAIL`. Redeploy pra elas valerem.

- [ ] **Step 3: Teste real pelo formulário**

Enviar uma proposta em `https://semog.com.br/proposta` com nome de condomínio marcado (ex.: "TESTE INTEGRAÇÃO — ignorar"), telefone real de teste e cidade João Pessoa.
Expected: no Exact, lead novo em "Entrada" do funil Padrão, com origem `Site`, região `João Pessoa`, contato principal preenchido e descrição com os valores crus.

- [ ] **Step 4: Conferir o banco**

```sql
select id, form, exact_lead_id, exact_error, exact_attempts, created_at
  from cms.leads order by created_at desc limit 5;
```
Expected: a linha do teste com `exact_lead_id` preenchido e `exact_error` nulo.

- [ ] **Step 5: Limpar o lead de teste**

Descartar o lead de teste no Exact (Descartar → "Descarte automático via API" ou pela tela).

- [ ] **Step 6: Conferir o cron**

Rodar manualmente uma vez:
```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://semog.com.br/api/cron/push-exact-leads
```
Expected: `{"ok":true,"considerados":0,...}` (nada pendente depois do teste bem-sucedido).

---

## Notas de execução

- Ordem obrigatória: **Task 1 antes da 2** (o formato do payload sai do probe). As demais são sequenciais.
- A Task 1 e a Task 6 escrevem no CRM de produção — pedir OK antes de cada uma.
- Se o probe mostrar que `POST /Leads` exige campos que o site não coleta (ex.: `city`/`state`/`country` obrigatórios quando se informa endereço — o site não informa nenhum), registrar no cabeçalho do probe e ajustar o mapa na Task 2.
