import config from '@payload-config'
import { getPayload } from 'payload'
import type { Form } from '@/payload-types'

/**
 * Seed idempotente dos dois formulários do Form Builder (`@payloadcms/plugin-form-builder`,
 * registrado em `src/payload.config.ts`): "Contato" e "Proposta".
 *
 * - "Contato": `_reference/contato.html` não tem `<form>` — a página só linka
 *   canais diretos (WhatsApp, e-mail) e autoatendimentos (`.ss-grid`: segunda
 *   via de boleto, CND, acordo de pagamento, alteração de titularidade,
 *   declaração de quitação, reserva de áreas comuns). Este formulário cobre o
 *   caso que não tem atalho pronto: nome/e-mail/telefone + um `assunto`
 *   (select) com essas mesmas opções de autoatendimento + "Proposta
 *   comercial"/"Dúvida geral"/"Outro assunto", e mensagem.
 * - "Proposta": espelha o `<form id="prop-form">` de `_reference/proposta.html`
 *   campo a campo — grupo "tipo" (pills/radiogroup em HTML, aqui um `select`
 *   porque o plugin não tem tipo `radio` habilitado), nome, nome do
 *   condomínio (texto, opcional — sem equivalente no ref, adicionado depois:
 *   incorporadoras solicitando proposta para um lançamento muitas vezes
 *   ainda não têm nome de condomínio definido), cargo (select), e-mail,
 *   telefone (WhatsApp), cidade (select das 4 praças + "Outra cidade"),
 *   número de unidades e mensagem (opcional). "Número de unidades" é
 *   `number` em vez do `select` de faixas do HTML — decisão da task (ver
 *   `.superpowers/sdd/p4b-task-1-brief.md`, que pede explicitamente o tipo
 *   `number` para esse campo), documentada no relatório da task.
 *
 * Upsert idempotente por `title` (único campo estável do form builder — a
 * collection `forms` do plugin não tem `slug`).
 *
 * Executa via `pnpm seed:forms` (`payload run src/seed/forms.ts`): assim
 * como os demais seeds, obtém a própria instância do Payload — o CLI
 * `payload run` não injeta uma pronta.
 */

// biome-ignore lint/suspicious/noExplicitAny: shape mínimo de parágrafo lexical, não vale tipar o AST inteiro aqui
function richText(paragraphs: string[]): any {
  return {
    root: {
      type: 'root',
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        direction: 'ltr' as const,
        format: '' as const,
        indent: 0,
        version: 1,
        children: [
          {
            type: 'text',
            format: 0,
            detail: 0,
            mode: 'normal' as const,
            style: '',
            text,
            version: 1,
          },
        ],
      })),
    },
  }
}

type FormData = Omit<Form, 'id' | 'updatedAt' | 'createdAt'>

const contatoData: FormData = {
  title: 'Contato',
  fields: [
    {
      blockType: 'text',
      name: 'nome',
      label: 'Nome',
      required: true,
    },
    {
      blockType: 'email',
      name: 'email',
      label: 'E-mail',
      required: true,
    },
    {
      blockType: 'text',
      name: 'telefone',
      label: 'Telefone / WhatsApp',
      required: false,
    },
    {
      blockType: 'select',
      name: 'assunto',
      label: 'Assunto',
      required: false,
      options: [
        { label: 'Dúvida geral', value: 'duvida-geral' },
        { label: 'Segunda via de boleto', value: 'segunda-via-boleto' },
        { label: 'CND do condomínio', value: 'cnd-condominio' },
        { label: 'Acordo para pagamento', value: 'acordo-pagamento' },
        { label: 'Alteração de titularidade', value: 'alteracao-titularidade' },
        { label: 'Declaração de quitação', value: 'declaracao-quitacao' },
        { label: 'Reserva de áreas comuns', value: 'reserva-areas-comuns' },
        { label: 'Proposta comercial', value: 'proposta-comercial' },
        { label: 'Outro assunto', value: 'outro' },
      ],
    },
    {
      blockType: 'textarea',
      name: 'mensagem',
      label: 'Mensagem',
      required: true,
    },
  ],
  submitButtonLabel: 'Enviar mensagem',
  confirmationType: 'message',
  confirmationMessage: richText([
    'Mensagem recebida! Nosso time responde em horário comercial, geralmente em poucos minutos pelo WhatsApp, ou em até 24 horas úteis por e-mail.',
  ]),
  emails: [],
}

