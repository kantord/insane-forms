/** Docusaurus content plugin: build-time syntax highlighting with Shiki.
 * Each specimen shown on the homepage is sliced from the REAL example file
 * and highlighted with a custom theme matching its style biome — no
 * highlighter ships to the browser, only pre-rendered HTML (read back via
 * `usePluginData`, src/hooks/useSnippets.ts). Ported from the old Vite
 * plugin (apps/landing/snippets.plugin.ts) when the landing page moved to
 * Docusaurus; the Magic Move step-morph animation was dropped (see
 * landing-page skill), so each schema-morph step is now just its own
 * highlighted snippet instead of a keyed-token animation. */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { LoadContext, Plugin, PluginContentLoadedActions } from '@docusaurus/types'
import { createHighlighter, type ThemeRegistrationAny } from 'shiki'

type Palette = {
  bg: string
  fg: string
  comment: string
  string: string
  keyword: string
  fn: string
  number: string
  type: string
  property: string
  punct: string
  light?: boolean
}

const biomeTheme = (name: string, c: Palette): ThemeRegistrationAny => ({
  name,
  type: c.light === true ? 'light' : 'dark',
  colors: { 'editor.background': c.bg, 'editor.foreground': c.fg },
  tokenColors: [
    { scope: ['comment'], settings: { foreground: c.comment, fontStyle: 'italic' } },
    { scope: ['string', 'punctuation.definition.string'], settings: { foreground: c.string } },
    {
      scope: ['keyword', 'storage.type', 'storage.modifier'],
      settings: { foreground: c.keyword },
    },
    { scope: ['entity.name.function', 'support.function'], settings: { foreground: c.fn } },
    { scope: ['constant.numeric', 'constant.language'], settings: { foreground: c.number } },
    { scope: ['entity.name.type', 'support.type'], settings: { foreground: c.type } },
    {
      scope: ['entity.name.tag', 'support.class.component'],
      settings: { foreground: c.keyword },
    },
    {
      scope: ['variable.other.property', 'meta.object-literal.key'],
      settings: { foreground: c.property },
    },
    { scope: ['punctuation'], settings: { foreground: c.punct } },
  ],
})

const BUREAU_THEME = biomeTheme('bureau', {
  bg: '#1b1916',
  fg: '#e9e3d2',
  comment: '#837b66',
  string: '#c9b98c',
  keyword: '#ff7a55',
  fn: '#e6b87e',
  number: '#e6b87e',
  type: '#b8c9a6',
  property: '#d8d0bb',
  punct: '#9a917c',
})

const SNIPPETS = [
  {
    id: 'tokens',
    file: 'biomes.css',
    from: '.biome-terminal {',
    to: '.biome-meadow {',
    lang: 'css' as const,
    themeName: 'terminal',
    theme: null,
  },
  {
    id: 'bureau',
    file: 'profile.tsx',
    from: 'const Contact',
    to: 'export type ProfileData',
    theme: BUREAU_THEME,
  },
  {
    id: 'terminal',
    file: 'terminal.tsx',
    from: 'const TerminalShell',
    to: 'export const TerminalTreeForm',
    theme: biomeTheme('terminal', {
      bg: '#081009',
      fg: '#a9efc5',
      comment: '#4f7a62',
      string: '#7fe0a9',
      keyword: '#ffc163',
      fn: '#d2ffd6',
      number: '#ffc163',
      type: '#86d7ff',
      property: '#9fdcc0',
      punct: '#4f7a62',
    }),
  },
  {
    id: 'meadow',
    file: 'meadow.tsx',
    from: 'export const Rsvp',
    to: 'export type RsvpData',
    theme: biomeTheme('meadow', {
      bg: '#f6f3fd',
      fg: '#36304a',
      comment: '#9a93b3',
      string: '#3f8f63',
      keyword: '#6d5ae6',
      fn: '#c25590',
      number: '#c98a2f',
      type: '#3e74d6',
      property: '#554b78',
      punct: '#8d86a8',
      light: true,
    }),
  },
] as const

