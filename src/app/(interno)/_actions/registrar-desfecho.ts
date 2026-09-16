'use server'

/**
 * **Só exporte função async deste arquivo.** Num módulo `'use server'` o Next
 * registra *todo* export como Server Action — inclusive um `export type`, que
 * a compilação apaga, deixando o registro apontando para um identificador que
 * não existe; o módulo inteiro morre com `ReferenceError` na primeira chamada.
 * Foi assim que um `export type` derrubou os formulários do site por 12 dias em
 * agosto/2026, com build, `tsc` e testes verdes. Os tipos desta funcionalidade
 * moram em `@/lib/desfecho`, e há portão de CI (`pnpm check:server-actions`).
 */

import { query } from '@/lib/db'
import {
  DESFECHO_COM_MOTIVO,
  ehDesfecho,
  ehMotivo,
  LIMITE_OBSERVACAO,
  type MotivoNaoLead,
  type ResultadoDoDesfecho,
} from '@/lib/desfecho'
import { tokenConfere } from '@/lib/desfechoToken'

/**
 * Grava o desfecho de um lead — o POST da página de confirmação
 * (`/desfecho/<id>`), disparado pelo botão "Confirmar".
 *
 * **É aqui que a escrita acontece, e só aqui.** O botão do e-mail faz um GET
 * que apenas lê e exibe: filtro de segurança corporativo e proxy de e-mail
 * abrem todos os links de uma mensagem para inspecioná-los, e um GET que
 * gravasse marcaria leads sozinho, sem ninguém ter clicado.
 *
 * O token é conferido **de novo** aqui, e não só na página. O corpo de um POST
 * é tão controlável pelo remetente quanto uma query string — validar só na
 * renderização deixaria a gravação aberta a quem montasse a requisição na mão.
 *
 * **Grava valores absolutos, e isso não é o mesmo que ser idempotente.** As
 * quatro colunas são sobrescritas com o que veio no `FormData` — nenhuma é
 * preservada por `coalesce`, de propósito: corrigir "não é lead / currículo"
 * para "em negociação" precisa limpar o motivo, senão o banco fica com um lead
 * em negociação carregando a justificativa de não ser lead.
 *
 * O preço disso é que o resultado depende inteiramente do que a TELA enviar.
 * Reenviar o mesmo `FormData` grava o mesmo estado; reenviar um formulário
 * remontado com um campo vazio APAGA aquele campo. Foi exatamente o que
 * aconteceu com a observação: a página não a carregava de volta, a `textarea`
 * vinha vazia, e quem reabrisse o link e confirmasse sem tocar em nada perdia
 * o texto — sem aviso e sem histórico para recuperar.
 *
 * Por isso a responsabilidade é da página, não daqui: quem renderiza o
 * formulário precisa devolver TODOS os campos já preenchidos com o que está
 * gravado. Um campo novo que a tela esqueça de repopular volta a ser uma perda
 * silenciosa por este mesmo caminho.
 *
 * Assinatura de `useActionState`: o primeiro parâmetro é o estado anterior,
 * que esta ação ignora — cada envio decide sozinho, a partir do `FormData`.
 */
export async function registrarDesfecho(
  _anterior: ResultadoDoDesfecho | null,
  formData: FormData,
): Promise<ResultadoDoDesfecho> {
  const leadId = String(formData.get('lead') ?? '')
  const token = String(formData.get('token') ?? '')

  if (!tokenConfere(leadId, token)) {
    return { ok: false, erro: 'Este link não é válido. Abra de novo o link do e-mail.' }
  }

  const desfecho = formData.get('desfecho')
  if (!ehDesfecho(desfecho)) {
    return { ok: false, erro: 'Escolha um desfecho antes de confirmar.' }
  }

  // Motivo e observação só existem em "não é lead" — nos outros três a página
  // nem pergunta, e um valor que chegasse assim mesmo é descartado aqui.
  let motivo: MotivoNaoLead | null = null
  let observacao: string | null = null
  if (desfecho === DESFECHO_COM_MOTIVO) {
    const motivoRecebido = formData.get('motivo')
    if (!ehMotivo(motivoRecebido)) {
      return { ok: false, erro: 'Escolha o motivo para registrar "Não é lead".' }
    }
    motivo = motivoRecebido
    const texto = String(formData.get('observacao') ?? '')
      .trim()
      .slice(0, LIMITE_OBSERVACAO)
    observacao = texto || null
  }

  try {
    const { rowCount } = await query(
      `update cms.leads
          set desfecho = $1, desfecho_motivo = $2, desfecho_observacao = $3, desfecho_em = now()
        where id = $4`,
      [desfecho, motivo, observacao, leadId],
    )
    if (!rowCount) {
      return { ok: false, erro: 'Este lead não existe mais no banco.' }
    }
  } catch (err) {
    // O erro real fica no log da Vercel; a tela diz que NÃO gravou, em vez de
    // mostrar um sucesso que não aconteceu.
    console.error('[desfecho] falha ao gravar o desfecho do lead:', err)
    return { ok: false, erro: 'Não foi possível gravar agora. Tente de novo em instantes.' }
  }

  return { ok: true, desfecho, motivo }
}
