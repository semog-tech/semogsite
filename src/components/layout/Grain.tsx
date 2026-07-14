/**
 * Overlay de grão fixo (semog.css:197-202) — decorativo, `pointer-events:none`
 * e `aria-hidden`, não interfere com cliques nem leitores de tela.
 */
export function Grain() {
  return <div className="grain" aria-hidden="true" />
}
