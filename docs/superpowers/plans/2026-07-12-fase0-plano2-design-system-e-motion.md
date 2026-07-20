# Semog Fase 0 · Plano 2 — Design System & Motion

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reproduzir fielmente o design system "Noite Institucional" e a camada de motion do site estático — agora em **Tailwind v4** (tokens via `@theme`), **fontes self-hosted** (Clash Display + Satoshi) e **motion React** (Lenis + GSAP/ScrollTrigger fiéis ao `_reference/assets/js/semog.js`) — validável numa rota `/styleguide` sem banco.

**Architecture:** O CSS de referência (`_reference/assets/css/semog.css`, 567 linhas) e o JS de motion (`_reference/assets/js/semog.js`, 225 linhas) são a fonte da verdade. Portamos os tokens `:root` para `@theme` do Tailwind v4; os tokens **semânticos** (que mudam em seções claras) permanecem como CSS custom properties em `:root`/`.sec-light`. O motion vira client components/hooks em `src/motion/`, preservando a política de reduced-motion (reveals/contadores/marquee/headline sempre rodam; smooth scroll/parallax/scrub pesados respeitam o SO). Primitivos de UI em `src/components/ui/`. Nada depende de banco — a verificação é a rota `/styleguide`.

**Tech Stack:** Tailwind v4 (`@tailwindcss/postcss`), `next/font/local`, GSAP + ScrollTrigger, Lenis, React 19 client components, Biome.

## Global Constraints

- Gerenciador: **pnpm 10.12.4**; Node v22 (>=20.9). Windows.
- **Fidelidade 1:1** ao `_reference/`: cores, tipografia, raios, sombras, timings e easings idênticos. `_reference/` é a fonte da verdade — comparar contra ele, nunca editá-lo.
- **Rewrite total em Tailwind**: markup usa utilitários Tailwind + `@theme`; classes utilitárias de componente (ex.: `.btn`) só via `@layer components` quando um utilitário puro ficaria ilegível.
- **Tokens semânticos** (`--bg`, `--text`, `--line`, etc.) ficam como CSS vars com override em `.sec-light`/`.sec-light.white` — o ritmo claro/escuro do site depende disso (`semog.css:128-186`).
- **Política de motion** (verbatim do `semog.css:494-498` e `semog.js:11-15`): reveals, contadores, marquee e headline rodam SEMPRE; `prefers-reduced-motion: reduce` desativa APENAS smooth scroll (Lenis), parallax e scrub. `prefers-reduced-transparency: reduce` desliga o blur do liquid-glass.
- **Sem CDN**: GSAP/ScrollTrigger/Lenis via pacotes npm (não `<script>` de CDN). Fontes self-hosted (sem Fontshare em runtime).
- Motion inicializa client-side, com cleanup (kill de ScrollTriggers/Lenis no unmount) — sem vazamento em navegação SPA.
- Cada task termina em commit próprio. Biome `check` = 0 e `tsc --noEmit` limpo antes de cada commit.

## Mapa de arquivos

- Create `src/styles/theme.css` — `@import "tailwindcss";` + `@theme { ... }` (tokens de marca) + `@layer base` (reset, semânticos, tipografia, foco, skip-link) + `.sec-light` overrides + utilitários (`.grad-text`, `.gx`, `.gx-ice`, `.grain`, `.liquid-glass`).
- Modify `src/app/(frontend)/layout.tsx` — importa o CSS, aplica variáveis de fonte, monta `<LenisProvider>`.
- Delete/replace `src/app/(frontend)/styles.css` (scaffold).
- Create `postcss.config.mjs` — plugin `@tailwindcss/postcss`.
- Create `src/fonts/index.ts` — `next/font/local` (Clash Display, Satoshi) → variáveis CSS.
- Create `src/fonts/files/*.woff2` — arquivos baixados do Fontshare.
- Create `src/motion/LenisProvider.tsx`, `src/motion/useReducedHeavy.ts`, `src/motion/reveal.tsx` (Reveal, Stagger), `src/motion/Counter.tsx`, `src/motion/SplitHeadline.tsx`, `src/motion/Words.tsx`, `src/motion/Magnetic.tsx`, `src/motion/Parallax.tsx`, `src/motion/gsap.ts` (registro central do plugin).
- Create `src/components/ui/Button.tsx`, `Container.tsx`, `Section.tsx`, `Eyebrow.tsx`, `GradientText.tsx`.
- Create `src/app/(frontend)/styleguide/page.tsx` — vitrine de tokens + primitivos + motion (dev).

