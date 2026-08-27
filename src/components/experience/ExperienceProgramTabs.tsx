'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
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

/** Quanto cada atividade fica no ar antes de a seguinte entrar sozinha. */
const PASSO_MS = 6000

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
  fruit: (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M12 8.4c-1-1.1-2.3-1.6-3.6-1.4C6.2 7.3 5 9.3 5 12c0 3.6 2.3 7.5 4.4 7.5.9 0 1.7-.5 2.6-.5s1.7.5 2.6.5c2.1 0 4.4-3.9 4.4-7.5 0-2.7-1.2-4.7-3.4-5-1.3-.2-2.6.3-3.6 1.4Z" />
      <path d="M12 8.4V6.2m0 0c0-1.4 1.1-2.6 2.6-2.7m-2.6 2.7c-1.3 0-2.4-.8-2.7-2" />
    </svg>
  ),
  pulse: (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M3 12.5h3.2L8 8.5l2.8 8 2.4-5.4 1.5 2.4H21" />
    </svg>
  ),
}

/** `true` quando o visitante pediu menos movimento no sistema. */
function querMenosMovimento() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * Lista de horários + painel da atividade, que avança sozinho.
 *
 * **Por que tabs e não uma `<ol>`.** A seção nasceu como lista ordenada porque
 * a ordem cronológica ERA a informação. Agora cada horário abre um painel, o
 * que em ARIA é exatamente `tablist`/`tab`/`tabpanel` — o padrão que leitor de
 * tela anuncia como "aba 2 de 6, selecionada". A cronologia não se perde: o
 * horário é a primeira coisa dentro do rótulo de cada aba.
 *
 * **O avanço automático e a WCAG 2.2.2.** Conteúdo que se move sozinho por
 * mais de 5s precisa de um jeito de parar. São quatro salvaguardas:
 * 1. um botão de pausar/retomar, visível e rotulado;
 * 2. escolher uma aba (clique ou teclado) desliga o avanço — quem assumiu o
 *    controle não quer a página trocando debaixo do dedo;
 * 3. `prefers-reduced-motion: reduce` nunca liga o avanço;
 * 4. fora da viewport o timer não corre, então a programação não "passa"
 *    inteira enquanto ninguém está olhando.
 *
 * Trocar no HOVER continua fora: o ponteiro passa por ali a caminho de outra
 * coisa, e o painel piscaria sem ninguém ter pedido.
 */
export function ExperienceProgramTabs({ items, ongoing, venue, city, uf, venueNote }: Props) {
  const [active, setActive] = useState(0)
  /** Avanço automático ligado. Só nasce ligado se o sistema não pedir o contrário. */
  const [auto, setAuto] = useState(false)
  const [naTela, setNaTela] = useState(false)
  const secaoRef = useRef<HTMLElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const baseId = useId()
  const tabId = (i: number) => `${baseId}-tab-${i}`
  const panelId = (i: number) => `${baseId}-panel-${i}`

  // Ligado só depois de montar: no servidor não há como saber a preferência de
  // movimento, e assumir "ligado" no HTML faria a barra de progresso aparecer
  // animada por um instante para quem pediu menos movimento.
  useEffect(() => {
    if (!querMenosMovimento()) setAuto(true)
  }, [])

  useEffect(() => {
    const alvo = secaoRef.current
    if (!alvo || typeof IntersectionObserver !== 'function') {
      setNaTela(true)
      return
    }
    const obs = new IntersectionObserver(([e]) => setNaTela(Boolean(e?.isIntersecting)), {
      threshold: 0.25,
    })
    obs.observe(alvo)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!auto || !naTela) return
    const t = setInterval(() => setActive((i) => (i + 1) % items.length), PASSO_MS)
    return () => clearInterval(t)
  }, [auto, naTela, items.length])

  /**
   * Escolha manual. Desliga o avanço — e no mobile, onde o painel fica abaixo
   * da lista, rola o mínimo para ele: sem isso, tocar num horário trocaria uma
   * foto fora da tela e a interação pareceria não ter funcionado.
   * `block: 'nearest'` não mexe em nada quando o painel já está visível, que é
   * o caso do desktop.
   */
  const escolher = useCallback((i: number) => {
    setActive(i)
    setAuto(false)
    const el = panelRef.current
    if (!el) return
    const box = el.getBoundingClientRect()
    if (box.top >= 0 && box.bottom <= window.innerHeight) return
    el.scrollIntoView({ block: 'nearest', behavior: querMenosMovimento() ? 'auto' : 'smooth' })
  }, [])

  /** Setas movem a seleção; Home/End vão aos extremos — o teclado que o padrão de tabs manda existir. */
  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const last = items.length - 1
    let next: number | null = null
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight')
      next = active === last ? 0 : active + 1
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft')
      next = active === 0 ? last : active - 1
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = last
    if (next === null) return
    event.preventDefault()
    setActive(next)
    setAuto(false)
    document.getElementById(tabId(next))?.focus()
  }

  return (
    <section className="program s-white" ref={secaoRef}>
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
                  onClick={() => escolher(i)}
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
                  {/*
                    A barra que se enche avisa que a próxima atividade vai
                    entrar — sem ela, o painel trocaria "do nada". O `key`
                    reinicia a animação a cada avanço; sem `key`, ela rodaria
                    uma vez só e as trocas seguintes ficariam mudas.
                  */}
                  {i === active && auto && naTela && (
                    <span aria-hidden="true" className="prog" key={active} />
                  )}
                </button>
              ))}
            </div>

            <button
              aria-pressed={!auto}
              className="sched-toggle"
              onClick={() => setAuto((v) => !v)}
              type="button"
            >
              {auto ? (
                <>
                  <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                    <rect height="14" rx="1" width="4" x="7" y="5" />
                    <rect height="14" rx="1" width="4" x="13" y="5" />
                  </svg>
                  Pausar a passagem automática
                </>
              ) : (
                <>
                  <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5.5v13l11-6.5-11-6.5Z" />
                  </svg>
                  Passar as atividades automaticamente
                </>
              )}
            </button>
          </div>

          <div className="place-stack" ref={panelRef}>
            {items.map((item, i) => (
              /*
                O painel inativo não sai mais por `hidden` (`display:none`
                impede o crossfade), mas ocultá-lo NÃO pode depender do CSS:
                se a folha falhar, os seis painéis apareceriam empilhados e
                o leitor de tela leria a programação seis vezes.
                `aria-hidden` tira da árvore de acessibilidade e `inert` tira
                do foco e do ponteiro — os dois via atributo, no HTML.
              */
              <figure
                aria-hidden={i !== active}
                aria-labelledby={tabId(i)}
                className={i === active ? 'place is-active' : 'place'}
                id={panelId(i)}
                inert={i !== active}
                key={item.time}
                role="tabpanel"
                tabIndex={i === active ? 0 : -1}
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
