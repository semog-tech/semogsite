import type { Block } from 'payload'

/**
 * As 3 verticais de `_reference/solucoes.html:411-484`
 * (`.vertical.sec-light` > `.split`/`.split-media`/`.svc-tags` OU
 * `.assoc`/`.assoc-body`): residenciais e comerciais são splits
 * texto/imagem alternados (`reversed` troca o lado — comerciais tem a
 * imagem primeiro), associações quebra o zigue-zague com o tratamento
 * full-bleed (`variant: 'assoc'`, imagem + overlay + `.assoc-body` com
 * `link-arrow`). Cada item vira sua própria `<section>` (mesma
 * `border-top` de `.vertical` em todas as 3, ref não tem cabeçalho comum).
 */
export const solutionSplitBlock: Block = {
  slug: 'solutionSplit',
  interfaceName: 'SolutionSplitBlock',
  fields: [
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'variant',
          type: 'select',
          defaultValue: 'split',
          options: [
            { label: 'Split (texto + imagem)', value: 'split' },
            { label: 'Full-bleed (associações)', value: 'assoc' },
          ],
        },
        { name: 'kicker', type: 'text' },
        { name: 'title', type: 'text', required: true },
        { name: 'text', type: 'textarea' },
        {
          name: 'tags',
          type: 'array',
          admin: { description: 'Pills de serviços incluídos (.svc-tags) — só na variante split.' },
          fields: [{ name: 'label', type: 'text', required: true }],
        },
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        {
          name: 'reversed',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description:
              'Inverte o lado: imagem à esquerda, texto à direita. Só na variante split.',
          },
        },
        {
          name: 'ctaLabel',
          type: 'text',
          admin: { description: 'Link-arrow do .assoc-body — só na variante full-bleed.' },
        },
        { name: 'ctaHref', type: 'text' },
      ],
    },
  ],
}
