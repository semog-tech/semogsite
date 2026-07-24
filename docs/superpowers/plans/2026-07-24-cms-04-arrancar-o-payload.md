# Remoção do Payload — Fase 4: Arrancar o Payload — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remover o Payload por completo — o grupo de rotas `(payload)` (incluindo `/admin`), collections, globals, configs de bloco, `payload.config.ts`, migrations, seeds, `payload-types.ts`, `src/lib/payload.ts`, os 8 pacotes e os scripts — desembrulhando o `withPayload` do `next.config`, com o site continuando idêntico e o build limpo.

**Architecture:** Nesta fase nada do runtime do site depende mais do Payload (Fases 1–3 cuidaram disso). Esta fase é subtrativa: apaga a máquina do CMS e conserta os poucos pontos de acoplamento estrutural que restam (o `withPayload` no next.config, os scripts do package.json, o `tsconfig`/paths se referenciar `@payload-config`).

**Tech Stack:** Next.js 16, TypeScript 5.7, Vitest, Playwright, pnpm 10.

## Dependência

Requer **Fases 1, 2 e 3 concluídas**. Pré-condição rígida: **nenhum arquivo fora de `src/app/(payload)` pode importar `payload`, `@payloadcms/*`, `@/payload-types` ou `@/lib/payload`.** A Task 1 verifica isso antes de remover qualquer coisa.

## Global Constraints

- **pnpm** only. Antes de cada commit: `pnpm exec tsc --noEmit` e `pnpm exec biome lint ./src ./tests content` limpos.
- Windows `core.autocrlf=true`: ignorar ruído de fim de linha.
- Comentários em **português**.
- **Nenhuma mudança visual.** O site renderiza idêntico ao fim.
- **`next build` precisa passar** ao fim desta fase — é a validação real de que o Payload saiu limpo (o CI não roda build; rode local).
- Banco: esta fase **não** mexe no banco. A tabela `leads` (Fase 3) fica; o resto do schema Payload pode ficar órfão no Postgres sem prejuízo (limpeza do banco é follow-up opcional).
- O `/admin` será removido — decisão confirmada do dono.

## Referência

Spec: `docs/superpowers/specs/2026-07-24-remocao-do-payload-cms-design.md` (seção 3, 7).

O que remover (levantado):
- Grupo `src/app/(payload)/` inteiro: `/admin/[[...segments]]`, `/api/graphql`, `/api/graphql-playground`, `/api/[...slug]`, `layout.tsx`, `custom.scss`, `admin/importMap.js`.
- `src/collections/{Pages,Posts,Categories,Media,Users}.ts`, `src/globals/{Company,Header,Footer,SiteSettings}.ts`.
- 41 `src/blocks/*/config.ts`.
- `src/payload.config.ts`, `src/payload-types.ts`, `src/lib/payload.ts`, `src/lib/revalidate.ts`.
- `src/migrations/*`, `src/seed/*`.
- Pacotes: `payload`, `@payloadcms/db-postgres`, `@payloadcms/next`, `@payloadcms/plugin-form-builder`, `@payloadcms/plugin-seo`, `@payloadcms/richtext-lexical`, `@payloadcms/storage-s3`, `@payloadcms/ui`.
- Scripts: `generate:importmap`, `generate:types`, `payload`, `seed*`, `migrate*`.
- `withPayload` em `next.config.ts` (embrulha junto com `withSentryConfig`).
- `@payload-config` no `tsconfig` paths (se houver).

---

### Task 1: Trava de segurança — provar que nada depende mais do Payload

Antes de remover, provar que o runtime está desacoplado. Se algo ainda importar Payload fora de `(payload)`, PARAR e voltar à fase correspondente.

**Files:**
- Test: `tests/int/sem-payload.int.spec.ts`

- [ ] **Step 1: Escrever o teste-trava**

Create `tests/int/sem-payload.int.spec.ts`:

```ts
import { execSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

/**
 * Trava: nenhum arquivo fora de `src/app/(payload)` pode depender do Payload.
 * Se este teste falhar, a remoção (Fase 4) não pode prosseguir — falta migrar
 * algo nas fases anteriores.
 */
function grep(pattern: string): string[] {
  try {
    const out = execSync(
      `grep -rl "${pattern}" src content --include=*.ts --include=*.tsx || true`,
      { encoding: 'utf8' },
    )
    return out.split('\n').filter((l) => l && !l.includes('src/app/(payload)'))
  } catch {
    return []
  }
}

describe('runtime desacoplado do Payload', () => {
  for (const p of ["from 'payload'", '@payloadcms/', '@/payload-types', '@/lib/payload', '@payload-config']) {
    it(`nada fora de (payload) importa ${p}`, () => {
      expect(grep(p)).toEqual([])
    })
  }
})
```

