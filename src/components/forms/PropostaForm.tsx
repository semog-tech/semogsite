'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import * as Sentry from '@sentry/nextjs'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { submitForm } from '@/app/(frontend)/_actions/submit-form'
import { FalhaDeEnvio } from '@/components/forms/FalhaDeEnvio'
import { Field } from '@/components/forms/Field'
import { PhoneField } from '@/components/forms/PhoneField'
import { Turnstile } from '@/components/forms/Turnstile'
import { useEnvioVisivelNoErro } from '@/components/forms/useEnvioVisivelNoErro'
import { Button } from '@/components/ui/Button'
import { type PropostaInput, type PropostaValues, propostaSchema } from '@/lib/form-schemas'
import type { SubmitFormResult } from '@/lib/forms'

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

const CIDADE_OPTIONS: { label: string; value: PropostaValues['cidade'] }[] = [
  { label: 'Recife e região', value: 'Recife e região' },
  { label: 'João Pessoa e região', value: 'João Pessoa e região' },
  { label: 'Campina Grande e região', value: 'Campina Grande e região' },
  { label: 'Belém e região', value: 'Belém e região' },
  { label: 'Outra cidade', value: 'Outra cidade' },
]

/**
 * Infere a `cidade` pelo slug da landing de unidade, pra pré-selecionar o campo
 * quando o form está embutido nessas páginas (ex.: /administradora-de-
 * condominios-recife). Menos atrito + atribuição/roteamento corretos.
 */
const CIDADE_BY_SLUG: [slug: string, cidade: PropostaValues['cidade']][] = [
  ['recife', 'Recife e região'],
  ['joao-pessoa', 'João Pessoa e região'],
  ['campina-grande', 'Campina Grande e região'],
  ['belem', 'Belém e região'],
]

type Status = 'idle' | 'success' | 'error'

/**
 * Formulário "Proposta" (form id=2, `src/seed/forms.ts`): mesmo padrão do
 * `ContactForm` (RHF + `propostaSchema` + Turnstile + `submitForm` Server
 * Action) — ver comentário lá pro fluxo de erro completo. `tipo` e `cidade` são
 * selects obrigatórios; `cargo` é opcional e por isso usa `setValueAs` pra
 * converter o `''` do placeholder em `undefined` — o enum do Zod rejeitaria a
 * string vazia antes de o `.optional()` fazer sentido. Nos obrigatórios isso
 * não muda nada: `z.enum(OPÇÕES, 'mensagem')` devolve a mesma mensagem para
 * `''`, `undefined` e valor fora da lista (conferido no Zod 4). `unidades` fica
 * com o
 * `register` padrão (sem `valueAsNumber`) porque `propostaSchema` já faz
 * `preprocess` + `z.coerce.number()` em cima da string bruta do input —
 * por isso `useForm` usa os três generics (`PropostaInput` pro estado bruto
 * dos campos, `PropostaValues` pro valor que chega em `handleSubmit`, já
 * validado/coagido pelo `zodResolver`; ver `PropostaInput` em
 * `form-schemas.ts` pro motivo).
 *
 * Campo `cargo` ("Seu papel") some quando `tipo === 'Incorporadora'`: perguntar
 * o papel de alguém que já disse ser incorporadora é redundante. `watch('tipo')`
 * decide a exibição e `setValue('cargo', undefined)` limpa o valor ao esconder,
 * pra nenhum resquício ser submetido caso o usuário troque de tipo depois de já
 * ter selecionado um cargo. `cargo` já é opcional em `propostaSchema`, então
 * esconder o campo não quebra validação nenhuma.
 */