---

### Task 1: Tailwind v4 + tokens `@theme` + base layer

**Files:**
- Create: `postcss.config.mjs`, `src/styles/theme.css`
- Modify: `src/app/(frontend)/layout.tsx` (importar `theme.css`), remover import do `styles.css` do scaffold
- Delete: `src/app/(frontend)/styles.css`

**Interfaces:**
- Consumes: nada.
- Produces: utilitários Tailwind com os tokens da marca (`bg-navy-900`, `text-ice-400`, `rounded-card`, `shadow-card`, `font-display`, `text-hero`…); CSS vars semânticas (`--bg`,`--text`,`--line`,`--accent`) com override em `.sec-light`.

- [ ] **Step 1: Instalar Tailwind v4**

Run: `pnpm add -D tailwindcss @tailwindcss/postcss`
Expected: dependências adicionadas.

- [ ] **Step 2: `postcss.config.mjs`**

```javascript
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
export default config
```

- [ ] **Step 3: `src/styles/theme.css` — importa Tailwind e define `@theme`**

Portar os tokens de `_reference/assets/css/semog.css:7-68` para o formato Tailwind v4. Conteúdo:

```css
@import 'tailwindcss';

@theme {
  /* Brand — navy */
  --color-navy-950: #05081a;
  --color-navy-900: #0a102e;
  --color-navy-850: #0d1439;
  --color-navy-800: #101a48;
  --color-navy-700: #16225c;
  --color-navy-600: #1b2d70; /* primária */
  --color-navy-500: #2a3f96;
  --color-navy-400: #3b54be;
  /* ice */
  --color-ice-300: #d8ecf7;
  --color-ice-400: #add5eb; /* acento */
  --color-ice-500: #7fb8db;
  --color-ice-600: #5895bd;
  /* silver */
  --color-silver-100: #edeef5;
  --color-silver-300: #bcbcc7;
  --color-silver-500: #8e90a6;

  /* Semantic (referem as CSS vars definidas no @layer base) */
  --color-bg: var(--bg);
  --color-bg-raise: var(--bg-raise);
  --color-bg-deep: var(--bg-deep);
  --color-fg: var(--text);
  --color-fg-2: var(--text-2);
  --color-fg-3: var(--text-3);
  --color-line: var(--line);
  --color-line-strong: var(--line-strong);
  --color-accent: var(--accent);

  /* Fonts (variáveis vindas do next/font — Task 2) */
  --font-display: var(--font-clash), 'Satoshi', system-ui, sans-serif;
  --font-body: var(--font-satoshi), system-ui, -apple-system, sans-serif;

  /* Type scale (clamp fiel ao ref) */
  --text-hero: clamp(2.6rem, 6.2vw, 5.2rem);
  --text-h2: clamp(2rem, 4.2vw, 3.4rem);
  --text-h3: clamp(1.4rem, 2.4vw, 2rem);
  --text-lead: clamp(1.05rem, 1.5vw, 1.3rem);

  /* Radii */
  --radius-card: 20px;
  --radius-input: 12px;
  --radius-pill: 999px;

  /* Shadows (tinted navy) */
  --shadow-card: 0 24px 60px -24px rgba(5, 8, 26, 0.7);
  --shadow-glow: 0 0 80px -20px rgba(173, 213, 235, 0.25);

  /* Layout */
  --container-site: 1280px;
}
```

- [ ] **Step 4: `@layer base` — semânticos, reset, tipografia (append em `theme.css`)**

Portar `_reference/assets/css/semog.css:27-42, 70-107, 128-186, 560-567`. Os semânticos ficam como CSS vars (não `@theme`) para poderem trocar em `.sec-light`:

