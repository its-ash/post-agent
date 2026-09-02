---
name: PostAgent
description: Nuxt 3 app — AI social scheduling agent using local Ollama
applyTo: "*"
---

# PostAgent conventions

## Stack
- Nuxt 3 (Vue 3, Nitro server). SSR on.
- Local Ollama for content generation (model configurable via `OLLAMA_MODEL` env).
- Resvg-js for PNG carousel image generation (1080×1080) with Bauhaus design.
- No external DB — posts persisted in `data/posts.json` (gitignored).

## Content Model
- Every post is about "How to find an item in a list/array" in a specific language.
- 16 languages cycled: JS, Python, Rust, Go, TS, Java, C#, C++, PHP, Ruby, Swift, Kotlin, SQL, Dart, Elixir, Scala.
- `generateContent()` picks an unused language, sends a fixed-topic prompt to Ollama.

## Theme System
- 7 themes stored in `server/utils/themes.ts`: Bauhaus, Geometric, Kinetic, Neo-Brutalism, Sketch, Swiss, Terminal.
- Each theme has colors (primary, secondary, accent, bg, text, border, codeBg), fonts (heading, body, code), radius, shadow style.
- `pickTheme()` cycles through unused themes (same as languages).
- All 4 slide functions accept a `Theme` param and use its colors/fonts.
- Theme font files stored in `public/fonts/` (downloaded from Google Fonts).

## Meta Sync
- `POST /api/posts/:id/sync` syncs a post to Instagram/Facebook via Graph API.
- Set `META_ACCESS_TOKEN` and `META_IG_USER_ID` env vars for real sync.
- Without credentials, sync simulates by marking the post as "posted".

## Slide Design (Bauhaus)
- Slide 1: Problem — light bg (#F0F0F0), red accent (#D02020), yellow circle + shapes
- Slide 2: Code — black bg (#0D1117), syntax-highlighted code (keywords red, strings blue, numbers cyan, funcs purple), line numbers, window dots
- Slide 3: Why It Works — light bg, blue accent (#1040C0), triangle + circle shapes
- Slide 4: "Follow Us" — black bg, centered geometric composition (circle+square+triangle), Instagram + Facebook pills
- Palette: Red #D02020, Blue #1040C0, Yellow #F0C020, Ink #121212, BG #F0F0F0
- Fonts: Outfit (Black/ExtraBold) for text, Cascadia Code Bold for code

## Structure
- `server/utils/` — shared server logic (content fetch, Ollama prompt, image gen, post store).
- `server/api/` — REST endpoints under `/api`.
- `pages/` — routes (home `/`, feed `/feed`, detail `/feed/:id`).
- `composables/` — shared reactive state (usePosts, useCountdown).
- `layouts/default.vue` — shell + global styles.

## Rules
- Keep all Ollama calls server-side only (runtimeConfig, never expose host to client).
- Images stored in `public/generated/` (gitignored in practice — regenerate on deploy).
- Use `useAsyncData` for SSR-friendly data loading.
- Post status enum: `draft | scheduled | posted | failed`.
- Scheduling: `buildNextSlot()` spaces posts by `POST_INTERVAL_MIN` minutes.
- Deploy via `nuxt generate` → `docs/` → GitHub Pages (see Makefile).