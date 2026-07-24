'use client'

import { type ReactNode, useId, useState } from 'react'

type Panel = { key: string; label: string; content: ReactNode }

/**
 * Abas da central de aprendizado. Ilha client mínima — só guarda qual painel
 * está visível; todo o conteúdo (inclusive os guias de passo a passo) é
 * renderizado no servidor e passado como `children`/`content`, então o HTML
 * que o Google recebe já tem o texto completo das 3 abas — a troca de aba só
 * alterna o atributo `hidden` via `useState`, nunca monta/desmonta conteúdo.
 *
 * Com um painel só, nem renderiza a barra de abas: uma aba solitária é ruído
 * (ex.: enquanto só os guias de texto existem e vídeos/materiais ainda não).
 */
export function LearnTabs({ panels }: { panels: Panel[] }) {
  const [active, setActive] = useState(panels[0]?.key)
  const id = useId()

  if (panels.length === 0) return null

  return (
    <>
      {panels.length > 1 && (
        <div className="learn-tabs" role="tablist">
          {panels.map((p) => (
            <button
              key={p.key}
              type="button"
              role="tab"
              id={`${id}-tab-${p.key}`}
              aria-selected={active === p.key}
              aria-controls={`${id}-panel-${p.key}`}
              className="learn-tab"
              onClick={() => setActive(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
      {panels.map((p) => (
        <div
          key={p.key}
          role="tabpanel"
          id={`${id}-panel-${p.key}`}
          aria-labelledby={`${id}-tab-${p.key}`}
          className="learn-panel"
          hidden={active !== p.key}
        >
          {p.content}
        </div>
      ))}
    </>
  )
}
