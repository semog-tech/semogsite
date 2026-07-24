/**
 * Conteúdo da Home — port fiel de `src/seed/home.ts` (fonte da verdade,
 * reflete produção). Ver o cabeçalho daquele arquivo pra contexto completo
 * do redesign (Plano 2, `redesign/02-home`): a home diverge deliberadamente
 * do `_reference/index.html` desde então (faixa de prova, stats em banda,
 * pilares em colunas, seção própria do aplicativo).
 */
import type { PageData } from '@/types/content'
import { img } from '../media'

// Mesmo número usado em `src/seed/home.ts`/`pages.ts` — dígitos puros, ver `wa.me`.
const WHATSAPP_URL = 'https://wa.me/551130034506'

// A página `/aplicativo` só existe a partir do plano 03. Até lá, os links do
// app apontam para a âncora existente `.solucoes#aplicativo` (mesma do
// header) pra não caírem em 404. Trocar só esta linha quando `/aplicativo`
// for ao ar.
const APP_HREF = '/solucoes#aplicativo'

// `\n` reproduz o `<br>` literal de `_reference/index.html:491`
// (`Preocupe-se apenas<br>em morar.`) — `src/motion/Chars.tsx` insere uma
// quebra de linha real no lugar, ver doc do componente.
const HERO_HEADLINE = 'Preocupe-se apenas\nem morar.'

