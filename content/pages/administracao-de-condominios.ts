/**
 * Conteúdo de "Administração de condomínios" (slug
 * `administracao-de-condominios`) — port fiel de `seedAdministracaoPage` em
 * `src/seed/pages.ts`, fiel a
 * `_reference/administracao-de-condominios.html`.
 */
import type { PageData } from '@/types/content'
import { img } from '../media'

export const administracaoDeCondominios: PageData = {
  slug: 'administracao-de-condominios',
  // Rótulo administrativo real no Payload (confirmado via GET /api/pages) —
  // fallback de `<title>`/nome do breadcrumb quando `meta.title` está vazio.
  title: 'Administração de condomínios',
  layout: [
    // `.page-hero`, `_reference/administracao-de-condominios.html:61-77`:
    // números próprios desta página (88dvh, opacidade 0.85,
    // `background-position: center 40%`, gradiente com parada intermediária
    // a 45%).
    {
      blockType: 'hero',
      eyebrow: 'O serviço principal da Semog',
      headline: 'Administração de condomínios, por inteiro.',
      subhead:
        'Do boleto à assembleia, assumimos a operação para o síndico decidir com tranquilidade e o morador só morar.',
      poster: img('c-chave.webp'),
      pageHeroOverlay: true,
      pageHeroMinHeight: '88dvh',
      pageHeroPosterOpacity: 0.85,
      pageHeroBgPosition: 'center 40%',
      pageHeroGradient:
        'linear-gradient(180deg, rgba(5,8,26,0.45) 0%, rgba(5,8,26,0.15) 45%, rgba(5,8,26,0.85) 100%)',
      pageHeroHeadlineMaxWidth: '16ch',
      ctas: [{ label: 'Solicitar proposta', href: '/proposta', variant: 'white' }],
    },
    // `.svc.sec-light` > `.svc-grid`, `_reference/administracao-de-
    // condominios.html:230-286`: 9 `.svc-card` com SVG inline (markup
    // verbatim do ref, sem a tag <svg> em volta).
    {
      blockType: 'featureGrid',
      variant: 'light',
      eyebrow: 'O que fazemos',
      title: 'Tudo que o condomínio precisa, em um só contrato.',
      titleAccent: 'em um só contrato.',
      features: [
        {
          iconSvg: '<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
          title: 'Gestão financeira',
          description:
            'Boletos, contas a pagar, fluxo de caixa, previsão orçamentária e fundo de reserva sob controle.',
        },
        {
          iconSvg: '<path d="M3 3v18h18"/><path d="M7 15l4-6 4 3 5-8"/>',
          title: 'Cobrança e inadimplência',
          description:
            'Régua de cobrança profissional e, com o Semog Garante, receita 100% assegurada em contrato.',
        },
        {
          iconSvg:
            '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/>',
          title: 'Contabilidade e prestação de contas',
          description:
            'Balancetes, obrigações fiscais e a única prestação de contas 100% digital do mercado.',
        },
        {
          iconSvg:
            '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
          title: 'Departamento pessoal',
          description:
            'Folha, férias, encargos e rotinas trabalhistas dos funcionários do condomínio, sem risco para o síndico.',
        },
        {
          iconSvg: '<path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6Z"/>',
          title: 'Jurídico condominial',
          description:
            'Convenção, regimento, notificações, acordos e suporte em conflitos, com advogados especializados.',
        },
        {
          iconSvg:
            '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>',
          title: 'Assembleias',
          description:
            'Convocação, condução, ata e votação digital pelo aplicativo, presencial ou online.',
        },
        {
          iconSvg:
            '<path d="M14.7 6.3a5 5 0 0 0-7.07 7.07l-4.35 4.35a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l4.35-4.35a5 5 0 0 0 7.07-7.07l-2.83 2.83-2.12-2.12Z"/>',
          title: 'Manutenção e fornecedores',
          description:
            'Preventivas, orçamentos comparados e rede homologada com preço de escala de 650 condomínios.',
        },
        {
          iconSvg:
            '<path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6Z"/><path d="m9 12 2 2 4-4"/>',
          title: 'Seguros obrigatórios',
          description:
            'Cotação, contratação e renovação do seguro condominial em condições especiais.',
        },
        {
          iconSvg: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
          title: 'Atendimento e comunicação',
          description:
            'Canal direto com síndicos e moradores: aplicativo, WhatsApp e o chatbot pioneiro do setor.',
        },
      ],
    },
    // `.method`, `_reference/administracao-de-condominios.html:288-309`: 4
    // hover-rows. `tightTop: false` porque `.method` NÃO zera o padding-top.
    {
      blockType: 'pillars',
      eyebrow: 'Como fazemos',
      tightTop: false,
      items: [
        {
          title: 'Diagnóstico e proposta',
          text: 'Entendemos o momento do condomínio: inadimplência, contratos, pendências e prioridades. A proposta chega em até 24 horas úteis, com escopo claro.',
        },
        {
          title: 'Migração sem ruptura',
          text: 'Auditoria e transferência de documentos, comunicação aos condôminos e cadastro completo no Semog One, sem interromper a operação.',
        },
        {
          title: 'Operação com método',
          text: 'Rotinas financeiras, DP, manutenção e atendimento rodando no nosso ERP, com prazos definidos e indicadores acompanhados pela diretoria.',
        },
        {
          title: 'Transparência contínua',
          text: 'Prestação de contas digital aberta a qualquer condômino, relatórios mensais ao conselho e acesso direto aos sócios quando precisar.',
        },
      ],
    },
    // `.cost.sec-light.white`, `_reference/administracao-de-
    // condominios.html:311-346`.
    {
      blockType: 'custoChecklist',
      title: 'Quanto custa uma administradora?',
      titleAccent: 'administradora?',
      paragraphs: [
        {
          text: 'No mercado, a taxa de administração varia conforme o porte do condomínio e o escopo contratado. Desconfie de preço único sem conhecer o condomínio: gestão séria começa com diagnóstico.',
        },
        {
          text: 'Na Semog, a proposta é personalizada, sem custos escondidos, e o Semog Garante pode zerar a inadimplência por 1% da arrecadação.',
        },
      ],
      cta: { label: 'Solicitar proposta', href: '/proposta' },
      checklistLabel: 'O que avaliar antes de contratar',
      checklist: [
        { text: 'Tempo de mercado e carteira de clientes comprovada' },
        { text: 'Transparência real da prestação de contas' },
        { text: 'Tecnologia que o morador consegue usar' },
        { text: 'Estrutura própria de cobrança de inadimplentes' },
        { text: 'Acesso a quem decide, não a protocolos' },
        { text: 'Registro e regularidade nos órgãos do setor' },
      ],
    },
    // `.faq.sec-light.white`, `_reference/administracao-de-
    // condominios.html:349-375` — `white: true` e `tightTop: true`, só nesta
    // família de páginas.
    {
      blockType: 'faq',
      title: 'Perguntas frequentes.',
      white: true,
      tightTop: true,
      items: [
        {
          question: 'O que faz uma administradora de condomínios?',
          answer:
            'Ela assume a operação do condomínio: finanças e cobrança, contabilidade e prestação de contas, departamento pessoal, jurídico, assembleias, fornecedores, manutenção e seguros. O síndico continua decidindo; a administradora executa com método e responde por prazos.',
        },
        {
          question: 'Quanto custa contratar?',
          answer:
            'Depende do porte e do escopo. A Semog envia proposta personalizada em até 24 horas úteis, sem compromisso, com tudo discriminado: taxa de administração, serviços incluídos e opcionais como o Semog Garante.',
        },
        {
          question: 'Como escolher a administradora certa?',
          answer:
            'Compare tempo de mercado, carteira de condomínios, transparência da prestação de contas, tecnologia para o morador e estrutura de cobrança. Visite a sede, converse com clientes atuais e peça uma proposta detalhada por escrito.',
        },
        {
          question: 'Trocar de administradora dá trabalho?',
          answer:
            'Com condução profissional, não. Aprovada a troca em assembleia, a Semog cuida de toda a migração: documentos, comunicação aos moradores e transição financeira, sem interromper boletos nem pagamentos.',
        },
        {
          question: 'A Semog atende meu tipo de condomínio?',
          answer:
            'Atendemos condomínios residenciais, comerciais, mistos e associações de moradores, em Recife, João Pessoa, Campina Grande, Belém e regiões. Para incorporadoras, implantamos o condomínio da planta à primeira assembleia.',
        },
      ],
    },
    // `.final-cta`, `_reference/administracao-de-condominios.html:377-389`:
    // `titleAccent` reproduz o `<span class="gx-ice">pela líder.</span>`.
    {
      blockType: 'ctaBand',
      variant: 'centered',
      title: 'Seu condomínio administrado pela líder.',
      titleAccent: 'pela líder.',
      text: 'Conte como é o seu condomínio e receba uma proposta sob medida em até 24 horas úteis.',
      cta: { label: 'Solicitar proposta', href: '/proposta' },
    },
  ],
}
