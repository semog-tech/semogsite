'use client'

import './formulario-proposta.css'
import { useGSAP } from '@gsap/react'
import { type FormEvent, type RefObject, useEffect, useRef, useState } from 'react'
import { Turnstile } from '@/components/forms/Turnstile'
import { PERFIS } from '@/lib/propostaDuasEtapas/schema'
import { conteudo } from '@/site/conteudo/conteudo'
import { CamposDaEtapa1, CamposDaEtapa2 } from './campos'
import { trocarEtapa } from './cortina'
import { FalhaDoEnvio, TelefonesDasUnidades } from './FalhaDoEnvio'
import { TEXTOS } from './textos'
import { type EstadoDoEnvio, useEnvioDaProposta } from './useEnvioDaProposta'

/**
 * Pedido de proposta em duas etapas (spec 4.1 e 4.2), no idioma visual do protótipo: as duas
 * etapas dividem a mesma célula e trocam por uma cortina reta. Estados novos: enviando, sucesso,
 * falha (telefone da Unidade + tentar de novo) e verificação (Turnstile quando o token sumiu).
 * Sem JS, mostra o aviso com os telefones (o Turnstile exige JS).
 */

type PropsFormulario = { id: string; ufInicial?: string }

function Seta() {
  return (
    <svg className="seta" aria-hidden="true">
      <use href="#seta" />
    </svg>
  )
}

function BotaoPrincipal({ enviando, texto }: { enviando: boolean; texto: string }) {
  return (
    <button className="botao" type="submit" disabled={enviando}>
      {enviando ? TEXTOS.enviando : texto} <Seta />
    </button>
  )
}

/**
 * Turnstile novo quando o servidor pede (`precisa_verificar`): token sumiu ou venceu. Fica abaixo
 * do status, fora das etapas, porque o texto do status diz "confirme a verificação abaixo".
 */
function Verificacao({ estado, aoToken }: { estado: EstadoDoEnvio; aoToken: (t: string) => void }) {
  if (!estado.verificar) return null
  return (
    <Turnstile
      key={estado.chaveVerificacao}
      onToken={aoToken}
      theme="light"
      className="fp-verificacao"
    />
  )
}

function PainelDeSucesso() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.focus()
  }, [])
  return (
    <div ref={ref} className="fp-sucesso" role="status" tabIndex={-1}>
      <p className="fp-sucesso-titulo">{TEXTOS.sucessoTitulo}</p>
      <p>{TEXTOS.sucessoTexto}</p>
    </div>
  )
}

/** Cortina entre as etapas; interrompe a anterior, foca o primeiro campo da que entra. */
function useCortina(formRef: RefObject<HTMLFormElement | null>, etapa: 1 | 2) {
  const ultima = useRef<1 | 2>(1)
  const transicao = useRef<ReturnType<typeof trocarEtapa> | null>(null)
  useGSAP(
    () => {
      const form = formRef.current
      const um = form?.querySelector<HTMLElement>('[data-etapa="1"]')
      const dois = form?.querySelector<HTMLElement>('[data-etapa="2"]')
      if (!form || !um || !dois || etapa === ultima.current) return
      const avancar = etapa === 2
      transicao.current?.progress(1)
      transicao.current = trocarEtapa(form, avancar ? um : dois, avancar ? dois : um, avancar)
      ultima.current = etapa
      const destino = avancar ? dois : um
      destino.querySelector<HTMLElement>('input, select')?.focus({ preventScroll: true })
    },
    { dependencies: [etapa], scope: formRef },
  )
}

/** `?perfil=construtora` pré-marca a etapa 2 (spec 4.1); valor fora da lista é ignorado. */
function usePerfilDaUrl(formRef: RefObject<HTMLFormElement | null>) {
  useEffect(() => {
    const perfil = new URLSearchParams(window.location.search).get('perfil')
    if (!perfil || !PERFIS.some((p) => p === perfil)) return
    const opcao = formRef.current?.querySelector<HTMLInputElement>(
      `input[name="perfil"][value="${perfil}"]`,
    )
    if (opcao) opcao.checked = true
  }, [formRef])
}

export function FormularioProposta({ id, ufInicial = '' }: PropsFormulario) {
  const formRef = useRef<HTMLFormElement>(null)
  const [uf, setUf] = useState(ufInicial)
  const [cidadeEscolha, setCidadeEscolha] = useState('')
  const envio = useEnvioDaProposta()
  const { estado } = envio
  useCortina(formRef, estado.etapa)
  usePerfilDaUrl(formRef)

  function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (estado.enviando) return
    if (estado.etapa === 1) envio.enviarDaEtapa1(evento.currentTarget)
    else envio.enviarDaEtapa2(evento.currentTarget)
  }

  function mudarUf(novaUf: string) {
    setUf(novaUf)
    setCidadeEscolha('')
  }

  return (
    <div className="fp-moldura">
      <form
        ref={formRef}
        className="formulario-proposta"
        noValidate
        onSubmit={aoEnviar}
        data-etapa-ativa={estado.etapa}
        aria-labelledby={`${id}-titulo`}
        aria-busy={estado.enviando || undefined}
        hidden={estado.concluido}
      >
        <p id={`${id}-titulo`} className="fp-titulo">
          {TEXTOS.titulo}
        </p>
        <div className="fp-etapas">
          <div className="fp-etapa" data-etapa="1" inert={estado.etapa !== 1}>
            <CamposDaEtapa1 id={id} erros={estado.erros} uf={{ valor: uf, aoMudar: mudarUf }} />
            {/* Some quando o servidor pede outra verificação: o widget de baixo a substitui. */}
            {estado.etapa1Gravada || estado.verificar ? null : (
              <Turnstile onToken={envio.guardarToken} theme="light" className="fp-verificacao" />
            )}
            <div className="fp-acoes">
              <BotaoPrincipal enviando={estado.enviando} texto={TEXTOS.continuar} />
            </div>
          </div>
          <div className="fp-etapa" data-etapa="2" inert={estado.etapa !== 2}>
            <CamposDaEtapa2
              id={id}
              erros={estado.erros}
              uf={uf}
              cidade={{ escolha: cidadeEscolha, aoEscolher: setCidadeEscolha }}
            />
            <div className="fp-acoes">
              <BotaoPrincipal enviando={estado.enviando} texto={conteudo.proposta.botao} />
              <button
                className="fp-voltar"
                type="button"
                onClick={envio.voltar}
                disabled={estado.enviando}
              >
                <Seta />
                <span>{TEXTOS.voltar}</span>
              </button>
              <p className="fp-indicador">{TEXTOS.indicador}</p>
            </div>
          </div>
        </div>
        <p className="fp-status" role="status" aria-live="polite">
          {estado.status}
        </p>
        <Verificacao estado={estado} aoToken={envio.continuarComToken} />
        {estado.falha ? (
          <FalhaDoEnvio uf={uf} enviando={estado.enviando} aoTentarDeNovo={envio.tentarDeNovo} />
        ) : null}
      </form>
      {estado.concluido ? <PainelDeSucesso /> : null}
      <div className="fp-sem-js">
        <p>{TEXTOS.semJs}</p>
        <TelefonesDasUnidades uf={ufInicial} />
      </div>
    </div>
  )
}
