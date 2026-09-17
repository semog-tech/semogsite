'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import * as Sentry from '@sentry/nextjs'
import { AsYouType } from 'libphonenumber-js/min'
import { type ReactNode, useEffect, useId, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { submitForm } from '@/app/(frontend)/_actions/submit-form'
import { ExperienceAgenda } from '@/components/experience/ExperienceAgenda'
import { ArrowIcon, CheckIcon, InfoIcon } from '@/components/experience/icones'
import { FalhaDeEnvio } from '@/components/forms/FalhaDeEnvio'
import { Turnstile } from '@/components/forms/Turnstile'
import { useEnvioVisivelNoErro } from '@/components/forms/useEnvioVisivelNoErro'
import { EXPERIENCE_EVENT as E } from '@/data/experienceEvent'
import { type ExperienceValues, experienceSchema } from '@/lib/form-schemas'
import type { SubmitFormResult } from '@/lib/forms'

type Status = 'idle' | 'success' | 'error' | 'esgotado'

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
/**
 * `onLotacao` avisa a seção de que as vagas acabaram durante o preenchimento.
 * Sem ele o formulário trocaria só o próprio card, e a coluna de texto ao lado
 * seguiria dizendo "Garanta a sua vaga" enquanto o card diz que a inscrição não
 * foi registrada — ver `ExperienceSignupAberto`. Opcional porque o formulário
 * também é renderizado fora dessa moldura nos testes.
 */
export function ExperienceForm({ onLotacao }: { onLotacao?: () => void } = {}) {
  const id = useId()
  const nomeId = `${id}-nome`
  const emailId = `${id}-email`
  const telefoneId = `${id}-telefone`
  const condominioId = `${id}-condominio`
  const aceiteId = `${id}-aceite`

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ExperienceValues>({
    resolver: zodResolver(experienceSchema),
    mode: 'onTouched',
    defaultValues: { nome: '', email: '', telefone: '', condominio: '' },
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
  // Vale igual para a recusa por lotação, que substitui o formulário do mesmo
  // jeito — e cuja notícia é ainda mais importante não se perder.
  const doneRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (status === 'success' || status === 'esgotado') doneRef.current?.focus()
  }, [status])

  // O aviso de erro entra acima do botão e o empurra para baixo — em tela curta
  // isso esconde o botão que resolve o erro. Ver o docblock do hook.
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

    // Lotou entre o carregamento desta página e o envio. NÃO é um erro a
    // corrigir: nenhuma quantidade de tentativas devolve a vaga, então o
    // formulário sai de cena em vez de ficar convidando a reenviar.
    if (result.esgotado) {
      setStatus('esgotado')
      onLotacao?.()
      return
    }

    setStatus('error')
    setToken(null)
    setTurnstileKey((key) => key + 1)

    if (result.errors) {
      for (const [field, fieldMessage] of Object.entries(result.errors)) {
        setError(field as keyof ExperienceValues, { type: 'server', message: fieldMessage })
      }
    }
    setMessage(
      result.message ?? 'Não foi possível concluir a inscrição. Confira os campos e tente de novo.',
    )
  })

  if (status === 'esgotado') {
    // A pessoa preencheu tudo e a vaga acabou no caminho — o caso mais provável
    // de acontecer na vida real, porque a página é servida com ISR e pode estar
    // até um minuto atrasada em relação ao banco.
    //
    // `role="alert"` e não `status`: aqui a notícia é que algo NÃO aconteceu, e
    // o assertivo é o que interrompe a leitura para dizer isso. A primeira
    // frase existe para não sobrar dúvida — "não foi registrada" com todas as
    // letras, porque a alternativa é alguém acordar cedo no sábado e ir à praia
    // achando que está inscrito.
    return (
      <div className="aviso" ref={doneRef} role="alert" tabIndex={-1}>
        <span aria-hidden="true" className="aviso-mark">
          <InfoIcon />
        </span>
        {/*
          O card fala só do que é específico de QUEM ACABOU DE SER RECUSADO. O
          contexto geral — "não há inscrição no dia", "a próxima edição abre
          aqui" — é papel da coluna ao lado, que trocou junto (ver
          `ExperienceSignupAberto`). Repetir os dois nos dois lados deixava as
          mesmas três frases lado a lado, e o que é importante deixa de se
          destacar quando aparece duas vezes na mesma tela.
        */}
        <h3>Sua inscrição não foi registrada</h3>
        <p>
          A última vaga foi preenchida enquanto você preenchia o formulário — e não adianta enviar
          de novo.
        </p>
        {/* biome-ignore lint/a11y/noRedundantRoles: redundante no papel, necessário na prática — com `list-style: none` o Safari/VoiceOver descarta a semântica de lista */}
        <ul className="facts facts-neutro" role="list">
          <li>
            <InfoIcon /> Você não vai receber e-mail de confirmação desta tentativa.
          </li>
          <li>
            <InfoIcon /> Se você acha que já tinha se inscrito antes, procure o e-mail de
            confirmação na sua caixa de entrada — ele é a prova da vaga.
          </li>
        </ul>
      </div>
    )
  }

  if (status === 'success') {
    // Repete data, horário e local porque é o que a pessoa precisa levar daqui
    // — e a retirada do kit, que é antecipada: descobrir isso só no sábado, na
    // praia, é tarde demais. O mesmo conjunto vai no `ExperienceAutoReply`.
    return (
      <div className="signup-done" ref={doneRef} role="status" tabIndex={-1}>
        <span aria-hidden="true" className="signup-done-mark">
          <CheckIcon />
        </span>
        <h3>Inscrição recebida!</h3>
        <p>Anote na agenda — é onde a gente se encontra:</p>
        <ExperienceAgenda />
      </div>
    )
  }

  return (
    <form ref={formRef} noValidate onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor={nomeId}>Nome completo</label>
        <input
          autoComplete="name"
          id={nomeId}
          placeholder="Como quer ser chamado no evento"
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

      {/*
        Fora da `.row` de propósito: `.row` é uma grade de duas colunas e o
        condomínio ficou sozinho quando o campo de acompanhantes saiu — dentro
        dela o campo ocuparia metade da largura, com um buraco ao lado.
      */}
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
            {/* `{' '}` explícito: o JSX come a quebra de linha entre o texto e a expressão,
                e sem ele o render sai "vídeos doSemog Experience 26", colado. */}
            O evento é fotografado e filmado. Autorizo o uso da minha imagem em fotos e vídeos do{' '}
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
