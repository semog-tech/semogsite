import type { ErrorEvent } from '@sentry/nextjs'
import * as Sentry from '@sentry/nextjs'
import { beforeEach, describe, expect, it } from 'vitest'
import { OPCOES_DO_SENTRY_NO_NAVEGADOR } from '@/lib/sentryOpcoesCliente'

/**
 * Filtros de ruído do Sentry (`src/lib/sentryFilters.ts`).
 *
 * O teste sobe o SDK **de verdade** com um transporte falso e pergunta a única
 * coisa que importa: o evento saiu pela rede ou não? Conferir o retorno das
 * funções isoladas provaria menos — o que vale é o filtro rodando dentro do
 * pipeline do SDK, no lugar onde ele roda em produção.
 *
 * **O `init` abaixo recebe o objeto de opções da produção**, e não uma cópia.
 * Essa é a diferença que dá sentido ao arquivo: enquanto o teste montava seu
 * próprio literal, apagar o `beforeSend` de produção deixava a suíte inteira
 * verde — 272 testes, nenhum vermelho, filtro perdido em silêncio. Agora o
 * `beforeSend` sob teste é literalmente o que o navegador executa. Só `dsn`,
 * `enabled` e `transport` são trocados, porque sem DSN o SDK é no-op e sem
 * transporte não há o que medir.
 *
 * **Sobre o runtime:** no vitest o `@sentry/nextjs` resolve para a build de
 * servidor (é Node rodando, ainda que o ambiente seja jsdom), enquanto os
 * filtros valem no navegador. Isso não enfraquece o teste: o `beforeSend` é
 * função nossa, idêntica nos dois, e é chamado pelo mesmo `@sentry/core`.
 *
 * **Um `Sentry.init` por arquivo — não adicione um segundo.** Só o primeiro
 * `init` do processo vale: o seguinte devolve um client que não envia nada, e
 * um `captureEvent` depois dele some sem erro. Um segundo `init` aqui faria
 * todo `toHaveLength(0)` abaixo passar sem provar coisa alguma. É a mesma
 * razão pela qual este arquivo não importa `@/instrumentation-client` para
 * pegar as opções: aquele import roda o `init` de produção antes deste.
 *
 * **E por que todo descarte vem com uma testemunha:**
 * `expect(enviados).toHaveLength(0)` também passa quando o harness está morto
 * e nada chega ao transporte — foi exatamente o que aconteceu na primeira
 * versão deste arquivo, e os testes de descarte passaram provando nada. Agora
 * cada caso captura o ruído **e** um erro nosso: o ruído tem de sumir e a
 * testemunha tem de chegar.
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

/** Mensagem genérica do erro do scraper — idêntica no ruído e na testemunha. */
const MENSAGEM_GENERICA = "Cannot read properties of null (reading 'replace')"

/** A mensagem que o Chromium emite quando a ponte Java do webview morre. */
const MENSAGEM_DA_PONTE_JAVA = 'Error invoking postMessage: Java object is gone'

/** Script do webview do Instagram, como veio no evento real. */
const SCRIPT_DA_META = 'app://navigation_performance_logger_android'

/** Trecho que identifica a testemunha: bundle nosso, servido do nosso domínio. */
const BUNDLE_NOSSO = 'https://www.semog.com.br/_next/static/chunks/'

/** Eventos que chegaram ao transporte, ou seja, que sairiam pela rede. */
const enviados: ErrorEvent[] = []

Sentry.init({
  ...OPCOES_DO_SENTRY_NO_NAVEGADOR,

  dsn: 'https://exemplo@o0.ingest.sentry.io/1',
  enabled: true,
  // Sem amostragem: qualquer evento que sobreviva aos filtros tem de aparecer.
  tracesSampleRate: 0,

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
 * Erro 1 — o navegador headless de scraping, com a pilha como ela chegou.
 *
 * A ordem importa: no Sentry o ÚLTIMO item do array é o topo da pilha. Aqui o
 * topo é `<script>` e o frame do scraper está no meio — é por isso que um
 * `denyUrls`, que só consulta o topo, não alcança este erro.
 *
 * O `ext:core/01_core.js` do fundo é runtime do **Deno**: confirmação
 * independente de que não é navegador de visitante nenhum. Não vira regra de
 * filtro, mas é a evidência mais forte de que descartar isto é correto.
 *
 * O nome do arquivo do scraper vem entre sinais de menor/maior, como veio o
 * `<script>` dos vizinhos — ver `desembrulha` em `sentryFilters`.
 */
function eventoDoScraper(arquivoDoScraper = '<obscura:bootstrap>'): ErrorEvent {
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
              { filename: 'ext:core/01_core.js', lineno: 294, colno: 9 },
              { filename: '<script>', lineno: 1, colno: 100633 },
              { filename: '<script>', function: 'xm', lineno: 1, colno: 98865 },
              { filename: arquivoDoScraper, lineno: 312, colno: 11 },
              { filename: '<script>', function: 'n', lineno: 7, colno: 5336 },
            ],
          },
        },
      ],
    },
  }
}

