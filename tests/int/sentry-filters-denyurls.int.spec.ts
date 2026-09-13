import type { ErrorEvent } from '@sentry/nextjs'
import * as Sentry from '@sentry/nextjs'
import { describe, expect, it } from 'vitest'

/**
 * A trava contra a "simplificação" que `src/lib/sentryFilters.ts` previne em
 * prosa: alguém olha o `beforeSend` que descarta o ruído do scraper, acha que
 * um `denyUrls: [/obscura/]` faz a mesma coisa com menos código, troca — e o
 * filtro passa a descartar **zero** eventos, sem erro, sem aviso, sem teste
 * vermelho. A fila do Sentry volta a encher e ninguém liga uma coisa à outra.
 *
 * Este arquivo executa aquela troca e mostra o resultado: o evento do scraper
 * atravessa o `denyUrls` intacto. O motivo está em `@sentry/core@10.65.0`,
 * `integrations/eventFilters.js`: `_getLastValidUrl` varre os frames de trás
 * para frente e devolve **uma** URL, a do topo da pilha. Neste erro o topo é
 * `<script>`; `obscura:bootstrap` está abaixo dele e nunca é consultado.
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

/** Eventos que chegaram ao transporte, ou seja, que sairiam pela rede. */
const enviados: ErrorEvent[] = []

Sentry.init({
  dsn: 'https://exemplo@o0.ingest.sentry.io/1',
  enabled: true,
  tracesSampleRate: 0,

  // A troca tentadora — e inócua — que este arquivo existe para desencorajar.
  denyUrls: [/obscura/],

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

/** O mesmo evento 1 de `sentry-filters.int.spec.ts`: `<script>` no topo. */
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
              { filename: 'obscura:bootstrap', function: 'bootstrap', lineno: 1, colno: 1 },
              { filename: '<script>', function: 'onFrame', lineno: 1, colno: 120 },
            ],
          },
        },
      ],
    },
  }
}

describe('denyUrls não alcança o erro do scraper', () => {
  it('deixa passar o evento mesmo com o padrão /obscura/ configurado', async () => {
    Sentry.captureEvent(eventoDoScraper())
    await Sentry.flush(2000)

    // Passou direto: o `denyUrls` só olhou `<script>`, o frame do topo.
    expect(enviados).toHaveLength(1)

    // E o frame do scraper estava lá o tempo todo — só não é onde o SDK olha.
    const arquivos = enviados
      .flatMap(
        (evento) =>
          evento.exception?.values?.flatMap(
            (excecao) => excecao.stacktrace?.frames?.map((frame) => frame.filename ?? '') ?? [],
          ) ?? [],
      )
      .join(' ')
    expect(arquivos).toContain('obscura:bootstrap')
  })
})
