import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Section } from '@/components/ui/Section'
import { Stagger } from '@/motion/reveal'
import type { ContactInfoBlock as ContactInfoBlockType } from '@/payload-types'

/**
 * Cartões de unidade fiel à seção "Unidades" (`.unit`,
 * `_reference/contato.html:270-338`): UF + cidade + endereço + telefone por
 * card — sem foto (as fotos `recife.webp`/`joao-pessoa.webp` etc. do ref
 * entram depois, com S3). `whatsapp` opcional liga um botão de contato
 * rápido para `https://wa.me/<whatsapp>`, mesmo número do
 * `.quick-card`/`.wa-float` do ref.
 */
export function ContactInfoBlock({ eyebrow, title, items, whatsapp }: ContactInfoBlockType) {
  if (!items || items.length === 0) return null

  return (
    <Section>
      <Container>
        <div className="mb-[clamp(2.5rem,6vw,4.5rem)] flex flex-wrap items-end justify-between gap-6">
          {(eyebrow || title) && (
            <div className="max-w-2xl">
              {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
              {title && <h2 className="text-h2">{title}</h2>}
            </div>
          )}
          {whatsapp && (
            <Button href={`https://wa.me/${whatsapp}`} variant="primary" size="md" withArrow>
              Falar no WhatsApp
            </Button>
          )}
        </div>
        <Stagger className="grid grid-cols-1 gap-[1.4rem] sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <div key={item.id ?? item.city} className="rounded-card border border-line p-[1.8rem]">
              <span className="mb-3 block text-[0.78rem] font-semibold uppercase tracking-[0.1em] text-accent">
                {item.uf}
              </span>
              <h3 className="text-[1.2rem]">{item.city}</h3>
              <p className="mt-3 mb-1 text-[0.9rem] text-fg-2">{item.address}</p>
              <p className="m-0 text-[0.9rem] text-fg-3">{item.phone}</p>
            </div>
          ))}
        </Stagger>
      </Container>
    </Section>
  )
}
