/**
 * Dados por cidade das landings de unidade (renderizadas pelo componente
 * `CityLanding`, não pelo CMS). As partes IGUAIS entre as cidades (soluções,
 * diferenciais, passos, autoridade G20) ficam no componente; aqui só o que
 * muda por cidade. NAP fiel à `UNITS` de `src/lib/seo.ts` (mesma fonte do
 * JSON-LD, pra NAP consistente).
 */

import type { PropostaValues } from '@/lib/form-schemas'

export type CityTestimonial = { quote: string; name: string; role: string }
export type CityFaq = { question: string; answer: string }

export type CityLandingData = {
  slug: string
  city: string
  /**
   * Opção do campo "Cidade do condomínio" do formulário de proposta que
   * corresponde a esta praça. Declarada aqui, e não inferida do slug pelo
   * formulário, porque `cidade` é OBRIGATÓRIA desde 16/09/2026: na landing o
   * campo não é perguntado (já sabemos qual é), então ele precisa chegar
   * preenchido desde o primeiro render — inferir num efeito deixaria uma janela
   * com o campo obrigatório vazio, e um slug novo sem entrada no mapa quebraria
   * o envio em silêncio. Tipada contra o enum, então o `tsc` cobra a praça nova.
   */
  cidadeNoFormulario: PropostaValues['cidade']
  uf: string
  ufFull: string
  /**
   * Gênero do nome do estado — "o" Pernambuco, "o" Pará, "a" Paraíba. Alimenta
   * `wholeState`; obrigatório de propósito, pra uma praça nova não entrar sem
   * declarar a concordância.
   */
  ufGender: 'm' | 'f'
  /** Foto aérea em `public/cities/<slug-curto>.jpg`. */
  image: string
  /**
   * Título e descrição da SERP, escritos um a um — NÃO um template com o
   * topônimo trocado, que era o formato anterior (as quatro descrições eram a
   * mesma frase e as quatro repetiam o título dentro dela, queimando os
   * primeiros caracteres do snippet). Cada descrição aqui usa o que só aquela
   * praça tem: o bairro da unidade, os bairros atendidos e o telefone local.
   *
   * Medidos em Arial 20px (título) e 14px (descrição), que é a métrica de
   * corte do Google — alvo de 580px e 920px. "35 anos" só entra no título de
   * Recife e de Belém: em Recife a unidade tem mesmo essa idade (é a
   * fundação), em Belém a vírgula prende o número à marca, não à praça. Em
   * João Pessoa e Campina Grande o topônimo é longo e nada mais cabe sem
   * truncar — a prova social vai na descrição.
   */
  meta: { title: string; description: string }
  heroSubhead: string
  /** Parágrafo único por cidade (SEO local + evita conteúdo quase-duplicado). */
  localContext: string
  coverageText: string
  neighborhoods: string[]
  unit: {
    address: string
    phoneDisplay: string
    phoneHref: string
    whatsapp: string
    /**
     * A ficha exata do Google Business Profile desta unidade, pelo CID que a
     * própria API publica (`metadata.mapsUri`) — é o mesmo destino do `hasMap`
     * do JSON-LD (`UNITS` em `src/lib/seo.ts`). Era uma busca textual
     * (`maps.google.com/?q=Semog+...`): o botão "Como chegar" abria uma lista
     * de resultados, não a ficha, e nada ligava a landing à unidade.
     */
    mapsHref: string
  }
  /**
   * Trechos de avaliações REAIS de 5 estrelas da ficha do Google Business
   * Profile DESTA praça (até 3). Até 06/10/2026 eram depoimentos fictícios
   * herdados do protótipo, com nome, cargo e prédio inventados.
   *
   * Regras: texto citado fielmente (corte só marcado com "…", sem corrigir
   * grafia); nome abreviado como primeiro nome + inicial; `role` é só a origem
   * e o mês da avaliação — nunca cargo ou prédio. Praça sem avaliação fica com
   * lista vazia, e o componente omite a seção inteira. Não vira `Review` nem
   * `aggregateRating` no JSON-LD: avaliação republicada pela própria empresa
   * não pode ser dado estruturado.
   */
  testimonials: CityTestimonial[]
  faq: CityFaq[]
}

/** Nome próprio com o gênero que ele exige — o gênero não é dedutível do nome. */
type Gendered = { name: string; gender: 'm' | 'f' }

/**
 * "todo o Grande Recife", "toda a Paraíba" — o quantificador concorda com o
 * gênero declarado, nunca com um artigo escrito à mão. O artigo estava fixo no
 * masculino no título da unidade ("todo o Paraíba", nas duas praças da PB) e no
 * feminino na pergunta do FAQ ("toda a Grande Recife", que ainda vai pro
 * JSON-LD de FAQPage) — dois lugares, o mesmo erro, agora uma regra só.
 */
