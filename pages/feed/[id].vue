<script setup lang="ts">
interface ThemeConfig {
  id: string
  name: string
  source: string
  colors: { primary: string; secondary: string; accent: string; bg: string; bgAlt: string; text: string; border: string; codeBg: string }
  fonts: { heading: string; body: string; code: string; headingFile: string; bodyFile: string; codeFile: string }
  radius: number
  borderWidth: number
  shadow: string
  shadowColor: string
  letterSpacing: number
  h1Size: number
  bodySize: number
  style: string
}

const route = useRoute()
const id = route.params.id as string

const post = ref<PostCard | null>(null)
const theme = ref<ThemeConfig | null>(null)
const slide = ref(0)

async function load() {
  const data = await $fetch<PostCard>(`/api/posts/single/${id}`)
  post.value = data
  if (data.theme) {
    try {
      const t = await $fetch<{ theme: ThemeConfig }>(`/api/themes/${data.theme}`)
      theme.value = t.theme
    } catch {}
  }
}
await useAsyncData(`post-${id}`, async () => { await load(); return true })

const formatTime = (iso: string) => new Date(iso).toLocaleString()

const { patchPost } = usePostsStore()
const syncing = ref(false)
const syncMsg = ref('')

async function markPosted() {
  if (!post.value) return
  const data = await $fetch<{ posts: PostCard[] }>(`/api/posts/${id}`, {
    method: 'PATCH', body: { status: 'posted' },
  })
  post.value = data.posts.find(p => p.id === id) || post.value
}

async function syncToMeta() {
  if (!post.value) return
  syncing.value = true
  syncMsg.value = ''
  try {
    const data = await $fetch<{ success: boolean; error?: string; posts: PostCard[] }>(`/api/posts/${id}/sync`, { method: 'POST' })
    post.value = data.posts.find(p => p.id === id) || post.value
    syncMsg.value = data.success ? 'Synced to Meta successfully!' : `Sync failed: ${data.error}`
  } catch (e) {
    syncMsg.value = `Error: ${(e as Error).message}`
  } finally {
    syncing.value = false
  }
}
</script>

<template>
  <div v-if="post" class="detail">
    <NuxtLink to="/feed" class="back">← Back to feed</NuxtLink>

    <div class="detail-grid">
      <!-- Carousel preview -->
      <div class="carousel">
        <div v-if="post.images.length" class="stage">
          <img :src="post.images[slide]" :alt="`slide ${slide+1}`" />
          <div class="dots">
            <button v-for="(_, i) in post.images" :key="i" :class="{ active: i === slide }" @click="slide = i" />
          </div>
        </div>
        <div v-else class="no-img">No images generated</div>
        <div class="platforms">
          <span class="pill ig">Instagram</span>
          <span class="pill fb">Facebook</span>
        </div>
      </div>

      <!-- Content -->
      <div class="info">
        <div class="top-row">
          <span class="lang">{{ post.language }}</span>
          <span class="theme-badge">{{ post.theme }}</span>
          <span class="status-tag" :class="post.status">{{ post.status }}</span>
        </div>
        <h1>{{ post.title }}</h1>
        <div class="sched">📅 {{ formatTime(post.scheduledAt) }}</div>

        <div class="block">
          <h3>Problem</h3>
          <p>{{ post.problem }}</p>
        </div>
        <div class="block">
          <h3>Code</h3>
          <pre class="code-block"><code>{{ post.codeSnippet }}</code></pre>
        </div>
        <div class="block">
          <h3>Why It Works</h3>
          <p>{{ post.why }}</p>
        </div>

        <div class="tags">
          <span v-for="t in post.tags" :key="t" class="tag">#{{ t }}</span>
        </div>

        <!-- Theme config panel -->
        <div v-if="theme" class="theme-panel">
          <div class="theme-panel-head">
            <h3>Theme: <span class="theme-name">{{ theme.name }}</span></h3>
            <a :href="theme.source" target="_blank" class="theme-source">Source ↗</a>
          </div>
          <div class="theme-config">
            <div class="config-group">
              <div class="config-label">Colors</div>
              <div class="color-grid">
                <div v-for="(val, key) in theme.colors" :key="key" class="color-chip">
                  <div class="color-swatch" :style="{ background: val }" />
                  <span class="color-key">{{ key }}</span>
                  <span class="color-val">{{ val }}</span>
                </div>
              </div>
            </div>
            <div class="config-group">
              <div class="config-label">Fonts</div>
              <div class="config-rows">
                <div class="config-row"><span class="ck">Heading</span><span class="cv">{{ theme.fonts.heading }} ({{ theme.fonts.headingFile }})</span></div>
                <div class="config-row"><span class="ck">Body</span><span class="cv">{{ theme.fonts.body }} ({{ theme.fonts.bodyFile }})</span></div>
                <div class="config-row"><span class="ck">Code</span><span class="cv">{{ theme.fonts.code }} ({{ theme.fonts.codeFile }})</span></div>
              </div>
            </div>
            <div class="config-group">
              <div class="config-label">Layout</div>
              <div class="config-rows">
                <div class="config-row"><span class="ck">Style</span><span class="cv">{{ theme.style }}</span></div>
                <div class="config-row"><span class="ck">Radius</span><span class="cv">{{ theme.radius }}px</span></div>
                <div class="config-row"><span class="ck">Border width</span><span class="cv">{{ theme.borderWidth }}px</span></div>
                <div class="config-row"><span class="ck">Shadow</span><span class="cv">{{ theme.shadow }} ({{ theme.shadowColor }})</span></div>
                <div class="config-row"><span class="ck">Letter spacing</span><span class="cv">{{ theme.letterSpacing }}px</span></div>
                <div class="config-row"><span class="ck">H1 size</span><span class="cv">{{ theme.h1Size }}px</span></div>
                <div class="config-row"><span class="ck">Body size</span><span class="cv">{{ theme.bodySize }}px</span></div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="syncMsg" class="sync-msg" :class="{ ok: syncMsg.includes('success'), err: syncMsg.includes('fail') || syncMsg.includes('Error') }">{{ syncMsg }}</div>

        <div class="actions">
          <button class="btn-primary" :disabled="syncing" @click="syncToMeta">
            {{ syncing ? 'Syncing…' : '📤 Sync to Meta' }}
          </button>
          <button class="btn-ghost" @click="markPosted">Mark as Posted</button>
          <button class="btn-ghost" @click="load">Reload</button>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="empty">Post not found.</div>
