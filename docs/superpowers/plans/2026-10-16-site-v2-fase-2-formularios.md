# Site v2 · Fase 2 (formulários): plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** pôr de pé, atrás da rota `/previa-v2` e sem mudar nenhuma URL pública, o pedido de proposta em duas etapas do site v2: migração de `cms.leads`, schema e Server Actions das duas etapas com token em cookie HttpOnly, envio único ao Exact + e-mail interno + conversão do Ads (na hora com a etapa 2, pelo cron depois de ~45 min só com a etapa 1), filtro de ambiente para Preview e local não dispararem nada, Sentry no servidor e a tela do protótipo com os estados que faltavam.

**Architecture:** a gravação é sempre uma linha por lead em `cms.leads`: a etapa 1 faz `INSERT` com `etapa = 1` e `envio_em` nulo e devolve um uuid num cookie HttpOnly; a etapa 2 faz `UPDATE` da mesma linha pelo token (válido 30 min, uso único, decidido no banco) e a "reivindica" (`envio_em = now()`) no mesmo comando. Quem reivindica a linha (a action da etapa 2 ou o cron, para a etapa 1 parada há 45 min) chama um único módulo de pós-gravação, que envia Exact, e-mail interno e Ads uma vez cada, com marcadores no banco (`exact_lead_id`, `uploaded_to_ads`, `envio_em`), e nunca lança. O formulário antigo (`submitForm`, `submitPropostaRapida`) continua com o mesmo contrato.

**Tech Stack:** Next 16.2.6 (Server Actions, `cookies()` de `next/headers`), React 19.2.6, TypeScript 5.7 estrito, Zod 4.4.3, `pg` 8.22.0, `@sentry/nextjs` 10.65.0, `google-auth-library` + Data Manager API (`events:ingest`, REST via `fetch`), `gsap` 3.15.0 + `@gsap/react` 2.1.2, Vitest 4.0.18 (jsdom) + Testing Library 16.3, Biome 2.5.3, pnpm, `tsx` (scripts), Docker 29 (banco descartável só na verificação).

**Spec:** `C:\Users\lekoc\semogapp\semogsite-site-v2\docs\superpowers\specs\2026-10-15-site-v2-producao-design.md` (seções 2, 4, 5, 7, 8 e 10; 4.1, 4.3, 4.4 e 7 atualizadas em 16/10/2026 com as decisões abaixo). Roteiro: `docs/superpowers/plans/2026-10-15-site-v2-roteiro.md` (critério de pronto da fase 2). Mapa factual do código de 15/10/2026: `C:\Users\lekoc\AppData\Local\Temp\claude\C--Users-lekoc-semogapp-semogsite\fce07e0d-ce5a-4a7f-a870-a8cface08e2b\scratchpad\fase2-mapa.md` (os números de linha dele estão aproximados; este plano cita as linhas conferidas em 16/10).

## Global Constraints

- **Onde trabalhar:** na worktree `C:\Users\lekoc\semogapp\semogsite-site-v2` (neste plano, **WT**), branch `feat/site-v2`. Conferir `git branch --show-current` na mesma chamada de cada commit.
- **Commits locais por tarefa, sem push.** Mesmo regime da fase 1 (autorizado pelo Leandro em 15/10/2026 para a `feat/site-v2`; [A CONFIRMAR] que vale para a fase 2): cada tarefa termina com `git branch --show-current && git add <arquivos exatos> && git commit -m "..."`, nunca `git add -A`; mensagem convencional em pt-BR terminando com as linhas `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` e `Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn`. Push, PR e Vercel só com o "ok" do Leandro.
- **Banco real:** só a Tarefa 2.1 toca o banco de produção, e o passo que grava tem **PARADA OBRIGATÓRIA** para o Leandro confirmar. Nenhum outro passo, de nenhuma tarefa, conecta no banco real. O código que usa as colunas novas só é mergeado depois da migração aplicada e conferida.
- **Efeito externo:** nenhum agente chama Exact, SendGrid, Google Ads (Data Manager) nem envia formulário em produção. Testes mocam `@/lib/exact/push-lead`, `@/lib/sendgrid`, `@/lib/ads/conversoes`, `@/lib/turnstile` e `@/lib/db`. O envio real em produção é passo do Leandro (Tarefa 2.7).
- **Segredos:** nunca imprimir valor de variável (`DATABASE_URI`, `CRON_SECRET`, `GOOGLE_SA_JSON`, chaves). Scripts imprimem só nomes, contagens e estrutura.
- **Portões da CI** (rodar da WT, nesta ordem): `pnpm exec biome ci ./src ./tests ./scripts`, `pnpm exec tsc --noEmit`, `pnpm run check:server-actions`, `pnpm run test:int`, `pnpm build`. Antes do `biome ci`, `pnpm exec biome check --write <arquivos tocados>` e conferir `git diff --cached --stat` depois do `git add` (CRLF no disco, LF no Git).
- **Server Actions:** arquivo `'use server'` só exporta função `async`; tipos compartilhados moram fora dele (`src/lib/...`). As actions **nunca lançam**: devolvem resultado tipado.
- **Contrato antigo intocado:** `submitForm(formType, values, turnstileToken)` e `submitPropostaRapida(values, turnstileToken)` mantêm assinatura e `SubmitFormResult`; linhas com `etapa` nula continuam indo ao Exact na hora, e o cron as trata como completas. O `FalhaDeEnvio` antigo (usado pelo Experience) não muda.
- **Chaves de `data`:** as que Exact, desfecho e e-mail já leem: `nomeCondominio`, `nome`, `cargo`, `cidade`, `unidades`, `email`, `telefone` (E.164 `+55…`), `variante`; novas: `uf`, `cliente` (`sim`|`nao`), `ambiente`, e a de atribuição `origem — Tipo do clique (Google Ads)`.
- **Sentry no servidor sem dado pessoal:** evento só com `passo`, `origem` e `leadId`; nunca telefone, e-mail ou nome no `extra`; erro de terceiro vira `Error` genérico (o detalhe fica em `exact_error` ou no log).
- **Texto público:** pt-BR; proibidos "tempo real", "validade jurídica", "menor inadimplência do mercado", "melhor do Brasil", "5ª melhor" (e os demais de `tests/int/helpers/identidade.ts`); jurídico sempre "com parceiro"; a Semog "assessora", não "assume"; nada editorial; nenhum dado inventado na interface (texto novo marcado `TEXTO-NOVO`); WhatsApp de proposta **não** aparece no formulário novo (nem `conteudo.proposta.whatsapp`, nem `wa.me`).
- **Identidade do site v2** (guarda `site-v2-identidade`): CSS só por token, `border-radius` 0, sem `uppercase`, sem serifa, `stroke-linecap` butt, sem `prefers-reduced-motion`; um `.css` por seção/componente, CSS global simples (sem Tailwind, sem CSS module); links internos `<a>`; nada de hex em `.ts`/`.tsx` de `src/site` e `src/app/(site)`.
- **TypeScript:** zero `any`; `as` só com o motivo escrito ao lado; toda promise com tratamento de erro; dinheiro em inteiro (aqui só o `conversionValue: 1` que já existe).
- **Nenhum segredo no bundle:** nenhuma `NEXT_PUBLIC_*` nova; `VERCEL_ENV` só no servidor.
- **Windows/CRLF:** teste que lê arquivo do disco normaliza `\r\n`; SQL em template literal (o JS já normaliza CRLF para LF dentro de template); regex de teste não depende de `.`/`$` antes de `\r`.
- **APIs de terceiro conferidas em 16/10/2026:** `cookies().set/get/delete` (`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cookies.md`: escrita só em Server Function ou Route Handler); `z.enum(valores, 'mensagem')`, `.superRefine`, `.refine(fn, 'mensagem')`, `.extend` (`node_modules/zod/v4/classic/schemas.d.ts`); `pg`: `sslmode=disable` na connection string sobrepõe o `ssl` das opções (`node_modules/pg/lib/connection-parameters.js:57-61` e `pg-connection-string`); Data Manager API `AdIdentifiers` tem `gclid`, `gbraid` e `wbraid` como campos distintos (Context7 `/websites/developers_google_data-manager_api`, fonte `developers.google.com/data-manager/api/reference/rest/v1/events/ingest`). Não usamos `after()`.

## Decisões de projeto

Do Leandro (16/10/2026, vinculantes):
- **D1 · Ads junto com o Exact.** A conversão do formulário sobe pelo servidor no mesmo momento do envio ao Exact (na hora com a etapa 2; pelo cron depois de ~45 min só com a etapa 1). O lote diário (06:00 UTC, `transactionId = lead-<id>`) fica como rede de recuperação idempotente, com o mesmo critério. Falha do Ads nunca derruba o Exact nem a resposta; vai ao Sentry e o lote retenta.
- **D2 · Cidade da etapa 2** é lista conforme a UF (PB: João Pessoa e Campina Grande; PE: Recife; PA: Belém) + "Outra cidade" com texto; UF sem Unidade mostra só o texto. Região do Exact pela cidade escolhida; "Outra cidade" cai na região da UF.

Rulings da sessão (vinculantes) e como o plano os implementa:
- **R1 · Ambiente.** Preview e local gravam no banco de produção (`docs/DEPLOY.md`, seção 4). Toda linha nova de proposta e contato grava `data.ambiente` = `VERCEL_ENV` ou `'local'`; Exact, e-mail interno e Ads (action, cron e lote) só processam `ambiente` ausente ou `'production'`. Em SQL: `coalesce(data->>'ambiente', 'production') = 'production'` (Tarefas 2.2, 2.3, 2.4, 2.5).
- **R2 · Cron do Exact a cada 15 min** (`*/15 * * * *`). O próprio cron documenta que a conta é Pro (`src/app/api/cron/push-exact-leads/route.ts:17-20`), que aceita a frequência. Espera real: 45 a 60 min (Tarefa 2.5).
- **R3 · Etapa 1 vencida pelo cron:** Exact + e-mail interno (com botões de desfecho) + Ads, uma vez cada; e-mail roteado pela UF (PE → `ivan@semog.com.br`, PB → `comercial.pb@semog.com.br`, PA → `galvao@semog.com.br`, outras → os três num e-mail só; são os endereços que `submit-form.ts:129-155` já usa, nada inventado). Aviso automático ao lead como hoje: uma vez, junto do e-mail interno, só com e-mail (Tarefas 2.3 e 2.5).
- **R4 · Token.** Cookie `proposta_etapa`, HttpOnly, `Secure` fora do `next dev`, `SameSite=Strict`, `path=/`, valor = uuid de `token_envio`. Validade e uso único vêm do banco (`etapa = 1 and envio_em is null and created_at > now() - interval '30 minutes'` no `UPDATE`). Trava do cron: `UPDATE … WHERE id IN (SELECT … FOR UPDATE SKIP LOCKED) RETURNING`. **Decisão sobre a etapa 2 tardia:** como o token vale 30 min e o cron só pega a etapa 1 com 45 min, a etapa 2 nunca encontra a linha já enviada pelo cron; a que chega depois dos 30 min recebe `precisa_verificar` (R5). Complemento por e-mail depois do envio do cron fica fora do escopo (Tarefa 2.4).
- **R5 · Token perdido ou vencido:** a etapa 2 responde `precisa_verificar`; a tela mostra o Turnstile e reenvia etapa 1 + etapa 2 juntas. Com Turnstile novo, o servidor **reaproveita a linha do cookie se ela ainda não foi reivindicada** (sem o limite dos 30 min, porque o Turnstile restabelece a confiança); sem cookie, ou com a linha já enviada pelo cron, grava UMA linha nova completa (`etapa = 2`). Nunca grava lead sem Turnstile (Tarefa 2.4).
- **R6 · "Voltar":** reenviar a etapa 1 com token válido faz `UPDATE` da mesma linha (corrige os campos e o destino do e-mail se a UF mudou), sem novo `INSERT` e sem novo Turnstile (Tarefa 2.4).
- **R7 · Chaves e normalização:** `nomeCondominio`; telefone pela regra da spec (DDD de 2 dígitos sem zero + 8 ou 9 dígitos), gravado em E.164 `+55…`; papéis → `cargo`: síndico → `Síndico(a)`, conselheiro → `Conselheiro(a)`, morador → `Morador(a)`, construtora → `Incorporador(a) / Construtora` (valores de `CARGO_OPTIONS`, `src/lib/form-schemas.ts:80-86`); e-mail opcional (Tarefa 2.2).
- **R8 · Sentry no servidor** em toda falha de gravação, Exact, e-mail e Ads, sem PII; falha de gravação mostra no formulário novo a tela de falha com o telefone da Unidade e "Tentar de novo", sem WhatsApp. `FalhaDeEnvio` antigo intocado; o v2 tem `FalhaDoEnvio` próprio (Tarefas 2.3, 2.4, 2.6).
- **R9 · Clique do Google:** primeiro toque, senão o último (como `src/app/api/track/whatsapp/route.ts:77`), e `gbraid`/`wbraid` separados do `gclid`: a Data Manager API tem os três campos (fonte acima). A coluna `gclid` continua guardando o valor; o tipo vai em `data` e o envio usa o campo certo. Linha sem tipo vai como `gclid` (formato de hoje) (Tarefas 2.2, 2.3, 2.5).
- **R10 · Compatibilidade:** actions novas em `src/app/(site)/_actions/proposta-duas-etapas.ts`; as antigas mantêm o contrato (Tarefa 2.4).
- **R11 · GA4:** `generate_lead` com `form: 'proposta'`, `variante: 'duas_etapas'` na etapa 1 (uma vez por formulário aberto); etapa 2 → `lead_qualificado`. Reusa `src/lib/medicaoLead.ts` (Tarefa 2.6).
- **R12 · Tela:** componente em `src/site/formularios/proposta/` (CSS global com tokens, um `.css` por componente), montado em `/previa-v2`; `/proposta` e `/contato` não mudam (Tarefa 2.6).
- **R13 · Migração** separada, primeiro, com parada obrigatória (Tarefa 2.1).
- **R14 · Testes** no padrão do repo (Vitest, mocks de módulo, import direto do módulo da action) — lista coberta na Auto-revisão.
- **R15 · Verificação final** por verificador separado (Tarefa 2.7).

Decisões de projeto deste plano (registradas para revisão):
- **DP1 · Colunas novas:** `etapa smallint check (etapa in (1, 2))`, `token_envio uuid unique`, `envio_em timestamptz default now()` e `exact_tentativa_em timestamptz`. O `default now()` é o que faz toda linha antiga (preenchida com a hora do `ALTER`) e toda linha gravada pelo código antigo valerem como "já processada"; só a etapa 1 nova grava `envio_em` nulo de propósito. Seguindo a convenção dos `db/*.sql`, nenhuma coluna `text` nova com `CHECK`.
- **DP2 · Marcadores de idempotência:** Exact = `exact_lead_id` (já existe) + `exact_tentativa_em` (trava do reenvio entre execuções do cron); e-mail interno + aviso ao lead = a própria reivindicação `envio_em` (sai uma vez, de quem reivindicou; não há reenvio de e-mail, como hoje); Ads = `uploaded_to_ads` (já existe) + `transactionId` estável. Sem coluna para o tipo de clique: ele vai em `data`, e o `INSERT` do formulário antigo não muda.
- **DP3 · Prazo do cookie = 2 h**, validade do token = 30 min no banco. O cookie mais longo é o que permite, com Turnstile novo, reaproveitar a linha de quem voltou depois dos 30 min (R5) em vez de criar duplicata.
- **DP4 · Experience fora do `ambiente`:** o `data` da inscrição vai para `cms.experience_lotacao($1::jsonb)`, função sem DDL neste repo; não alteramos a entrada dela. O evento (26/09/2026) já passou.
- **DP5 · PB sem cidade conhecida → região "João Pessoa"** (a caixa `comercial.pb@` atende as duas praças; revisável pelo Leandro).
- **DP6 · Cidade:** o cliente envia o texto final (a cidade escolhida ou o texto de "Outra cidade"); o servidor aceita texto livre até 120 caracteres e calcula a região pela UF da linha. Cidade de Unidade digitada com outra UF não vale como região.
- **DP7 · Telefone:** além da regra da spec, o `+55` colado (12 ou 13 dígitos começando com 55) é removido antes de validar; o campo não tem `maxlength` (que cortaria a colagem), quem limita é a máscara.
- **DP8 · Pós-gravação síncrona** dentro da action, como o Exact já é hoje (sem `after()`).
- **DP9 · Verificação local com Postgres descartável em Docker** (Tarefa 2.7): a action roda de verdade no Next local contra um banco local, nunca o de produção.
- **DP10 · `isExactEligible` passa a recusar `cliente = 'sim'`**; a mesma função decide os botões de desfecho e a elegibilidade ao Ads (quem é cliente não é lead).
- **DP11 · Rate limit:** etapa 1 e envio completo dividem a cota `proposta:<ip>` (5/min) com o formulário antigo; etapa 2 tem cota própria `proposta-etapa2:<ip>` (10/min).
- **DP12 · Sem JavaScript:** o Turnstile exige JS, então a tela sem JS mostra um aviso com os telefones das Unidades no lugar do formulário.

---

## Review Focus

- **Aba aberta antes do deploy (ID de Server Action trocado) ou rede caindo.** A action lança no cliente. Esperado: a tela mostra a falha com telefone e "Tentar de novo", e o erro vai ao Sentry do cliente; nunca tela em branco. Teste na Tarefa 2.6 ("action que lança").
- **Telefone colado com `+55` ou com zero no DDD.** Esperado: `+55 (83) 99950-1388` vira o mesmo `+5583999501388`; `(08) …` mostra "Confira o DDD". Teste na Tarefa 2.2.
- **Duplo clique em "Continuar" ou "Pedir proposta".** Esperado: uma chamada só ao servidor (botão desativado enquanto envia). Teste na Tarefa 2.6.
- **Pessoa que leva entre 30 e 45 min na etapa 2.** Esperado: `precisa_verificar`, Turnstile, e a MESMA linha concluída (sem segunda linha, sem segundo card no Exact). Teste na Tarefa 2.4.
- **Troca de UF ao voltar para a etapa 1 (PB → PE) com a cidade já marcada.** Esperado: a cidade marcada é limpa, a lista passa a ser a de PE e o e-mail interno passa a ir para Recife (o `UPDATE` da volta regrava `notificado_para`). Testes nas Tarefas 2.4 e 2.6.

---

## Estrutura de arquivos

| Caminho (na WT) | Responsabilidade |
| --- | --- |
| `db/leads-duas-etapas.sql` | migração idempotente das 4 colunas e do índice parcial |
| `scripts/migracao-leads-duas-etapas.ts` | `ler` (só leitura), `aplicar --confirmo`, `conferir` (INSERT/UPDATE reais em transação revertida) |
| `src/lib/propostaDuasEtapas/schema.ts` | UFs, cidades das Unidades, perfis → cargo, mensagens, telefone, schemas Zod das duas etapas (cliente e servidor) |
| `src/lib/propostaDuasEtapas/resultado.ts` | `ResultadoEtapa` (fora do módulo `'use server'`) |
| `src/lib/propostaDuasEtapas/cookie.ts` | cookie HttpOnly do token da etapa |
| `src/lib/propostaDuasEtapas/gravacao.ts` | SQL das duas etapas (inserir, atualizar, concluir, absorver, inserir completa) e contexto da requisição |
| `src/lib/leads/ambiente.ts` | `ambienteAtual`, `ambienteLiberaEnvio`, `SQL_AMBIENTE_LIBERADO` |
| `src/lib/leads/destinatarios.ts` | endereços das praças e roteamento por UF |
| `src/lib/leads/linha.ts` | `LinhaDoLead`, `COLUNAS_DA_LINHA`, `dadosParaOExact` |
| `src/lib/leads/reportar.ts` | `reportarFalhaDoLead` (log + Sentry sem PII) |
| `src/lib/leads/posGravacao.ts` | Exact + e-mail + Ads de uma linha reivindicada, uma vez cada |
| `src/lib/leads/criterios.ts` | SQL dos crons (reivindicar etapa 1, reenvio do Exact, lote do Ads) |
| `src/lib/ads/conversoes.ts` | config, token e `events:ingest` da Data Manager API |
| `src/app/(site)/_actions/proposta-duas-etapas.ts` | `'use server'`: `enviarEtapa1`, `enviarEtapa2`, `enviarPropostaCompleta` |
| `src/site/formularios/proposta/*` | tela: `FormularioProposta.tsx`, `campos.tsx`, `useEnvioDaProposta.ts`, `leitura.ts`, `cortina.ts`, `FalhaDoEnvio.tsx`, `textos.ts`, `formulario-proposta.css` |
| `src/site/secoes/proposta/SecaoProposta.tsx` + `proposta.css` | seção da prévia |

Modificados: `src/lib/forms.ts`, `src/lib/attribution.ts`, `src/lib/exact/map-lead.ts`, `src/lib/medicaoLead.ts`, `src/app/(frontend)/_actions/submit-form.ts`, `src/app/api/cron/push-exact-leads/route.ts`, `src/app/api/cron/upload-ads-conversions/route.ts`, `src/app/(site)/(app)/previa-v2/page.tsx`, `vercel.json`, `docs/DEPLOY.md`, e os testes citados em cada tarefa.

---

## Tarefa 2.1: Migração de `cms.leads` (primeiro, com parada obrigatória)

**Files:**
- Create: `db/leads-duas-etapas.sql`
- Create: `scripts/migracao-leads-duas-etapas.ts`

**Interfaces:**
- Consumes: `DATABASE_URI` do `cms_user` num `.env` **fora do repositório**, passado por `--env-file` (o checkout principal tem `C:\Users\lekoc\semogapp\semogsite\.env`; [A CONFIRMAR] que existe e aponta para o `cms_user`). A WT não tem `.env`.
- Produces: em `cms.leads`, as colunas `etapa smallint` (`check (etapa in (1, 2))`), `token_envio uuid unique`, `envio_em timestamptz default now()`, `exact_tentativa_em timestamptz`, e o índice `leads_etapa1_pendentes_idx`. As Tarefas 2.4 e 2.5 dependem delas; o código delas só é mergeado depois do Step 7 desta tarefa.

- [ ] **Step 1: Escrever a migração**

Arquivo `db/leads-duas-etapas.sql`:

```sql
-- Formulário de proposta em duas etapas (site v2, fase 2; spec 4.2 e 4.3).
--
-- Uma linha por lead: a etapa 1 grava (`etapa = 1`, `envio_em` nulo) e devolve
-- `token_envio` num cookie HttpOnly; a etapa 2 atualiza a MESMA linha pelo
-- token e a reivindica (`envio_em = now()`). Quem reivindica envia Exact,
-- e-mail interno e Ads uma vez (`src/lib/leads/posGravacao.ts`).
--
-- `envio_em` tem `default now()` DE PROPÓSITO: toda linha que já existe ganha a
-- hora deste ALTER e toda linha gravada pelo formulário antigo (que não cita a
-- coluna) nasce "já processada" — o formulário antigo envia na hora, dentro da
-- action. Só a etapa 1 nova grava `envio_em` nulo, explicitamente, e é ela que
-- o cron reivindica depois de 45 min sem a etapa 2.
--
-- `exact_tentativa_em` é a trava do reenvio ao Exact entre duas execuções do
-- cron (o Exact não deduplica: `duplicityValidation: false`).
--
-- `etapa` NULL = formulário antigo e assunto "proposta comercial" do contato:
-- não tem segunda etapa e vale como completo (spec 4.3).
--
-- A tabela pertence ao `cms_user` (ver `db/leads-desfecho.sql`), então este
-- ALTER roda pela própria `DATABASE_URI`, pelo script
-- `scripts/migracao-leads-duas-etapas.ts aplicar --confirmo`, nunca pelo SQL
-- Editor do Studio (que conecta como `postgres`).

alter table cms.leads
  add column if not exists etapa smallint
    constraint leads_etapa_check check (etapa in (1, 2)),
  add column if not exists token_envio uuid
    constraint leads_token_envio_key unique,
  add column if not exists envio_em timestamptz default now(),
  add column if not exists exact_tentativa_em timestamptz;

-- Índice parcial do critério do cron (etapa 1 ainda não reivindicada).
create index if not exists leads_etapa1_pendentes_idx
  on cms.leads (created_at)
  where envio_em is null and etapa = 1;
```

- [ ] **Step 2: Escrever o script de leitura, aplicação e conferência**

Arquivo `scripts/migracao-leads-duas-etapas.ts`:

```ts
// Migração de `cms.leads` para o formulário em duas etapas (db/leads-duas-etapas.sql).
//
//   pnpm exec tsx --env-file=<.env fora do repo> scripts/migracao-leads-duas-etapas.ts ler
//   pnpm exec tsx --env-file=<.env fora do repo> scripts/migracao-leads-duas-etapas.ts aplicar --confirmo
//   pnpm exec tsx --env-file=<.env fora do repo> scripts/migracao-leads-duas-etapas.ts conferir
//
// `ler` só lê (information_schema, pg_tables, pg_constraint). `aplicar` exige --confirmo e só
// roda depois do "ok" explícito do Leandro. `conferir` grava de verdade DENTRO de uma transação
// que sempre termina em ROLLBACK (consome números da sequência de `id`, nada mais). Nunca
// imprime a connection string.

import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { Pool, type PoolClient } from 'pg'

const COLUNAS_NOVAS = ['etapa', 'token_envio', 'envio_em', 'exact_tentativa_em'] as const
const MARCA = 'conferencia-migracao-duas-etapas'

function criarPool(): Pool {
  if (!process.env.DATABASE_URI) throw new Error('DATABASE_URI ausente: passe --env-file.')
  return new Pool({
    connectionString: process.env.DATABASE_URI,
    ssl: { rejectUnauthorized: false },
    max: 1,
  })
}

function afirmar(ok: boolean, o_que: string): void {
  console.log(`${ok ? 'OK    ' : 'FALHOU'}  ${o_que}`)
  if (!ok) process.exitCode = 1
}

async function ler(pool: Pool): Promise<void> {
  const quem = await pool.query<{ usuario: string }>('select current_user as usuario')
  const dono = await pool.query<{ tableowner: string }>(
    "select tableowner from pg_tables where schemaname = 'cms' and tablename = 'leads'",
  )
  const colunas = await pool.query<{
    column_name: string
    data_type: string
    is_nullable: string
    column_default: string | null
  }>(
    `select column_name, data_type, is_nullable, column_default
       from information_schema.columns
      where table_schema = 'cms' and table_name = 'leads'
      order by ordinal_position`,
  )
  const restricoes = await pool.query<{ conname: string; definicao: string }>(
    `select conname, pg_get_constraintdef(oid) as definicao
       from pg_constraint where conrelid = 'cms.leads'::regclass order by conname`,
  )
  console.log(`conectado como: ${quem.rows[0]?.usuario}`)
  console.log(`dono de cms.leads: ${dono.rows[0]?.tableowner ?? '(tabela não encontrada)'}`)
  console.table(colunas.rows)
  console.table(restricoes.rows)
  const faltam = COLUNAS_NOVAS.filter((c) => !colunas.rows.some((r) => r.column_name === c))
  console.log(faltam.length ? `colunas novas ausentes: ${faltam.join(', ')}` : 'as 4 colunas novas existem')
}

async function aplicar(pool: Pool): Promise<void> {
  if (!process.argv.includes('--confirmo')) {
    throw new Error('aplicar exige --confirmo (só depois do ok do Leandro, Tarefa 2.1 Step 5).')
  }
  const sql = readFileSync(path.join(process.cwd(), 'db', 'leads-duas-etapas.sql'), 'utf8')
  const cliente = await pool.connect()
  try {
    await cliente.query('begin')
    await cliente.query("set local lock_timeout = '5s'")
    await cliente.query(sql)
    await cliente.query('commit')
    console.log('db/leads-duas-etapas.sql aplicado.')
  } catch (erro) {
    await cliente.query('rollback')
    throw erro
  } finally {
    cliente.release()
  }
}

/** Código SQLSTATE do erro do comando, dentro de um savepoint (a transação segue viva). */
async function codigoDoErro(cliente: PoolClient, sql: string, params: unknown[]): Promise<string> {
  await cliente.query('savepoint tentativa')
  try {
    await cliente.query(sql, params)
    return 'sem erro'
  } catch (erro) {
    // `as`: o erro do pg é um Error com `code` (SQLSTATE); sem ele, devolvemos o texto.
    return (erro as { code?: string }).code ?? String(erro)
  } finally {
    await cliente.query('rollback to savepoint tentativa')
  }
}

const UPDATE_ETAPA_2 = `update cms.leads set data = data || $2::jsonb, etapa = 2, envio_em = now()
  where token_envio = $1 and etapa = 1 and envio_em is null
    and created_at > now() - interval '30 minutes' returning id`

async function conferirEmTransacao(cliente: PoolClient): Promise<void> {
  const token = randomUUID()
  const etapa1 = await cliente.query<{ etapa: number; envio_em: Date | null }>(
    `insert into cms.leads (form, data, etapa, token_envio, envio_em)
     values ('proposta', $1, 1, $2, null) returning etapa, envio_em`,
    [{ variante: 'duas-etapas', ambiente: MARCA }, token],
  )
  afirmar(etapa1.rows[0]?.etapa === 1 && etapa1.rows[0].envio_em === null, 'INSERT da etapa 1 com envio_em nulo')
  const antigo = await cliente.query<{ etapa: number | null; envio_em: Date | null }>(
    "insert into cms.leads (form, data) values ('proposta', $1) returning etapa, envio_em",
    [{ ambiente: MARCA }],
  )
  afirmar(
    antigo.rows[0]?.etapa === null && antigo.rows[0].envio_em instanceof Date,
    'INSERT do formulário antigo (sem as colunas novas) nasce com etapa nula e envio_em preenchido',
  )
  const etapa2 = await cliente.query(UPDATE_ETAPA_2, [token, { nome: 'Conferência' }])
  afirmar(etapa2.rowCount === 1, 'UPDATE da etapa 2 acha a linha pelo token')
  const repetido = await cliente.query(UPDATE_ETAPA_2, [token, { nome: 'Repetido' }])
  afirmar(repetido.rowCount === 0, 'o mesmo token não serve duas vezes (uso único)')
  const invalida = await codigoDoErro(cliente, "insert into cms.leads (form, data, etapa) values ('proposta', '{}'::jsonb, 3)", [])
  afirmar(invalida === '23514', `CHECK recusa etapa = 3 (SQLSTATE ${invalida})`)
  const duplicado = await codigoDoErro(
    cliente,
    "insert into cms.leads (form, data, token_envio) values ('proposta', '{}'::jsonb, $1)",
    [token],
  )
  afirmar(duplicado === '23505', `UNIQUE recusa token_envio repetido (SQLSTATE ${duplicado})`)
}

async function conferir(pool: Pool): Promise<void> {
  await ler(pool)
  const cliente = await pool.connect()
  try {
    await cliente.query('begin')
    await conferirEmTransacao(cliente)
  } finally {
    await cliente.query('rollback')
    cliente.release()
  }
  const sobrou = await pool.query<{ n: number }>(
    "select count(*)::int as n from cms.leads where data->>'ambiente' = $1",
    [MARCA],
  )
  afirmar(sobrou.rows[0]?.n === 0, 'nada da conferência ficou gravado (ROLLBACK)')
}

async function main(): Promise<void> {
  const acoes = { ler, aplicar, conferir } as const
  const nome = process.argv[2]
  if (nome !== 'ler' && nome !== 'aplicar' && nome !== 'conferir') {
    throw new Error('Uso: … migracao-leads-duas-etapas.ts ler | aplicar --confirmo | conferir')
  }
  const pool = criarPool()
  try {
    await acoes[nome](pool)
  } finally {
    await pool.end()
  }
}

main().catch((erro: unknown) => {
  console.error(erro instanceof Error ? erro.message : erro)
  process.exitCode = 1
})
```

- [ ] **Step 3: Portões locais do script (sem banco)**

```powershell
Set-Location C:\Users\lekoc\semogapp\semogsite-site-v2
pnpm exec biome check --write scripts/migracao-leads-duas-etapas.ts
pnpm exec biome ci ./scripts
pnpm exec tsc --noEmit
```

Expected: verdes. O `tsconfig.json` inclui `**/*.ts` (conferido em 16/10), então o script entra no `tsc`; confirmar com `pnpm exec tsc --noEmit --listFiles | Select-String migracao-leads` (uma linha).

