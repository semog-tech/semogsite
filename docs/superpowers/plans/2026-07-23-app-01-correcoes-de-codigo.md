# Correções de Código — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cortar o peso do hero de 2,9 MB para menos de 900 KB na primeira tela, dar ao site um favicon, e trocar os testes de boilerplate do template Payload por testes reais rodando no CI.

**Architecture:** A lógica de sequenciamento do vídeo sai do `useEffect` para um módulo puro (`src/motion/videoSequence.ts`), que fica testável em jsdom sem simular `<video>`. O componente vira consumidor dessa lógica e passa a carregar cada clipe só quando ele está prestes a entrar. O re-download por ciclo é resolvido por header de cache em `next.config.ts`, não por código.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.7, Vitest 4 (jsdom), Playwright 1.58, Biome 2.5, pnpm 10.

## Global Constraints

- Gerenciador de pacotes: `pnpm` (v10.12.4, campo `packageManager`). Nunca `npm`/`yarn`.
- Formatação e lint: `pnpm check` (Biome) precisa passar limpo antes de cada commit.
- Tipos: `pnpm exec tsc --noEmit` precisa passar limpo antes de cada commit.
- Comentários de código em português, explicando o **porquê**, seguindo o padrão dos arquivos vizinhos (ver `src/motion/VideoSequenceBackground.tsx`).
- O autoplay do vídeo de fundo **permanece**, inclusive sob `prefers-reduced-motion` — é decisão registrada do dono do site (`src/motion/VideoSequenceBackground.tsx:19-22`). Este plano adiciona um controle de pausa, não remove o autoplay.
- Nenhuma mudança visual na home além do botão de pausa. Qualquer alteração de layout é regressão.

---

### Task 1: Favicon

O site não tem `favicon.ico`, `icon.png` nem `icons` no metadata. O console loga 404 em toda visita e o Google mostra ícone genérico no resultado de busca mobile. A marca é o monograma de três barras de `public/semog-logo-light.svg` (três retângulos, `#F4F6FB`).

**Files:**
- Create: `src/app/icon.svg`
- Create: `scripts/gen-apple-icon.mjs`
- Create: `src/app/apple-icon.png` (gerado pelo script)
- Test: `tests/e2e/icons.e2e.spec.ts`

**Interfaces:**
- Consumes: nada.
- Produces: nada consumido por outras tasks. O Next.js detecta `src/app/icon.svg` e `src/app/apple-icon.png` por convenção de arquivo e injeta as `<link>` sozinho — nenhum código de metadata é necessário.

- [ ] **Step 1: Escrever o teste que falha**

Create `tests/e2e/icons.e2e.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test.describe('Ícones do site', () => {
  test('serve o icon.svg e o apple-icon.png', async ({ request }) => {
    const icon = await request.get('http://localhost:3000/icon.svg')
    expect(icon.status()).toBe(200)
    expect(icon.headers()['content-type']).toContain('image/svg+xml')

    const apple = await request.get('http://localhost:3000/apple-icon.png')
    expect(apple.status()).toBe(200)
    expect(apple.headers()['content-type']).toContain('image/png')
  })

  test('a home declara o ícone no <head>', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    const icon = page.locator('link[rel="icon"]')
    await expect(icon).toHaveCount(1)
  })
})
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `pnpm exec playwright test tests/e2e/icons.e2e.spec.ts --config=playwright.config.ts`
Expected: FAIL — `expect(received).toBe(200)` recebendo `404` para `/icon.svg`.

- [ ] **Step 3: Criar o ícone SVG**

Create `src/app/icon.svg`. As três barras são o monograma de `public/semog-logo-light.svg` (retângulos em `x=0`, `x=52.4`, `x=104.79`, largura `36.41`, altura `94.93`), recentradas num quadrado de 32 com respiro e sobre o navy da marca:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#0a102e"/>
  <g fill="#F4F6FB">
    <rect x="7" y="8" width="4.2" height="16"/>
    <rect x="13.9" y="8" width="4.2" height="16"/>
    <rect x="20.8" y="8" width="4.2" height="16"/>
  </g>
</svg>
```

- [ ] **Step 4: Criar o script que gera o apple-icon**

O Safari não aceita SVG em `apple-touch-icon` — precisa de PNG 180×180. Create `scripts/gen-apple-icon.mjs`:

