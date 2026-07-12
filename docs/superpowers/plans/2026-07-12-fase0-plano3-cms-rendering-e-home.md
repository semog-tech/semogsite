# Semog Fase 0 · Plano 3 — CMS (blocos), Rendering & Home

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modelar o site no Payload (collections + globals + biblioteca de blocos) e montar o pipeline de rendering do frontend (`[[...slug]]` → BlockRenderer → Header/Footer), com ISR/revalidation e `next/image` para a mídia do Supabase, entregando a **home renderizada a partir do CMS**.

**Architecture:** As páginas são documentos da collection `Pages` com um campo `layout` (array de blocos). Cada bloco = um config Payload (`src/blocks/<Nome>/config.ts`) + um componente React (`src/blocks/<Nome>/Component.tsx`), registrados num `BlockRenderer`. A rota catch-all `src/app/(frontend)/[[...slug]]/page.tsx` busca a Page pelo slug via **Payload Local API**, renderiza os blocos e envolve com Header/Footer vindos de Globals. Conteúdo publicado dispara `revalidatePath` (ISR on-demand). Imagens da collection `Media` (Supabase Storage) passam por `next/image`.

**Tech Stack:** Payload 3 (collections, globals, blocks, Local API, hooks, versions/drafts), Next 16 App Router (ISR, `generateStaticParams`, `next/image`), Tailwind v4 + os primitivos do Plano 2.

## Global Constraints

- Gerenciador: **pnpm 10.12.4**; Node v22. Windows.
- Banco no schema **`cms`** do projeto Supabase (já configurado em `payload.config.ts`). Escrever schemas/components NÃO precisa de DB; **verificação ao vivo (semear/rendrizar a home) precisa do `.env` preenchido** — deferir e documentar os passos que exigem DB, como no Plano 1.
- Reusar os primitivos do Plano 2 (`src/components/ui/*`, `src/motion/*`, tokens `theme.css`) — **não** recriar estilos.
- Fidelidade ao `_reference/` (a home é `_reference/index.html`). `_reference/` é a fonte da verdade; nunca editar.
- Conteúdo em **pt-BR**. Slugs em pt-BR sem acento (ex.: `solucoes`).
- `next/image` só para mídia do Supabase (`qvxlkovrxfqigeaopvui.supabase.co`) — configurar `remotePatterns`.
- Biome `check` = 0 e `tsc --noEmit` limpo antes de cada commit. Cada task termina em commit próprio.

## Escopo deste plano vs. continuação

**Neste plano (Plano 3):** data model completo (Pages/Posts/Categories + Globals), pipeline de rendering (BlockRenderer + `[[...slug]]` + Header/Footer + ISR), `next/image`, um **conjunto fundacional de blocos** (RichText, Hero, Stats, FeatureGrid, CTABand) e a **home montada com esses blocos** (estrutura fiel; blocos ainda não portados entram como continuação).

**Continuação (Plano 3b):** demais blocos (Serviço/Garante/Depoimentos/FAQ/Registros/City/BlogList), port 1:1 das outras 15 páginas, seed completo. Cada bloco novo segue o mesmo padrão (config + Component + registro no BlockRenderer) definido aqui.

## Mapa de arquivos

- `src/collections/Pages.ts`, `Posts.ts`, `Categories.ts`
- `src/globals/Header.ts`, `Footer.ts`, `Company.ts`, `SiteSettings.ts`
- `src/blocks/RichText/{config.ts,Component.tsx}` e idem para `Hero`, `Stats`, `FeatureGrid`, `CTABand`
- `src/blocks/RenderBlocks.tsx` (mapa slug-de-bloco → componente)
- `src/components/Media/ImageMedia.tsx` (wrapper `next/image` p/ docs da collection Media)
- `src/components/layout/HeaderServer.tsx`, `FooterServer.tsx` (lêem os Globals)
- `src/app/(frontend)/[[...slug]]/page.tsx` (catch-all), atualizar `src/app/(frontend)/layout.tsx`
- `src/lib/payload.ts` (helper `getPayloadClient()` + fetch de página por slug)
- `src/lib/revalidate.ts` + hooks nas collections
- `next.config.ts` (images.remotePatterns)
- `src/app/(frontend)/sitemap.ts` fica para o Plano 4 (SEO) — não aqui

---

### Task 1: Collections — Pages, Posts, Categories

**Files:**
- Create: `src/collections/Pages.ts`, `src/collections/Posts.ts`, `src/collections/Categories.ts`
- Modify: `src/payload.config.ts` (registrar as collections)

