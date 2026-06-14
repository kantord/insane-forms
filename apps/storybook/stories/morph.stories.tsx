import { Step2, Step3, Step4 } from '@insane-forms/examples/morph'
import { ZodForm } from '@insane-forms/examples/react-hook-form'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { demoSubmit } from './demo'

/* The landing page's schema-morph steps, rendered & tested here — the morph
 * animation displays these exact modules' source, so the story gates them
 * (render + axe) and the narrative can't drift from working code. */
const meta: Meta = {
  title: 'Misc/Schema morph',
  tags: ['ai-generated'],
}
export default meta

export const Steps: StoryObj = {
  render: () => (
    <div className="biome-bureau demo-pane flex flex-col gap-10 bg-paper p-6 font-mono text-ink">
      {[Step2, Step3, Step4].map((schema, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: fixed authored sequence
        <ZodForm key={i} schema={schema} onSubmit={demoSubmit}>
          <button type="submit">Save</button>
        </ZodForm>
      ))}
    </div>
  ),
  // Step 4 adds validation: submitting it empty must surface field errors.
  play: async ({ canvas, userEvent }) => {
    const submits = canvas.getAllByRole('button', { name: /save/i })
    const last = submits[submits.length - 1]
    if (!last) throw new Error('no submit button')
    await userEvent.click(last)
    await expect((await canvas.findAllByRole('alert')).length).toBeGreaterThanOrEqual(2)
  },
}