```js
import { readFileSync, writeFileSync } from 'node:fs'
import sharp from 'sharp'

/**
 * Rasteriza `src/app/icon.svg` em PNG 180x180 para o `apple-icon` (o Safari
 * ignora SVG em apple-touch-icon). Rodar de novo só quando a marca mudar —
 * o PNG é versionado, não é gerado no build.
 */
const svg = readFileSync('src/app/icon.svg')
const png = await sharp(svg, { density: 720 }).resize(180, 180).png().toBuffer()
writeFileSync('src/app/apple-icon.png', png)
console.log(`apple-icon.png gerado (${Math.round(png.length / 1024)} KB)`)
```

- [ ] **Step 5: Rodar o script**

Run: `pnpm exec node scripts/gen-apple-icon.mjs`
Expected: `apple-icon.png gerado (N KB)` e o arquivo `src/app/apple-icon.png` existindo.

- [ ] **Step 6: Rodar o teste e confirmar que passa**

Run: `pnpm exec playwright test tests/e2e/icons.e2e.spec.ts --config=playwright.config.ts`
Expected: PASS, 2 testes.

- [ ] **Step 7: Verificar lint e tipos**

Run: `pnpm check && pnpm exec tsc --noEmit`
Expected: sem erros.

- [ ] **Step 8: Commit**

```bash
git add src/app/icon.svg src/app/apple-icon.png scripts/gen-apple-icon.mjs tests/e2e/icons.e2e.spec.ts
git commit -m "feat(brand): favicon e apple-icon a partir do monograma"
```

---

### Task 2: Extrair a lógica de sequenciamento do vídeo

`VideoSequenceBackground.tsx` mistura política (quando trocar, quando pré-carregar, qual o próximo) com manipulação de DOM dentro de um `useEffect`. Isso torna a política impossível de testar. Esta task extrai a política para um módulo puro, sem mudar comportamento nenhum ainda.

**Files:**
- Create: `src/motion/videoSequence.ts`
- Test: `tests/int/videoSequence.int.spec.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `FADE_MS: number` (1400)
  - `PRELOAD_LEAD_S: number` (3)
  - `sequenceFor(videos: string[], isMobile: boolean): string[]`
  - `nextIndex(index: number, length: number): number`
  - `shouldFade(currentTime: number, duration: number, fadeSeconds: number): boolean`
  - `shouldPreload(currentTime: number, duration: number, leadSeconds: number): boolean`

  A Task 3 consome todos esses.

- [ ] **Step 1: Escrever o teste que falha**

Create `tests/int/videoSequence.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  FADE_MS,
  nextIndex,
  PRELOAD_LEAD_S,
  sequenceFor,
  shouldFade,
  shouldPreload,
} from '@/motion/videoSequence'

describe('sequenceFor', () => {
  it('mantém todos os clipes no desktop', () => {
    expect(sequenceFor(['a.mp4', 'b.mp4', 'c.mp4'], false)).toEqual(['a.mp4', 'b.mp4', 'c.mp4'])
  })

  it('usa só o primeiro clipe no mobile', () => {
    expect(sequenceFor(['a.mp4', 'b.mp4', 'c.mp4'], true)).toEqual(['a.mp4'])
  })

  it('não quebra com lista vazia', () => {
    expect(sequenceFor([], true)).toEqual([])
    expect(sequenceFor([], false)).toEqual([])
  })
})

describe('nextIndex', () => {
  it('avança e cicla', () => {
    expect(nextIndex(0, 4)).toBe(1)
    expect(nextIndex(3, 4)).toBe(0)
  })

  it('com um clipe só, fica sempre no mesmo', () => {
    expect(nextIndex(0, 1)).toBe(0)
  })

  it('com lista vazia, devolve 0 em vez de NaN', () => {
    expect(nextIndex(0, 0)).toBe(0)
  })
})

describe('shouldFade', () => {
  it('é falso no meio do clipe', () => {
    expect(shouldFade(2, 10, 1.4)).toBe(false)
  })

  it('é verdadeiro dentro da janela de crossfade', () => {
    expect(shouldFade(8.7, 10, 1.4)).toBe(true)
  })

  it('é falso enquanto a duração não é conhecida', () => {
    expect(shouldFade(2, 0, 1.4)).toBe(false)
    expect(shouldFade(2, Number.NaN, 1.4)).toBe(false)
  })
})

