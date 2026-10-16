'use client'

import './preferencias-de-cookies.css'
import { useEffect, useState } from 'react'
import { useConsent } from '@/providers/ConsentProvider'

type IdDoCookie = 'necessarios' | 'analise' | 'marketing'
type ItemDeCookie = {
  id: IdDoCookie
  rotulo: string
  descricao: string
  ligado: boolean
  fixo: boolean
}

function Interruptor({ item, aoMudar }: { item: ItemDeCookie; aoMudar: (valor: boolean) => void }) {
  const idDaDescricao = `cookie-${item.id}-descricao`
  return (
    <div className="cookie-linha">
      <div>
        <p className="cookie-rotulo">{item.rotulo}</p>
        <p id={idDaDescricao} className="cookie-descricao">
          {item.descricao}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        className="cookie-interruptor"
        aria-checked={item.ligado}
        aria-label={item.rotulo}
        aria-describedby={idDaDescricao}
        disabled={item.fixo}
        onClick={() => aoMudar(!item.ligado)}
      >
        <span aria-hidden="true" />
      </button>
    </div>
  )
}

/** Os quatro estados são distintos de propósito: com mudança pendente, dizer que nada mudou seria mentira. */
function mensagemDoEstado(estado: {
  pendente: boolean
  salvo: boolean
  decidido: boolean
}): string {
  if (estado.pendente) return 'Você mudou algo — clique em "Salvar preferências" para aplicar.'
  if (estado.salvo) {
    return 'Preferências salvas. Elas valem a partir de agora e ficam guardadas neste navegador.'
  }
  if (estado.decidido) return 'Estas são as preferências que você já salvou neste navegador.'
  return 'Você ainda não alterou nada — estas são as configurações padrão do site.'
}

/**
 * Controle de cookies da Política de Privacidade, em `#cookies` (o texto da política aponta para
 * cá). Mesmo comportamento do CookiePreferencesBlock do site atual, com os mesmos textos:
 * - o estado inicial nasce do padrão e é realinhado quando o provider lê o cookie (no mount), para
 *   quem já escolheu não ver os interruptores errados e salvar por cima;
 * - "Salvar" só liga com mudança de verdade: salvar marca a decisão e dispara um `consent update`
 *   GLOBAL, e confirmar o padrão sem mexer concederia publicidade a um visitante da região onde o
 *   padrão regional é negar.
 */
export function PreferenciasDeCookies() {
  const { consent, decided, save } = useConsent()
  const [analise, setAnalise] = useState(consent.analytics)
  const [marketing, setMarketing] = useState(consent.marketing)
  const [salvo, setSalvo] = useState(false)

  useEffect(() => {
    setAnalise(consent.analytics)
    setMarketing(consent.marketing)
  }, [consent])

  const pendente = analise !== consent.analytics || marketing !== consent.marketing
  const itens: readonly ItemDeCookie[] = [
    {
      id: 'necessarios',
      rotulo: 'Cookies necessários',
      descricao: 'Sempre ativos — essenciais para o funcionamento do site.',
      ligado: true,
      fixo: true,
    },
    {
      id: 'analise',
      rotulo: 'Cookies de análise',
      descricao: 'Ajudam a entender como o site é usado, de forma agregada.',
      ligado: analise,
      fixo: false,
    },
    {
      id: 'marketing',
      rotulo: 'Cookies de marketing',
      descricao: 'Usados para personalizar comunicações e anúncios.',
      ligado: marketing,
      fixo: false,
    },
  ]
  const mudar = (id: IdDoCookie) => (valor: boolean) => {
    if (id === 'analise') setAnalise(valor)
    if (id === 'marketing') setMarketing(valor)
    setSalvo(false)
  }

  return (
    <section id="cookies" className="artigo-cookies" aria-labelledby="cookies-titulo">
      <h2 id="cookies-titulo">Suas preferências de cookies</h2>
      <p>
        Você pode desligar as categorias não essenciais a qualquer momento, e voltar aqui para mudar
        de ideia. A escolha fica guardada neste navegador por 180 dias.
      </p>
      <div className="cookies-lista">
        {itens.map((item) => (
          <Interruptor key={item.id} item={item} aoMudar={mudar(item.id)} />
        ))}
      </div>
      <div className="cookies-acoes">
        <button
          type="button"
          className="botao botao--pequeno"
          disabled={!pendente}
          onClick={() => {
            save({ analytics: analise, marketing })
            setSalvo(true)
          }}
        >
          Salvar preferências
        </button>
        <p className="cookies-estado" aria-live="polite">
          {mensagemDoEstado({ pendente, salvo, decidido: decided })}
        </p>
      </div>
    </section>
  )
}
