import { getTheme } from '~/server/utils/themes'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing theme id' })
  const theme = getTheme(id)
  if (!theme) throw createError({ statusCode: 404, statusMessage: 'Theme not found' })
  return { theme }
})