'use client'

import './sou-cliente.css'
import * as Sentry from '@sentry/nextjs'
import {
  lazy,
  type ReactNode,
  type RefObject,
  Suspense,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import { Cabecalho, type TituloDoPainel } from '@/components/triagem/Cabecalho'
import { IconeBoleto, IconeConversa, IconePredio, IconeSeta } from '@/components/triagem/icones'
import { LinkDeAtendimento, LinkDoCliente } from '@/components/triagem/segunda-via/LinksDeWhatsApp'
import { conteudo } from '@/site/conteudo/conteudo'
import { EVENTO_SOU_CLIENTE, lerPedido, type TelaInicial } from './eventos'
import { registrarSouClienteAberto } from './medicao'

/** A 2ª via só carrega quando alguém a escolhe: o resto do site não leva o código dela. */
const SegundaVia = lazy(() =>
  import('@/components/triagem/segunda-via/SegundaVia').then((modulo) => ({
    default: modulo.SegundaVia,
  })),
)

/** Ao fechar depois da 2ª via, a consulta é encerrada no servidor (como na triagem). */
function encerrarConsulta(): void {
  import('@/components/triagem/segunda-via/respostas')
    .then((modulo) => modulo.encerrarSegundaVia())
    .catch((erro: unknown) =>
      Sentry.captureException(erro, { tags: { origem: 'sou-cliente:encerrar' } }),
    )
}

/** Foca o título quando a 2ª via termina de carregar (o primeiro foco veio antes dela existir). */
function FocarAoMontar({ alvo }: { alvo: RefObject<HTMLElement | null> }) {
  useEffect(() => {
    alvo.current?.focus()
  }, [alvo])
  return null
}

function ConteudoDaOpcao({
  icone,
  titulo,
  texto,
}: {
  icone: ReactNode
  titulo: string
  texto: string
}) {
  return (
    <>
      <span className="tr-opcao-ico" aria-hidden="true">
        {icone}
      </span>
      <span className="tr-opcao-texto">
        <strong>{titulo}</strong>
        <span>{texto}</span>
      </span>
      <IconeSeta />
    </>
  )
}

const FOCAVEIS =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Tab preso no painel. O `showModal` deixa o resto da página inerte, mas o Chromium deixa o foco
 * sair do último controle para a barra do navegador; aqui ele volta ao primeiro (e Shift+Tab, do
 * primeiro, ao último), como o Firefox já faz.
 */
function prenderTab(dialogo: HTMLDialogElement, evento: KeyboardEvent): void {
  if (evento.key !== 'Tab') return
  const focaveis = Array.from(dialogo.querySelectorAll<HTMLElement>(FOCAVEIS))
  const primeiro = focaveis[0]
  const ultimo = focaveis[focaveis.length - 1]
  if (!primeiro || !ultimo) return
  const atual = document.activeElement
  const antes = (alvo: HTMLElement) =>
    atual instanceof Node &&
    Boolean(alvo.compareDocumentPosition(atual) & Node.DOCUMENT_POSITION_FOLLOWING)
  const nenhumDepois = !focaveis.some((alvo) => alvo !== atual && !antes(alvo))
  const nenhumAntes = !focaveis.some((alvo) => alvo !== atual && antes(alvo))
  if (!evento.shiftKey && nenhumDepois) {
    evento.preventDefault()
    primeiro.focus()
  } else if (evento.shiftKey && nenhumAntes) {
    evento.preventDefault()
    ultimo.focus()
  }
}

type PropsMenu = { segundaViaAtiva: boolean; aoEscolherSegundaVia: () => void; aoSair: () => void }

/** As três saídas: 2ª via (no site, ou pelo WhatsApp com ela desligada), atendimento e login. */
function MenuSouCliente({ segundaViaAtiva, aoEscolherSegundaVia, aoSair }: PropsMenu) {
  const t = conteudo.souCliente
  return (
    <>
      <p className="tr-lead">{t.lead}</p>
      <ul className="tr-opcoes">
        <li>
          {segundaViaAtiva ? (
            <button type="button" className="tr-opcao" onClick={aoEscolherSegundaVia}>
              <ConteudoDaOpcao
                icone={<IconeBoleto />}
                titulo={t.segundaVia.titulo}
                texto={t.segundaVia.texto}
              />
            </button>
          ) : (
            <LinkDoCliente className="tr-opcao" aoSair={aoSair}>
              <ConteudoDaOpcao
                icone={<IconeBoleto />}
                titulo={t.segundaViaPeloWhatsApp.titulo}
                texto={t.segundaViaPeloWhatsApp.texto}
              />
            </LinkDoCliente>
          )}
        </li>
        <li>
          <LinkDeAtendimento className="tr-opcao" aoSair={aoSair}>
            <ConteudoDaOpcao
              icone={<IconeConversa />}
              titulo={t.atendimento.titulo}
              texto={t.atendimento.texto}
            />
          </LinkDeAtendimento>
        </li>
        <li>
          <a className="tr-opcao" href={conteudo.marca.loginUrl}>
            <ConteudoDaOpcao icone={<IconePredio />} titulo={t.area.titulo} texto={t.area.texto} />
          </a>
        </li>
      </ul>
    </>
  )
}

/**
 * O painel "Sou cliente" (DP6): um `<dialog>` por página, aberto pelos gatilhos. Menu com a 2ª via
 * (o fluxo de hoje, com os três desfechos que terminam no WhatsApp), o atendimento ao condômino e
 * a área do cliente. Nenhum caminho de proposta. `segundaViaAtiva` vem de SEGUNDA_VIA_ATIVA, lida
 * no servidor pelo esqueleto (como no WhatsAppFloat).
 */
export function PainelSouCliente({ segundaViaAtiva }: { segundaViaAtiva: boolean }) {
  const tituloId = useId()
  const tituloRef = useRef<HTMLHeadingElement>(null)
  const dialogoRef = useRef<HTMLDialogElement>(null)
  const gatilhoRef = useRef<HTMLElement | null>(null)
  const usouSegundaVia = useRef(false)
  const [tela, setTela] = useState<TelaInicial>('menu')
  const [aberto, setAberto] = useState(false)

  const fechar = useCallback(() => dialogoRef.current?.close(), [])
  const irParaSegundaVia = useCallback(() => {
    usouSegundaVia.current = true
    setTela('segunda-via')
  }, [])
  const voltarAoMenu = useCallback(() => setTela('menu'), [])

  useEffect(() => {
    function aoPedir(evento: Event) {
      const pedido = lerPedido(evento)
      const dialogo = dialogoRef.current
      if (!pedido || !dialogo || dialogo.open) return
      const direto = pedido.tela === 'segunda-via' && segundaViaAtiva
      gatilhoRef.current = pedido.gatilho
      usouSegundaVia.current = direto
      setTela(direto ? 'segunda-via' : 'menu')
      setAberto(true)
      document.documentElement.classList.add('sc-travado')
      dialogo.showModal()
      registrarSouClienteAberto(pedido.origem)
    }
    window.addEventListener(EVENTO_SOU_CLIENTE, aoPedir)
    return () => window.removeEventListener(EVENTO_SOU_CLIENTE, aoPedir)
  }, [segundaViaAtiva])

  useEffect(() => {
    const dialogo = dialogoRef.current
    if (!dialogo) return
    let comecouNoFundo = false
    const aoPressionar = (evento: PointerEvent) => {
      comecouNoFundo = evento.target === dialogo
    }
    const aoClicar = (evento: MouseEvent) => {
      if (evento.target === dialogo && comecouNoFundo) dialogo.close()
      comecouNoFundo = false
    }
    const aoFechar = () => {
      if (usouSegundaVia.current) {
        usouSegundaVia.current = false
        encerrarConsulta()
      }
      document.documentElement.classList.remove('sc-travado')
      setAberto(false)
      setTela('menu')
      gatilhoRef.current?.focus()
      gatilhoRef.current = null
    }
    const aoTeclar = (evento: KeyboardEvent) => prenderTab(dialogo, evento)
    dialogo.addEventListener('keydown', aoTeclar)
    dialogo.addEventListener('pointerdown', aoPressionar)
    dialogo.addEventListener('click', aoClicar)
    dialogo.addEventListener('close', aoFechar)
    return () => {
      dialogo.removeEventListener('keydown', aoTeclar)
      dialogo.removeEventListener('pointerdown', aoPressionar)
      dialogo.removeEventListener('click', aoClicar)
      dialogo.removeEventListener('close', aoFechar)
      document.documentElement.classList.remove('sc-travado')
    }
  }, [])

  // Foco no título ao abrir e a cada troca de tela, para o leitor de tela anunciar onde está.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `tela` é gatilho de re-execução
  useEffect(() => {
    if (aberto) tituloRef.current?.focus()
  }, [aberto, tela])

  const titulo: TituloDoPainel = { id: tituloId, ref: tituloRef }
  return (
    <dialog
      ref={dialogoRef}
      className="sou-cliente"
      aria-labelledby={tituloId}
      data-lenis-prevent=""
      data-clarity-mask="true"
    >
      <div className="tr-painel">
        {aberto && tela === 'segunda-via' ? (
          // TEXTO-NOVO: aviso enquanto a 2ª via carrega
          <Suspense fallback={<p className="tr-corpo tr-carregando">Carregando…</p>}>
            <SegundaVia titulo={titulo} aoFechar={fechar} aoVoltarAoMenu={voltarAoMenu} />
            <FocarAoMontar alvo={tituloRef} />
          </Suspense>
        ) : (
          <>
            <Cabecalho texto={conteudo.souCliente.titulo} titulo={titulo} aoFechar={fechar} />
            <div className="tr-corpo">
              <MenuSouCliente
                segundaViaAtiva={segundaViaAtiva}
                aoEscolherSegundaVia={irParaSegundaVia}
                aoSair={fechar}
              />
            </div>
          </>
        )}
      </div>
    </dialog>
  )
}
