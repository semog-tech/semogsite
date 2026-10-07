import { iniciarSemogappFalso } from './helpers/semogappFalso'

/**
 * Sobe o semogapp FALSO da 2ª via UMA vez para a execução inteira — os
 * projetos chromium e firefox rodam em paralelo e dividiriam a porta. A porta
 * é a mesma do `SEMOGAPP_API_URL` do `webServer` (`playwright.config.ts`).
 * Porta ocupada derruba a execução com o erro do `listen`: melhor que testar
 * contra um servidor desconhecido.
 */
export const PORTA_DO_SEMOGAPP_FALSO = 4599

export default async function globalSetup() {
  const falso = await iniciarSemogappFalso(PORTA_DO_SEMOGAPP_FALSO)
  return async () => {
    await falso.fechar()
  }
}
