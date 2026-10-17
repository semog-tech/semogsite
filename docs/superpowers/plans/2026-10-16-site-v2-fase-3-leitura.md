# Site v2 · Fase 3 (leitura): plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** pôr de pé, atrás da rota de prévia e sem mudar nenhuma URL do site no ar, o pacote de leitura do site v2 (índice do blog, os 12 posts, Privacidade e Termos no visual do protótipo), com o texto do blog limpo dos termos vedados, e fazer o sitemap e o OG saírem do inventário de URLs, com teste que trava a perda de página e um script que compara o `<head>` de cada URL com o do site no ar.

**Architecture:** as páginas de leitura moram em `src/app/(site)/(leitura)/previa-v2/...` (404 em produção, `noindex`, canonical da URL real) e só desenham: o corpo de cada página está em `src/site/paginas/leitura.tsx`, para a virada 1 (fase 5) apenas criar as rotas reais com o mesmo corpo. Os metadados e o JSON-LD saem das mesmas funções que o blog atual usa (`buildMetadata`, `getPostJsonLd`, `getPageJsonLd`), então o `<head>` só muda onde o texto mudou. O MDX é compilado no servidor por `compileMDX`, com componentes próprios do site v2 (títulos com id para o índice, foto e vídeo sem Tailwind); a rolagem é nativa e o único JS da leitura é `LigarLeitura` (fundo do cabeçalho, barra de progresso, índice ativo, fotos para impressão). O sitemap passa a ser gerado do `INVENTARIO` (`src/site/sitemap.ts`) e o título do OG por `tituloDoOg` (`src/site/seo/og.ts`).

**Tech Stack:** Next 16.2.6 (App Router, route groups, metadata routes), React 19.2.6, TypeScript 5.7 estrito, `next-mdx-remote` 6.0.0 (`compileMDX` de `next-mdx-remote/rsc`), `gray-matter` 4, Vitest 4.0.18 (jsdom) + Testing Library 16.3, Biome 2.5.3, Playwright 1.58.2 (scripts de verificação, Chromium e Firefox), pnpm.

**Spec:** `C:\Users\lekoc\semogapp\semogsite-site-v2\docs\superpowers\specs\2026-10-15-site-v2-producao-design.md` (seções 1, 2, 3.1, 3.3, 6, 8 fase 3, 9 e 10). Roteiro: `docs/superpowers/plans/2026-10-15-site-v2-roteiro.md` (critério de pronto "3." e calibragem). Pendências herdadas: `.superpowers/sdd/2026-10-15-site-v2-fase-0-1-fundacao/progress.md` (Task 1.3: rotas técnicas no inventário antes de gerar sitemap/OG dele; Final: teste que proíba hash malformado no MDX).

## Global Constraints

