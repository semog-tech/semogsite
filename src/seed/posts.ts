import config from '@payload-config'
import { getPayload } from 'payload'
import { getMediaId } from './lib/media'

/**
 * Seed idempotente de 6 categorias + 7 posts do blog. Os cards da listagem
 * `/blog` (hero + destaque + grade) seguem fiéis a `_reference/blog.html`; já o
 * CONTEÚDO de cada post é full-length (intertítulos, listas, citação e
 * `keyTakeaways` — a caixa "Em resumo") para preencher o layout "flagship" da
 * página do artigo `/blog/[slug]` (`src/app/(frontend)/blog/[slug]/page.tsx`),
 * que não tem referência no `_reference/`. Cada post tem `heroImage` (via
 * `getMediaId`, assets já semeados por `pnpm seed:media`) e `readingTime`
 * (alimenta o "meta" dos cards e da página).
 *
 * A página `/blog` é semeada à parte em `src/seed/pages.ts` (`seedBlogPage`),
 * que depende dos posts/categorias criados aqui — rodar `pnpm seed:posts`
 * antes de `pnpm seed:pages`.
 *
 * Executa via `pnpm seed:posts` (`payload run src/seed/posts.ts`): assim como
 * `src/seed/home.ts`, obtém a própria instância do Payload — o CLI
 * `payload run` não injeta uma pronta.
 */

// ---------------------------------------------------------------------------
// Builder mínimo de lexical (paragraph/heading/list/quote + negrito inline).
// Shapes fiéis aos nós padrão do `lexicalEditor()` (features default: headings,
// listas bullet/number, quote, bold) — todos com os mesmos campos base
// (direction/format/indent/version) do parágrafo já validado pelo Payload.
// ---------------------------------------------------------------------------

type Inline = string | { text: string; bold?: boolean }
// biome-ignore lint/suspicious/noExplicitAny: AST lexical; não vale tipar o nó inteiro aqui
type Node = any

const base = { direction: 'ltr' as const, format: '' as const, indent: 0, version: 1 }

function textNode(seg: Inline): Node {
  const s = typeof seg === 'string' ? { text: seg, bold: false } : seg
  return {
    type: 'text',
    detail: 0,
    format: s.bold ? 1 : 0,
    mode: 'normal' as const,
    style: '',
    text: s.text,
    version: 1,
  }
}

function inlines(children: Inline[] | string): Node[] {
  const arr = typeof children === 'string' ? [children] : children
  return arr.map(textNode)
}

function p(children: Inline[] | string): Node {
  return { ...base, type: 'paragraph', children: inlines(children) }
}

function h(tag: 'h2' | 'h3', children: Inline[] | string): Node {
  return { ...base, type: 'heading', tag, children: inlines(children) }
}

function quote(children: Inline[] | string): Node {
  return { ...base, type: 'quote', children: inlines(children) }
}

function listNode(
  listType: 'bullet' | 'number',
  tag: 'ul' | 'ol',
  items: (Inline[] | string)[],
): Node {
  return {
    ...base,
    type: 'list',
    listType,
    tag,
    start: 1,
    children: items.map((item, i) => ({
      ...base,
      type: 'listitem',
      value: i + 1,
      children: inlines(item),
    })),
  }
}

const ul = (items: (Inline[] | string)[]): Node => listNode('bullet', 'ul', items)
const ol = (items: (Inline[] | string)[]): Node => listNode('number', 'ol', items)

function doc(...blocks: Node[]): Node {
  return { root: { ...base, type: 'root', children: blocks } }
}

const categoriesData = [
  { title: 'Finanças', slug: 'financas' },
  { title: 'Inadimplência', slug: 'inadimplencia' },
  { title: 'Gestão', slug: 'gestao' },
  { title: 'Convivência', slug: 'convivencia' },
  { title: 'Tecnologia', slug: 'tecnologia' },
  { title: 'Incorporadoras', slug: 'incorporadoras' },
]

