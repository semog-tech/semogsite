import { render } from '@react-email/render'
import sgMail from '@sendgrid/mail'
import type { ReactElement } from 'react'
import { comPrazo } from '@/lib/prazo'

export type SendMailArgs = {
  /**
   * Destinatário, ou vários. Uma lista vira **um e-mail só** com todos no campo
   * `To` — não uma cópia por pessoa. A diferença é o ponto: na proposta de
   * "Outra cidade" os três responsáveis de praça precisam ver que os outros
   * também receberam, senão dois deles ligam para o mesmo síndico.
   */
  to: string | string[]
  /** Remetente; se omitido cai no fallback `SENDGRID_FROM` (sender verificado no SendGrid). */
  from?: string
  subject: string
  react: ReactElement
}

/**
 * Prazo do envio ao SendGrid. O e-mail sai dentro da action da etapa 2 e do cron, que tem teto de
 * duração: SendGrid pendurado não pode prender nenhum dos dois. Estourou = `{ ok: false }`.
 */
export const PRAZO_SENDGRID_MS = 5000

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
    // O `timeout` do client (axios) é de inatividade do socket, não do envio inteiro: o `comPrazo`
    // é que garante o teto; o do client só encerra a conexão parada.
    sgMail.setTimeout(PRAZO_SENDGRID_MS)
    await comPrazo(
      sgMail.send({
        to,
        from: from ?? (process.env.SENDGRID_FROM as string),
        subject,
        html,
        text,
      }),
      PRAZO_SENDGRID_MS,
      'SendGrid',
    )

    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}
