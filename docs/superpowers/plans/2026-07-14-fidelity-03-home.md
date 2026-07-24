# Fidelidade — Onda 3: Home 1:1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: subagent-driven-development. Steps use `- [ ]`.

**Goal:** Deixar a Home (`/`) idêntica a `_reference/index.html` — as 12 seções na ordem exata, com a mídia real religada e as motions-assinatura, construindo os blocos compartilhados que as próximas páginas vão reaproveitar.

**Architecture:** Blocos Payload (`src/blocks/<Nome>/config.ts` schema + `Component.tsx` render), registrados na coleção `Pages` (`src/collections/Pages.ts`, array `layout`/`blocks`) e no mapa `src/blocks/RenderBlocks.tsx`. Motion via primitivos de `src/motion/` (Chars, Fade, Marquee, Reveal, Stagger, Counter, Words, Parallax, Magnetic — todos já existem). Mídia via `getMediaId(payload, filename)` (`src/seed/lib/media.ts`) no seed. Re-seed em `src/seed/home.ts`.

**Tech Stack:** Next 16, Payload 3, GSAP/Lenis, Tailwind v4, `@payloadcms/storage-s3` (mídia já no bucket `media`).

## Global Constraints
- **Fidelidade 1:1 com `_reference/index.html`.** Fonte de verdade: o HTML + `_reference/assets/css/semog.css` (estilo) + `semog.js` (motion). Ordem e conteúdo exatos (ver `.superpowers/sdd/fidelity-diagnosis.md` — o audit completo da home, com seletores/linhas/mídia por seção).
- **Reduced-motion** = política do `semog.js:11-15` (reveals/counters/marquee/headline sempre; smooth-scroll/parallax/word-scrub pesado respeitam o SO via `useReducedHeavy`).
- **Tudo editável no CMS:** cada seção é um bloco com campos; nada de conteúdo hardcoded no Component (vem do bloco). Mídia = campo upload → `getMediaId` no seed.
- **Novos blocos** DEVEM ser registrados em `src/collections/Pages.ts` E em `src/blocks/RenderBlocks.tsx`, e ter os tipos gerados (`pnpm generate:types`).
- **Verde:** biome + tsc + build; e o seed `pnpm seed` roda sem erro.
- **CSS** de interações novas (accordion, pillar-rows, bento hover, prod cards, human parallax, final-cta glow) vai em `src/styles/theme.css` (`@layer utilities`), portado verbatim do `semog.css` (mapear vars → tokens). NÃO editar as regras de chrome/motion que já estão lá.

## Ordem-alvo da Home (de `_reference/index.html`)
Hero → Stats → **Values marquee** → **Manifesto (words)** → **Pilares (hover-rows)** → **Soluções (bento)** → **Produtos (4-card)** → **Banda Garante (vídeo+chip 1%)** → **Cities (accordion)** → **Quote/Human (words+parallax)** → CTA final → Footer.

---

### Task 1: Upgrade do bloco `Hero` (Chars + Fade + vídeo/poster + magnetic)

Audit: hero renderiza mas sem vídeo/poster (→ navy sólido) e com headline por-palavra. Reference: `_reference/index.html` `.hero` — vídeo bg autoplay (`video/hero.mp4`, poster `img/hero-towers.webp`), headline `data-chars` (por-char), lead/CTAs `data-fade`, botões `data-magnetic`.

**Files:** Modify `src/blocks/Hero/config.ts`, `src/blocks/Hero/Component.tsx`. Read: reference `.hero` markup + `semog.css` `.hero`. Primitivos: `src/motion/Chars.tsx`, `Fade.tsx`, `Button` (magnetic já liga em primary).

- [ ] **Step 1:** Confirmar que `config.ts` tem `video`/`poster` (upload) — o audit diz que sim; se faltar, adicionar. 
- [ ] **Step 2:** No `Component.tsx`: headline via `<Chars as="h1">`; eyebrow/subhead/CTAs embrulhados em `<Fade delay=...>` (escalonar delays como o reference); render do `<video autoplay muted loop playsInline poster={posterUrl}>` com `<source src={videoUrl}>` quando houver `video`; fallback poster→navy. Garantir CSP `media-src` (já cobre supabase).
- [ ] **Step 3:** Verificação: build verde; com um seed de teste com vídeo, o hero mostra vídeo + headline anima por caractere + eyebrow/CTA fade-in. (Visual final na review da Home.)
- [ ] **Step 4: Commit** — `feat(hero): per-char headline, fade, bg video/poster wiring`

---

### Task 2: Bloco novo `ValuesMarquee` (faixa de valores)

Reference `.values-strip` (`index.html`): marquee infinito "TRANSPARÊNCIA · RETIDÃO · DINÂMICA".

**Files:** Create `src/blocks/ValuesMarquee/config.ts` + `Component.tsx`. Modify `Pages.ts` + `RenderBlocks.tsx`. Usa `src/motion/Marquee.tsx`.