- **Onde trabalhar:** na worktree `C:\Users\lekoc\semogapp\semogsite-site-v2` (neste plano, **WT**), branch `feat/site-v2`. Conferir `git branch --show-current` na mesma chamada de cada commit.
- **Commits locais por tarefa, sem push.** Mesmo regime das fases 1 e 2 ([A CONFIRMAR] que vale para a fase 3): cada tarefa termina com `git branch --show-current && git add <arquivos exatos> && git commit -m "..."`, nunca `git add -A`; mensagem convencional em pt-BR terminando com as linhas `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` e `Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn`. Push, PR e Vercel só com o "ok" do Leandro.
- **Produção intocada até a virada.** Nenhuma URL do site no ar muda de status, de `<title>`, de description, de canonical nem de JSON-LD por efeito desta fase, a não ser onde o texto do post foi reescrito de propósito (lista em "Diferenças explicadas", Tarefa 3.9). O blog atual (`src/app/(frontend)/blog/[slug]`, catch-all `[[...slug]]` para `/blog`, `/privacidade`, `/termos`) continua servindo as URLs reais. As páginas novas só existem em `/previa-v2/...`, que responde 404 com `VERCEL_ENV=production`.
- **Sem banco, sem integração, sem efeito externo.** Nenhuma tarefa conecta no banco, chama Exact, SendGrid ou Google Ads, ou envia formulário. O único acesso à rede fora do `localhost` é leitura pública de `https://www.semog.com.br` (sitemap e HTML), nas Tarefas 3.2 e 3.10.
- **Segredos:** nunca imprimir valor de variável de ambiente. A build local roda **sem** `NEXT_PUBLIC_SITE_URL` (o padrão é `https://www.semog.com.br`, o mesmo do ar); conferir com `[string]::IsNullOrEmpty($env:NEXT_PUBLIC_SITE_URL)` = `True`, sem imprimir o valor.
- **Portões da CI** (rodar da WT, nesta ordem): `pnpm exec biome ci ./src ./tests ./scripts`, `pnpm exec tsc --noEmit`, `pnpm run check:server-actions`, `pnpm run test:int`, `pnpm build`. Antes do `biome ci`, `pnpm exec biome check --write <arquivos tocados>` e conferir `git diff --cached --stat` depois do `git add` (CRLF no disco, LF no Git). O CSS de `src/site/**` fica fora do Biome (`biome.json`), guardado pelo teste de identidade.
- **Texto público:** pt-BR com acentuação; proibidos "tempo real", "validade jurídica", "menor inadimplência do mercado", "melhor do Brasil", "5ª melhor" e os demais de `tests/int/helpers/identidade.ts` (`TERMOS_VEDADOS`), inclusive em comentário dentro de `src/site/**` e `src/app/(site)/**` (o guarda acusa); jurídico sempre "com escritório parceiro"; a Semog "assessora", não "assume"; nada editorial (sem eyebrow em caixa-alta com tracking, sem numerais decorativos, sem layout de revista); nenhum dado inventado; texto de interface que o site atual não tem (os rótulos que o protótipo criou, como "Neste texto" e "Leia também") leva o comentário `TEXTO-NOVO`, como no protótipo; texto que não está nem no site atual nem no protótipo não entra.
- **Slug intocado:** `assembleia-virtual-validade-juridica` continua sendo o slug e o nome do arquivo (spec 6). O guarda de termos lê título, resumo, `meta`, "Em resumo" e corpo, nunca o slug.
- **Identidade do site v2** (guarda `site-v2-identidade`): CSS só por token, `border-radius` 0, sem `uppercase`, sem serifa, `stroke-linecap` butt, sem `prefers-reduced-motion`; um `.css` por seção/componente, CSS global simples (sem Tailwind, sem CSS module); links internos `<a>` (nunca `next/link`); nada de hex em `.ts`/`.tsx` de `src/site` e `src/app/(site)`.
- **Leitura sem JS de cena** (spec 3.1): nenhum arquivo do pacote leitura importa `lenis`, `gsap`, `@/site/runner/*`, `@/site/cenas/*` ou `@/site/core/montagem`. O formulário de proposta da fase 2 (que usa `gsap` na cortina das etapas) entra como no protótipo e é a única exceção (DP13).
- **TypeScript:** zero `any`; `as` só com o motivo escrito ao lado; toda promise com tratamento de erro (a compilação do MDX que falha derruba o build de propósito: conteúdo quebrado não pode ir ao ar como página vazia); falha do JS de leitura vai ao `Sentry.captureException` com `origem`.
- **Windows/CRLF:** todo texto lido do disco passa por `.replace(/\r\n?/g, '\n')` antes de regex; nenhuma regex depende de `.` ou `$` antes de `\r`; `split('\n')` só depois de normalizar.
- **APIs de terceiro conferidas em 16/10/2026 no pacote instalado** (`node_modules`): rotas de grupos diferentes só conflitam se resolverem para a mesma URL (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route-groups.md`, "Conflicting paths"); `sitemap.ts` na raiz de `app` é Route Handler especial, cacheado por padrão (`.../01-metadata/sitemap.md`); `opengraph-image` recebe `params` como `Promise` e é gerado estaticamente por padrão (`.../01-metadata/opengraph-image.md`); `generateStaticParams` vale para página, layout e route handler (`.../04-functions/generate-static-params.md`, que não cita as rotas de imagem: por isso as rotas de OG não ganham `generateStaticParams`, DP6); `compileMDX({ source, options?, components? }): Promise<{ content: ReactElement; frontmatter }>` (`node_modules/next-mdx-remote/dist/rsc.d.ts`), conferido rodando em Node com CRLF no texto em 16/10/2026 (o `## Título` chega ao componente `h2` com `children` string).

## Decisões de projeto

- **DP1 · Leitura atrás da prévia, não nas URLs reais.** As quatro rotas ficam em `src/app/(site)/(leitura)/previa-v2/blog`, `.../blog/[slug]`, `.../privacidade` e `.../termos`, fechadas por `previaLiberada()` (404 em produção), com `robots: { index: false, follow: false }` e o canonical da URL real. Motivo: duas rotas em grupos diferentes não podem resolver para a mesma URL (o build falha), e trocar `/blog` agora poria o blog novo no ar no merge que for à `main`; a regra das fases é que o site no ar só muda na virada 1. Na prévia não há URL duplicada indexável: ela é 404 em produção e `noindex` nos outros ambientes (além do `X-Robots-Tag` que o `next.config.ts` já põe fora do lançamento).
- **DP2 · Rota fina, corpo separado.** Cada arquivo de rota só decide prévia, metadata e params; o corpo é `PaginaDoBlog`, `PaginaDoPost` e `PaginaDoDocumento` (`src/site/paginas/leitura.tsx`). Na fase 5, a virada cria `src/app/(site)/(leitura)/blog/...`, `privacidade` e `termos` com os mesmos corpos, apaga `src/app/(frontend)/blog/[slug]` e as chaves `blog`, `privacidade` e `termos` de `content/pages` (levando o `meta` delas para `src/site/leitura/metadados.ts`), e troca, no mesmo commit, `VIRADA_1_FEITA = true` (`src/site/inventario.ts`) e `PREFIXO_DA_LEITURA = ''` (`src/site/leitura/rotas.ts`). Um teste amarra os dois valores.
- **DP3 · Conteúdo compartilhado.** `content/blog/*.mdx` e `content/legal/*.mdx` servem o blog atual e o novo. A reescrita entra na `feat/site-v2` e só chega ao ar com a virada (a branch não vai à `main` antes), então não muda o site no ar antes da hora. O texto aprovado no protótipo entra por cópia literal de quatro arquivos (`design-explorations/site-v2-prototipo/src/leitura/blog/`); dois ajustes de conformidade que o protótipo não fez entram à mão (Tarefa 3.4).
- **DP4 · `<head>` idêntico por construção e conferido duas vezes.** Os metadados das páginas novas chamam as mesmas funções, com o mesmo `meta` (`content/pages` para `blog`, `privacidade` e `termos` até a virada); um teste compara com o `generateMetadata` das rotas atuais (Tarefa 3.5), e o script da Tarefa 3.9 compara em execução, URL por URL, com o site no ar.
- **DP5 · Sitemap do inventário.** `src/app/(frontend)/sitemap.ts` vai para `src/app/sitemap.ts` (o grupo `(frontend)` some na limpeza da fase 7, e o sitemap sumiria junto) e passa a listar as páginas que o `INVENTARIO` diz estarem no ar hoje, mais `/experience` e os posts, com as mesmas preferências de hoje (cidades 0,9 semanal, Experience 0,8 semanal, posts com a própria data). Um teste congela as 30 URLs de 16/10/2026: tirar ou acrescentar uma vira decisão escrita, não efeito colateral.
- **DP6 · OG do inventário, mesmo visual.** O card não muda; o título passa por `tituloDoOg`, e um teste exige título próprio para toda página do sitemap que usa a rota dinâmica (as que declaram imagem própria, como as cidades e o Experience, e a home, que usa o card padrão, ficam numa lista fechada). As rotas de OG continuam geradas sob demanda, como hoje: a documentação instalada não cobre `generateStaticParams` em rota de imagem, e mudar o modo de geração não é pedido da spec.
- **DP7 · Índice do texto ("Neste texto")** só com 3 ou mais `##`, como no protótipo; o id sai de `idDoTitulo` (sem acento, minúsculo, hífen), aplicado ao mesmo texto pelo índice e pelo `h2` do MDX. Sem desduplicação em execução: um teste garante ids únicos e diferentes dos ids das seções em todo post e documento.
- **DP8 · Destaque do índice = o post mais recente** (protótipo). Hoje coincide com o escolhido à mão no blog atual (G20).
- **DP9 · Data por extenso no fuso do Recife** ("27 de agosto de 2026", `America/Recife`, como o protótipo); minutos de leitura do frontmatter, senão 200 palavras por minuto.
- **DP10 · Links na prévia.** Cartões, "Blog" (voltar) e "Leia também" apontam para a leitura na prévia (`caminhoDeLeitura`). Os links do corpo do texto, do cabeçalho e do rodapé vão às URLs reais: no Preview, abrem o site atual. Nenhum link do corpo aponta hoje para uma página de leitura.
- **DP11 · Sem botão "Sou cliente" na leitura nesta fase.** Ele nasce na fase 4 para todos os pacotes (spec 5). O blog atual tem o `WhatsAppFloat`; a troca só acontece na virada, quando a fase 4 já terá o botão.
- **DP12 · Controle real de cookies na Privacidade.** O protótipo tinha só um aviso; a página nova tem o mesmo comportamento do `CookiePreferencesBlock` atual (mesmos textos, mesmo cuidado de só salvar com mudança), no visual do site v2 (interruptor de ponta reta), em `#cookies`, que é para onde o texto da política aponta.
- **DP13 · Pedido de proposta nas páginas de leitura**, como no protótipo (cena `08-proposta`): a `SecaoProposta` da fase 2, com "Seja Semog" apontando para `#proposta`. Ela traz o `gsap` da cortina das etapas para o pacote leitura; aceito, porque não é JS de cena e é o mesmo formulário das outras páginas.
- **DP14 · "Leia também" = 2 posts** (protótipo), pela mesma regra do "Continue lendo" atual (`listRelatedPosts`: mesma categoria, depois os mais recentes).

---

## Review Focus

- **Link direto para um trecho do texto (`/previa-v2/blog/<slug>#<id>`) ou clique no índice.** Esperado: o título chega logo abaixo do cabeçalho fixo (não escondido atrás dele) e o item do índice fica marcado. Teste de ids na Tarefa 3.5 e na 3.8 (ids únicos, todo link do índice tem alvo); posição conferida no navegador na Tarefa 3.10 (Step 9).
- **Visitante sem JavaScript.** Esperado: título, texto inteiro, índice, "Em resumo" e filtros por categoria funcionando (os filtros são CSS: `:target` e `:has`); a barra de progresso some (`html.sem-js`). Teste de HTML do servidor na Tarefa 3.7; contexto sem JS no script da Tarefa 3.9, rodado na 3.10.
- **Post com menos de três títulos (hoje, "Cinco sinais").** Esperado: sem índice lateral e sem coluna vazia à esquerda; o texto ocupa a grade como nos outros. Testes nas Tarefas 3.7 e 3.8; print na 3.10.
- **Quem já escolheu os cookies e volta à Privacidade.** Esperado: os interruptores mostram a escolha salva (não o padrão), "Salvar preferências" fica desligado até haver mudança e a mensagem diz que aquelas são as preferências já salvas. Teste na Tarefa 3.7.
- **Página que sai de `content/pages` na fase 4 ou na virada.** Esperado: o sitemap e o card OG não a perdem em silêncio; o teste aponta qual URL sumiu ou caiu no nome do site. Testes nas Tarefas 3.2 e 3.3.

---

## Estrutura de arquivos

| Caminho (na WT) | Responsabilidade |
| --- | --- |
| `src/site/inventario.ts` | (modificado) rotas técnicas, prévia por prefixo, `VIRADA_1_FEITA`, `servidaComoPagina` |
| `src/site/sitemap.ts` | entradas do sitemap a partir do inventário |
| `src/app/sitemap.ts` | rota `/sitemap.xml` (sai de `src/app/(frontend)/sitemap.ts`) |
| `src/site/seo/og.ts` | `tituloDoOg` e a lista fechada de URLs fora da rota de OG dinâmica |
| `src/app/[slug]/opengraph-image.tsx`, `src/app/blog/[slug]/opengraph-image.tsx` | (modificados) título pelo `tituloDoOg` |
| `content/blog/*.mdx` (cinco) | texto do protótipo e ajustes de conformidade |
| `src/site/leitura/rotas.ts` | `PREFIXO_DA_LEITURA`, `caminhoDeLeitura`, `semPrefixoDaLeitura` |
| `src/site/leitura/dados.ts` | cartões, data, minutos, filtros, ids e índice do texto (puro) |
| `src/site/leitura/metadados.ts` | `<head>` das páginas de leitura, idêntico ao das rotas atuais |
| `src/site/leitura/mdx.tsx` | componentes do MDX do site v2 e `corpoDoMdx` |
| `src/site/leitura/ligar-leitura.ts`, `LigarLeitura.tsx` | o JS da leitura (sem Lenis nem GSAP) |
| `src/site/secoes/leitura/*` | seções (`IndiceDoBlog`, `Artigo`, `LeiaTambem`, `CartaoDoPost`, `PreferenciasDeCookies`) e o CSS de cada uma; `leitura.css` comum |
| `src/site/layout/EsqueletoLeitura.tsx` | cabeçalho, main, rodapé e `LigarLeitura`, sem runner |
| `src/site/paginas/leitura.tsx` | corpo das quatro páginas (o que a virada leva às URLs reais) |
| `src/site/previa.ts` | (modificado) `ROBOTS_DA_PREVIA` |
| `src/app/(site)/(leitura)/layout.tsx` | pacote leitura (importa `leitura.css`) |
| `src/app/(site)/(leitura)/previa-v2/{blog,blog/[slug],privacidade,termos}/page.tsx` | rotas da prévia |
| `scripts/site-v2-comparar-metadados.mjs` | `<head>` por URL, site no ar contra build local |
| `scripts/site-v2-leitura.mjs` | varredura de navegador das páginas de leitura |
| `tests/int/helpers/leitura.ts` | `linksDoMdx`, `hashesMalformados` |

Testes novos: `site-v2-og`, `site-v2-leitura-conteudo`, `site-v2-leitura-dados`, `site-v2-leitura-comportamento`, `site-v2-leitura-secoes`, `site-v2-leitura-paginas`, `site-v2-comparar-metadados`. Modificados: `site-v2-inventario`, `sitemap`.

---

## Tarefa 3.1: Inventário com rotas técnicas, prévia por prefixo e o que está no ar

Pendência (b) da fase 1: antes de gerar sitemap e OG do inventário, ele precisa conhecer as rotas técnicas e saber o que responde como página **hoje**, antes da virada.

**Files:**
- Modify: `src/site/inventario.ts`
- Test: `tests/int/site-v2-inventario.int.spec.ts`

**Interfaces:**
- Consumes: `INVENTARIO`, `entradaDe(caminho: string): EntradaInventario | undefined` (fase 1).
- Produces: `EntradaInventario` ganha `{ tipo: 'tecnica' }`; `VIRADA_1_FEITA: boolean` (hoje `false`); `servidaComoPagina(entrada: EntradaInventario | undefined, viradaFeita?: boolean): boolean`; `entradaDe` passa a devolver `{ tipo: 'previa' }` para `/previa-v2/<qualquer coisa>` e `{ tipo: 'tecnica' }` para `/<segmento>/opengraph-image` e `/blog/<slug>/opengraph-image`.

- [ ] **Step 1: Escrever os testes**

Em `tests/int/site-v2-inventario.int.spec.ts`:

1. Trocar as duas primeiras linhas de import por:

```ts
import { existsSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
```

2. Trocar `import { entradaDe, INVENTARIO } from '@/site/inventario'` por:

```ts
import { entradaDe, INVENTARIO, servidaComoPagina, VIRADA_1_FEITA } from '@/site/inventario'
```

3. Logo depois dos imports, antes de `const ATUAIS`, acrescentar:

```ts
/**
 * Rotas técnicas e o arquivo do App Router que serve cada uma (um OG dinâmico de cada tipo,
 * como amostra). Se o arquivo mudar de lugar, este mapa muda junto: é o que prova que a rota
 * continua existindo.
 */
const ARQUIVOS_TECNICOS: Readonly<Record<string, string>> = {
  '/sitemap.xml': 'src/app/(frontend)/sitemap.ts',
  '/robots.txt': 'src/app/robots.ts',
  '/icon.svg': 'src/app/icon.svg',
  '/apple-icon.png': 'src/app/apple-icon.png',
  '/opengraph-image': 'src/app/opengraph-image.tsx',
  '/semog/opengraph-image': 'src/app/[slug]/opengraph-image.tsx',
  '/blog/g20-superlogica-next-2026/opengraph-image': 'src/app/blog/[slug]/opengraph-image.tsx',
}
```

4. Em `const ATUAIS = [ ... ]`, acrescentar como último item `...Object.keys(ARQUIVOS_TECNICOS),`.

5. No fim do arquivo, acrescentar:

```ts
describe('rotas técnicas e o que está no ar (fase 3)', () => {
  it('toda rota técnica do inventário tem o arquivo que a serve e fica fora das páginas', () => {
    const tecnicas = Object.entries(INVENTARIO)
      .filter(([, entrada]) => entrada.tipo === 'tecnica')
      .map(([caminho]) => caminho)
    expect(tecnicas.sort()).toEqual([
      '/apple-icon.png',
      '/icon.svg',
      '/opengraph-image',
      '/robots.txt',
      '/sitemap.xml',
    ])
    for (const [url, arquivo] of Object.entries(ARQUIVOS_TECNICOS)) {
      expect(entradaDe(url), url).toEqual({ tipo: 'tecnica' })
      expect(existsSync(path.join(process.cwd(), arquivo)), arquivo).toBe(true)
    }
  })

  it('o OG dinâmico vale só para um segmento ou um post', () => {
    expect(entradaDe('/a/b/opengraph-image')).toBeUndefined()
    expect(entradaDe('/blog/x/y/opengraph-image')).toBeUndefined()
  })

  it('as páginas de leitura da prévia são prévia, não página', () => {
    expect(entradaDe('/previa-v2/blog')).toEqual({ tipo: 'previa' })
    expect(entradaDe('/previa-v2/blog/g20-superlogica-next-2026')).toEqual({ tipo: 'previa' })
    expect(entradaDe('/previa-v2/privacidade')).toEqual({ tipo: 'previa' })
    expect(entradaDe('/previa-v2-outra')).toBeUndefined()
  })

  it('antes da virada 1, o que responde como página é o site atual', () => {
    expect(VIRADA_1_FEITA).toBe(false)
    expect(servidaComoPagina(entradaDe('/semog'))).toBe(true)
    expect(servidaComoPagina(entradaDe('/blog/g20-superlogica-next-2026'))).toBe(true)
    expect(servidaComoPagina(entradaDe('/tecnologia'))).toBe(false)
    expect(servidaComoPagina(entradaDe('/prestacao-de-contas-condominio'))).toBe(true)
    expect(servidaComoPagina(entradaDe('/software-de-gestao-condominial'))).toBe(true)
    for (const url of ['/styleguide', '/previa-v2', '/sitemap.xml', '/experience', '/nao-existe']) {
      expect(servidaComoPagina(entradaDe(url)), url).toBe(false)
    }
  })

  it('depois da virada 1, /tecnologia nasce e as duas URLs da fase 4 passam a redirecionar', () => {
    expect(servidaComoPagina(entradaDe('/tecnologia'), true)).toBe(true)
    expect(servidaComoPagina(entradaDe('/prestacao-de-contas-condominio'), true)).toBe(false)
    expect(servidaComoPagina(entradaDe('/software-de-gestao-condominial'), true)).toBe(false)
    expect(servidaComoPagina(entradaDe('/semog'), true)).toBe(true)
  })

  it('todo redirect do inventário é da fase 4, que entra com a virada 1 (premissa de servidaComoPagina)', () => {
    const fases = Object.values(INVENTARIO).flatMap((entrada) =>
      entrada.tipo === 'redireciona' ? [entrada.fase] : [],
    )
    expect(fases.length).toBeGreaterThan(0)
    expect(fases.every((fase) => fase === 4)).toBe(true)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-inventario.int.spec.ts`
Expected: FAIL. "toda URL servida hoje tem destino declarado" acusa `/sitemap.xml`, `/robots.txt`, `/icon.svg`, `/apple-icon.png`, `/opengraph-image` e os dois OG dinâmicos; os testes novos falham com `servidaComoPagina is not a function` e com as entradas técnicas ausentes. Os testes de redirects continuam verdes.

- [ ] **Step 3: Escrever o novo `src/site/inventario.ts`**

Arquivo inteiro:

```ts
/**
 * Inventário das URLs públicas e do que cada uma vira no site v2 (spec, seção 6). É a fonte do
 * sitemap (src/site/sitemap.ts) e do OG (src/site/seo/og.ts) desde a fase 3. Toda URL que o site
 * serve hoje precisa estar aqui, como página, redirect, removida, intocada, prévia ou técnica.
 */
export type Pacote = 'app' | 'landing' | 'leitura'
export type Fase = 3 | 4 | 6 | 7

export type EntradaInventario =
  | { tipo: 'pagina'; pacote: Pacote; fase: Fase; nova?: true }
  | { tipo: 'redireciona'; destino: string; fase: Fase }
  | { tipo: 'removida'; fase: Fase }
  | { tipo: 'intocada' }
  | { tipo: 'previa' }
  | { tipo: 'tecnica' }

/**
 * A virada 1 (fase 5) põe o site v2 no ar: as páginas da prévia passam às URLs reais,
 * /tecnologia nasce e as duas URLs da fase 4 começam a redirecionar. Vira `true` no mesmo commit
 * que move as rotas (e junto com `PREFIXO_DA_LEITURA`, src/site/leitura/rotas.ts). Até lá, o que
 * está no ar é o site atual.
 */
export const VIRADA_1_FEITA: boolean = false

export const INVENTARIO: Readonly<Record<string, EntradaInventario>> = {
  '/': { tipo: 'pagina', pacote: 'app', fase: 4 },
  '/semog': { tipo: 'pagina', pacote: 'app', fase: 4 },
  '/administracao-de-condominios': { tipo: 'pagina', pacote: 'app', fase: 4 },
  '/garante': { tipo: 'pagina', pacote: 'app', fase: 4 },
  '/incorporadoras': { tipo: 'pagina', pacote: 'app', fase: 4 },
  '/tecnologia': { tipo: 'pagina', pacote: 'app', fase: 4, nova: true },
  // Mantida no v2 como página própria (decisão do Leandro, 15/10/2026); conteúdo pendente (spec 9).
  '/solucoes': { tipo: 'pagina', pacote: 'app', fase: 4 },
  '/prestacao-de-contas-condominio': { tipo: 'redireciona', destino: '/tecnologia', fase: 4 },
  '/software-de-gestao-condominial': { tipo: 'redireciona', destino: '/tecnologia', fase: 4 },
  '/blog': { tipo: 'pagina', pacote: 'leitura', fase: 3 },
  '/privacidade': { tipo: 'pagina', pacote: 'leitura', fase: 3 },
  '/termos': { tipo: 'pagina', pacote: 'leitura', fase: 3 },
  '/proposta': { tipo: 'pagina', pacote: 'landing', fase: 4 },
  '/contato': { tipo: 'pagina', pacote: 'landing', fase: 4 },
  '/administradora-de-condominios-recife': { tipo: 'pagina', pacote: 'landing', fase: 6 },
  '/administradora-de-condominios-joao-pessoa': { tipo: 'pagina', pacote: 'landing', fase: 6 },
  '/administradora-de-condominios-campina-grande': { tipo: 'pagina', pacote: 'landing', fase: 6 },
  '/administradora-de-condominios-belem': { tipo: 'pagina', pacote: 'landing', fase: 6 },
  '/styleguide': { tipo: 'removida', fase: 7 },
  '/previa-v2': { tipo: 'previa' },
  // Arquivos especiais do App Router em src/app. Não são páginas: ficam fora do sitemap.
  '/sitemap.xml': { tipo: 'tecnica' },
  '/robots.txt': { tipo: 'tecnica' },
  '/icon.svg': { tipo: 'tecnica' },
  '/apple-icon.png': { tipo: 'tecnica' },
  '/opengraph-image': { tipo: 'tecnica' },
}

/** Todo post do blog (`/blog/<slug>`) vira página de leitura na fase 3. */
const POST_DO_BLOG: EntradaInventario = { tipo: 'pagina', pacote: 'leitura', fase: 3 }

/** Rotas de outros grupos que o site v2 não toca (spec 6). Terminado em "/" é prefixo. */
const INTOCADAS = ['/experience', '/qr/', '/desfecho/', '/api/'] as const

/** OG por página (src/app/[slug]/opengraph-image.tsx) e por post (src/app/blog/[slug]/...). */
const OG_DINAMICO = /^\/(?:blog\/)?[a-z0-9-]+\/opengraph-image$/

export function entradaDe(caminho: string): EntradaInventario | undefined {
  if (Object.hasOwn(INVENTARIO, caminho)) return INVENTARIO[caminho]
  // As páginas de leitura (e as da fase 4) vivem sob /previa-v2/ até a virada 1.
  if (caminho.startsWith('/previa-v2/')) return { tipo: 'previa' }
  if (OG_DINAMICO.test(caminho)) return { tipo: 'tecnica' }
  if (/^\/blog\/[a-z0-9-]+$/.test(caminho)) return POST_DO_BLOG
  const intocada = INTOCADAS.some((rota) =>
    rota.endsWith('/') ? caminho.startsWith(rota) : caminho === rota,
  )
  return intocada ? { tipo: 'intocada' } : undefined
}

/**
 * A URL responde como página no build atual: é o que o sitemap lista. Página nova só existe
 * depois da virada; os redirects do inventário são todos da fase 4 e entram com a virada 1
 * (teste em site-v2-inventario), então até ela a URL ainda é página.
 */
export function servidaComoPagina(
  entrada: EntradaInventario | undefined,
  viradaFeita: boolean = VIRADA_1_FEITA,
): boolean {
  if (entrada?.tipo === 'pagina') return entrada.nova !== true || viradaFeita
  if (entrada?.tipo === 'redireciona') return !viradaFeita
  return false
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-inventario.int.spec.ts tests/int/site-v2-layout.int.spec.tsx`
Expected: PASS em todos (os do inventário, incluindo os seis novos, e os de layout da fase 1, que usam `entradaDe`).

- [ ] **Step 5: Portões e commit**

```powershell
pnpm exec biome check --write src/site/inventario.ts tests/int/site-v2-inventario.int.spec.ts
pnpm exec biome ci ./src ./tests ./scripts
pnpm exec tsc --noEmit
pnpm run check:server-actions
pnpm run test:int
pnpm build
git branch --show-current && git add src/site/inventario.ts tests/int/site-v2-inventario.int.spec.ts && git commit -m "feat(site-v2): inventário conhece rotas técnicas, prévia e o que está no ar

Pendência da fase 1: antes de gerar sitemap e OG do inventário, ele passa a
declarar sitemap, robots, ícones e OG como rotas técnicas, trata /previa-v2/*
como prévia e diz, por servidaComoPagina, o que responde como página antes e
depois da virada 1.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
git diff --cached --stat HEAD~1
git status --short
```

Expected: portões verdes; o commit leva só os dois arquivos; `git status --short` vazio.

---

## Tarefa 3.2: Sitemap gerado do inventário (verificação COMPLETA na 3.10)

**Files:**
- Create: `src/site/sitemap.ts`
- Create: `src/app/sitemap.ts`
- Delete: `src/app/(frontend)/sitemap.ts`
- Modify: `tests/int/sitemap.int.spec.ts` (arquivo inteiro), `tests/int/site-v2-inventario.int.spec.ts` (uma linha)

**Interfaces:**
- Consumes: `INVENTARIO`, `entradaDe`, `servidaComoPagina`, `VIRADA_1_FEITA` (3.1); `absoluteUrl` (`src/lib/seo.ts`); `getAllPosts()` e o tipo `PostData` (`src/lib/blog.ts`).
- Produces: `type PostDoSitemap = Pick<PostData, 'slug' | 'date'>`; `INTOCADAS_NO_SITEMAP: readonly string[]` (`['/experience']`); `caminhosDoSitemap(viradaFeita?: boolean): string[]`; `entradasDoSitemap(posts: readonly PostDoSitemap[], agora: Date, viradaFeita?: boolean): MetadataRoute.Sitemap`; a rota `src/app/sitemap.ts` (`export default async function sitemap()` e `export const revalidate = 3600`).

- [ ] **Step 1: Conferir o sitemap do ar antes de congelar a lista (só leitura)**

```powershell
$xml = curl.exe -s https://www.semog.com.br/sitemap.xml
$caminhos = [regex]::Matches($xml, '<loc>([^<]+)</loc>') | ForEach-Object { ([uri]$_.Groups[1].Value).AbsolutePath } | Sort-Object
$caminhos.Count
$caminhos -join "`n"
```

Expected: `30` e exatamente as URLs da lista `SITEMAP_DE_16_10` do Step 2 (13 páginas de `content/pages`, 4 cidades, `/experience` e 12 posts). Se o ar tiver outra lista, parar e reportar: a `main` andou depois da base da branch e a lista congelada precisa ser decidida com o Leandro.

- [ ] **Step 2: Reescrever `tests/int/sitemap.int.spec.ts`**

Arquivo inteiro:

```ts
import { describe, expect, it } from 'vitest'
import sitemap from '@/app/sitemap'
import { CITY_LANDINGS } from '@/data/cityLandings'
import { getAllPosts } from '@/lib/blog'
import { absoluteUrl } from '@/lib/seo'
import { entradaDe, servidaComoPagina } from '@/site/inventario'
import { caminhosDoSitemap, entradasDoSitemap, INTOCADAS_NO_SITEMAP } from '@/site/sitemap'

/**
 * As 30 URLs do sitemap em 16/10/2026, conferidas contra https://www.semog.com.br/sitemap.xml
 * (Tarefa 3.2, Step 1). Tirar ou pôr uma URL aqui é decisão, não efeito colateral: escreva ao
 * lado o motivo e a data. Foi assim que as landings de cidade ficaram fora do sitemap desde que
 * subiram (o sitemap varria só content/pages), e a URL velha ranqueou acima da nova.
 */
const SITEMAP_DE_16_10 = [
  '/',
  '/semog',
  '/solucoes',
  '/administracao-de-condominios',
  '/garante',
  '/incorporadoras',
  '/prestacao-de-contas-condominio',
  '/software-de-gestao-condominial',
  '/blog',
  '/contato',
  '/proposta',
  '/privacidade',
  '/termos',
  '/administradora-de-condominios-recife',
  '/administradora-de-condominios-joao-pessoa',
  '/administradora-de-condominios-campina-grande',
  '/administradora-de-condominios-belem',
  '/experience',
  '/blog/administradora-de-condominios-joao-pessoa-o-que-avaliar',
  '/blog/administradora-de-condominios-recife-como-escolher',
  '/blog/administradora-ou-autogestao',
  '/blog/areas-lazer-regras-de-uso',
  '/blog/assembleia-instalacao-checklist-condominios-novos',
  '/blog/assembleia-virtual-validade-juridica',
  '/blog/cinco-sinais-trocar-administradora',
  '/blog/fundo-reserva-quanto-guardar-por-mes',
  '/blog/g20-superlogica-next-2026',
  '/blog/inadimplencia-condominio-o-que-a-lei-permite',
  '/blog/previsao-orcamentaria-guia-sindico',
  '/blog/quanto-custa-administradora-de-condominios',
]

const caminhoDe = (url: string) => new URL(url).pathname
const ordenado = (lista: readonly string[]) => [...lista].sort()

describe('sitemap.xml', () => {
  it('nenhuma página some e nenhuma aparece sem decisão: são as 30 URLs de 16/10/2026', async () => {
    const urls = (await sitemap()).map((e) => caminhoDe(e.url))
    expect(ordenado(urls)).toEqual(ordenado(SITEMAP_DE_16_10))
  })

  it('a rota é o inventário: dá o mesmo que entradasDoSitemap', async () => {
    const daRota = (await sitemap()).map((e) => e.url)
    const doModulo = entradasDoSitemap(getAllPosts(), new Date()).map((e) => e.url)
    expect(daRota).toEqual(doModulo)
  })

  it('toda URL listada é página servida hoje, post ou rota intocada declarada; nunca técnica, prévia ou removida', () => {
    for (const caminho of caminhosDoSitemap()) {
      const entrada = entradaDe(caminho)
      const permitida =
        servidaComoPagina(entrada) || INTOCADAS_NO_SITEMAP.includes(caminho)
      expect(permitida, caminho).toBe(true)
      expect(['tecnica', 'previa', 'removida'], caminho).not.toContain(entrada?.tipo)
    }
  })

  it('na virada 1: entra /tecnologia, saem as duas URLs que passam a redirecionar, o resto fica', () => {
    const antes = caminhosDoSitemap(false)
    const depois = caminhosDoSitemap(true)
    expect(depois.filter((c) => !antes.includes(c))).toEqual(['/tecnologia'])
    expect(ordenado(antes.filter((c) => !depois.includes(c)))).toEqual([
      '/prestacao-de-contas-condominio',
      '/software-de-gestao-condominial',
    ])
  })

  it('cidades com prioridade de captação, Experience abaixo delas, posts com a própria data', () => {
    const agora = new Date('2026-10-16T12:00:00.000Z')
    const entradas = entradasDoSitemap(getAllPosts(), agora)
    const porCaminho = new Map(entradas.map((e) => [caminhoDe(e.url), e]))
    const cidades = Object.values(CITY_LANDINGS)
    expect(cidades).toHaveLength(4)
    for (const cidade of cidades) {
      expect(porCaminho.get(`/${cidade.slug}`)).toMatchObject({
        changeFrequency: 'weekly',
        priority: 0.9,
        lastModified: agora,
      })
    }
    expect(porCaminho.get('/experience')).toMatchObject({ changeFrequency: 'weekly', priority: 0.8 })
    expect(porCaminho.get('/semog')).toEqual({ url: absoluteUrl('semog'), lastModified: agora })
    for (const post of getAllPosts()) {
      expect(porCaminho.get(`/blog/${post.slug}`)?.lastModified).toEqual(new Date(post.date))
    }
  })

  it('não tem URL duplicada e nunca lista as URLs legadas /locais/', async () => {
    const urls = (await sitemap()).map((e) => e.url)
    expect(new Set(urls).size).toBe(urls.length)
    expect(urls.every((url) => !url.includes('/locais/'))).toBe(true)
  })

  it('a home sai com a barra final, como o canonical', () => {
    expect(entradasDoSitemap([], new Date())[0]?.url).toBe(absoluteUrl(''))
  })
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/sitemap.int.spec.ts`
Expected: FAIL na coleta com `Failed to resolve import "@/app/sitemap"` (a rota ainda está em `(frontend)` e `src/site/sitemap.ts` não existe).

- [ ] **Step 4: Escrever `src/site/sitemap.ts`**

```ts
import type { MetadataRoute } from 'next'
import type { PostData } from '@/lib/blog'
import { absoluteUrl } from '@/lib/seo'
import { INVENTARIO, servidaComoPagina, VIRADA_1_FEITA } from './inventario'

export type PostDoSitemap = Pick<PostData, 'slug' | 'date'>

type Preferencia = Pick<MetadataRoute.Sitemap[number], 'changeFrequency' | 'priority'>

/** Páginas de captação: é nelas que o Ads e o orgânico comercial caem. */
const CAPTACAO: Preferencia = { changeFrequency: 'weekly', priority: 0.9 }
/** Peça de campanha com prazo, abaixo das cidades. */
const CAMPANHA: Preferencia = { changeFrequency: 'weekly', priority: 0.8 }

const PREFERENCIAS: Readonly<Record<string, Preferencia>> = {
  '/administradora-de-condominios-recife': CAPTACAO,
  '/administradora-de-condominios-joao-pessoa': CAPTACAO,
  '/administradora-de-condominios-campina-grande': CAPTACAO,
  '/administradora-de-condominios-belem': CAPTACAO,
  '/experience': CAMPANHA,
}

/**
 * Rotas de grupos intocados (spec 6) que o sitemap lista. A landing do Semog Experience vive no
 * grupo `(evento)`, fora do inventário de páginas, e o comentário do sitemap antigo já previa
 * tirá-la depois do evento (26/09/2026): decisão pendente, fora desta fase.
 */
export const INTOCADAS_NO_SITEMAP: readonly string[] = ['/experience']

/** Caminhos fixos do sitemap: o que o inventário diz que responde como página, e as intocadas. */
export function caminhosDoSitemap(viradaFeita: boolean = VIRADA_1_FEITA): string[] {
  const paginas = Object.entries(INVENTARIO)
    .filter(([, entrada]) => servidaComoPagina(entrada, viradaFeita))
    .map(([caminho]) => caminho)
  return [...paginas, ...INTOCADAS_NO_SITEMAP]
}

/**
 * `/sitemap.xml` a partir do inventário de URLs do site v2 (spec 6). Antes, a lista saía das
 * chaves de `content/pages`, e migrar uma página para o site v2 a tiraria do sitemap em silêncio.
 * As páginas usam a data do build (o conteúdo estático não tem data de edição); os posts, a
 * `date` do frontmatter.
 */
export function entradasDoSitemap(
  posts: readonly PostDoSitemap[],
  agora: Date,
  viradaFeita: boolean = VIRADA_1_FEITA,
): MetadataRoute.Sitemap {
  const fixas: MetadataRoute.Sitemap = caminhosDoSitemap(viradaFeita).map((caminho) => ({
    url: absoluteUrl(caminho),
    lastModified: agora,
    ...PREFERENCIAS[caminho],
  }))
  const dosPosts: MetadataRoute.Sitemap = posts.map((post) => ({
    url: absoluteUrl(`blog/${post.slug}`),
    lastModified: new Date(post.date),
  }))
  return [...fixas, ...dosPosts]
}
```

- [ ] **Step 5: Mover a rota**

```powershell
git rm "src/app/(frontend)/sitemap.ts"
```

Criar `src/app/sitemap.ts`:

```ts
import type { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/blog'
import { entradasDoSitemap } from '@/site/sitemap'

export const revalidate = 3600

/**
 * `/sitemap.xml`, gerado do inventário de URLs (src/site/sitemap.ts). Fica na raiz do App
 * Router, como `robots.ts`: o grupo `(frontend)`, onde morava, sai na limpeza da fase 7, e um
 * sitemap dentro dele sumiria junto.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return entradasDoSitemap(getAllPosts(), new Date())
}
```

Em `tests/int/site-v2-inventario.int.spec.ts`, no `ARQUIVOS_TECNICOS`, trocar `'/sitemap.xml': 'src/app/(frontend)/sitemap.ts',` por `'/sitemap.xml': 'src/app/sitemap.ts',`.

- [ ] **Step 6: Rodar e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/sitemap.int.spec.ts tests/int/site-v2-inventario.int.spec.ts`
Expected: PASS em todos.

- [ ] **Step 7: Portões, a rota servida de verdade e commit**

```powershell
pnpm exec biome check --write src/site/sitemap.ts src/app/sitemap.ts tests/int/sitemap.int.spec.ts tests/int/site-v2-inventario.int.spec.ts
pnpm exec biome ci ./src ./tests ./scripts
pnpm exec tsc --noEmit
pnpm run check:server-actions
pnpm run test:int
[string]::IsNullOrEmpty($env:NEXT_PUBLIC_SITE_URL)
pnpm build
$next = Start-Process -PassThru -NoNewWindow node -ArgumentList 'node_modules/next/dist/bin/next','start','-p','3100'
Start-Sleep -Seconds 5
$xml = curl.exe -s http://localhost:3100/sitemap.xml
([regex]::Matches($xml, '<loc>')).Count
curl.exe -s -o NUL -w "%{http_code} %{content_type}`n" http://localhost:3100/sitemap.xml
Stop-Process -Id $next.Id
```

Expected: portões verdes; `True` para a variável vazia; a saída do `pnpm build` lista `/sitemap.xml`; `30` `<loc>` e `200 application/xml`. Depois:

```powershell
git branch --show-current && git add src/site/sitemap.ts src/app/sitemap.ts "src/app/(frontend)/sitemap.ts" tests/int/sitemap.int.spec.ts tests/int/site-v2-inventario.int.spec.ts && git commit -m "feat(site-v2): sitemap sai do inventário de URLs

O /sitemap.xml deixa de depender das chaves de content/pages (migrar uma página
a tiraria em silêncio) e passa a listar o que o inventário diz estar no ar, com
as mesmas prioridades. A rota vai para a raiz do App Router, como o robots.ts.
Teste congela as 30 URLs de 16/10/2026 e o efeito da virada 1.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
git status --short
```

Expected: o commit registra a remoção de `src/app/(frontend)/sitemap.ts` e os quatro arquivos; `git status --short` vazio.

---

## Tarefa 3.3: Título do OG pelo inventário (verificação COMPLETA na 3.10)

**Files:**
- Create: `src/site/seo/og.ts`
- Modify: `src/app/[slug]/opengraph-image.tsx` (arquivo inteiro), `src/app/blog/[slug]/opengraph-image.tsx` (arquivo inteiro)
- Test: `tests/int/site-v2-og.int.spec.ts`

**Interfaces:**
- Consumes: `caminhosDoSitemap()` (3.2); `pages` (`content/pages`); `findPostBySlug(slug): PostData | null` (`src/lib/blog.ts`); `OG_SITE_NAME`, `OG_SIZE`, `OG_CONTENT_TYPE`, `OgCard` (`src/lib/og.tsx`).
- Produces: `tituloDoOg(caminho: string): string`; `OG_FORA_DA_ROTA_DINAMICA: ReadonlySet<string>`.

- [ ] **Step 1: Escrever o teste**

`tests/int/site-v2-og.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { pages } from '@/../content/pages'
import { metadata as belem } from '@/app/(frontend)/administradora-de-condominios-belem/page'
import { metadata as campinaGrande } from '@/app/(frontend)/administradora-de-condominios-campina-grande/page'
import { metadata as joaoPessoa } from '@/app/(frontend)/administradora-de-condominios-joao-pessoa/page'
import { metadata as recife } from '@/app/(frontend)/administradora-de-condominios-recife/page'
import { findPostBySlug, getAllPosts } from '@/lib/blog'
import { OG_SITE_NAME } from '@/lib/og'
import { OG_FORA_DA_ROTA_DINAMICA, tituloDoOg } from '@/site/seo/og'
import { caminhosDoSitemap } from '@/site/sitemap'

describe('OG do inventário', () => {
  it('toda página do sitemap que usa a rota dinâmica tem título próprio (nada cai no nome do site)', () => {
    const caminhos = [
      ...caminhosDoSitemap(),
      ...getAllPosts().map((post) => `/blog/${post.slug}`),
    ].filter((caminho) => !OG_FORA_DA_ROTA_DINAMICA.has(caminho))
    expect(caminhos.length).toBeGreaterThanOrEqual(24)
    expect(caminhos.filter((caminho) => tituloDoOg(caminho) === OG_SITE_NAME)).toEqual([])
  })

  it('página: meta.title, senão title (a prioridade do <title>); post: o título do post', () => {
    const semog = pages.semog
    expect(tituloDoOg('/semog')).toBe(semog?.meta?.title || semog?.title)
    expect(tituloDoOg('/blog/g20-superlogica-next-2026')).toBe(
      findPostBySlug('g20-superlogica-next-2026')?.title,
    )
  })

  it('URL desconhecida e post inexistente caem no nome do site (a rota de imagem nunca lança)', () => {
    expect(tituloDoOg('/nao-existe')).toBe(OG_SITE_NAME)
    expect(tituloDoOg('/blog/nao-existe')).toBe(OG_SITE_NAME)
  })

  it('fora da rota dinâmica: a home (card padrão), o Experience e as cidades', () => {
    expect([...OG_FORA_DA_ROTA_DINAMICA].sort()).toEqual([
      '/',
      '/administradora-de-condominios-belem',
      '/administradora-de-condominios-campina-grande',
      '/administradora-de-condominios-joao-pessoa',
      '/administradora-de-condominios-recife',
      '/experience',
    ])
  })

  it('as cidades declaram imagem própria, e por isso podem ficar fora', () => {
    for (const cidade of [recife, joaoPessoa, campinaGrande, belem]) {
      const imagens = JSON.stringify(cidade.openGraph?.images ?? null)
      expect(imagens).not.toBe('null')
      expect(imagens).not.toContain('opengraph-image')
    }
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-og.int.spec.ts`
Expected: FAIL na coleta com `Failed to resolve import "@/site/seo/og"`.

- [ ] **Step 3: Escrever `src/site/seo/og.ts`**

```ts
import { pages } from '@/../content/pages'
import { findPostBySlug } from '@/lib/blog'
import { OG_SITE_NAME } from '@/lib/og'

/**
 * Título do card OG de uma URL do site, para as rotas `src/app/[slug]/opengraph-image.tsx` e
 * `src/app/blog/[slug]/opengraph-image.tsx`. Página: `meta.title`, senão `title` (a prioridade de
 * `buildMetadata`); post: o título do post. Até a virada 1 as páginas ainda moram em
 * `content/pages`; a fase que tirar uma página de lá registra o título dela aqui, e o teste
 * site-v2-og acusa a URL que ficaria com o nome do site no card.
 */
export function tituloDoOg(caminho: string): string {
  const post = /^\/blog\/([a-z0-9-]+)$/.exec(caminho)?.[1]
  if (post) return findPostBySlug(post)?.title ?? OG_SITE_NAME
  const pagina = pages[caminho.replace(/^\/+/, '') || 'home']
  return pagina?.meta?.title || pagina?.title || OG_SITE_NAME
}

/**
 * URLs do sitemap que não usam a rota dinâmica: a home usa o card padrão
 * (`src/app/opengraph-image.tsx`), e o Experience (`src/lib/experienceSeo.ts`) e as cidades
 * (`metadata` de cada rota) declaram a própria imagem.
 */
export const OG_FORA_DA_ROTA_DINAMICA: ReadonlySet<string> = new Set([
  '/',
  '/experience',
  '/administradora-de-condominios-recife',
  '/administradora-de-condominios-joao-pessoa',
  '/administradora-de-condominios-campina-grande',
  '/administradora-de-condominios-belem',
])
```

- [ ] **Step 4: Reescrever as duas rotas de OG**

`src/app/[slug]/opengraph-image.tsx`, arquivo inteiro:

```tsx
import * as Sentry from '@sentry/nextjs'
import { ImageResponse } from 'next/og'
import { OG_CONTENT_TYPE, OG_SITE_NAME, OG_SIZE, OgCard } from '@/lib/og'
import { tituloDoOg } from '@/site/seo/og'

export const alt = OG_SITE_NAME
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

/**
 * OG por página: uma rota cobre qualquer página de um segmento (`/semog`, `/solucoes`...). O
 * título sai de `tituloDoOg` (src/site/seo/og.ts), travado pelo teste site-v2-og: tirar uma
 * página de `content/pages` sem registrar o título não cai mais em silêncio no nome do site.
 * Nunca lança: erro inesperado vai ao Sentry e o card sai com o nome do site.
 *
 * Fica em `src/app/[slug]/` (raiz do App Router), e não em `(frontend)`, por dois motivos do
 * Next 16.2.6 + Turbopack (dev): arquivo especial dentro do route group nunca é registrado (cai
 * no catch-all e dá 404), e dentro da pasta do catch-all `[[...slug]]` o Turbopack recusa o
 * segmento literal depois dele. A home usa o card padrão (`src/app/opengraph-image.tsx`).
 */
function resolverTitulo(slug: string): string {
  try {
    return tituloDoOg(`/${slug}`)
  } catch (erro) {
    Sentry.captureException(erro, { tags: { origem: 'og' } })
    return OG_SITE_NAME
  }
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return new ImageResponse(<OgCard eyebrow="SEMOG" title={resolverTitulo(slug)} />, {
    ...OG_SIZE,
  })
}
```

`src/app/blog/[slug]/opengraph-image.tsx`, arquivo inteiro:

```tsx
import * as Sentry from '@sentry/nextjs'
import { ImageResponse } from 'next/og'
import { OG_CONTENT_TYPE, OG_SITE_NAME, OG_SIZE, OgCard } from '@/lib/og'
import { tituloDoOg } from '@/site/seo/og'

export const alt = OG_SITE_NAME
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

/**
 * OG dos posts: o título vem de `content/blog/*.mdx`, por `tituloDoOg` (src/site/seo/og.ts).
 * Nunca lança: erro inesperado vai ao Sentry e o card sai com o nome do site.
 *
 * Fica em `src/app/blog/[slug]/` (raiz do App Router), e não em `(frontend)/blog/[slug]/`: no
 * Next 16.2.6 + Turbopack (dev), arquivo especial dentro do route group nunca é registrado e cai
 * no catch-all (404). Route groups não afetam a URL: `/blog/<slug>/opengraph-image` é servido
 * daqui.
 */
function resolverTitulo(slug: string): string {
  try {
    return tituloDoOg(`/blog/${slug}`)
  } catch (erro) {
    Sentry.captureException(erro, { tags: { origem: 'og' } })
    return OG_SITE_NAME
  }
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return new ImageResponse(<OgCard eyebrow="BLOG" title={resolverTitulo(slug)} />, {
    ...OG_SIZE,
  })
}
```

O `eyebrow` em caixa-alta é o card atual, fora do CSS do site v2; não muda nesta fase (DP6).

- [ ] **Step 5: Rodar e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-og.int.spec.ts`
Expected: PASS nos cinco.

- [ ] **Step 6: Portões e commit**

```powershell
pnpm exec biome check --write src/site/seo/og.ts "src/app/[slug]/opengraph-image.tsx" "src/app/blog/[slug]/opengraph-image.tsx" tests/int/site-v2-og.int.spec.ts
pnpm exec biome ci ./src ./tests ./scripts
pnpm exec tsc --noEmit
pnpm run check:server-actions
pnpm run test:int
pnpm build
git branch --show-current && git add src/site/seo/og.ts "src/app/[slug]/opengraph-image.tsx" "src/app/blog/[slug]/opengraph-image.tsx" tests/int/site-v2-og.int.spec.ts && git commit -m "feat(site-v2): título do OG sai do inventário

As rotas de OG por página e por post passam a resolver o título por tituloDoOg,
e um teste exige título próprio para toda página do sitemap que usa a rota
dinâmica. O visual do card não muda.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
git status --short
```

Expected: portões verdes; `git status --short` vazio.

---

## Tarefa 3.4: Texto do blog sem termos vedados, sem hash malformado e com links do inventário (verificação LEVE)

Pendência (a) da fase 1: o Lenis do pacote app (`anchors: true`) lança `URIError` no clique de um link com hash que não decodifica (`#%E0%A4%A`). O pacote leitura não carrega Lenis, mas o blog atual carrega o `LenisProvider` antigo e o MDX é o mesmo: o teste trava o conteúdo.

**Files:**
- Create: `tests/int/helpers/leitura.ts`
- Create: `tests/int/site-v2-leitura-conteudo.int.spec.ts`
- Modify (cópia do protótipo): `content/blog/assembleia-virtual-validade-juridica.mdx`, `content/blog/assembleia-instalacao-checklist-condominios-novos.mdx`, `content/blog/g20-superlogica-next-2026.mdx`, `content/blog/quanto-custa-administradora-de-condominios.mdx`
- Modify (à mão): `content/blog/quanto-custa-administradora-de-condominios.mdx:26`, `content/blog/assembleia-instalacao-checklist-condominios-novos.mdx:53`, `content/blog/administradora-de-condominios-recife-como-escolher.mdx:15`

**Interfaces:**
- Consumes: `procurarTermosVedados`, `textosDe` (`tests/int/helpers/identidade.ts`); `entradaDe` (3.1); `getAllPosts`.
- Produces: `linksDoMdx(texto: string): string[]`; `hashesMalformados(texto: string): string[]`.

- [ ] **Step 1: Escrever o helper**

`tests/int/helpers/leitura.ts`:

```ts
/** Destinos de link de um texto MDX: `[texto](destino)` e `href="destino"`. */
export function linksDoMdx(texto: string): string[] {
  const markdown = [...texto.matchAll(/\]\(([^)\s]+)\)/g)].map((achado) => achado[1] ?? '')
  const jsx = [...texto.matchAll(/\bhref=["']([^"']+)["']/g)].map((achado) => achado[1] ?? '')
  return [...markdown, ...jsx]
}

/**
 * Destinos com hash que o site não aceita. O Lenis do pacote app chama `decodeURIComponent` no
 * clique e lança URIError com `#%E0%A4%A` (ledger da fase 1); além de decodificável, o hash do
 * site é só `[A-Za-z0-9_-]`, que é o que `idDoTitulo` (src/site/leitura/dados.ts) gera.
 */
export function hashesMalformados(texto: string): string[] {
  return linksDoMdx(texto)
    .filter((destino) => destino.includes('#'))
    .filter((destino) => {
      const hash = destino.slice(destino.indexOf('#') + 1)
      try {
        decodeURIComponent(hash)
      } catch {
        return true
      }
      return !/^[A-Za-z0-9_-]+$/.test(hash)
    })
}
```

- [ ] **Step 2: Escrever o teste de conteúdo**

`tests/int/site-v2-leitura-conteudo.int.spec.ts`:

```ts
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { describe, expect, it } from 'vitest'
import { findPostBySlug, getAllPosts } from '@/lib/blog'
import { entradaDe } from '@/site/inventario'
import { procurarTermosVedados, textosDe } from './helpers/identidade'
import { hashesMalformados, linksDoMdx } from './helpers/leitura'

type ArquivoMdx = { arquivo: string; dados: Record<string, unknown>; corpo: string }

function lerMdx(pasta: 'blog' | 'legal'): ArquivoMdx[] {
  const raiz = path.join(process.cwd(), 'content', pasta)
  return readdirSync(raiz)
    .filter((nome) => nome.endsWith('.mdx'))
    .map((nome) => {
      const texto = readFileSync(path.join(raiz, nome), 'utf8').replace(/\r\n?/g, '\n')
      const { data, content } = matter(texto)
      return { arquivo: `content/${pasta}/${nome}`, dados: data, corpo: content }
    })
}

const ARQUIVOS = [...lerMdx('blog'), ...lerMdx('legal')]
const SLUGS = new Set(getAllPosts().map((post) => post.slug))

describe('texto do blog e dos documentos (site v2, spec 3.3 e 6)', () => {
  it('acha os 12 posts e os 2 documentos (zero arquivo não pode passar verde)', () => {
    expect(ARQUIVOS.filter((a) => a.arquivo.startsWith('content/blog/'))).toHaveLength(12)
    expect(ARQUIVOS.filter((a) => a.arquivo.startsWith('content/legal/'))).toHaveLength(2)
  })

  it('nenhum título, resumo, meta, "Em resumo" ou corpo usa termo vedado (o slug fica de fora)', () => {
    const achados = ARQUIVOS.flatMap(({ arquivo, dados, corpo }) => {
      const textos = [...textosDe({ ...dados, slug: undefined }), corpo]
      return procurarTermosVedados(textos.join('\n')).map((termo) => `${arquivo}: ${termo}`)
    })
    expect(achados).toEqual([])
  })

  it('a varredura pega o termo no título mesmo com o slug limpo', () => {
    const dados = { title: 'Tem validade jurídica?', slug: 'sem-termo' }
    expect(procurarTermosVedados(textosDe({ ...dados, slug: undefined }).join('\n'))).toEqual([
      'validade jurídica',
    ])
  })

  it('o post de assembleia virtual mantém o slug e ganha o título do protótipo', () => {
    const post = findPostBySlug('assembleia-virtual-validade-juridica')
    expect(post?.title).toBe('Assembleia virtual vale? O que a lei permite')
    expect(post?.meta?.title).toBe('Assembleia virtual vale? O que a lei permite em 2026')
  })

  it('a regra do hash acusa o que o Lenis não decodifica e o que não é id do site', () => {
    expect(hashesMalformados('[x](#%E0%A4%A)')).toEqual(['#%E0%A4%A'])
    expect(hashesMalformados('[x](/garante#ok-1)')).toEqual([])
    expect(hashesMalformados('<a href="#Seção">x</a>')).toEqual(['#Seção'])
    expect(hashesMalformados('[x](#cookies) e [y](/blog/a#um-titulo)')).toEqual([])
  })

  it('nenhum link do texto tem hash malformado', () => {
    const achados = ARQUIVOS.flatMap(({ arquivo, corpo }) =>
      hashesMalformados(corpo).map((destino) => `${arquivo}: ${destino}`),
    )
    expect(achados).toEqual([])
  })

  it('a única âncora da própria página é o #cookies da Privacidade (nova âncora pede revisão)', () => {
    const ancoras = ARQUIVOS.flatMap(({ arquivo, corpo }) =>
      linksDoMdx(corpo)
        .filter((destino) => destino.startsWith('#'))
        .map((destino) => `${arquivo}: ${destino}`),
    )
    expect(ancoras).toEqual(['content/legal/privacidade.mdx: #cookies'])
  })

  it('todo link interno do texto cai numa página do inventário (post: um post que existe)', () => {
    const internos = ARQUIVOS.flatMap(({ arquivo, corpo }) =>
      linksDoMdx(corpo)
        .filter((destino) => destino.startsWith('/'))
        .map((destino) => ({ arquivo, caminho: destino.split('#')[0] || '/' })),
    )
    expect(internos.length).toBeGreaterThan(0)
    for (const { arquivo, caminho } of internos) {
      expect(entradaDe(caminho)?.tipo, `${arquivo}: ${caminho}`).toBe('pagina')
      if (caminho.startsWith('/blog/')) {
        expect(SLUGS.has(caminho.slice('/blog/'.length)), `${arquivo}: ${caminho}`).toBe(true)
      }
    }
  })

  it('todo post tem o que a página de leitura mostra: categoria conhecida, resumo, foto e minutos', () => {
    for (const post of getAllPosts()) {
      expect(post.categoryTitle, post.slug).toBeTruthy()
      expect(post.excerpt, post.slug).not.toBe('')
      expect(post.heroImage?.url, post.slug).toBeTruthy()
      expect(post.readingTime, post.slug).toBeGreaterThan(0)
    }
  })
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-leitura-conteudo.int.spec.ts`
Expected: FAIL em dois testes. "nenhum título... usa termo vedado" lista exatamente:
`content/blog/assembleia-virtual-validade-juridica.mdx: validade jurídica`,
`content/blog/g20-superlogica-next-2026.mdx: tempo real`,
`content/blog/quanto-custa-administradora-de-condominios.mdx: validade jurídica`,
`content/blog/quanto-custa-administradora-de-condominios.mdx: assessoria jurídica`.
"o post de assembleia virtual..." falha no título. Os outros passam (o conteúdo de hoje já não tem hash malformado nem link para fora do inventário). Se a lista de achados for outra, parar e reportar: o conteúdo mudou desde 16/10/2026.

- [ ] **Step 4: Conferir que a diferença para o protótipo é só a esperada**

```powershell
$P = 'design-explorations/site-v2-prototipo/src/leitura/blog'
foreach ($n in 'assembleia-virtual-validade-juridica', 'assembleia-instalacao-checklist-condominios-novos', 'g20-superlogica-next-2026', 'quanto-custa-administradora-de-condominios') {
  git diff --no-index --ignore-cr-at-eol --stat "content/blog/$n.mdx" "$P/$n.mdx"
}
```

Expected (16/10/2026), em inserções e remoções: `assembleia-virtual-validade-juridica` 2 e 2 (o `title` e o `meta.title`); `assembleia-instalacao-checklist-condominios-novos` 1 e 1 (a linha 25: "um dos vícios que podem anular a assembleia de instalação"); `g20-superlogica-next-2026` 9 e 9 (linhas 2, 6, 10, 13, 20, 22, 28, 36 e 42: "mais de 3.500", "Ranking Top 200 da Superlógica", "uso de dados" no lugar de "dados em tempo real", "o ERP condominial que reúne"); `quanto-custa-administradora-de-condominios` 1 e 1 (a linha 51: "fácil de conferir"). Qualquer outra diferença: parar e reportar.

- [ ] **Step 5: Copiar o texto aprovado do protótipo**

```powershell
$P = 'C:\Users\lekoc\semogapp\semogsite-site-v2\design-explorations\site-v2-prototipo\src\leitura\blog'
$C = 'C:\Users\lekoc\semogapp\semogsite-site-v2\content\blog'
foreach ($n in 'assembleia-virtual-validade-juridica', 'assembleia-instalacao-checklist-condominios-novos', 'g20-superlogica-next-2026', 'quanto-custa-administradora-de-condominios') {
  Copy-Item -LiteralPath "$P\$n.mdx" -Destination "$C\$n.mdx"
}
```

- [ ] **Step 6: Os três ajustes de conformidade que o protótipo não fez**

1. `content/blog/quanto-custa-administradora-de-condominios.mdx`, linha 26. Trocar:
   `- **Escopo de serviços:** gestão financeira, cobrança, folha de funcionários, assessoria jurídica e assembleias podem estar dentro ou fora do pacote.`
   por:
   `- **Escopo de serviços:** gestão financeira, cobrança, folha de funcionários, suporte jurídico com escritório parceiro e assembleias podem estar dentro ou fora do pacote.`
   (regra: jurídico sempre "com escritório parceiro"; "assessoria jurídica" é vedado).
2. `content/blog/assembleia-instalacao-checklist-condominios-novos.mdx`, linha 53. Trocar `A Semog [conduz esse processo do começo ao fim](/administracao-de-condominios)` por `A Semog [assessora esse processo do começo ao fim](/administracao-de-condominios)`; o resto da frase fica igual. É a pendência da spec 9 ("a Semog assessora, não assume"). [A CONFIRMAR] com o Leandro na revisão do PR: a frase passa a dizer que a Semog acompanha a convocação e o registro em cartório, e não que os faz no lugar do condomínio.
3. `content/blog/administradora-de-condominios-recife-como-escolher.mdx`, linha 15 (um item de `keyTakeaways`). Trocar `  - "Equipe e jurídico locais resolvem em dias o que um call center de outro estado leva semanas."` por `  - "Equipe local e suporte jurídico com escritório parceiro resolvem em dias o que um call center de outro estado leva semanas."` (mesma regra do item 1; o corpo do post, linha 45, já diz "suporte jurídico com escritório parceiro"). [A CONFIRMAR] na revisão do PR.

Ficam como estão, de propósito: as frases sobre "uma administradora" que "assume" (`administradora-ou-autogestao.mdx:14`, `:27` e `:29`; `cinco-sinais-trocar-administradora.mdx:38` e `:46`), porque falam da categoria e não afirmam que a Semog assume a operação; o título do `##` de `administradora-ou-autogestao` também vira id do índice. [A CONFIRMAR] se o Leandro quer a mesma regra para o texto genérico.

- [ ] **Step 7: Rodar e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-leitura-conteudo.int.spec.ts tests/int/content-blog.int.spec.ts tests/int/blog-layer.int.spec.ts tests/int/site-v2-og.int.spec.ts`
Expected: PASS em todos.

- [ ] **Step 8: Portões e commit**

```powershell
pnpm exec biome check --write tests/int/helpers/leitura.ts tests/int/site-v2-leitura-conteudo.int.spec.ts
pnpm exec biome ci ./src ./tests ./scripts
pnpm exec tsc --noEmit
pnpm run check:server-actions
pnpm run test:int
pnpm build
git branch --show-current && git add tests/int/helpers/leitura.ts tests/int/site-v2-leitura-conteudo.int.spec.ts content/blog/assembleia-virtual-validade-juridica.mdx content/blog/assembleia-instalacao-checklist-condominios-novos.mdx content/blog/g20-superlogica-next-2026.mdx content/blog/quanto-custa-administradora-de-condominios.mdx content/blog/administradora-de-condominios-recife-como-escolher.mdx && git commit -m "feat(site-v2): blog sem termos vedados e guarda de conteúdo estendido

O guarda de termos vedados passa a ler título, resumo, meta, Em resumo e corpo
dos posts e documentos (o slug fica de fora). Entram o título do post de
assembleia virtual e o texto aprovado no protótipo, e dois ajustes de
conformidade (jurídico com escritório parceiro; a Semog assessora). Teste novo
proíbe hash malformado no MDX (URIError do Lenis) e link fora do inventário.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
git diff --stat HEAD~1
git status --short
```

Expected: portões verdes; o `git diff --stat HEAD~1` mostra os dois arquivos de teste e só as linhas de texto esperadas nos cinco `.mdx` (nenhum `.mdx` com o arquivo inteiro reescrito: se aparecer, foi CRLF; refazer o `git add` e conferir `git diff --cached --stat`). Calibragem leve: a sessão principal confere o diff de texto e os portões, sem verificador.

---

## Tarefa 3.5: Dados, rotas e metadados da leitura

**Files:**
- Create: `src/site/leitura/rotas.ts`, `src/site/leitura/dados.ts`, `src/site/leitura/metadados.ts`
- Modify: `src/site/previa.ts` (acrescentar `ROBOTS_DA_PREVIA`)
- Test: `tests/int/site-v2-leitura-dados.int.spec.ts`

**Interfaces:**
- Consumes: `VIRADA_1_FEITA` (3.1); `PostData`, `getAllPosts`, `findPostBySlug` (`src/lib/blog.ts`); `categories` (`content/blog/categories.ts`); `getLegalPage(slug: 'privacidade' | 'termos'): { title; updatedText; body }` (`content/lib/legal.ts`); `pages` (`content/pages`), `site` (`content/site.ts`); `buildMetadata` (`src/lib/seo.ts`).
- Produces:
  - `rotas.ts`: `PREFIXO_DA_LEITURA: string`; ``type CaminhoDeLeitura = '/blog' | `/blog/${string}` | '/privacidade' | '/termos'``; `caminhoDeLeitura(caminho: CaminhoDeLeitura): string`; `semPrefixoDaLeitura(href: string): string`.
  - `dados.ts`: `type CategoriaDoPost = { slug: string; titulo: string }`; `type CartaoDePost = { slug: string; href: string; titulo: string; resumo: string; categoria: CategoriaDoPost; dataTexto: string; minutos: number }`; `type FiltroDeCategoria = CategoriaDoPost & { total: number }`; `type ItemDoIndice = { id: string; texto: string }`; `IDS_DA_PAGINA: readonly string[]`; `MINIMO_PARA_INDICE = 3`; `dataPorExtenso(iso: string): string`; `minutosDeLeitura(post: Pick<PostData, 'readingTime' | 'body'>): number`; `cartaoDoPost(post: PostData): CartaoDePost`; `filtrosDasCategorias(posts: readonly PostData[]): FiltroDeCategoria[]`; `regrasDoFiltro(filtros: readonly Pick<FiltroDeCategoria, 'slug'>[]): string`; `idDoTitulo(texto: string): string`; `indiceDoTexto(corpo: string): ItemDoIndice[]`.
  - `metadados.ts`: `type DocumentoLegal = 'privacidade' | 'termos'`; `type PaginaDeConteudo = 'blog' | DocumentoLegal`; `paginaDoConteudo(chave: PaginaDeConteudo): PageData`; `metadadosDoPost(slug: string): Metadata`; `metadadosDaPagina(chave: PaginaDeConteudo): Metadata`.
  - `previa.ts`: `ROBOTS_DA_PREVIA: NonNullable<Metadata['robots']>` = `{ index: false, follow: false }`.

- [ ] **Step 1: Escrever o teste**

`tests/int/site-v2-leitura-dados.int.spec.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'
import { getLegalPage } from '@/../content/lib/legal'
import { generateMetadata as metadadosAntigosDaPagina } from '@/app/(frontend)/[[...slug]]/page'
import { generateMetadata as metadadosAntigosDoPost } from '@/app/(frontend)/blog/[slug]/page'
import { findPostBySlug, getAllPosts, type PostData } from '@/lib/blog'
import { VIRADA_1_FEITA } from '@/site/inventario'
import {
  cartaoDoPost,
  dataPorExtenso,
  filtrosDasCategorias,
  IDS_DA_PAGINA,
  idDoTitulo,
  indiceDoTexto,
  minutosDeLeitura,
  regrasDoFiltro,
} from '@/site/leitura/dados'
import { metadadosDaPagina, metadadosDoPost } from '@/site/leitura/metadados'
import { caminhoDeLeitura, PREFIXO_DA_LEITURA, semPrefixoDaLeitura } from '@/site/leitura/rotas'
import { ROBOTS_DA_PREVIA } from '@/site/previa'

// O catch-all importa todos os blocos do site atual; generateMetadata não usa nenhum.
vi.mock('@/blocks/RenderBlocks', () => ({ RenderBlocks: () => null }))

describe('rotas da leitura', () => {
  it('enquanto a virada 1 não acontece, a leitura vive sob /previa-v2', () => {
    expect(PREFIXO_DA_LEITURA).toBe(VIRADA_1_FEITA ? '' : '/previa-v2')
    expect(caminhoDeLeitura('/blog')).toBe('/previa-v2/blog')
    expect(caminhoDeLeitura('/blog/g20-superlogica-next-2026')).toBe(
      '/previa-v2/blog/g20-superlogica-next-2026',
    )
  })

  it('semPrefixoDaLeitura devolve a URL real e não mexe no resto', () => {
    expect(semPrefixoDaLeitura('/previa-v2/blog/x')).toBe('/blog/x')
    expect(semPrefixoDaLeitura('/previa-v2/termos')).toBe('/termos')
    expect(semPrefixoDaLeitura('/garante')).toBe('/garante')
    expect(semPrefixoDaLeitura('/previa-v2')).toBe('/previa-v2')
  })

  it('a prévia nunca é indexada', () => {
    expect(ROBOTS_DA_PREVIA).toEqual({ index: false, follow: false })
  })
})

describe('dados da leitura', () => {
  it('data por extenso, no fuso do Recife', () => {
    expect(dataPorExtenso('2026-08-27T09:00:00.000Z')).toBe('27 de agosto de 2026')
    // 02:00 UTC de 1º de julho ainda é 30 de junho no Recife (UTC-3).
    expect(dataPorExtenso('2026-07-01T02:00:00.000Z')).toBe('30 de junho de 2026')
  })

  it('minutos: os do frontmatter; sem eles, 200 palavras por minuto e nunca menos de 1', () => {
    expect(minutosDeLeitura({ readingTime: 9, body: 'curto' })).toBe(9)
    expect(minutosDeLeitura({ readingTime: undefined, body: 'palavra '.repeat(600) })).toBe(3)
    expect(minutosDeLeitura({ readingTime: undefined, body: 'uma' })).toBe(1)
  })

  it('cartão: link da prévia, categoria resolvida, resumo, data e minutos', () => {
    const post = findPostBySlug('g20-superlogica-next-2026')
    if (!post) throw new Error('post do G20 ausente')
    expect(cartaoDoPost(post)).toEqual({
      slug: 'g20-superlogica-next-2026',
      href: '/previa-v2/blog/g20-superlogica-next-2026',
      titulo: post.title,
      resumo: post.excerpt,
      categoria: { slug: 'a-semog', titulo: 'A Semog' },
      dataTexto: '27 de agosto de 2026',
      minutos: 6,
    })
  })

  it('post com categoria desconhecida derruba o build em vez de inventar rótulo', () => {
    const base = findPostBySlug('g20-superlogica-next-2026')
    if (!base) throw new Error('post do G20 ausente')
    const quebrado: PostData = { ...base, category: 'sumiu', categoryTitle: null }
    expect(() => cartaoDoPost(quebrado)).toThrow('categoria desconhecida')
  })

  it('filtros: só categorias com post, na ordem de categories.ts, com a contagem', () => {
    const filtros = filtrosDasCategorias(getAllPosts())
    expect(filtros.find((f) => f.slug === 'financas')?.total).toBe(3)
    expect(filtros.reduce((soma, f) => soma + f.total, 0)).toBe(getAllPosts().length)
    expect(filtros.every((f) => f.total > 0 && /^[a-z0-9-]+$/.test(f.slug))).toBe(true)
    expect(filtros[0]?.slug).toBe('financas')
  })

  it('regras do filtro: um par por categoria, por token de cor', () => {
    const regras = regrasDoFiltro([{ slug: 'financas' }])
    expect(regras).toContain('#blog-indice:has(#categoria-financas:target)')
    expect(regras).toContain('.bi-item:not([data-categoria="financas"]) { display: none; }')
    expect(regras).toContain('background: var(--marinho)')
    expect(regras.split('\n')).toHaveLength(2)
  })

  it('id do título: sem acento, minúsculo, hífen no lugar do resto', () => {
    expect(idDoTitulo('E quanto a Semog cobra?')).toBe('e-quanto-a-semog-cobra')
    expect(idDoTitulo('1. Dados que coletamos')).toBe('1-dados-que-coletamos')
    expect(idDoTitulo('Híbrida: o melhor dos dois mundos')).toBe(
      'hibrida-o-melhor-dos-dois-mundos',
    )
  })

  it('índice: só os ## do texto, na ordem, também com CRLF', () => {
    expect(indiceDoTexto('## Um\r\n\r\nTexto\r\n### Sub\r\n## Dois\r\n')).toEqual([
      { id: 'um', texto: 'Um' },
      { id: 'dois', texto: 'Dois' },
    ])
  })

  it('em todo post e documento, os ids do índice são únicos, válidos e não repetem id da página', () => {
    const corpos = [
      ...getAllPosts().map((post) => ({ nome: post.slug, corpo: post.body })),
      { nome: 'privacidade', corpo: getLegalPage('privacidade').body },
      { nome: 'termos', corpo: getLegalPage('termos').body },
    ]
    for (const { nome, corpo } of corpos) {
      const ids = indiceDoTexto(corpo).map((item) => item.id)
      expect(new Set(ids).size, nome).toBe(ids.length)
      for (const id of ids) {
        expect(id, nome).toMatch(/^[a-z0-9-]+$/)
        expect(IDS_DA_PAGINA, `${nome}: ${id}`).not.toContain(id)
        expect(id.startsWith('categoria-'), `${nome}: ${id}`).toBe(false)
      }
    }
  })
})

describe('metadados da leitura = os das rotas atuais (spec 6)', () => {
  it('post: o mesmo <head> do /blog/[slug] atual, nos 12', async () => {
    for (const post of getAllPosts()) {
      const antigo = await metadadosAntigosDoPost({ params: Promise.resolve({ slug: post.slug }) })
      expect(metadadosDoPost(post.slug), post.slug).toEqual(antigo)
    }
  })

  it('blog, privacidade e termos: o mesmo <head> do catch-all atual', async () => {
    for (const chave of ['blog', 'privacidade', 'termos'] as const) {
      const antigo = await metadadosAntigosDaPagina({ params: Promise.resolve({ slug: [chave] }) })
      expect(metadadosDaPagina(chave), chave).toEqual(antigo)
    }
  })

  it('post inexistente: o mesmo título de 404, sem canonical', async () => {
    const antigo = await metadadosAntigosDoPost({ params: Promise.resolve({ slug: 'nao-existe' }) })
    expect(metadadosDoPost('nao-existe')).toEqual(antigo)
    expect(metadadosDoPost('nao-existe').alternates).toBeUndefined()
  })
})
```

Se a importação de `@/app/(frontend)/blog/[slug]/page` falhar no jsdom por algum módulo `server-only` na cadeia, mocar esse módulo com `vi.mock` como o `RenderBlocks` acima (o `generateMetadata` não usa componente nenhum) e anotar o motivo no comentário. Não trocar a comparação por uma chamada a `buildMetadata` no próprio teste: seria um teste que passa por construção.

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-leitura-dados.int.spec.ts`
Expected: FAIL na coleta com `Failed to resolve import "@/site/leitura/dados"`.

- [ ] **Step 3: Escrever `src/site/leitura/rotas.ts`**

```ts
import { VIRADA_1_FEITA } from '@/site/inventario'

/**
 * Prefixo das páginas de leitura enquanto elas vivem na prévia (fase 3). Vira '' na virada 1
 * (fase 5), no mesmo commit que leva as rotas a /blog, /privacidade e /termos.
 */
export const PREFIXO_DA_LEITURA: string = VIRADA_1_FEITA ? '' : '/previa-v2'

export type CaminhoDeLeitura = '/blog' | `/blog/${string}` | '/privacidade' | '/termos'

/** Link interno da leitura: na prévia, para a prévia; depois da virada, a URL real. */
export function caminhoDeLeitura(caminho: CaminhoDeLeitura): string {
  return `${PREFIXO_DA_LEITURA}${caminho}`
}

/** A URL real de um link da leitura (para conferir contra o inventário). */
export function semPrefixoDaLeitura(href: string): string {
  if (PREFIXO_DA_LEITURA === '' || !href.startsWith(`${PREFIXO_DA_LEITURA}/`)) return href
  return href.slice(PREFIXO_DA_LEITURA.length)
}
```

- [ ] **Step 4: Escrever `src/site/leitura/dados.ts`**

```ts
import { categories } from '@/../content/blog/categories'
import type { PostData } from '@/lib/blog'
import { caminhoDeLeitura } from './rotas'

export type CategoriaDoPost = { slug: string; titulo: string }

/** O que um cartão de post mostra (índice do blog e "Leia também"). */
export type CartaoDePost = {
  slug: string
  href: string
  titulo: string
  resumo: string
  categoria: CategoriaDoPost
  dataTexto: string
  minutos: number
}

export type FiltroDeCategoria = CategoriaDoPost & { total: number }

/** Um item do índice "Neste texto": um `##` do MDX. */
export type ItemDoIndice = { id: string; texto: string }

/** Ids das seções das páginas de leitura: um título do texto não pode repeti-los. */
export const IDS_DA_PAGINA: readonly string[] = [
  'conteudo',
  'artigo',
  'leia-tambem',
  'proposta',
  'cookies',
  'blog-indice',
  'todos',
]

/** Abaixo disso o texto é curto demais para índice (protótipo). */
export const MINIMO_PARA_INDICE = 3

const PALAVRAS_POR_MINUTO = 200

const DATA = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'America/Recife',
})

/** "27 de agosto de 2026", no fuso do Recife (o `date` do frontmatter é UTC). */
export function dataPorExtenso(iso: string): string {
  return DATA.format(new Date(iso))
}

/** Minutos de leitura: os do frontmatter; sem eles, 200 palavras por minuto. */
export function minutosDeLeitura(post: Pick<PostData, 'readingTime' | 'body'>): number {
  if (typeof post.readingTime === 'number') return post.readingTime
  const palavras = post.body.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(palavras / PALAVRAS_POR_MINUTO))
}

/**
 * Cartão de um post. Categoria fora de `content/blog/categories.ts` derruba o build: a página
 * não inventa rótulo (teste de conteúdo garante que hoje todas existem).
 */
export function cartaoDoPost(post: PostData): CartaoDePost {
  if (!post.categoryTitle) {
    throw new Error(`[leitura] Post "${post.slug}" com categoria desconhecida: ${post.category}.`)
  }
  return {
    slug: post.slug,
    href: caminhoDeLeitura(`/blog/${post.slug}`),
    titulo: post.title,
    resumo: post.excerpt,
    categoria: { slug: post.category, titulo: post.categoryTitle },
    dataTexto: dataPorExtenso(post.date),
    minutos: minutosDeLeitura(post),
  }
}

/** Filtros do índice: as categorias com post, na ordem de `categories.ts`, com a contagem. */
export function filtrosDasCategorias(posts: readonly PostData[]): FiltroDeCategoria[] {
  return categories
    .map((categoria) => ({
      slug: categoria.slug,
      titulo: categoria.title,
      total: posts.filter((post) => post.category === categoria.slug).length,
    }))
    .filter((filtro) => filtro.total > 0)
}

/**
 * Filtro por categoria sem JS (protótipo): cada filtro é um link para uma âncora vazia
 * (`#categoria-<slug>`) e o CSS, com `:target` e `:has`, esconde os posts das outras categorias.
 * Navegador sem `:has` mostra a lista inteira. Um par de regras por categoria, gerado do mesmo
 * dado que gera os filtros; os slugs são `[a-z0-9-]` (teste em site-v2-leitura-dados).
 */
export function regrasDoFiltro(filtros: readonly Pick<FiltroDeCategoria, 'slug'>[]): string {
  return filtros
    .map(({ slug }) =>
      [
        `#blog-indice:has(#categoria-${slug}:target) .bi-item:not([data-categoria="${slug}"]) { display: none; }`,
        `#blog-indice:has(#categoria-${slug}:target) .bi-filtro[href="#categoria-${slug}"] { background: var(--marinho); border-color: var(--marinho); color: var(--branco); }`,
      ].join('\n'),
    )
    .join('\n')
}

/** Id de um título do texto: sem acento, minúsculo, hífen no lugar do resto (protótipo). */
export function idDoTitulo(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Os `##` do MDX, na ordem: o índice "Neste texto". O texto do disco pode vir com CRLF. */
export function indiceDoTexto(corpo: string): ItemDoIndice[] {
  return corpo
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .flatMap((linha) => {
      const titulo = /^## (.+)$/.exec(linha)?.[1]?.trim()
      return titulo ? [{ id: idDoTitulo(titulo), texto: titulo }] : []
    })
}
```

- [ ] **Step 5: Escrever `src/site/leitura/metadados.ts`**

```ts
import type { Metadata } from 'next'
import { pages } from '@/../content/pages'
import { site } from '@/../content/site'
import { findPostBySlug } from '@/lib/blog'
import { buildMetadata } from '@/lib/seo'
import type { PageData } from '@/types/content'

export type DocumentoLegal = 'privacidade' | 'termos'
export type PaginaDeConteudo = 'blog' | DocumentoLegal

/**
 * A página em `content/pages` que ainda guarda o `meta` do blog e dos documentos. Até a virada
 * 1 o site atual serve essas URLs com esse `meta`, e as páginas novas usam o mesmo (spec 6:
 * metadata mantida). Na virada, o `meta` muda para cá junto com a rota (DP2 do plano da fase 3).
 */
export function paginaDoConteudo(chave: PaginaDeConteudo): PageData {
  const pagina = pages[chave]
  if (!pagina) throw new Error(`[leitura] content/pages sem a página "${chave}".`)
  return pagina
}

/**
 * O `<head>` de um post: o mesmo que `src/app/(frontend)/blog/[slug]/page.tsx` monta (teste de
 * igualdade em site-v2-leitura-dados). `meta` do frontmatter primeiro; sem ele, título e resumo.
 */
export function metadadosDoPost(slug: string): Metadata {
  const post = findPostBySlug(slug)
  if (!post) return { title: 'Página não encontrada — Semog', description: undefined }
  return buildMetadata({
    doc: {
      title: post.title,
      meta: {
        title: post.meta?.title ?? post.title,
        description: post.meta?.description ?? post.excerpt,
      },
    },
    settings: site,
    path: `blog/${slug}`,
    ogType: 'article',
  })
}

/** O `<head>` do blog e dos documentos: o mesmo que o catch-all `[[...slug]]` monta hoje. */
export function metadadosDaPagina(chave: PaginaDeConteudo): Metadata {
  return buildMetadata({ doc: paginaDoConteudo(chave), settings: site, path: chave })
}
```

- [ ] **Step 6: Acrescentar `ROBOTS_DA_PREVIA` em `src/site/previa.ts`**

No topo do arquivo, antes do comentário existente, acrescentar `import type { Metadata } from 'next'` e uma linha em branco. No fim do arquivo, acrescentar:

```ts

/** A prévia nunca é indexada, em ambiente nenhum (o canonical das páginas aponta para a URL real). */
export const ROBOTS_DA_PREVIA: NonNullable<Metadata['robots']> = { index: false, follow: false }
```

- [ ] **Step 7: Rodar e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-leitura-dados.int.spec.ts tests/int/site-v2-previa.int.spec.tsx`
Expected: PASS em todos.

- [ ] **Step 8: Portões e commit**

```powershell
pnpm exec biome check --write src/site/leitura src/site/previa.ts tests/int/site-v2-leitura-dados.int.spec.ts
pnpm exec biome ci ./src ./tests ./scripts
pnpm exec tsc --noEmit
pnpm run check:server-actions
pnpm run test:int
pnpm build
git branch --show-current && git add src/site/leitura/rotas.ts src/site/leitura/dados.ts src/site/leitura/metadados.ts src/site/previa.ts tests/int/site-v2-leitura-dados.int.spec.ts && git commit -m "feat(site-v2): dados, rotas e metadados das páginas de leitura

Cartões, data por extenso, filtros por categoria, índice do texto e o prefixo
da prévia. Os metadados das páginas novas saem das mesmas funções do blog atual
e um teste os compara com o generateMetadata das rotas de hoje.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
git status --short
```

Expected: portões verdes; `git status --short` vazio.

---

## Tarefa 3.6: O JS da leitura, sem Lenis nem GSAP

Porta de `design-explorations/site-v2-prototipo/src/leitura.js`: fundo do cabeçalho depois do primeiro respiro de rolagem, barra de progresso do texto, item do índice que está sendo lido, fotos adiadas antes de imprimir. O menu já é ligado pelo `Cabecalho` (fase 1) e o formulário é React (fase 2).

**Files:**
- Create: `src/site/leitura/ligar-leitura.ts`, `src/site/leitura/LigarLeitura.tsx`
- Test: `tests/int/site-v2-leitura-comportamento.int.spec.ts`

**Interfaces:**
- Consumes: `type Reportar = (erro: unknown, origem: string) => void` (`src/site/core/ganchos.ts`).
- Produces: `alturaDoCabecalho(): number`; `fracaoLida(corpo: { top: number; height: number }, alturaDaJanela: number, cab: number): number`; `iniciarFundoDoCabecalho(): () => void`; `iniciarProgresso(): () => void`; `iniciarIndice(reportar: Reportar): () => void`; `iniciarFotosDaImpressao(): () => void`; `ligarLeitura(reportar: Reportar): () => void`; o componente client `LigarLeitura()`.

- [ ] **Step 1: Escrever o teste**

`tests/int/site-v2-leitura-comportamento.int.spec.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  alturaDoCabecalho,
  fracaoLida,
  iniciarFotosDaImpressao,
  iniciarIndice,
  iniciarProgresso,
  ligarLeitura,
} from '@/site/leitura/ligar-leitura'

/** Retângulo com só o que o código lê (top e height); o resto é coerente. */
function retangulo(top: number, height = 0): DOMRect {
  return {
    x: 0,
    y: top,
    top,
    bottom: top + height,
    left: 0,
    right: 100,
    width: 100,
    height,
    toJSON: () => ({}),
  }
}

function fixarRetangulo(elemento: Element, top: number, height = 0) {
  vi.spyOn(elemento, 'getBoundingClientRect').mockReturnValue(retangulo(top, height))
}

function rolar() {
  window.dispatchEvent(new Event('scroll'))
}

beforeEach(() => {
  document.documentElement.className = 'sem-js'
})

/** O jsdom não rola: a posição da janela é posta à mão (propriedade comum, não getter). */
function posicionarJanela(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
  posicionarJanela(0)
  document.body.innerHTML = ''
})

describe('fração lida do texto', () => {
  it('0 com o início sob o cabeçalho, 1 com o fim no pé da tela', () => {
    expect(fracaoLida({ top: 68, height: 2000 }, 900, 68)).toBe(0)
    expect(fracaoLida({ top: 68 - 1168, height: 2000 }, 900, 68)).toBe(1)
    expect(fracaoLida({ top: 68 - 584, height: 2000 }, 900, 68)).toBeCloseTo(0.5)
  })

  it('nunca sai de 0 a 1, e texto mais curto que a tela é 0 ou 1', () => {
    expect(fracaoLida({ top: 500, height: 2000 }, 900, 68)).toBe(0)
    expect(fracaoLida({ top: -9000, height: 2000 }, 900, 68)).toBe(1)
    expect(fracaoLida({ top: 100, height: 300 }, 900, 68)).toBe(0)
    expect(fracaoLida({ top: 10, height: 300 }, 900, 68)).toBe(1)
  })
})

describe('barra de progresso', () => {
  it('acompanha a rolagem e para de acompanhar no desligamento', () => {
    document.body.innerHTML =
      '<div class="artigo-progresso"><span data-progresso></span></div><div data-corpo-leitura></div>'
    const barra = document.querySelector<HTMLElement>('[data-progresso]')
    const corpo = document.querySelector('[data-corpo-leitura]')
    if (!barra || !corpo) throw new Error('marcação do teste')
    fixarRetangulo(corpo, -1000, 2000)
    const desligar = iniciarProgresso()
    const esperado = fracaoLida(retangulo(-1000, 2000), window.innerHeight, alturaDoCabecalho())
    expect(barra.style.transform).toBe(`scaleX(${esperado})`)
    desligar()
    fixarRetangulo(corpo, 0, 2000)
    rolar()
    expect(barra.style.transform).toBe(`scaleX(${esperado})`)
  })

  it('no índice do blog (sem texto corrido) não liga nada; com só uma das peças, falha alto', () => {
    expect(() => iniciarProgresso()()).not.toThrow()
    document.body.innerHTML = '<div data-corpo-leitura></div>'
    expect(() => iniciarProgresso()).toThrow('[data-progresso]')
  })
})

describe('índice "Neste texto"', () => {
  function montarIndice() {
    document.body.innerHTML = `
      <nav data-indice><ol>
        <li><a href="#um">Um</a></li>
        <li><a href="#dois">Dois</a></li>
      </ol></nav>
      <h2 id="um">Um</h2><h2 id="dois">Dois</h2>`
    const [linkUm, linkDois] = Array.from(document.querySelectorAll('[data-indice] a'))
    const um = document.getElementById('um')
    const dois = document.getElementById('dois')
    if (!linkUm || !linkDois || !um || !dois) throw new Error('marcação do teste')
    return { linkUm, linkDois, um, dois }
  }

  it('marca o título que já passou da linha de leitura, e só ele', () => {
    const { linkUm, linkDois, um, dois } = montarIndice()
    fixarRetangulo(um, 100)
    fixarRetangulo(dois, 500)
    iniciarIndice(vi.fn())
    expect(linkUm.getAttribute('aria-current')).toBe('location')
    expect(linkDois.hasAttribute('aria-current')).toBe(false)
    fixarRetangulo(dois, 150)
    rolar()
    expect(linkUm.hasAttribute('aria-current')).toBe(false)
    expect(linkDois.getAttribute('aria-current')).toBe('location')
  })

  it('link do índice sem alvo é reportado e os outros continuam funcionando', () => {
    const { linkUm, um, dois } = montarIndice()
    dois.remove()
    fixarRetangulo(um, 100)
    const reportar = vi.fn()
    iniciarIndice(reportar)
    expect(reportar).toHaveBeenCalledTimes(1)
    expect(reportar.mock.calls[0]?.[1]).toBe('índice')
    expect(linkUm.getAttribute('aria-current')).toBe('location')
  })
})

describe('fotos para impressão', () => {
  it('as fotos adiadas passam a carregar 2 s depois da carga e de novo antes de imprimir', () => {
    vi.useFakeTimers()
    document.body.innerHTML = '<img loading="lazy" alt="" /><img loading="lazy" alt="" />'
    const desligar = iniciarFotosDaImpressao()
    expect(document.querySelectorAll('img[loading="lazy"]')).toHaveLength(2)
    vi.advanceTimersByTime(2000)
    expect(document.querySelectorAll('img[loading="eager"]')).toHaveLength(2)
    document.body.insertAdjacentHTML('beforeend', '<img loading="lazy" alt="" />')
    window.dispatchEvent(new Event('beforeprint'))
    expect(document.querySelectorAll('img[loading="lazy"]')).toHaveLength(0)
    desligar()
  })
})

describe('ligarLeitura', () => {
  it('libera as entradas na hora (js + motion) e uma peça que falha não derruba as outras', () => {
    document.body.innerHTML = '<div data-corpo-leitura></div>'
    const reportar = vi.fn()
    const desligar = ligarLeitura(reportar)
    const html = document.documentElement.classList
    expect(html.contains('sem-js')).toBe(false)
    expect(html.contains('js')).toBe(true)
    expect(html.contains('motion')).toBe(true)
    // Sem [data-cabecalho] e com o corpo sem a barra: duas peças reportadas, nenhuma exceção.
    expect(reportar.mock.calls.map((chamada) => chamada[1])).toEqual([
      'cabeçalho',
      'progresso de leitura',
    ])
    expect(() => desligar()).not.toThrow()
  })

  it('o cabeçalho ganha fundo depois do primeiro respiro de rolagem', () => {
    document.body.innerHTML = '<header data-cabecalho></header>'
    const cabecalho = document.querySelector('[data-cabecalho]')
    const desligar = ligarLeitura(vi.fn())
    expect(cabecalho?.hasAttribute('data-rolou')).toBe(false)
    posicionarJanela(40)
    rolar()
    expect(cabecalho?.hasAttribute('data-rolou')).toBe(true)
    desligar()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-leitura-comportamento.int.spec.ts`
Expected: FAIL na coleta com `Failed to resolve import "@/site/leitura/ligar-leitura"`.

- [ ] **Step 3: Escrever `src/site/leitura/ligar-leitura.ts`**

```ts
import type { Reportar } from '@/site/core/ganchos'

/*
 * O JS das páginas de leitura (leitura.js do protótipo). Leitura não tem pin nem rolagem
 * sequestrada: rolagem nativa, sem Lenis nem GSAP. A entrada do título é animação de CSS
 * (leitura.css). Nada aqui roda no topo do módulo: o Next avalia este arquivo no servidor.
 */

const ROLAGEM_PARA_FUNDO = 8
const LINHA_DE_LEITURA = 0.25
const ESPERA_DAS_FOTOS_MS = 2000

function aoRolarNativo(atualizar: () => void): () => void {
  window.addEventListener('scroll', atualizar, { passive: true })
  window.addEventListener('resize', atualizar, { passive: true })
  atualizar()
  return () => {
    window.removeEventListener('scroll', atualizar)
    window.removeEventListener('resize', atualizar)
  }
}

/** Altura do cabeçalho fixo, lida do token `--cab`. */
export function alturaDoCabecalho(): number {
  const valor = Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--cab'),
  )
  return Number.isFinite(valor) ? valor : 0
}

/** Fração lida do corpo: 0 com o início dele sob o cabeçalho, 1 com o fim no pé da tela. */
export function fracaoLida(
  corpo: { top: number; height: number },
  alturaDaJanela: number,
  cab: number,
): number {
  const percurso = corpo.height - (alturaDaJanela - cab)
  const lido = percurso > 0 ? (cab - corpo.top) / percurso : corpo.top < cab ? 1 : 0
  return Math.min(1, Math.max(0, lido))
}

/** O cabeçalho ganha fundo depois do primeiro respiro de rolagem (base.css, `data-rolou`). */
export function iniciarFundoDoCabecalho(): () => void {
  const cabecalho = document.querySelector('[data-cabecalho]')
  if (!(cabecalho instanceof HTMLElement)) {
    throw new Error('[leitura] Cabeçalho [data-cabecalho] ausente.')
  }
  return aoRolarNativo(() =>
    cabecalho.toggleAttribute('data-rolou', window.scrollY > ROLAGEM_PARA_FUNDO),
  )
}

/** A barra de 2 px sob o cabeçalho acompanha o corpo do texto. */
export function iniciarProgresso(): () => void {
  const barra = document.querySelector('[data-progresso]')
  const corpo = document.querySelector('[data-corpo-leitura]')
  if (!barra && !corpo) return () => {} // índice do blog: não há texto corrido
  if (!(barra instanceof HTMLElement) || !(corpo instanceof HTMLElement)) {
    throw new Error('[leitura] Barra [data-progresso] sem [data-corpo-leitura], ou o inverso.')
  }
  const cab = alturaDoCabecalho()
  return aoRolarNativo(() => {
    const fracao = fracaoLida(corpo.getBoundingClientRect(), window.innerHeight, cab)
    barra.style.transform = `scaleX(${fracao})`
  })
}

/** O link do índice cujo título já passou da linha de leitura recebe `aria-current`. */
export function iniciarIndice(reportar: Reportar): () => void {
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("[data-indice] a[href^='#']"))
  if (links.length === 0) return () => {}
  const pares = links.flatMap((link) => {
    const id = (link.getAttribute('href') ?? '').slice(1)
    const alvo = document.getElementById(id)
    if (!alvo) reportar(new Error(`[leitura] Índice aponta para #${id}, que não existe.`), 'índice')
    return alvo ? [{ link, alvo }] : []
  })
  return aoRolarNativo(() => {
    const linha = alturaDoCabecalho() + window.innerHeight * LINHA_DE_LEITURA
    let atual: HTMLAnchorElement | null = null
    for (const par of pares) if (par.alvo.getBoundingClientRect().top <= linha) atual = par.link
    for (const { link } of pares) {
      if (link === atual) link.setAttribute('aria-current', 'location')
      else link.removeAttribute('aria-current')
    }
  })
}

/**
 * Foto com `loading="lazy"` fora da tela sai como caixa vazia na impressão. Passa a eager depois
 * da carga (sem disputar banda com a primeira dobra) e de novo antes de imprimir.
 */
export function iniciarFotosDaImpressao(): () => void {
  const carregar = () => {
    for (const foto of document.querySelectorAll('img[loading="lazy"]')) {
      foto.setAttribute('loading', 'eager')
    }
  }
  let espera: number | undefined
  const agendar = () => {
    espera = window.setTimeout(carregar, ESPERA_DAS_FOTOS_MS)
  }
  if (document.readyState === 'complete') agendar()
  else window.addEventListener('load', agendar, { once: true })
  window.addEventListener('beforeprint', carregar)
  return () => {
    window.clearTimeout(espera)
    window.removeEventListener('load', agendar)
    window.removeEventListener('beforeprint', carregar)
  }
}

/**
 * Liga tudo, cada peça isolada: a que falha é reportada e as outras seguem. Nada espera
 * movimento na leitura, então as entradas (`.entrada`, base.css) são liberadas já, em vez de
 * esperar os 6 s da rede de segurança do layout (site).
 */
export function ligarLeitura(reportar: Reportar): () => void {
  const pecas: ReadonlyArray<readonly [string, () => () => void]> = [
    ['cabeçalho', iniciarFundoDoCabecalho],
    ['progresso de leitura', iniciarProgresso],
    ['índice', () => iniciarIndice(reportar)],
    ['fotos da impressão', iniciarFotosDaImpressao],
  ]
  const desligamentos = pecas.flatMap(([origem, ligar]) => {
    try {
      return [ligar()]
    } catch (erro) {
      reportar(erro, origem)
      return []
    }
  })
  document.documentElement.classList.remove('sem-js')
  document.documentElement.classList.add('js', 'motion')
  return () => {
    for (const desligar of desligamentos) desligar()
  }
}
```

- [ ] **Step 4: Escrever `src/site/leitura/LigarLeitura.tsx`**

```tsx
'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { ligarLeitura } from './ligar-leitura'

/** O JS das páginas de leitura (ligar-leitura.ts). Falha de uma peça vai ao Sentry e ao console. */
export function LigarLeitura() {
  useEffect(
    () =>
      ligarLeitura((erro, origem) => {
        console.error(`[leitura] ${origem} não ligou.`, erro)
        Sentry.captureException(erro, { tags: { origem: `leitura:${origem}` } })
      }),
    [],
  )
  return null
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-leitura-comportamento.int.spec.ts tests/int/site-v2-core-ssr.int.spec.ts`
Expected: PASS em todos (o teste de SSR da fase 1 importa os módulos de `src/site` em Node; um `window` no topo do módulo novo o derrubaria).

- [ ] **Step 6: Portões e commit**

```powershell
pnpm exec biome check --write src/site/leitura/ligar-leitura.ts src/site/leitura/LigarLeitura.tsx tests/int/site-v2-leitura-comportamento.int.spec.ts
pnpm exec biome ci ./src ./tests ./scripts
pnpm exec tsc --noEmit
pnpm run check:server-actions
pnpm run test:int
pnpm build
git branch --show-current && git add src/site/leitura/ligar-leitura.ts src/site/leitura/LigarLeitura.tsx tests/int/site-v2-leitura-comportamento.int.spec.ts && git commit -m "feat(site-v2): o JS das páginas de leitura, sem Lenis nem GSAP

Fundo do cabeçalho, barra de progresso, índice que acompanha a leitura e fotos
adiadas antes de imprimir, cada peça isolada: a que falha vai ao Sentry e as
outras seguem.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
git status --short
```

Expected: portões verdes; `git status --short` vazio.

---

## Tarefa 3.7: Seções de leitura e o CSS do protótipo

**Files:**
- Create: `src/site/leitura/mdx.tsx`
- Create: `src/site/secoes/leitura/CartaoDoPost.tsx`, `IndiceDoBlog.tsx`, `Artigo.tsx`, `LeiaTambem.tsx`, `PreferenciasDeCookies.tsx`
- Create (cópia do protótipo + ajustes): `src/site/secoes/leitura/leitura.css`, `indice-do-blog.css`, `artigo.css`, `leia-tambem.css`
- Create: `src/site/secoes/leitura/preferencias-de-cookies.css`
- Test: `tests/int/site-v2-leitura-secoes.int.spec.tsx`

**Interfaces:**
- Consumes: `CartaoDePost`, `FiltroDeCategoria`, `ItemDoIndice`, `MINIMO_PARA_INDICE`, `regrasDoFiltro`, `idDoTitulo` (3.5); `img(file)` (`content/media.ts`); `ImageMedia` (`src/components/Media/ImageMedia.tsx`); `useConsent()` (`src/providers/ConsentProvider.tsx`); `Media` (`src/types/media.ts`).
- Produces:
  - `mdx.tsx`: `textoDoNo(no: ReactNode): string`; `FiguraDoPost({ file, caption })`; `VideoDoPost({ file, poster, caption, orientation, aspectRatio })`; `COMPONENTES_DO_MDX`; `corpoDoMdx(fonte: string): Promise<ReactElement>`.
  - `CartaoDoPost({ cartao, nivel }: { cartao: CartaoDePost; nivel: 'h2' | 'h3' })`.
  - `type DadosDoIndice = { titulo: string; texto: string; destaque: CartaoDePost; imagemDoDestaque?: Media; demais: readonly CartaoDePost[]; filtros: readonly FiltroDeCategoria[] }` e `IndiceDoBlog({ dados })`.
  - `type TopoDoArtigo = { tipo: 'post'; categoria: string; dataTexto: string; minutos: number; voltar: string } | { tipo: 'documento'; atualizacao: string }`; `type DadosDoArtigo = { titulo: string; resumo?: string; topo: TopoDoArtigo; imagem?: Media; indice: readonly ItemDoIndice[]; emResumo: readonly string[]; corpo: ReactElement; depoisDoCorpo?: ReactNode }`; `Artigo({ dados })`.
  - `LeiaTambem({ cartoes, todos }: { cartoes: readonly CartaoDePost[]; todos: string })`.
  - `PreferenciasDeCookies()` (client).

- [ ] **Step 1: Escrever o teste**

`tests/int/site-v2-leitura-secoes.int.spec.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import { CONSENT_COOKIE_NAME, setConsent } from '@/lib/consent'
import { ConsentProvider } from '@/providers/ConsentProvider'
import type { CartaoDePost } from '@/site/leitura/dados'
import { corpoDoMdx, textoDoNo } from '@/site/leitura/mdx'
import { Artigo, type DadosDoArtigo } from '@/site/secoes/leitura/Artigo'
import { IndiceDoBlog } from '@/site/secoes/leitura/IndiceDoBlog'
import { LeiaTambem } from '@/site/secoes/leitura/LeiaTambem'
import { PreferenciasDeCookies } from '@/site/secoes/leitura/PreferenciasDeCookies'

const CARTAO: CartaoDePost = {
  slug: 'um-post',
  href: '/previa-v2/blog/um-post',
  titulo: 'Um post',
  resumo: 'O resumo do post.',
  categoria: { slug: 'financas', titulo: 'Finanças' },
  dataTexto: '27 de agosto de 2026',
  minutos: 6,
}

function artigo(extra: Partial<DadosDoArtigo> = {}): DadosDoArtigo {
  return {
    titulo: 'Título do texto',
    resumo: 'Resumo do texto.',
    topo: { tipo: 'post', categoria: 'Finanças', dataTexto: '27 de agosto de 2026', minutos: 6, voltar: '/previa-v2/blog' },
    indice: [
      { id: 'um', texto: 'Um' },
      { id: 'dois', texto: 'Dois' },
      { id: 'tres', texto: 'Três' },
    ],
    emResumo: ['Primeiro ponto.', 'Segundo ponto.'],
    corpo: <p>Corpo do texto.</p>,
    ...extra,
  }
}

afterEach(() => {
  document.cookie = `${CONSENT_COOKIE_NAME}=; max-age=0; path=/`
})

describe('componentes do MDX', () => {
  it('títulos ganham o id do índice; foto e vídeo saem no visual do site v2, sem Tailwind', async () => {
    const corpo = await corpoDoMdx(
      [
        '## Híbrida: o melhor dos dois mundos',
        '',
        'Texto com [link](/garante) e **ênfase**.',
        '',
        '### Monte um calendário de reajustes',
        '',
        '<PostImage file="g20-next-2026-01.webp" caption="Legenda da foto." />',
        '',
        '<PostVideo file="g20-next-2026.mp4" poster="g20-next-2026-poster.webp" aspectRatio="636 / 1080" caption="Legenda do vídeo." />',
      ].join('\r\n'),
    )
    const html = renderToStaticMarkup(corpo)
    expect(html).toContain('<h2 id="hibrida-o-melhor-dos-dois-mundos">')
    expect(html).toContain('<h3 id="monte-um-calendario-de-reajustes">')
    expect(html).toContain('<figure class="artigo-figura">')
    expect(html).toContain('<figure class="artigo-figura artigo-figura--vertical">')
    expect(html).toContain('<figcaption>Legenda da foto.</figcaption>')
    expect(html).toContain('preload="none"')
    expect(html).toContain('aspect-ratio:636 / 1080')
    expect(html).not.toMatch(/class="[^"]*\b(?:my-10|rounded-card|text-fg-3|mx-auto)\b/)
  })

  it('textoDoNo junta o texto de nós aninhados', () => {
    expect(textoDoNo(['Um ', <strong key="a">dois</strong>, 3])).toBe('Um dois3')
  })
})

describe('artigo', () => {
  it('post: voltar, metadados, título, resumo, índice, "Em resumo" e corpo, nessa ordem', () => {
    render(<Artigo dados={artigo()} />)
    expect(screen.getByRole('link', { name: 'Blog' }).getAttribute('href')).toBe('/previa-v2/blog')
    expect(screen.getByRole('heading', { level: 1, name: 'Título do texto' })).toBeTruthy()
    expect(document.querySelector('.artigo-meta')?.textContent).toBe(
      'Finanças27 de agosto de 20266 min de leitura',
    )
    const indice = document.querySelector('nav[data-indice]')
    expect(Array.from(indice?.querySelectorAll('a') ?? [], (a) => a.getAttribute('href'))).toEqual([
      '#um',
      '#dois',
      '#tres',
    ])
    expect(screen.getByText('Em resumo')).toBeTruthy()
    expect(document.querySelector('[data-corpo-leitura]')?.textContent).toBe('Corpo do texto.')
    expect(document.querySelector('[data-progresso]')).not.toBeNull()
  })

  it('com menos de três títulos não há índice (o texto ocupa a grade sozinho)', () => {
    render(<Artigo dados={artigo({ indice: [{ id: 'um', texto: 'Um' }] })} />)
    expect(document.querySelector('nav[data-indice]')).toBeNull()
  })

  it('documento: a data de atualização no lugar de voltar e categoria, sem "Em resumo"', () => {
    render(
      <Artigo
        dados={artigo({
          resumo: undefined,
          topo: { tipo: 'documento', atualizacao: 'Última atualização: agosto de 2026' },
          emResumo: [],
        })}
      />,
    )
    expect(screen.queryByRole('link', { name: 'Blog' })).toBeNull()
    expect(document.querySelector('.artigo-meta')?.textContent).toBe('Última atualização: agosto de 2026')
    expect(screen.queryByText('Em resumo')).toBeNull()
    expect(document.querySelector('.artigo-lead')).toBeNull()
  })

  it('sem JS, o texto inteiro e o índice já estão no HTML do servidor', () => {
    const html = renderToStaticMarkup(<Artigo dados={artigo()} />)
    expect(html).toContain('Corpo do texto.')
    expect(html).toContain('href="#dois"')
    expect(html).toContain('Primeiro ponto.')
  })
})

describe('índice do blog', () => {
  const dados = {
    titulo: 'Blog Semog',
    texto: 'Conteúdo para síndicos.',
    destaque: CARTAO,
    demais: [{ ...CARTAO, slug: 'outro', href: '/previa-v2/blog/outro', categoria: { slug: 'gestao', titulo: 'Gestão' } }],
    filtros: [
      { slug: 'financas', titulo: 'Finanças', total: 1 },
      { slug: 'gestao', titulo: 'Gestão', total: 1 },
    ],
  }

  it('título, filtros com contagem, destaque e demais, cada um com a sua categoria', () => {
    render(<IndiceDoBlog dados={dados} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Blog Semog' })).toBeTruthy()
    const filtros = Array.from(document.querySelectorAll('.bi-filtro'), (a) => [
      a.getAttribute('href'),
      a.textContent,
    ])
    expect(filtros).toEqual([
      ['#todos', 'Todos 2'],
      ['#categoria-financas', 'Finanças 1'],
      ['#categoria-gestao', 'Gestão 1'],
    ])
    expect(document.getElementById('categoria-financas')).not.toBeNull()
    const itens = Array.from(document.querySelectorAll('.bi-item'), (li) => li.getAttribute('data-categoria'))
    expect(itens).toEqual(['financas', 'gestao'])
    expect(document.querySelector('.bi-item--destaque a')?.getAttribute('href')).toBe('/previa-v2/blog/um-post')
  })

  it('o filtro funciona sem JS: as regras de :target e :has saem no HTML', () => {
    const html = renderToStaticMarkup(<IndiceDoBlog dados={dados} />)
    expect(html).toContain('#blog-indice:has(#categoria-gestao:target)')
  })
})

describe('leia também', () => {
  it('dois cartões com h3 e o link para todos os textos', () => {
    render(<LeiaTambem cartoes={[CARTAO, { ...CARTAO, slug: 'dois' }]} todos="/previa-v2/blog" />)
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2)
    expect(screen.getByRole('link', { name: 'Todos os textos' }).getAttribute('href')).toBe('/previa-v2/blog')
  })

  it('sem cartões, a seção não aparece', () => {
    const { container } = render(<LeiaTambem cartoes={[]} todos="/previa-v2/blog" />)
    expect(container.innerHTML).toBe('')
  })
})

describe('preferências de cookies (Privacidade)', () => {
  function interruptor(nome: string) {
    return screen.getByRole('switch', { name: nome })
  }

  it('sem escolha salva: mostra o padrão, salvar só liga com mudança, e salvar grava', () => {
    render(
      <ConsentProvider>
        <PreferenciasDeCookies />
      </ConsentProvider>,
    )
    expect(document.getElementById('cookies')).not.toBeNull()
    expect(interruptor('Cookies necessários').hasAttribute('disabled')).toBe(true)
    expect(interruptor('Cookies de análise').getAttribute('aria-checked')).toBe('true')
    const salvar = screen.getByRole('button', { name: 'Salvar preferências' })
    expect(salvar.hasAttribute('disabled')).toBe(true)
    expect(screen.getByText(/ainda não alterou nada/)).toBeTruthy()
    fireEvent.click(interruptor('Cookies de marketing'))
    expect(interruptor('Cookies de marketing').getAttribute('aria-checked')).toBe('false')
    expect(salvar.hasAttribute('disabled')).toBe(false)
    expect(screen.getByText(/Você mudou algo/)).toBeTruthy()
    fireEvent.click(salvar)
    expect(document.cookie).toContain(CONSENT_COOKIE_NAME)
    expect(screen.getByText(/Preferências salvas/)).toBeTruthy()
  })

  it('quem já escolheu vê a escolha salva, não o padrão', async () => {
    setConsent({ necessary: true, analytics: false, marketing: false })
    render(
      <ConsentProvider>
        <PreferenciasDeCookies />
      </ConsentProvider>,
    )
    expect(await screen.findByText(/já salvou neste navegador/)).toBeTruthy()
    expect(interruptor('Cookies de análise').getAttribute('aria-checked')).toBe('false')
    expect(interruptor('Cookies de marketing').getAttribute('aria-checked')).toBe('false')
    expect(screen.getByRole('button', { name: 'Salvar preferências' }).hasAttribute('disabled')).toBe(true)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-leitura-secoes.int.spec.tsx`
Expected: FAIL na coleta com `Failed to resolve import "@/site/leitura/mdx"`.

- [ ] **Step 3: Copiar o CSS do protótipo e ajustar**

```powershell
$P = 'C:\Users\lekoc\semogapp\semogsite-site-v2\design-explorations\site-v2-prototipo\src\scenes\leitura'
$D = 'C:\Users\lekoc\semogapp\semogsite-site-v2\src\site\secoes\leitura'
New-Item -ItemType Directory -Force $D | Out-Null
Copy-Item -LiteralPath "$P\00-comum.css" -Destination "$D\leitura.css"
Copy-Item -LiteralPath "$P\01-blog.css" -Destination "$D\indice-do-blog.css"
Copy-Item -LiteralPath "$P\02-artigo.css" -Destination "$D\artigo.css"
Copy-Item -LiteralPath "$P\03-leia-tambem.css" -Destination "$D\leia-tambem.css"
```

Ajustes (com a ferramenta de edição, texto exato):
1. `leitura.css`, comentário do topo: trocar `cartão de post e a linha de metadados. Só vai para leitura.css. */` por `cartão de post e a linha de metadados. Importado pelo layout (leitura). */`.
2. `leitura.css`: apagar o bloco inteiro que começa em `/* Fora do protótipo: a seta aponta para cima e para a direita, e o texto fica mais baixo. */` e termina no `}` de `.post-cartao:hover .post-acao--externo .seta { ... }` (três regras de `.post-acao--externo`). No Next todo post tem página: não há cartão "no site atual".
3. `indice-do-blog.css`, comentário do topo: trocar `CSS (:target + :has), com as regras por categoria geradas no próprio parcial. */` por `CSS (:target + :has), com as regras por categoria geradas por regrasDoFiltro (src/site/leitura/dados.ts). */`.
4. `artigo.css`: trocar `/* Nota do fim da Política de Privacidade (o texto aponta para #cookies). */` por `/* Controle de cookies do fim da Política de Privacidade (o texto aponta para #cookies; o controle tem CSS próprio em preferencias-de-cookies.css). */`.

`leia-tambem.css` fica idêntico.

- [ ] **Step 4: Escrever `src/site/secoes/leitura/preferencias-de-cookies.css`**

```css
/* Privacidade · controle de cookies dentro do artigo (#cookies). O mesmo comportamento do
   bloco do site atual (CookiePreferences), no visual do site v2: interruptor de ponta reta. */
#cookies .cookies-lista {
  display: grid;
  gap: var(--e3);
  margin-top: var(--e4);
}
#cookies .cookie-linha {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--e3);
}
#cookies .cookie-rotulo {
  margin-top: 0;
  font-weight: 600;
  color: var(--marinho);
}
#cookies .cookie-descricao {
  margin-top: var(--e1);
  color: var(--texto-suave);
}
#cookies .cookie-interruptor {
  position: relative;
  flex: none;
  width: 44px;
  height: 24px;
  border: 1px solid var(--marinho);
  background: var(--branco);
  cursor: pointer;
  transition: background-color 240ms var(--ease-expo);
}
#cookies .cookie-interruptor span {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  background: var(--marinho);
  transition:
    transform 240ms var(--ease-expo),
    background-color 240ms var(--ease-expo);
}
#cookies .cookie-interruptor[aria-checked="true"] {
  background: var(--marinho);
}
#cookies .cookie-interruptor[aria-checked="true"] span {
  transform: translateX(20px);
  background: var(--branco);
}
#cookies .cookie-interruptor:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
#cookies .cookie-interruptor:focus-visible {
  outline: 2px solid var(--ceu);
  outline-offset: 2px;
}
#cookies .cookies-acoes {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--e3);
  margin-top: var(--e4);
  padding-top: var(--e3);
  border-top: 1px solid var(--lavanda);
}
#cookies .cookies-acoes .botao:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
#cookies .cookies-estado {
  margin-top: 0;
  color: var(--texto-suave);
}
```

- [ ] **Step 5: Escrever `src/site/leitura/mdx.tsx`**

```tsx
import { compileMDX } from 'next-mdx-remote/rsc'
import { isValidElement, type ReactElement, type ReactNode } from 'react'
import { img } from '@/../content/media'
import { ImageMedia } from '@/components/Media/ImageMedia'
import { idDoTitulo } from './dados'

