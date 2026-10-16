import type { CSSProperties } from 'react'

/** `style="--i: N"` do protótipo: o índice que escalona a entrada de CSS de cada item. */
export function comIndice(i: number): CSSProperties {
  // `as`: CSSProperties não lista variáveis CSS; o React aplica a chave '--i' como custom property.
  return { '--i': i } as CSSProperties
}
