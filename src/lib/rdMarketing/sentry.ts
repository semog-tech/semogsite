/** A API exige a chave na query; protege também breadcrumbs e spans automáticos. */
export function ocultarChaveMarketing<T extends object>(evento: T): T {
  const vistos = new WeakSet<object>()
  function limpar(valor: object): void {
    if (vistos.has(valor)) return
    vistos.add(valor)
    for (const [chave, item] of Object.entries(valor)) {
      if (typeof item === 'string') {
        const redigido =
          chave.toLowerCase() === 'api_key'
            ? '[Filtered]'
            : item.replace(/(^|[?&\s])api_key=[^&\s"'<>]+/gi, '$1api_key=[Filtered]')
        Reflect.set(valor, chave, redigido)
      } else if (item && typeof item === 'object') {
        limpar(item)
      }
    }
  }
  limpar(evento)
  return evento
}
