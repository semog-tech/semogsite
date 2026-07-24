/**
 * Conteúdo da "Blog" (slug `blog`) — port fiel de `seedBlogPage` em
 * `src/seed/pages.ts`, fiel a `_reference/blog.html`.
 *
 * `blogFeatured`/`blogList` referenciam o post em destaque. Os posts ainda
 * vêm do Payload nesta fase (Fase 2 os migra pra MDX — ver
 * `.superpowers/sdd/redesign/cms01-task-5-brief.md`), e o tipo já aceita o
 * `BlogPostRef` completo (não só o `number` de id) — então em vez de um id
 * solto sem objeto pra resolver em runtime, fixamos aqui um snapshot fiel do
 * post "Previsão orçamentária..." (`previsao-orcamentaria-guia-sindico`),
 * consultado via `GET /api/posts` do Payload em 24/07/2026 pra pegar os
 * valores reais (id numérico do banco, categoria, etc.) — os mesmos que
 * `BlogFeaturedBlock`/`BlogListBlock` (Component.tsx) esperam já resolvidos
 * (sem fazer fetch próprio). Se o post for editado antes da Fase 2 migrar
 * os posts de vez, este snapshot precisa ser atualizado à mão.
 */
import type { BlogPostRef } from '@/types/blocks'
import type { PageData } from '@/types/content'
import { img } from '../media'

const FEATURED_POST: BlogPostRef = {
  id: 1,
  title: 'Previsão orçamentária: o guia que todo síndico deveria ler antes da assembleia',
  slug: 'previsao-orcamentaria-guia-sindico',
  excerpt:
    'Como montar um orçamento que passa na assembleia sem cortes cegos e sem sustos no meio do ano. O passo a passo que a equipe Semog usa em centenas de condomínios.',
  heroImage: img('blog-financas.webp'),
  category: { id: 1, title: 'Finanças', slug: 'financas' },
  readingTime: 11,
  publishedAt: '2026-07-14T09:00:00.000Z',
}

export const blog: PageData = {
  slug: 'blog',
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
      post: FEATURED_POST,
    },
    // `tightTop` cola esta grade na mesma seção clara do destaque acima;
    // `excludePost` tira o próprio destaque da grade.
    {
      blockType: 'blogList',
      limit: 6,
      excludePost: FEATURED_POST,
      tightTop: true,
    },
    {
      blockType: 'newsletter',
      title: 'Receba o essencial da gestão condominial.',
      text: 'Um e-mail por mês, direto da equipe que administra 650 condomínios. Sem spam.',
      placeholder: 'Seu melhor e-mail',
      buttonLabel: 'Assinar',
      successMessage: 'Inscrição recebida. Até o próximo e-mail!',
    },
  ],
}
