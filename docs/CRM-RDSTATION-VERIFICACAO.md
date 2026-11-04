# RD Station CRM v2 — rodada final (04/11/2026)

Alterações locais sobre c7a492a, sem commit, push, deploy ou aplicação de migração.
Nenhuma nova revisão independente foi disparada nesta rodada: o coordenador confere os
portões e as mutações, conforme a tarefa final.

## Resultado final

- Fonte única em src/lib/crm/queue.ts: ESPERA_CONCILIACAO_MS, MAX_TENTATIVAS_CRM,
  LEASE_CRM_MS e backoffCrm. Reserva, agendamento antes do POST, conclusão e registro de
  falha recebem os valores como parâmetros SQL; não há intervalo/teto/backoff duplicado
  em literal no SQL de send-lead.ts. O predicado SELECT/reserva também recebe o teto.
- Reservar só grava o lease e a referência do provedor. O contador sobe antes do envio
  Exact ou POST RD; falha anterior ao envio também é contada, uma vez. Conciliação que
  encontra card, incluindo negociação ainda não salva localmente, não incrementa tentativas.
- Duplicado e esgotado são estados terminais, excluídos do SELECT e da decisão pura.
  UPDATE condicional grava o estado, limpa lease/conciliação e retorna a linha somente
  na primeira transição; só essa transição emite Sentry error. Nada é apagado.
- No teto, uma última busca RDQL ainda pode recuperar o card. Se não encontrar, encerra
  em esgotado, inclusive quando havia um ID confirmado anteriormente e o card desapareceu.
- Falha do Exact não grava crm_deal_id nem status enviado. personError é warning: o card
  já existe. DEPLOY.md documenta o novo backoff também no Exact e a resolução manual
  dos estados terminais, preservando o provedor e conferindo os CRMs antes de liberar retry.
- Permanecem as correções anteriores: Outra cidade sem Unidade; contato mais antigo com
  warning em caso de duplicidade; token read-only via fachada privada cms, sem USAGE em
  commercial; HTTP 8s; CRM em after(), fora da resposta; backoff por próxima tentativa;
  conciliação depois de 48h; marca anterior preservada se recriação receber 401/429.

## Prova das seis mutações

Runner reproduzível: `node scripts/test-crm-mutations.mjs`. Ele verifica baseline verde,
aplica cada mutação individualmente em send-lead.ts e exige AssertionError no teste
crm-provider.int.spec.ts; erro de inicialização/timeout não conta como mutação derrubada.
Restaura o conteúdo original em finally. Não executar com outro escritor sobre esse arquivo.

| Mutação adaptada ao código com parâmetros | Resultado |
|---|---|
| M4: janela enviada à reserva dividida por dois | Vitest exit 1; AssertionError |
| M5: teto enviado à reserva aumentado em um | Vitest exit 1; AssertionError |
| M9: antesDoPost deixa conciliação NULL | Vitest exit 1; AssertionError |
| M10: duração do lease enviada à reserva dividida por dois | Vitest exit 1; AssertionError |
| M23: falha Exact retorna card fictício e conclui como sucesso | Vitest exit 1; AssertionError |
| M25: duração de backoff no registro de falha vira zero | Vitest exit 1; AssertionError |

Baseline: exit 0. Runner completo: exit 0, seis mutações derrubadas, nenhuma sobrevivente.
Log local: %TEMP%/semogsite-crm-mutacoes.log. Os testes também fixam os contratos de
30min/5 tentativas/lease de 5min e afirmam os parâmetros e os placeholders SQL reais.

## PostgreSQL real — somente SELECT sintético

db/tests/crm-fila.select.sql foi ampliado para 35 cenários. O predicado e os parâmetros
vieram da função/constantes TS e de backoffCrm(3); só CTEs com dados sintéticos foram
consultadas. Resultado do PostgreSQL: `cenarios:35; todos_passaram:true; falhas:null`.

Inclui os dois provedores, teto, lease, backoff, conciliação fora de 48h, estados terminais,
fronteiras de 29:59/30:00, agendamento, duração de lease e backoff calculado. Nenhuma proposta
real foi consultada ou escrita nesse ensaio. UPDATE/locks e a migração não foram executados
pelo worker no banco remoto; o coordenador informou já ter validado produção em Postgres 17.

## Portões e limites

Comandos de .github/workflows/ci.yml, no projeto, com pnpm 10.12.4:

| Comando | Saída final | Exit |
|---|---|---|
| pnpm install --frozen-lockfile | Lockfile is up to date; Already up to date | 0 |
| pnpm exec biome ci ./src ./tests ./scripts | Checked 323 files; No fixes applied | 0 |
| pnpm exec tsc --noEmit | Sem diagnóstico | 0 |
| pnpm run check:server-actions | OK — nenhum export de tipo em módulo use server (228 arquivos) | 0 |
| pnpm exec vitest run --config ./vitest.config.mts | Test Files 70 passed; Tests 883 passed; Duration 29.62s | 0 |
| pnpm build | Compiled successfully in 22.8s; TypeScript 15.1s; 26/26 páginas | 0 |
| git diff --check | Sem diagnóstico | 0 |

O Vitest final usou NODE_OPTIONS=--no-deprecation, como a CI, sem reduzir workers.
Log: %TEMP%/semogsite-crm-ultima-ci.log; build em %TEMP%/semogsite-crm-ultimo-build.log.
Servidor final iniciou em 684ms com pnpm start --port 3139. HTTP real: home 200, cron neutro
401 e alias Exact 401 sem autorização. O processo foi encerrado depois das respostas;
nenhuma submissão de formulário nem envio a CRM/banco real foi disparado pelo smoke.

Node local 22.15.0; o workflow roda Node 24. Avisos ambientais conhecidos continuam:
token de GitHub Packages ausente no .npmrc, build script de @sentry/cli ignorado,
disableLogger depreciado e ausência local de Sentry auth token/source maps,
metadataBase e Turnstile. Sem nova dependência adicionada.

## Arquivos desta rodada

- src/lib/crm/{queue,send-lead}.ts; src/lib/crm/rdstation/push-lead.ts.
- src/app/api/cron/push-crm-leads/route.ts.
- db/2026-11-04-crm-provider.sql (depois dividida em `-1-cms-user` e `-2-postgres`); db/tests/crm-fila.select.sql.
- tests/int/{crm-provider,crm-queue,cron-exact,rdstation}.int.spec.ts;
  tests/int/helpers/lotacaoExperience.ts.
- scripts/test-crm-mutations.mjs; docs/DEPLOY.md e este relatório.

O diff também contém os arquivos da implementação e das correções anteriores;
src/lib/exact/* segue sem edição. Nenhum segredo foi adicionado ao bundle.

## Ordem de implantação e pendências reais

O catálogo informado pelo coordenador confirma que commercial.crm_rdstation_token_obter
ainda não existe. Aplicar a migração do semogapp primeiro, depois a aditiva do site, depois
o deploy do site. cms_user é dono de cms.leads; fachada de token em cms tem dono postgres,
search_path vazio, revokes explícitos e EXECUTE só para cms_user. Não conceder USAGE em
commercial. A migração verifica funções, relações, colunas e sequences antes de concluir.

[A CONFIRMAR na conta real] IDs/slugs/opções, etapa/distribuição, fontes/campanhas, scopes
OAuth, manutenção/renovação do token pelo app e recebimento dos alertas Sentry/Vercel.
Ensaio com criação real, aplicação das migrações e publicação exigem a autorização prevista;
CRM_PROVIDER permanece exact até a virada autorizada.
