import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { Button } from '@/components/ui/button'
import { CheckboxField, FieldSetList, InputField, NumberField } from '../examples/shadcn/fields'
import * as insane from '../src'
import { demoSubmit } from './demo'
import { tanstackFormAdapter } from './tanstack-adapter'

/*
 * Engine-agnostic proof: ONE schema, ONE set of widgets, rendered by two
 * different form libraries. The default export uses react-hook-form; the
 * TanStack story swaps the engine with a single <InsaneProvider adapter={…}>.
 * Nothing about the schema, the widgets, or the shells changes.
 */
const schema = insane.group(
  { name: InputField.min(2).meta({ title: 'Name', placeholder: 'Evil Rabbit' }) },
  { age: NumberField.meta({ title: 'Age' }) },
  { subscribed: CheckboxField.meta({ title: 'Subscribe to updates' }) },
  {
    tags: insane
      .list(InputField.min(1).meta({ title: 'Tag' }), { wrapper: FieldSetList })
      .min(1)
      .max(4),
  },
)
const defaults = { name: '', age: 18, subscribed: false, tags: [''] }

const Demo = () => (
  <insane.ZodForm
    schema={schema}
    defaults={defaults}
    className="flex flex-col gap-6"
    onSubmit={demoSubmit}
  >
    <Button type="submit" className="self-start">
      Submit
    </Button>
  </insane.ZodForm>
)

const meta: Meta = {
  title: 'Engine adapters',
  tags: ['ai-generated'],
}
export default meta

/** The same form on the default engine, react-hook-form. */
export const ReactHookForm: StoryObj = {
  render: () => <Demo />,
}

/** The identical form on TanStack Form — engine swapped via context only. */
export const TanStackForm: StoryObj = {
  render: () => (
    <insane.InsaneProvider adapter={tanstackFormAdapter}>
      <Demo />
    </insane.InsaneProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Editing flows through the TanStack adapter's useField seam.
    const name = canvas.getByLabelText(/^name/i) as HTMLInputElement
    await userEvent.type(name, 'Evil Rabbit')
    await expect(name).toHaveValue('Evil Rabbit')
    // The list seam (useArray) adds a row via TanStack's pushFieldValue.
    await expect(canvas.getAllByLabelText(/tag/i)).toHaveLength(1)
    await userEvent.click(canvas.getByRole('button', { name: /add/i }))
    await expect(canvas.getAllByLabelText(/tag/i)).toHaveLength(2)
  },
}
