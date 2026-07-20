import type { ReactNode } from 'react'

type Variant = 'ice' | 'brand'

const variants: Record<Variant, string> = {
  ice: 'gx-ice',
  brand: 'gx',
}

/**
 * Fiel a semog.css:117-126 (.gx/.gx-ice, utilitários já portados para
 * src/styles/theme.css @layer utilities na Task 1). `.gx` = gradiente da
 * marca para fundos claros; `.gx-ice` = para fundos escuros (default, já
 * que o tema padrão do site é escuro).
 */
export function GradientText({
  children,
  variant = 'ice',
  className = '',
}: {
  children: ReactNode
  variant?: Variant
  className?: string
}) {
  return <span className={`${variants[variant]} ${className}`}>{children}</span>
}
