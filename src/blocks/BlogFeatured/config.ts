import type { Block } from 'payload'

/**
 * Post em destaque (`.featured`), fiel a `_reference/blog.html:156-166`: um
 * único post, escolhido a dedo (não "o mais recente" — o ref usa o post de
 * Finanças "Previsão orçamentária...", que nem sempre é o último publicado),
 * renderizado em card grande de 2 colunas (imagem + corpo) acima da grade
 * `BlogList`. `post` é uma relação direta em vez de um filtro automático:
 * dá controle editorial de qual post vira destaque, e permite ao `BlogList`
 * ao lado excluí-lo da grade via seu próprio campo `excludePost` (ver
 * `BlogList/config.ts`) — sem isso, o mesmo post apareceria duas vezes.
 */
export const blogFeaturedBlock: Block = {
  slug: 'blogFeatured',
  interfaceName: 'BlogFeaturedBlock',
  fields: [
    {
      name: 'post',
      type: 'relationship',
      relationTo: 'posts',
      required: true,
      admin: {
        description:
          'Post exibido em destaque (card grande, 2 colunas). Dica: exclua este mesmo post da grade abaixo via o campo "excludePost" do bloco BlogList, para não duplicar.',
      },
    },
  ],
}
