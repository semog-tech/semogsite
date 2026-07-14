import type { Block } from 'payload'

/**
 * Fiel à `.values-strip` de `_reference/index.html:541-548`: a faixa de
 * valores em marquee infinito ("TRANSPARÊNCIA / RETIDÃO / DINÂMICA"). `items`
 * é a lista de valores; `separator` é o divisor entre eles (default "/").
 */
export const valuesMarqueeBlock: Block = {
  slug: 'valuesMarquee',
  interfaceName: 'ValuesMarqueeBlock',
  fields: [
    {
      name: 'items',
      type: 'text',
      hasMany: true,
      required: true,
      admin: { description: 'Valores exibidos na faixa (ex.: TRANSPARÊNCIA, RETIDÃO, DINÂMICA).' },
    },
    {
      name: 'separator',
      type: 'text',
      defaultValue: '/',
      admin: { description: 'Divisor entre os valores. Default "/".' },
    },
  ],
}
