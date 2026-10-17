# Site v2 · Fases 0 e 1 (pré-requisitos e fundação): plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** deixar pronto, dentro do semogsite de produção e sem mudar nada do site no ar, tudo o que a primeira página do site v2 precisa para renderizar: fontes, tokens, guardas de identidade na CI, conteúdo tipado, inventário de URLs e redirects testado, core de movimento com desmonte explícito, runner de cenas com `useGSAP`, layout raiz `(site)` com o sublayout `app`, cabeçalho, rodapé, snap de patamares só no toque e uma cena real (o ranking) atrás da rota `/previa-v2`, que responde 404 em produção.

**Architecture:** seções em Server Components (texto no HTML), cenas do protótipo portadas para TypeScript e montadas por um único `RunnerDeCenas` client que usa `useGSAP` como mecanismo de montagem (um `gsap.context` por seção, `revert` no desmonte). O core do protótipo vira módulos TS sem efeito no topo do arquivo (seguros no SSR) e com função de desligar em tudo o que não é GSAP. Layout raiz próprio `(site)`, irmão do `(frontend)` atual; navegar entre os dois faz carga completa, então os estilos antigos e novos nunca coexistem.

**Tech Stack:** Next 16.2.6 (App Router, route groups, `next/font/local`), React 19.2.6, TypeScript 5.7.3, `gsap` 3.15.0 (ScrollTrigger, SplitText), `@gsap/react` 2.1.2, `lenis` 1.3.26, Vitest 4.0.18 com jsdom, Biome 2.5.3, Playwright 1.58.2 (só nas ferramentas de verificação), pnpm 10.12.4.

**Spec:** `C:\Users\lekoc\semogapp\semogsite\docs\superpowers\specs\2026-10-15-site-v2-producao-design.md` (seções 2, 3, 6, 7 e 8, fases 0 e 1). Roteiro das demais fases: `C:\Users\lekoc\semogapp\semogsite\docs\superpowers\plans\2026-10-15-site-v2-roteiro.md`.

## Global Constraints

- **Onde trabalhar:** numa worktree nova, `C:\Users\lekoc\semogapp\semogsite-site-v2`, branch `feat/site-v2`, criada de `origin/main` depois de `git fetch` (o `main` local está 32 commits atrás). Neste plano, **WT** é esse caminho.
- **Protótipo (fonte visual e das cenas):** `C:\Users\lekoc\semogapp\semogsite\design-explorations\site-v2-prototipo` (não versionado; não existe dentro da WT). Neste plano, **PROTOTIPO** é esse caminho. Nunca editar os fontes dele; a Tarefa 1.9 só instala dependências e gera o `dist/` dele (as duas pastas estão no `.gitignore` do protótipo) para servi-lo como referência.
- **Não tocar** no protótipo local do Codex nem no `next.config.ts` modificado do checkout principal (`src/app/(prototipo)/`, `src/components/prototype/`, `public/prototype/`, `tests/int/prototype-solutions.int.spec.tsx`). A limpeza é da fase 7 (roteiro).
- **Commits locais por tarefa, sem push, sem migração.** O Leandro autorizou em 15/10/2026 um commit local por tarefa na `feat/site-v2` (substitui o antigo "sem commit"). O passo "Checkpoint: rodar portões e commitar" de cada tarefa roda os portões e commita, numa só chamada, com `git branch --show-current && git add <arquivos exatos da tarefa> && git commit -m "..."` (nunca `git add -A`; a mensagem é convencional, em pt-BR, e termina com as linhas `Co-Authored-By` e `Claude-Session`). Push da branch, abertura de PR e configuração da Vercel só com autorização do Leandro.
- **Portões da CI** (rodar da WT, nesta ordem): `pnpm exec biome ci ./src ./tests ./scripts`, `pnpm exec tsc --noEmit`, `pnpm run check:server-actions`, `pnpm run test:int`, `pnpm build`. Antes do `biome ci`, `pnpm exec biome check --write <arquivos tocados>` (aplica formatação e ordem de imports).
- **Dependências exatas:** `@gsap/react` 2.1.2, `gsap` 3.15.0, `lenis` 1.3.26 (a 1.3.25 instalada não tem `respectReducedMotion`). `three` não entra.
- **Identidade (spec 2 e README do protótipo):** site claro; Saira + Barlow; canto reto (`border-radius` 0 em tudo) e "ponta reta, movimento no meio" (`stroke-linecap: butt`); métrica áurea (espaço Fibonacci, 61,8/38,2); cor só por token (hex só no `:root` de `tokens.css`, nunca em `.ts`/`.tsx`); nada de caixa-alta espaçada nem serifa.
- **Animar para todos:** nada de `prefers-reduced-motion` nem `useReducedHeavy` no site v2; Lenis com `respectReducedMotion: false`.
- **Nada editorial:** sem eyebrow `uppercase tracking-wider`, sem numerais 01/02/03 decorativos, sem heading serifado, sem layout de revista.
- **Texto público, termos vedados:** "tempo real", "validade jurídica", "menor inadimplência do mercado", "melhor do Brasil", "5ª melhor", telas fictícias do app; e, das regras de conformidade de 27/07/2026: "assessoria jurídica", "jurídico próprio", "time jurídico", "assumimos a operação", "a única do Norte", "a única do Nordeste", "ranking nacional". Jurídico sempre "com parceiro". Ranking sempre como "5º entre mais de 3.500 administradoras" e "a mais bem posicionada do Norte e Nordeste".
- **Nenhum dado inventado:** fato novo que não está no conteúdo tipado fica marcado `TEXTO-NOVO` no código, como no protótipo; nada de valor de exemplo que pareça real.
- **Nenhum segredo no bundle:** nenhuma variável `NEXT_PUBLIC_*` nova; a prévia decide por `VERCEL_ENV`, lida no servidor.
- **TypeScript:** zero `any`; `as` só com o motivo escrito ao lado; toda promise com tratamento de erro; falha de cena vai para `Sentry.captureException` e a seção fica em HTML estático; a falha de uma parte da cena que degrada sem derrubá-la (sem `.moldura > img`, ranking indisponível, ganchos de impressão) também vai ao Sentry, pelo `ctx.reportar` (1.5).
- **Links internos são `<a>`**, nunca `next/link` (spec 3.1).
- **Windows/CRLF:** todo teste que lê arquivo do disco normaliza `\r\n` antes de qualquer regex; nada de `.` ou `$` contando com LF.
- **APIs de terceiro:** antes de mudar uma chamada de Next, `@gsap/react`, GSAP ou Lenis, conferir no Context7 ou no pacote instalado (`node_modules/next/dist/docs/`, `node_modules/<pacote>/dist/*.d.ts`). As assinaturas usadas aqui foram conferidas em 15/10/2026 nessas fontes.

## Review Focus

- **Módulo client avaliado no servidor.** O Next renderiza o `RunnerDeCenas` no SSR e avalia core, conteúdo e cenas em Node; um `window.matchMedia` no topo de um módulo (como `util.js` e `motion.js` do protótipo fazem) derruba a página com 500. Esperado: todo módulo de `src/site` importa em Node sem erro. Teste na Tarefa 1.5 e 1.6 (`site-v2-core-ssr`).
- **Montagem dupla e desmonte.** Em `pnpm dev` o StrictMode monta, desmonta e monta de novo; qualquer Lenis, ticker, listener ou observer que sobra vira rolagem dobrada e pin duplicado. Esperado: três ciclos de montar e desmontar deixam um só conjunto vivo. Testes na Tarefa 1.6.
- **Cena que quebra.** Erro síncrono no `init`, promise rejeitada e `<section>` ausente. Esperado: a seção continua legível em HTML, as outras cenas animam, e o erro chega ao Sentry com a tag da cena. Testes na Tarefa 1.6.
- **Página aberta fora do topo.** Recarga no meio do pin, link com âncora (inclusive malformada, `#%E0%A4%A`) e voltar pelo histórico. Esperado: nenhuma exceção "reading 'end'", e a página para na âncora certa. Teste de `alvoDaAncora` na Tarefa 1.5; navegador na Tarefa 1.9.
- **Produção intocada.** Esperado: `/previa-v2` responde 404 quando `VERCEL_ENV=production` e tem `noindex` em qualquer ambiente; nenhuma URL do site no ar muda de status, e os 54 redirects continuam iguais. Testes nas Tarefas 1.3 e 1.8; `curl` na Tarefa 1.9.

---

## Estrutura de arquivos

Tudo do site v2 mora em `src/site/` (código) e `src/app/(site)/` (rotas). Nada em `src/site` é importado pelo site atual, exceto `src/site/redirecionamentos.ts`, que o `next.config.ts` passa a usar.

| Caminho (na WT) | Responsabilidade |
| --- | --- |
| `src/site/fontes/index.ts` + `src/site/fontes/arquivos/*.woff2` | Saira variável e Barlow 300–600 por `next/font/local`, subset latin |
| `src/site/estilos/tokens.css`, `src/site/estilos/base.css` | identidade do protótipo; fontes pelas variáveis do `next/font` |
| `src/site/conteudo/conteudo.ts` | todos os textos e números do protótipo, tipados (`as const`) |
| `src/site/formatar.ts` | formatação pt-BR pura (serve a Server Component e a cena) |
| `src/site/redirecionamentos.ts` | os 54 redirects, saídos do `next.config.ts` |
| `src/site/inventario.ts` | o que cada URL pública vira no site v2 (spec 6) |
| `src/site/core/ganchos.ts` | registro de desligamentos e ganchos de impressão |
| `src/site/core/patamares.ts` | snap direcional nos patamares, só em aparelho só de toque |
| `src/site/core/util.ts` | `ctx.util` das cenas (revelações, contador, pin, laços, canvas) |
| `src/site/core/motion.ts` | registro dos plugins, Lenis no ticker, `html.motion`, vigia de altura |
| `src/site/core/posicao.ts` | topo antes de montar, volta à âncora ou ao y anterior |
| `src/site/core/tema.ts` | tema do cabeçalho pela seção sob ele |
| `src/site/core/impressao.ts` | estado final das animações ao imprimir |
| `src/site/core/cabecalho.ts` | menu do cabeçalho em tela estreita |
| `src/site/core/tipos.ts` | `ContextoCena`, `InitCena`, `ListaCenas` |
| `src/site/core/montagem.ts` | `montarPagina`: monta as cenas e devolve o desmonte |
| `src/site/runner/RunnerDeCenas.tsx` | client: `useGSAP` chamando `montarPagina`, Sentry |
| `src/site/cenas/registro.ts` | lista de cenas por página |
| `src/site/cenas/home/ranking.ts` | cena do ranking, portada do protótipo |
| `src/site/secoes/home/Ranking.tsx` + `ranking.css` | seção do ranking em Server Component |
| `src/site/layout/*.tsx` | `SimbolosSvg`, `Cabecalho`, `LigarMenu`, `Rodape`, `EsqueletoApp` |
| `src/site/previa.ts` | `previaLiberada()`: a prévia nunca abre em produção |
| `src/app/(site)/layout.tsx` | layout raiz: `<html>`, fontes, tokens, consentimento e medição |
| `src/app/(site)/(app)/layout.tsx` | sublayout app: CSS do Lenis |
| `src/app/(site)/(app)/previa-v2/page.tsx` | rota de prévia (404 em produção) |
| `public/site-v2/fotos/*.webp` | fotos do conteúdo |
| `scripts/site-v2-quadros.mjs`, `scripts/site-v2-toque.mjs` | ferramentas de verificação no navegador |
| `tests/int/helpers/identidade.ts` + `tests/int/site-v2-*.int.spec.ts(x)` | guardas e testes |

Modificados: `package.json` e `pnpm-lock.yaml` (dependências), `biome.json` (CSS do site v2 fora do Biome), `next.config.ts` (redirects importados).

---

## Fase 0 · Pré-requisitos

### Tarefa 0.1: Worktree de `origin/main` e portões de partida

**Files:** nenhum arquivo do repositório muda.

**Interfaces:**
- Consumes: nada.
- Produces: a WT em `C:\Users\lekoc\semogapp\semogsite-site-v2`, branch `feat/site-v2`, com dependências instaladas e os cinco portões verdes. Todas as tarefas seguintes rodam nela.

- [ ] **Step 1: Atualizar o remoto e conferir a base**

```powershell
git -C C:\Users\lekoc\semogapp\semogsite fetch origin
git -C C:\Users\lekoc\semogapp\semogsite ls-remote origin main
git -C C:\Users\lekoc\semogapp\semogsite rev-parse origin/main
```

Expected: o hash do `ls-remote` é igual ao do `rev-parse origin/main` (em 15/10/2026 era `39ff63e…`).

- [ ] **Step 2: Criar a worktree e instalar**

```powershell
git -C C:\Users\lekoc\semogapp\semogsite worktree add -b feat/site-v2 C:\Users\lekoc\semogapp\semogsite-site-v2 origin/main
Set-Location C:\Users\lekoc\semogapp\semogsite-site-v2
pnpm install --frozen-lockfile
git branch --show-current
```

Expected: `feat/site-v2`; instalação sem erro.

- [ ] **Step 3: Portões de partida**

```powershell
pnpm exec biome ci ./src ./tests ./scripts
pnpm exec tsc --noEmit
pnpm run check:server-actions
pnpm run test:int
pnpm build
```

Expected: os cinco verdes. Se algum falhar aqui, parar e reportar: a falha é anterior a este plano e não pode ser misturada a ele.

### Tarefa 0.2: Search Console das três URLs que iam redirecionar

**Files:** só um script de leitura no scratchpad da sessão (fora do repositório).

**Interfaces:**
- Consumes: a conta de serviço de `C:\Users\lekoc\.gcp-mcp\semog-mcp-sa.json` (somente leitura no Search Console).
- Produces: um quadro com cliques, impressões, posição média e principais consultas de `/solucoes`, `/prestacao-de-contas-condominio` e `/software-de-gestao-condominial` nos últimos 90 dias, levado ao Leandro (spec 2: o tráfego decidiu manter `/solucoes`).

- [ ] **Step 1: Escrever o script de leitura no scratchpad**

Arquivo: `<scratchpad>\gsc_tres_urls.py`

```python
"""Search Console: as 3 URLs que o site v2 ia redirecionar. Somente leitura."""
import json
from datetime import date, timedelta

import requests
from google.auth.transport.requests import Request
from google.oauth2 import service_account

KEY = r"C:\Users\lekoc\.gcp-mcp\semog-mcp-sa.json"
ENDPOINT = (
    "https://www.googleapis.com/webmasters/v3/sites/sc-domain%3Asemog.com.br/searchAnalytics/query"
)
URLS = ["/solucoes", "/prestacao-de-contas-condominio", "/software-de-gestao-condominial"]

creds = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/webmasters.readonly"]
)
creds.refresh(Request())
H = {"Authorization": f"Bearer {creds.token}", "Content-Type": "application/json"}
FIM = date.today() - timedelta(days=3)
INICIO = FIM - timedelta(days=90)


def consulta(dimensoes, caminho):
    corpo = {
        "startDate": INICIO.isoformat(),
        "endDate": FIM.isoformat(),
        "dimensions": dimensoes,
        "rowLimit": 25,
        "dimensionFilterGroups": [
            {"filters": [{"dimension": "page", "operator": "contains", "expression": caminho}]}
        ],
    }
    resposta = requests.post(ENDPOINT, headers=H, data=json.dumps(corpo), timeout=90)
    resposta.raise_for_status()
    return resposta.json().get("rows", [])


print(f"Janela: {INICIO} a {FIM}")
for caminho in URLS:
    print(f"\n=== {caminho} ===")
    paginas = consulta(["page"], caminho)
    if not paginas:
        print("  sem impressão na janela")
        continue
    for linha in paginas:
        print(
            f"  {linha['keys'][0]:70} cliques={linha['clicks']:4.0f} "
            f"impr={linha['impressions']:6.0f} pos={linha['position']:.1f}"
        )
    for linha in consulta(["query"], caminho)[:10]:
        print(f"    consulta: {linha['keys'][0][:60]:62} cliques={linha['clicks']:3.0f} pos={linha['position']:.1f}")
```

- [ ] **Step 2: Rodar com o mesmo Python que roda `C:\Users\lekoc\.gcp-mcp\gsc_perf.py`**

```powershell
& C:\Python313\python.exe <scratchpad>\gsc_tres_urls.py
```

Expected: um bloco por URL. O interpretador é `C:\Python313\python.exe` (confirmado na execução da tarefa); o `-I` fica de fora porque o script lê só o próprio diretório do scratchpad.

- [ ] **Step 3: Levar ao Leandro [DEPENDE DO LEANDRO]**

Para cada URL: cliques e impressões em 90 dias, posição média, as consultas que a trazem e se o destino do redirect (`/administracao-de-condominios` ou `/tecnologia`) responde a essas consultas. Resultado e decisão (15/10): `/solucoes` teve 8 cliques e 1.783 impressões em 90 dias, `/prestacao-de-contas-condominio` 2 cliques e 71 impressões, `/software-de-gestao-condominial` 0 cliques e 292 impressões. O Leandro decidiu **manter `/solucoes` como página própria** (spec 2 e 6) e redirecionar as outras duas para `/tecnologia`. A decisão já está no inventário da Tarefa 1.3; o conteúdo e o lugar da `/solucoes` no v2 ficam como pendência da spec 9, que bloqueia a fase 4.

### Tarefa 0.3: Skew Protection na Vercel

**Files:** nenhum.

**Interfaces:**
- Consumes: ferramentas MCP da Vercel (somente leitura).
- Produces: o estado atual da Skew Protection do projeto `semogsite`. **Resolvida em 15/10/2026:** já está ligada, com janela de 12 h, e o Leandro mantém. Os passos abaixo ficam como roteiro de conferência.

- [ ] **Step 1: Ler a configuração do projeto**

Chamar `mcp__claude_ai_Vercel__list_projects` para achar o id do `semogsite`, depois `mcp__claude_ai_Vercel__get_project` com esse id. Procurar no retorno os campos de Skew Protection [A CONFIRMAR o nome exato do campo: conferir com `mcp__claude_ai_Vercel__search_vercel_documentation`, consulta "Skew Protection"].

- [ ] **Step 2: Conferir o caminho atual da tela e o requisito de plano**

`mcp__claude_ai_Vercel__search_vercel_documentation` com "enable Skew Protection project settings". Anotar o caminho de menu exato e se o plano da conta cobre o recurso.

- [ ] **Step 3: Levar ao Leandro [DEPENDE DO LEANDRO]**

Contexto para ele: o ID de cada Server Action muda a cada build; uma aba aberta antes do deploy chama o ID antigo e toma 404 (memória "ID da Server Action muda no deploy"); com o formulário em duas etapas, a janela entre etapa 1 e etapa 2 aumenta o risco. Estado encontrado: já ligada (12 h), e o Leandro mantém. Se a conferência mostrar o contrário, a recomendação é ligar antes da virada 1, com o roteiro de menu do Step 2 entregue de uma vez, sem ligar sem a confirmação dele.

### Tarefa 0.4: Org do Sentry e variáveis do Preview

**Files:** nenhum.

**Interfaces:**
- Consumes: ferramentas MCP do Sentry e da Vercel (somente leitura).
- Produces: confirmação de que `org: 'semog'` do `next.config.ts` é a org que recebe os eventos, e de que o Preview da `feat/site-v2` fica sem `EXACT_*` e sem indexação. **Resolvida em 15/10/2026:** a org `semog` e o projeto `semogsite` conferem; o Preview está sem `EXACT_*` e sem `SITE_ALLOW_INDEX` (e também sem `DATABASE_URI`, Turnstile e GA).

- [ ] **Step 1: Org do Sentry**

`mcp__sentry__find_organizations`, depois `mcp__sentry__find_projects` na org encontrada. Comparar o slug com `org: 'semog'` e `project: 'semogsite'` do `next.config.ts` da WT.

Expected: o slug bate. Se o slug for `leandro-semog` (o que a memória registra), reportar ao Leandro: o upload de source map está indo para lugar nenhum. A correção do `next.config.ts` não entra neste plano sem a decisão dele [DEPENDE DO LEANDRO].

- [ ] **Step 2: Variáveis do Preview**

`mcp__claude_ai_Vercel__filter_project_envs` no projeto, alvo `preview`, **sem descriptografar valores**. Conferir: nenhuma `EXACT_*` no Preview (spec 7; `docs/DEPLOY.md`); `SITE_ALLOW_INDEX` ausente ou diferente de `true` no Preview.

Expected: as duas condições valem. Se não valerem, reportar com o nome da variável; mudar variável é com o Leandro [DEPENDE DO LEANDRO].

### Tarefa 0.5: Pendências que a fase 1 não resolve, numa pergunta só

**Files:** nenhum.

- [ ] **Step 1: Agrupar num único `AskUserQuestion` [DEPENDE DO LEANDRO]**

1. (Resolvida em 15/10: snap validado no celular, commits locais autorizados, `/solucoes` mantida, Skew Protection de 12 h mantida.) Snap de toque validado no celular dele (spec 3.2 pede validação no protótipo antes): ele já abriu o Artifact `KSCXKppybpLBvqZzNC2eAS` no celular depois do snap? Opções: "já validei", "vou validar agora", "validar só no Preview da fase 1". A fase 1 porta o mesmo código; a fase 4 depende da resposta.
2. (Resolvida em 15/10: sem lista na spec; tratados como o NAP das Unidades e a rota da 2ª via, resolvidos nas fases 3 e 4, onde o conteúdo vive.) "Endereços/rotas faltantes (abaixo)" (spec 8, fase 0): a spec não lista quais são. Opções: "são os endereços (NAP) das Unidades no contato", "é a rota da 2ª via no site novo" (o conteúdo traz "A CONFIRMAR: rota da 2ª via no site novo"), "outra coisa".
3. (Resolvida em 15/10: o protótipo é arquivado por commit em `design-explorations/` na branch, antes da fase 7.) Onde arquivar o protótipo antes da fase 7 (não está versionado): "repo privado", "zip no Drive", "commit em `design-explorations/` na branch".

---

## Fase 1 · Fundação

### Tarefa 1.1: Fontes, tokens, base e guardas de identidade

**Files:**
- Create: `src/site/fontes/index.ts`
- Create: `src/site/fontes/arquivos/` (5 `.woff2` + 2 licenças OFL copiados do protótipo)
- Create: `src/site/estilos/tokens.css`, `src/site/estilos/base.css`
- Create: `tests/int/helpers/identidade.ts`
- Test: `tests/int/site-v2-identidade.int.spec.ts`
- Modify: `biome.json` (lista `files.includes`)

(A varredura do teste cobre `src/site/**` e, quando existir, `src/app/(site)/**`; na 1.1 a segunda pasta ainda não existe e a varredura a trata como vazia.)

**Interfaces:**
- Consumes: nada.
- Produces: `saira` e `barlow` (objetos do `next/font/local`, com `.variable` = `--fonte-saira` e `--fonte-barlow`); `verificarCss(texto, arquivo)`, `verificarCodigo(texto, arquivo)`, `procurarTermosVedados(texto): string[]`, `textosDe(valor: unknown): string[]`, `listarArquivos(raiz, extensoes): string[]` e o tipo `Violacao = { arquivo: string; linha: number; motivo: string }`, todos em `tests/int/helpers/identidade.ts`.

- [ ] **Step 1: Escrever o helper das guardas**

`tests/int/helpers/identidade.ts`:

```ts
import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'

/**
 * Guardas de identidade do site v2. As regras de CSS são as que o `build.mjs` do protótipo
 * barrava (PROIBIDOS), mais duas desta fase: fonte só pelo next/font e nada de reduced-motion
 * (decisão do Leandro: animar para todos). Rodam no Vitest para continuarem travadas na CI.
 *
 * Todo texto lido do disco passa por `normalizar`: no Windows o checkout tem CRLF e na CI, LF.
 */
export type Violacao = { arquivo: string; linha: number; motivo: string }
type Regra = readonly [padrao: RegExp, motivo: string]

const REGRAS_CSS: readonly Regra[] = [
  [/#[0-9a-fA-F]{3,8}\b/, 'cor em hex fora do :root (use token)'],
  [
    /border-radius\s*:(?!\s*(?:0|var\(--raio\))\s*(?:;|$))/,
    'border-radius diferente de 0 (ponta reta)',
  ],
  [/text-transform\s*:\s*uppercase/, 'caixa-alta (estilo editorial é proibido)'],
  [/font-family\s*:[^;]*(?<!sans-)\bserif\b/, 'fonte serifada'],
  [/stroke-linecap\s*:\s*(round|square)/, 'ponta de traço que não é butt'],
  [/@font-face/, '@font-face fora do next/font (fontes só em src/site/fontes)'],
  [/prefers-reduced-motion/, 'reduced-motion (decisão: animar para todos)'],
]

const REGRAS_CODIGO: readonly Regra[] = [
  [
    /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/,
    'cor em hex no código (use token, via corDoToken)',
  ],
  [/from\s+['"]next\/link['"]/, 'next/link (links internos do site v2 são <a>)'],
  [/prefers-reduced-motion|useReducedHeavy/, 'reduced-motion (decisão: animar para todos)'],
]

/** Spec 2, README do protótipo e regras de conformidade de 27/07/2026. */
export const TERMOS_VEDADOS: readonly string[] = [
  'tempo real',
  'validade jurídica',
  'menor inadimplência do mercado',
  'melhor do Brasil',
  '5ª melhor',
  'assessoria jurídica',
  'jurídico próprio',
  'time jurídico',
  'assumimos a operação',
  'a única do Norte',
  'a única do Nordeste',
  'ranking nacional',
]

function normalizar(texto: string): string {
  return texto.replace(/\r\n?/g, '\n')
}

/** Comentários e blocos :root viram espaço, preservando as quebras (a linha apontada não muda). */
function semRootNemComentario(css: string): string {
  const branco = (trecho: string) => trecho.replace(/[^\n]/g, ' ')
  return css.replace(/\/\*[\s\S]*?\*\//g, branco).replace(/:root\s*\{[\s\S]*?\n\}/g, branco)
}

function aplicar(texto: string, arquivo: string, regras: readonly Regra[]): Violacao[] {
  const violacoes: Violacao[] = []
  texto.split('\n').forEach((conteudoDaLinha, indice) => {
    for (const [padrao, motivo] of regras) {
      if (padrao.test(conteudoDaLinha)) violacoes.push({ arquivo, linha: indice + 1, motivo })
    }
  })
  return violacoes
}

export function verificarCss(texto: string, arquivo: string): Violacao[] {
  return aplicar(semRootNemComentario(normalizar(texto)), arquivo, REGRAS_CSS)
}

export function verificarCodigo(texto: string, arquivo: string): Violacao[] {
  return aplicar(normalizar(texto), arquivo, REGRAS_CODIGO)
}

export function procurarTermosVedados(texto: string): string[] {
  const baixo = texto.toLocaleLowerCase('pt-BR')
  return TERMOS_VEDADOS.filter((termo) => baixo.includes(termo.toLocaleLowerCase('pt-BR')))
}

/** Todas as strings de um valor (objeto, lista ou string), em profundidade. */
export function textosDe(valor: unknown): string[] {
  if (typeof valor === 'string') return [valor]
  if (Array.isArray(valor)) return valor.flatMap(textosDe)
  if (valor !== null && typeof valor === 'object') return Object.values(valor).flatMap(textosDe)
  return []
}

export function listarArquivos(raiz: string, extensoes: readonly string[]): string[] {
  return readdirSync(raiz, { withFileTypes: true }).flatMap((item) => {
    const caminho = path.join(raiz, item.name)
    if (item.isDirectory()) return listarArquivos(caminho, extensoes)
    return extensoes.some((ext) => item.name.endsWith(ext)) ? [caminho] : []
  })
}

/** Como `listarArquivos`, mas uma pasta que ainda não existe (ex.: `src/app/(site)`) vale como vazia. */
export function listarSeExiste(raiz: string, extensoes: readonly string[]): string[] {
  return existsSync(raiz) ? listarArquivos(raiz, extensoes) : []
}
```

