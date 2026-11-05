# Guia de deploy — Vercel

Site institucional Semog: **Next.js 16** (páginas estáticas lidas de `content/`), Postgres no
**Supabase** só para o que o site grava (leads, cliques, QR). O Payload saiu em jul/2026. Este guia
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
| `DATABASE_URI` | Sim | Não | Conexão de runtime, lida só por `src/lib/db.ts`. Aponta para o HAProxy da VPS, que repassa ao **Session pooler** da Supabase (ver `src/lib/db-tls.ts`), com o usuário `cms_user` (role dedicada, restrita ao schema `cms` — não usar o `postgres` superuser aqui). |

O app não lê nenhuma outra string de conexão: `DATABASE_URI_DIRECT`, que existia para as
migrations do Payload, não é mais usada pelo código.

**Pool e Fluid compute:** o `Pool` de `src/lib/db.ts` é registrado com `attachDatabasePool`
(`@vercel/functions`), que segura a função viva pelo `idleTimeoutMillis` do pool depois de cada
uso, para o `pg` fechar a conexão ociosa antes de a Vercel suspender a instância. Sem isso a
conexão ficava aberta no HAProxy até o timeout dele (~1h). O mecanismo é o de Fluid compute.

**TLS do banco:** a URI **não deve** ter `sslmode` (nem `sslrootcert`/`sslcert`/`sslkey`/`ssl`) — com
eles o `pg` descartaria a configuração de TLS do código; `src/lib/db-tls.ts` os remove por
garantia. O certificado é verificado (cadeia e nome) contra as raízes da CA da Supabase embutidas
nesse arquivo; quando a URI aponta para o IP do proxy da VPS, o nome conferido é o do pooler
(`SUPABASE_POOLER_HOST`). Se a Supabase trocar a raiz (a 2021 vence em 26/04/2031) ou o proxy
passar a apontar para fora de `*.pooler.supabase.com`, a conexão falha com erro de certificado: baixar a CA nova em Database Settings →
SSL Configuration, conferir o SHA-256, acrescentar em `SUPABASE_ROOT_CAS` (ou ajustar o nome do
pooler) e fazer deploy.

`PAYLOAD_SECRET`, `S3_*` e `SUPABASE_STORAGE_PUBLIC_URL` eram do Payload e do upload de mídia
dele; o código não lê mais nenhuma delas.

### Data API do Supabase — `site_api` (transição; desligada sem `SITE_API_ATIVO=true`)

| Variável | Obrigatório | Client-exposed | Descrição |
|---|---|---|---|
| `SITE_API_ATIVO` | Opcional | Não | `true` faz o clique no WhatsApp (`/api/track/whatsapp`) e o acesso por QR (`/qr/*`) gravarem pela Data API, nas funções `site_api.whatsapp_clique_inserir` e `site_api.qr_acesso_inserir`. Qualquer outro valor (ou ausente) mantém o pool de `DATABASE_URI`, exatamente como antes. |
| `SUPABASE_URL` | Com a flag | Não | `https://qvxlkovrxfqigeaopvui.supabase.co`. Só `https`. |
| `SUPABASE_PUBLISHABLE_KEY` | Com a flag | Não | Chave publishable (`sb_publishable_...`), exigida pela Data API no cabeçalho `apikey`. Não é segredo, mas só o servidor a usa: **não** criar como `NEXT_PUBLIC_*`. |
| `KMS_SITE_API_ISSUER_ID` | Com a flag | Não | ID do emissor do Vercel KMS. `src/lib/siteApi.ts` pede a ele um JWT de 5 min (`sub: semogsite`) e o reaproveita até faltar 1 min para vencer. O `role` (`site_api_runtime`) vem da política do emissor, não do código. |

As quatro entram **só em Production**. O emissor de produção não pode aceitar o token OIDC de
Development nem de Preview: o `vercel env pull` de development entrega um token que assina
localmente. Sem a flag, os Previews seguem pelo pool.

Com a flag ligada e alguma das outras faltando, cada gravação falha com erro de configuração
no log (`[api/track/whatsapp]` / `[qr]`), e o visitante não percebe nada: o beacon continua
respondendo 204 e o QR continua redirecionando. É o mesmo efeito do banco fora, então a
conferência depois de ligar é a tabela recebendo linha nova, não a ausência de erro na tela.

Ligar ou desligar pede **deploy novo** (variável de ambiente da Vercel só vale a partir do
próximo deploy). A ordem é: banco (`site_api` aplicado e exposto) e emissor prontos → variáveis
criadas → deploy → conferir.

