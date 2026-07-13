import config from '@payload-config'
import { getPayload } from 'payload'
import type { HeroBlock, Page, RichTextBlock } from '@/payload-types'

/**
 * Seed idempotente das páginas legais "Privacidade" e "Termos", fiel ao
 * corpo de `_reference/privacidade.html` e `_reference/termos.html`: Hero
 * simples (headline + subhead com a data de "última atualização", sem
 * ctas/video) seguido de um único bloco RichText com o texto completo —
 * heading `h2` por seção numerada e listas onde o `_reference` usa `<ul>`.
 * Prova, junto com `home.ts`/`posts.ts`, que a rota catch-all
 * `[[...slug]]` serve qualquer página de CMS por slug.
 *
 * Executa via `pnpm seed:pages` (`payload run src/seed/pages.ts`): assim
 * como os demais seeds, obtém a própria instância do Payload — o CLI
 * `payload run` não injeta uma pronta.
 */

type InlinePart = string | { text: string; href: string }
type Section =
  | { kind: 'p'; parts: InlinePart[] }
  | { kind: 'h2'; text: string }
  | { kind: 'ul'; items: string[] }

function p(text: string): Section {
  return { kind: 'p', parts: [text] }
}

function pWithLink(before: string, linkText: string, href: string, after: string): Section {
  return { kind: 'p', parts: [before, { text: linkText, href }, after] }
}

function h2(text: string): Section {
  return { kind: 'h2', text }
}

function ul(items: string[]): Section {
  return { kind: 'ul', items }
}

function textNode(text: string) {
  return {
    type: 'text',
    format: 0,
    detail: 0,
    mode: 'normal' as const,
    style: '',
    text,
    version: 1,
  }
}

function linkNode(text: string, href: string) {
  return {
    type: 'link',
    format: '' as const,
    direction: 'ltr' as const,
    indent: 0,
    version: 3,
    fields: { linkType: 'custom' as const, url: href, newTab: false },
    children: [textNode(text)],
  }
}

function inlineChildren(parts: InlinePart[]) {
  return parts.map((part) =>
    typeof part === 'string' ? textNode(part) : linkNode(part.text, part.href),
  )
}

function paragraphNode(parts: InlinePart[]) {
  return {
    type: 'paragraph',
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    version: 1,
    children: inlineChildren(parts),
  }
}

function headingNode(text: string) {
  return {
    type: 'heading',
    tag: 'h2' as const,
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    version: 1,
    children: [textNode(text)],
  }
}

function listNode(items: string[]) {
  return {
    type: 'list',
    tag: 'ul' as const,
    listType: 'bullet' as const,
    start: 1,
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    version: 1,
    children: items.map((text, index) => ({
      type: 'listitem',
      value: index + 1,
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
      children: inlineChildren([text]),
    })),
  }
}

// biome-ignore lint/suspicious/noExplicitAny: shape mínimo do AST lexical (root + parágrafos/headings/listas), não vale tipar tudo aqui
function legalRichText(sections: Section[]): any {
  const children = sections.map((section) => {
    if (section.kind === 'h2') return headingNode(section.text)
    if (section.kind === 'ul') return listNode(section.items)
    return paragraphNode(section.parts)
  })

  return {
    root: {
      type: 'root',
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
      children,
    },
  }
}

const UPDATED_AT = 'Última atualização: julho de 2026 · Documento em revisão pelo jurídico da Semog'

const privacidadeHero: Omit<HeroBlock, 'id' | 'blockName'> = {
  blockType: 'hero',
  headline: 'Política de Privacidade',
  subhead: UPDATED_AT,
}

const privacidadeSections: Section[] = [
  p(
    'Esta Política de Privacidade descreve como a Semog Administradora de Condomínios coleta, usa e protege os dados pessoais de síndicos, condôminos, clientes e visitantes deste site, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).',
  ),
  h2('1. Dados que coletamos'),
  ul([
    'Dados de contato fornecidos em formulários (nome, e-mail, telefone, cidade e informações do condomínio);',
    'Dados de navegação (páginas visitadas, dispositivo e cookies essenciais);',
    'Dados necessários à prestação dos serviços de administração condominial.',
  ]),
  h2('2. Como usamos os dados'),
  ul([
    'Responder solicitações de proposta e atendimento;',
    'Prestar os serviços contratados pelo condomínio;',
    'Cumprir obrigações legais, contábeis e regulatórias;',
    'Melhorar a experiência do site e dos nossos canais digitais.',
  ]),
  h2('3. Compartilhamento'),
  p(
    'Não vendemos dados pessoais. Compartilhamos dados apenas com operadores necessários à prestação do serviço (como instituições financeiras, parceiros de cobrança e provedores de tecnologia), sempre sob contrato e dever de confidencialidade.',
  ),
  h2('4. Seus direitos'),
  pWithLink(
    'Você pode solicitar a qualquer momento a confirmação, o acesso, a correção, a anonimização ou a exclusão dos seus dados, além da revogação de consentimentos, pelo e-mail ',
    'privacidade@semog.com.br',
    'mailto:privacidade@semog.com.br',
    '.',
  ),
  h2('5. Segurança e retenção'),
  p(
    'Adotamos medidas técnicas e organizacionais para proteger os dados sob nossa responsabilidade e os mantemos apenas pelo tempo necessário às finalidades desta política ou às exigências legais.',
  ),
  h2('6. Contato do encarregado (DPO)'),
  p(
    'Dúvidas sobre esta política podem ser encaminhadas ao nosso encarregado de proteção de dados pelo e-mail acima.',
  ),
]

