# Semog Fase 0 · Plano 3b — Globals reais & Home em fidelidade total

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Popular os Globals (Header/Footer/Company/SiteSettings) para o site mostrar navegação/rodapé reais (fim do fallback), elevar a home à fidelidade do `_reference/index.html` (eyebrows/títulos de seção, prefixo "+", seções faltantes) e adicionar os blocos "Semog Garante" e "Cidades".

**Architecture:** Segue o padrão já estabelecido no Plano 3 — cada bloco novo = `src/blocks/<Nome>/config.ts` (com `slug` + `interfaceName` + fields) + `Component.tsx` (usando os primitivos do Plano 2 + motion), registrado em `Pages.layout` e depois `payload generate:types`. Globals e home populados via seed idempotente (estende `src/seed/`). Banco está vivo (`.env` com `cms_user`); verificação é ao vivo com Playwright.

**Tech Stack:** Payload 3, Next 16, Tailwind v4 + primitivos do Plano 2, Local API (seed).

## Global Constraints

- pnpm 10.12.4; Node v22; Windows. Banco vivo (schema `cms`).
- Reusar primitivos do Plano 2; **fidelidade ao `_reference/index.html`** (nunca editar `_reference/`).
- Sem mídia/S3 ainda: nada de upload; blocos com imagem usam placeholder/omitem a imagem até as chaves S3 existirem (a home hero segue sem vídeo).
- Conteúdo pt-BR; slugs sem acento.
- Biome `check` = 0 e `tsc --noEmit` limpo antes de cada commit. Cada task termina em commit próprio. Verificar cada task com Playwright screenshot no scratchpad.

## Mapa de arquivos

- `src/seed/globals.ts` (novo) — popular Header/Footer/Company/SiteSettings.
- `src/seed/home.ts` (modificar) — home à fidelidade total.
- `src/blocks/Garante/{config.ts,Component.tsx}`, `src/blocks/Cities/{config.ts,Component.tsx}` (novos), registrados em `Pages.ts`.
- `src/blocks/Stats/config.ts` + `Component.tsx` (modificar): campo `eyebrow?`/`title?` e `prefix?` por item.
- Header/Footer server components já leem os globals (Plano 3) — só popular os dados.

---

### Task 1: Seed dos Globals (Header, Footer, Company, SiteSettings)

**Files:** Create `src/seed/globals.ts`; modify `package.json` (script `seed:globals` ou incluir no `seed`).

**Interfaces:** Produces — função idempotente que faz `payload.updateGlobal` para os 4 globals com o conteúdo do `_reference` (nav, colunas do rodapé, cidades/registros, SEO default).

- [ ] **Step 1: `src/seed/globals.ts`** — `updateGlobal({ slug:'header', data:{ navItems:[{label:'A Semog',href:'/semog'},{label:'Soluções',href:'/solucoes'},{label:'Incorporadoras',href:'/incorporadoras'},{label:'Blog',href:'/blog'},{label:'Contato',href:'/contato'}], cta:{label:'Solicitar proposta',href:'/proposta'} } })`. Footer: colunas (Soluções, Empresa, Legal) com links do `_reference` + `bottomText`. Company: 4 endereços (Recife/João Pessoa/Campina Grande/Belém) com placeholders + `whatsapp`. SiteSettings: `defaultTitle`/`defaultDescription` do `_reference/index.html` (`<title>`/meta description).
- [ ] **Step 2: Script** — `"seed:globals": "cross-env NODE_OPTIONS=--no-deprecation payload run src/seed/globals.ts"` (e opcionalmente chamar globals dentro do `seed`).
- [ ] **Step 3: Rodar** — `pnpm seed:globals`; confirmar via log/SQL que os globals têm dados.
- [ ] **Step 4: Verificar** — `pnpm dev` → `/` → Playwright screenshot; o header agora mostra o nav do global (não o fallback) e o footer as colunas reais. Screenshot em `scratchpad/globals-seeded.png`.
- [ ] **Step 5:** `pnpm check && pnpm exec tsc --noEmit` limpos → commit `feat(cms): seed dos globals (header/footer/company/site-settings)`.

---

### Task 2: Stats com eyebrow/título e prefixo "+"

**Files:** Modify `src/blocks/Stats/config.ts`, `src/blocks/Stats/Component.tsx`.

