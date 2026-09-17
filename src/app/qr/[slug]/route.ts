import { after, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { type Dispositivo, destinoDoQr, dispositivoDoUserAgent, saneiaSlug } from '@/lib/qr'

/**
 * Endereço do QR code impresso — `/qr/<peça>` conta o acesso e redireciona.
 *
 * Existe por dois motivos que só aparecem quando o link está em papel (ver
 * `src/lib/qr.ts` e `db/qr-scans.sql`): o destino continua trocável depois da
 * impressão, e a contagem é do servidor — o rastreador do navegador não
 * sobrevive a bloqueador, modo econômico nem à webview do leitor de QR.
 *
 * Três decisões que parecem detalhe e não são:
 *
 * 1. **302, nunca 301.** Redirecionamento permanente entra no cache do
 *    navegador e do leitor de QR: a partir da segunda leitura o acesso nem
 *    chega aqui, e some tanto a contagem quanto a capacidade de trocar o
 *    destino — que é a razão de a rota existir. O `Cache-Control: no-store`
 *    reforça contra o CDN.
 * 2. **A gravação roda depois da resposta** (`after`, de `next/server`). Quem
 *    escaneia está de pé no evento, com sinal ruim; o redirecionamento não
 *    espera o Postgres, e banco fora não segura nem derruba ninguém — mesma
 *    filosofia best-effort de `/api/track/whatsapp`.
 * 3. **`Location` relativo.** A resposta manda `/?utm_...`, não uma URL
 *    absoluta montada a partir de `req.url`, que atrás de proxy pode trazer
 *    host interno. Assim o visitante permanece exatamente no host que
 *    escaneou, e os cookies de 1ª parte (`semog-attrib`) seguem valendo.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Acesso = {
  slug: string
  conhecido: boolean
  destino: string
  dispositivo: Dispositivo
}

/**
 * Grava a linha em `cms.qr_scans`. Nunca lança: roda fora do caminho da
 * resposta, então uma exceção aqui não teria quem a tratasse — e medição não
 * pode virar erro de produção.
 */
async function registraAcesso(acesso: Acesso): Promise<void> {
  try {
    await query(
      'insert into cms.qr_scans (slug, conhecido, destino, dispositivo) values ($1, $2, $3, $4)',
      [acesso.slug, acesso.conhecido, acesso.destino, acesso.dispositivo],
    )
  } catch (err) {
    console.error('[qr] erro ao gravar acesso:', err)
  }
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug: bruto } = await ctx.params
  const slug = saneiaSlug(bruto)
  const { destino, conhecido } = destinoDoQr(slug)
  const dispositivo = dispositivoDoUserAgent(req.headers.get('user-agent'))

  after(() => registraAcesso({ slug, conhecido, destino, dispositivo }))

  return new NextResponse(null, {
    status: 302,
    headers: {
      Location: destino,
      'Cache-Control': 'no-store',
      // O site roda com `SITE_ALLOW_INDEX=true` e não tem noindex global (ver
      // `next.config.ts`), então a trava é por resposta. Repare que `/qr/` NÃO
      // entra no disallow do `robots.txt` de propósito: bloquear o rastreamento
      // impediria o Google de ler justamente este cabeçalho.
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}
