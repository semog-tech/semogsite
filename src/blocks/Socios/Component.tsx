import { ImageMedia } from '@/components/Media/ImageMedia'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/motion/reveal'
import type { Media, SociosBlock as SociosBlockType } from '@/payload-types'

/**
 * Fiel à seção "Empresa humana" de `_reference/semog.html` (`.founders`):
 * label (`Eyebrow`, substitui `.frame-head .lbl` — mesmo padrão de
 * eyebrow usado em `PrestacaoBlock`/`GaranteBlock`) + `.founders-grid`
 * (`Reveal dir="left"`: título + texto + `.f-feats` hover-rows;
 * `Reveal dir="right"`: `.founders-media` com imagem + legenda
 * `.cap.liquid-glass`). CSS portada em `theme.css`.
 */
export function SociosBlock({ eyebrow, title, text, items, image, caption }: SociosBlockType) {
  const media = image && typeof image === 'object' ? (image as Media) : undefined
  if (!media || !items || items.length === 0) return null

  return (
    <Section light white className="founders">
      <Container>
        {eyebrow && (
          <Reveal className="mb-[clamp(2.5rem,5vw,4rem)] border-t border-line pt-[1.1rem]">
            <Eyebrow>{eyebrow}</Eyebrow>
          </Reveal>
        )}
        <div className="founders-grid">
          <Reveal dir="left">
            <h2>{title}</h2>
            {text && <p className="max-w-[48ch] text-fg-2">{text}</p>}
            <div className="f-feats">
              {items.map((item) => (
                <div key={item.id ?? item.title}>
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal dir="right" className="founders-media">
            <ImageMedia resource={media} sizes="(min-width: 861px) 50vw, 100vw" />
            {caption && <span className="cap liquid-glass">{caption}</span>}
          </Reveal>
        </div>
      </Container>
    </Section>
  )
}
