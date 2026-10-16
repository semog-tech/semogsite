import { X509Certificate } from 'node:crypto'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import type { ConnectionOptions } from 'node:tls'
import { describe, expect, it } from 'vitest'
import { conexaoComTls, SUPABASE_POOLER_HOST, SUPABASE_ROOT_CAS } from '@/lib/db-tls'

/**
 * Trava do TLS do Postgres: verificação ligada, raízes da Supabase embutidas,
 * `servername` só para IP e a URI limpa de parâmetros que fariam o `pg`
 * descartar o objeto `ssl`. Sem rede — a prova contra o banco real é manual.
 */

/**
 * O parser que o `pg` instalado usa de fato. Não é dependência direta (o pnpm
 * não o expõe na raiz), então é resolvido a partir do próprio `pg`.
 */
type ConfigDaUri = Record<string, unknown>
const exigeDoPg = createRequire(createRequire(import.meta.url).resolve('pg'))
const modulo: unknown = exigeDoPg('pg-connection-string')
function parse(uri: string): ConfigDaUri {
  if (typeof modulo !== 'function') throw new Error('pg-connection-string mudou de forma')
  const config: unknown = modulo(uri)
  if (typeof config !== 'object' || config === null) throw new Error('parse sem objeto')
  return { ...config }
}

const PROXY = 'postgresql://cms_user.ref:s3nh%40forte@143.244.162.48:7432/postgres'

function tls(connectionString: string | undefined): ConnectionOptions {
  const { ssl } = conexaoComTls(connectionString)
  if (ssl === false) throw new Error('esperava TLS ligado')
  return ssl
}

describe('conexaoComTls — parâmetros de SSL na URI', () => {
  it('remove sslmode e companhia preservando usuário, senha, host, porta, banco e o resto', () => {
    const uri =
      `${PROXY}?sslmode=require&application_name=site&sslrootcert=/x.crt&sslcert=/c&sslkey=/k` +
      '&ssl=true&sslnegotiation=direct&uselibpqcompat=true&options=-c%20search_path%3Dcms'
    const { connectionString } = conexaoComTls(uri)
    if (!connectionString) throw new Error('perdeu a URI')
    const lida = parse(connectionString)

    expect(lida.user).toBe('cms_user.ref')
    expect(lida.password).toBe('s3nh@forte')
    expect(lida.host).toBe('143.244.162.48')
    expect(lida.port).toBe('7432')
    expect(lida.database).toBe('postgres')
    expect(lida.application_name).toBe('site')
    expect(lida.options).toBe('-c search_path=cms')
    for (const p of ['sslmode', 'sslrootcert', 'sslcert', 'sslkey', 'sslnegotiation']) {
      expect(new URL(connectionString).searchParams.has(p)).toBe(false)
    }
    // O que importa no fim: o `pg-connection-string` não cria mais `ssl` a partir da URI.
    expect(lida.ssl).toBeUndefined()
  })

  it('URI sem parâmetro de SSL passa intacta, sem "?" sobrando quando tudo sai', () => {
    expect(conexaoComTls(PROXY).connectionString).toBe(PROXY)
    expect(conexaoComTls(`${PROXY}?sslmode=verify-full`).connectionString).toBe(PROXY)
  })

  it('sem URI não lança e mantém o TLS verificado', () => {
    expect(conexaoComTls(undefined).connectionString).toBeUndefined()
    expect(conexaoComTls('').connectionString).toBe('')
    expect(tls('').rejectUnauthorized).toBe(true)
  })
})

