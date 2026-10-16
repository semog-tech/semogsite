import { z } from 'zod'
import { VARIANTE_DUAS_ETAPAS } from '@/lib/forms'

/**
 * Formulário de proposta em duas etapas (site v2, spec 4.1). Fonte única das regras de campo: a
 * tela valida com estes schemas antes de enviar e as Server Actions validam de novo. Mensagens do
 * protótipo (`core/formulario-proposta.js`). Fica fora de `form-schemas.ts` para não misturar com o
 * formulário antigo, que segue no ar até a virada (spec 4.2).
 */

export const UFS_COM_UNIDADE = ['PE', 'PB', 'PA'] as const
export const OUTRAS_UFS = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PR',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const
export const UFS = [...UFS_COM_UNIDADE, ...OUTRAS_UFS] as const
export type Uf = (typeof UFS)[number]

export const NOME_DA_UF: Record<Uf, string> = {
  PE: 'Pernambuco',
  PB: 'Paraíba',
  PA: 'Pará',
  AC: 'Acre',
  AL: 'Alagoas',
  AP: 'Amapá',
  AM: 'Amazonas',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais',
  PR: 'Paraná',
  PI: 'Piauí',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul',
  RO: 'Rondônia',
  RR: 'Roraima',
  SC: 'Santa Catarina',
  SP: 'São Paulo',
  SE: 'Sergipe',
  TO: 'Tocantins',
}

/** Cidades das Unidades Semog por UF (D2, Leandro, 16/10/2026). UF fora daqui: só texto livre. */
export const CIDADES_DAS_UNIDADES: Readonly<Record<string, readonly string[]>> = {
  PE: ['Recife'],
  PB: ['João Pessoa', 'Campina Grande'],
  PA: ['Belém'],
}
export const OUTRA_CIDADE = 'Outra cidade'

export const PERFIS = ['sindico', 'conselheiro', 'morador', 'construtora'] as const
export type Perfil = (typeof PERFIS)[number]

/** Papel da spec → `cargo` que o formulário antigo já grava (Exact, e-mail e desfecho leem). */
export const CARGO_DO_PERFIL: Record<Perfil, string> = {
  sindico: 'Síndico(a)',
  conselheiro: 'Conselheiro(a)',
  morador: 'Morador(a)',
  construtora: 'Incorporador(a) / Construtora',
}

export const MENSAGENS = {
  condominio: 'Informe o nome do condomínio.',
  uf: 'Selecione o estado.',
  telefoneVazio: 'Informe o telefone com DDD.',
  telefoneIncompleto: 'Telefone incompleto: DDD e número, como (81) 99999-9999.',
  telefoneDdd: 'Confira o DDD: são dois dígitos, como 81.',
  telefoneLongo: 'Confira o telefone: DDD e número, como (81) 99999-9999.',
  email: 'Confira o e-mail: falta algo como nome@provedor.com.br.',
  nome: 'Informe seu nome.',
  perfil: 'Escolha uma opção.',
  cliente: 'Responda sim ou não.',
  cidade: 'Escolha a cidade.',
  unidades: 'Use só números, como 120.',
  longo: 'Use no máximo 120 caracteres.',
} as const

export function soDigitos(valor: string): string {
  return valor.replace(/\D/g, '')
}

/** Dígitos do telefone sem o +55 colado (autopreenchimento e cópia de assinatura trazem o país). */
export function digitosDoTelefone(valor: string): string {
  const d = soDigitos(valor)
  return (d.length === 12 || d.length === 13) && d.startsWith('55') ? d.slice(2) : d
}

