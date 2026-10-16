import { fireEvent, render, screen } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import { CONSENT_COOKIE_NAME, setConsent } from '@/lib/consent'
import { ConsentProvider } from '@/providers/ConsentProvider'
import type { CartaoDePost } from '@/site/leitura/dados'
import { corpoDoMdx, textoDoNo } from '@/site/leitura/mdx'
import { Artigo, type DadosDoArtigo } from '@/site/secoes/leitura/Artigo'
import { IndiceDoBlog } from '@/site/secoes/leitura/IndiceDoBlog'
import { LeiaTambem } from '@/site/secoes/leitura/LeiaTambem'
import { PreferenciasDeCookies } from '@/site/secoes/leitura/PreferenciasDeCookies'

const CARTAO: CartaoDePost = {
  slug: 'um-post',
  href: '/previa-v2/blog/um-post',
  titulo: 'Um post',
  resumo: 'O resumo do post.',
  categoria: { slug: 'financas', titulo: 'Finanças' },
  dataTexto: '27 de agosto de 2026',
  minutos: 6,
}

function artigo(extra: Partial<DadosDoArtigo> = {}): DadosDoArtigo {
  return {
    titulo: 'Título do texto',
    resumo: 'Resumo do texto.',
    topo: {
      tipo: 'post',
      categoria: 'Finanças',
      dataTexto: '27 de agosto de 2026',
      minutos: 6,
      voltar: '/previa-v2/blog',
    },
    indice: [
      { id: 'um', texto: 'Um' },
      { id: 'dois', texto: 'Dois' },
      { id: 'tres', texto: 'Três' },
    ],
    emResumo: ['Primeiro ponto.', 'Segundo ponto.'],
    corpo: <p>Corpo do texto.</p>,
    ...extra,
  }
}

afterEach(() => {
  // biome-ignore lint/suspicious/noDocumentCookie: apagar o cookie de consentimento entre testes (jsdom); a lib grava do mesmo jeito
  document.cookie = `${CONSENT_COOKIE_NAME}=; max-age=0; path=/`
})

describe('componentes do MDX', () => {
  it('títulos ganham o id do índice; foto e vídeo saem no visual do site v2, sem Tailwind', async () => {
    const corpo = await corpoDoMdx(
      [
        '## Híbrida: o melhor dos dois mundos',
        '',
        'Texto com [link](/garante) e **ênfase**.',
        '',
        '### Monte um calendário de reajustes',
        '',
        '<PostImage file="g20-next-2026-01.webp" caption="Legenda da foto." />',
        '',
        '<PostVideo file="g20-next-2026.mp4" poster="g20-next-2026-poster.webp" aspectRatio="636 / 1080" caption="Legenda do vídeo." />',
      ].join('\r\n'),
    )
    const html = renderToStaticMarkup(corpo)
    expect(html).toContain('<h2 id="hibrida-o-melhor-dos-dois-mundos">')
    expect(html).toContain('<h3 id="monte-um-calendario-de-reajustes">')
    expect(html).toContain('<figure class="artigo-figura">')
    expect(html).toContain('<figure class="artigo-figura artigo-figura--vertical">')
    expect(html).toContain('<figcaption>Legenda da foto.</figcaption>')
    expect(html).toContain('preload="none"')
    expect(html).toContain('aspect-ratio:636 / 1080')
    expect(html).not.toMatch(/class="[^"]*\b(?:my-10|rounded-card|text-fg-3|mx-auto)\b/)
  })

  it('textoDoNo junta o texto de nós aninhados', () => {
    expect(textoDoNo(['Um ', <strong key="a">dois</strong>, 3])).toBe('Um dois3')
  })
})

describe('artigo', () => {
  it('post: voltar, metadados, título, resumo, índice, "Em resumo" e corpo, nessa ordem', () => {
    render(<Artigo dados={artigo()} />)
    expect(screen.getByRole('link', { name: 'Blog' }).getAttribute('href')).toBe('/previa-v2/blog')
    expect(screen.getByRole('heading', { level: 1, name: 'Título do texto' })).toBeTruthy()
    expect(document.querySelector('.artigo-meta')?.textContent).toBe(
      'Finanças27 de agosto de 20266 min de leitura',
    )
    const indice = document.querySelector('nav[data-indice]')
    expect(Array.from(indice?.querySelectorAll('a') ?? [], (a) => a.getAttribute('href'))).toEqual([
      '#um',
      '#dois',
      '#tres',
    ])
    expect(screen.getByText('Em resumo')).toBeTruthy()
    expect(document.querySelector('[data-corpo-leitura]')?.textContent).toBe('Corpo do texto.')
    expect(document.querySelector('[data-progresso]')).not.toBeNull()
  })

  it('com menos de três títulos não há índice (o texto ocupa a grade sozinho)', () => {
    render(<Artigo dados={artigo({ indice: [{ id: 'um', texto: 'Um' }] })} />)
    expect(document.querySelector('nav[data-indice]')).toBeNull()
  })

  it('documento: a data de atualização no lugar de voltar e categoria, sem "Em resumo"', () => {
    render(
      <Artigo
        dados={artigo({
          resumo: undefined,
          topo: { tipo: 'documento', atualizacao: 'Última atualização: agosto de 2026' },
          emResumo: [],
        })}
      />,
    )
    expect(screen.queryByRole('link', { name: 'Blog' })).toBeNull()
    expect(document.querySelector('.artigo-meta')?.textContent).toBe(
      'Última atualização: agosto de 2026',
    )
    expect(screen.queryByText('Em resumo')).toBeNull()
    expect(document.querySelector('.artigo-lead')).toBeNull()
  })

  it('sem JS, o texto inteiro e o índice já estão no HTML do servidor', () => {
    const html = renderToStaticMarkup(<Artigo dados={artigo()} />)
    expect(html).toContain('Corpo do texto.')
    expect(html).toContain('href="#dois"')
    expect(html).toContain('Primeiro ponto.')
  })
})

