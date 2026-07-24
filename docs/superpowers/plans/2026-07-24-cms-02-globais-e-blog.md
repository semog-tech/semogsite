# Remoção do Payload — Fase 2: Globais e Blog — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tirar os globais (header/footer/company) e o blog+legais da dependência do Payload — globais viram constantes em `content/site.ts`, os 11 posts e as 2 páginas legais viram MDX — mantendo o visual idêntico e o Payload ainda instalado.

**Architecture:** Os server components de layout leem de `content/site.ts` em vez de `findGlobal`. O blog passa a ler arquivos `.mdx` de `content/blog/` via `next-mdx-remote/rsc` (render no server component, sem rota por arquivo). Um script único converte o Lexical dos posts atuais para markdown enquanto o Payload ainda existe.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.7, `next-mdx-remote`, `gray-matter`, Vitest 4, Playwright 1.58, pnpm 10.

## Dependência

Requer a **Fase 1 concluída** (`content/site.ts` mínimo, `src/lib/content.ts`, tipos em `src/types/`). Esta fase amplia `content/site.ts` e substitui as funções de post que a Fase 1 ainda reexportava do Payload.

## Global Constraints

- **pnpm** only. Antes de cada commit: `pnpm exec tsc --noEmit` e `pnpm exec biome lint ./src ./tests content` limpos (não usar `pnpm check`).
- Windows `core.autocrlf=true`: `biome ci` acusa fim de linha em arquivos não tocados — ignorar; `git add` só o que editou.
- Comentários em **português**, explicando o porquê.
- **Nenhuma mudança visual.** O blog e o rodapé precisam renderizar idênticos.
- Payload **continua instalado** ao fim desta fase (removido só na Fase 4). O script de conversão do Lexical USA o Payload para ler os posts — rode-o antes da Fase 4.
- Dev server já roda em `:3000` contra prod via proxy; não reiniciar.

## Referência

Spec: `docs/superpowers/specs/2026-07-24-remocao-do-payload-cms-design.md` (seções 4.2, 4.3, 6).

Fatos levantados:
- `HeaderServer.tsx` faz `findGlobal({ slug: 'header' })` e já tem `FALLBACK_NAV_ITEMS`; passa `navItems`/`cta`/`clientArea` para `Nav`.
- `FooterServer.tsx` faz `findGlobal({ slug: 'footer' })`, tem `FALLBACK_FOOT_CTA`/`FALLBACK_COLUMNS`/`FALLBACK_LEGAL`; passa dados para `FooterView`.
- `WhatsAppFloat.tsx` faz `findGlobal({ slug: 'company' })` e lê `company.whatsapp` (fallback embutido).
- `blog/[slug]/page.tsx` usa `RichText` de `@payloadcms/richtext-lexical/react` para renderizar `post.content` (Lexical). Lê `post.title/slug/heroImage/excerpt/content/category/publishedAt`.
- `BlogList`/`BlogFeatured` leem `post.title/slug/heroImage/excerpt/category/publishedAt`.

---

### Task 1: Globais para `content/site.ts`

Ampliar `content/site.ts` com header, footer e company, e apontar os três server components para lá.

**Files:**
- Modify: `content/site.ts`
- Modify: `src/components/layout/HeaderServer.tsx`, `FooterServer.tsx`, `WhatsAppFloat.tsx`
- Test: `tests/int/content-site.int.spec.ts`, `tests/e2e/layout-globais.e2e.spec.ts`

**Interfaces:**
- Consumes: nada novo.
- Produces: `site.header`, `site.footer`, `site.company` em `content/site.ts`.

- [ ] **Step 1: Escrever o teste que falha**

Create `tests/int/content-site.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { site } from '@/../content/site'

describe('content/site — globais', () => {
  it('header tem navItems, cta e área do cliente', () => {
    expect(site.header.navItems.length).toBeGreaterZero?.() ?? expect(site.header.navItems.length).toBeGreaterThan(0)
    expect(site.header.cta.href).toBeTruthy()
  })
  it('footer tem colunas e links legais', () => {
    expect(site.footer.columns.length).toBeGreaterThan(0)
    expect(site.footer.legalLinks.length).toBeGreaterThan(0)
  })
  it('company tem whatsapp', () => {
    expect(site.company.whatsapp).toMatch(/^\d+$/)
  })
})
```

