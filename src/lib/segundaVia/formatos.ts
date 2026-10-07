/**
 * Formatos que a 2ª via confere no site antes de gastar uma chamada ao app.
 * Módulo puro: roda no navegador (campo do código) e na Server Action.
 */

const TAMANHO_DO_CODIGO = 6

/**
 * Código de 6 dígitos, tolerando o que a pessoa cola do e-mail: espaço ou hífen
 * no meio ("123 456", "123-456") e espaço nas pontas. Qualquer outro caractere
 * (letra, ponto) ou tamanho diferente é `null` — erro de formato no site, sem
 * gastar tentativa no app.
 */
export function normalizarCodigo(v: string): string | null {
  const limpo = v.replace(/[\s-]/g, '')
  return /^\d+$/.test(limpo) && limpo.length === TAMANHO_DO_CODIGO ? limpo : null
}

/** Referência opaca (desafio/sessão) devolvida pelo app: base64url de 22 a 43 caracteres. */
export function refValida(v: unknown): v is string {
  return typeof v === 'string' && /^[A-Za-z0-9_-]{22,43}$/.test(v)
}