</template>

<style scoped>
.back { color: var(--sub); text-decoration: none; font-size: 13px; font-weight: 600; }
.back:hover { color: var(--fg); }
.detail-grid { display: grid; grid-template-columns: 400px 1fr; gap: 28px; margin-top: 16px; }
.carousel { position: sticky; top: 20px; align-self: start; }
.stage { position: relative; border-radius: 18px; overflow: hidden; border: 1px solid var(--border); background: #000; box-shadow: 0 8px 32px rgba(0,0,0,.3); }
.stage img { width: 100%; display: block; }
.dots { position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; }
.dots button { width: 8px; height: 8px; border-radius: 50%; border: none; background: rgba(255,255,255,.3); cursor: pointer; transition: .2s; }
.dots button.active { background: #fff; width: 24px; border-radius: 4px; }
.no-img { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; color: var(--sub); background: var(--panel); border-radius: 18px; }
.platforms { margin-top: 14px; display: flex; gap: 8px; }
.pill { font-size: 11px; font-weight: 700; padding: 5px 12px; border-radius: 20px; }
.pill.ig { background: linear-gradient(135deg, #f09433, #dc2743, #bc1888); color: #fff; }
.pill.fb { background: #1877f2; color: #fff; }

.info { display: flex; flex-direction: column; gap: 16px; }
.top-row { display: flex; align-items: center; gap: 10px; }
.lang { font-size: 11px; font-weight: 700; color: var(--accent2); background: var(--panel2); padding: 4px 10px; border-radius: 8px; }
.theme-badge { font-size: 11px; font-weight: 700; color: var(--accent3); background: var(--panel2); padding: 4px 10px; border-radius: 8px; text-transform: capitalize; }
.status-tag { text-transform: uppercase; font-size: 10px; font-weight: 800; margin-left: auto; }
.status-tag.scheduled { color: var(--accent); }
.status-tag.posted { color: #3b82f6; }
.status-tag.draft { color: var(--sub); }
.status-tag.failed { color: #ef4444; }
.info h1 { font-size: 24px; line-height: 1.2; font-weight: 800; }
.sched { color: var(--sub); font-size: 13px; }
.block h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: var(--accent); margin-bottom: 8px; font-weight: 800; }
.block p { color: var(--fg); line-height: 1.6; font-size: 14px; }
.code-block { background: #0d1117; border: 1px solid var(--border); border-radius: 12px; padding: 18px; overflow-x: auto; font-family: 'Cascadia Code', 'Fira Code', monospace; font-size: 13px; line-height: 1.6; color: #e6edf3; white-space: pre-wrap; }
.tags { display: flex; flex-wrap: wrap; gap: 6px; }
.tag { color: var(--accent2); font-size: 12px; background: var(--panel2); padding: 4px 10px; border-radius: 8px; }
.actions { display: flex; gap: 12px; margin-top: 8px; flex-wrap: wrap; }
.sync-msg { font-size: 14px; padding: 10px 14px; border-radius: 10px; font-weight: 600; }
.sync-msg.ok { background: rgba(16,185,129,.15); color: #10b981; }
.sync-msg.err { background: rgba(239,68,68,.15); color: #ef4444; }
.theme-panel { background: rgba(15,22,41,.6); backdrop-filter: blur(10px); border: 1px solid var(--border); border-radius: 14px; padding: 18px; }
.theme-panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.theme-panel-head h3 { font-size: 14px; color: var(--fg); font-weight: 700; }
.theme-name { color: var(--accent3); text-transform: capitalize; }
.theme-source { font-size: 13px; color: var(--accent2); text-decoration: none; }
.theme-source:hover { text-decoration: underline; }
.theme-config { display: flex; flex-direction: column; gap: 18px; }
.config-group { display: flex; flex-direction: column; gap: 8px; }
.config-label { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: var(--sub); }
.color-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
.color-chip { display: flex; align-items: center; gap: 8px; background: var(--panel2); border-radius: 8px; padding: 8px 10px; }
.color-swatch { width: 24px; height: 24px; border-radius: 6px; border: 1px solid var(--border); flex-shrink: 0; }
.color-key { font-size: 11px; font-weight: 700; color: var(--sub); }
.color-val { font-size: 11px; font-family: monospace; color: var(--fg); }
.config-rows { display: flex; flex-direction: column; gap: 4px; }
.config-row { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 1px solid var(--border); }
.config-row:last-child { border-bottom: none; }
.ck { font-size: 12px; font-weight: 600; color: var(--sub); }
.cv { font-size: 12px; font-family: monospace; color: var(--fg); }
.empty { padding: 60px; text-align: center; color: var(--sub); }

@media (max-width: 900px) {
  .detail-grid { grid-template-columns: 1fr; }
  .carousel { position: static; max-width: 420px; }
}
</style>