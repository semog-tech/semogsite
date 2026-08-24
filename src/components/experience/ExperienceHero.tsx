import { img } from '@/../content/media'
import { ImageMedia } from '@/components/Media/ImageMedia'
import { EXPERIENCE_EVENT as E } from '@/data/experienceEvent'

/**
 * Hero da landing — porte do `<header class="hero s-dark">` do protótipo
 * aprovado. Server component, sem props: data, horário, local e vagas saem
 * todos de `EXPERIENCE_EVENT` (nada digitado aqui, ver Global Constraints do
 * plano).
 *
 * A foto é o LCP da página: `priority` faz o `next/image` emitir o
 * `<link rel="preload">` no `<head>` em vez de esperar o layout.
 *
 * O logo do topo NÃO é link. No protótipo era `href="#"` (placeholder); numa
 * peça de campanha isolada a única saída da página é a inscrição, então virou
 * imagem — no rodapé ele já é tratado assim.
 */
export function ExperienceHero() {
  const hero = img('experience-hero.webp')

  return (
    <header className="hero s-dark">
      <div className="topbar">
        <div className="wrap">
          {/* biome-ignore lint/performance/noImgElement: SVG de /public, sem otimização a fazer (mesmo caso do FooterView) */}
          <img
            alt="Semog Administradora de Condomínios"
            className="logo"
            height={25}
            src="/semog-logo-light.svg"
            width={160}
          />
          <a className="btn btn-primary" href="#inscricao">
            Faça sua inscrição
          </a>
        </div>
      </div>

      <div className="hero-bg">
        <ImageMedia fill priority resource={hero} sizes="100vw" />
      </div>
      <div className="hero-veil" />

      <div className="wrap">
        <div>
          <p className="tag">Movimento. Saúde. Conexão.</p>
          <h1 className="titulo">
            <span className="marca">Semog</span>
            <span className="linha">
              <span className="palavra">Experience</span>
              <span className="ano">{E.edition}</span>
            </span>
          </h1>
        </div>
        <p className="lede">
          Uma manhã inteira dedicada a cuidar de quem cuida do condomínio. Ao ar livre, à beira-mar,
          e por nossa conta.
        </p>

        <div className="meta">
          <div className="meta-item">
            <svg
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              viewBox="0 0 24 24"
            >
              <rect height="16" rx="2" width="18" x="3" y="5" />
              <path d="M3 10h18M8 3v4M16 3v4" />
            </svg>
            <div>
              <div className="meta-label">Data</div>
              <div className="meta-value">
                <time dateTime={E.date}>{E.dateLabel}</time>
                <small>{E.weekday}</small>
              </div>
            </div>
          </div>
          <div className="meta-item">
            <svg
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3.5 2" />
            </svg>
            <div>
              <div className="meta-label">Horário</div>
              <div className="meta-value">
                {E.timeLabel}
                <small>chegue 15 min antes</small>
              </div>
            </div>
          </div>
          <div className="meta-item">
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
              <div className="meta-label">Local</div>
              <div className="meta-value">
                {E.venue}
                <small>
                  {E.city}, {E.uf}
                </small>
                {/* A prefeitura ainda não liberou o ponto da orla (24/08/2026).
                    A ressalva anda junto do local em TODA peça — quem se
                    inscreve não pode descobrir isso depois. */}
                {!E.venueConfirmed && <small className="pending">{E.venueNote}</small>}
              </div>
            </div>
          </div>
        </div>

        <div className="hero-actions">
          <a className="btn btn-primary" href="#inscricao">
            Garantir minha vaga
            <svg
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
          <span className="seats">
            <svg
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <rect height="10" rx="2" width="14" x="5" y="11" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            {E.priceLabel} · {E.seats} vagas
          </span>
        </div>
      </div>

      <div className="badge35">
        <div className="num">
          +35
          <small>anos</small>
        </div>
        <p>De história cuidando de pessoas e valorizando lugares</p>
      </div>
    </header>
  )
}
