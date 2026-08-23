/**
 * Patrocinadores do Experience 2026. Acrescentar aqui não exige tocar no
 * layout — a faixa se ajusta sozinha.
 *
 * A faixa tem fundo CLARO de propósito: a diretriz de marca da Superlógica
 * define a versão colorida como primária para fundos claros e proíbe aplicar
 * o logo sobre imagem, com sombra ou em preto.
 */
export type Sponsor = {
  name: string
  logo: string
  url: string
  /** Largura de exibição em px; ajusta o peso óptico entre logos diferentes. */
  width: number
}

export const EXPERIENCE_SPONSORS: Sponsor[] = [
  {
    name: 'Superlógica',
    logo: '/sponsors/logo-superlogica-color.svg',
    url: 'https://www.superlogica.com/',
    /**
     * 260px é a largura da peça aprovada pelo cliente (o `<img … width="260">`
     * do protótipo). Já esteve em 190 por peso óptico; voltou ao aprovado
     * porque a faixa é exigência de marca do patrocinador e a peça publicada
     * não pode divergir da validada sem ninguém saber.
     */
    width: 260,
  },
]