- [ ] **Step 2: Escrever o teste (regras que pegam o que devem e varredura de `src/site` e `src/app/(site)`)**

`tests/int/site-v2-identidade.int.spec.ts`:

```ts
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import {
  listarArquivos,
  listarSeExiste,
  procurarTermosVedados,
  verificarCodigo,
  verificarCss,
} from './helpers/identidade'

const RAIZ_SITE = path.join(process.cwd(), 'src', 'site')
const RAIZ_APP_SITE = path.join(process.cwd(), 'src', 'app', '(site)')

describe('guarda de identidade: as regras pegam o que devem pegar', () => {
  it('acusa cada proibição de CSS na linha certa', () => {
    const ruim = [
      '.a { color: #fff; }',
      '.b { border-radius: 4px; }',
      '.c { text-transform: uppercase; }',
      '.d { font-family: Georgia, serif; }',
      '.e { stroke-linecap: round; }',
      '@font-face { font-family: X; }',
      '@media (prefers-reduced-motion: reduce) { .f { opacity: 1; } }',
    ].join('\n')
    expect(verificarCss(ruim, 'amostra.css').map((v) => v.linha)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('aceita hex no :root, raio 0 ou var(--raio), sans-serif e hex dentro de comentário', () => {
    const bom = [
      ':root {',
      '  --marinho: #1b2d70;',
      '}',
      '/* #fff só no comentário */',
      '.a { border-radius: 0; }',
      '.b { border-radius: var(--raio); }',
      '.c { font-family: var(--fonte-corpo), sans-serif; }',
    ].join('\n')
    expect(verificarCss(bom, 'amostra.css')).toEqual([])
  })

  it('com CRLF, o :root continua isento e a linha apontada é a certa', () => {
    const crlf = ':root {\r\n  --a: #ffffff;\r\n}\r\n.x { color: #000; }\r\n'
    expect(verificarCss(crlf, 'crlf.css')).toEqual([
      { arquivo: 'crlf.css', linha: 4, motivo: 'cor em hex fora do :root (use token)' },
    ])
  })

  it('no código, acusa hex de cor e next/link, e deixa passar âncora e href de símbolo', () => {
    expect(verificarCodigo("const cor = '#1b2d70'", 'a.ts')).toHaveLength(1)
    expect(verificarCodigo("import Link from 'next/link'", 'b.tsx')).toHaveLength(1)
    expect(verificarCodigo('<a href="#conteudo"><use href="#logo-semog" /></a>', 'c.tsx')).toEqual(
      [],
    )
  })

  it('acha termo vedado sem diferenciar caixa e não acusa a frase aprovada do ranking', () => {
    expect(procurarTermosVedados('Acompanhe em Tempo Real')).toEqual(['tempo real'])
    expect(procurarTermosVedados('5º entre mais de 3.500 administradoras')).toEqual([])
  })
})

describe('guarda de identidade: varredura de src/site e src/app/(site)', () => {
  let css: string[] = []
  let codigo: string[] = []
  const relativo = (arquivo: string) => path.relative(process.cwd(), arquivo).replaceAll('\\', '/')

  // A listagem fica no beforeAll (não no corpo do describe) para que a pasta ausente derrube só
  // estes testes, e não a coleta do arquivo inteiro, deixando os cinco testes de regra rodarem.
  beforeAll(() => {
    css = [...listarArquivos(RAIZ_SITE, ['.css']), ...listarSeExiste(RAIZ_APP_SITE, ['.css'])]
    codigo = [
      ...listarArquivos(RAIZ_SITE, ['.ts', '.tsx']),
      ...listarSeExiste(RAIZ_APP_SITE, ['.ts', '.tsx']),
    ]
  })

  it('acha os arquivos que deve varrer (zero arquivo não pode passar verde)', () => {
    expect(css.map(relativo)).toEqual(
      expect.arrayContaining(['src/site/estilos/tokens.css', 'src/site/estilos/base.css']),
    )
    expect(codigo.length).toBeGreaterThan(0)
  })

  it('nenhum CSS do site v2 sai da identidade', () => {
    const violacoes = css.flatMap((a) => verificarCss(readFileSync(a, 'utf8'), relativo(a)))
    expect(violacoes).toEqual([])
  })

  it('nenhum TS/TSX do site v2 (src/site e src/app/(site)) usa hex de cor, next/link ou reduced-motion', () => {
    const violacoes = codigo.flatMap((a) => verificarCodigo(readFileSync(a, 'utf8'), relativo(a)))
    expect(violacoes).toEqual([])
  })

  it('nenhum texto do site v2 (src/site e src/app/(site)) usa termo vedado', () => {
    // Cobre o texto escrito direto em TSX, que o teste do conteúdo tipado (1.2) não vê. Um
    // comentário que cite um termo vedado também acusa: reescrever o comentário.
    const achados = codigo.flatMap((a) =>
      procurarTermosVedados(readFileSync(a, 'utf8')).map((termo) => `${relativo(a)}: ${termo}`),
    )
    expect(achados).toEqual([])
  })

  it('as famílias de fonte saem do next/font, não de nome solto', () => {
    const tokens = readFileSync(path.join(RAIZ_SITE, 'estilos', 'tokens.css'), 'utf8')
    expect(tokens).toContain('--fonte-titulo: var(--fonte-saira)')
    expect(tokens).toContain('--fonte-corpo: var(--fonte-barlow)')
    const fontes = readFileSync(path.join(RAIZ_SITE, 'fontes', 'index.ts'), 'utf8')
    expect(fontes).toContain("variable: '--fonte-saira'")
    expect(fontes).toContain("variable: '--fonte-barlow'")
  })
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-identidade.int.spec.ts`
Expected: os cinco testes de regras PASSAM (o helper existe); os cinco da varredura FALHAM no `beforeAll` com `ENOENT` em `src/site` (pasta ainda não existe). A listagem fica dentro do `beforeAll`, então a pasta ausente não derruba a coleta do arquivo.

- [ ] **Step 4: Copiar fontes, tokens e base do protótipo**

```powershell
$P = 'C:\Users\lekoc\semogapp\semogsite\design-explorations\site-v2-prototipo\src'
$WT = 'C:\Users\lekoc\semogapp\semogsite-site-v2'
New-Item -ItemType Directory -Force "$WT\src\site\fontes\arquivos", "$WT\src\site\estilos" | Out-Null
'Saira-VariableFont_wght-latin.woff2','Barlow-300-latin.woff2','Barlow-400-latin.woff2','Barlow-500-latin.woff2','Barlow-600-latin.woff2','Saira-OFL.txt','Barlow-OFL.txt' |
  ForEach-Object { Copy-Item -LiteralPath (Join-Path "$P\assets\fonts" $_) -Destination "$WT\src\site\fontes\arquivos" }
Copy-Item -LiteralPath "$P\styles\tokens.css" -Destination "$WT\src\site\estilos\tokens.css"
Copy-Item -LiteralPath "$P\styles\base.css" -Destination "$WT\src\site\estilos\base.css"
```

O arquivo `Saira-VariableFont_wght-latin-ext.woff2` fica de fora de propósito: o `next/font/local` não aceita `unicode-range` por arquivo (a opção `declarations` vale para a família inteira; conferido em `node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md`), e o subset latin cobre o português (spec 3.1).

- [ ] **Step 5: Ajustar `tokens.css` para as fontes do `next/font`**

Em `src/site/estilos/tokens.css`:
1. Apagar os seis blocos `@font-face { … }` (do primeiro `@font-face {` até o `}` que fecha o sexto, logo antes de `:root {`).
2. Trocar a linha `  --fonte-titulo: "Saira", "Segoe UI", system-ui, -apple-system, sans-serif;` por `  --fonte-titulo: var(--fonte-saira), "Segoe UI", system-ui, -apple-system, sans-serif;`
3. Trocar a linha `  --fonte-corpo: "Barlow", "Segoe UI", system-ui, -apple-system, sans-serif;` por `  --fonte-corpo: var(--fonte-barlow), "Segoe UI", system-ui, -apple-system, sans-serif;`
4. No comentário do topo, acrescentar a linha: `   Fontes: src/site/fontes (next/font/local), expostas como --fonte-saira e --fonte-barlow no <html>.`

`base.css` fica idêntico ao do protótipo.

- [ ] **Step 6: Escrever `src/site/fontes/index.ts`**

```ts
import localFont from 'next/font/local'

/**
 * Fontes do site v2, auto-hospedadas (as mesmas do protótipo). O next/font não aceita
 * `unicode-range` por arquivo, então entra só o subset latin, que cobre o português.
 * O nome da família muda no build (ex.: `__Saira_a1b2c3`): o CSS usa as variáveis abaixo
 * e o canvas usa `familiaDaFonte` (src/site/core/util.ts), nunca o nome "Saira".
 */
export const saira = localFont({
  src: './arquivos/Saira-VariableFont_wght-latin.woff2',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
  variable: '--fonte-saira',
})

export const barlow = localFont({
  src: [
    { path: './arquivos/Barlow-300-latin.woff2', weight: '300', style: 'normal' },
    { path: './arquivos/Barlow-400-latin.woff2', weight: '400', style: 'normal' },
    { path: './arquivos/Barlow-500-latin.woff2', weight: '500', style: 'normal' },
    { path: './arquivos/Barlow-600-latin.woff2', weight: '600', style: 'normal' },
  ],
  display: 'swap',
  variable: '--fonte-barlow',
})
```

- [ ] **Step 7: Tirar o CSS do site v2 do Biome**

Em `biome.json`, na lista `files.includes`, logo depois de `"!src/styles/**"`, acrescentar `"!src/site/**/*.css"`. Motivo (mesmo do `src/styles/**` que já está fora): o CSS é cópia literal do protótipo, guardado pelo teste de identidade; reformatar quebraria a comparação linha a linha com o protótipo nas portas da fase 4.

- [ ] **Step 8: Rodar e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-identidade.int.spec.ts`
Expected: PASS nos dez testes (cinco de regra e cinco de varredura).

- [ ] **Step 9: Checkpoint: rodar portões e commitar**

```powershell
pnpm exec biome check --write src/site tests/int/helpers/identidade.ts tests/int/site-v2-identidade.int.spec.ts
pnpm exec biome ci ./src ./tests ./scripts
pnpm exec tsc --noEmit
pnpm run check:server-actions
pnpm run test:int
pnpm build
git diff --stat origin/main...HEAD
git status --short
```

Expected: tudo verde; o `git status --short` mostra só `biome.json`, `src/site/` e os dois arquivos de teste, nada mais. (Prova de escopo: nesta tarefa o `git diff --stat origin/main...HEAD` está vazio porque ainda não há commit; a partir da próxima ele lista o acumulado.) Se algum arquivo fora dessa lista aparecer, parar e investigar antes de commitar.

```powershell
git branch --show-current && git add biome.json src/site/fontes src/site/estilos tests/int/helpers/identidade.ts tests/int/site-v2-identidade.int.spec.ts && git commit -m "feat(site-v2): fontes, tokens e guardas de identidade na CI

