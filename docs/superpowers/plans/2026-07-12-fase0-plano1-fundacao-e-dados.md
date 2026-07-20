# Semog Fase 0 · Plano 1 — Fundação & Camada de Dados

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deixar um app **Next.js 15 + Payload 3** rodando in-place neste repo, com o admin funcional, dados no **Supabase Postgres** (session pooler), uploads no **Supabase Storage** (S3), **Biome** e workflow de **migrations** versionadas.

**Architecture:** O site estático atual é congelado em `_reference/`. Scaffold do Payload 3 (template blank) na raiz — Payload roda embutido no Next em `src/app/(payload)`, frontend em `src/app/(frontend)`. Banco via `@payloadcms/db-postgres` na string do session pooler do Supabase; migrations pela conexão direta. Media via `@payloadcms/storage-s3` no endpoint S3-compat do Supabase.

**Tech Stack:** Next.js 15 (App Router, React 19), Payload 3, `@payloadcms/db-postgres`, `@payloadcms/storage-s3`, Supabase (Postgres + Storage), Biome, pnpm, TypeScript.

## Global Constraints

- Gerenciador de pacotes: **pnpm** (nunca npm/yarn nos comandos).
- Node **>= 20.9.0** (fixar em `.nvmrc` e `engines`).
- Idioma do conteúdo/UI do site: **pt-BR**.
- Serverless na Vercel: FS é read-only → nenhum upload local; toda mídia vai pro Supabase Storage.
- Banco em serverless: usar **Session pooler** do Supabase (porta 5432, supavisor) para `DATABASE_URI` (suporta prepared statements). **Transaction pooler (6543) é proibido** aqui (quebra prepared statements). Migrations usam a **conexão direta** (`DATABASE_URI_DIRECT`).
- Sem segredos commitados: tudo em `.env` (gitignored); manter `.env.example` atualizado.
- Cada task termina em commit próprio.

## Roadmap da Fase 0 (contexto — só o Plano 1 está detalhado aqui)

1. **Plano 1 — Fundação & Camada de Dados** ← este documento
2. Plano 2 — Design System (Tailwind v4 dos tokens do `semog.css`) & Motion (Lenis/GSAP)
3. Plano 3 — Modelagem CMS, Rendering por blocos & Home portada 1:1 (+ ISR)
4. Plano 4 — Formulários (Form Builder + RHF/Zod/Server Actions + Turnstile + rate limit + SendGrid/React Email), Sentry, banner LGPD, páginas de erro, SEO (metadata/sitemap/robots/OG/301), security headers, CI e previews

Cada plano gera software funcional e testável. Os planos 2–4 serão escritos quando chegarmos neles.

---

### Task 1: Congelar o site atual em `_reference/`

**Files:**
- Create: `_reference/` (recebe todo o site estático)
- Modify: raiz do repo (mover arquivos)

**Interfaces:**
- Consumes: nada.
- Produces: `_reference/` com o HTML/CSS/JS/imagens/vídeos originais intactos, para diff visual nas fases seguintes.

- [ ] **Step 1: Mover o site estático para `_reference/`**

Mantém `.git`, `.claude`, `.gitignore`, `README.md` e `docs/` na raiz. Move o resto do site.

```bash
mkdir -p _reference
git mv index.html semog.html solucoes.html garante.html incorporadoras.html \
  blog.html contato.html proposta.html administracao-de-condominios.html \
  administradora-de-condominios-recife.html administradora-de-condominios-joao-pessoa.html \
  administradora-de-condominios-campina-grande.html administradora-de-condominios-belem.html \
  privacidade.html termos.html guia.html \
  robots.txt sitemap.xml ABRIR-SITE.bat semog-logo.svg assets _reference/
```

- [ ] **Step 2: Verificar que a raiz ficou limpa e o reference completo**

