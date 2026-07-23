# Página do Aplicativo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar `/aplicativo`, uma página que vende o app para o síndico na metade de cima e ensina o morador a usá-lo na de baixo, incluindo uma central de aprendizado com vídeos, passo a passo e material de divulgação.

**Architecture:** Dois blocos novos (`appHero`, `learnCenter`), uma variante nova em `ctaBand`, e reuso direto de `featureGrid`, `solutionSplit`, `pillars`, `processoTimeline` e `faq`. A página é uma `Page` do CMS com slug `aplicativo`, servida pelo catch-all existente — nenhuma rota nova.

**Tech Stack:** Next.js 16, React 19, Payload 3.86 (postgres), Tailwind 4, TypeScript 5.7, Vitest 4 + Testing Library, Playwright 1.58, pnpm 10.

## Dependência

**Este plano depende do `2026-07-23-app-02-home-redesign.md` estar concluído**, por três motivos: os testes de componente só rodam depois da Task 1 daquele plano; `pillars` variante `columns` é usada aqui; e `StoreBadges` é criado lá.

## Global Constraints

- Gerenciador de pacotes: `pnpm` (v10.12.4). Nunca `npm`/`yarn`.
- Antes de cada commit: `pnpm check` e `pnpm exec tsc --noEmit` limpos.
- Comentários de código em português, explicando o **porquê**.
- **A marca do app é "Aplicativo Semog" / "Semog Condomínios". Nunca citar Gruvi, Superlógica, Cyrela ou Intelbras em texto voltado ao público** — decisão do dono do site. Vale para copy, `alt` de imagem e metadata.
- A lista de funções vem da descrição oficial da ficha da Play Store. Não inventar funcionalidade.
- Ressalvas obrigatórias sempre que a página falar de controle de acesso: depende do plano contratado e do equipamento instalado, e **não substitui o porteiro presencial**.
- `aggregateRating` no JSON-LD só pode ser publicado enquanto os números baterem com as lojas.
- Depois de mexer em qualquer `config.ts`: `pnpm generate:types` e commitar `src/payload-types.ts`.

## Dados verificados das lojas (23/07/2026)

| | iOS | Android |
|---|---|---|
| Nome | Semog Condomínios | Semog Condomínios |
| ID | `6504202916` | `br.com.semog` |
| Nota | 4,8 | 4,8 |
| Avaliações | 716 | 417 |
| Downloads | — | 10 mil+ |

Soma usada na página: **4,8 · 1.133 avaliações**. Links:
- `https://apps.apple.com/br/app/semog-condom%C3%ADnios/id6504202916`
- `https://play.google.com/store/apps/details?id=br.com.semog`

## Referência visual

Mockup aprovado: https://claude.ai/code/artifact/10d1ffc1-7286-4938-bf69-9af0b5787ba3 (aba "Página do Aplicativo").
Spec: `docs/superpowers/specs/2026-07-23-home-redesign-e-pagina-aplicativo-design.md`, seção 5.

---

### Task 1: Bloco `appHero`

Hero próprio da página: sem vídeo, com nota das lojas, selos e duas telas.

**Files:**
- Create: `src/blocks/AppHero/config.ts`
- Create: `src/blocks/AppHero/Component.tsx`
- Modify: `src/blocks/RenderBlocks.tsx`
- Modify: `src/collections/Pages.ts`
- Modify: `src/styles/theme.css`
- Test: `tests/int/app-hero.int.spec.tsx`

**Interfaces:**
- Consumes: `StoreBadges` de `@/components/ui/StoreBadges` (plano 02, Task 5); `.app-screens`/`.app-screen`/`.app-rating` de `theme.css` (mesma task).
- Produces: bloco `appHero` (slug `appHero`, `interfaceName: 'AppHeroBlock'`), com campos `eyebrow`, `headline`, `lead`, `rating.score`, `rating.label`, `stores.appStore`, `stores.playStore`, `footnote`, `screens[].image`. A Task 6 o usa no seed.

- [ ] **Step 1: Escrever o teste que falha**

Create `tests/int/app-hero.int.spec.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppHeroBlock } from '@/blocks/AppHero/Component'

const base = {
  blockType: 'appHero' as const,
  headline: 'O condomínio inteiro na palma da mão.',
}

describe('AppHeroBlock', () => {
  it('renderiza a headline como h1', () => {
    render(<AppHeroBlock {...base} />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('palma da mão')
  })

  it('mostra a nota e os selos das lojas', () => {
    render(
      <AppHeroBlock
        {...base}
        rating={{ score: '4,8', label: '1.133 avaliações · 10 mil+ downloads no Android' }}
        stores={{
          appStore: 'https://apps.apple.com/br/app/id6504202916',
          playStore: 'https://play.google.com/store/apps/details?id=br.com.semog',
        }}
      />,
    )
    expect(screen.getByText('4,8')).toBeDefined()
    expect(screen.getByRole('link', { name: /app store/i })).toBeDefined()
    expect(screen.getByRole('link', { name: /google play/i })).toBeDefined()
  })

  it('renderiza a nota de rodapé quando preenchida', () => {
    render(<AppHeroBlock {...base} footnote="Grátis para o morador." />)
    expect(screen.getByText('Grátis para o morador.')).toBeDefined()
  })

  it('funciona sem nota, selos, lead nem telas', () => {
    const { container } = render(<AppHeroBlock {...base} />)
    expect(container.querySelector('.app-rating')).toBeNull()
    expect(container.querySelector('.store-badges')).toBeNull()
    expect(container.querySelector('.app-screens')).toBeNull()
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/app-hero.int.spec.tsx`
Expected: FAIL — `Failed to resolve import "@/blocks/AppHero/Component"`.

- [ ] **Step 3: Escrever o config**

Create `src/blocks/AppHero/config.ts`:

```ts
import type { Block } from 'payload'

/**
 * Hero da página `/aplicativo`. Não reusa o bloco `hero` de propósito: aquele
 * carrega 12 campos `pageHero*` herdados da fidelidade com o `_reference`, e
 * enfiar nota de loja e selos ali aumentaria uma complexidade que já é alta.
 * Este é pequeno e tem um propósito só.
 *
 * Sem vídeo: a página do app é sobre o app, e o hero não precisa carregar
 * megabytes de mídia decorativa para provar isso — as telas do produto fazem
 * o trabalho.
 */
export const appHeroBlock: Block = {
  slug: 'appHero',
  interfaceName: 'AppHeroBlock',
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'headline', type: 'text', required: true },
    { name: 'lead', type: 'textarea' },
    {
      name: 'rating',
      type: 'group',
      admin: {
        description:
          'Nota pública nas lojas. Só preencher enquanto bater com App Store e Google Play — vira `aggregateRating` no JSON-LD, e número falso rende ação manual do Google.',
      },
      fields: [
        { name: 'score', type: 'text', admin: { description: 'Ex.: "4,8"' } },
        { name: 'label', type: 'text' },
      ],
    },
    {
      name: 'stores',
      type: 'group',
      fields: [
        { name: 'appStore', type: 'text' },
        { name: 'playStore', type: 'text' },
      ],
    },
    {
      name: 'footnote',
      type: 'text',
      admin: { description: 'Linha pequena abaixo dos selos (ex.: "Grátis para o morador.").' },
    },
    {
      name: 'screens',
      type: 'array',
      maxRows: 2,
      admin: { description: 'Telas do app. Com duas, aparecem sobrepostas com rotação leve.' },
      fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }],
    },
  ],
}
```

- [ ] **Step 4: Escrever o componente**

Create `src/blocks/AppHero/Component.tsx`:

