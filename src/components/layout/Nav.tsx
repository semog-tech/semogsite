'use client'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { Header } from '@/payload-types'

type NavItem = NonNullable<Header['navItems']>[number]
type Cta = { label?: string | null; href?: string | null }
type ClientArea = { label?: string | null; href?: string | null }

/**
 * Ilha client da navegação — fiel a `_reference/index.html` (nav) e a
 * `_reference/assets/js/semog.js`:
 *  - fundo ao rolar: `.nav.is-scrolled` quando `scrollY > 24` (semog.js:19-27,
 *    listener passivo, só toggle de classe);
 *  - menu mobile: burger com `aria-expanded` + `.nav-mobile.is-open` e trava do
 *    scroll do body (semog.js:31-47), fechando ao navegar;
 *  - página ativa: `aria-current="page"` no link cujo `href` bate com
 *    `usePathname()`, fiel a `.nav-links a[aria-current="page"]`
 *    (semog.css:260-261, sublinhado igual ao `:hover`) — a regra já existia
 *    em theme.css, só faltava o Nav marcar o link ativo.
 *
 * A pílula usa o material `liquid-glass` real do reference (semog.css:204-232),
 * não o `backdrop-blur-md` aproximado. Estrutura/CSS em src/styles/theme.css.
 *
 * `clientArea` é o botão secundário "Área do cliente" (global `header`,
 * `src/globals/Header.ts`), renderizado ao lado do `cta` primário — `.nav-actions`
 * embrulha os dois no desktop (`.nav-mobile-actions` no menu mobile). Sempre
 * abre em nova aba (link externo pro portal Superlógica), daí `variant="ghost"`
 * (não compete visualmente com o `cta` primário) + `target="_blank" rel="noopener
 * noreferrer"` fixos aqui, não vindos do CMS.
 */
export function Nav({
  navItems,
  cta,
  clientArea,
  logoSrc,
}: {
  navItems: NavItem[]
  cta: Cta
  clientArea: ClientArea
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
  const hasClientArea = Boolean(clientArea.label && clientArea.href)

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
                  <a href={item.href} aria-current={pathname === item.href ? 'page' : undefined}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          {(hasClientArea || hasCta) && (
            <div className="nav-actions">
              {hasClientArea && clientArea.href && (
                <Button
                  href={clientArea.href}
                  variant="ghost"
                  size="sm"
                  magnetic={false}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nav-secondary"
                >
                  {clientArea.label}
                </Button>
              )}
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
            </div>
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
          <a
            key={item.id ?? item.href}
            href={item.href}
            aria-current={pathname === item.href ? 'page' : undefined}
            onClick={() => setOpen(false)}
          >
            {item.label}
          </a>
        ))}
        {(hasClientArea || hasCta) && (
          <div className="nav-mobile-actions">
            {hasClientArea && clientArea.href && (
              <Button
                href={clientArea.href}
                variant="ghost"
                magnetic={false}
                target="_blank"
                rel="noopener noreferrer"
              >
                {clientArea.label}
              </Button>
            )}
            {hasCta && cta.href && (
              <Button href={cta.href} variant="primary" magnetic={false}>
                {cta.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  )
}
