import { isValidPhoneNumber } from 'libphonenumber-js/min'
import { z } from 'zod'

/**
 * Schemas Zod dos dois formulários semeados pelo Form Builder
 * (`src/seed/forms.ts`, forms "Contato"/"Proposta" — DB live, ids 1/2).
 *
 * **Os nomes de campo abaixo são literais** — precisam bater exatamente com
 * o `name` de cada bloco em `contatoData.fields`/`propostaData.fields` do
 * seed, porque `submitForm` (`src/app/(frontend)/_actions/submit-form.ts`)
 * usa essas chaves pra montar `submissionData` (`{ field, value }[]`) do
 * `form-submissions`. **Não importar `src/seed/forms.ts` daqui** — aquele
 * módulo roda `await seedForms()` (grava no Postgres) como side effect no
 * top level, então importar o arquivo dispararia um seed a cada load.
 * Valores de `select` (enums abaixo) são copiados do seed de propósito —
 * se o seed mudar as opções, atualizar aqui também.
 */

const requiredText = (message: string) => z.string().trim().min(1, message)

/**
 * `PhoneField.tsx` sempre entrega o valor em E.164 (`+55...`, via
 * `AsYouType.getNumber()?.number`) — string vazia quando nada foi digitado.
 * `isValidPhoneNumber` (sem 2º argumento) exige esse formato E.164 completo,
 * então um número parcial (DDD incompleto, poucos dígitos etc.) também cai
 * como inválido aqui, não só valores claramente malformados — é o
 * comportamento certo: só um número completo/válido deve passar.
 */
const optionalPhone = (invalidMessage: string) =>
  z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || isValidPhoneNumber(value), invalidMessage)

const requiredPhone = (requiredMessage: string, invalidMessage: string) =>
  z
    .string()
    .trim()
    .min(1, requiredMessage)
    .refine((value) => isValidPhoneNumber(value), invalidMessage)

// ---------------------------------------------------------------------------
// Contato (form id=1)
// ---------------------------------------------------------------------------

const ASSUNTO_OPTIONS = [
  'duvida-geral',
  'segunda-via-boleto',
  'cnd-condominio',
  'acordo-pagamento',
  'alteracao-titularidade',
  'declaracao-quitacao',
  'reserva-areas-comuns',
  'proposta-comercial',
  'outro',
] as const

export const contatoSchema = z.object({
  nome: requiredText('Informe seu nome.'),
  email: z.email('Informe um e-mail válido.'),
  telefone: optionalPhone('Informe um telefone válido.'),
  assunto: z.enum(ASSUNTO_OPTIONS).optional(),
  mensagem: requiredText('Escreva sua mensagem.'),
})

export type ContatoValues = z.infer<typeof contatoSchema>

// ---------------------------------------------------------------------------
// Proposta (form id=2)
// ---------------------------------------------------------------------------

const TIPO_OPTIONS = [
  'Condomínio residencial',
  'Condomínio comercial',
  'Associação',
  'Incorporadora',
] as const

const CARGO_OPTIONS = [
  'Síndico(a)',
  'Conselheiro(a)',
  'Morador(a)',
  'Incorporador(a) / Construtora',
  'Outro',
] as const

const CIDADE_OPTIONS = [
  'Recife e região',
  'João Pessoa e região',
  'Campina Grande e região',
  'Belém e região',
  'Outra cidade',
] as const

/**
 * `unidades` é `number` no form builder (decisão da Task 1) — o `preprocess`
 * trata `''`/`null`/`undefined` (campo opcional deixado em branco por um
 * client) como "não informado" antes do `z.coerce.number()`, porque
 * `Number('')` é `0`, não `NaN` (coagiria um campo vazio pra "0 unidades").
 */
const unidadesField = z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  z.coerce
    .number('Informe um número válido.')
    .int('Use um número inteiro.')
    .positive('Deve ser maior que zero.')
    .optional(),
)

export const propostaSchema = z.object({
  tipo: z.enum(TIPO_OPTIONS, 'Selecione o que você representa.'),
  nome: requiredText('Informe seu nome.'),
  // Opcional de propósito: incorporadoras solicitando proposta para um
  // empreendimento em lançamento (ver `tipo: 'Incorporadora'` acima) muitas
  // vezes ainda não têm nome de condomínio definido.
  nomeCondominio: z.string().trim().optional(),
  cargo: z.enum(CARGO_OPTIONS).optional(),
  email: z.email('Informe um e-mail válido.'),
  telefone: requiredPhone('Informe seu WhatsApp.', 'Informe um WhatsApp válido.'),
  cidade: z.enum(CIDADE_OPTIONS).optional(),
  unidades: unidadesField,
  mensagem: z.string().trim().optional(),
})

export type PropostaValues = z.infer<typeof propostaSchema>

/**
 * Tipo "de entrada" (pré-parse) do form — necessário só por causa de
 * `unidades` (`z.preprocess`, cujo tipo de input é `unknown`). `useForm` em
 * `PropostaForm.tsx` usa este tipo pro estado bruto dos campos e
 * `PropostaValues` pro valor entregue em `handleSubmit` (já validado/
 * coagido pelo `zodResolver`) — sem isso, o `Resolver<PropostaValues, …>`
 * esperado por `useForm<PropostaValues>` não bate com o `Resolver<z.input<…>,
 * …>` que `zodResolver` de fato devolve, e o `tsc` acusa dois tipos
 * `Resolver` "não relacionados".
 */
export type PropostaInput = z.input<typeof propostaSchema>