describe('shouldPreload', () => {
  it('é falso no começo do clipe', () => {
    expect(shouldPreload(1, 10, 3)).toBe(false)
  })

  it('vira verdadeiro antes do crossfade começar', () => {
    expect(shouldPreload(7.1, 10, 3)).toBe(true)
    // a janela de preload (3s) abre antes da de fade (1,4s) — é isso que
    // garante que o próximo clipe esteja pronto quando o fade começar
    expect(shouldFade(7.1, 10, 1.4)).toBe(false)
  })

  it('é falso enquanto a duração não é conhecida', () => {
    expect(shouldPreload(1, 0, 3)).toBe(false)
    expect(shouldPreload(1, Number.NaN, 3)).toBe(false)
  })
})

describe('constantes', () => {
  it('a janela de preload é maior que a de fade', () => {
    expect(PRELOAD_LEAD_S * 1000).toBeGreaterThan(FADE_MS)
  })
})
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/videoSequence.int.spec.ts`
Expected: FAIL — `Failed to resolve import "@/motion/videoSequence"`.

- [ ] **Step 3: Escrever a implementação mínima**

Create `src/motion/videoSequence.ts`:

```ts
/**
 * Política de sequenciamento do fundo de vídeo do hero, separada da
 * manipulação de DOM em `VideoSequenceBackground.tsx`. Funções puras: dá
 * para testar a decisão ("já é hora de carregar o próximo?") sem simular um
 * `<video>` em jsdom, que não implementa `duration`/`canplay`.
 */

/** Duração do crossfade entre as duas camadas. */
export const FADE_MS = 1400

/**
 * Antecedência com que o próximo clipe começa a carregar. Precisa ser MAIOR
 * que `FADE_MS` — o clipe tem que estar pronto quando o crossfade começar,
 * senão a camada que entra aparece preta.
 */
export const PRELOAD_LEAD_S = 3

/**
 * No mobile, um clipe só: o ciclo completo custa ~2,9 MB, o que é caro demais
 * em rede móvel para um fundo decorativo. O primeiro clipe é a matriz (Recife).
 */
export function sequenceFor(videos: string[], isMobile: boolean): string[] {
  if (!isMobile) return videos
  return videos.slice(0, 1)
}

/** Próximo índice, ciclando. Devolve 0 em lista vazia (em vez de NaN). */
export function nextIndex(index: number, length: number): number {
  if (length <= 0) return 0
  return (index + 1) % length
}

/**
 * `duration` é NaN até o browser ler os metadados do clipe — daí a guarda em
 * `Number.isFinite`, sem a qual a comparação seria sempre falsa de um jeito
 * silencioso.
 */
function withinTail(currentTime: number, duration: number, seconds: number): boolean {
  if (!Number.isFinite(duration) || duration <= 0) return false
  return currentTime >= duration - seconds
}

/** Entrou na janela de crossfade. */
export function shouldFade(currentTime: number, duration: number, fadeSeconds: number): boolean {
  return withinTail(currentTime, duration, fadeSeconds)
}