```css
@layer base {
  :root {
    --bg: var(--color-navy-900);
    --bg-raise: var(--color-navy-850);
    --bg-deep: var(--color-navy-950);
    --text: #edf1fa;
    --text-2: #b4bdd9;
    --text-3: #7e88ac;
    --line: rgba(173, 213, 235, 0.14);
    --line-strong: rgba(173, 213, 235, 0.28);
    --accent: var(--color-ice-400);
    /* gradientes da marca */
    --grad-brand: linear-gradient(135deg, #1b2d70 0%, #2a3f96 45%, #5895bd 100%);
    --grad-ice: linear-gradient(120deg, #add5eb 0%, #d8ecf7 60%, #add5eb 100%);
    --grad-hero: radial-gradient(120% 90% at 70% 10%, #1b2d70 0%, #0d1439 48%, #05081a 100%);
    --grad-band: linear-gradient(160deg, #101a48 0%, #1b2d70 55%, #16225c 100%);
  }

  *, *::before, *::after { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }

  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-body);
    font-size: 1rem;
    line-height: 1.65;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    overflow-x: hidden;
  }
  img { max-width: 100%; display: block; }
  a { color: inherit; text-decoration: none; }
  button { font-family: inherit; cursor: pointer; }
  ::selection { background: var(--color-ice-400); color: var(--color-navy-900); }

  h1, h2, h3, h4 {
    font-family: var(--font-display);
    font-weight: 500;
    line-height: 1.08;
    letter-spacing: -0.02em;
    margin: 0 0 0.6em;
    text-wrap: balance;
  }
  h1 { font-size: var(--text-hero); }
  h2 { font-size: var(--text-h2); }
  h3 { font-size: var(--text-h3); }
  p { margin: 0 0 1em; }

  :focus-visible { outline: 2px solid var(--color-ice-400); outline-offset: 3px; border-radius: 4px; }

  /* Seções claras: trocam os semânticos (ref semog.css:128-137) */
  .sec-light {
    --text: #10152e;
    --text-2: #4b557a;
    --text-3: #7a83a6;
    --line: rgba(16, 26, 72, 0.12);
    --line-strong: rgba(16, 26, 72, 0.24);
    background: #f2f4f9;
    color: var(--text);
  }
  .sec-light.white { background: #fff; }
}
```

- [ ] **Step 5: `@layer utilities` — utilitários de marca (append)**

Portar `semog.css:109-126, 197-232, 562-567`:

```css
@layer utilities {
  .grad-text { background: var(--grad-ice); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .gx { background: linear-gradient(100deg, #1b2d70 0%, #3b54be 52%, #5895bd 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .gx-ice { background: linear-gradient(100deg, #add5eb 0%, #d8ecf7 55%, #7fb8db 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .skip-link { position: absolute; left: -9999px; top: 0; z-index: 100; background: var(--color-ice-400); color: var(--color-navy-900); padding: 0.8rem 1.4rem; border-radius: 0 0 12px 0; font-weight: 600; }
  .skip-link:focus { left: 0; }
}
```

- [ ] **Step 6: Trocar o CSS no layout do frontend**

Em `src/app/(frontend)/layout.tsx`: remover `import './styles.css'`, adicionar `import '../../styles/theme.css'`. Deletar `src/app/(frontend)/styles.css`.

- [ ] **Step 7: Verificar utilitários e base**

Adicione temporariamente na page do frontend um bloco `<div className="bg-navy-900 text-ice-400 rounded-card shadow-card p-8">Semog</div>` e um `<h2>` para checar a tipografia.
Run: `pnpm dev` → `curl -s http://localhost:3000/ | grep -c "bg-navy-900"` (deve compilar sem erro de PostCSS; a página pode 500 no getPayload como antes — o que importa é o CSS compilar). Melhor: abra no navegador e confirme fundo navy, texto ice, cantos arredondados. Remova o bloco temporário depois.
Expected: Tailwind compila, utilitários com os tokens aplicam as cores/raios corretos.

- [ ] **Step 8: Biome + tsc + commit**

Run: `pnpm check && pnpm exec tsc --noEmit`
Expected: 0 warnings, sem erros.

```bash
git add -A
git commit -m "feat(design): Tailwind v4 com tokens @theme e base layer (port do semog.css)"
```

