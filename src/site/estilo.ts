import type { CSSProperties } from 'react'

/** `style="--i: N"` do protótipo: o índice que escalona a entrada de CSS de cada item. */
export function comIndice(i: number): CSSProperties {
  // `as`: CSSProperties não lista variáveis CSS; o React aplica a chave '--i' como custom property.
  return { '--i': i } as CSSProperties
}

/** `style="--x: N; --y: M"` do protótipo: variáveis CSS de posição (o esquema da costa). */
export function comVariaveis(variaveis: Readonly<Record<`--${string}`, number>>): CSSProperties {
  // `as`: CSSProperties não lista variáveis CSS; o React aplica cada chave '--x' como custom property.
  return { ...variaveis } as CSSProperties
}
