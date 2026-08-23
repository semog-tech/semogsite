import type { ReactElement } from 'react'
import type { Pillar } from '@/data/experienceEvent'
import { EXPERIENCE_EVENT as E } from '@/data/experienceEvent'

/**
 * Os três pilares do evento — porte da `<section class="pillars s-paper">` do
 * protótipo aprovado. Título e texto de cada pilar vêm de
 * `EXPERIENCE_EVENT.pillars`; aqui mora só o desenho do ícone, casado pelo
 * campo `icon` do dado.
 *
 * SVG inline (sem biblioteca de ícone, sem emoji) e `aria-hidden` em todos: o
 * `<h3>` ao lado já nomeia o pilar, então o ícone é decoração e repeti-lo em
 * leitor de tela só atrapalha.
 */
const ICONS: Record<Pillar['icon'], ReactElement> = {
  lotus: (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24">
      <path d="M12 21c0-5 3-8 3-11a3 3 0 0 0-6 0c0 3 3 6 3 11Z" />
      <path d="M12 21c-3.5-1-7-3.5-7-7 2.5 0 5 1.4 6 3.5M12 21c3.5-1 7-3.5 7-7-2.5 0-5 1.4-6 3.5" />
    </svg>
  ),
  people: (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24">
      <circle cx="9" cy="9" r="3" />
      <circle cx="17" cy="10" r="2.4" />
      <path d="M3.5 19c.6-3 2.9-4.6 5.5-4.6S13.9 16 14.5 19M16 14.6c2.1.2 3.7 1.6 4.2 4.4" />
    </svg>
  ),
  heart: (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24">
      <path d="M12 20s-7-4.4-7-9.2A4 4 0 0 1 12 8a4 4 0 0 1 7-1.8c.6 1 .7 2.3.4 3.4" />
      <path d="M14 14h2.5l1.5-2.5L20 17l1.5-3H23" />
    </svg>
  ),
}

export function ExperiencePillars() {
  return (
    <section className="pillars s-paper">
      <div className="wrap">
        <div className="head">
          <h2 className="sec-title">
            Um evento para cuidar do mais importante: <em>você</em>.
          </h2>
          <p>
            Síndicos, conselheiros, moradores e parceiros. A gente passa o ano resolvendo o prédio —
            este dia é para o corpo.
          </p>
        </div>
        <div className="pillar-grid">
          {E.pillars.map((pillar) => (
            <div className="pillar" key={pillar.title}>
              {ICONS[pillar.icon]}
              <h3>{pillar.title}</h3>
              <p>{pillar.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
