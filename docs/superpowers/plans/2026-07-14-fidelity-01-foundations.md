# Fidelidade — Onda 1: Fundações (primitivos de motion + chrome) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir os primitivos de motion e o chrome global compartilhados que TODAS as páginas precisam para bater 1:1 com `_reference/`, sem os quais nenhuma página fica fiel.

**Architecture:** Primitivos = componentes React client em `src/motion/` (padrão existente: `'use client'` + `useEffect` + `gsap` de `./gsap`, cada um fiel a um trecho citado de `_reference/assets/js/semog.js`). Chrome global = componentes montados no layout do route group `(frontend)`. CSS portado verbatim de `_reference/assets/css/semog.css` (linhas citadas), mapeando as CSS vars do reference (`--text`, `--ice-400`, `--shadow-glow`…) para os tokens Tailwind já existentes no tema (`fg`, `accent`, etc.) do mesmo jeito que os componentes atuais já fazem.

**Tech Stack:** Next 16 (App Router, React 19), Payload 3, GSAP + ScrollTrigger (`src/motion/gsap.ts`), Lenis (`src/motion/LenisProvider.tsx`), Tailwind v4, Biome, pnpm.

## Global Constraints

- **Fidelidade 1:1 com `_reference/`.** A fonte de verdade do comportamento é `_reference/assets/js/semog.js`; do estilo é `_reference/assets/css/semog.css`. Portar verbatim (citar as linhas no comentário do componente, como os primitivos atuais já fazem — ex.: `reveal.tsx` cita `semog.js:122-136`).
- **Política de reduced-motion IGUAL ao semog.js:15** — reveals, contadores, marquee e headline (chars) rodam SEMPRE; apenas smooth-scroll, parallax e pin/scrub pesados desligam sob `prefers-reduced-motion: reduce`. Use o hook existente `src/motion/useReducedHeavy.ts`.
- **Sem cores novas.** Reusar tokens do tema (`src/styles/theme.css`). Nada de hex hardcoded fora do que o reference define.
- **Tudo continua editável no CMS onde aplicável** (nav/footer vêm dos globals `Header`/`Footer`; nada de hardcode de conteúdo que hoje é editável).
- **Sem mídia hardcoded** — logo via `/semog-logo-light.svg` em `/public` (padrão atual); imagens de conteúdo virão do CMS (Onda 2).
- **Verde no fim de cada task:** `pnpm biome check` limpo, `pnpm tsc --noEmit` (ou o script de typecheck do projeto) sem erro, e a app builda. Verificação de fidelidade é VISUAL (Playwright: renderiza, motion roda, sem erro no console) — não invente testes unitários para efeito visual; um teste de render/DOM simples basta onde fizer sentido.
- **Degradação elegante:** todo primitivo, sem GSAP ou com o DOM ausente, não pode quebrar SSR (o padrão atual protege com `if (!el) return`).

---

## File Structure

- `src/motion/Chars.tsx` (novo) — headline por-caractere (`data-chars`).
- `src/motion/Fade.tsx` (novo) — fade-in por delay (`data-fade`).
- `src/motion/Marquee.tsx` (novo) — faixa infinita (`.marquee`/`.marquee-track`).
- `src/styles/theme.css` ou o CSS global equivalente (modificar) — regras `[data-chars]`, `[data-fade]`, `@keyframes marquee`, `.grain`, `.wa-float`, preloader, nav-scrolled/mobile, foot-cta/footer-bottom. (Descobrir o arquivo CSS global real; o tema fica em `src/styles/`.)
- `src/components/ui/Button.tsx` (modificar) — prop `magnetic` que embrulha com `Magnetic`.
- `src/components/layout/Nav.tsx` (novo, client) — ilha de nav: `.is-scrolled` no scroll + burger/`.nav-mobile`.
- `src/components/layout/HeaderServer.tsx` (modificar) — passar navItems/cta/logo para a ilha `Nav`.
- `src/components/layout/FooterServer.tsx` (modificar) — 4 colunas + banda `.foot-cta` + `.footer-bottom`.
- `src/components/layout/Preloader.tsx` (novo, client) — barras + dismiss.
- `src/components/layout/Grain.tsx` + `src/components/layout/WhatsAppFloat.tsx` (novos) — overlays globais.
- `src/app/(frontend)/layout.tsx` (modificar) — montar Preloader, Grain, WhatsAppFloat.
- `src/seed/globals.ts` (modificar) — Footer com 4 colunas + textos do foot-cta/bottom (mapear do reference).

---

### Task 1: Primitivo `Chars` (headline por-caractere)

O reference anima os headlines de hero **por caractere** (`[data-chars]`, `splitChars` em `semog.js:50-87`), NÃO por palavra. O CMS hoje só tem `SplitHeadline` (por-palavra, `data-split`). Adicionar `Chars` e trocar os heroes para ele.

