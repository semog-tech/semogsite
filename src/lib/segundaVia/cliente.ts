import 'server-only'
import { assinarPedido } from './assinatura'
import { refValida } from './formatos'
import type {
  CobrancaPublica,
  CorpoDe,
  Limite,
  RespostaDe,
  RotaSegundaVia,
  SituacaoCobrancas,
  UnidadePublica,
} from './tipos'

/**
 * Cliente HTTP da API pública de 2ª via do semogapp. Só roda no servidor.
 *
 * Sem retry, de propósito: repetir `/solicitar` geraria e-mail duplicado.
 * Qualquer falha de transporte, status fora do contrato ou corpo fora do
 * formato vira `{ tipo: 'indisponivel' }`. Nada do corpo, do CPF, da URL ou da
 * resposta é registrado em log (o link do boleto é credencial).
 */

const PREFIXO = '/publico/segunda-via'
const TIMEOUT_MS = 10_000
const TAMANHO_MINIMO_DO_SEGREDO = 32
const HOST_DO_BOLETO = 'semog.superlogica.net'

type Dependencias = {
  fetch?: typeof fetch
  /** Segundos Unix. */
  agora?: () => number
}

type Registro = Record<string, unknown>
type Parser<R extends RotaSegundaVia> = (status: number, corpo: Registro) => RespostaDe<R> | null

const INDISPONIVEL = { tipo: 'indisponivel' } as const

function ehRegistro(v: unknown): v is Registro {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function inteiro(v: unknown): v is number {
  return typeof v === 'number' && Number.isSafeInteger(v) && v >= 0
}

function limite(status: number, c: Registro): Limite | null {
  return status === 429 && c.erro === 'limite' && inteiro(c.tentarEmSegundos)
    ? { tipo: 'limite', tentarEmSegundos: c.tentarEmSegundos }
    : null
}

function unidadePublica(v: unknown): UnidadePublica | null {
  if (!ehRegistro(v) || !refValida(v.ref)) return null
  if (typeof v.condominio !== 'string' || typeof v.unidade !== 'string') return null
  return { ref: v.ref, condominio: v.condominio, unidade: v.unidade }
}

function cobrancaPublica(v: unknown): CobrancaPublica | null {
  if (!ehRegistro(v) || !refValida(v.ref)) return null
  if (typeof v.vencimento !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v.vencimento)) return null
  if (v.valorCentavos !== null && !inteiro(v.valorCentavos)) return null
  if (typeof v.vencida !== 'boolean') return null
  return {
    ref: v.ref,
    vencimento: v.vencimento,
    valorCentavos: v.valorCentavos,
    vencida: v.vencida,
  }
}

/** Lista em que TODO item precisa passar; um item ruim invalida a resposta inteira. */
function todos<T>(v: unknown, converte: (item: unknown) => T | null): T[] | null {
  if (!Array.isArray(v)) return null
  const itens = v.map(converte)
  return itens.every((i): i is T => i !== null) ? itens : null
}

/** Barra invertida ou caractere de controle: o parser de URL os reinterpreta, então nem chegam a ele. */
function temBarraOuControle(v: string): boolean {
  return [...v].some((c) => {
    const codigo = c.charCodeAt(0)
    return c === '\\' || codigo <= 0x1f || codigo === 0x7f
  })
}

/** Segunda conferência do host: o app já validou, o site não confia só nisso. */
function urlDoBoleto(v: unknown): string | null {
  if (typeof v !== 'string' || temBarraOuControle(v)) return null
  try {
    const u = new URL(v)
    const ok =
      u.protocol === 'https:' &&
      u.hostname === HOST_DO_BOLETO &&
      u.port === '' &&
      u.username === '' &&
      u.password === '' &&
      u.hash === ''
    // A forma serializada pelo parser, a mesma que foi conferida acima.
    return ok ? u.href : null
  } catch {
    return null
  }
}

function parserSolicitar(status: number, c: Registro): RespostaDe<'solicitar'> | null {
  if (status === 202 && refValida(c.desafio) && inteiro(c.reenvioEmSegundos)) {
    return { tipo: 'ok', desafio: c.desafio, reenvioEmSegundos: c.reenvioEmSegundos }
  }
  if (status === 400 && c.erro === 'entrada_invalida') return { tipo: 'entrada_invalida' }
  return limite(status, c)
}

function parserReenviar(status: number, c: Registro): RespostaDe<'reenviar'> | null {
  if (status === 202 && inteiro(c.reenvioEmSegundos)) {
    return { tipo: 'ok', reenvioEmSegundos: c.reenvioEmSegundos }
  }
  if (status === 410 && c.erro === 'desafio_expirado') return { tipo: 'expirado' }
  return limite(status, c)
}

function parserConfirmar(status: number, c: Registro): RespostaDe<'confirmar'> | null {
  if (status === 200) {
    const unidades = todos(c.unidades, unidadePublica)
    if (!refValida(c.sessao) || !inteiro(c.expiraEmSegundos) || !unidades) return null
    return { tipo: 'ok', sessao: c.sessao, expiraEmSegundos: c.expiraEmSegundos, unidades }
  }
  if (status === 401 && c.erro === 'incorreto' && inteiro(c.tentativasRestantes)) {
    return { tipo: 'incorreto', tentativasRestantes: c.tentativasRestantes }
  }
  if (status === 401 && c.erro === 'expirado') return { tipo: 'expirado' }
  if (status === 401 && c.erro === 'bloqueado') return { tipo: 'bloqueado' }
  return limite(status, c)
}