Run: `ls -1 && echo "--- reference ---" && ls -1 _reference`
Expected: raiz sem `.html`/`assets`; `_reference/` contém as 16 páginas + `assets/` + `robots.txt` + `sitemap.xml`.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: congela site estático em _reference/ antes do scaffold Next/Payload"
```

---

### Task 2: Scaffold Next 15 + Payload 3 (template blank, adapter postgres)

**Files:**
- Create: `src/app/(payload)/…`, `src/app/(frontend)/…`, `src/payload.config.ts`, `src/collections/Users.ts`, `src/collections/Media.ts`, `package.json`, `tsconfig.json`, `next.config.mjs`, `.env` (local, gitignored), `.nvmrc`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: nada.
- Produces: app Next+Payload instalável; `payload.config.ts` exportando `buildConfig({...})`; collections `Users` e `Media`; scripts pnpm (`dev`, `build`, `start`, `payload`).

- [ ] **Step 1: Gerar o scaffold do Payload num diretório temporário**

`create-payload-app` exige diretório vazio; geramos fora e trazemos pra raiz (que já tem `.git`/`docs`/`_reference`). Template **blank**, banco **postgres**, pular a conexão agora (preenchemos no Task 3).

```bash
cd "$TEMP" && rm -rf semog-scaffold
pnpm create payload-app@latest semog-scaffold --template blank --db postgres --no-deps
```

- [ ] **Step 2: Trazer o scaffold para a raiz do repo (sem sobrescrever git/docs/_reference)**

```bash
# copia tudo, exceto metadados que já existem na raiz
rsync -a --exclude='.git' --exclude='node_modules' "$TEMP/semog-scaffold/" ./
```

Se `rsync` não existir no ambiente, use: `cp -r "$TEMP/semog-scaffold/." ./` e resolva conflitos de `.gitignore`/`README.md` mantendo os do repo.

- [ ] **Step 3: Fixar Node e pnpm**

Create `.nvmrc`:

```
20
```

Adicione ao `package.json` (campo raiz):

```json
"packageManager": "pnpm@9",
"engines": { "node": ">=20.9.0" }
```

- [ ] **Step 4: Instalar dependências**

Run: `pnpm install`
Expected: instala sem erros; cria `node_modules` e `pnpm-lock.yaml`.

- [ ] **Step 5: Verificar que o `.gitignore` cobre o app**

Garanta que `.gitignore` contém (append se faltar): `node_modules/`, `.next/`, `.env`, `.env*.local`, `/build`, `/dist`, `.DS_Store`. Mantenha as regras antigas do repo.

- [ ] **Step 6: Boot de fumaça (sem DB ainda — deve subir e falhar só na conexão)**

Run: `pnpm dev` (aguarde ~10s) e em outro terminal `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000`
Expected: o servidor Next inicia (código HTTP retorna; erro de DB no `/admin` é esperado nesta etapa). Encerre com Ctrl+C.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next 15 + Payload 3 (template blank, adapter postgres)"
```

---

### Task 3: Conectar Supabase Postgres (session pooler) e criar o primeiro admin

**Files:**
- Modify: `src/payload.config.ts` (bloco `db`), `.env`, `.env.example` (create)

**Interfaces:**
- Consumes: `postgresAdapter` de `@payloadcms/db-postgres` (já vem no scaffold postgres).
- Produces: conexão de banco ativa; env `DATABASE_URI` (session pooler) e `DATABASE_URI_DIRECT` (direta); `PAYLOAD_SECRET`.

- [ ] **Step 1: Preencher `.env` com as strings do Supabase**

Pegue no dashboard do Supabase → Connect. Use **Session pooler** para `DATABASE_URI` e **Direct connection** para `DATABASE_URI_DIRECT`.

```dotenv
# .env
DATABASE_URI=postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
DATABASE_URI_DIRECT=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
PAYLOAD_SECRET=<gerar: openssl rand -base64 32>
```

- [ ] **Step 2: Garantir o adapter usando `DATABASE_URI` no `payload.config.ts`**

O bloco `db` deve ficar assim (o scaffold já cria algo próximo — confirme/ajuste):

```typescript
import { postgresAdapter } from '@payloadcms/db-postgres'

// dentro de buildConfig({ ... })
db: postgresAdapter({
  pool: {
    connectionString: process.env.DATABASE_URI,
  },
  // em dev usamos push automático de schema; em prod, migrations (Task 6)
  push: process.env.NODE_ENV !== 'production',
}),
```

- [ ] **Step 3: Criar `.env.example` (sem segredos)**

```dotenv
# .env.example
# Supabase Postgres — Session pooler (app) e Direct (migrations)
DATABASE_URI=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
DATABASE_URI_DIRECT=postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres
PAYLOAD_SECRET=
```

- [ ] **Step 4: Subir e sincronizar o schema**

Run: `pnpm dev`
Expected: logs do Payload sem erro de conexão; ao abrir `http://localhost:3000/admin`, aparece a tela de criação do primeiro usuário admin.

- [ ] **Step 5: Criar o primeiro admin e verificar persistência**

Crie o usuário em `/admin`. Depois confirme via MCP do Supabase que as tabelas do Payload existem (ex.: `users`, `payload_migrations`).
Expected: usuário criado, login funciona, tabelas visíveis no Supabase.

- [ ] **Step 6: Commit**

```bash
git add src/payload.config.ts .env.example
git commit -m "feat: conecta Supabase Postgres (session pooler) e cria admin"
```

---

### Task 4: Uploads no Supabase Storage (S3-compat)

**Files:**
- Modify: `src/payload.config.ts` (plugin `s3Storage`), `src/collections/Media.ts`, `.env`, `.env.example`
- Add dep: `@payloadcms/storage-s3`

