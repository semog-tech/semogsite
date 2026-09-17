import { CheckIcon } from '@/components/experience/icones'
import { EXPERIENCE_EVENT as E } from '@/data/experienceEvent'

/**
 * "Onde e quando" — data, horário e endereço completo, mais a nota de chegada e
 * de retirada do kit.
 *
 * Vive à parte porque aparece em dois lugares que a pessoa trata como o mesmo
 * papel: a confirmação logo depois de enviar o formulário (`ExperienceForm`,
 * `status === 'success'`) e o card da seção de inscrição quando as vagas
 * esgotam, onde ela serve a quem já está inscrito e voltou só para conferir o
 * endereço. Duplicar o endereço nos dois é a forma mais fácil de, num ajuste
 * futuro, corrigir um e deixar o outro mandando gente para o lugar errado num
 * sábado de manhã.
 *
 * Não leva estado nem hook — roda igual no server component da seção e no
 * client component do formulário.
 */

export function ExperienceAgenda() {
  return (
    <>
      {/* biome-ignore lint/a11y/noRedundantRoles: redundante no papel, necessário na prática — com `list-style: none` o Safari/VoiceOver descarta a semântica de lista */}
      <ul className="facts" role="list">
        <li>
          <CheckIcon /> {E.dateLabel}, {E.weekday}
        </li>
        <li>
          <CheckIcon /> Das {E.timeLabel}
        </li>
        <li>
          <CheckIcon />
          {/* Três papéis em três linhas, como no painel da programação: o
              nome diz qual é o lugar, o endereço diz onde fica, o ponto de
              referência é o que resolve na chegada. Corrida, esta seria uma
              linha de 120 caracteres onde se procura uma avenida — e é a
              tela que a pessoa fecha levando o endereço. */}
          <span className="fact-local">
            {E.venue}
            <span className="fact-endereco">
              {E.street}
              <br />
              {E.district} — {E.city}, {E.uf}
            </span>
            <em className="fact-ref">{E.venueReference}</em>
          </span>
        </li>
      </ul>
      <p className="formnote">
        Chegue 15 minutos antes. Leve roupa leve, garrafa de água e disposição — o resto é com a
        gente. O kit praia é retirado na filial de {E.city} a partir de {E.kit.pickup.fromDateLabel}
        : não há entrega no dia do evento.
      </p>
    </>
  )
}
