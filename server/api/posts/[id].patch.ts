import { loadPosts, updatePost } from '~/server/utils/postStore'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing post id' })
  const body = await readBody<Partial<{ status: string }>>(event)

  if (body.status && ['draft', 'posted', 'failed'].includes(body.status)) {
    await updatePost(id, { status: body.status as 'draft' | 'posted' | 'failed' })
  }

  const posts = await loadPosts()
  return { posts }
})