# Novo site Semog · v2

Páginas estáticas montadas a partir de parciais, com a mesma mecânica da apresentação "Semog Tech
para Brascon": fonte modular em `src/`, build com esbuild, saída em `dist/` (`index.html` (home),
`semog.html` (A Semog), `app.js`, `app.css`, `assets/`). Todas as páginas usam o mesmo `app.js` e
`app.css`, com links relativos entre elas. Abre por `file://` e por HTTP; publica como Artifact
multi-arquivo (a home é a página; `semog.html` vai em `files`, ao lado).

## Comandos

```bash
pnpm install          # uma vez (pnpm install --offline se o store já tiver os pacotes)
pnpm build            # monta dist/
pnpm dev              # build + servidor em http://127.0.0.1:4180/ (ou a próxima porta livre)
pnpm capturar         # build + capturas de todas as cenas das duas páginas, Chromium e Firefox, 1440 e 390
pnpm format           # Prettier (finais de linha LF)
```

`node scripts/capturar.mjs --pagina semog` captura só uma página (pode repetir; padrão: todas);
`--cena tecnologia` só uma cena (pode repetir `--cena`); `--navegador chromium|firefox` escolhe o
navegador; `--file` abre por `file://`. Saída em `capturas/<cena>-<largura>.png` (home, Chromium),
`capturas/<página>/<cena>-<largura>.png` (outras páginas) e `capturas/firefox/…`. O script espera a página
marcar `html.motion`, rola até cada seção, corrige a posição depois do Lenis e espera 1,5 s
antes do print. Sai com código 1 se houver erro de console, erro de página, requisição que
falhou ou scroll horizontal.

Verificações de A Semog (rode depois do build):

- `node scripts/semog-quadros.mjs`: quadros a cada 5% do pin da história, emendas entre as cenas
  medidas por pixel (falha com degrau de cor) e vídeos de leitura em 1440 e 390, em
  `capturas/semog-quadros/`. Aceita `--navegador`, `--largura`, `--sem-video`, `--so-video`.
- `node scripts/navegacao.mjs`: home → A Semog → home pelos links do header, do logo e do rodapé,
  âncoras de `semog.html` e `index.html#unidades`, recarga com a página no meio do pin e, em cada
  patamar do pin, o ano e o marco visíveis conferidos contra o `conteudo.json`. HTTP e `file://`,
  Chromium e Firefox (`--navegador`, `--so-http`, `--so-file`).
- `node scripts/paginas-leves-verificacao.mjs`: proposta, contato e 404. Formulário de proposta
  na dobra, as duas etapas com clique de mouse por coordenada, `?perfil=construtora`, formulário
  de mensagem (só demonstração), nenhum link de discagem nem WhatsApp, links da 404, navegação
  pelo header e pelo menu do celular e varredura com print em `capturas/paginas-leves/`. HTTP e
  `file://`, Chromium e Firefox, 1440 e 390 (`--navegador`, `--so-http`, `--so-file`).
- `node scripts/toque-flicks.mjs`: celular emulado (390×844, DPR 3, toque) no Chromium completo,
  que faz a inércia nativa do dedo. Em cada cena presa, flicks lento, médio e rápido para a
  frente e médio para trás: depois de 1,5 s parado, o pin tem de estar num patamar (±0,02) e o
  médio anda no máximo dois. No desktop (1440, roda do mouse) a rolagem não se mexe sozinha
  depois de parar. `--cena <id>`, `--sem-desktop`, `--relatorio` (só a tabela).

O build também barra CSS fora da identidade: cor em hex fora do `:root`, `border-radius`
diferente de 0, `text-transform: uppercase`, fonte serifada e `stroke-linecap` que não seja `butt`.

Versões (as mesmas da Brascon, empacotadas no bundle, sem CDN): gsap 3.15.0 (ScrollTrigger e
SplitText), lenis 1.3.26, three 0.186.0 (só entra no bundle se uma cena importar), esbuild 0.28.2,
playwright 1.60.0, prettier 3.9.9.

## Estrutura

