import * as Sentry from '@sentry/nextjs'
import { useCallback, useRef, useState } from 'react'
import {
  enviarEtapa1,
  enviarEtapa2,
  enviarPropostaCompleta,
} from '@/app/(site)/_actions/proposta-duas-etapas'
import { registrarLeadGerado, registrarLeadQualificado } from '@/lib/medicaoLead'
import type { ResultadoEtapa } from '@/lib/propostaDuasEtapas/resultado'
import {
  errosDaEtapa1,
  errosDaEtapa2,
  focarPrimeiroErro,
  lerEtapa1,
  lerEtapa2,
  ORDEM_ETAPA_1,
  ORDEM_ETAPA_2,
} from './leitura'
import { TEXTOS } from './textos'

/** Estado do envio das duas etapas e as chamadas às Server Actions (spec 4.2, R5, R6, R11). */

export type EstadoDoEnvio = {
  etapa: 1 | 2
  etapa1Gravada: boolean
  concluido: boolean
  enviando: boolean
  verificar: boolean
  chaveVerificacao: number
  falha: boolean
  erros: Record<string, string>
  status: string
}

export const ESTADO_INICIAL: EstadoDoEnvio = {
  etapa: 1,
  etapa1Gravada: false,
  concluido: false,
  enviando: false,
  verificar: false,
  chaveVerificacao: 0,
  falha: false,
  erros: {},
  status: '',
}

type Tentativa = {
  enviar: (turnstile: string | null) => Promise<ResultadoEtapa>
  medir: (resultado: ResultadoEtapa) => void
}

const FALHA_NA_CHAMADA: ResultadoEtapa = {
  ok: false,
  motivo: 'falha',
  mensagem: TEXTOS.falhaTitulo,
}

export function aplicarResultado(e: EstadoDoEnvio, r: ResultadoEtapa): EstadoDoEnvio {
  const base: EstadoDoEnvio = { ...e, enviando: false, falha: false, verificar: false }
  if (r.ok && r.etapa === 1)
    return { ...base, etapa: 2, etapa1Gravada: true, erros: {}, status: TEXTOS.etapa1Recebida }
  if (r.ok) return { ...base, concluido: true, erros: {}, status: '' }
  if (r.motivo === 'campos') return { ...base, erros: r.erros, status: '' }
  if (r.motivo === 'precisa_verificar') {
    return {
      ...base,
      verificar: true,
      chaveVerificacao: e.chaveVerificacao + 1,
      status: TEXTOS.precisaVerificar,
    }
  }
  if (r.motivo === 'recusado') return { ...base, status: r.mensagem }
  return { ...base, falha: true, status: '' }
}

/** A action pode lançar: rede caindo, ou deploy novo com a aba aberta (ID de Server Action trocado). */
async function chamar(tentativa: Tentativa, turnstile: string | null): Promise<ResultadoEtapa> {
  try {
    return await tentativa.enviar(turnstile)
  } catch (erro) {
    Sentry.captureException(erro, { tags: { form: 'proposta', variante: 'duas_etapas' } })
    return FALHA_NA_CHAMADA
  }
}

const temErro = (erros: Record<string, string>) => Object.keys(erros).length > 0

export function useEnvioDaProposta() {
  const [estado, setEstado] = useState<EstadoDoEnvio>(ESTADO_INICIAL)
  const tokenInicial = useRef<string | null>(null)
  const pendente = useRef<Tentativa | null>(null)
  const leadGerado = useRef(false)

  // Trava síncrona contra o duplo clique: o `enviando` do estado só chega na próxima renderização.
  const emVoo = useRef(false)

  const executar = useCallback(async (tentativa: Tentativa, turnstile: string | null) => {
    if (emVoo.current) return
    emVoo.current = true
    pendente.current = tentativa
    setEstado((e) => ({ ...e, enviando: true, falha: false }))
    const resultado = await chamar(tentativa, turnstile)
    emVoo.current = false
    tentativa.medir(resultado)
    setEstado((e) => aplicarResultado(e, resultado))
  }, [])

  // generate_lead uma vez por formulário aberto: voltar e reenviar a etapa 1 não conta de novo.
  const medirLeadGerado = useCallback((r: ResultadoEtapa) => {
    if (!r.ok || leadGerado.current) return
    leadGerado.current = true
    registrarLeadGerado('proposta', { variante: 'duas_etapas' })
  }, [])

  // Estáveis: o widget do Turnstile guarda o callback da primeira renderização.
  const guardarToken = useCallback((token: string) => {
    tokenInicial.current = token
  }, [])
  const continuarComToken = useCallback(
    (token: string) => {
      if (pendente.current) void executar(pendente.current, token)
    },
    [executar],
  )

  function recusarCampos(
    form: HTMLFormElement,
    ordem: readonly string[],
    erros: Record<string, string>,
  ) {
    setEstado((e) => ({ ...e, erros, status: '' }))
    focarPrimeiroErro(form, ordem, erros)
  }

  function enviarDaEtapa1(form: HTMLFormElement) {
    if (emVoo.current) return
    const erros = errosDaEtapa1(form)
    if (temErro(erros)) {
      recusarCampos(form, ORDEM_ETAPA_1, erros)
      return
    }
    const token = tokenInicial.current
    if (!token && !estado.etapa1Gravada) {
      setEstado((e) => ({ ...e, erros: {}, status: TEXTOS.aguardeVerificacao }))
      return
    }
    tokenInicial.current = null
    const campos = lerEtapa1(form)
    void executar({ enviar: (t) => enviarEtapa1(campos, t), medir: medirLeadGerado }, token)
  }

  function enviarDaEtapa2(form: HTMLFormElement) {
    if (emVoo.current) return
    const erros = errosDaEtapa2(form)
    if (temErro(erros)) {
      recusarCampos(form, ORDEM_ETAPA_2, erros)
      return
    }
    const etapa1 = lerEtapa1(form)
    const etapa2 = lerEtapa2(form)
    void executar(
      {
        // Com token do Turnstile (depois de precisa_verificar), as duas etapas juntas (R5).
        enviar: (t) =>
          t ? enviarPropostaCompleta({ ...etapa1, ...etapa2 }, t) : enviarEtapa2(etapa2),
        medir: (r) => {
          if (!r.ok) return
          medirLeadGerado(r)
          registrarLeadQualificado({ cliente: etapa2.cliente })
        },
      },
      null,
    )
  }

  function tentarDeNovo() {
    if (pendente.current) void executar(pendente.current, null)
  }

  function voltar() {
    setEstado((e) => ({ ...e, etapa: 1, status: '', erros: {}, verificar: false, falha: false }))
  }

  return {
    estado,
    enviarDaEtapa1,
    enviarDaEtapa2,
    guardarToken,
    continuarComToken,
    tentarDeNovo,
    voltar,
  }
}