export function PropostaForm({
  compact = false,
  withCityField = false,
  cidade,
}: {
  compact?: boolean
  withCityField?: boolean
  /**
   * Cidade já conhecida por quem renderiza — as landings de unidade passam a
   * sua (`CityLanding`). Quando vem, o campo não é perguntado: vai num hidden
   * preenchido.
   *
   * Entra pelos `defaultValues` do RHF, e não por um efeito: o valor existe no
   * estado do formulário desde a primeira renderização no cliente, em vez de
   * depender de um `useEffect` que lê a URL depois da hidratação. (No HTML do
   * servidor o `<input hidden>` sai sem `value` — quem o preenche é o React ao
   * montar. Isso não abre buraco: o formulário inteiro depende de JS para
   * enviar, então não existe cenário em que ele seja submetido antes disso.)
   */
  cidade?: PropostaValues['cidade']
} = {}) {
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PropostaInput, unknown, PropostaValues>({
    resolver: zodResolver(propostaSchema),
    mode: 'onTouched',
    defaultValues: { nome: '', nomeCondominio: '', email: '', telefone: '', mensagem: '', cidade },
  })

  const isIncorporadora = watch('tipo') === 'Incorporadora'

  // Sempre que vira Incorporadora, limpa o `cargo` (RHF mantém o valor de um
  // campo desmontado por padrão — sem isso, um cargo escolhido antes de trocar
  // pra Incorporadora ficaria retido e seria submetido mesmo com o campo oculto).
  useEffect(() => {
    if (isIncorporadora) {
      setValue('cargo', undefined)
    }
  }, [isIncorporadora, setValue])

  // Pré-seleciona a cidade pelo slug quando o form está embutido numa página de
  // unidade e ninguém passou `cidade` — é o caso do bloco de proposta dentro de
  // uma landing. Quando a prop vem (as landings de cidade), ela já entrou nos
  // `defaultValues` e este efeito não tem o que fazer. Na /proposta genérica
  // nenhum slug casa e o campo fica no placeholder, agora obrigatório.
  useEffect(() => {
    if (cidade) return
    const path = window.location.pathname
    const cidadeDoSlug = CIDADE_BY_SLUG.find(([slug]) => path.includes(slug))?.[1]
    if (cidadeDoSlug) setValue('cidade', cidadeDoSlug)
  }, [cidade, setValue])

  const [token, setToken] = useState<string | null>(null)
  const [turnstileKey, setTurnstileKey] = useState(0)
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState<ReactNode>(null)

  // Na variante compacta (hero das landings) o botão de envio termina abaixo da
  // dobra em 1366x768 e o aviso de erro o empurra ainda mais — ver o docblock
  // do hook.
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
      result = await submitForm('proposta', values, token)
    } catch (err) {
      // Mesmo par de `global-error.tsx`: console + Sentry. O `console.error`
      // não é redundante — o Sentry só sai do no-op quando
      // `NEXT_PUBLIC_SENTRY_DSN` existe (ver `instrumentation-client.ts`), e
      // até lá o console é o único rastro da submissão perdida.
      console.error('[PropostaForm] submitForm falhou:', err)
      Sentry.captureException(err, { tags: { form: 'proposta' } })
      setStatus('error')
      setToken(null)
      setTurnstileKey((key) => key + 1)
      setMessage(<FalhaDeEnvio />)
      return
    }

    if (result.ok) {
      // Conversão de lead → GA4 `generate_lead`. Marcar como evento-chave no GA4
      // e importar como conversão no Google Ads (o Consent Mode cuida do gating).
      window.gtag?.('event', 'generate_lead', { form: 'proposta', currency: 'BRL', value: 1 })
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

  // Variante COMPACTA (hero das landings de cidade): menos atrito = mais
  // conversão (ver análise SEO/Ads). `cidade` vai num hidden, preenchida pelo
  // useEffect de slug acima; o resto (cargo/unidades/mensagem, opcionais) some.
  if (compact) {
    return (
      <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {/*
          `cidade` é obrigatória. Ela só fica escondida quando já sabemos qual é
          — ou seja, quando quem renderiza passou a prop (as landings de
          unidade). Nas demais páginas (home, por exemplo) não há cidade
          conhecida e o campo é perguntado, com as opções prontas.

          A condição é `cidade`, e não `withCityField`: um campo OBRIGATÓRIO que
          o usuário não enxerga e não tem como preencher é um formulário que
          recusa o envio sem dizer por quê. Assim, uma página nova que esqueça
          de passar a cidade mostra o select em vez de travar em silêncio.
        */}
        {cidade && !withCityField ? (
          <input type="hidden" {...register('cidade')} />
        ) : (
          <Field
            as="select"
            label="Cidade do condomínio"
            required
            placeholder="Selecione"
            options={CIDADE_OPTIONS}
            error={errors.cidade?.message}
            {...register('cidade')}
          />
        )}
        <Field
          label="Seu nome"
          required
          autoComplete="name"
          placeholder="Como devemos te chamar"
          error={errors.nome?.message}
          {...register('nome')}
        />
        <Field
          label="Nome do condomínio"
          placeholder="Ex.: Ed. Atlântico (opcional)"
          error={errors.nomeCondominio?.message}
          {...register('nomeCondominio')}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <PhoneField
            control={control}
            name="telefone"
            label="WhatsApp"
            required
            error={errors.telefone?.message}
          />
          <Field
            as="select"
            label="Tipo de condomínio"
            required
            placeholder="Selecione"
            options={TIPO_OPTIONS}
            error={errors.tipo?.message}
            {...register('tipo', { setValueAs: (value) => (value === '' ? undefined : value) })}
          />
        </div>
        <Field
          label="E-mail"
          type="email"
          required
          autoComplete="email"
          placeholder="voce@exemplo.com.br"
          error={errors.email?.message}
          {...register('email')}
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

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <Field
        as="select"
        label="O que você representa?"
        required
        placeholder="Selecione uma opção"
        options={TIPO_OPTIONS}
        error={errors.tipo?.message}
        {...register('tipo', { setValueAs: (value) => (value === '' ? undefined : value) })}
      />
      <div className={`grid grid-cols-1 gap-5 ${isIncorporadora ? '' : 'sm:grid-cols-2'}`}>
        <Field
          label="Seu nome"
          required
          autoComplete="name"
          placeholder="Como devemos te chamar"
          error={errors.nome?.message}
          {...register('nome')}
        />
        {!isIncorporadora && (
          <Field
            as="select"
            label="Seu papel"
            placeholder="Selecione uma opção (opcional)"
            options={CARGO_OPTIONS}
            error={errors.cargo?.message}
            {...register('cargo', { setValueAs: (value) => (value === '' ? undefined : value) })}
          />
        )}
      </div>
      <Field
        label="Nome do condomínio"
        hint="Opcional — se ainda não tiver um nome definido, pode deixar em branco"
        autoComplete="off"
        placeholder="Ex.: Residencial Jardins do Atlântico"
        error={errors.nomeCondominio?.message}
        {...register('nomeCondominio')}
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
          required
          placeholder="Selecione uma opção"
          options={CIDADE_OPTIONS}
          error={errors.cidade?.message}
          {...register('cidade')}
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

      <Turnstile key={turnstileKey} onToken={setToken} theme="dark" className="min-h-[65px]" />

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
