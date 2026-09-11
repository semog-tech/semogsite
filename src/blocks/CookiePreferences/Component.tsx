'use client'

import { useEffect, useState } from 'react'
import { ToggleRow } from '@/components/consent/ToggleRow'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { useConsent } from '@/providers/ConsentProvider'
import type { CookiePreferencesBlock as CookiePreferencesBlockType } from '@/types/blocks'

/**
 * Controle de cookies dentro da Política de Privacidade — é aqui que o
 * visitante opta por sair e muda de ideia depois.
 *
 * Substitui o painel de Preferências do antigo banner de rodapé, removido em
 * 11/09/2026. O banner saía a cada visita para um público a quem a regra de
 * consentimento prévio do Google não se aplica (ela alcança EEA, Reino Unido e
 * Suíça), e custava caro: o clique em "Entendi" era a pior interação da home,
 * 328ms de INP contra 96ms do segundo colocado. A obrigação que sobra é a
 * revogabilidade — poder desligar e poder voltar atrás —, e ela não exige
 * interromper a visita: exige um lugar estável para exercer a escolha.
 *
 * Não inventa estado: enquanto não há escolha salva, o texto diz que vale o
 * padrão, e os interruptores mostram esse padrão (`defaultConsent`). Depois de
 * salvar, mostram o que está no cookie. O efeito no Consent Mode é imediato —
 * `save()` grava o cookie e marca `decided`, e o `Analytics` reage mandando o
 * `gtag('consent','update', …)`.
 */
export function CookiePreferencesBlock({ title, description }: CookiePreferencesBlockType) {
  const { consent, decided, save } = useConsent()
  const [analytics, setAnalytics] = useState(consent.analytics)
  const [marketing, setMarketing] = useState(consent.marketing)
  const [salvo, setSalvo] = useState(false)

  // O consentimento só é lido do cookie depois da hidratação (o provider lê no
  // mount), então o estado inicial acima nasce do padrão e precisa ser
  // realinhado quando a leitura chega — senão quem já escolheu vê os
  // interruptores errados por um instante e pode salvar por cima.
  useEffect(() => {
    setAnalytics(consent.analytics)
    setMarketing(consent.marketing)
  }, [consent])

  const handleSave = () => {
    save({ analytics, marketing })
    setSalvo(true)
  }

  /**
   * O botão só habilita quando há mudança de verdade. Além de não dar um clique
   * inútil, isso fecha uma brecha: salvar marca `decided` e dispara um `consent
   * update`, que é GLOBAL (não aceita `region`). Se qualquer visitante pudesse
   * "confirmar o padrão" sem mexer em nada, um europeu que abrisse esta página
   * concederia publicidade por engano, passando por cima da negativa regional.
   * Sem mudança, sem update — e o default regional segue valendo.
   */
  const pendente = analytics !== consent.analytics || marketing !== consent.marketing

  return (
    <section className="legal-body" id="cookies">
      <Container>
        <div className="wrap">
          <h2>{title ?? 'Suas preferências de cookies'}</h2>
          {description ? <p>{description}</p> : null}

          <div className="mt-6 space-y-3 rounded-card border border-line bg-navy-900/60 p-5">
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
              onChange={(v) => {
                setAnalytics(v)
                setSalvo(false)
              }}
            />
            <ToggleRow
              label="Cookies de marketing"
              description="Usados para personalizar comunicações e anúncios."
              checked={marketing}
              onChange={(v) => {
                setMarketing(v)
                setSalvo(false)
              }}
            />

            <div className="flex flex-wrap items-center gap-4 border-line border-t pt-4">
              <Button variant="primary" size="sm" onClick={handleSave} disabled={!pendente}>
                Salvar preferências
              </Button>
              <p aria-live="polite" className="m-0 text-[0.84rem] text-fg-3">
                {salvo
                  ? 'Preferências salvas. Elas valem a partir de agora e ficam guardadas neste navegador.'
                  : decided
                    ? 'Estas são as preferências que você já salvou neste navegador.'
                    : 'Você ainda não alterou nada — estas são as configurações padrão do site.'}
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
