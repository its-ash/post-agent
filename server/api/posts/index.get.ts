import { loadPosts } from '~/server/utils/postStore'

export default defineEventHandler(async () => {
  const posts = await loadPosts()
  return { posts }
})