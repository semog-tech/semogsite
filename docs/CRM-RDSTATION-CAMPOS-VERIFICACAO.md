# Campos RD: evidência da implementação — 04/11/2026

Escopo: referências por ID ou slug, campos estruturados e exemplos reais da conta.
Sem commit/push/deploy, aplicação de migração ou chamada ao CRM real.

## Fontes e decisões

Lido somente o arquivo de IDs solicitado da memória do semogapp. IDs reais da conta
foram colocados como exemplos comentados, não como constantes do código. Context7
indisponível; conferidas a documentação primária e a especificação OpenAPI embutida
na página oficial de custom_fields:

- https://developers.rdstation.com/reference/crm-v2-list-custom-fields
- https://developers.rdstation.com/reference/crm-v2-rdql-filtering
- https://developers.rdstation.com/reference/crm-v2-create-deal

O catálogo expõe ID e slug; CustomFields declara slug como chave do payload e RDQL
exige @slug. O site aceita os dois formatos na configuração; para ID busca o catálogo
de deal, percorre páginas e resolve o slug, com cache de 60s. Não deriva slug do nome
nem envia @ID. ID ausente, entidade incorreta, slug inválido ou colisão de referências
interrompem antes de marcar/criar card. Erros propagam ao tratamento existente da fila.

Contrato ampliado e aprovado pelo coordenador (msg_db9408b8f588): schema_version=1
mantido; aliases opcionais quantidade_unidades/tipo_condominio/participacao; todo campo
aceita hash de 24 hex ou slug; opcoes_campos opcional com mapas tipo_condominio e
participacao, ambos valor-do-form → opção exata do RD. Fallback env correspondente:
RD_CRM_OPCOES_CAMPOS; default de participação atualizado abaixo. O semogapp também expõe aliases opcionais
funcionarios/elevadores/valor_taxa/taxa_extra/ja_cliente/cidade/cnpj; aceitos para
compatibilidade de leitura, sem preenchimento inventado no payload do formulário.

Quantidade de unidades vira número JSON inteiro positivo seguro. Valores inválidos
não viram zero ou número parcial e permanecem no texto. Escolhas exigem equivalência
configurada; sem mapa ou sem alias ficam ausentes no campo e preservadas em dados_proposta.
Não inferir Vertical/Horizontal a partir de residencial/comercial: o form atual não
coleta geometria. Dados já enviados em campos próprios não se repetem no texto residual;
mensagem e demais campos sem destino continuam preservados.

## Arquivos desta etapa

- src/lib/crm/rdstation/config.ts: referências ID/slug e contrato ampliado.
- src/lib/crm/rdstation/resolve-fields.ts: catálogo paginado, cache e validação.
- src/lib/crm/rdstation/push-lead.ts: resolução antes da busca RDQL e do POST.
- src/lib/crm/rdstation/map-lead.ts: campos estruturados e texto residual.
- tests/int/rdstation-fields.int.spec.ts: 33 testes, incluindo os 14 novos desta rodada.
- .env.example: funil, etapa, fontes, campanhas, 14 campos reais comentados e mapa de opções.
- docs/DEPLOY.md: contrato e roteiro completo do primeiro ensaio autorizado.

Mudanças anteriores na worktree foram preservadas. Nenhuma nova migração necessária:
a fachada existente devolve JSON e a extensão usa apenas propriedades opcionais.

## Testes

Fetch estrito registra violações separadamente e cada teste HTTP exige zero violações;
um expect lançado no dublê não desaparece dentro do catch do cliente HTTP.

Cobertura: IDs/slugs e aliases opcionais no env e no banco; mapa de opções opcional e
inválido; número válido e cinco inválidos; escolhas válidas/sem equivalência; campo sem
alias preservado no texto; resolução ID→slug no payload e no filtro real de idempotência;
card existente sem POST; catálogo sem campo/slug/entidade correta; paginação sem seguir
URL externa; cache antes e exatamente aos 60s; colisão ID+slug do mesmo campo.

## Portões

Comandos exatos de .github/workflows/ci.yml; Node local 22.15.0, CI usa 24;
pnpm 10.12.4. Saídas finais registradas após o último ajuste de compatibilidade.

| Comando | Resultado | Exit |
|---|---|---|
| pnpm install --frozen-lockfile | Lockfile is up to date; Already up to date | 0 |
| pnpm exec biome ci ./src ./tests ./scripts | Checked 328 files; No fixes applied | 0 |
| pnpm exec tsc --noEmit | Sem diagnóstico | 0 |
| pnpm run check:server-actions | OK; 230 arquivos | 0 |
| pnpm exec vitest run --config ./vitest.config.mts | 72 arquivos; 914 testes passaram; 35.87s | 0 |
| pnpm build | Compiled successfully in 5.8s; TypeScript 6.9s; páginas 26/26 | 0 |
| git diff --check | Sem diagnóstico | 0 |

NODE_OPTIONS=--no-deprecation no Vitest, como a CI. Logs completos em
%TEMP%/semogsite-rd-fields-ci.log e %TEMP%/semogsite-rd-fields-build.log.
Avisos ambientais existentes: GITHUB_PACKAGES_TOKEN não configurado no .npmrc;
script de @sentry/cli ignorado; configuração Sentry depreciada/source maps sem auth;
metadataBase e Turnstile ausentes no ambiente local. Sem dependência nova.

