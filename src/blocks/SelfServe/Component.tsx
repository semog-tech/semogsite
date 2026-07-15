import { Container } from '@/components/ui/Container'
import { GradientText } from '@/components/ui/GradientText'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/motion/reveal'
import type { SelfServeBlock as SelfServeBlockType } from '@/payload-types'

type Item = NonNullable<SelfServeBlockType['items']>[number]

/** Título com o trecho final em `.gx` — mesmo padrão de `ContactInfo`'s `CardTitle`. */
function SectionTitle({ title, accent }: { title: string; accent?: string | null }) {
  if (accent && title.endsWith(accent)) {
    return (
      <h2 className="text-h2">
        {title.slice(0, -accent.length)}
        <GradientText variant="brand">{accent}</GradientText>
      </h2>
    )
  }
  return <h2 className="text-h2">{title}</h2>
}

/**
 * Um card (`.ss-card`), fiel a `_reference/contato.html:241-264`: o `Reveal`
 * (`data-reveal` no ref) vira o próprio `<div class="ss-card">` — não
 * repassa `href` (mesma limitação de `BlogFeatured`), então o link cobre o
 * card inteiro via `<a>` esticado absoluto (`.ss-card` ganhou
 * `position:relative` em `theme.css` pra ancorar isso).
 */
function SelfServeCard({ item }: { item: Item }) {
  return (
    <Reveal className="ss-card">
      <span>
        <strong>{item.title}</strong>
        <small>{item.description}</small>
      </span>
      <span className="go" aria-hidden="true">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </span>
      <a href={item.href} className="absolute inset-0 z-10">
        <span className="sr-only">{item.title}</span>
      </a>
    </Reveal>
  )
}

/**
 * "Resolva fácil" (`.selfserve.sec-light.white`), fiel a
 * `_reference/contato.html:233-268` — ver o comentário completo (var→token)
 * em `theme.css` (`.selfserve`/`.ss-grid`/`.ss-card`/`.ss-note`). Cabeçalho
 * (h2+p) entra num único `Reveal`, fiel ao `data-reveal` único de `.sec-head`
 * no ref (não dois reveals separados).
 */
export function SelfServeBlock({ title, titleAccent, text, items, note }: SelfServeBlockType) {
  if (!items || items.length === 0) return null
  return (
    <Section light white className="selfserve" ariaLabel="Resolva fácil">
      <Container>
        <Reveal className="mb-[clamp(2.5rem,6vw,4.5rem)] max-w-2xl">
          <SectionTitle title={title} accent={titleAccent} />
          {text && <p className="max-w-[58ch] text-lead text-fg-2">{text}</p>}
        </Reveal>
        <div className="ss-grid">
          {items.map((item) => (
            <SelfServeCard key={item.id ?? item.title} item={item} />
          ))}
        </div>
        {note && (
          <Reveal as="p" className="ss-note">
            {note}
          </Reveal>
        )}
      </Container>
    </Section>
  )
}
