/**
 * Resposta das actions das duas etapas. Mora fora do módulo `'use server'` (só função async pode
 * ser exportada de lá; um `export type` derrubou a captação por 12 dias em agosto/2026).
 * `precisa_verificar`: o token da etapa sumiu ou venceu; a tela mostra o Turnstile e reenvia tudo.
 */
export type ResultadoEtapa =
  | { ok: true; etapa: 1 | 2 }
  | { ok: false; motivo: 'campos'; erros: Record<string, string> }
  | { ok: false; motivo: 'precisa_verificar' }
  | { ok: false; motivo: 'recusado'; mensagem: string }
  | { ok: false; motivo: 'falha'; mensagem: string }

export type ResultadoFalha = Extract<ResultadoEtapa, { ok: false }>
