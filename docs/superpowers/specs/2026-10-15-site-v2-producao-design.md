# Site v2 em produção — design

Data: 15/10/2026 · Autor: Claude, com decisões do Leandro Castro · Estado: aprovada pelo Leandro em 15/10/2026

## 1. Objetivo

Levar o protótipo aprovado do novo site da Semog (18 páginas) para o semogsite de
produção, sem perder captação, medição nem posição no Google.

O protótipo está em `design-explorations/site-v2-prototipo/` (cópia fiel do que foi
publicado no Artifact `KSCXKppybpLBvqZzNC2eAS`). Ele é a referência visual e de
comportamento: cada cena foi conferida por quadros, emendas por pixel e varredura de
telas vazias, e a régua de qualidade é a apresentação Brascon.

Critério de sucesso:
- todas as URLs atuais respondem 200 ou 308 para o destino certo;
- o pedido de proposta grava, chega ao Exact uma única vez e conta uma única conversão;
- nenhuma violação de CSP no console em produção;
- GA4 e Ads continuam medindo sem quebra de série além da documentada;
- cada página nova reproduz o protótipo (mesmos quadros nas mesmas posições de rolagem).

## 2. Decisões do Leandro (15/10/2026)

| Tema | Decisão |
| --- | --- |
| WhatsApp | **Só para clientes.** Proposta só pelo formulário. Um botão discreto "Sou cliente" mantém a 2ª via de boleto e o atendimento ao condômino. Nenhum atalho de WhatsApp para quem quer proposta. O botão de WhatsApp do anúncio (`Conversation started`) não é afetado e não deve ser removido. |
| Conversão | **GA4 na etapa 1**; **Ads e Exact pelo servidor**, juntos (ver 4.3 e 4.4). A etapa 2 vira evento separado no GA4, só para análise. Quem marca "já sou cliente" não sobe ao Ads nem ao Exact. |
| URLs antigas | **`/solucoes` é mantida** como página própria no v2 (decisão do Leandro, depois de ver o tráfego no Search Console: 8 cliques e 1.783 impressões em 90 dias). **Redirecionar** só `/prestacao-de-contas-condominio` e `/software-de-gestao-condominial` → `/tecnologia`. O conteúdo e o lugar da `/solucoes` no v2 estão pendentes (ver 9) e bloqueiam a fase 4. |
| Virada | **Duas viradas**: (1) site institucional, blog, proposta e contato; (2) as 4 landings de cidade, separada, no início de um ciclo do Ads. |

Decisões anteriores que valem para todo o site: site claro; Saira + Barlow; canto reto e
"ponta reta, movimento no meio"; métrica áurea; animar para todos (sem reduced-motion);
nada editorial; nenhum dado inventado; jurídico sempre "com parceiro"; "validade jurídica" proibido no site novo inteiro, inclusive o blog (ver 6); ranking como
"5º entre mais de 3.500 administradoras" e "a mais bem posicionada do Norte e Nordeste".

## 3. Arquitetura

### 3.1 Como o protótipo entra no Next

Opção escolhida: **HTML no servidor + cenas vanilla num runner client.**

- **Seções** viram Server Components em TSX. O texto continua no HTML (SEO e leitura sem
  JS). Os textos saem de um módulo TS tipado (substitui `conteudo.json`); marca
  inexistente vira erro de tipo.
- **Cenas** (`init(ctx)` do protótipo) são portadas quase sem mudança e montadas por um
  único `RunnerDeCenas` client, que usa `useGSAP` (`@gsap/react`) como mecanismo de
  montagem: um `gsap.context` por seção, `revert` no unmount. Falha de cena chama
  `Sentry.captureException` e a seção segue em HTML estático.
- **O `core/` é montado por `montarPagina`, chamada pelo `RunnerDeCenas`**, com desmonte
  explícito (Lenis `destroy`, ticker, listeners, observers). Não é um provider: no React o
  efeito da página roda antes do efeito do layout, então o core só pode ser montado de dentro
  do runner. O protótipo pressupõe um documento novo por página.
