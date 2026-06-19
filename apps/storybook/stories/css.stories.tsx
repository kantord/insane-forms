import { InputField } from '@insane-forms/examples/fields'
import { ZodForm } from '@insane-forms/examples/react-hook-form'
import type { Meta, StoryObj } from '@storybook/react-vite'
import * as insane from 'insane-forms'
import { expect } from 'storybook/test'
import { Button } from '@/components/ui/button'
import { demoSubmit } from './demo'

/* Smoke test, not a widget: asserts Tailwind/globals.css actually loaded in the
 * preview by reading a themed token off a rendered control. */
const meta: Meta = {
  title: 'Tests/CSS',
  tags: ['ai-generated'],
  parameters: { demo: { variant: 'none' } },
}
export default meta

export const CssCheck: StoryObj = {
  render: () => {
    const schema = insane.group({
      name: InputField.min(2).meta({ title: 'Name', placeholder: 'Evil Rabbit' }),
    })
    return (
      <ZodForm schema={schema} className="flex flex-col gap-6" onSubmit={demoSubmit}>
        <Button type="submit" className="self-start">
          Submit
        </Button>
      </ZodForm>
    )
  },
  // The submit Button uses bg-primary (--primary: oklch(0.205 0 0) in the zinc
  // theme) — this fails if Tailwind / globals.css did not load in the preview.
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: /submit/i })
    await expect(getComputedStyle(button).backgroundColor).toBe('oklch(0.205 0 0)')
  },
}
