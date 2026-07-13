# Semog Fase 0 · Plano 3d — Páginas restantes & blocos finais

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Completar os blocos que faltam (Showcase/Prestação, Semog One, Benefícios, ContactInfo) e portar as páginas restantes: administração de condomínios, Semog Garante, incorporadoras, contato, proposta e as 4 landings de cidade — todas como docs `pages` do CMS.

**Architecture:** Mesmo padrão consolidado: bloco = `src/blocks/<Nome>/config.ts` + `Component.tsx` (primitivos do Plano 2 + motion), registrado em `Pages.ts` `layout.blocks` **E** no mapa `RenderBlocks.tsx`. Páginas = seed idempotente em `src/seed/pages.ts` (upsert por slug). Banco vivo. Verificação ao vivo com Playwright. Formulários de contato/proposta entram como **estrutura/placeholder** aqui; a submissão funcional (Turnstile + SendGrid + RHF/Zod) é do **Plano 4**.

**Tech Stack:** Payload 3, Next 16, Tailwind v4 + primitivos, Local API (seed).

## Global Constraints

- pnpm 10.12.4; Node v22; Windows. Banco vivo (schema `cms`).
- **Todo bloco novo → registrar em Pages.layout E no mapa RenderBlocks.** Reusar primitivos; fidelidade ao `_reference/` (nunca editar).
- Sem mídia/S3: imagens viram placeholder. Formulário de contato/proposta = UI estática (sem submit real) — Plano 4 liga a lógica.
- pt-BR; slugs = nomes dos arquivos `_reference` sem `.html`: `administracao-de-condominios`, `garante`, `incorporadoras`, `contato`, `proposta`, `administradora-de-condominios-recife|joao-pessoa|campina-grande|belem`.
- Biome `check` = 0 e `tsc --noEmit` limpo antes de cada commit; cada task em commit próprio; verificar com Playwright.

## Mapa de arquivos

- `src/blocks/{Showcase,Benefits,ContactInfo}/{config.ts,Component.tsx}` (novos) + registro em `Pages.ts`/`RenderBlocks.tsx`.
- `src/seed/pages.ts` (estender com as novas páginas).

---

### Task 1: Blocos Showcase, Benefits, ContactInfo

**Files:** Create `src/blocks/{Showcase,Benefits,ContactInfo}/{config.ts,Component.tsx}`; modify `Pages.ts`, `RenderBlocks.tsx`.

**Interfaces:** Produces:
- `showcase` (`ShowcaseBlock`): `eyebrow?`, `title`, `text?`, `features[]{title,description}`, `cta?{label,href}`, `mediaSide?` (select left|right) — seção split genérica com um **placeholder** de mídia de um lado (cobre Prestação de contas e Semog One).
- `benefits` (`BenefitsBlock`): `eyebrow?`, `title?`, `items[]{title,description}` — grid de perks (Clube de benefícios).
- `contactInfo` (`ContactInfoBlock`): `eyebrow?`, `title?`, `items[]{city,uf,address,phone}`, `whatsapp?` — cartões de contato por unidade (pode ser semeado a partir do `Company` global; aqui os campos vêm no bloco).

- [ ] **Step 1:** `Showcase` block (split com placeholder de mídia, features, cta; `mediaSide` alterna lado) — registrar + `generate:types`.
- [ ] **Step 2:** `Benefits` block (grid de perks) — registrar + `generate:types`.
- [ ] **Step 3:** `ContactInfo` block (cartões de unidade + botão WhatsApp) — registrar + `generate:types`.
- [ ] **Step 4:** tsc/biome limpos; probe opcional (deletar) → commit `feat(blocks): Showcase, Benefits e ContactInfo`.

---

### Task 2: Páginas "Administração de condomínios" e "Semog Garante"

**Files:** Modify `src/seed/pages.ts`.

**Interfaces:** Produces — docs `pages`:
- `administracao-de-condominios`: Hero + FeatureGrid (o que inclui) + Showcase (Prestação de contas) + Faq + CTABand — conteúdo de `_reference/administracao-de-condominios.html`.
- `garante`: Hero + Garante (detalhado) + Showcase/FeatureGrid (como funciona) + Faq + CTABand — conteúdo de `_reference/garante.html`.

- [ ] **Step 1:** Adicionar as 2 páginas ao seed (compondo blocos existentes + Showcase), conteúdo fiel ao `_reference`.
- [ ] **Step 2:** `pnpm seed:pages`; verificar `/administracao-de-condominios` e `/garante` (Playwright). 
- [ ] **Step 3:** tsc/biome → commit `feat(cms): páginas Administração de condomínios e Semog Garante`.

---

### Task 3: Páginas "Incorporadoras", "Contato" e "Proposta"

**Files:** Modify `src/seed/pages.ts`.

**Interfaces:** Produces — docs `pages`:
- `incorporadoras`: Hero + FeatureGrid + Showcase + Registros + CTABand — de `_reference/incorporadoras.html`.
- `contato`: Hero + ContactInfo (unidades) + **placeholder de formulário** (RichText ou uma seção "Fale com a gente" marcada como Plano 4) — de `_reference/contato.html`.
- `proposta`: Hero + **placeholder de formulário de proposta** + benefícios/prova social — de `_reference/proposta.html`. (Form real = Plano 4.)

- [ ] **Step 1:** Adicionar as 3 páginas ao seed. Para contato/proposta, usar `ContactInfo` + um bloco de texto claro indicando onde o formulário entra (Plano 4) — não construir submit falso.
- [ ] **Step 2:** `pnpm seed:pages`; verificar `/incorporadoras`, `/contato`, `/proposta` (Playwright).
- [ ] **Step 3:** tsc/biome → commit `feat(cms): páginas Incorporadoras, Contato e Proposta (shells)`.

---

### Task 4: Landings de cidade (Recife, João Pessoa, Campina Grande, Belém)

**Files:** Modify `src/seed/pages.ts`.

**Interfaces:** Produces — 4 docs `pages` (`administradora-de-condominios-<cidade>`), composição compartilhada parametrizada por cidade: Hero (com a cidade), FeatureGrid (serviços locais), Depoimentos (locais), Registros, ContactInfo (unidade da cidade), CTABand — conteúdo de `_reference/administradora-de-condominios-*.html`.

- [ ] **Step 1:** Uma função `seedCityLanding({ slug, city, uf, ... })` idempotente, chamada 4x com os dados de cada cidade (do `_reference`).
- [ ] **Step 2:** `pnpm seed:pages`; verificar as 4 rotas (Playwright em pelo menos 1, HTTP 200 nas 4).
- [ ] **Step 3:** tsc/biome → commit `feat(cms): landings de cidade (Recife, João Pessoa, Campina Grande, Belém)`.

---

## Self-Review (cobertura)

- **Blocos Showcase/Benefits/ContactInfo** → Task 1. ✅
- **Administração + Garante** → Task 2. ✅
- **Incorporadoras + Contato + Proposta (shells)** → Task 3. ✅
- **4 landings de cidade** → Task 4. ✅

**Após este plano, todas as 16 páginas do `_reference` estarão portadas.** **Continuação:** mídia real (hero vídeo, fotos, app, avatares) quando as chaves S3 existirem. **Plano 4:** formulários funcionais (contato/proposta) + Turnstile + SendGrid/React Email, Sentry, LGPD, SEO (metadata/sitemap/robots/OG/301), security headers, CI, previews. Depois: review final + deploy Vercel + MCPs Google.
