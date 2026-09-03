import { loadPosts, updatePost } from '~/server/utils/postStore'
import { publishToMeta } from '~/server/utils/metaPublish'
import { publishImagesToGithub } from '~/server/utils/githubPublish'

const GITHUB_REPO_OWNER = 'its-ash'
const GITHUB_REPO_NAME = 'post-agent'
const GITHUB_BRANCH = 'main'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing post id' })

  const body = await readBody(event).catch(() => null) || {}
  const scheduledAtRaw = (body as { scheduledAt?: string }).scheduledAt

  const posts = await loadPosts()
  const post = posts.find(p => p.id === id)
  if (!post) throw createError({ statusCode: 404, statusMessage: 'Post not found' })

  const cfg = useRuntimeConfig()

  // Meta's servers must fetch images over the public internet, so push the
  // generated PNGs to GitHub first and use their raw.githubusercontent.com
  // URLs — those are already absolute, so publishToMeta's resolveUrl leaves
  // them untouched.
  let githubImageUrls: string[]
  try {
    githubImageUrls = await publishImagesToGithub(post.images, {
      repoOwner: GITHUB_REPO_OWNER,
      repoName: GITHUB_REPO_NAME,
      branch: GITHUB_BRANCH,
    })
  } catch (e) {
    await updatePost(id, { status: 'failed' })
    const msg = (e as Error).message
    return { success: false, error: `Failed to push images to GitHub: ${msg}`, posts: await loadPosts() }
  }

  const scheduledTime = scheduledAtRaw ? new Date(scheduledAtRaw) : undefined

  const result = await publishToMeta({ ...post, images: githubImageUrls }, {
    metaAccessToken: cfg.metaAccessToken,
    metaIgUserId: cfg.metaIgUserId,
    metaFbPageId: cfg.metaFbPageId,
    metaThreadsUserId: cfg.metaThreadsUserId,
  }, '', scheduledTime)

  if (!result.success) {
    await updatePost(id, { status: 'failed' })
    return { success: false, error: result.error, posts: await loadPosts() }
  }

  const patch: Partial<typeof post> = { status: scheduledTime ? 'scheduled' : 'posted' }
  if (scheduledTime) patch.scheduledAt = scheduledTime.toISOString()
  await updatePost(id, patch)

  return { success: true, posts: await loadPosts() }
})