(Remova o `toBeGreaterZero?.()` — use só `toBeGreaterThan(0)`; ajuste no Step 4.)

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/content-site.int.spec.ts`
Expected: FAIL — `site.header` não existe.

- [ ] **Step 3: Ampliar `content/site.ts`**

Porte de `src/seed/globals.ts` os dados dos globais `header`, `footer`, `company`. Defina interfaces (`HeaderConfig`, `FooterConfig`, `CompanyConfig`) e os valores exatos do seed. **Fonte da verdade:** `src/seed/globals.ts` (reflete produção). Inclua tudo que os server components leem: `navItems[]`, `cta`, `clientArea`, `footCta`, `slogan`/`sloganEm`, `columns[]`, `legalLinks[]`, `addresses[]`, `whatsapp`, CRECI/ABADI/SECOVI se o footer os mostra.

- [ ] **Step 4: Corrigir e finalizar o teste, apontar os componentes**

Ajuste o teste (remova o `toBeGreaterZero`). Depois:
- `HeaderServer.tsx`: remova `getPayloadClient`/`findGlobal`; leia `site.header`. Mantenha os fallbacks só se quiser, mas agora a fonte é `content/site`. `import { site } from '@/../content/site'`.
- `FooterServer.tsx`: idem com `site.footer`.
- `WhatsAppFloat.tsx`: idem com `site.company.whatsapp`.

Nenhum dos três deve mais importar de `@/lib/payload` nem `@/payload-types`.

- [ ] **Step 5: Rodar os testes**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/content-site.int.spec.ts && pnpm exec tsc --noEmit`
Expected: PASS + tsc limpo.

- [ ] **Step 6: E2e de regressão dos globais**

Create `tests/e2e/layout-globais.e2e.spec.ts`: confirma que o header tem os links esperados, o rodapé tem as colunas, e o botão de WhatsApp aponta para `https://wa.me/551130034506`. Compare com produção se necessário.

Run: `pnpm exec playwright test tests/e2e/layout-globais.e2e.spec.ts --config=playwright.config.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add content/site.ts src/components/layout tests/
git commit -m "feat(content): header/footer/company vêm de content/site (fora do CMS)"
```

---

### Task 2: Setup MDX e conversão dos posts

Instalar o pipeline MDX e converter os 11 posts + 2 legais de Lexical para `.mdx`.

**Files:**
- Modify: `package.json` (deps `next-mdx-remote`, `gray-matter`)
- Create: `scripts/lexical-to-mdx.mjs` (conversão única)
- Create: `content/blog/*.mdx` (11), `content/legal/privacidade.mdx`, `content/legal/termos.mdx`, `content/blog/categories.ts`
- Test: `tests/int/content-blog.int.spec.ts`

**Interfaces:**
- Consumes: os posts atuais (via Payload, para conversão).
- Produces: os arquivos MDX + `content/blog/categories.ts`.

- [ ] **Step 1: Instalar as dependências**

Run: `pnpm add next-mdx-remote gray-matter`
Expected: adicionadas ao `package.json`.

- [ ] **Step 2: Escrever o script de conversão**

Create `scripts/lexical-to-mdx.mjs`: lê cada post publicado via Payload (`payload run`), extrai `title/slug/excerpt/category/publishedAt/heroImage/content`, serializa o Lexical `content.root` para markdown (percorre os nós: headings, parágrafos, listas, negrito/itálico, links, imagens), e escreve `content/blog/<slug>.mdx` com frontmatter. Faça o mesmo para as 2 páginas legais (blocos `richText` das páginas `privacidade`/`termos` no seed).

