import { DateField, OtpField, SearchField } from '@insane-forms/examples/fields'
import { ZodForm } from '@insane-forms/examples/react-hook-form'
import type { Meta, StoryObj } from '@storybook/react-vite'
import * as insane from 'insane-forms'
import { Button } from '@/components/ui/button'
import { demoSubmit } from './demo'

/* Derived widgets: bindings that compose MORE than a single stock shadcn
 * primitive — a custom overlay (Search's icon + clear button) or a control that
 * wraps an external library (OTP → input-otp, Calendar → react-day-picker). The
 * widget is still one insane.field() binding; only the React it emits is richer. */
/* @code-panel:field-definition — the code panel shows each featured field's
 * binding definition + the example schema, not the form boilerplate. */
const meta: Meta = {
  title: 'Integration examples/shadcn ui/Derived widgets',
  tags: ['ai-generated'],
  parameters: { demo: { variant: 'none' } },
}
export default meta

export const SearchInput: StoryObj = {
  name: 'Search',
  render: () => {
    const schema = insane.group({
      q: SearchField.meta({ title: 'Search', placeholder: 'Search…' }),
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

export const Otp: StoryObj = {
  name: 'OTP',
  render: () => {
    const schema = insane.group({
      code: OtpField.length(6).meta({
        title: 'Verification code',
        description: 'Check your email.',
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

export const DatePicker: StoryObj = {
  name: 'Calendar (date)',
  render: () => {
    const schema = insane.group({
      when: DateField.meta({ title: 'Event date' }),
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