/**
 * Erro 2 — webview do Instagram sendo destruído no `beforeunload`. Os três
 * frames do evento real, todos do script da Meta.
 *
 * O nome do script é parametrizado pela mesma razão do evento do scraper: a
 * normalização dos sinais de menor/maior é aplicada uma vez só, em
 * `algumFrame`, e vale para os dois filtros. Se alguém restaurar a comparação
 * crua num deles, o caso com sinais fica vermelho.
 */
function eventoDoWebviewInstagram(scriptDaMeta = SCRIPT_DA_META): ErrorEvent {
  return {
    type: undefined,
    exception: {
      values: [
        {
          type: 'Error',
          value: MENSAGEM_DA_PONTE_JAVA,
          stacktrace: {
            frames: [
              { filename: scriptDaMeta, lineno: 1, colno: 18302 },
              {
                filename: scriptDaMeta,
                function: 'sendBeforeUnloadMessage',
                lineno: 1,
                colno: 13750,
              },
              { filename: scriptDaMeta, function: 'sendDataToNative', lineno: 1, colno: 10198 },
            ],
          },
        },
      ],
    },
  }
}

/**
 * Erro do script da Meta com o nome entre sinais **e outra mensagem**.
 *
 * A mensagem diferente é o que dá sentido ao caso: como o filtro do Instagram
 * casa por pilha **ou** por mensagem, um evento com a mensagem da ponte Java
 * seria descartado mesmo que a normalização do nome não valesse para este
 * filtro — o teste passaria por construção, sem ter como reprovar. Com outra
 * mensagem, só a varredura de frames pode descartá-lo.
 */
function eventoDaMetaComSinaisEOutraMensagem(): ErrorEvent {
  return {
    type: undefined,
    exception: {
      values: [
        {
          type: 'TypeError',
          value: MENSAGEM_GENERICA,
          stacktrace: {
            frames: [
              {
                filename: `<${SCRIPT_DA_META}>`,
                function: 'sendDataToNative',
                lineno: 1,
                colno: 10198,
              },
            ],
          },
        },
      ],
    },
  }
}

/**
 * Erro 2, variante (a): um frame nosso no topo, acima do frame da Meta. É o
 * cenário que derrubava a versão anterior do filtro, que confiava no topo da
 * pilha — bastava um handler nosso de `beforeunload` na jogada.
 */
function eventoDoInstagramComFrameNossoNoTopo(): ErrorEvent {
  return {
    type: undefined,
    exception: {
      values: [
        {
          type: 'Error',
          value: MENSAGEM_DA_PONTE_JAVA,
          stacktrace: {
            frames: [
              { filename: SCRIPT_DA_META, function: 'sendDataToNative', lineno: 1, colno: 10198 },
              {
                filename: `${BUNDLE_NOSSO}main-app-abc123.js`,
                function: 'onBeforeUnload',
                lineno: 4,
                colno: 71,
              },
            ],
          },
        },
      ],
    },
  }
}

/**
 * Erro 2, variante (b): sem stacktrace nenhum. Plausível porque o erro nasce
 * no `beforeunload`, momento em que o Chromium com frequência entrega o evento
 * sem pilha. Sem frames, todo filtro por URL sai `false` sem consultar padrão
 * algum — só a mensagem resta, e aqui ela é segura: vem do binário do
 * Chromium, nosso JavaScript não a produz.
 */
function eventoDoInstagramSemPilha(): ErrorEvent {
  return {
    type: undefined,
    exception: { values: [{ type: 'Error', value: MENSAGEM_DA_PONTE_JAVA }] },
  }
}

/**
 * O contra-exemplo da tolerância aos sinais de menor/maior.
 *
 * Desembrulhar `<obscura:bootstrap>` também desembrulha `<script>`, que é como
 * chega todo script inline. Se a tolerância ficasse gulosa a ponto de casar
 * esse nome, qualquer erro nosso com um script inline na pilha sumiria — e é
 * um risco que só a nossa mudança introduziu, então precisa da própria
 * testemunha. Este evento tem `<script>` no topo e bundle nosso abaixo, e tem
 * de chegar inteiro.
 */
