# Semog Fase 0 · Plano 3c — Blocos restantes & primeiras páginas

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Completar a biblioteca de blocos (Depoimentos, FAQ, Registros/selos, App, BlogList), habilitar o blog (rota de post + seed de posts/categorias) e portar o primeiro lote de páginas (legais + "A Semog" + "Soluções") como docs `pages` compostos por blocos.

**Architecture:** Mesmo padrão já consolidado: bloco = `src/blocks/<Nome>/config.ts` (`slug` + `interfaceName` + fields) + `Component.tsx` (primitivos do Plano 2 + motion), registrado em `src/collections/Pages.ts` `layout.blocks` **E** no mapa de `src/blocks/RenderBlocks.tsx` (senão renderiza nada). Páginas = seed idempotente de docs `pages` por slug. Banco vivo. Verificação ao vivo com Playwright.

**Tech Stack:** Payload 3, Next 16, Tailwind v4 + primitivos, Local API (seed), rota `/blog/[slug]`.

## Global Constraints

- pnpm 10.12.4; Node v22; Windows. Banco vivo (schema `cms`).
- **Todo bloco novo entra em Pages.layout E no mapa RenderBlocks.** Reusar primitivos do Plano 2; fidelidade ao `_reference/` (nunca editar).
- Sem mídia/S3: blocos com imagem usam placeholder/omitem foto (hero de post, app, avatares) até as chaves S3.
- pt-BR; slugs sem acento (as rotas batem os nomes dos arquivos do `_reference` sem `.html`: `/semog`, `/solucoes`, `/privacidade`, `/termos`, `/blog`).
- Biome `check` = 0 e `tsc --noEmit` limpo antes de cada commit; cada task em commit próprio; verificar com Playwright screenshot no scratchpad.

## Mapa de arquivos

- `src/blocks/{Testimonials,Faq,Registros,AppShowcase,BlogList}/{config.ts,Component.tsx}` (novos) + registro em `Pages.ts` e `RenderBlocks.tsx`.
- `src/app/(frontend)/blog/[slug]/page.tsx` (rota de post).
- `src/lib/payload.ts` — helper `getPostBySlug`/`getRecentPosts`.
- `src/seed/posts.ts` (posts + categorias), `src/seed/pages.ts` (páginas legais + sobre + soluções).

---

### Task 1: Blocos Depoimentos (Testimonials) + FAQ

**Files:** Create `src/blocks/Testimonials/{config.ts,Component.tsx}`, `src/blocks/Faq/{config.ts,Component.tsx}`; modify `Pages.ts`, `RenderBlocks.tsx`.

**Interfaces:** Produces — `testimonials` (`TestimonialsBlock`: eyebrow?/title?/items[]{quote, author, role?}) e `faq` (`FaqBlock`: eyebrow?/title?/items[]{question, answer}).

- [ ] **Step 1:** `Testimonials/config.ts` + `Component.tsx` — grid de cards de citação (sem avatar). Registrar em Pages.ts + RenderBlocks. `generate:types`.
- [ ] **Step 2:** `Faq/config.ts` + `Component.tsx` — accordion com `<details>/<summary>` nativo (funciona sem JS; ícone "+" fiel ao `_reference` `.faq .plus`). Registrar em Pages.ts + RenderBlocks. `generate:types`.
- [ ] **Step 3:** tsc/biome limpos; probe opcional (deletar) → commit `feat(blocks): Depoimentos e FAQ`.

---

### Task 2: Blocos Registros (selos) + AppShowcase

**Files:** Create `src/blocks/Registros/{config.ts,Component.tsx}`, `src/blocks/AppShowcase/{config.ts,Component.tsx}`; modify `Pages.ts`, `RenderBlocks.tsx`.

**Interfaces:** Produces — `registros` (`RegistrosBlock`: title?/items[]{label}) faixa/strip de registros (CRECI/ABADI/Secovi); `appShowcase` (`AppShowcaseBlock`: eyebrow?/title/text?/features[]{title,description}/cta?) — seção do app com placeholder no lugar do print (`app-phone.webp` entra com S3).

- [ ] **Step 1:** `Registros` block (strip horizontal de selos, `Container`) + registrar + `generate:types`.
- [ ] **Step 2:** `AppShowcase` block (texto + lista de features + bloco placeholder do telefone) + registrar + `generate:types`.
- [ ] **Step 3:** tsc/biome limpos → commit `feat(blocks): Registros e AppShowcase`.

---

