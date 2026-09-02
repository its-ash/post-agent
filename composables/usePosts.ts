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
const nextSlot = ref<string>('')
const loading = ref(false)
const generating = ref(false)

async function refresh() {
  loading.value = true
  try {
    const data = await $fetch<{ posts: PostCard[]; nextSlot: string }>('/api/posts')
    posts.value = data.posts
    nextSlot.value = data.nextSlot
  } finally {
    loading.value = false
  }
}

async function generate() {
  generating.value = true
  try {
    const res = await $fetch<{ post: PostCard; nextSlot: string }>('/api/posts/generate', { method: 'POST' })
    posts.value = [res.post, ...posts.value]
    nextSlot.value = res.nextSlot.toISOString ? res.nextSlot.toISOString() : String(res.nextSlot)
  } finally {
    generating.value = false
  }
}

async function patchPost(id: string, body: Partial<PostCard>) {
  const data = await $fetch<{ posts: PostCard[] }>(`/api/posts/${id}`, { method: 'PATCH', body })
  posts.value = data.posts
}

export function usePostsStore() {
  return { posts, nextSlot, loading, generating, refresh, generate, patchPost }
}