Fontes auto-hospedadas pelo next/font, tokens e base do protótipo, e o teste de
identidade que varre src/site e src/app/(site) (CSS, hex, next/link, reduced-motion e
termos vedados).

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
git status --short
```

Expected: o `git branch --show-current` imprime `feat/site-v2` (se imprimir outra, não commitar); o commit entra só com `biome.json`, `src/site/fontes/`, `src/site/estilos/` e os dois arquivos de teste; o `git status --short` final fica vazio. Sem push.

### Tarefa 1.2: Conteúdo tipado

**Files:**
- Create: `src/site/conteudo/conteudo.ts` (gerado uma vez a partir de `PROTOTIPO\src\conteudo.json`)
- Create: `src/site/formatar.ts`
- Create: `public/site-v2/fotos/` (12 `.webp`)
- Test: `tests/int/site-v2-conteudo.int.spec.ts`

**Interfaces:**
- Consumes: `textosDe`, `procurarTermosVedados` (Tarefa 1.1).
- Produces: `conteudo` (objeto `as const`) e `type Conteudo = typeof conteudo` em `@/site/conteudo/conteudo`; `formatarNumero(valor: number, casas?: number): string` e `formatarPercentual(fracao: number, casas?: number): string` em `@/site/formatar`. Links do conteúdo viram rotas (`/administradora-de-condominios-recife`) e fotos viram `/site-v2/fotos/<arquivo>.webp`.

- [ ] **Step 1: Escrever o teste**

`tests/int/site-v2-conteudo.int.spec.ts`:

```ts
import { existsSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { conteudo } from '@/site/conteudo/conteudo'
import { formatarNumero, formatarPercentual } from '@/site/formatar'
import { procurarTermosVedados, textosDe } from './helpers/identidade'

const TEXTOS = textosDe(conteudo)

describe('conteúdo tipado do site v2', () => {
  it('traz o conteúdo inteiro do protótipo, não um pedaço', () => {
    expect(Object.keys(conteudo)).toEqual([
      'marca',
      'numeros',
      'unidades',
      'unidadesSecao',
      'condominios',
      'pilares',
      'tecnologia',
      'ranking',
      'depoimentos',
      'comunidade',
      'proposta',
      'aSemog',
      'incorporadoras',
      'garantePagina',
      'gestaoPagina',
      'landing',
      'formulario',
      'cidades',
      'propostaPagina',
      'contatoPagina',
      'naoEncontrada',
    ])
    expect(TEXTOS.length).toBeGreaterThanOrEqual(800)
  })

  it('não sobra caminho do protótipo: nada de .html nem assets/', () => {
    expect(TEXTOS.filter((t) => /\.html(?:$|#)/.test(t) || t.startsWith('assets/'))).toEqual([])
  })

  it('toda foto citada existe em public/', () => {
    const fotos = TEXTOS.filter((t) => t.startsWith('/site-v2/'))
    expect(fotos.length).toBeGreaterThan(0)
    const faltando = fotos.filter((f) => !existsSync(path.join(process.cwd(), 'public', f)))
    expect(faltando).toEqual([])
  })

  it('nenhum texto usa termo vedado', () => {
    expect(TEXTOS.flatMap(procurarTermosVedados)).toEqual([])
  })

  it('o ranking é o aprovado: 5º entre mais de 3.500', () => {
    expect(conteudo.ranking.posicao).toBe(5)
    expect(formatarNumero(conteudo.ranking.total)).toBe('3.500')
    expect(conteudo.ranking.titulo).toBe('5º entre mais de 3.500 administradoras')
  })

  it('formata em pt-BR', () => {
    expect(formatarNumero(1234.5, 1)).toBe('1.234,5')
    expect(formatarPercentual(0.123)).toBe('12,3%')
  })

  it('marca inexistente é erro de tipo', () => {
    // @ts-expect-error a chave não existe; se passar a existir, o tsc acusa este comentário
    expect(conteudo.ranking.inexistente).toBeUndefined()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-conteudo.int.spec.ts`
Expected: FAIL com "Failed to resolve import '@/site/conteudo/conteudo'".

- [ ] **Step 3: Gerar `conteudo.ts` com um conversor de uso único (fora do repositório)**

`<scratchpad>\converter-conteudo.mjs`:

```js
import { readFileSync, writeFileSync } from 'node:fs'

const [origem, destino] = process.argv.slice(2)
if (!origem || !destino) throw new Error('Uso: node converter-conteudo.mjs <conteudo.json> <conteudo.ts>')
const bruto = JSON.parse(readFileSync(origem, 'utf8'))

/** Link do protótipo (x.html) vira rota; foto (assets/fotos/x) vira /site-v2/fotos/x. */
function converter(valor) {
  if (typeof valor === 'string') {
    if (/^[a-z0-9-]+\.html$/.test(valor)) return valor === 'index.html' ? '/' : `/${valor.slice(0, -5)}`
    if (valor.startsWith('assets/fotos/')) return `/site-v2/fotos/${valor.slice('assets/fotos/'.length)}`
    return valor
  }
  if (Array.isArray(valor)) return valor.map(converter)
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, converter(v)]))
  }
  return valor
}

const cabecalho = `/**
 * Textos e números do site v2: o único lugar dos fatos (substitui o conteudo.json do protótipo,
 * de onde foi gerado em 15/10/2026). Marca inexistente é erro de tipo. Fato novo entra aqui,
 * nunca escrito à mão numa seção ou cena. "A CONFIRMAR" marca o que ainda depende do Leandro.
 */
`
writeFileSync(destino, `${cabecalho}export const conteudo = ${JSON.stringify(converter(bruto), null, 2)} as const\n\nexport type Conteudo = typeof conteudo\n`)
```

```powershell
New-Item -ItemType Directory -Force C:\Users\lekoc\semogapp\semogsite-site-v2\src\site\conteudo | Out-Null
node <scratchpad>\converter-conteudo.mjs C:\Users\lekoc\semogapp\semogsite\design-explorations\site-v2-prototipo\src\conteudo.json C:\Users\lekoc\semogapp\semogsite-site-v2\src\site\conteudo\conteudo.ts
pnpm exec biome format --write src/site/conteudo/conteudo.ts
```

- [ ] **Step 4: Copiar as 12 fotos citadas**

```powershell
$origem = 'C:\Users\lekoc\semogapp\semogsite\design-explorations\site-v2-prototipo\src\assets\fotos'
$destino = 'C:\Users\lekoc\semogapp\semogsite-site-v2\public\site-v2\fotos'
New-Item -ItemType Directory -Force $destino | Out-Null
'belem.webp','belem-800.webp','cafe-condominio-marco-2026.webp','campina-grande.webp','campina-grande-800.webp','experience-2025-momento-1.webp','experience-2025-momento-2.webp','joao-pessoa.webp','joao-pessoa-800.webp','recife.webp','recife-800.webp','reconhecimento-semog.webp' |
  ForEach-Object { Copy-Item -LiteralPath (Join-Path $origem $_) -Destination $destino }
```

As fotos do blog e a da obra (Incorporadoras) entram nas fases 3 e 4, com as páginas que as usam.

- [ ] **Step 5: Escrever `src/site/formatar.ts`**

```ts
/** Número em pt-BR: "1.234" ou "1.234,5". Puro: serve a Server Component e a cena. */
export function formatarNumero(valor: number, casas = 0): string {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  })
}

/** Recebe fração: 0.123 → "12,3%". */
export function formatarPercentual(fracao: number, casas = 1): string {
  return fracao.toLocaleString('pt-BR', {
    style: 'percent',
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  })
}
```

- [ ] **Step 6: Rodar e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-conteudo.int.spec.ts`
Expected: PASS nos sete testes. Se "nenhum texto usa termo vedado" falhar, **não editar o texto**: listar o termo e o caminho no relatório da tarefa; é pendência de conteúdo do Leandro (spec 9).

- [ ] **Step 7: Checkpoint: rodar portões e commitar**

```powershell
pnpm exec biome check --write src/site tests/int/site-v2-conteudo.int.spec.ts
pnpm exec biome ci ./src ./tests ./scripts
pnpm exec tsc --noEmit
pnpm run check:server-actions
pnpm run test:int
pnpm build
git status --short
```

Expected: tudo verde. O `tsc` confirma o `@ts-expect-error` (se a chave existisse, ele acusaria o comentário sem uso). O `git status --short` lista só `src/site/conteudo/conteudo.ts`, `src/site/formatar.ts`, `public/site-v2/fotos/` e o teste; qualquer outro arquivo é falha de escopo.

```powershell
git branch --show-current && git add src/site/conteudo/conteudo.ts src/site/formatar.ts public/site-v2/fotos tests/int/site-v2-conteudo.int.spec.ts && git commit -m "feat(site-v2): conteúdo tipado e fotos do site v2

Conteúdo do protótipo convertido para módulo TypeScript tipado, formatadores e as 12
fotos em webp.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
git status --short
```

Expected: o `git branch --show-current` imprime `feat/site-v2` (se imprimir outra, não commitar); o commit entra só com `src/site/conteudo/conteudo.ts`, `src/site/formatar.ts`, `public/site-v2/fotos/` e o teste; o `git status --short` final fica vazio. Sem push.

### Tarefa 1.3: Inventário de URLs e redirects testados

**Files:**
- Create: `src/site/redirecionamentos.ts`
- Create: `src/site/inventario.ts`
- Modify: `next.config.ts` (o corpo de `redirects()` sai para `REDIRECIONAMENTOS`)
- Test: `tests/int/site-v2-inventario.int.spec.ts`

**Interfaces:**
- Consumes: `conteudo` (1.2), `textosDe` (1.1); `pages` de `@/../content/pages`, `CITY_LANDINGS` de `@/data/cityLandings`, `getAllPosts` de `@/lib/blog` (existentes).
- Produces: `REDIRECIONAMENTOS: Redirecionamento[]`; `type EntradaInventario`; `INVENTARIO: Readonly<Record<string, EntradaInventario>>`; `entradaDe(caminho: string): EntradaInventario | undefined`.

- [ ] **Step 1: Escrever o teste**

`tests/int/site-v2-inventario.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { pages } from '@/../content/pages'
import { CITY_LANDINGS } from '@/data/cityLandings'
import { getAllPosts } from '@/lib/blog'
import { conteudo } from '@/site/conteudo/conteudo'
import { entradaDe, INVENTARIO } from '@/site/inventario'
import { REDIRECIONAMENTOS } from '@/site/redirecionamentos'
import { textosDe } from './helpers/identidade'

/** As URLs que o site no ar serve hoje (fora dos grupos intocados). */
const ATUAIS = [
  ...Object.keys(pages).map((slug) => (slug === 'home' ? '/' : `/${slug}`)),
  ...Object.values(CITY_LANDINGS).map((cidade) => `/${cidade.slug}`),
  ...getAllPosts().map((post) => `/blog/${post.slug}`),
  '/experience',
  '/styleguide',
]
const SLUGS_DE_POST = new Set(getAllPosts().map((post) => post.slug))
/** Redirects de caminho fixo: sem condição de host e sem parâmetro (`:slug`). */
const FIXOS = REDIRECIONAMENTOS.filter((r) => !r.has && !r.source.includes(':'))

describe('inventário de URLs do site v2', () => {
  it('toda URL servida hoje tem destino declarado (nada some em silêncio)', () => {
    const semDestino = ATUAIS.filter((url) => entradaDe(url) === undefined)
    expect(semDestino).toEqual([])
    expect(ATUAIS.length).toBeGreaterThanOrEqual(30)
  })

  it('a decisão de 15/10: /solucoes é mantida e as outras duas URLs redirecionam para /tecnologia', () => {
    expect(entradaDe('/solucoes')).toEqual({ tipo: 'pagina', pacote: 'app', fase: 4 })
    expect(entradaDe('/prestacao-de-contas-condominio')).toEqual({
      tipo: 'redireciona',
      destino: '/tecnologia',
      fase: 4,
    })
    expect(entradaDe('/software-de-gestao-condominial')).toEqual({
      tipo: 'redireciona',
      destino: '/tecnologia',
      fase: 4,
    })
  })

  it('todo redirect do inventário cai numa página do inventário', () => {
    for (const [origem, entrada] of Object.entries(INVENTARIO)) {
      if (entrada.tipo !== 'redireciona') continue
      expect(entradaDe(entrada.destino)?.tipo, origem).toBe('pagina')
    }
  })

  it('os grupos intocados e a prévia estão declarados como tais', () => {
    for (const url of ['/experience', '/qr/folder', '/desfecho/abc', '/api/track/whatsapp']) {
      expect(entradaDe(url), url).toEqual({ tipo: 'intocada' })
    }
    expect(entradaDe('/previa-v2')).toEqual({ tipo: 'previa' })
  })

  it('todo link interno do conteúdo aponta para uma página do inventário', () => {
    const links = textosDe(conteudo).filter((t) => t.startsWith('/') && !t.startsWith('/site-v2/'))
    expect(links.length).toBeGreaterThan(0)
    for (const link of links) expect(entradaDe(link.split('#')[0] || '/')?.tipo, link).toBe('pagina')
  })
})

describe('redirects do site (movidos do next.config.ts)', () => {
  it('os 54 continuam todos lá', () => {
    expect(REDIRECIONAMENTOS).toHaveLength(54)
    expect(REDIRECIONAMENTOS[0]).toMatchObject({
      source: '/:path*',
      destination: 'https://www.semog.com.br/:path*',
      permanent: true,
    })
    expect(REDIRECIONAMENTOS.every((r) => r.permanent === true)).toBe(true)
  })

  it('nenhuma página do inventário é origem de redirect', () => {
    expect(FIXOS.filter((r) => entradaDe(r.source)?.tipo === 'pagina').map((r) => r.source)).toEqual(
      [],
    )
  })

  it('todo destino de redirect existe e é página ou rota intocada (post do blog incluído)', () => {
    for (const r of FIXOS) {
      const entrada = entradaDe(r.destination)
      expect(['pagina', 'intocada'], `${r.source} → ${r.destination}`).toContain(entrada?.tipo)
      if (r.destination.startsWith('/blog/')) {
        expect(SLUGS_DE_POST.has(r.destination.slice('/blog/'.length)), r.destination).toBe(true)
      }
    }
  })

  it('não há cadeia hoje', () => {
    const origens = new Set(FIXOS.map((r) => r.source))
    expect(FIXOS.filter((r) => origens.has(r.destination)).map((r) => r.source)).toEqual([])
  })

  // Com /solucoes mantida como página, `/solucoes.html` e `/domestica` (que apontam para ela)
  // não formam cadeia com nenhum redirect planejado: o teste acima já cobre.
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-inventario.int.spec.ts`
Expected: FAIL com "Failed to resolve import '@/site/inventario'".

- [ ] **Step 3: Criar `src/site/redirecionamentos.ts` movendo o corpo do `next.config.ts`**

Criar o arquivo com este esqueleto:

```ts
import type { NextConfig } from 'next'

type Redirecionamento = Awaited<ReturnType<NonNullable<NextConfig['redirects']>>>[number]

/**
 * Os 54 redirects do site. Saíram do `next.config.ts` na fase 1 do site v2 para o inventário
 * de URLs poder testá-los (tests/int/site-v2-inventario.int.spec.ts). O `next.config.ts`
 * importa daqui por caminho relativo: o carregador do Next transpila o config e os `.ts` que
 * ele importa, mas sem os aliases do tsconfig, então nada de `@/` neste arquivo.
 */
export const REDIRECIONAMENTOS: Redirecionamento[] = []
```

Depois, em `next.config.ts`, **recortar** o array literal que `redirects()` devolve (do `[` logo depois de `return` até o `]` que o fecha, com todos os comentários dentro) e colá-lo no lugar do `[]` de `REDIRECIONAMENTOS`. Nenhuma entrada muda, nenhuma é reordenada.

- [ ] **Step 4: Fazer o `next.config.ts` usar o módulo**

No topo de `next.config.ts`, depois de `import { fileURLToPath } from 'url'`:

```ts
import { REDIRECIONAMENTOS } from './src/site/redirecionamentos'
```

E o método vira:

```ts
  async redirects() {
    return REDIRECIONAMENTOS
  },
```

- [ ] **Step 5: Criar `src/site/inventario.ts`**

```ts
/**
 * Inventário das URLs públicas e do que cada uma vira no site v2 (spec, seção 6). Fonte do
 * sitemap e do OG a partir da fase 3; até lá, só os testes o leem. Toda URL que o site serve
 * hoje precisa estar aqui, como página, redirect, removida ou intocada.
 */
export type Pacote = 'app' | 'landing' | 'leitura'
export type Fase = 3 | 4 | 6 | 7

export type EntradaInventario =
  | { tipo: 'pagina'; pacote: Pacote; fase: Fase; nova?: true }
  | { tipo: 'redireciona'; destino: string; fase: Fase }
  | { tipo: 'removida'; fase: Fase }
  | { tipo: 'intocada' }
  | { tipo: 'previa' }

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
}

/** Todo post do blog (`/blog/<slug>`) vira página de leitura na fase 3. */
const POST_DO_BLOG: EntradaInventario = { tipo: 'pagina', pacote: 'leitura', fase: 3 }

/** Rotas de outros grupos que o site v2 não toca (spec 6). Terminado em "/" é prefixo. */
const INTOCADAS = ['/experience', '/qr/', '/desfecho/', '/api/'] as const

export function entradaDe(caminho: string): EntradaInventario | undefined {
  if (Object.hasOwn(INVENTARIO, caminho)) return INVENTARIO[caminho]
  if (/^\/blog\/[a-z0-9-]+$/.test(caminho)) return POST_DO_BLOG
  const intocada = INTOCADAS.some((rota) =>
    rota.endsWith('/') ? caminho.startsWith(rota) : caminho === rota,
  )
  return intocada ? { tipo: 'intocada' } : undefined
}
```

- [ ] **Step 6: Rodar e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-inventario.int.spec.ts`
Expected: PASS nos nove testes (cinco de inventário e quatro de redirects). Se "os 54 continuam todos lá" falhar, a cópia do Step 3 perdeu ou duplicou entrada: comparar com `git show origin/main:next.config.ts`.

- [ ] **Step 7: Provar que o Next carrega o config com o import e que os redirects respondem**

```powershell
pnpm build
$servidor = Start-Process -PassThru -NoNewWindow node -ArgumentList 'node_modules/next/dist/bin/next','start','-p','3100'
Start-Sleep -Seconds 8
curl.exe -s -o NUL -w "%{http_code} %{redirect_url}`n" http://localhost:3100/solucoes.html
curl.exe -s -o NUL -w "%{http_code} %{redirect_url}`n" http://localhost:3100/administradora-de-condominio-belem
curl.exe -s -o NUL -w "%{http_code}`n" http://localhost:3100/solucoes
Stop-Process -Id $servidor.Id
```

Expected: `308 http://localhost:3100/solucoes`, `308 http://localhost:3100/administradora-de-condominios-belem`, `200`. Se o build falhar com "Failed to transpile next.config.ts" ou "Cannot find module './src/site/redirecionamentos'", parar e reportar (o carregador legado do Next 16.2.6, `node_modules/next/dist/build/next-config-ts/require-hook.js`, registra `.ts` no `require`; um erro aqui significa que o carregador nativo foi ligado e muda a premissa).

- [ ] **Step 8: Checkpoint: rodar portões e commitar**

```powershell
pnpm exec biome check --write src/site tests/int/site-v2-inventario.int.spec.ts next.config.ts
pnpm exec biome ci ./src ./tests ./scripts
pnpm exec tsc --noEmit
pnpm run check:server-actions
pnpm run test:int
pnpm build
git status --short
```

Expected: tudo verde; `tests/int/sitemap.int.spec.ts` continua passando (o sitemap atual não mudou). O `git status --short` lista só `src/site/redirecionamentos.ts`, `src/site/inventario.ts`, `next.config.ts` e o teste; qualquer outro arquivo é falha de escopo.

```powershell
git branch --show-current && git add src/site/redirecionamentos.ts src/site/inventario.ts next.config.ts tests/int/site-v2-inventario.int.spec.ts && git commit -m "feat(site-v2): inventário de URLs e redirects testados

Os 54 redirects saem do next.config.ts para um módulo testável e o inventário declara
o destino de cada URL (a /solucoes é mantida como página própria).

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
git status --short
```

Expected: o `git branch --show-current` imprime `feat/site-v2` (se imprimir outra, não commitar); o commit entra só com `src/site/redirecionamentos.ts`, `src/site/inventario.ts`, `next.config.ts` e o teste; o `git status --short` final fica vazio. Sem push.

### Tarefa 1.4: Dependências, utilidades das cenas e patamares de toque

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`
- Create: `src/site/core/ganchos.ts`, `src/site/core/patamares.ts`, `src/site/core/util.ts`
- Test: `tests/int/site-v2-util.int.spec.ts`

**Interfaces:**
- Consumes: `formatarNumero`, `formatarPercentual` (1.2).
- Produces:
  - `ganchos.ts`: `type Reportar = (erro: unknown, origem: string) => void` (o mesmo tipo que `ContextoCena.reportar` e `montarPagina` usam), `aoImprimir(gancho: () => void): () => void`, `executarGanchosImpressao(reportar: Reportar): void`, `registrarDesligamento(desligar: () => void): () => void`, `desligarTudo(): unknown[]`.
  - `patamares.ts`: `soToque(): boolean`, `pausasDaTimeline(tl: gsap.core.Timeline): number[]`, `snapNaDirecao(pontos: number[], valor: number, direcao?: number): number`, `type SnapDePatamares`, `snapPatamares(progressos: () => number[], toque?: boolean): SnapDePatamares | undefined`.
  - `util.ts` (é o `ctx.util` das cenas): `estreito`, `dprMaximo`, `type Pintura = { ctx: CanvasRenderingContext2D; w: number; h: number }`, `prepararCanvas2D`, `corDoToken(nome: string): [number, number, number]`, `familiaDaFonte(token: '--fonte-saira' | '--fonte-barlow'): string`, `aoRolar(callback, lenis?): () => void`, `lacoVisivel(root, desenhar): () => void`, `relogioVisivel(root, segundos, aoTicar, aoAlternar?): gsap.core.Tween`, `contador`, `entrarEmLote`, `revelarTexto`, `revelarQuadro(quadro: HTMLElement, reportar: Reportar): gsap.core.Timeline | null`, `trocarTexto`, `type OpcoesPin`, `pinScrub(root, opcoes?): gsap.core.Timeline`, e reexporta `formatarNumero`, `formatarPercentual`, `aoImprimir`, `soToque`, `pausasDaTimeline`, `snapPatamares`. `criarDinamica` (WebGL) **não** entra: só a cena dos princípios (A Semog) usa, e ela vem na fase 4.

- [ ] **Step 1: Instalar as versões exatas**

```powershell
pnpm add gsap@3.15.0 lenis@1.3.26 @gsap/react@2.1.2 --save-exact
```

Expected: `package.json` com `"gsap": "3.15.0"`, `"lenis": "1.3.26"`, `"@gsap/react": "2.1.2"`. O `LenisProvider` antigo continua funcionando: na 1.3.26 o padrão `respectReducedMotion: true` só vale quando o Lenis é criado, e o provider antigo nem cria o Lenis sob reduced-motion.

- [ ] **Step 2: Escrever o teste**

`tests/int/site-v2-util.int.spec.ts`:

```ts
import { gsap } from 'gsap'
import { afterEach, describe, expect, it } from 'vitest'
import {
  aoImprimir,
  desligarTudo,
  executarGanchosImpressao,
  registrarDesligamento,
} from '@/site/core/ganchos'
import { pausasDaTimeline, snapNaDirecao, snapPatamares } from '@/site/core/patamares'
import { aoRolar, corDoToken, familiaDaFonte, revelarQuadro } from '@/site/core/util'

afterEach(() => {
  desligarTudo()
  document.documentElement.removeAttribute('style')
})

describe('patamares de leitura tirados da coreografia', () => {
  const alvo = { x: 0, y: 0 }

  it('o meio de cada pausa vira patamar, mais o começo e o fim', () => {
    const tl = gsap.timeline({ paused: true })
    tl.to(alvo, { x: 1, duration: 1 }, 0)
      .to({}, { duration: 1 }, 1)
      .to(alvo, { x: 2, duration: 1 }, 2)
    expect(pausasDaTimeline(tl)).toEqual([0, 0.5, 1])
  })

  it('movimento marcado como respiro não desfaz a pausa; sem a marca, desfaz', () => {
    const comRespiro = gsap.timeline({ paused: true })
    comRespiro
      .to(alvo, { x: 1, duration: 1 }, 0)
      .to(alvo, { y: 1, duration: 1, data: 'respiro' }, 1)
      .to(alvo, { x: 2, duration: 1 }, 2)
    expect(pausasDaTimeline(comRespiro)).toEqual([0, 0.5, 1])

    const semRespiro = gsap.timeline({ paused: true })
    semRespiro
      .to(alvo, { x: 1, duration: 1 }, 0)
      .to(alvo, { y: 1, duration: 1 }, 1)
      .to(alvo, { x: 2, duration: 1 }, 2)
    expect(pausasDaTimeline(semRespiro)).toEqual([0, 1])
  })

  it('timeline aninhada conta no tempo da raiz; timeline vazia vira [0, 1]', () => {
    const filha = gsap.timeline().to(alvo, { x: 1, duration: 1 })
    const raiz = gsap.timeline({ paused: true })
    raiz.add(filha, 0).to(alvo, { x: 2, duration: 1 }, 2)
    expect(pausasDaTimeline(raiz)).toEqual([0, 0.5, 1])
    expect(pausasDaTimeline(gsap.timeline({ paused: true }))).toEqual([0, 1])
  })

  it('o snap anda na direção do gesto', () => {
    expect(snapNaDirecao([0, 0.5, 1], 0.4, 1)).toBe(0.5)
    expect(snapNaDirecao([0, 0.5, 1], 0.4, -1)).toBe(0)
  })

  it('sem toque não há snap; com toque, sem inércia somada e com duração curta', () => {
    expect(snapPatamares(() => [0, 1], false)).toBeUndefined()
    const snap = snapPatamares(() => [0, 0.5, 1], true)
    expect(snap).toMatchObject({ inertia: false, duration: { min: 0.25, max: 0.6 }, delay: 0.08 })
  })
})

describe('ganchos de desmonte e de impressão', () => {
  it('registrarDesligamento roda uma vez só, mesmo chamado de novo', () => {
    let vezes = 0
    const desligar = registrarDesligamento(() => {
      vezes += 1
    })
    desligar()
    desligar()
    expect(desligarTudo()).toEqual([])
    expect(vezes).toBe(1)
  })

  it('desligarTudo devolve os erros e esquece os ganchos de impressão', () => {
    let impressos = 0
    aoImprimir(() => {
      impressos += 1
    })
    registrarDesligamento(() => {
      throw new Error('falhou ao desligar')
    })
    expect(desligarTudo()).toHaveLength(1)
    executarGanchosImpressao(() => undefined)
    expect(impressos).toBe(0)
  })

  it('gancho de impressão que falha é reportado e não impede os outros', () => {
    const reportados: Array<[unknown, string]> = []
    let rodou = false
    aoImprimir(() => {
      throw new Error('gancho ruim')
    })
    aoImprimir(() => {
      rodou = true
    })
    executarGanchosImpressao((erro, origem) => reportados.push([erro, origem]))
    expect(rodou).toBe(true)
    expect(reportados).toHaveLength(1)
    expect(reportados[0]?.[1]).toBe('impressão')
  })
})

describe('utilidades das cenas', () => {
  it('revelarQuadro sem .moldura > img reporta a falha e devolve null (não só console)', () => {
    const reportados: Array<[unknown, string]> = []
    const quadro = document.createElement('figure')
    expect(revelarQuadro(quadro, (erro, origem) => reportados.push([erro, origem]))).toBeNull()
    expect(reportados).toHaveLength(1)
    expect(reportados[0]?.[1]).toBe('quadro')
  })

  it('aoRolar chama no máximo uma vez por quadro e para depois de desligar', () => {
    let chamadas = 0
    const desligar = aoRolar(() => {
      chamadas += 1
    })
    gsap.ticker.tick()
    expect(chamadas).toBe(1)
    gsap.ticker.tick()
    expect(chamadas).toBe(1)
    window.dispatchEvent(new Event('scroll'))
    window.dispatchEvent(new Event('scroll'))
    gsap.ticker.tick()
    expect(chamadas).toBe(2)
    desligar()
    window.dispatchEvent(new Event('scroll'))
    gsap.ticker.tick()
    expect(chamadas).toBe(2)
  })

  it('corDoToken lê o hex do :root; token que não é hex de 6 dígitos é erro', () => {
    document.documentElement.style.setProperty('--marinho', '#1b2d70')
    expect(corDoToken('--marinho')).toEqual([27, 45, 112])
    expect(() => corDoToken('--inexistente')).toThrow(/não é hex/)
  })

  it('familiaDaFonte devolve a família real do next/font e acusa variável ausente', () => {
    document.documentElement.style.setProperty(
      '--fonte-saira',
      "'__Saira_a1b2c3', '__Saira_Fallback_a1b2c3'",
    )
    expect(familiaDaFonte('--fonte-saira')).toBe("'__Saira_a1b2c3', '__Saira_Fallback_a1b2c3'")
    expect(() => familiaDaFonte('--fonte-barlow')).toThrow(/vazio/)
  })
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-util.int.spec.ts`
Expected: FAIL com "Failed to resolve import '@/site/core/ganchos'".

- [ ] **Step 4: Escrever `src/site/core/ganchos.ts`**

```ts
/**
 * Registro do que precisa ser desfeito quando a página desmonta, e dos ganchos de impressão.
 * O protótipo pressupunha um documento novo por página; no Next o runner desmonta (StrictMode
 * em dev, troca de rota no futuro) e o que não é GSAP (listener, ticker, observer) fica aqui.
 */
export type Reportar = (erro: unknown, origem: string) => void

const ganchosImpressao = new Set<() => void>()
const desligamentos = new Set<() => void>()

/** Registra o que deve acontecer antes de imprimir (ex.: escrever o valor final). */
export function aoImprimir(gancho: () => void): () => void {
  ganchosImpressao.add(gancho)
  return () => {
    ganchosImpressao.delete(gancho)
  }
}

/** Uso do core/impressao.ts. Um gancho que falha é reportado (Sentry) e não impede os outros. */
export function executarGanchosImpressao(reportar: Reportar): void {
  for (const gancho of ganchosImpressao) {
    try {
      gancho()
    } catch (erro) {
      reportar(erro, 'impressão')
    }
  }
}

/** Guarda `desligar` para o desmonte e devolve uma versão que roda uma vez só. */
export function registrarDesligamento(desligar: () => void): () => void {
  let feito = false
  const umaVez = () => {
    if (feito) return
    feito = true
    desligamentos.delete(umaVez)
    desligar()
  }
  desligamentos.add(umaVez)
  return umaVez
}

/** Desliga tudo o que foi registrado e esquece os ganchos de impressão. Devolve os erros. */
export function desligarTudo(): unknown[] {
  const erros: unknown[] = []
  for (const desligar of [...desligamentos]) {
    try {
      desligar()
    } catch (erro) {
      erros.push(erro)
    }
  }
  desligamentos.clear()
  ganchosImpressao.clear()
  return erros
}
```

- [ ] **Step 5: Escrever `src/site/core/patamares.ts`**

```ts
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * Snap direcional nos patamares de leitura das cenas presas, só em aparelho só de toque
 * (spec 3.2). No dedo, o arrasto tem inércia nativa e atravessa os patamares; a roda do mouse
 * anda em passos e não precisa. Portado de core/util.js do protótipo, onde foi medido com
 * scripts/toque-flicks.mjs.
 */

/** "(hover: none), (pointer: coarse)". Notebook com tela de toque e mouse dá 2 e fica de fora. */
export function soToque(): boolean {
  return ScrollTrigger.isTouch === 1
}

/** Pausa menor que esta fração da timeline não é patamar de leitura (é respiro de cascata). */
const PAUSA_MINIMA = 0.01
/** Opções de tween que não animam nada: um `.to({}, { duration })` só ocupa tempo. */
const CHAVES_DE_CONTROLE = new Set([
  'duration',
  'ease',
  'delay',
  'immediateRender',
  'overwrite',
  'data',
  'id',
  'callbackScope',
  'onStart',
  'onUpdate',
  'onComplete',
])

type Trecho = [inicio: number, fim: number]

/** Trechos em que algum tween anima, no tempo da raiz. `data: "respiro"` não conta. */
function trechosAnimados(tl: gsap.core.Timeline, deslocamento = 0, saida: Trecho[] = []): Trecho[] {
  for (const filho of tl.getChildren(false, true, true)) {
    const inicio = deslocamento + filho.startTime()
    if (filho instanceof gsap.core.Timeline) {
      trechosAnimados(filho, inicio, saida)
    } else if (
      filho.totalDuration() > 0 &&
      filho.vars.data !== 'respiro' &&
      Object.keys(filho.vars).some((chave) => !CHAVES_DE_CONTROLE.has(chave))
    ) {
      saida.push([inicio, inicio + filho.totalDuration()])
    }
  }
  return saida
}

/**
 * Patamares tirados da coreografia: o meio de cada pausa da timeline, em progresso (0 a 1),
 * mais o começo e o fim do pin.
 */
export function pausasDaTimeline(tl: gsap.core.Timeline): number[] {
  const total = tl.duration()
  if (!(total > 0)) return [0, 1]
  const trechos = trechosAnimados(tl).sort((a, b) => a[0] - b[0])
  const pontos = [0, 1]
  let livreDesde = 0
  for (const [inicio, fim] of [...trechos, [total, total] satisfies Trecho]) {
    if (inicio - livreDesde >= total * PAUSA_MINIMA && livreDesde > 0 && inicio < total) {
      pontos.push((livreDesde + inicio) / 2 / total)
    }
    livreDesde = Math.max(livreDesde, fim)
  }
  return pontos.sort((a, b) => a - b)
}

/** O patamar seguinte na direção do gesto (1 para a frente, -1 para trás). */
export function snapNaDirecao(pontos: number[], valor: number, direcao?: number): number {
  return ScrollTrigger.snapDirectional(pontos)(valor, direcao)
}

export type SnapDePatamares = {
  snapTo: (valor: number, self?: ScrollTrigger) => number
  inertia: false
  duration: { min: number; max: number }
  delay: number
  ease: string
}

/**
 * Snap para o `scrollTrigger.snap` de um pin. Fora do toque devolve undefined (sem snap).
 * `toque` existe para o teste; em uso, vem de `soToque()`.
 */
export function snapPatamares(
  progressos: () => number[],
  toque: boolean = soToque(),
): SnapDePatamares | undefined {
  if (!toque) return undefined
  return {
    snapTo: (valor, self) => snapNaDirecao(progressos(), valor, self?.direction),
    // A inércia do dedo já aconteceu (nativa). Sem isto o ScrollTrigger soma outra, medida pelo
    // progresso da animação, que com scrub ainda corre atrás da rolagem: o snap pulava patamares.
    inertia: false,
    duration: { min: 0.25, max: 0.6 },
    delay: 0.08,
    ease: 'power2.out',
  }
}
```

- [ ] **Step 6: Escrever `src/site/core/util.ts`**

Porta de `PROTOTIPO\src\core\util.js` com três mudanças: nada roda no topo do módulo (a consulta de tela estreita é preguiçosa, para o SSR), tudo o que liga listener ou ticker se registra em `registrarDesligamento`, e entra `familiaDaFonte` (o `next/font` troca o nome da família, e as cenas de canvas da fase 4 escrevem "Saira").

```ts
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import type Lenis from 'lenis'
import { formatarNumero, formatarPercentual } from '../formatar'
import { aoImprimir, type Reportar, registrarDesligamento } from './ganchos'
import { pausasDaTimeline, snapPatamares, soToque } from './patamares'

/* Utilidades das cenas (ctx.util). Tudo que anda por quadro usa o ticker do GSAP (um único
   requestAnimationFrame na página). */

export { aoImprimir, formatarNumero, formatarPercentual, pausasDaTimeline, snapPatamares, soToque }

/* ---- Tela ---------------------------------------------------------------------- */

let consultaEstreita: MediaQueryList | null = null

/** Verdadeiro em tela estreita (até 760px), lido na hora. */
export function estreito(): boolean {
  consultaEstreita ??= window.matchMedia('(max-width: 760px)')
  return consultaEstreita.matches
}

/** Densidade de pixels limitada: 1,5 no celular, 2 no desktop. */
export function dprMaximo(): number {
  return Math.min(window.devicePixelRatio || 1, estreito() ? 1.5 : 2)
}

export type Pintura = { ctx: CanvasRenderingContext2D; w: number; h: number }

/** Ajusta o canvas 2D ao tamanho exibido, com DPR limitado; medidas em pixels CSS. */
export function prepararCanvas2D(canvas: HTMLCanvasElement): Pintura {
  const caixa = canvas.getBoundingClientRect()
  const dpr = dprMaximo()
  canvas.width = Math.max(1, Math.round(caixa.width * dpr))
  canvas.height = Math.max(1, Math.round(caixa.height * dpr))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D indisponível.')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return { ctx, w: caixa.width, h: caixa.height }
}

/** Cor de um token hex do :root como [r, g, b] (0–255), para canvas e shader. */
export function corDoToken(nome: string): [number, number, number] {
  const valor = getComputedStyle(document.documentElement).getPropertyValue(nome).trim()
  const achado = /^#([0-9a-f]{6})$/i.exec(valor)
  if (!achado) throw new Error(`Token ${nome} não é hex de 6 dígitos: "${valor}".`)
  const n = Number.parseInt(achado[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Família real de uma fonte do next/font (o nome muda no build), para `ctx.font` do canvas. */
export function familiaDaFonte(token: '--fonte-saira' | '--fonte-barlow'): string {
  const valor = getComputedStyle(document.documentElement).getPropertyValue(token).trim()
  if (!valor) throw new Error(`Token ${token} vazio: o next/font não aplicou a variável no <html>.`)
  return valor
}

/* ---- Rolagem e laços ----------------------------------------------------------- */

/** Chama `callback` no máximo uma vez por quadro enquanto houver rolagem ou resize. */
export function aoRolar(callback: () => void, lenis: Lenis | null = null): () => void {
  let sujo = true
  const marcar = () => {
    sujo = true
  }
  const tique = () => {
    if (!sujo) return
    sujo = false
    callback()
  }
  window.addEventListener('scroll', marcar, { passive: true })
  window.addEventListener('resize', marcar)
  const desligarLenis = lenis ? lenis.on('scroll', marcar) : () => {}
  gsap.ticker.add(tique)
  return registrarDesligamento(() => {
    window.removeEventListener('scroll', marcar)
    window.removeEventListener('resize', marcar)
    desligarLenis()
    gsap.ticker.remove(tique)
  })
}

/** Laço de desenho no ticker que só roda com o root na tela e a aba visível. */
export function lacoVisivel(root: Element, desenhar: (tempo: number) => void): () => void {
  let ativo = ScrollTrigger.isInViewport(root)
  const gatilho = ScrollTrigger.create({
    trigger: root,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => {
      ativo = self.isActive
    },
  })
  const tique = (tempo: number) => {
    if (ativo && !document.hidden) desenhar(tempo)
  }
  gsap.ticker.add(tique)
  return registrarDesligamento(() => {
    gsap.ticker.remove(tique)
    gatilho.kill()
  })
}

/** Relógio que só anda com o root na tela e a aba visível (carrosséis, rodízios). */
export function relogioVisivel(
  root: Element,
  segundos: number,
  aoTicar: () => void,
  aoAlternar?: (pausado: boolean) => void,
): gsap.core.Tween {
  let visivel = ScrollTrigger.isInViewport(root)
  const relogio = gsap.to(
    {},
    { duration: segundos, repeat: -1, onRepeat: aoTicar, paused: !visivel },
  )
  const atualizar = () => {
    const pausado = document.hidden || !visivel
    if (relogio.paused() === pausado) return
    relogio.paused(pausado)
    aoAlternar?.(pausado)
  }
  ScrollTrigger.create({
    trigger: root,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => {
      visivel = self.isActive
      atualizar()
    },
  })
  document.addEventListener('visibilitychange', atualizar)
  registrarDesligamento(() => document.removeEventListener('visibilitychange', atualizar))
  return relogio
}

/* ---- Entradas ------------------------------------------------------------------ */

export type OpcoesContador = {
  para: number
  de?: number
  formatar?: (valor: number) => string
  inteiro?: boolean
  duracao?: number
  gatilho?: Element | false
  inicio?: string
}

/** Conta de `de` até `para` em `el`. O HTML traz o valor final, para leitura sem JS. */
export function contador(el: HTMLElement, opcoes: OpcoesContador): gsap.core.Tween {
  const { para, de = 0, formatar = formatarNumero, inteiro = true, duracao = 1.4 } = opcoes
  const { gatilho = el, inicio = 'top 85%' } = opcoes
  if (!Number.isFinite(para) || !Number.isFinite(de)) {
    throw new TypeError("contador: 'para' e 'de' precisam ser números finitos.")
  }
  const estado = { valor: de }
  const escrever = (v: number) => {
    el.textContent = formatar(inteiro ? Math.round(v) : v)
  }
  const tween = gsap.to(estado, {
    valor: para,
    duration: duracao,
    ease: 'power2.out',
    onStart: () => escrever(de),
    onUpdate: () => escrever(estado.valor),
    onComplete: () => escrever(para),
    scrollTrigger: gatilho ? { trigger: gatilho, start: inicio, once: true } : undefined,
  })
  aoImprimir(() => {
    tween.progress(1)
    escrever(para)
  })
  return tween
}

export type OpcoesLote = {
  animar: (tl: gsap.core.Timeline, item: HTMLElement) => void
  inicio?: string
  cascata?: number
}

/** Cada item anima quando ELE entra na tela; os da mesma linha entram em cascata. */
export function entrarEmLote(alvos: gsap.DOMTarget, opcoes: OpcoesLote): gsap.core.Timeline[] {
  const { animar, inicio = 'top 85%', cascata = 0.12 } = opcoes
  const itens = gsap.utils.toArray<HTMLElement>(alvos)
  const entradas = itens.map((item) => {
    const tl = gsap.timeline({ paused: true })
    animar(tl, item)
    return tl
  })
  if (!itens.length) return entradas
  ScrollTrigger.batch(itens, {
    start: inicio,
    once: true,
    onEnter: (lote) => {
      lote.forEach((item, i) => {
        const tl = item instanceof HTMLElement ? entradas[itens.indexOf(item)] : undefined
        // play() numa timeline já no fim não faz nada: nada pisca de volta.
        if (tl) gsap.delayedCall(i * cascata, () => tl.play())
      })
    },
  })
  aoImprimir(() => {
    for (const tl of entradas) tl.progress(1)
  })
  return entradas
}

export type OpcoesRevelacao = {
  tipo?: 'linhas' | 'palavras'
  gatilho?: Element | false
  inicio?: string
  scrub?: boolean | number
  fim?: string
  duracao?: number
  stagger?: number
  atraso?: number
}

/**
 * Toca uma vez e não volta, SEM `once`: o SplitText recria este gatilho quando a fonte chega
 * ou a largura muda, às vezes com a página já rolada, e um `once` que já passou se mata no meio
 * do refresh (o GSAP lê `.end` de um índice que sumiu). Com toggleActions ele fica vivo.
 */
function gatilhoRevelacao(gatilho: Element | false, o: OpcoesRevelacao) {
  if (!gatilho) return undefined
  const base = { trigger: gatilho, start: o.inicio ?? 'top 80%' }
  if (o.scrub === undefined || o.scrub === false) {
    return { ...base, toggleActions: 'play none none none' }
  }
  return { ...base, end: o.fim ?? 'bottom 45%', scrub: o.scrub === true ? 1 : o.scrub }
}

/** Peso variável de 250 a 650 nos `.peso` de dentro do elemento, na mesma timeline. */
function animarPesos(tl: gsap.core.Timeline, el: HTMLElement): void {
  const pesos = el.querySelectorAll('.peso')
  if (!pesos.length) return
  tl.fromTo(
    pesos,
    { fontVariationSettings: '"wght" 250' },
    { fontVariationSettings: '"wght" 650', duration: 1.5, ease: 'power2.inOut' },
    0.45,
  )
}

/** Revela texto por máscara, linha a linha ou palavra a palavra; refaz sozinho ao mudar a largura. */
export function revelarTexto(el: HTMLElement, opcoes: OpcoesRevelacao = {}): SplitText {
  const porLinha = (opcoes.tipo ?? 'linhas') === 'linhas'
  const { gatilho = el, duracao = 0.9, atraso = 0 } = opcoes
  let atual: gsap.core.Timeline | null = null
  aoImprimir(() => atual?.progress(1))
  return SplitText.create(el, {
    type: porLinha ? 'lines' : 'words',
    mask: porLinha ? 'lines' : 'words',
    autoSplit: true,
    linesClass: 'revela-linha',
    wordsClass: 'revela-palavra',
    onSplit(self) {
      atual = gsap.timeline({ delay: atraso, scrollTrigger: gatilhoRevelacao(gatilho, opcoes) })
      atual.from(porLinha ? self.lines : self.words, {
        yPercent: 110,
        duration: duracao,
        ease: 'expo.out',
        stagger: opcoes.stagger ?? (porLinha ? 0.08 : 0.04),
      })
      animarPesos(atual, el)
      return atual
    },
  })
}

/** Quadro de foto: a moldura abre de baixo, a imagem assenta de um zoom e tem parallax. */
export function revelarQuadro(quadro: HTMLElement, reportar: Reportar): gsap.core.Timeline | null {
  const moldura = quadro.querySelector('.moldura')
  const imagem = moldura?.querySelector('img')
  if (!moldura || !imagem) {
    // A cena chama `ctx.reportar`: a origem final fica `cena:<id>:quadro` no Sentry.
    reportar(new Error('[revelarQuadro] quadro sem .moldura > img.'), 'quadro')
    return null
  }
  const tl = gsap
    .timeline({ scrollTrigger: { trigger: quadro, start: 'top 82%', once: true } })
    .fromTo(
      moldura,
      { clipPath: 'inset(100% 0% 0% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut' },
    )
    .from(imagem, { scale: 1.3, duration: 1.8, ease: 'expo.out' }, 0.2)
  const legenda = quadro.querySelector('figcaption')
  if (legenda) {
    tl.from(legenda, { yPercent: 40, autoAlpha: 0, duration: 0.9, ease: 'expo.out' }, 0.9)
  }
  gsap.fromTo(
    imagem,
    { yPercent: -5 },
    {
      yPercent: 5,
      ease: 'none',
      scrollTrigger: { trigger: moldura, start: 'top bottom', end: 'bottom top', scrub: 0.7 },
    },
  )
  aoImprimir(() => tl.progress(1))
  return tl
}

/** Troca um texto curto por máscara. O pai precisa ter overflow: clip. */
export function trocarTexto(el: HTMLElement, texto: string): gsap.core.Timeline {
  return gsap
    .timeline()
    .to(el, { yPercent: -110, duration: 0.5, ease: 'expo.in' })
    .call(() => {
      el.textContent = texto
    })
    .fromTo(el, { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: 'expo.out' })
}

/* ---- Pin ----------------------------------------------------------------------- */

export type OpcoesPin = {
  alvo?: HTMLElement
  distancia?: string | number
  scrub?: boolean | number
  inicio?: string
  /** Onde o toque assenta: "pausas" (da coreografia) ou uma função com progressos de 0 a 1. */
  patamares?: 'pausas' | (() => number[])
  aoAtualizar?: (self: ScrollTrigger) => void
}

/**
 * Pin + scrub padronizado (timeline com ease "none" ligada à rolagem). Crie no init, de forma
 * síncrona: os pins são calculados na ordem de criação. Os patamares ficam em
 * `data-patamares` no alvo, para as verificações.
 */
export function pinScrub(root: HTMLElement, opcoes: OpcoesPin = {}): gsap.core.Timeline {
  const alvo = opcoes.alvo ?? root
  const { patamares } = opcoes
  // A timeline ainda não existe aqui: os pontos são lidos depois, quando a cena já a montou.
  let tl: gsap.core.Timeline | null = null
  const progressos = (): number[] => {
    if (patamares === 'pausas') return tl ? pausasDaTimeline(tl) : [0, 1]
    return patamares ? patamares() : []
  }
  tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: alvo,
      pin: alvo,
      start: opcoes.inicio ?? 'top top',
      end: opcoes.distancia ?? '+=150%',
      scrub: opcoes.scrub ?? 0.7,
      snap: patamares ? snapPatamares(progressos) : undefined,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: opcoes.aoAtualizar,
      onRefresh: patamares
        ? () => {
            alvo.dataset.patamares = progressos()
              .map((p) => p.toFixed(4))
              .join(' ')
          }
        : undefined,
    },
  })
  return tl
}
```

- [ ] **Step 7: Rodar e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-util.int.spec.ts`
Expected: PASS nos doze testes.

- [ ] **Step 8: Checkpoint: rodar portões e commitar**

```powershell
pnpm exec biome check --write src/site tests/int/site-v2-util.int.spec.ts
pnpm exec biome ci ./src ./tests ./scripts
pnpm exec tsc --noEmit
pnpm run check:server-actions
pnpm run test:int
pnpm build
git status --short
```

Expected: tudo verde. O `git status --short` lista só `package.json`, `pnpm-lock.yaml`, `src/site/core/ganchos.ts`, `patamares.ts`, `util.ts` e o teste; qualquer outro arquivo é falha de escopo.

```powershell
git branch --show-current && git add package.json pnpm-lock.yaml src/site/core/ganchos.ts src/site/core/patamares.ts src/site/core/util.ts tests/int/site-v2-util.int.spec.ts && git commit -m "feat(site-v2): dependências de movimento, utilidades das cenas e patamares de toque

gsap 3.15.0, lenis 1.3.26 e @gsap/react 2.1.2 exatos; utilidades das cenas seguras
no SSR; snap de patamares só no toque.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
git status --short
```

Expected: o `git branch --show-current` imprime `feat/site-v2` (se imprimir outra, não commitar); o commit entra só com `package.json`, `pnpm-lock.yaml`, `src/site/core/ganchos.ts`, `patamares.ts`, `util.ts` e o teste; o `git status --short` final fica vazio. Sem push.

### Tarefa 1.5: Core de movimento seguro no SSR e com desmonte

**Files:**
- Create: `src/site/core/motion.ts`, `src/site/core/posicao.ts`, `src/site/core/tema.ts`, `src/site/core/impressao.ts`, `src/site/core/cabecalho.ts`, `src/site/core/tipos.ts`
- Test: `tests/int/site-v2-core-ssr.int.spec.ts`, `tests/int/site-v2-core-ciclo.int.spec.ts`

**Interfaces:**
- Consumes: `aoRolar`, `executarGanchosImpressao(reportar)`, `type Reportar` (1.4), `conteudo` (1.2, só como tipo).
- Produces:
  - `motion.ts`: `gsap`, `ScrollTrigger`, `SplitText` reexportados (plugins e `useGSAP` registrados só no navegador); `criarLenis(reportar: (erro: unknown) => void): { lenis: Lenis | null; desligar: () => void }`; `marcarMotionQuandoPronto(): { pronto: Promise<void>; cancelar: () => void }`; `vigiarAltura(): () => void`.
  - `posicao.ts`: `alvoDaAncora(hash?: string): HTMLElement | null`, `irAoTopoParaMontar(lenis): number`, `assentarPosicao(lenis, y): void`, `vigiarPrimeiraInteracao(): { rolou: () => boolean; desligar: () => void }`, `reancorar(lenis, rolou: () => boolean): void`.
  - `tema.ts`: `iniciarTema(lenis: Lenis | null): () => void`.
  - `impressao.ts`: `iniciarImpressao(reportar: Reportar): () => void` (o `reportar` recebe a falha de gancho de impressão, que vai ao Sentry).
  - `cabecalho.ts`: `iniciarMenu(): () => void`.
  - `tipos.ts`: `type ContextoCena` (inclui `reportar: Reportar`, que leva ao Sentry a falha de uma parte da cena que degrada sem derrubá-la; a montagem, na 1.6, prefixa a origem com `cena:<id>:`), `type InitCena = (ctx: ContextoCena) => unknown`, `type ListaCenas = ReadonlyArray<readonly [id: string, init: InitCena]>`.

- [ ] **Step 1: Escrever o teste de SSR**

`tests/int/site-v2-core-ssr.int.spec.ts`:

```ts
// @vitest-environment node
import { describe, expect, it } from 'vitest'

/**
 * O Next renderiza Client Components no servidor: o RunnerDeCenas e tudo o que ele importa
 * (core, conteúdo, cenas) é avaliado em Node antes de qualquer efeito. O protótipo chamava
 * `window.matchMedia` no topo de `util.js` e `motion.js`; no Next isso derruba a página com
 * 500. Este arquivo roda em Node puro (sem jsdom) para travar a regra.
 */
const MODULOS: ReadonlyArray<readonly [string, () => Promise<unknown>]> = [
  ['conteudo', () => import('@/site/conteudo/conteudo')],
  ['ganchos', () => import('@/site/core/ganchos')],
  ['patamares', () => import('@/site/core/patamares')],
  ['util', () => import('@/site/core/util')],
  ['motion', () => import('@/site/core/motion')],
  ['posicao', () => import('@/site/core/posicao')],
  ['tema', () => import('@/site/core/tema')],
  ['impressao', () => import('@/site/core/impressao')],
  ['cabecalho', () => import('@/site/core/cabecalho')],
]

describe('site v2: módulos do cliente carregam no servidor', () => {
  it('roda mesmo sem window', () => {
    expect(typeof window).toBe('undefined')
  })

  it.each(MODULOS)('%s importa sem tocar no navegador', async (_nome, carregar) => {
    await expect(carregar()).resolves.toBeDefined()
  })
})
```

- [ ] **Step 2: Escrever o teste de ciclo de vida**

`tests/int/site-v2-core-ciclo.int.spec.ts`:

```ts
import { fireEvent } from '@testing-library/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { iniciarMenu } from '@/site/core/cabecalho'
import { iniciarImpressao } from '@/site/core/impressao'
import { marcarMotionQuandoPronto, vigiarAltura } from '@/site/core/motion'
import { alvoDaAncora, vigiarPrimeiraInteracao } from '@/site/core/posicao'
import { iniciarTema } from '@/site/core/tema'

const CABECALHO = `
  <header data-cabecalho data-tema="claro">
    <button data-menu aria-expanded="false">Menu</button>
    <nav class="painel-menu"><a href="/semog">A Semog</a></nav>
  </header>`

beforeEach(() => {
  document.body.innerHTML = `${CABECALHO}<main><section id="ranking" data-tema="claro"></section></main>`
  document.documentElement.classList.remove('motion')
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('posição na montagem', () => {
  it('âncora malformada não lança e não acha nada; âncora válida acha a seção', () => {
    expect(alvoDaAncora('#%E0%A4%A')).toBeNull()
    expect(alvoDaAncora('#')).toBeNull()
    expect(alvoDaAncora('#ranking')).toBe(document.getElementById('ranking'))
  })

  it('a vigia de interação desligada não marca mais nada', () => {
    const primeira = vigiarPrimeiraInteracao()
    primeira.desligar()
    const segunda = vigiarPrimeiraInteracao()
    window.dispatchEvent(new KeyboardEvent('keydown'))
    expect(segunda.rolou()).toBe(true)
    expect(primeira.rolou()).toBe(false)
    segunda.desligar()
  })
})

describe('menu do cabeçalho', () => {
  it('abre, fecha com Esc devolvendo o foco, e para de responder depois de desligar', () => {
    const desligar = iniciarMenu()
    const botao = document.querySelector('[data-menu]')
    if (!(botao instanceof HTMLElement)) throw new Error('botão ausente no palco do teste')
    fireEvent.click(botao)
    expect(botao.getAttribute('aria-expanded')).toBe('true')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(botao.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(botao)
    desligar()
    fireEvent.click(botao)
    expect(botao.getAttribute('aria-expanded')).toBe('false')
  })

  it('sem cabeçalho, diz por quê em vez de seguir mudo', () => {
    document.body.innerHTML = '<main></main>'
    expect(() => iniciarMenu()).toThrow(/data-menu/)
  })
})

describe('tema, impressão, motion e altura', () => {
  it('o tema solta o ouvinte de refresh ao desligar', () => {
    const adicionar = vi.spyOn(ScrollTrigger, 'addEventListener')
    const remover = vi.spyOn(ScrollTrigger, 'removeEventListener')
    const desligar = iniciarTema(null)
    const ouvinte = adicionar.mock.calls.find(([evento]) => evento === 'refresh')?.[1]
    expect(ouvinte).toBeTypeOf('function')
    desligar()
    // A MESMA função que entrou tem de sair; remover qualquer outra função não soltaria nada.
    expect(remover).toHaveBeenCalledWith('refresh', ouvinte)
  })

  it('a impressão abre os details e, depois de desligada, não mexe mais', () => {
    document.body.insertAdjacentHTML('beforeend', '<details id="d"><summary>x</summary></details>')
    const detalhe = document.getElementById('d')
    if (!(detalhe instanceof HTMLDetailsElement)) throw new Error('details ausente')
    const desligar = iniciarImpressao(vi.fn())
    window.dispatchEvent(new Event('beforeprint'))
    expect(detalhe.open).toBe(true)
    window.dispatchEvent(new Event('afterprint'))
    expect(detalhe.open).toBe(false)
    desligar()
    window.dispatchEvent(new Event('beforeprint'))
    expect(detalhe.open).toBe(false)
  })

  it('html.motion entra quando a página está pronta, e não entra se a montagem foi cancelada', async () => {
    expect(document.readyState).toBe('complete')
    const cancelada = marcarMotionQuandoPronto()
    cancelada.cancelar()
    await cancelada.pronto
    expect(document.documentElement.classList.contains('motion')).toBe(false)
    const valendo = marcarMotionQuandoPronto()
    await valendo.pronto
    expect(document.documentElement.classList.contains('motion')).toBe(true)
  })

  it('a vigia de altura desconecta o observador ao desligar', () => {
    const desconexoes: string[] = []
    class ResizeObserverFalso {
      observe = (): void => undefined
      unobserve = (): void => undefined
      disconnect = (): void => {
        desconexoes.push('desconectou')
      }
    }
    vi.stubGlobal('ResizeObserver', ResizeObserverFalso)
    const desligar = vigiarAltura()
    desligar()
    expect(desconexoes).toEqual(['desconectou'])
  })
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-core-ssr.int.spec.ts tests/int/site-v2-core-ciclo.int.spec.ts`
Expected: FAIL com "Failed to resolve import '@/site/core/motion'" (e os demais módulos novos).

- [ ] **Step 4: Escrever `src/site/core/motion.ts`**

```ts
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import Lenis from 'lenis'

/* Lenis dirigido pelo ticker do GSAP (README do Lenis 1.3): ScrollTrigger atualizado a cada
   rolagem e lagSmoothing desligado. O ticker do GSAP é o ÚNICO requestAnimationFrame da página.
   O movimento NÃO consulta prefers-reduced-motion: decisão do Leandro.
   Nada roda no topo do módulo fora do `if` abaixo: o Next avalia este arquivo no servidor. */
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP)
  // Celular: a barra de endereço que some e volta muda a altura da janela; sem isto cada vez
  // seria um refresh e os pins saltariam. O layout usa svh. Spec 3.2: `ignoreMobileResize` +
  // `svh` é a solução; `normalizeScroll` e `syncTouch` do Lenis foram medidos no protótipo e
  // descartados (o primeiro encurta todo flick rápido; o segundo vira scroll-jacking).
  ScrollTrigger.config({ ignoreMobileResize: true })
}

export { gsap, ScrollTrigger, SplitText }

/** Cria o Lenis e o liga ao GSAP. Se falhar, a página segue com rolagem nativa. */
export function criarLenis(reportar: (erro: unknown) => void): {
  lenis: Lenis | null
  desligar: () => void
} {
  try {
    // allowNestedScroll: uma caixa com rolagem própria (menu aberto) segura o gesto enquanto
    // ainda tem para onde rolar. respectReducedMotion: false, pela decisão acima.
    const lenis = new Lenis({
      autoRaf: false,
      anchors: true,
      allowNestedScroll: true,
      respectReducedMotion: false,
    })
    const desligarRolagem = lenis.on('scroll', ScrollTrigger.update)
    const tique = (tempo: number) => lenis.raf(tempo * 1000)
    gsap.ticker.add(tique)
    gsap.ticker.lagSmoothing(0)
    return {
      lenis,
      desligar: () => {
        gsap.ticker.remove(tique)
        desligarRolagem()
        lenis.destroy()
      },
    }
  } catch (erro) {
    reportar(erro)
    return { lenis: null, desligar: () => {} }
  }
}

const ESPERA_MAXIMA_MS = 5000

/** Fontes e load, nunca mais que 5 s e sem nunca rejeitar: o pior caso é não esperar. */
async function esperarCarregamento(aoAgendarTeto: (id: number) => void): Promise<void> {
  const load =
    document.readyState === 'complete'
      ? Promise.resolve()
      : new Promise<void>((resolver) =>
          window.addEventListener('load', () => resolver(), { once: true }),
        )
  const fontes = document.fonts ? document.fonts.ready.then(() => undefined) : Promise.resolve()
  const teto = new Promise<void>((resolver) => {
    aoAgendarTeto(window.setTimeout(resolver, ESPERA_MAXIMA_MS))
  })
  try {
    await Promise.race([Promise.all([load, fontes]), teto])
  } catch (erro) {
    console.error('[motion] Falha esperando fontes/carregamento.', erro)
  }
}

/**
 * Marca `html.motion` depois que fontes e assets chegaram e recalcula os gatilhos. Estado
 * inicial escondido fica no CSS sob `html.js:not(.motion)`. `cancelar` (desmonte) impede a marca.
 */
export function marcarMotionQuandoPronto(): { pronto: Promise<void>; cancelar: () => void } {
  let cancelado = false
  let teto = 0
  const pronto = (async () => {
    await esperarCarregamento((id) => {
      teto = id
    })
    if (cancelado) return
    document.documentElement.classList.add('motion')
    ScrollTrigger.refresh()
  })()
  return {
    pronto,
    cancelar: () => {
      cancelado = true
      window.clearTimeout(teto)
    },
  }
}

const ESPERA_RECALCULO_MS = 180

/**
 * Recalcula os ScrollTriggers quando a altura do <main> muda (cena que cresce, imagem que
 * chega, fonte que troca a quebra), uma vez por rajada.
 */
export function vigiarAltura(): () => void {
  const main = document.querySelector('main')
  if (!(main instanceof HTMLElement) || typeof ResizeObserver === 'undefined') {
    throw new Error('[motion] Sem <main> ou ResizeObserver; a altura não é vigiada.')
  }
  const midiaImpressao = window.matchMedia('print')
  let ativo = true
  let referencia = main.offsetHeight
  let espera = 0
  const medir = () => {
    referencia = main.offsetHeight
  }
  ScrollTrigger.addEventListener('refresh', medir)
  const agendar = () => {
    if (!ativo) return
    window.clearTimeout(espera)
    espera = window.setTimeout(() => {
      if (midiaImpressao.matches || main.offsetHeight === referencia) return
      ScrollTrigger.refresh()
    }, ESPERA_RECALCULO_MS)
  }
  const observador = new ResizeObserver(agendar)
  observador.observe(main)
  const pendentes = Array.from(document.images).filter((img) => !img.complete)
  for (const img of pendentes) img.addEventListener('load', agendar, { once: true })
  document.fonts?.ready.then(agendar, (erro: unknown) =>
    console.error('[motion] fonts.ready falhou.', erro),
  )
  return () => {
    ativo = false
    observador.disconnect()
    window.clearTimeout(espera)
    ScrollTrigger.removeEventListener('refresh', medir)
    for (const img of pendentes) img.removeEventListener('load', agendar)
  }
}
```

- [ ] **Step 5: Escrever `src/site/core/posicao.ts`**

```ts
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type Lenis from 'lenis'

/* Posição da página em volta da montagem das cenas (portado de core/posicao.js do protótipo).
   Com a página JÁ ROLADA no momento em que as cenas criam os gatilhos (recarga no meio,
   restauração de rolagem, âncora no endereço), um gatilho `once` que ficou para trás dispara e
   se mata no meio do refresh, e o GSAP lê `.end` de um índice que sumiu. Por isso: a página vai
   ao topo antes das cenas, um refresh global mede tudo, e só então ela volta para onde estava
   ou para a âncora. Tudo na mesma tarefa: não chega a pintar o topo. */

function decodificar(id: string): string {
  try {
    return decodeURIComponent(id)
  } catch {
    // Hash malformado (% solto): usa como veio; getElementById só não acha.
    return id
  }
}

/** Elemento da âncora do endereço (#unidades), se existir. */
export function alvoDaAncora(hash: string = location.hash): HTMLElement | null {
  if (hash.length < 2) return null
  const alvo = document.getElementById(decodificar(hash.slice(1)))
  return alvo instanceof HTMLElement ? alvo : null
}

/** Rola sem animação para um y ou um elemento (descontando o scroll-padding-top do <html>). */
function rolarAgora(lenis: Lenis | null, destino: number | HTMLElement): void {
  if (lenis) {
    // O Lenis guarda o limite de rolagem da última medida; os pins acabaram de aumentar a página.
    lenis.resize()
    lenis.scrollTo(destino, { immediate: true, force: true })
  } else {
    let y = typeof destino === 'number' ? destino : 0
    if (destino instanceof HTMLElement) {
      const folga = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)
      y = destino.getBoundingClientRect().top + window.scrollY - (folga || 0)
    }
    window.scrollTo(0, y)
  }
  ScrollTrigger.update()
}

/** Leva a página ao topo antes de as cenas criarem os gatilhos; devolve o y em que estava. */
export function irAoTopoParaMontar(lenis: Lenis | null): number {
  const y = window.scrollY
  if (y > 0) rolarAgora(lenis, 0)
  return y
}

/** Depois que TODAS as cenas criaram os gatilhos: refresh global e volta à âncora ou ao y. */
export function assentarPosicao(lenis: Lenis | null, y: number): void {
  ScrollTrigger.refresh(true)
  const ancora = alvoDaAncora()
  if (ancora) rolarAgora(lenis, ancora)
  else if (y > 0) rolarAgora(lenis, y)
}

const EVENTOS_DE_PESSOA = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const

/** Sabe se a pessoa já mexeu na página (roda, toque, tecla, clique). */
export function vigiarPrimeiraInteracao(): { rolou: () => boolean; desligar: () => void } {
  let rolou = false
  const marcar = () => {
    rolou = true
  }
  for (const evento of EVENTOS_DE_PESSOA) {
    window.addEventListener(evento, marcar, { once: true, passive: true })
  }
  return {
    rolou: () => rolou,
    desligar: () => {
      for (const evento of EVENTOS_DE_PESSOA) window.removeEventListener(evento, marcar)
    },
  }
}

/**
 * Quando fontes e imagens chegam, os pins são recalculados e a âncora muda de lugar (o Firefox
 * ainda refaz o pulo para a âncora durante a carga). Se a pessoa não mexeu, volta à âncora.
 */
export function reancorar(lenis: Lenis | null, rolou: () => boolean): void {
  const ancora = alvoDaAncora()
  if (!ancora || rolou()) return
  rolarAgora(lenis, ancora)
}
```

- [ ] **Step 6: Escrever `src/site/core/tema.ts`**

```ts
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type Lenis from 'lenis'
import { aoRolar } from './util'

/* Tema do cabeçalho: copia o data-tema da <section> sob a linha do cabeçalho e marca o link da
   seção atual. Lê o DOM a cada quadro de rolagem, então funciona com pin. Também liga o fundo
   do cabeçalho (data-rolou) depois do primeiro respiro de rolagem. */

const ROLAGEM_PARA_FUNDO = 8

function secaoSobLinha(secoes: HTMLElement[], y: number): HTMLElement | null {
  for (const secao of secoes) {
    const caixa = secao.getBoundingClientRect()
    if (caixa.top <= y && caixa.bottom > y) return secao
  }
  return null
}

function aplicar(cabecalho: HTMLElement, secao: HTMLElement): void {
  const tema = secao.dataset.tema
  if (tema && cabecalho.dataset.tema !== tema) cabecalho.dataset.tema = tema
  for (const link of cabecalho.querySelectorAll('[data-secao-link]')) {
    if (link.getAttribute('data-secao-link') === secao.id) {
      link.setAttribute('aria-current', 'location')
    } else link.removeAttribute('aria-current')
  }
}

/** Liga a troca de tema. Chame depois que as cenas montaram seus pins. */
export function iniciarTema(lenis: Lenis | null): () => void {
  const cabecalho = document.querySelector('[data-cabecalho]')
  if (!(cabecalho instanceof HTMLElement)) {
    throw new Error('[tema] Cabeçalho [data-cabecalho] não encontrado.')
  }
  const secoes = Array.from(
    document.querySelectorAll<HTMLElement>('main section[data-tema], footer[data-tema]'),
  )
  const atualizar = () => {
    const secao = secaoSobLinha(secoes, cabecalho.getBoundingClientRect().bottom + 1)
    if (secao) aplicar(cabecalho, secao)
    cabecalho.toggleAttribute('data-rolou', window.scrollY > ROLAGEM_PARA_FUNDO)
  }
  const desligarRolagem = aoRolar(atualizar, lenis)
  // Um refresh pode mover as seções sem evento de rolagem (cena que cresceu, pin recalculado).
  ScrollTrigger.addEventListener('refresh', atualizar)
  atualizar()
  return () => {
    desligarRolagem()
    ScrollTrigger.removeEventListener('refresh', atualizar)
  }
}
```

- [ ] **Step 7: Escrever `src/site/core/impressao.ts`**

```ts
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { executarGanchosImpressao, type Reportar } from './ganchos'

/* Impressão: antes de imprimir, abre todos os <details>, desliga os ScrollTriggers e leva toda
   animação ligada à rolagem ao estado final (quem imprime sem rolar não pode receber texto com
   opacidade zero); depois roda os ganchos das cenas. Ao voltar para a tela, cada animação
   retoma o progresso que tinha. Ouve beforeprint e matchMedia("print"). */

const ESPERA_FOTOS_MS = 2000

/** Fotos lazy fora da tela ainda não baixaram e sairiam como caixa vazia na impressão. */
function carregarFotosAdiadas(): void {
  for (const img of document.querySelectorAll('img[loading="lazy"]')) {
    if (img instanceof HTMLImageElement) img.loading = 'eager'
  }
}

export function iniciarImpressao(reportar: Reportar): () => void {
  let imprimindo = false
  let fechados: HTMLDetailsElement[] = []
  let progressos: Array<[gsap.core.Animation, number]> = []

  const concluirAnimacoes = () => {
    progressos = []
    for (const gatilho of ScrollTrigger.getAll()) {
      gatilho.disable(true)
      const animacao = gatilho.animation
      // Cena fixada volta ao estado inicial do HTML e ajusta o resto com util.aoImprimir.
      if (!animacao || gatilho.pin) continue
      progressos.push([animacao, animacao.progress()])
      animacao.progress(1)
    }
  }
  const preparar = () => {
    if (imprimindo) return
    imprimindo = true
    carregarFotosAdiadas()
    fechados = Array.from(document.querySelectorAll<HTMLDetailsElement>('details:not([open])'))
    for (const detalhe of fechados) detalhe.open = true
    concluirAnimacoes()
    executarGanchosImpressao(reportar)
  }
  const restaurar = () => {
    if (!imprimindo) return
    imprimindo = false
    for (const detalhe of fechados) detalhe.open = false
    fechados = []
    for (const [animacao, progresso] of progressos) animacao.progress(progresso)
    progressos = []
    for (const gatilho of ScrollTrigger.getAll()) gatilho.enable()
    ScrollTrigger.refresh()
  }

  // Depois da carga (para não disputar banda com a primeira dobra), as fotos lazy passam a eager.
  let esperaFotos = 0
  const agendarFotos = () => {
    esperaFotos = window.setTimeout(carregarFotosAdiadas, ESPERA_FOTOS_MS)
  }
  if (document.readyState === 'complete') agendarFotos()
  else window.addEventListener('load', agendarFotos, { once: true })

  const midia = window.matchMedia('print')
  const aoMudarMidia = (evento: MediaQueryListEvent) => (evento.matches ? preparar() : restaurar())
  window.addEventListener('beforeprint', preparar)
  window.addEventListener('afterprint', restaurar)
  midia.addEventListener('change', aoMudarMidia)

  return () => {
    window.clearTimeout(esperaFotos)
    window.removeEventListener('load', agendarFotos)
    window.removeEventListener('beforeprint', preparar)
    window.removeEventListener('afterprint', restaurar)
    midia.removeEventListener('change', aoMudarMidia)
  }
}
```

- [ ] **Step 8: Escrever `src/site/core/cabecalho.ts`**

```ts
/* Menu do cabeçalho em tela estreita. Independe do GSAP: liga mesmo se o movimento falhar.
   Fecha ao escolher um link e com Esc (o foco volta ao botão). */

export function iniciarMenu(): () => void {
  const cabecalho = document.querySelector('[data-cabecalho]')
  const botao = cabecalho?.querySelector('[data-menu]')
  const painel = cabecalho?.querySelector('.painel-menu')
  if (!(cabecalho instanceof HTMLElement) || !(botao instanceof HTMLElement) || !painel) {
    throw new Error('[menu] Cabeçalho, botão [data-menu] ou .painel-menu ausente.')
  }
  const aberto = () => botao.getAttribute('aria-expanded') === 'true'
  const definir = (abrir: boolean) => {
    botao.setAttribute('aria-expanded', String(abrir))
    cabecalho.toggleAttribute('data-menu-aberto', abrir)
  }
  const aoClicarBotao = () => definir(!aberto())
  const aoClicarPainel = (evento: Event) => {
    if (evento.target instanceof Element && evento.target.closest('a')) definir(false)
  }
  const aoTeclar = (evento: KeyboardEvent) => {
    if (evento.key !== 'Escape' || !aberto()) return
    definir(false)
    botao.focus()
  }
  botao.addEventListener('click', aoClicarBotao)
  painel.addEventListener('click', aoClicarPainel)
  document.addEventListener('keydown', aoTeclar)
  return () => {
    botao.removeEventListener('click', aoClicarBotao)
    painel.removeEventListener('click', aoClicarPainel)
    document.removeEventListener('keydown', aoTeclar)
  }
}
```

- [ ] **Step 9: Escrever `src/site/core/tipos.ts`**

```ts
import type { gsap } from 'gsap'
import type { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { SplitText } from 'gsap/SplitText'
import type Lenis from 'lenis'
import type { conteudo } from '../conteudo/conteudo'
import type { Reportar } from './ganchos'
import type * as util from './util'

/**
 * O que cada cena recebe no `init(ctx)` (o mesmo contrato do protótipo). Regras da porta:
 * pins nascem no init, de forma síncrona; laço só por `util.lacoVisivel`; todo
 * `addEventListener` fora do GSAP precisa sair no desmonte: o init devolve uma função de
 * limpeza (o `gsap.context` a chama no `revert`) ou usa `util.aoRolar`/`util.lacoVisivel`.
 */
export type ContextoCena = {
  gsap: typeof gsap
  ScrollTrigger: typeof ScrollTrigger
  SplitText: typeof SplitText
  /** `null` se o Lenis falhou; a rolagem nativa segue. */
  lenis: Lenis | null
  util: typeof util
  conteudo: typeof conteudo
  /** Resolve quando fontes e load chegaram e `html.motion` foi marcada (no máximo ~5 s). */
  pronto: Promise<void>
  /** A `<section>` da cena. Selecione sempre a partir dela. */
  root: HTMLElement
  /** Verdadeiro em tela estreita (até 760px), lido na hora. */
  estreito: () => boolean
  /**
   * Leva ao Sentry (via `montarPagina`) a falha de uma PARTE da cena que degrada sem derrubá-la,
   * por exemplo o canvas indisponível ou a foto sem `.moldura > img`. `origem` é o nome da
   * parte (`'campo'`, `'quadro'`); a montagem a grava como `cena:<id>:<origem>`. Nunca use
   * `console.error` sozinho para isso: a constraint do plano manda a falha ao Sentry.
   */
  reportar: Reportar
}

export type InitCena = (ctx: ContextoCena) => unknown

/** id da `<section>` e init, na ordem da página. */
export type ListaCenas = ReadonlyArray<readonly [id: string, init: InitCena]>
```

- [ ] **Step 10: Rodar e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-core-ssr.int.spec.ts tests/int/site-v2-core-ciclo.int.spec.ts`
Expected: PASS nos dez testes de SSR e nos oito de ciclo. Se algum módulo falhar no SSR por causa de um pacote (não do nosso código), o erro mostra o arquivo de `node_modules`: reportar antes de contornar, porque é exatamente o 500 que a Review Focus descreve.

- [ ] **Step 11: Checkpoint: rodar portões e commitar**

```powershell
pnpm exec biome check --write src/site tests/int/site-v2-core-ssr.int.spec.ts tests/int/site-v2-core-ciclo.int.spec.ts
pnpm exec biome ci ./src ./tests ./scripts
pnpm exec tsc --noEmit
pnpm run check:server-actions
pnpm run test:int
pnpm build
git status --short
```

Expected: tudo verde. O `git status --short` lista só `src/site/core/` (motion, posicao, tema, impressao, cabecalho e tipos) e os dois testes; qualquer outro arquivo é falha de escopo.

```powershell
git branch --show-current && git add src/site/core/motion.ts src/site/core/posicao.ts src/site/core/tema.ts src/site/core/impressao.ts src/site/core/cabecalho.ts src/site/core/tipos.ts tests/int/site-v2-core-ssr.int.spec.ts tests/int/site-v2-core-ciclo.int.spec.ts && git commit -m "feat(site-v2): core de movimento seguro no SSR e com desmonte

Core portado do protótipo sem efeito no topo do módulo, com função de desligar em tudo
o que não é GSAP, e o contrato ContextoCena (com reportar para o Sentry).

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
git status --short
```

Expected: o `git branch --show-current` imprime `feat/site-v2` (se imprimir outra, não commitar); o commit entra só com `src/site/core/` (motion, posicao, tema, impressao, cabecalho e tipos) e os dois testes; o `git status --short` final fica vazio. Sem push.

### Tarefa 1.6: Montagem das cenas e `RunnerDeCenas`

**Files:**
- Create: `src/site/core/montagem.ts`
- Create: `src/site/cenas/registro.ts`
- Create: `src/site/runner/RunnerDeCenas.tsx`
- Modify: `tests/int/site-v2-core-ssr.int.spec.ts` (três módulos a mais)
- Test: `tests/int/site-v2-montagem.int.spec.tsx`

**Interfaces:**
- Consumes: tudo de `src/site/core` (1.4 e 1.5), `conteudo` (1.2).
- Produces: `type Reportar = (erro: unknown, origem: string) => void` (definido em `ganchos.ts`, 1.4, e reexportado por `montagem.ts`); `type OpcoesMontagem = { reportar: Reportar; criarLenis?: typeof criarLenis }`; `montarPagina(cenas: ListaCenas, opcoes: OpcoesMontagem): () => void`; `CENAS_POR_PAGINA` e `type IdPaginaComCenas` em `@/site/cenas/registro`; `RunnerDeCenas({ pagina }: { pagina: IdPaginaComCenas })` (client, renderiza `null`). O `ContextoCena` que cada cena recebe ganha `reportar(erro, parte)`, que a montagem liga a `reportar(erro, 'cena:<id>:<parte>')`. Origens reportadas: `cena:<id>`, `cena:<id>:neutralizar`, `cena:<id>:<parte>` (via `ctx.reportar`), `lenis`, `tema`, `impressão`, `altura`, `motion`, `desmonte`.

- [ ] **Step 1: Escrever o teste**

`tests/int/site-v2-montagem.int.spec.tsx`:

```tsx
import { render } from '@testing-library/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import { montarPagina, type Reportar } from '@/site/core/montagem'
import type { ListaCenas } from '@/site/core/tipos'

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))
vi.mock('@/site/cenas/registro', () => ({
  CENAS_POR_PAGINA: {
    previa: [
      [
        'a',
        (ctx: import('@/site/core/tipos').ContextoCena) => {
          ctx.ScrollTrigger.create({ trigger: ctx.root })
        },
      ],
    ],
  },
}))

class ResizeObserverFalso {
  observe = (): void => undefined
  unobserve = (): void => undefined
  disconnect = (): void => undefined
}

function palco(...ids: string[]): void {
  const secoes = ids.map((id) => `<section id="${id}" data-tema="claro"></section>`).join('')
  document.body.innerHTML = `<header data-cabecalho data-tema="claro"></header><main>${secoes}</main>`
}

const lenisFalso = () => vi.fn(() => ({ lenis: null, desligar: vi.fn() }))

let reportar: Mock<Reportar>

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverFalso)
  reportar = vi.fn<Reportar>()
})

