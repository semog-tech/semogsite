import type { Metadata } from 'next'
import { EsqueletoLanding } from '@/site/layout/EsqueletoLanding'
import { NaoEncontrada } from '@/site/secoes/nao-encontrada/NaoEncontrada'

/** O `<head>` da 404: título próprio, nunca indexado (o Next também põe noindex no status 404). */
export const METADADOS_DA_404: Metadata = {
  title: 'Página não encontrada · Semog',
  // TEXTO-NOVO: a descrição do protótipo dizia "não existe mais".
  description:
    'Não encontramos este endereço. Siga para a página inicial, as Unidades Semog, o pedido de proposta, o blog ou o contato.',
  robots: { index: false, follow: false },
}

/** Corpo da 404 do site v2 (pacote landing). */
export function PaginaNaoEncontrada() {
  return (
    <EsqueletoLanding pagina="nao-encontrada">
      <NaoEncontrada />
    </EsqueletoLanding>
  )
}
