'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'

/**
 * Ilha client — o único jeito de reproduzir a troca de conteúdo no submit do
 * `<form onsubmit="event.preventDefault(); this.innerHTML='...'">` de
 * `_reference/blog.html:233` num server component. Sem backend real (o ref
 * também não tem: é só uma demonstração de UI), então não há chamada de API
 * aqui — só `preventDefault` + estado local, fiel ao comportamento do ref.
 */
export function NewsletterForm({
  placeholder,
  buttonLabel,
  successMessage,
}: {
  placeholder: string
  buttonLabel: string
  successMessage: string
}) {
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return <p className="!m-0 font-semibold text-ice-300">{successMessage}</p>
  }

  return (
    <form
      className="nl-form"
      onSubmit={(e) => {
        e.preventDefault()
        setSubmitted(true)
      }}
    >
      <input type="email" required placeholder={placeholder} aria-label="Seu e-mail" />
      <Button type="submit" variant="primary">
        {buttonLabel}
      </Button>
    </form>
  )
}
