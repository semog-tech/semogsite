// Any setup scripts you might need go here

// Load .env files
import 'dotenv/config'

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
