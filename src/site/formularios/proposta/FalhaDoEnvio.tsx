import { site } from '@/../content/site'
import { TEXTOS } from './textos'

/**
 * Falha do envio no formulário do site v2 (spec 5, R8): telefone da Unidade Semog e "Tentar de
 * novo", nunca WhatsApp. O `FalhaDeEnvio` antigo (com WhatsApp) continua no formulário antigo e no
 * Experience. Telefones de `content/site.ts` (fonte única do NAP).
 */

const UNIDADES = site.company.addresses

function linkDoTelefone(telefone: string): string {
  return `tel:+55${telefone.replace(/\D/g, '')}`
}

/** As Unidades da UF, ou todas quando a UF não tem Unidade (ou ainda não foi escolhida). */
export function unidadesDaUf(uf: string) {
  const daUf = UNIDADES.filter((u) => u.uf === uf)
  return daUf.length > 0 ? daUf : UNIDADES
}

export function TelefonesDasUnidades({ uf }: { uf: string }) {
  return (
    <ul className="fp-telefones">
      {unidadesDaUf(uf).map((u) => (
        <li key={u.city}>
          <a href={linkDoTelefone(u.phone)}>
            {u.city} · {u.phone}
          </a>
        </li>
      ))}
    </ul>
  )
}

type PropsFalha = { uf: string; enviando: boolean; aoTentarDeNovo: () => void }

export function FalhaDoEnvio({ uf, enviando, aoTentarDeNovo }: PropsFalha) {
  return (
    <div className="fp-falha" role="alert">
      <p className="fp-falha-titulo">{TEXTOS.falhaTitulo}</p>
      <p>{TEXTOS.falhaTexto}</p>
      <TelefonesDasUnidades uf={uf} />
      <div className="fp-acoes">
        <button className="botao" type="button" onClick={aoTentarDeNovo} disabled={enviando}>
          {TEXTOS.tentarDeNovo}
        </button>
      </div>
    </div>
  )
}
