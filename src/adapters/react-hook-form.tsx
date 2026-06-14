'use client'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import type { ReactNode } from 'react'
import {
  type DeepPartial,
  FormProvider,
  type UseFormProps,
  type UseFormReturn,
  useController,
  useFieldArray,
  useForm,
} from 'react-hook-form'
import type * as z from 'zod'
import type { FormAdapter } from '../types'

/**
 * react-hook-form adapter — the default engine. This is the ONLY module that
 * imports react-hook-form; the core stays engine-free and reaches it through
 * the FormAdapter port. The three RHF call sites the core used to hold inline
 * (useController, useFieldArray, useForm) live here, one per port member.
 */
type RhfForm = UseFormReturn<Record<string, unknown>>

const RhfProvider = ({ form, children }: { form: RhfForm; children: ReactNode }) => (
  <FormProvider {...form}>{children}</FormProvider>
)

export const reactHookFormAdapter: FormAdapter<RhfForm> = {
  useForm(schema, { defaults }) {
    return useForm<Record<string, unknown>>({
      resolver: standardSchemaResolver(schema as never),
      defaultValues: defaults as never,
      shouldUnregister: false, // pinned: hidden/passthrough values must survive
    })
  },
  Provider: RhfProvider,
  onSubmit: (form, valid) => form.handleSubmit((d) => valid(d)),
  useField(name, seed) {
    const { field, fieldState } = useController({ name, defaultValue: seed })
    return {
      value: field.value,
      onChange: field.onChange,
      onBlur: field.onBlur,
      error: fieldState.error?.message,
    }
  },
  useArray(name) {
    const fa = useFieldArray({ name })
    return {
      rows: fa.fields.map((f) => ({ id: f.id })),
      append: (value) => fa.append(value as never),
      remove: (index) => fa.remove(index),
    }
  },
}

/**
 * RHF-specific power-user hook: returns react-hook-form's own methods object
 * (watch, trigger, getValues, reset, programmatic submit…) for orchestration
 * the headless ZodForm doesn't cover — multi-step wizards, scoped validation,
 * live value reads. Because it exposes the engine directly, it is engine-bound
 * by definition (callers also import FormProvider/useWatch from react-hook-form).
 * The 90%-case `ZodForm` stays engine-agnostic via the adapter port.
 */
export function useZodForm<S extends z.ZodType>(
  schema: S,
  opts: { defaults?: DeepPartial<z.input<S>> & object } & Omit<
    UseFormProps<Record<string, unknown>>,
    'resolver' | 'defaultValues'
  > = {},
) {
  const { defaults, ...rest } = opts
  return useForm({
    resolver: standardSchemaResolver(schema as never),
    defaultValues: defaults as never,
    shouldUnregister: false, // pinned: hidden/passthrough values must survive
    ...rest,
  })
}
