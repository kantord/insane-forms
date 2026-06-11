import type { Preview } from '@storybook/react-vite'
import '../playground/src/style.css'

/* Stories render inside .demo-pane so they pick up the same bureau-paper form
 * chrome as the docs page — one design system, two harnesses. Stories that
 * bring their own design system (shadcn) opt out via `parameters.bureau`. */
const preview: Preview = {
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story, ctx) =>
      ctx.parameters.bureau === false ? (
        // Own design system (shadcn): full-bleed neutral canvas over the bureau body.
        <div style={{ minHeight: '100vh', background: '#ffffff', padding: '2rem' }}>
          <div style={{ maxWidth: 560 }}>
            <Story />
          </div>
        </div>
      ) : (
        <div className="demo-pane" style={{ maxWidth: 560, borderLeft: 'none' }}>
          <Story />
        </div>
      ),
  ],
}

export default preview
