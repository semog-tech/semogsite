# Remoção do Payload CMS — design

Data: 2026-07-24

## 1. Objetivo

Remover o Payload CMS do projeto. O dono do site nunca usa o `/admin` — todas as
edições são feitas por código — então o CMS é puro overhead: obriga a manter
config de bloco, tipos gerados, migrations e seeds, e foi a **causa raiz** dos
problemas recentes (banco compartilhado local↔produção degradando o site,
dívida de migração, seed mutando produção ao vivo, media sumindo entre seeds).

Removendo o Payload, o conteúdo passa a viver em código, as páginas viram
estáticas de verdade, e toda essa classe de problema desaparece.

**O que NÃO é objetivo:** mudar o visual do site (fica idêntico), remover o
Supabase (fica — para a tabela de leads e o storage de imagens), ou reescrever
os componentes de bloco.

## 2. Princípio central

Os 41 componentes de bloco (`src/blocks/*/Component.tsx`) são React puro que
recebem props e importam **apenas tipos** de `@/payload-types` — zero dependência
de runtime do Payload (verificado: nenhum bloco chama `getPayload`). Eles ficam
**intactos**. Só muda a origem dos dados: de "query no Postgres via Payload" para
"import de arquivo no repositório".

O Supabase **permanece**: uma tabela `leads` (acessada direto via `supabase-js`,
sem Payload) e o storage S3 das imagens (URLs mantidas, `next.config`
`remotePatterns` e CSP inalterados).

## 3. Superfície atual do Payload (levantada)

**Leitura de dados em runtime — só 9 arquivos:**
- `src/lib/payload.ts` — camada de dados (`getPageBySlug`, `getRecentPosts`,
  `getRelatedPosts`, `getPostBySlug`, `getSiteSettings`, `getPayloadClient`).
- `src/app/(frontend)/[[...slug]]/page.tsx` — catch-all das páginas.
- `src/app/(frontend)/sitemap.ts`.
- `src/app/(frontend)/_actions/submit-form.ts` — formulários.
- `src/app/api/cron/upload-ads-conversions/route.ts` — cron do Ads.
- `src/components/layout/{HeaderServer,FooterServer,WhatsAppFloat}.tsx` — globais.
- `src/app/my-route/route.ts` — boilerplate do template (será removido).

**Schema/CMS a remover:**
- Collections: `Pages`, `Posts`, `Categories`, `Media`, `Users`.
- Globals: `Company`, `Header`, `Footer`, `SiteSettings`.
- 41 `src/blocks/*/config.ts`.
- `src/payload.config.ts`, `src/migrations/*`, `src/seed/*`.
- `src/payload-types.ts` (gerado).
- Grupo de rotas `src/app/(payload)/` inteiro (`/admin`, `/api/graphql`,
  `/api/graphql-playground`, `/api/[...slug]` REST).
- Pacotes: `payload`, `@payloadcms/db-postgres`, `@payloadcms/next`,
  `@payloadcms/plugin-form-builder`, `@payloadcms/plugin-seo`,
  `@payloadcms/richtext-lexical`, `@payloadcms/storage-s3`, `@payloadcms/ui`.
- Scripts do `package.json`: `generate:importmap`, `generate:types`, `payload`,
  `seed*`, `migrate*`.
- `src/lib/revalidate.ts` (o ISR on-demand deixa de existir).

## 4. Modelo de conteúdo novo

### 4.1 Páginas → arquivos de dados TypeScript

Cada página vira um objeto tipado com um array `layout` de blocos, no mesmo
formato de prop que os componentes já consomem. Diretório `content/pages/`.

```ts
// content/pages/home.ts
import type { PageData } from '@/types/content'
export const home: PageData = {
  slug: 'home',
  meta: { title: '…', description: '…' },
  layout: [
    { blockType: 'hero', headline: '…', proofItems: [ … ], ctas: [ … ] },
    { blockType: 'stats', variant: 'band', items: [ … ] },
    // …
  ],
}
```

Um índice `content/pages/index.ts` reúne todas as páginas num `Record<slug,
PageData>`. Páginas cobertas: `home`, `semog`, `solucoes`,
`administracao-de-condominios`, `garante`, `incorporadoras`, `blog`, `contato`,
`proposta`, `privacidade`, `termos`. (As 4 landings de cidade
`administradora-de-condominios-*` já são rotas explícitas com `CityLanding.tsx`
e `src/data/cityLandings.ts` — não passam pelo catch-all e não mudam.)

