# Migração Semog → Next.js + Payload na Vercel — Design

**Data:** 2026-07-12
**Status:** Aprovado para planejamento
**Repo:** `semogsite` (transformação in-place)

## 1. Contexto e objetivo

O site institucional da Semog (Administradora de Condomínios, líder do Nordeste) existe hoje
como **16 páginas HTML estáticas** (~7.200 linhas) com design system próprio em CSS
(`assets/css/semog.css`, tema "Noite Institucional"), motion via GSAP + ScrollTrigger + Lenis
(vendorizados), fontes Clash Display + Satoshi (Fontshare), imagens WebP e 2 vídeos pesados
gerados por IA, e SEO rico (JSON-LD, OG, sitemap, robots). Os formulários (contato, proposta)
ainda não têm backend.

**Objetivo:** migrar para uma aplicação **Next.js 15 + Payload CMS 3** na Vercel, com o site
inteiro editável via CMS (page builder por blocos), rewrite total em Tailwind v4, formulários
funcionais com envio de e-mail, e a stack de produção "redonda" (SEO, performance, observabilidade,
consentimento LGPD, previews).

## 2. Decisões travadas

| Decisão | Escolha | Motivo |
|---|---|---|
| Framework | Next.js 15 (App Router, React 19) | Requisito do Payload 3; nativo na Vercel |
| CMS | Payload 3 embutido no app Next | Sem serviço separado; roda serverless na Vercel |
| Banco | Supabase Postgres (`@payloadcms/db-postgres`) | Escolha do usuário; usar connection string do **pooler** em serverless |
| Uploads | Supabase Storage (S3-compat) via `@payloadcms/storage-s3` | FS da Vercel é read-only; coerência com o banco |
| Estilo | Tailwind v4 (rewrite total), tokens do `semog.css` → `@theme` | Escolha do usuário |
| Fontes | Clash Display + Satoshi self-hosted (`next/font/local`) | Remove request externo ao Fontshare, melhora LCP |
| Motion | GSAP + ScrollTrigger + Lenis como client components | Port fiel 1:1; respeitar `prefers-reduced-motion` |
| E-mail | React Email (templates) + SendGrid (`@sendgrid/mail`) | SendGrid já é do usuário |
| Formulários | Payload Form Builder + RHF + Zod + Server Actions | Editável no admin + UX/validação tipada no cliente |
| Anti-spam | Cloudflare Turnstile | Verificação server-side antes de gravar/enviar |
| Rate limit | Nos endpoints de formulário | Barra flood/abuso além do bot |
| Imagens | next/image (Image Optimization da Vercel) | — |
| Rendering | ISR + on-demand revalidation | Publicar no admin atualiza o site sem rebuild |
| Social cards | Vercel OG Image (`next/og`) dinâmico | Card a partir dos dados do Payload |
| SEO | Metadata API + `plugin-seo` + JSON-LD + 301 dos `.html` | Preservar ranking dos URLs indexados |
| Observabilidade | Sentry (`@sentry/nextjs`) | Client + server + edge |
| Consentimento | Banner LGPD real (bloqueia scripts até aceite) | Categorias granulares; editável em `SiteSettings` |
| CWV | Vercel Speed Insights + Web Analytics | Medição de campo + táticas de LCP/CLS/TBT |
| Erros | `not-found`, `error`, `global-error`, `loading` | Branded, reportando ao Sentry |
| Lint/format | Biome | Substitui ESLint + Prettier |
| CI | GitHub Actions: Biome + typecheck + `payload generate:types` | Trava antes de merge/preview |
| Segurança | Security headers + CSP baseline | Middleware/next.config |
| Migrations | Fluxo `payload migrate` versionado | Schema Postgres não quebra deploy |
| Deploy | Vercel + Preview Deployments por branch/PR | Draft/live preview do Payload nos previews |
| Gerenciador | pnpm | Recomendação do Payload |

## 3. Estrutura do repositório (in-place)

O site estático atual vai para `_reference/` (congelado, gabarito de diff visual). O app Next
fica na raiz.

```
semogsite/
├─ _reference/                    # HTML/CSS/JS atuais, congelados p/ comparação
├─ src/
│  ├─ app/
│  │  ├─ (frontend)/              # site público: [[...slug]], blog, layout,
│  │  │                           #   sitemap.ts, robots.ts, opengraph-image,
│  │  │                           #   not-found/error/global-error/loading
│  │  └─ (payload)/               # admin + API do Payload (gerado)
│  ├─ blocks/                     # biblioteca de blocos (schema + componente React)
│  ├─ collections/                # Pages, Posts, Categories, Media, Users
│  ├─ globals/                    # Header, Footer, Company, SiteSettings
│  ├─ components/                 # UI em Tailwind (Button, Section, Nav…)
│  ├─ motion/                     # LenisProvider, hooks GSAP/ScrollTrigger
│  ├─ emails/                     # templates React Email
│  ├─ lib/                        # sendgrid, turnstile, storage, revalidate,
│  │                              #   sentry, rate-limit, consent
│  ├─ providers/                  # ConsentProvider, etc.
│  └─ payload.config.ts
├─ public/                        # favicon, og estáticos (vídeos vão pro Storage)
├─ biome.json · next.config.ts · sentry.*.config.ts · .env.example
└─ docs/superpowers/specs/…       # este documento
```

## 4. Modelagem no Payload (site inteiro no CMS)

