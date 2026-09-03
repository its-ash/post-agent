import { loadPosts } from '~/server/utils/postStore'

export default defineCachedEventHandler(async () => {
  const posts = await loadPosts()
  return { posts }
}, { maxAge: 60 })