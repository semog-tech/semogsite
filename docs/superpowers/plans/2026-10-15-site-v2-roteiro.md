# Site v2 em produção: roteiro dos planos

Spec: `docs/superpowers/specs/2026-10-15-site-v2-producao-design.md` (aprovada pelo Leandro em
15/10/2026). Este roteiro divide a spec em planos e PRs. O único plano detalhado até agora é o
das fases 0 e 1: `2026-10-15-site-v2-fase-0-1-fundacao.md`. Cada fase seguinte ganha um plano
próprio, escrito quando a anterior estiver mergeada na branch de integração, para que ele parta
do código real e não de uma suposição.

**Por que a fundação vem antes do formulário (mesmo sendo o formulário o que gera receita):**
o formulário de duas etapas só tem onde morar nas páginas novas, e essas páginas dependem do
layout `(site)`, das fontes, dos tokens e do runner. O que pode adiantar receita (a migração de
`cms.leads` e o cron) não depende da fundação, e por isso a fase 2 pode correr em paralelo à 1
(ver dependências).

## Antes de tudo: a base da branch

- O `main` local deste checkout está **32 commits atrás** de `origin/main` (local `77e82ee`,
  remoto `39ff63e`, conferido por `git ls-remote` em 15/10/2026). A 2ª via, a triagem do
  WhatsApp e o `PropostaRapidaForm` que a spec cita só existem em `origin/main`. A branch de
  integração **sai de `origin/main`** depois de um `git fetch`, nunca do `main` local.
- O protótipo (`design-explorations/site-v2-prototipo/`), a spec e estes planos **não estão
  versionados** (aparecem como `??` no `git status`). Numa worktree eles não existem; os planos
  os citam pelo caminho absoluto no checkout principal. Antes da fase 7 (que apaga material
  local), o protótipo precisa ser arquivado (commit num repo privado ou zip fora do repo).
  [DEPENDE DO LEANDRO: onde arquivar]
- Branch de integração: `feat/site-v2`, com Preview `noindex`, sem medição e sem `EXACT_*`
  (spec 7). Cada fase abre um PR para `feat/site-v2`. As viradas são merges de `feat/site-v2`
  (ou de um recorte dela) na `main`, que deploya sozinha na Vercel.

## Fases, planos e PRs

| Fase | Plano / PR | Depende de | Verificação |
| --- | --- | --- | --- |
| 0 · Pré-requisitos | parte do plano `fase-0-1-fundacao` (tarefas 0.x), sem PR | nada | checagem de dado real (Search Console, Vercel, Sentry); sem código |
| 1 · Fundação | plano `fase-0-1-fundacao`, PR 1 → `feat/site-v2` | fase 0 (só a base da branch) | completa: verificador separado, rota de prévia em Chromium e Firefox, 1440 e 390, toque emulado |
| 2 · Formulários | plano `fase-2-formularios` (a escrever), PR 2 → `feat/site-v2`; a migração de `cms.leads` é passo próprio, antes do PR, com confirmação do Leandro | fase 0; **não** depende da fase 1 para a migração, o schema, as actions, o cron e o e-mail; depende da fase 1 só para a tela das duas etapas | completa: verificador separado, banco real (INSERT em transação revertida), Exact, SendGrid, Ads, cookie de etapa, navegador em 2 browsers; envio real à mão em produção controlada |
| 3 · Leitura | plano `fase-3-leitura` (a escrever), PR 3 → `feat/site-v2` | fase 1 | leve para o texto dos posts; **completa** para sitemap e OG do inventário novo (afetam indexação) |
| 4 · Institucional | plano `fase-4-institucional` (a escrever); pode virar dois PRs: 4a (home, A Semog, Gestão) e 4b (Garante, Incorporadoras, Tecnologia, proposta, contato, 404, WhatsApp "só para clientes", redirects) | fases 1, 2 e 3; pendências de conteúdo da spec 9 respondidas | completa: verificador separado, quadros por cena contra o protótipo, toque, redirects por `curl`, 2 browsers |
| 5 · Virada 1 | plano `fase-5-virada-1` (checklist curto), merge `feat/site-v2` → `main` sem as 4 landings | fases 2, 3 e 4; Skew Protection decidida | completa: `curl` de cada URL do inventário, console sem violação de CSP em produção, sitemap reenviado, primeiro lead real conferido no banco, no Exact e no Ads |
| 6 · Virada 2 | plano `fase-6-landings` (a escrever), PR das 4 landings, merge no início de um ciclo do Ads | fase 5 estável (uma semana de leads conferidos) | completa: idem fase 5 nas 4 cidades; rollback = revert |
| 7 · Limpeza | plano `fase-7-limpeza` (a escrever), PR final | fase 6 estável | leve para remoção de código morto; completa para o que mexe em rota (`/styleguide`, `[[...slug]]`) |

