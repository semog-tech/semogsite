import { conteudo } from '@/site/conteudo/conteudo'
import { comChaves } from './chaves'

/*
 * A folha do mês do protótipo (02-mes.html), gerada da mesma geometria: casas de 100 × 88, linhas
 * a cada 106, o dia 1 na quinta coluna. O relógio de dias (data-c) é o da cena: numa semana uma
 * casa vale um dia; cada virada de semana vale meio.
 */
const LARGURA_CASA = 100
const ALTURA_CASA = 88
const PASSO_LINHA = 106
const TOPO = 40
const DIAS_NO_MES = 30
const COLUNA_DO_DIA_1 = 3
/** Relógio no começo de cada linha (a coluna 0), de modo que a casa vale `inicio + coluna + 0,5`. */
const INICIO_DA_LINHA = [-3, 4.5, 12, 19.5, 27] as const
/** Até onde a grade vai em cada linha: a primeira começa no dia 1, a última termina no dia 30. */
const DIVISORIAS = [
  [300, 400, 500, 600],
  [100, 200, 300, 400, 500, 600],
  [100, 200, 300, 400, 500, 600],
  [100, 200, 300, 400, 500, 600],
  [100, 200, 300, 400, 500],
] as const

/** O traço do mês, peça por peça: semanas e viradas, cada uma com o trecho do relógio que cobre. */
const TRACOS = [
  ['semana', 0, 4, 'M300 102H700'],
  ['virada', 4, 4.5, 'M700 102H712V137H-12V208H0'],
  ['semana', 4.5, 11.5, 'M0 208H700'],
  ['virada', 11.5, 12, 'M700 208H712V243H-12V314H0'],
  ['semana', 12, 19, 'M0 314H700'],
  ['virada', 19, 19.5, 'M700 314H712V349H-12V420H0'],
  ['semana', 19.5, 26.5, 'M0 420H700'],
  ['virada', 26.5, 27, 'M700 420H712V455H-12V526H0'],
  ['semana', 27, 34.24, 'M0 526H724'],
] as const

type Rotulos = typeof conteudo.tecnologia.pagina.mes.calendario
type Casa = { dia: number; rotulo: Exclude<keyof Rotulos, 'convencao' | 'regras' | 'seguinte'> }

const CASAS_LEVES: readonly Casa[] = [
  { dia: 13, rotulo: 'lembrete' },
  { dia: 17, rotulo: 'lembrete' },
  { dia: 21, rotulo: 'lembrete' },
]
const CASAS_FORTES: readonly Casa[] = [
  { dia: 1, rotulo: 'boleto' },
  { dia: 10, rotulo: 'vencimento' },
  { dia: 23, rotulo: 'acordo' },
  { dia: 26, rotulo: 'assembleia' },
  { dia: 30, rotulo: 'prestacao' },
]
/** Onde cada regra da convenção fica (vencimento, multa, juros, quórum): o visto e o texto. */
const REGRAS = [
  [12, 89],
  [156, 89],
  [12, 111],
  [156, 111],
] as const

const DIAS = Array.from({ length: DIAS_NO_MES }, (_, i) => i + 1)

function posicao(dia: number) {
  const casa = dia - 1 + COLUNA_DO_DIA_1
  const linha = Math.floor(casa / 7)
  const coluna = casa % 7
  return {
    x: coluna * LARGURA_CASA,
    y: TOPO + linha * PASSO_LINHA,
    c: (INICIO_DA_LINHA[linha] ?? Number.NaN) + coluna + 0.5,
  }
}

function CasaDoMes({ casa, forca }: { casa: Casa; forca: 'leve' | 'forte' }) {
  const { x, y, c } = posicao(casa.dia)
  return (
    <g className={`ms-celula ms-celula--${forca}`} data-dia={casa.dia} data-c={c}>
      <rect className="ms-celula-fundo" x={x} y={y} width={LARGURA_CASA} height={ALTURA_CASA} />
      <text className="ms-celula-dia" x={x + 12} y={y + 28}>
        {casa.dia}
      </text>
      <text className="ms-celula-rotulo" x={x + 12} y={y + 48}>
        {conteudo.tecnologia.pagina.mes.calendario[casa.rotulo]}
      </text>
    </g>
  )
}

function Quadricula() {
  return (
    <g className="ms-quadricula">
      {DIVISORIAS.map((linha, i) => {
        const y = TOPO + i * PASSO_LINHA
        return [
          <rect key={`linha-${y}`} x="0" y={y} width="700" height={ALTURA_CASA} />,
          ...linha.map((x) => <path key={`${x}-${y}`} d={`M${x} ${y}V${y + ALTURA_CASA}`} />),
        ]
      })}
    </g>
  )
}

function Convencao() {
  const { convencao, regras } = conteudo.tecnologia.pagina.mes.calendario
  return (
    <g className="ms-conv">
      <text className="ms-conv-titulo" x="12" y="68">
        {convencao}
      </text>
      {REGRAS.map(([x, y], i) => (
        <g key={regras[i]} className="ms-regra" data-regra={i}>
          <path className="ms-visto percurso" pathLength={1} d={`M${x} ${y}l3.5 3.5l6.5 -7.5`} />
          <text x={x + 16} y={y + 5}>
            {regras[i]}
          </text>
        </g>
      ))}
      <rect className="ms-conv-leitura" x="0" y="40" width="3" height={ALTURA_CASA} />
    </g>
  )
}

/** O calendário do mês: semana, grade, dias, casas que abrem, o traço, os nós e o mês seguinte. */
export function CalendarioDoMes() {
  const { mes } = conteudo.tecnologia.pagina
  return (
    <svg className="ms-calendario" viewBox="-24 0 760 556" aria-hidden="true" focusable="false">
      <g className="ms-semana">
        {comChaves(mes.semana).map((letra, i) => (
          <text key={letra.chave} x={12 + i * LARGURA_CASA} y="24">
            {letra.valor}
          </text>
        ))}
      </g>
      <rect className="ms-conv-fundo" x="0" y="40" width="300" height={ALTURA_CASA} />
      <Quadricula />
      <g className="ms-dias">
        {DIAS.map((dia) => {
          const { x, y } = posicao(dia)
          return (
            <text key={dia} x={x + 12} y={y + 28}>
              {dia}
            </text>
          )
        })}
      </g>
      {CASAS_LEVES.map((casa) => (
        <CasaDoMes key={casa.dia} casa={casa} forca="leve" />
      ))}
      {TRACOS.map(([tipo, c0, c1, d]) => (
        <path
          key={d}
          className={`ms-traco ms-traco--${tipo} percurso`}
          pathLength={1}
          data-c0={c0}
          data-c1={c1}
          d={d}
        />
      ))}
      <g className="ms-nos">
        {DIAS.map((dia) => {
          const { x, y, c } = posicao(dia)
          return (
            <rect
              key={dia}
              className="ms-no"
              data-dia={dia}
              data-c={c}
              x={x + 46}
              y={y + 58}
              width="8"
              height="8"
            />
          )
        })}
      </g>
      {CASAS_FORTES.map((casa) => (
        <CasaDoMes key={casa.dia} casa={casa} forca="forte" />
      ))}
      <Convencao />
      <g className="ms-seguinte" data-c="34.24">
        <rect className="ms-seguinte-fundo" x="500" y="464" width="200" height={ALTURA_CASA} />
        <text className="ms-seguinte-rotulo" x="512" y="492">
          {mes.calendario.seguinte}
        </text>
      </g>
    </svg>
  )
}