**A prova de que ligou é linha nova em `cms.qr_scans` e em `cms.whatsapp_clicks`, com o
PRIMEIRO acesso da instância sendo um QR.** O token do KMS fica em cache por instância (até
faltar 1 min dos 5): se um clique no WhatsApp assinou antes, o QR seguinte usa esse token e
parece funcionar mesmo que a assinatura feita a partir do QR esteja quebrada. O QR é o caso
frágil porque grava no `after`, depois da resposta; por isso as duas rotas leem o token OIDC
do cabeçalho `x-vercel-oidc-token` no próprio handler e o passam ao KMS
(`oidcDaRequisicao` em `src/lib/siteApi.ts`), sem depender do contexto da requisição. Para
garantir instância fria: logo depois do deploy, escanear (ou abrir `/qr/folder`) **antes** de
qualquer clique no WhatsApp, conferir a linha em `cms.qr_scans` e só então testar o WhatsApp.

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

### Exact Spotter — CRM (opcional; sem elas a integração fica desligada)

| Variável | Obrigatório | Client-exposed | Descrição |
|---|---|---|---|
| `EXACT_SPOTTER_BASE_URL` | Opcional | Não | Base da API v3 — `https://api.exactspotter.com/v3`. É o default no código (`src/lib/exact/client.ts`); só definir se mudar. |
| `EXACT_SPOTTER_TOKEN` | Opcional | Não | Token gerado no Exact em Configurações → Integrações (o mesmo do `.env.api` do `semogapp`). **É a chave que liga a integração:** sem ela, `pushLeadToExact` é no-op e o formulário funciona como antes. |
| `EXACT_SDR_EMAIL` | Opcional | Não | E-mail da pré-vendedora que recebe os leads do site. Default `daiane@semog.com.br` — precisa ser um SDR **ativo** no Exact. |

Configurar **só no environment Production**. Em Preview elas devem ficar ausentes, senão cada
teste em branch de preview cria lead de verdade no CRM. O deploy pode subir antes das variáveis
existirem — ligar a integração é ação de configuração, não de código.

O que a integração faz: toda submissão de **Proposta** (e de **Contato** com
`assunto = proposta-comercial`) cria um lead no funil Padrão do Exact, com contato principal, logo
depois de gravar em `cms.leads`. Falha do CRM não derruba o formulário — fica em
`cms.leads.exact_error` e `crm_error`; o cron `/api/cron/push-crm-leads` retenta por 48 h,
no minuto 15 de cada hora (`15 * * * *`, UTC), até 5 tentativas de envio.
O endpoint antigo `/api/cron/push-exact-leads` é um alias que também respeita `CRM_PROVIDER`.
Detalhes do contrato da API — que diverge do PDF oficial da Exact — em
`scripts/probe-exact-create-lead.ts`.

### Provedor de CRM: Exact → RD Station CRM v2

`CRM_PROVIDER=exact|rdstation` seleciona o único destino. Ausente mantém Exact; valor inválido
falha fechado e aparece no Sentry. A API do Exact e seu mapeamento continuam intactos. O
CRM segue pelo pool `pg` como `cms_user`; `SITE_API_ATIVO` só altera WhatsApp/QR, portanto
esta integração não usa nem expõe funções de token em `site_api`/PostgREST.

A configuração principal vem do banco, editada pelo admin no semogapp. As variáveis a
seguir permanecem como fallback legado, **somente servidor**, no ambiente Production;
não é preciso duplicar nelas os valores já salvos pelo admin:

