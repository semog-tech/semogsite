// Any setup scripts you might need go here

// Load .env files
import 'dotenv/config'

import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// `@testing-library/react` só registra o cleanup automático se enxergar um
// `afterEach` GLOBAL (checa `typeof afterEach === 'function'` no escopo
// global). Como `vitest.config.mts` não liga `test.globals`, esse `afterEach`
// nunca existe e o DOM de um `it()` vaza pro próximo — arquivos com mais de
// um `render()` (ex.: `tests/int/hero-proof.int.spec.tsx`) encontram
// elementos duplicados dos testes anteriores. Registrar aqui, explicitamente
// importado, resolve pra todos os specs.
afterEach(() => {
  cleanup()
})

// O jsdom não implementa `matchMedia`, e o `gsap/ScrollTrigger` chama no
// momento do import (`src/motion/gsap.ts`) — sem isto, qualquer teste que
// importe um bloco quebra antes de renderizar. `matches: false` faz os
// componentes assumirem desktop, que é o caso base dos testes.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}
