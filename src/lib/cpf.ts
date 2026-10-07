/**
 * CPF: só dígitos, dígitos verificadores e máscara. Módulo puro (sem
 * `server-only`), porque o campo da tela mascara no navegador e a Server Action
 * valida de novo no servidor com a mesma função.
 */

const TAMANHO_DO_CPF = 11

/** Tira tudo que não é dígito. */
export function somenteDigitos(v: string): string {
  return v.replace(/\D/g, '')
}

/** Dígito verificador dos `base.length` primeiros dígitos (módulo 11). */
function digitoVerificador(base: string): number {
  const peso = base.length + 1
  let soma = 0
  for (let i = 0; i < base.length; i++) {
    soma += Number(base[i]) * (peso - i)
  }
  const resto = (soma * 10) % 11
  return resto === 10 ? 0 : resto
}

/** Aceita com ou sem máscara. Recusa sequência repetida (`111.111.111-11`). */
export function cpfValido(v: string): boolean {
  const digitos = somenteDigitos(v)
  if (digitos.length !== TAMANHO_DO_CPF) return false
  if (/^(\d)\1+$/.test(digitos)) return false
  const primeiro = digitoVerificador(digitos.slice(0, 9))
  if (primeiro !== Number(digitos[9])) return false
  return digitoVerificador(digitos.slice(0, 10)) === Number(digitos[10])
}

/** Máscara `000.000.000-00` aplicada enquanto a pessoa digita (corta o excesso). */
export function mascararCpf(v: string): string {
  const d = somenteDigitos(v).slice(0, TAMANHO_DO_CPF)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}
