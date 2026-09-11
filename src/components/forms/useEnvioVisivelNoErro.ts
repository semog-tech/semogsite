'use client'

import { type RefObject, useEffect } from 'react'

/**
 * Respiro abaixo do botão, em pixels — o suficiente para ele não ficar colado
 * na borda da tela. Medido em 1366x768: com `scrollIntoView` e sem folga o
 * botão parava 5px abaixo da dobra.
 */
const FOLGA = 24

/**
 * Janela em que o ajuste é reaplicado a cada mudança de altura do formulário.
 *
 * Uma rolagem só não basta: o Turnstile é remontado junto com o aviso (o token
 * é de uso único) e o widget novo assenta DEPOIS da rolagem, com altura maior
 * que o `min-h` do lugar reservado — no celular ele vira `compact`, que é mais
 * alto que os 65px reservados. Medido em 390x844 com o aviso de cookies no ar:
 * o botão terminava 75px acima do fundo quando precisava de 157px, ou seja,
 * ainda debaixo do cartão do banner. Reagir ao `ResizeObserver` faz a correção
 * acompanhar o assentamento em vez de tentar adivinhá-lo numa constante.
 *
 * Só o TAMANHO do formulário reabre o ajuste, nunca o scroll: quem rolar para
 * reler o formulário não é puxado de volta.
 */
const JANELA_DE_ASSENTAMENTO = 2500

/**
 * Altura que a barra de consentimento ocupa a partir do fundo da viewport, ou
 * `0` quando ela não está no ar (visitante que já decidiu — o `CookieBanner`
 * desmonta e apaga a variável).
 *
 * Sem isto o `FOLGA` sozinho põe o botão 24px acima do fundo da tela, que é
 * **dentro** do cartão do aviso de cookies: o envio falha, o hook traz o botão
 * de volta, e ele chega debaixo da barra — o retry não passa. Medido em
 * produção por hit-test (09/09/2026): os 5 pontos do botão (centro e os 4
 * cantos internos) devolviam elementos do banner, em `/proposta` e `/contato`,
 * nas cinco larguras de 390 a 1920.
 *
 * Mede o próprio banner (`[data-consent-bar]`) em vez de ler `--consent-bar-h`
 * do `documentElement`: desde 11/09/2026 a variável não mora mais lá. Publicá-la
 * no root invalidava o estilo do documento inteiro a cada escrita — 295ms de
 * recálculo medidos na home em Pixel 5 com CPU 20x, a maior fatia do INP — e o
 * banner passou a escrevê-la só nos elementos que a consomem em CSS
 * (`[data-consent-offset]`; ver `CookieBanner` e `theme.css`). Aqui o valor é
 * lido em JS, então medir a barra é mais direto do que criar um consumidor só
 * para depois reler a variável dele: `offsetHeight` é a mesma grandeza que o
 * banner publica, sempre atual, e some sozinho quando o banner desmonta.
 */
function alturaDaBarraDeConsentimento(): number {
  const barra = document.querySelector<HTMLElement>('[data-consent-bar]')
  return barra ? barra.offsetHeight : 0
}

/**
 * Traz o botão de envio de volta para a tela quando um aviso de erro aparece.
 *
 * O aviso entra **acima** do botão e empurra o fim do formulário para baixo —
 * o que tira da tela justamente o botão que resolve o erro. Medido na landing
 * de João Pessoa (variante compacta) em 1366x768, resolução ainda comum em
 * desktop de escritório, que é onde o síndico preenche isto: o botão já termina
 * 28px abaixo da dobra **sem aviso nenhum**, e vai a 91px com o aviso.
 *
 * Por isso reservar espaço para a mensagem não resolveria: evitaria o salto,
 * mas o botão continuaria fora da dobra do mesmo jeito. Rolar cobre os dois
 * casos e não depende do comprimento do texto nem da resolução.
 *
 * Rola o mínimo necessário e **só** quando o botão está fora da viewport — em
 * tela grande, onde ele já aparece, nada se mexe (medido em 1920x1080: a página
 * não sai do lugar). Respeita `prefers-reduced-motion`.
 *
 * Localiza o botão pelo `type="submit"` dentro do formulário em vez de receber
 * uma ref própria porque o `Button` de `@/components/ui` não encaminha `ref`, e
 * mudar isso mexeria num componente usado no site inteiro por causa de um
 * ajuste de três formulários.
 */
export function useEnvioVisivelNoErro(
  status: 'idle' | 'success' | 'error',
  tentativa: number,
  formRef: RefObject<HTMLFormElement | null>,
) {
  // `tentativa` é gatilho de re-execução, não um valor lido aqui dentro: é a key
  // do Turnstile, que muda a cada falha de envio. Sem ela o efeito não roda numa
  // SEGUNDA falha seguida — o `status` já era 'error', o React não vê mudança, e
  // o botão fica onde o widget remontado o empurrou.
  // biome-ignore lint/correctness/useExhaustiveDependencies: gatilho de re-execução, ver acima
  useEffect(() => {
    if (status !== 'error') return

    const form = formRef.current
    const botao = form?.querySelector('button[type="submit"]')
    if (!form || !botao) return

    const comportamento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? ('auto' as const)
      : ('smooth' as const)

    /**
     * Alvo em coordenada ABSOLUTA do documento, não um `scrollBy` relativo: com
     * rolagem suave em curso, `getBoundingClientRect()` devolve uma posição
     * intermediária, e um delta calculado sobre ela rolaria demais. A soma
     * `rect.bottom + scrollY` não depende de onde a rolagem está no momento, o
     * que torna cada reaplicação idempotente — reaplicar para o mesmo alvo não
     * mexe em nada.
     */
    const ajustar = () => {
      const folga = FOLGA + alturaDaBarraDeConsentimento()
      const alvo =
        botao.getBoundingClientRect().bottom + window.scrollY + folga - window.innerHeight
      if (alvo <= window.scrollY) return
      window.scrollTo({ top: alvo, behavior: comportamento })
    }

    ajustar()

    const observer = new ResizeObserver(ajustar)
    observer.observe(form)
    const fim = window.setTimeout(() => observer.disconnect(), JANELA_DE_ASSENTAMENTO)

    return () => {
      observer.disconnect()
      window.clearTimeout(fim)
    }
  }, [status, tentativa, formRef])
}