/** Entrou na janela de pré-carregamento do próximo clipe. */
export function shouldPreload(
  currentTime: number,
  duration: number,
  leadSeconds: number,
): boolean {
  return withinTail(currentTime, duration, leadSeconds)
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/videoSequence.int.spec.ts`
Expected: PASS, 12 testes.

- [ ] **Step 5: Verificar lint e tipos**

Run: `pnpm check && pnpm exec tsc --noEmit`
Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add src/motion/videoSequence.ts tests/int/videoSequence.int.spec.ts
git commit -m "refactor(motion): extrai política do sequenciador de vídeo do hero"
```

---

### Task 3: Carregar cada clipe só quando ele vai entrar

Hoje as duas camadas usam `preload="auto"` (`VideoSequenceBackground.tsx:96,105`) e recebem `src` na montagem, então os quatro clipes começam a baixar no load da página: 2,9 MB antes de qualquer interação. Além disso o hero abre preto, porque não há `poster`.

**Files:**
- Modify: `src/motion/VideoSequenceBackground.tsx` (arquivo inteiro reescrito)
- Modify: `src/blocks/Hero/Component.tsx:189`
- Create: `public/hero/poster.webp` (gerado no Step 4)

**Interfaces:**
- Consumes: `FADE_MS`, `PRELOAD_LEAD_S`, `sequenceFor`, `nextIndex`, `shouldFade`, `shouldPreload` de `@/motion/videoSequence` (Task 2).
- Produces: `VideoSequenceBackground` passa a aceitar a prop `poster?: string`. A Task 4 adiciona o botão de pausa neste mesmo componente.

- [ ] **Step 1: Escrever o teste que falha**

Este é comportamento de DOM, então o teste é e2e e mede rede de verdade. Create `tests/e2e/hero-video.e2e.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

const MB = 1024 * 1024

test.describe('Vídeo de fundo do hero', () => {
  test('não baixa a sequência inteira no carregamento', async ({ page }) => {
    const videoBytes = new Map<string, number>()
    page.on('response', async (res) => {
      if (!/\/hero\/.*\.mp4/.test(res.url())) return
      const len = Number(res.headers()['content-length'] ?? 0)
      videoBytes.set(res.url(), (videoBytes.get(res.url()) ?? 0) + len)
    })

    await page.goto('http://localhost:3000/', { waitUntil: 'load' })
    await page.waitForTimeout(2500)

    const total = [...videoBytes.values()].reduce((a, b) => a + b, 0)
    expect(total, `baixou ${Math.round(total / 1024)} KB de vídeo`).toBeLessThan(0.9 * MB)
    expect(videoBytes.size, 'mais de um clipe pedido no load').toBeLessThanOrEqual(1)
  })

  test('mostra o poster antes do vídeo decodificar', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    const first = page.locator('section video').first()
    await expect(first).toHaveAttribute('poster', /poster\.webp/)
  })

  test('no mobile usa um clipe só', async ({ page }) => {
    const urls = new Set<string>()
    page.on('request', (req) => {
      if (/\/hero\/.*\.mp4/.test(req.url())) urls.add(req.url())
    })

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('http://localhost:3000/', { waitUntil: 'load' })
    await page.waitForTimeout(3000)

    expect(urls.size).toBeLessThanOrEqual(1)
  })
})
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `pnpm exec playwright test tests/e2e/hero-video.e2e.spec.ts --config=playwright.config.ts`
Expected: FAIL no primeiro teste — o total baixado passa de 2,5 MB e `videoBytes.size` é 4.

- [ ] **Step 3: Reescrever o componente**

Replace `src/motion/VideoSequenceBackground.tsx` inteiro:

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import {
  FADE_MS,
  nextIndex,
  PRELOAD_LEAD_S,
  sequenceFor,
  shouldFade,
  shouldPreload,
} from './videoSequence'

type Props = {
  videos: string[]
  poster?: string
  className?: string
}

/**
 * Fundo de vídeo em sequência com crossfade, para o hero (Hero
 * `background: 'videoSequence'`). Duas camadas `<video>` empilhadas fazem
 * ping-pong: enquanto uma toca, a outra recebe o próximo clipe; ao se
 * aproximar do fim do clipe atual, um crossfade de opacidade troca as
 * camadas.
 *
 * Carregamento preguiçoso: `preload="none"` nas duas camadas e `src`
 * atribuído só quando faltam `PRELOAD_LEAD_S` segundos para o clipe atual
 * acabar. Antes disso a página baixava os quatro clipes no load — 2,9 MB
 * antes de qualquer interação. O `poster` cobre a janela entre o primeiro
 * paint e o primeiro frame decodificado, que antes era preta.
 *
 * O re-download a cada volta do ciclo NÃO é resolvido aqui: era o
 * `Cache-Control: public, max-age=0, must-revalidate` que o Next.js aplica
 * por padrão a `/public`. Corrigido por header em `next.config.ts`.
 *
 * Anima SEMPRE — muted/autoplay/playsInline, inclusive sob
 * `prefers-reduced-motion`: o movimento do hero faz parte da identidade e é
 * pedido explícito do dono do site. O botão de pausa (`.hero-video-pause`)
 * dá a saída exigida pela WCAG 2.2.2 sem tirar o autoplay. Todos os clipes
 * são mudos, então o autoplay é permitido pelos navegadores.
 */
export function VideoSequenceBackground({ videos, poster, className }: Props) {
  const aRef = useRef<HTMLVideoElement>(null)
  const bRef = useRef<HTMLVideoElement>(null)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const a = aRef.current
    const b = bRef.current
    if (!a || !b) return

    // `matchMedia` só existe no cliente; o efeito já não roda no servidor.
    const isMobile = window.matchMedia('(max-width: 768px)').matches
    const seq = sequenceFor(videos, isMobile)
    if (seq.length === 0) return

    const layers = [a, b] as const
    let active = 0 // camada visível: 0 = a, 1 = b
    let pointer = 0 // índice do clipe tocando na camada ativa
    let preloaded = false // o próximo clipe já foi atribuído à camada oculta?
    let fading = false
    let raf = 0
    let swapTimer = 0

    for (const v of layers) {
      v.muted = true
      v.preload = 'none'
    }

    a.src = seq[0]
    a.load()
    a.style.opacity = '1'
    b.style.opacity = '0'

    const startA = () => {
      a.play().catch(() => {})
    }
    if (a.readyState >= 2) startA()
    else a.addEventListener('canplay', startA, { once: true })

    const FADE_S = FADE_MS / 1000

    const tick = () => {
      const cur = layers[active]
      const other = layers[active ^ 1]

      // Com um clipe só (mobile), não há troca: o `loop` do elemento resolve.
      if (seq.length > 1) {
        if (!preloaded && shouldPreload(cur.currentTime, cur.duration, PRELOAD_LEAD_S)) {
          preloaded = true
          other.src = seq[nextIndex(pointer, seq.length)]
          other.load()
        }

        if (!fading && preloaded && shouldFade(cur.currentTime, cur.duration, FADE_S)) {
          fading = true
          other.currentTime = 0
          other.play().catch(() => {})
          cur.style.transition = `opacity ${FADE_MS}ms linear`
          other.style.transition = `opacity ${FADE_MS}ms linear`
          cur.style.opacity = '0'
          other.style.opacity = '1'
          swapTimer = window.setTimeout(() => {
            active ^= 1
            pointer = nextIndex(pointer, seq.length)
            preloaded = false
            fading = false
          }, FADE_MS)
        }
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(swapTimer)
      a.removeEventListener('canplay', startA)
    }
  }, [videos])

  return (
    <div className={className} aria-hidden="true">
      <video
        ref={aRef}
        muted
        playsInline
        loop
        preload="none"
        poster={poster}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: 1 }}
      />
      <video
        ref={bRef}
        muted
        playsInline
        preload="none"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: 0 }}
      />
    </div>
  )
}
```

Nota sobre o `loop` na camada A: com um clipe só (mobile) ele é o que mantém o fundo em movimento. No desktop o crossfade troca a camada antes de o clipe terminar, então o `loop` nunca dispara.

O `paused`/`setPaused` declarados aqui são consumidos na Task 4 — deixe-os no lugar.

- [ ] **Step 4: Gerar o poster do primeiro frame**

Create `scripts/gen-hero-poster.mjs`:

```js
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from 'playwright'
import sharp from 'sharp'

/**
 * Extrai o primeiro frame de `public/hero/recife.mp4` para servir de `poster`
 * do hero — sem ele, a seção abre preta até o vídeo decodificar. Usa o
 * Chromium do Playwright (já é dependência do projeto) em vez de ffmpeg, que
 * nem toda máquina tem instalado.
 *
 * Rodar de novo só quando o primeiro clipe da sequência mudar.
 */
const SRC = 'public/hero/recife.mp4'
const OUT = 'public/hero/poster.webp'

const tmp = mkdtempSync(join(tmpdir(), 'poster-'))
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })

const dataUrl = `data:video/mp4;base64,${readFileSync(SRC).toString('base64')}`
await page.setContent(
  `<style>body{margin:0}video{width:1280px;height:720px;object-fit:cover}</style><video id="v" muted src="${dataUrl}"></video>`,
)
await page.evaluate(
  () =>
    new Promise((resolve) => {
      const v = document.getElementById('v')
      v.onseeked = resolve
      v.currentTime = 0.1
    }),
)
const frame = join(tmp, 'frame.png')
writeFileSync(frame, await page.locator('#v').screenshot())
await browser.close()

const info = await sharp(frame).resize({ width: 1280 }).webp({ quality: 55 }).toFile(OUT)
console.log(`${OUT} gerado (${Math.round(info.size / 1024)} KB)`)
```

Run: `pnpm exec node scripts/gen-hero-poster.mjs`
Expected: `public/hero/poster.webp gerado (N KB)`, com N abaixo de 120.

- [ ] **Step 5: Passar o poster no Hero**

Modify `src/blocks/Hero/Component.tsx`. Logo abaixo da constante `HERO_SEQUENCE` (linha 43), adicione:

```ts
/** Primeiro frame de `recife.mp4`, para o hero não abrir preto. */
const HERO_POSTER = '/hero/poster.webp'
```

E na linha 189, troque:

```tsx
        <VideoSequenceBackground className="absolute inset-0 z-[1]" videos={HERO_SEQUENCE} />
```

por:

```tsx
        <VideoSequenceBackground
          className="absolute inset-0 z-[1]"
          videos={HERO_SEQUENCE}
          poster={HERO_POSTER}
        />
```

- [ ] **Step 6: Corrigir o cache dos clipes**

Modify `next.config.ts`. Dentro de `async headers()`, antes do `return` da lista, adicione uma entrada nova ao array retornado — os clipes do hero nunca mudam de conteúdo sem mudar de nome, então podem ser imutáveis:

```ts
      {
        // O Next serve /public com `public, max-age=0, must-revalidate`, o que
        // faz o browser revalidar cada clipe a cada volta do ciclo do hero e
        // rebaixar o arquivo inteiro. Os clipes são estáticos e versionados
        // pelo nome — cache longo é seguro e corta o re-download.
        source: '/hero/:file*.mp4',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
```

- [ ] **Step 7: Rodar o teste e confirmar que passa**

Run: `pnpm exec playwright test tests/e2e/hero-video.e2e.spec.ts --config=playwright.config.ts`
Expected: PASS, 3 testes. O primeiro teste deve reportar menos de 900 KB.

- [ ] **Step 8: Conferir que a home continua visualmente igual**

Run: `pnpm dev` e abra `http://localhost:3000/`.
Expected: o hero abre com o poster, o primeiro clipe entra em seguida e a sequência troca normalmente no desktop. Nenhuma mudança de layout, tipografia ou espaçamento.

- [ ] **Step 9: Verificar lint e tipos**

Run: `pnpm check && pnpm exec tsc --noEmit`
Expected: sem erros.

- [ ] **Step 10: Commit**

```bash
git add src/motion/VideoSequenceBackground.tsx src/blocks/Hero/Component.tsx next.config.ts public/hero/poster.webp scripts/gen-hero-poster.mjs tests/e2e/hero-video.e2e.spec.ts
git commit -m "perf(hero): carrega clipes sob demanda e cacheia /hero/*.mp4

Antes: 4 clipes (2,9 MB) baixados no load por causa de preload=auto, e
re-download a cada volta do ciclo por causa do max-age=0 padrão do Next
para /public. Agora: preload=none, src atribuído 3s antes da troca,
poster no primeiro frame, um clipe só no mobile e cache imutável."
```

---

### Task 4: Botão de pausa do vídeo de fundo

WCAG 2.2.2 exige um controle para parar movimento automático que dure mais de 5 segundos. O autoplay permanece (decisão do dono do site); o que falta é a saída.

**Files:**
- Modify: `src/motion/VideoSequenceBackground.tsx`
- Modify: `src/styles/theme.css` (fim do arquivo, dentro de `@layer utilities`)
- Test: `tests/e2e/hero-video.e2e.spec.ts` (adiciona um caso)

**Interfaces:**
- Consumes: `paused`/`setPaused` já declarados no componente pela Task 3.
- Produces: nada consumido por outras tasks.

- [ ] **Step 1: Escrever o teste que falha**

Adicione ao final de `tests/e2e/hero-video.e2e.spec.ts`, dentro do `test.describe` existente:

```ts
  test('pode pausar e retomar o vídeo de fundo', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    const button = page.getByRole('button', { name: /pausar vídeo de fundo/i })
    await expect(button).toBeVisible()

    await button.click()
    await expect(page.getByRole('button', { name: /retomar vídeo de fundo/i })).toBeVisible()

    const isPaused = await page.locator('section video').first().evaluate((v: HTMLVideoElement) => v.paused)
    expect(isPaused).toBe(true)
  })
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `pnpm exec playwright test tests/e2e/hero-video.e2e.spec.ts --config=playwright.config.ts -g "pausar"`
Expected: FAIL — nenhum botão com esse nome acessível.

- [ ] **Step 3: Adicionar o botão ao componente**

Em `src/motion/VideoSequenceBackground.tsx`, adicione este efeito logo depois do `useEffect` principal:

```tsx
  // Aplica o estado de pausa às duas camadas. Fica num efeito separado do
  // sequenciador para não reiniciar a sequência a cada clique no botão.
  useEffect(() => {
    for (const v of [aRef.current, bRef.current]) {
      if (!v) continue
      if (paused) v.pause()
      else if (v.style.opacity !== '0') v.play().catch(() => {})
    }
  }, [paused])
```

E troque o `return` do componente por:

```tsx
  return (
    <>
      <div className={className} aria-hidden="true">
        <video
          ref={aRef}
          muted
          playsInline
          loop
          preload="none"
          poster={poster}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: 1 }}
        />
        <video
          ref={bRef}
          muted
          playsInline
          preload="none"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: 0 }}
        />
      </div>
      <button
        type="button"
        className="hero-video-pause liquid-glass"
        onClick={() => setPaused((v) => !v)}
        aria-label={paused ? 'Retomar vídeo de fundo' : 'Pausar vídeo de fundo'}
      >
        {paused ? (
          <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor" aria-hidden="true">
            <path d="M1 1.2v11.6a.5.5 0 00.77.42l9-5.8a.5.5 0 000-.84l-9-5.8A.5.5 0 001 1.2z" />
          </svg>
        ) : (
          <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor" aria-hidden="true">
            <rect x="1" y="1" width="3.6" height="12" rx="1" />
            <rect x="7.4" y="1" width="3.6" height="12" rx="1" />
          </svg>
        )}
      </button>
    </>
  )