- [ ] **Step 2: Rodar a trava**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/sem-payload.int.spec.ts`
Expected: PASS. **Se falhar**, a lista de arquivos mostra o que ainda depende do Payload — corrija na fase apropriada antes de continuar. NÃO prossiga com a remoção enquanto não passar.

- [ ] **Step 3: Commit**

```bash
git add tests/int/sem-payload.int.spec.ts
git commit -m "test: trava garantindo runtime desacoplado do Payload"
```

---

### Task 2: Remover o grupo de rotas `(payload)` e desembrulhar o next.config

**Files:**
- Delete: `src/app/(payload)/` (diretório inteiro)
- Modify: `next.config.ts`
- Modify: `tsconfig.json` (se referenciar `@payload-config`)

**Interfaces:**
- Produces: `/admin` e as rotas `/api/graphql`, `/api/[...slug]` deixam de existir.

- [ ] **Step 1: Remover o grupo de rotas**

Run: `git rm -r "src/app/(payload)"`

- [ ] **Step 2: Desembrulhar o `withPayload`**

Modify `next.config.ts`. Hoje o export é:

```ts
export default withSentryConfig(withPayload(nextConfig, { devBundleServerPackages: false }), { … })
```

Troque para remover só o `withPayload`, preservando o Sentry e todo o `nextConfig` (headers, CSP, redirects, images):

```ts
export default withSentryConfig(nextConfig, { … })
```

Remova o `import { withPayload } from '@payloadcms/next/withPayload'` do topo.

- [ ] **Step 3: Limpar paths do tsconfig**

Se `tsconfig.json` tiver um path `@payload-config` → `src/payload.config.ts`, remova-o. Confira também `@/payload-types` se estiver mapeado explicitamente.

- [ ] **Step 4: Verificar tipos**

Run: `pnpm exec tsc --noEmit`
Expected: sem erros. Se acusar `@payload-config` ou `(payload)`, sobrou referência — resolva.

- [ ] **Step 5: Confirmar que o site sobe sem o admin**

Run: com o dev server, `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/` e `.../admin`.
Expected: `/` responde 200; `/admin` responde 404 (não existe mais).

- [ ] **Step 6: Commit**

```bash
git add "src/app" next.config.ts tsconfig.json
git commit -m "chore(payload): remove o grupo de rotas (payload) e desembrulha withPayload"
```

---

### Task 3: Remover schema, config, seeds, migrations e a camada de dados antiga

**Files:**
- Delete: `src/collections/`, `src/globals/`, `src/payload.config.ts`, `src/payload-types.ts`, `src/lib/payload.ts`, `src/lib/revalidate.ts`, `src/migrations/`, `src/seed/`, e os `src/blocks/*/config.ts` (41).

- [ ] **Step 1: Remover os config de bloco**

Run: `git rm src/blocks/*/config.ts`
(Os `Component.tsx` ficam — são o site. Só os `config.ts` de schema saem.)

- [ ] **Step 2: Remover collections, globals, config, seeds, migrations, data layer**

Run:
```bash
git rm -r src/collections src/globals src/migrations src/seed
git rm src/payload.config.ts src/payload-types.ts src/lib/payload.ts src/lib/revalidate.ts
```

- [ ] **Step 3: Verificar que nada referencia os removidos**

Run: `pnpm exec tsc --noEmit`
Expected: sem erros. Se algo importava `src/lib/revalidate` (ex.: um hook), já não existe consumidor (os hooks eram das collections, removidas). Resolva qualquer referência pendente.

- [ ] **Step 4: Rodar a suíte de testes inteira**

Run: `pnpm exec vitest run --config ./vitest.config.mts`
Expected: PASS. Remova/ajuste qualquer teste que ainda importava algo do Payload (ex.: testes antigos de bloco que usavam `payload-types` — já migrados na Fase 1, mas confira).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(payload): remove collections, globals, config, seeds, migrations e data layer"
```

---

