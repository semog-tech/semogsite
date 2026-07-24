/**
 * Builder mínimo de AST lexical pras páginas legais (`privacidade`/`termos`) —
 * port 1:1 de `src/seed/pages.ts` (funções `textNode`/`linkNode`/
 * `paragraphNode`/`headingNode`/`listNode`/`legalRichText`), só sem o
 * `payload`/`config` que o seed carregava pra rodar via `payload run`. É o
 * mesmo shape que `@payloadcms/richtext-lexical/react` consome hoje (ver
 * `RichTextBlock` em `src/types/blocks.ts`), então tipamos com o tipo real do
 * bloco em vez de `any` — sem perder a validação de shape do seed original.
 */
import type { RichTextBlock } from '@/types/blocks'

export type InlinePart = string | { text: string; href: string }
export type Section =
  | { kind: 'p'; parts: InlinePart[] }
  | { kind: 'h2'; text: string }
  | { kind: 'ul'; items: string[] }

export function p(text: string): Section {
  return { kind: 'p', parts: [text] }
}

export function pWithLink(before: string, linkText: string, href: string, after: string): Section {
  return { kind: 'p', parts: [before, { text: linkText, href }, after] }
}

export function h2(text: string): Section {
  return { kind: 'h2', text }
}

export function ul(items: string[]): Section {
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

export function legalRichText(sections: Section[]): NonNullable<RichTextBlock['content']> {
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
