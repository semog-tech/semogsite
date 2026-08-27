/**
 * As categorias do blog — port 1:1 de `categoriesData` em `src/seed/posts.ts`
 * (fonte da verdade; conferido também contra `GET /api/categories` em
 * produção em 24/07/2026: mesmos 6 slugs/títulos, nenhuma categoria extra
 * criada via admin). Usado pela Task 3 (`src/lib/blog.ts`) pra resolver o
 * `category` (slug) de cada post pro título exibido nos cards/artigo.
 *
 * `a-semog` é a 7ª, criada em 27/08/2026 e a única que não veio do seed: as
 * seis originais são temáticas (o que o síndico precisa saber), e não havia
 * onde pôr um post sobre a própria empresa — G20 da Superlógica, Experience,
 * expansão. Enfiar isso em "Gestão" desfiguraria a categoria que mais recebe
 * busca orgânica.
 */
export interface BlogCategory {
  slug: string
  title: string
}

export const categories: BlogCategory[] = [
  { title: 'Finanças', slug: 'financas' },
  { title: 'Inadimplência', slug: 'inadimplencia' },
  { title: 'Gestão', slug: 'gestao' },
  { title: 'Convivência', slug: 'convivencia' },
  { title: 'Tecnologia', slug: 'tecnologia' },
  { title: 'Incorporadoras', slug: 'incorporadoras' },
  { title: 'A Semog', slug: 'a-semog' },
]
