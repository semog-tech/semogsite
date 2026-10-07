import * as Sentry from '@sentry/nextjs'
import type { Dispatch } from 'react'
import { encerrarConsulta } from '@/app/(frontend)/_actions/segunda-via'
import type {
  ResultadoCobrancas,
  ResultadoConfirmar,
  ResultadoLink,
  ResultadoReenviar,
  ResultadoSolicitar,
} from '@/lib/segundaVia/tipos'
import {
  type MotivoDaFalha,
  registrarCodigoValidado,
  registrarFalhaSegundaVia,
  registrarSegundaVia,
} from '../medicao'
import { type AcaoSegundaVia, boletosDa, type TelaSegundaVia } from './estado'

/**
 * O que fazer com cada resultado de Server Action: medir no GA4 (só classes)
 * e despachar ao redutor. Funções de módulo, sem estado: as telas as chamam
 * só com respostas da geração atual (`useChamadaUnica`), então cada evento
 * sai uma vez por ação.
 *
 * `desligada` (a flag caiu no meio do fluxo) vira `falhou`: a pessoa segue
 * pelo WhatsApp, como na fase 1.
 */

type Despachar = Dispatch<AcaoSegundaVia>

const MOTIVOS: Partial<Record<string, MotivoDaFalha>> = {
  limite: 'limite',
  expirado: 'expirado',
  bloqueado: 'bloqueado',
  indisponivel: 'indisponivel',
  desligada: 'indisponivel',
  sessao_invalida: 'sessao',
  referencia_invalida: 'sessao',
}

function medirFalha(etapa: TelaSegundaVia, tipo: string) {
  const motivo = MOTIVOS[tipo]
  if (motivo) registrarFalhaSegundaVia(etapa, motivo)
}

/** A action lançou (rede, deploy trocando o id da action): nunca tela em branco. */
export function aoFalharChamada(despachar: Despachar, etapa: TelaSegundaVia) {
  return (erro: unknown) => {
    console.error('[segunda-via] a Server Action falhou:', erro)
    Sentry.captureException(erro, { tags: { fluxo: 'segunda_via', etapa } })
    registrarFalhaSegundaVia(etapa, 'indisponivel')
    despachar({ tipo: 'falhou' })
  }
}

/** Fechar a triagem: os cookies saem e o app encerra a sessão. Falha só fica no log. */
export function encerrarSegundaVia() {
  encerrarConsulta().catch((erro: unknown) => {
    console.error('[segunda-via] encerrarConsulta falhou:', erro)
    Sentry.captureException(erro, { tags: { fluxo: 'segunda_via', etapa: 'encerrar' } })
  })
}

export function aoSolicitar(despachar: Despachar, r: ResultadoSolicitar) {
  medirFalha('cpf', r.tipo)
  if (r.tipo === 'desligada') return despachar({ tipo: 'falhou' })
  if (r.tipo === 'ok') registrarSegundaVia('solicitada')
  despachar({ tipo: 'solicitar_respondido', agora: Date.now(), resposta: r })
}

export function aoReenviar(despachar: Despachar, r: ResultadoReenviar) {
  medirFalha('codigo', r.tipo)
  if (r.tipo === 'desligada') return despachar({ tipo: 'falhou' })
  despachar({ tipo: 'reenviar_respondido', agora: Date.now(), resposta: r })
}

export function aoConfirmar(despachar: Despachar, r: ResultadoConfirmar) {
  medirFalha('codigo', r.tipo)
  if (r.tipo === 'desligada') return despachar({ tipo: 'falhou' })
  if (r.tipo === 'ok' && r.unidades.length > 0) {
    registrarCodigoValidado(r.unidades.length === 1 ? 'uma' : 'varias')
  }
  despachar({ tipo: 'confirmar_respondido', agora: Date.now(), resposta: r })
}

export function aoListar(despachar: Despachar, r: ResultadoCobrancas) {
  medirFalha('boletos', r.tipo)
  if (r.tipo === 'desligada') return despachar({ tipo: 'falhou' })
  if (r.tipo === 'ok') {
    const boletos = boletosDa(r)
    if (boletos.modo === 'so_restritas' || (boletos.modo === 'lista' && boletos.haRestritas)) {
      registrarSegundaVia('restrita')
    }
    if (boletos.modo === 'sem_boletos') registrarSegundaVia('sem_boleto')
    // ERP fora ou resposta incoerente: a pessoa vê "não conseguimos consultar".
    if (boletos.modo === 'nao_consultou') registrarFalhaSegundaVia('boletos', 'indisponivel')
  }
  despachar({ tipo: 'cobrancas_respondido', resposta: r })
}

/**
 * O link é credencial: no "ok" ele vai só para `guardarLink` (o `href` da aba
 * nova), nunca para o redutor, o log ou o GA4.
 */
export function aoPedirLink(
  despachar: Despachar,
  r: ResultadoLink,
  guardarLink: (url: string) => void,
) {
  if (r.tipo === 'ok') return guardarLink(r.url)
  medirFalha('boleto', r.tipo)
  if (r.tipo === 'desligada') return despachar({ tipo: 'falhou' })
  despachar({ tipo: 'link_respondido', resposta: r })
}
