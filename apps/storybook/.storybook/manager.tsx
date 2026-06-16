import * as React from 'react'
import { AddonPanel } from 'storybook/internal/components'
import { addons, types, useAddonState, useChannel } from 'storybook/manager-api'
import {
  ADDON_ID,
  CODE_PANEL_EVENT,
  CODE_PANEL_REQUEST,
  type CodePanelPayload,
  PANEL_ID,
} from './code-panel.shared'

// The Storybook manager runs its OWN React (18), which the manager builder
// externalizes `react` to. We must create elements with that React — JSX here
// would compile to the workspace's React 19 jsx-runtime, whose elements React 18
// can't render. So build elements with createElement and skip JSX in this file.
const h = React.createElement

/** Renders the build-time-highlighted HTML the preview sends over the channel.
 * Uses Storybook's own hooks (manager-api). Shiki inlines token colors, so the
 * only CSS we need is panel layout. */
const CodePanel = ({ active }: { active: boolean }) => {
  const [html, setHtml] = useAddonState<string | null>(ADDON_ID, null)
  const emit = useChannel({
    [CODE_PANEL_EVENT]: (payload: CodePanelPayload) => setHtml(payload.html),
  })
  // The panel can mount after the first render (collapsed panel, narrow
  // viewport) — ask the preview to re-send the current story's code on mount.
  // React.useEffect (not the react-jsx runtime) uses the manager's own React.
  React.useEffect(() => {
    emit(CODE_PANEL_REQUEST)
  }, [emit])

  const body = h(
    'div',
    { className: 'insane-code-panel' },
    html
      ? h('div', { dangerouslySetInnerHTML: { __html: html } })
      : h('p', { style: { padding: 16, opacity: 0.6 } }, 'No code for this story.'),
    h(
      'style',
      null,
      // Flex chain so the Shiki <pre> (which carries the theme background) grows
      // to fill the whole panel — no panel-colored gutter around the code.
      `.insane-code-panel { height: 100%; display: flex; }
       .insane-code-panel > div { flex: 1; display: flex; }
       .insane-code-panel pre.shiki {
         flex: 1; margin: 0; padding: 16px; overflow: auto; box-sizing: border-box;
         font-size: 13px; line-height: 1.6; tab-size: 2;
         font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
       }`,
    ),
  )
  return h(AddonPanel, { active, children: body })
}

addons.register(ADDON_ID, () => {
  addons.add(PANEL_ID, {
    title: 'Code',
    type: types.PANEL,
    render: ({ active }) => h(CodePanel, { active: !!active }),
  })
})

// Make our panel the one selected by default for every story.
addons.setConfig({ selectedPanel: PANEL_ID })
