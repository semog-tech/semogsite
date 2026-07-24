# Remoção do Payload — Fase 3: Leads e Formulários — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar o armazenamento de leads do Payload (`form-submissions`) para uma tabela `leads` no Supabase acessada direto via `supabase-js`, reescrever `submit-form.ts` e o cron do Google Ads para ela, e migrar o histórico existente — sem perder nenhum lead e sem quebrar a conversão do Ads.

**Architecture:** Uma tabela `leads` mínima no mesmo Postgres do Supabase (mantido). `submit-form.ts` valida com o Zod que já existe e faz `insert` via supabase-js; o cron faz `select`. O `gclid` e o `email` viram colunas próprias para o cron não varrer JSON. A definição dos 2 formulários (hoje docs do form-builder) vira config estático.

**Tech Stack:** Next.js 16, `@supabase/supabase-js`, Zod (já presente), SendGrid (já presente), Vitest 4, pnpm 10.

## Dependência

Requer **Fases 1 e 2 concluídas**. Independe do render de páginas/blog, mas é pré-requisito da Fase 4 (não dá para remover o Payload enquanto os forms e o cron o usam).

## Global Constraints

- **pnpm** only. Antes de cada commit: `pnpm exec tsc --noEmit` e `pnpm exec biome lint ./src ./tests` limpos.
- Windows `core.autocrlf=true`: ignorar ruído de fim de linha do `biome ci`.
- Comentários em **português**, explicando o porquê.
- **Banco de PRODUÇÃO compartilhado.** A tabela `leads` e a migração de histórico agem em produção. Fazer **backup** de `form-submissions` antes de qualquer escrita. Toda operação de escrita no banco que o classificador bloquear deve ser executada pelo usuário via `!` — não contornar.
- **Não perder leads nem quebrar a conversão do Ads.** O cron alimenta o Google Ads server-side (à prova de adblock); um erro aqui custa dinheiro de mídia.
- Segredos: usar a service-role key do Supabase **só no server** (server action e route handler). Nunca expor no cliente.

## Referência

Spec: `docs/superpowers/specs/2026-07-24-remocao-do-payload-cms-design.md` (seção 5).

Fatos levantados:
- `submit-form.ts`: valida (Zod `contatoSchema`/`propostaSchema`), verifica Turnstile, rate-limit (5/min por IP), busca o form em `forms` por título, monta `submissionData` (`[{field, value}]`) incluindo campos de atribuição (`origem — gclid (Google Ads)` etc.), faz `payload.create` em `form-submissions`, e envia e-mail via SendGrid. Nunca lança.
- Cron `upload-ads-conversions/route.ts`: Bearer `CRON_SECRET`, roda 1×/dia (`vercel.json`, `0 6 * * *`), lê `form-submissions` da janela de `WINDOW_DAYS` (3) com `gclid` no campo `origem — gclid (Google Ads)`, sobe conversão via Google Data Manager API (service account `GOOGLE_SA_JSON`).
- Os 2 formulários: `contato` e `proposta` (`FORM_TITLES`).

---

### Task 1: Tabela `leads` e backup do histórico

Criar a tabela e migrar os registros de `form-submissions`.

**Files:**
- Create: `db/leads.sql` (DDL versionado)
- Create: `scripts/migrar-leads.mjs` (backup + cópia)
- Test: `tests/int/leads-schema.int.spec.ts`

**Interfaces:**
- Produces: tabela `leads` com o schema da spec.

- [ ] **Step 1: Escrever o DDL**

Create `db/leads.sql` (schema da spec seção 5.1): `id`, `created_at`, `form`, `data jsonb`, `gclid`, `email`, `uploaded_to_ads`, índice em `created_at`. RLS: como o acesso é só via service-role no server, habilite RLS e **não** crie policy pública (service-role bypassa RLS) — assim a tabela fica inacessível pelo anon key.

- [ ] **Step 2: Backup do histórico atual**

Escreva `scripts/migrar-leads.mjs`: primeiro **exporta** todos os `form-submissions` atuais para um arquivo `db/backup-form-submissions-<data>.json` (via Payload, `payload run`). Só depois prossegue.

**A criação da tabela e a escrita são operações de produção** — se o classificador bloquear, entregue ao usuário o SQL (`db/leads.sql`) e o comando para rodar via `!` (psql pelo proxy, ou o SQL editor do Supabase). Documente no relatório o que precisa ser rodado por ele.

- [ ] **Step 3: Migrar os registros**

