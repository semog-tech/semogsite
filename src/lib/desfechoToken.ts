import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'
import { type BotaoDeDesfecho, DESFECHO_ROTULOS, DESFECHOS } from '@/lib/desfecho'
import { absoluteUrl } from '@/lib/seo'

/**
 * Token que autoriza registrar o desfecho de um lead — HMAC-SHA256 sobre o
 * **id do lead**, e só sobre ele.
 *
 * Por que o status NÃO entra na assinatura: o token precisa valer para o lead
 * inteiro, não para uma escolha. O responsável clica "Fechou" no e-mail, abre
 * a página e percebe que era outro condomínio — se cada botão carregasse um
 * token próprio, corrigir a escolha ali exigiria voltar ao e-mail. Com o lead
 * assinado, o status do link é só pré-seleção, e os quatro botões da página
 * funcionam com o mesmo token.
 *
 * O segredo é **exclusivo desta função** (`LEAD_OUTCOME_SECRET`). Reaproveitar
 * o `CRON_SECRET` juntaria dois domínios de confiança diferentes: o do cron é
 * um Bearer que a Vercel guarda e nunca sai da infraestrutura; este viaja em
 * URL dentro de e-mail, passa por filtro corporativo e fica no histórico do
 * navegador de quem clicou. Vazamento de um não pode virar acesso ao outro.
 *
 * Sem `LEAD_OUTCOME_SECRET` configurado, `assinarLead` devolve `null` e o
 * e-mail sai **sem** os botões. É a degradação honesta: botão que leva a um
 * link que ninguém consegue validar é pior que botão nenhum.
 */

/**
 * Prefixo de separação de domínio na mensagem assinada. Hoje só existe um uso
 * para este segredo; o prefixo é o que garante que um segundo uso (assinar um
 * id de outra tabela, por exemplo) não produza o mesmo token para o mesmo
 * número.
 */
const PREFIXO = 'lead-desfecho:'

function segredo(): string | null {
  const valor = process.env.LEAD_OUTCOME_SECRET?.trim()
  return valor ? valor : null
}

/** Só id numérico é aceito — `cms.leads.id` é `bigint generated always as identity`. */
function ehIdDeLead(leadId: string): boolean {
  return /^\d{1,19}$/.test(leadId)
}

/** Token do lead em base64url, ou `null` quando não há segredo configurado. */
export function assinarLead(leadId: string): string | null {
  const chave = segredo()
  if (!chave || !ehIdDeLead(leadId)) return null
  return createHmac('sha256', chave).update(`${PREFIXO}${leadId}`).digest('base64url')
}

/**
 * Confere o token recebido na URL contra o do lead, em **tempo constante**.
 *
 * `timingSafeEqual` lança quando os buffers têm tamanhos diferentes, então o
 * tamanho é comparado antes — o comprimento do token não é segredo (é sempre
 * 43 caracteres), a diferença byte a byte é.
 */
export function tokenConfere(leadId: string, token: string | undefined): boolean {
  const esperado = assinarLead(leadId)
  if (!esperado || !token) return false

  const a = Buffer.from(esperado, 'utf8')
  const b = Buffer.from(token, 'utf8')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

/**
 * Os quatro botões do e-mail de notificação, já com a URL absoluta da página
 * de confirmação. `null` quando não há segredo — quem chama simplesmente não
 * renderiza a seção.
 *
 * O link é um **GET que só lê**: abre a página de confirmação com o status
 * pré-selecionado. Nenhum destes endereços grava nada, e isso é requisito, não
 * estilo — proxy de segurança de e-mail abre todos os links de uma mensagem
 * para inspecioná-los, e um link que gravasse marcaria o lead sozinho.
 */
export function botoesDeDesfecho(leadId: string): BotaoDeDesfecho[] | null {
  const token = assinarLead(leadId)
  if (!token) return null

  const base = absoluteUrl(`desfecho/${leadId}`)
  return DESFECHOS.map((status) => ({
    status,
    rotulo: DESFECHO_ROTULOS[status],
    url: `${base}?t=${encodeURIComponent(token)}&s=${status}`,
  }))
}
