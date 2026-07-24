import type { ReactNode } from 'react'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Section } from '@/components/ui/Section'
import type { LearnCenterBlock as LearnCenterBlockType } from '@/types/blocks'
import type { Media } from '@/types/media'
import { LearnTabs } from './Tabs'

/** Triângulo de play dos cards de vídeo. */
function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
      <path d="M5 3.4v11.2a.6.6 0 00.92.5l8.5-5.6a.6.6 0 000-1L5.92 2.9a.6.6 0 00-.92.5z" />
    </svg>
  )
}

/**
 * Central de aprendizado do aplicativo — três abas numa seção só, cada uma
 * resolvendo um problema diferente:
 *
 * - `videos`: o formato que o morador prefere, mas o Google não lê. Card sem
 *   `videoUrl` fica inativo (`.learn-vid-soon`) — o vídeo ainda não existe.
 * - `guides`: passo a passo em texto, renderizado sempre no servidor (é o
 *   `content` passado pra `LearnTabs`, não algo que a ilha client decide
 *   montar) — é a aba que o Google indexa e a que funciona com internet
 *   ruim, então é ela que garante que a página tem conteúdo mesmo sem os
 *   vídeos gravados.
 * - `materials`: o que o síndico imprime e distribui pra o app ser adotado.
 *
 * Cada lista é opcional: aba sem conteúdo não aparece (o array `panels` só
 * ganha a entrada correspondente quando a lista não está vazia), e o bloco
 * inteiro não renderiza se as três estiverem vazias — permite publicar a
 * página antes de os vídeos existirem.
 */
export function LearnCenterBlock({
  eyebrow,
  title,
  lead,
  videos,
  guides,
  materials,
}: LearnCenterBlockType) {
  const hasVideos = (videos?.length ?? 0) > 0
  const hasGuides = (guides?.length ?? 0) > 0
  const hasMaterials = (materials?.length ?? 0) > 0
  if (!hasVideos && !hasGuides && !hasMaterials) return null

  const panels: { key: string; label: string; content: ReactNode }[] = []

  if (hasVideos) {
    panels.push({
      key: 'videos',
      label: 'Vídeos',
      content: (
        <div className="learn-vids">
          {(videos ?? []).map((v) => {
            const inner = (
              <>
                <span className="learn-vid-shot">
                  <span className="learn-vid-play">
                    <PlayIcon />
                  </span>
                  {v.duration && <span className="learn-vid-time">{v.duration}</span>}
                </span>
                <span className="learn-vid-txt">
                  <span className="learn-vid-title">{v.title}</span>
                  {v.text && <span className="learn-vid-text">{v.text}</span>}
                </span>
              </>
            )
            return v.videoUrl ? (
              <a
                key={v.id ?? v.title}
                className="learn-vid"
                href={v.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {inner}
              </a>
            ) : (
              <div key={v.id ?? v.title} className="learn-vid learn-vid-soon">
                {inner}
              </div>
            )
          })}
        </div>
      ),
    })
  }

  if (hasGuides) {
    panels.push({
      key: 'guias',
      label: 'Passo a passo',
      content: (
        <div className="learn-guides">
          {(guides ?? []).map((g, i) => (
            <details key={g.id ?? g.title} open={i === 0}>
              <summary>
                <span className="learn-guide-n">{String(i + 1).padStart(2, '0')}</span>
                {g.title}
              </summary>
              <div className="learn-guide-body">
                <ol>
                  {(g.steps ?? []).map((s, j) => (
                    <li key={s.id ?? `${g.title}-${j}`}>{s.text}</li>
                  ))}
                </ol>
                {g.note && <p className="learn-guide-note">{g.note}</p>}
              </div>
            </details>
          ))}
        </div>
      ),
    })
  }

  if (hasMaterials) {
    panels.push({
      key: 'material',
      label: 'Material do condomínio',
      content: (
        <div className="learn-kits">
          {(materials ?? []).map((m) => {
            const file = m.file && typeof m.file === 'object' ? (m.file as Media) : undefined
            const body = (
              <>
                {m.kind && <span className="learn-kit-kind">{m.kind}</span>}
                <span className="learn-kit-title">{m.title}</span>
                {m.text && <span className="learn-kit-text">{m.text}</span>}
              </>
            )
            return file?.url ? (
              <a key={m.id ?? m.title} className="learn-kit" href={file.url} download>
                {body}
              </a>
            ) : (
              <div key={m.id ?? m.title} className="learn-kit">
                {body}
              </div>
            )
          })}
        </div>
      ),
    })
  }

  return (
    <Section className="bg-navy-950">
      <Container>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h2 className="text-h2">{title}</h2>
        {lead && <p className="learn-lead">{lead}</p>}
        <LearnTabs panels={panels} />
      </Container>
    </Section>
  )
}