```tsx
import { ImageMedia } from '@/components/Media/ImageMedia'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { StoreBadges } from '@/components/ui/StoreBadges'
import { Fade } from '@/motion/Fade'
import type { AppHeroBlock as AppHeroBlockType, Media } from '@/payload-types'

/**
 * Hero da página `/aplicativo`: texto e prova à esquerda, telas do produto à
 * direita. `<section>` puro (não `Section`, que força `py-*`) pelo mesmo
 * motivo do `Hero` e do `HumanQuote` — o padding aqui é próprio, para caber
 * a nav de vidro por cima.
 *
 * A nota das lojas fica acima dos selos e não abaixo: quem chega procurando
 * o app quer saber se vale a pena antes de decidir baixar.
 */
export function AppHeroBlock({
  eyebrow,
  headline,
  lead,
  rating,
  stores,
  footnote,
  screens,
}: AppHeroBlockType) {
  const images = (screens ?? [])
    .map((s) => (s.image && typeof s.image === 'object' ? (s.image as Media) : undefined))
    .filter((m): m is Media => Boolean(m))

  return (
    <section className="app-hero">
      <Container className="app-hero-grid">
        <div>
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <h1>{headline}</h1>
          {lead && (
            <Fade as="p" delay={300} className="app-hero-lead">
              {lead}
            </Fade>
          )}
          {rating?.score && (
            <div className="app-rating liquid-glass">
              <span className="app-rating-n">{rating.score}</span>
              <span className="app-rating-meta">
                <span className="app-rating-stars" aria-hidden="true">
                  ★★★★★
                </span>
                {rating.label && <span>{rating.label}</span>}
              </span>
            </div>
          )}
          <StoreBadges appStore={stores?.appStore} playStore={stores?.playStore} />
          {footnote && <p className="app-hero-footnote">{footnote}</p>}
        </div>
        {images.length > 0 && (
          <div className="app-screens">
            {images[1] && (
              <div className="app-screen app-screen-back">
                <ImageMedia resource={images[1]} sizes="(max-width: 900px) 40vw, 240px" />
              </div>
            )}
            <div className="app-screen app-screen-front">
              <ImageMedia resource={images[0]} priority sizes="(max-width: 900px) 45vw, 260px" />
            </div>
          </div>
        )}
      </Container>
    </section>
  )
}
```

- [ ] **Step 5: Registrar o bloco**

Modify `src/blocks/RenderBlocks.tsx`: importe `AppHeroBlock` de `./AppHero/Component` e adicione `appHero: AppHeroBlock,` ao objeto `map`.

Modify `src/collections/Pages.ts`: importe `appHeroBlock` de `@/blocks/AppHero/config` e adicione `appHeroBlock,` ao array `blocks` do campo `layout`.

- [ ] **Step 6: Regenerar os tipos**

Run: `pnpm generate:types`
Expected: `AppHeroBlock` aparece em `src/payload-types.ts`.

- [ ] **Step 7: Estilizar**

Adicione ao fim de `src/styles/theme.css`, dentro de `@layer utilities`:

```css
  /* Hero da página do aplicativo. Gradiente radial em vez de mídia — a
     página é sobre o produto, e as telas do produto é que devem chamar
     atenção. */
  .app-hero {
    position: relative;
    overflow: hidden;
    background: radial-gradient(110% 80% at 75% 15%, #1b2d70 0%, #0d1439 50%, #05081a 100%);
  }
  .app-hero-grid {
    display: grid;
    grid-template-columns: 1.02fr 0.98fr;
    gap: clamp(2rem, 4vw, 4rem);
    align-items: center;
    padding-top: 9.5rem;
    padding-bottom: 4.5rem;
  }
  .app-hero h1 {
    max-width: 14ch;
    margin-bottom: 1.2rem;
    font-size: clamp(2.4rem, 5.2vw, 4.4rem);
  }
  .app-hero-lead {
    max-width: 52ch;
    color: var(--text-2);
    font-size: clamp(1rem, 1.3vw, 1.15rem);
  }
  .app-hero-footnote {
    margin-top: 1.2rem;
    font-size: 0.82rem;
    color: var(--text-3);
  }
  @media (max-width: 900px) {
    .app-hero-grid {
      grid-template-columns: 1fr;
      padding-top: 8rem;
    }
  }
```

- [ ] **Step 8: Rodar e confirmar que passa**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/app-hero.int.spec.tsx`
Expected: PASS, 4 testes.

- [ ] **Step 9: Verificar lint e tipos**

Run: `pnpm check && pnpm exec tsc --noEmit`
Expected: sem erros.

- [ ] **Step 10: Commit**

```bash
git add src/blocks/AppHero src/blocks/RenderBlocks.tsx src/collections/Pages.ts src/styles/theme.css src/payload-types.ts tests/int/app-hero.int.spec.tsx
git commit -m "feat(appHero): bloco de hero da página do aplicativo"
```

---

### Task 2: Bloco `learnCenter`

A central de aprendizado: três abas numa seção só. Cada aba resolve um problema diferente — vídeo é o que o morador prefere, texto é o que o Google indexa, e material impresso é o que o síndico usa para divulgar.

**Files:**
- Create: `src/blocks/LearnCenter/config.ts`
- Create: `src/blocks/LearnCenter/Component.tsx`
- Create: `src/blocks/LearnCenter/Tabs.tsx`
- Modify: `src/blocks/RenderBlocks.tsx`
- Modify: `src/collections/Pages.ts`
- Modify: `src/styles/theme.css`
- Test: `tests/int/learn-center.int.spec.tsx`

**Interfaces:**
- Consumes: nada além do que já existe.
- Produces: bloco `learnCenter` (`interfaceName: 'LearnCenterBlock'`) com `eyebrow`, `title`, `lead`, `videos[]` (`title`, `text`, `duration`, `videoUrl`), `guides[]` (`title`, `steps[].text`, `note`), `materials[]` (`kind`, `title`, `text`, `file`). A Task 6 o usa no seed.

- [ ] **Step 1: Escrever o teste que falha**

Create `tests/int/learn-center.int.spec.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LearnCenterBlock } from '@/blocks/LearnCenter/Component'

const base = {
  blockType: 'learnCenter' as const,
  title: 'Ninguém deveria precisar ligar para aprender a usar um aplicativo.',
}

const guides = [
  {
    title: 'Primeiro acesso e validação de dados',
    steps: [{ text: 'Baixe o aplicativo.' }, { text: 'Toque em Conecte-se.' }],
    note: 'Não recebeu o e-mail? Confira o spam.',
  },
]

describe('LearnCenterBlock', () => {
  it('renderiza a aba de passo a passo com os guias', () => {
    render(<LearnCenterBlock {...base} guides={guides} />)
    expect(screen.getByText('Primeiro acesso e validação de dados')).toBeDefined()
    expect(screen.getByText('Baixe o aplicativo.')).toBeDefined()
    expect(screen.getByText('Não recebeu o e-mail? Confira o spam.')).toBeDefined()
  })

  it('numera os guias', () => {
    render(<LearnCenterBlock {...base} guides={guides} />)
    expect(screen.getByText('01')).toBeDefined()
  })

  it('renderiza card de vídeo sem link quando não há videoUrl', () => {
    const { container } = render(
      <LearnCenterBlock
        {...base}
        videos={[{ title: 'Primeiro acesso', text: 'Como validar.', duration: '1:40' }]}
      />,
    )
    expect(screen.getByText('Primeiro acesso')).toBeDefined()
    expect(screen.getByText('1:40')).toBeDefined()
    expect(container.querySelector('.learn-vid a')).toBeNull()
  })

  it('vira link quando há videoUrl', () => {
    render(
      <LearnCenterBlock
        {...base}
        videos={[
          { title: 'Primeiro acesso', duration: '1:40', videoUrl: 'https://youtu.be/abc123' },
        ]}
      />,
    )
    const link = screen.getByRole('link', { name: /primeiro acesso/i })
    expect(link.getAttribute('href')).toBe('https://youtu.be/abc123')
  })

  it('só mostra as abas que têm conteúdo', () => {
    render(<LearnCenterBlock {...base} guides={guides} />)
    expect(screen.getByRole('tab', { name: /passo a passo/i })).toBeDefined()
    expect(screen.queryByRole('tab', { name: /vídeos/i })).toBeNull()
    expect(screen.queryByRole('tab', { name: /material/i })).toBeNull()
  })

  it('não renderiza nada quando as três listas estão vazias', () => {
    const { container } = render(<LearnCenterBlock {...base} />)
    expect(container.firstChild).toBeNull()
  })

  it('renderiza os materiais com tipo e descrição', () => {
    render(
      <LearnCenterBlock
        {...base}
        materials={[{ kind: 'PDF A3', title: 'Cartaz com QR Code', text: 'Para o hall.' }]}
      />,
    )
    expect(screen.getByText('PDF A3')).toBeDefined()
    expect(screen.getByText('Cartaz com QR Code')).toBeDefined()
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/learn-center.int.spec.tsx`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Escrever o config**

Create `src/blocks/LearnCenter/config.ts`:

```ts
import type { Block } from 'payload'

/**
 * Central de aprendizado do aplicativo — três abas numa seção só, cada uma
 * resolvendo um problema diferente:
 *
 * - `videos`: o formato que o morador prefere, mas que o Google não lê.
 * - `guides`: passo a passo em texto — é o que indexa e traz busca de cauda
 *   longa ("como tirar 2ª via do boleto do condomínio"), e o que funciona
 *   com internet ruim. É a única aba obrigatória no lançamento.
 * - `materials`: o que o síndico imprime e distribui para o app ser adotado.
 *
 * Cada lista é opcional: aba sem conteúdo não aparece, e o bloco inteiro não
 * renderiza se as três estiverem vazias. Isso permite publicar a página antes
 * de os vídeos existirem.
 */
export const learnCenterBlock: Block = {
  slug: 'learnCenter',
  interfaceName: 'LearnCenterBlock',
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'title', type: 'text', required: true },
    { name: 'lead', type: 'textarea' },
    {
      name: 'videos',
      type: 'array',
      admin: { description: 'Sem `videoUrl`, o card aparece inativo (vídeo ainda não gravado).' },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'text', type: 'textarea' },
        { name: 'duration', type: 'text', admin: { description: 'Ex.: "1:40"' } },
        { name: 'videoUrl', type: 'text' },
      ],
    },
    {
      name: 'guides',
      type: 'array',
      fields: [
        { name: 'title', type: 'text', required: true },
        {
          name: 'steps',
          type: 'array',
          required: true,
          minRows: 1,
          fields: [{ name: 'text', type: 'textarea', required: true }],
        },
        { name: 'note', type: 'textarea', admin: { description: 'Ressalva ao fim do guia.' } },
      ],
    },
    {
      name: 'materials',
      type: 'array',
      fields: [
        { name: 'kind', type: 'text', admin: { description: 'Ex.: "PDF A3", "Texto"' } },
        { name: 'title', type: 'text', required: true },
        { name: 'text', type: 'textarea' },
        { name: 'file', type: 'upload', relationTo: 'media' },
      ],
    },
  ],
}
```

- [ ] **Step 4: Escrever a ilha client das abas**

Create `src/blocks/LearnCenter/Tabs.tsx`:

```tsx
'use client'

