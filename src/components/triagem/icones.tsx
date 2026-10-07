/**
 * Ícones da triagem do WhatsApp — traço simples, herdam a cor do texto. São
 * decorativos (`aria-hidden`): o nome acessível vem sempre do rótulo ao lado.
 */

const TRACO = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

/** Logo do WhatsApp, o mesmo desenho que o botão flutuante sempre usou. */
export function IconeWhatsApp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4 0-.5.1-.7l.4-.5c.1-.2.1-.3 0-.5-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3a2.8 2.8 0 0 0-.9 2.1c0 1.2.9 2.4 1 2.6.1.2 1.8 2.7 4.3 3.8.6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2 0-.1-.2-.2-.4-.3Z" />
    </svg>
  )
}

export function IconeFechar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19l5.6-5.6 5.6 5.6 1.4-1.4-5.6-5.6L19 6.4 17.6 5 12 10.6 6.4 5Z" />
    </svg>
  )
}

export function IconeX() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...TRACO} strokeWidth={2}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

export function IconeVoltar() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...TRACO} strokeWidth={2}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

export function IconeSeta() {
  return (
    <svg
      className="tr-opcao-seta"
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...TRACO}
      strokeWidth={2}
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}

export function IconeBoleto() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...TRACO}>
      <path d="M6 3h9l3 3v15H6z" />
      <path d="M9 10h6M9 14h6M9 18h3" />
    </svg>
  )
}

export function IconePredio() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...TRACO}>
      <path d="M4 21V8l8-5 8 5v13" />
      <path d="M9 21v-6h6v6M9 10h.01M15 10h.01" />
    </svg>
  )
}

export function IconeConversa() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...TRACO}>
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
    </svg>
  )
}

export function IconeConfirmado() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...TRACO} strokeWidth={2.4}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

/** Círculo com exclamação: avisos da 2ª via (cobranças restritas, consulta expirada). */
export function IconeAviso() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...TRACO} strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16h.01" />
    </svg>
  )
}
