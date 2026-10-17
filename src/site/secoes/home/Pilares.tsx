import './pilares.css'
import type { ReactNode } from 'react'
import { conteudo } from '@/site/conteudo/conteudo'

/** O que a cena destaca no texto de cada pilar (`data-destaque`): o percentual do Garante, a frase da cobrança. */
const DESTAQUE: Partial<Record<string, 'percentual' | 'frase'>> = {
  garante: 'percentual',
  cobranca: 'frase',
}

/** Um pilar do III do logo, sem leitura (o III do celular) ou com a coluna de leitura na face frontal. */
function CorpoDoPilar({ children }: { children?: ReactNode }) {
  return (
    <div className="pilar-corpo">
      <span className="pilar-topo" aria-hidden="true" />
      <span className="pilar-lado" aria-hidden="true" />
      <div className="pilar-frente">{children}</div>
    </div>
  )
}

/** Feixe de luz que desce de um pilar na saída da cena. */
function Feixe() {
  return (
    <span className="feixe">
      <span className="feixe-trilho">
        <span className="feixe-luz" />
      </span>
    </span>
  )
}

/**
 * Pilares (home): os três pilares são o símbolo III do logo, na mesma proporção e no mesmo
 * intervalo. No desktop cada face frontal é uma coluna de leitura; no celular o texto vem
 * empilhado e o III fecha a cena. Na saída, a luz dos pilares desce e o marinho vira gelo.
 */
export function Pilares() {
  const { pilares } = conteudo
  return (
    <section
      id="pilares"
      className="cena grao"
      data-tema="marinho"
      aria-labelledby="pilares-titulo"
    >
      <div className="container pilares-cabeca">
        <h2 id="pilares-titulo" className="pilares-titulo">
          {pilares.titulo}
        </h2>
      </div>

      <div className="pilares-palco">
        <ul className="container pilares-fila">
          {pilares.itens.map((item) => (
            <li key={item.id} id={item.id} className="pilar">
              <CorpoDoPilar>
                <span className="pilar-brilho" aria-hidden="true" />
                <div className="pilar-leitura">
                  <h3 className="pilar-titulo">{item.titulo}</h3>
                  <p className="pilar-texto" data-destaque={DESTAQUE[item.id]}>
                    {item.texto}
                  </p>
                </div>
              </CorpoDoPilar>
            </li>
          ))}
        </ul>

        <div className="container pilares-iii" aria-hidden="true">
          {pilares.itens.map((item) => (
            <div key={item.id} className="pilar">
              <CorpoDoPilar />
            </div>
          ))}
        </div>
        <div className="pilares-grao grao" aria-hidden="true" />
      </div>

      <div className="pilares-descida" aria-hidden="true">
        <div className="container pilares-feixes">
          {pilares.itens.map((item) => (
            <Feixe key={item.id} />
          ))}
        </div>
        <div className="pilares-grao grao" />
      </div>
    </section>
  )
}
