import { JWT } from 'google-auth-library'
import { NextResponse } from 'next/server'
import { paraDataManager } from '@/lib/adsConsent'
import {
  corteDaJanelaRd,
  type LinhaMarcoRd,
  MARCOS_RD,
  type MarcoPendente,
  type MarcoRd,
  SQL_MARCOS_RD,
  SQL_REGISTRAR_RD,
  selecionarMarcosRd,
} from '@/lib/conversoesRd'
import { query } from '@/lib/db'
import { TIPO_CLIQUE_FIELD } from '@/lib/forms'
import { SECOES_FORA_DO_ADS } from '@/lib/triagem'

/**
 * Cron (Vercel) — sobe conversões pro Google Ads pelo SERVIDOR, à prova de
 * ad-blocker. O `AttributionTracker` grava o `gclid` num cookie de 1ª parte
 * (não bloqueável) e daí saem os dois sinais que hoje valem conversão:
 *
 * - **Formulário** (`cms.leads`) → ação `Proposta (servidor) - gclid`.
 * - **Clique no WhatsApp** (`cms.whatsapp_clicks`, via `/api/track/whatsapp`)
 *   → ação `WhatsApp (servidor) - gclid`.
 * - **Marcos do RD CRM** (25/11/2026) → ações `RD - Proposta enviada` e
 *   `RD - Ganho`, com a data real do marco. Regra, janela de 90 dias e
 *   deduplicação em `@/lib/conversoesRd`; o registro do que subiu fica em
 *   `cms.ads_conversoes_rd`, não em `uploaded_to_ads`. Cada ação só sobe com a
 *   sua variável de ambiente, e uma falha nesse lote não afeta os outros dois.
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
 * 1×/dia (vercel.json).
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

const INGEST_URL = 'https://datamanager.googleapis.com/v1/events:ingest'
const SCOPE = 'https://www.googleapis.com/auth/datamanager'
const WINDOW_DAYS = 3

/** Bigint (`id`) volta do `pg` como string — sem type parser custom. */
type PendingRow = {
  id: string
  created_at: string | Date
  /** O click id do Google; apesar do nome da coluna, pode ser gbraid ou wbraid. */
  gclid: string
  /** `TIPO_CLIQUE_FIELD` do lead; só existe no SELECT de leads. Ausente = gclid. */
  tipo_de_clique?: string | null
  /**
   * Consentimento de publicidade gravado na captura ('granted' | 'denied').
   * `null` nas linhas anteriores à coluna existir — ver `paraDataManager`,
   * que documenta como elas são tratadas e até quando isso importa.
   */
  ads_consent: string | null
}

type TipoDeClique = 'gclid' | 'gbraid' | 'wbraid'

/** Tipo gravado em `data` (`TIPO_CLIQUE_FIELD`); ausente ou desconhecido = gclid, o formato de hoje. */
function tipoDeClique(valor: string | null | undefined): TipoDeClique {
  return valor === 'gbraid' || valor === 'wbraid' ? valor : 'gclid'
}

type EventoDataManager = Record<string, unknown>

type BatchResult = {
  considered: number
  ok: boolean
  status?: number
  response?: string
  skipped?: string
}

