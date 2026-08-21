/**
 * Conteúdo de "Soluções" (slug `solucoes`) — port fiel de
 * `seedSolucoesPage` em `src/seed/pages.ts`, fiel a
 * `_reference/solucoes.html`. Ordem exata do ref: garante+app vêm ANTES de
 * tecnologia+clube.
 */
import type { PageData } from '@/types/content'
import { img } from '../media'

export const solucoes: PageData = {
  slug: 'solucoes',
  // Rótulo administrativo real no Payload (confirmado via GET /api/pages).
  title: 'Soluções',
  meta: {
    title: 'Soluções para Condomínios: gestão completa | Semog',
    description:
      'Gestão financeira, contábil e de pessoas, com suporte jurídico por escritório parceiro, prestação de contas 100% digital e garantia de inadimplência zero.',
  },
  layout: [
    // `.page-hero`, `_reference/solucoes.html:400-409` — mesmo
    // `residencial.webp` do `.bg` (reaproveitado também na vertical
    // "Residenciais" logo abaixo, igual ao ref).
    {
      blockType: 'hero',
      headline: 'Tudo que um condomínio precisa. E o que nenhum outro oferece.',
      subhead:
        'Gestão financeira, contábil e de pessoas, com suporte jurídico por escritório parceiro, a única prestação de contas 100% digital do mercado e garantia de inadimplência zero.',
      poster: img('residencial.webp'),
      pageHeroOverlay: true,
      pageHeroHeadlineMaxWidth: '16ch',
    },
    // As 3 verticais `#residenciais`/`#comerciais`/`#associacoes`, fiel a
    // `_reference/solucoes.html:411-484`: residenciais e comerciais em
    // `.split` alternado (comerciais com `reversed: true`), associações em
    // `.assoc` full-bleed.
    {
      blockType: 'solutionSplit',
      items: [
        {
          variant: 'split',
          anchor: 'residenciais',
          kicker: 'Condomínios Residenciais',
          title: 'O prédio funciona. O morador nem percebe.',
          text: 'Auxiliamos em toda a operação do condomínio para que síndico e moradores tenham uma única preocupação: viver bem. Financeiro em dia, funcionários cuidados, manutenção prevista e assembleias organizadas.',
          tags: [
            { label: 'Gestão financeira' },
            { label: 'Cobrança e boletos' },
            { label: 'Folha e RH do condomínio' },
            { label: 'Assembleias' },
            { label: 'Manutenção preventiva' },
            { label: 'Seguros obrigatórios' },
          ],
          image: img('residencial.webp'),
          reversed: false,
        },
        {
          variant: 'split',
          anchor: 'comerciais',
          kicker: 'Condomínios Comerciais',
          title: 'Eficiência que valoriza o metro quadrado.',
          text: 'Edifícios corporativos e centros empresariais exigem previsibilidade de custos, rateios impecáveis e fornecedores sob controle. A Semog entrega relatórios gerenciais que o conselho entende e aprova.',
          tags: [
            { label: 'Rateios e provisões' },
            { label: 'Gestão de contratos' },
            { label: 'Relatórios gerenciais' },
            { label: 'Compliance condominial' },
            { label: 'Gestão de facilities' },
            { label: 'Previsão orçamentária' },
          ],
          image: img('comercial.webp'),
          reversed: true,
        },
        {
          variant: 'assoc',
          anchor: 'associacoes',
          kicker: 'Associações',
          title: 'Governança para comunidades inteiras.',
          text: 'Loteamentos, associações de moradores e clubes têm regras próprias, receitas próprias e desafios próprios. Estruturamos estatutos, contribuições e conselhos que funcionam.',
          image: img('associacoes.webp'),
          ctaLabel: 'Solicitar proposta',
          ctaHref: '/proposta',
        },
      ],
    },
    // `.benefits.sec-light.white` > `.bento`, fiel a
    // `_reference/solucoes.html:487-520`: 5 células na ordem exata do ref.
    {
      blockType: 'benefits',
      variant: 'bento',
      eyebrow: 'Por que Semog',
      title: 'O que muda quando a Semog assume.',
      titleAccent: 'Semog assume.',
      items: [
        {
          value: '24h',
          title: 'Resposta em um dia útil',
          description: 'Demandas de síndicos e condôminos com prazo de resposta definido e cumprido.',
        },
        {
          title: 'Acesso direto aos sócios',
          description:
            'Nenhuma administradora do porte da Semog oferece isso. Aqui, é regra da casa.',
        },
        {
          value: '35',
          title: 'Anos de mercado',
          description: 'Solidez comprovada desde 1991.',
        },
        {
          title: 'Equipes locais',
          description: 'Presença física em quatro cidades.',
          image: img('blog-lazer.webp'),
        },
        {
          value: '100%',
          title: 'Digital de verdade',
          description: 'Do boleto à assembleia, tudo online.',
        },
      ],
    },
    // `#prestacao`, `_reference/solucoes.html:522-555`.
    {
      blockType: 'prestacao',
      anchor: 'prestacao',
      title: 'A prestação de contas que nenhuma outra administradora tem.',
      text: 'Desenvolvida pela Semog, ela transforma o balancete em algo que qualquer condômino entende e confia.',
      image: img('prestacao-contas.webp'),
      list: [
        {
          title: 'Todos os documentos',
          text: 'Notas, comprovantes e extratos anexados a cada lançamento.',
        },
        {
          title: 'Gráficos claros',
          text: 'Receita, despesa e evolução do fundo de reserva em visual simples.',
        },
        {
          title: 'Assinatura digital',
          text: 'Aprovação do síndico e do conselho com validade jurídica.',
        },
        {
          title: 'Sempre disponível',
          text: 'O condômino consulta quando quiser, sem pedir a ninguém.',
        },
      ],
    },
    // Captação no meio da leitura: a página tem 15 telas no celular e os três
    // CTAs existentes levavam todos pra outra página. Aqui, logo depois da
    // prestação de contas — o argumento racional mais forte da página —, com
    // ~45% da rolagem, que é onde ainda há gente lendo.
    {
      blockType: 'propostaBand',
      background: 'gradiente',
      eyebrow: 'Proposta',
      title: 'Faz sentido para o seu condomínio?',
      text: 'Diga onde fica e como é o condomínio. Um consultor da unidade mais próxima responde em até 24 horas úteis.',
      highlight: {
        value: '24h',
        label: 'é o prazo da resposta, em dias úteis.',
      },
      proofs: [
        { label: 'Prestação de contas digital, com documento anexado em cada lançamento.' },
        { label: 'Proposta sem compromisso — e sem letra miúda.' },
        { label: 'Número nenhum antes de olhar sua convenção e seu orçamento.' },
      ],
      whatsapp: {
        label: 'Prefere conversar agora? Falar no WhatsApp',
        href: 'https://wa.me/551130034506',
      },
    },
    // `#garante`, `_reference/solucoes.html:557-616` — banda com vídeo,
    // mesmo padrão `.g-band-home` da home, ANTES do App.
    {
      blockType: 'garante',
      eyebrow: 'Semog Garante',
      title: 'Inadimplência zero.',
      text: 'O único produto do mercado que garante 100% da arrecadação do condomínio, todos os meses. Uma parceria Semog + G5 Partners.',
      video: img('garante.mp4'),
      poster: img('garante.webp'),
      features: [
        {
          title: 'O condomínio recebe tudo',
          description: 'Todo mês, 100% da arrecadação prevista entra no caixa, com ou sem atrasos.',
        },
        {
          title: 'A cobrança vira problema nosso',
          description:
            'A Semog e a G5 Partners assumem a negociação com condôminos em atraso, com respeito e dentro da lei.',
        },
        {
          title: 'O orçamento vira certeza',
          description:
            'Sem buracos no fluxo de caixa: obras, manutenção e melhorias saem do papel no prazo.',
        },
        {
          title: 'O síndico dorme tranquilo',
          description:
            'Sem constrangimento com vizinhos e sem assembleia tensa por causa de devedores.',
        },
      ],
      cta: { label: 'Solicitar proposta', href: '/proposta' },
      priceChip: { value: '1%', label: 'da arrecadação. Sem taxa de adesão, sem letra miúda.' },
      note: '1% da arrecadação. Sem taxa de adesão, sem letra miúda.',
    },
    // `#aplicativo`, `_reference/solucoes.html:618-642` — `.app-media` com
    // `app-phone.webp`.
    {
      blockType: 'appShowcase',
      anchor: 'aplicativo',
      eyebrow: 'Aplicativo',
      title: 'Um aplicativo que o morador usa de verdade.',
      text: 'Nada de portal que ninguém acessa. O app da Semog concentra o dia a dia do condomínio em uma interface simples, no bolso de cada morador.',
      image: img('app-phone.webp'),
      features: [
        { title: 'Boletos e segunda via', description: 'Histórico completo e pagamento na hora.' },
        { title: 'Reservas', description: 'Salão de festas, churrasqueira e quadra.' },
        { title: 'Assembleias e votações', description: 'Participação e voto de onde estiver.' },
        { title: 'Avisos', description: 'Comunicados da administração em tempo real.' },
        { title: 'Ocorrências', description: 'Registro e acompanhamento transparente.' },
        { title: 'Documentos', description: 'Convenção, atas e regulamentos sempre à mão.' },
      ],
    },
    // `#tecnologia`, `_reference/solucoes.html:645-691`.
    {
      blockType: 'tecnologiaRoadmap',
      anchor: 'tecnologia',
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
    // `#beneficios` (Clube de benefícios), `_reference/solucoes.html:693-724`.
    {
      blockType: 'clubeBeneficios',
      anchor: 'beneficios',
      title: 'Ser Semog também vale fora do boleto.',
      text: 'Condomínios e moradores Semog têm acesso a um clube de vantagens negociado pela nossa escala de 650 condomínios.',
      items: [
        {
          title: 'Internet mais barata',
          text: 'Planos coletivos negociados com provedores parceiros para o condomínio inteiro.',
        },
        {
          title: 'Desconto com fornecedores',
          text: 'Rede homologada de manutenção, limpeza, jardinagem e segurança com preço de escala.',
        },
        {
          title: 'Seguros em condições especiais',
          text: 'Seguro obrigatório e coberturas adicionais com corretoras parceiras.',
        },
        {
          title: 'Vantagens para moradores',
          text: 'Convênios com farmácias, academias e serviços locais em cada cidade Semog.',
        },
      ],
      note: 'O catálogo completo de parceiros é atualizado mensalmente e divulgado no aplicativo Semog.',
    },
    {
      blockType: 'faq',
      title: 'Perguntas frequentes.',
      items: [
        {
          question: 'Em que a Semog assessora o condomínio?',
          answer:
            'Atendemos condomínios residenciais, condomínios comerciais e associações de moradores ou loteamentos. Auxiliamos na gestão financeira, na contabilidade, no departamento pessoal, nas assembleias, na manutenção e nos seguros — a administração do condomínio cabe ao síndico, que decide e responde por ele; a Semog assessora e executa com método.',
        },
        {
          question: 'Como funciona o Semog Garante?',
          answer:
            'Em parceria com a G5 Partners, garantimos 100% da arrecadação prevista do condomínio, todos os meses, mesmo com condôminos em atraso. A cobrança fica por nossa conta e o custo é de 1% da arrecadação.',
        },
        {
          question: 'Como funciona a prestação de contas digital?',
          answer:
            'É 100% digital: cada lançamento traz documentos e comprovantes anexados, os números viram gráficos fáceis de ler e a aprovação acontece com assinatura digital de validade jurídica. Qualquer condômino consulta a qualquer hora.',
        },
        {
          question: 'Em quais cidades a Semog atua?',
          answer:
            'Unidades em Recife (PE), João Pessoa (PB), Campina Grande (PB) e Belém (PA), com equipe local em cada cidade.',
        },
        {
          question: 'Como migrar meu condomínio para a Semog?',
          answer:
            'Nossa equipe conduz a transição de ponta a ponta: auditoria de documentos, comunicação aos condôminos e migração dos dados, sem interromper a operação do condomínio.',
        },
      ],
    },
    {
      blockType: 'ctaBand',
      variant: 'centered',
      title: 'Pronto para uma gestão sem surpresas?',
      text: 'Conte como é o seu condomínio e receba uma proposta em até 24 horas úteis.',
      cta: { label: 'Solicitar proposta', href: '/proposta' },
    },
  ],
}