/** "81999998888" → "(81) 99999-8888"; aceita parcial. */
export function formatarTelefone(d: string): string {
  if (!d) return ''
  if (d.length <= 2) return `(${d}`
  const ddd = d.slice(0, 2)
  const resto = d.slice(2)
  if (resto.length <= 4) return `(${ddd}) ${resto}`
  const corte = resto.length === 9 ? 5 : 4
  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`
}

/** DDD de 2 dígitos sem zero na frente + 8 ou 9 dígitos (spec 4.1). "" = válido. */
export function erroTelefone(d: string): string {
  if (!d) return MENSAGENS.telefoneVazio
  if (d.length < 10) return MENSAGENS.telefoneIncompleto
  if (d.length > 11) return MENSAGENS.telefoneLongo
  if (d.startsWith('0')) return MENSAGENS.telefoneDdd
  return ''
}

const textoObrigatorio = (mensagem: string) =>
  z.string().trim().min(1, mensagem).max(120, MENSAGENS.longo)

const telefoneBr = z
  .string()
  .transform(digitosDoTelefone)
  .superRefine((d, ctx) => {
    const erro = erroTelefone(d)
    if (erro) ctx.addIssue({ code: 'custom', message: erro })
  })
  .transform((d) => `+55${d}`)

const emailOpcional = z
  .string()
  .trim()
  .max(254, MENSAGENS.email)
  .refine((v) => v === '' || z.email().safeParse(v).success, MENSAGENS.email)
  .optional()

export const etapa1Schema = z.object({
  nomeCondominio: textoObrigatorio(MENSAGENS.condominio),
  uf: z.enum(UFS, MENSAGENS.uf),
  telefone: telefoneBr,
  email: emailOpcional,
})

export const etapa2Schema = z.object({
  nome: textoObrigatorio(MENSAGENS.nome),
  perfil: z.enum(PERFIS, MENSAGENS.perfil),
  cidade: z.string().trim().max(120, MENSAGENS.longo).optional(),
  unidades: z
    .string()
    .trim()
    .regex(/^\d{0,5}$/, MENSAGENS.unidades)
    .optional(),
  cliente: z.enum(['sim', 'nao'], MENSAGENS.cliente),
})

/** Token perdido (R5): as duas etapas juntas, com Turnstile novo. */
export const propostaCompletaSchema = etapa1Schema.extend(etapa2Schema.shape)

/** O que a tela lê do formulário e manda às actions (texto cru; o servidor normaliza). */
export type CamposEtapa1 = { nomeCondominio: string; uf: string; telefone: string; email: string }
export type CamposEtapa2 = {
  nome: string
  perfil: string
  cidade: string
  unidades: string
  cliente: string
}

export type Etapa1Dados = z.output<typeof etapa1Schema>
export type Etapa2Dados = z.output<typeof etapa2Schema>

/** Chaves de `cms.leads.data` da etapa 1 (as que Exact, desfecho e e-mail já leem, mais `uf`). */
export function dadosDaEtapa1(d: Etapa1Dados): Record<string, string> {
  const dados: Record<string, string> = {
    nomeCondominio: d.nomeCondominio,
    uf: d.uf,
    telefone: d.telefone,
    variante: VARIANTE_DUAS_ETAPAS,
  }
  if (d.email) dados.email = d.email
  return dados
}

export function dadosDaEtapa2(d: Etapa2Dados): Record<string, string> {
  const dados: Record<string, string> = {
    nome: d.nome,
    cargo: CARGO_DO_PERFIL[d.perfil],
    cliente: d.cliente,
  }
  if (d.cidade) dados.cidade = d.cidade
  const unidades = d.unidades ? Number.parseInt(d.unidades, 10) : 0
  if (unidades > 0) dados.unidades = String(unidades)
  return dados
}

/** Primeiro erro de cada campo (`path[0]`), como `flattenZodErrors` do formulário antigo. */
export function errosPorCampo(
  issues: readonly { path: readonly PropertyKey[]; message: string }[],
): Record<string, string> {
  const erros: Record<string, string> = {}
  for (const issue of issues) {
    const campo = issue.path[0]
    if (typeof campo === 'string' && !(campo in erros)) erros[campo] = issue.message
  }
  return erros
}