| Variável | Uso no RD |
|---|---|
| `RD_CRM_PIPELINE_ID` / `RD_CRM_STAGE_ID` | Funil e etapa inicial; o site verifica a associação com `GET /pipelines/{pipeline}/stages/{stage}`. `pipeline_id` é read-only na criação da v2: envia `stage_id`. |
| `RD_CRM_SOURCE_SITE_ID` / `RD_CRM_SOURCE_ANUNCIO_ID` | Fontes Site e Anúncio. Clique Google ou canal classificado como tráfego pago selecionam Anúncio. |
| `RD_CRM_CAMPAIGN_SITE_ID` / `RD_CRM_CAMPAIGN_ANUNCIO_ID` | Campanhas cadastradas correspondentes aos dois canais. O nome da campanha UTM também vai em campo personalizado, sem criar cadastros. |
| `RD_CRM_DISTRIBUTION_RULE` | JSON de `distribution_settings.rule`: `type` igual a `user`, `team`, `all`, `all_users`, `all_admins` ou `owner`; `user`/`team` exigem `id`. Sem responsável por e-mail cravado. |
| `RD_CRM_UNIDADES_POR_CIDADE` | JSON cidade do formulário → valor da opção Unidade Semog. `Outra cidade` e contato sem cidade deixam Unidade Semog ausente; cidade regional sem mapeamento é erro de configuração. |
| `RD_CRM_EQUIPES_POR_UNIDADE` | JSON opcional rótulo da Unidade (valor de `RD_CRM_UNIDADES_POR_CIDADE`, ex. `João Pessoa`) → ID de equipe RD (24 hex). Lead cuja Unidade tem equipe é distribuído com `{type:"team",id}`; `Outra cidade`, lead sem cidade e Unidade sem equipe seguem `RD_CRM_DISTRIBUTION_RULE`. Ausente equivale a `{}`. |
| `RD_CRM_CUSTOM_FIELDS` | JSON alias → ID de 24 hex ou slug no RD: `id_lead_site`, `unidade_semog`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `gclid`, `tipo_clique`, `pagina_entrada`, `dados_proposta`; opcionais: `quantidade_unidades`, `tipo_condominio`, `participacao`. Referências distintas; exemplos reais comentados em `.env.example`. |
| `RD_CRM_OPCOES_CAMPOS` | JSON opcional `{tipo_condominio:{valor-form:opção-RD},participacao:{valor-form:opção-RD}}`. Ausência de participacao usa o mapa padrão abaixo; mapa explícito o substitui inteiro, inclusive `{participacao:{}}` para desativá-lo. Sem equivalência, deixa o campo vazio e preserva o valor em dados_proposta. |

O site lê `cms.crm_rdstation_config_obter()`, fachada privada SECURITY DEFINER de dono
postgres e search_path vazio para `commercial.crm_rdstation_config_obter()`. Só cms_user
recebe EXECUTE na fachada; não há USAGE em commercial. O contrato é JSON plano:
schema_version=1, version como contador de edição, pipeline_id, entry_stage_id,
source_site_id/source_anuncio_id, campaign_site_id/campaign_anuncio_id, distribution_rule,
unidades_por_cidade, custom_fields e metadados updated_by/updated_at. Os aliases canônicos
de custom_fields são os nomes do site listados acima; id_lead_site é obrigatório.
`equipes_por_unidade` é opcional (ausente = `{}`) e usa o mesmo formato de
RD_CRM_EQUIPES_POR_UNIDADE; ID fora de 24 hex é erro de validação, sem fallback.
`opcoes_campos` é opcional e usa o mesmo formato de RD_CRM_OPCOES_CAMPOS; aliases
novos e mapas são extensões opcionais do schema_version 1, alinhadas com o semogapp.
Padrão de participação no banco/env sem mapa explícito: `Conselheiro(a)` → `Conselheiro`,
`Morador(a)` → `Condômino`, `Incorporador(a) / Construtora` → `Construtora` (decisão
comercial do dono), `Outro` → `Outros`. `Síndico(a)` não diferencia morador/profissional:
fica sem opção no RD e preservado no texto. Cargo desconhecido também não vira Outros.
O editor pode gravar string vazia para uma resposta (`{"participacao":{"Síndico(a)":""}}`):
significa "Não preencher". O site aceita esse valor no banco/env, omite o campo do payload
e mantém a resposta em dados_proposta, sem procurar um default para aquela chave.
`tipo_condominio` não recebe mapa padrão. As sete opções reais de participação são
`Sindico Morador`, `Sindico Profissional`, `Sub - Síndico`, `Conselheiro`, `Condômino`,
`Construtora`, `Outros`, exatamente com esses acentos e espaços. `tipo_condominio`
aceita `Vertical`/`Horizontal`; `taxa_extra` e `ja_cliente` aceitam `Sim`/`Não`.
Fonte/campanha/distribuição NULL são omitidas do POST (distribuição padrão do RD).

Cache por instância por 60s, com uma leitura compartilhada entre chamadas concorrentes.
Mudança salva pelo admin pode levar até 60s para aparecer em cada instância, sem deploy.
Tabela vazia (RPC retorna NULL) usa as envs legadas. Erro da RPC usa a última configuração
boa, mesmo expirada, ou as envs se a instância ainda não tiver cache; registra Sentry com
a origem do fallback e evita repetir a leitura por mais 60s. Instância fria sem banco e
sem envs válidas falha e deixa o lead na fila, sem inventar configuração.

JSON inválido/incompleto ou schema_version desconhecida gera erro explícito e não usa
cache/env para encobrir a configuração incorreta. pipeline_id, entry_stage_id e alias
id_lead_site precisam existir; version não é versão de schema e pode aumentar normalmente.
O fluxo de envio registra o erro no Sentry e no lead para retry pelo cron.

