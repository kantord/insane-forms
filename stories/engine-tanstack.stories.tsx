import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { Button } from '@/components/ui/button'
import { ZodForm } from '../examples/react-hook-form'
import { CheckboxField, FieldSetList, InputField, NumberField } from '../examples/shadcn/fields'
import * as insane from '../src'
import { demoSubmit } from './demo'
import { TanstackZodForm } from './tanstack-adapter'

/*
 * Engine-agnostic proof: ONE schema, ONE set of widgets, rendered by two
 * different form libraries. The only difference between the stories is which
 * userland form wrapper is used — `ZodForm` (react-hook-form) vs
 * `TanstackZodForm`. The schema, widgets, shells, and the core are identical;
 * each wrapper renders `<Render … engine={…} />` with its own FieldEngine.
 */
const schema = insane.group(
  { name: InputField.min(2).meta({ title: 'Name', placeholder: 'Evil Rabbit' }) },
  { age: NumberField.meta({ title: 'Age' }) },
  { subscribed: CheckboxField.meta({ title: 'Subscribe to updates' }) },
  {
    tags: insane
      .list(insane.group({ tag: InputField.min(1).meta({ title: 'Tag' }) }), {
        wrapper: FieldSetList,
      })
      .min(1)
      .max(4),
  },
)
const defaults = { name: '', age: 18, subscribed: false, tags: [{}] }

const meta: Meta = {
  title: 'Integration examples/Form engines',
  tags: ['ai-generated'],
}
export default meta

/** The form on react-hook-form, via the `insane-forms/react-hook-form` wrapper. */
export const ReactHookForm: StoryObj = {
  render: () => (
    <ZodForm
      schema={schema}
      defaults={defaults}
      className="flex flex-col gap-6"
      onSubmit={demoSubmit}
    >
      <Button type="submit" className="self-start">
        Submit
      </Button>
    </ZodForm>
  ),
}

/** The IDENTICAL form on TanStack Form, via a userland wrapper — same schema,
 *  same widgets, different engine. */
export const TanStackForm: StoryObj = {
  render: () => (
    <TanstackZodForm
      schema={schema}
      defaults={defaults}
      className="flex flex-col gap-6"
      onSubmit={demoSubmit}
    >
      <Button type="submit" className="self-start">
        Submit
      </Button>
    </TanstackZodForm>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Editing flows through the TanStack engine's useField seam.
    const name = canvas.getByLabelText(/^name/i) as HTMLInputElement
    await userEvent.type(name, 'Evil Rabbit')
    await expect(name).toHaveValue('Evil Rabbit')
    // The list seam (useArray) adds a row via TanStack's pushFieldValue.
    await expect(canvas.getAllByLabelText(/tag/i)).toHaveLength(1)
    await userEvent.click(canvas.getByRole('button', { name: /add/i }))
    await expect(canvas.getAllByLabelText(/tag/i)).toHaveLength(2)
  },
}