---

### Task 2: Fontes self-hosted (Clash Display + Satoshi) via next/font/local

**Files:**
- Create: `src/fonts/index.ts`, `src/fonts/files/*.woff2`
- Modify: `src/app/(frontend)/layout.tsx` (aplicar variáveis de fonte no `<html>`/`<body>`)

**Interfaces:**
- Consumes: `--font-display`/`--font-body` referenciados no `@theme` (Task 1) via `var(--font-clash)`/`var(--font-satoshi)`.
- Produces: `clash` e `satoshi` (objetos next/font) expondo `--font-clash` e `--font-satoshi`.

- [ ] **Step 1: Baixar os woff2 do Fontshare**

Pesos usados (ref `semog.css:50-51, 285, 94`): Clash Display 400/500/600; Satoshi 400/500/700. Baixar os arquivos woff2 da API do Fontshare para `src/fonts/files/`.

```bash
mkdir -p src/fonts/files
# Resolver as URLs de woff2 via a folha CSS do Fontshare e baixar cada peso:
curl -sL "https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600&f[]=satoshi@400,500,700" -o /tmp/fontshare.css
# extrair as URLs .woff2 do CSS e baixar cada uma para src/fonts/files/ com nomes claros
# (ex.: clash-display-400.woff2, clash-display-500.woff2, clash-display-600.woff2,
#        satoshi-400.woff2, satoshi-500.woff2, satoshi-700.woff2)
```

Se o download do Fontshare falhar (rede/formato), PARE e reporte como BLOCKED — não improvise com fontes diferentes nem volte pro `<link>` de CDN sem sinal (fere o "sem Fontshare em runtime"). O controller decide (pode fornecer os arquivos).

- [ ] **Step 2: `src/fonts/index.ts`**

```typescript
import localFont from 'next/font/local'

export const clash = localFont({
  variable: '--font-clash',
  display: 'swap',
  src: [
    { path: './files/clash-display-400.woff2', weight: '400', style: 'normal' },
    { path: './files/clash-display-500.woff2', weight: '500', style: 'normal' },
    { path: './files/clash-display-600.woff2', weight: '600', style: 'normal' },
  ],
})

export const satoshi = localFont({
  variable: '--font-satoshi',
  display: 'swap',
  src: [
    { path: './files/satoshi-400.woff2', weight: '400', style: 'normal' },
    { path: './files/satoshi-500.woff2', weight: '500', style: 'normal' },
    { path: './files/satoshi-700.woff2', weight: '700', style: 'normal' },
  ],
})
```

- [ ] **Step 3: Aplicar as variáveis no layout**

Em `src/app/(frontend)/layout.tsx`, importar `clash, satoshi` e adicionar `className={`${clash.variable} ${satoshi.variable}`}` no elemento raiz do grupo frontend (o `<html>` se este for o root layout; senão numa `<div>` wrapper). Garantir `lang="pt-BR"`.

- [ ] **Step 4: Verificar**

Run: `pnpm dev`, abrir `/` (ou `/styleguide` na Task 7). Inspecionar: `font-family` computado do `body` = Satoshi; de um `<h2>` = Clash Display. Confirmar no Network que os woff2 são servidos localmente (mesmo host), sem request pro Fontshare.
Expected: fontes locais aplicadas; nenhuma chamada a `api.fontshare.com`.

- [ ] **Step 5: Biome + tsc + commit**

```bash
git add -A
git commit -m "feat(design): fontes self-hosted Clash Display + Satoshi (next/font/local)"
```

---

### Task 3: Motion core — registro do GSAP, `useReducedHeavy`, `LenisProvider`

**Files:**
- Create: `src/motion/gsap.ts`, `src/motion/useReducedHeavy.ts`, `src/motion/LenisProvider.tsx`
- Modify: `src/app/(frontend)/layout.tsx` (envolver children no `<LenisProvider>`)
- Add deps: `gsap`, `lenis`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `gsap.ts` → exporta `gsap` e `ScrollTrigger` já registrados (client-only).
  - `useReducedHeavy(): boolean` — `true` quando `prefers-reduced-motion: reduce` (política: só desativa efeitos pesados).
  - `<LenisProvider>{children}</LenisProvider>` — client component que roda Lenis (duration 1.15, smoothWheel) exceto sob reduced-motion, e conecta `lenis.on('scroll', ScrollTrigger.update)`.

