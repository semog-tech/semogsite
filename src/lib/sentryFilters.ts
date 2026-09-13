/**
 * Filtros de ruído do Sentry — erros que chegam do navegador do visitante mas
 * **não são bug nosso**.
 *
 * Os dois casos tratados aqui apareceram em 13/09/2026, ambos na home, ambos
 * no release `33a1335`. Moram num módulo próprio, e não inline no `init`, por
 * dois motivos: a razão de cada um existir é longa demais para caber ao lado
 * de uma opção, e `tests/int/sentry-filters.int.spec.ts` exercita exatamente
 * estes valores contra o filtro **real** do SDK. Filtro de ruído que para de
 * funcionar não dá erro — volta a encher a fila em silêncio.
 *
 * A regra que vale para os dois: o filtro é **estreito**. Na dúvida entre
 * pegar mais ruído e arriscar engolir erro nosso, deixa passar.
 *
 * **Por que os dois são `beforeSend` e nenhum é `denyUrls`** — este parágrafo
 * é o que impede a "simplificação" que quebraria o filtro sem avisar. O
 * `denyUrls` casa contra **uma** URL só, a que `_getLastValidUrl` devolve
 * varrendo os frames de trás para frente (`@sentry/core@10.65.0`,
 * `integrations/eventFilters.js`), ou seja, a do frame do topo da pilha. Isso
 * falha de duas maneiras: quando o frame culpado não está no topo (é o caso do
 * scraper, cujo topo é `<script>`), e quando o evento chega **sem pilha
 * nenhuma** — aí `_getEventFilterUrl` devolve `null` e `_isDeniedUrl` sai com
 * `false` sem consultar padrão algum. As duas falhas estão demonstradas contra
 * o SDK real em `tests/int/sentry-filters-denyurls.int.spec.ts`.
 */
import type { ErrorEvent } from '@sentry/nextjs'

/**
 * Esquema do script que só o navegador de scraping executa. O `:` faz parte do
 * prefixo: queremos `obscura:bootstrap`, não um arquivo nosso que por acaso
 * comece com essas sete letras.
 */
const PREFIXO_DO_SCRAPER = 'obscura:'

/**
 * Script do webview do Instagram. Ancorado por `startsWith` de propósito: como
 * substring, o texto casaria uma URL nossa que por acaso o contivesse.
 */
const PREFIXO_DO_WEBVIEW_INSTAGRAM = 'app://navigation_performance_logger_android'

/**
 * A mensagem que o Chromium emite quando a ponte Java↔JS morre. Nasce em
 * `content/common/android/gin_java_bridge_errors.cc`, no código do próprio
 * navegador, quando o objeto Java injetado via `addJavascriptInterface` já foi
 * destruído — nosso JavaScript não tem como produzi-la.
 *
 * É **por isso** que aqui casar por mensagem é seguro, e no erro do scraper
 * não é: lá a mensagem (`Cannot read properties of null`) é genérica e
 * esconderia bug nosso de verdade no dia em que aparecer um.
 */
const MENSAGEM_DA_PONTE_JAVA_MORTA = 'Error invoking postMessage: Java object is gone'

/**
 * Tira os sinais de menor/maior das pontas do nome do arquivo.
 *
 * A pilha do scraper chegou com o frame escrito `<obscura:bootstrap>`, na
 * mesma forma do `<script>` dos frames vizinhos — enquanto o frame do webview
 * do Instagram, no outro evento, veio sem eles. Não dá para saber pela
 * renderização se os sinais estão no campo `filename` ou se são enfeite da
 * view de pilha do Sentry, e a diferença decide se o prefixo casa ou não casa
 * **nada**. Comparar pelo nome desembrulhado atende as duas formas.
 *
 * Não afrouxa o filtro: continua sendo prefixo ancorado, e um arquivo nosso
 * chamado `<obscura:…>` não existe.
 */
function desembrulha(arquivo: string): string {
  return arquivo.startsWith('<') && arquivo.endsWith('>') ? arquivo.slice(1, -1) : arquivo
}

/**
 * Algum frame de alguma exceção do evento satisfaz o teste?
 *
 * Varre **todas** as `values` (e não só a primeira, como o exemplo da doc):
 * erro encadeado chega com mais de uma exceção, e a que carrega o frame
 * culpado não é necessariamente a primeira. E varre todos os frames, não só o
 * topo — ver o parágrafo sobre `denyUrls` no cabeçalho.
 */
function algumFrame(event: ErrorEvent, casa: (arquivo: string) => boolean): boolean {
  return (
    event.exception?.values?.some((excecao) =>
      excecao.stacktrace?.frames?.some((frame) =>
        Boolean(frame.filename && casa(desembrulha(frame.filename))),
      ),
    ) ?? false
  )
}

/** Todo texto do evento que pode carregar a mensagem do erro. */
function mensagensDoEvento(event: ErrorEvent): string[] {
  const dasExcecoes = event.exception?.values?.map((excecao) => excecao.value ?? '') ?? []
  return event.message ? [...dasExcecoes, event.message] : dasExcecoes
}

/**
 * O navegador headless de scraping do projeto `h4ckf0r0day/obscura` ("headless
 * browser for AI agents"), que executa seu script sob o esquema `obscura:`. O
 * `Chrome 145/Windows` que ele anuncia é identificação falsificada; nenhum
 * arquivo nosso tem esse nome.
 *
 * A pilha real ainda trazia `ext:core/01_core.js`, runtime do **Deno** —
 * confirmação independente de que não é navegador de visitante. Não vira regra
 * de filtro (o prefixo `obscura:` já basta e é mais específico), mas é a
 * evidência mais forte de que descartar este evento é correto.
 */
function veioDoScraper(event: ErrorEvent): boolean {
  return algumFrame(event, (arquivo) => arquivo.startsWith(PREFIXO_DO_SCRAPER))
}

/**
 * O webview do Instagram sendo destruído. Quando o app fecha o webview durante
 * o `beforeunload`, a ponte Java↔JS morre junto e o Chromium lança o erro. É o
 * navegador embutido do Meta encerrando, não a nossa página quebrando.
 *
 * Casa pela pilha **ou** pela mensagem porque o erro nasce no `beforeunload`,
 * momento em que o Chromium com frequência entrega o evento sem stacktrace —
 * e sem pilha não há frame para varrer.
 */
function veioDoWebviewDoInstagram(event: ErrorEvent): boolean {
  if (algumFrame(event, (arquivo) => arquivo.startsWith(PREFIXO_DO_WEBVIEW_INSTAGRAM))) return true
  return mensagensDoEvento(event).includes(MENSAGEM_DA_PONTE_JAVA_MORTA)
}

/**
 * O `beforeSend` de `src/lib/sentryOpcoesCliente.ts`: descarta o evento quando
 * ele veio de um dos dois navegadores de terceiro, e devolve intacto todo o
 * resto.
 */
export function descartaRuidoConhecido(event: ErrorEvent): ErrorEvent | null {
  return veioDoScraper(event) || veioDoWebviewDoInstagram(event) ? null : event
}