**Collections:**
- `Pages` — page builder por blocos, com `slug`, draft/publish, **versões** e **live preview**.
- `Posts` + `Categories` — blog.
- `Media` — uploads → Supabase Storage; tamanhos responsivos gerados.
- `Users` — administradores.
- `Forms` / `FormSubmissions` — do `plugin-form-builder`.

**Globals:**
- `Header` — navegação.
- `Footer` — links, contatos.
- `Company` — endereços, telefones, registros (CRECI/ABADI/Secovi) das unidades (hoje placeholders).
- `SiteSettings` — SEO default, redes, textos do banner de consentimento, scripts.

**Biblioteca de blocos** (extraída das seções existentes): Hero-vídeo, Stats/números,
Grid de features, Cards de serviço, Semog Garante, Depoimentos, Faixa CTA, FAQ,
Strip de registros/selos, Blocos das landings por cidade, Lista de blog, Rich text.
As 16 páginas viram composição desses blocos.

**Plugins:** `plugin-form-builder`, `plugin-seo`, `plugin-redirects`, `plugin-nested-docs`.

## 5. Formulários + e-mail + Turnstile (fluxo)

1. Front renderiza o formulário (definido no admin) com **React Hook Form + Zod** e o widget **Turnstile**.
2. Submit → **Server Action** valida com o **mesmo schema Zod** no server.
3. A action **verifica o token Turnstile** (siteverify da Cloudflare) e aplica **rate limit**.
4. Passou → cria o `FormSubmission` no Payload (salvo no banco).
5. Hook `afterChange` → **SendGrid** dispara 2 e-mails **React Email**:
   (a) notificação interna para a equipe; (b) confirmação/auto-reply para o lead.
6. Falha de Turnstile / rate limit / SendGrid é tratada e reportada no front (e no Sentry).

## 6. Performance / SEO / Vercel

- **ISR:** hook do Payload chama `revalidatePath`/`revalidateTag` ao publicar → site atualiza sem rebuild.
- **Imagens:** WebP em `next/image`; `priority` no LCP. **Vídeos** (hero ~10MB, garante ~7MB) no
  Supabase Storage, servidos via `<video>` com `poster` webp (não passam por next/image).
- **Fontes:** self-hosted, `preload` + `font-display: swap`.
- **Motion:** GSAP/Lenis inicializam no idle/interação e respeitam `prefers-reduced-motion`.
- **CLS:** tudo dimensionado; reserva de espaço.
- **CWV:** Vercel Speed Insights + Web Analytics ligados.
- **SEO automático:** `generateMetadata` por página (fallback do conteúdo), `sitemap.ts`/`robots.ts`
  das páginas publicadas, JSON-LD por tipo (Organization/LocalBusiness/Article), OG dinâmico.
- **301 dos `.html`:** redirects dos URLs antigos (`/index.html`, `/administradora-de-condominios-*.html`…)
  para as rotas limpas novas via `plugin-redirects` + `next.config`.
- **Segurança:** security headers + CSP baseline (compatível com Turnstile/Sentry/consentimento).

## 7. Entrega em fases

**Fase 0 — Fundação ("deixa tudo pronto"):**
App Next + Payload rodando; Supabase (banco + storage) conectado; Tailwind com os tokens; fontes;
Biome; motion provider; React Email + SendGrid; Turnstile + rate limit; RHF/Zod/Server Actions;
plugins do Payload; biblioteca de blocos (schemas + componentes); Sentry; banner LGPD; páginas de erro;
config Vercel (env documentadas, ISR, OG, sitemap/robots, security headers, previews); CI; workflow de
migrations; **home portada 1:1 como implementação de referência**.

**Fase 1 — Migração de conteúdo (padrão repetível):**
Portar as outras 15 páginas compondo os blocos; migrar imagens para Media e vídeos para Storage;
semear o conteúdo atual no Payload; aplicar os 301; passo de acessibilidade (WCAG).

## 8. Configuração pós-migração (fora do escopo de código da Fase 0)

Depois do deploy, plugar os MCPs de Google para as configurações finais de marketing/analytics:
- **Google Search Console** — verificar propriedade, submeter `sitemap.ts`, acompanhar indexação.
- **Google Tag Manager** — carregado condicionalmente pelo `ConsentProvider` (só após consentimento).
- **Google Ads** — conversões (formulários) e remarketing.
- Outros conforme necessidade.
(Registrado também na memória do repo: `pending-google-mcps-config`.)

## 9. O que o usuário precisará fornecer (depois)

Credenciais em `.env` (haverá `.env.example`): connection string do Supabase (pooler + direta para
migrations), chaves S3 do Supabase Storage + bucket, `PAYLOAD_SECRET`, `SENDGRID_API_KEY` + remetente
verificado, `TURNSTILE_SITE_KEY`/`SECRET_KEY`, `SENTRY_*`, e env de preview.

## 10. Riscos / atenção

- Supabase serverless exige a connection string do **pooler** (senão estoura conexão).
- Turnstile não é nativo do Form Builder → verificação adicionada na camada de submit.
- Rewrite total em Tailwind tem risco de **drift visual** → `_reference/` mantido para diff lado a lado.
- Vídeos pesados não devem ser servidos pelo build da Vercel → Storage + poster.
- Migrations do Postgres precisam ser versionadas antes de cada deploy que muda schema.