- [ ] **Step 1: Instalar libs**

Run: `pnpm add gsap lenis`

- [ ] **Step 2: `src/motion/gsap.ts` (registro central)**

```typescript
'use client'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}
export { gsap, ScrollTrigger }
```

- [ ] **Step 3: `src/motion/useReducedHeavy.ts`**

```typescript
'use client'
import { useEffect, useState } from 'react'

/** true = desativar efeitos pesados (smooth scroll, parallax, scrub). Fiel a semog.js:15 */
export function useReducedHeavy(): boolean {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduce(mq.matches)
    const onChange = () => setReduce(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduce
}
```

- [ ] **Step 4: `src/motion/LenisProvider.tsx`**

Fiel a `semog.js:95-119`. Cria Lenis (duration 1.15, smoothWheel) exceto reduced-motion; RAF loop; conecta ScrollTrigger; cleanup no unmount (`lenis.destroy()`, cancelar RAF).

```typescript
'use client'
import { type ReactNode, useEffect } from 'react'
import Lenis from 'lenis'
import { ScrollTrigger } from './gsap'
import { useReducedHeavy } from './useReducedHeavy'

export function LenisProvider({ children }: { children: ReactNode }) {
  const reduceHeavy = useReducedHeavy()
  useEffect(() => {
    if (reduceHeavy) return
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true })
    let raf = 0
    const loop = (time: number) => {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    lenis.on('scroll', ScrollTrigger.update)
    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
    }
  }, [reduceHeavy])
  return <>{children}</>
}
```

- [ ] **Step 5: Montar no layout**

Em `src/app/(frontend)/layout.tsx`, envolver `{children}` com `<LenisProvider>`. (É client component; o layout continua server component importando-o normalmente.)

- [ ] **Step 6: Verificar**

Run: `pnpm dev`, abrir `/`. Sem erro de SSR/hidratação no console; scroll suave ativo. Com `prefers-reduced-motion` ligado no SO/devtools, Lenis não inicia (scroll nativo).
Expected: provider monta, cleanup sem warnings, política respeitada.

- [ ] **Step 7: Biome + tsc + commit**

```bash
git add -A
git commit -m "feat(motion): GSAP register, useReducedHeavy e LenisProvider (port semog.js)"
```

---

### Task 4: Reveal, Stagger e Counter

**Files:**
- Create: `src/motion/reveal.tsx` (`Reveal`, `Stagger`), `src/motion/Counter.tsx`

**Interfaces:**
- Consumes: `gsap`, `ScrollTrigger` de `./gsap`; `useReducedHeavy`.
- Produces:
  - `<Reveal dir?="up"|"left"|"right"|"scale" delay?={number} as?={ElementType}>` — fiel a `semog.js:122-136` (`start: 'top 88%'`, `duration: 1`, `ease: 'expo.out'`, `once: true`). Roda SEMPRE (mesmo sob reduced-motion).
  - `<Stagger>` — fiel a `semog.js:139-149` (filhos: `y:34→0`, `duration 0.9`, `stagger 0.09`, `start 'top 86%'`).
  - `<Counter value={number} />` — fiel a `semog.js:152-164` (duração 2.2, `power3.out`, `toLocaleString('pt-BR')`, `start 'top 88%'`, `once`).

- [ ] **Step 1: `src/motion/reveal.tsx`**

