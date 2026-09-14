import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { site } from '@/../content/site'
import { ExperienceKit } from '@/components/experience/ExperienceKit'
import { ExperienceProgram } from '@/components/experience/ExperienceProgram'
import { ExperienceSponsors } from '@/components/experience/ExperienceSponsors'
import { ExperienceVideo } from '@/components/experience/ExperienceVideo'
import { EXPERIENCE_EVENT } from '@/data/experienceEvent'
import { EXPERIENCE_SPONSORS } from '@/data/experienceSponsors'

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
    expect(abas[0]?.textContent).toContain('Pilates')
    expect(abas[abas.length - 1]?.textContent).toContain('Treino funcional')
  })

  /**
   * O credenciamento das 07h e a confraternização saíram da grade em
   * 14/09/2026 — a manhã são as três aulas. Aqui porque o texto deles sobrevive
   * fácil num `<meta>`, num e-mail ou num painel e ninguém repara.
   */
  it('não mostra mais credenciamento nem confraternização', () => {
    const { container } = render(<ExperienceProgram />)
    expect(container.textContent).not.toMatch(/credenciamento|confraterniza/i)
  })

  it('mostra o horário formatado em pt-BR, sem numeração decorativa', () => {
    const { container } = render(<ExperienceProgram />)
    // Todo bloco agora é aula, e aula tem fim: o rótulo é a faixa inteira
    // ('07h30' + o `<small>` com 'às 08h15'), sem espaço entre os dois nós.
    const horas = Array.from(container.querySelectorAll('.sched .h')).map((n) => n.textContent)
    expect(horas).toEqual(['07h30às 08h15', '08h20às 09h05', '09h10às 09h55'])
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

    const pilates = within(painelDe(0))
    expect(pilates.getByRole('link', { name: 'Paloma Menezes' }).getAttribute('href')).toBe(
      'https://www.instagram.com/pilatespalomamenezes/',
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
    fireEvent.click(abas[2] as HTMLElement)

    expect(abas[0]?.getAttribute('aria-selected')).toBe('false')
    expect(abas[2]?.getAttribute('aria-selected')).toBe('true')
    // `hidden` esconde os inativos, então só sobra um painel acessível.
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1)
  })

  it('anuncia que café, água e avaliação física valem o evento inteiro, sem hora na agenda', () => {
    const { container } = render(<ExperienceProgram />)
    const continuos = container.querySelector('.ongoing')?.textContent ?? ''
    expect(continuos).toContain('Água e água de coco')
    expect(continuos).toContain('Café da manhã')
    expect(continuos).toContain('Avaliação física e de saúde')
    expect(continuos).toContain('07h30 às 10h')
    // No RENDER, não só no dado: a quantidade de água de coco não pode
    // aparecer na tela. O dado tem o seu próprio teste em `experience-data`.
    expect(continuos).not.toMatch(/\d+\s*(águas?|cocos?|unidades?)/i)
    // A água de coco já foi um item com hora marcada na primeira grade; virou
    // oferta contínua e não pode voltar para a linha do tempo.
    const agenda = container.querySelector('.sched')?.textContent ?? ''
    expect(agenda).not.toContain('Hidratação')
    expect(agenda).not.toContain('água de coco')
  })

  /**
   * O local foi confirmado em 14/09/2026 e a ressalva "aguardando retorno da
   * prefeitura" saiu do dado e dos componentes. O que o painel mostra agora é o
   * ponto de referência — que é o que coloca a pessoa no lugar certo.
   */
  it('mostra o ponto de referência do local, e nenhuma ressalva', () => {
    const { container } = render(<ExperienceProgram />)
    const legenda = container.querySelector('.place.is-active .ploc')?.textContent ?? ''
    expect(legenda).toContain(EXPERIENCE_EVENT.venue)
    expect(legenda).toContain(EXPERIENCE_EVENT.district)
    expect(legenda).toContain(EXPERIENCE_EVENT.venueReference)
    expect(container.textContent).not.toMatch(/a confirmar|prefeitura/i)
  })

  it('oferece um controle para parar a passagem automática', () => {
    render(<ExperienceProgram />)
    // WCAG 2.2.2: conteúdo que se move sozinho por mais de 5s precisa de um
    // jeito de parar. O rótulo tem que dizer o que o botão faz — não pode ser
    // só um ícone.
    const controle = screen.getByRole('button', { name: /autom[áa]tic/i })
    expect(controle.getAttribute('aria-pressed')).toBeTruthy()
  })

  it('esconde os painéis inativos por atributo, não só por CSS', () => {
    const { container } = render(<ExperienceProgram />)
    // A folha de estilo não é carregada aqui — se a ocultação dependesse dela,
    // os seis painéis seriam lidos em sequência pelo leitor de tela.
    const inativos = [...container.querySelectorAll('[role="tabpanel"]')].filter(
      (p) => p.getAttribute('aria-hidden') === 'true',
    )
    expect(inativos).toHaveLength(EXPERIENCE_EVENT.schedule.length - 1)
    for (const p of inativos) expect(p.hasAttribute('inert')).toBe(true)
  })
})

