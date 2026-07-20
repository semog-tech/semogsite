import type { Metadata } from 'next'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { GradientText } from '@/components/ui/GradientText'
import { Section } from '@/components/ui/Section'
import { Counter } from '@/motion/Counter'
import { Magnetic } from '@/motion/Magnetic'
import { Parallax } from '@/motion/Parallax'
import { Reveal, Stagger } from '@/motion/reveal'
import { SplitHeadline } from '@/motion/SplitHeadline'
import { Words } from '@/motion/Words'

export const metadata: Metadata = {
  title: 'Styleguide — Semog Design System',
  description:
    'Vitrine viva dos tokens, componentes e da camada de motion do site institucional Semog.',
}

/**
 * Rota permanente (Task 7 / Plano 2): vitrine "viva" do design system e da
 * camada de motion. Não é uma página descartável — compõe apenas os
 * primitivos já construídos e revisados (Tasks 1–6), sem reestilizar nada.
 * Server component: os primitivos de UI não têm estado; os primitivos de
 * motion são 'use client' e podem ser renderizados diretamente aqui.
 */

const kicker = 'mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-fg-3'

const navySwatches = [
  { token: 'navy-950', hex: '#05081a', className: 'bg-navy-950' },
  { token: 'navy-900', hex: '#0a102e', className: 'bg-navy-900' },
  { token: 'navy-850', hex: '#0d1439', className: 'bg-navy-850' },
  { token: 'navy-800', hex: '#101a48', className: 'bg-navy-800' },
  { token: 'navy-700', hex: '#16225c', className: 'bg-navy-700' },
  { token: 'navy-600', hex: '#1b2d70', className: 'bg-navy-600' },
  { token: 'navy-500', hex: '#2a3f96', className: 'bg-navy-500' },
  { token: 'navy-400', hex: '#3b54be', className: 'bg-navy-400' },
]

const iceSwatches = [
  { token: 'ice-300', hex: '#d8ecf7', className: 'bg-ice-300' },
  { token: 'ice-400', hex: '#add5eb', className: 'bg-ice-400' },
  { token: 'ice-500', hex: '#7fb8db', className: 'bg-ice-500' },
  { token: 'ice-600', hex: '#5895bd', className: 'bg-ice-600' },
]

const silverSwatches = [
  { token: 'silver-100', hex: '#edeef5', className: 'bg-silver-100' },
  { token: 'silver-300', hex: '#bcbcc7', className: 'bg-silver-300' },
  { token: 'silver-500', hex: '#8e90a6', className: 'bg-silver-500' },
]

