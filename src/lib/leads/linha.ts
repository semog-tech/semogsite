import type { FormType } from '@/lib/forms'

/** Uma linha de `cms.leads` como o pós-gravação a lê. `id` volta do `pg` como string (bigint). */
export type LinhaDoLead = {
  id: string
  form: FormType
  etapa: 1 | 2 | null
  data: Record<string, string>
  gclid: string | null
  ads_consent: string | null
  created_at: string | Date
  notificado_para: string | null
}

export const COLUNAS_DA_LINHA =
  'id, form, etapa, data, gclid, ads_consent, created_at, notificado_para'

/**
 * O `data` que vai ao mapeamento do Exact, com a etapa (coluna) junto: é o que faz a descrição dizer
 * "parcial: só etapa 1". Só em memória; nunca gravado em `data`.
 */
export function dadosParaOExact(linha: {
  data: Record<string, string>
  etapa?: 1 | 2 | null
}): Record<string, string> {
  return linha.etapa == null ? linha.data : { ...linha.data, etapa: String(linha.etapa) }
}
