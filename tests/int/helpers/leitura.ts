/**
 * Destino de link Markdown: `(destino)`, `(<destino>)` e qualquer um dos dois seguido do título
 * opcional (`"t"`, `'t'` ou `(t)`), que o CommonMark aceita depois do destino.
 */
const LINK_MARKDOWN =
  /\]\(\s*(?:<([^<>\n]+)>|([^)\s<]+))(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\s*\)/g

/** Destinos de link de um texto MDX: `[texto](destino)` e `href="destino"`. */
export function linksDoMdx(texto: string): string[] {
  const markdown = [...texto.matchAll(LINK_MARKDOWN)].map((achado) => achado[1] ?? achado[2] ?? '')
  const jsx = [...texto.matchAll(/\bhref=["']([^"']+)["']/g)].map((achado) => achado[1] ?? '')
  return [...markdown, ...jsx]
}

/**
 * Destinos com hash que o site não aceita. O Lenis do pacote app chama `decodeURIComponent` no
 * clique e lança URIError com `#%E0%A4%A` (ledger da fase 1); além de decodificável, o hash do
 * site é só `[A-Za-z0-9_-]`, que é o que `idDoTitulo` (src/site/leitura/dados.ts) gera.
 */
export function hashesMalformados(texto: string): string[] {
  return linksDoMdx(texto)
    .filter((destino) => destino.includes('#'))
    .filter((destino) => {
      const hash = destino.slice(destino.indexOf('#') + 1)
      try {
        decodeURIComponent(hash)
      } catch {
        return true
      }
      return !/^[A-Za-z0-9_-]+$/.test(hash)
    })
}
