# Semog Fase 0 · Plano 4b — Formulários (contato/proposta) funcionais

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Formulários de **contato** e **proposta** funcionais: RHF + Zod + Server Actions, **Cloudflare Turnstile** (anti-spam), **rate limit**, submissões salvas no Payload (**Form Builder plugin**) e e-mails via **SendGrid + React Email** (notificação interna + auto-reply).

**Architecture:** Front usa React Hook Form + Zod (schema único validado no cliente e no server). O submit é uma **Server Action** que: (1) valida com o Zod, (2) verifica o token do **Turnstile**, (3) aplica **rate limit**, (4) grava a submissão via **Payload Form Builder** (`plugin-form-builder`), (5) dispara 2 e-mails **React Email** por **SendGrid**. Envio real de e-mail é **deferido** até a `SENDGRID_API_KEY` (com Mail Send) existir — sem ela, a submissão é gravada e o envio é um no-op logado. Turnstile usa **chaves de teste da Cloudflare no dev**.

**Tech Stack:** `@payloadcms/plugin-form-builder`, react-hook-form + zod, `@sendgrid/mail`, `@react-email/components`, Cloudflare Turnstile, Next 16 Server Actions.

## Global Constraints

- pnpm 10.12.4; Node v22; Windows. Banco vivo (schema `cms`). Reusar primitivos do Plano 2; nunca editar `_reference/`.
- **Credenciais:** Turnstile no dev usa as chaves de teste oficiais (site `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA`); reais via `.env` em prod. SendGrid: código pronto, **envio real difere** pra `SENDGRID_API_KEY`+`SENDGRID_FROM`+`CONTACT_TO` — sem elas, grava a submissão e loga o envio (no-op), NUNCA quebra.
- Um único schema Zod por formulário, validado nos dois lados. Server Actions com tratamento de erro (retorna estado pro RHF).
- `.env.example` ganha `TURNSTILE_SITE_KEY`/`TURNSTILE_SECRET_KEY`, `SENDGRID_API_KEY`, `SENDGRID_FROM`, `CONTACT_TO`.
- Biome `check` = 0 e `tsc --noEmit` limpo antes de cada commit; cada task em commit próprio; verificar ao vivo.

## Mapa de arquivos

- `src/payload.config.ts` (`formBuilderPlugin`) → `generate:types`; seed dos forms (`src/seed/forms.ts`).
- `src/lib/{turnstile,rate-limit,sendgrid}.ts`; `src/emails/{ContactNotification,ContactAutoReply}.tsx`.
- `src/components/forms/{Turnstile,ContactForm,PropostaForm,Field}.tsx`; `src/app/(frontend)/_actions/submit-form.ts` (Server Action).
- Ligar os forms nas páginas `contato`/`proposta` (bloco de formulário ou componente na página).

---

### Task 1: Form Builder plugin + definição dos formulários

**Files:** Modify `src/payload.config.ts`; Create `src/seed/forms.ts` + script.

**Interfaces:** Produces — `plugin-form-builder` (collections `forms` + `form-submissions`); dois `forms` semeados (`contato`, `proposta`) com os campos do `_reference` (nome, e-mail, telefone, cidade, mensagem; proposta: + tipo de imóvel, nº unidades, etc.). Tipos gerados.

- [ ] **Step 1:** `pnpm add @payloadcms/plugin-form-builder`; registrar `formBuilderPlugin({ fields: { text, textarea, email, select, number, checkbox }, formOverrides, formSubmissionOverrides })`. `generate:types`.
- [ ] **Step 2:** `src/seed/forms.ts` idempotente — cria os forms `contato` e `proposta` com os campos (do `_reference/contato.html`/`proposta.html`). Script `seed:forms`. Rodar.
- [ ] **Step 3:** Verificar no admin/DB que os forms existem; tsc/biome → commit `feat(forms): Form Builder plugin + seed de contato e proposta`.

---

### Task 2: React Email + util SendGrid (envio deferido)

**Files:** Create `src/emails/{ContactNotification,ContactAutoReply}.tsx`, `src/lib/sendgrid.ts`.

**Interfaces:** Produces — `sendMail({ to, from, subject, react })` que renderiza o React Email pra HTML e envia via `@sendgrid/mail`; se `SENDGRID_API_KEY` ausente, **loga e retorna sem erro** (no-op). Templates: notificação interna (dados da submissão) + auto-reply pro lead (marca Semog).

- [ ] **Step 1:** `pnpm add @sendgrid/mail @react-email/components @react-email/render`.
- [ ] **Step 2:** `src/lib/sendgrid.ts` — `sendMail(...)`: se sem key, `console.info('[sendgrid] no-op (sem SENDGRID_API_KEY)')` e retorna `{ skipped: true }`; senão `sgMail.setApiKey`, `render(react)` → html, `sgMail.send`. Tratamento de erro (retorna `{ ok:false, error }`, não lança).
- [ ] **Step 3:** `ContactNotification.tsx` (tabela com os campos da submissão) e `ContactAutoReply.tsx` (confirmação pro lead) usando `@react-email/components`, na paleta da marca.
- [ ] **Step 4:** Verificar: um teste unitário/route que renderiza os templates pra HTML (sem enviar) e que `sendMail` sem key é no-op. tsc/biome → commit `feat(email): React Email + util SendGrid (envio deferido à key)`.

---

### Task 3: Turnstile (widget client + verify server) + rate limit

