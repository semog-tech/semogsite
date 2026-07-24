import type { Block } from 'payload'

/**
 * Grid de depoimentos fiel a `.depo-card`/`.depo-grid`, visto nas páginas de
 * cidade do ref (ex.: `_reference/administradora-de-condominios-recife.html`,
 * seção "DEPOIMENTOS (claro)"): citação em destaque + autor/papel. `org`,
 * `city`, `rating` e `photo` são todos opcionais — um depoimento só com
 * `quote`/`author`/`role` (o que as landings de cidade têm hoje) continua
 * renderizando normalmente, com a inicial do autor como avatar. `logos` é a
 * faixa de nomes/logos de clientes abaixo dos cards — usada só quando houver
 * depoimentos reais (não entra no seed da home neste plano).
 */
export const testimonialsBlock: Block = {
  slug: 'testimonials',
  interfaceName: 'TestimonialsBlock',
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'title', type: 'text' },
    {
      name: 'items',
      type: 'array',
      fields: [
        { name: 'quote', type: 'textarea', required: true },
        { name: 'author', type: 'text', required: true },
        { name: 'role', type: 'text' },
        { name: 'org', type: 'text', admin: { description: 'Condomínio ou empresa' } },
        { name: 'city', type: 'text' },
        {
          name: 'rating',
          type: 'number',
          min: 1,
          max: 5,
          admin: { description: 'Estrelas. Vazio = sem estrelas.' },
        },
        { name: 'photo', type: 'upload', relationTo: 'media' },
      ],
    },
    {
      name: 'logos',
      type: 'array',
      admin: {
        description:
          'Faixa de nomes/logos abaixo dos depoimentos. Sem imagem, renderiza o nome em texto.',
      },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'logo', type: 'upload', relationTo: 'media' },
      ],
    },
  ],
}
