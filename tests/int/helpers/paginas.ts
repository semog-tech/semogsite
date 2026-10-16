import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { expect } from 'vitest'
import type { ListaCenas } from '@/site/core/tipos'
import { entradaDe, VIRADA_1_FEITA } from '@/site/inventario'
import { PAGINAS_NA_PREVIA, PREFIXO_DA_PREVIA, semPrefixoDaPrevia } from '@/site/rotas'
import { procurarRedacaoVedada, procurarTermosVedados } from './identidade'
import {
  type Diferencas,
  diferencasNaoDeclaradas,
  SEM_DIFERENCA,
  secaoDoPrototipo,
} from './prototipo'

/** Uma seção da página: o id, a parcial do protótipo (null = sem protótipo) e o que difere. */
export type SecaoEsperada = { id: string; arquivo: string | null; diferencas?: Diferencas }

type Conferencia = { dataPagina: string; secoes: readonly SecaoEsperada[]; cenas?: ListaCenas }

/**
 * O que toda página do site v2 precisa cumprir: o `<main>` certo, as seções na ordem do
 * protótipo e com a marcação dele, cada cena com a sua seção, nenhum termo vedado nem regra de
 * redação quebrada, todo WhatsApp marcado como atendimento, toda âncora com alvo e todo link
 * interno numa página do inventário (e, antes da virada, dentro da prévia quando ela existe lá).
 */
export function conferirPagina(pagina: ReactElement, conferencia: Conferencia): HTMLElement {
  const { dataPagina, secoes, cenas } = conferencia
  const { container } = render(pagina)
  const main = container.querySelector('main#conteudo')
  expect(main?.getAttribute('data-pagina')).toBe(dataPagina)
  const ids = Array.from(main?.querySelectorAll(':scope > section') ?? []).map((s) => s.id)
  expect(ids).toEqual(secoes.map((s) => s.id))
  if (cenas) {
    const daCena = cenas.map(([id]) => id)
    expect(daCena).toEqual(ids.filter((id) => daCena.includes(id)))
    expect(daCena.every((id) => ids.includes(id))).toBe(true)
  }
  for (const secao of secoes) {
    const el = container.querySelector(`section#${secao.id}`)
    if (!el || !secao.arquivo) continue
    expect(
      diferencasNaoDeclaradas(el, secaoDoPrototipo(secao.arquivo), secao.diferencas),
      secao.arquivo,
    ).toEqual(SEM_DIFERENCA)
  }
  const texto = container.textContent ?? ''
  expect(procurarTermosVedados(texto)).toEqual([])
  expect(procurarRedacaoVedada(texto)).toEqual([])
  conferirLinks(container)
  return container
}

function conferirLinks(container: HTMLElement): void {
  for (const a of Array.from(container.querySelectorAll('a[href]'))) {
    const href = a.getAttribute('href') ?? ''
    if (/wa\.me|whatsapp/i.test(href)) {
      expect(a.getAttribute('data-wa-caminho'), href).toMatch(/^(cliente|restrita)$/)
    }
    if (href.startsWith('#') && href.length > 1) {
      expect(document.getElementById(decodeURIComponent(href.slice(1))), href).not.toBeNull()
    }
    if (!href.startsWith('/') || href.startsWith('/site-v2/')) continue
    const caminho = semPrefixoDaPrevia(href).split(/[?#]/)[0] || '/'
    expect(entradaDe(caminho)?.tipo, href).toBe('pagina')
    if (!VIRADA_1_FEITA && PAGINAS_NA_PREVIA.has(caminho)) {
      expect(href.startsWith(PREFIXO_DA_PREVIA), `${href} sai da prévia`).toBe(true)
    }
  }
}