const propostaData: FormData = {
  title: 'Proposta',
  fields: [
    {
      blockType: 'select',
      name: 'tipo',
      label: 'O que você representa?',
      required: true,
      defaultValue: 'Condomínio residencial',
      options: [
        { label: 'Condomínio residencial', value: 'Condomínio residencial' },
        { label: 'Condomínio comercial', value: 'Condomínio comercial' },
        { label: 'Associação', value: 'Associação' },
        { label: 'Incorporadora', value: 'Incorporadora' },
      ],
    },
    {
      blockType: 'text',
      name: 'nome',
      label: 'Seu nome',
      required: true,
    },
    {
      blockType: 'text',
      name: 'nomeCondominio',
      label: 'Nome do condomínio',
      required: false,
    },
    {
      blockType: 'select',
      name: 'cargo',
      label: 'Seu papel',
      required: false,
      options: [
        { label: 'Síndico(a)', value: 'Síndico(a)' },
        { label: 'Conselheiro(a)', value: 'Conselheiro(a)' },
        { label: 'Morador(a)', value: 'Morador(a)' },
        { label: 'Incorporador(a) / Construtora', value: 'Incorporador(a) / Construtora' },
        { label: 'Outro', value: 'Outro' },
      ],
    },
    {
      blockType: 'email',
      name: 'email',
      label: 'E-mail',
      required: true,
    },
    {
      blockType: 'text',
      name: 'telefone',
      label: 'WhatsApp',
      required: true,
    },
    {
      blockType: 'select',
      name: 'cidade',
      label: 'Cidade do condomínio',
      required: false,
      options: [
        { label: 'Recife e região', value: 'Recife e região' },
        { label: 'João Pessoa e região', value: 'João Pessoa e região' },
        { label: 'Campina Grande e região', value: 'Campina Grande e região' },
        { label: 'Belém e região', value: 'Belém e região' },
        { label: 'Outra cidade', value: 'Outra cidade' },
      ],
    },
    {
      blockType: 'number',
      name: 'unidades',
      label: 'Número de unidades',
      required: false,
    },
    {
      blockType: 'textarea',
      name: 'mensagem',
      label: 'Conte um pouco do momento do condomínio (opcional)',
      required: false,
    },
  ],
  submitButtonLabel: 'Enviar solicitação',
  confirmationType: 'message',
  confirmationMessage: richText([
    'Solicitação recebida! Obrigado pela confiança. Um consultor da Semog vai entrar em contato pelo WhatsApp ou e-mail informado em até 24 horas úteis.',
  ]),
  emails: [],
}

async function upsertForm(payload: Awaited<ReturnType<typeof getPayload>>, data: FormData) {
  const existing = await payload.find({
    collection: 'forms',
    where: { title: { equals: data.title } },
    limit: 1,
    depth: 0,
  })

  if (existing.docs[0]) {
    const updated = await payload.update({
      collection: 'forms',
      id: existing.docs[0].id,
      data,
    })
    console.log(`[seed:forms] Form "${data.title}" atualizado (id=${updated.id}).`)
  } else {
    const created = await payload.create({
      collection: 'forms',
      data,
    })
    console.log(`[seed:forms] Form "${data.title}" criado (id=${created.id}).`)
  }
}

async function seedForms() {
  const payload = await getPayload({ config })

  await upsertForm(payload, contatoData)
  await upsertForm(payload, propostaData)
}

await seedForms()
