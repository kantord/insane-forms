import * as insane from 'insane-forms'
import { type ReactNode, useState } from 'react'
import { FormProvider, useFormContext, useWatch } from 'react-hook-form'
import * as z from 'zod'
import { FieldSetList, InputField } from './fields'
import { RhfFields, useZodForm } from './react-hook-form'

// Executable design specimens, not new core policy. The plain UI knows no
// insane-forms types; its binding describes how it joins the form.
const options = ['Standard', 'Express'] as const
type ChoiceProps = {
  value: string | undefined
  onChange: (value: string | undefined) => void
  onBlur: () => void
}
function DeliveryChoice({ value, onChange, onBlur }: ChoiceProps) {
  return (
    <select
      aria-label="Delivery service"
      value={value ?? ''}
      onBlur={onBlur}
      onChange={(event) => onChange(event.target.value || undefined)}
    >
      <option value="">Choose a service</option>
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </select>
  )
}

function ErrorShell({ children, error }: { children: ReactNode; error?: string }) {
  return (
    <div>
      {children}
      {error && <p role="alert">{error}</p>}
    </div>
  )
}

// In the confirmation specimen, changing the choice revokes its confirmation.
// This is application binding code, deliberately visible rather than a new flag
// or rule in the core. Reset/conditional policies remain choices to investigate.
function DeliveryBinding(props: ChoiceProps) {
  const form = useFormContext()
  return (
    <DeliveryChoice
      {...props}
      onChange={(value) => {
        props.onChange(value)
        form.setValue('confirmed', false)
      }}
    />
  )
}
const Delivery = insane.field({
  schema: z.enum(options),
  widget: (props: ChoiceProps) => <DeliveryChoice {...props} />,
  shell: ErrorShell,
})
const ConfirmableDelivery = insane.field({
  schema: z.enum(options),
  widget: (props: ChoiceProps) => <DeliveryBinding {...props} />,
  shell: ErrorShell,
})

const Suggested = insane.group({ delivery: Delivery.default('Standard') })
const Required = insane.group({ delivery: Delivery })
const Confirmation = insane
  .group({ delivery: ConfirmableDelivery.default('Standard') })
  .extend({ needsConfirmation: z.boolean(), confirmed: z.boolean() })
  .refine((data) => !data.needsConfirmation || data.confirmed, {
    path: ['confirmed'],
    message: 'Confirm the selected service.',
  })

export type ChoiceMode = 'suggested' | 'required' | 'confirmation'

function ChoiceEvidence({ mode }: { mode: ChoiceMode }) {
  const { control, register, formState } = useFormContext()
  const value = useWatch({ control, name: 'delivery' }) as string | undefined
  const needsConfirmation = useWatch({ control, name: 'needsConfirmation' }) as boolean
  const touched = formState.touchedFields.delivery === true
  const dirty = formState.dirtyFields.delivery === true
  return (
    <>
      <dl>
        <dt>Current choice</dt>
        <dd data-testid="choice-value">{value ?? 'Unset'}</dd>
        <dt>Visited</dt>
        <dd data-testid="choice-touched">{String(touched)}</dd>
        <dt>Different from starting choice</dt>
        <dd data-testid="choice-dirty">{String(dirty)}</dd>
      </dl>
      {mode === 'confirmation' && (
        <>
          <label>
            <input type="checkbox" {...register('needsConfirmation')} /> Require confirmation for
            this shipment
          </label>
          {needsConfirmation && (
            <label>
              <input type="checkbox" {...register('confirmed')} /> I confirm this delivery service
            </label>
          )}
          {formState.errors.confirmed?.message && (
            <p role="alert">{String(formState.errors.confirmed.message)}</p>
          )}
        </>
      )}
    </>
  )
}

export function ChoiceDiscovery({ mode }: { mode: ChoiceMode }) {
  const schema = mode === 'suggested' ? Suggested : mode === 'required' ? Required : Confirmation
  // These records deliberately distinguish an unset choice from a suggested one.
  const defaults =
    mode === 'required'
      ? {}
      : mode === 'suggested'
        ? { delivery: 'Standard' as const }
        : { delivery: 'Standard' as const, needsConfirmation: true, confirmed: false }
  const methods = useZodForm(schema, { defaults })
  const [submitted, setSubmitted] = useState<unknown>()
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(setSubmitted)} className="flex flex-col gap-4">
        <RhfFields schema={mode === 'confirmation' ? ConfirmablePresentation : schema} />
        <ChoiceEvidence mode={mode} />
        <div className="flex gap-3">
          <button type="submit">Save delivery</button>
          <button
            type="button"
            onClick={() => {
              methods.reset(defaults)
              setSubmitted(undefined)
            }}
          >
            Reset delivery
          </button>
        </div>
        <output aria-label="Saved delivery">
          {submitted === undefined ? 'Not saved' : JSON.stringify(submitted)}
        </output>
      </form>
    </FormProvider>
  )
}

// .extend() does not preserve the group's renderer. Render the bound subset and
// let native conditional controls above contribute the extra validation data.
const ConfirmablePresentation = insane.group({ delivery: ConfirmableDelivery.default('Standard') })

const Traveller = insane.group({ name: InputField.default('Guest').meta({ title: 'Traveller' }) })
const Travellers = insane.list(Traveller, { wrapper: FieldSetList }).meta({ title: 'Travellers' })
const EditableTrip = insane.group({ travellers: Travellers })
const BoundedTrip = insane.group({
  travellers: Travellers.min(2, 'At least two travellers are required.').max(
    3,
    'At most three travellers can be saved.',
  ),
})
const DefaultedTrip = insane.group({ travellers: Travellers.default([{ name: 'Ada' }]) })

export type CollectionMode = 'gated' | 'free' | 'schema-default'

export function CollectionDiscovery({ mode }: { mode: CollectionMode }) {
  const schema = mode === 'schema-default' ? DefaultedTrip : BoundedTrip
  // Rendering an unconstrained presentation with a bounded submission schema is
  // the current consumer workaround. Showing that extra wiring is the point.
  const presentation = mode === 'free' ? EditableTrip : schema
  const methods = useZodForm(
    schema,
    mode === 'schema-default'
      ? {}
      : {
          defaults: { travellers: [{ name: 'Ada' }, { name: 'Bea' }] },
        },
  )
  const travellers = useWatch({ control: methods.control, name: 'travellers' }) as
    | unknown[]
    | undefined
  const [submitted, setSubmitted] = useState<unknown>()
  const listError = methods.formState.errors.travellers
  // RHF field-array errors can be attached to root rather than message.
  const listMessage = listError?.root?.message ?? listError?.message
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(setSubmitted)} className="flex flex-col gap-4">
        <RhfFields schema={presentation} />
        <p>
          Traveller count: <span data-testid="traveller-count">{travellers?.length ?? 0}</span>
        </p>
        <output aria-label="Current travellers">{JSON.stringify(travellers ?? [])}</output>
        {listMessage && <p role="alert">{String(listMessage)}</p>}
        <button type="submit">Save trip</button>
        <output aria-label="Saved trip">
          {submitted === undefined ? 'Not saved' : JSON.stringify(submitted)}
        </output>
      </form>
    </FormProvider>
  )
}