### Task 4: Remover os pacotes e os scripts

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`

- [ ] **Step 1: Remover os pacotes**

Run:
```bash
pnpm remove payload @payloadcms/db-postgres @payloadcms/next @payloadcms/plugin-form-builder @payloadcms/plugin-seo @payloadcms/richtext-lexical @payloadcms/storage-s3 @payloadcms/ui
```

- [ ] **Step 2: Remover os scripts do package.json**

Modify `package.json`: remova `generate:importmap`, `generate:types`, `payload`, `seed`, `seed:media`, `seed:globals`, `seed:posts`, `seed:pages`, `seed:forms`, `migrate:create`, `migrate`, `migrate:status`. Ajuste o `pnpm.onlyBuiltDependencies` se listava pacotes só do Payload (mantenha `sharp` se ainda usado por MDX/imagens).

- [ ] **Step 3: Verificar o lockfile e a instalação**

Run: `pnpm install`
Expected: instala sem os pacotes do Payload; sem erro de dependência órfã.

- [ ] **Step 4: Verificar tipos e lint**

Run: `pnpm exec tsc --noEmit && pnpm exec biome lint ./src ./tests content`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(payload): remove os pacotes @payloadcms/* e os scripts de CMS"
```

---

### Task 5: Build de produção limpo e verificação final

**Files:**
- Test: `tests/e2e/site-completo.e2e.spec.ts`

- [ ] **Step 1: Build de produção**

Run: `pnpm build`
Expected: `exit 0`. Este é o teste real de que o Payload saiu limpo — o build não pode mais precisar de banco em build time (as páginas agora são estáticas). Se o build reclamar de `@payload-config`, `withPayload`, ou banco, sobrou acoplamento — resolva.

- [ ] **Step 2: Servir a build e fumaça de todo o site**

Run: `pnpm start` num terminal; noutro, um e2e que percorre todas as rotas:

Create `tests/e2e/site-completo.e2e.spec.ts`: `/`, `/semog`, `/solucoes`, `/administracao-de-condominios`, `/garante`, `/incorporadoras`, `/blog`, um `/blog/<slug>`, `/contato`, `/proposta`, `/privacidade`, `/termos`, as 4 landings de cidade — todas 200 com `h1`; `/admin` → 404; um form de contato enviável; a faixa de prova e a seção do app presentes na home.

Run: `pnpm exec playwright test tests/e2e/site-completo.e2e.spec.ts --config=playwright.config.ts`
Expected: PASS.

- [ ] **Step 3: Comparar peso e tempo com a produção atual (opcional, informativo)**

Meça o tamanho do bundle e o número de dependências antes/depois — a remoção deve reduzir ambos de forma significativa. Reporte os números.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/site-completo.e2e.spec.ts
git commit -m "test: e2e de fumaça do site inteiro sem Payload; build de produção limpo"
```

---

## Verificação final da Fase 4

- [ ] `pnpm build` passa (exit 0)
- [ ] `pnpm exec tsc --noEmit` e `biome lint` limpos
- [ ] vitest e playwright todos passam
- [ ] `grep -rl "payload\|@payloadcms\|payload-types" src content` só retorna, no máximo, comentários — nenhum import
- [ ] `/admin` responde 404; o site inteiro renderiza idêntico
- [ ] `package.json` sem nenhum pacote `@payloadcms/*` nem `payload`
- [ ] Formulário grava na `leads`; cron do Ads funciona (Fase 3)
- [ ] O CI (`.github/workflows/ci.yml`) não referencia mais `generate:types`/`payload` — ajustar se necessário (o passo "Payload generate:types drift check" deve sair)

## Follow-ups pós-remoção

- **Ajustar o CI:** o workflow tem um passo `Payload generate:types (drift check)` que deixa de fazer sentido — removê-lo. Adicionar `pnpm build` ao CI agora é viável (não precisa mais de banco em build).
- **Limpeza do banco:** as tabelas órfãs do Payload no Postgres podem ser dropadas (só a `leads` é usada). Opcional, sem urgência.
- **Página `/aplicativo` (plano 03):** construir já no modelo estático; trocar `APP_HREF` de `/solucoes#aplicativo` para `/aplicativo` em `content/pages/home.ts` e nos demais pontos.
- **Editor visual leve (se um dia):** um Git-based CMS (Decap/Tina) sobre os `content/*.mdx` e `content/pages/*.ts`, sem reintroduzir banco.
- **Encerrar o proxy do VPS?** Reavaliar: a `leads` ainda é Postgres remoto, então o proxy/allow-list continuam necessários para o server escrever nela. Só sairiam se a `leads` migrasse para algo sem allow-list.
