/**
 * Teste A/B do formulário de proposta no topo das quatro landings de cidade
 * (decidido em 25/11/2026). Metade dos visitantes vê o formulário atual (`a`:
 * nome, WhatsApp, tipo, e-mail e condomínio) e metade o curto (`b`: nome,
 * WhatsApp e condomínio opcional), que envia pela mesma action da proposta curta
 * da triagem (`submitPropostaRapida`). Como ler o resultado e como encerrar:
 * `docs/teste-ab-formulario.md`.
 *
 * Módulo "client-safe", sem import: a landing (Server Component) monta daqui o
 * script em linha, e o `PropostaFormAb` (cliente) lê a variante já decidida.
 */

export const VARIANTES_TESTE_FORMULARIO = ['a', 'b'] as const
export type VarianteTesteFormulario = (typeof VARIANTES_TESTE_FORMULARIO)[number]

/**
 * Chave de `cms.leads.data` com a variante que o visitante viu — e o nome do
 * campo nos dois schemas (`propostaSchema` e `propostaRapidaSchema`). Lead sem
 * ela não passou pelo teste (outra página, a triagem do WhatsApp, ou antes de
 * 25/11/2026).
 */
export const TESTE_FORMULARIO_FIELD = 'testeFormulario'

/**
 * Cookie de 1ª parte com a variante sorteada. É funcional (decide qual
 * formulário a página mostra, como o `semog-consent` decide o banner), não
 * identifica ninguém e não sai do site, então não espera o aceite de marketing.
 * 90 dias bastam para quem volta à landing ver o mesmo formulário durante o teste.
 */
export const COOKIE_TESTE_FORMULARIO = 'semog-form-ab'
export const MAX_AGE_TESTE_FORMULARIO = 90 * 24 * 60 * 60

/** `?form=a` ou `?form=b` força a variante só nesta visita, sem gravar o cookie. */
export const PARAMETRO_TESTE_FORMULARIO = 'form'

/** Atributo do `<html>` que o CSS do `PropostaFormAb` lê antes da hidratação. */
export const ATRIBUTO_TESTE_FORMULARIO = 'data-form-ab'

type Configuracao = {
  cookie: string
  maxAge: number
  parametro: string
  atributo: string
}

const CONFIGURACAO: Configuracao = {
  cookie: COOKIE_TESTE_FORMULARIO,
  maxAge: MAX_AGE_TESTE_FORMULARIO,
  parametro: PARAMETRO_TESTE_FORMULARIO,
  atributo: ATRIBUTO_TESTE_FORMULARIO,
}

/**
 * Decide a variante deste visitante e a marca no `<html>`: a forçada pela URL,
 * senão a do cookie, senão um sorteio 50/50 gravado no cookie.
 *
 * **Roda como texto**: `scriptTesteFormulario` serializa esta função com
 * `toString()` para o `<script>` em linha da landing, que executa antes de o
 * navegador pintar o formulário — é o que evita a troca de formulário depois de
 * pintado. Por isso ela não pode usar nada de fora do próprio corpo (import,
 * constante do módulo, helper): tudo chega pelos argumentos.
 */
export function aplicarTesteFormulario(config: Configuracao): VarianteTesteFormulario {
  const valida = (valor: string | null | undefined): VarianteTesteFormulario | null =>
    valor === 'a' || valor === 'b' ? valor : null

  const forcada = valida(new URLSearchParams(window.location.search).get(config.parametro))
  const doCookie = valida(
    document.cookie.match(new RegExp(`(?:^|;\\s*)${config.cookie}=([^;]*)`))?.[1],
  )
  let variante = forcada ?? doCookie
  if (!variante) {
    variante = Math.random() < 0.5 ? 'a' : 'b'
    const seguro = window.location.protocol === 'https:' ? '; Secure' : ''
    // biome-ignore lint/suspicious/noDocumentCookie: roda como script em linha antes da hidratação; a Cookie Store API é assíncrona e não existe no Safari/Firefox.
    document.cookie = `${config.cookie}=${variante}; max-age=${config.maxAge}; path=/; SameSite=Lax${seguro}`
  }
  document.documentElement.setAttribute(config.atributo, variante)
  return variante
}

/** O `<script>` em linha que a landing põe antes do formulário. */
export function scriptTesteFormulario(): string {
  return `(${aplicarTesteFormulario.toString()})(${JSON.stringify(CONFIGURACAO)})`
}

/**
 * A variante deste visitante no navegador. Normalmente o script em linha já a
 * marcou no `<html>`; numa navegação pelo cliente (link interno até a landing) o
 * React não executa aquele script, e a decisão acontece aqui, na primeira
 * renderização do formulário.
 */
export function varianteNoNavegador(): VarianteTesteFormulario {
  const marcada = document.documentElement.getAttribute(ATRIBUTO_TESTE_FORMULARIO)
  if (marcada === 'a' || marcada === 'b') return marcada
  return aplicarTesteFormulario(CONFIGURACAO)
}