`scripts/migrar-leads.mjs` continua: lê cada `form-submission`, extrai o `gclid` (do campo `origem — gclid (Google Ads)`) e o `email` (do campo de e-mail), monta `data` (o `submissionData` como objeto), e faz `insert` na `leads` preservando `created_at`. Idempotente (não duplicar se rodar 2×).

- [ ] **Step 4: Escrever o teste de schema**

Create `tests/int/leads-schema.int.spec.ts`: conecta via supabase-js (service-role, do `.env`), faz um `insert` de teste + `select` + `delete` do próprio registro, confirmando que as colunas `form/data/gclid/email/uploaded_to_ads` existem e aceitam o shape esperado. (Teste de fumaça contra o banco real — marque-o para rodar só quando `SUPABASE_SERVICE_ROLE_KEY` estiver presente.)

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/leads-schema.int.spec.ts`
Expected: PASS (depois da tabela criada).

- [ ] **Step 5: Confirmar a contagem migrada**

Run: um `select count(*)` na `leads` vs. o número de linhas no backup JSON.
Expected: batem. Reporte o número.

- [ ] **Step 6: Commit**

```bash
git add db/leads.sql scripts/migrar-leads.mjs tests/int/leads-schema.int.spec.ts
git commit -m "feat(leads): tabela leads no Supabase + migração do histórico de form-submissions"
```

(O backup JSON e `.env` não entram no git.)

---

### Task 2: Cliente supabase-js e definições estáticas de formulário

**Files:**
- Modify: `package.json` (`@supabase/supabase-js`)
- Create: `src/lib/supabase.ts` (cliente server-only), `src/lib/forms.ts` (definições dos 2 forms + extração de gclid/email)
- Test: `tests/int/forms-defs.int.spec.ts`

**Interfaces:**
- Produces: `supabaseAdmin()` (cliente service-role, server-only) e `FORMS` (config de `contato`/`proposta`), `extractLeadColumns(data)`.

- [ ] **Step 1: Instalar supabase-js**

Run: `pnpm add @supabase/supabase-js`

- [ ] **Step 2: Escrever o teste que falha**

Create `tests/int/forms-defs.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { extractLeadColumns, FORMS } from '@/lib/forms'

describe('definições de formulário', () => {
  it('tem contato e proposta', () => {
    expect(FORMS.contato).toBeDefined()
    expect(FORMS.proposta).toBeDefined()
  })
  it('extrai gclid e email das colunas do lead', () => {
    const { gclid, email } = extractLeadColumns({
      'E-mail': 'a@b.com',
      'origem — gclid (Google Ads)': 'ABC123',
    })
    expect(email).toBe('a@b.com')
    expect(gclid).toBe('ABC123')
  })
  it('não quebra sem gclid/email', () => {
    const r = extractLeadColumns({ Nome: 'x' })
    expect(r.gclid).toBeUndefined()
    expect(r.email).toBeUndefined()
  })
})
```

- [ ] **Step 3: Rodar e confirmar que falha**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/forms-defs.int.spec.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 4: Escrever `src/lib/supabase.ts`**

Cliente server-only com a service-role key (`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` do `.env`). Marque o arquivo com `import 'server-only'` para garantir que nunca vá pro bundle do cliente.

- [ ] **Step 5: Escrever `src/lib/forms.ts`**

`FORMS`: as definições estáticas de `contato` e `proposta` (os campos, derivados do seed `src/seed/forms.ts` e dos schemas Zod). `extractLeadColumns(data)`: puxa `email` (campo 'E-mail') e `gclid` (campo `origem — gclid (Google Ads)`) para as colunas próprias. Constantes de nome de campo compartilhadas com o cron (o `GCLID_FIELD`).

- [ ] **Step 6: Rodar e confirmar que passa**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/forms-defs.int.spec.ts && pnpm exec tsc --noEmit`
Expected: PASS + limpo.

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml src/lib/supabase.ts src/lib/forms.ts tests/int/forms-defs.int.spec.ts
git commit -m "feat(forms): cliente supabase-js server-only + definições estáticas de formulário"
```

---

### Task 3: `submit-form.ts` grava na `leads` via supabase-js

**Files:**
- Modify: `src/app/(frontend)/_actions/submit-form.ts`
- Test: `tests/int/submit-form.int.spec.ts`

**Interfaces:**
- Consumes: `supabaseAdmin`, `FORMS`, `extractLeadColumns` (Task 2).
- Produces: submissão persistida em `leads`; e-mail SendGrid inalterado.

- [ ] **Step 1: Escrever o teste que falha**

Create `tests/int/submit-form.int.spec.ts`: mocka `supabaseAdmin` e `sendMail`, chama `submitForm` com dados válidos de `contato`, e verifica que houve `insert` na `leads` com `form: 'contato'`, `data` com os campos, e `email` extraído. Testa também: entrada inválida → não insere; Turnstile falho → não insere; rate-limit → bloqueia.

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/submit-form.int.spec.ts`
Expected: FAIL — ainda usa Payload.

