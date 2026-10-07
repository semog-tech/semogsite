'use client'

import { type Dispatch, useEffect, useReducer, useRef, useState } from 'react'
import {
  abrirBoleto,
  confirmarCodigo,
  listarCobrancas,
  reenviarCodigo,
  solicitarCodigo,
} from '@/app/(frontend)/_actions/segunda-via'
import { Cabecalho, type TituloDoPainel, type Voltar } from '../Cabecalho'
import { registrarBoletoAberto } from '../medicao'
import {
  type AcaoSegundaVia,
  type EstadoSegundaVia,
  estadoInicial,
  etapaVisivel,
  reduzirSegundaVia,
} from './estado'
import {
  aoConfirmar,
  aoFalharChamada,
  aoListar,
  aoPedirLink,
  aoReenviar,
  aoSolicitar,
  encerrarSegundaVia,
} from './respostas'
import { TelaBoleto } from './TelaBoleto'
import { TelaBoletos } from './TelaBoletos'
import { TelaCodigo } from './TelaCodigo'
import { TelaCpf } from './TelaCpf'
import { TelaExpirada, TelaFalha } from './TelaExpirada'
import { TelaUnidades } from './TelaUnidades'
import { TITULOS } from './textos'
import { useChamadaUnica } from './useChamadaUnica'

export { encerrarSegundaVia }

const AVISO_DE_REENVIO =
  'Se este CPF tiver cadastro, enviamos um novo código. O código anterior deixou de valer.'

type Props = {
  titulo: TituloDoPainel
  /** Fecha a triagem (também usado pelos links que saem para o WhatsApp). */
  aoFechar: () => void
  aoVoltarAoMenu: () => void
}

