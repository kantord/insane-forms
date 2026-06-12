/** Vite plugin: build-time syntax highlighting with Shiki. Each docs-page
 * specimen gets its snippet sliced from the REAL example file and highlighted
 * with a custom theme matching its style biome — no highlighter ships to the
 * browser, only pre-rendered HTML. */

import { readFileSync } from 'node:fs'
import path from 'node:path'
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
    id: 'bureau',
    file: 'examples/profile.tsx',
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
    file: 'examples/terminal.tsx',
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
    file: 'examples/meadow.tsx',
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
        langs: ['tsx'],
        themes: SNIPPETS.map((s) => s.theme),
      })
      const entries = SNIPPETS.map((s) => {
        const file = path.resolve(import.meta.dirname, '..', s.file)
        this.addWatchFile(file)
        const source = readFileSync(file, 'utf8')
        const a = source.indexOf(s.from)
        const b = source.indexOf(s.to)
        const code = a !== -1 && b !== -1 && b > a ? source.slice(a, b).trimEnd() : source
        const html = highlighter.codeToHtml(code, { lang: 'tsx', theme: s.theme.name ?? s.id })
        return [s.id, html]
      })
      return `export default ${JSON.stringify(Object.fromEntries(entries))}`
    },
  }
}
