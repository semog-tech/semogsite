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
      // O 4º item era `35 anos · em 3 estados, desde 1991`, removido em
      // 27/08/2026 para abrir espaço ao G20 sem virar 5 colunas: a faixa é um
      // grid fixo de 4 (`theme.css` `.hero-proof`) com regras de borda
      // amarradas à posição no mobile, e um 5º item cairia numa 2ª linha
      // torta. `35 anos` era o item mais dispensável porque já aparece duas
      // vezes na mesma dobra — no `subhead` logo acima e na faixa `stats`
      // (`35 · Anos de mercado` e `3 · Estados`) imediatamente abaixo.
      proofItems: [
        { value: '4,8', label: 'no app, 1.133 avaliações', stars: true },
        { value: '+650', label: 'condomínios sob gestão' },
        { value: '+70 mil', label: 'clientes atendidos' },
        // Sem `stars`: o ornamento fica só na nota do app, senão dois itens
        // decorados competem na mesma faixa. Nunca "melhor do Brasil" — o
        // ranking classifica clientes da Superlógica, não o mercado inteiro.
        // Label curto por causa do mobile: com "no ranking Top 200 da
        // Superlógica" o texto quebrava em 3 linhas na coluna estreita e
        // esbarrava no botão flutuante do WhatsApp. Por isso o número que dá a
        // dimensão do feito (mais de 3.500 administradoras na base) mora no
        // bloco `reconhecimento`, logo abaixo, onde há largura para ele.
        {
          value: '5º lugar',
          label: 'no ranking da Superlógica',
          href: '/blog/g20-superlogica-next-2026',
        },
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
          detail: 'Time próprio: financeiro, contábil, operações.',
        },
        { value: 3, label: 'Estados', detail: 'Pernambuco, Paraíba e Pará.' },
      ],
    },
    {
      // Entra logo depois do `stats`, que abre com "Liderança não se declara.
      // Se comprova." — os números acima são autodeclarados, este bloco é a
      // única prova da home validada por terceiro. Também resolve o contraste:
      // `stats` é `Section light`, esta faixa volta ao escuro antes do marquee.
      //
      // O título carrega o TAMANHO DA BASE, não a consistência: sem "mais de
      // 3.500 administradoras" o "5º lugar" da faixa do hero é lido como
      // "5º entre 200", o que subdimensiona o feito. A consistência (três
      // ciclos seguidos) passou a ser trabalho do `history` ao lado, que já
      // lista ciclo a ciclo — é o que um concorrente não consegue improvisar.
      blockType: 'reconhecimento',
      eyebrow: 'G20 Condo · Superlógica',
      // "3.500" não quebra no meio, então aqui não é preciso o espaço não
      // separável que a redação anterior ("3 mil") exigia para o "3" não ficar
      // órfão no fim da linha. Se o número voltar a ter unidade por extenso, o
      // NBSP volta junto — e nos DOIS campos, senão o `endsWith` que recorta o
      // `titleAccent` não casa e o gradiente some.
      title: 'Top 5 entre mais de 3.500 administradoras.',
      titleAccent: 'mais de 3.500 administradoras.',
      // Escopo explícito (base de clientes da Superlógica) por decisão de
      // conformidade: o ranking não classifica o mercado brasileiro inteiro, e
      // afirmar isso seria publicidade comparativa sem lastro.
      text: 'A Superlógica é o principal ERP do mercado condominial: mais de 130 mil condomínios e mais de 3.500 administradoras na plataforma. Todo mês ela classifica essa base inteira no Ranking Top 200 — receita no portfólio, adoção de módulos, número e crescimento de unidades —, e uma vez por ano as vinte primeiras formam o G20 Condo. A Semog está lá pelo terceiro ciclo seguido.',
      history: [
        { period: 'Ciclo 2026/27', result: '5º lugar' },
        { period: 'Ciclo 2025/26', result: '5º lugar' },
        { period: 'Ciclo 2024/25', result: '3º lugar' },
      ],
      cta: {
        label: 'Como foi o Superlógica Next 2026',
        href: '/blog/g20-superlogica-next-2026',
      },
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
      // Faixa de captação no primeiro terço da página, e não só no CTA final:
      // medido no GA4 (23-29/07/2026), a home converte 1,6% enquanto as
      // landings de cidade — mesmo público, mesmo formulário, só que embutido
      // — convertem 7-12%. E só 6% dos pageviews chegam a 90% de rolagem, ou
      // seja, quase ninguém alcançava a faixa final, única chamada forte.
      blockType: 'propostaBand',
      background: 'foto',
      image: img('hero-towers.webp'),
      eyebrow: 'Proposta',
      title: 'O primeiro passo leva dois minutos.',
      text: 'Diga onde fica e como é o condomínio. O resto a gente conversa com calma.',
      highlight: {
        value: '24h',
        label: 'é o prazo da resposta, em dias úteis.',
      },
      proofs: [
        { label: 'Fala com um consultor da unidade mais próxima, não com um call center.' },
        { label: 'Proposta sem compromisso — e sem letra miúda.' },
        { label: 'Número nenhum antes de olhar sua convenção e seu orçamento.' },
      ],
      whatsapp: {
        label: 'Prefere conversar agora? Falar no WhatsApp',
        href: WHATSAPP_URL,
      },
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
          href: '/prestacao-de-contas-condominio',
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
          href: '/software-de-gestao-condominial',
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
