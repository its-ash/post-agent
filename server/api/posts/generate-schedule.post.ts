import { addPost, loadPosts, makeId, updatePost, type PostCard } from '~/server/utils/postStore'
import { generateContent } from '~/server/utils/content'
import { generateCarouselImages } from '~/server/utils/imageGen'
import { pickTheme } from '~/server/utils/themes'
import { publishToMeta } from '~/server/utils/metaPublish'

/** Generate a post AND schedule it on Meta (Instagram + Facebook) at a future time. */
export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig()
  const body = await readBody<{ scheduledAt?: string }>(event)

  let scheduledAt: Date
  if (body.scheduledAt) {
    scheduledAt = new Date(body.scheduledAt)
    if (Number.isNaN(scheduledAt.getTime())) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid scheduledAt date' })
    }
  } else {
    // Default: 1 hour from now
    scheduledAt = new Date(Date.now() + 60 * 60 * 1000)
  }

  if (scheduledAt.getTime() <= Date.now()) {
    throw createError({ statusCode: 400, statusMessage: 'Scheduled time must be in the future' })
  }

  const existingPosts = await loadPosts()
  const usedLangs = existingPosts.map(p => p.language)
  const usedThemes = existingPosts.map(p => p.theme)

  const content = await generateContent(cfg, null, usedLangs)
  const theme = pickTheme(usedThemes)
  const id = makeId()

  let images: string[] = []
  try {
    const imgs = await generateCarouselImages(content, id, theme)
    images = imgs.map(i => i.url)
  } catch (e) {
    console.error('[Ash by Ash] image generation failed:', e)
  }

  const now = new Date().toISOString()
  const post: PostCard = {
    id,
    title: content.hook,
    problem: content.problem,
    answer: '',
    why: content.why,
    language: content.language,
    codeSnippet: content.codeSnippet,
    theme: theme.id,
    tags: content.hashtags,
    createdAt: now,
    scheduledAt: scheduledAt.toISOString(),
    status: 'draft',
    images,
  }

  await addPost(post)

  // Schedule on Meta
  const proto = event.node.req.headers['x-forwarded-proto'] || 'https'
  const host = event.node.req.headers.host || 'localhost:3000'
  const publicBase = `${proto}://${host}`

  const result = await publishToMeta(post, {
    metaAccessToken: cfg.metaAccessToken,
    metaIgUserId: cfg.metaIgUserId,
    metaFbPageId: cfg.metaFbPageId,
    metaThreadsUserId: cfg.metaThreadsUserId,
  }, publicBase, scheduledAt)

  if (!result.success) {
    await updatePost(id, { status: 'failed' })
    return { post: { ...post, status: 'failed' }, success: false, error: result.error }
  }

  await updatePost(id, { status: 'scheduled', scheduledAt: scheduledAt.toISOString() })
  return { post: { ...post, status: 'scheduled', scheduledAt: scheduledAt.toISOString() }, success: true }
})