- **Links internos são `<a>` comuns**, não `<Link>`: cada página carrega do zero, que é
  a premissa do core (topo, âncoras, pins medidos do zero). Prefetch e transição client
  ficam para depois, quando o teardown estiver provado em ida e volta.
- **Layout raiz próprio `(site)`**, separado do `(frontend)` atual. Navegar entre layouts
  raiz faz carga completa, então `theme.css` antigo e os estilos novos nunca coexistem.
  Três layouts aninhados reproduzem os três pacotes (cada um nasce com a primeira página que o usa: `app` na fase 1, `leitura` na fase 3, `landing` na fase 6; layout sem página é código morto):
  - **app** (home, A Semog, Gestão, Garante, Incorporadoras, Tecnologia): Lenis + runner;
  - **landing** (cidades, proposta, contato, 404): sem Lenis, sem pin, carga mínima;
  - **leitura** (blog, posts, privacidade, termos): sem JS de cena.
- **Fontes** por `next/font/local`: Saira variável e Barlow 300–600. Se `unicode-range`
  por arquivo não for suportado, usar só o subset latin (cobre o pt-BR).
- `<html>` com `suppressHydrationWarning` por causa da troca `sem-js` → `js`.

Descartadas: reescrever as cenas em React (custo alto, risco visual, nenhum estado
React a ganhar) e servir o HTML estático fora do Next (perde Server Action, metadata,
consentimento, medição e a CI).

### 3.2 Rolagem por toque (celular)

No celular, o gesto de arrastar tem inércia e atravessa os patamares de leitura das cenas
presas (relato do Leandro, 15/10/2026). Em dispositivos de toque, e só neles (`ScrollTrigger.isTouch === 1`):
- `ignoreMobileResize` e unidades `svh`, para a barra de endereço não redimensionar os pins;
- snap direcional nos patamares de cada pin (helper único no core, pontos derivados do
  roteiro de cada cena), com `inertia: false`.
Desktop com mouse fica como está.

Descartados, depois de medidos no protótipo: `normalizeScroll` (encurta flicks rápidos de 5–6
para 3 patamares e pesa na página toda) e `syncTouch` do Lenis (vira "um gesto = um passo",
scroll-jacking). Validado pelo Leandro no celular em 15/10/2026.

### 3.3 Guardas que saem do build do protótipo para a CI

O `build.mjs` do protótipo barrava hex fora do `:root`, `border-radius` ≠ 0, `uppercase`,
serifa e `stroke-linecap` ≠ butt. Isso vira teste Vitest sobre os CSS do site novo, para
continuar travado na CI. O guarda de termos vedados (ex.: "validade jurídica") varre também o
conteúdo do blog, não só as páginas institucionais.

## 4. Formulário de proposta em duas etapas

### 4.1 Campos

- **Etapa 1:** nome do condomínio; estado (UF, com PE, PB e PA no topo); telefone com
  DDD (DDD de 2 dígitos + 8 ou 9 dígitos); e-mail opcional.
- **Etapa 2:** seu nome; você é (síndico, conselheiro, morador, construtora); cidade;
  nº de unidades (aprox.); já é cliente Semog.
- `?perfil=construtora` pré-marca a etapa 2. Landings pré-selecionam a UF da cidade.

### 4.2 Gravação: uma linha por lead

Migração em `cms.leads`, rodada pela conexão da aplicação (`cms_user`), **antes** do
código que a usa, e testada com INSERT real em transação revertida:
- `etapa smallint` (1 ou 2) e `token_envio uuid unique`.

Fluxo:
1. **Etapa 1** → Turnstile + rate limit → `INSERT` com `form='proposta'`, `etapa=1`,
   `data.variante='duas-etapas'`, atribuição como hoje. O token volta num **cookie
   HttpOnly** (mesmo padrão da 2ª via), nunca o id.
2. **Etapa 2** → valida o cookie (uso único, validade curta, ex. 30 min) no lugar de um
   segundo Turnstile → `UPDATE … SET data = data || $novo, etapa = 2 WHERE token_envio = $t
   AND etapa = 1`. Nunca um segundo INSERT.