- [ ] **Step 4: Leitura do estado real (só leitura)**

```powershell
pnpm exec tsx --env-file=C:\Users\lekoc\semogapp\semogsite\.env scripts/migracao-leads-duas-etapas.ts ler
```

Expected: `conectado como: cms_user`; `dono de cms.leads: cms_user`; a tabela de colunas bate com o mapa (id, created_at, form, data, gclid, email, uploaded_to_ads, exact_lead_id, exact_error, exact_attempts, ads_consent, desfecho*, notificado_para); `colunas novas ausentes: etapa, token_envio, envio_em, exact_tentativa_em`. **Se o dono não for o usuário conectado, ou se alguma coluna nova já existir com outro tipo, PARAR** e reportar (GRANT ou conflito; ver regra 1 do CLAUDE.md global sobre GRANT em Supabase).

- [ ] **Step 5: PARADA OBRIGATÓRIA — confirmação do Leandro**

Levar ao Leandro, numa mensagem só: a saída do Step 4 (sem a connection string), o conteúdo de `db/leads-duas-etapas.sql`, o efeito (ALTER com `lock_timeout` de 5 s; linhas existentes ganham `envio_em` = hora do ALTER; nada muda no comportamento do site no ar, porque o código atual não lê as colunas) e o rollback (as colunas novas não são lidas por ninguém até a Tarefa 2.4 ser mergeada; remover é `alter table cms.leads drop column …`, só se ele pedir). **Não seguir sem um "sim" explícito dele nesta conversa.** "Reportou DONE" de outro agente não é confirmação.

- [ ] **Step 6: Aplicar (só depois do "sim")**

```powershell
pnpm exec tsx --env-file=C:\Users\lekoc\semogapp\semogsite\.env scripts/migracao-leads-duas-etapas.ts aplicar --confirmo
```

Expected: `db/leads-duas-etapas.sql aplicado.`

- [ ] **Step 7: Conferir em `information_schema` e com INSERT real revertido**

```powershell
pnpm exec tsx --env-file=C:\Users\lekoc\semogapp\semogsite\.env scripts/migracao-leads-duas-etapas.ts conferir
```

Expected: `as 4 colunas novas existem`; `envio_em` com `column_default` `now()`; restrições `leads_etapa_check` e `leads_token_envio_key` listadas; seis linhas `OK` (INSERT etapa 1, INSERT antigo, UPDATE pelo token, uso único, CHECK 23514, UNIQUE 23505) e `OK nada da conferência ficou gravado`; código de saída 0. Rodar `conferir` duas vezes não muda nada (idempotente). Rodar `aplicar --confirmo` de novo também não (todos os `if not exists`).

- [ ] **Step 8: Commitar**

```powershell
git branch --show-current && git add db/leads-duas-etapas.sql scripts/migracao-leads-duas-etapas.ts && git commit -m "feat(leads): migração de cms.leads para a proposta em duas etapas

etapa, token_envio, envio_em (default now: linha antiga e do formulário antigo
nascem processadas) e exact_tentativa_em, com script de leitura, aplicação e
conferência por INSERT real em transação revertida. Aplicada em produção com o
ok do Leandro em <data>.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
```

(Trocar `<data>` pela data real do Step 6 antes de rodar; se o Leandro não confirmou, commitar sem essa frase e marcar a tarefa como bloqueada.)

---

## Tarefa 2.2: Regras puras — schema das duas etapas, ambiente, destinatários, região e clique do Google

**Files:**
- Create: `src/lib/propostaDuasEtapas/schema.ts`
- Create: `src/lib/leads/ambiente.ts`
- Create: `src/lib/leads/destinatarios.ts`
- Modify: `src/lib/forms.ts` (constantes `VARIANTE_DUAS_ETAPAS`, `TIPO_CLIQUE_FIELD`, depois de `VARIANTE_CONTATO_RAPIDO`, `:49`)
- Modify: `src/lib/attribution.ts:124-153` (`cliqueDoGoogle` e uso em `buildAttributionFields`)
- Modify: `src/lib/exact/map-lead.ts` (`regiaoDoLead`, `isExactEligible`, `informado`, `linhaDoFormulario`)
- Modify: `src/app/(frontend)/_actions/submit-form.ts:125-155` (endereços vêm de `destinatarios.ts`, sem mudança de comportamento)
- Test: `tests/int/proposta-duas-etapas-schema.int.spec.ts`, `tests/int/leads-regras.int.spec.ts`, `tests/int/attribution-clique.int.spec.ts`, `tests/int/exact-map-lead.int.spec.ts` (acrescentar)

**Interfaces:**
- Consumes: nada de tarefas anteriores.
- Produces:
  - `schema.ts`: `UFS_COM_UNIDADE`, `OUTRAS_UFS`, `UFS`, `type Uf`, `NOME_DA_UF: Record<Uf, string>`, `CIDADES_DAS_UNIDADES: Readonly<Record<string, readonly string[]>>`, `OUTRA_CIDADE`, `PERFIS`, `type Perfil`, `CARGO_DO_PERFIL: Record<Perfil, string>`, `MENSAGENS`, `soDigitos(v: string): string`, `digitosDoTelefone(v: string): string`, `formatarTelefone(d: string): string`, `erroTelefone(d: string): string`, `etapa1Schema`, `etapa2Schema`, `propostaCompletaSchema`, `type CamposEtapa1 = { nomeCondominio: string; uf: string; telefone: string; email: string }`, `type CamposEtapa2 = { nome: string; perfil: string; cidade: string; unidades: string; cliente: string }`, `type Etapa1Dados`, `type Etapa2Dados`, `dadosDaEtapa1(d: Etapa1Dados): Record<string, string>`, `dadosDaEtapa2(d: Etapa2Dados): Record<string, string>`, `errosPorCampo(issues: readonly { path: readonly PropertyKey[]; message: string }[]): Record<string, string>`.
  - `ambiente.ts`: `AMBIENTE_FIELD = 'ambiente'`, `ambienteAtual(env?: NodeJS.ProcessEnv): string`, `ambienteLiberaEnvio(data: Record<string, string>): boolean`, `SQL_AMBIENTE_LIBERADO: string`.
  - `destinatarios.ts`: `RECIFE_TO`, `PB_TO`, `BELEM_TO`, `TODAS_AS_PRACAS: readonly string[]`, `destinatariosPorUf(uf: string | undefined): readonly string[]`.
  - `forms.ts`: `VARIANTE_DUAS_ETAPAS = 'duas-etapas'`, `TIPO_CLIQUE_FIELD = 'origem — Tipo do clique (Google Ads)'`.
  - `attribution.ts`: `type CliqueDoGoogle = { tipo: 'gclid' | 'gbraid' | 'wbraid'; valor: string }`, `cliqueDoGoogle(attr: Attribution | null): CliqueDoGoogle | null`.
  - `map-lead.ts`: `regiaoDoLead(data: Record<string, string>): string | undefined`; `isExactEligible` recusa `data.cliente === 'sim'`.

- [ ] **Step 1: Escrever os testes que falham**

Arquivo `tests/int/proposta-duas-etapas-schema.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  CARGO_DO_PERFIL,
  CIDADES_DAS_UNIDADES,
  dadosDaEtapa1,
  dadosDaEtapa2,
  errosPorCampo,
  etapa1Schema,
  etapa2Schema,
  formatarTelefone,
  MENSAGENS,
  propostaCompletaSchema,
} from '@/lib/propostaDuasEtapas/schema'

const etapa1 = { nomeCondominio: ' Aurora ', uf: 'PB', telefone: '(83) 99950-1388', email: '' }

function errosDe(resultado: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) {
  return resultado.success || !resultado.error ? {} : errosPorCampo(resultado.error.issues)
}

describe('etapa 1 (spec 4.1)', () => {
  it('normaliza o telefone para E.164 e aceita e-mail vazio', () => {
    const r = etapa1Schema.safeParse(etapa1)
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(dadosDaEtapa1(r.data)).toEqual({
      nomeCondominio: 'Aurora',
      uf: 'PB',
      telefone: '+5583999501388',
      variante: 'duas-etapas',
    })
  })

  it('aceita fixo com 8 dígitos e e-mail informado', () => {
    const r = etapa1Schema.safeParse({ ...etapa1, telefone: '(81) 3316-0265', email: 'a@b.com.br' })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(dadosDaEtapa1(r.data)).toMatchObject({ telefone: '+558133160265', email: 'a@b.com.br' })
  })

  it('telefone colado com +55 vira o mesmo E.164 (Review Focus)', () => {
    const r = etapa1Schema.safeParse({ ...etapa1, telefone: '+55 (83) 99950-1388' })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.data.telefone).toBe('+5583999501388')
  })

  it.each([
    ['', MENSAGENS.telefoneVazio],
    ['(83) 9995', MENSAGENS.telefoneIncompleto],
    ['(08) 99950-1388', MENSAGENS.telefoneDdd],
    ['0 83 99950-13880', MENSAGENS.telefoneLongo],
  ])('telefone "%s" recusa com a mensagem certa', (telefone, mensagem) => {
    expect(errosDe(etapa1Schema.safeParse({ ...etapa1, telefone })).telefone).toBe(mensagem)
  })

  it('recusa condomínio vazio, UF fora da lista e e-mail malformado, um erro por campo', () => {
    const erros = errosDe(etapa1Schema.safeParse({ nomeCondominio: '  ', uf: 'XX', telefone: '(83) 99950-1388', email: 'sem-arroba' }))
    expect(erros).toEqual({ nomeCondominio: MENSAGENS.condominio, uf: MENSAGENS.uf, email: MENSAGENS.email })
  })
})

describe('etapa 2 (spec 4.1 e D2)', () => {
  it('mapeia o papel para o cargo que o formulário antigo grava e guarda unidades como inteiro', () => {
    const r = etapa2Schema.safeParse({ nome: 'Maria', perfil: 'construtora', cidade: 'Campina Grande', unidades: '0120', cliente: 'nao' })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(dadosDaEtapa2(r.data)).toEqual({
      nome: 'Maria',
      cargo: 'Incorporador(a) / Construtora',
      cliente: 'nao',
      cidade: 'Campina Grande',
      unidades: '120',
    })
  })

  it('unidades vazia ou zero não grava a chave; cidade vazia também não', () => {
    const r = etapa2Schema.safeParse({ nome: 'Maria', perfil: 'sindico', cidade: '', unidades: '0', cliente: 'sim' })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(dadosDaEtapa2(r.data)).toEqual({ nome: 'Maria', cargo: 'Síndico(a)', cliente: 'sim' })
  })

  it('recusa sem nome, sem papel, sem resposta de cliente e com unidades não numéricas', () => {
    const erros = errosDe(etapa2Schema.safeParse({ nome: '', perfil: '', cidade: '', unidades: '12a', cliente: '' }))
    expect(erros).toEqual({
      nome: MENSAGENS.nome,
      perfil: MENSAGENS.perfil,
      unidades: MENSAGENS.unidades,
      cliente: MENSAGENS.cliente,
    })
  })

  it('os quatro cargos são valores que o formulário antigo já usa (CARGO_OPTIONS)', () => {
    expect(Object.values(CARGO_DO_PERFIL)).toEqual([
      'Síndico(a)',
      'Conselheiro(a)',
      'Morador(a)',
      'Incorporador(a) / Construtora',
    ])
  })

  it('cidades das Unidades por UF (D2)', () => {
    expect(CIDADES_DAS_UNIDADES).toEqual({ PE: ['Recife'], PB: ['João Pessoa', 'Campina Grande'], PA: ['Belém'] })
  })
})

describe('proposta completa (R5)', () => {
  it('exige os campos das duas etapas juntos', () => {
    const r = propostaCompletaSchema.safeParse({ ...etapa1, nome: 'Maria', perfil: 'morador', cidade: '', unidades: '', cliente: 'nao' })
    expect(r.success).toBe(true)
    expect(propostaCompletaSchema.safeParse(etapa1).success).toBe(false)
  })
})

describe('máscara do telefone (protótipo)', () => {
  it.each([
    ['', ''],
    ['83', '(83'],
    ['8399', '(83) 99'],
    ['8333160265', '(83) 3316-0265'],
    ['83999501388', '(83) 99950-1388'],
  ])('%s → %s', (digitos, formatado) => expect(formatarTelefone(digitos)).toBe(formatado))
})
```

Arquivo `tests/int/leads-regras.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { ambienteAtual, ambienteLiberaEnvio, SQL_AMBIENTE_LIBERADO } from '@/lib/leads/ambiente'
import { destinatariosPorUf } from '@/lib/leads/destinatarios'

const TRES = ['ivan@semog.com.br', 'galvao@semog.com.br', 'comercial.pb@semog.com.br']

describe('roteamento do e-mail interno pela UF (spec 4.3, R3)', () => {
  it.each([
    ['PE', ['ivan@semog.com.br']],
    ['PB', ['comercial.pb@semog.com.br']],
    ['PA', ['galvao@semog.com.br']],
    ['SP', TRES],
    ['', TRES],
    [undefined, TRES],
  ])('%s → %o', (uf, destino) => expect(destinatariosPorUf(uf)).toEqual(destino))
})

describe('ambiente (R1)', () => {
  it('lê VERCEL_ENV e cai em local fora da Vercel', () => {
    expect(ambienteAtual({ VERCEL_ENV: 'production' })).toBe('production')
    expect(ambienteAtual({ VERCEL_ENV: 'preview' })).toBe('preview')
    expect(ambienteAtual({})).toBe('local')
  })

  it('só produção ou linha antiga (sem a chave) libera envio', () => {
    expect(ambienteLiberaEnvio({})).toBe(true)
    expect(ambienteLiberaEnvio({ ambiente: 'production' })).toBe(true)
    expect(ambienteLiberaEnvio({ ambiente: 'preview' })).toBe(false)
    expect(ambienteLiberaEnvio({ ambiente: 'local' })).toBe(false)
    expect(ambienteLiberaEnvio({ ambiente: 'development' })).toBe(false)
  })

  it('o SQL espelha a mesma regra', () => {
    expect(SQL_AMBIENTE_LIBERADO).toBe("coalesce(data->>'ambiente', 'production') = 'production'")
  })
})
```

Arquivo `tests/int/attribution-clique.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { buildAttributionFields, cliqueDoGoogle } from '@/lib/attribution'

describe('clique do Google do lead (R9)', () => {
  it('usa o do primeiro toque quando existe', () => {
    expect(cliqueDoGoogle({ first: { gclid: 'A' }, last: { gclid: 'B' } })).toEqual({ tipo: 'gclid', valor: 'A' })
  })

  it('sem clique no primeiro toque, usa o do último (como o beacon do WhatsApp)', () => {
    expect(cliqueDoGoogle({ first: { source: 'google', medium: 'organic' }, last: { gclid: 'B' } })).toEqual({
      tipo: 'gclid',
      valor: 'B',
    })
  })

  it('gbraid e wbraid saem com o tipo próprio', () => {
    expect(cliqueDoGoogle({ first: { gbraid: 'G' }, last: {} })).toEqual({ tipo: 'gbraid', valor: 'G' })
    expect(cliqueDoGoogle({ first: {}, last: { wbraid: 'W' } })).toEqual({ tipo: 'wbraid', valor: 'W' })
  })

  it('sem atribuição, nenhum clique', () => {
    expect(cliqueDoGoogle(null)).toBeNull()
    expect(cliqueDoGoogle({ first: {}, last: {} })).toBeNull()
  })

  it('a atribuição grava o clique do último toque e o tipo quando não é gclid', () => {
    const campos = buildAttributionFields({ first: { landing: '/' }, last: { wbraid: 'W' } })
    expect(campos).toContainEqual({ label: 'gclid (Google Ads)', value: 'W' })
    expect(campos).toContainEqual({ label: 'Tipo do clique (Google Ads)', value: 'wbraid' })
  })

  it('gclid comum não ganha a linha de tipo', () => {
    const campos = buildAttributionFields({ first: { gclid: 'A' }, last: {} })
    expect(campos.map((c) => c.label)).not.toContain('Tipo do clique (Google Ads)')
  })
})
```

Acrescentar ao fim de `tests/int/exact-map-lead.int.spec.ts` (o `import` de `isExactEligible`/`mapLead` já existe no topo; acrescentar `regiaoDoLead` a ele):

```ts
describe('formulário de duas etapas no Exact (spec 4.3)', () => {
  it.each([
    [{ uf: 'PB', cidade: 'Campina Grande' }, 'Campina Grande'],
    [{ uf: 'PB', cidade: 'João Pessoa' }, 'João Pessoa'],
    [{ uf: 'PE', cidade: 'Recife' }, 'Recife'],
    [{ uf: 'PA', cidade: 'Belém' }, 'Belém'],
    [{ uf: 'PB', cidade: 'Mamanguape' }, 'João Pessoa'],
    [{ uf: 'PE', cidade: 'Caruaru' }, 'Recife'],
    [{ uf: 'PA' }, 'Belém'],
    [{ uf: 'PB' }, 'João Pessoa'],
    [{ uf: 'SP', cidade: 'Campinas' }, undefined],
    [{ uf: 'SP', cidade: 'Recife' }, undefined],
    [{ cidade: 'Belém e região' }, 'Belém'],
    [{ cidade: 'Outra cidade' }, undefined],
  ])('região de %o → %s', (data, regiao) => {
    expect(regiaoDoLead(data)).toBe(regiao)
  })

  it('quem já é cliente não é elegível; quem não é (ou o formulário antigo) é', () => {
    expect(isExactEligible('proposta', { cliente: 'sim' })).toBe(false)
    expect(isExactEligible('proposta', { cliente: 'nao' })).toBe(true)
    expect(isExactEligible('proposta', {})).toBe(true)
  })

  it('etapa 1 sozinha sai como parcial, com UF e nome do condomínio', () => {
    const { lead, person } = mapLead(
      'proposta',
      { nomeCondominio: 'Aurora', uf: 'PB', telefone: '+5583999501388', variante: 'duas-etapas', etapa: '1' },
      'sdr@semog.com.br',
    )
    expect(lead.name).toBe('Aurora')
    expect(lead.industry).toBe('João Pessoa')
    expect(lead.description).toContain('parcial: só etapa 1')
    expect(lead.description).toContain('UF: PB')
    expect(person.name).toBe('Contato do site')
  })

  it('etapa 2 leva papel, unidades, cidade e "já é cliente: não" na descrição', () => {
    const { lead, person } = mapLead(
      'proposta',
      {
        nomeCondominio: 'Aurora',
        uf: 'PB',
        telefone: '+5583999501388',
        nome: 'Maria',
        cargo: 'Síndico(a)',
        cidade: 'Campina Grande',
        unidades: '120',
        cliente: 'nao',
        variante: 'duas-etapas',
        etapa: '2',
      },
      'sdr@semog.com.br',
    )
    expect(lead.industry).toBe('Campina Grande')
    expect(lead.description).toContain('papel: Síndico(a)')
    expect(lead.description).toContain('unidades: 120')
    expect(lead.description).toContain('já é cliente: não')
    expect(lead.description).toContain('Origem: formulário de proposta do site (duas etapas).')
    expect(person).toMatchObject({ name: 'Maria', jobTitle: 'Síndico(a)' })
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/proposta-duas-etapas-schema.int.spec.ts tests/int/leads-regras.int.spec.ts tests/int/attribution-clique.int.spec.ts tests/int/exact-map-lead.int.spec.ts`
Expected: FAIL — módulos `@/lib/propostaDuasEtapas/schema`, `@/lib/leads/ambiente`, `@/lib/leads/destinatarios` não existem; `cliqueDoGoogle` e `regiaoDoLead` não exportados.

- [ ] **Step 3: Constantes em `src/lib/forms.ts`**

Logo depois de `export const VARIANTE_CONTATO_RAPIDO = 'contato-rapido'`:

```ts
/**
 * Valor de `data.variante` do formulário de proposta em duas etapas do site v2 (spec 4.2). Grava
 * como `form = 'proposta'`; é esta marca que faz o Exact dizer "duas etapas" ou "parcial".
 */
export const VARIANTE_DUAS_ETAPAS = 'duas-etapas'

/**
 * Tipo do clique do Google quando NÃO é gclid (`gbraid`/`wbraid`). O valor continua em
 * `GCLID_FIELD` (é o que a coluna `gclid`, o `source` Anúncio do Exact e os crons leem); este
 * campo diz ao envio do Ads em qual campo de `AdIdentifiers` ele vai. Ausente = gclid.
 */
export const TIPO_CLIQUE_FIELD = 'origem — Tipo do clique (Google Ads)'
```

- [ ] **Step 4: `src/lib/leads/ambiente.ts` e `src/lib/leads/destinatarios.ts`**

```ts
/**
 * Preview e local gravam no MESMO `cms.leads` de produção (docs/DEPLOY.md, seção 4). Cada linha
 * nova grava de onde veio, e Exact, e-mail interno e Ads só processam produção ou linha antiga
 * (sem a chave). Sem isso o cron de produção mandaria ao CRM o teste de um Preview.
 */
export const AMBIENTE_FIELD = 'ambiente'

/** `VERCEL_ENV` (production | preview | development) ou `local` fora da Vercel. */
export function ambienteAtual(env: NodeJS.ProcessEnv = process.env): string {
  return env.VERCEL_ENV || 'local'
}

export function ambienteLiberaEnvio(data: Record<string, string>): boolean {
  const ambiente = data[AMBIENTE_FIELD]
  return ambiente === undefined || ambiente === 'production'
}

/** A mesma regra em SQL, para os crons. Linha antiga não tem a chave e vale como produção. */
export const SQL_AMBIENTE_LIBERADO = "coalesce(data->>'ambiente', 'production') = 'production'"
```

```ts
/**
 * Caixas das praças que recebem a notificação interna de proposta. São as mesmas que o formulário
 * antigo já usa (`submit-form.ts`, roteamento por cidade); aqui também por UF, para o formulário
 * de duas etapas, que conhece a UF desde a etapa 1 (spec 4.3).
 */
export const RECIFE_TO = 'ivan@semog.com.br'
export const PB_TO = 'comercial.pb@semog.com.br'
export const BELEM_TO = 'galvao@semog.com.br'

/** UF sem Unidade: os três num e-mail só (cada um vê que os outros receberam). */
export const TODAS_AS_PRACAS: readonly string[] = [RECIFE_TO, BELEM_TO, PB_TO]

const POR_UF: Readonly<Record<string, readonly string[]>> = {
  PE: [RECIFE_TO],
  PB: [PB_TO],
  PA: [BELEM_TO],
}

export function destinatariosPorUf(uf: string | undefined): readonly string[] {
  return (uf && POR_UF[uf]) || TODAS_AS_PRACAS
}
```

- [ ] **Step 5: `src/lib/propostaDuasEtapas/schema.ts`**

```ts
import { z } from 'zod'
import { VARIANTE_DUAS_ETAPAS } from '@/lib/forms'

/**
 * Formulário de proposta em duas etapas (site v2, spec 4.1). Fonte única das regras de campo: a
 * tela valida com estes schemas antes de enviar e as Server Actions validam de novo. Mensagens do
 * protótipo (`core/formulario-proposta.js`). Fica fora de `form-schemas.ts` para não misturar com o
 * formulário antigo, que segue no ar até a virada (spec 4.2).
 */

export const UFS_COM_UNIDADE = ['PE', 'PB', 'PA'] as const
export const OUTRAS_UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PR', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const
export const UFS = [...UFS_COM_UNIDADE, ...OUTRAS_UFS] as const
export type Uf = (typeof UFS)[number]

export const NOME_DA_UF: Record<Uf, string> = {
  PE: 'Pernambuco', PB: 'Paraíba', PA: 'Pará', AC: 'Acre', AL: 'Alagoas', AP: 'Amapá',
  AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo',
  GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais',
  PR: 'Paraná', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina',
  SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins',
}

/** Cidades das Unidades Semog por UF (D2, Leandro, 16/10/2026). UF fora daqui: só texto livre. */
export const CIDADES_DAS_UNIDADES: Readonly<Record<string, readonly string[]>> = {
  PE: ['Recife'],
  PB: ['João Pessoa', 'Campina Grande'],
  PA: ['Belém'],
}
export const OUTRA_CIDADE = 'Outra cidade'

export const PERFIS = ['sindico', 'conselheiro', 'morador', 'construtora'] as const
export type Perfil = (typeof PERFIS)[number]

/** Papel da spec → `cargo` que o formulário antigo já grava (Exact, e-mail e desfecho leem). */
export const CARGO_DO_PERFIL: Record<Perfil, string> = {
  sindico: 'Síndico(a)',
  conselheiro: 'Conselheiro(a)',
  morador: 'Morador(a)',
  construtora: 'Incorporador(a) / Construtora',
}

export const MENSAGENS = {
  condominio: 'Informe o nome do condomínio.',
  uf: 'Selecione o estado.',
  telefoneVazio: 'Informe o telefone com DDD.',
  telefoneIncompleto: 'Telefone incompleto: DDD e número, como (81) 99999-9999.',
  telefoneDdd: 'Confira o DDD: são dois dígitos, como 81.',
  telefoneLongo: 'Confira o telefone: DDD e número, como (81) 99999-9999.',
  email: 'Confira o e-mail: falta algo como nome@provedor.com.br.',
  nome: 'Informe seu nome.',
  perfil: 'Escolha uma opção.',
  cliente: 'Responda sim ou não.',
  cidade: 'Escolha a cidade.',
  unidades: 'Use só números, como 120.',
  longo: 'Use no máximo 120 caracteres.',
} as const

export function soDigitos(valor: string): string {
  return valor.replace(/\D/g, '')
}

/** Dígitos do telefone sem o +55 colado (autopreenchimento e cópia de assinatura trazem o país). */
export function digitosDoTelefone(valor: string): string {
  const d = soDigitos(valor)
  return (d.length === 12 || d.length === 13) && d.startsWith('55') ? d.slice(2) : d
}

/** "81999998888" → "(81) 99999-8888"; aceita parcial. */
export function formatarTelefone(d: string): string {
  if (!d) return ''
  if (d.length <= 2) return `(${d}`
  const ddd = d.slice(0, 2)
  const resto = d.slice(2)
  if (resto.length <= 4) return `(${ddd}) ${resto}`
  const corte = resto.length === 9 ? 5 : 4
  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`
}

/** DDD de 2 dígitos sem zero na frente + 8 ou 9 dígitos (spec 4.1). "" = válido. */
export function erroTelefone(d: string): string {
  if (!d) return MENSAGENS.telefoneVazio
  if (d.length < 10) return MENSAGENS.telefoneIncompleto
  if (d.length > 11) return MENSAGENS.telefoneLongo
  if (d.startsWith('0')) return MENSAGENS.telefoneDdd
  return ''
}

const textoObrigatorio = (mensagem: string) =>
  z.string().trim().min(1, mensagem).max(120, MENSAGENS.longo)

const telefoneBr = z
  .string()
  .transform(digitosDoTelefone)
  .superRefine((d, ctx) => {
    const erro = erroTelefone(d)
    if (erro) ctx.addIssue({ code: 'custom', message: erro })
  })
  .transform((d) => `+55${d}`)

const emailOpcional = z
  .string()
  .trim()
  .max(254, MENSAGENS.email)
  .refine((v) => v === '' || z.email().safeParse(v).success, MENSAGENS.email)
  .optional()

export const etapa1Schema = z.object({
  nomeCondominio: textoObrigatorio(MENSAGENS.condominio),
  uf: z.enum(UFS, MENSAGENS.uf),
  telefone: telefoneBr,
  email: emailOpcional,
})

export const etapa2Schema = z.object({
  nome: textoObrigatorio(MENSAGENS.nome),
  perfil: z.enum(PERFIS, MENSAGENS.perfil),
  cidade: z.string().trim().max(120, MENSAGENS.longo).optional(),
  unidades: z.string().trim().regex(/^\d{0,5}$/, MENSAGENS.unidades).optional(),
  cliente: z.enum(['sim', 'nao'], MENSAGENS.cliente),
})

/** Token perdido (R5): as duas etapas juntas, com Turnstile novo. */
export const propostaCompletaSchema = etapa1Schema.extend(etapa2Schema.shape)

/** O que a tela lê do formulário e manda às actions (texto cru; o servidor normaliza). */
export type CamposEtapa1 = { nomeCondominio: string; uf: string; telefone: string; email: string }
export type CamposEtapa2 = { nome: string; perfil: string; cidade: string; unidades: string; cliente: string }

export type Etapa1Dados = z.output<typeof etapa1Schema>
export type Etapa2Dados = z.output<typeof etapa2Schema>

/** Chaves de `cms.leads.data` da etapa 1 (as que Exact, desfecho e e-mail já leem, mais `uf`). */
export function dadosDaEtapa1(d: Etapa1Dados): Record<string, string> {
  const dados: Record<string, string> = {
    nomeCondominio: d.nomeCondominio,
    uf: d.uf,
    telefone: d.telefone,
    variante: VARIANTE_DUAS_ETAPAS,
  }
  if (d.email) dados.email = d.email
  return dados
}

export function dadosDaEtapa2(d: Etapa2Dados): Record<string, string> {
  const dados: Record<string, string> = { nome: d.nome, cargo: CARGO_DO_PERFIL[d.perfil], cliente: d.cliente }
  if (d.cidade) dados.cidade = d.cidade
  const unidades = d.unidades ? Number.parseInt(d.unidades, 10) : 0
  if (unidades > 0) dados.unidades = String(unidades)
  return dados
}

/** Primeiro erro de cada campo (`path[0]`), como `flattenZodErrors` do formulário antigo. */
export function errosPorCampo(
  issues: readonly { path: readonly PropertyKey[]; message: string }[],
): Record<string, string> {
  const erros: Record<string, string> = {}
  for (const issue of issues) {
    const campo = issue.path[0]
    if (typeof campo === 'string' && !(campo in erros)) erros[campo] = issue.message
  }
  return erros
}
```

(O `biome check --write` vai reformatar as listas de UF em uma por linha; tudo bem.)

- [ ] **Step 6: `cliqueDoGoogle` em `src/lib/attribution.ts`**

Acrescentar antes de `buildAttributionFields`:

```ts
export type CliqueDoGoogle = { tipo: 'gclid' | 'gbraid' | 'wbraid'; valor: string }

/**
 * Click id do Google do lead: o do primeiro toque, senão o do último (como o beacon do WhatsApp,
 * `api/track/whatsapp`). Dentro de um toque, gclid > gbraid > wbraid. Os três são campos
 * distintos em `AdIdentifiers` da Data Manager API, por isso o tipo viaja junto.
 */
export function cliqueDoGoogle(attr: Attribution | null): CliqueDoGoogle | null {
  for (const toque of [attr?.first, attr?.last]) {
    if (!toque) continue
    if (toque.gclid) return { tipo: 'gclid', valor: toque.gclid }
    if (toque.gbraid) return { tipo: 'gbraid', valor: toque.gbraid }
    if (toque.wbraid) return { tipo: 'wbraid', valor: toque.wbraid }
  }
  return null
}
```

Em `buildAttributionFields`, trocar as duas linhas

```ts
  const clickId = first.gclid ?? first.gbraid ?? first.wbraid
  if (clickId) fields.push({ label: 'gclid (Google Ads)', value: clickId })
```

por

```ts
  // O rótulo continua "gclid" também para gbraid/wbraid: é a chave que a coluna `gclid`, o
  // `source` Anúncio do Exact e os crons já leem (`GCLID_FIELD`). O tipo vai numa linha própria.
  const clique = cliqueDoGoogle(attr)
  if (clique) {
    fields.push({ label: 'gclid (Google Ads)', value: clique.valor })
    if (clique.tipo !== 'gclid') fields.push({ label: 'Tipo do clique (Google Ads)', value: clique.tipo })
  }
```

- [ ] **Step 7: `src/lib/exact/map-lead.ts`**

1. Imports: `import { type FormType, GCLID_FIELD, VARIANTE_CONTATO_RAPIDO, VARIANTE_DUAS_ETAPAS } from '@/lib/forms'` e `import { CIDADES_DAS_UNIDADES } from '@/lib/propostaDuasEtapas/schema'`.
2. Depois de `REGIAO_POR_CIDADE`, acrescentar:

```ts
/** Região pela UF quando a cidade não é de Unidade ("Outra cidade" ou só a etapa 1). PB → João Pessoa (DP5). */
const REGIAO_DA_UF: Readonly<Record<string, string>> = { PE: 'Recife', PB: 'João Pessoa', PA: 'Belém' }

