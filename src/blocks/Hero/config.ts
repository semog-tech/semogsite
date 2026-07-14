import type { Block } from 'payload'

/**
 * Fiel à seção `.hero` de `_reference/index.html`: vídeo full-bleed
 * (opcional, com poster), headline com split-word, lead e CTAs. `poster` é
 * um upload próprio (não derivado do vídeo) para permitir hero só-imagem.
 * `tag` alimenta a coluna de vidro `.hero-tagbox` (`.hero-grid` de 2 colunas
 * em desktop) — reference `index.html:492-508`.
 */
export const heroBlock: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'headline', type: 'text', required: true },
    { name: 'subhead', type: 'textarea' },
    {
      name: 'tag',
      type: 'text',
      admin: {
        description:
          'Coluna de vidro à direita do hero (`.hero-tagbox`), ex.: "Condomínios. Métricas. Organização." Opcional — sem valor, o layout fica de 1 coluna como antes.',
      },
    },
    { name: 'video', type: 'upload', relationTo: 'media' },
    { name: 'poster', type: 'upload', relationTo: 'media' },
    {
      name: 'pageHeroOverlay',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Ativa o tratamento `.page-hero` do ref (ex.: `_reference/solucoes.html:87-107`): altura reduzida, a imagem de `poster` com opacidade reduzida e um gradiente `::after` escuro por cima para dar contraste ao texto. Só tem efeito sem `video` (o hero com vídeo, ex. home, não muda). Sem isso marcado, o herói mantém o comportamento atual (100dvh, sem overlay). Os 4 campos abaixo (`pageHeroMinHeight`/`pageHeroPosterOpacity`/`pageHeroBgPosition`/`pageHeroGradient`) controlam os números exatos — cada `.page-hero` do ref tem seus próprios valores (ex.: `/solucoes` = 74dvh/0.5/"center 65%"; `/administracao-de-condominios` = 88dvh/0.85/"center 40%"); os defaults abaixo são os de `/solucoes`, primeira página a usar este campo.',
      },
    },
    {
      name: 'pageHeroMinHeight',
      type: 'text',
      defaultValue: '74dvh',
      admin: {
        description:
          'Só com `pageHeroOverlay`. `min-height` do `.page-hero` do ref (ex.: `74dvh` em `/solucoes`, `88dvh` em `/administracao-de-condominios`).',
      },
    },
    {
      name: 'pageHeroPosterOpacity',
      type: 'number',
      defaultValue: 0.5,
      admin: {
        description:
          'Só com `pageHeroOverlay`. Opacidade de `.page-hero .bg` do ref (ex.: `0.5` em `/solucoes`, `0.85` em `/administracao-de-condominios`).',
      },
    },
    {
      name: 'pageHeroBgPosition',
      type: 'text',
      defaultValue: 'center 65%',
      admin: {
        description:
          'Só com `pageHeroOverlay`. `background-position` de `.page-hero .bg` do ref (ex.: `center 65%` em `/solucoes`, `center 40%` em `/administracao-de-condominios`).',
      },
    },
    {
      name: 'pageHeroGradient',
      type: 'textarea',
      defaultValue:
        'linear-gradient(180deg, rgba(5,8,26,0.55) 0%, rgba(10,16,46,0.3) 50%, var(--color-navy-900) 100%)',
      admin: {
        description:
          'Só com `pageHeroOverlay`. CSS `background` completo de `.page-hero::after` do ref — cada página tem paradas/cores próprias (ex. `/administracao-de-condominios`: `linear-gradient(180deg, rgba(5,8,26,0.45) 0%, rgba(5,8,26,0.15) 45%, rgba(5,8,26,0.85) 100%)`).',
      },
    },
    {
      name: 'ctas',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true },
        {
          name: 'variant',
          type: 'select',
          options: ['primary', 'ghost', 'white', 'glass'],
          defaultValue: 'primary',
        },
      ],
    },
  ],
}
