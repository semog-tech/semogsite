# Lead do site → Exact Spotter

**Data:** 2026-07-29
**Status:** implementado — ver plano em `docs/superpowers/plans/2026-07-29-lead-do-site-para-o-exact.md`

> **Correção pós-probe (2026-07-29).** O contrato da API que este design assumiu
> (tirado do PDF da Exact) estava errado em três pontos, corrigidos abaixo e
> documentados em `scripts/probe-exact-create-lead.ts`:
> `POST /Leads` não existe (é `/LeadsAdd`, contato `/PersonsAdd`); o corpo é
> aninhado em `{ lead: … }`; `source`/`industry`/`subSource` são **strings**, não
> ids. E **não há como gravar campo personalizado pela v3** — isso só existia na
> v2 (`api.exactsales.com.br`), que responde 503. Unidades, papel e tipo de
> condomínio passaram todos pra `description`.

## Problema

Quem preenche o formulário do site vira uma linha em `cms.leads` e dois e-mails.
No CRM (Exact Spotter) não vira nada — alguém precisa cadastrar na mão, e a
Daiane (única SDR ativa) só descobre o lead pelo e-mail. Os primeiros leads
orgânicos das landings de cidade já chegaram assim, e o volume tende a crescer
com o Ads. Queremos que cada pedido de proposta entre direto no funil.

## Escopo

Cria lead no Exact quando:

- form `proposta` — sempre; ou
- form `contato` com `assunto = 'proposta-comercial'`.

Os outros 8 assuntos do form de Contato (2ª via de boleto, CND, acordo,
titularidade, quitação, reserva de área comum, dúvida geral, outro) são
atendimento a quem **já é cliente** e não entram — sujariam o pipeline. É a
mesma regra que o cron do Google Ads (`upload-ads-conversions`) já usa pra
decidir o que é captação.

Fora de escopo: ler dados do Exact no site, atualizar lead existente, webhooks
do Exact, mudar o app `semogapp`.

## O que já existe

- **`semogapp/server/exactSpotter/`** — `ExactSpotterClient` maduro (header
  `token_exact`, rate-limit 30 req/20 s, retry, paginação OData), mas **só
  leitura** + `POST /LeadsLost`. Não tem criação de lead.
- **`semogsite/src/app/(frontend)/_actions/submit-form.ts`** — pipeline atual:
  Zod → Turnstile → rate-limit por IP → `insert into cms.leads` → e-mails
  (best-effort, nunca derrubam a submissão).
- **`semogsite/src/app/api/cron/upload-ads-conversions/route.ts`** — o padrão de
  cron que este design copia: `CRON_SECRET`, janela de dias, coluna de
  "já processado", nada é marcado antes de a resposta remota vir OK.
- O sync de leads do `semogapp` puxa o funil inteiro periodicamente, então o
  lead novo aparece sozinho no Kanban do app. Nada a mudar lá.

## Tenant do Exact (sondado em 2026-07-29, leitura)

| Coisa | Valor |
|---|---|
| Base | `https://api.exactspotter.com/v3` · header `token_exact` |
| Funil | Padrão `24653` → 1ª etapa "Entrada" (`187403`) |
| SDR ativa | `daiane@semog.com.br` (única) |
| Origens | `Site` 137471 · `Anúncio` 135724 · `Inbound Marketing` 135728 (default) |
| "Mercado" (`industry`) | usado como **região**: Campina Grande 247270 · Belém 247271 · Recife 247272 · João Pessoa 247273 |
| Campos personalizados | `125366` participação · `125373` tipo de condomínio · `125381` nº de unidades (+5 que não vêm do site) |

## Arquitetura

Tudo no `semogsite`; o `semogapp` não é tocado. A chamada sai da Vercel direto
pro Exact — um salto a menos, e o VPS fora do ar não impede o lead de entrar no
CRM. O custo é ~150 linhas de client HTTP que se parecem com as do `semogapp`;
a alternativa (rota nova no VPS) exigiria uma rota pública com segredo
compartilhado, já que hoje toda rota da API exige JWT de usuário.

```
src/lib/exact/
  client.ts     # HTTP: createLead(), createPerson(). Env, timeout 8s, sem retry interno.
  map-lead.ts   # PURA: (formType, data, attribution) → payload. Zero I/O ⇒ testável.
  push-lead.ts  # Orquestra: createLead → createPerson → { exactLeadId } | { error }
```

- **`client.ts`** — nada de rate-limit/paginação: o volume é de poucos leads por
  dia e as duas chamadas são POST pontuais. Timeout de 8 s por chamada. Sem
  retry interno; quem retenta é o cron. Se `EXACT_SPOTTER_TOKEN` estiver
  ausente, é **no-op silencioso** — é assim que `next dev` e os previews da
  Vercel não escrevem no CRM de produção, sem precisar de uma flag extra.
- **`map-lead.ts`** — função pura, sem `server-only`, sem `fetch`. É onde mora
  toda a decisão de mapeamento (tabela abaixo) e é o que os testes cobrem.
- **`push-lead.ts`** — sequência e tratamento de falha parcial.