/* `// @note(target) text` comments in example files become hoverable
 * explanations: stripped from the displayed code, attached to the first
 * occurrence of `target` (whole line without a target) as a Shiki decoration.
 * Trailing notes annotate their own line; standalone note lines (Biome moves
 * long trailing comments up) annotate the NEXT code line. */
// Target may itself contain one level of parens: @note(.min(1).max(3))
const NOTE_RE = /[ \t]*\/\/ @note(?:\(((?:[^()]|\([^()]*\))*)\))? (.*)$/

type Note = { line: number; target: string | undefined; text: string }

const extractNotes = (source: string) => {
  const notes: Note[] = []
  const cleaned: string[] = []
  const pending: Omit<Note, 'line'>[] = []
  for (const raw of source.split('\n')) {
    const match = raw.match(NOTE_RE)
    if (!match) {
      for (const note of pending) notes.push({ line: cleaned.length, ...note })
      pending.length = 0
      cleaned.push(raw)
      continue
    }
    const note = { target: match[1] || undefined, text: (match[2] ?? '').trim() }
    const stripped = raw.replace(NOTE_RE, '')
    if (stripped.trim() === '') {
      pending.push(note)
    } else {
      notes.push({ line: cleaned.length, ...note })
      cleaned.push(stripped)
    }
  }
  const decorations = notes.flatMap((note) => {
    const lineText = cleaned[note.line] ?? ''
    if (lineText.trim() === '') return []
    let start = lineText.length - lineText.trimStart().length
    let end = lineText.trimEnd().length
    if (note.target !== undefined) {
      const at = lineText.indexOf(note.target)
      if (at !== -1) {
        start = at
        end = at + note.target.length
      }
    }
    return [
      {
        start: { line: note.line, character: start },
        end: { line: note.line, character: end },
        properties: {
          class: 'code-note',
          'data-note': note.text,
          tabindex: '0',
          'aria-label': `Note: ${note.text}`,
        },
      },
    ]
  })
  return { code: cleaned.join('\n'), decorations }
}

export type SnippetsContent = {
  snippets: Record<string, string>
  morphSteps: string[]
}

const PLUGIN_NAME = 'insane-forms-snippets'

export default function snippetsPlugin(context: LoadContext): Plugin<SnippetsContent> {
  return {
    name: PLUGIN_NAME,
    async loadContent() {
      const highlighter = await createHighlighter({
        langs: ['tsx', 'css'],
        themes: [...SNIPPETS.flatMap((s) => (s.theme === null ? [] : [s.theme])), BUREAU_THEME],
      })
      const examplesDir = path.resolve(context.siteDir, '../../packages/examples')

      const entries = SNIPPETS.map((s) => {
        const file = path.join(examplesDir, s.file)
        const source = readFileSync(file, 'utf8')
        const a = source.indexOf(s.from)
        const b = source.indexOf(s.to)
        const sliced = a !== -1 && b !== -1 && b > a ? source.slice(a, b).trimEnd() : source
        const { code, decorations } = extractNotes(sliced)
        const html = highlighter.codeToHtml(code, {
          lang: 'lang' in s && s.lang === 'css' ? 'css' : 'tsx',
          theme: ('themeName' in s ? s.themeName : undefined) ?? s.theme?.name ?? s.id,
          decorations,
        })
        return [s.id, html] as const
      })

      // Schema-morph steps: slice examples/morph.tsx at its step markers and
      // highlight each step individually (no animation — the reader clicks
      // through steps; see src/pages/index.tsx SchemaMorph).
      const morphFile = path.join(examplesDir, 'morph.tsx')
      const morphSteps = readFileSync(morphFile, 'utf8')
        .split(/\/\* step:\d[^*]*\*\//)
        .slice(1)
        .map((block) => extractNotes(block.trim()).code)
        .map((block) => block.replace(/export const Step\d/, 'const Profile'))
        .map((code) => highlighter.codeToHtml(code, { lang: 'tsx', theme: 'bureau' }))

      highlighter.dispose()
      return { snippets: Object.fromEntries(entries), morphSteps }
    },
    async contentLoaded({
      content,
      actions,
    }: {
      content: SnippetsContent
      actions: PluginContentLoadedActions
    }) {
      actions.setGlobalData(content)
    },
  }
}
