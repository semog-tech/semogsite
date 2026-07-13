# Semog Fase 0 · Plano 4a — SEO, páginas de erro & segurança

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Blindar o site para produção sem depender de credenciais externas: SEO por página (Metadata API + plugin-seo), sitemap/robots dinâmicos, OG images dinâmicas, 301 dos URLs `.html` antigos, security headers, páginas de erro/loading e um ajuste de a11y.

**Architecture:** Metadata via `generateMetadata` nas rotas lendo campos de SEO das collections (plugin-seo). `sitemap.ts`/`robots.ts` gerados da Local API. OG via `opengraph-image.tsx` (`next/og`). 301 via `next.config` `redirects()`. Headers via `next.config` `headers()`. Páginas de erro do App Router. Banco vivo.

**Tech Stack:** Payload 3 + `@payloadcms/plugin-seo`, Next 16 (Metadata API, `next/og`, redirects/headers), Tailwind.

## Global Constraints

- pnpm 10.12.4; Node v22; Windows. Banco vivo (schema `cms`). Reusar primitivos do Plano 2; nunca editar `_reference/`.
- Sem credenciais externas neste plano. Sem mídia/S3 (OG usa render `next/og`, não upload).
- pt-BR. Biome `check` = 0 e `tsc --noEmit` limpo antes de cada commit; cada task em commit próprio; verificar ao vivo (Playwright/curl) o que der.

## Mapa de arquivos

- `src/payload.config.ts` (plugin-seo em Pages/Posts) → `generate:types`.
- `src/app/(frontend)/[[...slug]]/page.tsx` e `blog/[slug]/page.tsx` (`generateMetadata`).
- `src/app/(frontend)/sitemap.ts`, `robots.ts`, `opengraph-image.tsx` (+ por rota conforme necessário).
- `src/lib/seo.ts` (helper de metadata/fallback).
- `next.config.ts` (redirects 301 + headers).
- `src/app/(frontend)/{not-found,error,global-error,loading}.tsx`.
- `src/styles/theme.css` (ajuste `--text-3` no `.sec-light`).

---

### Task 1: plugin-seo + Metadata API por página

**Files:** Modify `src/payload.config.ts`, `src/app/(frontend)/[[...slug]]/page.tsx`, `src/app/(frontend)/blog/[slug]/page.tsx`; Create `src/lib/seo.ts`.

**Interfaces:** Produces — campos `meta` (title/description/image) editáveis em Pages e Posts (plugin-seo); `generateMetadata` por rota com fallback (meta do doc → título do doc + `SiteSettings.defaultTitle/description`).

- [ ] **Step 1:** `pnpm add @payloadcms/plugin-seo`; registrar `seoPlugin({ collections: ['pages','posts'], uploadsCollection: 'media', generateTitle, generateDescription })` no `payload.config.ts`. `generate:types`.
- [ ] **Step 2:** `src/lib/seo.ts` — `buildMetadata({ doc, settings, path })` que monta o objeto `Metadata` do Next (title, description, openGraph, alternates.canonical) a partir de `doc.meta` com fallback pra `SiteSettings` e pro título do doc.
- [ ] **Step 3:** `generateMetadata` no catch-all (`[[...slug]]`) — busca a page, chama `buildMetadata`. Idem em `blog/[slug]`. Preserva o JSON-LD Organization/WebSite (do `_reference/index.html`) na home.
- [ ] **Step 4:** Verificar: `curl -s localhost:3000/solucoes | grep -i '<title>'` mostra o título da página (não mais genérico); `/` mantém o JSON-LD. tsc/biome limpos → commit `feat(seo): plugin-seo + generateMetadata por página`.

---

### Task 2: sitemap.ts + robots.ts dinâmicos

**Files:** Create `src/app/(frontend)/sitemap.ts`, `src/app/(frontend)/robots.ts`.

**Interfaces:** Produces — `/sitemap.xml` das pages+posts publicados (via Local API) e `/robots.txt` apontando pro sitemap.

- [ ] **Step 1:** `sitemap.ts` — lista slugs de `pages` (`_status published`) + `posts` → URLs absolutas (base de `SiteSettings` ou env `NEXT_PUBLIC_SITE_URL`), com `lastModified`.
- [ ] **Step 2:** `robots.ts` — allow `/`, disallow `/admin`, `sitemap` apontando pro sitemap.
- [ ] **Step 3:** Verificar `/sitemap.xml` e `/robots.txt` (curl, 200 + conteúdo). tsc/biome → commit `feat(seo): sitemap.ts e robots.ts dinâmicos`.