`submit-form.ts` muda pouco: o `INSERT` passa a devolver `id` (`returning id`) e,
depois dele, um bloco `try/catch` chama o push e grava o resultado. O `await` é
proposital — em serverless a Vercel encerra a invocação com a resposta, então
trabalho "em background" depois do `return` não é confiável; melhor pagar os
~300 ms.

## Mapeamento

| Campo no Exact | Origem |
|---|---|
| `name` (obrigatório) | `nomeCondominio`; se vazio, `nome` da pessoa |
| `ddiPhone` / `phone` | split do E.164 com `libphonenumber-js` (já é dependência): `+5583999501388` → `55` + `83999501388` |
| `industry` | `cidade` → **nome** da região ("João Pessoa", "Recife", …); "Outra cidade" → omitido |
| `source` | **string** `"Anúncio"` se houver gclid/gbraid/wbraid/msclkid ou canal pago; senão `"Site"` |
| `mktLink` | página de entrada (`attribution.first.landing`) |
| `funnelId` | 24653 (sem `stage` → cai em "Entrada") |
| `sdrEmail` | env `EXACT_SDR_EMAIL`, default `daiane@semog.com.br` |
| `duplicityValidation` | `false` — sempre cria (vai fora do objeto `lead`) |
| `description` | mensagem + origem + **valores crus** informados no site |
| ~~`customFields`~~ | **impossível pela v3** — unidades/papel/tipo vão na `description` |

Mapa aproximado (decisão explícita: não mexer nas opções do form agora):

- **papel** (`cargo` → 125366): Síndico(a) → *Sindico Morador* · Conselheiro(a) →
  *Conselheiro* · Morador(a) → *Condômino* · Incorporador(a) / Construtora →
  *Construtora* · Outro → *Outros*.
- **tipo** (`tipo` → 125373): Condomínio residencial → *Residencial Vertical* ·
  Condomínio comercial → *Comercial* · Associação → *Outra modalidade* ·
  Incorporadora → *Outra modalidade*.

**Isso ficou sem efeito.** Como a v3 não grava campo personalizado, o mapa
aproximado não é usado: papel, tipo e unidades vão **crus** na `description`
("Informado no site — papel: Síndico(a) · tipo: Condomínio residencial ·
unidades: 84"), junto da mensagem e da origem. Some a ambiguidade (nada é
chutado) e some também o preenchimento automático dos campos que alimentam o
filtro de qualificação — quem qualificar preenche na tela, lendo a descrição.

Contato principal (`POST /PersonsAdd`): `leadId`, `name`, `email`, `jobTitle` =
cargo cru, `ddiPhone1`/`phone1`, `mainContact: true`.

## Dados

```sql
alter table cms.leads
  add column if not exists exact_lead_id   bigint,
  add column if not exists exact_error     text,
  add column if not exists exact_attempts  smallint not null default 0;
```

`exact_lead_id` preenchido significa sucesso e é a chave pra cruzar com o
`leads_cache` do app. `exact_error` guarda o último erro no banco, não só no log
da Vercel. `exact_attempts` limita o retry.

## Falha e retry

O `INSERT` continua sendo o **único** passo que precisa dar certo pra submissão
ser `ok: true`. Exact fora do ar não derruba o formulário nem os e-mails — o
comportamento degradado é exatamente o de hoje.

- **Falha no `POST /Leads`** → `exact_error` preenchido, `exact_attempts + 1`.
- **Lead criado mas `/Persons` falhou** → grava `exact_lead_id` mesmo assim e
  registra o erro do contato. **Não** retenta o lead (criaria duplicata); o card
  existe, só sem contato preenchido.
- **Cron** `/api/cron/push-exact-leads` (mesmo `CRON_SECRET`, `0 7 * * *`):
  varre leads elegíveis das últimas 48 h com `exact_lead_id is null` e
  `exact_attempts < 5` e reenvia. Diário porque o plano da Vercel pode ser
  Hobby (1 execução/dia); se for Pro, vira de hora em hora só mexendo no
  `vercel.json`.

## Testes

- **vitest** em `map-lead.ts` (é onde estão as decisões): telefone E.164 →
  ddi+número, cidade → `industry`, "Outra cidade" → sem `industry`, gclid →
  source `Anúncio`, sem gclid → source `Site`, `nomeCondominio` vazio → usa o
  nome da pessoa, campos opcionais ausentes não viram `customFields`, valores
  crus presentes na `description`, contato do form `contato`.
- **Probe canário** (`scripts/probe-create-lead.ts`, execução manual): a única
  incógnita real é o formato de `customFields` no `POST /Leads` — se `value` é o
  texto da opção ou o id dela. Cria 1 lead de teste, confere o retorno, e
  descarta com `POST /LeadsLost`. Roda **antes** de ligar em produção e precisa
  de OK explícito, porque escreve no CRM real.

## Configuração

Três variáveis novas na Vercel (produção):

- `EXACT_SPOTTER_BASE_URL` = `https://api.exactspotter.com/v3`
- `EXACT_SPOTTER_TOKEN` = (mesmo token do `.env.api` do semogapp)
- `EXACT_SDR_EMAIL` = `daiane@semog.com.br`

Sem `EXACT_SPOTTER_TOKEN`, o push é no-op — então o merge pode subir antes de as
variáveis existirem, e ligar a integração vira uma ação de configuração, não um
deploy.
