import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { FormularioDesfecho, type LeadEmAvaliacao } from '@/components/desfecho/FormularioDesfecho'
import { query } from '@/lib/db'
import { ehDesfecho, ehMotivo } from '@/lib/desfecho'
import { tokenConfere } from '@/lib/desfechoToken'

/**
 * Página de confirmação do desfecho de um lead — o destino dos quatro botões do
 * e-mail de notificação.
 *
 * **Este GET só lê.** Nada é gravado aqui, e isso é requisito: filtro de
 * segurança corporativo e proxy de e-mail abrem todos os links de uma mensagem
 * para inspecioná-los, então um link que gravasse estado marcaria leads
 * sozinho, sem ninguém ter clicado. A gravação é o POST do formulário
 * (`registrarDesfecho`), que revalida o token por conta própria.
 *
 * O `s` da query string é só pré-seleção — o token assina o **lead**, não o
 * status, para que o responsável possa corrigir a escolha na própria página.
 *
 * Token que não confere e lead inexistente caem no mesmo `notFound()`: 404, sem
 * dizer qual dos dois foi (ver `(interno)/not-found.tsx`).
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Desfecho do lead — Semog',
  // Explícito, e não herdado: o site roda com `SITE_ALLOW_INDEX=true` e não tem
  // noindex global — o `X-Robots-Tag` do `next.config.ts` some justamente
  // quando a indexação é liberada. Uma página com nome, e-mail e telefone de
  // lead não pode depender de um header que já foi desligado.
  robots: { index: false, follow: false },
}

/** Campos do resumo, na ordem em que aparecem. Chaves de `cms.leads.data`. */
const RESUMO_CAMPOS: { chave: string; rotulo: string }[] = [
  { chave: 'nome', rotulo: 'Nome' },
  { chave: 'nomeCondominio', rotulo: 'Condomínio' },
  { chave: 'cidade', rotulo: 'Cidade' },
  { chave: 'unidades', rotulo: 'Unidades' },
  { chave: 'email', rotulo: 'E-mail' },
  { chave: 'telefone', rotulo: 'WhatsApp' },
]

type LinhaDeLead = {
  id: string
  created_at: Date
  form: string
  data: Record<string, string>
  desfecho: string | null
  desfecho_motivo: string | null
  desfecho_em: Date | null
}

/**
 * Data e hora no fuso das unidades (todas em UTC-3). Formatar no servidor, e
 * mandar o texto pronto para o cliente, evita que o horário mude conforme a
 * máquina de quem abriu o link.
 */
const FORMATO_DATA = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Recife',
})

export default async function DesfechoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  const busca = await searchParams

  const token = typeof busca.t === 'string' ? busca.t : undefined
  if (!token || !tokenConfere(id, token)) notFound()

  const { rows } = await query<LinhaDeLead>(
    `select id, created_at, form, data, desfecho, desfecho_motivo, desfecho_em
       from cms.leads
      where id = $1`,
    [id],
  )
  const linha = rows[0]
  if (!linha) notFound()

  const statusInicial = ehDesfecho(busca.s) ? busca.s : null
  const lead: LeadEmAvaliacao = {
    id: linha.id,
    token,
    desfecho: ehDesfecho(linha.desfecho) ? linha.desfecho : null,
    motivo: ehMotivo(linha.desfecho_motivo) ? linha.desfecho_motivo : null,
    registradoEm: linha.desfecho_em ? FORMATO_DATA.format(linha.desfecho_em) : null,
  }

  const resumo = RESUMO_CAMPOS.map(({ chave, rotulo }) => ({
    rotulo,
    valor: linha.data[chave]?.trim() ?? '',
  })).filter((campo) => campo.valor !== '')

  return (
    <main className="mx-auto w-full max-w-[36rem] px-4 py-10 sm:py-14">
      <h1 className="font-display text-[clamp(1.6rem,4.5vw,2.2rem)] leading-tight text-fg">
        Como terminou este lead?
      </h1>
      <p className="mt-2 text-[0.95rem] text-fg-2">
        Sua resposta é o que diz quanto vale uma proposta do site. Leva dez segundos.
      </p>

      <section className="mt-6 rounded-card border border-line bg-bg-raise p-5">
        <h2 className="text-[0.85rem] font-semibold text-fg-3">
          Lead #{linha.id} · recebido em {FORMATO_DATA.format(linha.created_at)}
        </h2>
        <dl className="mt-3 grid gap-2">
          {resumo.map((campo) => (
            <div key={campo.rotulo} className="flex flex-col sm:flex-row sm:gap-3">
              <dt className="shrink-0 text-[0.85rem] font-semibold text-fg-3 sm:w-28">
                {campo.rotulo}
              </dt>
              <dd className="break-words text-[0.95rem] text-fg">{campo.valor}</dd>
            </div>
          ))}
        </dl>
        {linha.data.mensagem?.trim() && (
          <p className="mt-4 border-t border-line pt-3 text-[0.9rem] leading-relaxed text-fg-2">
            {linha.data.mensagem}
          </p>
        )}
      </section>

      <section className="mt-8">
        <FormularioDesfecho lead={lead} statusInicial={statusInicial} />
      </section>
    </main>
  )
}
