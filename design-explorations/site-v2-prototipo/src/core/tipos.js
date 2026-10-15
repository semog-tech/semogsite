/**
 * Tipos compartilhados entre o core e as cenas. Só JSDoc; não exporta código.
 *
 * @typedef {typeof import("gsap").gsap} Gsap
 * @typedef {typeof import("gsap/ScrollTrigger").ScrollTrigger} ScrollTriggerEstatico
 * @typedef {typeof import("gsap/SplitText").SplitText} SplitTextEstatico
 * @typedef {import("lenis").default} Lenis
 * @typedef {typeof import("./util.js")} Util
 * @typedef {typeof import("../conteudo.json")} Conteudo
 *
 * @typedef {Object} ContextoCena
 * @property {Gsap} gsap Instância única do GSAP, com ScrollTrigger e SplitText registrados.
 * @property {ScrollTriggerEstatico} ScrollTrigger Plugin já registrado e sincronizado com o Lenis.
 * @property {SplitTextEstatico} SplitText Plugin já registrado.
 * @property {Lenis | null} lenis Rolagem suave. `null` se o Lenis falhou; a rolagem nativa segue.
 * @property {Util} util Formatação, contador, revelações, pin + scrub, laços, canvas.
 * @property {Conteudo} conteudo Fatos e textos de src/conteudo.json (somente leitura).
 * @property {Promise<void>} pronto Resolve quando fontes e load chegaram e html.motion foi
 *   marcada (no máximo ~5 s). Entradas da primeira dobra tocam depois disso.
 * @property {HTMLElement} root A `<section>` da cena. Selecione sempre a partir dela.
 * @property {() => boolean} estreito Verdadeiro em tela estreita (até 760px), lido na hora.
 *
 * @typedef {Array<[string, (ctx: ContextoCena) => unknown]>} ListaCenas id da <section> e init
 */

export {};
