import { loadPosts, buildNextSlot } from '~/server/utils/postStore'

export default defineEventHandler(async () => {
  const cfg = useRuntimeConfig()
  const posts = await loadPosts()
  const nextSlot = buildNextSlot(posts, cfg.postIntervalMin)
  return { posts, nextSlot }
})