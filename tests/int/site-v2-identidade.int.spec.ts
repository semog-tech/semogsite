import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import {
  listarArquivos,
  listarSeExiste,
  procurarTermosVedados,
  verificarCodigo,
  verificarCss,
} from './helpers/identidade'

const RAIZ_SITE = path.join(process.cwd(), 'src', 'site')
const RAIZ_APP_SITE = path.join(process.cwd(), 'src', 'app', '(site)')

describe('guarda de identidade: as regras pegam o que devem pegar', () => {
  it('acusa cada proibição de CSS na linha certa', () => {
    const ruim = [
      '.a { color: #fff; }',
      '.b { border-radius: 4px; }',
      '.c { text-transform: uppercase; }',
      '.d { font-family: Georgia, serif; }',
      '.e { stroke-linecap: round; }',
      '@font-face { font-family: X; }',
      '@media (prefers-reduced-motion: reduce) { .f { opacity: 1; } }',
    ].join('\n')
    expect(verificarCss(ruim, 'amostra.css').map((v) => v.linha)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('aceita hex no :root, raio 0 ou var(--raio), sans-serif e hex dentro de comentário', () => {
    const bom = [
      ':root {',
      '  --marinho: #1b2d70;',
      '}',
      '/* #fff só no comentário */',
      '.a { border-radius: 0; }',
      '.b { border-radius: var(--raio); }',
      '.c { font-family: var(--fonte-corpo), sans-serif; }',
    ].join('\n')
    expect(verificarCss(bom, 'amostra.css')).toEqual([])
  })

  it('com CRLF, o :root continua isento e a linha apontada é a certa', () => {
    const crlf = ':root {\r\n  --a: #ffffff;\r\n}\r\n.x { color: #000; }\r\n'
    expect(verificarCss(crlf, 'crlf.css')).toEqual([
      { arquivo: 'crlf.css', linha: 4, motivo: 'cor em hex fora do :root (use token)' },
    ])
  })

  it('no código, acusa hex de cor e next/link, e deixa passar âncora e href de símbolo', () => {
    expect(verificarCodigo("const cor = '#1b2d70'", 'a.ts')).toHaveLength(1)
    expect(verificarCodigo("import Link from 'next/link'", 'b.tsx')).toHaveLength(1)
    expect(verificarCodigo('<a href="#conteudo"><use href="#logo-semog" /></a>', 'c.tsx')).toEqual(
      [],
    )
  })

  it('acha termo vedado sem diferenciar caixa e não acusa a frase aprovada do ranking', () => {
    expect(procurarTermosVedados('Acompanhe em Tempo Real')).toEqual(['tempo real'])
    expect(procurarTermosVedados('5º entre mais de 3.500 administradoras')).toEqual([])
  })
})

describe('guarda de identidade: varredura de src/site e src/app/(site)', () => {
  let css: string[] = []
  let codigo: string[] = []
  const relativo = (arquivo: string) => path.relative(process.cwd(), arquivo).replaceAll('\\', '/')

  // A listagem fica no beforeAll (não no corpo do describe) para que a pasta ausente derrube só
  // estes testes, e não a coleta do arquivo inteiro, deixando os cinco testes de regra rodarem.
  beforeAll(() => {
    css = [...listarArquivos(RAIZ_SITE, ['.css']), ...listarSeExiste(RAIZ_APP_SITE, ['.css'])]
    codigo = [
      ...listarArquivos(RAIZ_SITE, ['.ts', '.tsx']),
      ...listarSeExiste(RAIZ_APP_SITE, ['.ts', '.tsx']),
    ]
  })

  it('acha os arquivos que deve varrer (zero arquivo não pode passar verde)', () => {
    expect(css.map(relativo)).toEqual(
      expect.arrayContaining(['src/site/estilos/tokens.css', 'src/site/estilos/base.css']),
    )
    expect(codigo.length).toBeGreaterThan(0)
  })

  it('nenhum CSS do site v2 sai da identidade', () => {
    const violacoes = css.flatMap((a) => verificarCss(readFileSync(a, 'utf8'), relativo(a)))
    expect(violacoes).toEqual([])
  })

  it('nenhum TS/TSX do site v2 (src/site e src/app/(site)) usa hex de cor, next/link ou reduced-motion', () => {
    const violacoes = codigo.flatMap((a) => verificarCodigo(readFileSync(a, 'utf8'), relativo(a)))
    expect(violacoes).toEqual([])
  })

  it('nenhum texto do site v2 (src/site e src/app/(site)) usa termo vedado', () => {
    // Cobre o texto escrito direto em TSX, que o teste do conteúdo tipado (1.2) não vê. Um
    // comentário que cite um termo vedado também acusa: reescrever o comentário.
    const achados = codigo.flatMap((a) =>
      procurarTermosVedados(readFileSync(a, 'utf8')).map((termo) => `${relativo(a)}: ${termo}`),
    )
    expect(achados).toEqual([])
  })

  it('as famílias de fonte saem do next/font, não de nome solto', () => {
    const tokens = readFileSync(path.join(RAIZ_SITE, 'estilos', 'tokens.css'), 'utf8')
    expect(tokens).toContain('--fonte-titulo: var(--fonte-saira)')
    expect(tokens).toContain('--fonte-corpo: var(--fonte-barlow)')
    const fontes = readFileSync(path.join(RAIZ_SITE, 'fontes', 'index.ts'), 'utf8')
    expect(fontes).toContain("variable: '--fonte-saira'")
    expect(fontes).toContain("variable: '--fonte-barlow'")
  })
})
