import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { Stagger } from '@/motion/reveal'
import type { QuickLinksBlock as QuickLinksBlockType } from '@/payload-types'

type Item = NonNullable<QuickLinksBlockType['items']>[number]

/** Mesma checagem de `Button.tsx` (não exportada de lá) — rota interna = começa com `/`, sem `:`. */
function isInternalHref(href: string): boolean {
  return href.startsWith('/') && !href.startsWith('//') && !href.includes(':')
}

/** Os 3 glifos de `.quick-card .ic`, fiéis a `_reference/contato.html:212,218,224`. */
function Icon({ name }: { name: Item['icon'] }) {
  if (name === 'whatsapp') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="#FFFFFF" aria-hidden="true">
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4 0-.5.1-.7l.4-.5c.1-.2.1-.3 0-.5-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3a2.8 2.8 0 0 0-.9 2.1c0 1.2.9 2.4 1 2.6.1.2 1.8 2.7 4.3 3.8.6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2 0-.1-.2-.2-.4-.3Z" />
      </svg>
    )
  }
  if (name === 'email') {
    return (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-10 6L2 7" />
      </svg>
    )
  }
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6M9 15l2 2 4-4" />
    </svg>
  )
}

function QuickCard({ item }: { item: Item }) {
  const inner = (
    <>
      <span className="ic" aria-hidden="true">
        <Icon name={item.icon} />
      </span>
      <h3>{item.title}</h3>
      <p>{item.description}</p>
      <span className="val">{item.value}</span>
    </>
  )
  if (item.external || !isInternalHref(item.href)) {
    return (
      <a
        className="quick-card"
        href={item.href}
        target={item.external ? '_blank' : undefined}
        rel={item.external ? 'noopener' : undefined}
      >
        {inner}
      </a>
    )
  }
  return (
    <Link className="quick-card" href={item.href}>
      {inner}
    </Link>
  )
}

/**
 * `.quick` (atendimento rápido), fiel a `_reference/contato.html:207-231` —
 * ver o comentário completo (var→token) em `theme.css` (`.quick`/
 * `.quick-card`). `!pt-[...]` força o `padding-top` reduzido do ref por
 * cima do `py-*` genérico de `Section` (mesmo truque de `BlogFeatured`,
 * `!pt-[clamp(2.5rem,5vw,4rem)]`) — o padding-bottom genérico
 * (`--section`) permanece, o ref não o sobrescreve. `Stagger` reproduz
 * `data-stagger` em `.quick-grid`: como os cards já são `<a>`/`<Link>` de
 * verdade, entram como filhos diretos do container animado, sem precisar
 * de wrapper.
 */
export function QuickLinksBlock({ items }: QuickLinksBlockType) {
  if (!items || items.length === 0) return null
  return (
    <Section className="quick !pt-[clamp(2.5rem,5vw,4rem)]" ariaLabel="Atendimento rápido">
      <Container>
        <Stagger className="quick-grid">
          {items.map((item) => (
            <QuickCard key={item.id ?? item.title} item={item} />
          ))}
        </Stagger>
      </Container>
    </Section>
  )
}
