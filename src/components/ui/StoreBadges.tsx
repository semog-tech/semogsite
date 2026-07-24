import type { ReactNode } from 'react'

/**
 * Selos de App Store e Google Play. SVG inline em vez de imagem: são dois
 * ícones simples, e assim herdam a cor do tema sem precisar de dois arquivos
 * por variante. Cada selo é um link real para a ficha da loja — selo que não
 * clica é decoração, e o objetivo aqui é download.
 *
 * Reusado pelo bloco `appShowcase` (home) e pelo `appHero` (/aplicativo).
 */
export function StoreBadges({
  appStore,
  playStore,
  className = '',
}: {
  appStore?: string | null
  playStore?: string | null
  className?: string
}): ReactNode {
  if (!appStore && !playStore) return null

  return (
    <div className={`store-badges ${className}`.trim()}>
      {appStore && (
        <a className="store-badge" href={appStore} target="_blank" rel="noopener noreferrer">
          <svg
            className="store-badge-ico"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M16.4 12.6c0-2.2 1.8-3.3 1.9-3.3-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.3.8-.7 0-1.7-.8-2.8-.8-1.5 0-2.8.9-3.6 2.2-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.6 2.2 2.7 2.1 1.1 0 1.5-.7 2.8-.7s1.7.7 2.8.7c1.2 0 1.9-1 2.6-2.1.8-1.2 1.2-2.4 1.2-2.4-.1 0-2.2-.9-2.2-3.4zM14.3 5.9c.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.6 1.3-.6.6-1.1 1.7-.9 2.6 1 .1 2-.5 2.6-1.2z" />
          </svg>
          <span>
            <small>Baixar na</small>
            <b>App Store</b>
          </span>
        </a>
      )}
      {playStore && (
        <a className="store-badge" href={playStore} target="_blank" rel="noopener noreferrer">
          <svg className="store-badge-ico" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3.6 2.3a1 1 0 00-.5.9v17.6a1 1 0 00.5.9l9.3-9.7z" fill="#34a853" />
            <path d="M17.1 8.2L13.6 6 3.6 2.3c-.1 0-.2-.1-.3-.1l9.6 9.8z" fill="#ea4335" />
            <path d="M17.1 15.8L13.6 18 3.3 21.8c.1 0 .2 0 .3-.1l9.3-9.7z" fill="#fbbc04" />
            <path d="M17.1 8.2l3.4 2c.9.5.9 1.8 0 2.3l-3.4 2-4.2-3.2z" fill="#4285f4" />
          </svg>
          <span>
            <small>Disponível no</small>
            <b>Google Play</b>
          </span>
        </a>
      )}
    </div>
  )
}
