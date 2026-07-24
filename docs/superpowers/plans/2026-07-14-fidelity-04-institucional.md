# Fidelidade — Onda 4: Institucional (/semog + /solucoes) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: subagent-driven-development. Steps use `- [ ]`. Modelo dos implementadores: **sonnet** (opus instável).

**Goal:** Deixar `/semog` idêntica a `_reference/semog.html` e `/solucoes` idêntica a `_reference/solucoes.html`, reaproveitando os blocos da home e construindo o que falta.

**Architecture:** Igual à Onda 3 — blocos Payload (`src/blocks/<Nome>/`) registrados em `src/collections/Pages.ts` + `src/blocks/RenderBlocks.tsx` (+ `pnpm generate:types`), motion de `src/motion/`, mídia via `getMediaId` no seed. Re-seed em `src/seed/pages.ts` (as páginas `/semog` e `/solucoes`).

**Tech Stack:** Next 16, Payload 3, GSAP/Lenis, Tailwind v4.

## Global Constraints
- **Fidelidade 1:1.** Fonte: `_reference/semog.html`, `_reference/solucoes.html` + `semog.css`/`semog.js`. Spec detalhado por seção: `.superpowers/sdd/audit-semog-solucoes.md` (LER primeiro).
- Reduced-motion: política do `semog.js:11-15` (`useReducedHeavy`).
- Tudo editável no CMS (blocos + campos); mídia via `getMediaId`; sem conteúdo hardcoded.
- Novos blocos: registrar em Pages.ts + RenderBlocks.tsx + `generate:types`.
- Reusar blocos existentes onde o conteúdo casar: Hero (Chars/Fade/vídeo), WordsSection (manifesto), Pillars (valores/hover-rows), Stats, Garante, AppShowcase, Faq, CTABand (variante), SolucoesBento/ProdutosGrid quando aplicável.
- Verde: biome + tsc + build; seeds rodam (`pnpm seed:pages`). Commit por task, IMEDIATO.

## Blocos/primitivo novos desta onda
- **`TimelinePinned`** (primitivo motion, `src/motion/`) — pin + scrub horizontal (GSAP ScrollTrigger). Base p/ a timeline de história do /semog (8 cards) e reutilizável (variante do /incorporadoras vem depois).
- **`Timeline`** (bloco) — `#historia` do /semog: 8 cards datados, usa `TimelinePinned`.
- **`Prestacao`** (bloco) — `#prestacao` do /solucoes.
- **`TecnologiaRoadmap`** (bloco) — `#tecnologia` (Semog One + roadmap) do /solucoes.
- **`ClubeBeneficios`** (bloco) — `#beneficios` do /solucoes.
- **`Socios`** (bloco) — seção Sócios do /semog (cards + `equipe.webp`/split). Se um bloco existente servir (ex.: variante de grid), reusar; senão criar.

---

### Task 1: Primitivo `TimelinePinned` (pin + scrub horizontal)
**Files:** Create `src/motion/TimelinePinned.tsx`. Read: `_reference/semog.html` (a seção `#historia` — como a timeline funciona: markup + qualquer JS inline/no `semog.js`), `semog.css` (`.timeline`/`.history`), `src/motion/reveal.tsx` (padrão), `src/motion/gsap.ts`.
**Interfaces:** `export function TimelinePinned({ children, className })` — pina a seção e traduz o scroll vertical em movimento horizontal do track (GSAP ScrollTrigger pin + scrub). Respeita reduced-motion (`useReducedHeavy` → sem pin, vira scroll horizontal simples/empilhado).
- [ ] Step 1: Ler a timeline do reference; implementar o pin/scrub fiel. 
- [ ] Step 2: Verificação: numa página de teste, pina e rola horizontalmente; reduced-motion degrada. Build verde.
- [ ] Step 3: Commit — `feat(motion): TimelinePinned (pin + horizontal scrub)`

