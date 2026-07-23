# Redesign da home + página do Aplicativo Semog

Data: 2026-07-23
Mockup aprovado: https://claude.ai/code/artifact/10d1ffc1-7286-4938-bf69-9af0b5787ba3

## 1. Objetivo

Duas entregas com um objetivo comum: transformar prova que já existe, mas está
invisível, em argumento de conversão.

1. **Home** — refino cirúrgico, redesenhando só as seções que não estão boas.
   A linguagem visual (paleta navy/ice, Clash Display + Satoshi, material de
   vidro) permanece. Muda a ordem de prioridade.
2. **Página `/aplicativo`** — não existe hoje. O app é o produto que o morador
   toca todo dia, tem nota 4,8 nas duas lojas, e ocupa 1 card entre 4 na home.

O gap central diagnosticado: a home inteira afirma liderança sem que um único
cliente fale, e o app — o único ativo com nota pública verificável — não aparece.

## 2. Escopo

**Dentro:** blocos e componentes do site, seeds, SEO/JSON-LD, e as correções de
código listadas na seção 6.

**Fora:** produção dos vídeos, sessão de fotos, coleta de depoimentos e o kit de
divulgação (seção 8 — dependem do cliente). A implementação entrega os blocos
funcionando com o conteúdo que existir no momento; blocos sem conteúdo não
renderizam.

**Fora também:** refatoração do `theme.css`, migração de conteúdo do seed para o
CMS. São dívidas reais (seção 6) mas não bloqueiam esta entrega.

## 3. Princípio de arquitetura: estender antes de criar

O projeto tem 41 blocos. O levantamento mostrou que a maior parte do que as duas
páginas precisam já existe:

| Necessidade | Bloco existente | Ação |
|---|---|---|
| 9 funções do morador | `featureGrid` (`variant`, `columns`) | reusar |
| FAQ | `faq` (`dark`, `white`) | reusar |
| Portaria (texto + 1 tela) | `solutionSplit` | reusar |
| Depoimentos | `testimonials` (`quote`, `author`, `role`) | estender |
| Seção do app | `appShowcase` (imagem + features + CTA) | estender |
| Números | `stats` (`grid`, `feature`) | estender |
| Pilares | `pillars` (`compact` só muda tipografia) | estender |
| CTA final | `ctaBand` | estender |
| Três passos | `processoTimeline` (`iconSvg`, `tags`) | reusar |

Só dois blocos são genuinamente novos: `learnCenter` e `appHero`. Todo o resto é
campo novo em bloco existente, sempre opcional, para não quebrar as páginas que
já usam esses blocos.

## 4. Parte A — Home

Ordem final dos blocos (11 → 13):

```
 1 hero              ← faixa de prova (redesenhado)
 2 stats             ← variant 'band' (redesenhado)
 3 valuesMarquee       mantido
 4 wordsSection        mantido
 5 pillars           ← variant 'columns' (refinado)
 6 solucoesBento       mantido
 7 produtosGrid        mantido (card do app aponta para /aplicativo)
 8 appShowcase       ← NOVO na home
 9 garante             mantido
10 testimonials      ← NOVO na home
11 cities              mantido
12 humanQuote          mantido (troca de mídia, só seed)
13 ctaBand           ← segundo caminho (refinado)
```

### 4.1 Hero — faixa de prova

Campo novo em `Hero/config.ts`:

```ts
{
  name: 'proofItems',
  type: 'array',
  maxRows: 4,
  admin: { description: 'Faixa de prova no rodapé do hero. Vazio = não renderiza.' },
  fields: [
    { name: 'value', type: 'text', required: true },  // "4,8" | "+650"
    { name: 'label', type: 'text', required: true },  // "no app, 1.133 avaliações"
    { name: 'stars', type: 'checkbox', defaultValue: false },
  ],
}
```

Renderiza uma faixa de 4 colunas colada no rodapé do hero, dentro do mesmo
`Section`, com `border-top` e fundo `rgba(5,8,26,.5)` + `backdrop-filter`. No
mobile vira 2×2. Substitui a `tag` (`.hero-tagbox`) na home — a `tag` continua
existindo para outras páginas e os dois nunca aparecem juntos: com `proofItems`
preenchido, a `tag` é ignorada e o `Hero` loga um aviso em dev.

