import type React from 'react'
import '@/site/secoes/leitura/leitura.css'

/**
 * Pacote leitura (spec 3.1): blog, posts, Privacidade e Termos. Rolagem nativa, sem Lenis nem
 * runner de cenas; o único JS é o de LigarLeitura. O resto vem do layout raiz (site).
 */
export default function LayoutLeitura({ children }: { children: React.ReactNode }) {
  return children
}