3. **Token perdido** (outra aba, cookie limpo, deploy no meio): a etapa 2 grava uma linha
   nova completa. Aceita-se a duplicata; perder o lead é pior.

Schema Zod novo para as duas etapas, ao lado do atual. `submitForm('proposta')` e
`submitPropostaRapida` continuam funcionando até a virada estar estável (uma aba aberta
antes do deploy chama o ID de action antigo).

Regras que não mudam: o arquivo `'use server'` só exporta função async (portão
`check:server-actions`); falha de gravação nunca é silenciosa (try/catch + tela de falha
+ `Sentry.captureException` no servidor, que hoje não existe).

### 4.3 Depois da gravação

- **Exact: uma vez só.** Etapa 2 concluída → envio na hora, como hoje. Só etapa 1 → o
  cron envia depois de ~45 min sem a etapa 2, com "parcial: só etapa 1" na descrição.
  Critério do cron ganha `and (etapa is null or etapa = 2 or created_at < now() - interval '45 minutes')`.
  Motivo: o Exact não deduplica e a atualização de card nunca foi testada.
  **Lead com `etapa` nula** (formulário antigo e assunto "proposta comercial" do contato) não
  tem segunda etapa: continua indo ao Exact na hora, como hoje, e o cron o trata como completo,
  sem esperar os 45 min.
- **E-mail interno: um só**, no mesmo momento do envio ao Exact, roteado pela UF
  (PE → Recife, PB → comercial PB, PA → Belém, outros → os três).
- **"Já é cliente = sim":** não vai ao Exact como lead nem sobe ao Ads; o e-mail interno
  avisa que é cliente. Como o cliente só se identifica na etapa 2, o GA4 já terá disparado
  `generate_lead` na etapa 1: aceita-se esse pequeno ruído de clientes no GA4.
- **Mapeamento Exact:** `name` = nome do condomínio; região pela cidade da etapa 2 (na
  etapa 1 só a UF — PB não distingue João Pessoa de Campina Grande); unidades, papel e
  "já é cliente" na `description` (a API v3 não grava campo personalizado).

### 4.4 Medição

- **GA4:** `generate_lead` na etapa 1 (`form:'proposta'`, `variante:'duas_etapas'`),
  preservando a série e o evento-chave. Etapa 2 → evento novo `lead_qualificado`, não
  marcado como chave.
- **Ads:** a conversão sai pelo **servidor**, junto com o envio ao Exact e no mesmo momento:
  na hora, se a etapa 2 chegar; ou após ~45 min, só com a etapa 1. A linha de `cms.leads` sobe
  uma vez (`transactionId = lead-<id>`). Quem marcou "já sou cliente" não sobe. Corrigir o uso só do gclid de first-touch: usar first ou last, como
  o beacon do WhatsApp já faz.
- **Quebra de série esperada:** com o WhatsApp de proposta fora do site, cliques de
  WhatsApp caem e o formulário deve subir. Registrar a data da virada no diário do Ads.

## 5. WhatsApp "só para clientes"

- Sai: o caminho "Quero proposta" da triagem, a proposta curta (`PropostaRapidaForm`) e
  todos os links `wa.me` de proposta no conteúdo, nas cidades e no fallback de erro do
  formulário.
- Fica: um botão discreto "Sou cliente", com a 2ª via (fluxo atual: CPF, código por
  e-mail, boletos) e o atendimento ao condômino pelo WhatsApp, inclusive os três casos
  em que a 2ª via termina no WhatsApp.
- `FalhaDeEnvio` passa a oferecer telefone da Unidade e reenviar, em vez do WhatsApp.
- Ads: a ação "WhatsApp (servidor)" deixa de receber cliques de proposta. Ordem segura:
  virada do front → rebaixar a ação para secundária no Ads → manter o lote do cron
  enquanto houver cliques de cliente com gclid (avaliar se ainda faz sentido contá-los).
- O botão de WhatsApp do anúncio (`Conversation started`) não é tocado.