const postsData = [
  {
    title: 'Previsão orçamentária: o guia que todo síndico deveria ler antes da assembleia',
    slug: 'previsao-orcamentaria-guia-sindico',
    excerpt:
      'Como montar um orçamento que passa na assembleia sem cortes cegos e sem sustos no meio do ano. Com o método que a equipe Semog usa em centenas de condomínios.',
    categorySlug: 'financas',
    heroImageFilename: 'blog-financas.webp',
    readingTime: 12,
    publishedAt: '2026-07-14T09:00:00.000Z',
    keyTakeaways: [
      { point: 'Separe despesa recorrente de investimento pontual antes de projetar.' },
      { point: 'Mapeie reajustes contratuais e dissídio — quase nada é surpresa.' },
      { point: 'Trate o fundo de reserva como linha fixa, não como sobra de caixa.' },
    ],
    content: doc(
      p(
        'Um orçamento bem construído não é uma peça de burocracia para "cumprir tabela" na assembleia. É o documento que decide se manutenção, obras e reserva vão caber na taxa condominial — ou virar rateio extra no meio do ano.',
      ),
      p(
        'Na prática, a maioria dos orçamentos reprovados em assembleia não falha pelos números. Falha porque os números chegam sem história: uma planilha com linhas que ninguém sabe de onde vieram. O condômino não vota contra o reajuste — vota contra o que não entende.',
      ),
      h('h2', 'Comece pelo histórico, não pela projeção'),
      p(
        'Antes de projetar qualquer centavo, reúna os últimos doze meses de despesa real e separe cada gasto em três categorias claras:',
      ),
      ul([
        [
          { text: 'Recorrente fixo', bold: true },
          ' — folha, contratos de manutenção, seguros e taxas. Muda pouco e é previsível.',
        ],
        [
          { text: 'Recorrente variável', bold: true },
          ' — água, energia, produtos de limpeza. Oscila com consumo e estação.',
        ],
        [
          { text: 'Investimento pontual', bold: true },
          ' — pintura, troca de bombas, reforma de fachada. Não é despesa do dia a dia e não deveria pesar na taxa mensal.',
        ],
      ]),
      p(
        'Só com essa separação dá para responder à pergunta que todo conselho faz: por que a taxa precisa subir? A resposta deixa de ser "porque tudo aumentou" e passa a ser uma linha específica, com contrato e data.',
      ),
      quote('A assembleia não rejeita números. Rejeita números sem explicação.'),
      h('h2', 'Projete os reajustes que você já conhece'),
      p(
        'Boa parte do aumento de um orçamento não é surpresa: contratos com reajuste anual por índice, dissídio da categoria dos funcionários, tarifas públicas. Tudo isso é previsível meses antes. Levar essas datas mapeadas transforma o debate — de "será que vai faltar?" para "já sabemos o que vem e estamos cobrindo".',
      ),
      h('h3', 'E o fundo de reserva?'),
      p(
        'O fundo de reserva entra como linha própria, nunca como sobra. Um percentual fixo da arrecadação, aprovado em assembleia, é o que evita o rateio extraordinário quando o elevador para ou o telhado precisa de reparo.',
      ),
      h('h2', 'Leve a assembleia pronta para decidir'),
      p(
        'Com esse material em mãos, a assembleia deixa de ser um embate sobre planilhas soltas e vira uma decisão informada sobre prioridades. É esse trabalho — invisível para o condômino, decisivo para o síndico — que a equipe Semog entrega em cada prestação de contas.',
      ),
    ),
  },
  {
    title: 'Inadimplência no condomínio: o que a lei permite e o que resolve de verdade',
    slug: 'inadimplencia-condominio-o-que-a-lei-permite',
    excerpt:
      'Dos juros permitidos à negativação, um mapa honesto das opções — e por que a prevenção vence a cobrança judicial.',
    categorySlug: 'inadimplencia',
    heroImageFilename: 'garante.webp',
    readingTime: 8,
    publishedAt: '2026-07-11T09:00:00.000Z',
    keyTakeaways: [
      { point: 'A lei limita a multa a 2% e os juros a 1% ao mês — nada de valores "inventados".' },
      { point: 'Régua de cobrança nos primeiros dias vence qualquer ação judicial em recuperação.' },
      { point: 'Acordo com entrada e parcelas recupera o crédito mais rápido que execução.' },
    ],
    content: doc(
      p(
        'Inadimplência não é um problema de cobrança — é um problema de caixa. Cada boleto em atraso é uma conta do condomínio que alguém vai ter que pagar: ou o vizinho adimplente, via rateio, ou o próprio prédio, adiando manutenção.',
      ),
      p(
        'A boa notícia é que a lei dá ferramentas. A má é que quase todas chegam tarde. Entender o que cada uma resolve — e o que não resolve — é o primeiro passo para tratar inadimplência como processo, não como emergência.',
      ),
      h('h2', 'O que a lei permite'),
      p('O Código Civil e a convenção do condomínio autorizam, sobre a cota em atraso:'),
      ul([
        [
          { text: 'Multa de até 2%', bold: true },
          ' sobre o valor da cota — teto fixado em lei, não pode ser maior.',
        ],
        [
          { text: 'Juros de mora', bold: true },
          ' de 1% ao mês, salvo previsão diferente na convenção.',
        ],
        [
          { text: 'Correção monetária', bold: true },
          ' pelo índice previsto na convenção, para o valor não perder poder de compra.',
        ],
        [
          { text: 'Cobrança judicial', bold: true },
          ' por execução, com o crédito condominial tendo preferência sobre outros.',
        ],
      ]),
      p(
        'Em casos extremos, o condômino inadimplente contumaz pode responder por cota extraordinária mais alta e ter o débito levado a protesto ou negativação. São instrumentos legítimos — mas todos atuam depois que o buraco no caixa já existe.',
      ),
      quote(
        'O efeito mais forte contra a inadimplência acontece nos primeiros dias de atraso, não nos tribunais.',
      ),
      h('h2', 'O que realmente resolve'),
      p(
        'A régua de cobrança — a sequência de contatos que dispara automaticamente a partir do vencimento — é o que mais reduz inadimplência na prática. Um lembrete amigável no terceiro dia, uma ligação na segunda semana, uma proposta de acordo antes de o débito virar bola de neve.',
      ),
      p(
        'Transparência ajuda tanto quanto cobrança. Quando o condômino entende que o atraso dele adia a pintura do prédio ou encarece a taxa de todos, o comportamento muda. Cobrança fria gera resistência; contexto gera pagamento.',
      ),
      h('h3', 'Acordo é melhor que ação'),
      p(
        'Um acordo bem estruturado — com entrada, parcelas e cláusula de vencimento antecipado — recupera o crédito mais rápido e mais barato que uma execução que se arrasta por anos. A Semog trata cada inadimplência como negociação a ser resolvida, não como processo a ser aberto.',
      ),
    ),
  },
  {
    title: 'Cinco sinais de que é hora de trocar de administradora',
    slug: 'cinco-sinais-trocar-administradora',
    excerpt:
      'Balancete atrasado, boleto errado, telefone que não atende. Saiba quando o problema deixou de ser pontual e virou estrutural.',
    categorySlug: 'gestao',
    heroImageFilename: 'comercial.webp',
    readingTime: 6,
    publishedAt: '2026-07-08T09:00:00.000Z',
    keyTakeaways: [
      { point: 'Balancete atrasado e erro financeiro recorrente são falha de processo, não deslize.' },
      { point: 'Sem indicadores de gestão, a administradora só paga contas — não administra.' },
      { point: 'Quando corrigir a administradora custa mais que trocá-la, a troca virou necessidade.' },
    ],
    content: doc(
      p(
        'Trocar de administradora dá trabalho, e por isso a maioria dos síndicos adia — mesmo quando os sinais já são claros. O problema é que o custo de continuar com uma administradora ruim raramente aparece de uma vez: ele se acumula em balancetes atrasados, boletos errados e assembleias sem resposta.',
      ),
      p(
        'Isoladamente, cada deslize parece pontual. Juntos e recorrentes, são sintoma de estrutura insuficiente. Estes são os cinco sinais que, quando aparecem em conjunto, indicam que o problema é estrutural:',
      ),
      ol([
        [
          { text: 'Balancete que atrasa todo mês. ', bold: true },
          'Prestação de contas fora do prazo não é esquecimento: é falta de processo. Sem balancete em dia, o síndico administra no escuro.',
        ],
        [
          { text: 'Erros financeiros que se repetem. ', bold: true },
          'Boleto com valor errado, cobrança em duplicidade, rateio que não fecha. Um erro acontece; o mesmo erro todo mês é sistema quebrado.',
        ],
        [
          { text: 'Telefone que ninguém atende. ', bold: true },
          'Quando o canal de atendimento vira caixa postal, o condômino desconta no síndico — e o síndico vira atendente da administradora.',
        ],
        [
          { text: 'Nenhum indicador de gestão. ', bold: true },
          'Administradora que não mostra inadimplência, consumo e evolução de despesas não está gerindo, está só pagando contas.',
        ],
        [
          { text: 'Pautas de assembleia sem resposta. ', bold: true },
          'Se o que foi decidido em assembleia não vira ação, a administradora deixou de ser parceira e virou obstáculo.',
        ],
      ]),
      quote(
        'Um sinal é um deslize. Dois ou mais ao mesmo tempo é um padrão — e padrão não melhora sozinho.',
      ),
      h('h2', 'Quando o custo de trocar fica menor que o de ficar'),
      p(
        'A conta é simples: quanto tempo o síndico gasta corrigindo o trabalho da administradora? Quanto o condomínio perde em inadimplência mal gerida ou em manutenção adiada? Quando esses custos superam o incômodo da transição, a troca deixou de ser opção e virou necessidade.',
      ),
      p(
        'A transição, feita direito, é mais tranquila do que parece: a nova administradora assume o histórico, migra os dados e reorganiza a cobrança sem que o condômino sinta o solavanco. Na Semog, esse processo é conduzido passo a passo, com o síndico acompanhando cada etapa.',
      ),
    ),
  },
  {
    title: 'Áreas de lazer: como definir regras de uso sem virar guerra em assembleia',
    slug: 'areas-lazer-regras-de-uso',
    excerpt:
      'Reserva, taxa de uso e horário de silêncio: os três pontos que resolvem a maior parte dos conflitos antes de chegarem à portaria.',
    categorySlug: 'convivencia',
    heroImageFilename: 'blog-lazer.webp',
    readingTime: 7,
    publishedAt: '2026-07-05T09:00:00.000Z',
    keyTakeaways: [
      { point: "Reserva com antecedência e limite por unidade acaba com o 'salão dos mesmos'." },
      { point: 'Taxa de uso proporcional conserva o espaço sem penalizar quem não usa.' },
      { point: 'Horário de silêncio vale quando está no regimento e é aplicado igual para todos.' },
    ],
    content: doc(
      p(
        'Salão de festas, churrasqueira, academia e piscina são, ao mesmo tempo, o que mais valoriza um condomínio e o que mais gera briga em grupo de WhatsApp. A diferença entre uma área de lazer que une e uma que divide quase nunca está no espaço — está na regra.',
      ),
      p(
        'Regra de uso mal escrita, ou escrita e não aplicada, é a origem da maioria dos conflitos que chegam à portaria e, depois, à assembleia. O caminho para evitá-los é definir três coisas com clareza antes que o problema apareça.',
      ),
      h('h2', 'Reserva com antecedência e critério'),
      p(
        'Quem reserva primeiro usa — mas com regra. Antecedência mínima, limite de reservas por unidade no mês e uma fila transparente evitam o "salão sempre reservado pelas mesmas famílias". O sistema de reserva deve ser visível a todos, não um caderno na portaria.',
      ),
      h('h2', 'Taxa de uso proporcional ao desgaste'),
      p(
        'Cobrar pelo uso do salão ou da churrasqueira não é punição: é o que mantém o espaço conservado sem que o custo caia sobre quem nunca usa. A taxa deve ser proporcional ao desgaste — limpeza, reposição, manutenção — e o valor arrecadado, idealmente, volta para a própria área.',
      ),
      h('h2', 'Horário de silêncio que todos conhecem'),
      p(
        'O horário de silêncio precisa estar no regimento, não na memória de cada morador. Definido, divulgado e aplicado igual para todos, ele resolve a maior parte dos atritos de convivência antes que virem reclamação formal.',
      ),
      quote('Regra clara evita mediação de conflito. Regra vaga cria uma.'),
      h('h3', 'Coloque no regimento, não no improviso'),
      p(
        'Cada uma dessas regras precisa estar detalhada no regimento interno — não citada de forma genérica. "Usar com bom senso" não é regra; é convite ao conflito. A equipe Semog ajuda síndicos a redigir e aprovar esse regimento em assembleia, com modelos já testados em centenas de condomínios.',
      ),
    ),
  },
  {
    title: 'Assembleia virtual tem validade jurídica? O que diz a lei em 2026',
    slug: 'assembleia-virtual-validade-juridica',
    excerpt:
      'Convocação, quórum e votação online: o que precisa constar na convenção e como registrar a ata para a decisão ter o mesmo peso da presencial.',
    categorySlug: 'tecnologia',
    heroImageFilename: 'prestacao-contas.webp',
    readingTime: 9,
    publishedAt: '2026-07-02T09:00:00.000Z',
    keyTakeaways: [
      { point: 'A convenção (ou uma assembleia) precisa autorizar a modalidade virtual/híbrida.' },
      { point: 'Convocação, verificação de quórum e votação rastreável são inegociáveis.' },
      { point: 'A trilha de auditoria eletrônica é a prova — muitas vezes mais forte que a ata presencial.' },
    ],
    content: doc(
      p(
        'A assembleia virtual deixou de ser exceção. Em boa parte dos condomínios, ela já é a regra — mais barata, mais acessível e com quórum maior do que a presencial. Mas junto com a praticidade veio uma dúvida legítima: uma decisão tomada online tem o mesmo peso jurídico de uma tomada no salão de festas?',
      ),
      p(
        'A resposta curta é sim — desde que alguns cuidados sejam observados. A resposta longa é o que separa uma ata sólida de uma ata questionável na Justiça.',
      ),
      h('h2', 'A convenção precisa autorizar'),
      p(
        'O primeiro cuidado é o mais esquecido: a convenção do condomínio precisa prever expressamente a modalidade virtual ou híbrida. A Lei 14.309/2022 reconheceu as assembleias eletrônicas, mas a previsão na convenção — ou uma assembleia que a aprove — é o que dá segurança à decisão. Sem isso, a ata fica exposta a contestação.',
      ),
      h('h2', 'Convocação, quórum e votação auditável'),
      p('Três elementos precisam estar acima de qualquer dúvida:'),
      ul([
        [
          { text: 'Convocação', bold: true },
          ' — mesma antecedência e mesmos meios da presencial, agora com o link e as instruções de acesso.',
        ],
        [
          { text: 'Verificação de quórum', bold: true },
          ' — registro de quem entrou, quando entrou e em nome de qual unidade.',
        ],
        [
          { text: 'Votação rastreável', bold: true },
          ' — cada voto associado a um condômino identificado, com registro do horário.',
        ],
      ]),
      quote('Uma assembleia virtual vale tanto quanto a trilha de auditoria que ela deixa.'),
      h('h2', 'A ata é a prova'),
      p(
        'Na assembleia presencial, a ata assinada é a prova. Na virtual, a prova é a ata somada ao registro eletrônico: log de acesso, gravação e apuração dos votos. Bem feita, essa trilha torna a decisão mais difícil de contestar do que muitas atas presenciais.',
      ),
      p(
        'Na Semog, cada assembleia virtual é registrada com trilha de auditoria completa — de quem votou a que horas votou — para que a decisão tenha o mesmo peso legal de uma presencial, com a conveniência de participar do sofá de casa.',
      ),
    ),
  },
  {
    title: 'Fundo de reserva: quanto o seu condomínio deveria guardar por mês',
    slug: 'fundo-reserva-quanto-guardar-por-mes',
    excerpt:
      'A conta que evita rateio extra: os percentuais praticados, o que a convenção pode exigir e quando o fundo pode (e não pode) ser usado.',
    categorySlug: 'financas',
    heroImageFilename: 'residencial.webp',
    readingTime: 5,
    publishedAt: '2026-06-28T09:00:00.000Z',
    keyTakeaways: [
      { point: 'Faixa de mercado: 5% a 10% da arrecadação mensal, maior para prédios mais antigos.' },
      { point: 'Se a convenção fixa um mínimo, ele é obrigatório e entra no orçamento.' },
      { point: 'Use o fundo para imprevisto e obra de porte — nunca para despesa corrente.' },
    ],
    content: doc(
      p(
        'Fundo de reserva baixo é a causa número um de rateio extra. Quando o elevador quebra ou o telhado precisa de reparo, o condomínio sem reserva suficiente cobra a diferença de uma vez só — e a conta chega no pior momento possível.',
      ),
      p(
        'A pergunta que todo síndico faz é direta: quanto guardar por mês? A resposta não é um número mágico, mas um cálculo que qualquer condomínio pode fazer.',
      ),
      h('h2', 'O percentual praticado'),
      p(
        'A prática de mercado varia entre 5% e 10% da arrecadação mensal ordinária. Onde exatamente cair depende de dois fatores: a idade do prédio e o que a convenção exige. Prédios mais antigos, com mais equipamentos no fim da vida útil, precisam da ponta alta da faixa.',
      ),
      h('h2', 'O que a convenção pode — e deveria — exigir'),
      p(
        'A convenção pode fixar um percentual mínimo de contribuição ao fundo, e muitas fixam. Quando fixa, esse valor é obrigatório e entra no orçamento como despesa, não como opção. Onde a convenção é silente, cabe à assembleia definir — e é uma boa pauta para não deixar em aberto.',
      ),
      quote(
        'Reserva não é dinheiro parado. É a diferença entre uma manutenção planejada e um rateio de emergência.',
      ),
      h('h2', 'Quando usar'),
      p(
        'O fundo de reserva cobre o imprevisto e o de grande porte: quebra de equipamento, reparo estrutural, obra não recorrente. Não deveria ser usado para despesa corrente — pagar a conta de luz com o fundo é sinal de que o orçamento ordinário está subdimensionado, um problema diferente.',
      ),
      p(
        'A equipe Semog projeta, junto com o síndico, quanto reservar mês a mês com base no histórico de manutenção do prédio — para que o fundo cubra o previsível sem pesar demais no orçamento corrente.',
      ),
    ),
  },
  {
    title: 'Assembleia de instalação: o checklist completo para condomínios novos',
    slug: 'assembleia-instalacao-checklist-condominios-novos',
    excerpt:
      'Da convocação dos compradores ao CNPJ do condomínio, tudo o que precisa acontecer na ordem certa para o condomínio nascer juridicamente pronto.',
    categorySlug: 'incorporadoras',
    heroImageFilename: 'incorporadoras.webp',
    readingTime: 10,
    publishedAt: '2026-06-22T09:00:00.000Z',
    keyTakeaways: [
      { point: 'Convoque todos os compradores e chegue com convenção, regimento e orçamento prontos.' },
      { point: 'Na assembleia: instale o condomínio, aprove os documentos, eleja o síndico e a taxa — nessa ordem.' },
      { point: 'A ata destrava CNPJ, conta bancária e registro em cartório: sem ela, nada anda.' },
    ],
    content: doc(
      p(
        'A assembleia de instalação é o primeiro ato jurídico da vida de um condomínio. Antes dela, o empreendimento é um prédio entregue; depois dela, é um condomínio que existe de fato — com CNPJ, síndico eleito e conta bancária própria. Pular ou atrasar essa etapa trava tudo o que vem em seguida.',
      ),
      p(
        'Para a incorporadora, conduzir bem essa assembleia é parte de entregar o produto. Um condomínio que começa organizado gera menos atrito no pós-obra e protege a reputação do empreendimento. Este é o checklist, na ordem em que cada coisa precisa acontecer.',
      ),
      h('h2', 'Antes da assembleia'),
      p(
        'A base é a convocação. Todos os compradores precisam ser formalmente convocados, com antecedência e pauta clara. Em paralelo, três documentos precisam estar prontos para leitura e aprovação:',
      ),
      ul([
        [
          { text: 'Convenção de condomínio', bold: true },
          ' — as regras estruturais, que serão registradas em cartório.',
        ],
        [
          { text: 'Regimento interno', bold: true },
          ' — o dia a dia: uso de áreas comuns, silêncio, animais, mudanças.',
        ],
        [
          { text: 'Previsão orçamentária inicial', bold: true },
          ' — a primeira taxa condominial, com base nas despesas estimadas de operação.',
        ],
      ]),
      h('h2', 'Durante a assembleia'),
      p('Com todos convocados, a assembleia segue uma ordem que dá segurança jurídica à ata:'),
      ol([
        [
          { text: 'Instalação formal do condomínio', bold: true },
          ' e registro da presença dos compradores.',
        ],
        [{ text: 'Leitura e aprovação da convenção e do regimento interno.', bold: true }],
        [
          { text: 'Eleição do síndico', bold: true },
          ', do subsíndico e do conselho fiscal.',
        ],
        [
          { text: 'Aprovação da previsão orçamentária', bold: true },
          ' e definição da primeira taxa.',
        ],
      ]),
      quote(
        'Sem assembleia de instalação não há CNPJ, não há síndico e não há conta em nome do condomínio. Tudo o mais depende dela.',
      ),
      h('h2', 'Depois da assembleia'),
      p(
        'A ata da instalação é o documento que destrava o resto: com ela, abre-se o CNPJ do condomínio, a conta bancária em nome do condomínio e o registro da convenção em cartório. A partir daí, o condomínio pode contratar, cobrar e ser cobrado como pessoa jurídica.',
      ),
      p(
        'A Semog conduz esse processo do começo ao fim — da convocação dos compradores ao registro em cartório — para que a incorporadora entregue as chaves com o condomínio juridicamente pronto para funcionar, e o morador comece a vida nova sem herdar uma pendência.',
      ),
    ),
  },
]

