import type { ErrorEvent } from '@sentry/nextjs'
import * as Sentry from '@sentry/nextjs'
import { describe, expect, it } from 'vitest'

/**
 * Por que nenhum dos dois filtros de ruído é um `denyUrls`.
 *
 * Este arquivo **não é a trava** — quem impede que o filtro suma são
 * `sentry-filters.int.spec.ts`, que roda o objeto de opções da produção contra
 * o SDK real, e `sentry-init-aplica-filtros.int.spec.ts`, que exige que o
 * `init` use esse objeto. O papel daqui é outro e é documental: executar a
 * alternativa tentadora e mostrar, contra o SDK de verdade, que ela descarta
 * **zero** eventos nos dois casos que temos em mãos. Sem isso, a justificativa
 * em prosa de `src/lib/sentryFilters.ts` seria só uma afirmação.
 *
 * O motivo está em `@sentry/core@10.65.0`, `integrations/eventFilters.js`:
 * `_getEventFilterUrl` devolve **uma** URL, a que `_getLastValidUrl` acha
 * varrendo os frames de trás para frente — a do topo da pilha — e devolve
 * `null` quando não há pilha. Com `null`, `_isDeniedUrl` sai `false` sem
 * consultar padrão algum.
 *
 * Mora em arquivo próprio porque precisa de um `Sentry.init` diferente do de
 * `sentry-filters.int.spec.ts`, e só o primeiro `init` de cada processo vale —
 * um segundo devolve um client que engole tudo em silêncio.
 */

/**
 * O envelope que o transporte recebe, derivado do próprio `Sentry.init` — o
 * `@sentry/nextjs` não reexporta o tipo `Envelope` do core. Anotar é
 * obrigatório: o `init` aceita uma união de tipos de opção (browser, node,
 * edge) e a inferência contextual não atravessa a união.
 */
type EnvelopeDoSentry = Parameters<
  ReturnType<NonNullable<Parameters<typeof Sentry.init>[0]['transport']>>['send']
>[0]

/** Script do webview do Instagram, como veio no evento real. */
const SCRIPT_DA_META = 'app://navigation_performance_logger_android'

/** Eventos que chegaram ao transporte, ou seja, que sairiam pela rede. */
const enviados: ErrorEvent[] = []

Sentry.init({
  dsn: 'https://exemplo@o0.ingest.sentry.io/1',
  enabled: true,
  tracesSampleRate: 0,

  // A troca tentadora — e inócua — que este arquivo existe para desencorajar.
  // Sem `beforeSend`: o `denyUrls` está sozinho, sob teste.
  denyUrls: [/obscura/, new RegExp(`^${SCRIPT_DA_META}`)],

  transport: () => ({
    send: async (envelope: EnvelopeDoSentry) => {
      const [, itens] = envelope
      for (const [cabecalho, payload] of itens) {
        // Quando o cabeçalho do item diz `event`, o payload É o evento; a
        // união só é ampla por causa dos outros tipos de item do envelope.
        if (cabecalho.type === 'event') enviados.push(payload as ErrorEvent)
      }
      return {}
    },
    flush: async () => true,
  }),
})

/** O evento real do scraper: o frame culpado está no meio, não no topo. */
function eventoDoScraper(): ErrorEvent {
  return {
    // `ErrorEvent` exige o discriminante explícito: erro é o caso `undefined`.
    type: undefined,
    exception: {
      values: [
        {
          type: 'TypeError',
          value: "Cannot read properties of null (reading 'replace')",
          stacktrace: {
            frames: [
              { filename: 'ext:core/01_core.js', lineno: 294, colno: 9 },
              { filename: '<script>', lineno: 1, colno: 100633 },
              { filename: '<script>', function: 'xm', lineno: 1, colno: 98865 },
              { filename: '<obscura:bootstrap>', lineno: 312, colno: 11 },
              { filename: '<script>', function: 'n', lineno: 7, colno: 5336 },
            ],
          },
        },
      ],
    },
  }
}

/** O erro do webview do Instagram chegando sem pilha, como o `beforeunload` costuma entregar. */
function eventoDoInstagramSemPilha(): ErrorEvent {
  return {
    type: undefined,
    exception: {
      values: [{ type: 'Error', value: 'Error invoking postMessage: Java object is gone' }],
    },
  }
}

/** Os `filename` de todos os frames dos eventos que chegaram ao transporte. */
function arquivosEnviados(): string {
  return enviados
    .flatMap(
      (evento) =>
        evento.exception?.values?.flatMap(
          (excecao) => excecao.stacktrace?.frames?.map((frame) => frame.filename ?? '') ?? [],
        ) ?? [],
    )
    .join(' ')
}

describe('as duas limitações do denyUrls', () => {
  it('não alcança o frame do scraper, porque só consulta o topo da pilha', async () => {
    Sentry.captureEvent(eventoDoScraper())
    await Sentry.flush(2000)

    // Passou direto: o `denyUrls` só olhou `<script>`, o frame do topo.
    expect(enviados).toHaveLength(1)

    // E o frame do scraper estava lá o tempo todo — só não é onde o SDK olha.
    expect(arquivosEnviados()).toContain('obscura:bootstrap')
  })

  it('não alcança o erro do Instagram sem pilha, porque não há URL para comparar', async () => {
    enviados.length = 0
    Sentry.captureEvent(eventoDoInstagramSemPilha())
    await Sentry.flush(2000)

    // O padrão do script da Meta está configurado acima e casaria o frame —
    // mas sem frames `_getEventFilterUrl` devolve `null` e o filtro nem roda.
    expect(enviados).toHaveLength(1)
    expect(enviados[0]?.exception?.values?.[0]?.value).toContain('Java object is gone')
  })
})
