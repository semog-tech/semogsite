import { cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

vi.mock('next/script', () => ({ default: () => null }))

afterEach(() => {
  cleanup()
  delete window.turnstile
  vi.unstubAllEnvs()
  vi.resetModules()
})

it('Turnstile entrega o token pelo callback sem criar campo capturável pelo RD', async () => {
  vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', 'site-key-de-teste')
  const renderWidget = vi.fn<NonNullable<Window['turnstile']>['render']>(() => 'widget-id')
  window.turnstile = { render: renderWidget, reset: vi.fn(), remove: vi.fn() }
  const onToken = vi.fn()
  const { Turnstile } = await import('@/components/forms/Turnstile')

  render(<Turnstile onToken={onToken} theme="dark" />)

  await waitFor(() => expect(renderWidget).toHaveBeenCalledOnce())
  const [, options] = renderWidget.mock.calls[0]
  expect(options['response-field']).toBe(false)
  options.callback('token-de-teste')
  expect(onToken).toHaveBeenCalledWith('token-de-teste')
})
