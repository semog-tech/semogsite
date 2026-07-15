'use client'
import { type CSSProperties, type ElementType, type Ref, useEffect, useRef } from 'react'

const CHAR_DELAY = 30
const START = 200

/**
 * Fiel a semog.js:49-87 (`splitChars`, `[data-chars]`). Roda sempre, mesmo
 * sob reduced-motion — a headline por caractere é a demo de motion do hero,
 * não um efeito pesado desativável (semog.js:11-15). Independe de GSAP: usa
 * apenas transição CSS (`[data-chars] .ch` em `src/styles/theme.css`),
 * igual ao original ("Animação por caractere (independe de GSAP)").
 *
 * `children` aceita `\n` como quebra de linha forçada — fiel ao `<br>`
 * literal do `<h1 data-chars>` de `_reference/index.html:491`
 * ("Preocupe-se apenas<br>em morar."), o único hero do ref com quebra
 * manual (as outras páginas quebram naturalmente via `max-width`/
 * `font-size`, ver `Hero/Component.tsx`). Sem `\n` (caso comum), o
 * comportamento é idêntico ao anterior.
 */
export function Chars({
  children,
  as: Tag = 'h1',
  className,
  style,
}: {
  children: string
  as?: ElementType
  className?: string
  style?: CSSProperties
}) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const text = children.trim()
    el.setAttribute('aria-label', text.replace(/\n/g, ' '))

    let idx = 0
    const frag = document.createDocumentFragment()
    const lines = text.split('\n')
    lines.forEach((line, lineIdx) => {
      line.split(/(\s+)/).forEach((part) => {
        if (!part) return
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(' '))
          return
        }
        const word = document.createElement('span')
        word.style.display = 'inline-block'
        word.style.whiteSpace = 'nowrap'
        part.split('').forEach((c) => {
          const ch = document.createElement('span')
          ch.className = 'ch'
          ch.textContent = c
          ch.style.setProperty('--d', `${START + idx * CHAR_DELAY}ms`)
          idx++
          word.appendChild(ch)
        })
        frag.appendChild(word)
      })
      if (lineIdx < lines.length - 1) {
        frag.appendChild(document.createElement('br'))
      }
    })
    el.replaceChildren(frag)

    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        el.classList.add('is-in')
      })
    })
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [children])

  return (
    <Tag ref={ref as Ref<HTMLElement>} data-chars className={className} style={style}>
      {children}
    </Tag>
  )
}