```tsx
'use client'
import { type ElementType, type ReactNode, useEffect, useRef } from 'react'
import { gsap } from './gsap'

type Dir = 'up' | 'left' | 'right' | 'scale'

export function Reveal({
  children, dir = 'up', delay = 0, as: Tag = 'div', className,
}: { children: ReactNode; dir?: Dir; delay?: number; as?: ElementType; className?: string }) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const from = { opacity: 0, y: 28, x: 0, scale: 1 }
    if (dir === 'left') { from.x = -36; from.y = 0 }
    if (dir === 'right') { from.x = 36; from.y = 0 }
    if (dir === 'scale') { from.scale = 0.94; from.y = 0 }
    const tween = gsap.fromTo(el, from, {
      opacity: 1, y: 0, x: 0, scale: 1, duration: 1, delay, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    })
    return () => { tween.scrollTrigger?.kill(); tween.kill() }
  }, [dir, delay])
  return <Tag ref={ref} className={className}>{children}</Tag>
}

export function Stagger({
  children, as: Tag = 'div', className,
}: { children: ReactNode; as?: ElementType; className?: string }) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const tween = gsap.fromTo(el.children,
      { opacity: 0, y: 34 },
      { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.09,
        scrollTrigger: { trigger: el, start: 'top 86%', once: true } })
    return () => { tween.scrollTrigger?.kill(); tween.kill() }
  }, [])
  return <Tag ref={ref} className={className}>{children}</Tag>
}
```

- [ ] **Step 2: `src/motion/Counter.tsx`**

```tsx
'use client'
import { useEffect, useRef } from 'react'
import { gsap } from './gsap'

export function Counter({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obj = { v: 0 }
    const tween = gsap.to(obj, {
      v: value, duration: 2.2, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      onUpdate: () => { el.textContent = Math.round(obj.v).toLocaleString('pt-BR') },
    })
    return () => { tween.scrollTrigger?.kill(); tween.kill() }
  }, [value])
  return <span ref={ref} className={className}>0</span>
}
```

- [ ] **Step 3: Verificar** (na `/styleguide`, Task 7, ou num bloco temporário): elementos com `<Reveal>` animam ao entrar na viewport; `<Stagger>` escalona filhos; `<Counter value={700} />` conta até 700 em pt-BR. Sem warnings de cleanup ao navegar.

- [ ] **Step 4: Biome + tsc + commit**

```bash
git add -A
git commit -m "feat(motion): Reveal, Stagger e Counter (port semog.js)"
```

---

### Task 5: SplitHeadline, Words, Magnetic, Parallax

**Files:**
- Create: `src/motion/SplitHeadline.tsx`, `src/motion/Words.tsx`, `src/motion/Magnetic.tsx`, `src/motion/Parallax.tsx`

**Interfaces:**
- Consumes: `gsap`, `useReducedHeavy`.
- Produces (fiéis ao `semog.js`):
  - `<SplitHeadline as="h1">texto</SplitHeadline>` — `semog.js:214-224` (palavras com máscara, `yPercent 110→0`, `duration 1.1`, `expo.out`, `stagger 0.07`, `delay 0.15`). Roda sempre. Preserva `aria-label` com o texto original.
  - `<Words>frase longa</Words>` — `semog.js:178-197` (palavras `opacity 0.14→1`; com scrub `top 82%→top 30%` normal, ou bloco `top 80% once` sob reduced-motion). `aria-label` com o texto.
  - `<Magnetic>` — `semog.js:199-211` (só `pointer: fine`; `quickTo` x/y com fator 0.25; volta a 0 no mouseleave). Sob reduced-motion/coarse pointer, é um passthrough.
  - `<Parallax amount?={8}>` — `semog.js:166-175` (efeito pesado: só quando NÃO reduced-heavy; `yPercent -amt→amt`, scrub, trigger no parent).

- [ ] **Step 1: `SplitHeadline.tsx`** — split por palavra com wrapper de overflow, `aria-label`, tween `yPercent`. (Implementar conforme spec acima; cleanup do tween no unmount.)

```tsx
'use client'
import { type ElementType, useEffect, useRef } from 'react'
import { gsap } from './gsap'

export function SplitHeadline({
  children, as: Tag = 'h1', className,
}: { children: string; as?: ElementType; className?: string }) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const words = children.trim().split(/\s+/)
    el.setAttribute('aria-label', children.trim())
    el.innerHTML = words
      .map((w) => `<span class="split-w" aria-hidden="true" style="display:inline-block;overflow:hidden;vertical-align:top;"><span style="display:inline-block;">${w}</span></span>`)
      .join(' ')
    const inners = el.querySelectorAll('.split-w > span')
    const tween = gsap.fromTo(inners, { yPercent: 110 },
      { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.07, delay: 0.15 })
    return () => { tween.kill() }
  }, [children])
  return <Tag ref={ref} className={className}>{children}</Tag>
}
```

