import type { PropostaValues } from '@/lib/form-schemas'

/**
 * Cidade de cada landing de unidade, a partir do slug. Fonte única para quem
 * precisa saber a praça pela URL no navegador: o `LeadClickTracker` (mensagem
 * do WhatsApp), o `PropostaForm` (pré-seleção do campo) e a triagem do botão
 * flutuante (pré-seleção da proposta curta).
 *
 * Os slugs repetem os de `src/data/cityLandings.ts` de propósito: aquele módulo
 * carrega o conteúdo inteiro das landings (depoimentos, FAQs), e os três
 * consumidores acima são componentes de cliente — importá-lo jogaria tudo isso
 * no bundle. O teste `cidade-da-landing` confere que as duas listas batem, e
 * `cidade` é tipada contra o enum do formulário, então o `tsc` cobra a praça
 * nova aqui também.
 */
export type CidadeDaLanding = {
  /** Nome curto, para texto corrido ("em Recife"). */
  nome: string
  /** Opção do campo "Cidade do condomínio" do formulário de proposta. */
  cidade: PropostaValues['cidade']
}

export const CIDADE_POR_SLUG: Record<string, CidadeDaLanding> = {
  'administradora-de-condominios-recife': { nome: 'Recife', cidade: 'Recife e região' },
  'administradora-de-condominios-joao-pessoa': {
    nome: 'João Pessoa',
    cidade: 'João Pessoa e região',
  },
  'administradora-de-condominios-campina-grande': {
    nome: 'Campina Grande',
    cidade: 'Campina Grande e região',
  },
  'administradora-de-condominios-belem': { nome: 'Belém', cidade: 'Belém e região' },
}

/**
 * A cidade da landing em que o visitante está, ou `undefined` fora delas.
 * Compara o caminho inteiro (sem as barras das pontas), não um pedaço dele: um
 * post de blog com "recife" no endereço não é a landing de Recife.
 */
export function cidadeDaLanding(pathname: string): CidadeDaLanding | undefined {
  return CIDADE_POR_SLUG[pathname.replace(/^\/+|\/+$/g, '')]
}
