'use client'

import type { UnidadePublica } from '@/lib/segundaVia/tipos'
import { IconeSeta } from '../icones'

type Props = {
  unidades: UnidadePublica[]
  aoEscolher: (ref: string) => void
}

/** Etapa 3 (só com mais de uma unidade): a pessoa escolhe qual consultar. */
export function TelaUnidades({ unidades, aoEscolher }: Props) {
  return (
    <>
      <p className="tr-lead">Seu CPF está ligado a mais de uma unidade. Escolha qual.</p>
      <ul className="tr-opcoes" aria-label="Unidades">
        {unidades.map((u) => (
          <li key={u.ref}>
            <button type="button" className="tr-opcao" onClick={() => aoEscolher(u.ref)}>
              <span className="tr-opcao-texto">
                <strong>{u.unidade}</strong>
                <span>{u.condominio}</span>
              </span>
              <IconeSeta />
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}
