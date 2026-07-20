import type { Block } from 'payload'

/**
 * Lista os posts publicados mais recentes (`getRecentPosts`) em grid de
 * cards (`.posts`/`.post`, fiel a `_reference/blog.html:169-224`). Sem
 * campos de conteúdo além de título opcional da seção e limite — os posts em
 * si vêm da collection `posts`, não deste bloco.
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
    {
      name: 'excludePost',
      type: 'relationship',
      relationTo: 'posts',
      admin: {
        description:
          'Post a excluir da grade — usar o mesmo post do campo "post" de um bloco BlogFeatured logo acima, para não duplicá-lo entre o destaque e a grade. Opcional.',
      },
    },
    {
      name: 'tightTop',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Zera o padding-top da seção (mesmo padrão de `Faq.tightTop`/`Pillars.tightTop`) — usar quando este bloco vem logo após um BlogFeatured, pra que os dois pareçam uma única seção clara contínua, fiel a `_reference/blog.html:153-226` (uma só `<section class="sec-light">` para destaque + grade).',
      },
    },
  ],
}
