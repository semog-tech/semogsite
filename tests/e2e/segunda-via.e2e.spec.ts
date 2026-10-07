import { type BrowserContext, expect, type Page, test } from '@playwright/test'
import {
  CODIGO_CERTO,
  CODIGO_EXPIRADO,
  CPFS_DE_EXEMPLO,
  iniciarSemogappFalso,
  type SemogappFalso,
} from './helpers/semogappFalso'

/**
 * 2ª via no navegador, de ponta a ponta, contra o semogapp FALSO
 * (`helpers/semogappFalso.ts`, dados de exemplo): CPF → código → boletos →
 * link, sem tocar o app real. O servidor de dev precisa subir com
 * `SEGUNDA_VIA_ATIVA=true` e `SEMOGAPP_API_URL` apontando para a porta do
 * falso — é o que o `webServer` do `playwright.config.ts` faz. Se o teste
 * encontrar um servidor reaproveitado sem a flag, ele falha avisando.
 *
 * Roda em Chromium e Firefox:
 * `pnpm exec playwright test tests/e2e/segunda-via.e2e.spec.ts --project=chromium`
 * (e `--project=firefox`).
 */

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000'
const PORTA_DO_FALSO = 4599

let falso: SemogappFalso | undefined

test.beforeAll(async () => {
  falso = await iniciarSemogappFalso(PORTA_DO_FALSO)
})

test.afterAll(async () => {
  // Se o `beforeAll` falhou (porta ocupada), não há o que fechar.
  await falso?.fechar()
})

/** A aba do boleto vai a `semog.superlogica.net`: aqui ela recebe uma página de exemplo. */
async function interceptarSuperlogica(context: BrowserContext) {
  await context.route('https://semog.superlogica.net/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<h1>Boleto de EXEMPLO (e2e)</h1>' }),
  )
}

async function abrirSegundaVia(page: Page) {
  await page.goto(`${BASE}/`)
  const botao = page.locator('button.wa-float')
  await expect(botao).toHaveAttribute('aria-haspopup', 'dialog')
  await botao.click()
  const cliente = page.getByRole('button', { name: /Sou cliente: 2ª via e atendimento/ })
  await expect(
    cliente,
    'servidor sem SEGUNDA_VIA_ATIVA=true (reaproveitado?): "Sou cliente" ainda é link',
  ).toBeVisible()
  await cliente.click()
  await expect(page.getByRole('heading', { name: 'Segunda via do boleto' })).toBeVisible()
}

/** CPF + Turnstile de teste (chave que sempre passa) + Continuar. */
async function pedirCodigo(page: Page, cpf: string) {
  await page.locator('dialog').getByRole('textbox', { name: 'CPF' }).fill(cpf)
  // O widget de teste devolve o token sozinho; o input escondido o recebe.
  await expect(page.locator('dialog input[name="cf-turnstile-response"]')).not.toHaveValue('', {
    timeout: 15_000,
  })
  await page.getByRole('button', { name: 'Continuar' }).click()
}

async function confirmar(page: Page, codigo: string) {
  await page.locator('dialog').getByRole('textbox', { name: 'Código' }).fill(codigo)
  await page.getByRole('button', { name: 'Confirmar código' }).click()
}

test('fluxo completo: CPF → código → boletos → link em aba nova', async ({ page, context }) => {
  await interceptarSuperlogica(context)
  await abrirSegundaVia(page)
  await pedirCodigo(page, CPFS_DE_EXEMPLO.umaUnidade)

  await expect(page.getByRole('heading', { name: 'Digite o código' })).toBeVisible()
  await expect(page.locator('dialog')).not.toContainText('@')
  await confirmar(page, CODIGO_CERTO)

  // A gravação do cookie de sessão re-renderiza a página: o diálogo continua aberto.
  await expect(page.getByRole('heading', { name: 'Boletos em aberto' })).toBeVisible()
  await expect(page.locator('dialog')).toHaveAttribute('open', '')
  await expect(page.getByText('Vence em 10/10/2026')).toBeVisible()
  await expect(page.getByText('valor indisponível')).toBeVisible()

  await page.getByRole('button', { name: /10\/10\/2026/ }).click()
  const abrir = page.getByRole('link', { name: 'Abrir boleto' })
  await expect(abrir).toHaveAttribute('rel', 'noopener noreferrer')
  await expect(abrir).toHaveAttribute('target', '_blank')
  const [aba] = await Promise.all([context.waitForEvent('page'), abrir.click()])
  await expect(aba.getByText('Boleto de EXEMPLO (e2e)')).toBeVisible()

  // `/solicitar` uma vez só: repetir mandaria outro e-mail.
  expect(falso?.pedidos.filter((p) => p === 'solicitar')).toHaveLength(1)
})

test('código errado conta as tentativas; código expirado pede outro', async ({ page }) => {
  await abrirSegundaVia(page)
  await pedirCodigo(page, CPFS_DE_EXEMPLO.umaUnidade)
  await confirmar(page, '654321')
  await expect(page.locator('dialog').getByRole('alert')).toHaveText(
    'Código incorreto. Restam 2 tentativas.',
  )
  await confirmar(page, CODIGO_EXPIRADO)
  await expect(page.locator('dialog').getByRole('alert')).toHaveText(
    'Este código expirou. Peça um novo código.',
  )
})

test('cookie de sessão ausente: "sua consulta expirou" e recomeça pelo CPF', async ({
  page,
  context,
}) => {
  await abrirSegundaVia(page)
  await pedirCodigo(page, CPFS_DE_EXEMPLO.umaUnidade)
  await confirmar(page, CODIGO_CERTO)
  await expect(page.getByText('Vence em 10/10/2026')).toBeVisible()

  await context.clearCookies()
  await page.getByRole('button', { name: /10\/10\/2026/ }).click()
  await expect(page.getByText('Por segurança, sua consulta expirou. Comece de novo.')).toBeVisible()
  await page.getByRole('button', { name: 'Começar de novo' }).click()
  await expect(page.getByRole('heading', { name: 'Segunda via do boleto' })).toBeVisible()
})

test('app fora do ar: "não conseguimos consultar" e WhatsApp', async ({ page }) => {
  await abrirSegundaVia(page)
  await pedirCodigo(page, CPFS_DE_EXEMPLO.appFora)
  await expect(page.getByRole('heading', { name: 'Não conseguimos consultar' })).toBeVisible()
  await expect(
    page.locator('dialog').getByRole('link', { name: /Falar no WhatsApp/ }),
  ).toHaveAttribute('data-wa-caminho', 'cliente')
})