O conteúdo vem da migração dos seeds atuais (`src/seed/pages.ts`,
`src/seed/home.ts`), que já são objetos TS — a conversão é mecânica.

### 4.2 Blog e páginas legais → MDX

Os 11 posts e as 2 páginas legais (`privacidade`, `termos`, hoje blocos
`richText` com Lexical) viram arquivos `.mdx` em `content/blog/` e
`content/legal/`, com frontmatter:

```mdx
---
title: Inadimplência no condomínio: o que a lei permite…
slug: inadimplencia-condominio
date: 2026-07-20
category: Finanças
excerpt: …
heroImage: https://…supabase.co/storage/…/inadimplencia.webp
---

Texto do artigo em markdown.
```

Setup MDX via `next-mdx-remote` (renderiza MDX de arquivos lidos em build, sem
precisar de rota por arquivo) ou `@next/mdx`. A escolha entre os dois fica para
o plano de implementação; ambos servem. As categorias do blog (6) viram uma
constante `content/blog/categories.ts`.

**Conversão do Lexical:** os posts atuais estão em Lexical JSON no banco. Um
script único lê cada post via `supabase-js` (enquanto o Payload ainda existe,
na fase 2) e serializa o Lexical para markdown. É a parte mais artesanal —
exige conferência de fidelidade (negrito, listas, links, imagens) post a post.

### 4.3 Globais → constantes

`Company`, `Header`, `Footer`, `SiteSettings` viram um único
`content/site.ts` com objetos tipados (nav, CTA, área do cliente, colunas do
rodapé, endereços/CRECI/WhatsApp, títulos/OG padrão, redes sociais). Origem: o
seed atual `src/seed/globals.ts`.

### 4.4 Tipos → arquivo escrito à mão

`src/payload-types.ts` (gerado) é substituído por `src/types/blocks.ts` +
`src/types/content.ts`, escritos à mão, definindo cada `*Block` e o `PageData`.
Os componentes de bloco trocam `from '@/payload-types'` por `from
'@/types/blocks'` — a única mudança nos 41 blocos, e é só o caminho do import.

Cada tipo de bloco pode co-localizar seu tipo no próprio diretório do bloco
(`src/blocks/Hero/types.ts`) e `src/types/blocks.ts` reexporta — decisão de
organização a detalhar no plano.

## 5. Formulários e leads

### 5.1 Tabela `leads` no Supabase

Nova tabela mínima, acessada via `supabase-js` (não Payload). Schema o
suficiente para o cron do Ads e para eventual integração com o Exact:

```sql
create table leads (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  form        text not null,          -- 'proposta' | 'contato'
  data        jsonb not null,         -- campos do formulário
  gclid       text,                   -- extraído p/ o cron do Ads
  email       text,
  uploaded_to_ads boolean not null default false
);
create index leads_created_at_idx on leads (created_at);
```

`gclid` e `email` saem como colunas próprias (não só dentro do `data` JSON)
porque o cron filtra por eles — evita varrer JSON. `uploaded_to_ads` permite o
cron marcar o que já subiu, em vez de reprocessar por janela de tempo (melhoria
sobre o `createdAt > cutoff` atual, opcional).

**Histórico existente:** os leads atuais estão em `form-submissions` (schema
Payload). Um script de migração único copia os registros para a tabela `leads`,
preservando `created_at`, `gclid` e `email`. Assumido: **manter o histórico**.

### 5.2 `submit-form.ts`

A validação Zod já existe (`src/lib/form-schemas.ts`) e fica. Troca-se:
- A busca do form (hoje `payload.find({ collection: 'forms' })`) por definições
  estáticas de formulário em código (os formulários são 2: `proposta`, `contato`).
- O `payload.create({ collection: 'form-submissions' })` por um `insert` via
  `supabase-js` na tabela `leads`, extraindo `gclid`/`email` para as colunas.
- O envio de e-mail (SendGrid) fica inalterado.

### 5.3 Cron do Ads

`upload-ads-conversions/route.ts` troca `payload.find` por um `select` via
`supabase-js` na tabela `leads` (registros com `gclid` na janela / não enviados).
O resto (Google Data Manager API, service account) fica inalterado.

## 6. Camada de dados nova

