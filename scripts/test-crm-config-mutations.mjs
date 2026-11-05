import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const arquivo = resolve('src/lib/crm/rdstation/load-config.ts')
const original = readFileSync(arquivo, 'utf8')
const vitest = resolve('node_modules/vitest/vitest.mjs')
const testes = ['run', '--config', './vitest.config.mts', 'tests/int/rdstation-config.int.spec.ts']
const mutacoes = [
  [
    'NULL sem fallback env',
    'return guardar(raw === null ? configRd() : configRdDoBanco(raw))',
    'return guardar(configRdDoBanco(raw))',
  ],
  ['RPC sem fallback cache/env', 'return guardar(cache?.valor ?? configRd())', 'throw err'],
]

function testar() {
  const resultado = spawnSync(process.execPath, [vitest, ...testes], {
    encoding: 'utf8',
    timeout: 60_000,
    windowsHide: true,
    env: { ...process.env, NODE_OPTIONS: '--no-deprecation', NO_COLOR: '1' },
  })
  if (resultado.error || resultado.signal || resultado.status === null)
    throw new Error('Vitest não completou')
  return { status: resultado.status, saida: resultado.stdout + resultado.stderr }
}

try {
  const base = testar()
  if (base.status !== 0) throw new Error(`Baseline falhou:\n${base.saida}`)
  console.log('Baseline: exit 0')
  for (const [nome, antes, depois] of mutacoes) {
    if (original.split(antes).length !== 2) throw new Error(`${nome}: alvo deve ocorrer uma vez`)
    writeFileSync(arquivo, original.replace(antes, depois))
    const resultado = testar()
    if (
      resultado.status === 0 ||
      !resultado.saida.includes('FAIL  tests/int/rdstation-config.int.spec.ts')
    ) {
      throw new Error(`${nome}: sobreviveu ou falhou fora dos testes:\n${resultado.saida}`)
    }
    console.log(
      `${nome}: DERRUBADA (Vitest exit ${resultado.status}; teste de configuração falhou)`,
    )
    writeFileSync(arquivo, original)
  }
} finally {
  writeFileSync(arquivo, original)
}
