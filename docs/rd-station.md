# RD Station Marketing no site

Implementação sobre `origin/main` em `c7a492a2f67b25604f415fadb26f9180d7d83e45`,
confirmado com `git fetch origin main`, `git log` e `git ls-remote` em 04/11/2026.
Sem commit, push, deploy ou alteração de banco.

**Opção B implementada:** conversão pelo servidor ao Marketing; negociação criada
exclusivamente pela integração própria do CRM da outra worktree. As migrações
estão preparadas e **não aplicadas ao banco Semog**; não houve commit nem deploy.
A chave de conversões não foi fornecida nem utilizada contra a API real.

## Carregamento e configuração

Definir `NEXT_PUBLIC_RD_TRACKING_SCRIPT_URL` com a URL pública completa do loader
da conta, no formato `https://d335luupugsy2.cloudfront.net/js/loader-scripts/<id>-loader.js`.
É configuração de **build** do Next, não segredo. Ausência ou formato diferente
não carrega nada. A URL pública real, informada pelo coordenador, está como
exemplo em `.env.example`:
`https://d335luupugsy2.cloudfront.net/js/loader-scripts/b5cc11ec-edcd-4c9c-b5ad-01c535d0076f-loader.js`.

`RDStation` está nos dois root layouts, incluindo `/experience`. Usa `next/script`
com `lazyOnload`, preservando as preferências de GA4/Clarity e a mesma guarda de host:
somente `semog.com.br` e `www.semog.com.br`. Localhost e preview não medem.
Confirmado no Next instalado, 16.2.6 (`dist/client/script.d.ts`), e na
[referência oficial de Script](https://nextjs.org/docs/app/api-reference/components/script).
Context7 não estava disponível nesta sessão.

A estratégia foi ajustada após medir o loader real: `lazyOnload` espera o evento
`load` e `requestIdleCallback`, com fallback `setTimeout`, conforme o código
instalado em `next/dist/client/script.js` e `request-idle-callback.js`. Esse ajuste
somente posterga a execução; não cria outra decisão de consentimento.

O padrão existente continua permitido sem decisão nova. A preferência existente
de análise ou marketing desligada impede o loader, inclusive antes de o provider
ler o cookie no mount. Revogar depois do carregamento recarrega a página, pois
remover a tag não encerra os listeners já instalados. Não há banner adicional.

**Limite de consentimento:** o recorte regional de EEA/Reino Unido/Suíça é feito
pelo próprio Google Consent Mode; esse protocolo não controla a RD. Como no
Clarity atual, a RD segue o padrão local e a escolha explícita do cookie
`semog-consent`, sem uma nova consulta geográfica. Não considerar que o `region`
do GA4 também bloqueia a RD. Isso deve ser considerado antes de ativar o loader
para público desses territórios.

## Formulários e prevenção de duplicação

Fonte primária consultada em navegador Chromium, pois a extração HTML da central
retornava somente o shell Salesforce:
[Integração de Formulários via Código de Monitoramento](https://ajuda.rdstation.com/s/article/Integra%C3%A7%C3%A3o-de-Formul%C3%A1rios-via-C%C3%B3digo-de-Monitoramento?language=pt_BR).

A RD captura automaticamente quando o código está instalado **e a integração
está ativa**. O artigo documenta a exclusão de campos com `data-sensitive`.
Aplicamos `data-sensitive="true"` aos controles de `Field`, `PhoneField` e aos
inputs próprios do Experience, incluindo todos os e-mails. Isso impede que a
biblioteca extraia um identificador e prepare a conversão. Os campos continuam
disponíveis à nossa Server Action e à integração própria com o CRM.

Antes de preencher a env real, no **RD Station Marketing → Converter → Integração
de formulário** (também acessível por Integrações): usar **Desativar integração**
para novos formulários e, para **cada formulário já integrado**, abrir **Ações
(⋮) → Interromper captura**, conferindo o status **CAPTURA INATIVA**. Desativar
a integração geral **não desliga os formulários já integrados**. Não ativar
formulários, pop-ups ou botão de WhatsApp da RD para substituir os do site.

O smoke injeta a
[biblioteca pública da própria RD](https://d335luupugsy2.cloudfront.net/js/integration/2.0.0/rd-js-integration.min.js)
em um loader de teste interceptado. Um controle sintético sem `data-sensitive`
prepara `RdIntegrationFormData`; com o atributo, não prepara nem tenta converter.
Isso confirma que o teste não passa apenas porque a biblioteca estaria inativa.
No modo sintético toda rede de terceiros é interceptada; no modo real os scripts
da RD são baixados, mas os endpoints de coleta/conversão são interceptados com
resposta local. No pageview, HTTP 200 com UUID sintético permite à própria
biblioteca gravar `rdtrk`; os demais coletores recebem 204. Nenhum teste cadastra
um lead RD.

No modo `RD_TEST_REAL_LOADER=true`, o mesmo smoke baixa e executa o loader real e
as bibliotecas reais da RD, sem interceptar essas respostas; apenas a aplicação
é servida do `next start` local. Confere respostas 200 das bibliotecas, CSP e
ausência dos valores preenchidos nas requisições RD. O backend continua isolado,
sem chave de conversões, e não há conversão de teste enviada à conta real.

## CSP

A documentação de instalação não publica uma allowlist completa de CSP. Os hosts
foram conferidos também diretamente nas bibliotecas públicas da RD, sem executar
um loader de outra conta:

| Diretiva | Host necessário | Fonte primária |
| --- | --- | --- |
| script-src | `d335luupugsy2.cloudfront.net` | loader e [Lead Tracking](https://d335luupugsy2.cloudfront.net/js/lead-tracking/stable/lead-tracking.min.js) |
| script-src | `d1sag09wwfbul8.cloudfront.net` | [RD Tracker](https://d1sag09wwfbul8.cloudfront.net/rdtracker/rdtracker.min.js) |
| connect-src, img-src | `pageview-notify.rdstation.com.br` | coletor `/send` no Lead Tracking |
| connect-src | `event-harbor.rdstation.com` | coletor `/events/track` no RD Tracker |
| connect-src | `popups.rdstation.com.br` | consulta de configuração feita pelo loader real, mesmo sem pop-up ativo |

O endpoint `event-api.rdstation.com.br` e o gateway `execute-api` da integração de
formulários continuam fora da CSP. Não foi liberado curinga global de CloudFront
ou de domínios RD. Consultar configuração de pop-up não significa publicar um.
O loader real foi inspecionado: integração automática de formulários não aparece
no seu código; Lead Tracking e RD Tracker estão presentes e ativos.

## Conversão pelo servidor: Opção B

O novo módulo `src/lib/rdMarketing/` usa a [API de conversões](https://developers.rdstation.com/reference/conversao)
(`POST /platform/conversions?api_key=…`), com segredo **apenas no servidor** em
`RD_MARKETING_API_KEY`. Sem a env, não consulta a fila, não faz HTTP, não agenda
`after()` e registra informação de envio desativado. A chave nunca entra no
snapshot, cliente, warning ou banco. Como a API a exige na query, os hooks
`beforeSend`, `beforeSendTransaction` e `beforeSendSpan` do Sentry Node removem
`api_key` também de erros, breadcrumbs e spans automáticos.

O snapshot é gravado no mesmo INSERT do lead **somente quando a API Key está
configurada naquele momento**. Sem chave (inclusive vazia/espaços), o snapshot
fica NULL e a linha nunca é elegível na fila, mesmo após configurar a chave:
**não há backfill desses pedidos**. O status padrão `pendente` sozinho não torna
a linha elegível; o predicado exige `rd_marketing_payload is not null`.
Só propostas e Contato com assunto
`proposta-comercial`, aprovados pela triagem, entram; usa a elegibilidade existente
`isExactEligible`. Atendimento, Experience, proposta rápida com `duplicaDe`,
gravação que falhou e opt-out de marketing ficam fora. Os identificadores são
`pedido-proposta-site` (inclusive proposta rápida) e `contato-site`.

O payload contém nome, e-mail quando informado, telefone/celular E.164, cidade,
cargo e condomínio/empresa quando existentes. A proposta rápida não pergunta
e-mail: a API aceita identificação por telefone, e nenhum e-mail é inventado.
`traffic_source`, `traffic_medium` e `traffic_campaign` vêm do primeiro toque já
validado por `resolverOrigem`; ausentes são omitidos.

`client_tracking_id` recebe o UUID do cookie `_rdtrk`, conforme o OpenAPI. Também
aceita o `id` do cookie `rdtrk` JSON utilizado pela biblioteca atual da RD.
Cookie inválido/ausente omite o campo; a conversão continua sem inventar vínculo
com uma navegação. Com opt-out de análise, o identificador não é enviado. A
preferência `semog-consent`, inclusive URI-encoded, vence o padrão regional.

As [bases legais da API](https://developers.rdstation.com/reference/evento-de-conversao-via-api-key)
aceitam `communications`, `legitimate_interest` e `granted`. Essa é a base
registrada, em coerência com o padrão existente do site; não afirmamos um
consentimento que o formulário não colheu. Não enviamos `available_for_mailing`,
`opportunity`, etapa do funil ou chamada ao CRM. A assinatura de mailing de um
contato existente não é modificada por essa integração.

### Execução, concorrência e falhas

Depois de lead gravado e e-mails processados, uma chamada isolada a
`agendarConversaoMarketing(leadRowId)` registra o envio no `after()` do Next. O
HTTP de Marketing executa após a resposta, separado do callback do CRM. Tanto
erros no agendamento como no processamento são best-effort; a fila persistida
permite recuperar o trabalho. Timeout HTTP: 5 segundos, sem retry interno.

Um UPDATE atômico reserva a linha antes do POST, incrementa a tentativa e protege
o envio por 30 minutos, sem segurar conexão durante HTTP. Após `200` com
`event_uuid` válido, grava `enviado`; chamadas repetidas/concorrrentes não enviam
novamente. `4xx` de validação/autorização é terminal (`erro`), com warning no
Sentry. `408`, `429`, `5xx`, rede, timeout ou resposta sem UUID válido são
`incerto`. Não salvamos corpo de erro que possa conter dados ou credenciais.

**Decisão expressa do coordenador nesta sessão:** diante de resultado incerto,
aceitar uma única nova tentativa depois de 30 minutos, no máximo **dois POSTs
por `cms.leads.id` no total**. Isso é entrega com repetição limitada, não garantia
de exatamente um evento remoto: se a primeira resposta se perdeu após a RD
aceitar, podem existir dois eventos. A API não documenta chave de idempotência;
`conversion_identifier` é o nome fixo do evento, não uma chave por lead.

O cron horário existente agenda `retentarConversoesMarketing()` depois da sua
resposta. Processa até três leads por execução para caber também no orçamento
do cron antigo de 60 segundos. Workers encerrados sem confirmação podem usar a
segunda tentativa após a proteção de 30 minutos; a segunda falha/encerramento
vira `esgotado`, sem terceiro POST. O cron não depende do estado de envio ao CRM
e suas falhas não alteram o resultado do CRM nem os e-mails.

### Painel: manter contato nativo, impedir negociação duplicada

Manter **ligada** a integração nativa RD Marketing ↔ RD CRM, conforme a Opção B.
A [ajuda oficial dessa integração](https://ajuda.rdstation.com/s/article/Como-integrar-o-RD-Station-Marketing-e-RD-Station-CRM?language=pt_BR)
explica que leads podem virar negociações automaticamente; por isso os eventos
do site precisam ficar fora de qualquer regra de criação de negociação.

- Em **Converter → Integração de formulário**, manter a captura desativada e
  interromper também eventuais formulários antigos já integrados.
- Nas configurações da integração nativa e em **Relacionar → Automação de Marketing**,
  não cadastrar regra/ação de **criar negociação** ou **marcar oportunidade** a
  partir de `pedido-proposta-site` ou `contato-site`.
- A negociação desses pedidos será criada exclusivamente pela integração própria
  da worktree `crm-rdstation-site`, nunca pela conversão deste módulo.
- Se forem criadas automações de e-mail para esses identificadores, configurar
  execução **apenas na primeira conversão**, para o retry incerto não duplicar
  comunicação. Não há automação de e-mail criada pelo código.
- Segundo o coordenador nesta sessão, **a captura de formulários está desativada
  e não existe automação na conta**; esse estado foi informado, não alterado por mim.

### Migração e pontos exatos de merge

Preparados `db/2026-11-04-rd-marketing.sql` e `.down.sql`, sem aplicar à Semog.
Só acrescentam colunas `rd_marketing_*` e índice parcial em `cms.leads`; não
alteram `crm_*`, `exact_*`, funções de token, roles ou acesso ao schema comercial.
Snapshots antigos e pedidos recebidos sem API Key ficam NULL, portanto não há
backfill de conversões históricas nem do período de integração desativada.
Executar a migração **conectado como `cms_user`**; ela aborta com mensagem clara
se `current_user` for outro usuário. A guarda segue o padrão das migrações locais
`2026-10-30-site-api-0-cms-user.sql`. Duplicados também são excluídos pelo
predicado `data->>'duplicaDe' is null`, independentemente do snapshot.

Ordem recomendada: migrações da frente semogapp necessárias ao CRM →
`2026-11-04-crm-provider.sql` → `2026-11-04-crm-config-site.sql` da worktree CRM →
`2026-11-04-rd-marketing.sql` desta worktree → deploy do código integrado →
configurar a API Key após conferir o painel. O SQL Marketing não depende das
colunas CRM, mas essa sequência facilita a revisão conjunta. **A migração vem
antes do código mesmo com a chave vazia**, pois o INSERT passa a usar a coluna
do snapshot. Rollback: retornar o código primeiro; só depois executar `.down.sql`.

No rebase sobre a frente CRM, manter as alterações dela e encaixar somente:

1. Em `submit-form.ts`: import dos helpers; propriedade `rdMarketing` em
   `LinhaDeLead`; sétima coluna/valor `$7` nos dois INSERTs; snapshot montado em
   `prepararLinha`; uma chamada `agendarConversaoMarketing(leadRowId)` em
   `concluirLeadGravado`, depois de `await enviarEmails(...)` e antes do retorno.
2. No handler **real** `src/app/api/cron/push-crm-leads/route.ts` da frente CRM:
   import e `agendarRetryMarketing()` depois de validar `CRON_SECRET`, antes do
   `try` do CRM. Neste checkout o handler ainda está em `push-exact-leads`, onde
   estão essas duas linhas; na rebase **não sobrescrever o reexport de compatibilidade**.
3. Em `concluirLeadGravado`, **manter os dois agendamentos**: o `after()` que
   envia ao CRM da outra frente **e** `agendarConversaoMarketing(leadRowId)`.
   Os callbacks e estados são independentes; não agrupar Marketing no `try` do CRM.
4. Manter `tests/int/rd-marketing-cron.int.spec.ts`: ele importa o GET pelo alias
   público `push-exact-leads`; após a junção, esse alias reexporta o GET de
   `push-crm-leads`, portanto o teste exercita o handler real. Ele exige retry
   uma vez com segredo válido e nenhum retry sem env/bearer ou com bearer errado.

### Pendências futuras de ativação

- O caminho Data API (`site_api`) **ainda não grava `rd_marketing_payload`**.
  O snapshot desta entrega é persistido pelo caminho pg existente; antes de
  migrar a persistência de leads para Data API, estender seu contrato e testes.
- A observabilidade de APIs externas da Vercel pode registrar a URL da chamada
  com `api_key` na query. Os hooks de Sentry não controlam esse produto da Vercel:
  **verificar captura/redação/acesso/retenção antes de ligar a credencial**.

## Política: antes e depois

Conteúdo estático em `content/legal/privacidade.mdx`, renderizado por
`content/pages/privacidade.ts`. Não há alteração a aplicar no admin ou banco.
A estrutura numerada e o aviso de revisão jurídica foram preservados.

Antes, item 1:

> Dados de navegação (páginas visitadas, dispositivo e cookies essenciais);

Depois:

> Dados de navegação (páginas visitadas, dispositivo, origem da visita e identificadores de cookies, incluindo cookies de rastreamento);

Antes, item 2: finalizava em “Melhorar a experiência do site e dos nossos canais digitais.”

Depois: acrescentada a finalidade “Realizar a gestão comercial, o relacionamento e ações de marketing, considerando as solicitações recebidas e a navegação no site.”

Antes, item 3: apenas a declaração geral sobre operadores de serviço.

Depois, texto adicional pronto no MDX:

> Entre esses operadores está a RD Station, empresa do grupo TOTVS, que fornece ferramentas de marketing e CRM. Para a gestão comercial, o relacionamento e o marketing, podem ser tratados nessas ferramentas os dados informados nos formulários (como nome, e-mail, telefone, cidade e informações do condomínio) e os dados de navegação coletados por cookies de rastreamento.
>
> O monitoramento da RD Station utiliza os cookies `__trf.src`, para registrar a origem da visita, e `rdtrk`, para acompanhar as páginas visitadas, inclusive antes de um contato ser identificado. Esses cookies têm duração de até um ano. Saiba mais nas [informações sobre cookies da RD Station](https://ajuda.rdstation.com/s/article/Orienta%C3%A7%C3%B5es-sobre-o-uso-de-cookies?language=pt_BR).

A data foi de agosto para novembro de 2026. Os nomes, funções e prazos dos cookies
foram confirmados no artigo oficial de cookies, aberto no navegador.

## Verificação local

- `pnpm install --offline --frozen-lockfile`: sucesso, sem mudar lockfile.
- `pnpm exec biome ci ./src ./tests ./scripts`: sucesso.
- `pnpm exec tsc --noEmit`: sucesso, usando o tsconfig do projeto.
- `pnpm run check:server-actions`: sucesso, 224 arquivos.
- `RD_MARKETING_TEST_DATABASE_URL=postgres://postgres@127.0.0.1:55479/rd_marketing_test`
  + `pnpm exec vitest run --config ./vitest.config.mts`: **73 arquivos, 848 testes passando**.
  Os cinco testes de concorrência/estado/ownership usam PostgreSQL 17 em Docker local
  isolado; sem a env são pulados na CI, que não disponibiliza esse banco.
  Os testes de payload/pipeline, cron autenticado e render rodam normalmente na CI.
- `pnpm build`: sucesso; iniciado com `pnpm start --port 3108`. O build do smoke
  usa a URL pública real da RD e `NEXT_PUBLIC_TURNSTILE_SITE_KEY` oficial de teste;
  o servidor usa `TURNSTILE_SECRET_KEY` de teste. A primeira repetição final sem
  a chave pública foi descartada, pois não exercitava o POST do formulário.
- `node scripts/verify-rd-tracking.mjs`: Chromium e Firefox reais; home, contato,
  Experience e política abrem; loader 1x; formulário faz POST com `next-action`
  para o próprio backend; nenhuma captura RD preparada; opt-out e localhost sem
  loader; revogação na política exercitada. As rotas são interceptadas para o
  servidor local, preservando o hostname de produção sem alterar a guarda.
- O backend de teste está com banco, SendGrid e Exact desabilitados. O formulário
  mostra o erro esperado de persistência; **não foi afirmado sucesso de cadastro,
  envio real de e-mail ou negociação no CRM**. O POST executa a Server Action do
  build real, não uma resposta de sucesso simulada.
- Screenshots completos inspecionados; página rolada e preferências acionadas.
  Revisão independente não foi executada: a tarefa determinou trabalho sem agentes auxiliares.

O teste real usa `$env:RD_TEST_REAL_LOADER='true'; node scripts/verify-rd-tracking.mjs`.
Em Chromium e Firefox: loader real e bibliotecas `lead-tracking.min.js` e
`rdtracker.min.js` responderam 200; home, contato e Experience sem violação CSP RD;
nenhuma requisição aos endpoints de conversão e nenhum valor sensível preenchido
apareceu nas requisições RD. O controle sintético com a biblioteca real continua
disponível no modo sem essa env, inteiramente interceptado.

**Impacto dos smokes anteriores na conta:** antes da instrução de interceptar
também a navegação, o loader real enviou eventos de visita dos quatro caminhos
`/`, `/contato`, `/experience` e `/privacidade`. O coordenador confirmou quatro
páginas registradas no Lead Tracking; são tráfego de teste, não contatos reais.
Foi observada resposta 200 de `pageview-notify/send` e gravação dos cookies
`rdtrk`/`__trf.src` no Chromium. Os harnesses agora interceptam `pageview-notify`,
`event-harbor` e endpoints de conversão: a validação restante verifica a tentativa
de evento e os cookies (com UUID de resposta sintética) sem acrescentar visitas à conta. Nenhuma conversão real
foi disparada; o backend de teste não tem credencial Marketing.

Logs desta rodada em `%TEMP%/rd-marketing-final-checks.log`,
`rd-marketing-final-build.log` e `rd-real-browser-final.log`; os testes do payload
interceptam `fetch` estritamente, e nenhuma API Key real foi usada.
O container PostgreSQL de teste e o servidor local foram encerrados depois das
verificações; nenhum recurso do banco Semog foi criado ou removido.

Rodada das ressalvas (sem nova revisão independente): o PostgreSQL descartável
também executou **o arquivo SQL real apenas na fixture local**, confirmou erro
claro conectado como `postgres` e sucesso com `current_user = cms_user`.
`rd-marketing-submit` verifica o snapshot NULL sem chave e o snapshot elegível com
chave. `rd-marketing-cron` verifica autorização e o agendamento do retry no GET
real via alias público. `rd-sensitive-render` verifica o atributo no DOM de todos
os controles das três variantes Field, do telefone e dos cinco inputs Experience.

Provas de mutação, todas restauradas byte a byte antes dos portões finais:

- Remover **a chamada** `agendarRetryMarketing()`: 1 teste falha, 3 passam.
- Remover `data-sensitive="true"` só de Field: 1 teste falha, 2 passam.
- Remover o atributo só de PhoneField: 1 teste falha, 2 passam.
- Remover o atributo só de ExperienceForm: 1 teste falha, 2 passam.

Logs `%TEMP%/rd-mutation-{retry,field,phone,experience}.log`, `rd-review-db.log`,
`rd-review-ci.log` e `rd-review-build.log`; a suíte integral posterior está verde.
O build final também foi iniciado novamente em `next start --port 3108` e
`GET /privacidade` respondeu 200; a requisição HTTP não executou scripts/coleta RD.

### Lighthouse

Lighthouse 13.6.0, Chrome headless 156, perfil mobile padrão, mesma máquina, home
em `next start`, três execuções por versão:

| Versão | Performance (3 execuções; mediana) | LCP ms (3 execuções; mediana) | TBT mediano ms |
| --- | --- | --- | --- |
| Controle sem executar loader | 96/96/96; **96** | 1990,49/1988,59/1988,32; **1988,59** | 84,5 |
| Loader real, afterInteractive | 74/96/77; **77** | 5967,86/1988,98/5133,79; **5133,79** | 90 |
| Loader real, lazyOnload | 95/96/96; **96** | 1990,90/1989,49/1988,53; **1989,49** | 94 |
| Loader real, load + idle explícito | 95/96/96; **96** | 1993,95/1988,58/1988,31; **1988,58** | 74 |

**Escolha: lazyOnload.** As duas alternativas esperam `load` e idle, com fallback
de 1 ms; atingiram a meta de pelo menos 93 e LCP próximo ao controle. A diferença
de menos de 1 ms entre medianas de LCP não é material; `lazyOnload` usa a API
suportada do Next e dispensa código próprio de agendamento/limpeza. Não há espera
arbitrária longa para esconder o script do Lighthouse. O trio isolado de
`lazyOnload` substitui uma primeira rodada com breve sobreposição de smoke.

Método reproduzível: `scripts/lighthouse-rd-real.mjs`, com `LIGHTHOUSE_CLI`
apontando ao `lighthouse/cli/index.js` instalado via pnpm dlx. Proxy local stream
preserva compressão/Range/mídia. Somente a cópia em memória dos chunks RD troca a
entrada `window.location.hostname` pelo host de produção, ativando o loader real;
o bundle no disco e a guarda versionada não mudam. Outras tags ficam inativas,
igualmente em todas as variantes. O controle intercepta apenas o loader vazio
(`RD_LIGHTHOUSE_CONTROL=true`). As bibliotecas RD reais responderam 200 em todas
as execuções. A navegação Lighthouse é localhost e não prova registro válido na
conta (o endpoint retornava 400); a prova de visita foi feita no smoke com host
real, descrita acima. A versão atual do harness também intercepta esses eventos.

JSON preservados em `%TEMP%/rd-{control,afterInteractive,lazy,idle}-lighthouse-{1,2,3}.json`.
Logs `rd-control-lighthouse.log`, `rd-real-lighthouse.log`,
`rd-lazy-isolated-lighthouse.log` e `rd-idle-lighthouse.log`. A rodada idle já
havia terminado quando chegou a instrução de bloquear coleta; não houve nova
rodada depois dela. Não foi necessária repetição por mudança no painel.

Rede por módulo (uma execução afterInteractive; bytes transferidos): loader
1947 B; lead-tracking 1690 B; traffic-source-cookie 1493 B; rdtracker 1716 B;
**rdstation-popup.min.js 58719 B** (211478 B descomprimidos); consulta
`popup/show.json` 322 B. Nenhuma fonte/CSS/chat/WhatsApp RD foi observada nessa
amostra. Segundo verificação do painel comunicada pelo coordenador, não existem
pop-up, WhatsApp, Web Push ou banner de cookies ativos, e não existe opção para
impedir o loader de baixar a biblioteca de pop-ups. Manter esses recursos
desativados; a melhora obtida aqui vem do agendamento.

Histórico anterior à medição real: a home com guarda local, sem executar RD,
teve 86/86/86 (LCP mediano 3188,93 ms) antes e 85/85/85 (3189,24 ms) depois.
JSON `%TEMP%/rd-before-{1,2,3}.json` e `rd-after-final-{1,2,3}.json`. Esse histórico
usa outro mecanismo de navegação e **não estima o custo RD**; a comparação válida
para a escolha é o controle equivalente de 96 na tabela acima.

## Pendências antes da ativação

Integrar esta branch após a frente CRM, aplicar as migrações na ordem documentada,
configurar a API Key de servidor e conferir as regras do painel antes de ativá-la.
A captura e as automações já estão desativadas conforme informação do coordenador;
a URL real e a prova nos dois navegadores foram recebidas/concluídas nesta rodada.
Conferir também o limite regional do loader descrito acima, que a conversão pelo
servidor não altera. Não houve commit, publicação nem alteração no banco Semog.

## Arquivos alterados

- `.env.example`: exemplo com URL pública real e API Key de servidor vazia.
- `src/components/analytics/RDStation.tsx`: loader, preferências e encerramento por reload.
- `src/components/analytics/measurableHost.ts`: regex compartilhada com as tags atuais.
- `src/app/(frontend)/layout.tsx` e `src/app/(evento)/layout.tsx`: montagem da tag.
- `next.config.ts`: fontes CSP de script e navegação da RD.
- `src/components/forms/{Field,PhoneField,ContactForm,PropostaForm,ExperienceForm}.tsx`:
  exclusão de campos da captura automática.
- `content/legal/privacidade.mdx`: política pronta, com diff descrito acima.
- `tests/int/rd-station.int.spec.tsx`: ausência/configuração inválida, host e opt-out inicial.
- `scripts/verify-rd-tracking.mjs`: smoke reproduzível nos dois navegadores e controle
  da captura com a biblioteca pública da RD.
- `scripts/lighthouse-rd-real.mjs`: medição do loader real com condição de host de
  produção apenas no bundle servido em memória, sem alterar o código versionado.
- `src/lib/rdMarketing/{payload,client,fila,sentry}.ts`: snapshot, HTTP, fila/retry e
  redação de credencial na observabilidade.
- `src/app/(frontend)/_actions/submit-form.ts`: persistência do snapshot e chamada
  isolada de agendamento após os e-mails.
- `src/app/api/cron/push-exact-leads/route.ts`: chamada isolada do retry; mover para
  o handler `push-crm-leads` na rebase, preservando o alias da frente CRM.
- `src/sentry.server.config.ts`: hooks de redação de `api_key`.
- `db/2026-11-04-rd-marketing.sql` e `.down.sql`: migração e reversão não aplicadas.
- `tests/int/rd-marketing{,-submit,-db}.int.spec.ts`: payload, fluxo e concorrência;
  dois testes existentes atualizados para novo import/parâmetro do INSERT.
- `tests/int/rd-marketing-cron.int.spec.ts` e `rd-sensitive-render.int.spec.tsx`:
  retry autenticado pelo handler público e exclusão de captura no DOM real.
- `docs/rd-station.md`: este relatório, fontes, limitações e ativação no painel.
