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


## Assets já prontos (não refazer)

**Protótipo aprovado pelo cliente:** `docs/superpowers/specs/2026-08-21-semog-experience-prototipo.html`
— HTML completo, com todo o CSS final, a estrutura de superfícies (`.s-dark`,
`.s-deep`, `.s-paper`, `.s-white`, `.s-brand`) e os textos aprovados. **A Task 6
deve portar este arquivo para componentes React, não redesenhar.** Os
placeholders `__HERO__`, `__LOCAL__`, `__REEL_POSTER__`, `__REEL_VIDEO__`,
`__LOGO_SEMOG_LIGHT__`, `__LOGO_SL__` e `__F_*__` são do protótipo: no site as
fontes já vêm do layout e as mídias das URLs abaixo.

**Mídias no bucket** (base: `https://qvxlkovrxfqigeaopvui.supabase.co/storage/v1/object/public/media/`),
já enviadas e verificadas (HTTP 206, content-type correto):

| Arquivo | O que é |
|---|---|
| `experience-hero.webp` | Grupo em alongamento na praia ao nascer do sol (banco de imagens) |
| `experience-local.webp` | Orla de João Pessoa com a falésia do Cabo Branco — **frame do vídeo real** |
| `experience-2025-poster.webp` | Capa do vídeo (jogada de beach tennis) |
| `experience-2025.mp4` | Reel do Experience 2025 — **vertical 9:16**, 1min08s, com áudio, 5,1 MB |

**Logo da Superlógica:** já em `public/sponsors/logo-superlogica-color.svg`.

**Vídeo: decidido e resolvido.** O Reel foi baixado e hospedado no bucket — **não
embutir o Instagram e não mexer no CSP**. O player é `<video controls playsinline
preload="none" poster>` com proporção **9:16**; um Reel vertical dentro de
moldura 16:9 fica com tarjas pretas.

⚠️ **A edição anterior foi em 2025, não 2024.**

---

### Task 1: Schema e registro do formulário de inscrição

**Files:**
- Modify: `src/lib/form-schemas.ts` (acrescentar ao final, antes de nenhum export existente ser tocado)
- Modify: `src/lib/forms.ts:13` (o `FormType`) e `src/lib/forms.ts:21` (o objeto `FORMS`)
- Test: `tests/int/experience-schema.int.spec.ts`

**Interfaces:**
- Consumes: helpers já existentes em `form-schemas.ts` — `requiredText(message: string)`, `requiredPhone(requiredMessage: string, invalidMessage: string)`
- Produces: `experienceSchema` (Zod object), `ExperienceValues = z.infer<typeof experienceSchema>`, `ExperienceInput = z.input<typeof experienceSchema>`, `FormType` passa a incluir `'experience'`, `FORMS.experience`

- [x] **Step 1: Escrever o teste que falha**

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

- [x] **Step 2: Rodar e ver falhar**

Run: `pnpm vitest run --config ./vitest.config.mts tests/int/experience-schema.int.spec.ts`
Expected: FAIL — `experienceSchema` não existe / `FORMS.experience` é `undefined`

- [x] **Step 3: Acrescentar o schema**

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

- [x] **Step 4: Registrar o formulário**

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

- [x] **Step 5: Rodar e ver passar**

Run: `pnpm vitest run --config ./vitest.config.mts tests/int/experience-schema.int.spec.ts`
Expected: PASS (8 testes)

- [x] **Step 6: Commit**

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

- [x] **Step 1: Escrever o teste que falha**

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

- [x] **Step 2: Rodar e ver falhar**

Run: `pnpm vitest run --config ./vitest.config.mts tests/int/experience-exact-guard.int.spec.ts`
Expected: FAIL no segundo teste — hoje `isExactEligible('experience', {assunto:'proposta-comercial'})` devolve `true`

- [x] **Step 3: Guardar explicitamente**

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

- [x] **Step 4: Rodar e ver passar**

Run: `pnpm vitest run --config ./vitest.config.mts tests/int/experience-exact-guard.int.spec.ts`
Expected: PASS (5 testes)

- [x] **Step 5: Ligar o tipo na server action**

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

- [x] **Step 6: Conferir o destinatário do e-mail**

`PROPOSTA_CIDADE_TO` roteia por cidade e só existe para `proposta`. A inscrição do Experience não tem campo `cidade`, então cai em `PROPOSTA_FALLBACK_TO` (`comercial@semog.com.br`). Isso é aceitável e não bloqueia — a notificação é best-effort e o registro já está no banco. **Não** criar roteamento novo nesta task.

> **Conferido na implementação:** o destinatário é `process.env.CONTACT_TO`, não o `PROPOSTA_FALLBACK_TO`. O ramo real é `if (formType === 'proposta') { … } else { notifyTo = process.env.CONTACT_TO }`, então a inscrição cai no `else` junto com o Contato. A conclusão da task não muda (aceitável, sem roteamento novo); o comentário no código foi ajustado pra dizer isso.

- [x] **Step 7: Typecheck**

Run: `pnpm exec tsc --noEmit -p tsconfig.json`
Expected: sem saída. Se reclamar de `Record<keyof ExperienceValues, string>`, conferir que os seis campos do schema estão no `EXPERIENCE_LABELS`.

- [x] **Step 8: Commit**

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

- [x] **Step 1: Escrever o teste que falha**

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

- [x] **Step 2: Rodar e ver falhar**

Run: `pnpm vitest run --config ./vitest.config.mts tests/int/experience-data.int.spec.ts`
Expected: FAIL — módulos não existem

- [x] **Step 3: Copiar a logo oficial**

O kit já foi baixado do site oficial da Superlógica e extraído em:
`C:\Users\lekoc\AppData\Local\Temp\claude\C--Users-lekoc-semogapp-semogsite\dda01789-d9c8-46c6-8544-77dd25f22686\scratchpad\logos-superlogica\`

```bash
mkdir -p public/sponsors
cp "/c/Users/lekoc/AppData/Local/Temp/claude/C--Users-lekoc-semogapp-semogsite/dda01789-d9c8-46c6-8544-77dd25f22686/scratchpad/logos-superlogica/logo-superlogica-color.svg" public/sponsors/logo-superlogica-color.svg
```

Se a pasta do scratchpad não existir mais, rebaixar:
`curl -sL -o /tmp/sl.zip https://superlogica.design/resources/logo-e-tagline-superlogica.zip` e extrair `Para telas/Logo/SVG/logo-superlogica-color.svg`.