/**
 * A seção existe para responder "e como eu pego minha camiseta?" antes de a
 * pessoa chegar na praia sem kit. O que não pode se perder: a regra de que não
 * há entrega no dia, e o endereço vindo de `content/site.ts` — redigitado aqui
 * ele viraria uma quinta cópia livre para divergir das outras quatro.
 */
describe('ExperienceKit', () => {
  it('lista o que vem no kit, a partir do dado', () => {
    const { container } = render(<ExperienceKit />)
    const itens = [...container.querySelectorAll('.kit-itens li')].map((n) => n.textContent)
    expect(itens).toEqual([...EXPERIENCE_EVENT.kit.items])
  })

  it('diz a partir de quando retirar, com a data legível por máquina', () => {
    const { container } = render(<ExperienceKit />)
    const quando = container.querySelector('.kit-quando time')
    expect(quando?.getAttribute('datetime')).toBe(EXPERIENCE_EVENT.kit.pickup.fromDate)
    expect(quando?.textContent).toContain(EXPERIENCE_EVENT.kit.pickup.fromDateLabel)
  })

  it('avisa, sem rodeio, que não há entrega no dia do evento', () => {
    const { container } = render(<ExperienceKit />)
    expect(container.querySelector('.kit-aviso')?.textContent).toMatch(
      /não há entrega no dia do evento/i,
    )
  })

  it('mostra o endereço real da filial, lido de content/site.ts', () => {
    const { container } = render(<ExperienceKit />)
    const daFonte = site.company.addresses.find((e) => e.city === EXPERIENCE_EVENT.city)?.address
    expect(daFonte).toBeDefined()
    expect(container.querySelector('.kit-onde span')?.textContent).toBe(daFonte)
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

  it('rotula a cota de cada patrocinador, na ordem da hierarquia', () => {
    const { container } = render(<ExperienceSponsors />)
    const cotas = [...container.querySelectorAll('.sponsor-tiers dt')].map((n) => n.textContent)
    expect(cotas).toEqual(['Diamante', 'Bronze'])

    // O rótulo precisa estar casado com o logo certo, não só presente na página.
    const grupoDiamante = container.querySelectorAll('.sponsor-tiers .tier')[0]
    expect(
      within(grupoDiamante as HTMLElement)
        .getByRole('img')
        .getAttribute('alt'),
    ).toBe('Superlógica')
  })

  it('não mostra coluna vazia para cota sem patrocinador', () => {
    const { container } = render(<ExperienceSponsors />)
    for (const grupo of container.querySelectorAll('.sponsor-tiers .tier')) {
      expect(grupo.querySelectorAll('img').length).toBeGreaterThan(0)
    }
  })

  it('anuncia como disponíveis exatamente as cotas que ninguém ocupa', () => {
    render(<ExperienceSponsors />)
    const ocupadas = new Set(EXPERIENCE_SPONSORS.map((s) => s.tier))
    const aside = screen.getByText(/Quer apoiar/).textContent ?? ''
    // Derivado do dado, não de uma lista escrita à mão: quando a Ouro fechar,
    // o convite tem que parar de oferecê-la sozinho.
    for (const [tier, label] of [
      ['diamante', 'Diamante'],
      ['ouro', 'Ouro'],
      ['prata', 'Prata'],
      ['bronze', 'Bronze'],
    ] as const) {
      if (ocupadas.has(tier)) expect(aside).not.toContain(label)
      else expect(aside).toContain(label)
    }
  })
})
