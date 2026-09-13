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
 */
import type { ErrorEvent } from '@sentry/nextjs'

/**
 * Padrões de `denyUrls` — comparados contra a URL do frame do **topo** da
 * pilha (ver a explicação em `descartaRuidoDeScraper`).
 *
 * `app://navigation_performance_logger_android` é script do webview do
 * Instagram. Quando o app destrói o webview durante o `beforeunload`, a ponte
 * Java↔JS morre junto e o Chromium lança `Error invoking postMessage: Java
 * object is gone` — string que nasce em `gin_java_bridge_errors.cc`, no código
 * do próprio Chromium. É o navegador embutido do Meta sendo fechado, não a
 * nossa página quebrando.
 *
 * Ancorado em `^` de propósito: sem a âncora, o padrão casaria qualquer URL
 * nossa que por acaso contivesse esse texto. E **sem a flag `g`**, porque o
 * SDK avalia com `pattern.test()` (`@sentry/core`, `utils/string.js`) e um
 * regex global carrega `lastIndex` entre chamadas — passaria a casar só em
 * eventos alternados.
 */
export const URLS_DE_RUIDO_CONHECIDO = [/^app:\/\/navigation_performance_logger_android/]

/**
 * Esquema do script que só o navegador de scraping executa. O `:` faz parte do
 * prefixo: queremos `obscura:bootstrap`, não um arquivo nosso que por acaso
 * comece com essas sete letras.
 */
const PREFIXO_DO_SCRAPER = 'obscura:'

/**
 * Descarta o evento quando **algum** frame da pilha veio de `obscura:` — o
 * navegador headless de scraping do projeto `h4ckf0r0day/obscura` ("headless
 * browser for AI agents"), que executa seu script sob esse esquema. O
 * `Chrome 145/Windows` que ele anuncia é identificação falsificada; nenhum
 * arquivo nosso tem esse nome.
 *
 * **Por que isto não é um `denyUrls`** — e é este parágrafo que impede a
 * "simplificação" que quebraria o filtro sem avisar: o `denyUrls` casa contra
 * uma URL só, a que `_getLastValidUrl` devolve varrendo os frames de trás para
 * frente (`@sentry/core@10.65.0`, `integrations/eventFilters.js`), ou seja, a
 * do frame do **topo** da pilha. Neste erro o topo é `<script>`;
 * `obscura:bootstrap` está mais abaixo. Um `denyUrls: [/obscura/]` descartaria
 * exatamente **zero** eventos.
 *
 * **E por que não é um `ignoreErrors` pela mensagem:** a mensagem é
 * `Cannot read properties of null (reading 'replace')`, genérica a ponto de
 * esconder bug nosso de verdade no dia em que aparecer um. O filtro casa pelo
 * único traço que só o scraper tem — o nome do script na pilha.
 *
 * Varre todas as `values` (e não só a primeira, como o exemplo da doc): erro
 * encadeado chega com mais de uma exceção, e a que carrega o frame do scraper
 * não é necessariamente a primeira.
 */
export function descartaRuidoDeScraper(event: ErrorEvent): ErrorEvent | null {
  const veioDoScraper = event.exception?.values?.some((excecao) =>
    excecao.stacktrace?.frames?.some((frame) => frame.filename?.startsWith(PREFIXO_DO_SCRAPER)),
  )

  return veioDoScraper ? null : event
}
