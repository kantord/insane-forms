import type { Preview } from '@storybook/react-vite'
import '../playground/src/style.css'

/* Stories render inside .demo-pane so they pick up the same bureau-paper form
 * chrome as the docs page — one design system, two harnesses. */
const preview: Preview = {
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div className="demo-pane" style={{ maxWidth: 560, borderLeft: 'none' }}>
        <Story />
      </div>
    ),
  ],
}

export default preview
