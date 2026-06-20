import { InputField } from '@insane-forms/examples/fields'
import { ZodForm } from '@insane-forms/examples/react-hook-form'
import type { Meta, StoryObj } from '@storybook/react-vite'
import * as insane from 'insane-forms'
import { expect, within } from 'storybook/test'
import * as z from 'zod'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FieldDescription } from '@/components/ui/field'
import { demoSubmit } from './demo'

/* Not widgets — these demonstrate how the SCHEMA drives a field: a description,
 * optionality, read-only, a hidden value. The control happens to be a shadcn
 * Input, but the behavior is insane-forms' and skin-agnostic. The code panel
 * shows the render body so the schema (the lesson) is visible. */
const meta: Meta = {
  title: 'Field behaviors',
  tags: ['ai-generated'],
  parameters: { demo: { variant: 'none' } },
}
export default meta

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

export const HelpTooltipField: StoryObj = {
  name: 'Help tooltip',
  render: () => {
    // `.meta({ help })` → an info icon beside the label with on-demand help,
    // distinct from `description` (always-visible). The shell renders it. `help`
    // is a ReactNode, so a tooltip can hold rich content (here: a Badge).
    const schema = insane.group({
      apiKey: InputField.min(1).meta({
        title: 'API key', // required → asterisk after the icon
        help: 'Find this in Settings → Developer → API keys. Treat it like a password.',
        placeholder: 'sk-…',
      }),
      nickname: InputField.optional().meta({
        title: 'Nickname', // optional → no asterisk
        help: 'Shown to other members instead of your full name.',
        placeholder: 'evilrabbit',
      }),
      coupon: InputField.optional().meta({
        title: 'Coupon',
        help: (
          <span>
            Codes are case-insensitive. Try{' '}
            <Badge variant="secondary" className="font-mono">
              WELCOME10
            </Badge>
            .
          </span>
        ),
        placeholder: 'WELCOME10',
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
