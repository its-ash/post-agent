import { $fetch } from 'ofetch'
import type { PostCard } from './postStore'

export interface MetaResult {
  success: boolean
  error?: string
  igContainerIds?: string[]
  igCarouselId?: string
  threadId?: string
  storyIds?: string[]
}

/**
 * Publish a post to:
 *   1. Instagram feed (carousel)
 *   2. Instagram story (each slide as a story frame)
 *   3. Threads (via Threads API)
 *   4. Facebook Page feed (text + first image link)
 *
 * @param post       The post to publish
 * @param cfg        Runtime config with metaAccessToken, metaIgUserId, metaFbPageId, metaThreadsUserId
 * @param publicBase Absolute base URL for image fetching, e.g. https://example.com
 * @param scheduledTime  If set, uses Instagram's scheduled publish API
 */
export async function publishToMeta(
  post: PostCard,
  cfg: { metaAccessToken: string; metaIgUserId: string; metaFbPageId: string; metaThreadsUserId: string },
  publicBase: string,
  scheduledTime?: Date,
): Promise<MetaResult> {
  const token = cfg.metaAccessToken
  const igUserId = cfg.metaIgUserId
  const fbPageId = cfg.metaFbPageId
  const threadsUserId = cfg.metaThreadsUserId

  if (!token || !igUserId) {
    return { success: false, error: 'META_ACCESS_TOKEN and META_IG_USER_ID are not configured' }
  }

  if (!post.images.length) {
    return { success: false, error: 'Post has no images to publish' }
  }

  const caption = `${post.title}\n\n${post.problem}\n\n${post.why}\n\n${post.tags.map(t => `#${t}`).join(' ')}`
  const base = publicBase.replace(/\/$/, '')

  const resolveUrl = (img: string) => img.startsWith('http') ? img : `${base}${img}`

  try {
    // ── Step 1: Instagram feed carousel ──
    const creationIds: string[] = []
    for (let i = 0; i < post.images.length; i++) {
      const body: Record<string, unknown> = {
        image_url: resolveUrl(post.images[i]),
        caption: i === 0 ? caption : undefined,
        access_token: token,
      }
      if (scheduledTime) body.scheduled_publish_time = Math.floor(scheduledTime.getTime() / 1000)

      const res: any = await $fetch(`https://graph.facebook.com/v21.0/${igUserId}/media`, {
        method: 'POST',
        body,
      })
      if (res?.id) creationIds.push(res.id)
    }

    if (!creationIds.length) {
      return { success: false, error: 'Failed to create any Instagram media containers' }
    }

    const publishBody: Record<string, unknown> = {
      media_type: 'CAROUSEL',
      children: creationIds,
      access_token: token,
    }
    if (scheduledTime) publishBody.scheduled_publish_time = Math.floor(scheduledTime.getTime() / 1000)

    const carouselRes: any = await $fetch(`https://graph.facebook.com/v21.0/${igUserId}/media_publish`, {
      method: 'POST',
      body: publishBody,
    })
    const igCarouselId = carouselRes?.id

    // ── Step 2: Instagram story (each slide as a separate story) ──
    const storyIds: string[] = []
    try {
      for (const img of post.images) {
        const storyContainer: any = await $fetch(`https://graph.facebook.com/v21.0/${igUserId}/media`, {
          method: 'POST',
          body: {
            image_url: resolveUrl(img),
            media_type: 'STORY',
            access_token: token,
          },
        })
        if (storyContainer?.id) {
          const storyPub: any = await $fetch(`https://graph.facebook.com/v21.0/${igUserId}/media_publish`, {
            method: 'POST',
            body: {
              creation_id: storyContainer.id,
              access_token: token,
            },
          })
          if (storyPub?.id) storyIds.push(storyPub.id)
        }
      }
    } catch (storyErr) {
      console.error('[Meta] Instagram story publish failed (non-fatal):', storyErr)
    }

    // ── Step 3: Threads (via Threads API) ──
    let threadId: string | undefined
    if (threadsUserId) {
      try {
        threadId = await publishToThreads(post, threadsUserId, token, resolveUrl, caption)
      } catch (threadsErr) {
        console.error('[Meta] Threads publish failed (non-fatal):', threadsErr)
      }
    }

    // ── Step 4: Facebook Page feed ──
    if (fbPageId) {
      try {
        const fbBody: Record<string, unknown> = {
          message: caption,
          access_token: token,
        }
        // Upload first image as a Facebook photo post
        if (post.images[0]) {
          const photoRes: any = await $fetch(`https://graph.facebook.com/v21.0/${fbPageId}/photos`, {
            method: 'POST',
            body: {
              url: resolveUrl(post.images[0]),
              caption,
              access_token: token,
            },
          })
          if (!photoRes?.id) {
            // Fallback to text-only feed post
            await $fetch(`https://graph.facebook.com/v21.0/${fbPageId}/feed`, {
              method: 'POST',
              body: fbBody,
            })
          }
        } else {
          await $fetch(`https://graph.facebook.com/v21.0/${fbPageId}/feed`, {
            method: 'POST',
            body: fbBody,
          })
        }
      } catch (fbErr) {
        console.error('[Meta] Facebook cross-post failed (non-fatal):', fbErr)
      }
    }

    return { success: true, igContainerIds: creationIds, igCarouselId, threadId, storyIds }
  } catch (e) {
    const msg = (e as any)?._data?.error?.message || (e as Error).message
    console.error('[Meta] publish failed:', msg)
    return { success: false, error: msg }
  }
}

/**
 * Publish a multi-image carousel to Threads via the Threads API.
 * Creates a media container with all images, then publishes.
 *
 * Requires META_THREADS_USER_ID env var.
 */
async function publishToThreads(
  post: PostCard,
  threadsUserId: string,
  token: string,
  resolveUrl: (img: string) => string,
  caption: string,
): Promise<string | undefined> {
  // Create a Threads media container — children for multi-image carousel
  const children: { image_url: string }[] = post.images.slice(0, 10).map(img => ({
    image_url: resolveUrl(img),
  }))

  const containerBody: Record<string, unknown> = {
    media_type: 'TEXT',
    text: caption.slice(0, 500),
    access_token: token,
  }

  // Threads supports image posts — use CAROUSEL if multiple images
  if (children.length > 1) {
    containerBody.media_type = 'CAROUSEL'
    containerBody.children = children
  } else if (children.length === 1) {
    containerBody.media_type = 'IMAGE'
    containerBody.image_url = children[0].image_url
    containerBody.text = caption.slice(0, 500)
    delete (containerBody as any).children
  }

  // Step 1: Create container
  const containerRes: any = await $fetch(`https://graph.threads.net/v1.0/${threadsUserId}/threads`, {
    method: 'POST',
    body: containerBody,
  })

  if (!containerRes?.id) return undefined

  // Step 2: Publish
  const publishRes: any = await $fetch(`https://graph.threads.net/v1.0/${threadsUserId}/threads_publish`, {
    method: 'POST',
    body: {
      creation_id: containerRes.id,
      access_token: token,
    },
  })

  return publishRes?.id
}