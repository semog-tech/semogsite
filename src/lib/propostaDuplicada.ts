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
 * "Mesmo pedido" = mesmo telefone normalizado, MESMA cidade e, se a curta
 * disser o condomínio, o mesmo condomínio (sem acento e sem caixa). Só o
 * telefone não basta: um síndico profissional pede proposta de dois condomínios
 * no mesmo dia, e o segundo — de outra praça ou outro prédio — é lead novo, com
 * card e e-mail para a regional dele. Condomínio vazio na curta (o campo é
 * opcional) não desfaz o casamento. O nome da pessoa não entra: muda de grafia
 * entre um formulário e outro ("Maria" × "Maria Souza").
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

/** O que identifica o pedido da proposta curta para compará-lo com os anteriores. */
export type ChaveDaProposta = { telefone: string; cidade: string; nomeCondominio?: string }

type Candidata = {
  id: string
  telefone: string | null
  cidade: string | null
  nome_condominio: string | null
}

/** Nome de condomínio comparável: sem acento, sem caixa, espaços colapsados. */
export function normalizarCondominio(valor: string | null | undefined): string {
  return (valor ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** A anterior é o mesmo pedido: mesma cidade e, se a curta disse, mesmo condomínio. */
function mesmoPedido(chave: ChaveDaProposta, linha: Candidata): boolean {
  if (linha.cidade !== chave.cidade) return false
  const condominio = normalizarCondominio(chave.nomeCondominio)
  return condominio === '' || condominio === normalizarCondominio(linha.nome_condominio)
}

/**
 * Id da proposta (completa ou curta) do mesmo pedido — telefone, cidade e
 * condomínio, ver o topo do arquivo — gravada nas últimas 24 h, a mais
 * recente; `null` se não houver.
 *
 * Só olha linhas que não são, elas mesmas, duplicadas: a ligação aponta sempre
 * para o lead que virou card, e não forma corrente.
 *
 * **Falha da consulta não barra o envio.** Devolve `null`, e a proposta segue o
 * caminho normal: um card duplicado no Exact é incômodo, um lead perdido é
 * prejuízo. O erro vai ao log sem o telefone.
 */
export async function propostaRecenteDoMesmoPedido(
  chave: ChaveDaProposta,
  agora: Date = new Date(),
): Promise<string | null> {
  const procurado = normalizarTelefone(chave.telefone)
  if (!procurado) return null
  const corte = new Date(agora.getTime() - JANELA_DE_DUPLICIDADE_MS).toISOString()
  try {
    const { rows } = await query<Candidata>(
      `select id, data->>'telefone' as telefone, data->>'cidade' as cidade,
              data->>'nomeCondominio' as nome_condominio
         from cms.leads
        where form = 'proposta'
          and created_at > $1
          and data->>'${DUPLICA_DE_FIELD}' is null
        order by created_at desc
        limit ${TETO_DE_CANDIDATAS}`,
      [corte],
    )
    const anterior = rows.find(
      (linha) => normalizarTelefone(linha.telefone) === procurado && mesmoPedido(chave, linha),
    )
    return anterior?.id ?? null
  } catch (err) {
    console.error(
      '[proposta-duplicada] busca da proposta anterior falhou; segue sem deduplicar:',
      err instanceof Error ? err.message : 'erro desconhecido',
    )
    return null
  }
}
