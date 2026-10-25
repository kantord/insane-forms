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
  /** n1 (primary text) / n2 (structural: keywords, strings) / n3 (dimmest:
   * comments, punctuation) — the "3 neutral steps" of biomes.css's duotone
   * code palette (--color-code-n1/n2/n3). n1 is literally --color-ink in
   * each mode; n2/n3 are dimmer, not separately-hued. */
  n1: string
  n2: string
  n3: string
  /** a1/a2 — the palette's "2 accent steps" (--color-code-a1/a2, literally
   * --color-pop). Reserved for schema constructors/constraints (function
   * calls, types) — never plain syntax — so this is the ONLY place color
   * (not just contrast) appears in an otherwise duotone scheme. */
  a1: string
  a2: string
  light: boolean
}

const biomeTheme = (name: string, c: Palette): ThemeRegistrationAny => ({
  name,
  type: c.light ? 'light' : 'dark',
  colors: { 'editor.background': 'transparent', 'editor.foreground': c.n1 },
  tokenColors: [
    { scope: ['comment'], settings: { foreground: c.n3, fontStyle: 'italic' } },
    { scope: ['string', 'punctuation.definition.string'], settings: { foreground: c.n2 } },
    { scope: ['keyword', 'storage.type', 'storage.modifier'], settings: { foreground: c.n2 } },
    { scope: ['entity.name.function', 'support.function'], settings: { foreground: c.a1 } },
    { scope: ['constant.numeric', 'constant.language'], settings: { foreground: c.n1 } },
    { scope: ['entity.name.type', 'support.type'], settings: { foreground: c.a2 } },
    { scope: ['entity.name.tag', 'support.class.component'], settings: { foreground: c.n2 } },
    {
      scope: ['variable.other.property', 'meta.object-literal.key'],
      settings: { foreground: c.n1 },
    },
    { scope: ['punctuation'], settings: { foreground: c.n3 } },
  ],
})

// Both lifted straight from packages/examples/biomes.css's duotone code
// palette (--color-code-n1/n2/n3/a1/a2) — not invented here. That palette
// sat unused until now: n1 is literally --color-ink and a1 is literally
// --color-pop in each mode, so code text was always meant to share the
// page's own ink/accent scale, not a separate fixed-dark panel.
const BUREAU_THEME_LIGHT = biomeTheme('bureau-light', {
  light: true,
  n1: '#111110',
  n2: '#56564f',
  n3: '#6b6b64',
  a1: '#3a35ff',
  a2: '#4a45e6',
})
const BUREAU_THEME_DARK = biomeTheme('bureau-dark', {
  light: false,
  n1: '#efece3',
  n2: '#a9a49a',
  n3: '#8d887e',
  a1: '#d9a441',
  a2: '#e8c07a',
})

const SNIPPETS = [
  {
    // The schema-morph funnel's step 2 (SchemaMorph.tsx): the actual line
    // where a schema and a widget merge into one field — shown in place of
    // a live demo at that step, since the point there is the BINDING, not
    // a rendered result (that comes back from step 3 on).
    id: 'text-field-binding',
    file: 'profile.tsx',
    from: 'export const TextField',
    to: 'export const NumberField',
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
        langs: ['tsx'],
        themes: [BUREAU_THEME_LIGHT, BUREAU_THEME_DARK],
      })
      // Dual-theme output: each token gets BOTH colors as CSS custom
      // properties (`--shiki-light`/`--shiki-dark`) instead of one resolved
      // color — `defaultColor: false` suppresses Shiki's own
      // `prefers-color-scheme` media-query CSS, since this site's dark mode
      // is a `data-theme` attribute toggle (ColorMode.tsx), not the system
      // preference; custom.css picks the right var off that attribute.
      const codeTheme = { light: BUREAU_THEME_LIGHT.name, dark: BUREAU_THEME_DARK.name }
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
          lang: 'tsx',
          themes: codeTheme,
          defaultColor: false,
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
        morphSteps[id] = highlighter.codeToHtml(code, {
          lang: 'tsx',
          themes: codeTheme,
          defaultColor: false,
        })
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
