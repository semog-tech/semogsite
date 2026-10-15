import localFont from 'next/font/local'

/**
 * Fontes do site v2, auto-hospedadas (as mesmas do protótipo). O next/font não aceita
 * `unicode-range` por arquivo, então entra só o subset latin, que cobre o português.
 * O nome da família muda no build (ex.: `__Saira_a1b2c3`): o CSS usa as variáveis abaixo
 * e o canvas usa `familiaDaFonte` (src/site/core/util.ts), nunca o nome "Saira".
 */
export const saira = localFont({
  src: './arquivos/Saira-VariableFont_wght-latin.woff2',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
  variable: '--fonte-saira',
})

export const barlow = localFont({
  src: [
    { path: './arquivos/Barlow-300-latin.woff2', weight: '300', style: 'normal' },
    { path: './arquivos/Barlow-400-latin.woff2', weight: '400', style: 'normal' },
    { path: './arquivos/Barlow-500-latin.woff2', weight: '500', style: 'normal' },
    { path: './arquivos/Barlow-600-latin.woff2', weight: '600', style: 'normal' },
  ],
  display: 'swap',
  variable: '--fonte-barlow',
})
