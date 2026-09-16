/**
 * Vocabulário do desfecho comercial de um lead — a lista canônica dos quatro
 * status, dos motivos de "não é lead" e os rótulos pt-BR de cada um.
 *
 * Módulo **puro de propósito**: nada de `server-only`, `node:crypto` ou acesso
 * ao banco. Ele é importado pelos três lados da funcionalidade — o template do
 * e-mail (`src/emails/ContactNotification.tsx`), a página de confirmação
 * (`src/app/(interno)/desfecho/[id]/page.tsx`) e o formulário no navegador
 * (`src/components/desfecho/FormularioDesfecho.tsx`). A assinatura do token e
 * a montagem das URLs ficam em `src/lib/desfechoToken.ts`, que é server-only.
 *
 * As chaves abaixo são o valor que vai para as colunas `desfecho`/
 * `desfecho_motivo` de `cms.leads` (ver `db/leads-desfecho.sql`). Mudar uma
 * chave reescreve o significado do histórico já gravado — acrescente em vez de
 * renomear.
 */

export type Desfecho = 'negociando' | 'fechou' | 'nao_evoluiu' | 'nao_e_lead'

/** Ordem em que os quatro aparecem no e-mail e na página, do melhor ao pior. */
export const DESFECHOS = ['negociando', 'fechou', 'nao_evoluiu', 'nao_e_lead'] as const

export const DESFECHO_ROTULOS: Record<Desfecho, string> = {
  negociando: 'Em negociação',
  fechou: 'Fechou',
  nao_evoluiu: 'Não evoluiu',
  nao_e_lead: 'Não é lead',
}

/**
 * A frase que desempata os quatro na hora de escolher. "Não evoluiu" e "não é
 * lead" são os dois que se confundem, e são justamente os que precisam ficar
 * separados: o primeiro é um lead de verdade que não fechou (entra no
 * denominador da conversão), o segundo nunca foi lead (sai da conta).
 */
export const DESFECHO_DESCRICOES: Record<Desfecho, string> = {
  negociando: 'Conversa em andamento — proposta enviada ou reunião marcada.',
  fechou: 'Virou cliente: contrato assinado.',
  nao_evoluiu: 'Era um lead de verdade, mas não avançou (sem resposta, preço, ficou com a atual).',
  nao_e_lead: 'Não era procura por administradora.',
}

/** O único desfecho que pede motivo. Isolado numa constante porque é regra, não detalhe de tela. */
export const DESFECHO_COM_MOTIVO = 'nao_e_lead' satisfies Desfecho

export type MotivoNaoLead =
  | 'segunda_via_boleto'
  | 'morador_reclamacao'
  | 'fornecedor_parceria'
  | 'curriculo'
  | 'outro'

export const MOTIVOS = [
  'segunda_via_boleto',
  'morador_reclamacao',
  'fornecedor_parceria',
  'curriculo',
  'outro',
] as const

export const MOTIVO_ROTULOS: Record<MotivoNaoLead, string> = {
  segunda_via_boleto: 'Segunda via de boleto',
  morador_reclamacao: 'Morador com reclamação',
  fornecedor_parceria: 'Fornecedor ou parceria',
  curriculo: 'Currículo',
  outro: 'Outro',
}

/** Teto da observação em texto livre — o campo é contexto, não relatório. */
export const LIMITE_OBSERVACAO = 500

/**
 * Narrowing do que chega do `FormData` (que devolve `FormDataEntryValue`, ou
 * seja, `string | File`) e da query string. Sem isso o valor entraria no
 * `update` como texto arbitrário vindo do navegador.
 */
export function ehDesfecho(valor: unknown): valor is Desfecho {
  return typeof valor === 'string' && (DESFECHOS as readonly string[]).includes(valor)
}

export function ehMotivo(valor: unknown): valor is MotivoNaoLead {
  return typeof valor === 'string' && (MOTIVOS as readonly string[]).includes(valor)
}

/**
 * Retorno da Server Action `registrarDesfecho`. Mora aqui, e não junto dela,
 * pela mesma regra que vale pro `FormType`: módulo `'use server'` só pode
 * exportar função async — um `export type` ali vira entrada do registro de
 * Server Actions apontando pra um identificador que a compilação apagou, e o
 * módulo inteiro morre na primeira chamada (foi o que derrubou a captação por
 * 12 dias em agosto/2026).
 */
/**
 * Um dos quatro botões do e-mail de notificação, já com a URL absoluta da
 * página de confirmação. O tipo mora neste módulo puro (e não junto de
 * `botoesDeDesfecho`, em `desfechoToken.ts`) porque quem o consome é o template
 * do e-mail — e `desfechoToken.ts` é `server-only`, que o jsdom dos testes não
 * carrega.
 */
export type BotaoDeDesfecho = { status: Desfecho; rotulo: string; url: string }

export type ResultadoDoDesfecho =
  | { ok: true; desfecho: Desfecho; motivo: MotivoNaoLead | null }
  | { ok: false; erro: string }