**Interfaces:** Produces — Stats ganha `eyebrow?`, `title?` e cada item ganha `prefix?` (ex.: "+"). Component renderiza o header da seção (se houver) e `{prefix}{Counter}{suffix}`.

- [ ] **Step 1:** Adicionar `eyebrow` (text, opcional) e `title` (text, opcional) ao `Stats/config.ts`; adicionar `prefix` (text, opcional) ao item de `items`. `generate:types`.
- [ ] **Step 2:** No `Component.tsx`, renderizar `<Eyebrow>`+`<h2>` se presentes (padrão `sec-head` do `_reference`), e no valor `{prefix}<Counter/>{suffix}` (fiel a `_reference/index.html:521-533`, onde 700/70mil/100 têm `+`).
- [ ] **Step 3:** Verificar tipos/Biome; probe/Playwright mostrando "700+" etc. (pode validar junto do re-seed na Task 4).
- [ ] **Step 4:** commit `feat(blocks): Stats com eyebrow/título e prefixo por item`.

---

### Task 3: Bloco "Semog Garante"

**Files:** Create `src/blocks/Garante/{config.ts,Component.tsx}`; modify `Pages.ts` (registrar).

**Interfaces:** Produces — bloco `garante` (`interfaceName:'GaranteBlock'`): `eyebrow?`, `title`, `text?`, `features` array {title, description}, `cta?` {label,href}, `note?`. Component: seção destaque (fundo `--grad-band` ou card) com `Reveal`/`Stagger`, fiel à seção "Semog Garante" de `_reference/garante.html`/`index.html`. Sem imagem (vídeo `garante.mp4` entra com S3 depois).

- [ ] **Step 1:** `config.ts` com os fields acima + `interfaceName`. Registrar em `Pages.layout`. `generate:types`.
- [ ] **Step 2:** `Component.tsx` usando `Section`/`Container`/`Eyebrow`/`Button`/`Reveal`, com a lista de garantias (inadimplência zero etc. do `_reference`).
- [ ] **Step 3:** tipos/Biome limpos → commit `feat(blocks): bloco Semog Garante`.

---

### Task 4: Bloco "Cidades" + re-seed da home em fidelidade total

**Files:** Create `src/blocks/Cities/{config.ts,Component.tsx}`; modify `Pages.ts` (registrar), `src/seed/home.ts` (fidelidade).

**Interfaces:** Produces — bloco `cities` (`interfaceName:'CitiesBlock'`): `eyebrow?`, `title?`, `items` array {city, uf, role?} (as 4 unidades). Component: grid/cards de cidade (sem foto por ora — placeholder com o nome), fiel à seção de cidades do `_reference`. E a home re-semeada com: Hero, Stats (com eyebrow/título/"+"), Garante, FeatureGrid (pilares), Cities, CTABand, RichText — cobrindo as seções principais do `_reference/index.html`.

- [ ] **Step 1:** `Cities/config.ts` + `Component.tsx`; registrar; `generate:types`.
- [ ] **Step 2:** Atualizar `src/seed/home.ts`: adicionar `garante` e `cities`, e os `eyebrow`/`title`/`prefix` do Stats, com o conteúdo do `_reference/index.html`. Idempotente (upsert por slug 'home').
- [ ] **Step 3:** `pnpm seed` → `pnpm dev` → `/` → Playwright screenshot `scratchpad/home-fidelidade.png`. Comparar com `_reference/index.html` (servir em :8347 se ajudar): as seções batem em ordem/estrutura/estilo.
- [ ] **Step 4:** tipos/Biome limpos → commit `feat(cms): bloco Cidades e home em fidelidade total`.

---

## Self-Review (cobertura)

- **Globals reais (fim do fallback)** → Task 1. ✅
- **Stats fidelidade (eyebrow/título/"+")** → Task 2. ✅
- **Semog Garante** → Task 3. ✅
- **Cidades + home completa** → Task 4. ✅

**Continuação (Plano 3c):** blocos restantes (Depoimentos, FAQ, Registros/selos, App showcase, BlogList) e o port das outras 15 páginas; mídia (hero vídeo, fotos) quando as chaves S3 existirem. **Plano 4:** formulários, Sentry, LGPD, SEO, security headers, CI, previews.
