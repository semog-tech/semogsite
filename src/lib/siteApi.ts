import 'server-only'

import { signJWT } from '@vercel/kms'
import type { ConsentimentoDeAnuncio } from './adsConsent'
import type { Dispositivo } from './qr'

/**
 * Cliente da Data API do Supabase para as funções do schema `site_api` — o
 * caminho que substitui a conexão Postgres direta de `db.ts` (pool `pg` pelo
 * proxy 7432 do droplet), migrado ponto a ponto.
 *
 * Quem autentica é um JWT curto assinado pelo **Vercel KMS** (`signJWT`), que o
 * Supabase aceita como Third-Party Auth. O `role` do token (`site_api_runtime`)
 * é fixado pela política do emissor no KMS: o site não escolhe, e por isso as
 * `claims` abaixo levam só o `sub`. A chave publishable vai no `apikey` porque
 * a Data API exige uma; ela não é segredo, mas só o servidor a usa (sem
 * `NEXT_PUBLIC_`). O JWT do KMS, esse sim, nunca aparece em log nem em erro.
 *
 * `fetch` puro em vez de `supabase-js`: são duas chamadas `POST /rpc`, e o
 * cliente traria sessão, realtime e refresh de token que não servem a um
 * token emitido aqui.
 */

/** Liga a Data API nos pontos migrados. Qualquer valor diferente de `'true'` mantém o pool. */
export function siteApiAtivo(): boolean {
  return process.env.SITE_API_ATIVO === 'true'
}

/** Funções de `site_api` que o site chama, com os parâmetros exatos de cada uma. */
type ParametrosDe = {
  whatsapp_clique_inserir: {
    p_gclid: string | null
    p_page: string | null
    p_section: string | null
    p_ads_consent: ConsentimentoDeAnuncio
  }
  qr_acesso_inserir: {
    p_slug: string
    p_conhecido: boolean
    p_destino: string
    p_dispositivo: Dispositivo
  }
}

export type FuncaoSiteApi = keyof ParametrosDe

export type MotivoSiteApi = 'configuracao' | 'token' | 'prazo' | 'rede' | 'http'

/**
 * Falha de uma chamada a `site_api`. `status` e `codigo` (o `code` do
 * PostgREST, ex. `PGRST303` para token vencido) só existem em `motivo: 'http'`.
 * A mensagem é montada aqui, nunca copiada de cabeçalho: o token não entra.
 */
export class SiteApiErro extends Error {
  readonly motivo: MotivoSiteApi
  readonly status: number | null
  readonly codigo: string | null

  constructor(
    motivo: MotivoSiteApi,
    mensagem: string,
    extra: { status?: number; codigo?: string | null; cause?: unknown } = {},
  ) {
    super(mensagem, { cause: extra.cause })
    this.name = 'SiteApiErro'
    this.motivo = motivo
    this.status = extra.status ?? null
    this.codigo = extra.codigo ?? null
  }
}

/** Vida pedida ao KMS para cada token. */
const TTL_TOKEN_S = 300

/** Com menos que isto de vida, o token é trocado antes de ir para a chamada. */
const RENOVAR_ANTES_MS = 60_000

const PRAZO_KMS_MS = 5_000
const PRAZO_RPC_MS = 8_000

type Configuracao = { url: string; chave: string; emissor: string }

function configuracao(): Configuracao {
  const url = process.env.SUPABASE_URL
  const chave = process.env.SUPABASE_PUBLISHABLE_KEY
  const emissor = process.env.KMS_SITE_API_ISSUER_ID
  if (!url || !chave || !emissor) {
    throw new SiteApiErro(
      'configuracao',
      'SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY e KMS_SITE_API_ISSUER_ID são obrigatórias com SITE_API_ATIVO=true',
    )
  }
  if (!url.startsWith('https://')) {
    throw new SiteApiErro('configuracao', 'SUPABASE_URL precisa ser https')
  }
  return { url: url.replace(/\/+$/, ''), chave, emissor }
}

