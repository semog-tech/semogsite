import Image from 'next/image'
import type { CSSProperties } from 'react'
import type { Media } from '@/payload-types'

type Props = {
  resource?: Media | string | null
  className?: string
  sizes?: string
  priority?: boolean
  fill?: boolean
  style?: CSSProperties
}

export function ImageMedia({ resource, className, sizes, priority, fill, style }: Props) {
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
      className={className}
      style={style}
    />
  )
}
