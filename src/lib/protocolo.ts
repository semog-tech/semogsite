import { randomInt } from 'node:crypto'

/**
 * Alfabeto de Crockford: dígitos e letras maiúsculas sem I, L, O e U. Tira os
 * caracteres que se confundem lidos em voz alta ou digitados de um print (I/1,
 * L/1, O/0), e o U, que evita formar palavra por acaso.
 */
const ALFABETO = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const TAMANHO = 6

/** Formato do protocolo, para quem precisa conferir um valor recebido. */
export const FORMATO_DO_PROTOCOLO = /^SG-[0-9A-HJKMNP-TV-Z]{6}$/

/**
 * Protocolo da proposta curta (`SG-7K4M2Q`). É o que liga a conversa do
 * WhatsApp ao lead já gravado: vai no `data` do lead, no e-mail interno, na
 * descrição do Exact e na mensagem pronta do "Continuar no WhatsApp".
 *
 * Aleatório e gerado no servidor com `crypto`, de propósito: derivar do `id` de
 * `cms.leads`, que é sequencial, revelaria a quem pede uma proposta quantos
 * pedidos o site recebe. 32⁶ ≈ 1 bilhão de combinações — não é chave única do
 * banco (o `id` continua sendo), é rótulo de conversa.
 */
export function gerarProtocolo(): string {
  let codigo = ''
  for (let i = 0; i < TAMANHO; i++) codigo += ALFABETO[randomInt(ALFABETO.length)]
  return `SG-${codigo}`
}
