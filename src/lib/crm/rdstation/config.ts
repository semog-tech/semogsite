import { z } from 'zod'

const id = z.string().regex(/^[0-9a-f]{24}$/)
const slug = z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
const referenciaCampo = z.union([id, slug])
const camposSchema = z
  .object({
    id_lead_site: referenciaCampo,
    unidade_semog: referenciaCampo,
    utm_source: referenciaCampo,
    utm_medium: referenciaCampo,
    utm_campaign: referenciaCampo,
    utm_term: referenciaCampo,
    utm_content: referenciaCampo,
    gclid: referenciaCampo,
    tipo_clique: referenciaCampo,
    pagina_entrada: referenciaCampo,
    dados_proposta: referenciaCampo,
    quantidade_unidades: referenciaCampo.optional(),
    tipo_condominio: referenciaCampo.optional(),
    participacao: referenciaCampo.optional(),
    // O admin compartilha configuração com o app; o formulário não coleta estes dados.
    funcionarios: referenciaCampo.optional(),
    elevadores: referenciaCampo.optional(),
    valor_taxa: referenciaCampo.optional(),
    taxa_extra: referenciaCampo.optional(),
    ja_cliente: referenciaCampo.optional(),
    cidade: referenciaCampo.optional(),
    cnpj: referenciaCampo.optional(),
  })
  .strict()

const regraSchema = z
  .object({
    type: z.enum(['user', 'team', 'all', 'all_users', 'all_admins', 'owner']),
    id: id.optional(),
  })
  .strict()
  .refine((regra) => !['user', 'team'].includes(regra.type) || Boolean(regra.id))

export type CamposRd = z.infer<typeof camposSchema>
export type RegraRd = z.infer<typeof regraSchema>

const camposBancoSchema = camposSchema.partial().required({ id_lead_site: true })
// String vazia do editor significa "Não preencher"; manter para omitir campo e usar texto residual.
const mapaOpcoes = z.record(z.string().min(1).max(120), z.string().max(120))
const opcoesSchema = z
  .object({ tipo_condominio: mapaOpcoes.optional(), participacao: mapaOpcoes.optional() })
  .strict()
// Rótulo da Unidade (valor de unidades_por_cidade) → equipe RD que recebe o lead.
const equipesSchema = z.record(z.string().min(1).max(120), id)

function opcoesComPadrao(opcoes: z.infer<typeof opcoesSchema> = {}) {
  return {
    // O form não distingue síndico morador/profissional nem Vertical/Horizontal.
    participacao: {
      'Conselheiro(a)': 'Conselheiro',
      'Morador(a)': 'Condômino',
      'Incorporador(a) / Construtora': 'Construtora',
      Outro: 'Outros',
    },
    // Mapa explícito substitui o default inteiro; participacao:{} o desliga.
    ...opcoes,
  }
}
const configBancoSchema = z
  .object({
    schema_version: z.literal(1),
    version: z.number().int().positive().safe(),
    pipeline_id: id,
    entry_stage_id: id,
    source_site_id: id.nullable(),
    source_anuncio_id: id.nullable(),
    campaign_site_id: id.nullable(),
    campaign_anuncio_id: id.nullable(),
    distribution_rule: regraSchema.nullable(),
    unidades_por_cidade: z.record(z.string().min(1).max(120), z.string().min(1).max(120)),
    equipes_por_unidade: equipesSchema.default({}),
    custom_fields: camposBancoSchema,
    opcoes_campos: opcoesSchema.optional(),
    updated_by: z.string().uuid().nullable(),
    updated_at: z.string().datetime({ offset: true }),
  })
  .strict()

export type ConfigRd = {
  pipelineId: string
  stageId: string
  sourceSite: string | undefined
  sourceAnuncio: string | undefined
  campaignSite: string | undefined
  campaignAnuncio: string | undefined
  regra: RegraRd | undefined
  unidades: Record<string, string>
  equipesPorUnidade: Record<string, string>
  campos: z.infer<typeof camposBancoSchema>
  opcoes: z.infer<typeof opcoesSchema>
}

function validarSlugs(campos: ConfigRd['campos']): void {
  const slugs = Object.values(campos).filter((valor) => valor !== undefined)
  if (new Set(slugs).size !== slugs.length)
    throw new Error('RD Station: slugs ou IDs de campos personalizados repetidos')
}

export function configRdDoBanco(raw: unknown): ConfigRd {
  const versao = z.object({ schema_version: z.literal(1) }).safeParse(raw)
  if (!versao.success)
    throw new Error('RD Station: schema_version de configuração desconhecida; esperado 1')
  const parsed = configBancoSchema.safeParse(raw)
  if (!parsed.success) throw new Error('RD Station: configuração do banco incompleta ou inválida')
  const cfg = parsed.data
  validarSlugs(cfg.custom_fields)
  return {
    pipelineId: cfg.pipeline_id,
    stageId: cfg.entry_stage_id,
    sourceSite: cfg.source_site_id ?? undefined,
    sourceAnuncio: cfg.source_anuncio_id ?? undefined,
    campaignSite: cfg.campaign_site_id ?? undefined,
    campaignAnuncio: cfg.campaign_anuncio_id ?? undefined,
    regra: cfg.distribution_rule ?? undefined,
    unidades: cfg.unidades_por_cidade,
    equipesPorUnidade: cfg.equipes_por_unidade,
    campos: cfg.custom_fields,
    opcoes: opcoesComPadrao(cfg.opcoes_campos),
  }
}

function variavel(nome: string): string {
  const valor = process.env[nome]?.trim()
  if (!valor) throw new Error(`RD Station: configuração ausente (${nome})`)
  return valor
}

/** Fallback legado: só usado quando a leitura do banco falha ou devolve NULL. */
export function configRd(): ConfigRd {
  const campos = camposSchema.parse(JSON.parse(variavel('RD_CRM_CUSTOM_FIELDS')))
  validarSlugs(campos)
  return {
    pipelineId: id.parse(variavel('RD_CRM_PIPELINE_ID')),
    stageId: id.parse(variavel('RD_CRM_STAGE_ID')),
    sourceSite: id.parse(variavel('RD_CRM_SOURCE_SITE_ID')),
    sourceAnuncio: id.parse(variavel('RD_CRM_SOURCE_ANUNCIO_ID')),
    campaignSite: id.parse(variavel('RD_CRM_CAMPAIGN_SITE_ID')),
    campaignAnuncio: id.parse(variavel('RD_CRM_CAMPAIGN_ANUNCIO_ID')),
    regra: regraSchema.parse(JSON.parse(variavel('RD_CRM_DISTRIBUTION_RULE'))),
    unidades: z
      .record(z.string(), z.string().min(1))
      .parse(JSON.parse(variavel('RD_CRM_UNIDADES_POR_CIDADE'))),
    equipesPorUnidade: equipesSchema.parse(
      JSON.parse(process.env.RD_CRM_EQUIPES_POR_UNIDADE || '{}'),
    ),
    campos,
    opcoes: opcoesComPadrao(
      opcoesSchema.parse(JSON.parse(process.env.RD_CRM_OPCOES_CAMPOS || '{}')),
    ),
  }
}
