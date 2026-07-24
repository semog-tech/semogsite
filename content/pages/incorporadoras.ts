/**
 * Conteúdo de "Incorporadoras" (slug `incorporadoras`) — port fiel de
 * `seedIncorporadorasPage` em `src/seed/pages.ts`, fiel a
 * `_reference/incorporadoras.html`, ordem exata do ref. Sem a faixa
 * `Registros` que o seed antigo inseria — não existe no ref.
 */
import type { PageData } from '@/types/content'
import { img } from '../media'

export const incorporadoras: PageData = {
  slug: 'incorporadoras',
  layout: [
    // `.page-hero`, `_reference/incorporadoras.html:50-70`: 80dvh, opacidade
    // 0.55, `background-position: center`, gradiente com parada
    // intermediária a 45%.
    {
      blockType: 'hero',
      headline: 'O condomínio nasce bem antes das chaves.',
      subhead:
        'A Semog implanta o condomínio da sua incorporadora da planta à primeira assembleia, protegendo a entrega, o cliente e a sua marca.',
      poster: img('incorporadoras.webp'),
      pageHeroOverlay: true,
      pageHeroMinHeight: '80dvh',
      pageHeroPosterOpacity: 0.55,
      pageHeroBgPosition: 'center',
      pageHeroGradient:
        'linear-gradient(180deg, rgba(5,8,26,0.5) 0%, rgba(10,16,46,0.3) 45%, var(--color-navy-900) 100%)',
      pageHeroHeadlineMaxWidth: '15ch',
      ctas: [{ label: 'Solicitar proposta', href: '/proposta' }],
    },
    // `.argument`, `_reference/incorporadoras.html:72-79,204-216` —
    // `<em>` embutido reproduz o destaque em ice do ref.
    {
      blockType: 'wordsSection',
      variant: 'argument',
      text: 'A experiência do comprador não termina na escritura. Os primeiros doze meses do condomínio definem <em>como a sua marca será lembrada.</em>',
      sub: 'Condomínio recém-entregue com taxa mal calculada, assembleia tumultuada e áreas comuns sem manutenção vira reclamação pública contra a incorporadora. Com 35 anos de implantações, a Semog garante que a vida no empreendimento comece tão bem quanto a obra terminou.',
    },
    // `.process.sec-light`, `_reference/incorporadoras.html:81-107,218-278`
    // — timeline vertical dos 5 passos. `iconSvg` de cada item é o markup
    // verbatim do ref (viewBox 24x24).
    {
      blockType: 'processoTimeline',
      eyebrow: 'Como trabalhamos',
      title: 'Da planta à primeira assembleia.',
      items: [
        {
          iconSvg: '<path d="M3 3v18h18"/><path d="M7 15l4-6 4 3 5-8"/>',
          title: 'Previsão orçamentária ainda na planta',
          text: 'Calculamos a taxa condominial realista antes do lançamento, evitando a armadilha da taxa promocional que explode no segundo ano. Sua equipe de vendas divulga um número que se sustenta.',
          tags: [
            { label: 'Estudo de custos' },
            { label: 'Dimensionamento de equipe' },
            { label: 'Benchmark regional' },
          ],
        },
        {
          iconSvg:
            '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/>',
          title: 'Convenção e regimento sob medida',
          text: 'Elaboramos convenção, regimento interno e estrutura jurídica adequados ao perfil do empreendimento, prontos para registro e alinhados ao memorial de incorporação.',
          tags: [{ label: 'Assessoria jurídica' }, { label: 'Registro em cartório' }],
        },
        {
          iconSvg:
            '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
          title: 'Assembleia de instalação conduzida',
          text: 'Organizamos e conduzimos a assembleia que dá vida jurídica ao condomínio: eleição do síndico, aprovação da previsão e posse da administração, sem tumulto e com ata impecável.',
          tags: [
            { label: 'Convocação legal' },
            { label: 'Condução profissional' },
            { label: 'CNPJ do condomínio' },
          ],
        },
        {
          iconSvg:
            '<path d="M21 10H3M16 2v4M8 2v4M5 6h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"/>',
          title: 'Entrega das unidades organizada',
          text: 'Estruturamos o calendário de vistorias e entrega de chaves junto à sua equipe, com contratação de pessoal, implantação de portaria e áreas comuns operando desde o primeiro morador.',
          tags: [
            { label: 'Vistorias' },
            { label: 'Implantação de equipe' },
            { label: 'Manual do morador' },
          ],
        },
        {
          iconSvg:
            '<path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6Z"/><path d="m9 12 2 2 4-4"/>',
          title: 'Pós-obra sem atrito',
          text: 'Fazemos a ponte entre condomínio e construtora na fase de garantias: chamados técnicos documentados, prazos monitorados e comunicação que evita o desgaste público da sua marca.',
          tags: [
            { label: 'Gestão de garantias' },
            { label: 'Mediação técnica' },
            { label: 'Relatórios à incorporadora' },
          ],
        },
      ],
    },
    // `.why-grid.sec-light.white`, `_reference/incorporadoras.html:109-122,
    // 280-309` — os 4 cards de "O que a sua incorporadora ganha".
    {
      blockType: 'featureGrid',
      light: true,
      white: true,
      columns: '2',
      stagger: true,
      title: 'O que a sua incorporadora ganha.',
      titleAccent: 'ganha.',
      features: [
        {
          iconSvg: '<path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6Z"/>',
          title: 'Reputação protegida',
          description:
            'Condomínio bem implantado significa comprador satisfeito falando bem do empreendimento nas redes e para amigos. O melhor marketing do próximo lançamento.',
        },
        {
          iconSvg: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
          title: 'Time liberado para construir',
          description:
            'Sua equipe de engenharia e relacionamento para de responder sobre taxa de condomínio e volta a fazer o que sabe: entregar obra.',
        },
        {
          iconSvg: '<path d="M3 3v18h18"/><path d="M7 15l4-6 4 3 5-8"/>',
          title: 'Números desde o dia zero',
          description:
            'Previsão orçamentária auditável e prestação de contas digital desde a instalação. O conselho do condomínio nasce confiando na gestão.',
        },
        {
          iconSvg:
            '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
          title: 'Um parceiro em quatro praças',
          description:
            'Lançou em Recife, João Pessoa, Campina Grande ou Belém? A mesma Semog implanta, com equipe local e padrão único de qualidade.',
        },
      ],
    },
    // `.dev-quote`, `_reference/incorporadoras.html:125-136,311-317` —
    // `<em>` embutido reproduz o destaque em ice do ref.
    {
      blockType: 'devQuote',
      quote: 'Entregar a obra é metade. <em>A Semog entrega a convivência.</em>',
      cite: 'Filosofia do time de implantação Semog',
    },
    // `.final-cta`, `_reference/incorporadoras.html:138-140,319-331` — CTA
    // final centrado com `.btn-primary` (não `.btn-white` como
    // home/garante/administracao — daí `buttonVariant:'primary'`).
    {
      blockType: 'ctaBand',
      variant: 'centered',
      buttonVariant: 'primary',
      title: 'Tem lançamento no radar?',
      text: 'Envolva a Semog ainda na planta e lance com a taxa certa, a convenção certa e a operação pronta.',
      cta: { label: 'Solicitar proposta', href: '/proposta' },
    },
  ],
}