**Files:**
- Create: `src/motion/Chars.tsx`
- Modify: CSS global (regras de `[data-chars]`)
- Reference: `_reference/assets/js/semog.js:49-87` (splitChars) + `_reference/assets/css/semog.css` (linhas ~500-516: `[data-chars] .ch`, `[data-chars].is-in .ch { opacity:1; transform:translateX(0) }`)

**Interfaces:**
- Produces: `export function Chars({ children: string, as?: ElementType, className?: string })` — renderiza `<Tag>` com o texto quebrado em palavras inquebráveis (`display:inline-block;white-space:nowrap`) contendo `<span class="ch" style="--d:...ms">` por caractere; seta `aria-label` com o texto puro; adiciona `.is-in` após dois `requestAnimationFrame`. Delay por char = `200 + idx*30` ms (igual ao reference: `CHAR_DELAY=30, START=200`). Independe de GSAP (usa transição CSS).

- [ ] **Step 1: Portar `splitChars` para React**

Espelhar `SplitHeadline.tsx` (mesmo formato: `'use client'`, `useRef`, `useEffect([children])`), mas implementando `splitChars` de `semog.js:50-87` verbatim (wrap de nós de texto, palavras `inline-block`/`nowrap`, char em `span.ch` com `--d`, `aria-label`, `is-in` em `rAF(rAF())`). Cleanup: restaurar não é necessário (efeito one-shot), mas guardar o texto original para o caso de re-render.

- [ ] **Step 2: Portar o CSS `[data-chars]`**

Copiar verbatim de `_reference/assets/css/semog.css` as regras do `.ch` (estado inicial: `opacity:0; transform:translateX(...)` e a transição usando `var(--d)` como delay) e `[data-chars].is-in .ch { opacity:1; transform:translateX(0) }`. Ler as linhas ~500-516 do semog.css para pegar o estado inicial exato do `.ch` (o grep mostrou só o `.is-in`; ler o bloco completo). O componente deve marcar o elemento com `data-chars` (atributo) para o seletor casar.

- [ ] **Step 3: Verificação**

Render em Playwright de uma página usando `<Chars>`: `aria-label` presente com o texto puro; N spans `.ch`; após ~1s todos com `opacity:1`; sem erro no console. Biome + typecheck + build verdes.

- [ ] **Step 4: Commit** — `feat(motion): add Chars per-char headline primitive (data-chars)`

---

### Task 2: Primitivo `Fade` (fade-in por delay)

`[data-fade]` (`semog.js:88-93`): adiciona `.is-in` após `data-fade-delay` ms, opcional `data-fade-duration`. Usado no eyebrow/subhead/CTA do hero (hoje estáticos).

**Files:**
- Create: `src/motion/Fade.tsx`
- Modify: CSS global (`[data-fade]` / `[data-fade].is-in` — semog.css ~510-516)
- Reference: `semog.js:88-93`, `semog.css:516` (`[data-fade].is-in { opacity:1 }`) + o estado inicial acima.

**Interfaces:**
- Produces: `export function Fade({ children: ReactNode, delay?: number, duration?: number, as?: ElementType, className?: string })` — envolve children num `<Tag data-fade>`, seta `.is-in` via `setTimeout(delay)`, aplica `transitionDuration` se `duration` dado. Roda sempre (não é efeito pesado).

- [ ] **Step 1: Implementar `Fade`** conforme `semog.js:88-93` (client, useEffect, setTimeout).
- [ ] **Step 2: CSS `[data-fade]`** — estado inicial (`opacity:0; transform:translateY(...)` + transition) e `.is-in` verbatim do semog.css.
- [ ] **Step 3: Verificação** — render: children começa `opacity:0`, vira `1` após `delay`; sem erro; verdes.
- [ ] **Step 4: Commit** — `feat(motion): add Fade primitive (data-fade)`

---

### Task 3: Ligar `Magnetic` ao `Button`

Auditoria: `Magnetic.tsx` existe mas `Button.tsx` nunca importa — CTAs não são magnéticos em lugar nenhum. Reference marca CTAs com `data-magnetic` (`semog.js:199-211`, só pointer fino).

**Files:**
- Modify: `src/components/ui/Button.tsx`
- Read: `src/motion/Magnetic.tsx` (para a interface de wrap)

**Interfaces:**
- Produces: `Button` ganha prop `magnetic?: boolean`. Quando `true`, o conteúdo/elemento é embrulhado por `Magnetic`. Default: `true` para `variant="primary"`, `false` para os demais (evita ligar em tudo). Não quebrar SSR (Magnetic já é client e no-op sem pointer fino).

