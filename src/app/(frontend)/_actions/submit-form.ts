'use server'

import { headers } from 'next/headers'
import ContactAutoReply from '@/emails/ContactAutoReply'
import ContactNotification from '@/emails/ContactNotification'
import type { ContatoValues, PropostaValues } from '@/lib/form-schemas'
import { contatoSchema, propostaSchema } from '@/lib/form-schemas'
import { getPayloadClient } from '@/lib/payload'
import { rateLimit } from '@/lib/rate-limit'
import { sendMail } from '@/lib/sendgrid'
import { verifyTurnstile } from '@/lib/turnstile'

export type FormType = 'contato' | 'proposta'

export type SubmitFormResult = {
  ok: boolean
  errors?: Record<string, string>
  message?: string
}

/** Título exato dos forms semeados (`src/seed/forms.ts`, DB live ids 1/2). */
const FORM_TITLES: Record<FormType, string> = {
  contato: 'Contato',
  proposta: 'Proposta',
}

/** Rótulos pt-BR (iguais ao `label` de cada bloco do seed) pro e-mail de notificação interna. */
const CONTATO_LABELS: Record<keyof ContatoValues, string> = {
  nome: 'Nome',
  email: 'E-mail',
  telefone: 'Telefone / WhatsApp',
  assunto: 'Assunto',
  mensagem: 'Mensagem',
}

const PROPOSTA_LABELS: Record<keyof PropostaValues, string> = {
  tipo: 'O que você representa?',
  nome: 'Seu nome',
  cargo: 'Seu papel',
  email: 'E-mail',
  telefone: 'WhatsApp',
  cidade: 'Cidade do condomínio',
  unidades: 'Número de unidades',
  mensagem: 'Mensagem',
}

/**
 * Converte o primeiro `ZodIssue` de cada campo (`issue.path[0]`) num
 * `Record<string, string>` — formato que o client usa pra destacar o campo
 * com erro, sem precisar entender a árvore de issues do Zod.
 */
function flattenZodErrors(
  issues: { path: PropertyKey[]; message: string }[],
): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const issue of issues) {
    const key = issue.path[0]
    if (typeof key === 'string' && !(key in errors)) {
      errors[key] = issue.message
    }
  }
  return errors
}

/**
 * IP do cliente a partir de `x-forwarded-for` (Vercel/proxies padrão
 * preenchem esse header; primeiro valor da lista é o cliente original).
 * `undefined` se ausente (ex.: `next dev` sem proxy na frente) — quem chama
 * cai pro fallback `'anon'` do rate limit.
 */
async function getClientIp(): Promise<string | undefined> {
  const headerList = await headers()
  const forwardedFor = headerList.get('x-forwarded-for')
  if (!forwardedFor) return undefined
  return forwardedFor.split(',')[0]?.trim() || undefined
}

/**
 * Server Action de submit dos formulários "Contato"/"Proposta" (Form
 * Builder, `src/seed/forms.ts`). Pipeline: valida com Zod → Turnstile →
 * rate limit por IP → grava em `form-submissions` → e-mail (best-effort).
 *
 * **Nunca lança** — cada etapa arriscada (Turnstile, DB, Payload,
 * SendGrid) fica atrás de um `try/catch` que devolve um `{ ok: false,
 * message }` genérico em vez de deixar o erro subir. A submissão em si
 * (`payload.create`) é o único passo que precisa ter sucesso pra
 * `ok: true` — falha de e-mail depois disso é só logada.
 */
export async function submitForm(
  formType: FormType,
  values: unknown,
  turnstileToken: string,
): Promise<SubmitFormResult> {
  const schema = formType === 'contato' ? contatoSchema : propostaSchema
  const parsed = schema.safeParse(values)

  if (!parsed.success) {
    return { ok: false, errors: flattenZodErrors(parsed.error.issues) }
  }

  try {
    const ip = await getClientIp()

    const turnstileOk = await verifyTurnstile(turnstileToken, ip)
    if (!turnstileOk) {
      return { ok: false, message: 'Verificação anti-spam falhou.' }
    }

    const rate = rateLimit(ip ?? 'anon', { max: 5, windowMs: 60_000 })
    if (!rate.ok) {
      return { ok: false, message: 'Muitas tentativas, tente em instantes.' }
    }

    const formTitle = FORM_TITLES[formType]
    const payload = await getPayloadClient()

    const formResult = await payload.find({
      collection: 'forms',
      where: { title: { equals: formTitle } },
      limit: 1,
      depth: 0,
    })
    const form = formResult.docs[0]
    if (!form) {
      console.error(
        `[submit-form] form "${formTitle}" não encontrado em \`forms\` — rode \`pnpm seed:forms\`.`,
      )
      return { ok: false, message: 'Erro ao enviar. Tente novamente.' }
    }

    const data = parsed.data as ContatoValues | PropostaValues

    await payload.create({
      collection: 'form-submissions',
      data: {
        form: form.id,
        submissionData: Object.entries(data)
          .filter(([, value]) => value !== undefined)
          .map(([field, value]) => ({ field, value: String(value) })),
      },
    })

    // E-mail é best-effort: a submissão já está salva acima, então uma
    // falha de SendGrid (ou ausência de `CONTACT_TO`/`SENDGRID_API_KEY`)
    // não deve derrubar o retorno `ok: true` pro usuário.
    try {
      const labels = formType === 'contato' ? CONTATO_LABELS : PROPOSTA_LABELS
      const fields = Object.entries(data)
        .filter(([, value]) => value !== undefined)
        .map(([field, value]) => ({
          label: labels[field as keyof typeof labels] ?? field,
          value: String(value),
        }))

      if (process.env.CONTACT_TO) {
        const notificationResult = await sendMail({
          to: process.env.CONTACT_TO,
          subject: `Novo contato via ${formTitle}`,
          react: ContactNotification({ formTitle, fields }),
        })
        if (notificationResult.ok === false) {
          console.error('[submit-form] sendMail falhou:', notificationResult.error)
        }
      } else {
        console.info('[submit-form] CONTACT_TO ausente — notificação interna não enviada.')
      }

      const autoReplyResult = await sendMail({
        to: data.email,
        subject: 'Recebemos seu contato — Semog',
        react: ContactAutoReply({ name: data.nome }),
      })
      if (autoReplyResult.ok === false) {
        console.error('[submit-form] sendMail falhou:', autoReplyResult.error)
      }
    } catch (mailErr) {
      console.error('[submit-form] falha ao enviar e-mail (submissão já salva):', mailErr)
    }

    return { ok: true, message: 'Recebemos sua mensagem!' }
  } catch (err) {
    console.error('[submit-form] erro inesperado:', err)
    return { ok: false, message: 'Erro ao enviar. Tente novamente.' }
  }
}
