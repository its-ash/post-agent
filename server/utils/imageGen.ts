import { Resvg } from '@resvg/resvg-js'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { StructuredContent } from './content'
import type { Theme } from './themes'

const OUT_DIR = join(process.cwd(), 'public', 'generated')
const FONT_DIR = join(process.cwd(), 'public', 'fonts')

export interface GeneratedImage {
  filename: string
  path: string
  url: string
}

const W = 1080
const H = 1080

const CODE_KEYWORD = '#FF7B72'
const CODE_STRING = '#A5D6FF'
const CODE_FUNC = '#D2A8FF'
const CODE_COMMENT = '#8B949E'
const CODE_NUMBER = '#79C0FF'
const CODE_VAR = '#FFA657'

function escapeXml(s: string): string {
  return stripEmoji(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function stripEmoji(s: string): string {
  return s
    // Remove emoji and symbols (covers most emoji ranges + variation selectors + ZWJ sequences)
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\uFE0F\u200D\u{E0000}-\u{E007F}]/gu, '')
    // Clean up leftover spaces where emoji was removed
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function wrapText(text: string, maxChars: number): string[] {
  const cleaned = stripEmoji(text)
  const words = cleaned.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxChars) {
      if (line) lines.push(line)
      line = w
    } else {
      line = (line + ' ' + w).trim()
    }
  }
  if (line) lines.push(line)
  return lines.slice(0, 6)
}

