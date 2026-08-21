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
 *
 * **Barra fina, não card** (30/07/2026): a versão anterior era um card de
 * 42rem com título, parágrafo de quatro linhas e três ações — ~430px de altura
 * no celular, quase metade da tela, bem em cima do CTA do hero. Todo visitante
 * novo via isso antes de ver o site. Agora:
 *
 * - o texto foi para uma frase (o detalhamento vive na Política de
 *   Privacidade, que continua linkada — é o que a LGPD pede);
 * - o título virou `sr-only`: dizia o óbvio pra quem enxerga e continua
 *   nomeando o diálogo pra quem usa leitor de tela;
 * - no desktop tudo cabe em uma linha; no celular, texto em cima e as ações
 *   numa fileira só.
 *
 * O painel de preferências (opt-in por toggle) continua igual — quem clica em
 * "Preferências" está pedindo a versão detalhada, e aí o espaço se justifica.
 */
export function CookieBanner() {
  const { consent, decided, rejectNonEssential, save } = useConsent()
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

  /**
   * Publica a altura da barra em `--consent-bar-h` enquanto ela está no ar.
   * A barra é `position: fixed` e não ocupa espaço no fluxo — num hero de
   * `100svh` com conteúdo alinhado ao rodapé (a landing do Experience é o
   * caso), ela cobria justamente a última linha acima da dobra. Quem quiser
   * reservar o espaço soma a variável ao seu `padding-bottom`; quem não usar
   * não muda em nada. Some no `decided` (o componente desmonta) e acompanha a
   * quebra de linha do texto em telas estreitas via `ResizeObserver`.
   */
  useEffect(() => {
    if (decided) return
    const el = containerRef.current
    if (!el) return
    const root = document.documentElement
    const publicar = () =>
      root.style.setProperty('--consent-bar-h', `${Math.round(el.offsetHeight)}px`)
    publicar()
    const observer = new ResizeObserver(publicar)
    observer.observe(el)
    return () => {
      observer.disconnect()
      root.style.removeProperty('--consent-bar-h')
    }
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
      <div className="mx-auto max-w-[64rem] rounded-card border border-white/10 bg-navy-950/80 px-[clamp(1rem,2.5vw,1.5rem)] py-[clamp(0.85rem,2vw,1.1rem)] shadow-card backdrop-blur-xl">
        <h2 id={headingId} className="sr-only">
          Sua privacidade
        </h2>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <p id={descId} className="m-0 text-[0.86rem] leading-snug text-fg-2">
            Cookies de análise — agregados e sem publicidade — para melhorar o site.{' '}
            <a
              href="/privacidade"
              className="text-fg underline underline-offset-2 hover:text-accent"
            >
              Política de Privacidade
            </a>
            .
          </p>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => save({ analytics: true, marketing: false })}
            >
              Entendi
            </Button>
            <Button variant="ghost" size="sm" onClick={rejectNonEssential}>
              Recusar
            </Button>
            {showPreferences ? (
              <Button variant="glass" size="sm" onClick={handleSave}>
                Salvar
              </Button>
            ) : (
              <button
                type="button"
                onClick={() => setShowPreferences(true)}
                className="px-1 text-[0.84rem] font-medium text-fg-2 underline underline-offset-2 transition-colors duration-200 hover:text-fg"
              >
                Preferências
              </button>
            )}
          </div>
        </div>

        {showPreferences && (
          <div className="mt-3 space-y-3 rounded-input border border-line bg-navy-900/60 p-4">
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