```
build.mjs            esbuild (IIFE) + CSS concatenado + uma página por entrada + cópia de src/assets
serve.mjs            servidor estático do pnpm dev e das capturas
scripts/capturar.mjs capturas por cena, com checagem de erros
scripts/semog-quadros.mjs, scripts/navegacao.mjs   verificações de A Semog (ver acima)
src/
  page.html          esqueleto comum: head, header, <main data-pagina>{{secoes}}</main>, rodapé
  paginas.json       as páginas: saída, título, descrição, prefixo dos links e lista de cenas
  conteudo.json      TODOS os textos e números: o único lugar dos fatos
  main.js            o mesmo para todas as páginas: lê <main data-pagina> e monta as cenas dela
  paginas/<id>.js    a lista fixa de cenas de cada página, na ordem do paginas.json
  core/              motion (Lenis + GSAP), util, tema do header, menu, formulários demo,
                     impressão, cores, gradiente Dinâmica (WebGL), tipos
  styles/tokens.css  identidade Semog: paleta, gradientes, fontes, Fibonacci, métrica áurea
  styles/base.css    temas, tipografia, ações, campos, header, rodapé, esqueleto
  sections/NN-id.html  parcial de cada cena da home (sections/semog/NN-id.html: A Semog)
  scenes/NN-id.js      export default function init(ctx) (scenes/semog/…: A Semog)
  scenes/NN-id.css     estilo da cena, escopado em #id
  assets/            fonts/ (Saira e Barlow auto-hospedadas), fotos/
dist/                saída do build (não editar)
```

Ordem do CSS em `dist/app.css`: `lenis.css`, `tokens.css`, `base.css`, `core/*.css`,
`scenes/NN-*.css`, `scenes/<página>/NN-*.css`. Ids de seção não se repetem entre páginas, exceto
`proposta`, que é a mesma cena (`08-proposta`) nas duas.

## Páginas

`src/paginas.json` lista as páginas. Cada uma tem `id` (vai para `<main data-pagina>`), `saida`
(o HTML em `dist/`), `titulo`, `descricao` (pode ter `{{marcas}}`), `inicio` (prefixo dos links para
as âncoras da home: `""` na home, `"index.html"` nas outras), `rodape` e `secoes`. No esqueleto,
`{{pagina.campo}}` vira o valor da página; o link com `data-pagina-link="<id>"` ganha
`aria-current="page"` na própria página. Página nova: entrada no `paginas.json`, lista de cenas em
`src/paginas/<id>.js` e registro em `PAGINAS` no `main.js`.

Opcionais: `"landing": true` (landing de Google Ads: pacote `landing`, header enxuto, pré-carga da
foto de `dados`) e `"leve": true` (página de serviço no pacote `landing`, com o header completo:
proposta, contato e 404). Nos dois, a página não tem JS de cena nem entra no `main.js`: o
`landing.js` liga formulários, entradas `.revelar`, menu e header, e o CSS das cenas vem das
pastas de `PASTAS_LANDING` no `build.mjs` (só para `landing.css`). `{{pagina.proposta}}` é
derivado: `#proposta` se a página tem o pedido de proposta (a cena `#proposta` ou, nas landings,
o formulário da abertura), senão `proposta.html`; é o destino de "Seja Semog" e "Pedir proposta".
As páginas de leitura têm a cena `08-proposta`, então ficam com `#proposta`. O pacote sai de
`landing`/`leve` (pacote `landing`) ou do `"pacote"` declarado (`"leitura"`; sem ele, `app`);
declarar outro pacote junto de `landing`/`leve` falha no build.

| Página           | Saída           | Cenas (`sections/<pasta>/`)                                         |
| ---------------- | --------------- | ------------------------------------------------------------------- |
| `proposta`       | `proposta.html` | `proposta/01-pedido` (`#proposta`), `proposta/02-depois`            |
| `contato`        | `contato.html`  | `contato/01-abertura`, `contato/02-unidades`, `contato/03-mensagem` |
| `nao-encontrada` | `404.html`      | `nao-encontrada/01-pagina`                                          |

`proposta.html?perfil=construtora` (ou outro valor de `perfil` da etapa 2) chega com a opção
marcada (`core/formulario-proposta.js`).

### Páginas de leitura

