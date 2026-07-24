/**
 * Guarda de host das tags de medição (GA4 e Clarity).
 *
 * As tags subiam em QUALQUER host — inclusive o `localhost` do `next dev` e os
 * previews `*.vercel.app`. Em 23-24/07/2026 isso respondeu por **metade das
 * sessões** da propriedade GA4 (120 de 189 em 23/07), inflando
 * sessão/usuário/pageview e sujando as gravações do Clarity com navegação de
 * desenvolvimento.
 *
 * A checagem roda **dentro do script inline**, no browser, e não por env de
 * build: `NEXT_PUBLIC_*` é build-time e o mesmo bundle serve produção e preview
 * na Vercel. Fora dos hosts de produção nenhuma lib é baixada — os shims
 * `window.gtag`/`window.clarity` continuam existindo, então as chamadas de
 * evento espalhadas pelo site (`generate_lead`, `whatsapp_click`, consent…)
 * viram no-op: empilham no dataLayer/fila e morrem ali, sem erro no console.
 *
 * Casa com o apex e com qualquer subdomínio de `semog.com.br` (hoje só o `www`).
 */
export const IS_MEASURABLE_HOST_JS = `/(^|\\.)semog\\.com\\.br$/.test(location.hostname)`
