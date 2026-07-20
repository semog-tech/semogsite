import type { Block } from 'payload'

/**
 * Fiel à seção "Clube de benefícios" (`id="beneficios"`) de
 * `_reference/solucoes.html:693-724`, `.club.sec-light.white`: cabeçalho
 * (`.sec-head`) + `.club-grid` de 4 células com ícone/título/texto
 * (`data-stagger`) + nota final (`.club-note`).
 *
 * Não confundir com a OUTRA seção "Benefícios" do mesmo ref
 * (`.benefits.sec-light.white .bento`, sem id, `solucoes.html:487-520`) —
 * essa é o grid 6-col com números gigantes e `blog-lazer.webp`, já mapeada
 * para `RegistrosBlock` (fora do escopo desta task). `items[].icon` é texto
 * livre (glifo/emoji), mesmo padrão de `PrestacaoBlock.list[].icon` — o ref
 * usa SVGs inline por célula, mas não há biblioteca de ícones no CMS.
 */
export const clubeBeneficiosBlock: Block = {
  slug: 'clubeBeneficios',
  interfaceName: 'ClubeBeneficiosBlock',
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'title', type: 'text', required: true },
    { name: 'text', type: 'textarea' },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'icon', type: 'text' },
        { name: 'title', type: 'text', required: true },
        { name: 'text', type: 'textarea', required: true },
      ],
    },
    { name: 'note', type: 'text' },
  ],
}
