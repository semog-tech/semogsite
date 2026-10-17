import { parsePhoneNumberFromString } from 'libphonenumber-js/min'
import {
  type FormType,
  GCLID_FIELD,
  VARIANTE_CONTATO_RAPIDO,
  VARIANTE_DUAS_ETAPAS,
} from '@/lib/forms'
import { CIDADES_DAS_UNIDADES } from '@/lib/propostaDuasEtapas/schema'

/**
 * Tradução do lead do site pro vocabulário do Exact Spotter. Função **pura**:
 * a entrada é o mesmo `jsonb` que vai pra `cms.leads.data` (campos do
 * formulário + chaves `origem — …` da atribuição), porque é tudo que o cron de
 * retry tem em mãos — assim submit e retry compartilham o mesmo mapeamento,
 * sem depender do cookie que só existe no request original.
 *
 * O contrato do Exact foi sondado em 2026-07-29 e **não** é o que o PDF da API
 * descreve; os detalhes (endpoint `/LeadsAdd`, corpo aninhado, `source`/
 * `industry` como string, ausência de `customFields`) estão documentados em
 * `scripts/probe-exact-create-lead.ts`.
 */

/** Funil "Padrão" — o lead entra na primeira etapa ("Entrada"). */
const FUNIL_PADRAO = 24653

// `source` é o TEXTO da origem cadastrada no Exact, não o id.
const SOURCE_SITE = 'Site'
const SOURCE_ANUNCIO = 'Anúncio'

/**
 * O Exact usa "Mercado" (`industry`) como região comercial — os quatro valores
 * cadastrados no tenant são cidades. Mapeia a partir das opções do formulário.
 */
const REGIAO_POR_CIDADE: Record<string, string> = {
  'Recife e região': 'Recife',
  'João Pessoa e região': 'João Pessoa',
  'Campina Grande e região': 'Campina Grande',
  'Belém e região': 'Belém',
}

/** Região pela UF quando a cidade não é de Unidade ("Outra cidade" ou só a etapa 1). PB → João Pessoa (DP5). */
const REGIAO_DA_UF: Readonly<Record<string, string>> = {
  PE: 'Recife',
  PB: 'João Pessoa',
  PA: 'Belém',
}

/**
 * "Mercado" do Exact. Formulário antigo: pelas opções "X e região". Duas etapas: a cidade, se for
 * de uma Unidade da mesma UF (os nomes coincidem com os do Exact), senão a região da UF (D2).
 */
export function regiaoDoLead(data: Record<string, string>): string | undefined {
  const cidade = nonEmpty(data.cidade) ?? ''
  // hasOwn: cidade/UF vêm do cliente e "constructor" não pode achar chave herdada do objeto.
  const antiga = Object.hasOwn(REGIAO_POR_CIDADE, cidade) ? REGIAO_POR_CIDADE[cidade] : undefined
  if (antiga) return antiga
  const uf = nonEmpty(data.uf)
  if (!uf) return undefined
  const cidadesDaUf = Object.hasOwn(CIDADES_DAS_UNIDADES, uf) ? CIDADES_DAS_UNIDADES[uf] : []
  if (cidadesDaUf.includes(cidade)) return cidade
  return Object.hasOwn(REGIAO_DA_UF, uf) ? REGIAO_DA_UF[uf] : undefined
}

const CANAL_FIELD = 'origem — Canal (origem)'
const LANDING_FIELD = 'origem — Página de entrada'

/** Base pra transformar a página de entrada em URL clicável no CRM. */
const SITE_URL = 'https://www.semog.com.br'

/**
 * Corpo do lead (`LeadEstruturaCriacaoODataDTO`). Vai aninhado em
 * `{ lead: … }` no `POST /LeadsAdd` — ver `client.ts`.
 */
export type ExactLeadInput = {
  name: string
  sdrEmail: string
  funnelId: number
  source: string
  industry?: string
  ddiPhone?: string
  phone?: string
  mktLink?: string
  description: string
}

/** Contato principal do lead (`POST /PersonsAdd`), sem o `leadId`. */
export type ExactPersonInput = {
  name: string
  email?: string
  jobTitle?: string
  ddiPhone1?: string
  phone1?: string
  mainContact: true
}

export type MappedLead = { lead: ExactLeadInput; person: ExactPersonInput }

/**
 * Só pedido de proposta entra no CRM. Os outros assuntos do formulário de
 * Contato são atendimento a quem já é cliente (2ª via, CND, acordo…) e
 * sujariam o pipeline — mesma regra que o cron do Google Ads usa pra decidir o
 * que é captação.
 */
export function isExactEligible(formType: FormType, data: Record<string, string>): boolean {
  // Inscrição em evento é relacionamento, não captação: nunca vira card no
  // CRM. Explícito de propósito — sem esta linha o comportamento correto
  // dependeria da AUSÊNCIA do campo `assunto`, o que é frágil.
  if (formType === 'experience') return false
  // "Já sou cliente" (etapa 2 do formulário v2) não é lead: nem card, nem Ads, nem desfecho (spec 4.3).
  if (formType === 'proposta') return data.cliente !== 'sim'
  return data.assunto === 'proposta-comercial'
}

/** `+5583999501388` → `{ ddi: '55', nacional: '83999501388' }`; `null` se não parsear. */
function splitPhone(raw: string | undefined): { ddi: string; nacional: string } | null {
  if (!raw) return null
  const parsed = parsePhoneNumberFromString(raw)
  if (!parsed) return null
  return { ddi: parsed.countryCallingCode, nacional: parsed.nationalNumber }
}