**Interfaces:**
- Consumes: collection `Media` (do scaffold); credenciais S3 do Supabase Storage.
- Produces: uploads da collection `media` gravados no bucket Supabase; URL pública servida direto do Supabase.

- [ ] **Step 1: Instalar o adapter S3**

Run: `pnpm add @payloadcms/storage-s3`
Expected: dependência adicionada.

- [ ] **Step 2: Criar o bucket e as chaves S3 no Supabase**

No dashboard: Storage → criar bucket `media` (público). Storage → S3 Access Keys → gerar `Access key`/`Secret key`. Anote o `region` e o endpoint `https://<ref>.supabase.co/storage/v1/s3`.

- [ ] **Step 3: Preencher env do Storage**

```dotenv
# .env  (e replicar chaves vazias no .env.example)
S3_BUCKET=media
S3_REGION=<region-do-projeto>            # ex.: sa-east-1
S3_ENDPOINT=https://<ref>.supabase.co/storage/v1/s3
S3_ACCESS_KEY_ID=<access-key>
S3_SECRET_ACCESS_KEY=<secret-key>
SUPABASE_STORAGE_PUBLIC_URL=https://<ref>.supabase.co/storage/v1/object/public
```

- [ ] **Step 4: Registrar o plugin `s3Storage` no `payload.config.ts`**

Serve os arquivos direto pela URL pública do Supabase (melhor cache/CDN e compatível com `next/image` depois).

```typescript
import { s3Storage } from '@payloadcms/storage-s3'

// em plugins: [ ... ]
s3Storage({
  collections: {
    media: {
      disablePayloadAccessControl: true, // servir direto do Supabase
      generateFileURL: ({ filename }) =>
        `${process.env.SUPABASE_STORAGE_PUBLIC_URL}/${process.env.S3_BUCKET}/${filename}`,
    },
  },
  bucket: process.env.S3_BUCKET!,
  config: {
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true,
  },
}),
```

- [ ] **Step 5: Testar upload de ponta a ponta**

Run: `pnpm dev` → `/admin` → Collections → Media → criar, subir uma imagem de `_reference/assets/img/` (ex.: `hero-towers.webp`).
Expected: upload conclui; o campo URL aponta para `…/storage/v1/object/public/media/hero-towers.webp`; abrir a URL no navegador mostra a imagem; o objeto aparece no bucket no dashboard do Supabase.

- [ ] **Step 6: Commit**

```bash
git add src/payload.config.ts src/collections/Media.ts .env.example package.json pnpm-lock.yaml
git commit -m "feat: uploads de mídia no Supabase Storage (S3-compat), servidos por URL pública"
```

---

### Task 5: Biome (lint + format) no lugar de ESLint/Prettier

**Files:**
- Create: `biome.json`
- Modify: `package.json` (scripts; remover eslint/prettier se o scaffold trouxe), remover `.eslintrc*`/`.prettierrc*` se existirem

**Interfaces:**
- Consumes: código do scaffold.
- Produces: comandos `pnpm lint`, `pnpm format`, `pnpm check` via Biome.

- [ ] **Step 1: Instalar o Biome**

Run: `pnpm add -D -E @biomejs/biome`
Expected: dependência adicionada.

