import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'

/**
 * semogapp FALSO para o e2e e a conferência no navegador da 2ª via: responde o
 * contrato da spec ("Contrato da API") com dados de EXEMPLO, sem tocar o app
 * real, o ERP nem o SendGrid. Confere a assinatura HMAC como o app faria.
 *
 * O cenário é escolhido pelo CPF (todos sintéticos, `000.000.00X-XX`):
 */
export const CPFS_DE_EXEMPLO = {
  /** Uma unidade, três boletos (a vencer, vencido, sem valor) e um que some no clique. */
  umaUnidade: '00000000191',
  /** Duas unidades: a primeira com boletos, a segunda sem nenhum. */
  duasUnidades: '00000000272',
  /** Uma unidade sem boleto em aberto e sem restrição. */
  semBoletos: '00000000353',
  /** Boletos liberados + cobrança restrita (que não aparece na lista). */
  comRestrita: '00000000434',
  /** ERP sem resposta: situação indeterminada. */
  indeterminado: '00000000515',
  /** App fora do ar: `/solicitar` responde 503. */
  appFora: '00000000604',
  /** A sessão "expira" no app: `/cobrancas` responde `sessao_invalida`. */
  sessaoExpira: '00000000787',
} as const

/** Códigos do e-mail de exemplo: o certo, e o que o app trata como expirado. */
export const CODIGO_CERTO = '123456'
export const CODIGO_EXPIRADO = '000000'

export const SEGREDO_DE_TESTE = 'segredo-de-teste-da-segunda-via-e2e-0123456789'

type Cobranca = { ref: string; vencimento: string; valorCentavos: number | null; vencida: boolean }
type Unidade = { ref: string; condominio: string; unidade: string }
type Situacao = 'aberto' | 'sem_aberto' | 'indeterminado'
type Lista = { situacao: Situacao; haRestritas: boolean; cobrancas: Cobranca[] }

const ref = (letra: string) => letra.repeat(24)

const A_VENCER: Cobranca = {
  ref: ref('a'),
  vencimento: '2026-10-10',
  valorCentavos: 45000,
  vencida: false,
}
const VENCIDA: Cobranca = {
  ref: ref('b'),
  vencimento: '2026-09-10',
  valorCentavos: 123456,
  vencida: true,
}
const SEM_VALOR: Cobranca = {
  ref: ref('c'),
  vencimento: '2026-11-10',
  valorCentavos: null,
  vencida: false,
}
/** Paga "entre a lista e o clique": `/link` responde 409 e ela sai da lista. */
const SOME: Cobranca = {
  ref: ref('d'),
  vencimento: '2026-10-20',
  valorCentavos: 9990,
  vencida: false,
}

const U_A: Unidade = {
  ref: ref('U'),
  condominio: 'Condomínio Exemplo A (dado de teste)',
  unidade: 'Apto 101',
}
const U_B: Unidade = {
  ref: ref('V'),
  condominio: 'Condomínio Exemplo B (dado de teste)',
  unidade: 'Casa 2',
}

type Cenario = { unidades: Unidade[]; listas: Record<string, Lista>; sessaoInvalida?: boolean }

const LISTA_PADRAO: Lista = {
  situacao: 'aberto',
  haRestritas: false,
  cobrancas: [A_VENCER, VENCIDA, SEM_VALOR, SOME],
}
const SEM_ABERTO: Lista = { situacao: 'sem_aberto', haRestritas: false, cobrancas: [] }

const CENARIOS: Record<string, Cenario> = {
  [CPFS_DE_EXEMPLO.umaUnidade]: { unidades: [U_A], listas: { [U_A.ref]: LISTA_PADRAO } },
  [CPFS_DE_EXEMPLO.duasUnidades]: {
    unidades: [U_A, U_B],
    listas: { [U_A.ref]: LISTA_PADRAO, [U_B.ref]: SEM_ABERTO },
  },
  [CPFS_DE_EXEMPLO.semBoletos]: { unidades: [U_A], listas: { [U_A.ref]: SEM_ABERTO } },
  [CPFS_DE_EXEMPLO.comRestrita]: {
    unidades: [U_A],
    listas: { [U_A.ref]: { situacao: 'aberto', haRestritas: true, cobrancas: [A_VENCER] } },
  },
  [CPFS_DE_EXEMPLO.indeterminado]: {
    unidades: [U_A],
    listas: { [U_A.ref]: { situacao: 'indeterminado', haRestritas: false, cobrancas: [] } },
  },
  [CPFS_DE_EXEMPLO.sessaoExpira]: { unidades: [U_A], listas: {}, sessaoInvalida: true },
}

type Desafio = { cpf: string; tentativas: number }
type Sessao = { cenario: Cenario; sumidas: Set<string> }

function token(): string {
  return randomBytes(24).toString('base64url')
}

function assinaturaConfere(segredo: string, req: IncomingMessage, corpo: string): boolean {
  const ts = String(req.headers['x-semog-timestamp'] ?? '')
  const recebida = String(req.headers['x-semog-assinatura'] ?? '')
  const esperada = `sha256=${createHmac('sha256', segredo).update(`${ts}.${corpo}`).digest('hex')}`
  const a = Buffer.from(recebida)
  const b = Buffer.from(esperada)
  return a.length === b.length && timingSafeEqual(a, b)
}

