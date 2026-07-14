import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { Stagger } from '@/motion/reveal'
import type { RegistrosBlock as RegistrosBlockType } from '@/payload-types'

/**
 * Faixa discreta de registros/selos, fiel a `.creds`/`.badges` das landings
 * locais do ref (ex.: `_reference/administradora-de-condominios-recife.html:420-429`):
 * texto de apoio à esquerda, selos (CRECI/UF, ABADI, SECOVI, "Desde 1991") à
 * direita — sem imagens, apenas badges com borda. Padding compacto
 * (`!py-*`, mesmo recurso do `HeroBlock`) e borda nas duas bordas, para
 * funcionar como uma faixa de confiança entre blocos, sem competir com eles.
 * `light`/`white` — ver doc do campo em `Registros/config.ts`.
 */
export function RegistrosBlock({ title, light, white, items }: RegistrosBlockType) {
  if (!items || items.length === 0) return null

  return (
    <Section
      light={!!light}
      white={!!white}
      className="!py-[clamp(2.2rem,4.5vw,3.6rem)] border-y border-line"
    >
      <Container className="flex flex-wrap items-center justify-between gap-6">
        {title && <p className="m-0 max-w-[52ch] text-[0.9rem] text-fg-3">{title}</p>}
        <Stagger className="flex flex-wrap items-center gap-3">
          {items.map((item) => (
            <span
              key={item.id ?? item.label}
              className="rounded-input border border-line-strong px-[1.1rem] py-[0.55rem] text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-fg-2"
            >
              {item.label}
            </span>
          ))}
        </Stagger>
      </Container>
    </Section>
  )
}