- [ ] **Step 2: Criar `biome.json`**

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": { "ignoreUnknown": true, "includes": ["src/**", "*.ts", "*.mjs", "*.json"] },
  "formatter": { "enabled": true, "indentStyle": "space", "indentWidth": 2, "lineWidth": 100 },
  "linter": { "enabled": true, "rules": { "recommended": true } },
  "javascript": { "formatter": { "quoteStyle": "single", "semicolons": "asNeeded" } }
}
```

Ajuste `$schema` para a versão instalada (veja `pnpm biome --version`).

- [ ] **Step 3: Trocar os scripts e remover configs antigas**

No `package.json` `scripts`:

```json
"lint": "biome lint ./src",
"format": "biome format --write ./src",
"check": "biome check --write ./src"
```

Remova pacotes/arquivos de ESLint e Prettier se o scaffold os incluiu (`pnpm remove eslint prettier ...`; apague `.eslintrc*`, `.prettierrc*`, `eslint.config.*`). Deixe intactos os arquivos gerados pelo Payload (`src/payload-types.ts`, `src/app/(payload)`), adicionando-os a `overrides`/ignore se o Biome reclamar deles.

- [ ] **Step 4: Rodar o check**

Run: `pnpm check`
Expected: Biome formata/organiza e termina sem erros de lint (aplicar `--write` já corrige formatação). Reveja o diff.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: adota Biome para lint/format (remove ESLint/Prettier)"
```

---

### Task 6: Workflow de migrations (dev = push, prod = migrations)

**Files:**
- Modify: `package.json` (scripts de migration), `src/payload.config.ts` (garantir `push` só em dev)
- Create: `src/migrations/` (primeira migration gerada)

**Interfaces:**
- Consumes: adapter Postgres configurado (Task 3).
- Produces: scripts `pnpm payload migrate:create`, `pnpm payload migrate`, `pnpm payload migrate:status`; migration inicial versionada; padrão de deploy sem `push` em produção.

- [ ] **Step 1: Adicionar scripts de migration**

No `package.json` `scripts`:

```json
"payload": "cross-env NODE_OPTIONS=--no-deprecation payload",
"migrate:create": "cross-env NODE_OPTIONS=--no-deprecation payload migrate:create",
"migrate": "cross-env NODE_OPTIONS=--no-deprecation payload migrate",
"migrate:status": "cross-env NODE_OPTIONS=--no-deprecation payload migrate:status"
```

Se `cross-env` não estiver presente: `pnpm add -D cross-env`.

- [ ] **Step 2: Garantir que migrations usem a conexão direta**

As migrations DDL devem rodar pela **conexão direta** (não pelo pooler). Documente no header do `.env.example` e, ao rodar migrations localmente/CI, aponte `DATABASE_URI` para `DATABASE_URI_DIRECT`:

```bash
# rodar migrations com a conexão direta
DATABASE_URI="$DATABASE_URI_DIRECT" pnpm migrate
```

- [ ] **Step 3: Gerar a migration inicial (schema atual: Users + Media)**

Run: `DATABASE_URI="$DATABASE_URI_DIRECT" pnpm migrate:create init`
Expected: cria `src/migrations/<timestamp>_init.ts` com o schema atual.

- [ ] **Step 4: Aplicar e conferir status**

Run: `DATABASE_URI="$DATABASE_URI_DIRECT" pnpm migrate && DATABASE_URI="$DATABASE_URI_DIRECT" pnpm migrate:status`
Expected: migration aplicada; status mostra `init` como executada; tabela `payload_migrations` registra a linha.

- [ ] **Step 5: Confirmar `push` desligado em produção**

Garanta no `payload.config.ts`: `push: process.env.NODE_ENV !== 'production'` (do Task 3). Assim o build de produção não altera schema automaticamente — só migrations.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: workflow de migrations do Payload (push em dev, migrations em prod)"
```

---

### Task 7: Documentação de ambiente e fechamento do Plano 1

**Files:**
- Create: `docs/DEV.md`
- Modify: `README.md` (seção de desenvolvimento), `.env.example` (revisão final)

**Interfaces:**
- Consumes: tudo acima.
- Produces: instruções reproduzíveis de setup local; `.env.example` completo do Plano 1.

- [ ] **Step 1: Escrever `docs/DEV.md`**

Conteúdo: pré-requisitos (Node 20, pnpm), como preencher `.env` (session pooler vs direct, chaves S3), comandos (`pnpm dev`, `pnpm check`, migrations), e a nota de que `_reference/` é o site antigo (não editar). Inclua a ressalva do pooler (transaction pooler proibido).

- [ ] **Step 2: Revisar `.env.example`**

Confirme que contém todas as variáveis do Plano 1 (DATABASE_URI, DATABASE_URI_DIRECT, PAYLOAD_SECRET, S3_*, SUPABASE_STORAGE_PUBLIC_URL) — sem valores reais.

- [ ] **Step 3: Atualizar `README.md`**

Substitua a seção "Como rodar localmente" (que hoje descreve o site estático) por um apontamento para `docs/DEV.md` e mencione que o site estático original vive em `_reference/`.

- [ ] **Step 4: Verificação final de fumaça do Plano 1**

Run: `pnpm check && pnpm build`
Expected: Biome ok e build de produção do Next+Payload conclui sem erro (com `.env` preenchido).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "docs: guia de desenvolvimento e fechamento do Plano 1 (fundação + dados)"
```

---

## Self-Review (cobertura vs. spec)

- **Repo in-place / `_reference/`** → Task 1. ✅
- **Next 15 + Payload 3 embutido** → Task 2. ✅
- **Supabase Postgres via pooler (session), prepared statements** → Task 3 + Global Constraints. ✅
- **Supabase Storage (S3) para uploads** → Task 4. ✅
- **Biome no lugar de ESLint/Prettier** → Task 5. ✅
- **Migrations versionadas (push em dev, migrate em prod)** → Task 6. ✅
- **pnpm + Node pin + `.env.example` + docs** → Tasks 2/7. ✅

**Fora do escopo deste plano (vêm nos Planos 2–4, por design):** Tailwind/tokens, fontes, motion, blocos/CMS, home port, formulários, SendGrid/React Email, Turnstile, Sentry, banner LGPD, SEO/metadata/OG/301, ISR, CI, security headers, previews. Sem placeholders pendentes dentro do escopo do Plano 1.