export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const {
    GOOGLE_ADS_LOGIN_CUSTOMER_ID: LOGIN,
    GOOGLE_ADS_CUSTOMER_ID: CUSTOMER,
    GOOGLE_ADS_CONVERSION_ACTION_ID: CONV_ACTION,
    GOOGLE_ADS_WHATSAPP_CONVERSION_ACTION_ID: WA_ACTION,
    GOOGLE_ADS_IMPERSONATED_EMAIL: SUBJECT,
    GOOGLE_SA_JSON,
  } = process.env

  // `WA_ACTION` é opcional de propósito: o código do WhatsApp pode subir antes
  // da ação de conversão existir no Ads. Sem ela, essa metade é pulada (e dita
  // na resposta) em vez de derrubar o upload dos leads, que é o crítico.
  if (!LOGIN || !CUSTOMER || !CONV_ACTION || !SUBJECT || !GOOGLE_SA_JSON) {
    return NextResponse.json(
      { error: 'faltam variáveis de ambiente do Google Ads' },
      { status: 500 },
    )
  }

  try {
    const cutoff = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()

    // Leads com gclid que são de fato CAPTAÇÃO, ainda não enviados
    // (`uploaded_to_ads = false`) e dentro da janela de retenção.
    //
    // O form "proposta" é captação por definição. O form "contato" **não**:
    // 7 dos 9 `ASSUNTO_OPTIONS` (`src/lib/form-schemas.ts`) são atendimento a
    // condômino que já é cliente — segunda via de boleto, CND, acordo de
    // pagamento, alteração de titularidade, declaração de quitação, reserva de
    // área comum, dúvida geral. Subir isso como conversão ensinaria o Smart
    // Bidding a comprar clique de quem já é cliente — exatamente o erro que a
    // conta tinha antes (otimizar por pageview/rota no mapa). Só
    // `assunto = 'proposta-comercial'` é pedido de proposta, e aí sim conta,
    // na mesma ação `Proposta (servidor) - gclid` (mesma intenção de compra).
    const { rows: leads } = await query<PendingRow>(
      `select id, created_at, gclid, ads_consent, data->>'${TIPO_CLIQUE_FIELD}' as tipo_de_clique
         from cms.leads
       where gclid is not null
         and (form = 'proposta' or (form = 'contato' and data->>'assunto' = 'proposta-comercial'))
         and created_at > $1 and uploaded_to_ads = false
       order by created_at desc`,
      [cutoff],
    )

    // Nenhum clique saído da triagem do botão flutuante conta como conversão:
    // cliente é atendimento, outro assunto é indefinido, e a proposta já conta
    // pela ação do formulário — ver `SECOES_FORA_DO_ADS`. O `coalesce` é necessário:
    // `section` é nula em clique antigo ou com seção recusada pelo beacon, e
    // `null not in (...)` dá nulo, o que descartaria esses cliques em silêncio.
    const { rows: whatsapp } = await query<PendingRow>(
      `select id, created_at, gclid, ads_consent from cms.whatsapp_clicks
       where gclid is not null and created_at > $1 and uploaded_to_ads = false
         and coalesce(section, '') <> all($2::text[])
       order by created_at desc`,
      [cutoff, SECOES_FORA_DO_ADS],
    )

    // Marcos do RD: lidos antes do token para saber se há o que subir. Sem
    // nenhuma das duas ações configurada, nem consulta o banco. Erro aqui
    // (fachada ausente, banco fora) fica só neste lote.
    const acoesRd = MARCOS_RD.map((m) => ({ ...m, destino: process.env[m.env] || null }))
    const pendentesRd = new Map<MarcoRd, MarcoPendente[]>()
    let erroRd: string | null = null
    if (acoesRd.some((a) => a.destino)) {
      try {
        const { rows } = await query<LinhaMarcoRd>(SQL_MARCOS_RD, [corteDaJanelaRd(Date.now())])
        for (const a of acoesRd) {
          if (a.destino) pendentesRd.set(a.marco, selecionarMarcosRd(rows, a.marco))
        }
      } catch (err) {
        console.error('[cron/upload-ads-conversions] marcos RD: erro ao ler', err)
        erroRd = String(err)
      }
    }
    for (const a of acoesRd) {
      if (!a.destino) {
        console.info(`[cron/upload-ads-conversions] ${a.env} não configurada; "${a.acao}" não sobe`)
      }
    }
    const temRd = [...pendentesRd.values()].some((p) => p.length > 0)

    // Token uma vez só, reaproveitado por todos os lotes.
    let accessToken: string | null = null
    if (leads.length || (whatsapp.length && WA_ACTION) || temRd) {
      const sa = JSON.parse(GOOGLE_SA_JSON) as { client_email: string; private_key: string }
      const jwt = new JWT({
        email: sa.client_email,
        key: sa.private_key,
        scopes: [SCOPE],
        subject: SUBJECT,
      })
      accessToken = (await jwt.authorize()).access_token ?? null
    }

    /**
     * Um evento da Data Manager API. `quando` é a hora da conversão: a criação
     * do lead ou do clique, ou a data real do marco no RD.
     */
    function evento(row: PendingRow, quando: string | Date, transactionId: string) {
      return {
        // gclid, gbraid e wbraid são campos distintos em AdIdentifiers (referência
        // da Data Manager API). Antes ia tudo como `gclid`, e um clique de iOS
        // (gbraid/wbraid) chegava ao Google no campo errado.
        adIdentifiers: { [tipoDeClique(row.tipo_de_clique)]: row.gclid },
        conversionValue: 1,
        currency: 'BRL',
        eventTimestamp: new Date(quando).toISOString(),
        transactionId,
        eventSource: 'WEB',
        // Consentimento POR EVENTO: a Data Manager API aceita `consent`
        // dentro de cada `Event` e ele vence o do lote ("user-level consent
        // overrides request-level consent"), então não é preciso partir o
        // lote por valor. Antes havia aqui um `CONSENT_GRANTED` fixo no
        // nível do lote — uma afirmação igual para todos, que o site não
        // tinha como sustentar. Agora vem da coluna gravada na captura;
        // o tratamento de linha legada (`null`) e a data em que ele expira
        // estão em `paraDataManager` (`@/lib/adsConsent`).
        consent: {
          adUserData: paraDataManager(row.ads_consent),
          adPersonalization: paraDataManager(row.ads_consent),
        },
      }
    }

    /**
     * Sobe um lote para uma ação e, só com a resposta OK, chama `marcar` para
     * registrar o envio no banco.
     */
    async function enviar(
      events: EventoDataManager[],
      destinationId: string,
      marcar: () => Promise<unknown>,
    ): Promise<BatchResult> {
      if (events.length === 0) return { considered: 0, ok: true }
      if (!accessToken) return { considered: events.length, ok: false, skipped: 'sem token' }

      const body = {
        destinations: [
          {
            operatingAccount: { accountType: 'GOOGLE_ADS', accountId: CUSTOMER },
            loginAccount: { accountType: 'GOOGLE_ADS', accountId: LOGIN },
            productDestinationId: destinationId,
          },
        ],
        events,
      }

      const res = await fetch(INGEST_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = (await res.json()) as Record<string, unknown>

      // Só marca como enviado depois de confirmar `res.ok` — a API não devolve
      // status por evento individual (é uma chamada "tudo ou nada"), então uma
      // resposta OK cobre todo o lote; uma falha não marca nada, e as linhas
      // voltam a aparecer no SELECT de amanhã (retry natural).
      if (res.ok) await marcar()

      return {
        considered: events.length,
        ok: res.ok,
        status: res.status,
        response: JSON.stringify(json).slice(0, 300),
      }
    }

    function uploadBatch(
      rows: PendingRow[],
      destinationId: string,
      table: 'cms.leads' | 'cms.whatsapp_clicks',
      prefix: 'lead' | 'wa',
    ): Promise<BatchResult> {
      return enviar(
        rows.map((row) => evento(row, row.created_at, `${prefix}-${row.id}`)),
        destinationId,
        () =>
          query(`update ${table} set uploaded_to_ads = true where id = any($1::bigint[])`, [
            rows.map((row) => row.id),
          ]),
      )
    }

    const leadResult = await uploadBatch(leads, CONV_ACTION, 'cms.leads', 'lead')
    const waResult: BatchResult = WA_ACTION
      ? await uploadBatch(whatsapp, WA_ACTION, 'cms.whatsapp_clicks', 'wa')
      : {
          considered: whatsapp.length,
          ok: true,
          skipped: 'GOOGLE_ADS_WHATSAPP_CONVERSION_ACTION_ID não configurada',
        }

    // Um lote por marco, cada um na sua ação. Erro de rede ou de banco aqui é
    // registrado na resposta deste marco: leads e WhatsApp já foram marcados
    // acima e não podem virar 500 por causa dele.
    const rd: Record<string, BatchResult> = {}
    for (const a of acoesRd) {
      if (!a.destino) {
        rd[a.marco] = { considered: 0, ok: true, skipped: `${a.env} não configurada` }
        continue
      }
      if (erroRd) {
        rd[a.marco] = { considered: 0, ok: false, skipped: `erro ao ler marcos: ${erroRd}` }
        continue
      }
      const pendentes = pendentesRd.get(a.marco) ?? []
      try {
        rd[a.marco] = await enviar(
          pendentes.map(({ linha, marcoEm }) => evento(linha, marcoEm, `${a.prefixo}-${linha.id}`)),
          a.destino,
          () =>
            query(SQL_REGISTRAR_RD, [
              pendentes.map(({ linha }) => linha.id),
              a.marco,
              pendentes.map(({ marcoEm }) => marcoEm.toISOString()),
            ]),
        )
      } catch (err) {
        console.error(`[cron/upload-ads-conversions] "${a.acao}": erro`, err)
        rd[a.marco] = { considered: pendentes.length, ok: false, skipped: String(err) }
      }
    }

    return NextResponse.json({
      ok: leadResult.ok && waResult.ok && Object.values(rd).every((r) => r.ok),
      leads: leadResult,
      whatsapp: waResult,
      rd,
    })
  } catch (err) {
    console.error('[cron/upload-ads-conversions] erro:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