function responder(res: ServerResponse, status: number, corpo?: unknown) {
  res.writeHead(status, corpo === undefined ? {} : { 'Content-Type': 'application/json' })
  res.end(corpo === undefined ? undefined : JSON.stringify(corpo))
}

function lerCorpo(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let texto = ''
    req.setEncoding('utf8')
    req.on('data', (parte: string) => {
      texto += parte
    })
    req.on('end', () => resolve(texto))
    req.on('error', reject)
  })
}

type Corpo = Record<string, unknown>

function rotas(desafios: Map<string, Desafio>, sessoes: Map<string, Sessao>) {
  const sessaoDe = (c: Corpo) => sessoes.get(String(c.sessao))
  return {
    solicitar: (c: Corpo): [number, unknown] => {
      if (c.cpf === CPFS_DE_EXEMPLO.appFora) return [503, { erro: 'indisponivel' }]
      const desafio = token()
      desafios.set(desafio, { cpf: String(c.cpf), tentativas: 3 })
      return [202, { desafio, reenvioEmSegundos: 60 }]
    },
    reenviar: (c: Corpo): [number, unknown] => {
      const d = desafios.get(String(c.desafio))
      if (!d) return [410, { erro: 'desafio_expirado' }]
      d.tentativas = 3
      return [202, { reenvioEmSegundos: 60 }]
    },
    confirmar: (c: Corpo): [number, unknown] => {
      const d = desafios.get(String(c.desafio))
      if (!d) return [401, { erro: 'expirado' }]
      if (c.codigo === CODIGO_EXPIRADO) return [401, { erro: 'expirado' }]
      if (d.tentativas === 0) return [401, { erro: 'bloqueado' }]
      const cenario = CENARIOS[d.cpf]
      // CPF sem cadastro responde exatamente como código incorreto.
      if (c.codigo !== CODIGO_CERTO || !cenario) {
        d.tentativas -= 1
        return [401, { erro: 'incorreto', tentativasRestantes: d.tentativas }]
      }
      desafios.delete(String(c.desafio))
      const sessao = token()
      sessoes.set(sessao, { cenario, sumidas: new Set() })
      return [200, { sessao, expiraEmSegundos: 900, unidades: cenario.unidades }]
    },
    cobrancas: (c: Corpo): [number, unknown] => {
      const s = sessaoDe(c)
      if (!s || s.cenario.sessaoInvalida) return [401, { erro: 'sessao_invalida' }]
      const lista = s.cenario.listas[String(c.unidade)]
      if (!lista) return [404, { erro: 'referencia_invalida' }]
      const cobrancas = lista.cobrancas.filter((x) => !s.sumidas.has(x.ref))
      return [200, { ...lista, cobrancas }]
    },
    link: (c: Corpo): [number, unknown] => {
      const s = sessaoDe(c)
      if (!s || s.cenario.sessaoInvalida) return [401, { erro: 'sessao_invalida' }]
      const cobranca = String(c.cobranca)
      if (cobranca === SOME.ref) {
        s.sumidas.add(cobranca)
        return [409, { erro: 'cobranca_indisponivel' }]
      }
      return [
        200,
        { url: `https://semog.superlogica.net/exemplo-segunda-via/boleto?ref=${cobranca}` },
      ]
    },
    encerrar: (c: Corpo): [number, unknown] => {
      sessoes.delete(String(c.sessao))
      return [204, undefined]
    },
  }
}

/** Rota e `ipCliente` de cada pedido assinado, na ordem. Nada mais do corpo. */
export type PedidoRecebido = { rota: string; ip: string }

/**
 * Leitura dos pedidos pelo teste. O falso sobe uma vez só (no `globalSetup`,
 * outro processo), então o teste pergunta por HTTP, filtrando pelo IP dele.
 */
export const ROTA_DOS_PEDIDOS = '/_teste/pedidos'

export type SemogappFalso = {
  pedidos: PedidoRecebido[]
  fechar: () => Promise<void>
}

export function iniciarSemogappFalso(
  porta: number,
  segredo = SEGREDO_DE_TESTE,
): Promise<SemogappFalso> {
  const pedidos: PedidoRecebido[] = []
  const tratar = rotas(new Map(), new Map())
  const servidor = createServer((req, res) => {
    if (req.method === 'GET' && req.url === ROTA_DOS_PEDIDOS) return responder(res, 200, pedidos)
    const rota = (req.url ?? '').replace('/publico/segunda-via/', '')
    lerCorpo(req)
      .then((texto) => {
        if (req.method !== 'POST' || !Object.hasOwn(tratar, rota)) return responder(res, 404)
        if (!assinaturaConfere(segredo, req, texto))
          return responder(res, 401, { erro: 'assinatura' })
        const corpo = JSON.parse(texto) as Corpo // as: JSON assinado pelo site, conferido acima
        pedidos.push({ rota, ip: String(corpo.ipCliente ?? '') })
        const [status, resposta] = tratar[rota as keyof typeof tratar](corpo) // as: rota conferida por `hasOwn`
        responder(res, status, resposta)
      })
      .catch((erro: unknown) => {
        console.error('[semogapp falso] pedido falhou:', erro)
        responder(res, 500, { erro: 'falso' })
      })
  })
  return new Promise((resolve, reject) => {
    servidor.once('error', reject)
    servidor.listen(porta, '127.0.0.1', () =>
      resolve({
        pedidos,
        fechar: () => new Promise((fim) => servidor.close(() => fim())),
      }),
    )
  })
}