/**
 * "Mercado" do Exact. Formulário antigo: pelas opções "X e região". Duas etapas: a cidade, se for
 * de uma Unidade da mesma UF (os nomes coincidem com os do Exact), senão a região da UF (D2).
 */
export function regiaoDoLead(data: Record<string, string>): string | undefined {
  const cidade = nonEmpty(data.cidade) ?? ''
  const antiga = REGIAO_POR_CIDADE[cidade]
  if (antiga) return antiga
  const uf = nonEmpty(data.uf)
  if (!uf) return undefined
  if ((CIDADES_DAS_UNIDADES[uf] ?? []).includes(cidade)) return cidade
  return REGIAO_DA_UF[uf]
}
```

3. `isExactEligible`: trocar `if (formType === 'proposta') return true` por

```ts
  // "Já sou cliente" (etapa 2 do formulário v2) não é lead: nem card, nem Ads, nem desfecho (spec 4.3).
  if (formType === 'proposta') return data.cliente !== 'sim'
```

4. `linhaDoFormulario`: antes do `return 'Origem: formulário de proposta do site.'`, acrescentar

```ts
  if (data.variante === VARIANTE_DUAS_ETAPAS) {
    // `etapa` não é gravada em `data`: vem da coluna, juntada por `dadosParaOExact`.
    return data.etapa === '1'
      ? 'Origem: formulário de proposta do site, parcial: só etapa 1 (a pessoa não concluiu a etapa 2).'
      : 'Origem: formulário de proposta do site (duas etapas).'
  }
```

5. Na lista `informado`, depois da linha de `cidade`, acrescentar

```ts
    nonEmpty(data.uf) && `UF: ${data.uf}`,
    nonEmpty(data.cliente) && `já é cliente: ${data.cliente === 'sim' ? 'sim' : 'não'}`,
```

6. Em `mapLead`, trocar `industry: REGIAO_POR_CIDADE[nonEmpty(data.cidade) ?? ''],` por `industry: regiaoDoLead(data),`.

- [ ] **Step 8: `submit-form.ts` passa a importar os endereços (sem mudança de comportamento)**

Em `src/app/(frontend)/_actions/submit-form.ts`: acrescentar `import { BELEM_TO, PB_TO, RECIFE_TO, TODAS_AS_PRACAS } from '@/lib/leads/destinatarios'`; remover o bloco `const PB_TO = 'comercial.pb@semog.com.br'` com seu docblock (`:125-129`); trocar o objeto de `PROPOSTA_CIDADE_TO` (`:149-155`, docblock mantido) por

```ts
const PROPOSTA_CIDADE_TO: Record<PropostaValues['cidade'], readonly string[]> = {
  'Recife e região': [RECIFE_TO],
  'João Pessoa e região': [PB_TO],
  'Campina Grande e região': [PB_TO],
  'Belém e região': [BELEM_TO],
  'Outra cidade': TODAS_AS_PRACAS,
}
```

e `const EXPERIENCE_TO = 'comercial.pb@semog.com.br'` por `const EXPERIENCE_TO = PB_TO`.

- [ ] **Step 9: Rodar e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/proposta-duas-etapas-schema.int.spec.ts tests/int/leads-regras.int.spec.ts tests/int/attribution-clique.int.spec.ts tests/int/exact-map-lead.int.spec.ts tests/int/submit-form.int.spec.ts tests/int/forms-defs.int.spec.ts`
Expected: PASS (os de `submit-form` continuam verdes: roteamento por cidade igual, inclusive a ordem `ivan, galvao, comercial.pb` de "Outra cidade").

- [ ] **Step 10: Checkpoint: portões e commitar**

```powershell
pnpm exec biome check --write src/lib/propostaDuasEtapas/schema.ts src/lib/leads/ambiente.ts src/lib/leads/destinatarios.ts src/lib/forms.ts src/lib/attribution.ts src/lib/exact/map-lead.ts "src/app/(frontend)/_actions/submit-form.ts" tests/int/proposta-duas-etapas-schema.int.spec.ts tests/int/leads-regras.int.spec.ts tests/int/attribution-clique.int.spec.ts tests/int/exact-map-lead.int.spec.ts
pnpm exec biome ci ./src ./tests ./scripts
pnpm exec tsc --noEmit
pnpm run check:server-actions
pnpm run test:int
git branch --show-current && git add src/lib/propostaDuasEtapas/schema.ts src/lib/leads/ambiente.ts src/lib/leads/destinatarios.ts src/lib/forms.ts src/lib/attribution.ts src/lib/exact/map-lead.ts "src/app/(frontend)/_actions/submit-form.ts" tests/int/proposta-duas-etapas-schema.int.spec.ts tests/int/leads-regras.int.spec.ts tests/int/attribution-clique.int.spec.ts tests/int/exact-map-lead.int.spec.ts && git commit -m "feat(leads): regras da proposta em duas etapas, ambiente, roteamento por UF e clique do Google

Schema Zod das duas etapas (telefone BR em E.164, papel para cargo), região do
Exact pela cidade da Unidade ou pela UF, quem já é cliente fora do Exact, e o
clique do Google do primeiro ou do último toque com gbraid/wbraid separados.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
```

Expected: os quatro portões verdes; `git diff --cached --stat` só com esses arquivos.

---

## Tarefa 2.3: Envio pós-gravação compartilhado (Exact + e-mail + Ads), Sentry sem PII

**Files:**
- Create: `src/lib/leads/reportar.ts`
- Create: `src/lib/leads/linha.ts`
- Create: `src/lib/ads/conversoes.ts`
- Create: `src/lib/leads/posGravacao.ts`
- Test: `tests/int/ads-conversoes.int.spec.ts`, `tests/int/lead-pos-gravacao.int.spec.ts`

**Interfaces:**
- Consumes (2.2): `ambienteLiberaEnvio`, `isExactEligible`, `TIPO_CLIQUE_FIELD`, `CliqueDoGoogle`. Existentes: `pushLeadToExact(formType, data): Promise<PushResult | null>` (`src/lib/exact/push-lead.ts`), `sendMail({ to, subject, react }): Promise<SendMailResult>` (`src/lib/sendgrid.ts:31`), `ContactNotification({ formTitle, fields, attribution, desfecho })`, `ContactAutoReply({ name })`, `botoesDeDesfecho(leadId): BotaoDeDesfecho[] | null`, `paraDataManager(valor: string | null)`, `query<T>(text, params)`.
- Produces:
  - `reportar.ts`: `type PassoDoLead = 'gravacao' | 'exact' | 'email' | 'ads' | 'pos_gravacao' | 'cron'`, `reportarFalhaDoLead(passo: PassoDoLead, erro: unknown, contexto: { origem: string; leadId?: string }): void`.
  - `linha.ts`: `type LinhaDoLead = { id: string; form: FormType; etapa: 1 | 2 | null; data: Record<string, string>; gclid: string | null; ads_consent: string | null; created_at: string | Date; notificado_para: string | null }`, `COLUNAS_DA_LINHA = 'id, form, etapa, data, gclid, ads_consent, created_at, notificado_para'`, `dadosParaOExact(linha: { data: Record<string, string>; etapa?: 1 | 2 | null }): Record<string, string>`.
  - `conversoes.ts`: `type TipoDeClique = CliqueDoGoogle['tipo']`, `type ConfigAds = { login: string; customer: string; acaoProposta: string; acaoWhatsapp?: string; subject: string; saJson: string }`, `type EventoDeConversao = { transactionId: string; tipoDeClique: TipoDeClique; clique: string; criadoEm: string | Date; adsConsent: string | null }`, `type ResultadoIngest = { ok: boolean; status: number; resposta: string }`, `tipoDeClique(valor: string | null | undefined): TipoDeClique`, `lerConfigAds(env?: NodeJS.ProcessEnv): ConfigAds | null`, `obterTokenAds(config: ConfigAds): Promise<string | null>`, `corpoDoIngest(config, destinoId: string, eventos: readonly EventoDeConversao[])`, `ingerirConversoes(token: string, config: ConfigAds, destinoId: string, eventos: readonly EventoDeConversao[]): Promise<ResultadoIngest>`.
  - `posGravacao.ts`: `type OrigemDoEnvio = 'acao' | 'cron'`, `type ResumoPosGravacao = { exact: 'enviado' | 'falhou' | 'nao_enviado' | 'bloqueado'; email: 'enviado' | 'falhou' | 'sem_destino' | 'bloqueado'; ads: 'enviado' | 'falhou' | 'sem_clique' | 'nao_elegivel' | 'sem_configuracao' | 'bloqueado' }`, `processarPosGravacao(linha: LinhaDoLead, origem: OrigemDoEnvio): Promise<ResumoPosGravacao>` (nunca lança), `camposDoEmail(data: Record<string, string>): { label: string; value: string }[]`.

- [ ] **Step 1: Escrever os testes que falham**

Arquivo `tests/int/ads-conversoes.int.spec.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const { corpoDoIngest, lerConfigAds, tipoDeClique } = await import('@/lib/ads/conversoes')

const CONFIG = {
  login: '1112223333',
  customer: '4445556666',
  acaoProposta: '999',
  subject: 'sa@semog.com.br',
  saJson: '{}',
}

describe('Data Manager API (D1, R9)', () => {
  it('tipo de clique desconhecido ou ausente vai como gclid (formato de hoje)', () => {
    expect(tipoDeClique(undefined)).toBe('gclid')
    expect(tipoDeClique(null)).toBe('gclid')
    expect(tipoDeClique('qualquer')).toBe('gclid')
    expect(tipoDeClique('gbraid')).toBe('gbraid')
    expect(tipoDeClique('wbraid')).toBe('wbraid')
  })

  it('cada clique vai no campo próprio de AdIdentifiers, com transactionId e consentimento', () => {
    const corpo = corpoDoIngest(CONFIG, '999', [
      { transactionId: 'lead-1', tipoDeClique: 'gclid', clique: 'C', criadoEm: '2026-10-16T12:00:00.000Z', adsConsent: 'granted' },
      { transactionId: 'lead-2', tipoDeClique: 'gbraid', clique: 'G', criadoEm: new Date('2026-10-16T13:00:00Z'), adsConsent: 'denied' },
    ])
    expect(corpo.destinations[0]?.productDestinationId).toBe('999')
    expect(corpo.events[0]).toMatchObject({
      adIdentifiers: { gclid: 'C' },
      transactionId: 'lead-1',
      conversionValue: 1,
      currency: 'BRL',
      eventSource: 'WEB',
      eventTimestamp: '2026-10-16T12:00:00.000Z',
      consent: { adUserData: 'CONSENT_GRANTED', adPersonalization: 'CONSENT_GRANTED' },
    })
    expect(corpo.events[1]?.adIdentifiers).toEqual({ gbraid: 'G' })
    expect(corpo.events[1]?.consent.adUserData).toBe('CONSENT_DENIED')
  })

  it('config incompleta é null; a ação do WhatsApp é opcional', () => {
    const env = {
      GOOGLE_ADS_LOGIN_CUSTOMER_ID: '1',
      GOOGLE_ADS_CUSTOMER_ID: '2',
      GOOGLE_ADS_CONVERSION_ACTION_ID: '3',
      GOOGLE_ADS_IMPERSONATED_EMAIL: 'a@b',
      GOOGLE_SA_JSON: '{}',
    }
    expect(lerConfigAds(env)).toMatchObject({ acaoProposta: '3', acaoWhatsapp: undefined })
    expect(lerConfigAds({ ...env, GOOGLE_SA_JSON: '' })).toBeNull()
  })
})
```

Arquivo `tests/int/lead-pos-gravacao.int.spec.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { LinhaDoLead } from '@/lib/leads/linha'

const queryMock = vi.fn()
const pushLeadMock = vi.fn()
const sendMailMock = vi.fn()
const ingerirMock = vi.fn()
const tokenAdsMock = vi.fn()
const configAdsMock = vi.fn()
const captureExceptionMock = vi.fn()

vi.mock('server-only', () => ({}))
vi.mock('@sentry/nextjs', () => ({ captureException: (...a: unknown[]) => captureExceptionMock(...a) }))
vi.mock('@/lib/db', () => ({ query: (...a: unknown[]) => queryMock(...a) }))
vi.mock('@/lib/exact/push-lead', () => ({ pushLeadToExact: (...a: unknown[]) => pushLeadMock(...a) }))
vi.mock('@/lib/sendgrid', () => ({ sendMail: (...a: unknown[]) => sendMailMock(...a) }))
vi.mock('@/lib/ads/conversoes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/ads/conversoes')>()),
  lerConfigAds: () => configAdsMock(),
  obterTokenAds: (...a: unknown[]) => tokenAdsMock(...a),
  ingerirConversoes: (...a: unknown[]) => ingerirMock(...a),
}))

const { processarPosGravacao } = await import('@/lib/leads/posGravacao')

const CONFIG = { login: '1', customer: '2', acaoProposta: '999', subject: 'a@b', saJson: '{}' }

function linha(sobre: Partial<LinhaDoLead> = {}, dados: Record<string, string> = {}): LinhaDoLead {
  return {
    id: '501',
    form: 'proposta',
    etapa: 2,
    gclid: 'GCLID-1',
    ads_consent: 'granted',
    created_at: new Date('2026-10-16T12:00:00Z'),
    notificado_para: 'comercial.pb@semog.com.br',
    data: {
      nomeCondominio: 'Aurora',
      uf: 'PB',
      telefone: '+5583999501388',
      email: 'maria@example.com',
      nome: 'Maria',
      cargo: 'Síndico(a)',
      cidade: 'Campina Grande',
      cliente: 'nao',
      variante: 'duas-etapas',
      ambiente: 'production',
      'origem — Canal (origem)': 'Google Ads (tráfego pago)',
      ...dados,
    },
    ...sobre,
  }
}

function sqls(): string[] {
  return queryMock.mock.calls.map(([sql]) => String(sql))
}

beforeEach(() => {
  vi.resetAllMocks()
  queryMock.mockResolvedValue({ rows: [], rowCount: 1 })
  pushLeadMock.mockResolvedValue({ ok: true, exactLeadId: 777 })
  sendMailMock.mockResolvedValue({ ok: true })
  configAdsMock.mockReturnValue(CONFIG)
  tokenAdsMock.mockResolvedValue('token-ads')
  ingerirMock.mockResolvedValue({ ok: true, status: 200, resposta: '{}' })
})

describe('pós-gravação: Exact, e-mail e Ads uma vez cada (spec 4.3 e 4.4)', () => {
  it('etapa 2 de produção: Exact, e-mail interno, aviso ao lead e conversão lead-<id>', async () => {
    const resumo = await processarPosGravacao(linha(), 'acao')

    expect(resumo).toEqual({ exact: 'enviado', email: 'enviado', ads: 'enviado' })
    expect(pushLeadMock).toHaveBeenCalledTimes(1)
    expect(pushLeadMock.mock.calls[0]?.[1]).toMatchObject({ nomeCondominio: 'Aurora', etapa: '2' })
    expect(sqls().some((s) => /set exact_lead_id = \$1/.test(s))).toBe(true)
    expect(sendMailMock).toHaveBeenCalledTimes(2)
    expect(sendMailMock.mock.calls[0]?.[0]).toMatchObject({
      to: ['comercial.pb@semog.com.br'],
      subject: 'Novo contato via Proposta',
    })
    expect(sendMailMock.mock.calls[1]?.[0]).toMatchObject({ to: 'maria@example.com' })
    expect(ingerirMock).toHaveBeenCalledTimes(1)
    const [, , destino, eventos] = ingerirMock.mock.calls[0] as [string, unknown, string, { transactionId: string; tipoDeClique: string }[]]
    expect(destino).toBe('999')
    expect(eventos[0]).toMatchObject({ transactionId: 'lead-501', tipoDeClique: 'gclid', clique: 'GCLID-1' })
    expect(sqls().some((s) => /set uploaded_to_ads = true where id = \$1/.test(s))).toBe(true)
  })

  it('só etapa 1 (cron): Exact recebe etapa 1 e o e-mail avisa que é parcial', async () => {
    await processarPosGravacao(linha({ etapa: 1 }, { nome: '', cargo: '', cidade: '', cliente: '' }), 'cron')
    expect(pushLeadMock.mock.calls[0]?.[1]).toMatchObject({ etapa: '1' })
    expect(sendMailMock.mock.calls[0]?.[0]).toMatchObject({ subject: 'Novo contato via Proposta (só etapa 1)' })
  })

  it('já é cliente: nem Exact nem Ads; o e-mail interno avisa que é cliente', async () => {
    const resumo = await processarPosGravacao(linha({}, { cliente: 'sim' }), 'acao')
    expect(resumo.exact).toBe('nao_enviado')
    expect(resumo.ads).toBe('nao_elegivel')
    expect(pushLeadMock).not.toHaveBeenCalled()
    expect(ingerirMock).not.toHaveBeenCalled()
    const aviso = sendMailMock.mock.calls[0]?.[0] as { subject: string }
    expect(aviso.subject).toBe('Novo contato via Proposta (já é cliente Semog)')
  })

  it('ambiente fora de produção: nada sai (R1)', async () => {
    for (const ambiente of ['preview', 'local', 'development']) {
      const resumo = await processarPosGravacao(linha({}, { ambiente }), 'acao')
      expect(resumo).toEqual({ exact: 'bloqueado', email: 'bloqueado', ads: 'bloqueado' })
    }
    expect(pushLeadMock).not.toHaveBeenCalled()
    expect(sendMailMock).not.toHaveBeenCalled()
    expect(ingerirMock).not.toHaveBeenCalled()
    expect(queryMock).not.toHaveBeenCalled()
  })

  it('linha antiga sem a chave ambiente processa normalmente', async () => {
    const semAmbiente = linha()
    delete semAmbiente.data.ambiente
    expect((await processarPosGravacao(semAmbiente, 'cron')).exact).toBe('enviado')
  })

  it('falha do Ads não derruba Exact nem e-mail, vai ao Sentry e não marca uploaded_to_ads (D1)', async () => {
    ingerirMock.mockResolvedValue({ ok: false, status: 500, resposta: 'erro' })
    const resumo = await processarPosGravacao(linha(), 'acao')
    expect(resumo).toEqual({ exact: 'enviado', email: 'enviado', ads: 'falhou' })
    expect(sqls().some((s) => /uploaded_to_ads = true/.test(s))).toBe(false)
    expect(captureExceptionMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ tags: expect.objectContaining({ passo: 'ads' }) }),
    )
  })

  it('Ads que lança também não derruba nada', async () => {
    tokenAdsMock.mockRejectedValue(new Error('invalid_grant'))
    expect((await processarPosGravacao(linha(), 'acao')).ads).toBe('falhou')
  })

  it('Exact que lança não impede e-mail nem Ads', async () => {
    pushLeadMock.mockRejectedValue(new Error('timeout'))
    expect(await processarPosGravacao(linha(), 'acao')).toEqual({ exact: 'falhou', email: 'enviado', ads: 'enviado' })
  })

  it('gbraid sobe com o tipo próprio', async () => {
    await processarPosGravacao(linha({}, { 'origem — Tipo do clique (Google Ads)': 'gbraid' }), 'acao')
    const eventos = ingerirMock.mock.calls[0]?.[3] as { tipoDeClique: string }[]
    expect(eventos[0]?.tipoDeClique).toBe('gbraid')
  })

  it('sem clique do Google não chama o Ads; sem config, também não', async () => {
    expect((await processarPosGravacao(linha({ gclid: null }), 'acao')).ads).toBe('sem_clique')
    configAdsMock.mockReturnValue(null)
    expect((await processarPosGravacao(linha(), 'acao')).ads).toBe('sem_configuracao')
  })

  it('sem e-mail do lead, só a notificação interna sai', async () => {
    const semEmail = linha()
    delete semEmail.data.email
    await processarPosGravacao(semEmail, 'acao')
    expect(sendMailMock).toHaveBeenCalledTimes(1)
  })

  it('o evento do Sentry não leva telefone, e-mail nem nome (R8)', async () => {
    pushLeadMock.mockResolvedValue({ ok: false, error: 'Exact recusou Maria +5583999501388' })
    sendMailMock.mockResolvedValue({ ok: false, error: 'maria@example.com bounced' })
    ingerirMock.mockResolvedValue({ ok: false, status: 400, resposta: 'x' })
    await processarPosGravacao(linha(), 'acao')
    const evento = JSON.stringify(captureExceptionMock.mock.calls.map(([erro, ctx]) => [String(erro), ctx]))
    expect(captureExceptionMock.mock.calls.length).toBeGreaterThanOrEqual(3)
    for (const pessoal of ['99950', 'maria@', 'Maria', 'Aurora']) expect(evento).not.toContain(pessoal)
    expect(evento).toContain('501')
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/ads-conversoes.int.spec.ts tests/int/lead-pos-gravacao.int.spec.ts`
Expected: FAIL — `@/lib/ads/conversoes`, `@/lib/leads/posGravacao`, `@/lib/leads/linha` não existem.

- [ ] **Step 3: `src/lib/leads/reportar.ts` e `src/lib/leads/linha.ts`**

```ts
import * as Sentry from '@sentry/nextjs'

export type PassoDoLead = 'gravacao' | 'exact' | 'email' | 'ads' | 'pos_gravacao' | 'cron'
export type ContextoDaFalha = { origem: string; leadId?: string }

/**
 * Falha no caminho do lead → log + Sentry do servidor (spec 4.2; hoje nenhum caminho de servidor
 * chamava o Sentry, porque a action engole tudo). **Sem dado pessoal no evento:** só passo, origem
 * e id da linha. Erro de terceiro (Exact, SendGrid, Google) chega aqui como `Error` genérico; o
 * detalhe fica no banco (`exact_error`) ou no log.
 */
export function reportarFalhaDoLead(passo: PassoDoLead, erro: unknown, contexto: ContextoDaFalha): void {
  console.error(`[lead] ${contexto.origem}: falha em ${passo}`, erro)
  const excecao = erro instanceof Error ? erro : new Error(`Falha em ${passo} (valor que não é Error)`)
  Sentry.captureException(excecao, {
    tags: { fluxo: 'lead', passo, origem: contexto.origem },
    extra: contexto.leadId ? { leadId: contexto.leadId } : {},
  })
}
```

```ts
import type { FormType } from '@/lib/forms'

/** Uma linha de `cms.leads` como o pós-gravação a lê. `id` volta do `pg` como string (bigint). */
export type LinhaDoLead = {
  id: string
  form: FormType
  etapa: 1 | 2 | null
  data: Record<string, string>
  gclid: string | null
  ads_consent: string | null
  created_at: string | Date
  notificado_para: string | null
}

export const COLUNAS_DA_LINHA = 'id, form, etapa, data, gclid, ads_consent, created_at, notificado_para'

/**
 * O `data` que vai ao mapeamento do Exact, com a etapa (coluna) junto: é o que faz a descrição dizer
 * "parcial: só etapa 1". Só em memória; nunca gravado em `data`.
 */
export function dadosParaOExact(linha: { data: Record<string, string>; etapa?: 1 | 2 | null }): Record<string, string> {
  return linha.etapa == null ? linha.data : { ...linha.data, etapa: String(linha.etapa) }
}
```

- [ ] **Step 4: `src/lib/ads/conversoes.ts`**

```ts
import 'server-only'
import { JWT } from 'google-auth-library'
import { paraDataManager } from '@/lib/adsConsent'
import type { CliqueDoGoogle } from '@/lib/attribution'

/**
 * Data Manager API (`events:ingest`), o método novo do Google para conversão offline. Extraído do
 * cron `upload-ads-conversions` para que a conversão do formulário suba na hora, junto com o Exact
 * (D1), e o cron diário use o mesmo corpo. Idempotência: `transactionId` estável por linha
 * (`lead-<id>`, `wa-<id>`); o Google não conta duas vezes o mesmo.
 */

const INGEST_URL = 'https://datamanager.googleapis.com/v1/events:ingest'
const SCOPE = 'https://www.googleapis.com/auth/datamanager'

export type TipoDeClique = CliqueDoGoogle['tipo']

export type ConfigAds = {
  login: string
  customer: string
  acaoProposta: string
  acaoWhatsapp?: string
  subject: string
  saJson: string
}

export type EventoDeConversao = {
  transactionId: string
  tipoDeClique: TipoDeClique
  clique: string
  criadoEm: string | Date
  adsConsent: string | null
}

export type ResultadoIngest = { ok: boolean; status: number; resposta: string }

/** Tipo gravado em `data` (`TIPO_CLIQUE_FIELD`); ausente ou desconhecido = gclid, o formato de hoje. */
export function tipoDeClique(valor: string | null | undefined): TipoDeClique {
  return valor === 'gbraid' || valor === 'wbraid' ? valor : 'gclid'
}

export function lerConfigAds(env: NodeJS.ProcessEnv = process.env): ConfigAds | null {
  const login = env.GOOGLE_ADS_LOGIN_CUSTOMER_ID
  const customer = env.GOOGLE_ADS_CUSTOMER_ID
  const acaoProposta = env.GOOGLE_ADS_CONVERSION_ACTION_ID
  const subject = env.GOOGLE_ADS_IMPERSONATED_EMAIL
  const saJson = env.GOOGLE_SA_JSON
  if (!login || !customer || !acaoProposta || !subject || !saJson) return null
  return {
    login,
    customer,
    acaoProposta,
    acaoWhatsapp: env.GOOGLE_ADS_WHATSAPP_CONVERSION_ACTION_ID || undefined,
    subject,
    saJson,
  }
}

export async function obterTokenAds(config: ConfigAds): Promise<string | null> {
  // `as`: é o JSON da conta de serviço que nós mesmos configuramos; os dois campos são obrigatórios nele.
  const sa = JSON.parse(config.saJson) as { client_email: string; private_key: string }
  const jwt = new JWT({ email: sa.client_email, key: sa.private_key, scopes: [SCOPE], subject: config.subject })
  return (await jwt.authorize()).access_token ?? null
}

export function corpoDoIngest(config: ConfigAds, destinoId: string, eventos: readonly EventoDeConversao[]) {
  return {
    destinations: [
      {
        operatingAccount: { accountType: 'GOOGLE_ADS', accountId: config.customer },
        loginAccount: { accountType: 'GOOGLE_ADS', accountId: config.login },
        productDestinationId: destinoId,
      },
    ],
    events: eventos.map((e) => ({
      // gclid, gbraid e wbraid são campos distintos em AdIdentifiers (referência da API).
      adIdentifiers: { [e.tipoDeClique]: e.clique },
      conversionValue: 1,
      currency: 'BRL',
      eventTimestamp: new Date(e.criadoEm).toISOString(),
      transactionId: e.transactionId,
      eventSource: 'WEB',
      // Consentimento por evento: vence o do lote (ver `paraDataManager`, `@/lib/adsConsent`).
      consent: {
        adUserData: paraDataManager(e.adsConsent),
        adPersonalization: paraDataManager(e.adsConsent),
      },
    })),
  }
}

/** Uma chamada por ação de conversão. Tudo ou nada: a API não devolve status por evento. */
export async function ingerirConversoes(
  token: string,
  config: ConfigAds,
  destinoId: string,
  eventos: readonly EventoDeConversao[],
): Promise<ResultadoIngest> {
  const res = await fetch(INGEST_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(corpoDoIngest(config, destinoId, eventos)),
  })
  const json: unknown = await res.json()
  return { ok: res.ok, status: res.status, resposta: JSON.stringify(json).slice(0, 300) }
}
```

- [ ] **Step 5: `src/lib/leads/posGravacao.ts`**

```ts
import 'server-only'
import ContactAutoReply from '@/emails/ContactAutoReply'
import ContactNotification from '@/emails/ContactNotification'
import { ingerirConversoes, lerConfigAds, obterTokenAds, tipoDeClique } from '@/lib/ads/conversoes'
import { query } from '@/lib/db'
import { botoesDeDesfecho } from '@/lib/desfechoToken'
import { isExactEligible } from '@/lib/exact/map-lead'
import { pushLeadToExact } from '@/lib/exact/push-lead'
import { TIPO_CLIQUE_FIELD } from '@/lib/forms'
import { sendMail } from '@/lib/sendgrid'
import { ambienteLiberaEnvio } from './ambiente'
import { dadosParaOExact, type LinhaDoLead } from './linha'
import { reportarFalhaDoLead } from './reportar'

/**
 * Depois da gravação: Exact, e-mail interno (+ aviso ao lead) e conversão do Ads, **uma vez cada**,
 * para uma linha que quem chama já reivindicou (`envio_em` gravado no mesmo UPDATE que a concluiu,
 * ou no UPDATE de reivindicação do cron). Marcadores: `exact_lead_id` (Exact), `envio_em`
 * (e-mails: quem reivindicou envia, ninguém reenvia) e `uploaded_to_ads` + `transactionId` (Ads).
 * **Nunca lança:** cada passo tem o próprio try/catch, vai ao Sentry sem dado pessoal e não impede
 * os outros (D1: falha do Ads não derruba o Exact; o lote diário retenta).
 */

export type OrigemDoEnvio = 'acao' | 'cron'

export type ResumoPosGravacao = {
  exact: 'enviado' | 'falhou' | 'nao_enviado' | 'bloqueado'
  email: 'enviado' | 'falhou' | 'sem_destino' | 'bloqueado'
  ads: 'enviado' | 'falhou' | 'sem_clique' | 'nao_elegivel' | 'sem_configuracao' | 'bloqueado'
}

const BLOQUEADO: ResumoPosGravacao = { exact: 'bloqueado', email: 'bloqueado', ads: 'bloqueado' }

export async function processarPosGravacao(linha: LinhaDoLead, origem: OrigemDoEnvio): Promise<ResumoPosGravacao> {
  if (!ambienteLiberaEnvio(linha.data)) {
    console.info(`[lead] ${linha.id}: ambiente ${linha.data.ambiente}; nada sai (Exact, e-mail, Ads).`)
    return BLOQUEADO
  }
  const exact = await enviarAoExact(linha, origem)
  const email = await enviarEmails(linha, origem)
  const ads = await enviarAoAds(linha, origem)
  return { exact, email, ads }
}

async function enviarAoExact(linha: LinhaDoLead, origem: OrigemDoEnvio): Promise<ResumoPosGravacao['exact']> {
  if (!isExactEligible(linha.form, linha.data)) return 'nao_enviado'
  const contexto = { leadId: linha.id, origem }
  try {
    const push = await pushLeadToExact(linha.form, dadosParaOExact(linha))
    if (!push) return 'nao_enviado'
    await query(
      `update cms.leads
          set exact_lead_id = $1, exact_error = $2, exact_attempts = exact_attempts + 1
        where id = $3`,
      [push.ok ? push.exactLeadId : null, push.ok ? (push.personError ?? null) : push.error, linha.id],
    )
    if (push.ok) return 'enviado'
    reportarFalhaDoLead('exact', new Error('Exact recusou ou não respondeu (detalhe em exact_error)'), contexto)
    return 'falhou'
  } catch (erro) {
    reportarFalhaDoLead('exact', erro, contexto)
    return 'falhou'
  }
}

/** Rótulos e ordem do e-mail interno do formulário de duas etapas. */
const ROTULOS: readonly (readonly [chave: string, rotulo: string])[] = [
  ['nomeCondominio', 'Nome do condomínio'],
  ['uf', 'Estado'],
  ['telefone', 'Telefone'],
  ['email', 'E-mail'],
  ['nome', 'Seu nome'],
  ['cargo', 'Você é'],
  ['cidade', 'Cidade'],
  ['unidades', 'Nº de unidades (aprox.)'],
  ['cliente', 'Já é cliente Semog?'],
]

export function camposDoEmail(data: Record<string, string>): { label: string; value: string }[] {
  return ROTULOS.filter(([chave]) => data[chave]).map(([chave, label]) => ({
    label,
    value: chave === 'cliente' ? (data[chave] === 'sim' ? 'Sim' : 'Não') : (data[chave] ?? ''),
  }))
}

function origemDoEmail(data: Record<string, string>): { label: string; value: string }[] {
  const prefixo = 'origem — '
  return Object.entries(data)
    .filter(([chave, valor]) => chave.startsWith(prefixo) && valor)
    .map(([chave, valor]) => ({ label: chave.slice(prefixo.length), value: valor }))
}

function tituloDoEnvio(linha: LinhaDoLead): string {
  if (linha.data.cliente === 'sim') return 'Proposta (já é cliente Semog)'
  if (linha.etapa === 1) return 'Proposta (só etapa 1)'
  return 'Proposta'
}

async function enviarEmails(linha: LinhaDoLead, origem: OrigemDoEnvio): Promise<ResumoPosGravacao['email']> {
  const destino = (linha.notificado_para ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  if (destino.length === 0) return 'sem_destino'
  const contexto = { leadId: linha.id, origem }
  try {
    const formTitle = tituloDoEnvio(linha)
    const desfecho = isExactEligible(linha.form, linha.data) ? (botoesDeDesfecho(linha.id) ?? undefined) : undefined
    const aviso = await sendMail({
      to: destino,
      subject: `Novo contato via ${formTitle}`,
      react: ContactNotification({ formTitle, fields: camposDoEmail(linha.data), attribution: origemDoEmail(linha.data), desfecho }),
    })
    if (!aviso.ok) reportarFalhaDoLead('email', new Error('SendGrid recusou a notificação interna'), contexto)
    await enviarAvisoAoLead(linha, contexto)
    return aviso.ok ? 'enviado' : 'falhou'
  } catch (erro) {
    reportarFalhaDoLead('email', erro, contexto)
    return 'falhou'
  }
}

/** Aviso automático ao lead: como hoje (`ContactAutoReply`), uma vez, só se houver e-mail (R3). */
async function enviarAvisoAoLead(linha: LinhaDoLead, contexto: { leadId: string; origem: string }): Promise<void> {
  const email = linha.data.email
  if (!email) return
  const resposta = await sendMail({
    to: email,
    subject: 'Recebemos seu contato — Semog',
    react: ContactAutoReply({ name: linha.data.nome || undefined }),
  })
  if (!resposta.ok) reportarFalhaDoLead('email', new Error('SendGrid recusou o aviso ao lead'), contexto)
}

async function enviarAoAds(linha: LinhaDoLead, origem: OrigemDoEnvio): Promise<ResumoPosGravacao['ads']> {
  // Mesmo critério do Exact: captação e não cliente (spec 4.4).
  if (!isExactEligible(linha.form, linha.data)) return 'nao_elegivel'
  if (!linha.gclid) return 'sem_clique'
  const config = lerConfigAds()
  if (!config) return 'sem_configuracao'
  const contexto = { leadId: linha.id, origem }
  try {
    const token = await obterTokenAds(config)
    if (!token) throw new Error('Google não devolveu token de acesso')
    const resultado = await ingerirConversoes(token, config, config.acaoProposta, [
      {
        transactionId: `lead-${linha.id}`,
        tipoDeClique: tipoDeClique(linha.data[TIPO_CLIQUE_FIELD]),
        clique: linha.gclid,
        criadoEm: linha.created_at,
        adsConsent: linha.ads_consent,
      },
    ])
    if (!resultado.ok) {
      reportarFalhaDoLead('ads', new Error(`Data Manager respondeu ${resultado.status}`), contexto)
      return 'falhou'
    }
    await query('update cms.leads set uploaded_to_ads = true where id = $1', [linha.id])
    return 'enviado'
  } catch (erro) {
    reportarFalhaDoLead('ads', erro, contexto)
    return 'falhou'
  }
}
```

