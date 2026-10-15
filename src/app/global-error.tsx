'use client'

import * as Sentry from '@sentry/nextjs'
import { type CSSProperties, useEffect } from 'react'

/**
 * Fallback catastrófico: ativa quando o erro acontece acima de qualquer error.js de segmento,
 * ou seja, quando um dos root layouts (`(frontend)`, `(evento)`, `(interno)`, `(site)`) lança.
 * Substitui o root layout inteiro, por isso define <html>/<body> próprios (doc do Next 16:
 * "Global error UI must define its own <html> and <body> tags, global styles, fonts").
 * Fica na raiz de `src/app`, fora dos grupos, para cobrir todos os root layouts.
 *
 * Não importa fonte, CSS nem componente de nenhum site: o Next pré-carrega os recursos do
 * global-error em todo root layout, então um import de `@/fonts` ou `theme.css` aqui fazia
 * cada página do site v2 baixar as fontes e o CSS do site antigo. Estilo embutido e fonte do
 * sistema; as cores literais abaixo são as do tema escuro antigo (marinho, texto claro).
 */
const MARINHO = '#0a102e'
const TEXTO = '#edf1fa'
const TEXTO_2 = '#b4bdd9'
const ACENTO = '#add5eb'
const FONTE_DO_SISTEMA = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

const estiloBotao: CSSProperties = {
  font: 'inherit',
  fontWeight: 600,
  padding: '0.9rem 1.6rem',
  border: `1px solid ${ACENTO}`,
  cursor: 'pointer',
  textDecoration: 'none',
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, background: MARINHO, color: TEXTO, fontFamily: FONTE_DO_SISTEMA }}>
        <main
          style={{
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '0 1.5rem',
          }}
        >
          <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 600, color: ACENTO }}>
            Erro inesperado
          </p>
          <h1
            style={{
              margin: '0 0 1.2rem',
              maxWidth: '36rem',
              fontSize: 'clamp(2rem, 5vw, 3.2rem)',
            }}
          >
            Algo saiu do controle
          </h1>
          <p style={{ margin: '0 0 2rem', maxWidth: '46ch', fontSize: '1.15rem', color: TEXTO_2 }}>
            Um erro grave impediu o carregamento do site. Tente novamente — se continuar, recarregue
            a página.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem' }}>
            <button
              type="button"
              onClick={reset}
              style={{ ...estiloBotao, background: ACENTO, color: MARINHO }}
            >
              Tentar de novo
            </button>
            <a href="/" style={{ ...estiloBotao, background: 'transparent', color: TEXTO }}>
              Voltar para o início
            </a>
          </div>
        </main>
      </body>
    </html>
  )
}
