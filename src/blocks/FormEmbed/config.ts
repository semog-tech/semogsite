import type { Block } from 'payload'

/**
 * Ponte entre uma página do CMS e os formulários client (RHF + Zod +
 * Turnstile, `src/components/forms`) — em vez de cada form virar um bloco
 * próprio, `formType` escolhe qual componente renderizar
 * (`src/blocks/FormEmbed/Component.tsx`). `eyebrow`/`title`/`text` são
 * opcionais, pro mesmo bloco servir tanto um cabeçalho completo (ex.: seção
 * "Fale conosco" no meio de uma página) quanto só o form cru.
 */
export const formEmbedBlock: Block = {
  slug: 'formEmbed',
  interfaceName: 'FormEmbedBlock',
  fields: [
    {
      name: 'formType',
      type: 'select',
      required: true,
      options: [
        { label: 'Contato', value: 'contato' },
        { label: 'Proposta', value: 'proposta' },
      ],
    },
    { name: 'eyebrow', type: 'text' },
    { name: 'title', type: 'text' },
    { name: 'text', type: 'textarea' },
  ],
}
