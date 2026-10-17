import './historia.css'
import { conteudo } from '@/site/conteudo/conteudo'
import { comVariaveis } from '@/site/estilo'

/** O tick do eixo de cada marco (dois marcos no mesmo ano dividem o tick), como no protótipo. */
const TICK_DO_MARCO = [0, 1, 2, 3, 3, 4, 5, 5, 6, 7] as const
/** O marco que abre a foto do palco do G20. */
const MARCO_DA_FOTO = 8
/** Posição de cada ano no eixo (0 a 1): proporcional aos anos, com folga mínima entre vizinhos. */
const TICKS = [
  { x: 0, ano: '1991' },
  { x: 0.217, ano: '2000' },
  { x: 0.314, ano: '2004' },
  { x: 0.676, ano: '2019' },
  { x: 0.772, ano: '2023' },
  { x: 0.848, ano: '2025' },
  { x: 0.924, ano: '2026' },
] as const

/** O caminho da costa, de Belém ao Recife; a rota marinho anda sobre o mesmo traço. */
const COSTA =
  'M30 104C150 98 260 126 370 146C460 162 540 172 580 200C608 220 614 256 608 296C602 336 590 384 572 450'

/** Nós e rótulos das Unidades no esquema, na ordem do protótipo (sem escala nem geografia precisa). */
const CIDADES = [
  { id: 'recife', no: { x: 593.5, y: 335.4 }, lado: 'direita', x: 599.5, y: 341.4 },
  { id: 'joao-pessoa', no: { x: 601.9, y: 239.5 }, lado: 'direita', x: 607.9, y: 245.5 },
  { id: 'belem', no: { x: 146.8, y: 102.4 }, lado: 'abaixo', x: 152.8, y: 108.4 },
  { id: 'campina-grande', no: { x: 494, y: 246 }, lado: 'esquerda', x: 500, y: 252 },
] as const

function unidade(id: string) {
  const achada = conteudo.unidades.find((u) => u.id === id)
  if (!achada) throw new Error(`[história] Unidade ausente no conteúdo: ${id}`)
  return achada
}

function Contadores() {
  const { contadores } = conteudo.aSemog.historia
  return (
    // biome-ignore lint/a11y/noAriaHiddenOnFocusable: a lista não tem tabindex nem filho focável (o Biome trata <dl> como interativo); os rolos são decorativos e os marcos dizem o mesmo por extenso
    <dl className="hist-contadores" aria-hidden="true">
      <div className="hist-contador">
        <dt className="rotulo">{contadores.unidades}</dt>
        <dd className="num">
          <span className="hist-rolo" data-rolo="unidades">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
          </span>
        </dd>
      </div>
      <div className="hist-contador">
        <dt className="rotulo">{contadores.estados}</dt>
        <dd className="num">
          <span className="hist-rolo" data-rolo="estados">
            <span>1</span>
            <span>2</span>
            <span>3</span>
          </span>
        </dd>
        <dd className="hist-ufs rotulo">
          <span className="hist-rolo" data-rolo="ufs">
            <span>PE</span>
            <span>PE · PB</span>
            <span>PE · PB · PA</span>
          </span>
        </dd>
      </div>
    </dl>
  )
}

function Marcos() {
  return (
    <ol className="hist-marcos">
      {conteudo.aSemog.historia.marcos.map((marco, i) => (
        <li
          key={marco.titulo}
          className="hist-marco"
          data-tick={TICK_DO_MARCO[i]}
          data-foto={i === MARCO_DA_FOTO ? '' : undefined}
        >
          <p className="hist-marco-data">{marco.data}</p>
          <h3 className="hist-marco-titulo">
            <span className="hist-in">{marco.titulo}</span>
          </h3>
          <p className="hist-marco-texto">
            <span className="hist-in">{marco.texto}</span>
          </p>
        </li>
      ))}
    </ol>
  )
}

/** A linha da costa de Belém ao Recife: só a ordem das Unidades no eixo da costa. */
function Mapa() {
  return (
    <figure className="hist-mapa">
      <div className="hist-mapa-caixa">
        <svg className="hist-mapa-svg" viewBox="0 0 760 460" aria-hidden="true" focusable="false">
          <path className="hist-costa percurso" d={COSTA} />
          <path className="hist-rota percurso" d={COSTA} />
          <path className="hist-ramal percurso" d="M607.9 245.5C575 238 535 244 500 252" />
          {CIDADES.map((cidade) => (
            <rect
              key={cidade.id}
              className="hist-no"
              data-no={cidade.id}
              x={cidade.no.x}
              y={cidade.no.y}
              width="12"
              height="12"
            />
          ))}
        </svg>
        {CIDADES.map((cidade) => {
          const { cidade: nome, uf } = unidade(cidade.id)
          return (
            <p
              key={cidade.id}
              className={`hist-cidade hist-cidade--${cidade.lado}`}
              data-cidade={cidade.id}
              style={comVariaveis({ '--x': cidade.x, '--y': cidade.y })}
            >
              <span className="hist-cidade-mascara">
                <span className="hist-cidade-in">
                  <strong>{nome}</strong> <span className="hist-uf">{uf}</span>
                </span>
              </span>
            </p>
          )
        })}
      </div>
      <figcaption className="hist-esquema rotulo">
        <span>{conteudo.aSemog.historia.esquema}</span>
      </figcaption>
    </figure>
  )
}

function Eixo({ hoje }: { hoje: string }) {
  return (
    <div className="hist-eixo" aria-hidden="true">
      <div className="hist-eixo-linha">
        <span className="hist-eixo-trilho" />
        <span className="hist-eixo-traco" />
      </div>
      <ol className="hist-ticks">
        {[...TICKS, { x: 1, ano: hoje }].map((tick) => (
          <li key={tick.ano} style={comVariaveis({ '--x': tick.x })}>
            <i />
            <span>{tick.ano}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

/**
 * História (A Semog), a cena-assinatura. Sem JS é a lista ordenada dos marcos, com o esquema das
 * Unidades e a foto do G20; com JS, o palco fica fixo e a rolagem percorre os 35 anos pelo eixo.
 */
export function Historia() {
  const { historia } = conteudo.aSemog
  const hoje = historia.marcos[historia.marcos.length - 1].data
  const { ranking } = conteudo
  return (
    <section id="historia" className="cena" data-tema="claro" aria-labelledby="historia-titulo">
      <div className="hist-palco">
        <div className="container hist-grade">
          <h2 id="historia-titulo" className="hist-titulo">
            {historia.titulo}
          </h2>
          <Contadores />
          <div className="hist-ano num" aria-hidden="true">
            <span className="hist-ano-numero">{historia.marcos[0].data}</span>
            <span className="hist-ano-hoje">{hoje}</span>
          </div>
          <Marcos />
          <Mapa />
          <figure className="hist-foto">
            <div className="moldura">
              {/* biome-ignore lint/performance/noImgElement: a cena anima moldura e zoom no próprio <img>, e /site-v2 fica fora do localPatterns do next/image */}
              <img
                src={ranking.foto}
                alt={ranking.alt}
                width={1600}
                height={900}
                loading="lazy"
                decoding="async"
              />
            </div>
          </figure>
          <Eixo hoje={hoje} />
        </div>
        <div className="hist-cobertura" aria-hidden="true" />
      </div>
    </section>
  )
}