**Interfaces:**
- Consumes: nada (blocos entram na Task 4 via `layout`).
- Produces: `Pages` (campos `title`, `slug` único, `layout` array de blocos [vazio por ora], drafts/versions, `publishedAt`); `Posts` (`title`, `slug`, `content` richText, `category` relationship, `heroImage` upload→Media, `publishedAt`, drafts); `Categories` (`title`, `slug`).

- [ ] **Step 1: `src/collections/Categories.ts`**

```typescript
import type { CollectionConfig } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: { useAsTitle: 'title', group: 'Blog' },
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
  ],
}
```

- [ ] **Step 2: `src/collections/Posts.ts`**

```typescript
import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: { useAsTitle: 'title', group: 'Blog', defaultColumns: ['title', 'publishedAt'] },
  access: { read: () => true },
  versions: { drafts: true },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'heroImage', type: 'upload', relationTo: 'media' },
    { name: 'excerpt', type: 'textarea' },
    { name: 'content', type: 'richText' },
    { name: 'category', type: 'relationship', relationTo: 'categories' },
    { name: 'publishedAt', type: 'date', admin: { position: 'sidebar' } },
  ],
}
```

- [ ] **Step 3: `src/collections/Pages.ts`** (layout começa vazio; blocos entram na Task 4)

```typescript
import type { CollectionConfig } from 'payload'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: { useAsTitle: 'title', group: 'Conteúdo', defaultColumns: ['title', 'slug', 'updatedAt'] },
  access: { read: () => true },
  versions: { drafts: true },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: "Use 'home' para a página inicial. Sem acento (ex.: solucoes)." },
    },
    { name: 'layout', type: 'blocks', blocks: [] },
    { name: 'publishedAt', type: 'date', admin: { position: 'sidebar' } },
  ],
}
```

- [ ] **Step 4: Registrar no `payload.config.ts`**

Importar e adicionar `Pages, Posts, Categories` no array `collections` (mantendo `Users, Media`).

- [ ] **Step 5: Verificar (sem DB)**

Run: `pnpm exec tsc --noEmit && pnpm exec payload generate:types`
Expected: tipos gerados incluem `Page`, `Post`, `Category` em `src/payload-types.ts`; sem erro de TS. (`generate:types` lê o config, não o banco.)

- [ ] **Step 6: Biome + commit**

```bash
git add -A && git commit -m "feat(cms): collections Pages, Posts, Categories"
```

---

### Task 2: Globals — Header, Footer, Company, SiteSettings

**Files:**
- Create: `src/globals/Header.ts`, `src/globals/Footer.ts`, `src/globals/Company.ts`, `src/globals/SiteSettings.ts`
- Modify: `src/payload.config.ts` (registrar `globals`)

**Interfaces:**
- Consumes: nada.
- Produces: `Header` (`navItems` array {label, href}, `cta` {label, href}); `Footer` (`columns` array {title, links[]}, `bottomText`); `Company` (`addresses` array {city, uf, address, phone, registros}, `whatsapp`); `SiteSettings` (`defaultTitle`, `defaultDescription`, `ogImage` upload, `social` group).

- [ ] **Step 1: `src/globals/Header.ts`**

```typescript
import type { GlobalConfig } from 'payload'

export const Header: GlobalConfig = {
  slug: 'header',
  admin: { group: 'Layout' },
  access: { read: () => true },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true },
      ],
    },
    {
      name: 'cta',
      type: 'group',
      fields: [
        { name: 'label', type: 'text' },
        { name: 'href', type: 'text' },
      ],
    },
  ],
}
```

- [ ] **Step 2: `Footer.ts`, `Company.ts`, `SiteSettings.ts`** (mesmo padrão; campos conforme as Interfaces acima). `Company.addresses[]` = {city, uf, address, phone, creci, abadi, secovi}. `SiteSettings.social` = {instagram, linkedin, facebook}.

- [ ] **Step 3: Registrar no `payload.config.ts`** (`globals: [Header, Footer, Company, SiteSettings]`).

- [ ] **Step 4: Verificar (sem DB)**

Run: `pnpm exec tsc --noEmit && pnpm exec payload generate:types`
Expected: tipos `Header`, `Footer`, `Company`, `SiteSettings` gerados; sem erro.

- [ ] **Step 5: Biome + commit**

```bash
git add -A && git commit -m "feat(cms): globals Header, Footer, Company, SiteSettings"
```

