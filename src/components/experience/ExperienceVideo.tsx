import { img } from '@/../content/media'
import { EXPERIENCE_EVENT as E } from '@/data/experienceEvent'

/**
 * Prova social da edição 26 (o vídeo trocou o de 2025 em 16/10/2026) — porte da `<section class="video s-deep">`
 * do protótipo aprovado.
 *
 * Duas decisões que já vinham fechadas no plano e não devem ser revisitadas:
 *
 * 1. O Reel toca AQUI, num `<video>` nativo servido do próprio site. Não é embed do
 *    Instagram: o embed exigiria abrir o CSP para o domínio deles e entregaria
 *    a página a um terceiro (mais scripts, cookies e um convite a sair).
 * 2. O material é VERTICAL (9:16, `E.video.aspectRatio`). Dentro de moldura
 *    16:9 sobrariam duas tarjas pretas ocupando metade da largura.
 *
 * `preload="none"` porque o vídeo está abaixo da dobra: 19,9 MB não podem
 * competir com o hero. O `poster` cobre a moldura até alguém dar play.
 */
export function ExperienceVideo() {
  const video = img(E.video.file)
  const poster = img(E.video.poster)

  return (
    <section className="video s-deep">
      <div className="wrap">
        <div className="grid">
          <div>
            <span className="eyebrow">Edição anterior</span>
            <h2 className="sec-title video-title">
              <span className="leve">Assista como foi o</span>
              Semog <em>Experience {E.video.previousEdition}</em>
            </h2>
            <p style={{ marginTop: '1.1rem' }}>
              Reviva os melhores momentos e sinta a energia que nos move.
            </p>
          </div>
          <div>
            <div className="reel">
              {/* biome-ignore lint/a11y/useMediaCaption: montagem de imagens com trilha, sem narração — não há fala a legendar; o `aria-label` dá o nome acessível ao player */}
              <video
                aria-label={video.alt}
                controls
                playsInline
                poster={poster.url}
                preload="none"
                style={{ aspectRatio: E.video.aspectRatio }}
              >
                <source src={video.url} type="video/mp4" />
                Seu navegador não reproduz este vídeo.
              </video>
            </div>
            <p className="reel-cap">
              Semog Experience {E.video.previousEdition} · {E.city}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