- [ ] **Step 1:** `config.ts`: campo `items` (array de string) + opcional separador. `Component.tsx`: `<Marquee items={...} />` com o estilo tipográfico da faixa (ler `.values-strip`/`.marquee` no semog.css).
- [ ] **Step 2:** Registrar em `Pages.ts` e `RenderBlocks.tsx`; `pnpm generate:types`.
- [ ] **Step 3:** Verificação: render mostra faixa rolando com os 3 valores. Build verde.
- [ ] **Step 4: Commit** — `feat(blocks): ValuesMarquee strip`

---

### Task 3: Bloco novo `WordsSection` (manifesto — scrub palavra-a-palavra)

Reference `.manifesto` (`index.html`, ~pos 4): parágrafo com `data-words` (opacidade palavra-a-palavra no scroll). Hoje é `richText` plano no fim da página.

**Files:** Create `src/blocks/WordsSection/config.ts` + `Component.tsx`. Modify `Pages.ts` + `RenderBlocks.tsx`. Usa `src/motion/Words.tsx`.

- [ ] **Step 1:** `config.ts`: `eyebrow?`, `text` (textarea). `Component.tsx`: envolve o `text` com `<Words>` (o primitivo já faz o scrub e o fallback reduced-motion). Estilo da seção manifesto do semog.css.
- [ ] **Step 2:** Registrar + types.
- [ ] **Step 3:** Verificação: as palavras entram de 0.14→1 no scroll. Build verde.
- [ ] **Step 4: Commit** — `feat(blocks): WordsSection (manifesto word-scrub)`

---

### Task 4: Bloco novo `Pillars` (linhas com hover)

Reference `.pillars` (`index.html`): 3 `.pillar-row` `data-reveal`, hover-interativo (padding/glyph/cor). Hoje é `featureGrid` de cards.

**Files:** Create `src/blocks/Pillars/config.ts` + `Component.tsx`. Modify `Pages.ts` + `RenderBlocks.tsx` + `theme.css` (regras `.pillar-row` + hover, verbatim do semog.css). Usa `Reveal`.

- [ ] **Step 1:** `config.ts`: `items` (array: `glyph`/número, `title`, `text`). `Component.tsx`: linhas `.pillar-row` com `<Reveal>`, markup fiel; portar CSS de hover (procurar `.pillar-row` no semog.css).
- [ ] **Step 2:** Registrar + types + CSS.
- [ ] **Step 3:** Verificação: 3 linhas, hover muda padding/cor/glyph como no reference. Build verde.
- [ ] **Step 4: Commit** — `feat(blocks): Pillars hover-rows`

---

### Task 5: Bloco novo `SolucoesBento` (bento 1 alto + 2 empilhados, com imagens)

Reference `.solutions` (`index.html`): bento 1 card alto + 2 empilhados, imagens `residencial.webp`/`comercial.webp`/`associacoes.webp`, `data-reveal`, zoom no hover.

**Files:** Create `src/blocks/SolucoesBento/config.ts` + `Component.tsx`. Modify `Pages.ts` + `RenderBlocks.tsx` + `theme.css` (grid bento + hover-zoom). Mídia via campo upload por card.

- [ ] **Step 1:** `config.ts`: `cards` (array: `image` upload, `tag?`, `title`, `text`, `href?`), com marcação de qual é o "tall". `Component.tsx`: grid bento fiel + `next/image` (remotePatterns supabase já cobre) + `Reveal` + hover-zoom (CSS do semog).
- [ ] **Step 2:** Registrar + types + CSS.
- [ ] **Step 3:** Verificação: layout bento, imagens carregam, zoom no hover. Build verde.
- [ ] **Step 4: Commit** — `feat(blocks): SolucoesBento`

---

### Task 6: Bloco novo `ProdutosGrid` (4 cards on-white/on-navy/on-deep)

Reference `.prods.sec-light.white` (`index.html`): 4 `.prod-card` (temas on-white/on-navy/on-deep), imagens `c-prestacao`/`c-garante`/`c-app`/`c-one`, `data-reveal`, hover-lift.

**Files:** Create `src/blocks/ProdutosGrid/config.ts` + `Component.tsx`. Modify `Pages.ts` + `RenderBlocks.tsx` + `theme.css` (temas dos cards + hover-lift). Mídia por card.

- [ ] **Step 1:** `config.ts`: `cards` (array: `image`, `theme` select on-white/on-navy/on-deep, `title`, `text`, `href?`). `Component.tsx`: 4 cards fiéis + Reveal + hover-lift.
- [ ] **Step 2:** Registrar + types + CSS.
- [ ] **Step 3:** Verificação: 4 cards com temas certos, hover-lift. Build verde.
- [ ] **Step 4: Commit** — `feat(blocks): ProdutosGrid 4-card`

---

### Task 7: Upgrade do bloco `Garante` (banda com vídeo + chip "1%")

Reference `.g-band-home` (`index.html`): vídeo bg full-bleed (`video/garante.mp4`, poster `garante.webp`), `data-reveal` eyebrow/h2/CTA, chip de vidro "1%". Hoje: gradiente + 4 steps, sem vídeo.

**Files:** Modify `src/blocks/Garante/config.ts` + `Component.tsx`. Modify `theme.css` se precisar (chip). Read reference `.g-band-home` + `semog.css`.

