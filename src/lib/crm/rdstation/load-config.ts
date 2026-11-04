import 'server-only'
import * as Sentry from '@sentry/nextjs'
import { query } from '@/lib/db'
import { type ConfigRd, configRd, configRdDoBanco } from './config'

const CACHE_MS = 60_000
let cache: { valor: ConfigRd; venceEm: number } | undefined
let emAndamento: Promise<ConfigRd> | undefined

/** Cache por instância; concorrentes compartilham leitura. Erro de validação nunca usa fallback. */
export async function obterConfigRd(): Promise<ConfigRd> {
  if (cache && Date.now() < cache.venceEm) return cache.valor
  if (emAndamento) return emAndamento
  emAndamento = carregarConfig()
  try {
    return await emAndamento
  } finally {
    emAndamento = undefined
  }
}

function guardar(valor: ConfigRd): ConfigRd {
  cache = { valor, venceEm: Date.now() + CACHE_MS }
  return valor
}

async function carregarConfig(): Promise<ConfigRd> {
  let raw: unknown
  try {
    const { rows } = await query<{ config: unknown }>(
      'select cms.crm_rdstation_config_obter() as config',
    )
    if (rows.length !== 1 || rows[0].config === undefined) {
      throw new Error('RD Station: leitura de configuração retornou contrato inválido')
    }
    raw = rows[0].config
  } catch (err) {
    Sentry.captureException(err, {
      tags: { integracao: 'crm_config' },
      extra: { fallback: cache ? 'cache' : 'env' },
    })
    try {
      await Sentry.flush(2_000)
    } catch (sentryErr) {
      console.error('[crm] falha ao enviar erro de configuração', sentryErr)
    }
    return guardar(cache?.valor ?? configRd())
  }
  // NULL é ausência de configuração; JSON inválido é erro explícito, mesmo com cache bom.
  return guardar(raw === null ? configRd() : configRdDoBanco(raw))
}
