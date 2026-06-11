import type { Meta, StoryObj } from '@storybook/react-vite'
import { toast } from 'sonner'
import { expect } from 'storybook/test'
import { Button } from '@/components/ui/button'
import { FieldSetList, InputField } from '../examples/shadcn/fields'
import * as insane from '../src'

/* Dynamic lists: the add/remove chrome is gated by the same .min()/.max()
 * the validator uses — one source of truth. */
const meta: Meta = {
  title: 'Collections',
  tags: ['ai-generated'],
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
      <insane.ZodForm
        schema={schema}
        className="flex flex-col gap-6"
        defaults={{ contacts: [{}] }}
        onSubmit={(data) => toast(<pre>{JSON.stringify(data, null, 2)}</pre>)}
      >
        <Button type="submit" className="self-start">
          Save contacts
        </Button>
      </insane.ZodForm>
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
      <insane.ZodForm
        schema={schema}
        className="flex flex-col gap-6"
        defaults={{ links: [] }}
        onSubmit={(data) => toast(<pre>{JSON.stringify(data, null, 2)}</pre>)}
      >
        <Button type="submit" className="self-start">
          Save links
        </Button>
      </insane.ZodForm>
    )
  },
}