- [ ] **Step 2: `Words.tsx`** — reveal palavra-a-palavra; ramo scrub vs bloco conforme `useReducedHeavy()`; `aria-label`; cleanup.

- [ ] **Step 3: `Magnetic.tsx`** — `pointer: fine` guard; `gsap.quickTo`; passthrough quando coarse/reduced; cleanup dos listeners.

- [ ] **Step 4: `Parallax.tsx`** — só ativa quando `!useReducedHeavy()`; `yPercent` scrub com trigger no parent; cleanup do ScrollTrigger.

- [ ] **Step 5: Verificar** (na `/styleguide`): headline sobe por palavra; `<Words>` clareia no scroll; botão magnético segue o mouse no desktop; parallax move imagem marcada. Reduced-motion desliga scrub/parallax/magnetic mas mantém headline/words-em-bloco.

- [ ] **Step 6: Biome + tsc + commit**

```bash
git add -A
git commit -m "feat(motion): SplitHeadline, Words, Magnetic e Parallax (port semog.js)"
```

---

### Task 6: Primitivos de UI (Button, Container, Section, Eyebrow, GradientText)

**Files:**
- Create: `src/components/ui/Button.tsx`, `Container.tsx`, `Section.tsx`, `Eyebrow.tsx`, `GradientText.tsx`

**Interfaces:**
- Consumes: tokens `@theme` (Task 1).
- Produces:
  - `<Button variant="primary"|"ghost"|"white"|"glass" size?="md"|"lg"|"sm" href?={string} withArrow?={boolean}>` — renderiza `<a>` se `href`, senão `<button>`. Fiel a `semog.css:288-330, 519-530` (pílula, timings/easings, hover translateY, seta que desliza).
  - `<Container>` — `max-width: var(--container-site)`, `margin-inline auto`, padding `--gutter` (`semog.css:188-193`). Implementar o gutter como `px-[clamp(1.25rem,4vw,3rem)]`.
  - `<Section light?={boolean} white?={boolean}>` — `padding-block: clamp(5rem,10vw,9rem)`; aplica `.sec-light`/`.sec-light.white` quando `light`.
  - `<Eyebrow>` — `semog.css:331-337` (uppercase, tracking, tracinho antes).
  - `<GradientText variant?="ice"|"brand">` — usa `.gx-ice`/`.gx`.

- [ ] **Step 1: `Button.tsx`** — mapear as classes do `.btn`/variantes para Tailwind (pílula `rounded-pill`, padding por size, `transition` com o cubic-bezier `[cubic-bezier(0.16,1,0.3,1)]`, hover `-translate-y-0.5`, `active:scale-[0.98]`, seta `group-hover:translate-x-1`). Cores por variante conforme o ref.

```tsx
import type { ReactNode } from 'react'

type Variant = 'primary' | 'ghost' | 'white' | 'glass'
type Size = 'md' | 'lg' | 'sm'

const base =
  'group inline-flex items-center justify-center gap-2.5 rounded-pill font-semibold leading-none whitespace-nowrap border border-transparent transition-[transform,box-shadow,background,color,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98]'
const sizes: Record<Size, string> = {
  md: 'px-8 py-[0.95rem] text-[0.98rem]',
  lg: 'px-[2.6rem] py-[1.15rem] text-[1.05rem]',
  sm: 'px-[1.4rem] py-[0.7rem] text-[0.88rem]',
}
const variants: Record<Variant, string> = {
  primary: 'bg-ice-400 text-navy-900 shadow-[0_8px_30px_-10px_rgba(173,213,235,0.45)] hover:bg-ice-300 hover:-translate-y-0.5',
  ghost: 'bg-ice-400/5 border-line-strong text-fg hover:border-ice-400 hover:bg-ice-400/10 hover:-translate-y-0.5',
  white: 'bg-white text-navy-950 shadow-[0_10px_34px_-12px_rgba(255,255,255,0.35)] hover:bg-silver-100 hover:-translate-y-0.5',
  glass: 'text-fg border-white/20 hover:bg-white hover:text-navy-950 hover:-translate-y-0.5',
}

export function Button({
  children, variant = 'primary', size = 'md', href, withArrow, className = '',
}: {
  children: ReactNode; variant?: Variant; size?: Size; href?: string; withArrow?: boolean; className?: string
}) {
  const cls = `${base} ${sizes[size]} ${variants[variant]} ${className}`
  const inner = (
    <>
      {children}
      {withArrow && (
        <span className="transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1">→</span>
      )}
    </>
  )
  return href ? <a href={href} className={cls}>{inner}</a> : <button type="button" className={cls}>{inner}</button>
}
```

