# semogsite

Site institucional da Semog (`www.semog.com.br`): Next.js 16 + React 19 na Vercel, páginas
estáticas lidas de `content/`, e Postgres (Supabase, schema `cms`) só para o que o site grava
(leads, cliques de WhatsApp, QR). O site existe para gerar lead de síndico; SEO e Google Ads
são os canais que trazem esse lead, então regressão de indexação, de tag ou de formulário custa
dinheiro mesmo com a build verde.

## Comandos

```bash
pnpm install --frozen-lockfile
pnpm dev                                   # http://localhost:3000
pnpm exec biome ci ./src ./tests ./scripts # lint + format, só verifica (é o que a CI roda)
pnpm check                                 # Biome com --write: corrige, não serve de verificação
pnpm exec tsc --noEmit
pnpm check:server-actions                  # nenhum export de tipo em módulo 'use server'
pnpm test:int                              # Vitest em jsdom, sem banco
pnpm test:e2e                              # Playwright; sobe o `pnpm dev` sozinho
pnpm build
```

A CI (`.github/workflows/ci.yml`) roda os cinco portões acima, menos o e2e. Rode o
`pnpm test:e2e` na máquina quando mexer em página, formulário, hero ou 2ª via. Localmente ele usa
no máximo 2 workers de propósito: com mais, o teste de orçamento de bytes do vídeo do hero falha.

## Armadilhas

- **`'use server'`**: módulo com essa diretiva não exporta tipo. O TypeScript apaga o tipo, o
  Next o registra como Server Action e o módulo quebra na primeira submissão, com tsc, Vitest e
  build verdes. Já derrubou os formulários por 12 dias; o `check:server-actions` existe para isso.
- **Indexação**: produção roda com `SITE_ALLOW_INDEX=true` e não há `noindex` global. Página
  interna ou utilitária (`(interno)/desfecho`, `styleguide`, rotas de QR) declara `robots`
  explicitamente. Sem a variável (preview, CI, local) tudo sai `noindex` por `X-Robots-Tag`, e
  isso não é bug.
- **CSP** em `next.config.ts`: script ou pixel de terceiro (GTM, Google Ads, RD, Clarity) só
  funciona com o host nas diretivas certas, e host de coleta entra em `connect-src` e `img-src`.
  Bloqueio de CSP é silencioso: a conversão simplesmente para de chegar.
- **Consentimento (LGPD)**: tag de analytics e de marketing só carrega depois do aceite da
  categoria (`src/lib/consent.ts`, `src/lib/adsConsent.ts`).
- **Preview usa o banco de produção.** Formulário enviado num Preview da Vercel vira lead real e
  pode seguir para CRM e e-mail. O `webServer` do `playwright.config.ts` zera `DATABASE_URI`,
  SendGrid, `CONTACT_TO` e Exact para o e2e não gravar; integração nova que envie algo precisa
  ser zerada ali também.
- **Conteúdo**: páginas em `content/pages/*.ts`, globais (menu, rodapé, contatos) em
  `content/site.ts`, blog em `content/blog/*.mdx`, textos legais em `content/legal/`. O Payload
  saiu em jul/2026; README, `docs/DEV.md` e `.env.example` ainda o citam (`pnpm migrate`, S3,
  `DATABASE_URI_DIRECT`), e essas partes estão obsoletas.
- `_reference/` é o site estático original, congelado como referência. Não edite.

## Banco

Não há ferramenta de migração. Mudança de schema vai em `db/<data>-<nome>.sql` com o par
`.down.sql`, escrita para rodar de novo sem estrago, aplicada à mão **antes** do deploy do código
que depende dela e conferida no `information_schema`/`pg_proc`. Dois papéis não se misturam:
`cms_user` (a `DATABASE_URI` do site, dono de `cms.leads`) e `postgres` (fachadas que leem o
schema `commercial` do semogapp). Cada arquivo abre com uma guarda que aborta se o papel
conectado for o errado; algumas fachadas exigem que a migração do semogapp exista antes. Ordem e
papel de cada arquivo: `docs/DEPLOY.md`, seção 3.

## Deploy e fronteiras

- Merge na `main` publica a produção: o workflow `deploy-producao.yml` chama o Deploy Hook da
  Vercel, porque o push da `main` deixou de chegar pela integração Git. O `vercel.json` desliga o
  deploy da `main` pela integração; mexer só numa das duas metades deixa a produção sem deploy ou
  com deploy em dobro.
- Os crons (`vercel.json`) sobem conversões ao Google Ads e empurram leads ao CRM; mudança neles
  mexe em dado de terceiro, e o provedor ativo do CRM vem de `CRM_PROVIDER`.
- `RD_MARKETING_API_KEY` só se liga depois de conferir no painel do RD que nenhuma automação cria
  negociação (`docs/rd-station.md`).
- Datas e fatos institucionais da Semog em texto do site vêm de
  `docs/design/cronologia-confirmada-semog.md`; não deduza de outra fonte.

## Ferramentas de agente deste repositório

- **Plugin `claude-seo`** (terceiro, MIT), habilitado em `.claude/settings.json` pelo marketplace
  git do autor. Só instala depois de confiar na pasta e aceitar a instalação. Use para auditoria
  de SEO, schema e Core Web Vitals do site publicado. Ele acrescenta um hook que, a cada edição de
  `.tsx`, roda um validador local de JSON-LD em Python; `/seo setup` cria um venv e baixa o
  Chromium fora do repositório. Extensões pagas (DataForSEO, Ahrefs etc.) não estão configuradas.
- **Skills da Vercel** em `.claude/skills/vercel-*` (ponteiros para o Codex em `.agents/skills/`):
  cópia sem alteração do upstream, registrada em `.claude/skills/UPSTREAM.md`. Não edite; para
  atualizar, copie de novo.

## Ao mexer em X, leia Y

- Deploy, variáveis de ambiente, migrações, domínio: `docs/DEPLOY.md`
- CRM (RD Station, Exact) e RD Marketing: `docs/rd-station.md` e `docs/CRM-RDSTATION-*.md`
- Decisões de desenho (remoção do Payload, home, Experience, lead para o CRM):
  `docs/superpowers/specs/`
- Por que o portão de Server Actions é do jeito que é: cabeçalho de
  `scripts/check-use-server-exports.mjs`
