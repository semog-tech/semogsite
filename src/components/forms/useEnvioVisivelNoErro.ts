'use client'

import { type RefObject, useEffect } from 'react'

/**
 * Respiro abaixo do botão, em pixels. Não é estética: o Turnstile é remontado
 * junto com o aviso (token é de uso único) e o widget novo assenta com altura
 * um pouco maior que o `min-h` do lugar reservado, empurrando o botão mais
 * alguns pixels DEPOIS da rolagem. Medido em 1366x768: com `scrollIntoView` e
 * sem folga o botão parava 5px abaixo da dobra. Daí o `scrollBy` calculado com
 * esta folga, que absorve o assentamento e ainda evita o botão colado na borda.
 */
const FOLGA = 24

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

    const botao = formRef.current?.querySelector('button[type="submit"]')
    if (!botao) return

    const excesso = botao.getBoundingClientRect().bottom + FOLGA - window.innerHeight
    if (excesso <= 0) return

    window.scrollBy({
      top: excesso,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    })
  }, [status, tentativa, formRef])
}