/** Texto puro de um nó React (o título do MDX chega como string, mas pode trazer ênfase). */
export function textoDoNo(no: ReactNode): string {
  if (typeof no === 'string' || typeof no === 'number') return String(no)
  if (Array.isArray(no)) return no.map(textoDoNo).join('')
  if (isValidElement<{ children?: ReactNode }>(no)) return textoDoNo(no.props.children)
  return ''
}

/** `##` com o id que o índice "Neste texto" usa (idDoTitulo do mesmo texto). */
function TituloDoTexto({ children }: { children?: ReactNode }) {
  return <h2 id={idDoTitulo(textoDoNo(children))}>{children}</h2>
}

function SubtituloDoTexto({ children }: { children?: ReactNode }) {
  return <h3 id={idDoTitulo(textoDoNo(children))}>{children}</h3>
}

/**
 * `<PostImage />` do MDX no visual do site v2 (artigo.css, `.artigo-figura`). O `alt` vem de
 * `content/media.ts`, a fonte única, e não de prop (mesma decisão do PostImage do blog atual).
 * As props são o contrato público dos `.mdx`: os nomes não mudam.
 */
export function FiguraDoPost({ file, caption }: { file: string; caption?: string }) {
  return (
    <figure className="artigo-figura">
      <ImageMedia resource={img(file)} sizes="(min-width: 761px) 640px, 100vw" />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  )
}