**Usar a versão `color`, não a `white` nem a `black`** — as diretrizes da marca definem a colorida como primária e restringem a monocromática a caso excepcional com aprovação prévia deles.

> **Conferido na implementação:** nada a copiar — `public/sponsors/logo-superlogica-color.svg` já entrou no repositório no commit `7cf4df4`, e o arquivo é **byte a byte idêntico** ao do kit no scratchpad (mesmo md5 `9cdfd08c…`). É a versão `color` (`viewBox="0 0 1322 200"`, `#1034f2` + `#1c1f24`), como manda a diretriz. Proporção ≈ 6,61:1 — com `width: 190` a altura de exibição fica ~29px (útil na Task 6).

- [x] **Step 4: Criar os dados do evento**

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

> **Divergência deliberada no bloco `video`:** o `fileUrl: null` (com fallback de
> capa clicável para o Instagram) está desatualizado dentro do próprio plano —
> "Assets já prontos" diz que o Reel **já foi baixado e hospedado no bucket**
> (`experience-2025.mp4` + `experience-2025-poster.webp`) e o protótipo aprovado
> traz um `<video controls playsinline preload="none" poster>` nativo, sem
> Instagram. O que foi implementado, então:
>
> ```ts
> video: {
>   previousYear: 2025,
>   previousFormat: 'campeonato de beach tennis',
>   /** Post original, mantido só como crédito/origem — o site não embute o Instagram. */
>   reelUrl: 'https://www.instagram.com/reel/DRm_ivskVfC/',
>   file: 'experience-2025.mp4',
>   poster: 'experience-2025-poster.webp',
>   /** O material é um Reel vertical: em moldura 16:9 sobram tarjas pretas. */
>   aspectRatio: '9 / 16',
> }
> ```
>
> São **filenames**, não URLs: quem sabe a base do bucket e guarda o alt é
> `img()` (`content/media.ts`, alts na Task 4). Guardar a URL crua aqui
> duplicaria as duas coisas.

- [x] **Step 5: Criar os patrocinadores**

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

- [x] **Step 6: Rodar e ver passar**

Run: `pnpm vitest run --config ./vitest.config.mts tests/int/experience-data.int.spec.ts`
Expected: PASS (6 testes)

- [x] **Step 7: Commit**

```bash
git add src/data/experienceEvent.ts src/data/experienceSponsors.ts public/sponsors/ tests/int/experience-data.int.spec.ts
git commit -m "feat(experience): dados do evento e patrocinadores"
```

---

### Task 4: Mapear os alts das mídias novas

**Files:**
- Modify: `content/media.ts` (acrescentar entradas em `ALT_BY_FILENAME`)
- Test: rodar o `img()` e conferir que não lança

**Interfaces:**
- Produces: `img('experience-hero.webp')`, `img('experience-local.webp')`, `img('experience-2025-poster.webp')` e `img('experience-2025.mp4')` resolvem sem lançar

**Os arquivos JÁ ESTÃO no bucket** (ver "Assets já prontos"). Esta task é só o
mapeamento de alt, que `content/media.ts` exige — `img()` lança se o filename
não estiver mapeado, de propósito, para o alt nunca se perder.

- [x] **Step 1: Acrescentar os alts**

Em `content/media.ts`, dentro de `ALT_BY_FILENAME`:

```ts
  'experience-hero.webp':
    'Grupo alongando o corpo na areia da praia ao nascer do sol',
  'experience-local.webp':
    'Vista aérea da orla de João Pessoa com a falésia do Cabo Branco ao fundo',
  'experience-2025-poster.webp':
    'Jogada de beach tennis na areia durante o Semog Experience 2025',
  'experience-2025.mp4':
    'Vídeo com os melhores momentos do Semog Experience 2025, em João Pessoa',
```

O alt descreve o que se vê, não o que se quer vender — é lido em voz alta por
leitor de tela.

- [x] **Step 2: Verificar que resolvem**

```bash
pnpm exec tsx -e "import {img} from './content/media.ts'; for (const f of ['experience-hero.webp','experience-local.webp','experience-2025-poster.webp','experience-2025.mp4']) console.log(img(f))"
```
Expected: imprime as quatro URLs com alt. Se lançar, o filename não bate.

- [x] **Step 3: Commit**

```bash
git add content/media.ts
git commit -m "feat(experience): alts das mídias do evento"
```

> **Nota da Task 4 (executada):** três registros.
> (1) **Teste durável além do comando ad hoc.** O Step 2 verifica com um `tsx -e`
> que não deixa rastro; acrescentei `tests/int/experience-media.int.spec.ts`
> (5 casos) para o mapeamento não se perder em silêncio depois — ele confere a
> URL do bucket e o alt dos quatro arquivos e amarra `EXPERIENCE_EVENT.video.file`
> / `.poster` ao mapa (renomear o arquivo lá sem mapear o alt aqui quebraria em
> runtime, não no build). Escrito antes da implementação: os 5 falharam, depois
> passaram.
> (2) **Sem entrada em `DIMENSIONS_BY_FILENAME`, e está certo.** No protótipo
> `.hero-bg img` e `.place img` são `object-fit:cover` dentro de contêiner com
> proporção fixa (16/10 no local) — na Task 6 são `next/image` com `fill` +
> `sizes`, que não passa pelo fallback `1200x800`. O vídeo e a capa também não
> precisam (a capa é atributo `poster`, string crua).
> (3) **O alt do hero diverge do protótipo, de propósito.** O protótipo (linha
> 194) escreve "Grupo em aula de alongamento…"; o alt mapeado é o texto deste
> plano, "Grupo alongando o corpo na areia da praia ao nascer do sol". Na Task 6
> o alt vem de `img('experience-hero.webp').alt` — **não copiar o literal do
> protótipo**, senão passam a existir dois alts para a mesma imagem.
> Os quatro arquivos foram reconferidos no bucket (HTTP 206, `image/webp` ×3 e
> `video/mp4`).

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

