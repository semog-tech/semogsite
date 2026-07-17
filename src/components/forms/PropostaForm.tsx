'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { submitForm } from '@/app/(frontend)/_actions/submit-form'
import { Field } from '@/components/forms/Field'
import { PhoneField } from '@/components/forms/PhoneField'
import { Turnstile } from '@/components/forms/Turnstile'
import { Button } from '@/components/ui/Button'
import { type PropostaInput, type PropostaValues, propostaSchema } from '@/lib/form-schemas'

/**
 * Opções de `tipo`/`cargo`/`cidade` — copiadas de propósito de
 * `src/seed/forms.ts` (`propostaData.fields`) e dos enums de
 * `src/lib/form-schemas.ts` (`propostaSchema`). Aqui `label === value` em
 * todas (diferente do `assunto` de Contato), então cada array serve tanto
 * pro rótulo exibido quanto pro valor submetido. Se o seed mudar as opções,
 * atualizar aqui também (mesmo aviso já documentado nos dois arquivos).
 */
const TIPO_OPTIONS: { label: string; value: PropostaValues['tipo'] }[] = [
  { label: 'Condomínio residencial', value: 'Condomínio residencial' },
  { label: 'Condomínio comercial', value: 'Condomínio comercial' },
  { label: 'Associação', value: 'Associação' },
  { label: 'Incorporadora', value: 'Incorporadora' },
]

const CARGO_OPTIONS: { label: string; value: NonNullable<PropostaValues['cargo']> }[] = [
  { label: 'Síndico(a)', value: 'Síndico(a)' },
  { label: 'Conselheiro(a)', value: 'Conselheiro(a)' },
  { label: 'Morador(a)', value: 'Morador(a)' },
  { label: 'Incorporador(a) / Construtora', value: 'Incorporador(a) / Construtora' },
  { label: 'Outro', value: 'Outro' },
]

const CIDADE_OPTIONS: { label: string; value: NonNullable<PropostaValues['cidade']> }[] = [
  { label: 'Recife e região', value: 'Recife e região' },
  { label: 'João Pessoa e região', value: 'João Pessoa e região' },
  { label: 'Campina Grande e região', value: 'Campina Grande e região' },
  { label: 'Belém e região', value: 'Belém e região' },
  { label: 'Outra cidade', value: 'Outra cidade' },
]

type Status = 'idle' | 'success' | 'error'

/**
 * Formulário "Proposta" (form id=2, `src/seed/forms.ts`): mesmo padrão do
 * `ContactForm` (RHF + `propostaSchema` + Turnstile + `submitForm` Server
 * Action) — ver comentário lá pro fluxo de erro completo. `tipo` é o único
 * select obrigatório (`cargo`/`cidade` são opcionais); os três usam
 * `setValueAs` pra converter o `''` do placeholder em `undefined`, senão o
 * enum do Zod rejeitaria a string vazia antes mesmo do "campo não
 * preenchido" fazer sentido pros opcionais. `unidades` fica com o
 * `register` padrão (sem `valueAsNumber`) porque `propostaSchema` já faz
 * `preprocess` + `z.coerce.number()` em cima da string bruta do input —
 * por isso `useForm` usa os três generics (`PropostaInput` pro estado bruto
 * dos campos, `PropostaValues` pro valor que chega em `handleSubmit`, já
 * validado/coagido pelo `zodResolver`; ver `PropostaInput` em
 * `form-schemas.ts` pro motivo).
 */
export function PropostaForm() {
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PropostaInput, unknown, PropostaValues>({
    resolver: zodResolver(propostaSchema),
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

    const result = await submitForm('proposta', values, token)

    if (result.ok) {
      setStatus('success')
      setMessage(result.message ?? 'Solicitação recebida!')
      return
    }

    setStatus('error')
    setToken(null)
    setTurnstileKey((key) => key + 1)

    if (result.errors) {
      for (const [field, fieldMessage] of Object.entries(result.errors)) {
        setError(field as keyof PropostaInput, { type: 'server', message: fieldMessage })
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
          Um consultor da Semog entra em contato pelo WhatsApp ou e-mail informado em até 24 horas
          úteis.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <Field
        as="select"
        label="O que você representa?"
        required
        placeholder="Selecione uma opção"
        options={TIPO_OPTIONS}
        error={errors.tipo?.message}
        {...register('tipo', { setValueAs: (value) => (value === '' ? undefined : value) })}
      />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field
          label="Seu nome"
          required
          autoComplete="name"
          placeholder="Como devemos te chamar"
          error={errors.nome?.message}
          {...register('nome')}
        />
        <Field
          as="select"
          label="Seu papel"
          placeholder="Selecione uma opção (opcional)"
          options={CARGO_OPTIONS}
          error={errors.cargo?.message}
          {...register('cargo', { setValueAs: (value) => (value === '' ? undefined : value) })}
        />
      </div>
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
        <PhoneField
          control={control}
          name="telefone"
          label="WhatsApp"
          required
          error={errors.telefone?.message}
        />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field
          as="select"
          label="Cidade do condomínio"
          placeholder="Selecione uma opção (opcional)"
          options={CIDADE_OPTIONS}
          error={errors.cidade?.message}
          {...register('cidade', { setValueAs: (value) => (value === '' ? undefined : value) })}
        />
        <Field
          label="Número de unidades"
          type="number"
          min={1}
          step={1}
          placeholder="Ex.: 40 (opcional)"
          error={errors.unidades?.message}
          {...register('unidades')}
        />
      </div>
      <Field
        as="textarea"
        label="Conte um pouco do momento do condomínio"
        hint="Opcional"
        rows={4}
        placeholder="Ex.: estamos insatisfeitos com a prestação de contas atual e temos inadimplência alta."
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
          {isSubmitting ? 'Enviando…' : 'Enviar solicitação'}
        </Button>
        <span className="text-[0.86rem] text-fg-3">
          Resposta da nossa equipe comercial em até 24 horas úteis.
        </span>
      </div>
    </form>
  )
}
