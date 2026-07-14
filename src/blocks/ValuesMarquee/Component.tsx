import { Marquee } from '@/motion/Marquee'
import type { ValuesMarqueeBlock as ValuesMarqueeBlockType } from '@/payload-types'

/**
 * Fiel à `.values-strip` de `_reference/index.html:541-548`: envolve o
 * `Marquee` (`src/motion/Marquee.tsx`) numa faixa com borda em cima/embaixo e
 * fundo `bg-deep`. Igual ao ref, a faixa inteira é decorativa (`aria-hidden`)
 * e o track tem a frase completa repetida — por isso passamos um único item
 * (a frase montada com o separador), que o `Marquee` duplica para o loop
 * contínuo. Tipografia via `.values-strip .marquee-track span` (theme.css).
 */
export function ValuesMarqueeBlock({ items, separator }: ValuesMarqueeBlockType) {
  if (!items || items.length === 0) return null
  const sep = `   ${separator ?? '/'}   `
  const phrase = `${items.join(sep)}${sep}`

  return (
    <div className="values-strip" aria-hidden="true">
      <Marquee items={[phrase]} />
    </div>
  )
}