`blog.html`, os posts (`blog-<slug>.html`), `privacidade.html` e `termos.html` declaram
`"pacote": "leitura"`: usam `leitura.js` e `leitura.css` (header completo, rolagem nativa, sem
Lenis nem GSAP, sem lista de cenas no `main.js`). O único movimento é a entrada do título, em CSS.
O texto vem de `src/leitura/`: cópia dos MDX de `semogsite/content/blog` e `content/legal`,
`leitura.json` (categorias, posts com página aqui, tradução dos links internos) e `midia.json`
(fotos e vídeo citados pelos posts). `leitura.mjs` converte o MDX (subconjunto: `##`, `###`,
parágrafo, listas, citação, tabela simples, negrito, itálico, link, `<PostImage />`, `<PostVideo />`)
e entrega tudo como `{{leitura.…}}`; cada post e documento vira `"dados"` da sua página. O corpo
convertido entra com `{{dados.corpoHtml|html}}`, o único filtro que não escapa (só em campo
`…Html`). Post novo com página: o MDX em `src/leitura/blog/`, o slug em `completos` e uma entrada
no `paginas.json` como as dos dois posts. Verificação: `node scripts/leitura-varredura.mjs`
(`--file` para `file://`, `--pdf` para a impressão dos posts).

## Cenas

| Arquivo          | id            | Tema    | Assunto                                                     |
| ---------------- | ------------- | ------- | ----------------------------------------------------------- |
| `01-abertura`    | `abertura`    | claro   | Metades: Unidades em cortina + pedido de proposta (pronta)  |
| `02-condominios` | `condominios` | claro   | +650 condomínios como dado (pin)                            |
| `03-pilares`     | `pilares`     | marinho | Gestão completa, Semog Garante, Cobrança com equipe própria |
| `04-tecnologia`  | `tecnologia`  | claro   | Prestação de contas digital e Semog One (pin longo)         |
| `05-ranking`     | `ranking`     | claro   | 5º entre mais de 3.500 administradoras                      |
| `06-unidades`    | `unidades`    | claro   | Quatro Unidades Semog + depoimentos                         |
| `07-comunidade`  | `comunidade`  | gelo    | Café com Condomínio, Semog Experience, blog                 |
| `08-proposta`    | `proposta`    | claro   | CTA final em metades + WhatsApp                             |

A Semog (`semog.html`):

| Arquivo                | id            | Tema            | Assunto                                                               |
| ---------------------- | ------------- | --------------- | --------------------------------------------------------------------- |
| `semog/01-manifesto`   | `a-semog`     | marinho → claro | Manifesto no gradiente Transparência + cinco números                  |
| `semog/02-historia`    | `historia`    | claro → marinho | 1991 → Hoje como percurso (pin); o eixo abre no marinho               |
| `semog/03-principios`  | `principios`  | marinho → claro | Retidão, Transparência, Dinâmica, cada um no seu gradiente            |
| `semog/04-pessoas`     | `pessoas`     | claro           | Tecnologia na operação, gente na relação; fotos a enviar              |
| `semog/06-depoimentos` | `depoimentos` | claro           | Três avaliações públicas no Google                                    |
| `semog/05-assembleia`  | `assembleia`  | gelo            | Pauta: seis perguntas a qualquer administradora e a resposta da Semog |
| `08-proposta`          | `proposta`    | claro           | A mesma cena da home                                                  |

Gestão (`administracao-de-condominios.html`, id `gestao`; o "Gestão" do header e do rodapé aponta para cá):

| Arquivo               | id                             | Tema        | Assunto                                                             |
| --------------------- | ------------------------------ | ----------- | ------------------------------------------------------------------- |
| `gestao/01-abertura`  | `administracao-de-condominios` | claro       | H1 da página, números e a coluna gelo "Num contrato só"             |
| `gestao/02-mesa`      | `mesa-do-sindico`              | claro → céu | O que sai da mesa do síndico para as cinco frentes (pin)            |
| `gestao/03-atende`    | `quem-atende`                  | céu claro   | Atendimento, equipe local, sócios, jurídico com parceiro; "Vá além" |
| `gestao/04-troca`     | `troca-de-administradora`      | claro       | Troca de administradora em três passos, com os boletos seguindo     |
| `gestao/05-perguntas` | `perguntas-gestao`             | claro       | Perguntas frequentes sobre administração de condomínios             |
| `08-proposta`         | `proposta`                     | claro       | A mesma cena da home                                                |

