'use client'

import type { ReactNode } from 'react'
import {
  ATRIBUTO_CAMINHO,
  type CaminhoDoWhatsApp,
  linkWhatsApp,
  MENSAGEM_COBRANCAS_RESTRITAS,
  MENSAGEM_DO_CLIENTE,
  MENSAGEM_SEM_ACESSO_AO_EMAIL,
} from '@/lib/triagem'

type Props = {
  children: ReactNode
  /** Fecha a triagem: a conversa continua no WhatsApp. */
  aoSair: () => void
  className?: string
}

/**
 * Links de WhatsApp da 2ª via. Todos levam `data-wa-caminho`, então o
 * `LeadClickTracker` mede pela seção do caminho e não troca a mensagem.
 */
function LinkWhatsApp({
  mensagem,
  caminho,
  children,
  aoSair,
  className,
}: Props & { mensagem: string; caminho: CaminhoDoWhatsApp }) {
  return (
    <a
      className={className}
      href={linkWhatsApp(mensagem)}
      target="_blank"
      rel="noopener"
      {...{ [ATRIBUTO_CAMINHO]: caminho }}
      onClick={aoSair}
    >
      {children}
    </a>
  )
}

/** "Sou cliente e quero a segunda via": CPF, sem boleto, falha. */
export function LinkDoCliente(props: Props) {
  return <LinkWhatsApp mensagem={MENSAGEM_DO_CLIENTE} caminho="cliente" {...props} />
}

export function LinkSemAcessoAoEmail(props: Props) {
  return <LinkWhatsApp mensagem={MENSAGEM_SEM_ACESSO_AO_EMAIL} caminho="cliente" {...props} />
}

export function LinkCobrancasRestritas(props: Props) {
  return <LinkWhatsApp mensagem={MENSAGEM_COBRANCAS_RESTRITAS} caminho="restrita" {...props} />
}
