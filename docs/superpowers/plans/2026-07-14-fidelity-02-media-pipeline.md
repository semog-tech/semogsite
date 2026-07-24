# Fidelidade — Onda 2: Pipeline de mídia Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: subagent-driven-development. Steps use `- [ ]`.

**Goal:** Subir TODA a mídia de `_reference/assets/` para a coleção `Media` (via Payload Local API → Supabase Storage/S3, já validado) de forma idempotente, e expor um helper para os seeds de página referenciarem cada asset por nome de arquivo.

**Architecture:** Um seed standalone `src/seed/media.ts` (mesmo padrão dos outros: `getPayload({ config })`) que, para cada asset mapeado, cria um doc `media` com `filePath` (o storage-s3 empurra pro bucket automaticamente) — pulando os que já existem (idempotente por `filename`). Um helper `src/seed/lib/media.ts` resolve `filename → media id` para as ondas seguintes.

**Tech Stack:** Payload 3 Local API, `@payloadcms/storage-s3` (config em `src/payload.config.ts`), Supabase Storage bucket `media` (público). `.env` local já tem `S3_ACCESS_KEY_ID`/`S3_SECRET_ACCESS_KEY` válidos (PUT/HEAD/DELETE testados ✅).

## Global Constraints
- Idempotente: rodar 2× não duplica (checar `filename` antes de criar).
- `alt` fiel: usar o texto `alt` real do `_reference/*.html` onde o asset aparece; fallback = descrição PT sensata.
- Sem hardcode de credencial — tudo vem do `.env` via a config existente.
- Verde: biome + typecheck + build; e o seed EXECUTA localmente com sucesso.

---

## File Structure
- `src/seed/lib/media.ts` (novo) — `getMediaId(payload, filename): Promise<number>` (lança se faltar) + `MEDIA_ASSETS` (o mapa).
- `src/seed/media.ts` (novo) — script de upload idempotente.
- `package.json` (modificar) — script `"seed:media": "cross-env NODE_OPTIONS=--no-deprecation payload run src/seed/media.ts"`.

---

### Task 1: Seed de mídia idempotente + helper

**Files:**
- Create: `src/seed/lib/media.ts`, `src/seed/media.ts`
- Modify: `package.json` (script)
- Read: `src/collections/Media.ts` (campos obrigatórios além de `alt`?), `src/seed/home.ts` (padrão de bootstrap), `src/payload.config.ts` (adapter s3), e os `_reference/*.html` (para os `alt` reais).

**Interfaces:**
- Produces:
  - `MEDIA_ASSETS: { filename: string; path: string; alt: string }[]` — cobrindo TODOS os assets de `_reference/assets/img/*` (22, incl. `semog-logo-light.svg`) e `_reference/assets/video/*` (`hero.mp4`, `garante.mp4`). `path` relativo à raiz do repo.
  - `getMediaId(payload, filename)` — busca `media` por `filename` e retorna o id (para os seeds de página).

- [ ] **Step 1: Inventariar os assets**

Listar `_reference/assets/img/` e `_reference/assets/video/` (confirmar os 22 + 2 nomes). Para cada, achar no `_reference/*.html` o `alt` usado (o mais fiel). Montar `MEDIA_ASSETS` em `src/seed/lib/media.ts`.

- [ ] **Step 2: Escrever `getMediaId`**

```ts
export async function getMediaId(payload, filename: string): Promise<number> {
  const res = await payload.find({ collection: 'media', where: { filename: { equals: filename } }, limit: 1, pagination: false })
  const doc = res.docs[0]
  if (!doc) throw new Error(`media não encontrada: ${filename} (rodou pnpm seed:media?)`)
  return doc.id as number
}
```
(ajustar tipo de retorno se o id for string no projeto.)

- [ ] **Step 3: Escrever `src/seed/media.ts`**

Bootstrap `getPayload({ config })`. Para cada asset de `MEDIA_ASSETS`: checar se já existe (`find` por `filename`); se não, `await payload.create({ collection: 'media', filePath: <abs path>, data: { alt } })`. Logar criados/pulados. Encerrar o processo no fim (os outros seeds fazem `process.exit(0)`? seguir o padrão do `home.ts`).

- [ ] **Step 4: Rodar de verdade**

`pnpm seed:media`. Esperado: sobe os 24 assets (ou pula os existentes). Verificar: `payload.find({collection:'media'})` conta ≥24, e a URL pública de 1 asset (ex.: `hero-towers.webp`) resolve (200). Rodar 2× → segunda vez pula todos (idempotente). **Especialmente confirmar que `hero.mp4` (≈10MB) subiu** (é o vídeo do hero que o usuário sentiu falta).

- [ ] **Step 5: Verificação estática** — biome + typecheck + build verdes.

- [ ] **Step 6: Commit** — `feat(seed): idempotent media pipeline (upload _reference assets to S3)`

## Self-Review
- Cobre TODA a mídia do `fidelity-master.md` seção 0. O wiring nos blocos acontece nas ondas de página (cada seed de página usa `getMediaId`). Sem placeholder: o mapa é concreto; os `alt` vêm do reference.
