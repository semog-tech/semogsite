# Configuração RD administrada no semogapp — 04/11/2026

Implementação local sobre a integração CRM já existente neste worktree. Sem commit,
push, deploy, aplicação de migração ou alteração no worktree do semogapp.

## Contrato confirmado

Foram lidos a migração 2026-11-04-crm-rdstation-config.sql e os módulos de configuração
do worktree crm-rdstation-app. Como a documentação ainda descrevia envs, o formato foi
confirmado com o coordenador antes de codificar:

- JSON plano com schema_version=1; version é o contador de edição, independente do schema.
- pipeline_id, entry_stage_id, source_site_id, source_anuncio_id, campaign_site_id,
  campaign_anuncio_id, distribution_rule, unidades_por_cidade, custom_fields,
  updated_by e updated_at.
- Aliases canônicos: id_lead_site, unidade_semog, utm_source, utm_medium, utm_campaign,
  utm_term, utm_content, gclid, tipo_clique, pagina_entrada e dados_proposta.
- Fonte, campanha e distribuição NULL são omitidas do POST. Os outros aliases podem
  estar ausentes; id_lead_site é obrigatório. Pipeline/etapa ausentes ou JSON inválido
  são erro explícito, sem fallback; schema_version desconhecida também falha fechado.

## Entrega

- Fachada cms.crm_rdstation_config_obter(), SECURITY DEFINER, dono postgres,
  search_path vazio e EXECUTE apenas para cms_user entre os roles de runtime.
  O site continua sem USAGE ou EXECUTE direto em commercial. A migração repete a
  varredura de funções, relações, colunas e sequences contra privilégios inesperados.
- Inverso escrito antes do avanço: db/2026-11-04-crm-config-site-postgres.down.sql; avanço
  em db/2026-11-04-crm-config-site-postgres.sql (antes `crm-config-site.sql`). Nenhum foi aplicado.
- src/lib/crm/rdstation/load-config.ts lê a fachada pelo pool, valida o contrato e
  mantém cache por instância durante 60s. Leituras concorrentes compartilham a promise.
- NULL usa envs legadas. Erro de RPC usa última configuração boa, mesmo expirada,
  ou envs na instância sem cache, e registra Sentry. O fallback também ganha TTL de
  60s para evitar consultas repetidas enquanto o banco está indisponível.
- JSON recebido com versão desconhecida, pipeline/etapa ausentes, id_lead_site ausente,
  campos desconhecidos ou slugs inválidos/repetidos não usa fallback. O fluxo de envio
  grava o erro/Sentry e mantém o lead pendente para retry, sem erro para o visitante.
- push-lead.ts passou a aguardar obterConfigRd(). O mapa converte valores do banco
  para o payload existente; optional fields não geram chaves “undefined”.
- docs/DEPLOY.md e .env.example descrevem configuração administrativa, TTL, fallbacks,
  validação e ordem de implantação. RD_CRM_* é fallback, não a configuração principal.

## Evidência de testes

tests/int/rdstation-config.int.spec.ts exercita a leitura real com query dublado:
NULL→env, precedência do banco, expiração exata em 60s, versão desconhecida mesmo com
cache anterior, configuração incompleta/extra, erro de RPC com e sem cache, nullable
source/campaign/distribution omitidos e erro de versão no fluxo real de envio/Sentry.

O teste de atualização de slug começa com configuração cacheada, simula version=2,
avança 60s e verifica tanto RDQL com o novo id_lead_site quanto o POST do deal com
os novos slugs de ID/UTM, usando fetch estrito. Os testes antigos de API/payload
continuam cobrindo esse escopo com a fronteira de configuração dublada; a integração
com configuração real é exercitada pelo novo arquivo.

Mutação reproduzível: node scripts/test-crm-config-mutations.mjs. Resultado:

| Caso | Resultado |
|---|---|
| Baseline | exit 0 |
| Remover fallback env quando RPC devolve NULL | DERRUBADA; Vitest exit 1 no teste de configuração |
| Remover fallback cache/env quando RPC falha | DERRUBADA; Vitest exit 1 no teste de configuração |

Runner terminou exit 0 e restaurou o arquivo original em finally. Log:
%TEMP%/semogsite-crm-config-mutacoes.log. Nenhuma mutação permaneceu no código entregue.

## Portões finais

Comandos de .github/workflows/ci.yml, com pnpm 10.12.4:

| Comando | Resultado | Exit |
|---|---|---|
| pnpm install --frozen-lockfile | Lockfile is up to date; Already up to date | 0 |
| pnpm exec biome ci ./src ./tests ./scripts | Checked 326 files; No fixes applied | 0 |
| pnpm exec tsc --noEmit | Sem diagnóstico | 0 |
| pnpm run check:server-actions | OK — nenhum export de tipo em módulo use server (229 arquivos) | 0 |
| pnpm exec vitest run --config ./vitest.config.mts | 71 arquivos; 895 testes passaram; 28.76s | 0 |
| pnpm build | Compiled successfully in 5.1s; TypeScript 7.1s; 26/26 páginas estáticas | 0 |
| git diff --check | Sem diagnóstico | 0 |

NODE_OPTIONS=--no-deprecation no Vitest, como a CI; sem reduzir workers. Log completo:
%TEMP%/semogsite-crm-config-ci.log. Build final em %TEMP%/semogsite-crm-config-build.log.

Smoke do build com pnpm start --port 3139: Next.js 16.2.6 iniciou em 234ms;
curl em 127.0.0.1 retornou home=200, cron neutro=401 e alias Exact=401,
sem credenciais nem processamento da fila. Processo encerrado intencionalmente
após a verificação; não houve chamada autorizada ao CRM nem escrita no banco.

Node local 22.15.0; workflow usa Node 24. Avisos ambientais já existentes: token de
GitHub Packages ausente no .npmrc, @sentry/cli com script de build ignorado, Sentry
disableLogger depreciado e ausência local de auth token/source maps, metadataBase
e Turnstile. Nenhuma nova dependência foi instalada.

Context7 indisponível; usados contrato primário do semogapp confirmado pelo coordenador,
Zod instalado 4.4.3 e documentação oficial https://zod.dev/api (schemas estritos,
partial/required e timestamps com offset). Não houve mudança visual de interface.

## Implantação e pendências

Aplicar, com autorização, as migrações de provedor e configuração do semogapp primeiro;
depois as migrações do site de provedor e fachada de configuração; só então o deploy
do site. A tabela pode ficar vazia durante a transição com envs válidas. Sem banco/cache
e sem envs válidas o envio falha de forma visível à operação e permanece na fila.

[A CONFIRMAR na conta real] IDs/slugs/opções, distribuição/etapa, scopes e funcionamento
das funções após a aplicação autorizada; atualização pelo admin aparecendo nas instâncias
do site em até 60s e recebimento dos alertas. Nenhuma chamada ao CRM real foi feita pelos
testes; criação externa e publicação continuam pendentes da autorização prevista.
