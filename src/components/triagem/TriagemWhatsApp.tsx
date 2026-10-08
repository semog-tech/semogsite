'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { type CidadeDaLanding, cidadeDaLanding } from '@/lib/cidadeDaLanding'
import { Cabecalho } from './Cabecalho'
import { IconeFechar, IconeWhatsApp } from './icones'
import { registrarTriagemAberta } from './medicao'
import { PropostaRapidaForm } from './PropostaRapidaForm'
import { encerrarSegundaVia, SegundaVia } from './segunda-via/SegundaVia'
import { ConfirmacaoDaProposta, MenuDaTriagem } from './TelasDaTriagem'

/** Duração da animação de saída mais longa (folha do celular), em ms. */
const TEMPO_DE_SAIDA_MS = 220

/** `segunda-via` tem telas e títulos próprios (`SegundaVia`). */
type Tela = 'menu' | 'proposta' | 'confirmacao' | 'segunda-via'

const TITULOS: Record<Exclude<Tela, 'segunda-via'>, string> = {
  menu: 'Como podemos ajudar?',
  proposta: 'Peça sua proposta',
  confirmacao: 'Pedido recebido',
}

/**
 * Botão flutuante de WhatsApp com triagem. No HTML do servidor ele é o link
 * direto do WhatsApp (`whatsappHref`) — quem está sem JavaScript, ou clica
 * antes da hidratação, continua chegando à conversa. Depois de hidratar vira um
 * botão que abre o menu de três caminhos.
 *
 * O botão hidratado não é link, então não dispara evento de clique: quem conta
 * é o link escolhido lá dentro (`triagem_whatsapp_click`, com a seção do caminho).
 *
 * `segundaViaAtiva` vem de `SEGUNDA_VIA_ATIVA`, lida no servidor
 * (`WhatsAppFloat`). Desligada, "Sou cliente" é o WhatsApp da fase 1.
 */
export function TriagemWhatsApp({
  whatsappHref,
  segundaViaAtiva,
}: {
  whatsappHref: string
  segundaViaAtiva: boolean
}) {
  const [hidratado, setHidratado] = useState(false)
  useEffect(() => setHidratado(true), [])

  if (!hidratado) {
    return (
      <a className="wa-float" href={whatsappHref} target="_blank" rel="noopener">
        <IconeWhatsApp />
        <span className="sr-only">Falar com a Semog no WhatsApp</span>
      </a>
    )
  }
  return <Triagem segundaViaAtiva={segundaViaAtiva} />
}

/**
 * Abre e fecha o `<dialog>` com animação de saída: marca `data-fechando`, deixa
 * o CSS animar e só então chama `close()`. Quem pede movimento reduzido fecha
 * na hora. `Esc` (evento `cancel`) e clique no fundo passam pelo mesmo caminho.
 * O clique no fundo só conta se o gesto começou nele — arrastar uma seleção de
 * texto para fora do painel não fecha nada.
 */
function useDialogoAnimado(aoFechar: () => void) {
  const dialogoRef = useRef<HTMLDialogElement>(null)
  const saida = useRef<number | null>(null)

  const fecharJa = useCallback(() => {
    if (saida.current !== null) window.clearTimeout(saida.current)
    saida.current = null
    const dialogo = dialogoRef.current
    if (!dialogo) return
    delete dialogo.dataset.fechando
    if (dialogo.open) dialogo.close()
  }, [])

  const fechar = useCallback(() => {
    const dialogo = dialogoRef.current
    if (!dialogo?.open || saida.current !== null) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      fecharJa()
      return
    }
    dialogo.dataset.fechando = ''
    saida.current = window.setTimeout(fecharJa, TEMPO_DE_SAIDA_MS)
  }, [fecharJa])

  const abrir = useCallback(() => {
    const dialogo = dialogoRef.current
    if (!dialogo) return
    if (saida.current !== null) fecharJa()
    if (!dialogo.open) dialogo.showModal()
  }, [fecharJa])

  useEffect(() => {
    const dialogo = dialogoRef.current
    if (!dialogo) return
    let comecouNoFundo = false
    const aoPressionar = (e: PointerEvent) => {
      comecouNoFundo = e.target === dialogo
    }
    const aoClicar = (e: MouseEvent) => {
      if (e.target === dialogo && comecouNoFundo) fechar()
      comecouNoFundo = false
    }
    const aoCancelar = (e: Event) => {
      e.preventDefault()
      fechar()
    }
    dialogo.addEventListener('pointerdown', aoPressionar)
    dialogo.addEventListener('click', aoClicar)
    dialogo.addEventListener('cancel', aoCancelar)
    dialogo.addEventListener('close', aoFechar)
    return () => {
      dialogo.removeEventListener('pointerdown', aoPressionar)
      dialogo.removeEventListener('click', aoClicar)
      dialogo.removeEventListener('cancel', aoCancelar)
      dialogo.removeEventListener('close', aoFechar)
    }
  }, [fechar, aoFechar])

  // Desmontar com o diálogo aberto (troca de layout) não pode deixar a página
  // travada nem um timer órfão.
  useEffect(() => () => fecharJa(), [fecharJa])

  return { dialogoRef, abrir, fechar }
}

