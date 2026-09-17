'use client'

import { useState } from 'react'
import { IntroAberto, IntroEsgotado } from '@/components/experience/ExperienceSignupIntro'
import { ExperienceForm } from '@/components/forms/ExperienceForm'

/**
 * A seção de inscrição no estado ABERTO — as duas colunas, e o estado que as
 * mantém coerentes entre si.
 *
 * Por que isto é client: a lotação pode ser descoberta no meio do caminho. A
 * página é servida com ISR (até 60s de atraso em relação ao banco), então
 * alguém pode estar preenchendo o formulário quando a última vaga é tomada por
 * outra pessoa — e quem descobre isso é a resposta da Server Action, já no
 * browser.
 *
 * Quando isso acontece, o formulário sozinho não basta trocar. Enquanto o card
 * dizia "sua inscrição não foi registrada", a coluna ao lado seguia anunciando
 * "Garanta a sua vaga" e o total de vagas: as duas metades da tela discordando no
 * exato momento em que a pessoa mais precisa entender o que houve. O estado
 * mora aqui, acima das duas colunas, porque é das duas que ele é dono.
 */
export function ExperienceSignupAberto() {
  const [lotou, setLotou] = useState(false)

  return (
    <div className="grid">
      {lotou ? <IntroEsgotado recemRecusado /> : <IntroAberto />}

      <div className="card">
        <ExperienceForm onLotacao={() => setLotou(true)} />
      </div>
    </div>
  )
}
