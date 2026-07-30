import 'server-only'

import type { FormType } from '@/lib/forms'
import { createLead, createPerson, exactEnabled } from './client'
import { isExactEligible, mapLead } from './map-lead'

/**
 * Envia um lead do site pro Exact. **Nunca lança** — quem chama (a Server
 * Action do formulário e o cron de retry) trata o resultado como best-effort:
 * o lead já está salvo em `cms.leads` e os e-mails já saíram.
 *
 * `null` significa "não havia o que fazer": lead não elegível (atendimento a
 * cliente, não captação) ou integração desligada por falta de token.
 */

export type PushResult =
  | { ok: true; exactLeadId: number; personError?: string }
  | { ok: false; error: string }

/** E-mail da SDR que recebe os leads do site. Env pra trocar sem deploy. */
function sdrEmail(): string {
  return process.env.EXACT_SDR_EMAIL || 'daiane@semog.com.br'
}

function mensagem(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

export async function pushLeadToExact(
  formType: FormType,
  data: Record<string, string>,
): Promise<PushResult | null> {
  if (!isExactEligible(formType, data)) return null
  if (!exactEnabled()) return null

  const { lead, person } = mapLead(formType, data, sdrEmail())

  let exactLeadId: number
  try {
    exactLeadId = await createLead(lead)
  } catch (err) {
    return { ok: false, error: mensagem(err) }
  }

  // O contato é complemento: se falhar, o card já existe e reenviar o lead só
  // criaria duplicata. Reporta o erro junto do sucesso.
  try {
    await createPerson({ ...person, leadId: exactLeadId })
  } catch (err) {
    return { ok: true, exactLeadId, personError: mensagem(err) }
  }

  return { ok: true, exactLeadId }
}