## 6. Rotas, SEO e redirecionamentos

| Rota | Destino |
| --- | --- |
| `/`, `/semog`, `/administracao-de-condominios`, `/garante`, `/incorporadoras` | mesma URL, site novo |
| `/tecnologia` | URL nova |
| `/solucoes` | **mantida**, página própria (fase 4; conteúdo pendente, ver 9). Os redirects atuais `/solucoes.html` e `/domestica` já apontam para `/solucoes`, então continuam como estão e não formam cadeia |
| `/prestacao-de-contas-condominio`, `/software-de-gestao-condominial` | 308 → `/tecnologia` |
| `/blog` e os 12 posts | mesmas URLs, modelo de leitura (o `MDXRemote` atual renderiza todos; reestilizar `PostImage`/`PostVideo`). O post `assembleia-virtual-validade-juridica` mantém o slug e ganha título e texto reescritos sem "validade jurídica" (ver abaixo) |
| `/privacidade`, `/termos`, `/proposta`, `/contato` | mesmas URLs |
| 4 landings de cidade | mesmas URLs (2ª virada) |
| 404 | `not-found.tsx` com a página do protótipo |
| `/experience`, `/qr/*`, `/desfecho/*`, `/api/*` | intocados |
| `/styleguide` | removida |

- **Post "Assembleia virtual tem validade jurídica?":** título, `meta.title` e texto reescritos na
  fase de leitura (proposta do protótipo: "Assembleia virtual vale? O que a lei permite"), sem
  afirmar nada jurídico além do que o texto já diz. **Decisão: o slug não muda.** A URL já está
  indexada e o termo vedado vale para o texto exibido; mudar o slug custaria um redirect e
  posição no Google sem ganho. O guarda de termos varre título, descrição e corpo, não o slug.
  Se o slug um dia mudar, entra 308 direto do antigo para o novo (sem cadeia).
- Os 54 redirects atuais ficam todos.
- Metadata, canonical, JSON-LD (`Organization`, `LocalBusiness` + `FAQPage` das cidades,
  `BlogPosting`) mantidos; o NAP continua com fonte única (`UNITS`), com teste de
  consistência contra os textos das páginas. As perguntas das cidades no protótipo
  passam a alimentar o `FAQPage`.
- Sitemap e OG passam a sair de um inventário de rotas do site novo (hoje dependem das
  chaves de `content/pages`, e migrar uma página a removeria em silêncio).
- Script de comparação antes/depois por URL: title, description, canonical, JSON-LD.
- Home: `[[...slug]]` vira `[...slug]` ou sai; cada slug migrado sai de `content/pages`
  para não haver duas páginas na mesma URL.

## 7. Infraestrutura

- **CSP:** o protótipo não exige mudança (sem worker, blob, eval ou host externo). Mesmo
  assim, conferir o console de produção depois de cada virada — a CSP já derrubou a
  medição duas vezes.
- **Vercel:** branch `feat/site-v2` com Preview `noindex`, sem medição e sem `EXACT_*`.
  Conferir a **Skew Protection** antes da virada (o ID da Server Action muda a cada
  build; com duas etapas a janela de risco é maior).
- **Sentry:** confirmar a org correta (`semog` no código, `leandro-semog` na memória).
- **Dependências:** `@gsap/react`, `gsap` 3.15, `lenis` 1.3.26 (mesmas versões do
  protótipo). `three` não entra (nenhuma cena usa).

## 8. Fases (um PR cada, na branch de integração)

0. **Pré-requisitos:** Search Console das 3 URLs redirecionadas; Skew Protection; org do
   Sentry; endereços/rotas faltantes (sem lista: tratados como o NAP das Unidades e a rota da 2ª via, resolvidos nas fases 3 e 4, onde o conteúdo vive).
1. **Fundação** (sem rota pública): fontes, tokens, layout `(app)` e o shell do `(site)` (os layouts `landing` e `leitura` ficam para as fases 6 e 3: layout sem página é código morto),
   `montarPagina` do core com desmonte, runner de cenas, conteúdo tipado, guardas de CSS em Vitest, teste de inventário de
   URLs e redirects.