function nonEmpty(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

/**
 * A atribuição guarda a página de entrada como CAMINHO (`/` ou
 * `/administradora-de-condominios-belem`), e caminho solto no CRM não é
 * clicável — visto nos dois primeiros leads reais (2026-07-30). Completa com o
 * domínio; se já vier URL absoluta, devolve como está.
 */
function urlAbsoluta(valor: string | undefined): string | undefined {
  if (!valor) return undefined
  if (/^https?:\/\//i.test(valor)) return valor
  return `${SITE_URL}${valor.startsWith('/') ? '' : '/'}${valor}`
}

/** Tudo que veio da atribuição, em linhas legíveis pra `description`. */
function linhasDeOrigem(data: Record<string, string>): string[] {
  return Object.entries(data)
    .filter(([key, value]) => key.startsWith('origem — ') && value)
    .map(([key, value]) => `${key.replace('origem — ', '')}: ${value}`)
}

/**
 * Qual formulário originou o lead muda o que esperar dele: "proposta" é
 * pedido explícito com os campos do condomínio; "contato" é alguém que
 * escreveu pedindo proposta pela página de atendimento, normalmente com
 * menos dados e mais texto livre. Quem for qualificar precisa saber disso.
 *
 * O contato rápido da triagem do WhatsApp grava como `proposta`, mas chega só
 * com nome, WhatsApp e cidade — a linha diz isso e traz o protocolo, que é como
 * a pessoa se identifica quando continua a conversa no WhatsApp.
 */
function linhaDoFormulario(formType: FormType, data: Record<string, string>): string {
  if (formType !== 'proposta') {
    return 'Origem: formulário de contato do site (assunto proposta comercial).'
  }
  if (data.variante === VARIANTE_CONTATO_RAPIDO) {
    const protocolo = nonEmpty(data.protocolo)
    return `Origem: contato rápido pelo botão de WhatsApp do site.${protocolo ? ` Protocolo ${protocolo}.` : ''}`
  }
  if (data.variante === VARIANTE_DUAS_ETAPAS) {
    // `etapa` não é gravada em `data`: vem da coluna, juntada por `dadosParaOExact`.
    return data.etapa === '1'
      ? 'Origem: formulário de proposta do site, parcial: só etapa 1 (a pessoa não concluiu a etapa 2).'
      : 'Origem: formulário de proposta do site (duas etapas).'
  }
  return 'Origem: formulário de proposta do site.'
}

export function mapLead(
  formType: FormType,
  data: Record<string, string>,
  sdrEmail: string,
): MappedLead {
  const phone = splitPhone(nonEmpty(data.telefone))

  // Mídia paga entra como origem "Anúncio" pra Daiane ver na hora que o lead
  // custou dinheiro. O gclid cobre gclid/gbraid/wbraid (a atribuição funde os
  // três nesse rótulo); o canal classificado cobre msclkid e utm_medium=cpc.
  const pago = Boolean(nonEmpty(data[GCLID_FIELD])) || /tráfego pago/i.test(data[CANAL_FIELD] ?? '')

  // A v3 não grava campo personalizado (só a v2, desativada), então o que o
  // site coleta e o Exact não tem campo próprio pra receber — papel, tipo de
  // condomínio, nº de unidades — vai aqui, cru, do jeito que a pessoa marcou.
  const informado = [
    nonEmpty(data.cargo) && `papel: ${data.cargo}`,
    nonEmpty(data.tipo) && `tipo: ${data.tipo}`,
    nonEmpty(data.unidades) && `unidades: ${data.unidades}`,
    nonEmpty(data.cidade) && `cidade: ${data.cidade}`,
    nonEmpty(data.uf) && `UF: ${data.uf}`,
    nonEmpty(data.cliente) && `já é cliente: ${data.cliente === 'sim' ? 'sim' : 'não'}`,
    nonEmpty(data.assunto) && `assunto: ${data.assunto}`,
    nonEmpty(data.email) && `e-mail: ${data.email}`,
  ].filter(Boolean) as string[]

  const descricao = [
    nonEmpty(data.mensagem),
    informado.length ? `Informado no site — ${informado.join(' · ')}` : undefined,
    linhaDoFormulario(formType, data),
    ...linhasDeOrigem(data),
  ].filter(Boolean) as string[]

  return {
    lead: {
      name: nonEmpty(data.nomeCondominio) ?? nonEmpty(data.nome) ?? 'Lead do site',
      sdrEmail,
      funnelId: FUNIL_PADRAO,
      source: pago ? SOURCE_ANUNCIO : SOURCE_SITE,
      // Sem `subSource` de propósito: a API CRIA a sub-origem quando recebe um
      // valor que não existe, então mandar isso daqui mexeria no cadastro do
      // Exact sem ninguém pedir. A granularidade fica no `mktLink`.
      industry: regiaoDoLead(data),
      ddiPhone: phone?.ddi,
      phone: phone?.nacional,
      mktLink: urlAbsoluta(nonEmpty(data[LANDING_FIELD])),
      description: descricao.join('\n'),
    },
    person: {
      name: nonEmpty(data.nome) ?? 'Contato do site',
      email: nonEmpty(data.email),
      jobTitle: nonEmpty(data.cargo),
      ddiPhone1: phone?.ddi,
      phone1: phone?.nacional,
      mainContact: true,
    },
  }
}
