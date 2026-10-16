# Site v2 · Fase 4 (institucional): plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** pôr de pé, atrás da rota de prévia e sem mudar nenhuma URL do site no ar, as páginas institucionais do site v2 (home, A Semog, Gestão, Garante, Incorporadoras, Tecnologia, `/solucoes` portada, proposta, contato e a 404 nova) no visual e no movimento do protótipo, com o "Sou cliente" (2ª via e atendimento ao condômino) no cabeçalho, no rodapé e no Contato, nenhum WhatsApp de proposta, o NAP com fonte única e teste de consistência, as respostas do Leandro às 31 pendências de conteúdo aplicadas, e os dois redirects 308 para `/tecnologia` prontos para entrar na virada.

**Architecture:** o mesmo padrão da fase 3. As rotas moram em `src/app/(site)/(app)/previa-v2/...` e `src/app/(site)/(landing)/previa-v2/...` (404 em produção, `noindex`, canonical da URL real) e só decidem prévia e metadata; o corpo de cada página é uma função de `src/site/paginas/*.tsx`, para a virada (fase 5) só criar as rotas reais com o mesmo corpo. As seções viram Server Components portados da parcial HTML do protótipo e as cenas viram módulos TS portados de `init(ctx)`, pela receita da seção "Receita da porta"; um teste de paridade compara classes, ids e `data-*` de cada seção renderizada com a parcial do protótipo, e o verificador compara os quadros no navegador. Cada página tem a própria lista de cenas num módulo client (`src/site/cenas/paginas/*.tsx`), para o bundle de uma página não carregar as cenas das outras. O pacote `landing` (proposta, contato, 404) nasce nesta fase, sem Lenis nem runner.

**Tech Stack:** Next 16.2.6 (App Router, route groups, `not-found.tsx`, `error.tsx` com `unstable_retry`), React 19.2.6, TypeScript 5.7 estrito, GSAP 3.15.0 (ScrollTrigger, SplitText), `@gsap/react` 2.1.2 (`useGSAP`), Lenis 1.3.26, Vitest 4.0.18 (jsdom) + Testing Library 16.3, Biome 2.5.3, Playwright 1.58.2 (scripts de verificação, Chromium e Firefox), pnpm.

**Spec:** `C:\Users\lekoc\semogapp\semogsite-site-v2\docs\superpowers\specs\2026-10-15-site-v2-producao-design.md` (seções 1, 2, 3, 5, 6, 8 fase 4, 9 e 10). Roteiro: `docs/superpowers/plans/2026-10-15-site-v2-roteiro.md` (fase 4, critério de pronto "4." e calibragem). Respostas do Leandro às pendências de conteúdo (vinculantes): `C:\Users\lekoc\AppData\Local\Temp\claude\C--Users-lekoc-semogapp-semogsite\fce07e0d-ce5a-4a7f-a870-a8cface08e2b\scratchpad\fase4-respostas-consolidadas.json`, com as interpretações registradas em "Decisões de projeto" (DP-C). Pendências com prazo na fase 4: `.superpowers/sdd/2026-10-15-site-v2-fase-0-1-fundacao/progress.md` (Task 1.4, 1.5, 1.6, 1.7, Final I1, Final "PRAZO virada") e `.superpowers/sdd/2026-10-16-site-v2-fase-2-formularios/progress.md` (visual adiado). Formato e decisões de prévia: `docs/superpowers/plans/2026-10-16-site-v2-fase-3-leitura.md` (DP1, DP2).

Neste plano, **WT** = `C:\Users\lekoc\semogapp\semogsite-site-v2` e **PROTOTIPO** = `WT\design-explorations\site-v2-prototipo` (versionado na branch desde `1381cc5`; a CI o enxerga, e o teste de paridade o lê).

## Global Constraints

- **Onde trabalhar:** na WT, branch `feat/site-v2`. Conferir `git branch --show-current` na mesma chamada de cada commit. Ninguém troca de branch enquanto houver implementador vivo.
- **Dois PRs para `feat/site-v2`** (DP1): **4a** = Tarefas 4.1 a 4.9 (com a 4.5a); **4b** = Tarefas 4.10 a 4.20. O 4b começa da ponta do 4a já aprovado.
- **Commits locais por tarefa, sem push.** Cada tarefa termina com `git branch --show-current && git add <arquivos exatos> && git commit -m "..."`, nunca `git add -A`; mensagem convencional em pt-BR terminando com as linhas `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` e `Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn`. Push, PR e Vercel só com o "ok" do Leandro.
- **Produção intocada até a virada.** Nenhuma URL do site no ar muda de status, `<title>`, description, canonical ou JSON-LD por efeito desta fase. O site atual (`src/app/(frontend)`, `[[...slug]]`, `content/pages`) continua servindo as URLs reais; as páginas novas só existem em `/previa-v2/...`, que responde 404 com `VERCEL_ENV=production`. Os dois redirects novos ficam fora do `next.config.ts` até `VIRADA_1_FEITA = true` (DP7). Exceções registradas, as duas autorizadas pelo Leandro em 16/10/2026 e as duas só chegam ao ar na virada, porque a branch não vai à `main` antes: a mudança de destino do formulário de contato (Tarefa 4.16) vale para o formulário antigo também; e o vídeo do Semog Experience 26 substitui o de 2025 na landing `/experience` (Tarefa 4.5a), desvio da spec 6, que deixava a rota intocada.
- **Sem banco, sem integração, sem efeito externo.** O único acesso à rede fora do `localhost` é GET de leitura em `https://www.semog.com.br` (comparação de metadados, Tarefas 4.9 e 4.20). Nenhuma tarefa conecta no banco, chama Exact, SendGrid, Google Ads ou a API da Superlógica (2ª via), nem envia formulário. Testes mockam as Server Actions. O verificador abre o "Sou cliente" e o formulário de contato no navegador, mas não envia nada (o Turnstile barra navegador automatizado, e o CPF seria de pessoa real).
- **Segredos:** nunca imprimir valor de variável de ambiente. A build local roda sem `NEXT_PUBLIC_SITE_URL` (conferir com `[string]::IsNullOrEmpty($env:NEXT_PUBLIC_SITE_URL)` = `True`). Nenhum humano nem agente lê ou imprime o valor de `SEGUNDA_VIA_ATIVA` (o código do esqueleto o lê em runtime, como o `WhatsAppFloat` já faz) nem o de `CONTACT_TO` (que o código deixa de ler na Tarefa 4.16).
- **Portões da CI** (rodar da WT, nesta ordem): `pnpm exec biome ci ./src ./tests ./scripts`, `pnpm exec tsc --noEmit`, `pnpm run check:server-actions`, `pnpm run test:int`, `pnpm build`. Antes do `biome ci`, `pnpm exec biome check --write <arquivos tocados>` e conferir `git diff --cached --stat` depois do `git add` (CRLF no disco, LF no Git). O CSS de `src/site/**` fica fora do Biome (`biome.json`) e é guardado pelo teste de identidade.
- **Texto público:** pt-BR com acentuação. Proibidos "tempo real", "validade jurídica", "menor inadimplência do mercado", "melhor do Brasil", "5ª melhor", "a única do Norte e Nordeste" e os demais de `tests/int/helpers/identidade.ts` (`TERMOS_VEDADOS`), e as regras de redação novas da Tarefa 4.1 (`REDACAO_VEDADA`): nada de "conduz"/"condução" (a Semog **assessora**; a cobrança, a Semog **faz**), nada de a Semog "assumir", jurídico sempre "com escritório parceiro" (nunca "com parceiro"), o Garante não "zera a inadimplência", a base do 1% é "o valor total da arrecadação", a Semog não faz gestão de garantias nem do pós-obra, nenhum `wa.me` no conteúdo. Ranking só como "5º entre mais de 3.500 administradoras" e "a mais bem posicionada do Norte e Nordeste". Vale também para comentário dentro de `src/site/**` e `src/app/(site)/**` (o guarda acusa).
- **Nada editorial** (sem eyebrow em caixa-alta com tracking, sem numerais decorativos "01/02", sem layout de revista); **nenhum dado inventado**: texto que não está no conteúdo tipado, no site atual, no protótipo (marcado `TEXTO-NOVO`) ou nas respostas do Leandro não entra; texto de interface novo deste plano leva `{/* TEXTO-NOVO */}` ao lado. Dado que depende do Leandro entra como `pendente(...)` (Tarefa 4.1) e trava a virada.
- **Identidade do site v2** (guarda `site-v2-identidade`): CSS só por token, `border-radius` 0, sem `uppercase`, sem serifa, `stroke-linecap` butt, sem `prefers-reduced-motion`; um `.css` por seção/componente, importado pelo próprio componente; links internos `<a>` (nunca `next/link`); nenhum hex em `.ts`/`.tsx` de `src/site` e `src/app/(site)`.
- **WhatsApp só para clientes** (spec 5): no site v2, todo link `wa.me` leva `data-wa-caminho` (`cliente` ou `restrita`), o que faz o `LeadClickTracker` medi-lo como `triagem_whatsapp_click` e o cron do Ads ignorá-lo (`SECOES_FORA_DO_ADS`). Nenhum WhatsApp de proposta. O botão do anúncio (`Conversation started`) não é tocado.
- **TypeScript:** zero `any`; `as` só com o motivo escrito ao lado; toda promise com tratamento de erro; falha de cena vai ao Sentry pela montagem e a seção fica em HTML estático; falha de parte de cena vai por `ctx.reportar`, nunca só `console.error`.
- **Windows/CRLF:** todo texto lido do disco passa por `.replace(/\r\n?/g, '\n')` antes de regex; nenhuma regex depende de `.` ou `$` antes de `\r`.
- **APIs de terceiro conferidas em 16/10/2026 no pacote instalado** (`node_modules`): versões `next` 16.2.6, `gsap` 3.15.0, `lenis` 1.3.26, `@gsap/react` 2.1.2 (lidas dos `package.json` instalados). `error.js` recebe `{ error, unstable_retry }` e precisa de `'use client'` (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md`); `not-found.js` atende `notFound()` do segmento; com vários root layouts, a 404 de URL que não casa rota nenhuma exige `global-not-found.js` com `experimental.globalNotFound` (`.../not-found.md`, seção "global-not-found.js (experimental)"), o que é assunto da virada (DP10); grupos de rota só conflitam se resolverem para a mesma URL (`.../route-groups.md`).

## Decisões de projeto

- **DP1 · Dois PRs.** 4a: o que é comum a todas as páginas (regras de texto, pendências, core, seção de proposta, prévia e metadados) e as três páginas mais longas (home, A Semog, Gestão), com uma verificação completa. 4b: Garante, Incorporadoras, Tecnologia, `/solucoes`, pacote landing (proposta, contato, 404), NAP, "Sou cliente", menu e redirects, com a segunda verificação completa. Motivo: são ~8.700 linhas de cena e ~5.400 de marcação a portar; um PR só passaria de 15.000 linhas de diff e uma rodada de verificador sobre tudo seria rasa. Custo: duas rodadas completas (regra de 28/09: uma por PR).
- **DP2 · Porta por receita, com prova de paridade.** O código das cenas e a marcação das seções não são colados neste plano: a fonte é o arquivo do protótipo, versionado, e a transformação é mecânica (seção "Receita da porta", com o ranking da fase 1 como exemplo resolvido). Cada tarefa lista arquivo de origem, arquivo de destino e os desvios de conteúdo daquela página; o teste de paridade (Tarefa 4.4) falha se uma classe, um id ou um `data-*` da parcial sumir ou sobrar sem estar declarado. O código novo (o que não existe no protótipo) está inteiro no plano.
- **DP3 · Prévia por prefixo, links que ficam na prévia.** A home passa a ser `/previa-v2` (a bancada do ranking da fase 1 sai: a home contém o ranking). `caminhoNoSite` (`src/site/rotas.ts`) leva cabeçalho, rodapé e links das seções à página na prévia enquanto `VIRADA_1_FEITA` for `false`, só para as páginas que já existem lá (`PAGINAS_NA_PREVIA`, que cresce a cada tarefa); o resto vai à URL real. Supera a DP10 da fase 3 para o cabeçalho e o rodapé: o verificador precisa navegar entre páginas novas para provar o desmonte em ida e volta. `PREFIXO_DA_LEITURA` passa a ser o mesmo `PREFIXO_DA_PREVIA`.
- **DP4 · Uma lista de cenas por página, num módulo client próprio.** `RunnerDeCenas` recebe `cenas` por prop; cada página tem `src/site/cenas/paginas/<pagina>.tsx` (`'use client'`) com a lista e o componente que monta o runner. `registro.ts` continua a agregar as listas, só para os testes. Motivo: com o registro único, o bundle de toda página carregaria as cenas de todas. **O módulo client é obrigatório desde a primeira página com runner, não só por bundle:** a lista de cenas é um array de funções, e função não atravessa a fronteira Server → Client Component. Conferido no Next instalado (16.2.6): `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` ("Props passed to Client Components need to be serializable by React") e a mensagem "Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server"" no runtime `node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js`. Uma `page.tsx` (Server Component) que escrevesse `<RunnerDeCenas cenas={[['ranking', cenaRanking]]} />` faria o prerender lançar no `pnpm build`, e o Vitest em jsdom não acusaria (não há fronteira RSC no teste). Passar o elemento `<CenasDaHome />` como prop é permitido: as props dele são vazias, e a lista nasce do lado do cliente. Por isso o `src/site/cenas/paginas/home.tsx` nasce na Tarefa 4.2, e um teste da 4.2 proíbe Server Component de importar `RunnerDeCenas` ou uma cena diretamente.
- **DP5 · Pendências de conteúdo travam a virada, não a CI.** Valor que depende do Leandro (números da nova prestação; foto dos sócios até o arquivo chegar; vídeo do Experience 26 só até a Tarefa 4.5a, que já tem o arquivo) entra como `pendente('o que falta')`, num lugar só do conteúdo tipado; na prévia, aparece o selo "A CONFIRMAR"; o teste `site-v2-pendencias` lista as pendências conhecidas (pendência nova é decisão escrita) e **falha se `VIRADA_1_FEITA` for `true` com qualquer pendência**. Ver "Conflitos": o briefing pedia teste que falhe enquanto houver valor provisório; falhar já deixaria a CI da branch vermelha até o Leandro mandar os arquivos.
- **DP6 · "Sou cliente" é um painel, não um botão flutuante.** Gatilhos só nos três lugares da resposta do Leandro ("só no cabeçalho, no rodapé e no Contato"): no cabeçalho (ao lado do Login, e no menu do celular), no rodapé e no atalho do Contato. A 404 não tem gatilho no corpo: tem o do cabeçalho e o do rodapé, e o cartão do Contato. O gatilho abre um `<dialog>` único por página com: 2ª via (o fluxo atual, `SegundaVia`, com os três desfechos que terminam no WhatsApp), atendimento ao condômino pelo WhatsApp e Área do cliente. Sem JavaScript (e antes da hidratação), o gatilho é o link do WhatsApp com `data-wa-caminho="cliente"`, como o botão da triagem, com a mensagem de atendimento (`MENSAGEM_DE_ATENDIMENTO`); só o atalho do Contato, que abre direto a 2ª via (`tela="segunda-via"`), leva a mensagem da 2ª via (`MENSAGEM_DO_CLIENTE`). As telas da 2ª via são reaproveitadas sem mudança de lógica; o visual v2 vem de `sou-cliente.css`, escopado no painel.
- **DP7 · Redirects da virada como função.** `redirecionamentosDoSite(viradaFeita)` devolve os 54 de hoje e, com a virada, os dois 308 para `/tecnologia`. O `next.config.ts` chama com `VIRADA_1_FEITA`. A prova por `curl` roda numa cópia descartável da WT com a constante trocada (Tarefa 4.20), nunca na WT.
- **DP8 · NAP: fonte única `UNITS`, demais textos conferidos.** `UNITS` (`src/lib/seo.ts`) passa a ser exportada; `site.company.addresses`, `conteudo.cidades.*` e o texto renderizado do Contato continuam com a grafia própria, e o teste `site-v2-nap` exige o mesmo telefone, o mesmo logradouro com número, bairro, cidade/UF e o mesmo CID do mapa. Derivar os textos da `UNITS` mudaria a grafia de páginas no ar.
- **DP9 · Contato: os cinco assuntos do protótipo, todos para `ola@semog.com.br`.** O schema do contato ganha os valores novos (sem tirar os de hoje, que o formulário antigo usa até a fase 7); a notificação do contato passa a ir para `CONTATO_TO = 'ola@semog.com.br'` (onde o Chatwoot distribui), fixo no código, no lugar de `CONTACT_TO`. O e-mail não aparece na página. O v2 não oferece "proposta comercial" no contato: proposta só pelo formulário de proposta.
- **DP10 · 404 em duas camadas.** Nesta fase, a 404 nova é `PaginaNaoEncontrada` (pacote landing), servida por `src/app/(site)/not-found.tsx` para todo `notFound()` do `(site)` (inclusive `/previa-v2/*` em produção) e visível na prévia em `/previa-v2/nao-encontrada`. A 404 de URL desconhecida do site inteiro continua sendo a do `(frontend)` até a virada; lá, com o `[[...slug]]` sem páginas, a fase 5 decide entre `global-not-found.tsx` (experimental no Next 16.2.6) e manter o catch-all chamando `PaginaNaoEncontrada`. Registrado para o plano da fase 5.
- **DP11 · `/solucoes` sem protótipo.** A página é portada do conteúdo atual, reescrita pelas regras (DP-C10), com seções estáticas no visual v2 (sem cena própria além da proposta) e sem as imagens antigas de CGI do Supabase. Como não há protótipo aprovado, o verificador da 4b manda os quadros ao Leandro, e a 4b só fecha com o "ok" dele sobre `/solucoes`, a 404 e o painel "Sou cliente" [A CONFIRMAR: visual da /solucoes, da 404 e do painel, na prévia]. Lugar: `/solucoes` ganha link no rodapé (decisão do Leandro de 16/10/2026: a página é mantida pelo tráfego do Search Console e não pode ficar sem link interno); fora do menu, como o protótipo.
- **DP12 · Experience 26 na Comunidade da home e na `/experience`.** Decisão do Leandro de 16/10/2026: o reel do Semog Experience 26 (post `Dd4jHaQCso5`, arquivo `C:\Users\lekoc\Downloads\semog-experience-26-reel.mp4`, 720 × 1280, 68 s, 19,9 MB) entra nos dois lugares. Na home, no primeiro quadro retrato da seção Comunidade, que tem a proporção de reel (406 × 720); o segundo retrato fica com a foto de 2025, e a legenda passa a "Semog Experience 2026 e 2025.". Na landing `/experience`, substitui o vídeo de 2025 (desvio da spec 6 autorizado por ele). Um arquivo só, otimizado e servido de `public/site-v2/videos/` (não do bucket: subir arquivo no Supabase seria efeito externo), com capa gerada do próprio vídeo. Tarefa 4.5a.
- **DP13 · Menu do celular.** Ao alargar a tela além de 1080 px com o menu aberto, o menu fecha (`aria-expanded="false"`); com o menu aberto, Tab e Shift+Tab ficam presos entre o botão do menu e os links do painel.
- **DP14 · `(site)` ganha `error.tsx`.** Erro de renderização numa página v2 mostra uma tela v2 com "Tentar de novo" (`unstable_retry`) e o link para o início, e vai ao Sentry; antes caía no `global-error`. A tela sai **sem** cabeçalho: `Cabecalho` e `SimbolosSvg` são da página (dos esqueletos), não do `src/app/(site)/layout.tsx`, e o `error.tsx` substitui a página inteira. Por isso o próprio `error.tsx` renderiza `<SimbolosSvg />`, senão a seta do link (`<use href="#seta" />`) fica vazia.

### Decisões de conteúdo (DP-C): as respostas do Leandro, como entram

| Id da pendência | O que entra |
| --- | --- |
| home-titulos-condominios-tecnologia, home-textos-ranking, home-textos-comunidade, semog-pauta-assembleia | publicados como no protótipo |
| home-legenda-ana-claudia | "Ana Cláudia, sobre a 4ª edição, em comentário no Instagram do evento."; depoimento autorizado: sai `depoimentos.aviso` |
| home-proximas-edicoes | o marco "5ª edição · Anunciada" vira "Próximos encontros · Aguarde novas informações."; `cafe.edicao` termina com "Aguarde novas informações sobre os próximos encontros." Nenhuma edição nem data nova |
| semog-foto-socios | a resposta em texto livre vence a opção marcada (a foto do palco do Superlógica Next): moldura dos sócios = `FOTO_DOS_SOCIOS`, a 1ª foto do post do Instagram `DeR7uo5EbRX`, que tem todos os sócios. Arquivo `C:\Users\lekoc\Downloads\semog-experience-26-grupo.jpg` (o Leandro salva); destino `public/site-v2/fotos/socios-semog.webp`; alt neutro "Os sócios da Semog, reunidos." (sem nomes: nenhum nome foi informado). Pendente só até o arquivo entrar (Tarefa 4.7, Step 4a); legenda "Acesso fácil aos sócios. Regra da casa desde 1991." |
| (vídeo do Experience) | `VIDEO_DO_EXPERIENCE_26`: pendente na 4.1, valor real na 4.5a (o arquivo já existe), na Comunidade da home e na `/experience` (DP12) |
| semog-marco-garante-zera | "Com a G5 Partners, criamos o produto que garante ao condomínio 100% da arrecadação prevista, por 1% do valor total da arrecadação." |
| gestao-orcamentos-comparados | "A manutenção tem rotina, cotação e orçamento." / "Manutenção preventiva, com cotações e orçamentos de fornecedores feitos pela Semog." |
| gestao-canal-socios | "Acesso fácil aos sócios" (na Gestão e no item de A Semog) |
| garante-quem-paga-e-cobra | a Semog Garante paga; a equipe própria da Semog cobra; sem "assume" |
| garante-sem-acordo | resposta mantida, sem selo |
| garante-base-do-1 | "1% do valor total da arrecadação" em todo o conteúdo |
| garante-1-na-prestacao | "…sem taxa de adesão, que aparece no plano de contas como “Semog Garante”." |
| garante-fidelidade | "Não. O Garante não tem prazo mínimo nem fidelidade: o contrato é mensal." |
| garante-sem-taxa-adesao, garante-pergunta-elegibilidade | mantidos ("administrado pela Semog") |
| tecnologia-boleto-inteligente | sai o rótulo e o selo |
| tecnologia-inicio-prestacao-digital | "Prestação de contas digital desde 2023. Em maio de 2026, lançamos a nova." |
| tecnologia-numeros-prestacao | `NUMEROS_DA_PRESTACAO`, pendente (números e data de corte do Leandro) |
| incorporadoras-foto-obra | foto mantida, sem legenda e sem selo. Conflito na resposta (a opção marcada era "com a legenda Imagem ilustrativa", o texto livre diz "tira a legenda imagem ilustrativa"): o texto livre vence, por decisão registrada em 16/10/2026 (ver "Conflitos") |
| incorporadoras-logos-construtoras | sai a faixa "Construtoras parceiras" |
| solucoes-formato-e-menu | `/solucoes` atual inteira, no visual novo, reescrita (DP11); fora do menu, como o protótipo, e **com link no rodapé** (decisão de 16/10/2026: sem ele, a página perde todo link interno na virada) |
| solucoes-clube-beneficios | "O clube de benefícios da Semog está sendo atualizado. Estamos criando novas soluções e novos parceiros para condomínios e moradores." |
| contato-rota-segunda-via | a 2ª via continua dentro do "Sou cliente", e o atalho do Contato ("2ª via de boleto") abre **direto** o fluxo da 2ª via (`tela="segunda-via"`); com a 2ª via desligada no ambiente, abre o menu, que a oferece pelo WhatsApp |
| contato-email, contato-assuntos-destino | DP9 |
| nao-encontrada-texto | 404 nova (DP10), título "Não achamos esta página."; cinco cartões, sem "Sou cliente" no corpo (DP6), e o cliente chega pelo cartão do Contato |
| todas-botao-sou-cliente | DP6 |
| todas-juridico-escritorio-parceiro | "Suporte jurídico com escritório parceiro" |
| todas-conduz-para-assessora | migração e assembleia: "assessora"; cobrança: "faz" / "é feita pela" |

---

## Review Focus

- **Clique em WhatsApp saído do "Sou cliente", inclusive antes da hidratação e sem JavaScript.** Esperado: nunca vira `whatsapp_click` (evento-chave de lead) nem sobe ao Ads; sai como `triagem_whatsapp_click` com seção `triagem_cliente` ou `triagem_restrita`. Testes na Tarefa 4.15 (link do servidor com `data-wa-caminho`, botão hidratado sem `href`, todo `wa.me` renderizado nas páginas marcado) e varredura em toda página pela `conferirPagina` (Tarefa 4.4).
- **Ida e volta entre páginas do pacote app, e voltar do navegador.** Esperado: cada página monta do zero (pins, Lenis, tema do cabeçalho), sem ouvinte duplicado nem pin do anterior; o voltar restaura a página utilizável. Teste de desmonte com cena assíncrona na Tarefa 4.2; navegação real (cabeçalho, rodapé, voltar) na Tarefa 4.9 e na 4.20.
- **Virada feita com dado pendente.** Esperado: o teste falha e diz qual pendência. Tarefa 4.1 (`site-v2-pendencias`).
- **Cabeçalho entre 1081 e 1240 px com "Sou cliente" ao lado do Login.** Esperado: tudo numa linha, nada saindo da faixa nem coberto. Medição no navegador na Tarefa 4.15 (Step 8) e na 4.20 (Step 9).
- **Formulário de contato com assunto fora da lista, ou action antiga numa aba aberta antes do deploy.** Esperado: o servidor recusa com erro de campo; falha de rede ou de action aparece na tela com os telefones das Unidades e vai ao Sentry, nunca tela em branco nem "enviado" falso. Testes na Tarefa 4.16.

---

## Estrutura de arquivos

| Caminho (na WT) | Responsabilidade |
| --- | --- |
| `src/site/conteudo/pendencias.ts` | `pendente`, `estaPendente`, `pendenciasDe` |
| `src/site/conteudo/conteudo.ts` | (modificado) respostas do Leandro, pendências, `souCliente`, `solucoesPagina` |
| `src/site/estilo.ts` | `comIndice` (a variável `--i` do protótipo) |
| `src/site/rotas.ts` | `PREFIXO_DA_PREVIA`, `PAGINAS_NA_PREVIA`, `caminhoNoSite`, `semPrefixoDaPrevia` |
| `src/site/seo/institucional.ts` | metadata e JSON-LD das páginas institucionais |
| `src/site/core/{patamares,motion,montagem,dinamica,util,cabecalho}.ts` | pendências de prazo do core, gradiente Dinâmica, menu |
| `src/app/(site)/error.tsx` | erro de renderização no visual v2 |
| `src/site/runner/RunnerDeCenas.tsx` | (modificado) recebe `cenas` |
| `src/site/cenas/paginas/*.tsx` | lista de cenas de cada página e o componente que monta o runner |
| `src/site/cenas/<pagina>/*.ts`, `src/site/cenas/proposta.ts` | cenas portadas |
| `src/site/secoes/<pagina>/*.tsx` + `.css` | seções portadas |
| `src/site/secoes/comum/{Pendencia,JsonLd}.tsx` | selo de pendência na prévia; JSON-LD |
| `src/site/paginas/*.tsx` | corpo de cada página (o que a virada leva às URLs reais) |
| `src/site/layout/{EsqueletoApp,EsqueletoLanding,EsqueletoLeitura,Cabecalho,Rodape}.tsx` | esqueletos e "Sou cliente" no cabeçalho e no rodapé |
| `src/site/landing/{ligar-landing.ts,LigarLanding.tsx}`, `src/site/secoes/landing/landing.css` | o JS e o CSS comum do pacote landing |
| `src/app/(site)/(app)/previa-v2/**/page.tsx`, `src/app/(site)/(landing)/**` , `src/app/(site)/not-found.tsx` | rotas da prévia, layout landing, 404 |
| `src/site/cliente/*` | "Sou cliente": eventos, gatilho, painel, medição, CSS |
| `src/site/formularios/mensagem/FormularioDeMensagem.tsx` | formulário de contato do v2 |
| `src/lib/{form-schemas,triagem,seo}.ts`, `src/lib/leads/destinatarios.ts`, `src/app/(frontend)/_actions/submit-form.ts`, `src/components/triagem/segunda-via/LinksDeWhatsApp.tsx` | assuntos e destino do contato, mensagem de atendimento, `UNITS` exportada |
| `src/site/redirecionamentos.ts`, `next.config.ts` | redirects da virada |
| `public/site-v2/fotos/incorporadoras-obra.webp` | foto da obra (cópia do protótipo) |
| `public/site-v2/fotos/socios-semog.webp` | foto dos sócios (1ª foto do post `DeR7uo5EbRX`), quando o arquivo chegar (4.7) |
| `public/site-v2/videos/semog-experience-26.mp4`, `…-poster.webp`, `scripts/gen-poster-experience-26.mjs` | reel do Experience 26 e a capa, para a home do v2 e a `/experience` (4.5a) |
| `content/media.ts`, `src/data/experienceEvent.ts`, `src/components/experience/ExperienceVideo.tsx` | (modificados) a `/experience` passa a mostrar o vídeo do 26 (4.5a) |
| `scripts/site-v2-institucional.mjs` | varredura lado a lado, site no Next e protótipo |
| `tests/int/helpers/{identidade,prototipo,paginas}.ts` | guarda de redação, paridade com o protótipo, conferência de página |

Testes novos: `site-v2-redacao`, `site-v2-pendencias`, `site-v2-core-fase4`, `site-v2-proposta-secao`, `site-v2-rotas`, `site-v2-pagina-home`, `-semog`, `-gestao`, `-garante`, `-incorporadoras`, `-tecnologia`, `-solucoes`, `-proposta`, `-contato`, `-nao-encontrada`, `site-v2-sou-cliente`, `site-v2-nap`, `site-v2-menu`. Modificados: `site-v2-conteudo`, `site-v2-identidade`, `site-v2-previa`, `site-v2-layout`, `site-v2-montagem`, `site-v2-core-ssr`, `site-v2-inventario`, `site-v2-og`, `site-v2-formulario-proposta`, `submit-form` (destino do Contato, 4.16), `experience-media` e `experience-sections` (vídeo do 26, 4.5a).

---

## Receita da porta (vale para as Tarefas 4.5 a 4.8 e 4.10 a 4.12)

O exemplo resolvido é o ranking da fase 1: `PROTOTIPO\src\sections\05-ranking.html` → `src/site/secoes/home/Ranking.tsx`, `PROTOTIPO\src\scenes\05-ranking.css` → `src/site/secoes/home/ranking.css` (cópia sem edição) e `PROTOTIPO\src\scenes\05-ranking.js` → `src/site/cenas/home/ranking.ts`. Abra os três pares lado a lado antes da primeira porta.

**Seção (parcial HTML → Server Component):**

- **R1 · Arquivos.** `src/site/secoes/<pasta>/<Nome>.tsx`, exportando `function <Nome>()` sem props (salvo onde a tarefa disser), e `src/site/secoes/<pasta>/<id>.css`, cópia byte a byte do CSS da cena (`Copy-Item -LiteralPath`), importado na primeira linha do TSX (`import './<id>.css'`). O CSS não é editado, salvo onde a tarefa listar.
- **R2 · Mesma árvore.** Mesmos elementos, na mesma ordem, com as mesmas classes, ids, `data-*` e `aria-*`. `class` → `className`; `data-x` sem valor → `data-x=""`; `style="--i: N"` → `style={comIndice(N)}` (`src/site/estilo.ts`, Tarefa 4.4); `<svg class="seta" aria-hidden="true"><use href="#seta"></use></svg>` → `<svg className="seta" aria-hidden="true"><use href="#seta" /></svg>`.
- **R3 · Texto do conteúdo.** `{{a.b.c}}` → `{conteudo.a.b.c}`; `{{a.b|numero}}` → `{formatarNumero(conteudo.a.b)}`; `{{a.N.b}}` → `conteudo.a[N].b`; listas repetidas no HTML viram `.map` sobre a lista do conteúdo, com `key` estável (id, nome ou título). Texto escrito direto na parcial (marcado `TEXTO-NOVO` no protótipo) é copiado com o comentário `{/* TEXTO-NOVO: … */}` no mesmo lugar.
- **R4 · Imagens.** `<img>` com `{/* biome-ignore lint/performance/noImgElement: a cena anima moldura e parallax no próprio <img>, e /site-v2 fica fora do localPatterns do next/image */}`; `width`/`height` numéricos; `assets/fotos/x.webp` → `/site-v2/fotos/x.webp` (o arquivo precisa existir em `public/site-v2/fotos/`; o teste `site-v2-conteudo` confere as fotos do conteúdo). Canvas decorativo: o `biome-ignore lint/a11y/noAriaHiddenOnFocusable` do Ranking.
- **R5 · Links.** `index.html` → `caminhoNoSite('/')`; `index.html#unidades` → `caminhoNoSite('/#unidades')`; `<pagina>.html` → `caminhoNoSite('/<url da página>')` (`administracao-de-condominios.html` → `/administracao-de-condominios`, `tecnologia.html` → `/tecnologia`); `#id` da mesma página fica como está; URL externa fica.
- **R6 · Comentários.** O comentário de abertura da parcial vira o JSDoc do componente, reescrito em uma ou duas frases e sem termo vedado; os demais comentários de explicação ficam de fora, menos os `TEXTO-NOVO`.
- **R7 · Selos.** `<span class="a-confirmar">…</span>` sai, salvo onde a tarefa o troca por `<Pendencia item={…} />`.

**Cena (`init(ctx)` → módulo TS):**

- **C1 · Arquivo e nome.** `src/site/cenas/<pasta>/<id>.ts`, exportando `cena<Nome>(ctx: ContextoCena)`, com o mesmo retorno do `init` (a função de limpeza, quando o protótipo devolve uma; `Promise<void>` quando o init é `async`). Constantes de patamar que o protótipo calcula ficam exportadas como `PATAMARES_<NOME>` só quando a tarefa pedir.
- **C2 · Tipos no lugar do JSDoc.** `@param`/`@returns`/`@type` viram anotações TS; o cast `/** @type {HTMLElement} */ (x)` vira `querySelector<HTMLElement>(…)` seguido de `if (!(x instanceof HTMLElement)) throw new Error('[cena <id>] falta <seletor>.')`; o helper `exigir` do protótipo é portado tipado onde existir.
- **C3 · Mesma coreografia.** Mesmos números (faixas, durações, eases, distâncias de pin, patamares), mesma ordem de tweens. Nada novo, nada "melhorado".
- **C4 · Contexto v2.** `ctx.util.X` igual (o util v2 tem os mesmos nomes; `criarDinamica` entra na Tarefa 4.2); nome de fonte escrito em canvas (`"Saira"`, `"Barlow"`) → `util.familiaDaFonte('--fonte-saira' | '--fonte-barlow')`; cor de canvas → `util.corDoToken('--token')`.
- **C5 · SSR.** Nada no topo do módulo toca `window`, `document`, `matchMedia` ou `getComputedStyle`; só constantes puras. O teste `site-v2-core-ssr` importa cada cena em Node.
- **C6 · Desmonte.** Laço só por `util.lacoVisivel`; ouvinte fora do GSAP só por `util.aoRolar`, `util.registrarDesligamento` ou pela função de limpeza devolvida; estilo inline posto por cena fora do GSAP em elemento interno é limpo pela própria cena (Task 1.8 da fase 1).
- **C7 · Falha de parte.** `console.error`/`console.warn` de parte que degrada (canvas, WebGL, fonte, medida) → `ctx.reportar(erro, '<parte>')`; o `.catch` de `ctx.pronto` → `.catch((erro) => ctx.reportar(erro, 'pronto'))` (a montagem ignora o `DesmontadoAntesDoPronto`, Tarefa 4.2).
- **C8 · Tween de callback.** Tween que só anima por `onUpdate` (`.to({}, { duration, onUpdate })`) leva `data: 'movimento'`, senão o snap de toque o conta como pausa (Task 1.4 da fase 1). O teste da Tarefa 4.2 varre `src/site/cenas`.
- **C9 · Módulos irmãos.** Imports entre arquivos da mesma cena (a tecnologia da home) viram imports relativos TS, com os mesmos nomes exportados.

---

# PR 4a · base comum, home, A Semog e Gestão

## Tarefa 4.1: Regras de redação no guarda, pendências que travam a virada e as respostas do Leandro no conteúdo

**Files:**
- Create: `src/site/conteudo/pendencias.ts`
- Create: `src/site/secoes/comum/Pendencia.tsx`
- Modify: `src/site/conteudo/conteudo.ts`
- Modify: `tests/int/helpers/identidade.ts`
- Modify: `tests/int/site-v2-identidade.int.spec.ts`
- Modify: `tests/int/site-v2-conteudo.int.spec.ts`
- Test: `tests/int/site-v2-redacao.int.spec.ts`, `tests/int/site-v2-pendencias.int.spec.ts`

**Interfaces:**
- Consumes: `conteudo` (fase 1), `VIRADA_1_FEITA` (`src/site/inventario.ts`), `textosDe`, `TERMOS_VEDADOS`, `procurarTermosVedados` (`tests/int/helpers/identidade.ts`).
- Produces:
  - `src/site/conteudo/pendencias.ts`: `type Pendente = { readonly pendente: string }`; `type OuPendente<T> = T | Pendente`; `pendente(oQueFalta: string): Pendente`; `estaPendente(valor: unknown): valor is Pendente`; `pendenciasDe(valor: unknown, caminho?: string): string[]` (cada item: `"<caminho.no.conteudo>: <o que falta>"`).
  - Tipos exportados de `conteudo.ts`: `NumerosDaPrestacao = { prestacoes: number; condominios: number; corte: string }`, `FotoDosSocios = { src: string; alt: string; largura: number; altura: number }`, `VideoDoExperience = { src: string; poster: string; legenda: string; largura: number; altura: number }`.
  - Chaves novas: `conteudo.tecnologia.numerosDaPrestacao: OuPendente<NumerosDaPrestacao>`, `conteudo.aSemog.pessoas.fotoDosSocios: OuPendente<FotoDosSocios>`, `conteudo.comunidade.experience.video26: OuPendente<VideoDoExperience>`, `conteudo.comunidade.cafe.proximos: { rotulo: string; texto: string }`, `conteudo.contatoPagina.atalhos.segundaVia: { titulo: string; texto: string }` (perde só o `confirmar`), `conteudo.naoEncontrada.links.<chave>: { titulo: string; texto: string }` (chaves `inicio`, `unidades`, `proposta`, `blog`, `contato`), `conteudo.souCliente`, `conteudo.solucoesPagina` (formas no Step 6).
  - `<Pendencia item={Pendente} />`: `<span class="a-confirmar">A CONFIRMAR: …</span>`.
  - `tests/int/helpers/identidade.ts`: `REDACAO_VEDADA`, `procurarRedacaoVedada(texto: string): string[]` (devolve os motivos).

- [ ] **Step 1: Estender o guarda de identidade**

Em `tests/int/helpers/identidade.ts`, logo depois de `TERMOS_VEDADOS`, acrescentar (o `type Regra` e a função `normalizar` já existem no arquivo; mova a declaração de `normalizar` para antes deste bloco se o TypeScript reclamar de uso antes da declaração):

```ts
/**
 * Regras de redação que dependem de quem faz a ação na frase, e não de uma palavra solta
 * (respostas do Leandro de 16/10/2026 e memória de conformidade): a Semog assessora (não
 * conduz nem assume), o jurídico é "com escritório parceiro", o Garante não zera a
 * inadimplência, a base do 1% é o valor total da arrecadação e não há WhatsApp no conteúdo.
 * As regex valem por frase: `[^.!?\n]*` para no fim dela.
 */
export const REDACAO_VEDADA: readonly Regra[] = [
  [/\bconduz\w*|\bcondu[çc][ãa]o\b/i, 'a Semog assessora; "conduz"/"condução" não entram'],
  [/\bSemog\b[^.!?\n]*\bassum\w*|\bassumimos\b/i, 'a Semog não "assume": assessora ou faz'],
  [/\bcom parceir[oa]s?\b/i, 'jurídico é "com escritório parceiro", nunca "com parceiro"'],
  [/\bzera\w* a inadimpl/i, 'o Garante não zera a inadimplência: o condomínio recebe 100%'],
  [/arrecadação mensal total/i, 'a base do 1% é "o valor total da arrecadação"'],
  [/gestão d[eo]s? (?:garantias?|pós-obra)/i, 'a Semog não faz gestão de garantias nem do pós-obra'],
  [/wa\.me\//i, 'WhatsApp fora do conteúdo (spec 5): o atendimento sai do "Sou cliente"'],
]

/** Os motivos de cada regra de redação que o texto quebra (vazio = texto limpo). */
export function procurarRedacaoVedada(texto: string): string[] {
  const limpo = normalizar(texto)
  return REDACAO_VEDADA.filter(([padrao]) => padrao.test(limpo)).map(([, motivo]) => motivo)
}
```

- [ ] **Step 2: Escrever o teste das regras de redação**

`tests/int/site-v2-redacao.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { conteudo } from '@/site/conteudo/conteudo'
import { procurarRedacaoVedada, textosDe } from './helpers/identidade'

/** Todas as chaves de um valor, com o caminho (`a.b.0.c`). */
function chavesDe(valor: unknown, caminho = ''): string[] {
  if (Array.isArray(valor)) return valor.flatMap((v, i) => chavesDe(v, `${caminho}.${i}`))
  if (valor === null || typeof valor !== 'object') return []
  return Object.entries(valor).flatMap(([chave, v]) => [
    `${caminho}.${chave}`,
    ...chavesDe(v, `${caminho}.${chave}`),
  ])
}

describe('regras de redação do site v2 (respostas do Leandro, 16/10/2026)', () => {
  it('pegam o que devem pegar', () => {
    for (const frase of [
      'A equipe da Semog conduz a migração.',
      'Assembleia de instalação conduzida',
      'Convocação, condução e ata.',
      'A Semog Garante paga e assume a cobrança.',
      'Suporte jurídico com parceiro',
      'o produto que zera a inadimplência',
      '1% da arrecadação mensal total',
      'Fazemos a gestão de garantias da obra.',
      'https://wa.me/551130034506',
    ]) {
      expect(procurarRedacaoVedada(frase), frase).toHaveLength(1)
    }
  })

  it('deixam passar a redação aprovada', () => {
    for (const frase of [
      'A equipe da Semog assessora a migração.',
      'A cobrança é feita pela equipe própria da Semog.',
      'Suporte jurídico com escritório parceiro',
      'Quando uma administradora assume o condomínio, o síndico acompanha.',
      '1% do valor total da arrecadação',
      'O condomínio recebe 100% da arrecadação prevista.',
    ]) {
      expect(procurarRedacaoVedada(frase), frase).toEqual([])
    }
  })

  it('nenhum texto do conteúdo tipado quebra uma regra de redação', () => {
    const achados = textosDe(conteudo).flatMap((texto) =>
      procurarRedacaoVedada(texto).map((motivo) => `${motivo} → ${texto}`),
    )
    expect(achados).toEqual([])
  })

  it('as respostas do Leandro estão no conteúdo', () => {
    const { garantePagina, gestaoPagina, aSemog, comunidade, tecnologia } = conteudo
    expect(garantePagina.duvidas.itens[4].resposta).toBe(
      'Não. O Garante não tem prazo mínimo nem fidelidade: o contrato é mensal.',
    )
    expect(garantePagina.duvidas.itens[3].resposta).toContain(
      'que aparece no plano de contas como “Semog Garante”',
    )
    expect(garantePagina.abertura.fatos.custo.rotulo).toBe(
      'do valor total da arrecadação: é o custo do Garante',
    )
    expect(gestaoPagina.mesa.momentos[5].texto).toContain('cotações e orçamentos')
    expect(gestaoPagina.atende.itens[2].titulo).toBe('Acesso fácil aos sócios')
    expect(aSemog.pessoas.itens[0].titulo).toBe('Acesso fácil aos sócios')
    expect(aSemog.historia.marcos[7].texto).toBe(
      'Com a G5 Partners, criamos o produto que garante ao condomínio 100% da arrecadação prevista, por 1% do valor total da arrecadação.',
    )
    expect(comunidade.cafe.edicao).not.toContain('5ª')
    expect(comunidade.cafe.proximos).toEqual({
      rotulo: 'Próximos encontros',
      texto: 'Aguarde novas informações.',
    })
    expect(tecnologia.contexto).toBe(
      'Prestação de contas digital desde 2023. Em maio de 2026, lançamos a nova.',
    )
    expect(tecnologia.pagina.mes.momentos[1]).not.toHaveProperty('apoio')
    // Título e ênfase juntos: hoje a frase "não existe mais" mora na ênfase, não no título.
    expect(`${conteudo.naoEncontrada.titulo} ${conteudo.naoEncontrada.enfase}`).toBe(
      'Não achamos esta página.',
    )
    expect(Object.keys(conteudo.naoEncontrada.links)).not.toContain('cliente')
  })

  it('não sobra selo, WhatsApp, aviso nem moldura vazia: nenhuma dessas chaves no conteúdo', () => {
    const proibidas = chavesDe(conteudo).filter((c) =>
      /\.(confirmar|fotoConfirmar|parceirasConfirmar|whatsapp|aviso|fotoAEnviar|fotoSocios|fotoEquipe|fotoLegenda|parceiras|segundaVia)$/.test(
        c,
      ),
    )
    // `souCliente.segundaVia` é o item do painel; `contatoPagina.atalhos.segundaVia` é o atalho do
    // Contato, que fica (sem o `confirmar`) e abre direto a 2ª via.
    const permitidas = ['.souCliente.segundaVia', '.contatoPagina.atalhos.segundaVia']
    expect(proibidas.filter((c) => !permitidas.includes(c))).toEqual([])
    expect(conteudo.contatoPagina.atalhos.segundaVia).not.toHaveProperty('confirmar')
  })
})
```

- [ ] **Step 3: Escrever o teste das pendências**

`tests/int/site-v2-pendencias.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { conteudo } from '@/site/conteudo/conteudo'
import { estaPendente, pendenciasDe, pendente } from '@/site/conteudo/pendencias'
import { VIRADA_1_FEITA } from '@/site/inventario'

describe('pendências de conteúdo (dado que depende do Leandro)', () => {
  it('estaPendente só reconhece o objeto criado por pendente', () => {
    expect(estaPendente(pendente('x'))).toBe(true)
    expect(estaPendente({ pendente: 'x', outra: 1 })).toBe(false)
    expect(estaPendente({ pendente: 3 })).toBe(false)
    expect(estaPendente('A CONFIRMAR')).toBe(false)
    expect(estaPendente(null)).toBe(false)
  })

  it('pendenciasDe acha a pendência em qualquer profundidade e diz onde', () => {
    expect(pendenciasDe({ a: [{ b: pendente('foto') }], c: 'texto' })).toEqual(['a.0.b: foto'])
  })

  it('as pendências de hoje são exatamente as conhecidas (pendência nova é decisão escrita)', () => {
    expect(pendenciasDe(conteudo).map((p) => p.split(':')[0])).toEqual([
      'tecnologia.numerosDaPrestacao',
      'comunidade.experience.video26',
      'aSemog.pessoas.fotoDosSocios',
    ])
  })

  it('a virada 1 não acontece com pendência de conteúdo: nenhum dado provisório vai ao ar', () => {
    // Antes da virada, a pendência aparece só na prévia, com o selo A CONFIRMAR. No commit da
    // virada (VIRADA_1_FEITA = true), este teste derruba a CI se alguma sobrou.
    expect(VIRADA_1_FEITA ? pendenciasDe(conteudo) : []).toEqual([])
  })
})
```

- [ ] **Step 4: Rodar e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-redacao.int.spec.ts tests/int/site-v2-pendencias.int.spec.ts`
Expected: FAIL. `site-v2-pendencias` com "Failed to resolve import '@/site/conteudo/pendencias'"; `site-v2-redacao` acusa no conteúdo "conduz", "com parceiro", "assume", "zera" e "arrecadação mensal total", e as chaves `confirmar`, `whatsapp`, `aviso`, `fotoAEnviar`.

- [ ] **Step 5: Escrever `pendencias.ts` e `Pendencia.tsx`**

`src/site/conteudo/pendencias.ts`:

```ts
/**
 * Dado que depende do Leandro (número, foto, vídeo) entra no conteúdo tipado como `pendente`, num
 * lugar só. Na prévia, a seção mostra o selo A CONFIRMAR (`<Pendencia>`); no commit da virada 1, o
 * teste site-v2-pendencias falha se sobrar alguma. Assim nenhum dado provisório vai ao ar.
 */
export type Pendente = { readonly pendente: string }
export type OuPendente<T> = T | Pendente

export function pendente(oQueFalta: string): Pendente {
  return { pendente: oQueFalta }
}

/** Só o objeto criado por `pendente`: uma chave, `pendente`, com texto. */
export function estaPendente(valor: unknown): valor is Pendente {
  if (valor === null || typeof valor !== 'object' || Array.isArray(valor)) return false
  const chaves = Object.keys(valor)
  if (chaves.length !== 1 || chaves[0] !== 'pendente') return false
  // `as`: a única chave do objeto foi conferida acima; falta só o tipo do valor dela.
  return typeof (valor as { pendente: unknown }).pendente === 'string'
}

/** Cada pendência de um valor, como `"caminho.no.conteudo: o que falta"`. */
export function pendenciasDe(valor: unknown, caminho = ''): string[] {
  if (estaPendente(valor)) return [`${caminho}: ${valor.pendente}`]
  if (Array.isArray(valor)) return valor.flatMap((v, i) => pendenciasDe(v, `${caminho}.${i}`))
  if (valor === null || typeof valor !== 'object') return []
  return Object.entries(valor).flatMap(([chave, v]) =>
    pendenciasDe(v, caminho ? `${caminho}.${chave}` : chave),
  )
}
```

`src/site/secoes/comum/Pendencia.tsx`:

```tsx
import type { Pendente } from '@/site/conteudo/pendencias'

/** Selo da prévia no lugar de um dado que o Leandro ainda vai mandar (o .a-confirmar é da fase 1). */
export function Pendencia({ item }: { item: Pendente }) {
  return <span className="a-confirmar">A CONFIRMAR: {item.pendente}</span>
}
```

- [ ] **Step 6: Aplicar as respostas no `src/site/conteudo/conteudo.ts`**

1. Logo depois do comentário de abertura do arquivo e antes de `export const conteudo = {`:

```ts
import { type OuPendente, pendente } from './pendencias'

export type NumerosDaPrestacao = { prestacoes: number; condominios: number; corte: string }
export type FotoDosSocios = { src: string; alt: string; largura: number; altura: number }
export type VideoDoExperience = {
  src: string
  poster: string
  legenda: string
  largura: number
  altura: number
}

/** Números da NOVA prestação de contas digital (lançada em maio de 2026) e a data de corte. */
const NUMEROS_DA_PRESTACAO: OuPendente<NumerosDaPrestacao> = pendente(
  'números da nova prestação de contas digital e a data de corte (o Leandro informa)',
)
/**
 * A 1ª foto do post do Instagram que o Leandro indicou em 16/10/2026 (DeR7uo5EbRX), com todos os
 * sócios. Pendente até o arquivo chegar (Tarefa 4.7, Step 4a).
 */
const FOTO_DOS_SOCIOS: OuPendente<FotoDosSocios> = pendente('foto dos sócios (arquivo do Leandro)')
/** O reel do Semog Experience 26 (DP12). Pendente só até a Tarefa 4.5a, que traz o arquivo. */
const VIDEO_DO_EXPERIENCE_26: OuPendente<VideoDoExperience> = pendente(
  'vídeo do Semog Experience 26 (arquivo do Leandro)',
)
```

2. Trocas (Edit com o texto exato; "todas" = `replace_all: true`; as demais são únicas no arquivo):

| Onde | Antes | Depois |
| --- | --- | --- |
| todas | `1% da arrecadação mensal total` | `1% do valor total da arrecadação` |
| `tecnologia.contexto` | `'Em produção desde maio de 2026: mais de 670 prestações em 220 condomínios até setembro de 2026.',` | `'Prestação de contas digital desde 2023. Em maio de 2026, lançamos a nova.',` e, na linha seguinte, `numerosDaPrestacao: NUMEROS_DA_PRESTACAO,` |
| `tecnologia.pagina.abertura.numeros.prestacoes` | `{ valor: 670, prefixo: '+', rotulo: 'prestações de contas digitais, de maio a setembro de 2026' }` (em várias linhas) | `{ prefixo: '+', rotulo: 'prestações de contas na nova prestação digital' }` |
| `tecnologia.pagina.abertura.numeros.condominios` | `{ valor: 220, rotulo: 'condomínios com prestação de contas digital' }` | `{ rotulo: 'condomínios com a nova prestação de contas digital' }` |
| `tecnologia.pagina.mes.momentos[1]` | as linhas `apoio: 'Boleto inteligente',` e `confirmar: 'A CONFIRMAR: o que é o boleto inteligente',` | (removidas) |
| `tecnologia.pagina.mes.momentos[3].texto` | `Quem conduz a cobrança é a equipe própria da Semog, sem terceirizar.` | `A cobrança é feita pela equipe própria da Semog, sem terceirizar.` |
| `tecnologia.pagina.conferencia.pares[1].pessoa` | `'A equipe própria da Semog conduz a cobrança.'` | `'A equipe própria da Semog faz a cobrança.'` |
| `depoimentos` | `aviso: 'Autorização de uso a confirmar.',` | (removida) |
| `comunidade.cafe.edicao` | `A 5ª edição já está anunciada.` | `Aguarde novas informações sobre os próximos encontros.`; depois da chave `edicao`, acrescentar `proximos: { rotulo: 'Próximos encontros', texto: 'Aguarde novas informações.' },` |
| `comunidade.experience` | `legenda: 'Semog Experience 2025.',` | `legenda: 'Semog Experience 2025.',` e, na linha seguinte, `video26: VIDEO_DO_EXPERIENCE_26,` |
| `proposta` | o bloco `whatsapp` (quatro linhas, com `url: 'https://wa.me/551130034506'` e `texto: '(11) 3003-4506'`) | (removido) |
| `aSemog.historia.marcos[7].texto` | `'Com a G5 Partners, criamos o produto que zera a inadimplência por 1% da arrecadação.'` | `'Com a G5 Partners, criamos o produto que garante ao condomínio 100% da arrecadação prevista, por 1% do valor total da arrecadação.'` |
| `aSemog.pessoas.itens[0].titulo` e `gestaoPagina.atende.itens[2].titulo` (todas) | `'Canal direto com os sócios'` | `'Acesso fácil aos sócios'` |
| `aSemog.pessoas` | as linhas `fotoAEnviar: …`, `fotoSocios: …`, `fotoEquipe: …` | `fotoDosSocios: FOTO_DOS_SOCIOS,` |
| `incorporadoras.abertura` | `fotoLegenda: 'Imagem ilustrativa.',` e `fotoConfirmar: 'A CONFIRMAR origem',` | (removidas) |
| todas | `'Assembleia de instalação conduzida'` | `'Assembleia de instalação assessorada'` |
| `incorporadoras.percurso.passos[1].apoio` | `'Jurídico com escritório parceiro · Registro em cartório'` | `'Suporte jurídico com escritório parceiro · Registro em cartório'` |
| `incorporadoras.percurso.passos[2].texto` | `Organizamos e conduzimos a assembleia` | `Organizamos e assessoramos a assembleia` |
| `incorporadoras.percurso.passos[2].apoio` | `Condução da assembleia` | `Assessoria na assembleia` |
| `incorporadoras.lancamento` | `parceiras: 'Construtoras parceiras',` e `parceirasConfirmar: 'A CONFIRMAR: nomes e logos com autorização',` | (removidas) |
| `garantePagina.abertura.lead` | `a Semog Garante paga o boleto ao condomínio e assume a cobrança.` | `a Semog Garante paga o boleto ao condomínio e a equipe própria da Semog cobra quem atrasou.` |
| `garantePagina.papeis.itens[1].faz` | `'Paga ao condomínio os boletos que ficaram em aberto e assume a cobrança de quem atrasou.'` | `'Paga ao condomínio os boletos que ficaram em aberto. A cobrança de quem atrasou fica com a equipe própria da Semog.'` |
| `garantePagina.duvidas` | `whatsapp: 'Fale com a gente no WhatsApp',` e as três linhas `confirmar: …` dos itens 0, 3 e 4 | (removidas) |
| `garantePagina.duvidas.itens[3].resposta` | `'Como um custo de 1% sobre a arrecadação mensal total, sem taxa de adesão. Do outro lado, a receita prevista passa a ser a receita que entra, todo mês.'` | `'Como um custo de 1% do valor total da arrecadação, sem taxa de adesão, que aparece no plano de contas como “Semog Garante”. Do outro lado, a receita prevista passa a ser a receita que entra, todo mês.'` |
| `garantePagina.duvidas.itens[4].resposta` | `'As condições de contrato são apresentadas na proposta.'` | `'Não. O Garante não tem prazo mínimo nem fidelidade: o contrato é mensal.'` |
| `garantePagina.duvidas.itens[5].resposta` | `a migração é conduzida pela equipe da Semog, sem interromper a operação.` | `a equipe da Semog assessora a migração, sem interromper a operação.` |
| todas | `'Suporte jurídico com parceiro'` | `'Suporte jurídico com escritório parceiro'` |
| `gestaoPagina.atende.lead` | `suporte jurídico com parceiro e acesso` | `suporte jurídico com escritório parceiro e acesso` |
| `gestaoPagina.atende.itens[3].texto` | `'Convenção, regimento, notificações e acordos, conduzidos por escritório de advocacia parceiro.'` | `'Convenção, regimento, notificações e acordos, com escritório de advocacia parceiro.'` |
| `gestaoPagina.mesa.momentos[4].texto` | `'Convocação, condução e ata, presencial ou digital.` | `'Convocação, assessoria na assembleia e ata, presencial ou digital.` |
| `gestaoPagina.mesa.momentos[5].titulo` | `'A manutenção tem rotina e orçamento comparado.'` | `'A manutenção tem rotina, cotação e orçamento.'` |
| `gestaoPagina.mesa.momentos[5].texto` | `'Manutenção preventiva e orçamentos de fornecedores comparados, para o síndico escolher com tudo à vista.'` | `'Manutenção preventiva, com cotações e orçamentos de fornecedores feitos pela Semog.'` |
| todas | `equipe da Semog conduz a migração` | `equipe da Semog assessora a migração` |
| todas | `equipe local conduz a migração` | `equipe local assessora a migração` |
| `contatoPagina.atalhos.segundaVia` | a linha `confirmar: 'A CONFIRMAR: rota da 2ª via no site novo',` | (removida; o atalho fica `segundaVia: { titulo: '2ª via de boleto', texto: 'Pelo CPF: um código chega no e-mail e os boletos em aberto aparecem.' }` e abre direto a 2ª via, Tarefa 4.16) |
| `garantePagina.abertura.fatos.custo.rotulo` | `'da arrecadação mensal total: é o custo do Garante'` | `'do valor total da arrecadação: é o custo do Garante'` |

(A troca de `proposta.whatsapp` são quatro linhas no arquivo, `whatsapp: {`, `url: …`, `texto: …` e `},`; sai o bloco inteiro.)

Depois das trocas, `rg -n -i "conduz|condução|com parceiro|mensal total|zera|wa\.me|confirmar" src/site/conteudo/conteudo.ts` só pode achar o comentário de abertura do arquivo (que fala em "A CONFIRMAR"). Se achar mais, ou a tabela não foi aplicada inteira, ou ela está incompleta: confira a linha achada contra a tabela e, se ela não estiver lá, pare e reporte ao controlador (não invente a troca).

3. `naoEncontrada` inteiro passa a ser:

```ts
  naoEncontrada: {
    rotulo: 'Erro 404',
    titulo: 'Não achamos',
    enfase: 'esta página.',
    texto:
      'O endereço pode ter mudado ou ter sido digitado com algum erro. Daqui, você chega aonde precisa:',
    links: {
      inicio: {
        titulo: 'Página inicial',
        texto: 'Há 35 anos, a líder do Nordeste cuida do condomínio para você cuidar da vida.',
      },
      unidades: { titulo: 'Unidades Semog', texto: 'Recife, João Pessoa, Campina Grande e Belém.' },
      proposta: {
        titulo: 'Pedir proposta',
        texto: 'Para o seu condomínio, personalizada e em até 24 horas úteis.',
      },
      blog: {
        titulo: 'Blog',
        texto: 'Conteúdo para síndicos, escrito por quem administra condomínios há 35 anos.',
      },
      // TEXTO-NOVO: o cliente chega à 2ª via pelo Contato (a 404 não tem "Sou cliente" no corpo, DP6)
      contato: {
        titulo: 'Fale com a gente',
        texto: 'Telefones e endereços das quatro Unidades, e a 2ª via do boleto para clientes.',
      },
    },
  },
```

(Os cinco caminhos e a ordem são os da 404 do protótipo: início, Unidades, proposta, blog, contato. Os textos dos cartões já existem no site: o subtítulo da marca, os atalhos do Contato, a seção Unidades e o blog da Comunidade; só o do Contato ganha a menção à 2ª via. Nenhum cartão "Sou cliente": a resposta do Leandro põe o gatilho só no cabeçalho, no rodapé e no Contato, e a 404 já tem os dois primeiros. O título "Não achamos esta página." é a resposta do Leandro: não afirma que a página existiu.)

4. Depois de `naoEncontrada`, antes do `} as const`:

```ts
  souCliente: {
    botao: 'Sou cliente',
    titulo: 'Sou cliente',
    // TEXTO-NOVO: frase de abertura do painel
    lead: 'Escolha o que você precisa.',
    segundaVia: {
      titulo: '2ª via do boleto',
      texto: 'Pelo CPF: um código chega no e-mail e os boletos em aberto aparecem.',
    },
    // TEXTO-NOVO: quando a 2ª via do site está desligada, ela sai pelo WhatsApp (como a triagem)
    segundaViaPeloWhatsApp: {
      titulo: '2ª via do boleto',
      texto: 'Peça a 2ª via à equipe da Semog pelo WhatsApp.',
    },
    // TEXTO-NOVO
    atendimento: {
      titulo: 'Atendimento ao condômino',
      texto: 'Fale com a equipe da Semog pelo WhatsApp.',
    },
    area: {
      titulo: 'Área do cliente',
      texto: 'Login de síndicos e condôminos.',
    },
  },
  solucoesPagina: {
    abertura: {
      antes: 'Tudo o que um condomínio precisa,',
      enfase: 'com uma equipe só.',
      lead: 'Gestão financeira, contábil e de pessoas, suporte jurídico com escritório parceiro, prestação de contas digital e o Semog Garante, para o condomínio receber 100% da arrecadação prevista.',
      botao: 'Pedir proposta',
    },
    tipos: [
      {
        id: 'residenciais',
        rotulo: 'Condomínios residenciais',
        titulo: 'O prédio funciona. O morador nem percebe.',
        texto:
          'Auxiliamos em toda a operação do condomínio para que síndico e moradores tenham uma única preocupação: viver bem. Financeiro em dia, funcionários cuidados, manutenção prevista e assembleias organizadas.',
        itens: [
          'Gestão financeira',
          'Cobrança e boletos',
          'Folha e RH do condomínio',
          'Assembleias',
          'Manutenção preventiva',
          'Seguros obrigatórios',
        ],
      },
      {
        id: 'comerciais',
        rotulo: 'Condomínios comerciais',
        titulo: 'Eficiência que valoriza o metro quadrado.',
        texto:
          'Edifícios corporativos e centros empresariais exigem previsibilidade de custos, rateios bem feitos e fornecedores acompanhados de perto. A Semog entrega relatórios gerenciais que o conselho entende e aprova.',
        itens: [
          'Rateios e provisões',
          'Gestão de contratos',
          'Relatórios gerenciais',
          'Compliance condominial',
          'Gestão de facilities',
          'Previsão orçamentária',
        ],
      },
      {
        id: 'associacoes',
        rotulo: 'Associações',
        titulo: 'Governança para comunidades inteiras.',
        texto:
          'Loteamentos, associações de moradores e clubes têm regras, receitas e desafios próprios. Organizamos contribuições e conselhos e, com escritório parceiro, estruturamos os estatutos.',
        itens: [],
      },
    ],
    porque: {
      titulo: 'O que muda com a Semog.',
      itens: [
        {
          valor: '24h',
          titulo: 'Resposta em um dia útil',
          texto: 'Demandas de síndicos e condôminos com prazo de resposta definido e cumprido.',
        },
        { valor: '', titulo: 'Acesso fácil aos sócios', texto: 'Regra da casa desde 1991.' },
        { valor: '35', titulo: 'Anos de mercado', texto: 'Solidez comprovada desde 1991.' },
        { valor: '', titulo: 'Equipes locais', texto: 'Presença física em quatro cidades.' },
        { valor: '100%', titulo: 'Digital', texto: 'Do boleto à assembleia, tudo online.' },
      ],
    },
    prestacao: {
      titulo: 'Prestação de contas digital, conferida antes de sair.',
      texto:
        'Digital desde 2023. A nova prestação de contas, lançada em maio de 2026, transforma o balancete em algo que qualquer condômino entende.',
      itens: [
        {
          titulo: 'Todos os documentos',
          texto: 'Notas, comprovantes e extratos anexados a cada lançamento.',
        },
        {
          titulo: 'Gráficos claros',
          texto: 'Receita, despesa e evolução do fundo de reserva em visual simples.',
        },
        {
          titulo: 'Assinatura digital',
          texto: 'Síndico e conselho assinam digitalmente e registram o parecer.',
        },
        {
          titulo: 'Sempre disponível',
          texto: 'O condômino confere a versão atual pelo link permanente ou pelo QR.',
        },
      ],
      link: 'Ver a Tecnologia',
    },
    garante: {
      titulo: 'Semog Garante.',
      texto:
        'O condomínio recebe 100% da arrecadação prevista, todos os meses. Se um condômino não paga, a Semog Garante paga o boleto ao condomínio e a equipe própria da Semog cobra quem atrasou. Uma parceria Semog e G5 Partners.',
      itens: [
        {
          titulo: 'O condomínio recebe tudo',
          texto: 'Todo mês, 100% da arrecadação prevista entra no caixa, com ou sem atrasos.',
        },
        {
          titulo: 'A cobrança fica com a equipe da Semog',
          texto: 'Quem atrasou recebe lembretes numa régua e, depois, proposta de acordo.',
        },
        {
          titulo: 'O orçamento vira certeza',
          texto:
            'Sem buracos no fluxo de caixa: obras, manutenção e melhorias saem do papel no prazo.',
        },
        {
          titulo: 'O síndico fica fora da cobrança',
          texto: 'Sem constrangimento com vizinhos e sem assembleia tensa por causa de devedores.',
        },
      ],
      custo: '1% do valor total da arrecadação, sem taxa de adesão.',
      link: 'Ver o Semog Garante',
    },
    aplicativo: {
      titulo: 'Um aplicativo que o morador usa de verdade.',
      texto:
        'O app da Semog concentra o dia a dia do condomínio numa interface simples, no bolso de cada morador.',
      itens: [
        { titulo: 'Boletos e 2ª via', texto: 'Histórico completo e pagamento na hora.' },
        { titulo: 'Reservas', texto: 'Salão de festas, churrasqueira e quadra.' },
        { titulo: 'Assembleias e votações', texto: 'Participação e voto de onde estiver.' },
        { titulo: 'Avisos', texto: 'Comunicados da administração no celular.' },
        { titulo: 'Ocorrências', texto: 'Registro e acompanhamento.' },
        { titulo: 'Documentos', texto: 'Convenção, atas e regulamentos sempre à mão.' },
      ],
    },
    tecnologia: {
      titulo: 'Software de dono, não de prateleira.',
      texto:
        'A Semog tem equipe de desenvolvimento própria. Em 2019, lançamos um chatbot de atendimento. Hoje, a operação roda na Semog One, a plataforma que construímos sobre o ERP, e ela evolui toda semana.',
      itens: [
        {
          titulo: 'Nova prestação de contas digital',
          texto: 'Lançada em maio de 2026: documentos anexados, gráficos e assinatura digital com parecer.',
          estado: 'No ar',
        },
        {
          titulo: 'Chatbot de atendimento',
          texto: 'Lançado em 2019, em evolução contínua.',
          estado: 'No ar',
        },
        {
          titulo: 'Gestão de manutenção',
          texto: 'Preventivas programadas, chamados e histórico por equipamento.',
          estado: 'Em desenvolvimento',
        },
      ],
      link: 'Ver a Tecnologia',
    },
    clube: {
      titulo: 'Clube de benefícios.',
      texto:
        'O clube de benefícios da Semog está sendo atualizado. Estamos criando novas soluções e novos parceiros para condomínios e moradores.',
    },
    perguntas: {
      titulo: 'Perguntas frequentes.',
      itens: [
        {
          pergunta: 'Em que a Semog assessora o condomínio?',
          resposta:
            'Atendemos condomínios residenciais, condomínios comerciais e associações de moradores ou loteamentos. Auxiliamos na gestão financeira, na contabilidade, no departamento pessoal, nas assembleias, na manutenção e nos seguros. A administração do condomínio cabe ao síndico, que decide e responde por ele; a Semog assessora e executa com método.',
        },
        {
          pergunta: 'Como funciona o Semog Garante?',
          resposta:
            'Em parceria com a G5 Partners, o condomínio recebe 100% da arrecadação prevista, todos os meses, mesmo com condôminos em atraso. A cobrança de quem atrasou é feita pela equipe própria da Semog, e o custo é de 1% do valor total da arrecadação.',
        },
        {
          pergunta: 'Como funciona a prestação de contas digital?',
          resposta:
            'Cada lançamento traz documentos e comprovantes anexados, os números viram gráficos fáceis de ler, e síndico e conselho assinam digitalmente com parecer. Qualquer condômino consulta a qualquer hora.',
        },
        {
          pergunta: 'Em quais cidades a Semog atua?',
          resposta:
            'Unidades em Recife (PE), João Pessoa (PB), Campina Grande (PB) e Belém (PA), com equipe local em cada cidade.',
        },
        {
          pergunta: 'Como migrar meu condomínio para a Semog?',
          resposta:
            'A equipe da Semog assessora a transição de ponta a ponta: documentos, comunicação aos condôminos e migração dos dados, sem interromper a operação do condomínio.',
        },
      ],
    },
  },
```

Nenhum desses textos é fato novo: vêm da `/solucoes` no ar (`content/pages/solucoes.ts`), reescritos pelas regras (saem "validade jurídica", "tempo real", "o único produto do mercado", "primeiro chatbot do setor", "quando a Semog assume", "nenhuma administradora do porte da Semog", "inadimplência zero", o WhatsApp, a "Gestão de Contratos · Previsto para 2026" sem fonte atual e o catálogo do clube), com as respostas do Leandro (clube, base do 1%, prestação desde 2023, cobrança pela equipe própria).

- [ ] **Step 7: Atualizar os testes que conhecem as chaves**

Em `tests/int/site-v2-conteudo.int.spec.ts`, no `toEqual` de `Object.keys(conteudo)`, acrescentar `'souCliente', 'solucoesPagina'` depois de `'naoEncontrada'`.

Em `tests/int/site-v2-identidade.int.spec.ts`, acrescentar `procurarRedacaoVedada` ao import de `./helpers/identidade` e, logo depois do teste `'nenhum texto do site v2 (src/site e src/app/(site)) usa termo vedado'`:

```ts
  it('nenhum TS/TSX do site v2 quebra uma regra de redação (conduz, assume, com parceiro, wa.me…)', () => {
    const achados = codigo.flatMap((a) =>
      procurarRedacaoVedada(readFileSync(a, 'utf8')).map((motivo) => `${relativo(a)}: ${motivo}`),
    )
    expect(achados).toEqual([])
  })
```

- [ ] **Step 8: Rodar e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-redacao.int.spec.ts tests/int/site-v2-pendencias.int.spec.ts tests/int/site-v2-conteudo.int.spec.ts tests/int/site-v2-identidade.int.spec.ts tests/int/site-v2-previa.int.spec.tsx tests/int/site-v2-inventario.int.spec.ts`
Expected: PASS.

Run: `pnpm exec tsc --noEmit`
Expected: zero erro. Nenhum arquivo de `src/` lê hoje `proposta.whatsapp`, `contatoPagina.atalhos.segundaVia`, `depoimentos.aviso`, `aSemog.pessoas.fotoAEnviar` nem `numeros.prestacoes.valor` (só o protótipo); se o `tsc` acusar alguma leitura, parar e reportar.

- [ ] **Step 9: Portões e commit**

Run: os cinco portões da CI. Expected: verdes.

```bash
git branch --show-current && git add src/site/conteudo/pendencias.ts src/site/secoes/comum/Pendencia.tsx src/site/conteudo/conteudo.ts tests/int/helpers/identidade.ts tests/int/site-v2-identidade.int.spec.ts tests/int/site-v2-conteudo.int.spec.ts tests/int/site-v2-redacao.int.spec.ts tests/int/site-v2-pendencias.int.spec.ts && git commit -m "feat(site-v2): respostas do Leandro no conteúdo, regras de redação e pendências que travam a virada

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
```

---

## Tarefa 4.2: Core — pendências de prazo da fase 1, gradiente Dinâmica e `error.tsx` do `(site)`

Cinco pendências do ledger da fase 1 com prazo nesta fase: tween só de callback contado como pausa (Task 1.4), `ctx.pronto` pendente para sempre se a página desmonta antes do load (Task 1.5), cena assíncrona que falha depois de um `await` mantém `aoRolar`/`lacoVisivel` (Task 1.6), `(site)` sem `error.tsx` (Task 1.7) e o registro único de cenas (comentário do `registro.ts`). Mais a porta do gradiente Dinâmica (WebGL), que só a cena dos princípios de A Semog usa.

**Files:**
- Modify: `src/site/core/patamares.ts`, `src/site/core/motion.ts`, `src/site/core/montagem.ts`, `src/site/core/util.ts`
- Create: `src/site/core/dinamica.ts`, `src/site/cenas/paginas/home.tsx` (só o ranking por enquanto; a 4.5 e a 4.6 estendem)
- Modify: `src/site/runner/RunnerDeCenas.tsx`, `src/site/cenas/registro.ts`, `src/site/layout/EsqueletoApp.tsx`, `src/app/(site)/(app)/previa-v2/page.tsx`
- Create: `src/app/(site)/error.tsx`, `src/site/secoes/comum/erro.css`
- Modify: `tests/int/site-v2-montagem.int.spec.tsx`, `tests/int/site-v2-core-ssr.int.spec.ts`, `tests/int/site-v2-previa.int.spec.tsx`
- Test: `tests/int/site-v2-core-fase4.int.spec.tsx`

**Interfaces:**
- Consumes: `ContextoCena`, `ListaCenas`, `montarPagina`, `registrarDesligamento`, `pausasDaTimeline`, `marcarMotionQuandoPronto` (fase 1).
- Produces:
  - `pausasDaTimeline` conta como movimento o tween com `vars.data === 'movimento'`.
  - `class DesmontadoAntesDoPronto extends Error` (`src/site/core/motion.ts`); `marcarMotionQuandoPronto().cancelar()` rejeita `pronto` com ela; a montagem nunca a reporta.
  - `ctx.util` de cada cena guarda na lista da cena os desligamentos de `aoRolar`, `lacoVisivel` e `registrarDesligamento`, inclusive os feitos depois de um `await`.
  - `criarDinamica(canvas: HTMLCanvasElement, opcoes?: OpcoesDinamica): Dinamica` (a mesma API do protótipo, tipada), reexportada em `util` com `type Dinamica` e `type OpcoesDinamica`.
  - `RunnerDeCenas({ pagina, cenas }: { pagina: string; cenas: ListaCenas })`.
  - `type IdPaginaApp = 'home' | 'semog' | 'gestao' | 'garante' | 'incorporadoras' | 'tecnologia' | 'solucoes'` e `CENAS_POR_PAGINA: Partial<Record<IdPaginaApp, ListaCenas>>` (`src/site/cenas/registro.ts`, só para testes).
  - `EsqueletoApp({ pagina, atual?, temProposta, cenas, children })`, com `pagina: IdPaginaApp` e `cenas: React.ReactNode`.
  - `CENAS_HOME: ListaCenas` (só `['ranking', cenaRanking]` nesta tarefa) e `CenasDaHome()` (`src/site/cenas/paginas/home.tsx`, `'use client'`; DP4).
  - `src/app/(site)/error.tsx`: `export default function ErroDoSite({ error, unstable_retry })`.

- [ ] **Step 1: Escrever os testes**

`tests/int/site-v2-core-fase4.int.spec.tsx`:

```tsx
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fireEvent, render, screen } from '@testing-library/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import ErroDoSite from '@/app/(site)/error'
import { montarPagina, type Reportar } from '@/site/core/montagem'
import { DesmontadoAntesDoPronto, marcarMotionQuandoPronto } from '@/site/core/motion'
import { pausasDaTimeline } from '@/site/core/patamares'
import { listarArquivos, listarSeExiste } from './helpers/identidade'

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))

class ResizeObserverFalso {
  observe = (): void => undefined
  unobserve = (): void => undefined
  disconnect = (): void => undefined
}

const semLenis = () => ({ lenis: null, desligar: () => undefined })

function paginaCarregando(): void {
  Object.defineProperty(document, 'readyState', { value: 'loading', configurable: true })
}

let reportar: Mock<Reportar>
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverFalso)
  reportar = vi.fn<Reportar>()
  document.body.innerHTML =
    '<header data-cabecalho data-tema="claro"></header><main><section id="a" data-tema="claro"></section></main>'
})
afterEach(() => {
  Reflect.deleteProperty(document, 'readyState')
  for (const gatilho of ScrollTrigger.getAll()) gatilho.kill()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('patamares: tween que só anima por onUpdate (Task 1.4 da fase 1)', () => {
  it('sem data "movimento" o tween de callback é pausa; com ela, é movimento', () => {
    const alvo = { x: 0 }
    const montar = (data?: string) =>
      gsap
        .timeline({ paused: true })
        .to(alvo, { x: 1, duration: 1 })
        .to({}, { duration: 1, onUpdate: () => undefined, ...(data ? { data } : {}) })
        .to(alvo, { x: 2, duration: 1 })
    expect(pausasDaTimeline(montar())).toEqual([0, 0.5, 1])
    expect(pausasDaTimeline(montar('movimento'))).toEqual([0, 1])
  })

  it('toda cena portada marca o tween de callback (receita C8)', () => {
    const raiz = path.join(process.cwd(), 'src', 'site', 'cenas')
    const semMarca = listarArquivos(raiz, ['.ts']).flatMap((arquivo) => {
      const fonte = readFileSync(arquivo, 'utf8').replace(/\r\n?/g, '\n')
      return Array.from(fonte.matchAll(/\.(?:to|fromTo)\(\s*\{\s*\}\s*,\s*\{([^}]*)\}/g))
        .filter(([, opcoes]) => opcoes.includes('onUpdate') && !opcoes.includes("data: 'movimento'"))
        .map(() => path.relative(process.cwd(), arquivo))
    })
    expect(semMarca).toEqual([])
  })
})

describe('motion: desmontar antes do load (Task 1.5 da fase 1)', () => {
  it('cancelar rejeita o pronto com DesmontadoAntesDoPronto, em vez de deixá-lo pendente', async () => {
    paginaCarregando()
    const motion = marcarMotionQuandoPronto()
    motion.cancelar()
    await expect(motion.pronto).rejects.toBeInstanceOf(DesmontadoAntesDoPronto)
    expect(document.documentElement.classList.contains('motion')).toBe(false)
  })

  it('a cena que espera o pronto não vai ao Sentry quando a página desmonta antes', async () => {
    paginaCarregando()
    const desmontar = montarPagina(
      [
        [
          'a',
          async (ctx) => {
            await ctx.pronto
          },
        ],
      ],
      { reportar, criarLenis: semLenis },
    )
    desmontar()
    await new Promise((resolver) => setTimeout(resolver, 0))
    expect(reportar).not.toHaveBeenCalled()
  })
})

describe('montagem: cena assíncrona que falha depois de um await (Task 1.6 da fase 1)', () => {
  it('desliga o aoRolar ligado depois do await e reporta a cena', async () => {
    const remover = vi.spyOn(window, 'removeEventListener')
    let liberar: () => void = () => undefined
    const espera = new Promise<void>((resolver) => {
      liberar = resolver
    })
    const desmontar = montarPagina(
      [
        [
          'a',
          async (ctx) => {
            await espera
            ctx.util.aoRolar(() => undefined)
            throw new Error('quebrou depois do await')
          },
        ],
      ],
      { reportar, criarLenis: semLenis },
    )
    liberar()
    await new Promise((resolver) => setTimeout(resolver, 0))
    expect(reportar).toHaveBeenCalledWith(expect.any(Error), 'cena:a')
    expect(remover).toHaveBeenCalledWith('scroll', expect.any(Function))
    desmontar()
  })
})

describe('error.tsx do (site) (Task 1.7 da fase 1)', () => {
  it('mostra a tela v2 com Tentar de novo e o início, e chama o retry', () => {
    const retry = vi.fn()
    render(<ErroDoSite error={new Error('teste')} unstable_retry={retry} />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Algo não carregou.')
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(retry).toHaveBeenCalledTimes(1)
    expect(
      screen.getByRole('link', { name: 'Ir para a página inicial' }).getAttribute('href'),
    ).toBe('/')
    // A tela substitui a página inteira (sem esqueleto): a seta só desenha com o símbolo aqui.
    expect(document.querySelector('symbol#seta')).not.toBeNull()
  })
})

describe('fronteira servidor → cliente das cenas (DP4)', () => {
  it('nenhum Server Component importa o RunnerDeCenas ou uma cena: só o módulo client da página', () => {
    // Função não atravessa a fronteira RSC: a lista de cenas escrita numa page.tsx derruba o
    // prerender no `pnpm build`, e o jsdom deste teste não acusaria. `import type` não conta.
    const raizes = [
      path.join(process.cwd(), 'src', 'app', '(site)'),
      path.join(process.cwd(), 'src', 'site', 'paginas'),
      path.join(process.cwd(), 'src', 'site', 'layout'),
    ]
    const acusados = raizes
      .flatMap((raiz) => listarSeExiste(raiz, ['.ts', '.tsx']))
      .filter((arquivo) => {
        const fonte = readFileSync(arquivo, 'utf8').replace(/\r\n?/g, '\n')
        if (/^'use client'/.test(fonte.trimStart())) return false
        return Array.from(fonte.matchAll(/^import ([^']*?) from '([^']+)'/gm)).some(
          ([, nomes, origem]) =>
            !nomes.startsWith('type ') &&
            /^@\/site\/(?:runner\/RunnerDeCenas$|cenas\/(?!paginas\/|registro$))/.test(origem),
        )
      })
      .map((arquivo) => path.relative(process.cwd(), arquivo))
    expect(acusados).toEqual([])
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-core-fase4.int.spec.tsx`
Expected: FAIL com "Failed to resolve import '@/app/(site)/error'" (e, criado o arquivo, "DesmontadoAntesDoPronto is not exported", a pausa falsa `[0, 0.5, 1]` no lugar de `[0, 1]`, o `removeEventListener('scroll')` que não acontece e a fronteira acusando `src/site/layout/EsqueletoApp.tsx`, que hoje importa o `RunnerDeCenas`).

- [ ] **Step 3: Patamares, motion e montagem**

1. `src/site/core/patamares.ts`, em `trechosAnimados`, a condição do `else if` passa a ser:

```ts
    } else if (
      filho.totalDuration() > 0 &&
      filho.vars.data !== 'respiro' &&
      (filho.vars.data === 'movimento' ||
        Object.keys(filho.vars).some((chave) => !CHAVES_DE_CONTROLE.has(chave)))
    ) {
```

e o comentário da função ganha a frase: `` `data: "movimento"` conta como movimento: é o tween que só anima por onUpdate (receita C8 da fase 4). ``

2. `src/site/core/motion.ts`: trocar `marcarMotionQuandoPronto` inteira por:

```ts
/** O `pronto` de uma página que desmontou antes do load: não é falha, e não vai ao Sentry. */
export class DesmontadoAntesDoPronto extends Error {
  constructor() {
    super('[motion] A página desmontou antes de ficar pronta.')
    this.name = 'DesmontadoAntesDoPronto'
  }
}

/**
 * Marca `html.motion` depois que fontes e assets chegaram e recalcula os gatilhos. Estado
 * inicial escondido fica no CSS sob `html.js:not(.motion)`. `cancelar` (desmonte) impede a marca
 * e rejeita `pronto` com `DesmontadoAntesDoPronto`: antes, a cena que esperava o `pronto` ficava
 * parada para sempre quando a página desmontava antes do load (StrictMode, navegação rápida).
 */
export function marcarMotionQuandoPronto(): { pronto: Promise<void>; cancelar: () => void } {
  let cancelado = false
  let teto = 0
  let rejeitar: (erro: DesmontadoAntesDoPronto) => void = () => undefined
  const cancelamento = new Promise<never>((_, recusar) => {
    rejeitar = recusar
  })
  const carregada = (async () => {
    await esperarCarregamento((id) => {
      teto = id
    })
    if (cancelado) throw new DesmontadoAntesDoPronto()
    document.documentElement.classList.add('motion')
    ScrollTrigger.refresh()
  })()
  const pronto = Promise.race([carregada, cancelamento])
  // Ninguém é obrigado a ouvir: sem estes dois, desmontar vira rejeição sem handler.
  carregada.catch(() => undefined)
  pronto.catch(() => undefined)
  return {
    pronto,
    cancelar: () => {
      cancelado = true
      window.clearTimeout(teto)
      rejeitar(new DesmontadoAntesDoPronto())
    },
  }
}
```

3. `src/site/core/montagem.ts`:
   - acrescentar `DesmontadoAntesDoPronto` ao import de `./motion`;
   - primeira linha de `tratarFalhaDeCena`: `if (erro instanceof DesmontadoAntesDoPronto) return`;
   - em `ligarAposCenas`, o segundo argumento do `then` passa a ser:

```ts
    (erro: unknown) => {
      if (!(erro instanceof DesmontadoAntesDoPronto)) reportar(erro, 'motion')
    },
```

   - antes de `montarCena`, acrescentar:

```ts
/**
 * O `util` de uma cena: igual ao do core, mas o que liga ouvinte ou laço guarda o desligamento
 * também na lista da cena, inclusive depois de um `await` (o coletor síncrono não vê isso). Se a
 * cena falhar depois, `neutralizarCena` desliga o que ela ligou (Task 1.6 da fase 1).
 */
function utilDaCena(guardar: (desligar: () => void) => void): typeof util {
  return {
    ...util,
    aoRolar: (...args: Parameters<typeof util.aoRolar>) => {
      const desligar = util.aoRolar(...args)
      guardar(desligar)
      return desligar
    },
    lacoVisivel: (...args: Parameters<typeof util.lacoVisivel>) => {
      const desligar = util.lacoVisivel(...args)
      guardar(desligar)
      return desligar
    },
    registrarDesligamento: (desligar: () => void) => {
      const umaVez = util.registrarDesligamento(desligar)
      guardar(umaVez)
      return umaVez
    },
  }
}
```

   - em `montarCena`, trocar a criação de `ctx` e de `cena` por:

```ts
  const desligamentosDaCena: Desligamentos = []
  const ctx: ContextoCena = {
    ...apoio.base,
    util: utilDaCena((desligar) => desligamentosDaCena.push(desligar)),
    root,
    reportar: (erro, parte) => {
      if (erro instanceof DesmontadoAntesDoPronto) return
      apoio.reportar(erro, `cena:${id}:${parte}`)
    },
  }
  const { retorno, erros, desligamentos } = executarInit(contexto, init, ctx)
  // Os síncronos chegam pelos dois caminhos; desligar duas vezes não faz nada (rodam uma vez só).
  desligamentosDaCena.push(...desligamentos)
  const cena: Cena = { id, root, contexto, desligamentos: desligamentosDaCena, marcas }
```

- [ ] **Step 4: Runner por prop, registro, esqueleto e a prévia provisória**

`src/site/runner/RunnerDeCenas.tsx` inteiro:

```tsx
'use client'

import { useGSAP } from '@gsap/react'
import * as Sentry from '@sentry/nextjs'
import { montarPagina } from '@/site/core/montagem'
import type { ListaCenas } from '@/site/core/tipos'

/**
 * Monta as cenas da página com o useGSAP (spec 3.1): o callback roda num gsap.context; os
 * contexts de cada seção, criados dentro dele, são revertidos no desmonte, e a função que
 * `montarPagina` devolve desliga Lenis, ticker e listeners. Renderiza nada. A lista vem do módulo
 * client da página (src/site/cenas/paginas), para o bundle levar só as cenas dela (DP4).
 */
export function RunnerDeCenas({ pagina, cenas }: { pagina: string; cenas: ListaCenas }) {
  useGSAP(
    () =>
      montarPagina(cenas, {
        reportar: (erro, origem) => {
          console.error(`[site v2] ${origem}`, erro)
          Sentry.captureException(erro, { tags: { pagina, origem } })
        },
      }),
    { dependencies: [pagina, cenas], revertOnUpdate: true },
  )
  return null
}
```

`src/site/cenas/registro.ts` inteiro:

```ts
import type { ListaCenas } from '@/site/core/tipos'

/** As páginas do pacote app. Cada uma tem a sua lista em src/site/cenas/paginas/<pagina>.tsx. */
export type IdPaginaApp =
  | 'home'
  | 'semog'
  | 'gestao'
  | 'garante'
  | 'incorporadoras'
  | 'tecnologia'
  | 'solucoes'

/**
 * As listas juntas, só para os testes (ordem das seções, SSR, paridade). As páginas não importam
 * daqui: cada uma usa o próprio módulo client (DP4 do plano da fase 4). Cada tarefa de página
 * acrescenta a sua entrada.
 */
export const CENAS_POR_PAGINA: Partial<Record<IdPaginaApp, ListaCenas>> = {}

export type IdPaginaComCenas = IdPaginaApp
```

`src/site/layout/EsqueletoApp.tsx`: trocar o import `import type { IdPaginaComCenas } from '@/site/cenas/registro'` por `import type { IdPaginaApp } from '@/site/cenas/registro'`, apagar o import do `RunnerDeCenas` e trocar `PropsEsqueleto` e a função por:

```tsx
type PropsEsqueleto = {
  /** Vai para `<main data-pagina>`. */
  pagina: IdPaginaApp
  atual?: IdNav
  /** A página tem a cena `#proposta`: "Seja Semog" e "Pedir proposta" vão para ela. */
  temProposta: boolean
  /** O runner da página (`<CenasDa… />`, de src/site/cenas/paginas). */
  cenas: React.ReactNode
  children: React.ReactNode
}

/** Esqueleto das páginas do pacote app (page.html do protótipo): cabeçalho, main, rodapé, runner. */
export function EsqueletoApp({ pagina, atual, temProposta, cenas, children }: PropsEsqueleto) {
  const destinoProposta = temProposta ? '#proposta' : '/proposta'
  return (
    <>
      <SimbolosSvg />
      <a className="pular" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Cabecalho atual={atual} destinoProposta={destinoProposta} />
      <main id="conteudo" data-pagina={pagina}>
        {children}
      </main>
      <Rodape destinoProposta={destinoProposta} />
      {cenas}
    </>
  )
}
```

`src/site/cenas/paginas/home.tsx` (nasce aqui, e não na 4.5: a lista de cenas é um array de funções e não pode ser escrita na `page.tsx`, que é Server Component; ver DP4):

```tsx
'use client'

import type { ListaCenas } from '@/site/core/tipos'
import { RunnerDeCenas } from '@/site/runner/RunnerDeCenas'
import { cenaRanking } from '../home/ranking'

/** Cenas da home, na ordem das seções (paginas/home.js do protótipo). A 4.5 e a 4.6 completam a lista. */
export const CENAS_HOME: ListaCenas = [['ranking', cenaRanking]]

/** O runner da home: a lista nasce aqui, do lado do cliente, e a página só passa o elemento. */
export function CenasDaHome() {
  return <RunnerDeCenas pagina="home" cenas={CENAS_HOME} />
}
```

`src/app/(site)/(app)/previa-v2/page.tsx` (provisório até a Tarefa 4.5, que a transforma na home): trocar o retorno por

```tsx
    <EsqueletoApp pagina="home" temProposta cenas={<CenasDaHome />}>
      <Ranking />
      <SecaoProposta />
    </EsqueletoApp>
```

com `import { CenasDaHome } from '@/site/cenas/paginas/home'` (nenhum import de cena nem do `RunnerDeCenas` na página: o teste da fronteira acusa). Em `tests/int/site-v2-core-ssr.int.spec.ts`, acrescentar a `MODULOS`: `['cenas da home', () => import('@/site/cenas/paginas/home')],`. Em `tests/int/site-v2-previa.int.spec.tsx`: `toBe('previa')` → `toBe('home')`; o teste "toda cena registrada para a prévia tem a sua seção na página" passa a iterar `for (const id of ['ranking'])`; o import de `CENAS_POR_PAGINA` sai.

Em `tests/int/site-v2-montagem.int.spec.tsx`: apagar o bloco `vi.mock('@/site/cenas/registro', …)` e trocar `<RunnerDeCenas pagina="previa" />` por:

```tsx
        <RunnerDeCenas
          pagina="teste"
          cenas={[
            [
              'a',
              (ctx) => {
                ctx.ScrollTrigger.create({ trigger: ctx.root })
              },
            ],
          ]}
        />
```

- [ ] **Step 5: Portar o gradiente Dinâmica**

`src/site/core/dinamica.ts`: porta de `PROTOTIPO\src\core\dinamica.js` (145 linhas) pela receita C. Mudanças, e só elas: `import { corDoToken } from "./cores.js"` → `import { corDoToken } from './util'`; a assinatura `export function criarDinamica(canvas: HTMLCanvasElement, opcoes: OpcoesDinamica = {}): Dinamica`, com `export type OpcoesDinamica` e `export type Dinamica` declarando exatamente os campos que o arquivo lê de `opcoes` e devolve (sem acrescentar nenhum); o shader `FRAG`, o vertex shader e todos os números ficam idênticos; sem contexto WebGL a função lança `new Error('[dinamica] WebGL indisponível.')` (quem chama mantém o fundo CSS `--grad-dinamica`, como no protótipo); laço de quadro que o arquivo crie passa por `registrarDesligamento` de `./ganchos`. Em `src/site/core/util.ts`, no bloco de reexport do topo, acrescentar `export { criarDinamica, type Dinamica, type OpcoesDinamica } from './dinamica'`. Em `tests/int/site-v2-core-ssr.int.spec.ts`, acrescentar a `MODULOS`: `['dinâmica', () => import('@/site/core/dinamica')],`.

- [ ] **Step 6: `error.tsx` do `(site)`**

`src/app/(site)/error.tsx`:

```tsx
'use client'

import '@/site/secoes/comum/erro.css'
import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { SimbolosSvg } from '@/site/layout/SimbolosSvg'

/**
 * Erro de renderização numa página do site v2 (DP14 do plano da fase 4). Fica dentro do layout
 * raiz (site): fontes e tokens valem. Substitui a página inteira, então não há cabeçalho e os
 * símbolos SVG vêm daqui (a seta do link). Vai ao Sentry e oferece tentar de novo
 * (unstable_retry, Next 16.2) ou voltar ao início.
 */
export default function ErroDoSite({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error, { tags: { origem: 'erro-do-site' } })
  }, [error])
  return (
    <main id="conteudo" className="erro-do-site" data-tema="claro">
      <SimbolosSvg />
      <div className="container">
        {/* TEXTO-NOVO */}
        <h1 className="erro-titulo">Algo não carregou.</h1>
        {/* TEXTO-NOVO */}
        <p className="erro-texto">Tente de novo. Se não der certo, volte ao início.</p>
        <div className="erro-acoes">
          <button className="botao" type="button" onClick={() => unstable_retry()}>
            Tentar de novo
          </button>
          <a className="link-seta" href="/">
            <span>Ir para a página inicial</span>
            <svg className="seta" aria-hidden="true">
              <use href="#seta" />
            </svg>
          </a>
        </div>
      </div>
    </main>
  )
}
```

`src/site/secoes/comum/erro.css`:

```css
/* Tela de erro de renderização do site v2 (src/app/(site)/error.tsx): título leve, uma frase e
   duas saídas. Sem animação: a página quebrou e precisa responder já. */
.erro-do-site {
  display: grid;
  align-content: center;
  min-height: 100svh;
  padding-block: var(--e6);
  background: var(--branco);
  color: var(--texto);
}
.erro-do-site .erro-titulo {
  font-family: var(--fonte-titulo);
  font-size: var(--t-h2);
  font-weight: var(--peso-titulo);
  letter-spacing: var(--tracking-titulo);
  line-height: var(--lh-titulo);
  color: var(--marinho);
}
.erro-do-site .erro-texto {
  margin-top: var(--e3);
  max-width: 44ch;
  font-size: var(--t-lead);
  font-weight: 300;
}
.erro-do-site .erro-acoes {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--e3) var(--e4);
  margin-top: var(--e5);
}
```

- [ ] **Step 7: Rodar e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-core-fase4.int.spec.tsx tests/int/site-v2-montagem.int.spec.tsx tests/int/site-v2-core-ssr.int.spec.ts tests/int/site-v2-previa.int.spec.tsx tests/int/site-v2-util.int.spec.ts tests/int/site-v2-layout.int.spec.tsx`
Expected: PASS. A varredura C8 passa com zero arquivo acusado (o ranking não tem tween de callback); ela passa a valer a cada cena portada.

- [ ] **Step 8: Portões e commit**

Run: os cinco portões. Expected: verdes.

```bash
git branch --show-current && git add src/site/core/patamares.ts src/site/core/motion.ts src/site/core/montagem.ts src/site/core/util.ts src/site/core/dinamica.ts src/site/runner/RunnerDeCenas.tsx src/site/cenas/registro.ts src/site/cenas/paginas/home.tsx src/site/layout/EsqueletoApp.tsx "src/app/(site)/error.tsx" src/site/secoes/comum/erro.css "src/app/(site)/(app)/previa-v2/page.tsx" tests/int/site-v2-core-fase4.int.spec.tsx tests/int/site-v2-montagem.int.spec.tsx tests/int/site-v2-core-ssr.int.spec.ts tests/int/site-v2-previa.int.spec.tsx && git commit -m "feat(site-v2): core com as pendências de prazo da fase 1, Dinâmica e erro do (site)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
```

---

## Tarefa 4.3: Seção de proposta "Metades" (cena 08), com as pendências visuais da fase 2

A `SecaoProposta` da fase 2 é uma grade simples; o protótipo fecha toda página com a cena 08 ("Metades": convite no véu lavanda 38,2% e o pedido 61,8%), com entrada por máscara. Esta tarefa porta a marcação, o CSS e a cena, e resolve as duas pendências visuais do ledger da fase 2 (vão a 390 entre "Continuar" e o aviso da verificação; título da falha focado sem anel).

**Files:**
- Modify: `src/site/secoes/proposta/SecaoProposta.tsx`, `src/site/secoes/proposta/proposta.css` (substituído pelo CSS da cena 08)
- Modify: `src/site/formularios/proposta/FormularioProposta.tsx`, `src/site/formularios/proposta/campos.tsx`, `src/site/formularios/proposta/formulario-proposta.css`
- Create: `src/site/cenas/proposta.ts`
- Modify: `tests/int/site-v2-core-ssr.int.spec.ts`
- Test: `tests/int/site-v2-proposta-secao.int.spec.tsx`

**Interfaces:**
- Consumes: `FormularioProposta` (fase 2), `PERFIS`, `type Perfil` (`src/lib/propostaDuasEtapas/schema.ts`), `ContextoCena`.
- Produces:
  - `SecaoProposta({ ufInicial?: string; perfilInicial?: Perfil })`: `<section id="proposta" class="cena proposta-metades" data-tema="claro">`.
  - `FormularioProposta({ id, ufInicial?, classe?: string, comEntrada?: boolean, perfilInicial?: Perfil })`: `classe` vai para o `<form>` ao lado de `formulario-proposta`; `comEntrada` põe `entrada` no título e nos campos da etapa 1; `perfilInicial` marca a opção na etapa 2 quando a URL não traz `?perfil=` (a URL vence).
  - `CamposDaEtapa1({ id, erros, uf, entrar? })`.
  - `cenaProposta(ctx: ContextoCena): void` (`src/site/cenas/proposta.ts`), registrada por último em toda página do pacote app.

- [ ] **Step 1: Escrever o teste**

`tests/int/site-v2-proposta-secao.int.spec.tsx`:

```tsx
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { conteudo } from '@/site/conteudo/conteudo'
import { SecaoProposta } from '@/site/secoes/proposta/SecaoProposta'
import { diferencasNaoDeclaradas, SEM_DIFERENCA, secaoDoPrototipo } from './helpers/prototipo'

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))
vi.mock('@/app/(site)/_actions/proposta-duas-etapas', () => ({
  enviarEtapa1: vi.fn(),
  enviarEtapa2: vi.fn(),
  enviarPropostaCompleta: vi.fn(),
}))
vi.mock('@/components/forms/Turnstile', () => ({ Turnstile: () => null }))

describe('seção de proposta "Metades" (cena 08 do protótipo)', () => {
  it('tem a marcação do protótipo, com o formulário da fase 2 no lugar do formulário demonstrativo', () => {
    const { container } = render(<SecaoProposta />)
    const secao = container.querySelector('section#proposta')
    expect(secao).not.toBeNull()
    expect(
      diferencasNaoDeclaradas(secao as Element, secaoDoPrototipo('08-proposta'), {
        ignorar: ['form', '.fp-moldura'],
        comClasses: ['proposta-metades'],
      }),
    ).toEqual(SEM_DIFERENCA)
    expect(secao?.querySelector('.proposta-titulo')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      conteudo.proposta.titulo,
    )
  })

  it('o formulário entra por cascata: título e campos da etapa 1 com .entrada, a etapa 2 sem', () => {
    const { container } = render(<SecaoProposta />)
    const form = container.querySelector('form.formulario-proposta.proposta-form')
    expect(form).not.toBeNull()
    expect(form?.querySelector('.fp-titulo.entrada')).not.toBeNull()
    expect(form?.querySelectorAll('[data-etapa="1"] .fp-campo.entrada')).toHaveLength(4)
    expect(form?.querySelectorAll('[data-etapa="2"] .entrada')).toHaveLength(0)
  })

  it('perfilInicial marca a opção da etapa 2 quando a URL não traz ?perfil', () => {
    window.history.replaceState(null, '', '/')
    const { container } = render(<SecaoProposta perfilInicial="construtora" />)
    const opcao = container.querySelector<HTMLInputElement>(
      'input[name="perfil"][value="construtora"]',
    )
    expect(opcao?.checked).toBe(true)
  })

  it('a URL vence o perfil inicial', () => {
    window.history.replaceState(null, '', '/?perfil=sindico')
    const { container } = render(<SecaoProposta perfilInicial="construtora" />)
    expect(
      container.querySelector<HTMLInputElement>('input[name="perfil"][value="sindico"]')?.checked,
    ).toBe(true)
    window.history.replaceState(null, '', '/')
  })

  it('o CSS da cena 08 vale só para a seção Metades (a página /proposta também tem #proposta)', () => {
    const css = readFileSync(
      path.join(process.cwd(), 'src', 'site', 'secoes', 'proposta', 'proposta.css'),
      'utf8',
    ).replace(/\r\n?/g, '\n')
    expect(css).toContain('#proposta.proposta-metades')
    expect(css.replace(/#proposta\.proposta-metades/g, '')).not.toMatch(/#proposta\b/)
  })

  it('pendências visuais da fase 2: sem vão a 390 e anel no título da falha', () => {
    const css = readFileSync(
      path.join(
        process.cwd(),
        'src',
        'site',
        'formularios',
        'proposta',
        'formulario-proposta.css',
      ),
      'utf8',
    ).replace(/\r\n?/g, '\n')
    expect(css).toMatch(/\.fp-falha-titulo:focus-visible\s*\{[^}]*outline:/)
    expect(css).toMatch(/@media \(max-width: 760px\)\s*\{\s*html\.js \.formulario-proposta:not\(\[data-transicao\]\)/)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-proposta-secao.int.spec.tsx`
Expected: FAIL com "Failed to resolve import './helpers/prototipo'". O helper nasce na Tarefa 4.4; para esta tarefa rodar antes, crie agora o arquivo `tests/int/helpers/prototipo.ts` com o conteúdo do Step 1 da Tarefa 4.4 (é o mesmo arquivo; a 4.4 só o usa). Depois disso: FAIL por diferença de classes (`proposta-convite`, `proposta-convite-texto`, `proposta-metade-form`, `linha`, `linha-interna`, `entrada`, `peso`, `titulo-display` faltam) e pelos testes de `.entrada`, perfil e CSS.

- [ ] **Step 3: Formulário com classe, entrada e perfil inicial**

1. `src/site/formularios/proposta/campos.tsx`:
   - `PropsCampoTexto` ganha `entrar?: boolean`; em `CampoTexto`, `<div className="fp-campo">` → `<div className={entrar ? 'fp-campo entrada' : 'fp-campo'}>`;
   - `SeletorDeUf({ id, erro, uf, entrar }: { id: string; erro?: string; uf: Uf; entrar?: boolean })`, com o mesmo `className` condicional;
   - `CamposDaEtapa1({ id, erros, uf, entrar }: { id: string; erros: Erros; uf: Uf; entrar?: boolean })` passa `entrar={entrar}` aos quatro campos (nome do condomínio, estado, telefone, e-mail). A etapa 2 não muda.

2. `src/site/formularios/proposta/FormularioProposta.tsx`:
   - acrescentar `type Perfil` ao import de `@/lib/propostaDuasEtapas/schema`;
   - `type PropsFormulario = { id: string; ufInicial?: string; classe?: string; comEntrada?: boolean; perfilInicial?: Perfil }`;
   - `usePerfilDaUrl` passa a ser:

```tsx
/**
 * `?perfil=construtora` pré-marca a etapa 2 (spec 4.1); valor fora da lista é ignorado. Sem
 * `?perfil`, vale o `perfilInicial` da página (Incorporadoras chega com "Construtora" marcado).
 */
function usePerfilDaUrl(formRef: RefObject<HTMLFormElement | null>, perfilInicial?: Perfil) {
  useEffect(() => {
    const daUrl = new URLSearchParams(window.location.search).get('perfil')
    const perfil = daUrl && PERFIS.some((p) => p === daUrl) ? daUrl : perfilInicial
    if (!perfil) return
    const opcao = formRef.current?.querySelector<HTMLInputElement>(
      `input[name="perfil"][value="${perfil}"]`,
    )
    if (opcao) opcao.checked = true
  }, [formRef, perfilInicial])
}
```

   - `export function FormularioProposta({ id, ufInicial = '', classe, comEntrada = false, perfilInicial }: PropsFormulario)`; `usePerfilDaUrl(formRef, perfilInicial)`; no `<form>`, `className={classe ? \`formulario-proposta ${classe}\` : 'formulario-proposta'}`; o título `<p id={\`${id}-titulo\`} className={comEntrada ? 'fp-titulo entrada' : 'fp-titulo'}>`; `<CamposDaEtapa1 … entrar={comEntrada} />`.

3. `src/site/formularios/proposta/formulario-proposta.css`, no fim:

```css
/* Pendências visuais da fase 2 (verificação 2.7). Em tela estreita, a etapa inativa sai da célula
   fora da troca: as duas etapas dividiam a mesma altura, e a 390 sobrava um vão entre o
   "Continuar" e o aviso da verificação. Na troca (data-transicao) as duas voltam para a cortina. */
@media (max-width: 760px) {
  html.js .formulario-proposta:not([data-transicao]):not([data-etapa-ativa="2"]) .fp-etapa[data-etapa="2"],
  html.js .formulario-proposta:not([data-transicao])[data-etapa-ativa="2"] .fp-etapa[data-etapa="1"] {
    display: none;
  }
}
/* O título da falha recebe o foco (o botão que enviou ficou desativado): anel para quem usa teclado. */
.fp-falha-titulo:focus-visible {
  outline: 2px solid var(--fp-tinta);
  outline-offset: 4px;
}
```

- [ ] **Step 4: Seção e CSS da cena 08**

1. CSS: copiar e escopar (a página `/proposta` também tem `<section id="proposta">`, e o Next pode juntar CSS de rotas no mesmo arquivo):

```powershell
$origem = 'C:\Users\lekoc\semogapp\semogsite-site-v2\design-explorations\site-v2-prototipo\src\scenes\08-proposta.css'
$destino = 'C:\Users\lekoc\semogapp\semogsite-site-v2\src\site\secoes\proposta\proposta.css'
$css = [System.IO.File]::ReadAllText($origem) -replace '#proposta\b', '#proposta.proposta-metades'
[System.IO.File]::WriteAllText($destino, $css, (New-Object System.Text.UTF8Encoding $false))
```

Abrir o arquivo e conferir que o comentário de abertura não ficou com `#proposta.proposta-metades` no meio de uma frase de modo estranho; se ficou, reescrever a frase.

2. `src/site/secoes/proposta/SecaoProposta.tsx` inteiro:

```tsx
import './proposta.css'
import type { Perfil } from '@/lib/propostaDuasEtapas/schema'
import { FormularioProposta } from '@/site/formularios/proposta/FormularioProposta'

type PropsSecaoProposta = { ufInicial?: string; perfilInicial?: Perfil }

/**
 * Pedido de proposta "Metades" (cena 08 do protótipo): o convite no véu lavanda, à esquerda, e o
 * pedido em duas etapas, à direita. Fecha toda página do pacote app e da leitura. O título é o de
 * `conteudo.proposta.titulo` ("Seja Semog."), em duas linhas por máscara, como no protótipo.
 */
export function SecaoProposta({ ufInicial, perfilInicial }: PropsSecaoProposta) {
  return (
    <section
      id="proposta"
      className="cena proposta-metades"
      data-tema="claro"
      aria-labelledby="proposta-titulo"
    >
      <div className="proposta-convite">
        <div className="proposta-convite-texto">
          <h2 id="proposta-titulo" className="proposta-titulo titulo-display">
            <span className="linha">
              <span className="linha-interna entrada">Seja</span>
            </span>{' '}
            <span className="linha">
              <span className="linha-interna entrada">
                <em className="peso">Semog.</em>
              </span>
            </span>
          </h2>
        </div>
      </div>
      <div className="proposta-metade-form">
        <FormularioProposta
          id="proposta-form"
          classe="proposta-form"
          comEntrada
          ufInicial={ufInicial}
          perfilInicial={perfilInicial}
        />
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Portar a cena 08**

`src/site/cenas/proposta.ts`: porta de `PROTOTIPO\src\scenes\08-proposta.js` (104 linhas) pela receita C, exportando `cenaProposta(ctx: ContextoCena): void`. Desvios: nenhum na coreografia; `convite`, `entradaFormulario` e `subir` ficam funções do módulo, tipadas (`tl: gsap.core.Timeline`, `alvo: Element`, `em: number`); `.proposta-chamada` ausente segue como no protótipo (o `if (chamada instanceof HTMLElement)`). Em `tests/int/site-v2-core-ssr.int.spec.ts`, acrescentar a `MODULOS`: `['cena proposta', () => import('@/site/cenas/proposta')],`.

- [ ] **Step 6: Rodar e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-proposta-secao.int.spec.tsx tests/int/site-v2-formulario-proposta.int.spec.tsx tests/int/site-v2-previa.int.spec.tsx tests/int/site-v2-leitura-paginas.int.spec.tsx tests/int/site-v2-core-ssr.int.spec.ts tests/int/site-v2-identidade.int.spec.ts`
Expected: PASS. Se `site-v2-formulario-proposta` falhar por classe do `<form>` ou do título, o teste da fase 2 lia `className` exato: trocar a asserção dele para `classList.contains('formulario-proposta')` e registrar no commit.

- [ ] **Step 7: Portões e commit**

Run: os cinco portões. Expected: verdes.

```bash
git branch --show-current && git add src/site/secoes/proposta/SecaoProposta.tsx src/site/secoes/proposta/proposta.css src/site/formularios/proposta/FormularioProposta.tsx src/site/formularios/proposta/campos.tsx src/site/formularios/proposta/formulario-proposta.css src/site/cenas/proposta.ts tests/int/helpers/prototipo.ts tests/int/site-v2-proposta-secao.int.spec.tsx tests/int/site-v2-core-ssr.int.spec.ts && git commit -m "feat(site-v2): pedido de proposta Metades (cena 08) e as pendências visuais da fase 2

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
```

---

## Tarefa 4.4: Prévia que navega dentro dela, metadados institucionais e as ferramentas de teste das páginas

**Files:**
- Create: `src/site/rotas.ts`, `src/site/estilo.ts`, `src/site/seo/institucional.ts`, `src/site/secoes/comum/JsonLd.tsx`
- Modify: `src/site/leitura/rotas.ts`, `src/site/layout/Cabecalho.tsx`, `src/site/layout/Rodape.tsx`, `src/site/seo/og.ts`
- Create: `tests/int/helpers/prototipo.ts` (se a Tarefa 4.3 ainda não criou), `tests/int/helpers/paginas.ts`
- Modify: `tests/int/site-v2-layout.int.spec.tsx`, `tests/int/site-v2-og.int.spec.ts`
- Test: `tests/int/site-v2-rotas.int.spec.ts`

**Interfaces:**
- Consumes: `VIRADA_1_FEITA`, `entradaDe` (`src/site/inventario.ts`), `buildMetadata`, `getPageJsonLd` (`src/lib/seo.ts`), `pages` (`content/pages`), `site` (`content/site.ts`), `ROBOTS_DA_PREVIA` (`src/site/previa.ts`), `rotasDoApp` (`tests/int/helpers/rotas-app.ts`).
- Produces:
  - `src/site/rotas.ts`: `PREFIXO_DA_PREVIA: string` (`'/previa-v2'` antes da virada, `''` depois); `PAGINAS_NA_PREVIA: ReadonlySet<string>` (hoje `/blog`, `/privacidade`, `/termos`; cada tarefa de página acrescenta a sua); `caminhoNoSite(href: string): string`; `semPrefixoDaPrevia(href: string): string`.
  - `src/site/estilo.ts`: `comIndice(i: number): CSSProperties`.
  - `src/site/seo/institucional.ts`: `type PaginaInstitucional = 'home' | 'semog' | 'administracao-de-condominios' | 'garante' | 'incorporadoras' | 'tecnologia' | 'solucoes' | 'proposta' | 'contato'`; `META_DA_TECNOLOGIA: { title: string; description: string }`; `TITULO_DO_CONTATO: string` (o Contato do v2 sem a promessa de WhatsApp no título); `metadadosInstitucionais(pagina: PaginaInstitucional): Metadata`; `jsonLdInstitucional(pagina: PaginaInstitucional): Record<string, unknown> | null`.
  - `<JsonLd dados={Record<string, unknown> | null} />`.
  - `tests/int/helpers/prototipo.ts`: `secaoDoPrototipo(arquivo: string): Element`, `assinatura(raiz: Element): Assinatura`, `diferencasNaoDeclaradas(renderizada: Element, prototipo: Element, declaradas?: Diferencas): Resultado`, `SEM_DIFERENCA`, `type Diferencas`.
  - `tests/int/helpers/paginas.ts`: `type SecaoEsperada = { id: string; arquivo: string | null; diferencas?: Diferencas }`; `conferirPagina(pagina: ReactElement, conferencia: { dataPagina: string; secoes: readonly SecaoEsperada[]; cenas?: ListaCenas }): HTMLElement`.

- [ ] **Step 1: Os helpers de teste**

`tests/int/helpers/prototipo.ts`:

```ts
import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * Paridade com o protótipo (DP2 do plano da fase 4): a seção que o Next renderiza precisa ter as
 * mesmas classes, ids e atributos `data-*` da parcial HTML do protótipo, cada classe (e cada
 * etiqueta de bloco: parágrafo, item de lista, título, imagem) na mesma quantidade e na mesma
 * ordem de documento. Texto e atributos de valor não entram (o texto mudou de propósito com as
 * respostas do Leandro); quem confere o visual são os quadros no navegador.
 */
const SECOES = path.join(
  process.cwd(),
  'design-explorations',
  'site-v2-prototipo',
  'src',
  'sections',
)

export type Assinatura = { classes: string[]; ids: string[]; dados: string[] }
export type Resultado = {
  faltam: Assinatura
  sobram: Assinatura
  /** Classe ou etiqueta comum aos dois lados com quantidade diferente: `"x: N no protótipo, M aqui"`. */
  contagem: string[]
  /** Onde a sequência das classes e etiquetas comuns diverge pela primeira vez; `null` = mesma ordem. */
  ordem: string | null
}
export type Diferencas = {
  /** Seletores cujas subárvores saem dos dois lados (ex.: o formulário, componente da fase 2). */
  ignorar?: readonly string[]
  semClasses?: readonly string[]
  comClasses?: readonly string[]
  semIds?: readonly string[]
  comIds?: readonly string[]
  semDados?: readonly string[]
  comDados?: readonly string[]
  /**
   * Classes (`'x'`) ou etiquetas (`'<p>'`) cuja quantidade muda de propósito (uma lista do
   * conteúdo que ficou de outro tamanho por resposta do Leandro). Cada uma leva o motivo num
   * comentário na tarefa; sem motivo, a diferença é perda na porta e se corrige a porta.
   */
  contagemLivre?: readonly string[]
}

const VAZIA: Assinatura = { classes: [], ids: [], dados: [] }
export const SEM_DIFERENCA: Resultado = { faltam: VAZIA, sobram: VAZIA, contagem: [], ordem: null }

/** Etiquetas de bloco que contam e ordenam junto com as classes (um parágrafo ou item perdido). */
const ETIQUETAS_CONTADAS = new Set(['p', 'li', 'h1', 'h2', 'h3', 'h4', 'dt', 'dd', 'figure', 'img'])

/** As classes de cada elemento (em ordem alfabética dentro dele) e a etiqueta, se contada, em ordem de documento. */
function marcasEmOrdem(raiz: Element): string[] {
  return [raiz, ...Array.from(raiz.querySelectorAll('*'))].flatMap((el) => {
    const etiqueta = el.tagName.toLowerCase()
    const classes = Array.from(el.classList).sort()
    return ETIQUETAS_CONTADAS.has(etiqueta) ? [`<${etiqueta}>`, ...classes] : classes
  })
}

function contar(marcas: readonly string[]): Map<string, number> {
  const contagem = new Map<string, number>()
  for (const marca of marcas) contagem.set(marca, (contagem.get(marca) ?? 0) + 1)
  return contagem
}

/**
 * Quantidade e ordem (R2: mesmos elementos, na mesma ordem). O conjunto de classes não vê um item
 * perdido de lista nem dois blocos trocados de lugar; a contagem de cada marca comum e a sequência
 * delas veem. Marca declarada em `semClasses`, `comClasses` ou `contagemLivre` fica de fora.
 */
function contagemEOrdem(
  nossa: Element,
  dele: Element,
  declaradas: Diferencas,
): Pick<Resultado, 'contagem' | 'ordem'> {
  const fora = new Set([
    ...(declaradas.semClasses ?? []),
    ...(declaradas.comClasses ?? []),
    ...(declaradas.contagemLivre ?? []),
  ])
  const marcasNossas = marcasEmOrdem(nossa)
  const marcasDele = marcasEmOrdem(dele)
  const quantasNossas = contar(marcasNossas)
  const quantasDele = contar(marcasDele)
  const comuns = [...quantasDele.keys()].filter((m) => quantasNossas.has(m) && !fora.has(m)).sort()
  const contagem = comuns
    .filter((m) => quantasNossas.get(m) !== quantasDele.get(m))
    .map((m) => `${m}: ${quantasDele.get(m)} no protótipo, ${quantasNossas.get(m)} aqui`)
  const ordenaveis = new Set(comuns.filter((m) => quantasNossas.get(m) === quantasDele.get(m)))
  const sequenciaDele = marcasDele.filter((m) => ordenaveis.has(m))
  const sequenciaNossa = marcasNossas.filter((m) => ordenaveis.has(m))
  const i = sequenciaDele.findIndex((m, k) => m !== sequenciaNossa[k])
  const ordem =
    i === -1
      ? null
      : `posição ${i}: "${sequenciaDele[i]}" no protótipo, "${sequenciaNossa[i]}" aqui, depois de "${sequenciaDele.slice(Math.max(0, i - 3), i).join(' ')}"`
  return { contagem, ordem }
}

/** A `<section>` de uma parcial do protótipo, sem comentários e sem as marcas de laço. */
export function secaoDoPrototipo(arquivo: string): Element {
  const html = readFileSync(path.join(SECOES, `${arquivo}.html`), 'utf8')
    .replace(/\r\n?/g, '\n')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\{\{[#/][^}]*\}\}/g, '')
  const documento = new DOMParser().parseFromString(
    `<!doctype html><body>${html}</body>`,
    'text/html',
  )
  const secao = documento.body.querySelector('section')
  if (!secao) throw new Error(`[protótipo] ${arquivo}.html sem <section>.`)
  return secao
}

function semIgnorados(raiz: Element, ignorar: readonly string[]): Element {
  const copia = raiz.cloneNode(true)
  if (!(copia instanceof Element)) throw new Error('[protótipo] a cópia não é um elemento.')
  for (const seletor of ignorar) {
    for (const el of Array.from(copia.querySelectorAll(seletor))) el.remove()
  }
  return copia
}

export function assinatura(raiz: Element): Assinatura {
  const classes = new Set<string>()
  const ids = new Set<string>()
  const dados = new Set<string>()
  for (const el of [raiz, ...Array.from(raiz.querySelectorAll('*'))]) {
    for (const classe of Array.from(el.classList)) classes.add(classe)
    if (el.id && !el.id.includes('{{')) ids.add(el.id)
    for (const { name } of Array.from(el.attributes)) {
      if (name.startsWith('data-')) dados.add(name)
    }
  }
  const ordenar = (conjunto: Set<string>) => [...conjunto].sort()
  return { classes: ordenar(classes), ids: ordenar(ids), dados: ordenar(dados) }
}

/** O que falta ou sobra na seção renderizada, menos o que a tarefa declarou. */
export function diferencasNaoDeclaradas(
  renderizada: Element,
  prototipo: Element,
  declaradas: Diferencas = {},
): Resultado {
  const ignorar = declaradas.ignorar ?? []
  const renderizadaSemIgnorados = semIgnorados(renderizada, ignorar)
  const prototipoSemIgnorados = semIgnorados(prototipo, ignorar)
  const nossa = assinatura(renderizadaSemIgnorados)
  const dele = assinatura(prototipoSemIgnorados)
  const menos = (de: string[], tirar: string[], aceitos: readonly string[] = []) =>
    de.filter((valor) => !tirar.includes(valor) && !aceitos.includes(valor))
  return {
    ...contagemEOrdem(renderizadaSemIgnorados, prototipoSemIgnorados, declaradas),
    faltam: {
      classes: menos(dele.classes, nossa.classes, declaradas.semClasses),
      ids: menos(dele.ids, nossa.ids, declaradas.semIds),
      dados: menos(dele.dados, nossa.dados, declaradas.semDados),
    },
    sobram: {
      classes: menos(nossa.classes, dele.classes, declaradas.comClasses),
      ids: menos(nossa.ids, dele.ids, declaradas.comIds),
      dados: menos(nossa.dados, dele.dados, declaradas.comDados),
    },
  }
}
```

`tests/int/helpers/paginas.ts`:

```ts
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { expect } from 'vitest'
import type { ListaCenas } from '@/site/core/tipos'
import { entradaDe, VIRADA_1_FEITA } from '@/site/inventario'
import { PAGINAS_NA_PREVIA, PREFIXO_DA_PREVIA, semPrefixoDaPrevia } from '@/site/rotas'
import { procurarRedacaoVedada, procurarTermosVedados } from './identidade'
import {
  type Diferencas,
  diferencasNaoDeclaradas,
  SEM_DIFERENCA,
  secaoDoPrototipo,
} from './prototipo'

/** Uma seção da página: o id, a parcial do protótipo (null = sem protótipo) e o que difere. */
export type SecaoEsperada = { id: string; arquivo: string | null; diferencas?: Diferencas }

type Conferencia = { dataPagina: string; secoes: readonly SecaoEsperada[]; cenas?: ListaCenas }

/**
 * O que toda página do site v2 precisa cumprir: o `<main>` certo, as seções na ordem do
 * protótipo e com a marcação dele, cada cena com a sua seção, nenhum termo vedado nem regra de
 * redação quebrada, todo WhatsApp marcado como atendimento, toda âncora com alvo e todo link
 * interno numa página do inventário (e, antes da virada, dentro da prévia quando ela existe lá).
 */
export function conferirPagina(pagina: ReactElement, conferencia: Conferencia): HTMLElement {
  const { dataPagina, secoes, cenas } = conferencia
  const { container } = render(pagina)
  const main = container.querySelector('main#conteudo')
  expect(main?.getAttribute('data-pagina')).toBe(dataPagina)
  const ids = Array.from(main?.querySelectorAll(':scope > section') ?? []).map((s) => s.id)
  expect(ids).toEqual(secoes.map((s) => s.id))
  if (cenas) {
    const daCena = cenas.map(([id]) => id)
    expect(daCena).toEqual(ids.filter((id) => daCena.includes(id)))
    expect(daCena.every((id) => ids.includes(id))).toBe(true)
  }
  for (const secao of secoes) {
    const el = container.querySelector(`section#${secao.id}`)
    if (!el || !secao.arquivo) continue
    expect(
      diferencasNaoDeclaradas(el, secaoDoPrototipo(secao.arquivo), secao.diferencas),
      secao.arquivo,
    ).toEqual(SEM_DIFERENCA)
  }
  const texto = container.textContent ?? ''
  expect(procurarTermosVedados(texto)).toEqual([])
  expect(procurarRedacaoVedada(texto)).toEqual([])
  conferirLinks(container)
  return container
}

function conferirLinks(container: HTMLElement): void {
  for (const a of Array.from(container.querySelectorAll('a[href]'))) {
    const href = a.getAttribute('href') ?? ''
    if (/wa\.me|whatsapp/i.test(href)) {
      expect(a.getAttribute('data-wa-caminho'), href).toMatch(/^(cliente|restrita)$/)
    }
    if (href.startsWith('#') && href.length > 1) {
      expect(document.getElementById(decodeURIComponent(href.slice(1))), href).not.toBeNull()
    }
    if (!href.startsWith('/') || href.startsWith('/site-v2/')) continue
    const caminho = semPrefixoDaPrevia(href).split(/[?#]/)[0] || '/'
    expect(entradaDe(caminho)?.tipo, href).toBe('pagina')
    if (!VIRADA_1_FEITA && PAGINAS_NA_PREVIA.has(caminho)) {
      expect(href.startsWith(PREFIXO_DA_PREVIA), `${href} sai da prévia`).toBe(true)
    }
  }
}
```

- [ ] **Step 2: Escrever o teste das rotas e dos metadados**

`tests/int/site-v2-rotas.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { generateMetadata } from '@/app/(frontend)/[[...slug]]/page'
import { VIRADA_1_FEITA } from '@/site/inventario'
import { PREFIXO_DA_LEITURA } from '@/site/leitura/rotas'
import {
  caminhoNoSite,
  PAGINAS_NA_PREVIA,
  PREFIXO_DA_PREVIA,
  semPrefixoDaPrevia,
} from '@/site/rotas'
import { tituloDoOg } from '@/site/seo/og'
import {
  jsonLdInstitucional,
  META_DA_TECNOLOGIA,
  metadadosInstitucionais,
  type PaginaInstitucional,
  TITULO_DO_CONTATO,
} from '@/site/seo/institucional'
import { rotasDoApp } from './helpers/rotas-app'

describe('caminhoNoSite: a prévia navega dentro dela (DP3)', () => {
  it('antes da virada, página que existe na prévia ganha o prefixo; as outras vão à URL real', () => {
    expect(VIRADA_1_FEITA).toBe(false)
    expect(PREFIXO_DA_PREVIA).toBe('/previa-v2')
    expect(PREFIXO_DA_LEITURA).toBe(PREFIXO_DA_PREVIA)
    expect(caminhoNoSite('/blog')).toBe('/previa-v2/blog')
    expect(caminhoNoSite('/blog/g20-superlogica-next-2026')).toBe(
      '/previa-v2/blog/g20-superlogica-next-2026',
    )
    expect(caminhoNoSite('/administradora-de-condominios-recife')).toBe(
      '/administradora-de-condominios-recife',
    )
    expect(caminhoNoSite('#proposta')).toBe('#proposta')
    expect(caminhoNoSite('https://semog.superlogica.net/x')).toBe('https://semog.superlogica.net/x')
  })

  it('hash e query ficam no lugar', () => {
    expect(caminhoNoSite('/privacidade#cookies')).toBe('/previa-v2/privacidade#cookies')
    expect(caminhoNoSite('/blog?categoria=financas')).toBe('/previa-v2/blog?categoria=financas')
  })

  it('semPrefixoDaPrevia devolve a URL real', () => {
    expect(semPrefixoDaPrevia('/previa-v2')).toBe('/')
    expect(semPrefixoDaPrevia('/previa-v2#unidades')).toBe('/#unidades')
    expect(semPrefixoDaPrevia('/previa-v2/semog')).toBe('/semog')
    expect(semPrefixoDaPrevia('/semog')).toBe('/semog')
  })

  it('toda página listada na prévia tem a rota dela em src/app/(site)', () => {
    const rotas = rotasDoApp()
      .filter((r) => r.arquivo === 'page')
      .map((r) => `/${r.segmentos.join('/')}`)
    for (const caminho of PAGINAS_NA_PREVIA) {
      const naPrevia = caminho === '/' ? '/previa-v2' : `/previa-v2${caminho}`
      expect(rotas, caminho).toContain(naPrevia)
    }
  })
})

describe('metadados das páginas institucionais', () => {
  const EXISTENTES: PaginaInstitucional[] = [
    'home',
    'semog',
    'administracao-de-condominios',
    'garante',
    'incorporadoras',
    'solucoes',
    'proposta',
  ]

  it.each(EXISTENTES)('%s: o mesmo <head> que o site no ar monta hoje (spec 6)', async (pagina) => {
    const slug = pagina === 'home' ? undefined : [pagina]
    const noAr = await generateMetadata({ params: Promise.resolve({ slug }) })
    expect(metadadosInstitucionais(pagina)).toEqual(noAr)
  })

  it('contato: o <head> de hoje, menos o título, que não promete WhatsApp (decisão de 16/10/2026)', async () => {
    const noAr = await generateMetadata({ params: Promise.resolve({ slug: ['contato'] }) })
    const meta = metadadosInstitucionais('contato')
    expect(meta.title).toBe(TITULO_DO_CONTATO)
    expect(String(meta.title)).not.toMatch(/whatsapp/i)
    expect(meta.description).toBe(noAr.description)
    expect(meta.alternates).toEqual(noAr.alternates)
    expect(meta.robots).toEqual(noAr.robots)
  })

  it('tecnologia, URL nova: título e descrição do protótipo, canonical próprio, card OG com título', () => {
    const meta = metadadosInstitucionais('tecnologia')
    expect(meta.title).toBe(META_DA_TECNOLOGIA.title)
    expect(meta.description).toBe(META_DA_TECNOLOGIA.description)
    expect(meta.alternates?.canonical).toBe('https://www.semog.com.br/tecnologia')
    expect(tituloDoOg('/tecnologia')).toBe(META_DA_TECNOLOGIA.title)
  })

  it('JSON-LD: Organization na home, BreadcrumbList nas demais', () => {
    expect(JSON.stringify(jsonLdInstitucional('home'))).toContain('"Organization"')
    expect(JSON.stringify(jsonLdInstitucional('tecnologia'))).toContain('"BreadcrumbList"')
    expect(JSON.stringify(jsonLdInstitucional('tecnologia'))).toContain('Tecnologia')
  })
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-rotas.int.spec.ts`
Expected: FAIL com "Failed to resolve import '@/site/rotas'".

- [ ] **Step 4: `rotas.ts`, `estilo.ts`, `institucional.ts` e `JsonLd.tsx`**

`src/site/rotas.ts`:

```ts
import { VIRADA_1_FEITA } from './inventario'

/**
 * Prefixo das páginas do site v2 enquanto elas vivem na prévia. Vira '' na virada 1 (fase 5), no
 * mesmo commit que leva as rotas às URLs reais (VIRADA_1_FEITA = true).
 */
export const PREFIXO_DA_PREVIA: string = VIRADA_1_FEITA ? '' : '/previa-v2'

/**
 * Páginas que já existem na prévia. Cada tarefa da fase 4 acrescenta a sua quando a rota nasce
 * (o teste site-v2-rotas exige a rota); o blog e os documentos vieram na fase 3. Depois da virada
 * a lista não importa: tudo vai à URL real.
 */
export const PAGINAS_NA_PREVIA: ReadonlySet<string> = new Set(['/blog', '/privacidade', '/termos'])

function existeNaPrevia(caminho: string): boolean {
  if (PAGINAS_NA_PREVIA.has(caminho)) return true
  return caminho.startsWith('/blog/') && PAGINAS_NA_PREVIA.has('/blog')
}

/**
 * Link interno do site v2 (DP3 do plano da fase 4): antes da virada, a página que existe na prévia
 * abre na prévia (o verificador navega entre páginas novas); as outras abrem a URL real. Hash e
 * query ficam no lugar. Âncora da mesma página e URL externa passam direto.
 */
export function caminhoNoSite(href: string): string {
  if (PREFIXO_DA_PREVIA === '' || !href.startsWith('/')) return href
  const partes = /^([^?#]*)(.*)$/.exec(href)
  const caminho = partes?.[1] || '/'
  const resto = partes?.[2] ?? ''
  if (!existeNaPrevia(caminho)) return href
  return `${PREFIXO_DA_PREVIA}${caminho === '/' ? '' : caminho}${resto}`
}

/** A URL real de um link da prévia (para conferir contra o inventário). */
export function semPrefixoDaPrevia(href: string): string {
  if (PREFIXO_DA_PREVIA === '') return href
  if (href === PREFIXO_DA_PREVIA) return '/'
  const depois = href.slice(PREFIXO_DA_PREVIA.length)
  if (href.startsWith(PREFIXO_DA_PREVIA) && /^[#?]/.test(depois)) return `/${depois}`
  if (href.startsWith(`${PREFIXO_DA_PREVIA}/`)) return depois
  return href
}
```

`src/site/leitura/rotas.ts`: trocar `import { VIRADA_1_FEITA } from '@/site/inventario'` e a linha do `PREFIXO_DA_LEITURA` por:

```ts
import { PREFIXO_DA_PREVIA } from '@/site/rotas'

/** Prefixo das páginas de leitura: o mesmo da prévia (fase 4, DP3). */
export const PREFIXO_DA_LEITURA: string = PREFIXO_DA_PREVIA
```

`src/site/estilo.ts`:

```ts
import type { CSSProperties } from 'react'

/** `style="--i: N"` do protótipo: o índice que escalona a entrada de CSS de cada item. */
export function comIndice(i: number): CSSProperties {
  // `as`: CSSProperties não lista variáveis CSS; o React aplica a chave '--i' como custom property.
  return { '--i': i } as CSSProperties
}
```

`src/site/seo/institucional.ts`:

```ts
import type { Metadata } from 'next'
import { pages } from '@/../content/pages'
import { site } from '@/../content/site'
import { buildMetadata, getPageJsonLd } from '@/lib/seo'
import type { PageData } from '@/types/content'

export type PaginaInstitucional =
  | 'home'
  | 'semog'
  | 'administracao-de-condominios'
  | 'garante'
  | 'incorporadoras'
  | 'tecnologia'
  | 'solucoes'
  | 'proposta'
  | 'contato'

/** /tecnologia é URL nova: título e descrição do protótipo (`paginas.json`), aprovados com ele. */
export const META_DA_TECNOLOGIA = {
  title: 'Tecnologia · Semog One, a plataforma própria da Semog',
  description:
    'Semog One, a plataforma própria da Semog, construída sobre o ERP. Um mês de condomínio: 2ª via pelo site e pelo WhatsApp, cobrança com equipe própria, assembleias digitais e prestação de contas conferida.',
} as const

/**
 * O título do Contato no ar ("telefone e WhatsApp das quatro unidades") promete um WhatsApp que o
 * Contato do v2 não oferece a quem não é cliente (spec 5). Decisão de 16/10/2026: o v2 usa este
 * título, e o resto do `meta` é o de hoje. O site no ar, inclusive o card OG de /contato (rota
 * `src/app/[slug]/opengraph-image.tsx`), só muda na virada, quando o `meta` vem para cá.
 */
export const TITULO_DO_CONTATO = 'Contato Semog: telefones e endereços das quatro Unidades'

/**
 * A página em `content/pages` que guarda o `meta` de hoje. Até a virada 1 o site atual serve
 * essas URLs com esse `meta`, e as páginas novas usam o mesmo (spec 6: metadata mantida). Na
 * virada, o `meta` vem para cá junto com a rota, como na fase 3.
 */
function documento(pagina: PaginaInstitucional): PageData {
  if (pagina === 'tecnologia') {
    return { slug: 'tecnologia', title: 'Tecnologia', meta: { ...META_DA_TECNOLOGIA }, layout: [] }
  }
  const doc = pages[pagina]
  if (!doc) throw new Error(`[institucional] content/pages sem a página "${pagina}".`)
  if (pagina === 'contato') return { ...doc, meta: { ...doc.meta, title: TITULO_DO_CONTATO } }
  return doc
}

/** O `<head>` da página: o mesmo que o catch-all `[[...slug]]` monta hoje (teste site-v2-rotas). */
export function metadadosInstitucionais(pagina: PaginaInstitucional): Metadata {
  return buildMetadata({ doc: documento(pagina), settings: site, path: pagina })
}

/** JSON-LD da página: Organization na home, BreadcrumbList nas demais (`getPageJsonLd`). */
export function jsonLdInstitucional(pagina: PaginaInstitucional): Record<string, unknown> | null {
  return getPageJsonLd({ page: documento(pagina), path: pagina })
}
```

`src/site/secoes/comum/JsonLd.tsx`:

```tsx
/** JSON-LD da página, serializado por nós a partir de dado estático. */
export function JsonLd({ dados }: { dados: Record<string, unknown> | null }) {
  if (!dados) return null
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD serializado por nós, do conteúdo estático
      dangerouslySetInnerHTML={{ __html: JSON.stringify(dados) }}
    />
  )
}
```

`src/site/seo/og.ts`: acrescentar `import { META_DA_TECNOLOGIA } from './institucional'` e, em `tituloDoOg`, antes da linha `const pagina = pages[…]`: `if (caminho === '/tecnologia') return META_DA_TECNOLOGIA.title`. Em `tests/int/site-v2-og.int.spec.ts`, acrescentar ao fim do primeiro `describe`:

```ts
  it('a URL nova /tecnologia tem título próprio no card (a fase 4 a tira do content/pages)', () => {
    expect(tituloDoOg('/tecnologia')).toBe('Tecnologia · Semog One, a plataforma própria da Semog')
  })
```

- [ ] **Step 5: Cabeçalho e rodapé pelos caminhos da prévia**

`src/site/layout/Cabecalho.tsx`: acrescentar `import { caminhoNoSite } from '@/site/rotas'`; em `Links`, `href={caminhoNoSite(item.href)}`; o logo `href={caminhoNoSite('/')}`; os dois links de Unidades `href={caminhoNoSite('/#unidades')}`; o "Seja Semog" `href={destinoProposta === '#proposta' ? '#proposta' : caminhoNoSite('/proposta')}`.

`src/site/layout/Rodape.tsx`: acrescentar o mesmo import; o logo `href={caminhoNoSite('/')}`; cada link de `LINKS_SEMOG` `href={caminhoNoSite(link.href)}`; "Pedir proposta" `href={destinoProposta === '#proposta' ? '#proposta' : caminhoNoSite('/proposta')}`; "Telefones e endereços" `href={caminhoNoSite('/contato')}`; Privacidade e Termos `href={caminhoNoSite('/privacidade')}` e `href={caminhoNoSite('/termos')}`. Os links das cidades (`unidade.url`) ficam como estão (as landings são da fase 6).

`tests/int/site-v2-layout.int.spec.tsx`: acrescentar `import { caminhoNoSite, semPrefixoDaPrevia } from '@/site/rotas'`; na função `linksInternos`, `.map((a) => semPrefixoDaPrevia(a.getAttribute('href') ?? ''))`; as asserções de `href` exato do cabeçalho e do rodapé passam por `caminhoNoSite`: `toBe('/proposta')` → `toBe(caminhoNoSite('/proposta'))` e `toEqual(['/', '/'])` → `toEqual([caminhoNoSite('/'), caminhoNoSite('/')])`. O teste do `global-error` (`href="/"`) não muda.

- [ ] **Step 6: Rodar e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-rotas.int.spec.ts tests/int/site-v2-layout.int.spec.tsx tests/int/site-v2-og.int.spec.ts tests/int/site-v2-leitura-dados.int.spec.ts tests/int/site-v2-leitura-paginas.int.spec.tsx tests/int/site-v2-previa.int.spec.tsx tests/int/site-v2-proposta-secao.int.spec.tsx`
Expected: PASS. Se o teste `%s: o mesmo <head>` falhar só por uma chave que o `generateMetadata` do catch-all monta e o `buildMetadata` direto não (o catch-all usa `getSiteSettings()`, que devolve o `site`), parar e reportar: a premissa de `<head>` idêntico por construção (DP4 da fase 3) não vale e precisa de decisão.

- [ ] **Step 7: Portões e commit**

Run: os cinco portões. Expected: verdes.

```bash
git branch --show-current && git add src/site/rotas.ts src/site/estilo.ts src/site/seo/institucional.ts src/site/secoes/comum/JsonLd.tsx src/site/leitura/rotas.ts src/site/layout/Cabecalho.tsx src/site/layout/Rodape.tsx src/site/seo/og.ts tests/int/helpers/prototipo.ts tests/int/helpers/paginas.ts tests/int/site-v2-rotas.int.spec.ts tests/int/site-v2-layout.int.spec.tsx tests/int/site-v2-og.int.spec.ts && git commit -m "feat(site-v2): prévia que navega dentro dela, metadados institucionais e paridade com o protótipo

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
```

---

## Tarefa 4.5: Home, parte 1 — rota, abertura, condomínios, pilares, ranking e Unidades

A rota `/previa-v2` deixa de ser a bancada da fundação e passa a ser a home. Esta tarefa porta cinco das oito cenas (a tecnologia e a comunidade, as mais longas, ficam para a 4.6).

**Files:**
- Create (seções, pela receita R): `src/site/secoes/home/Abertura.tsx` + `abertura.css` (de `PROTOTIPO\src\sections\01-abertura.html` e `scenes\01-abertura.css`), `Condominios.tsx` + `condominios.css` (`02-condominios`), `Pilares.tsx` + `pilares.css` (`03-pilares`), `Unidades.tsx` + `unidades.css` (`06-unidades`). `Ranking.tsx` já existe (fase 1).
- Create (cenas, pela receita C): `src/site/cenas/home/abertura.ts` (`cenaAbertura`, de `scenes\01-abertura.js`), `condominios.ts` (`cenaCondominios`, `02-condominios.js`), `pilares.ts` (`cenaPilares`, `03-pilares.js`), `unidades.ts` (`cenaUnidades`, `06-unidades.js`).
- Create: `src/site/paginas/home.tsx`
- Modify: `src/site/cenas/paginas/home.tsx` (criado na 4.2 só com o ranking), `src/app/(site)/(app)/previa-v2/page.tsx`, `src/site/cenas/registro.ts`, `src/site/rotas.ts`, `tests/int/site-v2-core-ssr.int.spec.ts`, `tests/int/site-v2-previa.int.spec.tsx`
- Test: `tests/int/site-v2-pagina-home.int.spec.tsx`

**Interfaces:**
- Consumes: `EsqueletoApp` e `IdPaginaApp` (4.2), `SecaoProposta` e `cenaProposta` (4.3), `caminhoNoSite`, `comIndice`, `metadadosInstitucionais`, `jsonLdInstitucional`, `JsonLd`, `conferirPagina` (4.4), `FormularioProposta` (com `classe` e `comEntrada`, 4.3), `Ranking` e `cenaRanking` (fase 1), `RunnerDeCenas` (4.2).
- Produces: `Abertura()`, `Condominios()`, `Pilares()`, `Unidades()`; `cenaAbertura`, `cenaCondominios`, `cenaPilares`, `cenaUnidades` (todas `(ctx: ContextoCena) => …` com o retorno do protótipo); `CENAS_HOME: ListaCenas` e `CenasDaHome()` (`src/site/cenas/paginas/home.tsx`, `'use client'`); `PaginaHome()` (`src/site/paginas/home.tsx`); `CENAS_POR_PAGINA.home`; `'/'` em `PAGINAS_NA_PREVIA`.

Desvios desta página (o resto é a receita, sem mudança):
- **Abertura:** o `<form>` demonstrativo da parcial (linhas 45 a 248) não é portado; no lugar, `<FormularioProposta id="abertura-form" classe="abertura-form" comEntrada />`, que tem o mesmo título ("Peça uma proposta", `TEXTOS.titulo`) e os mesmos campos. A cena procura `.abertura-form .entrada`, que o componente agora tem.
- **Ranking:** já portado; nada muda.
- **Unidades:** os links das cidades usam `unidade.url` (landings da fase 6, URL real).

- [ ] **Step 1: Escrever o teste da página**

`tests/int/site-v2-pagina-home.int.spec.tsx`:

```tsx
import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Pagina, { metadata } from '@/app/(site)/(app)/previa-v2/page'
import { CENAS_HOME } from '@/site/cenas/paginas/home'
import { conteudo } from '@/site/conteudo/conteudo'
import { conferirPagina, type SecaoEsperada } from './helpers/paginas'

vi.mock('@/site/runner/RunnerDeCenas', () => ({ RunnerDeCenas: () => null }))
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))
vi.mock('@/app/(site)/_actions/proposta-duas-etapas', () => ({
  enviarEtapa1: vi.fn(),
  enviarEtapa2: vi.fn(),
  enviarPropostaCompleta: vi.fn(),
}))
vi.mock('@/components/forms/Turnstile', () => ({ Turnstile: () => null }))

afterEach(() => {
  vi.unstubAllEnvs()
})

const FORMULARIO = ['form', '.fp-moldura'] as const

const SECOES: SecaoEsperada[] = [
  { id: 'abertura', arquivo: '01-abertura', diferencas: { ignorar: FORMULARIO } },
  { id: 'condominios', arquivo: '02-condominios' },
  { id: 'pilares', arquivo: '03-pilares' },
  { id: 'ranking', arquivo: '05-ranking' },
  { id: 'unidades', arquivo: '06-unidades' },
  {
    id: 'proposta',
    arquivo: '08-proposta',
    diferencas: { ignorar: FORMULARIO, comClasses: ['proposta-metades'] },
  },
]

describe('home do site v2 na prévia', () => {
  it('em produção responde 404 e nunca é indexada', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false })
    vi.stubEnv('VERCEL_ENV', 'production')
    expect(() => Pagina()).toThrow('NEXT_HTTP_ERROR_FALLBACK;404')
  })

  it('reproduz as seções do protótipo, na ordem, com as cenas certas', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    conferirPagina(<Pagina />, { dataPagina: 'home', secoes: SECOES, cenas: CENAS_HOME })
  })

  it('a abertura traz o pedido de proposta de verdade, e o h1 é o slogan', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    const container = conferirPagina(<Pagina />, { dataPagina: 'home', secoes: SECOES })
    expect(container.querySelector('#abertura form.formulario-proposta.abertura-form')).not.toBeNull()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(container.querySelectorAll('#unidades a[href^="/administradora-de-condominios-"]')).toHaveLength(
      conteudo.unidades.length,
    )
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-pagina-home.int.spec.tsx`
Expected: FAIL: a página só tem `ranking` e `proposta` (as seções `abertura`, `condominios`, `pilares` e `unidades` faltam na ordem esperada), e `CENAS_HOME` só tem o ranking.

- [ ] **Step 3: Copiar o CSS das cenas**

```powershell
$p = 'C:\Users\lekoc\semogapp\semogsite-site-v2\design-explorations\site-v2-prototipo\src\scenes'
$d = 'C:\Users\lekoc\semogapp\semogsite-site-v2\src\site\secoes\home'
Copy-Item -LiteralPath "$p\01-abertura.css" -Destination "$d\abertura.css"
Copy-Item -LiteralPath "$p\02-condominios.css" -Destination "$d\condominios.css"
Copy-Item -LiteralPath "$p\03-pilares.css" -Destination "$d\pilares.css"
Copy-Item -LiteralPath "$p\06-unidades.css" -Destination "$d\unidades.css"
```

- [ ] **Step 4: Portar as quatro seções e as quatro cenas**

Pela receita (R1 a R7, C1 a C9), com os desvios listados acima. Cada TSX importa o próprio CSS na primeira linha. Ao terminar cada cena, conferir que nenhum `console.error`/`console.warn` sobrou (`rg -n "console\." src/site/cenas/home`): todos viraram `ctx.reportar`.

- [ ] **Step 5: Lista de cenas, corpo da página, rota e registro**

`src/site/cenas/paginas/home.tsx` inteiro (estende o da 4.2):

```tsx
'use client'

import type { ListaCenas } from '@/site/core/tipos'
import { RunnerDeCenas } from '@/site/runner/RunnerDeCenas'
import { cenaAbertura } from '../home/abertura'
import { cenaCondominios } from '../home/condominios'
import { cenaPilares } from '../home/pilares'
import { cenaRanking } from '../home/ranking'
import { cenaUnidades } from '../home/unidades'
import { cenaProposta } from '../proposta'

/** Cenas da home, na ordem das seções (paginas/home.js do protótipo). A 4.6 acrescenta tecnologia e comunidade. */
export const CENAS_HOME: ListaCenas = [
  ['abertura', cenaAbertura],
  ['condominios', cenaCondominios],
  ['pilares', cenaPilares],
  ['ranking', cenaRanking],
  ['unidades', cenaUnidades],
  ['proposta', cenaProposta],
]

export function CenasDaHome() {
  return <RunnerDeCenas pagina="home" cenas={CENAS_HOME} />
}
```

`src/site/paginas/home.tsx`:

```tsx
import { CenasDaHome } from '@/site/cenas/paginas/home'
import { EsqueletoApp } from '@/site/layout/EsqueletoApp'
import { JsonLd } from '@/site/secoes/comum/JsonLd'
import { Abertura } from '@/site/secoes/home/Abertura'
import { Condominios } from '@/site/secoes/home/Condominios'
import { Pilares } from '@/site/secoes/home/Pilares'
import { Ranking } from '@/site/secoes/home/Ranking'
import { Unidades } from '@/site/secoes/home/Unidades'
import { SecaoProposta } from '@/site/secoes/proposta/SecaoProposta'
import { jsonLdInstitucional } from '@/site/seo/institucional'

/** Corpo da home do site v2 (index.html do protótipo). A virada 1 leva este corpo a "/". */
export function PaginaHome() {
  return (
    <EsqueletoApp pagina="home" temProposta cenas={<CenasDaHome />}>
      <JsonLd dados={jsonLdInstitucional('home')} />
      <Abertura />
      <Condominios />
      <Pilares />
      <Ranking />
      <Unidades />
      <SecaoProposta />
    </EsqueletoApp>
  )
}
```

`src/app/(site)/(app)/previa-v2/page.tsx` inteiro:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PaginaHome } from '@/site/paginas/home'
import { previaLiberada, ROBOTS_DA_PREVIA } from '@/site/previa'
import { metadadosInstitucionais } from '@/site/seo/institucional'

export const metadata: Metadata = { ...metadadosInstitucionais('home'), robots: ROBOTS_DA_PREVIA }

/** A home do site v2 na prévia (substitui a bancada da fundação). 404 em produção. */
export default function Pagina() {
  if (!previaLiberada()) notFound()
  return <PaginaHome />
}
```

`src/site/cenas/registro.ts`: acrescentar `import { CENAS_HOME } from './paginas/home'` e trocar o objeto vazio por `{ home: CENAS_HOME }`.

`src/site/rotas.ts`: `PAGINAS_NA_PREVIA` passa a `new Set(['/', '/blog', '/privacidade', '/termos'])`.

`tests/int/site-v2-core-ssr.int.spec.ts`, em `MODULOS`:

```ts
  ['cena abertura', () => import('@/site/cenas/home/abertura')],
  ['cena condomínios', () => import('@/site/cenas/home/condominios')],
  ['cena pilares', () => import('@/site/cenas/home/pilares')],
  ['cena unidades', () => import('@/site/cenas/home/unidades')],
```

(`['cenas da home', …]` já entrou na 4.2.)

`tests/int/site-v2-previa.int.spec.tsx`: o título do teste `'nunca é indexada'` continua valendo; os demais já rodam sobre a home desde a 4.2. Trocar o nome do describe `'rota de prévia do site v2'` por `'rota de prévia do site v2 (home)'`.

- [ ] **Step 6: Rodar e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-pagina-home.int.spec.tsx tests/int/site-v2-previa.int.spec.tsx tests/int/site-v2-core-ssr.int.spec.ts tests/int/site-v2-core-fase4.int.spec.tsx tests/int/site-v2-rotas.int.spec.ts tests/int/site-v2-identidade.int.spec.ts tests/int/site-v2-layout.int.spec.tsx`
Expected: PASS. Uma diferença de paridade aponta a classe, o id ou o `data-*` que a porta perdeu: corrigir a porta, não a lista de diferenças. Só entra em `diferencas` o desvio desta tarefa.

- [ ] **Step 7: Olhar no navegador antes de commitar**

Run (da WT): `pnpm dev` e abrir `http://localhost:3000/previa-v2` em 1440 e 390. Rolar a página inteira: abertura, condomínios (pin), pilares (pin), ranking (pin), Unidades e proposta aparecem e animam; o console não tem erro. Isto não substitui a verificação da 4.9: é para o implementador não entregar uma cena morta.

- [ ] **Step 8: Portões e commit**

Run: os cinco portões. Expected: verdes.

```bash
git branch --show-current && git add src/site/secoes/home src/site/cenas/home src/site/cenas/paginas/home.tsx src/site/paginas/home.tsx "src/app/(site)/(app)/previa-v2/page.tsx" src/site/cenas/registro.ts src/site/rotas.ts tests/int/site-v2-core-ssr.int.spec.ts tests/int/site-v2-previa.int.spec.tsx tests/int/site-v2-pagina-home.int.spec.tsx && git commit -m "feat(site-v2): home na prévia com abertura, condomínios, pilares, ranking e Unidades

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
```

(`git add src/site/secoes/home` inclui o `Ranking.tsx` e o `ranking.css` da fase 1 sem mudança: o `git diff --cached --stat` não pode mostrá-los.)

---

## Tarefa 4.5a: Vídeo do Semog Experience 26 (arquivo, capa, conteúdo do v2 e a troca na `/experience`)

Roda entre a 4.5 e a 4.6, no PR 4a. Decisão do Leandro de 16/10/2026 (DP12): o reel do Experience 26 entra na Comunidade da home (4.6) e substitui o vídeo de 2025 na landing `/experience`. O arquivo já existe, então `VIDEO_DO_EXPERIENCE_26` deixa de ser pendência aqui. Nada sobe para o bucket do Supabase (efeito externo): o vídeo e a capa são servidos de `public/`, como `garante.mp4` e as fotos das atividades (`LOCAL_BY_FILENAME`, `content/media.ts`).

**Files:**
- Create: `public/site-v2/videos/semog-experience-26.mp4`, `public/site-v2/videos/semog-experience-26-poster.webp`, `scripts/gen-poster-experience-26.mjs`
- Modify: `src/site/conteudo/conteudo.ts`, `tests/int/site-v2-pendencias.int.spec.ts`
- Modify (site no ar, só chega ao ar na virada): `content/media.ts`, `src/data/experienceEvent.ts`, `src/components/experience/ExperienceVideo.tsx`, `tests/int/experience-media.int.spec.ts`, `tests/int/experience-sections.int.spec.tsx`

**Interfaces:**
- Consumes: `VideoDoExperience` (4.1), `img()` e `LOCAL_BY_FILENAME` (`content/media.ts`), `EXPERIENCE_EVENT.video` (`src/data/experienceEvent.ts`).
- Produces: `conteudo.comunidade.experience.video26: VideoDoExperience` (não mais pendente); `EXPERIENCE_EVENT.video` com `previousYear: 2026`, `previousEdition: '26'`, `file: 'semog-experience-26.mp4'`, `poster: 'semog-experience-26-poster.webp'`, sem `previousFormat`.

- [ ] **Step 1: Conferir o arquivo e o estado da `/experience`**

```powershell
Get-Item -LiteralPath 'C:\Users\lekoc\Downloads\semog-experience-26-reel.mp4' | Select-Object Length
```

Expected: cerca de 20.800.000 bytes (19,9 MB; 720 × 1280, 68 s, conferido em 16/10/2026). Se não existir, pare e reporte: a tarefa depende do arquivo. O arquivo veio da internet: ele só é copiado e lido pelo Chromium do Playwright; nada é executado de dentro dele.

Abrir `http://localhost:3000/experience` (`pnpm dev`) e ler a seção do vídeo e o topo. A seção diz "Edição anterior" e "Assista como foi o Semog Experience 25". Se a página ainda anunciar o Experience 26 como evento futuro (inscrição aberta para 26/09/2026), pare e reporte: o vídeo do 26 como "edição anterior" ficaria errado, e o texto da seção precisaria de outra decisão.

- [ ] **Step 2: Copiar o vídeo**

```powershell
New-Item -ItemType Directory -Force 'C:\Users\lekoc\semogapp\semogsite-site-v2\public\site-v2\videos' | Out-Null
Copy-Item -LiteralPath 'C:\Users\lekoc\Downloads\semog-experience-26-reel.mp4' -Destination 'C:\Users\lekoc\semogapp\semogsite-site-v2\public\site-v2\videos\semog-experience-26.mp4'
```

Sem recompressão: nem o plano nem o repositório têm padrão de otimização de vídeo, e esta máquina não tem `ffmpeg` (conferido em 16/10/2026; o `gen-hero-poster.mjs` usa o Chromium justamente por isso). Instalar uma ferramenta nova está fora do escopo da tarefa. O peso fica registrado em "Conflitos" para a decisão do Leandro antes da virada.

- [ ] **Step 3: Gerar a capa**

`scripts/gen-poster-experience-26.mjs` (mesmo método de `scripts/gen-hero-poster.mjs`):

```js
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from '@playwright/test'
import sharp from 'sharp'

/**
 * Capa do reel do Semog Experience 26 (Comunidade da home do site v2 e landing /experience). Mesmo
 * método do `gen-hero-poster.mjs`: o Chromium do Playwright tira o quadro e o sharp grava em webp,
 * sem depender de ffmpeg. O quadro é o de `INSTANTE` segundos; conferir a imagem gerada e ajustar
 * se cair num quadro escuro ou borrado. Rodar de novo só se o vídeo mudar.
 */
const SRC = 'public/site-v2/videos/semog-experience-26.mp4'
const OUT = 'public/site-v2/videos/semog-experience-26-poster.webp'
const INSTANTE = 1
const LARGURA = 720
const ALTURA = 1280

const tmp = mkdtempSync(join(tmpdir(), 'poster-'))
const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: LARGURA, height: ALTURA } })
  const dataUrl = `data:video/mp4;base64,${readFileSync(SRC).toString('base64')}`
  await page.setContent(
    `<style>body{margin:0}video{width:${LARGURA}px;height:${ALTURA}px;object-fit:cover}</style><video id="v" muted src="${dataUrl}"></video>`,
  )
  await page.evaluate(
    (instante) =>
      new Promise((resolve, reject) => {
        const v = document.getElementById('v')
        v.onerror = () => reject(new Error('o Chromium não decodificou o vídeo'))
        v.onseeked = resolve
        v.currentTime = instante
      }),
    INSTANTE,
  )
  const frame = join(tmp, 'frame.png')
  writeFileSync(frame, await page.locator('#v').screenshot())
  const info = await sharp(frame).webp({ quality: 60 }).toFile(OUT)
  console.log(`${OUT} gerado (${Math.round(info.size / 1024)} KB)`)
} finally {
  await browser.close()
  rmSync(tmp, { recursive: true, force: true })
}
```

Run (da WT): `node scripts/gen-poster-experience-26.mjs`
Expected: `public/site-v2/videos/semog-experience-26-poster.webp gerado (N KB)`. Abrir o webp e olhar: quadro nítido, sem tela preta. Se o Chromium não decodificar (erro do `onerror`), trocar `chromium.launch()` por `chromium.launch({ channel: 'chrome' })` (o Chrome instalado tem os codecs) e rodar de novo.

- [ ] **Step 4: O vídeo no conteúdo do v2**

`src/site/conteudo/conteudo.ts`, a constante `VIDEO_DO_EXPERIENCE_26` (Tarefa 4.1) passa a:

```ts
/** O reel do Semog Experience 26 (DP12; post Dd4jHaQCso5, arquivo do Leandro de 16/10/2026). */
const VIDEO_DO_EXPERIENCE_26: OuPendente<VideoDoExperience> = {
  src: '/site-v2/videos/semog-experience-26.mp4',
  poster: '/site-v2/videos/semog-experience-26-poster.webp',
  legenda: 'Vídeo com momentos do Semog Experience 2026, na orla de João Pessoa.',
  largura: 720,
  altura: 1280,
}
```

`tests/int/site-v2-pendencias.int.spec.ts`, a lista das pendências conhecidas passa a `['tecnologia.numerosDaPrestacao', 'aSemog.pessoas.fotoDosSocios']`.

- [ ] **Step 5: A troca na `/experience`**

`content/media.ts`: em `ALT_BY_FILENAME`, depois de `'experience-2025.mp4'`:

```ts
  // O reel do Semog Experience 26 substituiu o de 2025 na seção de vídeo (Leandro, 16/10/2026).
  'semog-experience-26.mp4':
    'Vídeo com momentos do Semog Experience 2026 na orla de João Pessoa, com a queima de fogos',
  'semog-experience-26-poster.webp': 'Quadro do vídeo do Semog Experience 2026',
```

e, em `LOCAL_BY_FILENAME`, depois das fotos das atividades:

```ts
  // O reel do 26 nasce no repositório, como as fotos das atividades (servido também pela home do v2).
  'semog-experience-26.mp4': '/site-v2/videos/semog-experience-26.mp4',
  'semog-experience-26-poster.webp': '/site-v2/videos/semog-experience-26-poster.webp',
```

(As entradas de 2025 ficam: o arquivo continua no bucket e o teste `experience-media` as confere.)

`src/data/experienceEvent.ts`, o bloco `video` inteiro passa a:

```ts
  /**
   * Prova social: o vídeo da edição 26, que trocou o de 2025 em 16/10/2026 (decisão do Leandro).
   * Os campos guardam os **filenames**, resolvidos por `img()` de `content/media.ts`, que sabe
   * onde o arquivo mora (este, no repositório) e guarda o alt.
   */
  video: {
    previousYear: 2026,
    /** Mesma convenção do `name`: a edição é "Semog Experience 26". */
    previousEdition: '26',
    /** Post original, mantido só como crédito/origem — o site não embute o Instagram. */
    reelUrl: 'https://www.instagram.com/reel/Dd4jHaQCso5/',
    file: 'semog-experience-26.mp4',
    poster: 'semog-experience-26-poster.webp',
    /** O material é um Reel vertical: em moldura 16:9 sobram tarjas pretas. */
    aspectRatio: '9 / 16',
  },
```

`src/components/experience/ExperienceVideo.tsx`: apagar o `<p className="note">…</p>` inteiro (a nota explicava que 2025 teve outro formato; o vídeo agora é da própria edição 26). No JSDoc, trocar "Prova social da edição anterior" por "Prova social da edição 26 (o vídeo trocou o de 2025 em 16/10/2026)", trocar "5,1 MB" por "19,9 MB" e apagar o último parágrafo ("O texto diz com todas as letras…"). O resto da marcação (título, legenda `Semog Experience {E.video.previousEdition} · {E.city}`, `preload="none"`, `poster`) fica: com os dados novos, o título passa a "Assista como foi o Semog Experience 26".

`tests/int/experience-sections.int.spec.tsx`, o teste `'diz que a edição anterior teve outro formato'` passa a:

```tsx
  it('mostra o vídeo do Semog Experience 26, sem a nota do formato de 2025', () => {
    render(<ExperienceVideo />)
    expect(EXPERIENCE_EVENT.video.previousEdition).toBe('26')
    expect(screen.getAllByText(/Experience 26/).length).toBeGreaterThan(0)
    expect(screen.queryByText(/beach tennis/i)).toBeNull()
  })
```

`tests/int/experience-media.int.spec.ts`, no fim do `describe`:

```ts
  it('o vídeo do 26 e a capa saem do repositório (/site-v2/videos), não do bucket', () => {
    expect(img(EXPERIENCE_EVENT.video.file).url).toBe('/site-v2/videos/semog-experience-26.mp4')
    expect(img(EXPERIENCE_EVENT.video.poster).url).toBe(
      '/site-v2/videos/semog-experience-26-poster.webp',
    )
  })
```

- [ ] **Step 6: Rodar e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/experience-media.int.spec.ts tests/int/experience-sections.int.spec.tsx tests/int/site-v2-pendencias.int.spec.ts tests/int/site-v2-redacao.int.spec.ts tests/int/site-v2-conteudo.int.spec.ts`
Expected: PASS.

- [ ] **Step 7: Olhar no navegador antes de commitar**

`pnpm dev`, `http://localhost:3000/experience` em 1440 e 390, em Chromium e Firefox: a seção do vídeo mostra a capa nova, o título "Assista como foi o Semog Experience 26", e o play toca o reel com som (controles nativos). No Network, o `.mp4` vem de `localhost:3000/site-v2/videos/`, não do Supabase, e só depois do play (`preload="none"`).

- [ ] **Step 8: Portões e commit**

Run: os cinco portões. Expected: verdes.

```bash
git branch --show-current && git add public/site-v2/videos/semog-experience-26.mp4 public/site-v2/videos/semog-experience-26-poster.webp scripts/gen-poster-experience-26.mjs src/site/conteudo/conteudo.ts tests/int/site-v2-pendencias.int.spec.ts content/media.ts src/data/experienceEvent.ts src/components/experience/ExperienceVideo.tsx tests/int/experience-media.int.spec.ts tests/int/experience-sections.int.spec.tsx && git commit -m "feat(site-v2): vídeo do Semog Experience 26 na home do v2 e no lugar do de 2025 na /experience

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
```

---

## Tarefa 4.6: Home, parte 2 — tecnologia (seis módulos) e comunidade, com os números pendentes e o vídeo do 26

**Files:**
- Create (seções): `src/site/secoes/home/Tecnologia.tsx` + `tecnologia.css` (`04-tecnologia`), `src/site/secoes/home/Comunidade.tsx` + `comunidade.css` (`07-comunidade`)
- Create (cenas): `src/site/cenas/home/tecnologia.ts` (`cenaTecnologia`, de `scenes\04-tecnologia.js`), `tecnologia-base.ts`, `tecnologia-desenho.ts`, `tecnologia-layout.ts`, `tecnologia-percurso.ts`, `tecnologia-poses.ts` (dos arquivos `04-tecnologia-*.js` de mesmo nome), `src/site/cenas/home/comunidade.ts` (`cenaComunidade`, `07-comunidade.js`)
- Create: `src/site/secoes/tecnologia/numeros.ts`
- Modify: `src/site/conteudo/conteudo.ts`, `src/site/cenas/paginas/home.tsx`, `src/site/paginas/home.tsx`, `tests/int/site-v2-core-ssr.int.spec.ts`, `tests/int/site-v2-pagina-home.int.spec.tsx`

**Interfaces:**
- Consumes: `NUMEROS_DA_PRESTACAO`/`conteudo.tecnologia.numerosDaPrestacao`, `conteudo.comunidade.experience.video26`, `estaPendente`, `<Pendencia>` (4.1); o resto como na 4.5.
- Produces: `Tecnologia()`, `Comunidade()`; `cenaTecnologia`, `cenaComunidade`; `fraseDosNumerosDaPrestacao(numeros: NumerosDaPrestacao): string` (`src/site/secoes/tecnologia/numeros.ts`, usada também pela página Tecnologia na 4.12); `conteudo.comunidade.experience.legendaCom26: string`.

Desvios desta tarefa:
- **Tecnologia (home), `.tec-contexto`:** `{conteudo.tecnologia.contexto}` seguido de um espaço e, se `numerosDaPrestacao` estiver pendente, `<Pendencia item={…} />`; senão, `fraseDosNumerosDaPrestacao(numeros)`.
- **Comunidade, marco do Café:** o segundo marco (`5ª edição` / `Anunciada`, TEXTO-NOVO no protótipo) vira `conteudo.comunidade.cafe.proximos.rotulo` / `.texto`, na mesma marcação (`dt.rotulo > .linha > .linha-interna`, `dd.comunidade-data > .linha > .linha-interna`).
- **Comunidade, citação:** a legenda da citação passa a `Ana Cláudia, sobre a 4ª edição, em comentário no Instagram do evento.` (sem "síndica"), com o comentário `{/* TEXTO-NOVO: comentário autorizado pelo Leandro (16/10/2026) */}`.
- **Comunidade, link do blog:** o `href` é `caminhoNoSite('/blog')`, e não `conteudo.comunidade.blog.url` (a URL absoluta `https://www.semog.com.br/blog`, que tiraria da prévia quem clica e quebraria a navegação entre páginas novas que o verificador testa; DP3). O texto do link continua vindo do conteúdo.
- **Comunidade, primeiro retrato (DP12):** com `video26` pendente, o `<img>` da foto de 2025 fica e a legenda ganha o selo (`{experience.legenda} <Pendencia item={experience.video26} />`); com o arquivo, o primeiro quadro tem `<video src poster width height muted loop playsInline autoPlay preload="metadata" aria-label={video.legenda} />` no lugar do `<img>` e a legenda é `experience.legendaCom26`. Na cena, `abrirFoto` exige `img, video` (e não só `img`) dentro da moldura.

- [ ] **Step 1: Estender o teste da home**

Em `tests/int/site-v2-pagina-home.int.spec.tsx`, acrescentar o import `import { estaPendente } from '@/site/conteudo/pendencias'` e trocar `SECOES` por:

```tsx
const VIDEO_PENDENTE = estaPendente(conteudo.comunidade.experience.video26)
const NUMEROS_PENDENTES = estaPendente(conteudo.tecnologia.numerosDaPrestacao)

const SECOES: SecaoEsperada[] = [
  { id: 'abertura', arquivo: '01-abertura', diferencas: { ignorar: FORMULARIO } },
  { id: 'condominios', arquivo: '02-condominios' },
  { id: 'pilares', arquivo: '03-pilares' },
  {
    id: 'tecnologia',
    arquivo: '04-tecnologia',
    diferencas: NUMEROS_PENDENTES ? { comClasses: ['a-confirmar'] } : {},
  },
  { id: 'ranking', arquivo: '05-ranking' },
  { id: 'unidades', arquivo: '06-unidades' },
  {
    id: 'comunidade',
    arquivo: '07-comunidade',
    // Com o vídeo do 26 (Tarefa 4.5a), o primeiro retrato troca o <img> por <video> (DP12).
    diferencas: VIDEO_PENDENTE ? { comClasses: ['a-confirmar'] } : { contagemLivre: ['<img>'] },
  },
  {
    id: 'proposta',
    arquivo: '08-proposta',
    diferencas: { ignorar: FORMULARIO, comClasses: ['proposta-metades'] },
  },
]
```

e acrescentar ao `describe`:

```tsx
  it('comunidade: sem edição nem data inventada, citação sem "síndica", e o vídeo do 26 no primeiro retrato', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    const container = conferirPagina(<Pagina />, { dataPagina: 'home', secoes: SECOES })
    const comunidade = container.querySelector('#comunidade')?.textContent ?? ''
    expect(comunidade).not.toContain('5ª edição')
    expect(comunidade).not.toContain('Anunciada')
    expect(comunidade).toContain('Aguarde novas informações.')
    expect(comunidade).toContain('Ana Cláudia, sobre a 4ª edição')
    expect(comunidade).not.toContain('Ana Cláudia, síndica')
    if (VIDEO_PENDENTE) {
      expect(container.querySelector('#comunidade .comunidade-dupla .a-confirmar')).not.toBeNull()
    } else {
      expect(container.querySelector('#comunidade .comunidade-dupla video')).not.toBeNull()
    }
  })

  it('tecnologia: a prestação desde 2023 e os números da nova só com dado do Leandro', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    const container = conferirPagina(<Pagina />, { dataPagina: 'home', secoes: SECOES })
    const contexto = container.querySelector('#tecnologia .tec-contexto')?.textContent ?? ''
    expect(contexto).toContain('Prestação de contas digital desde 2023.')
    expect(contexto).not.toMatch(/670|220/)
    if (NUMEROS_PENDENTES) expect(contexto).toContain('A CONFIRMAR')
  })
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-pagina-home.int.spec.tsx`
Expected: FAIL: as seções `tecnologia` e `comunidade` não existem na página.

- [ ] **Step 3: Conteúdo e a frase dos números**

Em `src/site/conteudo/conteudo.ts`, na chave `comunidade.experience`, depois de `video26: VIDEO_DO_EXPERIENCE_26,`: `legendaCom26: 'Semog Experience 2026 e 2025.',` com o comentário `// TEXTO-NOVO: legenda quando o vídeo do 26 entrar (DP12)` na linha de cima.

`src/site/secoes/tecnologia/numeros.ts`:

```ts
import { formatarNumero } from '@/site/formatar'
import type { NumerosDaPrestacao } from '@/site/conteudo/conteudo'

/** A frase dos números da nova prestação, com o dado e a data de corte que o Leandro informar. */
export function fraseDosNumerosDaPrestacao({
  prestacoes,
  condominios,
  corte,
}: NumerosDaPrestacao): string {
  // TEXTO-NOVO: a mesma frase do protótipo, com o dado novo e a data de corte no lugar.
  return `Até ${corte}, foram mais de ${formatarNumero(prestacoes)} prestações em ${formatarNumero(condominios)} condomínios.`
}
```

- [ ] **Step 4: Copiar o CSS e portar as seções e as cenas**

```powershell
$p = 'C:\Users\lekoc\semogapp\semogsite-site-v2\design-explorations\site-v2-prototipo\src\scenes'
$d = 'C:\Users\lekoc\semogapp\semogsite-site-v2\src\site\secoes\home'
Copy-Item -LiteralPath "$p\04-tecnologia.css" -Destination "$d\tecnologia.css"
Copy-Item -LiteralPath "$p\07-comunidade.css" -Destination "$d\comunidade.css"
```

Portar `04-tecnologia.html`, `07-comunidade.html` e as sete cenas pela receita, com os desvios acima. Os cinco módulos `04-tecnologia-*.js` viram `tecnologia-base.ts`, `tecnologia-desenho.ts`, `tecnologia-layout.ts`, `tecnologia-percurso.ts`, `tecnologia-poses.ts`, com os mesmos nomes exportados (C9); `PATAMARES` de `tecnologia-poses.ts` continua exportado. O desenho escreve texto em canvas: o nome da fonte vem de `util.familiaDaFonte` (C4), que precisa ser lido dentro do init (não no topo do módulo, C5).

- [ ] **Step 5: Lista de cenas e página completas**

`src/site/cenas/paginas/home.tsx`: acrescentar os imports `import { cenaComunidade } from '../home/comunidade'` e `import { cenaTecnologia } from '../home/tecnologia'`, e a lista passa a:

```tsx
export const CENAS_HOME: ListaCenas = [
  ['abertura', cenaAbertura],
  ['condominios', cenaCondominios],
  ['pilares', cenaPilares],
  ['tecnologia', cenaTecnologia],
  ['ranking', cenaRanking],
  ['unidades', cenaUnidades],
  ['comunidade', cenaComunidade],
  ['proposta', cenaProposta],
]
```

(e o comentário da lista perde a frase "A 4.6 acrescenta…").

`src/site/paginas/home.tsx`: importar `Tecnologia` e `Comunidade` de `@/site/secoes/home/…` e renderizar `<Tecnologia />` entre `<Pilares />` e `<Ranking />`, e `<Comunidade />` entre `<Unidades />` e `<SecaoProposta />`.

`tests/int/site-v2-core-ssr.int.spec.ts`, em `MODULOS`:

```ts
  ['cena tecnologia', () => import('@/site/cenas/home/tecnologia')],
  ['tecnologia: base', () => import('@/site/cenas/home/tecnologia-base')],
  ['tecnologia: desenho', () => import('@/site/cenas/home/tecnologia-desenho')],
  ['tecnologia: layout', () => import('@/site/cenas/home/tecnologia-layout')],
  ['tecnologia: percurso', () => import('@/site/cenas/home/tecnologia-percurso')],
  ['tecnologia: poses', () => import('@/site/cenas/home/tecnologia-poses')],
  ['cena comunidade', () => import('@/site/cenas/home/comunidade')],
```

- [ ] **Step 6: Rodar e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-pagina-home.int.spec.tsx tests/int/site-v2-core-ssr.int.spec.ts tests/int/site-v2-core-fase4.int.spec.tsx tests/int/site-v2-identidade.int.spec.ts tests/int/site-v2-pendencias.int.spec.ts`
Expected: PASS.

- [ ] **Step 7: Olhar no navegador antes de commitar**

`pnpm dev`, `http://localhost:3000/previa-v2` em 1440 e 390: a tecnologia (pin com o percurso ERP → PDF → assinatura → QR → Semog One) e a comunidade (a linha que liga Café, Experience e blog) animam; o selo A CONFIRMAR aparece no contexto da tecnologia; o primeiro retrato da Comunidade toca o reel do 26 (mudo, em laço), com a capa antes de carregar, e a legenda é "Semog Experience 2026 e 2025."; console sem erro.

- [ ] **Step 8: Portões e commit**

Run: os cinco portões. Expected: verdes.

```bash
git branch --show-current && git add src/site/secoes/home/Tecnologia.tsx src/site/secoes/home/tecnologia.css src/site/secoes/home/Comunidade.tsx src/site/secoes/home/comunidade.css src/site/cenas/home src/site/secoes/tecnologia/numeros.ts src/site/conteudo/conteudo.ts src/site/cenas/paginas/home.tsx src/site/paginas/home.tsx tests/int/site-v2-core-ssr.int.spec.ts tests/int/site-v2-pagina-home.int.spec.tsx && git commit -m "feat(site-v2): tecnologia e comunidade na home, com os números pendentes e o vídeo do 26

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
```

---

## Tarefa 4.7: A Semog

**Files:**
- Create (seções, `src/site/secoes/semog/`): `Manifesto.tsx` + `manifesto.css` (de `sections\semog\01-manifesto.html`, `scenes\semog\01-manifesto.css`), `Historia.tsx` + `historia.css` (`02-historia`), `Principios.tsx` + `principios.css` (`03-principios`), `Pessoas.tsx` + `pessoas.css` (`04-pessoas`), `Depoimentos.tsx` + `depoimentos.css` (`06-depoimentos`), `Assembleia.tsx` + `assembleia.css` (`05-assembleia`)
- Create (cenas, `src/site/cenas/semog/`): `manifesto.ts` (`cenaManifesto`), `historia.ts` (`cenaHistoria`), `principios.ts` (`cenaPrincipios`), `pessoas.ts` (`cenaPessoas`), `depoimentos.ts` (`cenaDepoimentos`), `assembleia.ts` (`cenaAssembleia`), dos `.js` de mesmo número em `scenes\semog\`
- Create: `src/site/cenas/paginas/semog.tsx`, `src/site/paginas/semog.tsx`, `src/app/(site)/(app)/previa-v2/semog/page.tsx`
- Modify: `src/site/cenas/registro.ts`, `src/site/rotas.ts`, `tests/int/site-v2-core-ssr.int.spec.ts`
- Só se a foto dos sócios já chegou (Step 4a): Create `public/site-v2/fotos/socios-semog.webp`; Modify `src/site/conteudo/conteudo.ts`, `tests/int/site-v2-pendencias.int.spec.ts`
- Test: `tests/int/site-v2-pagina-semog.int.spec.tsx`

**Interfaces:**
- Consumes: o mesmo da 4.5; `criarDinamica` (4.2); `conteudo.aSemog.pessoas.fotoDosSocios`, `estaPendente`, `<Pendencia>` (4.1).
- Produces: as seis seções e as seis cenas acima; `CENAS_SEMOG` e `CenasDaSemog()`; `PaginaSemog()`; `CENAS_POR_PAGINA.semog`; `'/semog'` em `PAGINAS_NA_PREVIA`.

Desvios desta página:
- **Ordem:** a do `paginas.json` do protótipo: `a-semog`, `historia`, `principios`, `pessoas`, `depoimentos`, `assembleia`, `proposta` (os depoimentos vêm antes da assembleia, embora o arquivo seja o 06).
- **Pessoas, moldura dos sócios:** com `fotoDosSocios` pendente, `<div className="moldura ps-aenviar"><p className="ps-aenviar-rotulo"><Pendencia item={foto} /></p></div>`; com a foto, `<div className="moldura"><img src alt width height loading="lazy" decoding="async" /></div>` (R4). A legenda é `aSemog.pessoas.legenda` nos dois casos. A cena anima a moldura e `.ps-aenviar-rotulo > span, figcaption`, que existem nos dois casos.
- **Princípios:** a cena usa `util.criarDinamica`; sem WebGL, `ctx.reportar(erro, 'dinamica')` e fica o fundo CSS (como o `console.warn` do protótipo, receita C7).
- **Item "Acesso fácil aos sócios":** já veio do conteúdo (4.1).

- [ ] **Step 1: Escrever o teste da página**

`tests/int/site-v2-pagina-semog.int.spec.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import Pagina, { metadata } from '@/app/(site)/(app)/previa-v2/semog/page'
import { CENAS_SEMOG } from '@/site/cenas/paginas/semog'
import { conteudo } from '@/site/conteudo/conteudo'
import { estaPendente } from '@/site/conteudo/pendencias'
import { metadadosInstitucionais } from '@/site/seo/institucional'
import { conferirPagina, type SecaoEsperada } from './helpers/paginas'

vi.mock('@/site/runner/RunnerDeCenas', () => ({ RunnerDeCenas: () => null }))
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))
vi.mock('@/app/(site)/_actions/proposta-duas-etapas', () => ({
  enviarEtapa1: vi.fn(),
  enviarEtapa2: vi.fn(),
  enviarPropostaCompleta: vi.fn(),
}))
vi.mock('@/components/forms/Turnstile', () => ({ Turnstile: () => null }))

afterEach(() => {
  vi.unstubAllEnvs()
})

const FORMULARIO = ['form', '.fp-moldura'] as const
const FOTO_PENDENTE = estaPendente(conteudo.aSemog.pessoas.fotoDosSocios)

const SECOES: SecaoEsperada[] = [
  { id: 'a-semog', arquivo: 'semog/01-manifesto' },
  { id: 'historia', arquivo: 'semog/02-historia' },
  { id: 'principios', arquivo: 'semog/03-principios' },
  {
    id: 'pessoas',
    arquivo: 'semog/04-pessoas',
    diferencas: FOTO_PENDENTE
      ? { semClasses: ['ps-aenviar-tema'], comClasses: ['a-confirmar'] }
      : {
          semClasses: ['ps-aenviar', 'ps-aenviar-rotulo', 'ps-aenviar-tema'],
          // Com a foto, o rótulo "Foto real a enviar" (<p>) sai e a moldura ganha o <img>.
          contagemLivre: ['<p>', '<img>'],
        },
  },
  { id: 'depoimentos', arquivo: 'semog/06-depoimentos' },
  { id: 'assembleia', arquivo: 'semog/05-assembleia' },
  {
    id: 'proposta',
    arquivo: '08-proposta',
    diferencas: { ignorar: FORMULARIO, comClasses: ['proposta-metades'] },
  },
]

describe('A Semog na prévia', () => {
  it('em produção responde 404, nunca é indexada e o <head> é o de hoje', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false })
    expect(metadata.title).toBe(metadadosInstitucionais('semog').title)
    vi.stubEnv('VERCEL_ENV', 'production')
    expect(() => Pagina()).toThrow('NEXT_HTTP_ERROR_FALLBACK;404')
  })

  it('reproduz as seções do protótipo, na ordem, com as cenas certas', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    conferirPagina(<Pagina />, { dataPagina: 'semog', secoes: SECOES, cenas: CENAS_SEMOG })
  })

  it('a linha do tempo diz o que o Garante faz e a moldura dos sócios não promete foto', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    const container = conferirPagina(<Pagina />, { dataPagina: 'semog', secoes: SECOES })
    const historia = container.querySelector('#historia')?.textContent ?? ''
    expect(historia).toContain('garante ao condomínio 100% da arrecadação prevista')
    const pessoas = container.querySelector('#pessoas')?.textContent ?? ''
    expect(pessoas).not.toContain('Foto real a enviar')
    expect(pessoas).toContain('Acesso fácil aos sócios')
    expect(container.querySelector('[aria-current="page"]')?.getAttribute('href')).toBe(
      '/previa-v2/semog',
    )
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-pagina-semog.int.spec.tsx`
Expected: FAIL com "Failed to resolve import '@/app/(site)/(app)/previa-v2/semog/page'".

- [ ] **Step 3: Copiar o CSS**

```powershell
$p = 'C:\Users\lekoc\semogapp\semogsite-site-v2\design-explorations\site-v2-prototipo\src\scenes\semog'
$d = 'C:\Users\lekoc\semogapp\semogsite-site-v2\src\site\secoes\semog'
New-Item -ItemType Directory -Force $d | Out-Null
Copy-Item -LiteralPath "$p\01-manifesto.css" -Destination "$d\manifesto.css"
Copy-Item -LiteralPath "$p\02-historia.css" -Destination "$d\historia.css"
Copy-Item -LiteralPath "$p\03-principios.css" -Destination "$d\principios.css"
Copy-Item -LiteralPath "$p\04-pessoas.css" -Destination "$d\pessoas.css"
Copy-Item -LiteralPath "$p\05-assembleia.css" -Destination "$d\assembleia.css"
Copy-Item -LiteralPath "$p\06-depoimentos.css" -Destination "$d\depoimentos.css"
```

- [ ] **Step 4: Portar as seis seções e as seis cenas**

Pela receita, com os desvios acima. A história tem pin com patamares por pausas (`patamares: "pausas"`): se houver `.to({}, { … onUpdate … })`, ganha `data: 'movimento'` (C8; o teste da 4.2 acusa).

- [ ] **Step 4a: A foto dos sócios, se o arquivo já chegou**

Decisão de 16/10/2026: a moldura dos sócios usa a 1ª foto do post do Instagram `DeR7uo5EbRX` (todos os sócios), que o Leandro salva em `C:\Users\lekoc\Downloads\semog-experience-26-grupo.jpg`.

```powershell
Test-Path -LiteralPath 'C:\Users\lekoc\Downloads\semog-experience-26-grupo.jpg'
```

Se `False`: a foto fica pendente (o selo aparece na prévia e a virada trava), e este passo é refeito, sozinho e com o próprio commit, quando o arquivo chegar (registrar no ledger). Se `True`, converter para webp no lugar definido (o arquivo veio da internet: só o `sharp` o lê; rodar da WT, onde o `sharp` está instalado):

```powershell
node --input-type=module -e "import sharp from 'sharp'; const info = await sharp(process.argv[1]).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 72 }).toFile(process.argv[2]); console.log(info.width, info.height, Math.round(info.size / 1024) + ' KB')" 'C:\Users\lekoc\Downloads\semog-experience-26-grupo.jpg' 'C:\Users\lekoc\semogapp\semogsite-site-v2\public\site-v2\fotos\socios-semog.webp'
```

Expected: largura, altura e peso impressos (o `.rotate()` aplica a orientação EXIF). Em `src/site/conteudo/conteudo.ts`, `FOTO_DOS_SOCIOS` passa a `{ src: '/site-v2/fotos/socios-semog.webp', alt: 'Os sócios da Semog, reunidos.', largura: <largura impressa>, altura: <altura impressa> }` e o comentário perde "Pendente até o arquivo chegar". O alt é neutro de propósito: nenhum nome foi informado, e nome inventado é dado inventado. Em `tests/int/site-v2-pendencias.int.spec.ts`, a lista das pendências conhecidas perde `'aSemog.pessoas.fotoDosSocios'`. O commit desta tarefa passa a incluir `public/site-v2/fotos/socios-semog.webp`, `src/site/conteudo/conteudo.ts` e `tests/int/site-v2-pendencias.int.spec.ts`. No navegador (Step 7), conferir o enquadramento da foto na moldura (rostos não cortados) em 1440 e 390; se cortar, reportar ao controlador em vez de editar o CSS da cena.

- [ ] **Step 5: Lista de cenas, página, rota, registro e prévia**

`src/site/cenas/paginas/semog.tsx`:

```tsx
'use client'

import type { ListaCenas } from '@/site/core/tipos'
import { RunnerDeCenas } from '@/site/runner/RunnerDeCenas'
import { cenaProposta } from '../proposta'
import { cenaAssembleia } from '../semog/assembleia'
import { cenaDepoimentos } from '../semog/depoimentos'
import { cenaHistoria } from '../semog/historia'
import { cenaManifesto } from '../semog/manifesto'
import { cenaPessoas } from '../semog/pessoas'
import { cenaPrincipios } from '../semog/principios'

/** Cenas de A Semog, na ordem das seções (paginas/semog.js do protótipo). */
export const CENAS_SEMOG: ListaCenas = [
  ['a-semog', cenaManifesto],
  ['historia', cenaHistoria],
  ['principios', cenaPrincipios],
  ['pessoas', cenaPessoas],
  ['depoimentos', cenaDepoimentos],
  ['assembleia', cenaAssembleia],
  ['proposta', cenaProposta],
]

export function CenasDaSemog() {
  return <RunnerDeCenas pagina="semog" cenas={CENAS_SEMOG} />
}
```

`src/site/paginas/semog.tsx`:

```tsx
import { CenasDaSemog } from '@/site/cenas/paginas/semog'
import { EsqueletoApp } from '@/site/layout/EsqueletoApp'
import { JsonLd } from '@/site/secoes/comum/JsonLd'
import { SecaoProposta } from '@/site/secoes/proposta/SecaoProposta'
import { Assembleia } from '@/site/secoes/semog/Assembleia'
import { Depoimentos } from '@/site/secoes/semog/Depoimentos'
import { Historia } from '@/site/secoes/semog/Historia'
import { Manifesto } from '@/site/secoes/semog/Manifesto'
import { Pessoas } from '@/site/secoes/semog/Pessoas'
import { Principios } from '@/site/secoes/semog/Principios'
import { jsonLdInstitucional } from '@/site/seo/institucional'

/** Corpo de A Semog (semog.html do protótipo). A virada 1 leva este corpo a /semog. */
export function PaginaSemog() {
  return (
    <EsqueletoApp pagina="semog" atual="semog" temProposta cenas={<CenasDaSemog />}>
      <JsonLd dados={jsonLdInstitucional('semog')} />
      <Manifesto />
      <Historia />
      <Principios />
      <Pessoas />
      <Depoimentos />
      <Assembleia />
      <SecaoProposta />
    </EsqueletoApp>
  )
}
```

`src/app/(site)/(app)/previa-v2/semog/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PaginaSemog } from '@/site/paginas/semog'
import { previaLiberada, ROBOTS_DA_PREVIA } from '@/site/previa'
import { metadadosInstitucionais } from '@/site/seo/institucional'

export const metadata: Metadata = { ...metadadosInstitucionais('semog'), robots: ROBOTS_DA_PREVIA }

/** A Semog do site v2 na prévia. 404 em produção. */
export default function Pagina() {
  if (!previaLiberada()) notFound()
  return <PaginaSemog />
}
```

`src/site/cenas/registro.ts`: `import { CENAS_SEMOG } from './paginas/semog'` e a entrada `semog: CENAS_SEMOG`. `src/site/rotas.ts`: acrescentar `'/semog'` a `PAGINAS_NA_PREVIA`. `tests/int/site-v2-core-ssr.int.spec.ts`: uma linha por cena (`['cena manifesto', () => import('@/site/cenas/semog/manifesto')]`, idem `historia`, `principios`, `pessoas`, `depoimentos`, `assembleia`) e `['cenas de A Semog', () => import('@/site/cenas/paginas/semog')]`.

- [ ] **Step 6: Rodar e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-pagina-semog.int.spec.tsx tests/int/site-v2-core-ssr.int.spec.ts tests/int/site-v2-core-fase4.int.spec.tsx tests/int/site-v2-rotas.int.spec.ts tests/int/site-v2-identidade.int.spec.ts tests/int/site-v2-layout.int.spec.tsx`
Expected: PASS.

- [ ] **Step 7: Olhar no navegador antes de commitar**

`pnpm dev`, `http://localhost:3000/previa-v2/semog` em 1440 e 390: a história (pin pelos marcos, o mapa da costa), os princípios (gradiente vivo), as pessoas (moldura com o selo A CONFIRMAR), os depoimentos e a pauta da assembleia; console sem erro. Ir e voltar entre `/previa-v2` e `/previa-v2/semog` pelo cabeçalho: cada página monta do zero.

- [ ] **Step 8: Portões e commit**

Run: os cinco portões. Expected: verdes.

```bash
git branch --show-current && git add src/site/secoes/semog src/site/cenas/semog src/site/cenas/paginas/semog.tsx src/site/paginas/semog.tsx "src/app/(site)/(app)/previa-v2/semog/page.tsx" src/site/cenas/registro.ts src/site/rotas.ts tests/int/site-v2-core-ssr.int.spec.ts tests/int/site-v2-pagina-semog.int.spec.tsx && git commit -m "feat(site-v2): A Semog na prévia, com a moldura dos sócios

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
```

(Se o Step 4a converteu a foto, acrescentar ao `git add` os três arquivos que ele lista.)

---

## Tarefa 4.8: Gestão (`/administracao-de-condominios`)

**Files:**
- Create (seções, `src/site/secoes/gestao/`): `Abertura.tsx` (exporta `AberturaDaGestao`) + `abertura.css` (de `sections\gestao\01-abertura.html`, `scenes\gestao\01-abertura.css`), `Mesa.tsx` (`MesaDoSindico`) + `mesa.css` (`02-mesa`), `Atende.tsx` (`QuemAtende`) + `atende.css` (`03-atende`), `Troca.tsx` (`TrocaDeAdministradora`) + `troca.css` (`04-troca`), `Perguntas.tsx` (`PerguntasDaGestao`) + `perguntas.css` (`05-perguntas`)
- Create (cenas, `src/site/cenas/gestao/`): `abertura.ts` (`cenaAberturaDaGestao`), `mesa.ts` (`cenaMesa`), `atende.ts` (`cenaAtende`), `troca.ts` (`cenaTroca`), `perguntas.ts` (`cenaPerguntas`), dos `.js` de mesmo número em `scenes\gestao\`
- Create: `src/site/cenas/paginas/gestao.tsx`, `src/site/paginas/gestao.tsx`, `src/app/(site)/(app)/previa-v2/administracao-de-condominios/page.tsx`
- Modify: `src/site/cenas/registro.ts`, `src/site/rotas.ts`, `tests/int/site-v2-core-ssr.int.spec.ts`
- Test: `tests/int/site-v2-pagina-gestao.int.spec.tsx`

**Interfaces:**
- Consumes: o mesmo da 4.5.
- Produces: as cinco seções e as cinco cenas acima; `CENAS_GESTAO` e `CenasDaGestao()`; `PaginaGestao()`; `CENAS_POR_PAGINA.gestao`; `'/administracao-de-condominios'` em `PAGINAS_NA_PREVIA`.

Desvios desta página:
- **Links da seção "Quem atende":** `tecnologia.html` → `caminhoNoSite('/tecnologia')`, `index.html#unidades` → `caminhoNoSite('/#unidades')`, `garante.html` → `caminhoNoSite('/garante')`, `incorporadoras.html` → `caminhoNoSite('/incorporadoras')` (no 4a essas três ainda abrem a URL real; o 4b as põe na prévia).
- **Textos:** jurídico com escritório parceiro, acesso fácil aos sócios, cotação e orçamento, assessoria na assembleia e na migração: tudo já veio do conteúdo (4.1).

- [ ] **Step 1: Escrever o teste da página**

`tests/int/site-v2-pagina-gestao.int.spec.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import Pagina, { metadata } from '@/app/(site)/(app)/previa-v2/administracao-de-condominios/page'
import { CENAS_GESTAO } from '@/site/cenas/paginas/gestao'
import { metadadosInstitucionais } from '@/site/seo/institucional'
import { conferirPagina, type SecaoEsperada } from './helpers/paginas'

vi.mock('@/site/runner/RunnerDeCenas', () => ({ RunnerDeCenas: () => null }))
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))
vi.mock('@/app/(site)/_actions/proposta-duas-etapas', () => ({
  enviarEtapa1: vi.fn(),
  enviarEtapa2: vi.fn(),
  enviarPropostaCompleta: vi.fn(),
}))
vi.mock('@/components/forms/Turnstile', () => ({ Turnstile: () => null }))

afterEach(() => {
  vi.unstubAllEnvs()
})

const FORMULARIO = ['form', '.fp-moldura'] as const

const SECOES: SecaoEsperada[] = [
  { id: 'administracao-de-condominios', arquivo: 'gestao/01-abertura' },
  { id: 'mesa-do-sindico', arquivo: 'gestao/02-mesa' },
  { id: 'quem-atende', arquivo: 'gestao/03-atende' },
  { id: 'troca-de-administradora', arquivo: 'gestao/04-troca' },
  { id: 'perguntas-gestao', arquivo: 'gestao/05-perguntas' },
  {
    id: 'proposta',
    arquivo: '08-proposta',
    diferencas: { ignorar: FORMULARIO, comClasses: ['proposta-metades'] },
  },
]

describe('Gestão na prévia', () => {
  it('em produção responde 404, nunca é indexada e o <head> é o de hoje', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false })
    expect(metadata.title).toBe(metadadosInstitucionais('administracao-de-condominios').title)
    vi.stubEnv('VERCEL_ENV', 'production')
    expect(() => Pagina()).toThrow('NEXT_HTTP_ERROR_FALLBACK;404')
  })

  it('reproduz as seções do protótipo, na ordem, com as cenas certas', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    conferirPagina(<Pagina />, {
      dataPagina: 'gestao',
      secoes: SECOES,
      cenas: CENAS_GESTAO,
    })
  })

  it('o texto segue as respostas do Leandro', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    const container = conferirPagina(<Pagina />, { dataPagina: 'gestao', secoes: SECOES })
    const texto = container.textContent ?? ''
    expect(texto).toContain('Suporte jurídico com escritório parceiro')
    expect(texto).toContain('Acesso fácil aos sócios')
    expect(texto).toContain('cotações e orçamentos de fornecedores feitos pela Semog')
    expect(texto).not.toMatch(/comparad/)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-pagina-gestao.int.spec.tsx`
Expected: FAIL com "Failed to resolve import '@/app/(site)/(app)/previa-v2/administracao-de-condominios/page'".

- [ ] **Step 3: Copiar o CSS**

```powershell
$p = 'C:\Users\lekoc\semogapp\semogsite-site-v2\design-explorations\site-v2-prototipo\src\scenes\gestao'
$d = 'C:\Users\lekoc\semogapp\semogsite-site-v2\src\site\secoes\gestao'
New-Item -ItemType Directory -Force $d | Out-Null
Copy-Item -LiteralPath "$p\01-abertura.css" -Destination "$d\abertura.css"
Copy-Item -LiteralPath "$p\02-mesa.css" -Destination "$d\mesa.css"
Copy-Item -LiteralPath "$p\03-atende.css" -Destination "$d\atende.css"
Copy-Item -LiteralPath "$p\04-troca.css" -Destination "$d\troca.css"
Copy-Item -LiteralPath "$p\05-perguntas.css" -Destination "$d\perguntas.css"
```

- [ ] **Step 4: Portar as cinco seções e as cinco cenas**

Pela receita, com os desvios acima. A mesa do síndico tem pin por pausas e um `.to({}, { duration: CAUDA }, …)` sem `onUpdate` (não precisa de `data`: é cauda, conta como pausa de propósito, como no protótipo).

- [ ] **Step 5: Lista de cenas, página, rota, registro e prévia**

`src/site/cenas/paginas/gestao.tsx`:

```tsx
'use client'

import type { ListaCenas } from '@/site/core/tipos'
import { RunnerDeCenas } from '@/site/runner/RunnerDeCenas'
import { cenaAberturaDaGestao } from '../gestao/abertura'
import { cenaAtende } from '../gestao/atende'
import { cenaMesa } from '../gestao/mesa'
import { cenaPerguntas } from '../gestao/perguntas'
import { cenaTroca } from '../gestao/troca'
import { cenaProposta } from '../proposta'

/** Cenas da Gestão, na ordem das seções (paginas/gestao.js do protótipo). */
export const CENAS_GESTAO: ListaCenas = [
  ['administracao-de-condominios', cenaAberturaDaGestao],
  ['mesa-do-sindico', cenaMesa],
  ['quem-atende', cenaAtende],
  ['troca-de-administradora', cenaTroca],
  ['perguntas-gestao', cenaPerguntas],
  ['proposta', cenaProposta],
]

export function CenasDaGestao() {
  return <RunnerDeCenas pagina="gestao" cenas={CENAS_GESTAO} />
}
```

`src/site/paginas/gestao.tsx`:

```tsx
import { CenasDaGestao } from '@/site/cenas/paginas/gestao'
import { EsqueletoApp } from '@/site/layout/EsqueletoApp'
import { JsonLd } from '@/site/secoes/comum/JsonLd'
import { AberturaDaGestao } from '@/site/secoes/gestao/Abertura'
import { QuemAtende } from '@/site/secoes/gestao/Atende'
import { MesaDoSindico } from '@/site/secoes/gestao/Mesa'
import { PerguntasDaGestao } from '@/site/secoes/gestao/Perguntas'
import { TrocaDeAdministradora } from '@/site/secoes/gestao/Troca'
import { SecaoProposta } from '@/site/secoes/proposta/SecaoProposta'
import { jsonLdInstitucional } from '@/site/seo/institucional'

/** Corpo da Gestão (administracao-de-condominios.html do protótipo). A virada 1 o leva à URL real. */
export function PaginaGestao() {
  return (
    <EsqueletoApp pagina="gestao" atual="gestao" temProposta cenas={<CenasDaGestao />}>
      <JsonLd dados={jsonLdInstitucional('administracao-de-condominios')} />
      <AberturaDaGestao />
      <MesaDoSindico />
      <QuemAtende />
      <TrocaDeAdministradora />
      <PerguntasDaGestao />
      <SecaoProposta />
    </EsqueletoApp>
  )
}
```

`src/app/(site)/(app)/previa-v2/administracao-de-condominios/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PaginaGestao } from '@/site/paginas/gestao'
import { previaLiberada, ROBOTS_DA_PREVIA } from '@/site/previa'
import { metadadosInstitucionais } from '@/site/seo/institucional'

export const metadata: Metadata = {
  ...metadadosInstitucionais('administracao-de-condominios'),
  robots: ROBOTS_DA_PREVIA,
}

/** Gestão do site v2 na prévia. 404 em produção. */
export default function Pagina() {
  if (!previaLiberada()) notFound()
  return <PaginaGestao />
}
```

`src/site/cenas/registro.ts`: `import { CENAS_GESTAO } from './paginas/gestao'` e a entrada `gestao: CENAS_GESTAO`. `src/site/rotas.ts`: acrescentar `'/administracao-de-condominios'` a `PAGINAS_NA_PREVIA`. `tests/int/site-v2-core-ssr.int.spec.ts`: uma linha por cena de `src/site/cenas/gestao/` e `['cenas da Gestão', () => import('@/site/cenas/paginas/gestao')]`.

- [ ] **Step 6: Rodar e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-pagina-gestao.int.spec.tsx tests/int/site-v2-core-ssr.int.spec.ts tests/int/site-v2-core-fase4.int.spec.tsx tests/int/site-v2-rotas.int.spec.ts tests/int/site-v2-identidade.int.spec.ts`
Expected: PASS.

- [ ] **Step 7: Olhar no navegador antes de commitar**

`pnpm dev`, `http://localhost:3000/previa-v2/administracao-de-condominios` em 1440 e 390: abertura com as frentes, a mesa do síndico (pin), quem atende, a troca e as perguntas; console sem erro.

- [ ] **Step 8: Portões e commit**

Run: os cinco portões. Expected: verdes.

```bash
git branch --show-current && git add src/site/secoes/gestao src/site/cenas/gestao src/site/cenas/paginas/gestao.tsx src/site/paginas/gestao.tsx "src/app/(site)/(app)/previa-v2/administracao-de-condominios/page.tsx" src/site/cenas/registro.ts src/site/rotas.ts tests/int/site-v2-core-ssr.int.spec.ts tests/int/site-v2-pagina-gestao.int.spec.tsx && git commit -m "feat(site-v2): Gestão na prévia

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
```

---

## Tarefa 4.9: Varredura lado a lado e verificação COMPLETA do PR 4a

Os Steps 1 a 3 são do implementador (a ferramenta); os Steps 4 a 13 são de um **verificador separado** (agente `verificador`, que não edita código), com a regra de 28/09: dado real do navegador, Chromium e Firefox. Nenhum envio de formulário, nenhuma conexão ao banco.

**Files:**
- Create: `scripts/site-v2-institucional.mjs`
- Test: o próprio script, rodado contra o build local e o protótipo

**Interfaces:**
- Consumes: as rotas da prévia (4.5 a 4.8), `scripts/site-v2-quadros.mjs` e `scripts/site-v2-toque.mjs` (fase 1), o protótipo servido por `PROTOTIPO\serve.mjs`.
- Produces: `node scripts/site-v2-institucional.mjs --next <base> --prototipo <base> --saida <pasta> [--pagina <id>]… [--navegador chromium|firefox] [--largura 1440|390] [--build-sem-env]`, com código de saída 1 se algo falhar; os prints em `<saida>/<navegador>/<largura>/<página>/<seção>-{next,prototipo}.png`.

- [ ] **Step 1: Escrever o script**

`scripts/site-v2-institucional.mjs`:

```js
/* Varredura lado a lado das páginas institucionais do site v2 (fase 4): para cada página, abre a
   versão no Next (prévia) e a do protótipo, rola até cada seção (main > section[id]), espera a
   cena assentar e fotografa as duas, para comparar os quadros. Em Chromium e Firefox, 1440 e 390.
   Acusa erro de console, de página e de rede, resposta >= 400, html.motion que não chega, scroll
   horizontal e seção que existe num lado e não no outro.
   Ruído conhecido, fora da conta (o mesmo de scripts/site-v2-leitura.mjs): o cookie __cf_bm de
   imagem de CDN de terceiro no Firefox e, só com --build-sem-env, o aviso do Turnstile sem chave.
   Uso: node scripts/site-v2-institucional.mjs --next http://localhost:3100
        --prototipo http://127.0.0.1:4180 --saida <pasta> [--pagina home] [--pagina semog]
        [--navegador chromium|firefox] [--largura 1440|390] [--build-sem-env]
   Sai com código 1 se algo falhar. */
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { chromium, firefox } from '@playwright/test'

const PAGINAS = {
  home: { next: '/previa-v2', prototipo: '/index.html' },
  semog: { next: '/previa-v2/semog', prototipo: '/semog.html' },
  gestao: {
    next: '/previa-v2/administracao-de-condominios',
    prototipo: '/administracao-de-condominios.html',
  },
  garante: { next: '/previa-v2/garante', prototipo: '/garante.html' },
  incorporadoras: { next: '/previa-v2/incorporadoras', prototipo: '/incorporadoras.html' },
  tecnologia: { next: '/previa-v2/tecnologia', prototipo: '/tecnologia.html' },
  solucoes: { next: '/previa-v2/solucoes', prototipo: null },
  proposta: { next: '/previa-v2/proposta', prototipo: '/proposta.html' },
  contato: { next: '/previa-v2/contato', prototipo: '/contato.html' },
  'nao-encontrada': { next: '/previa-v2/nao-encontrada', prototipo: '/404.html' },
}
const ALTURAS = { 1440: 900, 390: 844 }
const NAVEGADORES = { chromium, firefox }
const ASSENTAR_MS = 1500
const RUIDO_DE_TERCEIRO = /Cookie .__cf_bm. has been rejected for invalid domain/
const RUIDO_SEM_ENV = /\[turnstile\] NEXT_PUBLIC_TURNSTILE_SITE_KEY ausente/

function lerArgs(argv) {
  const args = {
    next: null,
    prototipo: null,
    saida: null,
    paginas: [],
    navegadores: ['chromium', 'firefox'],
    larguras: [1440, 390],
    semEnv: false,
  }
  const fila = [...argv]
  while (fila.length) {
    const opcao = fila.shift()
    if (opcao === '--build-sem-env') {
      args.semEnv = true
      continue
    }
    const valor = fila.shift()
    if (valor === undefined) throw new Error(`Opção sem valor: ${opcao}`)
    if (opcao === '--next') args.next = valor.replace(/\/+$/, '')
    else if (opcao === '--prototipo') args.prototipo = valor.replace(/\/+$/, '')
    else if (opcao === '--saida') args.saida = valor
    else if (opcao === '--pagina') args.paginas.push(valor)
    else if (opcao === '--navegador') args.navegadores = [valor]
    else if (opcao === '--largura') args.larguras = [Number(valor)]
    else throw new Error(`Opção desconhecida: ${opcao}`)
  }
  if (!args.next || !args.prototipo || !args.saida) {
    throw new Error('Obrigatórios: --next, --prototipo e --saida.')
  }
  if (args.paginas.length === 0) args.paginas = Object.keys(PAGINAS)
  for (const pagina of args.paginas) {
    if (!(pagina in PAGINAS)) throw new Error(`Página desconhecida: ${pagina}`)
  }
  if (!args.navegadores.every((nome) => nome in NAVEGADORES)) {
    throw new Error('--navegador deve ser chromium ou firefox.')
  }
  if (!args.larguras.every((largura) => largura in ALTURAS)) {
    throw new Error('--largura deve ser 1440 ou 390.')
  }
  return args
}

function ouvirErros(pagina, args, marca, problemas) {
  pagina.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const texto = msg.text()
    if (RUIDO_DE_TERCEIRO.test(texto) || (args.semEnv && RUIDO_SEM_ENV.test(texto))) return
    problemas.push(`${marca}: console: ${texto}`)
  })
  pagina.on('pageerror', (erro) => problemas.push(`${marca}: página: ${erro.message}`))
  pagina.on('requestfailed', (req) =>
    problemas.push(`${marca}: requisição: ${req.url()} (${req.failure()?.errorText ?? '?'})`),
  )
  pagina.on('response', (resp) => {
    if (resp.status() >= 400) problemas.push(`${marca}: ${resp.status()} em ${resp.url()}`)
  })
}

async function abrir(contexto, url, args, marca, problemas) {
  const pagina = await contexto.newPage()
  ouvirErros(pagina, args, marca, problemas)
  await pagina.goto(url, { waitUntil: 'load' })
  try {
    await pagina.waitForFunction(() => document.documentElement.classList.contains('motion'), null, {
      timeout: 10_000,
    })
  } catch {
    problemas.push(`${marca}: html.motion não chegou em 10 s`)
  }
  return pagina
}

function idsDasSecoes(pagina) {
  return pagina.evaluate(() =>
    Array.from(document.querySelectorAll('main > section[id]')).map((secao) => secao.id),
  )
}

async function rolarAte(pagina, id) {
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    const alvo = await pagina.evaluate((secao) => {
      const el = document.getElementById(secao)
      if (!el) return null
      const y = Math.round(el.getBoundingClientRect().top + window.scrollY)
      window.scrollTo(0, y)
      return y
    }, id)
    if (alvo === null) return false
    await pagina.waitForTimeout(ASSENTAR_MS)
    const real = await pagina.evaluate(() => window.scrollY)
    if (Math.abs(real - alvo) <= 2) return true
  }
  return true
}

async function varrer(pagina, ids, pasta, lado, marca, problemas) {
  for (const id of ids) {
    if (!(await rolarAte(pagina, id))) {
      problemas.push(`${marca}: #${id} ausente`)
      continue
    }
    await pagina.screenshot({ path: path.join(pasta, `${id}-${lado}.png`) })
  }
  const largo = await pagina.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  )
  if (largo) problemas.push(`${marca}: scroll horizontal`)
}

async function conferirPagina(contexto, args, rotulos, problemas) {
  const { nome, id, largura } = rotulos
  const urls = PAGINAS[id]
  const pasta = path.join(args.saida, nome, String(largura), id)
  mkdirSync(pasta, { recursive: true })
  const marca = `${nome} ${largura} ${id}`
  const next = await abrir(contexto, `${args.next}${urls.next}`, args, `${marca} next`, problemas)
  const ids = await idsDasSecoes(next)
  if (ids.length === 0) problemas.push(`${marca} next: nenhuma seção em main`)
  await varrer(next, ids, pasta, 'next', `${marca} next`, problemas)
  await next.close()
  if (!urls.prototipo) return
  const prototipo = await abrir(
    contexto,
    `${args.prototipo}${urls.prototipo}`,
    args,
    `${marca} protótipo`,
    problemas,
  )
  const doPrototipo = await idsDasSecoes(prototipo)
  const faltam = doPrototipo.filter((secao) => !ids.includes(secao))
  const sobram = ids.filter((secao) => !doPrototipo.includes(secao))
  if (faltam.length) problemas.push(`${marca}: seções do protótipo ausentes no Next: ${faltam}`)
  if (sobram.length) problemas.push(`${marca}: seções do Next fora do protótipo: ${sobram}`)
  await varrer(prototipo, ids.filter((secao) => doPrototipo.includes(secao)), pasta, 'prototipo', `${marca} protótipo`, problemas)
  await prototipo.close()
}

const args = lerArgs(process.argv.slice(2))
const problemas = []
for (const nome of args.navegadores) {
  const navegador = await NAVEGADORES[nome].launch()
  try {
    for (const largura of args.larguras) {
      const contexto = await navegador.newContext({
        viewport: { width: largura, height: ALTURAS[largura] },
      })
      for (const id of args.paginas) {
        await conferirPagina(contexto, args, { nome, id, largura }, problemas)
      }
      await contexto.close()
    }
  } finally {
    await navegador.close()
  }
}
if (problemas.length) {
  console.error(problemas.join('\n'))
  process.exit(1)
}
console.log(`ok: ${args.paginas.length} páginas × ${args.navegadores.length} navegadores × ${args.larguras.length} larguras`)
```

- [ ] **Step 2: Rodar contra o build local e o protótipo**

```powershell
cd C:\Users\lekoc\semogapp\semogsite-site-v2
[string]::IsNullOrEmpty($env:NEXT_PUBLIC_SITE_URL)   # True
pnpm build
Start-Process -NoNewWindow pnpm -ArgumentList 'start','-p','3100'
cd design-explorations\site-v2-prototipo
pnpm install --offline
node build.mjs
Start-Process -NoNewWindow node -ArgumentList 'serve.mjs'
cd ..\..
node scripts/site-v2-institucional.mjs --next http://localhost:3100 --prototipo http://127.0.0.1:4180 --saida C:\Users\lekoc\AppData\Local\Temp\claude\C--Users-lekoc-semogapp-semogsite\fce07e0d-ce5a-4a7f-a870-a8cface08e2b\scratchpad\v4a\varredura --pagina home --pagina semog --pagina gestao --build-sem-env
```

Expected: `ok: 3 páginas × 2 navegadores × 2 larguras`. Se o protótipo não subir na 4180 (`serve.mjs` tenta as dez portas seguintes), usar a porta que ele imprimir. Encerrar os dois servidores ao fim (`Stop-Process` pelo PID impresso por `Get-Process node`), sem matar processo de outro agente: conferir o comando de cada PID antes.

- [ ] **Step 3: Commit do script**

```bash
git branch --show-current && git add scripts/site-v2-institucional.mjs && git commit -m "chore(site-v2): varredura lado a lado das páginas institucionais e do protótipo

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
```

**Daqui em diante, o verificador separado.** Pasta de saída: `…\scratchpad\v4a\`. Relatório em `…\scratchpad\v4a\verificacao.md`, com a saída real de cada comando e os prints citados pelo caminho.

- [ ] **Step 4: Estado da árvore e portões**

Run: `git branch --show-current; git status --short; git log --oneline -12` e os cinco portões da CI.
Expected: branch `feat/site-v2`, árvore limpa, os commits das Tarefas 4.1 a 4.9 em ordem, portões verdes. Anotar a contagem de testes.

- [ ] **Step 5: Build sem env e servidores**

Repetir o Step 2 (build sem `NEXT_PUBLIC_SITE_URL`, `pnpm start -p 3100`, protótipo servido). Confirmar que o servido é o build desta árvore: `curl -s http://localhost:3100/previa-v2 | Select-String -Pattern 'data-pagina="home"'` acha a linha e o `.next/BUILD_ID` tem data de agora (memória: o servidor velho de outro agente responde verde).

- [ ] **Step 6: Quadros por seção, lado a lado, nos dois navegadores e nas duas larguras**

Run: o comando do Step 2 com `--saida …\v4a\varredura`.
Expected: `ok`. Depois, **abrir os pares** `<seção>-next.png` × `<seção>-prototipo.png` de todas as seções das três páginas, em Chromium e Firefox, 1440 e 390, e anotar no relatório cada diferença visível (posição, corte, cor, texto sobreposto, tela vazia). Diferença de texto que vem das respostas do Leandro (Tabela DP-C) é esperada; o resto é achado.

- [ ] **Step 7: Quadros das cenas presas**

Para cada cena com pin e patamares (`home`: `condominios`, `tecnologia`, `ranking`; `semog`: `historia`; `gestao`: `mesa-do-sindico`), nos dois lados, nos dois navegadores e nas duas larguras:

```powershell
node scripts/site-v2-quadros.mjs --url http://localhost:3100/previa-v2 --cena condominios --saida …\v4a\quadros\next\chromium-1440 --navegador chromium --largura 1440
node scripts/site-v2-quadros.mjs --url http://127.0.0.1:4180/index.html --cena condominios --saida …\v4a\quadros\prototipo\chromium-1440 --navegador chromium --largura 1440
```

(trocar `--url`, `--cena`, `--navegador`, `--largura` e a pasta em cada combinação). Expected: código 0 em todas; os quadros 0, 25, 50, 75 e 100% de cada par mostram o mesmo estado da cena.

- [ ] **Step 8: Toque emulado**

```powershell
node scripts/site-v2-toque.mjs --url http://localhost:3100/previa-v2 --cena condominios --cena tecnologia --cena ranking
node scripts/site-v2-toque.mjs --url http://localhost:3100/previa-v2/semog --cena historia
node scripts/site-v2-toque.mjs --url http://localhost:3100/previa-v2/administracao-de-condominios --cena mesa-do-sindico
```

Expected: código 0: depois de cada flick, o pin parado num patamar (±0,02), o flick médio andando no máximo dois patamares, e o desktop sem rolagem sozinha.

- [ ] **Step 9: Ida e volta entre páginas**

Script descartável no scratchpad (não na WT), com Playwright, em Chromium e Firefox, 1440: abrir `/previa-v2`, contar `.pin-spacer` (N₀); clicar "A Semog" no cabeçalho, esperar `html.motion`, contar (N₁); clicar "Gestão", contar (N₂); `page.goBack()` duas vezes, contando de novo em cada parada; e abrir cada uma das três do zero numa aba nova para ter a contagem de referência. Expected: a contagem em cada parada é igual à do carregamento do zero daquela página (nenhum pin herdado nem duplicado); console sem erro; depois do voltar, rolar a página inteira funciona e as cenas animam.

- [ ] **Step 10: Sem JavaScript**

Contexto com `javaScriptEnabled: false`, as três páginas em 1440 e 390: todo o texto das seções no HTML (título, parágrafos, listas), nada escondido (`html.sem-js`), o pedido de proposta mostra o aviso com os telefones das Unidades (DP12 da fase 2). Prints em `…\v4a\sem-js\`.

- [ ] **Step 11: Prévia fechada em produção simulada**

```powershell
cd C:\Users\lekoc\semogapp\semogsite-site-v2
$env:VERCEL_ENV = 'production'; $env:VERCEL = '1'
pnpm build
Start-Process -NoNewWindow pnpm -ArgumentList 'start','-p','3200'
curl.exe -s -o NUL -w "%{http_code} /previa-v2`n" http://localhost:3200/previa-v2
curl.exe -s -o NUL -w "%{http_code} /previa-v2/semog`n" http://localhost:3200/previa-v2/semog
curl.exe -s -o NUL -w "%{http_code} /previa-v2/administracao-de-condominios`n" http://localhost:3200/previa-v2/administracao-de-condominios
curl.exe -s -o NUL -w "%{http_code} /semog`n" http://localhost:3200/semog
Remove-Item Env:VERCEL_ENV; Remove-Item Env:VERCEL
```

Expected: `404` nas três da prévia e `200` em `/semog` (o site atual continua servindo a URL real). Não abrir nenhum formulário neste servidor: com `VERCEL_ENV=production`, um envio seria tratado como de produção. Encerrar o servidor da 3200 e refazer o build normal (`pnpm build`) antes do Step 12.

- [ ] **Step 12: Produção intocada e nenhum envio**

- `node scripts/site-v2-comparar-metadados.mjs --depois http://localhost:3100` (fase 3; GET de leitura no site público, o único acesso fora do `localhost`), contra o build normal: as diferenças são só as já explicadas na fase 3 (nenhuma URL institucional muda de `<head>`).
- Nos logs do `pnpm start` dos Steps 5 a 10, nenhuma invocação de Server Action (nenhum POST com `Next-Action`): ninguém enviou formulário.
- A única mudança fora do v2 é a da Tarefa 4.5a: em `http://localhost:3100/experience`, Chromium e Firefox, 1440 e 390, a seção do vídeo mostra a capa e o título do Experience 26, o play toca o reel, o `.mp4` vem de `/site-v2/videos/` e só baixa depois do play; nada mais na página mudou em relação a `https://www.semog.com.br/experience` (comparar os quadros das demais seções).
- `git status --short` limpo (nenhum print nem script dentro da WT).

- [ ] **Step 13: Veredito**

Relatório com: portões e contagem de testes; tabela de achados (página, seção, navegador, largura, o que difere, print), separando **importante** (cena morta, corte, texto sobreposto, erro de console, pin herdado, texto vedado) de **menor**; e o veredito APROVADO / APROVADO COM RESSALVAS / REPROVADO. Correções de achado importante voltam ao implementador numa leva só, com uma re-verificação de escopo (regra de 28/09: uma rodada final por PR). Ajuste pequeno depois disso a sessão principal confere sozinha.

---

# PR 4b · Garante, Incorporadoras, Tecnologia, Soluções, pacote landing, "Sou cliente", NAP, 404, menu e redirects

O 4b começa da ponta do 4a aprovado (Tarefa 4.9 com veredito APROVADO ou APROVADO COM RESSALVAS e as ressalvas importantes corrigidas).

## Tarefa 4.10: Garante

**Files:**
- Create (seções, `src/site/secoes/garante/`): `Abertura.tsx` (exporta `AberturaDoGarante`) + `abertura.css` (de `sections\garante\01-abertura.html`, `scenes\garante\01-abertura.css`), `Caixa.tsx` (`CaixaDoCondominio`) + `caixa.css` (`02-caixa`), `Papeis.tsx` (`Papeis`) + `papeis.css` (`03-papeis`), `Duvidas.tsx` (`DuvidasDoGarante`) + `duvidas.css` (`04-duvidas`)
- Create (cenas, `src/site/cenas/garante/`): `abertura.ts` (`cenaAberturaDoGarante`), `caixa.ts` (`cenaCaixa`), `papeis.ts` (`cenaPapeis`), `duvidas.ts` (`cenaDuvidas`)
- Create: `src/site/cenas/paginas/garante.tsx`, `src/site/paginas/garante.tsx`, `src/app/(site)/(app)/previa-v2/garante/page.tsx`
- Modify: `src/site/cenas/registro.ts`, `src/site/rotas.ts`, `tests/int/site-v2-core-ssr.int.spec.ts`
- Test: `tests/int/site-v2-pagina-garante.int.spec.tsx`

**Interfaces:**
- Consumes: `EsqueletoApp`, `IdPaginaApp`, `RunnerDeCenas` (4.2), `SecaoProposta`, `cenaProposta` (4.3), `caminhoNoSite`, `comIndice`, `metadadosInstitucionais`, `jsonLdInstitucional`, `JsonLd`, `conferirPagina` (4.4).
- Produces: as quatro seções e as quatro cenas; `CENAS_GARANTE` e `CenasDoGarante()`; `PaginaGarante()`; `CENAS_POR_PAGINA.garante`; `'/garante'` em `PAGINAS_NA_PREVIA`.

Desvios desta página:
- **Dúvidas:** os três `<span class="a-confirmar">` dos itens 0, 3 e 4 saem (as chaves `confirmar` não existem mais); as respostas são as do Leandro (conteúdo, 4.1). O link "Ficou outra dúvida?" segue para `#proposta` (sem WhatsApp, como no protótipo).
- **Abertura e papéis:** a Semog Garante paga; a equipe própria da Semog cobra (conteúdo, 4.1).

- [ ] **Step 1: Escrever o teste da página**

`tests/int/site-v2-pagina-garante.int.spec.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import Pagina, { metadata } from '@/app/(site)/(app)/previa-v2/garante/page'
import { CENAS_GARANTE } from '@/site/cenas/paginas/garante'
import { metadadosInstitucionais } from '@/site/seo/institucional'
import { conferirPagina, type SecaoEsperada } from './helpers/paginas'

vi.mock('@/site/runner/RunnerDeCenas', () => ({ RunnerDeCenas: () => null }))
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))
vi.mock('@/app/(site)/_actions/proposta-duas-etapas', () => ({
  enviarEtapa1: vi.fn(),
  enviarEtapa2: vi.fn(),
  enviarPropostaCompleta: vi.fn(),
}))
vi.mock('@/components/forms/Turnstile', () => ({ Turnstile: () => null }))

afterEach(() => {
  vi.unstubAllEnvs()
})

const FORMULARIO = ['form', '.fp-moldura'] as const

const SECOES: SecaoEsperada[] = [
  { id: 'semog-garante', arquivo: 'garante/01-abertura' },
  { id: 'caixa-do-condominio', arquivo: 'garante/02-caixa' },
  { id: 'papeis', arquivo: 'garante/03-papeis' },
  { id: 'duvidas-garante', arquivo: 'garante/04-duvidas', diferencas: { semClasses: ['a-confirmar'] } },
  {
    id: 'proposta',
    arquivo: '08-proposta',
    diferencas: { ignorar: FORMULARIO, comClasses: ['proposta-metades'] },
  },
]

describe('Semog Garante na prévia', () => {
  it('em produção responde 404, nunca é indexada e o <head> é o de hoje', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false })
    expect(metadata.title).toBe(metadadosInstitucionais('garante').title)
    vi.stubEnv('VERCEL_ENV', 'production')
    expect(() => Pagina()).toThrow('NEXT_HTTP_ERROR_FALLBACK;404')
  })

  it('reproduz as seções do protótipo, na ordem, com as cenas certas', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    conferirPagina(<Pagina />, { dataPagina: 'garante', secoes: SECOES, cenas: CENAS_GARANTE })
  })

  it('as dúvidas respondem como o Leandro respondeu, sem selo', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    const container = conferirPagina(<Pagina />, { dataPagina: 'garante', secoes: SECOES })
    const duvidas = container.querySelector('#duvidas-garante')?.textContent ?? ''
    expect(duvidas).toContain('o contrato é mensal')
    expect(duvidas).toContain('“Semog Garante”')
    expect(duvidas).toContain('1% do valor total da arrecadação')
    expect(duvidas).not.toContain('A CONFIRMAR')
    expect(container.textContent).not.toMatch(/assume a cobrança/)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-pagina-garante.int.spec.tsx`
Expected: FAIL com "Failed to resolve import '@/app/(site)/(app)/previa-v2/garante/page'".

- [ ] **Step 3: Copiar o CSS**

```powershell
$p = 'C:\Users\lekoc\semogapp\semogsite-site-v2\design-explorations\site-v2-prototipo\src\scenes\garante'
$d = 'C:\Users\lekoc\semogapp\semogsite-site-v2\src\site\secoes\garante'
New-Item -ItemType Directory -Force $d | Out-Null
Copy-Item -LiteralPath "$p\01-abertura.css" -Destination "$d\abertura.css"
Copy-Item -LiteralPath "$p\02-caixa.css" -Destination "$d\caixa.css"
Copy-Item -LiteralPath "$p\03-papeis.css" -Destination "$d\papeis.css"
Copy-Item -LiteralPath "$p\04-duvidas.css" -Destination "$d\duvidas.css"
```

- [ ] **Step 4: Portar as quatro seções e as quatro cenas**

Pela receita, com os desvios acima. O caixa do condomínio tem pin por pausas e uma cauda `.to({}, { duration: CAUDA }, …)` sem `onUpdate` (pausa de propósito, sem `data`).

- [ ] **Step 5: Lista de cenas, página, rota, registro e prévia**

`src/site/cenas/paginas/garante.tsx`:

```tsx
'use client'

import type { ListaCenas } from '@/site/core/tipos'
import { RunnerDeCenas } from '@/site/runner/RunnerDeCenas'
import { cenaAberturaDoGarante } from '../garante/abertura'
import { cenaCaixa } from '../garante/caixa'
import { cenaDuvidas } from '../garante/duvidas'
import { cenaPapeis } from '../garante/papeis'
import { cenaProposta } from '../proposta'

/** Cenas do Semog Garante, na ordem das seções (paginas/garante.js do protótipo). */
export const CENAS_GARANTE: ListaCenas = [
  ['semog-garante', cenaAberturaDoGarante],
  ['caixa-do-condominio', cenaCaixa],
  ['papeis', cenaPapeis],
  ['duvidas-garante', cenaDuvidas],
  ['proposta', cenaProposta],
]

export function CenasDoGarante() {
  return <RunnerDeCenas pagina="garante" cenas={CENAS_GARANTE} />
}
```

`src/site/paginas/garante.tsx`:

```tsx
import { CenasDoGarante } from '@/site/cenas/paginas/garante'
import { EsqueletoApp } from '@/site/layout/EsqueletoApp'
import { JsonLd } from '@/site/secoes/comum/JsonLd'
import { AberturaDoGarante } from '@/site/secoes/garante/Abertura'
import { CaixaDoCondominio } from '@/site/secoes/garante/Caixa'
import { DuvidasDoGarante } from '@/site/secoes/garante/Duvidas'
import { Papeis } from '@/site/secoes/garante/Papeis'
import { SecaoProposta } from '@/site/secoes/proposta/SecaoProposta'
import { jsonLdInstitucional } from '@/site/seo/institucional'

/** Corpo do Semog Garante (garante.html do protótipo). A virada 1 o leva a /garante. */
export function PaginaGarante() {
  return (
    <EsqueletoApp pagina="garante" atual="garante" temProposta cenas={<CenasDoGarante />}>
      <JsonLd dados={jsonLdInstitucional('garante')} />
      <AberturaDoGarante />
      <CaixaDoCondominio />
      <Papeis />
      <DuvidasDoGarante />
      <SecaoProposta />
    </EsqueletoApp>
  )
}
```

`src/app/(site)/(app)/previa-v2/garante/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PaginaGarante } from '@/site/paginas/garante'
import { previaLiberada, ROBOTS_DA_PREVIA } from '@/site/previa'
import { metadadosInstitucionais } from '@/site/seo/institucional'

export const metadata: Metadata = { ...metadadosInstitucionais('garante'), robots: ROBOTS_DA_PREVIA }

/** Semog Garante do site v2 na prévia. 404 em produção. */
export default function Pagina() {
  if (!previaLiberada()) notFound()
  return <PaginaGarante />
}
```

`src/site/cenas/registro.ts`: `import { CENAS_GARANTE } from './paginas/garante'` e `garante: CENAS_GARANTE`. `src/site/rotas.ts`: `'/garante'` em `PAGINAS_NA_PREVIA`. `tests/int/site-v2-core-ssr.int.spec.ts`: uma linha por cena de `src/site/cenas/garante/` e `['cenas do Garante', () => import('@/site/cenas/paginas/garante')]`.

- [ ] **Step 6: Rodar e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-pagina-garante.int.spec.tsx tests/int/site-v2-pagina-gestao.int.spec.tsx tests/int/site-v2-core-ssr.int.spec.ts tests/int/site-v2-core-fase4.int.spec.tsx tests/int/site-v2-rotas.int.spec.ts tests/int/site-v2-identidade.int.spec.ts`
Expected: PASS (a Gestão continua verde: o link "Semog Garante" dela agora abre `/previa-v2/garante`).

- [ ] **Step 7: Olhar no navegador antes de commitar**

`pnpm dev`, `http://localhost:3000/previa-v2/garante` em 1440 e 390: o caixa mês a mês (pin), os papéis e as dúvidas; console sem erro.

- [ ] **Step 8: Portões e commit**

Run: os cinco portões. Expected: verdes.

```bash
git branch --show-current && git add src/site/secoes/garante src/site/cenas/garante src/site/cenas/paginas/garante.tsx src/site/paginas/garante.tsx "src/app/(site)/(app)/previa-v2/garante/page.tsx" src/site/cenas/registro.ts src/site/rotas.ts tests/int/site-v2-core-ssr.int.spec.ts tests/int/site-v2-pagina-garante.int.spec.tsx && git commit -m "feat(site-v2): Semog Garante na prévia, com as respostas do Leandro

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
```

---

## Tarefa 4.11: Incorporadoras

**Files:**
- Create (seções, `src/site/secoes/incorporadoras/`): `Abertura.tsx` (`AberturaDasIncorporadoras`) + `abertura.css` (de `sections\incorporadoras\01-abertura.html`, `scenes\incorporadoras\01-abertura.css`), `Convivencia.tsx` (`Convivencia`) + `convivencia.css` (`02-convivencia`), `Percurso.tsx` (`Percurso`) + `percurso.css` (`03-percurso`), `Ganhos.tsx` (`Ganhos`) + `ganhos.css` (`04-ganhos`), `Instalacao.tsx` (`Instalacao`) + `instalacao.css` (`05-instalacao`), `Lancamento.tsx` (`Lancamento`) + `lancamento.css` (`06-lancamento`)
- Create (cenas, `src/site/cenas/incorporadoras/`): `abertura.ts` (`cenaAberturaDasIncorporadoras`), `convivencia.ts` (`cenaConvivencia`), `percurso.ts` (`cenaPercurso`), `ganhos.ts` (`cenaGanhos`), `instalacao.ts` (`cenaInstalacao`), `lancamento.ts` (`cenaLancamento`)
- Create: `public/site-v2/fotos/incorporadoras-obra.webp` (cópia de `PROTOTIPO\src\assets\fotos\incorporadoras-obra.webp`)
- Create: `src/site/cenas/paginas/incorporadoras.tsx`, `src/site/paginas/incorporadoras.tsx`, `src/app/(site)/(app)/previa-v2/incorporadoras/page.tsx`
- Modify: `src/site/conteudo/conteudo.ts`, `src/site/cenas/registro.ts`, `src/site/rotas.ts`, `tests/int/site-v2-core-ssr.int.spec.ts`
- Test: `tests/int/site-v2-pagina-incorporadoras.int.spec.tsx`

**Interfaces:**
- Consumes: o mesmo da 4.10; `SecaoProposta({ perfilInicial })` (4.3).
- Produces: as seis seções e as seis cenas; `CENAS_INCORPORADORAS` e `CenasDasIncorporadoras()`; `PaginaIncorporadoras()`; `CENAS_POR_PAGINA.incorporadoras`; `'/incorporadoras'` em `PAGINAS_NA_PREVIA`; `conteudo.incorporadoras.abertura.foto: '/site-v2/fotos/incorporadoras-obra.webp'`.

Desvios desta página:
- **Abertura, foto da obra:** o `src` vem de `conteudo.incorporadoras.abertura.foto` (chave nova, para o teste de fotos do conteúdo conferir o arquivo); o `<figcaption>` inteiro sai (sem legenda "Imagem ilustrativa." e sem selo, resposta do Leandro). Na cena, `abrirFoto` perde o `.fromTo` da `.ab-foto figcaption` (o terceiro tween da timeline); o resto fica.
- **Lançamento:** o `<p class="ln-parceiras rotulo">` sai (sem a faixa de construtoras, resposta do Leandro). Na cena, o `subir` anima só `.ln-acoes`, e a função `marcarConstrutora` sai: a página passa `perfilInicial="construtora"` à `SecaoProposta`, que marca a opção sem tocar o DOM do formulário pela cena.
- **Percurso:** pin por pausas; "Assembleia de instalação assessorada" e "Suporte jurídico com escritório parceiro" vêm do conteúdo (4.1). O passo "Pós-obra" explica garantia e manutenção, não faz gestão de garantias (guarda de redação).

- [ ] **Step 1: Escrever o teste da página**

`tests/int/site-v2-pagina-incorporadoras.int.spec.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import Pagina, { metadata } from '@/app/(site)/(app)/previa-v2/incorporadoras/page'
import { CENAS_INCORPORADORAS } from '@/site/cenas/paginas/incorporadoras'
import { metadadosInstitucionais } from '@/site/seo/institucional'
import { conferirPagina, type SecaoEsperada } from './helpers/paginas'

vi.mock('@/site/runner/RunnerDeCenas', () => ({ RunnerDeCenas: () => null }))
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))
vi.mock('@/app/(site)/_actions/proposta-duas-etapas', () => ({
  enviarEtapa1: vi.fn(),
  enviarEtapa2: vi.fn(),
  enviarPropostaCompleta: vi.fn(),
}))
vi.mock('@/components/forms/Turnstile', () => ({ Turnstile: () => null }))

afterEach(() => {
  vi.unstubAllEnvs()
})

const FORMULARIO = ['form', '.fp-moldura'] as const

const SECOES: SecaoEsperada[] = [
  { id: 'incorporadoras', arquivo: 'incorporadoras/01-abertura', diferencas: { semClasses: ['a-confirmar'] } },
  { id: 'convivencia', arquivo: 'incorporadoras/02-convivencia' },
  { id: 'percurso', arquivo: 'incorporadoras/03-percurso' },
  { id: 'ganhos', arquivo: 'incorporadoras/04-ganhos' },
  { id: 'instalacao', arquivo: 'incorporadoras/05-instalacao' },
  {
    id: 'lancamento',
    arquivo: 'incorporadoras/06-lancamento',
    diferencas: { semClasses: ['ln-parceiras', 'a-confirmar'] },
  },
  {
    id: 'proposta',
    arquivo: '08-proposta',
    diferencas: { ignorar: FORMULARIO, comClasses: ['proposta-metades'] },
  },
]

describe('Incorporadoras na prévia', () => {
  it('em produção responde 404, nunca é indexada e o <head> é o de hoje', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false })
    expect(metadata.title).toBe(metadadosInstitucionais('incorporadoras').title)
    vi.stubEnv('VERCEL_ENV', 'production')
    expect(() => Pagina()).toThrow('NEXT_HTTP_ERROR_FALLBACK;404')
  })

  it('reproduz as seções do protótipo, na ordem, com as cenas certas', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    conferirPagina(<Pagina />, {
      dataPagina: 'incorporadoras',
      secoes: SECOES,
      cenas: CENAS_INCORPORADORAS,
    })
  })

  it('foto sem legenda, sem faixa de construtoras e o pedido chega com Construtora marcado', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    window.history.replaceState(null, '', '/')
    const container = conferirPagina(<Pagina />, { dataPagina: 'incorporadoras', secoes: SECOES })
    expect(container.querySelector('#incorporadoras .ab-foto img')?.getAttribute('src')).toBe(
      '/site-v2/fotos/incorporadoras-obra.webp',
    )
    expect(container.querySelector('#incorporadoras .ab-foto figcaption')).toBeNull()
    expect(container.textContent).not.toMatch(/Imagem ilustrativa|Construtoras parceiras/)
    expect(
      container.querySelector<HTMLInputElement>('#proposta input[name="perfil"][value="construtora"]')
        ?.checked,
    ).toBe(true)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-pagina-incorporadoras.int.spec.tsx`
Expected: FAIL com "Failed to resolve import '@/app/(site)/(app)/previa-v2/incorporadoras/page'".

- [ ] **Step 3: Foto, conteúdo e CSS**

```powershell
$wt = 'C:\Users\lekoc\semogapp\semogsite-site-v2'
Copy-Item -LiteralPath "$wt\design-explorations\site-v2-prototipo\src\assets\fotos\incorporadoras-obra.webp" -Destination "$wt\public\site-v2\fotos\incorporadoras-obra.webp"
$p = "$wt\design-explorations\site-v2-prototipo\src\scenes\incorporadoras"
$d = "$wt\src\site\secoes\incorporadoras"
New-Item -ItemType Directory -Force $d | Out-Null
foreach ($par in @(('01-abertura','abertura'),('02-convivencia','convivencia'),('03-percurso','percurso'),('04-ganhos','ganhos'),('05-instalacao','instalacao'),('06-lancamento','lancamento'))) {
  Copy-Item -LiteralPath "$p\$($par[0]).css" -Destination "$d\$($par[1]).css"
}
```

Em `src/site/conteudo/conteudo.ts`, em `incorporadoras.abertura`, antes de `fotoAlt`: `foto: '/site-v2/fotos/incorporadoras-obra.webp',`.

- [ ] **Step 4: Portar as seis seções e as seis cenas**

Pela receita, com os desvios acima. `Lancamento` não recebe props; o `perfilInicial` vai na página.

- [ ] **Step 5: Lista de cenas, página, rota, registro e prévia**

`src/site/cenas/paginas/incorporadoras.tsx`:

```tsx
'use client'

import type { ListaCenas } from '@/site/core/tipos'
import { RunnerDeCenas } from '@/site/runner/RunnerDeCenas'
import { cenaAberturaDasIncorporadoras } from '../incorporadoras/abertura'
import { cenaConvivencia } from '../incorporadoras/convivencia'
import { cenaGanhos } from '../incorporadoras/ganhos'
import { cenaInstalacao } from '../incorporadoras/instalacao'
import { cenaLancamento } from '../incorporadoras/lancamento'
import { cenaPercurso } from '../incorporadoras/percurso'
import { cenaProposta } from '../proposta'

/** Cenas de Incorporadoras, na ordem das seções (paginas/incorporadoras.js do protótipo). */
export const CENAS_INCORPORADORAS: ListaCenas = [
  ['incorporadoras', cenaAberturaDasIncorporadoras],
  ['convivencia', cenaConvivencia],
  ['percurso', cenaPercurso],
  ['ganhos', cenaGanhos],
  ['instalacao', cenaInstalacao],
  ['lancamento', cenaLancamento],
  ['proposta', cenaProposta],
]

export function CenasDasIncorporadoras() {
  return <RunnerDeCenas pagina="incorporadoras" cenas={CENAS_INCORPORADORAS} />
}
```

`src/site/paginas/incorporadoras.tsx`:

```tsx
import { CenasDasIncorporadoras } from '@/site/cenas/paginas/incorporadoras'
import { EsqueletoApp } from '@/site/layout/EsqueletoApp'
import { JsonLd } from '@/site/secoes/comum/JsonLd'
import { AberturaDasIncorporadoras } from '@/site/secoes/incorporadoras/Abertura'
import { Convivencia } from '@/site/secoes/incorporadoras/Convivencia'
import { Ganhos } from '@/site/secoes/incorporadoras/Ganhos'
import { Instalacao } from '@/site/secoes/incorporadoras/Instalacao'
import { Lancamento } from '@/site/secoes/incorporadoras/Lancamento'
import { Percurso } from '@/site/secoes/incorporadoras/Percurso'
import { SecaoProposta } from '@/site/secoes/proposta/SecaoProposta'
import { jsonLdInstitucional } from '@/site/seo/institucional'

/**
 * Corpo de Incorporadoras (incorporadoras.html do protótipo). Quem pede proposta daqui é, quase
 * sempre, construtora: o pedido chega com a opção marcada (e continua trocável).
 */
export function PaginaIncorporadoras() {
  return (
    <EsqueletoApp
      pagina="incorporadoras"
      atual="incorporadoras"
      temProposta
      cenas={<CenasDasIncorporadoras />}
    >
      <JsonLd dados={jsonLdInstitucional('incorporadoras')} />
      <AberturaDasIncorporadoras />
      <Convivencia />
      <Percurso />
      <Ganhos />
      <Instalacao />
      <Lancamento />
      <SecaoProposta perfilInicial="construtora" />
    </EsqueletoApp>
  )
}
```

`src/app/(site)/(app)/previa-v2/incorporadoras/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PaginaIncorporadoras } from '@/site/paginas/incorporadoras'
import { previaLiberada, ROBOTS_DA_PREVIA } from '@/site/previa'
import { metadadosInstitucionais } from '@/site/seo/institucional'

export const metadata: Metadata = {
  ...metadadosInstitucionais('incorporadoras'),
  robots: ROBOTS_DA_PREVIA,
}

/** Incorporadoras do site v2 na prévia. 404 em produção. */
export default function Pagina() {
  if (!previaLiberada()) notFound()
  return <PaginaIncorporadoras />
}
```

`src/site/cenas/registro.ts`: `import { CENAS_INCORPORADORAS } from './paginas/incorporadoras'` e `incorporadoras: CENAS_INCORPORADORAS`. `src/site/rotas.ts`: `'/incorporadoras'` em `PAGINAS_NA_PREVIA`. `tests/int/site-v2-core-ssr.int.spec.ts`: uma linha por cena de `src/site/cenas/incorporadoras/` e `['cenas de Incorporadoras', () => import('@/site/cenas/paginas/incorporadoras')]`.

- [ ] **Step 6: Rodar e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-pagina-incorporadoras.int.spec.tsx tests/int/site-v2-conteudo.int.spec.ts tests/int/site-v2-core-ssr.int.spec.ts tests/int/site-v2-core-fase4.int.spec.tsx tests/int/site-v2-rotas.int.spec.ts tests/int/site-v2-identidade.int.spec.ts`
Expected: PASS (o `site-v2-conteudo` confere que a foto nova existe em `public/`).

- [ ] **Step 7: Olhar no navegador antes de commitar**

`pnpm dev`, `http://localhost:3000/previa-v2/incorporadoras` em 1440 e 390: a obra abre sem legenda, o percurso da planta às chaves (pin), o lançamento sem a faixa e o pedido com "Construtora" marcado na etapa 2; console sem erro.

- [ ] **Step 8: Portões e commit**

Run: os cinco portões. Expected: verdes.

```bash
git branch --show-current && git add src/site/secoes/incorporadoras src/site/cenas/incorporadoras public/site-v2/fotos/incorporadoras-obra.webp src/site/conteudo/conteudo.ts src/site/cenas/paginas/incorporadoras.tsx src/site/paginas/incorporadoras.tsx "src/app/(site)/(app)/previa-v2/incorporadoras/page.tsx" src/site/cenas/registro.ts src/site/rotas.ts tests/int/site-v2-core-ssr.int.spec.ts tests/int/site-v2-pagina-incorporadoras.int.spec.tsx && git commit -m "feat(site-v2): Incorporadoras na prévia, sem legenda na obra e sem faixa de construtoras

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
```

---

## Tarefa 4.12: Tecnologia (URL nova)

**Files:**
- Create (seções, `src/site/secoes/tecnologia/`): `Abertura.tsx` (`AberturaDaTecnologia`) + `abertura.css` (de `sections\tecnologia\01-abertura.html`, `scenes\tecnologia\01-abertura.css`), `Mes.tsx` (`UmMesDeCondominio`) + `mes.css` (`02-mes`), `Evolucao.tsx` (`Evolucao`) + `evolucao.css` (`03-evolucao`), `Conferencia.tsx` (`Conferencia`) + `conferencia.css` (`04-conferencia`)
- Create (cenas, `src/site/cenas/tecnologia/`): `abertura.ts` (`cenaAberturaDaTecnologia`), `mes.ts` (`cenaMes`), `evolucao.ts` (`cenaEvolucao`), `conferencia.ts` (`cenaConferencia`)
- Create: `src/site/cenas/paginas/tecnologia.tsx`, `src/site/paginas/tecnologia.tsx`, `src/app/(site)/(app)/previa-v2/tecnologia/page.tsx`
- Modify: `src/site/cenas/registro.ts`, `src/site/rotas.ts`, `tests/int/site-v2-core-ssr.int.spec.ts`
- Test: `tests/int/site-v2-pagina-tecnologia.int.spec.tsx`

**Interfaces:**
- Consumes: o mesmo da 4.10; `fraseDosNumerosDaPrestacao` (4.6); `conteudo.tecnologia.numerosDaPrestacao`, `estaPendente`, `<Pendencia>` (4.1); `META_DA_TECNOLOGIA` (4.4).
- Produces: as quatro seções e as quatro cenas; `CENAS_TECNOLOGIA` e `CenasDaTecnologia()`; `PaginaTecnologia()`; `CENAS_POR_PAGINA.tecnologia`; `'/tecnologia'` em `PAGINAS_NA_PREVIA`.

Desvios desta página:
- **Abertura, números:** com `numerosDaPrestacao` pendente, os dois primeiros `.so-numero` mostram `<span className="so-in"><Pendencia item={…} /></span>` no `<dd>` (sem `data-conta` nem `data-prefixo`) e o rótulo do conteúdo; com o dado, `data-conta={numeros.prestacoes}` e `data-prefixo="+"` no primeiro, `data-conta={numeros.condominios}` no segundo, e o rótulo do primeiro termina com `, até ${numeros.corte}`. O terceiro número ("Toda semana") não muda. Na cena, a contagem só roda nos `[data-conta]` presentes.
- **Um mês, momento "Dia 1":** o `<p class="ms-apoio rotulo">` com "Boleto inteligente" e o selo sai inteiro.
- **Um mês, apoio do fim do mês** (`{{tecnologia.contexto}}`, linha 234 da parcial): `{conteudo.tecnologia.contexto}` seguido do selo ou da frase dos números, como na home (4.6).

- [ ] **Step 1: Escrever o teste da página**

`tests/int/site-v2-pagina-tecnologia.int.spec.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import Pagina, { metadata } from '@/app/(site)/(app)/previa-v2/tecnologia/page'
import { CENAS_TECNOLOGIA } from '@/site/cenas/paginas/tecnologia'
import { conteudo } from '@/site/conteudo/conteudo'
import { estaPendente } from '@/site/conteudo/pendencias'
import { META_DA_TECNOLOGIA } from '@/site/seo/institucional'
import { conferirPagina, type SecaoEsperada } from './helpers/paginas'

vi.mock('@/site/runner/RunnerDeCenas', () => ({ RunnerDeCenas: () => null }))
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))
vi.mock('@/app/(site)/_actions/proposta-duas-etapas', () => ({
  enviarEtapa1: vi.fn(),
  enviarEtapa2: vi.fn(),
  enviarPropostaCompleta: vi.fn(),
}))
vi.mock('@/components/forms/Turnstile', () => ({ Turnstile: () => null }))

afterEach(() => {
  vi.unstubAllEnvs()
})

const FORMULARIO = ['form', '.fp-moldura'] as const
const PENDENTES = estaPendente(conteudo.tecnologia.numerosDaPrestacao)

const SECOES: SecaoEsperada[] = [
  {
    id: 'semog-one',
    arquivo: 'tecnologia/01-abertura',
    diferencas: PENDENTES ? { semDados: ['data-conta', 'data-prefixo'], comClasses: ['a-confirmar'] } : {},
  },
  {
    id: 'mes',
    arquivo: 'tecnologia/02-mes',
    diferencas: PENDENTES ? {} : { semClasses: ['a-confirmar'] },
  },
  { id: 'evolucao', arquivo: 'tecnologia/03-evolucao' },
  { id: 'conferencia', arquivo: 'tecnologia/04-conferencia' },
  {
    id: 'proposta',
    arquivo: '08-proposta',
    diferencas: { ignorar: FORMULARIO, comClasses: ['proposta-metades'] },
  },
]

describe('Tecnologia (URL nova) na prévia', () => {
  it('em produção responde 404, nunca é indexada e tem o <head> do protótipo', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false })
    expect(metadata.title).toBe(META_DA_TECNOLOGIA.title)
    expect(metadata.alternates?.canonical).toBe('https://www.semog.com.br/tecnologia')
    vi.stubEnv('VERCEL_ENV', 'production')
    expect(() => Pagina()).toThrow('NEXT_HTTP_ERROR_FALLBACK;404')
  })

  it('reproduz as seções do protótipo, na ordem, com as cenas certas', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    conferirPagina(<Pagina />, {
      dataPagina: 'tecnologia',
      secoes: SECOES,
      cenas: CENAS_TECNOLOGIA,
    })
  })

  it('sem número inventado: 670 e 220 sumiram, e o boleto inteligente também', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    const container = conferirPagina(<Pagina />, { dataPagina: 'tecnologia', secoes: SECOES })
    const texto = container.textContent ?? ''
    expect(texto).not.toMatch(/\b670\b|\b220\b/)
    expect(texto).not.toMatch(/Boleto inteligente/i)
    expect(texto).toContain('Prestação de contas digital desde 2023.')
    if (PENDENTES) {
      expect(container.querySelectorAll('#semog-one .so-numero .a-confirmar')).toHaveLength(2)
      expect(container.querySelector('#semog-one [data-conta]')).toBeNull()
    }
  })
})
```

(O `02-mes` do protótipo tem um selo `a-confirmar` que sai; com os números pendentes, o selo novo no apoio do fim do mês repõe a classe, então a diferença só existe quando os números chegarem.)

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-pagina-tecnologia.int.spec.tsx`
Expected: FAIL com "Failed to resolve import '@/app/(site)/(app)/previa-v2/tecnologia/page'".

- [ ] **Step 3: Copiar o CSS**

```powershell
$p = 'C:\Users\lekoc\semogapp\semogsite-site-v2\design-explorations\site-v2-prototipo\src\scenes\tecnologia'
$d = 'C:\Users\lekoc\semogapp\semogsite-site-v2\src\site\secoes\tecnologia'
New-Item -ItemType Directory -Force $d | Out-Null
Copy-Item -LiteralPath "$p\01-abertura.css" -Destination "$d\abertura.css"
Copy-Item -LiteralPath "$p\02-mes.css" -Destination "$d\mes.css"
Copy-Item -LiteralPath "$p\03-evolucao.css" -Destination "$d\evolucao.css"
Copy-Item -LiteralPath "$p\04-conferencia.css" -Destination "$d\conferencia.css"
```

- [ ] **Step 4: Portar as quatro seções e as quatro cenas**

Pela receita, com os desvios acima. O mês tem pin por pausas e um tween de `{ c: ate, …, onUpdate: desenhar }` (anima `c`: não é tween de callback, não precisa de `data`).

- [ ] **Step 5: Lista de cenas, página, rota, registro e prévia**

`src/site/cenas/paginas/tecnologia.tsx`:

```tsx
'use client'

import type { ListaCenas } from '@/site/core/tipos'
import { RunnerDeCenas } from '@/site/runner/RunnerDeCenas'
import { cenaProposta } from '../proposta'
import { cenaAberturaDaTecnologia } from '../tecnologia/abertura'
import { cenaConferencia } from '../tecnologia/conferencia'
import { cenaEvolucao } from '../tecnologia/evolucao'
import { cenaMes } from '../tecnologia/mes'

/** Cenas da Tecnologia, na ordem das seções (paginas/tecnologia.js do protótipo). */
export const CENAS_TECNOLOGIA: ListaCenas = [
  ['semog-one', cenaAberturaDaTecnologia],
  ['mes', cenaMes],
  ['evolucao', cenaEvolucao],
  ['conferencia', cenaConferencia],
  ['proposta', cenaProposta],
]

export function CenasDaTecnologia() {
  return <RunnerDeCenas pagina="tecnologia" cenas={CENAS_TECNOLOGIA} />
}
```

`src/site/paginas/tecnologia.tsx`:

```tsx
import { CenasDaTecnologia } from '@/site/cenas/paginas/tecnologia'
import { EsqueletoApp } from '@/site/layout/EsqueletoApp'
import { JsonLd } from '@/site/secoes/comum/JsonLd'
import { SecaoProposta } from '@/site/secoes/proposta/SecaoProposta'
import { AberturaDaTecnologia } from '@/site/secoes/tecnologia/Abertura'
import { Conferencia } from '@/site/secoes/tecnologia/Conferencia'
import { Evolucao } from '@/site/secoes/tecnologia/Evolucao'
import { UmMesDeCondominio } from '@/site/secoes/tecnologia/Mes'
import { jsonLdInstitucional } from '@/site/seo/institucional'

/** Corpo da Tecnologia (tecnologia.html do protótipo), URL nova. A virada 1 o leva a /tecnologia. */
export function PaginaTecnologia() {
  return (
    <EsqueletoApp pagina="tecnologia" atual="tecnologia" temProposta cenas={<CenasDaTecnologia />}>
      <JsonLd dados={jsonLdInstitucional('tecnologia')} />
      <AberturaDaTecnologia />
      <UmMesDeCondominio />
      <Evolucao />
      <Conferencia />
      <SecaoProposta />
    </EsqueletoApp>
  )
}
```

`src/app/(site)/(app)/previa-v2/tecnologia/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PaginaTecnologia } from '@/site/paginas/tecnologia'
import { previaLiberada, ROBOTS_DA_PREVIA } from '@/site/previa'
import { metadadosInstitucionais } from '@/site/seo/institucional'

export const metadata: Metadata = {
  ...metadadosInstitucionais('tecnologia'),
  robots: ROBOTS_DA_PREVIA,
}

/** Tecnologia do site v2 na prévia (URL nova). 404 em produção. */
export default function Pagina() {
  if (!previaLiberada()) notFound()
  return <PaginaTecnologia />
}
```

`src/site/cenas/registro.ts`: `import { CENAS_TECNOLOGIA } from './paginas/tecnologia'` e `tecnologia: CENAS_TECNOLOGIA`. `src/site/rotas.ts`: `'/tecnologia'` em `PAGINAS_NA_PREVIA`. `tests/int/site-v2-core-ssr.int.spec.ts`: uma linha por cena de `src/site/cenas/tecnologia/` e `['cenas da Tecnologia', () => import('@/site/cenas/paginas/tecnologia')]`.

- [ ] **Step 6: Rodar e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-pagina-tecnologia.int.spec.tsx tests/int/site-v2-pagina-gestao.int.spec.tsx tests/int/site-v2-core-ssr.int.spec.ts tests/int/site-v2-core-fase4.int.spec.tsx tests/int/site-v2-rotas.int.spec.ts tests/int/site-v2-identidade.int.spec.ts tests/int/site-v2-inventario.int.spec.ts tests/int/sitemap.int.spec.ts`
Expected: PASS. O sitemap não ganha `/tecnologia` (só na virada: `servidaComoPagina` com `nova: true`).

- [ ] **Step 7: Olhar no navegador antes de commitar**

`pnpm dev`, `http://localhost:3000/previa-v2/tecnologia` em 1440 e 390: a abertura com os dois selos, o mês de condomínio (pin longo) sem "Boleto inteligente", a evolução e a conferência; console sem erro.

- [ ] **Step 8: Portões e commit**

Run: os cinco portões. Expected: verdes.

```bash
git branch --show-current && git add src/site/secoes/tecnologia src/site/cenas/tecnologia src/site/cenas/paginas/tecnologia.tsx src/site/paginas/tecnologia.tsx "src/app/(site)/(app)/previa-v2/tecnologia/page.tsx" src/site/cenas/registro.ts src/site/rotas.ts tests/int/site-v2-core-ssr.int.spec.ts tests/int/site-v2-pagina-tecnologia.int.spec.tsx && git commit -m "feat(site-v2): Tecnologia (URL nova) na prévia, com os números da prestação pendentes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
```

(`git add src/site/secoes/tecnologia` inclui o `numeros.ts` da 4.6, sem mudança.)

---

## Tarefa 4.13: Soluções (`/solucoes` mantida, portada sem protótipo)

A página não tem protótipo (DP11). O texto é o de `conteudo.solucoesPagina` (4.1); o visual usa só as peças do site v2 (Saira leve com ênfase por peso, Barlow, métrica áurea, blocos gelo de ponta reta), sem cena além da proposta. Antes do PR fechar, os quadros vão ao Leandro (Tarefa 4.20, Step 15).

**Files:**
- Create (`src/site/secoes/solucoes/`): `AberturaDeSolucoes.tsx` + `abertura.css`, `TiposDeCondominio.tsx` + `tipos.css`, `PorqueSemog.tsx` + `porque.css`, `BlocoDeSolucao.tsx` + `bloco.css`, `PerguntasDeSolucoes.tsx` + `perguntas.css`
- Create: `src/site/cenas/paginas/solucoes.tsx`, `src/site/paginas/solucoes.tsx`, `src/app/(site)/(app)/previa-v2/solucoes/page.tsx`
- Modify: `src/site/cenas/registro.ts`, `src/site/rotas.ts`, `src/site/layout/Rodape.tsx` (link para `/solucoes`)
- Test: `tests/int/site-v2-pagina-solucoes.int.spec.tsx`

**Interfaces:**
- Consumes: `conteudo.solucoesPagina` (4.1), `EsqueletoApp`, `SecaoProposta`, `cenaProposta`, `caminhoNoSite`, `JsonLd`, `metadadosInstitucionais`, `jsonLdInstitucional`, `conferirPagina`.
- Produces: `AberturaDeSolucoes()`, `TiposDeCondominio()`, `PorqueSemog()`, `BlocoDeSolucao({ bloco }: { bloco: DadosDoBloco })` com `type DadosDoBloco = { id: string; tema: 'claro' | 'gelo'; titulo: string; texto: string; itens: ReadonlyArray<{ titulo: string; texto: string; estado?: string }>; destaque?: string; link?: { href: string; rotulo: string } }`, `PerguntasDeSolucoes()`; `CENAS_SOLUCOES` e `CenasDasSolucoes()`; `PaginaSolucoes()`; `CENAS_POR_PAGINA.solucoes`; `'/solucoes'` em `PAGINAS_NA_PREVIA`.

As âncoras da página no ar continuam (`#residenciais`, `#comerciais`, `#associacoes`, `#prestacao`, `#garante`, `#aplicativo`, `#beneficios`), menos `#tecnologia`, que é id de seção da home e levaria o CSS dela (`#tecnologia …`) se o Next juntar os CSS das rotas: a seção vira `#software-de-dono`. Os links internos da `/solucoes` no ar que apontam para `#tecnologia` são só os do rodapé antigo, que sai na virada.

- [ ] **Step 1: Escrever o teste da página**

`tests/int/site-v2-pagina-solucoes.int.spec.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import Pagina, { metadata } from '@/app/(site)/(app)/previa-v2/solucoes/page'
import { CENAS_SOLUCOES } from '@/site/cenas/paginas/solucoes'
import { conteudo } from '@/site/conteudo/conteudo'
import { metadadosInstitucionais } from '@/site/seo/institucional'
import { conferirPagina, type SecaoEsperada } from './helpers/paginas'

vi.mock('@/site/runner/RunnerDeCenas', () => ({ RunnerDeCenas: () => null }))
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))
vi.mock('@/app/(site)/_actions/proposta-duas-etapas', () => ({
  enviarEtapa1: vi.fn(),
  enviarEtapa2: vi.fn(),
  enviarPropostaCompleta: vi.fn(),
}))
vi.mock('@/components/forms/Turnstile', () => ({ Turnstile: () => null }))

afterEach(() => {
  vi.unstubAllEnvs()
})

const SECOES: SecaoEsperada[] = [
  { id: 'solucoes', arquivo: null },
  { id: 'tipos-de-condominio', arquivo: null },
  { id: 'porque-semog', arquivo: null },
  { id: 'prestacao', arquivo: null },
  { id: 'garante', arquivo: null },
  { id: 'aplicativo', arquivo: null },
  { id: 'software-de-dono', arquivo: null },
  { id: 'beneficios', arquivo: null },
  { id: 'perguntas-solucoes', arquivo: null },
  {
    id: 'proposta',
    arquivo: '08-proposta',
    diferencas: { ignorar: ['form', '.fp-moldura'], comClasses: ['proposta-metades'] },
  },
]

describe('/solucoes na prévia', () => {
  it('em produção responde 404, nunca é indexada e o <head> é o de hoje', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false })
    expect(metadata.title).toBe(metadadosInstitucionais('solucoes').title)
    vi.stubEnv('VERCEL_ENV', 'production')
    expect(() => Pagina()).toThrow('NEXT_HTTP_ERROR_FALLBACK;404')
  })

  it('tem as seções da página no ar, reescritas, com a proposta no fim', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    conferirPagina(<Pagina />, { dataPagina: 'solucoes', secoes: SECOES, cenas: CENAS_SOLUCOES })
  })

  it('nenhuma das frases vetadas da página no ar sobrou', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    const container = conferirPagina(<Pagina />, { dataPagina: 'solucoes', secoes: SECOES })
    const texto = container.textContent ?? ''
    for (const vetada of [
      /o único produto/i,
      /primeiro chatbot/i,
      /nenhuma (outra )?administradora/i,
      /inadimplência zero/i,
      /previsto para 2026/i,
      /quando a Semog assume/i,
      /internet mais barata/i,
    ]) {
      expect(texto, String(vetada)).not.toMatch(vetada)
    }
    expect(texto).toContain(conteudo.solucoesPagina.clube.texto)
    for (const ancora of ['residenciais', 'comerciais', 'associacoes', 'prestacao', 'garante', 'aplicativo', 'beneficios']) {
      expect(container.querySelector(`#${ancora}`), ancora).not.toBeNull()
    }
    expect(container.querySelectorAll('h1')).toHaveLength(1)
    expect(container.querySelectorAll('#perguntas-solucoes details')).toHaveLength(
      conteudo.solucoesPagina.perguntas.itens.length,
    )
  })

  it('tem link interno no rodapé (decisão de 16/10/2026) e fica fora do menu, como o protótipo', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    const container = conferirPagina(<Pagina />, { dataPagina: 'solucoes', secoes: SECOES })
    expect(container.querySelector('footer a[href="/previa-v2/solucoes"]')?.textContent).toBe('Soluções')
    expect(container.querySelector('header a[href="/previa-v2/solucoes"]')).toBeNull()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-pagina-solucoes.int.spec.tsx`
Expected: FAIL com "Failed to resolve import '@/app/(site)/(app)/previa-v2/solucoes/page'".

- [ ] **Step 3: As seções**

`src/site/secoes/solucoes/AberturaDeSolucoes.tsx`:

```tsx
import './abertura.css'
import { conteudo } from '@/site/conteudo/conteudo'

/** Soluções · abertura: o que a Semog cobre, numa frase, e o pedido de proposta. */
export function AberturaDeSolucoes() {
  const { abertura } = conteudo.solucoesPagina
  return (
    <section id="solucoes" className="cena sl-abertura" data-tema="claro" aria-labelledby="sl-titulo">
      <div className="container">
        <h1 id="sl-titulo" className="sl-titulo">
          {abertura.antes} <em className="peso">{abertura.enfase}</em>
        </h1>
        <p className="lead">{abertura.lead}</p>
        <div className="sl-acoes">
          <a className="botao" href="#proposta">
            {abertura.botao}
            <svg className="seta" aria-hidden="true">
              <use href="#seta" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}
```

`src/site/secoes/solucoes/abertura.css`:

```css
/* Soluções · abertura (sem protótipo, DP11 do plano da fase 4): título leve com a ênfase por
   peso, o lead e o botão. Mesma escala das aberturas do pacote app. */
.sl-abertura {
  padding-top: calc(var(--cab) + clamp(var(--e5), 9svh, var(--e7)));
}
.sl-abertura .sl-titulo {
  max-width: 16ch;
  font-family: var(--fonte-titulo);
  font-size: var(--t-display);
  font-weight: var(--peso-titulo);
  line-height: 0.98;
  letter-spacing: var(--tracking-display);
  color: var(--tema-titulo);
}
.sl-abertura .lead {
  margin-top: var(--e4);
  max-width: 46ch;
}
.sl-abertura .sl-acoes {
  margin-top: var(--e5);
}
```

`src/site/secoes/solucoes/TiposDeCondominio.tsx`:

```tsx
import './tipos.css'
import { conteudo } from '@/site/conteudo/conteudo'

/** Soluções · os três tipos atendidos (residenciais, comerciais, associações), com as âncoras de hoje. */
export function TiposDeCondominio() {
  return (
    <section
      id="tipos-de-condominio"
      className="cena sl-tipos"
      data-tema="gelo"
      aria-label="Tipos de condomínio atendidos"
    >
      <div className="container">
        {conteudo.solucoesPagina.tipos.map((tipo) => (
          <article key={tipo.id} id={tipo.id} className="sl-tipo" aria-labelledby={`${tipo.id}-titulo`}>
            <p className="rotulo">{tipo.rotulo}</p>
            <div>
              <h2 id={`${tipo.id}-titulo`} className="sl-tipo-titulo">
                {tipo.titulo}
              </h2>
              <p className="sl-tipo-texto">{tipo.texto}</p>
              {tipo.itens.length > 0 ? (
                <ul className="sl-itens">
                  {tipo.itens.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
```

`src/site/secoes/solucoes/tipos.css`:

```css
/* Soluções · tipos: cada tipo na métrica áurea (rótulo 38,2, título e texto 61,8), com os itens
   numa fileira de marcadores quadrados de ponta reta. Separação por espaço, não por linha. */
.sl-tipos .sl-tipo {
  display: grid;
  grid-template-columns: var(--menor) var(--maior);
  gap: var(--e2) var(--e5);
}
.sl-tipos .sl-tipo + .sl-tipo {
  margin-top: var(--e6);
}
.sl-tipo .sl-tipo-titulo {
  font-family: var(--fonte-titulo);
  font-size: var(--t-h3);
  font-weight: var(--peso-titulo);
  line-height: 1.05;
  letter-spacing: var(--tracking-titulo);
  color: var(--tema-titulo);
}
.sl-tipo .sl-tipo-texto {
  margin-top: var(--e3);
  max-width: var(--largura-texto);
}
.sl-itens {
  display: flex;
  flex-wrap: wrap;
  gap: var(--e1) var(--e4);
  margin: var(--e3) 0 0;
  padding: 0;
  list-style: none;
}
.sl-itens li {
  display: inline-flex;
  align-items: center;
  gap: var(--e1);
  font-weight: 500;
  color: var(--tema-titulo);
}
.sl-itens li::before {
  content: "";
  flex: none;
  width: 8px;
  height: 8px;
  background: var(--marinho);
}
@media (max-width: 760px) {
  .sl-tipos .sl-tipo {
    grid-template-columns: 1fr;
  }
}
```

`src/site/secoes/solucoes/PorqueSemog.tsx`:

```tsx
import './porque.css'
import { conteudo } from '@/site/conteudo/conteudo'

/** Soluções · o que muda com a Semog: cinco fatos, em blocos gelo de ponta reta. */
export function PorqueSemog() {
  const { porque } = conteudo.solucoesPagina
  return (
    <section id="porque-semog" className="cena sl-porque" data-tema="claro" aria-labelledby="sl-porque-titulo">
      <div className="container">
        <h2 id="sl-porque-titulo" className="sl-porque-titulo">
          {porque.titulo}
        </h2>
        <ul className="sl-fatos">
          {porque.itens.map((item) => (
            <li key={item.titulo} className="sl-fato">
              {item.valor ? <span className="sl-fato-valor num">{item.valor}</span> : null}
              <strong className="sl-fato-titulo">{item.titulo}</strong>
              <span>{item.texto}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
```

`src/site/secoes/solucoes/porque.css`:

```css
/* Soluções · porque: cinco fatos em blocos gelo, o número em Saira leve quando há. */
.sl-porque .sl-porque-titulo {
  font-family: var(--fonte-titulo);
  font-size: var(--t-h2);
  font-weight: var(--peso-titulo);
  line-height: var(--lh-titulo);
  letter-spacing: var(--tracking-titulo);
  color: var(--tema-titulo);
}
.sl-fatos {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--e2);
  margin: var(--e5) 0 0;
  padding: 0;
  list-style: none;
}
.sl-fato {
  display: grid;
  align-content: start;
  gap: var(--e1);
  padding: var(--e4) var(--e3);
  background: var(--gelo);
}
.sl-fato-valor {
  font-size: var(--t-h3);
  font-weight: 300;
  line-height: 1;
  color: var(--marinho);
}
.sl-fato-titulo {
  font-weight: 600;
  color: var(--marinho);
}
@media (max-width: 1080px) {
  .sl-fatos {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 420px) {
  .sl-fatos {
    grid-template-columns: 1fr;
  }
}
```

`src/site/secoes/solucoes/BlocoDeSolucao.tsx`:

```tsx
import './bloco.css'

export type DadosDoBloco = {
  id: string
  tema: 'claro' | 'gelo'
  titulo: string
  texto: string
  itens: ReadonlyArray<{ titulo: string; texto: string; estado?: string }>
  destaque?: string
  link?: { href: string; rotulo: string }
}

/**
 * Soluções · um bloco (prestação, Garante, aplicativo, software, clube): título e texto à
 * esquerda (38,2), os itens em blocos à direita (61,8). Sem itens, o texto ocupa a linha.
 */
export function BlocoDeSolucao({ bloco }: { bloco: DadosDoBloco }) {
  const tituloId = `${bloco.id}-titulo`
  return (
    <section id={bloco.id} className="cena sl-bloco" data-tema={bloco.tema} aria-labelledby={tituloId}>
      <div className="container sl-bloco-grade">
        <div>
          <h2 id={tituloId} className="sl-bloco-titulo">
            {bloco.titulo}
          </h2>
          <p className="sl-bloco-texto">{bloco.texto}</p>
          {bloco.destaque ? <p className="sl-bloco-destaque">{bloco.destaque}</p> : null}
          {bloco.link ? (
            <a className="link-seta" href={bloco.link.href}>
              <span>{bloco.link.rotulo}</span>
              <svg className="seta" aria-hidden="true">
                <use href="#seta" />
              </svg>
            </a>
          ) : null}
        </div>
        {bloco.itens.length > 0 ? (
          <ul className="sl-lista">
            {bloco.itens.map((item) => (
              <li key={item.titulo}>
                {item.estado ? <span className="rotulo sl-estado">{item.estado}</span> : null}
                <h3>{item.titulo}</h3>
                <p>{item.texto}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  )
}
```

`src/site/secoes/solucoes/bloco.css`:

```css
/* Soluções · bloco: métrica áurea, itens em blocos de ponta reta (gelo no tema claro, branco no
   gelo). Sem linha fina como divisor: o que separa é o bloco e o espaço. */
.sl-bloco .sl-bloco-grade {
  display: grid;
  grid-template-columns: var(--menor) var(--maior);
  gap: var(--e4) var(--e6);
  align-items: start;
}
.sl-bloco .sl-bloco-titulo {
  font-family: var(--fonte-titulo);
  font-size: var(--t-h3);
  font-weight: var(--peso-titulo);
  line-height: 1.05;
  letter-spacing: var(--tracking-titulo);
  color: var(--tema-titulo);
}
.sl-bloco .sl-bloco-texto {
  margin-top: var(--e3);
  max-width: 44ch;
}
.sl-bloco .sl-bloco-destaque {
  margin-top: var(--e3);
  font-family: var(--fonte-titulo);
  font-size: var(--t-lead);
  font-weight: 400;
  color: var(--marinho);
}
.sl-bloco .link-seta {
  margin-top: var(--e3);
}
.sl-lista {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--e2);
  margin: 0;
  padding: 0;
  list-style: none;
}
.sl-lista li {
  display: grid;
  align-content: start;
  gap: var(--e1);
  padding: var(--e3) var(--e4);
  background: var(--gelo);
}
[data-tema="gelo"] .sl-lista li {
  background: var(--branco);
}
.sl-lista h3 {
  font-family: var(--fonte-titulo);
  font-size: 1.25rem;
  font-weight: 400;
  letter-spacing: -0.015em;
  color: var(--marinho);
}
@media (max-width: 900px) {
  .sl-bloco .sl-bloco-grade,
  .sl-lista {
    grid-template-columns: 1fr;
  }
}
```

`src/site/secoes/solucoes/PerguntasDeSolucoes.tsx`:

```tsx
import './perguntas.css'
import { conteudo } from '@/site/conteudo/conteudo'

/** Soluções · perguntas frequentes, abertas por clique (details/summary: funciona sem JS). */
export function PerguntasDeSolucoes() {
  const { perguntas } = conteudo.solucoesPagina
  return (
    <section
      id="perguntas-solucoes"
      className="cena sl-perguntas"
      data-tema="claro"
      aria-labelledby="sl-perguntas-titulo"
    >
      <div className="container">
        <h2 id="sl-perguntas-titulo" className="sl-perguntas-titulo">
          {perguntas.titulo}
        </h2>
        {perguntas.itens.map((item) => (
          <details key={item.pergunta}>
            <summary>{item.pergunta}</summary>
            <p className="sl-resposta">{item.resposta}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
```

`src/site/secoes/solucoes/perguntas.css`:

```css
/* Soluções · perguntas: blocos gelo de ponta reta; o sinal troca de + para − ao abrir. */
.sl-perguntas .sl-perguntas-titulo {
  margin-bottom: var(--e4);
  font-family: var(--fonte-titulo);
  font-size: var(--t-h2);
  font-weight: var(--peso-titulo);
  line-height: var(--lh-titulo);
  letter-spacing: var(--tracking-titulo);
  color: var(--tema-titulo);
}
.sl-perguntas details {
  background: var(--gelo);
}
.sl-perguntas details + details {
  margin-top: var(--e1);
}
.sl-perguntas summary {
  display: flex;
  justify-content: space-between;
  gap: var(--e3);
  padding: var(--e3) var(--e4);
  cursor: pointer;
  list-style: none;
  font-family: var(--fonte-titulo);
  font-size: 1.25rem;
  font-weight: 400;
  color: var(--marinho);
}
.sl-perguntas summary::-webkit-details-marker {
  display: none;
}
.sl-perguntas summary::after {
  content: "+";
  font-weight: 300;
}
.sl-perguntas details[open] summary::after {
  content: "−";
}
.sl-perguntas summary:focus-visible {
  outline: 2px solid var(--marinho);
  outline-offset: 2px;
}
.sl-perguntas .sl-resposta {
  padding: 0 var(--e4) var(--e3);
  max-width: var(--largura-texto);
}
```

- [ ] **Step 4: Lista de cenas, página, rota, registro e prévia**

`src/site/cenas/paginas/solucoes.tsx`:

```tsx
'use client'

import type { ListaCenas } from '@/site/core/tipos'
import { RunnerDeCenas } from '@/site/runner/RunnerDeCenas'
import { cenaProposta } from '../proposta'

/** /solucoes não tem cena própria (sem protótipo, DP11): só o pedido de proposta anima. */
export const CENAS_SOLUCOES: ListaCenas = [['proposta', cenaProposta]]

export function CenasDasSolucoes() {
  return <RunnerDeCenas pagina="solucoes" cenas={CENAS_SOLUCOES} />
}
```

`src/site/paginas/solucoes.tsx`:

```tsx
import { CenasDasSolucoes } from '@/site/cenas/paginas/solucoes'
import { conteudo } from '@/site/conteudo/conteudo'
import { EsqueletoApp } from '@/site/layout/EsqueletoApp'
import { caminhoNoSite } from '@/site/rotas'
import { JsonLd } from '@/site/secoes/comum/JsonLd'
import { SecaoProposta } from '@/site/secoes/proposta/SecaoProposta'
import { AberturaDeSolucoes } from '@/site/secoes/solucoes/AberturaDeSolucoes'
import { BlocoDeSolucao } from '@/site/secoes/solucoes/BlocoDeSolucao'
import { PerguntasDeSolucoes } from '@/site/secoes/solucoes/PerguntasDeSolucoes'
import { PorqueSemog } from '@/site/secoes/solucoes/PorqueSemog'
import { TiposDeCondominio } from '@/site/secoes/solucoes/TiposDeCondominio'
import { jsonLdInstitucional } from '@/site/seo/institucional'

/** Corpo de /solucoes (a página no ar, reescrita e no visual v2). Fora do menu, como no protótipo. */
export function PaginaSolucoes() {
  const s = conteudo.solucoesPagina
  return (
    <EsqueletoApp pagina="solucoes" temProposta cenas={<CenasDasSolucoes />}>
      <JsonLd dados={jsonLdInstitucional('solucoes')} />
      <AberturaDeSolucoes />
      <TiposDeCondominio />
      <PorqueSemog />
      <BlocoDeSolucao
        bloco={{
          id: 'prestacao',
          tema: 'gelo',
          titulo: s.prestacao.titulo,
          texto: s.prestacao.texto,
          itens: s.prestacao.itens,
          link: { href: caminhoNoSite('/tecnologia'), rotulo: s.prestacao.link },
        }}
      />
      <BlocoDeSolucao
        bloco={{
          id: 'garante',
          tema: 'claro',
          titulo: s.garante.titulo,
          texto: s.garante.texto,
          itens: s.garante.itens,
          destaque: s.garante.custo,
          link: { href: caminhoNoSite('/garante'), rotulo: s.garante.link },
        }}
      />
      <BlocoDeSolucao
        bloco={{
          id: 'aplicativo',
          tema: 'gelo',
          titulo: s.aplicativo.titulo,
          texto: s.aplicativo.texto,
          itens: s.aplicativo.itens,
        }}
      />
      <BlocoDeSolucao
        bloco={{
          id: 'software-de-dono',
          tema: 'claro',
          titulo: s.tecnologia.titulo,
          texto: s.tecnologia.texto,
          itens: s.tecnologia.itens,
          link: { href: caminhoNoSite('/tecnologia'), rotulo: s.tecnologia.link },
        }}
      />
      <BlocoDeSolucao
        bloco={{
          id: 'beneficios',
          tema: 'gelo',
          titulo: s.clube.titulo,
          texto: s.clube.texto,
          itens: [],
        }}
      />
      <PerguntasDeSolucoes />
      <SecaoProposta />
    </EsqueletoApp>
  )
}
```

`src/app/(site)/(app)/previa-v2/solucoes/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PaginaSolucoes } from '@/site/paginas/solucoes'
import { previaLiberada, ROBOTS_DA_PREVIA } from '@/site/previa'
import { metadadosInstitucionais } from '@/site/seo/institucional'

export const metadata: Metadata = { ...metadadosInstitucionais('solucoes'), robots: ROBOTS_DA_PREVIA }

/** /solucoes do site v2 na prévia. 404 em produção. */
export default function Pagina() {
  if (!previaLiberada()) notFound()
  return <PaginaSolucoes />
}
```

`src/site/cenas/registro.ts`: `import { CENAS_SOLUCOES } from './paginas/solucoes'` e `solucoes: CENAS_SOLUCOES`. `src/site/rotas.ts`: `'/solucoes'` em `PAGINAS_NA_PREVIA`.

`src/site/layout/Rodape.tsx`: em `LINKS_SEMOG`, depois de `{ href: '/tecnologia', rotulo: 'Tecnologia' },`, acrescentar `{ href: '/solucoes', rotulo: 'Soluções' },` (decisão do Leandro de 16/10/2026: a `/solucoes` é mantida pelo tráfego do Search Console e precisa de link interno depois da virada; o menu do cabeçalho não muda). O rótulo é o título da página no ar.

- [ ] **Step 5: Rodar e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-pagina-solucoes.int.spec.tsx tests/int/site-v2-rotas.int.spec.ts tests/int/site-v2-identidade.int.spec.ts tests/int/site-v2-redacao.int.spec.ts tests/int/site-v2-layout.int.spec.tsx`
Expected: PASS. Se o `site-v2-layout` contar os links do rodapé, a contagem sobe um, com o comentário da decisão (é a mudança desta tarefa, não regressão), e o arquivo entra no `git add` do Step 7.

- [ ] **Step 6: Olhar no navegador antes de commitar**

`pnpm dev`, `http://localhost:3000/previa-v2/solucoes` em 1440, 1080, 760 e 390: as dez seções sem corte, as perguntas abrindo por clique e por teclado, nenhum padrão editorial (sem caixa-alta, sem numerais decorativos, sem linha fina como divisor); console sem erro.

- [ ] **Step 7: Portões e commit**

Run: os cinco portões. Expected: verdes.

```bash
git branch --show-current && git add src/site/secoes/solucoes src/site/cenas/paginas/solucoes.tsx src/site/paginas/solucoes.tsx "src/app/(site)/(app)/previa-v2/solucoes/page.tsx" src/site/cenas/registro.ts src/site/rotas.ts src/site/layout/Rodape.tsx tests/int/site-v2-pagina-solucoes.int.spec.tsx && git commit -m "feat(site-v2): /solucoes portada para o visual novo, reescrita pelas regras, com link no rodapé

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
```

---

## Tarefa 4.14: Pacote landing e a página de proposta

O pacote `landing` nasce aqui (e não na fase 6), porque proposta, contato e 404 são dele e são desta fase: a regra da spec 3.1 é "cada layout nasce com a primeira página que o usa" (ver "Conflitos"). Sem Lenis, sem runner, rolagem nativa; o JS é o de `landing.js` do protótipo, sem o menu (o cabeçalho já liga o dele) e sem os formulários demonstrativos.

**Files:**
- Create: `src/site/secoes/landing/landing.css` (de `PROTOTIPO\src\scenes\cidade\00-comum.css`, com o `html {` escopado), `src/site/landing/ligar-landing.ts`, `src/site/landing/LigarLanding.tsx`, `src/site/layout/EsqueletoLanding.tsx`
- Create (seções, `src/site/secoes/proposta-pagina/`): `Pedido.tsx` (`PedidoDeProposta`) + `pedido.css` (de `sections\proposta\01-pedido.html`, `scenes\proposta\01-pedido.css`, com `#proposta` escopado), `Depois.tsx` (`DepoisDoPedido`) + `depois.css` (`02-depois`)
- Create: `src/site/paginas/proposta.tsx`, `src/app/(site)/(landing)/previa-v2/proposta/page.tsx`
- Modify: `src/site/rotas.ts`, `tests/int/site-v2-core-ssr.int.spec.ts`
- Test: `tests/int/site-v2-pagina-proposta.int.spec.tsx`

**Interfaces:**
- Consumes: `Cabecalho`, `Rodape`, `SimbolosSvg` (fase 1), `FormularioProposta` (4.3), `caminhoNoSite`, `comIndice`, `JsonLd`, `metadadosInstitucionais`, `jsonLdInstitucional`, `conferirPagina` (4.4).
- Produces: `ligarLanding(reportar: (erro: unknown, origem: string) => void): () => void`; `<LigarLanding />`; `EsqueletoLanding({ pagina, atual?, children })` com `type PaginaLanding = 'proposta' | 'contato' | 'nao-encontrada'`; `PedidoDeProposta()`, `DepoisDoPedido()`; `PaginaProposta()`; `'/proposta'` em `PAGINAS_NA_PREVIA`.

Desvios desta página:
- **Pedido:** o `<form>` demonstrativo não é portado; no lugar, `<FormularioProposta id="pp" classe="pp-form" />` dentro do `.pp-painel` (sem `comEntrada`: a entrada desta página é só de CSS, desde a primeira pintura). `?perfil=construtora` já vale pelo componente.
- **Depois:** `contato.html` → `caminhoNoSite('/contato')`.
- **CSS:** `pedido.css` troca `#proposta` por `#proposta.pp` (a seção Metades também tem `id="proposta"`); `landing.css` troca `html {` por `html.landing-viva {` (o `scroll-behavior: smooth` não pode chegar às páginas com Lenis se o Next juntar CSS de rotas).

- [ ] **Step 1: Escrever o teste da página**

`tests/int/site-v2-pagina-proposta.int.spec.tsx`:

```tsx
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Pagina, { metadata } from '@/app/(site)/(landing)/previa-v2/proposta/page'
import { conteudo } from '@/site/conteudo/conteudo'
import { metadadosInstitucionais } from '@/site/seo/institucional'
import { conferirPagina, type SecaoEsperada } from './helpers/paginas'

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))
vi.mock('@/app/(site)/_actions/proposta-duas-etapas', () => ({
  enviarEtapa1: vi.fn(),
  enviarEtapa2: vi.fn(),
  enviarPropostaCompleta: vi.fn(),
}))
vi.mock('@/components/forms/Turnstile', () => ({ Turnstile: () => null }))

afterEach(() => {
  vi.unstubAllEnvs()
})

const SECOES: SecaoEsperada[] = [
  { id: 'proposta', arquivo: 'proposta/01-pedido', diferencas: { ignorar: ['form', '.fp-moldura'] } },
  { id: 'proposta-depois', arquivo: 'proposta/02-depois' },
]

describe('página de proposta (pacote landing) na prévia', () => {
  it('em produção responde 404, nunca é indexada e o <head> é o de hoje', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false })
    expect(metadata.title).toBe(metadadosInstitucionais('proposta').title)
    vi.stubEnv('VERCEL_ENV', 'production')
    expect(() => Pagina()).toThrow('NEXT_HTTP_ERROR_FALLBACK;404')
  })

  it('reproduz as seções do protótipo, com o pedido de verdade na dobra', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    const container = conferirPagina(<Pagina />, { dataPagina: 'proposta', secoes: SECOES })
    expect(container.querySelector('#proposta.pp form.formulario-proposta.pp-form')).not.toBeNull()
    expect(container.querySelector('.proposta-metades')).toBeNull()
    expect(container.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      `${conteudo.propostaPagina.titulo} ${conteudo.propostaPagina.enfase}`,
    )
    expect(container.querySelector('a[href="#proposta"]') ?? null).not.toBeNull()
  })

  it('o pacote landing não carrega Lenis nem runner de cenas', () => {
    const raiz = path.join(process.cwd(), 'src', 'site')
    for (const arquivo of [
      'layout/EsqueletoLanding.tsx',
      'landing/ligar-landing.ts',
      'landing/LigarLanding.tsx',
      'paginas/proposta.tsx',
    ]) {
      const fonte = readFileSync(path.join(raiz, arquivo), 'utf8')
      expect(fonte, arquivo).not.toMatch(/from 'lenis'|@\/site\/runner|@\/site\/cenas|core\/montagem/)
    }
    const css = readFileSync(path.join(raiz, 'secoes', 'landing', 'landing.css'), 'utf8')
    expect(css).not.toMatch(/^html\s*\{/m)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-pagina-proposta.int.spec.tsx`
Expected: FAIL com "Failed to resolve import '@/app/(site)/(landing)/previa-v2/proposta/page'".

- [ ] **Step 3: CSS do pacote e das seções**

```powershell
$wt = 'C:\Users\lekoc\semogapp\semogsite-site-v2'
$p = "$wt\design-explorations\site-v2-prototipo\src\scenes"
$utf8 = New-Object System.Text.UTF8Encoding $false
New-Item -ItemType Directory -Force "$wt\src\site\secoes\landing", "$wt\src\site\secoes\proposta-pagina" | Out-Null
$comum = [System.IO.File]::ReadAllText("$p\cidade\00-comum.css") -replace '(?m)^html \{', 'html.landing-viva {'
[System.IO.File]::WriteAllText("$wt\src\site\secoes\landing\landing.css", $comum, $utf8)
$pedido = [System.IO.File]::ReadAllText("$p\proposta\01-pedido.css") -replace '#proposta\b', '#proposta.pp'
[System.IO.File]::WriteAllText("$wt\src\site\secoes\proposta-pagina\pedido.css", $pedido, $utf8)
Copy-Item -LiteralPath "$p\proposta\02-depois.css" -Destination "$wt\src\site\secoes\proposta-pagina\depois.css"
```

No `landing.css`, reescrever o comentário de abertura: `/* Pacote landing (proposta, contato e 404 na fase 4; as cidades na fase 6): o que vale para todas as seções. Rolagem nativa, sem Lenis. O scroll suave só vale com o JS da landing vivo (html.landing-viva). */`.

- [ ] **Step 4: O JS da landing**

`src/site/landing/ligar-landing.ts`:

```ts
/**
 * O JS do pacote landing (porta de landing.js do protótipo, sem o menu, que o cabeçalho liga, e
 * sem os formulários demonstrativos): entradas por máscara abaixo da dobra, a linha do cabeçalho
 * depois do primeiro respiro, os links "#proposta" focando o primeiro campo da etapa ativa, e as
 * marcas `js` e `motion`. Cada parte que não liga vai ao Sentry e as outras seguem.
 */
const ROLAGEM_PARA_LINHA = 8

/** Sem IntersectionObserver, nada fica escondido: o CSS só esconde com html.landing-viva. */
function revelarAoEntrar(): () => void {
  const blocos = Array.from(document.querySelectorAll('.revelar'))
  if (blocos.length === 0 || typeof IntersectionObserver === 'undefined') return () => undefined
  const observador = new IntersectionObserver(
    (entradas) => {
      for (const entrada of entradas) {
        if (!entrada.isIntersecting) continue
        entrada.target.classList.add('visivel')
        observador.unobserve(entrada.target)
      }
    },
    { rootMargin: '0px 0px -12% 0px' },
  )
  for (const bloco of blocos) observador.observe(bloco)
  document.documentElement.classList.add('landing-viva')
  return () => {
    observador.disconnect()
    document.documentElement.classList.remove('landing-viva')
  }
}

function linhaDoCabecalho(): () => void {
  const cabecalho = document.querySelector('[data-cabecalho]')
  if (!(cabecalho instanceof HTMLElement)) {
    throw new Error('[landing] Cabeçalho [data-cabecalho] ausente.')
  }
  const atualizar = () =>
    cabecalho.toggleAttribute('data-rolou', window.scrollY > ROLAGEM_PARA_LINHA)
  window.addEventListener('scroll', atualizar, { passive: true })
  atualizar()
  return () => window.removeEventListener('scroll', atualizar)
}

/** Link para #proposta rola até o pedido e foca o primeiro campo da etapa ativa. */
function irAoFormulario(): () => void {
  const alvo = document.getElementById('proposta')
  if (!alvo) return () => undefined
  const aoClicar = (evento: MouseEvent) => {
    const link =
      evento.target instanceof Element ? evento.target.closest('a[href="#proposta"]') : null
    if (!link) return
    evento.preventDefault()
    alvo.scrollIntoView({ behavior: 'smooth', block: 'start' })
    alvo
      .querySelector<HTMLElement>('.fp-etapa:not([inert]) :is(input, select)')
      ?.focus({ preventScroll: true })
  }
  document.addEventListener('click', aoClicar)
  return () => document.removeEventListener('click', aoClicar)
}

const PARTES: ReadonlyArray<readonly [origem: string, ligar: () => () => void]> = [
  ['entradas', revelarAoEntrar],
  ['cabeçalho', linhaDoCabecalho],
  ['atalho do formulário', irAoFormulario],
]

export function ligarLanding(reportar: (erro: unknown, origem: string) => void): () => void {
  const desligar: Array<() => void> = []
  for (const [origem, ligar] of PARTES) {
    try {
      desligar.push(ligar())
    } catch (erro) {
      reportar(erro, `landing:${origem}`)
    }
  }
  // O esqueleto libera os .entrada quando html.motion chega; aqui não há o que esperar.
  document.documentElement.classList.remove('sem-js')
  document.documentElement.classList.add('js', 'motion')
  return () => {
    for (const parte of desligar.reverse()) parte()
  }
}
```

`src/site/landing/LigarLanding.tsx`:

```tsx
'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { ligarLanding } from './ligar-landing'

/** Liga o JS do pacote landing; falha de parte vai ao Sentry e a página segue em HTML. */
export function LigarLanding() {
  useEffect(
    () =>
      ligarLanding((erro, origem) => {
        console.error(`[site v2] ${origem}`, erro)
        Sentry.captureException(erro, { tags: { origem } })
      }),
    [],
  )
  return null
}
```

`src/site/layout/EsqueletoLanding.tsx`:

```tsx
import '@/site/secoes/landing/landing.css'
import type React from 'react'
import { LigarLanding } from '@/site/landing/LigarLanding'
import { Cabecalho, type IdNav } from './Cabecalho'
import { Rodape } from './Rodape'
import { SimbolosSvg } from './SimbolosSvg'

export type PaginaLanding = 'proposta' | 'contato' | 'nao-encontrada'

type PropsEsqueleto = { pagina: PaginaLanding; atual?: IdNav; children: React.ReactNode }

/**
 * Esqueleto do pacote landing (proposta, contato e 404): o cabeçalho completo do site (páginas
 * "leves" do protótipo), o rodapé e o JS da landing, sem Lenis nem runner. O CSS comum vem daqui,
 * e não de um layout do grupo, porque a 404 renderiza fora do grupo (src/app/(site)/not-found.tsx).
 */
export function EsqueletoLanding({ pagina, atual, children }: PropsEsqueleto) {
  const destinoProposta = pagina === 'proposta' ? '#proposta' : '/proposta'
  return (
    <>
      <SimbolosSvg />
      <a className="pular" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Cabecalho atual={atual} destinoProposta={destinoProposta} />
      <main id="conteudo" data-pagina={pagina}>
        {children}
      </main>
      <Rodape destinoProposta={destinoProposta} />
      <LigarLanding />
    </>
  )
}
```

- [ ] **Step 5: Portar as duas seções e montar a página**

Pela receita R, com os desvios acima (`PedidoDeProposta` e `DepoisDoPedido`, cada um importando o próprio CSS). `src/site/paginas/proposta.tsx`:

```tsx
import { EsqueletoLanding } from '@/site/layout/EsqueletoLanding'
import { JsonLd } from '@/site/secoes/comum/JsonLd'
import { DepoisDoPedido } from '@/site/secoes/proposta-pagina/Depois'
import { PedidoDeProposta } from '@/site/secoes/proposta-pagina/Pedido'
import { jsonLdInstitucional } from '@/site/seo/institucional'

/** Corpo da página de proposta (proposta.html do protótipo). A virada 1 o leva a /proposta. */
export function PaginaProposta() {
  return (
    <EsqueletoLanding pagina="proposta">
      <JsonLd dados={jsonLdInstitucional('proposta')} />
      <PedidoDeProposta />
      <DepoisDoPedido />
    </EsqueletoLanding>
  )
}
```

`src/app/(site)/(landing)/previa-v2/proposta/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PaginaProposta } from '@/site/paginas/proposta'
import { previaLiberada, ROBOTS_DA_PREVIA } from '@/site/previa'
import { metadadosInstitucionais } from '@/site/seo/institucional'

export const metadata: Metadata = { ...metadadosInstitucionais('proposta'), robots: ROBOTS_DA_PREVIA }

/** Página de proposta do site v2 na prévia (pacote landing). 404 em produção. */
export default function Pagina() {
  if (!previaLiberada()) notFound()
  return <PaginaProposta />
}
```

`src/site/rotas.ts`: `'/proposta'` em `PAGINAS_NA_PREVIA`. `tests/int/site-v2-core-ssr.int.spec.ts`: `['landing', () => import('@/site/landing/ligar-landing')]` e `['landing: componente', () => import('@/site/landing/LigarLanding')]`.

- [ ] **Step 6: Rodar e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-pagina-proposta.int.spec.tsx tests/int/site-v2-rotas.int.spec.ts tests/int/site-v2-layout.int.spec.tsx tests/int/site-v2-core-ssr.int.spec.ts tests/int/site-v2-identidade.int.spec.ts tests/int/site-v2-pagina-gestao.int.spec.tsx`
Expected: PASS.

- [ ] **Step 7: Olhar no navegador antes de commitar**

`pnpm dev`, `http://localhost:3000/previa-v2/proposta` e `…/previa-v2/proposta?perfil=construtora` em 1440 e 390: o pedido na dobra (a 390, o formulário cabe na primeira tela), o porquê abaixo, os passos depois do pedido entrando ao rolar; "Seja Semog" no cabeçalho foca o primeiro campo; console sem erro.

- [ ] **Step 8: Portões e commit**

Run: os cinco portões. Expected: verdes.

```bash
git branch --show-current && git add src/site/secoes/landing src/site/landing src/site/layout/EsqueletoLanding.tsx src/site/secoes/proposta-pagina src/site/paginas/proposta.tsx "src/app/(site)/(landing)/previa-v2/proposta/page.tsx" src/site/rotas.ts tests/int/site-v2-core-ssr.int.spec.ts tests/int/site-v2-pagina-proposta.int.spec.tsx && git commit -m "feat(site-v2): pacote landing e a página de proposta na prévia

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
```

---

## Tarefa 4.15: "Sou cliente" — painel com a 2ª via e o atendimento, gatilhos no cabeçalho e no rodapé, e a marca de atendimento

Fecha a pendência Final I1 da fase 1 (o `LeadClickTracker` mede todo WhatsApp como lead; o v2 só pode ter WhatsApp marcado como atendimento) antes de existir qualquer link de WhatsApp no v2.

**Files:**
- Create: `src/site/cliente/eventos.ts`, `src/site/cliente/medicao.ts`, `src/site/cliente/GatilhoSouCliente.tsx`, `src/site/cliente/PainelSouCliente.tsx`, `src/site/cliente/sou-cliente.css`
- Modify: `src/lib/triagem.ts`, `src/components/triagem/segunda-via/LinksDeWhatsApp.tsx`
- Modify: `src/site/layout/Cabecalho.tsx`, `src/site/layout/Rodape.tsx`, `src/site/layout/EsqueletoApp.tsx`, `src/site/layout/EsqueletoLeitura.tsx`, `src/site/layout/EsqueletoLanding.tsx`, `src/site/estilos/base.css`, `src/site/core/cabecalho.ts`
- Modify: `tests/int/site-v2-core-ssr.int.spec.ts`
- Test: `tests/int/site-v2-sou-cliente.int.spec.tsx`

**Interfaces:**
- Consumes: `ATRIBUTO_CAMINHO`, `linkWhatsApp`, `MENSAGEM_DO_CLIENTE`, `SECOES_FORA_DO_ADS` (`src/lib/triagem.ts`); `LinkDoCliente` (`LinksDeWhatsApp.tsx`); `Cabecalho` e `type TituloDoPainel` (`src/components/triagem/Cabecalho.tsx`); `SegundaVia` (`src/components/triagem/segunda-via/SegundaVia.tsx`), `encerrarSegundaVia` (`…/respostas.ts`); ícones de `src/components/triagem/icones.tsx`; `conteudo.souCliente` (4.1).
- Produces:
  - `src/site/cliente/eventos.ts`: `EVENTO_SOU_CLIENTE = 'semog:sou-cliente'`; `type OrigemSouCliente = 'cabecalho' | 'menu' | 'rodape' | 'contato'` (os três lugares da resposta do Leandro; o menu é o cabeçalho no celular); `type TelaInicial = 'menu' | 'segunda-via'`; `type PedidoSouCliente = { origem: OrigemSouCliente; tela: TelaInicial; gatilho: HTMLElement | null }`; `pedirSouCliente(pedido: PedidoSouCliente): void`; `lerPedido(evento: Event): PedidoSouCliente | null`.
  - `registrarSouClienteAberto(origem: OrigemSouCliente): void` (GA4 `sou_cliente_aberto`, não é evento-chave).
  - `GatilhoSouCliente({ origem, tela?, className?, children })`.
  - `PainelSouCliente({ segundaViaAtiva }: { segundaViaAtiva: boolean })`, montado uma vez em cada esqueleto.
  - `MENSAGEM_DE_ATENDIMENTO` (`src/lib/triagem.ts`) e `LinkDeAtendimento(props)` (`LinksDeWhatsApp.tsx`).

- [ ] **Step 1: Escrever o teste**

`tests/int/site-v2-sou-cliente.int.spec.tsx`:

```tsx
import { fireEvent, render, screen, within } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const acoes = vi.hoisted(() => ({
  solicitarCodigo: vi.fn(),
  reenviarCodigo: vi.fn(),
  confirmarCodigo: vi.fn(),
  listarCobrancas: vi.fn(),
  abrirBoleto: vi.fn(),
  encerrarConsulta: vi.fn(),
}))
vi.mock('@/app/(frontend)/_actions/segunda-via', () => acoes)
vi.mock('@/components/forms/Turnstile', () => ({ Turnstile: () => null }))
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))
vi.mock('@/providers/ConsentProvider', () => ({
  useConsent: () => ({ consent: { analytics: true }, decided: true }),
}))

import { LeadClickTracker } from '@/components/analytics/LeadClickTracker'
import {
  linkWhatsApp,
  MENSAGEM_DE_ATENDIMENTO,
  MENSAGEM_DO_CLIENTE,
  SECOES_FORA_DO_ADS,
} from '@/lib/triagem'
import { GatilhoSouCliente } from '@/site/cliente/GatilhoSouCliente'
import { PainelSouCliente } from '@/site/cliente/PainelSouCliente'

// O jsdom tem <dialog> mas não showModal/close (o mesmo dublê dos testes da triagem).
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
})

const gtag = vi.fn()
beforeEach(() => {
  vi.clearAllMocks()
  window.gtag = gtag
  acoes.encerrarConsulta.mockResolvedValue(undefined)
})

function dialogo(): HTMLDialogElement {
  const d = document.querySelector('dialog.sou-cliente')
  if (!(d instanceof HTMLDialogElement)) throw new Error('painel ausente')
  return d
}

describe('"Sou cliente" (spec 5, DP6)', () => {
  it('sem JS e antes de hidratar, o gatilho é o WhatsApp de cliente, marcado como atendimento', () => {
    const html = renderToStaticMarkup(
      <GatilhoSouCliente origem="cabecalho">Sou cliente</GatilhoSouCliente>,
    )
    expect(html).toContain('data-wa-caminho="cliente"')
    // Quem não escolheu nada recebe a mensagem de atendimento, não a da 2ª via.
    expect(html).toContain(`href="${linkWhatsApp(MENSAGEM_DE_ATENDIMENTO)}"`)
    const daSegundaVia = renderToStaticMarkup(
      <GatilhoSouCliente origem="contato" tela="segunda-via">
        2ª via
      </GatilhoSouCliente>,
    )
    expect(daSegundaVia).toContain(`href="${linkWhatsApp(MENSAGEM_DO_CLIENTE)}"`)
  })

  it('hidratado, é um botão que abre o painel; o painel não tem proposta e mede a abertura', () => {
    render(
      <>
        <GatilhoSouCliente origem="cabecalho">Sou cliente</GatilhoSouCliente>
        <PainelSouCliente segundaViaAtiva={false} />
      </>,
    )
    const botao = screen.getByRole('button', { name: 'Sou cliente' })
    expect(botao.getAttribute('href')).toBeNull()
    fireEvent.click(botao)
    expect(dialogo().hasAttribute('open')).toBe(true)
    const painel = within(dialogo())
    expect(painel.getByText('Atendimento ao condômino')).toBeTruthy()
    expect(painel.getByText('Área do cliente')).toBeTruthy()
    expect(dialogo().textContent).not.toMatch(/proposta/i)
    expect(gtag).toHaveBeenCalledWith(
      'event',
      'sou_cliente_aberto',
      expect.objectContaining({ origem: 'cabecalho' }),
    )
  })

  it('o WhatsApp do painel é atendimento: triagem_whatsapp_click em triagem_cliente, fora do Ads', () => {
    render(
      <>
        <LeadClickTracker />
        <GatilhoSouCliente origem="rodape">Sou cliente</GatilhoSouCliente>
        <PainelSouCliente segundaViaAtiva={false} />
      </>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Sou cliente' }))
    const link = within(dialogo()).getByRole('link', { name: /Atendimento ao condômino/ })
    expect(link.getAttribute('href')).toBe(linkWhatsApp(MENSAGEM_DE_ATENDIMENTO))
    expect(link.getAttribute('data-wa-caminho')).toBe('cliente')
    fireEvent.click(link)
    expect(gtag).toHaveBeenCalledWith(
      'event',
      'triagem_whatsapp_click',
      expect.objectContaining({ link_section: 'triagem_cliente' }),
    )
    expect(gtag).not.toHaveBeenCalledWith('event', 'whatsapp_click', expect.anything())
    expect(SECOES_FORA_DO_ADS).toContain('triagem_cliente')
    expect(SECOES_FORA_DO_ADS).toContain('triagem_restrita')
  })

  it('com a 2ª via ligada, o atalho direto abre o fluxo de hoje, com a saída para o WhatsApp marcada', async () => {
    render(
      <>
        <GatilhoSouCliente origem="contato" tela="segunda-via">
          2ª via
        </GatilhoSouCliente>
        <PainelSouCliente segundaViaAtiva />
      </>,
    )
    fireEvent.click(screen.getByRole('button', { name: '2ª via' }))
    expect(await screen.findByText(/Informe o CPF cadastrado/)).toBeTruthy()
    const saida = within(dialogo()).getByRole('link', { name: 'Prefiro falar no WhatsApp' })
    expect(saida.getAttribute('data-wa-caminho')).toBe('cliente')
  })

  it('fechar devolve o foco ao gatilho e destrava a página', () => {
    render(
      <>
        <GatilhoSouCliente origem="cabecalho">Sou cliente</GatilhoSouCliente>
        <PainelSouCliente segundaViaAtiva={false} />
      </>,
    )
    const botao = screen.getByRole('button', { name: 'Sou cliente' })
    fireEvent.click(botao)
    expect(document.documentElement.classList.contains('sc-travado')).toBe(true)
    fireEvent.click(within(dialogo()).getByRole('button', { name: 'Fechar' }))
    expect(dialogo().hasAttribute('open')).toBe(false)
    expect(document.documentElement.classList.contains('sc-travado')).toBe(false)
    expect(document.activeElement).toBe(botao)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-sou-cliente.int.spec.tsx`
Expected: FAIL com "Failed to resolve import '@/site/cliente/GatilhoSouCliente'".

- [ ] **Step 3: A mensagem e o link de atendimento (código compartilhado com o site atual, só acréscimo)**

`src/lib/triagem.ts`, depois de `MENSAGEM_COBRANCAS_RESTRITAS`:

```ts
/** "Sou cliente" do site v2: atendimento ao condômino que não é a 2ª via (fase 4). */
export const MENSAGEM_DE_ATENDIMENTO = 'Olá! Sou cliente e preciso de atendimento.'
```

`src/components/triagem/segunda-via/LinksDeWhatsApp.tsx`: acrescentar `MENSAGEM_DE_ATENDIMENTO` ao import de `@/lib/triagem` e, no fim:

```tsx
/** "Sou cliente" do site v2: atendimento ao condômino (caminho `cliente`, fora do Ads). */
export function LinkDeAtendimento(props: Props) {
  return <LinkWhatsApp mensagem={MENSAGEM_DE_ATENDIMENTO} caminho="cliente" {...props} />
}
```

- [ ] **Step 4: Eventos, medição e gatilho**

`src/site/cliente/eventos.ts`:

```ts
/**
 * Os gatilhos do "Sou cliente" (cabeçalho, menu, rodapé e Contato) pedem o painel por um
 * evento de janela; o painel, um por página, ouve. Assim cada gatilho é pequeno e o painel não
 * se repete.
 */
export const EVENTO_SOU_CLIENTE = 'semog:sou-cliente'

/** Só os três lugares da resposta do Leandro (cabeçalho, com o menu do celular, rodapé e Contato). */
export type OrigemSouCliente = 'cabecalho' | 'menu' | 'rodape' | 'contato'
export type TelaInicial = 'menu' | 'segunda-via'
export type PedidoSouCliente = {
  origem: OrigemSouCliente
  tela: TelaInicial
  /** Para onde o foco volta quando o painel fecha. */
  gatilho: HTMLElement | null
}

export function pedirSouCliente(pedido: PedidoSouCliente): void {
  window.dispatchEvent(new CustomEvent<PedidoSouCliente>(EVENTO_SOU_CLIENTE, { detail: pedido }))
}

export function lerPedido(evento: Event): PedidoSouCliente | null {
  if (!(evento instanceof CustomEvent)) return null
  const detalhe: unknown = evento.detail
  if (detalhe === null || typeof detalhe !== 'object') return null
  if (!('origem' in detalhe) || !('tela' in detalhe)) return null
  // `as`: as chaves foram conferidas acima, e o evento só nasce em pedirSouCliente.
  return detalhe as PedidoSouCliente
}
```

`src/site/cliente/medicao.ts`:

```ts
import type { OrigemSouCliente } from './eventos'

/**
 * GA4: o painel "Sou cliente" abriu. Não é evento-chave (atendimento não é lead) e não leva dado
 * pessoal: só de onde abriu e a página. O clique de WhatsApp lá dentro é medido pelo
 * LeadClickTracker como `triagem_whatsapp_click`, pela marca `data-wa-caminho`.
 */
export function registrarSouClienteAberto(origem: OrigemSouCliente): void {
  window.gtag?.('event', 'sou_cliente_aberto', { origem, page_path: window.location.pathname })
}
```

`src/site/cliente/GatilhoSouCliente.tsx`:

```tsx
'use client'

import type React from 'react'
import { useEffect, useState } from 'react'
import {
  ATRIBUTO_CAMINHO,
  linkWhatsApp,
  MENSAGEM_DE_ATENDIMENTO,
  MENSAGEM_DO_CLIENTE,
} from '@/lib/triagem'
import { type OrigemSouCliente, pedirSouCliente, type TelaInicial } from './eventos'

type PropsGatilho = {
  origem: OrigemSouCliente
  /** `segunda-via` abre direto a consulta (quando ligada); o padrão é o menu. */
  tela?: TelaInicial
  className?: string
  children: React.ReactNode
}

/**
 * Gatilho do "Sou cliente" (DP6 do plano da fase 4). No HTML do servidor, e até hidratar, é o link
 * do WhatsApp de cliente com `data-wa-caminho="cliente"`: sem JavaScript a pessoa chega ao
 * atendimento, e o LeadClickTracker mede o clique como atendimento (`triagem_whatsapp_click`),
 * nunca como lead. A mensagem é a de atendimento; só o gatilho que abre direto a 2ª via pede a
 * 2ª via. Hidratado, vira botão que abre o painel (sem href: não há clique de WhatsApp).
 */
export function GatilhoSouCliente({ origem, tela = 'menu', className, children }: PropsGatilho) {
  const [hidratado, setHidratado] = useState(false)
  useEffect(() => setHidratado(true), [])
  if (!hidratado) {
    const mensagem = tela === 'segunda-via' ? MENSAGEM_DO_CLIENTE : MENSAGEM_DE_ATENDIMENTO
    return (
      <a
        className={className}
        href={linkWhatsApp(mensagem)}
        target="_blank"
        rel="noopener"
        {...{ [ATRIBUTO_CAMINHO]: 'cliente' }}
      >
        {children}
      </a>
    )
  }
  return (
    <button
      type="button"
      className={className}
      aria-haspopup="dialog"
      onClick={(evento) => pedirSouCliente({ origem, tela, gatilho: evento.currentTarget })}
    >
      {children}
    </button>
  )
}
```

- [ ] **Step 5: O painel**

`src/site/cliente/PainelSouCliente.tsx`:

```tsx
'use client'

import './sou-cliente.css'
import * as Sentry from '@sentry/nextjs'
import {
  lazy,
  type ReactNode,
  type RefObject,
  Suspense,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import { Cabecalho, type TituloDoPainel } from '@/components/triagem/Cabecalho'
import { IconeBoleto, IconeConversa, IconePredio, IconeSeta } from '@/components/triagem/icones'
import {
  LinkDeAtendimento,
  LinkDoCliente,
} from '@/components/triagem/segunda-via/LinksDeWhatsApp'
import { conteudo } from '@/site/conteudo/conteudo'
import { EVENTO_SOU_CLIENTE, lerPedido, type TelaInicial } from './eventos'
import { registrarSouClienteAberto } from './medicao'

/** A 2ª via só carrega quando alguém a escolhe: o resto do site não leva o código dela. */
const SegundaVia = lazy(() =>
  import('@/components/triagem/segunda-via/SegundaVia').then((modulo) => ({
    default: modulo.SegundaVia,
  })),
)

/** Ao fechar depois da 2ª via, a consulta é encerrada no servidor (como na triagem). */
function encerrarConsulta(): void {
  import('@/components/triagem/segunda-via/respostas')
    .then((modulo) => modulo.encerrarSegundaVia())
    .catch((erro: unknown) =>
      Sentry.captureException(erro, { tags: { origem: 'sou-cliente:encerrar' } }),
    )
}

/** Foca o título quando a 2ª via termina de carregar (o primeiro foco veio antes dela existir). */
function FocarAoMontar({ alvo }: { alvo: RefObject<HTMLElement | null> }) {
  useEffect(() => {
    alvo.current?.focus()
  }, [alvo])
  return null
}

function ConteudoDaOpcao({
  icone,
  titulo,
  texto,
}: {
  icone: ReactNode
  titulo: string
  texto: string
}) {
  return (
    <>
      <span className="tr-opcao-ico" aria-hidden="true">
        {icone}
      </span>
      <span className="tr-opcao-texto">
        <strong>{titulo}</strong>
        <span>{texto}</span>
      </span>
      <IconeSeta />
    </>
  )
}

type PropsMenu = { segundaViaAtiva: boolean; aoEscolherSegundaVia: () => void; aoSair: () => void }

/** As três saídas: 2ª via (no site, ou pelo WhatsApp com ela desligada), atendimento e login. */
function MenuSouCliente({ segundaViaAtiva, aoEscolherSegundaVia, aoSair }: PropsMenu) {
  const t = conteudo.souCliente
  return (
    <>
      <p className="tr-lead">{t.lead}</p>
      <ul className="tr-opcoes">
        <li>
          {segundaViaAtiva ? (
            <button type="button" className="tr-opcao" onClick={aoEscolherSegundaVia}>
              <ConteudoDaOpcao icone={<IconeBoleto />} titulo={t.segundaVia.titulo} texto={t.segundaVia.texto} />
            </button>
          ) : (
            <LinkDoCliente className="tr-opcao" aoSair={aoSair}>
              <ConteudoDaOpcao
                icone={<IconeBoleto />}
                titulo={t.segundaViaPeloWhatsApp.titulo}
                texto={t.segundaViaPeloWhatsApp.texto}
              />
            </LinkDoCliente>
          )}
        </li>
        <li>
          <LinkDeAtendimento className="tr-opcao" aoSair={aoSair}>
            <ConteudoDaOpcao icone={<IconeConversa />} titulo={t.atendimento.titulo} texto={t.atendimento.texto} />
          </LinkDeAtendimento>
        </li>
        <li>
          <a className="tr-opcao" href={conteudo.marca.loginUrl}>
            <ConteudoDaOpcao icone={<IconePredio />} titulo={t.area.titulo} texto={t.area.texto} />
          </a>
        </li>
      </ul>
    </>
  )
}

/**
 * O painel "Sou cliente" (DP6): um `<dialog>` por página, aberto pelos gatilhos. Menu com a 2ª via
 * (o fluxo de hoje, com os três desfechos que terminam no WhatsApp), o atendimento ao condômino e
 * a área do cliente. Nenhum caminho de proposta. `segundaViaAtiva` vem de SEGUNDA_VIA_ATIVA, lida
 * no servidor pelo esqueleto (como no WhatsAppFloat).
 */
export function PainelSouCliente({ segundaViaAtiva }: { segundaViaAtiva: boolean }) {
  const tituloId = useId()
  const tituloRef = useRef<HTMLHeadingElement>(null)
  const dialogoRef = useRef<HTMLDialogElement>(null)
  const gatilhoRef = useRef<HTMLElement | null>(null)
  const usouSegundaVia = useRef(false)
  const [tela, setTela] = useState<TelaInicial>('menu')
  const [aberto, setAberto] = useState(false)

  const fechar = useCallback(() => dialogoRef.current?.close(), [])
  const irParaSegundaVia = useCallback(() => {
    usouSegundaVia.current = true
    setTela('segunda-via')
  }, [])
  const voltarAoMenu = useCallback(() => setTela('menu'), [])

  useEffect(() => {
    function aoPedir(evento: Event) {
      const pedido = lerPedido(evento)
      const dialogo = dialogoRef.current
      if (!pedido || !dialogo || dialogo.open) return
      const direto = pedido.tela === 'segunda-via' && segundaViaAtiva
      gatilhoRef.current = pedido.gatilho
      usouSegundaVia.current = direto
      setTela(direto ? 'segunda-via' : 'menu')
      setAberto(true)
      document.documentElement.classList.add('sc-travado')
      dialogo.showModal()
      registrarSouClienteAberto(pedido.origem)
    }
    window.addEventListener(EVENTO_SOU_CLIENTE, aoPedir)
    return () => window.removeEventListener(EVENTO_SOU_CLIENTE, aoPedir)
  }, [segundaViaAtiva])

  useEffect(() => {
    const dialogo = dialogoRef.current
    if (!dialogo) return
    let comecouNoFundo = false
    const aoPressionar = (evento: PointerEvent) => {
      comecouNoFundo = evento.target === dialogo
    }
    const aoClicar = (evento: MouseEvent) => {
      if (evento.target === dialogo && comecouNoFundo) dialogo.close()
      comecouNoFundo = false
    }
    const aoFechar = () => {
      if (usouSegundaVia.current) {
        usouSegundaVia.current = false
        encerrarConsulta()
      }
      document.documentElement.classList.remove('sc-travado')
      setAberto(false)
      setTela('menu')
      gatilhoRef.current?.focus()
      gatilhoRef.current = null
    }
    dialogo.addEventListener('pointerdown', aoPressionar)
    dialogo.addEventListener('click', aoClicar)
    dialogo.addEventListener('close', aoFechar)
    return () => {
      dialogo.removeEventListener('pointerdown', aoPressionar)
      dialogo.removeEventListener('click', aoClicar)
      dialogo.removeEventListener('close', aoFechar)
      document.documentElement.classList.remove('sc-travado')
    }
  }, [])

  // Foco no título ao abrir e a cada troca de tela, para o leitor de tela anunciar onde está.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `tela` é gatilho de re-execução
  useEffect(() => {
    if (aberto) tituloRef.current?.focus()
  }, [aberto, tela])

  const titulo: TituloDoPainel = { id: tituloId, ref: tituloRef }
  return (
    <dialog
      ref={dialogoRef}
      className="sou-cliente"
      aria-labelledby={tituloId}
      data-lenis-prevent=""
      data-clarity-mask="true"
    >
      <div className="tr-painel">
        {aberto && tela === 'segunda-via' ? (
          // TEXTO-NOVO: aviso enquanto a 2ª via carrega
          <Suspense fallback={<p className="tr-corpo tr-carregando">Carregando…</p>}>
            <SegundaVia titulo={titulo} aoFechar={fechar} aoVoltarAoMenu={voltarAoMenu} />
            <FocarAoMontar alvo={tituloRef} />
          </Suspense>
        ) : (
          <>
            <Cabecalho texto={conteudo.souCliente.titulo} titulo={titulo} aoFechar={fechar} />
            <div className="tr-corpo">
              <MenuSouCliente
                segundaViaAtiva={segundaViaAtiva}
                aoEscolherSegundaVia={irParaSegundaVia}
                aoSair={fechar}
              />
            </div>
          </>
        )}
      </div>
    </dialog>
  )
}
```

`src/site/cliente/sou-cliente.css`:

```css
/* "Sou cliente" (DP6 do plano da fase 4): o painel de atendimento a quem já é cliente, no visual
   do site v2. As telas da 2ª via são as da triagem (src/components/triagem), com as classes tr-*;
   aqui elas ganham tokens, Saira e Barlow e ponta reta. Painel à direita no computador, folha que
   sobe do rodapé no celular. Com ele aberto, a página atrás não rola (o Lenis respeita o
   data-lenis-prevent do diálogo). */
html.sc-travado {
  overflow: hidden;
}
.sou-cliente {
  position: fixed;
  inset: 0 0 0 auto;
  width: min(420px, 100%);
  max-width: none;
  height: 100dvh;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: var(--branco);
  color: var(--texto);
  font-family: var(--fonte-corpo);
}
/* Literal: o ::backdrop não herda variável CSS em todos os navegadores. É o --marinho-noite a 55%. */
.sou-cliente::backdrop {
  background: rgb(8 2 52 / 0.55);
}
.sou-cliente .tr-painel {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.sou-cliente .tr-topo {
  flex: none;
  background: var(--marinho);
  color: var(--branco);
}
.sou-cliente .tr-alca {
  display: none;
}
.sou-cliente .tr-cabecalho {
  display: flex;
  align-items: center;
  gap: var(--e1);
  min-height: var(--cab);
  padding: var(--e2) var(--e2) var(--e2) var(--e4);
}
.sou-cliente .tr-cabecalho h2 {
  flex: 1;
  font-family: var(--fonte-titulo);
  font-size: 1.375rem;
  font-weight: 400;
  letter-spacing: -0.015em;
  color: var(--branco);
}
.sou-cliente .tr-cabecalho h2:focus {
  outline: none;
}
.sou-cliente .tr-cabecalho h2:focus-visible {
  outline: 2px solid var(--ceu);
  outline-offset: 4px;
}
.sou-cliente .tr-icone-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 0;
  background: transparent;
  color: var(--texto-suave-sobre-marinho);
  cursor: pointer;
}
.sou-cliente .tr-icone-btn:hover {
  background: var(--marinho-retidao);
  color: var(--branco);
}
.sou-cliente .tr-icone-btn svg,
.sou-cliente .tr-opcao svg {
  width: 22px;
  height: 22px;
}
.sou-cliente .tr-etapa {
  display: grid;
  gap: var(--e1);
  padding: 0 var(--e4) var(--e3);
  font-size: var(--t-pequeno);
  color: var(--texto-suave-sobre-marinho);
}
.sou-cliente .tr-etapa-barra {
  display: block;
  height: 3px;
  background: color-mix(in oklab, var(--branco) 20%, transparent);
}
.sou-cliente .tr-etapa-barra > span {
  display: block;
  height: 100%;
  background: var(--ceu);
}
.sou-cliente .tr-corpo {
  flex: 1 1 auto;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: var(--e4);
}
.sou-cliente :is(.tr-lead, .tr-dica, .tr-alternativa, .tr-carregando) {
  line-height: 1.5;
  color: var(--texto-suave);
}
.sou-cliente .tr-lead {
  margin-bottom: var(--e3);
}
.sou-cliente .tr-opcoes {
  display: grid;
  gap: var(--e1);
  margin: 0;
  padding: 0;
  list-style: none;
}
.sou-cliente .tr-opcao {
  display: flex;
  align-items: center;
  gap: var(--e2);
  width: 100%;
  min-height: 72px;
  padding: var(--e2) var(--e3);
  border: 0;
  background: var(--gelo);
  color: var(--texto);
  font: inherit;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 320ms var(--ease-expo);
}
.sou-cliente .tr-opcao:hover {
  background: var(--ceu-claro);
}
.sou-cliente .tr-opcao-ico {
  flex: none;
  display: inline-flex;
  color: var(--marinho);
}
.sou-cliente .tr-opcao-texto {
  flex: 1;
  display: grid;
  gap: 2px;
}
.sou-cliente .tr-opcao-texto strong {
  font-weight: 600;
  color: var(--marinho);
}
.sou-cliente .tr-opcao-texto span {
  font-size: var(--t-pequeno);
  color: var(--texto-suave);
}
.sou-cliente :is(.tr-primario, .tr-secundario) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--e1);
  width: 100%;
  min-height: 52px;
  padding: 0 var(--e4);
  border: 0;
  font: inherit;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
}
.sou-cliente .tr-primario {
  background: var(--marinho);
  color: var(--branco);
}
.sou-cliente .tr-primario:hover {
  background: color-mix(in oklab, var(--marinho) 88%, var(--azul-forte));
}
.sou-cliente .tr-secundario {
  background: var(--gelo);
  color: var(--marinho);
}
.sou-cliente :is(.tr-primario, .tr-secundario):disabled {
  cursor: progress;
  opacity: 0.72;
}
.sou-cliente .tr-acoes {
  display: grid;
  gap: var(--e1);
  margin-top: var(--e3);
}
.sou-cliente :is(.tr-link, .tr-alternativa a, .tr-dica a, .tr-erro a) {
  color: var(--marinho);
  font-weight: 500;
  text-decoration: underline;
  text-underline-offset: 4px;
}
.sou-cliente .tr-girando {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  animation: sc-girar 0.8s linear infinite;
}
@keyframes sc-girar {
  to {
    transform: rotate(360deg);
  }
}
.sou-cliente :is(.tr-erro, .tr-aviso-restrita, .tr-vazio, .tr-nota-vencido, .tr-nota-baixa, .tr-indisponivel) {
  margin-top: var(--e2);
  padding: var(--e2) var(--e3);
  border-left: 5px solid var(--marinho);
  background: var(--gelo);
}
.sou-cliente .tr-aviso-restrita {
  display: flex;
  gap: var(--e2);
}
.sou-cliente label {
  display: block;
  margin-bottom: var(--e1);
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--marinho);
}
.sou-cliente input:not([type="radio"]):not([type="checkbox"]) {
  width: 100%;
  min-height: 48px;
  padding: 0 var(--e2);
  border: 0;
  border-bottom: 1.5px solid var(--marinho);
  background: var(--gelo);
  color: var(--texto);
  font: inherit;
}
.sou-cliente .campo-erro {
  margin-top: var(--e1);
  font-size: var(--t-pequeno);
  font-weight: 500;
  color: var(--marinho);
}
.sou-cliente fieldset {
  display: grid;
  gap: var(--e3);
  margin: 0;
  padding: 0;
  border: 0;
}
.sou-cliente :is(.tr-boleto-valor, .tr-situacao) {
  font-family: var(--fonte-titulo);
  font-variant-numeric: tabular-nums;
}
.sou-cliente :is(a, button, input):focus-visible {
  outline: 2px solid var(--marinho);
  outline-offset: 2px;
}
.sou-cliente .tr-topo :is(a, button):focus-visible {
  outline-color: var(--ceu);
}
/* Os ícones da triagem desenham com ponta redonda; no site v2 a ponta é reta. */
.sou-cliente svg :is(path, line, polyline, circle, rect) {
  stroke-linecap: butt;
  stroke-linejoin: miter;
}
@media (max-width: 760px) {
  .sou-cliente {
    inset: auto 0 0 0;
    width: 100%;
    height: auto;
    max-height: 88dvh;
  }
  .sou-cliente .tr-painel {
    height: auto;
    max-height: 88dvh;
  }
}
```

- [ ] **Step 6: Gatilhos no cabeçalho e no rodapé, painel nos esqueletos**

`src/site/layout/Cabecalho.tsx`: importar `GatilhoSouCliente` de `@/site/cliente/GatilhoSouCliente`; na `.cab-acoes`, entre o `<span className="cab-separador" …/>` e o link de Login, `<GatilhoSouCliente origem="cabecalho" className="cab-cliente">{conteudo.souCliente.botao}</GatilhoSouCliente>`; no `painel-menu`, antes do `painel-login`, `<GatilhoSouCliente origem="menu" className="painel-cliente">{conteudo.souCliente.botao}</GatilhoSouCliente>`.

`src/site/layout/Rodape.tsx`: importar o gatilho e, na lista "Fale com a gente", depois de "Telefones e endereços", `<li><GatilhoSouCliente origem="rodape" className="rodape-cliente">{/* TEXTO-NOVO */}Sou cliente: 2ª via e atendimento</GatilhoSouCliente></li>`.

`src/site/layout/EsqueletoApp.tsx`, `EsqueletoLeitura.tsx` e `EsqueletoLanding.tsx`: importar `PainelSouCliente` de `@/site/cliente/PainelSouCliente` e, logo depois do `<Rodape … />`, `<PainelSouCliente segundaViaAtiva={process.env.SEGUNDA_VIA_ATIVA === 'true'} />`. (A flag é lida no servidor, no build das páginas estáticas, como no `WhatsAppFloat`; só o booleano desce ao navegador.)

`src/site/estilos/base.css`:
- depois da regra `.nav a:hover, .cab-login:hover { … }`, acrescentar:

```css
/* "Sou cliente" no cabeçalho, no menu e no rodapé (fase 4): link antes de hidratar, botão depois;
   o mesmo desenho do Login e dos links do rodapé. */
.cab-cliente,
.painel-cliente,
.rodape-cliente {
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}
.cab-cliente {
  padding-block: var(--e1);
  white-space: nowrap;
}
.cab-cliente:hover,
.rodape-cliente:hover {
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 6px;
}
```

- no `@media (max-width: 1080px)`, a primeira regra passa a `.nav, .cab-separador, .cab-login, .cab-cliente { display: none; }` e, depois de `.painel-menu .painel-login { … }`, acrescentar `.painel-menu .painel-cliente { margin-top: var(--e3); padding-block: var(--e1); font-family: var(--fonte-corpo); font-size: 1rem; font-weight: 500; letter-spacing: 0; }` (e a `.painel-login` perde o `margin-top`, que passa ao primeiro dos dois).

`src/site/core/cabecalho.ts`: em `aoClicarPainel`, `closest('a')` → `closest('a, button')` (escolher "Sou cliente" no menu fecha o menu antes de abrir o painel).

`tests/int/site-v2-core-ssr.int.spec.ts`: `['sou cliente: eventos', () => import('@/site/cliente/eventos')]`, `['sou cliente: painel', () => import('@/site/cliente/PainelSouCliente')]`, `['sou cliente: gatilho', () => import('@/site/cliente/GatilhoSouCliente')]`.

- [ ] **Step 7: Rodar e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-sou-cliente.int.spec.tsx tests/int/triagem-whatsapp.int.spec.tsx tests/int/segunda-via-telas.int.spec.tsx tests/int/site-v2-layout.int.spec.tsx tests/int/site-v2-pagina-home.int.spec.tsx tests/int/site-v2-pagina-garante.int.spec.tsx tests/int/site-v2-pagina-proposta.int.spec.tsx tests/int/site-v2-leitura-paginas.int.spec.tsx tests/int/site-v2-identidade.int.spec.ts tests/int/site-v2-core-ssr.int.spec.ts`
Expected: PASS. Os testes da triagem antiga continuam verdes (só houve acréscimo no código compartilhado). As páginas passam pela `conferirPagina`, que agora vê o `wa.me` do painel e exige `data-wa-caminho`.

- [ ] **Step 8: Medir o cabeçalho no navegador**

Script descartável no scratchpad (não na WT), com Playwright em Chromium e Firefox, contra `pnpm dev`, em `/previa-v2` com larguras 1081, 1160, 1240 e 1440 (altura 900): para cada largura, `const faixa = document.querySelector('.cabecalho-faixa').getBoundingClientRect()`, e para cada filho visível de `.nav` e de `.cab-acoes`, `rect.right <= faixa.right + 1` e nenhum par de vizinhos com `a.right > b.left + 1`; e `document.documentElement.scrollWidth <= innerWidth`. Expected: tudo numa linha, sem sobreposição. Se não couber entre 1081 e 1240, reduzir o vão da `.nav` nesse intervalo (`gap: var(--e2)` a partir de 1240) e medir de novo; registrar no commit. Em 390, o "Sou cliente" aparece no menu aberto, acima do Login.

- [ ] **Step 9: Portões e commit**

Run: os cinco portões. Expected: verdes.

```bash
git branch --show-current && git add src/site/cliente src/lib/triagem.ts src/components/triagem/segunda-via/LinksDeWhatsApp.tsx src/site/layout/Cabecalho.tsx src/site/layout/Rodape.tsx src/site/layout/EsqueletoApp.tsx src/site/layout/EsqueletoLeitura.tsx src/site/layout/EsqueletoLanding.tsx src/site/estilos/base.css src/site/core/cabecalho.ts tests/int/site-v2-core-ssr.int.spec.ts tests/int/site-v2-sou-cliente.int.spec.tsx && git commit -m "feat(site-v2): Sou cliente com a 2ª via e o atendimento, sem WhatsApp contado como lead

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
```

---

## Tarefa 4.16: Contato — atalho direto da 2ª via, Unidades e o formulário de verdade, tudo para `ola@`

**Files:**
- Create (seções, `src/site/secoes/contato/`): `Abertura.tsx` (`AberturaDoContato`) + `abertura.css` (de `sections\contato\01-abertura.html`, `scenes\contato\01-abertura.css`), `Unidades.tsx` (`UnidadesDoContato`) + `unidades.css` (`02-unidades`), `Mensagem.tsx` (`MensagemDoContato`) + `mensagem.css` (`03-mensagem`)
- Create: `src/site/formularios/mensagem/FormularioDeMensagem.tsx`
- Create: `src/site/paginas/contato.tsx`, `src/app/(site)/(landing)/previa-v2/contato/page.tsx`
- Modify: `src/site/conteudo/conteudo.ts`, `src/lib/form-schemas.ts`, `src/lib/leads/destinatarios.ts`, `src/app/(frontend)/_actions/submit-form.ts`, `.env.example`, `docs/DEPLOY.md`, `src/site/rotas.ts`, `playwright.config.ts`
- Modify (testes do formulário que está em produção, que afirmam o destino antigo): `tests/int/submit-form.int.spec.ts`
- Test: `tests/int/site-v2-pagina-contato.int.spec.tsx`

**Interfaces:**
- Consumes: `EsqueletoLanding` (4.14), `GatilhoSouCliente` (4.15), `submitForm` (`src/app/(frontend)/_actions/submit-form.ts`), `contatoSchema`, `Turnstile`, `TelefonesDasUnidades` (`FalhaDoEnvio.tsx`, fase 2), `conteudo.cidades`, `conteudo.landing.unidade`, `conteudo.unidades`.
- Produces: `AberturaDoContato()`, `UnidadesDoContato()`, `MensagemDoContato()`; `FormularioDeMensagem()`; `PaginaContato()`; `CONTATO_TO = 'ola@semog.com.br'` e `destinatariosDoContato(): readonly string[]` (`src/lib/leads/destinatarios.ts`); `conteudo.contatoPagina.mensagem.assuntos: ReadonlyArray<{ valor: string; rotulo: string }>`; os valores novos do enum do contato: `'condomino-duvida' | 'fornecedor' | 'imprensa' | 'trabalhe-conosco'`; `'/contato'` em `PAGINAS_NA_PREVIA`.

Desvios desta página:
- **Abertura, atalho:** o atalho pendente (`div.ct-atalho--pendente` com o selo) vira `<GatilhoSouCliente origem="contato" tela="segunda-via" className="ct-atalho">` com o mesmo conteúdo (`strong`, `span`, seta) e o texto de `contatoPagina.atalhos.segundaVia` ("2ª via de boleto"). Resposta do Leandro: o atalho do Contato abre direto o fluxo da 2ª via (CPF, código no e-mail, boletos); com a 2ª via desligada no ambiente, o painel abre no menu, que a oferece pelo WhatsApp. Os outros atalhos: proposta → `caminhoNoSite('/proposta')`, login → `conteudo.marca.loginUrl`, mensagem → `#contato-mensagem`. No `abertura.css`, depois de `#contato-abertura a.ct-atalho:hover`, acrescentar `#contato-abertura button.ct-atalho { width: 100%; border: 0; font: inherit; text-align: left; cursor: pointer; }` e `#contato-abertura button.ct-atalho:hover { background: color-mix(in oklab, var(--gelo) 70%, var(--ceu-claro)); }` (o atalho é link antes de hidratar e botão depois).
- **Unidades:** as quatro Unidades por `.map` sobre `conteudo.unidades` com `conteudo.cidades[unidade.id]`; o telefone segue como texto, sem link de discagem (decisão do Leandro registrada no protótipo).
- **Mensagem:** o `<form data-demo>` vira `<FormularioDeMensagem />`, com a mesma marcação de campo (`fp-*`); nenhum e-mail na página.

- [ ] **Step 1: Escrever o teste**

`tests/int/site-v2-pagina-contato.int.spec.tsx`:

```tsx
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const envio = vi.hoisted(() => ({ submitForm: vi.fn() }))
vi.mock('@/app/(frontend)/_actions/submit-form', () => envio)
vi.mock('@/app/(frontend)/_actions/segunda-via', () => ({
  solicitarCodigo: vi.fn(),
  reenviarCodigo: vi.fn(),
  confirmarCodigo: vi.fn(),
  listarCobrancas: vi.fn(),
  abrirBoleto: vi.fn(),
  encerrarConsulta: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/providers/ConsentProvider', () => ({
  useConsent: () => ({ consent: { analytics: true }, decided: true }),
}))
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))

// O jsdom tem <dialog> mas não showModal/close (o mesmo dublê do site-v2-sou-cliente).
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
})
vi.mock('@/components/forms/Turnstile', () => ({
  Turnstile: ({ onToken }: { onToken: (token: string) => void }) => (
    <button type="button" onClick={() => onToken('token-de-teste')}>
      turnstile
    </button>
  ),
}))

import Pagina, { metadata } from '@/app/(site)/(landing)/previa-v2/contato/page'
import { contatoSchema } from '@/lib/form-schemas'
import { CONTATO_TO, destinatariosDoContato } from '@/lib/leads/destinatarios'
import { conteudo } from '@/site/conteudo/conteudo'
import { metadadosInstitucionais } from '@/site/seo/institucional'
import { conferirPagina, type SecaoEsperada } from './helpers/paginas'

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('VERCEL_ENV', 'preview')
})
afterEach(() => {
  vi.unstubAllEnvs()
})

const SECOES: SecaoEsperada[] = [
  {
    id: 'contato-abertura',
    arquivo: 'contato/01-abertura',
    diferencas: { semClasses: ['ct-atalho--pendente', 'a-confirmar'] },
  },
  { id: 'contato-unidades', arquivo: 'contato/02-unidades' },
  {
    id: 'contato-mensagem',
    arquivo: 'contato/03-mensagem',
    diferencas: { ignorar: ['form', '.fp-sem-js', '.fp-sucesso'] },
  },
]

function preencher(container: HTMLElement) {
  const campo = (nome: string) => {
    const el = container.querySelector(`#contato-mensagem [name="${nome}"]`)
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) {
      throw new Error(`campo ${nome} ausente`)
    }
    return el
  }
  fireEvent.change(campo('nome'), { target: { value: 'Maria' } })
  fireEvent.change(campo('email'), { target: { value: 'maria@exemplo.com.br' } })
  fireEvent.change(campo('assunto'), { target: { value: 'imprensa' } })
  fireEvent.change(campo('mensagem'), { target: { value: 'Gostaria de uma entrevista.' } })
  fireEvent.click(screen.getByRole('button', { name: 'turnstile' }))
}

describe('Contato (pacote landing) na prévia', () => {
  it('em produção responde 404, nunca é indexada e o <head> é o de hoje', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false })
    expect(metadata.title).toBe(metadadosInstitucionais('contato').title)
    vi.stubEnv('VERCEL_ENV', 'production')
    expect(() => Pagina()).toThrow('NEXT_HTTP_ERROR_FALLBACK;404')
  })

  it('reproduz as seções do protótipo; nenhum e-mail na página; o atalho abre direto a 2ª via', () => {
    const container = conferirPagina(<Pagina />, { dataPagina: 'contato', secoes: SECOES })
    expect(container.textContent).not.toMatch(/@semog\.com\.br/)
    const atalho = container.querySelector('#contato-abertura .ct-atalho[aria-haspopup="dialog"]')
    expect(atalho?.textContent).toContain(conteudo.contatoPagina.atalhos.segundaVia.titulo)
    expect(container.querySelectorAll('#contato-unidades .cn-unidade')).toHaveLength(4)
  })

  it('com a 2ª via ligada, o atalho do Contato pula o menu e abre a consulta pelo CPF', async () => {
    // O esqueleto lê SEGUNDA_VIA_ATIVA no servidor e passa o booleano ao painel (4.15).
    vi.stubEnv('SEGUNDA_VIA_ATIVA', 'true')
    const container = conferirPagina(<Pagina />, { dataPagina: 'contato', secoes: SECOES })
    const atalho = container.querySelector('#contato-abertura .ct-atalho[aria-haspopup="dialog"]')
    if (!(atalho instanceof HTMLElement)) throw new Error('atalho do Contato ausente')
    fireEvent.click(atalho)
    expect(await screen.findByText(/Informe o CPF cadastrado/)).toBeTruthy()
  })

  it('os cinco assuntos do protótipo, todos aceitos pelo servidor; nenhum é proposta', () => {
    const container = conferirPagina(<Pagina />, { dataPagina: 'contato', secoes: SECOES })
    const opcoes = Array.from(
      container.querySelectorAll<HTMLOptionElement>('#contato-mensagem select[name="assunto"] option'),
    )
      .map((o) => o.value)
      .filter(Boolean)
    expect(opcoes).toEqual(conteudo.contatoPagina.mensagem.assuntos.map((a) => a.valor))
    expect(opcoes).not.toContain('proposta-comercial')
    for (const assunto of opcoes) {
      const lido = contatoSchema.safeParse({ nome: 'a', email: 'a@b.com.br', assunto, mensagem: 'x' })
      expect(lido.success, assunto).toBe(true)
    }
    expect(contatoSchema.safeParse({ nome: 'a', email: 'a@b.com.br', assunto: 'xyz', mensagem: 'x' }).success).toBe(false)
  })

  it('todos os assuntos vão para ola@semog.com.br (onde o Chatwoot distribui)', () => {
    expect(CONTATO_TO).toBe('ola@semog.com.br')
    expect(destinatariosDoContato()).toEqual(['ola@semog.com.br'])
    const acao = readFileSync(
      path.join(process.cwd(), 'src', 'app', '(frontend)', '_actions', 'submit-form.ts'),
      'utf8',
    )
    expect(acao).toContain('destinatariosDoContato()')
    expect(acao).not.toContain('process.env.CONTACT_TO')
  })

  it('envia ao submitForm("contato") e mostra o recebido', async () => {
    envio.submitForm.mockResolvedValue({ ok: true, message: 'Recebemos sua mensagem!' })
    const container = conferirPagina(<Pagina />, { dataPagina: 'contato', secoes: SECOES })
    preencher(container)
    fireEvent.submit(container.querySelector('#contato-mensagem form') as HTMLFormElement)
    await waitFor(() => expect(screen.getByText('Recebemos sua mensagem.')).toBeTruthy())
    expect(envio.submitForm).toHaveBeenCalledWith(
      'contato',
      {
        nome: 'Maria',
        email: 'maria@exemplo.com.br',
        assunto: 'imprensa',
        mensagem: 'Gostaria de uma entrevista.',
      },
      'token-de-teste',
    )
  })

  it('erro de campo do servidor volta para o campo; falha de envio mostra os telefones e vai ao Sentry', async () => {
    const Sentry = await import('@sentry/nextjs')
    envio.submitForm.mockResolvedValueOnce({ ok: false, errors: { email: 'Informe um e-mail válido.' } })
    const container = conferirPagina(<Pagina />, { dataPagina: 'contato', secoes: SECOES })
    preencher(container)
    fireEvent.submit(container.querySelector('#contato-mensagem form') as HTMLFormElement)
    await waitFor(() => expect(screen.getByText('Informe um e-mail válido.')).toBeTruthy())

    envio.submitForm.mockRejectedValueOnce(new Error('action antiga'))
    fireEvent.click(screen.getByRole('button', { name: 'turnstile' }))
    fireEvent.submit(container.querySelector('#contato-mensagem form') as HTMLFormElement)
    await waitFor(() => expect(screen.getByText('Não conseguimos enviar agora.')).toBeTruthy())
    expect(container.querySelector('#contato-mensagem .fp-telefones')?.textContent).toContain('(81) 3316-0265')
    expect(Sentry.captureException).toHaveBeenCalled()
  })

  it('sem a verificação, não envia e pede para confirmar', async () => {
    const container = conferirPagina(<Pagina />, { dataPagina: 'contato', secoes: SECOES })
    fireEvent.submit(container.querySelector('#contato-mensagem form') as HTMLFormElement)
    await waitFor(() =>
      expect(screen.getByText('Confirme a verificação de segurança e envie de novo.')).toBeTruthy(),
    )
    expect(envio.submitForm).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-pagina-contato.int.spec.tsx`
Expected: FAIL com "Failed to resolve import '@/app/(site)/(landing)/previa-v2/contato/page'".

- [ ] **Step 3: Assuntos, destino e conteúdo**

`src/lib/form-schemas.ts`, `ASSUNTO_OPTIONS`, acrescentar antes de `'outro'`:

```ts
  // Assuntos do Contato do site v2 (fase 4, resposta do Leandro de 16/10/2026). Os de cima ficam
  // até a fase 7: o formulário antigo e abas abertas antes da virada ainda os enviam.
  'condomino-duvida',
  'fornecedor',
  'imprensa',
  'trabalhe-conosco',
```

`src/lib/leads/destinatarios.ts`, no fim:

```ts
/**
 * Contato do site, todos os assuntos: a caixa ola@, onde o Chatwoot distribui (Leandro,
 * 16/10/2026). Substitui a variável CONTACT_TO, que deixa de ser lida.
 */
export const CONTATO_TO = 'ola@semog.com.br'

export function destinatariosDoContato(): readonly string[] {
  return [CONTATO_TO]
}
```

`src/app/(frontend)/_actions/submit-form.ts`: no import de `@/lib/leads/destinatarios`, acrescentar `destinatariosDoContato`; em `destinatariosDaNotificacao`, a última linha `return process.env.CONTACT_TO ? [process.env.CONTACT_TO] : undefined` passa a `return destinatariosDoContato()`; o tipo de retorno da função passa de `readonly string[] | undefined` a `readonly string[]` (o `notifyTo?.join(', ') ?? null` do INSERT continua compilando e passa a gravar sempre o endereço); o comentário da função troca "`undefined` só acontece no Contato sem `CONTACT_TO` configurado (comum em dev), e aí nenhuma notificação sai — comportamento original." por "O Contato vai sempre para `CONTATO_TO` (ola@, fase 4 do site v2). Em dev e Preview nada sai mesmo assim: `ambienteLiberaEnvio` barra o e-mail e o CRM fora de produção." Os outros três comentários do arquivo que citam `CONTACT_TO` também mudam, para não descrever variável que não existe mais: no de `PROPOSTA_CIDADE_TO`, "Contato continua indo pro `CONTACT_TO`" → "Contato vai para `CONTATO_TO` (ola@)"; no de `EXPERIENCE_TO`, "`CONTACT_TO` ausente faz a notificação simplesmente não sair" → "variável ausente faria a notificação simplesmente não sair (era o caso do `CONTACT_TO`, que o Contato deixou de ler)"; no de `enviarEmails`, "(ou ausência de `CONTACT_TO`/`SENDGRID_API_KEY`)" → "(ou ausência de `SENDGRID_API_KEY`)". Rodar `pnpm run check:server-actions` logo depois: o arquivo é `'use server'` e só exporta função async.

`tests/int/submit-form.int.spec.ts` (o formulário de contato **em produção** usa a mesma action; os três testes abaixo afirmam o destino antigo e ficam vermelhos com a troca, então mudam aqui, com a decisão do Leandro de mandar tudo para ola@):

1. Acrescentar `import { CONTATO_TO } from '@/lib/leads/destinatarios'` junto dos imports do arquivo.
2. No `describe('submitForm — destino da notificação interna')`, o teste `'contato continua indo pro CONTACT_TO'` passa a:

```ts
  it('contato vai para ola@ (CONTATO_TO), mesmo com CONTACT_TO no ambiente', async () => {
    // Desde a fase 4 do site v2 (Leandro, 16/10/2026) o Contato não lê mais CONTACT_TO: a
    // variável no ambiente (posta no beforeEach) não pode desviar a mensagem.
    headersMock.mockResolvedValue(fakeHeaders('203.0.113.31'))

    await submitForm('contato', contatoValido, 'test-token')

    expect(CONTATO_TO).toBe('ola@semog.com.br')
    expect(destinoDaNotificacao()).toEqual(['ola@semog.com.br'])
  })
```

3. No `describe('submitForm — grava a quem o lead foi endereçado')`, o teste `'contato grava o CONTACT_TO'` passa a:

```ts
  it('contato grava ola@ (CONTATO_TO)', async () => {
    await submitForm('contato', contatoValido, 'test-token')

    expect(notificadoPara()).toBe('ola@semog.com.br')
  })
```

4. No mesmo `describe`, o teste `'sem CONTACT_TO grava NULL, e não string vazia'` sai, e no lugar entra:

```ts
  // O teste "sem CONTACT_TO grava NULL" saiu na fase 4 do site v2: o Contato tem destino fixo
  // (ola@), então não existe mais Contato sem destino, e o NULL ("não avisamos ninguém") deixou
  // de acontecer no Contato. O que sobra provar é que a falta da variável não esvazia a coluna.
  it('sem CONTACT_TO no ambiente o Contato grava ola@ mesmo assim, nunca string vazia', async () => {
    delete process.env.CONTACT_TO

    await submitForm('contato', contatoValido, 'test-token')

    expect(notificadoPara()).toBe('ola@semog.com.br')
  })
```

5. As três linhas `process.env.CONTACT_TO = 'caixa-do-contato@example.com'` dos `beforeEach` e o par `CONTACT_TO_ORIGINAL`/`afterEach` do primeiro `describe` **ficam**: são elas que provam que a variável, presente no ambiente, já não muda nada.

`playwright.config.ts`, no `env` do `webServer`: apagar a linha `CONTACT_TO: '',` (o código não a lê mais; e-mail, banco e CRM continuam desligados no e2e por `SENDGRID_API_KEY: ''`, `DATABASE_URI: ''` e `EXACT_SPOTTER_TOKEN: ''`, que ficam). O comentário acima ("zerar aqui desliga banco, e-mail e CRM") continua certo.

`.env.example`: apagar a linha do comentário de `CONTACT_TO` e a linha `CONTACT_TO=`. `docs/DEPLOY.md`: apagar a linha da tabela de `CONTACT_TO` e, logo abaixo da tabela, acrescentar: "`CONTACT_TO` deixou de ser lida em 10/2026: o Contato vai sempre para `ola@semog.com.br` (`CONTATO_TO`, `src/lib/leads/destinatarios.ts`)." (Documentação de variável que não existe mais leva a decisão errada.)

`src/site/conteudo/conteudo.ts`, `contatoPagina.mensagem.assuntos` passa a:

```ts
      assuntos: [
        { valor: 'condomino-duvida', rotulo: 'Sou condômino e tenho uma dúvida' },
        { valor: 'fornecedor', rotulo: 'Sou fornecedor' },
        { valor: 'imprensa', rotulo: 'Imprensa' },
        { valor: 'trabalhe-conosco', rotulo: 'Trabalhe conosco' },
        { valor: 'outro', rotulo: 'Outro assunto' },
      ],
```

- [ ] **Step 4: O formulário de mensagem**

`src/site/formularios/mensagem/FormularioDeMensagem.tsx`:

```tsx
'use client'

import '@/site/formularios/proposta/formulario-proposta.css'
import * as Sentry from '@sentry/nextjs'
import { type FormEvent, useState } from 'react'
import { submitForm } from '@/app/(frontend)/_actions/submit-form'
import { Turnstile } from '@/components/forms/Turnstile'
import { conteudo } from '@/site/conteudo/conteudo'
import { TelefonesDasUnidades } from '@/site/formularios/proposta/FalhaDoEnvio'

/** TEXTO-NOVO: estados do formulário real (o protótipo só tinha o aviso de demonstração). */
const TEXTOS = {
  enviando: 'Enviando…',
  recebido: 'Recebemos sua mensagem.',
  revise: 'Confira os campos marcados.',
  verificar: 'Confirme a verificação de segurança e envie de novo.',
  falhaTitulo: 'Não conseguimos enviar agora.',
  falhaTexto: 'Tente de novo ou ligue para uma Unidade Semog:',
  tentarDeNovo: 'Tentar de novo',
  semJs: 'Para mandar mensagem por aqui, o navegador precisa de JavaScript. Ou ligue para uma Unidade Semog:',
} as const

type Campos = { nome: string; email: string; assunto: string; mensagem: string }
type Estado =
  | { fase: 'editando'; erros: Readonly<Record<string, string>>; aviso: string }
  | { fase: 'enviando' }
  | { fase: 'enviado' }
  | { fase: 'falha' }

const EDITANDO: Estado = { fase: 'editando', erros: {}, aviso: '' }

function lerCampos(form: HTMLFormElement): Campos {
  const dados = new FormData(form)
  const texto = (nome: keyof Campos) => {
    const valor = dados.get(nome)
    return typeof valor === 'string' ? valor.trim() : ''
  }
  return { nome: texto('nome'), email: texto('email'), assunto: texto('assunto'), mensagem: texto('mensagem') }
}

function Erro({ id, texto }: { id: string; texto?: string }) {
  return (
    <p className="fp-erro" id={id} aria-live="polite">
      {texto}
    </p>
  )
}

/**
 * Mensagem do Contato (spec 6; DP9 do plano da fase 4): nome, e-mail, assunto e mensagem, com o
 * Turnstile, pelo mesmo `submitForm('contato')` do site atual. Todos os assuntos vão para
 * ola@semog.com.br. Erro de campo volta ao campo; falha de envio (inclusive action antiga depois
 * de um deploy) mostra os telefones das Unidades e vai ao Sentry, nunca "enviado" falso.
 */
export function FormularioDeMensagem() {
  const { mensagem } = conteudo.contatoPagina
  const [estado, setEstado] = useState<Estado>(EDITANDO)
  const [token, setToken] = useState('')
  const [chaveDoTurnstile, setChaveDoTurnstile] = useState(0)
  const erros = estado.fase === 'editando' ? estado.erros : {}

  function novaVerificacao() {
    setToken('')
    setChaveDoTurnstile((chave) => chave + 1)
  }

  async function enviar(campos: Campos, tokenAtual: string) {
    setEstado({ fase: 'enviando' })
    try {
      const resultado = await submitForm('contato', campos, tokenAtual)
      if (resultado.ok) {
        setEstado({ fase: 'enviado' })
        return
      }
      novaVerificacao()
      if (resultado.errors) {
        setEstado({ fase: 'editando', erros: resultado.errors, aviso: TEXTOS.revise })
        return
      }
      setEstado({ fase: 'falha' })
    } catch (erro) {
      Sentry.captureException(erro, { tags: { origem: 'contato-v2' } })
      novaVerificacao()
      setEstado({ fase: 'falha' })
    }
  }

  function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (estado.fase === 'enviando') return
    if (!token) {
      setEstado({ fase: 'editando', erros: {}, aviso: TEXTOS.verificar })
      return
    }
    void enviar(lerCampos(evento.currentTarget), token)
  }

  if (estado.fase === 'enviado') {
    return (
      <div className="fp-sucesso" role="status">
        <p className="fp-sucesso-titulo">{TEXTOS.recebido}</p>
      </div>
    )
  }

  const enviando = estado.fase === 'enviando'
  return (
    <>
      <form
        className="formulario-proposta cm-form revelar revelar--bloco"
        method="post"
        onSubmit={aoEnviar}
        aria-busy={enviando || undefined}
      >
        <div className="fp-par fp-par--invertido">
          <div className="fp-campo">
            <label htmlFor="cm-nome">Nome</label>
            <div className="fp-controle">
              <input id="cm-nome" name="nome" type="text" autoComplete="name" required maxLength={120} aria-describedby="cm-nome-erro" aria-invalid={erros.nome ? true : undefined} />
            </div>
            <Erro id="cm-nome-erro" texto={erros.nome} />
          </div>
          <div className="fp-campo">
            <label htmlFor="cm-email">E-mail</label>
            <div className="fp-controle">
              <input id="cm-email" name="email" type="email" autoComplete="email" required maxLength={254} aria-describedby="cm-email-erro" aria-invalid={erros.email ? true : undefined} />
            </div>
            <Erro id="cm-email-erro" texto={erros.email} />
          </div>
        </div>
        <div className="fp-campo">
          <label htmlFor="cm-assunto">Assunto</label>
          <div className="fp-controle fp-controle--select">
            <select id="cm-assunto" name="assunto" required defaultValue="" aria-describedby="cm-assunto-erro" aria-invalid={erros.assunto ? true : undefined}>
              <option value="" disabled>
                Selecione
              </option>
              {mensagem.assuntos.map((assunto) => (
                <option key={assunto.valor} value={assunto.valor}>
                  {assunto.rotulo}
                </option>
              ))}
            </select>
          </div>
          <Erro id="cm-assunto-erro" texto={erros.assunto} />
        </div>
        <div className="fp-campo">
          <label htmlFor="cm-mensagem">Mensagem</label>
          <div className="fp-controle">
            <textarea id="cm-mensagem" name="mensagem" rows={5} required maxLength={4000} aria-describedby="cm-mensagem-erro" aria-invalid={erros.mensagem ? true : undefined} />
          </div>
          <Erro id="cm-mensagem-erro" texto={erros.mensagem} />
        </div>
        <Turnstile key={chaveDoTurnstile} onToken={setToken} theme="light" className="fp-verificacao" />
        <div className="fp-acoes">
          <button className="botao" type="submit" disabled={enviando}>
            {enviando ? TEXTOS.enviando : mensagem.botao}
            <svg className="seta" aria-hidden="true">
              <use href="#seta" />
            </svg>
          </button>
          <p className="fp-status" role="status" aria-live="polite">
            {estado.fase === 'editando' ? estado.aviso : ''}
          </p>
        </div>
        {estado.fase === 'falha' ? (
          <div className="fp-falha" role="alert">
            <p className="fp-falha-titulo">{TEXTOS.falhaTitulo}</p>
            <p>{TEXTOS.falhaTexto}</p>
            <TelefonesDasUnidades uf="" />
            <div className="fp-acoes">
              <button className="botao" type="button" onClick={() => setEstado(EDITANDO)}>
                {TEXTOS.tentarDeNovo}
              </button>
            </div>
          </div>
        ) : null}
      </form>
      <div className="fp-sem-js">
        <p>{TEXTOS.semJs}</p>
        <TelefonesDasUnidades uf="" />
      </div>
    </>
  )
}
```

(O Biome reformata as linhas longas dos `<input>`; mantenha os atributos.)

- [ ] **Step 5: Seções, página e rota**

Copiar o CSS (`01-abertura.css` → `abertura.css` e acrescentar as duas regras do desvio; `02-unidades.css` → `unidades.css`; `03-mensagem.css` → `mensagem.css`, para `src/site/secoes/contato/`), portar as três parciais pela receita R com os desvios acima (o `MensagemDoContato` renderiza `<FormularioDeMensagem />` no lugar do `<form data-demo>`).

`src/site/paginas/contato.tsx`:

```tsx
import { EsqueletoLanding } from '@/site/layout/EsqueletoLanding'
import { JsonLd } from '@/site/secoes/comum/JsonLd'
import { AberturaDoContato } from '@/site/secoes/contato/Abertura'
import { MensagemDoContato } from '@/site/secoes/contato/Mensagem'
import { UnidadesDoContato } from '@/site/secoes/contato/Unidades'
import { jsonLdInstitucional } from '@/site/seo/institucional'

/** Corpo do Contato (contato.html do protótipo). A virada 1 o leva a /contato. */
export function PaginaContato() {
  return (
    <EsqueletoLanding pagina="contato" atual="contato">
      <JsonLd dados={jsonLdInstitucional('contato')} />
      <AberturaDoContato />
      <UnidadesDoContato />
      <MensagemDoContato />
    </EsqueletoLanding>
  )
}
```

`src/app/(site)/(landing)/previa-v2/contato/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PaginaContato } from '@/site/paginas/contato'
import { previaLiberada, ROBOTS_DA_PREVIA } from '@/site/previa'
import { metadadosInstitucionais } from '@/site/seo/institucional'

export const metadata: Metadata = { ...metadadosInstitucionais('contato'), robots: ROBOTS_DA_PREVIA }

/** Contato do site v2 na prévia (pacote landing). 404 em produção. */
export default function Pagina() {
  if (!previaLiberada()) notFound()
  return <PaginaContato />
}
```

`src/site/rotas.ts`: `'/contato'` em `PAGINAS_NA_PREVIA`.

- [ ] **Step 6: Rodar e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-pagina-contato.int.spec.tsx tests/int/submit-form.int.spec.ts tests/int/site-v2-rotas.int.spec.ts tests/int/site-v2-redacao.int.spec.ts tests/int/site-v2-identidade.int.spec.ts tests/int/site-v2-sou-cliente.int.spec.tsx`
Expected: PASS, com os três testes do Contato de `submit-form.int.spec.ts` reescritos no Step 3 (destino e `notificado_para` em `ola@semog.com.br`). Depois, `rg -l "submitForm\('contato'|contatoSchema|CONTACT_TO" tests` e rodar também os testes achados que não estão no comando acima: o formulário antigo usa o mesmo schema e a mesma action. Se algum outro teste afirmar o destino antigo, ele muda pelo mesmo critério (destino `ola@`), entra no `git add` e vai no relatório; teste que falhe por outro motivo é parada, não reescrita.

Run: `pnpm run check:server-actions`
Expected: verde.

- [ ] **Step 7: Olhar no navegador antes de commitar (sem enviar)**

`pnpm dev`, `http://localhost:3000/previa-v2/contato` em 1440 e 390: os quatro atalhos (o "2ª via de boleto" abre o painel direto na consulta pelo CPF, ou no menu se a 2ª via estiver desligada no ambiente local; parar na tela do CPF), as quatro Unidades com telefone em texto e "Como chegar", o formulário com os cinco assuntos. **Não enviar**: o build local grava no banco de produção (spec 7).

- [ ] **Step 8: Portões e commit**

Run: os cinco portões. Expected: verdes.

```bash
git branch --show-current && git add src/site/secoes/contato src/site/formularios/mensagem src/site/paginas/contato.tsx "src/app/(site)/(landing)/previa-v2/contato/page.tsx" src/site/conteudo/conteudo.ts src/lib/form-schemas.ts src/lib/leads/destinatarios.ts "src/app/(frontend)/_actions/submit-form.ts" .env.example docs/DEPLOY.md src/site/rotas.ts playwright.config.ts tests/int/submit-form.int.spec.ts tests/int/site-v2-pagina-contato.int.spec.tsx && git commit -m "feat(site-v2): Contato com o atalho da 2ª via, as Unidades e o formulário de verdade para o ola@

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
```

---

## Tarefa 4.17: NAP com fonte única e teste de consistência

A spec 6 manda o NAP (nome, endereço, telefone) sair de uma fonte única, `UNITS` (`src/lib/seo.ts`, a mesma do JSON-LD `LocalBusiness`), com teste de consistência contra o texto das páginas. Hoje há três grafias (UNITS, `content/site.ts` e `conteudo.cidades`) e nenhum teste as amarra (DP8).

**Files:**
- Modify: `src/lib/seo.ts` (só `export` na `UNITS`)
- Test: `tests/int/site-v2-nap.int.spec.tsx`

**Interfaces:**
- Consumes: `UNITS` (`src/lib/seo.ts`), `site.company.addresses` (`content/site.ts`), `conteudo.cidades`, `conteudo.unidades`, `textosDe` (helper), `UnidadesDoContato` (4.16), `unidadesDaUf` (`FalhaDoEnvio.tsx`).
- Produces: `export const UNITS: SeoUnit[]` (a mesma lista de hoje, sem mudança de dado).

- [ ] **Step 1: Escrever o teste**

`tests/int/site-v2-nap.int.spec.tsx`:

```tsx
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { site } from '@/../content/site'
import { UNITS } from '@/lib/seo'
import { conteudo } from '@/site/conteudo/conteudo'
import { unidadesDaUf } from '@/site/formularios/proposta/FalhaDoEnvio'
import { UnidadesDoContato } from '@/site/secoes/contato/Unidades'
import { textosDe } from './helpers/identidade'

const digitos = (texto: string) => texto.replace(/\D/g, '')

/** "R. Bartolomeu de Gusmão, 217, Madalena" → o logradouro com número, e o bairro. */
function partes(rua: string) {
  const pedacos = rua.split(',').map((pedaco) => pedaco.trim())
  return { logradouro: `${pedacos[0]}, ${pedacos[1]}`, bairro: pedacos[pedacos.length - 1] }
}

function cidadeDoConteudo(slug: string) {
  const id = slug.replace('administradora-de-condominios-', '')
  if (!Object.hasOwn(conteudo.cidades, id)) throw new Error(`conteudo.cidades sem "${id}"`)
  // `as`: `hasOwn` acima garante que o id é uma chave de conteudo.cidades.
  return conteudo.cidades[id as keyof typeof conteudo.cidades]
}

const UNIDADES = UNITS.map((unidade) => [unidade.city, unidade] as const)

describe('NAP com fonte única (UNITS, spec 6)', () => {
  it('as quatro Unidades da UNITS são as do conteúdo, na mesma ordem', () => {
    expect(UNITS.map((u) => u.slug)).toEqual(conteudo.unidades.map((u) => u.url.slice(1)))
  })

  it.each(UNIDADES)('%s: content/site.ts (rodapé antigo e falha do envio) bate com a UNITS', (_cidade, u) => {
    const endereco = site.company.addresses.find((a) => a.city === u.city)
    if (!endereco) throw new Error(`content/site.ts sem ${u.city}`)
    const { logradouro, bairro } = partes(u.street)
    expect(digitos(endereco.phone)).toBe(digitos(u.phoneDisplay))
    expect(endereco.uf).toBe(u.region)
    expect(endereco.address).toContain(logradouro)
    expect(endereco.address).toContain(bairro)
    expect(endereco.address).toContain(`${u.city}/${u.region}`)
    expect(digitos(endereco.address)).toContain(digitos(u.postalCode))
  })

  it.each(UNIDADES)('%s: conteudo.cidades (Contato e landings) bate com a UNITS', (_cidade, u) => {
    const cidade = cidadeDoConteudo(u.slug)
    const { logradouro, bairro } = partes(u.street)
    expect(cidade.telefone).toBe(u.phoneDisplay)
    expect(cidade.endereco).toContain(logradouro)
    expect(cidade.endereco).toContain(bairro)
    expect(cidade.endereco).toContain(`${u.city}/${u.region}`)
    expect(cidade.mapa).toContain(u.cid)
  })

  it('todo telefone escrito no conteúdo tipado é de uma Unidade', () => {
    const daUnits = new Set(UNITS.map((u) => u.phoneDisplay))
    const escritos = textosDe(conteudo).flatMap((texto) => texto.match(/\(\d{2}\) \d{4,5}-\d{4}/g) ?? [])
    expect(escritos.length).toBeGreaterThan(0)
    expect(escritos.filter((fone) => !daUnits.has(fone))).toEqual([])
  })

  it('o Contato renderizado mostra telefone e bairro de cada Unidade', () => {
    const { container } = render(<UnidadesDoContato />)
    const texto = container.textContent ?? ''
    for (const u of UNITS) {
      expect(texto, u.city).toContain(u.phoneDisplay)
      expect(texto, u.city).toContain(partes(u.street).bairro)
    }
  })

  it('a falha do envio oferece o telefone da Unidade de cada UF', () => {
    for (const u of UNITS) {
      expect(unidadesDaUf(u.region).map((a) => digitos(a.phone))).toContain(digitos(u.phoneDisplay))
    }
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-nap.int.spec.tsx`
Expected: FAIL com "UNITS is not exported" (ou `undefined` no `map`).

- [ ] **Step 3: Exportar a `UNITS`**

Em `src/lib/seo.ts`, `const UNITS: SeoUnit[] = [` → `export const UNITS: SeoUnit[] = [`, e uma linha de comentário acima: `/** Fonte única do NAP das Unidades (spec 6 do site v2); o teste site-v2-nap amarra os outros textos a ela. */`.

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-nap.int.spec.tsx tests/int/seo-jsonld.int.spec.ts`
Expected: PASS. Se um telefone ou endereço não bater, é divergência real de NAP: parar e reportar (a correção é dado do Leandro, não do plano).

- [ ] **Step 5: Portões e commit**

Run: os cinco portões. Expected: verdes.

```bash
git branch --show-current && git add src/lib/seo.ts tests/int/site-v2-nap.int.spec.tsx && git commit -m "test(site-v2): NAP das Unidades com fonte única e teste de consistência

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
```

---

## Tarefa 4.18: 404 nova

Resposta do Leandro: "uma nova página 404 bem legal que já traga alguns links interessantes", com título que não afirma "não existe mais" (o endereço pode nunca ter existido). Base visual: a 404 do protótipo (o traço de ponta reta que se perde e volta), com os cinco caminhos dela (início, Unidades, proposta, blog, contato, na mesma ordem) em cartões gelo, como os atalhos do Contato. Sem cartão "Sou cliente": a resposta do Leandro põe o gatilho só no cabeçalho, no rodapé e no Contato (DP6), e a 404 já tem cabeçalho e rodapé; o cliente que caiu aqui chega à 2ª via pelo cartão do Contato.

**Files:**
- Create: `src/site/secoes/nao-encontrada/NaoEncontrada.tsx` + `nao-encontrada.css` (de `sections\nao-encontrada\01-pagina.html`, `scenes\nao-encontrada\01-pagina.css`, com os cartões acrescentados)
- Create: `src/site/paginas/nao-encontrada.tsx`, `src/app/(site)/(landing)/previa-v2/nao-encontrada/page.tsx`, `src/app/(site)/not-found.tsx`
- Test: `tests/int/site-v2-pagina-nao-encontrada.int.spec.tsx`

**Interfaces:**
- Consumes: `EsqueletoLanding` (4.14, que traz o cabeçalho e o rodapé com o gatilho do "Sou cliente"), `conteudo.naoEncontrada` (4.1), `caminhoNoSite`, `comIndice` (4.4).
- Produces: `NaoEncontrada()`; `PaginaNaoEncontrada()` e `METADADOS_DA_404: Metadata` (`src/site/paginas/nao-encontrada.tsx`); `src/app/(site)/not-found.tsx` (atende todo `notFound()` do `(site)`); a rota `/previa-v2/nao-encontrada` (status 200, `noindex`, para ver a página na prévia).

- [ ] **Step 1: Escrever o teste**

`tests/int/site-v2-pagina-nao-encontrada.int.spec.tsx`:

```tsx
import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import NaoEncontradaDoSite, { metadata as metadataDo404 } from '@/app/(site)/not-found'
import Previa, { metadata as metadataDaPrevia } from '@/app/(site)/(landing)/previa-v2/nao-encontrada/page'
import { conteudo } from '@/site/conteudo/conteudo'
import { conferirPagina, type SecaoEsperada } from './helpers/paginas'

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))

afterEach(() => {
  vi.unstubAllEnvs()
})

const SECOES: SecaoEsperada[] = [
  {
    id: 'nao-encontrada',
    arquivo: 'nao-encontrada/01-pagina',
    diferencas: { semClasses: ['link-seta'], comClasses: ['ne-cartao'] },
  },
]

describe('404 nova do site v2', () => {
  it('o título não afirma que a página existiu; traz os cinco caminhos do protótipo, sem "Sou cliente" no corpo', () => {
    const container = conferirPagina(<NaoEncontradaDoSite />, {
      dataPagina: 'nao-encontrada',
      secoes: SECOES,
    })
    const titulo = container.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim()
    expect(titulo).toBe(`${conteudo.naoEncontrada.titulo} ${conteudo.naoEncontrada.enfase}`)
    expect(titulo).not.toMatch(/não existe mais/)
    const cartoes = Array.from(container.querySelectorAll('#nao-encontrada .ne-cartao'))
    expect(cartoes).toHaveLength(5)
    expect(cartoes.map((c) => c.querySelector('strong')?.textContent)).toEqual([
      'Página inicial',
      'Unidades Semog',
      'Pedir proposta',
      'Blog',
      'Fale com a gente',
    ])
    // O "Sou cliente" fica só no cabeçalho, no rodapé e no Contato (resposta do Leandro, DP6).
    expect(container.querySelector('#nao-encontrada [aria-haspopup="dialog"]')).toBeNull()
    expect(container.querySelector('#nao-encontrada [data-wa-caminho]')).toBeNull()
    expect(cartoes.at(-1)?.getAttribute('href')).toBe('/previa-v2/contato')
  })

  it('o <head> da 404 é próprio e nunca é indexado', () => {
    expect(metadataDo404.title).toBe('Página não encontrada · Semog')
    expect(metadataDo404.robots).toEqual({ index: false, follow: false })
    expect(metadataDaPrevia.robots).toEqual({ index: false, follow: false })
  })

  it('a prévia da 404 abre fora de produção e, em produção, responde 404 (com esta mesma página)', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    const { container } = render(<Previa />)
    expect(container.querySelector('#nao-encontrada')).not.toBeNull()
    vi.stubEnv('VERCEL_ENV', 'production')
    expect(() => Previa()).toThrow('NEXT_HTTP_ERROR_FALLBACK;404')
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-pagina-nao-encontrada.int.spec.tsx`
Expected: FAIL com "Failed to resolve import '@/app/(site)/not-found'".

- [ ] **Step 3: CSS**

```powershell
Copy-Item -LiteralPath 'C:\Users\lekoc\semogapp\semogsite-site-v2\design-explorations\site-v2-prototipo\src\scenes\nao-encontrada\01-pagina.css' -Destination 'C:\Users\lekoc\semogapp\semogsite-site-v2\src\site\secoes\nao-encontrada\nao-encontrada.css'
```

(criar a pasta antes com `New-Item -ItemType Directory -Force`). Trocar o comentário de abertura por `/* 404 do site v2 (fase 4): rótulo, título em duas linhas com a ênfase por peso, o traço que se perde no meio e volta, e os caminhos em cartões. Entrada só de CSS, da primeira pintura. */` e acrescentar no fim:

```css
/* ---- Cartões (fase 4): os cinco caminhos úteis em blocos gelo de ponta reta, como os atalhos
   do Contato. Três por linha no computador, dois no tablet, um no celular. */
#nao-encontrada .ne-links {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--e2);
  margin-top: var(--e4);
}
#nao-encontrada .ne-links li {
  display: grid;
  min-width: 0;
}
#nao-encontrada .ne-cartao {
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: var(--e1);
  width: 100%;
  min-height: 100%;
  padding: var(--e4) var(--e4) var(--e3);
  border: 0;
  background: var(--gelo);
  color: var(--texto);
  font: inherit;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 320ms var(--ease-expo);
}
#nao-encontrada .ne-cartao:hover {
  background: color-mix(in oklab, var(--gelo) 70%, var(--ceu-claro));
}
#nao-encontrada .ne-cartao strong {
  font-family: var(--fonte-titulo);
  font-size: 1.375rem;
  font-weight: 400;
  letter-spacing: -0.015em;
  color: var(--marinho);
}
#nao-encontrada .ne-cartao span {
  font-size: var(--t-pequeno);
  color: var(--texto-suave);
}
#nao-encontrada .ne-cartao .seta {
  color: var(--marinho);
  transition: transform 320ms var(--ease-expo);
}
#nao-encontrada .ne-cartao:hover .seta {
  transform: translateX(4px);
}
#nao-encontrada .ne-cartao:focus-visible {
  outline: 2px solid var(--marinho);
  outline-offset: 2px;
}
@media (max-width: 900px) {
  #nao-encontrada .ne-links {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 520px) {
  #nao-encontrada .ne-links {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 4: Seção, página, prévia e `not-found`**

`src/site/secoes/nao-encontrada/NaoEncontrada.tsx`:

```tsx
import './nao-encontrada.css'
import type React from 'react'
import { conteudo } from '@/site/conteudo/conteudo'
import { comIndice } from '@/site/estilo'
import { caminhoNoSite } from '@/site/rotas'

type ChaveDoCartao = keyof typeof conteudo.naoEncontrada.links

/**
 * Os cinco caminhos, na ordem da 404 do protótipo. Sem "Sou cliente" no corpo (DP6): o cabeçalho
 * e o rodapé já o têm, e o Contato leva à 2ª via.
 */
const CARTOES: ReadonlyArray<readonly [ChaveDoCartao, string]> = [
  ['inicio', '/'],
  ['unidades', '/#unidades'],
  ['proposta', '/proposta'],
  ['blog', '/blog'],
  ['contato', '/contato'],
]

function CorpoDoCartao({ chave }: { chave: ChaveDoCartao }): React.ReactNode {
  const { titulo, texto } = conteudo.naoEncontrada.links[chave]
  return (
    <>
      <strong>{titulo}</strong>
      <span>{texto}</span>
      <svg className="seta" aria-hidden="true">
        <use href="#seta" />
      </svg>
    </>
  )
}

/**
 * 404 do site v2 (resposta do Leandro, 16/10/2026): o título não afirma que a página existiu; o
 * traço da marca se perde no meio e volta mais abaixo; e os caminhos úteis vêm em cartões.
 */
export function NaoEncontrada() {
  const t = conteudo.naoEncontrada
  return (
    <section id="nao-encontrada" className="ne" data-tema="claro" aria-labelledby="ne-titulo">
      <div className="container ne-topo">
        <p className="ne-rotulo rotulo">{t.rotulo}</p>
        <h1 id="ne-titulo" className="ne-titulo">
          <span className="linha">
            <span className="linha-interna" style={comIndice(0)}>
              {t.titulo}
            </span>
          </span>{' '}
          <span className="linha">
            <span className="linha-interna" style={comIndice(1)}>
              <em className="peso peso-fixo" data-texto={t.enfase}>
                {t.enfase}
              </em>
            </span>
          </span>
        </h1>
      </div>
      <svg
        className="ne-traco"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <path className="percurso ne-ida" pathLength={1} d="M0 40H560" />
        <path className="percurso ne-volta" pathLength={1} d="M700 96C820 96 860 40 980 40H1440" />
      </svg>
      <div className="container ne-caminhos">
        <p className="ne-texto">{t.texto}</p>
        <ul className="ne-links">
          {CARTOES.map(([chave, href], i) => (
            <li key={chave} style={comIndice(i)}>
              <a className="ne-cartao" href={caminhoNoSite(href)}>
                <CorpoDoCartao chave={chave} />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
```

`src/site/paginas/nao-encontrada.tsx`:

```tsx
import type { Metadata } from 'next'
import { EsqueletoLanding } from '@/site/layout/EsqueletoLanding'
import { NaoEncontrada } from '@/site/secoes/nao-encontrada/NaoEncontrada'

/** O `<head>` da 404: título próprio, nunca indexado (o Next também põe noindex no status 404). */
export const METADADOS_DA_404: Metadata = {
  title: 'Página não encontrada · Semog',
  // TEXTO-NOVO: a descrição do protótipo dizia "não existe mais".
  description:
    'Não encontramos este endereço. Siga para a página inicial, as Unidades Semog, o pedido de proposta, o blog ou o contato.',
  robots: { index: false, follow: false },
}

/** Corpo da 404 do site v2 (pacote landing). */
export function PaginaNaoEncontrada() {
  return (
    <EsqueletoLanding pagina="nao-encontrada">
      <NaoEncontrada />
    </EsqueletoLanding>
  )
}
```

`src/app/(site)/not-found.tsx`:

```tsx
import type { Metadata } from 'next'
import { METADADOS_DA_404, PaginaNaoEncontrada } from '@/site/paginas/nao-encontrada'

export const metadata: Metadata = METADADOS_DA_404

/**
 * 404 do site v2 (DP10 do plano da fase 4): atende todo `notFound()` do (site), inclusive a prévia
 * fechada em produção. A 404 de URL desconhecida do site inteiro continua a do (frontend) até a
 * virada, que decide entre global-not-found e o catch-all.
 */
export default function NaoEncontradaDoSite() {
  return <PaginaNaoEncontrada />
}
```

`src/app/(site)/(landing)/previa-v2/nao-encontrada/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { METADADOS_DA_404, PaginaNaoEncontrada } from '@/site/paginas/nao-encontrada'
import { previaLiberada } from '@/site/previa'

export const metadata: Metadata = METADADOS_DA_404

/** A 404 nova vista na prévia, com status 200 (para olhar e fotografar). 404 de verdade em produção. */
export default function Pagina() {
  if (!previaLiberada()) notFound()
  return <PaginaNaoEncontrada />
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-pagina-nao-encontrada.int.spec.tsx tests/int/site-v2-identidade.int.spec.ts tests/int/site-v2-redacao.int.spec.ts tests/int/site-v2-inventario.int.spec.ts`
Expected: PASS (o inventário já trata `/previa-v2/*` como prévia).

- [ ] **Step 6: Olhar no navegador antes de commitar**

`pnpm dev`: `http://localhost:3000/previa-v2/nao-encontrada` em 1440, 900, 520 e 390 (o traço desenha, os cinco cartões sem corte e sem sobra estranha na última linha; o "Sou cliente" do cabeçalho e do rodapé abre o painel). Depois, `VERCEL_ENV=production` no `pnpm build` + `pnpm start` não é preciso aqui: fica para a verificação (4.20, Step 11).

- [ ] **Step 7: Portões e commit**

Run: os cinco portões. Expected: verdes.

```bash
git branch --show-current && git add src/site/secoes/nao-encontrada src/site/paginas/nao-encontrada.tsx "src/app/(site)/not-found.tsx" "src/app/(site)/(landing)/previa-v2/nao-encontrada/page.tsx" tests/int/site-v2-pagina-nao-encontrada.int.spec.tsx && git commit -m "feat(site-v2): 404 nova, com os cinco caminhos úteis

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
```

---

## Tarefa 4.19: Menu do celular (prazo "antes da virada") e os redirects da virada como função

Duas pendências do Final da fase 1 com prazo antes da virada (menu com `aria-expanded` preso ao alargar a tela; foco não preso no menu aberto) e os dois 308 para `/tecnologia` prontos para a virada (DP7).

**Files:**
- Modify: `src/site/core/cabecalho.ts`, `src/site/redirecionamentos.ts`, `next.config.ts`
- Modify: `tests/int/site-v2-inventario.int.spec.ts`
- Test: `tests/int/site-v2-menu.int.spec.tsx`

**Interfaces:**
- Consumes: `iniciarMenu` (fase 1), `REDIRECIONAMENTOS`, `INVENTARIO`, `VIRADA_1_FEITA`.
- Produces: `LARGURA_DO_MENU = '(max-width: 1080px)'` (`src/site/core/cabecalho.ts`); `REDIRECIONAMENTOS_DA_VIRADA_1: Redirecionamento[]` e `redirecionamentosDoSite(viradaFeita: boolean): Redirecionamento[]` (`src/site/redirecionamentos.ts`).

- [ ] **Step 1: Escrever os testes**

`tests/int/site-v2-menu.int.spec.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LARGURA_DO_MENU } from '@/site/core/cabecalho'
import { Cabecalho } from '@/site/layout/Cabecalho'

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))

type MidiaFalsa = { matches: boolean; mudar: (estreita: boolean) => void }

function midiaFalsa(): MidiaFalsa {
  const ouvintes = new Set<() => void>()
  const midia = {
    matches: true,
    media: LARGURA_DO_MENU,
    addEventListener: (_tipo: string, ouvinte: () => void) => ouvintes.add(ouvinte),
    removeEventListener: (_tipo: string, ouvinte: () => void) => ouvintes.delete(ouvinte),
    mudar(estreita: boolean) {
      midia.matches = estreita
      for (const ouvinte of ouvintes) ouvinte()
    },
  }
  return midia
}

let midia: MidiaFalsa
beforeEach(() => {
  midia = midiaFalsa()
  // `as`: o dublê só implementa o que iniciarMenu usa de MediaQueryList.
  vi.spyOn(window, 'matchMedia').mockImplementation(() => midia as unknown as MediaQueryList)
})
afterEach(() => {
  vi.restoreAllMocks()
})

function abrirMenu() {
  render(<Cabecalho destinoProposta="/proposta" />)
  const botao = screen.getByRole('button', { name: 'Menu' })
  fireEvent.click(botao)
  return botao
}

describe('menu do celular (Final da fase 1, prazo antes da virada)', () => {
  it('fecha quando a tela alarga além do ponto do menu (aria-expanded não fica preso)', () => {
    const botao = abrirMenu()
    expect(botao.getAttribute('aria-expanded')).toBe('true')
    midia.mudar(false)
    expect(botao.getAttribute('aria-expanded')).toBe('false')
    expect(document.querySelector('[data-cabecalho]')?.hasAttribute('data-menu-aberto')).toBe(false)
  })

  it('com o menu aberto, Tab e Shift+Tab ficam entre o botão e os itens do painel', () => {
    const botao = abrirMenu()
    const itens = Array.from(
      document.querySelectorAll<HTMLElement>('#painel-menu a[href], #painel-menu button'),
    )
    const ultimo = itens[itens.length - 1]
    ultimo.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(document.activeElement).toBe(botao)
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(ultimo)
  })

  it('Esc fecha e devolve o foco ao botão; escolher o "Sou cliente" no painel fecha o menu', () => {
    const botao = abrirMenu()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(botao.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(botao)
    fireEvent.click(botao)
    const cliente = document.querySelector<HTMLElement>('#painel-menu .painel-cliente')
    if (!cliente) throw new Error('"Sou cliente" ausente no painel')
    fireEvent.click(cliente)
    expect(botao.getAttribute('aria-expanded')).toBe('false')
  })
})
```

Em `tests/int/site-v2-inventario.int.spec.ts`: acrescentar `import { readFileSync } from 'node:fs'` (se ainda não houver) e trocar o import de `@/site/redirecionamentos` por `import { REDIRECIONAMENTOS, REDIRECIONAMENTOS_DA_VIRADA_1, redirecionamentosDoSite } from '@/site/redirecionamentos'`; no fim do arquivo:

```ts
describe('redirects da virada 1 (fase 4, DP7)', () => {
  it('são exatamente os do inventário: 308 direto para /tecnologia', () => {
    const doInventario = Object.entries(INVENTARIO).flatMap(([origem, entrada]) =>
      entrada.tipo === 'redireciona'
        ? [{ source: origem, destination: entrada.destino, permanent: true }]
        : [],
    )
    expect(REDIRECIONAMENTOS_DA_VIRADA_1).toEqual(doInventario)
    expect(REDIRECIONAMENTOS_DA_VIRADA_1.map((r) => r.destination)).toEqual([
      '/tecnologia',
      '/tecnologia',
    ])
  })

  it('antes da virada ficam os 54; com a virada, 56, sem cadeia (a lista de cadeias fica vazia)', () => {
    expect(redirecionamentosDoSite(false)).toEqual(REDIRECIONAMENTOS)
    const depois = redirecionamentosDoSite(true)
    expect(depois).toHaveLength(56)
    const origens = new Set(depois.map((r) => r.source))
    expect(depois.filter((r) => origens.has(r.destination)).map((r) => r.source)).toEqual([])
    expect(depois.every((r) => r.permanent === true)).toBe(true)
  })

  it('o next.config.ts chama a função com VIRADA_1_FEITA', () => {
    const fonte = readFileSync('next.config.ts', 'utf8')
    expect(fonte).toContain('redirecionamentosDoSite(VIRADA_1_FEITA)')
    expect(fonte).toContain("from './src/site/inventario'")
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-menu.int.spec.tsx tests/int/site-v2-inventario.int.spec.ts`
Expected: FAIL: `LARGURA_DO_MENU` não exportado; o menu não fecha ao alargar nem prende o Tab; `REDIRECIONAMENTOS_DA_VIRADA_1` ausente.

- [ ] **Step 3: O menu**

`src/site/core/cabecalho.ts` inteiro:

```ts
/* Menu do cabeçalho em tela estreita. Independe do GSAP: liga mesmo se o movimento falhar.
   Fecha ao escolher um item (link ou botão), com Esc (o foco volta ao botão) e quando a tela alarga
   além do ponto em que o menu existe. Aberto, o Tab fica preso entre o botão e os itens do painel
   (DP13 do plano da fase 4). */

/** O mesmo ponto do CSS (`@media (max-width: 1080px)` em base.css). */
export const LARGURA_DO_MENU = '(max-width: 1080px)'

function itensDoPainel(painel: Element): HTMLElement[] {
  return Array.from(painel.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'))
}

export function iniciarMenu(): () => void {
  const cabecalho = document.querySelector('[data-cabecalho]')
  const botao = cabecalho?.querySelector('[data-menu]')
  const painel = cabecalho?.querySelector('.painel-menu')
  if (!(cabecalho instanceof HTMLElement) || !(botao instanceof HTMLElement) || !painel) {
    throw new Error('[menu] Cabeçalho, botão [data-menu] ou .painel-menu ausente.')
  }
  const midia = window.matchMedia(LARGURA_DO_MENU)
  const aberto = () => botao.getAttribute('aria-expanded') === 'true'
  const definir = (abrir: boolean) => {
    botao.setAttribute('aria-expanded', String(abrir))
    cabecalho.toggleAttribute('data-menu-aberto', abrir)
  }
  const aoClicarBotao = () => definir(!aberto())
  const aoClicarPainel = (evento: Event) => {
    if (evento.target instanceof Element && evento.target.closest('a, button')) definir(false)
  }
  const aoMudarLargura = () => {
    if (!midia.matches && aberto()) definir(false)
  }
  const prenderTab = (evento: KeyboardEvent) => {
    const ciclo = [botao, ...itensDoPainel(painel)]
    const primeiro = ciclo[0]
    const ultimo = ciclo[ciclo.length - 1]
    const ativo = document.activeElement
    if (evento.shiftKey && ativo === primeiro) {
      evento.preventDefault()
      ultimo.focus()
    } else if (!evento.shiftKey && ativo === ultimo) {
      evento.preventDefault()
      primeiro.focus()
    } else if (!ciclo.some((item) => item === ativo)) {
      evento.preventDefault()
      primeiro.focus()
    }
  }
  const aoTeclar = (evento: KeyboardEvent) => {
    if (!aberto()) return
    if (evento.key === 'Escape') {
      definir(false)
      botao.focus()
    } else if (evento.key === 'Tab') {
      prenderTab(evento)
    }
  }
  botao.addEventListener('click', aoClicarBotao)
  painel.addEventListener('click', aoClicarPainel)
  document.addEventListener('keydown', aoTeclar)
  midia.addEventListener('change', aoMudarLargura)
  return () => {
    botao.removeEventListener('click', aoClicarBotao)
    painel.removeEventListener('click', aoClicarPainel)
    document.removeEventListener('keydown', aoTeclar)
    midia.removeEventListener('change', aoMudarLargura)
  }
}
```

- [ ] **Step 4: Os redirects da virada**

`src/site/redirecionamentos.ts`, no fim:

```ts
/**
 * Os dois redirects da fase 4 (spec 6): as páginas de prestação de contas e de software saem e
 * apontam, direto e sem cadeia, para /tecnologia, que nasce na virada 1. Só entram no
 * next.config.ts com VIRADA_1_FEITA (DP7 do plano da fase 4): antes disso, as duas URLs seguem
 * servindo as páginas de hoje.
 */
export const REDIRECIONAMENTOS_DA_VIRADA_1: Redirecionamento[] = [
  { source: '/prestacao-de-contas-condominio', destination: '/tecnologia', permanent: true },
  { source: '/software-de-gestao-condominial', destination: '/tecnologia', permanent: true },
]

/** Os redirects que o next.config.ts devolve: os 54 de hoje e, com a virada, os dois da fase 4. */
export function redirecionamentosDoSite(viradaFeita: boolean): Redirecionamento[] {
  return viradaFeita ? [...REDIRECIONAMENTOS, ...REDIRECIONAMENTOS_DA_VIRADA_1] : REDIRECIONAMENTOS
}
```

`next.config.ts`: trocar `import { REDIRECIONAMENTOS } from './src/site/redirecionamentos'` por

```ts
import { VIRADA_1_FEITA } from './src/site/inventario'
import { redirecionamentosDoSite } from './src/site/redirecionamentos'
```

e o corpo de `redirects()` por `return redirecionamentosDoSite(VIRADA_1_FEITA)`. (`src/site/inventario.ts` não importa nada, então o carregador do `next.config.ts`, que não conhece os aliases `@/`, o lê pelo caminho relativo; Task 1.3 da fase 1.)

- [ ] **Step 5: Rodar e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-menu.int.spec.tsx tests/int/site-v2-inventario.int.spec.ts tests/int/site-v2-layout.int.spec.tsx tests/int/sitemap.int.spec.ts`
Expected: PASS.

Run: `pnpm build` e, com `pnpm start -p 3100`: `curl.exe -s -o NUL -w "%{http_code}" http://localhost:3100/prestacao-de-contas-condominio`
Expected: `200` (antes da virada a página de hoje continua; o 308 é provado na 4.20 numa cópia com a virada ligada).

- [ ] **Step 6: Portões e commit**

Run: os cinco portões. Expected: verdes.

```bash
git branch --show-current && git add src/site/core/cabecalho.ts src/site/redirecionamentos.ts next.config.ts tests/int/site-v2-menu.int.spec.tsx tests/int/site-v2-inventario.int.spec.ts && git commit -m "feat(site-v2): menu que fecha ao alargar e prende o foco; redirects da virada para /tecnologia

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
```

---

## Tarefa 4.20: Verificação COMPLETA do PR 4b (e da fase 4 inteira)

Os Steps 1 e 2 são do implementador (a comparação de metadados passa a olhar as páginas institucionais da prévia), e o Step 12 também (ele edita uma cópia descartável, e o verificador não edita); os demais Steps, de 3 a 16, são de um **verificador separado** (agente `verificador`, que não edita código). Pasta: `…\scratchpad\v4b\`; relatório em `…\scratchpad\v4b\verificacao.md`, com a saída real e os prints pelo caminho. Nenhum envio de formulário, nenhum CPF, nenhuma conexão ao banco.

**Files:**
- Modify: `scripts/site-v2-comparar-metadados.mjs`, `tests/int/site-v2-comparar-metadados.int.spec.ts`

- [ ] **Step 1: A comparação de metadados olha a prévia institucional**

Em `scripts/site-v2-comparar-metadados.mjs`, depois de `const LEITURA = …`:

```js
/** Páginas institucionais da fase 4 que já estão na prévia (a home é /previa-v2). */
const INSTITUCIONAL = /^\/(?:semog|administracao-de-condominios|garante|incorporadoras|solucoes|proposta|contato)?$/
```

e `destinoNoDepois` passa a:

```js
/** No build local, a página que vai para a URL real na virada 1 é a da prévia. */
export function destinoNoDepois(caminho) {
  if (LEITURA.test(caminho)) return `${PREFIXO_DA_LEITURA}${caminho}`
  if (INSTITUCIONAL.test(caminho)) return caminho === '/' ? PREFIXO_DA_LEITURA : `${PREFIXO_DA_LEITURA}${caminho}`
  return caminho
}
```

Em `tests/int/site-v2-comparar-metadados.int.spec.ts`, no teste de `destinoNoDepois`, acrescentar: `expect(destinoNoDepois('/')).toBe('/previa-v2')`, `expect(destinoNoDepois('/semog')).toBe('/previa-v2/semog')`, `expect(destinoNoDepois('/administradora-de-condominios-recife')).toBe('/administradora-de-condominios-recife')` e `expect(destinoNoDepois('/prestacao-de-contas-condominio')).toBe('/prestacao-de-contas-condominio')`; se o teste antigo afirmava que `/semog` ficava como estava, trocar pela nova expectativa.

- [ ] **Step 2: Rodar e commitar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-comparar-metadados.int.spec.ts` e os cinco portões. Expected: verdes.

```bash
git branch --show-current && git add scripts/site-v2-comparar-metadados.mjs tests/int/site-v2-comparar-metadados.int.spec.ts && git commit -m "chore(site-v2): comparação de metadados também nas páginas institucionais da prévia

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
```

**Daqui em diante, o verificador separado.**

- [ ] **Step 3: Estado da árvore e portões**

Run: `git branch --show-current; git status --short; git log --oneline -14` e os cinco portões.
Expected: `feat/site-v2`, árvore limpa, os commits das Tarefas 4.10 a 4.20, portões verdes; anotar a contagem de testes.

- [ ] **Step 4: Build sem env, servidores e conferência do servido**

Como no Step 5 da 4.9 (build sem `NEXT_PUBLIC_SITE_URL`, `pnpm start -p 3100`, protótipo em `node serve.mjs`; o `.next/BUILD_ID` é deste build).

- [ ] **Step 5: Quadros por seção, lado a lado, das dez páginas**

```powershell
node scripts/site-v2-institucional.mjs --next http://localhost:3100 --prototipo http://127.0.0.1:4180 --saida …\v4b\varredura --build-sem-env
```

Expected: `ok: 10 páginas × 2 navegadores × 2 larguras`. Abrir os pares de todas as seções (Garante, Incorporadoras, Tecnologia, proposta, contato e 404 contra o protótipo; home, A Semog e Gestão de novo, porque o cabeçalho e o rodapé mudaram) e anotar cada diferença visível que não venha das respostas do Leandro. `/solucoes` não tem par: olhar os quadros de Next sozinhos contra a régua (identidade v2, nada editorial, nada cortado).

- [ ] **Step 6: Quadros das cenas presas e toque emulado**

`scripts/site-v2-quadros.mjs` nos dois lados, nos dois navegadores e nas duas larguras para `caixa-do-condominio` (`/previa-v2/garante` × `/garante.html`), `percurso` (`/previa-v2/incorporadoras` × `/incorporadoras.html`) e `mes` (`/previa-v2/tecnologia` × `/tecnologia.html`); e `scripts/site-v2-toque.mjs` nas três. Expected: código 0; os quadros 0, 25, 50, 75 e 100% de cada par no mesmo estado; o toque assenta em patamar.

- [ ] **Step 7: "Sou cliente" no navegador (sem CPF)**

Em Chromium e Firefox, 1440 e 390, em `/previa-v2`, `/previa-v2/contato`, `/previa-v2/blog` e `/previa-v2/nao-encontrada`: abrir pelo cabeçalho (no 390, pelo menu), pelo rodapé e pelo atalho "2ª via de boleto" do Contato (que abre direto a consulta pelo CPF com a 2ª via ligada, e o menu com ela desligada); na 404, conferir que o corpo não tem gatilho e que o cartão "Fale com a gente" leva ao Contato; conferir o painel (três opções, nenhuma de proposta), Esc e clique no fundo fechando, foco voltando ao gatilho, a página atrás sem rolar com o painel aberto. Com a 2ª via ligada no ambiente local (se `SEGUNDA_VIA_ATIVA` não estiver `true` no `.env` local, anotar que só o caminho desligado foi visto; não alterar `.env`), abrir a tela do CPF e parar ali. No Network, nenhum POST de Server Action. Com JavaScript desligado, o gatilho é o link `wa.me` com `data-wa-caminho="cliente"` (conferir no HTML).

- [ ] **Step 8: Medição do LeadClickTracker no navegador**

Em `/previa-v2` (Chromium), com `window.gtag` substituído por um coletor (`page.addInitScript`), abrir o painel e clicar em "Atendimento ao condômino" (interceptar a navegação do `wa.me` com `page.route('https://wa.me/**', (r) => r.abort())`). Expected: o coletor recebe `triagem_whatsapp_click` com `link_section: 'triagem_cliente'` e nenhum `whatsapp_click`.

- [ ] **Step 9: Cabeçalho entre 1081 e 1240 px**

Medir como no Step 8 da 4.15, em Chromium e Firefox, em `/previa-v2`, `/previa-v2/contato` e `/previa-v2/blog`, larguras 1081, 1160, 1240 e 1440. Expected: nada fora da faixa, nada sobreposto, sem scroll horizontal.

- [ ] **Step 10: Ida e volta entre os três pacotes**

Como no Step 9 da 4.9, passando por app → landing → leitura → app: `/previa-v2` → Garante (cabeçalho) → "Fale com a gente" (contato) → Blog → voltar três vezes. Expected: contagem de `.pin-spacer` igual à do carregamento do zero em cada parada (zero nas páginas de landing e de leitura), sem erro de console; Lenis só no pacote app (`document.documentElement.classList.contains('lenis')` falso no contato e no blog).

- [ ] **Step 11: Prévia e 404 em produção simulada**

Build com `$env:VERCEL_ENV='production'; $env:VERCEL='1'`, `pnpm start -p 3200`, e:

```powershell
foreach ($u in '/previa-v2','/previa-v2/semog','/previa-v2/garante','/previa-v2/tecnologia','/previa-v2/solucoes','/previa-v2/proposta','/previa-v2/contato','/previa-v2/nao-encontrada') {
  curl.exe -s -o NUL -w "%{http_code} $u`n" "http://localhost:3200$u"
}
curl.exe -s http://localhost:3200/previa-v2/semog | Select-String -Pattern 'Não achamos|nao-encontrada' | Select-Object -First 2
curl.exe -s -o NUL -w "%{http_code} /semog`n" http://localhost:3200/semog
curl.exe -s -o NUL -w "%{http_code} /prestacao-de-contas-condominio`n" http://localhost:3200/prestacao-de-contas-condominio
```

Expected: `404` em todas as da prévia, com o HTML da 404 nova (o `Select-String` acha "Não achamos"); `200` em `/semog` e em `/prestacao-de-contas-condominio` (produção intocada antes da virada). Remover as duas variáveis, encerrar o servidor e voltar ao build normal. Não abrir formulário neste servidor.

- [ ] **Step 12: Os 308 da virada por `curl`, numa cópia descartável (implementador)**

Feito pelo implementador, antes do verificador começar, com a saída inteira gravada em `…\v4b\redirects.txt`; o verificador lê esse arquivo, confere que a cópia foi apagada e que a WT ficou intacta (Step 14), e não edita nada. A cópia sai de `git archive` (arquivos do `HEAD`, sem `.git`), e não de `git worktree add`, que registraria estado no repositório que outras sessões usam.

```powershell
$v4b = 'C:\Users\lekoc\AppData\Local\Temp\claude\C--Users-lekoc-semogapp-semogsite\fce07e0d-ce5a-4a7f-a870-a8cface08e2b\scratchpad\v4b'
$copia = "$v4b\copia-virada"
New-Item -ItemType Directory -Force $copia | Out-Null
git -C C:\Users\lekoc\semogapp\semogsite-site-v2 archive --format=tar -o "$v4b\copia-virada.tar" HEAD
tar -xf "$v4b\copia-virada.tar" -C $copia
cd $copia
pnpm install --offline
(Get-Content src\site\inventario.ts -Raw) -replace 'export const VIRADA_1_FEITA: boolean = false', 'export const VIRADA_1_FEITA: boolean = true' | Set-Content src\site\inventario.ts -NoNewline
pnpm build
Start-Process -NoNewWindow pnpm -ArgumentList 'start','-p','3300'
curl.exe -s -o NUL -w "%{http_code} %{redirect_url}`n" http://localhost:3300/prestacao-de-contas-condominio
curl.exe -s -o NUL -w "%{http_code} %{redirect_url}`n" http://localhost:3300/software-de-gestao-condominial
curl.exe -s -o NUL -w "%{http_code} %{redirect_url}`n" http://localhost:3300/solucoes.html
```

Expected: `308 http://localhost:3300/tecnologia` nas duas primeiras (sem segundo salto: `curl -L -s -o NUL -w "%{num_redirects}"` = `1`); `308 http://localhost:3300/solucoes` na terceira. O build da cópia pode falhar em teste ou rota por a virada não estar feita de verdade (as rotas reais ainda são as da prévia): o que se mede aqui é só o redirect; se o `pnpm build` falhar, anotar o erro e provar os redirects pelo `loadConfig` do Next na cópia (`node -e` que importa `next/dist/server/config` e imprime `redirects()`), como na Task 1.3 da fase 1. Ao fim: encerrar o servidor e apagar a cópia e o `.tar` com `Remove-Item -LiteralPath $copia, "$v4b\copia-virada.tar" -Recurse -Force` (caminho absoluto conferido antes, só estes dois).

- [ ] **Step 13: Metadados por URL, contra o site no ar**

Run: `node scripts/site-v2-comparar-metadados.mjs --depois http://localhost:3100 --saida …\v4b\metadados.json` (contra o build normal do Step 4). Expected: código 0; as páginas institucionais da prévia com o mesmo `<head>` do site no ar (title, description, canonical, og, JSON-LD); diferenças só as já explicadas da fase 3 e o título do Contato (`TITULO_DO_CONTATO`, sem a promessa de WhatsApp, decisão de 16/10/2026). Este é o único acesso fora do `localhost` (GET de leitura no site público).

- [ ] **Step 14: Sem JavaScript e produção intocada**

Contexto sem JS nas dez páginas, 1440 e 390: texto inteiro no HTML, nada escondido; proposta e contato com o aviso de telefones no lugar do formulário. `git status --short` limpo; `node scripts/site-v2-institucional.mjs … --pagina home` de novo depois do Step 12, para garantir que a cópia descartável não tocou a WT.

- [ ] **Step 15: O que vai ao Leandro**

Juntar, num pacote só, os quadros de `/solucoes` (1440 e 390, todas as seções), da 404 (1440 e 390) e do painel "Sou cliente" aberto (1440 e 390), com uma frase por item do que foi decidido sem protótipo (DP11, DP6, DP10), para a sessão principal publicar como Artifact e pedir o "ok" dele [A CONFIRMAR: visual da /solucoes, da 404 e do painel]. O PR 4b só fecha com esse "ok".

- [ ] **Step 16: Veredito**

Relatório com portões, contagem de testes, a tabela de achados (página, seção, navegador, largura, o que difere, print; **importante** × **menor**), o resultado de cada Step e o veredito APROVADO / APROVADO COM RESSALVAS / REPROVADO. Correção de importante volta ao implementador numa leva só, com re-verificação de escopo; ajuste pequeno depois disso, a sessão principal confere sozinha (regra de 28/09).

---

## Auto-revisão

**1. Cobertura da spec e do briefing.**

| Requisito | Tarefa |
| --- | --- |
| Home, A Semog, Gestão (spec 8, fase 4) | 4.5, 4.6, 4.7, 4.8 |
| Garante, Incorporadoras, Tecnologia (URL nova) | 4.10, 4.11, 4.12 |
| `/solucoes` mantida, portada e reescrita (spec 2 e 6; resposta do Leandro) | 4.1 (texto), 4.13 |
| Proposta, contato, 404 (spec 6; pacote landing, spec 3.1) | 4.14, 4.16, 4.18 |
| WhatsApp só para clientes, "Sou cliente" com a 2ª via e os três desfechos no WhatsApp, marca de atendimento (spec 5; Final I1 da fase 1) | 4.15, 4.16, 4.18; varredura de todo `wa.me` em `conferirPagina` (4.4) |
| `FalhaDeEnvio` sem WhatsApp | já na fase 2; o contato usa os telefones (4.16) |
| Redirects 308 das duas URLs para `/tecnologia`, sem cadeia, na virada | 4.19, prova por `curl` na 4.20 (Step 12) |
| NAP com fonte única e teste de consistência (spec 6) | 4.17 |
| Respostas do Leandro (31 pendências) | 4.1 (conteúdo), 4.6, 4.7, 4.10, 4.11, 4.12, 4.13, 4.16, 4.18; tabela DP-C |
| Guarda de termos vedados estendido às institucionais (conduz, assume, com parceiro) | 4.1 (`REDACAO_VEDADA`, conteúdo e código), `conferirPagina` (texto renderizado) |
| Pendências de prazo: tween de callback, `ctx.pronto`, cena assíncrona, `error.tsx` | 4.2 |
| Pendências de prazo: menu ao alargar, foco preso | 4.19 |
| Pendências visuais da fase 2 (vão a 390, anel do título da falha) | 4.3 |
| Metadata, canonical e JSON-LD mantidos (spec 6) | 4.4 (teste de igualdade com o catch-all), 4.20 (Step 13) |
| `/tecnologia` com OG próprio antes de entrar no sitemap | 4.4 |
| Nenhum dado inventado (números, foto, vídeo) | 4.1 (pendências que travam a virada), 4.6, 4.7, 4.12 |
| Verificação completa: quadros por cena contra o protótipo, toque, 2 browsers, 1440/390, redirects por `curl`, prévia 404 em produção simulada, nenhum envio | 4.9, 4.20 |

Sem lacuna: a fase 4 não tem tarefa de sitemap (ele só muda na virada, por `servidaComoPagina`) nem de Search Console (fase 5).

**2. Placeholders.** As portas de cena e de marcação são feitas pela receita (DP2), com arquivo de origem e de destino nomeados e os desvios listados por página; não há "TBD", "similar à tarefa N" nem passo sem código onde o código é novo. O que depende do Leandro está marcado `pendente(...)` no código e `[A CONFIRMAR]` no texto, e trava a virada.

**3. Consistência de nomes.** Conferidos entre tarefas: `caminhoNoSite`/`semPrefixoDaPrevia`/`PAGINAS_NA_PREVIA`/`PREFIXO_DA_PREVIA` (4.4 → todas); `conferirPagina`/`SecaoEsperada`/`Diferencas` (4.4 → páginas); `EsqueletoApp({ pagina, atual, temProposta, cenas })` (4.2 → 4.5–4.13); `IdPaginaApp` (`gestao`, não `administracao-de-condominios`, como `data-pagina`); `CENAS_<PAGINA>`/`CenasDa…` por página; `FormularioProposta({ classe, comEntrada, perfilInicial })` (4.3 → 4.5, 4.11, 4.14); `NumerosDaPrestacao`/`fraseDosNumerosDaPrestacao` (4.1/4.6 → 4.12); `GatilhoSouCliente`/`PainelSouCliente`/`pedirSouCliente` (4.15 → 4.16, 4.19; a 404 não usa, DP6); `CENAS_HOME`/`CenasDaHome` (4.2 → 4.5, 4.6); `VIDEO_DO_EXPERIENCE_26` (4.1 → 4.5a → 4.6); `TITULO_DO_CONTATO` (4.4 → 4.16, 4.20); `CONTATO_TO`/`destinatariosDoContato` (4.16); `REDIRECIONAMENTOS_DA_VIRADA_1`/`redirecionamentosDoSite` (4.19).

**4. Review Focus.** Cada linha tem teste na tarefa dona: WhatsApp do "Sou cliente" (4.15, testes 1 a 3; 4.20, Steps 7 e 8); ida e volta (4.2, cena assíncrona; 4.9 Step 9; 4.20 Step 10); virada com pendência (4.1, `site-v2-pendencias`); cabeçalho entre 1081 e 1240 (4.15 Step 8; 4.20 Step 9); contato com assunto fora da lista e action antiga (4.16, testes 3 e 6).

## Execução

Dois PRs para `feat/site-v2`: **4a** (4.1 a 4.9, com a 4.5a entre a 4.5 e a 4.6) e **4b** (4.10 a 4.20), na ordem; cada um fecha com a sua verificação completa. Recomendação: subagent-driven (`implementador` por tarefa, `verificador` nas 4.9 e 4.20), porque as tarefas de página dependem das interfaces da 4.1 a 4.4 e uma cena morta ou um WhatsApp contado como lead custa caro; as tarefas 4.5 a 4.8 e 4.10 a 4.13 podem correr em paralelo depois da 4.4, cada uma na própria árvore (`isolation: "worktree"`, com `pnpm install --offline` antes), porque só tocam arquivos próprios mais uma linha em `registro.ts`, `rotas.ts` e `site-v2-core-ssr` (conflito trivial de merge, resolvido na integração).

## Conflitos com a spec e o que fica [A CONFIRMAR]

Conflitos (resolvidos aqui, para o Leandro ver):

- **Pacote landing nasce na fase 4, não na 6.** A spec 3.1 diz "landing na fase 6", mas a mesma regra manda o layout nascer com a primeira página que o usa, e proposta, contato e 404 são do pacote landing e são desta fase (Tarefa 4.14).
- **404:** a spec 6 pede "`not-found.tsx` com a página do protótipo"; o Leandro pediu uma 404 nova, com links úteis e título que não afirma "não existe mais" (Tarefa 4.18). A 404 de URL desconhecida do site inteiro só muda na virada (DP10).
- **Jurídico:** a spec 2 diz "com parceiro"; a resposta do Leandro padroniza "com escritório parceiro", e o guarda passa a recusar "com parceiro".
- **Pendência que trava:** o briefing pedia teste que falhe enquanto houver valor provisório; aqui ele falha no commit da virada (DP5), para não deixar a CI da branch vermelha até os arquivos chegarem.
- **Links do cabeçalho e do rodapé na prévia** passam a abrir as páginas da prévia (DP3), o que supera a DP10 da fase 3.
- **Destino do contato:** `CONTACT_TO` deixa de ser lida e o formulário antigo também passa a mandar para `ola@` (Tarefa 4.16); só chega ao ar com a virada. Decisão do Leandro de 16/10/2026: não se sabe se o `CONTACT_TO` de produção já é `ola@`, e o Contato passa a `ola@` de qualquer forma; o checklist da fase 5 avisa a equipe que recebia o Contato na caixa antiga. Os três testes de `submit-form.int.spec.ts` que afirmavam o destino antigo mudam na 4.16.
- **Vídeo da `/experience`:** a spec 6 deixa a rota intocada; o Leandro decidiu trocar o vídeo de 2025 pelo do 26 lá e na home (DP12, Tarefa 4.5a). O arquivo entra como veio, com 19,9 MB, porque nem o plano nem o repositório têm padrão de recompressão de vídeo e a máquina não tem `ffmpeg`. Na `/experience` isso pesa pouco (`preload="none"`, só baixa no play); na home, o primeiro retrato toca em laço (`autoPlay`), e com `autoPlay` o navegador começa a baixar o vídeo já no carregamento da página, antes de a pessoa chegar à Comunidade. Decidir antes da virada se vale recomprimir (ferramenta nova, fora deste plano).
- **Foto dos sócios:** a opção marcada era a foto do palco do Superlógica Next com legenda nova; o texto livre ("a primeira foto tem todos os sócios, pode usar") vence, por decisão de 16/10/2026. A foto entra quando o Leandro salvar o arquivo (Tarefa 4.7, Step 4a); até lá a moldura mostra o selo na prévia e a virada trava. A legenda segue "Acesso fácil aos sócios. Regra da casa desde 1991.".
- **Foto da obra (Incorporadoras):** a resposta tem os dois lados (a opção marcada mantinha a legenda "Imagem ilustrativa."; o texto livre manda tirá-la). O texto livre vence, por decisão de 16/10/2026: a foto fica sem legenda e sem selo. Registrado porque a origem da foto é desconhecida e, sem a legenda, nada na página diz que ela é ilustrativa.
- **"Inadimplência zero" no `<head>`:** fica na descrição da `/solucoes` e na descrição padrão do site (usada pela home), por decisão do Leandro de 16/10/2026, embora o corpo novo diga que o Garante não zera a inadimplência. O guarda de redação só lê o texto renderizado, não o `metadata`.
- **Título do Contato:** o do site no ar promete WhatsApp; o v2 usa `TITULO_DO_CONTATO` ("telefones e endereços", sem WhatsApp), decisão de 16/10/2026. O resto do `<head>` do Contato fica igual (Tarefa 4.4).
- **`/solucoes` no rodapé:** o protótipo não lista a página; ela ganha link no rodapé (não no menu), decisão de 16/10/2026, para não perder todo link interno na virada (Tarefa 4.13).

[A CONFIRMAR]:

1. Os números da nova prestação de contas digital e a data de corte (`NUMEROS_DA_PRESTACAO`). Trava a virada (DP5).
2. A aprovação visual, na prévia, da `/solucoes`, da 404 e do painel "Sou cliente", que não têm protótipo (Tarefa 4.20, Step 15). O PR 4b só fecha com o "ok" do Leandro.

Já decidido em 16/10/2026 e fora desta lista: a foto dos sócios (só falta o Leandro salvar o arquivo), o vídeo do Experience 26 (arquivo em mãos; home e `/experience`), o destino do Contato (`ola@`, aviso no checklist da fase 5), "inadimplência zero" mantida no `<head>`, o título do Contato, `/solucoes` no rodapé, a foto da obra sem legenda, o atalho do Contato direto na 2ª via e os commits locais por tarefa. Fica para o plano da fase 5: a 404 de URL desconhecida (`global-not-found.tsx` experimental ou o catch-all chamando `PaginaNaoEncontrada`, DP10).