type PropsVideo = {
  /** Nome do arquivo no bucket (precisa de `alt` em `content/media.ts`). */
  file: string
  poster: string
  caption?: string
  orientation?: 'vertical' | 'horizontal'
  /** Proporção real do arquivo (ex.: `'636 / 1080'`); tem precedência sobre `orientation`. */
  aspectRatio?: string
}

/**
 * `<PostVideo />` do MDX no visual do site v2. Mesmas decisões do PostVideo do blog atual:
 * `<video>` nativo do bucket (o `media-src` da CSP já libera), `preload="none"` com poster, e o
 * vertical estreito e centrado (`.artigo-figura--vertical`). As props são o contrato dos `.mdx`.
 */
export function VideoDoPost({ file, poster, caption, orientation = 'vertical', aspectRatio }: PropsVideo) {
  const video = img(file)
  const capa = img(poster)
  const vertical = orientation === 'vertical'
  return (
    <figure className={vertical ? 'artigo-figura artigo-figura--vertical' : 'artigo-figura'}>
      {/* biome-ignore lint/a11y/useMediaCaption: montagem com trilha, sem narração; o aria-label dá o nome acessível */}
      <video
        aria-label={video.alt}
        controls
        playsInline
        poster={capa.url}
        preload="none"
        style={{ aspectRatio: aspectRatio ?? (vertical ? '9 / 16' : '16 / 9') }}
      >
        <source src={video.url} type="video/mp4" />
        Seu navegador não reproduz este vídeo.
      </video>
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  )
}

