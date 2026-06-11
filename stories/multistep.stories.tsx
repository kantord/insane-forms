import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect } from 'storybook/test'
import { FormProvider } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { cn } from '@/lib/utils'
import { ShadCheck, ShadText, shadSelect } from '../examples/shadcn/fields'
import * as insane from '../src'

/* A wizard is plain user code over the public pieces: useZodForm + FormProvider
 * + Render. One schema validates everything; each step renders one section.
 * The pinned shouldUnregister: false is what keeps off-screen steps' values. */
const meta: Meta = {
  title: 'Multi-step',
  tags: ['ai-generated'],
}
export default meta

const Account = insane.group({
  name: ShadText.min(2).meta({ title: 'Name', placeholder: 'Evil Rabbit' }),
  email: ShadText.email().meta({ title: 'Email', placeholder: 'm@example.com' }),
})

const Shipping = insane.group({
  city: ShadText.min(1).meta({ title: 'City', placeholder: 'Portland' }),
  zip: ShadText.regex(/^\d{5}$/, 'Enter a 5-digit ZIP code.').meta({
    title: 'ZIP code',
    placeholder: '97201',
  }),
})

const Preferences = insane.group({
  frequency: shadSelect(
    z.enum(['Every email', 'Daily digest', 'Weekly digest']).default('Daily digest').meta({
      title: 'Email frequency',
    }),
  ),
  marketing: ShadCheck.meta({ title: 'Email me about product updates' }),
})

/* Fragments concatenate flat, so the wizard schema is just the three steps. */
const Checkout = insane.group(Account, Shipping, Preferences)

const STEPS = [
  { label: 'Account', schema: Account, fields: ['name', 'email'] },
  { label: 'Shipping', schema: Shipping, fields: ['city', 'zip'] },
  { label: 'Preferences', schema: Preferences, fields: ['frequency', 'marketing'] },
]

function MultiStepCheckout() {
  const methods = insane.useZodForm(Checkout)
  const [step, setStep] = useState(0)
  const [out, setOut] = useState<z.output<typeof Checkout> | undefined>(undefined)
  const { errors } = methods.formState
  const stepHasError = (i: number) => STEPS[i].fields.some((f) => f in errors)
  const last = step === STEPS.length - 1

  const next = async () => {
    // Validate only this step's fields; future steps stay untouched.
    if (await methods.trigger(STEPS[step].fields)) setStep(step + 1)
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-6 font-sans text-foreground">
      <Card>
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
          <CardDescription>Steps with invalid fields are highlighted.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <nav aria-label="Steps" className="flex gap-2">
            {STEPS.map((s, i) => (
              <button
                key={s.label}
                type="button"
                aria-current={i === step ? 'step' : undefined}
                onClick={() => setStep(i)}
                className={cn(
                  'flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors',
                  i === step ? 'border-primary' : 'text-muted-foreground',
                  stepHasError(i) && 'border-destructive text-destructive',
                )}
              >
                <span className="flex size-5 items-center justify-center rounded-full border text-xs">
                  {i + 1}
                </span>
                {s.label}
              </button>
            ))}
          </nav>
          <FormProvider {...methods}>
            <form
              className="flex flex-col gap-6"
              onSubmit={methods.handleSubmit((d) => setOut(d as z.output<typeof Checkout>))}
            >
              <insane.Render schema={STEPS[step].schema} name="" />
              <Field orientation="horizontal">
                <Button
                  type="button"
                  variant="outline"
                  disabled={step === 0}
                  onClick={() => setStep(step - 1)}
                >
                  Back
                </Button>
                {last ? (
                  <Button type="submit">Place order</Button>
                ) : (
                  <Button type="button" onClick={next}>
                    Next
                  </Button>
                )}
              </Field>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
      {out !== undefined && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Submitted values</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto text-xs">{JSON.stringify(out, null, 2)}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export const Checkout_: StoryObj = {
  name: 'Checkout wizard',
  render: () => <MultiStepCheckout />,
  // Proves per-step gating and error highlighting: Next on an empty step shows
  // field errors and stays put (aria-current), and the step chip turns invalid.
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /next/i }))
    await canvas.findAllByRole('alert')
    const accountChip = canvas.getByRole('button', { name: /1.*account/i })
    await expect(accountChip).toHaveAttribute('aria-current', 'step')
    await expect(accountChip.className).toMatch(/destructive/)
  },
}
