/**
 * Vocabulário dos QR codes impressos — o mapa de peça → destino, o saneamento
 * do slug e a leitura grosseira de dispositivo.
 *
 * Módulo **puro de propósito**: nada de `server-only`, banco ou API do Next. É
 * importado pela rota (`src/app/qr/[slug]/route.ts`) e pelos testes, e a
 * decisão de destino precisa ser inspecionável sem subir servidor.
 *
 * A razão de existir uma rota própria em vez de o QR apontar direto para a
 * home: **papel é imutável**. O que está impresso não muda; o destino aqui
 * muda a qualquer momento, sem reimpressão. O preço é este arquivo ser a
 * fonte única do destino de cada peça — mudar uma entrada de `PECAS_QR` muda
 * para onde o papel já distribuído leva.
 *
 * O que cada acesso grava está em `db/qr-scans.sql`.
 */

/** Parâmetros de campanha de uma peça. Nomes fixos do GA4 (`utm_*`). */
type Utm = {
  source: string
  medium: string
  campaign: string
}

/** Uma peça impressa: para onde ela leva e sob qual campanha. */
type PecaQr = {
  /** Caminho de destino, sem query — as UTMs são acrescentadas por `destinoDoQr`. */
  caminho: string
  utm: Utm
}

/**
 * As peças impressas em circulação, por slug (o que vem depois de `/qr/`).
 *
 * Sobre os valores de UTM: em 17/09/2026 o GA4 da Semog (propriedade 346257600)
 * nunca tinha recebido campanha com UTM manual — todo o tráfego marcado vem do
 * auto-tagging do Ads (`google / cpc`). Ou seja, não havia convenção anterior a
 * respeitar, e estes são os primeiros valores. A convenção adotada: `source`
 * fixo em `qr` (o mecanismo), `medium` igual ao slug da peça (o papel), e
 * `campaign` igual à ação. Assim o slug da rota e o relatório do GA4 usam a
 * mesma palavra, e uma peça nova só precisa de uma linha aqui.
 *
 * Efeito colateral conhecido: `folder` não é um medium que o GA4 reconheça, e
 * o Agrupamento de Canais Padrão joga essas sessões em **"Unassigned"**. O
 * relatório correto para ler o QR é o de Origem/Mídia (`qr / folder`) ou um
 * agrupamento personalizado. Forçar um medium reconhecido (`referral`,
 * `organic`) tiraria do Unassigned mentindo sobre o canal — não vale.
 */
const PECAS_QR: Record<string, PecaQr> = {
  // Folder distribuído no Semog Experience de 26/09/2026. Leva para a home
  // porque a peça vende a Semog inteira, não o evento — quem está no evento já
  // está lá. Depois do evento este destino pode mudar sem reimprimir nada.
  folder: {
    caminho: '/',
    utm: { source: 'qr', medium: 'folder', campaign: 'experience-26' },
  },
}

/** 'mobile' quando o acesso veio de celular/tablet — sinal agregado, não identificador. */
export type Dispositivo = 'mobile' | 'desktop'

/** Teto do slug gravado. Peça real tem uma palavra; o resto é URL inventada. */
const LIMITE_SLUG = 40

/**
 * Marca de slug que não sobreviveu ao saneamento (só caracteres inválidos).
 * Parênteses seguem a convenção do próprio GA4 (`(direct)`, `(not set)`) e não
 * colidem com slug real, que é `[a-z0-9-]`.
 */
const SLUG_ILEGIVEL = '(ilegivel)'

/**
 * Normaliza o slug vindo da URL: minúsculas, só `[a-z0-9-]`, truncado.
 *
 * O `toLowerCase` não é firula — QR code gerado com a URL em MAIÚSCULAS usa o
 * modo alfanumérico e fica com menos módulos, e há gráfica que faz isso. O
 * caminho é case-sensitive, então `/qr/FOLDER` só encontra a peça depois
 * daqui. (O segmento `/qr/` em si não tem como ser resgatado nesta rota: se a
 * peça for impressa como `/QR/FOLDER`, o Next não casa a rota. O QR precisa
 * ser gerado em minúsculas.)
 */
export function saneiaSlug(bruto: string): string {
  const limpo = bruto
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, LIMITE_SLUG)
  return limpo || SLUG_ILEGIVEL
}

/**
 * Para onde mandar quem escaneou, e se a peça é conhecida.
 *
 * Slug desconhecido vai para a home **sem UTM nenhuma**: a pessoa precisa
 * chegar ao site (ela escaneou um papel, um 404 seria o pior desfecho), mas
 * atribuir a um `medium` que não sabemos qual é seria inventar dado. O acesso
 * fica registrado com `conhecido = false`, que é onde erro de impressão
 * aparece.
 */
export function destinoDoQr(slug: string): { destino: string; conhecido: boolean } {
  const peca = PECAS_QR[slug]
  if (!peca) return { destino: '/', conhecido: false }

  const params = new URLSearchParams({
    utm_source: peca.utm.source,
    utm_medium: peca.utm.medium,
    utm_campaign: peca.utm.campaign,
  })
  return { destino: `${peca.caminho}?${params}`, conhecido: true }
}

/**
 * Classificação grosseira do aparelho a partir do user-agent — e o user-agent
 * termina aqui, nunca é gravado. Serve para uma pergunta só: "o acesso veio
 * mesmo de celular?", que é o esperado de QR impresso. Robô de preview de link
 * cai em 'desktop' e infla essa coluna; não há como distinguir sem gravar mais
 * do que vale a pena.
 */
export function dispositivoDoUserAgent(userAgent: string | null): Dispositivo {
  if (!userAgent) return 'desktop'
  return /Mobi|Android|iPhone|iPad|iPod/i.test(userAgent) ? 'mobile' : 'desktop'
}