- [ ] **Step 6: Rodar e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/ads-conversoes.int.spec.ts tests/int/lead-pos-gravacao.int.spec.ts tests/int/cron-ads.int.spec.ts`
Expected: PASS (o `cron-ads` ainda não usa o módulo; só confirma que nada quebrou).

- [ ] **Step 7: Checkpoint: portões e commitar**

```powershell
pnpm exec biome check --write src/lib/leads/reportar.ts src/lib/leads/linha.ts src/lib/ads/conversoes.ts src/lib/leads/posGravacao.ts tests/int/ads-conversoes.int.spec.ts tests/int/lead-pos-gravacao.int.spec.ts
pnpm exec biome ci ./src ./tests ./scripts
pnpm exec tsc --noEmit
pnpm run check:server-actions
pnpm run test:int
git branch --show-current && git add src/lib/leads/reportar.ts src/lib/leads/linha.ts src/lib/ads/conversoes.ts src/lib/leads/posGravacao.ts tests/int/ads-conversoes.int.spec.ts tests/int/lead-pos-gravacao.int.spec.ts && git commit -m "feat(leads): envio pós-gravação único (Exact, e-mail e Ads) com Sentry sem dado pessoal

Uma linha reivindicada sai uma vez para cada destino; falha de um não derruba os
outros; ambiente fora de produção não envia nada; quem já é cliente não vai ao
Exact nem ao Ads. Data Manager API extraída para módulo, com gbraid/wbraid no
campo próprio.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
```

---

## Tarefa 2.4: Server Actions das duas etapas, cookie do token e ajustes do formulário antigo

**Files:**
- Create: `src/lib/propostaDuasEtapas/resultado.ts`
- Create: `src/lib/propostaDuasEtapas/cookie.ts`
- Create: `src/lib/propostaDuasEtapas/gravacao.ts`
- Create: `src/app/(site)/_actions/proposta-duas-etapas.ts`
- Modify: `src/app/(frontend)/_actions/submit-form.ts` (`montarLeadData` `:392-406`, `enviarAoExact` `:415-437`, `enviarNotificacao` `:496-498`, `enviarAutoReply` `:534-536`, `enviarEmails` `:548-550`, `processarEnvio` `:606` e `:643-652`)
- Test: `tests/int/proposta-duas-etapas.int.spec.ts`; Modify: `tests/int/submit-form.int.spec.ts`, `tests/int/proposta-rapida.int.spec.ts`

**Interfaces:**
- Consumes (2.1): colunas `etapa`, `token_envio`, `envio_em`. (2.2): `etapa1Schema`, `etapa2Schema`, `propostaCompletaSchema`, `dadosDaEtapa1`, `dadosDaEtapa2`, `errosPorCampo`, `type Etapa1Dados`, `type Etapa2Dados`, `ambienteAtual`, `ambienteLiberaEnvio`, `AMBIENTE_FIELD`, `destinatariosPorUf`. (2.3): `processarPosGravacao`, `reportarFalhaDoLead`, `type LinhaDoLead`, `COLUNAS_DA_LINHA`. Existentes: `clienteIp(): Promise<string | undefined>`, `rateLimit(key, { max, windowMs }): { ok: boolean }`, `verifyTurnstile(token, ip?): Promise<boolean>`, `buildAttributionFields`, `parseAttributionCookie`, `ATTRIBUTION_COOKIE`, `extractLeadColumns`, `consentimentoDeAnuncio`, `paisDaRequisicao`, `CONSENT_COOKIE_NAME`.
- Produces:
  - `resultado.ts`: `type ResultadoEtapa = { ok: true; etapa: 1 | 2 } | { ok: false; motivo: 'campos'; erros: Record<string, string> } | { ok: false; motivo: 'precisa_verificar' } | { ok: false; motivo: 'recusado'; mensagem: string } | { ok: false; motivo: 'falha'; mensagem: string }`, `type ResultadoFalha = Extract<ResultadoEtapa, { ok: false }>`.
  - Actions (`'use server'`): `enviarEtapa1(valores: unknown, turnstileToken: string | null): Promise<ResultadoEtapa>`, `enviarEtapa2(valores: unknown): Promise<ResultadoEtapa>`, `enviarPropostaCompleta(valores: unknown, turnstileToken: string): Promise<ResultadoEtapa>`.
  - `cookie.ts`: `NOME_DO_COOKIE = 'proposta_etapa'`, `lerTokenDaEtapa(): Promise<string | null>`, `gravarTokenDaEtapa(token: string): Promise<void>`, `apagarTokenDaEtapa(): Promise<void>`.
  - `gravacao.ts`: `type ContextoDoEnvio = { origem: Record<string, string>; gclid: string | null; adsConsent: string }`, `contextoDoEnvio(): Promise<ContextoDoEnvio>`, `inserirEtapa1(dados, ctx, token): Promise<string>`, `atualizarEtapa1(token, dados): Promise<boolean>`, `concluirEtapa2(token, dados): Promise<LinhaDoLead | null>`, `absorverComTurnstile(token, dados): Promise<LinhaDoLead | null>`, `inserirCompleta(dados, ctx): Promise<LinhaDoLead>`. Cada SQL começa com um comentário-etiqueta (`/* proposta:inserir-etapa1 */` etc.), que os testes usam para rotear.

- [ ] **Step 1: Escrever os testes que falham**

Arquivo `tests/int/proposta-duas-etapas.int.spec.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { LinhaDoLead } from '@/lib/leads/linha'

/**
 * Actions das duas etapas com o pipeline real (schema → rate limit → Turnstile → SQL → pós-gravação)
 * e as bordas mocadas: banco, Turnstile, Exact, SendGrid, Ads, Sentry e `next/headers`. O banco é
 * uma tabela em memória que segue o WHERE das consultas; o texto do SQL também é conferido, e o
 * comportamento real do SQL foi conferido no Postgres na Tarefa 2.1 (`conferir`) e é de novo na 2.7.
 * Import direto do módulo, sem o transform de Server Actions: o registro das actions é conferido
 * pelo `check:server-actions` e pela invocação real na 2.7.
 */

const queryMock = vi.fn()
const verifyTurnstileMock = vi.fn()
const pushLeadMock = vi.fn()
const sendMailMock = vi.fn()
const ingerirMock = vi.fn()
const captureExceptionMock = vi.fn()
const setCookieMock = vi.fn()
const deleteCookieMock = vi.fn()
const jar = new Map<string, string>()
let ipAtual = '203.0.113.1'
let contadorDeIp = 0

vi.mock('server-only', () => ({}))
vi.mock('@sentry/nextjs', () => ({ captureException: (...a: unknown[]) => captureExceptionMock(...a) }))
vi.mock('@/lib/db', () => ({ query: (...a: unknown[]) => queryMock(...a) }))
vi.mock('@/lib/turnstile', () => ({ verifyTurnstile: (...a: unknown[]) => verifyTurnstileMock(...a) }))
vi.mock('@/lib/exact/push-lead', () => ({ pushLeadToExact: (...a: unknown[]) => pushLeadMock(...a) }))
vi.mock('@/lib/sendgrid', () => ({ sendMail: (...a: unknown[]) => sendMailMock(...a) }))
vi.mock('@/lib/ads/conversoes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/ads/conversoes')>()),
  lerConfigAds: () => ({ login: '1', customer: '2', acaoProposta: '999', subject: 'a@b', saJson: '{}' }),
  obterTokenAds: async () => 'token-ads',
  ingerirConversoes: (...a: unknown[]) => ingerirMock(...a),
}))
vi.mock('next/headers', () => ({
  headers: async () => ({ get: (nome: string) => (nome === 'x-forwarded-for' ? ipAtual : null) }),
  cookies: async () => ({
    get: (nome: string) => (jar.has(nome) ? { name: nome, value: jar.get(nome) } : undefined),
    set: (nome: string, valor: string, opcoes: unknown) => {
      jar.set(nome, valor)
      setCookieMock(nome, valor, opcoes)
    },
    delete: (opcoes: { name: string }) => {
      jar.delete(opcoes.name)
      deleteCookieMock(opcoes)
    },
  }),
}))

const { enviarEtapa1, enviarEtapa2, enviarPropostaCompleta } = await import('@/app/(site)/_actions/proposta-duas-etapas')

// ---- banco em memória -----------------------------------------------------------------------
type LinhaFalsa = LinhaDoLead & { token: string | null; envioEm: Date | null; criadaEm: Date }
let tabela: LinhaFalsa[] = []
let proximoId = 501
let falharGravacao = false

// `as`: os parâmetros do pg chegam como unknown[]; nestes SQLs a ordem e o tipo são os da action.
const texto = (v: unknown) => v as string
const objeto = (v: unknown) => v as Record<string, string>

function visivel(l: LinhaFalsa): LinhaDoLead {
  const { token: _t, envioEm: _e, criadaEm: _c, ...resto } = l
  return { ...resto, data: { ...l.data } }
}

function pendente(token: unknown, com30min: boolean): LinhaFalsa | undefined {
  return tabela.find(
    (l) =>
      l.token === token &&
      l.etapa === 1 &&
      l.envioEm === null &&
      (!com30min || Date.now() - l.criadaEm.getTime() < 30 * 60_000),
  )
}

function semEmail(data: Record<string, string>): Record<string, string> {
  const { email: _e, ...resto } = data
  return resto
}

function nova(p: unknown[], etapa: 1 | 2, token: string | null): LinhaFalsa {
  const l: LinhaFalsa = {
    id: String(proximoId++),
    form: 'proposta',
    etapa,
    data: objeto(p[0]),
    gclid: (p[1] as string | null) ?? null,
    ads_consent: texto(p[3]),
    notificado_para: texto(p[4]),
    created_at: new Date(),
    token,
    envioEm: etapa === 1 ? null : new Date(),
    criadaEm: new Date(),
  }
  tabela.push(l)
  return l
}

async function banco(sql: string, p: unknown[] = []) {
  if (falharGravacao && /proposta:/.test(sql)) throw new Error('connect ECONNREFUSED')
  if (sql.includes('proposta:inserir-etapa1')) return { rows: [{ id: nova(p, 1, texto(p[5])).id }], rowCount: 1 }
  if (sql.includes('proposta:inserir-completa')) return { rows: [visivel(nova(p, 2, null))], rowCount: 1 }
  if (sql.includes('proposta:atualizar-etapa1')) {
    const l = pendente(p[0], true)
    if (!l) return { rows: [], rowCount: 0 }
    l.data = { ...semEmail(l.data), ...objeto(p[1]) }
    l.notificado_para = texto(p[3])
    return { rows: [], rowCount: 1 }
  }
  if (sql.includes('proposta:concluir-etapa2') || sql.includes('proposta:absorver')) {
    const l = pendente(p[0], sql.includes('concluir-etapa2'))
    if (!l) return { rows: [], rowCount: 0 }
    l.data = sql.includes('absorver') ? { ...semEmail(l.data), ...objeto(p[1]) } : { ...l.data, ...objeto(p[1]) }
    if (sql.includes('absorver')) l.notificado_para = texto(p[3])
    l.etapa = 2
    l.envioEm = new Date()
    return { rows: [visivel(l)], rowCount: 1 }
  }
  return { rows: [], rowCount: 1 }
}

function sqlCom(etiqueta: string): [string, unknown[]][] {
  return queryMock.mock.calls.filter(([sql]) => String(sql).includes(etiqueta)) as [string, unknown[]][]
}
function inserts(): number {
  return sqlCom('proposta:inserir-etapa1').length + sqlCom('proposta:inserir-completa').length
}

const ETAPA1 = { nomeCondominio: 'Aurora', uf: 'PB', telefone: '(83) 99950-1388', email: 'maria@example.com' }
const ETAPA2 = { nome: 'Maria', perfil: 'sindico', cidade: 'Campina Grande', unidades: '120', cliente: 'nao' }
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

async function etapa1Gravada(): Promise<string> {
  expect(await enviarEtapa1(ETAPA1, 'turnstile-ok')).toEqual({ ok: true, etapa: 1 })
  const token = jar.get('proposta_etapa')
  if (!token) throw new Error('cookie da etapa não foi gravado')
  return token
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubEnv('VERCEL_ENV', 'production')
  tabela = []
  falharGravacao = false
  jar.clear()
  ipAtual = `203.0.113.${++contadorDeIp}`
  queryMock.mockImplementation(banco)
  verifyTurnstileMock.mockResolvedValue(true)
  pushLeadMock.mockResolvedValue({ ok: true, exactLeadId: 777 })
  sendMailMock.mockResolvedValue({ ok: true })
  ingerirMock.mockResolvedValue({ ok: true, status: 200, resposta: '{}' })
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('etapa 1', () => {
  it('grava UMA linha com etapa 1 e envio_em nulo, token num cookie HttpOnly, e nada sai', async () => {
    await etapa1Gravada()
    expect(inserts()).toBe(1)
    const [sql, p] = sqlCom('proposta:inserir-etapa1')[0] ?? ['', []]
    expect(sql).toMatch(/values \('proposta', \$1, \$2, \$3, \$4, \$5, 1, \$6, null\)/)
    expect(p[0]).toMatchObject({ nomeCondominio: 'Aurora', uf: 'PB', telefone: '+5583999501388', variante: 'duas-etapas', ambiente: 'production' })
    expect(p[4]).toBe('comercial.pb@semog.com.br')
    expect(texto(p[5])).toMatch(UUID)
    expect(setCookieMock).toHaveBeenCalledWith(
      'proposta_etapa',
      p[5],
      expect.objectContaining({ httpOnly: true, sameSite: 'strict', path: '/', secure: true, maxAge: 7200 }),
    )
    expect(pushLeadMock).not.toHaveBeenCalled()
    expect(sendMailMock).not.toHaveBeenCalled()
    expect(ingerirMock).not.toHaveBeenCalled()
  })

  it('Turnstile recusado não grava', async () => {
    verifyTurnstileMock.mockResolvedValue(false)
    expect(await enviarEtapa1(ETAPA1, 'turnstile-ruim')).toMatchObject({ ok: false, motivo: 'recusado' })
    expect(inserts()).toBe(0)
  })

  it('sem Turnstile e sem cookie: precisa_verificar, sem gravar (R5)', async () => {
    expect(await enviarEtapa1(ETAPA1, null)).toEqual({ ok: false, motivo: 'precisa_verificar' })
    expect(inserts()).toBe(0)
    expect(verifyTurnstileMock).not.toHaveBeenCalled()
  })

  it('campos inválidos não tocam o banco nem o Turnstile', async () => {
    const r = await enviarEtapa1({ ...ETAPA1, telefone: '123' }, 'turnstile-ok')
    expect(r).toMatchObject({ ok: false, motivo: 'campos', erros: { telefone: expect.any(String) } })
    expect(queryMock).not.toHaveBeenCalled()
    expect(verifyTurnstileMock).not.toHaveBeenCalled()
  })

  it('voltar: reenviar a etapa 1 com o cookie válido atualiza a MESMA linha, sem Turnstile (R6)', async () => {
    const token = await etapa1Gravada()
    verifyTurnstileMock.mockClear()
    expect(await enviarEtapa1({ ...ETAPA1, uf: 'PE', email: '' }, null)).toEqual({ ok: true, etapa: 1 })
    expect(inserts()).toBe(1)
    expect(verifyTurnstileMock).not.toHaveBeenCalled()
    const [sql, p] = sqlCom('proposta:atualizar-etapa1')[0] ?? ['', []]
    expect(p[0]).toBe(token)
    expect(sql).toMatch(/token_envio = \$1 and etapa = 1 and envio_em is null/)
    expect(sql).toContain("created_at > now() - interval '30 minutes'")
    // UF trocada ao voltar (Review Focus): o destino do e-mail acompanha, e o e-mail apagado sai.
    expect(tabela[0]?.notificado_para).toBe('ivan@semog.com.br')
    expect(tabela[0]?.data.email).toBeUndefined()
  })

  it('voltar depois dos 30 min: o UPDATE não acha a linha; sem Turnstile, precisa_verificar', async () => {
    await etapa1Gravada()
    const linha = tabela[0]
    if (linha) linha.criadaEm = new Date(Date.now() - 31 * 60_000)
    expect(await enviarEtapa1(ETAPA1, null)).toEqual({ ok: false, motivo: 'precisa_verificar' })
    expect(inserts()).toBe(1)
  })
})

describe('etapa 2', () => {
  it('conclui a mesma linha pelo token, dentro de 30 min: uma linha por lead, envios uma vez, cookie apagado', async () => {
    await etapa1Gravada()
    expect(await enviarEtapa2(ETAPA2)).toEqual({ ok: true, etapa: 2 })

    expect(inserts()).toBe(1)
    const [sql, p] = sqlCom('proposta:concluir-etapa2')[0] ?? ['', []]
    expect(sql).toMatch(/set data = data \|\| \$2::jsonb, etapa = 2, envio_em = now\(\)/)
    expect(sql).toMatch(/token_envio = \$1 and etapa = 1 and envio_em is null/)
    expect(sql).toContain("created_at > now() - interval '30 minutes'")
    expect(p[1]).toEqual({ nome: 'Maria', cargo: 'Síndico(a)', cidade: 'Campina Grande', unidades: '120', cliente: 'nao' })
    expect(pushLeadMock).toHaveBeenCalledTimes(1)
    expect(pushLeadMock.mock.calls[0]?.[1]).toMatchObject({ nomeCondominio: 'Aurora', nome: 'Maria', etapa: '2' })
    expect(sendMailMock).toHaveBeenCalledTimes(2)
    expect(ingerirMock).toHaveBeenCalledTimes(0) // sem gclid no cookie de atribuição
    expect(deleteCookieMock).toHaveBeenCalledWith(expect.objectContaining({ name: 'proposta_etapa' }))
    expect(tabela).toHaveLength(1)
  })

  it('a mesma etapa 2 repetida não envia de novo (uso único)', async () => {
    const token = await etapa1Gravada()
    await enviarEtapa2(ETAPA2)
    jar.set('proposta_etapa', token)
    expect(await enviarEtapa2(ETAPA2)).toEqual({ ok: false, motivo: 'precisa_verificar' })
    expect(pushLeadMock).toHaveBeenCalledTimes(1)
  })

  it('sem cookie: precisa_verificar e nada gravado (R5)', async () => {
    expect(await enviarEtapa2(ETAPA2)).toEqual({ ok: false, motivo: 'precisa_verificar' })
    expect(queryMock).not.toHaveBeenCalled()
  })

  it('cookie com valor adulterado vale como ausente', async () => {
    jar.set('proposta_etapa', 'nao-e-uuid')
    expect(await enviarEtapa2(ETAPA2)).toEqual({ ok: false, motivo: 'precisa_verificar' })
    expect(queryMock).not.toHaveBeenCalled()
  })

  it('já é cliente: nem Exact nem Ads; o e-mail avisa que é cliente', async () => {
    await etapa1Gravada()
    await enviarEtapa2({ ...ETAPA2, cliente: 'sim' })
    expect(pushLeadMock).not.toHaveBeenCalled()
    expect(ingerirMock).not.toHaveBeenCalled()
    expect((sendMailMock.mock.calls[0]?.[0] as { subject: string }).subject).toContain('já é cliente')
  })
})

describe('token perdido ou vencido: proposta completa com Turnstile (R5)', () => {
  it('entre 30 e 45 min: precisa_verificar e depois conclui a MESMA linha (Review Focus)', async () => {
    await etapa1Gravada()
    const linha = tabela[0]
    if (linha) linha.criadaEm = new Date(Date.now() - 35 * 60_000)
    expect(await enviarEtapa2(ETAPA2)).toEqual({ ok: false, motivo: 'precisa_verificar' })
    expect(await enviarPropostaCompleta({ ...ETAPA1, ...ETAPA2 }, 'turnstile-novo')).toEqual({ ok: true, etapa: 2 })
    expect(tabela).toHaveLength(1)
    expect(inserts()).toBe(1)
    const [sql] = sqlCom('proposta:absorver')[0] ?? ['']
    expect(sql).not.toContain('30 minutes')
    expect(sql).toMatch(/envio_em is null/)
    expect(pushLeadMock).toHaveBeenCalledTimes(1)
  })

  it('sem cookie: grava UMA linha nova completa com etapa 2', async () => {
    expect(await enviarPropostaCompleta({ ...ETAPA1, ...ETAPA2 }, 'turnstile-novo')).toEqual({ ok: true, etapa: 2 })
    expect(sqlCom('proposta:inserir-completa')).toHaveLength(1)
    expect(String(sqlCom('proposta:inserir-completa')[0]?.[0])).toMatch(/\$5, 2\)/)
    expect(tabela[0]?.data).toMatchObject({ nomeCondominio: 'Aurora', nome: 'Maria', ambiente: 'production' })
    expect(pushLeadMock).toHaveBeenCalledTimes(1)
  })

  it('sem Turnstile nunca grava', async () => {
    expect(await enviarPropostaCompleta({ ...ETAPA1, ...ETAPA2 }, '')).toEqual({ ok: false, motivo: 'precisa_verificar' })
    verifyTurnstileMock.mockResolvedValue(false)
    expect(await enviarPropostaCompleta({ ...ETAPA1, ...ETAPA2 }, 'ruim')).toMatchObject({ ok: false, motivo: 'recusado' })
    expect(inserts()).toBe(0)
  })
})

