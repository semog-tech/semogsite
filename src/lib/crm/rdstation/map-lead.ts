import { parsePhoneNumberFromString } from 'libphonenumber-js/min'
import { type FormType, GCLID_FIELD, TIPO_CLIQUE_FIELD } from '@/lib/forms'
import type { ConfigRd } from './config'

export function contatoRd(data: Record<string, string>) {
  const telefone = parsePhoneNumberFromString(data.telefone ?? '', 'BR')?.number
  const email = data.email?.trim().toLowerCase()
  if (!telefone && !email) throw new Error('RD Station: contato sem e-mail nem telefone válido')
  return {
    name: data.nome?.trim() || 'Contato do site',
    job_title: data.cargo || undefined,
    emails: email ? [{ email }] : [],
    phones: telefone ? [{ phone: telefone, type: 'mobile' }] : [],
  }
}

type ValoresRd = Partial<Record<keyof ConfigRd['campos'], string | number>>

function valoresDoLead(data: Record<string, string>, leadId: string, config: ConfigRd): ValoresRd {
  const quantidade = Number(data.unidades)
  return {
    id_lead_site: leadId,
    unidade_semog:
      data.cidade && data.cidade !== 'Outra cidade' ? config.unidades[data.cidade] : undefined,
    utm_source: data['origem — utm_source'],
    utm_medium: data['origem — utm_medium'],
    utm_campaign: data['origem — utm_campaign'],
    utm_term: data['origem — utm_term'],
    utm_content: data['origem — utm_content'],
    gclid: data[GCLID_FIELD],
    tipo_clique: data[GCLID_FIELD] ? data[TIPO_CLIQUE_FIELD] || 'gclid' : undefined,
    pagina_entrada: data['origem — Página de entrada'],
    quantidade_unidades:
      data.unidades?.trim() && Number.isSafeInteger(quantidade) && quantidade > 0
        ? quantidade
        : undefined,
    tipo_condominio: config.opcoes.tipo_condominio?.[data.tipo],
    participacao: config.opcoes.participacao?.[data.cargo],
  }
}

function camposDoLead(
  form: FormType,
  data: Record<string, string>,
  leadId: string,
  config: ConfigRd,
): Record<string, string | number> {
  const valores = valoresDoLead(data, leadId, config)
  if (
    config.campos.unidade_semog &&
    data.cidade &&
    data.cidade !== 'Outra cidade' &&
    !valores.unidade_semog
  ) {
    throw new Error('RD Station: cidade sem mapeamento de Unidade Semog')
  }
  const campos: Record<string, string | number> = {}
  for (const [chave, valor] of Object.entries(valores)) {
    // As chaves são produzidas pelo mapa tipado, vinculado ao schema de configuração.
    const slug = config.campos[chave as keyof ConfigRd['campos']]
    if (valor && slug) campos[slug] = valor
  }
  if (config.campos.dados_proposta) {
    campos[config.campos.dados_proposta] = dadosRestantes(form, data, valores, config)
  }
  return campos
}

const correspondencias: Partial<Record<keyof ConfigRd['campos'], string>> = {
  unidade_semog: 'cidade',
  quantidade_unidades: 'unidades',
  tipo_condominio: 'tipo',
  participacao: 'cargo',
  utm_source: 'origem — utm_source',
  utm_medium: 'origem — utm_medium',
  utm_campaign: 'origem — utm_campaign',
  utm_term: 'origem — utm_term',
  utm_content: 'origem — utm_content',
  gclid: GCLID_FIELD,
  tipo_clique: TIPO_CLIQUE_FIELD,
  pagina_entrada: 'origem — Página de entrada',
}

function dadosRestantes(
  form: FormType,
  data: Record<string, string>,
  valores: ValoresRd,
  config: ConfigRd,
): string {
  const atendidos = new Set(['nome', 'email', 'telefone', 'nomeCondominio'])
  for (const [chave, origem] of Object.entries(correspondencias)) {
    // Aliases pertencem ao mapa tipado acima.
    const alias = chave as keyof ConfigRd['campos']
    if (config.campos[alias] && valores[alias]) atendidos.add(origem)
  }
  return `Formulário: ${form}\n${Object.entries(data)
    .filter(([chave, valor]) => valor && !atendidos.has(chave))
    .map(([chave, valor]) => `${chave}: ${valor}`)
    .join('\n')}`
}

export function negocioRd(
  form: FormType,
  data: Record<string, string>,
  leadId: string,
  config: ConfigRd,
) {
  const pago =
    Boolean(data[GCLID_FIELD]?.trim()) ||
    /tráfego pago/i.test(data['origem — Canal (origem)'] ?? '')
  return {
    name: data.nomeCondominio?.trim() || data.nome?.trim() || 'Proposta do site',
    status: 'ongoing',
    // pipeline_id é readOnly na v2: stage_id escolhe o funil; validado antes do POST.
    stage_id: config.stageId,
    source_id: pago ? config.sourceAnuncio : config.sourceSite,
    campaign_id: pago ? config.campaignAnuncio : config.campaignSite,
    distribution_settings: config.regra
      ? { stage_id: config.stageId, rule: config.regra }
      : undefined,
    custom_fields: camposDoLead(form, data, leadId, config),
  }
}