afterEach(() => {
  for (const gatilho of ScrollTrigger.getAll()) gatilho.kill()
  vi.unstubAllGlobals()
})

describe('montarPagina: cena que quebra não derruba a página', () => {
  it('erro síncrono: reporta com a tag da cena, a seção fica em HTML e a seguinte monta', () => {
    palco('a', 'b')
    let bMontou = false
    const cenas: ListaCenas = [
      [
        'a',
        () => {
          throw new Error('quebrou')
        },
      ],
      [
        'b',
        () => {
          bMontou = true
        },
      ],
    ]
    const desmontar = montarPagina(cenas, { reportar, criarLenis: lenisFalso() })
    expect(reportar).toHaveBeenCalledWith(expect.objectContaining({ message: 'quebrou' }), 'cena:a')
    expect(document.getElementById('a')?.dataset.cenaErro).toBe('')
    expect(bMontou).toBe(true)
    // O GSAP 3.15 não restaura o contexto global se o init lança dentro do `add`: a montagem
    // captura o erro dentro da função, então nenhum contexto fica preso.
    expect(gsap.context()).toBeFalsy()
    desmontar()
  })

  it('ctx.reportar leva a falha parcial ao Sentry com a origem da cena, sem derrubar a seção', () => {
    palco('a')
    const desmontar = montarPagina(
      [
        [
          'a',
          (ctx) => {
            ctx.reportar(new Error('parcial'), 'quadro')
          },
        ],
      ],
      { reportar, criarLenis: lenisFalso() },
    )
    expect(reportar).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'parcial' }),
      'cena:a:quadro',
    )
    expect(document.getElementById('a')?.dataset.cenaErro).toBeUndefined()
    desmontar()
  })

  it('promise rejeitada também é reportada', async () => {
    palco('a')
    const desmontar = montarPagina([['a', async () => Promise.reject(new Error('tarde'))]], {
      reportar,
      criarLenis: lenisFalso(),
    })
    await vi.waitFor(() =>
      expect(reportar).toHaveBeenCalledWith(expect.objectContaining({ message: 'tarde' }), 'cena:a'),
    )
    desmontar()
  })

  it('seção ausente é reportada, não ignorada', () => {
    palco()
    const desmontar = montarPagina([['fantasma', () => undefined]], {
      reportar,
      criarLenis: lenisFalso(),
    })
    expect(reportar).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('fantasma') }),
      'cena:fantasma',
    )
    desmontar()
  })
})

