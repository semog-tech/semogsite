import { describe, expect, it } from 'vitest'
import sitemap from '@/app/sitemap'
import { CITY_LANDINGS } from '@/data/cityLandings'
import { getAllPosts } from '@/lib/blog'
import { absoluteUrl } from '@/lib/seo'
import { entradaDe, servidaComoPagina } from '@/site/inventario'
import { caminhosDoSitemap, entradasDoSitemap, INTOCADAS_NO_SITEMAP } from '@/site/sitemap'

/**
 * As 30 URLs do sitemap em 16/10/2026, conferidas contra https://www.semog.com.br/sitemap.xml
 * (Tarefa 3.2, Step 1). Tirar ou pôr uma URL aqui é decisão, não efeito colateral: escreva ao
 * lado o motivo e a data. Foi assim que as landings de cidade ficaram fora do sitemap desde que
 * subiram (o sitemap varria só content/pages), e a URL velha ranqueou acima da nova.
 */
const SITEMAP_DE_16_10 = [
  '/',
  '/semog',
  '/solucoes',
  '/administracao-de-condominios',
  '/garante',
  '/incorporadoras',
  '/prestacao-de-contas-condominio',
  '/software-de-gestao-condominial',
  '/blog',
  '/contato',
  '/proposta',
  '/privacidade',
  '/termos',
  '/administradora-de-condominios-recife',
  '/administradora-de-condominios-joao-pessoa',
  '/administradora-de-condominios-campina-grande',
  '/administradora-de-condominios-belem',
  '/experience',
  '/blog/administradora-de-condominios-joao-pessoa-o-que-avaliar',
  '/blog/administradora-de-condominios-recife-como-escolher',
  '/blog/administradora-ou-autogestao',
  '/blog/areas-lazer-regras-de-uso',
  '/blog/assembleia-instalacao-checklist-condominios-novos',
  '/blog/assembleia-virtual-validade-juridica',
  '/blog/cinco-sinais-trocar-administradora',
  '/blog/fundo-reserva-quanto-guardar-por-mes',
  '/blog/g20-superlogica-next-2026',
  '/blog/inadimplencia-condominio-o-que-a-lei-permite',
  '/blog/previsao-orcamentaria-guia-sindico',
  '/blog/quanto-custa-administradora-de-condominios',
]

const caminhoDe = (url: string) => new URL(url).pathname
const ordenado = (lista: readonly string[]) => [...lista].sort()

describe('sitemap.xml', () => {
  it('nenhuma página some e nenhuma aparece sem decisão: são as 30 URLs de 16/10/2026', async () => {
    const urls = (await sitemap()).map((e) => caminhoDe(e.url))
    expect(ordenado(urls)).toEqual(ordenado(SITEMAP_DE_16_10))
  })

  it('a rota é o inventário: dá o mesmo que entradasDoSitemap', async () => {
    const daRota = (await sitemap()).map((e) => e.url)
    const doModulo = entradasDoSitemap(getAllPosts(), new Date()).map((e) => e.url)
    expect(daRota).toEqual(doModulo)
  })

  it('toda URL listada é página servida hoje, post ou rota intocada declarada; nunca técnica, prévia ou removida', () => {
    for (const caminho of caminhosDoSitemap()) {
      const entrada = entradaDe(caminho)
      const permitida = servidaComoPagina(entrada) || INTOCADAS_NO_SITEMAP.includes(caminho)
      expect(permitida, caminho).toBe(true)
      expect(['tecnica', 'previa', 'removida'], caminho).not.toContain(entrada?.tipo)
    }
  })

  it('na virada 1: entra /tecnologia, saem as duas URLs que passam a redirecionar, o resto fica', () => {
    const antes = caminhosDoSitemap(false)
    const depois = caminhosDoSitemap(true)
    expect(depois.filter((c) => !antes.includes(c))).toEqual(['/tecnologia'])
    expect(ordenado(antes.filter((c) => !depois.includes(c)))).toEqual([
      '/prestacao-de-contas-condominio',
      '/software-de-gestao-condominial',
    ])
  })

  it('cidades com prioridade de captação, Experience abaixo delas, posts com a própria data', () => {
    const agora = new Date('2026-10-16T12:00:00.000Z')
    const entradas = entradasDoSitemap(getAllPosts(), agora)
    const porCaminho = new Map(entradas.map((e) => [caminhoDe(e.url), e]))
    const cidades = Object.values(CITY_LANDINGS)
    expect(cidades).toHaveLength(4)
    for (const cidade of cidades) {
      expect(porCaminho.get(`/${cidade.slug}`)).toMatchObject({
        changeFrequency: 'weekly',
        priority: 0.9,
        lastModified: agora,
      })
    }
    expect(porCaminho.get('/experience')).toMatchObject({
      changeFrequency: 'weekly',
      priority: 0.8,
    })
    expect(porCaminho.get('/semog')).toEqual({ url: absoluteUrl('semog'), lastModified: agora })
    for (const post of getAllPosts()) {
      expect(porCaminho.get(`/blog/${post.slug}`)?.lastModified).toEqual(new Date(post.date))
    }
  })

  it('não tem URL duplicada e nunca lista as URLs legadas /locais/', async () => {
    const urls = (await sitemap()).map((e) => e.url)
    expect(new Set(urls).size).toBe(urls.length)
    expect(urls.every((url) => !url.includes('/locais/'))).toBe(true)
  })

  it('a home sai com a barra final, como o canonical', () => {
    expect(entradasDoSitemap([], new Date())[0]?.url).toBe(absoluteUrl(''))
  })
})
