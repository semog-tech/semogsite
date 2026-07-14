import type { Block } from 'payload'

/**
 * Fiel à `.values-strip` de `_reference/index.html:541-548`: a faixa de
 * valores em marquee infinito ("TRANSPARÊNCIA / RETIDÃO / DINÂMICA"). `items`
 * é a lista de valores; `separator` é o divisor entre eles (default "/").
 *
 * `variant: 'ticker'` troca `.values-strip` por `.g-ticker`, fiel a
 * `.g-ticker` de `_reference/garante.html:105-112` (estilo inline da própria
 * página) — o marquee curto "100% DA ARRECADAÇÃO / TODO MÊS / SEM SUSTO" do
 * hero de `/garante`. Padding/tipografia levemente mais compactos que a
 * faixa da home; sem "/" visível no ref (usa `&nbsp;` como espaçador — passe
 * `separator` com espaços/nbsp, não "/", para reproduzir isso).
 */
export const valuesMarqueeBlock: Block = {
  slug: 'valuesMarquee',
  interfaceName: 'ValuesMarqueeBlock',
  fields: [
    {
      name: 'variant',
      type: 'select',
      options: ['values', 'ticker'],
      defaultValue: 'values',
    },
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
