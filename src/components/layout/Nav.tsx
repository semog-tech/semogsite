'use client'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { Header } from '@/payload-types'

type NavItem = NonNullable<Header['navItems']>[number]
type Cta = { label?: string | null; href?: string | null }

/**
 * Ilha client da navegação — fiel a `_reference/index.html` (nav) e a
 * `_reference/assets/js/semog.js`:
 *  - fundo ao rolar: `.nav.is-scrolled` quando `scrollY > 24` (semog.js:19-27,
 *    listener passivo, só toggle de classe);
 *  - menu mobile: burger com `aria-expanded` + `.nav-mobile.is-open` e trava do
 *    scroll do body (semog.js:31-47), fechando ao navegar.
 *
 * A pílula usa o material `liquid-glass` real do reference (semog.css:204-232),
 * não o `backdrop-blur-md` aproximado. Estrutura/CSS em src/styles/theme.css.
 */
export function Nav({
  navItems,
  cta,
  logoSrc,
}: {
  navItems: NavItem[]
  cta: Cta
  logoSrc: string
}) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Fundo ao rolar (semog.js:19-27) — passivo, apenas toggle de classe.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Trava o scroll do body enquanto o menu mobile está aberto (semog.js:38).
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Fecha o menu ao navegar (equivale ao close-on-click de semog.js:40-46).
  // biome-ignore lint/correctness/useExhaustiveDependencies: fechar em cada troca de rota é o efeito desejado.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const hasCta = Boolean(cta.label && cta.href)

  return (
    <>
      <header className={scrolled ? 'nav is-scrolled' : 'nav'}>
        <div className="nav-inner liquid-glass">
          <a href="/" className="nav-logo" aria-label="Semog, página inicial">
            {/* biome-ignore lint/performance/noImgElement: sem next/image (localPatterns não cobre /public fora de /api/media) */}
            <img src={logoSrc} alt="Semog" width={140} height={22} />
          </a>
          <nav aria-label="Principal">
            <ul className="nav-links">
              {navItems.map((item) => (
                <li key={item.id ?? item.href}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
          </nav>
          {hasCta && cta.href && (
            <Button
              href={cta.href}
              variant="primary"
              size="sm"
              magnetic={false}
              className="nav-cta"
            >
              {cta.label}
            </Button>
          )}
          <button
            type="button"
            className="nav-burger"
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>
      <div className={open ? 'nav-mobile is-open' : 'nav-mobile'} id="menu-mobile">
        {navItems.map((item) => (
          <a key={item.id ?? item.href} href={item.href} onClick={() => setOpen(false)}>
            {item.label}
          </a>
        ))}
        {hasCta && cta.href && (
          <Button href={cta.href} variant="primary" magnetic={false} className="btn">
            {cta.label}
          </Button>
        )}
      </div>
    </>
  )
}
