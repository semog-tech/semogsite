import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import {
  abrirBoleto,
  confirmarCodigo,
  listarCobrancas,
  reenviarCodigo,
  solicitarCodigo,
} from '@/app/(frontend)/_actions/segunda-via'
import { estadoInicial, reduzirSegundaVia } from './estado'
import {
  aoConfirmar,
  aoFalharChamada,
  aoListar,
  aoPedirLink,
  aoReenviar,
  aoSolicitar,
  encerrarSegundaVia,
} from './respostas'
import { useChamadaUnica } from './useChamadaUnica'

/**
 * Contador das consultas abertas nesta aba. Uma resposta "ok" que chega com a
 * triagem já fechada pode ter gravado cookie: ela encerra a consulta, mas só se
 * nenhuma consulta nova começou desde então — senão apagaria os cookies dela.
 */
let ultimaConsulta = 0

/** Abre o boleto numa aba nova, sem `opener` nem referrer, a partir da memória. */
function abrirEmAbaNova(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

const AVISO_DE_REENVIO =
  'Se este CPF tiver cadastro, enviamos um novo código. O código anterior deixou de valer.'

/**
 * Estado e chamadas da 2ª via. O estado vive no cliente, num componente que
 * continua montado quando a Server Action grava cookie e o Next re-renderiza a
 * página (docs do Next, "Mutating data → Cookies": o estado de cliente é
 * preservado). O CPF fica só no campo, os tokens só nos cookies HttpOnly e o
 * link do boleto só aqui, na memória, enquanto a tela do boleto está aberta:
 * nunca no DOM, no redutor, em log ou no GA4.
 */
export function useFluxoSegundaVia() {
  const [estado, despachar] = useReducer(reduzirSegundaVia, estadoInicial)
  const [avisoDeReenvio, setAvisoDeReenvio] = useState<string | null>(null)
  const [link, setLink] = useState<{ cobranca: string; url: string } | null>(null)
  // O redutor apaga `avisoLink` quando a lista nova chega; o aviso precisa
  // ficar visível depois disso, até a pessoa sair da lista.
  const [cobrancaSumiu, setCobrancaSumiu] = useState(false)
  const consulta = useRef(0)
  useEffect(() => {
    ultimaConsulta += 1
    consulta.current = ultimaConsulta
  }, [])
  const encerrarSeForAUltima = useCallback(() => {
    if (consulta.current === ultimaConsulta) encerrarSegundaVia()
  }, [])
  const { chamar, ocupado } = useChamadaUnica(estado.tela, encerrarSeForAUltima)
  const falhou = aoFalharChamada(despachar, estado.tela)

  useEffect(() => {
    if (estado.avisoLink === 'cobranca_indisponivel') setCobrancaSumiu(true)
    else if (estado.tela !== 'boletos') setCobrancaSumiu(false)
  }, [estado.avisoLink, estado.tela])

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

  // O link é pedido ao escolher o boleto, para o clique em "Abrir boleto" já ter
  // a URL e abrir a aba nova (window.open) sem bloqueio de pop-up. Fica só na
  // memória, fora do DOM, e sai ao deixar a tela.
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

  const acoes = {
    solicitar: (cpf: string, token: string) => {
      setAvisoDeReenvio(null)
      void chamar(() => solicitarCodigo(cpf, token), {
        aoResponder: (r) => aoSolicitar(despachar, r),
        aoFalhar: falhou,
      })
    },
    confirmar: (codigo: string) => {
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
    recomecar: () => {
      setAvisoDeReenvio(null)
      despachar({ tipo: 'recomecar' })
    },
  }

  const linkDaTela = link && link.cobranca === estado.cobranca?.ref ? link.url : null
  const abrirLink = () => {
    if (linkDaTela) abrirEmAbaNova(linkDaTela)
  }
  return {
    estado,
    despachar,
    ocupado,
    avisoDeReenvio,
    cobrancaSumiu,
    linkPronto: linkDaTela !== null,
    acoes: { ...acoes, abrirLink },
  }
}

export type FluxoSegundaVia = ReturnType<typeof useFluxoSegundaVia>
