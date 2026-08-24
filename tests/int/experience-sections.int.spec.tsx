import { fireEvent, render, screen, within } from '@testing-library/react'
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
  it('lista todos os blocos da manhã na ordem', () => {
    render(<ExperienceProgram />)
    const abas = screen.getAllByRole('tab')
    expect(abas).toHaveLength(EXPERIENCE_EVENT.schedule.length)
    expect(abas[0]?.textContent).toContain('Recepção e credenciamento')
    expect(abas[abas.length - 1]?.textContent).toContain('encerramento')
  })

  it('mostra o horário formatado em pt-BR, sem numeração decorativa', () => {
    const { container } = render(<ExperienceProgram />)
    const horas = Array.from(container.querySelectorAll('.sched .h')).map((n) => n.textContent)
    expect(horas[0]).toBe('07h00')
    expect(horas).toHaveLength(EXPERIENCE_EVENT.schedule.length)
  })

  it('credita quem conduz cada aula e linka o Instagram de quem tem', () => {
    render(<ExperienceProgram />)
    const abas = screen.getAllByRole('tab')
    // O crédito vive no painel, e painel fechado é `hidden` — inacessível
    // para as queries e para o leitor de tela. Por isso cada aula é conferida
    // com a sua aba aberta, e não na renderização inicial.
    const painelDe = (i: number) => {
      fireEvent.click(abas[i] as HTMLElement)
      return screen.getByRole('tabpanel')
    }

    const pilates = within(painelDe(1))
    expect(pilates.getByRole('link', { name: 'Paloma Menezes' }).getAttribute('href')).toBe(
      'https://www.instagram.com/pilatespalomamenezes/'
    )

    // Quem ainda não mandou o perfil aparece como texto — nunca como link
    // para lugar nenhum. Ver o comentário de `Professional` no dado.
    const funcional = within(painelDe(2))
    expect(funcional.getByText(/Igor Barros/)).toBeDefined()
    expect(funcional.queryByRole('link', { name: 'Igor Barros' })).toBeNull()
  })

  it('abre o painel da atividade escolhida e fecha o anterior', () => {
    render(<ExperienceProgram />)
    const abas = screen.getAllByRole('tab')

    expect(abas[0]?.getAttribute('aria-selected')).toBe('true')
    fireEvent.click(abas[3] as HTMLElement)

    expect(abas[0]?.getAttribute('aria-selected')).toBe('false')
    expect(abas[3]?.getAttribute('aria-selected')).toBe('true')
    // `hidden` esconde os inativos, então só sobra um painel acessível.
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1)
  })

  it('anuncia que água e avaliação física valem o evento inteiro, sem hora na agenda', () => {
    const { container } = render(<ExperienceProgram />)
    const continuos = container.querySelector('.ongoing')?.textContent ?? ''
    expect(continuos).toContain('Água e água de coco')
    expect(continuos).toContain('Avaliação física e de saúde')
    expect(continuos).toContain('08h às 12h')
    // A água de coco já foi um item com hora marcada na primeira grade; virou
    // oferta contínua e não pode voltar para a linha do tempo.
    const agenda = container.querySelector('.sched')?.textContent ?? ''
    expect(agenda).not.toContain('Hidratação')
    expect(agenda).not.toContain('água de coco')
  })

  it('avisa que o local ainda depende da prefeitura', () => {
    render(<ExperienceProgram />)
    expect(screen.getAllByText(EXPERIENCE_EVENT.venueNote).length).toBeGreaterThan(0)
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