---

### Task 3: `next/image` para a mídia do Supabase + wrapper `ImageMedia`

**Files:**
- Modify: `next.config.ts` (images.remotePatterns)
- Create: `src/components/Media/ImageMedia.tsx`

**Interfaces:**
- Consumes: docs da collection `Media` (têm `url`, `width`, `height`, `alt`).
- Produces: `<ImageMedia resource={mediaDoc} ...imgProps />` — renderiza `next/image` a partir de um doc Media, com `alt` e dimensões.

- [ ] **Step 1: Permitir o host do Supabase no `next.config.ts`**

Adicionar em `images`:

```typescript
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'qvxlkovrxfqigeaopvui.supabase.co', pathname: '/storage/v1/object/public/**' },
  ],
},
```

Manter o que já existir (ex.: `localPatterns` para `/api/media/file/**`).

- [ ] **Step 2: `src/components/Media/ImageMedia.tsx`**

```tsx
import Image from 'next/image'
import type { Media } from '@/payload-types'

type Props = {
  resource?: Media | string | null
  className?: string
  sizes?: string
  priority?: boolean
  fill?: boolean
}

export function ImageMedia({ resource, className, sizes, priority, fill }: Props) {
  if (!resource || typeof resource === 'string') return null
  const { url, alt, width, height } = resource
  if (!url) return null
  if (fill) return <Image src={url} alt={alt ?? ''} fill sizes={sizes} priority={priority} className={className} />
  return (
    <Image
      src={url}
      alt={alt ?? ''}
      width={width ?? 1200}
      height={height ?? 800}
      sizes={sizes}
      priority={priority}
      className={className}
    />
  )
}
```

- [ ] **Step 3: Verificar**

Run: `pnpm exec tsc --noEmit`
Expected: sem erro (o import `@/payload-types` resolve `Media`).

- [ ] **Step 4: Biome + commit**

```bash
git add -A && git commit -m "feat(media): next/image para o Storage do Supabase + wrapper ImageMedia"
```

---

### Task 4: Biblioteca fundacional de blocos (RichText, Hero, Stats, FeatureGrid, CTABand)

**Files:**
- Create: para cada bloco `src/blocks/<Nome>/config.ts` + `src/blocks/<Nome>/Component.tsx`
- Modify: `src/collections/Pages.ts` (preencher `layout.blocks` com os configs)

**Interfaces:**
- Consumes: primitivos do Plano 2 (`Container`, `Section`, `Button`, `Eyebrow`, `GradientText`), `ImageMedia`, motion (`Reveal`, `Stagger`, `Counter`, `SplitHeadline`).
- Produces: 5 blocos (config + component) e um union type de blocos no `Page['layout']`.

- [ ] **Step 1: RichText** — `config.ts` (`slug: 'richText'`, campo `content: richText`) + `Component.tsx` (renderiza o lexical via `RichText` do `@payloadcms/richtext-lexical/react` dentro de um `Container`).

- [ ] **Step 2: Hero** — `config.ts` (`slug: 'hero'`; campos: `eyebrow?`, `headline`, `subhead?`, `video?` upload, `poster?` upload→Media, `ctas` array {label, href, variant}) + `Component.tsx` (`<Section>` com `<video poster>` de fundo se `video`, `SplitHeadline` no headline, `Button`s nas ctas; fiel ao hero de `_reference/index.html`).

- [ ] **Step 3: Stats** — `config.ts` (`slug: 'stats'`; `items` array {value:number, suffix?, label}) + `Component.tsx` (grid com `<Counter value={item.value} />` + suffix + label; `Stagger`).

- [ ] **Step 4: FeatureGrid** — `config.ts` (`slug: 'featureGrid'`; `eyebrow?`, `title?`, `features` array {icon?, title, description}) + `Component.tsx` (grid de cards usando os tokens; `Reveal`).

- [ ] **Step 5: CTABand** — `config.ts` (`slug: 'ctaBand'`; `title`, `text?`, `cta` {label, href}) + `Component.tsx` (faixa com `--grad-band`, `Button`).

- [ ] **Step 6: Registrar os blocos em `Pages.layout`**

Importar os 5 configs e setar `blocks: [heroBlock, statsBlock, featureGridBlock, ctaBandBlock, richTextBlock]` no campo `layout` de `Pages.ts`.

- [ ] **Step 7: Verificar (sem DB)**

