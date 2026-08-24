import { img } from '@/../content/media'
import { EXPERIENCE_EVENT as E } from '@/data/experienceEvent'
import { ExperienceProgramTabs, type ProgramItem } from './ExperienceProgramTabs'

/**
 * Programação da manhã + painel da atividade — porte da
 * `<section class="program s-white">` do protótipo aprovado, agora
 * INTERATIVA: escolher um horário troca a foto e mostra quem conduz
 * (pedido do cliente em 24/08/2026).
 *
 * A divisão server/client é o ponto deste arquivo. Aqui, no servidor,
 * `img()` resolve filename -> `{url, alt, width, height}` para CADA atividade,
 * e o resultado (JSON puro) desce para o componente client. Fazer o `img()`
 * lá dentro arrastaria os três mapas de `content/media.ts` — o site inteiro,
 * não só o evento — para dentro do bundle do navegador.
 *
 * Atividade sem foto própria (recepção, encerramento) cai na foto do LOCAL,
 * que é a que a seção mostrava antes de existir painel.
 */
export function ExperienceProgram() {
  const local = img('experience-local.webp')

  const items: ProgramItem[] = E.schedule.map((item) => ({
    time: item.time,
    endTime: item.endTime,
    label: item.label,
    text: item.text,
    professional: item.professional,
    media: item.image ? img(item.image) : local,
  }))

  return (
    <ExperienceProgramTabs
      city={E.city}
      items={items}
      ongoing={E.ongoing}
      uf={E.uf}
      venue={E.venue}
      venueNote={E.venueConfirmed ? undefined : E.venueNote}
    />
  )
}
