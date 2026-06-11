import type { Preview } from '@storybook/react-vite'
/* Pure shadcn/ui default theme — the docs-page (bureau) styling is deliberately
 * NOT loaded here. Storybook shows the library through stock shadcn only. */
import '../examples/shadcn/globals.css'
import { Toaster } from '@/components/ui/sonner'

/* The code panel shows story source; stories are authored as `render: () => {…}`,
 * but readers should see only the body — the schema and the JSX, like app code. */
const extractRenderBody = (code: string): string => {
  const marker = 'render: () => {'
  const start = code.indexOf(marker)
  if (start === -1) return code
  let i = start + marker.length
  for (let depth = 1; i < code.length && depth > 0; i++) {
    if (code[i] === '{') depth++
    else if (code[i] === '}') depth--
  }
  const lines = code
    .slice(start + marker.length, i - 1)
    .replace(/^\n/, '')
    .trimEnd()
    .split('\n')
  const indent = Math.min(
    ...lines.filter((l) => l.trim()).map((l) => (l.match(/^ */) ?? [''])[0].length),
  )
  return lines.map((l) => l.slice(indent)).join('\n')
}

const preview: Preview = {
  parameters: {
    layout: 'padded',
    docs: {
      // Built-in code panel below the canvas — the schema IS the story, show it.
      codePanel: true,
      source: { type: 'code', transform: extractRenderBody },
    },
    // Axe checks run per story; 'error' makes violations FAIL the vitest run,
    // so a11y regressions in shells/widgets gate ci like any other test.
    a11y: { test: 'error' },
    options: {
      storySort: { order: ['Introduction', 'Widgets', 'Composition', 'Collections', 'Forms', 'Multi-step'] },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 640 }}>
        <Story />
        <Toaster />
      </div>
    ),
  ],
}

export default preview
