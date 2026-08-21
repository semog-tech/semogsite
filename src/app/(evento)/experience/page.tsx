import type { Metadata } from 'next'
import { ExperienceCta } from '@/components/experience/ExperienceCta'
import { ExperienceFooter } from '@/components/experience/ExperienceFooter'
import { ExperienceHero } from '@/components/experience/ExperienceHero'
import { ExperiencePillars } from '@/components/experience/ExperiencePillars'
import { ExperienceProgram } from '@/components/experience/ExperienceProgram'
import { ExperienceSponsors } from '@/components/experience/ExperienceSponsors'
import { ExperienceVideo } from '@/components/experience/ExperienceVideo'
import { EXPERIENCE_EVENT as E } from '@/data/experienceEvent'
import { absoluteUrl } from '@/lib/seo'
import '@/components/experience/experience.css'

const title = 'Semog Experience 2026 — manhã wellness na Praia do Cabo Branco'
const description = `Movimento, saúde e conexão em ${E.dateLabel}, das 7h às 12h, na ${E.venue}, em ${E.city}. Pilates, treino funcional, alongamento e avaliação física. Gratuito, com ${E.seats} vagas.`

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: absoluteUrl('experience') },
  openGraph: {
    type: 'website',
    url: absoluteUrl('experience'),
    title,
    description,
    locale: 'pt_BR',
  },
}

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
 * A seção `#inscricao`, entre a faixa e os patrocinadores, entra na Task 7
 * junto com o formulário — os dois CTAs acima já apontam para ela.
 */
export default function ExperiencePage() {
  return (
    <div className="exp">
      <ExperienceHero />
      <main>
        <ExperiencePillars />
        <ExperienceProgram />
        <ExperienceVideo />
        <ExperienceCta />
        <ExperienceSponsors />
      </main>
      <ExperienceFooter />
    </div>
  )
}
