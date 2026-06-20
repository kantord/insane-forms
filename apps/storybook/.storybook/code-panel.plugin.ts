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
const SHELL_DEF_MARKER = '@code-panel:shell-definition'

type Reference = { doc: string; href: string }

/** shadcn registry (a vendored copy of https://ui.shadcn.com/r/index.json) → a
 *  map from a `components/ui/<file>` basename to that component's canonical name
 *  and Base UI docs URL. Refresh with:
 *    curl -fsS https://ui.shadcn.com/r/index.json -o .storybook/shadcn-registry.json
 *  We use the `base` (Base UI) docs because this project's vendored components are
 *  the Base UI flavor (components.json style `base-nova`); fall back to radix. */
type RegistryItem = {
  name: string
  files?: { path: string }[]
  meta?: { links?: { base?: { docs?: string }; radix?: { docs?: string } } }
}
const loadRegistry = (file: string): Record<string, { name: string; docs: string }> => {
  const items = JSON.parse(readFileSync(file, 'utf8')) as RegistryItem[]
  const byFile: Record<string, { name: string; docs: string }> = {}
  for (const item of items) {
    const docs = item.meta?.links?.base?.docs ?? item.meta?.links?.radix?.docs
    if (!docs) continue
    for (const f of item.files ?? []) {
      const base = f.path
        .split('/')
        .pop()
        ?.replace(/\.tsx?$/, '')
      if (base) byFile[base] = { name: item.name, docs }
    }
  }
  return byFile
}

/** "No black boxes": every shadcn primitive shown in displayed code links to its
 *  docs. DERIVED, not hand-authored — each `import { X, Y } from '@/components/ui/<file>'`
 *  in fields.tsx is resolved against the vendored registry: <file> → its Base UI
 *  docs URL, and every imported name maps to it. Only components that actually
 *  exist in the registry are linked (validation); a new one is covered the moment
 *  it's imported — zero upkeep beyond refreshing the registry copy. */
const extractReferences = (
  src: string,
  registry: Record<string, { name: string; docs: string }>,
): Record<string, Reference> => {
  const refs: Record<string, Reference> = {}
  const importRe = /import\s*\{([^}]*)\}\s*from\s*'@\/components\/ui\/([\w-]+)'/g
  for (let m = importRe.exec(src); m !== null; m = importRe.exec(src)) {
    const entry = registry[m[2]]
    if (!entry) continue // not a real shadcn registry component → don't link
    for (const raw of m[1].split(',')) {
      const name = raw
        .trim()
        .replace(/^type\s+/, '')
        .split(/\s+as\s+/)[0]
        .trim()
      if (name)
        refs[name] = { doc: `shadcn/ui ${name} — opens the Base UI docs.`, href: entry.docs }
    }
  }
  return refs
}

type Decoration = {
  start: { line: number; character: number }
  end: { line: number; character: number }
  properties: Record<string, string>
}

/** Shiki decorations marking the first occurrence of each referenced identifier
 *  (whole-word) as a hoverable, clickable `code-note` link. Sorted, non-overlapping. */
const referenceDecorations = (code: string, refs: Record<string, Reference>): Decoration[] => {
  const lines = code.split('\n')
  const decos: Decoration[] = []
  for (const [name, ref] of Object.entries(refs)) {
    const re = new RegExp(`\\b${name}\\b`)
    for (let line = 0; line < lines.length; line++) {
      const at = lines[line].search(re)
      if (at === -1) continue
      decos.push({
        start: { line, character: at },
        end: { line, character: at + name.length },
        properties: {
          class: 'code-note',
          'data-note': ref.doc,
          'data-href': ref.href,
          tabindex: '0',
          role: 'link',
          'aria-label': ref.doc,
        },
      })
      break // first occurrence per identifier — avoids underlining every usage
    }
  }
  return decos.sort((a, b) => a.start.line - b.start.line || a.start.character - b.start.character)
}

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

/** Field binding definitions from fields.tsx, by name. Shapes:
 *  baked     `export const InputField = insane.field({ … })`
 *  function  `export const SelectField = <T>(values) => insane.field({ … })`
 *            (both end at the close of their `insane.field(…)` call)
 *  object    `export const X = { … }`  (balance the braces)
 * Non-field consts (no `insane.field(` before the next export) are skipped. */
const extractFieldDefs = (src: string): Record<string, string> => {
  const defs: Record<string, string> = {}
  const re = /export const (\w+) = /g
  for (let m = re.exec(src); m !== null; m = re.exec(src)) {
    const afterEq = m.index + m[0].length
    let close = -1
    if (src[afterEq] === '{') {
      close = matchBracket(src, afterEq, '{', '}')
    } else {
      const fieldAt = src.indexOf('insane.field(', afterEq)
      const nextExport = src.indexOf('\nexport const ', afterEq)
      if (fieldAt !== -1 && (nextExport === -1 || fieldAt < nextExport)) {
        close = matchBracket(src, fieldAt + 'insane.field('.length - 1, '(', ')')
      }
    }
    if (close !== -1) defs[m[1]] = src.slice(m.index, close + 1)
  }
  return defs
}

/** Slice a top-level `const NAME = (…) => …` arrow definition (a widget helper
 *  like DatePickerWidget) by name — from `const NAME` to the close of its arrow
 *  body. Lets a binding that delegates to a named widget (`widget: DatePickerWidget`)
 *  show that widget's composition in the panel. undefined if NAME isn't such a const. */
