/**
 * Página de destino de "software de gestão condominial" (30/07/2026).
 *
 * **Cuidado com a intenção de busca:** quem procura esse termo geralmente quer
 * COMPRAR um sistema, e a Semog não vende o Semog One — ele é a plataforma
 * própria que sustenta a operação. Por isso a página não finge ser um SaaS:
 * ela responde à pergunta real de quem busca ("como faço a gestão do meu
 * condomínio com tecnologia?") mostrando que a tecnologia já vem junto com a
 * administradora, sem licença, sem implantação e sem alguém do condomínio
 * virando operador de sistema. Se a intenção for comprar software, a página
 * diz isso na cara — é melhor perder o clique do que gastar atendimento.
 *
 * Regras de redação respeitadas: a Semog **assessora**, não assume a operação.
 */
import type { PageData } from '@/types/content'
import { img } from '../media'

export const softwareDeGestaoCondominial: PageData = {
  slug: 'software-de-gestao-condominial',
  title: 'Software de gestão condominial',
  meta: {
    title: 'Software de Gestão Condominial: comprar ou já vir com a administradora? | Semog',
    description:
      'O Semog One é a plataforma própria que sustenta a operação: financeiro, cobrança, assembleias, documentos e atendimento numa só tela. Sem licença, sem implantação e sem ninguém do condomínio virando operador de sistema.',
  },
  layout: [
    {
      blockType: 'hero',
      eyebrow: 'Semog One · plataforma própria',
      headline: 'A tecnologia não deveria ser problema do síndico.',
      subhead:
        'Comprar um sistema resolve metade do trabalho e cria outra: alguém precisa operar. Aqui, a plataforma já vem com a administradora — e quem opera somos nós.',
      // Mesma razão da página de prestação de contas: `semog-one.webp` é o
      // print do ERP e vira ruído atrás do título. Ele segue no bloco da
      // plataforma, abaixo, onde é a prova visual do que está sendo dito.
      poster: img('c-one.webp'),
      pageHeroOverlay: true,
      pageHeroMinHeight: '82dvh',
      pageHeroPosterOpacity: 0.6,
      pageHeroBgPosition: 'center 40%',
      pageHeroGradient:
        'linear-gradient(180deg, rgba(5,8,26,0.55) 0%, rgba(5,8,26,0.25) 45%, rgba(5,8,26,0.9) 100%)',
      pageHeroHeadlineMaxWidth: '16ch',
      ctas: [{ label: 'Solicitar proposta', href: '/proposta', variant: 'white' }],
    },

    // Diz na cara pra quem esta página NÃO é. Perder o clique errado cedo
    // custa menos que gastar atendimento com quem quer comprar licença.
    {
      blockType: 'wordsSection',
      variant: 'argument',
      text: 'A Semog <em>não vende software</em>. O Semog One é a plataforma que construímos para administrar condomínios — e ela vem junto com o contrato de administração.',
      sub: 'Se o que você procura é uma licença para operar por conta própria, esta página provavelmente não é o que você quer. Se o que você procura é gestão feita com tecnologia de verdade, continue.',
    },

    {
      blockType: 'tecnologiaRoadmap',
      eyebrow: 'A plataforma',
      title: 'Software de dono, não de prateleira.',
      text: 'A Semog tem equipe de desenvolvimento própria desde a década passada — em 2019, criamos o primeiro chatbot do setor. Hoje, toda a operação roda no Semog One, a plataforma que construímos sobre o nosso ERP.',
      intro: {
        image: img('semog-one.webp'),
        badge: 'Plataforma própria',
        name: 'Semog One',
        description:
          'A plataforma que criamos para potencializar o nosso ERP: reúne a operação numa só tela — financeiro, cobrança, assembleias, documentos e atendimento — com dashboards e indicadores em tempo real, evoluindo toda semana.',
        tags: [
          { label: 'Financeiro e cobrança' },
          { label: 'Prestação de contas digital' },
          { label: 'Assembleias' },
          { label: 'Atendimento com IA' },
          { label: 'Integração com o app' },
        ],
      },
      roadmapLabel: 'Roadmap 2026',
      steps: [
        {
          title: 'Nova prestação de contas digital',
          text: 'Entregue em junho/2026: balancete 100% digital, com documentos anexados, gráficos claros e assinatura com validade jurídica.',
          status: 'No ar',
          live: true,
        },
        {
          title: 'Chatbot de atendimento',
          text: 'Pioneiro no setor desde 2019, em evolução contínua.',
          status: 'No ar',
          live: true,
        },
        {
          title: 'Gestão de Manutenções',
          text: 'Preventivas programadas, chamados e histórico por equipamento.',
          status: 'Em desenvolvimento',
        },
        {
          title: 'Gestão de Contratos',
          text: 'Fornecedores, vigências e reajustes monitorados automaticamente.',
          status: 'Previsto para 2026',
        },
      ],
    },

    {
      blockType: 'compare',
      title: 'Comprar o sistema ou contratar quem já tem?',
      before: {
        tag: 'Comprar um software',
        items: [
          { text: 'Licença mensal por unidade, paga pelo condomínio' },
          { text: 'Implantação, migração de dados e treinamento' },
          { text: 'Alguém precisa operar: síndico, zelador ou um funcionário' },
          { text: 'Erro de lançamento é responsabilidade de quem operou' },
          { text: 'Roadmap do fornecedor, definido por outros clientes' },
        ],
      },
      after: {
        tag: 'Administração com plataforma própria',
        items: [
          { text: 'A plataforma vem no contrato de administração' },
          { text: 'Sem implantação: o condomínio entra operando' },
          { text: 'Quem opera é a equipe da Semog, com processo e revisão' },
          { text: 'Time próprio de desenvolvimento corrige e evolui toda semana' },
          { text: 'Prioridade do roadmap sai da operação real dos condomínios' },
        ],
      },
    },

    {
      blockType: 'featureGrid',
      variant: 'light',
      columns: '3',
      eyebrow: 'O que roda no Semog One',
      title: 'Uma operação inteira, numa tela só.',
      titleAccent: 'numa tela só.',
      features: [
        {
          iconSvg: '<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
          title: 'Financeiro e cobrança',
          description:
            'Boletos, conciliação bancária, inadimplência e fluxo de caixa acompanhados em tempo real.',
        },
        {
          iconSvg: '<path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h8M8 17h5"/>',
          title: 'Prestação de contas digital',
          description:
            'Balancete com documento anexado a cada lançamento e assinatura com validade jurídica.',
        },
        {
          iconSvg: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>',
          title: 'Assembleias',
          description:
            'Convocação, votação e ata organizadas no mesmo lugar, com registro de quem participou.',
        },
        {
          iconSvg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/>',
          title: 'Atendimento com IA',
          description:
            'Chatbot pioneiro no setor desde 2019, que resolve o pedido simples na hora e encaminha o complexo.',
        },
        {
          iconSvg: '<path d="M4 4h16v16H4z"/><path d="M9 4v16M4 9h5"/>',
          title: 'Documentos do condomínio',
          description:
            'Convenção, regimento, atas, contratos e apólices em um acervo que não se perde na troca de síndico.',
        },
        {
          iconSvg: '<path d="M3 3v18h18"/><path d="M7 15l4-6 4 3 5-8"/>',
          title: 'Indicadores em tempo real',
          description:
            'Dashboards de arrecadação, inadimplência e execução do orçamento, sem esperar o fim do mês.',
        },
      ],
    },

    {
      blockType: 'appShowcase',
      theme: 'deep',
      eyebrow: 'Do lado do morador',
      title: 'O condomínio inteiro na palma da mão.',
      text: 'A mesma plataforma abastece o aplicativo: boleto, reserva, assembleia, encomenda e portaria. O morador resolve sozinho, sem ligar para a administradora.',
      image: img('app-inicio.webp'),
      imageSecondary: img('app-encomenda.webp'),
      rating: { score: '4,8', label: '1.133 avaliações na App Store e no Google Play' },
      stores: {
        appStore: 'https://apps.apple.com/br/app/semog-condom%C3%ADnios/id6504202916',
        playStore: 'https://play.google.com/store/apps/details?id=br.com.semog',
      },
    },

    {
      blockType: 'propostaBand',
      background: 'gradiente',
      eyebrow: 'Proposta',
      title: 'Quer ver a plataforma por dentro?',
      text: 'Diga onde fica e como é o condomínio. Um consultor da unidade mais próxima mostra o Semog One rodando, com dado real de operação.',
      highlight: {
        value: '2019',
        label: 'é o ano do nosso primeiro chatbot — o primeiro do setor.',
      },
      proofs: [
        { label: 'Equipe de desenvolvimento própria: o sistema evolui toda semana.' },
        { label: 'Sem licença e sem implantação — vem no contrato de administração.' },
        { label: 'Proposta sem compromisso — e sem letra miúda.' },
      ],
      whatsapp: {
        label: 'Prefere conversar agora? Falar no WhatsApp',
        href: 'https://wa.me/551130034506',
      },
    },

    {
      blockType: 'faq',
      eyebrow: 'Perguntas frequentes',
      title: 'Sobre a plataforma, direto ao ponto.',
      items: [
        {
          question: 'Dá para contratar só o Semog One, sem a administração?',
          answer:
            'Não. O Semog One não é vendido como software: ele é a plataforma que sustenta o nosso serviço de administração de condomínios. Quem contrata a Semog passa a operar nela, sem custo de licença à parte.',
        },
        {
          question: 'O condomínio paga alguma coisa pela plataforma?',
          answer:
            'Não há licença, implantação nem mensalidade de sistema. A tecnologia faz parte do contrato de administração.',
        },
        {
          question: 'Quem opera o sistema no dia a dia?',
          answer:
            'A equipe da Semog. O síndico e o conselho têm acesso para acompanhar, aprovar e consultar — mas o trabalho de lançar, conciliar e cobrar é nosso. A administração do condomínio continua sendo do síndico; a Semog auxilia na execução.',
        },
        {
          question: 'E se o condomínio já usa outro sistema hoje?',
          answer:
            'A migração é feita por nós na entrada, incluindo histórico financeiro e documentos. O condomínio não precisa manter dois sistemas nem treinar ninguém.',
        },
        {
          question: 'O que garante que a plataforma continua evoluindo?',
          answer:
            'Equipe de desenvolvimento própria, com entregas contínuas — a prestação de contas digital foi entregue em junho de 2026, e gestão de manutenções e de contratos estão no roadmap. A prioridade sai da operação real dos condomínios, não da agenda de um fornecedor.',
        },
        {
          question: 'O morador precisa aprender a usar alguma coisa?',
          answer:
            'Só o aplicativo, que é feito para uso comum: boleto, reserva, assembleia e encomenda. A nota de 4,8 nas lojas, com mais de mil avaliações, é o melhor indicador disso.',
        },
      ],
    },

    {
      blockType: 'ctaBand',
      variant: 'centered',
      title: 'Gestão com tecnologia de verdade.',
      text: 'Receba uma proposta sob medida para o seu condomínio em até 24 horas úteis.',
      cta: { label: 'Solicitar proposta', href: '/proposta' },
      secondaryCta: { label: 'Falar no WhatsApp', href: 'https://wa.me/551130034506' },
    },
  ],
}
