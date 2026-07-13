import type { CSSProperties } from 'react'

/**
 * Dimensões/`contentType` compartilhados pelas rotas `opengraph-image.tsx`
 * (default + por-rota) — usados tanto no segundo argumento de `ImageResponse`
 * quanto nos `export const size`/`contentType` de cada arquivo de rota.
 */
export const OG_SIZE = { width: 1200, height: 630 } as const
export const OG_CONTENT_TYPE = 'image/png' as const

export const OG_SITE_NAME = 'Semog Administradora de Condomínios'
export const OG_TAGLINE = 'Preocupe-se apenas em morar.'

/** Paleta navy/ice da marca (`src/styles/theme.css`, tokens `--color-navy-*`/`--color-ice-*`). */
const NAVY_950 = '#05081a'
const NAVY_900 = '#0a102e'
const NAVY_600 = '#1b2d70'
const ICE_300 = '#d8ecf7'
const ICE_400 = '#add5eb'
const TEXT = '#edf1fa'

/**
 * Radial navy — mesma técnica de `--grad-hero` (`src/styles/theme.css`), mas
 * com o stop principal em `navy-900` (#0A102E, citado no brief) em vez de
 * `navy-850`, pra manter o fundo dominante nesse tom específico; o glow em
 * `navy-600` no canto superior direito e o aprofundamento em `navy-950` no
 * canto oposto seguem a mesma ideia do gradiente da marca.
 */
const OG_BACKGROUND = `radial-gradient(120% 90% at 78% 4%, ${NAVY_600} 0%, ${NAVY_900} 42%, ${NAVY_950} 100%)`

/**
 * Fonte: tentamos embutir `clash-display-600.woff2` via `next/og` `fonts` e o
 * satori/@vercel-og empacotado no Next 16.2.6 rejeita o arquivo
 * (`Error: Unsupported OpenType signature wOF2` — só entende ttf/otf/woff,
 * não woff2, e o repo não tem uma fonte de marca em ttf/otf pra converter sem
 * adicionar uma dependência nova). Fallback limpo: não passamos `fonts`, o
 * que deixa o satori usar a fonte padrão embutida (Geist) — a marca ainda
 * fica reconhecível pela paleta, pelo mark de 3 barras e pelo peso/tamanho
 * do título.
 */
const barStyle: CSSProperties = {
  width: 26,
  height: 68,
  background: ICE_400,
  borderRadius: 4,
}

/** Mark de 3 barras da Semog (proporções de `public/semog-logo-light.svg`). */
function SemogMark() {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <div style={barStyle} />
      <div style={barStyle} />
      <div style={barStyle} />
    </div>
  )
}

/**
 * Tamanho do título ajustado ao comprimento do texto — títulos de doc (CMS)
 * variam bastante e, sem isso, um título longo (ex.: título de post de blog)
 * aperta demais o rodapé do card num container de altura fixa (630px).
 */
function titleFontSize(title: string): number {
  if (title.length <= 20) return 76
  if (title.length <= 40) return 64
  return 52
}

/**
 * Card OG compartilhado (1200×630) — usado pelo OG default e pelos OG
 * por-rota/post. `eyebrow` é o rótulo pequeno acima do título (ex.: "SEMOG",
 * "BLOG"); `subtitle` é opcional (usado só no card default, pra tagline).
 */
export function OgCard({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string
  title: string
  subtitle?: string
}) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px 88px',
        background: OG_BACKGROUND,
        color: TEXT,
        fontFamily: 'sans-serif',
      }}
    >
      <SemogMark />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 980 }}>
        <div style={{ display: 'flex', fontSize: 28, fontWeight: 700, color: ICE_400 }}>
          {eyebrow}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: titleFontSize(title),
            lineHeight: 1.1,
            fontWeight: 700,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div style={{ display: 'flex', fontSize: 32, color: ICE_300 }}>{subtitle}</div>
        )}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 24,
          color: ICE_400,
          opacity: 0.85,
        }}
      >
        <div style={{ display: 'flex' }}>semog.com.br</div>
        <div style={{ display: 'flex' }}>{OG_SITE_NAME}</div>
      </div>
    </div>
  )
}
