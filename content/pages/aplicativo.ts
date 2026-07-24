import type { PageData } from '@/types/content'
import { img } from '../media'

/**
 * Página `/aplicativo` — vende o app pro síndico na metade de cima e ensina o
 * morador na de baixo. Conteúdo aprovado no mockup; os 7 guias de passo a passo
 * são o núcleo pronto (as abas de vídeo e material entram quando o cliente
 * gravar/produzir — o `learnCenter` só mostra a aba "Passo a passo" enquanto
 * `videos`/`materials` estiverem vazios).
 *
 * Telas do app: as duas telas provisórias já no storage (`app-inicio`,
 * `app-encomenda`) — prints reais da loja com os rótulos apagados, até o cliente
 * regravar. Loja: URLs reais das fichas (App Store id 6504202916, Play
 * br.com.semog). Nota 4,8 conferida nas duas lojas em 23/07/2026.
 *
 * Links: os CTAs de proposta apontam pra `/proposta`; o do morador aponta pra
 * ficha do Google Play. Quando esta página for pro ar, trocar o `APP_HREF` da
 * home (`content/pages/home.ts`, hoje `/solucoes#aplicativo`) pra `/aplicativo`.
 */

const STORES = {
  appStore: 'https://apps.apple.com/br/app/semog-condom%C3%ADnios/id6504202916',
  playStore: 'https://play.google.com/store/apps/details?id=br.com.semog',
}

