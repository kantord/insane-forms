/** Vite plugin: build-time syntax highlighting for the custom Storybook code
 * panel. Highlights with Shiki at build time — no highlighter ships to the
 * browser, only pre-rendered HTML (mirrors the landing page's snippets pipeline).
 *
 * Two modes, decided per story file:
 *  - Default: highlight the story's render body verbatim (the composition IS the
 *    lesson — Forms, Collections, Table…).
 *  - Field-definition (files marked `@code-panel:field-definition`): show each
 *    featured field's `insane.field()` definition (sliced from the real
 *    fields.tsx) followed by the example schema, dropping the form boilerplate.
 *    Used for the shadcn ui widgets, where "how the field is built" is the point.
 *
 * Emits a virtual module mapping  file basename → story display name → HTML. */

import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { createHighlighter } from 'shiki'
import type { Plugin } from 'vite'

// Theme for now is a stock Shiki theme; swapping in a site-matched theme (as the
// landing biome themes do) is a one-line change once we share the render core.
const THEME = 'github-dark-default'

const FIELD_DEF_MARKER = '@code-panel:field-definition'

/** Index of the char matching the bracket that opens at `open`. */
const matchBracket = (src: string, open: number, openCh: string, closeCh: string): number => {
  let depth = 0
  for (let i = open; i < src.length; i++) {
    if (src[i] === openCh) depth++
    else if (src[i] === closeCh && --depth === 0) return i
  }
  return -1
}

/** Contents of the balanced {...} starting at `open` (which must be a '{'). */
const balancedBlock = (src: string, open: number): string =>
  src.slice(open + 1, matchBracket(src, open, '{', '}'))

const dedent = (body: string): string => {
  const lines = body.replace(/^\n/, '').trimEnd().split('\n')
  const indent = Math.min(
    ...lines.filter((l) => l.trim()).map((l) => (l.match(/^ */) ?? [''])[0].length),
  )
  return lines.map((l) => l.slice(indent)).join('\n')
}

/** Storybook's export-name → display-name fallback (lodash startCase-alike). */
const startCase = (s: string): string =>
  s
    .replace(/_/g, ' ')
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .trim()

/** Every `export const X = { … }` story → its display name + render body. */
const extractStories = (raw: string): { name: string; body: string }[] => {
  const out: { name: string; body: string }[] = []
  const exportRe = /export const (\w+)[^=]*= \{/g
  for (let m = exportRe.exec(raw); m !== null; m = exportRe.exec(raw)) {
    const block = balancedBlock(raw, m.index + m[0].length - 1)
    const name = block.match(/^\s*name: '([^']*)'/m)?.[1] ?? startCase(m[1])
    const marker = 'render: () => {'
    const at = block.indexOf(marker)
    const body = at === -1 ? dedent(block) : dedent(balancedBlock(block, at + marker.length - 1))
    out.push({ name, body })
  }
  return out
}

/** All `export const Name = insane.field({…})` blocks from fields.tsx, by name. */
const extractFieldDefs = (src: string): Record<string, string> => {
  const defs: Record<string, string> = {}
  const re = /export const (\w+) = insane\.field\(/g
  for (let m = re.exec(src); m !== null; m = re.exec(src)) {
    const paren = m.index + m[0].length - 1 // points at '('
    const close = matchBracket(src, paren, '(', ')')
    if (close !== -1) defs[m[1]] = src.slice(m.index, close + 1)
  }
  return defs
}

/** Field-definition view: each featured binding's definition + the example
 * schema, boilerplate (the ZodForm/Button render) dropped. */
const fieldDefView = (body: string, fieldDefs: Record<string, string>): string => {
  // Slice off everything from the `return (…)` onward — keep the schema setup.
  const retAt = body.search(/\n\s*return[\s(]/)
  const schema = (retAt === -1 ? body : body.slice(0, retAt)).trim()
  // Which field bindings does this schema use? Keep them in order of appearance.
  const used = Object.keys(fieldDefs)
    .map((name) => ({ name, at: schema.search(new RegExp(`\\b${name}\\b`)) }))
    .filter((x) => x.at !== -1)
    .sort((a, b) => a.at - b.at)
  const defs = used.map((x) => fieldDefs[x.name]).join('\n\n')
  return defs ? `${defs}\n\n${schema}` : schema
}

const VIRTUAL_ID = 'virtual:insane-code-panel'
const RESOLVED_ID = `\0${VIRTUAL_ID}`

export function codePanelPlugin(): Plugin {
  return {
    name: 'insane-forms:code-panel',
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : undefined
    },
    async load(id) {
      if (id !== RESOLVED_ID) return undefined
      const dir = path.resolve(import.meta.dirname, '../stories')
      const fieldsFile = path.resolve(import.meta.dirname, '../../../packages/examples/fields.tsx')
      this.addWatchFile(fieldsFile)
      const fieldDefs = extractFieldDefs(readFileSync(fieldsFile, 'utf8'))

      const files = readdirSync(dir).filter((f) => f.endsWith('.stories.tsx'))
      const highlighter = await createHighlighter({ langs: ['tsx'], themes: [THEME] })

      const map: Record<string, Record<string, string>> = {}
      for (const file of files) {
        const full = path.join(dir, file)
        this.addWatchFile(full)
        const raw = readFileSync(full, 'utf8')
        const fieldDefMode = raw.includes(FIELD_DEF_MARKER)
        const byName: Record<string, string> = {}
        for (const { name, body } of extractStories(raw)) {
          const code = fieldDefMode ? fieldDefView(body, fieldDefs) : body
          byName[name] = highlighter.codeToHtml(code, { lang: 'tsx', theme: THEME })
        }
        map[file] = byName
      }
      return `export default ${JSON.stringify(map)}`
    },
  }
}
