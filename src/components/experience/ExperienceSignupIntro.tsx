import { CheckIcon, InfoIcon } from '@/components/experience/icones'
import { EXPERIENCE_EVENT as E } from '@/data/experienceEvent'

/**
 * A coluna de texto da seção `#inscricao` — a metade que fica ao lado do card.
 *
 * Vive em arquivo próprio, sem `'use client'`, porque é usada dos dois lados:
 * pelo server component que decide o estado da página (`ExperienceSignup`) e
 * pelo client component que reage à lotação descoberta no envio
 * (`ExperienceSignupAberto`). É JSX puro, então funciona nos dois.
 */

/**
 * O que a pessoa leva do evento. Fica aqui (e não em `experienceEvent.ts`) de
 * propósito: é copy de venda da seção de inscrição, não dado operacional do
 * evento — o que é dado (data, horário, local, vagas) continua vindo de
 * `EXPERIENCE_EVENT`.
 */
const BENEFICIOS = [
  'Pilates, yoga e treino funcional com profissionais',
  'Avaliação física individual sem custo',
  'Café da manhã, água e água de coco durante toda a manhã',
  'Kit praia, retirado antes na filial de João Pessoa',
]

export function IntroAberto() {
  return (
    <div className="intro">
      <span className="eyebrow">Inscrição</span>
      <h2 className="sec-title">Garanta a sua vaga</h2>
      <p style={{ marginTop: '1.1rem' }}>
        São {E.seats} vagas e a inscrição é gratuita. Leve roupa leve, garrafa de água e disposição
        — o resto é com a gente.
      </p>
      {/* biome-ignore lint/a11y/noRedundantRoles: redundante no papel, necessário na prática — com `list-style: none` o Safari/VoiceOver descarta a semântica de lista */}
      <ul className="facts" role="list">
        {BENEFICIOS.map((beneficio) => (
          <li key={beneficio}>
            <CheckIcon />
            {beneficio}
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * A mesma coluna depois que as vagas acabam.
 *
 * `recemRecusado` distingue os dois caminhos que chegam aqui, e a diferença não
 * é cosmética. Quando a página já carrega esgotada, quem lê provavelmente já se
 * inscreveu e o texto pode dizer "se você garantiu a sua, está tudo certo".
 * Quando a vaga acabou DURANTE o envio, essa mesma frase apareceria ao lado de
 * um aviso dizendo que a inscrição não foi registrada — as duas metades da tela
 * se contradizendo no momento em que a pessoa mais precisa de clareza.
 */
export function IntroEsgotado({ recemRecusado = false }: { recemRecusado?: boolean }) {
  return (
    <div className="intro">
      <span className="eyebrow">Inscrições encerradas</span>
      <h2 className="sec-title">
        As {E.seats} vagas <em>acabaram</em>
      </h2>
      <p style={{ marginTop: '1.1rem' }}>
        {recemRecusado
          ? 'A procura foi maior do que a gente esperava e a última vaga foi preenchida agora há pouco, enquanto você preenchia o formulário.'
          : 'A procura foi maior do que a gente esperava e as inscrições fecharam antes do sábado. Se você garantiu a sua, está tudo certo — é só aparecer.'}
      </p>
      {/* biome-ignore lint/a11y/noRedundantRoles: redundante no papel, necessário na prática — com `list-style: none` o Safari/VoiceOver descarta a semântica de lista */}
      <ul className="facts facts-neutro" role="list">
        <li>
          <InfoIcon />
          Quem se inscreveu recebeu a confirmação por e-mail, com data, horário e endereço.
        </li>
        <li>
          <InfoIcon />
          Não há inscrição no dia, na praia. A lista fechou com as {E.seats} vagas.
        </li>
        <li>
          <InfoIcon />O {E.series} é anual: a próxima edição abre inscrição nesta mesma página.
        </li>
      </ul>
    </div>
  )
}
