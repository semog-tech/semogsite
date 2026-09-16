'use client'

import { useActionState, useEffect, useId, useRef, useState } from 'react'
import { registrarDesfecho } from '@/app/(interno)/_actions/registrar-desfecho'
import {
  DESFECHO_COM_MOTIVO,
  DESFECHO_DESCRICOES,
  DESFECHO_ROTULOS,
  DESFECHOS,
  type Desfecho,
  LIMITE_OBSERVACAO,
  MOTIVO_ROTULOS,
  MOTIVOS,
  type MotivoNaoLead,
} from '@/lib/desfecho'

/**
 * Estado do lead que a página já leu do banco. `registradoEm` vem **formatado**
 * do servidor de propósito: formatar a data no cliente usaria o fuso e o locale
 * da máquina de quem abriu, e o servidor é o único lugar onde "horário de
 * Recife" é uma afirmação verdadeira.
 */
export type LeadEmAvaliacao = {
  id: string
  token: string
  desfecho: Desfecho | null
  motivo: MotivoNaoLead | null
  /**
   * Observação já registrada, para a caixa voltar PREENCHIDA. Não é conforto:
   * a Server Action grava valores absolutos, então uma caixa vazia na tela vira
   * `null` no banco — quem abrisse de novo, conferisse os rádios e confirmasse
   * sem tocar em nada apagaria o próprio texto, em silêncio e sem histórico
   * para recuperar.
   */
  observacao: string
  registradoEm: string | null
  /**
   * Quantas pessoas receberam o e-mail deste lead. Vem de `notificado_para`.
   * Acima de uma, a tela avisa que outro responsável pode ter respondido antes
   * — é o caso de "Outra cidade", que avisa os três de uma vez.
   */
  avisados: number
}

const cardBase =
  'flex cursor-pointer flex-col gap-1 rounded-input border px-4 py-3 transition-[border-color,background-color] duration-200'
const cardSolto = 'border-line bg-[rgba(10,16,46,0.6)] hover:border-line-strong'
const cardEscolhido = 'border-ice-400 bg-[rgba(173,213,235,0.10)]'

/**
 * Formulário de desfecho do lead — o POST da página `/desfecho/<id>`.
 *
 * É um `<form action={…}>` com Server Action, e não um `onClick` que chama a
 * ação: assim o envio continua funcionando se o JavaScript não carregar, o que
 * pesa mais aqui que no resto do site — a pessoa chega por um clique em e-mail
 * corporativo, às vezes dentro de um webview com bloqueio de script.
 *
 * O bloco de motivo só existe quando o desfecho escolhido é "não é lead". Isso
 * não é só visual: nos outros três os campos ficam DESMONTADOS, então nem
 * chegam ao `FormData` — e a ação ainda assim os descarta por conta própria
 * (ver `registrar-desfecho.ts`), porque tela não é validação.
 */
