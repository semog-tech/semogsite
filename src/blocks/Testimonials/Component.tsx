import { ImageMedia } from '@/components/Media/ImageMedia'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/motion/reveal'
import type { TestimonialsBlock as TestimonialsBlockType } from '@/types/blocks'

/**
 * Grid de depoimentos fiel a `.depo-card`/`.depo-grid` das páginas de
 * cidade do ref (ex.: `_reference/administradora-de-condominios-recife.html`,
 * seção "DEPOIMENTOS (claro)"): citação em tipografia display + rodapé de
 * atribuição (`<figcaption>`) com avatar, autor, papel, organização e
 * cidade. `org`/`city`/`rating`/`photo` são opcionais — um item só com
 * `quote`/`author`/`role` (o que as landings de cidade têm hoje) renderiza
 * igual, com a inicial do autor como avatar em vez de foto. Seção clara
 * (`sec-light`), fiel ao `.depo.sec-light` do ref. Cards entram via `Reveal`
 * em cascata.
 *
 * Grade a 3 colunas em telas grandes (`lg:grid-cols-3`) — a home vai ter mais
 * depoimentos que as 2 colunas antigas comportavam bem. Mas com só 1 ou 2
 * itens (as landings de cidade de hoje, com citações longas), 3 colunas
 * deixaria a última vazia e as outras artificialmente estreitas; nesse caso
 * a grade cai pra 2 colunas, igual ao layout anterior.
 */
export function TestimonialsBlock({ eyebrow, title, items, logos }: TestimonialsBlockType) {
  if (!items || items.length === 0) return null

  const gridCols = items.length <= 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'

  return (
    <Section light>
      <Container>
        {(eyebrow || title) && (
          <div className="mb-[clamp(2.5rem,6vw,4.5rem)] max-w-2xl">
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            {title && <h2 className="text-h2">{title}</h2>}
          </div>
        )}
        <div className={`grid grid-cols-1 gap-[1.4rem] ${gridCols}`}>
          {items.map((item, i) => {
            const photo = item.photo && typeof item.photo === 'object' ? item.photo : undefined
            return (
              <Reveal key={item.id ?? item.author} delay={i * 0.08}>
                <figure className="depo-card">
                  {item.rating && (
                    // `role="img"` porque um `span` genérico não aceita nomeação por
                    // `aria-label` (regra de a11y do Biome) — com o role, o valor vira
                    // o texto lido pra leitor de tela, em vez de "estrela estrela...".
                    <span
                      className="depo-stars"
                      role="img"
                      aria-label={`${item.rating} de 5 estrelas`}
                    >
                      {'★'.repeat(item.rating)}
                    </span>
                  )}
                  <blockquote>&ldquo;{item.quote}&rdquo;</blockquote>
                  <figcaption>
                    {photo ? (
                      <ImageMedia
                        resource={photo}
                        className="depo-avatar depo-avatar-photo"
                        sizes="42px"
                      />
                    ) : (
                      <span className="depo-avatar" aria-hidden="true">
                        {item.author.trim().charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span>
                      <b>{item.author}</b>
                      <small>{[item.role, item.org, item.city].filter(Boolean).join(' · ')}</small>
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            )
          })}
        </div>
        {logos && logos.length > 0 && (
          <div className="depo-logos">
            {logos.map((logo) => {
              const img = logo.logo && typeof logo.logo === 'object' ? logo.logo : undefined
              return img ? (
                <ImageMedia key={logo.id ?? logo.name} resource={img} sizes="140px" />
              ) : (
                <span key={logo.id ?? logo.name} className="depo-logo-name">
                  {logo.name}
                </span>
              )
            })}
          </div>
        )}
      </Container>
    </Section>
  )
}
