import './conferencia.css'
import { conteudo } from '@/site/conteudo/conteudo'

/**
 * Conferência, o princípio da plataforma: "A IA sugere. A gente confere." e três pares tirados do
 * próprio mês, o que a plataforma faz e a pessoa que responde por aquilo, ligados por um traço que
 * termina no mesmo visto das regras da convenção. Na saída, a coluna lavanda vira o véu da proposta.
 */
export function Conferencia() {
  const { conferencia } = conteudo.tecnologia.pagina
  return (
    <section
      id="conferencia"
      className="cena"
      data-tema="claro"
      aria-labelledby="conferencia-titulo"
    >
      <div className="container cf-quadro">
        <div className="cf-topo">
          <h2 id="conferencia-titulo" className="cf-titulo">
            {conferencia.tituloA} <em className="peso">{conferencia.tituloB}</em>
          </h2>
          <p className="cf-lead lead">{conferencia.lead}</p>
        </div>

        <div className="cf-tabela">
          <p className="cf-cabeca" aria-hidden="true">
            <span className="rotulo">{conferencia.plataforma}</span>
            <span className="rotulo">{conferencia.pessoa}</span>
          </p>
          <ul className="cf-pares">
            {conferencia.pares.map((par) => (
              <li key={par.maquina} className="cf-par">
                <p className="cf-maquina">
                  <span className="sr-only">{conferencia.plataforma}: </span>
                  {par.maquina}
                </p>
                <span className="cf-traco" aria-hidden="true">
                  <i />
                  <svg
                    className="cf-visto"
                    viewBox="0 0 14 11"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path className="percurso" pathLength={1} d="M1 5.5l3.5 3.5l8 -8.5" />
                  </svg>
                </span>
                <p className="cf-pessoa">
                  <span className="sr-only">{conferencia.pessoa}: </span>
                  {par.pessoa}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="cf-saida" aria-hidden="true">
        <span className="cf-veu" />
      </div>
    </section>
  )
}