/** Rejeita com `motivo: 'prazo'` quando estoura, mesmo que a operação ignore o sinal. */
function comPrazo<T>(
  ms: number,
  oQue: string,
  executa: (sinal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controle = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined
  const estouro = new Promise<never>((_, rejeita) => {
    timer = setTimeout(() => {
      controle.abort()
      rejeita(new SiteApiErro('prazo', `${oQue}: sem resposta em ${ms} ms`))
    }, ms)
  })
  return Promise.race([executa(controle.signal), estouro]).finally(() => clearTimeout(timer))
}

type TokenEmCache = { valor: string; venceEm: number }

/** Um por instância da função; vale para todas as requisições que ela atender. */
let tokenEmCache: TokenEmCache | null = null
/** Assinatura em andamento: requisições simultâneas esperam a mesma, em vez de pedir uma cada. */
let assinando: Promise<TokenEmCache> | null = null

/** `exp` do payload, em ms. `null` se o token não for um JWT legível. */
function expDoToken(token: string): number | null {
  try {
    const payload: unknown = JSON.parse(
      Buffer.from(token.split('.')[1] ?? '', 'base64url').toString(),
    )
    if (typeof payload === 'object' && payload !== null && 'exp' in payload) {
      return typeof payload.exp === 'number' ? payload.exp * 1000 : null
    }
    return null
  } catch {
    return null
  }
}

async function assinaToken(emissor: string): Promise<TokenEmCache> {
  const pedidoEm = Date.now()
  try {
    const { token } = await comPrazo(PRAZO_KMS_MS, 'KMS', () =>
      signJWT({ issuerId: emissor, claims: { sub: 'semogsite' }, ttl: TTL_TOKEN_S }),
    )
    // Vale o que vencer primeiro: o `exp` que o KMS gravou (a política pode
    // encurtar o TTL pedido) ou a conta local, medida a partir do pedido.
    const local = pedidoEm + TTL_TOKEN_S * 1000
    return { valor: token, venceEm: Math.min(expDoToken(token) ?? local, local) }
  } catch (err) {
    if (err instanceof SiteApiErro) throw err
    // `VercelKmsError` traz status e código da API; o OIDC token não está nele.
    const detalhe = err instanceof Error ? err.message : String(err)
    throw new SiteApiErro('token', `KMS não assinou o token: ${detalhe}`, { cause: err })
  }
}

async function tokenValido(emissor: string): Promise<string> {
  if (tokenEmCache && tokenEmCache.venceEm - Date.now() > RENOVAR_ANTES_MS) {
    return tokenEmCache.valor
  }
  assinando ??= assinaToken(emissor).finally(() => {
    assinando = null
  })
  tokenEmCache = await assinando
  return tokenEmCache.valor
}

/** Erro do PostgREST: `{ code, message }`. Corpo fora desse formato vira só o status. */
function erroHttp(funcao: string, status: number, corpo: string): SiteApiErro {
  let codigo: string | null = null
  let mensagem = ''
  try {
    const json: unknown = JSON.parse(corpo)
    if (typeof json === 'object' && json !== null) {
      if ('code' in json && typeof json.code === 'string') codigo = json.code
      if ('message' in json && typeof json.message === 'string') mensagem = json.message
    }
  } catch {
    // corpo não-JSON (proxy, página de erro): fica só o status
  }
  const sufixo = `${codigo ? ` ${codigo}` : ''}${mensagem ? `: ${mensagem.slice(0, 300)}` : ''}`
  return new SiteApiErro('http', `site_api.${funcao}: HTTP ${status}${sufixo}`, { status, codigo })
}

type RespostaBruta = { status: number; ok: boolean; corpo: string }

async function postaRpc(
  { url, chave }: Configuracao,
  token: string,
  funcao: FuncaoSiteApi,
  parametros: unknown,
): Promise<RespostaBruta> {
  try {
    return await comPrazo(PRAZO_RPC_MS, `site_api.${funcao}`, async (signal) => {
      const r = await fetch(`${url}/rest/v1/rpc/${funcao}`, {
        method: 'POST',
        headers: {
          apikey: chave,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          // Schema fora do `public`: em POST o PostgREST lê o `Content-Profile`.
          'Content-Profile': 'site_api',
        },
        body: JSON.stringify(parametros),
        signal,
        cache: 'no-store',
      })
      return { status: r.status, ok: r.ok, corpo: await r.text() }
    })
  } catch (err) {
    if (err instanceof SiteApiErro) throw err
    throw new SiteApiErro('rede', `site_api.${funcao}: falha de rede`, { cause: err })
  }
}

/**
 * `POST {SUPABASE_URL}/rest/v1/rpc/<funcao>` no schema `site_api`. Devolve o
 * JSON da resposta, ou `null` quando ela vem vazia (função `returns void`).
 * Toda falha vira `SiteApiErro`.
 */
export async function chamarRpc<F extends FuncaoSiteApi>(
  funcao: F,
  parametros: ParametrosDe[F],
): Promise<unknown> {
  const config = configuracao()
  const token = await tokenValido(config.emissor)
  const { status, ok, corpo } = await postaRpc(config, token, funcao, parametros)

  if (!ok) {
    // Token recusado (vencido, chave do emissor trocada): o próximo pedido assina outro.
    if (status === 401) tokenEmCache = null
    throw erroHttp(funcao, status, corpo)
  }
  if (!corpo) return null
  try {
    const json: unknown = JSON.parse(corpo)
    return json
  } catch (err) {
    throw new SiteApiErro('http', `site_api.${funcao}: HTTP ${status} com corpo ilegível`, {
      status,
      cause: err,
    })
  }
}
