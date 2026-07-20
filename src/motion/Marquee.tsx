import type { ReactNode } from 'react'

/**
 * Fiel a semog.css:432-434 (`.marquee`/`.marquee-track`/`@keyframes
 * marquee`). Faixa infinita 100% CSS (`translateX(-50%)`, 20s linear
 * infinite) — os itens são duplicados para o loop ficar contínuo, igual ao
 * markup de `.values-strip`/`.g-ticker` do reference (`_reference/index.html:540-547`,
 * `_reference/garante.html:295-301`). Roda sempre, mesmo sob reduced-motion:
 * "marquee roda sempre: é parte da identidade da página" (semog.css:435,
 * semog.js:11-14). Sem estado/efeitos → não precisa ser client component.
 * O conteúdo é decorativo/duplicado: a faixa inteira é `aria-hidden`.
 */
export function Marquee({
  items,
  className,
}: {
  items: ReactNode[] | string[]
  className?: string
}) {
  const track = [...items, ...items]
  return (
    <div className={className ? `marquee ${className}` : 'marquee'} aria-hidden="true">
      <div className="marquee-track">
        {track.map((item, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: itens duplicados e estáticos, sem reordenação
          <span key={i}>{item}</span>
        ))}
      </div>
    </div>
  )
}
