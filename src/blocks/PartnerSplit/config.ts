import type { Block } from 'payload'

/**
 * Split de texto puro (sem imagem) — fiel a `.g-partner` de
 * `_reference/garante.html:197-201,376-392` (estilo inline + markup da
 * própria página): h2 à esquerda (`data-reveal="left"`), parágrafo à direita
 * (`data-reveal="right"`). Distinto de `SolutionSplit`, cujas 2 variantes
 * (`split`/`assoc`) sempre carregam uma imagem — aqui não há mídia (a seção
 * "Quem garante a garantia" do `/garante`).
 */
export const partnerSplitBlock: Block = {
  slug: 'partnerSplit',
  interfaceName: 'PartnerSplitBlock',
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'text', type: 'textarea', required: true },
    {
      name: 'highlight',
      type: 'text',
      admin: {
        description:
          'Trecho de `text` a destacar em `<strong>` navy-500, ex.: "G5 Partners" (`<strong style="color:var(--navy-500);">`, `_reference/garante.html:384`).',
      },
    },
  ],
}
