/**
 * Dados por cidade das landings de unidade (renderizadas pelo componente
 * `CityLanding`, não pelo CMS). As partes IGUAIS entre as cidades (soluções,
 * diferenciais, passos, autoridade G20) ficam no componente; aqui só o que
 * muda por cidade. NAP fiel à `UNITS` de `src/lib/seo.ts` (mesma fonte do
 * JSON-LD, pra NAP consistente).
 */

export type CityTestimonial = { quote: string; name: string; role: string }
export type CityFaq = { question: string; answer: string }

export type CityLandingData = {
  slug: string
  city: string
  uf: string
  ufFull: string
  role: 'Matriz' | 'Filial'
  /** Foto aérea em `public/cities/<slug-curto>.jpg`. */
  image: string
  heroSubhead: string
  coverageText: string
  neighborhoods: string[]
  unit: {
    address: string
    phoneDisplay: string
    phoneHref: string
    whatsapp: string
    mapsHref: string
  }
  testimonials: CityTestimonial[]
  faq: CityFaq[]
}

const WHATSAPP = '551130034506'

function standardFaq(city: string, uf: string, region: string): CityFaq[] {
  return [
    {
      question: `Qual a melhor administradora de condomínios de ${city}?`,
      answer: `Com 35 anos de mercado, mais de 650 condomínios e presença no G20 da Superlógica, a Semog é referência no Nordeste e Norte, com unidade em ${city}/${uf} e a única prestação de contas 100% digital do mercado.`,
    },
    {
      question: `Quanto custa uma administradora em ${city}?`,
      answer:
        'Depende do porte do condomínio e dos serviços contratados. Envie os dados do seu condomínio e receba uma proposta personalizada em até 24 horas úteis, sem compromisso.',
    },
    {
      question: 'Como funciona a troca de administradora?',
      answer:
        'Aprovada a troca em assembleia, a equipe local conduz a migração completa: documentos, comunicação aos condôminos e transição financeira, sem interromper boletos nem pagamentos.',
    },
    {
      question: `Vocês atendem toda a ${region}?`,
      answer: `Sim. Atendemos ${city} e toda a região, com equipe local e atendimento próximo, do financeiro à assembleia.`,
    },
    {
      question: 'A Semog tem aplicativo?',
      answer:
        'Sim. Boletos, reservas, assembleias e avisos numa interface que o morador realmente usa, para síndicos e condôminos.',
    },
  ]
}