Conteúdo: 4,8 no app (1.133 avaliações) · +650 condomínios · +70 mil clientes ·
35 anos em 3 estados.

### 4.2 Stats — `variant: 'band'`

Nova opção no `select` `variant` existente. Renderiza os 5 itens em
`grid-template-columns: repeat(5, 1fr)` com divisórias verticais, `border-top` no
conjunto, número em `--grad-brand` e `font-variant-numeric: tabular-nums`. Abaixo
de 900px vira 2 colunas.

O mapa do Brasil sai desta seção e passa para `cities` como fundo discreto — é lá
que "presença geográfica" é o assunto. Se a migração do mapa se mostrar custosa,
ela pode ser adiada sem bloquear a variante `band`; nesse caso o mapa é apenas
removido da home.

### 4.3 Pillars — `variant: 'columns'`

`compact` hoje só reduz a tipografia da mesma `.pillar-row` de 2 colunas. A
variante nova troca o layout para colunas com `border-top` em cada uma. Reduz a
altura da seção em cerca de 55%. `compact` continua funcionando onde já é usado.

A grade é `repeat(auto-fit, minmax(260px, 1fr))`, não `repeat(3, 1fr)`: na home
são 3 pilares, mas em `/aplicativo` o mesmo bloco renderiza 2 colunas (síndico e
administradora). Uma grade fixa de 3 deixaria um buraco lá.

### 4.4 AppShowcase estendido

O bloco já entrega imagem + eyebrow + título + texto + grade de features + CTA.
Faltam três coisas:

```ts
{ name: 'theme', type: 'select', defaultValue: 'light',
  options: ['light', 'deep'] },                       // hoje é sempre sec-light
{ name: 'imageSecondary', type: 'upload', relationTo: 'media' },
{ name: 'rating', type: 'group', fields: [
    { name: 'score', type: 'text' },                  // "4,8"
    { name: 'label', type: 'text' },                  // "1.133 avaliações na..."
] },
{ name: 'stores', type: 'group', fields: [
    { name: 'appStore', type: 'text' },
    { name: 'playStore', type: 'text' },
] },
```

Com `imageSecondary`, as duas telas aparecem sobrepostas com rotação leve
(`rotate(5deg)` atrás, `rotate(-3deg)` na frente). Sem ela, o comportamento atual
de uma imagem só é preservado — `/solucoes` continua idêntica.

Os selos de loja são SVG inline (maçã monocromática, triângulo do Play
policromático), não imagem, e cada um é um link real para a ficha da loja.

### 4.5 Testimonials estendido

Campos novos no array `items`, todos opcionais:

```ts
{ name: 'org', type: 'text' },     // "Condomínio Vista Mar"
{ name: 'city', type: 'text' },
{ name: 'rating', type: 'number', min: 1, max: 5 },
{ name: 'photo', type: 'upload', relationTo: 'media' },
```

Mais um array no nível do bloco para a faixa de nomes/logos:

```ts
{ name: 'logos', type: 'array', fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'logo', type: 'upload', relationTo: 'media' },  // sem logo, renderiza o nome
] }
```

Sem `photo`, o avatar é a inicial do autor sobre `--grad-brand`. Renderiza como
3 cards brancos sobre `sec-light`, com a citação em Clash Display e o rodapé
separado por `border-top`.

**Este bloco só entra na home quando houver ao menos 3 depoimentos reais e
autorizados.** Colocar depoimento inventado num site que vende confiança seria
pior que não ter seção nenhuma.

### 4.6 CTABand — segundo caminho

```ts
{ name: 'secondaryCta', type: 'group', fields: [
    { name: 'label', type: 'text' },
    { name: 'href', type: 'text' },
] }
```

Renderiza ao lado do CTA primário com `variant="glass"`. Na home: "Falar no
WhatsApp". Resolve a repetição de "Solicitar proposta" entre o bloco final e o
rodapé, que hoje aparecem um embaixo do outro.

### 4.7 HumanQuote

Nenhuma mudança de código. Troca da mídia `equipe.webp` por foto real da equipe
(seed + `pnpm seed:media`). Enquanto a foto real não existir, a seção fica como
está — é a única mudança da home que depende exclusivamente do cliente.