function eventoNossoComScriptInline(): ErrorEvent {
  return {
    type: undefined,
    exception: {
      values: [
        {
          type: 'TypeError',
          value: MENSAGEM_GENERICA,
          stacktrace: {
            frames: [
              {
                filename: `${BUNDLE_NOSSO}app/page-def456.js`,
                function: 'onSubmit',
                lineno: 88,
                colno: 7,
              },
              { filename: '<script>', function: 'n', lineno: 7, colno: 5336 },
            ],
          },
        },
      ],
    },
  }
}

/**
 * A testemunha: erro nosso, com a MESMA mensagem genérica do erro do scraper,
 * vindo dos nossos bundles. Se este sumir, o filtro está cego para bug de
 * verdade.
 */
function eventoNosso(): ErrorEvent {
  return {
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

/** Captura o ruído e a testemunha, e devolve o que saiu pela rede. */
async function capturaComTestemunha(ruido: ErrorEvent): Promise<void> {
  Sentry.captureEvent(ruido)
  Sentry.captureEvent(eventoNosso())
  await Sentry.flush(2000)
}

describe('filtros de ruído do Sentry', () => {
  beforeEach(() => {
    enviados.length = 0
  })

  it('descarta o erro do navegador de scraping e mantém o erro nosso', async () => {
    await capturaComTestemunha(eventoDoScraper())

    // A testemunha prova que o harness está vivo; o ruído, que o filtro pegou.
    expect(enviados).toHaveLength(1)
    expect(arquivosEnviados()).toContain(BUNDLE_NOSSO)
    expect(arquivosEnviados()).not.toContain('obscura:')
  })

  it('descarta o erro do scraper também com o nome do arquivo sem os sinais', async () => {
    await capturaComTestemunha(eventoDoScraper('obscura:bootstrap'))

    expect(enviados).toHaveLength(1)
    expect(arquivosEnviados()).toContain(BUNDLE_NOSSO)
    expect(arquivosEnviados()).not.toContain('obscura:')
  })

  it('descarta o erro do webview do Instagram e mantém o erro nosso', async () => {
    await capturaComTestemunha(eventoDoWebviewInstagram())

    expect(enviados).toHaveLength(1)
    expect(arquivosEnviados()).toContain(BUNDLE_NOSSO)
    expect(arquivosEnviados()).not.toContain('navigation_performance_logger')
  })

  it('descarta o erro do script da Meta com o nome entre sinais, sem depender da mensagem', async () => {
    // Prova que a normalização dos sinais vale para os DOIS filtros, e não só
    // para o do scraper: aqui a mensagem não ajuda, só a pilha.
    await capturaComTestemunha(eventoDaMetaComSinaisEOutraMensagem())

    expect(enviados).toHaveLength(1)
    expect(arquivosEnviados()).toContain(BUNDLE_NOSSO)
    expect(arquivosEnviados()).not.toContain('navigation_performance_logger')
  })

  it('descarta o erro do Instagram mesmo com um frame nosso no topo da pilha', async () => {
    await capturaComTestemunha(eventoDoInstagramComFrameNossoNoTopo())

    expect(enviados).toHaveLength(1)
    expect(arquivosEnviados()).not.toContain('navigation_performance_logger')
    // Sobrou só a testemunha — e não o ruído, que também tinha bundle nosso.
    expect(enviados[0]?.exception?.values?.[0]?.value).toBe(MENSAGEM_GENERICA)
  })

  it('descarta o erro do Instagram quando ele chega sem stacktrace', async () => {
    await capturaComTestemunha(eventoDoInstagramSemPilha())

    expect(enviados).toHaveLength(1)
    expect(arquivosEnviados()).toContain(BUNDLE_NOSSO)
    expect(enviados[0]?.exception?.values?.[0]?.value).toBe(MENSAGEM_GENERICA)
  })

  it('PRESERVA erro nosso que tem um script inline na pilha', async () => {
    // O limite da tolerância aos sinais: `<script>` desembrulha para `script`
    // e não pode casar prefixo nenhum. Se casasse, este evento sumiria.
    Sentry.captureEvent(eventoNossoComScriptInline())
    await Sentry.flush(2000)

    expect(enviados).toHaveLength(1)
    expect(arquivosEnviados()).toContain('<script>')
    expect(arquivosEnviados()).toContain(BUNDLE_NOSSO)
  })

  it('PRESERVA erro nosso com a mesma mensagem genérica do erro do scraper', async () => {
    Sentry.captureEvent(eventoNosso())
    await Sentry.flush(2000)

    expect(enviados).toHaveLength(1)
    expect(enviados[0]?.exception?.values?.[0]?.value).toBe(MENSAGEM_GENERICA)
  })
})
