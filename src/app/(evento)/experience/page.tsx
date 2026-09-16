import type { Metadata } from 'next'
import { ExperienceCta } from '@/components/experience/ExperienceCta'
import { ExperienceFooter } from '@/components/experience/ExperienceFooter'
import { ExperienceHero } from '@/components/experience/ExperienceHero'
import { ExperienceKit } from '@/components/experience/ExperienceKit'
import { ExperiencePillars } from '@/components/experience/ExperiencePillars'
import { ExperienceProgram } from '@/components/experience/ExperienceProgram'
import { ExperienceSponsors } from '@/components/experience/ExperienceSponsors'
import { ExperienceVideo } from '@/components/experience/ExperienceVideo'
import { ExperienceForm } from '@/components/forms/ExperienceForm'
import { EXPERIENCE_EVENT as E } from '@/data/experienceEvent'
import {
  experienceDescription,
  experienceEventJsonLd,
  experienceHeroImage,
  experienceTitle,
} from '@/lib/experienceSeo'
import { absoluteUrl } from '@/lib/seo'
import '@/components/experience/experience.css'

/**
 * Título, descrição, card social e JSON-LD moram em `@/lib/experienceSeo` — um
 * `page.tsx` só pode exportar o que o Next reconhece, e o que nenhum teste
 * importa nenhum teste defende. A trava do local e do horário vive lá.
 */
export const metadata: Metadata = {
  title: experienceTitle,
  description: experienceDescription,
  alternates: { canonical: absoluteUrl('experience') },
  openGraph: {
    type: 'website',
    url: absoluteUrl('experience'),
    title: experienceTitle,
    description: experienceDescription,
    locale: 'pt_BR',
    images: [experienceHeroImage.url],
  },
  twitter: {
    card: 'summary_large_image',
    title: experienceTitle,
    description: experienceDescription,
    images: [experienceHeroImage.url],
  },
}

/**
 * O que a pessoa leva do evento, na coluna ao lado do formulário. Fica aqui
 * (e não em `experienceEvent.ts`) de propósito: é copy de venda da seção de
 * inscrição, não dado operacional do evento — o que é dado (data, horário,
 * local, vagas) continua vindo de `EXPERIENCE_EVENT`.
 */
const BENEFICIOS = [
  'Pilates, yoga e treino funcional com profissionais',
  'Avaliação física individual sem custo',
  'Café da manhã, água e água de coco durante toda a manhã',
  'Kit praia, retirado antes na filial de João Pessoa',
]

/**
 * Landing do Semog Experience 2026 — porte do protótipo aprovado pelo cliente
 * (`docs/superpowers/specs/2026-08-21-semog-experience-prototipo.html`).
 *
 * O `.exp` do contêiner não é decorativo: `experience.css` inteiro é escopado
 * nele, porque o `theme.css` do site carrega no mesmo documento e o protótipo
 * usa nomes genéricos (`.wrap`, `.btn`, `.card`, `.hero`) e seletores de
 * elemento (`section`, `footer`, `form`).
 *
 * O `<main>` não existia no protótipo (arquivo solto, sem landmarks) e entra
 * aqui: o hero é `<header>` (banner) e o rodapé só é `contentinfo` se NÃO
 * estiver dentro de `<main>` — sem esse envelope a página não teria região
 * principal para um leitor de tela pular.
 *
 * A seção `#inscricao` fica entre a faixa e os patrocinadores, alvo dos três
 * CTAs da página (topo, hero e faixa). O markup dela mora aqui, e não num
 * componente próprio como as outras seções: metade da seção é a coluna de
 * texto e a outra metade é o `<ExperienceForm />`, que é client component —
 * um invólucro só para o `<div className="card">` não pagaria por si.
 */
export default function ExperiencePage() {
  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD serializado por nós, sem input de usuário
        dangerouslySetInnerHTML={{ __html: JSON.stringify(experienceEventJsonLd) }}
      />
      <div className="exp">
        <ExperienceHero />
        <main>
          <ExperiencePillars />
          <ExperienceProgram />
          <ExperienceKit />
          <ExperienceVideo />
          <ExperienceCta />
          <section className="signup s-paper" id="inscricao">
            <div className="wrap">
              <div className="grid">
                <div className="intro">
                  <span className="eyebrow">Inscrição</span>
                  <h2 className="sec-title">Garanta a sua vaga</h2>
                  <p style={{ marginTop: '1.1rem' }}>
                    São {E.seats} vagas e a inscrição é gratuita. Leve roupa leve, garrafa de água e
                    disposição — o resto é com a gente.
                  </p>
                  {/* biome-ignore lint/a11y/noRedundantRoles: redundante no papel, necessário na prática — com `list-style: none` o Safari/VoiceOver descarta a semântica de lista */}
                  <ul className="facts" role="list">
                    {BENEFICIOS.map((beneficio) => (
                      <li key={beneficio}>
                        <svg
                          aria-hidden="true"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path d="M5 12.5l4.5 4.5L19 7.5" />
                        </svg>
                        {beneficio}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="card">
                  <ExperienceForm />
                </div>
              </div>
            </div>
          </section>
          <ExperienceSponsors />
        </main>
        <ExperienceFooter />
      </div>
    </>
  )
}
