# Landing do Semog Experience 2026 — design

**Data:** 21/08/2026
**Status:** aprovado pelo Leandro em 21/08/2026

## O que é

Página de divulgação e captação de inscrições do **Semog Experience 2026** — uma
manhã wellness gratuita na Praia do Cabo Branco, em João Pessoa. Substitui em
propósito o evento de 2025 (campeonato de beach tennis), que vira prova social
via vídeo.

A página é **isolada do site**: sem header, sem rodapé de navegação, sem botão
flutuante de WhatsApp. Ela existe para uma coisa só — a pessoa entender o evento
e se inscrever.

### Dados do evento

| | |
|---|---|
| Data | **26/09/2026 (sábado)** — confirmada pelo Leandro |
| Horário | 07h às 12h |
| Local | Praia do Cabo Branco, João Pessoa/PB |
| Preço | Gratuito |
| Vagas | **200** |
| Programação | Recepção e alongamento · Pilates · Treino funcional · Alongamento e relaxamento · Água de coco · Avaliação física · Encerramento |

## Decisões tomadas

**Rota isolada com layout próprio.** Hoje `src/app/(frontend)/layout.tsx` é o
único layout e injeta `HeaderServer`, `FooterServer`, `WhatsAppFloat`,
`Preloader` e `CookieBanner`. Um segundo route group `(evento)` ganha layout
próprio que herda **fontes, `theme.css`, `ConsentProvider`, `CookieBanner`,
`Analytics` e `AttributionTracker`** — mas nenhum elemento de navegação. Rota
final: `/experience`.

Manter o `AttributionTracker` é deliberado: é ele que grava o cookie
`semog-attrib` de onde sai o `gclid` no servidor. Sem ele, uma futura campanha de
mídia para o evento ficaria cega.

**Inscrição reaproveita `submitForm`, sem tabela nova.** A server action
`src/app/(frontend)/_actions/submit-form.ts` já resolve rate limit por IP,
verificação do Turnstile e `INSERT` em `cms.leads (form, data, gclid, email)`.
Basta estender `FormType` de `'contato' | 'proposta'` para incluir
`'experience'`. Os campos próprios do evento vão no `data` (jsonb), que é
schemaless — nenhuma migration.

**A inscrição NÃO vai para o Exact.** Hoje `submitForm` chama `pushLeadToExact`
depois do insert. Inscrição em evento de relacionamento não é lead comercial:
misturar sujaria o funil do time e distorceria a contagem de leads das análises
de marketing (ver a memória do ciclo de agosto, em que leads do site batem 1:1
com o GA4 — esse casamento quebra se inscrições entrarem no mesmo balaio). O
push ao Exact fica condicionado a `form !== 'experience'`.

**Campos do formulário:**

| Campo | Obrigatório | Por quê |
|---|---|---|
| Nome completo | sim | credenciamento no dia |
| E-mail | sim | confirmação e lembrete |
| WhatsApp | sim | canal dominante da Semog |
| Condomínio | não | saber se é cliente, sem barrar quem não é |
| Acompanhantes (0–3) | não | dimensionar as 200 vagas de verdade |
| Aceite de uso de imagem | **sim** | o evento é fotografado e filmado |

O aceite de imagem é caixa marcável explícita, nunca pré-marcada, com texto
curto e link para a política de privacidade. Em evento com registro audiovisual
isso deixa de ser detalhe jurídico e vira proteção da empresa.

**Contagem de vagas.** A página exibe "200 vagas" como informação fixa, **não um
contador ao vivo**. Contador exigiria leitura do banco a cada visita e cria um
problema pior: se a inscrição andar devagar, o número exposto desestimula. O
controle real é uma consulta que eu rodo quando você pedir.

**Patrocinadores em arquivo de dados** (`src/data/experienceSponsors.ts`), no
mesmo espírito de `src/data/cityLandings.ts`. Começa só com a **Superlógica** e
aceita novos sem tocar no layout.

Logo obtida do **kit oficial** da Superlógica
(`superlogica.design/resources/logo-e-tagline-superlogica.zip`), não de banco de
logos de terceiros. As diretrizes deles definem a versão colorida como primária
para fundos claros — por isso a faixa de patrocinadores tem fundo claro, e a
versão colorida é a usada. As mesmas diretrizes proíbem aplicar o logo sobre
imagem, com sombra ou em preto, o que o layout respeita.