- [x] **Step 1: Escrever o teste e2e que falha**

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

- [x] **Step 2: Rodar e ver falhar**

Run: `pnpm exec playwright test tests/e2e/experience.e2e.spec.ts`
Expected: FAIL — `/experience` dá 404

- [x] **Step 3: Criar o layout isolado**

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

> **Corrigido na implementação:** no snippet acima `Analytics` e `Clarity`
> estão FORA do `ConsentProvider`, e assim a página quebra em runtime — os
> dois chamam `useConsent()`, que lança `useConsent must be used within a
> <ConsentProvider>` quando o contexto é `null`
> (`src/providers/ConsentProvider.tsx`). Os três (com o `AttributionTracker`,
> por paridade) foram para dentro do provider, na mesma ordem de
> `(frontend)/layout.tsx`. O caminho `../../fonts` e `../../styles/theme.css`
> do plano está certo — conferido: o `<html class>` e o chunk de CSS servidos
> em `/experience` são idênticos aos da home.

- [x] **Step 4: Criar a página**

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

- [x] **Step 5: Rodar e ver passar**

```bash
pnpm run build && pnpm run start &
pnpm exec playwright test tests/e2e/experience.e2e.spec.ts
```
Expected: PASS (3 testes). Encerrar o servidor depois.

- [x] **Step 6: Commit**

```bash
git add src/app/\(evento\)/ tests/e2e/experience.e2e.spec.ts
git commit -m "feat(experience): rota isolada /experience com layout próprio"
```

