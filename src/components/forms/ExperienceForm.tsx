'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import * as Sentry from '@sentry/nextjs'
import { AsYouType } from 'libphonenumber-js/min'
import { type ReactNode, useEffect, useId, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { type SubmitFormResult, submitForm } from '@/app/(frontend)/_actions/submit-form'
import { FalhaDeEnvio } from '@/components/forms/FalhaDeEnvio'
import { Turnstile } from '@/components/forms/Turnstile'
import { EXPERIENCE_EVENT as E } from '@/data/experienceEvent'
import { type ExperienceInput, type ExperienceValues, experienceSchema } from '@/lib/form-schemas'

type Status = 'idle' | 'success' | 'error'

function CheckIcon() {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

/**
 * Inscrição no Semog Experience — o `<form>` da seção `#inscricao` da landing.
 *
 * Mesmo padrão de `PropostaForm` (RHF + `zodResolver` + `Turnstile` com `key`
 * que reseta a cada tentativa + `submitForm`), com três desvios deliberados:
 *
 * 1. **Não usa `Field`/`PhoneField`.** Aqueles dois são fechados no visual das
 *    superfícies ESCURAS do site (`bg-[rgba(10,16,46,0.6)]`, texto `--text`,
 *    erro `#F2A6B4`). Este formulário vive dentro do `.card` branco da seção
 *    `.s-paper` do protótipo aprovado, cujo CSS (`.field`, `.row`, `.check`,
 *    `.formnote`) já está em `src/components/experience/experience.css`. Usar
 *    os componentes do site aqui deixaria uma caixa escura no meio do card
 *    claro; o markup abaixo é o do protótipo, campo a campo.
 * 2. **WhatsApp com `Controller` + `AsYouType('BR')`**, e não `register`
 *    simples: `experienceSchema` valida com `isValidPhoneNumber`, que exige
 *    E.164 (`+5583…`). O texto exibido é o nacional formatado; o valor
 *    entregue ao RHF é o E.164 — mesma ideia de `PhoneField`, sem o seletor de
 *    país (evento presencial numa praia de João Pessoa).
 * 3. **Nunca dispara `generate_lead`.** Ver o comentário no `onSubmit`.
 *
 * O aceite de uso de imagem é `z.literal(true)` no schema e **nunca** vem
 * pré-marcado: consentimento pré-marcado não é consentimento.
 *
 * Os campos obrigatórios levam `required` no controle mesmo com o `<form
 * noValidate>`: o atributo é o que anuncia "obrigatório" ao leitor de tela
 * (quem enxerga infere pela marca "(opcional)" nos outros), enquanto o
 * `noValidate` mantém o Zod como dono das mensagens.
 */
export function ExperienceForm() {
  const id = useId()
  const nomeId = `${id}-nome`
  const emailId = `${id}-email`
  const telefoneId = `${id}-telefone`
  const condominioId = `${id}-condominio`
  const acompanhantesId = `${id}-acompanhantes`
  const aceiteId = `${id}-aceite`

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ExperienceInput, unknown, ExperienceValues>({
    resolver: zodResolver(experienceSchema),
    mode: 'onTouched',
    defaultValues: { nome: '', email: '', telefone: '', condominio: '', acompanhantes: '' },
  })

  // Texto exibido no campo de WhatsApp (nacional formatado). O valor que vai
  // pro RHF é o E.164 — ver o item 2 do docblock.
  const [telefoneTexto, setTelefoneTexto] = useState('')

  const [token, setToken] = useState<string | null>(null)
  const [turnstileKey, setTurnstileKey] = useState(0)
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState<ReactNode>(null)

  // A confirmação SUBSTITUI o `<form>` — o botão que estava em foco no momento
  // do envio some com ele e o foco cairia no `<body>`, deixando o anúncio da
  // `role="status"` por conta da sorte. Mover o foco para o bloco (que é
  // `tabIndex={-1}` só para poder recebê-lo) faz o leitor de tela ler a
  // confirmação e deixa o teclado no lugar certo para continuar a navegação.
  const doneRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (status === 'success') doneRef.current?.focus()
  }, [status])

  const onSubmit = handleSubmit(async (values) => {
    if (!token) {
      setStatus('error')
      setMessage('Aguarde a verificação de segurança concluir antes de enviar.')
      return
    }

    let result: SubmitFormResult
    try {
      result = await submitForm('experience', values, token)
    } catch (err) {
      // Mesmo par de `global-error.tsx`: console + Sentry. O `console.error`
      // não é redundante — o Sentry só sai do no-op quando
      // `NEXT_PUBLIC_SENTRY_DSN` existe (ver `instrumentation-client.ts`), e
      // até lá o console é o único rastro da inscrição perdida.
      console.error('[ExperienceForm] submitForm falhou:', err)
      Sentry.captureException(err, { tags: { form: 'experience' } })
      setStatus('error')
      setToken(null)
      setTurnstileKey((key) => key + 1)
      setMessage(<FalhaDeEnvio />)
      return
    }

    if (result.ok) {
      // NÃO é `generate_lead`, e isso é o ponto: inscrição em evento de
      // relacionamento não é captação. O `generate_lead` é evento-chave no GA4
      // e conversão importada no Google Ads — jogar inscrição ali inflaria a
      // contagem de leads e distorceria o custo por lead das campanhas (o
      // mesmo motivo pelo qual a inscrição não vai pro Exact, ver
      // `isExactEligible`). Evento próprio, contado à parte.
      window.gtag?.('event', 'experience_signup', { form: 'experience' })
      setStatus('success')
      return
    }

    setStatus('error')
    setToken(null)
    setTurnstileKey((key) => key + 1)

    if (result.errors) {
      for (const [field, fieldMessage] of Object.entries(result.errors)) {
        setError(field as keyof ExperienceInput, { type: 'server', message: fieldMessage })
      }
    }
    setMessage(
      result.message ?? 'Não foi possível concluir a inscrição. Confira os campos e tente de novo.',
    )
  })

  if (status === 'success') {
    // Repete data, horário e local porque é a única coisa que a pessoa precisa
    // levar daqui — e NÃO promete e-mail de confirmação do evento: o que sai
    // hoje é o auto-reply genérico do site, que não repete nada disso.
    return (
      <div className="signup-done" ref={doneRef} role="status" tabIndex={-1}>
        <span aria-hidden="true" className="signup-done-mark">
          <CheckIcon />
        </span>
        <h3>Inscrição recebida!</h3>
        <p>Anote na agenda — é onde a gente se encontra:</p>
        {/* biome-ignore lint/a11y/noRedundantRoles: redundante no papel, necessário na prática — com `list-style: none` o Safari/VoiceOver descarta a semântica de lista */}
        <ul className="facts" role="list">
          <li>
            <CheckIcon /> {E.dateLabel}, {E.weekday}
          </li>
          <li>
            <CheckIcon /> Das {E.timeLabel}
          </li>
          <li>
            <CheckIcon /> {E.venue}, {E.city} — {E.uf}
          </li>
        </ul>
        <p className="formnote">
          Chegue 15 minutos antes para o credenciamento. Leve roupa leve, garrafa de água e
          disposição — o resto é com a gente.
        </p>
      </div>
    )
  }

  return (
    <form noValidate onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor={nomeId}>Nome completo</label>
        <input
          autoComplete="name"
          id={nomeId}
          placeholder="Como quer ser chamado no credenciamento"
          required
          type="text"
          {...register('nome')}
          aria-describedby={errors.nome ? `${nomeId}-erro` : undefined}
          aria-invalid={!!errors.nome}
        />
        {errors.nome && (
          <span className="field-error" id={`${nomeId}-erro`} role="alert">
            {errors.nome.message}
          </span>
        )}
      </div>

      <div className="row">
        <div className="field">
          <label htmlFor={emailId}>E-mail</label>
          <input
            autoComplete="email"
            id={emailId}
            placeholder="voce@exemplo.com.br"
            required
            type="email"
            {...register('email')}
            aria-describedby={errors.email ? `${emailId}-erro` : undefined}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <span className="field-error" id={`${emailId}-erro`} role="alert">
              {errors.email.message}
            </span>
          )}
        </div>

        <div className="field">
          <label htmlFor={telefoneId}>WhatsApp</label>
          <Controller
            control={control}
            name="telefone"
            render={({ field }) => (
              <input
                aria-describedby={errors.telefone ? `${telefoneId}-erro` : undefined}
                aria-invalid={!!errors.telefone}
                autoComplete="tel-national"
                id={telefoneId}
                inputMode="tel"
                name={field.name}
                onBlur={field.onBlur}
                onChange={(event) => {
                  // `AsYouType` é stateful e assume um texto por vez, então é
                  // recriado a cada tecla e realimentado com o valor inteiro —
                  // mesmo raciocínio (e mesmo comentário) de `PhoneField`.
                  const formatter = new AsYouType('BR')
                  setTelefoneTexto(formatter.input(event.target.value))
                  field.onChange(formatter.getNumber()?.number ?? '')
                }}
                placeholder="(83) 90000-0000"
                ref={field.ref}
                required
                type="tel"
                value={telefoneTexto}
              />
            )}
          />
          {errors.telefone && (
            <span className="field-error" id={`${telefoneId}-erro`} role="alert">
              {errors.telefone.message}
            </span>
          )}
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label htmlFor={condominioId}>
            Condomínio <span className="opt">(opcional)</span>
          </label>
          <input
            id={condominioId}
            placeholder="Nome do seu condomínio"
            type="text"
            {...register('condominio')}
          />
        </div>

        <div className="field">
          <label htmlFor={acompanhantesId}>
            Acompanhantes <span className="opt">(opcional)</span>
          </label>
          <select
            id={acompanhantesId}
            {...register('acompanhantes')}
            aria-describedby={errors.acompanhantes ? `${acompanhantesId}-erro` : undefined}
            aria-invalid={!!errors.acompanhantes}
          >
            <option value="">Vou sozinho(a)</option>
            <option value="1">+1 pessoa</option>
            <option value="2">+2 pessoas</option>
            <option value="3">+3 pessoas</option>
          </select>
          {errors.acompanhantes && (
            <span className="field-error" id={`${acompanhantesId}-erro`} role="alert">
              {errors.acompanhantes.message}
            </span>
          )}
        </div>
      </div>

      <div className="checkwrap">
        <label className="check" htmlFor={aceiteId}>
          <input
            id={aceiteId}
            required
            type="checkbox"
            {...register('aceiteImagem')}
            aria-describedby={errors.aceiteImagem ? `${aceiteId}-erro` : undefined}
            aria-invalid={!!errors.aceiteImagem}
          />
          <span>
            O evento é fotografado e filmado. Autorizo o uso da minha imagem em fotos e vídeos do
            {E.name}, conforme a <a href="/privacidade">política de privacidade</a>.
          </span>
        </label>
        {errors.aceiteImagem && (
          <span className="field-error" id={`${aceiteId}-erro`} role="alert">
            {errors.aceiteImagem.message}
          </span>
        )}
      </div>

      {/*
       * `theme="light"`: o default da Cloudflare é `auto`, que segue o
       * `prefers-color-scheme` do visitante — com o sistema no escuro, o widget
       * viraria uma caixa preta dentro deste card branco. Os outros formulários
       * do site vivem em superfície escura e ficam no default.
       */}
      <Turnstile key={turnstileKey} onToken={setToken} theme="light" />

      {status === 'error' && message && (
        <p className="form-error" role="alert">
          {message}
        </p>
      )}

      <button className="btn btn-primary" disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Enviando…' : 'Garantir minha vaga'}
        <ArrowIcon />
      </button>
      <p className="formnote">Ao se inscrever você não entra em nenhuma lista comercial.</p>
    </form>
  )
}
