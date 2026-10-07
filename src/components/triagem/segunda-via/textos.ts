import type { ErroCodigo, ErroCpf, TelaSegundaVia } from './estado'

/**
 * Textos e formatos das telas da 2ª via, os da spec ("Fluxos tela a tela →
 * 2ª via"). Os marcados [A CONFIRMAR] na spec entram como estão.
 */

export const TITULOS: Record<TelaSegundaVia, string> = {
  cpf: 'Segunda via do boleto',
  codigo: 'Digite o código',
  unidades: 'Escolha a unidade',
  boletos: 'Boletos em aberto',
  boleto: 'Seu boleto',
  expirada: 'Consulta expirada',
  falha: 'Não conseguimos consultar',
}

/** Sempre o mesmo, exista o CPF ou não: nunca confirma cadastro nem mostra e-mail. */
export const TEXTO_DO_CODIGO =
  'Se este CPF tiver cadastro conosco, enviamos um código de 6 dígitos para o e-mail cadastrado. Ele vale por 10 minutos. Pode levar até 2 minutos para chegar.'

export const NOTA_DE_ENCARGOS =
  'Valor de emissão. Pagando depois do vencimento, os juros e a multa entram automaticamente.'

export const EXPLICACAO_DO_VENCIDO =
  'Este boleto já venceu, mas ainda pode ser pago. Ao abrir, a página mostra o valor do dia para pagar hoje. Se preferir imprimir o boleto original, o banco também aceita e cobra os juros automaticamente.'

export const AVISO_DE_NAO_ENCAMINHAR =
  'Este link abre o boleto com seus dados pessoais. Não encaminhe para outras pessoas.'

/** Espera em linguagem de gente: segundos até 1 min, minutos depois disso. */
export function tempoDeEspera(segundos: number): string {
  if (segundos < 60) return segundos === 1 ? '1 segundo' : `${segundos} segundos`
  const minutos = Math.ceil(segundos / 60)
  return minutos === 1 ? '1 minuto' : `${minutos} minutos`
}

export function mensagemDoErroCpf(erro: ErroCpf): string {
  switch (erro.tipo) {
    case 'entrada_invalida':
      return 'Informe um CPF válido.'
    case 'anti_robo':
      return 'Confirme a verificação anti-robô.'
    case 'limite':
      return `Muitas consultas seguidas. Tente de novo em ${tempoDeEspera(erro.tentarEmSegundos)}.`
  }
}

const SEM_TENTATIVAS = 'Você usou as 3 tentativas. Peça um novo código.'

export function mensagemDoErroCodigo(erro: ErroCodigo): string {
  switch (erro.tipo) {
    case 'incorreto':
      if (erro.tentativasRestantes === 0) return SEM_TENTATIVAS
      return erro.tentativasRestantes === 1
        ? 'Código incorreto. Resta 1 tentativa.'
        : `Código incorreto. Restam ${erro.tentativasRestantes} tentativas.`
    case 'expirado':
      return 'Este código expirou. Comece de novo pelo CPF.'
    case 'bloqueado':
      return SEM_TENTATIVAS
    case 'limite':
      return `Muitas tentativas seguidas. Tente de novo em ${tempoDeEspera(erro.tentarEmSegundos)}.`
    case 'formato':
      return 'O código tem 6 dígitos.'
  }
}

/** `AAAA-MM-DD` → `DD/MM/AAAA`, sem passar por `Date` (fuso não mexe no dia). */
export function dataBrasileira(iso: string): string {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

const REAIS = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/**
 * Centavos inteiros → "R$ 1.234,56". A divisão é só para exibir; nenhuma
 * decisão usa o resultado. `null` é valor que o ERP não trouxe: nunca zero.
 */
export function valorEmReais(centavos: number | null): string {
  return centavos === null ? 'valor indisponível' : REAIS.format(centavos / 100)
}

export function rotuloDaUnidade(u: { unidade: string; condominio: string }): string {
  return `${u.unidade} · ${u.condominio}`
}
