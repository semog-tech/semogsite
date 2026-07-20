import type { Block } from 'payload'

/**
 * Timeline VERTICAL fiel a `.proc-list`/`.proc-item` de
 * `_reference/incorporadoras.html:81-107,218-278` (estilo inline da própria
 * página): linha viva em gradiente (`.proc-list::before`), dots numerados
 * com ícone SVG, título/texto e pílulas `.tags` por etapa. Distinto de
 * `Timeline`/`TimelinePinned` (horizontal, pin+scrub, usado em `/semog`) —
 * bloco novo, não existia CMS equivalente antes desta task (ver
 * `.superpowers/sdd/audit-servicos.md`, seção `/incorporadoras`, linha
 * "PROCESSO" — approximated como `Showcase` split, sem timeline/dots/ícones/
 * tags).
 */
export const processoTimelineBlock: Block = {
  slug: 'processoTimeline',
  interfaceName: 'ProcessoTimelineBlock',
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'title', type: 'text', required: true },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'iconSvg',
          type: 'textarea',
          required: true,
          admin: {
            description:
              'Markup interno do ícone do dot (paths/circles/rects, SEM a tag <svg> em volta), viewBox 24x24, ex.: `<path d="M3 3v18h18"/><path d="M7 15l4-6 4 3 5-8"/>`. Renderizado stroke ice-400 (#ADD5EB), 22x22, dentro do dot gradiente.',
          },
        },
        { name: 'title', type: 'text', required: true },
        { name: 'text', type: 'textarea', required: true },
        {
          name: 'tags',
          type: 'array',
          fields: [{ name: 'label', type: 'text', required: true }],
        },
      ],
    },
  ],
}
