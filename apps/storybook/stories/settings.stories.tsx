import {
  DateField,
  InputField,
  NativeSelectField,
  OtpField,
  RadioField,
  SliderField,
  SwitchField,
  ToggleField,
  ToggleGroupField,
} from '@insane-forms/examples/fields'
import { ZodForm } from '@insane-forms/examples/react-hook-form'
import type { Meta, StoryObj } from '@storybook/react-vite'
import * as insane from 'insane-forms'
import { Button } from '@/components/ui/button'
import { FieldDescription, FieldLegend, FieldSeparator, FieldSet } from '@/components/ui/field'
import { demoSubmit } from './demo'

/* A realistic Settings / Preferences page — the natural home for the configuration
 * widgets (native-select, radio, toggle, toggle-group, switch, slider) that the
 * isolated showcases demonstrate but no WORKED example exercised, plus date + OTP
 * in the contexts they actually appear (snooze, two-factor setup). */
const meta: Meta = {
  title: 'Examples/Settings',
  tags: ['ai-generated'],
  parameters: {
    layout: 'fullscreen',
    demo: {
      variant: 'dev',
      section: 'Settings',
      title: 'Preferences',
      description: 'Account, appearance, notifications, and security.',
    },
  },
}
export default meta

export const Preferences: StoryObj = {
  render: () => {
    const schema = insane.group(
      insane.wrap(
        FieldSet,
        <FieldLegend>General</FieldLegend>,
        <FieldDescription>How the app looks and where you are.</FieldDescription>,
        {
          displayName: InputField.min(2).meta({
            title: 'Display name',
            placeholder: 'Evil Rabbit',
          }),
          timezone: NativeSelectField.enum([
            'UTC',
            'Europe/Berlin',
            'America/New_York',
            'Asia/Tokyo',
          ])
            .default('UTC')
            .meta({ title: 'Time zone' }),
          theme: ToggleGroupField.enum(['Light', 'Dark', 'System'])
            .default('System')
            .meta({ title: 'Theme' }),
          compact: ToggleField.meta({ title: 'Compact mode' }),
        },
      ),
      <FieldSeparator />,
      insane.wrap(FieldSet, <FieldLegend>Billing</FieldLegend>, {
        plan: RadioField.enum(['Monthly', 'Yearly', 'Lifetime']).default('Yearly').meta({
          title: 'Plan',
          description: 'Yearly saves ~20% versus monthly.',
        }),
      }),
      <FieldSeparator />,
      insane.wrap(FieldSet, <FieldLegend>Notifications</FieldLegend>, {
        productEmails: SwitchField.meta({
          title: 'Product emails',
          description: 'Occasional news and tips.',
        }),
        digestSize: SliderField.min(0).max(50).default(10).meta({ title: 'Items per digest' }),
        snoozeUntil: DateField.optional().meta({ title: 'Snooze notifications until' }),
      }),
      <FieldSeparator />,
      insane.wrap(
        FieldSet,
        <FieldLegend>Security</FieldLegend>,
        <FieldDescription>Two-factor authentication.</FieldDescription>,
        {
          twoFactorCode: OtpField.length(6).meta({
            title: 'Authenticator code',
            description: 'Enter the 6-digit code from your app.',
          }),
        },
      ),
    )
    return (
      <ZodForm schema={schema} className="flex flex-col gap-6" onSubmit={demoSubmit}>
        <Button type="submit" className="self-start">
          Save preferences
        </Button>
      </ZodForm>
    )
  },
}
