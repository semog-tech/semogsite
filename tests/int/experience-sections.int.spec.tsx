import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ExperienceProgram } from '@/components/experience/ExperienceProgram'
import { ExperienceSponsors } from '@/components/experience/ExperienceSponsors'
import { ExperienceVideo } from '@/components/experience/ExperienceVideo'
import { EXPERIENCE_EVENT } from '@/data/experienceEvent'

/**
 * As seções são um porte do protótipo aprovado
 * (`docs/superpowers/specs/2026-08-21-semog-experience-prototipo.html`): o que
 * estes testes protegem não é o visual, é o que não pode se perder no porte —
 * a programação sair do dado e na ordem, a página dizer que a edição anterior
 * teve outro formato, o Reel tocar no próprio site (nunca embed do Instagram)
 * e o patrocinador aparecer com alt e link reais.
 *
 * Sem `@testing-library/jest-dom` no projeto (ver `vitest.setup.ts`): as
 * asserções usam `toBeDefined()`/`getAttribute`/`textContent`, como os demais
 * specs de `tests/int/`, e não `toBeInTheDocument`/`toHaveAttribute`.
 */

describe('ExperienceProgram', () => {
  it('lista os sete blocos da manhã na ordem', () => {
    render(<ExperienceProgram />)
    const itens = screen.getAllByRole('listitem')
    expect(itens).toHaveLength(EXPERIENCE_EVENT.schedule.length)
    expect(itens[0]?.textContent).toContain('Recepção e alongamento inicial')
    expect(itens[itens.length - 1]?.textContent).toContain('Encerramento')
  })

  it('mostra o horário formatado em pt-BR, sem numeração decorativa', () => {
    const { container } = render(<ExperienceProgram />)
    const horas = Array.from(container.querySelectorAll('.sched .h')).map((n) => n.textContent)
    expect(horas[0]).toBe('07h00')
    expect(horas).toHaveLength(EXPERIENCE_EVENT.schedule.length)
  })
})

describe('ExperienceVideo', () => {
  it('diz que a edição anterior teve outro formato', () => {
    render(<ExperienceVideo />)
    expect(screen.getByText(/beach tennis/i)).toBeDefined()
    // O plano pedia `getByText(/2025/)`; o ano aparece em três lugares
    // (título, nota e legenda) e o singular lançaria "found multiple
    // elements". O que importa é que o ano venha do dado, não de literal.
    const ano = new RegExp(String(EXPERIENCE_EVENT.video.previousYear))
    expect(screen.getAllByText(ano).length).toBeGreaterThan(0)
  })

  it('toca o Reel no próprio site, sem embed do Instagram', () => {
    const { container } = render(<ExperienceVideo />)
    const video = container.querySelector('video')
    expect(video?.getAttribute('poster')).toContain(EXPERIENCE_EVENT.video.poster)
    expect(video?.getAttribute('preload')).toBe('none')
    expect(container.querySelector('source')?.getAttribute('src')).toContain(
      EXPERIENCE_EVENT.video.file,
    )
    expect(container.querySelector('iframe')).toBeNull()
  })
})

describe('ExperienceSponsors', () => {
  it('mostra o logo da Superlógica com alt e link', () => {
    render(<ExperienceSponsors />)
    const link = screen.getByRole('link', { name: /superlógica/i })
    expect(link.getAttribute('href')).toBe('https://www.superlogica.com/')
    expect(within(link).getByRole('img').getAttribute('alt')).toBe('Superlógica')
  })

  it('mantém a faixa em superfície clara, como exige a marca do patrocinador', () => {
    const { container } = render(<ExperienceSponsors />)
    const section = container.querySelector('section')
    expect(section?.className).toMatch(/s-(white|paper)/)
  })
})