describe('montarPagina: desmonte e ida e volta', () => {
  it('o desmonte reverte o que a cena fez e chama a limpeza que ela devolveu', () => {
    palco('a')
    let limpou = false
    const desmontar = montarPagina(
      [
        [
          'a',
          (ctx) => {
            ctx.gsap.set(ctx.root, { x: 10 })
            return () => {
              limpou = true
            }
          },
        ],
      ],
      { reportar, criarLenis: lenisFalso() },
    )
    expect(document.getElementById('a')?.style.transform).not.toBe('')
    desmontar()
    expect(document.getElementById('a')?.style.transform).toBe('')
    expect(limpou).toBe(true)
    expect(reportar).not.toHaveBeenCalled()
  })

  it('três ciclos de montar e desmontar não acumulam gatilho, rolagem nem Lenis', () => {
    palco('a')
    let chamadas = 0
    const criarLenis = lenisFalso()
    const cenas: ListaCenas = [
      [
        'a',
        (ctx) => {
          ctx.ScrollTrigger.create({ trigger: ctx.root })
          ctx.util.aoRolar(() => {
            chamadas += 1
          }, ctx.lenis)
        },
      ],
    ]
    const contagens: number[] = []
    for (let ciclo = 0; ciclo < 3; ciclo += 1) {
      const desmontar = montarPagina(cenas, { reportar, criarLenis })
      contagens.push(ScrollTrigger.getAll().length)
      desmontar()
    }
    expect(new Set(contagens).size).toBe(1)
    expect(ScrollTrigger.getAll()).toHaveLength(0)
    chamadas = 0
    window.dispatchEvent(new Event('scroll'))
    gsap.ticker.tick()
    expect(chamadas).toBe(0)
    expect(criarLenis).toHaveBeenCalledTimes(3)
    for (const resultado of criarLenis.mock.results) {
      expect(resultado.value.desligar).toHaveBeenCalledTimes(1)
    }
    expect(document.documentElement.classList.contains('motion')).toBe(false)
    expect(reportar).not.toHaveBeenCalled()
  })
})

