import type { ContatoValues, ExperienceValues, PropostaValues } from '@/lib/form-schemas'

/**
 * Config estática dos formulários (substitui a collection `forms` do
 * Payload/form-builder, que só existia pra guardar essa mesma lista de
 * campos). `fields` é a lista de chaves do respectivo schema Zod
 * (`src/lib/form-schemas.ts`), na ordem do formulário — são exatamente as
 * chaves que `submit-form.ts` grava em `cms.leads.data` (via
 * `Object.entries(data)`, chave = nome do campo do schema, não o rótulo
 * pt-BR). `title` é usado no assunto do e-mail de notificação (equivalente
 * ao `FORM_TITLES` que hoje vive em `submit-form.ts`).
 */
export type FormType = 'contato' | 'proposta' | 'experience'

export type FormDef<T extends Record<string, unknown>> = {
  title: string
  /** Nomes dos campos do schema Zod correspondente, na ordem do formulário. */
  fields: (keyof T)[]
}

export const FORMS: {
  contato: FormDef<ContatoValues>
  proposta: FormDef<PropostaValues>
  experience: FormDef<ExperienceValues>
} = {
  contato: {
    title: 'Contato',
    fields: ['nome', 'email', 'telefone', 'assunto', 'mensagem'],
  },
  proposta: {
    title: 'Proposta',
    fields: [
      'tipo',
      'nome',
      'nomeCondominio',
      'cargo',
      'email',
      'telefone',
      'cidade',
      'unidades',
      'mensagem',
    ],
  },
  /**
   * Inscrição no Semog Experience. Mesma mecânica dos outros dois — os campos
   * viram `cms.leads.data` (jsonb), sem migration. A ordem abaixo é a ordem
   * da tela, e o `aceiteImagem` fica por último porque é o consentimento que
   * fecha o formulário.
   */
  experience: {
    title: 'Inscrição — Semog Experience',
    fields: ['nome', 'email', 'telefone', 'condominio', 'acompanhantes', 'aceiteImagem'],
  },
}

/**
 * Chave literal do campo de e-mail em `cms.leads.data` — é o nome do campo
 * no schema Zod (`email`), não o rótulo pt-BR ("E-mail"), porque
 * `submit-form.ts` grava `Object.entries(data)` direto (chave = nome do
 * campo). Igual em todos os formulários.
 */
export const EMAIL_FIELD = 'email'

/**
 * Chave literal do campo de gclid em `cms.leads.data` — vem da atribuição
 * (`src/lib/attribution.ts`, `buildAttributionFields`), que grava
 * `field: \`origem — ${label}\`` com `label: 'gclid (Google Ads)'` quando
 * há um click id do Google Ads no first-touch. Compartilhado com o cron
 * (Task 4) pra ele filtrar/ler a mesma coluna sem duplicar o literal.
 */
export const GCLID_FIELD = 'origem — gclid (Google Ads)'

export type LeadColumns = { gclid?: string; email?: string }

/**
 * Extrai `gclid`/`email` do `data` (jsonb) de um lead pras colunas próprias
 * de `cms.leads` — assim o cron do Ads filtra por coluna (`gclid is not
 * null`) em vez de varrer o JSON. String vazia conta como ausente (campo
 * presente mas em branco não deve virar uma coluna "preenchida").
 */
export function extractLeadColumns(data: Record<string, string>): LeadColumns {
  const email = data[EMAIL_FIELD]
  const gclid = data[GCLID_FIELD]
  return {
    email: email ? email : undefined,
    gclid: gclid ? gclid : undefined,
  }
}