describe('ambiente e falhas', () => {
  it('Preview grava com ambiente preview e nada sai, nem na etapa 2 (R1)', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    await etapa1Gravada()
    expect(tabela[0]?.data.ambiente).toBe('preview')
    expect(await enviarEtapa2(ETAPA2)).toEqual({ ok: true, etapa: 2 })
    expect(pushLeadMock).not.toHaveBeenCalled()
    expect(sendMailMock).not.toHaveBeenCalled()
    expect(ingerirMock).not.toHaveBeenCalled()
  })

  it('local (sem VERCEL_ENV) também não envia', async () => {
    vi.stubEnv('VERCEL_ENV', '')
    await etapa1Gravada()
    expect(tabela[0]?.data.ambiente).toBe('local')
    await enviarEtapa2(ETAPA2)
    expect(pushLeadMock).not.toHaveBeenCalled()
  })

  it('falha de gravação devolve "falha" tipado, nunca lança, e vai ao Sentry sem dado pessoal (R8)', async () => {
    falharGravacao = true
    const r = await enviarEtapa1(ETAPA1, 'turnstile-ok')
    expect(r).toMatchObject({ ok: false, motivo: 'falha' })
    expect(captureExceptionMock).toHaveBeenCalledTimes(1)
    const evento = JSON.stringify(captureExceptionMock.mock.calls[0]?.[1])
    expect(evento).toContain('gravacao')
    for (const pessoal of ['99950', 'maria@', 'Aurora']) expect(evento).not.toContain(pessoal)
  })

  it('Ads que falha não derruba o Exact nem a resposta (D1)', async () => {
    jar.set('semog-attrib', encodeURIComponent(JSON.stringify({ first: { gclid: 'GCLID-1' }, last: {} })))
    ingerirMock.mockRejectedValue(new Error('500'))
    await etapa1Gravada()
    expect(await enviarEtapa2(ETAPA2)).toEqual({ ok: true, etapa: 2 })
    expect(pushLeadMock).toHaveBeenCalledTimes(1)
    expect(captureExceptionMock).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ tags: expect.objectContaining({ passo: 'ads' }) }))
  })

  it('Ads com gclid sobe uma vez com transactionId lead-<id>', async () => {
    jar.set('semog-attrib', encodeURIComponent(JSON.stringify({ first: { gclid: 'GCLID-1' }, last: {} })))
    await etapa1Gravada()
    await enviarEtapa2(ETAPA2)
    expect(ingerirMock).toHaveBeenCalledTimes(1)
    const eventos = ingerirMock.mock.calls[0]?.[3] as { transactionId: string }[]
    expect(eventos[0]?.transactionId).toBe(`lead-${tabela[0]?.id}`)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/proposta-duas-etapas.int.spec.ts`
Expected: FAIL — `@/app/(site)/_actions/proposta-duas-etapas` não existe.

- [ ] **Step 3: `resultado.ts` e `cookie.ts`**

```ts
/**
 * Resposta das actions das duas etapas. Mora fora do módulo `'use server'` (só função async pode
 * ser exportada de lá; um `export type` derrubou a captação por 12 dias em agosto/2026).
 * `precisa_verificar`: o token da etapa sumiu ou venceu; a tela mostra o Turnstile e reenvia tudo.
 */
export type ResultadoEtapa =
  | { ok: true; etapa: 1 | 2 }
  | { ok: false; motivo: 'campos'; erros: Record<string, string> }
  | { ok: false; motivo: 'precisa_verificar' }
  | { ok: false; motivo: 'recusado'; mensagem: string }
  | { ok: false; motivo: 'falha'; mensagem: string }

export type ResultadoFalha = Extract<ResultadoEtapa, { ok: false }>
```

```ts
import 'server-only'
import { cookies } from 'next/headers'

/**
 * Cookie do token da etapa (R4), no padrão dos cookies da 2ª via (`segundaVia/cookies.ts`):
 * HttpOnly, SameSite=Strict, Secure fora do `next dev`. O valor é o uuid de `token_envio`, nunca o
 * id da linha. **Validade (30 min) e uso único vêm do banco**, no WHERE do UPDATE; o prazo do cookie
 * (2 h) só serve para, com um Turnstile novo, reaproveitar a linha de quem voltou depois (DP3).
 * Só funciona em Server Action ou Route Handler.
 */
export const NOME_DO_COOKIE = 'proposta_etapa'
const PRAZO_S = 7200
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

function atributos(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    path: '/',
    maxAge,
  } as const
}

async function apagar(): Promise<void> {
  const loja = await cookies()
  const { maxAge: _, ...resto } = atributos(0)
  loja.delete({ name: NOME_DO_COOKIE, ...resto })
}

/** O token, se tiver formato de uuid; valor adulterado é apagado e vale como ausente. */
export async function lerTokenDaEtapa(): Promise<string | null> {
  const valor = (await cookies()).get(NOME_DO_COOKIE)?.value
  if (valor === undefined) return null
  if (UUID.test(valor)) return valor
  await apagar()
  return null
}

export async function gravarTokenDaEtapa(token: string): Promise<void> {
  const loja = await cookies()
  loja.set(NOME_DO_COOKIE, token, atributos(PRAZO_S))
}

export async function apagarTokenDaEtapa(): Promise<void> {
  await apagar()
}
```

- [ ] **Step 4: `gravacao.ts`**

```ts
import 'server-only'
import { cookies, headers } from 'next/headers'
import { consentimentoDeAnuncio, paisDaRequisicao } from '@/lib/adsConsent'
import { ATTRIBUTION_COOKIE, buildAttributionFields, parseAttributionCookie } from '@/lib/attribution'
import { CONSENT_COOKIE_NAME } from '@/lib/consent'
import { query } from '@/lib/db'
import { extractLeadColumns } from '@/lib/forms'
import { AMBIENTE_FIELD, ambienteAtual } from '@/lib/leads/ambiente'
import { destinatariosPorUf } from '@/lib/leads/destinatarios'
import { COLUNAS_DA_LINHA, type LinhaDoLead } from '@/lib/leads/linha'

/**
 * SQL das duas etapas (spec 4.2, R4 a R6). Uma linha por lead; quem conclui a linha também a
 * reivindica (`envio_em = now()`) no mesmo comando, e é isso que impede o cron de enviá-la de novo.
 * Cada consulta começa com uma etiqueta em comentário, lida pelos testes.
 */

export type ContextoDoEnvio = { origem: Record<string, string>; gclid: string | null; adsConsent: string }

/** Atribuição (cookie de 1ª parte), ambiente e consentimento de anúncio, como o formulário antigo. */
export async function contextoDoEnvio(): Promise<ContextoDoEnvio> {
  const jar = await cookies()
  const campos = buildAttributionFields(parseAttributionCookie(jar.get(ATTRIBUTION_COOKIE)?.value))
  const origem: Record<string, string> = { [AMBIENTE_FIELD]: ambienteAtual() }
  for (const campo of campos) origem[`origem — ${campo.label}`] = campo.value
  const adsConsent = consentimentoDeAnuncio(jar.get(CONSENT_COOKIE_NAME)?.value, paisDaRequisicao(await headers()))
  return { origem, gclid: extractLeadColumns(origem).gclid ?? null, adsConsent }
}

function destinoDe(dados: Record<string, string>): string {
  return destinatariosPorUf(dados.uf).join(', ')
}

const TOKEN_DENTRO_DE_30_MIN = "created_at > now() - interval '30 minutes'"

export async function inserirEtapa1(dados: Record<string, string>, ctx: ContextoDoEnvio, token: string): Promise<string> {
  const { rows } = await query<{ id: string }>(
    `/* proposta:inserir-etapa1 */
     insert into cms.leads (form, data, gclid, email, ads_consent, notificado_para, etapa, token_envio, envio_em)
     values ('proposta', $1, $2, $3, $4, $5, 1, $6, null) returning id`,
    [{ ...dados, ...ctx.origem }, ctx.gclid, dados.email ?? null, ctx.adsConsent, destinoDe(dados), token],
  )
  const id = rows[0]?.id
  if (!id) throw new Error('INSERT da etapa 1 não devolveu id.')
  return id
}

/** "Voltar" (R6): corrige a etapa 1 da mesma linha. O e-mail sai do `data` se a pessoa o apagou. */
export async function atualizarEtapa1(token: string, dados: Record<string, string>): Promise<boolean> {
  const { rowCount } = await query(
    `/* proposta:atualizar-etapa1 */
     update cms.leads set data = (data - 'email') || $2::jsonb, email = $3, notificado_para = $4
      where token_envio = $1 and etapa = 1 and envio_em is null and ${TOKEN_DENTRO_DE_30_MIN}`,
    [token, dados, dados.email ?? null, destinoDe(dados)],
  )
  return (rowCount ?? 0) > 0
}

/** Etapa 2 pelo token: válido 30 min, uso único (etapa = 1), e já reivindica a linha. */
export async function concluirEtapa2(token: string, dados: Record<string, string>): Promise<LinhaDoLead | null> {
  const { rows } = await query<LinhaDoLead>(
    `/* proposta:concluir-etapa2 */
     update cms.leads set data = data || $2::jsonb, etapa = 2, envio_em = now()
      where token_envio = $1 and etapa = 1 and envio_em is null and ${TOKEN_DENTRO_DE_30_MIN}
      returning ${COLUNAS_DA_LINHA}`,
    [token, dados],
  )
  return rows[0] ?? null
}

/**
 * Token vencido mas Turnstile novo (R5, DP3): reaproveita a linha do cookie enquanto o cron não a
 * reivindicou, sem o limite dos 30 min. Se o cron já enviou, nada é atualizado e a action grava
 * uma linha nova completa (duplicata aceita pela spec 4.2).
 */
export async function absorverComTurnstile(token: string, dados: Record<string, string>): Promise<LinhaDoLead | null> {
  const { rows } = await query<LinhaDoLead>(
    `/* proposta:absorver */
     update cms.leads
        set data = (data - 'email') || $2::jsonb, email = $3, notificado_para = $4, etapa = 2, envio_em = now()
      where token_envio = $1 and etapa = 1 and envio_em is null
      returning ${COLUNAS_DA_LINHA}`,
    [token, dados, dados.email ?? null, destinoDe(dados)],
  )
  return rows[0] ?? null
}

/** Linha nova completa (etapa 2). `envio_em` fica no default `now()`: nasce reivindicada. */
export async function inserirCompleta(dados: Record<string, string>, ctx: ContextoDoEnvio): Promise<LinhaDoLead> {
  const { rows } = await query<LinhaDoLead>(
    `/* proposta:inserir-completa */
     insert into cms.leads (form, data, gclid, email, ads_consent, notificado_para, etapa)
     values ('proposta', $1, $2, $3, $4, $5, 2) returning ${COLUNAS_DA_LINHA}`,
    [{ ...dados, ...ctx.origem }, ctx.gclid, dados.email ?? null, ctx.adsConsent, destinoDe(dados)],
  )
  const linha = rows[0]
  if (!linha) throw new Error('INSERT da proposta completa não devolveu a linha.')
  return linha
}
```

- [ ] **Step 5: As actions — `src/app/(site)/_actions/proposta-duas-etapas.ts`**

```ts
'use server'

/**
 * **Só exporte função async deste arquivo** (mesma regra de `(frontend)/_actions/submit-form.ts`):
 * todo export de um módulo `'use server'` vira Server Action, inclusive um `export type`, e isso já
 * derrubou a captação por 12 dias. Tipos vêm de `@/lib/propostaDuasEtapas/resultado`.
 *
 * Pedido de proposta em duas etapas (spec 4.2). As três actions nunca lançam: devolvem
 * `ResultadoEtapa`. Uma linha por lead; Exact, e-mail e Ads saem uma vez, pela pós-gravação, só
 * quando a linha é concluída (aqui) ou quando o cron reivindica a etapa 1 parada há 45 min.
 */

import { randomUUID } from 'node:crypto'
import { clienteIp } from '@/lib/clienteIp'
import type { LinhaDoLead } from '@/lib/leads/linha'
import { processarPosGravacao } from '@/lib/leads/posGravacao'
import { reportarFalhaDoLead } from '@/lib/leads/reportar'
import { apagarTokenDaEtapa, gravarTokenDaEtapa, lerTokenDaEtapa } from '@/lib/propostaDuasEtapas/cookie'
import {
  absorverComTurnstile,
  atualizarEtapa1,
  concluirEtapa2,
  contextoDoEnvio,
  inserirCompleta,
  inserirEtapa1,
} from '@/lib/propostaDuasEtapas/gravacao'
import type { ResultadoEtapa, ResultadoFalha } from '@/lib/propostaDuasEtapas/resultado'
import {
  dadosDaEtapa1,
  dadosDaEtapa2,
  type Etapa2Dados,
  errosPorCampo,
  etapa1Schema,
  etapa2Schema,
  propostaCompletaSchema,
} from '@/lib/propostaDuasEtapas/schema'
import { rateLimit } from '@/lib/rate-limit'
import { verifyTurnstile } from '@/lib/turnstile'

const FALHA: ResultadoFalha = { ok: false, motivo: 'falha', mensagem: 'Não conseguimos registrar seu pedido agora.' }
const MUITAS: ResultadoFalha = { ok: false, motivo: 'recusado', mensagem: 'Muitas tentativas, tente em instantes.' }
const ANTI_ROBO: ResultadoFalha = {
  ok: false,
  motivo: 'recusado',
  mensagem: 'A verificação de segurança falhou. Tente de novo.',
}
const PRECISA_VERIFICAR: ResultadoFalha = { ok: false, motivo: 'precisa_verificar' }

/** Cota por IP e janela de 1 min (DP11). Rate limit antes do Turnstile, como o formulário antigo. */
function dentroDoLimite(chave: 'proposta' | 'proposta-etapa2', ip: string | undefined): boolean {
  const max = chave === 'proposta' ? 5 : 10
  return rateLimit(`${chave}:${ip ?? 'anon'}`, { max, windowMs: 60_000 }).ok
}

/** Exact, e-mail e Ads. Nunca muda a resposta: o lead já está salvo. */
async function depoisDeGravar(linha: LinhaDoLead): Promise<void> {
  try {
    await processarPosGravacao(linha, 'acao')
  } catch (erro) {
    reportarFalhaDoLead('pos_gravacao', erro, { leadId: linha.id, origem: 'acao' })
  }
}

export async function enviarEtapa1(valores: unknown, turnstileToken: string | null): Promise<ResultadoEtapa> {
  const lido = etapa1Schema.safeParse(valores)
  if (!lido.success) return { ok: false, motivo: 'campos', erros: errosPorCampo(lido.error.issues) }
  try {
    const ip = await clienteIp()
    if (!dentroDoLimite('proposta', ip)) return MUITAS
    const dados = dadosDaEtapa1(lido.data)
    const token = await lerTokenDaEtapa()
    if (token && (await atualizarEtapa1(token, dados))) return { ok: true, etapa: 1 }
    if (!turnstileToken) return PRECISA_VERIFICAR
    if (!(await verifyTurnstile(turnstileToken, ip))) return ANTI_ROBO
    const novo = randomUUID()
    await inserirEtapa1(dados, await contextoDoEnvio(), novo)
    await gravarTokenDaEtapa(novo)
    return { ok: true, etapa: 1 }
  } catch (erro) {
    reportarFalhaDoLead('gravacao', erro, { origem: 'etapa1' })
    return FALHA
  }
}

async function gravarEtapa2(dados: Etapa2Dados): Promise<LinhaDoLead | ResultadoFalha> {
  try {
    if (!dentroDoLimite('proposta-etapa2', await clienteIp())) return MUITAS
    const token = await lerTokenDaEtapa()
    if (!token) return PRECISA_VERIFICAR
    const linha = await concluirEtapa2(token, dadosDaEtapa2(dados))
    if (!linha) return PRECISA_VERIFICAR
    await apagarTokenDaEtapa()
    return linha
  } catch (erro) {
    reportarFalhaDoLead('gravacao', erro, { origem: 'etapa2' })
    return FALHA
  }
}

export async function enviarEtapa2(valores: unknown): Promise<ResultadoEtapa> {
  const lido = etapa2Schema.safeParse(valores)
  if (!lido.success) return { ok: false, motivo: 'campos', erros: errosPorCampo(lido.error.issues) }
  const gravado = await gravarEtapa2(lido.data)
  if ('ok' in gravado) return gravado
  await depoisDeGravar(gravado)
  return { ok: true, etapa: 2 }
}

async function gravarCompleta(dados: Record<string, string>, turnstileToken: string): Promise<LinhaDoLead | ResultadoFalha> {
  try {
    const ip = await clienteIp()
    if (!dentroDoLimite('proposta', ip)) return MUITAS
    if (!turnstileToken) return PRECISA_VERIFICAR
    if (!(await verifyTurnstile(turnstileToken, ip))) return ANTI_ROBO
    const token = await lerTokenDaEtapa()
    const absorvida = token ? await absorverComTurnstile(token, dados) : null
    const linha = absorvida ?? (await inserirCompleta(dados, await contextoDoEnvio()))
    await apagarTokenDaEtapa()
    return linha
  } catch (erro) {
    reportarFalhaDoLead('gravacao', erro, { origem: 'completa' })
    return FALHA
  }
}

export async function enviarPropostaCompleta(valores: unknown, turnstileToken: string): Promise<ResultadoEtapa> {
  const lido = propostaCompletaSchema.safeParse(valores)
  if (!lido.success) return { ok: false, motivo: 'campos', erros: errosPorCampo(lido.error.issues) }
  const gravado = await gravarCompleta({ ...dadosDaEtapa1(lido.data), ...dadosDaEtapa2(lido.data) }, turnstileToken)
  if ('ok' in gravado) return gravado
  await depoisDeGravar(gravado)
  return { ok: true, etapa: 2 }
}
```

- [ ] **Step 6: Rodar os testes das actions e o portão de Server Actions**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/proposta-duas-etapas.int.spec.ts` e `pnpm run check:server-actions`
Expected: PASS; o portão lista `src/app/(site)/_actions/proposta-duas-etapas.ts` entre os módulos `'use server'` sem export de tipo.

- [ ] **Step 7: Formulário antigo — ambiente e Sentry (contrato intocado)**

Teste primeiro. Em `tests/int/submit-form.int.spec.ts`:
1. Ao lado dos mocks do topo: `const captureExceptionMock = vi.fn()` e `vi.mock('@sentry/nextjs', () => ({ captureException: (...a: unknown[]) => captureExceptionMock(...a) }))`.
2. Logo depois do `const { submitForm } = await import(...)`, acrescentar ganchos de arquivo (rodam antes/depois dos de cada `describe`):

```ts
// O formulário antigo só envia Exact e e-mail em produção (R1); a suíte simula produção, e o
// teste de Preview abaixo troca o ambiente.
beforeEach(() => {
  vi.stubEnv('VERCEL_ENV', 'production')
})
afterEach(() => {
  vi.unstubAllEnvs()
})
```

3. Acrescentar no fim do arquivo:

```ts
describe('submitForm — ambiente e Sentry (fase 2 do site v2)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    queryMock.mockImplementation(async (sql: string) => respostaComLotacao(sql, '99'))
    sendMailMock.mockResolvedValue({ ok: true })
    verifyTurnstileMock.mockResolvedValue(true)
    cookiesMock.mockResolvedValue(fakeCookiesSemAtribuicao())
    pushLeadMock.mockResolvedValue({ ok: true, exactLeadId: 1 })
  })

  const proposta = {
    tipo: 'Condomínio residencial',
    nome: 'Maria',
    email: 'maria@example.com',
    telefone: '+5583999501388',
    cidade: 'João Pessoa e região',
  }

  it('grava data.ambiente e, em Preview, não chama Exact nem e-mail (R1)', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    headersMock.mockResolvedValue(fakeHeaders('203.0.113.201'))
    const r = await submitForm('proposta', proposta, 'test-token')
    expect(r.ok).toBe(true)
    const [, params] = queryMock.mock.calls[0] as [string, unknown[]]
    expect(params[1]).toMatchObject({ ambiente: 'preview' })
    expect(pushLeadMock).not.toHaveBeenCalled()
    expect(sendMailMock).not.toHaveBeenCalled()
  })

  it('em produção segue como sempre: Exact e e-mail na hora', async () => {
    headersMock.mockResolvedValue(fakeHeaders('203.0.113.202'))
    await submitForm('proposta', proposta, 'test-token')
    expect(pushLeadMock).toHaveBeenCalledTimes(1)
    expect(sendMailMock).toHaveBeenCalled()
  })

  it('falha de gravação vai ao Sentry do servidor e a resposta segue genérica', async () => {
    headersMock.mockResolvedValue(fakeHeaders('203.0.113.203'))
    queryMock.mockRejectedValue(new Error('ECONNREFUSED'))
    const r = await submitForm('proposta', proposta, 'test-token')
    expect(r).toEqual({ ok: false, message: 'Erro ao enviar. Tente novamente.' })
    expect(captureExceptionMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ tags: expect.objectContaining({ passo: 'gravacao', origem: 'proposta' }) }),
    )
  })
})
```

Em `tests/int/proposta-rapida.int.spec.ts`, acrescentar os mesmos dois ganchos de arquivo (`vi.stubEnv('VERCEL_ENV', 'production')` / `vi.unstubAllEnvs()`) depois do `await import` da action (importar `afterEach` do `vitest` se faltar).

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/submit-form.int.spec.ts tests/int/proposta-rapida.int.spec.ts`
Expected: FAIL nos três testes novos.

Código, em `src/app/(frontend)/_actions/submit-form.ts`:
1. Imports: `import { AMBIENTE_FIELD, ambienteAtual, ambienteLiberaEnvio } from '@/lib/leads/ambiente'` e `import { reportarFalhaDoLead } from '@/lib/leads/reportar'`.
2. `montarLeadData` ganha o terceiro parâmetro e grava o ambiente (fora do Experience, DP4):

```ts
function montarLeadData(
  data: DadosDoEnvio,
  attributionFields: { label: string; value: string }[],
  formType: FormType,
): Record<string, string> {
  const leadData: Record<string, string> = {}
  for (const [field, value] of Object.entries(data)) {
    if (value !== undefined) {
      leadData[field] = String(value)
    }
  }
  // De onde veio a linha (R1). O Experience fica de fora: o `data` dele vai para a função
  // `cms.experience_lotacao`, que não tem DDL neste repo e cuja entrada não mexemos.
  if (formType !== 'experience') leadData[AMBIENTE_FIELD] = ambienteAtual()
  for (const f of attributionFields) {
    leadData[`origem — ${f.label}`] = f.value
  }
  return leadData
}
```

   e a chamada em `processarEnvio` vira `montarLeadData(data, attributionFields, formType)`.
3. Em `processarEnvio`, logo depois do bloco `if (gravado.lotado) { … }`:

```ts
    // Preview e local gravam no banco de produção; daqui não sai nada (R1).
    if (!ambienteLiberaEnvio(leadData)) {
      console.info(`[submit-form] ambiente ${leadData[AMBIENTE_FIELD]}: lead gravado; Exact e e-mail não saem.`)
      return { ok: true, message: 'Recebemos sua mensagem!' }
    }
```

4. Sentry nos `catch` e nas recusas (nenhum dado pessoal):
   - `enviarAoExact`: dentro do `if (push)`, depois do `await query(...)`, acrescentar `if (!push.ok) reportarFalhaDoLead('exact', new Error('Exact recusou ou não respondeu (detalhe em exact_error)'), { leadId: leadRowId, origem: formType })`; no `catch (exactErr)`, depois do `console.error`, `reportarFalhaDoLead('exact', exactErr, { leadId: leadRowId, origem: formType })`.
   - `enviarNotificacao`: no `if (notificationResult.ok === false)`, acrescentar `reportarFalhaDoLead('email', new Error('SendGrid recusou a notificação interna'), { leadId: leadRowId, origem: envio.formType })`.
   - `enviarAutoReply`: no `if (autoReplyResult.ok === false)`, acrescentar `reportarFalhaDoLead('email', new Error('SendGrid recusou o aviso ao lead'), { origem: envio.formType })`.
   - `enviarEmails`: no `catch (mailErr)`, acrescentar `reportarFalhaDoLead('email', mailErr, { leadId: emails.leadRowId, origem: emails.envio.formType })`.
   - `processarEnvio`: no `catch (err)` final, acrescentar `reportarFalhaDoLead('gravacao', err, { origem: formType })`.

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/submit-form.int.spec.ts tests/int/proposta-rapida.int.spec.ts tests/int/experience-exact-guard.int.spec.ts tests/int/experience-lotacao.int.spec.ts`
Expected: PASS (o Experience segue com o `data` de cinco campos, sem `ambiente`).

- [ ] **Step 8: Checkpoint: portões e commitar**

```powershell
pnpm exec biome check --write src/lib/propostaDuasEtapas/resultado.ts src/lib/propostaDuasEtapas/cookie.ts src/lib/propostaDuasEtapas/gravacao.ts "src/app/(site)/_actions/proposta-duas-etapas.ts" "src/app/(frontend)/_actions/submit-form.ts" tests/int/proposta-duas-etapas.int.spec.ts tests/int/submit-form.int.spec.ts tests/int/proposta-rapida.int.spec.ts
pnpm exec biome ci ./src ./tests ./scripts
pnpm exec tsc --noEmit
pnpm run check:server-actions
pnpm run test:int
pnpm build
git branch --show-current && git add src/lib/propostaDuasEtapas/resultado.ts src/lib/propostaDuasEtapas/cookie.ts src/lib/propostaDuasEtapas/gravacao.ts "src/app/(site)/_actions/proposta-duas-etapas.ts" "src/app/(frontend)/_actions/submit-form.ts" tests/int/proposta-duas-etapas.int.spec.ts tests/int/submit-form.int.spec.ts tests/int/proposta-rapida.int.spec.ts && git commit -m "feat(proposta): Server Actions das duas etapas com token em cookie HttpOnly

Etapa 1 grava uma linha e devolve o token; etapa 2 conclui a mesma linha pelo
token (30 min, uso único, no banco) e envia uma vez; token perdido pede Turnstile
e reaproveita a linha. Formulário antigo grava o ambiente, não envia fora de
produção e reporta falhas ao Sentry do servidor, sem mudar o contrato.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
```

Expected: os cinco portões verdes.

---

## Tarefa 2.5: Crons — etapa 1 vencida a cada 15 min, reenvio do Exact com trava e lote do Ads como rede de recuperação

**Files:**
- Create: `src/lib/leads/criterios.ts`
- Modify: `src/app/api/cron/push-exact-leads/route.ts` (arquivo inteiro)
- Modify: `src/app/api/cron/upload-ads-conversions/route.ts` (corpo do `GET`, `:85-238`; docblock `:8-58` mantido, com a troca de uma frase)
- Modify: `vercel.json`
- Modify: `docs/DEPLOY.md:99-104` e seção 4 (`:172-175`)
- Test: `tests/int/cron-exact.int.spec.ts` (arquivo inteiro), `tests/int/cron-ads.int.spec.ts` (acrescentar)

**Interfaces:**
- Consumes (2.1): colunas `etapa`, `envio_em`, `exact_tentativa_em`. (2.2): `SQL_AMBIENTE_LIBERADO`, `TIPO_CLIQUE_FIELD`. (2.3): `processarPosGravacao`, `dadosParaOExact`, `type LinhaDoLead`, `COLUNAS_DA_LINHA`, `reportarFalhaDoLead`, `lerConfigAds`, `obterTokenAds`, `ingerirConversoes`, `tipoDeClique`.
- Produces: `criterios.ts`: `SQL_E_CAPTACAO`, `SQL_PRONTO_PARA_ENVIO`, `SQL_NAO_E_CLIENTE`, `SQL_REIVINDICAR_ETAPA1` (params `$1` corte de 48 h, `$2` limite), `SQL_REIVINDICAR_REENVIO_EXACT` (`$1` corte, `$2` máximo de tentativas, `$3` limite), `SQL_LEADS_PARA_O_ADS` (`$1` corte de 3 dias). Resposta do cron do Exact: `{ ok, etapa1: { reivindicadas, falhas }, considerados, enviados, falhas }`.

- [ ] **Step 1: Reescrever `tests/int/cron-exact.int.spec.ts` (falha)**

Substituir o arquivo inteiro por:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SQL_AMBIENTE_LIBERADO } from '@/lib/leads/ambiente'
import { SQL_PRONTO_PARA_ENVIO } from '@/lib/leads/criterios'

/**
 * Cron `push-exact-leads` (a cada 15 min): (A) reivindica a etapa 1 parada há 45 min e manda
 * Exact + e-mail + Ads pela pós-gravação; (B) reenvia ao Exact o que falhou, com trava entre
 * execuções. Banco, pós-gravação e push mocados; o SQL é conferido pelo texto, e o roteamento do
 * dublê é pela etiqueta em comentário de cada consulta.
 */

const queryMock = vi.fn()
const pushLeadMock = vi.fn()
const posGravacaoMock = vi.fn()
const captureExceptionMock = vi.fn()

vi.mock('server-only', () => ({}))
vi.mock('@sentry/nextjs', () => ({ captureException: (...a: unknown[]) => captureExceptionMock(...a) }))
vi.mock('@/lib/db', () => ({ query: (...a: unknown[]) => queryMock(...a) }))
vi.mock('@/lib/exact/push-lead', () => ({ pushLeadToExact: (...a: unknown[]) => pushLeadMock(...a) }))
vi.mock('@/lib/leads/posGravacao', () => ({ processarPosGravacao: (...a: unknown[]) => posGravacaoMock(...a) }))

const { GET } = await import('@/app/api/cron/push-exact-leads/route')

function fakeRequest(bearer?: string): Request {
  const headers = new Headers()
  if (bearer !== undefined) headers.set('authorization', `Bearer ${bearer}`)
  return new Request('http://localhost/api/cron/push-exact-leads', { headers })
}

const etapa1Vencida = {
  id: '61',
  form: 'proposta',
  etapa: 1,
  data: { nomeCondominio: 'Aurora', uf: 'PB', telefone: '+5583999501388', variante: 'duas-etapas', ambiente: 'production' },
  gclid: null,
  ads_consent: 'granted',
  created_at: '2026-10-16T10:00:00.000Z',
  notificado_para: 'comercial.pb@semog.com.br',
}
const pendente = {
  id: '42',
  form: 'proposta',
  etapa: null,
  data: { nome: 'Maria', nomeCondominio: 'Aurora', email: 'm@x.com', telefone: '+5583999501388' },
}

