import type { Block } from 'payload'

/**
 * Lista os posts publicados mais recentes (`getRecentPosts`) em grid de
 * cards. Sem campos de conteúdo além de título opcional da seção e limite —
 * os posts em si vêm da collection `posts`, não deste bloco.
 */
export const blogListBlock: Block = {
  slug: 'blogList',
  interfaceName: 'BlogListBlock',
  fields: [
    { name: 'title', type: 'text' },
    {
      name: 'limit',
      type: 'number',
      admin: { description: 'Quantidade de posts a exibir (padrão 6).' },
    },
  ],
}