function SwatchRow({
  swatches,
}: {
  swatches: { token: string; hex: string; className: string }[]
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {swatches.map((s) => (
        <div key={s.token} className="flex flex-col gap-3">
          <div className={`h-20 rounded-card border border-line ${s.className}`} />
          <div>
            <p className="text-sm font-semibold text-fg">{s.token}</p>
            <p className="text-xs text-fg-3">{s.hex}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

const variants = ['primary', 'ghost', 'white', 'glass'] as const
const sizes = ['sm', 'md', 'lg'] as const

function ButtonMatrix() {
  return (
    <div className="space-y-8">
      {variants.map((variant) => (
        <div key={variant}>
          <p className={kicker}>variant=&quot;{variant}&quot;</p>
          <div className="flex flex-wrap items-center gap-4">
            {sizes.map((size) => (
              <Button key={`${variant}-${size}`} size={size} variant={variant}>
                Botão {size}
              </Button>
            ))}
            {sizes.map((size) => (
              <Button key={`${variant}-${size}-arrow`} size={size} variant={variant} withArrow>
                Saiba mais
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function RevealTile({ label }: { label: string }) {
  return (
    <div className="flex h-28 items-center justify-center rounded-card border border-line bg-navy-800/60 text-sm text-fg-2">
      dir=&quot;{label}&quot;
    </div>
  )
}

function StaggerTile({ n }: { n: number }) {
  return (
    <div className="flex h-28 items-center justify-center rounded-card border border-line bg-navy-800/60 text-h3">
      {n}
    </div>
  )
}

export default function StyleguidePage() {
  return (
    <>
      {/* ---------- Intro ---------- */}
      <Section className="pb-0">
        <Container>
          <Eyebrow>Design system · Semog</Eyebrow>
          <h1 className="mb-4 max-w-3xl text-hero">Styleguide</h1>
          <p className="max-w-2xl text-lead text-fg-2">
            Vitrine permanente dos tokens, primitivos de UI e da camada de motion do site
            institucional. Esta rota acompanha o design system conforme ele evolui e serve como gate
            de verificação visual do Plano 2 — sem depender de banco de dados.
          </p>
        </Container>
      </Section>

      {/* ---------- Paleta ---------- */}
      <Section>
        <Container>
          <Eyebrow>Fundação</Eyebrow>
          <h2 className="mb-10 text-h2">Paleta</h2>
          <div className="space-y-10">
            <div>
              <p className={kicker}>Navy — 950 a 400</p>
              <SwatchRow swatches={navySwatches} />
            </div>
            <div>
              <p className={kicker}>Ice — 300 a 600</p>
              <SwatchRow swatches={iceSwatches} />
            </div>
            <div>
              <p className={kicker}>Silver — 100 / 300 / 500</p>
              <SwatchRow swatches={silverSwatches} />
            </div>
          </div>
        </Container>
      </Section>

      {/* ---------- Tipografia ---------- */}
      <Section light>
        <Container>
          <Eyebrow>Fundação</Eyebrow>
          <h2 className="mb-10 text-h2">Tipografia</h2>
          <div className="space-y-9">
            <div>
              <p className={kicker}>text-hero · Clash Display (h2)</p>
              <h2 className="text-hero">Confiança em cada detalhe</h2>
            </div>
            <div>
              <p className={kicker}>text-h2 · Clash Display (h3)</p>
              <h3 className="text-h2">Administração de condomínios</h3>
            </div>
            <div>
              <p className={kicker}>text-h3 · Clash Display (h4)</p>
              <h4 className="text-h3">Soluções sob medida</h4>
            </div>
            <div>
              <p className={kicker}>text-lead · Satoshi</p>
              <p className="max-w-2xl text-lead text-fg-2">
                Texto de apoio (lead), usado em subtítulos e introduções de seção — Satoshi Regular
                em corpo maior.
              </p>
            </div>
            <div>
              <p className={kicker}>body · Satoshi</p>
              <p className="max-w-prose">
                Parágrafo padrão do corpo do site, em Satoshi Regular, otimizado para leitura
                confortável em blocos de texto mais longos.
              </p>
            </div>
            <div>
              <p className={kicker}>text-fg-2 · estilo &quot;muted&quot;</p>
              <p className="text-fg-2">
                Texto secundário/esmaecido, usado em legendas e metadados.
              </p>
            </div>
            <div className="flex flex-wrap items-start gap-10">
              <div>
                <p className={kicker}>GradientText variant=&quot;ice&quot; (fundo escuro)</p>
                <div className="inline-block rounded-card bg-navy-900 px-6 py-4">
                  <span className="text-h3">
                    <GradientText variant="ice">Gradiente ice</GradientText>
                  </span>
                </div>
              </div>
              <div>
                <p className={kicker}>GradientText variant=&quot;brand&quot; (fundo claro)</p>
                <div className="inline-block rounded-card bg-white px-6 py-4">
                  <span className="text-h3">
                    <GradientText variant="brand">Gradiente brand</GradientText>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* ---------- Botões ---------- */}
      <Section>
        <Container>
          <Eyebrow>Ação</Eyebrow>
          <h2 className="mb-2 text-h2">Botões</h2>
          <p className="mb-10 max-w-prose text-fg-2">
            4 variantes × 3 tamanhos, com e sem seta (<code>withArrow</code>). Passe o mouse para
            ver o hover-lift e a seta deslizar.
          </p>
          <ButtonMatrix />
        </Container>
      </Section>

      <Section light>
        <Container>
          <h3 className="mb-2 text-h3">Mesma matriz em seção clara (.sec-light)</h3>
          <p className="mb-10 max-w-prose text-fg-2">
            Nota: neste ponto do design system, o fundo do variant <code>primary</code> e o acento
            de hover do <code>ghost</code> ainda não trocam de tom em seções claras — é um ajuste
            adiado, fora do escopo do Plano 2. O restante do ritmo claro/escuro (texto, linhas,
            fundo) já reflete corretamente via <code>.sec-light</code>.
          </p>
          <ButtonMatrix />
        </Container>
      </Section>

      {/* ---------- Eyebrow ---------- */}
      <Section>
        <Container>
          <Eyebrow>Rótulo de seção</Eyebrow>
          <h2 className="mb-4 text-h2">Eyebrow</h2>
          <p className="max-w-prose text-fg-2">
            Usado para introduzir uma seção com um rótulo curto em caixa alta — o traço de 28px é um{' '}
            <code>&lt;span aria-hidden&gt;</code>, fiel ao <code>::before</code> do
            <code>_reference</code>.
          </p>
        </Container>
      </Section>

      {/* ---------- Card ---------- */}
      <Section light>
        <Container>
          <Eyebrow>Superfícies</Eyebrow>
          <h2 className="mb-10 text-h2">Card</h2>
          <div className="max-w-md rounded-card border border-line bg-[linear-gradient(180deg,rgba(173,213,235,0.05),rgba(173,213,235,0.015))] p-8 shadow-card">
            <h3 className="mb-3 text-h3">Título do card</h3>
            <p className="mb-6 text-fg-2">
              Demonstração do padrão visual de card: fundo em gradiente sutil, borda{' '}
              <code>border-line</code>, cantos <code>rounded-card</code> e sombra{' '}
              <code>shadow-card</code>. É uma demo — o componente final de Card ainda não foi
              extraído.
            </p>
            <Button size="sm" variant="ghost" withArrow>
              Ver mais
            </Button>
          </div>
        </Container>
      </Section>

      {/* ---------- Motion ---------- */}
      <Section>
        <Container>
          <Eyebrow>Movimento</Eyebrow>
          <h2 className="mb-10 text-h2">Motion</h2>

          <div className="mb-14">
            <p className={kicker}>Reveal — up / left / right / scale (dispara ao entrar na tela)</p>
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
              <Reveal dir="up">
                <RevealTile label="up" />
              </Reveal>
              <Reveal dir="left">
                <RevealTile label="left" />
              </Reveal>
              <Reveal dir="right">
                <RevealTile label="right" />
              </Reveal>
              <Reveal dir="scale">
                <RevealTile label="scale" />
              </Reveal>
            </div>
          </div>

          <div className="mb-14">
            <p className={kicker}>Stagger — 4 tiles em cascata</p>
            <Stagger className="grid grid-cols-2 gap-6 lg:grid-cols-4">
              <StaggerTile n={1} />
              <StaggerTile n={2} />
              <StaggerTile n={3} />
              <StaggerTile n={4} />
            </Stagger>
          </div>

          <div className="mb-14 grid grid-cols-1 gap-10 sm:grid-cols-2">
            <div>
              <p className={kicker}>Counter value={700}</p>
              <p className="text-hero">
                <Counter value={700} />+
              </p>
            </div>
            <div>
              <p className={kicker}>Counter value={70000} (formata pt-BR: 70.000)</p>
              <p className="text-hero">
                <Counter value={70000} />
              </p>
            </div>
          </div>

          <div className="mb-14">
            <p className={kicker}>SplitHeadline — cada palavra sobe no seu tempo</p>
            <SplitHeadline as="h3" className="text-h2">
              Cada palavra sobe no seu tempo
            </SplitHeadline>
          </div>

          <div className="mb-14">
            <p className={kicker}>Words — brilha palavra a palavra ao rolar</p>
            <Words as="p" className="max-w-prose text-lead">
              Cada palavra deste parágrafo começa esmaecida e ganha opacidade total conforme a seção
              entra na tela — role a página para ver o efeito.
            </Words>
          </div>

          <div className="mb-14">
            <p className={kicker}>Magnetic — aproxime o cursor do botão</p>
            <Magnetic className="inline-block">
              <Button size="lg" variant="primary" withArrow>
                Fale conosco
              </Button>
            </Magnetic>
          </div>

          <div>
            <p className={kicker}>Parallax — desloca a imagem ao rolar</p>
            <div className="relative h-72 overflow-hidden rounded-card border border-line">
              <Parallax amount={8} className="absolute -top-16 -bottom-16 inset-x-0">
                {/* biome-ignore lint/performance/noImgElement: demo estática, sem next/image (localPatterns não cobre /public fora de /api/media) */}
                <img
                  alt=""
                  className="h-full w-full object-cover"
                  src="/styleguide/hero-towers.webp"
                />
              </Parallax>
            </div>
          </div>
        </Container>
      </Section>
    </>
  )
}
