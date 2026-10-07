'use client'

import { type FormEvent, useEffect, useId, useState } from 'react'
import { Field } from '@/components/forms/Field'
import { type EstadoSegundaVia, segundosParaReenvio } from './estado'
import { LinkSemAcessoAoEmail } from './LinksDeWhatsApp'
import { mensagemDoErroCodigo, TEXTO_DO_CODIGO } from './textos'

type Props = {
  estado: EstadoSegundaVia
  ocupado: boolean
  /** "Enviamos um novo código…" depois de um reenvio aceito. */
  avisoDeReenvio: string | null
  acoes: {
    confirmar: (codigo: string) => void
    reenviar: () => void
    recomecar: () => void
    sair: () => void
  }
}

const TAMANHO = 6
const REENVIO_MAXIMO_EXIBIDO_S = 60

/** Relógio de parede que bate a cada segundo, para a contagem do reenvio. */
function useAgora(): number {
  const [agora, setAgora] = useState(() => Date.now())
  useEffect(() => {
    const t = window.setInterval(() => setAgora(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [])
  return agora
}

/**
 * Etapa 2: o código de 6 dígitos. O texto é sempre o mesmo, exista o CPF ou
 * não, e nunca mostra o e-mail. O campo fica só com dígitos, então colar
 * "123 456" ou "123-456" do e-mail funciona.
 */
export function TelaCodigo({ estado, ocupado, avisoDeReenvio, acoes }: Props) {
  const id = useId()
  const textoId = `${id}-texto`
  const agora = useAgora()
  const [codigo, setCodigo] = useState('')
  const [erroLocal, setErroLocal] = useState<string | null>(null)

  // Arredonda para não mostrar "61 s" logo depois do reenvio (o piso é 60 s).
  const espera = Math.min(segundosParaReenvio(estado, agora), REENVIO_MAXIMO_EXIBIDO_S)
  const erro = estado.erroCodigo
  // O código e a consulta expiram juntos: não há como pedir outro, só recomeçar.
  const expirado = erro?.tipo === 'expirado'
  // Expirado ou sem tentativas: não adianta tentar este código de novo.
  const semSaida =
    erro?.tipo === 'expirado' ||
    erro?.tipo === 'bloqueado' ||
    (erro?.tipo === 'incorreto' && erro.tentativasRestantes === 0)
  const mensagem = erroLocal ?? (erro && !ocupado ? mensagemDoErroCodigo(erro) : undefined)

  function confirmar(e: FormEvent) {
    e.preventDefault()
    if (ocupado) return
    if (codigo.length === 0) return setErroLocal('Informe o código de 6 dígitos.')
    if (codigo.length < TAMANHO) return setErroLocal('O código tem 6 dígitos.')
    setErroLocal(null)
    acoes.confirmar(codigo)
  }

  function reenviar() {
    setCodigo('')
    setErroLocal(null)
    acoes.reenviar()
  }

  return (
    <>
      <p id={textoId} className="tr-lead">
        {TEXTO_DO_CODIGO}
      </p>
      <form onSubmit={confirmar} noValidate aria-busy={ocupado}>
        <fieldset disabled={ocupado} className="m-0 flex flex-col gap-4 border-0 p-0">
          <Field
            id={`${id}-codigo`}
            className="tr-campo-codigo"
            label="Código"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, TAMANHO))}
            error={mensagem}
            aria-describedby={mensagem ? `${textoId} ${id}-codigo-error` : textoId}
          />
          {avisoDeReenvio && !mensagem && (
            <p role="status" className="tr-dica">
              {avisoDeReenvio}
            </p>
          )}
          {expirado && !ocupado ? (
            <button type="button" className="tr-primario" onClick={acoes.recomecar}>
              Começar de novo
            </button>
          ) : (
            <button type="submit" className="tr-primario" disabled={semSaida}>
              {ocupado && <span className="tr-girando" aria-hidden="true" />}
              {ocupado ? 'Verificando…' : 'Confirmar código'}
            </button>
          )}
        </fieldset>
      </form>
      <div className="tr-links">
        <button
          type="button"
          className="tr-link"
          disabled={ocupado || espera > 0}
          onClick={reenviar}
        >
          {espera > 0 ? `Reenviar código em ${espera} s` : 'Reenviar código'}
        </button>
        <LinkSemAcessoAoEmail className="tr-link" aoSair={acoes.sair}>
          Não tenho acesso a esse e-mail
        </LinkSemAcessoAoEmail>
      </div>
    </>
  )
}
