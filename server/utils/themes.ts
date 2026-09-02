export interface Theme {
  id: string
  name: string
  source: string
  colors: {
    primary: string
    secondary: string
    accent: string
    bg: string
    bgAlt: string
    text: string
    border: string
    codeBg: string
  }
  fonts: {
    heading: string
    body: string
    code: string
    headingFile: string
    bodyFile: string
    codeFile: string
  }
  radius: number
  borderWidth: number
  shadow: 'none' | 'hard' | 'soft' | 'glow'
  shadowColor: string
  letterSpacing: number
  h1Size: number
  bodySize: number
  style: 'geometric' | 'rounded' | 'minimal-dark' | 'brutalist' | 'handdrawn' | 'swiss-grid' | 'terminal'
}

export const THEMES: Theme[] = [
  {
    id: 'bauhaus',
    name: 'Bauhaus',
    source: 'https://design.itsash.in/theme/Bauhaus/index.html',
    colors: {
      primary: '#D02020',
      secondary: '#1040C0',
      accent: '#F0C020',
      bg: '#F0F0F0',
      bgAlt: '#FFFFFF',
      text: '#121212',
      border: '#121212',
      codeBg: '#0D1117',
    },
    fonts: {
      heading: 'Outfit',
      body: 'Outfit',
      code: 'Cascadia Code',
      headingFile: 'Outfit-Black.ttf',
      bodyFile: 'Outfit-ExtraBold.ttf',
      codeFile: 'CascadiaCode-Bold.ttf',
    },
    radius: 0,
    borderWidth: 4,
    shadow: 'hard',
    shadowColor: '#121212',
    letterSpacing: 0,
    h1Size: 64,
    bodySize: 34,
    style: 'geometric',
  },
  {
    id: 'geometric',
    name: 'Geometric',
    source: 'https://design.itsash.in/theme/Geometric/index.html',
    colors: {
      primary: '#8B5CF6',
      secondary: '#F472B6',
      accent: '#FBBF24',
      bg: '#FFFDF5',
      bgAlt: '#F1F5F9',
      text: '#1E293B',
      border: '#1E293B',
      codeBg: '#1E1B4B',
    },
    fonts: {
      heading: 'Outfit',
      body: 'Plus Jakarta Sans',
      code: 'Cascadia Code',
      headingFile: 'Outfit-Black.ttf',
      bodyFile: 'Plus-Jakarta-Sans-800.ttf',
      codeFile: 'CascadiaCode-Bold.ttf',
    },
    radius: 24,
    borderWidth: 2,
    shadow: 'soft',
    shadowColor: '#E2E8F0',
    letterSpacing: 0,
    h1Size: 60,
    bodySize: 34,
    style: 'rounded',
  },
  {
    id: 'kinetic',
    name: 'Kinetic',
    source: 'https://design.itsash.in/theme/Kinetic/index.html',
    colors: {
      primary: '#DFE104',
      secondary: '#27272A',
      accent: '#DFE104',
      bg: '#09090B',
      bgAlt: '#27272A',
      text: '#FAFAFA',
      border: '#3F3F46',
      codeBg: '#09090B',
    },
    fonts: {
      heading: 'Space Grotesk',
      body: 'Space Grotesk',
      code: 'JetBrains Mono',
      headingFile: 'Space-Grotesk-700.ttf',
      bodyFile: 'Space-Grotesk-700.ttf',
      codeFile: 'JetBrains-Mono-700.ttf',
    },
    radius: 2,
    borderWidth: 2,
    shadow: 'none',
    shadowColor: '#3F3F46',
    letterSpacing: -3,
    h1Size: 72,
    bodySize: 30,
    style: 'minimal-dark',
  },
  {
    id: 'neo-brutalism',
    name: 'Neo-Brutalism',
    source: 'https://design.itsash.in/theme/Neo-brutalism/index.html',
    colors: {
      primary: '#FF6B6B',
      secondary: '#FFD93D',
      accent: '#C4B5FD',
      bg: '#FFFDF5',
      bgAlt: '#C4B5FD',
      text: '#000000',
      border: '#000000',
      codeBg: '#000000',
    },
    fonts: {
      heading: 'Space Grotesk',
      body: 'Space Grotesk',
      code: 'JetBrains Mono',
      headingFile: 'Space-Grotesk-700.ttf',
      bodyFile: 'Space-Grotesk-700.ttf',
      codeFile: 'JetBrains-Mono-700.ttf',
    },
    radius: 0,
    borderWidth: 4,
    shadow: 'hard',
    shadowColor: '#000000',
    letterSpacing: -2,
    h1Size: 70,
    bodySize: 32,
    style: 'brutalist',
  },
  {
    id: 'sketch',
    name: 'Sketch',
    source: 'https://design.itsash.in/theme/Sketch/index.html',
    colors: {
      primary: '#ff4d4d',
      secondary: '#2d5da1',
      accent: '#d9a300',
      bg: '#fdfbf7',
      bgAlt: '#f0ebe0',
      text: '#2d2d2d',
      border: '#2d2d2d',
      codeBg: '#2d2d2d',
    },
    fonts: {
      heading: 'Kalam',
      body: 'Patrick Hand',
      code: 'JetBrains Mono',
      headingFile: 'Kalam-700.ttf',
      bodyFile: 'Patrick-Hand-400.ttf',
      codeFile: 'JetBrains-Mono-700.ttf',
    },
    radius: 15,
    borderWidth: 2,
    shadow: 'hard',
    shadowColor: 'rgba(45,45,45,0.15)',
    letterSpacing: 1,
    h1Size: 56,
    bodySize: 32,
    style: 'handdrawn',
  },
  {
    id: 'swiss',
    name: 'Swiss',
    source: 'https://design.itsash.in/theme/Swiss/index.html',
    colors: {
      primary: '#FF3000',
      secondary: '#000000',
      accent: '#FF3000',
      bg: '#fefefe',
      bgAlt: '#F2F2F2',
      text: '#000000',
      border: '#000000',
      codeBg: '#000000',
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
      code: 'JetBrains Mono',
      headingFile: 'Inter-900.ttf',
      bodyFile: 'Inter-900.ttf',
      codeFile: 'JetBrains-Mono-700.ttf',
    },
    radius: 0,
    borderWidth: 2,
    shadow: 'none',
    shadowColor: '#000000',
    letterSpacing: -4,
    h1Size: 80,
    bodySize: 32,
    style: 'swiss-grid',
  },
  {
    id: 'terminal',
    name: 'Terminal',
    source: 'https://design.itsash.in/theme/Terminal/index.html',
    colors: {
      primary: '#33ff00',
      secondary: '#ffb000',
      accent: '#33ff00',
      bg: '#0a0a0a',
      bgAlt: '#1f521f',
      text: '#33ff00',
      border: '#1f521f',
      codeBg: '#0a0a0a',
    },
    fonts: {
      heading: 'JetBrains Mono',
      body: 'JetBrains Mono',
      code: 'JetBrains Mono',
      headingFile: 'JetBrains-Mono-700.ttf',
      bodyFile: 'JetBrains-Mono-700.ttf',
      codeFile: 'JetBrains-Mono-700.ttf',
    },
    radius: 0,
    borderWidth: 1,
    shadow: 'glow',
    shadowColor: '#33ff00',
    letterSpacing: 2,
    h1Size: 48,
    bodySize: 26,
    style: 'terminal',
  },
]

export function getTheme(id: string): Theme {
  return THEMES.find(t => t.id === id) || THEMES[0]
}

export function pickTheme(usedThemes: string[]): Theme {
  const available = THEMES.filter(t => !usedThemes.includes(t.id))
  const pool = available.length ? available : THEMES
  return pool[Math.floor(Math.random() * pool.length)]
}