## Estrutura da página

Segue o mockup aprovado, com a paleta real da marca (`theme.css`: navy
`#0a102e`/`#1b2d70`, acento ice `#add5eb`).

1. **Hero** — "SEMOG EXPERIENCE", tagline "Movimento. Saúde. Conexão.", data,
   horário e local, CTA de inscrição, selo "+35 anos"
2. **Três pilares** — Bem-estar · Conexão · Saúde
3. **Programação** — linha do tempo da manhã + foto do Cabo Branco
4. **Vídeo do Experience 2025** — prova social do beach tennis
5. **Faixa de CTA** — inscrição gratuita, vagas limitadas
6. **Formulário de inscrição** — âncora `#inscricao`, alvo de todos os CTAs
7. **Patrocinadores**
8. **Rodapé enxuto** — contato e social, sem navegação do site

A numeração da programação é cronológica de verdade (07h00 → 11h30), então os
horários são o próprio marcador — não há numeração decorativa.

## Imagens: banco de imagens, não fotos do evento anterior

**Decisão do Leandro (21/08):** o hero e a programação usam **fotos de banco de
imagens com licença comercial** (Unsplash/Pexels), não registros do evento
passado. O motivo é de conteúdo, não de estética: **2025 foi um campeonato de
beach tennis e 2026 é uma manhã wellness** — foto de quadra de areia
comunicaria o evento errado.

Critério de seleção: alongamento, pilates ou treino funcional ao ar livre, em
praia, com luz de amanhecer (o evento começa 07h) e pessoas reais em movimento.
Evitar banco de imagem óbvio — sorriso posado para a câmera, academia coberta,
fundo branco.

Cada imagem baixada vai para o bucket do Supabase, como o resto da mídia do
site, com `alt` descritivo obrigatório (`content/media.ts` lança se o arquivo
não tiver alt mapeado). A licença de cada arquivo fica registrada no commit.

**O vídeo de 2025 continua**, mas com enquadramento honesto: a seção diz
explicitamente que a edição passada foi um campeonato de beach tennis e que o
formato muda a cada ano. Isso transforma uma incoerência potencial ("o vídeo não
é do que estão anunciando") em argumento — o Experience é uma série, e a energia
é o que se repete.

## Vídeo: hospedar em vez de embutir

O material é um Reel do Instagram
(`instagram.com/reel/DRm_ivskVfC/`). **Recomendação: subir o arquivo original
para o bucket do Supabase** e tocar nativamente, como já é feito com
`garante.mp4` (`media-src` do CSP já libera esse host).

Motivos: embutir o Instagram exige liberar `instagram.com` em `script-src` e
`frame-src` do CSP — abrir a política de segurança para um terceiro só para
tocar um vídeo próprio; o player dele carrega um bundle pesado e some se o post
for arquivado; e o visual não acompanha a página. Hospedado, o vídeo abre com
poster, respeita `prefers-reduced-motion` e não depende de ninguém.

Se o arquivo original não existir mais, o plano B é capa estática clicável que
abre o Reel em nova aba — sem tocar no CSP.

## Fora de escopo (YAGNI)

Contador de vagas ao vivo · e-mail automático de confirmação (SendGrid existe no
projeto, mas é escopo próprio) · área de login para inscritos · check-in no dia ·
galeria de fotos · integração com o Exact.

## Testes

- `submitForm` com `form: 'experience'`: grava em `cms.leads` e **não** chama o
  Exact
- Schema de validação: rejeita e-mail inválido, WhatsApp curto e aceite de
  imagem desmarcado
- A rota `/experience` **não** renderiza header, rodapé nem WhatsApp flutuante
- A rota `/` continua renderizando os três (o layout novo não vaza)
- `npm run build` e `tsc --noEmit` limpos

## Pendências do cliente

1. **Arquivo original do vídeo** do beach tennis, se existir — senão, capa
   clicável para o Reel.
2. Confirmar se a **Superlógica** aprova aparecer como patrocinadora nesta peça.

Resolvidas em 21/08: data confirmada (26/09/2026) e decisão de usar banco de
imagens em vez de fotos do evento anterior.
