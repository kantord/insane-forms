import type { Preview } from '@storybook/react-vite'
import { emitTransformCode, useEffect } from 'storybook/preview-api'
/* Pure shadcn/ui default theme — the docs-page (bureau) styling is deliberately
 * NOT loaded here. Storybook shows the library through stock shadcn only. */
import '../examples/shadcn/globals.css'
import { Toaster } from '@/components/ui/sonner'

/* ------------------------------------------------------------------------- */
/* Code panel: show each story's render body VERBATIM from the source file.  */
/*                                                                           */
/* Storybook's own `originalSource` is an AST re-print — it drops blank      */
/* lines and normalizes semicolons. To show real Biome-formatted code, the   */
/* transform extracts the render body from the raw file text (?raw imports), */
/* matched to the story by its display name.                                 */
/* ------------------------------------------------------------------------- */

const RAW_SOURCES = import.meta.glob('../stories/*.stories.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

/** Contents of the balanced {...} starting at `open` (which must be a '{'). */
const balancedBlock = (src: string, open: number): string => {
  let depth = 0
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++
    else if (src[i] === '}' && --depth === 0) return src.slice(open + 1, i)
  }
  return ''
}

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

const renderBodyFromFile = (fileName: unknown, storyName: unknown): string | undefined => {
  if (typeof fileName !== 'string' || typeof storyName !== 'string') return undefined
  const base = fileName.split('/').pop()
  const key = Object.keys(RAW_SOURCES).find((k) => k.split('/').pop() === base)
  const raw = key === undefined ? undefined : RAW_SOURCES[key]
  if (raw === undefined) return undefined

  const exportRe = /export const (\w+)[^=]*= \{/g
  for (let m = exportRe.exec(raw); m !== null; m = exportRe.exec(raw)) {
    const block = balancedBlock(raw, m.index + m[0].length - 1)
    const explicitName = block.match(/^\s*name: '([^']*)'/m)?.[1]
    if ((explicitName ?? startCase(m[1])) !== storyName) continue
    const at = block.indexOf('render: () => {')
    if (at === -1) return undefined
    return dedent(balancedBlock(block, at + 'render: () => {'.length - 1))
  }
  return undefined
}

/** Fallback for contexts where the raw file isn't available: extract the
 * render body from whatever source string Storybook hands us. */
const renderBodyFromCode = (code: string): string => {
  const marker = 'render: () => {'
  const start = code.indexOf(marker)
  if (start === -1) return code
  return dedent(balancedBlock(code, start + marker.length - 1))
}

type SourceContext = { name?: unknown; parameters?: { fileName?: unknown } }

const showRenderBody = (code: string, ctx?: SourceContext): string =>
  renderBodyFromFile(ctx?.parameters?.fileName, ctx?.name) ?? renderBodyFromCode(code)

const preview: Preview = {
  parameters: {
    layout: 'padded',
    docs: {
      // Built-in code panel below the canvas — the schema IS the story, show it.
      codePanel: true,
      source: { type: 'code', transform: showRenderBody },
    },
    // Axe checks run per story; 'error' makes violations FAIL the vitest run,
    // so a11y regressions in shells/widgets gate ci like any other test.
    a11y: { test: 'error' },
    options: {
      storySort: {
        order: [
          'Introduction',
          'Widgets',
          'Composition',
          'Collections',
          'Editable table',
          'Forms',
          'Multi-step',
          'Nested modals',
          'URL state',
        ],
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story, context) => {
      // With source.type 'code' the react jsxDecorator skips snippet emission,
      // so the canvas Code panel would show the raw CSF object. Emit the
      // transformed source ourselves so the panel matches the docs page.
      useEffect(() => {
        const source = context.parameters?.docs?.source?.originalSource
        if (source) void emitTransformCode(source, context)
      })
      return (
        <div style={{ maxWidth: 640 }}>
          <Story />
          <Toaster />
        </div>
      )
    },
  ],
}

export default preview
