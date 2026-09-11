import Image from 'next/image'
import type { CSSProperties } from 'react'
import type { Media } from '@/types/media'

type Props = {
  resource?: Media | string | null
  className?: string
  sizes?: string
  priority?: boolean
  /**
   * Dica de prioridade de rede do elemento (`fetchpriority` no `<img>` e no
   * `<link rel=preload>` que o `priority` gera). Precisa ser passada à mão: no
   * Next 16 o `priority` só antecipa a DESCOBERTA da imagem (emite o preload e
   * desliga o lazy) — ele não marca mais o `fetchpriority` do elemento, como
   * fazia nas versões anteriores. Medido em produção (11/09/2026): o hero de
   * `/solucoes` e `/semog` é o elemento de LCP e chegava ao navegador sem
   * prioridade nenhuma, disputando banda em pé de igualdade com o resto.
   * Usar só onde a imagem É o LCP — marcar tudo equivale a não marcar nada.
   */
  fetchPriority?: 'high' | 'low' | 'auto'
  fill?: boolean
  style?: CSSProperties
}

export function ImageMedia({
  resource,
  className,
  sizes,
  priority,
  fetchPriority,
  fill,
  style,
}: Props) {
  if (!resource || typeof resource === 'string') return null
  const { url, alt, width, height } = resource
  if (!url) return null
  if (fill)
    return (
      <Image
        src={url}
        alt={alt ?? ''}
        fill
        sizes={sizes}
        priority={priority}
        fetchPriority={fetchPriority}
        className={className}
        style={style}
      />
    )
  return (
    <Image
      src={url}
      alt={alt ?? ''}
      width={width ?? 1200}
      height={height ?? 800}
      sizes={sizes}
      priority={priority}
      fetchPriority={fetchPriority}
      className={className}
      style={style}
    />
  )
}