const privacidadeRichText: Omit<RichTextBlock, 'id' | 'blockName'> = {
  blockType: 'richText',
  content: legalRichText(privacidadeSections),
}

const termosHero: Omit<HeroBlock, 'id' | 'blockName'> = {
  blockType: 'hero',
  headline: 'Termos de Uso',
  subhead: UPDATED_AT,
}

const termosSections: Section[] = [
  p(
    'Estes Termos de Uso regulam a utilização do site da Semog Administradora de Condomínios. Ao navegar por este site, você concorda com as condições abaixo.',
  ),
  h2('1. Finalidade do site'),
  p(
    'Este site tem caráter informativo e comercial: apresenta os serviços da Semog, permite a solicitação de propostas e o acesso a canais de atendimento e autoatendimento.',
  ),
  h2('2. Uso adequado'),
  ul([
    'É vedado utilizar o site para fins ilícitos ou que violem direitos de terceiros;',
    'É vedado tentar acessar áreas restritas, sistemas ou dados sem autorização;',
    'As informações enviadas em formulários devem ser verdadeiras e atualizadas.',
  ]),
  h2('3. Propriedade intelectual'),
  p(
    'Marca, logotipo, textos, imagens e demais conteúdos deste site pertencem à Semog ou a seus licenciantes e não podem ser reproduzidos sem autorização prévia e expressa.',
  ),
  h2('4. Serviços e propostas'),
  p(
    'As informações do site não constituem oferta vinculante. Condições comerciais, incluindo as do Semog Garante, são formalizadas em proposta e contrato específicos para cada condomínio.',
  ),
  h2('5. Responsabilidades'),
  p(
    'A Semog emprega os melhores esforços para manter as informações precisas e o site disponível, mas não se responsabiliza por indisponibilidades temporárias ou por conteúdos de sites de terceiros eventualmente vinculados.',
  ),
  h2('6. Atualizações destes termos'),
  p(
    'Estes termos podem ser atualizados a qualquer momento. A versão vigente estará sempre publicada nesta página.',
  ),
  h2('7. Foro'),
  p(
    'Fica eleito o foro da comarca de Recife/PE para dirimir eventuais controvérsias decorrentes destes termos.',
  ),
]

const termosRichText: Omit<RichTextBlock, 'id' | 'blockName'> = {
  blockType: 'richText',
  content: legalRichText(termosSections),
}

async function upsertLegalPage(
  payload: Awaited<ReturnType<typeof getPayload>>,
  args: { title: string; slug: string; layout: NonNullable<Page['layout']> },
) {
  const existing = await payload.find({
    collection: 'pages',
    where: { slug: { equals: args.slug } },
    limit: 1,
    depth: 0,
  })

  const data = {
    title: args.title,
    slug: args.slug,
    _status: 'published' as const,
    layout: args.layout,
  }

  if (existing.docs[0]) {
    const updated = await payload.update({
      collection: 'pages',
      id: existing.docs[0].id,
      data,
    })
    console.log(`[seed:pages] Página "${args.slug}" atualizada (id=${updated.id}).`)
  } else {
    const created = await payload.create({
      collection: 'pages',
      data,
    })
    console.log(`[seed:pages] Página "${args.slug}" criada (id=${created.id}).`)
  }
}

async function seedPages() {
  const payload = await getPayload({ config })

  await upsertLegalPage(payload, {
    title: 'Política de Privacidade',
    slug: 'privacidade',
    layout: [privacidadeHero, privacidadeRichText],
  })

  await upsertLegalPage(payload, {
    title: 'Termos de Uso',
    slug: 'termos',
    layout: [termosHero, termosRichText],
  })
}

await seedPages()
