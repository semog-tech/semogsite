import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const envio = vi.hoisted(() => ({ submitForm: vi.fn() }))
vi.mock('@/app/(frontend)/_actions/submit-form', () => envio)
vi.mock('@/app/(frontend)/_actions/segunda-via', () => ({
  solicitarCodigo: vi.fn(),
  reenviarCodigo: vi.fn(),
  confirmarCodigo: vi.fn(),
  listarCobrancas: vi.fn(),
  abrirBoleto: vi.fn(),
  encerrarConsulta: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/providers/ConsentProvider', () => ({
  useConsent: () => ({ consent: { analytics: true }, decided: true }),
}))
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))

// O jsdom tem <dialog> mas não showModal/close (o mesmo dublê do site-v2-sou-cliente).
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
})
vi.mock('@/components/forms/Turnstile', () => ({
  Turnstile: ({ onToken }: { onToken: (token: string) => void }) => (
    <button type="button" onClick={() => onToken('token-de-teste')}>
      turnstile
    </button>
  ),
}))

import Pagina, { metadata } from '@/app/(site)/(landing)/previa-v2/contato/page'
import { contatoSchema } from '@/lib/form-schemas'
import { CONTATO_TO, destinatariosDoContato } from '@/lib/leads/destinatarios'
import { conteudo } from '@/site/conteudo/conteudo'
import { metadadosInstitucionais } from '@/site/seo/institucional'
import { conferirPagina, type SecaoEsperada } from './helpers/paginas'

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('VERCEL_ENV', 'preview')
})
afterEach(() => {
  vi.unstubAllEnvs()
})

const SECOES: SecaoEsperada[] = [
  {
    id: 'contato-abertura',
    arquivo: 'contato/01-abertura',
    // A 2ª via deixou de ser atalho pendente (sem seta) e abre o painel: ganha a seta dos outros três.
    diferencas: { semClasses: ['ct-atalho--pendente', 'a-confirmar'], contagemLivre: ['seta'] },
  },
  { id: 'contato-unidades', arquivo: 'contato/02-unidades' },
  {
    id: 'contato-mensagem',
    arquivo: 'contato/03-mensagem',
    diferencas: { ignorar: ['form', '.fp-sem-js', '.fp-sucesso'] },
  },
]

function preencher(container: HTMLElement) {
  const campo = (nome: string) => {
    const el = container.querySelector(`#contato-mensagem [name="${nome}"]`)
    if (
      !(
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement
      )
    ) {
      throw new Error(`campo ${nome} ausente`)
    }
    return el
  }
  fireEvent.change(campo('nome'), { target: { value: 'Maria' } })
  fireEvent.change(campo('email'), { target: { value: 'maria@exemplo.com.br' } })
  fireEvent.change(campo('assunto'), { target: { value: 'imprensa' } })
  fireEvent.change(campo('mensagem'), { target: { value: 'Gostaria de uma entrevista.' } })
  fireEvent.click(screen.getByRole('button', { name: 'turnstile' }))
}

