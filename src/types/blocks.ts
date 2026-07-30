/**
 * Tipos de bloco escritos à mão — substituem os `*Block` gerados pelo Payload
 * (`src/payload-types.ts`). Cada `interface XBlock` foi copiada do shape que o
 * Payload gerava a partir do `config.ts` do bloco (mesma fonte, sem
 * reinventar campos), cruzada com o que o `Component.tsx` do bloco
 * desestrutura hoje — isso garante paridade exata com o que os componentes
 * esperam, sem depender do Payload continuar instalado.
 *
 * Convenções (iguais em todo bloco):
 * - `blockType` é literal (o `RenderBlocks` despacha por ele).
 * - `id?: string | number | null` — o `RenderBlocks` usa `block.id` como
 *   `key`; aceita number pra não amarrar a origem do dado (Payload usava
 *   string, um id gerado à mão pode ser number).
 * - `blockName?: string | null` — rótulo interno do Payload, mantido opcional
 *   por compat (nenhum componente lê, mas os dados existentes têm o campo).
 * - Campo de imagem usa `number | Media` (obrigatório) ou
 *   `(number | null) | Media` (opcional) — o `number` era o id do Payload,
 *   mantido pra compat com o shape atual dos dados durante a migração.
 * - Todo campo é opcional, exceto os marcados `required: true` no `config.ts`
 *   original (esses viram campo obrigatório aqui também).
 */
import type { Media } from './media'

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