describe('conexaoComTls — servername e host local', () => {
  it('host IPv4 usa o nome do pooler', () => {
    expect(tls(PROXY).servername).toBe(SUPABASE_POOLER_HOST)
  })

  it('host IPv6 usa o nome do pooler', () => {
    expect(tls('postgresql://u:p@[2600:1f16::1]:6543/postgres').servername).toBe(
      SUPABASE_POOLER_HOST,
    )
  })

  it('host DNS não define servername (o pg usa o próprio host)', () => {
    const ssl = tls('postgresql://u:p@aws-0-us-east-2.pooler.supabase.com:5432/postgres')
    expect('servername' in ssl).toBe(false)
  })

  it.each([
    'postgresql://u:p@localhost:5432/semog_test',
    'postgresql://u:p@LOCALHOST:5432/semog_test',
    'postgresql://u:p@127.0.0.1:5432/semog_test',
    'postgresql://u:p@[::1]:5432/semog_test',
  ])('host local fica sem TLS: %s', (uri) => {
    expect(conexaoComTls(uri).ssl).toBe(false)
  })
})

describe('conexaoComTls — verificação', () => {
  it('rejectUnauthorized é true, explícito, em todo caminho remoto', () => {
    for (const uri of [PROXY, 'postgresql://u:p@db.ref.supabase.co:5432/postgres', undefined]) {
      expect(tls(uri).rejectUnauthorized).toBe(true)
    }
  })

  it('ca traz as duas raízes da Supabase, cada uma um PEM válido e dentro da validade', () => {
    expect(tls(PROXY).ca).toEqual([...SUPABASE_ROOT_CAS])

    const lidas = SUPABASE_ROOT_CAS.map((pem) => new X509Certificate(pem))
    expect(lidas.map((c) => c.fingerprint256)).toEqual([
      '80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA',
      '5F:9B:77:95:1A:7A:A1:30:3F:9B:58:EE:A9:BF:A8:9E:35:8C:FD:C1:5F:97:86:FF:10:D4:93:0A:72:2C:9A:E2',
    ])
    for (const c of lidas) {
      expect(c.subject).toContain('O=Supabase Inc')
      expect(c.subject).toContain('CN=Supabase Root 2021 CA')
      expect(c.ca).toBe(true)
      // Falha antes de a raiz vencer em produção: a 2021 vale até 26/04/2031.
      expect(new Date(c.validTo).getTime()).toBeGreaterThan(Date.now())
    }
  })
})

/**
 * Regressão: ninguém reintroduz `rejectUnauthorized: false` em `src/` ou
 * `scripts/`. Regex sem `.` nem `$` — o disco no Windows tem CRLF.
 */
const ROOT = process.cwd()
const EXTENSOES = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.mts', '.cjs', '.cts'])
// Único caso permitido: só aceita banco local (asserção no topo do arquivo).
const PERMITIDOS = new Set(['scripts/check-experience-runtime.mjs'])
const DESLIGA_VERIFICACAO = /rejectUnauthorized\s*:\s*false/

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = path.join(dir, nome)
    if (statSync(caminho).isDirectory()) return arquivos(caminho)
    return EXTENSOES.has(path.extname(nome)) ? [caminho] : []
  })
}

describe('regressão: verificação de certificado nunca desligada', () => {
  it('src/ e scripts/ não têm rejectUnauthorized: false', () => {
    const varridos = ['src', 'scripts'].flatMap((d) => arquivos(path.join(ROOT, d)))
    expect(varridos.length).toBeGreaterThan(10)
    const ofensores = varridos
      .map((f) => path.relative(ROOT, f).split(path.sep).join('/'))
      .filter((rel) => !PERMITIDOS.has(rel))
      .filter((rel) => DESLIGA_VERIFICACAO.test(readFileSync(path.join(ROOT, rel), 'utf8')))
    expect(ofensores).toEqual([])
  })

  it('o detector pega a forma reintroduzida, inclusive com CRLF', () => {
    expect(DESLIGA_VERIFICACAO.test('ssl: { rejectUnauthorized: false },\r\n')).toBe(true)
    expect(DESLIGA_VERIFICACAO.test('rejectUnauthorized:false\r\n')).toBe(true)
    expect(DESLIGA_VERIFICACAO.test('rejectUnauthorized: true,\r\n')).toBe(false)
  })
})
