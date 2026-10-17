import type { Metadata } from 'next'
import { METADADOS_DA_404, PaginaNaoEncontrada } from '@/site/paginas/nao-encontrada'

export const metadata: Metadata = METADADOS_DA_404

/**
 * 404 do site v2 (DP10 do plano da fase 4): atende todo `notFound()` do (site), inclusive a prévia
 * fechada em produção. A 404 de URL desconhecida do site inteiro continua a do (frontend) até a
 * virada, que decide entre global-not-found e o catch-all.
 */
export default function NaoEncontradaDoSite() {
  return <PaginaNaoEncontrada />
}
