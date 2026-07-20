'use client'
import { type ElementType, type Ref, useEffect, useRef } from 'react'
import { gsap } from './gsap'
import { useReducedHeavy } from './useReducedHeavy'

/**
 * `children` só aceita texto puro OU `<em>...</em>` (sem outras tags) — o
 * marcador de destaque usado pelo ref em `[data-words]`/blockquotes
 * (`.argument .big em`/`.manifesto .big em`/`.dev-quote blockquote em`,
 * cor `--ice-400`). Nunca vem de input de usuário (só de `text`/`quote` do
 * CMS, escrito por quem edita o conteúdo), por isso é seguro tratar como
 * HTML confiável, igual ao próprio `_reference` (`<p data-words>...<em>...
 * </em></p>`).
 */
function stripEm(html: string): string {
  return html.replace(/<\/?em>/g, '')
}

/**
 * Fiel a semog.js:178-197 ([data-words]). Roda sempre — só troca de
 * comportamento: scrub palavra-a-palavra no modo normal, ou revelação em
 * bloco (once) sob reduced-motion, que desativa apenas o scrub pesado.
 *
 * Preserva `<em>` embutido em `children` (ver `stripEm` acima): cada
 * `.wd` cuja palavra caía dentro do `<em>` do texto original recebe seu
 * próprio `<em>` interno, então os seletores do ref (`.argument .big em`
 * etc., já portados em theme.css) continuam funcionando — a árvore só tem
 * um `.wd` a mais no meio, o que não quebra um combinador descendente. Sem
 * `<em>` no texto (caso comum), o comportamento é idêntico ao anterior.
 */
export function Words({
  children,
  as: Tag = 'p',
  className,
}: {
  children: string
  as?: ElementType
  className?: string
}) {
  const ref = useRef<HTMLElement>(null)
  const reduceHeavy = useReducedHeavy()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const raw = children.trim()
    const srText = stripEm(raw)

    // Tokeniza preservando o estado "dentro de <em>?" por trecho, pra poder
    // envolver cada palavra emphasized no seu próprio <em> depois de
    // quebrada em .wd — igual à ideia de semog.js:179-183, só que sem
    // descartar a marcação.
    const parts = raw.split(/(<\/?em>)/)
    let emphasized = false
    const wordsHtml: string[] = []
    for (const part of parts) {
      if (part === '<em>') {
        emphasized = true
        continue
      }
      if (part === '</em>') {
        emphasized = false
        continue
      }
      if (!part) continue
      for (const w of part.split(/\s+/)) {
        if (!w) continue
        const inner = emphasized ? `<em>${w}</em>` : w
        wordsHtml.push(`<span class="wd" aria-hidden="true" style="opacity:0.14;">${inner}</span>`)
      }
    }

    el.innerHTML = `<span class="sr-only">${srText}</span>${wordsHtml.join(' ')}`
    const words = el.querySelectorAll('.wd')

    const tween = reduceHeavy
      ? gsap.to(words, {
          opacity: 1,
          duration: 0.8,
          stagger: 0.02,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top 80%', once: true },
        })
      : gsap.to(words, {
          opacity: 1,
          stagger: 0.06,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top 82%', end: 'top 30%', scrub: 0.6 },
        })

    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [children, reduceHeavy])

  return (
    <Tag
      ref={ref as Ref<HTMLElement>}
      className={className}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: markup confiável e fixo (só `<em>`, escrito por quem edita o CMS — ver doc de `stripEm` acima), necessário pro <em> renderizar como elemento (não texto escapado) antes do useEffect rodar (SSR/no-js).
      dangerouslySetInnerHTML={{ __html: children }}
    />
  )
}
