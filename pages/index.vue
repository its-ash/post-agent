<script setup lang="ts">
const { posts, nextSlot, loading, generating, refresh, generate } = usePostsStore()

await useAsyncData('home-posts', async () => { await refresh(); return true })

const remaining = ref('')
const overdue = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

function tick() {
  if (!nextSlot.value) { remaining.value = '—'; return }
  const diff = new Date(nextSlot.value).getTime() - Date.now()
  if (diff <= 0) { remaining.value = 'Posting now…'; overdue.value = true; return }
  overdue.value = false
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  const s = Math.floor((diff % 60_000) / 1_000)
  remaining.value = h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`
}

function startTimer() { tick(); if (timer) clearInterval(timer); timer = setInterval(tick, 1000) }
function stopTimer() { if (timer) { clearInterval(timer); timer = null } }

watch(nextSlot, () => { if (nextSlot.value && import.meta.client) startTimer() })
onMounted(() => { if (nextSlot.value) startTimer() })
onUnmounted(stopTimer)

const formatTime = (iso: string) => new Date(iso).toLocaleString(undefined, {
  weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
})

const nextPost = computed(() => posts.value.find(p => p.status === 'scheduled'))
const scheduledCount = computed(() => posts.value.filter(p => p.status === 'scheduled').length)
const postedCount = computed(() => posts.value.filter(p => p.status === 'posted').length)
const langCount = computed(() => new Set(posts.value.map(p => p.language)).size)
const themeCount = computed(() => new Set(posts.value.map(p => p.theme)).size)
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="hero">
      <div class="hero-glow" />
      <div class="hero-content">
        <div class="hero-badge">
          <span class="hero-badge-dot" />
          <span>{{ generating ? 'Generating content…' : 'Agent online' }}</span>
        </div>
        <h1>AI Social Agent for<br><span class="grad">Programming Content</span></h1>
        <p class="sub">PostAgent generates "How to find an item in a list" carousels across
          16+ languages — via local Ollama, with 7 rotating themes for Instagram &amp; Facebook.</p>
        <div class="hero-actions">
          <button class="btn-primary" :disabled="generating" @click="generate">
            {{ generating ? 'Generating…' : 'Generate Now' }}
          </button>
          <button class="btn-ghost" @click="refresh">Refresh</button>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats">
        <div class="stat">
          <div class="stat-val">{{ scheduledCount }}</div>
          <div class="stat-lbl">Scheduled</div>
        </div>
        <div class="stat">
          <div class="stat-val">{{ postedCount }}</div>
          <div class="stat-lbl">Posted</div>
        </div>
        <div class="stat">
          <div class="stat-val">{{ langCount }}</div>
          <div class="stat-lbl">Languages</div>
        </div>
        <div class="stat">
          <div class="stat-val">{{ themeCount }}</div>
          <div class="stat-lbl">Themes</div>
        </div>
      </div>
    </section>

    <!-- Posting next banner -->
    <section v-if="nextPost" class="next-banner" :class="{ overdue }">
      <div class="next-ring">
        <div class="next-ring-inner">
          <div class="next-countdown-label">Next post in</div>
          <ClientOnly>
            <div class="next-countdown">{{ remaining }}</div>
            <template #fallback>
              <div class="next-countdown">—</div>
            </template>
          </ClientOnly>
        </div>
      </div>
      <div class="next-info">
        <div class="next-title">{{ nextPost.title }}</div>
        <div class="next-time">{{ formatTime(nextPost.scheduledAt) }}</div>
        <div class="next-platforms">
          <span class="pill ig">Instagram</span>
          <span class="pill fb">Facebook</span>
        </div>
      </div>
      <NuxtLink :to="`/feed/${nextPost.id}`" class="next-view">View →</NuxtLink>
    </section>

    <!-- Upcoming timeline -->
    <section class="section">
      <div class="section-head">
        <h2>Upcoming Timeline</h2>
        <span class="count">{{ scheduledCount }} scheduled</span>
      </div>

      <div v-if="loading" class="empty">Loading feed…</div>

      <div v-else-if="!posts.length" class="empty">
        No posts yet. Click <strong>Generate Now</strong> to let the agent create content.
      </div>

      <ol v-else class="timeline">
        <li v-for="post in posts.slice(0, 12)" :key="post.id" class="t-item">
          <div class="t-dot" :class="post.status" />
          <div class="t-body">
            <NuxtLink :to="`/feed/${post.id}`" class="t-title">{{ post.title }}</NuxtLink>
            <div class="t-meta">
              <span class="lang">{{ post.language }}</span>
              <span class="theme-badge">{{ post.theme }}</span>
              <span>· {{ formatTime(post.scheduledAt) }}</span>
              <span class="status-tag" :class="post.status">{{ post.status }}</span>
            </div>
            <div v-if="post.images.length" class="t-thumbs">
              <img v-for="img in post.images.slice(0,4)" :key="img" :src="img" alt="slide" />
            </div>
          </div>
        </li>
      </ol>
    </section>
  </div>
</template>

<style scoped>
.hero {
  position: relative; overflow: hidden;
  display: grid; grid-template-columns: 1fr auto; gap: 40px; align-items: center;
  padding: 44px 36px;
  background: linear-gradient(145deg, rgba(15,22,41,.9), rgba(15,22,41,.6));
  backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  border-radius: 24px;
}
.hero-glow {
  position: absolute; top: -60%; right: -10%; width: 500px; height: 500px;
  background: radial-gradient(circle, rgba(16,185,129,.12), transparent 60%);
  pointer-events: none;
}
.hero-content { position: relative; }
.hero-badge {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 6px 14px; background: rgba(16,185,129,.1);
  border: 1px solid rgba(16,185,129,.2); border-radius: 9999px;
  font-size: 12px; font-weight: 600; color: var(--accent);
  margin-bottom: 20px;
}
.hero-badge-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 8px var(--accent); animation: pulse 2s infinite; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
.hero h1 { font-size: 38px; line-height: 1.1; font-weight: 800; letter-spacing: -1px; }
.grad { background: linear-gradient(135deg, var(--accent), var(--accent2)); -webkit-background-clip: text; background-clip: text; color: transparent; }
.sub { color: var(--sub); margin-top: 14px; max-width: 480px; line-height: 1.6; font-size: 14px; }
.hero-actions { margin-top: 26px; display: flex; gap: 10px; }

/* Stats */
.stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; position: relative; }
.stat {
  background: rgba(26,37,64,.5); border: 1px solid var(--border);
  border-radius: 14px; padding: 18px 20px; text-align: center;
  min-width: 90px; transition: .15s;
}
.stat:hover { border-color: var(--accent); background: rgba(26,37,64,.8); }
.stat-val { font-size: 28px; font-weight: 800; color: var(--fg); }
.stat-lbl { font-size: 11px; font-weight: 600; color: var(--sub); text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }

/* Next banner */
.next-banner {
  display: flex; align-items: center; gap: 24px; padding: 24px 28px;
  background: linear-gradient(135deg, rgba(6,78,59,.4), rgba(15,23,42,.6));
  backdrop-filter: blur(10px);
  border: 1px solid rgba(16,185,129,.3); border-radius: 20px;
  transition: .3s;
}
.next-banner.overdue { border-color: rgba(245,158,11,.4); background: linear-gradient(135deg, rgba(120,53,15,.4), rgba(30,27,75,.6)); }
.next-ring {
  width: 110px; height: 110px; border-radius: 50%; flex-shrink: 0;
  background: conic-gradient(var(--accent) 0deg, var(--panel2) 0deg);
  display: flex; align-items: center; justify-content: center;
  border: 2px solid var(--border);
}
.next-ring-inner { text-align: center; }
.next-countdown-label { font-size: 10px; color: var(--sub); text-transform: uppercase; letter-spacing: 1px; }
.next-countdown { font-size: 22px; font-weight: 800; font-variant-numeric: tabular-nums; color: var(--fg); }
.next-info { flex: 1; }
.next-title { font-weight: 700; font-size: 16px; }
.next-time { color: var(--sub); font-size: 13px; margin-top: 4px; }
.next-platforms { margin-top: 10px; display: flex; gap: 8px; }
.pill { font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 20px; }
.pill.ig { background: linear-gradient(135deg, #f09433, #e6683c, #dc2743, #bc1888); color: #fff; }
.pill.fb { background: #1877f2; color: #fff; }
.next-view { color: var(--accent); text-decoration: none; font-weight: 700; font-size: 14px; white-space: nowrap; }

/* Section */
.section { display: flex; flex-direction: column; gap: 16px; }
.section-head { display: flex; align-items: baseline; justify-content: space-between; }
.section-head h2 { font-size: 20px; font-weight: 700; }
.count { color: var(--sub); font-size: 12px; }

.empty { padding: 48px; text-align: center; color: var(--sub); background: var(--panel); border-radius: 16px; border: 1px solid var(--border); }

.timeline { list-style: none; display: flex; flex-direction: column; gap: 12px; }
.t-item {
  display: flex; gap: 16px; padding: 18px 22px;
  background: rgba(15,22,41,.6); backdrop-filter: blur(10px);
  border: 1px solid var(--border); border-radius: 16px;
  transition: .15s;
}
.t-item:hover { border-color: var(--border-light); transform: translateX(2px); }
.t-dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
.t-dot.scheduled { background: var(--accent); box-shadow: 0 0 8px rgba(16,185,129,.4); }
.t-dot.posted { background: #3b82f6; }
.t-dot.draft { background: var(--sub); }
.t-dot.failed { background: #ef4444; }
.t-body { flex: 1; min-width: 0; }
.t-title { font-weight: 700; text-decoration: none; color: var(--fg); font-size: 15px; }
.t-title:hover { color: var(--accent); }
.t-meta { display: flex; align-items: center; gap: 8px; color: var(--sub); font-size: 12px; margin-top: 6px; flex-wrap: wrap; }
.lang { background: var(--panel2); padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 700; color: var(--accent2); }
.theme-badge { background: var(--panel2); padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 700; color: var(--accent3); text-transform: capitalize; }
.status-tag { margin-left: auto; text-transform: uppercase; font-size: 9px; font-weight: 800; letter-spacing: .5px; }
.status-tag.scheduled { color: var(--accent); }
.status-tag.posted { color: #3b82f6; }
.status-tag.draft { color: var(--sub); }
.status-tag.failed { color: #ef4444; }
.t-thumbs { display: flex; gap: 6px; margin-top: 10px; }
.t-thumbs img { width: 52px; height: 52px; border-radius: 8px; object-fit: cover; border: 1px solid var(--border); }

@media (max-width: 760px) {
  .hero { grid-template-columns: 1fr; }
  .stats { grid-template-columns: repeat(4, 1fr); }
  .next-banner { flex-direction: column; align-items: flex-start; }
}
</style>