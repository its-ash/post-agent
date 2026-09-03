<script setup lang="ts">
const { posts, loading, refresh, generate, generating } = usePostsStore()

const { data } = await useAsyncData('feed-posts', () => refresh())

watch(data, (val) => { if (val) posts.value = val }, { immediate: true })

const formatTime = (iso: string) => new Date(iso).toLocaleString(undefined, {
  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
})
</script>

<template>
  <div class="feed-page">
    <div class="feed-head">
      <div>
        <h1>Content Feed</h1>
        <p class="feed-sub">{{ posts.length }} posts · {{ new Set(posts.map(p => p.language)).size }} languages · {{ new Set(posts.map(p => p.theme)).size }} themes</p>
      </div>
      <button class="btn-primary" :disabled="generating" @click="generate">
        {{ generating ? 'Generating…' : 'Generate New' }}
      </button>
    </div>

    <div v-if="loading" class="empty">Loading…</div>
    <div v-else-if="!posts.length" class="empty">No posts yet. Generate one to get started.</div>

    <div v-else class="grid">
      <NuxtLink v-for="post in posts" :key="post.id" :to="`/feed/${post.id}`" class="card">
        <div v-if="post.images.length" class="card-cover">
          <img :src="post.images[0]" :alt="post.title" />
          <div class="card-cover-overlay">
            <span class="slide-count">{{ post.images.length }} slides</span>
          </div>
        </div>
        <div class="card-body">
          <div class="card-top">
            <span class="lang">{{ post.language }}</span>
            <span class="theme-badge">{{ post.theme }}</span>
            <span class="status-tag" :class="post.status">{{ post.status }}</span>
          </div>
          <h3>{{ post.title }}</h3>
          <p class="problem">{{ post.problem }}</p>
          <div class="card-foot">
            <span>{{ formatTime(post.createdAt) }}</span>
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.feed-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
.feed-head h1 { font-size: 26px; font-weight: 800; }
.feed-sub { color: var(--sub); font-size: 13px; margin-top: 4px; }

.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 18px; }

.card {
  background: rgba(15,22,41,.6); backdrop-filter: blur(10px);
  border: 1px solid var(--border); border-radius: 18px;
  overflow: hidden; text-decoration: none; color: inherit;
  transition: .2s;
}
.card:hover { transform: translateY(-3px); border-color: var(--accent); box-shadow: 0 12px 32px rgba(0,0,0,.3); }

.card-cover { position: relative; }
.card-cover img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; }
.card-cover-overlay {
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: 20px 14px 10px;
  background: linear-gradient(transparent, rgba(0,0,0,.7));
}
.slide-count {
  font-size: 11px; font-weight: 700; color: #fff;
  background: rgba(0,0,0,.5); padding: 3px 10px; border-radius: 20px;
}

.card-body { padding: 16px 18px 18px; }
.card-top { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.lang { font-size: 10px; font-weight: 700; color: var(--accent2); background: var(--panel2); padding: 3px 8px; border-radius: 6px; }
.theme-badge { font-size: 10px; font-weight: 700; color: var(--accent3); background: var(--panel2); padding: 3px 8px; border-radius: 6px; text-transform: capitalize; }
.status-tag { margin-left: auto; text-transform: uppercase; font-size: 9px; font-weight: 800; }
.status-tag.scheduled { color: var(--accent); }
.status-tag.posted { color: #3b82f6; }
.status-tag.draft { color: var(--sub); }
.status-tag.failed { color: #ef4444; }
.card-body h3 { font-size: 15px; line-height: 1.3; font-weight: 700; }
.problem { color: var(--sub); font-size: 12px; margin-top: 8px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.card-foot { color: var(--sub); font-size: 11px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); }

.empty { padding: 60px; text-align: center; color: var(--sub); background: var(--panel); border-radius: 16px; border: 1px solid var(--border); }
</style>