/** JSON-LD da página, serializado por nós a partir de dado estático. */
export function JsonLd({ dados }: { dados: Record<string, unknown> | null }) {
  if (!dados) return null
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD serializado por nós, do conteúdo estático
      dangerouslySetInnerHTML={{ __html: JSON.stringify(dados) }}
    />
  )
}
