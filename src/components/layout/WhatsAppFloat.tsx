import { site } from '@/../content/site'
import { TriagemWhatsApp } from '@/components/triagem/TriagemWhatsApp'

/**
 * Botão flutuante do WhatsApp (semog.css:467-478), fiel ao markup de
 * `_reference/index.html`. O número vem do global `company` de
 * `content/site.ts` (Fase 2 — fora do CMS, sem `findGlobal`/banco).
 *
 * Desde a triagem (06/10/2026), o botão abre um menu de três caminhos —
 * cliente, proposta, outro assunto — em vez de levar todo mundo à mesma fila.
 * O link direto continua sendo o HTML do servidor: sem JavaScript, o botão
 * segue abrindo o WhatsApp (ver `TriagemWhatsApp`).
 */
export async function WhatsAppFloat() {
  return <TriagemWhatsApp whatsappHref={`https://wa.me/${site.company.whatsapp}`} />
}
