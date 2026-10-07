'use client'

import type { CobrancaPublica, UnidadePublica } from '@/lib/segundaVia/tipos'
import { LinkDoCliente } from './LinksDeWhatsApp'
import { Situacao } from './TelaBoletos'
import {
  AVISO_DE_NAO_ENCAMINHAR,
  dataBrasileira,
  EXPLICACAO_DO_VENCIDO,
  rotuloDaUnidade,
  valorEmReais,
} from './textos'

type Props = {
  unidade: UnidadePublica
  cobranca: CobrancaPublica
  /**
   * Link da Superlógica pedido ao servidor ao escolher o boleto. É credencial:
   * vive só neste `href`, nunca no estado das telas, em log ou no GA4.
   * `null` enquanto o servidor responde.
   */
  link: string | null
  acoes: { aoAbrir: () => void; verOutro: () => void; sair: () => void }
}

/**
 * Seu boleto: resumo, "Abrir boleto" (aba nova, sem `opener` nem referrer) e
 * o aviso de não encaminhar junto do botão. O vencido explica em linguagem
 * simples que o original ainda é aceito, sem prometer valor.
 */
export function TelaBoleto({ unidade, cobranca, link, acoes }: Props) {
  return (
    <>
      <dl className="tr-resumo">
        <div>
          <dt>Unidade</dt>
          <dd>{rotuloDaUnidade(unidade)}</dd>
        </div>
        <div>
          <dt>Vencimento</dt>
          <dd>{dataBrasileira(cobranca.vencimento)}</dd>
        </div>
        <div>
          <dt>Valor de emissão</dt>
          <dd>{valorEmReais(cobranca.valorCentavos)}</dd>
        </div>
        <div>
          <dt>Situação</dt>
          <dd>
            <Situacao vencida={cobranca.vencida} />
          </dd>
        </div>
      </dl>
      {cobranca.vencida && <p className="tr-lead">{EXPLICACAO_DO_VENCIDO}</p>}
      <div className="tr-acoes">
        {link ? (
          <a
            className="tr-primario"
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={acoes.aoAbrir}
          >
            Abrir boleto
          </a>
        ) : (
          <button type="button" className="tr-primario" disabled aria-busy="true">
            <span className="tr-girando" aria-hidden="true" />
            Preparando o boleto…
          </button>
        )}
        <p className="tr-dica tr-aviso-link">{AVISO_DE_NAO_ENCAMINHAR}</p>
        <button type="button" className="tr-secundario" onClick={acoes.verOutro}>
          Ver outro boleto
        </button>
      </div>
      <p className="tr-alternativa">
        Ainda precisa de ajuda? <LinkDoCliente aoSair={acoes.sair}>Fale no WhatsApp</LinkDoCliente>
      </p>
    </>
  )
}
