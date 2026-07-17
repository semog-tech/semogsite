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
      name: 'background',
      type: 'select',
      options: [
        { label: 'Vídeo/imagem (padrão)', value: 'video' },
        { label: 'Gradiente animado', value: 'gradient' },
        { label: 'Imagem estática', value: 'image' },
        { label: 'Sem fundo (navy sólido)', value: 'plain' },
      ],
      defaultValue: 'video',
      admin: {
        description:
          'Só `gradient` tem efeito próprio: troca o fundo por `GradientBackground` (`src/motion/GradientBackground.tsx`), um gradiente "aurora" animado em canvas, reativo ao mouse, na paleta navy/ice — usado no hero da home no lugar do vídeo. Os outros três valores (inclusive o default `video`, e o vazio dos heróis já existentes antes deste campo) preservam o comportamento anterior inalterado: vídeo+poster se `video` estiver preenchido, senão `pageHeroOverlay`/`poster` como imagem, senão navy sólido — este campo não introduz lógica nova pra eles.',
      },
    },
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
          'Só com `pageHeroOverlay`. Sem `poster`: este é o `background` COMPLETO do próprio `.page-hero` (ex. `_reference/blog.html:40-44`, radial-gradient + `var(--grad-hero)`, sem imagem nenhuma). Com `poster`: é o `background` de `.page-hero::after`, um gradiente escuro por cima da imagem (ex. `/administracao-de-condominios`: `linear-gradient(180deg, rgba(5,8,26,0.45) 0%, rgba(5,8,26,0.15) 45%, rgba(5,8,26,0.85) 100%)`).',
      },
    },
    {
      name: 'pageHeroPaddingBottom',
      type: 'text',
      defaultValue: 'clamp(3rem, 6vw, 4.5rem)',
      admin: {
        description:
          'Só com `pageHeroOverlay`. `padding-block` (segundo valor) do `.page-hero` do ref — a maioria das páginas usa `clamp(3rem, 6vw, 4.5rem)` (o default aqui), mas `/blog` e `/contato` usam `clamp(2.5rem, 5vw, 4rem)` (`_reference/blog.html:43`).',
      },
    },
    {
      name: 'pageHeroHeadlineMaxWidth',
      type: 'text',
      admin: {
        description:
          '`max-width` do `h1`, fiel ao `ch` de cada `.hero h1`/`.page-hero h1` do ref (ex.: `16ch` em `/blog`, `/solucoes` e `/administracao-de-condominios`, `15ch` em `/contato` e `/incorporadoras`, `14ch` em `/semog`, `17ch` nas landings de cidade). Funciona em qualquer hero, não só com `pageHeroOverlay`. Deixe em branco para não aplicar nenhum `max-width` (caso do `.hero h1` genérico da home, que no ref não tem `max-width` — só `font-size`).',
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
    {
      name: 'priceChip',
      type: 'group',
      admin: {
        description:
          'Chip de vidro "1%" do hero de vídeo (`.g-price`), fiel a `_reference/garante.html:94-104` (estilo inline da própria página — distinto do `.pct-chip` do bloco `Garante`, que é o da banda `.g-band-home`). Só tem efeito com `video` preenchido: liga o overlay `::after` (`.g-hero`) e troca o layout de subhead/CTAs para a `.row` (docked à esquerda) + o chip (docked à direita), no lugar do empilhamento padrão. Deixe em branco para o hero de vídeo sem chip (ex.: home).',
      },
      fields: [
        { name: 'value', type: 'text' },
        { name: 'label', type: 'text' },
      ],
    },
  ],
}