Run: `pnpm exec tsc --noEmit && pnpm exec payload generate:types && pnpm check`
Expected: tipos dos blocos aparecem no union de `Page['layout']`; TS e Biome limpos.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat(blocks): blocos fundacionais Hero, Stats, FeatureGrid, CTABand, RichText"
```

---

### Task 5: `RenderBlocks` + Header/Footer server + catch-all `[[...slug]]` + Payload helper

**Files:**
- Create: `src/blocks/RenderBlocks.tsx`, `src/lib/payload.ts`, `src/components/layout/HeaderServer.tsx`, `src/components/layout/FooterServer.tsx`, `src/app/(frontend)/[[...slug]]/page.tsx`
- Modify: `src/app/(frontend)/layout.tsx` (Header/Footer no shell)

**Interfaces:**
- Consumes: os blocos (Task 4), globals (Task 2), `getPayload` do Payload.
- Produces:
  - `getPayloadClient()` e `getPageBySlug(slug)` em `src/lib/payload.ts` (Local API).
  - `<RenderBlocks blocks={page.layout} />` — mapeia `blockType` → componente.
  - `HeaderServer`/`FooterServer` — server components que buscam os globals e renderizam o nav/rodapé (o comportamento sticky/scroll da nav é uma ilha client separada; aqui é a estrutura + links).
  - `[[...slug]]/page.tsx` — resolve slug (`/` → `home`), `notFound()` se não achar, renderiza `RenderBlocks`.

- [ ] **Step 1: `src/lib/payload.ts`**

```typescript
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Page } from '@/payload-types'

export async function getPayloadClient() {
  return getPayload({ config })
}

export async function getPageBySlug(slug: string): Promise<Page | null> {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
  })
  return res.docs[0] ?? null
}
```

- [ ] **Step 2: `src/blocks/RenderBlocks.tsx`** — mapa `blockType`→componente, itera `blocks` e renderiza; ignora tipos desconhecidos com um aviso em dev.

```tsx
import type { Page } from '@/payload-types'
import { HeroBlock } from './Hero/Component'
import { StatsBlock } from './Stats/Component'
import { FeatureGridBlock } from './FeatureGrid/Component'
import { CTABandBlock } from './CTABand/Component'
import { RichTextBlock } from './RichText/Component'

type Block = NonNullable<Page['layout']>[number]
// biome-ignore lint/suspicious/noExplicitAny: cada componente valida seu próprio bloco
const map: Record<string, (props: any) => React.ReactNode> = {
  hero: HeroBlock,
  stats: StatsBlock,
  featureGrid: FeatureGridBlock,
  ctaBand: CTABandBlock,
  richText: RichTextBlock,
}

export function RenderBlocks({ blocks }: { blocks?: Block[] | null }) {
  if (!blocks?.length) return null
  return (
    <>
      {blocks.map((block, i) => {
        const Comp = map[block.blockType]
        return Comp ? <Comp key={block.id ?? i} {...block} /> : null
      })}
    </>
  )
}
```

- [ ] **Step 3: `HeaderServer.tsx` / `FooterServer.tsx`** — buscam os globals (`payload.findGlobal({ slug: 'header' })` etc.) e renderizam nav/rodapé com os tokens/primitivos. O logo é o `_reference/assets/img/semog-logo-light.svg` (copiar para `public/`).

- [ ] **Step 4: `src/app/(frontend)/[[...slug]]/page.tsx`**

```tsx
import { notFound } from 'next/navigation'
import { getPageBySlug } from '@/lib/payload'
import { RenderBlocks } from '@/blocks/RenderBlocks'

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params
  const path = slug?.join('/') || 'home'
  const page = await getPageBySlug(path)
  if (!page) notFound()
  return <RenderBlocks blocks={page.layout} />
}
```

- [ ] **Step 5: Montar Header/Footer no layout do frontend**

Em `src/app/(frontend)/layout.tsx`, envolver `{children}` com `<HeaderServer />` acima e `<FooterServer />` abaixo (dentro do `<body>`, dentro do `LenisProvider`). Remover a antiga `(frontend)/page.tsx` do scaffold (o catch-all cobre `/`).

- [ ] **Step 6: Verificar**

Run: `pnpm exec tsc --noEmit && pnpm check`
Expected: TS e Biome limpos. **Verificação ao vivo (renderizar `/home` do CMS) precisa do `.env` + uma Page 'home' semeada — DEFERIDA** (ver Task 7). Sem DB, `pnpm build` da rota falha ao buscar a página; isso é esperado nesta etapa.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(render): RenderBlocks, Header/Footer server e catch-all [[...slug]]"
```

