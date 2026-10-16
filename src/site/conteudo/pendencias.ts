/**
 * Dado que depende do Leandro (número, foto, vídeo) entra no conteúdo tipado como `pendente`, num
 * lugar só. Na prévia, a seção mostra o selo A CONFIRMAR (`<Pendencia>`); no commit da virada 1, o
 * teste site-v2-pendencias falha se sobrar alguma. Assim nenhum dado provisório vai ao ar.
 */
export type Pendente = { readonly pendente: string }
export type OuPendente<T> = T | Pendente

export function pendente(oQueFalta: string): Pendente {
  return { pendente: oQueFalta }
}

/** Só o objeto criado por `pendente`: uma chave, `pendente`, com texto. */
export function estaPendente(valor: unknown): valor is Pendente {
  if (valor === null || typeof valor !== 'object' || Array.isArray(valor)) return false
  const chaves = Object.keys(valor)
  if (chaves.length !== 1 || chaves[0] !== 'pendente') return false
  // `as`: a única chave do objeto foi conferida acima; falta só o tipo do valor dela.
  return typeof (valor as { pendente: unknown }).pendente === 'string'
}

/** Cada pendência de um valor, como `"caminho.no.conteudo: o que falta"`. */
export function pendenciasDe(valor: unknown, caminho = ''): string[] {
  if (estaPendente(valor)) return [`${caminho}: ${valor.pendente}`]
  if (Array.isArray(valor)) return valor.flatMap((v, i) => pendenciasDe(v, `${caminho}.${i}`))
  if (valor === null || typeof valor !== 'object') return []
  return Object.entries(valor).flatMap(([chave, v]) =>
    pendenciasDe(v, caminho ? `${caminho}.${chave}` : chave),
  )
}
