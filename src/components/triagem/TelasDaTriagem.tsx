'use client'

import {
  ATRIBUTO_CAMINHO,
  LINK_AREA_DO_CLIENTE,
  linkWhatsApp,
  MENSAGEM_DE_OUTRO_ASSUNTO,
  MENSAGEM_DO_CLIENTE,
  mensagemDaProposta,
} from '@/lib/triagem'
import {
  IconeBoleto,
  IconeConfirmado,
  IconeConversa,
  IconePredio,
  IconeSeta,
  IconeWhatsApp,
} from './icones'
import { registrarCaminho } from './medicao'

type MenuProps = {
  aoEscolherProposta: () => void
  /** Chamado depois do clique num link que sai da triagem (WhatsApp). */
  aoSair: () => void
  /**
   * `true` nas landings de cidade: quem chega ali veio buscar administradora,
   * então a proposta vem primeiro. Nas demais páginas (a home inclusive) quem
   * mais usa o botão é cliente, e o caminho de cliente vem primeiro.
   */
  propostaPrimeiro: boolean
}

/**
 * Menu da triagem (variação A da spec). Os dois caminhos de WhatsApp são links
 * de verdade, com `data-wa-caminho`: o `LeadClickTracker` mede o clique pela
 * seção do caminho e deixa a mensagem pronta como está.
 *
 * Só a ordem das duas primeiras opções muda com a página; "Outro assunto" é
 * sempre a última, e o atalho do portal anda sempre junto da opção de cliente.
 *
 * Fase 1: "Sou cliente" ainda é o WhatsApp com o pedido de segunda via. Na fase
 * 2 ele abre a consulta de boletos.
 */
export function MenuDaTriagem({ aoEscolherProposta, aoSair, propostaPrimeiro }: MenuProps) {
  const cliente = <OpcaoCliente key="cliente" aoSair={aoSair} />
  const proposta = <OpcaoProposta key="proposta" aoEscolher={aoEscolherProposta} />
  return (
    <>
      <p className="tr-lead">Escolha o assunto para falar com a pessoa certa.</p>
      <ul className="tr-opcoes">
        {propostaPrimeiro ? [proposta, cliente] : [cliente, proposta]}
        <OpcaoOutroAssunto aoSair={aoSair} />
      </ul>
    </>
  )
}

/** "Sou cliente", com o atalho do portal logo abaixo. */
function OpcaoCliente({ aoSair }: { aoSair: () => void }) {
  return (
    <li>
      <a
        className="tr-opcao"
        href={linkWhatsApp(MENSAGEM_DO_CLIENTE)}
        target="_blank"
        rel="noopener"
        {...{ [ATRIBUTO_CAMINHO]: 'cliente' }}
        onClick={() => {
          registrarCaminho('cliente')
          aoSair()
        }}
      >
        <span className="tr-opcao-ico" aria-hidden="true">
          <IconeBoleto />
        </span>
        <span className="tr-opcao-texto">
          <strong>Sou cliente: 2ª via e atendimento</strong>
          <span>Boletos em aberto da sua unidade, ou atendimento</span>
        </span>
        <IconeSeta />
      </a>
      <p className="tr-portal">
        Prefere o portal?{' '}
        <a
          href={LINK_AREA_DO_CLIENTE}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => registrarCaminho('portal')}
        >
          Acessar a área do cliente
        </a>
      </p>
    </li>
  )
}

function OpcaoProposta({ aoEscolher }: { aoEscolher: () => void }) {
  return (
    <li>
      <button
        type="button"
        className="tr-opcao"
        onClick={() => {
          registrarCaminho('proposta')
          aoEscolher()
        }}
      >
        <span className="tr-opcao-ico" aria-hidden="true">
          <IconePredio />
        </span>
        <span className="tr-opcao-texto">
          <strong>Quero uma proposta para meu condomínio</strong>
          <span>Deixe seus dados e um consultor fala com você</span>
        </span>
        <IconeSeta />
      </button>
    </li>
  )
}

function OpcaoOutroAssunto({ aoSair }: { aoSair: () => void }) {
  return (
    <li>
      <a
        className="tr-opcao"
        href={linkWhatsApp(MENSAGEM_DE_OUTRO_ASSUNTO)}
        target="_blank"
        rel="noopener"
        {...{ [ATRIBUTO_CAMINHO]: 'outro' }}
        onClick={() => {
          registrarCaminho('outro')
          aoSair()
        }}
      >
        <span className="tr-opcao-ico" aria-hidden="true">
          <IconeConversa />
        </span>
        <span className="tr-opcao-texto">
          <strong>Outro assunto</strong>
          <span>Fale com a equipe pelo WhatsApp</span>
        </span>
        <IconeSeta />
      </a>
    </li>
  )
}

type ConfirmacaoProps = {
  protocolo: string
  aoFechar: () => void
}

/**
 * Pedido recebido. Só existe depois do `ok: true` da action — é ela que traz o
 * protocolo —, então o "Continuar no WhatsApp" nunca aparece para um lead que
 * não foi gravado.
 */
export function ConfirmacaoDaProposta({ protocolo, aoFechar }: ConfirmacaoProps) {
  return (
    <div className="tr-ok">
      <div className="tr-ok-ico" aria-hidden="true">
        <IconeConfirmado />
      </div>
      <p>Um consultor da Semog vai falar com você pelo WhatsApp em até 24 horas úteis.</p>
      <p className="tr-protocolo">
        Protocolo <strong>{protocolo}</strong>
      </p>
      <div className="tr-acoes">
        <a
          className="tr-primario"
          href={linkWhatsApp(mensagemDaProposta(protocolo))}
          target="_blank"
          rel="noopener"
          {...{ [ATRIBUTO_CAMINHO]: 'proposta' }}
          onClick={aoFechar}
        >
          <IconeWhatsApp />
          Continuar no WhatsApp
        </a>
        <button type="button" className="tr-secundario" onClick={aoFechar}>
          Fechar
        </button>
      </div>
    </div>
  )
}