- [ ] **Step 1:** Ler `Magnetic.tsx` e envolver o render do Button quando `magnetic`. 
- [ ] **Step 2: Verificação** — botão primário renderiza igual; em pointer fino, mousemove desloca (checar via Playwright que o wrapper `Magnetic` existe no DOM); demais variantes inalteradas; verdes.
- [ ] **Step 3: Commit** — `feat(ui): wire Magnetic into primary Button CTAs`

---

### Task 4: Ilha de Nav (scroll toggle + menu mobile + liquid-glass)

Auditoria/chrome: `.nav.is-scrolled` (bg no scroll) MISSING; burger/`.nav-mobile` MISSING (nav some no mobile); liquid-glass aproximado. `HeaderServer` é server e delega isso para "a ilha client dedicada" (comentário no próprio arquivo).

**Files:**
- Create: `src/components/layout/Nav.tsx` (client)
- Modify: `src/components/layout/HeaderServer.tsx` (renderizar `<Nav navItems cta logoSrc />` em vez do markup inline)
- Reference: `semog.js:19-47` (scroll toggle + burger), `semog.css:235-286` (`.nav`, `.nav.is-scrolled`, `.nav-burger`, `.nav-mobile`, `.nav-mobile.is-open`) + `semog.css:481-486` (breakpoints: `.nav-links/.nav-cta { display:none }`, `.nav-burger { display:flex }` no mobile).

**Interfaces:**
- Consumes: `navItems`, `cta`, `logoSrc` do `HeaderServer` (que segue buscando o global `header`).
- Produces: `export function Nav({ navItems, cta, logoSrc })` client. Efeitos: (a) `scroll` passivo → `.is-scrolled` quando `scrollY>24` (`semog.js:22-27`); (b) burger `aria-expanded` + `.nav-mobile.is-open` + trava `body.overflow` (`semog.js:31-47`), fechando ao clicar link. Estrutura visual = pílula liquid-glass do reference (borda-gradiente), NÃO o `backdrop-blur-md` simples atual.

- [ ] **Step 1:** Ler o bloco `.nav`/`.nav-mobile`/`.nav-burger` de `semog.css:235-286` e o material liquid-glass (procurar `--glass`/`liquid` no semog.css). Implementar `Nav.tsx` portando os dois efeitos JS + a marcação (links desktop, CTA, burger 3-spans, painel `.nav-mobile` com links grandes).
- [ ] **Step 2:** `HeaderServer` passa `navItems`/`cta`/`logoSrc` para `<Nav>`; manter o fallback nav atual.
- [ ] **Step 3: Verificação (Playwright):** no topo, nav sem `is-scrolled`; após `scrollY>24`, ganha; em viewport mobile, links desktop somem e burger aparece; clicar burger abre `.nav-mobile.is-open` e trava scroll; clicar link fecha. Sem erro; verdes.
- [ ] **Step 4: Commit** — `feat(chrome): nav scroll-toggle + mobile burger island + liquid-glass`

---

### Task 5: Footer 4 colunas + `.foot-cta` + `.footer-bottom`

Auditoria: footer é 3 colunas (Soluções/Empresa/Legal); reference tem 4 (marca+blurb / Institucional / Soluções / Onde estamos-cidades) + banda `.foot-cta` (slogan com `em` destacado) + `.footer-bottom` (copyright + nav legal em linha). `FooterServer` já suporta `columns` do global; falta o layout completo + seed.

**Files:**
- Modify: `src/components/layout/FooterServer.tsx`
- Modify: `src/seed/globals.ts` (global `footer`: 4 colunas + `footCta` + `bottom` legal links, mapeados do reference)
- Modify: `src/globals/Footer.ts` (schema Payload: adicionar campos `footCta { slogan, sloganEm }` e `legalLinks` se ainda não existirem)
- Reference: `semog.css:381-422` (`.footer`, `.foot-cta`, `.footer-grid`, `.footer-brand`, `.footer-bottom`, `.footer-bottom .legal`) + o markup do footer em `_reference/index.html` (pegar os textos/links reais das 4 colunas + slogan + legais).

**Interfaces:**
- Consumes: global `footer` com `columns` (4), `footCta`, `legalLinks`, `bottomText`.
- Produces: `FooterServer` renderiza banda `.foot-cta` (slogan) no topo, grid de 4 colunas (1ª = marca+blurb), e `.footer-bottom` (copyright + links legais em linha). Extrair os textos/links do reference (não inventar).

