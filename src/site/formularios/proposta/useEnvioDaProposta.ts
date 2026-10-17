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

/** Dos erros na tela, só os que o campo ainda tem (com a mensagem atual); nunca acrescenta erro. */
function errosQueContinuam(
  naTela: Record<string, string>,
  atuais: Record<string, string>,
): Record<string, string> {
  const restantes: Record<string, string> = {}
  for (const campo of Object.keys(naTela)) {
    const mensagem = atuais[campo]
    if (mensagem) restantes[campo] = mensagem
  }
  return restantes
}

/** O token do primeiro widget já foi gasto e ele não emite outro: pede uma verificação nova. */
function pedirVerificacaoNova(e: EstadoDoEnvio): EstadoDoEnvio {
  const status = TEXTOS.precisaVerificar
  if (e.verificar) return { ...e, erros: {}, falha: false, status }
  return {
    ...e,
    erros: {},
    falha: false,
    verificar: true,
    chaveVerificacao: e.chaveVerificacao + 1,
    status,
  }
}

export function useEnvioDaProposta() {
  const [estado, setEstado] = useState<EstadoDoEnvio>(ESTADO_INICIAL)
  const tokenInicial = useRef<string | null>(null)
  const pendente = useRef<Tentativa | null>(null)
  const leadGerado = useRef(false)
  // O widget inicial emite um token só: depois de gasto (envio com falha ou recusa), não há outro.
  const tokenGasto = useRef(false)

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
    setEstado((e) => (e.status === TEXTOS.aguardeVerificacao ? { ...e, status: '' } : e))
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
    const campos = lerEtapa1(form)
    const tentativa: Tentativa = { enviar: (t) => enviarEtapa1(campos, t), medir: medirLeadGerado }
    const token = tokenInicial.current
    if (!token && !estado.etapa1Gravada) {
      if (!tokenGasto.current) {
        setEstado((e) => ({ ...e, erros: {}, status: TEXTOS.aguardeVerificacao }))
        return
      }
      // O widget novo chama `continuarComToken`, que envia esta tentativa (com os campos de agora).
      pendente.current = tentativa
      setEstado(pedirVerificacaoNova)
      return
    }
    tokenInicial.current = null
    if (token) tokenGasto.current = true
    void executar(tentativa, token)
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

  /** Erro de um campo some quando ele fica válido (o envio continua sendo quem mostra erro novo). */
  function revisarErros(form: HTMLFormElement) {
    if (!temErro(estado.erros)) return
    const atuais = estado.etapa === 1 ? errosDaEtapa1(form) : errosDaEtapa2(form)
    setEstado((e) => ({ ...e, erros: errosQueContinuam(e.erros, atuais) }))
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
    revisarErros,
  }
}
