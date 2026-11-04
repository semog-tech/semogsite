/** Smoke sobre `next start`; baixa scripts reais, mas intercepta toda coleta da RD. */
import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium, firefox } from '@playwright/test'

const local = process.env.RD_TEST_BASE_URL || 'http://localhost:3108'
const origin = 'https://www.semog.com.br'
const real = process.env.RD_TEST_REAL_LOADER === 'true'
const loader = real
  ? 'https://d335luupugsy2.cloudfront.net/js/loader-scripts/b5cc11ec-edcd-4c9c-b5ad-01c535d0076f-loader.js'
  : 'https://d335luupugsy2.cloudfront.net/js/loader-scripts/semog-test-loader.js'
const integrationUrl =
  'https://d335luupugsy2.cloudfront.net/js/integration/2.0.0/rd-js-integration.min.js'
const integrationResponse = await fetch(integrationUrl)
assert.ok(integrationResponse.ok)
const integration = await integrationResponse.text()
const consent = { necessary: true, analytics: false, marketing: false }

async function prepare(browser, rejected = false) {
  const context = await browser.newContext({ viewport: { width: 1365, height: 1000 } })
  if (rejected) {
    await context.addCookies([
      { name: 'semog-consent', value: encodeURIComponent(JSON.stringify(consent)), url: origin },
    ])
  }
  const page = await context.newPage()
  const requests = []
  const responses = []
  const errors = []
  await page.addInitScript(() => {
    window.__rdCspViolations = []
    document.addEventListener('securitypolicyviolation', (event) => {
      if (/rdstation|cloudfront/.test(event.blockedURI))
        window.__rdCspViolations.push(event.blockedURI)
    })
  })
  page.on('response', (response) =>
    responses.push({ url: response.url(), status: response.status() }),
  )
  page.on('request', (request) =>
    requests.push({
      url: request.url(),
      method: request.method(),
      body: request.postData(),
    }),
  )
  page.on('pageerror', (error) => errors.push(error.message))
  await page.route('**/*', async (route) => {
    const request = route.request()
    // A biblioteca só grava rdtrk após 200; UUID sintético, nunca coleta remota.
    if (/pageview-notify/.test(request.url()))
      return route.fulfill({
        status: 200,
        contentType: 'text/plain',
        body: '00000000-0000-4000-8000-000000000079',
      })
    if (
      /pageview-notify|event-harbor|event-api\.rdstation|api\.rd\.services|execute-api/.test(
        request.url(),
      )
    )
      return route.fulfill({ status: 204, body: '' })
    if (request.url().startsWith(origin)) {
      const response = await route.fetch({
        url: request.url().replace(origin, local),
        headers: { ...request.headers(), host: new URL(local).host, origin: local },
      })
      return route.fulfill({ response })
    }
    if (request.url() === loader) {
      if (real) return route.continue()
      return route.fulfill({
        contentType: 'application/javascript',
        body: `${integration};window.__rdTestLoaded=true;RdstationFormsIntegration.Integration.integrateAll('00000000000000000000000000000000',{});`,
      })
    }
    if (
      real &&
      /https:\/\/(?:d335luupugsy2\.cloudfront\.net|d1sag09wwfbul8\.cloudfront\.net|[\w-]+\.rdstation\.com(?:\.br)?)(?:\/|$)/.test(
        request.url(),
      )
    ) {
      return route.continue()
    }
    if (request.url().includes('challenges.cloudflare.com/turnstile/')) {
      return route.fulfill({
        contentType: 'application/javascript',
        body: 'window.turnstile={render:(el,opts)=>{setTimeout(()=>opts.callback("test-token"),0);return "test"},remove:()=>{},reset:()=>{}}',
      })
    }
    // Bloqueia chamadas de marketing reais; conserva imagens públicas da página.
    if (['image', 'media'].includes(request.resourceType())) return route.continue()
    return route.fulfill({ status: 200, body: '', contentType: 'application/javascript' })
  })
  return { context, page, requests, responses, errors }
}

async function verifyForm(page, requests) {
  await page.locator('input[name="nome"]').fill('Teste local RD')
  await page.locator('input[name="email"]').fill('teste-rd@example.invalid')
  await page.locator('input[name="telefone"]').fill('81987654321')
  await page.locator('textarea[name="mensagem"]').fill('Teste local sem envio externo.')
  const responsePromise = page.waitForResponse(
    (response) => response.request().method() === 'POST' && response.url().startsWith(origin),
  )
  await page.getByRole('button', { name: 'Enviar mensagem', exact: true }).click()
  const response = await responsePromise
  assert.equal(response.status(), 200)
  assert.ok(response.request().headers()['next-action'], 'envio deve usar nossa Server Action')
  await page.waitForTimeout(1000)
  assert.equal(await page.evaluate(() => localStorage.getItem('RdIntegrationFormData')), null)
  const rdConversions = requests.filter((request) =>
    /event-api\.rdstation|api\.rd\.services|execute-api/.test(request.url),
  )
  assert.deepEqual(rdConversions, [], 'RD não deve tentar capturar o formulário')
  const rdRequests = requests.filter((request) => /rdstation|cloudfront/.test(request.url))
  for (const request of rdRequests) {
    const body = `${request.url} ${request.body || ''}`
    for (const value of ['teste-rd@example.invalid', 'Teste local RD', '81987654321']) {
      assert.ok(
        !body.includes(value) && !body.includes(encodeURIComponent(value)),
        'campo sensível vazou para RD',
      )
    }
  }
}