function bancoCom(fila: { etapa1?: unknown[]; reenvio?: unknown[] }) {
  queryMock.mockImplementation(async (sql: string) => {
    if (sql.includes('cron:reivindicar-etapa1')) return { rows: fila.etapa1 ?? [] }
    if (sql.includes('cron:reivindicar-reenvio-exact')) return { rows: fila.reenvio ?? [] }
    return { rows: [], rowCount: 1 }
  })
}
function sqlDe(etiqueta: string): string {
  return String(queryMock.mock.calls.find(([sql]) => String(sql).includes(etiqueta))?.[0] ?? '')
}
function updatesDoExact() {
  return queryMock.mock.calls.filter(([sql]) => /set exact_lead_id = \$1/.test(String(sql))) as [string, unknown[]][]
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubEnv('CRON_SECRET', 'segredo-de-teste')
  posGravacaoMock.mockResolvedValue({ exact: 'enviado', email: 'enviado', ads: 'sem_clique' })
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('cron push-exact-leads', () => {
  it('sem bearer correto devolve 401 e não consulta o banco', async () => {
    const res = await GET(fakeRequest('errado'))
    expect(res.status).toBe(401)
    expect(queryMock).not.toHaveBeenCalled()
  })

  it('etapa 1 vencida: reivindica e manda Exact, e-mail e Ads uma vez, pela pós-gravação (R3)', async () => {
    bancoCom({ etapa1: [etapa1Vencida] })
    const res = await GET(fakeRequest('segredo-de-teste'))
    const body = (await res.json()) as { ok: boolean; etapa1: { reivindicadas: number } }
    expect(res.status).toBe(200)
    expect(body.etapa1.reivindicadas).toBe(1)
    expect(posGravacaoMock).toHaveBeenCalledTimes(1)
    expect(posGravacaoMock).toHaveBeenCalledWith(etapa1Vencida, 'cron')
    expect(pushLeadMock).not.toHaveBeenCalled()
  })

  it('corrida: o que outra execução já reivindicou não volta, porque a trava é do banco', async () => {
    bancoCom({})
    await GET(fakeRequest('segredo-de-teste'))
    expect(posGravacaoMock).not.toHaveBeenCalled()
    const sql = sqlDe('cron:reivindicar-etapa1')
    expect(sql).toMatch(/update cms\.leads set envio_em = now\(\)/)
    expect(sql).toMatch(/where envio_em is null/)
    expect(sql).toMatch(/for update skip locked/)
    expect(sql).toMatch(/returning id, form, etapa, data, gclid, ads_consent, created_at, notificado_para/)
  })

  it('critério da etapa 1: só proposta de produção, com etapa 1 há mais de 45 min, dentro da janela', async () => {
    bancoCom({})
    await GET(fakeRequest('segredo-de-teste'))
    const sql = sqlDe('cron:reivindicar-etapa1')
    expect(sql).toMatch(/and etapa = 1/)
    expect(sql).toMatch(/and form = 'proposta'/)
    expect(sql).toContain("created_at < now() - interval '45 minutes'")
    expect(sql).toMatch(/created_at > \$1/)
    expect(sql).toContain(SQL_AMBIENTE_LIBERADO)
  })

  it('critério do reenvio: o da spec 4.3, só captação de produção, não cliente, já processada, com trava', async () => {
    bancoCom({})
    await GET(fakeRequest('segredo-de-teste'))
    const sql = sqlDe('cron:reivindicar-reenvio-exact')
    expect(SQL_PRONTO_PARA_ENVIO).toBe("(etapa is null or etapa = 2 or created_at < now() - interval '45 minutes')")
    expect(sql).toContain(SQL_PRONTO_PARA_ENVIO)
    expect(sql).toMatch(/exact_lead_id is null/)
    expect(sql).toMatch(/exact_attempts < \$2/)
    expect(sql).toMatch(/form = 'contato' and data->>'assunto' = 'proposta-comercial'/)
    expect(sql).toContain(SQL_AMBIENTE_LIBERADO)
    expect(sql).toContain("coalesce(data->>'cliente', '') <> 'sim'")
    expect(sql).toMatch(/envio_em is not null and envio_em < now\(\) - interval '10 minutes'/)
    expect(sql).toMatch(/exact_tentativa_em is null or exact_tentativa_em < now\(\) - interval '10 minutes'/)
    expect(sql).toMatch(/update cms\.leads set exact_tentativa_em = now\(\)/)
    expect(sql).toMatch(/for update skip locked/)
  })

  it('linha com etapa nula (formulário antigo) é reenviada como completa e grava o id', async () => {
    bancoCom({ reenvio: [pendente] })
    pushLeadMock.mockResolvedValue({ ok: true, exactLeadId: 777 })
    const res = await GET(fakeRequest('segredo-de-teste'))
    const body = (await res.json()) as { ok: boolean; enviados: number; falhas: number }
    expect(body).toMatchObject({ ok: true, enviados: 1, falhas: 0 })
    expect(pushLeadMock).toHaveBeenCalledWith('proposta', pendente.data)
    expect(updatesDoExact()[0]?.[1]).toEqual([777, null, '42'])
  })

  it('reenvio de etapa 1 leva "etapa: 1" ao mapeamento (descrição parcial)', async () => {
    bancoCom({ reenvio: [{ ...pendente, etapa: 1 }] })
    pushLeadMock.mockResolvedValue({ ok: true, exactLeadId: 778 })
    await GET(fakeRequest('segredo-de-teste'))
    expect(pushLeadMock).toHaveBeenCalledWith('proposta', { ...pendente.data, etapa: '1' })
  })

  it('falha continua contabilizada e não interrompe o lote', async () => {
    bancoCom({ reenvio: [pendente, { ...pendente, id: '43' }] })
    pushLeadMock
      .mockResolvedValueOnce({ ok: false, error: 'Exact fora do ar' })
      .mockResolvedValueOnce({ ok: true, exactLeadId: 778 })
    const res = await GET(fakeRequest('segredo-de-teste'))
    expect(await res.json()).toMatchObject({ ok: false, enviados: 1, falhas: 1 })
    expect(updatesDoExact()).toHaveLength(2)
  })

  it('erro no banco vira 500 e vai ao Sentry', async () => {
    queryMock.mockRejectedValue(new Error('connection refused'))
    const res = await GET(fakeRequest('segredo-de-teste'))
    expect(res.status).toBe(500)
    expect(captureExceptionMock).toHaveBeenCalledTimes(1)
  })
})
```

Acrescentar ao fim de `tests/int/cron-ads.int.spec.ts` (dentro do `describe` principal, que já configura env, JWT e `fetch`):

```ts
  it('SELECT de leads segue o critério das duas etapas, ambiente, cliente e já processada (D1)', async () => {
    selects([])
    await GET(fakeRequest(ENV_VARS.CRON_SECRET))
    const [sql] = queryMock.mock.calls[0] as [string, unknown[]]
    expect(sql).toContain("(etapa is null or etapa = 2 or created_at < now() - interval '45 minutes')")
    expect(sql).toContain("coalesce(data->>'ambiente', 'production') = 'production'")
    expect(sql).toContain("coalesce(data->>'cliente', '') <> 'sim'")
    expect(sql).toMatch(/envio_em is not null and envio_em < now\(\) - interval '10 minutes'/)
  })

  it('gbraid sobe no campo gbraid, não como gclid (R9)', async () => {
    selects([{ ...leadComGclid, gclid: 'GBRAID-1', tipo_de_clique: 'gbraid' }])
    queryMock.mockResolvedValueOnce({ rows: [] })
    await GET(fakeRequest(ENV_VARS.CRON_SECRET))
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    const body = JSON.parse(options.body as string)
    expect(body.events[0].adIdentifiers).toEqual({ gbraid: 'GBRAID-1' })
    expect(body.events[0].transactionId).toBe('lead-42')
  })
```

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/cron-exact.int.spec.ts tests/int/cron-ads.int.spec.ts`
Expected: FAIL — `@/lib/leads/criterios` não existe; as rotas ainda têm o SQL antigo.

- [ ] **Step 2: `src/lib/leads/criterios.ts`**

```ts
import { TIPO_CLIQUE_FIELD } from '@/lib/forms'
import { SQL_AMBIENTE_LIBERADO } from './ambiente'
import { COLUNAS_DA_LINHA } from './linha'

/**
 * SQL dos crons de captação (spec 4.3 e 4.4). Ficam fora das rotas porque arquivo de Route Handler
 * só pode exportar os handlers e as opções do Next. Cada consulta começa com uma etiqueta em
 * comentário, lida pelos testes.
 */

/** Captação: proposta, ou contato com assunto proposta comercial (o resto do contato é atendimento). */
export const SQL_E_CAPTACAO =
  "(form = 'proposta' or (form = 'contato' and data->>'assunto' = 'proposta-comercial'))"

/** Critério da spec 4.3: etapa nula (formulário antigo) e etapa 2 valem na hora; etapa 1 só depois de 45 min. */
export const SQL_PRONTO_PARA_ENVIO =
  "(etapa is null or etapa = 2 or created_at < now() - interval '45 minutes')"

/** "Já sou cliente" não é lead (spec 4.3). */
export const SQL_NAO_E_CLIENTE = "coalesce(data->>'cliente', '') <> 'sim'"

/** Quem gravou ou reivindicou já teve 10 min para enviar (o Exact tem timeout de 8 s). */
const SQL_JA_PROCESSADA = "envio_em is not null and envio_em < now() - interval '10 minutes'"

/**
 * (A) Etapa 1 sem etapa 2 há 45 min: reivindica (trava) e devolve a linha para a pós-gravação. O
 * token vale 30 min, então a etapa 2 nunca disputa esta linha com o cron (R4); `skip locked` evita
 * que duas execuções do cron peguem a mesma.
 */
export const SQL_REIVINDICAR_ETAPA1 = `/* cron:reivindicar-etapa1 */
update cms.leads set envio_em = now()
 where id in (
   select id from cms.leads
    where envio_em is null
      and etapa = 1
      and form = 'proposta'
      and created_at < now() - interval '45 minutes'
      and created_at > $1
      and ${SQL_AMBIENTE_LIBERADO}
    order by created_at asc
    limit $2
    for update skip locked)
returning ${COLUNAS_DA_LINHA}`

/** (B) Reenvio ao Exact do que falhou, com trava entre execuções (`exact_tentativa_em`). */
export const SQL_REIVINDICAR_REENVIO_EXACT = `/* cron:reivindicar-reenvio-exact */
update cms.leads set exact_tentativa_em = now()
 where id in (
   select id from cms.leads
    where exact_lead_id is null
      and created_at > $1
      and exact_attempts < $2
      and ${SQL_E_CAPTACAO}
      and ${SQL_PRONTO_PARA_ENVIO}
      and ${SQL_JA_PROCESSADA}
      and (exact_tentativa_em is null or exact_tentativa_em < now() - interval '10 minutes')
      and ${SQL_AMBIENTE_LIBERADO}
      and ${SQL_NAO_E_CLIENTE}
    order by created_at asc
    limit $3
    for update skip locked)
returning id, form, etapa, data`

/** Lote diário do Ads (rede de recuperação, D1): o mesmo critério do envio na hora. */
export const SQL_LEADS_PARA_O_ADS = `/* cron:leads-para-o-ads */
select id, created_at, gclid, ads_consent, data->>'${TIPO_CLIQUE_FIELD}' as tipo_de_clique
  from cms.leads
 where gclid is not null
   and ${SQL_E_CAPTACAO}
   and created_at > $1 and uploaded_to_ads = false
   and ${SQL_PRONTO_PARA_ENVIO}
   and ${SQL_JA_PROCESSADA}
   and ${SQL_AMBIENTE_LIBERADO}
   and ${SQL_NAO_E_CLIENTE}
 order by created_at desc`
```

- [ ] **Step 3: `src/app/api/cron/push-exact-leads/route.ts` (arquivo inteiro)**

```ts
import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { pushLeadToExact } from '@/lib/exact/push-lead'
import { SQL_REIVINDICAR_ETAPA1, SQL_REIVINDICAR_REENVIO_EXACT } from '@/lib/leads/criterios'
import { dadosParaOExact, type LinhaDoLead } from '@/lib/leads/linha'
import { processarPosGravacao } from '@/lib/leads/posGravacao'
import { reportarFalhaDoLead } from '@/lib/leads/reportar'

/**
 * Cron (Vercel), **a cada 15 minutos** (`vercel.json`; a conta é Pro, sem o limite de 1×/dia do
 * Hobby). Duas fases:
 *
 * (A) **Etapa 1 sem etapa 2 há 45 min** (formulário de duas etapas, spec 4.3): reivindica a linha
 * no banco e manda Exact + e-mail interno + Ads uma vez, pela mesma pós-gravação da action. Com
 * a frequência de 15 min, a espera real fica entre 45 e 60 min.
 *
 * (B) **Rede de segurança do Exact:** o que falhou na hora (CRM fora do ar, timeout, payload
 * recusado) é reenviado por 48 h, até 5 tentativas, com trava contra duas execuções simultâneas.
 * Linha com `etapa` nula (formulário antigo, contato "proposta comercial") vale como completa.
 *
 * Só linhas de produção ou antigas (`data.ambiente`): Preview e local gravam no mesmo banco.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const WINDOW_HOURS = 48
const MAX_ATTEMPTS = 5
const LOTE_ETAPA1 = 10
const LOTE_REENVIO = 20

type Reenvio = Pick<LinhaDoLead, 'id' | 'form' | 'etapa' | 'data'>

async function enviarEtapas1Vencidas(corte: string): Promise<{ reivindicadas: number; falhas: number }> {
  const { rows } = await query<LinhaDoLead>(SQL_REIVINDICAR_ETAPA1, [corte, LOTE_ETAPA1])
  let falhas = 0
  // Sequencial: poucos leads por hora, e o Exact limita a 30 requisições a cada 20 s.
  for (const linha of rows) {
    const resumo = await processarPosGravacao(linha, 'cron')
    if (resumo.exact === 'falhou') falhas += 1
  }
  return { reivindicadas: rows.length, falhas }
}

async function reenviarAoExact(corte: string): Promise<{ considerados: number; enviados: number; falhas: number }> {
  const { rows } = await query<Reenvio>(SQL_REIVINDICAR_REENVIO_EXACT, [corte, MAX_ATTEMPTS, LOTE_REENVIO])
  let enviados = 0
  let falhas = 0
  for (const lead of rows) {
    const push = await pushLeadToExact(lead.form, dadosParaOExact(lead))
    if (!push) continue
    if (push.ok) enviados += 1
    else falhas += 1
    await query(
      `update cms.leads
          set exact_lead_id = $1, exact_error = $2, exact_attempts = exact_attempts + 1
        where id = $3`,
      [push.ok ? push.exactLeadId : null, push.ok ? (push.personError ?? null) : push.error, lead.id],
    )
  }
  return { considerados: rows.length, enviados, falhas }
}

export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const corte = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString()
    const etapa1 = await enviarEtapas1Vencidas(corte)
    const reenvio = await reenviarAoExact(corte)
    return NextResponse.json({ ok: etapa1.falhas === 0 && reenvio.falhas === 0, etapa1, ...reenvio })
  } catch (err) {
    reportarFalhaDoLead('cron', err, { origem: 'cron-exact' })
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
```

- [ ] **Step 4: `src/app/api/cron/upload-ads-conversions/route.ts`**

No docblock (`:8-58`), trocar a frase `Roda 1×/dia (vercel.json).` por `Roda 1×/dia (vercel.json) e, desde a fase 2 do site v2, é a **rede de recuperação** do formulário: a conversão sobe na hora junto com o Exact (\`@/lib/leads/posGravacao\`); aqui sobe o que falhou lá, com o mesmo critério e o mesmo \`transactionId\`.` Manter todo o resto do docblock. Substituir do `export const runtime` até o fim do arquivo por:

```ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const WINDOW_DAYS = 3

/** Bigint (`id`) volta do `pg` como string. `tipo_de_clique` só existe no SELECT de leads. */
type PendingRow = {
  id: string
  created_at: string | Date
  gclid: string
  ads_consent: string | null
  tipo_de_clique?: string | null
}

type BatchResult = { considered: number; ok: boolean; status?: number; response?: string; skipped?: string }

async function subirLote(
  linhas: PendingRow[],
  destinoId: string,
  tabela: 'cms.leads' | 'cms.whatsapp_clicks',
  prefixo: 'lead' | 'wa',
  acesso: { token: string | null; config: ConfigAds },
): Promise<BatchResult> {
  if (linhas.length === 0) return { considered: 0, ok: true }
  if (!acesso.token) return { considered: linhas.length, ok: false, skipped: 'sem token' }
  const resultado = await ingerirConversoes(
    acesso.token,
    acesso.config,
    destinoId,
    linhas.map((linha) => ({
      transactionId: `${prefixo}-${linha.id}`,
      tipoDeClique: tipoDeClique(linha.tipo_de_clique),
      clique: linha.gclid,
      criadoEm: linha.created_at,
      adsConsent: linha.ads_consent,
    })),
  )
  // Só marca depois do OK do Google: tudo ou nada, retry natural no dia seguinte.
  if (resultado.ok) {
    await query(`update ${tabela} set uploaded_to_ads = true where id = any($1::bigint[])`, [
      linhas.map((linha) => linha.id),
    ])
  }
  return { considered: linhas.length, ok: resultado.ok, status: resultado.status, response: resultado.resposta }
}

export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // A ação do WhatsApp é opcional: sem ela, essa metade é pulada (e dita na resposta).
  const config = lerConfigAds()
  if (!config) {
    return NextResponse.json({ error: 'faltam variáveis de ambiente do Google Ads' }, { status: 500 })
  }

  try {
    const corte = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()

    // Leads de captação ainda não enviados, com o MESMO critério do envio na hora (D1):
    // pronto para envio, de produção, não cliente e já processado por quem gravou. O
    // comentário sobre o form "contato" (só proposta comercial conta) vale aqui igual.
    const { rows: leads } = await query<PendingRow>(SQL_LEADS_PARA_O_ADS, [corte])

    // Nenhum clique saído da triagem conta como conversão (ver `SECOES_FORA_DO_ADS`). O
    // `coalesce` evita descartar em silêncio o clique antigo sem seção.
    const { rows: whatsapp } = await query<PendingRow>(
      `select id, created_at, gclid, ads_consent from cms.whatsapp_clicks
       where gclid is not null and created_at > $1 and uploaded_to_ads = false
         and coalesce(section, '') <> all($2::text[])
       order by created_at desc`,
      [corte, SECOES_FORA_DO_ADS],
    )

    const precisaToken = leads.length > 0 || (whatsapp.length > 0 && Boolean(config.acaoWhatsapp))
    const acesso = { token: precisaToken ? await obterTokenAds(config) : null, config }

    const leadResult = await subirLote(leads, config.acaoProposta, 'cms.leads', 'lead', acesso)
    const waResult: BatchResult = config.acaoWhatsapp
      ? await subirLote(whatsapp, config.acaoWhatsapp, 'cms.whatsapp_clicks', 'wa', acesso)
      : {
          considered: whatsapp.length,
          ok: true,
          skipped: 'GOOGLE_ADS_WHATSAPP_CONVERSION_ACTION_ID não configurada',
        }

    return NextResponse.json({ ok: leadResult.ok && waResult.ok, leads: leadResult, whatsapp: waResult })
  } catch (err) {
    reportarFalhaDoLead('cron', err, { origem: 'cron-ads' })
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
```

Imports do topo do arquivo passam a ser:

```ts
import { NextResponse } from 'next/server'
import { type ConfigAds, ingerirConversoes, lerConfigAds, obterTokenAds, tipoDeClique } from '@/lib/ads/conversoes'
import { query } from '@/lib/db'
import { SQL_LEADS_PARA_O_ADS } from '@/lib/leads/criterios'
import { reportarFalhaDoLead } from '@/lib/leads/reportar'
import { SECOES_FORA_DO_ADS } from '@/lib/triagem'
```

(saem `JWT`, `paraDataManager`, `INGEST_URL`, `SCOPE`; o `cron-ads.int.spec.ts` já moca `server-only` e `google-auth-library`, que o módulo novo usa.)

- [ ] **Step 5: `vercel.json` e `docs/DEPLOY.md`**

`vercel.json`: trocar `"schedule": "15 * * * *"` (do `push-exact-leads`) por `"schedule": "*/15 * * * *"`. O do Ads continua `"0 6 * * *"`.

`docs/DEPLOY.md`, trocar o parágrafo `:99-104` ("O que a integração faz: … `scripts/probe-exact-create-lead.ts`.") por:

```markdown
O que a integração faz: toda submissão de **Proposta** (e de **Contato** com
`assunto = proposta-comercial`) cria um lead no funil Padrão do Exact, com contato principal, logo
depois de gravar em `cms.leads`. No formulário de duas etapas do site v2, o envio sai quando a
etapa 2 chega; se a pessoa parar na etapa 1, o cron `/api/cron/push-exact-leads` envia depois de
45 min (Exact, e-mail interno e conversão do Ads, uma vez cada). Esse cron roda **a cada 15
minutos** e também retenta por 48 h o que falhou na hora (fica em `cms.leads.exact_error`).
Quem marca "já sou cliente" não vai ao Exact nem ao Ads. Detalhes do contrato da API — que
diverge do PDF oficial da Exact — em `scripts/probe-exact-create-lead.ts`.

### Google Ads e crons (só Production)

| Variável | Descrição |
|---|---|
| `CRON_SECRET` | Bearer dos dois crons de `vercel.json`. |
| `GOOGLE_ADS_LOGIN_CUSTOMER_ID`, `GOOGLE_ADS_CUSTOMER_ID` | Conta gerente e conta operadora do Ads. |
| `GOOGLE_ADS_CONVERSION_ACTION_ID` | Ação "Proposta (servidor) - gclid". |
| `GOOGLE_ADS_WHATSAPP_CONVERSION_ACTION_ID` | Opcional: ação "WhatsApp (servidor) - gclid". |
| `GOOGLE_ADS_IMPERSONATED_EMAIL`, `GOOGLE_SA_JSON` | Conta de serviço com delegação no escopo `datamanager`. |

A conversão do formulário sobe pelo servidor junto com o Exact (Data Manager API,
`transactionId = lead-<id>`); o cron `/api/cron/upload-ads-conversions` (diário, 06:00 UTC) é a
rede de recuperação, com o mesmo critério. `gbraid`/`wbraid` vão no campo próprio.
```

Na seção 4 (Preview deployments), depois do bullet "Os previews usam o **mesmo projeto Supabase** …", acrescentar o bullet:

```markdown
- Por isso **toda linha nova de proposta e contato grava `data.ambiente`** (`VERCEL_ENV`, ou
  `local` fora da Vercel), e Exact, e-mail interno e Ads — na hora, no cron e no lote — só
  processam linhas de produção ou antigas (sem a chave). Um teste em Preview grava a linha, mas
  não sai para ninguém. `VERCEL_ENV` é variável de sistema da Vercel (precisa estar exposta).
```

- [ ] **Step 6: Rodar e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/cron-exact.int.spec.ts tests/int/cron-ads.int.spec.ts`
Expected: PASS (inclusive os testes antigos do `cron-ads`: SQL de leads ainda casa `from cms\.leads`, `gclid is not null`, `uploaded_to_ads\s*=\s*false`, `form\s*=\s*'proposta'` e o filtro de contato; WhatsApp na 2ª chamada; UPDATE em lote na 3ª).

- [ ] **Step 7: Checkpoint: portões e commitar**

```powershell
pnpm exec biome check --write src/lib/leads/criterios.ts src/app/api/cron/push-exact-leads/route.ts src/app/api/cron/upload-ads-conversions/route.ts vercel.json tests/int/cron-exact.int.spec.ts tests/int/cron-ads.int.spec.ts
pnpm exec biome ci ./src ./tests ./scripts
pnpm exec tsc --noEmit
pnpm run check:server-actions
pnpm run test:int
pnpm build
git branch --show-current && git add src/lib/leads/criterios.ts src/app/api/cron/push-exact-leads/route.ts src/app/api/cron/upload-ads-conversions/route.ts vercel.json docs/DEPLOY.md tests/int/cron-exact.int.spec.ts tests/int/cron-ads.int.spec.ts && git commit -m "feat(cron): etapa 1 vencida a cada 15 min, reenvio do Exact com trava e Ads como rede

O cron do Exact reivindica a etapa 1 parada há 45 min e envia Exact, e-mail e Ads
uma vez; o reenvio usa o critério da spec com trava entre execuções. O lote do
Ads usa o mesmo critério e o campo certo para gbraid/wbraid. DEPLOY.md corrigido
(frequência, variáveis, ambiente).

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
```

---

## Tarefa 2.6: Tela das duas etapas na `/previa-v2`

**Files:**
- Create: `src/site/formularios/proposta/textos.ts`
- Create: `src/site/formularios/proposta/leitura.ts`
- Create: `src/site/formularios/proposta/cortina.ts`
- Create: `src/site/formularios/proposta/campos.tsx`
- Create: `src/site/formularios/proposta/FalhaDoEnvio.tsx`
- Create: `src/site/formularios/proposta/useEnvioDaProposta.ts`
- Create: `src/site/formularios/proposta/FormularioProposta.tsx`
- Create: `src/site/formularios/proposta/formulario-proposta.css`
- Create: `src/site/secoes/proposta/SecaoProposta.tsx`, `src/site/secoes/proposta/proposta.css`
- Modify: `src/lib/medicaoLead.ts` (`registrarLeadQualificado`)
- Modify: `src/app/(site)/(app)/previa-v2/page.tsx`
- Test: `tests/int/site-v2-formulario-proposta.int.spec.tsx`; Modify: `tests/int/site-v2-previa.int.spec.tsx`, `tests/int/site-v2-core-ssr.int.spec.ts`

**Interfaces:**
- Consumes (2.2): `CamposEtapa1`, `CamposEtapa2`, `etapa1Schema`, `etapa2Schema`, `errosPorCampo`, `MENSAGENS`, `CIDADES_DAS_UNIDADES`, `OUTRA_CIDADE`, `UFS_COM_UNIDADE`, `OUTRAS_UFS`, `NOME_DA_UF`, `PERFIS`, `digitosDoTelefone`, `formatarTelefone`. (2.4): `enviarEtapa1`, `enviarEtapa2`, `enviarPropostaCompleta`, `ResultadoEtapa`. Existentes: `Turnstile({ onToken, className, theme })` (`src/components/forms/Turnstile.tsx:57`; o `onToken` é capturado na primeira renderização do widget, então tem de ser estável), `registrarLeadGerado(form, extras)`, `conteudo.proposta.{titulo, botao, perfis}`, `site.company.addresses[].{city, uf, phone}` (`content/site.ts:163-205`), símbolo `#seta` de `SimbolosSvg`.
- Produces: `FormularioProposta({ id: string; ufInicial?: string })` (client); `SecaoProposta({ ufInicial?: string })`; `registrarLeadQualificado(extras?: Record<string, string>)`; `aplicarResultado(estado: EstadoDoEnvio, resultado: ResultadoEtapa): EstadoDoEnvio`.

- [ ] **Step 1: Escrever os testes que falham**

Arquivo `tests/int/site-v2-formulario-proposta.int.spec.tsx`:

```tsx
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MENSAGENS } from '@/lib/propostaDuasEtapas/schema'

const etapa1Mock = vi.fn()
const etapa2Mock = vi.fn()
const completaMock = vi.fn()
const captureExceptionMock = vi.fn()
const gtag = vi.fn()

vi.mock('@/app/(site)/_actions/proposta-duas-etapas', () => ({
  enviarEtapa1: (...a: unknown[]) => etapa1Mock(...a),
  enviarEtapa2: (...a: unknown[]) => etapa2Mock(...a),
  enviarPropostaCompleta: (...a: unknown[]) => completaMock(...a),
}))
vi.mock('@/components/forms/Turnstile', () => ({
  Turnstile: ({ onToken }: { onToken: (t: string) => void }) => (
    <button type="button" onClick={() => onToken('token-teste')}>
      verificação
    </button>
  ),
}))
vi.mock('@/site/formularios/proposta/cortina', () => ({ trocarEtapa: () => ({ progress: () => undefined }) }))
vi.mock('@sentry/nextjs', () => ({ captureException: (...a: unknown[]) => captureExceptionMock(...a) }))

const { FormularioProposta } = await import('@/site/formularios/proposta/FormularioProposta')
const { TEXTOS } = await import('@/site/formularios/proposta/textos')

function montar() {
  const { container } = render(<FormularioProposta id="teste" />)
  const form = container.querySelector('form')
  if (!form) throw new Error('sem form')
  return { container, form }
}
function etapaAtiva(form: HTMLFormElement) {
  return form.getAttribute('data-etapa-ativa')
}
function preencherEtapa1(uf = 'PB') {
  fireEvent.change(screen.getByLabelText('Nome do condomínio'), { target: { value: 'Aurora' } })
  fireEvent.change(screen.getByLabelText('Estado'), { target: { value: uf } })
  fireEvent.change(screen.getByLabelText('Telefone com DDD'), { target: { value: '83999501388' } })
}
async function chegarNaEtapa2(form: HTMLFormElement, uf = 'PB') {
  etapa1Mock.mockResolvedValue({ ok: true, etapa: 1 })
  fireEvent.click(screen.getByText('verificação'))
  preencherEtapa1(uf)
  fireEvent.click(screen.getByRole('button', { name: /Continuar/ }))
  await waitFor(() => expect(etapaAtiva(form)).toBe('2'))
}
function preencherEtapa2() {
  fireEvent.change(screen.getByLabelText('Seu nome'), { target: { value: 'Maria' } })
  fireEvent.click(screen.getByLabelText('João Pessoa'))
  fireEvent.click(screen.getByLabelText('Síndico'))
  fireEvent.click(screen.getByLabelText('Não'))
}
function eventos(nome: string) {
  return gtag.mock.calls.filter(([tipo, evento]) => tipo === 'event' && evento === nome)
}

beforeEach(() => {
  vi.resetAllMocks()
  window.gtag = gtag
  window.history.replaceState({}, '', '/previa-v2')
})
afterEach(() => {
  window.gtag = undefined
})

describe('formulário de proposta em duas etapas (site v2)', () => {
  it('etapa 1 vazia mostra as mensagens do protótipo e não chama o servidor', () => {
    montar()
    fireEvent.click(screen.getByText('verificação'))
    fireEvent.click(screen.getByRole('button', { name: /Continuar/ }))
    expect(screen.getByText(MENSAGENS.condominio)).toBeTruthy()
    expect(screen.getByText(MENSAGENS.uf)).toBeTruthy()
    expect(screen.getByText(MENSAGENS.telefoneVazio)).toBeTruthy()
    expect(etapa1Mock).not.toHaveBeenCalled()
  })

  it('sem o token do Turnstile ainda, não envia e pede para aguardar', () => {
    montar()
    preencherEtapa1()
    fireEvent.click(screen.getByRole('button', { name: /Continuar/ }))
    expect(screen.getByText(TEXTOS.aguardeVerificacao)).toBeTruthy()
    expect(etapa1Mock).not.toHaveBeenCalled()
  })

  it('etapa 1 válida envia com o token, dispara generate_lead uma vez e passa à etapa 2 (R11)', async () => {
    const { form } = montar()
    await chegarNaEtapa2(form)
    expect(etapa1Mock).toHaveBeenCalledWith(
      { nomeCondominio: 'Aurora', uf: 'PB', telefone: '(83) 99950-1388', email: '' },
      'token-teste',
    )
    expect(eventos('generate_lead')).toHaveLength(1)
    expect(eventos('generate_lead')[0]?.[2]).toMatchObject({ form: 'proposta', variante: 'duas_etapas' })
  })

  it('duplo clique em Continuar chama o servidor uma vez só (Review Focus)', async () => {
    let liberar: (r: unknown) => void = () => undefined
    etapa1Mock.mockImplementation(() => new Promise((r) => { liberar = r }))
    const { form } = montar()
    fireEvent.click(screen.getByText('verificação'))
    preencherEtapa1()
    const botao = screen.getByRole('button', { name: /Continuar/ })
    fireEvent.click(botao)
    fireEvent.click(botao)
    expect(etapa1Mock).toHaveBeenCalledTimes(1)
    await act(async () => liberar({ ok: true, etapa: 1 }))
    expect(etapaAtiva(form)).toBe('2')
  })

  it('cidade da etapa 2 segue a UF (D2): PB lista as Unidades e "Outra cidade" abre o texto', async () => {
    const { form } = montar()
    await chegarNaEtapa2(form, 'PB')
    expect(screen.getByLabelText('João Pessoa')).toBeTruthy()
    expect(screen.getByLabelText('Campina Grande')).toBeTruthy()
    expect(screen.queryByLabelText(/Qual cidade/)).toBeNull()
    fireEvent.click(screen.getByLabelText('Outra cidade'))
    expect(screen.getByLabelText(/Qual cidade/)).toBeTruthy()
  })

  it('UF sem Unidade mostra só o campo de texto', async () => {
    const { form } = montar()
    await chegarNaEtapa2(form, 'SP')
    expect(screen.queryByLabelText('Outra cidade')).toBeNull()
    expect(screen.getByLabelText(/^Cidade/)).toBeTruthy()
  })

  it('voltar e reenviar a etapa 1 não pede Turnstile nem repete generate_lead; trocar a UF limpa a cidade', async () => {
    const { form } = montar()
    await chegarNaEtapa2(form, 'PB')
    fireEvent.click(screen.getByLabelText('Campina Grande'))
    fireEvent.click(screen.getByRole('button', { name: /Voltar/ }))
    expect(etapaAtiva(form)).toBe('1')
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'PE' } })
    fireEvent.click(screen.getByRole('button', { name: /Continuar/ }))
    await waitFor(() => expect(etapaAtiva(form)).toBe('2'))
    expect(etapa1Mock).toHaveBeenLastCalledWith(expect.objectContaining({ uf: 'PE' }), null)
    expect(eventos('generate_lead')).toHaveLength(1)
    expect(screen.getByLabelText('Recife')).toBeTruthy()
    expect((screen.getByLabelText('Recife') as HTMLInputElement).checked).toBe(false)
  })

  it('etapa 2 concluída mostra o sucesso e dispara lead_qualificado', async () => {
    const { form } = montar()
    await chegarNaEtapa2(form)
    etapa2Mock.mockResolvedValue({ ok: true, etapa: 2 })
    preencherEtapa2()
    fireEvent.click(screen.getByRole('button', { name: /Pedir proposta/ }))
    await waitFor(() => expect(screen.getByText(TEXTOS.sucessoTitulo)).toBeTruthy())
    expect(etapa2Mock).toHaveBeenCalledWith({ nome: 'Maria', perfil: 'sindico', cidade: 'João Pessoa', unidades: '', cliente: 'nao' })
    expect(eventos('lead_qualificado')).toHaveLength(1)
    expect(eventos('lead_qualificado')[0]?.[2]).toMatchObject({ form: 'proposta', variante: 'duas_etapas', cliente: 'nao' })
    expect(form.hidden).toBe(true)
  })

  it('etapa 2 sem escolher a cidade da lista pede a cidade', async () => {
    const { form } = montar()
    await chegarNaEtapa2(form)
    fireEvent.change(screen.getByLabelText('Seu nome'), { target: { value: 'Maria' } })
    fireEvent.click(screen.getByLabelText('Síndico'))
    fireEvent.click(screen.getByLabelText('Não'))
    fireEvent.click(screen.getByRole('button', { name: /Pedir proposta/ }))
    expect(screen.getByText(MENSAGENS.cidade)).toBeTruthy()
    expect(etapa2Mock).not.toHaveBeenCalled()
  })

  it('token perdido: precisa_verificar mostra o Turnstile e reenvia as duas etapas juntas (R5)', async () => {
    const { form } = montar()
    await chegarNaEtapa2(form)
    etapa2Mock.mockResolvedValue({ ok: false, motivo: 'precisa_verificar' })
    completaMock.mockResolvedValue({ ok: true, etapa: 2 })
    preencherEtapa2()
    fireEvent.click(screen.getByRole('button', { name: /Pedir proposta/ }))
    await waitFor(() => expect(screen.getByText(TEXTOS.precisaVerificar)).toBeTruthy())
    fireEvent.click(screen.getByText('verificação'))
    await waitFor(() => expect(screen.getByText(TEXTOS.sucessoTitulo)).toBeTruthy())
    expect(completaMock).toHaveBeenCalledWith(
      { nomeCondominio: 'Aurora', uf: 'PB', telefone: '(83) 99950-1388', email: '', nome: 'Maria', perfil: 'sindico', cidade: 'João Pessoa', unidades: '', cliente: 'nao' },
      'token-teste',
    )
  })

  it('falha de gravação mostra os telefones da Unidade da UF e tenta de novo, sem WhatsApp (R8)', async () => {
    etapa1Mock.mockResolvedValue({ ok: false, motivo: 'falha', mensagem: 'x' })
    const { container } = montar()
    fireEvent.click(screen.getByText('verificação'))
    preencherEtapa1('PE')
    fireEvent.click(screen.getByRole('button', { name: /Continuar/ }))
    const alerta = await screen.findByRole('alert')
    expect(alerta.textContent).toContain('(81) 3316-0265')
    expect(alerta.textContent).not.toContain('(91)')
    expect(container.innerHTML).not.toContain('wa.me')
    fireEvent.click(screen.getByRole('button', { name: TEXTOS.tentarDeNovo }))
    await waitFor(() => expect(etapa1Mock).toHaveBeenCalledTimes(2))
    expect(etapa1Mock.mock.calls[1]?.[1]).toBeNull()
  })

  it('action que lança (deploy novo com aba aberta) vira a tela de falha e vai ao Sentry (Review Focus)', async () => {
    etapa1Mock.mockRejectedValue(new Error('Failed to find Server Action'))
    montar()
    fireEvent.click(screen.getByText('verificação'))
    preencherEtapa1()
    fireEvent.click(screen.getByRole('button', { name: /Continuar/ }))
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(captureExceptionMock).toHaveBeenCalledTimes(1)
  })

  it('?perfil=construtora pré-marca a etapa 2 (spec 4.1)', () => {
    window.history.replaceState({}, '', '/previa-v2?perfil=construtora')
    montar()
    expect((screen.getByLabelText('Construtora') as HTMLInputElement).checked).toBe(true)
  })

  it('a máscara formata o telefone e aceita colar com +55', () => {
    montar()
    const campo = screen.getByLabelText('Telefone com DDD') as HTMLInputElement
    fireEvent.change(campo, { target: { value: '+55 83 99950-1388' } })
    expect(campo.value).toBe('(83) 99950-1388')
  })
})
```

Em `tests/int/site-v2-previa.int.spec.tsx`, acrescentar junto dos mocks do topo:

```tsx
vi.mock('@/app/(site)/_actions/proposta-duas-etapas', () => ({
  enviarEtapa1: vi.fn(),
  enviarEtapa2: vi.fn(),
  enviarPropostaCompleta: vi.fn(),
}))
vi.mock('@/components/forms/Turnstile', () => ({ Turnstile: () => null }))
```

e, no `describe`, o teste:

```tsx
  it('a prévia mostra o pedido de proposta em duas etapas, sem WhatsApp de proposta', () => {
    const { container } = render(<PaginaPrevia />)
    const secao = container.querySelector('#proposta')
    expect(secao?.querySelector('form[data-etapa-ativa="1"]')).toBeTruthy()
    expect(secao?.innerHTML).not.toContain('wa.me')
    expect(secao?.innerHTML).not.toContain('3003-4506')
  })
```

Em `tests/int/site-v2-core-ssr.int.spec.ts`, acrescentar à lista `MODULOS` (o formulário em si importa as Server Actions e fica de fora; estes três são os que rodam no SSR sem servidor):

```ts
  ['formulário: textos', () => import('@/site/formularios/proposta/textos')],
  ['formulário: leitura', () => import('@/site/formularios/proposta/leitura')],
  ['formulário: cortina', () => import('@/site/formularios/proposta/cortina')],
```

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-formulario-proposta.int.spec.tsx tests/int/site-v2-previa.int.spec.tsx tests/int/site-v2-core-ssr.int.spec.ts`
Expected: FAIL — `@/site/formularios/proposta/FormularioProposta` não existe; `#proposta` não está na prévia.

- [ ] **Step 2: `textos.ts`, `cortina.ts` e `medicaoLead.ts`**

```ts
/**
 * Textos de estado do formulário real. TEXTO-NOVO: o protótipo só tinha os avisos de demonstração
 * ("nada foi enviado"); estes não prometem prazo nem dado que a Semog não confirmou.
 */
export const TEXTOS = {
  titulo: 'Peça uma proposta',
  continuar: 'Continuar',
  voltar: 'Voltar',
  indicador: 'Etapa 2 de 2',
  enviando: 'Enviando…',
  etapa1Recebida: 'Recebemos seus dados. Faltam só alguns detalhes para a proposta.',
  aguardeVerificacao: 'Aguarde a verificação de segurança terminar e tente de novo.',
  precisaVerificar: 'Para concluir, confirme a verificação de segurança abaixo.',
  sucessoTitulo: 'Pedido recebido.',
  sucessoTexto: 'A equipe da Semog vai entrar em contato pelo telefone informado.',
  falhaTitulo: 'Não conseguimos registrar seu pedido agora.',
  falhaTexto: 'Seus dados continuam aqui. Tente de novo ou ligue para a Unidade Semog:',
  tentarDeNovo: 'Tentar de novo',
  semJs: 'Para pedir proposta por aqui, o navegador precisa de JavaScript. Você também pode ligar para a Unidade Semog:',
} as const
```

```ts
import { gsap } from 'gsap'

/**
 * Cortina reta do protótipo (`core/formulario-proposta.js`): a borda que apaga a etapa que sai é a
 * mesma que revela a que entra; avançar varre da direita para a esquerda. Aqui só o recorte e o
 * `data-transicao` (as duas etapas visíveis durante a troca); `inert` fica com o React.
 */
export function trocarEtapa(form: HTMLFormElement, de: HTMLElement, para: HTMLElement, avancar: boolean) {
  const fechada = avancar ? 'inset(0% 100% 0% 0%)' : 'inset(0% 0% 0% 100%)'
  const entrando = avancar ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)'
  form.setAttribute('data-transicao', '')
  return gsap
    .timeline({
      defaults: { duration: 1.2, ease: 'expo.inOut' },
      onComplete: () => {
        form.removeAttribute('data-transicao')
        gsap.set([de, para], { clearProps: 'clipPath' })
      },
    })
    .fromTo(de, { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: fechada }, 0)
    .fromTo(para, { clipPath: entrando }, { clipPath: 'inset(0% 0% 0% 0%)' }, 0)
    .from(para.children, { x: avancar ? 34 : -34, duration: 1.1, ease: 'expo.out', stagger: 0.05 }, 0.35)
}
```

Em `src/lib/medicaoLead.ts`, acrescentar:

```ts
/**
 * Etapa 2 do formulário de duas etapas → GA4 `lead_qualificado` (spec 4.4). Evento de análise: não
 * é evento-chave e não tem valor. `cliente` é só sim/não; nenhum dado pessoal.
 */
export function registrarLeadQualificado(extras: Record<string, string> = {}) {
  window.gtag?.('event', 'lead_qualificado', { form: 'proposta', variante: 'duas_etapas', ...extras })
}
```

- [ ] **Step 3: `leitura.ts`**

```ts
import type { ChangeEvent } from 'react'
import {
  type CamposEtapa1,
  type CamposEtapa2,
  CIDADES_DAS_UNIDADES,
  digitosDoTelefone,
  errosPorCampo,
  etapa1Schema,
  etapa2Schema,
  formatarTelefone,
  MENSAGENS,
  OUTRA_CIDADE,
} from '@/lib/propostaDuasEtapas/schema'

/** Leitura e validação do formulário no navegador, com os mesmos schemas do servidor. */

export const ORDEM_ETAPA_1 = ['nomeCondominio', 'uf', 'telefone', 'email'] as const
export const ORDEM_ETAPA_2 = ['nome', 'unidades', 'cidadeEscolha', 'cidade', 'perfil', 'cliente'] as const

function texto(dados: FormData, nome: string): string {
  const valor = dados.get(nome)
  return typeof valor === 'string' ? valor : ''
}

function temLista(uf: string): boolean {
  return Boolean(CIDADES_DAS_UNIDADES[uf])
}

export function lerEtapa1(form: HTMLFormElement): CamposEtapa1 {
  const d = new FormData(form)
  return { nomeCondominio: texto(d, 'nomeCondominio'), uf: texto(d, 'uf'), telefone: texto(d, 'telefone'), email: texto(d, 'email') }
}

/** A cidade que vai ao servidor: a escolhida na lista, ou o texto de "Outra cidade" (DP6). */
export function lerEtapa2(form: HTMLFormElement): CamposEtapa2 {
  const d = new FormData(form)
  const escolha = texto(d, 'cidadeEscolha')
  const usaTexto = !temLista(texto(d, 'uf')) || escolha === OUTRA_CIDADE
  return {
    nome: texto(d, 'nome'),
    perfil: texto(d, 'perfil'),
    cidade: usaTexto ? texto(d, 'cidadeOutra').trim() : escolha,
    unidades: texto(d, 'unidades'),
    cliente: texto(d, 'cliente'),
  }
}

export function errosDaEtapa1(form: HTMLFormElement): Record<string, string> {
  const r = etapa1Schema.safeParse(lerEtapa1(form))
  return r.success ? {} : errosPorCampo(r.error.issues)
}

export function errosDaEtapa2(form: HTMLFormElement): Record<string, string> {
  const d = new FormData(form)
  const r = etapa2Schema.safeParse(lerEtapa2(form))
  const erros: Record<string, string> = r.success ? {} : errosPorCampo(r.error.issues)
  if (temLista(texto(d, 'uf')) && !texto(d, 'cidadeEscolha')) erros.cidadeEscolha = MENSAGENS.cidade
  return erros
}

/** Foca o primeiro campo com erro; o erro de `cidade` aponta para o texto de "Outra cidade". */
export function focarPrimeiroErro(form: HTMLFormElement, ordem: readonly string[], erros: Record<string, string>): void {
  const campo = ordem.find((c) => erros[c])
  if (!campo) return
  const nome = campo === 'cidade' ? 'cidadeOutra' : campo
  form.querySelector<HTMLElement>(`[name="${nome}"]`)?.focus()
}

/** Máscara (00) 00000-0000; apagar sobre um separador apaga o dígito anterior (protótipo). */
export function mascararTelefone(evento: ChangeEvent<HTMLInputElement>): void {
  const input = evento.currentTarget
  // `as`: num campo de texto o onChange do React embrulha o evento `input` nativo (InputEvent);
  // em teste vem um Event sem `inputType`, e o typeof abaixo trata.
  const nativo = evento.nativeEvent as InputEvent
  const apagando = typeof nativo.inputType === 'string' && nativo.inputType.startsWith('delete')
  let d = digitosDoTelefone(input.value).slice(0, 11)
  if (apagando && d === (input.dataset.digitos ?? '')) d = d.slice(0, -1)
  input.dataset.digitos = d
  input.value = formatarTelefone(d)
}
```

- [ ] **Step 4: `campos.tsx` e `FalhaDoEnvio.tsx`**

```tsx
import type { InputHTMLAttributes } from 'react'
import {
  CIDADES_DAS_UNIDADES,
  NOME_DA_UF,
  OUTRA_CIDADE,
  OUTRAS_UFS,
  PERFIS,
  UFS_COM_UNIDADE,
} from '@/lib/propostaDuasEtapas/schema'
import { conteudo } from '@/site/conteudo/conteudo'
import { mascararTelefone } from './leitura'

/** Campos do formulário de proposta, na marcação do protótipo (`sections/01-abertura.html:45-248`). */

type Erros = Readonly<Record<string, string>>
type Opcao = { valor: string; rotulo: string }

const idDe = (id: string, nome: string) => `${id}-${nome}`

function Erro({ alvo, texto }: { alvo: string; texto?: string }) {
  return (
    <p className="fp-erro" id={`${alvo}-erro`} aria-live="polite">
      {texto}
    </p>
  )
}

type PropsCampoTexto = {
  id: string
  nome: string
  rotulo: { texto: string; opcional?: string }
  erro?: string
  entrada: InputHTMLAttributes<HTMLInputElement>
}

function CampoTexto({ id, nome, rotulo, erro, entrada }: PropsCampoTexto) {
  const alvo = idDe(id, nome)
  return (
    <div className="fp-campo">
      <label htmlFor={alvo}>
        {rotulo.texto}
        {rotulo.opcional ? <span className="fp-opcional"> {rotulo.opcional}</span> : null}
      </label>
      <div className="fp-controle">
        <input id={alvo} name={nome} aria-describedby={`${alvo}-erro`} aria-invalid={erro ? true : undefined} {...entrada} />
      </div>
      <Erro alvo={alvo} texto={erro} />
    </div>
  )
}

type PropsGrupo = {
  id: string
  grupo: { nome: string; legenda: string; opcoes: readonly Opcao[] }
  erro?: string
  escolha?: { valor: string; aoEscolher: (valor: string) => void }
}

function GrupoDeOpcoes({ id, grupo, erro, escolha }: PropsGrupo) {
  const alvo = idDe(id, grupo.nome)
  return (
    <fieldset className="fp-grupo" aria-describedby={`${alvo}-erro`} aria-invalid={erro ? true : undefined}>
      <legend>{grupo.legenda}</legend>
      <div className="fp-opcoes">
        {grupo.opcoes.map((opcao) => (
          <label key={opcao.valor}>
            <input
              type="radio"
              name={grupo.nome}
              value={opcao.valor}
              {...(escolha ? { checked: escolha.valor === opcao.valor, onChange: () => escolha.aoEscolher(opcao.valor) } : {})}
            />{' '}
            {opcao.rotulo}
          </label>
        ))}
      </div>
      <Erro alvo={alvo} texto={erro} />
    </fieldset>
  )
}

type Uf = { valor: string; aoMudar: (uf: string) => void }

function SeletorDeUf({ id, erro, uf }: { id: string; erro?: string; uf: Uf }) {
  const alvo = idDe(id, 'uf')
  return (
    <div className="fp-campo">
      <label htmlFor={alvo}>Estado</label>
      <div className="fp-controle fp-controle--select">
        <select
          id={alvo}
          name="uf"
          autoComplete="address-level1"
          value={uf.valor}
          onChange={(evento) => uf.aoMudar(evento.currentTarget.value)}
          aria-describedby={`${alvo}-erro`}
          aria-invalid={erro ? true : undefined}
        >
          <option value="" disabled>
            Selecione
          </option>
          {UFS_COM_UNIDADE.map((sigla) => (
            <option key={sigla} value={sigla}>
              {NOME_DA_UF[sigla]}
            </option>
          ))}
          <optgroup label="Outros estados">
            {OUTRAS_UFS.map((sigla) => (
              <option key={sigla} value={sigla}>
                {NOME_DA_UF[sigla]}
              </option>
            ))}
          </optgroup>
        </select>
      </div>
      <Erro alvo={alvo} texto={erro} />
    </div>
  )
}

export function CamposDaEtapa1({ id, erros, uf }: { id: string; erros: Erros; uf: Uf }) {
  return (
    <>
      <CampoTexto id={id} nome="nomeCondominio" rotulo={{ texto: 'Nome do condomínio' }} erro={erros.nomeCondominio} entrada={{ type: 'text', autoComplete: 'off', maxLength: 120 }} />
      <div className="fp-par">
        <SeletorDeUf id={id} erro={erros.uf} uf={uf} />
        {/* Sem maxLength: cortaria a colagem com +55; quem limita é a máscara (DP7). */}
        <CampoTexto id={id} nome="telefone" rotulo={{ texto: 'Telefone com DDD' }} erro={erros.telefone} entrada={{ type: 'tel', autoComplete: 'tel-national', inputMode: 'tel', placeholder: '(00) 00000-0000', onChange: mascararTelefone }} />
      </div>
      <CampoTexto id={id} nome="email" rotulo={{ texto: 'E-mail', opcional: '(opcional)' }} erro={erros.email} entrada={{ type: 'email', autoComplete: 'email', maxLength: 254 }} />
    </>
  )
}

const OPCOES_DE_PERFIL: readonly Opcao[] = PERFIS.map((valor, i) => ({ valor, rotulo: conteudo.proposta.perfis[i] ?? valor }))
const OPCOES_DE_CLIENTE: readonly Opcao[] = [
  { valor: 'sim', rotulo: 'Sim' },
  { valor: 'nao', rotulo: 'Não' },
]

type PropsEtapa2 = { id: string; erros: Erros; uf: string; cidade: { escolha: string; aoEscolher: (cidade: string) => void } }

function CidadeDaEtapa2({ id, erros, uf, cidade }: PropsEtapa2) {
  const lista = CIDADES_DAS_UNIDADES[uf]
  const entrada = { type: 'text', autoComplete: 'address-level2', maxLength: 120 } as const
  if (!lista) {
    return <CampoTexto id={id} nome="cidadeOutra" rotulo={{ texto: 'Cidade', opcional: '(opcional)' }} erro={erros.cidade} entrada={entrada} />
  }
  const opcoes = [...lista, OUTRA_CIDADE].map((c) => ({ valor: c, rotulo: c }))
  return (
    <>
      <GrupoDeOpcoes id={id} grupo={{ nome: 'cidadeEscolha', legenda: 'Cidade', opcoes }} erro={erros.cidadeEscolha} escolha={{ valor: cidade.escolha, aoEscolher: cidade.aoEscolher }} />
      {cidade.escolha === OUTRA_CIDADE ? (
        <CampoTexto id={id} nome="cidadeOutra" rotulo={{ texto: 'Qual cidade?', opcional: '(opcional)' }} erro={erros.cidade} entrada={entrada} />
      ) : null}
    </>
  )
}

export function CamposDaEtapa2(props: PropsEtapa2) {
  const { id, erros } = props
  return (
    <>
      <CampoTexto id={id} nome="nome" rotulo={{ texto: 'Seu nome' }} erro={erros.nome} entrada={{ type: 'text', autoComplete: 'name', maxLength: 120 }} />
      <CidadeDaEtapa2 {...props} />
      <GrupoDeOpcoes id={id} grupo={{ nome: 'perfil', legenda: 'Você é', opcoes: OPCOES_DE_PERFIL }} erro={erros.perfil} />
      <div className="fp-par">
        <CampoTexto id={id} nome="unidades" rotulo={{ texto: 'Nº de unidades', opcional: '(aprox.)' }} erro={erros.unidades} entrada={{ type: 'text', inputMode: 'numeric', maxLength: 5 }} />
        <GrupoDeOpcoes id={id} grupo={{ nome: 'cliente', legenda: 'Já é cliente Semog?', opcoes: OPCOES_DE_CLIENTE }} erro={erros.cliente} />
      </div>
    </>
  )
}
```

```tsx
import { site } from '@/../content/site'
import { TEXTOS } from './textos'

/**
 * Falha do envio no formulário do site v2 (spec 5, R8): telefone da Unidade Semog e "Tentar de
 * novo", nunca WhatsApp. O `FalhaDeEnvio` antigo (com WhatsApp) continua no formulário antigo e no
 * Experience. Telefones de `content/site.ts` (fonte única do NAP).
 */

const UNIDADES = site.company.addresses

function linkDoTelefone(telefone: string): string {
  return `tel:+55${telefone.replace(/\D/g, '')}`
}

/** As Unidades da UF, ou todas quando a UF não tem Unidade (ou ainda não foi escolhida). */
export function unidadesDaUf(uf: string) {
  const daUf = UNIDADES.filter((u) => u.uf === uf)
  return daUf.length > 0 ? daUf : UNIDADES
}

export function TelefonesDasUnidades({ uf }: { uf: string }) {
  return (
    <ul className="fp-telefones">
      {unidadesDaUf(uf).map((u) => (
        <li key={u.city}>
          <a href={linkDoTelefone(u.phone)}>
            {u.city} · {u.phone}
          </a>
        </li>
      ))}
    </ul>
  )
}

type PropsFalha = { uf: string; enviando: boolean; aoTentarDeNovo: () => void }

export function FalhaDoEnvio({ uf, enviando, aoTentarDeNovo }: PropsFalha) {
  return (
    <div className="fp-falha" role="alert">
      <p className="fp-falha-titulo">{TEXTOS.falhaTitulo}</p>
      <p>{TEXTOS.falhaTexto}</p>
      <TelefonesDasUnidades uf={uf} />
      <div className="fp-acoes">
        <button className="botao" type="button" onClick={aoTentarDeNovo} disabled={enviando}>
          {TEXTOS.tentarDeNovo}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: `useEnvioDaProposta.ts`**

```ts
import * as Sentry from '@sentry/nextjs'
import { useCallback, useRef, useState } from 'react'
import { enviarEtapa1, enviarEtapa2, enviarPropostaCompleta } from '@/app/(site)/_actions/proposta-duas-etapas'
import { registrarLeadGerado, registrarLeadQualificado } from '@/lib/medicaoLead'
import type { ResultadoEtapa } from '@/lib/propostaDuasEtapas/resultado'
import { errosDaEtapa1, errosDaEtapa2, focarPrimeiroErro, lerEtapa1, lerEtapa2, ORDEM_ETAPA_1, ORDEM_ETAPA_2 } from './leitura'
import { TEXTOS } from './textos'

/** Estado do envio das duas etapas e as chamadas às Server Actions (spec 4.2, R5, R6, R11). */

export type EstadoDoEnvio = {
  etapa: 1 | 2
  etapa1Gravada: boolean
  concluido: boolean
  enviando: boolean
  verificar: boolean
  chaveVerificacao: number
  falha: boolean
  erros: Record<string, string>
  status: string
}

export const ESTADO_INICIAL: EstadoDoEnvio = {
  etapa: 1,
  etapa1Gravada: false,
  concluido: false,
  enviando: false,
  verificar: false,
  chaveVerificacao: 0,
  falha: false,
  erros: {},
  status: '',
}

type Tentativa = {
  enviar: (turnstile: string | null) => Promise<ResultadoEtapa>
  medir: (resultado: ResultadoEtapa) => void
}

const FALHA_NA_CHAMADA: ResultadoEtapa = { ok: false, motivo: 'falha', mensagem: TEXTOS.falhaTitulo }

export function aplicarResultado(e: EstadoDoEnvio, r: ResultadoEtapa): EstadoDoEnvio {
  const base: EstadoDoEnvio = { ...e, enviando: false, falha: false, verificar: false }
  if (r.ok && r.etapa === 1) return { ...base, etapa: 2, etapa1Gravada: true, erros: {}, status: TEXTOS.etapa1Recebida }
  if (r.ok) return { ...base, concluido: true, erros: {}, status: '' }
  if (r.motivo === 'campos') return { ...base, erros: r.erros, status: '' }
  if (r.motivo === 'precisa_verificar') {
    return { ...base, verificar: true, chaveVerificacao: e.chaveVerificacao + 1, status: TEXTOS.precisaVerificar }
  }
  if (r.motivo === 'recusado') return { ...base, status: r.mensagem }
  return { ...base, falha: true, status: '' }
}

/** A action pode lançar: rede caindo, ou deploy novo com a aba aberta (ID de Server Action trocado). */
async function chamar(tentativa: Tentativa, turnstile: string | null): Promise<ResultadoEtapa> {
  try {
    return await tentativa.enviar(turnstile)
  } catch (erro) {
    Sentry.captureException(erro, { tags: { form: 'proposta', variante: 'duas_etapas' } })
    return FALHA_NA_CHAMADA
  }
}

const temErro = (erros: Record<string, string>) => Object.keys(erros).length > 0

export function useEnvioDaProposta() {
  const [estado, setEstado] = useState<EstadoDoEnvio>(ESTADO_INICIAL)
  const tokenInicial = useRef<string | null>(null)
  const pendente = useRef<Tentativa | null>(null)
  const leadGerado = useRef(false)

  const executar = useCallback(async (tentativa: Tentativa, turnstile: string | null) => {
    pendente.current = tentativa
    setEstado((e) => ({ ...e, enviando: true, falha: false }))
    const resultado = await chamar(tentativa, turnstile)
    tentativa.medir(resultado)
    setEstado((e) => aplicarResultado(e, resultado))
  }, [])

  // generate_lead uma vez por formulário aberto: voltar e reenviar a etapa 1 não conta de novo.
  const medirLeadGerado = useCallback((r: ResultadoEtapa) => {
    if (!r.ok || leadGerado.current) return
    leadGerado.current = true
    registrarLeadGerado('proposta', { variante: 'duas_etapas' })
  }, [])

  // Estáveis: o widget do Turnstile guarda o callback da primeira renderização.
  const guardarToken = useCallback((token: string) => {
    tokenInicial.current = token
  }, [])
  const continuarComToken = useCallback(
    (token: string) => {
      if (pendente.current) void executar(pendente.current, token)
    },
    [executar],
  )

  function recusarCampos(form: HTMLFormElement, ordem: readonly string[], erros: Record<string, string>) {
    setEstado((e) => ({ ...e, erros, status: '' }))
    focarPrimeiroErro(form, ordem, erros)
  }

  function enviarDaEtapa1(form: HTMLFormElement) {
    const erros = errosDaEtapa1(form)
    if (temErro(erros)) {
      recusarCampos(form, ORDEM_ETAPA_1, erros)
      return
    }
    const token = tokenInicial.current
    if (!token && !estado.etapa1Gravada) {
      setEstado((e) => ({ ...e, erros: {}, status: TEXTOS.aguardeVerificacao }))
      return
    }
    tokenInicial.current = null
    const campos = lerEtapa1(form)
    void executar({ enviar: (t) => enviarEtapa1(campos, t), medir: medirLeadGerado }, token)
  }

  function enviarDaEtapa2(form: HTMLFormElement) {
    const erros = errosDaEtapa2(form)
    if (temErro(erros)) {
      recusarCampos(form, ORDEM_ETAPA_2, erros)
      return
    }
    const etapa1 = lerEtapa1(form)
    const etapa2 = lerEtapa2(form)
    void executar(
      {
        // Com token do Turnstile (depois de precisa_verificar), as duas etapas juntas (R5).
        enviar: (t) => (t ? enviarPropostaCompleta({ ...etapa1, ...etapa2 }, t) : enviarEtapa2(etapa2)),
        medir: (r) => {
          if (!r.ok) return
          medirLeadGerado(r)
          registrarLeadQualificado({ cliente: etapa2.cliente })
        },
      },
      null,
    )
  }

  function tentarDeNovo() {
    if (pendente.current) void executar(pendente.current, null)
  }

  function voltar() {
    setEstado((e) => ({ ...e, etapa: 1, status: '', erros: {}, verificar: false, falha: false }))
  }

  return { estado, enviarDaEtapa1, enviarDaEtapa2, guardarToken, continuarComToken, tentarDeNovo, voltar }
}
```

- [ ] **Step 6: `FormularioProposta.tsx`**

```tsx
'use client'

import './formulario-proposta.css'
import { useGSAP } from '@gsap/react'
import { type FormEvent, type RefObject, useEffect, useRef, useState } from 'react'
import { Turnstile } from '@/components/forms/Turnstile'
import { PERFIS } from '@/lib/propostaDuasEtapas/schema'
import { conteudo } from '@/site/conteudo/conteudo'
import { CamposDaEtapa1, CamposDaEtapa2 } from './campos'
import { trocarEtapa } from './cortina'
import { FalhaDoEnvio, TelefonesDasUnidades } from './FalhaDoEnvio'
import { TEXTOS } from './textos'
import { type EstadoDoEnvio, useEnvioDaProposta } from './useEnvioDaProposta'

/**
 * Pedido de proposta em duas etapas (spec 4.1 e 4.2), no idioma visual do protótipo: as duas
 * etapas dividem a mesma célula e trocam por uma cortina reta. Estados novos: enviando, sucesso,
 * falha (telefone da Unidade + tentar de novo) e verificação (Turnstile quando o token sumiu).
 * Sem JS, mostra o aviso com os telefones (o Turnstile exige JS).
 */

type PropsFormulario = { id: string; ufInicial?: string }

function Seta() {
  return (
    <svg className="seta" aria-hidden="true">
      <use href="#seta" />
    </svg>
  )
}

function BotaoPrincipal({ enviando, texto }: { enviando: boolean; texto: string }) {
  return (
    <button className="botao" type="submit" disabled={enviando}>
      {enviando ? TEXTOS.enviando : texto} <Seta />
    </button>
  )
}

function Verificacao({ estado, etapa, aoToken }: { estado: EstadoDoEnvio; etapa: 1 | 2; aoToken: (t: string) => void }) {
  if (!estado.verificar || estado.etapa !== etapa) return null
  return <Turnstile key={estado.chaveVerificacao} onToken={aoToken} theme="light" className="fp-verificacao" />
}

function PainelDeSucesso() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.focus()
  }, [])
  return (
    <div ref={ref} className="fp-sucesso" role="status" tabIndex={-1}>
      <p className="fp-sucesso-titulo">{TEXTOS.sucessoTitulo}</p>
      <p>{TEXTOS.sucessoTexto}</p>
    </div>
  )
}