import { type ReactNode, useId, useState } from 'react'

type Panel = { key: string; label: string; content: ReactNode }

/**
 * Abas da central de aprendizado. Ilha client mínima — só o estado de qual
 * painel está visível; todo o conteúdo é renderizado no servidor e passado
 * como `children`, então os guias em texto estão no HTML mesmo com o
 * JavaScript desligado (é o que o Google indexa).
 *
 * Com um painel só, nem renderiza a barra de abas: uma aba solitária é ruído.
 */
export function LearnTabs({ panels }: { panels: Panel[] }) {
  const [active, setActive] = useState(panels[0]?.key)
  const id = useId()

  if (panels.length === 0) return null

  return (
    <>
      {panels.length > 1 && (
        <div className="learn-tabs" role="tablist">
          {panels.map((p) => (
            <button
              key={p.key}
              type="button"
              role="tab"
              id={`${id}-tab-${p.key}`}
              aria-selected={active === p.key}
              aria-controls={`${id}-panel-${p.key}`}
              className="learn-tab"
              onClick={() => setActive(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
      {panels.map((p) => (
        <div
          key={p.key}
          role="tabpanel"
          id={`${id}-panel-${p.key}`}
          aria-labelledby={`${id}-tab-${p.key}`}
          className="learn-panel"
          hidden={active !== p.key}
        >
          {p.content}
        </div>
      ))}
    </>
  )
}
```

- [ ] **Step 5: Escrever o componente do bloco**

Create `src/blocks/LearnCenter/Component.tsx`:

```tsx
import { ImageMedia } from '@/components/Media/ImageMedia'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Section } from '@/components/ui/Section'
import type { LearnCenterBlock as LearnCenterBlockType, Media } from '@/payload-types'
import { LearnTabs } from './Tabs'

/** Triângulo de play dos cards de vídeo. */
function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
      <path d="M5 3.4v11.2a.6.6 0 00.92.5l8.5-5.6a.6.6 0 000-1L5.92 2.9a.6.6 0 00-.92.5z" />
    </svg>
  )
}

/**
 * Central de aprendizado do aplicativo. Ver `config.ts` para o porquê de cada
 * aba. Os cards de vídeo são desenhados em CSS, sem miniatura: enquanto os
 * vídeos não existem, uma miniatura recortada de tela do app sugeriria que
 * cada vídeo mostra aquela tela — o que não é verdade.
 */
export function LearnCenterBlock({
  eyebrow,
  title,
  lead,
  videos,
  guides,
  materials,
}: LearnCenterBlockType) {
  const hasVideos = (videos?.length ?? 0) > 0
  const hasGuides = (guides?.length ?? 0) > 0
  const hasMaterials = (materials?.length ?? 0) > 0
  if (!hasVideos && !hasGuides && !hasMaterials) return null

  const panels = []

  if (hasVideos) {
    panels.push({
      key: 'videos',
      label: 'Vídeos',
      content: (
        <div className="learn-vids">
          {(videos ?? []).map((v) => {
            const inner = (
              <>
                <span className="learn-vid-shot">
                  <span className="learn-vid-play">
                    <PlayIcon />
                  </span>
                  {v.duration && <span className="learn-vid-time">{v.duration}</span>}
                </span>
                <span className="learn-vid-txt">
                  <span className="learn-vid-title">{v.title}</span>
                  {v.text && <span className="learn-vid-text">{v.text}</span>}
                </span>
              </>
            )
            return v.videoUrl ? (
              <a
                key={v.id ?? v.title}
                className="learn-vid"
                href={v.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {inner}
              </a>
            ) : (
              <div key={v.id ?? v.title} className="learn-vid learn-vid-soon">
                {inner}
              </div>
            )
          })}
        </div>
      ),
    })
  }

  if (hasGuides) {
    panels.push({
      key: 'guias',
      label: 'Passo a passo',
      content: (
        <div className="learn-guides">
          {(guides ?? []).map((g, i) => (
            <details key={g.id ?? g.title} open={i === 0}>
              <summary>
                <span className="learn-guide-n">{String(i + 1).padStart(2, '0')}</span>
                {g.title}
              </summary>
              <div className="learn-guide-body">
                <ol>
                  {(g.steps ?? []).map((s, j) => (
                    <li key={s.id ?? `${g.title}-${j}`}>{s.text}</li>
                  ))}
                </ol>
                {g.note && <p className="learn-guide-note">{g.note}</p>}
              </div>
            </details>
          ))}
        </div>
      ),
    })
  }

  if (hasMaterials) {
    panels.push({
      key: 'material',
      label: 'Material do condomínio',
      content: (
        <div className="learn-kits">
          {(materials ?? []).map((m) => {
            const file = m.file && typeof m.file === 'object' ? (m.file as Media) : undefined
            const body = (
              <>
                {m.kind && <span className="learn-kit-kind">{m.kind}</span>}
                <span className="learn-kit-title">{m.title}</span>
                {m.text && <span className="learn-kit-text">{m.text}</span>}
              </>
            )
            return file?.url ? (
              <a key={m.id ?? m.title} className="learn-kit" href={file.url} download>
                {body}
              </a>
            ) : (
              <div key={m.id ?? m.title} className="learn-kit">
                {body}
              </div>
            )
          })}
        </div>
      ),
    })
  }

  return (
    <Section className="bg-navy-950">
      <Container>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h2 className="text-h2">{title}</h2>
        {lead && <p className="learn-lead">{lead}</p>}
        <LearnTabs panels={panels} />
      </Container>
    </Section>
  )
}
```

Nota: `ImageMedia` está importado para o caso de `materials` ganharem miniatura no futuro; se o Biome reclamar de import não usado, remova a linha.

- [ ] **Step 6: Registrar o bloco**

Modify `src/blocks/RenderBlocks.tsx`: importe `LearnCenterBlock` de `./LearnCenter/Component` e adicione `learnCenter: LearnCenterBlock,` ao `map`.

Modify `src/collections/Pages.ts`: importe `learnCenterBlock` de `@/blocks/LearnCenter/config` e adicione ao array `blocks`.

- [ ] **Step 7: Regenerar os tipos**

Run: `pnpm generate:types`

- [ ] **Step 8: Estilizar**

Adicione ao fim de `src/styles/theme.css`, dentro de `@layer utilities`:

```css
  /* ---------- Central de aprendizado ---------- */
  .learn-lead {
    max-width: 60ch;
    margin-top: 1.1rem;
    color: var(--text-2);
    font-size: clamp(1rem, 1.3vw, 1.15rem);
  }
  .learn-tabs {
    display: flex;
    gap: 0.4rem;
    width: fit-content;
    max-width: 100%;
    margin-top: 2.5rem;
    padding: 0.32rem;
    border: 1px solid var(--line);
    border-radius: var(--radius-pill);
    overflow-x: auto;
    scrollbar-width: none;
  }
  .learn-tabs::-webkit-scrollbar {
    display: none;
  }
  .learn-tab {
    padding: 0.58rem 1.2rem;
    border: 0;
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--text-2);
    font-family: var(--font-body);
    font-weight: 600;
    font-size: 0.85rem;
    white-space: nowrap;
    transition: 0.2s;
  }
  .learn-tab:hover {
    color: var(--text);
  }
  .learn-tab[aria-selected='true'] {
    background: var(--accent);
    color: var(--color-navy-900);
  }
  /* A aba é o controle principal desta seção — foco de teclado precisa ser
     inequívoco, e o `outline` padrão some contra o navy do fundo. */
  .learn-tab:focus-visible,
  .learn-guides summary:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 3px;
  }
  .learn-panel {
    margin-top: 2.2rem;
  }

  .learn-vids {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.3rem;
  }
  .learn-vid {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: 18px;
    background: var(--color-navy-950);
  }
  .learn-vid-shot {
    position: relative;
    display: grid;
    place-items: center;
    aspect-ratio: 16 / 9;
    background: linear-gradient(145deg, #16225c 0%, #101a48 55%, #05081a 100%);
  }
  .learn-vid:nth-child(3n + 2) .learn-vid-shot {
    background: linear-gradient(145deg, #1b2d70 0%, #0d1439 60%, #05081a 100%);
  }
  .learn-vid:nth-child(3n) .learn-vid-shot {
    background: linear-gradient(145deg, #0d1439 0%, #16225c 55%, #101a48 100%);
  }
  .learn-vid-play {
    display: grid;
    place-items: center;
    width: 54px;
    height: 54px;
    border-radius: var(--radius-pill);
    background: rgba(237, 241, 250, 0.94);
    color: var(--color-navy-900);
    box-shadow: 0 12px 32px -10px rgba(0, 0, 0, 0.6);
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }
  a.learn-vid:hover .learn-vid-play {
    transform: scale(1.08);
  }
  /* Card sem vídeo gravado ainda: o play fica apagado para não prometer
     interação que não existe. */
  .learn-vid-soon .learn-vid-play {
    opacity: 0.45;
  }
  .learn-vid-time {
    position: absolute;
    right: 0.7rem;
    bottom: 0.7rem;
    padding: 0.2rem 0.5rem;
    border-radius: 6px;
    background: rgba(5, 8, 26, 0.75);
    color: var(--color-silver-100);
    font-size: 0.7rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .learn-vid-txt {
    display: block;
    padding: 1.1rem 1.2rem 1.3rem;
  }
  .learn-vid-title {
    display: block;
    margin-bottom: 0.35rem;
    font-family: var(--font-display);
    font-size: 1.02rem;
    color: var(--color-silver-100);
  }
  .learn-vid-text {
    display: block;
    font-size: 0.84rem;
    line-height: 1.55;
    color: var(--text-3);
  }

  .learn-guides {
    border-top: 1px solid var(--line);
  }
  .learn-guides details {
    border-bottom: 1px solid var(--line);
  }
  .learn-guides summary {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    padding: 1.1rem 0;
    cursor: pointer;
    list-style: none;
    font-family: var(--font-display);
    font-size: 1.08rem;
  }
  .learn-guides summary::-webkit-details-marker {
    display: none;
  }
  .learn-guides summary::after {
    content: '+';
    margin-left: auto;
    font-size: 1.3rem;
    color: var(--color-ice-500);
  }
  .learn-guides details[open] summary::after {
    content: '−';
  }
  .learn-guide-n {
    display: grid;
    place-items: center;
    flex: none;
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: rgba(173, 213, 235, 0.12);
    color: var(--accent);
    font-family: var(--font-body);
    font-size: 0.78rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .learn-guide-body {
    padding: 0 0 1.5rem 3.9rem;
  }
  .learn-guide-body ol {
    display: grid;
    gap: 0.5rem;
    max-width: 72ch;
    margin: 0;
    padding-left: 1.1rem;
    color: var(--text-2);
    font-size: 0.92rem;
  }
  .learn-guide-note {
    max-width: 68ch;
    margin-top: 0.9rem;
    font-size: 0.84rem;
    color: var(--text-3);
  }

  .learn-kits {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1.1rem;
  }
  .learn-kit {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    padding: 1.4rem;
    border: 1px solid var(--line);
    border-radius: 16px;
    background: rgba(173, 213, 235, 0.04);
    transition: border-color 0.25s ease;
  }
  a.learn-kit:hover {
    border-color: var(--accent);
  }
  .learn-kit-kind {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-3);
  }
  .learn-kit-title {
    font-family: var(--font-display);
    font-size: 1rem;
  }
  .learn-kit-text {
    font-size: 0.84rem;
    line-height: 1.55;
    color: var(--text-2);
  }

  @media (max-width: 900px) {
    .learn-vids {
      grid-template-columns: 1fr 1fr;
    }
    .learn-kits {
      grid-template-columns: 1fr 1fr;
    }
  }
  @media (max-width: 620px) {
    .learn-vids {
      grid-template-columns: 1fr;
    }
    .learn-kits {
      grid-template-columns: 1fr;
    }
    .learn-guide-body {
      padding-left: 0;
    }
  }
```

- [ ] **Step 9: Rodar e confirmar que passa**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/learn-center.int.spec.tsx`
Expected: PASS, 7 testes.

- [ ] **Step 10: Verificar lint e tipos**

Run: `pnpm check && pnpm exec tsc --noEmit`
Expected: sem erros.

- [ ] **Step 11: Commit**

```bash
git add src/blocks/LearnCenter src/blocks/RenderBlocks.tsx src/collections/Pages.ts src/styles/theme.css src/payload-types.ts tests/int/learn-center.int.spec.tsx
git commit -m "feat(learnCenter): central de aprendizado com vídeos, guias e material"
```

---

### Task 3: CTABand — variante `dual`

Dois públicos, dois caminhos, apresentados como iguais.

**Files:**
- Modify: `src/blocks/CTABand/config.ts`
- Modify: `src/blocks/CTABand/Component.tsx`
- Modify: `src/styles/theme.css`
- Test: `tests/int/cta-band-dual.int.spec.tsx`

**Interfaces:**
- Consumes: o `select` `variant` e o campo `secondaryCta` (plano 02, Task 7).
- Produces: valor `'dual'` em `variant` e array `paths` (`title`, `text`, `cta.label`, `cta.href`).

- [ ] **Step 1: Escrever o teste que falha**

Create `tests/int/cta-band-dual.int.spec.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CTABandBlock } from '@/blocks/CTABand/Component'

const paths = [
  {
    title: 'Sou síndico ou conselheiro',
    text: 'Quero o aplicativo no meu condomínio.',
    cta: { label: 'Solicitar proposta', href: '/proposta' },
  },
  {
    title: 'Moro em um condomínio Semog',
    text: 'Quero baixar o aplicativo.',
    cta: { label: 'Baixar o aplicativo', href: '#baixar' },
  },
]

describe('CTABandBlock — variante dual', () => {
  it('renderiza os dois caminhos com título, texto e CTA', () => {
    render(
      <CTABandBlock
        blockType="ctaBand"
        variant="dual"
        title="Cada um segue por um caminho."
        cta={{ label: 'Solicitar proposta', href: '/proposta' }}
        paths={paths}
      />,
    )
    expect(screen.getByText('Sou síndico ou conselheiro')).toBeDefined()
    expect(screen.getByText('Moro em um condomínio Semog')).toBeDefined()
    expect(screen.getByRole('link', { name: /baixar o aplicativo/i })).toBeDefined()
  })

  it('cai para centered quando paths está vazio', () => {
    const { container } = render(
      <CTABandBlock
        blockType="ctaBand"
        variant="dual"
        title="Sem caminhos"
        cta={{ label: 'Solicitar proposta', href: '/proposta' }}
      />,
    )
    expect(container.querySelector('.final-cta-dual')).toBeNull()
    expect(container.querySelector('.final-cta')).not.toBeNull()
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/cta-band-dual.int.spec.tsx`
Expected: FAIL — `paths` não existe.

- [ ] **Step 3: Adicionar ao config**

Modify `src/blocks/CTABand/config.ts`. No `select` `variant`, adicione:

```ts
        { label: 'Dois caminhos (página do aplicativo)', value: 'dual' },
```

E, depois de `secondaryCta`:

```ts
    {
      name: 'paths',
      type: 'array',
      maxRows: 2,
      admin: {
        description:
          'Só na variante `dual`: dois públicos apresentados como iguais, cada um com seu CTA. Vazio = comporta-se como `centered`.',
      },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'text', type: 'textarea' },
        {
          name: 'cta',
          type: 'group',
          fields: [
            { name: 'label', type: 'text' },
            { name: 'href', type: 'text' },
          ],
        },
      ],
    },
```

- [ ] **Step 4: Regenerar os tipos**

Run: `pnpm generate:types`

- [ ] **Step 5: Implementar a variante**

Modify `src/blocks/CTABand/Component.tsx`. Adicione `paths` às props e, **antes** do `if (variant === 'centered')`, insira:

```tsx
  // `dual` sem caminhos preenchidos não tem o que mostrar de diferente —
  // cai no `centered`, que já sabe renderizar título + CTA único.
  if (variant === 'dual' && paths && paths.length > 0) {
    return (
      <section className="final-cta">
        <Container className="relative z-[2]">
          <CenteredTitle title={title} accent={titleAccent} />
          {text && (
            <Reveal as="p" delay={0.1}>
              {text}
            </Reveal>
          )}
          <div className="final-cta-dual">
            {paths.map((p, i) => (
              <Reveal key={p.id ?? p.title} delay={0.2 + i * 0.08}>
                <div className="final-cta-path">
                  <h3>{p.title}</h3>
                  {p.text && <p>{p.text}</p>}
                  {p.cta?.label && p.cta.href && (
                    <Button
                      href={p.cta.href}
                      variant={i === 0 ? 'white' : 'glass'}
                      size="lg"
                      withArrow
                      magnetic={i === 0}
                    >
                      {p.cta.label}
                    </Button>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>
    )
  }
```

E ajuste a condição do ramo seguinte para `if (variant === 'centered' || variant === 'dual')`, para que `dual` sem `paths` caia ali.

- [ ] **Step 6: Estilizar**

Adicione ao fim de `src/styles/theme.css`, dentro de `@layer utilities`:

```css
  .final-cta-dual {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.4rem;
    margin-top: 3rem;
    text-align: left;
  }
  .final-cta-path {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.9rem;
    height: 100%;
    padding: 2rem;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-card);
  }
  .final-cta-path h3 {
    margin: 0;
    font-size: 1.5rem;
  }
  .final-cta-path p {
    flex: 1;
    margin: 0;
    color: var(--text-2);
    font-size: 0.93rem;
  }
  @media (max-width: 780px) {
    .final-cta-dual {
      grid-template-columns: 1fr;
    }
  }
```

- [ ] **Step 7: Rodar e confirmar que passa**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/cta-band-dual.int.spec.tsx`
Expected: PASS, 2 testes.

- [ ] **Step 8: Verificar lint e tipos**

Run: `pnpm check && pnpm exec tsc --noEmit`
Expected: sem erros.

- [ ] **Step 9: Commit**

```bash
git add src/blocks/CTABand src/styles/theme.css src/payload-types.ts tests/int/cta-band-dual.int.spec.tsx
git commit -m "feat(ctaBand): variante dual com dois caminhos"
```

---

### Task 4: JSON-LD — FAQPage em qualquer página e SoftwareApplication

`extractFaqItems` e `faqPageNode` já existem em `src/lib/seo.ts`, mas o `FAQPage` só é emitido em landing de cidade (`seo.ts:415-420`). A página do app tem 6 perguntas que merecem rich result.

**Files:**
- Modify: `src/lib/seo.ts`
- Test: `tests/int/seo-jsonld.int.spec.ts`

**Interfaces:**
- Consumes: `extractFaqItems`, `faqPageNode`, `breadcrumbNode`, `absoluteUrl` (todos já em `seo.ts`).
- Produces: `getPageJsonLd` passa a emitir `FAQPage` para qualquer página com bloco `faq`, e `SoftwareApplication` quando houver bloco `appHero` com `rating.score`.

- [ ] **Step 1: Escrever o teste que falha**

Create `tests/int/seo-jsonld.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getPageJsonLd } from '@/lib/seo'

type Node = { '@type': string; [k: string]: unknown }
const nodes = (r: Record<string, unknown> | null) => (r?.['@graph'] ?? []) as Node[]
const typeOf = (r: Record<string, unknown> | null, t: string) =>
  nodes(r).find((n) => n['@type'] === t)

describe('getPageJsonLd', () => {
  it('emite FAQPage em página comum que tenha bloco faq', () => {
    const result = getPageJsonLd({
      page: {
        title: 'Aplicativo Semog',
        layout: [
          {
            blockType: 'faq',
            items: [{ question: 'O aplicativo é gratuito?', answer: 'Sim, para o morador.' }],
          },
        ],
      },
      path: 'aplicativo',
    })
    const faq = typeOf(result, 'FAQPage')
    expect(faq).toBeDefined()
  })

  it('não emite FAQPage quando a página não tem bloco faq', () => {
    const result = getPageJsonLd({
      page: { title: 'Contato', layout: [{ blockType: 'contactInfo' }] },
      path: 'contato',
    })
    expect(typeOf(result, 'FAQPage')).toBeUndefined()
  })

  it('emite SoftwareApplication com aggregateRating a partir do appHero', () => {
    const result = getPageJsonLd({
      page: {
        title: 'Aplicativo Semog',
        layout: [
          {
            blockType: 'appHero',
            headline: 'O condomínio inteiro na palma da mão.',
            rating: { score: '4,8', label: '1.133 avaliações' },
          },
        ],
      },
      path: 'aplicativo',
    })
    const app = typeOf(result, 'SoftwareApplication') as
      | { aggregateRating?: { ratingValue?: number; ratingCount?: number } }
      | undefined
    expect(app?.aggregateRating?.ratingValue).toBe(4.8)
    expect(app?.aggregateRating?.ratingCount).toBe(1133)
  })

  it('não emite SoftwareApplication sem nota', () => {
    const result = getPageJsonLd({
      page: { title: 'Aplicativo', layout: [{ blockType: 'appHero', headline: 'x' }] },
      path: 'aplicativo',
    })
    expect(typeOf(result, 'SoftwareApplication')).toBeUndefined()
  })

  it('a home continua emitindo Organization', () => {
    const result = getPageJsonLd({ page: { title: 'Home', layout: [] }, path: 'home' })
    expect(result).not.toBeNull()
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/seo-jsonld.int.spec.ts`
Expected: FAIL — `FAQPage` ausente em página comum e `SoftwareApplication` inexistente.

- [ ] **Step 3: Implementar**

Modify `src/lib/seo.ts`.

Adicione, perto de `extractFaqItems`:

```ts
/** Extrai o bloco `appHero` do layout da página (se houver). */
function extractAppHero(page: JsonLdPage): {
  headline?: string
  rating?: { score?: string; label?: string }
} | null {
  if (!Array.isArray(page.layout)) return null
  const block = page.layout.find(
    (b): b is { blockType: string; headline?: string; rating?: { score?: string; label?: string } } =>
      Boolean(b) && typeof b === 'object' && (b as { blockType?: string }).blockType === 'appHero',
  )
  return block ?? null
}

/**
 * `SoftwareApplication` com `aggregateRating`. Os números vêm do CMS e devem
 * bater com App Store e Google Play — `aggregateRating` inflado viola as
 * diretrizes do Google e rende ação manual. `ratingValue` aceita a vírgula
 * decimal usada no texto em português; `ratingCount` sai do rótulo, que é
 * onde o total de avaliações é escrito para o leitor.
 */
function softwareApplicationNode(
  headline: string,
  rating: { score?: string; label?: string },
  url: string,
): Record<string, unknown> | null {
  const ratingValue = Number(String(rating.score ?? '').replace(',', '.'))
  if (!Number.isFinite(ratingValue) || ratingValue <= 0) return null

  const countMatch = String(rating.label ?? '').match(/([\d.]+)\s*avalia/i)
  const ratingCount = countMatch ? Number(countMatch[1].replace(/\./g, '')) : undefined

  return {
    '@type': 'SoftwareApplication',
    name: 'Semog Condomínios',
    description: headline,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'iOS, Android',
    url,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
    ...(ratingCount
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue,
            ratingCount,
            bestRating: 5,
          },
        }
      : {}),
  }
}
```

E troque o corpo de `getPageJsonLd`, depois da criação do `graph` com o breadcrumb:

```ts
  const unit = UNITS.find((u) => u.slug === path)
  if (unit) graph.push(localBusinessNode(unit))

  // FAQPage vale para QUALQUER página com bloco `faq`, não só landing de
  // cidade: a página do aplicativo tem 6 perguntas de morador que disputam
  // rich result.
  const faqItems = extractFaqItems(page)
  if (faqItems.length > 0) graph.push(faqPageNode(faqItems))

  const appHero = extractAppHero(page)
  if (appHero?.rating?.score && appHero.headline) {
    const node = softwareApplicationNode(appHero.headline, appHero.rating, absoluteUrl(path))
    if (node) graph.push(node)
  }
```

Atualize também o comentário de bloco de `getPageJsonLd` para refletir as duas regras novas.

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/seo-jsonld.int.spec.ts`
Expected: PASS, 5 testes.

- [ ] **Step 5: Verificar que as landings de cidade não regrediram**

Run: `pnpm exec vitest run --config ./vitest.config.mts`
Expected: todos passam. Confirme manualmente que uma landing de cidade continua emitindo `BreadcrumbList` + `LocalBusiness` + `FAQPage` — a mudança tira o `FAQPage` de dentro do `if (unit)`, então ele passa a ser emitido *fora* dele, mas continua sendo emitido.

- [ ] **Step 6: Verificar lint e tipos**

Run: `pnpm check && pnpm exec tsc --noEmit`
Expected: sem erros.

- [ ] **Step 7: Commit**

```bash
git add src/lib/seo.ts tests/int/seo-jsonld.int.spec.ts
git commit -m "feat(seo): FAQPage em qualquer página e SoftwareApplication do app"
```

---

### Task 5: Links de navegação

A página nova precisa estar alcançável.

**Files:**
- Modify: `src/seed/globals.ts`
- Test: `tests/e2e/aplicativo.e2e.spec.ts` (criado aqui, completado na Task 6)

**Interfaces:**
- Consumes: nada.
- Produces: item "Aplicativo" no header e no rodapé, apontando para `/aplicativo`.

- [ ] **Step 1: Escrever o teste que falha**

Create `tests/e2e/aplicativo.e2e.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test.describe('Navegação para o aplicativo', () => {
  test('o menu principal tem o link', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    await expect(page.locator('nav a[href="/aplicativo"]').first()).toBeVisible()
  })

  test('o rodapé tem o link', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    await expect(page.locator('footer a[href="/aplicativo"]').first()).toBeVisible()
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `pnpm exec playwright test tests/e2e/aplicativo.e2e.spec.ts --config=playwright.config.ts`
Expected: FAIL — nenhum link para `/aplicativo`.

- [ ] **Step 3: Adicionar os links ao seed dos globais**

Modify `src/seed/globals.ts`:

- No `navItems` do header, adicione `{ label: 'Aplicativo', href: '/aplicativo' }` depois de "Soluções".
- Na coluna "Soluções" do rodapé, troque o item que hoje aponta para `/solucoes#aplicativo` por `{ label: 'Aplicativo', href: '/aplicativo' }`.

Se o header já estiver com muitos itens e ficar apertado no desktop, prefira substituir "Incorporadoras" por "Aplicativo" no menu e manter "Incorporadoras" só no rodapé — o app tem público muito maior.

- [ ] **Step 4: Rodar o seed dos globais**

Run: `pnpm seed:globals`
Expected: confirmação de atualização do header e do footer.

- [ ] **Step 5: Rodar e confirmar que passa**

Run: `pnpm exec playwright test tests/e2e/aplicativo.e2e.spec.ts --config=playwright.config.ts`
Expected: PASS, 2 testes.

- [ ] **Step 6: Commit**

```bash
git add src/seed/globals.ts tests/e2e/aplicativo.e2e.spec.ts
git commit -m "feat(nav): link para /aplicativo no header e no rodapé"
```

---

### Task 6: Migração e seed da página

**Files:**
- Create: `src/migrations/<timestamp>_pagina_aplicativo.ts` (gerado pelo CLI)
- Modify: `src/seed/pages.ts`
- Modify: `tests/e2e/aplicativo.e2e.spec.ts`

**Interfaces:**
- Consumes: `appHero` (Task 1), `learnCenter` (Task 2), `ctaBand` variante `dual` (Task 3), e os blocos existentes `featureGrid`, `solutionSplit`, `pillars`, `processoTimeline`, `faq`.
- Produces: a página `/aplicativo` publicada.

- [ ] **Step 1: Gerar e aplicar a migração**

Run: `pnpm migrate:create pagina_aplicativo`
Revise o arquivo gerado: só deve **adicionar** tabelas dos blocos novos. Nenhum `DROP`.

Run: `pnpm migrate`
Expected: `Done.`

- [ ] **Step 2: Completar o teste e2e**

Adicione a `tests/e2e/aplicativo.e2e.spec.ts`:

```ts
test.describe('Página do aplicativo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/aplicativo')
  })

  test('responde 200 com h1 e nota das lojas', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('palma da mão')
    await expect(page.locator('.app-rating')).toContainText('4,8')
  })

  test('os selos apontam para as fichas reais das lojas', async ({ page }) => {
    const apple = page.getByRole('link', { name: /app store/i }).first()
    const play = page.getByRole('link', { name: /google play/i }).first()
    await expect(apple).toHaveAttribute('href', /apps\.apple\.com.*6504202916/)
    await expect(play).toHaveAttribute('href', /play\.google\.com.*br\.com\.semog/)
  })

  test('nunca menciona a marca do fornecedor whitelabel', async ({ page }) => {
    const texto = await page.locator('body').innerText()
    expect(texto).not.toMatch(/gruvi/i)
    expect(texto).not.toMatch(/superl[óo]gica/i)
  })

  test('a central de aprendizado alterna entre as abas', async ({ page }) => {
    const guias = page.getByRole('tab', { name: /passo a passo/i })
    await guias.click()
    await expect(guias).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('.learn-guides')).toBeVisible()
  })

  test('os guias abrem e mostram os passos', async ({ page }) => {
    await page.getByRole('tab', { name: /passo a passo/i }).click()
    const primeiro = page.locator('.learn-guides details').first()
    await expect(primeiro).toHaveAttribute('open', '')
    await expect(primeiro.locator('ol li').first()).toBeVisible()
  })

  test('emite JSON-LD com FAQPage e SoftwareApplication', async ({ page }) => {
    const raw = await page.locator('script[type="application/ld+json"]').first().textContent()
    const tipos = (JSON.parse(raw ?? '{}')['@graph'] ?? []).map(
      (n: { '@type': string }) => n['@type'],
    )
    expect(tipos).toContain('FAQPage')
    expect(tipos).toContain('SoftwareApplication')
  })

  test('o CTA final oferece os dois caminhos', async ({ page }) => {
    await expect(page.locator('.final-cta-path')).toHaveCount(2)
  })

  test('não rola na horizontal em 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.reload()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    )
    expect(overflow).toBe(false)
  })
})
```

- [ ] **Step 3: Rodar e confirmar que falha**

Run: `pnpm exec playwright test tests/e2e/aplicativo.e2e.spec.ts --config=playwright.config.ts`
Expected: FAIL — `/aplicativo` ainda dá 404.

- [ ] **Step 4: Semear as telas do app**

Coloque em `public/` (ou onde `src/seed/lib/media.ts` espera) as telas do aplicativo em PNG/WebP, nomeadas `app-inicio.webp`, `app-reserva.webp`, `app-prestador.webp`, `app-encomenda.webp`, e rode:

Run: `pnpm seed:media`
Expected: os quatro assets criados na coleção `media`.

**As telas precisam estar limpas**: os prints publicados hoje na Play Store mostram "Teste Gruvi" como nome do condomínio. Não use esses arquivos como estão — regrave ou edite antes de semear.

- [ ] **Step 5: Escrever o seed da página**

Modify `src/seed/pages.ts`. Adicione a página `aplicativo` com o layout abaixo. O conteúdo é o do mockup aprovado; a lista de funções vem da descrição oficial da Play Store.

```ts
const aplicativo = {
  title: 'Aplicativo',
  slug: 'aplicativo',
  _status: 'published' as const,
  meta: {
    title: 'Aplicativo Semog | O condomínio inteiro na palma da mão',
    description:
      'Boleto, reserva de área comum, assembleia virtual, encomendas e liberação de visitante pelo celular. Nota 4,8 na App Store e no Google Play. Grátis para o morador.',
  },
  layout: [
    {
      blockType: 'appHero',
      eyebrow: 'Aplicativo Semog',
      headline: 'O condomínio inteiro na palma da mão.',
      lead: 'Boleto, reserva de área comum, assembleia, encomenda e liberação de visitante. O morador resolve pelo celular, o síndico acompanha tudo e a administradora para de ser central telefônica.',
      rating: { score: '4,8', label: '1.133 avaliações · 10 mil+ downloads no Android' },
      stores: {
        appStore: 'https://apps.apple.com/br/app/semog-condom%C3%ADnios/id6504202916',
        playStore: 'https://play.google.com/store/apps/details?id=br.com.semog',
      },
      footnote: 'Grátis para o morador. Disponível para todos os condomínios administrados pela Semog.',
      screens: [{ image: appInicioId }, { image: appReservaId }],
    },
    {
      blockType: 'featureGrid',
      variant: 'light',
      white: true,
      columns: '3',
      eyebrow: 'Para o morador',
      title: 'O que antes era um telefonema, agora são dois toques.',
      items: [
        { title: 'Taxa do condomínio', text: 'Boleto do mês, 2ª via, boletos pagos, comprovante e troca da forma de pagamento — sem pedir para ninguém.' },
        { title: 'Reserva de áreas comuns', text: 'Calendário com o que está livre, aprovado e bloqueado. Reserva e cancelamento pelo celular.' },
        { title: 'Assembleia virtual ou híbrida', text: 'Participação e voto em pauta pelo aplicativo, com registro. Quem não pode ir continua decidindo.' },
        { title: 'Encomendas', text: 'Aviso quando chega, código e QR para retirada na portaria, e controle de quem pode retirar.' },
        { title: 'Documentos e comunicados', text: 'Convenção, atas, balancetes e avisos oficiais sempre à mão, com registro de leitura.' },
        { title: 'Ocorrências e fale com o síndico', text: 'Abertura de ocorrência da unidade e canal direto com o síndico e com a portaria.' },
        { title: 'Conversas do condomínio', text: 'Salas para comunicados oficiais, grupos por assunto e chat privado com o vizinho. Dá para silenciar ou sair.' },
        { title: 'Veículos e moradores', text: 'Cadastro de veículos e de moradores da unidade, unificado e sempre atualizado.' },
        { title: 'Mais de um imóvel', text: 'Quem tem imóvel em mais de um condomínio troca de unidade dentro do mesmo aplicativo.' },
      ],
    },
    {
      blockType: 'solutionSplit',
      eyebrow: 'Portaria e controle de acesso',
      title: 'A portaria deixa de ser um gargalo.',
      text: 'O morador libera quem vai entrar antes de a pessoa chegar. A portaria recebe pronto, confere e libera.',
      image: appPrestadorId,
      items: [
        { text: 'Convite de visitante por link, com pré-cadastro feito pelo próprio convidado' },
        { text: 'Autocadastro facial para entrada sem parar na portaria' },
        { text: 'Liberação de prestadores de serviço e entregas, com data e validade' },
        { text: 'Registro de entradas e saídas consultável pela unidade' },
      ],
      footnote:
        'O controle de acesso depende do plano contratado e do equipamento instalado no condomínio, e não substitui o porteiro presencial.',
    },
    {
      blockType: 'pillars',
      variant: 'columns',
      light: true,
      tightTop: false,
      items: [
        { title: 'Menos grupo de WhatsApp, mais registro', text: 'Comunicado oficial que fica registrado, ocorrências com histórico, reservas aprovadas com critério e um canal direto com o morador — sem o mandato virar plantão no celular pessoal.' },
        { title: 'Autosserviço é o que mantém a conta em dia', text: 'Boleto, documento e reserva resolvidos no aplicativo são ligações que não acontecem. Sobra tempo do nosso time para o que exige gente: financeiro, jurídico e assembleia.' },
      ],
    },
    {
      blockType: 'processoTimeline',
      eyebrow: 'Já moro em um condomínio Semog',
      title: 'Três passos e você está dentro.',
      items: [
        { title: 'Baixe o aplicativo', text: 'Procure por Semog Condomínios na App Store ou no Google Play, ou use o link e o QR Code distribuídos no seu condomínio.' },
        { title: 'Valide seus dados', text: 'Confirme o e-mail ou o documento com os mesmos dados do cadastro do condomínio. É essa validação que garante que só quem mora ali entra.' },
        { title: 'Pronto', text: 'Boletos, reservas, documentos e conversas liberados. Ative as notificações para não perder aviso de encomenda e comunicado.' },
      ],
    },
    {
      blockType: 'learnCenter',
      eyebrow: 'Aprenda a usar',
      title: 'Ninguém deveria precisar ligar para aprender a usar um aplicativo.',
      lead: 'Vídeo curto, passo a passo escrito e material pronto para o condomínio divulgar. Tudo em um lugar só, para o morador resolver na hora e o síndico não virar suporte técnico.',
      // `videos` e `materials` entram quando existirem — ver seção 8 da spec.
      // Sem eles, só a aba "Passo a passo" aparece, e ela já resolve sozinha.
      guides: [
        {
          title: 'Primeiro acesso e validação de dados',
          steps: [
            { text: 'Baixe Semog Condomínios na App Store ou no Google Play, ou use o link e o QR Code distribuídos no condomínio.' },
            { text: 'Abra o aplicativo e toque no banner Conecte-se e em Autorizar.' },
            { text: 'Escolha validar por e-mail ou por documento. Use os mesmos dados que constam no cadastro feito pela administração.' },
            { text: 'Por e-mail: acesse a caixa de entrada e clique no link de validação. Por documento: tire as fotos seguindo as orientações da tela e aguarde a conferência.' },
            { text: 'Validado, o condomínio e a sua unidade aparecem liberados no menu.' },
          ],
          note: 'Não recebeu o e-mail? Confira a caixa de spam e se o endereço é o mesmo do cadastro. Se estiver diferente, peça a atualização cadastral antes de tentar de novo.',
        },
        {
          title: 'Boleto, 2ª via e comprovante',
          steps: [
            { text: 'No menu Condomínio, toque em Taxas do Condomínio.' },
            { text: 'O boleto do mês aparece no topo, com código de barras para copiar ou pagar direto.' },
            { text: 'Toque em um boleto já quitado para baixar o comprovante.' },
            { text: 'Em Formas de Pagamento você troca entre boleto, débito automático e as opções liberadas pelo condomínio.' },
          ],
          note: 'Boleto do mês ainda não apareceu? A emissão segue o calendário do condomínio — normalmente ele fica disponível alguns dias antes do vencimento.',
        },
        {
          title: 'Reservar e cancelar área comum',
          steps: [
            { text: 'Em Condomínio, abra Reservas e escolha a área e o turno.' },
            { text: 'No calendário, verde é aprovada, azul é reserva de outro morador, vermelho é data bloqueada e cinza é indisponível.' },
            { text: 'Escolha a data livre e toque em Continuar para confirmar.' },
            { text: 'Para cancelar, abra a reserva na lista e escolha cancelar — respeitando o prazo definido na convenção.' },
          ],
          note: 'Algumas áreas cobram taxa de reserva, que entra na taxa condominial do mês seguinte conforme a regra do seu condomínio.',
        },
        {
          title: 'Liberar visitante, prestador e entrega',
          steps: [
            { text: 'Em Portaria, escolha Visitantes ou Prestadores.' },
            { text: 'Defina a data, se é por um dia ou recorrente, e se é pedestre ou veículo.' },
            { text: 'Envie o link de convite. O próprio convidado preenche os dados dele antes de chegar.' },
            { text: 'Na portaria, a liberação já aparece pronta: é só conferir e liberar.' },
          ],
          note: 'Para entrada sem parar na portaria, cadastre a biometria facial em Portaria → Moradores. Depende do equipamento instalado no seu condomínio.',
        },
        {
          title: 'Retirar encomenda',
          steps: [
            { text: 'Você recebe uma notificação assim que a portaria registra a encomenda.' },
            { text: 'Em Portaria → Encomendas, abra a encomenda para ver tipo, data de recebimento e código de retirada.' },
            { text: 'Apresente o QR Code na portaria para retirar.' },
          ],
          note: 'Outro morador pode retirar por você se estiver cadastrado na unidade e autorizado pelo proprietário ou inquilino.',
        },
        {
          title: 'Assembleia: participar e votar',
          steps: [
            { text: 'Em Condomínio → Assembleias, abra a assembleia aberta no momento.' },
            { text: 'Acompanhe a pauta em andamento e o material anexado pelo síndico.' },
            { text: 'Toque na opção desejada para registrar o seu voto enquanto a pauta estiver aberta.' },
          ],
          note: 'Em assembleia híbrida o voto pelo aplicativo tem o mesmo peso do voto presencial e fica registrado em ata.',
        },
        {
          title: 'Conversas, avisos e notificações',
          steps: [
            { text: 'Na aba Conversas ficam a sala oficial do condomínio, as salas por assunto e os chats privados.' },
            { text: 'Toque no nome da sala para silenciar as notificações ou sair, quando ela for opcional.' },
            { text: 'Ative as notificações do aplicativo nos ajustes do celular para não perder aviso de encomenda e comunicado.' },
          ],
          note: 'A sala oficial de comunicados não pode ser desativada — é por ela que o síndico envia o aviso que precisa chegar a todos.',
        },
      ],
    },
    {
      blockType: 'faq',
      dark: true,
      eyebrow: 'Dúvidas',
      title: 'O que perguntam antes de baixar.',
      items: [
        { question: 'O aplicativo é gratuito?', answer: 'Sim, para o morador. Alguns módulos, como o controle de acesso, dependem do plano contratado pelo condomínio.' },
        { question: 'Meus dados estão seguros?', answer: 'O aplicativo está em conformidade com a LGPD. Só quem mora no condomínio tem acesso às informações e às conversas, e os dados sensíveis ficam ocultos — por isso existe a validação de cadastro.' },
        { question: 'Por que preciso validar meu cadastro?', answer: 'A validação liga a sua conta à sua unidade. Sem ela, qualquer pessoa poderia ver comunicados, documentos e conversas do seu condomínio.' },
        { question: 'Dá para usar no computador?', answer: 'Sim. As funções principais também estão disponíveis pelo navegador.' },
        { question: 'Tenho imóvel em mais de um condomínio.', answer: 'Um cadastro só atende todos. Você troca de unidade dentro do aplicativo.' },
        { question: 'Sou síndico e quero o aplicativo no meu condomínio.', answer: 'O aplicativo faz parte da administração Semog. Peça uma proposta e a implantação entra junto.' },
      ],
    },
    {
      blockType: 'ctaBand',
      variant: 'dual',
      title: 'Cada um segue por um caminho.',
      cta: { label: 'Solicitar proposta', href: '/proposta' },
      paths: [
        {
          title: 'Sou síndico ou conselheiro',
          text: 'Quero o aplicativo, a prestação de contas digital e o Garante no meu condomínio.',
          cta: { label: 'Solicitar proposta', href: '/proposta' },
        },
        {
          title: 'Moro em um condomínio Semog',
          text: 'Quero baixar o aplicativo e resolver boleto, reserva e encomenda pelo celular.',
          cta: {
            label: 'Baixar o aplicativo',
            href: 'https://play.google.com/store/apps/details?id=br.com.semog',
          },
        },
      ],
    },
  ],
}
```

Adicione `appInicioId`, `appReservaId` e `appPrestadorId` ao `Promise.all` de `getMediaId` do arquivo, e inclua `aplicativo` na lista de páginas que o seed cria/atualiza, seguindo exatamente o padrão das páginas vizinhas.

**Confira os nomes de campo dos três blocos reusados antes de rodar.** Os nomes acima seguem o mockup, mas cada bloco tem o seu vocabulário (`items[].text` vs `items[].description`, `columns` como string ou número). Rode:

```bash
pnpm exec node -e "
for (const b of ['FeatureGrid', 'SolutionSplit', 'ProcessoTimeline']) {
  console.log('=== ' + b + ' ===')
  console.log(require('node:fs').readFileSync('src/blocks/' + b + '/config.ts', 'utf8'))
}
" | grep -E "name: '|options:|value: '"
```

Ajuste o seed para o que cada config espera. Se um campo necessário não existir — `footnote` em `solutionSplit` é o caso mais provável — adicione-o ao config como **opcional**, com teste de renderização condicional no padrão das Tasks 1 e 2, antes de usar. Um campo obrigatório novo quebraria as páginas que já usam o bloco.

- [ ] **Step 6: Rodar o seed**

Run: `pnpm seed:pages`
Expected: confirmação de criação/atualização da página `aplicativo`.

- [ ] **Step 7: Rodar e confirmar que passa**

Run: `pnpm exec playwright test tests/e2e/aplicativo.e2e.spec.ts --config=playwright.config.ts`
Expected: PASS, 10 testes.

- [ ] **Step 8: Conferir a página inteira**

Run: `pnpm dev`, abra `http://localhost:3000/aplicativo` em 1440×900 e 390×844.
Expected: ordem igual ao mockup, abas alternando, guias abrindo, nenhuma rolagem horizontal e nenhuma menção a Gruvi ou Superlógica.

- [ ] **Step 9: Verificar lint e tipos**

Run: `pnpm check && pnpm exec tsc --noEmit`
Expected: sem erros.

- [ ] **Step 10: Commit**

```bash
git add src/migrations src/seed/pages.ts tests/e2e/aplicativo.e2e.spec.ts
git commit -m "feat(aplicativo): página do app com central de aprendizado

Vende para o síndico na metade de cima, ensina o morador na de baixo.
Vídeos e material entram quando existirem; os 7 guias em texto já
funcionam e são o que o Google indexa."
```

---

## Verificação final

- [ ] `pnpm check` limpo
- [ ] `pnpm exec tsc --noEmit` limpo
- [ ] `pnpm exec vitest run --config ./vitest.config.mts` — todos passam
- [ ] `pnpm exec playwright test --config=playwright.config.ts` — todos passam
- [ ] `git diff --exit-code src/payload-types.ts` limpo depois de `pnpm generate:types`
- [ ] `/aplicativo` sem nenhuma menção a Gruvi, Superlógica, Cyrela ou Intelbras
- [ ] Selos apontam para as fichas reais e abrem em nova aba
- [ ] JSON-LD com `FAQPage` e `SoftwareApplication`; `ratingValue` bate com as lojas
- [ ] Landings de cidade continuam com `BreadcrumbList` + `LocalBusiness` + `FAQPage`
- [ ] Guias legíveis com JavaScript desligado (é o que o Google lê)
- [ ] Sem rolagem horizontal em 390px

## Pendências que não bloqueiam esta entrega

Registradas na seção 8 da spec, dependem do cliente:

- 6 vídeos de 1 a 2 minutos → aba "Vídeos"
- Kit de divulgação (cartaz com QR, mensagem, slides, FAQ impresso) → aba "Material"
- Revisão dos 7 guias por quem usa o app no dia a dia
- Despublicar o app antigo "Semog" (App Store id 1489510976)
- Regravar os prints da Play Store, que mostram "Teste Gruvi"
- Confirmar se o app "Semog Garante" sob a conta "Everton Avila" é oficial
