import { getPayloadClient } from '@/lib/payload'

/**
 * Número da matriz (Recife) do botão flutuante em `_reference/index.html` —
 * usado quando o global `company` está vazio ou inacessível (rota sem banco).
 */
const FALLBACK_WHATSAPP = '5581999999999'

async function getWhatsapp(): Promise<string> {
  try {
    const payload = await getPayloadClient()
    const company = await payload.findGlobal({ slug: 'company' })
    return company?.whatsapp || FALLBACK_WHATSAPP
  } catch {
    // Sem banco de dados (ex.: rota /styleguide sem .env) — segue com o fallback.
    return FALLBACK_WHATSAPP
  }
}

/**
 * Botão flutuante do WhatsApp (semog.css:467-478), fiel ao markup de
 * `_reference/index.html`. O número é editável via global `company` (campo
 * `whatsapp`) — nunca hardcoded no componente.
 */
export async function WhatsAppFloat() {
  const whatsapp = await getWhatsapp()

  return (
    <a className="wa-float" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4 0-.5.1-.7l.4-.5c.1-.2.1-.3 0-.5-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3a2.8 2.8 0 0 0-.9 2.1c0 1.2.9 2.4 1 2.6.1.2 1.8 2.7 4.3 3.8.6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2 0-.1-.2-.2-.4-.3Z" />
      </svg>
      <span className="sr-only">Falar com a Semog no WhatsApp</span>
    </a>
  )
}