/** A triagem hidratada: o botão e o diálogo, com a troca de telas. */
function Triagem({ segundaViaAtiva }: { segundaViaAtiva: boolean }) {
  const tituloId = useId()
  const botaoRef = useRef<HTMLButtonElement>(null)
  const tituloRef = useRef<HTMLHeadingElement>(null)
  const primeiraOpcao = useRef(true)

  const [aberto, setAberto] = useState(false)
  const [tela, setTela] = useState<Tela>('menu')
  const [protocolo, setProtocolo] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [cidade, setCidade] = useState<CidadeDaLanding | undefined>(undefined)
  // Entrou na 2ª via desde que abriu: ao fechar, a consulta é encerrada.
  const usouSegundaVia = useRef(false)

  const aoFechar = useCallback(() => {
    if (usouSegundaVia.current) {
      usouSegundaVia.current = false
      encerrarSegundaVia()
    }
    document.documentElement.classList.remove('tr-travado')
    setAberto(false)
    setTela('menu')
    setProtocolo(null)
    setEnviando(false)
    botaoRef.current?.focus()
  }, [])

  const { dialogoRef, abrir, fechar } = useDialogoAnimado(aoFechar)
  useEffect(() => () => document.documentElement.classList.remove('tr-travado'), [])

  function abrirTriagem() {
    if (aberto) {
      fechar()
      return
    }
    // A cidade é lida na abertura, e não na montagem: o botão é global e
    // sobrevive à navegação entre páginas. Ela pré-seleciona a proposta e
    // decide a ordem do menu (landing de cidade: proposta primeiro).
    setCidade(cidadeDaLanding(window.location.pathname))
    primeiraOpcao.current = true
    setTela('menu')
    setAberto(true)
    document.documentElement.classList.add('tr-travado')
    abrir()
    registrarTriagemAberta()
  }

  // Foco: ao abrir, na primeira opção do menu; a cada troca de tela, no título,
  // para o leitor de tela anunciar onde a pessoa está. `tela` é gatilho de
  // re-execução, não um valor lido aqui dentro.
  // biome-ignore lint/correctness/useExhaustiveDependencies: gatilho de re-execução, ver acima
  useEffect(() => {
    if (!aberto) return
    if (primeiraOpcao.current) {
      primeiraOpcao.current = false
      dialogoRef.current?.querySelector<HTMLElement>('.tr-opcao')?.focus()
      return
    }
    tituloRef.current?.focus()
  }, [aberto, tela, dialogoRef])

  const aoMudarEnvio = useCallback((valor: boolean) => setEnviando(valor), [])
  const aoEnviar = useCallback((novo: string) => {
    setProtocolo(novo)
    setTela('confirmacao')
  }, [])
  const irParaSegundaVia = useCallback(() => {
    usouSegundaVia.current = true
    setTela('segunda-via')
  }, [])
  const voltarAoMenu = useCallback(() => setTela('menu'), [])
  const titulo = { id: tituloId, ref: tituloRef }

  return (
    <>
      <button
        ref={botaoRef}
        type="button"
        className="wa-float"
        aria-haspopup="dialog"
        aria-expanded={aberto}
        onClick={abrirTriagem}
      >
        <IconeWhatsApp className="wa-float-icone" />
        <IconeFechar className="wa-float-fechar" />
        <span className="sr-only">Falar com a Semog</span>
      </button>

      <dialog
        ref={dialogoRef}
        className={tela === 'segunda-via' ? 'triagem triagem-painel--expandido' : 'triagem'}
        aria-labelledby={tituloId}
        data-lenis-prevent
        data-clarity-mask="true"
      >
        <div className="tr-painel sec-light">
          {tela === 'segunda-via' ? (
            <SegundaVia titulo={titulo} aoFechar={fechar} aoVoltarAoMenu={voltarAoMenu} />
          ) : (
            <Cabecalho
              texto={TITULOS[tela]}
              titulo={titulo}
              voltar={
                tela === 'proposta'
                  ? { rotulo: 'Voltar às opções', desabilitado: enviando, aoVoltar: voltarAoMenu }
                  : undefined
              }
              aoFechar={fechar}
            />
          )}

          <div className="tr-corpo" hidden={tela === 'segunda-via'}>
            {tela === 'menu' && (
              <MenuDaTriagem
                aoEscolherProposta={() => setTela('proposta')}
                aoEscolherSegundaVia={segundaViaAtiva ? irParaSegundaVia : undefined}
                aoSair={fechar}
                propostaPrimeiro={cidade !== undefined}
              />
            )}
            {tela === 'proposta' && (
              <>
                <p className="tr-lead">
                  Um consultor da Semog fala com você pelo WhatsApp em até 24 horas úteis.
                </p>
                <PropostaRapidaForm
                  cidadeDaPagina={cidade}
                  aoEnviar={aoEnviar}
                  aoMudarEnvio={aoMudarEnvio}
                />
              </>
            )}
            {tela === 'confirmacao' && protocolo && (
              <ConfirmacaoDaProposta protocolo={protocolo} aoFechar={fechar} />
            )}
          </div>
        </div>
      </dialog>
    </>
  )
}