export const home: PageData = {
  slug: 'home',
  // Rótulo administrativo real no Payload (confirmado via GET /api/pages) —
  // sem efeito prático aqui (JSON-LD da home é sempre Organization/WebSite, e
  // `meta.title` abaixo já cobre o `<title>`), mantido só por paridade de dado.
  title: 'Home',
  // Espelha `<title>`/meta description de `_reference/index.html` — o
  // `meta.title` tem prioridade sobre o rótulo administrativo "Home".
  meta: {
    title: 'Semog | Administradora de Condomínios líder do Nordeste há 35 anos',
    description:
      'Administradora de condomínios em Recife, João Pessoa, Campina Grande e Belém. 650 condomínios, 70 mil clientes, prestação de contas 100% digital e inadimplência zero com o Semog Garante.',
  },
  layout: [
    {
      blockType: 'hero',
      headline: HERO_HEADLINE,
      subhead: 'Há 35 anos, a líder do Nordeste cuida do condomínio para você cuidar da vida.',
      background: 'videoSequence',
      // Substitui a antiga `tag` (`.hero-tagbox`) — mesma faixa de vidro, agora
      // com prova em número em vez de só um rótulo.
      proofItems: [
        { value: '4,8', label: 'no app, 1.133 avaliações', stars: true },
        { value: '+650', label: 'condomínios sob gestão' },
        { value: '+70 mil', label: 'clientes atendidos' },
        { value: '35 anos', label: 'em 3 estados, desde 1991' },
      ],
      ctas: [
        { label: 'Solicitar proposta', href: '/proposta', variant: 'white' },
        { label: 'Ver o aplicativo', href: APP_HREF, variant: 'glass' },
      ],
    },
    {
      blockType: 'stats',
      eyebrow: 'A líder do Nordeste',
      title: 'Liderança não se declara. Se comprova.',
      variant: 'band',
      items: [
        { value: 35, label: 'Anos de mercado', detail: 'Desde 1991, sempre no Nordeste.' },
        {
          value: 650,
          prefix: '+',
          label: 'Condomínios',
          detail: 'Sob gestão completa, mês após mês.',
        },
        {
          value: 70,
          prefix: '+',
          suffix: 'mil',
          label: 'Clientes',
          detail: 'Famílias e empresas que confiam.',
        },
        {
          value: 100,
          prefix: '+',
          label: 'Especialistas',
          detail: 'Time próprio: financeiro, jurídico, contábil.',
        },
        { value: 3, label: 'Estados', detail: 'Pernambuco, Paraíba e Pará.' },
      ],
    },
    {
      blockType: 'valuesMarquee',
      items: ['TRANSPARÊNCIA', 'RETIDÃO', 'DINÂMICA'],
      separator: '/',
    },
    {
      blockType: 'wordsSection',
      text: 'Condomínio bem administrado é aquele que ninguém percebe. A vida acontece dentro dele, e nós cuidamos de todo o resto.',
    },
    {
      blockType: 'pillars',
      variant: 'columns',
      items: [
        {
          title: 'Condomínios',
          text: 'Gestão completa de comunidades residenciais, comerciais e associações, do financeiro à assembleia.',
        },
        {
          title: 'Métricas',
          text: 'Decisões guiadas por dados: indicadores, gráficos e relatórios que todo condômino entende.',
        },
        {
          title: 'Organização',
          text: 'Processos claros, prazos cumpridos e documentação impecável, sempre ao seu alcance.',
        },
      ],
    },
    {
      blockType: 'solucoesBento',
      eyebrow: 'Soluções',
      title: 'Uma gestão para cada comunidade.',
      cards: [
        {
          image: img('residencial.webp'),
          title: 'Residenciais',
          text: 'Financeiro, RH, manutenção, assembleias e comunicação. O prédio funciona, o morador vive.',
          href: '/solucoes#residenciais',
          tall: true,
        },
        {
          image: img('comercial.webp'),
          title: 'Comerciais',
          text: 'Previsibilidade e rateios impecáveis para edifícios corporativos.',
          href: '/solucoes#comerciais',
        },
        {
          image: img('associacoes.webp'),
          title: 'Associações',
          text: 'Governança sob medida para loteamentos e clubes.',
          href: '/solucoes#associacoes',
        },
      ],
    },
    {
      blockType: 'produtosGrid',
      eyebrow: 'O sistema Semog',
      title: 'Quatro produtos que nenhuma outra oferece juntos.',
      cards: [
        {
          image: img('c-prestacao.webp'),
          theme: 'on-white',
          tag: 'Prestação de Contas Digital',
          title: 'O balancete que todos os condôminos entendem.',
          text: '100% digital, com documentos anexados, gráficos claros e assinatura digital com validade jurídica.',
          href: '/solucoes#prestacao',
        },
        {
          image: img('c-garante.webp'),
          theme: 'on-navy',
          tag: 'Semog Garante · com G5 Partners',
          title: 'Inadimplência zero por 1% da arrecadação.',
          text: 'O condomínio recebe 100% da arrecadação prevista, todos os meses. A cobrança vira problema nosso.',
          href: '/garante',
        },
        {
          image: img('c-app.webp'),
          theme: 'on-deep',
          tag: 'Aplicativo Semog · 4,8 ★',
          title: 'O condomínio inteiro na palma da mão.',
          text: 'Boletos, reservas, assembleias e avisos em uma interface que o morador realmente usa.',
          href: APP_HREF,
        },
        {
          image: img('c-one.webp'),
          theme: 'on-white',
          tag: 'Semog One',
          title: 'A plataforma própria que construímos sobre o nosso ERP.',
          text: 'Equipe de desenvolvimento própria e uma plataforma única que evolui toda semana.',
          href: '/solucoes#tecnologia',
        },
      ],
    },
    // Seção própria do app, tema `deep`. As duas telas são prints reais das
    // lojas com o nome do condomínio de demonstração ("Teste Gruvi") apagado —
    // provisórios até o cliente regravar prints limpos do app em produção.
    {
      blockType: 'appShowcase',
      theme: 'deep',
      eyebrow: 'Aplicativo Semog',
      title: 'O condomínio inteiro na palma da mão.',
      text: 'Boleto, reserva, assembleia, encomenda e portaria. O morador resolve sozinho, sem ligar para a administradora.',
      image: img('app-inicio.webp'),
      imageSecondary: img('app-encomenda.webp'),
      features: [
        { title: 'Taxa do condomínio', description: 'Boleto do mês, 2ª via e comprovante.' },
        { title: 'Reserva de áreas comuns', description: 'Calendário com o que está livre.' },
        { title: 'Assembleia virtual', description: 'Participação e voto pelo aplicativo.' },
        { title: 'Encomendas', description: 'Aviso de chegada e QR de retirada.' },
        { title: 'Visitantes e prestadores', description: 'Liberação por link, antes de chegar.' },
        { title: 'Documentos e comunicados', description: 'Convenção, atas e avisos oficiais.' },
      ],
      rating: { score: '4,8', label: '1.133 avaliações na App Store e no Google Play' },
      stores: {
        appStore: 'https://apps.apple.com/br/app/semog-condom%C3%ADnios/id6504202916',
        playStore: 'https://play.google.com/store/apps/details?id=br.com.semog',
      },
      cta: { label: 'Conhecer o app', href: APP_HREF },
    },
    {
      blockType: 'garante',
      eyebrow: 'Semog Garante',
      title: 'A receita do condomínio, blindada.',
      video: img('garante.mp4'),
      poster: img('garante.webp'),
      cta: { label: 'Conhecer o Semog Garante', href: '/garante' },
      priceChip: { value: '1%', label: 'da arrecadação. Sem adesão, sem letra miúda.' },
    },
    {
      blockType: 'cities',
      eyebrow: 'Presença',
      title: 'Do Nordeste ao Norte, perto de você.',
      items: [
        {
          city: 'Recife',
          uf: 'Pernambuco',
          role: 'Unidade',
          href: '/administradora-de-condominios-recife',
          image: img('recife.webp'),
        },
        {
          city: 'João Pessoa',
          uf: 'Paraíba',
          role: 'Unidade',
          href: '/administradora-de-condominios-joao-pessoa',
          image: img('joao-pessoa.webp'),
        },
        {
          city: 'Campina Grande',
          uf: 'Paraíba',
          role: 'Unidade',
          href: '/administradora-de-condominios-campina-grande',
          image: img('campina-grande.webp'),
        },
        {
          city: 'Belém',
          uf: 'Pará',
          role: 'Unidade',
          href: '/administradora-de-condominios-belem',
          image: img('belem.webp'),
        },
      ],
    },
    {
      blockType: 'humanQuote',
      quote: 'Aqui, cliente não fala com protocolo. Fala com sócio.',
      author: 'Regra da casa desde 1991',
      image: img('equipe.webp'),
      caption: 'Tecnologia na operação. Gente na relação.',
    },
    {
      blockType: 'ctaBand',
      variant: 'centered',
      title: 'Seu condomínio merece governança de líder.',
      text: 'Receba uma proposta sob medida em até 24 horas úteis.',
      cta: { label: 'Solicitar proposta', href: '/proposta' },
      // `.final-cta h2` de `_reference/index.html:420` — maior que o genérico
      // `20ch`/tamanho padrão que `theme.css` usa nas outras páginas.
      headingMaxWidth: '16ch',
      headingFontSize: 'clamp(2.4rem, 5.6vw, 4.6rem)',
      // Segundo caminho pra quem não quer preencher formulário.
      secondaryCta: { label: 'Falar no WhatsApp', href: WHATSAPP_URL },
    },
  ],
}
