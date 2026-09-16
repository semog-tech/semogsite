import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Página não encontrada — Semog',
  robots: { index: false, follow: false },
}

/**
 * 404 do grupo `(interno)`. É também o que a página de desfecho mostra quando o
 * token não confere ou o lead não existe — de propósito, e sem distinguir os
 * dois casos.
 *
 * Um 401 com "token inválido" seria mais gentil e contaria duas coisas a quem
 * não deveria saber nenhuma: que existe um lead com aquele id, e que o token é
 * o que falta. O 404 não confirma nem nega nada, e quem chegou pelo e-mail
 * certo nunca vê esta tela.
 *
 * Sem link para o site: esta rota não é porta de entrada, e mandar quem errou
 * o link para a home é oferecer uma saída que ninguém pediu.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[34rem] flex-col justify-center px-4 py-16 text-center">
      <h1 className="font-display text-[clamp(1.8rem,5vw,2.6rem)] text-fg">
        Link inválido ou expirado
      </h1>
      <p className="mt-4 text-[1rem] text-fg-2">
        Abra de novo o link do e-mail de notificação do lead. Se ele continuar sem funcionar, avise
        quem cuida do site.
      </p>
    </main>
  )
}
