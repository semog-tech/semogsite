# Redesign da Home — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Colocar prova social e o aplicativo na home, e redesenhar as três seções que gastam muita tela para pouca informação — sem mudar a linguagem visual e sem alterar nenhuma outra página.

**Architecture:** Nada de bloco novo. Seis blocos existentes ganham campos e variantes **opcionais**, com todos os defaults preservados, para que `/solucoes`, `/garante` e as landings de cidade continuem idênticas. A ordem final da home vem do seed (`src/seed/home.ts`), que sobe de 11 para 13 blocos.

**Tech Stack:** Next.js 16, React 19, Payload 3.86 (postgres), Tailwind 4, TypeScript 5.7, Vitest 4 + Testing Library, Playwright 1.58, pnpm 10.

## Global Constraints

- Gerenciador de pacotes: `pnpm` (v10.12.4). Nunca `npm`/`yarn`.
- Antes de cada commit: `pnpm check` e `pnpm exec tsc --noEmit` limpos.
- Comentários de código em português, explicando o **porquê**, no padrão dos arquivos vizinhos.
- **Todo campo novo é opcional e toda variante nova entra em `select` existente sem mudar o `defaultValue`.** Qualquer página existente que mude de aparência é regressão.
- Blocos compartilhados com outras páginas: `stats` (`/semog`, landings), `pillars` (`/semog`, `/administracao-de-condominios`, `/garante`), `appShowcase` (`/solucoes`), `testimonials` (landings de cidade), `ctaBand` (quase todas). Cuidado redobrado nos seis.
- Depois de mexer em qualquer `config.ts` de bloco: `pnpm generate:types` e commitar `src/payload-types.ts` junto. O CI falha se houver drift.
- Paleta e tipografia vêm de `src/styles/theme.css` (`@theme`). Não introduzir cor nova fora dos tokens.
- Conteúdo real, nunca placeholder. Se o conteúdo de uma seção não existir (depoimentos, fotos), o bloco simplesmente não entra no seed — ver Task 8.

## Referência visual

Mockup aprovado: https://claude.ai/code/artifact/10d1ffc1-7286-4938-bf69-9af0b5787ba3 (aba "Home proposta").
Spec: `docs/superpowers/specs/2026-07-23-home-redesign-e-pagina-aplicativo-design.md`.

---

### Task 1: Habilitar testes de componente

`vitest.config.mts` só coleta `*.int.spec.ts`, então nenhum teste com JSX é encontrado. E o `import` de `src/motion/gsap.ts` registra o ScrollTrigger, que chama `window.matchMedia` — inexistente em jsdom. Sem estas duas correções, todo teste de bloco deste plano falha antes de rodar.

**Files:**
- Modify: `vitest.config.mts:10`
- Modify: `vitest.setup.ts`
- Test: `tests/int/setup.int.spec.tsx`

**Interfaces:**
- Consumes: nada.
- Produces: a capacidade de renderizar qualquer bloco com `@testing-library/react` dentro de `tests/int/*.int.spec.tsx`. Todas as tasks seguintes dependem disso.

- [ ] **Step 1: Escrever o teste que falha**

Create `tests/int/setup.int.spec.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Section } from '@/components/ui/Section'

describe('ambiente de teste', () => {
  it('coleta arquivos .tsx e renderiza componentes do projeto', () => {
    render(<Section>conteúdo</Section>)
    expect(screen.getByText('conteúdo')).toBeDefined()
  })

  it('tem matchMedia disponível para o gsap', () => {
    expect(typeof window.matchMedia).toBe('function')
    expect(window.matchMedia('(max-width: 768px)').matches).toBe(false)
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `pnpm exec vitest run --config ./vitest.config.mts`
Expected: `No test files found` — o `include` não casa com `.tsx`.

- [ ] **Step 3: Ampliar o include**

Modify `vitest.config.mts`, linha 10. Troque:

```ts
    include: ['tests/int/**/*.int.spec.ts'],
```

por:

```ts
    include: ['tests/int/**/*.int.spec.{ts,tsx}'],
```

- [ ] **Step 4: Rodar e confirmar que falha por outro motivo**

Run: `pnpm exec vitest run --config ./vitest.config.mts`
Expected: FAIL com `TypeError: _win.matchMedia is not a function`, vindo de `gsap/ScrollTrigger` via `src/motion/gsap.ts:6`.

- [ ] **Step 5: Adicionar o polyfill**

Adicione ao fim de `vitest.setup.ts`:

```ts
// O jsdom não implementa `matchMedia`, e o `gsap/ScrollTrigger` chama no
// momento do import (`src/motion/gsap.ts`) — sem isto, qualquer teste que
// importe um bloco quebra antes de renderizar. `matches: false` faz os
// componentes assumirem desktop, que é o caso base dos testes.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}
```

- [ ] **Step 6: Rodar e confirmar que passa**

Run: `pnpm exec vitest run --config ./vitest.config.mts`
Expected: PASS, 2 testes.

- [ ] **Step 7: Commit**

```bash
git add vitest.config.mts vitest.setup.ts tests/int/setup.int.spec.tsx
git commit -m "test: habilita testes de componente (include .tsx + matchMedia)"
```

---

### Task 2: Faixa de prova no hero

Hoje o hero termina numa `hero-tagbox` solta no canto direito ("Condomínios. Métricas. Organização.") e não oferece nenhuma prova acima da dobra. A faixa substitui a tagbox por quatro números verificáveis.

**Files:**
- Modify: `src/blocks/Hero/config.ts`
- Modify: `src/blocks/Hero/Component.tsx`
- Modify: `src/styles/theme.css` (dentro de `@layer utilities`)
- Test: `tests/int/hero-proof.int.spec.tsx`

**Interfaces:**
- Consumes: nada.
- Produces: campo `proofItems` no bloco `hero`, tipado em `src/payload-types.ts` como
  `proofItems?: { value: string; label: string; stars?: boolean | null; id?: string | null }[] | null`.
  A Task 8 popula esse campo no seed.

- [ ] **Step 1: Escrever o teste que falha**

Create `tests/int/hero-proof.int.spec.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HeroBlock } from '@/blocks/Hero/Component'

const base = {
  blockType: 'hero' as const,
  headline: 'Preocupe-se apenas\nem morar.',
}

