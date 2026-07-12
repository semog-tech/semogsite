import type React from 'react'
import { clash, satoshi } from '../../fonts'
import '../../styles/theme.css'

export const metadata = {
  description: 'A blank template using Payload in a Next.js app.',
  title: 'Payload Blank Template',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html className={`${clash.variable} ${satoshi.variable}`} lang="pt-BR">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
