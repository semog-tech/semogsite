'use client'

import { useId, useRef, useState } from 'react'
import { ImageMedia } from '@/components/Media/ImageMedia'
import type { Ongoing, Professional } from '@/data/experienceEvent'

export type ProgramItem = {
  time: string
  endTime?: string
  label: string
  text?: string
  professional?: Professional
  /** Já resolvido por `img()` no servidor — ver `ExperienceProgram`. */
  media: { url: string; alt: string; width?: number; height?: number }
}

type Props = {
  items: ProgramItem[]
  ongoing: readonly Ongoing[]
  venue: string
  city: string
  uf: string
  /** Presente enquanto o local não está confirmado; ausente quando estiver. */
  venueNote?: string
}

/** '07:00' (ISO, ordenável no dado) -> '07h00' (como se lê em pt-BR). */
function horaBr(time: string) {
  return time.replace(':', 'h')
}

const ONGOING_ICONS: Record<Ongoing['icon'], React.ReactElement> = {
  drop: (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M12 3.5c3 3.7 5.5 6.7 5.5 9.7a5.5 5.5 0 0 1-11 0c0-3 2.5-6 5.5-9.7Z" />
      <path d="M9.5 13.8c.2 1.6 1.3 2.6 2.8 2.8" />
    </svg>
  ),
  pulse: (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M3 12.5h3.2L8 8.5l2.8 8 2.4-5.4 1.5 2.4H21" />
    </svg>
  ),
}

/**
 * Lista de horários + painel da atividade selecionada.
 *
 * **Por que tabs e não uma `<ol>`.** A seção nasceu como lista ordenada porque
 * a ordem cronológica ERA a informação. Agora cada horário abre um painel, o
 * que em ARIA é exatamente `tablist`/`tab`/`tabpanel` — o padrão que leitor de
 * tela anuncia como "aba 2 de 6, selecionada". A cronologia não se perde: o
 * horário é a primeira coisa dentro do rótulo de cada aba, e horário é ordinal
 * por natureza. Trocar por `<ol>` + botões faria o leitor anunciar "lista" e
 * calar que existe um painel associado.
 *
 * **Sem troca no hover e sem autoplay**, ambos deliberados: o painel carrega
 * informação (quem conduz, o link do Instagram), e conteúdo que muda sozinho
 * ou ao passar o mouse escapa de quem lê devagar — a WCAG 2.2.2 exigiria um
 * controle de pausa que essa seção não tem onde acomodar. Trocar é ato do
 * usuário: clique, Enter/Espaço ou as setas.
 *
 * Todos os painéis ficam no DOM (os inativos com `hidden`), então o `next/image`
 * de cada foto entra no HTML e o navegador não pisca uma moldura vazia na
 * primeira troca.
 */
export function ExperienceProgramTabs({ items, ongoing, venue, city, uf, venueNote }: Props) {
  const [active, setActive] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)
  const baseId = useId()
  const tabId = (i: number) => `${baseId}-tab-${i}`
  const panelId = (i: number) => `${baseId}-panel-${i}`

  /**
   * No desktop o painel fica ao lado da lista e está sempre à vista. No mobile
   * ele cai abaixo dos seis horários: sem isto, tocar num horário trocaria uma
   * foto fora da tela e a interação pareceria não ter funcionado.
   *
   * `block: 'nearest'` rola o MÍNIMO necessário — com o painel já visível (o
   * caso do desktop) não mexe em nada, e por isso a checagem antes dele é só
   * um atalho, não a garantia.
   */
  function select(i: number) {
    setActive(i)
    const el = panelRef.current
    if (!el) return
    const box = el.getBoundingClientRect()
    if (box.top >= 0 && box.bottom <= window.innerHeight) return
    const semAnimacao = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ block: 'nearest', behavior: semAnimacao ? 'auto' : 'smooth' })
  }

  /**
   * Setas movem a seleção; Home/End vão aos extremos. É o teclado que o padrão
   * de tabs manda existir — sem isso a lista vira seis paradas de Tab, uma por
   * horário, para atravessar a seção.
   */
  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const last = items.length - 1
    let next: number | null = null
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = active === last ? 0 : active + 1
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = active === 0 ? last : active - 1
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = last
    if (next === null) return
    event.preventDefault()
    setActive(next)
    document.getElementById(tabId(next))?.focus()
  }

  return (
    <section className="program s-white">
      <div className="wrap">
        <div className="grid">
          <div className="col-lista">
            <span className="eyebrow">Programação</span>
            <h2 className="sec-title">
              Manhã <em>wellness</em>
            </h2>

            <div
              aria-label="Atividades da manhã"
              className="sched"
              onKeyDown={onKeyDown}
              role="tablist"
            >
              {items.map((item, i) => (
                <button
                  aria-controls={panelId(i)}
                  aria-selected={i === active}
                  className={i === active ? 'is-active' : undefined}
                  id={tabId(i)}
                  key={item.time}
                  onClick={() => select(i)}
                  role="tab"
                  tabIndex={i === active ? 0 : -1}
                  type="button"
                >
                  <span className="h">
                    {horaBr(item.time)}
                    {item.endTime && <small>às {horaBr(item.endTime)}</small>}
                  </span>
                  <span className="r" />
                  <span className="t">
                    {item.label}
                    {item.professional && <small>com {item.professional.name}</small>}
                  </span>
                </button>
              ))}
            </div>

          </div>

          <div className="place-stack" ref={panelRef}>
            {items.map((item, i) => (
              <figure
                aria-labelledby={tabId(i)}
                className="place"
                hidden={i !== active}
                id={panelId(i)}
                key={item.time}
                role="tabpanel"
                // biome-ignore lint/a11y/noNoninteractiveTabindex: a regra olha o `figure` e ignora o `role="tabpanel"`. O padrão WAI-ARIA de tabs manda o painel ser focável quando não tem nada focável dentro — e é o caso da maioria (só as aulas com Instagram têm link). Sem isto, quem navega por teclado passa da lista direto para a próxima seção e nunca alcança a descrição da atividade.
                tabIndex={0}
              >
                <ImageMedia fill resource={item.media} sizes="(max-width: 64rem) 100vw, 45vw" />
                <figcaption>
                  <div>
                    <div className="pname">
                      {item.label}
                      {item.professional && (
                        <>
                          <br />
                          <span className="ppro">
                            com{' '}
                            {item.professional.instagram ? (
                              <a
                                href={item.professional.instagram}
                                rel="noopener noreferrer"
                                target="_blank"
                              >
                                {item.professional.name}
                              </a>
                            ) : (
                              item.professional.name
                            )}
                          </span>
                        </>
                      )}
                    </div>
                    {item.text && <p className="pnote">{item.text}</p>}
                    <p className="ploc">
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
                      {venue} — {city}, {uf}
                      {venueNote && <em>{venueNote}</em>}
                    </p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>

          <ul className="ongoing">
            {ongoing.map((service) => (
              <li key={service.title}>
                {ONGOING_ICONS[service.icon]}
                <div>
                  <strong>{service.title}</strong>
                  <p>{service.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
