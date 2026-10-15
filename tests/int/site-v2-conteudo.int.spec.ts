import { existsSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { conteudo } from '@/site/conteudo/conteudo'
import { formatarNumero, formatarPercentual } from '@/site/formatar'
import { procurarTermosVedados, textosDe } from './helpers/identidade'

const TEXTOS = textosDe(conteudo)

describe('conteúdo tipado do site v2', () => {
  it('traz o conteúdo inteiro do protótipo, não um pedaço', () => {
    expect(Object.keys(conteudo)).toEqual([
      'marca',
      'numeros',
      'unidades',
      'unidadesSecao',
      'condominios',
      'pilares',
      'tecnologia',
      'ranking',
      'depoimentos',
      'comunidade',
      'proposta',
      'aSemog',
      'incorporadoras',
      'garantePagina',
      'gestaoPagina',
      'landing',
      'formulario',
      'cidades',
      'propostaPagina',
      'contatoPagina',
      'naoEncontrada',
    ])
    expect(TEXTOS.length).toBeGreaterThanOrEqual(800)
  })

  it('não sobra caminho do protótipo: nada de .html nem assets/', () => {
    expect(TEXTOS.filter((t) => /\.html(?:$|#)/.test(t) || t.startsWith('assets/'))).toEqual([])
  })

  it('toda foto citada existe em public/', () => {
    const fotos = TEXTOS.filter((t) => t.startsWith('/site-v2/'))
    expect(fotos.length).toBeGreaterThan(0)
    const faltando = fotos.filter((f) => !existsSync(path.join(process.cwd(), 'public', f)))
    expect(faltando).toEqual([])
  })

  it('nenhum texto usa termo vedado', () => {
    expect(TEXTOS.flatMap(procurarTermosVedados)).toEqual([])
  })

  it('o ranking é o aprovado: 5º entre mais de 3.500', () => {
    expect(conteudo.ranking.posicao).toBe(5)
    expect(formatarNumero(conteudo.ranking.total)).toBe('3.500')
    expect(conteudo.ranking.titulo).toBe('5º entre mais de 3.500 administradoras')
  })

  it('formata em pt-BR', () => {
    expect(formatarNumero(1234.5, 1)).toBe('1.234,5')
    expect(formatarPercentual(0.123)).toBe('12,3%')
  })

  it('marca inexistente é erro de tipo', () => {
    // @ts-expect-error a chave não existe; se passar a existir, o tsc acusa este comentário
    expect(conteudo.ranking.inexistente).toBeUndefined()
  })
})
