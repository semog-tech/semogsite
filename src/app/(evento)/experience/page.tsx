import type { Metadata } from 'next'
import { img } from '@/../content/media'
import { ExperienceCta } from '@/components/experience/ExperienceCta'
import { ExperienceFooter } from '@/components/experience/ExperienceFooter'
import { ExperienceHero } from '@/components/experience/ExperienceHero'
import { ExperiencePillars } from '@/components/experience/ExperiencePillars'
import { ExperienceProgram } from '@/components/experience/ExperienceProgram'
import { ExperienceSponsors } from '@/components/experience/ExperienceSponsors'
import { ExperienceVideo } from '@/components/experience/ExperienceVideo'
import { ExperienceForm } from '@/components/forms/ExperienceForm'
import { EXPERIENCE_EVENT as E } from '@/data/experienceEvent'
import { absoluteUrl } from '@/lib/seo'
import '@/components/experience/experience.css'

const title = `${E.name} — manhã wellness na Praia do Cabo Branco`
/**
 * O horário sai de `E.timeLabel`, como todo o resto: este texto vai para a
 * `<meta description>`, para o `og:description`, para o `twitter:description`
 * E para o JSON-LD do evento (é o mesmo `description` reusado abaixo). Digitado
 * à mão, uma troca de horário em `experienceEvent.ts` arrumaria a página
 * inteira e deixaria o snippet da busca e o rich result mentindo.
 */
const description = `Movimento, saúde e conexão em ${E.dateLabel}, das ${E.timeLabel}, na ${E.venue}, em ${E.city}. Pilates, treino funcional, alongamento e avaliação física. Gratuito, com ${E.seats} vagas.`

/**
 * A foto do hero também é o card social. O route group `(evento)` é um root
 * layout IRMÃO de `(frontend)`, então não herda o `src/app/[slug]/opengraph-image.tsx`
 * que serve as rotas do site — sem declarar a imagem aqui, esta seria a única
 * página sem `og:image`, e o link do evento (divulgado justamente em WhatsApp
 * e Instagram) apareceria sem imagem nenhuma.
 */
const heroImage = img('experience-hero.webp')

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
    images: [heroImage.url],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [heroImage.url],
  },
}

/**
 * JSON-LD `Event` — é o que habilita o rich result de evento na busca (data,
 * local e "gratuito" aparecem na própria SERP) e o que faz o Google entender
 * a página como evento, não como mais uma página de serviço.
 *
 * Data e horário saem de `EXPERIENCE_EVENT`, como todo o resto da página: se
 * a data mudar num lugar só, o structured data mentiria para o Google
 * enquanto a página mostra o certo. `-03:00` é o fuso de João Pessoa o ano
 * inteiro (o Brasil não tem mais horário de verão desde 2019).
 *
 * Duas coisas que o plano não pedia e entraram por decisão de SEO:
 * - `image`: o Google lista a imagem como recomendada para `Event` e é ela
 *   que aparece no card do resultado. É a mesma foto do hero, via `img()`,
 *   para não duplicar a URL do bucket.
 * - `organizer['@id']`: aponta para o nó `Organization` publicado na home
 *   (`getOrganizationJsonLd`, `#org`), então o evento fica preso à mesma
 *   entidade em vez de criar uma organização solta com nome igual.
 */
const eventJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: E.name,
  description,
  startDate: `${E.date}T${E.startTime}:00-03:00`,
  endDate: `${E.date}T${E.endTime}:00-03:00`,
  eventStatus: 'https://schema.org/EventScheduled',
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  image: [heroImage.url],
  location: {
    '@type': 'Place',
    name: E.venue,
    address: {
      '@type': 'PostalAddress',
      addressLocality: E.city,
      addressRegion: E.uf,
      addressCountry: 'BR',
    },
  },
  organizer: {
    '@type': 'Organization',
    '@id': `${absoluteUrl('')}#org`,
    name: 'Semog Administradora de Condomínios',
    url: absoluteUrl(''),
  },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'BRL',
    availability: 'https://schema.org/InStock',
    url: absoluteUrl('experience'),
  },
  url: absoluteUrl('experience'),
}

/**
 * O que a pessoa leva do evento, na coluna ao lado do formulário. Fica aqui
 * (e não em `experienceEvent.ts`) de propósito: é copy de venda da seção de
 * inscrição, não dado operacional do evento — o que é dado (data, horário,
 * local, vagas) continua vindo de `EXPERIENCE_EVENT`.
 */
const BENEFICIOS = [
  'Pilates, funcional e alongamento com profissionais',
  'Avaliação física individual sem custo',
  'Água de coco e hidratação durante toda a manhã',
  'Você pode trazer até 3 acompanhantes',
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
      />
      <div className="exp">
        <ExperienceHero />
        <main>
          <ExperiencePillars />
          <ExperienceProgram />
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
