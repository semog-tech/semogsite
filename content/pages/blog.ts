/**
 * Conteúdo da "Blog" (slug `blog`) — port fiel de `seedBlogPage` em
 * `src/seed/pages.ts`, fiel a `_reference/blog.html`.
 *
 * `blogFeatured.post`/`blogList.excludePost` referenciam o post em destaque
 * pelo SLUG (Task 3: os posts agora vêm de `content/blog/*.mdx`, sem id
 * numérico) — escolhido a dedo, igual ao ref (`_reference/blog.html` usa o
 * post de Finanças "Previsão orçamentária...", que nem sempre é o mais
 * recente). Sem snapshot: `BlogFeaturedBlock` resolve o post completo em
 * runtime via `getPostBySlug` (`src/lib/blog.ts`), única fonte de verdade —
 * elimina o risco de um snapshot desatualizado se o conteúdo do post mudar.
 */
import type { PageData } from '@/types/content'

const FEATURED_SLUG = 'previsao-orcamentaria-guia-sindico'

export const blog: PageData = {
  slug: 'blog',
  // Rótulo administrativo real no Payload (confirmado via GET /api/pages).
  title: 'Blog',
  meta: {
    title: 'Blog da Semog: gestão de condomínios na prática',
    description:
      'Artigos práticos sobre prestação de contas, inadimplência, assembleias e escolha de administradora, escritos por quem administra 650 condomínios.',
  },
  layout: [
    // `.page-hero` de `_reference/blog.html:37-46`: SEM `poster` — só o
    // gradiente, 46dvh, h1 sozinho (sem eyebrow/subhead/CTAs).
    {
      blockType: 'hero',
      headline: 'Quem administra 650 condomínios tem muito a compartilhar.',
      pageHeroOverlay: true,
      pageHeroMinHeight: '46dvh',
      pageHeroPaddingBottom: 'clamp(2.5rem, 5vw, 4rem)',
      pageHeroHeadlineMaxWidth: '16ch',
      pageHeroGradient:
        'radial-gradient(80% 70% at 15% 0%, rgba(42,63,150,0.45) 0%, transparent 55%), var(--grad-hero)',
    },
    {
      blockType: 'blogFeatured',
      post: FEATURED_SLUG,
    },
    // `tightTop` cola esta grade na mesma seção clara do destaque acima;
    // `excludePost` tira o próprio destaque da grade.
    {
      blockType: 'blogList',
      limit: 6,
      excludePost: FEATURED_SLUG,
      tightTop: true,
    },
  ],
}
