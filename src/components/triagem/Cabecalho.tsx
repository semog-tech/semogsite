'use client'

import type { RefObject } from 'react'
import { IconeVoltar, IconeX } from './icones'

/** O título do painel: o `id` dá nome ao diálogo e o `ref` recebe o foco a cada tela. */
export type TituloDoPainel = { id: string; ref: RefObject<HTMLHeadingElement | null> }

export type Voltar = { rotulo: string; desabilitado?: boolean; aoVoltar: () => void }

type Props = {
  texto: string
  titulo: TituloDoPainel
  /** Sem `voltar`, a tela não tem para onde voltar e o botão não aparece. */
  voltar?: Voltar
  aoFechar: () => void
}

/** Cabeçalho do painel da triagem: Voltar (quando há), título e Fechar. */
export function Cabecalho({ texto, titulo, voltar, aoFechar }: Props) {
  return (
    <div className="tr-cabecalho">
      {voltar && (
        <button
          type="button"
          className="tr-icone-btn tr-voltar"
          aria-label={voltar.rotulo}
          disabled={voltar.desabilitado}
          onClick={voltar.aoVoltar}
        >
          <IconeVoltar />
        </button>
      )}
      <h2 id={titulo.id} ref={titulo.ref} tabIndex={-1}>
        {texto}
      </h2>
      <button type="button" className="tr-icone-btn" aria-label="Fechar" onClick={aoFechar}>
        <IconeX />
      </button>
    </div>
  )
}