/** Para onde o Voltar leva em cada tela; sem destino, não há botão. */
function voltarDe(
  estado: EstadoSegundaVia,
  despachar: Dispatch<AcaoSegundaVia>,
  aoVoltarAoMenu: () => void,
): Voltar | undefined {
  const rotulo = 'Voltar'
  switch (estado.tela) {
    case 'cpf':
      return { rotulo, aoVoltar: aoVoltarAoMenu }
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

/**
 * A 2ª via dentro da triagem (variação B da spec): CPF → código → unidade →
 * boletos → boleto. O estado das telas vive aqui, no cliente; o CPF fica só no
 * campo, os tokens só nos cookies HttpOnly e o link do boleto só no `href`.
 *
 * Gravar ou apagar cookie numa Server Action faz o Next re-renderizar a página
 * no servidor, mas o estado de cliente dos componentes que continuam na árvore
 * é preservado (docs do Next, "Mutating data → Cookies"): a triagem continua
 * aberta na mesma tela.
 */
export function SegundaVia({ titulo, aoFechar, aoVoltarAoMenu }: Props) {
  const [estado, despachar] = useReducer(reduzirSegundaVia, estadoInicial)
  const [avisoDeReenvio, setAvisoDeReenvio] = useState<string | null>(null)
  const [link, setLink] = useState<{ cobranca: string; url: string } | null>(null)
  // O redutor apaga `avisoLink` quando a lista nova chega; o aviso precisa
  // ficar visível depois disso, até a pessoa sair da lista.
  const [cobrancaSumiu, setCobrancaSumiu] = useState(false)
  const { chamar, ocupado } = useChamadaUnica(estado.tela, encerrarSegundaVia)
  const falhou = aoFalharChamada(despachar, estado.tela)

  useEffect(() => {
    if (estado.avisoLink === 'cobranca_indisponivel') setCobrancaSumiu(true)
    else if (estado.tela !== 'boletos') setCobrancaSumiu(false)
  }, [estado.avisoLink, estado.tela])

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

  // A lista é pedida ao entrar em "boletos" e de novo sempre que volta a
  // "carregando" (Tentar de novo, ou a cobrança sumiu entre a lista e o clique).
  const unidadeRef = estado.unidade?.ref
  const carregando = estado.tela === 'boletos' && estado.boletos.modo === 'carregando'
  useEffect(() => {
    if (!carregando || !unidadeRef) return
    // `chamar` nunca rejeita: trata a falha por dentro.
    void chamar(() => listarCobrancas(unidadeRef), {
      aoResponder: (r) => aoListar(despachar, r),
      aoFalhar: aoFalharChamada(despachar, 'boletos'),
    })
  }, [carregando, unidadeRef, chamar])

  // O link é pedido ao escolher o boleto, para "Abrir boleto" ser um link de
  // verdade (aba nova sem bloqueio de pop-up). Sai da memória ao deixar a tela.
  const cobrancaRef = estado.tela === 'boleto' ? estado.cobranca?.ref : undefined
  useEffect(() => {
    setLink(null)
    if (!cobrancaRef || !unidadeRef) return
    void chamar(() => abrirBoleto(unidadeRef, cobrancaRef), {
      aoResponder: (r) =>
        aoPedirLink(despachar, r, (url) => setLink({ cobranca: cobrancaRef, url })),
      aoFalhar: aoFalharChamada(despachar, 'boleto'),
    })
  }, [cobrancaRef, unidadeRef, chamar])

  const sair = aoFechar
  const recomecar = () => {
    setAvisoDeReenvio(null)
    despachar({ tipo: 'recomecar' })
  }

  function corpo() {
    switch (estado.tela) {
      case 'cpf':
        return (
          <TelaCpf
            erro={estado.erroCpf}
            ocupado={ocupado}
            aoSair={sair}
            aoEnviar={(cpf, token) => {
              setAvisoDeReenvio(null)
              void chamar(() => solicitarCodigo(cpf, token), {
                aoResponder: (r) => aoSolicitar(despachar, r),
                aoFalhar: falhou,
              })
            }}
          />
        )
      case 'codigo':
        return (
          <TelaCodigo
            estado={estado}
            ocupado={ocupado}
            avisoDeReenvio={avisoDeReenvio}
            acoes={{
              sair,
              confirmar: (codigo) => {
                void chamar(() => confirmarCodigo(codigo), {
                  aoResponder: (r) => aoConfirmar(despachar, r),
                  aoFalhar: falhou,
                })
              },
              reenviar: () => {
                setAvisoDeReenvio(null)
                void chamar(() => reenviarCodigo(), {
                  aoResponder: (r) => {
                    if (r.tipo === 'ok') setAvisoDeReenvio(AVISO_DE_REENVIO)
                    aoReenviar(despachar, r)
                  },
                  aoFalhar: falhou,
                })
              },
            }}
          />
        )
      case 'unidades':
        return (
          <TelaUnidades
            unidades={estado.unidades}
            aoEscolher={(ref) => despachar({ tipo: 'escolher_unidade', ref })}
          />
        )
      case 'boletos':
        return (
          estado.unidade && (
            <TelaBoletos
              unidade={estado.unidade}
              boletos={estado.boletos}
              cobrancaSumiu={cobrancaSumiu}
              acoes={{
                sair,
                escolher: (ref) => despachar({ tipo: 'escolher_cobranca', ref }),
                reconsultar: () => despachar({ tipo: 'reconsultar' }),
              }}
            />
          )
        )
      case 'boleto': {
        const { unidade, cobranca } = estado
        if (!unidade || !cobranca) return null
        return (
          <TelaBoleto
            unidade={unidade}
            cobranca={cobranca}
            link={link?.cobranca === cobranca.ref ? link.url : null}
            acoes={{
              sair,
              aoAbrir: () => registrarBoletoAberto(cobranca.vencida),
              verOutro: () => despachar({ tipo: 'voltar' }),
            }}
          />
        )
      }
      case 'expirada':
        return <TelaExpirada aoRecomecar={recomecar} />
      case 'falha':
        return <TelaFalha aoRecomecar={recomecar} aoSair={sair} />
    }
  }

  return (
    <>
      <Cabecalho
        texto={TITULOS[estado.tela]}
        titulo={titulo}
        voltar={voltarDe(estado, despachar, aoVoltarAoMenu)}
        aoFechar={aoFechar}
      />
      {estado.tela !== 'expirada' && <IndicadorDeEtapa estado={estado} />}
      <div className="tr-corpo">{corpo()}</div>
    </>
  )
}
