// Build-time Shiki-highlighted code per story (file basename → story name → HTML).
import codeMap from 'virtual:insane-code-panel'
import type { Preview } from '@storybook/react-vite'
import { emitTransformCode, useChannel, useEffect } from 'storybook/preview-api'
import { CODE_PANEL_EVENT, CODE_PANEL_REQUEST, type CodePanelPayload } from './code-panel.shared'
/* Pure shadcn/ui default theme — the docs-page (bureau) styling is deliberately
 * NOT loaded here. Storybook shows the library through stock shadcn only. */
// Relative (not the @ alias) so Tailwind anchors its @source globs to the real
// file location (packages/ui/globals.css) — critical for the production build.
import '../../../packages/ui/globals.css'
// Shared style-biome tokens (biome stories render in Storybook too).
import '@insane-forms/examples/biomes.css'
// Loaded after globals so the scoped `.theme-*` overrides win (see the file).
import '@insane-forms/examples/demo-themes.css'
import { Toaster } from '@/components/ui/sonner'
import { type AppVariant, DEMO_APPS, type DemoParam } from '../stories/demo-shell'

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

/** Look up this story's pre-highlighted HTML (built at build time by the
 * code-panel Vite plugin), keyed by source file basename + display name. */
const codeForStory = (ctx: {
  name?: unknown
  parameters?: { fileName?: unknown }
}): CodePanelPayload => {
  const file = typeof ctx.parameters?.fileName === 'string' ? ctx.parameters.fileName : undefined
  const base = file?.split('/').pop()
  const name = typeof ctx.name === 'string' ? ctx.name : undefined
  return { html: (base && name && codeMap[base]?.[name]) || null }
}

const preview: Preview = {
  parameters: {
    layout: 'padded',
    docs: {
      // Our custom build-time-highlighted "Code" panel replaces the built-in
      // canvas code panel; the Docs tab still renders source via `source` below.
      codePanel: false,
      source: { type: 'code', transform: showRenderBody },
    },
    // Trim the noise panels — these examples are schema-driven, not arg-driven.
    controls: { disable: true },
    actions: { disable: true },
    // Axe checks run per story; 'error' makes violations FAIL the vitest run,
    // so a11y regressions in shells/widgets gate ci like any other test.
    a11y: { test: 'error' },
    options: {
      storySort: {
        order: [
          'Introduction',
          'Examples',
          ['Forms', 'Collections', 'Editable table', 'Multi-step', 'Nested modals', 'URL state'],
          'Field behaviors',
          'Integration examples',
          ['shadcn ui', ['Widgets', 'Derived widgets', 'Shells'], 'Form engines'],
          'Misc',
          'Tests',
        ],
      },
    },
  },
  // Toolbar globals (built-in, no addon). Defaults live in initialGlobals.
  // `demoApp: auto` means "use each story's own parameters.demo.variant"; pick a
  // specific app to force it across all stories.
  initialGlobals: { theme: 'light', demoApp: 'auto' },
  globalTypes: {
    demoApp: {
      description: 'Demo app',
      toolbar: {
        title: 'Demo app',
        icon: 'browser',
        items: [
          { value: 'auto', title: 'Per story (default)' },
          { value: 'catering', title: 'Catering' },
          { value: 'dev', title: 'Dev console' },
          { value: 'store', title: 'Store admin' },
          { value: 'none', title: 'None (bare)' },
        ],
        dynamicTitle: true,
      },
    },
    theme: {
      description: 'Theme',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story, context) => {
      // Send this story's build-time-highlighted HTML to our custom Code panel
      // (it lives in the manager, so the HTML crosses over the channel). Emitted
      // on every render, plus on request when the panel mounts late.
      const emitCode = useChannel({
        [CODE_PANEL_REQUEST]: () => emitCode(CODE_PANEL_EVENT, codeForStory(context)),
      })
      useEffect(() => {
        emitCode(CODE_PANEL_EVENT, codeForStory(context))
      })
      // With source.type 'code' the react jsxDecorator skips snippet emission,
      // so the canvas Code panel would show the raw CSF object. Emit the
      // transformed source ourselves so the panel matches the docs page.
      useEffect(() => {
        const source = context.parameters?.docs?.source?.originalSource
        if (source) void emitTransformCode(source, context)
      })
      // Toggle .dark on the iframe root so tokens, Tailwind dark: variants, AND
      // portals (dialogs/toasts) all theme together.
      useEffect(() => {
        document.documentElement.classList.toggle('dark', context.globals.theme === 'dark')
      }, [context.globals.theme])

      // Pick the app: toolbar override wins, else the story's own default. It's a
      // decorator, so none of this reaches the code panel.
      const param = context.parameters?.demo as DemoParam | undefined
      const picked = context.globals.demoApp as AppVariant | 'auto' | 'none' | undefined
      const variant = !picked || picked === 'auto' ? (param?.variant ?? 'none') : picked

      if (variant !== 'none') {
        const { Shell, themeClass, defaultPage } = DEMO_APPS[variant]
        // The example's page hint applies ONLY to its own default app; in any
        // other app, fall back to that app's built-in default page.
        const cfg = param && param.variant === variant ? param : defaultPage
        // A tinted, padded "page" (--demo-page) with the app card floating on it.
        return (
          // Mobile: full-bleed card, no page margin. Desktop (sm+): tinted margin
          // with the card floating, capped width.
          <div className={`demo-frame ${themeClass} flex min-h-screen justify-center sm:p-6`}>
            <div className="h-screen w-full max-w-[1760px] sm:h-[calc(100vh-3rem)]">
              <Shell section={cfg.section} title={cfg.title} description={cfg.description}>
                <Story />
              </Shell>
            </div>
            <Toaster />
          </div>
        )
      }
      // 'none' / unwrapped: thin wrapper on stock shadcn, bg filled so dark mode
      // covers the canvas.
      return (
        <div className="min-h-screen bg-background p-4 text-foreground">
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <Story />
          </div>
          <Toaster />
        </div>
      )
    },
  ],
}

export default preview
