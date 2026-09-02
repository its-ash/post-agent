export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },
  ssr: true,
  nitro: {
    compatibilityDate: '2025-01-01',
  },
  app: {
    head: {
      title: 'PostAgent — Auto Social Scheduler',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Finds programming content, generates social posts via local Ollama, and schedules them.' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      ],
    },
  },
  runtimeConfig: {
    ollamaHost: process.env.OLLAMA_HOST || 'http://localhost:11434',
    ollamaModel: process.env.OLLAMA_MODEL || 'gemma4:31b-cloud',
    contentSeed: process.env.CONTENT_SEED || 'https://api.stackexchange.com/2.3/questions?order=desc&sort=hot&site=stackoverflow&pagesize=10&filter=withbody',
    postIntervalMin: Number(process.env.POST_INTERVAL_MIN || 30),
    metaAccessToken: process.env.META_ACCESS_TOKEN || '',
    metaIgUserId: process.env.META_IG_USER_ID || '',
    public: {
      intervalMin: Number(process.env.POST_INTERVAL_MIN || 30),
    },
  },
})