import config from '@payload-config'
import { getPayload } from 'payload'
import { getMediaId } from './lib/media'

/**
 * Seed idempotente de 6 categorias + 7 posts do blog. Os cards da listagem
 * `/blog` (hero + destaque + grade) seguem fiéis a `_reference/blog.html`; já o
 * CONTEÚDO de cada post é long-form (intertítulos, listas, citação e
 * `keyTakeaways` — a caixa "Em resumo") para preencher o layout "flagship" da
 * página do artigo `/blog/[slug]` (`src/app/(frontend)/blog/[slug]/page.tsx`).
 * Cada post tem `heroImage` (via `getMediaId`, assets já semeados por
 * `pnpm seed:media`) e `readingTime` (alimenta o "meta" dos cards e da página).
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
      'Como montar um orçamento que passa na assembleia sem cortes cegos e sem sustos no meio do ano. O passo a passo que a equipe Semog usa em centenas de condomínios.',
    categorySlug: 'financas',
    heroImageFilename: 'blog-financas.webp',
    readingTime: 11,
    publishedAt: '2026-07-14T09:00:00.000Z',
    keyTakeaways: [
      { point: 'Separe despesa recorrente de investimento pontual antes de projetar qualquer número.' },
      { point: 'Mapeie reajustes de contrato e dissídio num calendário — quase nada é surpresa.' },
      { point: 'Trate o fundo de reserva como linha fixa do orçamento, não como sobra de caixa.' },
      { point: 'Leve a assembleia cada aumento com uma explicação de uma linha: contrato e data.' },
    ],
    content: doc(
      p(
        'Um orçamento bem construído não é uma peça de burocracia para "cumprir tabela" na assembleia. É o documento que decide se manutenção, obras e reserva vão caber na taxa condominial — ou virar rateio extra no meio do ano, sempre no pior momento.',
      ),
      p(
        'Na prática, a maioria dos orçamentos reprovados em assembleia não falha pelos números. Falha porque os números chegam sem história: uma planilha com linhas que ninguém sabe de onde vieram. O condômino não vota contra o reajuste — vota contra o que não entende. Este guia mostra como montar um orçamento que se explica sozinho.',
      ),
      h('h2', '1. Comece pelo histórico, não pela projeção'),
      p(
        'Antes de projetar qualquer centavo, reúna os últimos doze meses de despesa real do condomínio. Doze meses, não três: só assim você captura os gastos sazonais (a conta de água do verão, a manutenção do aquecimento no inverno) e os anuais (seguro, dedetização, laudos). Com esse histórico na mão, separe cada gasto em três categorias claras:',
      ),
      ul([
        [
          { text: 'Recorrente fixo', bold: true },
          ' — folha de pagamento, contratos de manutenção, seguro obrigatório, taxas. Muda pouco e é previsível.',
        ],
        [
          { text: 'Recorrente variável', bold: true },
          ' — água, energia, gás, produtos de limpeza. Oscila com consumo, tarifa e estação do ano.',
        ],
        [
          { text: 'Investimento pontual', bold: true },
          ' — pintura, troca de bombas, reforma de fachada, modernização de elevador. Não é despesa do dia a dia e não deveria pesar na taxa mensal ordinária.',
        ],
      ]),
      p(
        'Essa separação é o que mais falta nos orçamentos amadores. Sem ela, uma obra de fachada de R$ 80 mil entra diluída na taxa e faz parecer que "o condomínio ficou caro" — quando, na verdade, foi um investimento único que deveria ter saído do fundo de reserva ou de uma cota específica.',
      ),
      quote('A assembleia não rejeita números. Rejeita números sem explicação.'),
      h('h2', '2. Projete os reajustes que você já conhece'),
      p(
        'Boa parte do aumento de um orçamento não é surpresa nenhuma. É calendário. Contratos com reajuste anual por índice, dissídio da categoria dos funcionários, tarifas públicas de água e energia — tudo isso é previsível meses antes de acontecer. O síndico que chega na assembleia com essas datas mapeadas muda o tom do debate: de "será que vai faltar?" para "já sabemos o que vem e estamos cobrindo".',
      ),
      h('h3', 'Monte um calendário de reajustes'),
      p('Liste, mês a mês, o que já está contratado para subir no próximo exercício:'),
      ul([
        [
          { text: 'Dissídio dos funcionários', bold: true },
          ' — a data-base da categoria (varia por município); reserve o percentual estimado da convenção coletiva.',
        ],
        [
          { text: 'Contratos indexados', bold: true },
          ' — limpeza, portaria, elevador, jardinagem costumam reajustar por IPCA ou IGP-M na data de aniversário.',
        ],
        [
          { text: 'Tarifas públicas', bold: true },
          ' — água e energia têm reajustes anuais divulgados pelas agências reguladoras.',
        ],
      ]),
      p(
        'Com esse calendário, o orçamento deixa de ser um chute anual e vira uma projeção defensável, linha por linha. Quando um condômino perguntar "por que subiu 8%?", a resposta não é "porque tudo aumentou" — é "o dissídio pesou 3%, o contrato de elevador 1,5%, a energia 2%, e o restante é a recomposição do fundo".',
      ),
      h('h2', '3. Fundo de reserva: a linha que evita o rateio'),
      p(
        'O fundo de reserva entra no orçamento como linha própria, nunca como sobra. Um percentual fixo da arrecadação — a prática de mercado fica entre 5% e 10% — aprovado em assembleia, é o que evita o rateio extraordinário quando o elevador para ou o telhado precisa de reparo. Prédios mais antigos, com mais equipamentos no fim da vida útil, precisam da ponta alta dessa faixa.',
      ),
      p(
        'A regra é simples: despesa previsível vai para o orçamento ordinário; imprevisto e obra de grande porte saem do fundo. Usar o fundo para pagar conta de luz é sinal de que a taxa mensal está subdimensionada — um problema diferente, que só se resolve corrigindo a base, não sacando da reserva.',
      ),
      h('h2', '4. Como apresentar (a parte que decide a votação)'),
      p(
        'Um bom orçamento mal apresentado é reprovado do mesmo jeito. Alguns cuidados de comunicação fazem a diferença entre uma assembleia tranquila e três horas de discussão:',
      ),
      ul([
        [
          { text: 'Compare com o ano anterior', bold: true },
          ' — mostre cada rubrica lado a lado, com a variação em reais e em percentual. O condômino confia no que consegue comparar.',
        ],
        [
          { text: 'Traga a taxa por unidade', bold: true },
          ' — ninguém vota em "receita total de R$ 1,2 milhão"; as pessoas votam no boleto que vai chegar. Mostre o valor final por apartamento.',
        ],
        [
          { text: 'Antecipe as três maiores perguntas', bold: true },
          ' — normalmente são o reajuste, o fundo e alguma obra. Responda antes de perguntarem.',
        ],
      ]),
      quote('O melhor orçamento é o que o condômino consegue explicar para o vizinho no elevador.'),
      h('h2', '5. O erro mais comum: cortar no lugar errado'),
      p(
        'Sob pressão para "não aumentar a taxa", muitos condomínios cortam exatamente o que não deveriam: a manutenção preventiva e o aporte ao fundo. É a economia que sai mais cara. Adiar a manutenção do elevador não elimina o custo — só o transfere para frente, maior, e ainda cria risco. Zerar o fundo não reduz a despesa — só garante que a próxima emergência vire rateio.',
      ),
      p(
        'Com todo esse material em mãos — histórico categorizado, calendário de reajustes, fundo dimensionado e uma apresentação clara — a assembleia deixa de ser um embate sobre planilhas soltas e vira uma decisão informada sobre prioridades. É esse trabalho, invisível para o condômino e decisivo para o síndico, que a equipe Semog entrega em cada previsão orçamentária e em cada prestação de contas.',
      ),
    ),
  },
  {
    title: 'Inadimplência no condomínio: o que a lei permite e o que resolve de verdade',
    slug: 'inadimplencia-condominio-o-que-a-lei-permite',
    excerpt:
      'Dos juros permitidos à negativação, um mapa honesto das opções — e por que a régua de cobrança vence a ação judicial na recuperação do caixa.',
    categorySlug: 'inadimplencia',
    heroImageFilename: 'garante.webp',
    readingTime: 9,
    publishedAt: '2026-07-11T09:00:00.000Z',
    keyTakeaways: [
      { point: 'A lei limita a multa a 2% e os juros de mora a 1% ao mês — nada de valores "inventados".' },
      { point: 'A régua de cobrança nos primeiros dias recupera mais que qualquer ação judicial.' },
      { point: 'Acordo com entrada, parcelas e vencimento antecipado é mais rápido e barato que execução.' },
      { point: 'O crédito condominial tem preferência e pode chegar à penhora do próprio imóvel.' },
    ],
    content: doc(
      p(
        'Inadimplência não é um problema de cobrança — é um problema de caixa. Cada boleto em atraso é uma conta do condomínio que alguém vai ter que pagar: ou o vizinho adimplente, via rateio, ou o próprio prédio, adiando manutenção. Tratar o assunto como "processo do inadimplente" é olhar tarde demais para o lado errado.',
      ),
      p(
        'A boa notícia é que a lei dá ferramentas. A má é que quase todas chegam tarde. Entender o que cada uma resolve — e o que não resolve — é o primeiro passo para tratar inadimplência como processo contínuo, não como emergência pontual.',
      ),
      h('h2', 'O que a lei permite'),
      p(
        'O Código Civil e a convenção do condomínio autorizam, sobre a cota condominial em atraso, um conjunto bem definido de encargos:',
      ),
      ul([
        [
          { text: 'Multa de até 2%', bold: true },
          ' sobre o valor da cota — o teto é fixado em lei (art. 1.336, §1º do Código Civil) e não pode ser maior, por mais que a convenção antiga diga o contrário.',
        ],
        [
          { text: 'Juros de mora de 1% ao mês', bold: true },
          ', salvo se a convenção previr percentual diferente.',
        ],
        [
          { text: 'Correção monetária', bold: true },
          ' pelo índice previsto na convenção, para o valor não perder poder de compra ao longo do atraso.',
        ],
        [
          { text: 'Cobrança judicial por execução', bold: true },
          ' — a cota condominial é dívida com garantia real sobre a própria unidade, o que dá ao condomínio preferência e, no limite, permite a penhora do imóvel, ainda que seja bem de família.',
        ],
      ]),
      p(
        'Em casos de reincidência, o condômino inadimplente contumaz pode ainda responder por multa mais alta (até cinco vezes o valor da cota, conforme o art. 1.337) e ter o débito levado a protesto ou negativação. São instrumentos legítimos e poderosos — mas todos atuam depois que o buraco no caixa já existe.',
      ),
      quote(
        'O efeito mais forte contra a inadimplência acontece nos primeiros dias de atraso, não nos tribunais.',
      ),
      h('h2', 'Por que a prevenção vence a cobrança'),
      p(
        'A régua de cobrança — a sequência de contatos que dispara automaticamente a partir do vencimento — é o que mais reduz inadimplência na prática. Quanto antes o condomínio se manifesta, maior a chance de recuperar sem desgaste. Uma régua bem desenhada tem etapas claras:',
      ),
      ol([
        [
          { text: 'Lembrete pré-vencimento', bold: true },
          ' — dois ou três dias antes, um aviso amigável. Boa parte do atraso é esquecimento, não falta de dinheiro.',
        ],
        [
          { text: 'Contato no primeiro atraso', bold: true },
          ' — logo nos primeiros dias, com o boleto atualizado e um canal aberto para dúvidas.',
        ],
        [
          { text: 'Proposta de negociação', bold: true },
          ' — na segunda ou terceira semana, antes de o débito virar bola de neve, oferecer parcelamento.',
        ],
        [
          { text: 'Notificação formal', bold: true },
          ' — persistindo o atraso, a notificação extrajudicial que antecede (e muitas vezes evita) a ação.',
        ],
      ]),
      p(
        'Transparência ajuda tanto quanto cobrança. Quando o condômino entende que o atraso dele adia a pintura do prédio ou encarece a taxa de todos, o comportamento muda. Cobrança fria gera resistência; contexto gera pagamento.',
      ),
      h('h2', 'Acordo é quase sempre melhor que ação'),
      p(
        'Uma execução judicial pode se arrastar por anos e ainda gerar custas. Um acordo bem estruturado recupera o crédito mais rápido e mais barato. O bom acordo tem três elementos: uma entrada que sinaliza compromisso, parcelas que cabem no orçamento do devedor e uma cláusula de vencimento antecipado — se uma parcela falhar, o saldo todo volta a vencer, o que protege o condomínio.',
      ),
      p(
        'A ação judicial continua sendo necessária para os casos que não negociam. Mas ela deve ser o fim de um processo, não o começo. Na Semog, cada inadimplência entra primeiro como negociação a ser resolvida — e só vira processo quando o diálogo se esgota. É essa ordem que mantém o caixa do condomínio saudável sem transformar o vizinho devedor em réu antes da hora.',
      ),
    ),
  },
  {
    title: 'Cinco sinais de que é hora de trocar de administradora',
    slug: 'cinco-sinais-trocar-administradora',
    excerpt:
      'Balancete atrasado, boleto errado, telefone que não atende. Saiba quando o problema deixou de ser pontual e virou estrutural — e como fazer a transição sem solavanco.',
    categorySlug: 'gestao',
    heroImageFilename: 'comercial.webp',
    readingTime: 8,
    publishedAt: '2026-07-08T09:00:00.000Z',
    keyTakeaways: [
      { point: 'Balancete atrasado e erro financeiro recorrente são falha de processo, não deslize.' },
      { point: 'Sem indicadores de gestão, a administradora só paga contas — não administra.' },
      { point: 'Dois ou mais sinais ao mesmo tempo indicam problema estrutural, não pontual.' },
      { point: 'A transição bem conduzida migra dados e cobrança sem o condômino sentir.' },
    ],
    content: doc(
      p(
        'Trocar de administradora dá trabalho, e por isso a maioria dos síndicos adia — mesmo quando os sinais já são claros. O problema é que o custo de continuar com uma administradora ruim raramente aparece de uma vez. Ele se acumula, silencioso, em balancetes atrasados, boletos errados e assembleias sem resposta, até virar uma soma que ninguém mediu.',
      ),
      p(
        'Isoladamente, cada deslize parece pontual. Juntos e recorrentes, são sintoma de estrutura insuficiente. Estes são os cinco sinais que, quando aparecem em conjunto, indicam que o problema deixou de ser um dia ruim e virou o padrão:',
      ),
      ol([
        [
          { text: 'Balancete que atrasa todo mês. ', bold: true },
          'A prestação de contas fora do prazo não é esquecimento: é falta de processo. Sem balancete em dia, o síndico administra no escuro e o conselho fiscal não consegue fazer o próprio trabalho.',
        ],
        [
          { text: 'Erros financeiros que se repetem. ', bold: true },
          'Boleto com valor errado, cobrança em duplicidade, rateio que não fecha, fundo que "some" do relatório. Um erro acontece; o mesmo erro todo mês é sistema quebrado.',
        ],
        [
          { text: 'Telefone que ninguém atende. ', bold: true },
          'Quando o canal de atendimento vira caixa postal, o condômino desconta no síndico — e o síndico, que era para coordenar, vira atendente de segunda linha da administradora.',
        ],
        [
          { text: 'Nenhum indicador de gestão. ', bold: true },
          'Administradora que não mostra inadimplência, evolução de consumo, comparativo de despesas e saldo do fundo não está gerindo. Está apenas pagando contas — e cobrando por isso.',
        ],
        [
          { text: 'Pautas de assembleia sem resposta. ', bold: true },
          'Se o que foi decidido em assembleia não vira ação nas semanas seguintes, a administradora deixou de ser parceira e virou obstáculo entre a decisão e a execução.',
        ],
      ]),
      quote(
        'Um sinal é um deslize. Dois ou mais ao mesmo tempo é um padrão — e padrão não melhora sozinho.',
      ),
      h('h2', 'Quando o custo de ficar supera o de trocar'),
      p(
        'A conta que ninguém faz é a mais importante. Quanto tempo o síndico gasta por mês corrigindo o trabalho da administradora? Quanto o condomínio perde em inadimplência mal gerida, em manutenção adiada, em multas por obrigação não cumprida? Some tudo isso e compare com o incômodo pontual de uma transição. Quando a primeira conta supera a segunda, a troca deixou de ser opção e virou necessidade.',
      ),
      p(
        'Há também um custo invisível: o desgaste do síndico. Muita gente desiste do cargo não pelo condomínio, mas pela administradora — e um condomínio sem síndico disposto é um condomínio à deriva.',
      ),
      h('h2', 'A transição é mais tranquila do que parece'),
      p(
        'O medo da transição costuma ser maior que a transição em si. Feita direito, a nova administradora assume o histórico, migra os dados financeiros, reemite a cobrança e reorganiza os contratos sem que o condômino sinta o solavanco. O que muda para o morador é o boleto vir certo e o telefone ser atendido.',
      ),
      p('Uma boa transição cobre, na ordem:'),
      ul([
        [
          { text: 'Levantamento da situação atual', bold: true },
          ' — contas, contratos, processos, inadimplência e saldo do fundo, tudo mapeado antes da virada.',
        ],
        [
          { text: 'Migração de dados', bold: true },
          ' — histórico financeiro e cadastro das unidades, para não recomeçar do zero.',
        ],
        [
          { text: 'Comunicação aos moradores', bold: true },
          ' — quem passa a atender, por quais canais, e como fica o boleto do próximo mês.',
        ],
      ]),
      p(
        'Na Semog, esse processo é conduzido passo a passo, com o síndico acompanhando cada etapa — porque a troca só vale a pena se a primeira impressão do condomínio for a de que, finalmente, alguém assumiu o controle.',
      ),
    ),
  },
  {
    title: 'Áreas de lazer: como definir regras de uso sem virar guerra em assembleia',
    slug: 'areas-lazer-regras-de-uso',
    excerpt:
      'Reserva, taxa de uso e horário de silêncio: os pontos que resolvem a maior parte dos conflitos antes de chegarem à portaria — com modelos que funcionam em condomínios reais.',
    categorySlug: 'convivencia',
    heroImageFilename: 'blog-lazer.webp',
    readingTime: 8,
    publishedAt: '2026-07-05T09:00:00.000Z',
    keyTakeaways: [
      { point: "Reserva com antecedência e limite por unidade acaba com o 'salão dos mesmos'." },
      { point: 'Taxa de uso proporcional conserva o espaço sem penalizar quem não usa.' },
      { point: 'Horário de silêncio só vale quando está escrito e é aplicado igual para todos.' },
      { point: 'Regra detalhada no regimento evita mediação de conflito depois.' },
    ],
    content: doc(
      p(
        'Salão de festas, churrasqueira, academia e piscina são, ao mesmo tempo, o que mais valoriza um condomínio e o que mais gera briga em grupo de WhatsApp. A diferença entre uma área de lazer que une e uma que divide quase nunca está no espaço — está na regra. Ou melhor: na ausência dela.',
      ),
      p(
        'Regra de uso mal escrita, ou escrita e não aplicada, é a origem da maioria dos conflitos que chegam à portaria e, depois, à assembleia. O caminho para evitá-los é definir três coisas com clareza antes que o problema apareça. Cada uma resolve uma categoria inteira de atrito.',
      ),
      h('h2', '1. Reserva com antecedência e critério'),
      p(
        'Quem reserva primeiro usa — mas com regra. Antecedência mínima, limite de reservas por unidade no mês e uma fila transparente evitam o clássico "salão sempre reservado pelas mesmas famílias". O sistema de reserva precisa ser visível a todos, não um caderno na portaria que só o porteiro do turno conhece.',
      ),
      p(
        'Um bom regramento de reserva responde, por escrito, a estas perguntas: com quantos dias de antecedência se reserva? Quantas vezes por mês cada unidade pode reservar o mesmo espaço? O que acontece se a pessoa reservar e não usar? Como se cancela? Onde qualquer morador consulta a agenda? Sem essas respostas, cada reserva vira uma negociação — e toda negociação repetida vira conflito.',
      ),
      h('h2', '2. Taxa de uso proporcional ao desgaste'),
      p(
        'Cobrar pelo uso do salão ou da churrasqueira não é punição: é o que mantém o espaço conservado sem que o custo caia sobre quem nunca usa. A taxa deve ser proporcional ao desgaste real — limpeza, reposição, manutenção — e o valor arrecadado, idealmente, volta para a própria área, num fundo de conservação do lazer.',
      ),
      p(
        'A lógica é de justiça: o morador que faz uma festa por mês desgasta o salão muito mais que o vizinho que nunca entrou lá. Diluir esse custo na taxa condominial de todos é transferir a conta de quem usa para quem não usa. A taxa de uso corrige isso e, de quebra, financia a manutenção que mantém o espaço apresentável.',
      ),
      h('h2', '3. Horário de silêncio que todos conhecem'),
      p(
        'O horário de silêncio precisa estar no regimento, não na memória de cada morador. Definido, divulgado e aplicado igual para todos, ele resolve a maior parte dos atritos de convivência antes que virem reclamação formal. O detalhe que falta na maioria dos condomínios não é o horário em si — é a regra do que acontece quando ele é descumprido.',
      ),
      quote('Regra clara evita mediação de conflito. Regra vaga cria uma.'),
      h('h2', 'O que separa a regra que funciona da que não funciona'),
      p(
        'Cada uma dessas regras precisa estar detalhada no regimento interno — não citada de forma genérica. "Usar com bom senso" não é regra; é convite ao conflito, porque o bom senso de um vizinho não é o do outro. Três características distinguem a regra que pega da que fica no papel:',
      ),
      ul([
        [
          { text: 'É específica', bold: true },
          ' — traz números, horários e limites, não princípios vagos.',
        ],
        [
          { text: 'É igual para todos', bold: true },
          ' — vale para o síndico, para o conselheiro e para o morador do último andar da mesma forma. A exceção informal destrói a regra inteira.',
        ],
        [
          { text: 'Tem consequência prevista', bold: true },
          ' — a advertência e a multa por descumprimento estão escritas, com valor e rito, antes de serem necessárias.',
        ],
      ]),
      p(
        'A equipe Semog ajuda síndicos a redigir e aprovar esse regimento em assembleia, com modelos já testados em centenas de condomínios — porque regra clara, aprovada com quórum e aplicada com isonomia, é o que transforma a área de lazer de fonte de briga em motivo de orgulho do prédio.',
      ),
    ),
  },
  {
    title: 'Assembleia virtual tem validade jurídica? O que diz a lei em 2026',
    slug: 'assembleia-virtual-validade-juridica',
    excerpt:
      'Convocação, quórum e votação online: o que precisa constar na convenção e como registrar a ata para a decisão ter o mesmo peso jurídico da presencial.',
    categorySlug: 'tecnologia',
    heroImageFilename: 'prestacao-contas.webp',
    readingTime: 9,
    publishedAt: '2026-07-02T09:00:00.000Z',
    keyTakeaways: [
      { point: 'A Lei 14.309/2022 reconhece assembleias virtuais e híbridas — elas são válidas.' },
      { point: 'A convenção (ou uma assembleia) precisa autorizar expressamente a modalidade.' },
      { point: 'Convocação, verificação de quórum e votação rastreável são inegociáveis.' },
      { point: 'A trilha de auditoria eletrônica é a prova — muitas vezes mais forte que a ata presencial.' },
    ],
    content: doc(
      p(
        'A assembleia virtual deixou de ser exceção. Em boa parte dos condomínios, ela já é a regra — mais barata, mais acessível e, quase sempre, com quórum maior do que a presencial, porque participar do sofá de casa é bem mais fácil do que descer ao salão numa noite de terça. Mas junto com a praticidade veio uma dúvida legítima: uma decisão tomada online tem o mesmo peso jurídico de uma tomada no salão de festas?',
      ),
      p(
        'A resposta curta é sim. A Lei 14.309/2022 alterou o Código Civil e reconheceu expressamente as assembleias condominiais eletrônicas e híbridas. A resposta longa — os cuidados que separam uma ata sólida de uma ata questionável na Justiça — é o que este artigo cobre.',
      ),
      h('h2', 'A convenção precisa autorizar (ou a assembleia decidir)'),
      p(
        'O primeiro cuidado é o mais esquecido: a modalidade virtual precisa estar autorizada. A lei permite, mas a segurança jurídica vem de a convenção do condomínio prever a assembleia eletrônica — ou de uma assembleia (presencial ou virtual, convocada para isso) aprovar o uso da modalidade. Sem essa previsão, abre-se margem para um condômino insatisfeito contestar a validade da ata depois, e uma decisão importante pode ser anulada por vício de forma.',
      ),
      p(
        'Na prática, o caminho mais seguro é incluir na convenção um artigo curto autorizando assembleias virtuais e híbridas e delegando ao síndico a escolha da plataforma. Feito uma vez, resolve para sempre.',
      ),
      h('h2', 'Os três pilares de uma assembleia virtual válida'),
      p('Três elementos precisam estar acima de qualquer dúvida — são eles que sustentam a ata:'),
      ul([
        [
          { text: 'Convocação', bold: true },
          ' — mesma antecedência e mesmos meios da presencial, agora acrescida do link de acesso, das instruções e do horário. A convocação defeituosa é o vício mais comum e o mais fácil de evitar.',
        ],
        [
          { text: 'Verificação de quórum', bold: true },
          ' — registro de quem entrou, quando entrou e em nome de qual unidade, com conferência de que quem vota é o titular ou o procurador legítimo.',
        ],
        [
          { text: 'Votação rastreável', bold: true },
          ' — cada voto associado a um condômino identificado, com registro do horário e do sentido do voto, para que a apuração seja auditável.',
        ],
      ]),
      quote('Uma assembleia virtual vale tanto quanto a trilha de auditoria que ela deixa.'),
      h('h2', 'A ata é a prova — e a eletrônica pode ser mais forte'),
      p(
        'Na assembleia presencial, a ata assinada é a prova. Na virtual, a prova é a ata somada ao registro eletrônico: log de acesso, gravação da reunião e apuração nominal dos votos. Aqui está a virada de chave que muita gente não percebe: bem feita, essa trilha torna a decisão mais difícil de contestar do que muitas atas presenciais, em que ninguém sabe ao certo quem estava na sala na hora da votação.',
      ),
      p(
        'A ata da assembleia virtual deve registrar a modalidade, a plataforma usada, a forma de convocação, o quórum apurado e o resultado de cada votação. Anexada ao registro eletrônico, ela forma um conjunto probatório robusto.',
      ),
      h('h2', 'Híbrida: o melhor dos dois mundos'),
      p(
        'Para condomínios com moradores menos familiarizados com tecnologia, a assembleia híbrida — presencial e online ao mesmo tempo — costuma ser a transição ideal. Quem quer, comparece; quem prefere, participa remotamente; e ambos votam com o mesmo peso. O cuidado extra é garantir que os dois canais enxerguem e sejam ouvidos na mesma reunião, sem que o grupo presencial decida à parte.',
      ),
      p(
        'Na Semog, cada assembleia virtual ou híbrida é registrada com trilha de auditoria completa — de quem votou a que horas votou — para que a decisão tenha o mesmo peso legal de uma presencial, com a conveniência de participar de onde estiver.',
      ),
    ),
  },
  {
    title: 'Fundo de reserva: quanto o seu condomínio deveria guardar por mês',
    slug: 'fundo-reserva-quanto-guardar-por-mes',
    excerpt:
      'A conta que evita rateio extra: os percentuais praticados, o que a convenção pode exigir, onde guardar e quando o fundo pode (e não pode) ser usado.',
    categorySlug: 'financas',
    heroImageFilename: 'residencial.webp',
    readingTime: 7,
    publishedAt: '2026-06-28T09:00:00.000Z',
    keyTakeaways: [
      { point: 'Faixa de mercado: 5% a 10% da arrecadação mensal, maior para prédios mais antigos.' },
      { point: 'Se a convenção fixa um mínimo, ele é obrigatório e entra no orçamento como despesa.' },
      { point: 'Use o fundo para imprevisto e obra de porte — nunca para despesa corrente.' },
      { point: 'Fundo bem aplicado rende; parado na conta, perde para a inflação.' },
    ],
    content: doc(
      p(
        'Fundo de reserva baixo é a causa número um de rateio extra. Quando o elevador quebra ou o telhado precisa de reparo, o condomínio sem reserva suficiente cobra a diferença de uma vez só dos moradores — e a conta chega no pior momento possível, sem aviso e sem escolha.',
      ),
      p(
        'A pergunta que todo síndico faz é direta: quanto guardar por mês? A resposta não é um número mágico, mas um cálculo que qualquer condomínio pode fazer — desde que trate a reserva como parte do orçamento, e não como o que sobra dele.',
      ),
      h('h2', 'O percentual praticado'),
      p(
        'A prática de mercado varia entre 5% e 10% da arrecadação mensal ordinária. Onde exatamente cair depende de dois fatores: a idade do prédio e o que a convenção exige. Prédios mais novos, com equipamentos e estrutura no começo da vida útil, podem trabalhar na ponta baixa. Prédios mais antigos, com elevadores, bombas e fachada pedindo atenção, precisam da ponta alta — às vezes acima dela, quando há uma obra grande no horizonte.',
      ),
      p(
        'Um jeito mais preciso de calcular é olhar para frente: liste as grandes manutenções previsíveis dos próximos cinco a dez anos — pintura de fachada, modernização de elevador, troca de telhado ou de bombas —, estime o custo de cada uma e divida pelo número de meses até lá. Esse valor é o piso do que o fundo deveria receber por mês para não pegar ninguém de surpresa.',
      ),
      h('h2', 'O que a convenção pode — e deveria — exigir'),
      p(
        'A convenção pode fixar um percentual mínimo de contribuição ao fundo, e muitas fixam. Quando fixa, esse valor é obrigatório e entra no orçamento como despesa, não como opção que a assembleia decide ano a ano. Onde a convenção é silente, cabe à assembleia definir — e é uma das melhores pautas para não deixar em aberto, porque protege o condomínio das gestões que preferem "não aumentar a taxa" às custas da reserva.',
      ),
      quote(
        'Reserva não é dinheiro parado. É a diferença entre uma manutenção planejada e um rateio de emergência.',
      ),
      h('h2', 'Onde guardar (para não perder para a inflação)'),
      p(
        'Fundo de reserva parado em conta corrente perde valor todo mês. O correto é mantê-lo em aplicação de baixo risco e liquidez — tipicamente um fundo de renda fixa conservador ou uma poupança/CDB atrelado à conta do condomínio —, sempre em nome do condomínio e visível na prestação de contas. A regra de ouro: liquidez suficiente para cobrir o imprevisto sem precisar resgatar no prejuízo.',
      ),
      h('h2', 'Quando usar (e quando não)'),
      p(
        'O fundo de reserva cobre o imprevisto e o de grande porte: quebra de equipamento, reparo estrutural, obra não recorrente, uma emergência de segurança. Não deveria ser usado para despesa corrente. Pagar a conta de luz ou a folha com o fundo é sinal de que o orçamento ordinário está subdimensionado — um problema diferente, que só se resolve corrigindo a taxa, não sacando da reserva até ela zerar.',
      ),
      p(
        'A equipe Semog projeta, junto com o síndico, quanto reservar mês a mês com base no histórico de manutenção e no ciclo de vida dos equipamentos do prédio — para que o fundo cubra o previsível sem pesar demais no orçamento corrente, e esteja lá no dia em que ninguém queria precisar dele.',
      ),
    ),
  },
  {
    title: 'Assembleia de instalação: o checklist completo para condomínios novos',
    slug: 'assembleia-instalacao-checklist-condominios-novos',
    excerpt:
      'Da convocação dos compradores ao CNPJ do condomínio, tudo o que precisa acontecer na ordem certa para o condomínio nascer juridicamente pronto para funcionar.',
    categorySlug: 'incorporadoras',
    heroImageFilename: 'incorporadoras.webp',
    readingTime: 10,
    publishedAt: '2026-06-22T09:00:00.000Z',
    keyTakeaways: [
      { point: 'Convoque todos os compradores e chegue com convenção, regimento e orçamento prontos.' },
      { point: 'Na assembleia: instale o condomínio, aprove os documentos, eleja o síndico e a taxa — nessa ordem.' },
      { point: 'A ata destrava CNPJ, conta bancária e registro em cartório: sem ela, nada anda.' },
      { point: 'Condomínio que começa organizado gera menos atrito no pós-obra e protege a incorporadora.' },
    ],
    content: doc(
      p(
        'A assembleia de instalação é o primeiro ato jurídico da vida de um condomínio. Antes dela, o empreendimento é um prédio entregue; depois dela, é um condomínio que existe de fato — com CNPJ, síndico eleito e conta bancária própria. Pular ou atrasar essa etapa trava tudo o que vem em seguida: sem ela, o condomínio não pode contratar, cobrar nem abrir conta em seu nome.',
      ),
      p(
        'Para a incorporadora, conduzir bem essa assembleia é parte de entregar o produto. Um condomínio que começa organizado gera menos atrito no pós-obra, menos ligação para o plantão de vendas e protege a reputação do empreendimento no momento mais sensível — a mudança das primeiras famílias. Este é o checklist, na ordem em que cada coisa precisa acontecer.',
      ),
      h('h2', 'Antes da assembleia'),
      p(
        'A base é a convocação. Todos os compradores precisam ser formalmente convocados, com a antecedência prevista e pauta clara. Convocação mal feita é o vício que mais anula assembleia de instalação — e refazer custa tempo que o empreendimento não tem. Em paralelo à convocação, três documentos precisam estar prontos para leitura e aprovação:',
      ),
      ul([
        [
          { text: 'Convenção de condomínio', bold: true },
          ' — as regras estruturais (frações ideais, competências, quóruns), que serão registradas em cartório e regem o condomínio como uma "constituição".',
        ],
        [
          { text: 'Regimento interno', bold: true },
          ' — o dia a dia: uso de áreas comuns, horário de silêncio, animais, mudanças, obras nas unidades.',
        ],
        [
          { text: 'Previsão orçamentária inicial', bold: true },
          ' — a primeira taxa condominial, calculada com base nas despesas estimadas de operação (portaria, limpeza, energia das áreas comuns, seguro).',
        ],
      ]),
      p(
        'É comum a incorporadora já ter registrado a convenção junto ao memorial de incorporação; ainda assim, a assembleia de instalação é o momento em que os condôminos a assumem formalmente e elegem quem vai aplicá-la.',
      ),
      h('h2', 'Durante a assembleia'),
      p(
        'Com todos convocados e os documentos prontos, a assembleia segue uma ordem que dá segurança jurídica à ata. A sequência importa: cada passo depende do anterior.',
      ),
      ol([
        [
          { text: 'Instalação formal do condomínio', bold: true },
          ' e registro da presença dos compradores, com verificação de quórum.',
        ],
        [
          { text: 'Leitura e aprovação da convenção e do regimento interno', bold: true },
          ', com espaço para dúvidas antes da votação.',
        ],
        [
          { text: 'Eleição do síndico', bold: true },
          ', do subsíndico e do conselho fiscal, com mandato e atribuições definidos.',
        ],
        [
          { text: 'Aprovação da previsão orçamentária', bold: true },
          ' e definição do valor e do vencimento da primeira taxa condominial.',
        ],
      ]),
      quote(
        'Sem assembleia de instalação não há CNPJ, não há síndico e não há conta em nome do condomínio. Tudo o mais depende dela.',
      ),
      h('h2', 'Depois da assembleia'),
      p(
        'A ata da instalação é o documento que destrava o resto. Com ela em mãos, o síndico eleito pode dar os passos que colocam o condomínio em funcionamento:',
      ),
      ul([
        [
          { text: 'Abrir o CNPJ', bold: true },
          ' do condomínio junto à Receita Federal.',
        ],
        [
          { text: 'Abrir a conta bancária', bold: true },
          ' em nome do condomínio, separando de vez o dinheiro comum do da incorporadora.',
        ],
        [
          { text: 'Registrar a convenção em cartório', bold: true },
          ' de registro de imóveis, dando publicidade e força às regras.',
        ],
        [
          { text: 'Assumir contratos e cobrança', bold: true },
          ' — a partir daí, o condomínio contrata, cobra e é cobrado como pessoa jurídica.',
        ],
      ]),
      p(
        'A Semog conduz esse processo do começo ao fim — da convocação dos compradores ao registro em cartório — para que a incorporadora entregue as chaves com o condomínio juridicamente pronto para funcionar, e o morador comece a vida nova sem herdar uma pendência que não criou.',
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