A serialização do Lexical é a parte artesanal: cubra os tipos de nó que os posts realmente usam (levante com um dump de um post). Onde a conversão não for óbvia, deixe um marcador `<!-- REVISAR -->` no MDX e liste no relatório.

- [ ] **Step 3: Rodar a conversão**

Run: `pnpm exec cross-env NODE_OPTIONS=--no-deprecation payload run scripts/lexical-to-mdx.mjs`
Expected: 11 `.mdx` em `content/blog/` + 2 em `content/legal/`. Reporte quantos ficaram com `<!-- REVISAR -->`.

- [ ] **Step 4: Conferência de fidelidade post a post**

Para cada post, compare o markdown gerado com o texto renderizado em produção (`https://www.semog.com.br/blog/<slug>`). Corrija manualmente formatação perdida (negrito, listas, links, imagens). **Esta é a etapa que não pode ser pulada** — o conteúdo é editorial e precisa bater. Registre no relatório os posts revisados manualmente.

- [ ] **Step 5: Criar as categorias**

Create `content/blog/categories.ts` com as 6 categorias (de `src/seed/posts.ts`): slug, título. `export const categories`.

- [ ] **Step 6: Escrever o teste**

Create `tests/int/content-blog.int.spec.ts`: lê os arquivos de `content/blog`, confirma que há 11, que cada um tem frontmatter com `title/slug/date/category`, que nenhum ainda tem `<!-- REVISAR -->`, e que os slugs são únicos.

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/content-blog.int.spec.ts`
Expected: PASS. (Se algum `<!-- REVISAR -->` restou, a Task 4 não terminou — volte.)

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml scripts/lexical-to-mdx.mjs content/blog content/legal tests/int/content-blog.int.spec.ts
git commit -m "feat(blog): posts e legais convertidos de Lexical para MDX"
```

---

### Task 3: Camada de dados de posts lê MDX; blog e legais renderizam MDX

Substituir `getRecentPosts`/`getRelatedPosts`/`getPostBySlug` (hoje reexportadas do Payload) por leitura dos MDX, e trocar o render do blog e das legais de `RichText` (Lexical) para MDX.

**Files:**
- Modify: `src/lib/content.ts` (as 3 funções de post)
- Create: `src/lib/blog.ts` (parse dos MDX)
- Modify: `src/app/(frontend)/blog/[slug]/page.tsx`, `src/blocks/BlogList/Component.tsx`, `src/blocks/BlogFeatured/Component.tsx`, e a renderização das legais (`src/blocks/RichText/Component.tsx` ou onde as legais renderizam)
- Test: `tests/int/blog-layer.int.spec.ts`, `tests/e2e/blog.e2e.spec.ts`

**Interfaces:**
- Consumes: os MDX (Task 2).
- Produces: `getRecentPosts(limit, excludeSlug?)`, `getRelatedPosts(category, excludeSlug, limit)`, `getPostBySlug(slug)` retornando um `PostData` (`{ slug, title, excerpt, category, date, heroImage, body }`), e um componente que renderiza o `body` MDX.

- [ ] **Step 1: Escrever o teste que falha**

Create `tests/int/blog-layer.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getPostBySlug, getRecentPosts, getRelatedPosts } from '@/lib/content'

describe('camada de posts (MDX)', () => {
  it('lista os posts recentes ordenados por data desc', async () => {
    const posts = await getRecentPosts(6)
    expect(posts.length).toBeGreaterThan(0)
    for (let i = 1; i < posts.length; i++) {
      expect(new Date(posts[i - 1].date) >= new Date(posts[i].date)).toBe(true)
    }
  })
  it('resolve um post pelo slug com corpo', async () => {
    const recent = await getRecentPosts(1)
    const post = await getPostBySlug(recent[0].slug)
    expect(post?.title).toBeTruthy()
    expect(post?.body).toBeTruthy()
  })
  it('related prioriza a mesma categoria e nunca inclui o próprio', async () => {
    const [seed] = await getRecentPosts(1)
    const rel = await getRelatedPosts(seed.category, seed.slug, 3)
    expect(rel.every((p) => p.slug !== seed.slug)).toBe(true)
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/blog-layer.int.spec.ts`
Expected: FAIL — as funções ainda vêm do Payload e o shape (`date`, `body`) não bate.

