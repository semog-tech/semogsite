# Remoção do Payload — Fase 1: Tipos e Páginas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer as páginas do site renderizarem a partir de arquivos de dados TypeScript no repositório, em vez de documentos no Postgres via Payload — sem o Payload ser removido ainda (fallback preservado) e sem mudança visual.

**Architecture:** Tipos de bloco escritos à mão em `src/types/` substituem os importados de `@/payload-types`. O conteúdo das páginas migra dos seeds atuais (que já são objetos TS) para `content/pages/*.ts`. Uma nova camada de dados `src/lib/content.ts` lê desses arquivos com as MESMAS assinaturas de `src/lib/payload.ts`, então o catch-all e os componentes não mudam de contrato. O catch-all deixa de ser ISR e vira estático.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5.7, Vitest 4 + Testing Library, Playwright 1.58, Biome 2.5, pnpm 10.

## Global Constraints

- Gerenciador de pacotes: **pnpm** (v10.12.4). Nunca npm/yarn.
- Antes de cada commit: `pnpm exec tsc --noEmit` e `pnpm exec biome lint ./src ./tests` limpos. **Não** rodar `pnpm check` para validar (é `biome check --write`, reescreve arquivos); usar `biome lint`.
- **Windows `core.autocrlf=true`:** arquivos em disco são CRLF, git armazena LF. `biome ci` acusa ruído de fim de linha em arquivos não tocados — ignorar; `git add` só o que você editou de fato.
- Comentários de código em **português**, explicando o **porquê**, no padrão dos arquivos vizinhos.
- **Nenhuma mudança visual.** Qualquer diferença de render entre antes e depois é regressão.
- O Payload **continua instalado e funcional** ao fim desta fase — esta fase só troca a fonte de dados das páginas, não remove nada.
- Banco compartilhado local↔produção: esta fase **não** roda seed nem migração; só lê. Nada muda no banco.
- Um dev server já roda em `http://localhost:3000` contra o banco de produção via proxy. NÃO reiniciar (não dá pra reiniciar — precisa da connection string do proxy).

## Referência

Spec: `docs/superpowers/specs/2026-07-24-remocao-do-payload-cms-design.md` (seções 4.1, 4.4, 6).

Contexto que os implementadores precisam saber:
- Os 41 componentes de bloco (`src/blocks/*/Component.tsx`) importam **só tipos** de `@/payload-types` — nenhum usa Payload em runtime.
- `RenderBlocks` (`src/blocks/RenderBlocks.tsx`) recebe `blocks?: Block[]` e mapeia `block.blockType` → componente, passando `{...block}` como props e `key={block.id ?? i}`.
- A camada de dados atual é `src/lib/payload.ts`: `getPageBySlug(slug): Promise<Page|null>`, `getSiteSettings(): Promise<SiteSettings|null>`, e as 3 de posts (tratadas na Fase 2).
- O catch-all `src/app/(frontend)/[[...slug]]/page.tsx` chama `getPageBySlug` + `getSiteSettings` + `getPageJsonLd`, tem `export const revalidate = 3600` e um `generateStaticParams` que hoje lê do Payload.

---

### Task 1: Tipo `Media` e utilitários base de tipos

Os blocos referenciam `Media` (imagens). Hoje `Media` vem de `@/payload-types` com o shape do Payload (id numérico, url, alt, width, height, etc.). Precisamos de um `Media` próprio, mínimo, com os campos que os componentes realmente leem.

**Files:**
- Create: `src/types/media.ts`
- Test: `tests/int/types-media.int.spec.ts`

**Interfaces:**
- Consumes: nada.
- Produces: `type Media = { id?: number|string; url?: string|null; alt?: string|null; width?: number|null; height?: number|null }`. Todas as tasks de bloco seguintes e a Fase 2 consomem.

- [ ] **Step 1: Levantar os campos de Media realmente usados**

Run: `pnpm exec grep -rhoE "\.(url|alt|width|height|filename|mimeType|thumbnailURL)\b" src/components/Media src/blocks --include=*.tsx | sort | uniq -c | sort -rn`
Expected: confirma quais campos de `Media` os componentes leem (`url`, `alt`, `width`, `height` esperados). Anote qualquer campo extra que apareça e inclua no tipo.

- [ ] **Step 2: Escrever o teste que falha**

