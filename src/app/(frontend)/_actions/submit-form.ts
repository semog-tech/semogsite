'use server'

/**
 * **Só exporte função async deste arquivo.** Num módulo `'use server'` o Next
 * registra *todo* export como Server Action — inclusive um `export type`, que
 * a compilação depois apaga, deixando o registro apontando para um
 * identificador que não existe. O módulo inteiro morre com `ReferenceError` na
 * primeira submissão, antes de qualquer validação.
 *
 * Não é hipótese: um `export type { FormType }` reexportado de `@/lib/forms`
 * derrubou os três formulários por 12 dias em agosto/2026, com build verde,
 * `tsc` limpo e testes passando — nenhum portão automático enxerga isso.
 * Tipo compartilhado se importa de `@/lib/forms`, que é a fonte única.
 */

import { cookies, headers } from 'next/headers'
import { EXPERIENCE_EVENT } from '@/data/experienceEvent'
import ContactAutoReply from '@/emails/ContactAutoReply'
import ContactNotification from '@/emails/ContactNotification'
import ExperienceAutoReply from '@/emails/ExperienceAutoReply'
import {
  ATTRIBUTION_COOKIE,
  buildAttributionFields,
  parseAttributionCookie,
} from '@/lib/attribution'
import { query } from '@/lib/db'
import { pushLeadToExact } from '@/lib/exact/push-lead'
import type { ContatoValues, ExperienceValues, PropostaValues } from '@/lib/form-schemas'
import { contatoSchema, experienceSchema, propostaSchema } from '@/lib/form-schemas'
import { extractLeadColumns, FORMS, type FormType } from '@/lib/forms'
import { rateLimit } from '@/lib/rate-limit'
import { sendMail } from '@/lib/sendgrid'
import { verifyTurnstile } from '@/lib/turnstile'

export type SubmitFormResult = {
  ok: boolean
  errors?: Record<string, string>
  message?: string
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
  nomeCondominio: 'Nome do condomínio',
  cargo: 'Seu papel',
  email: 'E-mail',
  telefone: 'WhatsApp',
  cidade: 'Cidade do condomínio',
  unidades: 'Número de unidades',
  mensagem: 'Mensagem',
}

/**
 * Inscrição no Semog Experience. Mesmo papel dos dois acima: só o rótulo
 * legível de cada campo no e-mail de notificação interna.
 */
const EXPERIENCE_LABELS: Record<keyof ExperienceValues, string> = {
  nome: 'Nome',
  email: 'E-mail',
  telefone: 'WhatsApp',
  condominio: 'Condomínio',
  acompanhantes: 'Acompanhantes',
  aceiteImagem: 'Autoriza uso de imagem',
}

/**
 * Roteamento da notificação interna de **Proposta** por região, a partir do
 * campo `cidade` (as chaves são os `value` exatos de `CIDADE_OPTIONS` em
 * `src/lib/form-schemas.ts` — se o seed/enum mudar as opções, atualizar aqui).
 * Cobre todos os valores do enum, então uma `cidade` preenchida sempre resolve
 * um destinatário; `cidade` em branco (campo opcional) cai no
 * `PROPOSTA_FALLBACK_TO`. Só a Proposta usa isto — Contato continua indo pro
 * `CONTACT_TO`.
 */
const PROPOSTA_CIDADE_TO: Record<NonNullable<PropostaValues['cidade']>, string> = {
  'Recife e região': 'ivan@semog.com.br',
  'João Pessoa e região': 'comercial@semog.com.br',
  'Campina Grande e região': 'comercial@semog.com.br',
  'Belém e região': 'galvao@semog.com.br',
  'Outra cidade': 'comercial@semog.com.br',
}

/** Destino da Proposta quando `cidade` não foi preenchida (campo opcional). */
const PROPOSTA_FALLBACK_TO = 'comercial@semog.com.br'

