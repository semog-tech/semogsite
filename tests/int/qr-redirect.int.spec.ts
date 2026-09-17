import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * **A rota do QR impresso não pode depender do banco para funcionar.** O papel
 * já foi distribuído quando o Postgres cair, e quem escaneou está de pé no
 * evento com sinal ruim: o redirecionamento acontece primeiro, a contagem
 * depois. Os testes abaixo defendem as quatro decisões que, se alguém
 * refatorar sem conhecer a história, se perdem em silêncio e sem erro:
 *
 * - a gravação sair do caminho da resposta (`after`, não `await`);
 * - o código ser 302 e não 301 — permanente entra no cache do leitor de QR e
 *   mata a contagem E a troca de destino, que é a razão da rota existir;
 * - slug desconhecido levar à home, nunca a um 404 na cara de quem escaneou;
 * - banco fora não virar erro para o visitante.
 */

const queryMock = vi.fn()

vi.mock('server-only', () => ({}))

vi.mock('@/lib/db', () => ({
  query: (...args: unknown[]) => queryMock(...args),
}))

/**
 * `after` guarda o trabalho para DEPOIS da resposta. O mock apenas enfileira,
 * sem executar — é isso que permite perguntar "a resposta saiu antes de o
 * banco ser tocado?". Trocar `after(...)` por um `await` direto na rota faz o
 * primeiro teste falhar, que é exatamente o ponto.
 */
const pendentes: Array<() => unknown> = []
vi.mock('next/server', async (importOriginal) => {
  const real = await importOriginal<typeof import('next/server')>()
  return { ...real, after: (tarefa: () => unknown) => void pendentes.push(tarefa) }
})

const { GET } = await import('@/app/qr/[slug]/route')

const UA_IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
const UA_DESKTOP =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'

const DESTINO_FOLDER = '/?utm_source=qr&utm_medium=folder&utm_campaign=experience-26'

/**
 * Escaneia a URL como o leitor de QR faria: o slug é EXTRAÍDO do endereço, não
 * redigitado ao lado dele. Slug digitado à mão no teste herdaria a suposição
 * do código sobre o que o Next entrega, e os dois errariam juntos.
 */
function escanear(url: string, userAgent = UA_IPHONE) {
  const slug = decodeURIComponent(new URL(url).pathname.split('/')[2] ?? '')
  return GET(new Request(url, { headers: { 'user-agent': userAgent } }), {
    params: Promise.resolve({ slug }),
  })
}

/** Roda o que a rota deixou para depois da resposta, como o runtime faria. */
async function rodarTrabalhoAdiado(): Promise<void> {
  for (const tarefa of pendentes.splice(0)) await tarefa()
}

/** Os argumentos do insert que a rota mandou ao banco. */
function linhaGravada(): { sql: string; valores: unknown[] } {
  const [sql, valores] = queryMock.mock.calls.at(-1) as [string, unknown[]]
  return { sql, valores }
}

beforeEach(() => {
  queryMock.mockReset()
  queryMock.mockResolvedValue({ rows: [], rowCount: 1 })
  pendentes.length = 0
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('/qr/[slug] — redirecionamento do QR impresso', () => {
  it('redireciona para a home com as UTMs da peça, em 302 temporário', async () => {
    const res = await escanear('https://www.semog.com.br/qr/folder')

    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe(DESTINO_FOLDER)
    // Permanente é o modo de falha silencioso desta rota: funcionaria na
    // primeira leitura e sumiria do servidor nas seguintes.
    expect(res.status).not.toBe(301)
    expect(res.status).not.toBe(308)
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(res.headers.get('x-robots-tag')).toContain('noindex')
  })

  it('responde ANTES de tocar no banco — a contagem fica para depois', async () => {
    await escanear('https://www.semog.com.br/qr/folder')

    // A resposta já foi montada e devolvida acima; se a gravação estivesse no
    // caminho dela, o insert já teria acontecido.
    expect(queryMock).not.toHaveBeenCalled()
    expect(pendentes).toHaveLength(1)
  })

  it('grava o acesso com peça, destino e dispositivo depois da resposta', async () => {
    const res = await escanear('https://www.semog.com.br/qr/folder')
    await rodarTrabalhoAdiado()

    expect(queryMock).toHaveBeenCalledTimes(1)
    const { sql, valores } = linhaGravada()
    expect(sql).toContain('insert into cms.qr_scans')
    // O destino gravado é o mesmo que foi mandado ao visitante — a coluna
    // existe para responder "para onde este acesso foi" quando o mapa mudar.
    expect(valores).toEqual(['folder', true, res.headers.get('location'), 'mobile'])
  })

  it('distingue desktop de celular sem guardar o user-agent', async () => {
    await escanear('https://www.semog.com.br/qr/folder', UA_DESKTOP)
    await rodarTrabalhoAdiado()

    const { valores } = linhaGravada()
    expect(valores.at(-1)).toBe('desktop')
    expect(valores.join(' ')).not.toContain('Mozilla')
  })

  it('banco fora não quebra o redirecionamento nem vaza erro', async () => {
    queryMock.mockRejectedValue(new Error('ECONNREFUSED 143.244.162.48:7432'))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const res = await escanear('https://www.semog.com.br/qr/folder')

    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe(DESTINO_FOLDER)
    // O trabalho adiado engole a falha: quem o executa é o runtime, que não
    // tem como tratá-la.
    await expect(rodarTrabalhoAdiado()).resolves.toBeUndefined()
    expect(queryMock).toHaveBeenCalledTimes(1)
  })

  it('slug desconhecido leva à home, sem 404 e sem UTM inventada', async () => {
    const res = await escanear('https://www.semog.com.br/qr/qualquer-coisa')
    await rodarTrabalhoAdiado()

    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/')
    expect(res.headers.get('location')).not.toContain('utm_')

    const { valores } = linhaGravada()
    // Fica registrado como desconhecido: é assim que erro de impressão aparece.
    expect(valores.slice(0, 3)).toEqual(['qualquer-coisa', false, '/'])
  })

  it('encontra a peça mesmo com a URL impressa em maiúsculas', async () => {
    // QR gerado em caixa alta usa o modo alfanumérico e fica com menos
    // módulos; há gráfica que faz isso sem avisar.
    const res = await escanear('https://www.semog.com.br/qr/FOLDER')
    await rodarTrabalhoAdiado()

    expect(res.headers.get('location')).toBe(DESTINO_FOLDER)
    expect(linhaGravada().valores[0]).toBe('folder')
  })

  it('slug com lixo de URL não vira lixo no banco', async () => {
    await escanear('https://www.semog.com.br/qr/folder%3Cscript%3E%20drop')
    await rodarTrabalhoAdiado()

    const { valores } = linhaGravada()
    expect(valores[0]).toBe('folderscriptdrop')
    expect(valores[1]).toBe(false)
  })
})
