import type { Block } from 'payload'

/**
 * Duas variantes escolhidas por `variant`:
 *
 * - `grid` (default) — cartões compactos fiel à seção "Unidades" (`.unit`,
 *   `_reference/contato.html:270-338`): cidade + UF + endereço + telefone
 *   por card, várias unidades numa grade. Comportamento inalterado.
 * - `card` — o cartão rico `.unit-card` das landings de cidade (ex.:
 *   `_reference/administradora-de-condominios-recife.html:110-140,312-338`):
 *   foto + chip (Matriz/Filial) + `dl` de contato (endereço em 2 linhas,
 *   telefone, WhatsApp, horário) + duas ações ("Como chegar"/"Chamar no
 *   WhatsApp"). Usa `items[0]` só (o ref sempre mostra 1 unidade por
 *   página nesse padrão) e os campos extras abaixo (`photo`/`chip`/
 *   `addressDetail`/`whatsappDisplay`/`hours`/`mapsHref`), todos opcionais
 *   para não quebrar os itens já usados pela variante `grid`.
 *
 * `whatsapp` é opcional e alimenta o CTA "Chamar no WhatsApp"
 * (`https://wa.me/<whatsapp>`) nas duas variantes — aqui os dados não vêm
 * do global `Company` (que já tem `whatsapp`, ver `globals/Company.ts:21`),
 * pois o bloco precisa funcionar sozinho em qualquer página.
 */
export const contactInfoBlock: Block = {
  slug: 'contactInfo',
  interfaceName: 'ContactInfoBlock',
  fields: [
    {
      name: 'variant',
      type: 'select',
      options: ['grid', 'card'],
      defaultValue: 'grid',
    },
    { name: 'eyebrow', type: 'text' },
    { name: 'title', type: 'text' },
    {
      name: 'titleAccent',
      type: 'text',
      admin: {
        description:
          'Só na variante `card`. Trecho final de `title` a destacar em `.gx`, ex.: "em Boa Viagem." em "De portas abertas em Boa Viagem." (`_reference/administradora-de-condominios-recife.html:324`) — mesmo padrão de `FeatureGrid.titleAccent`.',
      },
    },
    {
      name: 'items',
      type: 'array',
      fields: [
        { name: 'city', type: 'text', required: true },
        { name: 'uf', type: 'text', required: true },
        { name: 'address', type: 'textarea', required: true },
        { name: 'phone', type: 'text', required: true },
        { name: 'photo', type: 'upload', relationTo: 'media' },
        {
          name: 'chip',
          type: 'text',
          admin: {
            description:
              'Só na variante `card`. Selo sobre a foto (`.chip liquid-glass`), ex.: "Matriz · PE"/"Filial · PB".',
          },
        },
        {
          name: 'addressDetail',
          type: 'text',
          admin: {
            description:
              'Só na variante `card`. Segunda linha do endereço (`<small>` dentro de `<dd>`), ex.: "Boa Viagem · Recife/PE · CEP 51011-000" — `address` vira só a 1ª linha ("Av. Conselheiro Aguiar, 1000 · Sala 501").',
          },
        },
        {
          name: 'whatsappDisplay',
          type: 'text',
          admin: {
            description:
              'Só na variante `card`. Telefone formatado da linha "WhatsApp" do `dl` (ex.: "(81) 9 9999-9999") — distinto do `whatsapp` do bloco (dígitos, usado no link `wa.me`).',
          },
        },
        {
          name: 'hours',
          type: 'text',
          admin: {
            description:
              'Só na variante `card`. Linha "Horário" do `dl`, ex.: "Segunda a sexta, das 8h às 18h".',
          },
        },
        {
          name: 'mapsHref',
          type: 'text',
          admin: {
            description:
              'Só na variante `card`. Link do CTA "Como chegar" (`.unit-actions .btn-primary`), ex.: "https://maps.google.com/?q=Semog+recife".',
          },
        },
      ],
    },
    { name: 'whatsapp', type: 'text' },
  ],
}