export function FormularioDesfecho({
  lead,
  statusInicial,
}: {
  lead: LeadEmAvaliacao
  statusInicial: Desfecho | null
}) {
  const id = useId()
  const [resultado, enviar, enviando] = useActionState(registrarDesfecho, null)

  // Pré-seleção, nesta ordem: o botão clicado no e-mail, senão o desfecho já
  // registrado antes, senão nada — obrigar a escolher é melhor que um default
  // que vira registro errado por inércia.
  const [escolhido, setEscolhido] = useState<Desfecho | null>(statusInicial ?? lead.desfecho)
  const [motivo, setMotivo] = useState<MotivoNaoLead | null>(lead.motivo)

  // Depois de gravar, a confirmação substitui o formulário. "Alterar resposta"
  // volta para cá sem recarregar — o `useActionState` não zera o resultado
  // sozinho, então este sinalizador é o que decide o que aparece.
  const [editando, setEditando] = useState(false)
  const gravado = resultado?.ok === true && !editando

  // Lead que JÁ tem desfecho não cai direto no formulário: a tela primeiro diz
  // o que está registrado, e só então oferece a mudança. Não é firula de fluxo —
  // o e-mail de "Outra cidade" vai para três responsáveis, e sem esta parada a
  // segunda pessoa a abrir o link marcaria por cima sem saber que alguém já
  // respondeu. Com ela, a diferença entre dois cliques concorrentes e uma
  // correção consciente fica na tela.
  const [alterando, setAlterando] = useState(false)
  const mostrarRegistroAtual = !gravado && !alterando && lead.desfecho !== null

  // A confirmação SUBSTITUI o `<form>`: o botão que estava em foco some com ele
  // e o foco cairia no `<body>`, deixando o anúncio por conta da sorte. Mesmo
  // tratamento do formulário de inscrição do Experience.
  const sucessoRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (gravado) sucessoRef.current?.focus()
  }, [gravado])

  if (mostrarRegistroAtual && lead.desfecho) {
    return (
      <div className="rounded-card border border-line-strong bg-bg-raise p-6">
        <p className="text-[1.05rem] font-semibold text-fg">
          Este lead já foi marcado como {DESFECHO_ROTULOS[lead.desfecho]}
          {lead.registradoEm ? ` em ${lead.registradoEm}` : ''}.
        </p>
        {lead.motivo && (
          <p className="mt-1 text-[0.9rem] text-fg-2">Motivo: {MOTIVO_ROTULOS[lead.motivo]}</p>
        )}
        {lead.avisados > 1 && (
          <p className="mt-3 text-[0.9rem] text-fg-3">
            O e-mail deste lead foi para {lead.avisados} responsáveis — pode ter sido outra pessoa
            que respondeu.
          </p>
        )}
        <p className="mt-3 text-[0.9rem] text-fg-2">
          Se isso mudou, você pode alterar. A resposta anterior é substituída.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setAlterando(true)}
            className="rounded-pill bg-accent px-5 py-2 text-[0.9rem] font-semibold text-navy-950 transition-opacity duration-200 hover:opacity-90"
          >
            Alterar resposta
          </button>
        </div>
        <p className="mt-4 text-[0.85rem] text-fg-3">
          Se estiver certo, é só fechar esta página — não precisa confirmar de novo.
        </p>
      </div>
    )
  }

  if (gravado && resultado.ok) {
    return (
      <div
        ref={sucessoRef}
        tabIndex={-1}
        className="rounded-card border border-ice-400/40 bg-[rgba(173,213,235,0.08)] p-6 outline-none"
      >
        <p role="status" className="text-[1.05rem] font-semibold text-fg">
          Desfecho registrado: {DESFECHO_ROTULOS[resultado.desfecho]}
        </p>
        {resultado.motivo && (
          <p className="mt-1 text-[0.9rem] text-fg-2">Motivo: {MOTIVO_ROTULOS[resultado.motivo]}</p>
        )}
        <p className="mt-2 text-[0.9rem] text-fg-3">
          Pode fechar esta página. Se o lead evoluir depois, é só abrir o link do e-mail de novo.
        </p>
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="mt-4 rounded-pill border border-line-strong px-5 py-2 text-[0.9rem] font-semibold text-fg transition-colors duration-200 hover:border-ice-400 hover:text-accent"
        >
          Alterar resposta
        </button>
      </div>
    )
  }

  return (
    <form
      action={(formData) => {
        setEditando(false)
        enviar(formData)
      }}
    >
      <input type="hidden" name="lead" value={lead.id} />
      <input type="hidden" name="token" value={lead.token} />

      {lead.desfecho && (
        <p className="mb-5 rounded-input border border-line bg-[rgba(10,16,46,0.6)] px-4 py-3 text-[0.9rem] text-fg-2">
          Substituindo o registro de{' '}
          <strong className="text-fg">{DESFECHO_ROTULOS[lead.desfecho]}</strong>
          {lead.registradoEm ? ` de ${lead.registradoEm}` : ''}.
        </p>
      )}

      <fieldset className="border-0 p-0">
        <legend className="mb-3 text-[0.9rem] font-semibold text-fg">
          Como terminou este contato?
        </legend>
        <div className="grid gap-2">
          {DESFECHOS.map((status) => (
            <label
              key={status}
              htmlFor={`${id}-${status}`}
              className={`${cardBase} ${escolhido === status ? cardEscolhido : cardSolto}`}
            >
              <span className="flex items-center gap-3">
                <input
                  id={`${id}-${status}`}
                  type="radio"
                  name="desfecho"
                  value={status}
                  checked={escolhido === status}
                  onChange={() => setEscolhido(status)}
                  className="h-4 w-4 accent-ice-400"
                />
                <span className="text-[1rem] font-semibold text-fg">
                  {DESFECHO_ROTULOS[status]}
                </span>
              </span>
              <span className="pl-7 text-[0.85rem] text-fg-3">{DESFECHO_DESCRICOES[status]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {escolhido === DESFECHO_COM_MOTIVO && (
        <fieldset className="mt-6 border-0 p-0">
          <legend className="mb-3 text-[0.9rem] font-semibold text-fg">
            O que a pessoa procurava?
          </legend>
          <div className="grid gap-2">
            {MOTIVOS.map((opcao) => (
              <label
                key={opcao}
                htmlFor={`${id}-motivo-${opcao}`}
                className={`${cardBase} flex-row items-center gap-3 ${
                  motivo === opcao ? cardEscolhido : cardSolto
                }`}
              >
                <input
                  id={`${id}-motivo-${opcao}`}
                  type="radio"
                  name="motivo"
                  value={opcao}
                  checked={motivo === opcao}
                  onChange={() => setMotivo(opcao)}
                  className="h-4 w-4 accent-ice-400"
                />
                <span className="text-[0.95rem] text-fg">{MOTIVO_ROTULOS[opcao]}</span>
              </label>
            ))}
          </div>
          <label
            htmlFor={`${id}-observacao`}
            className="mt-4 block text-[0.9rem] font-semibold text-fg"
          >
            Quer detalhar? <span className="font-normal text-fg-3">(opcional)</span>
          </label>
          <textarea
            id={`${id}-observacao`}
            name="observacao"
            defaultValue={lead.observacao}
            rows={3}
            maxLength={LIMITE_OBSERVACAO}
            className="mt-2 w-full rounded-input border border-line-strong bg-[rgba(10,16,46,0.6)] px-4 py-3 font-body text-[0.95rem] text-fg outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-fg-3 focus:border-ice-400 focus:shadow-[0_0_0_3px_rgba(173,213,235,0.18)]"
          />
        </fieldset>
      )}

      {resultado && !resultado.ok && (
        <p
          role="alert"
          className="mt-5 rounded-input border border-[#E27287] bg-[rgba(226,114,135,0.10)] px-4 py-3 text-[0.9rem] text-[#F2A6B4]"
        >
          {resultado.erro}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="mt-6 w-full rounded-pill bg-accent px-6 py-3 text-[1rem] font-semibold text-navy-950 transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {enviando ? 'Gravando…' : 'Confirmar'}
      </button>
    </form>
  )
}
