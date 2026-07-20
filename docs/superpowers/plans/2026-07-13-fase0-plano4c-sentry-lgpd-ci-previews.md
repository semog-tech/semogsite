# Semog Fase 0 · Plano 4c — Sentry, banner LGPD, CI & previews

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Fechar a camada de produção: **Sentry** (observabilidade, DSN deferido), **banner de consentimento LGPD** que bloqueia scripts não-essenciais até o aceite, **CI** (GitHub Actions: Biome + tsc + generate:types) e **preview deployments** documentados.

**Architecture:** Sentry via `@sentry/nextjs` (client/server/edge), no-op sem `SENTRY_DSN`, `global-error` reporta. Consentimento via um `ConsentProvider` (cookie persistido, categorias) + `CookieBanner`; scripts de terceiros só carregam após consentimento (helper `hasConsent`). CI roda os gates em PR/push. Previews = config/doc da Vercel.

**Tech Stack:** `@sentry/nextjs`, React context (consent), GitHub Actions, Vercel.

## Global Constraints

- pnpm 10.12.4; Node v22; Windows. Reusar primitivos do Plano 2; nunca editar `_reference/`.
- **Credenciais deferidas:** Sentry sem `SENTRY_DSN` = no-op (nunca quebra); source maps só sobem com `SENTRY_AUTH_TOKEN` no build. Documentar em `.env.example`.
- Consentimento: nenhum script de analytics/marketing carrega sem aceite (LGPD). Os scripts em si (GTM/Ads) entram depois com os MCPs de Google — o banner + o gate ficam prontos agora.
- Biome `check` = 0 e `tsc --noEmit` limpo antes de cada commit; cada task em commit próprio; verificar ao vivo.

## Mapa de arquivos

- `instrumentation.ts`, `instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `next.config.ts` (`withSentryConfig`), `src/app/global-error.tsx` (Sentry.captureException) — Task 1.
- `src/providers/ConsentProvider.tsx`, `src/components/consent/CookieBanner.tsx`, `src/lib/consent.ts`; montar no `(frontend)/layout.tsx` — Task 2.
- `.github/workflows/ci.yml` — Task 3.
- `docs/DEPLOY.md` + `.env.example` final — Task 4.

---

### Task 1: Sentry (observabilidade, DSN deferido)

**Files:** Create `instrumentation.ts`, `instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`; Modify `next.config.ts` (`withSentryConfig`), `src/app/global-error.tsx`, `.env.example`.

**Interfaces:** Produces — Sentry inicializado nos 3 runtimes, **desabilitado quando `SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN` ausente** (no-op, sem erro); `global-error` chama `Sentry.captureException`.

- [ ] **Step 1:** `pnpm add @sentry/nextjs`. Config manual (não o wizard interativo): `sentry.server.config.ts` + `sentry.edge.config.ts` + `instrumentation-client.ts` com `Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN, enabled: !!dsn, tracesSampleRate: 0.1 })`; `instrumentation.ts` que importa os configs conforme o runtime + exporta `onRequestError` do Sentry.
- [ ] **Step 2:** `next.config.ts` — envolver o export com `withSentryConfig(config, { silent: true, ... })` (source maps só com `SENTRY_AUTH_TOKEN`). Preservar todas as keys atuais (images/redirects/headers/webpack/turbopack). Atualizar o **CSP `connect-src`** pra incluir o ingest do Sentry quando habilitado (ex.: `https://*.sentry.io`).
- [ ] **Step 3:** `global-error.tsx` — `'use client'`, `Sentry.captureException(error)` num effect; UI já existe.
- [ ] **Step 4:** `.env.example` — `NEXT_PUBLIC_SENTRY_DSN=`, `SENTRY_AUTH_TOKEN=` (com nota: sem DSN, Sentry é no-op).
- [ ] **Step 5:** Verificar: `pnpm dev` sobe sem erro (sem DSN → Sentry desabilitado, sem crash); `pnpm exec tsc --noEmit` + `pnpm check` limpos; um `pnpm build` conclui (com env vazio). commit `feat(observability): Sentry (client/server/edge), no-op sem DSN`.

---

### Task 2: Banner de consentimento LGPD + gate de scripts

**Files:** Create `src/lib/consent.ts`, `src/providers/ConsentProvider.tsx`, `src/components/consent/CookieBanner.tsx`; Modify `src/app/(frontend)/layout.tsx`.

