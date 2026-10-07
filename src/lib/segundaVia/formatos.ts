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

/**
 * Tamanho exato, em caracteres base64url, de cada referência opaca do app:
 * desafio e sessão têm 43 (32 bytes); unidade e cobrança, 22 (16 bytes).
 */
const TAMANHO_DA_REF = { desafio: 43, sessao: 43, referencia: 22 } as const

export type TipoDeRef = keyof typeof TAMANHO_DA_REF

/** Referência opaca devolvida pelo app, conferida com o tamanho exato do seu tipo. */
export function refValida(v: unknown, tipo: TipoDeRef): v is string {
  return typeof v === 'string' && v.length === TAMANHO_DA_REF[tipo] && /^[A-Za-z0-9_-]+$/.test(v)
}