- [ ] **Step 1:** Ler o markup do footer em `_reference/index.html` + as regras `semog.css:381-422`. Estender o schema `src/globals/Footer.ts` com os campos que faltam.
- [ ] **Step 2:** Reescrever o layout do `FooterServer` (foot-cta + 4-col + footer-bottom), mapeando CSS vars → tokens.
- [ ] **Step 3:** Atualizar `src/seed/globals.ts` com os 4 grupos de links reais + slogan + legais do reference.
- [ ] **Step 4: Verificação:** re-seed local (ou render com o global) → 4 colunas, banda de slogan com `em` colorido, footer-bottom com copyright + Privacidade/Termos em linha; bate com print do footer do reference. Verdes.
- [ ] **Step 5: Commit** — `feat(chrome): 4-col footer with foot-cta band + footer-bottom`

---

### Task 6: Preloader + Grain + WhatsApp float (chrome global)

Auditoria: Preloader, `.grain`, `.wa-float` todos MISSING. Montar no layout `(frontend)`.

**Files:**
- Create: `src/components/layout/Preloader.tsx` (client), `src/components/layout/Grain.tsx`, `src/components/layout/WhatsAppFloat.tsx`
- Modify: `src/app/(frontend)/layout.tsx` (montar os três; descobrir o caminho real do layout do route group)
- Reference: `semog.css:198` (`.grain`), `semog.css:468-478` (`.wa-float` + svg WhatsApp), `semog.css:533-549` (`.preloader`, `.bars`, `@keyframes preloader-rise`, `.preloader.is-done`); markup do preloader/grain/wa-float em `_reference/index.html`.

**Interfaces:**
- Produces:
  - `Preloader` (client): 3 barras animadas; dismiss adicionando `.is-done`. Reference espera `canplay` do vídeo do hero (teto 2.2s) — sem o vídeo garantido aqui, usar o teto de tempo (ex.: dismiss no `window load` OU após 2.2s, o que vier primeiro). Respeitar reduced-motion (dismiss imediato).
  - `Grain`: overlay `.grain` fixo, `pointer-events:none`, `aria-hidden`.
  - `WhatsAppFloat`: link fixo com o número (vir do global `company`/`siteSettings` se houver campo; senão prop). SVG do WhatsApp do reference.

- [ ] **Step 1:** Ler os três blocos CSS + o markup no reference. Implementar os três componentes.
- [ ] **Step 2:** Montá-los no layout `(frontend)`. Número do WhatsApp: buscar de um global editável (checar `Company`/`SiteSettings` em `src/globals/`) — não hardcode.
- [ ] **Step 3: Verificação (Playwright):** preloader aparece e some (≤2.2s); grain overlay presente sem capturar cliques; wa-float fixo no canto com hover; sem erro. Verdes.
- [ ] **Step 4: Commit** — `feat(chrome): preloader + grain overlay + WhatsApp float`

---

### Task 7: Componente `Marquee` (faixa infinita)

`.marquee`/`.marquee-track` (`semog.css:432-434`, `@keyframes marquee` translateX(-50%) 20s linear infinite). Base reutilizável para o values-strip da home e o ticker do /garante (blocos vêm em ondas posteriores).

**Files:**
- Create: `src/motion/Marquee.tsx`
- Modify: CSS global (`.marquee`, `.marquee-track`, `@keyframes marquee`)
- Reference: `semog.css:432-434`.

**Interfaces:**
- Produces: `export function Marquee({ items: ReactNode[] | string[], className? })` — renderiza `.marquee` > `.marquee-track` com os itens DUPLICADos (para o loop `translateX(-50%)` ser contínuo). CSS animation (não JS). Pausar em `prefers-reduced-motion`? Reference não pausa (marquee roda sempre, `semog.js:11-14`) — manter rodando.

- [ ] **Step 1:** Implementar `Marquee` + portar o CSS (keyframes 20s linear infinite, track `inline-flex`, itens duplicados).
- [ ] **Step 2: Verificação:** render com itens → track duplicado, anima (checar `animation-name: marquee`); sem erro; verdes.
- [ ] **Step 3: Commit** — `feat(motion): add Marquee infinite strip component`

---

## Self-Review

- **Cobertura:** cobre os primitivos site-wide (Chars, Fade, Magnetic-no-Button, Marquee) e o chrome global (nav island, footer 4-col, preloader/grain/wa-float) da seção 0 do `fidelity-master.md`. Accordion, pillar-hover-rows e timeline-pin ficam para as ondas de página (acoplados a markup específico) — anotado, não esquecido.
- **Tipos:** `Chars`/`Fade` seguem a assinatura de `SplitHeadline`/`Reveal` (as/className). `Marquee` recebe `items`. `Nav` recebe `navItems/cta/logoSrc`.
- **Sem placeholder:** cada task cita a fonte exata (semog.js/semog.css por linha) — o "código completo" é o do reference, portado verbatim; implementer lê e copia.
- **Dependência:** Task 4/5/6 tocam globals/layout — o implementer confirma os caminhos reais (`(frontend)/layout.tsx`, `Company`/`SiteSettings`) antes de editar.
