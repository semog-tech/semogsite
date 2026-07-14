'use client'
import { useState } from 'react'
import { ImageMedia } from '@/components/Media/ImageMedia'
import type { Media } from '@/payload-types'

export type CityPanelData = {
  key: string
  city: string
  uf: string
  role?: string | null
  image: Media
}

/**
 * Fiel ao script inline de `_reference/index.html:858-878` ("Accordion de
 * cidades: hover no desktop, toque no mobile"): `mouseenter` troca qual
 * painel tem `.is-open` (só sob `pointer:fine`, pra não abrir sozinho com
 * `mouseenter` sintético em touch); `<button>` nativo cobre o toque/teclado
 * — sem `href` no bloco (fora de escopo), o clique só abre, nunca navega.
 * O painel "Matriz" começa aberto, como `city-panel hq is-open` no ref.
 */
export function CitiesAccordion({ items }: { items: CityPanelData[] }) {
  const initial = items.find((item) => item.role?.toLowerCase() === 'matriz') ?? items[0]
  const [openKey, setOpenKey] = useState(initial?.key)

  return (
    <>
      {items.map((item) => {
        const isHq = item.role?.toLowerCase() === 'matriz'
        const isOpen = item.key === openKey
        return (
          <button
            key={item.key}
            type="button"
            className={`city-panel${isHq ? ' hq' : ''}${isOpen ? ' is-open' : ''}`}
            onMouseEnter={() => {
              if (window.matchMedia('(pointer: fine)').matches) setOpenKey(item.key)
            }}
            onClick={() => setOpenKey(item.key)}
          >
            <ImageMedia resource={item.image} fill sizes="(min-width: 860px) 26vw, 100vw" />
            <div className="ci">
              {item.role && <span className="role">{item.role}</span>}
              <h3>{item.city}</h3>
              <span className="uf">{item.uf}</span>
            </div>
          </button>
        )
      })}
    </>
  )
}