2. **Formulários** — verificação completa (efeito externo: Exact, SendGrid, Ads):
   migração de `cms.leads`, schema e actions das duas etapas, cron do Exact, mapeamento,
   medição, cookie de etapa, Sentry no servidor, tela de falha sem WhatsApp. Envio real
   testado à mão em produção controlada (Turnstile barra navegador automatizado).
3. **Leitura:** pacote leitura (cria o layout `leitura`; o shell do `(site)` já veio na fase 1), blog com os 12 posts
   e reescrita do post de validade jurídica, guarda de termos estendido ao blog, legais,
   sitemap e OG do inventário novo.
4. **Institucional:** home, A Semog, Gestão, Garante, Incorporadoras, Tecnologia,
   `/solucoes` (mantida, conteúdo pendente), proposta, contato, 404, WhatsApp "só para clientes", redirects das 2 URLs que saem.
5. **Virada 1:** merge na `main`. Depois: `curl` de cada URL do inventário (200/308 certo), `curl /previa-v2` = 404 em produção (a rota é decidida no build por `VERCEL_ENV`; [A CONFIRMAR] que as System Environment Variables estão expostas ao build),
   console sem violação de CSP, sitemap reenviado no Search Console, primeiro lead real
   conferido no banco, no Exact e no Ads.
6. **Virada 2:** o layout `landing` e as 4 landings, no início de um ciclo do Ads; rollback = revert.
7. **Limpeza:** blocos antigos, `theme.css`, Clash/Satoshi, `LenisProvider` antigo,
   protótipo local do Codex (`/nova-semog`), e a nota do AGENTS.md sobre o Playwright.

Verificação proporcional ao risco: rodada completa com verificador separado e navegador
em Chromium e Firefox nas fases 2, 4 e nas viradas; uma rodada final por PR.

## 9. Pendências de conteúdo (não bloqueiam a fundação)

Confirmar com o Leandro antes da fase 4:
- **[A CONFIRMAR] `/solucoes`:** conteúdo e lugar da página no site v2 e se entra no menu. O protótipo não tem essa página e o cabeçalho e o rodapé da fase 1 não a listam. Bloqueia a fase 4.
- Garante: o que acontece sem acordo; como o 1% aparece na prestação; prazo mínimo e
  fidelidade; "sem taxa de adesão".
- Tecnologia: o que é o "boleto inteligente".
- Blog: "a Semog conduz até o registro em cartório" (regra: assessora, não assume). O título
  do post de assembleia virtual está decidido (ver 6).
- Textos já corrigidos no protótipo em 15/10/2026: Gestão diz que a Semog "assessora" (não
  "assume"); o chatbot de 2019 é um marco sem "primeiro do Brasil/do mercado".
- Gestão: "orçamentos de fornecedores comparados" e "relação direta com os sócios".
- Fotos reais: sócios e equipe (A Semog); origem da foto da obra (Incorporadoras); logos
  de construtoras com autorização.
- Textos novos marcados no protótipo (`TEXTO-NOVO`) e a citação da Ana Cláudia.

## 10. Riscos

| Risco | Mitigação |
| --- | --- |
| Captação quebrar em silêncio (já aconteceu por 12 dias) | portão `check:server-actions`, Sentry no servidor, invocação real da action no build, primeiro lead conferido nos três destinos |
| Lead duplicado no Exact | um envio só, com espera para a etapa 2; idempotência por `exact_lead_id` |
| Conversão contada duas vezes | uma linha por lead (upsert) e `transactionId` por linha |
| Perder posição no Google | URLs mantidas, redirects 308 diretos, comparação de metadata por URL, sitemap do inventário |
| Queda de contatos sem o WhatsApp de proposta | botão do anúncio continua; etapa 1 curta salva o telefone; acompanhar formulário + `Conversation started` nas primeiras semanas |
| Vazamento de listeners/pins | links `<a>` (carga completa) e teardown testado em ida e volta |
