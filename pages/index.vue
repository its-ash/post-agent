<script setup lang="ts">
const { posts, loading, generating, refresh, generate } = usePostsStore()

const { data } = await useAsyncData('home-posts', () => refresh())

watch(data, (val) => { if (val) posts.value = val }, { immediate: true })

const formatTime = (iso: string) => new Date(iso).toLocaleString(undefined, {
  weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
})

const postedCount = computed(() => posts.value.filter(p => p.status === 'posted').length)
const langCount = computed(() => new Set(posts.value.map(p => p.language)).size)
const themeCount = computed(() => new Set(posts.value.map(p => p.theme)).size)
</script>

<template>
  <div>
    <section class="action-bar">
      <div class="stats">
        <div class="stat">
          <div class="stat-val">{{ posts.length }}</div>
          <div class="stat-lbl">Posts</div>
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
      <div class="actions">
        <button class="btn-primary" :disabled="generating" @click="generate">
          {{ generating ? 'Generating…' : 'Generate Now' }}
        </button>
        <button class="btn-ghost" @click="refresh">Refresh</button>
      </div>
    </section>

    <section class="section">
      <div class="section-head">
      <h2>All Posts</h2>
      <span class="count">{{ posts.length }} total</span>
      </div>

      <div v-if="loading" class="empty">Loading feed…</div>

      <div v-else-if="!posts.length" class="empty">
        No posts yet. Click <strong>Generate Now</strong> to let the agent create content.
      </div>

      <div v-else class="card-grid">
        <NuxtLink v-for="post in posts" :key="post.id" :to="`/feed/${post.id}`" class="post-card">
          <div v-if="post.images.length" class="post-card-cover">
            <img :src="post.images[0]" :alt="post.title" />
            <div class="post-card-overlay">
              <span class="slide-count">{{ post.images.length }} slides</span>
            </div>
          </div>
          <div class="post-card-body">
            <div class="post-card-top">
              <span class="lang">{{ post.language }}</span>
              <span class="theme-badge">{{ post.theme }}</span>
              <span class="status-tag" :class="post.status">{{ post.status }}</span>
            </div>
            <h3>{{ post.title }}</h3>
            <p class="problem">{{ post.problem }}</p>
            <div class="post-card-foot">
              <span>{{ formatTime(post.createdAt) }}</span>
            </div>
          </div>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.action-bar {
  display: flex; align-items: center; justify-content: space-between; gap: 24px;
  padding: 24px 28px;
  background: linear-gradient(145deg, rgba(15,22,41,.9), rgba(15,22,41,.6));
  backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  border-radius: 20px;
}
.actions { display: flex; gap: 10px; flex-shrink: 0; }

/* Stats */
.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.stat {
  background: rgba(26,37,64,.5); border: 1px solid var(--border);
  border-radius: 14px; padding: 18px 20px; text-align: center;
  min-width: 90px; transition: .15s;
}
.stat:hover { border-color: var(--accent); background: rgba(26,37,64,.8); }
.stat-val { font-size: 28px; font-weight: 800; color: var(--fg); }
.stat-lbl { font-size: 11px; font-weight: 600; color: var(--sub); text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }

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

/* Card grid */
.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 18px; }
.post-card {
  background: rgba(15,22,41,.6); backdrop-filter: blur(10px);
  border: 1px solid var(--border); border-radius: 18px;
  overflow: hidden; text-decoration: none; color: inherit;
  transition: .2s;
}
.post-card:hover { transform: translateY(-3px); border-color: var(--accent); box-shadow: 0 12px 32px rgba(0,0,0,.3); }
.post-card-cover { position: relative; }
.post-card-cover img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; }
.post-card-overlay {
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: 20px 14px 10px;
  background: linear-gradient(transparent, rgba(0,0,0,.7));
}
.post-card-overlay .slide-count {
  font-size: 11px; font-weight: 700; color: #fff;
  background: rgba(0,0,0,.5); padding: 3px 10px; border-radius: 20px;
}
.post-card-body { padding: 16px 18px 18px; }
.post-card-top { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.post-card-body h3 { font-size: 16px; font-weight: 700; line-height: 1.3; }
.post-card-body .problem {
  color: var(--sub); font-size: 13px; line-height: 1.5; margin-top: 8px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.post-card-foot { margin-top: 14px; color: var(--sub); font-size: 12px; }
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
  .action-bar { flex-direction: column; align-items: stretch; }
  .stats { grid-template-columns: repeat(2, 1fr); }
}
</style>