/**
 * Schema de validação por formulário. Mapa (e não ternário) porque com três
 * formulários o ternário aninhado já esconde qual schema vale pra qual tipo —
 * e porque assim o `tsc` cobra a entrada quando um `FormType` novo aparecer.
 */
const SCHEMAS = {
  contato: contatoSchema,
  proposta: propostaSchema,
  experience: experienceSchema,
} as const

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
 * Server Action de submit dos formulários "Contato"/"Proposta"/"Inscrição —
 * Semog Experience" (config estática em `@/lib/forms`). Pipeline: valida com
 * Zod → rate limit por formulário+IP → Turnstile → grava em `cms.leads` (via `pg`,
 * `@/lib/db`) → cria o lead no CRM (Exact, só quando é captação) → e-mail. Os
 * dois últimos são best-effort.
 *
 * A inscrição do Experience passa pelo mesmo pipeline, mas **nunca** chega ao
 * CRM: `isExactEligible` a barra (evento é relacionamento, não captação).
 *
 * **Nunca lança** — cada etapa arriscada (Turnstile, DB, Exact, SendGrid) fica
 * atrás de um `try/catch` que devolve um `{ ok: false, message }` genérico em
 * vez de deixar o erro subir. O `INSERT` em `cms.leads` é o único passo que
 * precisa ter sucesso pra `ok: true` — falha de CRM ou de e-mail depois disso
 * é só registrada (no banco e no log).
 */
