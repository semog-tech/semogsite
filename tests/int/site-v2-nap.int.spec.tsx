import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { site } from '@/../content/site'
import { UNITS } from '@/lib/seo'
import { conteudo } from '@/site/conteudo/conteudo'
import { unidadesDaUf } from '@/site/formularios/proposta/FalhaDoEnvio'
import { UnidadesDoContato } from '@/site/secoes/contato/Unidades'
import { textosDe } from './helpers/identidade'

const digitos = (texto: string) => texto.replace(/\D/g, '')

/** "R. Bartolomeu de Gusmão, 217, Madalena" → o logradouro com número, e o bairro. */
function partes(rua: string) {
  const pedacos = rua.split(',').map((pedaco) => pedaco.trim())
  return { logradouro: `${pedacos[0]}, ${pedacos[1]}`, bairro: pedacos[pedacos.length - 1] }
}

function cidadeDoConteudo(slug: string) {
  const id = slug.replace('administradora-de-condominios-', '')
  if (!Object.hasOwn(conteudo.cidades, id)) throw new Error(`conteudo.cidades sem "${id}"`)
  // `as`: `hasOwn` acima garante que o id é uma chave de conteudo.cidades.
  return conteudo.cidades[id as keyof typeof conteudo.cidades]
}

const UNIDADES = UNITS.map((unidade) => [unidade.city, unidade] as const)

describe('NAP com fonte única (UNITS, spec 6)', () => {
  it('as quatro Unidades da UNITS são as do conteúdo, na mesma ordem', () => {
    expect(UNITS.map((u) => u.slug)).toEqual(conteudo.unidades.map((u) => u.url.slice(1)))
  })

  it.each(
    UNIDADES,
  )('%s: content/site.ts (rodapé antigo e falha do envio) bate com a UNITS', (_cidade, u) => {
    const endereco = site.company.addresses.find((a) => a.city === u.city)
    if (!endereco) throw new Error(`content/site.ts sem ${u.city}`)
    const { logradouro, bairro } = partes(u.street)
    expect(digitos(endereco.phone)).toBe(digitos(u.phoneDisplay))
    expect(endereco.uf).toBe(u.region)
    expect(endereco.address).toContain(logradouro)
    expect(endereco.address).toContain(bairro)
    expect(endereco.address).toContain(`${u.city}/${u.region}`)
    expect(digitos(endereco.address)).toContain(digitos(u.postalCode))
  })

  it.each(UNIDADES)('%s: conteudo.cidades (Contato e landings) bate com a UNITS', (_cidade, u) => {
    const cidade = cidadeDoConteudo(u.slug)
    const { logradouro, bairro } = partes(u.street)
    expect(cidade.telefone).toBe(u.phoneDisplay)
    expect(cidade.endereco).toContain(logradouro)
    expect(cidade.endereco).toContain(bairro)
    expect(cidade.endereco).toContain(`${u.city}/${u.region}`)
    expect(cidade.mapa).toContain(u.cid)
  })

  it('todo telefone escrito no conteúdo tipado é de uma Unidade', () => {
    const daUnits = new Set(UNITS.map((u) => u.phoneDisplay))
    const escritos = textosDe(conteudo).flatMap(
      (texto) => texto.match(/\(\d{2}\) \d{4,5}-\d{4}/g) ?? [],
    )
    expect(escritos.length).toBeGreaterThan(0)
    expect(escritos.filter((fone) => !daUnits.has(fone))).toEqual([])
  })

  it('o Contato renderizado mostra telefone e bairro de cada Unidade', () => {
    const { container } = render(<UnidadesDoContato />)
    const texto = container.textContent ?? ''
    for (const u of UNITS) {
      expect(texto, u.city).toContain(u.phoneDisplay)
      expect(texto, u.city).toContain(partes(u.street).bairro)
    }
  })

  it('a falha do envio oferece o telefone da Unidade de cada UF', () => {
    for (const u of UNITS) {
      expect(unidadesDaUf(u.region).map((a) => digitos(a.phone))).toContain(digitos(u.phoneDisplay))
    }
  })
})