`src/lib/payload.ts` → `src/lib/content.ts`, **mesmas assinaturas** para não
tocar nos consumidores:
- `getPageBySlug(slug): PageData | null` — lê de `content/pages`.
- `getRecentPosts(limit, excludeSlug?)` / `getRelatedPosts(category, excludeSlug, limit)`
  / `getPostBySlug(slug)` — leem os MDX de `content/blog`.
- `getSiteSettings()` — retorna as constantes de `content/site.ts`.
- `getPayloadClient` — removido.

O catch-all `[[...slug]]/page.tsx` perde `export const revalidate = 3600`, ganha
`generateStaticParams` sobre as chaves de `content/pages`, e fica **totalmente
estático**. Sem CMS não há edição em runtime — conteúdo muda por deploy.

## 7. Estratégia de execução (o site nunca sai do ar)

Numa branch, incremental, cada fase testável e reversível:

- **Fase 1 — tipos + páginas.** Escreve `src/types/blocks.ts`/`content.ts`,
  migra os seeds de página para `content/pages/*.ts`, cria `src/lib/content.ts`
  lendo deles, e aponta o catch-all para a camada nova. Payload **ainda
  instalado** (fallback). Ao fim, as páginas renderizam do código.
- **Fase 2 — globais + blog + legais.** Migra globais para `content/site.ts`,
  converte os 11 posts e 2 legais de Lexical para MDX (com o script que lê via
  Payload antes de removê-lo), aponta header/footer/blog para as fontes novas.
- **Fase 3 — forms + leads + cron.** Cria a tabela `leads`, migra o histórico,
  reescreve `submit-form.ts` e o cron para `supabase-js`.
- **Fase 4 — arrancar o Payload.** Remove o grupo `(payload)`, as collections,
  globals, config de bloco, `payload.config.ts`, migrations, seeds,
  `payload-types.ts`, os pacotes e os scripts. Ajusta `next.config` (o Payload
  embrulha a config hoje via `withPayload`). Confirma build limpo.

Cada fase é um conjunto de commits com testes. Se algo der errado numa fase, as
anteriores continuam de pé.

## 8. O que fica igual

- Todos os 41 componentes de bloco (só o caminho do import de tipo muda).
- O visual do site inteiro.
- As 4 landings de cidade (rotas explícitas, já fora do CMS).
- Supabase: storage de imagens (URLs, `remotePatterns`, CSP) e a instância
  Postgres (agora só a tabela `leads`).
- O proxy do VPS e a allow-list (a tabela `leads` ainda é Postgres remoto).
- SendGrid, Turnstile, Sentry, analytics, o cron do Ads (só a fonte de dados
  muda).
- Os schemas Zod dos formulários (`src/lib/form-schemas.ts`).

## 9. Riscos

- **Conversão Lexical → MDX** dos 11 posts: a parte mais artesanal; exige
  conferência de fidelidade por post. Mitigação: script de conversão + revisão
  visual post a post antes de remover o Payload (fase 2, com o Payload ainda
  presente para comparar).
- **Perda do `/admin`:** não haverá painel para edição sem código. O dono
  confirmou que edita tudo por código — aceito e registrado. Se um dia precisar
  de edição não-técnica, será outra decisão (headless leve, ou um Git-based CMS
  como Decap/TinaCMS sobre os mesmos arquivos).
- **Migração dos dados de leads:** o histórico em `form-submissions` precisa ser
  copiado antes de remover o Payload. Se a cópia falhar, o histórico se perde —
  fazer com dump de segurança antes.
- **`withPayload` no `next.config`:** o Payload embrulha a config do Next; ao
  remover, o `next.config.ts` precisa ser desembrulhado com cuidado para não
  perder headers/CSP/redirects já configurados lá.
- **Rotas `/api` que sumem:** qualquer integração externa que chame
  `/api/graphql` ou o REST do Payload quebra. Levantar se há algo apontando para
  elas antes de remover (provavelmente não — o site é institucional).

## 10. Fora de escopo (follow-ups)

- Construir a página `/aplicativo` (plano 03) — nasce **depois** desta remoção,
  já no modelo estático. Os links do app hoje apontam para `/solucoes#aplicativo`
  (constante `APP_HREF` em `content/pages/home`), a trocar quando a página existir.
- Integração lead → Exact (CRM) — a tabela `leads` deixa o terreno pronto, mas a
  integração é outro trabalho.
- Regenerar/abandonar a migração Postgres do Payload — resolvida por tabela rasa:
  a `leads` é criada por um único SQL versionado, sem a máquina de migrations.
