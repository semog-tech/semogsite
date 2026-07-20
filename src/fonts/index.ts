import localFont from 'next/font/local'

export const clash = localFont({
  variable: '--font-clash',
  display: 'swap',
  src: [
    { path: './files/clash-display-400.woff2', weight: '400', style: 'normal' },
    { path: './files/clash-display-500.woff2', weight: '500', style: 'normal' },
    { path: './files/clash-display-600.woff2', weight: '600', style: 'normal' },
  ],
})

export const satoshi = localFont({
  variable: '--font-satoshi',
  display: 'swap',
  src: [
    { path: './files/satoshi-400.woff2', weight: '400', style: 'normal' },
    { path: './files/satoshi-500.woff2', weight: '500', style: 'normal' },
    { path: './files/satoshi-700.woff2', weight: '700', style: 'normal' },
  ],
})