### Task 3: Blog — BlogList block + rota de post + seed de posts/categorias

**Files:** Create `src/blocks/BlogList/{config.ts,Component.tsx}`, `src/app/(frontend)/blog/[slug]/page.tsx`, `src/seed/posts.ts`; modify `src/lib/payload.ts`, `Pages.ts`, `RenderBlocks.tsx`, `package.json`.

**Interfaces:** Produces — `getRecentPosts(limit)`/`getPostBySlug(slug)`; `blogList` (`BlogListBlock`: title?/limit?) — server component que busca posts publicados e renderiza cards (sem hero image por ora); rota `/blog/[slug]` que renderiza `title` + `content` (RichText) do post; seed de 2-3 posts + categorias.

- [ ] **Step 1:** `src/lib/payload.ts` — `getRecentPosts(limit=6)` e `getPostBySlug(slug)` (Local API, `_status published`, depth 1).
- [ ] **Step 2:** `BlogList` block (async server component usando `getRecentPosts`, cards com título/excerpt/data/categoria, link `/blog/<slug>`). Registrar em Pages.ts + RenderBlocks. `generate:types`.
- [ ] **Step 3:** `src/app/(frontend)/blog/[slug]/page.tsx` — `getPostBySlug`, `notFound()` se não achar; renderiza `<Container>` + título + `<RichText data={content}/>`. (Rota mais específica que o catch-all `[[...slug]]`.)
- [ ] **Step 4:** `src/seed/posts.ts` — 2-3 categorias + 2-3 posts (títulos/excerpts do `_reference/blog.html`), `_status:'published'`; script `seed:posts`. Rodar.
- [ ] **Step 5:** Verificar ao vivo: uma página `pages` 'blog' com o bloco `blogList` (semear) → `/blog` lista os posts; clicar leva a `/blog/<slug>` renderizado. Playwright screenshot `scratchpad/blog.png`. tsc/biome limpos → commit `feat(blog): BlogList, rota de post e seed de posts`.

---

### Task 4: Páginas legais (Privacidade, Termos)

**Files:** Modify/Create `src/seed/pages.ts`; script `seed:pages`.

**Interfaces:** Produces — docs `pages` slug `privacidade` e `termos`, compostos de um Hero simples + RichText (conteúdo de `_reference/privacidade.html` e `termos.html`).

- [ ] **Step 1:** `src/seed/pages.ts` idempotente (upsert por slug) criando `privacidade` e `termos` com Hero (título) + RichText (corpo do `_reference`). Script `"seed:pages"`.
- [ ] **Step 2:** Rodar; verificar `/privacidade` e `/termos` renderizam (Playwright). Prova o roteamento multi-página do catch-all.
- [ ] **Step 3:** tsc/biome limpos → commit `feat(cms): páginas legais (privacidade, termos)`.

---

### Task 5: Páginas "A Semog" e "Soluções"

**Files:** Modify `src/seed/pages.ts` (adicionar as 2 páginas).

**Interfaces:** Produces — docs `pages` slug `semog` (sobre: Hero + Stats + FeatureGrid/valores + Cities + CTA) e `solucoes` (Hero + FeatureGrid de serviços + Registros + FAQ + CTA), compostos dos blocos existentes, conteúdo do `_reference/semog.html` e `solucoes.html`.

- [ ] **Step 1:** Adicionar `semog` e `solucoes` ao `src/seed/pages.ts`, compondo blocos com o conteúdo do `_reference`.
- [ ] **Step 2:** Rodar `pnpm seed:pages`; verificar `/semog` e `/solucoes` (Playwright screenshots). Conferir fidelidade de seções vs `_reference`.
- [ ] **Step 3:** tsc/biome limpos → commit `feat(cms): páginas A Semog e Soluções`.

---

## Self-Review (cobertura)

- **Depoimentos + FAQ** → Task 1. ✅
- **Registros + AppShowcase** → Task 2. ✅
- **Blog (bloco + rota + seed)** → Task 3. ✅
- **Páginas legais** → Task 4. ✅
- **A Semog + Soluções** → Task 5. ✅

**Continuação (Plano 3d):** páginas restantes (administracao-de-condominios, garante, incorporadoras, contato, proposta, 4 landings de cidade); mídia real (hero vídeo, fotos, app, avatares) quando as chaves S3 existirem. **Plano 4:** formulários (contato/proposta) + Turnstile + SendGrid, Sentry, LGPD, SEO (metadata/sitemap/robots/OG/301), security headers, CI, previews.
