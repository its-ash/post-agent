import { getPost } from '~/server/utils/postStore'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  const post = await getPost(id)
  if (!post) throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  return post
})