- [ ] **Step 2: `Container.tsx`, `Section.tsx`, `Eyebrow.tsx`, `GradientText.tsx`** — implementar conforme as interfaces acima, fiéis aos ranges citados do `semog.css`.

- [ ] **Step 3: Verificar** (na `/styleguide`): as 4 variantes de botão em 3 tamanhos, com hover/seta corretos; Container centraliza no max-width; Section aplica ritmo claro/escuro; Eyebrow e GradientText corretos.

- [ ] **Step 4: Biome + tsc + commit**

```bash
git add -A
git commit -m "feat(ui): primitivos Button, Container, Section, Eyebrow, GradientText"
```

---

### Task 7: Rota `/styleguide` + verificação do Plano 2

**Files:**
- Create: `src/app/(frontend)/styleguide/page.tsx`

**Interfaces:**
- Consumes: todos os primitivos e componentes de motion.
- Produces: página de vitrine (dev) que exercita tokens, tipografia, botões, cards, eyebrow, gradient text, e cada primitivo de motion (Reveal/Stagger/Counter/SplitHeadline/Words/Magnetic/Parallax).

- [ ] **Step 1: Montar a `/styleguide`**

Uma página client (ou com ilhas client) que renderiza: paleta (swatches navy/ice/silver), escala de tipografia (hero/h2/h3/lead), as 4 variantes × 3 tamanhos de Button, um card de exemplo, Eyebrow, GradientText, e seções demonstrando cada motion primitive (incluindo um `<Counter value={700}/>` e um `<Section light>` para ver o ritmo claro). Não precisa de banco.

- [ ] **Step 2: Verificação visual contra o `_reference/`**

Abrir `/styleguide` e comparar cores/tipografia/botões/timings com `_reference/` (abrir o site estático em paralelo via `python -m http.server` na pasta `_reference/`, se ajudar). Conferir: navy/ice batem, fontes Clash/Satoshi corretas, botão pílula com hover idêntico, seta desliza, reveal/counter funcionam, reduced-motion desliga só o pesado.
Expected: paridade visual com o design validado.

- [ ] **Step 3: Verificação final do Plano 2**

Run: `pnpm check && pnpm exec tsc --noEmit`
Expected: 0 warnings, sem erros. Dev server sobe; `/styleguide` renderiza sem erro de console (a home `/` pode seguir 500 por causa do getPayload sem DB — fora do escopo deste plano).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(design): rota /styleguide para validar design system e motion"
```

---

## Self-Review (cobertura vs. spec)

- **Tailwind v4 com tokens do semog.css** → Task 1. ✅
- **Tokens semânticos + ritmo claro/escuro (.sec-light)** → Task 1 (Steps 4). ✅
- **Fontes self-hosted (Clash + Satoshi), sem Fontshare runtime** → Task 2. ✅
- **Lenis + política de reduced-motion** → Task 3. ✅
- **Reveals/Stagger/Counter (pt-BR)** → Task 4. ✅
- **SplitHeadline/Words/Magnetic/Parallax** → Task 5. ✅
- **Primitivos de UI (Button etc.) em Tailwind** → Task 6. ✅
- **Verificação sem banco (/styleguide) + paridade com _reference** → Task 7. ✅

**Fora do escopo (Plano 3+):** Header/Footer (Globals do CMS), blocos de página, preloader/nav/marquee/wa-float completos (entram quando as páginas forem montadas), imagens via next/image, formulários. Sem placeholders pendentes dentro do escopo do Plano 2.
```
