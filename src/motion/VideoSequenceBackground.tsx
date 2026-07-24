'use client'

import { useEffect, useRef, useState } from 'react'
import {
  FADE_MS,
  nextIndex,
  PRELOAD_LEAD_S,
  sequenceFor,
  shouldFade,
  shouldPreload,
} from './videoSequence'

type Props = {
  videos: string[]
  poster?: string
  className?: string
}

/**
 * Fundo de vídeo em sequência com crossfade, para o hero (Hero
 * `background: 'videoSequence'`). Um `<video>` por clipe, todos empilhados
 * (absolute, opacity 0 exceto o ativo); ao se aproximar do fim do clipe
 * ativo, um crossfade de opacidade troca o elemento visível para o próximo.
 *
 * Um elemento por clipe — não duas camadas reaproveitadas em ping-pong — é a
 * correção de um bug medido via CDP `Network.dataReceived`: reatribuir
 * `.src` num `<video>` (o desenho anterior) descarta o buffer decodificado
 * do elemento, e o pipeline de mídia do Chromium reemite as range requests
 * do clipe inteiro ignorando o `Cache-Control` da resposta anterior — o
 * resultado era ~7,9 MB baixados em 35s de desktop (os 4 clipes, ~2,9 MB,
 * sendo rebaixados a cada volta do ciclo) mesmo com cache HTTP imutável em
 * `/hero/:file*.mp4` (`next.config.ts`). Aqui cada elemento recebe `src`
 * exatamente uma vez (guarda `loaded`) — nas voltas seguintes do ciclo o
 * elemento já tem o vídeo bufferizado e só toca de novo, sem nova requisição.
 *
 * Carregamento preguiçoso continua igual (Task 2/3): `preload="none"` em
 * todos os elementos, `src` atribuído só quando faltam `PRELOAD_LEAD_S`
 * segundos para o clipe ativo acabar. `poster` cobre a janela entre o
 * primeiro paint e o primeiro frame decodificado do primeiro elemento.
 *
 * Anima SEMPRE — muted/autoplay/playsInline, inclusive sob
 * `prefers-reduced-motion`: o movimento do hero faz parte da identidade e é
 * pedido explícito do dono do site. O botão de pausa (`.hero-video-pause`,
 * Task 4) dá a saída exigida pela WCAG 2.2.2 sem tirar o autoplay. Todos os
 * clipes são mudos, então o autoplay é permitido pelos navegadores.
 */
