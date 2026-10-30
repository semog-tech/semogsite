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
criadas → deploy → conferir as linhas novas em `cms.whatsapp_clicks` e `cms.qr_scans`.

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
`cms.leads.exact_error` e o cron `/api/cron/push-exact-leads` (diário, 07:00) retenta por 48 h.
Detalhes do contrato da API — que diverge do PDF oficial da Exact — em
`scripts/probe-exact-create-lead.ts`.

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
