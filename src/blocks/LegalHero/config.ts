import type { Block } from 'payload'

/**
 * Hero compacto de página legal (`.legal-hero`), fiel a
 * `_reference/privacidade.html:19-24,66-71` e `_reference/termos.html:19-24,
 * 66-71` (CSS inline da própria página, idêntico nas duas): `padding: 150px 0
 * clamp(2rem,4vw,3rem)` + `border-bottom`, headline `h1` bem menor
 * (`clamp(2rem,4.4vw,3.4rem)`, contra o `--text-hero` gigante do `Hero`
 * genérico) e uma linha `.upd` com a data de "última atualização" — SEM
 * split-headline (`Chars`) nem `Fade`, o ref não anima esta seção. Bloco novo
 * em vez de reaproveitar `Hero`: `Hero` é fiel ao `.hero`/`.page-hero`
 * animado da home/páginas institucionais, um formato bem diferente (100dvh
 * ou `.page-hero` com imagem, headline por caractere) do estático de
 * `/privacidade` e `/termos`.
 */
export const legalHeroBlock: Block = {
  slug: 'legalHero',
  interfaceName: 'LegalHeroBlock',
  fields: [
    { name: 'headline', type: 'text', required: true },
    {
      name: 'updatedText',
      type: 'text',
      admin: {
        description:
          'Linha `.upd` abaixo do título, ex.: "Última atualização: julho de 2026 · Documento em revisão pelo jurídico da Semog".',
      },
    },
  ],
}
