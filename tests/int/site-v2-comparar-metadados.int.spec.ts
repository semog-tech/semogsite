import { describe, expect, it } from 'vitest'
import { destinoNoDepois, lerCabeca } from '../../scripts/site-v2-comparar-metadados.mjs'

const HTML = [
  '<!DOCTYPE html><html><head>',
  '<title>Assembleia &amp; lei</title>',
  '<meta name="description" content="Quórum &quot;online&quot;"/>',
  '<link rel="canonical" href="https://www.semog.com.br/blog/x"/>',
  '<meta property="og:title" content="Assembleia &amp; lei"/>',
  '<meta property="og:image" content="https://www.semog.com.br/blog/x/opengraph-image"/>',
  '<meta property="og:image:width" content="1200"/>',
  '</head><body>',
  '<svg><title>Ícone</title></svg>',
  '<script type="application/ld+json">{"b":1,"a":{"d":2,"c":3}}</script>',
  '<script type="application/ld+json">{"z":true}</script>',
  '</body></html>',
].join('\n')

describe('leitor de <head> do script de comparação', () => {
  it('lê title, description, canonical e og, decodificando entidades', () => {
    const cabeca = lerCabeca(HTML)
    expect(cabeca.title).toBe('Assembleia & lei')
    expect(cabeca.description).toBe('Quórum "online"')
    expect(cabeca.canonical).toBe('https://www.semog.com.br/blog/x')
    expect(cabeca['og:title']).toBe('Assembleia & lei')
    expect(cabeca['og:image']).toBe('https://www.semog.com.br/blog/x/opengraph-image')
    expect(cabeca['og:description']).toBeNull()
  })

  it('o JSON-LD é comparável: todos os blocos, com as chaves em ordem', () => {
    const invertido = HTML.replace('{"b":1,"a":{"d":2,"c":3}}', '{"a":{"c":3,"d":2},"b":1}')
    expect(lerCabeca(invertido).jsonld).toBe(lerCabeca(HTML).jsonld)
    expect(lerCabeca(HTML).jsonld).toBe('[{"a":{"c":3,"d":2},"b":1},{"z":true}]')
  })

  it('página sem nada vira campos nulos, não erro', () => {
    expect(lerCabeca('')).toMatchObject({ title: null, canonical: null, jsonld: '[]' })
  })

  it('as páginas de leitura são comparadas com a prévia; o resto, na mesma URL', () => {
    expect(destinoNoDepois('/blog')).toBe('/previa-v2/blog')
    expect(destinoNoDepois('/blog/g20-superlogica-next-2026')).toBe(
      '/previa-v2/blog/g20-superlogica-next-2026',
    )
    expect(destinoNoDepois('/privacidade')).toBe('/previa-v2/privacidade')
    expect(destinoNoDepois('/termos')).toBe('/previa-v2/termos')
    expect(destinoNoDepois('/')).toBe('/previa-v2')
    expect(destinoNoDepois('/semog')).toBe('/previa-v2/semog')
    expect(destinoNoDepois('/administradora-de-condominios-recife')).toBe(
      '/administradora-de-condominios-recife',
    )
    expect(destinoNoDepois('/prestacao-de-contas-condominio')).toBe(
      '/prestacao-de-contas-condominio',
    )
  })
})