Create `tests/int/types-media.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { Media } from '@/types/media'

describe('tipo Media', () => {
  it('aceita o shape mínimo que os componentes leem', () => {
    const m: Media = { url: 'https://x/y.webp', alt: 'foto', width: 800, height: 600 }
    expect(m.url).toBe('https://x/y.webp')
  })

  it('aceita url/alt nulos (campos opcionais do CMS)', () => {
    const m: Media = { url: null, alt: null }
    expect(m.url).toBeNull()
  })
})
```

- [ ] **Step 3: Rodar e confirmar que falha**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/types-media.int.spec.ts`
Expected: FAIL — `Cannot find module '@/types/media'`.

- [ ] **Step 4: Escrever o tipo**

Create `src/types/media.ts`:

```ts
/**
 * Shape mínimo de imagem, com só os campos que os componentes de bloco leem
 * (levantados na Task 1). Substitui o `Media` gerado pelo Payload — no modelo
 * estático, a imagem é referenciada por URL (a URL do storage do Supabase,
 * mantido). `id` é opcional e aceita string/number para não amarrar a origem.
 */
export type Media = {
  id?: number | string
  url?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
}
```

Se a Task 1 revelou campos extras (ex.: `mimeType`), adicione-os aqui como opcionais.

- [ ] **Step 5: Rodar e confirmar que passa**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/types-media.int.spec.ts`
Expected: PASS, 2 testes.

- [ ] **Step 6: Verificar tipos e lint**

Run: `pnpm exec tsc --noEmit && pnpm exec biome lint ./src ./tests`
Expected: sem erros.

- [ ] **Step 7: Commit**

```bash
git add src/types/media.ts tests/int/types-media.int.spec.ts
git commit -m "feat(types): tipo Media próprio, mínimo (base da remoção do Payload)"
```

---

### Task 2: Tipos de bloco escritos à mão

Substituir os tipos `*Block` gerados por definições à mão em `src/types/blocks.ts`, derivadas dos `config.ts` de cada bloco e do que cada `Component.tsx` desestrutura.

**Files:**
- Create: `src/types/blocks.ts`
- Create: `src/types/content.ts`
- Test: `tests/int/types-blocks.int.spec.ts`

**Interfaces:**
- Consumes: `Media` (Task 1).
- Produces: um `interface XBlock` por tipo de bloco (com `blockType` literal, `id?`, `blockName?` e os campos), uma union `Block`, e em `content.ts` o `PageData` (`slug`, `meta`, `layout: Block[]`). A Task 3 e todas as de página consomem.

- [ ] **Step 1: Gerar o inventário de blocos e campos**

Run: `for d in src/blocks/*/; do b=$(basename "$d"); echo "== $b =="; grep -oE "name: '[^']*'|blockType" "$d/config.ts" 2>/dev/null | head -30; done > /tmp/blocks-inventory.txt; wc -l /tmp/blocks-inventory.txt`
Expected: um arquivo com os campos de cada bloco. Use-o como fonte da verdade ao escrever os tipos. Cruze com o que cada `Component.tsx` desestrutura das props — o tipo precisa cobrir tudo que o componente lê.

- [ ] **Step 2: Escrever o teste que falha**

Create `tests/int/types-blocks.int.spec.ts`. O teste garante que cada componente aceita seu tipo — importa alguns componentes representativos e monta props tipadas:

```ts
import { describe, expect, it } from 'vitest'
import type { Block, HeroBlock, StatsBlock } from '@/types/blocks'
import type { PageData } from '@/types/content'

describe('tipos de bloco', () => {
  it('HeroBlock cobre os campos do hero da home', () => {
    const b: HeroBlock = {
      blockType: 'hero',
      headline: 'x',
      proofItems: [{ value: '4,8', label: 'no app', stars: true }],
      ctas: [{ label: 'Solicitar', href: '/proposta', variant: 'white' }],
    }
    expect(b.blockType).toBe('hero')
  })

  it('StatsBlock aceita a variante band', () => {
    const b: StatsBlock = { blockType: 'stats', variant: 'band', items: [{ value: 35, label: 'Anos' }] }
    expect(b.variant).toBe('band')
  })

  it('a union Block aceita qualquer bloco', () => {
    const bs: Block[] = [{ blockType: 'hero', headline: 'x' }, { blockType: 'stats', items: [] }]
    expect(bs).toHaveLength(2)
  })

  it('PageData compõe slug, meta e layout', () => {
    const p: PageData = { slug: 'home', meta: { title: 't', description: 'd' }, layout: [] }
    expect(p.slug).toBe('home')
  })
})
```