const extractConstArrow = (src: string, name: string): string | undefined => {
  const m = new RegExp(`(?:export )?const ${name} = `).exec(src)
  if (!m) return undefined
  const arrowAt = src.indexOf('=>', m.index + m[0].length)
  if (arrowAt === -1) return undefined
  let i = arrowAt + 2
  while (i < src.length && src[i] !== '(' && src[i] !== '{') i++
  const open = src[i]
  if (open !== '(' && open !== '{') return undefined
  const close = matchBracket(src, i, open, open === '(' ? ')' : '}')
  return close === -1 ? undefined : src.slice(m.index, close + 1)
}

/** Shell definitions from fields.tsx, by name. A shell is `const X: Shell =
 *  (props) => …` (exported or not — we read the source text, not the module).
 *  Slice from `const X` to the close of the arrow body (balance its `(`/`{`). */
const extractShellDefs = (src: string): Record<string, string> => {
  const defs: Record<string, string> = {}
  const re = /(?:export )?const (\w+): Shell = /g
  for (let m = re.exec(src); m !== null; m = re.exec(src)) {
    const arrowAt = src.indexOf('=>', m.index + m[0].length)
    if (arrowAt === -1) continue
    let i = arrowAt + 2
    while (i < src.length && src[i] !== '(' && src[i] !== '{') i++
    const open = src[i]
    if (open !== '(' && open !== '{') continue
    const close = matchBracket(src, i, open, open === '(' ? ')' : '}')
    if (close !== -1) defs[m[1]] = src.slice(m.index, close + 1)
  }
  return defs
}

/** Shell-definition view: the shell(s) the story's fields use (each field def
 * carries `shell: X`), followed by the story's render body as a usage example. */
const shellDefView = (
  body: string,
  fieldDefs: Record<string, string>,
  shellDefs: Record<string, string>,
): string => {
  const retAt = body.search(/\n\s*return[\s(]/)
  const schema = (retAt === -1 ? body : body.slice(0, retAt)).trim()
  const usedFields = Object.keys(fieldDefs).filter((name) =>
    new RegExp(`\\b${name}\\b`).test(schema),
  )
  const shells = new Set<string>()
  for (const f of usedFields)
    for (const m of fieldDefs[f].matchAll(/shell:\s*(\w+)/g)) if (shellDefs[m[1]]) shells.add(m[1])
  const defs = [...shells].map((s) => shellDefs[s]).join('\n\n')
  return defs ? `${defs}\n\n${body.trim()}` : body.trim()
}

/** Field-definition view: each featured binding's definition + the example
 * schema, boilerplate (the ZodForm/Button render) dropped. A binding that
 * delegates to a named widget const (`widget: DatePickerWidget`) also gets that
 * widget's body prepended, so the panel shows the real composition, not a ref. */
const fieldDefView = (body: string, fieldDefs: Record<string, string>, src: string): string => {
  // Slice off everything from the `return (…)` onward — keep the schema setup.
  const retAt = body.search(/\n\s*return[\s(]/)
  const schema = (retAt === -1 ? body : body.slice(0, retAt)).trim()
  // Which field bindings does this schema use? Keep them in order of appearance.
  const used = Object.keys(fieldDefs)
    .map((name) => ({ name, at: schema.search(new RegExp(`\\b${name}\\b`)) }))
    .filter((x) => x.at !== -1)
    .sort((a, b) => a.at - b.at)
  // Widget consts referenced by `widget: Name` in those bindings — show their body.
  const helpers: string[] = []
  const seen = new Set<string>()
  for (const x of used)
    for (const m of fieldDefs[x.name].matchAll(/widget:\s*([A-Z]\w+)/g)) {
      if (seen.has(m[1])) continue
      seen.add(m[1])
      const def = extractConstArrow(src, m[1])
      if (def) helpers.push(def)
    }
  const defs = [...helpers, ...used.map((x) => fieldDefs[x.name])].join('\n\n')
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
      const fieldsSrc = readFileSync(fieldsFile, 'utf8')
      const fieldDefs = extractFieldDefs(fieldsSrc)
      const shellDefs = extractShellDefs(fieldsSrc)
      const registryFile = path.resolve(import.meta.dirname, 'shadcn-registry.json')
      this.addWatchFile(registryFile)
      const references = extractReferences(fieldsSrc, loadRegistry(registryFile))
      // "No black boxes" for OUR OWN symbols: bindings/shells link to their Storybook
      // page. Same crossref file the code-panel-coverage skill reads, so a symbol is
      // "covered" iff it actually renders a link here. Registry links win on clashes.
      const crossrefFile = path.resolve(import.meta.dirname, 'code-panel-crossref.json')
      this.addWatchFile(crossrefFile)
      const crossref = JSON.parse(readFileSync(crossrefFile, 'utf8')) as Record<string, string>
      for (const [name, href] of Object.entries(crossref))
        references[name] ??= { doc: `insane-forms ${name} — opens its Storybook page.`, href }

      const files = readdirSync(dir).filter((f) => f.endsWith('.stories.tsx'))
      const highlighter = await createHighlighter({ langs: ['tsx'], themes: [THEME] })

      const map: Record<string, Record<string, string>> = {}
      for (const file of files) {
        const full = path.join(dir, file)
        this.addWatchFile(full)
        const raw = readFileSync(full, 'utf8')
        const fieldDefMode = raw.includes(FIELD_DEF_MARKER)
        const shellDefMode = raw.includes(SHELL_DEF_MARKER)
        const byName: Record<string, string> = {}
        for (const { name, body } of extractStories(raw)) {
          const code = shellDefMode
            ? shellDefView(body, fieldDefs, shellDefs)
            : fieldDefMode
              ? fieldDefView(body, fieldDefs, fieldsSrc)
              : body
          byName[name] = highlighter.codeToHtml(code, {
            lang: 'tsx',
            theme: THEME,
            decorations: referenceDecorations(code, references),
          })
        }
        map[file] = byName
      }
      return `export default ${JSON.stringify(map)}`
    },
  }
}