/** Cortina entre as etapas; interrompe a anterior, foca o primeiro campo da que entra. */
function useCortina(formRef: RefObject<HTMLFormElement | null>, etapa: 1 | 2) {
  const ultima = useRef<1 | 2>(1)
  const transicao = useRef<ReturnType<typeof trocarEtapa> | null>(null)
  useGSAP(
    () => {
      const form = formRef.current
      const um = form?.querySelector<HTMLElement>('[data-etapa="1"]')
      const dois = form?.querySelector<HTMLElement>('[data-etapa="2"]')
      if (!form || !um || !dois || etapa === ultima.current) return
      const avancar = etapa === 2
      transicao.current?.progress(1)
      transicao.current = trocarEtapa(form, avancar ? um : dois, avancar ? dois : um, avancar)
      ultima.current = etapa
      const destino = avancar ? dois : um
      destino.querySelector<HTMLElement>('input, select')?.focus({ preventScroll: true })
    },
    { dependencies: [etapa], scope: formRef },
  )
}

/** `?perfil=construtora` pré-marca a etapa 2 (spec 4.1); valor fora da lista é ignorado. */
function usePerfilDaUrl(formRef: RefObject<HTMLFormElement | null>) {
  useEffect(() => {
    const perfil = new URLSearchParams(window.location.search).get('perfil')
    if (!perfil || !PERFIS.some((p) => p === perfil)) return
    const opcao = formRef.current?.querySelector<HTMLInputElement>(`input[name="perfil"][value="${perfil}"]`)
    if (opcao) opcao.checked = true
  }, [formRef])
}

export function FormularioProposta({ id, ufInicial = '' }: PropsFormulario) {
  const formRef = useRef<HTMLFormElement>(null)
  const [uf, setUf] = useState(ufInicial)
  const [cidadeEscolha, setCidadeEscolha] = useState('')
  const envio = useEnvioDaProposta()
  const { estado } = envio
  useCortina(formRef, estado.etapa)
  usePerfilDaUrl(formRef)

  function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (estado.enviando) return
    if (estado.etapa === 1) envio.enviarDaEtapa1(evento.currentTarget)
    else envio.enviarDaEtapa2(evento.currentTarget)
  }

  function mudarUf(novaUf: string) {
    setUf(novaUf)
    setCidadeEscolha('')
  }

  return (
    <div className="fp-moldura">
      <form
        ref={formRef}
        className="formulario-proposta"
        noValidate
        onSubmit={aoEnviar}
        data-etapa-ativa={estado.etapa}
        aria-labelledby={`${id}-titulo`}
        aria-busy={estado.enviando || undefined}
        hidden={estado.concluido}
      >
        <p id={`${id}-titulo`} className="fp-titulo">
          {TEXTOS.titulo}
        </p>
        <div className="fp-etapas">
          <div className="fp-etapa" data-etapa="1" inert={estado.etapa !== 1}>
            <CamposDaEtapa1 id={id} erros={estado.erros} uf={{ valor: uf, aoMudar: mudarUf }} />
            {estado.etapa1Gravada ? null : (
              <Turnstile onToken={envio.guardarToken} theme="light" className="fp-verificacao" />
            )}
            <Verificacao estado={estado} etapa={1} aoToken={envio.continuarComToken} />
            <div className="fp-acoes">
              <BotaoPrincipal enviando={estado.enviando} texto={TEXTOS.continuar} />
            </div>
          </div>
          <div className="fp-etapa" data-etapa="2" inert={estado.etapa !== 2}>
            <CamposDaEtapa2 id={id} erros={estado.erros} uf={uf} cidade={{ escolha: cidadeEscolha, aoEscolher: setCidadeEscolha }} />
            <Verificacao estado={estado} etapa={2} aoToken={envio.continuarComToken} />
            <div className="fp-acoes">
              <BotaoPrincipal enviando={estado.enviando} texto={conteudo.proposta.botao} />
              <button className="fp-voltar" type="button" onClick={envio.voltar} disabled={estado.enviando}>
                <Seta />
                <span>{TEXTOS.voltar}</span>
              </button>
              <p className="fp-indicador">{TEXTOS.indicador}</p>
            </div>
          </div>
        </div>
        <p className="fp-status" role="status" aria-live="polite">
          {estado.status}
        </p>
        {estado.falha ? <FalhaDoEnvio uf={uf} enviando={estado.enviando} aoTentarDeNovo={envio.tentarDeNovo} /> : null}
      </form>
      {estado.concluido ? <PainelDeSucesso /> : null}
      <div className="fp-sem-js">
        <p>{TEXTOS.semJs}</p>
        <TelefonesDasUnidades uf={ufInicial} />
      </div>
    </div>
  )
}
```

(O `Continuar` da etapa 1 continua no DOM com a etapa 2 ativa, dentro de um `inert`, e o "Pedir proposta" idem na etapa 1: o rótulo acessível de cada um só existe na etapa ativa porque o `inert` os tira da árvore de acessibilidade; `getByRole` nos testes acha só o da etapa ativa. Se o jsdom não respeitar `inert` na árvore de acessibilidade e o teste achar dois botões, trocar nos testes por `within(form.querySelector('[data-etapa="1"]'))`.)

- [ ] **Step 7: CSS do formulário e da seção**

Arquivo `src/site/formularios/proposta/formulario-proposta.css` (porta de `design-explorations/site-v2-prototipo/src/core/formulario-proposta.css`, sem as regras `.fp-so-js` e com os estados novos no fim):

```css
/* Formulário de proposta em duas etapas (src/site/formularios/proposta). Porta do protótipo:
   label pequeno acima, só a linha de baixo, que se desenha no foco a partir da esquerda (ponta
   reta); opções quadradas; botão marinho reto. Cor pelo tema da seção (--tema-*). */
.formulario-proposta {
  --fp-tinta: var(--tema-titulo, var(--marinho));
  --fp-suave: var(--tema-suave, var(--texto-suave));
  --fp-linha: var(--nevoa);
  display: grid;
  gap: var(--e3);
}
.formulario-proposta[hidden] {
  display: none;
}
.fp-moldura {
  display: grid;
  gap: var(--e3);
  min-width: 0;
}
.fp-titulo {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--fp-tinta);
}
.fp-etapas,
.fp-etapa {
  min-width: 0;
}
.fp-etapa {
  display: grid;
  gap: var(--e3);
  align-content: start;
}
.fp-par {
  display: grid;
  grid-template-columns: var(--menor) var(--maior);
  gap: var(--e3) var(--e4);
}
.fp-etapa > *,
.fp-par > * {
  min-width: 0;
}

/* Com JS, as duas etapas dividem a mesma célula (sem salto de altura) e só a ativa aparece. */
html.js .fp-etapas {
  display: grid;
}
html.js .fp-etapa {
  grid-area: 1 / 1;
}
html.js .formulario-proposta:not([data-etapa-ativa="2"]) .fp-etapa[data-etapa="2"],
html.js .formulario-proposta[data-etapa-ativa="2"] .fp-etapa[data-etapa="1"] {
  visibility: hidden;
}
html.js .formulario-proposta[data-transicao] .fp-etapa {
  visibility: visible;
}
/* Sem JS não há como passar pelo Turnstile: aviso com os telefones no lugar do formulário. */
html:not(.js) .formulario-proposta {
  display: none;
}
html.js .fp-sem-js {
  display: none;
}

/* ---- Campo ---------------------------------------------------------------------- */
.fp-campo {
  display: grid;
  gap: 6px;
  align-content: start;
}
.fp-campo label,
.fp-grupo legend {
  padding: 0;
  font-size: 0.8125rem;
  font-weight: 500;
  line-height: 1.3;
  color: var(--fp-suave);
}
.fp-opcional {
  font-weight: 400;
}
.fp-controle {
  position: relative;
}
.fp-controle::after {
  content: "";
  position: absolute;
  inset: auto 0 0;
  height: 2px;
  background: var(--fp-tinta);
  transform: scaleX(0);
  transform-origin: 0 50%;
  transition: transform 520ms var(--ease-expo);
  pointer-events: none;
}
.fp-controle:focus-within::after,
.fp-controle:has([aria-invalid="true"])::after {
  transform: scaleX(1);
}
.fp-controle input,
.fp-controle select {
  display: block;
  width: 100%;
  min-height: 44px;
  margin: 0;
  padding: 6px 0 var(--e1);
  border: 0;
  border-bottom: 1px solid var(--fp-linha);
  border-radius: 0;
  background: transparent;
  font-family: var(--fonte-corpo);
  font-size: 1.0625rem;
  color: var(--fp-tinta);
  appearance: none;
}
.fp-controle input:focus,
.fp-controle select:focus {
  outline: none;
}
.fp-controle input::placeholder {
  color: var(--fp-suave);
  opacity: 0.6;
}
.fp-controle--select select {
  padding-right: var(--e4);
  cursor: pointer;
}
.fp-controle--select::before {
  content: "";
  position: absolute;
  right: 2px;
  top: calc(50% - 6px);
  width: 13px;
  height: 8px;
  background: var(--fp-tinta);
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 13 8'%3E%3Cpath d='M.5.5l6 6 6-6' fill='none' stroke='black' stroke-width='1.4' stroke-linecap='butt' stroke-linejoin='miter'/%3E%3C/svg%3E")
    center / contain no-repeat;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 13 8'%3E%3Cpath d='M.5.5l6 6 6-6' fill='none' stroke='black' stroke-width='1.4' stroke-linecap='butt' stroke-linejoin='miter'/%3E%3C/svg%3E")
    center / contain no-repeat;
  pointer-events: none;
}
.fp-controle select option,
.fp-controle select optgroup {
  color: var(--marinho);
  background: var(--branco);
}

