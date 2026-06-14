import { MeadowForm } from '@insane-forms/examples/meadow'
import { ProfileForm } from '@insane-forms/examples/profile'
import { TerminalTreeForm } from '@insane-forms/examples/terminal'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { demoSubmit } from './demo'

/* The SAME example modules the landing page slices its slide code from —
 * rendered and tested here (axe gate included), so the slides can never
 * drift from working, accessible code. */
const meta: Meta = {
  title: 'Misc/Design biomes',
  tags: ['ai-generated'],
}
export default meta

export const Bureau: StoryObj = {
  render: () => (
    <div className="biome-bureau demo-pane bg-paper p-6 font-mono text-ink">
      <ProfileForm onSubmit={demoSubmit} />
    </div>
  ),
}

export const Terminal: StoryObj = {
  render: () => (
    <div className="biome-terminal bg-paper p-6 font-mono text-ink">
      <TerminalTreeForm
        value={{ name: 'root', children: [{ name: 'docs', children: [] }] }}
        onSubmit={demoSubmit}
      />
    </div>
  ),
  // The tree grows by one input per added node — same behavior the landing
  // page demos, proven here against the same module.
  play: async ({ canvas, userEvent }) => {
    const before = canvas.getAllByRole('textbox').length
    const adds = canvas.getAllByRole('button', { name: /node/i })
    const lastAdd = adds[adds.length - 1]
    if (!lastAdd) throw new Error('no add button')
    await userEvent.click(lastAdd)
    await expect(canvas.getAllByRole('textbox')).toHaveLength(before + 1)
  },
}

export const Meadow: StoryObj = {
  render: () => (
    <div className="biome-meadow rounded-3xl bg-paper p-6 text-ink">
      <MeadowForm onSubmit={demoSubmit} />
    </div>
  ),
}
