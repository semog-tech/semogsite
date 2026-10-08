import { createHash } from 'node:crypto'
import { type BrowserContext, expect, type Page, test } from '@playwright/test'
import { PORTA_DO_SEMOGAPP_FALSO } from './global-setup'
import {
  CODIGO_CERTO,
  CODIGO_EXPIRADO,
  CPFS_DE_EXEMPLO,
  type PedidoRecebido,
  ROTA_DOS_PEDIDOS,
} from './helpers/semogappFalso'

/**
 * 2ª via no navegador, de ponta a ponta, contra o semogapp FALSO
 * (`helpers/semogappFalso.ts`, dados de exemplo): CPF → código → boletos →
 * link, sem tocar o app real. O servidor de dev precisa subir com
 * `SEGUNDA_VIA_ATIVA=true` e `SEMOGAPP_API_URL` apontando para a porta do
 * falso — é o que o `webServer` do `playwright.config.ts` faz; o falso sobe
 * uma vez só no `global-setup.ts`. Se o teste encontrar um servidor
 * reaproveitado sem a flag, ele falha avisando.
 *
 * Roda em Chromium e Firefox, juntos em `pnpm run test:e2e` ou um de cada vez
 * com `--project=chromium` / `--project=firefox`.
 */

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000'

/**
 * IP de documentação (2001:db8::/32) próprio de cada teste, projeto e
 * tentativa, enviado como `x-forwarded-for`. O site limita 5 pedidos de
 * código por minuto por IP, e os dois projetos somam 8: com um IP por teste,
 * nenhum divide balde com outro. O falso registra esse IP em cada pedido.
 */
function ipDoTeste(projeto: string, idDoTeste: string, tentativa: number): string {
  const h = createHash('sha256').update(`${projeto}:${idDoTeste}:${tentativa}`).digest('hex')
  return `2001:db8::${h.slice(0, 4)}:${h.slice(4, 8)}:${h.slice(8, 12)}`
}

let ip = ''

test.beforeEach(async ({ context }, testInfo) => {
  ip = ipDoTeste(testInfo.project.name, testInfo.testId, testInfo.retry)
  await context.setExtraHTTPHeaders({ 'x-forwarded-for': ip })
})

/** Pedidos que o falso recebeu com o IP deste teste. */
async function pedidosDesteTeste(): Promise<PedidoRecebido[]> {
  const r = await fetch(`http://127.0.0.1:${PORTA_DO_SEMOGAPP_FALSO}${ROTA_DOS_PEDIDOS}`)
  const todos = (await r.json()) as PedidoRecebido[] // as: o falso do próprio teste responde esse formato
  return todos.filter((p) => p.ip === ip)
}

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
  const abrir = page.locator('dialog').getByRole('button', { name: 'Abrir boleto' })
  await expect(abrir).toBeEnabled()
  // A URL do boleto é credencial: fica na memória, nunca no DOM.
  expect(await page.content()).not.toContain('exemplo-segunda-via')
  const [aba] = await Promise.all([context.waitForEvent('page'), abrir.click()])
  await expect(aba.getByText('Boleto de EXEMPLO (e2e)')).toBeVisible()
  // `noopener`: a aba do boleto não alcança a página do site.
  expect(await aba.evaluate(() => window.opener)).toBeNull()

  // `/solicitar` uma vez só: repetir mandaria outro e-mail.
  const solicitados = (await pedidosDesteTeste()).filter((p) => p.rota === 'solicitar')
  expect(solicitados).toHaveLength(1)
})

test('código errado conta as tentativas; código expirado leva a recomeçar pelo CPF', async ({
  page,
}) => {
  await abrirSegundaVia(page)
  await pedirCodigo(page, CPFS_DE_EXEMPLO.umaUnidade)
  await confirmar(page, '654321')
  await expect(page.locator('dialog').getByRole('alert')).toHaveText(
    'Código incorreto. Restam 2 tentativas.',
  )
  await confirmar(page, CODIGO_EXPIRADO)
  await expect(page.locator('dialog').getByRole('alert')).toHaveText(
    'Este código expirou. Comece de novo pelo CPF.',
  )
  await page.locator('dialog').getByRole('button', { name: 'Começar de novo' }).click()
  await expect(page.locator('dialog').getByLabel(/^CPF/)).toHaveValue('')
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

test('boleto baixado: resumo e WhatsApp no lugar de "Abrir boleto", e /link nunca é chamado', async ({
  page,
}) => {
  await abrirSegundaVia(page)
  await pedirCodigo(page, CPFS_DE_EXEMPLO.comBaixado)
  await confirmar(page, CODIGO_CERTO)
  const item = page.getByRole('button', { name: /10\/06\/2026/ })
  await expect(item).toContainText('Não pode mais ser pago pelo link.')
  await item.click()

  const dialogo = page.locator('dialog')
  await expect(page.getByRole('heading', { name: 'Seu boleto' })).toBeVisible()
  await expect(dialogo).toContainText(
    'Este boleto não pode mais ser pago pelo link. Fale com a equipe no WhatsApp.',
  )
  await expect(
    dialogo.getByRole('link', { name: 'Fale com a equipe no WhatsApp' }),
  ).toHaveAttribute('data-wa-caminho', 'cliente')
  await expect(dialogo.getByRole('button', { name: /Abrir boleto|Preparando/ })).toHaveCount(0)

  // O boleto disponível ao lado continua pedindo o link: a contagem abaixo é a
  // prova de que o baixado não pediu.
  await dialogo.getByRole('button', { name: 'Ver outro boleto' }).click()
  await page.getByRole('button', { name: /10\/10\/2026/ }).click()
  await expect(dialogo.getByRole('button', { name: 'Abrir boleto' })).toBeEnabled()
  const links = (await pedidosDesteTeste()).filter((p) => p.rota === 'link')
  expect(links).toHaveLength(1)
})

test('só boletos baixados: a lista aparece, nunca "sem boletos"', async ({ page }) => {
  await abrirSegundaVia(page)
  await pedirCodigo(page, CPFS_DE_EXEMPLO.soBaixados)
  await confirmar(page, CODIGO_CERTO)
  await expect(page.getByText('Vence em 10/06/2026')).toBeVisible()
  await expect(page.locator('dialog')).not.toContainText('Não encontramos boletos')
  expect((await pedidosDesteTeste()).filter((p) => p.rota === 'link')).toHaveLength(0)
})