describe('índice do blog', () => {
  const dados = {
    titulo: 'Blog Semog',
    texto: 'Conteúdo para síndicos.',
    destaque: CARTAO,
    demais: [
      {
        ...CARTAO,
        slug: 'outro',
        href: '/previa-v2/blog/outro',
        categoria: { slug: 'gestao', titulo: 'Gestão' },
      },
    ],
    filtros: [
      { slug: 'financas', titulo: 'Finanças', total: 1 },
      { slug: 'gestao', titulo: 'Gestão', total: 1 },
    ],
  }

  it('título, filtros com contagem, destaque e demais, cada um com a sua categoria', () => {
    render(<IndiceDoBlog dados={dados} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Blog Semog' })).toBeTruthy()
    const filtros = Array.from(document.querySelectorAll('.bi-filtro'), (a) => [
      a.getAttribute('href'),
      a.textContent,
    ])
    expect(filtros).toEqual([
      ['#todos', 'Todos 2'],
      ['#categoria-financas', 'Finanças 1'],
      ['#categoria-gestao', 'Gestão 1'],
    ])
    expect(document.getElementById('categoria-financas')).not.toBeNull()
    const itens = Array.from(document.querySelectorAll('.bi-item'), (li) =>
      li.getAttribute('data-categoria'),
    )
    expect(itens).toEqual(['financas', 'gestao'])
    expect(document.querySelector('.bi-item--destaque a')?.getAttribute('href')).toBe(
      '/previa-v2/blog/um-post',
    )
  })

  it('o filtro funciona sem JS: as regras de :target e :has saem no HTML', () => {
    const html = renderToStaticMarkup(<IndiceDoBlog dados={dados} />)
    expect(html).toContain('#blog-indice:has(#categoria-gestao:target)')
  })
})

describe('leia também', () => {
  it('dois cartões com h3 e o link para todos os textos', () => {
    render(<LeiaTambem cartoes={[CARTAO, { ...CARTAO, slug: 'dois' }]} todos="/previa-v2/blog" />)
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2)
    expect(screen.getByRole('link', { name: 'Todos os textos' }).getAttribute('href')).toBe(
      '/previa-v2/blog',
    )
  })

  it('sem cartões, a seção não aparece', () => {
    const { container } = render(<LeiaTambem cartoes={[]} todos="/previa-v2/blog" />)
    expect(container.innerHTML).toBe('')
  })
})

describe('preferências de cookies (Privacidade)', () => {
  function interruptor(nome: string) {
    return screen.getByRole('switch', { name: nome })
  }

  it('sem escolha salva: mostra o padrão, salvar só liga com mudança, e salvar grava', () => {
    render(
      <ConsentProvider>
        <PreferenciasDeCookies />
      </ConsentProvider>,
    )
    expect(document.getElementById('cookies')).not.toBeNull()
    expect(interruptor('Cookies necessários').hasAttribute('disabled')).toBe(true)
    expect(interruptor('Cookies de análise').getAttribute('aria-checked')).toBe('true')
    const salvar = screen.getByRole('button', { name: 'Salvar preferências' })
    expect(salvar.hasAttribute('disabled')).toBe(true)
    expect(screen.getByText(/ainda não alterou nada/)).toBeTruthy()
    fireEvent.click(interruptor('Cookies de marketing'))
    expect(interruptor('Cookies de marketing').getAttribute('aria-checked')).toBe('false')
    expect(salvar.hasAttribute('disabled')).toBe(false)
    expect(screen.getByText(/Você mudou algo/)).toBeTruthy()
    fireEvent.click(salvar)
    expect(document.cookie).toContain(CONSENT_COOKIE_NAME)
    expect(screen.getByText(/Preferências salvas/)).toBeTruthy()
  })

  it('quem já escolheu vê a escolha salva, não o padrão', async () => {
    setConsent({ necessary: true, analytics: false, marketing: false })
    render(
      <ConsentProvider>
        <PreferenciasDeCookies />
      </ConsentProvider>,
    )
    expect(await screen.findByText(/já salvou neste navegador/)).toBeTruthy()
    expect(interruptor('Cookies de análise').getAttribute('aria-checked')).toBe('false')
    expect(interruptor('Cookies de marketing').getAttribute('aria-checked')).toBe('false')
    expect(
      screen.getByRole('button', { name: 'Salvar preferências' }).hasAttribute('disabled'),
    ).toBe(true)
  })
})
