import { loadPosts, updatePost } from '~/server/utils/postStore'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing post id' })
  const body = await readBody<Partial<{ status: string; scheduledAt: string }>>(event)

  if (body.scheduledAt) {
    const d = new Date(body.scheduledAt)
    if (Number.isNaN(d.getTime())) throw createError({ statusCode: 400, statusMessage: 'Invalid scheduledAt' })
    await updatePost(id, { scheduledAt: d.toISOString() })
  }
  if (body.status && ['draft', 'scheduled', 'posted', 'failed'].includes(body.status)) {
    await updatePost(id, { status: body.status as 'draft' | 'scheduled' | 'posted' | 'failed' })
  }

  const posts = await loadPosts()
  return { posts }
})