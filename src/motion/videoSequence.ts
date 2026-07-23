/**
 * Política de sequenciamento do fundo de vídeo do hero, separada da
 * manipulação de DOM em `VideoSequenceBackground.tsx`. Funções puras: dá
 * para testar a decisão ("já é hora de carregar o próximo?") sem simular um
 * `<video>` em jsdom, que não implementa `duration`/`canplay`.
 */

/** Duração do crossfade entre as duas camadas. */
export const FADE_MS = 1400

/**
 * Antecedência com que o próximo clipe começa a carregar. Precisa ser MAIOR
 * que `FADE_MS` — o clipe tem que estar pronto quando o crossfade começar,
 * senão a camada que entra aparece preta.
 */
export const PRELOAD_LEAD_S = 3

/**
 * No mobile, um clipe só: o ciclo completo custa ~2,9 MB, o que é caro demais
 * em rede móvel para um fundo decorativo. O primeiro clipe é a matriz (Recife).
 */
export function sequenceFor(videos: string[], isMobile: boolean): string[] {
  if (!isMobile) return videos
  return videos.slice(0, 1)
}

/** Próximo índice, ciclando. Devolve 0 em lista vazia (em vez de NaN). */
export function nextIndex(index: number, length: number): number {
  if (length <= 0) return 0
  return (index + 1) % length
}

/**
 * `duration` é NaN até o browser ler os metadados do clipe — daí a guarda em
 * `Number.isFinite`, sem a qual a comparação seria sempre falsa de um jeito
 * silencioso.
 */
function withinTail(currentTime: number, duration: number, seconds: number): boolean {
  if (!Number.isFinite(duration) || duration <= 0) return false
  return currentTime >= duration - seconds
}

/** Entrou na janela de crossfade. */
export function shouldFade(currentTime: number, duration: number, fadeSeconds: number): boolean {
  return withinTail(currentTime, duration, fadeSeconds)
}

/** Entrou na janela de pré-carregamento do próximo clipe. */
export function shouldPreload(currentTime: number, duration: number, leadSeconds: number): boolean {
  return withinTail(currentTime, duration, leadSeconds)
}