function whole(subject: Gendered): string {
  return subject.gender === 'f' ? `toda a ${subject.name}` : `todo o ${subject.name}`
}

/** "todo o Pernambuco", "toda a Paraíba", "todo o Pará" — pro título da unidade. */
export function wholeState(data: Pick<CityLandingData, 'ufFull' | 'ufGender'>): string {
  return whole({ name: data.ufFull, gender: data.ufGender })
}

const WHATSAPP = '551130034506'

function standardFaq(city: string, uf: string, region: Gendered): CityFaq[] {
  return [
    {
      question: `Qual a melhor administradora de condomínios de ${city}?`,
      answer: `Com 35 anos de mercado, mais de 650 condomínios e o 3º ciclo consecutivo no G20 da Superlógica, a Semog é referência no Nordeste e Norte, com unidade em ${city}/${uf} e prestação de contas 100% digital: balancete com assinatura de validade jurídica, documentos e gráficos abertos ao condômino.`,
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
      question: `Vocês atendem ${whole(region)}?`,
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
    cidadeNoFormulario: 'Recife e região',
    uf: 'PE',
    ufFull: 'Pernambuco',
    ufGender: 'm',
    image: '/cities/recife.jpg',
    meta: {
      title: 'Administradora de Condomínios em Recife há 35 anos | Semog',
      description:
        'Equipe própria na Madalena para Boa Viagem, Casa Forte, Graças e toda a Região Metropolitana. Contas 100% digitais e proposta em até 24h.',
    },
    heroSubhead:
      'Tecnologia, transparência e uma equipe local que cuida do seu patrimônio como se fosse dela.',
    localContext:
      'Capital pernambucana e maior economia do Norte-Nordeste, o Recife concentra uma verticalização intensa — de Boa Viagem à orla, passando por Casa Forte, Graças e Espinheiro — onde a boa gestão condominial faz diferença real no valor do imóvel. É aqui que nascem os 35 anos da Semog: a unidade do Recife reúne financeiro e contábil próprios, suporte jurídico com escritório parceiro e a tecnologia que hoje atende todo o Nordeste e o Norte. Do prédio na praia ao condomínio de bairro, a administração é conduzida por quem conhece o mercado imobiliário do Recife de perto.',
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
      mapsHref: 'https://www.google.com/maps?cid=4494775482860487078',
    },
    testimonials: [
      {
        quote:
          'Administradora moderna e com todos os serviços em aplicativos , para consulta dos condôminos ….',
        name: 'Christovam Jr.',
        role: 'Avaliação no Google · mar/2026',
      },
      {
        quote: 'Excelente atendimento. Equipe competente para administrarem o seu condomínio.',
        name: 'Marcos B.',
        role: 'Avaliação no Google · fev/2022',
      },
      {
        quote:
          'Uma empresa muito estruturada e proativa nas suas prestações de serviços, funcionários excelentes sempre a disposição para qualquer necessidade dos clientes e visitantes. Referência em administração de bens.',
        name: 'David C.',
        role: 'Avaliação no Google · out/2019',
      },
    ],
    faq: standardFaq('Recife', 'PE', { name: 'Grande Recife', gender: 'm' }),
  },

  'joao-pessoa': {
    slug: 'administradora-de-condominios-joao-pessoa',
    city: 'João Pessoa',
    cidadeNoFormulario: 'João Pessoa e região',
    uf: 'PB',
    ufFull: 'Paraíba',
    ufGender: 'f',
    image: '/cities/joao-pessoa.jpg',
    meta: {
      title: 'Administradora de Condomínios em João Pessoa | Semog',
      description:
        'Na orla — Tambaú, Cabo Branco, Bessa — muito proprietário mora fora: assembleia digital e app resolvem. Unidade em Manaíra: (83) 3224-1228.',
    },
    heroSubhead:
      'Gestão local, prestação de contas 100% digital e uma equipe que trata o seu condomínio como se fosse o dela.',
    localContext:
      'Uma das capitais que mais crescem no Nordeste, João Pessoa vive um forte adensamento no litoral — Manaíra, Cabo Branco, Tambaú e Bessa — com condomínios cada vez mais verticais e exigentes em gestão. A Semog leva à Paraíba a mesma estrutura que a tornou líder no Recife: prestação de contas 100% digital, aplicativo para moradores e uma equipe pessoense que resolve perto de você. Seja na orla ou em bairros em expansão como Altiplano e Bancários, o seu condomínio conta com gestão local de ponta a ponta.',
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
      mapsHref: 'https://www.google.com/maps?cid=1666358071032665691',
    },
    testimonials: [
      {
        quote:
          'Atendimento aconchegante e familiar! Impecável e super me ajudou. Parabéns para todos pelo trabalho 🫶🏼',
        name: 'Adila P.',
        role: 'Avaliação no Google · abr/2026',
      },
      {
        quote:
          'Gostaria de registrar formalmente a minha imensa satisfação com os serviços prestados por vocês. Como síndica profissional, sei o valor de uma administradora competente e parceira, e a Semog tem superado as minhas expectativas.',
        name: 'Nicia A.',
        role: 'Avaliação no Google · jun/2025',
      },
      {
        quote:
          'A empresa oferece serviço de qualidade atendendo as necessidades de seus clientes. Contamos com seu serviço em nosso condomínio e somos muito satisfeitos!',
        name: 'Sara A.',
        role: 'Avaliação no Google · out/2024',
      },
    ],
    faq: standardFaq('João Pessoa', 'PB', { name: 'Grande João Pessoa', gender: 'f' }),
  },

  'campina-grande': {
    slug: 'administradora-de-condominios-campina-grande',
    city: 'Campina Grande',
    cidadeNoFormulario: 'Campina Grande e região',
    uf: 'PB',
    ufFull: 'Paraíba',
    ufGender: 'f',
    image: '/cities/campina-grande.jpg',
    meta: {
      title: 'Administradora de Condomínios em Campina Grande | Semog',
      description:
        'Do Catolé ao Alto Branco e ao Mirante, com equipe campinense, tecnologia própria e prestação de contas 100% digital. (83) 3201-9039.',
    },
    heroSubhead:
      'A gestão condominial da Rainha da Borborema com tecnologia própria, transparência e equipe local.',
    localContext:
      'Rainha da Borborema e principal polo tecnológico e universitário do interior nordestino, Campina Grande combina tradição e inovação — e o mesmo vale para a gestão de condomínios. Do Catolé ao Mirante e ao Alto Branco, o mercado condominial cresce junto com a cidade, e a Semog atende com tecnologia própria e um atendimento próximo, no jeito campinense. Aqui você tem a estrutura de uma administradora líder do Nordeste sem abrir mão da proximidade que o interior valoriza.',
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
      mapsHref: 'https://www.google.com/maps?cid=13577165401970724901',
    },
    testimonials: [],
    faq: standardFaq('Campina Grande', 'PB', { name: 'região de Campina Grande', gender: 'f' }),
  },

  belem: {
    slug: 'administradora-de-condominios-belem',
    city: 'Belém',
    cidadeNoFormulario: 'Belém e região',
    uf: 'PA',
    ufFull: 'Pará',
    ufGender: 'm',
    image: '/cities/belem.jpg',
    meta: {
      title: 'Administradora de Condomínios em Belém | Semog, 35 anos',
      description:
        'Unidade na Cremação e equipe paraense para condomínios de Umarizal, Nazaré e Batista Campos, com contas 100% digitais. (91) 3115-4700.',
    },
    heroSubhead:
      'A força de uma administradora líder do Nordeste, agora no coração da Amazônia: tecnologia, transparência e equipe local.',
    localContext:
      'No coração da Amazônia, Belém une o charme histórico da Cidade Velha e do Ver-o-Peso à verticalização acelerada de Umarizal, Nazaré e Batista Campos. Levar uma gestão condominial moderna à capital paraense é a missão da Semog no Norte: tecnologia que ainda era rara por aqui, prestação de contas transparente e uma equipe local que entende as particularidades do clima e do mercado amazônico. Do edifício histórico ao lançamento de alto padrão, seu condomínio ganha a estrutura de uma das maiores administradoras do país.',
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
      mapsHref: 'https://www.google.com/maps?cid=17883612711195798886',
    },
    testimonials: [
      {
        quote:
          'Uma administradora super competente, completa em todos os níveis desde orçamentos até uma assessoria completa nas assembléias do início ao final, garantindo pra nós síndicos uma tranquilidade e harmonia nas assembléias e em toda gestão.',
        name: 'Ana Cláudia D.',
        role: 'Avaliação no Google · set/2026',
      },
      {
        quote:
          'Me ajuda em tudo. Desde o início. Comecei como síndica sem saber nada. E eles são meu braço direito',
        name: 'Izabelle A.',
        role: 'Avaliação no Google · ago/2026',
      },
      {
        quote:
          'A Semog Administradora de Condomínio tem sido uma parceira essencial na gestão dos condomínios em que atuo como síndico profissional. Quando comecei, ainda sem experiência, a administradora me ajudou muito no dia a dia da função (e sabemos que não é fácil). …',
        name: 'Josias A.',
        role: 'Avaliação no Google · abr/2026',
      },
    ],
    faq: standardFaq('Belém', 'PA', { name: 'Grande Belém', gender: 'f' }),
  },
}
