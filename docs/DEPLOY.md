# Guia de deploy — Vercel

Site institucional Semog: **Next.js 16 + Payload 3**, Postgres/Storage no **Supabase**. Este guia
cobre o deploy em produção e os preview deployments na Vercel.

## 1. Importar o repositório

1. [vercel.com/new](https://vercel.com/new) → importar o repositório GitHub do projeto.
2. **Framework Preset:** Next.js (detectado automaticamente).
3. **Build Command:** `pnpm build`.
4. **Install Command:** `pnpm install` (a Vercel já usa pnpm pelo `packageManager` do
   `package.json` — `pnpm@10.12.4` — via Corepack).
5. **Output Directory:** padrão do preset Next.js (não precisa configurar).
6. **Node.js Version:** **20.x** (Project Settings → General → Node.js Version). O repo fixa
   `engines.node >= 20.9.0` e `.nvmrc` = `20`.
7. **Root Directory:** raiz do repo (`semogsite/`), a menos que o repositório importado seja um
   monorepo com este site em subpasta — nesse caso, aponte a Root Directory para cá.

## 2. Variáveis de ambiente

Configure em **Project Settings → Environment Variables**. A tabela abaixo lista **todas** as
variáveis que o código lê (`process.env.*`), agrupadas por área — a mesma fonte da verdade que
`.env.example`.

Marque o escopo de cada uma em **Production**, **Preview** e/ou **Development** conforme a
coluna "Environments". Em geral: variáveis não-sensíveis (`NEXT_PUBLIC_*`, chaves de teste) podem
ir em todos os ambientes; segredos de produção (Sentry `SENTRY_AUTH_TOKEN` real, Turnstile
"real" keys, `SENDGRID_API_KEY` de produção) devem ficar restritos a **Production** — use as
variantes de teste/staging nos Previews quando existirem.

### Supabase Postgres (obrigatório)

| Variável | Obrigatório | Client-exposed | Descrição |
|---|---|---|---|
| `DATABASE_URI` | Sim | Não | Conexão de runtime — string do **Session pooler** (porta `5432`, `aws-0-<region>.pooler.supabase.com`), usuário `cms_user` (role dedicada, least-privilege, restrita ao schema `cms` — não usar o `postgres` superuser aqui). Suporta *prepared statements*, exigido pelo adapter Postgres do Payload (Drizzle). |
| `DATABASE_URI_DIRECT` | Sim | Não | Conexão **Direct** (`db.<project-ref>.supabase.co:5432`), usada **apenas** para rodar migrations (`pnpm migrate`), nunca pela aplicação em runtime. |

**O Transaction pooler (porta `6543`) é proibido** em ambas — não suporta prepared statements e
quebra o adapter Postgres do Payload.

### Payload (obrigatório)

| Variável | Obrigatório | Client-exposed | Descrição |
|---|---|---|---|
| `PAYLOAD_SECRET` | Sim | Não | Segredo usado pelo Payload para assinar sessões/tokens. Gere com `openssl rand -base64 32`. Um valor **por ambiente** (não reuse entre preview e produção). |

### Storage S3 — Supabase Storage (obrigatório)

| Variável | Obrigatório | Client-exposed | Descrição |
|---|---|---|---|
| `S3_BUCKET` | Sim | Não | Nome do bucket dedicado a uploads (`media`). |
| `S3_REGION` | Sim | Não | Região do projeto Supabase (`us-east-2`). |
| `S3_ENDPOINT` | Sim | Não | Endpoint S3-compatible do Supabase Storage (`https://<ref>.supabase.co/storage/v1/s3`). |
| `S3_ACCESS_KEY_ID` | Sim | Não | Gerada em Storage → S3 Access Keys, no dashboard do Supabase. |
| `S3_SECRET_ACCESS_KEY` | Sim | Não | Idem — trate como segredo (chave vale para o projeto Supabase inteiro). |
| `SUPABASE_STORAGE_PUBLIC_URL` | Sim | Não | Base da URL pública usada por `payload.config.ts` para montar a URL de cada arquivo (`generateFileURL`). |

### SEO (opcional)

| Variável | Obrigatório | Client-exposed | Descrição |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Opcional | **Sim** | Base para URLs absolutas (canonical/OpenGraph/JSON-LD/sitemap) em `src/lib/seo.ts`. Sem ela, cai no fallback embutido `https://www.semog.com.br`. Defina explicitamente em produção; em previews pode ficar vazia (usa o fallback) ou apontar para a própria URL do preview se quiser canonical corretas por ambiente. |

### E-mail transacional — SendGrid (opcional)

| Variável | Obrigatório | Client-exposed | Descrição |
|---|---|---|---|
| `SENDGRID_API_KEY` | Opcional | Não | Chave da API (app.sendgrid.com → Settings → API Keys). Sem ela, `src/lib/sendgrid.ts` faz um no-op logado — os formulários continuam salvando normalmente, só não sai e-mail. |
| `SENDGRID_FROM` | Opcional | Não | Remetente verificado no SendGrid (Sender Authentication), ex. `no-reply@semog.com.br`. |
| `CONTACT_TO` | Opcional | Não | Caixa de entrada que recebe a notificação interna de cada lead (`submit-form.ts`). |

As 3 são opcionais como grupo — ou preenche todas, ou nenhuma (deixar `SENDGRID_API_KEY` vazia já
desativa o envio real). Recomendado para produção; pode ficar vazio em previews.

### Cloudflare Turnstile (obrigatório — usar chaves de teste se não houver chaves reais)

| Variável | Obrigatório | Client-exposed | Descrição |
|---|---|---|---|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Sim | **Sim** | Site key do widget (`src/components/forms/Turnstile.tsx`). |
| `TURNSTILE_SECRET_KEY` | Sim | Não | Usada só no server (`src/lib/turnstile.ts` → `verifyTurnstile`) para validar contra a API `siteverify` da Cloudflare. Sem ela, a verificação falha fechado (`false`), bloqueando o envio do formulário. |

Em **dev/preview**, use as chaves de teste oficiais da Cloudflare (sempre passam, não fazem
checagem real — já estão em `.env.example`). Em **produção**, crie um site em
dash.cloudflare.com → Turnstile → Add site e use as chaves reais geradas lá.

### Sentry (opcional)

| Variável | Obrigatório | Client-exposed | Descrição |
|---|---|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | Opcional | **Sim** | DSN do projeto Sentry (client/server/edge). Sem ela, `Sentry.init` roda com `enabled: false` — no-op completo, nunca quebra o build/runtime. |
| `SENTRY_AUTH_TOKEN` | Opcional | Não | Usada só em build (`withSentryConfig`, `next.config.ts`) para subir source maps. Sem ela, o upload é pulado silenciosamente (`silent: true`). |

**Nota de build:** o pacote `@sentry/nextjs` traz `@sentry/cli`, que tem um build script nativo.
O pnpm v10 ignora build scripts de dependências não listadas em `pnpm.onlyBuiltDependencies`
(`package.json`) por padrão — hoje só `sharp`, `esbuild` e `unrs-resolver` estão lá. Isso não
quebra o build (`@sentry/cli` funciona sem o binário nativo compilado, só perde otimizações), mas
se algum dia o upload de source maps via `SENTRY_AUTH_TOKEN` precisar do binário nativo, rode
`pnpm approve-builds` localmente e adicione `@sentry/cli` a `onlyBuiltDependencies` antes do
deploy — a Vercel usa o mesmo lockfile/config, então o comportamento é idêntico ao CI.

## 3. Migrations — estado atual e pendência

**Realidade atual:** em dev, o schema do Payload é sincronizado automaticamente
(`push: process.env.NODE_ENV !== 'production'` em `src/payload.config.ts`) — ou seja, todo o
desenvolvimento até agora usou `push` direto no schema `cms` do Supabase, **não** migrations
versionadas. A migration commitada em `src/migrations/20260712_220559_init.ts` captura um
snapshot antigo do schema (12/07) e **está desatualizada** em relação ao schema atual (não inclui
tabelas adicionadas depois, como as do `form-builder` plugin, campos do SEO plugin, etc.).

**Para este primeiro deploy:** o banco de produção é o **mesmo projeto/schema Supabase (`cms`)**
já usado em dev — já está em sincronia com o código via `push`, então **não é necessário rodar a
migration `init`** para este deploy. Configurar `NODE_ENV=production` na Vercel desliga o `push`
automaticamente (comportamento do Payload/Next), então o app sobe apontando para um schema que já
bate com o código.

**Pendência (antes de tratar migrations como fonte da verdade, ou de provisionar um banco
novo/limpo):** regenerar uma migration `init` limpa e completa a partir do schema atual —

```bash
DATABASE_URI="$DATABASE_URI_DIRECT" pnpm migrate:create init
```

— descartando o arquivo antigo (`20260712_220559_init.ts`) antes de rodar o comando, e validar
com `pnpm migrate:status` contra um banco vazio. Só depois disso o pipeline `pnpm migrate` deve
ser considerado confiável para provisionar um Supabase novo do zero ou para rodar em CI/CD como
step de deploy. Até lá, qualquer mudança de schema em produção é feita manualmente/via `push`
controlado, com cuidado.

Migrations DDL devem sempre rodar pela **conexão direta** (`DATABASE_URI_DIRECT`), nunca pelo
pooler — veja `docs/DEV.md` para os comandos.

## 4. Preview deployments

- Todo branch/PR aberto no repositório gera automaticamente um **preview deployment** na Vercel
  (URL única por deploy).
- Os previews usam o **mesmo projeto Supabase** (mesmo schema `cms`, mesmo bucket `media`) que
  produção — não há banco/projeto isolado por preview. Tenha cuidado ao testar fluxos que
  escrevem dados (formulários, admin do Payload) em previews: eles gravam nos mesmos dados de
  produção.
- O **draft/live preview do Payload** (rotas de preview do CMS, versionamento de páginas/posts)
  funciona normalmente nos previews, já que aponta para o mesmo Postgres.
- Variáveis de ambiente marcadas para o environment **Preview** no Project Settings se aplicam a
  todos os previews. Se algum dia for necessário isolar dados de preview, provisionar um schema
  Supabase separado (`cms_preview` ou similar) e usar Vercel's per-branch env vars — não é o
  caso hoje.
- `PAYLOAD_SECRET` pode ser o mesmo valor entre previews e produção (não há problema de segurança
  em compartilhar, já que ambos os ambientes acessam o mesmo banco), mas prefira valores distintos
  se quiser invalidar sessões de um ambiente sem afetar o outro.

## 5. Domínio

- Produção: `semog.com.br` e `www.semog.com.br` — configure ambos em **Project Settings →
  Domains**, com um redirecionando para o outro (a Vercel oferece isso na própria UI; `www` é o
  canonical usado em `NEXT_PUBLIC_SITE_URL` e no fallback de `src/lib/seo.ts`).
- Aponte os registros DNS (`A`/`CNAME`, conforme instruído pela Vercel) no provedor de DNS do
  domínio.

## 6. Pós-deploy

Depois do primeiro deploy de produção em `semog.com.br`, plugar (via os MCPs de Google
disponíveis no ambiente de trabalho):

- **Google Search Console** — verificar o domínio e submeter `/sitemap.xml`
  (`src/app/(frontend)/sitemap.ts`, já existe e é servido em produção).
- **Google Tag Manager** — o `ConsentProvider`/`CookieBanner` (LGPD, `src/lib/consent.ts`) já
  implementam o gate de consentimento (`hasConsent('analytics')` / `hasConsent('marketing')`);
  o container GTM deve carregar **condicionalmente**, só depois do usuário aceitar a categoria
  correspondente. Ao adicionar o script do GTM, também atualizar a CSP (`connect-src`/`script-src`
  em `next.config.ts`) para incluir os domínios do Google Tag Manager.
- **Google Ads** — configurar conversões/remarketing por cima do GTM já instalado, respeitando o
  mesmo gate de consentimento (categoria `marketing`).

## Checklist rápido de deploy

- [ ] Repo importado, framework Next.js, build `pnpm build`, install `pnpm install`, Node 20.
- [ ] Todas as env vars da seção 2 preenchidas em Production (e as relevantes em Preview).
- [ ] `NODE_ENV=production` (definido automaticamente pela Vercel em builds de produção) →
      `push` desligado no Payload.
- [ ] Domínio `semog.com.br` + `www.semog.com.br` configurados.
- [ ] Deploy de produção concluído e `/admin` acessível com as credenciais do Payload.
- [ ] Pós-deploy: Search Console (sitemap), GTM (atrás do consent gate), Google Ads.
- [ ] Pendência registrada: regenerar a migration `init` limpa antes de depender dela como fonte
      da verdade do schema.
