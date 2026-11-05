import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const vitest = resolve('node_modules/vitest/vitest.mjs')
const specs = ['tests/int/rdstation-config.int.spec.ts', 'tests/int/rdstation.int.spec.ts']
const testes = ['run', '--config', './vitest.config.mts', ...specs]
const loadConfig = 'src/lib/crm/rdstation/load-config.ts'
const config = 'src/lib/crm/rdstation/config.ts'
const mapLead = 'src/lib/crm/rdstation/map-lead.ts'
// Alvos comparados com quebras normalizadas para LF: no Windows o disco tem CRLF.
const mutacoes = [
  [
    loadConfig,
    'NULL sem fallback env',
    'return guardar(raw === null ? configRd() : configRdDoBanco(raw))',
    'return guardar(configRdDoBanco(raw))',
  ],
  [
    loadConfig,
    'RPC sem fallback cache/env',
    'return guardar(cache?.valor ?? configRd())',
    'throw err',
  ],
  [
    config,
    'equipes_por_unidade obrigatória',
    'equipes_por_unidade: equipesSchema.default({}),',
    'equipes_por_unidade: equipesSchema,',
  ],
  [
    config,
    'id de equipe sem formato',
    'const equipesSchema = z.record(z.string().min(1).max(120), id)',
    'const equipesSchema = z.record(z.string().min(1).max(120), z.unknown())',
  ],
  [
    config,
    'schema do banco sem strict',
    '    updated_at: z.string().datetime({ offset: true }),\n  })\n  .strict()',
    '    updated_at: z.string().datetime({ offset: true }),\n  })\n  .passthrough()',
  ],
  [
    config,
    'env ignora RD_CRM_EQUIPES_POR_UNIDADE',
    "JSON.parse(process.env.RD_CRM_EQUIPES_POR_UNIDADE || '{}')",
    "JSON.parse('{}')",
  ],
  [
    mapLead,
    'equipe nunca usada',
    "return { type: 'team', id: config.equipesPorUnidade[unidade] }",
    'return config.regra',
  ],
  [
    mapLead,
    'Unidade sem equipe vira team',
    'if (unidade && Object.hasOwn(config.equipesPorUnidade, unidade))',
    'if (unidade)',
  ],
  [
    mapLead,
    'lead sem Unidade cai na primeira equipe',
    '  return config.regra\n}',
    "  const primeira = Object.values(config.equipesPorUnidade)[0]\n  return primeira ? { type: 'team', id: primeira } : config.regra\n}",
  ],
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

const originais = new Map(
  [loadConfig, config, mapLead].map((caminho) => [
    resolve(caminho),
    readFileSync(resolve(caminho), 'utf8'),
  ]),
)

function restaurar() {
  for (const [arquivo, conteudo] of originais) writeFileSync(arquivo, conteudo)
}

try {
  const base = testar()
  if (base.status !== 0) throw new Error(`Baseline falhou:\n${base.saida}`)
  console.log('Baseline: exit 0')
  for (const [caminho, nome, antes, depois] of mutacoes) {
    const arquivo = resolve(caminho)
    const texto = originais.get(arquivo).replace(/\r\n/g, '\n')
    if (texto.split(antes).length !== 2) throw new Error(`${nome}: alvo deve ocorrer uma vez`)
    writeFileSync(arquivo, texto.replace(antes, depois))
    const resultado = testar()
    const falhou = specs.filter((spec) => resultado.saida.includes(`FAIL  ${spec}`))
    if (resultado.status === 0 || falhou.length === 0) {
      throw new Error(`${nome}: sobreviveu ou falhou fora dos testes:\n${resultado.saida}`)
    }
    console.log(`${nome}: DERRUBADA (Vitest exit ${resultado.status}; falhou ${falhou.join(', ')})`)
    restaurar()
  }
} finally {
  restaurar()
}
