# Landing do Semog Experience 2026 — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publicar em `/experience` uma landing isolada (sem header/rodapé do site) que divulga o Semog Experience 2026 e capta inscrições gratuitas no banco.

**Architecture:** Um segundo route group (`(evento)`) com layout próprio isola a página da navegação do site, mantendo tema, fontes, consentimento e atribuição. A inscrição reaproveita a server action `submitForm` com um novo `FormType 'experience'` — os campos vão no `data` (jsonb) de `cms.leads`, sem migration. Conteúdo do evento e patrocinadores ficam em arquivos de dados, no mesmo espírito de `src/data/cityLandings.ts`.

**Tech Stack:** Next.js (App Router) · React Hook Form + Zod · Cloudflare Turnstile · Postgres via `pg` · Vitest (`tests/int/**/*.int.spec.{ts,tsx}`) · Playwright (`tests/e2e`)

**Spec:** `docs/superpowers/specs/2026-08-21-semog-experience-landing-design.md`

## Global Constraints

- **Data do evento:** 26/09/2026 (sábado), 07h às 12h, Praia do Cabo Branco, João Pessoa/PB. Gratuito. **200 vagas.**
- **Um único ponto de configuração** para data/horário/local/vagas: `src/data/experienceEvent.ts`. Nenhuma dessas informações pode ser digitada dentro de componente.
- **A inscrição nunca vai para o Exact.** Evento de relacionamento não é lead comercial.
- **Sem contador de vagas ao vivo.** A página exibe "200 vagas" como texto fixo.
- **Regras de redação do site valem aqui** (`site-compliance`): a Semog *assessora*, não assume a operação; serviço jurídico só "com escritório parceiro"; registros sem sigla de estado.
- **Logo da Superlógica:** usar `logo-superlogica-color.svg` do kit oficial, **sobre fundo claro**. As diretrizes da marca proíbem aplicar o logo sobre imagem, com sombra, em preto ou em contorno.
- **Alt obrigatório:** `content/media.ts` lança erro se um arquivo não tiver alt mapeado. Toda imagem nova precisa de alt descritivo.
- **Paleta:** tokens de `src/styles/theme.css` (navy `#0a102e`/`#1b2d70`, acento ice `#add5eb`). Não inventar cor nova.
- **Executar comandos com `pnpm`** (o projeto usa pnpm; `npm run build` também funciona).

---

### Task 1: Schema e registro do formulário de inscrição

**Files:**
- Modify: `src/lib/form-schemas.ts` (acrescentar ao final, antes de nenhum export existente ser tocado)
- Modify: `src/lib/forms.ts:13` (o `FormType`) e `src/lib/forms.ts:21` (o objeto `FORMS`)
- Test: `tests/int/experience-schema.int.spec.ts`

**Interfaces:**
- Consumes: helpers já existentes em `form-schemas.ts` — `requiredText(message: string)`, `requiredPhone(requiredMessage: string, invalidMessage: string)`
- Produces: `experienceSchema` (Zod object), `ExperienceValues = z.infer<typeof experienceSchema>`, `ExperienceInput = z.input<typeof experienceSchema>`, `FormType` passa a incluir `'experience'`, `FORMS.experience`

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/int/experience-schema.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { experienceSchema } from '@/lib/form-schemas'
import { FORMS } from '@/lib/forms'

const valido = {
  nome: 'Maria Souza',
  email: 'maria@exemplo.com.br',
  telefone: '+5583999501388',
  condominio: 'Residencial Cabo Branco',
  acompanhantes: 2,
  aceiteImagem: true,
}