export const aplicativo: PageData = {
  slug: 'aplicativo',
  title: 'Aplicativo',
  meta: {
    title: 'Aplicativo Semog | O condomínio inteiro na palma da mão',
    description:
      'Boleto, reserva de área comum, assembleia virtual, encomendas e liberação de visitante pelo celular. Nota 4,8 na App Store e no Google Play. Grátis para o morador.',
  },
  layout: [
    {
      blockType: 'appHero',
      eyebrow: 'Aplicativo Semog',
      headline: 'O condomínio inteiro na palma da mão.',
      lead: 'Boleto, reserva de área comum, assembleia, encomenda e liberação de visitante. O morador resolve pelo celular, o síndico acompanha tudo e a administradora para de ser central telefônica.',
      rating: { score: '4,8', label: '1.133 avaliações · 10 mil+ downloads no Android' },
      stores: STORES,
      footnote:
        'Grátis para o morador. Disponível para todos os condomínios administrados pela Semog.',
      screens: [{ image: img('app-inicio.webp') }, { image: img('app-encomenda.webp') }],
    },
    {
      blockType: 'featureGrid',
      variant: 'light',
      columns: '3',
      eyebrow: 'Para o morador',
      title: 'O que antes era um telefonema, agora são dois toques.',
      features: [
        {
          iconSvg: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 9.5h19M6 15h4"/>',
          title: 'Taxa do condomínio',
          description:
            'Boleto do mês, 2ª via, boletos pagos, comprovante e troca da forma de pagamento — sem pedir para ninguém.',
        },
        {
          iconSvg:
            '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/><circle cx="9" cy="14.5" r="1.1"/><circle cx="15" cy="14.5" r="1.1"/>',
          title: 'Reserva de áreas comuns',
          description:
            'Calendário com o que está livre, aprovado e bloqueado. Reserva e cancelamento pelo celular.',
        },
        {
          iconSvg: '<path d="M5 21V9.5l7-5.5 7 5.5V21"/><path d="M9.5 14.2l1.8 1.8 3.4-3.6"/>',
          title: 'Assembleia virtual ou híbrida',
          description:
            'Participação e voto em pauta pelo aplicativo, com registro. Quem não pode ir continua decidindo.',
        },
        {
          iconSvg: '<path d="M3 7.6L12 3l9 4.6v8.8L12 21l-9-4.6z"/><path d="M3 7.6L12 12m0 0l9-4.4M12 12v9"/>',
          title: 'Encomendas',
          description:
            'Aviso quando chega, código e QR para retirada na portaria, e controle de quem pode retirar.',
        },
        {
          iconSvg: '<path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
          title: 'Documentos e comunicados',
          description:
            'Convenção, atas, balancetes e avisos oficiais sempre à mão, com registro de leitura.',
        },
        {
          iconSvg: '<path d="M12 3.5L21.5 20H2.5z"/><path d="M12 10v4.2M12 17.2v.1"/>',
          title: 'Ocorrências e fale com o síndico',
          description:
            'Abertura de ocorrência da unidade e canal direto com o síndico e com a portaria.',
        },
        {
          iconSvg:
            '<path d="M20 14.5a2.5 2.5 0 01-2.5 2.5H8l-4 3.5V6.5A2.5 2.5 0 016.5 4h11A2.5 2.5 0 0120 6.5z"/><path d="M8.5 9h7M8.5 12.5h4"/>',
          title: 'Conversas do condomínio',
          description:
            'Salas para comunicados oficiais, grupos por assunto e chat privado com o vizinho. Dá para silenciar ou sair.',
        },
        {
          iconSvg:
            '<path d="M4 16.5v2a1 1 0 001 1h1.5a1 1 0 001-1v-2M15.5 16.5v2a1 1 0 001 1H18a1 1 0 001-1v-2"/><path d="M3.5 16.5h16v-4l-1.8-4.6A2 2 0 0015.8 6.5H7.2a2 2 0 00-1.9 1.4L3.5 12.5z"/><path d="M6.8 14.2h.1M16.1 14.2h.1"/>',
          title: 'Veículos e moradores',
          description: 'Cadastro de veículos e de moradores da unidade, unificado e sempre atualizado.',
        },
        {
          iconSvg:
            '<path d="M3 21V8l6-4v17M9 21h12V11l-6-3"/><path d="M5.6 11h.8M5.6 14.5h.8M12.4 13.2h.8M12.4 16.6h.8M17 13.2h.8M17 16.6h.8"/>',
          title: 'Mais de um imóvel',
          description:
            'Quem tem imóvel em mais de um condomínio troca de unidade dentro do mesmo aplicativo.',
        },
      ],
    },
    {
      // O tipo `solutionSplit` estrutura tudo em `items[]` (kicker/title/text/
      // tags/image), sem footnote — os 4 pontos de acesso viram pílulas (`tags`)
      // e a ressalva de controle de acesso entra no `text` (não há campo próprio).
      blockType: 'solutionSplit',
      items: [
        {
          variant: 'split',
          kicker: 'Portaria e controle de acesso',
          title: 'A portaria deixa de ser um gargalo.',
          text: 'O morador libera quem vai entrar antes de a pessoa chegar — a portaria recebe pronto, confere e libera. O controle de acesso depende do plano contratado e do equipamento instalado no condomínio, e não substitui o porteiro presencial.',
          tags: [
            { label: 'Convite por link' },
            { label: 'Autocadastro facial' },
            { label: 'Prestadores e entregas' },
            { label: 'Entradas e saídas' },
          ],
          image: img('app-inicio.webp'),
        },
      ],
    },
    {
      blockType: 'pillars',
      variant: 'columns',
      light: true,
      tightTop: false,
      items: [
        {
          title: 'Menos grupo de WhatsApp, mais registro',
          text: 'Comunicado oficial que fica registrado, ocorrências com histórico, reservas aprovadas com critério e um canal direto com o morador — sem o mandato virar plantão no celular pessoal.',
        },
        {
          title: 'Autosserviço é o que mantém a conta em dia',
          text: 'Boleto, documento e reserva resolvidos no aplicativo são ligações que não acontecem. Sobra tempo do nosso time para o que exige gente: financeiro, jurídico e assembleia.',
        },
      ],
    },
    {
      blockType: 'processoTimeline',
      eyebrow: 'Já moro em um condomínio Semog',
      title: 'Três passos e você está dentro.',
      items: [
        {
          iconSvg: '<path d="M12 3v11M8 10.5l4 4 4-4"/><path d="M4.5 20h15"/>',
          title: 'Baixe o aplicativo',
          text: 'Procure por Semog Condomínios na App Store ou no Google Play, ou use o link e o QR Code distribuídos no seu condomínio.',
        },
        {
          iconSvg: '<path d="M12 3l7 3v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6z"/><path d="M9 11.8l2 2 4-4.2"/>',
          title: 'Valide seus dados',
          text: 'Confirme o e-mail ou o documento com os mesmos dados do cadastro do condomínio. É essa validação que garante que só quem mora ali entra.',
        },
        {
          iconSvg: '<circle cx="12" cy="12" r="9"/><path d="M8 12.4l2.6 2.6 5.4-5.8"/>',
          title: 'Pronto',
          text: 'Boletos, reservas, documentos e conversas liberados. Ative as notificações para não perder aviso de encomenda e comunicado.',
        },
      ],
    },
    {
      blockType: 'learnCenter',
      eyebrow: 'Aprenda a usar',
      title: 'Ninguém deveria precisar ligar para aprender a usar um aplicativo.',
      lead: 'Vídeo curto, passo a passo escrito e material pronto para o condomínio divulgar. Tudo em um lugar só, para o morador resolver na hora e o síndico não virar suporte técnico.',
      // `videos` e `materials` entram quando existirem — só a aba "Passo a passo"
      // aparece enquanto isso, e é ela que o Google indexa.
      guides: [
        {
          title: 'Primeiro acesso e validação de dados',
          steps: [
            {
              text: 'Baixe Semog Condomínios na App Store ou no Google Play, ou use o link e o QR Code distribuídos no condomínio.',
            },
            { text: 'Abra o aplicativo e toque no banner Conecte-se e em Autorizar.' },
            {
              text: 'Escolha validar por e-mail ou por documento. Use os mesmos dados que constam no cadastro feito pela administração.',
            },
            {
              text: 'Por e-mail: acesse a caixa de entrada e clique no link de validação. Por documento: tire as fotos seguindo as orientações da tela e aguarde a conferência.',
            },
            { text: 'Validado, o condomínio e a sua unidade aparecem liberados no menu.' },
          ],
          note: 'Não recebeu o e-mail? Confira a caixa de spam e se o endereço é o mesmo do cadastro. Se estiver diferente, peça a atualização cadastral antes de tentar de novo.',
        },
        {
          title: 'Boleto, 2ª via e comprovante',
          steps: [
            { text: 'No menu Condomínio, toque em Taxas do Condomínio.' },
            { text: 'O boleto do mês aparece no topo, com código de barras para copiar ou pagar direto.' },
            { text: 'Toque em um boleto já quitado para baixar o comprovante.' },
            {
              text: 'Em Formas de Pagamento você troca entre boleto, débito automático e as opções liberadas pelo condomínio.',
            },
          ],
          note: 'Boleto do mês ainda não apareceu? A emissão segue o calendário do condomínio — normalmente ele fica disponível alguns dias antes do vencimento.',
        },
        {
          title: 'Reservar e cancelar área comum',
          steps: [
            { text: 'Em Condomínio, abra Reservas e escolha a área e o turno.' },
            {
              text: 'No calendário, verde é aprovada, azul é reserva de outro morador, vermelho é data bloqueada e cinza é indisponível.',
            },
            { text: 'Escolha a data livre e toque em Continuar para confirmar.' },
            {
              text: 'Para cancelar, abra a reserva na lista e escolha cancelar — respeitando o prazo definido na convenção.',
            },
          ],
          note: 'Algumas áreas cobram taxa de reserva, que entra na taxa condominial do mês seguinte conforme a regra do seu condomínio.',
        },
        {
          title: 'Liberar visitante, prestador e entrega',
          steps: [
            { text: 'Em Portaria, escolha Visitantes ou Prestadores.' },
            { text: 'Defina a data, se é por um dia ou recorrente, e se é pedestre ou veículo.' },
            { text: 'Envie o link de convite. O próprio convidado preenche os dados dele antes de chegar.' },
            { text: 'Na portaria, a liberação já aparece pronta: é só conferir e liberar.' },
          ],
          note: 'Para entrada sem parar na portaria, cadastre a biometria facial em Portaria → Moradores. Depende do equipamento instalado no seu condomínio.',
        },
        {
          title: 'Retirar encomenda',
          steps: [
            { text: 'Você recebe uma notificação assim que a portaria registra a encomenda.' },
            {
              text: 'Em Portaria → Encomendas, abra a encomenda para ver tipo, data de recebimento e código de retirada.',
            },
            { text: 'Apresente o QR Code na portaria para retirar.' },
          ],
          note: 'Outro morador pode retirar por você se estiver cadastrado na unidade e autorizado pelo proprietário ou inquilino.',
        },
        {
          title: 'Assembleia: participar e votar',
          steps: [
            { text: 'Em Condomínio → Assembleias, abra a assembleia aberta no momento.' },
            { text: 'Acompanhe a pauta em andamento e o material anexado pelo síndico.' },
            { text: 'Toque na opção desejada para registrar o seu voto enquanto a pauta estiver aberta.' },
          ],
          note: 'Em assembleia híbrida o voto pelo aplicativo tem o mesmo peso do voto presencial e fica registrado em ata.',
        },
        {
          title: 'Conversas, avisos e notificações',
          steps: [
            {
              text: 'Na aba Conversas ficam a sala oficial do condomínio, as salas por assunto e os chats privados.',
            },
            { text: 'Toque no nome da sala para silenciar as notificações ou sair, quando ela for opcional.' },
            {
              text: 'Ative as notificações do aplicativo nos ajustes do celular para não perder aviso de encomenda e comunicado.',
            },
          ],
          note: 'A sala oficial de comunicados não pode ser desativada — é por ela que o síndico envia o aviso que precisa chegar a todos.',
        },
      ],
    },
    {
      blockType: 'faq',
      dark: true,
      eyebrow: 'Dúvidas',
      title: 'O que perguntam antes de baixar.',
      items: [
        {
          question: 'O aplicativo é gratuito?',
          answer:
            'Sim, para o morador. Alguns módulos, como o controle de acesso, dependem do plano contratado pelo condomínio.',
        },
        {
          question: 'Meus dados estão seguros?',
          answer:
            'O aplicativo está em conformidade com a LGPD. Só quem mora no condomínio tem acesso às informações e às conversas, e os dados sensíveis ficam ocultos — por isso existe a validação de cadastro.',
        },
        {
          question: 'Por que preciso validar meu cadastro?',
          answer:
            'A validação liga a sua conta à sua unidade. Sem ela, qualquer pessoa poderia ver comunicados, documentos e conversas do seu condomínio.',
        },
        {
          question: 'Dá para usar no computador?',
          answer: 'Sim. As funções principais também estão disponíveis pelo navegador.',
        },
        {
          question: 'Tenho imóvel em mais de um condomínio.',
          answer: 'Um cadastro só atende todos. Você troca de unidade dentro do aplicativo.',
        },
        {
          question: 'Sou síndico e quero o aplicativo no meu condomínio.',
          answer:
            'O aplicativo faz parte da administração Semog. Peça uma proposta e a implantação entra junto.',
        },
      ],
    },
    {
      blockType: 'ctaBand',
      variant: 'dual',
      title: 'Cada um segue por um caminho.',
      cta: { label: 'Solicitar proposta', href: '/proposta' },
      paths: [
        {
          title: 'Sou síndico ou conselheiro',
          text: 'Quero o aplicativo, a prestação de contas digital e o Garante no meu condomínio.',
          cta: { label: 'Solicitar proposta', href: '/proposta' },
        },
        {
          title: 'Moro em um condomínio Semog',
          text: 'Quero baixar o aplicativo e resolver boleto, reserva e encomenda pelo celular.',
          cta: { label: 'Baixar o aplicativo', href: STORES.playStore },
        },
      ],
    },
  ],
}