function highlightCode(code: string, language: string, fgColor: string): { text: string; color: string }[][] {
  const keywords: Record<string, string[]> = {
    JavaScript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'includes', 'find', 'filter', 'indexOf', 'new', 'class', 'import', 'export', 'from', 'async', 'await'],
    TypeScript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'includes', 'find', 'filter', 'indexOf', 'new', 'class', 'import', 'export', 'from', 'async', 'await', 'type', 'interface', 'number', 'string', 'boolean'],
    Python: ['def', 'return', 'if', 'else', 'elif', 'for', 'while', 'in', 'not', 'and', 'or', 'import', 'from', 'class', 'lambda', 'with', 'as', 'try', 'except', 'True', 'False', 'None', 'self'],
    Rust: ['fn', 'let', 'mut', 'return', 'if', 'else', 'for', 'while', 'loop', 'match', 'struct', 'impl', 'use', 'pub', 'const', 'as', 'in', 'self', 'Some', 'None', 'Ok', 'Err'],
    Go: ['func', 'return', 'if', 'else', 'for', 'range', 'package', 'import', 'var', 'const', 'type', 'struct', 'interface', 'map', 'make', 'append', 'nil', 'true', 'false'],
    Java: ['public', 'private', 'protected', 'class', 'static', 'void', 'return', 'if', 'else', 'for', 'while', 'new', 'import', 'package', 'extends', 'implements', 'this', 'null', 'true', 'false', 'int', 'String', 'boolean', 'List', 'ArrayList'],
    'C#': ['public', 'private', 'protected', 'class', 'static', 'void', 'return', 'if', 'else', 'for', 'while', 'new', 'using', 'namespace', 'var', 'int', 'string', 'bool', 'true', 'false', 'null', 'List'],
    'C++': ['int', 'char', 'bool', 'void', 'return', 'if', 'else', 'for', 'while', 'class', 'struct', 'public', 'private', 'protected', 'new', 'delete', 'include', 'std', 'auto', 'const', 'true', 'false', 'nullptr', 'vector', 'string'],
    PHP: ['function', 'return', 'if', 'else', 'for', 'while', 'foreach', 'array', 'new', 'class', 'public', 'private', 'protected', 'static', 'use', 'namespace', 'echo', 'print', 'null', 'true', 'false'],
    Ruby: ['def', 'end', 'return', 'if', 'else', 'for', 'while', 'do', 'class', 'module', 'require', 'include', 'nil', 'true', 'false', 'self', 'lambda', 'yield', 'puts'],
    Swift: ['func', 'let', 'var', 'return', 'if', 'else', 'for', 'while', 'guard', 'class', 'struct', 'enum', 'protocol', 'import', 'nil', 'true', 'false', 'self'],
    Kotlin: ['fun', 'val', 'var', 'return', 'if', 'else', 'for', 'while', 'class', 'object', 'import', 'package', 'null', 'true', 'false', 'when', 'is', 'as'],
    SQL: ['SELECT', 'FROM', 'WHERE', 'IN', 'NOT', 'AND', 'OR', 'EXISTS', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'AS', 'COUNT', 'DISTINCT', 'NULL'],
    Dart: ['void', 'var', 'final', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'null', 'true', 'false', 'this', 'new', 'const'],
    Elixir: ['def', 'defp', 'do', 'end', 'if', 'else', 'for', 'case', 'when', 'use', 'import', 'nil', 'true', 'false', 'fn'],
    Scala: ['def', 'val', 'var', 'return', 'if', 'else', 'for', 'while', 'match', 'case', 'class', 'object', 'trait', 'import', 'package', 'null', 'true', 'false', 'this'],
  }
  const kwSet = keywords[language] || keywords.JavaScript || []
  const lines = code.split('\n')
  return lines.map(line => {
    const commentMatch = line.match(/^(\s*)(\/\/.*|#.*|--.*|\/\*.*\*\/)/)
    if (commentMatch) return [{ text: line, color: CODE_COMMENT }]
    const tokens: { text: string; color: string }[] = []
    let remaining = line
    while (remaining.length > 0) {
      const strMatch = remaining.match(/^"([^"\\]*(?:\\.[^"\\]*)*)"|^'([^'\\]*(?:\\.[^'\\]*)*)'/)
      if (strMatch) { tokens.push({ text: strMatch[0], color: CODE_STRING }); remaining = remaining.slice(strMatch[0].length); continue }
      const numMatch = remaining.match(/^\d+\.?\d*/)
      if (numMatch) { tokens.push({ text: numMatch[0], color: CODE_NUMBER }); remaining = remaining.slice(numMatch[0].length); continue }
      const wordMatch = remaining.match(/^[A-Za-z_]\w*/)
      if (wordMatch) {
        const w = wordMatch[0]
        if (kwSet.includes(w) || kwSet.includes(w.toLowerCase())) tokens.push({ text: w, color: CODE_KEYWORD })
        else if (w[0] === w[0].toUpperCase() && w[0] >= 'A' && w[0] <= 'Z') tokens.push({ text: w, color: CODE_FUNC })
        else if (remaining.slice(w.length).startsWith('(')) tokens.push({ text: w, color: CODE_FUNC })
        else tokens.push({ text: w, color: fgColor })
        remaining = remaining.slice(w.length)
        continue
      }
      tokens.push({ text: remaining[0], color: CODE_VAR })
      remaining = remaining.slice(1)
    }
    return tokens
  })
}

function isDarkBg(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 < 128
}

function shade(hex: string, percent: number): string {
  const r = Math.max(0, Math.min(255, parseInt(hex.slice(1, 3), 16) + Math.round(255 * percent / 100)))
  const g = Math.max(0, Math.min(255, parseInt(hex.slice(3, 5), 16) + Math.round(255 * percent / 100)))
  const b = Math.max(0, Math.min(255, parseInt(hex.slice(5, 7), 16) + Math.round(255 * percent / 100)))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

// Helper: build shadow rect for brutalist/hard themes
function shadowRect(x: number, y: number, w: number, h: number, offset: number, color: string, r = 0): string {
  return `<rect x="${x + offset}" y="${y + offset}" width="${w}" height="${h}" fill="${color}" rx="${r}"/>`
}

// ═══════════════════════════════════════════════════════
// PER-THEME SLIDE GENERATORS
// Each theme style has its own distinct visual language
// ═══════════════════════════════════════════════════════

// ─── GEOMETRIC (Bauhaus) — sharp shapes, hard shadows ───
function geometricSlide1(content: StructuredContent, t: Theme): string {
  const c = t.colors, dark = isDarkBg(c.bg)
  const titleLines = wrapText(content.hook, 32)
  const titleSize = titleLines.length === 1 ? 68 : titleLines.length === 2 ? 56 : 46
  const titleLH = Math.round(titleSize * 1.1), titleY = 380
  const bodyLines = wrapText(content.problem, 40)
  const bodySize = bodyLines.length <= 3 ? 34 : 30, bodyLH = Math.round(bodySize * 1.35)
  const bodyY = titleY + titleLines.length * titleLH + 55
  const labelW = Math.max(content.language.length * 16 + 50, 220)
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${c.bg}"/>
  <rect x="24" y="24" width="${W-48}" height="${H-48}" fill="none" stroke="${c.border}" stroke-width="5"/>
  <circle cx="1000" cy="120" r="200" fill="${c.accent}" stroke="${c.border}" stroke-width="8"/>
  <rect x="910" y="380" width="90" height="90" fill="${c.primary}" stroke="${c.border}" stroke-width="6" transform="rotate(45 955 425)"/>
  <circle cx="120" cy="900" r="55" fill="${c.secondary}" stroke="${c.border}" stroke-width="6"/>
  <rect x="70" y="80" width="${labelW}" height="56" fill="${c.primary}" stroke="${c.border}" stroke-width="4"/>
  <text x="${70+labelW/2}" y="118" font-family="${t.fonts.heading}" font-size="26" font-weight="900" fill="${dark?c.bg:c.bg}" text-anchor="middle" letter-spacing="3">${escapeXml(content.language.toUpperCase())}</text>
  <text x="68" y="270" font-family="${t.fonts.heading}" font-size="200" font-weight="900" fill="none" stroke="${c.border}" stroke-width="3" opacity="0.10">01</text>
  <text x="70" y="270" font-family="${t.fonts.heading}" font-size="110" font-weight="900" fill="${c.primary}" stroke="${c.border}" stroke-width="2">01</text>
  <rect x="195" y="220" width="90" height="44" fill="${c.text}"/>
  <text x="240" y="252" font-family="${t.fonts.heading}" font-size="22" font-weight="900" fill="${dark?c.primary:c.bg}" text-anchor="middle">/ 04</text>
  <text x="330" y="252" font-family="${t.fonts.heading}" font-size="22" font-weight="900" fill="${c.text}" letter-spacing="2">THE PROBLEM</text>
  <rect x="70" y="${titleY-40}" width="300" height="6" fill="${c.primary}"/>
  <rect x="380" y="${titleY-40}" width="${W-380-70}" height="6" fill="${dark?c.primary:c.border}"/>
  ${titleLines.map((l,i)=>`<text x="70" y="${titleY+i*titleLH}" font-family="${t.fonts.heading}" font-size="${titleSize}" font-weight="900" fill="${c.text}">${escapeXml(l)}</text>`).join('\n  ')}
  ${bodyLines.map((l,i)=>`<text x="70" y="${bodyY+i*bodyLH}" font-family="${t.fonts.body}" font-size="${bodySize}" font-weight="600" fill="${c.text}" opacity="0.85">${escapeXml(l)}</text>`).join('\n  ')}
  <rect x="24" y="${H-110}" width="${W-48}" height="86" fill="${c.text}"/>
  <rect x="24" y="${H-110}" width="${W-48}" height="8" fill="${c.primary}"/>
  <text x="70" y="${H-50}" font-family="${t.fonts.heading}" font-size="28" font-weight="900" fill="${dark?c.primary:c.bg}">POSTAGENT</text>
  <text x="${W-220}" y="${H-50}" font-family="${t.fonts.heading}" font-size="26" font-weight="900" fill="${c.accent}">SWIPE →</text>
</svg>`
}

// ─── ROUNDED (Geometric theme) — pill badges, rounded cards, soft shadows ───
function roundedSlide1(content: StructuredContent, t: Theme): string {
  const c = t.colors, dark = isDarkBg(c.bg)
  const titleLines = wrapText(content.hook, 30)
  const titleSize = titleLines.length === 1 ? 64 : titleLines.length === 2 ? 52 : 44
  const titleLH = Math.round(titleSize * 1.1), titleY = 380
  const bodyLines = wrapText(content.problem, 42)
  const bodySize = bodyLines.length <= 3 ? 34 : 30, bodyLH = Math.round(bodySize * 1.35)
  const bodyY = titleY + titleLines.length * titleLH + 50
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${c.bg}"/>
  <!-- Soft shadow card -->
  ${shadowRect(80, 80, W-160, H-200, 12, c.shadowColor, t.radius)}
  <rect x="80" y="80" width="${W-160}" height="${H-200}" fill="${c.bgAlt}" stroke="${c.border}" stroke-width="2" rx="${t.radius}"/>
  <!-- Pill badge -->
  <rect x="120" y="120" width="${content.language.length*16+60}" height="48" fill="${c.primary}" rx="9999"/>
  <text x="${120+(content.language.length*16+60)/2}" y="152" font-family="${t.fonts.heading}" font-size="22" font-weight="800" fill="#fff" text-anchor="middle">${escapeXml(content.language.toUpperCase())}</text>
  <!-- Slide number — circle -->
  <circle cx="160" cy="280" r="60" fill="${c.accent}" stroke="${c.border}" stroke-width="3"/>
  <text x="160" y="295" font-family="${t.fonts.heading}" font-size="48" font-weight="900" fill="${c.text}" text-anchor="middle">01</text>
  <text x="240" y="290" font-family="${t.fonts.body}" font-size="24" font-weight="600" fill="${c.text}" opacity="0.5">/ 04 — THE PROBLEM</text>
  <!-- Title -->
  ${titleLines.map((l,i)=>`<text x="120" y="${titleY+i*titleLH}" font-family="${t.fonts.heading}" font-size="${titleSize}" font-weight="800" fill="${c.text}">${escapeXml(l)}</text>`).join('\n  ')}
  <!-- Body -->
  ${bodyLines.map((l,i)=>`<text x="120" y="${bodyY+i*bodyLH}" font-family="${t.fonts.body}" font-size="${bodySize}" font-weight="600" fill="${c.text}" opacity="0.7">${escapeXml(l)}</text>`).join('\n  ')}
  <!-- Bottom bar inside card -->
  <rect x="120" y="${H-210}" width="${W-240}" height="2" fill="${c.border}" opacity="0.2"/>
  <text x="120" y="${H-170}" font-family="${t.fonts.heading}" font-size="24" font-weight="800" fill="${c.text}">POSTAGENT</text>
  <text x="${W-280}" y="${H-170}" font-family="${t.fonts.heading}" font-size="22" font-weight="700" fill="${c.primary}">SWIPE →</text>
  <!-- Decorative dots -->
  <circle cx="${W-140}" cy="140" r="20" fill="${c.secondary}" opacity="0.8"/>
  <circle cx="${W-140}" cy="140" r="10" fill="${c.accent}"/>
</svg>`
}

// ─── MINIMAL-DARK (Kinetic) — tight tracking, dark, no decoration ───
function minimalDarkSlide1(content: StructuredContent, t: Theme): string {
  const c = t.colors
  const titleLines = wrapText(content.hook, 28)
  const titleSize = titleLines.length === 1 ? 80 : titleLines.length === 2 ? 64 : 52
  const titleLH = Math.round(titleSize * 1.0), titleY = 420
  const bodyLines = wrapText(content.problem, 44)
  const bodySize = 28, bodyLH = Math.round(bodySize * 1.4)
  const bodyY = titleY + titleLines.length * titleLH + 40
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${c.bg}"/>
  <!-- Minimal top bar -->
  <rect x="0" y="0" width="${W}" height="8" fill="${c.primary}"/>
  <!-- Tiny label -->
  <text x="60" y="100" font-family="${t.fonts.heading}" font-size="18" font-weight="500" fill="${c.text}" opacity="0.4" letter-spacing="4">${escapeXml(content.language.toUpperCase())} / 01 — THE PROBLEM</text>
  <rect x="60" y="130" width="60" height="3" fill="${c.primary}"/>
  <!-- Giant title — tight tracking -->
  ${titleLines.map((l,i)=>`<text x="60" y="${titleY+i*titleLH}" font-family="${t.fonts.heading}" font-size="${titleSize}" font-weight="700" fill="${c.text}" letter-spacing="${t.letterSpacing}">${escapeXml(l)}</text>`).join('\n  ')}
  <!-- Body -->
  ${bodyLines.map((l,i)=>`<text x="60" y="${bodyY+i*bodyLH}" font-family="${t.fonts.body}" font-size="${bodySize}" font-weight="400" fill="${c.text}" opacity="0.5">${escapeXml(l)}</text>`).join('\n  ')}
  <!-- Minimal bottom -->
  <rect x="60" y="${H-80}" width="${W-120}" height="1" fill="${c.border}"/>
  <text x="60" y="${H-40}" font-family="${t.fonts.heading}" font-size="20" font-weight="500" fill="${c.primary}">POSTAGENT</text>
  <text x="${W-200}" y="${H-40}" font-family="${t.fonts.heading}" font-size="20" font-weight="500" fill="${c.text}" opacity="0.3">SWIPE →</text>
</svg>`
}

// ─── BRUTALIST (Neo-Brutalism) — thick borders, huge offsets, bold blocks ───
function brutalistSlide1(content: StructuredContent, t: Theme): string {
  const c = t.colors
  const titleLines = wrapText(content.hook, 30)
  const titleSize = titleLines.length === 1 ? 72 : titleLines.length === 2 ? 58 : 48
  const titleLH = Math.round(titleSize * 1.05), titleY = 420
  const bodyLines = wrapText(content.problem, 38)
  const bodySize = 32, bodyLH = Math.round(bodySize * 1.3)
  const bodyY = titleY + titleLines.length * titleLH + 50
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${c.bg}"/>
  <!-- Big shadow block for badge -->
  <rect x="74" y="74" width="${content.language.length*18+60}" height="60" fill="${c.border}"/>
  <rect x="60" y="60" width="${content.language.length*18+60}" height="60" fill="${c.secondary}" stroke="${c.border}" stroke-width="4"/>
  <text x="${60+(content.language.length*18+60)/2}" y="102" font-family="${t.fonts.heading}" font-size="28" font-weight="900" fill="${c.text}" text-anchor="middle">${escapeXml(content.language.toUpperCase())}</text>
  <!-- Giant 01 with shadow -->
  <rect x="64" y="184" width="200" height="160" fill="${c.border}"/>
  <rect x="60" y="180" width="200" height="160" fill="${c.primary}" stroke="${c.border}" stroke-width="4"/>
  <text x="160" y="300" font-family="${t.fonts.heading}" font-size="100" font-weight="900" fill="${c.bg}" text-anchor="middle">01</text>
  <rect x="280" y="210" width="100" height="50" fill="${c.text}" stroke="${c.border}" stroke-width="4"/>
  <text x="330" y="246" font-family="${t.fonts.heading}" font-size="24" font-weight="900" fill="${c.bg}" text-anchor="middle">/ 04</text>
  <!-- Title with shadow -->
  ${titleLines.map((l,i)=>`<text x="64" y="${titleY+i*titleLH}" font-family="${t.fonts.heading}" font-size="${titleSize}" font-weight="900" fill="${c.border}">${escapeXml(l)}</text><text x="60" y="${titleY+i*titleLH}" font-family="${t.fonts.heading}" font-size="${titleSize}" font-weight="900" fill="${c.text}">${escapeXml(l)}</text>`).join('\n  ')}
  <!-- Body -->
  ${bodyLines.map((l,i)=>`<text x="60" y="${bodyY+i*bodyLH}" font-family="${t.fonts.heading}" font-size="${bodySize}" font-weight="700" fill="${c.text}">${escapeXml(l)}</text>`).join('\n  ')}
  <!-- Bottom bar with shadow -->
  <rect x="28" y="${H-92}" width="${W-48}" height="70" fill="${c.border}"/>
  <rect x="24" y="${H-96}" width="${W-48}" height="70" fill="${c.text}" stroke="${c.border}" stroke-width="4"/>
  <text x="60" y="${H-44}" font-family="${t.fonts.heading}" font-size="28" font-weight="900" fill="${c.secondary}">POSTAGENT</text>
  <text x="${W-240}" y="${H-44}" font-family="${t.fonts.heading}" font-size="26" font-weight="900" fill="${c.primary}">SWIPE →</text>
</svg>`
}

// ─── HANDDRAWN (Sketch) — wobbly, handwritten, dashed strokes ───
function handdrawnSlide1(content: StructuredContent, t: Theme): string {
  const c = t.colors
  const titleLines = wrapText(content.hook, 30)
  const titleSize = titleLines.length === 1 ? 60 : 50
  const titleLH = Math.round(titleSize * 1.2), titleY = 360
  const bodyLines = wrapText(content.problem, 40)
  const bodySize = 32, bodyLH = Math.round(bodySize * 1.35)
  const bodyY = titleY + titleLines.length * titleLH + 50
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${c.bg}"/>
  <!-- Paper texture dots -->
  ${Array.from({length: 20 }, (_, i) => {
    const x = 50 + (i % 5) * 200, y = 50 + Math.floor(i / 5) * 200
    return `<circle cx="${x}" cy="${y}" r="1.5" fill="${c.border}" opacity="0.08"/>`
  }).join('\n  ')}
  <!-- Wobbly badge -->
  <rect x="70" y="80" width="${content.language.length*18+60}" height="56" fill="${c.primary}" stroke="${c.border}" stroke-width="3" rx="255px 15px 225px 15px / 15px 225px 15px 255px"/>
  <text x="${70+(content.language.length*18+60)/2}" y="120" font-family="${t.fonts.body}" font-size="26" font-weight="700" fill="${c.bg}" text-anchor="middle">${escapeXml(content.language.toUpperCase())}</text>
  <!-- Hand-drawn 01 -->
  <text x="60" y="280" font-family="${t.fonts.heading}" font-size="140" font-weight="700" fill="none" stroke="${c.primary}" stroke-width="3" stroke-dasharray="0">01</text>
  <text x="62" y="282" font-family="${t.fonts.heading}" font-size="140" font-weight="700" fill="${c.primary}" opacity="0.15">01</text>
  <text x="260" y="260" font-family="${t.fonts.heading}" font-size="36" font-weight="700" fill="${c.text}">/ 04</text>
  <text x="260" y="295" font-family="${t.fonts.body}" font-size="22" fill="${c.text}" opacity="0.5">~ the problem</text>
  <!-- Wobbly divider -->
  <path d="M 70 ${titleY-40} Q 200 ${titleY-50} 300 ${titleY-40} T 500 ${titleY-40} T 700 ${titleY-35} T ${W-70} ${titleY-40}" fill="none" stroke="${c.primary}" stroke-width="4"/>
  <!-- Title (handwritten) -->
  ${titleLines.map((l,i)=>`<text x="70" y="${titleY+i*titleLH}" font-family="${t.fonts.heading}" font-size="${titleSize}" font-weight="700" fill="${c.text}">${escapeXml(l)}</text>`).join('\n  ')}
  <!-- Body (handwritten) -->
  ${bodyLines.map((l,i)=>`<text x="70" y="${bodyY+i*bodyLH}" font-family="${t.fonts.body}" font-size="${bodySize}" fill="${c.text}" opacity="0.8">${escapeXml(l)}</text>`).join('\n  ')}
  <!-- Wobbly bottom bar -->
  <rect x="40" y="${H-100}" width="${W-80}" height="70" fill="${c.text}" rx="15px 225px 15px 255px / 225px 15px 255px 15px"/>
  <text x="80" y="${H-50}" font-family="${t.fonts.heading}" font-size="26" font-weight="700" fill="${c.bg}">POSTAGENT</text>
  <text x="${W-240}" y="${H-50}" font-family="${t.fonts.heading}" font-size="24" font-weight="700" fill="${c.primary}">SWIPE →</text>
  <!-- Doodle arrows -->
  <path d="M 950 200 Q 980 180 1000 220 Q 1020 260 990 280" fill="none" stroke="${c.accent}" stroke-width="3" stroke-dasharray="5 3"/>
  <path d="M 80 850 q 20 -10 40 5 q 20 15 40 -5" fill="none" stroke="${c.secondary}" stroke-width="3" stroke-dasharray="5 3"/>
</svg>`
}

// ─── SWISS-GRID (Swiss) — huge type, negative tracking, grid lines, minimal ───
function swissGridSlide1(content: StructuredContent, t: Theme): string {
  const c = t.colors
  const titleLines = wrapText(content.hook, 24)
  const titleSize = titleLines.length === 1 ? 88 : titleLines.length === 2 ? 72 : 56
  const titleLH = Math.round(titleSize * 0.95), titleY = 420
  const bodyLines = wrapText(content.problem, 46)
  const bodySize = 28, bodyLH = Math.round(bodySize * 1.35)
  const bodyY = titleY + titleLines.length * titleLH + 40
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${c.bg}"/>
  <!-- Grid lines -->
  <line x1="60" y1="0" x2="60" y2="${H}" stroke="${c.text}" stroke-width="1" opacity="0.05"/>
  <line x1="${W-60}" y1="0" x2="${W-60}" y2="${H}" stroke="${c.text}" stroke-width="1" opacity="0.05"/>
  <line x1="0" y1="${H-120}" x2="${W}" y2="${H-120}" stroke="${c.text}" stroke-width="1" opacity="0.05"/>
  <!-- Top: language label — small, left -->
  <text x="60" y="100" font-family="${t.fonts.heading}" font-size="20" font-weight="900" fill="${c.text}" letter-spacing="2">${escapeXml(content.language.toUpperCase())}</text>
  <!-- 01 in corner — Swiss style -->
  <text x="${W-60}" y="140" font-family="${t.fonts.heading}" font-size="100" font-weight="900" fill="${c.primary}" text-anchor="end" letter-spacing="-4">01</text>
  <text x="${W-60}" y="160" font-family="${t.fonts.heading}" font-size="18" font-weight="400" fill="${c.text}" text-anchor="end" opacity="0.4">/ 04 THE PROBLEM</text>
  <!-- Thick red accent block -->
  <rect x="60" y="200" width="120" height="8" fill="${c.primary}"/>
  <!-- Huge title — negative letter spacing -->
  ${titleLines.map((l,i)=>`<text x="60" y="${titleY+i*titleLH}" font-family="${t.fonts.heading}" font-size="${titleSize}" font-weight="900" fill="${c.text}" letter-spacing="${t.letterSpacing}">${escapeXml(l)}</text>`).join('\n  ')}
  <!-- Body -->
  ${bodyLines.map((l,i)=>`<text x="60" y="${bodyY+i*bodyLH}" font-family="${t.fonts.body}" font-size="${bodySize}" font-weight="400" fill="${c.text}" opacity="0.6">${escapeXml(l)}</text>`).join('\n  ')}
  <!-- Bottom bar — just a line -->
  <rect x="60" y="${H-60}" width="${W-120}" height="2" fill="${c.text}"/>
  <text x="60" y="${H-25}" font-family="${t.fonts.heading}" font-size="22" font-weight="900" fill="${c.text}">POSTAGENT</text>
  <text x="${W-60}" y="${H-25}" font-family="${t.fonts.heading}" font-size="22" font-weight="900" fill="${c.primary}" text-anchor="end">SWIPE →</text>
</svg>`
}

// ─── TERMINAL — CLI prompt, scanlines, green-on-black, glow ───
function terminalSlide1(content: StructuredContent, t: Theme): string {
  const c = t.colors
  const titleLines = wrapText(content.hook, 36)
  const titleSize = titleLines.length === 1 ? 48 : titleLines.length === 2 ? 40 : 34
  const titleLH = Math.round(titleSize * 1.2), titleY = 360
  const bodyLines = wrapText(content.problem, 44)
  const bodySize = 26, bodyLH = Math.round(bodySize * 1.35)
  const bodyY = titleY + titleLines.length * titleLH + 40
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${c.bg}"/>
  <!-- Scanlines -->
  ${Array.from({length: 40 }, (_, i) => `<rect x="0" y="${i*27}" width="${W}" height="13" fill="${c.bgAlt}" opacity="0.08"/>`).join('\n  ')}
  <!-- Top bar -->
  <rect x="0" y="0" width="${W}" height="70" fill="${c.bgAlt}" opacity="0.3"/>
  <text x="60" y="48" font-family="${t.fonts.heading}" font-size="24" font-weight="700" fill="${c.primary}">root@postagent:~# ./show --slide 01</text>
  <text x="${W-80}" y="48" font-family="${t.fonts.heading}" font-size="20" fill="${c.secondary}">[01/04]</text>
  <!-- CLI prompt -->
  <text x="60" y="160" font-family="${t.fonts.heading}" font-size="28" font-weight="700" fill="${c.secondary}">$</text>
  <text x="100" y="160" font-family="${t.fonts.heading}" font-size="28" font-weight="700" fill="${c.primary}">cat ${escapeXml(content.language.toLowerCase())}-find-item.md</text>
  <!-- Divider -->
  <rect x="60" y="200" width="${W-120}" height="1" fill="${c.border}"/>
  <!-- Label -->
  <text x="60" y="260" font-family="${t.fonts.heading}" font-size="22" font-weight="700" fill="${c.primary}" letter-spacing="${t.letterSpacing}" opacity="0.6">// THE PROBLEM</text>
  <text x="60" y="290" font-family="${t.fonts.heading}" font-size="18" fill="${c.text}" opacity="0.4">────────────────────────────</text>
  <!-- Title with glow -->
  ${titleLines.map((l,i)=>`<text x="60" y="${titleY+i*titleLH}" font-family="${t.fonts.heading}" font-size="${titleSize}" font-weight="700" fill="${c.primary}" letter-spacing="${t.letterSpacing}" style="filter:drop-shadow(0 0 8px ${c.primary})">${escapeXml(l)}</text>`).join('\n  ')}
  <!-- Body -->
  ${bodyLines.map((l,i)=>`<text x="60" y="${bodyY+i*bodyLH}" font-family="${t.fonts.body}" font-size="${bodySize}" fill="${c.text}" opacity="0.7">${escapeXml(l)}</text>`).join('\n  ')}
  <!-- Bottom bar -->
  <rect x="0" y="${H-80}" width="${W}" height="80" fill="${c.bgAlt}" opacity="0.3"/>
  <rect x="0" y="${H-80}" width="${W}" height="1" fill="${c.primary}" opacity="0.5"/>
  <text x="60" y="${H-30}" font-family="${t.fonts.heading}" font-size="22" font-weight="700" fill="${c.primary}">POSTAGENT</text>
  <text x="${W-60}" y="${H-30}" font-family="${t.fonts.heading}" font-size="22" font-weight="700" fill="${c.secondary}" text-anchor="end">SWIPE →</text>
</svg>`
}

// ═══════════════════════════════════════════════════════
// CODE SLIDE (slide 2) — always dark editor, but header matches theme
// ═══════════════════════════════════════════════════════
function slide2Code(content: StructuredContent, t: Theme): string {
  const c = t.colors
  const codeLines = content.codeSnippet.split('\n').slice(0, 16)
  const highlighted = highlightCode(content.codeSnippet, content.language, '#E6EDF3').slice(0, 16)
  const fontSize = codeLines.length <= 8 ? 36 : codeLines.length <= 11 ? 32 : codeLines.length <= 14 ? 28 : 24
  const lineHeight = Math.round(fontSize * 1.5)
  const codeYStart = 140
  const codeX = 100
  const editorBg = isDarkBg(c.codeBg) ? c.codeBg : '#0D1117'
  const topBarBg = shade(editorBg, 10)
  const gutterBg = shade(editorBg, -5)
  const dividerColor = shade(editorBg, 20)
  const codeFg = '#E6EDF3'
  const codeSpans = highlighted.map((tokens, lineIdx) => {
    let xPos = codeX
    return tokens.map(tok => {
      const escaped = escapeXml(tok.text)
      const span = `<text x="${xPos}" y="${codeYStart + lineIdx * lineHeight}" font-family="${t.fonts.code}" font-size="${fontSize}" font-weight="700" fill="${tok.color}">${escaped}</text>`
      xPos += tok.text.length * fontSize * 0.62
      return span
    }).join('\n  ')
  }).join('\n  ')

  // Theme-specific top bar style
  const headerStyle = t.style
  let topBar = ''
  if (headerStyle === 'terminal') {
    topBar = `
  <rect x="0" y="0" width="${W}" height="100" fill="${topBarBg}"/>
  <text x="40" y="60" font-family="${t.fonts.heading}" font-size="22" font-weight="700" fill="${c.primary}">root@postagent:~# vim ${escapeXml(content.language.toLowerCase())}.find</text>
  <text x="${W-40}" y="60" font-family="${t.fonts.heading}" font-size="18" fill="${c.secondary}" text-anchor="end">[02/04]</text>`
  } else if (headerStyle === 'brutalist') {
    topBar = `
  <rect x="0" y="0" width="${W}" height="100" fill="${topBarBg}"/>
  <rect x="40" y="30" width="60" height="50" fill="${c.primary}" stroke="${c.primary}" stroke-width="4"/>
  <text x="70" y="66" font-family="${t.fonts.heading}" font-size="28" font-weight="900" fill="${isDarkBg(c.primary)?'#fff':c.bg}" text-anchor="middle">02</text>
  <rect x="110" y="30" width="70" height="50" fill="${c.text}"/>
  <text x="145" y="66" font-family="${t.fonts.heading}" font-size="22" font-weight="900" fill="${isDarkBg(c.text)?c.primary:c.bg}" text-anchor="middle">/04</text>
  <text x="195" y="66" font-family="${t.fonts.heading}" font-size="22" font-weight="900" fill="${c.accent}" letter-spacing="3">THE CODE</text>`
  } else if (headerStyle === 'rounded') {
    topBar = `
  <rect x="0" y="0" width="${W}" height="100" fill="${topBarBg}"/>
  <rect x="40" y="28" width="60" height="48" fill="${c.primary}" rx="9999"/>
  <text x="70" y="62" font-family="${t.fonts.heading}" font-size="28" font-weight="800" fill="#fff" text-anchor="middle">02</text>
  <text x="120" y="62" font-family="${t.fonts.heading}" font-size="22" font-weight="700" fill="${codeFg}" opacity="0.5">/04 THE CODE</text>`
  } else if (headerStyle === 'minimal-dark') {
    topBar = `
  <rect x="0" y="0" width="${W}" height="100" fill="${topBarBg}"/>
  <text x="40" y="60" font-family="${t.fonts.heading}" font-size="16" font-weight="500" fill="${c.primary}" opacity="0.6" letter-spacing="4">${escapeXml(content.language.toUpperCase())} / 02 — THE CODE</text>
  <rect x="40" y="76" width="50" height="3" fill="${c.primary}"/>`
  } else if (headerStyle === 'swiss-grid') {
    topBar = `
  <rect x="0" y="0" width="${W}" height="100" fill="${topBarBg}"/>
  <text x="40" y="55" font-family="${t.fonts.heading}" font-size="18" font-weight="900" fill="${c.primary}" letter-spacing="2">${escapeXml(content.language.toUpperCase())}</text>
  <text x="${W-40}" y="60" font-family="${t.fonts.heading}" font-size="48" font-weight="900" fill="${c.primary}" text-anchor="end" letter-spacing="-3">02</text>`
  } else if (headerStyle === 'handdrawn') {
    topBar = `
  <rect x="0" y="0" width="${W}" height="100" fill="${topBarBg}"/>
  <rect x="40" y="28" width="60" height="48" fill="${c.primary}" stroke="${c.accent}" stroke-width="3" rx="255px 15px 225px 15px / 15px 225px 15px 255px"/>
  <text x="70" y="62" font-family="${t.fonts.heading}" font-size="24" font-weight="700" fill="${c.bg}" text-anchor="middle">02</text>
  <text x="120" y="62" font-family="${t.fonts.heading}" font-size="28" font-weight="700" fill="${c.accent}">/04</text>
  <text x="185" y="62" font-family="${t.fonts.body}" font-size="20" fill="${c.accent}" opacity="0.6">~ the code</text>`
  } else {
    topBar = `
  <rect x="0" y="0" width="${W}" height="100" fill="${topBarBg}"/>
  <rect x="40" y="28" width="60" height="50" fill="${c.primary}" stroke="${c.primary}" stroke-width="4"/>
  <text x="70" y="64" font-family="${t.fonts.heading}" font-size="28" font-weight="900" fill="${isDarkBg(c.primary)?'#fff':c.bg}" text-anchor="middle">02</text>
  <rect x="110" y="28" width="70" height="50" fill="${c.text}"/>
  <text x="145" y="64" font-family="${t.fonts.heading}" font-size="22" font-weight="900" fill="${isDarkBg(c.text)?c.primary:c.bg}" text-anchor="middle">/04</text>
  <text x="195" y="64" font-family="${t.fonts.heading}" font-size="22" font-weight="900" fill="${c.accent}" letter-spacing="3">THE CODE</text>`
  }

  // Window dots for all themes except terminal/swiss/minimal
  const showDots = !['terminal', 'swiss-grid', 'minimal-dark'].includes(headerStyle)
  const dots = showDots ? `
  <circle cx="${W-120}" cy="50" r="9" fill="${c.primary}"/>
  <circle cx="${W-90}" cy="50" r="9" fill="${c.accent}"/>
  <circle cx="${W-60}" cy="50" r="9" fill="${c.secondary}"/>` : ''

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${editorBg}"/>
  ${topBar}
  <rect x="0" y="96" width="${W}" height="4" fill="${c.primary}"/>
  ${dots}
  <!-- Gutter (compact) -->
  <rect x="0" y="100" width="70" height="${H-100-50}" fill="${gutterBg}"/>
  <rect x="70" y="100" width="2" height="${H-100-50}" fill="${dividerColor}"/>
  ${codeLines.map((_,i)=>{const ln=String(i+1).padStart(2,'0');return `<text x="55" y="${codeYStart+i*lineHeight}" font-family="${t.fonts.code}" font-size="${fontSize}" font-weight="600" fill="${CODE_COMMENT}" opacity="0.5" text-anchor="end">${ln}</text>`}).join('\n  ')}
  ${codeSpans}
  <!-- Bottom (compact) -->
  <rect x="0" y="${H-50}" width="${W}" height="50" fill="${topBarBg}"/>
  <rect x="0" y="${H-50}" width="${W}" height="3" fill="${c.primary}"/>
  <text x="40" y="${H-18}" font-family="${t.fonts.heading}" font-size="20" font-weight="900" fill="${codeFg}">POSTAGENT</text>
  <text x="${W-180}" y="${H-18}" font-family="${t.fonts.heading}" font-size="18" font-weight="900" fill="${c.accent}">SWIPE →</text>
</svg>`
}

// ═══════════════════════════════════════════════════════
// SLIDE 3 (Why) and SLIDE 4 (Follow Us) — dispatch by style
// ═══════════════════════════════════════════════════════
const slide1Fns: Record<string, (c: StructuredContent, t: Theme) => string> = {
  geometric: geometricSlide1,
  rounded: roundedSlide1,
  'minimal-dark': minimalDarkSlide1,
  brutalist: brutalistSlide1,
  handdrawn: handdrawnSlide1,
  'swiss-grid': swissGridSlide1,
  terminal: terminalSlide1,
}

// Slide 3 reuses slide 1's layout with different content/label
function generateSlide3(content: StructuredContent, t: Theme): string {
  const modified: StructuredContent = {
    ...content,
    hook: content.why.split('.')[0] || content.why.slice(0, 60),
    problem: content.why,
  }
  const fn = slide1Fns[t.style] || geometricSlide1
  // Generate base SVG but we need to change the label and number
  const raw = fn(modified, t)
  // Patch: change 01→03, THE PROBLEM→WHY IT WORKS, / 04 stays
  return raw
    .replace('>01<', '>03<')
    .replace('THE PROBLEM', 'WHY IT WORKS')
    .replace('the problem', 'why it works')
    .replace('--slide 01', '--slide 03')
    .replace('[01/04]', '[03/04]')
}

// Slide 4: Follow Us — each theme has its own follow design
function generateSlide4(t: Theme): string {
  const c = t.colors, dark = isDarkBg(c.bg)
  const bgFill = dark ? c.bg : c.text
  const textOnBg = dark ? c.primary : c.bg
  const accentOnBg = dark ? c.secondary : c.accent

  if (t.style === 'terminal') {
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${c.bg}"/>
  ${Array.from({length:40},(_,i)=>`<rect x="0" y="${i*27}" width="${W}" height="13" fill="${c.bgAlt}" opacity="0.08"/>`).join('\n  ')}
  <text x="${W/2}" y="400" font-family="${t.fonts.heading}" font-size="28" fill="${c.secondary}" text-anchor="middle" opacity="0.5">$ echo "Follow us for more"</text>
  <text x="${W/2}" y="520" font-family="${t.fonts.heading}" font-size="100" font-weight="700" fill="${c.primary}" text-anchor="middle" letter-spacing="2" style="filter:drop-shadow(0 0 12px ${c.primary})">FOLLOW US</text>
  <rect x="${W/2-250}" y="560" width="500" height="3" fill="${c.primary}" opacity="0.4"/>
  <text x="${W/2}" y="640" font-family="${t.fonts.heading}" font-size="40" font-weight="700" fill="${c.secondary}" text-anchor="middle">@POSTAGENT</text>
  <text x="${W/2}" y="760" font-family="${t.fonts.heading}" font-size="28" fill="${c.text}" text-anchor="middle" opacity="0.6">[ INSTAGRAM ]  [ FACEBOOK ]</text>
  <circle cx="100" cy="100" r="4" fill="${c.primary}" style="filter:drop-shadow(0 0 8px ${c.primary})"/>
  <circle cx="${W-100}" cy="${H-100}" r="4" fill="${c.primary}" style="filter:drop-shadow(0 0 8px ${c.primary})"/>
</svg>`
  }

  if (t.style === 'swiss-grid') {
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${c.bg}"/>
  <line x1="60" y1="0" x2="60" y2="${H}" stroke="${c.text}" stroke-width="1" opacity="0.05"/>
  <line x1="${W-60}" y1="0" x2="${W-60}" y2="${H}" stroke="${c.text}" stroke-width="1" opacity="0.05"/>
  <rect x="60" y="200" width="120" height="8" fill="${c.primary}"/>
  <text x="60" y="500" font-family="${t.fonts.heading}" font-size="120" font-weight="900" fill="${c.text}" letter-spacing="-6">FOLLOW</text>
  <text x="60" y="620" font-family="${t.fonts.heading}" font-size="120" font-weight="900" fill="${c.primary}" letter-spacing="-6">US.</text>
  <text x="60" y="720" font-family="${t.fonts.body}" font-size="32" font-weight="400" fill="${c.text}" opacity="0.5">@POSTAGENT</text>
  <rect x="60" y="800" width="300" height="60" fill="${c.primary}"/>
  <text x="210" y="842" font-family="${t.fonts.heading}" font-size="28" font-weight="900" fill="#fff" text-anchor="middle">INSTAGRAM</text>
  <rect x="400" y="800" width="300" height="60" fill="${c.text}"/>
  <text x="550" y="842" font-family="${t.fonts.heading}" font-size="28" font-weight="900" fill="${c.bg}" text-anchor="middle">FACEBOOK</text>
</svg>`
  }

  if (t.style === 'minimal-dark') {
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${c.bg}"/>
  <rect x="0" y="0" width="${W}" height="8" fill="${c.primary}"/>
  <text x="60" y="100" font-family="${t.fonts.heading}" font-size="18" font-weight="500" fill="${c.text}" opacity="0.3" letter-spacing="4">/ 04 — FOLLOW</text>
  <text x="60" y="560" font-family="${t.fonts.heading}" font-size="110" font-weight="700" fill="${c.primary}" letter-spacing="-5">FOLLOW</text>
  <text x="60" y="680" font-family="${t.fonts.heading}" font-size="110" font-weight="700" fill="${c.text}" opacity="0.3" letter-spacing="-5">US.</text>
  <rect x="60" y="750" width="${W-120}" height="1" fill="${c.border}"/>
  <text x="60" y="800" font-family="${t.fonts.heading}" font-size="24" font-weight="500" fill="${c.text}" opacity="0.5">@POSTAGENT</text>
  <text x="60" y="870" font-family="${t.fonts.heading}" font-size="20" fill="${c.primary}" opacity="0.6">→ INSTAGRAM</text>
  <text x="300" y="870" font-family="${t.fonts.heading}" font-size="20" fill="${c.primary}" opacity="0.6">→ FACEBOOK</text>
</svg>`
  }

  if (t.style === 'brutalist') {
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${c.bg}"/>
  <rect x="64" y="384" width="${W-128}" height="300" fill="${c.border}"/>
  <rect x="60" y="380" width="${W-128}" height="300" fill="${c.text}" stroke="${c.border}" stroke-width="4"/>
  <text x="${W/2}" y="520" font-family="${t.fonts.heading}" font-size="100" font-weight="900" fill="${c.secondary}" text-anchor="middle">FOLLOW US</text>
  <text x="${W/2}" y="630" font-family="${t.fonts.heading}" font-size="40" font-weight="900" fill="${c.bg}" text-anchor="middle">@POSTAGENT</text>
  <rect x="68" y="734" width="220" height="64" fill="${c.border}"/>
  <rect x="60" y="730" width="220" height="64" fill="${c.primary}" stroke="${c.border}" stroke-width="4"/>
  <text x="170" y="774" font-family="${t.fonts.heading}" font-size="28" font-weight="900" fill="${c.bg}" text-anchor="middle">INSTAGRAM</text>
  <rect x="${W-288}" y="734" width="220" height="64" fill="${c.border}"/>
  <rect x="${W-280}" y="730" width="220" height="64" fill="${c.secondary}" stroke="${c.border}" stroke-width="4"/>
  <text x="${W-170}" y="774" font-family="${t.fonts.heading}" font-size="28" font-weight="900" fill="${c.text}" text-anchor="middle">FACEBOOK</text>
</svg>`
  }

  if (t.style === 'handdrawn') {
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${c.bg}"/>
  ${Array.from({length:20},(_,i)=>{const x=50+(i%5)*200,y=50+Math.floor(i/5)*200;return `<circle cx="${x}" cy="${y}" r="1.5" fill="${c.border}" opacity="0.08"/>`}).join('\n  ')}
  <text x="${W/2}" y="450" font-family="${t.fonts.heading}" font-size="90" font-weight="700" fill="${c.primary}" text-anchor="middle">Follow Us!</text>
  <path d="M ${W/2-260} 490 Q ${W/2} 510 ${W/2+260} 490" fill="none" stroke="${c.primary}" stroke-width="4"/>
  <text x="${W/2}" y="580" font-family="${t.fonts.heading}" font-size="40" font-weight="700" fill="${c.text}" text-anchor="middle">@POSTAGENT</text>
  <rect x="${W/2-220}" y="640" width="200" height="56" fill="${c.primary}" stroke="${c.border}" stroke-width="3" rx="255px 15px 225px 15px / 15px 225px 15px 255px"/>
  <text x="${W/2-120}" y="678" font-family="${t.fonts.body}" font-size="26" font-weight="700" fill="${c.bg}" text-anchor="middle">Instagram</text>
  <rect x="${W/2+20}" y="640" width="200" height="56" fill="${c.secondary}" stroke="${c.border}" stroke-width="3" rx="15px 225px 15px 255px / 225px 15px 255px 15px"/>
  <text x="${W/2+120}" y="678" font-family="${t.fonts.body}" font-size="26" font-weight="700" fill="${c.bg}" text-anchor="middle">Facebook</text>
  <path d="M 100 200 q 30 -20 60 0 q 30 20 60 -10" fill="none" stroke="${c.accent}" stroke-width="3" stroke-dasharray="5 3"/>
  <path d="M ${W-160} 250 q -20 30 10 50 q 30 20 10 50" fill="none" stroke="${c.accent}" stroke-width="3" stroke-dasharray="5 3"/>
</svg>`
  }

  if (t.style === 'rounded') {
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${c.bg}"/>
  ${shadowRect(80, 80, W-160, H-200, 12, c.shadowColor, t.radius)}
  <rect x="80" y="80" width="${W-160}" height="${H-200}" fill="${c.bgAlt}" stroke="${c.border}" stroke-width="2" rx="${t.radius}"/>
  <circle cx="${W/2}" cy="380" r="100" fill="${c.accent}" stroke="${c.border}" stroke-width="3"/>
  <circle cx="${W/2}" cy="380" r="50" fill="${c.primary}"/>
  <text x="${W/2}" y="580" font-family="${t.fonts.heading}" font-size="80" font-weight="800" fill="${c.text}" text-anchor="middle">Follow Us</text>
  <text x="${W/2}" y="660" font-family="${t.fonts.body}" font-size="36" font-weight="700" fill="${c.primary}" text-anchor="middle">@POSTAGENT</text>
  <rect x="${W/2-220}" y="720" width="200" height="56" fill="${c.primary}" rx="9999"/>
  <text x="${W/2-120}" y="758" font-family="${t.fonts.heading}" font-size="26" font-weight="800" fill="#fff" text-anchor="middle">Instagram</text>
  <rect x="${W/2+20}" y="720" width="200" height="56" fill="${c.secondary}" rx="9999"/>
  <text x="${W/2+120}" y="758" font-family="${t.fonts.heading}" font-size="26" font-weight="800" fill="#fff" text-anchor="middle">Facebook</text>
</svg>`
  }

  // Default: geometric/bauhaus
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${bgFill}"/>
  <circle cx="${W/2}" cy="400" r="180" fill="${c.accent}" stroke="${c.border}" stroke-width="8"/>
  <rect x="${W/2-110}" y="290" width="220" height="220" fill="${c.primary}" stroke="${c.border}" stroke-width="8" transform="rotate(45 ${W/2} 400)"/>
  <polygon points="${W/2},260 ${W/2-140},520 ${W/2+140},520" fill="${c.secondary}" stroke="${c.border}" stroke-width="8"/>
  <text x="${W/2}" y="720" font-family="${t.fonts.heading}" font-size="100" font-weight="900" fill="${accentOnBg}" text-anchor="middle">FOLLOW US</text>
  <rect x="${W/2-250}" y="750" width="500" height="6" fill="${c.primary}"/>
  <text x="${W/2}" y="840" font-family="${t.fonts.heading}" font-size="48" font-weight="900" fill="${textOnBg}" text-anchor="middle">@POSTAGENT</text>
  <rect x="${W/2-220}" y="890" width="200" height="56" fill="${c.accent}" stroke="${c.accent}" stroke-width="4" rx="${t.radius}"/>
  <text x="${W/2-120}" y="930" font-family="${t.fonts.heading}" font-size="30" font-weight="900" fill="${c.text}" text-anchor="middle">INSTAGRAM</text>
  <rect x="${W/2+20}" y="890" width="200" height="56" fill="${c.secondary}" stroke="${c.secondary}" stroke-width="4" rx="${t.radius}"/>
  <text x="${W/2+120}" y="930" font-family="${t.fonts.heading}" font-size="30" font-weight="900" fill="${dark?c.bg:c.bg}" text-anchor="middle">FACEBOOK</text>
</svg>`
}

// ═══════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════
async function loadFallbackFontPaths(): Promise<string[]> {
  const candidates = ['/System/Library/Fonts/Supplemental/Arial Bold.ttf', '/System/Library/Fonts/Helvetica.ttc', '/System/Library/Fonts/SFNS.ttf']
  const valid: string[] = []
  for (const c of candidates) { try { await readFile(c); valid.push(c) } catch {} }
  return valid
}

export async function generateCarouselImages(content: StructuredContent, postId: string, theme: Theme): Promise<GeneratedImage[]> {
  await mkdir(OUT_DIR, { recursive: true })
  const fontFiles: string[] = []
  for (const fileName of [theme.fonts.headingFile, theme.fonts.bodyFile, theme.fonts.codeFile]) {
    const p = join(FONT_DIR, fileName)
    try { await readFile(p); if (!fontFiles.includes(p)) fontFiles.push(p) } catch {}
  }
  if (fontFiles.length < 2) fontFiles.push(...await loadFallbackFontPaths())

  const slide1Fn = slide1Fns[theme.style] || geometricSlide1
  const slides = [
    () => slide1Fn(content, theme),
    () => slide2Code(content, theme),
    () => generateSlide3(content, theme),
    () => generateSlide4(theme),
  ]

  const results: GeneratedImage[] = []
  for (let i = 0; i < slides.length; i++) {
    const svgString = slides[i]()
    const png = new Resvg(svgString, {
      fitTo: { mode: 'width', value: W },
      font: { fontFiles, defaultFontFamily: theme.fonts.body, loadSystemFonts: fontFiles.length === 0 },
    }).render().asPng()
    const filename = `${postId}_${i + 1}.png`
    const path = join(OUT_DIR, filename)
    await writeFile(path, png)
    results.push({ filename, path, url: `/generated/${filename}` })
  }
  return results
}