Verificações de Gestão: `node scripts/gestao-quadros.mjs` (quadros do pin da mesa, emendas e
vídeos), `node scripts/gestao-varredura.mjs` (telas vazias) e `node scripts/gestao-navegacao.mjs`
(navegação, âncoras, recarga e patamares do pin), com as mesmas opções das de Garante.

## Posse dos arquivos

Cada agente de cena edita **só** os três arquivos da sua cena: `sections/NN-id.html`,
`scenes/NN-id.js` e `scenes/NN-id.css`. Asset novo vai em `src/assets/` com o prefixo da cena
(`src/assets/04-tecnologia-fluxo.svg`). `conteudo.json` é só da sessão principal: texto ou número
novo é pedido a ela. `page.html`, `paginas.json`, `paginas/`, `main.js`, `core/`, `styles/`, os scripts da raiz
e as dependências também são compartilhados: mudança neles passa pela sessão principal.

## Contrato de uma cena

- O parcial é uma `<section id="…" class="cena" data-tema="…">`. Temas: `claro`, `gelo`,
  `marinho`. O header copia o tema da seção que está sob ele. Retire o `data-esqueleto` quando a
  cena tiver layout próprio (ele liga um estilo mínimo de leitura em `base.css`).
- Texto e número vêm de `conteudo.json` por marca: `{{ranking.titulo}}`, `{{unidades.0.cidade}}`,
  `{{ranking.total|numero}}` (→ 3.500). Marca inexistente derruba o build. No JS, use
  `ctx.conteudo` (o mesmo JSON). Nunca escreva um fato à mão no parcial nem no JS.
- O HTML é a versão completa e legível sem JS. Estado inicial escondido vai em CSS sob
  `html.js:not(.motion)` (classe `.entrada`) ou é criado pelo próprio GSAP (`from`).
- `init(ctx)` roda dentro de um `gsap.context` com escopo na seção: seletores em texto ficam
  restritos a ela, e se a cena lançar erro tudo o que ela criou é revertido, a seção volta ao
  HTML estático e as outras seguem.
- Pins nascem no `init`, de forma síncrona, na ordem da página. Nada de pin depois de `await`.
  Entrada da primeira dobra espera `ctx.pronto` (fontes e load, no máximo ~5 s).
- Laço de desenho só pelo `util.lacoVisivel` (ticker do GSAP, só com a cena visível); rodízio
  pelo `util.relogioVisivel`. Nenhum `requestAnimationFrame` próprio. Canvas com
  `util.prepararCanvas2D` (DPR limitado a 1,5 no celular e 2 no desktop).
- Movimento ativo mesmo com `prefers-reduced-motion` (decisão do Leandro). Não consultar.
- WebGL: `alpha: true`, pinte o primeiro quadro na hora, mantenha um fundo CSS por baixo (Firefox
  headless pode vir sem WebGL) e não anime `clip-path` no pai do canvas (use transform).
- Moldura com `aspect-ratio` dentro de grid precisa de `min-width: 0`.

## ctx e util

`ctx = { gsap, ScrollTrigger, SplitText, lenis, util, conteudo, pronto, root, estreito() }`.
`lenis` pode ser `null`. `estreito()` é verdadeiro até 760px. Tipos em `src/core/tipos.js`.

