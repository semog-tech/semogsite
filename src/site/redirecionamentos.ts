import type { NextConfig } from 'next'

type Redirecionamento = Awaited<ReturnType<NonNullable<NextConfig['redirects']>>>[number]

/**
 * Os 54 redirects do site. Saíram do `next.config.ts` na fase 1 do site v2 para o inventário
 * de URLs poder testá-los (tests/int/site-v2-inventario.int.spec.ts). O `next.config.ts`
 * importa daqui por caminho relativo: o carregador do Next transpila o config e os `.ts` que
 * ele importa, mas sem os aliases do tsconfig, então nada de `@/` neste arquivo.
 */
export const REDIRECIONAMENTOS: Redirecionamento[] = [
  // Apex → www. O site é canônico em www.semog.com.br (canonical/OG/sitemap
  // em src/lib/seo.ts), então todo acesso ao domínio raiz faz 301 pro www.
  // A condição `host` restringe ao apex — não afeta o próprio www nem os
  // domínios *.vercel.app (preview/prod interno). Roda no edge da Vercel,
  // antes da app.
  {
    source: '/:path*',
    has: [{ type: 'host', value: 'semog.com.br' }],
    destination: 'https://www.semog.com.br/:path*',
    permanent: true,
  },
  { source: '/index.html', destination: '/', permanent: true },
  { source: '/semog.html', destination: '/semog', permanent: true },
  { source: '/solucoes.html', destination: '/solucoes', permanent: true },
  {
    source: '/administracao-de-condominios.html',
    destination: '/administracao-de-condominios',
    permanent: true,
  },
  { source: '/garante.html', destination: '/garante', permanent: true },
  { source: '/incorporadoras.html', destination: '/incorporadoras', permanent: true },
  { source: '/blog.html', destination: '/blog', permanent: true },
  { source: '/contato.html', destination: '/contato', permanent: true },
  { source: '/proposta.html', destination: '/proposta', permanent: true },
  {
    source: '/administradora-de-condominios-recife.html',
    destination: '/administradora-de-condominios-recife',
    permanent: true,
  },
  {
    source: '/administradora-de-condominios-joao-pessoa.html',
    destination: '/administradora-de-condominios-joao-pessoa',
    permanent: true,
  },
  {
    source: '/administradora-de-condominios-campina-grande.html',
    destination: '/administradora-de-condominios-campina-grande',
    permanent: true,
  },
  {
    source: '/administradora-de-condominios-belem.html',
    destination: '/administradora-de-condominios-belem',
    permanent: true,
  },
  { source: '/privacidade.html', destination: '/privacidade', permanent: true },
  { source: '/termos.html', destination: '/termos', permanent: true },
  { source: '/guia.html', destination: '/', permanent: true },

  // ── Migração do WordPress antigo (www.semog.com.br) → 301 (permanent:true
  // = 308, tratado como permanente pelo Google) pras novas URLs. Origens sem
  // barra final (o Next normaliza a barra do WP). Lista tirada do sitemap do
  // WordPress (jul/2026). Home `/`, `/proposta` e `/blog` mantêm o caminho.

  // Landings de unidade: /locais/... → /administradora-de-condominios-*
  {
    source: '/locais/semog-administradora-de-condominios-recife',
    destination: '/administradora-de-condominios-recife',
    permanent: true,
  },
  {
    source: '/locais/semog-administradora-de-condominios-joao-pessoa',
    destination: '/administradora-de-condominios-joao-pessoa',
    permanent: true,
  },
  {
    source: '/locais/semog-administradora-de-condominios-campina-grande',
    destination: '/administradora-de-condominios-campina-grande',
    permanent: true,
  },
  {
    source: '/locais/semog-administradora-de-condominios-belem',
    destination: '/administradora-de-condominios-belem',
    permanent: true,
  },

  // Páginas institucionais
  { source: '/sobre', destination: '/semog', permanent: true },
  // `/domestica` (gestão de doméstica) não tem página equivalente — mando pra
  // Soluções. Ajustar se preferir outro destino.
  { source: '/domestica', destination: '/solucoes', permanent: true },

  // Posts antigos COM tema correspondente → post novo mais próximo
  {
    source: '/acabe-com-a-inadimplencia-de-seu-condominio',
    destination: '/blog/inadimplencia-condominio-o-que-a-lei-permite',
    permanent: true,
  },
  {
    source: '/assembleias-virtuais-apos-pandemia',
    destination: '/blog/assembleia-virtual-validade-juridica',
    permanent: true,
  },
  {
    source: '/prestacao-de-contas-do-condominio',
    destination: '/blog/previsao-orcamentaria-guia-sindico',
    permanent: true,
  },
  {
    source: '/despesas-ordinarias-e-extraordinarias-entenda-a-diferenca',
    destination: '/blog/fundo-reserva-quanto-guardar-por-mes',
    permanent: true,
  },
  {
    source: '/3-tipos-barulho-condominio-lei-silencio',
    destination: '/blog/areas-lazer-regras-de-uso',
    permanent: true,
  },
  {
    source: '/o-vizinho-insiste-no-som-alto-no-fim-de-semana-saiba-o-que-fazer',
    destination: '/blog/areas-lazer-regras-de-uso',
    permanent: true,
  },

  // Demais posts antigos (sem correspondência direta) → índice do blog
  {
    source: '/qual-o-prazo-para-guarda-de-documentos-em-condominio',
    destination: '/blog',
    permanent: true,
  },
  { source: '/economia-de-energia-condominio-5-dicas', destination: '/blog', permanent: true },
  {
    source: '/inspecao-predial-5-coisas-sindico-deve-saber',
    destination: '/blog',
    permanent: true,
  },
  { source: '/cigarros-eletronicos-condominio-permitido', destination: '/blog', permanent: true },
  {
    source: '/8-dicas-lidar-latidos-cachorro-condominio-copy',
    destination: '/blog',
    permanent: true,
  },
  {
    source: '/precisamos-falar-sobre-a-acessibilidade-nos-condominios',
    destination: '/blog',
    permanent: true,
  },
  {
    source: '/mudancas-na-legislacao-de-sst-entenda-os-impactos-nos-condominios',
    destination: '/blog',
    permanent: true,
  },
  { source: '/imovel-e-um-bom-investimento', destination: '/blog', permanent: true },
  { source: '/9-dicas-para-cuidar-da-saude-do-condominio', destination: '/blog', permanent: true },
  {
    source: '/saiba-como-aplicar-corretamente-advertencia-e-multa-de-condominio',
    destination: '/blog',
    permanent: true,
  },
  { source: '/checklist-para-comecar-2021-com-pe-direito', destination: '/blog', permanent: true },

  // Páginas de categoria do WordPress (qualquer uma) → índice do blog
  { source: '/category/:slug*', destination: '/blog', permanent: true },

  // ── Endereços que respondiam 404 em produção (conferido por curl em
  // 16/09/2026). Grafias erradas de `/experience` que circularam na
  // divulgação do evento: `/expiriencae` já trouxe DUAS inscrições de gente
  // que bateu no 404 e insistiu — quem desistiu não deixou rastro.
  { source: '/expiriencae', destination: '/experience', permanent: true },
  { source: '/experiencae', destination: '/experience', permanent: true },
  { source: '/expirience', destination: '/experience', permanent: true },
  { source: '/experiencia', destination: '/experience', permanent: true },

  // Variantes antigas do slug de administração que o Google ainda serve em
  // primeira posição. Vão para a landing DE RECIFE, não para a página
  // genérica de serviço: quem busca com o nome da cidade tem intenção
  // local, e é a landing que responde a isso — formulário já na cidade
  // certa, endereço e telefone da unidade, JSON-LD de LocalBusiness. Neste
  // ciclo, três das cinco propostas entraram por landing de cidade.
  {
    source: '/administracao-condominio-recife',
    destination: '/administradora-de-condominios-recife',
    permanent: true,
  },
  {
    source: '/administracao-de-condominios-recife',
    destination: '/administradora-de-condominios-recife',
    permanent: true,
  },
  {
    source: '/administracao-condominios-recife',
    destination: '/administradora-de-condominios-recife',
    permanent: true,
  },
  {
    source: '/administracao-condominial-recife',
    destination: '/administradora-de-condominios-recife',
    permanent: true,
  },

  // O slug das landings é plural (`condominios`), mas "administradora de
  // condomínio" é como o serviço é falado e escrito — quem remonta o
  // endereço de memória, de material impresso ou de um link antigo erra
  // para o singular e bate em 404. Conferido por curl em 28/09/2026: as
  // QUATRO cidades respondiam 404 no singular, nenhuma tinha cobertura.
  //
  // Só a grafia em minúsculas. A caixa alta (`/Administradora-de-...`)
  // também responde 404 e foi considerada: o matching do Next é sensível a
  // caixa e não tem como desligar isso aqui, então cobrir de verdade seria
  // normalizar no middleware. Descartado por ora — nenhuma variante com
  // maiúscula tem impressão no Search Console, e não se troca a
  // arquitetura por caso hipotético. Se um dia aparecer tráfego assim
  // (foi o que aconteceu com o QR do folder), o lugar do conserto é lá.
  {
    source: '/administradora-de-condominio-recife',
    destination: '/administradora-de-condominios-recife',
    permanent: true,
  },
  {
    source: '/administradora-de-condominio-joao-pessoa',
    destination: '/administradora-de-condominios-joao-pessoa',
    permanent: true,
  },
  {
    source: '/administradora-de-condominio-campina-grande',
    destination: '/administradora-de-condominios-campina-grande',
    permanent: true,
  },
  {
    source: '/administradora-de-condominio-belem',
    destination: '/administradora-de-condominios-belem',
    permanent: true,
  },

  // Belém repetindo o caso de Recife logo acima: das 58 URLs próprias que
  // o Search Console registra com impressão nos últimos 90 dias, esta é a
  // ÚNICA que ainda responde 404 — o Google serve o endereço e a visita
  // morre. As outras combinações de grafia por cidade não aparecem no GSC;
  // sem o Google servindo o endereço, não há de onde vir a visita.
  {
    source: '/administracao-de-condominios-belem',
    destination: '/administradora-de-condominios-belem',
    permanent: true,
  },
]
