import type { Block } from 'payload'

/**
 * Faixa discreta de credenciais/registros, fiel a `.creds`/`.badges` das
 * landings locais de `_reference/` (ex.:
 * `administradora-de-condominios-recife.html:420-429`): um selo por
 * registro (CRECI/UF, ABADI, SECOVI, "Desde 1991"). `title` é opcional —
 * o texto de apoio ("A Semog é registrada nos órgãos do setor...") que
 * acompanha os selos no ref. `light`/`white` porque o ref aninha `.creds`
 * DENTRO da mesma `<section class="depo sec-light">` dos depoimentos — sem
 * essas flags a faixa renderiza no fundo escuro padrão, uma banda escura
 * indevida entre duas seções claras (mesmo padrão `light`/`white` de
 * `Faq`/`FeatureGrid`/`Pillars`; default `false` preserva qualquer uso
 * futuro sem seção clara ao redor).
 */
export const registrosBlock: Block = {
  slug: 'registros',
  interfaceName: 'RegistrosBlock',
  fields: [
    { name: 'title', type: 'text' },
    { name: 'light', type: 'checkbox', defaultValue: false },
    {
      name: 'white',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Só com `light` ativo — troca `.sec-light` por `.sec-light white`.' },
    },
    {
      name: 'items',
      type: 'array',
      fields: [{ name: 'label', type: 'text', required: true }],
    },
  ],
}
