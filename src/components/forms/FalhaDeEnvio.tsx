import { site } from '@/../content/site'

/**
 * Aviso para a falha que **não** tem campo pra corrigir: a submissão nem
 * chegou a ter resposta do servidor (Server Action que rejeita, 500, rede
 * caída). Diferente do erro de validação, mandar "confira os campos" aqui
 * seria mentira — o problema não está no que a pessoa digitou.
 *
 * Existe como componente porque os três formulários precisam exatamente do
 * mesmo texto e do mesmo link; duplicar o número do WhatsApp em cada um
 * abriria espaço pra divergirem de `content/site.ts`, que é a fonte única
 * (mesma origem que o `WhatsAppFloat` usa).
 *
 * O link herda a cor do parágrafo que o envolve (`text-inherit`) porque os
 * formulários vivem em superfícies diferentes: card escuro no site e card
 * branco na landing do Experience, cada um com seu tom de erro.
 */
export function FalhaDeEnvio() {
  return (
    <>
      Não foi possível enviar agora — a falha foi nossa, não nos seus dados. Tente de novo em
      instantes ou fale com a gente no{' '}
      <a
        className="text-inherit underline underline-offset-2"
        href={`https://wa.me/${site.company.whatsapp}`}
        target="_blank"
        rel="noopener"
      >
        WhatsApp
      </a>
      .
    </>
  )
}
