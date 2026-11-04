/** Loader REAL no Lighthouse local; somente a cópia em memória da guarda usa o host de produção. */
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, readdir, readFile } from 'node:fs/promises'
import { createServer, request as httpRequest } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { chromium } from '@playwright/test'

const cli = process.env.LIGHTHOUSE_CLI
const control = process.env.RD_LIGHTHOUSE_CONTROL === 'true'
assert.ok(cli, 'Informe o cli/index.js do Lighthouse instalado via pnpm dlx')
const local = process.env.RD_TEST_BASE_URL || 'http://localhost:3108'
const origin = 'http://localhost:3109'
const chunks = join(process.cwd(), '.next/static/chunks')
const overrides = new Map()
for (const filename of await readdir(chunks)) {
  if (!filename.endsWith('.js')) continue
  const source = await readFile(join(chunks, filename), 'utf8')
  if (!source.includes('rd-station-tracking')) continue
  const modified = source.replaceAll('window.location.hostname', '"www.semog.com.br"')
  assert.notEqual(modified, source, 'deve alterar exclusivamente a entrada da guarda no chunk RD')
  overrides.set(`/_next/static/chunks/${filename}`, gzipSync(modified))
}
assert.ok(overrides.size > 0, 'chunk RD não encontrado; primeiro execute o build com a URL real')

// Stream normal preserva compressão e Range; não usa route.fulfill nos recursos da aplicação.
const proxy = createServer((request, response) => {
  const override = overrides.get((request.url || '/').split('?')[0])
  if (override) {
    response.writeHead(200, {
      'content-type': 'application/javascript',
      'content-encoding': 'gzip',
      'content-length': String(override.length),
      'cache-control': 'no-store',
    })
    response.end(override)
    return
  }
  const upstream = httpRequest(
    new URL(request.url || '/', local),
    {
      method: request.method,
      headers: { ...request.headers, host: new URL(local).host, origin: local },
    },
    (received) => {
      response.writeHead(received.statusCode || 502, received.headers)
      received.pipe(response)
    },
  )
  upstream.on('error', () => {
    if (!response.headersSent) response.writeHead(502)
    response.end()
  })
  request.pipe(upstream)
})
await new Promise((resolve, reject) => {
  proxy.once('error', reject)
  proxy.listen(3109, '127.0.0.1', resolve)
})
const profile = await mkdtemp(join(tmpdir(), 'rd-lighthouse-task79-'))
const context = await chromium.launchPersistentContext(profile, {
  executablePath:
    process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--remote-debugging-port=9347', '--no-sandbox'],
})
const loaded = []
context.on('response', (response) => {
  if (response.url().includes('b5cc11ec-edcd-4c9c-b5ad-01c535d0076f-loader.js'))
    loaded.push(response.status())
})
await context.route('**/*', async (route) => {
  const request = route.request()
  if (
    /pageview-notify|event-harbor|event-api\.rdstation|api\.rd\.services|execute-api/.test(
      request.url(),
    )
  )
    return route.fulfill({ status: 204, body: '' })
  if (control && request.url().includes('b5cc11ec-edcd-4c9c-b5ad-01c535d0076f-loader.js')) {
    return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' })
  }
  if (
    request.url().startsWith(origin) ||
    /https:\/\/(?:d335luupugsy2\.cloudfront\.net|d1sag09wwfbul8\.cloudfront\.net|[\w-]+\.rdstation\.com(?:\.br)?)(?:\/|$)/.test(
      request.url(),
    ) ||
    ['image', 'media'].includes(request.resourceType())
  )
    return route.continue()
  return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' })
})

function measure(output) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        cli,
        `${origin}/`,
        '--port=9347',
        '--only-categories=performance',
        '--output=json',
        `--output-path=${output}`,
        '--quiet',
      ],
      { stdio: 'inherit' },
    )
    child.on('error', reject)
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`Lighthouse exit ${code}`)),
    )
  })
}

try {
  for (let run = 1; run <= 3; run++) {
    const output = join(tmpdir(), `rd-${control ? 'control' : 'real'}-lighthouse-${run}.json`)
    await measure(output)
    const result = JSON.parse(await readFile(output, 'utf8'))
    assert.ok(!result.runtimeError, JSON.stringify(result.runtimeError))
    console.log(
      JSON.stringify({
        run,
        score: result.categories.performance.score,
        lcp: result.audits['largest-contentful-paint'].numericValue,
        tbt: result.audits['total-blocking-time'].numericValue,
        output,
      }),
    )
  }
  assert.ok(
    loaded.filter((status) => status === 200).length >= 3,
    'loader REAL precisa executar nas três medições',
  )
  console.log(
    `${control ? 'Controle SEM loader' : 'Loader real'}: ${loaded.length} respostas; perfil de teste em ${profile}`,
  )
} finally {
  await context.unrouteAll({ behavior: 'ignoreErrors' })
  await context.close()
  proxy.closeAllConnections()
  await new Promise((resolve) => proxy.close(resolve))
}
