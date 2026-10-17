'use client'

import type React from 'react'
import { useEffect, useState } from 'react'
import {
  ATRIBUTO_CAMINHO,
  linkWhatsApp,
  MENSAGEM_DE_ATENDIMENTO,
  MENSAGEM_DO_CLIENTE,
} from '@/lib/triagem'
import { type OrigemSouCliente, pedirSouCliente, type TelaInicial } from './eventos'

/**
 * Para onde o foco volta quando o painel fecha. Escolher "Sou cliente" no menu do celular fecha o
 * menu, e o botão dele some junto: o foco volta ao botão Menu.
 */
function paraOndeVoltar(botao: HTMLElement, origem: OrigemSouCliente): HTMLElement {
  if (origem !== 'menu') return botao
  return botao.closest('[data-cabecalho]')?.querySelector<HTMLElement>('[data-menu]') ?? botao
}

type PropsGatilho = {
  origem: OrigemSouCliente
  /** `segunda-via` abre direto a consulta (quando ligada); o padrão é o menu. */
  tela?: TelaInicial
  className?: string
  children: React.ReactNode
}

/**
 * Gatilho do "Sou cliente" (DP6 do plano da fase 4). No HTML do servidor, e até hidratar, é o link
 * do WhatsApp de cliente com `data-wa-caminho="cliente"`: sem JavaScript a pessoa chega ao
 * atendimento, e o LeadClickTracker mede o clique como atendimento (`triagem_whatsapp_click`),
 * nunca como lead. A mensagem é a de atendimento; só o gatilho que abre direto a 2ª via pede a
 * 2ª via. Hidratado, vira botão que abre o painel (sem href: não há clique de WhatsApp).
 */
export function GatilhoSouCliente({ origem, tela = 'menu', className, children }: PropsGatilho) {
  const [hidratado, setHidratado] = useState(false)
  useEffect(() => setHidratado(true), [])
  if (!hidratado) {
    const mensagem = tela === 'segunda-via' ? MENSAGEM_DO_CLIENTE : MENSAGEM_DE_ATENDIMENTO
    return (
      <a
        className={className}
        href={linkWhatsApp(mensagem)}
        target="_blank"
        rel="noopener"
        {...{ [ATRIBUTO_CAMINHO]: 'cliente' }}
      >
        {children}
      </a>
    )
  }
  return (
    <button
      type="button"
      className={className}
      aria-haspopup="dialog"
      onClick={(evento) =>
        pedirSouCliente({ origem, tela, gatilho: paraOndeVoltar(evento.currentTarget, origem) })
      }
    >
      {children}
    </button>
  )
}
