import { render } from '@react-email/render'
import sgMail from '@sendgrid/mail'
import type { ReactElement } from 'react'

export type SendMailArgs = {
  to: string
  /** Remetente; se omitido cai no fallback `SENDGRID_FROM` (sender verificado no SendGrid). */
  from?: string
  subject: string
  react: ReactElement
}

export type SendMailResult = { ok: boolean; skipped?: boolean; error?: string }

/**
 * Envia um React Email via SendGrid. **Nunca lança** — chamadores (rota de
 * submissão de formulário) precisam ter sucesso mesmo se o e-mail falhar ou
 * se a integração ainda não estiver configurada (sem `SENDGRID_API_KEY`,
 * comum em dev/preview antes da chave de produção existir).
 *
 * Sem `SENDGRID_API_KEY`: no-op logado, retorna `{ ok: true, skipped: true }`.
 * Com a key: renderiza o React Email pra HTML (+ texto puro) e envia via
 * `@sendgrid/mail`; qualquer erro vira `{ ok: false, error }`.
 */
export async function sendMail({
  to,
  from,
  subject,
  react,
}: SendMailArgs): Promise<SendMailResult> {
  if (!process.env.SENDGRID_API_KEY) {
    console.info('[sendgrid] no-op: sem SENDGRID_API_KEY, e-mail não enviado')
    return { ok: true, skipped: true }
  }

  try {
    const html = await render(react)
    const text = await render(react, { plainText: true })

    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    await sgMail.send({
      to,
      from: from ?? (process.env.SENDGRID_FROM as string),
      subject,
      html,
      text,
    })

    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}
