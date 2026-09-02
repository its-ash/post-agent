import { addPost, buildNextSlot, loadPosts, makeId, type PostCard } from '~/server/utils/postStore'
import { generateContent } from '~/server/utils/content'
import { generateCarouselImages } from '~/server/utils/imageGen'
import { pickTheme } from '~/server/utils/themes'

export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig()

  const existingPosts = await loadPosts()
  const usedLangs = existingPosts.map(p => p.language)
  const usedThemes = existingPosts.map(p => p.theme)

  const content = await generateContent(cfg, null, usedLangs)
  const theme = pickTheme(usedThemes)

  const posts = await loadPosts()
  const slot = buildNextSlot(posts, cfg.postIntervalMin)
  const id = makeId()

  let images: string[] = []
  try {
    const imgs = await generateCarouselImages(content, id, theme)
    images = imgs.map(i => i.url)
  } catch (e) {
    console.error('[PostAgent] image generation failed:', e)
  }

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
    createdAt: new Date().toISOString(),
    scheduledAt: slot.toISOString(),
    status: 'scheduled',
    images,
  }

  await addPost(post)
  return { post, nextSlot: slot }
})