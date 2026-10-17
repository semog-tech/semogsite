/** Cada item com uma chave estável, mesmo repetido (dois lembretes no fluxo, dois "S" na semana). */
export function comChaves(lista: readonly string[]): { chave: string; valor: string }[] {
  const vistos = new Map<string, number>()
  return lista.map((valor) => {
    const vez = (vistos.get(valor) ?? 0) + 1
    vistos.set(valor, vez)
    return { chave: `${valor}#${vez}`, valor }
  })
}
