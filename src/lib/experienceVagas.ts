import 'server-only'

import { cache } from 'react'
import { query } from '@/lib/db'
import { estadoDaInscricao } from '@/lib/experienceEstado'
import { validarLotacaoExperience } from '@/lib/experienceLotacao'

/** A capacidade e a contagem pertencem ao banco e são compartilhadas com o app. */
export const lerEstadoDaInscricao = cache(async () => {
  let lotacao = null
  if (process.env.DATABASE_URI) {
    try {
      const { rows } = await query('select * from cms.experience_lotacao()')
      lotacao = validarLotacaoExperience(rows[0])
    } catch (err) {
      console.error('[experience] falha ao consultar a lotação:', err)
    }
  }
  return {
    estado: estadoDaInscricao(new Date(), lotacao?.pessoas ?? null, lotacao?.capacidade ?? null),
    capacidade: lotacao?.capacidade ?? null,
  }
})
