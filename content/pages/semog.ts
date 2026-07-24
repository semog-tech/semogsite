/**
 * Conteúdo de "A Semog" (slug `semog`) — port fiel de `seedSemogPage` em
 * `src/seed/pages.ts`, fiel a `_reference/semog.html`.
 */
import type { PageData } from '@/types/content'
import { img } from '../media'

export const semog: PageData = {
  slug: 'semog',
  // Rótulo administrativo real no Payload (confirmado via GET /api/pages).
  title: 'A Semog',
  layout: [
    // `.page-hero`, `_reference/semog.html:43-63,236-245` — só imagem de
    // fundo (`.bg`), sem vídeo nesta página interna. Números próprios desta
    // página: `min-height:78dvh`, `background-position:center 30%`,
    // opacidade `0.5`, gradiente com parada intermediária a 35%,
    // `padding-block` 2º valor `clamp(3rem,6vw,5rem)`, `h1{max-width:14ch}`.
    {
      blockType: 'hero',
      eyebrow: 'Desde 1991',
      headline: 'Governança se constrói com tempo.',
      subhead:
        'Nascemos no Recife, crescemos com o Nordeste e nos tornamos referência nacional em administração de condomínios.',
      poster: img('hero-towers.webp'),
      pageHeroOverlay: true,
      pageHeroMinHeight: '78dvh',
      pageHeroPosterOpacity: 0.5,
      pageHeroBgPosition: 'center 30%',
      pageHeroGradient:
        'linear-gradient(180deg, rgba(5,8,26,0.55) 0%, rgba(10,16,46,0.35) 50%, var(--color-navy-900) 100%)',
      pageHeroPaddingBottom: 'clamp(3rem, 6vw, 5rem)',
      pageHeroHeadlineMaxWidth: '14ch',
    },
    // `.manifesto .big`, `_reference/semog.html:248-253` — `<em>` embutido
    // reproduz o destaque em ice do ref.
    {
      blockType: 'wordsSection',
      text: 'A Semog existe para que síndicos e moradores nunca precisem entender de contabilidade, jurídico ou manutenção. <em>Esse trabalho é nosso.</em> O de vocês é viver bem.',
    },
    // Ledger editorial (variant 'feature'), mesmo tratamento da home. Sem
    // eyebrow/title: entra logo após o manifesto acima, que já dá o contexto.
    // 4º item é "Colaboradores" (na home é "Especialistas").
    {
      blockType: 'stats',
      variant: 'feature',
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
          label: 'Colaboradores',
          detail: 'Time próprio: financeiro, jurídico, contábil.',
        },
        { value: 3, label: 'Estados', detail: 'Pernambuco, Paraíba e Pará.' },
      ],
    },
    // `#historia`, `_reference/semog.html:275-328` — 8 cartões datados.
    {
      blockType: 'timeline',
      eyebrow: 'Nossa história',
      title: 'De 1991 até aqui.',
      text: 'Três décadas e meia de crescimento contínuo, sempre com os pés no Nordeste.',
      items: [
        {
          date: '1991',
          title: 'Fundação no Recife',
          text: 'A Semog nasce em Pernambuco com uma convicção: condomínio bem administrado se prova com números.',
        },
        {
          date: '2000',
          title: 'Liderança regional',
          text: 'A carteira de condomínios se multiplica e a Semog se consolida como referência no estado.',
        },
        {
          date: '2010',
          title: 'Expansão pela Paraíba',
          text: 'Chegamos a João Pessoa e Campina Grande com equipes locais e o mesmo padrão de governança.',
        },
        {
          date: '2018',
          title: 'Norte no mapa',
          text: 'A unidade de Belém do Pará leva o método Semog para além do Nordeste.',
        },
        {
          date: '2019',
          title: 'Pioneirismo em IA',
          text: 'Criamos o primeiro chatbot do mercado de administradoras de condomínios do Brasil.',
        },
        {
          date: '2023',
          title: 'Prestação de contas digital',
          text: 'Lançamos a prestação de contas 100% digital, com documentos, gráficos e assinatura digital.',
        },
        {
          date: '2025',
          title: 'Semog Garante',
          text: 'Com a G5 Partners, criamos o produto que zera a inadimplência por 1% da arrecadação.',
        },
        {
          date: 'Hoje',
          title: 'Líder do Nordeste',
          text: 'Mais de 650 condomínios, 70 mil clientes e 100 especialistas. E seguimos crescendo.',
          now: true,
        },
      ],
    },
    // `.values-sec` `#valores`, `_reference/semog.html:330-349` — hover-rows.
    {
      blockType: 'pillars',
      items: [
        {
          title: 'Transparência',
          text: 'Cada centavo do condomínio é rastreável. Prestação de contas aberta, documentos públicos para os condôminos e nada embaixo do tapete.',
        },
        {
          title: 'Retidão',
          text: 'Fazemos o certo mesmo quando ninguém está olhando. É assim há 35 anos, e é por isso que síndicos renovam com a gente.',
        },
        {
          title: 'Dinâmica',
          text: 'Condomínio não pode esperar. Respostas rápidas, processos digitais e uma equipe que resolve no primeiro contato.',
        },
      ],
    },
    // `.founders` `#socios`, `_reference/semog.html:352-385`.
    {
      blockType: 'socios',
      eyebrow: 'Empresa humana',
      title: 'Tecnologia na operação. Gente na relação.',
      text: 'Investimos pesado em tecnologia para que sobre tempo para o que importa: ouvir. Na Semog, síndico e condômino falam com quem decide.',
      items: [
        {
          title: 'Canal direto com os sócios',
          text: 'Sem camadas, sem protocolo, sem "vou verificar e retorno". Quem atende resolve.',
        },
        {
          title: 'Equipes locais de verdade',
          text: 'Cada unidade tem gente da cidade, que conhece a rua, o clima e o jeito de lá.',
        },
        {
          title: 'Relacionamentos de década',
          text: 'Boa parte dos nossos condomínios está conosco há mais de dez anos, e renova.',
        },
      ],
      image: img('equipe.webp'),
      caption: 'Acesso fácil aos sócios. Regra da casa desde 1991.',
    },
    // `.final-cta`, `_reference/semog.html:388-399` — `variant:'centered'`.
    {
      blockType: 'ctaBand',
      variant: 'centered',
      title: 'Venha conhecer a Semog por dentro.',
      text: 'Converse com a nossa equipe e receba uma proposta sob medida para o seu condomínio.',
      cta: { label: 'Solicitar proposta', href: '/proposta' },
    },
  ],
}