```

O `<div>` do vídeo continua `aria-hidden`, mas o botão fica fora dele — dentro, leitor de tela nenhum o alcançaria.

- [ ] **Step 4: Estilizar o botão**

Adicione ao fim de `src/styles/theme.css`, dentro do bloco `@layer utilities` existente:

```css
  /* Controle de pausa do fundo de vídeo do hero (WCAG 2.2.2). Discreto no
     canto inferior direito da seção, acima do scrim (`z-[2]`) e abaixo do
     conteúdo (`z-[3]`) — não compete com os CTAs. */
  .hero-video-pause {
    position: absolute;
    right: clamp(1rem, 3vw, 2rem);
    bottom: clamp(1rem, 3vw, 2rem);
    z-index: 4;
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-pill);
    color: var(--text);
    opacity: 0.55;
    transition: opacity 0.25s ease;
  }
  .hero-video-pause:hover,
  .hero-video-pause:focus-visible {
    opacity: 1;
  }
```

- [ ] **Step 5: Rodar o teste e confirmar que passa**

Run: `pnpm exec playwright test tests/e2e/hero-video.e2e.spec.ts --config=playwright.config.ts`
Expected: PASS, 4 testes.

- [ ] **Step 6: Conferir que o botão não colide com o WhatsApp flutuante**

Run: `pnpm dev`, abra `http://localhost:3000/` em 390×844 e em 1440×900.
Expected: o botão de pausa fica no canto da seção do hero, sem sobrepor o botão de WhatsApp (que é `position: fixed` no canto da viewport). Se houver colisão no mobile, mova o botão de pausa para `left` em vez de `right` na media query de até 768px.

