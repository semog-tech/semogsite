/**
 * Shape mínimo de imagem, com só os campos que os componentes de bloco leem
 * (levantados na Task 1). Substitui o `Media` gerado pelo Payload — no modelo
 * estático, a imagem é referenciada por URL (a URL do storage do Supabase,
 * mantido). `id` é opcional e aceita string/number para não amarrar a origem.
 */
export type Media = {
  id?: number | string
  url?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
}
