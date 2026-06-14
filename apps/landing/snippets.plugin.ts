/** Vite plugin: build-time syntax highlighting with Shiki. Each docs-page
 * specimen gets its snippet sliced from the REAL example file and highlighted
 * with a custom theme matching its style biome — no highlighter ships to the
 * browser, only pre-rendered HTML. */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { codeToKeyedTokens, createMagicMoveMachine } from '@shikijs/magic-move/core'
import { createHighlighter, type ThemeRegistrationAny } from 'shiki'
import type { Plugin } from 'vite'

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
    theme: biomeTheme('bureau', {
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
    }),
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

const VIRTUAL_ID = 'virtual:snippets'
const RESOLVED_ID = `\0${VIRTUAL_ID}`

export function snippetsPlugin(): Plugin {
  return {
    name: 'insane-forms:snippets',
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : undefined
    },
    async load(id) {
      if (id !== RESOLVED_ID) return undefined
      const highlighter = await createHighlighter({
        langs: ['tsx', 'css'],
        themes: SNIPPETS.flatMap((s) => (s.theme === null ? [] : [s.theme])),
      })
      const entries = SNIPPETS.map((s) => {
        const file = path.resolve(import.meta.dirname, '../../packages/examples', s.file)
        this.addWatchFile(file)
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
        return [s.id, html]
      })

      // Magic Move steps: slice examples/morph.tsx at its step markers and
      // precompile keyed tokens (bureau theme), so the runtime ships the
      // renderer only — zero Shiki in the browser.
      const morphFile = path.resolve(import.meta.dirname, '../../packages/examples', 'morph.tsx')
      this.addWatchFile(morphFile)
      const morphBlocks = readFileSync(morphFile, 'utf8')
        .split(/\/\* step:\d[^*]*\*\//)
        .slice(1)
        // notes are stripped here too (keyed tokens can't carry decorations)
        .map((block) => extractNotes(block.trim()).code)
        .map((block) => block.replace(/export const Step\d/, 'const Profile'))
      // (matchAlgorithm isn't exposed in @shikijs/magic-move 4.2.0's options —
      // revisit when upgrading to the shiki-monorepo line.)
      const machine = createMagicMoveMachine((code) =>
        codeToKeyedTokens(highlighter, code, { lang: 'tsx', theme: 'bureau' }),
      )
      const morphSteps = morphBlocks.map((code) => structuredClone(machine.commit(code).current))

      return [
        `export default ${JSON.stringify(Object.fromEntries(entries))}`,
        // JSON.parse of a string literal parses ~1.7x faster than an equivalent
        // JS object literal (V8 guidance) — these arrays are large.
        `export const morphSteps = JSON.parse(${JSON.stringify(JSON.stringify(morphSteps))})`,
      ].join('\n')
    },
  }
}
