'use client'

import { useEffect, useRef } from 'react'
import { Cabecalho, type TituloDoPainel, type Voltar } from '../Cabecalho'
import { registrarBoletoAberto } from '../medicao'
import { type EstadoSegundaVia, etapaVisivel } from './estado'
import { encerrarSegundaVia } from './respostas'
import { TelaBoleto } from './TelaBoleto'
import { TelaBoletos } from './TelaBoletos'
import { TelaCodigo } from './TelaCodigo'
import { TelaCpf } from './TelaCpf'
import { TelaExpirada, TelaFalha } from './TelaExpirada'
import { TelaUnidades } from './TelaUnidades'
import { TITULOS } from './textos'
import { type FluxoSegundaVia, useFluxoSegundaVia } from './useFluxoSegundaVia'

export { encerrarSegundaVia }

type Props = {
  titulo: TituloDoPainel
  /** Fecha a triagem (também usado pelos links que saem para o WhatsApp). */
  aoFechar: () => void
  aoVoltarAoMenu: () => void
}

/** Para onde o Voltar leva em cada tela; sem destino, não há botão. */
function voltarDe(
  { estado, despachar, ocupado }: Pick<FluxoSegundaVia, 'estado' | 'despachar' | 'ocupado'>,
  aoVoltarAoMenu: () => void,
): Voltar | undefined {
  const rotulo = 'Voltar'
  switch (estado.tela) {
    case 'cpf':
      // Com o pedido do código em voo, sair para o menu deixaria o desafio órfão.
      return { rotulo, desabilitado: ocupado, aoVoltar: aoVoltarAoMenu }
    case 'codigo':
    case 'boleto':
      return { rotulo, aoVoltar: () => despachar({ tipo: 'voltar' }) }
    case 'boletos':
      // Com uma unidade só, a escolha foi pulada: voltar ao código pediria outro.
      if (estado.unidades.length < 2) return undefined
      return { rotulo, aoVoltar: () => despachar({ tipo: 'voltar' }) }
    default:
      return undefined
  }
}

function IndicadorDeEtapa({ estado }: { estado: EstadoSegundaVia }) {
  const { atual, total } = etapaVisivel(estado)
  return (
    <div className="tr-etapa">
      <span>{`Etapa ${atual} de ${total}`}</span>
      <span className="tr-etapa-barra" aria-hidden="true">
        <span style={{ width: `${(atual / total) * 100}%` }} />
      </span>
    </div>
  )
}

/** As telas que vêm depois da lista: boletos, boleto, expirada e falha. */
function TelaDaConsulta({ fluxo, sair }: { fluxo: FluxoSegundaVia; sair: () => void }) {
  const { estado, despachar, acoes } = fluxo
  const { unidade, cobranca } = estado
  if (estado.tela === 'boletos' && unidade) {
    return (
      <TelaBoletos
        unidade={unidade}
        boletos={estado.boletos}
        cobrancaSumiu={fluxo.cobrancaSumiu}
        acoes={{
          sair,
          escolher: (ref) => despachar({ tipo: 'escolher_cobranca', ref }),
          reconsultar: () => despachar({ tipo: 'reconsultar' }),
        }}
      />
    )
  }
  if (estado.tela === 'boleto' && unidade && cobranca) {
    return (
      <TelaBoleto
        unidade={unidade}
        cobranca={cobranca}
        linkPronto={fluxo.linkPronto}
        acoes={{
          sair,
          aoAbrir: () => {
            acoes.abrirLink()
            registrarBoletoAberto(cobranca.vencida)
          },
          verOutro: () => despachar({ tipo: 'voltar' }),
        }}
      />
    )
  }
  if (estado.tela === 'expirada') return <TelaExpirada aoRecomecar={acoes.recomecar} />
  return <TelaFalha aoRecomecar={acoes.recomecar} aoSair={sair} />
}

/** A tela atual: CPF, código e unidade aqui; o resto em `TelaDaConsulta`. */
function TelaAtual({ fluxo, sair }: { fluxo: FluxoSegundaVia; sair: () => void }) {
  const { estado, ocupado, acoes } = fluxo
  switch (estado.tela) {
    case 'cpf':
      return (
        <TelaCpf erro={estado.erroCpf} ocupado={ocupado} aoSair={sair} aoEnviar={acoes.solicitar} />
      )
    case 'codigo':
      return (
        <TelaCodigo
          estado={estado}
          ocupado={ocupado}
          avisoDeReenvio={fluxo.avisoDeReenvio}
          acoes={{
            sair,
            confirmar: acoes.confirmar,
            reenviar: acoes.reenviar,
            recomecar: acoes.recomecar,
          }}
        />
      )
    case 'unidades':
      return (
        <TelaUnidades
          unidades={estado.unidades}
          aoEscolher={(ref) => fluxo.despachar({ tipo: 'escolher_unidade', ref })}
        />
      )
    default:
      return <TelaDaConsulta fluxo={fluxo} sair={sair} />
  }
}

/**
 * A 2ª via dentro da triagem (variação B da spec): CPF → código → unidade →
 * boletos → boleto. Estado e chamadas em `useFluxoSegundaVia`; aqui ficam o
 * cabeçalho, a etapa, o foco no título e a tela atual.
 */
export function SegundaVia({ titulo, aoFechar, aoVoltarAoMenu }: Props) {
  const fluxo = useFluxoSegundaVia()
  const { estado } = fluxo

  // Título focado a cada troca de tela, para o leitor de tela anunciar onde a
  // pessoa está. A primeira tela já é focada pela triagem.
  const primeira = useRef(true)
  // biome-ignore lint/correctness/useExhaustiveDependencies: `estado.tela` é gatilho de re-execução
  useEffect(() => {
    if (primeira.current) {
      primeira.current = false
      return
    }
    titulo.ref.current?.focus()
  }, [estado.tela, titulo.ref])

  return (
    <>
      <Cabecalho
        texto={TITULOS[estado.tela]}
        titulo={titulo}
        voltar={voltarDe(fluxo, aoVoltarAoMenu)}
        aoFechar={aoFechar}
      >
        {estado.tela !== 'expirada' && <IndicadorDeEtapa estado={estado} />}
      </Cabecalho>
      <div className="tr-corpo">
        <TelaAtual fluxo={fluxo} sair={aoFechar} />
      </div>
    </>
  )
}
