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
          'Ativa o tratamento `.page-hero` do ref (ex.: `_reference/solucoes.html:87-107`): altura reduzida (74dvh), a imagem de `poster` com opacidade 0.5 e um gradiente `::after` escuro por cima para dar contraste ao texto. Só tem efeito sem `video` (o hero com vídeo, ex. home, não muda). Sem isso marcado, o herói mantém o comportamento atual (100dvh, sem overlay). Os valores exatos (74dvh, opacidade, paradas do gradiente) são os de `/solucoes` — se outra página precisar deste tratamento com números diferentes do ref dela, este campo precisa virar configurável por instância.',
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