describe('experienceSchema', () => {
  it('aceita uma inscrição completa', () => {
    const r = experienceSchema.safeParse(valido)
    expect(r.success).toBe(true)
  })

  it('aceita sem os campos opcionais', () => {
    const { condominio, acompanhantes, ...minimo } = valido
    const r = experienceSchema.safeParse(minimo)
    expect(r.success).toBe(true)
  })

  it('exige o aceite de uso de imagem', () => {
    const r = experienceSchema.safeParse({ ...valido, aceiteImagem: false })
    expect(r.success).toBe(false)
  })

  it('rejeita e-mail inválido', () => {
    const r = experienceSchema.safeParse({ ...valido, email: 'maria@' })
    expect(r.success).toBe(false)
  })

  it('rejeita telefone que não é número real', () => {
    const r = experienceSchema.safeParse({ ...valido, telefone: '1234' })
    expect(r.success).toBe(false)
  })

  it('trata string vazia de acompanhantes como não informado', () => {
    const r = experienceSchema.safeParse({ ...valido, acompanhantes: '' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.acompanhantes).toBeUndefined()
  })

  it('limita acompanhantes a 3', () => {
    const r = experienceSchema.safeParse({ ...valido, acompanhantes: 4 })
    expect(r.success).toBe(false)
  })

  it('registra o formulário experience com os campos na ordem da tela', () => {
    expect(FORMS.experience.fields).toEqual([
      'nome',
      'email',
      'telefone',
      'condominio',
      'acompanhantes',
      'aceiteImagem',
    ])
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm vitest run --config ./vitest.config.mts tests/int/experience-schema.int.spec.ts`
Expected: FAIL — `experienceSchema` não existe / `FORMS.experience` é `undefined`

- [ ] **Step 3: Acrescentar o schema**

No fim de `src/lib/form-schemas.ts`:

```ts
/**
 * Inscrição no Semog Experience. `acompanhantes` usa o mesmo `z.preprocess`
 * de `unidades` (acima) porque um `<select>`/`<input>` vazio chega como `''`
 * do client e `z.coerce.number()` transformaria isso em `0` silenciosamente —
 * queremos "não informado", não "zero acompanhantes".
 *
 * `aceiteImagem` é `z.literal(true)`: o evento é fotografado e filmado, então
 * a caixa é obrigatória e nunca vem pré-marcada.
 */
const acompanhantesField = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? undefined : v),
  z.coerce
    .number()
    .int('Informe um número inteiro.')
    .min(0, 'Não pode ser negativo.')
    .max(3, 'Até 3 acompanhantes por inscrição.')
    .optional(),
)

export const experienceSchema = z.object({
  nome: requiredText('Informe seu nome completo.'),
  email: z.email('Informe um e-mail válido.'),
  telefone: requiredPhone('Informe seu WhatsApp.', 'Informe um telefone válido.'),
  condominio: z.string().trim().optional(),
  acompanhantes: acompanhantesField,
  aceiteImagem: z.literal(true, 'É preciso autorizar o uso de imagem para participar.'),
})

export type ExperienceValues = z.infer<typeof experienceSchema>

/** Mesmo motivo de `PropostaInput`: `z.preprocess` faz input ≠ output. */
export type ExperienceInput = z.input<typeof experienceSchema>
```

- [ ] **Step 4: Registrar o formulário**

Em `src/lib/forms.ts`, trocar a linha do `FormType` e o objeto `FORMS`:

```ts
import type { ContatoValues, ExperienceValues, PropostaValues } from '@/lib/form-schemas'

export type FormType = 'contato' | 'proposta' | 'experience'

export const FORMS: {
  contato: FormDef<ContatoValues>
  proposta: FormDef<PropostaValues>
  experience: FormDef<ExperienceValues>
} = {
  // ...contato e proposta inalterados...
  experience: {
    title: 'Inscrição — Semog Experience',
    fields: ['nome', 'email', 'telefone', 'condominio', 'acompanhantes', 'aceiteImagem'],
  },
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `pnpm vitest run --config ./vitest.config.mts tests/int/experience-schema.int.spec.ts`
Expected: PASS (8 testes)

- [ ] **Step 6: Commit**

```bash
git add src/lib/form-schemas.ts src/lib/forms.ts tests/int/experience-schema.int.spec.ts
git commit -m "feat(experience): schema e registro do formulário de inscrição"
```

---

### Task 2: Server action aceita `experience` e nunca envia ao Exact

**Files:**
- Modify: `src/app/(frontend)/_actions/submit-form.ts` — imports, `EXPERIENCE_LABELS`, escolha do schema (linha 118), destinatário do e-mail
- Modify: `src/lib/exact/map-lead.ts:75-78` (`isExactEligible`)
- Test: `tests/int/experience-exact-guard.int.spec.ts`

**Interfaces:**
- Consumes: `experienceSchema`, `ExperienceValues`, `FORMS.experience` (Task 1)
- Produces: `submitForm('experience', values, token)` grava em `cms.leads` com `form = 'experience'`

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/int/experience-exact-guard.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { isExactEligible } from '@/lib/exact/map-lead'

describe('isExactEligible', () => {
  it('nunca envia inscrição do Experience ao CRM', () => {
    expect(isExactEligible('experience', { nome: 'Maria', email: 'm@e.com' })).toBe(false)
  })

  it('não envia nem quando o payload traz o assunto comercial', () => {
    // Blindagem: hoje o ramo final olha `data.assunto`. Sem a guarda explícita,
    // um campo com esse nome faria uma inscrição de evento virar lead comercial.
    expect(isExactEligible('experience', { assunto: 'proposta-comercial' })).toBe(false)
  })

  it('continua enviando proposta', () => {
    expect(isExactEligible('proposta', {})).toBe(true)
  })

  it('continua enviando contato com assunto comercial', () => {
    expect(isExactEligible('contato', { assunto: 'proposta-comercial' })).toBe(true)
  })

  it('não envia contato de outro assunto', () => {
    expect(isExactEligible('contato', { assunto: 'duvida' })).toBe(false)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm vitest run --config ./vitest.config.mts tests/int/experience-exact-guard.int.spec.ts`
Expected: FAIL no segundo teste — hoje `isExactEligible('experience', {assunto:'proposta-comercial'})` devolve `true`

- [ ] **Step 3: Guardar explicitamente**

Em `src/lib/exact/map-lead.ts`, substituir a função inteira:

```ts
export function isExactEligible(formType: FormType, data: Record<string, string>): boolean {
  // Inscrição em evento é relacionamento, não captação: nunca vira card no
  // CRM. Explícito de propósito — sem esta linha o comportamento correto
  // dependeria da AUSÊNCIA do campo `assunto`, o que é frágil.
  if (formType === 'experience') return false
  if (formType === 'proposta') return true
  return data.assunto === 'proposta-comercial'
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm vitest run --config ./vitest.config.mts tests/int/experience-exact-guard.int.spec.ts`
Expected: PASS (5 testes)

- [ ] **Step 5: Ligar o tipo na server action**

Em `src/app/(frontend)/_actions/submit-form.ts`:

Trocar o import de schemas e tipos:

```ts
import type { ContatoValues, ExperienceValues, PropostaValues } from '@/lib/form-schemas'
import { contatoSchema, experienceSchema, propostaSchema } from '@/lib/form-schemas'
```

Acrescentar os rótulos pt-BR, junto dos outros `*_LABELS`:

```ts
const EXPERIENCE_LABELS: Record<keyof ExperienceValues, string> = {
  nome: 'Nome',
  email: 'E-mail',
  telefone: 'WhatsApp',
  condominio: 'Condomínio',
  acompanhantes: 'Acompanhantes',
  aceiteImagem: 'Autoriza uso de imagem',
}
```

Trocar a escolha do schema (hoje um ternário de dois ramos):

```ts
const SCHEMAS = {
  contato: contatoSchema,
  proposta: propostaSchema,
  experience: experienceSchema,
} as const

// dentro de submitForm, no lugar do ternário:
const schema = SCHEMAS[formType]
```

Trocar a escolha dos rótulos no bloco de e-mail:

```ts
const labels =
  formType === 'contato'
    ? CONTATO_LABELS
    : formType === 'experience'
      ? EXPERIENCE_LABELS
      : PROPOSTA_LABELS
```

E o tipo de `data`:

```ts
const data = parsed.data as ContatoValues | PropostaValues | ExperienceValues
```

- [ ] **Step 6: Conferir o destinatário do e-mail**

`PROPOSTA_CIDADE_TO` roteia por cidade e só existe para `proposta`. A inscrição do Experience não tem campo `cidade`, então cai em `PROPOSTA_FALLBACK_TO` (`comercial@semog.com.br`). Isso é aceitável e não bloqueia — a notificação é best-effort e o registro já está no banco. **Não** criar roteamento novo nesta task.

- [ ] **Step 7: Typecheck**

Run: `pnpm exec tsc --noEmit -p tsconfig.json`
Expected: sem saída. Se reclamar de `Record<keyof ExperienceValues, string>`, conferir que os seis campos do schema estão no `EXPERIENCE_LABELS`.

- [ ] **Step 8: Commit**

```bash
git add src/app/\(frontend\)/_actions/submit-form.ts src/lib/exact/map-lead.ts tests/int/experience-exact-guard.int.spec.ts
git commit -m "feat(experience): server action aceita inscrição e nunca envia ao CRM"
```

---

### Task 3: Dados do evento e dos patrocinadores

**Files:**
- Create: `src/data/experienceEvent.ts`
- Create: `src/data/experienceSponsors.ts`
- Create: `public/sponsors/logo-superlogica-color.svg` (copiar do kit — ver Step 3)
- Test: `tests/int/experience-data.int.spec.ts`

**Interfaces:**
- Produces: `EXPERIENCE_EVENT` (objeto com `date`, `dateLabel`, `timeLabel`, `venue`, `city`, `seats`, `pillars`, `schedule`, `video`), `EXPERIENCE_SPONSORS` (array de `{ name, logo, url, width }`)

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/int/experience-data.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { EXPERIENCE_EVENT } from '@/data/experienceEvent'
import { EXPERIENCE_SPONSORS } from '@/data/experienceSponsors'

describe('EXPERIENCE_EVENT', () => {
  it('acontece em 26/09/2026, um sábado', () => {
    expect(EXPERIENCE_EVENT.date).toBe('2026-09-26')
    // Meio-dia UTC + getUTCDay: sem isso o teste depende do fuso da máquina
    // que roda a suíte e vira sexta-feira em fusos bem a oeste.
    expect(new Date(`${EXPERIENCE_EVENT.date}T12:00:00Z`).getUTCDay()).toBe(6)
  })

  it('oferece 200 vagas', () => {
    expect(EXPERIENCE_EVENT.seats).toBe(200)
  })

  it('tem a programação em ordem cronológica', () => {
    const horas = EXPERIENCE_EVENT.schedule.map((s) => s.time)
    expect(horas).toEqual([...horas].sort())
  })

  it('tem três pilares', () => {
    expect(EXPERIENCE_EVENT.pillars).toHaveLength(3)
  })
})

describe('EXPERIENCE_SPONSORS', () => {
  it('começa com a Superlógica', () => {
    expect(EXPERIENCE_SPONSORS[0]?.name).toBe('Superlógica')
  })

  it('todo patrocinador tem nome e logo', () => {
    for (const s of EXPERIENCE_SPONSORS) {
      expect(s.name.length).toBeGreaterThan(0)
      expect(s.logo).toMatch(/^\/sponsors\/.+\.svg$/)
    }
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm vitest run --config ./vitest.config.mts tests/int/experience-data.int.spec.ts`
Expected: FAIL — módulos não existem

- [ ] **Step 3: Copiar a logo oficial**

O kit já foi baixado do site oficial da Superlógica e extraído em:
`C:\Users\lekoc\AppData\Local\Temp\claude\C--Users-lekoc-semogapp-semogsite\dda01789-d9c8-46c6-8544-77dd25f22686\scratchpad\logos-superlogica\`

```bash
mkdir -p public/sponsors
cp "/c/Users/lekoc/AppData/Local/Temp/claude/C--Users-lekoc-semogapp-semogsite/dda01789-d9c8-46c6-8544-77dd25f22686/scratchpad/logos-superlogica/logo-superlogica-color.svg" public/sponsors/logo-superlogica-color.svg
```

Se a pasta do scratchpad não existir mais, rebaixar:
`curl -sL -o /tmp/sl.zip https://superlogica.design/resources/logo-e-tagline-superlogica.zip` e extrair `Para telas/Logo/SVG/logo-superlogica-color.svg`.

**Usar a versão `color`, não a `white` nem a `black`** — as diretrizes da marca definem a colorida como primária e restringem a monocromática a caso excepcional com aprovação prévia deles.

- [ ] **Step 4: Criar os dados do evento**

Criar `src/data/experienceEvent.ts`:

```ts
/**
 * Fonte única de verdade do Semog Experience 2026. Data, horário, local e
 * vagas NÃO podem ser digitados dentro de componente: quando a data mudar,
 * muda aqui e em nenhum outro lugar.
 */
export type ScheduleItem = { time: string; label: string }
export type Pillar = { icon: 'lotus' | 'people' | 'heart'; title: string; text: string }

export const EXPERIENCE_EVENT = {
  /** ISO, para `<time dateTime>` e JSON-LD. 26/09/2026 é sábado. */
  date: '2026-09-26',
  dateLabel: '26 de setembro de 2026',
  dateShort: '26.SET.2026',
  weekday: 'sábado',
  timeLabel: '07h às 12h',
  startTime: '07:00',
  endTime: '12:00',
  venue: 'Praia do Cabo Branco',
  city: 'João Pessoa',
  uf: 'PB',
  seats: 200,
  priceLabel: 'Gratuito',

  pillars: [
    {
      icon: 'lotus',
      title: 'Bem-estar',
      text: 'Atividades físicas ao ar livre para corpo e mente.',
    },
    {
      icon: 'people',
      title: 'Conexão',
      text: 'Encontre pessoas, troque ideias e fortaleça relações.',
    },
    {
      icon: 'heart',
      title: 'Saúde',
      text: 'Cuidados que fazem diferença na sua qualidade de vida.',
    },
  ] satisfies Pillar[],

  schedule: [
    { time: '07:00', label: 'Recepção e alongamento inicial' },
    { time: '07:30', label: 'Aula de pilates' },
    { time: '08:15', label: 'Treino funcional' },
    { time: '09:00', label: 'Alongamento e relaxamento' },
    { time: '09:30', label: 'Hidratação: água de coco' },
    { time: '10:00', label: 'Avaliação física e orientações' },
    { time: '11:30', label: 'Encerramento' },
  ] satisfies ScheduleItem[],

  /**
   * Edição anterior, usada como prova social. O formato mudou (2025 foi
   * campeonato de beach tennis, 2026 é manhã wellness) e a página diz isso
   * com todas as letras — ver `ExperienceVideo`.
   */
  video: {
    previousYear: 2025,
    previousFormat: 'campeonato de beach tennis',
    reelUrl: 'https://www.instagram.com/reel/DRm_ivskVfC/',
    /** Preenchido quando o arquivo original subir pro bucket. */
    fileUrl: null as string | null,
  },
} as const
```

- [ ] **Step 5: Criar os patrocinadores**

Criar `src/data/experienceSponsors.ts`:

```ts
/**
 * Patrocinadores do Experience 2026. Acrescentar aqui não exige tocar no
 * layout — a faixa se ajusta sozinha.
 *
 * A faixa tem fundo CLARO de propósito: a diretriz de marca da Superlógica
 * define a versão colorida como primária para fundos claros e proíbe aplicar
 * o logo sobre imagem, com sombra ou em preto.
 */
export type Sponsor = {
  name: string
  logo: string
  url: string
  /** Largura de exibição em px; ajusta o peso óptico entre logos diferentes. */
  width: number
}

export const EXPERIENCE_SPONSORS: Sponsor[] = [
  {
    name: 'Superlógica',
    logo: '/sponsors/logo-superlogica-color.svg',
    url: 'https://www.superlogica.com/',
    width: 190,
  },
]
```

- [ ] **Step 6: Rodar e ver passar**

Run: `pnpm vitest run --config ./vitest.config.mts tests/int/experience-data.int.spec.ts`
Expected: PASS (6 testes)

- [ ] **Step 7: Commit**

```bash
git add src/data/experienceEvent.ts src/data/experienceSponsors.ts public/sponsors/ tests/int/experience-data.int.spec.ts
git commit -m "feat(experience): dados do evento e patrocinadores"
```

---

### Task 4: Imagens de banco para o hero e a programação

**Files:**
- Modify: `content/media.ts` (acrescentar entradas em `ALT_BY_FILENAME`)
- Upload: dois arquivos no bucket público do Supabase

**Interfaces:**
- Consumes: `img(filename)` de `content/media.ts`
- Produces: `img('experience-hero.webp')` e `img('experience-local.webp')` resolvem sem lançar

**Contexto:** o hero **não** usa foto do evento de 2025 — aquela edição foi beach tennis e esta é wellness; a foto comunicaria o evento errado. Ver o spec.

- [ ] **Step 1: Escolher as imagens**

Buscar em Unsplash ou Pexels (ambos com licença de uso comercial sem atribuição obrigatória — ainda assim, registrar a origem no commit).

- **Hero** (`experience-hero.webp`): grupo em alongamento, yoga ou treino funcional **em praia**, luz de amanhecer, pessoas em movimento e de corpo inteiro. Precisa ter espaço "morto" à esquerda ou no topo para o texto do hero respirar.
- **Local** (`experience-local.webp`): orla urbana com coqueiros ao amanhecer, evocando o Cabo Branco.

Evitar: sorriso posado para a câmera, academia coberta, fundo branco de estúdio, marca d'água.

- [ ] **Step 2: Converter e otimizar**

```bash
# largura máxima 2000px, webp qualidade 82
npx sharp-cli -i entrada.jpg -o experience-hero.webp resize 2000 --withoutEnlargement -f webp -q 82
```

Alvo: cada arquivo abaixo de 400 KB. Conferir com `ls -lh`.

- [ ] **Step 3: Subir para o bucket**

Mesmo bucket público do resto da mídia (`BASE` em `content/media.ts`):
`https://qvxlkovrxfqigeaopvui.supabase.co/storage/v1/object/public/media/`

Subir pelo painel do Supabase (Storage → bucket `media`) ou via API. Conferir que a URL pública abre no navegador antes de seguir.

- [ ] **Step 4: Mapear o alt**

Em `content/media.ts`, dentro de `ALT_BY_FILENAME`:

```ts
  'experience-hero.webp':
    'Grupo alongando o corpo na areia da praia ao amanhecer, durante o Semog Experience',
  'experience-local.webp':
    'Orla do Cabo Branco em João Pessoa ao amanhecer, com coqueiros e o mar ao fundo',
```

Alt descreve o que se vê, não o que se quer vender — é acessibilidade, lido em voz alta por leitor de tela.

- [ ] **Step 5: Verificar que resolve**

```bash
pnpm exec tsx -e "import {img} from './content/media.ts'; console.log(img('experience-hero.webp'), img('experience-local.webp'))"
```
Expected: imprime as duas URLs com o alt. Se lançar, o filename no `ALT_BY_FILENAME` não bate com o que foi subido.

- [ ] **Step 6: Commit**

```bash
git add content/media.ts
git commit -m "feat(experience): imagens do hero e do local

Banco de imagens com licença comercial, não fotos do evento de 2025:
aquela edição foi beach tennis e esta é wellness.
Origem: <colar as URLs do Unsplash/Pexels aqui>"
```

---

### Task 5: Route group isolado com layout próprio

**Files:**
- Create: `src/app/(evento)/layout.tsx`
- Create: `src/app/(evento)/experience/page.tsx` (esqueleto; as seções entram na Task 6)
- Test: `tests/e2e/experience.e2e.spec.ts`

**Interfaces:**
- Consumes: `EXPERIENCE_EVENT` (Task 3), `buildMetadata`/`absoluteUrl` de `@/lib/seo`
- Produces: rota `/experience`

**Atenção:** hoje `src/app/(frontend)/layout.tsx` é o **root layout** (declara `<html>`/`<body>`). Um segundo route group irmão precisa declarar os seus também — dois root layouts é padrão suportado pelo Next.js, e é o que dá a página sem header/rodapé sem gambiarra de CSS.

- [ ] **Step 1: Escrever o teste e2e que falha**

Criar `tests/e2e/experience.e2e.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test.describe('Landing do Experience', () => {
  test('abre sem a navegação do site', async ({ page }) => {
    await page.goto('/experience')
    await expect(page.locator('header.site-header')).toHaveCount(0)
    await expect(page.locator('footer.site-footer')).toHaveCount(0)
    await expect(page.locator('[data-whatsapp-float]')).toHaveCount(0)
  })

  test('anuncia data, local e vagas', async ({ page }) => {
    await page.goto('/experience')
    await expect(page.getByText('26 de setembro de 2026')).toBeVisible()
    await expect(page.getByText('Praia do Cabo Branco')).toBeVisible()
    await expect(page.getByText(/200 vagas/i)).toBeVisible()
  })

  test('a home continua com header e rodapé', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('header.site-header')).toHaveCount(1)
  })
})
```

Antes de rodar, confirmar os seletores reais: `grep -n "className" src/components/layout/HeaderServer.tsx src/components/layout/FooterServer.tsx src/components/layout/WhatsAppFloat.tsx` e ajustar `site-header`/`site-footer`/`data-whatsapp-float` para o que existe de fato.

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec playwright test tests/e2e/experience.e2e.spec.ts`
Expected: FAIL — `/experience` dá 404

- [ ] **Step 3: Criar o layout isolado**

Criar `src/app/(evento)/layout.tsx`. Espelhar `src/app/(frontend)/layout.tsx` (abrir e copiar a estrutura de `<html>`, classes de fonte e provedores), **mantendo**: fontes (`clash`, `satoshi`), `theme.css`, `ConsentProvider`, `CookieBanner`, `Analytics`, `Clarity`, `AttributionTracker`. **Removendo**: `HeaderServer`, `FooterServer`, `WhatsAppFloat`, `Preloader`, `Grain`, `LenisProvider`.

```tsx
import type React from 'react'
import { Analytics } from '@/components/analytics/Analytics'
import { AttributionTracker } from '@/components/analytics/AttributionTracker'
import { Clarity } from '@/components/analytics/Clarity'
import { CookieBanner } from '@/components/consent/CookieBanner'
import { ConsentProvider } from '@/providers/ConsentProvider'
import { clash, satoshi } from '../../fonts'
import '../../styles/theme.css'

/**
 * Root layout do route group `(evento)` — irmão de `(frontend)`, não filho.
 * A landing do Experience é uma peça de campanha: sem header, rodapé,
 * WhatsApp flutuante ou preloader, para não haver saída da página que não
 * seja a inscrição.
 *
 * O que É mantido e por quê:
 * - `AttributionTracker`: grava o cookie `semog-attrib`, de onde a server
 *   action lê o gclid NO SERVIDOR. Sem ele, campanha paga para o evento
 *   ficaria cega.
 * - `ConsentProvider` + `CookieBanner`: obrigação de consentimento não muda
 *   por a página ser de campanha.
 * - `Analytics`/`Clarity`: só sobem em host mensurável (ver `measurableHost`).
 */
export default function EventoLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${clash.variable} ${satoshi.variable}`}>
      <body>
        <ConsentProvider>
          {children}
          <CookieBanner />
        </ConsentProvider>
        <AttributionTracker />
        <Analytics />
        <Clarity />
      </body>
    </html>
  )
}
```

Conferir o caminho relativo de `fonts`/`styles` contra o que `(frontend)/layout.tsx` usa — os dois grupos estão na mesma profundidade, então `../../` vale para ambos.

- [ ] **Step 4: Criar a página**

Criar `src/app/(evento)/experience/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { EXPERIENCE_EVENT as E } from '@/data/experienceEvent'
import { absoluteUrl } from '@/lib/seo'

const title = 'Semog Experience 2026 — manhã wellness na Praia do Cabo Branco'
const description = `Movimento, saúde e conexão em ${E.dateLabel}, das 7h às 12h, na ${E.venue}, em ${E.city}. Pilates, treino funcional, alongamento e avaliação física. Gratuito, com ${E.seats} vagas.`

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: absoluteUrl('experience') },
  openGraph: {
    type: 'website',
    url: absoluteUrl('experience'),
    title,
    description,
    locale: 'pt_BR',
  },
}

export default function ExperiencePage() {
  return (
    <main>
      <h1>Semog Experience</h1>
      <p>{E.dateLabel}</p>
      <p>{E.venue}</p>
      <p>{E.seats} vagas</p>
    </main>
  )
}
```

- [ ] **Step 5: Rodar e ver passar**

```bash
pnpm run build && pnpm run start &
pnpm exec playwright test tests/e2e/experience.e2e.spec.ts
```
Expected: PASS (3 testes). Encerrar o servidor depois.

- [ ] **Step 6: Commit**

```bash
git add src/app/\(evento\)/ tests/e2e/experience.e2e.spec.ts
git commit -m "feat(experience): rota isolada /experience com layout próprio"
```

---

### Task 6: Seções visuais da landing

**Files:**
- Create: `src/components/experience/ExperienceHero.tsx`
- Create: `src/components/experience/ExperiencePillars.tsx`
- Create: `src/components/experience/ExperienceProgram.tsx`
- Create: `src/components/experience/ExperienceVideo.tsx`
- Create: `src/components/experience/ExperienceCta.tsx`
- Create: `src/components/experience/ExperienceSponsors.tsx`
- Create: `src/components/experience/ExperienceFooter.tsx`
- Create: `src/components/experience/experience.css`
- Modify: `src/app/(evento)/experience/page.tsx` (compor as seções)
- Test: `tests/int/experience-sections.int.spec.tsx`

**Interfaces:**
- Consumes: `EXPERIENCE_EVENT`, `EXPERIENCE_SPONSORS`, `img()` de `content/media.ts`
- Produces: componentes de seção, todos server components (sem `'use client'`), cada um recebendo zero props e lendo dos dados

**Antes de escrever CSS:** abrir `src/components/city/CityLanding.tsx` e o CSS que ele usa. Seguir a mesma convenção de classes e os mesmos tokens de `theme.css`. Não introduzir biblioteca de UI nova.

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/int/experience-sections.int.spec.tsx`:

```tsx
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EXPERIENCE_EVENT } from '@/data/experienceEvent'
import { ExperienceProgram } from '@/components/experience/ExperienceProgram'
import { ExperienceSponsors } from '@/components/experience/ExperienceSponsors'
import { ExperienceVideo } from '@/components/experience/ExperienceVideo'

describe('ExperienceProgram', () => {
  it('lista os sete blocos da manhã na ordem', () => {
    render(<ExperienceProgram />)
    const itens = screen.getAllByRole('listitem')
    expect(itens).toHaveLength(EXPERIENCE_EVENT.schedule.length)
    expect(itens[0]).toHaveTextContent('Recepção e alongamento inicial')
    expect(itens[itens.length - 1]).toHaveTextContent('Encerramento')
  })
})

describe('ExperienceVideo', () => {
  it('diz que a edição anterior teve outro formato', () => {
    render(<ExperienceVideo />)
    expect(screen.getByText(/beach tennis/i)).toBeInTheDocument()
    expect(screen.getByText(/2025/)).toBeInTheDocument()
  })
})

describe('ExperienceSponsors', () => {
  it('mostra o logo da Superlógica com alt e link', () => {
    render(<ExperienceSponsors />)
    const link = screen.getByRole('link', { name: /superlógica/i })
    expect(link).toHaveAttribute('href', 'https://www.superlogica.com/')
    expect(within(link).getByRole('img')).toHaveAttribute('alt', 'Superlógica')
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm vitest run --config ./vitest.config.mts tests/int/experience-sections.int.spec.tsx`
Expected: FAIL — componentes não existem

- [ ] **Step 3: Escrever as seções**

Seguir a estrutura visual do mockup aprovado (`docs` do spec). Pontos obrigatórios:

**`ExperienceHero`** — `<h1>` "Semog Experience", tagline "Movimento. Saúde. Conexão.", parágrafo de apoio, e três blocos de meta (data / horário / local) lidos de `EXPERIENCE_EVENT`. A data vai em `<time dateTime={E.date}>`. Botão âncora para `#inscricao`. Selo "+35 anos". Imagem `img('experience-hero.webp')` com `priority` (é o LCP).

**`ExperiencePillars`** — os três de `E.pillars`. Ícones como SVG inline (não emoji, não biblioteca). Marcar os SVG decorativos com `aria-hidden="true"`, já que o título ao lado já nomeia o pilar.

**`ExperienceProgram`** — `<ol>` de `E.schedule`, com `<li>` por bloco; horário em `font-variant-numeric: tabular-nums`. Ao lado, `img('experience-local.webp')` com legenda do local. **A ordem cronológica é a informação** — não acrescentar numeração decorativa (01/02/03) por cima do horário.

**`ExperienceVideo`** — título "Assista como foi o Semog Experience 2025" e um parágrafo que diz **explicitamente** que aquela edição foi um campeonato de beach tennis e que o formato muda a cada ano. Enquanto `E.video.fileUrl` for `null`, renderizar capa clicável que abre `E.video.reelUrl` em nova aba (`target="_blank" rel="noopener noreferrer"`); quando o arquivo existir, trocar por `<video controls poster>`. Escrever os dois ramos agora — o `if` é uma linha e evita voltar aqui depois.

**`ExperienceCta`** — faixa em `--color-navy-600` com a chamada e botão para `#inscricao`. Texto: gratuito, `{E.seats}` vagas.

**`ExperienceSponsors`** — **fundo claro** (obrigatório, ver Global Constraints). Título "Patrocinadores". Cada item é `<a>` com `<img>` do logo, `alt={s.name}`, `width={s.width}`, `loading="lazy"`, e o link com `rel="noopener noreferrer"`. Com um só patrocinador, centralizar — não esticar para preencher a linha.

**`ExperienceFooter`** — logo Semog, uma linha institucional, contato e social. **Sem menu de navegação do site** (é o ponto da página isolada). Link para a política de privacidade é permitido e desejável.

**`experience.css`** — importado pela página. Usar exclusivamente tokens de `theme.css`. Respeitar `prefers-reduced-motion` em qualquer transição. Toda imagem com `max-width: 100%`.

- [ ] **Step 4: Compor na página**

Substituir o corpo de `src/app/(evento)/experience/page.tsx` pelas seções, na ordem: Hero → Pillars → Program → Video → Cta → (formulário, Task 7) → Sponsors → Footer.

- [ ] **Step 5: Rodar e ver passar**

Run: `pnpm vitest run --config ./vitest.config.mts tests/int/experience-sections.int.spec.tsx`
Expected: PASS (3 testes)

- [ ] **Step 6: Conferir com os próprios olhos**

```bash
pnpm run build && pnpm run start
```
Abrir `http://localhost:3000/experience` e conferir, em 1440px e em 390px: nada estoura na horizontal; o texto do hero fica legível sobre a foto; a faixa de patrocinadores tem fundo claro; o logo da Superlógica não está sobre imagem nem com sombra.

- [ ] **Step 7: Commit**

```bash
git add src/components/experience/ src/app/\(evento\)/experience/page.tsx tests/int/experience-sections.int.spec.tsx
git commit -m "feat(experience): seções da landing"
```

---

### Task 7: Formulário de inscrição

**Files:**
- Create: `src/components/forms/ExperienceForm.tsx`
- Modify: `src/app/(evento)/experience/page.tsx` (inserir a seção `#inscricao`)
- Test: `tests/int/experience-form.int.spec.tsx`

**Interfaces:**
- Consumes: `experienceSchema`, `ExperienceInput`, `ExperienceValues` (Task 1); `submitForm` (Task 2); `Turnstile` de `@/components/forms/Turnstile`
- Produces: `<ExperienceForm />`, client component

**Antes de escrever:** abrir `src/components/forms/PropostaForm.tsx` e seguir o mesmo padrão — `useForm` com os três generics, `zodResolver`, `Turnstile` com `key` que reseta após submissão, estados de envio e mensagem de sucesso. Não inventar padrão novo.

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/int/experience-form.int.spec.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/app/(frontend)/_actions/submit-form', () => ({
  submitForm: vi.fn(async () => ({ ok: true })),
}))
vi.mock('@/components/forms/Turnstile', () => ({
  Turnstile: ({ onToken }: { onToken: (t: string) => void }) => (
    <button type="button" onClick={() => onToken('token-de-teste')}>
      turnstile
    </button>
  ),
}))

import { ExperienceForm } from '@/components/forms/ExperienceForm'

describe('ExperienceForm', () => {
  it('exige nome, e-mail, WhatsApp e o aceite de imagem', async () => {
    const user = userEvent.setup()
    render(<ExperienceForm />)
    await user.click(screen.getByRole('button', { name: /garantir minha vaga/i }))
    expect(await screen.findByText(/informe seu nome completo/i)).toBeInTheDocument()
    expect(await screen.findByText(/e-mail válido/i)).toBeInTheDocument()
    expect(await screen.findByText(/autorizar o uso de imagem/i)).toBeInTheDocument()
  })

  it('não deixa o aceite de imagem pré-marcado', () => {
    render(<ExperienceForm />)
    expect(screen.getByRole('checkbox', { name: /uso de imagem/i })).not.toBeChecked()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm vitest run --config ./vitest.config.mts tests/int/experience-form.int.spec.tsx`
Expected: FAIL — componente não existe

- [ ] **Step 3: Escrever o formulário**

`src/components/forms/ExperienceForm.tsx`, client component. Requisitos:

- `useForm<ExperienceInput, unknown, ExperienceValues>({ resolver: zodResolver(experienceSchema) })` — os três generics pelo mesmo motivo do `PropostaForm` (o `z.preprocess` de `acompanhantes` faz input ≠ output)
- Campos na ordem de `FORMS.experience.fields`: nome, e-mail, WhatsApp, condomínio (opcional), acompanhantes (`<select>` 0–3, opcional), aceite de imagem (checkbox)
- Cada campo com `<label>` ligado por `htmlFor`/`id`; erro anunciado via `aria-describedby` e `role="alert"`
- Aceite de imagem: texto curto explicando que o evento é fotografado e filmado, com link para `/privacidade`. **Nunca `defaultChecked`.**
- Botão: "Garantir minha vaga". Desabilitado enquanto envia; texto muda para "Enviando…"
- Sucesso: substituir o formulário por confirmação que repete data, horário e local (a pessoa precisa saber quando e onde comparecer), sem prometer e-mail de confirmação — **isso ainda não existe**
- Erro: mensagem devolvida por `submitForm`, sem jargão
- Resetar o `Turnstile` (via `key`) depois de cada submissão, como faz o `PropostaForm`

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm vitest run --config ./vitest.config.mts tests/int/experience-form.int.spec.tsx`
Expected: PASS (2 testes)

- [ ] **Step 5: Inserir na página**

Na `page.tsx`, entre `ExperienceCta` e `ExperienceSponsors`:

```tsx
<section id="inscricao" className="experience-inscricao">
  <ExperienceForm />
</section>
```

Conferir que os botões do hero e do CTA apontam para `#inscricao`.

- [ ] **Step 6: Teste manual de ponta a ponta**

⚠️ O Turnstile real **bloqueia navegador automatizado** (`failure_retry`) — este teste tem que ser humano. Rodar `pnpm run build && pnpm run start`, preencher em `http://localhost:3000/experience#inscricao` e confirmar no banco:

```bash
node --env-file=.env -e "const pg=require('pg');const c=new pg.Client({connectionString:process.env.DATABASE_URI,ssl:{rejectUnauthorized:false}});c.connect().then(()=>c.query(\"select id, form, data, exact_lead_id from cms.leads where form='experience' order by created_at desc limit 3\")).then(r=>{console.table(r.rows);return c.end()})"
```

Expected: a linha existe, `form = 'experience'` e **`exact_lead_id` é `null`** (não foi ao CRM).

- [ ] **Step 7: Commit**

```bash
git add src/components/forms/ExperienceForm.tsx src/app/\(evento\)/experience/page.tsx tests/int/experience-form.int.spec.tsx
git commit -m "feat(experience): formulário de inscrição"
```

---

### Task 8: JSON-LD, sitemap e verificação final

**Files:**
- Modify: `src/app/(evento)/experience/page.tsx` (JSON-LD)
- Modify: `src/app/(frontend)/sitemap.ts`
- Test: `tests/e2e/experience.e2e.spec.ts` (acrescentar casos)

**Interfaces:**
- Consumes: `EXPERIENCE_EVENT`, `absoluteUrl`

- [ ] **Step 1: Acrescentar os testes**

Em `tests/e2e/experience.e2e.spec.ts`:

```ts
test('publica JSON-LD de evento com data e local', async ({ page }) => {
  await page.goto('/experience')
  const raw = await page.locator('script[type="application/ld+json"]').first().textContent()
  const jsonLd = JSON.parse(raw ?? '{}')
  expect(jsonLd['@type']).toBe('Event')
  expect(jsonLd.startDate).toContain('2026-09-26')
  expect(jsonLd.offers.price).toBe('0')
})

test('os CTAs levam ao formulário', async ({ page }) => {
  await page.goto('/experience')
  const ctas = page.locator('a[href="#inscricao"]')
  expect(await ctas.count()).toBeGreaterThanOrEqual(2)
  await ctas.first().click()
  await expect(page.locator('#inscricao')).toBeInViewport()
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec playwright test tests/e2e/experience.e2e.spec.ts`
Expected: FAIL — não há JSON-LD

- [ ] **Step 3: Acrescentar o JSON-LD**

Na `page.tsx`, seguindo o padrão de `cityLandingJsonLd` (ver `src/lib/seo.ts` e como as landings de cidade injetam):

```tsx
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: 'Semog Experience 2026',
  description,
  startDate: `${E.date}T${E.startTime}:00-03:00`,
  endDate: `${E.date}T${E.endTime}:00-03:00`,
  eventStatus: 'https://schema.org/EventScheduled',
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  location: {
    '@type': 'Place',
    name: E.venue,
    address: {
      '@type': 'PostalAddress',
      addressLocality: E.city,
      addressRegion: E.uf,
      addressCountry: 'BR',
    },
  },
  organizer: {
    '@type': 'Organization',
    name: 'Semog Administradora de Condomínios',
    url: absoluteUrl(''),
  },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'BRL',
    availability: 'https://schema.org/InStock',
    url: absoluteUrl('experience'),
  },
  url: absoluteUrl('experience'),
}
```

Injetar com `dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}`, com o mesmo comentário `biome-ignore` usado nas landings de cidade.

- [ ] **Step 4: Acrescentar ao sitemap**

Em `src/app/(frontend)/sitemap.ts`, incluir a entrada de `/experience`. Abrir o arquivo primeiro e seguir o formato das entradas existentes (as landings de cidade já estão lá — o sitemap já esqueceu essas rotas uma vez, corrigido no commit `cba2103`; não repetir o erro).

- [ ] **Step 5: Rodar tudo**

```bash
pnpm exec tsc --noEmit -p tsconfig.json
pnpm run test:int
pnpm run build
pnpm run start &
pnpm exec playwright test tests/e2e/experience.e2e.spec.ts
```
Expected: typecheck sem saída; testes int e e2e passando; build sem erro.

- [ ] **Step 6: Conferir que a rota não vazou**

```bash
curl -s http://localhost:3000/sitemap.xml | grep experience
curl -s http://localhost:3000/experience | grep -o '<title>[^<]*</title>'
```
Expected: a URL aparece no sitemap; o título é o do evento, não o padrão do site.

- [ ] **Step 7: Commit**

```bash
git add src/app/\(evento\)/experience/page.tsx src/app/\(frontend\)/sitemap.ts tests/e2e/experience.e2e.spec.ts
git commit -m "feat(experience): JSON-LD de evento e entrada no sitemap"
```

---

## Antes de publicar

- [ ] Confirmar com a **Superlógica** que ela aparece como patrocinadora nesta peça
- [ ] Trocar a capa do vídeo pelo arquivo original, se ele existir (`E.video.fileUrl`)
- [ ] Conferir a data uma última vez com quem organiza — ela está em `src/data/experienceEvent.ts` e some da página inteira se estiver errada
- [ ] Decidir se `/experience` entra no menu do site ou fica só como link de divulgação (hoje é só link — a página é isolada de propósito)
