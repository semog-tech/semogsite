import 'server-only'

import { parsePhoneNumberFromString } from 'libphonenumber-js/min'
import { query } from '@/lib/db'
import { DUPLICA_DE_FIELD } from '@/lib/forms'

/**
 * Proposta curta (triagem do WhatsApp) que repete uma proposta recente da
 * mesma pessoa.
 *
 * Em 09/10/2026 a mesma pessoa mandou a proposta completa (lead 220) e, três
 * minutos depois, a curta pela triagem (221): mesmo telefone, mesmo nome, mesmo
 * gclid — e dois cards no Exact para a SDR desfazer à mão. A curta continua
 * sendo gravada (a pessoa pediu, e o protocolo que ela leva ao WhatsApp precisa
 * existir no banco), mas ligada à anterior por `data.duplicaDe`, sem card novo
 * no Exact e sem e-mail interno (ver `processarEnvio`).
 *
 * "Mesma pessoa" = mesmo telefone normalizado. O nome não entra: muda de grafia
 * entre um formulário e outro ("Maria" × "Maria Souza"), e o telefone é o que a
 * equipe usa para chamar.
 */

/** Janela em que uma proposta anterior do mesmo telefone conta como a mesma. */
export const JANELA_DE_DUPLICIDADE_MS = 24 * 60 * 60 * 1000

/**
 * Teto de linhas lidas na janela. O site recebe poucas propostas por dia; o
 * teto só evita que um dia anômalo traga a tabela inteira para a memória.
 */
const TETO_DE_CANDIDATAS = 200

/**
 * Telefone como `DDI + número nacional` só com dígitos (`5583999501388`).
 * Os formulários gravam E.164 (`PhoneField`), mas o valor do banco pode ter
 * vindo antes disso, com máscara, sem `+55` ou com o zero do DDD; sem DDI, o
 * número é lido como brasileiro. `null` quando não há telefone utilizável —
 * aí não há o que comparar e nada é tratado como duplicado.
 */
export function normalizarTelefone(valor: string | undefined | null): string | null {
  if (!valor) return null
  const numero = parsePhoneNumberFromString(valor.trim(), 'BR')
  if (numero) return `${numero.countryCallingCode}${numero.nationalNumber}`
  const digitos = valor.replace(/\D/g, '')
  return digitos.length >= 10 ? digitos : null
}

type Candidata = { id: string; telefone: string | null }

/**
 * Id da proposta (completa ou curta) do mesmo telefone gravada nas últimas
 * 24 h, a mais recente; `null` se não houver.
 *
 * Só olha linhas que não são, elas mesmas, duplicadas: a ligação aponta sempre
 * para o lead que virou card, e não forma corrente.
 *
 * **Falha da consulta não barra o envio.** Devolve `null`, e a proposta segue o
 * caminho normal: um card duplicado no Exact é incômodo, um lead perdido é
 * prejuízo. O erro vai ao log sem o telefone.
 */
export async function propostaRecenteDoMesmoTelefone(
  telefone: string,
  agora: Date = new Date(),
): Promise<string | null> {
  const procurado = normalizarTelefone(telefone)
  if (!procurado) return null
  const corte = new Date(agora.getTime() - JANELA_DE_DUPLICIDADE_MS).toISOString()
  try {
    const { rows } = await query<Candidata>(
      `select id, data->>'telefone' as telefone from cms.leads
        where form = 'proposta'
          and created_at > $1
          and data->>'${DUPLICA_DE_FIELD}' is null
        order by created_at desc
        limit ${TETO_DE_CANDIDATAS}`,
      [corte],
    )
    return rows.find((linha) => normalizarTelefone(linha.telefone) === procurado)?.id ?? null
  } catch (err) {
    console.error(
      '[proposta-duplicada] busca da proposta anterior falhou; segue sem deduplicar:',
      err instanceof Error ? err.message : 'erro desconhecido',
    )
    return null
  }
}
