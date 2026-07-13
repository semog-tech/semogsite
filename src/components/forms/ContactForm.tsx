'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { submitForm } from '@/app/(frontend)/_actions/submit-form'
import { Field } from '@/components/forms/Field'
import { Turnstile } from '@/components/forms/Turnstile'
import { Button } from '@/components/ui/Button'
import { type ContatoValues, contatoSchema } from '@/lib/form-schemas'

/**
 * Rótulos das opções de `assunto` — copiados de propósito de
 * `src/seed/forms.ts` (`contatoData.fields`, bloco `assunto`) e dos valores
 * de `ASSUNTO_OPTIONS` em `src/lib/form-schemas.ts`. Se um dos dois mudar,
 * atualizar aqui também (mesmo aviso já documentado nos dois arquivos).
 */
const ASSUNTO_OPTIONS: { label: string; value: NonNullable<ContatoValues['assunto']> }[] = [
  { label: 'Dúvida geral', value: 'duvida-geral' },
  { label: 'Segunda via de boleto', value: 'segunda-via-boleto' },
  { label: 'CND do condomínio', value: 'cnd-condominio' },
  { label: 'Acordo para pagamento', value: 'acordo-pagamento' },
  { label: 'Alteração de titularidade', value: 'alteracao-titularidade' },
  { label: 'Declaração de quitação', value: 'declaracao-quitacao' },
  { label: 'Reserva de áreas comuns', value: 'reserva-areas-comuns' },
  { label: 'Proposta comercial', value: 'proposta-comercial' },
  { label: 'Outro assunto', value: 'outro' },
]

type Status = 'idle' | 'success' | 'error'

/**
 * Formulário "Contato" (form id=1, `src/seed/forms.ts`): RHF + `contatoSchema`
 * (validação client, mesmas regras do server) + Turnstile (token só liberado
 * quando o widget confirma o desafio) + `submitForm` Server Action.
 *
 * Fluxo de erro do server: `submitForm` devolve `errors: Record<field,msg>`
 * quando a causa é validação (mesma forma que o client já usa via
 * `formState.errors`) — `setError` reaplica esses erros nos campos certos.
 * Falhas sem campo associado (Turnstile, rate limit, DB) caem no aviso
 * genérico abaixo do form. Turnstile é remontado (`key`) após qualquer erro
 * de submit porque o token é de uso único — reenviar o mesmo token falharia
 * de novo no Cloudflare.
 */
export function ContactForm() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContatoValues>({
    resolver: zodResolver(contatoSchema),
    defaultValues: { nome: '', email: '', telefone: '', mensagem: '' },
  })

  const [token, setToken] = useState<string | null>(null)
  const [turnstileKey, setTurnstileKey] = useState(0)
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const onSubmit = handleSubmit(async (values) => {
    if (!token) {
      setStatus('error')
      setMessage('Aguarde a verificação de segurança concluir antes de enviar.')
      return
    }

    const result = await submitForm('contato', values, token)

    if (result.ok) {
      setStatus('success')
      setMessage(result.message ?? 'Recebemos sua mensagem!')
      return
    }

    setStatus('error')
    setToken(null)
    setTurnstileKey((key) => key + 1)

    if (result.errors) {
      for (const [field, fieldMessage] of Object.entries(result.errors)) {
        setError(field as keyof ContatoValues, { type: 'server', message: fieldMessage })
      }
    }
    setMessage(result.message ?? 'Não foi possível enviar. Confira os campos e tente novamente.')
  })

  if (status === 'success') {
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
        <h3 className="text-h3">{message}</h3>
        <p className="mx-auto m-0 max-w-[40ch] text-fg-2">
          Nossa equipe entra em contato em breve.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <Field
        label="Nome"
        required
        autoComplete="name"
        placeholder="Como devemos te chamar"
        error={errors.nome?.message}
        {...register('nome')}
      />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field
          label="E-mail"
          type="email"
          required
          autoComplete="email"
          placeholder="voce@exemplo.com.br"
          error={errors.email?.message}
          {...register('email')}
        />
        <Field
          label="Telefone / WhatsApp"
          type="tel"
          autoComplete="tel"
          placeholder="(81) 9 0000-0000"
          error={errors.telefone?.message}
          {...register('telefone')}
        />
      </div>
      <Field
        as="select"
        label="Assunto"
        placeholder="Selecione um assunto (opcional)"
        options={ASSUNTO_OPTIONS}
        error={errors.assunto?.message}
        {...register('assunto', { setValueAs: (value) => (value === '' ? undefined : value) })}
      />
      <Field
        as="textarea"
        label="Mensagem"
        required
        rows={4}
        placeholder="Conte como podemos ajudar."
        error={errors.mensagem?.message}
        {...register('mensagem')}
      />

      <Turnstile key={turnstileKey} onToken={setToken} className="min-h-[65px]" />

      {status === 'error' && message && (
        <p role="alert" className="m-0 text-[0.9rem] text-[#F2A6B4]">
          {message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-[1.4rem]">
        <Button type="submit" variant="primary" size="lg" disabled={isSubmitting} withArrow>
          {isSubmitting ? 'Enviando…' : 'Enviar mensagem'}
        </Button>
        <span className="text-[0.86rem] text-fg-3">
          Respondemos em horário comercial, geralmente em poucos minutos.
        </span>
      </div>
    </form>
  )
}
