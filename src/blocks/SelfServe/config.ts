import type { Block } from 'payload'

/**
 * "Resolva fácil" (`.selfserve`/`.ss-card`), fiel a
 * `_reference/contato.html:233-268`: cabeçalho padrão (`title`/`titleAccent`
 * em `.gx`/`text`, mesmo `.sec-head` do resto do site) + 6 links de
 * autoatendimento (2ª via de boleto, CND, acordo de pagamento, etc.) + nota
 * de apoio. Bloco novo — nenhum item do inventário anterior modelava "link
 * com seta que gira no hover" em grade. Os `href` do ref são todos `"#"`
 * (autoatendimentos que ainda não existem nesta migração, ver
 * `.superpowers/sdd/audit-blog-forms.md` §2.3) — aqui ficam editáveis, com
 * `"#"` como default de cada item pra não travar o seed nesse mesmo estado.
 */
export const selfServeBlock: Block = {
  slug: 'selfServe',
  interfaceName: 'SelfServeBlock',
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'titleAccent',
      type: 'text',
      admin: {
        description:
          'Trecho final de `title` a destacar em `.gx`, ex.: "sem esperar." em "Resolva fácil, sem esperar." (`_reference/contato.html:237`) — mesmo padrão de `FeatureGrid.titleAccent`.',
      },
    },
    { name: 'text', type: 'textarea' },
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'text', required: true },
        { name: 'href', type: 'text', required: true, defaultValue: '#' },
      ],
    },
    {
      name: 'note',
      type: 'textarea',
      admin: {
        description:
          'Nota de apoio abaixo da grade (`.ss-note`), ex.: "Precisa de outra coisa? O time responde no WhatsApp em horário comercial." (`_reference/contato.html:266`).',
      },
    },
  ],
}