- [ ] **Step 1:** `config.ts`: adicionar `video`/`poster` (upload) + `priceChip` (ex.: `"1%"` + label). Manter os campos de conteúdo. `Component.tsx`: banda com vídeo bg + overlay + `Reveal` + chip de vidro "1%". (Os 4 "steps" do garante.html continuam existindo no bloco pro uso em /garante — na home o seed usa a variante banda.)
- [ ] **Step 2:** Verificação: banda mostra vídeo garante.mp4 + chip. Build verde.
- [ ] **Step 3: Commit** — `feat(garante): full-bleed bg video + "1%" glass chip`

---

### Task 8: Upgrade do bloco `Cities` (accordion + imagens)

Reference `.cities.sec-light` `.cities-acc` (`index.html`): accordion (hover/tap expande painéis), imagens `recife`/`joao-pessoa`/`campina-grande`/`belem`. Hoje: cards de texto, sem imagem/accordion.

**Files:** Modify `src/blocks/Cities/config.ts` + `Component.tsx`. Modify `theme.css` (accordion). Create (se preciso) `src/motion/Accordion.tsx` (client) OU CSS-only hover. Read reference `.cities-acc` + `semog.css`.

- [ ] **Step 1:** `config.ts`: cada cidade ganha `image` (upload). `Component.tsx`: accordion `.cities-acc` fiel — painéis que expandem no hover (desktop) / tap (mobile); portar CSS. Se precisar de JS (tap mobile), fazer ilha client mínima.
- [ ] **Step 2:** Verificação: painéis expandem, imagens aparecem. Build verde.
- [ ] **Step 3: Commit** — `feat(cities): image accordion (.cities-acc)`

---

### Task 9: Bloco novo `HumanQuote` (citação + parallax)

Reference `.human` (`index.html`): blockquote `data-words` + `.human-media` `data-parallax="8"` (foto `equipe.webp`).

**Files:** Create `src/blocks/HumanQuote/config.ts` + `Component.tsx`. Modify `Pages.ts` + `RenderBlocks.tsx` + `theme.css`. Usa `Words` + `Parallax`.

- [ ] **Step 1:** `config.ts`: `quote` (textarea), `author?`, `image` (upload). `Component.tsx`: `<Words>` no quote + `<Parallax amount={8}>` na foto; layout fiel.
- [ ] **Step 2:** Registrar + types + CSS.
- [ ] **Step 3:** Verificação: quote scrub + foto com parallax. Build verde.
- [ ] **Step 4: Commit** — `feat(blocks): HumanQuote (words + parallax)`

---

### Task 10: Variante centrada do `CTABand` (CTA final)

Reference `.final-cta` (`index.html`): CTA centrado, glow radial, `data-reveal` h2/p/botão, botão magnético. Hoje: banda com borda-gradiente.

**Files:** Modify `src/blocks/CTABand/config.ts` (add `variant: 'band' | 'centered'`) + `Component.tsx` + `theme.css` (glow). Read reference `.final-cta`.

- [ ] **Step 1:** Adicionar `variant`. Na variante `centered`: layout centrado + glow radial + `Reveal` + `Button` magnético.
- [ ] **Step 2:** Verificação: variante centrada bate com o reference; a `band` (usada noutras páginas) intacta. Build verde.
- [ ] **Step 3: Commit** — `feat(cta): centered final-cta variant with radial glow`

---

### Task 11: Re-seed da Home (ordem exata + mídia)

**Files:** Rewrite `src/seed/home.ts`. Read: `_reference/index.html` (conteúdo real de cada seção), `.superpowers/sdd/fidelity-diagnosis.md`, `src/seed/lib/media.ts` (`getMediaId`).

- [ ] **Step 1:** Reescrever o array de blocos na ORDEM-alvo (acima), cada bloco com o conteúdo textual real do reference e mídia via `getMediaId(payload, '<arquivo>.webp'|'.mp4')` (hero.mp4/hero-towers.webp, residencial/comercial/associacoes, c-prestacao/c-garante/c-app/c-one, garante.mp4/garante.webp, recife/joao-pessoa/campina-grande/belem, equipe.webp). Idempotente (padrão atual).
- [ ] **Step 2:** `pnpm seed` roda sem erro; a home no DB tem os 11 blocos na ordem certa com mídia.
- [ ] **Step 3:** Verificação: build + seed verdes.
- [ ] **Step 4: Commit** — `feat(seed): home 1:1 exact order + wired media`

---

## Self-Review
- Cobre as 12 seções da home do `fidelity-diagnosis.md` (footer = Onda 1). Blocos novos: ValuesMarquee, WordsSection, Pillars, SolucoesBento, ProdutosGrid, HumanQuote (+ variante CTA). Upgrades: Hero, Garante, Cities. Todos reutilizáveis nas próximas páginas.
- Registro de bloco (Pages.ts + RenderBlocks.tsx + generate:types) explícito em cada task de bloco novo.
- Dependência de mídia resolvida (Onda 2, `getMediaId`).
- Verificação visual fiel fica pra review da Home (Playwright vs `_reference/index.html`), como manda o fidelity-master.