> **Nota da Task 5 (executada):** três registros.
> (1) **Seletores do e2e.** O Step 1 manda confirmar antes de rodar:
> `site-header`/`site-footer`/`[data-whatsapp-float]` não existem no projeto.
> Os reais são `header.nav` (`Nav.tsx`), `footer.footer` (`FooterView.tsx`) e
> `.wa-float` (`WhatsAppFloat.tsx`) — conferidos no HTML servido. Com os nomes
> do plano os três `toHaveCount(0)` passariam por vacuidade, sem testar nada.
> (2) **URLs absolutas no `page.goto`.** `baseURL` está comentado em
> `playwright.config.ts`, então `page.goto('/experience')` seria "invalid URL".
> Todos os specs de `tests/e2e/` usam `http://localhost:3000/...`; segui a
> convenção. Acrescentei também `footer.footer` ao teste de controle da home
> (o plano só conferia o header) — o vazamento do layout novo derrubaria os dois.
> (3) **Sem conflito com o catch-all.** O `next build` lista `/experience` como
> rota estática (○) ao lado de `● /[[...slug]]`: rota explícita vence a
> dinâmica mesmo em route group irmão, sem erro de rotas paralelas.
>
> Verificação: e2e do Experience 3/3 verde; suíte e2e completa 49 passed / 1
> failed — o único vermelho é `hero-video.e2e.spec.ts` ("não baixa nenhum clipe
> mais de uma vez"), um teste de orçamento de banda da home com margem de 1,15x
> que estourou ~5% sob a carga da suíte inteira e **passa 4/4 isolado** — flaky
> pré-existente, sem relação com `/experience`. `test:int` 175/175,
> `tsc --noEmit` limpo, Biome limpo, `next build` sem erro.

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

- [x] **Step 1: Escrever o teste que falha**

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

- [x] **Step 2: Rodar e ver falhar**

Run: `pnpm vitest run --config ./vitest.config.mts tests/int/experience-sections.int.spec.tsx`
Expected: FAIL — componentes não existem

- [x] **Step 3: Escrever as seções**

Seguir a estrutura visual do mockup aprovado (`docs` do spec). Pontos obrigatórios:

**`ExperienceHero`** — `<h1>` "Semog Experience", tagline "Movimento. Saúde. Conexão.", parágrafo de apoio, e três blocos de meta (data / horário / local) lidos de `EXPERIENCE_EVENT`. A data vai em `<time dateTime={E.date}>`. Botão âncora para `#inscricao`. Selo "+35 anos". Imagem `img('experience-hero.webp')` com `priority` (é o LCP).

**`ExperiencePillars`** — os três de `E.pillars`. Ícones como SVG inline (não emoji, não biblioteca). Marcar os SVG decorativos com `aria-hidden="true"`, já que o título ao lado já nomeia o pilar.

**`ExperienceProgram`** — `<ol>` de `E.schedule`, com `<li>` por bloco; horário em `font-variant-numeric: tabular-nums`. Ao lado, `img('experience-local.webp')` com legenda do local. **A ordem cronológica é a informação** — não acrescentar numeração decorativa (01/02/03) por cima do horário.

**`ExperienceVideo`** — título "Assista como foi o Semog Experience 2025" e um parágrafo que diz **explicitamente** que aquela edição foi um campeonato de beach tennis e que o formato muda a cada ano. Enquanto `E.video.fileUrl` for `null`, renderizar capa clicável que abre `E.video.reelUrl` em nova aba (`target="_blank" rel="noopener noreferrer"`); quando o arquivo existir, trocar por `<video controls poster>`. Escrever os dois ramos agora — o `if` é uma linha e evita voltar aqui depois.

> **Corrigido na Task 3:** não há dois ramos. `E.video.fileUrl` não existe — o
> arquivo está no bucket e o campo virou `E.video.file` /
> `E.video.poster` (filenames para `img()`) + `E.video.aspectRatio` (`'9 / 16'`).
> Renderizar direto o `<video controls playsinline preload="none" poster>` do
> protótipo aprovado. `E.video.reelUrl` fica só como crédito da origem — **não
> embutir o Instagram** (mexeria no CSP, ver Global Constraints).

**`ExperienceCta`** — faixa em `--color-navy-600` com a chamada e botão para `#inscricao`. Texto: gratuito, `{E.seats}` vagas.

**`ExperienceSponsors`** — **fundo claro** (obrigatório, ver Global Constraints). Título "Patrocinadores". Cada item é `<a>` com `<img>` do logo, `alt={s.name}`, `width={s.width}`, `loading="lazy"`, e o link com `rel="noopener noreferrer"`. Com um só patrocinador, centralizar — não esticar para preencher a linha.

**`ExperienceFooter`** — logo Semog, uma linha institucional, contato e social. **Sem menu de navegação do site** (é o ponto da página isolada). Link para a política de privacidade é permitido e desejável.

**`experience.css`** — importado pela página. Usar exclusivamente tokens de `theme.css`. Respeitar `prefers-reduced-motion` em qualquer transição. Toda imagem com `max-width: 100%`.

- [x] **Step 4: Compor na página**

Substituir o corpo de `src/app/(evento)/experience/page.tsx` pelas seções, na ordem: Hero → Pillars → Program → Video → Cta → (formulário, Task 7) → Sponsors → Footer.

- [x] **Step 5: Rodar e ver passar**

Run: `pnpm vitest run --config ./vitest.config.mts tests/int/experience-sections.int.spec.tsx`
Expected: PASS (3 testes)

- [x] **Step 6: Conferir com os próprios olhos**

```bash
pnpm run build && pnpm run start
```
Abrir `http://localhost:3000/experience` e conferir, em 1440px e em 390px: nada estoura na horizontal; o texto do hero fica legível sobre a foto; a faixa de patrocinadores tem fundo claro; o logo da Superlógica não está sobre imagem nem com sombra.

- [x] **Step 7: Commit**

```bash
git add src/components/experience/ src/app/\(evento\)/experience/page.tsx tests/int/experience-sections.int.spec.tsx
git commit -m "feat(experience): seções da landing"
```

> **Nota da Task 6 (executada) — porte, não redesign.** Cada seção é o markup
> do protótipo aprovado convertido em server component; classes, textos e
> superfícies (`.s-dark`/`.s-deep`/`.s-paper`/`.s-white`/`.s-brand`) vieram de
> lá sem retoque. O que divergiu, e por quê:
>
> 1. **O teste do Step 1 não roda como escrito.** O projeto **não tem
>    `@testing-library/jest-dom`** (ver `vitest.setup.ts`), então
>    `toBeInTheDocument`/`toHaveAttribute`/`toHaveTextContent` não existem —
>    seriam `TypeError`, não falha de asserção. O spec usa
>    `toBeDefined()`/`getAttribute`/`textContent`, como os outros de
>    `tests/int/`. **Vale para a Task 7**, cujo teste também usa `jest-dom`
>    (`toBeInTheDocument`, `toBeChecked`): ou se instala a dependência (mexe na
>    suíte inteira) ou se traduzem as asserções.
> 2. **`getByText(/2025/)` encontraria três elementos** (título, nota e legenda
>    citam o ano) e o singular lança "found multiple elements". Virou
>    `getAllByText`, com o ano vindo de `EXPERIENCE_EVENT.video.previousYear`.
> 3. **`E.video.fileUrl` não existe** (já registrado na Task 3): não há dois
>    ramos nem capa clicável — é o `<video controls playsinline preload="none"
>    poster>` do protótipo, servido do bucket. Conferido tocando de verdade:
>    68,5s, 406×720 (9:16), sem erro de console e sem violação de CSP.
> 4. **Rodapé — dado de contato corrigido.** O protótipo trazia
>    `(83) 2106-0400` e `contato@semog.com.br`. O telefone não é da Semog em
>    lugar nenhum (`content/site.ts` lista as quatro unidades; a de João Pessoa
>    é `(83) 3224-1228`) e o e-mail é o do site ANTIGO, trocado por
>    `ola@semog.com.br` na migração. Publicar qualquer um dos dois daria ao
>    inscrito um canal que não atende. O telefone agora sai de
>    `content/site.ts`, da unidade que sedia o evento. Pelo mesmo motivo o
>    `©` diz "Semog Administradora de Condomínios" (razão usada no site e no
>    JSON-LD da Task 8), não "Administração". **Confirmar com o cliente** — ver
>    "Antes de publicar".
> 5. **Faixa (`ExperienceCta`)**: o plano pedia repetir "gratuito, {seats}
>    vagas"; ficou o texto do protótipo ("Evento gratuito … Vagas limitadas").
>    O número já está no hero e volta na seção de inscrição.
> 6. **Logo do topo não é link.** No protótipo era `href="#"` (placeholder), e
>    a página é isolada de propósito — a única saída é a inscrição.
> 7. **`<main>` e `<h1>`**: o protótipo era um arquivo solto, sem landmark; a
>    página envolve as seções em `<main>` (o `<footer>` fora dele, senão não é
>    `contentinfo`). E o `<h1>` ganhou o espaço que faltava entre "Semog" e
>    `<span>Experience</span>` — sem ele o nome acessível era "SemogExperience".
> 8. **`experience.css` é escopado em `.exp`** e não repete cor nenhuma: cada
>    valor aponta para token de `theme.css`. Três substituições estão
>    documentadas no topo do arquivo; a que não é cosmética é o texto
>    terciário claro (#6b7699 do protótipo mede 4,08:1 sobre a superfície clara
>    e reprova no AA — usa-se o #5a6488 que o tema já tinha corrigido).
>    Conferido no build: o CSS sai em chunk próprio, só em `/experience`, e o
>    chunk compartilhado não tem uma regra `.exp` sequer.
> 9. **`.place` e `.hero-bg` viraram `next/image` com `fill`**, então o
>    `aspect-ratio` 16/10 saiu do `<img>` e foi para a moldura (com `fill` a
>    imagem é `position:absolute` e não sustenta altura nenhuma).
> 10. **O e2e da Task 5 precisou de escopo.** Data, local e vagas passaram a
>    aparecer em três lugares e o modo estrito do Playwright derrubava
>    `getByText`. O teste agora olha dentro de `.hero` — o que ele prova
>    (a informação antes da dobra) fica até mais forte. **A Task 7 vai
>    reintroduzir o problema** ao escrever "São 200 vagas" na seção de
>    inscrição, então convém rodar o spec depois.
>
> Verificação: `experience-sections` 6/6; `test:int` 181/181 (30 arquivos);
> `experience.e2e` 3/3 contra o build de produção; `tsc --noEmit` limpo; Biome
> limpo (três `biome-ignore` no CSS, justificados no próprio arquivo);
> `pnpm run build` sem erro, `/experience` continua rota estática. Nada estoura
> na horizontal em 1440px nem em 390px (`scrollWidth === clientWidth` nos dois,
> zero elementos passando da borda).

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

- [x] **Step 1: Escrever o teste que falha**

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

- [x] **Step 2: Rodar e ver falhar**

Run: `pnpm vitest run --config ./vitest.config.mts tests/int/experience-form.int.spec.tsx`
Expected: FAIL — componente não existe

- [x] **Step 3: Escrever o formulário**

`src/components/forms/ExperienceForm.tsx`, client component. Requisitos:

- `useForm<ExperienceInput, unknown, ExperienceValues>({ resolver: zodResolver(experienceSchema) })` — os três generics pelo mesmo motivo do `PropostaForm` (o `z.preprocess` de `acompanhantes` faz input ≠ output)
- Campos na ordem de `FORMS.experience.fields`: nome, e-mail, WhatsApp, condomínio (opcional), acompanhantes (`<select>` 0–3, opcional), aceite de imagem (checkbox)
- Cada campo com `<label>` ligado por `htmlFor`/`id`; erro anunciado via `aria-describedby` e `role="alert"`
- Aceite de imagem: texto curto explicando que o evento é fotografado e filmado, com link para `/privacidade`. **Nunca `defaultChecked`.**
- Botão: "Garantir minha vaga". Desabilitado enquanto envia; texto muda para "Enviando…"
- Sucesso: substituir o formulário por confirmação que repete data, horário e local (a pessoa precisa saber quando e onde comparecer), sem prometer e-mail de confirmação — **isso ainda não existe**
- Erro: mensagem devolvida por `submitForm`, sem jargão
- Resetar o `Turnstile` (via `key`) depois de cada submissão, como faz o `PropostaForm`

- [x] **Step 4: Rodar e ver passar**

Run: `pnpm vitest run --config ./vitest.config.mts tests/int/experience-form.int.spec.tsx`
Expected: PASS (2 testes)

> **Executado:** PASS com **4** testes — os dois do plano (traduzidos, ver a
> nota no fim da task) mais dois que fecham requisitos do Step 3 que ficariam
> sem rede: o envio como `'experience'` com o WhatsApp já em E.164, e a tela
> de sucesso repetindo data/horário/local **sem** a palavra "e-mail".

- [x] **Step 5: Inserir na página**

Na `page.tsx`, entre `ExperienceCta` e `ExperienceSponsors`:

```tsx
<section id="inscricao" className="experience-inscricao">
  <ExperienceForm />
</section>
```

> **Corrigido na Task 6:** `.experience-inscricao` não existe. O protótipo
> aprovado tem a seção inteira, e o CSS dela **já está** em
> `src/components/experience/experience.css` (`.signup`, `.facts`, `.card`,
> `.row`, `.field`, `.check`, `.formnote`) — falta só o markup. A seção é uma
> grade de duas colunas: à esquerda a `.intro` (eyebrow "Inscrição", título
> "Garanta a sua vaga", parágrafo e a lista `.facts` de quatro itens com o
> ícone de check), à direita o `.card` com o formulário. Copiar do protótipo
> (`docs/superpowers/specs/2026-08-21-semog-experience-prototipo.html`, seção
> `signup`), lendo o número de vagas de `EXPERIENCE_EVENT.seats`:
>
> ```tsx
> <section className="signup s-paper" id="inscricao">
>   <div className="wrap">
>     <div className="grid">
>       <div className="intro">…</div>
>       <div className="card"><ExperienceForm /></div>
>     </div>
>   </div>
> </section>
> ```
>
> Entra entre `<ExperienceCta />` e `<ExperienceSponsors />` em
> `src/app/(evento)/experience/page.tsx`, dentro do `<main>`.

Conferir que os botões do hero e do CTA apontam para `#inscricao`.

- [ ] **Step 6: Teste manual de ponta a ponta**

⚠️ O Turnstile real **bloqueia navegador automatizado** (`failure_retry`) — este teste tem que ser humano. Rodar `pnpm run build && pnpm run start`, preencher em `http://localhost:3000/experience#inscricao` e confirmar no banco:

```bash
node --env-file=.env -e "const pg=require('pg');const c=new pg.Client({connectionString:process.env.DATABASE_URI,ssl:{rejectUnauthorized:false}});c.connect().then(()=>c.query(\"select id, form, data, exact_lead_id from cms.leads where form='experience' order by created_at desc limit 3\")).then(r=>{console.table(r.rows);return c.end()})"
```

Expected: a linha existe, `form = 'experience'` e **`exact_lead_id` é `null`** (não foi ao CRM).

> **NÃO EXECUTADO — depende de uma pessoa.** O aviso do próprio step se
> confirmou: com o Chromium do Playwright o widget da Cloudflare trava em
> "Verifying… Stuck? Troubleshoot" e nunca devolve token, então `submitForm`
> não chega a ser chamado e nenhuma linha é gravada. O que **foi** verificado
> no build de produção (`pnpm run build && pnpm run start`), em 1440px e
> 390px:
> - a seção `#inscricao` existe no HTML servido, com o formulário completo,
>   "São 200 vagas" vindo de `EXPERIENCE_EVENT.seats` e o script do Turnstile
>   carregando;
> - submeter vazio acende os quatro erros (nome, e-mail, WhatsApp, aceite),
>   com borda e texto em `--err` (`rgb(176,42,63)`, medido no navegador);
> - nada estoura na horizontal (`scrollWidth === clientWidth` nos dois
>   tamanhos, zero elementos de `#inscricao` passando da borda);
> - a consulta acima roda e devolve **0 linhas** hoje — o banco responde e o
>   SQL está certo, só falta a submissão humana.
>
> **Para quem for publicar:** preencher uma vez no navegador de verdade e
> rodar a consulta. É o único passo desta task que ficou em aberto.

- [x] **Step 7: Commit**

```bash
git add src/components/forms/ExperienceForm.tsx src/app/\(evento\)/experience/page.tsx tests/int/experience-form.int.spec.tsx
git commit -m "feat(experience): formulário de inscrição"
```

> **Nota da Task 7 (executada).** O que divergiu do texto literal do plano,
> e por quê:
>
> 1. **O teste do Step 1 não roda como escrito — por dois motivos.** O
>    primeiro já vinha avisado pela Task 6: não há `@testing-library/jest-dom`,
>    então `toBeInTheDocument`/`toBeChecked` seriam `TypeError`. O segundo é
>    novo: **`@testing-library/user-event` também não está instalado**
>    (`package.json` só tem `@testing-library/react`). Traduzido para
>    `fireEvent` + `toBeDefined()` + `.checked`, sem acrescentar dependência —
>    instalar um pacote de teste mexeria no lockfile e na suíte inteira por
>    causa de duas asserções.
> 2. **`{ name: /uso de imagem/i }` não casa com o texto aprovado.** O aceite
>    do protótipo diz "Autorizo o uso **da minha** imagem…". O locator do
>    plano encontraria zero checkboxes; virou `/uso da minha imagem/i`. O
>    rótulo ganhou na frente "O evento é fotografado e filmado.", que é o que
>    o Step 3 pede que o texto explique, e o link vai para `/privacidade`.
> 3. **Não usa `Field`/`PhoneField`.** Os dois são fechados no visual das
>    superfícies ESCURAS do site (`bg-[rgba(10,16,46,0.6)]`, erro `#F2A6B4`);
>    este formulário vive no `.card` branco da `.s-paper`, cujo CSS
>    (`.field`, `.row`, `.check`, `.formnote`) a Task 6 já portou. Reusá-los
>    deixaria uma caixa escura no meio do card claro. O markup é o do
>    protótipo, campo a campo. O plano não os lista em "Consumes", então isto
>    segue a interface declarada.
> 4. **WhatsApp com `Controller` + `AsYouType('BR')`.** `experienceSchema`
>    valida com `isValidPhoneNumber`, que exige E.164 — um `<input type="tel">`
>    cru entregaria `(83) 99999-8888` e reprovaria sempre. Mesma ideia do
>    `PhoneField`, sem o seletor de país (evento presencial numa praia).
> 5. **Cor de erro: `--err: #b02a3f`.** O `theme.css` **não tem token de
>    erro** — `Field.tsx`/`PhoneField.tsx` escrevem `#E27287`/`#F2A6B4` à mão,
>    calibrados para fundo escuro. Sobre o card branco o `#F2A6B4` mede 1,7:1
>    e o `#E27287`, 3,0:1 (reprova no AA de texto pequeno, que é o tamanho da
>    mensagem). `--err` é o **mesmo matiz** (~350°) escurecido até 6,5:1. Não
>    é cor nova de paleta; é a única saída legível, e está documentada no topo
>    do bloco `.exp` em `experience.css`. Cor também não é o único sinal: há
>    texto com `role="alert"` e `aria-invalid` no controle.
> 6. **Dispara `experience_signup`, nunca `generate_lead`.** O plano não pedia
>    evento nenhum, mas o `PropostaForm` — que o Step 3 manda seguir — dispara
>    `generate_lead` no sucesso, e copiar isso aqui inflaria o evento-chave do
>    GA4 e a conversão importada no Ads com inscrições de evento, exatamente o
>    que a decisão "não vai pro Exact" existe para evitar. Evento próprio,
>    contado à parte — e o comentário no código impede a próxima cópia.
>    **Falta marcar `experience_signup` no GA4** se alguém for anunciar o
>    evento (ver "Antes de publicar").
> 7. **Sucesso: "Inscrição recebida!", não "confirmada".** Não há contador de
>    vagas ao vivo (decisão do plano), então o site não sabe se a pessoa é a
>    de número 201 — "confirmada" seria uma promessa que ninguém checou. O
>    bloco repete data, horário e local (de `EXPERIENCE_EVENT`) e não usa a
>    `message` devolvida pela server action, que diz "Recebemos sua mensagem!"
>    — copy de formulário de contato, errada para uma inscrição.
> 8. **`acompanhantes` mantém o `value=""` do protótipo** para "Vou
>    sozinho(a)" (= não informado), com as opções +1/+2/+3. O `0` do schema
>    fica inalcançável pela tela, de propósito: "sozinho" e "zero
>    acompanhantes" são a mesma linha na lista de credenciamento.
> 9. **A seção `#inscricao` ficou dentro da `page.tsx`**, como manda a
>    correção do Step 5, e não virou um oitavo componente: metade dela é o
>    `<ExperienceForm />` (client) e a outra metade é texto — um invólucro só
>    para o `<div className="card">` não pagaria por si. Os quatro benefícios
>    da coluna esquerda ficam numa constante local (`BENEFICIOS`): é copy de
>    venda, não dado operacional do evento.
>
> **Achado que esta task NÃO corrigiu (fora do escopo, precisa de decisão).**
> A Task 2 já tinha avisado que a inscrição dispara o auto-reply genérico
> `ContactAutoReply`. Lendo o template: além do assunto "Recebemos seu
> contato — Semog", o corpo diz *"Sua mensagem já chegou até nossa equipe e em
> breve alguém vai retornar pra você"*. Para quem se inscreveu num evento isso
> é **falso** — ninguém vai retornar, a pessoa só precisa aparecer no dia. A
> tela de sucesso não promete e-mail nenhum (o teste trava isso), mas o e-mail
> sai. Corrigir exige um template novo (`ExperienceAutoReply`) e um ramo em
> `submit-form.ts`, os dois fora dos arquivos desta task. Está em "Antes de
> publicar".
>
> Verificação: `experience-form` 4/4; `test:int` 185/185 (31 arquivos);
> `experience.e2e` 3/3 contra o build de produção (o escopo em `.hero` que a
> Task 6 previu segurou o "São 200 vagas" novo); `tsc --noEmit` limpo; Biome
> limpo; `pnpm run build` sem erro e `/experience` ainda estática (○).

---

### Task 8: JSON-LD, sitemap e verificação final

**Files:**
- Modify: `src/app/(evento)/experience/page.tsx` (JSON-LD)
- Modify: `src/app/(frontend)/sitemap.ts`
- Test: `tests/e2e/experience.e2e.spec.ts` (acrescentar casos)

**Interfaces:**
- Consumes: `EXPERIENCE_EVENT`, `absoluteUrl`

- [x] **Step 1: Acrescentar os testes**

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

> **Corrigido na execução, em três pontos.**
> 1. `page.goto('/experience')` não roda aqui: `baseURL` está comentado em
>    `playwright.config.ts` (a Task 5 já tinha topado com isso). Os dois testes
>    usam a constante `URL_EXPERIENCE` que o arquivo já tem.
> 2. O nome do primeiro teste promete "data **e local**", mas as asserções do
>    plano só olhavam data e preço. Entrou
>    `expect(jsonLd.location.name).toBe('Praia do Cabo Branco')` — sem ela o
>    teste passaria com um JSON-LD sem lugar nenhum, que é justamente o campo
>    obrigatório do `Event` para o Google.
> 3. O Step 4 (sitemap) não tinha teste — só o `curl` do Step 6, que não deixa
>    rastro. Foi acrescentado um caso em `tests/int/sitemap.int.spec.ts`
>    (arquivo que já existe exatamente para travar essa regra: "toda página de
>    captação tem que estar no sitemap"). Escrito antes, visto falhar
>    (`expected [...28 URLs] to include '…/experience'`), passou depois.

- [x] **Step 2: Rodar e ver falhar**

Run: `pnpm exec playwright test tests/e2e/experience.e2e.spec.ts`
Expected: FAIL — não há JSON-LD

> **Executado:** 1 falhou, 4 passaram. A falha é a esperada — `locator.textContent`
> estourando o timeout à espera de um `script[type="application/ld+json"]` que
> não existia (conferido também por `curl … | grep -c 'application/ld+json'` →
> `0`). **Registro honesto:** o segundo teste do Step 1 ("os CTAs levam ao
> formulário") **já nasceu verde** — os três CTAs e a âncora `#inscricao` vieram
> das Tasks 6 e 7. Ele não é um teste vermelho desta task; é rede de regressão
> para o dia em que alguém mexer no hero ou na faixa. O vermelho de verdade
> foram o JSON-LD e o caso novo do sitemap.

- [x] **Step 3: Acrescentar o JSON-LD**

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

> **Executado com dois campos a mais** (o resto é o snippet acima, literal):
> - **`image`** — o Google lista a imagem como recomendada para `Event`, e é
>   ela que aparece no card do resultado. Vem de
>   `img('experience-hero.webp').url` (a mesma foto do hero), não de uma URL
>   digitada: o `content/media.ts` é quem sabe a base do bucket.
> - **`organizer['@id']`** — `${absoluteUrl('')}#org`, o mesmo id do nó
>   `Organization` que a home publica (`getOrganizationJsonLd`). Sem ele o
>   evento criaria uma organização solta com nome igual, em vez de se prender à
>   entidade que o Google já conhece. O `name` bate com o `FALLBACK_TITLE` de
>   `src/lib/seo.ts`, conferido.
>
> O objeto ficou em escopo de módulo (`const eventJsonLd`), ao lado de `title`
> e `description`: nada nele depende de request, e assim o `description` é
> literalmente o mesmo texto do `metadata`. O `<script>` entra num fragmento,
> antes do `<div className="exp">` — o CSS da página é todo escopado em `.exp`,
> então o script não pode morar dentro dele por acaso de estilo.

- [x] **Step 4: Acrescentar ao sitemap**

Em `src/app/(frontend)/sitemap.ts`, incluir a entrada de `/experience`. Abrir o arquivo primeiro e seguir o formato das entradas existentes (as landings de cidade já estão lá — o sitemap já esqueceu essas rotas uma vez, corrigido no commit `cba2103`; não repetir o erro).

> **Executado.** Entrada própria (`experienceEntry`), no formato das landings
> de cidade: `changeFrequency: 'weekly'`, `priority: 0.8` — abaixo do 0.9 das
> cidades, que são captação permanente, e acima das institucionais, porque esta
> tem prazo. O comentário no arquivo diz por que ela precisa ser somada à mão
> (mesmo ponto cego das cidades: rota explícita, fora de `content/pages`, e
> ainda num route group irmão) e que a entrada sai depois de 26/09/2026.

- [x] **Step 5: Rodar tudo**

```bash
pnpm exec tsc --noEmit -p tsconfig.json
pnpm run test:int
pnpm run build
pnpm run start &
pnpm exec playwright test tests/e2e/experience.e2e.spec.ts
```
Expected: typecheck sem saída; testes int e e2e passando; build sem erro.

> **Executado:** `tsc --noEmit` limpo; `test:int` **186/186** (31 arquivos, +1
> do sitemap); `pnpm run build` sem erro, com `○ /experience` ainda estática;
> `experience.e2e` **5/5** e a suíte e2e inteira **52/52** contra o build de
> produção. Biome limpo nos três arquivos.
>
> Uma armadilha de ambiente, de novo: a porta 3000 tinha um `next start` do
> build da Task 7 e `reuseExistingServer: true` faria o Playwright testar HTML
> velho — sem JSON-LD e sem a entrada nova no sitemap — sem avisar. Matar o
> processo e reconstruir **antes** de rodar o e2e é parte do procedimento.

- [x] **Step 6: Conferir que a rota não vazou**

```bash
curl -s http://localhost:3000/sitemap.xml | grep experience
curl -s http://localhost:3000/experience | grep -o '<title>[^<]*</title>'
```
Expected: a URL aparece no sitemap; o título é o do evento, não o padrão do site.

> **Executado.** `<loc>https://www.semog.com.br/experience</loc>` no sitemap
> (uma vez só — o teste de URL duplicada continua verde) e
> `<title>Semog Experience 2026 — manhã wellness na Praia do Cabo Branco</title>`.
> Conferido também: `<link rel="canonical" href="…/experience">` presente,
> **nenhum** `<meta name="robots">` de `noindex` na página, e o JSON-LD servido
> parseia com `startDate` `2026-09-26T07:00:00-03:00`.
>
> O `/robots.txt` local devolve `Disallow: /` — é o comportamento correto fora
> de produção (`src/app/robots.ts` só libera com `SITE_ALLOW_INDEX === 'true'`,
> que já está ligado na Vercel). Não é pendência; só não dá para conferir a
> liberação por aqui.

- [x] **Step 7: Commit**

```bash
git add src/app/\(evento\)/experience/page.tsx src/app/\(frontend\)/sitemap.ts tests/e2e/experience.e2e.spec.ts
git commit -m "feat(experience): JSON-LD de evento e entrada no sitemap"
```

> **Nota da Task 8 (executada).** O que divergiu do texto literal do plano, e
> por quê:
>
> 1. **`page.goto('/experience')` não roda** — `baseURL` comentado em
>    `playwright.config.ts`; os testes usam a constante `URL_EXPERIENCE` do
>    próprio arquivo, como os outros specs de `tests/e2e/`.
> 2. **Uma asserção a mais no teste do JSON-LD** (`location.name`), porque o
>    nome do teste prometia "e local" e as asserções não olhavam o campo — que
>    é obrigatório para o Google entender a página como evento.
> 3. **Um teste que o plano não pedia, em arquivo que o plano não lista.**
>    `tests/int/sitemap.int.spec.ts` ganhou o caso "inclui a landing do
>    Experience". O Step 4 só tinha o `curl` do Step 6 como verificação, e
>    `curl` não impede ninguém de apagar a entrada amanhã — o furo das landings
>    de cidade (que este mesmo arquivo documenta) foi exatamente esse.
> 4. **`image` e `organizer['@id']` no JSON-LD**, justificados no Step 3.
> 5. **O `git add` do Step 7 lista três arquivos**; foram quatro, mais o plano
>    (o teste do sitemap e as marcações desta nota).
>
> Também vale registrar o que **não** foi mexido de propósito: a entrada do
> sitemap é a única mudança fora do route group `(evento)`, e o
> `tests/int/sitemap.int.spec.ts` continua verde nos quatro casos antigos — a
> landing do evento não deslocou nem duplicou nenhuma URL existente.
>
> Verificação: `tsc --noEmit` limpo; `test:int` 186/186 (31 arquivos);
> `pnpm run build` sem erro, `/experience` ainda estática (○);
> `experience.e2e` 5/5 e a suíte e2e completa 52/52 contra o build de produção;
> Biome limpo. Sitemap e `<title>` conferidos por `curl` no servidor de
> produção local.

---

## Antes de publicar

- [ ] Confirmar com a **Superlógica** que ela aparece como patrocinadora nesta peça
- [ ] ~~Trocar a capa do vídeo pelo arquivo original~~ — feito: o Reel está no
      bucket e toca na página (`E.video.file`/`E.video.poster`)
- [ ] **Confirmar telefone e e-mail do rodapé.** O protótipo trazia
      `(83) 2106-0400` e `contato@semog.com.br`; a Task 6 publicou o telefone da
      unidade de João Pessoa (`content/site.ts`) e `ola@semog.com.br`, que são
      os dados vivos do site. Se o evento tiver linha ou caixa própria, ela
      entra em `content/site.ts` / `ExperienceFooter` — não pode ficar um canal
      que ninguém atende
- [x] ~~Decidir a largura de exibição do logo da Superlógica~~ — voltou aos
      260px da peça aprovada (`src/data/experienceSponsors.ts`); a redução para
      190 não tinha sido validada com o patrocinador
- [x] ~~Decidir o e-mail que o inscrito recebe~~ — criado
      `src/emails/ExperienceAutoReply.tsx` ("Inscrição recebida — Semog
      Experience", com data/horário/local de `EXPERIENCE_EVENT` e a frase de
      que não há lista comercial); `submit-form.ts` escolhe o template por
      `formType`. A tela de sucesso continua sem prometer e-mail — se quiserem
      que ela mencione, agora pode
- [ ] **Confirmar o texto do aceite de uso de imagem.** O protótipo aprovado
      dizia "Autorizo o uso da minha imagem em fotos e vídeos **do evento**"; o
      que foi publicado é "**O evento é fotografado e filmado.** Autorizo o uso
      da minha imagem em fotos e vídeos **do Semog Experience**, conforme a
      política de privacidade". A frase a mais é mais segura do ponto de vista
      de LGPD (avisa antes de pedir o consentimento) e o link agora aponta para
      `/privacidade`, que ganhou a seção 6 sobre imagem em eventos — mas a peça
      aprovada e a publicada não podem ter textos diferentes sem ninguém saber
- [ ] **Registrar a mudança no véu do hero e na legenda da foto do local.** As
      duas divergem do protótipo por legibilidade, não por gosto: medido no
      navegador, `.hero .lede` marcava 1,26:1 e `.place .pname` 1,70:1 contra os
      4,5:1 do WCAG AA. O véu do hero fechou na faixa do meio e a legenda ficou
      opaca; a foto continua visível nas duas. Vale mostrar ao cliente lado a
      lado
- [ ] **Marcar `experience_signup` como evento-chave no GA4** se o evento for
      anunciado em mídia paga. É de propósito que a inscrição NÃO dispara
      `generate_lead` (misturaria com a captação comercial), então sem esse
      passo uma campanha do evento fica sem conversão para otimizar
- [ ] Conferir a data uma última vez com quem organiza — ela está em `src/data/experienceEvent.ts` e some da página inteira se estiver errada
- [ ] Decidir se `/experience` entra no menu do site ou fica só como link de divulgação (hoje é só link — a página é isolada de propósito)
- [ ] **Depois de 26/09/2026: decidir o destino da página.** Ela está no
      sitemap (`src/app/(frontend)/sitemap.ts`, entrada `experienceEntry`) e
      publica JSON-LD de `Event` com data fixa. Passado o evento, ou a data
      vira a da edição seguinte em `src/data/experienceEvent.ts` (e tudo se
      atualiza sozinho) ou a entrada sai do sitemap — evento vencido indexado
      como evento futuro é resultado errado na busca
