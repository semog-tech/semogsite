'use client'
import Link from 'next/link'
import { useState } from 'react'
import { ImageMedia } from '@/components/Media/ImageMedia'
import type { Media } from '@/types/media'

export type CityPanelData = {
  key: string
  city: string
  uf: string
  role?: string | null
  /** Página da unidade (`/administradora-de-condominios-*`). Sem ela o painel só abre. */
  href?: string | null
  image: Media
}

/**
 * Accordion de cidades da seção "Presença" (base: script inline de
 * `_reference/index.html:858-878`): `mouseenter` troca qual painel tem
 * `.is-open` — só sob `pointer:fine`, pra não abrir sozinho com `mouseenter`
 * sintético em touch.
 *
 * Com `href`, o painel inteiro vira link pra página da unidade:
 * - **ponteiro fino** (mouse): passar por cima abre, clicar navega;
 * - **touch**: o 1º toque só abre o painel (o clique é cancelado) e o 2º
 *   navega — senão um toque exploratório levaria embora sem o usuário ter
 *   visto a cidade que abriu;
 * - **teclado**: `focus` abre o painel e Enter navega (comportamento nativo
 *   do link, sem `onKeyDown` próprio).
 *
 * O "Ver a unidade" só aparece no painel aberto (é a dica de que dá pra
 * clicar); painel sem `href` continua sendo `<button>`, que só abre.
 */
export function CitiesAccordion({ items }: { items: CityPanelData[] }) {
  const [openKey, setOpenKey] = useState(items[0]?.key)

  return (
    <>
      {items.map((item) => {
        const isOpen = item.key === openKey
        const className = `city-panel${isOpen ? ' is-open' : ''}`
        const open = () => setOpenKey(item.key)
        const openOnHover = () => {
          if (window.matchMedia('(pointer: fine)').matches) setOpenKey(item.key)
        }

        const inner = (
          <>
            <ImageMedia resource={item.image} fill sizes="(min-width: 860px) 26vw, 100vw" />
            <div className="ci">
              {item.role && <span className="role">{item.role}</span>}
              <h3>{item.city}</h3>
              <span className="uf">{item.uf}</span>
              {item.href && <span className="go">Ver a unidade →</span>}
            </div>
          </>
        )

        return item.href ? (
          <Link
            key={item.key}
            href={item.href}
            className={className}
            aria-label={`Unidade ${item.city} — ${item.uf}`}
            onMouseEnter={openOnHover}
            onFocus={open}
            onClick={(event) => {
              // Touch: 1º toque só abre; a navegação fica pro 2º.
              if (!isOpen && !window.matchMedia('(pointer: fine)').matches) {
                event.preventDefault()
                open()
              }
            }}
          >
            {inner}
          </Link>
        ) : (
          <button
            key={item.key}
            type="button"
            className={className}
            onMouseEnter={openOnHover}
            onClick={open}
          >
            {inner}
          </button>
        )
      })}
    </>
  )
}
