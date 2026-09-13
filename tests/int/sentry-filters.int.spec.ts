import type { ErrorEvent } from '@sentry/nextjs'
import * as Sentry from '@sentry/nextjs'
import { beforeEach, describe, expect, it } from 'vitest'
import { descartaRuidoDeScraper, URLS_DE_RUIDO_CONHECIDO } from '@/lib/sentryFilters'

/**
 * Filtros de ruído do Sentry (`src/lib/sentryFilters.ts`).
 *
 * O teste sobe o SDK **de verdade** com um transporte falso e pergunta a única
 * coisa que importa: o evento saiu pela rede ou não? Conferir o retorno das
 * funções isoladas provaria menos — o `denyUrls` nem é código nosso, é uma
 * opção interpretada pela integração `eventFilters` do SDK, e é exatamente aí
 * que mora a armadilha que este arquivo existe para travar.
 *
 * **Sobre o runtime:** no vitest o `@sentry/nextjs` resolve para a build de
 * servidor (é Node rodando, ainda que o ambiente seja jsdom), enquanto os
 * filtros valem no navegador. Isso não enfraquece o teste: `denyUrls` é lido
 * pela `eventFilters` do `@sentry/core`, **o mesmo módulo nos dois runtimes**
 * — o que muda entre server e browser são outras integrações, que não opinam
 * sobre este filtro. O `beforeSend` é função nossa, idêntica nos dois.
 *
 * **Um `Sentry.init` por arquivo — não adicione um segundo.** Só o primeiro
 * `init` do processo vale: o seguinte devolve um client que não envia nada, e
 * um `captureEvent` depois dele some sem erro. Um segundo `init` aqui faria
 * todo `toHaveLength(0)` abaixo passar sem provar coisa alguma. É por isso que
 * o caso do `denyUrls` sozinho mora em `sentry-filters-denyurls.int.spec.ts`,
 * arquivo separado: ele precisa de outra configuração.
 *
 * **E por que todo descarte vem com uma testemunha:**
 * `expect(enviados).toHaveLength(0)` também passa quando o harness está morto
 * e nada chega ao transporte — foi exatamente o que aconteceu na primeira
 * versão deste arquivo, e os dois testes de descarte passaram provando nada.
 * Agora cada caso captura o ruído **e** um erro nosso: o ruído tem de sumir e
 * a testemunha tem de chegar.
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

/** Mensagem genérica do erro 1 — de propósito idêntica no ruído e na testemunha. */
const MENSAGEM_GENERICA = "Cannot read properties of null (reading 'replace')"

/** Trecho que identifica a testemunha: bundle nosso, servido do nosso domínio. */
const BUNDLE_NOSSO = 'https://www.semog.com.br/_next/static/chunks/'

/** Eventos que chegaram ao transporte, ou seja, que sairiam pela rede. */
const enviados: ErrorEvent[] = []

Sentry.init({
  dsn: 'https://exemplo@o0.ingest.sentry.io/1',
  enabled: true,
  // Sem amostragem: qualquer evento que sobreviva aos filtros tem de aparecer.
  tracesSampleRate: 0,

  // As duas opções sob teste — exatamente as de `src/instrumentation-client.ts`.
  denyUrls: URLS_DE_RUIDO_CONHECIDO,
  beforeSend: descartaRuidoDeScraper,

  transport: () => ({
    send: async (envelope: EnvelopeDoSentry) => {
      const [, itens] = envelope
      for (const [cabecalho, payload] of itens) {
        // O envelope também carrega sessão e span; só o item `event` é erro.
        // O cast é o contrato do próprio formato: quando o cabeçalho diz
        // `event`, o payload É o evento (a união só é ampla por causa dos
        // outros tipos de item).
        if (cabecalho.type === 'event') enviados.push(payload as ErrorEvent)
      }
      return {}
    },
    flush: async () => true,
  }),
})

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

/**
 * Erro 1 — o navegador headless de scraping.
 *
 * A ordem dos frames é a parte que importa: no Sentry o ÚLTIMO item do array é
 * o topo da pilha. Aqui o topo é `<script>` e `obscura:bootstrap` fica abaixo,
 * exatamente como chegou o evento real — é por isso que o `denyUrls`, que só
 * olha o topo, não alcança este erro.
 */
function eventoDoScraper(): ErrorEvent {
  return {
    // `ErrorEvent` exige o discriminante explícito: no Sentry só transaction,
    // profile, replay e feedback têm `type`; erro é o caso `undefined`.
    type: undefined,
    exception: {
      values: [
        {
          type: 'TypeError',
          value: MENSAGEM_GENERICA,
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

/** Erro 2 — webview do Instagram sendo destruído no `beforeunload`. */
function eventoDoWebviewInstagram(): ErrorEvent {
  return {
    // `ErrorEvent` exige o discriminante explícito: no Sentry só transaction,
    // profile, replay e feedback têm `type`; erro é o caso `undefined`.
    type: undefined,
    exception: {
      values: [
        {
          type: 'Error',
          value: 'Error invoking postMessage: Java object is gone',
          stacktrace: {
            frames: [
              {
                filename: 'app://navigation_performance_logger_android',
                function: 'logNavigation',
                lineno: 1,
                colno: 42,
              },
            ],
          },
        },
      ],
    },
  }
}

/**
 * A testemunha: erro nosso, com a MESMA mensagem do erro 1, vindo dos nossos
 * bundles. Se este sumir, o filtro está cego para bug de verdade.
 */
function eventoNosso(): ErrorEvent {
  return {
    // `ErrorEvent` exige o discriminante explícito: no Sentry só transaction,
    // profile, replay e feedback têm `type`; erro é o caso `undefined`.
    type: undefined,
    exception: {
      values: [
        {
          type: 'TypeError',
          value: MENSAGEM_GENERICA,
          stacktrace: {
            frames: [
              {
                filename: `${BUNDLE_NOSSO}main-app-abc123.js`,
                function: 'formataTelefone',
                lineno: 12,
                colno: 30,
              },
              {
                filename: `${BUNDLE_NOSSO}app/page-def456.js`,
                function: 'onSubmit',
                lineno: 88,
                colno: 7,
              },
            ],
          },
        },
      ],
    },
  }
}

describe('filtros de ruído do Sentry', () => {
  beforeEach(() => {
    enviados.length = 0
  })

  it('descarta o erro do navegador de scraping (obscura:) e mantém o erro nosso', async () => {
    Sentry.captureEvent(eventoDoScraper())
    Sentry.captureEvent(eventoNosso())
    await Sentry.flush(2000)

    // A testemunha prova que o harness está vivo; o ruído, que o filtro pegou.
    expect(enviados).toHaveLength(1)
    expect(arquivosEnviados()).toContain(BUNDLE_NOSSO)
    expect(arquivosEnviados()).not.toContain('obscura:')
  })

  it('descarta o erro do webview do Instagram e mantém o erro nosso', async () => {
    Sentry.captureEvent(eventoDoWebviewInstagram())
    Sentry.captureEvent(eventoNosso())
    await Sentry.flush(2000)

    expect(enviados).toHaveLength(1)
    expect(arquivosEnviados()).toContain(BUNDLE_NOSSO)
    expect(arquivosEnviados()).not.toContain('navigation_performance_logger')
  })

  it('PRESERVA erro nosso com a mesma mensagem genérica do erro do scraper', async () => {
    Sentry.captureEvent(eventoNosso())
    await Sentry.flush(2000)

    expect(enviados).toHaveLength(1)
    expect(enviados[0]?.exception?.values?.[0]?.value).toBe(MENSAGEM_GENERICA)
  })
})
