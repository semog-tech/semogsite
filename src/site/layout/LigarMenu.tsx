'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { iniciarMenu } from '@/site/core/cabecalho'

/** Liga o menu do cabeçalho. Independe do runner: funciona mesmo se o movimento falhar. */
export function LigarMenu() {
  useEffect(() => {
    try {
      return iniciarMenu()
    } catch (erro) {
      console.error('[menu] não ligou.', erro)
      Sentry.captureException(erro, { tags: { origem: 'menu' } })
      return undefined
    }
  }, [])
  return null
}
