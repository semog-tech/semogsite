import { ImageMedia } from '@/components/Media/ImageMedia'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Section } from '@/components/ui/Section'
import { Reveal, Stagger } from '@/motion/reveal'
import type { Media, PrestacaoBlock as PrestacaoBlockType } from '@/payload-types'

/**
 * Fiel a `#prestacao` de `_reference/solucoes.html:522-555`: cabeçalho +
 * `.showcase` (imagem grande, `data-reveal="scale"`) + `.prest-grid` de 4
 * células (`data-stagger`). `Section`/`Container` cuidam de padding-block e
 * do gutter; `.prestacao`/`.showcase`/`.prest-grid` (CSS portado em
 * `theme.css`) reproduzem o restante do layout do ref.
 */
export function PrestacaoBlock({ eyebrow, title, text, image, list }: PrestacaoBlockType) {
  const media = image && typeof image === 'object' ? (image as Media) : undefined
  if (!media || !list || list.length === 0) return null

  return (
    <Section className="prestacao">
      <Container>
        <Reveal className="max-w-2xl">
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <h2 className="text-h2">{title}</h2>
          {text && <p className="max-w-[58ch] text-lead text-fg-2">{text}</p>}
        </Reveal>
        <Reveal dir="scale" className="showcase">
          <ImageMedia resource={media} sizes="(min-width: 1024px) 1120px, 100vw" />
        </Reveal>
        <Stagger className="prest-grid">
          {list.map((cell) => (
            <div key={cell.id ?? cell.title} className="cell">
              {cell.icon && (
                <span aria-hidden="true" className="mb-[0.9rem] block text-[1.6rem] text-accent">
                  {cell.icon}
                </span>
              )}
              <h3>{cell.title}</h3>
              <p>{cell.text}</p>
            </div>
          ))}
        </Stagger>
      </Container>
    </Section>
  )
}
