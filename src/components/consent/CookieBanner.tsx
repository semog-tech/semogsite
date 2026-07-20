'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useConsent } from '@/providers/ConsentProvider'

/**
 * Banner LGPD fixo no rodapé — só renderiza enquanto o usuário não decidiu
 * (`!decided`). Não é um modal bloqueante (o resto da página continua
 * navegável), então usamos `role="dialog"` sem `aria-modal`, mas movemos o
 * foco pra ele no mount para leitores de tela notarem a região dinâmica.
 * Entrada anima com slide-up; `motion-reduce:` desliga a transição.
 */
export function CookieBanner() {
  const { consent, decided, acceptAll, rejectNonEssential, save } = useConsent()
  const [showPreferences, setShowPreferences] = useState(false)
  const [analytics, setAnalytics] = useState(consent.analytics)
  const [marketing, setMarketing] = useState(consent.marketing)
  const [entered, setEntered] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const headingId = useId()
  const descId = useId()

  // Mantém os toggles locais sincronizados caso o consentimento externo mude
  // (ex.: outra aba) antes de o usuário decidir nesta.
  useEffect(() => {
    setAnalytics(consent.analytics)
    setMarketing(consent.marketing)
  }, [consent])

  useEffect(() => {
    if (decided) return
    // Um frame depois do mount, dispara a transição de entrada.
    const raf = requestAnimationFrame(() => setEntered(true))
    // Brief focus blip on mount accepted to keep route on ISR (no SSR cookie read).
    containerRef.current?.focus()
    return () => cancelAnimationFrame(raf)
  }, [decided])

  if (decided) return null

  const handleSave = () => {
    save({ analytics, marketing })
  }

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-labelledby={headingId}
      aria-describedby={descId}
      tabIndex={-1}
      className={`fixed inset-x-0 bottom-0 z-50 px-[clamp(1rem,4vw,1.5rem)] pb-[clamp(1rem,3vw,1.5rem)] outline-none transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
        entered ? 'translate-y-0' : 'translate-y-[110%]'
      }`}
    >
      <div className="mx-auto max-w-[42rem] rounded-card border border-white/10 bg-navy-950/70 p-[clamp(1.25rem,3vw,1.75rem)] shadow-card backdrop-blur-xl">
        <h2 id={headingId} className="mb-2 text-[1.05rem] font-semibold text-fg">
          Sua privacidade
        </h2>
        <p id={descId} className="mb-4 text-[0.92rem] leading-relaxed text-fg-2">
          Usamos cookies necessários para o funcionamento do site e, mediante sua autorização,
          cookies de análise e marketing para melhorar sua experiência. Saiba mais na nossa{' '}
          <a href="/privacidade" className="text-fg underline underline-offset-2 hover:text-accent">
            Política de Privacidade
          </a>
          .
        </p>

        {showPreferences && (
          <div className="mb-4 space-y-3 rounded-input border border-line bg-navy-900/60 p-4">
            <ToggleRow
              label="Cookies necessários"
              description="Sempre ativos — essenciais para o funcionamento do site."
              checked
              disabled
            />
            <ToggleRow
              label="Cookies de análise"
              description="Ajudam a entender como o site é usado, de forma agregada."
              checked={analytics}
              onChange={setAnalytics}
            />
            <ToggleRow
              label="Cookies de marketing"
              description="Usados para personalizar comunicações e anúncios."
              checked={marketing}
              onChange={setMarketing}
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" size="sm" onClick={acceptAll}>
              Aceitar todos
            </Button>
            <Button variant="ghost" size="sm" onClick={rejectNonEssential}>
              Só necessários
            </Button>
            {showPreferences && (
              <Button variant="glass" size="sm" onClick={handleSave}>
                Salvar preferências
              </Button>
            )}
          </div>
          {!showPreferences && (
            <button
              type="button"
              onClick={() => setShowPreferences(true)}
              className="text-[0.88rem] font-medium text-fg-2 underline underline-offset-2 transition-colors duration-200 hover:text-fg"
            >
              Preferências
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  disabled?: boolean
  onChange?: (value: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[0.9rem] font-medium text-fg">{label}</p>
        <p className="text-[0.82rem] text-fg-3">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-pill border transition-colors duration-200 motion-reduce:transition-none ${
          checked ? 'border-ice-400 bg-ice-400' : 'border-line-strong bg-navy-800'
        } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200 motion-reduce:transition-none ${
            checked ? 'translate-x-[1.375rem]' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )
}
