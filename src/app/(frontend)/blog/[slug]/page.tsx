import { RichText } from '@payloadcms/richtext-lexical/react'
import { notFound } from 'next/navigation'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { getPostBySlug } from '@/lib/payload'

export const revalidate = 3600

/**
 * Rota estática `/blog/[slug]`, mais específica que o catch-all
 * `[[...slug]]` (que serve `/blog` a partir de uma `page` com slug "blog" +
 * bloco `blogList`). Renderiza só título + `content` (lexical) do post —
 * sem hero image por ora (upload S3 fica para uma task futura).
 */
export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  return (
    <Section>
      <Container>
        <h1>{post.title}</h1>
        {post.content && <RichText data={post.content} />}
      </Container>
    </Section>
  )
}