## Critério de pronto de cada fase

- **0.** Search Console das 3 URLs consultado e o resultado levado ao Leandro; estado da Skew
  Protection conhecido e decidido; org do Sentry confirmada contra o `next.config.ts`;
  Preview da `feat/site-v2` sem `EXACT_*` e com `noindex` conferido; worktree criada de
  `origin/main` com os cinco portões verdes antes de qualquer mudança.
- **1.** A rota `/previa-v2` renderiza a cena do ranking dentro do Next, em Preview e local, com
  fontes, tokens, cabeçalho, rodapé, Lenis, runner e snap de toque; em produção ela responde
  404. Guardas de CSS, conteúdo tipado e inventário de URLs rodam no Vitest da CI. Nenhuma URL do
  site no ar muda de status. Os cinco portões da CI verdes.
- **2.** Migração aplicada e conferida em `information_schema` e com INSERT real revertido; as
  duas etapas gravam uma linha só; o Exact recebe uma vez (etapa 2 na hora, só etapa 1 pelo cron
  depois de ~45 min; lead com `etapa` nula, do formulário antigo e do assunto "proposta
  comercial" do contato, segue ao Exact na hora e o cron o trata como completo); a conversão
  do Ads sai pelo servidor junto com o Exact (na hora com a etapa 2, ou após ~45 min só com a
  etapa 1), enquanto o GA4 segue disparando `generate_lead` na etapa 1; e-mail interno roteado
  pela UF; "já é cliente" fora do Exact e do Ads;
  falha de gravação aparece na tela e no Sentry do servidor; `submitForm('proposta')` e
  `submitPropostaRapida` continuam respondendo; `check:server-actions` verde.
- **3.** Blog, 12 posts, privacidade e termos no pacote leitura; o post
  `assembleia-virtual-validade-juridica` reescrito sem "validade jurídica" (slug mantido) e o
  guarda de termos vedados varrendo também o conteúdo do blog; sitemap e OG saem do inventário
  (teste trava que nenhuma página some); script de comparação de metadata por URL sem
  diferença não explicada.
- **4.** Seis páginas institucionais, proposta, contato e 404 reproduzem o protótipo nos
  quadros de cada cena; WhatsApp de proposta fora de todo o conteúdo; "Sou cliente" com a 2ª
  via; redirects 308 das 3 URLs sem cadeia (o teste de inventário da fase 1 passa com a lista
  de cadeias vazia); NAP com fonte única e teste de consistência.
- **5.** Tudo do critério de sucesso da spec 1 medido em produção, menos as landings.
- **6.** As 4 landings no site novo, `FAQPage` alimentado pelas perguntas do protótipo,
  conversões do Ads conferidas no primeiro dia do ciclo.
- **7.** Blocos antigos, `theme.css`, Clash/Satoshi, `LenisProvider` antigo, `/styleguide`, a
  rota de prévia `/previa-v2`, o protótipo local do Codex (`src/app/(prototipo)/`,
  `src/components/prototype/`, `public/prototype/`, `tests/int/prototype-solutions.int.spec.tsx`,
  a alteração local de `next.config.ts` com `localPatterns` de `/prototype` e `/cities`) e a
  nota do AGENTS.md sobre o Playwright removidos; `git status` limpo.

## Calibragem da verificação (regra de 28/09/2026)

- **Completa** (verificador separado do implementador, dado real, navegador em Chromium e
  Firefox): fases 1, 2, 4, 5 e 6, e qualquer PR que toque formulário, banco, Exact, e-mail,
  Ads, redirects ou sitemap.
- **Leve** (a sessão principal roda os portões e o teste do ponto mexido): ajuste de texto,
  comentário, lint, export sem uso, e a parte de conteúdo da fase 3.
- **Uma rodada final de verificador por PR**, não uma por leva de correção.

## Decisões que ficam com o Leandro ao longo do roteiro

- Fase 0: se alguma das 3 URLs a redirecionar merece continuar (com o dado do Search Console
  na mão); ligar ou não a Skew Protection; onde arquivar o protótipo.
- Fase 2: rodar a migração no banco (confirmação explícita, é irreversível na prática); o envio
  real em produção controlada.
- Fase 4: as pendências de conteúdo da spec 9, antes do plano da fase 4 ser escrito.
- Fases 5 e 6: os merges na `main` (deploy automático) e a data da virada 2 no ciclo do Ads.