- [ ] **Step 7: Verificar lint e tipos**

Run: `pnpm check && pnpm exec tsc --noEmit`
Expected: sem erros.

- [ ] **Step 8: Commit**

```bash
git add src/motion/VideoSequenceBackground.tsx src/styles/theme.css tests/e2e/hero-video.e2e.spec.ts
git commit -m "a11y(hero): botão de pausa do vídeo de fundo (WCAG 2.2.2)"
```

---

### Task 5: Substituir os testes de boilerplate

`tests/e2e/frontend.e2e.spec.ts` ainda afirma que o título é `Payload Blank Template` e o `h1` é "Welcome to your new project." — asserções do template do Payload que nunca foram atualizadas. `tests/int/api.int.spec.ts` é o `fetches users` do template e falha no `beforeAll` porque exige banco.

**Files:**
- Modify: `tests/e2e/frontend.e2e.spec.ts` (arquivo inteiro reescrito)
- Delete: `tests/int/api.int.spec.ts`
- Test: os próprios arquivos acima

**Interfaces:**
- Consumes: nada.
- Produces: nada consumido por outras tasks.

- [ ] **Step 1: Reescrever o e2e da home**

Replace `tests/e2e/frontend.e2e.spec.ts` inteiro:

```ts
import { expect, test } from '@playwright/test'

test.describe('Home', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/')
  })

  test('tem o título e a headline da Semog', async ({ page }) => {
    await expect(page).toHaveTitle(/Semog/)
    await expect(page.locator('h1').first()).toContainText('Preocupe-se apenas')
  })

  test('declara o idioma como pt-BR', async ({ page }) => {
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR')
  })

  test('tem uma hierarquia de títulos sem furos', async ({ page }) => {
    const h1 = await page.locator('h1').count()
    expect(h1, 'a página deve ter exatamente um h1').toBe(1)
    expect(await page.locator('h2').count()).toBeGreaterThan(0)
  })

  test('toda imagem tem alt', async ({ page }) => {
    const semAlt = await page.locator('img:not([alt])').count()
    expect(semAlt).toBe(0)
  })

  test('a navegação principal leva às páginas institucionais', async ({ page }) => {
    for (const [rotulo, href] of [
      ['A Semog', '/semog'],
      ['Soluções', '/solucoes'],
      ['Contato', '/contato'],
    ] as const) {
      await expect(page.locator(`nav a[href="${href}"]`).first()).toContainText(rotulo)
    }
  })

  test('o CTA principal leva para a proposta', async ({ page }) => {
    await expect(page.locator('a[href="/proposta"]').first()).toBeVisible()
  })
})

test.describe('Páginas institucionais', () => {
  for (const rota of ['/semog', '/solucoes', '/garante', '/contato', '/proposta', '/blog']) {
    test(`${rota} responde 200 e tem h1`, async ({ page }) => {
      const res = await page.goto(`http://localhost:3000${rota}`)
      expect(res?.status()).toBe(200)
      await expect(page.locator('h1').first()).toBeVisible()
    })
  }
})

