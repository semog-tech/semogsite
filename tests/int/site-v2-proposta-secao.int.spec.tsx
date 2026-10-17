import { readFileSync } from 'node:fs'
import path from 'node:path'
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { conteudo } from '@/site/conteudo/conteudo'
import { SecaoProposta } from '@/site/secoes/proposta/SecaoProposta'
import { diferencasNaoDeclaradas, SEM_DIFERENCA, secaoDoPrototipo } from './helpers/prototipo'

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))
vi.mock('@/app/(site)/_actions/proposta-duas-etapas', () => ({
  enviarEtapa1: vi.fn(),
  enviarEtapa2: vi.fn(),
  enviarPropostaCompleta: vi.fn(),
}))
vi.mock('@/components/forms/Turnstile', () => ({ Turnstile: () => null }))

describe('seção de proposta "Metades" (cena 08 do protótipo)', () => {
  it('tem a marcação do protótipo, com o formulário da fase 2 no lugar do formulário demonstrativo', () => {
    const { container } = render(<SecaoProposta />)
    const secao = container.querySelector('section#proposta')
    expect(secao).not.toBeNull()
    expect(
      diferencasNaoDeclaradas(secao as Element, secaoDoPrototipo('08-proposta'), {
        ignorar: ['form', '.fp-moldura'],
        comClasses: ['proposta-metades'],
      }),
    ).toEqual(SEM_DIFERENCA)
    expect(secao?.querySelector('.proposta-titulo')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      conteudo.proposta.titulo,
    )
  })

  it('o formulário entra por cascata: título e campos da etapa 1 com .entrada, a etapa 2 sem', () => {
    const { container } = render(<SecaoProposta />)
    const form = container.querySelector('form.formulario-proposta.proposta-form')
    expect(form).not.toBeNull()
    expect(form?.querySelector('.fp-titulo.entrada')).not.toBeNull()
    expect(form?.querySelector('.fp-titulo')?.textContent).toBe('Peça uma proposta')
    expect(form?.querySelectorAll('[data-etapa="1"] .fp-campo.entrada')).toHaveLength(4)
    // Como no protótipo, o "Continuar" entra na cascata depois dos campos.
    expect(form?.querySelector('[data-etapa="1"] .fp-acoes.entrada')).not.toBeNull()
    expect(form?.querySelectorAll('[data-etapa="2"] .entrada')).toHaveLength(0)
  })

  it('perfilInicial marca a opção da etapa 2 quando a URL não traz ?perfil', () => {
    window.history.replaceState(null, '', '/')
    const { container } = render(<SecaoProposta perfilInicial="construtora" />)
    const opcao = container.querySelector<HTMLInputElement>(
      'input[name="perfil"][value="construtora"]',
    )
    expect(opcao?.checked).toBe(true)
  })

  it('a URL vence o perfil inicial', () => {
    window.history.replaceState(null, '', '/?perfil=sindico')
    const { container } = render(<SecaoProposta perfilInicial="construtora" />)
    expect(
      container.querySelector<HTMLInputElement>('input[name="perfil"][value="sindico"]')?.checked,
    ).toBe(true)
    window.history.replaceState(null, '', '/')
  })

  it('o CSS da cena 08 vale só para a seção Metades (a página /proposta também tem #proposta)', () => {
    const css = readFileSync(
      path.join(process.cwd(), 'src', 'site', 'secoes', 'proposta', 'proposta.css'),
      'utf8',
    ).replace(/\r\n?/g, '\n')
    expect(css).toContain('#proposta.proposta-metades')
    expect(css.replace(/#proposta\.proposta-metades/g, '')).not.toMatch(/#proposta\b/)
  })

  it('pendências visuais da fase 2: sem vão a 390 e anel no título da falha', () => {
    const css = readFileSync(
      path.join(process.cwd(), 'src', 'site', 'formularios', 'proposta', 'formulario-proposta.css'),
      'utf8',
    ).replace(/\r\n?/g, '\n')
    expect(css).toMatch(/\.fp-falha-titulo:focus-visible\s*\{[^}]*outline:/)
    expect(css).toMatch(
      /@media \(max-width: 760px\)\s*\{\s*html\.js \.formulario-proposta:not\(\[data-transicao\]\)/,
    )
  })
})