export const CITY_LANDINGS: Record<string, CityLandingData> = {
  recife: {
    slug: 'administradora-de-condominios-recife',
    city: 'Recife',
    uf: 'PE',
    ufFull: 'Pernambuco',
    role: 'Matriz',
    image: '/cities/recife.jpg',
    heroSubhead:
      'Tecnologia, transparência e uma equipe local que cuida do seu patrimônio como se fosse dela.',
    coverageText:
      'Da Região Metropolitana do Recife ao interior de Pernambuco, sua gestão é local de ponta a ponta. Presença especialmente forte em:',
    neighborhoods: [
      'Boa Viagem',
      'Casa Forte',
      'Graças',
      'Madalena',
      'Espinheiro',
      'Parnamirim',
      'Aflitos',
      'Pina',
      'Jaqueira',
      'Torre',
    ],
    unit: {
      address: 'R. Bartolomeu de Gusmão, 217 · Madalena',
      phoneDisplay: '(81) 3316-0265',
      phoneHref: 'tel:+558133160265',
      whatsapp: WHATSAPP,
      mapsHref: 'https://maps.google.com/?q=Semog+Bartolomeu+de+Gusmao+217+Madalena+Recife',
    },
    testimonials: [
      {
        quote:
          'Trocamos de administradora depois de anos de balancete confuso. Com a prestação de contas digital, a assembleia aprova as contas em minutos.',
        name: 'Ricardo Menezes',
        role: 'Síndico · Ed. Solar de Boa Viagem',
      },
      {
        quote:
          'O atendimento é diferenciado. A equipe resolve com rapidez e sempre nos mantém informados do que acontece no prédio.',
        name: 'Fabiana Correia',
        role: 'Conselheira · Cond. Parque das Graças',
      },
      {
        quote:
          'Relatórios e prestação de contas claros, tudo no aplicativo. Muito mais segurança e tranquilidade pra quem é síndico.',
        name: 'Juliana Rocha',
        role: 'Síndica · Res. Madalena Prime',
      },
    ],
    faq: standardFaq('Recife', 'PE', 'Grande Recife'),
  },

  'joao-pessoa': {
    slug: 'administradora-de-condominios-joao-pessoa',
    city: 'João Pessoa',
    uf: 'PB',
    ufFull: 'Paraíba',
    role: 'Filial',
    image: '/cities/joao-pessoa.jpg',
    heroSubhead:
      'Gestão local, prestação de contas 100% digital e uma equipe que trata o seu condomínio como se fosse o dela.',
    coverageText:
      'De Manaíra ao Bessa, do litoral ao interior da Paraíba, sua gestão é local e próxima. Presença especialmente forte em:',
    neighborhoods: [
      'Manaíra',
      'Tambaú',
      'Cabo Branco',
      'Bessa',
      'Aeroclube',
      'Altiplano',
      'Bancários',
      'Jardim Oceania',
      'Miramar',
      'Intermares',
    ],
    unit: {
      address: 'Av. Guarabira, 834 · Manaíra',
      phoneDisplay: '(83) 3224-1228',
      phoneHref: 'tel:+558332241228',
      whatsapp: WHATSAPP,
      mapsHref: 'https://maps.google.com/?q=Semog+Guarabira+834+Manaira+Joao+Pessoa',
    },
    testimonials: [
      {
        quote:
          'Desde que a Semog assumiu, a inadimplência caiu e a prestação de contas ficou transparente. O síndico deixou de administrar no escuro.',
        name: 'André Vasconcelos',
        role: 'Síndico · Ed. Atlântico Sul, Manaíra',
      },
      {
        quote:
          'A equipe é presente e resolve rápido. As assembleias digitais facilitaram muito a vida de quem viaja.',
        name: 'Patrícia Nóbrega',
        role: 'Conselheira · Cond. Bosque de Tambaú',
      },
      {
        quote:
          'Boletos, avisos e reservas no app. O morador usa de verdade e o clima no prédio melhorou.',
        name: 'Marcelo Fontes',
        role: 'Síndico · Res. Ponta do Cabo Branco',
      },
    ],
    faq: standardFaq('João Pessoa', 'PB', 'Grande João Pessoa'),
  },

  'campina-grande': {
    slug: 'administradora-de-condominios-campina-grande',
    city: 'Campina Grande',
    uf: 'PB',
    ufFull: 'Paraíba',
    role: 'Filial',
    image: '/cities/campina-grande.jpg',
    heroSubhead:
      'A gestão condominial da Rainha da Borborema com tecnologia própria, transparência e equipe local.',
    coverageText:
      'Do Catolé ao Centro, em toda Campina Grande e no agreste paraibano, sua gestão é local e próxima. Presença especialmente forte em:',
    neighborhoods: [
      'Catolé',
      'Mirante',
      'Alto Branco',
      'Centro',
      'Prata',
      'Liberdade',
      'Bodocongó',
      'Itararé',
      'Sandra Cavalcante',
      'Palmeira',
    ],
    unit: {
      address: 'R. José Adnoste Roberto, 1001 · Catolé',
      phoneDisplay: '(83) 3201-9039',
      phoneHref: 'tel:+558332019039',
      whatsapp: WHATSAPP,
      mapsHref: 'https://maps.google.com/?q=Semog+Jose+Adnoste+Roberto+1001+Catole+Campina+Grande',
    },
    testimonials: [
      {
        quote:
          'A migração foi tranquila, sem interromper nada. Hoje a prestação de contas é digital e o conselho acompanha tudo de perto.',
        name: 'Roberto Almeida',
        role: 'Síndico · Ed. Mirante do Catolé',
      },
      {
        quote:
          'Atendimento próximo e humano, do jeito de Campina. A cobrança deixou de ser dor de cabeça do síndico.',
        name: 'Cláudia Ferreira',
        role: 'Conselheira · Cond. Alto Branco Residence',
      },
      {
        quote:
          'Relatórios claros e time jurídico próprio. Resolveu questões que se arrastavam há anos.',
        name: 'Fernando Lira',
        role: 'Síndico · Res. Parque da Prata',
      },
    ],
    faq: standardFaq('Campina Grande', 'PB', 'região de Campina Grande'),
  },

  belem: {
    slug: 'administradora-de-condominios-belem',
    city: 'Belém',
    uf: 'PA',
    ufFull: 'Pará',
    role: 'Filial',
    image: '/cities/belem.jpg',
    heroSubhead:
      'A força de uma administradora líder do Nordeste, agora no coração da Amazônia: tecnologia, transparência e equipe local.',
    coverageText:
      'De Nazaré a Umarizal, em toda Belém e Região Metropolitana, sua gestão é local e próxima. Presença especialmente forte em:',
    neighborhoods: [
      'Umarizal',
      'Nazaré',
      'Batista Campos',
      'Marco',
      'Cremação',
      'Reduto',
      'São Brás',
      'Cidade Velha',
      'Pedreira',
      'Guamá',
    ],
    unit: {
      address: 'Av. Alcindo Cacela, 2351, Sl 201 · Cremação',
      phoneDisplay: '(91) 3115-4700',
      phoneHref: 'tel:+559131154700',
      whatsapp: WHATSAPP,
      mapsHref: 'https://maps.google.com/?q=Semog+Alcindo+Cacela+2351+Cremacao+Belem',
    },
    testimonials: [
      {
        quote:
          'Chegaram com tecnologia que não existia por aqui. A prestação de contas digital deu transparência total ao condomínio.',
        name: 'Paulo Sérgio Correa',
        role: 'Síndico · Ed. Umarizal Prime',
      },
      {
        quote:
          'Equipe atenciosa e presente. As assembleias digitais aumentaram muito a participação dos moradores.',
        name: 'Ana Beatriz Farias',
        role: 'Conselheira · Cond. Jardim de Nazaré',
      },
      {
        quote:
          'A inadimplência caiu e o financeiro ficou previsível. O condomínio recebe todo mês, sem surpresa.',
        name: 'Marcos Tavares',
        role: 'Síndico · Res. Batista Campos',
      },
    ],
    faq: standardFaq('Belém', 'PA', 'Grande Belém'),
  },
}