`dados_proposta` preserva formulário, mensagem e os valores sem campo próprio ou sem
correspondência configurada; dados enviados em campos próprios não se repetem. O número
de unidades vira inteiro positivo seguro; número inválido fica no texto. Cargo usa o mapa
de participação. O tipo atual do form (residencial/comercial/associação/incorporadora)
não informa Vertical/Horizontal: sem equivalência comprovada, fica no texto. A atribuição
sem alias e os dados legados continuam preservados em
texto longo. `gclid` guarda também gbraid/wbraid, com o tipo em `tipo_clique`. UTMs do primeiro
toque passam a ser gravadas individualmente em `cms.leads.data`; histórico anterior continua
legível em `dados_proposta`, sem inventar UTMs separando o texto antigo.

O contato é procurado primeiro por e-mail normalizado e depois por telefone E.164, criando
somente quando ambos não retornam registro. Duplicados de contato não bloqueiam a negociação:
listar todas as páginas, ordenar por `created_at` (ID como desempate), usar o mais antigo e
emitir Sentry warning "contato duplicado no RD", sem excluir nenhum registro. A negociação recebe `contact_ids`, status
`ongoing`, fonte/campanha, Unidade Semog e os campos personalizados. Nenhum POST usa a API
v1 nem cria um lead do RD: a entidade é negociação (`/crm/v2/deals`, envelope `{data: …}`).

### Conferir os campos da conta no primeiro ensaio autorizado