test.describe('404', () => {
  test('rota inexistente devolve 404 com título próprio', async ({ page }) => {
    const res = await page.goto('http://localhost:3000/rota-que-nao-existe-123')
    expect(res?.status()).toBe(404)
    await expect(page).toHaveTitle(/não encontrada/i)
  })
})
```

- [ ] **Step 2: Remover o teste de integração do template**

O `fetches users` do template exige banco e não testa nada nosso. A cobertura de integração agora vem de `tests/int/videoSequence.int.spec.ts` (Task 2).

```bash
git rm tests/int/api.int.spec.ts
```

- [ ] **Step 3: Rodar os testes e confirmar que passam**

Run: `pnpm exec vitest run --config ./vitest.config.mts`
Expected: PASS, 12 testes (só `videoSequence`), sem erro não tratado.

Run: `pnpm exec playwright test --config=playwright.config.ts`
Expected: PASS em todos os arquivos.

- [ ] **Step 4: Commit**

```bash
git add tests/
git commit -m "test: troca o boilerplate do template Payload por testes reais

O e2e afirmava que o título era 'Payload Blank Template' e o h1 era
'Welcome to your new project.'. O int era o 'fetches users' do template
e nem subia. Nenhum dos dois rodava no CI."
```

---

### Task 6: Rodar os testes no CI

O workflow roda lint, `tsc` e drift de tipos, mas nunca testes. O comentário no fim do arquivo explica que `next build` não roda por falta de banco — o mesmo vale para o e2e, que precisa da aplicação de pé.

**Files:**
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: os testes das Tasks 1–5.
- Produces: nada.

- [ ] **Step 1: Adicionar o passo de testes de integração**

Modify `.github/workflows/ci.yml`. Depois do passo `Payload generate:types (drift check)`, adicione:

```yaml
      # Os testes de integração são unitários de verdade (jsdom, sem banco):
      # cobrem a política do sequenciador de vídeo do hero. Rodam em qualquer
      # ambiente, então entram no CI sem infraestrutura extra.
      - name: Testes de integração
        env:
          NODE_OPTIONS: --no-deprecation
        run: pnpm exec vitest run --config ./vitest.config.mts