async function seedPosts() {
  const payload = await getPayload({ config })

  const categoryIdBySlug = new Map<string, number>()
  for (const category of categoriesData) {
    const existing = await payload.find({
      collection: 'categories',
      where: { slug: { equals: category.slug } },
      limit: 1,
      depth: 0,
    })

    if (existing.docs[0]) {
      const updated = await payload.update({
        collection: 'categories',
        id: existing.docs[0].id,
        data: category,
      })
      categoryIdBySlug.set(category.slug, updated.id)
      console.log(`[seed:posts] Categoria "${category.title}" atualizada (id=${updated.id}).`)
    } else {
      const created = await payload.create({
        collection: 'categories',
        data: category,
      })
      categoryIdBySlug.set(category.slug, created.id)
      console.log(`[seed:posts] Categoria "${category.title}" criada (id=${created.id}).`)
    }
  }

  for (const post of postsData) {
    const { categorySlug, heroImageFilename, ...rest } = post
    const heroImageId = await getMediaId(payload, heroImageFilename)
    const data = {
      ...rest,
      category: categoryIdBySlug.get(categorySlug),
      heroImage: heroImageId,
      _status: 'published' as const,
    }

    const existing = await payload.find({
      collection: 'posts',
      where: { slug: { equals: post.slug } },
      limit: 1,
      depth: 0,
    })

    if (existing.docs[0]) {
      const updated = await payload.update({
        collection: 'posts',
        id: existing.docs[0].id,
        data,
      })
      console.log(`[seed:posts] Post "${post.title}" atualizado (id=${updated.id}).`)
    } else {
      const created = await payload.create({
        collection: 'posts',
        data,
      })
      console.log(`[seed:posts] Post "${post.title}" criado (id=${created.id}).`)
    }
  }
}

await seedPosts()
