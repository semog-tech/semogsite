'use client'

import type { CobrancaPublica, UnidadePublica } from '@/lib/segundaVia/tipos'
import { IconeAviso, IconeWhatsApp } from '../icones'
import type { BoletosDaUnidade } from './estado'
import { LinkCobrancasRestritas, LinkDoCliente } from './LinksDeWhatsApp'
import { dataBrasileira, NOTA_DE_ENCARGOS, rotuloDaUnidade, valorEmReais } from './textos'

type Props = {
  unidade: UnidadePublica
  boletos: BoletosDaUnidade
  /** A cobrança aberta deixou de estar disponível entre a lista e o clique. */
  cobrancaSumiu: boolean
  acoes: { escolher: (ref: string) => void; reconsultar: () => void; sair: () => void }
}

/**
 * Etapa final da lista: os boletos em aberto da unidade. "Carregando" e "não
 * conseguimos consultar" são estados próprios — dúvida nunca vira "sem
 * boletos". Sem competência (a consulta não a entrega) e com o valor de
 * emissão; o vencido traz a nota de encargos.
 */
export function TelaBoletos({ unidade, boletos, cobrancaSumiu, acoes }: Props) {
  return (
    <>
      <p className="tr-unidade-atual">
        Unidade: <strong>{rotuloDaUnidade(unidade)}</strong>
      </p>
      {cobrancaSumiu && (
        <p role="status" className="tr-dica tr-dica-destaque">
          Este boleto não está mais disponível. Mostramos a lista atualizada.
        </p>
      )}
      <ConteudoDosBoletos boletos={boletos} acoes={acoes} />
    </>
  )
}

function ConteudoDosBoletos({ boletos, acoes }: Pick<Props, 'boletos' | 'acoes'>) {
  switch (boletos.modo) {
    case 'carregando':
      return (
        <p className="tr-carregando" role="status">
          <span className="tr-girando" aria-hidden="true" />
          Consultando os boletos…
        </p>
      )
    case 'lista':
      return (
        <>
          {boletos.haRestritas && <AvisoDeRestritas aoSair={acoes.sair} />}
          <ListaDeBoletos cobrancas={boletos.cobrancas} aoEscolher={acoes.escolher} />
        </>
      )
    case 'so_restritas':
      return <AvisoDeRestritas aoSair={acoes.sair} />
    case 'sem_boletos':
      return (
        <div className="tr-vazio">
          <p>Não encontramos boletos em aberto para esta unidade.</p>
          <p>
            Isso não é uma declaração de quitação. Para confirmar a situação da unidade, fale com a
            equipe.
          </p>
          <LinkDoCliente className="tr-secundario tr-link-botao" aoSair={acoes.sair}>
            Falar no WhatsApp
          </LinkDoCliente>
        </div>
      )
    case 'nao_consultou':
      return (
        <div className="tr-vazio">
          <p>
            Não conseguimos consultar os boletos agora. Tente de novo em alguns minutos ou fale com
            a equipe.
          </p>
          <div className="tr-acoes">
            <button type="button" className="tr-secundario" onClick={acoes.reconsultar}>
              Tentar de novo
            </button>
            <LinkDoCliente className="tr-secundario tr-link-botao" aoSair={acoes.sair}>
              Falar no WhatsApp
            </LinkDoCliente>
          </div>
        </div>
      )
  }
}

function AvisoDeRestritas({ aoSair }: { aoSair: () => void }) {
  return (
    <div className="tr-aviso-restrita" role="note">
      <IconeAviso />
      <div>
        <p>Há cobranças desta unidade que precisam ser tratadas com a equipe.</p>
        <LinkCobrancasRestritas aoSair={aoSair}>
          <IconeWhatsApp />
          Falar com a equipe no WhatsApp
        </LinkCobrancasRestritas>
      </div>
    </div>
  )
}

function ListaDeBoletos({
  cobrancas,
  aoEscolher,
}: {
  cobrancas: CobrancaPublica[]
  aoEscolher: (ref: string) => void
}) {
  return (
    <ul className="tr-opcoes" aria-label="Boletos em aberto">
      {cobrancas.map((c) => (
        <li key={c.ref}>
          <button type="button" className="tr-opcao tr-boleto" onClick={() => aoEscolher(c.ref)}>
            <span className="tr-opcao-texto">
              <strong>{`Vence em ${dataBrasileira(c.vencimento)}`}</strong>
              {c.vencida && <span>{NOTA_DE_ENCARGOS}</span>}
            </span>
            <span className="tr-boleto-valor">
              <strong>{valorEmReais(c.valorCentavos)}</strong>
              <Situacao vencida={c.vencida} />
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

export function Situacao({ vencida }: { vencida: boolean }) {
  return (
    <span className="tr-situacao" data-situacao={vencida ? 'vencido' : 'a-vencer'}>
      {vencida ? 'Vencido' : 'A vencer'}
    </span>
  )
}