## 5. Parte B — Página `/aplicativo`

Rota: `/aplicativo`, servida pelo catch-all `[[...slug]]` a partir de uma `Page`
com slug `aplicativo`, semeada por `src/seed/pages.ts`. Sem rota explícita nova.

Layout de blocos:

```
1  appHero          NOVO
2  featureGrid      reuso — 9 funções do morador
3  solutionSplit    reuso — portaria e controle de acesso
4  pillars          reuso (variant columns, 2 itens) — síndico + administradora
5  processoTimeline reuso — três passos para começar
6  learnCenter      NOVO — vídeos / passo a passo / material
7  faq              reuso — 6 perguntas
8  ctaBand          reuso (variant dual) — síndico | morador
```

### 5.1 `appHero` (novo)

Hero específico do app: eyebrow, headline, lead, bloco de nota, selos de loja,
nota de rodapé, e duas telas sobrepostas. Fundo em `radial-gradient` navy, sem
vídeo — a página não precisa carregar mídia pesada.

```ts
fields: [
  { name: 'eyebrow', type: 'text' },
  { name: 'headline', type: 'text', required: true },
  { name: 'lead', type: 'textarea' },
  { name: 'rating', type: 'group', fields: [
      { name: 'score', type: 'text' }, { name: 'label', type: 'text' } ] },
  { name: 'stores', type: 'group', fields: [
      { name: 'appStore', type: 'text' }, { name: 'playStore', type: 'text' } ] },
  { name: 'footnote', type: 'text' },
  { name: 'screens', type: 'array', maxRows: 2,
    fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }] },
]
```

Não reusei o `hero` existente: ele já carrega 12 campos de `pageHero*` para
fidelidade com o `_reference`, e enfiar rating e lojas lá aumentaria uma
complexidade que já é alta. `appHero` é pequeno e tem um propósito só.

### 5.2 `learnCenter` (novo)

O bloco que responde ao pedido de "material, vídeos e passo a passo". Três abas
numa seção só, cada uma resolvendo um problema diferente:

- **Vídeos** — 6 cards com play, duração e descrição. O card sem `videoUrl`
  renderiza o gradiente sem link e não é focável, então a aba funciona antes de
  os vídeos existirem.
- **Passo a passo** — 7 guias em `<details>`, numerados, com lista ordenada e
  uma nota de rodapé por guia. É o conteúdo indexável: vídeo o Google não lê.
- **Material do condomínio** — 4 cards de download para o síndico divulgar.

```ts
fields: [
  { name: 'eyebrow', type: 'text' },
  { name: 'title', type: 'text', required: true },
  { name: 'lead', type: 'textarea' },
  { name: 'videos', type: 'array', fields: [
      { name: 'title', type: 'text', required: true },
      { name: 'text', type: 'textarea' },
      { name: 'duration', type: 'text' },
      { name: 'videoUrl', type: 'text' } ] },        // vazio = card inativo
  { name: 'guides', type: 'array', fields: [
      { name: 'title', type: 'text', required: true },
      { name: 'steps', type: 'array', fields: [
          { name: 'text', type: 'textarea', required: true } ] },
      { name: 'note', type: 'textarea' } ] },
  { name: 'materials', type: 'array', fields: [
      { name: 'kind', type: 'text' },                // "PDF A3" | "Texto"
      { name: 'title', type: 'text', required: true },
      { name: 'text', type: 'textarea' },
      { name: 'file', type: 'upload', relationTo: 'media' } ] },
]
```

Abas via botões com `role="tab"` e `aria-selected`, painéis com `hidden`. A aba
"Passo a passo" é a única que precisa existir no lançamento; as outras duas
renderizam vazias sem quebrar.

Os 7 guias foram escritos a partir dos caminhos reais do aplicativo e **precisam
de revisão de quem usa o produto no dia a dia antes de publicar**.

### 5.3 CTABand — `variant: 'dual'`

Dois cards lado a lado, cada um com título, texto e CTA próprio: "Sou síndico ou
conselheiro" → `/proposta`; "Moro em um condomínio Semog" → lojas.

```ts
{ name: 'paths', type: 'array', maxRows: 2, fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'text', type: 'textarea' },
    { name: 'cta', type: 'group', fields: [
        { name: 'label', type: 'text' }, { name: 'href', type: 'text' } ] },
] }
```

