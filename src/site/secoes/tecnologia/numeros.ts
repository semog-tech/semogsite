import type { NumerosDaPrestacao } from '@/site/conteudo/conteudo'
import { formatarNumero } from '@/site/formatar'

/** A frase dos números da nova prestação, com o dado e a data de corte que o Leandro informar. */
export function fraseDosNumerosDaPrestacao({
  prestacoes,
  condominios,
  corte,
}: NumerosDaPrestacao): string {
  // TEXTO-NOVO: a mesma frase do protótipo, com o dado novo e a data de corte no lugar.
  return `Até ${corte}, foram mais de ${formatarNumero(prestacoes)} prestações em ${formatarNumero(condominios)} condomínios.`
}
