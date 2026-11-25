'use client'

import { useSyncExternalStore } from 'react'
import { PropostaCurtaForm } from '@/components/forms/PropostaCurtaForm'
import { PropostaForm } from '@/components/forms/PropostaForm'
import type { PropostaValues } from '@/lib/form-schemas'
import { varianteNoNavegador } from '@/lib/testeFormulario'

/** A variante não muda durante a visita: não há o que assinar. */
function semAssinatura() {
  return () => {}
}

/** No servidor (e na hidratação) a variante ainda é desconhecida. */
function desconhecidaNoServidor() {
  return null
}

/**
 * Topo das landings de cidade com o teste A/B do formulário (ver
 * `@/lib/testeFormulario` e `docs/teste-ab-formulario.md`).
 *
 * A página é estática, então o HTML leva os dois formulários, e quem decide qual
 * aparece é o CSS: o script em linha da landing marca `data-form-ab` no `<html>`
 * antes de o navegador pintar esta parte, e as classes `in-data-[form-ab=b]:`
 * escondem o outro. Sem a marca (JS desligado), aparece o `a`, o formulário de
 * sempre.
 *
 * Depois da hidratação o `useSyncExternalStore` lê a variante e o formulário que
 * estava escondido sai do DOM (com ele, o Turnstile que nunca chegou a renderizar
 * e os campos duplicados). O que estava visível continua montado no mesmo lugar,
 * sem remontar nem piscar. Numa navegação pelo cliente não há hidratação: a
 * variante é decidida já na primeira renderização.
 */
export function PropostaFormAb({ cidade }: { cidade: PropostaValues['cidade'] }) {
  const variante = useSyncExternalStore(semAssinatura, varianteNoNavegador, desconhecidaNoServidor)

  return (
    <>
      {variante !== 'b' && (
        <div className={variante === null ? 'in-data-[form-ab=b]:hidden' : undefined}>
          <PropostaForm compact cidade={cidade} testeFormulario="a" />
        </div>
      )}
      {variante !== 'a' && (
        <div className={variante === null ? 'hidden in-data-[form-ab=b]:block' : undefined}>
          <PropostaCurtaForm cidade={cidade} />
        </div>
      )}
    </>
  )
}
