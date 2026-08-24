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
  /**
   * Largura de exibição em px; ajusta o peso óptico entre logos diferentes.
   * É TAMBÉM o que expressa a hierarquia entre cotas — não há rótulo de cota
   * na faixa, então cota maior é logo maior. Calibrado olhando a faixa
   * renderizada, não pela largura crua do arquivo: proporções diferentes com a
   * mesma largura têm massa visual bem diferente.
   */
  width: number
  /** Cota contratada. Não vai para a tela; documenta por que a largura é essa. */
  tier: 'diamante' | 'ouro' | 'prata' | 'bronze'
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
    tier: 'diamante',
  },
  {
    name: 'Construtora Tropical',
    /**
     * Extraída do PDF vetorial que o cliente forneceu (24/08/2026), não da
     * internet: a busca só achava versões de rede social em bitmap, e
     * `tropicalconstrutora.com.br` é uma construtora HOMÔNIMA de São Paulo —
     * não esta, que é de João Pessoa. As duas cores são as do arquivo original
     * (#f05323 no símbolo, #53565a no logotipo) e o viewBox foi recortado no
     * conteúdo, sem a margem branca da página do PDF.
     */
    logo: '/sponsors/logo-tropical-color.svg',
    /**
     * O Instagram é o canal oficial ATIVO — a empresa não tem site próprio, e
     * aqui mora uma armadilha: existem pelo menos três "Construtora Tropical"
     * homônimas. `construtoratropical.com` é uma fabricante chinesa,
     * `construtoratropical.com.br` é a de Teresina/PI e
     * `tropicalconstrutora.com.br` é a de São Paulo — nenhuma é esta. O link
     * abaixo foi confirmado por duas evidências: a foto do perfil é o MESMO
     * símbolo solar do PDF que o cliente enviou, e os empreendimentos da linha
     * "GET" (Get Like, em Cabo Branco) são desta construtora de João Pessoa.
     * Não trocar por um domínio "óbvio" sem refazer essa checagem.
     */
    url: 'https://www.instagram.com/construtoratropical/',
    /**
     * A logo é bem menos alongada que a da Superlógica (3,2:1 contra 6,6:1) e
     * tem duas linhas de texto: na mesma largura ela pesaria MAIS que a cota
     * diamante. 150px deixa as duas com massa parecida, e a diferença de cota
     * aparece sem a marca ficar ilegível.
     */
    width: 150,
    tier: 'bronze',
  },
]
