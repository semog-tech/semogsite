/** Número em pt-BR: "1.234" ou "1.234,5". Puro: serve a Server Component e a cena. */
export function formatarNumero(valor: number, casas = 0): string {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  })
}

/** Recebe fração: 0.123 → "12,3%". */
export function formatarPercentual(fracao: number, casas = 1): string {
  return fracao.toLocaleString('pt-BR', {
    style: 'percent',
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  })
}