describe('HeroBlock — faixa de prova', () => {
  it('renderiza os itens de prova quando preenchidos', () => {
    render(
      <HeroBlock
        {...base}
        proofItems={[
          { value: '4,8', label: 'no app, 1.133 avaliações', stars: true },
          { value: '+650', label: 'condomínios sob gestão' },
        ]}
      />,
    )
    expect(screen.getByText('4,8')).toBeDefined()
    expect(screen.getByText('no app, 1.133 avaliações')).toBeDefined()
    expect(screen.getByText('+650')).toBeDefined()
  })

  it('não renderiza a faixa quando proofItems está vazio', () => {
    const { container } = render(<HeroBlock {...base} proofItems={[]} />)
    expect(container.querySelector('.hero-proof')).toBeNull()
  })

  it('esconde a tagbox quando há faixa de prova (as duas competem pelo mesmo canto)', () => {
    render(
      <HeroBlock
        {...base}
        tag="Condomínios. Métricas. Organização."
        proofItems={[{ value: '35 anos', label: 'desde 1991' }]}
      />,
    )
    expect(screen.queryByText('Condomínios. Métricas. Organização.')).toBeNull()
    expect(screen.getByText('35 anos')).toBeDefined()
  })

  it('mantém a tagbox quando não há faixa de prova', () => {
    render(<HeroBlock {...base} tag="Condomínios. Métricas. Organização." />)
    expect(screen.getByText('Condomínios. Métricas. Organização.')).toBeDefined()
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/hero-proof.int.spec.tsx`
Expected: FAIL — `proofItems` não existe no tipo e nada é renderizado.

- [ ] **Step 3: Adicionar o campo ao config**

Modify `src/blocks/Hero/config.ts`. Adicione ao array `fields`, logo depois do campo `tag`:

```ts
    {
      name: 'proofItems',
      type: 'array',
      maxRows: 4,
      admin: {
        description:
          'Faixa de prova colada no rodapé do hero (ex.: nota do app, nº de condomínios). Vazio = não renderiza. Quando preenchida, substitui a `tag` — as duas ocupam o mesmo canto.',
      },
      fields: [
        { name: 'value', type: 'text', required: true, admin: { description: 'Ex.: "4,8", "+650"' } },
        { name: 'label', type: 'text', required: true },
        {
          name: 'stars',
          type: 'checkbox',
          defaultValue: false,
          admin: { description: 'Mostra 5 estrelas antes do valor (só faz sentido em nota).' },
        },
      ],
    },
```

- [ ] **Step 4: Regenerar os tipos**

Run: `pnpm generate:types`
Expected: `src/payload-types.ts` ganha `proofItems` em `HeroBlock`.

- [ ] **Step 5: Renderizar a faixa**

Modify `src/blocks/Hero/Component.tsx`.

Adicione à lista de props desestruturadas (junto de `tag`):

```tsx
  proofItems,
```

Adicione, logo abaixo da constante `VIDEO_SEQUENCE_OVERLAY`:

```tsx
/**
 * Faixa de prova no rodapé do hero. Colada na borda inferior da `Section`,
 * acima do scrim, com fundo escuro translúcido para os números ficarem
 * legíveis sobre qualquer frame do vídeo. Substitui a `.hero-tagbox` na home:
 * as duas ocupavam o mesmo canto, e quatro números verificáveis valem mais
 * acima da dobra que três substantivos.
 */
function ProofBar({ items }: { items: NonNullable<HeroBlockType['proofItems']> }) {
  return (
    <div className="hero-proof relative z-[3]">
      <Container>
        <div className="hero-proof-grid">
          {items.map((item) => (
            <div key={item.id ?? item.label} className="hero-proof-item">
              <span className="hero-proof-n">
                {item.stars && (
                  <span className="hero-proof-stars" aria-hidden="true">
                    ★★★★★
                  </span>
                )}
                {item.value}
              </span>
              <span className="hero-proof-l">{item.label}</span>
            </div>
          ))}
        </div>
      </Container>
    </div>
  )
}
```

Logo depois da linha `const hasPriceChip = ...`, adicione:

```tsx
  // A faixa de prova e a tagbox disputam o mesmo canto do hero; com prova
  // preenchida, a tagbox sai.
  const proof = proofItems && proofItems.length > 0 ? proofItems : null
  const showTag = !proof && !!tag
```

No JSX, troque a condição `) : tag ? (` por `) : showTag ? (`.

E, logo antes do fechamento `</Section>`, depois do `</Container>`, adicione:

```tsx
      {proof && <ProofBar items={proof} />}
```

- [ ] **Step 6: Estilizar a faixa**

Adicione ao fim de `src/styles/theme.css`, dentro do `@layer utilities` existente:

```css
  /* Faixa de prova do hero — quatro números colados no rodapé da seção,
     sobre o vídeo. Fundo escuro translúcido porque o frame por baixo varia
     e os números precisam de contraste em qualquer um deles. */
  .hero-proof {
    margin-top: auto;
    border-top: 1px solid var(--line);
    background: rgba(5, 8, 26, 0.5);
    backdrop-filter: blur(16px);
  }
  .hero-proof-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
  }
  .hero-proof-item {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    padding: 1.35rem 1.6rem;
    border-left: 1px solid var(--line);
  }
  .hero-proof-item:first-child {
    border-left: 0;
    padding-left: 0;
  }
  .hero-proof-n {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-family: var(--font-display);
    font-weight: 600;
    font-size: clamp(1.35rem, 2.2vw, 1.85rem);
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
  }
  .hero-proof-stars {
    color: #ffc24a;
    font-size: 0.95rem;
    letter-spacing: 0.05em;
  }
  .hero-proof-l {
    font-size: 0.78rem;
    color: var(--text-3);
  }
  @media (max-width: 820px) {
    .hero-proof-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .hero-proof-item:nth-child(3) {
      border-left: 0;
      padding-left: 0;
    }
    .hero-proof-item:nth-child(-n + 2) {
      border-bottom: 1px solid var(--line);
    }
  }
```

- [ ] **Step 7: Rodar e confirmar que passa**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/hero-proof.int.spec.tsx`
Expected: PASS, 4 testes.

- [ ] **Step 8: Verificar lint e tipos**

Run: `pnpm check && pnpm exec tsc --noEmit`
Expected: sem erros.

- [ ] **Step 9: Commit**

```bash
git add src/blocks/Hero/config.ts src/blocks/Hero/Component.tsx src/styles/theme.css src/payload-types.ts tests/int/hero-proof.int.spec.tsx
git commit -m "feat(hero): faixa de prova no rodapé do hero"
```

---

### Task 3: Stats — variante `band`

O `variant: 'feature'` da home põe os 5 números numa coluna estreita à esquerda e o `BrazilMap` à direita, deixando um vazio grande embaixo do mapa. A variante nova é uma faixa horizontal de 5, sem mapa.

**Files:**
- Modify: `src/blocks/Stats/config.ts`
- Modify: `src/blocks/Stats/Component.tsx`
- Test: `tests/int/stats-band.int.spec.tsx`

**Interfaces:**
- Consumes: nada.
- Produces: valor `'band'` no `select` `variant` do bloco `stats`. A Task 8 usa esse valor no seed da home.

- [ ] **Step 1: Escrever o teste que falha**

Create `tests/int/stats-band.int.spec.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatsBlock } from '@/blocks/Stats/Component'

const items = [
  { value: 35, label: 'Anos de mercado', detail: 'Desde 1991, sempre no Nordeste.' },
  { value: 650, prefix: '+', label: 'Condomínios', detail: 'Sob gestão completa.' },
  { value: 70, prefix: '+', suffix: 'mil', label: 'Clientes', detail: 'Famílias e empresas.' },
  { value: 100, prefix: '+', label: 'Especialistas', detail: 'Time próprio.' },
  { value: 3, label: 'Estados', detail: 'Pernambuco, Paraíba e Pará.' },
]

describe('StatsBlock — variante band', () => {
  it('renderiza os 5 itens com rótulo e detalhe', () => {
    render(<StatsBlock blockType="stats" variant="band" title="Liderança" items={items} />)
    expect(screen.getByText('Anos de mercado')).toBeDefined()
    expect(screen.getByText('Desde 1991, sempre no Nordeste.')).toBeDefined()
    expect(screen.getByText('Estados')).toBeDefined()
  })

  it('não renderiza o mapa do Brasil', () => {
    const { container } = render(
      <StatsBlock blockType="stats" variant="band" items={items} />,
    )
    expect(container.querySelector('svg[data-brazil-map]')).toBeNull()
  })

  it('a variante feature continua renderizando o mapa', () => {
    const { container } = render(
      <StatsBlock blockType="stats" variant="feature" items={items} />,
    )
    expect(container.querySelector('svg[data-brazil-map]')).not.toBeNull()
  })

  it('sem itens, não renderiza nada', () => {
    const { container } = render(<StatsBlock blockType="stats" variant="band" items={[]} />)
    expect(container.firstChild).toBeNull()
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/stats-band.int.spec.tsx`
Expected: FAIL — `variant="band"` cai no `return` genérico (grade), e o teste do mapa falha porque `BrazilMap` ainda não tem o atributo `data-brazil-map`.

- [ ] **Step 3: Marcar o mapa para o teste**

Modify `src/blocks/Stats/BrazilMap.tsx`: adicione `data-brazil-map` ao elemento `<svg>` raiz. É um gancho de teste estável — não depende de classe nem de estrutura interna.

- [ ] **Step 4: Adicionar a opção ao config**

Modify `src/blocks/Stats/config.ts`. No `select` `variant`, adicione ao array `options`:

```ts
        { label: 'Faixa horizontal de 5 (home)', value: 'band' },
```

Não mexa no `defaultValue`.

- [ ] **Step 5: Regenerar os tipos**

Run: `pnpm generate:types`
Expected: `StatsBlock['variant']` passa a aceitar `'band'`.

- [ ] **Step 6: Implementar a variante**

Modify `src/blocks/Stats/Component.tsx`. Adicione este bloco logo **antes** do `if (variant === 'feature')`:

```tsx
  if (variant === 'band') {
    return (
      <Section light>
        <Container>
          {header}
          <Stagger className="grid grid-cols-2 border-t border-line md:grid-cols-3 xl:grid-cols-5">
            {items.map((item) => (
              <div
                key={item.id ?? item.label}
                className="border-line px-[clamp(0.8rem,1.6vw,1.4rem)] pt-[clamp(1.4rem,2.4vw,2rem)] first:pl-0 xl:border-l xl:first:border-l-0"
              >
                <StatValue
                  item={item}
                  className="font-[family-name:var(--font-display)] font-semibold leading-none tracking-[-0.01em] text-[length:clamp(2rem,3.4vw,3.2rem)] [font-variant-numeric:tabular-nums]"
                />
                <div className="mt-[0.7rem] text-[0.72rem] font-bold uppercase tracking-[0.14em] text-navy-500">
                  {item.label}
                </div>
                {item.detail && (
                  <p className="mb-0 mt-[0.3rem] text-[0.88rem] text-fg-2">{item.detail}</p>
                )}
              </div>
            ))}
          </Stagger>
        </Container>
      </Section>
    )
  }
```

Sobre o mapa: a spec (seção 4.2) previa migrá-lo para a seção `cities`. Esta task apenas **tira** o mapa da home — a variante `band` não o renderiza. Levá-lo para `cities` é trabalho de outra natureza (mexer num bloco que não está no escopo deste redesign) e a spec já registra que pode ser adiado sem bloquear nada. `BrazilMap` continua existindo e sendo usado pela variante `feature`.

E atualize o comentário de bloco do componente, acrescentando ao final da lista de variantes:

```
 * - **`band`** (home, a partir do redesign de jul/2026): faixa horizontal de
 *   5 colunas com divisória vertical, número em Clash sobre `--grad-brand`,
 *   rótulo em caixa alta e frase de apoio. Substituiu o `feature` na home,
 *   onde a coluna estreita à esquerda + mapa à direita deixavam metade da
 *   seção vazia. `feature` segue disponível e inalterado para quem já usa.
```

- [ ] **Step 7: Rodar e confirmar que passa**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/stats-band.int.spec.tsx`
Expected: PASS, 4 testes.

- [ ] **Step 8: Verificar lint e tipos**

Run: `pnpm check && pnpm exec tsc --noEmit`
Expected: sem erros.

- [ ] **Step 9: Commit**

```bash
git add src/blocks/Stats/config.ts src/blocks/Stats/Component.tsx src/blocks/Stats/BrazilMap.tsx src/payload-types.ts tests/int/stats-band.int.spec.tsx
git commit -m "feat(stats): variante band, faixa horizontal de 5 números"
```

---

### Task 4: Pillars — variante `columns`

`compact` só reduz a tipografia da mesma `.pillar-row` de duas colunas. A variante nova troca o layout para colunas.

**Files:**
- Modify: `src/blocks/Pillars/config.ts`
- Modify: `src/blocks/Pillars/Component.tsx`
- Modify: `src/styles/theme.css`
- Test: `tests/int/pillars-columns.int.spec.tsx`

**Interfaces:**
- Consumes: nada.
- Produces: campo `variant` novo no bloco `pillars`, tipado como `('rows' | 'columns') | null | undefined`, com `defaultValue: 'rows'`. Consumido pela Task 8 (home) e pelo plano 03 (página do app, com 2 itens).

- [ ] **Step 1: Escrever o teste que falha**

Create `tests/int/pillars-columns.int.spec.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PillarsBlock } from '@/blocks/Pillars/Component'

const items = [
  { title: 'Condomínios', text: 'Gestão completa de comunidades.' },
  { title: 'Métricas', text: 'Decisões guiadas por dados.' },
  { title: 'Organização', text: 'Processos claros e prazos cumpridos.' },
]

describe('PillarsBlock — variante columns', () => {
  it('renderiza os itens em colunas', () => {
    const { container } = render(
      <PillarsBlock blockType="pillars" variant="columns" items={items} />,
    )
    expect(container.querySelector('.pillars-columns')).not.toBeNull()
    expect(screen.getByText('Condomínios')).toBeDefined()
    expect(screen.getByText('Organização')).toBeDefined()
  })

  it('não usa .pillar-row na variante columns', () => {
    const { container } = render(
      <PillarsBlock blockType="pillars" variant="columns" items={items} />,
    )
    expect(container.querySelector('.pillar-row')).toBeNull()
  })

  it('sem variant, mantém as rows de sempre', () => {
    const { container } = render(<PillarsBlock blockType="pillars" items={items} />)
    expect(container.querySelectorAll('.pillar-row').length).toBe(3)
    expect(container.querySelector('.pillars-columns')).toBeNull()
  })

  it('funciona com 2 itens (página do aplicativo)', () => {
    render(
      <PillarsBlock
        blockType="pillars"
        variant="columns"
        items={[items[0], items[1]]}
      />,
    )
    expect(screen.getByText('Condomínios')).toBeDefined()
    expect(screen.getByText('Métricas')).toBeDefined()
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/pillars-columns.int.spec.tsx`
Expected: FAIL — `.pillars-columns` não existe.

- [ ] **Step 3: Adicionar o campo ao config**

Modify `src/blocks/Pillars/config.ts`. Adicione ao array `fields`, antes de `items`:

```ts
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'rows',
      options: [
        { label: 'Linhas com hover (padrão)', value: 'rows' },
        { label: 'Colunas (home e página do aplicativo)', value: 'columns' },
      ],
      admin: {
        description:
          'Colunas encolhem a seção sem perder conteúdo — as linhas gastam quase uma tela inteira para poucas palavras.',
      },
    },
```

- [ ] **Step 4: Regenerar os tipos**

Run: `pnpm generate:types`

- [ ] **Step 5: Implementar a variante**

Modify `src/blocks/Pillars/Component.tsx`. Adicione `variant` às props desestruturadas e, logo depois do header (antes do `map` que gera as `.pillar-row`), ramifique:

```tsx
  if (variant === 'columns') {
    return (
      <Section light={light} white={white} className={tightTop ? '!pt-0' : undefined}>
        <Container>
          {header}
          <Stagger className="pillars-columns">
            {items.map((item) => (
              <div key={item.id ?? item.title} className="pillar-col">
                {item.glyph && <span className="pillar-col-glyph">{item.glyph}</span>}
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </Stagger>
        </Container>
      </Section>
    )
  }
```

Se o componente já monta o `header` numa variável, reaproveite-a; se ele monta inline, extraia para `const header = ...` antes da ramificação, para os dois caminhos usarem o mesmo.

- [ ] **Step 6: Estilizar as colunas**

Adicione ao fim de `src/styles/theme.css`, dentro de `@layer utilities`:

```css
  /* Pilares em colunas — grade `auto-fit` e não `repeat(3,1fr)`: na home são
     3 pilares, mas em /aplicativo o mesmo bloco renderiza 2 (síndico e
     administradora), e uma grade fixa deixaria um buraco lá. */
  .pillars-columns {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: clamp(1.5rem, 3vw, 3rem);
    margin-top: 2.5rem;
  }
  .pillar-col {
    border-top: 1px solid var(--line-strong);
    padding-top: 1.4rem;
  }
  .pillar-col-glyph {
    display: block;
    margin-bottom: 0.6rem;
    font-family: var(--font-display);
    font-size: 1.4rem;
    color: var(--accent);
  }
  .pillar-col h3 {
    margin: 0 0 0.7rem;
    font-size: clamp(1.4rem, 2.2vw, 1.9rem);
  }
  .pillar-col p {
    margin: 0;
    font-size: 0.95rem;
    color: var(--text-2);
  }
```

- [ ] **Step 7: Rodar e confirmar que passa**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/pillars-columns.int.spec.tsx`
Expected: PASS, 4 testes.

- [ ] **Step 8: Verificar lint e tipos**

Run: `pnpm check && pnpm exec tsc --noEmit`
Expected: sem erros.

- [ ] **Step 9: Commit**

```bash
git add src/blocks/Pillars/config.ts src/blocks/Pillars/Component.tsx src/styles/theme.css src/payload-types.ts tests/int/pillars-columns.int.spec.tsx
git commit -m "feat(pillars): variante columns com grade auto-fit"
```

---

### Task 5: AppShowcase — tema escuro, segunda tela, nota e lojas

O bloco já entrega imagem + eyebrow + título + texto + grade de features + CTA, mas é sempre `sec-light` e aceita uma imagem só. Faltam a nota das lojas e os selos.

**Files:**
- Modify: `src/blocks/AppShowcase/config.ts`
- Modify: `src/blocks/AppShowcase/Component.tsx`
- Create: `src/components/ui/StoreBadges.tsx`
- Modify: `src/styles/theme.css`
- Test: `tests/int/app-showcase.int.spec.tsx`

**Interfaces:**
- Consumes: nada.
- Produces:
  - Campos novos em `appShowcase`: `theme` (`'light' | 'deep'`, default `'light'`), `imageSecondary` (upload), `rating` (group: `score`, `label`), `stores` (group: `appStore`, `playStore`).
  - `StoreBadges` exportado de `@/components/ui/StoreBadges`, assinatura:
    `({ appStore, playStore, className }: { appStore?: string | null; playStore?: string | null; className?: string }) => ReactNode`.
    O plano 03 reusa esse componente no `appHero`.

- [ ] **Step 1: Escrever o teste que falha**

Create `tests/int/app-showcase.int.spec.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppShowcaseBlock } from '@/blocks/AppShowcase/Component'

const base = {
  blockType: 'appShowcase' as const,
  title: 'O condomínio inteiro na palma da mão.',
}

describe('AppShowcaseBlock', () => {
  it('renderiza a nota e o rótulo quando preenchidos', () => {
    render(
      <AppShowcaseBlock
        {...base}
        rating={{ score: '4,8', label: '1.133 avaliações na App Store e no Google Play' }}
      />,
    )
    expect(screen.getByText('4,8')).toBeDefined()
    expect(screen.getByText(/1\.133 avaliações/)).toBeDefined()
  })

  it('renderiza os selos como links reais para as lojas', () => {
    render(
      <AppShowcaseBlock
        {...base}
        stores={{
          appStore: 'https://apps.apple.com/br/app/id6504202916',
          playStore: 'https://play.google.com/store/apps/details?id=br.com.semog',
        }}
      />,
    )
    const apple = screen.getByRole('link', { name: /app store/i })
    const play = screen.getByRole('link', { name: /google play/i })
    expect(apple.getAttribute('href')).toContain('apps.apple.com')
    expect(play.getAttribute('href')).toContain('play.google.com')
  })

  it('omite selo de loja sem URL', () => {
    render(<AppShowcaseBlock {...base} stores={{ appStore: 'https://apps.apple.com/x' }} />)
    expect(screen.getByRole('link', { name: /app store/i })).toBeDefined()
    expect(screen.queryByRole('link', { name: /google play/i })).toBeNull()
  })

  it('não renderiza nota nem selos quando os campos estão vazios', () => {
    const { container } = render(<AppShowcaseBlock {...base} />)
    expect(container.querySelector('.app-rating')).toBeNull()
    expect(container.querySelector('.store-badges')).toBeNull()
  })

  it('aplica o tema escuro quando theme=deep', () => {
    const { container } = render(<AppShowcaseBlock {...base} theme="deep" />)
    const section = container.querySelector('section')
    expect(section?.className).not.toContain('sec-light')
  })

  it('mantém sec-light por padrão (comportamento de /solucoes)', () => {
    const { container } = render(<AppShowcaseBlock {...base} />)
    expect(container.querySelector('section')?.className).toContain('sec-light')
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/app-showcase.int.spec.tsx`
Expected: FAIL — nenhum dos campos existe.

- [ ] **Step 3: Criar o componente de selos**

Create `src/components/ui/StoreBadges.tsx`:

```tsx
import type { ReactNode } from 'react'

/**
 * Selos de App Store e Google Play. SVG inline em vez de imagem: são dois
 * ícones simples, e assim herdam a cor do tema sem precisar de dois arquivos
 * por variante. Cada selo é um link real para a ficha da loja — selo que não
 * clica é decoração, e o objetivo aqui é download.
 *
 * Reusado pelo bloco `appShowcase` (home) e pelo `appHero` (/aplicativo).
 */
export function StoreBadges({
  appStore,
  playStore,
  className = '',
}: {
  appStore?: string | null
  playStore?: string | null
  className?: string
}): ReactNode {
  if (!appStore && !playStore) return null

  return (
    <div className={`store-badges ${className}`.trim()}>
      {appStore && (
        <a className="store-badge" href={appStore} target="_blank" rel="noopener noreferrer">
          <svg className="store-badge-ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M16.4 12.6c0-2.2 1.8-3.3 1.9-3.3-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.3.8-.7 0-1.7-.8-2.8-.8-1.5 0-2.8.9-3.6 2.2-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.6 2.2 2.7 2.1 1.1 0 1.5-.7 2.8-.7s1.7.7 2.8.7c1.2 0 1.9-1 2.6-2.1.8-1.2 1.2-2.4 1.2-2.4-.1 0-2.2-.9-2.2-3.4zM14.3 5.9c.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.6 1.3-.6.6-1.1 1.7-.9 2.6 1 .1 2-.5 2.6-1.2z" />
          </svg>
          <span>
            <small>Baixar na</small>
            <b>App Store</b>
          </span>
        </a>
      )}
      {playStore && (
        <a className="store-badge" href={playStore} target="_blank" rel="noopener noreferrer">
          <svg className="store-badge-ico" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3.6 2.3a1 1 0 00-.5.9v17.6a1 1 0 00.5.9l9.3-9.7z" fill="#34a853" />
            <path d="M17.1 8.2L13.6 6 3.6 2.3c-.1 0-.2-.1-.3-.1l9.6 9.8z" fill="#ea4335" />
            <path d="M17.1 15.8L13.6 18 3.3 21.8c.1 0 .2 0 .3-.1l9.3-9.7z" fill="#fbbc04" />
            <path d="M17.1 8.2l3.4 2c.9.5.9 1.8 0 2.3l-3.4 2-4.2-3.2z" fill="#4285f4" />
          </svg>
          <span>
            <small>Disponível no</small>
            <b>Google Play</b>
          </span>
        </a>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Adicionar os campos ao config**

Modify `src/blocks/AppShowcase/config.ts`. Adicione ao array `fields`, depois de `image`:

```ts
    {
      name: 'theme',
      type: 'select',
      defaultValue: 'light',
      options: [
        { label: 'Claro (padrão — /solucoes)', value: 'light' },
        { label: 'Escuro profundo (home)', value: 'deep' },
      ],
    },
    {
      name: 'imageSecondary',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Segunda tela, exibida atrás da primeira com rotação leve. Vazio = uma imagem só (comportamento original).',
      },
    },
    {
      name: 'rating',
      type: 'group',
      admin: { description: 'Nota pública do app. Só preencher enquanto bater com as lojas.' },
      fields: [
        { name: 'score', type: 'text', admin: { description: 'Ex.: "4,8"' } },
        { name: 'label', type: 'text' },
      ],
    },
    {
      name: 'stores',
      type: 'group',
      fields: [
        { name: 'appStore', type: 'text', admin: { description: 'URL da ficha na App Store' } },
        { name: 'playStore', type: 'text', admin: { description: 'URL da ficha no Google Play' } },
      ],
    },
```

- [ ] **Step 5: Regenerar os tipos**

Run: `pnpm generate:types`

- [ ] **Step 6: Consumir os campos no componente**

Modify `src/blocks/AppShowcase/Component.tsx`:

Adicione às props desestruturadas: `theme`, `imageSecondary`, `rating`, `stores`.

Troque `<Section light>` por:

```tsx
    <Section light={theme !== 'deep'} className={theme === 'deep' ? 'bg-navy-950' : undefined}>
```

Na coluna de mídia, quando houver `imageSecondary`, renderize as duas telas sobrepostas:

```tsx
        {media && (
          <Reveal dir="left" className="app-screens">
            {secondary && (
              <div className="app-screen app-screen-back">
                <ImageMedia resource={secondary} sizes="(max-width: 900px) 40vw, 240px" />
              </div>
            )}
            <div className="app-screen app-screen-front">
              <ImageMedia resource={media} sizes="(max-width: 900px) 45vw, 260px" />
            </div>
          </Reveal>
        )}
```

com, antes do `return`:

```tsx
  const secondary =
    imageSecondary && typeof imageSecondary === 'object' ? (imageSecondary as Media) : undefined
```

**Sem `imageSecondary`, mantenha exatamente o markup atual** (`max-w-[400px]` + `rounded-card border border-line shadow-card`) — é o que `/solucoes` usa e não pode mudar.

Depois da grade de features e antes do CTA, adicione:

```tsx
        {rating?.score && (
          <div className="app-rating liquid-glass">
            <span className="app-rating-n">{rating.score}</span>
            <span className="app-rating-meta">
              <span className="app-rating-stars" aria-hidden="true">
                ★★★★★
              </span>
              {rating.label && <span>{rating.label}</span>}
            </span>
          </div>
        )}
        <StoreBadges appStore={stores?.appStore} playStore={stores?.playStore} />
```

E importe `StoreBadges` de `@/components/ui/StoreBadges`.

- [ ] **Step 7: Estilizar**

Adicione ao fim de `src/styles/theme.css`, dentro de `@layer utilities`:

```css
  /* Duas telas do app sobrepostas com rotação leve — dá profundidade sem
     precisar de mockup de aparelho renderizado. */
  .app-screens {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    min-height: 480px;
  }
  .app-screen {
    width: 246px;
    overflow: hidden;
    border: 8px solid #11162c;
    border-radius: 30px;
    background: #fff;
    box-shadow: 0 40px 80px -30px rgba(0, 0, 0, 0.75);
  }
  .app-screen-back {
    transform: translateX(46px) translateY(-26px) rotate(5deg) scale(0.9);
    opacity: 0.92;
  }
  .app-screen-front {
    position: relative;
    z-index: 2;
    transform: translateX(-40px) rotate(-3deg);
  }

  .app-rating {
    display: flex;
    align-items: center;
    gap: 1.1rem;
    margin-top: 2.2rem;
    padding: 1.1rem 1.35rem;
    border-radius: 16px;
    max-width: 420px;
  }
  .app-rating-n {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 2.3rem;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .app-rating-meta {
    display: flex;
    flex-direction: column;
    font-size: 0.82rem;
    color: var(--text-3);
    line-height: 1.45;
  }
  .app-rating-stars {
    color: #ffc24a;
    letter-spacing: 0.05em;
  }

  .store-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.7rem;
    margin-top: 1.6rem;
  }
  .store-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.65rem 1.1rem;
    border: 1px solid var(--line-strong);
    border-radius: 12px;
    background: rgba(173, 213, 235, 0.05);
    font-size: 0.82rem;
    line-height: 1.2;
    transition: border-color 0.25s ease;
  }
  .store-badge:hover {
    border-color: var(--accent);
  }
  .store-badge-ico {
    width: 19px;
    height: 19px;
    flex: none;
  }
  .store-badge small {
    display: block;
    font-size: 0.68rem;
    color: var(--text-3);
  }
  .store-badge b {
    display: block;
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 600;
  }
  @media (max-width: 900px) {
    .app-screens {
      min-height: 420px;
    }
    .app-screen {
      width: 200px;
    }
  }
```

- [ ] **Step 8: Rodar e confirmar que passa**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/app-showcase.int.spec.tsx`
Expected: PASS, 6 testes.

- [ ] **Step 9: Conferir que /solucoes não mudou**

Run: `pnpm dev` e abra `http://localhost:3000/solucoes`.
Expected: a seção `.app-band` continua clara, com uma imagem só em `max-width: 400px`, idêntica a antes.

- [ ] **Step 10: Verificar lint e tipos**

Run: `pnpm check && pnpm exec tsc --noEmit`
Expected: sem erros.

- [ ] **Step 11: Commit**

```bash
git add src/blocks/AppShowcase src/components/ui/StoreBadges.tsx src/styles/theme.css src/payload-types.ts tests/int/app-showcase.int.spec.tsx
git commit -m "feat(appShowcase): tema escuro, segunda tela, nota e selos de loja"
```

---

### Task 6: Testimonials — organização, cidade, foto e faixa de logos

O bloco hoje tem `quote`, `author` e `role`, e renderiza em 2 colunas. A home precisa de 3 colunas, do condomínio e da cidade em cada depoimento, e de uma faixa de nomes/logos abaixo.

**Files:**
- Modify: `src/blocks/Testimonials/config.ts`
- Modify: `src/blocks/Testimonials/Component.tsx`
- Modify: `src/styles/theme.css`
- Test: `tests/int/testimonials.int.spec.tsx`

**Interfaces:**
- Consumes: nada.
- Produces: campos `org`, `city`, `rating`, `photo` em cada item, e `logos` no nível do bloco. A Task 8 os usa — **se e somente se** houver depoimentos reais.

- [ ] **Step 1: Escrever o teste que falha**

Create `tests/int/testimonials.int.spec.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TestimonialsBlock } from '@/blocks/Testimonials/Component'

const item = {
  quote: 'Trocamos e a inadimplência caiu.',
  author: 'Maria Souza',
  role: 'Síndica',
  org: 'Condomínio Vista Mar',
  city: 'Recife',
}

describe('TestimonialsBlock', () => {
  it('mostra autor, papel, organização e cidade', () => {
    render(<TestimonialsBlock blockType="testimonials" items={[item]} />)
    expect(screen.getByText('Maria Souza')).toBeDefined()
    expect(screen.getByText(/Síndica/)).toBeDefined()
    expect(screen.getByText(/Condomínio Vista Mar/)).toBeDefined()
    expect(screen.getByText(/Recife/)).toBeDefined()
  })

  it('usa a inicial do autor como avatar quando não há foto', () => {
    const { container } = render(<TestimonialsBlock blockType="testimonials" items={[item]} />)
    const avatar = container.querySelector('.depo-avatar')
    expect(avatar?.textContent).toBe('M')
  })

  it('renderiza as estrelas quando há rating', () => {
    const { container } = render(
      <TestimonialsBlock blockType="testimonials" items={[{ ...item, rating: 5 }]} />,
    )
    expect(container.querySelector('.depo-stars')).not.toBeNull()
  })

  it('não renderiza estrelas sem rating', () => {
    const { container } = render(<TestimonialsBlock blockType="testimonials" items={[item]} />)
    expect(container.querySelector('.depo-stars')).toBeNull()
  })

  it('renderiza a faixa de logos pelo nome quando não há imagem', () => {
    render(
      <TestimonialsBlock
        blockType="testimonials"
        items={[item]}
        logos={[{ name: 'Condomínio Alfa' }, { name: 'Incorporadora Beta' }]}
      />,
    )
    expect(screen.getByText('Condomínio Alfa')).toBeDefined()
    expect(screen.getByText('Incorporadora Beta')).toBeDefined()
  })

  it('sem logos, não renderiza a faixa', () => {
    const { container } = render(<TestimonialsBlock blockType="testimonials" items={[item]} />)
    expect(container.querySelector('.depo-logos')).toBeNull()
  })

  it('continua funcionando com só quote/author/role (landings de cidade)', () => {
    render(
      <TestimonialsBlock
        blockType="testimonials"
        items={[{ quote: 'Ótimo atendimento.', author: 'João', role: 'Morador' }]}
      />,
    )
    expect(screen.getByText('João')).toBeDefined()
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/testimonials.int.spec.tsx`
Expected: FAIL — os campos não existem e não há `.depo-avatar`.

- [ ] **Step 3: Adicionar os campos ao config**

Modify `src/blocks/Testimonials/config.ts`. Dentro do array `items.fields`, depois de `role`:

```ts
        { name: 'org', type: 'text', admin: { description: 'Condomínio ou empresa' } },
        { name: 'city', type: 'text' },
        {
          name: 'rating',
          type: 'number',
          min: 1,
          max: 5,
          admin: { description: 'Estrelas. Vazio = sem estrelas.' },
        },
        { name: 'photo', type: 'upload', relationTo: 'media' },
```

E no nível do bloco, depois de `items`:

```ts
    {
      name: 'logos',
      type: 'array',
      admin: {
        description:
          'Faixa de nomes/logos abaixo dos depoimentos. Sem imagem, renderiza o nome em texto.',
      },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'logo', type: 'upload', relationTo: 'media' },
      ],
    },
```

- [ ] **Step 4: Regenerar os tipos**

Run: `pnpm generate:types`

- [ ] **Step 5: Reescrever o corpo do componente**

Modify `src/blocks/Testimonials/Component.tsx`. Adicione `logos` às props e troque a grade e o card:

```tsx
        <div className="grid grid-cols-1 gap-[1.4rem] sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => {
            const photo = item.photo && typeof item.photo === 'object' ? item.photo : undefined
            return (
              <Reveal key={item.id ?? item.author} delay={i * 0.08}>
                <figure className="depo-card">
                  {item.rating && (
                    <span className="depo-stars" aria-label={`${item.rating} de 5 estrelas`}>
                      {'★'.repeat(item.rating)}
                    </span>
                  )}
                  <blockquote>&ldquo;{item.quote}&rdquo;</blockquote>
                  <figcaption>
                    {photo ? (
                      <ImageMedia
                        resource={photo}
                        className="depo-avatar depo-avatar-photo"
                        sizes="42px"
                      />
                    ) : (
                      <span className="depo-avatar" aria-hidden="true">
                        {item.author.trim().charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span>
                      <b>{item.author}</b>
                      <small>
                        {[item.role, item.org, item.city].filter(Boolean).join(' · ')}
                      </small>
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            )
          })}
        </div>
        {logos && logos.length > 0 && (
          <div className="depo-logos">
            {logos.map((logo) => {
              const img = logo.logo && typeof logo.logo === 'object' ? logo.logo : undefined
              return img ? (
                <ImageMedia key={logo.id ?? logo.name} resource={img} sizes="140px" />
              ) : (
                <span key={logo.id ?? logo.name} className="depo-logo-name">
                  {logo.name}
                </span>
              )
            })}
          </div>
        )}
```

Importe `ImageMedia` de `@/components/Media/ImageMedia`.

- [ ] **Step 6: Estilizar**

Adicione ao fim de `src/styles/theme.css`, dentro de `@layer utilities`:

```css
  /* Card de depoimento — a citação em Clash carrega a seção; o rodapé com
     avatar e atribuição é o que dá credibilidade e fica separado por régua. */
  .depo-card {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    height: 100%;
    margin: 0;
    padding: 1.8rem;
    border: 1px solid var(--line);
    border-radius: var(--radius-card);
    background: var(--bg-raise);
  }
  .depo-stars {
    color: #ffc24a;
    font-size: 0.9rem;
    letter-spacing: 0.04em;
  }
  .depo-card blockquote {
    flex: 1;
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.12rem;
    font-weight: 500;
    line-height: 1.42;
  }
  .depo-card figcaption {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding-top: 1.1rem;
    border-top: 1px solid var(--line);
  }
  .depo-avatar {
    display: grid;
    place-items: center;
    flex: none;
    width: 42px;
    height: 42px;
    border-radius: var(--radius-pill);
    background: var(--grad-brand);
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 0.95rem;
    color: #fff;
  }
  .depo-avatar-photo {
    object-fit: cover;
  }
  .depo-card figcaption b {
    display: block;
    font-size: 0.9rem;
  }
  .depo-card figcaption small {
    color: var(--text-3);
    font-size: 0.78rem;
  }
  .depo-logos {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1rem 2.6rem;
    margin-top: 3rem;
    padding-top: 2.2rem;
    border-top: 1px solid var(--line);
  }
  .depo-logo-name {
    font-family: var(--font-display);
    font-weight: 500;
    font-size: 1.05rem;
    letter-spacing: 0.02em;
    color: var(--text-3);
  }
```

- [ ] **Step 7: Rodar e confirmar que passa**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/testimonials.int.spec.tsx`
Expected: PASS, 7 testes.

- [ ] **Step 8: Conferir as landings de cidade**

Run: `pnpm dev` e abra `http://localhost:3000/administradora-de-condominios-recife`.
Expected: a seção de depoimentos continua legível. O card ganhou avatar com inicial e o layout foi a 3 colunas em telas grandes — mudança aceita e intencional, desde que nada quebre. Se o texto ficar apertado em 3 colunas com citações longas, troque `lg:grid-cols-3` por `lg:grid-cols-2` **apenas** quando `items.length <= 2`.

- [ ] **Step 9: Verificar lint e tipos**

Run: `pnpm check && pnpm exec tsc --noEmit`
Expected: sem erros.

- [ ] **Step 10: Commit**

```bash
git add src/blocks/Testimonials src/styles/theme.css src/payload-types.ts tests/int/testimonials.int.spec.tsx
git commit -m "feat(testimonials): organização, cidade, estrelas, avatar e faixa de logos"
```

---

### Task 7: CTABand — segundo caminho

O bloco `centered` da home e o rodapé mostram "Solicitar proposta" um embaixo do outro. Quem ainda não vai pedir proposta não tem para onde ir.

**Files:**
- Modify: `src/blocks/CTABand/config.ts`
- Modify: `src/blocks/CTABand/Component.tsx`
- Modify: `src/styles/theme.css`
- Test: `tests/int/cta-band.int.spec.tsx`

**Interfaces:**
- Consumes: nada.
- Produces: campo `secondaryCta` (group: `label`, `href`) no bloco `ctaBand`. O plano 03 adiciona, separadamente, a variante `dual` com o array `paths`.

- [ ] **Step 1: Escrever o teste que falha**

Create `tests/int/cta-band.int.spec.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CTABandBlock } from '@/blocks/CTABand/Component'

const base = {
  blockType: 'ctaBand' as const,
  title: 'Seu condomínio merece governança de líder.',
  cta: { label: 'Solicitar proposta', href: '/proposta' },
}

describe('CTABandBlock — segundo caminho', () => {
  it('renderiza o CTA secundário quando preenchido', () => {
    render(
      <CTABandBlock
        {...base}
        variant="centered"
        secondaryCta={{ label: 'Falar no WhatsApp', href: 'https://wa.me/5581999999999' }}
      />,
    )
    expect(screen.getByRole('link', { name: /solicitar proposta/i })).toBeDefined()
    const wpp = screen.getByRole('link', { name: /falar no whatsapp/i })
    expect(wpp.getAttribute('href')).toContain('wa.me')
  })

  it('não renderiza nada de secundário quando o campo está vazio', () => {
    render(<CTABandBlock {...base} variant="centered" />)
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  it('ignora CTA secundário sem href', () => {
    render(<CTABandBlock {...base} variant="centered" secondaryCta={{ label: 'Sem link' }} />)
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  it('a variante band segue com um botão só', () => {
    render(
      <CTABandBlock
        {...base}
        secondaryCta={{ label: 'Falar no WhatsApp', href: 'https://wa.me/x' }}
      />,
    )
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/cta-band.int.spec.tsx`
Expected: FAIL — `secondaryCta` não existe.

- [ ] **Step 3: Adicionar o campo ao config**

Modify `src/blocks/CTABand/config.ts`, depois do group `cta`:

```ts
    {
      name: 'secondaryCta',
      type: 'group',
      admin: {
        description:
          'Segundo caminho, ao lado do CTA principal (ex.: WhatsApp). Só tem efeito na variante `centered`. Vazio = um botão só.',
      },
      fields: [
        { name: 'label', type: 'text' },
        { name: 'href', type: 'text' },
      ],
    },
```

- [ ] **Step 4: Regenerar os tipos**

Run: `pnpm generate:types`

- [ ] **Step 5: Renderizar o segundo botão**

Modify `src/blocks/CTABand/Component.tsx`. Adicione `secondaryCta` às props e, no ramo `centered`, troque o `Reveal delay={0.2}` por:

```tsx
          <Reveal delay={0.2} className="final-cta-actions">
            <Button href={cta.href} variant={buttonVariant ?? 'white'} size="lg" withArrow magnetic>
              {cta.label}
            </Button>
            {secondaryCta?.label && secondaryCta.href && (
              <Button href={secondaryCta.href} variant="glass" size="lg" magnetic={false}>
                {secondaryCta.label}
              </Button>
            )}
          </Reveal>
```

O `variant="band"` fica intocado — é usado em várias páginas e não tem esse problema.

- [ ] **Step 6: Estilizar o par de botões**

Adicione ao fim de `src/styles/theme.css`, dentro de `@layer utilities`:

```css
  .final-cta-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.9rem;
    justify-content: center;
  }
```

- [ ] **Step 7: Rodar e confirmar que passa**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/cta-band.int.spec.tsx`
Expected: PASS, 4 testes.

- [ ] **Step 8: Verificar lint e tipos**

Run: `pnpm check && pnpm exec tsc --noEmit`
Expected: sem erros.

- [ ] **Step 9: Commit**

```bash
git add src/blocks/CTABand src/styles/theme.css src/payload-types.ts tests/int/cta-band.int.spec.tsx
git commit -m "feat(ctaBand): segundo caminho na variante centered"
```

---

### Task 8: Migração e novo seed da home

Todas as mudanças de schema das Tasks 2–7 viram uma migração só. O seed passa a montar os 13 blocos na ordem nova.

**Files:**
- Create: `src/migrations/<timestamp>_home_redesign.ts` (gerado pelo CLI)
- Modify: `src/seed/home.ts`
- Test: `tests/e2e/home.e2e.spec.ts`

**Interfaces:**
- Consumes: todos os campos e variantes das Tasks 2–7.
- Produces: a home publicada com 13 blocos.

- [ ] **Step 1: Gerar a migração**

Run: `pnpm migrate:create home_redesign`
Expected: um arquivo novo em `src/migrations/` com as colunas e tabelas dos campos adicionados.

- [ ] **Step 2: Revisar a migração**

Abra o arquivo gerado e confirme que ele **só adiciona** — colunas novas e tabelas de array (`pages_blocks_hero_proof_items`, `pages_blocks_testimonials_logos`). Se houver qualquer `DROP`, pare: algo saiu errado nos configs.

- [ ] **Step 3: Aplicar a migração**

Run: `pnpm migrate`
Expected: `Done.` sem erro. Requer o túnel do banco ativo (ver `DATABASE_URI` no `.env`).

- [ ] **Step 4: Escrever o teste e2e que falha**

Create `tests/e2e/home.e2e.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test.describe('Home redesenhada', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/')
  })

  test('mostra a faixa de prova acima da dobra', async ({ page }) => {
    const proof = page.locator('.hero-proof')
    await expect(proof).toBeVisible()
    await expect(proof).toContainText('4,8')
    await expect(proof).toContainText('+650')
    await expect(proof).toContainText('35 anos')
  })

  test('os números aparecem em faixa, sem o mapa', async ({ page }) => {
    await expect(page.getByText('Liderança não se declara')).toBeVisible()
    await expect(page.locator('svg[data-brazil-map]')).toHaveCount(0)
  })

  test('os pilares estão em colunas', async ({ page }) => {
    await expect(page.locator('.pillars-columns')).toHaveCount(1)
    await expect(page.locator('.pillar-row')).toHaveCount(0)
  })

  test('tem uma seção do aplicativo com nota e selos das lojas', async ({ page }) => {
    await expect(page.locator('.app-rating')).toBeVisible()
    await expect(page.getByRole('link', { name: /app store/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /google play/i }).first()).toBeVisible()
  })

  test('o CTA final oferece um segundo caminho', async ({ page }) => {
    const actions = page.locator('.final-cta-actions a')
    await expect(actions).toHaveCount(2)
  })

  test('a página não rola na horizontal em 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.reload()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    )
    expect(overflow).toBe(false)
  })
})
```

- [ ] **Step 5: Rodar e confirmar que falha**

Run: `pnpm exec playwright test tests/e2e/home.e2e.spec.ts --config=playwright.config.ts`
Expected: FAIL — o seed ainda produz a home antiga.

- [ ] **Step 6: Atualizar o seed**

Modify `src/seed/home.ts`.

No `heroBlock`, remova `tag` e adicione:

```ts
    proofItems: [
      { value: '4,8', label: 'no app, 1.133 avaliações', stars: true },
      { value: '+650', label: 'condomínios sob gestão' },
      { value: '+70 mil', label: 'clientes atendidos' },
      { value: '35 anos', label: 'em 3 estados, desde 1991' },
    ],
```

e troque o segundo CTA para apontar ao app:

```ts
    ctas: [
      { label: 'Solicitar proposta', href: '/proposta', variant: 'white' },
      { label: 'Ver o aplicativo', href: '/aplicativo', variant: 'glass' },
    ],
```

No `statsBlock`, troque `variant: 'feature'` por `variant: 'band'`.

No `pillarsBlock`, adicione `variant: 'columns'`.

No `produtosGridBlock`, no card do aplicativo, troque `href: '/solucoes#aplicativo'` por `href: '/aplicativo'` e o `tag` por `'Aplicativo Semog · 4,8 ★'`.

Adicione um bloco novo, depois de `produtosGridBlock`:

```ts
  const appShowcaseBlock: Omit<AppShowcaseBlock, 'id' | 'blockName'> = {
    blockType: 'appShowcase',
    theme: 'deep',
    eyebrow: 'Aplicativo Semog',
    title: 'O condomínio inteiro na palma da mão.',
    text: 'Boleto, reserva, assembleia, encomenda e portaria. O morador resolve sozinho, sem ligar para a administradora.',
    image: appTela1Id,
    imageSecondary: appTela2Id,
    features: [
      { title: 'Taxa do condomínio', description: 'Boleto do mês, 2ª via e comprovante.' },
      { title: 'Reserva de áreas comuns', description: 'Calendário com o que está livre.' },
      { title: 'Assembleia virtual', description: 'Participação e voto pelo aplicativo.' },
      { title: 'Encomendas', description: 'Aviso de chegada e QR de retirada.' },
      { title: 'Visitantes e prestadores', description: 'Liberação por link, antes de chegar.' },
      { title: 'Documentos e comunicados', description: 'Convenção, atas e avisos oficiais.' },
    ],
    rating: { score: '4,8', label: '1.133 avaliações na App Store e no Google Play' },
    stores: {
      appStore: 'https://apps.apple.com/br/app/semog-condom%C3%ADnios/id6504202916',
      playStore: 'https://play.google.com/store/apps/details?id=br.com.semog',
    },
    cta: { label: 'Conhecer o app', href: '/aplicativo' },
  }
```

As duas telas são `app-inicio.webp` (tela inicial, com Portaria e Área do condômino) e `app-encomenda.webp` (detalhe da encomenda com QR). Coloque os arquivos onde `src/seed/lib/media.ts` espera, rode `pnpm seed:media` e adicione ao `Promise.all` de `getMediaId` no topo de `seedHome`:

```ts
    getMediaId(payload, 'app-inicio.webp'),
    getMediaId(payload, 'app-encomenda.webp'),
```

com os nomes `appTela1Id` e `appTela2Id` na desestruturação, na mesma ordem. Os mesmos arquivos são reusados pelo plano 03.

**As telas precisam estar limpas antes de entrar:** os prints publicados hoje na Play Store mostram "Teste Gruvi" como nome do condomínio. Regrave ou edite antes de semear — o site não pode expor a marca do fornecedor whitelabel.

No `ctaBandBlock`, adicione:

```ts
    secondaryCta: { label: 'Falar no WhatsApp', href: WHATSAPP_URL },
```

usando a mesma URL de WhatsApp já usada no site (procure por `wa.me` em `src/globals/` e reuse; não invente número).

Atualize o array `layout` para a ordem final:

```ts
  const layout = [
    heroBlock,
    statsBlock,
    valuesMarqueeBlock,
    wordsSectionBlock,
    pillarsBlock,
    solucoesBentoBlock,
    produtosGridBlock,
    appShowcaseBlock,
    garanteBlock,
    citiesBlock,
    humanQuoteBlock,
    ctaBandBlock,
  ]
```

**O bloco `testimonials` fica fora por enquanto** — não há depoimentos reais autorizados. Adicione um comentário no arquivo registrando isso:

```ts
  // `testimonials` entra aqui, entre `garante` e `cities`, assim que houver 3
  // depoimentos reais com nome, cargo, condomínio e cidade autorizados pelo
  // cliente. Depoimento inventado num site que vende confiança é pior que
  // seção nenhuma — ver seção 8 da spec.
```

Atualize também o comentário de cabeçalho do arquivo, que hoje descreve 11 blocos em fidelidade ao `_reference`, registrando que a home divergiu do ref deliberadamente a partir deste redesign.

- [ ] **Step 7: Rodar o seed**

Run: `pnpm seed:media && pnpm seed`
Expected: `[seed:home] Página "home" atualizada (id=N).`

- [ ] **Step 8: Rodar e confirmar que passa**

Run: `pnpm exec playwright test tests/e2e/home.e2e.spec.ts --config=playwright.config.ts`
Expected: PASS, 6 testes.

- [ ] **Step 9: Conferir a home inteira**

Run: `pnpm dev`, abra `http://localhost:3000/` em 1440×900 e 390×844.
Expected: a ordem bate com o mockup, nada rola na horizontal, e as seções mantidas (marquee, manifesto, bento, produtos, garante, cidades, citação) estão idênticas ao que estava no ar.

- [ ] **Step 10: Verificar lint e tipos**

Run: `pnpm check && pnpm exec tsc --noEmit`
Expected: sem erros.

- [ ] **Step 11: Commit**

```bash
git add src/migrations src/seed/home.ts tests/e2e/home.e2e.spec.ts
git commit -m "feat(home): nova ordem com faixa de prova e seção do aplicativo

Hero ganha 4 números acima da dobra, os stats viram faixa horizontal,
os pilares viram colunas e o app ganha seção própria. Depoimentos ficam
fora até haver material real autorizado."
```

---

## Verificação final

- [ ] `pnpm check` limpo
- [ ] `pnpm exec tsc --noEmit` limpo
- [ ] `pnpm exec vitest run --config ./vitest.config.mts` — todos passam
- [ ] `pnpm exec playwright test --config=playwright.config.ts` — todos passam
- [ ] `git diff --exit-code src/payload-types.ts` limpo depois de `pnpm generate:types`
- [ ] `/solucoes` visualmente idêntica (usa `appShowcase`)
- [ ] `/garante` e `/administracao-de-condominios` visualmente idênticas (usam `pillars`)
- [ ] `/semog` visualmente idêntica (usa `stats` variante `feature`)
- [ ] Landings de cidade conferidas (usam `testimonials` e `faq`)
- [ ] Home sem rolagem horizontal em 390px
