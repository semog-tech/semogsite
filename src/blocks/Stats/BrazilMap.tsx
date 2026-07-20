import type { CSSProperties } from 'react'
import { BRAZIL_MAP } from './brazil-map-data'

/**
 * Mapa do Brasil (SVG inline) para o ledger de Stats: os 26 estados + DF em
 * tom sutil, com PA/PB/PE acesos (`is-on`) e um marcador de **luz azul
 * pulsante** em cada cidade onde a Semog opera (Belém, Recife, João Pessoa).
 *
 * Puro CSS/SVG (sem JS de cliente): as classes `.br-*` e o `@keyframes
 * br-pulse` vivem em `src/styles/theme.css`. Pensado para viver no painel
 * navy (`.br-panel`) à direita do ledger — o brilho azul "estoura" no escuro.
 * `--i` escalona o delay do pulso por marcador.
 */
export function BrazilMap({ className = '' }: { className?: string }) {
  const { viewBox, states, dots } = BRAZIL_MAP
  return (
    <svg
      className={`br-map ${className}`}
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Mapa do Brasil com Pará, Pernambuco e Paraíba em destaque"
    >
      <g>
        {states.map((s) => (
          <path key={s.sigla} className={`br-uf${s.on ? ' is-on' : ''}`} d={s.d} />
        ))}
      </g>
      {dots.map((d, i) => (
        <g
          key={d.sigla}
          className="br-dot"
          style={{ '--i': i } as CSSProperties}
          transform={`translate(${d.x},${d.y})`}
        >
          <circle className="br-ring" r={10} />
          <circle className="br-ring br-ring-2" r={10} />
          <circle className="br-halo" r={17} />
          <circle className="br-core" r={7.5} />
        </g>
      ))}
    </svg>
  )
}