/* ---- Escolha única: segmentos retos colados; o rádio nativo segue focável ---------- */
.fp-grupo {
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 0;
}
.fp-opcoes {
  display: flex;
  flex-wrap: wrap;
  margin-top: 6px;
  padding: 1px 0 0 1px;
}
.fp-opcoes label {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  margin: -1px 0 0 -1px;
  padding: 0 var(--e2);
  border: 1px solid var(--fp-linha);
  font-size: 0.9375rem;
  line-height: 1.2;
  color: var(--fp-tinta);
  cursor: pointer;
  transition:
    background-color 240ms var(--ease-expo),
    color 240ms var(--ease-expo);
}
.fp-opcoes label:hover {
  background: color-mix(in oklab, var(--fp-tinta) 6%, transparent);
}
.fp-opcoes label:has(input:checked) {
  z-index: 1;
  border-color: var(--fp-tinta);
  background: var(--fp-tinta);
  color: var(--tema-fundo, var(--branco));
}
.fp-opcoes label:has(input:focus-visible) {
  z-index: 2;
  outline: 2px solid var(--tema-foco, var(--marinho));
  outline-offset: 2px;
}
.fp-opcoes input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}

/* ---- Erro, status, ações (sem cor de alarme: marinho, com marca e peso) ------------ */
.fp-erro {
  font-size: 0.8125rem;
  font-weight: 500;
  line-height: 1.35;
  color: var(--fp-tinta);
}
.fp-erro:empty,
.fp-status:empty {
  display: none;
}
.fp-erro::before,
.fp-status::before {
  content: "";
  display: inline-block;
  width: 5px;
  height: 10px;
  margin-right: var(--e1);
  background: var(--fp-tinta);
}
.fp-status::before {
  background: var(--ceu);
}
.fp-status {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--fp-tinta);
}
.fp-acoes {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--e2) var(--e4);
}
.fp-indicador {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--fp-suave);
}
.fp-voltar {
  display: inline-flex;
  align-items: center;
  gap: var(--e1);
  min-height: 44px;
  padding: 0;
  border: 0;
  background: none;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--fp-tinta);
  cursor: pointer;
}
.fp-voltar .seta {
  transform: scaleX(-1);
  transition: transform 320ms var(--ease-expo);
}
.fp-voltar:hover .seta {
  transform: scaleX(-1) translateX(5px);
}
.fp-voltar:hover span {
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 5px;
}
.formulario-proposta .botao .seta {
  transition: transform 320ms var(--ease-expo);
}
.formulario-proposta .botao:hover .seta {
  transform: translateX(4px);
}

/* ---- Estados novos: enviando, verificação, falha, sucesso, sem JS ------------------ */
.formulario-proposta .botao[disabled],
.fp-voltar[disabled] {
  cursor: progress;
  opacity: 0.72;
}
.fp-verificacao {
  min-height: 65px;
}
.fp-falha {
  display: grid;
  gap: var(--e2);
  padding: var(--e3);
  border-left: 5px solid var(--fp-tinta);
  background: var(--gelo);
  color: var(--fp-tinta);
}
.fp-falha-titulo {
  font-weight: 600;
}
.fp-telefones {
  display: grid;
  gap: var(--e1);
  margin: 0;
  padding: 0;
  list-style: none;
}
.fp-telefones a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: inherit;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 4px;
}
.fp-sucesso {
  display: grid;
  gap: var(--e2);
  padding: var(--e4) var(--e3);
  border-left: 5px solid var(--ceu);
  background: var(--gelo);
  color: var(--marinho);
  outline: none;
}
.fp-sucesso-titulo {
  font-family: var(--fonte-titulo);
  font-size: var(--t-h3);
  font-weight: var(--peso-titulo);
  letter-spacing: var(--tracking-titulo);
  line-height: var(--lh-titulo);
}
.fp-sem-js {
  display: grid;
  gap: var(--e2);
  color: var(--texto);
}

@media (max-width: 420px) {
  .fp-opcoes label {
    padding: 0 var(--e1);
  }
  .fp-etapa {
    gap: var(--e2);
  }
  .fp-par {
    grid-template-columns: 1fr;
    gap: var(--e2);
  }
}
```

Arquivo `src/site/secoes/proposta/proposta.css`:

```css
/* Seção do pedido de proposta (fase 2: só na /previa-v2). Título à esquerda, formulário à direita,
   na razão áurea; empilha em tela estreita. */
#proposta {
  padding-block: var(--respiro-cena);
  background: var(--branco);
}
#proposta .proposta-grade {
  display: grid;
  grid-template-columns: var(--menor) var(--maior);
  gap: var(--e5);
  align-items: start;
}
#proposta .proposta-titulo {
  font-family: var(--fonte-titulo);
  font-size: var(--t-h2);
  font-weight: var(--peso-titulo);
  letter-spacing: var(--tracking-titulo);
  line-height: var(--lh-titulo);
  color: var(--marinho);
}
@media (max-width: 900px) {
  #proposta .proposta-grade {
    grid-template-columns: 1fr;
    gap: var(--e4);
  }
}
```

- [ ] **Step 8: Seção e página**

`src/site/secoes/proposta/SecaoProposta.tsx`:

```tsx
import './proposta.css'
import { conteudo } from '@/site/conteudo/conteudo'
import { FormularioProposta } from '@/site/formularios/proposta/FormularioProposta'

/** Seção do pedido de proposta. O título fica no HTML; o formulário é client. Fase 2: só na prévia. */
export function SecaoProposta({ ufInicial }: { ufInicial?: string }) {
  return (
    <section id="proposta" data-tema="claro" aria-labelledby="proposta-titulo">
      <div className="container proposta-grade">
        <h2 id="proposta-titulo" className="proposta-titulo">
          {conteudo.proposta.titulo}
        </h2>
        <FormularioProposta id="proposta-form" ufInicial={ufInicial} />
      </div>
    </section>
  )
}
```

Em `src/app/(site)/(app)/previa-v2/page.tsx`: `import { SecaoProposta } from '@/site/secoes/proposta/SecaoProposta'` e, dentro do `EsqueletoApp`, depois de `<Ranking />`, `<SecaoProposta />`. O comentário do componente passa a ser `/** Bancada da fundação e dos formulários: a cena do ranking e o pedido de proposta em duas etapas. 404 em produção (src/site/previa.ts). */`.

- [ ] **Step 9: Rodar e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-formulario-proposta.int.spec.tsx tests/int/site-v2-previa.int.spec.tsx tests/int/site-v2-identidade.int.spec.ts`
Expected: PASS (a guarda de identidade agora varre também `formulario-proposta.css`, `proposta.css` e os `.tsx` novos: nenhum hex fora do `:root`, raio 0, nenhum termo vedado).

- [ ] **Step 10: Olhar no navegador (implementador, antes do checkpoint)**

```powershell
pnpm dev
```

Abrir `http://localhost:3000/previa-v2#proposta` (sem `NEXT_PUBLIC_TURNSTILE_SITE_KEY` o widget não aparece e o console mostra o aviso do `Turnstile`; isso é esperado aqui). Conferir à mão: a seção aparece abaixo do ranking com Saira/Barlow e os tokens; os campos da etapa 1 com a linha que se desenha no foco; erro ao clicar "Continuar" vazio; rolar até o rodapé a 1440 e 390 (nada cortado, sem scroll horizontal). O fluxo completo e os estados com banco são da Tarefa 2.7. Encerrar o `pnpm dev`.

- [ ] **Step 11: Checkpoint: portões e commitar**

```powershell
pnpm exec biome check --write src/site/formularios/proposta src/site/secoes/proposta "src/app/(site)/(app)/previa-v2/page.tsx" src/lib/medicaoLead.ts tests/int/site-v2-formulario-proposta.int.spec.tsx tests/int/site-v2-previa.int.spec.tsx tests/int/site-v2-core-ssr.int.spec.ts
pnpm exec biome ci ./src ./tests ./scripts
pnpm exec tsc --noEmit
pnpm run check:server-actions
pnpm run test:int
pnpm build
git branch --show-current && git add src/site/formularios/proposta src/site/secoes/proposta "src/app/(site)/(app)/previa-v2/page.tsx" src/lib/medicaoLead.ts tests/int/site-v2-formulario-proposta.int.spec.tsx tests/int/site-v2-previa.int.spec.tsx tests/int/site-v2-core-ssr.int.spec.ts && git commit -m "feat(site-v2): pedido de proposta em duas etapas na prévia

Porta do formulário do protótipo (cortina reta entre as etapas, cidade pela UF)
com os estados que faltavam: enviando, sucesso, falha com o telefone da Unidade
e verificação quando o token some. GA4: generate_lead na etapa 1 e
lead_qualificado na etapa 2. Sem WhatsApp de proposta.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
```

---

## Tarefa 2.7: Verificação final do PR (verificador separado) e checklist do Leandro

Rodada **completa** (efeito externo e banco): quem verifica não é quem implementou, não edita código e reporta a saída real de cada passo. Nenhum passo desta tarefa conecta no banco de produção nem chama Exact, SendGrid ou Google Ads.

**Files:** só arquivos no scratchpad da sessão (`<scratchpad>` abaixo); nada no repositório.

**Interfaces:**
- Consumes: tudo das Tarefas 2.1 a 2.6, já commitado.
- Produces: relatório com a saída dos portões, a contagem de linhas do banco local por fluxo, os PNGs de cada estado em Chromium e Firefox a 1440 e 390 (olhados), e o checklist do Leandro preenchido só com o que ele fizer.

- [ ] **Step 1: Portões da CI e prova de escopo**

```powershell
Set-Location C:\Users\lekoc\semogapp\semogsite-site-v2
git status --short
pnpm exec biome ci ./src ./tests ./scripts
pnpm exec tsc --noEmit
pnpm run check:server-actions
pnpm run test:int
pnpm build
git diff --stat 1381cc5..HEAD
```

Expected: `git status` vazio; os cinco verdes; o diff toca só `db/leads-duas-etapas.sql`, `scripts/migracao-leads-duas-etapas.ts`, `src/lib/{propostaDuasEtapas,leads,ads}/`, `src/lib/{forms,attribution,medicaoLead}.ts`, `src/lib/exact/map-lead.ts`, `src/app/(frontend)/_actions/submit-form.ts`, `src/app/(site)/_actions/`, `src/app/(site)/(app)/previa-v2/page.tsx`, `src/app/api/cron/*/route.ts`, `src/site/formularios/`, `src/site/secoes/proposta/`, `vercel.json`, `docs/DEPLOY.md`, `docs/superpowers/` e `tests/int/`. Conferir também que o `tsc` compila os arquivos novos: `pnpm exec tsc --noEmit --listFiles | Select-String "proposta-duas-etapas|posGravacao|criterios"` lista os três.

- [ ] **Step 2: Banco descartável em Docker (nunca o de produção)**

Arquivo `<scratchpad>\bancada.sql` (a `create table` é a de `db/leads.sql:8-23`; os `alter` são os de `db/leads-exact.sql`, `db/consent-ads.sql` e `db/leads-desfecho.sql`, só a parte de `cms.leads`):

```sql
create schema if not exists cms;
create table if not exists cms.leads (
  id              bigint generated always as identity primary key,
  created_at      timestamptz not null default now(),
  form            text not null,
  data            jsonb not null,
  gclid           text,
  email           text,
  uploaded_to_ads boolean not null default false
);
alter table cms.leads
  add column if not exists exact_lead_id  bigint,
  add column if not exists exact_error    text,
  add column if not exists exact_attempts smallint not null default 0,
  add column if not exists ads_consent text,
  add column if not exists desfecho text,
  add column if not exists desfecho_em timestamptz,
  add column if not exists desfecho_motivo text,
  add column if not exists desfecho_observacao text,
  add column if not exists notificado_para text;
```

```powershell
docker run --name semog-bancada -e POSTGRES_PASSWORD=bancada -p 54329:5432 -d postgres:17
Start-Sleep -Seconds 5
Get-Content <scratchpad>\bancada.sql | docker exec -i semog-bancada psql -U postgres -v ON_ERROR_STOP=1
Get-Content db\leads-duas-etapas.sql | docker exec -i semog-bancada psql -U postgres -v ON_ERROR_STOP=1
Get-Content db\leads-duas-etapas.sql | docker exec -i semog-bancada psql -U postgres -v ON_ERROR_STOP=1
```

Expected: a migração roda duas vezes sem erro (idempotente, só avisos `already exists, skipping`).

- [ ] **Step 3: Subir o Next local contra a bancada, sem nenhuma integração**

```powershell
$env:DATABASE_URI = 'postgres://postgres:bancada@127.0.0.1:54329/postgres?sslmode=disable'
$env:NEXT_PUBLIC_TURNSTILE_SITE_KEY = '1x00000000000000000000AA'
$env:TURNSTILE_SECRET_KEY = '1x0000000000000000000000000000000AA'
Remove-Item Env:VERCEL_ENV, Env:EXACT_SPOTTER_TOKEN, Env:SENDGRID_API_KEY, Env:GOOGLE_SA_JSON -ErrorAction SilentlyContinue
pnpm build
$next = Start-Process pnpm -ArgumentList 'start','-p','3100' -PassThru -NoNewWindow
```

As chaves acima são as chaves públicas de teste do Turnstile que sempre passam ([A CONFIRMAR] os valores em `developers.cloudflare.com/turnstile/troubleshooting/testing/` antes de rodar). `sslmode=disable` sobrepõe o `ssl` do `src/lib/db.ts` (conferido em `pg/lib/connection-parameters.js`). Sem `VERCEL_ENV`, toda linha grava `ambiente: 'local'` e a pós-gravação não envia nada; e as chaves de Exact, SendGrid e Google estão ausentes, então nem por engano sai algo.

- [ ] **Step 4: Fluxos reais no navegador, 2 browsers × 2 larguras**

Arquivo `<scratchpad>\formulario-estados.mjs`:

```js
// Percorre os estados do formulário de duas etapas contra o Next local (porta 3100) e a bancada
// Docker. Uso: node <scratchpad>\formulario-estados.mjs <scratchpad>\estados
import { execSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire('C:/Users/lekoc/semogapp/semogsite-site-v2/package.json')
const { chromium, firefox } = require('@playwright/test')
const saida = process.argv[2]
const URL_PREVIA = 'http://localhost:3100/previa-v2#proposta'
mkdirSync(saida, { recursive: true })

const docker = (acao) => execSync(`docker ${acao} semog-bancada`, { stdio: 'ignore' })
const etapa = (page) => page.locator('#proposta form').getAttribute('data-etapa-ativa')

async function foto(page, nome, rotulo) {
  await page.waitForTimeout(450) // ≥400 ms: a cortina e as transições terminam antes da foto
  await page.screenshot({ path: path.join(saida, `${rotulo}-${nome}.png`), fullPage: true })
}

async function etapa1(page, uf = 'PB') {
  await page.getByLabel('Nome do condomínio').fill('Condomínio de teste da bancada')
  await page.getByLabel('Estado').selectOption(uf)
  await page.getByLabel('Telefone com DDD').fill('83999501388')
  await page.waitForTimeout(2500) // token de teste do Turnstile
  await page.getByRole('button', { name: /Continuar/ }).click()
  await page.waitForFunction(() => document.querySelector('#proposta form')?.getAttribute('data-etapa-ativa') === '2')
}

async function etapa2(page) {
  await page.getByLabel('Seu nome').fill('Pessoa de teste')
  await page.getByLabel('João Pessoa').check({ force: true })
  await page.getByLabel('Síndico').check({ force: true })
  await page.getByLabel('Não').check({ force: true })
}

async function fluxoPrincipal(page, ctx, rotulo) {
  await page.goto(URL_PREVIA)
  await foto(page, '1-etapa1', rotulo)
  await etapa1(page)
  await foto(page, '2-etapa2', rotulo)
  await page.getByRole('button', { name: /Voltar/ }).click()
  await foto(page, '3-voltar', rotulo)
  await page.getByRole('button', { name: /Continuar/ }).click() // reenvio pelo cookie (R6)
  await page.waitForFunction(() => document.querySelector('#proposta form')?.getAttribute('data-etapa-ativa') === '2')
  await etapa2(page)
  await ctx.clearCookies({ name: 'proposta_etapa' }) // token perdido (R5)
  await page.getByRole('button', { name: /Pedir proposta/ }).click()
  await page.getByText('Para concluir, confirme a verificação').waitFor()
  await foto(page, '4-precisa-verificar', rotulo)
  await page.getByText('Pedido recebido.').waitFor({ timeout: 15000 })
  await foto(page, '5-sucesso', rotulo)
}

async function fluxoEnviandoEFalha(page, rotulo) {
  await page.goto(URL_PREVIA)
  await etapa1(page)
  await etapa2(page)
  docker('pause') // a consulta fica pendurada: o estado "enviando" fica na tela
  await page.getByRole('button', { name: /Pedir proposta/ }).click()
  await page.getByText('Enviando…').first().waitFor()
  await foto(page, '6-enviando', rotulo)
  docker('unpause')
  await page.getByText('Pedido recebido.').waitFor({ timeout: 20000 })
  await page.goto(URL_PREVIA)
  docker('stop') // conexão recusada: falha de gravação
  await page.getByLabel('Nome do condomínio').fill('Condomínio de teste da bancada')
  await page.getByLabel('Estado').selectOption('PE')
  await page.getByLabel('Telefone com DDD').fill('81999501388')
  await page.waitForTimeout(2500)
  await page.getByRole('button', { name: /Continuar/ }).click()
  await page.getByRole('alert').waitFor({ timeout: 20000 })
  await foto(page, '7-falha', rotulo)
  docker('start')
}

// Cada fluxo num contexto próprio, com um IP próprio no x-forwarded-for: o rate limit da
// proposta é 5/min por IP (`proposta:<ip>`), e o fluxo principal sozinho faz 3 chamadas.
let ip = 10
async function rodar(navegador, largura, rotulo, fluxo) {
  const browser = await navegador.launch()
  const ctx = await browser.newContext({
    viewport: { width: largura, height: 900 },
    extraHTTPHeaders: { 'x-forwarded-for': `198.51.100.${ip++}` },
  })
  await ctx.addInitScript(() => {
    window.__eventos = []
    window.gtag = (...args) => window.__eventos.push(args)
  })
  const page = await ctx.newPage()
  const erros = []
  page.on('console', (m) => m.type() === 'error' && erros.push(m.text()))
  await fluxo(page, ctx, rotulo)
  const ga = await page.evaluate(() => window.__eventos.map((e) => e[1]))
  const largo = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  console.log(rotulo, fluxo.name, JSON.stringify({ ga, scrollHorizontal: largo, errosDeConsole: erros }))
  await browser.close()
}

for (const [nome, navegador] of [['chromium', chromium], ['firefox', firefox]]) {
  for (const largura of [1440, 390]) {
    const rotulo = `${nome}-${largura}`
    await rodar(navegador, largura, rotulo, fluxoPrincipal)
    await rodar(navegador, largura, rotulo, (page, _ctx, r) => fluxoEnviandoEFalha(page, r))
  }
}
```

```powershell
pnpm exec playwright install chromium firefox
node <scratchpad>\formulario-estados.mjs <scratchpad>\estados
docker exec semog-bancada psql -U postgres -c "select etapa, envio_em is not null as reivindicada, token_envio is not null as com_token, data->>'ambiente' as ambiente, data->>'cidade' as cidade, notificado_para, exact_lead_id, uploaded_to_ads from cms.leads order by id"
```

Expected: oito execuções (4 combinações × 2 fluxos) sem exceção. Fluxo principal: `ga` igual a `["generate_lead", "lead_qualificado"]` (o "voltar" e o reenvio não repetem o `generate_lead`). Fluxo de enviando e falha: `ga` igual a `[]` (o script de captura recomeça a cada navegação, então o que sobra é só a página da falha, e a etapa 1 que não gravou não pode medir nada: `generate_lead` só dispara com `ok: true`). Em todas, `scrollHorizontal: false` e `errosDeConsole` sem CSP nem hidratação (só a falha de rede esperada do fluxo de falha). No banco, **por combinação**, exatamente três linhas: (a) a etapa 1 do fluxo principal, que ficou órfã porque o cookie foi apagado antes da etapa 2 (`etapa = 1`, `reivindicada = f`) — é o caso que o cron resolve no Step 5; (b) a linha nova completa do token perdido (`etapa = 2`, `com_token = f`, `reivindicada = t`); (c) a linha do fluxo de enviando (`etapa = 2`, `com_token = t`, `reivindicada = t`), que prova o "voltar" e a etapa 2 na **mesma** linha; o fluxo de falha não grava nada. Todas com `ambiente = local`, `exact_lead_id` nulo e `uploaded_to_ads = f` (nada saiu). Qualquer outra contagem é falha a investigar. **Abrir e olhar os 28 PNGs** (7 estados × 2 browsers × 2 larguras): mesma linguagem do protótipo (linha de baixo, segmentos retos, botão marinho reto), cidade como lista na PB, sucesso e falha legíveis, telefone de Recife na falha de PE, nenhum WhatsApp, nada cortado, rolar até o rodapé.

- [ ] **Step 5: Cron contra a bancada (a etapa 1 parada)**

```powershell
docker exec semog-bancada psql -U postgres -c "update cms.leads set created_at = now() - interval '50 minutes', data = data || jsonb_build_object('ambiente', 'production') where etapa = 1 and envio_em is null"
$env:CRON_SECRET = 'segredo-local'
Stop-Process -Id $next.Id
$next = Start-Process pnpm -ArgumentList 'start','-p','3100' -PassThru -NoNewWindow
curl.exe -s -H "Authorization: Bearer segredo-local" http://localhost:3100/api/cron/push-exact-leads
curl.exe -s -H "Authorization: Bearer segredo-local" http://localhost:3100/api/cron/push-exact-leads
docker exec semog-bancada psql -U postgres -c "select id, etapa, envio_em is not null as reivindicada from cms.leads where etapa = 1"
```

Expected: a primeira chamada responde `etapa1.reivindicadas` igual ao número de linhas de etapa 1 (4) e a segunda `0` (a trava do banco); as linhas ficam `reivindicada = t`. Como `EXACT_SPOTTER_TOKEN`, `SENDGRID_API_KEY` e `GOOGLE_*` estão ausentes, a pós-gravação não sai para fora (Exact desligado, SendGrid no-op, Ads sem configuração). A marcação `production` aqui é só dentro da bancada local, para exercitar o critério.

- [ ] **Step 6: Limpeza**

```powershell
Stop-Process -Id $next.Id
docker rm -f semog-bancada
Remove-Item Env:DATABASE_URI, Env:NEXT_PUBLIC_TURNSTILE_SITE_KEY, Env:TURNSTILE_SECRET_KEY, Env:CRON_SECRET
git status --short
```

Expected: `git status` vazio (PNGs e scripts ficaram no scratchpad). Rodar `pnpm build` de novo sem as variáveis de teste antes de qualquer deploy (a chave pública do Turnstile entra no bundle no build).

- [ ] **Step 7: Checklist do Leandro — envio real em produção controlada [DEPENDE DO LEANDRO]**

Não executado por agente (o Turnstile barra navegador automatizado, e é efeito externo). Só depois do merge desta fase **e** da Tarefa 2.1 aplicada. Como a rota de prévia é 404 em produção, o envio real do formulário novo acontece na virada (fase 5); nesta fase o Leandro confere em produção o que mudou para o formulário antigo e os crons:
1. Enviar uma proposta pelo formulário antigo de `semog.com.br/proposta` com dados de teste identificados como teste.
2. No banco (consulta só de leitura): a linha tem `data.ambiente = 'production'`, `etapa` nula, `envio_em` preenchido.
3. No Exact: um card só, com a região certa. No e-mail: uma notificação para a praça certa. No Sentry: nenhum erro novo.
4. Uma hora depois: o cron do Exact rodou a cada 15 min (log da Vercel em `/api/cron/push-exact-leads`) sem reenviar o card.
5. No dia seguinte, depois das 06:00 UTC, se a linha de teste tinha gclid: o lote do Ads respondeu 200 e marcou `uploaded_to_ads = true` (o formulário antigo não sobe na hora; quem sobe na hora é só o formulário novo). Sem gclid, nada a conferir no Ads.
6. Num Preview da `feat/site-v2`, enviar o formulário novo em `/previa-v2`: a linha grava com `ambiente = 'preview'` e **nada** chega ao Exact, ao e-mail ou ao Ads, nem depois do cron de produção.
7. Apagar os cards e linhas de teste como ele preferir (decisão dele; nenhum agente apaga dado de produção).
8. [A CONFIRMAR] que um erro de Server Action chega ao Sentry em produção (o SDK precisa descarregar o evento antes de a função congelar): provocar só se ele quiser, por exemplo com um Preview sem `DATABASE_URI`.

- [ ] **Step 8: Relatório ao Leandro**

O verificador entrega: saída real dos Steps 1 a 6, a tabela de linhas da bancada por execução, os PNGs com o que divergiu, a lista de `[A CONFIRMAR]` que sobrou e o checklist do Step 7 em branco para ele. Push, PR e merge só com o "ok" dele.

---

## Pendências [A CONFIRMAR]

1. A autorização de commit local por tarefa (15/10/2026) vale para a fase 2 (Global Constraints).
2. `C:\Users\lekoc\semogapp\semogsite\.env` existe e a `DATABASE_URI` dele é a do `cms_user` (Tarefa 2.1).
3. Valores das chaves de teste do Turnstile na documentação da Cloudflare (Tarefa 2.7, Step 3).
4. Evento de Server Action chega ao Sentry em produção (descarregado antes de a função congelar) (Tarefa 2.7, Step 7.8).
5. Herdadas do mapa e não bloqueantes graças ao filtro de ambiente: o `DATABASE_URI` do Preview é o de produção; crons da Vercel só disparam no deployment de produção; a importação do `generate_lead` do GA4 é ou não ação primária no Ads (contagem dupla, já existente hoje).
6. Onde vive a DDL de `cms.experience_lotacao` (motivo de o Experience ficar fora do `ambiente`, DP4).

## Auto-revisão

**1. Cobertura da spec e do roteiro (fase 2):**

| Requisito | Tarefa |
| --- | --- |
| 4.1 campos da etapa 1 (condomínio, UF com PE/PB/PA no topo, telefone BR, e-mail opcional) | 2.2 (schema), 2.6 (tela) |
| 4.1 campos da etapa 2; cidade por UF (D2); `?perfil=construtora` | 2.2, 2.6 |
| 4.1 landings pré-selecionam a UF | 2.6 (`ufInicial`; uso nas landings é da fase 6) |
| 4.2 migração `etapa`/`token_envio`, pela conexão do `cms_user`, antes do código, INSERT real revertido | 2.1 |
| 4.2 etapa 1 INSERT com Turnstile + rate limit, `variante='duas-etapas'`, atribuição, cookie HttpOnly | 2.4 |
| 4.2 etapa 2 UPDATE pelo token, uso único, validade curta, nunca segundo INSERT | 2.4 |
| 4.2 token perdido (R5, com Turnstile) | 2.4, 2.6 |
| 4.2 schema novo ao lado do antigo; `submitForm`/`submitPropostaRapida` intactos | 2.2, 2.4 |
| 4.2 `'use server'` só async; falha nunca silenciosa (tela + Sentry no servidor) | 2.3, 2.4, 2.6 |
| 4.3 Exact uma vez; cron com o critério da spec; etapa nula na hora | 2.3, 2.5 |
| 4.3 e-mail interno um só, roteado por UF | 2.2, 2.3 |
| 4.3 "já é cliente" fora do Exact e do Ads, e-mail avisa | 2.2, 2.3 |
| 4.3 mapeamento Exact (nome, região, papel/unidades/cliente na descrição, "parcial") | 2.2 |
| 4.4 GA4 `generate_lead` na etapa 1 e `lead_qualificado` na etapa 2 | 2.6 |
| 4.4 Ads pelo servidor junto com o Exact, `lead-<id>`, lote como rede (D1); first ou last; gbraid/wbraid (R9) | 2.2, 2.3, 2.5 |
| 5 tela de falha sem WhatsApp, com telefone da Unidade | 2.6 |
| 7 Preview com o mesmo banco: filtro de ambiente (R1) | 2.2 a 2.5 |
| 8.2 cron do Exact, cookie, Sentry, envio real à mão | 2.5, 2.4, 2.3, 2.7 |
| Roteiro: verificação completa, banco real, 2 browsers | 2.1 (banco real com parada), 2.7 |
| R14 (lista de testes) | uma linha por lead (2.4 "conclui a mesma linha", 2.7 contagem real); UPDATE só com token e 30 min (2.4); token perdido (2.4, 2.6); já é cliente (2.3, 2.4); etapa nula (2.5, e os testes antigos de `submit-form`); ambiente (2.2, 2.3, 2.4, 2.5); corrida do cron (2.5 + 2.7 Step 5); SQL do cron (2.5); Ads `lead-<id>` e falha do Ads (2.3, 2.4); e-mail por UF (2.2, 2.4); região incl. "Outra cidade" (2.2) |

Fora desta fase, de propósito: trocar `/proposta` e `/contato` pelo formulário novo (fase 4), remover a proposta curta e os links de WhatsApp de proposta (fase 4, spec 5), landings com `ufInicial` (fase 6), complemento por e-mail da etapa 2 tardia (R4, fora do escopo), `.env.example` (o mapa apontou lacunas; não é o que o plano mexe).

**2. Varredura de placeholders:** nenhum "TBD"/"TODO"/"implementar depois". Os passos com dependência externa estão marcados `[A CONFIRMAR]` com onde confirmar (lista em "Pendências"). O `<data>` da mensagem de commit da 2.1 e o `<scratchpad>` da 2.7 são valores que o executor preenche no momento, com instrução explícita.

**3. Consistência de nomes e tipos:** `LinhaDoLead`/`COLUNAS_DA_LINHA`/`dadosParaOExact` (2.3) são os que `gravacao.ts` (2.4), `criterios.ts` e as rotas (2.5) usam; `processarPosGravacao(linha, 'acao' | 'cron')` igual em 2.4 e 2.5; `ResultadoEtapa`/`ResultadoFalha` (2.4) são os da tela (2.6); `enviarEtapa1(valores, turnstileToken | null)`, `enviarEtapa2(valores)`, `enviarPropostaCompleta(valores, turnstileToken)` iguais em 2.4 e 2.6; `TIPO_CLIQUE_FIELD` (2.2) lido em 2.3 e 2.5; `SQL_AMBIENTE_LIBERADO` (2.2) usado em 2.5; etiquetas `proposta:*` e `cron:*` iguais no código e nos testes; nome do cookie `proposta_etapa` igual em 2.4, nos testes e na 2.7.

**4. Review Focus:** as cinco linhas têm teste na tarefa dona: action que lança (2.6), telefone com +55 e DDD com zero (2.2 e a máscara na 2.6), duplo clique (2.6), 30 a 45 min (2.4), troca de UF ao voltar (2.4 para o destino do e-mail, 2.6 para a cidade).

## Execução

Plano salvo em `docs/superpowers/plans/2026-10-16-site-v2-fase-2-formularios.md`. Ordem obrigatória: 2.1 (com a parada) antes de qualquer merge das demais; 2.2 → 2.3 → 2.4 → 2.5 → 2.6 dependem das interfaces umas das outras e podem ser implementadas antes de a 2.1 ser aplicada (os testes não tocam banco); 2.7 por verificador separado, uma rodada só para o PR. Recomendação: **subagent-driven**, porque 2.3 a 2.5 compartilham o contrato da linha e da pós-gravação, e um erro de idempotência ali vira card duplicado no Exact ou conversão dupla no Ads, que só aparece em produção.
