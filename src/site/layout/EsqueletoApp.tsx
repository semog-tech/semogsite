import type React from 'react'
import type { IdPaginaApp } from '@/site/cenas/registro'
import { Cabecalho, type IdNav } from './Cabecalho'
import { Rodape } from './Rodape'
import { SimbolosSvg } from './SimbolosSvg'

type PropsEsqueleto = {
  /** Vai para `<main data-pagina>`. */
  pagina: IdPaginaApp
  atual?: IdNav
  /** A página tem a cena `#proposta`: "Seja Semog" e "Pedir proposta" vão para ela. */
  temProposta: boolean
  /** O runner da página (`<CenasDa… />`, de src/site/cenas/paginas). */
  cenas: React.ReactNode
  children: React.ReactNode
}

/** Esqueleto das páginas do pacote app (page.html do protótipo): cabeçalho, main, rodapé, runner. */
export function EsqueletoApp({ pagina, atual, temProposta, cenas, children }: PropsEsqueleto) {
  const destinoProposta = temProposta ? '#proposta' : '/proposta'
  return (
    <>
      <SimbolosSvg />
      <a className="pular" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Cabecalho atual={atual} destinoProposta={destinoProposta} />
      <main id="conteudo" data-pagina={pagina}>
        {children}
      </main>
      <Rodape destinoProposta={destinoProposta} />
      {cenas}
    </>
  )
}
