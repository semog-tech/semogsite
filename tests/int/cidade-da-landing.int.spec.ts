import { describe, expect, it } from 'vitest'
import { CITY_LANDINGS } from '@/data/cityLandings'
import { CIDADE_POR_SLUG, cidadeDaLanding } from '@/lib/cidadeDaLanding'

/**
 * `@/lib/cidadeDaLanding` repete os slugs de `src/data/cityLandings.ts` para
 * não levar o conteúdo das landings ao bundle do navegador. A cópia só é
 * segura se as duas listas baterem — é isso que este teste trava.
 */
describe('cidadeDaLanding', () => {
  it('tem exatamente as praças de cityLandings, com a mesma opção de formulário', () => {
    const esperado = Object.fromEntries(
      Object.values(CITY_LANDINGS).map((landing) => [landing.slug, landing.cidadeNoFormulario]),
    )
    const atual = Object.fromEntries(
      Object.entries(CIDADE_POR_SLUG).map(([slug, { cidade }]) => [slug, cidade]),
    )
    expect(atual).toEqual(esperado)
  })

  it('reconhece a landing com ou sem barras nas pontas', () => {
    expect(cidadeDaLanding('/administradora-de-condominios-recife')?.cidade).toBe('Recife e região')
    expect(cidadeDaLanding('/administradora-de-condominios-belem/')?.nome).toBe('Belém')
  })

  it('não confunde página que só menciona a cidade com a landing', () => {
    expect(cidadeDaLanding('/blog/condominios-em-recife')).toBeUndefined()
    expect(cidadeDaLanding('/')).toBeUndefined()
  })
})
