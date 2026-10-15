/**
 * A rota de prévia do site v2 (/previa-v2) existe para ver a fundação em Preview e local. Fica
 * FECHADA por padrão (404): só abre com `VERCEL_ENV` em preview ou development, ou numa máquina
 * local, onde nem `VERCEL_ENV` nem `VERCEL` existem. `VERCEL_ENV` é definido pela própria Vercel
 * no build e no servidor e nunca chega ao navegador. A rota é estática: a decisão é tomada no
 * BUILD. Se a Vercel não expuser `VERCEL_ENV` (variáveis de sistema desligadas no projeto) mas
 * `VERCEL` existir, o caso cai em "fechado", e não em produção aberta. A conferência real é
 * `curl /previa-v2` = 404 em produção, item da fase 5.
 */
export function previaLiberada(
  ambiente: string | undefined = process.env.VERCEL_ENV,
  naVercel: string | undefined = process.env.VERCEL,
): boolean {
  if (ambiente === 'preview' || ambiente === 'development') return true
  return ambiente === undefined && naVercel === undefined
}