export interface HeroBlock {
  blockType: 'hero'
  id?: string | number | null
  blockName?: string | null
  eyebrow?: string | null
  headline: string
  subhead?: string | null
  /** Coluna de vidro à direita do hero (`.hero-tagbox`). Sem valor, layout de 1 coluna. */
  tag?: string | null
  /** Faixa de prova colada no rodapé do hero. Vazio = não renderiza; quando preenchida, substitui `tag`. */
  proofItems?:
    | {
        /** Ex.: "4,8", "+650" */
        value: string
        label: string
        /** Mostra 5 estrelas antes do valor (só faz sentido em nota). */
        stars?: boolean | null
        id?: string | null
      }[]
    | null
  video?: (number | null) | Media
  poster?: (number | null) | Media
  /** `gradient`/`videoSequence` trocam o fundo por um background animado próprio; os demais preservam o comportamento de vídeo/imagem/navy sólido. */
  background?: ('video' | 'gradient' | 'videoSequence' | 'image' | 'plain') | null
  /** Ativa o tratamento `.page-hero` (altura reduzida, poster com overlay escuro). Só tem efeito sem `video`. */
  pageHeroOverlay?: boolean | null
  /** Só com `pageHeroOverlay`. `min-height` do `.page-hero`. */
  pageHeroMinHeight?: string | null
  /** Só com `pageHeroOverlay`. Opacidade de `.page-hero .bg`. */
  pageHeroPosterOpacity?: number | null
  /** Só com `pageHeroOverlay`. `background-position` de `.page-hero .bg`. */
  pageHeroBgPosition?: string | null
  /** Só com `pageHeroOverlay`. Sem `poster`, é o `background` completo do `.page-hero`; com `poster`, é o gradiente escuro de `.page-hero::after`. */
  pageHeroGradient?: string | null
  /** Só com `pageHeroOverlay`. `padding-block` (segundo valor) do `.page-hero`. */
  pageHeroPaddingBottom?: string | null
  /** `max-width` do `h1`, em `ch`. Funciona em qualquer hero, não só com `pageHeroOverlay`. */
  pageHeroHeadlineMaxWidth?: string | null
  ctas?:
    | {
        label: string
        href: string
        variant?: ('primary' | 'ghost' | 'white' | 'glass') | null
        id?: string | null
      }[]
    | null
  /** Chip de vidro "1%" do hero de vídeo (`.g-price`). Só tem efeito com `video` preenchido. */
  priceChip?: {
    value?: string | null
    label?: string | null
  }
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export interface StatsBlock {
  blockType: 'stats'
  id?: string | number | null
  blockName?: string | null
  eyebrow?: string | null
  title?: string | null
  /** `grid` = grade de mini-stats. `feature` = ledger editorial (número + rótulo + `detail`). `band` = faixa horizontal de 5 colunas (usada na home). Vazio = 'grid'. */
  variant?: ('grid' | 'feature' | 'band') | null
  items?:
    | {
        value: number
        prefix?: string | null
        suffix?: string | null
        label: string
        /** Frase curta de apoio, só no variant "feature"/"band". */
        detail?: string | null
        id?: string | null
      }[]
    | null
}

// ---------------------------------------------------------------------------
// ValuesMarquee
// ---------------------------------------------------------------------------

export interface ValuesMarqueeBlock {
  blockType: 'valuesMarquee'
  id?: string | number | null
  blockName?: string | null
  variant?: ('values' | 'ticker') | null
  /** Valores exibidos na faixa (ex.: TRANSPARÊNCIA, RETIDÃO, DINÂMICA). */
  items: string[]
  /** Divisor entre os valores. Default "/". */
  separator?: string | null
}

// ---------------------------------------------------------------------------
// WordsSection
// ---------------------------------------------------------------------------

export interface WordsSectionBlock {
  blockType: 'wordsSection'
  id?: string | number | null
  blockName?: string | null
  variant?: ('manifesto' | 'problem' | 'argument') | null
  eyebrow?: string | null
  /** Aceita `<em>...</em>` embutido pro destaque em ice. */
  text: string
  /** Parágrafo de apoio abaixo de `text`. Só usado pelo variant `argument`. */
  sub?: string | null
}

// ---------------------------------------------------------------------------
// Pillars
// ---------------------------------------------------------------------------

export interface PillarsBlock {
  blockType: 'pillars'
  id?: string | number | null
  blockName?: string | null
  eyebrow?: string | null
  /** Zera o padding-top da seção (usado na Home/`semog`). */
  tightTop?: boolean | null
  light?: boolean | null
  white?: boolean | null
  /** Tipografia levemente menor (`h3`/`p`). */
  compact?: boolean | null
  /** Colunas encolhem a seção sem perder conteúdo. */
  variant?: ('rows' | 'columns') | null
  items: {
    glyph?: string | null
    title: string
    text: string
    id?: string | null
  }[]
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export interface TimelineBlock {
  blockType: 'timeline'
  id?: string | number | null
  blockName?: string | null
  eyebrow?: string | null
  title?: string | null
  text?: string | null
  items: {
    date: string
    title: string
    text: string
    image?: (number | null) | Media
    /** Marca o cartão atual (glow). */
    now?: boolean | null
    id?: string | null
  }[]
}

// ---------------------------------------------------------------------------
// SolucoesBento
// ---------------------------------------------------------------------------

export interface SolucoesBentoBlock {
  blockType: 'solucoesBento'
  id?: string | number | null
  blockName?: string | null
  eyebrow?: string | null
  title: string
  cards: {
    image: number | Media
    tag?: string | null
    title: string
    text: string
    href?: string | null
    /** Ocupa o card alto (coluna larga) do bento. */
    tall?: boolean | null
    id?: string | null
  }[]
}

// ---------------------------------------------------------------------------
// SolutionSplit
// ---------------------------------------------------------------------------

export interface SolutionSplitBlock {
  blockType: 'solutionSplit'
  id?: string | number | null
  blockName?: string | null
  items: {
    variant?: ('split' | 'assoc') | null
    kicker?: string | null
    title: string
    text?: string | null
    /** Pills de serviços incluídos — só na variante split. */
    tags?:
      | {
          label: string
          id?: string | null
        }[]
      | null
    image: number | Media
    /** Inverte o lado: imagem à esquerda, texto à direita. Só na variante split. */
    reversed?: boolean | null
    /** Link-arrow — só na variante full-bleed. */
    ctaLabel?: string | null
    ctaHref?: string | null
    /**
     * Âncora da seção deste item (ex.: `residenciais` para
     * `/solucoes#residenciais`). Fica no item, não no bloco, porque cada item
     * vira uma `<section>` própria e os links da home apontam pra uma delas.
     */
    anchor?: string | null
    id?: string | null
  }[]
}

// ---------------------------------------------------------------------------
// ProdutosGrid
// ---------------------------------------------------------------------------

export interface ProdutosGridBlock {
  blockType: 'produtosGrid'
  id?: string | number | null
  blockName?: string | null
  eyebrow?: string | null
  title: string
  cards: {
    image: number | Media
    theme: 'on-white' | 'on-navy' | 'on-deep'
    tag?: string | null
    title: string
    text: string
    href?: string | null
    id?: string | null
  }[]
}

// ---------------------------------------------------------------------------
// FeatureGrid
// ---------------------------------------------------------------------------

export interface FeatureGridBlock {
  blockType: 'featureGrid'
  id?: string | number | null
  blockName?: string | null
  variant?: ('dark' | 'light' | 'rows') | null
  /** Só com `variant:"dark"`. Envolve o grid em `Section light`. */
  light?: boolean | null
  /** Só com `light` ativo — troca `.sec-light` por `.sec-light white`. */
  white?: boolean | null
  /** `2` reproduz `.why-grid` (2 colunas); `3` é o grid genérico padrão. */
  columns?: ('2' | '3') | null
  /** Só com `variant:"dark"`. Troca a entrada por card por entrada em grupo. */
  stagger?: boolean | null
  eyebrow?: string | null
  title?: string | null
  /** Trecho final de `title` a destacar em gradiente. */
  titleAccent?: string | null
  /** Só com `variant:"rows"`. Parágrafo de apresentação abaixo do `title`. */
  intro?: string | null
  /** Só com `variant:"rows"`. Link ao fim da lista (`.svc-more`). */
  moreLink?: {
    label?: string | null
    href?: string | null
  }
  features?:
    | {
        /** Glifo/emoji livre — só é renderizado no variant escuro, e só quando `iconSvg` não está preenchido. */
        icon?: string | null
        /** Markup interno do ícone (paths/circles/rects, sem a tag `<svg>` em volta). Tem prioridade sobre `icon`. */
        iconSvg?: string | null
        title: string
        /** Não usado no `variant:"rows"`. */
        description?: string | null
        /** Só com `variant:"rows"`. Selo inline ao lado do título da linha. */
        badge?: string | null
        id?: string | null
      }[]
    | null
}

// ---------------------------------------------------------------------------
// Garante
// ---------------------------------------------------------------------------

export interface GaranteBlock {
  blockType: 'garante'
  id?: string | number | null
  blockName?: string | null
  eyebrow?: string | null
  title: string
  text?: string | null
  video?: (number | null) | Media
  poster?: (number | null) | Media
  features?:
    | {
        title: string
        description: string
        id?: string | null
      }[]
    | null
  cta?: {
    label?: string | null
    href?: string | null
  }
  /** Chip de vidro "1%" da banda com vídeo. */
  priceChip?: {
    value?: string | null
    label?: string | null
  }
  note?: string | null
  /** Só sem `video`/`poster`. Porcentagem tipográfica gigante da variante split. */
  pct?: {
    value?: string | null
    label?: string | null
  }
}

// ---------------------------------------------------------------------------
// Cities
// ---------------------------------------------------------------------------

export interface CitiesBlock {
  blockType: 'cities'
  id?: string | number | null
  blockName?: string | null
  eyebrow?: string | null
  title?: string | null
  items?:
    | {
        city: string
        uf: string
        role?: string | null
        /** Página da unidade; com ela o painel inteiro vira link. */
        href?: string | null
        image?: (number | null) | Media
        id?: string | null
      }[]
    | null
}

// ---------------------------------------------------------------------------
// HumanQuote
// ---------------------------------------------------------------------------

export interface HumanQuoteBlock {
  blockType: 'humanQuote'
  id?: string | number | null
  blockName?: string | null
  quote: string
  author?: string | null
  image: number | Media
  caption?: string | null
}

// ---------------------------------------------------------------------------
// Prestacao
// ---------------------------------------------------------------------------

export interface PrestacaoBlock {
  /** Âncora da seção (ex.: `prestacao` para `/solucoes#prestacao`). */
  anchor?: string | null
  blockType: 'prestacao'
  id?: string | number | null
  blockName?: string | null
  eyebrow?: string | null
  title: string
  text?: string | null
  image: number | Media
  list: {
    icon?: string | null
    title: string
    text: string
    id?: string | null
  }[]
}

// ---------------------------------------------------------------------------
// TecnologiaRoadmap
// ---------------------------------------------------------------------------

export interface TecnologiaRoadmapBlock {
  /** Âncora da seção (ex.: `prestacao` para `/solucoes#prestacao`). */
  anchor?: string | null
  blockType: 'tecnologiaRoadmap'
  id?: string | number | null
  blockName?: string | null
  eyebrow?: string | null
  title: string
  text?: string | null
  intro: {
    /** Ex.: dashboard do Semog One. */
    image?: (number | null) | Media
    /** Selo acima do nome (ex.: "Plataforma própria"). */
    badge?: string | null
    name: string
    description: string
    tags?:
      | {
          label: string
          id?: string | null
        }[]
      | null
  }
  roadmapLabel?: string | null
  steps: {
    title: string
    text: string
    status: string
    /** Destaca o status como "no ar" (`.status.live`). */
    live?: boolean | null
    id?: string | null
  }[]
}

// ---------------------------------------------------------------------------
// ClubeBeneficios
// ---------------------------------------------------------------------------

export interface ClubeBeneficiosBlock {
  /** Âncora da seção (ex.: `prestacao` para `/solucoes#prestacao`). */
  anchor?: string | null
  blockType: 'clubeBeneficios'
  id?: string | number | null
  blockName?: string | null
  eyebrow?: string | null
  title: string
  text?: string | null
  items: {
    icon?: string | null
    title: string
    text: string
    id?: string | null
  }[]
  note?: string | null
}

// ---------------------------------------------------------------------------
// Socios
// ---------------------------------------------------------------------------

export interface SociosBlock {
  blockType: 'socios'
  id?: string | number | null
  blockName?: string | null
  eyebrow?: string | null
  title: string
  text?: string | null
  items: {
    title: string
    text: string
    id?: string | null
  }[]
  image: number | Media
  caption?: string | null
}

// ---------------------------------------------------------------------------
// Registros
// ---------------------------------------------------------------------------

export interface RegistrosBlock {
  blockType: 'registros'
  id?: string | number | null
  blockName?: string | null
  title?: string | null
  light?: boolean | null
  /** Só com `light` ativo — troca `.sec-light` por `.sec-light white`. */
  white?: boolean | null
  items?:
    | {
        label: string
        id?: string | null
      }[]
    | null
}

// ---------------------------------------------------------------------------
// AppShowcase
// ---------------------------------------------------------------------------

export interface AppShowcaseBlock {
  /** Âncora da seção (ex.: `prestacao` para `/solucoes#prestacao`). */
  anchor?: string | null
  blockType: 'appShowcase'
  id?: string | number | null
  blockName?: string | null
  eyebrow?: string | null
  title: string
  text?: string | null
  image?: (number | null) | Media
  theme?: ('light' | 'deep') | null
  /** Segunda tela, exibida atrás da primeira com rotação leve. Vazio = uma imagem só. */
  imageSecondary?: (number | null) | Media
  /** Nota pública do app. Só preencher enquanto bater com as lojas. */
  rating?: {
    /** Ex.: "4,8" */
    score?: string | null
    label?: string | null
  }
  stores?: {
    /** URL da ficha na App Store */
    appStore?: string | null
    /** URL da ficha no Google Play */
    playStore?: string | null
  }
  features?:
    | {
        title: string
        description: string
        id?: string | null
      }[]
    | null
  cta?: {
    label?: string | null
    href?: string | null
  }
}

// ---------------------------------------------------------------------------
// Testimonials
// ---------------------------------------------------------------------------

export interface TestimonialsBlock {
  blockType: 'testimonials'
  id?: string | number | null
  blockName?: string | null
  eyebrow?: string | null
  title?: string | null
  items?:
    | {
        quote: string
        author: string
        role?: string | null
        /** Condomínio ou empresa */
        org?: string | null
        city?: string | null
        /** Estrelas. Vazio = sem estrelas. */
        rating?: number | null
        photo?: (number | null) | Media
        id?: string | null
      }[]
    | null
  /** Faixa de nomes/logos abaixo dos depoimentos. Sem imagem, renderiza o nome em texto. */
  logos?:
    | {
        name: string
        logo?: (number | null) | Media
        id?: string | null
      }[]
    | null
}

// ---------------------------------------------------------------------------
// Faq
// ---------------------------------------------------------------------------

export interface FaqBlock {
  blockType: 'faq'
  id?: string | number | null
  blockName?: string | null
  eyebrow?: string | null
  title?: string | null
  white?: boolean | null
  /** Zera o padding-top da seção — só na família `administracao-de-condominios*`. */
  tightTop?: boolean | null
  /** Fundo `--bg-deep` escuro em vez de `.sec-light`. Sem efeito se `white` também estiver marcado. */
  dark?: boolean | null
  items?:
    | {
        question: string
        answer: string
        id?: string | null
      }[]
    | null
}

// ---------------------------------------------------------------------------
// CTABand
// ---------------------------------------------------------------------------

export interface CTABandBlock {
  blockType: 'ctaBand'
  id?: string | number | null
  blockName?: string | null
  variant?: ('band' | 'centered') | null
  title: string
  /** Trecho final de `title` a destacar em gradiente. Só no variant `centered`. */
  titleAccent?: string | null
  text?: string | null
  cta: {
    label: string
    href: string
  }
  /** Segundo caminho, ao lado do CTA principal (ex.: WhatsApp). Só tem efeito na variante `centered`. */
  secondaryCta?: {
    label?: string | null
    href?: string | null
  }
  /** Só no variant `centered`. Default `white`. */
  buttonVariant?: ('white' | 'primary') | null
  /** Só no variant `centered`. `max-width` do `.final-cta h2`. */
  headingMaxWidth?: string | null
  /** Só no variant `centered`. `font-size` do `.final-cta h2`. Vazio = tamanho padrão de `h2`. */
  headingFontSize?: string | null
}

// ---------------------------------------------------------------------------
// CustoChecklist
// ---------------------------------------------------------------------------

export interface CustoChecklistBlock {
  blockType: 'custoChecklist'
  id?: string | number | null
  blockName?: string | null
  title: string
  /** Trecho final de `title` a destacar em gradiente `.gx`. */
  titleAccent?: string | null
  paragraphs: {
    text: string
    id?: string | null
  }[]
  cta: {
    label: string
    href: string
  }
  /** Rótulo acima da lista (`.cost-card .top`). */
  checklistLabel: string
  checklist: {
    text: string
    id?: string | null
  }[]
}

// ---------------------------------------------------------------------------
// RichText
// ---------------------------------------------------------------------------

/**
 * Nó lexical genérico — não modelamos o schema completo do editor rich text
 * (fora do escopo desta task, só blocos); só o suficiente pra tipar o
 * conteúdo serializado que `@payloadcms/richtext-lexical/react` consome hoje.
 * `type`/`version` são obrigatórios (não `?`) porque `SerializedLexicalNode`
 * (pacote `lexical`) os exige assim em todo nó, incluindo `root` — confirmado
 * pelo `tsc` da Task 3 ao tipar `RichText/Component.tsx` contra este tipo.
 */
export interface RichTextBlock {
  blockType: 'richText'
  id?: string | number | null
  blockName?: string | null
  /**
   * Corpo em MDX (markdown) — substitui o lexical JSON do Payload (Task 3).
   * Renderizado via `next-mdx-remote/rsc` (`RichText/Component.tsx`).
   */
  body?: string | null
  /** Tratamento `.legal-body` (medida 760px), usado em `/privacidade` e `/termos`. */
  legal?: boolean | null
}

// ---------------------------------------------------------------------------
// BlogList / BlogFeatured — posts lidos de `src/lib/blog.ts` (MDX), por slug
// ---------------------------------------------------------------------------

export interface BlogListBlock {
  blockType: 'blogList'
  id?: string | number | null
  blockName?: string | null
  title?: string | null
  /** Quantidade de posts a exibir (padrão 6). */
  limit?: number | null
  /** Slug do post a excluir da grade — o mesmo de um `BlogFeatured` logo acima, pra não duplicá-lo. */
  excludePost?: string | null
  /** Zera o padding-top da seção — usar quando este bloco vem logo após um BlogFeatured. */
  tightTop?: boolean | null
}

export interface BlogFeaturedBlock {
  blockType: 'blogFeatured'
  id?: string | number | null
  blockName?: string | null
  /** Slug do post exibido em destaque (card grande, 2 colunas) — resolvido via `getPostBySlug`. */
  post: string
}

// ---------------------------------------------------------------------------
// Newsletter
// ---------------------------------------------------------------------------

export interface NewsletterBlock {
  blockType: 'newsletter'
  id?: string | number | null
  blockName?: string | null
  title: string
  text?: string | null
  placeholder?: string | null
  buttonLabel?: string | null
  /** Mensagem exibida no lugar do formulário após o "envio" (client-side). */
  successMessage?: string | null
}

// ---------------------------------------------------------------------------
// Showcase
// ---------------------------------------------------------------------------

export interface ShowcaseBlock {
  blockType: 'showcase'
  id?: string | number | null
  blockName?: string | null
  eyebrow?: string | null
  title: string
  text?: string | null
  features?:
    | {
        title: string
        description: string
        id?: string | null
      }[]
    | null
  cta?: {
    label?: string | null
    href?: string | null
  }
  mediaSide?: ('left' | 'right') | null
}

// ---------------------------------------------------------------------------
// Benefits
// ---------------------------------------------------------------------------

export interface BenefitsBlock {
  blockType: 'benefits'
  id?: string | number | null
  blockName?: string | null
  variant?: ('grid' | 'bento') | null
  eyebrow?: string | null
  title?: string | null
  /** Trecho final de `title` a destacar em gradiente. Só no variant bento. */
  titleAccent?: string | null
  items?:
    | {
        title: string
        description: string
        /** Número gigante da célula (.num). Só no variant bento. */
        value?: string | null
        /** Foto de fundo da célula (c4). Só no variant bento. */
        image?: (number | null) | Media
        id?: string | null
      }[]
    | null
}

// ---------------------------------------------------------------------------
// ContactInfo
// ---------------------------------------------------------------------------

export interface ContactInfoBlock {
  blockType: 'contactInfo'
  id?: string | number | null
  blockName?: string | null
  variant?: ('grid' | 'card' | 'units') | null
  eyebrow?: string | null
  title?: string | null
  /** Só na variante `card`. Trecho final de `title` a destacar em `.gx`. */
  titleAccent?: string | null
  items?:
    | {
        city: string
        uf: string
        address: string
        phone: string
        photo?: (number | null) | Media
        /** Nas variantes `card`/`units`. Selo sobre a foto (`card`) ou texto puro acima do título (`units`). */
        chip?: string | null
        /** Só na variante `card`. Segunda linha do endereço. */
        addressDetail?: string | null
        /** Nas variantes `card`/`units`. Telefone formatado (distinto de `whatsapp`, que é usado no link `wa.me`). */
        whatsappDisplay?: string | null
        /** Nas variantes `card`/`units`. Linha "Horário". */
        hours?: string | null
        /** Nas variantes `card`/`units`. Link do CTA ("Como chegar"/"Ver no mapa"). */
        mapsHref?: string | null
        id?: string | null
      }[]
    | null
  whatsapp?: string | null
}

// ---------------------------------------------------------------------------
// FormEmbed
// ---------------------------------------------------------------------------

export interface FormEmbedBlock {
  blockType: 'formEmbed'
  id?: string | number | null
  blockName?: string | null
  formType: 'contato' | 'proposta'
  eyebrow?: string | null
  title?: string | null
  text?: string | null
}

// ---------------------------------------------------------------------------
// PropostaBand
// ---------------------------------------------------------------------------

/**
 * Faixa full-bleed de captação (argumento à esquerda, formulário em card de
 * vidro à direita) — a composição das landings de cidade trazida pra home.
 * Diferente de `formEmbed`, que é o card centralizado da `/proposta`.
 */
export interface PropostaBandBlock {
  blockType: 'propostaBand'
  id?: string | number | null
  blockName?: string | null
  eyebrow?: string | null
  title: string
  text?: string | null
  /** Número gigante em gradiente ice (mesmo recurso do "1%" do Garante). */
  highlight?: {
    value?: string | null
    label?: string | null
  }
  /** Provas curtas com filete no topo, ecoando as colunas de pilares. */
  proofs?:
    | {
        label: string
        id?: string | null
      }[]
    | null
  whatsapp?: {
    label?: string | null
    href?: string | null
  }
  /** `gradiente` usa a textura de banda do site; `foto` usa `image` com overlay. */
  background?: ('gradiente' | 'foto') | null
  image?: (number | null) | Media
}

// ---------------------------------------------------------------------------
// PriceMoment
// ---------------------------------------------------------------------------

export interface PriceMomentBlock {
  blockType: 'priceMoment'
  id?: string | number | null
  blockName?: string | null
  /** Número gigante em gradiente (`.huge`), ex.: "1%". */
  value: string
  sub?: string | null
  fine?: string | null
}

// ---------------------------------------------------------------------------
// Compare
// ---------------------------------------------------------------------------

export interface CompareBlock {
  blockType: 'compare'
  id?: string | number | null
  blockName?: string | null
  title: string
  before: {
    tag: string
    items: {
      text: string
      id?: string | null
    }[]
  }
  after: {
    tag: string
    items: {
      text: string
      id?: string | null
    }[]
  }
}

// ---------------------------------------------------------------------------
// PartnerSplit
// ---------------------------------------------------------------------------

export interface PartnerSplitBlock {
  blockType: 'partnerSplit'
  id?: string | number | null
  blockName?: string | null
  title: string
  text: string
  /** Trecho de `text` a destacar em `<strong>` navy-500, ex.: "G5 Partners". */
  highlight?: string | null
}

// ---------------------------------------------------------------------------
// DevQuote
// ---------------------------------------------------------------------------

export interface DevQuoteBlock {
  blockType: 'devQuote'
  id?: string | number | null
  blockName?: string | null
  /** Aceita `<em>...</em>` embutido pro trecho final em destaque (cor ice). */
  quote: string
  cite?: string | null
}

// ---------------------------------------------------------------------------
// ProcessoTimeline
// ---------------------------------------------------------------------------

export interface ProcessoTimelineBlock {
  blockType: 'processoTimeline'
  id?: string | number | null
  blockName?: string | null
  eyebrow?: string | null
  title: string
  items: {
    /** Markup interno do ícone do dot (paths/circles/rects, sem a tag `<svg>` em volta), viewBox 24x24. */
    iconSvg: string
    title: string
    text: string
    tags?:
      | {
          label: string
          id?: string | null
        }[]
      | null
    id?: string | null
  }[]
}

// ---------------------------------------------------------------------------
// Bairros
// ---------------------------------------------------------------------------

export interface BairrosBlock {
  blockType: 'bairros'
  id?: string | number | null
  blockName?: string | null
  title: string
  items?:
    | {
        label: string
        id?: string | null
      }[]
    | null
  /** Nota de apoio abaixo dos pills. */
  note?: string | null
}

// ---------------------------------------------------------------------------
// QuickLinks
// ---------------------------------------------------------------------------

export interface QuickLinksBlock {
  blockType: 'quickLinks'
  id?: string | number | null
  blockName?: string | null
  /** O ref sempre mostra exatamente 3 atalhos (WhatsApp/e-mail/proposta). */
  items?:
    | {
        /** Glifo de vidro do card (`.quick-card .ic`). */
        icon: 'whatsapp' | 'email' | 'document'
        title: string
        description: string
        /** Linha em destaque no fim do card (`.quick-card .val`). */
        value: string
        href: string
        /** Abre em nova aba (`target="_blank" rel="noopener"`). */
        external?: boolean | null
        id?: string | null
      }[]
    | null
}

// ---------------------------------------------------------------------------
// SelfServe
// ---------------------------------------------------------------------------

export interface SelfServeBlock {
  blockType: 'selfServe'
  id?: string | number | null
  blockName?: string | null
  title: string
  /** Trecho final de `title` a destacar em `.gx`. */
  titleAccent?: string | null
  text?: string | null
  items?:
    | {
        title: string
        description: string
        href: string
        id?: string | null
      }[]
    | null
  /** Nota de apoio abaixo da grade (`.ss-note`). */
  note?: string | null
}

// ---------------------------------------------------------------------------
// TrustPanel
// ---------------------------------------------------------------------------

export interface TrustPanelBlock {
  blockType: 'trustPanel'
  id?: string | number | null
  blockName?: string | null
  /** Fundo do cartão de estatísticas (`.hero-card`), escurecido por um overlay. */
  photo?: (number | null) | Media
  /** Os 4 números do `.trust-stats`. Fixos, sem animação de contador. */
  stats?:
    | {
        value: string
        label: string
        id?: string | null
      }[]
    | null
  /** Citação sobre o Semog Garante (`.trust-quote`). */
  quote: string
  /** Trecho final de `quote` a destacar (`.trust-quote em`, cor sólida, sem itálico). */
  quoteAccent?: string | null
  quoteText: string
  whatsappTitle: string
  /** Texto antes do número, ex.: "Chame no WhatsApp:" */
  whatsappText?: string | null
  /** Dígitos puros, usado no link `https://wa.me/<whatsapp>`. */
  whatsapp: string
  /** Telefone formatado, ex.: "(81) 9 9999-9999". */
  whatsappDisplay: string
}

// ---------------------------------------------------------------------------
// LegalHero
// ---------------------------------------------------------------------------

export interface LegalHeroBlock {
  blockType: 'legalHero'
  id?: string | number | null
  blockName?: string | null
  headline: string
  /** Linha `.upd` abaixo do título, ex.: "Última atualização: julho de 2026". */
  updatedText?: string | null
}

// ---------------------------------------------------------------------------
// Union — todos os 41 blocos (mesma ordem do `layout` de `Page` em payload-types.ts)
// ---------------------------------------------------------------------------

export type Block =
  | HeroBlock
  | StatsBlock
  | ValuesMarqueeBlock
  | WordsSectionBlock
  | PillarsBlock
  | TimelineBlock
  | SolucoesBentoBlock
  | SolutionSplitBlock
  | ProdutosGridBlock
  | FeatureGridBlock
  | GaranteBlock
  | CitiesBlock
  | HumanQuoteBlock
  | PrestacaoBlock
  | TecnologiaRoadmapBlock
  | ClubeBeneficiosBlock
  | SociosBlock
  | RegistrosBlock
  | AppShowcaseBlock
  | TestimonialsBlock
  | FaqBlock
  | CTABandBlock
  | CustoChecklistBlock
  | RichTextBlock
  | BlogListBlock
  | BlogFeaturedBlock
  | NewsletterBlock
  | ShowcaseBlock
  | BenefitsBlock
  | ContactInfoBlock
  | FormEmbedBlock
  | PropostaBandBlock
  | PriceMomentBlock
  | CompareBlock
  | PartnerSplitBlock
  | DevQuoteBlock
  | ProcessoTimelineBlock
  | BairrosBlock
  | QuickLinksBlock
  | SelfServeBlock
  | TrustPanelBlock
  | LegalHeroBlock