`paths` é usado só por `variant: 'dual'`; `secondaryCta` (4.6) só por
`centered`. São mecanismos separados para necessidades diferentes — o `dual`
apresenta dois públicos como iguais, o `secondaryCta` oferece uma saída
secundária a um público só.

### 5.4 SEO

- `meta.title`: "Aplicativo Semog | O condomínio inteiro na palma da mão"
- `meta.description` citando nota 4,8 e as funções principais.
- JSON-LD `FAQPage` a partir dos itens do bloco `faq`, gerado em `getPageJsonLd`
  (`src/lib/seo.ts`) quando a página contém um bloco `faq`. Vale para qualquer
  página, não só `/aplicativo`.
- JSON-LD `SoftwareApplication` com `aggregateRating` a partir dos dados do
  `appHero`. **Só emitir enquanto os números forem verdadeiros e conferíveis nas
  lojas** — `aggregateRating` falso é violação das diretrizes do Google e rende
  ação manual.
- Link novo no header e no rodapé (`src/globals/Header.ts`, `Footer.ts`).

O conjunto guias + FAQ é o que disputa buscas de morador ("como tirar 2ª via do
boleto do condomínio", "como reservar salão de festas") — tráfego que o site hoje
não captura.

### 5.5 Evolução prevista

Se a biblioteca de guias crescer, o caminho natural é `/aplicativo/ajuda` com uma
URL por guia. O bloco `learnCenter` já modela cada guia como item de array, então
a migração é de rota e não de dados. Fora do escopo agora.

## 6. Parte C — Correções de código

Ordenadas por impacto. As três primeiras são independentes do redesign e podem
ir antes.

### 6.1 Vídeo do hero (alta)

`src/motion/VideoSequenceBackground.tsx` baixa 2,9 MB no load — `recife.mp4`
(799 KB), `joao-pessoa.mp4` (481), `campina-grande.mp4` (1.037), `belem.mp4`
(598) — e o `hidden.load()` da linha 76 refaz o download a cada volta do ciclo,
sem limite. Medido em produção: os mesmos clipes aparecem duas vezes no perfil de
rede.

Correções:
- `preload="none"` na camada oculta; atribuir `src` e chamar `load()` só quando
  faltarem ~3s para o fim do clipe atual.
- `poster` no primeiro frame, para o hero não abrir preto.
- No mobile (`matchMedia('(max-width: 768px)')`), um clipe só, sem ciclo.
- Cache do que já foi carregado, para a volta do ciclo não rebaixar tudo.
- Botão discreto de pausa no canto do hero (WCAG 2.2.2). O autoplay
  permanece — é decisão documentada do dono do site.

Meta: menos de 900 KB na primeira tela e nada de re-download.

### 6.2 Testes (média)

`tests/e2e/frontend.e2e.spec.ts` ainda afirma que o título é
`Payload Blank Template` e o h1 é "Welcome to your new project.".
`tests/int/api.int.spec.ts` é o `fetches users` do template e falha no
`beforeAll`. O CI roda lint, `tsc` e drift de tipos, mas não roda teste nem
build.

- Reescrever o e2e para a home real: título, `h1`, faixa de prova, existência dos
  13 blocos, e a página `/aplicativo` respondendo 200 com as abas do
  `learnCenter` alternando.
- Testes de unidade para `getPageJsonLd` (FAQPage e SoftwareApplication) e para
  a lógica de pré-carregamento de `VideoSequenceBackground`.
- Rodar o e2e no CI contra `next build && next start` com banco de teste.

### 6.3 Favicon (baixa, rápida)

Não existe `favicon.ico` nem `icon.png`, e não há `icons` no metadata. O console
loga 404 e o Google mostra ícone genérico no resultado mobile. Adicionar
`src/app/icon.png` e `apple-icon.png` a partir da marca.

### 6.4 Seed sobrescreve o CMS (média, decisão de produto)

Os seeds fazem `payload.update` com o `layout` inteiro por slug
(`src/seed/home.ts:306`). Uma edição feita no admin some no próximo seed, sem
aviso. Duas saídas, a escolher com o dono do site:

- **CMS como verdade** — seed vira bootstrap: cria se não existir, não atualiza.
  Um flag `--force` mantém o comportamento atual para reset deliberado.
- **Código como verdade** — campos ficam `admin.readOnly` e o admin serve só
  para preview.

Fora do escopo desta entrega; registrado para não se perder.

## 7. Modelo de dados — resumo

Blocos novos: `appHero`, `learnCenter`.
Blocos estendidos: `hero` (+`proofItems`), `stats` (+`band`), `pillars`
(+`columns`), `appShowcase` (+`theme`, `imageSecondary`, `rating`, `stores`),
`testimonials` (+`org`, `city`, `rating`, `photo`, `logos`), `ctaBand`
(+`secondaryCta`, `dual`).

Todos os campos novos são opcionais e todas as variantes novas são adicionadas a
`select`s existentes sem mudar o valor padrão. Nenhuma página existente muda de
aparência. Migração do Payload necessária pelas duas tabelas de bloco novas;
`pnpm generate:types` precisa rodar e o `git diff` de `src/payload-types.ts` faz
parte do commit (o CI checa drift).

## 8. Conteúdo que depende do cliente

Bloqueia a seção correspondente, não a implementação.

| Item | Bloqueia |
|---|---|
| 3 depoimentos com nome, cargo, condomínio, cidade — autorizados | `testimonials` na home |
| 6 nomes ou logos de condomínios/incorporadoras | faixa de logos |
| Fotos reais da equipe e do escritório | `humanQuote` |
| Números da operação (moradores ativos, chamados no autosserviço) | seção do síndico em `/aplicativo` |
| 6 vídeos de 1 a 2 minutos, gravação de tela com locução | aba Vídeos |
| Kit de divulgação (cartaz com QR, mensagem, slides, FAQ em PDF) | aba Material |
| Revisão dos 7 guias por quem usa o app | aba Passo a passo |

### Pendências fora do site

- App antigo **"Semog"** (App Store id 1489510976), parado desde outubro de 2024,
  nota 3,9, ainda publicado — divide a busca com o app atual, que tem 4,8.
  Despublicar ou redirecionar.
- Prints da Play Store mostram **"Teste Gruvi"** como nome do condomínio, visível
  na ficha pública. Regravar.
- App **"Semog Garante"** publicado sob a conta pessoal "Everton Avila"
  (`br.com.asc.semog`) — confirmar se é oficial.

## 9. Testes

- **Unidade (vitest):** `getPageJsonLd` para FAQPage e SoftwareApplication;
  agendamento de pré-carregamento do `VideoSequenceBackground`; renderização
  condicional de `proofItems`, `imageSecondary` e `videoUrl` vazio.
- **E2E (playwright):** home com os 13 blocos e a faixa de prova; `/aplicativo`
  respondendo 200; alternância das 3 abas do `learnCenter` com `aria-selected`
  correto; `<details>` dos guias abrindo; peso da primeira tela da home abaixo do
  teto definido em 6.1.
- **Regressão visual manual:** `/solucoes` (usa `appShowcase`), landings de
  cidade (usam `featureGrid` e `faq`) e `/garante` — as três consomem blocos
  estendidos e precisam continuar idênticas.
- **Acessibilidade:** foco visível em abas e `<details>`, contraste da faixa de
  prova sobre o vídeo, `prefers-reduced-motion` respeitado.

## 10. Riscos

- **Fidelidade ao `_reference`.** O projeto foi construído em fidelidade 1:1 com
  `_reference/index.html`. Este redesign rompe isso deliberadamente em 4 seções
  da home. Os comentários dos componentes afetados precisam registrar que a
  divergência é intencional, senão a próxima leitura do código vai tratá-la
  como bug.
- **Blocos compartilhados.** `appShowcase`, `testimonials`, `stats`, `pillars`,
  `ctaBand` e `featureGrid` são usados em outras páginas. Todo campo novo
  opcional e todo default preservado — daí a regressão visual manual da seção 9.
- **`aggregateRating` no JSON-LD.** Só publicar enquanto os números baterem com
  as lojas. Se a nota cair, atualizar ou remover.
- **Seção sem conteúdo.** Se os depoimentos não chegarem, a home fica sem a
  correção do maior gap diagnosticado. A implementação entrega o bloco; a decisão
  de publicar sem prova social é do dono do site.
