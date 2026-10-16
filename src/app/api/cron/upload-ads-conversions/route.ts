import { NextResponse } from 'next/server'
import {
  type ConfigAds,
  ingerirConversoes,
  lerConfigAds,
  obterTokenAds,
  tipoDeClique,
} from '@/lib/ads/conversoes'
import { query } from '@/lib/db'
import { SQL_LEADS_PARA_O_ADS } from '@/lib/leads/criterios'
import { descreverErro, reportarFalhaDoLead } from '@/lib/leads/reportar'
import { SECOES_FORA_DO_ADS } from '@/lib/triagem'

/**
 * Cron (Vercel) — sobe conversões pro Google Ads pelo SERVIDOR, à prova de
 * ad-blocker. O `AttributionTracker` grava o `gclid` num cookie de 1ª parte
 * (não bloqueável) e daí saem os dois sinais que hoje valem conversão:
 *
 * - **Formulário** (`cms.leads`) → ação `Proposta (servidor) - gclid`.
 * - **Clique no WhatsApp** (`cms.whatsapp_clicks`, via `/api/track/whatsapp`)
 *   → ação `WhatsApp (servidor) - gclid`.
 *
 * O WhatsApp entrou porque é o canal dominante e estava invisível: medido em
 * 29/07/2026 no GA4 (janela 24-29/07, tracking limpo), 14 `whatsapp_click`
 * contra 5 `generate_lead` — e no tráfego pago, 7 contra 1. O Ads enxergava só
 * o formulário, então a campanha aparentava 1 resultado tendo gerado ~8
 * contatos, e o Smart Bidding otimizaria por um sinal raro.
 *
 * Envio pela **Data Manager API** (`events:ingest`) — o método novo do Google
 * (o antigo `UploadClickConversions` foi restrito a contas legadas). Uma
 * chamada por ação de conversão, porque `productDestinationId` é por destino.
 *
 * **Consentimento vai por evento** (11/09/2026), lido da coluna `ads_consent`
 * que a captura grava (ver `@/lib/adsConsent`). Antes ia um `CONSENT_GRANTED`
 * fixo no nível do lote, igual para todo mundo — o site afirmava ao Google um
 * consentimento que não tinha como sustentar, e que era inclusive o oposto do
 * que a própria página declarava no Consent Mode.
 *
 * Auth: service account + domain-wide delegation com o escopo
 * `https://www.googleapis.com/auth/datamanager` (precisa estar autorizado no
 * Admin do Workspace pro client-id da SA). `CRON_SECRET` (Bearer). Roda
 * 1×/dia (vercel.json) e, desde a fase 2 do site v2, é a **rede de recuperação**
 * do formulário: a conversão sobe na hora junto com o Exact
 * (`@/lib/leads/posGravacao`); aqui sobe o que falhou lá, com o mesmo critério e
 * o mesmo `transactionId`.
 *
 * Idempotência: o backstop de verdade contra conversão duplicada é o
 * `transactionId` (estável entre retries — `lead-<id>` / `wa-<id>`, prefixados
 * pra que um lead e um clique de WhatsApp com o mesmo id numérico nunca
 * colidam) que vai em cada evento pra Data Manager API — o Google dedupe por
 * esse campo, então mesmo que a mesma linha seja enviada 2x (ex.: corrida
 * entre execuções do cron), o Ads não conta a conversão duas vezes. A coluna
 * `uploaded_to_ads` é só a otimização que evita reenviar o que já foi
 * confirmado, reduzindo volume de chamadas — não é a única linha de defesa. A
 * janela de `WINDOW_DAYS` continua como cinto-e-suspensório (evita reprocessar
 * todo o histórico se a flag um dia for resetada por engano). O UPDATE que
 * marca as linhas só roda **depois** da resposta do Google vir OK, e é um
 * único `update ... where id = any($1)` (todos os ids do lote de uma vez, não
 * um loop de UPDATEs sequenciais) — assim a marcação é tudo-ou-nada no banco:
 * não há como o processo morrer no meio de N updates individuais e deixar
 * linhas já enviadas mas ainda `uploaded_to_ads = false`. Se o upload falhar
 * (ou o cron cair antes do UPDATE), nada é marcado e tudo é retentado no
 * próximo dia; nunca marcamos antes de confirmar, pra nunca perder uma
 * conversão silenciosamente.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const WINDOW_DAYS = 3

/** Bigint (`id`) volta do `pg` como string. `tipo_de_clique` só existe no SELECT de leads. */
type PendingRow = {
  id: string
  created_at: string | Date
  gclid: string
  ads_consent: string | null
  tipo_de_clique?: string | null
}