- [ ] **Step 3: Rodar e confirmar que falha**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/types-blocks.int.spec.ts`
Expected: FAIL — módulos não existem.

- [ ] **Step 4: Escrever os tipos de bloco**

Create `src/types/blocks.ts`. Para CADA um dos 41 blocos, escreva uma `interface`. Regra: o tipo cobre exatamente os campos do `config.ts` do bloco e tudo que o `Component.tsx` desestrutura. Campos de imagem usam `number | Media` (o número era o id do Payload; mantido para compat com o shape atual dos dados durante a migração). Todo campo é opcional exceto os `required: true` do config. Cada interface tem `blockType: '<slug>'` literal, mais `id?: string | number | null` e `blockName?: string | null` (o `RenderBlocks` usa `block.id`).

Exemplo (Hero — derive os demais do mesmo modo, um por bloco):

```ts
import type { Media } from './media'

export interface HeroBlock {
  blockType: 'hero'
  id?: string | number | null
  blockName?: string | null
  eyebrow?: string | null
  headline: string
  subhead?: string | null
  tag?: string | null
  proofItems?: { value: string; label: string; stars?: boolean | null; id?: string | null }[] | null
  video?: (number | null) | Media
  poster?: (number | null) | Media
  background?: ('gradient' | 'videoSequence' | 'video') | null
  // … demais campos pageHero* e priceChip conforme Hero/config.ts
  ctas?: { label?: string | null; href?: string | null; variant?: string | null; id?: string | null }[] | null
}
```

Ao fim, a union:

```ts
export type Block =
  | HeroBlock
  | StatsBlock
  | ValuesMarqueeBlock
  // … todos os 41
```

**Fonte da verdade:** o bloco `export interface Page` em `src/payload-types.ts` já lista a union completa do `layout` e cada `*Block` com seus campos — copie os shapes de lá (é o que o Payload gerou a partir dos mesmos configs), ajustando só o que a Task 1 definiu para `Media`. Isso garante paridade exata com o que os componentes esperam hoje.

- [ ] **Step 5: Escrever o tipo de conteúdo**

Create `src/types/content.ts`:

```ts
import type { Block } from './blocks'

/** Uma página estática: o que o catch-all e o `RenderBlocks` precisam. */
export interface PageData {
  slug: string
  meta?: { title?: string | null; description?: string | null; image?: string | null }
  layout: Block[]
}
```

- [ ] **Step 6: Rodar e confirmar que passa**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/types-blocks.int.spec.ts`
Expected: PASS, 4 testes.

- [ ] **Step 7: Verificar que os tipos batem com os componentes**

Run: `pnpm exec tsc --noEmit`
Expected: sem erros. (Neste ponto os componentes ainda importam de `@/payload-types`; a troca é a Task 3. Aqui só garantimos que os tipos novos compilam.)

- [ ] **Step 8: Commit**

```bash
git add src/types/blocks.ts src/types/content.ts tests/int/types-blocks.int.spec.ts
git commit -m "feat(types): tipos de bloco e PageData escritos à mão"
```

---

### Task 3: Apontar os componentes de bloco para os tipos novos

Trocar, nos 41 componentes, o import de tipo de `@/payload-types` para `@/types/blocks`. Nenhuma mudança de lógica.

**Files:**
- Modify: os `src/blocks/*/Component.tsx` que importam tipos de `@/payload-types` (e `src/blocks/RenderBlocks.tsx`).
- Test: `tests/int/blocks-render.int.spec.tsx`

**Interfaces:**
- Consumes: `src/types/blocks.ts` (Task 2).
- Produces: componentes desacoplados de `@/payload-types`. A Task 6 (remover payload-types) na Fase 4 depende disso.

- [ ] **Step 1: Escrever o teste que falha (render de fumaça)**

Create `tests/int/blocks-render.int.spec.tsx` — renderiza alguns blocos com props tipadas pelos tipos novos, provando que o contrato bate:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HeroBlock } from '@/blocks/Hero/Component'
import { StatsBlock } from '@/blocks/Stats/Component'
import type { HeroBlock as HeroT, StatsBlock as StatsT } from '@/types/blocks'

