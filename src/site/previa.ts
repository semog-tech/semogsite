/**
 * A rota de prévia do site v2 (/previa-v2) existe para ver a fundação em Preview e local. Em
 * produção ela responde 404. `VERCEL_ENV` é definido pela própria Vercel no build e no
 * servidor (production, preview, development) e nunca chega ao navegador. A rota é estática:
 * a decisão é tomada no BUILD, então só vale se a Vercel expuser as variáveis de sistema ao
 * build. [A CONFIRMAR] "Automatically expose System Environment Variables" ligado no projeto
 * `semogsite`; sem isso `VERCEL_ENV` fica indefinido e a prévia abriria em produção (com
 * `noindex`). A conferência real é `curl /previa-v2` = 404 em produção, item da fase 5.
 */
export function previaLiberada(ambiente: string | undefined = process.env.VERCEL_ENV): boolean {
  return ambiente !== 'production'
}
