import type { Block } from 'payload'

/**
 * Faixa discreta de credenciais/registros, fiel a `.creds`/`.badges` das
 * landings locais de `_reference/` (ex.:
 * `administradora-de-condominios-recife.html:420-429`): um selo por
 * registro (CRECI/UF, ABADI, SECOVI, "Desde 1991"). `title` é opcional —
 * o texto de apoio ("A Semog é registrada nos órgãos do setor...") que
 * acompanha os selos no ref.
 */
export const registrosBlock: Block = {
  slug: 'registros',
  interfaceName: 'RegistrosBlock',
  fields: [
    { name: 'title', type: 'text' },
    {
      name: 'items',
      type: 'array',
      fields: [{ name: 'label', type: 'text', required: true }],
    },
  ],
}
