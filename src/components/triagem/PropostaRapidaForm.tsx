'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import * as Sentry from '@sentry/nextjs'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { submitPropostaRapida } from '@/app/(frontend)/_actions/submit-form'
import { FalhaDeEnvio } from '@/components/forms/FalhaDeEnvio'
import { Field } from '@/components/forms/Field'
import { PhoneField } from '@/components/forms/PhoneField'
import { Turnstile } from '@/components/forms/Turnstile'
import type { CidadeDaLanding } from '@/lib/cidadeDaLanding'
import { type PropostaRapidaValues, propostaRapidaSchema } from '@/lib/form-schemas'
import type { SubmitFormResult } from '@/lib/forms'
import { registrarPropostaEnviada } from './medicao'

/**
 * Rótulos curtos (cabem na folha do celular); o valor é a opção do enum do
 * formulário, a mesma que roteia a notificação e o "Mercado" do Exact.
 */
const CIDADE_OPTIONS: { label: string; value: PropostaRapidaValues['cidade'] }[] = [
  { label: 'Recife', value: 'Recife e região' },
  { label: 'João Pessoa', value: 'João Pessoa e região' },
  { label: 'Campina Grande', value: 'Campina Grande e região' },
  { label: 'Belém', value: 'Belém e região' },
  { label: 'Outra cidade', value: 'Outra cidade' },
]

type Props = {
  /** Praça da landing em que a triagem foi aberta, se for uma. */
  cidadeDaPagina?: CidadeDaLanding
  /** Lead gravado: a triagem troca para a confirmação com este protocolo. */
  aoEnviar: (protocolo: string) => void
  /** Avisa a triagem para travar o "Voltar" enquanto o envio está em curso. */
  aoMudarEnvio: (enviando: boolean) => void
}

/**
 * Proposta curta da triagem: nome, WhatsApp, condomínio (opcional) e cidade.
 * Mesmo padrão do `PropostaForm` (RHF + Zod + Turnstile + Server Action), com a
 * action própria `submitPropostaRapida`, que grava pelo mesmo pipeline.
 *
 * Só chama `aoEnviar` com `ok: true` e protocolo em mãos: falha de gravação
 * fica nesta tela, com a mensagem, e nunca vira confirmação.
 */
export function PropostaRapidaForm({ cidadeDaPagina, aoEnviar, aoMudarEnvio }: Props) {
  const {
    register,
    handleSubmit,
    setError,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PropostaRapidaValues>({
    resolver: zodResolver(propostaRapidaSchema),
    mode: 'onTouched',
    defaultValues: { nome: '', telefone: '', nomeCondominio: '', cidade: cidadeDaPagina?.cidade },
  })

  const [token, setToken] = useState<string | null>(null)
  const [turnstileKey, setTurnstileKey] = useState(0)
  const [falha, setFalha] = useState<ReactNode>(null)

  // A resposta pode chegar depois de a pessoa fechar a triagem. O lead está
  // gravado e a conversão conta, mas não há mais tela para confirmar.
  const montado = useRef(true)
  useEffect(() => {
    montado.current = true
    return () => {
      montado.current = false
    }
  }, [])

  useEffect(() => {
    aoMudarEnvio(isSubmitting)
  }, [isSubmitting, aoMudarEnvio])

  function recomecarVerificacao(mensagem: ReactNode) {
    setToken(null)
    setTurnstileKey((key) => key + 1)
    setFalha(mensagem)
  }

  const onSubmit = handleSubmit(async (values) => {
    if (!token) {
      setFalha('Aguarde a verificação de segurança concluir antes de enviar.')
      return
    }

    let result: SubmitFormResult
    try {
      result = await submitPropostaRapida(values, token)
    } catch (err) {
      // Mesmo par do `PropostaForm`: console + Sentry (o Sentry só sai do no-op
      // com `NEXT_PUBLIC_SENTRY_DSN`; até lá o console é o único rastro).
      console.error('[PropostaRapidaForm] submitPropostaRapida falhou:', err)
      Sentry.captureException(err, { tags: { form: 'proposta', variante: 'contato_rapido' } })
      recomecarVerificacao(<FalhaDeEnvio />)
      return
    }

    if (result.ok && result.protocolo) {
      registrarPropostaEnviada()
      if (montado.current) aoEnviar(result.protocolo)
      return
    }

    for (const [campo, mensagem] of Object.entries(result.errors ?? {})) {
      setError(campo as keyof PropostaRapidaValues, { type: 'server', message: mensagem })
    }
    recomecarVerificacao(
      result.message ?? 'Não foi possível enviar. Confira os campos e tente novamente.',
    )
  })

  const cidadeEscolhida = watch('cidade')
  const dicaDaCidade =
    cidadeDaPagina && cidadeEscolhida === cidadeDaPagina.cidade
      ? `Já vem com ${cidadeDaPagina.nome} porque você está na página de ${cidadeDaPagina.nome}.`
      : undefined

  return (
    <form onSubmit={onSubmit} noValidate aria-busy={isSubmitting}>
      <fieldset disabled={isSubmitting} className="m-0 flex flex-col gap-4 border-0 p-0">
        <Field
          label="Seu nome"
          required
          autoComplete="name"
          placeholder="Como devemos te chamar"
          error={errors.nome?.message}
          {...register('nome')}
        />
        <PhoneField
          control={control}
          name="telefone"
          label="WhatsApp"
          required
          error={errors.telefone?.message}
        />
        <Field
          label="Nome do condomínio"
          autoComplete="off"
          placeholder="Opcional"
          error={errors.nomeCondominio?.message}
          {...register('nomeCondominio')}
        />
        <Field
          as="select"
          label="Cidade do condomínio"
          required
          placeholder="Selecione"
          options={CIDADE_OPTIONS}
          hint={dicaDaCidade}
          error={errors.cidade?.message}
          {...register('cidade')}
        />
        <Turnstile key={turnstileKey} onToken={setToken} theme="dark" className="min-h-[65px]" />
        {falha && (
          <p role="alert" className="tr-erro">
            {falha}
          </p>
        )}
        <button type="submit" className="tr-primario">
          {isSubmitting && <span className="tr-girando" aria-hidden="true" />}
          {isSubmitting ? 'Enviando…' : 'Pedir proposta'}
        </button>
      </fieldset>
    </form>
  )
}