---

### Task 3: OG images dinâmicas (next/og)

**Files:** Create `src/app/(frontend)/opengraph-image.tsx` (default) e por rota conforme necessário (ex.: `[[...slug]]/opengraph-image.tsx`, `blog/[slug]/opengraph-image.tsx`).

**Interfaces:** Produces — cards OG 1200×630 renderizados com `next/og` (`ImageResponse`), com o título do doc + marca Semog (paleta navy/ice), sem depender de upload.

- [ ] **Step 1:** OG default (marca Semog) + por-rota lendo o título do doc via Local API. Usar as fontes/cores da marca (pode embutir a fonte woff2 self-hosted).
- [ ] **Step 2:** Verificar `/opengraph-image` e `/solucoes/opengraph-image` retornam PNG 200 (curl -I). tsc/biome → commit `feat(seo): OG images dinâmicas (next/og)`.

---

### Task 4: 301 dos URLs `.html` antigos

**Files:** Modify `next.config.ts` (`redirects()`).

**Interfaces:** Produces — 301 permanente de cada `/*.html` do `_reference` pra rota limpa (`/index.html`→`/`, `/semog.html`→`/semog`, `/administradora-de-condominios-recife.html`→`/administradora-de-condominios-recife`, etc.), preservando SEO.

- [ ] **Step 1:** `redirects()` com o mapa completo das 16 páginas `.html` → rotas (permanent: true). Incluir `/index.html` → `/`.
- [ ] **Step 2:** Verificar: `curl -sI localhost:3000/semog.html` → 308/301 Location `/semog`; idem 2-3 outras. tsc/biome → commit `feat(seo): 301 dos URLs .html antigos`.

---

### Task 5: Security headers

**Files:** Modify `next.config.ts` (`headers()`).

**Interfaces:** Produces — headers de segurança em todas as respostas: `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN` (ou frame-ancestors), `Permissions-Policy` restritiva. CSP: baseline compatível com o app (imagens do Supabase, fontes self-hosted) — documentar que será endurecida quando Turnstile/Sentry/analytics entrarem (Plano 4b/4c), usando `Content-Security-Policy-Report-Only` se o CSP estrito quebrar o Next.

- [ ] **Step 1:** `headers()` com os headers acima aplicados a `/(.*)`. CSP baseline (self, `img-src` inclui o host do Supabase Storage, `font-src 'self'`), começando em Report-Only se necessário pra não quebrar o admin/hidratação do Next.
- [ ] **Step 2:** Verificar `curl -sI localhost:3000/` mostra os headers; o site e `/admin` continuam funcionando. tsc/biome → commit `feat(security): security headers + CSP baseline`.

---

### Task 6: Páginas de erro/loading + ajuste de a11y

**Files:** Create `src/app/(frontend)/{not-found,error,global-error,loading}.tsx`; Modify `src/styles/theme.css`.

**Interfaces:** Produces — 404/500/loading com a marca; ajuste do `--text-3` no `.sec-light` pra passar contraste AA em texto pequeno.

- [ ] **Step 1:** `not-found.tsx` (404 com Header/Footer + link home), `error.tsx` (client, botão "tentar de novo"), `global-error.tsx` (raiz), `loading.tsx` (skeleton). Usar os primitivos e tokens.
- [ ] **Step 2:** No `theme.css`, escurecer `--text-3` no `.sec-light` (ex.: `#5a6488`) pra bylines pequenas passarem AA (>=4.5:1 em texto normal). Verificar contraste (Playwright) sem quebrar as demais.
- [ ] **Step 3:** Verificar `/rota-inexistente` → 404 branded; tsc/biome → commit `feat(ux): páginas de erro/loading e ajuste de contraste a11y`.

---

## Self-Review (cobertura)

- **Metadata por página + plugin-seo** → Task 1. ✅
- **sitemap/robots** → Task 2. ✅
- **OG dinâmico** → Task 3. ✅
- **301 dos .html** → Task 4. ✅
- **Security headers/CSP** → Task 5. ✅
- **Páginas de erro + a11y** → Task 6. ✅

**Plano 4b (precisa de chaves):** formulários contato/proposta (Form Builder + RHF/Zod + Server Actions) + **Turnstile** (chaves de teste da Cloudflare no dev) + rate limit + **SendGrid/React Email** (envio real difere pra chave). **Plano 4c:** **Sentry** (DSN difere), **banner LGPD** (gate de scripts), **CI** (GitHub Actions), **preview deployments**. Depois: regenerar migration limpa + review final + deploy Vercel + MCPs Google.
