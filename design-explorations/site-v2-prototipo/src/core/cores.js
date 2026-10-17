/* Leitura de tokens de cor do :root para canvas e shader (que não entendem var()). */

/**
 * Cor de um token hex do :root como [r, g, b] (0–255).
 * @param {string} nome ex.: "--marinho"
 * @returns {[number, number, number]}
 */
export function corDoToken(nome) {
  const valor = getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
  const m = /^#([0-9a-f]{6})$/i.exec(valor);
  if (!m) throw new Error(`Token ${nome} não é hex de 6 dígitos: "${valor}".`);
  const n = Number.parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
