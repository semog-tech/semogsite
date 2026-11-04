'use client'

import Script from 'next/script'
import { useEffect, useRef, useState } from 'react'
import { getConsent } from '@/lib/consent'
import { useConsent } from '@/providers/ConsentProvider'
import { MEASURABLE_HOST } from './measurableHost'

const SCRIPT_URL = process.env.NEXT_PUBLIC_RD_TRACKING_SCRIPT_URL
const LOADER_URL =
  /^https:\/\/d335luupugsy2\.cloudfront\.net\/js\/loader-scripts\/[a-zA-Z0-9-]+-loader\.js$/

/** Mesmo host e preferências das tags existentes; sem banner adicional. */
export function RDStation() {
  const { consent, decided } = useConsent()
  const [enabled, setEnabled] = useState(false)
  const loaded = useRef(false)

  useEffect(() => {
    const stored = decided ? consent : getConsent()
    const allowed = !stored || (stored.analytics && stored.marketing)
    // Remover a tag não encerra os listeners de um script já executado.
    if (!allowed && loaded.current) {
      window.location.reload()
      return
    }
    const next = allowed && MEASURABLE_HOST.test(window.location.hostname)
    setEnabled(next)
    if (next && SCRIPT_URL && LOADER_URL.test(SCRIPT_URL)) loaded.current = true
  }, [consent, decided])

  if (!SCRIPT_URL || !LOADER_URL.test(SCRIPT_URL) || !enabled) return null

  return <Script id="rd-station-tracking" src={SCRIPT_URL} strategy="lazyOnload" />
}
