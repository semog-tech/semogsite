import type { ReactNode } from 'react'

/**
 * Confirmação dos formulários de proposta do card navy (`PropostaForm` e
 * `PropostaCurtaForm`): o mesmo aviso nos dois braços do teste A/B, para a
 * diferença medida ser só a do formulário. `semEmail` é o curto, que não pede
 * e-mail: prometer contato "pelo e-mail informado" ali seria falso.
 */
export function PropostaRecebida({
  titulo,
  semEmail = false,
}: {
  titulo: ReactNode
  semEmail?: boolean
}) {
  return (
    <div role="status" className="py-[1.5rem] text-center">
      <div
        aria-hidden="true"
        className="mx-auto mb-[1.4rem] flex h-[72px] w-[72px] items-center justify-center rounded-pill border border-ice-400 bg-ice-400/10"
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M20 6 9 17l-5-5"
            stroke="var(--color-ice-400)"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h3 className="text-h3">{titulo}</h3>
      <p className="mx-auto m-0 max-w-[40ch] text-fg-2">
        Um consultor da Semog entra em contato pelo{' '}
        {semEmail ? 'WhatsApp informado' : 'WhatsApp ou e-mail informado'} em até 24 horas úteis.
      </p>
    </div>
  )
}
