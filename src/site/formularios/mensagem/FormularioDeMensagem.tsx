'use client'

import '@/site/formularios/proposta/formulario-proposta.css'
import * as Sentry from '@sentry/nextjs'
import { type FormEvent, useState } from 'react'
import { submitForm } from '@/app/(frontend)/_actions/submit-form'
import { Turnstile } from '@/components/forms/Turnstile'
import { conteudo } from '@/site/conteudo/conteudo'
import { TelefonesDasUnidades } from '@/site/formularios/proposta/FalhaDoEnvio'

/** TEXTO-NOVO: estados do formulário real (o protótipo só tinha o aviso de demonstração). */
const TEXTOS = {
  enviando: 'Enviando…',
  recebido: 'Recebemos sua mensagem.',
  revise: 'Confira os campos marcados.',
  verificar: 'Confirme a verificação de segurança e envie de novo.',
  falhaTitulo: 'Não conseguimos enviar agora.',
  falhaTexto: 'Tente de novo ou ligue para uma Unidade Semog:',
  tentarDeNovo: 'Tentar de novo',
  semJs:
    'Para mandar mensagem por aqui, o navegador precisa de JavaScript. Ou ligue para uma Unidade Semog:',
} as const

type Campos = { nome: string; email: string; assunto: string; mensagem: string }
type Estado =
  | { fase: 'editando'; erros: Readonly<Record<string, string>>; aviso: string }
  | { fase: 'enviando' }
  | { fase: 'enviado' }
  | { fase: 'falha' }

const EDITANDO: Estado = { fase: 'editando', erros: {}, aviso: '' }

function lerCampos(form: HTMLFormElement): Campos {
  const dados = new FormData(form)
  const texto = (nome: keyof Campos) => {
    const valor = dados.get(nome)
    return typeof valor === 'string' ? valor.trim() : ''
  }
  return {
    nome: texto('nome'),
    email: texto('email'),
    assunto: texto('assunto'),
    mensagem: texto('mensagem'),
  }
}

function Erro({ id, texto }: { id: string; texto?: string }) {
  return (
    <p className="fp-erro" id={id} aria-live="polite">
      {texto}
    </p>
  )
}

/**
 * Mensagem do Contato (spec 6; DP9 do plano da fase 4): nome, e-mail, assunto e mensagem, com o
 * Turnstile, pelo mesmo `submitForm('contato')` do site atual. Todos os assuntos vão para
 * ola@semog.com.br. Erro de campo volta ao campo; falha de envio (inclusive action antiga depois
 * de um deploy) mostra os telefones das Unidades e vai ao Sentry, nunca "enviado" falso.
 */
export function FormularioDeMensagem() {
  const { mensagem } = conteudo.contatoPagina
  const [estado, setEstado] = useState<Estado>(EDITANDO)
  const [token, setToken] = useState('')
  const [chaveDoTurnstile, setChaveDoTurnstile] = useState(0)
  const erros = estado.fase === 'editando' ? estado.erros : {}

  function novaVerificacao() {
    setToken('')
    setChaveDoTurnstile((chave) => chave + 1)
  }

  async function enviar(campos: Campos, tokenAtual: string) {
    setEstado({ fase: 'enviando' })
    try {
      const resultado = await submitForm('contato', campos, tokenAtual)
      if (resultado.ok) {
        setEstado({ fase: 'enviado' })
        return
      }
      novaVerificacao()
      if (resultado.errors) {
        setEstado({ fase: 'editando', erros: resultado.errors, aviso: TEXTOS.revise })
        return
      }
      setEstado({ fase: 'falha' })
    } catch (erro) {
      Sentry.captureException(erro, { tags: { origem: 'contato-v2' } })
      novaVerificacao()
      setEstado({ fase: 'falha' })
    }
  }

  function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (estado.fase === 'enviando') return
    if (!token) {
      setEstado({ fase: 'editando', erros: {}, aviso: TEXTOS.verificar })
      return
    }
    void enviar(lerCampos(evento.currentTarget), token)
  }

  if (estado.fase === 'enviado') {
    return (
      <div className="fp-sucesso" role="status">
        <p className="fp-sucesso-titulo">{TEXTOS.recebido}</p>
      </div>
    )
  }

  const enviando = estado.fase === 'enviando'
  return (
    <>
      <form
        className="formulario-proposta cm-form revelar revelar--bloco"
        method="post"
        onSubmit={aoEnviar}
        aria-busy={enviando || undefined}
      >
        <div className="fp-par fp-par--invertido">
          <div className="fp-campo">
            <label htmlFor="cm-nome">Nome</label>
            <div className="fp-controle">
              <input
                id="cm-nome"
                name="nome"
                type="text"
                autoComplete="name"
                required
                maxLength={120}
                aria-describedby="cm-nome-erro"
                aria-invalid={erros.nome ? true : undefined}
              />
            </div>
            <Erro id="cm-nome-erro" texto={erros.nome} />
          </div>
          <div className="fp-campo">
            <label htmlFor="cm-email">E-mail</label>
            <div className="fp-controle">
              <input
                id="cm-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                aria-describedby="cm-email-erro"
                aria-invalid={erros.email ? true : undefined}
              />
            </div>
            <Erro id="cm-email-erro" texto={erros.email} />
          </div>
        </div>
        <div className="fp-campo">
          <label htmlFor="cm-assunto">Assunto</label>
          <div className="fp-controle fp-controle--select">
            <select
              id="cm-assunto"
              name="assunto"
              required
              defaultValue=""
              aria-describedby="cm-assunto-erro"
              aria-invalid={erros.assunto ? true : undefined}
            >
              <option value="" disabled>
                Selecione
              </option>
              {mensagem.assuntos.map((assunto) => (
                <option key={assunto.valor} value={assunto.valor}>
                  {assunto.rotulo}
                </option>
              ))}
            </select>
          </div>
          <Erro id="cm-assunto-erro" texto={erros.assunto} />
        </div>
        <div className="fp-campo">
          <label htmlFor="cm-mensagem">Mensagem</label>
          <div className="fp-controle">
            <textarea
              id="cm-mensagem"
              name="mensagem"
              rows={5}
              required
              maxLength={4000}
              aria-describedby="cm-mensagem-erro"
              aria-invalid={erros.mensagem ? true : undefined}
            />
          </div>
          <Erro id="cm-mensagem-erro" texto={erros.mensagem} />
        </div>
        <Turnstile
          key={chaveDoTurnstile}
          onToken={setToken}
          theme="light"
          className="fp-verificacao"
        />
        <div className="fp-acoes">
          <button className="botao" type="submit" disabled={enviando}>
            {enviando ? TEXTOS.enviando : mensagem.botao}
            <svg className="seta" aria-hidden="true">
              <use href="#seta" />
            </svg>
          </button>
          <p className="fp-status" role="status" aria-live="polite">
            {estado.fase === 'editando' ? estado.aviso : ''}
          </p>
        </div>
        {estado.fase === 'falha' ? (
          <div className="fp-falha" role="alert">
            <p className="fp-falha-titulo">{TEXTOS.falhaTitulo}</p>
            <p>{TEXTOS.falhaTexto}</p>
            <TelefonesDasUnidades uf="" />
            <div className="fp-acoes">
              <button className="botao" type="button" onClick={() => setEstado(EDITANDO)}>
                {TEXTOS.tentarDeNovo}
              </button>
            </div>
          </div>
        ) : null}
      </form>
      <div className="fp-sem-js">
        <p>{TEXTOS.semJs}</p>
        <TelefonesDasUnidades uf="" />
      </div>
    </>
  )
}
