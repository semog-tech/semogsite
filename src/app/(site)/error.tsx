'use client'

import '@/site/secoes/comum/erro.css'
import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { SimbolosSvg } from '@/site/layout/SimbolosSvg'

/**
 * Erro de renderização numa página do site v2 (DP14 do plano da fase 4). Fica dentro do layout
 * raiz (site): fontes e tokens valem. Substitui a página inteira, então não há cabeçalho e os
 * símbolos SVG vêm daqui (a seta do link). Vai ao Sentry e oferece tentar de novo
 * (unstable_retry, Next 16.2) ou voltar ao início.
 */
export default function ErroDoSite({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error, { tags: { origem: 'erro-do-site' } })
  }, [error])
  return (
    <main id="conteudo" className="erro-do-site" data-tema="claro">
      <SimbolosSvg />
      <div className="container">
        {/* TEXTO-NOVO */}
        <h1 className="erro-titulo">Algo não carregou.</h1>
        {/* TEXTO-NOVO */}
        <p className="erro-texto">Tente de novo. Se não der certo, volte ao início.</p>
        <div className="erro-acoes">
          <button className="botao" type="button" onClick={() => unstable_retry()}>
            Tentar de novo
          </button>
          <a className="link-seta" href="/">
            <span>Ir para a página inicial</span>
            <svg className="seta" aria-hidden="true">
              <use href="#seta" />
            </svg>
          </a>
        </div>
      </div>
    </main>
  )
}