export function VideoSequenceBackground({ videos, poster, className }: Props) {
  // Um ref por clipe de `videos` (não por clipe de `sequenceFor`, que só é
  // conhecido no cliente): renderizar sempre `videos.length` elementos deixa
  // a árvore de DOM igual em SSR e no cliente, independente de mobile/
  // desktop. No mobile, os elementos além do primeiro nunca recebem `src`
  // (o efeito usa só `seq.length` deles) — ficam inertes, sem custo de rede.
  const refs = useRef<(HTMLVideoElement | null)[]>([])
  const [paused, setPaused] = useState(false)
  // Vira `true` só dentro do `onClick` do botão — nunca no efeito que lê este
  // valor (veja o efeito abaixo). É o que impede aquele efeito de agir no
  // mount, mesmo sob Strict Mode (que invoca o efeito 2x de propósito).
  const userToggledPause = useRef(false)

  useEffect(() => {
    // `matchMedia` só existe no cliente; o efeito já não roda no servidor.
    const isMobile = window.matchMedia('(max-width: 768px)').matches
    const seq = sequenceFor(videos, isMobile)
    if (seq.length === 0) return

    const els = refs.current.slice(0, seq.length)
    if (els.some((el) => !el)) return
    const layers = els as HTMLVideoElement[]

    // Cada índice só é "carregado" (recebe `src` + `.load()`) uma vez em toda
    // a vida do componente — é isso que impede o re-download a cada volta.
    const loaded = new Array(seq.length).fill(false)
    let active = 0 // índice do clipe/elemento visível agora
    let fading = false
    let raf = 0
    let swapTimer = 0

    for (const v of layers) {
      v.muted = true
      v.preload = 'none'
    }
    layers.forEach((v, i) => {
      v.style.opacity = i === 0 ? '1' : '0'
    })

    layers[0].src = seq[0]
    layers[0].load()
    loaded[0] = true

    const startFirst = () => {
      layers[0].play().catch(() => {})
    }
    if (layers[0].readyState >= 2) startFirst()
    else layers[0].addEventListener('canplay', startFirst, { once: true })

    const FADE_S = FADE_MS / 1000

    const tick = () => {
      const cur = layers[active]
      const nextI = nextIndex(active, seq.length)
      const next = layers[nextI]

      if (!loaded[nextI] && shouldPreload(cur.currentTime, cur.duration, PRELOAD_LEAD_S)) {
        loaded[nextI] = true
        next.src = seq[nextI]
        next.load()
      }

      if (!fading && loaded[nextI] && shouldFade(cur.currentTime, cur.duration, FADE_S)) {
        fading = true
        next.currentTime = 0
        next.play().catch(() => {})
        cur.style.transition = `opacity ${FADE_MS}ms linear`
        next.style.transition = `opacity ${FADE_MS}ms linear`
        cur.style.opacity = '0'
        next.style.opacity = '1'
        swapTimer = window.setTimeout(() => {
          active = nextI
          fading = false
        }, FADE_MS)
      }

      raf = requestAnimationFrame(tick)
    }
    // Só entra no loop de rAF quando há troca de clipe pra fazer. Com um
    // clipe só (mobile), o `loop` do próprio elemento <video> resolve a
    // repetição sozinho — sem isso, o componente rodaria um loop de rAF a
    // 60fps ocioso (`if (seq.length > 1)` só dentro do `tick`) pela vida
    // inteira da página, gastando CPU/bateria exatamente na plataforma que
    // este componente já otimiza pra rede/dados. `raf` fica 0 se o loop
    // nunca começa; `cancelAnimationFrame(0)` no cleanup é um no-op seguro
    // (o browser nunca atribui o id 0 a uma requisição real).
    if (seq.length > 1) {
      raf = requestAnimationFrame(tick)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(swapTimer)
      layers[0].removeEventListener('canplay', startFirst)
    }
  }, [videos])

  // Aplica o estado de pausa a TODOS os elementos (não só o ativo): pausar
  // tem que parar o visível de imediato, e como está num efeito separado do
  // sequenciador acima, não sabe com certeza se algum outro já ficou tocando
  // por trás de um crossfade em andamento. Retomar, ao contrário, só o
  // elemento hoje visível (`style.opacity !== '0'`, escrito pelo efeito do
  // sequenciador) — os demais estão em opacity 0 (crossfade ainda não
  // chegou neles, ou — no mobile — nunca recebem `src`) e devem seguir
  // pausados; chamar `.play()` neles tocaria vídeo invisível ou, no caso do
  // mobile, um elemento sem `src`. Efeito separado do principal por design:
  // religar `[videos]` como dependência reiniciaria toda a sequência (troca
  // de `src`, zera `currentTime`) a cada clique no botão.
  //
  // O `if (!userToggledPause.current) return` no topo é a correção de uma
  // regressão medida (mesmo teste de CDP `Network.dataReceived` do efeito
  // acima, ~400-500KB a mais): sem ele, este efeito roda também no mount
  // (`paused` começa em `false`, e um efeito roda ao montar mesmo sem
  // mudança de dependência) e cai no `else`, chamando `.play()` no elemento
  // 0 ANTES do `canplay` — ou seja, antes do `readyState` avançar do
  // `.load()` que o efeito do sequenciador acabou de disparar. Pela spec,
  // `play()` num elemento com `networkState` ainda `NETWORK_EMPTY` também
  // invoca o algoritmo de seleção de recurso — um segundo disparo, paralelo
  // ao do `.load()` explícito, que soma bytes de faixas sobrepostas do
  // clipe 0 e estoura o orçamento de 1.15x do teste acima. Não há esse risco
  // depois do mount: a essa altura o clipe já está buffering (ou pausado de
  // fato), então retomar com `.play()` é seguro.
  useEffect(() => {
    if (!userToggledPause.current) return
    for (const v of refs.current) {
      if (!v) continue
      if (paused) v.pause()
      else if (v.style.opacity !== '0') v.play().catch(() => {})
    }
  }, [paused])

  return (
    <>
      <div className={className} aria-hidden="true">
        {videos.map((_, i) => (
          <video
            // biome-ignore lint/suspicious/noArrayIndexKey: `videos` é estática por render.
            key={i}
            ref={(el) => {
              refs.current[i] = el
            }}
            muted
            playsInline
            loop={i === 0}
            preload="none"
            poster={i === 0 ? poster : undefined}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ opacity: i === 0 ? 1 : 0 }}
          />
        ))}
      </div>
      {/* Fora do `div aria-hidden` de propósito: é o controle exigido pela
          WCAG 2.2.2 (parar movimento automático com mais de 5s) e, dentro do
          container oculto a leitores de tela, ficaria inalcançável por
          teclado/AT. Autoplay continua ligado — decisão do dono do site
          registrada no cabeçalho deste arquivo; isto só abre a saída. */}
      <button
        type="button"
        className="hero-video-pause liquid-glass"
        onClick={() => {
          userToggledPause.current = true
          setPaused((v) => !v)
        }}
        aria-label={paused ? 'Retomar vídeo de fundo' : 'Pausar vídeo de fundo'}
      >
        {paused ? (
          <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor" aria-hidden="true">
            <path d="M1 1.2v11.6a.5.5 0 00.77.42l9-5.8a.5.5 0 000-.84l-9-5.8A.5.5 0 001 1.2z" />
          </svg>
        ) : (
          <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor" aria-hidden="true">
            <rect x="1" y="1" width="3.6" height="12" rx="1" />
            <rect x="7.4" y="1" width="3.6" height="12" rx="1" />
          </svg>
        )}
      </button>
    </>
  )
}