describe('Contato (pacote landing) na prévia', () => {
  it('em produção responde 404, nunca é indexada e o <head> é o de hoje', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false })
    expect(metadata.title).toBe(metadadosInstitucionais('contato').title)
    vi.stubEnv('VERCEL_ENV', 'production')
    expect(() => Pagina()).toThrow('NEXT_HTTP_ERROR_FALLBACK;404')
  })

  it('reproduz as seções do protótipo; nenhum e-mail na página; o atalho abre direto a 2ª via', () => {
    const container = conferirPagina(<Pagina />, { dataPagina: 'contato', secoes: SECOES })
    expect(container.textContent).not.toMatch(/@semog\.com\.br/)
    const atalho = container.querySelector('#contato-abertura .ct-atalho[aria-haspopup="dialog"]')
    expect(atalho?.textContent).toContain(conteudo.contatoPagina.atalhos.segundaVia.titulo)
    expect(container.querySelectorAll('#contato-unidades .cn-unidade')).toHaveLength(4)
  })

  it('com a 2ª via ligada, o atalho do Contato pula o menu e abre a consulta pelo CPF', async () => {
    // O esqueleto lê SEGUNDA_VIA_ATIVA no servidor e passa o booleano ao painel (4.15).
    vi.stubEnv('SEGUNDA_VIA_ATIVA', 'true')
    const container = conferirPagina(<Pagina />, { dataPagina: 'contato', secoes: SECOES })
    const atalho = container.querySelector('#contato-abertura .ct-atalho[aria-haspopup="dialog"]')
    if (!(atalho instanceof HTMLElement)) throw new Error('atalho do Contato ausente')
    fireEvent.click(atalho)
    expect(await screen.findByText(/Informe o CPF cadastrado/)).toBeTruthy()
  })

  it('os cinco assuntos do protótipo, todos aceitos pelo servidor; nenhum é proposta', () => {
    const container = conferirPagina(<Pagina />, { dataPagina: 'contato', secoes: SECOES })
    const opcoes = Array.from(
      container.querySelectorAll<HTMLOptionElement>(
        '#contato-mensagem select[name="assunto"] option',
      ),
    )
      .map((o) => o.value)
      .filter(Boolean)
    expect(opcoes).toEqual(conteudo.contatoPagina.mensagem.assuntos.map((a) => a.valor))
    expect(opcoes).not.toContain('proposta-comercial')
    for (const assunto of opcoes) {
      const lido = contatoSchema.safeParse({
        nome: 'a',
        email: 'a@b.com.br',
        assunto,
        mensagem: 'x',
      })
      expect(lido.success, assunto).toBe(true)
    }
    expect(
      contatoSchema.safeParse({ nome: 'a', email: 'a@b.com.br', assunto: 'xyz', mensagem: 'x' })
        .success,
    ).toBe(false)
  })

  it('todos os assuntos vão para ola@semog.com.br (onde o Chatwoot distribui)', () => {
    expect(CONTATO_TO).toBe('ola@semog.com.br')
    expect(destinatariosDoContato()).toEqual(['ola@semog.com.br'])
    const acao = readFileSync(
      path.join(process.cwd(), 'src', 'app', '(frontend)', '_actions', 'submit-form.ts'),
      'utf8',
    )
    expect(acao).toContain('destinatariosDoContato()')
    expect(acao).not.toContain('process.env.CONTACT_TO')
  })

  it('envia ao submitForm("contato") e mostra o recebido', async () => {
    envio.submitForm.mockResolvedValue({ ok: true, message: 'Recebemos sua mensagem!' })
    const container = conferirPagina(<Pagina />, { dataPagina: 'contato', secoes: SECOES })
    preencher(container)
    fireEvent.submit(container.querySelector('#contato-mensagem form') as HTMLFormElement)
    await waitFor(() => expect(screen.getByText('Recebemos sua mensagem.')).toBeTruthy())
    expect(envio.submitForm).toHaveBeenCalledWith(
      'contato',
      {
        nome: 'Maria',
        email: 'maria@exemplo.com.br',
        assunto: 'imprensa',
        mensagem: 'Gostaria de uma entrevista.',
      },
      'token-de-teste',
    )
  })

  it('erro de campo do servidor volta para o campo; falha de envio mostra os telefones e vai ao Sentry', async () => {
    const Sentry = await import('@sentry/nextjs')
    envio.submitForm.mockResolvedValueOnce({
      ok: false,
      errors: { email: 'Informe um e-mail válido.' },
    })
    const container = conferirPagina(<Pagina />, { dataPagina: 'contato', secoes: SECOES })
    preencher(container)
    fireEvent.submit(container.querySelector('#contato-mensagem form') as HTMLFormElement)
    await waitFor(() => expect(screen.getByText('Informe um e-mail válido.')).toBeTruthy())

    envio.submitForm.mockRejectedValueOnce(new Error('action antiga'))
    fireEvent.click(screen.getByRole('button', { name: 'turnstile' }))
    fireEvent.submit(container.querySelector('#contato-mensagem form') as HTMLFormElement)
    await waitFor(() => expect(screen.getByText('Não conseguimos enviar agora.')).toBeTruthy())
    expect(container.querySelector('#contato-mensagem .fp-telefones')?.textContent).toContain(
      '(81) 3316-0265',
    )
    expect(Sentry.captureException).toHaveBeenCalled()
  })

  it('sem a verificação, não envia e pede para confirmar', async () => {
    const container = conferirPagina(<Pagina />, { dataPagina: 'contato', secoes: SECOES })
    fireEvent.submit(container.querySelector('#contato-mensagem form') as HTMLFormElement)
    await waitFor(() =>
      expect(screen.getByText('Confirme a verificação de segurança e envie de novo.')).toBeTruthy(),
    )
    expect(envio.submitForm).not.toHaveBeenCalled()
  })
})
