import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

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

const DATA_DIR = join(process.cwd(), 'data')
const DATA_FILE = join(DATA_DIR, 'posts.json')

async function ensureStore(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
  try {
    await readFile(DATA_FILE, 'utf-8')
  } catch {
    await writeFile(DATA_FILE, '[]', 'utf-8')
  }
}

export async function loadPosts(): Promise<PostCard[]> {
  await ensureStore()
  const raw = await readFile(DATA_FILE, 'utf-8')
  return JSON.parse(raw) as PostCard[]
}

export async function savePosts(posts: PostCard[]): Promise<void> {
  await ensureStore()
  await writeFile(DATA_FILE, JSON.stringify(posts, null, 2), 'utf-8')
}

export async function addPost(post: PostCard): Promise<PostCard[]> {
  const posts = await loadPosts()
  posts.unshift(post)
  await savePosts(posts)
  return posts
}

export async function updatePost(id: string, patch: Partial<PostCard>): Promise<PostCard[]> {
  const posts = await loadPosts()
  const idx = posts.findIndex(p => p.id === id)
  if (idx >= 0) {
    posts[idx] = { ...posts[idx], ...patch }
    await savePosts(posts)
  }
  return posts
}

export async function getPost(id: string): Promise<PostCard | undefined> {
  const posts = await loadPosts()
  return posts.find(p => p.id === id)
}

export function buildNextSlot(posts: PostCard[], intervalMin: number): Date {
  const now = new Date()
  const base = new Date(now)
  const lastScheduled = posts
    .filter(p => p.status === 'scheduled' || p.status === 'posted')
    .map(p => new Date(p.scheduledAt))
    .sort((a, b) => b.getTime() - a.getTime())[0]
  if (lastScheduled && lastScheduled.getTime() > now.getTime()) {
    return new Date(lastScheduled.getTime() + intervalMin * 60_000)
  }
  base.setMinutes(base.getMinutes() + intervalMin, 0, 0)
  return base
}

export function makeId(): string {
  return `post_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export { DATA_DIR, DATA_FILE }