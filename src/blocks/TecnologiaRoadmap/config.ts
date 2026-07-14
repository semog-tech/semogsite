import type { Block } from 'payload'

/**
 * Fiel a `#tecnologia` de `_reference/solucoes.html:645-691`: cabeçalho
 * (`.sec-head`) + `.one-card` (Semog One: nome, texto e `.one-tags`) +
 * `.road` (roadmap, `.road-item`s com `.status`, um deles `.live`).
 *
 * O ref não tem imagem nessa seção — mas `_reference/guia.html:106` descreve
 * um asset dedicado (`semog-one.webp`, "monitor com o ERP Semog One") que
 * nunca chegou a ser ligado ao markup estático. `intro.image` cobre esse
 * asset: sem mídia, o card de intro renderiza igual ao ref (texto + tags
 * empilhados); com mídia (seed futuro), o card ganha um split interno
 * imagem/texto. `intro.tags[]` = `.one-tags span` (texto livre, mesmo
 * padrão de `list[].icon` do `PrestacaoBlock`/`glyph` do `PillarsBlock`).
 */
export const tecnologiaRoadmapBlock: Block = {
  slug: 'tecnologiaRoadmap',
  interfaceName: 'TecnologiaRoadmapBlock',
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'title', type: 'text', required: true },
    { name: 'text', type: 'textarea' },
    {
      name: 'intro',
      type: 'group',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          admin: { description: 'Opcional. Ex.: semog-one.webp (monitor com o ERP).' },
        },
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'textarea', required: true },
        {
          name: 'tags',
          type: 'array',
          fields: [{ name: 'label', type: 'text', required: true }],
        },
      ],
    },
    { name: 'roadmapLabel', type: 'text' },
    {
      name: 'steps',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'text', type: 'textarea', required: true },
        { name: 'status', type: 'text', required: true },
        {
          name: 'live',
          type: 'checkbox',
          defaultValue: false,
          admin: { description: 'Destaca o status como "no ar" (`.status.live`).' },
        },
      ],
    },
  ],
}
