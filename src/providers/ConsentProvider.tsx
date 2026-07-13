'use client'

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  type Consent,
  type ConsentCategory,
  defaultConsent,
  getConsent,
  setConsent as persistConsent,
} from '@/lib/consent'

type ConsentContextValue = {
  /** Estado atual (só reflete uma decisão real depois que `decided` for `true`). */
  consent: Consent
  /** `true` assim que o usuário já escolheu (aceitar tudo, só necessários ou salvar preferências). */
  decided: boolean
  /** Aceita tudo — alias de `acceptAll`, mantido para compatibilidade de interface. */
  accept: () => void
  acceptAll: () => void
  rejectNonEssential: () => void
  /** Salva escolhas granulares (ex.: toggles do painel de Preferências). `necessary` é sempre forçado a `true`. */
  save: (partial: Partial<Record<ConsentCategory, boolean>>) => void
}

const ConsentContext = createContext<ConsentContextValue | null>(null)

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsentState] = useState<Consent>(defaultConsent)
  const [decided, setDecided] = useState(false)

  // Cookies só existem no browser — a leitura acontece no mount, no client.
  useEffect(() => {
    const stored = getConsent()
    if (stored) {
      setConsentState(stored)
      setDecided(true)
    }
  }, [])

  const commit = useCallback((next: Consent) => {
    persistConsent(next)
    setConsentState(next)
    setDecided(true)
  }, [])

  const acceptAll = useCallback(
    () => commit({ necessary: true, analytics: true, marketing: true }),
    [commit],
  )

  const rejectNonEssential = useCallback(
    () => commit({ necessary: true, analytics: false, marketing: false }),
    [commit],
  )

  const save = useCallback((partial: Partial<Record<ConsentCategory, boolean>>) => {
    setConsentState((prev) => {
      const next: Consent = { ...prev, ...partial, necessary: true }
      persistConsent(next)
      return next
    })
    setDecided(true)
  }, [])

  const value = useMemo<ConsentContextValue>(
    () => ({
      consent,
      decided,
      accept: acceptAll,
      acceptAll,
      rejectNonEssential,
      save,
    }),
    [consent, decided, acceptAll, rejectNonEssential, save],
  )

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext)
  if (!ctx) throw new Error('useConsent must be used within a <ConsentProvider>.')
  return ctx
}
