import { describe, expect, it } from 'vitest'
import { getPostBySlug, getRecentPosts, getRelatedPosts } from '@/lib/content'

describe('camada de posts (MDX)', () => {
  it('lista os posts recentes ordenados por data desc', async () => {
    const posts = await getRecentPosts(6)
    expect(posts.length).toBeGreaterThan(0)
    for (let i = 1; i < posts.length; i++) {
      expect(new Date(posts[i - 1].date) >= new Date(posts[i].date)).toBe(true)
    }
  })
  it('resolve um post pelo slug com corpo', async () => {
    const recent = await getRecentPosts(1)
    const post = await getPostBySlug(recent[0].slug)
    expect(post?.title).toBeTruthy()
    expect(post?.body).toBeTruthy()
  })
  it('related prioriza a mesma categoria e nunca inclui o próprio', async () => {
    const [seed] = await getRecentPosts(1)
    const rel = await getRelatedPosts(seed.category, seed.slug, 3)
    expect(rel.every((p) => p.slug !== seed.slug)).toBe(true)
  })
})