/** O mapa do MDX do site v2: os nomes `PostImage` e `PostVideo` são os que os `.mdx` usam. */
export const COMPONENTES_DO_MDX = {
  h2: TituloDoTexto,
  h3: SubtituloDoTexto,
  PostImage: FiguraDoPost,
  PostVideo: VideoDoPost,
}

/**
 * Compila o MDX no servidor. Sem `catch` de propósito: o conteúdo é estático e a página é gerada
 * no build, então um `.mdx` quebrado derruba o build, em vez de ir ao ar como página vazia.
 */
export async function corpoDoMdx(fonte: string): Promise<ReactElement> {
  const { content } = await compileMDX({ source: fonte, components: COMPONENTES_DO_MDX })
  return content
}
```

- [ ] **Step 6: Escrever `CartaoDoPost.tsx`, `IndiceDoBlog.tsx` e `LeiaTambem.tsx`**

`src/site/secoes/leitura/CartaoDoPost.tsx`:

```tsx
import type { CartaoDePost } from '@/site/leitura/dados'

/**
 * Cartão de post (leitura.css): o link do título cobre o cartão inteiro, sem link dentro de
 * link. `nivel` segue a hierarquia da seção (h2 no índice, h3 no "Leia também").
 */
export function CartaoDoPost({ cartao, nivel }: { cartao: CartaoDePost; nivel: 'h2' | 'h3' }) {
  const Titulo = nivel
  return (
    <article className="post-cartao">
      <p className="post-meta">
        <span className="post-categoria">{cartao.categoria.titulo}</span>
        <span>{cartao.dataTexto}</span>
        <span>{cartao.minutos} min de leitura</span>
      </p>
      <Titulo className="post-cartao-titulo">
        <a href={cartao.href}>{cartao.titulo}</a>
      </Titulo>
      <p className="post-resumo">{cartao.resumo}</p>
      {/* TEXTO-NOVO: "Ler o texto" (protótipo) */}
      <p className="post-acao" aria-hidden="true">
        <span>Ler o texto</span>
        <svg className="seta" aria-hidden="true">
          <use href="#seta" />
        </svg>
      </p>
    </article>
  )
}
```

`src/site/secoes/leitura/IndiceDoBlog.tsx`:

```tsx
import './indice-do-blog.css'
import { ImageMedia } from '@/components/Media/ImageMedia'
import { type CartaoDePost, type FiltroDeCategoria, regrasDoFiltro } from '@/site/leitura/dados'
import type { Media } from '@/types/media'
import { CartaoDoPost } from './CartaoDoPost'

export type DadosDoIndice = {
  titulo: string
  texto: string
  destaque: CartaoDePost
  imagemDoDestaque?: Media
  demais: readonly CartaoDePost[]
  filtros: readonly FiltroDeCategoria[]
}

/** Blog · índice (protótipo, sections/leitura/01-blog.html): destaque com foto e os outros em duas colunas. */
export function IndiceDoBlog({ dados }: { dados: DadosDoIndice }) {
  const { titulo, texto, destaque, imagemDoDestaque, demais, filtros } = dados
  return (
    <section id="blog-indice" className="cena" data-tema="claro" aria-labelledby="blog-titulo">
      <div className="container">
        <header className="bi-topo">
          <h1 id="blog-titulo" className="bi-titulo titulo-display">
            {titulo}
          </h1>
          <p className="bi-intro lead">{texto}</p>
        </header>

        <span id="todos" className="bi-alvo" />
        {filtros.map((filtro) => (
          <span key={filtro.slug} id={`categoria-${filtro.slug}`} className="bi-alvo bi-alvo--categoria" />
        ))}
        {/* TEXTO-NOVO: "Categorias", "Todos" (protótipo) */}
        <nav className="bi-filtros" aria-label="Categorias">
          <a className="bi-filtro bi-filtro--todos" href="#todos">
            Todos <span className="num">{demais.length + 1}</span>
          </a>
          {filtros.map((filtro) => (
            <a key={filtro.slug} className="bi-filtro" href={`#categoria-${filtro.slug}`}>
              {filtro.titulo} <span className="num">{filtro.total}</span>
            </a>
          ))}
        </nav>

        <ol className="bi-lista">
          <li className="bi-item bi-item--destaque" data-categoria={destaque.categoria.slug}>
            {imagemDoDestaque ? (
              <figure className="bi-foto">
                <ImageMedia
                  resource={imagemDoDestaque}
                  priority
                  fetchPriority="high"
                  sizes="(min-width: 1310px) 742px, (min-width: 761px) 62vw, 100vw"
                />
              </figure>
            ) : null}
            <CartaoDoPost cartao={destaque} nivel="h2" />
          </li>
          {demais.map((cartao) => (
            <li key={cartao.slug} className="bi-item" data-categoria={cartao.categoria.slug}>
              <CartaoDoPost cartao={cartao} nivel="h2" />
            </li>
          ))}
        </ol>
      </div>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: regras geradas por nós dos slugs de content/blog/categories.ts ([a-z0-9-], testado); é o filtro sem JS */}
      <style dangerouslySetInnerHTML={{ __html: regrasDoFiltro(filtros) }} />
    </section>
  )
}
```

`src/site/secoes/leitura/LeiaTambem.tsx`:

```tsx
import './leia-tambem.css'
import type { CartaoDePost } from '@/site/leitura/dados'
import { CartaoDoPost } from './CartaoDoPost'

