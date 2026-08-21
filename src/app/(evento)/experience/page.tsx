import type { Metadata } from 'next'
import { EXPERIENCE_EVENT as E } from '@/data/experienceEvent'
import { absoluteUrl } from '@/lib/seo'

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
 * Esqueleto da landing. As seções visuais entram na Task 6 e o formulário na
 * Task 7 — aqui só existe o que os testes desta task cobrem: a rota responde,
 * o layout isolado não traz navegação e a página anuncia data, local e vagas
 * lendo de `EXPERIENCE_EVENT` (nada digitado à mão).
 */
export default function ExperiencePage() {
  return (
    <main>
      <h1>Semog Experience</h1>
      <p>{E.dateLabel}</p>
      <p>{E.venue}</p>
      <p>{E.seats} vagas</p>
    </main>
  )
}