Smoke final com pnpm start --port 3139: Next.js 16.2.6 Ready in 259ms;
home=200, cron neutro=401, alias Exact=401 via curl com limite de 8s;
sem autenticar cron/processar fila. Processo encerrado intencionalmente após o check.

## Pendências reais

[A CONFIRMAR com token, antes da virada] os 14 pares ID/slug e os tipos/opções da conta;
aceitação de número JSON e representação dos campos multiple_choice. O schema genérico
CustomFields do OpenAPI declara valores string, apesar de listar campos do tipo number;
o teste local prova o payload solicitado, não a aceitação pela conta real. Roteiro de
listagem, envio, releitura e idempotência consta em DEPLOY.md.

As sete opções exatas foram recebidas e os testes passaram a usar os textos reais:
Sindico Morador; Sindico Profissional; Sub - Síndico; Conselheiro; Condômino;
Construtora; Outros. Tipo: Vertical/Horizontal; taxa_extra e ja_cliente: Sim/Não.

## Atualização: default de participação aprovado

Lidos os cinco cargos reais de src/lib/form-schemas.ts; teste compara o inventário para
detectar mudança futura do formulário. Defaults no banco e env quando participação
está ausente: Conselheiro(a)→Conselheiro; Morador(a)→Condômino;
Incorporador(a) / Construtora→Construtora (decisão expressa do coordenador,
msg_3f7b3814a82e); Outro→Outros. Síndico(a) permanece sem opção e no texto residual,
pois o formulário não distingue morador/profissional. Cargo desconhecido não vira Outros.
Nenhum mapa default de tipo_condominio: o form não informa Vertical/Horizontal.

Um mapa explícito substitui o default inteiro; participacao:{} o desliga. Tanto
opcoes_campos ausente quanto {} usam o padrão; tipo_condominio isolado não desliga
participação. Testes validam os cinco cargos, as sete opções exatas sem normalização,
mapa explícito e vazio, texto residual e banco com mapas ausentes/vazios.
Testes antigos que usavam o valor inexistente Síndico foram corrigidos para Sindico Morador.
Saídas finais desta rodada (a tabela anterior preserva a rodada anterior):

| Comando | Resultado | Exit |
|---|---|---|
| pnpm install --frozen-lockfile | Lockfile is up to date; Already up to date | 0 |
| pnpm exec biome ci ./src ./tests ./scripts | Checked 328 files; No fixes applied | 0 |
| pnpm exec tsc --noEmit | Sem diagnóstico | 0 |
| pnpm run check:server-actions | OK; 230 arquivos | 0 |
| pnpm exec vitest run --config ./vitest.config.mts | 72 arquivos; 928 testes passaram; 36.63s | 0 |
| pnpm build | Compiled successfully in 8.2s; TypeScript 10.3s; páginas 26/26 | 0 |
| git diff --check | Sem diagnóstico | 0 |

Logs: %TEMP%/semogsite-rd-opcoes-ci.log e %TEMP%/semogsite-rd-opcoes-build.log.
Nenhuma dependência nova, migração, commit, push ou publicação nesta rodada.
Smoke do build: Ready in 223ms; home=200, cron neutro=401 e alias Exact=401;
servidor encerrado intencionalmente depois, sem autenticar cron nem processar a fila.

## Atualização: opção vazia significa Não preencher

Contrato do editor Tahoe 0.97: string vazia em opcoes_campos é aceita no banco e no
fallback env; o valor é preservado na configuração, não aciona um default e omite o
campo no RD. O texto original permanece em dados_proposta. Chave ausente num mapa
explícito mantém o comportamento anterior (sem mesclar padrões por cargo).

Mudança de produção restrita à validação dos valores de mapa (permite string de
comprimento zero, mantendo máximo de 120 e chaves não vazias). O mapeamento já omitia
valor vazio e preservava o texto residual; agora esse caminho também passa na leitura.

Testes: Síndico(a) com vazio; Morador(a) com vazio para provar que não usa Condômino
como default; ambos com chave ausente; leitura pelo banco com participação e tipo
vazios, campo omitido e resposta residual preservada. Arquivo focado: 36 testes passaram.
Antes da correção, três falhas confirmaram a rejeição do vazio; nessa execução inicial
houve também timeout transitório no teste antigo de catálogo, que passou em 975ms na
execução seguinte sem alterar timeout ou configuração de execução.

| Comando | Resultado | Exit |
|---|---|---|
| pnpm install --frozen-lockfile | Lockfile is up to date; Already up to date | 0 |
| pnpm exec biome ci ./src ./tests ./scripts | Checked 328 files; No fixes applied | 0 |
| pnpm exec tsc --noEmit | Sem diagnóstico | 0 |
| pnpm run check:server-actions | OK; 230 arquivos | 0 |

Portões restantes desta rodada: `pnpm exec vitest run --config ./vitest.config.mts`
passou com 72 arquivos, 931 testes e duração de 40.91s (exit 0); `pnpm build`
passou com Compiled successfully in 11.1s, TypeScript 12.3s e páginas 26/26 (exit 0).
`git diff --check` sem diagnóstico (exit 0). Sem nova dependência ou mudança de API externa.

Logs desta rodada: %TEMP%/semogsite-rd-vazias-ci.log e
%TEMP%/semogsite-rd-vazias-build.log. Sem commit/push/deploy ou migração aplicada.

Publicação e teste externo permanecem com o coordenador/dono.
