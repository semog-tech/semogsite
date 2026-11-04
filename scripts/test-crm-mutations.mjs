import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Executar sem outros editores/implementadores sobre send-lead.ts: restaura em finally.
const arquivo = resolve('src/lib/crm/send-lead.ts')
const original = readFileSync(arquivo, 'utf8')
const vitest = resolve('node_modules/vitest/vitest.mjs')
const argumentos = ['run', '--config', './vitest.config.mts', 'tests/int/crm-provider.int.spec.ts']
const mutacoes = [
  [
    'M4',
    '[leadId, provider, MAX_TENTATIVAS_CRM, ESPERA_CONCILIACAO_MS, LEASE_CRM_MS]',
    '[leadId, provider, MAX_TENTATIVAS_CRM, ESPERA_CONCILIACAO_MS / 2, LEASE_CRM_MS]',
  ],
  [
    'M5',
    '[leadId, provider, MAX_TENTATIVAS_CRM, ESPERA_CONCILIACAO_MS, LEASE_CRM_MS]',
    '[leadId, provider, MAX_TENTATIVAS_CRM + 1, ESPERA_CONCILIACAO_MS, LEASE_CRM_MS]',
  ],
  [
    'M9',
    "crm_reconciliar_em = now() + ($3::double precision * interval '1 millisecond')",
    'crm_reconciliar_em = null',
  ],
  [
    'M10',
    '[leadId, provider, MAX_TENTATIVAS_CRM, ESPERA_CONCILIACAO_MS, LEASE_CRM_MS]',
    '[leadId, provider, MAX_TENTATIVAS_CRM, ESPERA_CONCILIACAO_MS, LEASE_CRM_MS / 2]',
  ],
  [
    'M23',
    'if (!push.ok) throw new Error(push.error)',
    "if (!push.ok) return { dealId: '999', contactId: null, aviso: null }",
  ],
  ['M25', 'backoffCrm(tentativas)', '0'],
]

function testar() {
  const resultado = spawnSync(process.execPath, [vitest, ...argumentos], {
    encoding: 'utf8',
    timeout: 60_000,
    windowsHide: true,
    env: { ...process.env, NO_COLOR: '1', NODE_OPTIONS: '--no-deprecation' },
  })
  if (resultado.error || resultado.signal || resultado.status === null) {
    throw new Error(`Vitest não completou: ${resultado.error?.message ?? resultado.signal}`)
  }
  return { status: resultado.status, saida: resultado.stdout + resultado.stderr }
}

try {
  const base = testar()
  if (base.status !== 0) throw new Error(`Baseline falhou antes das mutações:\n${base.saida}`)
  console.log('Baseline: exit 0')
  for (const [nome, antes, depois] of mutacoes) {
    if (original.split(antes).length !== 2)
      throw new Error(`${nome}: alvo deve ocorrer exatamente uma vez`)
    writeFileSync(arquivo, original.replace(antes, depois))
    const resultado = testar()
    const falhaEsperada =
      resultado.saida.includes('AssertionError') &&
      resultado.saida.includes('crm-provider.int.spec.ts')
    if (resultado.status === 0 || !falhaEsperada) {
      throw new Error(
        `${nome}: sobreviveu ou falhou fora das asserções esperadas:\n${resultado.saida}`,
      )
    }
    console.log(
      `${nome}: DERRUBADA (Vitest exit ${resultado.status}; AssertionError no teste de integração)`,
    )
    writeFileSync(arquivo, original)
  }
} finally {
  writeFileSync(arquivo, original)
}