### Task 2: Bloco `Timeline` (história /semog)
**Files:** Create `src/blocks/Timeline/`. Register. Read audit + reference `#historia`.
**Interfaces:** config `items[]` (`date`, `title`, `text`, `image?`); Component usa `TimelinePinned` com os cards. 
- [ ] Step 1: config + component fiéis. Step 2: register + types + CSS. Step 3: build verde. Step 4: Commit — `feat(blocks): Timeline (history pinned scroll)`

### Task 3: Bloco `Prestacao` (/solucoes #prestacao)
**Files:** Create `src/blocks/Prestacao/`. Register. Read audit + reference `#prestacao` (imagem `prestacao-contas.webp`).
- [ ] config (título/texto/lista/`image` upload) + component fiéis (image-split, Reveal). Register + types + CSS. Build verde. Commit — `feat(blocks): Prestacao`

### Task 4: Bloco `TecnologiaRoadmap` (/solucoes #tecnologia)
**Files:** Create `src/blocks/TecnologiaRoadmap/`. Register. Read audit + reference `#tecnologia` (Semog One `semog-one.webp`/`app-phone.webp` + roadmap).
- [ ] config (intro + roadmap `steps[]` + `image`) + component fiéis. Register + types + CSS. Build verde. Commit — `feat(blocks): TecnologiaRoadmap`

### Task 5: Bloco `ClubeBeneficios` (/solucoes #beneficios)
**Files:** Create `src/blocks/ClubeBeneficios/`. Register. Read audit + reference `#beneficios` (bento de benefícios, `blog-lazer.webp` etc.).
- [ ] config (`items[]` bento) + component fiéis. Register + types + CSS. Build verde. Commit — `feat(blocks): ClubeBeneficios`

### Task 6: Bloco `Socios` (/semog)
**Files:** Create `src/blocks/Socios/` (ou reusar bloco existente se servir). Register se novo. Read audit + reference seção Sócios (`equipe.webp`, split).
- [ ] config (`people[]`/split + `image`) + component. Register + types + CSS. Build verde. Commit — `feat(blocks): Socios`

### Task 7: Re-seed `/semog`
**Files:** Modify `src/seed/pages.ts` (a página `/semog`). Read `_reference/semog.html` (copy real), audit, `getMediaId`.
Ordem-alvo (audit): Hero (`hero-towers.webp` + Chars/Fade) → Manifesto (WordsSection + mini-stats) → **Timeline (#historia, 8 cards)** → Valores (Pillars hover-rows) → **Sócios** (`equipe.webp`) → CTA final (centered). REMOVER o grid Cities "Presença" que o reference não tem.
- [ ] Reescrever o layout da /semog na ordem exata com mídia. `pnpm seed:pages` roda OK. Build verde. Commit — `feat(seed): /semog 1:1`

### Task 8: Re-seed `/solucoes`
**Files:** Modify `src/seed/pages.ts` (a página `/solucoes`). Read `_reference/solucoes.html`, audit, `getMediaId`.
Ordem-alvo (audit, 12 seções): Hero → (3 verticais image-split: residencial/comercial/associações) → **Prestacao** → **TecnologiaRoadmap** → **ClubeBeneficios** → Garante (banda) → App → FAQ → CTA. Garante ANTES do App (corrigir a ordem atual). Religar toda a mídia.
- [ ] Reescrever o layout da /solucoes na ordem/exata com mídia. `pnpm seed:pages` OK. Build verde. Commit — `feat(seed): /solucoes 1:1`

---

## Self-Review
- Cobre os gaps de `audit-semog-solucoes.md`: /semog (timeline faltante + 5 aproximados + remover Cities extra) e /solucoes (3 seções faltantes + reordenar App/Garante + religar mídia).
- Reuso máximo dos blocos da home (Hero, WordsSection, Pillars, Garante, AppShowcase, Faq, CTABand). Novos: TimelinePinned, Timeline, Prestacao, TecnologiaRoadmap, ClubeBeneficios, Socios.
- Review visual das 2 páginas vs reference no fim (fidelity gate).
