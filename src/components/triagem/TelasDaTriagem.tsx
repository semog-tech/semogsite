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
}

/**
 * Menu da triagem (variação A da spec). Os dois caminhos de WhatsApp são links
 * de verdade, com `data-wa-caminho`: o `LeadClickTracker` mede o clique pela
 * seção do caminho e deixa a mensagem pronta como está.
 *
 * Fase 1: "Sou cliente" ainda é o WhatsApp com o pedido de segunda via. Na fase
 * 2 ele abre a consulta de boletos.
 */
export function MenuDaTriagem({ aoEscolherProposta, aoSair }: MenuProps) {
  return (
    <>
      <p className="tr-lead">Escolha o assunto para falar com a pessoa certa.</p>
      <ul className="tr-opcoes">
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
        <li>
          <button
            type="button"
            className="tr-opcao"
            onClick={() => {
              registrarCaminho('proposta')
              aoEscolherProposta()
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
      </ul>
    </>
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