describe('blocos renderizam com os tipos novos', () => {
  it('Hero', () => {
    const props: HeroT = { blockType: 'hero', headline: 'Preocupe-se apenas' }
    render(<HeroBlock {...props} />)
    expect(screen.getByText(/Preocupe-se apenas/)).toBeDefined()
  })

  it('Stats band', () => {
    const props: StatsT = { blockType: 'stats', variant: 'band', title: 'Liderança', items: [{ value: 35, label: 'Anos' }] }
    render(<StatsBlock {...props} />)
    expect(screen.getByText('Liderança')).toBeDefined()
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/blocks-render.int.spec.tsx`
Expected: FAIL — o `import type { HeroBlock as HeroT } from '@/types/blocks'` compila, mas os componentes ainda tipam suas props via `@/payload-types`; se os tipos divergirem em algum campo, o `tsc` do teste acusa. (Se por acaso passar de primeira, os tipos já são compatíveis — siga para o Step 3 mesmo assim para fazer a troca de import.)

- [ ] **Step 3: Trocar os imports**

Em cada `src/blocks/*/Component.tsx`, troque:

```ts
import type { XBlock as XBlockType, Media } from '@/payload-types'
```

por:

```ts
import type { XBlock as XBlockType } from '@/types/blocks'
import type { Media } from '@/types/media'
```

Faça arquivo por arquivo. Para localizar todos:

Run: `grep -rl "@/payload-types" src/blocks`

Em `RenderBlocks.tsx`, troque `import type { Page } from '@/payload-types'` (o tipo do `blocks`) por `import type { Block } from '@/types/blocks'` e ajuste a assinatura para `blocks?: Block[] | null`.

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `pnpm exec vitest run --config ./vitest.config.mts && pnpm exec tsc --noEmit`
Expected: os testes passam e `tsc` fica limpo. Se `tsc` acusar um campo faltando num tipo de bloco, o tipo da Task 2 estava incompleto — complete-o (é o objetivo: os tipos à mão precisam cobrir 100% do que os componentes usam).

- [ ] **Step 5: Confirmar que nenhum bloco ainda importa de payload-types**

Run: `grep -rl "@/payload-types" src/blocks || echo "nenhum — blocos desacoplados"`
Expected: `nenhum — blocos desacoplados`.

- [ ] **Step 6: Verificar lint**

Run: `pnpm exec biome lint ./src ./tests`
Expected: sem erros.

- [ ] **Step 7: Commit**

```bash
git add src/blocks tests/int/blocks-render.int.spec.tsx
git commit -m "refactor(blocks): tipos vêm de src/types, não mais de payload-types"
```

---

### Task 4: Migrar o conteúdo das páginas para `content/pages/`

Converter cada página dos seeds atuais (`src/seed/pages.ts`, `src/seed/home.ts`) para um arquivo de dados em `content/pages/`, tipado como `PageData`.

**Files:**
- Create: `content/pages/home.ts`, `content/pages/semog.ts`, … (uma por página)
- Create: `content/pages/index.ts`
- Test: `tests/int/content-pages.int.spec.ts`

**Interfaces:**
- Consumes: `PageData` (Task 2).
- Produces: `export const pages: Record<string, PageData>` em `content/pages/index.ts`. A Task 5 (`content.ts`) consome.

- [ ] **Step 1: Listar as páginas a migrar**

Run: `grep -oE "slug: '[^']*'" src/seed/pages.ts | sort -u; echo "home (src/seed/home.ts)"`
Expected: a lista de slugs. Excluir as 4 landings `administradora-de-condominios-*` (são rotas explícitas com `CityLanding.tsx`, não passam pelo catch-all — confirmar em `src/data/cityLandings.ts` e nas rotas `src/app/(frontend)/administradora-de-condominios-*`). Migrar: `home`, `semog`, `solucoes`, `administracao-de-condominios`, `garante`, `incorporadoras`, `blog`, `contato`, `proposta`, `privacidade`, `termos`.

- [ ] **Step 2: Escrever o teste que falha**

Create `tests/int/content-pages.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { pages } from '@/../content/pages'

const ESPERADAS = [
  'home', 'semog', 'solucoes', 'administracao-de-condominios', 'garante',
  'incorporadoras', 'blog', 'contato', 'proposta', 'privacidade', 'termos',
]

describe('content/pages', () => {
  it('tem todas as páginas do catch-all', () => {
    for (const slug of ESPERADAS) expect(pages[slug], slug).toBeDefined()
  })

  it('cada página tem slug batendo com a chave e um layout array', () => {
    for (const [slug, page] of Object.entries(pages)) {
      expect(page.slug).toBe(slug)
      expect(Array.isArray(page.layout)).toBe(true)
    }
  })

  it('a home começa com um hero e tem a faixa de prova', () => {
    const home = pages.home
    expect(home.layout[0].blockType).toBe('hero')
    const hero = home.layout[0] as { proofItems?: unknown[] }
    expect(hero.proofItems?.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 3: Rodar e confirmar que falha**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/content-pages.int.spec.ts`
Expected: FAIL — `content/pages` não existe.

- [ ] **Step 4: Migrar as imagens: de id do Payload para URL**

As páginas no seed referenciam imagens por `getMediaId(payload, 'arquivo.webp')` (id numérico resolvido em runtime). No modelo estático, a imagem é uma URL do storage do Supabase. Crie um mapa `content/media.ts` de filename → URL pública:

```ts
/**
 * URLs públicas das imagens no storage do Supabase (mantido). Substitui o
 * `getMediaId` do seed, que resolvia o id numérico do doc `media` do Payload.
 * A base é o bucket público já usado hoje (ver next.config remotePatterns).
 */
const BASE = 'https://qvxlkovrxfqigeaopvui.supabase.co/storage/v1/object/public/media/'
export const img = (file: string): { url: string; alt: string } => ({ url: BASE + file, alt: '' })
```

Para o `alt`: os `alt` reais estão em `src/seed/lib/media.ts` (`MEDIA_ASSETS[].alt`). Porte esse mapa filename→alt para `content/media.ts` para que `img('residencial.webp')` já venha com o alt correto. **Confira cada alt contra `src/seed/lib/media.ts`** — o alt é acessibilidade e SEO, não pode se perder.

- [ ] **Step 5: Escrever os arquivos de página**

Para cada página, crie `content/pages/<slug>.ts` copiando o objeto do seed e substituindo:
- Referências de imagem `getMediaId(...)` → `img('arquivo.webp')` (objeto `{url, alt}` que o tipo `Media` aceita).
- O shape do seed já é `{ blockType, ...campos }` — é o mesmo do `Block`. Ajuste só o que for preciso para tipar como `PageData`.

Exemplo:

```ts
// content/pages/home.ts
import type { PageData } from '@/types/content'
import { img } from '../media'

const APP_HREF = '/solucoes#aplicativo' // trocar p/ '/aplicativo' quando a página existir (plano 03)

export const home: PageData = {
  slug: 'home',
  meta: {
    title: 'Semog | Administradora de Condomínios líder do Nordeste há 35 anos',
    description: 'Administradora de condomínios em Recife, João Pessoa…',
  },
  layout: [
    { blockType: 'hero', headline: 'Preocupe-se apenas\nem morar.', subhead: '…',
      background: 'videoSequence', proofItems: [ /* … os 4 do seed atual … */ ],
      ctas: [ { label: 'Solicitar proposta', href: '/proposta', variant: 'white' },
               { label: 'Ver o aplicativo', href: APP_HREF, variant: 'glass' } ] },
    // … os demais blocos, na ordem exata do seed atual
  ],
}
```

**Fonte da verdade do conteúdo:** os seeds atuais (`src/seed/home.ts`, `src/seed/pages.ts`) — que já refletem o que está em produção. Copie fielmente; qualquer texto/ordem diferente é regressão.

Crie `content/pages/index.ts`:

```ts
import type { PageData } from '@/types/content'
import { home } from './home'
import { semog } from './semog'
// … importar todas
export const pages: Record<string, PageData> = {
  home, semog, solucoes, administracaoDeCondominios, garante, incorporadoras,
  blog, contato, proposta, privacidade, termos,
}
```

(Atenção às chaves: a chave do `Record` é o slug com hífen, ex.: `'administracao-de-condominios'` — use a string literal, não uma variável camelCase, na montagem do objeto.)

- [ ] **Step 6: Rodar e confirmar que passa**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/content-pages.int.spec.ts`
Expected: PASS, 3 testes.

- [ ] **Step 7: Verificar tipos e lint**

Run: `pnpm exec tsc --noEmit && pnpm exec biome lint ./src ./tests content`
Expected: sem erros. Se `tsc` acusar um campo não previsto no tipo de um bloco, complete o tipo na Task 2 (o conteúdo real é a validação final da cobertura dos tipos).

- [ ] **Step 8: Commit**

```bash
git add content tests/int/content-pages.int.spec.ts
git commit -m "feat(content): páginas migradas dos seeds para content/pages/*.ts"
```

---

### Task 5: Camada de dados nova (`content.ts`) e catch-all estático

Criar `src/lib/content.ts` com `getPageBySlug`/`getSiteSettings` lendo dos arquivos, e apontar o catch-all para ela, tornando-o estático. (As funções de post ficam para a Fase 2; nesta fase `content.ts` reexporta as de post ainda vindas de `payload.ts` para não quebrar o blog.)

**Files:**
- Create: `src/lib/content.ts`
- Create: `content/site.ts` (mínimo, só o que `getSiteSettings` retorna — os globais completos são a Fase 2)
- Modify: `src/app/(frontend)/[[...slug]]/page.tsx`
- Modify: `src/app/(frontend)/sitemap.ts`
- Test: `tests/int/content-layer.int.spec.ts`, e um e2e de regressão.

**Interfaces:**
- Consumes: `pages` (Task 4).
- Produces: `getPageBySlug(slug): Promise<PageData | null>` e `getSiteSettings(): Promise<SiteConfig | null>` de `@/lib/content`. O catch-all e a Fase 2 consomem.

- [ ] **Step 1: Escrever o teste que falha**

Create `tests/int/content-layer.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getPageBySlug, getSiteSettings } from '@/lib/content'

describe('camada de dados estática', () => {
  it('resolve a home pelo slug', async () => {
    const page = await getPageBySlug('home')
    expect(page?.slug).toBe('home')
    expect(page?.layout[0].blockType).toBe('hero')
  })

  it('devolve null para slug inexistente', async () => {
    expect(await getPageBySlug('nao-existe-123')).toBeNull()
  })

  it('getSiteSettings devolve título/descrição padrão', async () => {
    const s = await getSiteSettings()
    expect(s?.defaultTitle).toBeTruthy()
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/content-layer.int.spec.ts`
Expected: FAIL — `@/lib/content` não existe.

- [ ] **Step 3: Escrever `content/site.ts` (mínimo)**

Porte de `src/seed/globals.ts` (o global `site-settings`) só os campos que `getSiteSettings` alimenta hoje (`defaultTitle`, `defaultDescription`, `ogImage`, `social`):

```ts
export interface SiteConfig {
  defaultTitle: string
  defaultDescription: string
  ogImage?: string | null
  social?: { instagram?: string; linkedin?: string; facebook?: string }
}
export const site: SiteConfig = {
  defaultTitle: '…', // valor exato do seed:globals atual
  defaultDescription: '…',
  ogImage: '…',
  social: { instagram: '…', linkedin: '…', facebook: '…' },
}
```

(Header/Footer/Company completos são a Fase 2 — aqui só o `site-settings`.)

- [ ] **Step 4: Escrever `src/lib/content.ts`**

```ts
import type { PageData } from '@/types/content'
import { pages } from '@/../content/pages'
import { site, type SiteConfig } from '@/../content/site'
// Reexporta as funções de POST ainda vindas do Payload (Fase 2 as migra):
export { getRecentPosts, getRelatedPosts, getPostBySlug } from './payload'

/** Página estática por slug. Sem banco: lê do índice `content/pages`. */
export async function getPageBySlug(slug: string): Promise<PageData | null> {
  return pages[slug] ?? null
}

/** Config global do site (título/descrição/OG padrão). */
export async function getSiteSettings(): Promise<SiteConfig | null> {
  return site
}
```

(Assíncronas de propósito, para manter a MESMA assinatura de `payload.ts` e não tocar nos chamadores.)

- [ ] **Step 5: Apontar o catch-all para a camada nova, e torná-lo estático**

Modify `src/app/(frontend)/[[...slug]]/page.tsx`:
- Troque os imports de `getPageBySlug`/`getSiteSettings` de `@/lib/payload` para `@/lib/content`.
- **Remova** `export const revalidate = 3600` — a página vira estática pura (sem ISR).
- Troque `generateStaticParams` para iterar `Object.keys(pages)` de `@/../content/pages` (home vira `slug: []`, os demais `slug: [...]`), sem chamada ao Payload.
- `getPageJsonLd` e `buildMetadata` continuam recebendo o mesmo shape (`PageData` tem `slug`/`meta`/`layout`, compatível com o que essas funções leem — confirme lendo `src/lib/seo.ts`; se `getPageJsonLd` acessa `page.title`, adapte para `page.meta?.title` ou mantenha um `title` no `PageData`).

- [ ] **Step 6: Apontar o sitemap para a camada nova**

Modify `src/app/(frontend)/sitemap.ts`: troque a leitura de páginas do Payload por `Object.keys(pages)`. Mantenha as URLs das landings de cidade e do blog como já estão.

- [ ] **Step 7: Rodar os testes**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/content-layer.int.spec.ts`
Expected: PASS, 3 testes.

- [ ] **Step 8: E2e de regressão — as páginas renderizam igual**

Create `tests/e2e/paginas-estaticas.e2e.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

const ROTAS = ['/', '/semog', '/solucoes', '/garante', '/incorporadoras', '/contato', '/proposta', '/privacidade', '/termos']

test.describe('páginas servidas do conteúdo estático', () => {
  for (const rota of ROTAS) {
    test(`${rota} responde 200 com h1`, async ({ page }) => {
      const res = await page.goto(`http://localhost:3000${rota}`)
      expect(res?.status()).toBe(200)
      await expect(page.locator('h1').first()).toBeVisible()
    })
  }

  test('home mantém a faixa de prova e a seção do app', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    await expect(page.locator('.hero-proof')).toBeVisible()
    await expect(page.locator('.app-rating')).toBeVisible()
  })

  test('rota inexistente ainda dá 404', async ({ page }) => {
    const res = await page.goto('http://localhost:3000/rota-que-nao-existe-123')
    expect(res?.status()).toBe(404)
  })
})
```

Run: `pnpm exec playwright test tests/e2e/paginas-estaticas.e2e.spec.ts --config=playwright.config.ts`
Expected: PASS. Se alguma página divergir, o conteúdo migrado na Task 4 não bate com o seed — corrija o data file.

- [ ] **Step 9: Comparar com produção (fidelidade visual)**

Para 3 páginas (`/`, `/solucoes`, `/garante`), compare o HTML da seção principal renderizado localmente com o de produção (que ainda usa o Payload), como feito em fases anteriores:

Run: um script Playwright que baixa `outerHTML` da `<main>` de `https://www.semog.com.br<rota>` e de `http://localhost:3000<rota>`, normaliza `data-reveal`/`style`, e compara. Diferenças de conteúdo = regressão na migração.
Expected: idênticas (ou só diferenças explicáveis por `id` de bloco, que somem no modelo estático).

- [ ] **Step 10: Verificar tipos e lint**

Run: `pnpm exec tsc --noEmit && pnpm exec biome lint ./src ./tests content`
Expected: sem erros.

- [ ] **Step 11: Commit**

```bash
git add src/lib/content.ts content/site.ts "src/app/(frontend)/[[...slug]]/page.tsx" "src/app/(frontend)/sitemap.ts" tests/
git commit -m "feat(content): catch-all e sitemap leem do conteúdo estático (páginas fora do CMS)"
```

---

## Verificação final da Fase 1

- [ ] `pnpm exec tsc --noEmit` limpo
- [ ] `pnpm exec biome lint ./src ./tests content` limpo
- [ ] `pnpm exec vitest run --config ./vitest.config.mts` — todos passam
- [ ] `pnpm exec playwright test --config=playwright.config.ts` — todos passam
- [ ] Nenhum bloco importa de `@/payload-types` (`grep -rl "@/payload-types" src/blocks` vazio)
- [ ] As páginas do catch-all renderizam idênticas à produção (comparação da Task 5 Step 9)
- [ ] O blog ainda funciona (posts ainda vêm do Payload via reexport — Fase 2 os migra)
- [ ] O Payload continua instalado e o `/admin` ainda sobe (fallback intacto)

## O que fica para as fases seguintes

- **Fase 2:** globais completos (header/footer/company) para `content/site.ts`; blog e legais para MDX; remover a dependência de post do Payload.
- **Fase 3:** tabela `leads` no Supabase; `submit-form.ts` e o cron do Ads via supabase-js; migrar histórico.
- **Fase 4:** arrancar o Payload — grupo `(payload)`, collections, globals, configs, `payload.config.ts`, migrations, seeds, `payload-types.ts`, pacotes, scripts; desembrulhar `withPayload` do `next.config`.