---

### Task 6: ISR — revalidation on-demand via hooks do Payload

**Files:**
- Create: `src/lib/revalidate.ts`
- Modify: `src/collections/Pages.ts`, `src/collections/Posts.ts` (hooks `afterChange`/`afterDelete`), `src/app/(frontend)/[[...slug]]/page.tsx` (`generateStaticParams` + `revalidate`)

**Interfaces:**
- Consumes: `revalidatePath` do `next/cache`.
- Produces: ao publicar/editar uma Page, o caminho correspondente é revalidado (ISR). `generateStaticParams` pré-gera as páginas publicadas.

- [ ] **Step 1: `src/lib/revalidate.ts`** — helper `revalidatePage(slug)` que chama `revalidatePath(slug === 'home' ? '/' : `/${slug}`)`.

- [ ] **Step 2: Hooks nas collections** — em `Pages`, `hooks.afterChange` e `afterDelete` chamando `revalidatePage(doc.slug)`. (Payload roda hooks server-side; `revalidatePath` é seguro no contexto do Next.)

- [ ] **Step 3: `generateStaticParams` + `revalidate` no catch-all** — exportar `revalidate = 3600` e um `generateStaticParams` que lista slugs publicados via Local API (com try/catch para não quebrar o build quando não há DB).

- [ ] **Step 4: Verificar**

Run: `pnpm exec tsc --noEmit && pnpm check`
Expected: limpos. Verificação ao vivo (editar no admin → ver a home atualizar) DEFERIDA (precisa de DB).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(isr): revalidation on-demand por hook do Payload + generateStaticParams"
```

---

### Task 7: Home montada a partir do CMS + verificação (precisa de DB)

**Files:**
- Create: `src/seed/home.ts` (função de seed idempotente que cria/atualiza a Page `home` com blocos aproximando `_reference/index.html`), `src/app/(payload)/api/seed/route.ts` (rota protegida para rodar o seed) OU um script `pnpm seed`.

**Interfaces:**
- Consumes: blocos da Task 4, collections.
- Produces: uma Page `home` publicada com Hero + Stats + FeatureGrid + CTABand refletindo a estrutura da home de referência.

- [ ] **Step 1: `src/seed/home.ts`** — cria (ou atualiza por slug) a Page `home`: Hero (headline/subhead/ctas do `_reference/index.html`), Stats (700 condomínios, 70 mil clientes, 35 anos…), FeatureGrid (pilares), CTABand (slogan "Preocupe-se apenas em morar"). Idempotente (upsert por slug).

- [ ] **Step 2: Script de seed** — adicionar `"seed": "cross-env NODE_OPTIONS=--no-deprecation payload run src/seed/home.ts"` (ou uma rota API protegida por `PAYLOAD_SECRET`).

- [ ] **Step 3: [DEFERIDO — precisa de `.env`] Rodar e verificar ao vivo**

Com o `.env` preenchido: `pnpm dev`, criar admin, `pnpm seed`, abrir `http://localhost:3000/` e conferir a home renderizada do CMS contra `_reference/index.html` (hero, stats contando, pilares, faixa de CTA). Editar um texto no admin e confirmar o ISR revalidando.
Expected: a home aparece montada pelos blocos do Payload, fiel à referência.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(cms): seed da home e verificação do pipeline CMS→render"
```

---

## Self-Review (cobertura vs. spec)

- **Collections Pages/Posts/Categories (drafts/versions)** → Task 1. ✅
- **Globals Header/Footer/Company/SiteSettings** → Task 2. ✅
- **next/image para Supabase** → Task 3. ✅
- **Biblioteca de blocos (fundacional) + registro em Pages** → Task 4. ✅
- **BlockRenderer + [[...slug]] + Header/Footer + Local API** → Task 5. ✅
- **ISR + revalidation por hook** → Task 6. ✅
- **Home montada do CMS + verificação (deferida p/ DB)** → Task 7. ✅

**Continuação (Plano 3b, mesmo padrão):** demais blocos (Serviço/Garante/Depoimentos/FAQ/Registros/City/BlogList), as outras 15 páginas, seed completo. **Plano 4:** formulários (Form Builder + RHF/Zod/Turnstile/SendGrid/React Email), Sentry, banner LGPD, páginas de erro, SEO (metadata/sitemap/robots/OG/301), security headers, CI, previews.
```
