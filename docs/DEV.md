# Guia de desenvolvimento

Site institucional Semog, construído em **Next.js 16 + Payload 3**, com Postgres e Storage no
**Supabase**.

## Pré-requisitos

- **Node 20+** (o repo fixa a versão em `.nvmrc`; use `nvm use` se disponível)
- **pnpm 10.12.4** (fixado em `package.json` → `packageManager`; use `corepack enable` para
  garantir a versão certa)
- Acesso ao projeto Supabase **`semog`** (ref `qvxlkovrxfqigeaopvui`, us-east-2) — peça as
  credenciais ao dono. O CMS não usa um projeto próprio (ver "Arquitetura de dados" abaixo).

## Arquitetura de dados (schema `cms`)

O CMS **compartilha o projeto Supabase `semog`** com o webapp, mas fica isolado num **schema
dedicado `cms`** (já criado no banco). O Payload é configurado com `schemaName: 'cms'`
(`payload.config.ts`), então todas as tabelas dele vivem em `cms.*`, sem tocar em
`public`/`auth`/`storage` do webapp. O pool do Postgres é limitado (`max: 5`) para não competir
por conexões com o app. Uploads vão num **bucket dedicado `media`** (separado dos buckets do
webapp). Se um dia precisar de isolamento total, migra-se para um projeto Supabase próprio.

## Configurar o `.env`

1. Copie o template:

   ```bash
   cp .env.example .env
   ```

2. Preencha as variáveis com as credenciais do Supabase (dashboard → **Connect** para Postgres,
   **Storage → S3 Access Keys** para o storage). Veja o cabeçalho de `.env.example` para o
   detalhe de cada variável.

### Session pooler vs. Direct connection (Postgres)

- `DATABASE_URI` → use a string do **Session pooler** (porta `5432`,
  `aws-0-<region>.pooler.supabase.com`). É a conexão usada pela aplicação em runtime e suporta
  *prepared statements*, que o adapter Postgres do Payload (Drizzle) exige.
- `DATABASE_URI_DIRECT` → use a string de **Direct connection** (porta `5432`,
  `db.<project-ref>.supabase.co`). Usada **apenas** para rodar migrations (veja abaixo).
- **O Transaction pooler (porta `6543`) é proibido neste projeto.** Ele não suporta prepared
  statements e quebra o adapter Postgres do Payload — não use essa string em nenhuma das duas
  variáveis.

### Storage (S3-compatible)

Preencha `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` e
`SUPABASE_STORAGE_PUBLIC_URL` com os valores do bucket criado em Storage → S3 Access Keys no
dashboard do Supabase. Os uploads da collection `media` são gravados nesse bucket e servidos
direto pela URL pública do Supabase (sem passar pelo Payload).

## Comandos

```bash
pnpm install       # instala dependências
pnpm dev           # sobe o Next + Payload em modo dev (http://localhost:3000, /admin para o painel)
pnpm check         # Biome — lint + format (--write)
pnpm build         # build de produção
pnpm start         # roda o build de produção

# Payload / migrations (Task 6)
pnpm payload            # CLI do Payload
pnpm migrate:create     # cria uma nova migration a partir do schema atual
pnpm migrate            # aplica migrations pendentes
pnpm migrate:status     # lista migrations aplicadas/pendentes
```

### Migrations em produção

Em dev, o schema é sincronizado automaticamente (`push: true`, ver `payload.config.ts`). Em
produção (`NODE_ENV=production`), o `push` é desligado — o schema só muda via migrations
versionadas em `src/migrations/`.

Migrations DDL devem rodar pela **conexão direta**, não pelo pooler. Localmente/CI, aponte
`DATABASE_URI` para o valor de `DATABASE_URI_DIRECT` só para o comando de migration:

```bash
DATABASE_URI="$DATABASE_URI_DIRECT" pnpm migrate:create init
DATABASE_URI="$DATABASE_URI_DIRECT" pnpm migrate
DATABASE_URI="$DATABASE_URI_DIRECT" pnpm migrate:status
```

## `_reference/`

A pasta `_reference/` contém o site estático original (HTML/CSS/JS puro), congelado como
referência visual e de conteúdo para a migração. **Não edite os arquivos ali** — o trabalho novo
acontece em `src/` (Next.js + Payload).
