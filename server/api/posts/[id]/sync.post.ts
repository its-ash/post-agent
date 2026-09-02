import { loadPosts, updatePost } from '~/server/utils/postStore'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing post id' })

  const posts = await loadPosts()
  const post = posts.find(p => p.id === id)
  if (!post) throw createError({ statusCode: 404, statusMessage: 'Post not found' })

  // In a real deployment, this would call the Instagram Graph API / Facebook Graph API.
  // For now we simulate a successful sync by marking the post as posted.
  // To enable real sync, set META_ACCESS_TOKEN and META_IG_USER_ID env vars.
  const cfg = useRuntimeConfig()
  const metaToken = cfg.metaAccessToken
  const igUserId = cfg.metaIgUserId

  if (metaToken && igUserId && post.images.length) {
    try {
      // Create Instagram media container for each image, then publish as a carousel.
      const creationIds: string[] = []
      for (const img of post.images) {
        const absUrl = `${event.node.req.headers.host ? 'http' : 'http'}://${event.node.req.headers.host || 'localhost:3000'}${img}`
        const res: any = await $fetch(`https://graph.facebook.com/v21.0/${igUserId}/media`, {
          method: 'POST',
          body: { image_url: absUrl, caption: `${post.title}\n\n${post.tags.map((t: string) => `#${t}`).join(' ')}`, access_token: metaToken },
        })
        if (res?.id) creationIds.push(res.id)
      }

      if (creationIds.length) {
        await $fetch(`https://graph.facebook.com/v21.0/${igUserId}/media_publish`, {
          method: 'POST',
          body: { media_type: 'CAROUSEL', children: creationIds, access_token: metaToken },
        })
      }
    } catch (e) {
      console.error('[PostAgent] Meta sync failed:', e)
      await updatePost(id, { status: 'failed' })
      return { success: false, error: (e as Error).message, posts: await loadPosts() }
    }
  }

  await updatePost(id, { status: 'posted' })
  return { success: true, posts: await loadPosts() }
})