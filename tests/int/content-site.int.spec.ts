import { describe, expect, it } from 'vitest'
import { site } from '@/../content/site'

describe('content/site — globais', () => {
  it('header tem navItems, cta e área do cliente', () => {
    expect(site.header.navItems.length).toBeGreaterThan(0)
    expect(site.header.cta.href).toBeTruthy()
  })
  it('footer tem colunas e links legais', () => {
    expect(site.footer.columns.length).toBeGreaterThan(0)
    expect(site.footer.legalLinks.length).toBeGreaterThan(0)
  })
  it('company tem whatsapp', () => {
    expect(site.company.whatsapp).toMatch(/^\d+$/)
  })
})
