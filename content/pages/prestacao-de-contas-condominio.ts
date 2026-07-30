/**
 * Página de destino de "prestação de contas de condomínio" (30/07/2026).
 *
 * Existe porque `/solucoes` disputava sozinha três buscas distintas —
 * prestação de contas, aplicativo e software de gestão — dentro de um único
 * documento de 15 telas, ranqueando mal para todas. Esta página aprofunda um
 * tema só; a `/solucoes` mantém o resumo e linka pra cá (`#prestacao`).
 *
 * Regras de redação respeitadas (ver memória de conformidade): a Semog
 * **assessora**, não assume a operação — a administração cabe ao síndico; e
 * "validade jurídica" da assinatura digital continua correto (é o termo do
 * documento, não oferta de serviço jurídico).
 */
import type { PageData } from '@/types/content'
import { img } from '../media'

export const prestacaoDeContasCondominio: PageData = {
  slug: 'prestacao-de-contas-condominio',
  title: 'Prestação de contas de condomínio',
  meta: {
    title: 'Prestação de Contas de Condomínio: como funciona e o que exigir | Semog',
    description:
      'Balancete mensal com nota e comprovante anexados a cada lançamento, gráficos que o condômino entende e assinatura digital com validade jurídica. Veja como a Semog presta contas em Recife, João Pessoa, Campina Grande e Belém.',
  },
  layout: [
    {
      blockType: 'hero',
      eyebrow: 'Prestação de contas',
      headline: 'Conta clara não gera assembleia tensa.',
      subhead:
        'Todo mês, o condomínio recebe um balancete que qualquer morador abre no celular e entende — com o documento de cada despesa anexado ao lançamento.',
      // Abstrata de propósito: `prestacao-contas.webp` é o print da tela, cheio
      // de texto próprio, e brigava com o título. Ele continua na página, no
      // bloco `prestacao`, onde é conteúdo e não pano de fundo.
      poster: img('c-prestacao.webp'),
      pageHeroOverlay: true,
      pageHeroMinHeight: '82dvh',
      pageHeroPosterOpacity: 0.6,
      pageHeroBgPosition: 'center 35%',
      pageHeroGradient:
        'linear-gradient(180deg, rgba(5,8,26,0.5) 0%, rgba(5,8,26,0.2) 45%, rgba(5,8,26,0.88) 100%)',
      pageHeroHeadlineMaxWidth: '15ch',
      ctas: [{ label: 'Solicitar proposta', href: '/proposta', variant: 'white' }],
    },

    // O problema, na voz do síndico. Ancora a página no incômodo real antes
    // de falar de solução — é o que separa esta página de um folheto.
    {
      blockType: 'wordsSection',
      variant: 'problem',
      text: 'O balancete chega em PDF, com <em>siglas que ninguém decifra</em> e um saldo no fim. Quem quiser conferir uma nota, pede. Quem pedir, espera.',
    },

    {
      blockType: 'prestacao',
      eyebrow: 'Como a Semog presta contas',
      title: 'A prestação de contas que nenhuma outra administradora tem.',
      text: 'Desenvolvida pela Semog e entregue em junho de 2026, ela transforma o balancete em algo que qualquer condômino entende e confia.',
      image: img('prestacao-contas.webp'),
      list: [
        {
          title: 'Todos os documentos',
          text: 'Notas, comprovantes e extratos anexados a cada lançamento — sem precisar pedir.',
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
          text: 'O condômino consulta quando quiser, pelo aplicativo, sem pedir a ninguém.',
        },
      ],
    },

    {
      blockType: 'featureGrid',
      variant: 'light',
      columns: '3',
      eyebrow: 'O que vai no balancete',
      title: 'Tudo que o conselho precisa para aprovar sem dúvida.',
      titleAccent: 'sem dúvida.',
      features: [
        {
          iconSvg: '<path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h8M8 17h5"/>',
          title: 'Receitas e despesas do mês',
          description:
            'Cada linha com data, fornecedor, categoria e o documento que a comprova.',
        },
        {
          iconSvg: '<path d="M3 3v18h18"/><path d="M7 15l4-6 4 3 5-8"/>',
          title: 'Comparativo com o previsto',
          description:
            'O realizado ao lado do orçamento aprovado, para o desvio aparecer cedo.',
        },
        {
          iconSvg: '<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
          title: 'Saldos e conciliação bancária',
          description: 'Extrato da conta do condomínio conciliado com o que foi lançado.',
        },
        {
          iconSvg: '<path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6Z"/>',
          title: 'Fundo de reserva',
          description: 'Quanto entrou, quanto saiu e a evolução do saldo ao longo do ano.',
        },
        {
          iconSvg: '<path d="M16 3h5v5"/><path d="M21 3 10 14"/><path d="M21 14v7H3V3h7"/>',
          title: 'Inadimplência do período',
          description:
            'Quanto foi arrecadado do previsto e em que estágio está cada cobrança.',
        },
        {
          iconSvg:
            '<path d="M20 6 9 17l-5-5"/><path d="M22 12a10 10 0 1 1-5-8.66"/>',
          title: 'Aprovação registrada',
          description:
            'Assinatura digital do síndico e do conselho, com data e validade jurídica.',
        },
      ],
    },

    {
      blockType: 'processoTimeline',
      eyebrow: 'O ciclo do mês',
      title: 'Do lançamento à aprovação, sem correria no fim.',
      items: [
        {
          iconSvg: '<path d="M4 4h16v16H4z"/><path d="M8 2v4M16 2v4M4 10h16"/>',
          title: 'Durante o mês',
          text: 'Cada pagamento é lançado com a nota anexada na hora. Nada fica para depois, então não existe o esforço de "fechar o mês" catando documento.',
        },
        {
          iconSvg: '<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
          title: 'Virada do mês',
          text: 'Conciliação bancária e fechamento. O balancete é gerado com receita, despesa, saldos, fundo de reserva e comparativo com o orçamento aprovado.',
        },
        {
          iconSvg: '<path d="M20 6 9 17l-5-5"/>',
          title: 'Síndico e conselho revisam',
          text: 'A revisão é digital: quem aprova abre o documento, confere lançamento por lançamento e assina. Dúvida vira comentário, não vira ligação.',
        },
        {
          iconSvg: '<path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6Z"/>',
          title: 'Publicado para o condomínio',
          text: 'O balancete aprovado fica no aplicativo, disponível para qualquer condômino, a qualquer hora, com todos os anexos.',
        },
      ],
    },

    {
      blockType: 'compare',
      title: 'O que muda na prática.',
      before: {
        tag: 'Prestação de contas comum',
        items: [
          { text: 'PDF com siglas e um saldo no fim' },
          { text: 'Documento só chega se o condômino pedir' },
          { text: 'Conferência acontece na véspera da assembleia' },
          { text: 'Aprovação por ata, sem rastro de quem conferiu o quê' },
          { text: 'Dúvida de morador vira ligação para a administradora' },
        ],
      },
      after: {
        tag: 'Prestação de contas Semog',
        items: [
          { text: 'Balancete visual, com gráficos que o morador entende' },
          { text: 'Nota e comprovante anexados a cada lançamento' },
          { text: 'Conselho confere ao longo do mês, no celular' },
          { text: 'Assinatura digital com data e validade jurídica' },
          { text: 'O condômino consulta sozinho, quando quiser' },
        ],
      },
    },

    {
      blockType: 'propostaBand',
      background: 'gradiente',
      eyebrow: 'Proposta',
      title: 'Quer ver como ficaria a conta do seu condomínio?',
      text: 'Diga onde fica e como é o condomínio. Um consultor da unidade mais próxima mostra a prestação de contas por dentro.',
      highlight: {
        value: '24h',
        label: 'é o prazo da resposta, em dias úteis.',
      },
      proofs: [
        { label: 'Nota e comprovante anexados a cada lançamento, todo mês.' },
        { label: 'Proposta sem compromisso — e sem letra miúda.' },
        { label: 'Número nenhum antes de olhar sua convenção e seu orçamento.' },
      ],
      whatsapp: {
        label: 'Prefere conversar agora? Falar no WhatsApp',
        href: 'https://wa.me/551130034506',
      },
    },

    {
      blockType: 'faq',
      eyebrow: 'Perguntas frequentes',
      title: 'Prestação de contas, sem rodeio.',
      items: [
        {
          question: 'Com que frequência o condomínio recebe a prestação de contas?',
          answer:
            'Todo mês. O balancete do mês anterior é fechado e disponibilizado para o síndico e o conselho revisarem, e depois de aprovado fica publicado no aplicativo para qualquer condômino consultar.',
        },
        {
          question: 'Quem aprova o balancete?',
          answer:
            'O síndico e o conselho fiscal, digitalmente, com assinatura de validade jurídica. A prestação de contas anual continua sendo submetida à assembleia, como manda a convenção — o que muda é que ela chega lá já conferida, mês a mês, em vez de ser reconstruída no fim do exercício.',
        },
        {
          question: 'Qualquer condômino pode ver os documentos?',
          answer:
            'Sim. Notas, comprovantes e extratos ficam anexados a cada lançamento e disponíveis no aplicativo, sem precisar pedir à administradora nem ao síndico.',
        },
        {
          question: 'A Semog decide como o dinheiro do condomínio é gasto?',
          answer:
            'Não. As decisões são do síndico e da assembleia, dentro do orçamento aprovado. A Semog auxilia na execução, no registro e na comprovação de cada movimento — quem administra o condomínio é o síndico.',
        },
        {
          question: 'E se o conselho encontrar um lançamento errado?',
          answer:
            'Ele aponta na própria revisão, antes de assinar. A correção é feita e o balancete volta para conferência. Como a revisão é digital, fica registrado quem conferiu e quando.',
        },
        {
          question: 'Isso vale para condomínio de qualquer tamanho?',
          answer:
            'Vale. O mesmo padrão de prestação de contas é entregue a todos os condomínios sob gestão da Semog, de prédios pequenos a associações com centenas de unidades, nas quatro praças onde atuamos.',
        },
      ],
    },

    {
      blockType: 'ctaBand',
      variant: 'centered',
      title: 'Conta clara todo mês.',
      text: 'Receba uma proposta sob medida para o seu condomínio em até 24 horas úteis.',
      cta: { label: 'Solicitar proposta', href: '/proposta' },
      secondaryCta: { label: 'Falar no WhatsApp', href: 'https://wa.me/551130034506' },
    },
  ],
}
