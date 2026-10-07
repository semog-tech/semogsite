import { defineConfig, devices } from '@playwright/test'

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import 'dotenv/config'
import { PORTA_DO_SEMOGAPP_FALSO } from './tests/e2e/global-setup'
import { SEGREDO_DE_TESTE } from './tests/e2e/helpers/semogappFalso'

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  /* Local, no máximo 2: com vários workers dividindo o mesmo `pnpm dev`, o vídeo
     do hero baixa mais devagar, o navegador repete trechos e o orçamento de bytes
     de `hero-video.e2e.spec.ts` estoura. O Firefox da 2ª via aumentou essa carga,
     mas o teste já falha sem ele: medido em 07/10/2026, com 4 workers falhou 3 de
     3 na suíte completa e também sem o spec da 2ª via; com 2, passou 62/62. */
  workers: process.env.CI ? 1 : 2,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chromium' },
    },
    // Só o spec da 2ª via roda no Firefox por enquanto [A CONFIRMAR se os
    // demais entram]: `--project=firefox`.
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: /segunda-via\.e2e\.spec\.ts/,
    },
  ],
  // Sobe o semogapp FALSO da 2ª via uma vez só, para todos os projetos.
  globalSetup: './tests/e2e/global-setup.ts',
  webServer: {
    command: 'pnpm dev',
    reuseExistingServer: true,
    url: 'http://localhost:3000',
    // 2ª via ligada contra o semogapp FALSO do e2e (`tests/e2e/helpers/semogappFalso.ts`,
    // porta 4599), nunca o app real. Turnstile com as chaves de TESTE públicas da
    // Cloudflare, que sempre passam.
    env: {
      SEGUNDA_VIA_ATIVA: 'true',
      SEMOGAPP_API_URL: `http://127.0.0.1:${PORTA_DO_SEMOGAPP_FALSO}`,
      SEMOGAPP_SEGUNDA_VIA_SEGREDO: SEGREDO_DE_TESTE,
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
      TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA',
    },
  },
})