**Files:** Create `src/lib/turnstile.ts`, `src/lib/rate-limit.ts`, `src/components/forms/Turnstile.tsx`; Modify `.env.example`.

**Interfaces:** Produces — `verifyTurnstile(token, ip)` (siteverify da Cloudflare; em dev com a secret de teste sempre passa); `<Turnstile onToken>` (widget client, usa `TURNSTILE_SITE_KEY` público, script da Cloudflare); `rateLimit(key, { max, windowMs })` (in-memory por instância, com nota de que serverless quer um store externo depois).

- [ ] **Step 1:** `.env.example` + `.env` (dev): `TURNSTILE_SITE_KEY=1x00000000000000000000AA`, `TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA` (chaves de teste da Cloudflare — sempre passam). Documentar que reais entram em prod.
- [ ] **Step 2:** `src/lib/turnstile.ts` — POST pra `https://challenges.cloudflare.com/turnstile/v0/siteverify` com `secret`+`response`(+`remoteip`); retorna `{ success }`. Se `TURNSTILE_SECRET_KEY` ausente, falha fechado (retorna success:false) — mas em dev a de teste está setada.
- [ ] **Step 3:** `src/components/forms/Turnstile.tsx` (client) — carrega o script da Cloudflare, renderiza o widget, chama `onToken(token)`; respeita `prefers-reduced-motion` (o widget é leve).
- [ ] **Step 4:** `src/lib/rate-limit.ts` — limiter in-memory (Map por chave, janela deslizante), `rateLimit(key,{max,windowMs})→{ok,retryAfter}`. Nota: serverless usa store externo depois.
- [ ] **Step 5:** tsc/biome; verificar que o widget renderiza (dev, chave de teste) → commit `feat(forms): Turnstile (widget + verify) e rate limit`.

---

### Task 4: Server Action de submit + schema Zod

**Files:** Create `src/app/(frontend)/_actions/submit-form.ts`, `src/lib/form-schemas.ts`.

**Interfaces:** Produces — schemas Zod (`contatoSchema`, `propostaSchema`); Server Action `submitForm(formSlug, values, turnstileToken)` que: valida Zod → `verifyTurnstile` → `rateLimit` → grava submissão (`payload.create({ collection:'form-submissions' })` ligando ao form) → `sendMail` (notificação + auto-reply) → retorna `{ ok, errors? }`. Falhas (turnstile/rate/validação) retornam estado, não lançam.

- [ ] **Step 1:** `form-schemas.ts` — Zod pros dois forms (mesmos campos do seed).
- [ ] **Step 2:** `submit-form.ts` (`'use server'`) — o pipeline acima, resiliente; e-mail via `sendMail` (no-op sem key). Rate-limit por IP (dos headers).
- [ ] **Step 3:** Verificar (curl/teste) que uma submissão válida com token de teste grava no `form-submissions` e retorna ok; token inválido/rate-limit retorna erro. tsc/biome → commit `feat(forms): Server Action de submit (Zod + Turnstile + rate limit + submissão)`.

---

### Task 5: Formulário de Contato (RHF/Zod) ligado à página

**Files:** Create `src/components/forms/{ContactForm,Field}.tsx`; Modify o seed de `contato` (usar o form).

**Interfaces:** Produces — `<ContactForm>` client (RHF + `contatoSchema` + `<Turnstile>`), chama a Server Action, mostra sucesso/erro; ligado na página `/contato`.

- [ ] **Step 1:** `Field.tsx` (input/textarea/select acessível com erro) + `ContactForm.tsx` (RHF, Turnstile, submit → Server Action, estados de loading/sucesso/erro).
- [ ] **Step 2:** Ligar na página `contato` (bloco/ilha client no seed ou um bloco `formEmbed`). 
- [ ] **Step 3:** Verificar ao vivo `/contato`: preencher, Turnstile (teste) passa, submissão grava, UI de sucesso; validação de campo funciona. Playwright screenshot. tsc/biome → commit `feat(forms): formulário de Contato (RHF/Zod/Turnstile) na página`.

---

### Task 6: Formulário de Proposta ligado à página

**Files:** Create `src/components/forms/PropostaForm.tsx`; Modify o seed de `proposta`.

**Interfaces:** Produces — `<PropostaForm>` (mesmo padrão, campos de proposta) ligado em `/proposta`.

- [ ] **Step 1:** `PropostaForm.tsx` (RHF + `propostaSchema` + Turnstile).
- [ ] **Step 2:** Ligar na página `proposta`.
- [ ] **Step 3:** Verificar ao vivo `/proposta` (submissão grava, UI ok). Playwright. tsc/biome → commit `feat(forms): formulário de Proposta na página`.

---

## Self-Review (cobertura)

- **Form Builder + seed dos forms** → Task 1. ✅
- **React Email + SendGrid (deferido)** → Task 2. ✅
- **Turnstile + rate limit** → Task 3. ✅
- **Server Action (Zod+Turnstile+rate+submissão+email)** → Task 4. ✅
- **Contato na página** → Task 5. ✅
- **Proposta na página** → Task 6. ✅

**Pendente de você (produção):** `SENDGRID_API_KEY` (com Mail Send) + `SENDGRID_FROM` (remetente verificado) + `CONTACT_TO` (destino), e as chaves reais do **Turnstile**. Com elas no `.env`, o envio de e-mail passa a acontecer de verdade (o resto já funciona). **Plano 4c:** Sentry, banner LGPD, CI, previews. Depois: migration limpa + review final + deploy Vercel + MCPs Google.
