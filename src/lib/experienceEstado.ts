import { EXPERIENCE_EVENT as E } from '@/data/experienceEvent'

/**
 * Em que ponto da vida a inscrição do Semog Experience está. É o que a landing
 * inteira consulta para decidir o que mostrar — hero, faixa, seção de
 * inscrição, kit, patrocinadores e o dado estruturado.
 *
 * A regra vive AQUI, pura, e a leitura do banco vive em `experienceVagas.ts`:
 * assim o teste exercita os três estados (e a virada de fuso) sem `server-only`
 * e sem mock de `pg`, e quem lê a regra não precisa entender o pool.
 *
 * - `aberto`    — o de sempre: formulário na tela.
 * - `esgotado`  — as {seats} vagas foram preenchidas. Vira sozinho.
 * - `encerrado` — o dia do evento já passou. **Tem precedência**: passado o
 *                 sábado, quantas vagas sobraram deixou de importar.
 */
export type EstadoDaInscricao = 'aberto' | 'esgotado' | 'encerrado'

/**
 * Fuso do evento, não o do servidor. A Vercel roda em UTC e Recife é UTC-3: à
 * meia-noite do dia 27 em UTC ainda são 21h do dia 26 na Paraíba, com o evento
 * recém-acontecido. Decidir pelo relógio do servidor mostraria "a edição já
 * aconteceu" três horas cedo para todo mundo.
 */
const FUSO_DO_EVENTO = 'America/Recife'

/**
 * A data civil (`YYYY-MM-DD`) que está valendo em Recife no instante dado.
 *
 * `formatToParts` e não `format`: o formato depende do locale (pt-BR devolve
 * `26/09/2026`, en-CA devolve `2026-09-26`) e montar a string a partir das
 * partes não depende de qual locale o runtime resolveu. O resultado sai no
 * mesmo formato ISO de `EXPERIENCE_EVENT.date`, então a comparação é de string
 * — que em ISO ordena igual à cronologia.
 */
function dataCivilEmRecife(agora: Date): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO_DO_EVENTO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(agora)
  const parte = (tipo: Intl.DateTimeFormatPartTypes) =>
    partes.find((p) => p.type === tipo)?.value ?? ''
  return `${parte('year')}-${parte('month')}-${parte('day')}`
}

/**
 * O dia do evento já ficou para trás? Vira à meia-noite do dia seguinte, no
 * fuso de Recife — o sábado INTEIRO ainda é "vai acontecer", inclusive depois
 * das 10h. É deliberado: quem abre a página no sábado à tarde procurando o
 * endereço deve encontrar a página do evento, não um agradecimento.
 */
export function eventoJaAconteceu(agora: Date): boolean {
  return dataCivilEmRecife(agora) > E.date
}

/**
 * A regra dos três estados.
 *
 * `inscritos === null` significa **não foi possível contar** (banco fora do ar,
 * `DATABASE_URI` ausente no build). Nesse caso o estado cai para `aberto`, o de
 * hoje: fechar a inscrição por erro de leitura perderia inscrição real, e o
 * excesso já está barrado onde importa — na trava atômica do INSERT, em
 * `submit-form.ts`. Uma página que mostra o formulário a mais recusa na hora do
 * envio; uma que esconde o formulário a menos não recusa nada, só perde gente.
 */
export function estadoDaInscricao(agora: Date, inscritos: number | null): EstadoDaInscricao {
  if (eventoJaAconteceu(agora)) return 'encerrado'
  if (inscritos !== null && inscritos >= E.seats) return 'esgotado'
  return 'aberto'
}
