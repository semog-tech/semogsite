/**
 * Os ícones que a landing do Experience repete. Todos vieram do protótipo
 * aprovado e são desenhados com `stroke="currentColor"`, então quem herda a cor
 * é o contexto — é assim que o mesmo check aparece no acento da marca dentro do
 * card claro e em branco sobre o hero escuro.
 *
 * Viraram módulo quando o check chegou à quarta cópia idêntica (hero, agenda,
 * seção de inscrição e formulário). Com o `d` do path copiado em quatro
 * arquivos, um ajuste de traço acerta três e esquece o quarto — e ninguém vê,
 * porque todos continuam desenhando alguma coisa.
 *
 * Sem `'use client'`: são funções puras de JSX, usadas tanto por server quanto
 * por client components.
 */

export function CheckIcon({ strokeWidth = '2' }: { strokeWidth?: string }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      viewBox="0 0 24 24"
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}

/**
 * Círculo de aviso. É o ícone das listas que falam do que NÃO acontece — e não
 * o check: um check ao lado de "não há inscrição no dia" leria como promessa
 * cumprida, o oposto do que a linha diz.
 */
export function InfoIcon() {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.4v.1" />
    </svg>
  )
}

export function CalendarIcon() {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
      <rect height="16" rx="2" width="18" x="3" y="5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  )
}

export function ArrowIcon() {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

/** Cadeado — acompanha a linha de vagas, aberta ou fechada. */
export function LockIcon() {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <rect height="10" rx="2" width="14" x="5" y="11" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}