/** "Leia também": dois cartões no gelo, antes do pedido de proposta (protótipo, 03-leia-tambem). */
export function LeiaTambem({ cartoes, todos }: { cartoes: readonly CartaoDePost[]; todos: string }) {
  if (cartoes.length === 0) return null
  return (
    <section id="leia-tambem" className="cena" data-tema="gelo" aria-labelledby="leia-tambem-titulo">
      <div className="container">
        <div className="lt-topo">
          {/* TEXTO-NOVO: "Leia também", "Todos os textos" (protótipo) */}
          <h2 id="leia-tambem-titulo" className="lt-titulo">
            Leia também
          </h2>
          <a className="link-seta" href={todos}>
            <span>Todos os textos</span>
            <svg className="seta" aria-hidden="true">
              <use href="#seta" />
            </svg>
          </a>
        </div>
        <ul className="lt-lista">
          {cartoes.map((cartao) => (
            <li key={cartao.slug}>
              <CartaoDoPost cartao={cartao} nivel="h3" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
```

- [ ] **Step 7: Escrever `Artigo.tsx`**

`src/site/secoes/leitura/Artigo.tsx`:

```tsx
import './artigo.css'
import type { ReactElement, ReactNode } from 'react'
import { ImageMedia } from '@/components/Media/ImageMedia'
import { type ItemDoIndice, MINIMO_PARA_INDICE } from '@/site/leitura/dados'
import type { Media } from '@/types/media'

export type TopoDoArtigo =
  | { tipo: 'post'; categoria: string; dataTexto: string; minutos: number; voltar: string }
  | { tipo: 'documento'; atualizacao: string }

export type DadosDoArtigo = {
  titulo: string
  resumo?: string
  topo: TopoDoArtigo
  imagem?: Media
  indice: readonly ItemDoIndice[]
  emResumo: readonly string[]
  /** O MDX já compilado (corpoDoMdx). */
  corpo: ReactElement
  /** Depois do texto: o controle de cookies da Privacidade. */
  depoisDoCorpo?: ReactNode
}

function Topo({ topo }: { topo: TopoDoArtigo }) {
  if (topo.tipo === 'documento') return <p className="post-meta artigo-meta">{topo.atualizacao}</p>
  return (
    <>
      {/* TEXTO-NOVO: "Blog" (voltar), "min de leitura" (protótipo) */}
      <a className="artigo-voltar" href={topo.voltar}>
        <svg className="seta" aria-hidden="true">
          <use href="#seta" />
        </svg>
        <span>Blog</span>
      </a>
      <p className="post-meta artigo-meta">
        <span className="post-categoria">{topo.categoria}</span>
        <span>{topo.dataTexto}</span>
        <span>{topo.minutos} min de leitura</span>
      </p>
    </>
  )
}

/**
 * Modelo de artigo, o mesmo para posts, Privacidade e Termos (protótipo, 02-artigo): coluna de
 * 60 a 70 caracteres por linha, índice lateral fixo no desktop (no celular, no topo do texto) e
 * barra de progresso de 2 px sob o cabeçalho. O único movimento é a entrada do título, em CSS.
 */
export function Artigo({ dados }: { dados: DadosDoArtigo }) {
  const { titulo, resumo, topo, imagem, indice, emResumo, corpo, depoisDoCorpo } = dados
  return (
    <section id="artigo" className="cena artigo" data-tema="claro" aria-labelledby="artigo-titulo">
      <div className="artigo-progresso" aria-hidden="true">
        <span data-progresso="" />
      </div>
      <div className="container artigo-grade">
        <header className="artigo-topo">
          <Topo topo={topo} />
          <h1 id="artigo-titulo" className="artigo-titulo">
            {titulo}
          </h1>
          {resumo ? <p className="artigo-lead">{resumo}</p> : null}
        </header>

        {imagem ? (
          <figure className="artigo-capa">
            <ImageMedia resource={imagem} priority fetchPriority="high" sizes="(min-width: 1310px) 1200px, 100vw" />
          </figure>
        ) : null}

        {indice.length >= MINIMO_PARA_INDICE ? (
          <nav className="artigo-indice" data-indice="" aria-labelledby="artigo-indice-titulo">
            {/* TEXTO-NOVO: "Neste texto" (protótipo) */}
            <p id="artigo-indice-titulo" className="artigo-indice-titulo">
              Neste texto
            </p>
            <ol>
              {indice.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`}>{item.texto}</a>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        <div className="artigo-coluna">
          {emResumo.length > 0 ? (
            <aside className="artigo-resumo" aria-labelledby="artigo-resumo-titulo">
              <p id="artigo-resumo-titulo" className="artigo-resumo-titulo">
                Em resumo
              </p>
              <ul>
                {emResumo.map((ponto) => (
                  <li key={ponto}>{ponto}</li>
                ))}
              </ul>
            </aside>
          ) : null}
          <div className="artigo-corpo" data-corpo-leitura="">
            {corpo}
          </div>
          {depoisDoCorpo}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 8: Escrever `PreferenciasDeCookies.tsx`**

`src/site/secoes/leitura/PreferenciasDeCookies.tsx`:

```tsx
'use client'

import './preferencias-de-cookies.css'
import { useEffect, useState } from 'react'
import { useConsent } from '@/providers/ConsentProvider'

type IdDoCookie = 'necessarios' | 'analise' | 'marketing'
type ItemDeCookie = { id: IdDoCookie; rotulo: string; descricao: string; ligado: boolean; fixo: boolean }

function Interruptor({ item, aoMudar }: { item: ItemDeCookie; aoMudar: (valor: boolean) => void }) {
  const idDaDescricao = `cookie-${item.id}-descricao`
  return (
    <div className="cookie-linha">
      <div>
        <p className="cookie-rotulo">{item.rotulo}</p>
        <p id={idDaDescricao} className="cookie-descricao">
          {item.descricao}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        className="cookie-interruptor"
        aria-checked={item.ligado}
        aria-label={item.rotulo}
        aria-describedby={idDaDescricao}
        disabled={item.fixo}
        onClick={() => aoMudar(!item.ligado)}
      >
        <span aria-hidden="true" />
      </button>
    </div>
  )
}

/** Os quatro estados são distintos de propósito: com mudança pendente, dizer que nada mudou seria mentira. */
function mensagemDoEstado(estado: { pendente: boolean; salvo: boolean; decidido: boolean }): string {
  if (estado.pendente) return 'Você mudou algo — clique em "Salvar preferências" para aplicar.'
  if (estado.salvo) {
    return 'Preferências salvas. Elas valem a partir de agora e ficam guardadas neste navegador.'
  }
  if (estado.decidido) return 'Estas são as preferências que você já salvou neste navegador.'
  return 'Você ainda não alterou nada — estas são as configurações padrão do site.'
}

/**
 * Controle de cookies da Política de Privacidade, em `#cookies` (o texto da política aponta para
 * cá). Mesmo comportamento do CookiePreferencesBlock do site atual, com os mesmos textos:
 * - o estado inicial nasce do padrão e é realinhado quando o provider lê o cookie (no mount), para
 *   quem já escolheu não ver os interruptores errados e salvar por cima;
 * - "Salvar" só liga com mudança de verdade: salvar marca a decisão e dispara um `consent update`
 *   GLOBAL, e confirmar o padrão sem mexer concederia publicidade a um visitante da região onde o
 *   padrão regional é negar.
 */
export function PreferenciasDeCookies() {
  const { consent, decided, save } = useConsent()
  const [analise, setAnalise] = useState(consent.analytics)
  const [marketing, setMarketing] = useState(consent.marketing)
  const [salvo, setSalvo] = useState(false)

  useEffect(() => {
    setAnalise(consent.analytics)
    setMarketing(consent.marketing)
  }, [consent])

  const pendente = analise !== consent.analytics || marketing !== consent.marketing
  const itens: readonly ItemDeCookie[] = [
    {
      id: 'necessarios',
      rotulo: 'Cookies necessários',
      descricao: 'Sempre ativos — essenciais para o funcionamento do site.',
      ligado: true,
      fixo: true,
    },
    {
      id: 'analise',
      rotulo: 'Cookies de análise',
      descricao: 'Ajudam a entender como o site é usado, de forma agregada.',
      ligado: analise,
      fixo: false,
    },
    {
      id: 'marketing',
      rotulo: 'Cookies de marketing',
      descricao: 'Usados para personalizar comunicações e anúncios.',
      ligado: marketing,
      fixo: false,
    },
  ]
  const mudar = (id: IdDoCookie) => (valor: boolean) => {
    if (id === 'analise') setAnalise(valor)
    if (id === 'marketing') setMarketing(valor)
    setSalvo(false)
  }

  return (
    <section id="cookies" className="artigo-cookies" aria-labelledby="cookies-titulo">
      <h2 id="cookies-titulo">Suas preferências de cookies</h2>
      <p>
        Você pode desligar as categorias não essenciais a qualquer momento, e voltar aqui para mudar
        de ideia. A escolha fica guardada neste navegador por 180 dias.
      </p>
      <div className="cookies-lista">
        {itens.map((item) => (
          <Interruptor key={item.id} item={item} aoMudar={mudar(item.id)} />
        ))}
      </div>
      <div className="cookies-acoes">
        <button
          type="button"
          className="botao botao--pequeno"
          disabled={!pendente}
          onClick={() => {
            save({ analytics: analise, marketing })
            setSalvo(true)
          }}
        >
          Salvar preferências
        </button>
        <p className="cookies-estado" aria-live="polite">
          {mensagemDoEstado({ pendente, salvo, decidido: decided })}
        </p>
      </div>
    </section>
  )
}
```

- [ ] **Step 9: Rodar e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-leitura-secoes.int.spec.tsx tests/int/site-v2-identidade.int.spec.ts`
Expected: PASS em todos; o guarda de identidade da fase 1 varre os CSS e TSX novos sem violação (sem hex, sem raio, sem caixa-alta, sem termo vedado).

- [ ] **Step 10: Portões e commit**

```powershell
pnpm exec biome check --write src/site/leitura/mdx.tsx src/site/secoes/leitura tests/int/site-v2-leitura-secoes.int.spec.tsx
pnpm exec biome ci ./src ./tests ./scripts
pnpm exec tsc --noEmit
pnpm run check:server-actions
pnpm run test:int
pnpm build
git branch --show-current && git add src/site/leitura/mdx.tsx src/site/secoes/leitura tests/int/site-v2-leitura-secoes.int.spec.tsx && git commit -m "feat(site-v2): seções de leitura no visual do protótipo

Índice do blog com filtro por categoria sem JS, modelo de artigo com índice e
barra de progresso, Leia também, componentes do MDX sem Tailwind e o controle
real de cookies da Privacidade. CSS copiado do protótipo.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
git status --short
```

Expected: portões verdes; `git status --short` vazio.

---

## Tarefa 3.8: Páginas, layout leitura e as rotas da prévia

**Files:**
- Create: `src/site/layout/EsqueletoLeitura.tsx`
- Create: `src/site/paginas/leitura.tsx`
- Create: `src/app/(site)/(leitura)/layout.tsx`
- Create: `src/app/(site)/(leitura)/previa-v2/blog/page.tsx`, `src/app/(site)/(leitura)/previa-v2/blog/[slug]/page.tsx`, `src/app/(site)/(leitura)/previa-v2/privacidade/page.tsx`, `src/app/(site)/(leitura)/previa-v2/termos/page.tsx`
- Test: `tests/int/site-v2-leitura-paginas.int.spec.tsx`

**Interfaces:**
- Consumes: tudo da 3.5 a 3.7; `Cabecalho({ atual, destinoProposta })`, `IdNav`, `Rodape({ destinoProposta })`, `SimbolosSvg()` (fase 1); `SecaoProposta({ ufInicial? })` (fase 2); `previaLiberada()`, `ROBOTS_DA_PREVIA` (`src/site/previa.ts`); `getPageJsonLd({ page, path })`, `getPostJsonLd(post)` (`src/lib/seo.ts`); `getAllPosts`, `findPostBySlug`, `listRelatedPosts(categoria, excluir, limite)` (`src/lib/blog.ts`); `getLegalPage` (`content/lib/legal.ts`); `conteudo.comunidade.blog` (`src/site/conteudo/conteudo.ts`).
- Produces: `type PaginaDeLeitura = 'blog' | 'post' | 'privacidade' | 'termos'`; `EsqueletoLeitura({ pagina, atual, children })`; `PaginaDoBlog()`; `PaginaDoPost({ slug }): Promise<ReactElement>`; `PaginaDoDocumento({ slug }: { slug: DocumentoLegal }): Promise<ReactElement>`; as quatro rotas (`metadata`/`generateMetadata`, `generateStaticParams` e `dynamicParams = false` na de post).

- [ ] **Step 1: Escrever o teste**

`tests/int/site-v2-leitura-paginas.int.spec.tsx`:

```tsx
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { render } from '@testing-library/react'
import { isValidElement, type ReactElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PaginaBlogPrevia, { metadata as metadadosBlogPrevia } from '@/app/(site)/(leitura)/previa-v2/blog/page'
import PaginaPostPrevia, {
  dynamicParams,
  generateMetadata as metadadosPostPrevia,
  generateStaticParams as postsDaPrevia,
} from '@/app/(site)/(leitura)/previa-v2/blog/[slug]/page'
import PaginaPrivacidadePrevia, {
  metadata as metadadosPrivacidadePrevia,
} from '@/app/(site)/(leitura)/previa-v2/privacidade/page'
import PaginaTermosPrevia, { metadata as metadadosTermosPrevia } from '@/app/(site)/(leitura)/previa-v2/termos/page'
import { getAllPosts } from '@/lib/blog'
import { absoluteUrl, getPageJsonLd, getPostJsonLd } from '@/lib/seo'
import { ConsentProvider } from '@/providers/ConsentProvider'
import { entradaDe } from '@/site/inventario'
import { paginaDoConteudo } from '@/site/leitura/metadados'
import { semPrefixoDaLeitura } from '@/site/leitura/rotas'
import { PaginaDoBlog, PaginaDoDocumento, PaginaDoPost } from '@/site/paginas/leitura'
import { listarArquivos, procurarTermosVedados } from './helpers/identidade'

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))
vi.mock('@/app/(site)/_actions/proposta-duas-etapas', () => ({
  enviarEtapa1: vi.fn(),
  enviarEtapa2: vi.fn(),
  enviarPropostaCompleta: vi.fn(),
}))
vi.mock('@/components/forms/Turnstile', () => ({ Turnstile: () => null }))

afterEach(() => {
  vi.unstubAllEnvs()
})

function renderizar(no: ReactElement) {
  return render(<ConsentProvider>{no}</ConsentProvider>)
}

function jsonLd(): unknown {
  return JSON.parse(document.querySelector('script[type="application/ld+json"]')?.textContent ?? 'null')
}

/** Todo link interno do main cai numa página do inventário (os da prévia, pela URL real). */
function conferirLinks() {
  const hrefs = Array.from(document.querySelectorAll('main a[href^="/"]'), (a) => a.getAttribute('href') ?? '')
  expect(hrefs.length).toBeGreaterThan(0)
  for (const href of hrefs) {
    expect(entradaDe(semPrefixoDaLeitura(href).split('#')[0] || '/')?.tipo, href).toBe('pagina')
  }
}

/** Ids únicos no main e todo link do índice com alvo. */
function conferirIds() {
  const ids = Array.from(document.querySelectorAll('main [id]'), (elemento) => elemento.id)
  expect(new Set(ids).size).toBe(ids.length)
  for (const link of document.querySelectorAll('[data-indice] a')) {
    const alvo = (link.getAttribute('href') ?? '').slice(1)
    expect(document.getElementById(alvo), alvo).not.toBeNull()
  }
}

function conferirComum() {
  expect(document.querySelector('[data-cabecalho]')).not.toBeNull()
  expect(document.querySelector('footer[data-tema="marinho"]')).not.toBeNull()
  expect(document.querySelector('section#proposta form')).not.toBeNull()
  expect(document.body.innerHTML).not.toContain('wa.me')
  expect(procurarTermosVedados(document.body.textContent ?? '')).toEqual([])
  conferirLinks()
  conferirIds()
}

describe('índice do blog', () => {
  it('12 posts, o mais recente em destaque com foto, filtros e o JSON-LD do /blog atual', () => {
    renderizar(PaginaDoBlog())
    expect(document.querySelector('main')?.getAttribute('data-pagina')).toBe('blog')
    expect(document.querySelectorAll('.bi-item')).toHaveLength(12)
    const [maisRecente] = getAllPosts()
    expect(document.querySelector('.bi-item--destaque a')?.getAttribute('href')).toBe(
      `/previa-v2/blog/${maisRecente?.slug}`,
    )
    expect(document.querySelector('.bi-item--destaque img')).not.toBeNull()
    expect(document.querySelector('.bi-filtro--todos')?.textContent).toBe('Todos 12')
    expect(document.querySelectorAll('[aria-current="page"][data-pagina-link="blog"]').length).toBeGreaterThan(0)
    expect(jsonLd()).toEqual(getPageJsonLd({ page: paginaDoConteudo('blog'), path: 'blog' }))
    conferirComum()
  })
})

describe('posts', () => {
  it('os 12: título, índice com alvo, "Em resumo", Leia também e o BlogPosting de hoje', async () => {
    for (const post of getAllPosts()) {
      const { unmount } = renderizar(await PaginaDoPost({ slug: post.slug }))
      expect(document.querySelector('h1')?.textContent, post.slug).toBe(post.title)
      expect(document.querySelector('[data-corpo-leitura] p'), post.slug).not.toBeNull()
      expect(document.querySelectorAll('.artigo-resumo li'), post.slug).toHaveLength(post.keyTakeaways?.length ?? 0)
      const leiaTambem = Array.from(document.querySelectorAll('#leia-tambem a.link-seta, #leia-tambem h3 a'), (a) =>
        a.getAttribute('href'),
      )
      expect(leiaTambem, post.slug).toHaveLength(3)
      expect(leiaTambem, post.slug).not.toContain(`/previa-v2/blog/${post.slug}`)
      expect(jsonLd(), post.slug).toEqual(getPostJsonLd(post))
      conferirComum()
      unmount()
    }
  })

  it('o post com dois títulos fica sem índice; o do G20 traz as duas fotos e o vídeo', async () => {
    const curto = renderizar(await PaginaDoPost({ slug: 'cinco-sinais-trocar-administradora' }))
    expect(document.querySelector('nav[data-indice]')).toBeNull()
    curto.unmount()
    renderizar(await PaginaDoPost({ slug: 'g20-superlogica-next-2026' }))
    expect(document.querySelectorAll('.artigo-corpo figure.artigo-figura')).toHaveLength(3)
    expect(document.querySelector('.artigo-figura--vertical video')?.getAttribute('preload')).toBe('none')
  })

  it('slug desconhecido é 404', async () => {
    await expect(PaginaDoPost({ slug: 'nao-existe' })).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404')
  })
})

describe('documentos', () => {
  it('Privacidade: atualização, índice, o controle de cookies em #cookies e o JSON-LD de hoje', async () => {
    renderizar(await PaginaDoDocumento({ slug: 'privacidade' }))
    expect(document.querySelector('h1')?.textContent).toBe('Política de Privacidade')
    expect(document.querySelector('.artigo-meta')?.textContent).toContain('Última atualização')
    expect(document.querySelectorAll('#cookies [role="switch"]')).toHaveLength(3)
    expect(document.querySelector('a[href="#cookies"]')).not.toBeNull()
    expect(document.querySelector('.artigo-voltar')).toBeNull()
    expect(jsonLd()).toEqual(getPageJsonLd({ page: paginaDoConteudo('privacidade'), path: 'privacidade' }))
    conferirComum()
  })

  it('Termos: sem controle de cookies', async () => {
    renderizar(await PaginaDoDocumento({ slug: 'termos' }))
    expect(document.querySelector('h1')?.textContent).toBe('Termos de Uso')
    expect(document.getElementById('cookies')).toBeNull()
    conferirComum()
  })
})

describe('rotas da prévia', () => {
  const params = { params: Promise.resolve({ slug: 'g20-superlogica-next-2026' }) }

  it('em produção, as quatro respondem 404', async () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    expect(() => PaginaBlogPrevia()).toThrow('NEXT_HTTP_ERROR_FALLBACK;404')
    await expect(PaginaPostPrevia(params)).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404')
    expect(() => PaginaPrivacidadePrevia()).toThrow('NEXT_HTTP_ERROR_FALLBACK;404')
    expect(() => PaginaTermosPrevia()).toThrow('NEXT_HTTP_ERROR_FALLBACK;404')
  })

  it('nunca indexadas, com o canonical da URL real', async () => {
    const pares = [
      [metadadosBlogPrevia, 'blog'],
      [metadadosPrivacidadePrevia, 'privacidade'],
      [metadadosTermosPrevia, 'termos'],
      [await metadadosPostPrevia(params), 'blog/g20-superlogica-next-2026'],
    ] as const
    for (const [metadados, caminho] of pares) {
      expect(metadados.robots, caminho).toEqual({ index: false, follow: false })
      expect(metadados.alternates?.canonical, caminho).toBe(absoluteUrl(caminho))
    }
  })

  it('a rota de post gera os 12 slugs e nada além', () => {
    expect(dynamicParams).toBe(false)
    expect(postsDaPrevia().map((p) => p.slug).sort()).toEqual(getAllPosts().map((p) => p.slug).sort())
  })

  it('fora de produção, cada rota entrega o corpo certo', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    expect(isValidElement(PaginaBlogPrevia()) && PaginaBlogPrevia().type).toBe(PaginaDoBlog)
    const post = await PaginaPostPrevia(params)
    expect(isValidElement<{ slug: string }>(post) && post.props.slug).toBe('g20-superlogica-next-2026')
    const privacidade = PaginaPrivacidadePrevia()
    expect(isValidElement<{ slug: string }>(privacidade) && privacidade.props.slug).toBe('privacidade')
    expect(PaginaTermosPrevia().type).toBe(PaginaDoDocumento)
  })
})

describe('pacote leitura sem JS de cena (spec 3.1)', () => {
  it('nada da leitura importa Lenis, GSAP, runner, cenas ou a montagem do core', () => {
    const raiz = process.cwd()
    const arquivos = [
      ...listarArquivos(path.join(raiz, 'src', 'site', 'leitura'), ['.ts', '.tsx']),
      ...listarArquivos(path.join(raiz, 'src', 'site', 'secoes', 'leitura'), ['.ts', '.tsx']),
      ...listarArquivos(path.join(raiz, 'src', 'app', '(site)', '(leitura)'), ['.ts', '.tsx']),
      path.join(raiz, 'src', 'site', 'paginas', 'leitura.tsx'),
      path.join(raiz, 'src', 'site', 'layout', 'EsqueletoLeitura.tsx'),
    ]
    const proibido = /from\s+['"](?:lenis|gsap|@gsap\/react|@\/site\/runner\/[^'"]*|@\/site\/cenas\/[^'"]*|@\/site\/core\/montagem)['"]/
    const achados = arquivos.filter((arquivo) =>
      proibido.test(readFileSync(arquivo, 'utf8').replace(/\r\n?/g, '\n')),
    )
    expect(arquivos.length).toBeGreaterThanOrEqual(12)
    expect(achados).toEqual([])
  })

  it('o layout leitura importa o CSS comum e não o do Lenis', () => {
    const layout = readFileSync(path.join(process.cwd(), 'src', 'app', '(site)', '(leitura)', 'layout.tsx'), 'utf8')
    expect(layout).toContain("'@/site/secoes/leitura/leitura.css'")
    expect(layout).not.toContain('lenis')
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-leitura-paginas.int.spec.tsx`
Expected: FAIL na coleta com `Failed to resolve import "@/app/(site)/(leitura)/previa-v2/blog/page"`.

- [ ] **Step 3: Escrever `src/site/layout/EsqueletoLeitura.tsx`**

```tsx
import type React from 'react'
import { LigarLeitura } from '@/site/leitura/LigarLeitura'
import { Cabecalho, type IdNav } from './Cabecalho'
import { Rodape } from './Rodape'
import { SimbolosSvg } from './SimbolosSvg'

export type PaginaDeLeitura = 'blog' | 'post' | 'privacidade' | 'termos'

type PropsEsqueleto = { pagina: PaginaDeLeitura; atual?: IdNav; children: React.ReactNode }

/**
 * Esqueleto do pacote leitura: o mesmo cabeçalho e rodapé do pacote app, sem runner de cenas e
 * sem Lenis. Toda página de leitura tem o pedido de proposta (#proposta) no fim, como no protótipo.
 */
export function EsqueletoLeitura({ pagina, atual, children }: PropsEsqueleto) {
  return (
    <>
      <SimbolosSvg />
      <a className="pular" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Cabecalho atual={atual} destinoProposta="#proposta" />
      <main id="conteudo" data-pagina={pagina}>
        {children}
      </main>
      <Rodape destinoProposta="#proposta" />
      <LigarLeitura />
    </>
  )
}
```

- [ ] **Step 4: Escrever `src/site/paginas/leitura.tsx`**

```tsx
import { notFound } from 'next/navigation'
import { getLegalPage } from '@/../content/lib/legal'
import { findPostBySlug, getAllPosts, listRelatedPosts } from '@/lib/blog'
import { getPageJsonLd, getPostJsonLd } from '@/lib/seo'
import { conteudo } from '@/site/conteudo/conteudo'
import { EsqueletoLeitura } from '@/site/layout/EsqueletoLeitura'
import { cartaoDoPost, filtrosDasCategorias, indiceDoTexto } from '@/site/leitura/dados'
import { corpoDoMdx } from '@/site/leitura/mdx'
import { type DocumentoLegal, paginaDoConteudo } from '@/site/leitura/metadados'
import { caminhoDeLeitura } from '@/site/leitura/rotas'
import { Artigo, type DadosDoArtigo } from '@/site/secoes/leitura/Artigo'
import { IndiceDoBlog } from '@/site/secoes/leitura/IndiceDoBlog'
import { LeiaTambem } from '@/site/secoes/leitura/LeiaTambem'
import { PreferenciasDeCookies } from '@/site/secoes/leitura/PreferenciasDeCookies'
import { SecaoProposta } from '@/site/secoes/proposta/SecaoProposta'

/*
 * Corpo das páginas de leitura. As rotas da prévia (src/app/(site)/(leitura)/previa-v2/...) só
 * decidem prévia, metadata e params; na virada 1, as rotas reais usam estes mesmos corpos.
 */

const LEIA_TAMBEM = 2

function JsonLd({ dados }: { dados: Record<string, unknown> | null }) {
  if (!dados) return null
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD serializado por nós, do conteúdo estático
      dangerouslySetInnerHTML={{ __html: JSON.stringify(dados) }}
    />
  )
}

/** Índice do blog: o post mais recente em destaque, com foto; os outros em duas colunas. */
export function PaginaDoBlog() {
  const posts = getAllPosts()
  const [destaque, ...demais] = posts
  if (!destaque) throw new Error('[leitura] O blog não tem nenhum post.')
  const { titulo, texto } = conteudo.comunidade.blog
  return (
    <EsqueletoLeitura pagina="blog" atual="blog">
      <JsonLd dados={getPageJsonLd({ page: paginaDoConteudo('blog'), path: 'blog' })} />
      <IndiceDoBlog
        dados={{
          titulo,
          texto,
          destaque: cartaoDoPost(destaque),
          imagemDoDestaque: destaque.heroImage,
          demais: demais.map(cartaoDoPost),
          filtros: filtrosDasCategorias(posts),
        }}
      />
      <SecaoProposta />
    </EsqueletoLeitura>
  )
}

/** Um post: o artigo, "Leia também" e o pedido de proposta. Slug desconhecido é 404. */
export async function PaginaDoPost({ slug }: { slug: string }) {
  const post = findPostBySlug(slug)
  if (!post) notFound()
  const cartao = cartaoDoPost(post)
  const dados: DadosDoArtigo = {
    titulo: post.title,
    resumo: post.excerpt || undefined,
    topo: {
      tipo: 'post',
      categoria: cartao.categoria.titulo,
      dataTexto: cartao.dataTexto,
      minutos: cartao.minutos,
      voltar: caminhoDeLeitura('/blog'),
    },
    imagem: post.heroImage,
    indice: indiceDoTexto(post.body),
    emResumo: post.keyTakeaways ?? [],
    corpo: await corpoDoMdx(post.body),
  }
  const leiaTambem = listRelatedPosts(post.category, post.slug, LEIA_TAMBEM).map(cartaoDoPost)
  return (
    <EsqueletoLeitura pagina="post" atual="blog">
      <JsonLd dados={getPostJsonLd(post)} />
      <Artigo dados={dados} />
      <LeiaTambem cartoes={leiaTambem} todos={caminhoDeLeitura('/blog')} />
      <SecaoProposta />
    </EsqueletoLeitura>
  )
}

/** Privacidade e Termos: o mesmo artigo, com a data de atualização; a Privacidade tem os cookies. */
export async function PaginaDoDocumento({ slug }: { slug: DocumentoLegal }) {
  const documento = getLegalPage(slug)
  const dados: DadosDoArtigo = {
    titulo: documento.title,
    topo: { tipo: 'documento', atualizacao: documento.updatedText },
    indice: indiceDoTexto(documento.body),
    emResumo: [],
    corpo: await corpoDoMdx(documento.body),
    depoisDoCorpo: slug === 'privacidade' ? <PreferenciasDeCookies /> : null,
  }
  return (
    <EsqueletoLeitura pagina={slug}>
      <JsonLd dados={getPageJsonLd({ page: paginaDoConteudo(slug), path: slug })} />
      <Artigo dados={dados} />
      <SecaoProposta />
    </EsqueletoLeitura>
  )
}
```

- [ ] **Step 5: Escrever o layout e as quatro rotas**

`src/app/(site)/(leitura)/layout.tsx`:

```tsx
import type React from 'react'
import '@/site/secoes/leitura/leitura.css'

/**
 * Pacote leitura (spec 3.1): blog, posts, Privacidade e Termos. Rolagem nativa, sem Lenis nem
 * runner de cenas; o único JS é o de LigarLeitura. O resto vem do layout raiz (site).
 */
export default function LayoutLeitura({ children }: { children: React.ReactNode }) {
  return children
}
```

`src/app/(site)/(leitura)/previa-v2/blog/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { metadadosDaPagina } from '@/site/leitura/metadados'
import { PaginaDoBlog } from '@/site/paginas/leitura'
import { previaLiberada, ROBOTS_DA_PREVIA } from '@/site/previa'

/** O <head> do /blog de hoje (mesma função); só a prévia ganha noindex. */
export const metadata: Metadata = { ...metadadosDaPagina('blog'), robots: ROBOTS_DA_PREVIA }

/** Índice do blog no visual de leitura, na prévia. 404 em produção; vai para /blog na virada 1. */
export default function Pagina() {
  if (!previaLiberada()) notFound()
  return <PaginaDoBlog />
}
```

`src/app/(site)/(leitura)/previa-v2/blog/[slug]/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllPosts } from '@/lib/blog'
import { metadadosDoPost } from '@/site/leitura/metadados'
import { PaginaDoPost } from '@/site/paginas/leitura'
import { previaLiberada, ROBOTS_DA_PREVIA } from '@/site/previa'

type Props = { params: Promise<{ slug: string }> }

/** Um caminho por post; slug fora da lista é 404 sem renderizar nada. */
export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }))
}
export const dynamicParams = false

/** O <head> do /blog/<slug> de hoje (mesma função); só a prévia ganha noindex. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return { ...metadadosDoPost(slug), robots: ROBOTS_DA_PREVIA }
}

/** Post no visual de leitura, na prévia. 404 em produção; vai para /blog/<slug> na virada 1. */
export default async function Pagina({ params }: Props) {
  if (!previaLiberada()) notFound()
  const { slug } = await params
  return <PaginaDoPost slug={slug} />
}
```

`src/app/(site)/(leitura)/previa-v2/privacidade/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { metadadosDaPagina } from '@/site/leitura/metadados'
import { PaginaDoDocumento } from '@/site/paginas/leitura'
import { previaLiberada, ROBOTS_DA_PREVIA } from '@/site/previa'

export const metadata: Metadata = { ...metadadosDaPagina('privacidade'), robots: ROBOTS_DA_PREVIA }

/** Política de Privacidade no visual de leitura, na prévia. 404 em produção. */
export default function Pagina() {
  if (!previaLiberada()) notFound()
  return <PaginaDoDocumento slug="privacidade" />
}
```

`src/app/(site)/(leitura)/previa-v2/termos/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { metadadosDaPagina } from '@/site/leitura/metadados'
import { PaginaDoDocumento } from '@/site/paginas/leitura'
import { previaLiberada, ROBOTS_DA_PREVIA } from '@/site/previa'

export const metadata: Metadata = { ...metadadosDaPagina('termos'), robots: ROBOTS_DA_PREVIA }

/** Termos de Uso no visual de leitura, na prévia. 404 em produção. */
export default function Pagina() {
  if (!previaLiberada()) notFound()
  return <PaginaDoDocumento slug="termos" />
}
```

- [ ] **Step 6: Rodar e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-leitura-paginas.int.spec.tsx tests/int/site-v2-identidade.int.spec.ts tests/int/site-v2-previa.int.spec.tsx`
Expected: PASS em todos.

- [ ] **Step 7: Portões, o build lista as rotas e commit**

```powershell
pnpm exec biome check --write src/site/layout/EsqueletoLeitura.tsx src/site/paginas "src/app/(site)/(leitura)" tests/int/site-v2-leitura-paginas.int.spec.tsx
pnpm exec biome ci ./src ./tests ./scripts
pnpm exec tsc --noEmit
pnpm run check:server-actions
pnpm run test:int
pnpm build
```

Expected: portões verdes; a saída do `pnpm build` lista `/previa-v2`, `/previa-v2/blog`, `/previa-v2/blog/[slug]` (com os 12 caminhos), `/previa-v2/privacidade` e `/previa-v2/termos` junto das rotas de hoje (`/blog/[slug]`, `/[[...slug]]`). Um erro de "rotas em conflito" aqui contradiz a documentação conferida (Global Constraints): parar e reportar com a mensagem inteira. Depois:

```powershell
git branch --show-current && git add src/site/layout/EsqueletoLeitura.tsx src/site/paginas/leitura.tsx "src/app/(site)/(leitura)" tests/int/site-v2-leitura-paginas.int.spec.tsx && git commit -m "feat(site-v2): blog, posts, privacidade e termos na prévia

Layout leitura e as quatro páginas em /previa-v2 (404 em produção, noindex,
canonical da URL real). O blog atual continua servindo as URLs reais; a virada
1 leva estes corpos para lá.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
git status --short
```

Expected: `git status --short` vazio.

---

## Tarefa 3.9: Scripts de verificação: `<head>` por URL e varredura de leitura

**Files:**
- Create: `scripts/site-v2-comparar-metadados.mjs`
- Create: `scripts/site-v2-leitura.mjs`
- Test: `tests/int/site-v2-comparar-metadados.int.spec.ts`

**Interfaces:**
- Consumes: as rotas da 3.8 servidas por `next start`; o protótipo servido por `serve.mjs` (só na 3.10).
- Produces: `lerCabeca(html: string): Record<string, string | null>` e `destinoNoDepois(caminho: string): string`, exportados de `scripts/site-v2-comparar-metadados.mjs`; o CLI `node scripts/site-v2-comparar-metadados.mjs [--antes <url>] [--depois <url>] [--saida <arquivo.json>]` (código 1 com diferença não explicada); o CLI `node scripts/site-v2-leitura.mjs --saida <pasta> [--base <url>] [--navegador chromium|firefox] [--largura 1440|390]` (código 1 com qualquer problema).

- [ ] **Step 1: Escrever o teste do leitor de `<head>`**

`tests/int/site-v2-comparar-metadados.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { destinoNoDepois, lerCabeca } from '../../scripts/site-v2-comparar-metadados.mjs'

const HTML = [
  '<!DOCTYPE html><html><head>',
  '<title>Assembleia &amp; lei</title>',
  '<meta name="description" content="Quórum &quot;online&quot;"/>',
  '<link rel="canonical" href="https://www.semog.com.br/blog/x"/>',
  '<meta property="og:title" content="Assembleia &amp; lei"/>',
  '<meta property="og:image" content="https://www.semog.com.br/blog/x/opengraph-image"/>',
  '<meta property="og:image:width" content="1200"/>',
  '</head><body>',
  '<svg><title>Ícone</title></svg>',
  '<script type="application/ld+json">{"b":1,"a":{"d":2,"c":3}}</script>',
  '<script type="application/ld+json">{"z":true}</script>',
  '</body></html>',
].join('\n')

describe('leitor de <head> do script de comparação', () => {
  it('lê title, description, canonical e og, decodificando entidades', () => {
    const cabeca = lerCabeca(HTML)
    expect(cabeca.title).toBe('Assembleia & lei')
    expect(cabeca.description).toBe('Quórum "online"')
    expect(cabeca.canonical).toBe('https://www.semog.com.br/blog/x')
    expect(cabeca['og:title']).toBe('Assembleia & lei')
    expect(cabeca['og:image']).toBe('https://www.semog.com.br/blog/x/opengraph-image')
    expect(cabeca['og:description']).toBeNull()
  })

  it('o JSON-LD é comparável: todos os blocos, com as chaves em ordem', () => {
    const invertido = HTML.replace('{"b":1,"a":{"d":2,"c":3}}', '{"a":{"c":3,"d":2},"b":1}')
    expect(lerCabeca(invertido).jsonld).toBe(lerCabeca(HTML).jsonld)
    expect(lerCabeca(HTML).jsonld).toBe('[{"a":{"c":3,"d":2},"b":1},{"z":true}]')
  })

  it('página sem nada vira campos nulos, não erro', () => {
    expect(lerCabeca('')).toMatchObject({ title: null, canonical: null, jsonld: '[]' })
  })

  it('as páginas de leitura são comparadas com a prévia; o resto, na mesma URL', () => {
    expect(destinoNoDepois('/blog')).toBe('/previa-v2/blog')
    expect(destinoNoDepois('/blog/g20-superlogica-next-2026')).toBe('/previa-v2/blog/g20-superlogica-next-2026')
    expect(destinoNoDepois('/privacidade')).toBe('/previa-v2/privacidade')
    expect(destinoNoDepois('/termos')).toBe('/previa-v2/termos')
    expect(destinoNoDepois('/semog')).toBe('/semog')
    expect(destinoNoDepois('/')).toBe('/')
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-comparar-metadados.int.spec.ts`
Expected: FAIL na coleta com `Failed to resolve import "../../scripts/site-v2-comparar-metadados.mjs"`.

- [ ] **Step 3: Escrever `scripts/site-v2-comparar-metadados.mjs`**

```js
/* Comparação do <head> por URL, antes e depois (spec 6; fase 3 do site v2).
   "Antes" é o site no ar; "depois", o build local da feat/site-v2. A lista de URLs sai do
   sitemap.xml do "antes"; as páginas de leitura são comparadas com a prévia (/previa-v2/...),
   que é a página que vai para a URL real na virada 1.
   Compara status, title, description, canonical, og:title, og:description, og:url, og:type,
   og:image e o JSON-LD (todos os blocos, chaves em ordem), e o conjunto de URLs dos dois
   sitemaps. Diferença fora de DIFERENCAS_EXPLICADAS, ou explicada que não aconteceu, sai com
   código 1.
   Uso: node scripts/site-v2-comparar-metadados.mjs [--antes https://www.semog.com.br]
        [--depois http://localhost:3100] [--saida relatorio.json] */
import { writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const PREFIXO_DA_LEITURA = '/previa-v2'
const LEITURA = /^\/(?:blog(?:\/[a-z0-9-]+)?|privacidade|termos)$/
const CAMPOS = [
  'status',
  'title',
  'description',
  'canonical',
  'og:title',
  'og:description',
  'og:url',
  'og:type',
  'og:image',
  'jsonld',
]

/** Diferenças esperadas desta fase, por URL e campo, com o motivo (texto reescrito de propósito). */
const DIFERENCAS_EXPLICADAS = {
  '/blog/assembleia-virtual-validade-juridica': {
    motivo: 'título e meta.title reescritos sem o termo vedado (spec 6)',
    campos: ['title', 'og:title', 'jsonld'],
  },
  '/blog/g20-superlogica-next-2026': {
    motivo: 'texto do protótipo: "mais de 3.500 administradoras" e Ranking Top 200 (spec 2)',
    campos: ['title', 'og:title', 'jsonld'],
  },
}

const ENTIDADES = {
  '&amp;': '&',
  '&quot;': '"',
  '&#x27;': "'",
  '&#39;': "'",
  '&lt;': '<',
  '&gt;': '>',
}

function decodificar(texto) {
  return texto.replace(/&(?:amp|quot|lt|gt|#x27|#39);/g, (entidade) => ENTIDADES[entidade])
}

function atributos(tag) {
  const lidos = {}
  for (const [, nome, valor] of tag.matchAll(/([a-zA-Z:-]+)="([^"]*)"/g)) {
    lidos[nome] = decodificar(valor)
  }
  return lidos
}

function ordenar(valor) {
  if (Array.isArray(valor)) return valor.map(ordenar)
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(
      Object.keys(valor)
        .sort()
        .map((chave) => [chave, ordenar(valor[chave])]),
    )
  }
  return valor
}

/**
 * Campos do <head> que o Google lê. Procura no <head> (um <title> de SVG no corpo não conta) e,
 * sem <head>, no HTML inteiro. O JSON-LD é lido do documento todo: as páginas o põem no corpo.
 */
export function lerCabeca(html) {
  const cabeca = /<head[^>]*>([\s\S]*?)<\/head>/.exec(html)?.[1] ?? html
  const metas = [...cabeca.matchAll(/<meta\s[^>]*>/g)].map((achado) => atributos(achado[0]))
  const meta = (chave, nome) => metas.find((attrs) => attrs[chave] === nome)?.content ?? null
  const links = [...cabeca.matchAll(/<link\s[^>]*>/g)].map((achado) => atributos(achado[0]))
  const titulo = /<title>([\s\S]*?)<\/title>/.exec(cabeca)?.[1]
  const blocos = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  return {
    title: titulo === undefined ? null : decodificar(titulo),
    description: meta('name', 'description'),
    canonical: links.find((attrs) => attrs.rel === 'canonical')?.href ?? null,
    'og:title': meta('property', 'og:title'),
    'og:description': meta('property', 'og:description'),
    'og:url': meta('property', 'og:url'),
    'og:type': meta('property', 'og:type'),
    'og:image': meta('property', 'og:image'),
    jsonld: JSON.stringify(blocos.map((achado) => ordenar(JSON.parse(achado[1])))),
  }
}

/** No build local, a página de leitura que vai para a URL real é a da prévia. */
export function destinoNoDepois(caminho) {
  return LEITURA.test(caminho) ? `${PREFIXO_DA_LEITURA}${caminho}` : caminho
}

function lerArgs(argv) {
  const args = { antes: 'https://www.semog.com.br', depois: 'http://localhost:3100', saida: null }
  const fila = [...argv]
  while (fila.length) {
    const opcao = fila.shift()
    const valor = fila.shift()
    if (valor === undefined) throw new Error(`Opção sem valor: ${opcao}`)
    if (opcao === '--antes') args.antes = valor.replace(/\/+$/, '')
    else if (opcao === '--depois') args.depois = valor.replace(/\/+$/, '')
    else if (opcao === '--saida') args.saida = valor
    else throw new Error(`Opção desconhecida: ${opcao}`)
  }
  return args
}

async function baixar(url) {
  const resposta = await fetch(url, {
    redirect: 'manual',
    headers: { 'user-agent': 'site-v2-comparar-metadados' },
    signal: AbortSignal.timeout(30_000),
  })
  return { status: resposta.status, html: resposta.status === 200 ? await resposta.text() : '' }
}

function caminhosDoSitemap(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((achado) => new URL(achado[1]).pathname)
}

async function compararSitemaps(args, problemas) {
  const [antes, depois] = await Promise.all([
    baixar(`${args.antes}/sitemap.xml`),
    baixar(`${args.depois}/sitemap.xml`),
  ])
  if (antes.status !== 200 || depois.status !== 200) {
    throw new Error(`sitemap.xml respondeu ${antes.status} (antes) e ${depois.status} (depois)`)
  }
  const deAntes = caminhosDoSitemap(antes.html)
  const deDepois = caminhosDoSitemap(depois.html)
  const somem = deAntes.filter((caminho) => !deDepois.includes(caminho))
  const aparecem = deDepois.filter((caminho) => !deAntes.includes(caminho))
  if (somem.length) problemas.push(`sitemap: some(m) ${somem.join(', ')}`)
  if (aparecem.length) problemas.push(`sitemap: aparece(m) ${aparecem.join(', ')}`)
  return deAntes
}

async function compararUrl(args, caminho) {
  const destino = destinoNoDepois(caminho)
  const [antes, depois] = await Promise.all([
    baixar(`${args.antes}${caminho}`),
    baixar(`${args.depois}${destino}`),
  ])
  const cabecaAntes = { status: String(antes.status), ...lerCabeca(antes.html) }
  const cabecaDepois = { status: String(depois.status), ...lerCabeca(depois.html) }
  return CAMPOS.filter((campo) => cabecaAntes[campo] !== cabecaDepois[campo]).map((campo) => ({
    caminho,
    destino,
    campo,
    antes: cabecaAntes[campo],
    depois: cabecaDepois[campo],
    explicada: DIFERENCAS_EXPLICADAS[caminho]?.campos.includes(campo)
      ? DIFERENCAS_EXPLICADAS[caminho].motivo
      : null,
  }))
}

async function main() {
  const args = lerArgs(process.argv.slice(2))
  const problemas = []
  const caminhos = await compararSitemaps(args, problemas)
  const diferencas = []
  for (const caminho of caminhos) diferencas.push(...(await compararUrl(args, caminho)))
  for (const d of diferencas) {
    const marca = d.explicada ? `explicada (${d.explicada})` : 'NÃO EXPLICADA'
    console.log(`${d.caminho} → ${d.destino} · ${d.campo} · ${marca}`)
    console.log(`  antes:  ${d.antes}`)
    console.log(`  depois: ${d.depois}`)
    if (!d.explicada) problemas.push(`${d.caminho}: ${d.campo} difere`)
  }
  for (const [caminho, { campos }] of Object.entries(DIFERENCAS_EXPLICADAS)) {
    for (const campo of campos) {
      if (!diferencas.some((d) => d.caminho === caminho && d.campo === campo)) {
        problemas.push(`${caminho}: ${campo} estava na lista de explicadas e não mudou`)
      }
    }
  }
  if (args.saida) {
    writeFileSync(args.saida, JSON.stringify({ caminhos, diferencas, problemas }, null, 2))
  }
  console.log(`\n${caminhos.length} URLs comparadas, ${diferencas.length} diferença(s).`)
  if (problemas.length) {
    console.error(`${problemas.length} problema(s):\n  ${problemas.join('\n  ')}`)
    process.exit(1)
  }
  console.log('Sem diferença não explicada.')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((erro) => {
    console.error(erro?.stack ?? String(erro))
    process.exit(1)
  })
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-comparar-metadados.int.spec.ts`
Expected: PASS nos quatro. Se o `tsc --noEmit` reclamar do import de `.mjs` sem tipos no teste, criar `scripts/site-v2-comparar-metadados.d.mts` com `export function lerCabeca(html: string): Record<string, string | null>` e `export function destinoNoDepois(caminho: string): string` (só declaração, sem `any`).

- [ ] **Step 5: Escrever `scripts/site-v2-leitura.mjs`**

Porta do `design-explorations/site-v2-prototipo/scripts/leitura-varredura.mjs`, contra o servidor do Next:

```js
/* Varredura das páginas de leitura do site v2 na prévia (porta de leitura-varredura.mjs do
   protótipo), contra um servidor já de pé. Para o índice do blog, os posts, Privacidade e
   Termos, em Chromium e Firefox, 1440 e 390:
   - print da página inteira em <saida>/<navegador>/<página>-<largura>.png;
   - erro de console, de página ou de rede, resposta diferente de 200, scroll horizontal;
   - telas vazias (cada passo de uma tela precisa ter texto, foto ou campo visível);
   - nos artigos: corpo (px), entrelinha, caracteres por linha (mediana) e a barra de 0 a 1;
   - no índice: o filtro "Finanças" deixa só os 3 de Finanças, e "Todos" volta aos 12;
   - links da leitura (cartões, voltar, Leia também, índice e corpo): âncora com alvo e link
     interno respondendo 200;
   - sem JavaScript: título e texto no HTML, barra de progresso escondida.
   O cabeçalho e o rodapé (fase 1) ficam fora da conferência de links: /tecnologia só existe na
   fase 4.
   Uso: node scripts/site-v2-leitura.mjs --saida <pasta> [--base http://localhost:3100]
        [--navegador chromium|firefox] [--largura 1440|390]
   Sai com código 1 se algo falhar. */
import { mkdirSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { chromium, firefox } from '@playwright/test'

const PREFIXO = '/previa-v2'
const ALTURAS = { 1440: 900, 390: 844 }
const NAVEGADORES = { chromium, firefox }
const ESPERA_MS = 400

function lerArgs(argv) {
  const args = {
    base: 'http://localhost:3100',
    saida: null,
    navegadores: ['chromium', 'firefox'],
    larguras: [1440, 390],
  }
  const fila = [...argv]
  while (fila.length) {
    const opcao = fila.shift()
    const valor = fila.shift()
    if (valor === undefined) throw new Error(`Opção sem valor: ${opcao}`)
    if (opcao === '--base') args.base = valor.replace(/\/+$/, '')
    else if (opcao === '--saida') args.saida = valor
    else if (opcao === '--navegador') args.navegadores = [valor]
    else if (opcao === '--largura') args.larguras = [Number(valor)]
    else throw new Error(`Opção desconhecida: ${opcao}`)
  }
  if (!args.saida) throw new Error('Obrigatório: --saida <pasta>.')
  if (!args.navegadores.every((nome) => nome in NAVEGADORES)) {
    throw new Error('--navegador deve ser chromium ou firefox.')
  }
  if (!args.larguras.every((largura) => largura in ALTURAS)) {
    throw new Error('--largura deve ser 1440 ou 390.')
  }
  return args
}

function paginasDeLeitura() {
  const posts = readdirSync(path.join(process.cwd(), 'content', 'blog'))
    .filter((nome) => nome.endsWith('.mdx'))
    .sort()
    .map((nome) => `/blog/${nome.slice(0, -'.mdx'.length)}`)
  return ['/blog', ...posts, '/privacidade', '/termos']
}

function ouvirErros(pagina) {
  const erros = []
  pagina.on('console', (msg) => msg.type() === 'error' && erros.push(`console: ${msg.text()}`))
  pagina.on('pageerror', (erro) => erros.push(`página: ${erro.message}`))
  pagina.on('requestfailed', (req) =>
    erros.push(`requisição: ${req.url()} (${req.failure()?.errorText ?? '?'})`),
  )
  return erros
}

function telasVazias(pagina) {
  return pagina.evaluate(async (espera) => {
    const cab = document.querySelector('[data-cabecalho]')?.getBoundingClientRect().height ?? 0
    const alvos = Array.from(
      document.querySelectorAll('main :is(p, h1, h2, h3, li, img, video, input, select, a)'),
    )
    const vazias = []
    const altura = document.documentElement.scrollHeight
    for (let y = 0; y < altura - 10; y += window.innerHeight) {
      window.scrollTo({ top: y, behavior: 'instant' })
      await new Promise((resolver) => setTimeout(resolver, espera))
      const algum = alvos.some((el) => {
        const r = el.getBoundingClientRect()
        const estilo = getComputedStyle(el)
        return (
          r.bottom > cab + 20 &&
          r.top < window.innerHeight - 20 &&
          r.width > 0 &&
          r.height > 0 &&
          estilo.visibility !== 'hidden' &&
          Number(estilo.opacity) > 0.05
        )
      })
      const noRodape =
        (document.querySelector('.rodape')?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY) <
        window.innerHeight * 0.5
      if (!algum && !noRodape) vazias.push(y)
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
    return vazias
  }, ESPERA_MS)
}

function medirLinhas(pagina) {
  return pagina.evaluate(() => {
    const corpo = document.querySelector('[data-corpo-leitura]')
    if (!corpo) return null
    const medidas = []
    // Conta em que linha cada caractere caiu; vale só a linha cheia (a última fica de fora).
    for (const p of corpo.querySelectorAll(':scope > p')) {
      const porLinha = new Map()
      const andar = document.createTreeWalker(p, NodeFilter.SHOW_TEXT)
      for (let no = andar.nextNode(); no; no = andar.nextNode()) {
        for (let i = 0; i < no.length; i++) {
          const faixa = document.createRange()
          faixa.setStart(no, i)
          faixa.setEnd(no, i + 1)
          const r = faixa.getClientRects()[0]
          if (!r) continue
          const linha = Math.round(r.top / 4)
          porLinha.set(linha, (porLinha.get(linha) ?? 0) + 1)
        }
      }
      const contagens = [...porLinha.entries()].sort((a, b) => a[0] - b[0]).map((e) => e[1])
      medidas.push(...contagens.slice(0, -1))
    }
    medidas.sort((a, b) => a - b)
    const p = corpo.querySelector('p')
    const estilo = p ? getComputedStyle(p) : null
    return {
      corpoPx: estilo ? Number.parseFloat(estilo.fontSize) : 0,
      entrelinha: estilo ? Number.parseFloat(estilo.lineHeight) / Number.parseFloat(estilo.fontSize) : 0,
      larguraPx: Math.round(corpo.getBoundingClientRect().width),
      caracteresPorLinha: medidas.length ? medidas[Math.floor(medidas.length / 2)] : 0,
    }
  })
}

function progresso(pagina) {
  return pagina.evaluate(async (espera) => {
    const barra = document.querySelector('[data-progresso]')
    const corpo = document.querySelector('[data-corpo-leitura]')
    if (!barra || !corpo) return null
    const ler = () => new DOMMatrix(getComputedStyle(barra).transform).a
    window.scrollTo({ top: 0, behavior: 'instant' })
    await new Promise((resolver) => setTimeout(resolver, espera))
    const inicio = ler()
    const caixa = corpo.getBoundingClientRect()
    window.scrollTo({ top: caixa.bottom + window.scrollY - window.innerHeight + 2, behavior: 'instant' })
    await new Promise((resolver) => setTimeout(resolver, espera))
    const fim = ler()
    window.scrollTo({ top: 0, behavior: 'instant' })
    return { inicio, fim }
  }, ESPERA_MS)
}

function filtro(pagina) {
  return pagina.evaluate(async (espera) => {
    const visiveis = () =>
      Array.from(document.querySelectorAll('.bi-item')).filter((li) => li.getBoundingClientRect().height > 0)
    const link = document.querySelector('.bi-filtro[href="#categoria-financas"]')
    if (!(link instanceof HTMLElement)) return { erro: 'sem filtro Finanças' }
    link.click()
    await new Promise((resolver) => setTimeout(resolver, espera))
    const financas = visiveis()
    const categorias = [...new Set(financas.map((li) => li.getAttribute('data-categoria')))]
    location.hash = '#todos'
    await new Promise((resolver) => setTimeout(resolver, espera))
    return { financas: financas.length, categorias, todos: visiveis().length }
  }, ESPERA_MS)
}

async function conferirLinks(pagina, base, marca, problemas) {
  const hrefs = await pagina.evaluate(() =>
    Array.from(
      document.querySelectorAll('.bi-lista a, #leia-tambem a, .artigo-voltar, .artigo-indice a, .artigo-corpo a'),
      (a) => a.getAttribute('href') ?? '',
    ),
  )
  for (const href of new Set(hrefs)) {
    if (href.startsWith('#')) {
      const existe = await pagina.evaluate((id) => document.getElementById(id) !== null, href.slice(1))
      if (!existe) problemas.push(`${marca} âncora ${href} sem alvo`)
    } else if (href.startsWith('/')) {
      const resposta = await fetch(new URL(href, base), { method: 'HEAD', redirect: 'manual' })
      if (resposta.status !== 200) problemas.push(`${marca} link ${href} respondeu ${resposta.status}`)
    }
  }
}

async function conferirSemJs(navegador, url, marca, problemas) {
  const contexto = await navegador.newContext({ javaScriptEnabled: false })
  try {
    const pagina = await contexto.newPage()
    await pagina.goto(url, { waitUntil: 'load' })
    const estado = await pagina.evaluate(() => ({
      h1: document.querySelector('h1')?.textContent?.trim() ?? '',
      paragrafos: document.querySelectorAll('[data-corpo-leitura] p, .bi-item').length,
      barraVisivel: (() => {
        const barra = document.querySelector('.artigo-progresso')
        return barra ? getComputedStyle(barra).display !== 'none' : false
      })(),
    }))
    if (!estado.h1 || estado.paragrafos === 0) problemas.push(`${marca} sem JS: sem título ou sem texto`)
    if (estado.barraVisivel) problemas.push(`${marca} sem JS: barra de progresso visível`)
  } finally {
    await contexto.close()
  }
}

async function varrerPagina(navegador, args, caminho, largura, problemas) {
  const nome = caminho.slice(1).replaceAll('/', '-')
  const marca = `[${navegador.browserType().name()} ${largura} ${caminho}]`
  const url = `${args.base}${PREFIXO}${caminho}`
  const contexto = await navegador.newContext({ viewport: { width: largura, height: ALTURAS[largura] } })
  try {
    const pagina = await contexto.newPage()
    const erros = ouvirErros(pagina)
    const resposta = await pagina.goto(url, { waitUntil: 'load' })
    if (resposta?.status() !== 200) problemas.push(`${marca} respondeu ${resposta?.status()}`)
    await pagina.waitForFunction(() => document.documentElement.classList.contains('motion'))
    await pagina.waitForTimeout(1300)
    const vazias = await telasVazias(pagina)
    if (vazias.length) problemas.push(`${marca} telas vazias em y=${vazias.join(', ')}`)
    const linhas = await medirLinhas(pagina)
    const barra = await progresso(pagina)
    if (barra && (barra.inicio > 0.01 || barra.fim < 0.98)) {
      problemas.push(`${marca} progresso ${JSON.stringify(barra)}`)
    }
    if (caminho === '/blog') {
      const f = await filtro(pagina)
      console.log(`${marca} filtro ${JSON.stringify(f)}`)
      if (f.financas !== 3 || f.categorias?.join() !== 'financas' || f.todos !== 12) {
        problemas.push(`${marca} filtro ${JSON.stringify(f)}`)
      }
    }
    await conferirLinks(pagina, args.base, marca, problemas)
    if (linhas) console.log(`${marca} ${JSON.stringify(linhas)} progresso ${JSON.stringify(barra)}`)
    if (await pagina.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) {
      problemas.push(`${marca} scroll horizontal`)
    }
    const pasta = path.join(args.saida, navegador.browserType().name())
    mkdirSync(pasta, { recursive: true })
    await pagina.screenshot({ path: path.join(pasta, `${nome}-${largura}.png`), fullPage: true })
    problemas.push(...erros.map((erro) => `${marca} ${erro}`))
  } finally {
    await contexto.close()
  }
  if (largura === 1440) await conferirSemJs(navegador, url, marca, problemas)
}

async function main() {
  const args = lerArgs(process.argv.slice(2))
  const problemas = []
  for (const nomeDoNavegador of args.navegadores) {
    const navegador = await NAVEGADORES[nomeDoNavegador].launch()
    try {
      for (const largura of args.larguras) {
        for (const caminho of paginasDeLeitura()) {
          await varrerPagina(navegador, args, caminho, largura, problemas)
        }
      }
    } finally {
      await navegador.close()
    }
  }
  if (problemas.length) {
    console.error(`\n${problemas.length} problema(s):\n  ${problemas.join('\n  ')}`)
    process.exit(1)
  }
  console.log('\nLeitura ok: sem erro, sem tela vazia, links e filtro conferidos.')
}

main().catch((erro) => {
  console.error(erro?.stack ?? String(erro))
  process.exit(1)
})
```

- [ ] **Step 6: Portões e commit**

```powershell
pnpm exec biome check --write scripts/site-v2-comparar-metadados.mjs scripts/site-v2-leitura.mjs tests/int/site-v2-comparar-metadados.int.spec.ts
pnpm exec biome ci ./src ./tests ./scripts
pnpm exec tsc --noEmit
pnpm run check:server-actions
pnpm run test:int
pnpm build
git branch --show-current && git add scripts/site-v2-comparar-metadados.mjs scripts/site-v2-leitura.mjs tests/int/site-v2-comparar-metadados.int.spec.ts && git commit -m "chore(site-v2): scripts de comparação de metadata e varredura da leitura

O primeiro compara, URL por URL do sitemap do ar, o <head> de produção com o do
build local (as páginas de leitura pela prévia) e falha com diferença não
explicada. O segundo varre as páginas de leitura em Chromium e Firefox.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
git status --short
```

Expected: portões verdes (se o Step 4 criou o `.d.mts`, ele entra no `git add`); `git status --short` vazio. A revisão destes dois scripts acontece dentro da verificação final (mesmo critério da 1.9).

---

## Tarefa 3.10: Verificação final (verificador separado)

Calibragem do roteiro: **completa** para sitemap, OG e metadata (afetam indexação), com dado real (`curl` no build local e comparação com o site no ar) e navegador em Chromium e Firefox, 1440 e 390, nas páginas de leitura; **leve** para o texto dos posts (a sessão principal já conferiu na 3.4). Uma rodada por PR. O verificador não edita código: reporta.

**Files:** nenhum novo (os prints e relatórios vão para o scratchpad da sessão, nunca para o repositório).

**Interfaces:**
- Consumes: tudo das Tarefas 3.1 a 3.9.
- Produces: o relatório ao Leandro.

- [ ] **Step 1: Portões da CI e escopo**

```powershell
Set-Location C:\Users\lekoc\semogapp\semogsite-site-v2
git branch --show-current
git status --short
pnpm exec biome ci ./src ./tests ./scripts
pnpm exec tsc --noEmit
pnpm run check:server-actions
pnpm run test:int
git diff --stat 3cafbef..HEAD
```

Expected: `feat/site-v2`; status vazio; os quatro portões verdes; o diff lista só os arquivos da "Estrutura de arquivos" (mais a remoção de `src/app/(frontend)/sitemap.ts`) e os cinco `.mdx`. Qualquer arquivo de `src/app/(frontend)` além do sitemap, de `src/lib`, `src/components`, `src/blocks`, `db/` ou `next.config.ts` é falha de escopo.

- [ ] **Step 2: Build local e servidor**

```powershell
[string]::IsNullOrEmpty($env:NEXT_PUBLIC_SITE_URL)
[string]::IsNullOrEmpty($env:VERCEL_ENV)
pnpm exec playwright install chromium firefox
pnpm build
$next = Start-Process -PassThru -NoNewWindow node -ArgumentList 'node_modules/next/dist/bin/next','start','-p','3100'
```

Expected: `True` e `True`; build verde; `http://localhost:3100/previa-v2/blog` responde 200.

- [ ] **Step 3: Status de cada URL do inventário e das rotas técnicas**

```powershell
$xml = curl.exe -s http://localhost:3100/sitemap.xml
$caminhos = [regex]::Matches($xml, '<loc>([^<]+)</loc>') | ForEach-Object { ([uri]$_.Groups[1].Value).AbsolutePath }
$caminhos.Count
foreach ($c in $caminhos) { curl.exe -s -o NUL -w "$c %{http_code}`n" "http://localhost:3100$c" }
foreach ($c in '/previa-v2/blog', '/previa-v2/privacidade', '/previa-v2/termos', '/previa-v2/blog/assembleia-virtual-validade-juridica', '/previa-v2/blog/nao-existe') {
  curl.exe -s -o NUL -w "$c %{http_code}`n" "http://localhost:3100$c"
}
foreach ($c in '/sitemap.xml', '/robots.txt', '/icon.svg', '/apple-icon.png', '/opengraph-image') {
  curl.exe -s -o NUL -w "$c %{http_code} %{content_type}`n" "http://localhost:3100$c"
}
foreach ($c in '/solucoes.html', '/domestica', '/sobre') { curl.exe -s -o NUL -w "$c %{http_code} %{redirect_url}`n" "http://localhost:3100$c" }
curl.exe -s http://localhost:3100/previa-v2/blog | Select-String -Pattern 'name="robots"'
```

Expected: `30`; as 30 URLs em 200; as quatro páginas da prévia em 200 e `/previa-v2/blog/nao-existe` em 404; as cinco técnicas em 200 (`application/xml`, `text/plain`, `image/svg+xml`, `image/png`, `image/png`); os três redirects em 308 para o destino de hoje; a prévia com `noindex, nofollow`.

- [ ] **Step 4: OG de toda página que usa a rota dinâmica**

```powershell
$tmp = '<scratchpad da sessão>\fase3-og'
New-Item -ItemType Directory -Force $tmp | Out-Null
foreach ($c in $caminhos) {
  if ($c -in '/', '/experience') { continue }
  if ($c -like '/administradora-de-condominios-*') { continue }
  $arquivo = Join-Path $tmp (($c.Trim('/') -replace '/', '-') + '.png')
  curl.exe -s -o $arquivo -w "$c %{http_code} %{content_type}`n" "http://localhost:3100$c/opengraph-image"
}
```

Expected: 24 linhas, todas `200 image/png`. O verificador abre e olha `blog-assembleia-virtual-validade-juridica.png` (título "Assembleia virtual vale? O que a lei permite"), `blog-g20-superlogica-next-2026.png` ("mais de 3.500") e `semog.png` (título da página, não o nome do site), e confirma que o card é o de hoje (fundo marinho, marca, título em branco).

- [ ] **Step 5: Comparação de metadata antes e depois**

```powershell
git fetch origin
git log --oneline HEAD..origin/main
node scripts/site-v2-comparar-metadados.mjs --antes https://www.semog.com.br --depois http://localhost:3100 --saida '<scratchpad da sessão>\fase3-metadados.json'
```

Expected: código 0, "30 URLs comparadas", o sitemap igual nos dois lados e só as diferenças explicadas (assembleia virtual: `title`, `og:title`, `jsonld`; G20: `title`, `og:title`, `jsonld`). O verificador lê no JSON o `antes` e o `depois` de cada explicada e confirma que a diferença é exatamente o texto reescrito (no JSON-LD, `headline`, o nome do último item da trilha e, no G20, o `description` do `BlogPosting`, que é o resumo). Se houver diferença não explicada: conferir se ela vem de um commit da `main` que a branch ainda não tem (a saída do `git log HEAD..origin/main`); se vier, reportar com o commit; se não vier, é falha.

- [ ] **Step 6: Produção simulada: a prévia some, o blog atual fica**

```powershell
Stop-Process -Id $next.Id
$env:VERCEL_ENV = 'production'; pnpm build; Remove-Item Env:VERCEL_ENV
$next = Start-Process -PassThru -NoNewWindow node -ArgumentList 'node_modules/next/dist/bin/next','start','-p','3100'
foreach ($c in '/previa-v2/blog', '/previa-v2/blog/g20-superlogica-next-2026', '/previa-v2/privacidade', '/previa-v2/termos', '/blog', '/blog/g20-superlogica-next-2026', '/privacidade', '/termos', '/sitemap.xml') {
  curl.exe -s -o NUL -w "$c %{http_code}`n" "http://localhost:3100$c"
}
Stop-Process -Id $next.Id
pnpm build
$next = Start-Process -PassThru -NoNewWindow node -ArgumentList 'node_modules/next/dist/bin/next','start','-p','3100'
```

Expected: as quatro da prévia em 404; as cinco reais em 200. Prova o código, não a Vercel (mesma ressalva da fase 1: [A CONFIRMAR] que o projeto expõe as System Environment Variables ao build; a conferência real é `curl /previa-v2/blog` = 404 no domínio de produção, item da fase 5).

- [ ] **Step 7: Varredura de navegador, 2 navegadores e 2 larguras**

```powershell
node scripts/site-v2-leitura.mjs --base http://localhost:3100 --saida '<scratchpad da sessão>\fase3-leitura'
```

Expected: código 0, com 56 prints (14 páginas, 2 navegadores, 2 larguras), o filtro `{"financas":3,"categorias":["financas"],"todos":12}` nas quatro combinações e, nos artigos a 1440, `corpoPx` entre 18 e 20, `entrelinha` perto de 1,65 e `caracteresPorLinha` entre 60 e 75.

- [ ] **Step 8: Prints contra o protótipo**

```powershell
Set-Location C:\Users\lekoc\semogapp\semogsite\design-explorations\site-v2-prototipo
pnpm install --offline; if ($LASTEXITCODE -ne 0) { pnpm install }
pnpm build
node scripts/leitura-varredura.mjs
Set-Location C:\Users\lekoc\semogapp\semogsite-site-v2
```

Expected: o script do protótipo grava `capturas/leitura-varredura/<navegador>/` (blog, os dois posts com página, privacidade, termos). O verificador **abre e olha** os pares (mesmo navegador e largura): `blog` × `blog`, `blog-assembleia-instalacao-checklist-condominios-novos` × o post de mesmo slug, `blog-g20-superlogica-next-2026` × idem, `privacidade` × `privacidade`, `termos` × `termos`, e reporta por par: mesma grade (61,8/38,2 no topo do índice, destaque com foto, duas colunas; índice lateral fixo a 1440 e no topo do texto a 390), mesmas fontes (Saira leve nos títulos, Barlow no corpo), mesmas cores e ponta reta, e nada editorial. Diferenças esperadas e aceitáveis: no protótipo, os posts sem página aparecem como "Ler no site atual" e o rodapé tem a nota de protótipo; na Privacidade, o protótipo tem o aviso e o Next tem o controle real de cookies; o H1 do índice e os textos dos posts reescritos na 3.4.

- [ ] **Step 9: Interação à mão, Chromium e Firefox, 1440 e 390**

Em `http://localhost:3100/previa-v2/blog/previsao-orcamentaria-guia-sindico` e `/previa-v2/blog`, nos dois navegadores e nas duas larguras:
1. Clicar em cada item do "Neste texto": o título chega logo abaixo do cabeçalho, sem ficar escondido atrás dele, e o item clicado fica marcado (esperar 400 ms antes de olhar).
2. Abrir direto `/previa-v2/blog/previsao-orcamentaria-guia-sindico#3-fundo-de-reserva-a-linha-que-evita-o-rateio`: mesma coisa.
3. Rolar o post inteiro: a barra de 2 px sob o cabeçalho vai de vazia a cheia; o cabeçalho ganha fundo depois do primeiro respiro; nenhum trecho cortado ao fim da página.
4. No índice: "Finanças" deixa 3 posts e marca o filtro; "Todos" volta aos 12; voltar do navegador não quebra a lista.
5. Em `/previa-v2/privacidade`: o link "Suas preferências de cookies" do texto leva a `#cookies`; desligar "marketing" liga "Salvar preferências" e muda a mensagem; salvar; recarregar: o interruptor continua desligado e a mensagem diz "já salvou".
6. A 390: menu do cabeçalho abre e fecha; o índice aparece no topo do texto, no gelo; nada de scroll horizontal.
7. Console sem erro em todas as páginas.

- [ ] **Step 10: Texto renderizado (leve)**

```powershell
foreach ($c in @('/previa-v2/blog', '/previa-v2/privacidade', '/previa-v2/termos') + (Get-ChildItem content\blog\*.mdx | ForEach-Object { "/previa-v2/blog/$($_.BaseName)" })) {
  $html = curl.exe -s "http://localhost:3100$c"
  foreach ($t in 'tempo real', 'validade jurídica', 'menor inadimplência do mercado', 'melhor do Brasil', '5ª melhor', 'assessoria jurídica', 'jurídico próprio', 'time jurídico') {
    if ($html -match [regex]::Escape($t)) { "$c contém '$t'" }
  }
}
Stop-Process -Id $next.Id
```

Expected: nenhuma linha impressa (o slug `assembleia-virtual-validade-juridica` não casa: não tem acento nem espaço).

- [ ] **Step 11: Relatório ao Leandro e próximos passos externos [DEPENDE DO LEANDRO]**

O verificador entrega: a saída real de cada passo; a lista de diferenças de metadata com o antes e o depois; os pares de prints com o que divergiu; o resultado da interação à mão por navegador e largura; e os `[A CONFIRMAR]` (commits locais na fase 3; "a Semog assessora" no post de assembleia de instalação; "suporte jurídico com escritório parceiro" nos posts de Recife e de custo; frases genéricas de "uma administradora assume"; `/experience` no sitemap depois do evento; System Environment Variables da Vercel). Só com o "ok" do Leandro: push da branch, PR para a `feat/site-v2` e conferência do Preview da Vercel (`/previa-v2/blog` 200 com `noindex`; nenhuma medição disparando). O merge na `main` é a fase 5.

---

## Auto-revisão

**1. Cobertura da spec e do roteiro (fase 3):**

| Requisito | Tarefa |
| --- | --- |
| 3.1 layout `leitura` (sem JS de cena); o shell do `(site)` já existe | 3.8 (layout e esqueleto), 3.6 (o único JS), teste "sem JS de cena" na 3.8 |
| 6 `/blog` e os 12 posts nas mesmas URLs, modelo de leitura | 3.7 e 3.8 (na prévia; as URLs reais mudam na virada, DP1 e DP2) |
| 6 reestilizar `PostImage`/`PostVideo` | 3.7 (`FiguraDoPost`/`VideoDoPost`, mesmo contrato do MDX; os antigos ficam até a virada) |
| 6 post `assembleia-virtual-validade-juridica`: slug mantido, título, `meta.title` e texto sem "validade jurídica" | 3.4 (título e `meta.title` do protótipo; o corpo já não tem o termo, e nada jurídico novo foi afirmado), 3.2 (slug no sitemap congelado) |
| 3.3 e 6 guarda de termos vedados no blog (título, descrição, corpo; não o slug) | 3.4 (frontmatter inteiro menos o slug, e o corpo), 3.10 Step 10 (HTML renderizado) |
| 6 `/privacidade` e `/termos` no visual novo | 3.7 e 3.8 (com o controle real de cookies, DP12) |
| 6 sitemap e OG do inventário; teste que trava página sumindo | 3.1, 3.2 (lista congelada de 30), 3.3 (título do OG), 3.10 Steps 3 e 4 |
| 6 script de comparação antes/depois (title, description, canonical, JSON-LD) | 3.9 (script e teste do leitor), 3.10 Step 5 |
| 6 JSON-LD `BlogPosting` mantido | 3.8 (igual a `getPostJsonLd` nos 12), 3.10 Step 5 |
| 9 "a Semog conduz até o registro em cartório" | 3.4 Step 6, item 2 ([A CONFIRMAR]) |
| Pendência (a): hash malformado no MDX | 3.4 (`hashesMalformados`) e 3.5 (ids do índice só `[a-z0-9-]`) |
| Pendência (b): rotas técnicas no inventário antes de sitemap/OG | 3.1 |
| Roteiro: nada do site no ar muda antes da virada | DP1, 3.8 (404 em produção), 3.10 Steps 5 e 6 |
| Roteiro: verificação completa para sitemap/OG, leve para texto | 3.10 (completa), 3.4 Step 8 (leve) |

Fora desta fase, de propósito: mover as páginas para as URLs reais, apagar `src/app/(frontend)/blog/[slug]` e as chaves `blog`/`privacidade`/`termos` de `content/pages` (fase 5, DP2); o botão "Sou cliente" (fase 4, DP11); `/experience` fora do sitemap (decisão pendente); o card OG no visual do site v2 (não pedido).

**2. Varredura de placeholders:** sem "TBD", "TODO" ou "implementar depois". O texto `<scratchpad da sessão>` na 3.10 é o diretório que o executor recebe do harness, não um valor a inventar. As cópias literais (quatro `.mdx` e quatro `.css` do protótipo) têm conferência de diferença (3.4 Step 4) ou guarda de identidade (3.7 Step 9).

**3. Consistência de tipos e nomes:** `servidaComoPagina`/`VIRADA_1_FEITA` (3.1) são usados por `caminhosDoSitemap` (3.2) e `PREFIXO_DA_LEITURA` (3.5); `caminhosDoSitemap` é o que o teste de OG (3.3) percorre; `CartaoDePost`, `FiltroDeCategoria`, `ItemDoIndice`, `MINIMO_PARA_INDICE`, `regrasDoFiltro` e `idDoTitulo` (3.5) são os nomes que `CartaoDoPost`, `IndiceDoBlog`, `Artigo` e `mdx.tsx` (3.7) importam; `DadosDoArtigo`/`TopoDoArtigo` (3.7) são os que `PaginaDoPost`/`PaginaDoDocumento` (3.8) montam; `DocumentoLegal`, `paginaDoConteudo`, `metadadosDoPost`, `metadadosDaPagina` (3.5) são os das rotas (3.8); `ROBOTS_DA_PREVIA` (3.5) é o das quatro rotas; `Reportar` vem de `src/site/core/ganchos.ts` (fase 1) em `ligar-leitura.ts`; `destinoNoDepois` e `lerCabeca` (3.9) são os do teste.

**4. Review Focus:** as cinco linhas têm teste na tarefa dona: âncora e índice (3.5, ids; 3.8, `conferirIds`; 3.10 Step 9, posição real), sem JavaScript (3.7, HTML do servidor; 3.9, contexto sem JS), post sem índice (3.7 e 3.8), cookies já escolhidos (3.7), página que sai de `content/pages` (3.2 e 3.3).

## Execução

Plano salvo em `docs/superpowers/plans/2026-10-16-site-v2-fase-3-leitura.md`. Cada tarefa termina com um commit local na `feat/site-v2`; nenhum push, PR ou deploy sem o "ok" do Leandro. Recomendação: **subagent-driven** (implementador por tarefa, verificador separado só na 3.10), porque as Tarefas 3.5 a 3.8 dependem das interfaces umas das outras e o que mais custa (sitemap, OG e `<head>`) só se prova no build servido, comparado com o site no ar.
