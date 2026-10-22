import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AttributionTracker } from '@/components/analytics/AttributionTracker'
import { resolverOrigem } from '@/lib/origemDoLead'
import { lerOrigemDoNavegador } from '@/lib/origemDoNavegador'

/**
 * O lado do navegador da origem do lead: o que o formulário manda junto do
 * envio quando o cookie não chega ao servidor (lead 218, Instagram no iOS).
 * O cenário que importa é o cookie bloqueado: a pessoa entra na home com
 * `fbclid`, navega para outra página e envia lá.
 */

function apagarCookie() {
  // biome-ignore lint/suspicious/noDocumentCookie: limpar o cookie do jsdom entre testes
  document.cookie = 'semog-attrib=; path=/; max-age=0'
}

function irPara(url: string) {
  window.history.replaceState(null, '', url)
}

/** O jsdom grava cookie; aqui ele finge o navegador que não grava nenhum. */
function bloquearCookies() {
  vi.spyOn(document, 'cookie', 'get').mockReturnValue('')
  vi.spyOn(document, 'cookie', 'set').mockImplementation(() => {})
}

beforeEach(() => {
  apagarCookie()
  window.sessionStorage.clear()
  irPara('/')
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('lerOrigemDoNavegador', () => {
  it('com cookie, manda o cookie', () => {
    irPara('/?gclid=Cj0-do-cookie')
    render(<AttributionTracker />)
    irPara('/proposta')

    const origem = resolverOrigem(undefined, lerOrigemDoNavegador())
    expect(origem.atribuicao?.first.gclid).toBe('Cj0-do-cookie')
  })

  it('cookie bloqueado: o fbclid da home sobrevive à navegação pela cópia da sessão', () => {
    bloquearCookies()
    irPara('/?fbclid=IwAR-teste')
    render(<AttributionTracker />).unmount()
    // Outra página: o tracker roda de novo, sem o fbclid na URL.
    irPara('/proposta')
    render(<AttributionTracker />)

    const origem = resolverOrigem(undefined, lerOrigemDoNavegador())
    expect(origem.fonte).toBe('navegador')
    expect(origem.atribuicao?.first).toMatchObject({ fbclid: 'IwAR-teste', landing: '/' })
  })

  it('sem cookie nem sessão: cai para a URL atual', () => {
    bloquearCookies()
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    irPara('/?fbclid=IwAR-so-na-url&utm_source=instagram')

    const origem = resolverOrigem(undefined, lerOrigemDoNavegador())
    expect(origem.atribuicao?.first).toMatchObject({
      fbclid: 'IwAR-so-na-url',
      source: 'instagram',
      landing: '/',
    })
  })

  it('armazenamento que lança não derruba o tracker', () => {
    bloquearCookies()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    expect(() => render(<AttributionTracker />)).not.toThrow()
  })
})
