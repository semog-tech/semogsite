import { TIPO_CLIQUE_FIELD } from '@/lib/forms'

/**
 * Conversões de **qualidade** do RD CRM para o Google Ads (decisão de
 * 25/11/2026): além do pedido de proposta, o Ads passa a saber quais desses
 * leads andaram no funil, para o Smart Bidding comprar clique de quem vira
 * negócio e não só de quem preenche formulário.
 *
 * - **RD - Proposta enviada**: a negociação chegou a "Visita realizada" ou a
 *   uma etapa depois dela (Negociação, Vendidos), ou foi ganha.
 * - **RD - Ganho**: chegou a "Vendidos" ou foi ganha.
 *
 * Perdido não vira conversão. A regra e a data real de cada marco ficam no
 * banco, em `cms.crm_rdstation_marcos_obter()`: a API do RD não informa quando
 * a negociação mudou de etapa, e o semogapp grava cada mudança recebida pelo
 * webhook (`db/2026-11-25-ads-conversoes-rd-postgres.sql` e a migração do
 * semogapp que ele exige).
 *
 * Cada marco tem a sua ação no Ads, lida de uma variável de ambiente. Sem a
 * variável, o marco não sobe e fica pendente: o código pode ir ao ar antes de
 * as ações existirem.
 */

export type MarcoRd = 'proposta_enviada' | 'ganho'

export const MARCOS_RD: readonly {
  marco: MarcoRd
  /** Variável de ambiente com o id da ação de conversão no Google Ads. */
  env: string
  /** Nome da ação no Google Ads, para log e documentação. */
  acao: string
  /** Prefixo do `transactionId`; nunca colide com `lead-` nem `wa-`. */
  prefixo: string
}[] = [
  {
    marco: 'proposta_enviada',
    env: 'GOOGLE_ADS_RD_PROPOSTA_CONVERSION_ACTION_ID',
    acao: 'RD - Proposta enviada',
    prefixo: 'rd-proposta',
  },
  {
    marco: 'ganho',
    env: 'GOOGLE_ADS_RD_GANHO_CONVERSION_ACTION_ID',
    acao: 'RD - Ganho',
    prefixo: 'rd-ganho',
  },
]

/**
 * Janela máxima de conversão por clique do Google Ads: 90 dias. O site não
 * guarda a hora do clique, então conta a partir da criação do lead, que é o
 * limite mais tarde possível. Clique bem anterior ao lead pode fazer o Google
 * recusar um evento dentro desta janela; essa recusa é por evento, no
 * processamento assíncrono, e não derruba o lote.
 */
export const JANELA_RD_DIAS = 90
const JANELA_RD_MS = JANELA_RD_DIAS * 24 * 60 * 60 * 1000

/** Linha do SELECT de `SQL_MARCOS_RD`. Bigint volta do `pg` como string. */
export type LinhaMarcoRd = {
  id: string
  created_at: string | Date
  gclid: string | null
  tipo_de_clique?: string | null
  ads_consent: string | null
  proposta_enviada_em: string | Date | null
  ganho_em: string | Date | null
  /** Marcos deste lead já aceitos pelo Google (`cms.ads_conversoes_rd`). */
  enviados: string[] | null
}

export type MarcoPendente = { linha: LinhaMarcoRd & { gclid: string }; marcoEm: Date }

/**
 * Leads do site com gclid, criados dentro da janela, e os marcos que já têm
 * no RD. `$1` é o corte da janela (agora menos `JANELA_RD_DIAS`). A fachada só
 * devolve lead com pelo menos um marco, então a consulta é pequena.
 */
export const SQL_MARCOS_RD = `select l.id, l.created_at, l.gclid, l.ads_consent,
       l.data->>'${TIPO_CLIQUE_FIELD}' as tipo_de_clique,
       m.proposta_enviada_em, m.ganho_em,
       array(select c.marco from cms.ads_conversoes_rd c where c.lead_id = l.id) as enviados
  from cms.crm_rdstation_marcos_obter() m
  join cms.leads l on l.id = m.lead_id
 where l.gclid is not null and l.created_at > $1
 order by l.created_at`

/**
 * Registro do que o Google aceitou: um único INSERT por marco, depois da
 * resposta OK. A chave primária (lead, marco) é a deduplicação; o
 * `on conflict` cobre duas execuções do cron ao mesmo tempo.
 */
export const SQL_REGISTRAR_RD = `insert into cms.ads_conversoes_rd (lead_id, marco, marco_em)
select lead_id, $2, marco_em
  from unnest($1::bigint[], $3::timestamptz[]) as t(lead_id, marco_em)
on conflict (lead_id, marco) do nothing`

export function corteDaJanelaRd(agora: number): string {
  return new Date(agora - JANELA_RD_MS).toISOString()
}

function data(valor: string | Date | null): Date | null {
  if (valor === null) return null
  const d = new Date(valor)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * Escolhe o que sobe de um marco. Fica de fora o lead sem gclid, o que já
 * subiu esse marco, o marco que ainda não aconteceu, o que caiu fora da
 * janela de 90 dias e o marco anterior à criação do lead (o Google recusa
 * conversão antes do clique, e um marco assim indica vínculo errado).
 */
export function selecionarMarcosRd(linhas: LinhaMarcoRd[], marco: MarcoRd): MarcoPendente[] {
  const coluna = marco === 'proposta_enviada' ? 'proposta_enviada_em' : 'ganho_em'
  const pendentes: MarcoPendente[] = []
  for (const linha of linhas) {
    if (!linha.gclid) continue
    if (linha.enviados?.includes(marco)) continue
    const marcoEm = data(linha[coluna])
    const criadoEm = data(linha.created_at)
    if (!marcoEm || !criadoEm) continue
    if (marcoEm.getTime() < criadoEm.getTime()) continue
    if (marcoEm.getTime() > criadoEm.getTime() + JANELA_RD_MS) continue
    pendentes.push({ linha: { ...linha, gclid: linha.gclid }, marcoEm })
  }
  return pendentes
}