A UI do RD mostra IDs, não slugs. A documentação e o OpenAPI oficial da
[listagem de campos v2](https://developers.rdstation.com/reference/crm-v2-list-custom-fields)
expõem ambos (`id` e `slug`); o schema CustomFields usa slug como chave do payload e o
[filtro RDQL](https://developers.rdstation.com/reference/crm-v2-rdql-filtering) exige `@slug`.
O site aceita ID ou slug na configuração e resolve IDs usando GET
`/crm/v2/custom_fields?filter=entity:deal`, com paginação e cache de 60s por instância.
Não deriva slug do nome, não tenta `@ID` e não passa para POST se faltar o slug.
Falha do catálogo deixa o lead na fila com erro visível à operação; não usa slug presumido.

No primeiro ensaio, usando o token vigente sem registrar seu conteúdo:

1. Listar todas as páginas de custom_fields de deal e conferir os 14 pares ID/slug
   dos exemplos comentados em `.env.example`, os tipos e as opções reais.
2. Confirmar quantidade_unidades como number; enviar um inteiro (ex.: 48) e uma
   escolha válida do catálogo, reler o card e conferir a apresentação no RD.
   O schema genérico CustomFields do OpenAPI descreve valores como string, embora
   o catálogo tenha tipo number: a aceitação de número JSON e a representação de
   multiple_choice precisam ser confirmadas nessa conta antes da virada.
3. Participação: conferir o mapa padrão aprovado acima ou as equivalências explícitas
   do admin; síndico genérico fica no texto. Não inferir geometria
   Vertical/Horizontal de um tipo residencial/comercial do formulário atual.
4. Confirmar a busca `/deals?filter=@<slug real id_lead_site>:"<id do lead>"`
   retorna o mesmo card. Repetir o processamento do mesmo lead e verificar que
   não há um segundo POST/card, inclusive após timeout simulado no ambiente de teste.
5. Conferir que dados_proposta contém mensagem e valores sem campo/equivalência,
   sem repetir contato, nome do condomínio, unidades e atribuição já estruturados.

[A CONFIRMAR com token] pares ID/slug da conta, opções e serialização dos campos
number/multiple_choice. Os testes locais usam fetch estrito dublado, sem alegar
que um valor observado somente na UI foi aceito pela API.

Token: `obterTokenRd()` chama a fachada privada `cms.crm_rdstation_token_obter()` com retorno
`TABLE(access_token text, expires_at timestamptz)`. A fachada do site (dono postgres, `SECURITY DEFINER`, `search_path` vazio)
chama a função de mesmo nome em `commercial`, criada pela frente do semogapp; ambas são
somente leitura e não retornam refresh token. O site não renova OAuth nem guarda
cache de token. Ausente, inválido ou com validade ≤60s é erro persistido/Sentry, mantendo a
resposta de sucesso para quem preencheu o formulário.

Ordem de preparação, ainda sem virar a flag:

1. Aplicar, com autorização, a migração do semogapp que cria a função de leitura.
2. **Aplicar as migrações ANTES do deploy**, com autorização, na ordem e com os papéis da
   seção "Ordem das migrações de novembro/2026" abaixo: `db/2026-11-04-crm-provider-1-cms-user.sql`
   (colunas, como `cms_user`) e `db/2026-11-04-crm-provider-2-postgres.sql` (fachada, como
   `postgres`), cada uma com o `.down.sql` já preparado. A parte 2 concede a `cms_user` somente `EXECUTE`
   na fachada em `cms`, sem `USAGE commercial`, sem `EXECUTE` direto nas funções de
   commercial e sem SELECT na tabela de tokens. A asserção varre funções, relações, colunas
   e sequences de commercial e aborta se houver acesso inesperado direto/PUBLIC/herdado.
   Sem USAGE, até função futura que receba EXECUTE de PUBLIC fica inacessível pelo schema. A migração não foi aplicada por
   esta implementação. A migração é aditiva e pode entrar com o código antigo/Exact ainda ativo.
   Se a estrutura faltar, o código emite erro explícito "estrutura ausente; aplicar ... ANTES
   do deploy", reporta Sentry e o cron retorna 500; não apresenta sucesso silencioso.
3. Publicar e validar com `CRM_PROVIDER=exact`; preencher e conferir os cadastros reais do RD.
4. Fazer ensaio autorizado e só então configurar `CRM_PROVIDER=rdstation` e publicar.

Para a configuração administrativa, aplicar também a migração
`2026-11-04-crm-rdstation-config.sql` do semogapp e depois
`db/2026-11-04-crm-config-site-postgres.sql` do site (como `postgres`), antes do deploy deste código.
O inverso é `db/2026-11-04-crm-config-site-postgres.down.sql`, preparado antes do avanço.
A migração da fachada repete a varredura de funções/relações/colunas/sequences e aborta
se cms_user tiver acesso direto a commercial. Essas migrações não foram aplicadas nesta
implementação. A tabela pode continuar vazia enquanto as envs legadas sustentam a operação.

O provedor é fixado na primeira tentativa. Linhas com histórico `exact_*` são atribuídas ao
Exact pela migração; não migram automaticamente. O cron só envia ao provedor ativo e deixa
pendências do outro intactas. Reversão da flag também preserva pendências do RD. Para migrar
qualquer linha manualmente, reconciliar os CRMs antes; não limpar IDs para forçar reenvio.

A fila usa reserva atômica de 5 minutos (`crm_travado_ate`, `FOR UPDATE SKIP LOCKED`), sem
conexão presa durante HTTP. Seleção e reserva compartilham o mesmo predicado: provedor, lease,
próxima tentativa e teto; conciliação já agendada é exceção à janela de 48h e ao teto de
consultas, sem autorizar novos POSTs depois do teto de 5 tentativas de envio.
`crm_post_iniciado_em` é gravado antes do POST de negociação e `crm_status='incerto'` torna
um término abrupto visível. Falhas verificáveis antes de enviar HTTP (DNS, conexão recusada,
timeout de conexão/TLS) liberam o marcador para retry; reset de socket, timeout de resposta,
5xx e JSON ilegível continuam incertos. Cada retry procura `@<slug id_lead_site>:"<id>"`. Dentro dos primeiros
30 minutos, "aguardando conciliação" é espera normal: não gera Sentry error, não conta como
falha/502 nem consome nova tentativa. `crm_proxima_tentativa_em` agenda a próxima execução;
falha real usa backoff de 15min, 1h, 4h, 16h e 24h. A fila é ordenada pela próxima tentativa,
sem dar prioridade recorrente ao mesmo payload inválido só por ser mais antigo.

Esse backoff também vale para o Exact: o comportamento anterior retentava de hora em hora
e consumia as 5 tentativas em cerca de 5h; agora a quinta tentativa fica em torno de 21h,
mais o arredondamento para o cron horário. A janela comum continua em 48h. É uma mudança
intencional para espaçar falhas determinísticas. `personError` é Sentry **warning**:
o card do Exact existe, apesar da falha ao complementar o contato.

Janela de conciliação, teto, lease e backoff têm fonte única em `src/lib/crm/queue.ts`.
Os valores entram como parâmetros SQL em milissegundos, inclusive o resultado de
`backoffCrm(tentativas)`. Reservar o lease não consome tentativa; uma conciliação que só
encontra o card não muda `crm_attempts`. Envio real e falha anterior ao envio são contados.

**Política decidida pelo coordenador:** se o POST foi incerto e a busca continuar vazia por
30 minutos, recriar automaticamente com o mesmo id_lead_site. Isso prioriza receber o lead
sobre evitar todo duplicado: RDQL não garante unicidade no servidor. Uma recriação confirmada
gera Sentry **warning**: "recriado após incerteza; conferir duplicado", e agenda nova
reconciliação em 30 minutos (`crm_reconciliar_em`), inclusive com `crm_deal_id` preenchido.
Na próxima execução horária elegível, mesmo se ultrapassar 48h do lead, se houver dois cards, emitir Sentry **error** com os
IDs, preservar os dois e gravar o estado terminal `crm_status='duplicado'`. A SDR decide
qual card manter; nenhum é excluído automaticamente. O alerta fica também em `crm_error`.
A reconciliação agendada não é impedida pelo teto de 5 envios nem pela janela de 48h.
Se a tentativa de recriação receber 401/429, a marca e o horário do POST incerto anterior
são preservados; uma rejeição atual não prova que a chamada anterior não foi processada.

Se o teto já foi atingido e a última consulta não encontra o card, gravar o estado terminal
`crm_status='esgotado'`. Ambos os estados saem da fila, inclusive de conciliações agendadas.
O Sentry error é emitido somente por quem grava a primeira transição terminal, usando
UPDATE condicional; chamadas seguintes não repetem o alerta. Nenhum registro é apagado.

Resolução manual, por operador autorizado, antes de reativar qualquer envio:

1. Localizar o lead pelo ID do site e conferir no RD todos os cards com o mesmo id_lead_site.
   Em `duplicado`, usar os IDs registrados em `crm_error` para escolher com a SDR o card
   que será mantido como referência; o sistema não exclui o outro automaticamente.
2. Se o card correto existir, registrar seu `crm_deal_id`/contato confirmado, marcar
   `crm_status='enviado'` e limpar o erro, o lease e a conciliação pendente. Preservar o
   contador de tentativas e o provedor; não forçar novo POST.
3. Em `esgotado` sem card, corrigir a causa (token, configuração ou payload), confirmar a
   ausência no CRM e só então autorizar nova rodada: zerar `crm_attempts`, limpar os
   marcadores de POST incerto/lease/conciliação, marcar `pendente` e colocar a próxima
   tentativa no horário atual. Preservar `crm_provider`; no Exact, conferir também seu
   contador histórico antes de qualquer liberação manual. Registrar a decisão operacional.

O CRM roda em `after()` do Next 16.2.6, após a resposta: os e-mails internos são enviados
antes de agendar esse trabalho, e quem preenche não espera o CRM. O callback captura erros
e o cron cobre interrupção/falha de agendamento. Cada chamada HTTP ao RD tem prazo de 8s,
igual ao Exact. Falha de envio é invisível para o visitante: proposta já gravada.
A operação vê `crm_provider`, `crm_deal_id`, `crm_contact_id`, `crm_error`, `crm_status`,
`crm_attempts`, `crm_enviado_em` e os marcadores no banco. O cron processa até 25 propostas (mesmo limite para Exact/RD, com orçamento de tempo)
por chamada, retorna **502 se alguma falhar**, 500 para falha de configuração/banco e 401
sem CRON_SECRET válido. Verificar o monitoramento de cron da Vercel e o DSN do Sentry ativos.

[A CONFIRMAR na conta real] IDs e slugs, tipos/opções dos campos, etapa inicial, distribuição,
permissões OAuth e validade/renovação pelo app, cadastros de fontes/campanhas e recebimento
real dos alertas. O catálogo de 04/11 confirmou que `cms_user` não tinha acesso direto às
7 relações então presentes em commercial e não havia sequences; a asserção da migração
verifica novamente o estado efetivo, incluindo funções e futura tabela de tokens, antes de liberar.
As linhas `utm_*` novas também aparecem na descrição do Exact, preservando os dados
individuais sem mudar o contrato de sua API.

Fontes primárias: [criar negociação](https://developers.rdstation.com/reference/crm-v2-create-deal),
[contatos](https://developers.rdstation.com/reference/crm-v2-list-contacts),
[RDQL](https://developers.rdstation.com/reference/crm-v2-rdql-filtering) e
[casos de uso](https://developers.rdstation.com/reference/crm-v2-use-cases).

### 2ª via de boleto na triagem (opcional; desligada sem `SEGUNDA_VIA_ATIVA=true`)

| Variável | Obrigatório | Client-exposed | Descrição |
|---|---|---|---|
| `SEGUNDA_VIA_ATIVA` | Opcional | Não | `true` liga a 2ª via: "Sou cliente" abre a consulta por CPF em vez do WhatsApp da fase 1. Qualquer outro valor (ou ausente) mantém a fase 1. Lida no servidor (`WhatsAppFloat` e cada Server Action de `src/app/(frontend)/_actions/segunda-via.ts`); só o booleano chega ao navegador. |
| `SEMOGAPP_API_URL` | Com a flag | Não | Base da API pública do `semogapp` (as rotas são `<base>/publico/segunda-via/*`). Só `https`, exceto `localhost`. [A CONFIRMAR o host público] |
| `SEMOGAPP_SEGUNDA_VIA_SEGREDO` | Com a flag | Não | Segredo HMAC compartilhado com o `semogapp` (≥ 32 bytes), próprio desta integração. Assina cada pedido; **nunca** como `NEXT_PUBLIC_*`. |

As três são **só de servidor** e entram **só em Production e no Preview autorizado** para o
ensaio — nunca em todo Preview: cada consulta envia e-mail de verdade ao condômino e abre
boleto real. Sem `SEMOGAPP_API_URL` ou com segredo curto, as actions respondem
"indisponível" e a tela manda ao WhatsApp, nunca a uma lista vazia.

Ligar ou desligar pede **deploy novo**: as páginas são estáticas e o botão sai no HTML do
build com o valor da flag daquele momento. As actions conferem a flag a cada chamada, então
desligar no meio de uma consulta leva a pessoa ao WhatsApp.

### RD Station Marketing — monitoramento e conversões (opcional)

| Variável | Onde | Efeito |
| --- | --- | --- |
| `NEXT_PUBLIC_RD_TRACKING_SCRIPT_URL` | build (público, não é segredo) | URL completa do loader da conta. Ausente ou fora do formato `https://d335luupugsy2.cloudfront.net/js/loader-scripts/<id>-loader.js` não carrega nada. Só mede em `semog.com.br`/`www`. |
| `RD_MARKETING_API_KEY` | servidor, só Production | Conversão de proposta/contato comercial pela API. Vazia = nada é enviado e o pedido não guarda snapshot (sem backfill depois). Nunca `NEXT_PUBLIC`. |

Ligar a chave só depois da migração `rd-marketing` e de conferir o painel. Detalhes, CSP e
regras do painel em `docs/rd-station.md`.

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

## 3. Migrations — SQL manual em `db/`

Não há ferramenta de migration nem script `pnpm migrate`: o schema do que o site grava
(`cms.leads` e colunas de Exact/desfecho, `cms.whatsapp_clicks`, `cms.qr_scans`, consentimento de
Ads) vive em arquivos SQL em `db/*.sql`, aplicados **à mão** no Supabase (SQL Editor ou MCP) por
quem faz a mudança, antes do deploy do código que depende dela. Os arquivos são escritos para
rodar de novo sem estrago (`create ... if not exists`, `add column if not exists`).

Depois de aplicar, confira no catálogo (`information_schema.columns`) que a mudança existe — a
saída do comando não é prova. O build e o deploy não tocam no banco.

### Ordem das migrações de novembro/2026 (CRM RD + RD Marketing)

Todas entram antes do deploy do código que as usa — o INSERT de `cms.leads` passa a gravar
`rd_marketing_payload` mesmo com `RD_MARKETING_API_KEY` vazia, e o cron do CRM lê as colunas
`crm_*`. Nenhuma foi aplicada.

**Por que os arquivos são separados por papel.** `cms.leads` tem dono `cms_user`; as fachadas
`cms.crm_rdstation_*_obter` precisam de dono `postgres`, porque leem `commercial`, onde `cms_user`
não tem `USAGE`. E `postgres` e `cms_user` não são membros um do outro (`pg_auth_members`,
medido no catálogo de produção em 30/10 e conferido de novo em 04/11). Nenhum papel consegue
aplicar as duas coisas: como `postgres`, `must be owner of table leads`; como `cms_user`,
`permission denied for schema commercial`. Por isso cada arquivo abre com uma guarda que aborta
com `Rode como <papel> (conectado: ...)` se `current_user` for outro — a transação aborta
inteira, sem estado parcial.

**Subida:**

| # | Repositório | Arquivo | Papel |
| --- | --- | --- | --- |
| 1 | semogapp | migrações que criam `commercial.crm_rdstation_token_obter()` e a tabela/função de configuração (`commercial.crm_rdstation_config_obter()`, em `2026-11-04-crm-rdstation-config.sql`) | o que o semogapp indicar |
| 2 | site | `db/2026-11-04-crm-provider-1-cms-user.sql` — colunas `crm_*`, backfill do Exact, índice | `cms_user` |
| 3 | site | `db/2026-11-04-rd-marketing.sql` — colunas `rd_marketing_*`, índice parcial | `cms_user` |
| 4 | site | `db/2026-11-04-crm-provider-2-postgres.sql` — fachada `cms.crm_rdstation_token_obter` + varredura | `postgres` |
| 5 | site | `db/2026-11-04-crm-config-site-postgres.sql` — fachada `cms.crm_rdstation_config_obter` + varredura | `postgres` |
| 6 | site | deploy do código, ainda com `CRM_PROVIDER=exact` | — |

O passo 1 tem que vir **antes** dos passos 4 e 5: o corpo das fachadas é SQL, validado na
criação, e o `create function` falha com `function commercial.crm_rdstation_..._obter() does not
exist` se a função do semogapp ainda não existir. Os passos 2 e 3 não dependem dele, mas ficam
depois para a ordem ser uma só. Os passos 4 e 5 terminam com a varredura que aborta se
`cms_user` tiver qualquer acesso a `commercial` (USAGE no schema, EXECUTE em função, privilégio em
relação, coluna ou sequence).

`cms_user` é a `DATABASE_URI` do site; os passos 2 e 3 não rodam pelo MCP nem pelo SQL Editor,
que conectam como `postgres`. Os passos 4 e 5 rodam por eles.

Depois de cada passo, conferir no catálogo (`information_schema.columns` para 2 e 3;
`pg_proc.proowner` e `proacl` das fachadas para 4 e 5 — dono `postgres`, `EXECUTE` só para
`cms_user`, nada para `anon`/`authenticated`/`service_role`).

`RD_MARKETING_API_KEY` só depois de conferir no painel que nenhuma automação cria negociação (ver
`docs/rd-station.md`).

**Descida** — código antigo primeiro, depois a ordem inversa, cada `.down.sql` com o papel da subida:

| # | Arquivo | Papel |
| --- | --- | --- |
| 1 | reverter o deploy do site (código que não lê `crm_*`, `rd_marketing_*` nem as fachadas) | — |
| 2 | `db/2026-11-04-crm-config-site-postgres.down.sql` | `postgres` |
| 3 | `db/2026-11-04-crm-provider-2-postgres.down.sql` | `postgres` |
| 4 | `db/2026-11-04-rd-marketing.down.sql` | `cms_user` |
| 5 | `db/2026-11-04-crm-provider-1-cms-user.down.sql` | `cms_user` |
| 6 | `.down` das migrações do semogapp, só depois das fachadas removidas | o que o semogapp indicar |

Antes de aplicar, conferir no catálogo de produção se a pertinência entre os papéis e a ACL dos
schemas continuam as descritas acima.

## 4. Preview deployments

- Todo branch/PR aberto no repositório gera automaticamente um **preview deployment** na Vercel
  (URL única por deploy).
- Os previews usam o **mesmo projeto Supabase** (mesmo schema `cms`) que produção — não há
  banco isolado por preview. Tenha cuidado ao testar formulários em previews: eles gravam nos
  mesmos dados de produção.
- Variáveis de ambiente marcadas para o environment **Preview** no Project Settings se aplicam a
  todos os previews. Se algum dia for necessário isolar dados de preview, provisionar um schema
  Supabase separado (`cms_preview` ou similar) e usar Vercel's per-branch env vars — não é o
  caso hoje.

## Como a produção é publicada (Deploy Hook)

Desde 22/10/2026 o evento de push da `main` deixou de chegar à Vercel (a integração Git
segue conectada e os Previews das PRs funcionam), então a produção é publicada pelo GitHub
Actions, não pela integração Git.

- **Fluxo:** merge/push na `main` dispara `.github/workflows/deploy-producao.yml`, que faz POST
  no Deploy Hook `github-actions-main` (Vercel → Project Settings → Git → Deploy Hooks). O log
  mostra só o status HTTP e o `job.id`; a URL nunca é impressa.
- **Segredo:** a URL do hook fica no secret `VERCEL_DEPLOY_HOOK_MAIN` do repositório (GitHub →
  Settings → Secrets and variables → Actions). Quem tem a URL publica o projeto: se vazar,
  revogue o hook na Vercel, crie outro e atualize o secret.
- **Sem duplicar:** o `vercel.json` traz `git.deploymentEnabled.main = false`, que desliga o
  deploy automático da `main` pela integração Git. Branches de PR continuam gerando Preview.
- **Manual:** GitHub → Actions → "Deploy produção" → Run workflow (branch `main`).
- **Limite:** a Vercel aceita até 60 disparos de hook por hora por projeto.
- **Voltar atrás** (quando o push da integração Git voltar a funcionar): remova o bloco `git`
  do `vercel.json` e apague `.github/workflows/deploy-producao.yml` (e, se quiser, o hook e o
  secret). Fazer só uma das duas metades deixa a produção sem deploy ou com deploy em dobro.

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
- [ ] Mudança de schema do deploy, se houver, aplicada antes a partir de `db/*.sql` e conferida
      no catálogo.
- [ ] Domínio `semog.com.br` + `www.semog.com.br` configurados.
- [ ] Deploy de produção concluído e um envio de formulário de teste gravado em `cms.leads`.
- [ ] Pós-deploy: Search Console (sitemap), GTM (atrás do consent gate), Google Ads.
