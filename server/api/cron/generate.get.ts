import { addPost, buildNextSlot, loadPosts, makeId, type PostCard } from '~/server/utils/postStore'
import { generateContent } from '~/server/utils/content'
import { generateCarouselImages } from '~/server/utils/imageGen'
import { pickTheme } from '~/server/utils/themes'

let lastRun = 0

export default defineCachedEventHandler(async (event) => {
  const cfg = useRuntimeConfig()
  const now = Date.now()
  const minInterval = cfg.postIntervalMin * 60_000

  if (now - lastRun < minInterval) {
    const posts = await loadPosts()
    const next = buildNextSlot(posts, cfg.postIntervalMin)
    return { skipped: true, reason: 'interval', nextSlot: next, posts }
  }
  lastRun = now

  const posts = await loadPosts()
  const usedLangs = posts.map(p => p.language)
  const usedThemes = posts.map(p => p.theme)
  const content = await generateContent(cfg, null, usedLangs)
  const theme = pickTheme(usedThemes)
  const slot = buildNextSlot(posts, cfg.postIntervalMin)
  const id = makeId()

  let images: string[] = []
  try {
    images = (await generateCarouselImages(content, id, theme)).map(i => i.url)
  } catch (e) {
    console.error('[PostAgent/cron] image gen failed:', e)
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
  const all = await loadPosts()
  return { post, nextSlot: slot, posts: all }
}, { maxAge: 60 })