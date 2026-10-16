import type { Pendente } from '@/site/conteudo/pendencias'

/** Selo da prévia no lugar de um dado que o Leandro ainda vai mandar (o .a-confirmar é da fase 1). */
export function Pendencia({ item }: { item: Pendente }) {
  return <span className="a-confirmar">A CONFIRMAR: {item.pendente}</span>
}
