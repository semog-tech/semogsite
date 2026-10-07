'use client'

import { type FormEvent, useId, useState } from 'react'
import { Field } from '@/components/forms/Field'
import { Turnstile } from '@/components/forms/Turnstile'
import { cpfValido, mascararCpf, somenteDigitos } from '@/lib/cpf'
import type { ErroCpf } from './estado'
import { LinkDoCliente } from './LinksDeWhatsApp'
import { mensagemDoErroCpf } from './textos'

type Props = {
  /** Recusa que veio do servidor (CPF inválido, anti-robô, limite). */
  erro: ErroCpf | null
  ocupado: boolean
  aoEnviar: (cpf: string, tokenAntiRobo: string) => void
  aoSair: () => void
}

type ErroLocal = 'vazio' | 'invalido' | 'anti_robo'

/**
 * Etapa 1: CPF e Turnstile. O CPF vive só no campo: não vai ao estado das
 * telas e some ao trocar de tela. A validação local (vazio, dígito
 * verificador, anti-robô) evita gastar uma chamada; o servidor confere de novo.
 */
export function TelaCpf({ erro, ocupado, aoEnviar, aoSair }: Props) {
  const id = useId()
  const lgpdId = `${id}-lgpd`
  const [cpf, setCpf] = useState('')
  const [token, setToken] = useState<string | null>(null)
  const [turnstileKey, setTurnstileKey] = useState(0)
  const [erroLocal, setErroLocal] = useState<ErroLocal | null>(null)

  function enviar(e: FormEvent) {
    e.preventDefault()
    if (ocupado) return
    if (!somenteDigitos(cpf)) return setErroLocal('vazio')
    if (!cpfValido(cpf)) return setErroLocal('invalido')
    if (!token) return setErroLocal('anti_robo')
    setErroLocal(null)
    aoEnviar(somenteDigitos(cpf), token)
    // O token do Turnstile vale uma vez só: a próxima tentativa pede outro.
    setToken(null)
    setTurnstileKey((k) => k + 1)
  }

  const erroServidor = ocupado || erroLocal ? null : erro
  const erroDoCampo =
    erroLocal === 'vazio'
      ? 'Informe seu CPF.'
      : erroLocal === 'invalido' || erroServidor?.tipo === 'entrada_invalida'
        ? 'Informe um CPF válido.'
        : undefined
  const erroGeral =
    erroLocal === 'anti_robo'
      ? 'Confirme a verificação anti-robô.'
      : erroServidor && erroServidor.tipo !== 'entrada_invalida'
        ? mensagemDoErroCpf(erroServidor)
        : null

  return (
    <>
      <p className="tr-lead">Informe o CPF cadastrado na unidade para ver os boletos em aberto.</p>
      <form onSubmit={enviar} noValidate aria-busy={ocupado}>
        <fieldset disabled={ocupado} className="m-0 flex flex-col gap-4 border-0 p-0">
          <Field
            id={`${id}-cpf`}
            label="CPF"
            inputMode="numeric"
            autoComplete="off"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={(e) => setCpf(mascararCpf(e.target.value))}
            error={erroDoCampo}
            aria-describedby={erroDoCampo ? `${lgpdId} ${id}-cpf-error` : lgpdId}
          />
          <p id={lgpdId} className="tr-dica">
            Usamos seu CPF só para localizar seu cadastro e enviar um código ao e-mail que já está
            nele. O site não guarda o CPF. A Semog trata esses dados para cumprir a administração do
            seu condomínio e para proteger o acesso ao boleto, e guarda um registro de segurança sem
            o CPF por até 180 dias. O boleto abre na página da Superlógica, que registra o acesso.
            Saiba mais na{' '}
            <a href="/privacidade" target="_blank" rel="noopener noreferrer">
              Política de Privacidade
            </a>
            .
          </p>
          <Turnstile key={turnstileKey} onToken={setToken} theme="dark" className="min-h-[65px]" />
          {erroGeral && (
            <p role="alert" className="tr-erro">
              {erroGeral}
            </p>
          )}
          <button type="submit" className="tr-primario">
            {ocupado && <span className="tr-girando" aria-hidden="true" />}
            {ocupado ? 'Verificando…' : 'Continuar'}
          </button>
        </fieldset>
      </form>
      <p className="tr-alternativa">
        <LinkDoCliente aoSair={aoSair}>Prefiro falar no WhatsApp</LinkDoCliente>
      </p>
    </>
  )
}
