import { describe, expect, it } from 'vitest'
import { IS_MEASURABLE_HOST_JS } from '@/components/analytics/measurableHost'

/**
 * Guarda de host das tags de medição (GA4 e Clarity).
 *
 * O teste **avalia a expressão exportada**, do jeito que o browser a avalia
 * dentro do `<Script>` inline. Reescrever a regex aqui faria teste e código
 * errarem juntos — foi exatamente uma premissa não travada ("hoje só existe o
 * `www`") que deixou `local.semog.com.br` mandar 116 sessões de
 * desenvolvimento para a propriedade de produção em setembro/2026.
 *
 * O `new Function` abaixo não recebe nada de fora: a única coisa interpolada é
 * a constante do próprio módulo sob teste, e isto roda só no Vitest.
 */
const avaliaGuarda = new Function('location', `return ${IS_MEASURABLE_HOST_JS}`) as (
  // `as`: `new Function` só sabe devolver `Function`; o tipo real é o da
  // expressão em `measurableHost.ts`, que recebe o `location` e devolve boolean.
  location: { hostname: string },
) => boolean

function mede(hostname: string): boolean {
  return avaliaGuarda({ hostname })
}

describe('IS_MEASURABLE_HOST_JS', () => {
  it('mede os dois hosts de produção — o www e o apex que redireciona pra ele', () => {
    expect(mede('www.semog.com.br')).toBe(true)
    expect(mede('semog.com.br')).toBe(true)
  })

  it('NÃO mede subdomínio de desenvolvimento', () => {
    for (const host of ['local.semog.com.br', 'dev.semog.com.br', 'staging.semog.com.br']) {
      expect(mede(host)).toBe(false)
    }
  })

  it('NÃO mede localhost nem preview da Vercel', () => {
    for (const host of ['localhost', '127.0.0.1', 'semogsite-git-main-semog.vercel.app']) {
      expect(mede(host)).toBe(false)
    }
  })

  it('NÃO casa host que apenas contém o domínio', () => {
    for (const host of ['naosemog.com.br', 'wwwsemog.com.br', 'semog.com.br.exemplo.com']) {
      expect(mede(host)).toBe(false)
    }
  })
})
