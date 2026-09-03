import { ref } from 'vue'

export interface PostCard {
  id: string
  title: string
  problem: string
  answer: string
  why: string
  language: string
  codeSnippet: string
  theme: string
  tags: string[]
  createdAt: string
  scheduledAt: string
  status: 'draft' | 'scheduled' | 'posted' | 'failed'
  images: string[]
}

const posts = ref<PostCard[]>([])
const loading = ref(false)
const generating = ref(false)
const publishing = ref(false)
const scheduling = ref(false)

async function refresh(): Promise<PostCard[]> {
  loading.value = true
  try {
    const data = await $fetch<{ posts: PostCard[] }>('/api/posts')
    posts.value = data.posts
    return data.posts
  } finally {
    loading.value = false
  }
}

async function generate() {
  generating.value = true
  try {
    const res = await $fetch<{ post: PostCard }>('/api/posts/generate', { method: 'POST' })
    posts.value = [res.post, ...posts.value]
  } finally {
    generating.value = false
  }
}

async function generateAndPublish() {
  publishing.value = true
  try {
    const res = await $fetch<{ post: PostCard; success: boolean; error?: string }>('/api/posts/generate-publish', { method: 'POST' })
    posts.value = [res.post, ...posts.value]
    return res
  } finally {
    publishing.value = false
  }
}

async function generateAndSchedule(scheduledAt: string) {
  scheduling.value = true
  try {
    const res = await $fetch<{ post: PostCard; success: boolean; error?: string }>('/api/posts/generate-schedule', {
      method: 'POST',
      body: { scheduledAt },
    })
    posts.value = [res.post, ...posts.value]
    return res
  } finally {
    scheduling.value = false
  }
}

async function patchPost(id: string, body: Partial<PostCard>) {
  const data = await $fetch<{ posts: PostCard[] }>(`/api/posts/${id}`, { method: 'PATCH', body })
  posts.value = data.posts
}

export function usePostsStore() {
  return { posts, loading, generating, refresh, generate, patchPost }
}