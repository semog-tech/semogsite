import type { Block } from 'payload'

/**
 * Bloco de conteúdo livre em rich text (lexical). O editor cuida de
 * heading/lista/link/etc. via as features padrão do `lexicalEditor()`
 * configurado em payload.config.ts. `legal` liga o tratamento `.legal-body`
 * fiel a `_reference/privacidade.html:25-29,72-99` e
 * `_reference/termos.html:25-29,72-96` (CSS inline da própria página,
 * idêntico nas duas): medida de leitura de 760px (`.wrap`), `h2` de seção
 * numerada em 1.4rem (bem menor que o `--text-h2` genérico) e parágrafos/
 * listas em `--text-2`. Variante em vez de bloco `LegalBody` à parte — mesmo
 * padrão de `dark`/`white` em `Faq`/`Pillars` — porque o corpo continua um
 * rich text livre qualquer, só com outra "pele".
 */
export const richTextBlock: Block = {
  slug: 'richText',
  interfaceName: 'RichTextBlock',
  fields: [
    { name: 'content', type: 'richText' },
    {
      name: 'legal',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Tratamento `.legal-body` (medida 760px, `h2` compacto, texto em `--text-2`) usado em `/privacidade` e `/termos`. Sem isso marcado, o bloco renderiza como hoje (`Container` sem seção própria).',
      },
    },
  ],
}