- [ ] **Step 3: Escrever `src/lib/blog.ts`**

Lê todos os `.mdx` de `content/blog` com `gray-matter` (frontmatter + corpo), devolve `PostData[]`. Funções puras de listagem/ordenação/filtro por categoria. Sem I/O de banco.

- [ ] **Step 4: Reescrever as 3 funções em `content.ts`**

Remova o reexport de `./payload` e implemente `getRecentPosts`/`getRelatedPosts`/`getPostBySlug` sobre `src/lib/blog.ts`. A lógica de `getRelatedPosts` (mesma categoria com fallback a recentes, sem duplicar, excluindo o próprio) replica a de `payload.ts` — porte-a. **Atenção:** a assinatura muda de `excludeId: number` para `excludeSlug: string` (não há mais id numérico) — ajuste os chamadores no Step 5.

- [ ] **Step 5: Trocar o render para MDX**

- `blog/[slug]/page.tsx`: troque `import { RichText } from '@payloadcms/richtext-lexical/react'` e `<RichText data={post.content} />` por render do `post.body` MDX via `next-mdx-remote/rsc` (`<MDXRemote source={post.body} components={...} />`). Ajuste os acessos: `post.category` agora é string (slug/título), `post.heroImage` é `{url, alt}`, `post.date` no lugar de `publishedAt`, `excludeSlug` no lugar de `excludeId`.
- `BlogList`/`BlogFeatured`: ajuste os mesmos acessos ao novo `PostData`.
- Páginas legais (`privacidade`/`termos`): renderizam o MDX de `content/legal/*.mdx` — ajuste onde essas páginas montam o corpo (hoje via bloco `richText`). Podem virar rotas próprias que leem o MDX, ou o bloco `richText` no data file da página aponta para o arquivo MDX. Escolha a mais simples e registre.

- [ ] **Step 6: Rodar os testes**

Run: `pnpm exec vitest run --config ./vitest.config.mts && pnpm exec tsc --noEmit`
Expected: PASS + limpo.

- [ ] **Step 7: E2e do blog**

Create `tests/e2e/blog.e2e.spec.ts`: `/blog` lista posts, um `/blog/<slug>` renderiza título + corpo + relacionados, `/privacidade` e `/termos` renderizam o texto legal. Compare a contagem de posts e um trecho de corpo com produção.

Run: `pnpm exec playwright test tests/e2e/blog.e2e.spec.ts --config=playwright.config.ts`
Expected: PASS.

- [ ] **Step 8: Confirmar que nada de blog usa mais o Payload**

Run: `grep -rln "payloadcms/richtext\|@/lib/payload\|@/payload-types" src/app/\(frontend\)/blog src/blocks/BlogList src/blocks/BlogFeatured src/blocks/RichText || echo "blog desacoplado do Payload"`
Expected: `blog desacoplado do Payload`.

- [ ] **Step 9: Commit**

```bash
git add src/lib/content.ts src/lib/blog.ts "src/app/(frontend)/blog" src/blocks tests/
git commit -m "feat(blog): posts e legais renderizam de MDX, sem Payload"
```

---

## Verificação final da Fase 2

- [ ] `tsc --noEmit` e `biome lint` limpos
- [ ] vitest e playwright todos passam
- [ ] Header, footer e WhatsApp vêm de `content/site.ts` (nenhum importa Payload)
- [ ] Blog e legais renderizam de MDX; contagem e conteúdo batem com produção
- [ ] `src/lib/content.ts` não reexporta mais nada de `./payload`
- [ ] Payload ainda instalado (removido na Fase 4)

## Próximas fases

- **Fase 3:** tabela `leads` no Supabase; `submit-form.ts` e o cron do Ads via supabase-js; migrar histórico de `form-submissions`.
- **Fase 4:** arrancar o Payload por completo.
