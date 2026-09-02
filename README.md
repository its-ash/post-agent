# PostAgent

An AI social media agent that generates **"How to find an item in a list"** programming carousels across **16+ languages** using a **local Ollama** model, renders **4 themed slides** (1080×1080) with **7 rotating design themes**, and shows you the next scheduled post timeline with a live countdown.

## What it does

1. **Picks a language** — cycles through 16 languages (JS, Python, Rust, Go, TS, Java, C#, C++, PHP, Ruby, Swift, Kotlin, SQL, Dart, Elixir, Scala). Never repeats until all are used.
2. **Picks a theme** — cycles through 7 design themes (Bauhaus, Geometric, Kinetic, Neo-Brutalism, Sketch, Swiss, Terminal). Each theme has its own colors, fonts, layout, and visual language.
3. **Processes with Ollama** — generates a hook, problem statement, code snippet, and "why it works" explanation for the chosen language.
4. **Generates 4 carousel slides** (1080×1080) using the selected theme's visual style:
   - **Slide 1** — The Problem
   - **Slide 2** — The Code (full-bleed dark code editor with syntax highlighting)
   - **Slide 3** — Why It Works
   - **Slide 4** — "Follow Us" with Instagram + Facebook pills
5. **Schedules** posts on a configurable interval and shows a live **"Posting next in…"** countdown on the home page.
6. **Syncs to Meta** — push posts to Instagram/Facebook via the Graph API (or simulate without credentials).

## Prerequisites

- Node.js 24 (see `.nvmrc`)
- [Ollama](https://ollama.ai) running locally — any model works. Default: `gemma4:31b-cloud`.
  Set `OLLAMA_MODEL` to whatever you have pulled (e.g. `llama3.1:8b`, `qwen2.5:7b`).

## Setup

```bash
cp .env.example .env      # edit model / interval if needed
npm install
make run                  # http://localhost:3000
```

Click **Generate Now** on the home page, or set up an external cron to hit:

```
GET /api/cron/generate
```

## Slides

Every post is a 4-slide Instagram/Facebook carousel about finding an item in a list:

| Slide | Content | Design |
|---|---|---|
| 1 | Problem statement + hook | Theme-specific layout with geometric decorations |
| 2 | Code snippet | Full-bleed dark editor, syntax highlighting, line numbers, gutter |
| 3 | Why it works explanation | Theme-specific layout, different accent color |
| 4 | "Follow Us" + platform pills | Theme-specific follow design |

## Themes

7 themes stored in `server/utils/themes.ts`. Each has its own colors, fonts, radius, border width, shadow style, letter spacing, and layout style — not just recolored, but fundamentally different UI:

| Theme | Style | Colors | Fonts | UI Characteristics |
|---|---|---|---|---|
| Bauhaus | `geometric` | Red #D02020, Blue #1040C0, Yellow #F0C020 | Outfit + Cascadia Code | Sharp shapes, 4px borders, hard shadows, ghost number outlines |
| Geometric | `rounded` | Purple #8B5CF6, Pink #F472B6, Amber #FBBF24 | Outfit + Plus Jakarta Sans | 24px radius, pill badges, soft shadows, rounded card containers |
| Kinetic | `minimal-dark` | Lime #DFE104 on black #09090B | Space Grotesk + JetBrains Mono | No borders/decorations, tight letter-spacing, giant type |
| Neo-Brutalism | `brutalist` | Coral #FF6B6B, Yellow #FFD93D, Lavender #C4B5FD | Space Grotesk | 4px borders, double-shadow offset blocks, bold color blocks |
| Sketch | `handdrawn` | Red #ff4d4d, Blue #2d5da1 on paper #fdfbf7 | Patrick Hand + Kalam | Wobbly border-radius, paper dot texture, hand-drawn dividers |
| Swiss | `swiss-grid` | Orange #FF3000 on white | Inter | Huge type with negative tracking, grid lines, minimal |
| Terminal | `terminal` | Green #33ff00 on black #0a0a0a | JetBrains Mono | CLI prompt, scanlines, green glow, `$` prefix |

Themes cycle just like languages — each post gets a different theme until all 7 are used.

View a post's theme config on the detail page (`/feed/:id`) — it shows all colors, fonts, and layout parameters.

## API

| Endpoint | Method | Description |
|---|---|---|
| `/api/posts` | GET | All posts + next scheduled slot |
| `/api/posts/generate` | POST | Generate + schedule one post (picks language + theme) |
| `/api/cron/generate` | GET | Auto-generate (rate-limited, for cron) |
| `/api/posts/:id` | PATCH | Update status / scheduledAt |
| `/api/posts/single/:id` | GET | Single post detail |
| `/api/posts/:id/sync` | POST | Sync post to Instagram/Facebook via Graph API |
| `/api/themes` | GET | List all 7 themes with full config |
| `/api/themes/:id` | GET | Get a single theme's config (colors, fonts, layout) |

## Config (`.env`)

```
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=gemma4:31b-cloud
POST_INTERVAL_MIN=30
# Meta (Instagram/Facebook) sync — optional. Leave empty to simulate.
META_ACCESS_TOKEN=
META_IG_USER_ID=
```

## Architecture

```
server/
  utils/
    content.ts    # Ollama prompt — fixed topic "find item in list", 16 languages
    themes.ts     # 7 theme definitions (colors, fonts, layout, style)
    imageGen.ts   # Per-theme SVG → Resvg → PNG carousel (4 slides)
    postStore.ts  # JSON persistence + scheduling slots
  api/
    posts/        # CRUD + generate + sync
    themes/       # Theme config endpoints
    cron/         # Auto-generation (rate-limited)

pages/
  index.vue       # Home — hero, stats, countdown banner, timeline
  feed/
    index.vue     # Feed — card grid with cover images
    [id].vue      # Detail — carousel, content, theme config panel, sync button

composables/
  usePosts.ts     # Shared reactive post state
  useCountdown.ts # Live countdown timer

layouts/
  default.vue     # Shell — glassmorphism topbar, footer, global styles

public/
  fonts/          # Outfit, Plus Jakarta Sans, Space Grotesk, Inter, JetBrains Mono, Patrick Hand, Kalam, Cascadia Code
  generated/      # PNG carousel images (gitignored, regenerated on demand)
```

## Content Model

- Every post is about **"How to find an item in a list/array"** in a specific language.
- 16 languages cycled: JavaScript, Python, Rust, Go, TypeScript, Java, C#, C++, PHP, Ruby, Swift, Kotlin, SQL, Dart, Elixir, Scala.
- `generateContent()` picks an unused language, sends a fixed-topic prompt to Ollama.
- Ollama returns: hook, problem, code snippet, why it works, hashtags.
- Emojis are stripped from all generated images (they don't render in SVG).

## Meta Sync

- `POST /api/posts/:id/sync` syncs a post to Instagram/Facebook via the Graph API.
- Creates a carousel container for each image, then publishes.
- Set `META_ACCESS_TOKEN` and `META_IG_USER_ID` env vars for real sync.
- Without credentials, sync simulates by marking the post as "posted".
- "Sync to Meta" button on the detail page with status feedback.

## Deploy

```bash
make build     # nuxt generate → docs/
make deploy    # commit + push to main (GitHub Pages)
```