import {
  type Attribution,
  type AttributionField,
  type AttributionTouch,
  buildAttributionFields,
  parseAttributionCookie,
} from '@/lib/attribution'

/**
 * De onde sai a origem gravada no lead, no servidor. Server-safe (sem DOM).
 *
 * **Por que existe um segundo caminho além do cookie.** Em 06/10/2026 um lead
 * de Belém (cms.leads 218) chegou pelo Instagram e foi gravado sem nenhum campo
 * de origem; o GA4 registrou Safari/iOS chegando na home com `fbclid`. A
 * hipótese é o navegador interno do Instagram no iOS não entregar o cookie
 * `semog-attrib` à Server Action. Por isso o formulário manda junto, num campo
 * que a pessoa não vê, o que o navegador sabe da origem (cookie, cópia na
 * `sessionStorage` ou a própria URL — ver `@/lib/origemDoNavegador`).
 *
 * A ordem é: cookie quando existe e é legível; senão o campo do formulário;
 * senão uma marca explícita de "indisponível". Lead sem nenhuma linha de origem
 * é ambíguo (lead antigo? bug? navegador?), e foi essa ambiguidade que custou a
 * investigação do 218.
 *
 * **Os dois chegam do navegador e nenhum é confiável.** O cookie é gravado por
 * JavaScript do próprio site, mas qualquer um o reescreve; o campo é um argumento
 * da Server Action, que qualquer um chama com o que quiser. Os dois passam pela
 * mesma validação campo a campo: tamanho e caracteres. Campo que não passa é
 * descartado sozinho (um `utm_campaign` estranho não leva junto o `fbclid` que
 * veio ao lado).
 */

export type FonteDaOrigem = 'cookie' | 'navegador' | 'indisponivel'

export type OrigemDoLead = { atribuicao: Attribution | null; fonte: FonteDaOrigem }

/** Valor do canal quando nem o cookie nem o campo do formulário trouxeram nada utilizável. */
export const CANAL_INDISPONIVEL = 'Indisponível (sem cookie nem dados de origem do navegador)'

/** Rótulo da linha que diz de onde a origem foi lida (vira `origem — Origem lida de`). */
export const FONTE_DA_ORIGEM_LABEL = 'Origem lida de'

const DESCRICAO_DA_FONTE: Record<FonteDaOrigem, string> = {
  cookie: 'cookie do site',
  navegador: 'dados do navegador enviados com o formulário',
  indisponivel: 'nenhuma fonte',
}

/**
 * Teto do campo do formulário inteiro, antes do `JSON.parse`. Um toque legítimo
 * completo fica abaixo de 2 KB; o teto só impede que alguém faça o servidor
 * analisar um JSON de megabytes.
 */
const TETO_DO_CAMPO = 8_000

/** utm_*: texto livre curto, sem caractere de controle nem os que fecham HTML/atributo. */
const TEXTO = /^[^\p{Cc}<>"'`\\]{1,200}$/u
/** gclid, gbraid, wbraid, fbclid, msclkid: base64url e afins. */
const CLIQUE = /^[\w.~-]{1,512}$/
/** Referrer: URL com esquema (inclui `android-app://` do Gmail), sem espaço nem aspas. */
const URL_DE_REFERENCIA = /^[a-z][a-z0-9+.-]*:\/\/[^\s\p{Cc}<>"'`\\]{1,1000}$/iu
/** Página de entrada: só o caminho, como o `AttributionTracker` grava. */
const CAMINHO = /^\/[\w\-.~/%]{0,300}$/
/** `ts`: o `toISOString()` do navegador. */
const INSTANTE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/

const REGRAS: Record<keyof AttributionTouch, RegExp> = {
  source: TEXTO,
  medium: TEXTO,
  campaign: TEXTO,
  term: TEXTO,
  content: TEXTO,
  gclid: CLIQUE,
  gbraid: CLIQUE,
  wbraid: CLIQUE,
  fbclid: CLIQUE,
  msclkid: CLIQUE,
  referrer: URL_DE_REFERENCIA,
  landing: CAMINHO,
  ts: INSTANTE,
}

// `as`: `Object.keys` devolve `string[]`; as chaves são exatamente as de `REGRAS`,
// que o `Record` acima amarra a `keyof AttributionTouch`.
const CHAVES_DO_TOQUE = Object.keys(REGRAS) as (keyof AttributionTouch)[]

function propriedade(valor: object, chave: string): unknown {
  // `as`: só para indexar por string; `hasOwn` garante que não se lê nada herdado
  // (`constructor`, `__proto__`), e o retorno segue `unknown` até a regra validar.
  return Object.hasOwn(valor, chave) ? (valor as Record<string, unknown>)[chave] : undefined
}

/** Um toque com só os campos que passaram na regra; `null` se nenhum passou. */
function sanitizarToque(valor: unknown): AttributionTouch | null {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return null
  const toque: AttributionTouch = {}
  for (const chave of CHAVES_DO_TOQUE) {
    const campo = propriedade(valor, chave)
    if (typeof campo === 'string' && REGRAS[chave].test(campo)) toque[chave] = campo
  }
  return Object.keys(toque).length > 0 ? toque : null
}

/**
 * Valida uma atribuição vinda do navegador (cookie ou campo do formulário).
 * Sem primeiro toque utilizável não há atribuição; sem último, vale o primeiro.
 */
export function sanitizarAtribuicao(valor: unknown): Attribution | null {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return null
  const first = sanitizarToque(propriedade(valor, 'first'))
  if (!first) return null
  return { first, last: sanitizarToque(propriedade(valor, 'last')) ?? first }
}

/** O campo do formulário: string JSON, com teto de tamanho antes de analisar. */
function lerCampoDoNavegador(campo: unknown): Attribution | null {
  if (typeof campo !== 'string' || campo.length === 0 || campo.length > TETO_DO_CAMPO) return null
  try {
    return sanitizarAtribuicao(JSON.parse(campo))
  } catch {
    // JSON inválido é o mesmo que campo ausente: cai para "indisponível".
    return null
  }
}

/** Cookie quando existe e é legível; senão o campo do formulário; senão nada. */
export function resolverOrigem(cookie: string | undefined, campo: unknown): OrigemDoLead {
  const doCookie = sanitizarAtribuicao(parseAttributionCookie(cookie))
  if (doCookie) return { atribuicao: doCookie, fonte: 'cookie' }
  const doNavegador = lerCampoDoNavegador(campo)
  if (doNavegador) return { atribuicao: doNavegador, fonte: 'navegador' }
  return { atribuicao: null, fonte: 'indisponivel' }
}

/**
 * As linhas de origem do lead (e-mail e `cms.leads.data`). Sempre há ao menos
 * duas: o canal (ou a marca de indisponível) e de onde a origem foi lida.
 */
export function camposDaOrigem(origem: OrigemDoLead): AttributionField[] {
  const fonte = { label: FONTE_DA_ORIGEM_LABEL, value: DESCRICAO_DA_FONTE[origem.fonte] }
  if (!origem.atribuicao) return [{ label: 'Canal (origem)', value: CANAL_INDISPONIVEL }, fonte]
  return [...buildAttributionFields(origem.atribuicao), fonte]
}
