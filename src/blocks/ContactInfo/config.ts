import type { Block } from 'payload'

/**
 * Três variantes escolhidas por `variant`:
 *
 * - `grid` (default) — cartões compactos, sem foto: cidade + UF + endereço +
 *   telefone por card, várias unidades numa grade. Usado no fecho de
 *   `/contato` (recapitulação das 4 unidades perto do form). Comportamento
 *   inalterado.
 * - `card` — o cartão rico `.unit-card` das landings de cidade (ex.:
 *   `_reference/administradora-de-condominios-recife.html:110-140,312-338`):
 *   foto + chip (Matriz/Filial) + `dl` de contato (endereço em 2 linhas,
 *   telefone, WhatsApp, horário) + duas ações ("Como chegar"/"Chamar no
 *   WhatsApp"). Usa `items[0]` só (o ref sempre mostra 1 unidade por
 *   página nesse padrão).
 * - `units` — a lista `.units`/`.unit` fiel a `_reference/contato.html:
 *   270-338` (estilo inline `_reference/contato.html:135-160`): TODOS os
 *   `items`, um `<article class="unit">` por unidade, foto alternando de
 *   lado (`nth-child(even)` inverte a ordem via CSS, ver `theme.css`), `dl`
 *   de contato (endereço/telefone/WhatsApp/horário) e uma única ação "Ver no
 *   mapa" (`mapsHref`). Reaproveita os MESMOS campos extras de `card`
 *   (`photo`/`chip`/`addressDetail`/`whatsappDisplay`/`hours`/`mapsHref`) —
 *   só muda como são compostos (lista alternada vs. cartão único).
 *
 * `whatsapp` é opcional e alimenta o CTA "Chamar no WhatsApp"
 * (`https://wa.me/<whatsapp>`) nas variantes `grid`/`card` — aqui os dados
 * não vêm do global `Company` (que já tem `whatsapp`, ver
 * `globals/Company.ts:21`), pois o bloco precisa funcionar sozinho em
 * qualquer página. Sem efeito em `units`, que usa só `mapsHref` por item.
 */
export const contactInfoBlock: Block = {
  slug: 'contactInfo',
  interfaceName: 'ContactInfoBlock',
  fields: [
    {
      name: 'variant',
      type: 'select',
      options: ['grid', 'card', 'units'],
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
              'Nas variantes `card`/`units`. Em `card`, selo sobre a foto (`.chip liquid-glass`), ex.: "Matriz · PE". Em `units`, texto puro acima do título (`.unit .role`, ex.: "Matriz · Pernambuco" — sem abreviar UF, fiel a `_reference/contato.html:281,296,311,326`).',
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
              'Nas variantes `card`/`units`. Telefone formatado da linha "WhatsApp" do `dl` (ex.: "(81) 9 9999-9999") — distinto do `whatsapp` do bloco (dígitos, usado no link `wa.me`).',
          },
        },
        {
          name: 'hours',
          type: 'text',
          admin: {
            description:
              'Nas variantes `card`/`units`. Linha "Horário" do `dl`, ex.: "Segunda a sexta, das 8h às 18h".',
          },
        },
        {
          name: 'mapsHref',
          type: 'text',
          admin: {
            description:
              'Nas variantes `card`/`units`. Link do CTA ("Como chegar" em `card`, "Ver no mapa" em `units`), ex.: "https://maps.google.com/?q=Semog+recife".',
          },
        },
      ],
    },
    { name: 'whatsapp', type: 'text' },
  ],
}
