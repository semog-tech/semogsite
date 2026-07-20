import type { Block } from 'payload'

/**
 * Painel de confiança (`.trust-panel` > 3 `.trust-card`), fiel a
 * `_reference/proposta.html:260-290`: cartão-foto com 4 números
 * (`.hero-card`/`.trust-stats`, fundo `hero-towers.webp` escurecido),
 * cartão de citação sobre o Semog Garante (`.trust-quote`) e cartão de
 * WhatsApp. No ref os 3 vivem numa `<aside>` fixa (`position:sticky`) ao
 * lado do formulário, dentro do MESMO grid 2-colunas de `.prop-grid`; aqui
 * (bloco novo, empilhado como todo bloco do CMS) eles renderizam como uma
 * faixa de 3 colunas abaixo do form — mesma limitação já documentada em
 * `FormEmbed` (que também não reproduz o grid do ref). Substitui o antigo
 * uso de `Benefits` em `/proposta` (que só cobria os números, sem foto e
 * sem a citação/WhatsApp).
 */
export const trustPanelBlock: Block = {
  slug: 'trustPanel',
  interfaceName: 'TrustPanelBlock',
  fields: [
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Fundo do cartão de estatísticas (`.hero-card`), escurecido por um overlay — `hero-towers.webp` no ref.',
      },
    },
    {
      name: 'stats',
      type: 'array',
      minRows: 1,
      maxRows: 4,
      admin: {
        description:
          'Os 4 números do `.trust-stats` (35 / +700 / +70 mil / 4). Números fixos, sem animação de contador — o ref não anima aqui (diferente do `Stats`/`.stats-grid` da home).',
      },
      fields: [
        { name: 'value', type: 'text', required: true },
        { name: 'label', type: 'text', required: true },
      ],
    },
    {
      name: 'quote',
      type: 'text',
      required: true,
      admin: {
        description:
          'Citação sobre o Semog Garante (`.trust-quote`), ex.: "Com o Semog Garante, a inadimplência do seu condomínio cai a zero."',
      },
    },
    {
      name: 'quoteAccent',
      type: 'text',
      admin: {
        description:
          'Trecho final de `quote` a destacar (`.trust-quote em`, cor sólida `--ice-400`, sem itálico), ex.: "cai a zero."',
      },
    },
    { name: 'quoteText', type: 'textarea', required: true },
    { name: 'whatsappTitle', type: 'text', required: true },
    {
      name: 'whatsappText',
      type: 'text',
      admin: { description: 'Texto antes do número, ex.: "Chame no WhatsApp:"' },
    },
    {
      name: 'whatsapp',
      type: 'text',
      required: true,
      admin: { description: 'Dígitos puros, usado no link `https://wa.me/<whatsapp>`.' },
    },
    {
      name: 'whatsappDisplay',
      type: 'text',
      required: true,
      admin: { description: 'Telefone formatado, ex.: "(81) 9 9999-9999".' },
    },
  ],
}
