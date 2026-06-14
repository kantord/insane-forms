'use client'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import type { ReactNode } from 'react'
import {
  type DeepPartial,
  FormProvider,
  type UseFormProps,
  useController,
  useFieldArray,
  useForm,
  useWatch,
} from 'react-hook-form'
import type * as z from 'zod'
import type { FieldEngine } from '../src'
import { createFormRenderer } from './create-form-renderer'

/**
 * USERLAND react-hook-form binding — shown, NOT shipped. insane-forms publishes
 * no engine; you write (or copy) this ~30-line file once. It has three parts,
 * smallest to largest:
 *
 *  1. `reactHookFormEngine` — your hooks shaped to insane's FieldEngine. The only
 *     real work. Object-method syntax keeps it tidy. It reads RHF's own
 *     FormProvider context, so nothing insane-specific carries the instance.
 *  2. `RhfFields` — the engine bound into a schema-only renderer via the
 *     `createFormRenderer` sugar.
 *  3. `ZodForm` / `useZodForm` — a convenience FORM wrapper (create form, wire
 *     submit, provide context). The core deliberately omits this; copy and bend.
 */
export const reactHookFormEngine: FieldEngine = {
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
  useWatch(name) {
    return useWatch({ name })
  },
}

/** The engine bound once — `<RhfFields schema={…} />` renders a schema's fields
 *  anywhere inside an RHF FormProvider. */
export const RhfFields = createFormRenderer(reactHookFormEngine)

/** Power-user hook: react-hook-form's own methods (watch, trigger, getValues,
 *  reset, programmatic submit…) for orchestration a plain form wrapper doesn't
 *  cover — multi-step wizards, scoped validation, live reads. */
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

/** A convenience form wrapper on react-hook-form. The only insane-specific line
 *  is `<RhfFields schema={schema} />`; everything else is ordinary RHF setup you
 *  could write inline. Copy it if you need a different lifecycle. */
export function ZodForm<S extends z.ZodType>({
  schema,
  defaults,
  onSubmit,
  children,
  className,
}: {
  schema: S
  /** Draft seed (edit-an-existing-record). Deep-partial: the draft may be looser than z.input. */
  defaults?: DeepPartial<z.input<S>> & object
  onSubmit: (data: z.output<S>) => void
  children?: ReactNode
  /** Forwarded to the <form> element — layout belongs to the consumer. */
  className?: string
}) {
  const methods = useZodForm(schema, { defaults })
  return (
    <FormProvider {...methods}>
      <form
        className={className}
        onSubmit={methods.handleSubmit((d) => onSubmit(d as z.output<S>))}
      >
        <RhfFields schema={schema} />
        {children}
      </form>
    </FormProvider>
  )
}
