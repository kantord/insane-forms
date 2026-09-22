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
    // The schema-morph funnel's step 2 (SchemaMorph.tsx): the actual line
    // where a schema and a widget merge into one field — shown in place of
    // a live demo at that step, since the point there is the BINDING, not
    // a rendered result (that comes back from step 3 on).
    id: 'text-field-binding',
    file: 'profile.tsx',
    from: 'export const TextField',
    to: 'export const NumberField',
    theme: BUREAU_THEME,
  },
  {
    // The funnel's "old way" pane: just the `<input>` JSX from
    // HandWrittenNameInput, not the whole function (useState wrapper isn't
    // the point). `from` is disambiguated with a trailing newline — the
    // file's own doc comment also contains the literal text `<input>`
    // (backtick-quoted, no newline after), which a bare `from: '<input'`
    // matched FIRST, pulling in comment prose instead of the real element.
    id: 'hand-written-input',
    file: 'morph.tsx',
    from: '<input\n',
    to: '\n  )\n}',
    theme: BUREAU_THEME,
  },
  {
    // The funnel's "the data" pane. Deliberately NOT part of the sequential
    // step:1 → step:2 → … marker chain below (`morphSteps`) — that chain
    // burned real time three separate times: a block there is "everything
    // until the next marker," so whenever a NEIGHBORING marker moved or was
    // removed (adding/removing the 1b input markers, twice), step 1's own
    // block silently absorbed whatever was newly unmarked next to it,
    // including once the ENTIRE HandWrittenNameInput function. This entry
    // can't have that failure mode: it's one isolated from/to extraction,
    // unaffected by anything else in the file, same as bureau/terminal/
    // meadow/hand-written-input above.
    id: 'bare-schema',
    file: 'morph.tsx',
    from: 'export const Step1',
    to: '/** The old way',
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
  /** Keyed by marker id (`"1"`, `"1b"`, `"2"`…), not a plain sequential
   * array — `1b` is a non-sequential aside (the "old way" hand-written UI,
   * shown next to step 1's bare schema, not a numbered step of its own). */
  morphSteps: Record<string, string>
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
        // Same identifier rename as the morphSteps loop below (harmless
        // no-op for every entry that isn't one of morph.tsx's `StepN`
        // consts) — keeps `bare-schema` reading "Profile" like every other
        // schema-morph pane instead of the internal `Step1` name.
        const renamed = sliced.replace(/export const Step\w+/, 'const Profile')
        const { code, decorations } = extractNotes(renamed)
        const html = highlighter.codeToHtml(code, {
          lang: 'lang' in s && s.lang === 'css' ? 'css' : 'tsx',
          theme: ('themeName' in s ? s.themeName : undefined) ?? s.theme?.name ?? s.id,
          decorations,
        })
        return [s.id, html] as const
      })

      // Schema-morph steps: slice examples/morph.tsx at its step markers and
      // highlight each step individually (no animation — every step is its
      // own static section; see src/components/SchemaMorph.tsx). The
      // marker id is CAPTURED (a `[\w-]+` split regex keeps captured groups
      // interleaved in the result array), so ids don't need to be
      // sequential integers — `1b` is a real id, not a parse error. `-`
      // is explicitly allowed (not just `\w`): a `1b-end` marker id once
      // silently truncated to `1b` under a bare `\w+` (hyphen isn't a word
      // character), so its block overwrote the real `1b` entry instead of
      // producing its own — a same-id collision with no error, just wrong
      // displayed content.
      const morphFile = path.join(examplesDir, 'morph.tsx')
      const morphParts = readFileSync(morphFile, 'utf8').split(/\/\* step:([\w-]+)[^*]*\*\//)
      const morphSteps: Record<string, string> = {}
      for (let i = 1; i < morphParts.length; i += 2) {
        const id = morphParts[i]
        const block = morphParts[i + 1]
        if (id === undefined || block === undefined) continue
        const code = extractNotes(block.trim())
          .code.replace(/export const Step\w+/, 'const Profile')
          .replace(/export function (\w+)/, 'function $1')
        morphSteps[id] = highlighter.codeToHtml(code, { lang: 'tsx', theme: 'bureau' })
      }

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