const SITUACOES: readonly SituacaoCobrancas[] = ['aberto', 'sem_aberto', 'indeterminado']

function parserCobrancas(status: number, c: Registro): RespostaDe<'cobrancas'> | null {
  if (status === 200) {
    const situacao = SITUACOES.find((s) => s === c.situacao)
    const cobrancas = todos(c.cobrancas, cobrancaPublica)
    if (!situacao || typeof c.haRestritas !== 'boolean' || !cobrancas) return null
    return { tipo: 'ok', situacao, haRestritas: c.haRestritas, cobrancas }
  }
  return erroDeSessao(status, c)
}

function parserLink(status: number, c: Registro): RespostaDe<'link'> | null {
  if (status === 200) {
    const url = urlDoBoleto(c.url)
    return url ? { tipo: 'ok', url } : null
  }
  if (status === 409 && c.erro === 'cobranca_indisponivel') return { tipo: 'cobranca_indisponivel' }
  return erroDeSessao(status, c)
}

function erroDeSessao(status: number, c: Registro) {
  if (status === 401 && c.erro === 'sessao_invalida') return { tipo: 'sessao_invalida' } as const
  if (status === 404 && c.erro === 'referencia_invalida')
    return { tipo: 'referencia_invalida' } as const
  return null
}

const PARSERS: { [R in RotaSegundaVia]: Parser<R> } = {
  solicitar: parserSolicitar,
  reenviar: parserReenviar,
  confirmar: parserConfirmar,
  cobrancas: parserCobrancas,
  link: parserLink,
  // 204 sem corpo é tratado antes de chegar aqui.
  encerrar: () => null,
}

function configuracao(): { base: string; segredo: string } | null {
  const base = process.env.SEMOGAPP_API_URL
  const segredo = process.env.SEMOGAPP_SEGUNDA_VIA_SEGREDO
  if (!base || !segredo || Buffer.byteLength(segredo) < TAMANHO_MINIMO_DO_SEGREDO) return null
  try {
    const u = new URL(base)
    const local = u.hostname === 'localhost' || u.hostname === '127.0.0.1'
    // O segredo assina cada pedido: fora do ambiente local, só por TLS.
    if (u.protocol !== 'https:' && !(u.protocol === 'http:' && local)) return null
    if (u.search || u.hash || u.username || u.password) return null
    // Preserva um prefixo de caminho (ex.: `/api`), sem a barra final.
    return { base: `${u.origin}${u.pathname.replace(/\/+$/, '')}`, segredo }
  } catch {
    return null
  }
}

/** Rejeita quando o prazo estoura, mesmo que o `fetch` (ou um falso) ignore o sinal. */
function comPrazo<T>(executa: (sinal: AbortSignal) => Promise<T>): Promise<T> {
  const controle = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined
  const estouro = new Promise<never>((_, rejeita) => {
    timer = setTimeout(() => {
      controle.abort()
      rejeita(new Error('timeout'))
    }, TIMEOUT_MS)
  })
  return Promise.race([executa(controle.signal), estouro]).finally(() => clearTimeout(timer))
}

async function enviar(
  fetchFn: typeof fetch,
  url: string,
  init: RequestInit,
): Promise<{ status: number; texto: string }> {
  return comPrazo(async (signal) => {
    const r = await fetchFn(url, { ...init, signal })
    return { status: r.status, texto: await r.text() }
  })
}

function interpreta<R extends RotaSegundaVia>(
  rota: R,
  status: number,
  texto: string,
): RespostaDe<R> {
  if (rota === 'encerrar') return (status === 204 ? { tipo: 'ok' } : INDISPONIVEL) as RespostaDe<R> // as: 'encerrar' só tem 'ok' | 'indisponivel', ambos em RespostaDe<R> quando R = 'encerrar'
  let json: unknown
  try {
    json = JSON.parse(texto)
  } catch {
    return INDISPONIVEL as RespostaDe<R> // as: 'indisponivel' pertence a toda união de resposta
  }
  if (status === 401 && ehRegistro(json) && json.erro === 'assinatura') {
    console.error('Falha de assinatura com o semogapp')
    return INDISPONIVEL as RespostaDe<R> // as: idem
  }
  const parser: Parser<R> = PARSERS[rota]
  return (ehRegistro(json) ? parser(status, json) : null) ?? (INDISPONIVEL as RespostaDe<R>) // as: idem
}

export async function chamarSegundaVia<R extends RotaSegundaVia>(
  rota: R,
  corpo: CorpoDe<R>,
  deps: Dependencias = {},
): Promise<RespostaDe<R>> {
  const config = configuracao()
  if (!config) return INDISPONIVEL as RespostaDe<R> // as: 'indisponivel' pertence a toda união de resposta
  const agora = deps.agora ?? (() => Math.floor(Date.now() / 1000))
  const texto = JSON.stringify({ ...corpo, nonce: crypto.randomUUID() })
  try {
    const { status, texto: resposta } = await enviar(
      deps.fetch ?? fetch,
      `${config.base}${PREFIXO}/${rota}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...assinarPedido(config.segredo, texto, agora()),
        },
        body: texto,
        cache: 'no-store',
        // O corpo assinado nunca deve ser reenviado a um destino que o app não escolheu.
        redirect: 'error',
      },
    )
    return interpreta(rota, status, resposta)
  } catch {
    // Timeout, DNS, conexão: sem detalhe no log (a mensagem do erro pode trazer a URL).
    return INDISPONIVEL as RespostaDe<R> // as: idem
  }
}