type BatchResult = {
  considered: number
  ok: boolean
  status?: number
  response?: string
  skipped?: string
}

async function subirLote(
  linhas: PendingRow[],
  destinoId: string,
  tabela: 'cms.leads' | 'cms.whatsapp_clicks',
  prefixo: 'lead' | 'wa',
  acesso: { token: string | null; config: ConfigAds },
): Promise<BatchResult> {
  if (linhas.length === 0) return { considered: 0, ok: true }
  if (!acesso.token) return { considered: linhas.length, ok: false, skipped: 'sem token' }
  const resultado = await ingerirConversoes(
    acesso.token,
    acesso.config,
    destinoId,
    linhas.map((linha) => ({
      transactionId: `${prefixo}-${linha.id}`,
      tipoDeClique: tipoDeClique(linha.tipo_de_clique),
      clique: linha.gclid,
      criadoEm: linha.created_at,
      adsConsent: linha.ads_consent,
    })),
  )
  // Só marca depois do OK do Google: tudo ou nada, retry natural no dia seguinte.
  if (resultado.ok) {
    await query(`update ${tabela} set uploaded_to_ads = true where id = any($1::bigint[])`, [
      linhas.map((linha) => linha.id),
    ])
  }
  return {
    considered: linhas.length,
    ok: resultado.ok,
    status: resultado.status,
    response: resultado.resposta,
  }
}

export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // A ação do WhatsApp é opcional: sem ela, essa metade é pulada (e dita na resposta).
  const config = lerConfigAds()
  if (!config) {
    return NextResponse.json(
      { error: 'faltam variáveis de ambiente do Google Ads' },
      { status: 500 },
    )
  }

  try {
    const corte = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()

    // Leads de captação ainda não enviados, com o MESMO critério do envio na hora (D1):
    // pronto para envio, de produção, não cliente e já processado por quem gravou. O
    // comentário sobre o form "contato" (só proposta comercial conta) vale aqui igual.
    const { rows: leads } = await query<PendingRow>(SQL_LEADS_PARA_O_ADS, [corte])

    // Nenhum clique saído da triagem conta como conversão (ver `SECOES_FORA_DO_ADS`). O
    // `coalesce` evita descartar em silêncio o clique antigo sem seção.
    const { rows: whatsapp } = await query<PendingRow>(
      `select id, created_at, gclid, ads_consent from cms.whatsapp_clicks
       where gclid is not null and created_at > $1 and uploaded_to_ads = false
         and coalesce(section, '') <> all($2::text[])
       order by created_at desc`,
      [corte, SECOES_FORA_DO_ADS],
    )

    const precisaToken = leads.length > 0 || (whatsapp.length > 0 && Boolean(config.acaoWhatsapp))
    const acesso = { token: precisaToken ? await obterTokenAds(config) : null, config }

    const leadResult = await subirLote(leads, config.acaoProposta, 'cms.leads', 'lead', acesso)
    const waResult: BatchResult = config.acaoWhatsapp
      ? await subirLote(whatsapp, config.acaoWhatsapp, 'cms.whatsapp_clicks', 'wa', acesso)
      : {
          considered: whatsapp.length,
          ok: true,
          skipped: 'GOOGLE_ADS_WHATSAPP_CONVERSION_ACTION_ID não configurada',
        }

    return NextResponse.json({
      ok: leadResult.ok && waResult.ok,
      leads: leadResult,
      whatsapp: waResult,
    })
  } catch (err) {
    reportarFalhaDoLead('cron', err, { origem: 'cron-ads' })
    // Só a classe do erro: o texto do Postgres pode ecoar dado pessoal.
    return NextResponse.json({ error: descreverErro(err) }, { status: 500 })
  }
}
