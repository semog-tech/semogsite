import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LearnCenterBlock } from '@/blocks/LearnCenter/Component'

const base = {
  blockType: 'learnCenter' as const,
  title: 'Ninguém deveria precisar ligar para aprender a usar um aplicativo.',
}

const guides = [
  {
    title: 'Primeiro acesso e validação de dados',
    steps: [{ text: 'Baixe o aplicativo.' }, { text: 'Toque em Conecte-se.' }],
    note: 'Não recebeu o e-mail? Confira o spam.',
  },
]

describe('LearnCenterBlock', () => {
  it('renderiza a aba de passo a passo com os guias — no HTML do servidor', () => {
    // Sem `role="tab"` selecionado: o teste lê o texto direto do DOM (sem
    // clique), confirmando que o guia está no HTML renderizado no servidor,
    // não escondido atrás de um `if` client-side — é o que o Google indexa.
    render(<LearnCenterBlock {...base} guides={guides} />)
    expect(screen.getByText('Primeiro acesso e validação de dados')).toBeDefined()
    expect(screen.getByText('Baixe o aplicativo.')).toBeDefined()
    expect(screen.getByText('Não recebeu o e-mail? Confira o spam.')).toBeDefined()
  })

  it('numera os guias', () => {
    render(<LearnCenterBlock {...base} guides={guides} />)
    expect(screen.getByText('01')).toBeDefined()
  })

  it('renderiza card de vídeo inativo (sem link) quando não há videoUrl', () => {
    const { container } = render(
      <LearnCenterBlock
        {...base}
        videos={[{ title: 'Primeiro acesso', text: 'Como validar.', duration: '1:40' }]}
      />,
    )
    expect(screen.getByText('Primeiro acesso')).toBeDefined()
    expect(screen.getByText('1:40')).toBeDefined()
    expect(container.querySelector('a.learn-vid')).toBeNull()
  })

  it('vira link quando há videoUrl', () => {
    render(
      <LearnCenterBlock
        {...base}
        videos={[
          { title: 'Primeiro acesso', duration: '1:40', videoUrl: 'https://youtu.be/abc123' },
        ]}
      />,
    )
    const link = screen.getByRole('link', { name: /primeiro acesso/i })
    expect(link.getAttribute('href')).toBe('https://youtu.be/abc123')
  })

  it('só mostra as abas que têm conteúdo', () => {
    // Com duas listas preenchidas a barra de abas aparece (uma aba solitária
    // não apareceria — ver o teste seguinte); a terceira (materiais), vazia,
    // não deve virar aba.
    render(
      <LearnCenterBlock
        {...base}
        guides={guides}
        videos={[{ title: 'Primeiro acesso', duration: '1:40', videoUrl: 'https://x' }]}
      />,
    )
    expect(screen.getByRole('tab', { name: /passo a passo/i })).toBeDefined()
    expect(screen.getByRole('tab', { name: /vídeos/i })).toBeDefined()
    expect(screen.queryByRole('tab', { name: /material/i })).toBeNull()
  })

  it('não renderiza a barra de abas com um painel só', () => {
    const { container } = render(<LearnCenterBlock {...base} guides={guides} />)
    expect(container.querySelector('[role="tablist"]')).toBeNull()
  })

  it('renderiza a barra de abas quando há mais de um painel, com aria-selected/tabpanel', () => {
    render(
      <LearnCenterBlock
        {...base}
        guides={guides}
        videos={[{ title: 'Primeiro acesso', duration: '1:40', videoUrl: 'https://x' }]}
      />,
    )
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(2)
    expect(tabs[0].getAttribute('aria-selected')).toBe('true')
    expect(screen.getAllByRole('tabpanel').length).toBeGreaterThan(0)
  })

  it('não renderiza nada quando as três listas estão vazias', () => {
    const { container } = render(<LearnCenterBlock {...base} />)
    expect(container.firstChild).toBeNull()
  })

  it('renderiza os materiais com tipo e descrição', () => {
    render(
      <LearnCenterBlock
        {...base}
        materials={[{ kind: 'PDF A3', title: 'Cartaz com QR Code', text: 'Para o hall.' }]}
      />,
    )
    expect(screen.getByText('PDF A3')).toBeDefined()
    expect(screen.getByText('Cartaz com QR Code')).toBeDefined()
  })
})