export async function submitForm(
  formType: FormType,
  values: unknown,
  turnstileToken: string,
): Promise<SubmitFormResult> {
  const schema = SCHEMAS[formType]
  const parsed = schema.safeParse(values)

  if (!parsed.success) {
    return { ok: false, errors: flattenZodErrors(parsed.error.issues) }
  }

  try {
    const ip = await getClientIp()

    // Rate limit ANTES do Turnstile, de propósito. `verifyTurnstile` é uma
    // chamada de rede ao siteverify da Cloudflare: na ordem inversa, uma
    // enxurrada de tokens inválidos nunca chegava a contar e cada tentativa
    // ainda custava uma requisição de saída. A chave leva o formulário na
    // frente (como pede o docblock de `rateLimit`) para que uma rajada na
    // landing do evento não consuma a cota de quem está preenchendo Contato ou
    // Proposta do mesmo IP — escritório inteiro sai por um NAT só.
    const rate = rateLimit(`${formType}:${ip ?? 'anon'}`, { max: 5, windowMs: 60_000 })
    if (!rate.ok) {
      return { ok: false, message: 'Muitas tentativas, tente em instantes.' }
    }

    const turnstileOk = await verifyTurnstile(turnstileToken, ip)
    if (!turnstileOk) {
      return { ok: false, message: 'Verificação anti-spam falhou.' }
    }

    const formTitle = FORMS[formType].title
    const data = parsed.data as ContatoValues | PropostaValues | ExperienceValues

    // Origem do lead (cookie de 1ª parte gravado pelo AttributionTracker no
    // client). Best-effort: ausente/ilegível → `[]`, e a submissão segue igual.
    const attributionCookie = (await cookies()).get(ATTRIBUTION_COOKIE)?.value
    const attributionFields = buildAttributionFields(parseAttributionCookie(attributionCookie))

    // Monta o `data` (jsonb) do lead: campos do formulário (chave = nome do
    // campo do schema Zod) + origem, como objeto `{field: value}`.
    const leadData: Record<string, string> = {}
    for (const [field, value] of Object.entries(data)) {
      if (value !== undefined) {
        leadData[field] = String(value)
      }
    }
    for (const f of attributionFields) {
      leadData[`origem — ${f.label}`] = f.value
    }

    const { gclid, email } = extractLeadColumns(leadData)

    const { rows: inserted } = await query<{ id: string }>(
      'insert into cms.leads (form, data, gclid, email) values ($1, $2, $3, $4) returning id',
      [formType, leadData, gclid ?? null, email ?? null],
    )
    const leadRowId = inserted[0]?.id

    // CRM (Exact) é best-effort, igual aos e-mails: o lead já está salvo acima.
    // Um CRM fora do ar — ou um payload que ele recuse — não pode virar erro
    // pra quem preencheu o formulário; o cron `push-exact-leads` retenta
    // depois. Só passa por aqui quem é captação de verdade (o próprio
    // `pushLeadToExact` devolve `null` pro resto e pra integração desligada).
    if (leadRowId) {
      try {
        const push = await pushLeadToExact(formType, leadData)
        if (push) {
          await query(
            `update cms.leads
                set exact_lead_id = $1, exact_error = $2, exact_attempts = exact_attempts + 1
              where id = $3`,
            [
              push.ok ? push.exactLeadId : null,
              push.ok ? (push.personError ?? null) : push.error,
              leadRowId,
            ],
          )
        }
      } catch (exactErr) {
        console.error('[submit-form] push pro Exact falhou (lead já salvo):', exactErr)
      }
    }

    // E-mail é best-effort: a submissão já está salva acima, então uma
    // falha de SendGrid (ou ausência de `CONTACT_TO`/`SENDGRID_API_KEY`)
    // não deve derrubar o retorno `ok: true` pro usuário.
    try {
      const labels =
        formType === 'contato'
          ? CONTATO_LABELS
          : formType === 'experience'
            ? EXPERIENCE_LABELS
            : PROPOSTA_LABELS
      const fields = Object.entries(data)
        .filter(([, value]) => value !== undefined)
        .map(([field, value]) => ({
          label: labels[field as keyof typeof labels] ?? field,
          value: String(value),
        }))

      // Proposta roteia por região (campo `cidade`) pra caixa da pessoa
      // responsável; Contato continua indo pro `CONTACT_TO` (que pode estar
      // ausente em dev — cai no `else` abaixo, comportamento original).
      // A inscrição do Experience cai no mesmo `else`: não tem `cidade` e não
      // é pedido comercial, então a notificação vai pro `CONTACT_TO` junto com
      // o Contato. De propósito — roteamento próprio pro evento só quando
      // alguém pedir.
      let notifyTo: string | undefined
      if (formType === 'proposta') {
        const { cidade } = data as PropostaValues
        notifyTo = cidade ? PROPOSTA_CIDADE_TO[cidade] : PROPOSTA_FALLBACK_TO
      } else {
        notifyTo = process.env.CONTACT_TO
      }

      if (notifyTo) {
        const notificationResult = await sendMail({
          to: notifyTo,
          subject: `Novo contato via ${formTitle}`,
          react: ContactNotification({ formTitle, fields, attribution: attributionFields }),
        })
        if (notificationResult.ok === false) {
          console.error('[submit-form] sendMail falhou:', notificationResult.error)
        }
      } else {
        console.info(
          '[submit-form] destinatário da notificação ausente — notificação interna não enviada.',
        )
      }

      // Auto-reply: a inscrição no evento tem o seu, e não é firula. O
      // genérico diz "Recebemos seu contato" e promete que "em breve alguém
      // vai retornar pra você" — para quem se inscreveu num evento gratuito
      // isso é falso (ninguém vai retornar) e contradiz a frase que o próprio
      // formulário mostra acima do botão. O do evento confirma a inscrição
      // repetindo data, horário e local de `EXPERIENCE_EVENT`.
      const autoReply =
        formType === 'experience'
          ? {
              subject: `Inscrição recebida — ${EXPERIENCE_EVENT.name}`,
              react: ExperienceAutoReply({ name: data.nome }),
            }
          : {
              subject: 'Recebemos seu contato — Semog',
              react: ContactAutoReply({ name: data.nome }),
            }

      const autoReplyResult = await sendMail({
        to: data.email,
        subject: autoReply.subject,
        react: autoReply.react,
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
