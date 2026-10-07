'use client'

import { IconeAviso, IconeWhatsApp } from '../icones'
import { LinkDoCliente } from './LinksDeWhatsApp'

/** Sessão encerrada depois do código (15 min, cookie ausente, referência estranha). */
export function TelaExpirada({ aoRecomecar }: { aoRecomecar: () => void }) {
  return (
    <div className="tr-ok">
      <div className="tr-ok-ico" aria-hidden="true">
        <IconeAviso />
      </div>
      <p>Por segurança, sua consulta expirou. Comece de novo.</p>
      <div className="tr-acoes">
        <button type="button" className="tr-primario" onClick={aoRecomecar}>
          Começar de novo
        </button>
      </div>
    </div>
  )
}

/**
 * App fora do ar, ERP sem resposta, ou a 2ª via desligada no meio do fluxo:
 * a pessoa segue pelo WhatsApp. Nunca uma lista vazia fingindo "sem boletos".
 */
export function TelaFalha({
  aoRecomecar,
  aoSair,
}: {
  aoRecomecar: () => void
  aoSair: () => void
}) {
  return (
    <div className="tr-ok">
      <div className="tr-ok-ico" aria-hidden="true">
        <IconeAviso />
      </div>
      <p>Não conseguimos consultar agora. Tente de novo em alguns minutos ou fale com a equipe.</p>
      <div className="tr-acoes">
        <LinkDoCliente className="tr-primario" aoSair={aoSair}>
          <IconeWhatsApp />
          Falar no WhatsApp
        </LinkDoCliente>
        <button type="button" className="tr-secundario" onClick={aoRecomecar}>
          Tentar de novo
        </button>
      </div>
    </div>
  )
}
