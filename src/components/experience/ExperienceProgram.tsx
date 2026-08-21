import { img } from '@/../content/media'
import { ImageMedia } from '@/components/Media/ImageMedia'
import { EXPERIENCE_EVENT as E } from '@/data/experienceEvent'

/**
 * Programação da manhã + foto do local — porte da
 * `<section class="program s-white">` do protótipo aprovado.
 *
 * A lista é `<ol>` porque a ORDEM CRONOLÓGICA é a informação: quem lê sabe o
 * que vem antes do quê sem precisar comparar horários. Por isso também não há
 * numeração decorativa (01/02/03) por cima do horário — seria um segundo
 * contador competindo com o relógio.
 */

/** '07:00' (ISO, ordenável no dado) -> '07h00' (como se lê em pt-BR). */
function horaBr(time: string) {
  return time.replace(':', 'h')
}

export function ExperienceProgram() {
  const local = img('experience-local.webp')

  return (
    <section className="program s-white">
      <div className="wrap">
        <div className="grid">
          <div>
            <span className="eyebrow">Programação</span>
            <h2 className="sec-title">
              Manhã <em>wellness</em>
            </h2>
            <ol className="sched">
              {E.schedule.map((item) => (
                <li key={item.time}>
                  <span className="h">{horaBr(item.time)}</span>
                  <span className="r" />
                  <span className="t">{item.label}</span>
                </li>
              ))}
            </ol>
          </div>
          <figure className="place">
            <ImageMedia fill resource={local} sizes="(max-width: 64rem) 100vw, 45vw" />
            <figcaption>
              <svg
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                viewBox="0 0 24 24"
              >
                <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              <div>
                <div className="pname">
                  {E.venue}
                  <br />
                  {E.city} — {E.uf}
                </div>
                <p className="pnote">
                  O ponto mais oriental das Américas, onde o sol nasce primeiro no continente.
                </p>
              </div>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  )
}
