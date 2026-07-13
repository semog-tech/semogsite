import Link from 'next/link'
import type { ReactNode } from 'react'

type Variant = 'primary' | 'ghost' | 'white' | 'glass'
type Size = 'md' | 'lg' | 'sm'

const base =
  'group inline-flex items-center justify-center gap-2.5 rounded-pill font-semibold leading-none whitespace-nowrap border border-transparent transition-[transform,box-shadow,background,color,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98]'
const sizes: Record<Size, string> = {
  md: 'px-8 py-[0.95rem] text-[0.98rem]',
  lg: 'px-[2.6rem] py-[1.15rem] text-[1.05rem]',
  sm: 'px-[1.4rem] py-[0.7rem] text-[0.88rem]',
}
/**
 * Rota interna = começa com `/` e não com `//` (protocol-relative) e não
 * contém `:` (descarta `mailto:`, `tel:`, `https:` etc. — nenhuma rota
 * interna legítima tem `:` no path).
 */
function isInternalHref(href: string): boolean {
  return href.startsWith('/') && !href.startsWith('//') && !href.includes(':')
}

const variants: Record<Variant, string> = {
  primary:
    'bg-ice-400 text-navy-900 shadow-[0_8px_30px_-10px_rgba(173,213,235,0.45)] hover:bg-ice-300 hover:-translate-y-0.5 hover:shadow-[0_14px_40px_-12px_rgba(173,213,235,0.55)]',
  ghost:
    'bg-ice-400/5 border-line-strong text-fg hover:border-ice-400 hover:bg-ice-400/10 hover:-translate-y-0.5',
  white:
    'bg-white text-navy-950 shadow-[0_10px_34px_-12px_rgba(255,255,255,0.35)] hover:bg-silver-100 hover:-translate-y-0.5',
  glass: 'text-fg border-white/20 hover:bg-white hover:text-navy-950 hover:-translate-y-0.5',
}

/**
 * Fiel a semog.css:288-330 (.btn/.btn-primary/.btn-ghost/.btn-lg/.btn-sm/.arr)
 * e :519-530 (.btn-white/.btn-glass). Renderiza `<a>` quando `href` é passado,
 * senão `<button type="button">`.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  withArrow,
  onClick,
  className = '',
  type = 'button',
  disabled,
}: {
  children: ReactNode
  variant?: Variant
  size?: Size
  href?: string
  withArrow?: boolean
  onClick?: () => void
  className?: string
  /** Só se aplica ao `<button>` (sem `href`) — ex.: `submit` num `<form>` de RHF. */
  type?: 'button' | 'submit'
  disabled?: boolean
}) {
  const cls = `${base} ${sizes[size]} ${variants[variant]} ${disabled ? 'pointer-events-none opacity-50' : ''} ${className}`
  const inner = (
    <>
      {children}
      {withArrow && (
        <span
          aria-hidden="true"
          className="transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1"
        >
          →
        </span>
      )}
    </>
  )
  if (href) {
    return isInternalHref(href) ? (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    ) : (
      <a className={cls} href={href}>
        {inner}
      </a>
    )
  }
  return (
    <button className={cls} onClick={onClick} type={type} disabled={disabled}>
      {inner}
    </button>
  )
}