describe('RunnerDeCenas', () => {
  it('no StrictMode (monta, desmonta, monta) fica um conjunto só, sem erro no Sentry', async () => {
    const Sentry = await import('@sentry/nextjs')
    const { RunnerDeCenas } = await import('@/site/runner/RunnerDeCenas')
    palco('a')
    const { unmount } = render(
      <StrictMode>
        <RunnerDeCenas pagina="previa" />
      </StrictMode>,
    )
    expect(ScrollTrigger.getAll()).toHaveLength(1)
    expect(Sentry.captureException).not.toHaveBeenCalled()
    unmount()
    expect(ScrollTrigger.getAll()).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Acrescentar os três módulos novos ao teste de SSR**

Em `tests/int/site-v2-core-ssr.int.spec.ts`, ao fim da lista `MODULOS`:

```ts
  ['montagem', () => import('@/site/core/montagem')],
  ['registro', () => import('@/site/cenas/registro')],
  ['runner', () => import('@/site/runner/RunnerDeCenas')],
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-montagem.int.spec.tsx tests/int/site-v2-core-ssr.int.spec.ts`
Expected: FAIL com "Failed to resolve import '@/site/core/montagem'".

- [ ] **Step 4: Escrever `src/site/core/montagem.ts`**

```ts
import type Lenis from 'lenis'
import { conteudo } from '../conteudo/conteudo'
import { desligarTudo, type Reportar } from './ganchos'
import { iniciarImpressao } from './impressao'
import {
  criarLenis,
  gsap,
  marcarMotionQuandoPronto,
  ScrollTrigger,
  SplitText,
  vigiarAltura,
} from './motion'
import { assentarPosicao, irAoTopoParaMontar, reancorar, vigiarPrimeiraInteracao } from './posicao'
import { iniciarTema } from './tema'
import type { ContextoCena, InitCena, ListaCenas } from './tipos'
import * as util from './util'

/**
 * Monta as cenas de uma página e devolve o desmonte (portado de main.js do protótipo). Cada
 * cena roda num gsap.context com escopo na própria seção: seletores em texto ficam restritos a
 * ela e, se a cena lançar, tudo o que criou é revertido, a seção volta ao HTML estático e as
 * outras seguem. O que não é GSAP (Lenis, ticker, listeners, observers) sai no desmonte.
 * A função pública se divide em três: ligar a infraestrutura, montar as cenas e desmontar.
 */
export type { Reportar }
export type OpcoesMontagem = { reportar: Reportar; criarLenis?: typeof criarLenis }

type Base = Omit<ContextoCena, 'root' | 'reportar'>
type Estado = { montando: boolean; encerrado: boolean }
type Apoio = { reportar: Reportar; estado: Estado }
type ApoioCenas = Apoio & { base: Base }
type Desligamentos = Array<() => void>
type Infra = {
  lenis: Lenis | null
  yHerdado: number
  interacao: ReturnType<typeof vigiarPrimeiraInteracao>
  motion: ReturnType<typeof marcarMotionQuandoPronto>
}

/** Desfaz o que a cena montou, inclusive gatilhos criados fora do context (depois de await). */
function neutralizarCena(root: HTMLElement, contexto: gsap.Context): void {
  contexto.revert()
  for (const gatilho of ScrollTrigger.getAll()) {
    const alvo = gatilho.trigger
    if (alvo instanceof Element && root.contains(alvo)) gatilho.kill(true)
  }
  root.dataset.cenaErro = ''
}

function tratarFalhaDeCena(
  id: string,
  root: HTMLElement,
  contexto: gsap.Context,
  erro: unknown,
  { reportar, estado }: Apoio,
): void {
  reportar(erro, `cena:${id}`)
  try {
    neutralizarCena(root, contexto)
  } catch (erroLimpeza) {
    reportar(erroLimpeza, `cena:${id}:neutralizar`)
  }
  // Exceção no meio de um refresh deixa os pins das OUTRAS cenas sem espaçador. Fora da
  // montagem, um refresh global no próximo tique remonta todos.
  if (!estado.montando) {
    gsap.delayedCall(0, () => {
      if (!estado.encerrado) ScrollTrigger.refresh(true)
    })
  }
}

function montarCena(id: string, init: InitCena, apoio: ApoioCenas): gsap.Context | null {
  const root = document.getElementById(id)
  if (!root) {
    apoio.reportar(new Error(`<section id="${id}"> não está na página.`), `cena:${id}`)
    return null
  }
  const contexto = gsap.context(() => {}, root)
  const ctx: ContextoCena = {
    ...apoio.base,
    root,
    reportar: (erro, parte) => apoio.reportar(erro, `cena:${id}:${parte}`),
  }
  // O `Context.add` do GSAP 3.15 não tem try/finally: se o init lançasse aqui dentro, o
  // `_context` global ficaria preso neste contexto e os das cenas seguintes nasceriam como
  // filhos dele. Por isso o erro é guardado DENTRO da função e só tratado depois que o `add`
  // terminou. O valor devolvido continua sendo o do init (o GSAP guarda a limpeza em `_r`).
  const erros: unknown[] = []
  const retorno: unknown = contexto.add(() => {
    try {
      return init(ctx)
    } catch (erro) {
      erros.push(erro)
      return undefined
    }
  })
  if (erros.length > 0) {
    tratarFalhaDeCena(id, root, contexto, erros[0], apoio)
  } else if (retorno instanceof Promise) {
    retorno.catch((erro: unknown) => tratarFalhaDeCena(id, root, contexto, erro, apoio))
  }
  return contexto
}

function montarCenas(cenas: ListaCenas, apoio: ApoioCenas): gsap.Context[] {
  const contextos: gsap.Context[] = []
  for (const [id, init] of cenas) {
    const contexto = montarCena(id, init, apoio)
    if (contexto) contextos.push(contexto)
  }
  return contextos
}

/** Ligar: Lenis, topo e promessa de `html.motion`. Cada item registra como se desliga. */
function ligarInfraestrutura(opcoes: OpcoesMontagem, desligar: Desligamentos): Infra {
  const restauracaoAntes = history.scrollRestoration
  history.scrollRestoration = 'manual'
  desligar.push(() => {
    history.scrollRestoration = restauracaoAntes
  })
  const lenisCriado = (opcoes.criarLenis ?? criarLenis)((erro) => opcoes.reportar(erro, 'lenis'))
  desligar.push(lenisCriado.desligar)
  const interacao = vigiarPrimeiraInteracao()
  desligar.push(interacao.desligar)
  // As cenas montam com a página no topo; ver core/posicao.ts.
  const yHerdado = irAoTopoParaMontar(lenisCriado.lenis)
  const motion = marcarMotionQuandoPronto()
  desligar.push(motion.cancelar)
  return { lenis: lenisCriado.lenis, yHerdado, interacao, motion }
}

/** Depois de TODAS as cenas: posição, tema, impressão, altura e reancoragem. */
function ligarAposCenas(infra: Infra, { reportar, estado }: Apoio, desligar: Desligamentos): void {
  const ligar = (origem: string, ligacao: () => () => void) => {
    try {
      desligar.push(ligacao())
    } catch (erro) {
      reportar(erro, origem)
    }
  }
  assentarPosicao(infra.lenis, infra.yHerdado)
  ligar('tema', () => iniciarTema(infra.lenis))
  ligar('impressão', () => iniciarImpressao(reportar))
  ligar('altura', vigiarAltura)
  infra.motion.pronto.then(
    () => {
      if (!estado.encerrado) reancorar(infra.lenis, infra.interacao.rolou)
    },
    (erro: unknown) => reportar(erro, 'motion'),
  )
}

/** Desmontar: reverte as cenas, mata os gatilhos e desliga tudo o que não é GSAP. */
function criarDesmonte(
  contextos: gsap.Context[],
  { reportar, estado }: Apoio,
  desligar: Desligamentos,
): () => void {
  return () => {
    estado.encerrado = true
    for (const contexto of [...contextos].reverse()) contexto.revert()
    for (const gatilho of ScrollTrigger.getAll()) gatilho.kill()
    for (const erro of desligarTudo()) reportar(erro, 'desmonte')
    for (const desligamento of [...desligar].reverse()) {
      try {
        desligamento()
      } catch (erro) {
        reportar(erro, 'desmonte')
      }
    }
    document.documentElement.classList.remove('motion')
  }
}

export function montarPagina(cenas: ListaCenas, opcoes: OpcoesMontagem): () => void {
  const apoio: Apoio = {
    reportar: opcoes.reportar,
    estado: { montando: false, encerrado: false },
  }
  const desligar: Desligamentos = []
  const infra = ligarInfraestrutura(opcoes, desligar)

  apoio.estado.montando = true
  const base: Base = {
    gsap,
    ScrollTrigger,
    SplitText,
    lenis: infra.lenis,
    util,
    conteudo,
    pronto: infra.motion.pronto,
    estreito: util.estreito,
  }
  const contextos = montarCenas(cenas, { ...apoio, base })
  apoio.estado.montando = false

  ligarAposCenas(infra, apoio, desligar)
  return criarDesmonte(contextos, apoio, desligar)
}
```

- [ ] **Step 5: Escrever `src/site/cenas/registro.ts`**

```ts
import type { ListaCenas } from '@/site/core/tipos'

/**
 * Cenas de cada página, na ordem das seções (o PAGINAS do main.js do protótipo). A página
 * `previa` é a rota /previa-v2 da fundação; ganha a cena do ranking na Tarefa 1.8.
 * Fase 4: avaliar carregar por página com import() se o bundle passar do orçamento.
 */
export const CENAS_POR_PAGINA = {
  previa: [],
} satisfies Record<string, ListaCenas>

export type IdPaginaComCenas = keyof typeof CENAS_POR_PAGINA
```

- [ ] **Step 6: Escrever `src/site/runner/RunnerDeCenas.tsx`**

```tsx
'use client'

import { useGSAP } from '@gsap/react'
import * as Sentry from '@sentry/nextjs'
import { CENAS_POR_PAGINA, type IdPaginaComCenas } from '@/site/cenas/registro'
import { montarPagina } from '@/site/core/montagem'

/**
 * Monta as cenas da página com o useGSAP (spec 3.1): o callback roda num gsap.context; os
 * contexts de cada seção, criados dentro dele, são revertidos no desmonte, e a função que
 * `montarPagina` devolve desliga Lenis, ticker e listeners. Renderiza nada: o HTML das seções
 * vem dos Server Components. Falha de cena vai ao Sentry e a seção fica estática.
 */
export function RunnerDeCenas({ pagina }: { pagina: IdPaginaComCenas }) {
  useGSAP(
    () =>
      montarPagina(CENAS_POR_PAGINA[pagina], {
        reportar: (erro, origem) => {
          console.error(`[site v2] ${origem}`, erro)
          Sentry.captureException(erro, { tags: { pagina, origem } })
        },
      }),
    { dependencies: [pagina], revertOnUpdate: true },
  )
  return null
}
```

- [ ] **Step 7: Rodar e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-montagem.int.spec.tsx tests/int/site-v2-core-ssr.int.spec.ts`
Expected: PASS em todos (sete de montagem, treze de SSR). Se o teste do `RunnerDeCenas` (StrictMode) falhar porque o Lenis real não constrói no jsdom (o `reportar` do Sentry é chamado com `origem: 'lenis'`; o Lenis passa de 1.3.25 para 1.3.26 na Tarefa 1.4), injetar um `criarLenis` falso também no runner por prop de teste, sem mexer no core: `RunnerDeCenas({ pagina, criarLenis }: { pagina: IdPaginaComCenas; criarLenis?: typeof criarLenis })` repassa `criarLenis` em `montarPagina(..., { reportar, criarLenis })`, e o teste renderiza `<RunnerDeCenas pagina="previa" criarLenis={lenisFalso()} />`.

- [ ] **Step 8: Checkpoint: rodar portões e commitar**

```powershell
pnpm exec biome check --write src/site tests/int/site-v2-montagem.int.spec.tsx tests/int/site-v2-core-ssr.int.spec.ts
pnpm exec biome ci ./src ./tests ./scripts
pnpm exec tsc --noEmit
pnpm run check:server-actions
pnpm run test:int
pnpm build
git status --short
```

Expected: tudo verde. `check:server-actions` continua verde porque nenhum arquivo novo tem `'use server'` (o `'use client'` do runner não entra nesse portão). O `git status --short` lista só `src/site/core/montagem.ts`, `src/site/cenas/registro.ts`, `src/site/runner/RunnerDeCenas.tsx` e os dois testes; qualquer outro arquivo é falha de escopo.

```powershell
git branch --show-current && git add src/site/core/montagem.ts src/site/cenas/registro.ts src/site/runner/RunnerDeCenas.tsx tests/int/site-v2-core-ssr.int.spec.ts tests/int/site-v2-montagem.int.spec.tsx && git commit -m "feat(site-v2): montagem das cenas e RunnerDeCenas

montarPagina (ligar, montar, desmontar) e o runner client com useGSAP: falha de
cena vai ao Sentry e a seção segue em HTML estático.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
git status --short
```

Expected: o `git branch --show-current` imprime `feat/site-v2` (se imprimir outra, não commitar); o commit entra só com `src/site/core/montagem.ts`, `src/site/cenas/registro.ts`, `src/site/runner/RunnerDeCenas.tsx` e os dois testes; o `git status --short` final fica vazio. Sem push.

### Tarefa 1.7: Layouts `(site)` e `(app)`, cabeçalho, rodapé e menu

**Files:**
- Create: `src/site/layout/SimbolosSvg.tsx`, `src/site/layout/Cabecalho.tsx`, `src/site/layout/LigarMenu.tsx`, `src/site/layout/Rodape.tsx`, `src/site/layout/EsqueletoApp.tsx`
- Create: `src/app/(site)/layout.tsx`, `src/app/(site)/(app)/layout.tsx`
- Test: `tests/int/site-v2-layout.int.spec.tsx`

**Interfaces:**
- Consumes: `saira`, `barlow` (1.1), `conteudo` (1.2), `entradaDe` (1.3), `iniciarMenu` (1.5), `RunnerDeCenas`, `IdPaginaComCenas` (1.6).
- Produces: `type IdNav = 'semog' | 'incorporadoras' | 'gestao' | 'garante' | 'tecnologia' | 'blog' | 'contato'`; `type DestinoProposta = '#proposta' | '/proposta'`; `Cabecalho({ atual?, destinoProposta })`, `Rodape({ destinoProposta })`, `SimbolosSvg()`, `LigarMenu()`, `EsqueletoApp({ pagina, atual?, temProposta, children })`. O layout raiz `(site)` aplica `sem-js`, as variáveis de fonte, tokens e base; o `(app)` acrescenta o CSS do Lenis.

- [ ] **Step 1: Escrever o teste**

`tests/int/site-v2-layout.int.spec.tsx`:

```tsx
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { entradaDe } from '@/site/inventario'
import { Cabecalho } from '@/site/layout/Cabecalho'
import { Rodape } from '@/site/layout/Rodape'
import { SimbolosSvg } from '@/site/layout/SimbolosSvg'

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))

function linksInternos(raiz: HTMLElement): string[] {
  return Array.from(raiz.querySelectorAll('a[href^="/"]')).map((a) => a.getAttribute('href') ?? '')
}

describe('cabeçalho do site v2', () => {
  it('todo link interno cai numa página do inventário', () => {
    const { container } = render(<Cabecalho destinoProposta="/proposta" />)
    const internos = linksInternos(container)
    expect(internos.length).toBeGreaterThan(10)
    for (const href of internos) {
      expect(entradaDe(href.split('#')[0] || '/')?.tipo, href).toBe('pagina')
    }
  })

  it('marca a página atual nos dois menus e só nela', () => {
    render(<Cabecalho atual="garante" destinoProposta="/proposta" />)
    const garante = screen.getAllByRole('link', { name: 'Garante' })
    expect(garante).toHaveLength(2)
    for (const link of garante) expect(link.getAttribute('aria-current')).toBe('page')
    expect(document.querySelectorAll('[aria-current="page"]')).toHaveLength(2)
  })

  it('"Seja Semog" vai para a proposta da própria página quando ela existe', () => {
    const { unmount } = render(<Cabecalho destinoProposta="#proposta" />)
    expect(screen.getByRole('link', { name: 'Seja Semog' }).getAttribute('href')).toBe('#proposta')
    unmount()
    render(<Cabecalho destinoProposta="/proposta" />)
    expect(screen.getByRole('link', { name: 'Seja Semog' }).getAttribute('href')).toBe('/proposta')
  })

  it('o botão Menu abre e fecha o painel, e Esc devolve o foco', () => {
    render(<Cabecalho destinoProposta="/proposta" />)
    const botao = screen.getByRole('button', { name: 'Menu' })
    fireEvent.click(botao)
    expect(botao.getAttribute('aria-expanded')).toBe('true')
    expect(document.querySelector('[data-cabecalho]')?.hasAttribute('data-menu-aberto')).toBe(true)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(botao.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(botao)
  })
})

describe('rodapé do site v2', () => {
  it('lista as quatro Unidades Semog com link para a landing de cada cidade', () => {
    const { container } = render(<Rodape destinoProposta="/proposta" />)
    const cidades = linksInternos(container).filter((href) =>
      href.startsWith('/administradora-de-condominios-'),
    )
    expect(cidades).toEqual([
      '/administradora-de-condominios-recife',
      '/administradora-de-condominios-joao-pessoa',
      '/administradora-de-condominios-campina-grande',
      '/administradora-de-condominios-belem',
    ])
    for (const href of linksInternos(container)) expect(entradaDe(href)?.tipo, href).toBe('pagina')
  })

  it('não traz a nota de protótipo do esqueleto original', () => {
    render(<Rodape destinoProposta="/proposta" />)
    expect(document.body.textContent).not.toMatch(/Protótipo/)
    expect(document.body.textContent).toContain('Semog · administradora de condomínios desde 1991.')
  })
})

describe('logo', () => {
  it('a geometria do símbolo é a do logo original, sem recompor', () => {
    const referencia = readFileSync(path.join(process.cwd(), '_reference', 'semog-logo.svg'), 'utf8')
      .replace(/\r\n?/g, '\n')
    const dDaReferencia = Array.from(referencia.matchAll(/\sd="([^"]+)"/g), (m) => m[1])
    const { container } = render(<SimbolosSvg />)
    const dDoSimbolo = Array.from(container.querySelectorAll('#logo-semog path'), (p) =>
      p.getAttribute('d'),
    )
    expect(dDoSimbolo).toEqual(dDaReferencia)
    expect(container.querySelectorAll('#logo-semog rect')).toHaveLength(3)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-layout.int.spec.tsx`
Expected: FAIL com "Failed to resolve import '@/site/layout/Cabecalho'".

- [ ] **Step 3: Escrever `src/site/layout/SimbolosSvg.tsx`**

Geometria copiada de `PROTOTIPO\src\page.html` (que é a de `_reference/semog-logo.svg`); nunca recompor (memória "Marca Semog: nunca compor logo novo").

```tsx
/** Símbolos usados por <use>: o logo Semog (geometria original) e a seta das ações. */
export function SimbolosSvg() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <symbol id="logo-semog" viewBox="0 0 601.59 94.93">
        <rect width="36.41" height="94.93" />
        <rect x="52.4" width="36.41" height="94.93" />
        <rect x="104.79" width="36.41" height="94.93" />
        <path d="M177.03,90.45v-5.45c8.42.95,16.71,1.66,25.6,1.66,19.67,0,25.01-4.39,25.01-15.17,0-5.22-1.66-8.18-5.21-10.55-3.56-2.49-9.13-4.03-17.54-6.4-8.53-2.49-15.41-4.98-19.91-8.77-4.62-3.91-7.11-9.13-7.11-16.95,0-19.79,16.24-24.89,35.44-24.89,6.64,0,16.24.71,24.42,2.25v5.45c-6.99-.95-14.82-1.54-21.33-1.54-17.07,0-22.28,3.44-22.28,13.87,0,4.98,1.54,7.94,4.86,10.07,3.44,2.25,9.01,4.03,16.71,6.16,9.01,2.49,15.76,4.86,20.5,8.53,5.1,4.03,7.59,9.24,7.59,17.42,0,20.15-18.73,26.67-37.93,26.67-9.13,0-19.56-.83-28.8-2.37Z" />
        <path d="M255.97,4.64h60.8v5.93h-43.26v33.66h38.87v5.93h-38.87v36.03h43.85v5.93h-61.39V4.64Z" />
        <path d="M336.33,22.53v69.57h-6.52V4.64h17.9l28.44,71.47,28.09-71.47h17.3v87.47h-17.3V22.06l-27.62,70.05h-12.45l-27.85-69.57Z" />
        <path d="M434.82,48.37c0-28.33,14.58-44.8,40.89-44.8s41.01,16.47,41.01,44.8-14.58,44.8-41.01,44.8-40.89-16.47-40.89-44.8ZM498.35,48.25c0-29.16-6.4-38.76-22.64-38.76s-22.64,9.84-22.64,38.76,6.52,38.87,22.64,38.87,22.64-9.84,22.64-38.87Z" />
        <path d="M527.04,48.37c0-31.64,17.54-44.45,46.11-44.45,8.18,0,17.54.83,25.72,2.25v5.33c-7.23-.83-14.7-1.42-21.33-1.42-25.84,0-32.24,9.01-32.24,38.16s7.23,38.28,29.87,38.28c3.2,0,6.52-.12,9.6-.36v-36.03h-17.07v-5.93h33.9v46.82c-8.77,1.42-18.73,1.9-28.33,1.9-28.8,0-46.22-11.5-46.22-44.56Z" />
      </symbol>
      <symbol id="seta" viewBox="0 0 21 13">
        <path d="M0 6.5h19M13 1l6 5.5-6 5.5" />
      </symbol>
    </svg>
  )
}
```

Os `d` acima são os de `PROTOTIPO\src\page.html` (iguais aos de `_reference/semog-logo.svg`, conferido em 15/10/2026). **Antes de salvar, copiar os cinco `d` direto de `_reference/semog-logo.svg`** em vez de digitar a partir deste plano: o teste do Step 1 compara caractere a caractere e falha em qualquer divergência, que é o que protege o logo de ser recomposto por engano.

- [ ] **Step 4: Escrever `src/site/layout/LigarMenu.tsx`**

```tsx
'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { iniciarMenu } from '@/site/core/cabecalho'

/** Liga o menu do cabeçalho. Independe do runner: funciona mesmo se o movimento falhar. */
export function LigarMenu() {
  useEffect(() => {
    try {
      return iniciarMenu()
    } catch (erro) {
      console.error('[menu] não ligou.', erro)
      Sentry.captureException(erro, { tags: { origem: 'menu' } })
      return undefined
    }
  }, [])
  return null
}
```

- [ ] **Step 5: Escrever `src/site/layout/Cabecalho.tsx`**

Marcação de `PROTOTIPO\src\page.html` (variante sem `pagina.landing`), com links de rota no lugar dos `.html`.

```tsx
import { conteudo } from '@/site/conteudo/conteudo'
import { LigarMenu } from './LigarMenu'

export type IdNav =
  | 'semog'
  | 'incorporadoras'
  | 'gestao'
  | 'garante'
  | 'tecnologia'
  | 'blog'
  | 'contato'
export type DestinoProposta = '#proposta' | '/proposta'

type ItemNav = { id: IdNav; href: string; rotulo: string }

const ANTES_DE_UNIDADES: readonly ItemNav[] = [
  { id: 'semog', href: '/semog', rotulo: 'A Semog' },
  { id: 'incorporadoras', href: '/incorporadoras', rotulo: 'Incorporadoras' },
  { id: 'gestao', href: '/administracao-de-condominios', rotulo: 'Gestão' },
  { id: 'garante', href: '/garante', rotulo: 'Garante' },
  { id: 'tecnologia', href: '/tecnologia', rotulo: 'Tecnologia' },
]
const DEPOIS_DE_UNIDADES: readonly ItemNav[] = [
  { id: 'blog', href: '/blog', rotulo: 'Blog' },
  { id: 'contato', href: '/contato', rotulo: 'Fale com a gente' },
]

type PropsCabecalho = { atual?: IdNav; destinoProposta: DestinoProposta }

function Links({ itens, atual }: { itens: readonly ItemNav[]; atual?: IdNav }) {
  return itens.map((item) => (
    <a
      key={item.id}
      href={item.href}
      data-pagina-link={item.id}
      aria-current={item.id === atual ? 'page' : undefined}
    >
      {item.rotulo}
    </a>
  ))
}

/** Cabeçalho completo do pacote app. O tema muda pela seção sob ele (core/tema.ts). */
export function Cabecalho({ atual, destinoProposta }: PropsCabecalho) {
  const { loginUrl } = conteudo.marca
  return (
    <header className="cabecalho" data-cabecalho="" data-tema="claro">
      <div className="cabecalho-faixa">
        <a className="marca" href="/" aria-label="Semog, página inicial">
          <svg className="marca-escura logo-escuro" viewBox="0 0 601.59 94.93" aria-hidden="true">
            <use href="#logo-semog" />
          </svg>
          <svg className="marca-clara logo-claro" viewBox="0 0 601.59 94.93" aria-hidden="true">
            <use href="#logo-semog" />
          </svg>
        </a>
        <nav className="nav" aria-label="Principal">
          <Links itens={ANTES_DE_UNIDADES} atual={atual} />
          <a href="/#unidades" data-secao-link="unidades">
            Unidades
          </a>
          <Links itens={DEPOIS_DE_UNIDADES} atual={atual} />
        </nav>
        <div className="cab-acoes">
          <span className="cab-separador" aria-hidden="true" />
          <a className="cab-login" href={loginUrl}>
            Login
          </a>
          <a className="botao botao--pequeno" href={destinoProposta}>
            Seja Semog
          </a>
          <button
            className="cab-menu"
            type="button"
            aria-expanded="false"
            aria-controls="painel-menu"
            data-menu=""
          >
            <span className="cab-menu-icone" aria-hidden="true">
              <i />
              <i />
            </span>
            <span>Menu</span>
          </button>
        </div>
      </div>
      <nav className="painel-menu" id="painel-menu" aria-label="Menu">
        <Links itens={ANTES_DE_UNIDADES} atual={atual} />
        <a href="/#unidades">Unidades</a>
        <Links itens={DEPOIS_DE_UNIDADES} atual={atual} />
        <a className="painel-login" href={loginUrl}>
          Login · Área do cliente
        </a>
      </nav>
      <LigarMenu />
    </header>
  )
}
```

- [ ] **Step 6: Escrever `src/site/layout/Rodape.tsx`**

```tsx
import { conteudo } from '@/site/conteudo/conteudo'
import type { DestinoProposta } from './Cabecalho'

const LINKS_SEMOG = [
  { href: '/semog', rotulo: 'A Semog' },
  { href: '/incorporadoras', rotulo: 'Incorporadoras' },
  { href: '/administracao-de-condominios', rotulo: 'Gestão completa' },
  { href: '/garante', rotulo: 'Semog Garante' },
  { href: '/tecnologia', rotulo: 'Tecnologia' },
  { href: '/blog', rotulo: 'Blog' },
] as const

/** Rodapé do pacote app (marcação de page.html do protótipo, sem a nota de protótipo). */
export function Rodape({ destinoProposta }: { destinoProposta: DestinoProposta }) {
  const { marca, unidades, numeros } = conteudo
  return (
    <footer className="rodape grao" data-tema="marinho">
      <div className="container rodape-grade">
        <div>
          <a className="marca" href="/" aria-label="Semog, página inicial">
            <svg className="logo-claro" viewBox="0 0 601.59 94.93" aria-hidden="true">
              <use href="#logo-semog" />
            </svg>
          </a>
          <p className="rodape-slogan">{marca.slogan}</p>
        </div>
        <div className="rodape-colunas">
          <div>
            <h2>Unidades Semog</h2>
            <ul>
              {unidades.map((unidade) => (
                <li key={unidade.id}>
                  <a href={unidade.url}>
                    {unidade.cidade}/{unidade.uf}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2>Semog</h2>
            <ul>
              {LINKS_SEMOG.map((link) => (
                <li key={link.href}>
                  <a href={link.href}>{link.rotulo}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2>Fale com a gente</h2>
            <ul>
              <li>
                <a href={destinoProposta}>Pedir proposta</a>
              </li>
              <li>
                <a href="/contato">Telefones e endereços</a>
              </li>
              <li>
                <a href={marca.loginUrl}>Login · Área do cliente</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="container rodape-base">
        <p>Semog · administradora de condomínios {numeros.anos.detalhe}.</p>
        <nav className="rodape-legal" aria-label="Documentos">
          <a href="/privacidade" data-pagina-link="privacidade">
            Privacidade
          </a>
          <a href="/termos" data-pagina-link="termos">
            Termos de uso
          </a>
        </nav>
      </div>
    </footer>
  )
}
```

- [ ] **Step 7: Escrever `src/site/layout/EsqueletoApp.tsx`**

```tsx
import type React from 'react'
import type { IdPaginaComCenas } from '@/site/cenas/registro'
import { RunnerDeCenas } from '@/site/runner/RunnerDeCenas'
import { Cabecalho, type IdNav } from './Cabecalho'
import { Rodape } from './Rodape'
import { SimbolosSvg } from './SimbolosSvg'

type PropsEsqueleto = {
  /** Vai para `<main data-pagina>` e escolhe a lista de cenas do runner. */
  pagina: IdPaginaComCenas
  atual?: IdNav
  /** A página tem a cena `#proposta`: "Seja Semog" e "Pedir proposta" vão para ela. */
  temProposta: boolean
  children: React.ReactNode
}

/** Esqueleto das páginas do pacote app (page.html do protótipo): cabeçalho, main, rodapé, runner. */
export function EsqueletoApp({ pagina, atual, temProposta, children }: PropsEsqueleto) {
  const destinoProposta = temProposta ? '#proposta' : '/proposta'
  return (
    <>
      <SimbolosSvg />
      <a className="pular" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Cabecalho atual={atual} destinoProposta={destinoProposta} />
      <main id="conteudo" data-pagina={pagina}>
        {children}
      </main>
      <Rodape destinoProposta={destinoProposta} />
      <RunnerDeCenas pagina={pagina} />
    </>
  )
}
```

- [ ] **Step 8: Escrever o layout raiz `src/app/(site)/layout.tsx`**

```tsx
import type React from 'react'
import { Analytics } from '@/components/analytics/Analytics'
import { AttributionTracker } from '@/components/analytics/AttributionTracker'
import { Clarity } from '@/components/analytics/Clarity'
import { ConsentProvider } from '@/providers/ConsentProvider'
import { barlow, saira } from '@/site/fontes'
import '@/site/estilos/tokens.css'
import '@/site/estilos/base.css'

/**
 * Layout raiz do site v2, irmão de `(frontend)` (spec 3.1). Navegar entre root layouts faz
 * carga completa, então o theme.css antigo e os estilos novos nunca coexistem.
 *
 * Antes de pintar, `sem-js` vira `js` (esconde só os elementos `.entrada` até o movimento estar
 * pronto); se o JS não chegar, a rede de segurança marca `motion` em 6 s. O React encontra a
 * classe já trocada: daí o `suppressHydrationWarning`.
 *
 * Consentimento e medição como no `(evento)`: Analytics e Clarity só sobem em host mensurável
 * (`measurableHost`), então Preview e local não medem.
 */
const TROCA_SEM_JS = `(function(){var d=document.documentElement;d.classList.remove('sem-js');d.classList.add('js');setTimeout(function(){d.classList.add('motion')},6000)})()`

export default function LayoutSite({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`sem-js ${saira.variable} ${barlow.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: script fixo nosso, sem entrada de usuário; precisa rodar antes da primeira pintura */}
        <script dangerouslySetInnerHTML={{ __html: TROCA_SEM_JS }} />
      </head>
      <body>
        <ConsentProvider>
          <Analytics />
          <Clarity />
          <AttributionTracker />
          {children}
        </ConsentProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 9: Escrever o sublayout `src/app/(site)/(app)/layout.tsx`**

```tsx
import type React from 'react'
import 'lenis/dist/lenis.css'

/** Pacote app (spec 3.1): páginas com Lenis e runner de cenas. O resto vem do layout raiz. */
export default function LayoutApp({ children }: { children: React.ReactNode }) {
  return children
}
```

- [ ] **Step 10: Rodar e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-layout.int.spec.tsx tests/int/site-v2-identidade.int.spec.ts`
Expected: PASS em todos. A varredura de identidade agora cobre os `.tsx` novos (nenhum `next/link`, nenhum hex).

- [ ] **Step 11: Checkpoint: rodar portões e commitar**

```powershell
pnpm exec biome check --write src/site "src/app/(site)" tests/int/site-v2-layout.int.spec.tsx
pnpm exec biome ci ./src ./tests ./scripts
pnpm exec tsc --noEmit
pnpm run check:server-actions
pnpm run test:int
pnpm build
git status --short
```

Expected: tudo verde. O build ainda não lista rota do `(site)` (nenhuma página existe; um layout sem página não gera rota). O `git status --short` lista só `src/site/layout/` (os cinco componentes), `src/app/(site)/layout.tsx`, `src/app/(site)/(app)/layout.tsx` e o teste; qualquer outro arquivo é falha de escopo.

```powershell
git branch --show-current && git add src/site/layout/SimbolosSvg.tsx src/site/layout/Cabecalho.tsx src/site/layout/LigarMenu.tsx src/site/layout/Rodape.tsx src/site/layout/EsqueletoApp.tsx "src/app/(site)/layout.tsx" "src/app/(site)/(app)/layout.tsx" tests/int/site-v2-layout.int.spec.tsx && git commit -m "feat(site-v2): layouts (site) e (app), cabeçalho, rodapé e menu

Layout raiz próprio (site), sublayout app, cabeçalho, rodapé e menu com links <a>.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
git status --short
```

Expected: o `git branch --show-current` imprime `feat/site-v2` (se imprimir outra, não commitar); o commit entra só com `src/site/layout/` (os cinco componentes), `src/app/(site)/layout.tsx`, `src/app/(site)/(app)/layout.tsx` e o teste; o `git status --short` final fica vazio. Sem push.

### Tarefa 1.8: Cena de prova (ranking) e rota `/previa-v2`

**Files:**
- Create: `src/site/secoes/home/Ranking.tsx`, `src/site/secoes/home/ranking.css`
- Create: `src/site/cenas/home/ranking.ts`
- Modify: `src/site/cenas/registro.ts`
- Create: `src/site/previa.ts`
- Create: `src/app/(site)/(app)/previa-v2/page.tsx`
- Modify: `tests/int/site-v2-core-ssr.int.spec.ts` (a cena)
- Test: `tests/int/site-v2-previa.int.spec.tsx`

**Interfaces:**
- Consumes: `EsqueletoApp` (1.7), `ContextoCena` (1.5, com `ctx.reportar`), `util.pinScrub`, `util.revelarTexto`, `util.revelarQuadro(quadro, reportar)`, `util.lacoVisivel`, `util.prepararCanvas2D`, `util.corDoToken`, `util.aoImprimir`, `type Pintura` (1.4), `conteudo`, `formatarNumero` (1.2).
- Produces: `Ranking()` (Server Component); `cenaRanking(ctx: ContextoCena): () => void` e `PATAMARES_RANKING: number[]`; `CENAS_POR_PAGINA.previa = [['ranking', cenaRanking]]`; `previaLiberada(ambiente?: string): boolean`; a rota `/previa-v2` com `metadata.robots = { index: false, follow: false }`.

A cena do ranking é a prova porque exercita quase todo o core numa só: pin com patamares (snap de toque), SplitText por máscara, canvas 2D com cor de token, laço visível, revelação de foto e gancho de impressão.

- [ ] **Step 1: Escrever o teste**

`tests/int/site-v2-previa.int.spec.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PaginaPrevia, { metadata } from '@/app/(site)/(app)/previa-v2/page'
import { CENAS_POR_PAGINA } from '@/site/cenas/registro'
import { PATAMARES_RANKING } from '@/site/cenas/home/ranking'
import { previaLiberada } from '@/site/previa'
import { procurarTermosVedados } from './helpers/identidade'

vi.mock('@/site/runner/RunnerDeCenas', () => ({ RunnerDeCenas: () => null }))
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('rota de prévia do site v2', () => {
  it('nunca abre em produção; abre em preview e local', () => {
    expect(previaLiberada('production')).toBe(false)
    expect(previaLiberada('preview')).toBe(true)
    expect(previaLiberada('development')).toBe(true)
    expect(previaLiberada(undefined)).toBe(true)
  })

  it('em produção a página responde 404', () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    expect(() => PaginaPrevia()).toThrow('NEXT_HTTP_ERROR_FALLBACK;404')
  })

  it('nunca é indexada', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false })
  })

  it('fora de produção, monta cabeçalho, main da página, a seção do ranking e rodapé', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    render(<PaginaPrevia />)
    expect(document.querySelector('[data-cabecalho]')).not.toBeNull()
    expect(document.querySelector('main#conteudo')?.getAttribute('data-pagina')).toBe('previa')
    expect(document.querySelector('section#ranking[data-tema="claro"]')).not.toBeNull()
    expect(document.querySelector('footer[data-tema="marinho"]')).not.toBeNull()
  })

  it('toda cena registrada para a prévia tem a sua seção na página', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    render(<PaginaPrevia />)
    for (const [id] of CENAS_POR_PAGINA.previa) {
      expect(document.getElementById(id), id).not.toBeNull()
    }
  })
})

describe('seção do ranking (texto completo sem JS)', () => {
  it('traz a chamada, a manchete, os ciclos e a foto do conteúdo', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    render(<PaginaPrevia />)
    expect(screen.getByRole('heading', { level: 2, name: /mais bem posicionada/ }).textContent).toBe(
      'A administradora mais bem posicionada do Norte e Nordeste.',
    )
    const manchete = document.querySelector('.ranking-manchete')?.textContent ?? ''
    expect(manchete.replace(/\s+/g, ' ').trim()).toBe('5º entre mais de 3.500 administradoras')
    expect(document.body.textContent).toContain('Ciclo 2026/27')
    expect(document.body.textContent).toContain('Ciclo 2024/25')
    // Os ciclos saem de ranking.ciclos, do mais antigo ao atual, e só o atual é destacado.
    const ciclos = Array.from(document.querySelectorAll('.ranking-ciclos li'))
    expect(ciclos).toHaveLength(3)
    expect(ciclos[0]?.textContent).toContain('Ciclo 2024/25')
    expect(ciclos[2]?.textContent).toContain('Ciclo 2026/27')
    expect(ciclos.map((li) => li.classList.contains('ranking-ciclo-atual'))).toEqual([
      false,
      false,
      true,
    ])
    const foto = document.querySelector('.ranking-foto img')
    expect(foto?.getAttribute('src')).toBe('/site-v2/fotos/reconhecimento-semog.webp')
    expect(foto?.getAttribute('alt')).toBe(
      'Equipe da Semog no palco do Superlógica Next 2026 com a placa do G20 Condo',
    )
  })

  it('nenhum termo vedado no texto renderizado', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    render(<PaginaPrevia />)
    expect(procurarTermosVedados(document.body.textContent ?? '')).toEqual([])
  })

  it('os patamares do toque são os do roteiro da cena', () => {
    expect(PATAMARES_RANKING).toHaveLength(5)
    const esperados = [0, 0.25, 0.49, 0.71, 1]
    PATAMARES_RANKING.forEach((ponto, i) => expect(ponto).toBeCloseTo(esperados[i], 10))
  })
})
```

- [ ] **Step 2: Acrescentar a cena ao teste de SSR**

Em `tests/int/site-v2-core-ssr.int.spec.ts`, ao fim de `MODULOS`:

```ts
  ['cena ranking', () => import('@/site/cenas/home/ranking')],
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-previa.int.spec.tsx`
Expected: FAIL com "Failed to resolve import '@/app/(site)/(app)/previa-v2/page'".

- [ ] **Step 4: Copiar o CSS da cena**

```powershell
New-Item -ItemType Directory -Force C:\Users\lekoc\semogapp\semogsite-site-v2\src\site\secoes\home, C:\Users\lekoc\semogapp\semogsite-site-v2\src\site\cenas\home | Out-Null
Copy-Item -LiteralPath C:\Users\lekoc\semogapp\semogsite\design-explorations\site-v2-prototipo\src\scenes\05-ranking.css -Destination C:\Users\lekoc\semogapp\semogsite-site-v2\src\site\secoes\home\ranking.css
```

Sem edição: o CSS já é escopado em `#ranking` e só usa tokens.

- [ ] **Step 5: Escrever `src/site/secoes/home/Ranking.tsx`**

Marcação de `PROTOTIPO\src\sections\05-ranking.html`. Os textos marcados `TEXTO-NOVO` no protótipo continuam marcados (pendência de conteúdo da spec 9; não são inventados aqui).

```tsx
import './ranking.css'
import { conteudo } from '@/site/conteudo/conteudo'
import { formatarNumero } from '@/site/formatar'

/** Seção do ranking (home). Sem JS: chamada, manchete, três passos, ciclos e foto, em leitura corrida. */
export function Ranking() {
  const { ranking } = conteudo
  const total = formatarNumero(ranking.total)
  const [atual] = ranking.ciclos
  // Do ciclo mais antigo ao atual (a linha se desenha da esquerda para a direita); o atual é destacado.
  const ciclosEmOrdem = [...ranking.ciclos].reverse()
  return (
    <section id="ranking" className="cena" data-tema="claro" aria-labelledby="ranking-titulo">
      <div className="ranking-palco">
        <canvas className="ranking-campo" aria-hidden="true" />
        <div className="container ranking-grade">
          {/* TEXTO-NOVO: fato informado pelo Leandro (a mais bem posicionada do Norte e Nordeste); ainda não está no conteúdo tipado */}
          <h2 id="ranking-titulo" className="ranking-passo ranking-chamada">
            <span data-texto="">
              A administradora <span className="peso">mais bem posicionada</span> do Norte e
              Nordeste.
            </span>
          </h2>
          <p className="ranking-manchete">
            <span className="ranking-posicao-mascara">
              <span className="ranking-posicao num peso">{ranking.posicao}º</span>
            </span>{' '}
            {/* TEXTO-NOVO: a manchete aprovada, dividida em numeral + frase (mesmo texto de ranking.titulo) */}
            <span className="ranking-entre">entre mais de {total} administradoras</span>
          </p>
          <div className="ranking-passos">
            <div className="ranking-passo" data-passo="0">
              {/* TEXTO-NOVO */}
              <p className="ranking-frase" data-texto="">
                Mais de <span className="peso">{total} administradoras</span> usam a Superlógica.
              </p>
            </div>
            <div className="ranking-passo" data-passo="1">
              {/* TEXTO-NOVO */}
              <p className="ranking-frase" data-texto="">
                Todo mês, o Ranking <span className="peso">Top 200</span> classifica essa base.
              </p>
              <p className="ranking-apoio" data-texto="">
                {ranking.apoio}
              </p>
            </div>
            <div className="ranking-passo" data-passo="2">
              {/* TEXTO-NOVO: mesmo fato de ranking.g20, com ênfase */}
              <p className="ranking-frase" data-texto="">
                No <span className="peso">G20 Condo</span> pelo terceiro ciclo seguido.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container ranking-depois">
        <div className="ranking-historico">
          {/* TEXTO-NOVO */}
          <p className="ranking-historico-titulo">Três ciclos seguidos no G20 Condo</p>
          <div className="ranking-linha">
            <span className="ranking-traco" aria-hidden="true" />
            <ol className="ranking-ciclos">
              {ciclosEmOrdem.map((ciclo) => (
                <li key={ciclo.ciclo} className={ciclo === atual ? 'ranking-ciclo-atual' : undefined}>
                  <span className="ranking-ciclo">
                    <span>Ciclo {ciclo.ciclo}</span>
                  </span>
                  <span className="ranking-ciclo-posicao">
                    {ciclo === atual ? (
                      <span>
                        G20 Condo, <span className="num">{ciclo.posicao}º</span>
                      </span>
                    ) : (
                      <span>G20 Condo</span>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <figure className="ranking-foto">
          <div className="moldura">
            {/* biome-ignore lint/performance/noImgElement: a cena anima moldura e parallax no próprio <img> (revelarQuadro), e /site-v2 fica fora do localPatterns do next/image */}
            <img
              src={ranking.foto}
              alt={ranking.alt}
              width={1600}
              height={900}
              loading="lazy"
              decoding="async"
            />
          </div>
          {/* TEXTO-NOVO: legenda derivada do alt (ranking.alt) */}
          <figcaption>Superlógica Next 2026, placa do G20 Condo.</figcaption>
        </figure>
      </div>
    </section>
  )
}
```

- [ ] **Step 6: Escrever `src/site/cenas/home/ranking.ts`**

Porta de `PROTOTIPO\src\scenes\05-ranking.js`: mesma coreografia e mesmos números; JSDoc vira tipo; `init` vira `cenaRanking` e devolve a limpeza do ouvinte de refresh (o protótipo nunca desmontava).

```ts
import type { ContextoCena } from '@/site/core/tipos'
import type { Pintura } from '@/site/core/util'

/**
 * Cena do ranking. Abre com a chamada de liderança e a explica pelos números num palco fixado:
 * um campo de pontos (as administradoras da base Superlógica) se filtra no Top 200, depois no
 * G20 Condo, e um único ponto acende em marinho na 5ª posição e viaja até virar a régua de onde
 * nasce o "5º". Depois do pin, a linha dos três ciclos se desenha e a foto abre. Sem canvas 2D,
 * a cena segue só com o texto, que é a versão completa.
 */

type Faixa = readonly [number, number]
type Passo = { readonly entra: Faixa | null; readonly sai: Faixa }
type EstadoRanking = { p: number; chegada: number }
type Area = { x0: number; x1: number; y0: number; y1: number }
type Tamanhos = { ponto: number; fileiraW: number; fileiraH: number; grupoW: number; grupoH: number }
type Geometria = {
  w: number
  h: number
  compacta: boolean
  campo: Float32Array
  fileira: Float32Array
  resto: Float32Array
  grupo: Float32Array
  regua: { x: number; y: number; w: number; h: number }
  tam: Tamanhos
  centro: { x: number; y: number }
}
type Tempos = { top: number; g20: number; revela: number; marca: number; regua: number; chegada: number }
type TextoMascarado = { posicionar: (dentro: number, fora: number) => void }

/** Ranking Top 200 e G20 Condo: os nomes são os tamanhos dos grupos. */
const TOP = 200
const G20 = 20
/** Índice do ponto da Semog: a posição no ranking, contando de zero. */
const PONTO_SEMOG = 4

/** Trechos da rolagem fixada (p de 0 a 1) em que o campo muda de forma. */
const FASES = {
  revela: [0.06, 0.16],
  top: [0.2, 0.4],
  g20: [0.5, 0.64],
  marca: [0.64, 0.7],
  regua: [0.7, 0.85],
} as const satisfies Record<string, Faixa>
/** Janelas dos passos, na ordem do HTML (a chamada é o primeiro). Um só entra quando o anterior saiu. */
const PASSOS: readonly Passo[] = [
  { entra: null, sai: [0.06, 0.12] },
  { entra: [0.12, 0.2], sai: [0.3, 0.35] },
  { entra: [0.35, 0.43], sai: [0.55, 0.6] },
  { entra: [0.6, 0.67], sai: [0.75, 0.8] },
]
const MANCHETE = {
  numeral: [0.81, 0.9],
  peso: [0.83, 0.97],
  frase: [0.85, 0.94],
} as const satisfies Record<string, Faixa>
/** Onde o toque assenta: a chamada no começo, o meio de cada passo inteiro na tela e a manchete. */
export const PATAMARES_RANKING: number[] = [
  0,
  ...PASSOS.slice(1).map(({ entra, sai }) => ((entra?.[1] ?? 0) + sai[0]) / 2),
  1,
]
/** Chegada (antes do pin) em que a chamada sobe da máscara. */
const CHAMADA_CHEGADA: Faixa = [0.15, 0.65]
/** Peso final do "5º": 550 equilibra com os títulos leves da página. */
const PESO_NUMERAL = 550
const NIVEIS = 40

const faixa = (v: number, a: number, b: number): number =>
  v <= a ? 0 : v >= b ? 1 : (v - a) / (b - a)
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
const suave = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
/** Cada ponto parte um pouco depois do outro: o movimento corre como onda, não em bloco. */
const local = (t: number, atraso: number): number =>
  suave(faixa(t, atraso * 0.35, atraso * 0.35 + 0.65))

export function cenaRanking(ctx: ContextoCena): () => void {
  const { root, util, gsap } = ctx
  const palco = root.querySelector('.ranking-palco')
  if (!(palco instanceof HTMLElement)) throw new Error('[cena ranking] .ranking-palco ausente.')
  root.classList.add('ranking-com-palco')
  const estado: EstadoRanking = { p: 0, chegada: 0 }

  const textos = montarTextos(ctx)
  const aplicar = () => textos.aplicar(estado)
  const tl = util.pinScrub(root, {
    alvo: palco,
    // No celular os passos ficam mais longos: o toque assenta no meio de cada um, e com 200%
    // eles ficavam a ~0,5 tela um do outro, menos que um flick curto.
    distancia: ctx.estreito() ? '+=300%' : '+=215%',
    patamares: () => PATAMARES_RANKING,
  })
  tl.to(estado, { p: 1, duration: 1, onUpdate: aplicar })
  gsap.to(estado, {
    chegada: 1,
    ease: 'none',
    onUpdate: aplicar,
    scrollTrigger: { trigger: root, start: 'top 95%', end: 'top 15%', scrub: 0.6 },
  })
  aplicar()

  const desligarCampo = ligarCampo(ctx, palco, estado)
  animarHistorico(ctx)
  const foto = root.querySelector('.ranking-foto')
  if (foto instanceof HTMLElement) util.revelarQuadro(foto, ctx.reportar)
  return desligarCampo
}

/* ---- Texto por máscara, dirigido pela rolagem ------------------------------------ */

function montarTextos(ctx: ContextoCena): { aplicar: (e: EstadoRanking) => void } {
  const { root, gsap, SplitText } = ctx
  const passos = Array.from(root.querySelectorAll('.ranking-passo')).map((passo) =>
    Array.from(passo.querySelectorAll('[data-texto]')).map((el) =>
      dividir(SplitText, el, 'lines', (partes) => linhaDeIdaEVolta(ctx.gsap, partes, el)),
    ),
  )
  const frase = dividir(SplitText, root.querySelector('.ranking-entre'), 'words', (partes) =>
    gsap
      .timeline({ paused: true })
      .fromTo(
        partes,
        { yPercent: 110 },
        { yPercent: 0, duration: 1, ease: 'expo.out', stagger: 0.06 },
      ),
  )
  const numeral = root.querySelector('.ranking-posicao')
  if (!(numeral instanceof HTMLElement)) throw new Error('[cena ranking] numeral ausente.')
  // `as` com motivo: o `quickSetter` do GSAP é tipado como `Function` (gsap-core.d.ts), o que
  // faria `subir(...)` devolver `any`; a assinatura real é (valor: number) => void.
  const subir = gsap.quickSetter(numeral, 'yPercent') as (valor: number) => void
  const expoOut = gsap.parseEase('expo.out')
  const pesoEase = gsap.parseEase('power2.inOut')

  return {
    aplicar(e) {
      passos.forEach((textosDoPasso, k) => {
        const { entra, sai } = PASSOS[k]
        const dentro = entra ? faixa(e.p, ...entra) : faixa(e.chegada, ...CHAMADA_CHEGADA)
        const fora = faixa(e.p, ...sai)
        textosDoPasso.forEach((texto, j) =>
          texto.posicionar(Math.max(0, dentro - j * 0.18) / (1 - j * 0.18), fora),
        )
      })
      subir(135 * (1 - expoOut(faixa(e.p, ...MANCHETE.numeral))))
      const peso = lerp(250, PESO_NUMERAL, pesoEase(faixa(e.p, ...MANCHETE.peso)))
      numeral.style.fontVariationSettings = `"wght" ${peso.toFixed(0)}`
      frase.posicionar(faixa(e.p, ...MANCHETE.frase), 0)
    },
  }
}

/** Divide o elemento em linhas ou palavras com máscara e guarda a timeline atual. */
function dividir(
  SplitText: ContextoCena['SplitText'],
  el: Element | null,
  tipo: 'lines' | 'words',
  montar: (partes: Element[]) => gsap.core.Timeline,
): TextoMascarado {
  const atual: { tl: gsap.core.Timeline | null; dentro: number; fora: number } = {
    tl: null,
    dentro: 0,
    fora: 0,
  }
  const posicionar = () => {
    const tl = atual.tl
    if (!tl) return
    const meio = tl.labels.meio ?? tl.duration()
    const tempo = atual.fora > 0 ? meio + atual.fora * (tl.duration() - meio) : atual.dentro * meio
    tl.time(tempo)
  }
  if (!(el instanceof HTMLElement)) throw new Error('[cena ranking] texto da cena ausente.')
  SplitText.create(el, {
    type: tipo,
    mask: tipo,
    autoSplit: true,
    linesClass: 'revela-linha',
    wordsClass: 'revela-palavra',
    onSplit(self) {
      atual.tl = montar(tipo === 'lines' ? self.lines : self.words)
      posicionar()
      return atual.tl
    },
  })
  return {
    posicionar(dentro, fora) {
      atual.dentro = Math.min(1, Math.max(0, dentro))
      atual.fora = fora
      posicionar()
    },
  }
}

/** Linhas entram de baixo e saem para cima; o `.peso` de dentro ganha peso na entrada. */
function linhaDeIdaEVolta(
  motor: ContextoCena['gsap'],
  linhas: Element[],
  el: Element,
): gsap.core.Timeline {
  const tl = motor
    .timeline({ paused: true })
    .fromTo(
      linhas,
      { yPercent: 110 },
      { yPercent: 0, duration: 1, ease: 'expo.out', stagger: 0.1 },
    )
  const pesos = el.querySelectorAll('.peso')
  if (pesos.length) {
    tl.fromTo(
      pesos,
      { fontVariationSettings: '"wght" 250' },
      { fontVariationSettings: '"wght" 600', duration: 1, ease: 'power2.inOut' },
      0.3,
    )
  }
  return tl
    .addLabel('meio')
    .fromTo(
      linhas,
      { yPercent: 0 },
      { yPercent: -110, duration: 0.7, ease: 'expo.in', stagger: 0.06, immediateRender: false },
    )
}

/* ---- Campo de pontos (canvas 2D) ---------------------------------------------------- */

/** Liga o campo; devolve a limpeza do ouvinte de refresh (o gsap.context a chama no revert). */
function ligarCampo(ctx: ContextoCena, palco: HTMLElement, estado: EstadoRanking): () => void {
  const { root, util, ScrollTrigger, conteudo } = ctx
  const canvas = root.querySelector('.ranking-campo')
  if (!(canvas instanceof HTMLCanvasElement)) throw new Error('[cena ranking] canvas ausente.')
  const sementes = criarSementes(conteudo.ranking.total)
  let pintura: Pintura | null = null
  let geo: Geometria | null = null
  let cor = ''
  const montar = () => {
    if (!document.documentElement.classList.contains('motion')) return
    try {
      // O canvas só tem tamanho quando aparece: a classe vem antes da medida.
      root.classList.add('ranking-com-campo')
      pintura = util.prepararCanvas2D(canvas)
      geo = medirGeometria(root, palco, sementes, ctx.estreito())
      cor = `rgb(${util.corDoToken('--marinho').join(' ')})`
    } catch (erro) {
      pintura = null
      root.classList.remove('ranking-com-campo')
      // A cena segue só com o texto; a falha vai ao Sentry (origem final `cena:ranking:campo`).
      ctx.reportar(erro, 'campo')
    }
  }
  ScrollTrigger.addEventListener('refresh', montar)
  montar()
  const quadro = criarQuadro(sementes.n)
  util.lacoVisivel(root, (tempo) => {
    if (!pintura || !geo) return
    calcularQuadro(quadro, { geo, sementes, estado, tempo })
    desenhar(pintura, quadro, cor)
  })
  return () => ScrollTrigger.removeEventListener('refresh', montar)
}

/** Números pseudoaleatórios estáveis (mulberry32): o campo é o mesmo a cada visita. */
function aleatorio(semente: number): () => number {
  let a = semente >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Por ponto: a casa no campo (embaralhada), a fase do respiro, o brilho e o atraso. */
function criarSementes(n: number) {
  const sorte = aleatorio(3500)
  const casa = Uint32Array.from({ length: n }, (_, i) => i)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(sorte() * (i + 1))
    ;[casa[i], casa[j]] = [casa[j], casa[i]]
  }
  const jitter = Float32Array.from({ length: n * 2 }, () => sorte())
  const fase = Float32Array.from({ length: n }, () => sorte() * Math.PI * 2)
  const brilho = Float32Array.from({ length: n }, () => sorte())
  const atraso = Float32Array.from({ length: n }, () => sorte())
  return { n, casa, jitter, fase, brilho, atraso }
}
type Sementes = ReturnType<typeof criarSementes>

function medirGeometria(
  root: HTMLElement,
  palco: HTMLElement,
  s: Sementes,
  compacta: boolean,
): Geometria {
  const caixa = palco.getBoundingClientRect()
  const area = medirArea(root, caixa, compacta)
  const tam: Tamanhos = {
    ponto: compacta ? 2 : 2.5,
    fileiraW: compacta ? 1.5 : 2,
    fileiraH: compacta ? 8 : 13,
    grupoW: compacta ? 3 : 4,
    grupoH: compacta ? 34 : 55,
  }
  return {
    w: caixa.width,
    h: caixa.height,
    compacta,
    campo: poseCampo(s, area),
    fileira: poseFileira(area, tam, compacta ? 4 : 2, TOP),
    resto: poseFileira(area, tam, compacta ? 4 : 2, TOP - G20),
    grupo: poseGrupo(area, tam),
    regua: medirRegua(root, caixa, compacta),
    tam,
    centro: { x: (area.x0 + area.x1) / 2, y: (area.y0 + area.y1) / 2 },
  }
}

/** Área livre do campo: à direita dos passos no desktop, acima deles no celular. */
function medirArea(root: HTMLElement, caixa: DOMRect, compacta: boolean): Area {
  const grade = root.querySelector('.ranking-grade')
  const passos = root.querySelector('.ranking-passos')
  if (!grade || !passos) throw new Error('[cena ranking] grade ou passos ausentes.')
  const g = grade.getBoundingClientRect()
  const l = passos.getBoundingClientRect()
  const cabecalho = document.querySelector('[data-cabecalho]')?.getBoundingClientRect().height ?? 68
  if (compacta) {
    return { x0: g.left - caixa.left, x1: g.right - caixa.left, y0: cabecalho + 21, y1: l.top - caixa.top - 34 }
  }
  return { x0: l.right - caixa.left + 55, x1: g.right - caixa.left, y0: cabecalho + 34, y1: caixa.height - 55 }
}

/** Grade com tremor: cobre a área sem formar padrão. */
function poseCampo(s: Sementes, a: Area): Float32Array {
  const w = a.x1 - a.x0
  const h = a.y1 - a.y0
  const colunas = Math.max(1, Math.round(Math.sqrt((s.n * w) / h)))
  const linhas = Math.ceil(s.n / colunas)
  const pose = new Float32Array(s.n * 2)
  for (let i = 0; i < s.n; i++) {
    const c = s.casa[i]
    const col = c % colunas
    const lin = Math.floor(c / colunas)
    pose[i * 2] = a.x0 + ((col + s.jitter[i * 2]) / colunas) * w
    pose[i * 2 + 1] = a.y0 + ((lin + s.jitter[i * 2 + 1]) / linhas) * h
  }
  return pose
}

/** Fileiras na ordem do ranking (Top 200 e, quando o G20 sobe, os 180 que ficam). */
function poseFileira(a: Area, tam: Tamanhos, fileiras: number, quantos: number): Float32Array {
  const porFileira = quantos / fileiras
  const passo = (a.x1 - a.x0) / porFileira
  const vao = 13
  const cy = (a.y0 + a.y1) / 2
  const pose = new Float32Array(quantos * 2)
  for (let i = 0; i < quantos; i++) {
    const f = Math.floor(i / porFileira)
    pose[i * 2] = a.x0 + ((i % porFileira) + 0.5) * passo - tam.fileiraW / 2
    pose[i * 2 + 1] = cy + (f - fileiras / 2) * (tam.fileiraH + vao) + vao / 2
  }
  return pose
}

/** O G20 espaçado na largura da área, com a base na mesma linha da fileira. */
function poseGrupo(a: Area, tam: Tamanhos): Float32Array {
  const passo = (a.x1 - a.x0) / G20
  const base = (a.y0 + a.y1) / 2 + tam.fileiraH / 2
  const pose = new Float32Array(G20 * 2)
  for (let i = 0; i < G20; i++) {
    pose[i * 2] = a.x0 + (i + 0.5) * passo - tam.grupoW / 2
    pose[i * 2 + 1] = base - tam.grupoH
  }
  return pose
}

/** A régua fica logo abaixo do recorte do numeral: o "5º" nasce dela. */
function medirRegua(root: HTMLElement, caixa: DOMRect, compacta: boolean): Geometria['regua'] {
  const mascara = root.querySelector('.ranking-posicao-mascara')
  if (!mascara) throw new Error('[cena ranking] máscara do numeral ausente.')
  const r = mascara.getBoundingClientRect()
  return { x: r.left - caixa.left, y: r.bottom - caixa.top + (compacta ? 5 : 8), w: r.width, h: compacta ? 2 : 3 }
}

/** Buffers do quadro, reaproveitados (nada é alocado no laço). */
function criarQuadro(n: number) {
  return {
    n,
    x: new Float32Array(n),
    y: new Float32Array(n),
    w: new Float32Array(n),
    h: new Float32Array(n),
    a: new Float32Array(n),
  }
}
type Quadro = ReturnType<typeof criarQuadro>
type DadosQuadro = { geo: Geometria; sementes: Sementes; t: Tempos }

function calcularQuadro(
  q: Quadro,
  { geo, sementes, estado, tempo }: { geo: Geometria; sementes: Sementes; estado: EstadoRanking; tempo: number },
): void {
  const t: Tempos = {
    top: faixa(estado.p, ...FASES.top),
    g20: faixa(estado.p, ...FASES.g20),
    revela: faixa(estado.p, ...FASES.revela),
    marca: suave(faixa(estado.p, ...FASES.marca)),
    regua: faixa(estado.p, ...FASES.regua),
    chegada: estado.chegada,
  }
  for (let i = 0; i < q.n; i++) {
    posicionarNoCampo(q, i, { geo, sementes, t }, tempo)
    if (i < TOP) alinhar(q, i, { geo, sementes, t })
    else q.a[i] *= 1 - 0.62 * local(t.top, sementes.atraso[i]) - 0.3 * t.regua
  }
}

/** Pose de partida: o campo, que chega de um pouco mais aberto e respira devagar. */
function posicionarNoCampo(q: Quadro, i: number, { geo, sementes, t }: DadosQuadro, tempo: number): void {
  const atraso = sementes.atraso[i]
  const fase = sementes.fase[i]
  const chegou = local(t.chegada, atraso)
  const abertura = 1 + 0.16 * (1 - chegou)
  const vida = i < TOP ? 1 - local(t.top, atraso) : 1
  const amplitude = (geo.compacta ? 2 : 3) * vida
  q.x[i] = geo.centro.x + (geo.campo[i * 2] - geo.centro.x) * abertura
  q.y[i] = geo.centro.y + (geo.campo[i * 2 + 1] - geo.centro.y) * abertura
  q.x[i] += Math.sin(tempo * 0.5 + fase) * amplitude
  q.y[i] += Math.cos(tempo * 0.43 + fase * 1.7) * amplitude
  q.w[i] = geo.tam.ponto
  q.h[i] = geo.tam.ponto
  const brilho = 0.22 + 0.2 * sementes.brilho[i]
  const veu = 0.38 + 0.62 * t.revela
  q.a[i] = brilho * (0.78 + 0.22 * Math.sin(tempo * 0.9 + fase)) * chegou * veu
}

/** Top 200 → fileira; G20 → espaçados; o 5º → marinho e régua. */
function alinhar(q: Quadro, i: number, { geo, sementes, t }: DadosQuadro): void {
  const atraso = sementes.atraso[i]
  const e1 = local(t.top, atraso)
  mover(q, i, geo.fileira[i * 2], geo.fileira[i * 2 + 1], geo.tam.fileiraW, geo.tam.fileiraH, e1)
  q.a[i] = lerp(q.a[i], 0.55, e1)
  const e2 = local(t.g20, atraso)
  if (i >= G20) {
    const j = (i - G20) * 2
    mover(q, i, geo.resto[j], geo.resto[j + 1], geo.tam.fileiraW, geo.tam.fileiraH, e2)
    q.a[i] = lerp(q.a[i], 0.12, e2) * (1 - 0.4 * t.regua)
    return
  }
  mover(q, i, geo.grupo[i * 2], geo.grupo[i * 2 + 1], geo.tam.grupoW, geo.tam.grupoH, e2)
  q.a[i] = lerp(q.a[i], 0.72, e2)
  if (i !== PONTO_SEMOG) {
    q.a[i] = lerp(q.a[i], geo.compacta ? 0.08 : 0.24, t.marca)
    return
  }
  q.a[i] = lerp(q.a[i], 1, t.marca)
  tracarRegua(q, i, geo, t.regua)
}

/** O ponto da Semog encolhe numa ponta, viaja até o numeral e se estica como um traço. */
function tracarRegua(q: Quadro, i: number, geo: Geometria, t: number): void {
  const r = geo.regua
  mover(q, i, r.x, r.y, geo.tam.grupoW, r.h, suave(faixa(t, 0, 0.58)))
  q.w[i] = lerp(q.w[i], r.w, suave(faixa(t, 0.42, 1)))
}

/** Interpola o retângulo do ponto até o alvo. */
function mover(q: Quadro, i: number, x: number, y: number, w: number, h: number, t: number): void {
  q.x[i] = lerp(q.x[i], x, t)
  q.y[i] = lerp(q.y[i], y, t)
  q.w[i] = lerp(q.w[i], w, t)
  q.h[i] = lerp(q.h[i], h, t)
}

/** Uma cor só (marinho); a opacidade faz o resto, agrupada por nível para poucos fill(). */
function desenhar({ ctx, w, h }: Pintura, q: Quadro, cor: string): void {
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = cor
  for (let nivel = 1; nivel <= NIVEIS; nivel++) {
    ctx.globalAlpha = nivel / NIVEIS
    ctx.beginPath()
    for (let i = 0; i < q.n; i++) {
      if (i === PONTO_SEMOG || Math.round(q.a[i] * NIVEIS) !== nivel) continue
      ctx.rect(q.x[i], q.y[i], q.w[i], q.h[i])
    }
    ctx.fill()
  }
  ctx.globalAlpha = q.a[PONTO_SEMOG]
  ctx.fillRect(q.x[PONTO_SEMOG], q.y[PONTO_SEMOG], q.w[PONTO_SEMOG], q.h[PONTO_SEMOG])
  ctx.globalAlpha = 1
}

/* ---- Depois do pin: a linha dos ciclos ------------------------------------------- */

/** A linha se desenha da esquerda para a direita; cada ciclo acende quando a ponta passa por ele. */
function animarHistorico({ root, gsap, util }: ContextoCena): void {
  const historico = root.querySelector('.ranking-historico')
  const traco = root.querySelector('.ranking-traco')
  const titulo = root.querySelector('.ranking-historico-titulo')
  if (!historico || !traco || !(titulo instanceof HTMLElement)) return
  util.revelarTexto(titulo, { gatilho: historico, inicio: 'top 82%' })
  const desenho = gsap.parseEase('expo.inOut')
  const DURACAO = 1.3
  const tl = gsap.timeline({ scrollTrigger: { trigger: historico, start: 'top 82%', once: true } })
  tl.fromTo(traco, { scaleX: 0 }, { scaleX: 1, duration: DURACAO, ease: 'expo.inOut' }, 0.15)
  const itens = Array.from(root.querySelectorAll('.ranking-ciclos li'))
  itens.forEach((li, k) => {
    const quando = 0.15 + DURACAO * inverso(desenho, k / itens.length)
    tl.fromTo(li, { '--marca': 0 }, { '--marca': 1, duration: 0.6, ease: 'expo.out' }, quando)
    tl.from(
      li.querySelectorAll(':scope > span > span'),
      { yPercent: 110, duration: 0.9, ease: 'expo.out', stagger: 0.08 },
      quando + 0.05,
    )
  })
  util.aoImprimir(() => tl.progress(1))
}

/** Tempo (0 a 1) em que uma curva monótona chega a `alvo`, por bisseção. */
function inverso(curva: (t: number) => number, alvo: number): number {
  let a = 0
  let b = 1
  for (let k = 0; k < 24; k++) {
    const m = (a + b) / 2
    if (curva(m) < alvo) a = m
    else b = m
  }
  return (a + b) / 2
}
```

- [ ] **Step 7: Registrar a cena**

`src/site/cenas/registro.ts` passa a ser:

```ts
import type { ListaCenas } from '@/site/core/tipos'
import { cenaRanking } from './home/ranking'

/**
 * Cenas de cada página, na ordem das seções (o PAGINAS do main.js do protótipo). A página
 * `previa` é a rota /previa-v2 da fundação: prova o core com a cena do ranking.
 * Fase 4: avaliar carregar por página com import() se o bundle passar do orçamento.
 */
export const CENAS_POR_PAGINA = {
  previa: [['ranking', cenaRanking]],
} as const satisfies Record<string, ListaCenas>

export type IdPaginaComCenas = keyof typeof CENAS_POR_PAGINA
```

- [ ] **Step 8: Escrever `src/site/previa.ts`**

```ts
/**
 * A rota de prévia do site v2 (/previa-v2) existe para ver a fundação em Preview e local. Em
 * produção ela responde 404. `VERCEL_ENV` é definido pela própria Vercel no build e no
 * servidor (production, preview, development) e nunca chega ao navegador. A rota é estática:
 * a decisão é tomada no BUILD, então só vale se a Vercel expuser as variáveis de sistema ao
 * build. [A CONFIRMAR] "Automatically expose System Environment Variables" ligado no projeto
 * `semogsite`; sem isso `VERCEL_ENV` fica indefinido e a prévia abriria em produção (com
 * `noindex`). A conferência real é `curl /previa-v2` = 404 em produção, item da fase 5.
 */
export function previaLiberada(ambiente: string | undefined = process.env.VERCEL_ENV): boolean {
  return ambiente !== 'production'
}
```

- [ ] **Step 9: Escrever `src/app/(site)/(app)/previa-v2/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { EsqueletoApp } from '@/site/layout/EsqueletoApp'
import { previaLiberada } from '@/site/previa'
import { Ranking } from '@/site/secoes/home/Ranking'

export const metadata: Metadata = {
  title: 'Prévia do site v2 · Semog',
  robots: { index: false, follow: false },
}

/** Bancada da fundação: a cena do ranking dentro do Next. 404 em produção (src/site/previa.ts). */
export default function PaginaPrevia() {
  if (!previaLiberada()) notFound()
  return (
    <EsqueletoApp pagina="previa" temProposta={false}>
      <Ranking />
    </EsqueletoApp>
  )
}
```

- [ ] **Step 10: Rodar e ver passar**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-v2-previa.int.spec.tsx tests/int/site-v2-core-ssr.int.spec.ts tests/int/site-v2-identidade.int.spec.ts`
Expected: PASS em todos (oito da prévia, quatorze de SSR, nove de identidade).

- [ ] **Step 11: Checkpoint: rodar portões e commitar**

```powershell
pnpm exec biome check --write src/site "src/app/(site)" tests/int/site-v2-previa.int.spec.tsx tests/int/site-v2-core-ssr.int.spec.ts
pnpm exec biome ci ./src ./tests ./scripts
pnpm exec tsc --noEmit
pnpm run check:server-actions
pnpm run test:int
pnpm build
git status --short
```

Expected: tudo verde; a saída do `pnpm build` lista `○ /previa-v2` (estática) entre as rotas. O `git status --short` lista só `src/site/secoes/home/` (Ranking.tsx e ranking.css), `src/site/cenas/home/ranking.ts`, `src/site/cenas/registro.ts`, `src/site/previa.ts`, `src/app/(site)/(app)/previa-v2/page.tsx` e os dois testes; qualquer outro arquivo é falha de escopo.

```powershell
git branch --show-current && git add src/site/secoes/home/Ranking.tsx src/site/secoes/home/ranking.css src/site/cenas/home/ranking.ts src/site/cenas/registro.ts src/site/previa.ts "src/app/(site)/(app)/previa-v2/page.tsx" tests/int/site-v2-core-ssr.int.spec.ts tests/int/site-v2-previa.int.spec.tsx && git commit -m "feat(site-v2): cena do ranking e rota /previa-v2

Primeira cena real (ranking) atrás de /previa-v2, que responde 404 em produção e
tem noindex em qualquer ambiente.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
git status --short
```

Expected: o `git branch --show-current` imprime `feat/site-v2` (se imprimir outra, não commitar); o commit entra só com `src/site/secoes/home/` (Ranking.tsx e ranking.css), `src/site/cenas/home/ranking.ts`, `src/site/cenas/registro.ts`, `src/site/previa.ts`, `src/app/(site)/(app)/previa-v2/page.tsx` e os dois testes; o `git status --short` final fica vazio. Sem push.

### Tarefa 1.9: Ferramentas de verificação e verificação completa no navegador

Esta tarefa é executada por um **verificador separado** de quem implementou as 1.1–1.8 (regra de 28/09/2026: mudança de comportamento e efeito no build exigem verificação completa). O implementador escreve as duas ferramentas (Steps 1–2); o verificador roda o resto e reporta a saída real.

**Files:**
- Create: `scripts/site-v2-quadros.mjs`
- Create: `scripts/site-v2-toque.mjs` (porta de `PROTOTIPO\scripts\toque-flicks.mjs`)

**Interfaces:**
- Consumes: a rota `/previa-v2` (1.8) e o protótipo servido.
- Produces: quadros PNG da cena do ranking (Next e protótipo, Chromium e Firefox, 1440 e 390) e a tabela de flicks de toque, num relatório.

- [ ] **Step 1: Escrever `scripts/site-v2-quadros.mjs`**

```js
/* Quadros de uma cena presa do site v2: abre a página, espera html.motion, mede o pin da cena
   (pin-spacer + data-patamares) e fotografa a tela em 0, 25, 50, 75 e 100% do pin, para
   comparar lado a lado o site no Next com o protótipo (mesmos quadros nas mesmas posições).
   Uso: node scripts/site-v2-quadros.mjs --url <endereço> --cena <id> --saida <pasta>
        [--navegador chromium|firefox] [--largura 1440|390]
   Sai com código 1 se houver erro de página, erro de console, resposta >= 400 ou scroll
   horizontal. */
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { chromium, firefox } from '@playwright/test'

const PROGRESSOS = [0, 0.25, 0.5, 0.75, 1]
/** Espera depois de rolar: deixa o scrub (0,7 s) e o Lenis assentarem antes do print. */
const ASSENTAR_MS = 1500

function lerArgs(argv) {
  const args = { navegador: 'chromium', largura: 1440 }
  const fila = [...argv]
  while (fila.length) {
    const opcao = fila.shift()
    const valor = fila.shift()
    if (valor === undefined) throw new Error(`Opção sem valor: ${opcao}`)
    if (opcao === '--url') args.url = valor
    else if (opcao === '--cena') args.cena = valor
    else if (opcao === '--saida') args.saida = valor
    else if (opcao === '--navegador') args.navegador = valor
    else if (opcao === '--largura') args.largura = Number(valor)
    else throw new Error(`Opção desconhecida: ${opcao}`)
  }
  if (!args.url || !args.cena || !args.saida) {
    throw new Error('Obrigatórios: --url, --cena e --saida.')
  }
  return args
}

/** Começo e extensão do pin da cena, lidos do pin-spacer. */
function geometria(pagina, id) {
  return pagina.evaluate((alvoId) => {
    const alvo = document.querySelector(`#${alvoId} [data-patamares]`)
    const espaco = alvo?.parentElement
    if (!(alvo instanceof HTMLElement) || !espaco?.classList.contains('pin-spacer')) {
      throw new Error(`#${alvoId}: pin com data-patamares não encontrado`)
    }
    return {
      inicio: espaco.getBoundingClientRect().top + window.scrollY,
      extensao: espaco.offsetHeight - alvo.offsetHeight,
    }
  }, id)
}

async function rolarAte(pagina, y) {
  await pagina.evaluate((alvoY) => window.scrollTo(0, alvoY), y)
  await pagina.waitForTimeout(ASSENTAR_MS)
  const real = await pagina.evaluate(() => window.scrollY)
  if (Math.abs(real - y) <= 2) return
  await pagina.evaluate((alvoY) => window.scrollTo(0, alvoY), y)
  await pagina.waitForTimeout(ASSENTAR_MS)
}

async function main() {
  const args = lerArgs(process.argv.slice(2))
  const tipo = args.navegador === 'firefox' ? firefox : chromium
  const navegador = await tipo.launch()
  const falhas = []
  try {
    const altura = args.largura < 761 ? 844 : 900
    const contexto = await navegador.newContext({ viewport: { width: args.largura, height: altura } })
    const pagina = await contexto.newPage()
    pagina.on('pageerror', (erro) => falhas.push(`pageerror: ${erro.message}`))
    pagina.on('console', (msg) => {
      if (msg.type() === 'error') falhas.push(`console: ${msg.text()}`)
    })
    pagina.on('response', (resposta) => {
      if (resposta.status() >= 400) falhas.push(`HTTP ${resposta.status()} ${resposta.url()}`)
    })
    await pagina.goto(args.url, { waitUntil: 'load' })
    await pagina.waitForFunction(() => document.documentElement.classList.contains('motion'), null, {
      timeout: 15000,
    })
    await pagina.waitForTimeout(1200)
    const geo = await geometria(pagina, args.cena)
    mkdirSync(args.saida, { recursive: true })
    for (const p of PROGRESSOS) {
      await rolarAte(pagina, Math.round(geo.inicio + p * geo.extensao))
      const rotulo = String(Math.round(p * 100)).padStart(3, '0')
      const nome = `${args.cena}-${args.navegador}-${args.largura}-${rotulo}.png`
      await pagina.screenshot({ path: path.join(args.saida, nome) })
    }
    const horizontal = await pagina.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    )
    if (horizontal) falhas.push('scroll horizontal')
  } finally {
    await navegador.close()
  }
  if (falhas.length) {
    console.error(`${falhas.length} falha(s):\n- ${falhas.join('\n- ')}`)
    process.exitCode = 1
    return
  }
  console.log(`Quadros salvos em ${args.saida}`)
}

main().catch((erro) => {
  console.error(erro)
  process.exitCode = 1
})
```

- [ ] **Step 2: Portar o script de toque**

```powershell
Copy-Item -LiteralPath C:\Users\lekoc\semogapp\semogsite\design-explorations\site-v2-prototipo\scripts\toque-flicks.mjs -Destination C:\Users\lekoc\semogapp\semogsite-site-v2\scripts\site-v2-toque.mjs
```

Edições em `scripts/site-v2-toque.mjs`, exatamente estas:
1. `import { chromium } from "playwright";` → `import { chromium } from '@playwright/test'`
2. Apagar a linha `import { servir } from "../serve.mjs";`
3. Apagar a constante `CENAS` inteira (o array de pares página/cena).
4. Em `lerArgs`, o objeto inicial vira `{ url: '', cenas: [], desktop: true, relatorio: false }` e entra o ramo `else if (opcao === "--url") args.url = fila.shift();` antes do `else throw`. Depois do laço: `if (!args.url || !args.cenas.length) throw new Error('Obrigatórios: --url e --cena.')`.
5. No bloco final, trocar as linhas de `const cenas = …` até `await servidor.fechar();` por:

```js
const args = lerArgs(process.argv.slice(2))
const cenas = args.cenas.map((id) => [args.url, id])
const navegador = await chromium.launch({ channel: 'chromium', args: ARGS })
const falhas = []
try {
  await celular(navegador, '', cenas, falhas, args.relatorio)
  if (args.desktop) await desktop(navegador, '', cenas, falhas)
} finally {
  await navegador.close()
}
```

6. No comentário do topo, acrescentar: `Uso: node scripts/site-v2-toque.mjs --url <endereço> --cena <id> [--cena <id>] [--sem-desktop] [--relatorio]`.

Depois: `pnpm exec biome check --write scripts/site-v2-quadros.mjs scripts/site-v2-toque.mjs` e `pnpm exec biome ci ./scripts`. Expected: verde.

- [ ] **Step 3: Subir o site da WT e o protótipo**

```powershell
Set-Location C:\Users\lekoc\semogapp\semogsite-site-v2
pnpm exec playwright install chromium firefox
pnpm build
$next = Start-Process -PassThru -NoNewWindow node -ArgumentList 'node_modules/next/dist/bin/next','start','-p','3100'
Set-Location C:\Users\lekoc\semogapp\semogsite\design-explorations\site-v2-prototipo
pnpm install --offline; if ($LASTEXITCODE -ne 0) { pnpm install }
pnpm build
$prototipo = Start-Process -PassThru -NoNewWindow node -ArgumentList 'serve.mjs'
```

Expected: `http://localhost:3100/previa-v2` e `http://127.0.0.1:4180/index.html` respondem 200 (se a porta 4180 estiver ocupada, o `serve.mjs` usa a seguinte e diz qual).

- [ ] **Step 4: Status das URLs do site no ar, na build local**

```powershell
foreach ($u in '/', '/semog', '/solucoes', '/administracao-de-condominios', '/garante', '/incorporadoras', '/blog', '/proposta', '/contato', '/privacidade', '/termos', '/administradora-de-condominios-recife', '/experience', '/previa-v2') {
  curl.exe -s -o NUL -w "$u %{http_code}`n" "http://localhost:3100$u"
}
foreach ($u in '/solucoes.html', '/domestica', '/sobre', '/administradora-de-condominio-belem') {
  curl.exe -s -o NUL -w "$u %{http_code} %{redirect_url}`n" "http://localhost:3100$u"
}
curl.exe -s -D - -o NUL http://localhost:3100/previa-v2 | Select-String -Pattern 'X-Robots-Tag|Content-Security-Policy'
curl.exe -s http://localhost:3100/previa-v2 | Select-String -Pattern 'name="robots"'
```

Expected: todas as páginas atuais e `/previa-v2` em 200; `/solucoes.html` e `/domestica` em 308 para `/solucoes`, `/sobre` em 308 para `/semog`, `/administradora-de-condominio-belem` em 308 para a landing de Belém; o HTML da prévia traz `<meta name="robots" content="noindex, nofollow"/>`; a CSP do `next.config.ts` está no cabeçalho.

- [ ] **Step 5: Produção simulada: a prévia some**

```powershell
Stop-Process -Id $next.Id
Set-Location C:\Users\lekoc\semogapp\semogsite-site-v2
$env:VERCEL_ENV = 'production'; pnpm build; Remove-Item Env:VERCEL_ENV
$next = Start-Process -PassThru -NoNewWindow node -ArgumentList 'node_modules/next/dist/bin/next','start','-p','3100'
curl.exe -s -o NUL -w "%{http_code}`n" http://localhost:3100/previa-v2
curl.exe -s -o NUL -w "%{http_code}`n" http://localhost:3100/semog
Stop-Process -Id $next.Id
pnpm build
$next = Start-Process -PassThru -NoNewWindow node -ArgumentList 'node_modules/next/dist/bin/next','start','-p','3100'
```

Expected: `404` para `/previa-v2` e `200` para `/semog` na build com `VERCEL_ENV=production`; depois a build normal volta a servir a prévia. Isto prova o código, não a Vercel: se o projeto não expuser as System Environment Variables ao build, `VERCEL_ENV` não chega e a prévia abriria em produção. Registrar no relatório do Step 11 o [A CONFIRMAR] "System Environment Variables expostas" e o item da fase 5 da spec: `curl /previa-v2` = 404 no domínio de produção depois da virada.

- [ ] **Step 6: Quadros da cena, Next contra protótipo, 2 navegadores e 2 larguras**

```powershell
Set-Location C:\Users\lekoc\semogapp\semogsite-site-v2
$saida = '<scratchpad>\quadros-ranking'
foreach ($nav in 'chromium', 'firefox') { foreach ($l in 1440, 390) {
  node scripts/site-v2-quadros.mjs --url http://localhost:3100/previa-v2 --cena ranking --saida "$saida\next" --navegador $nav --largura $l
  node scripts/site-v2-quadros.mjs --url http://127.0.0.1:4180/index.html --cena ranking --saida "$saida\prototipo" --navegador $nav --largura $l
} }
```

Expected: oito execuções com código 0 (sem erro de console, sem 404, sem scroll horizontal). O verificador **abre e olha** os 40 PNGs aos pares (mesmo nome em `next\` e `prototipo\`) e reporta, por quadro: mesma fase da coreografia (chamada, Top 200, G20, régua, manchete), mesma fonte (Saira leve nos títulos, Barlow no corpo), mesmas cores, mesmo corte. Diferença esperada e aceitável: o que está acima e abaixo da cena (a home do protótipo tem outras cenas; a prévia só tem esta).

- [ ] **Step 7: Toque emulado e desktop sem snap**

```powershell
node scripts/site-v2-toque.mjs --url http://localhost:3100/previa-v2 --cena ranking
node scripts/site-v2-toque.mjs --url http://127.0.0.1:4180/index.html --cena ranking --relatorio
```

Expected: o primeiro sai com "Toque e desktop: tudo certo." (cada flick para num patamar ±0,02, o médio anda no máximo dois, o médio para trás volta; no desktop a rolagem não anda sozinha depois de parar). O segundo imprime a tabela do protótipo como linha de base; a do Next deve ter os mesmos patamares de chegada.

- [ ] **Step 8: Checagens à mão no navegador (Chromium e Firefox)**

Com a prévia aberta em `http://localhost:3100/previa-v2`, em cada navegador:
1. Console sem erro e sem violação de CSP, do carregamento até o fim da página.
2. Fontes: no console, `getComputedStyle(document.querySelector('h2')).fontFamily` contém o nome gerado da Saira, e `document.fonts.check('300 16px ' + getComputedStyle(document.documentElement).getPropertyValue('--fonte-saira'))` dá `true`.
3. Tema do cabeçalho: claro sobre o ranking; marinho quando o rodapé passa sob ele (esperar ≥400 ms depois de rolar antes de ler `data-tema`).
4. `http://localhost:3100/previa-v2#ranking`: abre na seção, sem erro "reading 'end'" no console.
5. Recarregar com a página no meio do pin: volta ao mesmo ponto, sem erro.
6. Clicar no logo (vai para `/`, site antigo, carga completa) e voltar pelo histórico: a cena continua presa e animando; `document.querySelectorAll('.pin-spacer').length` é `1`.
7. Largura 390: o botão Menu abre e fecha o painel; Esc fecha e devolve o foco.
8. Impressão (`Ctrl+P`, pré-visualização): manchete, passos, ciclos e foto aparecem; nada com opacidade zero.
9. **Rolar a página inteira** até o rodapé nas duas larguras: nada cortado, nenhuma barra saindo da tela.

- [ ] **Step 9: Montagem dupla em desenvolvimento**

```powershell
Stop-Process -Id $next.Id
pnpm dev
```

Em `http://localhost:3000/previa-v2`: console sem erro; `document.querySelectorAll('.pin-spacer').length` é `1`; a rolagem não fica "dobrada" (um giro de roda anda o mesmo que na build de produção). Encerrar o `pnpm dev` e o `serve.mjs` do protótipo ao fim (`Stop-Process -Id $prototipo.Id`).

- [ ] **Step 10: Checkpoint final: portões, prova de escopo e commitar**

```powershell
Set-Location C:\Users\lekoc\semogapp\semogsite-site-v2
pnpm exec biome check --write scripts/site-v2-quadros.mjs scripts/site-v2-toque.mjs
pnpm exec biome ci ./src ./tests ./scripts
pnpm exec tsc --noEmit
pnpm run check:server-actions
pnpm run test:int
pnpm build
git diff --stat origin/main...HEAD
git status --short
```

Expected: os cinco verdes. **Prova de escopo:** o `git status --short` está vazio (tudo das tarefas 1.1 a 1.8 já foi commitado) exceto os dois scripts novos desta tarefa; e o `git diff --stat origin/main...HEAD` (o acumulado dos commits locais da branch) lista só `biome.json`, `next.config.ts`, `package.json`, `pnpm-lock.yaml`, `public/site-v2/`, `scripts/site-v2-*.mjs` (depois do commit abaixo), `src/app/(site)/`, `src/site/` e `tests/int/` (helpers e `site-v2-*`). Nenhum PNG, log ou arquivo do scratchpad dentro da WT. Qualquer outra linha, em qualquer das duas saídas, é falha de escopo: parar e investigar antes de commitar.

```powershell
git branch --show-current && git add scripts/site-v2-quadros.mjs scripts/site-v2-toque.mjs && git commit -m "chore(site-v2): scripts de quadros e de toque para verificar a prévia

Porta de toque-flicks.mjs do protótipo e captura dos quadros do ranking (Next contra
protótipo, Chromium e Firefox, 1440 e 390).

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013fZgqh8MzzrABNHa4SKBNn"
git diff --stat origin/main...HEAD
git status --short
```

Expected: o `git branch --show-current` imprime `feat/site-v2`; depois do commit, o `git status --short` fica vazio e o `git diff --stat origin/main...HEAD` lista exatamente o conjunto acima.

- [ ] **Step 11: Relatório ao Leandro e próximos passos externos [DEPENDE DO LEANDRO]**

O verificador entrega: saída real de cada passo, os pares de quadros com o que divergiu, a tabela de toque, e qualquer termo vedado ou `A CONFIRMAR` encontrado (inclusive o das System Environment Variables da Vercel, Step 5). Os commits locais por tarefa já estão na `feat/site-v2` (autorizados em 15/10/2026); esta tarefa não commita mais nada além do Step 10. Só com o "ok" do Leandro: push da branch, abertura do PR e conferência do Preview da Vercel (`/previa-v2` 200 com `noindex`; nenhuma medição disparando). O merge na `main` não faz parte desta fase.

---

## Auto-revisão

**1. Cobertura da spec (fases 0 e 1):**

| Requisito da spec | Tarefa |
| --- | --- |
| 8.0 Search Console das 3 URLs (decisão: `/solucoes` mantida, as outras duas redirecionam) | 0.2 e 1.3 |
| 8.0 / 7 Skew Protection | 0.3 |
| 8.0 / 7 org do Sentry | 0.4 |
| 7 Preview `noindex`, sem medição, sem `EXACT_*` | 0.4 (variáveis), 1.7 (medição só em host mensurável), 1.8 (`robots`) |
| 8.0 "endereços/rotas faltantes" | 0.5 (resolvido em 15/10: sem lista; NAP das Unidades e rota da 2ª via, nas fases 3 e 4) |
| 3.1 fontes `next/font/local`, só latin | 1.1 |
| 3.1 tokens | 1.1 |
| 3.3 guardas de CSS no Vitest | 1.1 |
| 2 e 6 "validade jurídica" e demais termos vedados no site v2 inteiro | 1.1 (varre o texto de `src/site/**` e `src/app/(site)/**`), 1.2 (conteúdo tipado), 1.8 (render da prévia) |
| 3.1 conteúdo tipado, marca inexistente é erro de tipo | 1.2 |
| 8.1 teste de inventário de URLs e redirects | 1.3 |
| 6 os 54 redirects ficam todos; `/solucoes` mantida como página; 2 redirects para `/tecnologia` | 1.3 |
| 7 `@gsap/react`, `gsap` 3.15, `lenis` 1.3.26, sem `three` | 1.4 |
| 3.2 snap direcional só no toque, helper único no core | 1.4 (`patamares.ts`), 1.8 (patamares do ranking), 1.9 (flicks) |
| 3.2 estabilização da barra de endereço | 1.5 (`ignoreMobileResize`, a alternativa medida no protótipo) |
| 3.1 `montarPagina` chamada pelo runner, com desmonte explícito | 1.5 e 1.6 (ver nota abaixo) |
| 3.1 runner com `useGSAP`, um context por seção, revert no unmount, Sentry na falha (inclusive a falha parcial, por `ctx.reportar`) | 1.5, 1.6 e 1.8 |
| 3.1 layout raiz `(site)` + sublayout app; `suppressHydrationWarning` | 1.7 |
| 3.1 links `<a>` | 1.7 (componentes) e 1.1 (guarda contra `next/link`) |
| 10 vazamento de listeners/pins: teardown testado em ida e volta | 1.6 (unitário) e 1.9 (navegador) |
| Primeira página atrás de rota que não afeta o site no ar | 1.8 e 1.9 |

Fora desta fase, de propósito: sublayouts `landing` e `leitura` (`leitura` na fase 3 e `landing` na fase 6, quando há página para eles: layout sem página é código morto; desvio anotado na spec 8, fase 1); conteúdo e lugar da `/solucoes` no v2 (pendência da spec 9, bloqueia a fase 4); sitemap e OG do inventário (fase 3); formulário (fase 2); `criarDinamica` (fase 4).

**Nota sobre "o core vira um provider":** um provider no layout `(app)` montaria **depois** das cenas, porque no React o efeito do filho (a página) roda antes do efeito do pai (o layout); o Lenis ainda não existiria quando as cenas criassem os pins. Por isso o "provider" é o módulo `montarPagina`, chamado pelo runner na ordem do `main.js` do protótipo (Lenis → topo → cenas → posição → tema → impressão → altura), com o mesmo desmonte explícito que a spec pede.

**2. Varredura de placeholders:** nenhum "TBD"/"TODO"/"implementar depois". Os pontos que dependem de leitura externa estão marcados `[A CONFIRMAR]` com o caminho para confirmar (nome do campo da Skew Protection, que a 0.3 já resolveu na prática; System Environment Variables expostas ao build da Vercel, na 1.8 e na 1.9). O interpretador Python do toolkit (`C:\Python313\python.exe`) e as tarefas 0.3 e 0.4 já estão resolvidos. Dois passos instruem cópia literal em vez de reproduzir o texto no plano, ambos com teste que pega divergência: o array de 54 redirects (Tarefa 1.3, teste de contagem e de conteúdo) e os `d` do logo (Tarefa 1.7, teste contra `_reference/semog-logo.svg`).

**3. Consistência de tipos e nomes:** `montarPagina(cenas: ListaCenas, opcoes: OpcoesMontagem)` (1.6) é o que o `RunnerDeCenas` chama; `ContextoCena` (1.5) é o que `cenaRanking` recebe (1.8); `IdPaginaComCenas` (1.6) é o tipo de `pagina` em `RunnerDeCenas` e `EsqueletoApp` (1.7); `DestinoProposta` é exportado por `Cabecalho` e usado por `Rodape`; `entradaDe` (1.3) é usado nos testes de 1.3 e 1.7; `PATAMARES_RANKING` (1.8) é o mesmo nome no teste; `previaLiberada` (1.8) é o mesmo na página e no teste; `Pintura` (1.4) é o tipo que `cenaRanking` importa de `util`; `Reportar` nasce em `ganchos.ts` (1.4), é o tipo de `ContextoCena.reportar` (1.5), de `OpcoesMontagem.reportar` e do argumento de `iniciarImpressao`/`executarGanchosImpressao`/`revelarQuadro` (1.4, 1.5, 1.6), e a montagem prefixa a origem do `ctx.reportar` com `cena:<id>:`.

**4. Review Focus:** as cinco linhas têm teste na tarefa dona: SSR (1.5 e 1.6, `site-v2-core-ssr`), montagem dupla (1.6, três ciclos e StrictMode), cena que quebra (1.6, três casos mais a falha parcial por `ctx.reportar` e o contexto global do GSAP livre depois do erro síncrono), página fora do topo (1.5, `alvoDaAncora`; 1.9, navegador), produção intocada (1.3, 54 redirects e cadeias; 1.8, 404 e `robots`; 1.9, `curl`).

## Execução

Plano salvo em `docs/superpowers/plans/2026-10-15-site-v2-fase-0-1-fundacao.md`. Cada tarefa termina com um commit local na `feat/site-v2` (autorizado em 15/10/2026); nenhum push, PR ou deploy sem o "ok" do Leandro. Recomendação: **subagent-driven** (implementador por tarefa, verificador separado na 1.9), porque as tarefas 1.4 a 1.8 dependem das interfaces umas das outras e um erro de desmonte só aparece no navegador, onde o custo de descobrir tarde é refazer o core.
