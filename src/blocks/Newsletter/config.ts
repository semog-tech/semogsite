import type { Block } from 'payload'

/**
 * `.newsletter` fiel a `_reference/blog.html:229-238` + CSS em
 * `_reference/blog.html:83-99` (estilo inline da própria página, portado
 * verbatim pra `theme.css`): faixa `--grad-band` com h2+p+form centralizados.
 * O `<form>` do ref não tem backend — o `onsubmit` só troca o innerHTML por
 * uma mensagem de sucesso (`src/blocks/Newsletter/NewsletterForm.tsx`
 * reproduz isso como estado de um ilha client, sem submissão real).
 */
export const newsletterBlock: Block = {
  slug: 'newsletter',
  interfaceName: 'NewsletterBlock',
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'text', type: 'textarea' },
    { name: 'placeholder', type: 'text', defaultValue: 'Seu melhor e-mail' },
    { name: 'buttonLabel', type: 'text', defaultValue: 'Assinar' },
    {
      name: 'successMessage',
      type: 'text',
      defaultValue: 'Inscrição recebida. Até o próximo e-mail!',
      admin: {
        description:
          'Mensagem exibida no lugar do formulário após o "envio" (client-side, sem backend real — fiel ao `onsubmit` inline de `_reference/blog.html:233`).',
      },
    },
  ],
}