| Função                                                                       | Faz                                                                                                           |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `revelarTexto(el, { tipo, gatilho, inicio, scrub, duracao, stagger })`       | máscara por linha/palavra, yPercent 110, expo.out 0,9 s, top 80%, uma vez; `.peso` de dentro vai de 250 a 650 |
| `revelarQuadro(figure)`                                                      | moldura abre de baixo, foto assenta do zoom, parallax                                                         |
| `entrarEmLote(alvos, { animar, inicio, cascata })`                           | cada item entra quando ele chega à tela                                                                       |
| `contador(el, { para, de, formatar, duracao, gatilho, inicio })`             | número que conta ao entrar na tela                                                                            |
| `pinScrub(root, { alvo, distancia, scrub, inicio, patamares, aoAtualizar })` | timeline fixada, scrub 0,7, anticipatePin, invalidateOnRefresh; no toque, snap nos `patamares` (abaixo)       |
| `snapPatamares(progressos)` / `pausasDaTimeline(tl)` / `soToque()`           | snap direcional só em aparelho só de toque; patamares tirados das pausas da coreografia                       |
| `trocarTexto(el, texto)`                                                     | troca curta por máscara                                                                                       |
| `aoRolar(fn, lenis)`                                                         | no máximo uma vez por quadro de rolagem                                                                       |
| `lacoVisivel(root, desenhar)` / `relogioVisivel(root, s, tique, aoAlternar)` | laço e relógio que param fora da tela e com a aba oculta                                                      |
| `prepararCanvas2D(canvas)` / `dprMaximo()` / `corDoToken(nome)`              | canvas com DPR limitado; cor de token para canvas/shader                                                      |
| `criarDinamica(canvas, { esc, escuro, aoFalhar })`                           | gradiente Dinâmica vivo (WebGL); lança erro sem WebGL                                                         |
| `formatarNumero(v, casas)` / `formatarPercentual(fracao, casas)`             | pt-BR                                                                                                         |
| `aoImprimir(fn)`                                                             | gancho executado antes de imprimir                                                                            |

**Toque nas cenas presas.** Em aparelho só de toque (`ScrollTrigger.isTouch === 1`), cada pin
com `patamares` ganha snap direcional: quando o dedo sai e a inércia nativa para, a rolagem
escorrega (0,25 a 0,6 s, power2.out) até o patamar seguinte na direção do gesto. `"pausas"` tira
os pontos da coreografia: o meio de cada trecho em que nada anima, mais o começo e o fim do pin;
um tween com `data: "respiro"` (movimento vivo dentro do patamar) não conta como troca. Fora do
pin a rolagem é livre, e no desktop não há snap. Os pontos ficam em `data-patamares` no alvo.

## Identidade

- **Cor.** Branco domina. Marinho `--marinho` (#1B2D70) é marca, título e botão. Marinho profundo
  e quase-preto azulado só dentro de gradiente. Azuis médios, céu e gelo como apoio; névoa e
  lavanda só como véu. Texto corrido em marinho em tons (`--texto`, `--texto-suave`), nunca
  cinza neutro. Cor sempre por token; hex só em `tokens.css`.
- **Gradientes.** `--grad-transparencia` (marinho profundo → gelo, vertical),
  `--grad-retidao` (marinho chapado), `--grad-dinamica` (mesh difuso, branco dominante), com as
  classes `.fundo-transparencia`, `.fundo-retidao`, `.fundo-dinamica`. São interpolados em
  oklab, com paradas em ease-in-out; em superfície grande, some `.grao` (grão SVG sutil) para
  não formar faixas. Passagem marinho → azul-claro nunca abrupta.
- **Tipo.** Saira para títulos e numerais, leve (300–500), tracking −0,035 a −0,045em,
  line-height 0,95–1,05; ênfase por peso animado (`.peso`, 250 → 650). Barlow 400 no corpo,
  line-height 1,6.
- **Forma.** Ponta sempre reta: `border-radius` 0 em tudo. Curvas só em percursos
  (classe `.percurso`: stroke-linecap butt, linejoin miter).
- **Métrica.** Espaço Fibonacci `--e1`…`--e8` (8/13/21/34/55/89/144/233); respiro de cena
  `clamp(89px, 10vw, 233px)`; divisão 61,8/38,2 (`.dividir`, `--maior`/`--menor`); container
  1200px; texto até 62ch.
- **Proibido.** Estilo editorial: eyebrow em caixa-alta espaçada, numerais 01/02/03 decorativos,
  serifa. Também: "tempo real", "validade jurídica", "menor inadimplência do mercado", "melhor do
  Brasil", "5ª melhor", telas fictícias do app.
- **Logo.** As duas versões originais (`_reference/semog-logo.svg` e
  `public/semog-logo-light.svg`) entram inline com a geometria intacta. Nunca recompor.