async function verifySensitiveControl(browser) {
  for (const sensitive of [false, true]) {
    const page = await browser.newPage()
    const hits = []
    await page.route('**/*', async (route) => {
      hits.push(route.request().url())
      await route.fulfill({ contentType: 'application/json', body: '{}' })
    })
    await page.goto(origin)
    hits.length = 0
    await page.setContent(
      `<form onsubmit="event.preventDefault()"><input name="email" type="email" value="teste@example.invalid" ${sensitive ? 'data-sensitive="true"' : ''}><button type="submit">Enviar</button></form>`,
    )
    await page.addScriptTag({ content: integration })
    await page.evaluate(() =>
      RdstationFormsIntegration.Integration.integrateAll('00000000000000000000000000000000', {}),
    )
    await page.click('button')
    await page.waitForTimeout(1200)
    const captured = await page.evaluate(() => localStorage.getItem('RdIntegrationFormData'))
    assert.equal(captured !== null, !sensitive, 'controle da captura real da RD')
    if (sensitive) assert.deepEqual(hits, [])
    await page.unrouteAll({ behavior: 'ignoreErrors' })
    await page.close()
  }
}

for (const [name, browserType] of Object.entries({ chromium, firefox })) {
  const browser = await browserType.launch()
  try {
    if (!real) await verifySensitiveControl(browser)
    for (const path of ['/', '/contato', '/experience', '/privacidade']) {
      const { context, page, requests, responses, errors } = await prepare(browser)
      const loaded = page.waitForResponse(
        (response) => response.url() === loader && response.status() === 200,
      )
      const destination = path === '/' ? '/?utm_source=verificacao-local&utm_medium=teste' : path
      const response = await page.goto(`${origin}${destination}`)
      assert.equal(response?.status(), 200)
      await loaded
      await page.waitForFunction(
        () => window.RDStationTrackingCodeChecker === true || window.__rdTestLoaded === true,
      )
      if (real) await page.waitForTimeout(2000)
      assert.equal(requests.filter((request) => request.url === loader).length, 1)
      assert.ok(await page.locator('h1').first().isVisible())
      const height = await page.evaluate(() => document.body.scrollHeight)
      for (let top = 0; top < height; top += 800) {
        await page.evaluate((position) => window.scrollTo(0, position), top)
        await page.waitForTimeout(450)
      }
      if (path === '/contato') await verifyForm(page, requests)
      if (path === '/privacidade') {
        assert.ok((await page.locator('body').innerText()).includes('grupo TOTVS'))
        await page.getByRole('switch', { name: 'Cookies de marketing' }).click()
        const reloaded = page.waitForNavigation()
        await page.getByRole('button', { name: 'Salvar preferências' }).click()
        await reloaded
        await page.waitForTimeout(700)
        assert.equal(requests.filter((request) => request.url === loader).length, 1)
      }
      assert.deepEqual(errors, [])
      if (real && path !== '/privacidade') {
        assert.deepEqual(await page.evaluate(() => window.__rdCspViolations), [])
        assert.ok(
          responses.some(
            (response) => response.url.includes('lead-tracking.min.js') && response.status === 200,
          ),
        )
        assert.ok(
          responses.some(
            (response) => response.url.includes('rdtracker.min.js') && response.status === 200,
          ),
        )
        console.log(`${name} ${path}: bibliotecas RD reais 200, sem violação CSP RD`)
        if (path === '/') {
          await page.waitForFunction(() => document.cookie.includes('rdtrk='))
          const cookies = await context.cookies(origin)
          assert.ok(
            cookies.some((cookie) => cookie.name === 'rdtrk'),
            'identificador RD persistido',
          )
          assert.ok(
            cookies.some((cookie) => cookie.name === '__trf.src'),
            'origem RD persistida',
          )
          const visits = responses.filter((item) =>
            /pageview-notify.*\/send|event-harbor/.test(item.url),
          )
          assert.ok(
            visits.some((item) => item.status === 200),
            'visita RD interceptada localmente',
          )
          console.log(
            `${name}: rdtrk e __trf.src gravados; coleta interceptada: ${JSON.stringify(visits)}`,
          )
          console.log(
            `${name}: recursos RD: ${JSON.stringify(responses.filter((item) => /rdstation|cloudfront/.test(item.url)))}`,
          )
        }
      }
      await page.screenshot({
        path: join(tmpdir(), `rd-${name}-${path.replaceAll('/', '') || 'home'}.png`),
        fullPage: true,
      })
      console.log(`${name} ${path}: 200, loader 1x, sem erro; formulário/opt-out quando aplicável`)
      await page.unrouteAll({ behavior: 'ignoreErrors' })
      await context.close()
    }
    const rejected = await prepare(browser, true)
    await rejected.page.goto(`${origin}/`)
    await rejected.page.waitForTimeout(1000)
    assert.equal(rejected.requests.filter((request) => request.url === loader).length, 0)
    await rejected.page.unrouteAll({ behavior: 'ignoreErrors' })
    await rejected.context.close()
    const localPage = await browser.newPage()
    const localRequests = []
    localPage.on('request', (request) => localRequests.push(request.url()))
    await localPage.goto(local)
    await localPage.waitForTimeout(1000)
    assert.ok(!localRequests.includes(loader), 'localhost não deve carregar RD')
    await localPage.close()
    console.log(`${name}: opt-out salvo e localhost não carregam RD`)
  } finally {
    await browser.close()
  }
}
