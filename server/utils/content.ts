import type { RuntimeConfig } from '@nuxt/schema'
import { $fetch } from 'ofetch'

export interface RawQuestion {
  id: number
  title: string
  body: string
  tags: string[]
}

const PROGRAMMING_TAGS = [
  'javascript', 'python', 'typescript', 'rust', 'go', 'java',
  'csharp', 'cpp', 'php', 'ruby', 'swift', 'kotlin', 'sql', 'react',
  'vue', 'node.js', 'css', 'html', 'docker', 'git',
]

export async function fetchTrendingQuestions(cfg: RuntimeConfig): Promise<RawQuestion[]> {
  // No longer needed — content is generated entirely by Ollama with a fixed topic.
  return []
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function stripHtml(html: string): string {
  return html
    .replace(/<pre[\s\S]*?<\/pre>/g, ' ')
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#>*_~\-]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim()
    .slice(0, 1500)
}

export interface StructuredContent {
  problem: string
  answer: string
  why: string
  language: string
  hook: string
  codeSnippet: string
  hashtags: string[]
}

/** Fetch the first available model from the running Ollama instance. */
async function pickOllamaModel(cfg: RuntimeConfig): Promise<string> {
  try {
    const res = await $fetch<{ models?: { name: string }[] }>(
      `${cfg.ollamaHost}/api/tags`,
      { method: 'GET', timeout: 10_000 },
    )
    const first = res.models?.[0]?.name
    if (first) return first
  } catch (e) {
    console.error('[PostAgent] failed to list Ollama models, falling back to configured model:', e)
  }
  return cfg.ollamaModel
}

// Languages to cycle through for "find item in list" posts.
const LANGUAGES = [
  { name: 'JavaScript', promptName: 'JavaScript (ES2020+)' },
  { name: 'Python', promptName: 'Python 3' },
  { name: 'Rust', promptName: 'Rust' },
  { name: 'Go', promptName: 'Go' },
  { name: 'TypeScript', promptName: 'TypeScript' },
  { name: 'Java', promptName: 'Java 17+' },
  { name: 'C#', promptName: 'C#' },
  { name: 'C++', promptName: 'C++ (STL)' },
  { name: 'PHP', promptName: 'PHP 8' },
  { name: 'Ruby', promptName: 'Ruby 3' },
  { name: 'Swift', promptName: 'Swift 5' },
  { name: 'Kotlin', promptName: 'Kotlin' },
  { name: 'SQL', promptName: 'SQL' },
  { name: 'Dart', promptName: 'Dart' },
  { name: 'Elixir', promptName: 'Elixir' },
  { name: 'Scala', promptName: 'Scala' },
]

function pickLanguage(usedLangs: string[]): { name: string; promptName: string } {
  const available = LANGUAGES.filter(l => !usedLangs.includes(l.name))
  const pool = available.length ? available : LANGUAGES
  return pool[Math.floor(Math.random() * pool.length)]
}

const TOPIC_STYLES = [
  'tricky edge case',
  'tricky edge case',
  'tricky edge case',
  'clever one-liner',
  'common pitfall',
  'performance gotcha',
  'tricky edge case',
] as const

function pickTopicStyle(): string {
  return TOPIC_STYLES[Math.floor(Math.random() * TOPIC_STYLES.length)]
}

export async function generateContent(
  cfg: RuntimeConfig,
  _question: RawQuestion | null,
  usedLangs: string[] = [],
): Promise<StructuredContent> {
  const lang = pickLanguage(usedLangs)
  const model = await pickOllamaModel(cfg)
  const style = pickTopicStyle()

  const prompt = `You are a social media content writer for programming educators.
The topic is ALWAYS: "How to find an item in a list/array" in ${lang.promptName}.
This post's angle: ${style}.

${style === 'clever one-liner' ? 'Show a clever, idiomatic one-liner that finds an item in a list/array.' : 'Cover the tricky parts, edge cases, and common pitfalls — empty lists, null/undefined, nested structures, type coercion, duplicate items, or performance gotchas.'}

Make it genuinely useful for developers who think they already know this.

Produce engaging Instagram/Facebook carousel content (4 slides) for this topic.

Respond ONLY as strict JSON with this shape:
{
  "hook": "A scroll-stopping one-liner for slide 1 (under 50 chars, hint at the ${style}. Do NOT mention the language name).",
  "problem": "A short punchy statement of the problem for slide 1 — the tricky edge case or pitfall (1-2 sentences, under 180 chars).",
  "codeSnippet": "A complete ${lang.promptName} code snippet (5-12 lines) demonstrating the ${style} for finding an item in a list/array. Show the edge case or one-liner clearly. Use clear variable names. Include a comment or two. Keep lines under 50 chars. Use \\n for line breaks.",
  "why": "Explanation for slide 3 of WHY this ${style} matters — the underlying concept and what catches people out (2-3 sentences, under 250 chars).",
  "hashtags": ["5-8 relevant hashtags without the # symbol, related to ${lang.name}, ${style}, and programming"]
}`

  const res = await $fetch<{ response?: string; message?: { content?: string } }>(
    `${cfg.ollamaHost}/api/generate`,
    {
      method: 'POST',
      body: {
        model,
        prompt,
        stream: false,
        format: 'json',
        options: { temperature: 0.6, num_predict: 900 },
      },
      timeout: 120_000,
    },
  )

  const text = res.response || res.message?.content || ''
  let parsed: StructuredContent
  try {
    parsed = JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    parsed = JSON.parse(match ? match[0] : '{}')
  }

  return {
    problem: parsed.problem || `A tricky edge case when finding an item in a list in ${lang.name}.`,
    answer: '',
    why: parsed.why || `The edge case catches developers because ${lang.name} handles lookups in a way that's easy to get wrong.`,
    language: lang.name,
    hook: parsed.hook || `${style} — find items in ${lang.name}`,
    codeSnippet: parsed.codeSnippet || `// ${style} in ${lang.name}\nconst found = items.includes(target);\nconsole.log(found);`,
    hashtags: parsed.hashtags?.slice(0, 8) || [lang.name.toLowerCase(), 'coding', 'programming', 'edgecases', 'learntocode'],
  }
}