import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { Button } from '@/components/ui/button'
import { ZodForm } from '../examples/react-hook-form'
import { autoAddList, FieldSetList, InputField } from '../examples/shadcn/fields'
import * as insane from '../src'
import { demoSubmit } from './demo'

/* Dynamic lists: the add/remove chrome is gated by the same .min()/.max()
 * the validator uses — one source of truth. */
const meta: Meta = {
  title: 'Collections',
  tags: ['ai-generated'],
  parameters: {
    layout: 'fullscreen',
    demo: {
      section: 'Orders',
      title: 'Order details',
      description: 'The people and items attached to this order.',
    },
  },
}
export default meta

export const BoundedList: StoryObj = {
  name: 'Bounded list',
  render: () => {
    const Contact = insane.group({
      name: InputField.min(1).meta({ title: 'Name', placeholder: 'Evil Rabbit' }),
      email: InputField.email().meta({ title: 'Email', placeholder: 'm@example.com' }),
    })
    const schema = insane.group({
      contacts: insane
        .list(Contact, { wrapper: FieldSetList })
        .min(1)
        .max(3)
        .meta({ title: 'Emergency contacts' }),
    })
    // Add disappears at 3 contacts; Remove disappears at 1 — from .min(1).max(3).
    return (
      <ZodForm
        schema={schema}
        className="flex flex-col gap-6"
        defaults={{ contacts: [{}] }}
        onSubmit={demoSubmit}
      >
        <Button type="submit" className="self-start">
          Save contacts
        </Button>
      </ZodForm>
    )
  },
  // Proves bounds gating: Add appends rows until .max(3), then disappears;
  // Remove buttons appear once above .min(1).
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /^add$/i }))
    await userEvent.click(canvas.getByRole('button', { name: /^add$/i }))
    await expect(canvas.queryByRole('button', { name: /^add$/i })).not.toBeInTheDocument()
    await expect(canvas.getAllByRole('button', { name: /remove/i })).toHaveLength(3)
  },
}

export const AutoGrowingList: StoryObj = {
  name: 'Auto-growing list',
  render: () => {
    // No manual Add: the list keeps one empty trailing row and grows as you
    // type. Rows are single-field groups (RHF's useFieldArray expects objects).
    const Item = insane.group({
      text: InputField.meta({ title: 'Item', placeholder: 'Add an item…' }),
    })
    const schema = insane.group({
      items: insane
        .list(Item, { wrapper: autoAddList(FieldSetList) })
        .max(6)
        .meta({ title: 'Shopping list' }),
    })
    return (
      <ZodForm
        schema={schema}
        className="flex flex-col gap-6"
        defaults={{ items: [{}] }}
        onSubmit={demoSubmit}
      >
        <Button type="submit" className="self-start">
          Save list
        </Button>
      </ZodForm>
    )
  },
  // One empty row to start; typing into the last row appends a fresh one.
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getAllByLabelText(/item/i)).toHaveLength(1)
    await userEvent.type(canvas.getAllByLabelText(/item/i)[0], 'Milk')
    await expect(canvas.getAllByLabelText(/item/i)).toHaveLength(2)
    await userEvent.type(canvas.getAllByLabelText(/item/i)[1], 'Eggs')
    await expect(canvas.getAllByLabelText(/item/i)).toHaveLength(3)
  },
}

export const UnboundedList: StoryObj = {
  name: 'Unbounded list',
  render: () => {
    const Link = insane.group({
      url: InputField.url().meta({ title: 'URL', placeholder: 'https://example.com' }),
    })
    const schema = insane.group({
      links: insane.list(Link, { wrapper: FieldSetList }).meta({ title: 'Links' }),
    })
    return (
      <ZodForm
        schema={schema}
        className="flex flex-col gap-6"
        defaults={{ links: [] }}
        onSubmit={demoSubmit}
      >
        <Button type="submit" className="self-start">
          Save links
        </Button>
      </ZodForm>
    )
  },
}