**Interfaces:** Produces — `ConsentProvider` (estado {necessary:true, analytics, marketing}, persistido em cookie/localStorage 6-12 meses); `useConsent()`; `hasConsent(category)`; `<CookieBanner>` (aceitar tudo / só necessários / preferências) com a marca; textos padrão (ou de `SiteSettings`).

- [ ] **Step 1:** `src/lib/consent.ts` — tipos + leitura/escrita do cookie de consentimento (`semog-consent`), `defaultConsent` (só necessary), helpers `getConsent`/`setConsent`/`hasConsent`.
- [ ] **Step 2:** `ConsentProvider.tsx` (`'use client'`) — carrega o consentimento, expõe via context; `CookieBanner.tsx` — aparece se ainda não há decisão; botões "Aceitar todos", "Só necessários", "Preferências" (toggles de analytics/marketing); links pra `/privacidade`. Estilo com tokens/primitivos, acessível (foco, aria), fixo no rodapé, respeita reduced-motion.
- [ ] **Step 3:** Montar `<ConsentProvider>` + `<CookieBanner>` no `(frontend)/layout.tsx` (dentro do body). (Ainda não há scripts de analytics; o gate `hasConsent('analytics')` fica pronto pra o GTM entrar com os MCPs de Google.)
- [ ] **Step 4:** Verificar ao vivo: banner aparece na 1ª visita; "Aceitar"/"Só necessários" persiste e o banner some; recarregar mantém a decisão; a11y ok. Playwright screenshot. tsc/biome limpos → commit `feat(lgpd): banner de consentimento + gate de scripts`.

---

### Task 3: CI (GitHub Actions)

**Files:** Create `.github/workflows/ci.yml`.

**Interfaces:** Produces — workflow que em `push`/`pull_request` roda: `pnpm install`, `pnpm check` (Biome), `pnpm exec tsc --noEmit`, e `payload generate:types` + `git diff --exit-code` (detecta tipos desatualizados). Node 20, pnpm 10, cache.

- [ ] **Step 1:** `.github/workflows/ci.yml` — job `lint-typecheck`: checkout, setup pnpm/node 20 + cache, `pnpm install --frozen-lockfile`, `pnpm check`, `pnpm exec tsc --noEmit`, `pnpm exec payload generate:types && git diff --exit-code src/payload-types.ts` (env `DATABASE_URI` dummy — generate:types é offline). Não roda build (precisa de secrets) — ou roda `next build` com env dummy se possível; se precisar de DB, pular.
- [ ] **Step 2:** Verificar o YAML (sintaxe válida; `actions/setup-node` + `pnpm/action-setup`). tsc/biome do repo limpos → commit `ci: GitHub Actions (Biome + tsc + generate:types)`.

---

### Task 4: Preview deployments + docs de deploy + `.env.example` final

**Files:** Create `docs/DEPLOY.md`; Modify `.env.example`.

**Interfaces:** Produces — guia de deploy na Vercel (env vars, build command, migrations, preview deployments) e o `.env.example` consolidado com TODAS as variáveis (Supabase, S3, Payload, SEO, SendGrid, Turnstile, Sentry) documentadas.

- [ ] **Step 1:** `docs/DEPLOY.md` — passos Vercel: importar repo, env vars (listar todas + quais são de preview vs prod), build command (`pnpm build`), a nota da **migration** (regenerar limpa antes do 1º deploy — está no ledger), preview deployments por branch/PR (e que o draft/preview do Payload funciona nos previews com o mesmo Supabase), e o domínio `semog.com.br`.
- [ ] **Step 2:** `.env.example` — revisão final consolidando tudo, agrupado por área, com comentários do que é obrigatório vs opcional.
- [ ] **Step 3:** commit `docs: guia de deploy Vercel + .env.example consolidado`.

---

## Self-Review (cobertura)

- **Sentry (no-op sem DSN) + global-error** → Task 1. ✅
- **Banner LGPD + gate** → Task 2. ✅
- **CI** → Task 3. ✅
- **Previews + docs + .env.example** → Task 4. ✅

**Após 4c:** Plano 4 (produção) completo. **Antes do deploy:** regenerar a migration limpa (dívida no ledger) + popular mídia real (precisa das chaves S3 + admin) + **review final do branch inteiro**. **Deploy Vercel.** **Depois:** plugar os MCPs de Google (Search Console / Tag Manager / Ads) — o gate de consentimento já espera o GTM.
