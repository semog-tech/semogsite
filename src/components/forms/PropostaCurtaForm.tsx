'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import * as Sentry from '@sentry/nextjs'
import { type ReactNode, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { submitPropostaRapida } from '@/app/(frontend)/_actions/submit-form'
import { FalhaDeEnvio } from '@/components/forms/FalhaDeEnvio'
import { Field } from '@/components/forms/Field'
import { PhoneField } from '@/components/forms/PhoneField'
import { PropostaRecebida } from '@/components/forms/PropostaRecebida'
import { Turnstile } from '@/components/forms/Turnstile'
import { useEnvioVisivelNoErro } from '@/components/forms/useEnvioVisivelNoErro'
import { Button } from '@/components/ui/Button'
import { type PropostaRapidaValues, propostaRapidaSchema } from '@/lib/form-schemas'
import { type SubmitFormResult, VARIANTE_CONTATO_RAPIDO } from '@/lib/forms'
import { registrarLeadGerado } from '@/lib/medicaoLead'
import { lerOrigemDoNavegador } from '@/lib/origemDoNavegador'

type Status = 'idle' | 'success' | 'error'

/**
 * Braço `b` do teste A/B do topo das landings de cidade (ver `PropostaFormAb`):
 * só nome, WhatsApp e condomínio (opcional), com a cidade da landing num hidden.
 *
 * Visual e comportamento do `PropostaForm` compacto (mesmo `Field`, `PhoneField`,
 * `Button`, Turnstile escuro, aviso de erro e `useEnvioVisivelNoErro`), para a
 * diferença medida ser só o número de campos. O envio é o da proposta curta da
 * triagem (`submitPropostaRapida` + `propostaRapidaSchema`): mesmo rate limit,
 * Turnstile, deduplicação por telefone, gravação como `form = 'proposta'`,
 * e-mail ao comercial da cidade e CRM. O que a distingue no lead é
 * `testeFormulario: 'b'` (a action ainda acrescenta `variante: 'contato-rapido'`
 * e um protocolo, que esta tela não mostra: aqui ninguém continua a conversa
 * citando-o no WhatsApp).
 */
export function PropostaCurtaForm({ cidade }: { cidade: PropostaRapidaValues['cidade'] }) {
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PropostaRapidaValues>({
    resolver: zodResolver(propostaRapidaSchema),
    mode: 'onTouched',
    defaultValues: { nome: '', telefone: '', nomeCondominio: '', cidade },
  })

  const [token, setToken] = useState<string | null>(null)
  const [turnstileKey, setTurnstileKey] = useState(0)
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState<ReactNode>(null)

  const formRef = useRef<HTMLFormElement>(null)
  useEnvioVisivelNoErro(status, turnstileKey, formRef)

  const onSubmit = handleSubmit(async (values) => {
    if (!token) {
      setStatus('error')
      setMessage('Aguarde a verificação de segurança concluir antes de enviar.')
      return
    }

    let result: SubmitFormResult
    try {
      result = await submitPropostaRapida(
        { ...values, testeFormulario: 'b' },
        token,
        lerOrigemDoNavegador(),
      )
    } catch (err) {
      // Mesmo par do `PropostaForm`: console + Sentry (o Sentry só sai do no-op
      // com `NEXT_PUBLIC_SENTRY_DSN`; até lá o console é o único rastro).
      console.error('[PropostaCurtaForm] submitPropostaRapida falhou:', err)
      Sentry.captureException(err, { tags: { form: 'proposta', teste_formulario: 'b' } })
      setStatus('error')
      setToken(null)
      setTurnstileKey((key) => key + 1)
      setMessage(<FalhaDeEnvio />)
      return
    }

    if (result.ok) {
      // O mesmo `generate_lead` do braço `a` (e da triagem), com a variante do
      // teste ao lado: não abre série nova de conversão no Ads.
      registrarLeadGerado('proposta', {
        variante: VARIANTE_CONTATO_RAPIDO,
        teste_formulario: 'b',
      })
      setStatus('success')
      setMessage(result.message ?? 'Solicitação recebida!')
      return
    }

    setStatus('error')
    setToken(null)
    setTurnstileKey((key) => key + 1)

    for (const [field, fieldMessage] of Object.entries(result.errors ?? {})) {
      // chaves do `propostaRapidaSchema`, devolvidas pela própria action
      setError(field as keyof PropostaRapidaValues, { type: 'server', message: fieldMessage })
    }
    setMessage(result.message ?? 'Não foi possível enviar. Confira os campos e tente novamente.')
  })

  if (status === 'success') {
    return <PropostaRecebida titulo={message} semEmail />
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <input type="hidden" {...register('cidade')} />
      <Field
        permitirCapturaRd
        label="Seu nome"
        required
        autoComplete="name"
        placeholder="Como devemos te chamar"
        error={errors.nome?.message}
        {...register('nome')}
      />
      <PhoneField
        permitirCapturaRd
        control={control}
        name="telefone"
        label="WhatsApp"
        required
        error={errors.telefone?.message}
      />
      <Field
        permitirCapturaRd
        label="Nome do condomínio"
        placeholder="Ex.: Ed. Atlântico (opcional)"
        error={errors.nomeCondominio?.message}
        {...register('nomeCondominio')}
      />
      <Turnstile key={turnstileKey} onToken={setToken} theme="dark" className="min-h-[65px]" />
      {status === 'error' && message && (
        <p role="alert" className="m-0 text-[0.9rem] text-[#F2A6B4]">
          {message}
        </p>
      )}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={isSubmitting}
        withArrow
        className="w-full justify-center"
      >
        {isSubmitting ? 'Enviando…' : 'Quero minha proposta'}
      </Button>
    </form>
  )
}
