/**
 * Verifica um token do Cloudflare Turnstile (widget client, ver
 * `src/components/forms/Turnstile.tsx`) contra o endpoint `siteverify` da
 * Cloudflare.
 *
 * **Nunca lança**: chamadores (Server Action/rota de submissão de formulário)
 * precisam de um `boolean` simples, sem try/catch extra. Falha **fechada**
 * (retorna `false`) em qualquer cenário de erro:
 * - `TURNSTILE_SECRET_KEY` ausente (comum antes de configurar o env em algum
 *   ambiente) — não faz sentido chamar a Cloudflare sem secret.
 * - erro de rede/timeout/resposta inesperada da Cloudflare.
 *
 * Em dev, a `TURNSTILE_SECRET_KEY` de TESTE da Cloudflare
 * (`1x0000000000000000000000000000000AA`) sempre retorna `success: true`,
 * então o fluxo continua funcionando sem precisar de chaves reais.
 */
export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY

  if (!secret) {
    console.error('[turnstile] TURNSTILE_SECRET_KEY ausente — falha fechada (verify=false)')
    return false
  }

  try {
    const body = new URLSearchParams({ secret, response: token })
    if (ip) {
      body.set('remoteip', ip)
    }

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })

    const data = (await res.json()) as { success?: boolean }
    return data.success === true
  } catch (err) {
    console.error('[turnstile] erro ao chamar siteverify:', err)
    return false
  }
}