- [ ] **Step 3: Reescrever `submit-form.ts`**

Troque:
- `getPayloadClient()` + `payload.find({ collection: 'forms' })` → `FORMS[formType]` (config estático).
- `payload.create({ collection: 'form-submissions' })` → `supabaseAdmin().from('leads').insert({ form: formType, data, gclid, email })` com `extractLeadColumns`.
- Mantenha: Zod, Turnstile, rate-limit, atribuição (cookie), SendGrid, e o contrato "nunca lança" (cada etapa em try/catch, só o insert precisa ter sucesso para retornar ok).

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/submit-form.int.spec.ts && pnpm exec tsc --noEmit`
Expected: PASS + limpo.

- [ ] **Step 5: Teste ponta a ponta do formulário (contra o dev server)**

Preencha e envie o formulário de contato em `http://localhost:3000/contato` (Turnstile em modo teste), e confirme que um registro novo apareceu na `leads` (via supabase-js) e que o e-mail foi disparado (ou logado, se sem key). **Apague o registro de teste depois** (é produção).

- [ ] **Step 6: Commit**

```bash
git add "src/app/(frontend)/_actions/submit-form.ts" tests/int/submit-form.int.spec.ts
git commit -m "feat(forms): submit-form grava lead na tabela leads via supabase-js"
```

---

### Task 4: Cron do Ads lê da `leads` via supabase-js

**Files:**
- Modify: `src/app/api/cron/upload-ads-conversions/route.ts`
- Test: `tests/int/cron-ads.int.spec.ts`

**Interfaces:**
- Consumes: `supabaseAdmin`, `leads`.
- Produces: conversões subidas ao Ads a partir da `leads`.

- [ ] **Step 1: Escrever o teste que falha**

Create `tests/int/cron-ads.int.spec.ts`: mocka `supabaseAdmin` para devolver leads com/sem `gclid` na janela, mocka a chamada ao Google, e verifica que só os com `gclid` viram conversão, com o `eventTimestamp` vindo do `created_at`. Testa o guard do `CRON_SECRET` (401 sem Bearer).

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/cron-ads.int.spec.ts`
Expected: FAIL — ainda usa Payload.

- [ ] **Step 3: Reescrever a leitura do cron**

Troque `payload.find({ collection: 'form-submissions', where: { …createdAt > cutoff } })` por `supabaseAdmin().from('leads').select().gt('created_at', cutoff).not('gclid', 'is', null)`. O `gclid` e o `email` já são colunas — sem varrer `submissionData`. Opcional (melhoria): filtrar `uploaded_to_ads = false` e marcar `true` após subir, em vez da janela de tempo — mais robusto contra reprocessamento. Mantenha a integração com o Google Data Manager API inalterada.

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/cron-ads.int.spec.ts && pnpm exec tsc --noEmit`
Expected: PASS + limpo.

- [ ] **Step 5: Disparar o cron manualmente (dry-run) contra o dev server**

Chame `GET /api/cron/upload-ads-conversions` com o `CRON_SECRET` Bearer. Confirme nos logs que ele leu da `leads` e processou os leads com gclid da janela (sem, de fato, subir lixo — use uma janela vazia ou os dados migrados reais e verifique o retorno).
Expected: resposta de sucesso, contagem coerente com os leads reais.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/cron/upload-ads-conversions/route.ts tests/int/cron-ads.int.spec.ts
git commit -m "feat(ads): cron de conversão lê da tabela leads via supabase-js"
```

---

## Verificação final da Fase 3

- [ ] `tsc --noEmit` e `biome lint` limpos; vitest passa
- [ ] Tabela `leads` criada, RLS habilitada sem policy pública, histórico migrado (contagem confere)
- [ ] Backup de `form-submissions` salvo antes da migração
- [ ] `submit-form.ts` e o cron não importam mais nada de `@/lib/payload`
- [ ] Envio de formulário real grava na `leads`; e-mail dispara
- [ ] Cron lê da `leads` e a conversão do Ads segue funcionando
- [ ] Nenhum runtime fora de `(payload)` ainda usa `getPayload`

## Próxima fase

- **Fase 4:** arrancar o Payload — grupo `(payload)`, collections, globals, block configs, `payload.config.ts`, migrations, seeds, `payload-types.ts`, `src/lib/payload.ts`, os 8 pacotes, os scripts do package.json, e desembrulhar `withPayload` do `next.config`.
