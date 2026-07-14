import type { Block } from 'payload'

/**
 * Fiel a `#prestacao` de `_reference/solucoes.html:522-555`: cabeçalho
 * (título/texto, `.sec-head`) + imagem grande (`.showcase`, o notebook com
 * a prestação de contas digital) + grade de 4 células com ícone/título/
 * texto (`.prest-grid .cell`). Sem eyebrow no ref (só h2+p), mas o campo
 * existe por consistência com os demais blocos de seção. `list[].icon` é
 * texto livre (glifo/emoji), mesmo padrão do `FeatureGridBlock` — o ref usa
 * SVGs inline por célula, mas não há biblioteca de ícones no CMS.
 */
export const prestacaoBlock: Block = {
  slug: 'prestacao',
  interfaceName: 'PrestacaoBlock',
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'title', type: 'text', required: true },
    { name: 'text', type: 'textarea' },
    { name: 'image', type: 'upload', relationTo: 'media', required: true },
    {
      name: 'list',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'icon', type: 'text' },
        { name: 'title', type: 'text', required: true },
        { name: 'text', type: 'textarea', required: true },
      ],
    },
  ],
}
