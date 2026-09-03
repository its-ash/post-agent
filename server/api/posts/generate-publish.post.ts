import { addPost, loadPosts, makeId, type PostCard } from '~/server/utils/postStore'
import { generateContent } from '~/server/utils/content'
import { generateCarouselImages } from '~/server/utils/imageGen'
import { pickTheme } from '~/server/utils/themes'
import { publishToMeta } from '~/server/utils/metaPublish'

/** Generate a post AND immediately publish to Meta (Instagram + Facebook). */
export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig()

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
    scheduledAt: now,
    status: 'draft',
    images,
  }

  await addPost(post)

  // Publish to Meta immediately
  const proto = event.node.req.headers['x-forwarded-proto'] || 'https'
  const host = event.node.req.headers.host || 'localhost:3000'
  const publicBase = `${proto}://${host}`

  const result = await publishToMeta(post, {
    metaAccessToken: cfg.metaAccessToken,
    metaIgUserId: cfg.metaIgUserId,
    metaFbPageId: cfg.metaFbPageId,
    metaThreadsUserId: cfg.metaThreadsUserId,
  }, publicBase)

  if (!result.success) {
    await updatePost(id, { status: 'failed' })
    return { post: { ...post, status: 'failed' }, success: false, error: result.error }
  }

  await updatePost(id, { status: 'posted' })
  return { post: { ...post, status: 'posted' }, success: true }
})