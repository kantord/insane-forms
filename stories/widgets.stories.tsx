import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { FieldDescription } from '@/components/ui/field'
import { ZodForm } from '../examples/react-hook-form'
import {
  CheckboxField,
  InputField,
  NumberField,
  selectField,
  TextareaField,
} from '../examples/shadcn/fields'
import * as insane from '../src'
import { demoSubmit } from './demo'

/* Each widget in isolation, inside a one-field live form. Submit to see the
 * parsed z.output as a toast; submit empty to see the validation path. */
const meta: Meta = {
  title: 'Widgets',
  tags: ['ai-generated'],
  // Low-level, single-field stories: the thin wrapper, stock shadcn (no portal).
  parameters: { demo: { variant: 'none' } },
}
export default meta

export const Input: StoryObj = {
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
}

export const InputWithDescription: StoryObj = {
  render: () => {
    const schema = insane.group({
      email: InputField.email().meta({
        title: 'Email',
        description: "We'll use this to send your receipt.",
        placeholder: 'm@example.com',
      }),
    })
    return (
      <ZodForm schema={schema} className="flex flex-col gap-6" onSubmit={demoSubmit}>
        <Button type="submit" className="self-start">
          Submit
        </Button>
      </ZodForm>
    )
  },
}

export const OptionalInput: StoryObj = {
  render: () => {
    const schema = insane.group({
      website: InputField.optional().meta({ title: 'Website', placeholder: 'https://example.com' }),
    })
    return (
      <ZodForm schema={schema} className="flex flex-col gap-6" onSubmit={demoSubmit}>
        <Button type="submit" className="self-start">
          Submit
        </Button>
      </ZodForm>
    )
  },
}

export const ReadOnlyInput: StoryObj = {
  render: () => {
    const schema = insane.group({
      apiKey: InputField.readonly().default('sk-1a2b3c4d').meta({ title: 'API key' }),
    })
    return (
      <ZodForm schema={schema} className="flex flex-col gap-6" onSubmit={demoSubmit}>
        <Button type="submit" className="self-start">
          Submit
        </Button>
      </ZodForm>
    )
  },
}

export const NumberInput: StoryObj = {
  name: 'Number',
  render: () => {
    const schema = insane.group({
      seats: NumberField.int().min(1).max(10).default(1).meta({
        title: 'Seats',
        description: 'Between 1 and 10.',
      }),
    })
    return (
      <ZodForm schema={schema} className="flex flex-col gap-6" onSubmit={demoSubmit}>
        <Button type="submit" className="self-start">
          Submit
        </Button>
      </ZodForm>
    )
  },
}

export const Textarea: StoryObj = {
  render: () => {
    const schema = insane.group({
      bio: TextareaField.max(160).meta({
        title: 'Bio',
        description: 'Max 160 characters.',
        placeholder: 'Tell us a little about yourself',
      }),
    })
    return (
      <ZodForm schema={schema} className="flex flex-col gap-6" onSubmit={demoSubmit}>
        <Button type="submit" className="self-start">
          Submit
        </Button>
      </ZodForm>
    )
  },
}

export const Checkbox: StoryObj = {
  render: () => {
    const schema = insane.group({
      marketing: CheckboxField.meta({
        title: 'Email me about product updates',
        description: 'You can unsubscribe at any time.',
      }),
    })
    return (
      <ZodForm schema={schema} className="flex flex-col gap-6" onSubmit={demoSubmit}>
        <Button type="submit" className="self-start">
          Submit
        </Button>
      </ZodForm>
    )
  },
}

export const Select: StoryObj = {
  render: () => {
    const schema = insane.group({
      language: selectField(
        z.enum(['English', 'French', 'German', 'Spanish']).default('English').meta({
          title: 'Language',
          description: 'Options come from the enum — nothing is declared twice.',
        }),
      ),
    })
    return (
      <ZodForm schema={schema} className="flex flex-col gap-6" onSubmit={demoSubmit}>
        <Button type="submit" className="self-start">
          Submit
        </Button>
      </ZodForm>
    )
  },
}

export const HiddenField: StoryObj = {
  name: 'Hidden field',
  render: () => {
    const schema = insane.group(
      <FieldDescription>
        The schema also carries a hidden <code>id</code>. It renders no control, yet the parse fills
        its default into the submitted output.
      </FieldDescription>,
      {
        id: insane.hidden(z.string().default('srv-000')),
        name: InputField.min(2).meta({ title: 'Name', placeholder: 'Evil Rabbit' }),
      },
    )
    return (
      <ZodForm schema={schema} className="flex flex-col gap-6" onSubmit={demoSubmit}>
        <Button type="submit" className="self-start">
          Submit
        </Button>
      </ZodForm>
    )
  },
  // Proves the hidden field's default survives parse into the submitted output
  // even though no control rendered for it. The toast portals to document.body.
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.type(canvas.getByLabelText(/name/i), 'Evil Rabbit')
    await userEvent.click(canvas.getByRole('button', { name: /submit/i }))
    const body = within(canvasElement.ownerDocument.body)
    // findByText proves arrival; sonner is mid-animation, so don't assert visibility.
    await expect(await body.findByText(/srv-000/)).toBeInTheDocument()
  },
}

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
