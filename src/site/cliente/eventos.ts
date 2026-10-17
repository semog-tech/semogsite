/**
 * Os gatilhos do "Sou cliente" (cabeçalho, menu, rodapé e Contato) pedem o painel por um
 * evento de janela; o painel, um por página, ouve. Assim cada gatilho é pequeno e o painel não
 * se repete.
 */
export const EVENTO_SOU_CLIENTE = 'semog:sou-cliente'

/** Só os três lugares da resposta do Leandro (cabeçalho, com o menu do celular, rodapé e Contato). */
export type OrigemSouCliente = 'cabecalho' | 'menu' | 'rodape' | 'contato'
export type TelaInicial = 'menu' | 'segunda-via'
export type PedidoSouCliente = {
  origem: OrigemSouCliente
  tela: TelaInicial
  /** Para onde o foco volta quando o painel fecha. */
  gatilho: HTMLElement | null
}

export function pedirSouCliente(pedido: PedidoSouCliente): void {
  window.dispatchEvent(new CustomEvent<PedidoSouCliente>(EVENTO_SOU_CLIENTE, { detail: pedido }))
}

export function lerPedido(evento: Event): PedidoSouCliente | null {
  if (!(evento instanceof CustomEvent)) return null
  const detalhe: unknown = evento.detail
  if (detalhe === null || typeof detalhe !== 'object') return null
  if (!('origem' in detalhe) || !('tela' in detalhe)) return null
  // `as`: as chaves foram conferidas acima, e o evento só nasce em pedirSouCliente.
  return detalhe as PedidoSouCliente
}
