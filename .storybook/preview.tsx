import type { Preview } from '@storybook/react-vite'
/* Pure shadcn/ui default theme — the docs-page (bureau) styling is deliberately
 * NOT loaded here. Storybook shows the library through stock shadcn only. */
import '../examples/shadcn/globals.css'

const preview: Preview = {
  parameters: {
    layout: 'padded',
    docs: {
      // Built-in code panel below the canvas — the schema IS the story, show it.
      codePanel: true,
      // Show the full story source (schema definitions included), not just the JSX.
      source: { type: 'code' },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 640 }}>
        <Story />
      </div>
    ),
  ],
}

export default preview
