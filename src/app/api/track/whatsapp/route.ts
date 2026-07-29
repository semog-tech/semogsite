import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { ATTRIBUTION_COOKIE, parseAttributionCookie } from '@/lib/attribution'
import { query } from '@/lib/db'

/**
 * Beacon do clique no WhatsApp — registro **server-side**, à prova de ad-block.
 *
 * Por quê: o WhatsApp é o canal de contato dominante do site (GA4, 24-29/07/2026
 * com tracking limpo: 14 `whatsapp_click` × 5 `generate_lead`; no pago, 7 × 1),
 * mas existia só como evento de navegador — sumia com ad-blocker e nunca virava
 * conversão no Google Ads. A campanha aparentava 1 resultado tendo gerado ~8
 * contatos. Aqui o clique vira linha em `cms.whatsapp_clicks`, e o cron
 * `upload-ads-conversions` sobe os que têm `gclid` como conversão.
 *
 * O `gclid` **não vem do cliente**: é lido aqui do cookie de 1ª parte
 * `semog-attrib` (mesma fonte que o formulário usa), então o corpo do beacon
 * não é confiável pra atribuição — só carrega página e seção, e ambos são
 * saneados. Não grava nada de pessoal: o clique acontece antes da conversa.
 *
 * Responde 204 sempre que o pedido é bem-formado (inclusive quando não há
 * gclid) — é um beacon: o `sendBeacon` não lê a resposta e o clique do usuário
 * nunca pode ser prejudicado por uma falha de medição. Erro de banco é logado
 * e engolido pelo mesmo motivo.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Só aceita beacon vindo do próprio site (o header vai no `sendBeacon`). */
const ALLOWED_ORIGIN = /^https:\/\/([a-z0-9-]+\.)*semog\.com\.br$/

const SECTIONS = new Set(['botao_flutuante', 'cabecalho', 'rodape', 'conteudo'])

/** Recorta e limpa: só pathname, sem query/hash, limitado no tamanho. */
function sanitizePage(value: unknown): string | null {
  if (typeof value !== 'string' || !value.startsWith('/')) return null
  return value.split(/[?#]/)[0].slice(0, 200)
}

export async function POST(req: Request): Promise<Response> {
  const origin = req.headers.get('origin')
  if (origin && !ALLOWED_ORIGIN.test(origin)) {
    return new NextResponse(null, { status: 403 })
  }

  let page: string | null = null
  let section: string | null = null
  try {
    const body = (await req.json()) as Record<string, unknown>
    page = sanitizePage(body.page)
    const raw = typeof body.section === 'string' ? body.section : ''
    section = SECTIONS.has(raw) ? raw : null
  } catch {
    // corpo ilegível: ainda vale registrar o clique, só sem contexto
  }

  try {
    const jar = await cookies()
    const attr = parseAttributionCookie(jar.get(ATTRIBUTION_COOKIE)?.value)
    // Mesma precedência do formulário: first-touch manda; last-touch é o
    // fallback (entrou orgânico numa visita, voltou pelo anúncio e clicou).
    const gclid = attr?.first?.gclid ?? attr?.last?.gclid ?? null

    await query(
      'insert into cms.whatsapp_clicks (gclid, page, section) values ($1, $2, $3)',
      [gclid, page, section],
    )
  } catch (err) {
    // Medição nunca derruba a experiência: loga e segue.
    console.error('[api/track/whatsapp] erro ao gravar clique:', err)
  }

  return new NextResponse(null, { status: 204 })
}
