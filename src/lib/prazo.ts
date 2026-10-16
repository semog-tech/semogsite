/** Rejeita se `promessa` não terminar em `ms`; o timer é sempre limpo. */
export async function comPrazo<T>(promessa: Promise<T>, ms: number, rotulo: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const estouro = new Promise<never>((_, rejeitar) => {
    timer = setTimeout(() => rejeitar(new Error(`${rotulo} passou de ${ms} ms`)), ms)
  })
  try {
    return await Promise.race([promessa, estouro])
  } finally {
    clearTimeout(timer)
  }
}
