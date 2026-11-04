import { cleanup, render, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/script', () => ({
  default: ({ src, strategy }: { src: string; strategy: string }) =>
    createElement('script', { src, 'data-rd-test': true, 'data-strategy': strategy }),
}))
vi.mock('@/providers/ConsentProvider', () => ({
  useConsent: () => ({
    consent: { necessary: true, analytics: true, marketing: true },
    decided: false,
  }),
}))

const url = 'https://d335luupugsy2.cloudfront.net/js/loader-scripts/semog-test-loader.js'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  // biome-ignore lint/suspicious/noDocumentCookie: limpa o cookie real do jsdom entre cenários.
  document.cookie = 'semog-consent=; max-age=0; path=/'
})

async function mount(value: string | undefined, measurable = true) {
  vi.stubEnv('NEXT_PUBLIC_RD_TRACKING_SCRIPT_URL', value)
  const { MEASURABLE_HOST } = await import('@/components/analytics/measurableHost')
  vi.spyOn(MEASURABLE_HOST, 'test').mockReturnValue(measurable)
  const { RDStation } = await import('@/components/analytics/RDStation')
  return render(<RDStation />)
}

describe('RD Station', () => {
  it('é no-op sem configuração', async () => {
    vi.resetModules()
    const result = await mount(undefined)
    expect(result.container.querySelector('script')).toBeNull()
  })

  it('não carrega um script de outro domínio', async () => {
    vi.resetModules()
    const result = await mount('https://example.com/loader.js')
    expect(result.container.querySelector('script')).toBeNull()
  })

  it('não carrega fora do host mensurável', async () => {
    vi.resetModules()
    const result = await mount(url, false)
    expect(result.container.querySelector('script')).toBeNull()
  })

  it('carrega sem exigir decisão nova', async () => {
    vi.resetModules()
    const result = await mount(url)
    await waitFor(() => expect(result.container.querySelector('script')?.src).toBe(url))
    expect(result.container.querySelector('script')?.getAttribute('data-strategy')).toBe(
      'lazyOnload',
    )
  })

  it('lê o opt-out persistido antes do primeiro carregamento do provider', async () => {
    vi.resetModules()
    const rejected = { necessary: true, analytics: true, marketing: false }
    // biome-ignore lint/suspicious/noDocumentCookie: exercita a preferência persistida antes da hidratação.
    document.cookie = `semog-consent=${encodeURIComponent(JSON.stringify(rejected))}; path=/`
    const result = await mount(url)
    expect(result.container.querySelector('script')).toBeNull()
  })
})