```

O e2e continua fora deste workflow pelo mesmo motivo documentado para o `next build`: exige banco e aplicação de pé. Ele roda no ambiente de preview.

- [ ] **Step 2: Validar o YAML**

Run: `pnpm exec node -e "const {readFileSync}=require('node:fs'); const s=readFileSync('.github/workflows/ci.yml','utf8'); if(!/Testes de integração/.test(s)) { console.error('passo não encontrado'); process.exit(1) } console.log('ok')"`
Expected: `ok`

- [ ] **Step 3: Rodar localmente o que o CI vai rodar**

Run: `pnpm check && pnpm exec tsc --noEmit && pnpm exec vitest run --config ./vitest.config.mts`
Expected: os três passam.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: roda os testes de integração no pipeline"
```

---

## Verificação final

- [ ] `pnpm check` limpo
- [ ] `pnpm exec tsc --noEmit` limpo
- [ ] `pnpm exec vitest run --config ./vitest.config.mts` — todos passam
- [ ] `pnpm exec playwright test --config=playwright.config.ts` — todos passam
- [ ] Home carrega menos de 900 KB de vídeo na primeira tela (teste da Task 3)
- [ ] Aba do navegador mostra o ícone da Semog
- [ ] `/solucoes`, `/garante` e as landings de cidade continuam visualmente idênticas
