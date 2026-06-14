// useStore is the field-subscription primitive; the form instance itself exposes
// no equivalent in this version, so we read its `.store` directly.

import { createFormRenderer } from '@insane-forms/examples/create-form-renderer'
import { useStore, useForm as useTanstackForm } from '@tanstack/react-form'
import type { FieldEngine } from 'insane-forms'
import { createContext, type ReactNode, useContext, useEffect, useRef } from 'react'
import type * as z from 'zod'

/**
 * A TanStack Form binding for insane-forms — written entirely in USERLAND
 * against the exported `FieldEngine` contract, with no privileged access to the
 * core. That it works is the proof the library is engine-agnostic: the same
 * schemas and widgets render unchanged under a completely different engine.
 *
 * Two halves, mirroring the architecture:
 *  - `tanstackFieldEngine` — the three render-time bindings the core threads
 *    down a `Render` tree (the only required boilerplate). It reads the form
 *    instance from a context THIS module owns (the engine's own concern).
 *  - `TanstackZodForm` — the optional form wrapper: create the form, provide it,
 *    wire submit, render. Userland, copy-and-bend; the core never sees it.
 *
 * Wrinkles handled here: TanStack keys array items by INDEX (we synthesize
 * stable ids), and seeds at the form level (leaves fill on mount).
 */
type ErrorMap = { onChange?: Record<string, unknown>; onSubmit?: Record<string, unknown> }
type TState = { values: Record<string, unknown>; errorMap: ErrorMap }
type TForm = {
  state: TState
  store: unknown
  setFieldValue: (name: string, value: unknown) => void
  validateField: (name: string, cause: 'change' | 'blur' | 'submit') => Promise<unknown>
  pushFieldValue: (name: string, value: unknown) => void
  removeFieldValue: (name: string, index: number) => void
  handleSubmit: () => Promise<void>
}

const getByPath = (obj: unknown, path: string): unknown =>
  path
    .split('.')
    .reduce<unknown>(
      (acc, key) => (acc == null ? undefined : (acc as Record<string, unknown>)[key]),
      obj,
    )

const firstMessage = (issues: unknown): string | undefined => {
  const issue = Array.isArray(issues) ? issues[0] : undefined
  if (issue == null) return undefined
  if (typeof issue === 'string') return issue
  if (typeof issue === 'object' && 'message' in issue)
    return String((issue as { message: unknown }).message)
  return undefined
}

// The schema produces z.output at submit (defaults/transforms applied), matching
// a resolver's semantics. Keyed by the form instance.
const schemaForForm = new WeakMap<TForm, z.ZodType>()

const FormCtx = createContext<TForm | null>(null)
const useFormInstance = (): TForm => {
  const form = useContext(FormCtx)
  if (!form) throw new Error('tanstack engine: a field rendered outside <TanstackZodForm>')
  return form
}

export const tanstackFieldEngine: FieldEngine = {
  useField(name, seed) {
    const form = useFormInstance()
    const value = useStore<TState, unknown>(form.store as never, (s) => getByPath(s.values, name))
    const errorMap = useStore<TState, ErrorMap>(form.store as never, (s) => s.errorMap)
    const issues = errorMap?.onChange?.[name] ?? errorMap?.onSubmit?.[name]
    // Lazy per-field seed (TanStack seeds at the form level, not per field).
    useEffect(() => {
      if (getByPath(form.state.values, name) === undefined && seed !== undefined)
        form.setFieldValue(name, seed)
    }, [])
    return {
      value: value === undefined ? seed : value,
      onChange: (v) => form.setFieldValue(name, v),
      onBlur: () => void form.validateField(name, 'blur'),
      error: firstMessage(issues),
    }
  },

  useArray(name) {
    const form = useFormInstance()
    const rows =
      (useStore<TState, unknown>(form.store as never, (s) => getByPath(s.values, name)) as
        | unknown[]
        | undefined) ?? []
    const ids = useRef<string[]>([])
    const counter = useRef(0)
    // Reconcile synthetic stable ids to the live length. remove() splices the id
    // at its index, so rows after the removed one keep their identity.
    while (ids.current.length < rows.length) ids.current.push(`row-${counter.current++}`)
    if (ids.current.length > rows.length) ids.current.length = rows.length
    return {
      rows: rows.map((_, i) => ({ id: ids.current[i] })),
      append: (value) => form.pushFieldValue(name, value),
      remove: (index) => {
        form.removeFieldValue(name, index)
        ids.current.splice(index, 1)
      },
    }
  },

  useWatch(name) {
    const form = useFormInstance()
    return useStore<TState, unknown>(form.store as never, (s) => getByPath(s.values, name))
  },
}

/** The engine bound into a schema-only renderer — same sugar the RHF example uses. */
const TanstackFields = createFormRenderer(tanstackFieldEngine)

/** Userland form wrapper on TanStack Form — the counterpart to ZodForm. The only
 *  insane-specific line is the `<Render … engine={tanstackFieldEngine} />`. */
export function TanstackZodForm<S extends z.ZodType>({
  schema,
  defaults,
  onSubmit,
  children,
  className,
}: {
  schema: S
  defaults?: Record<string, unknown>
  onSubmit: (data: z.output<S>) => void
  children?: ReactNode
  className?: string
}) {
  const form = useTanstackForm({
    defaultValues: defaults ?? {},
    validators: { onChange: schema as never, onSubmit: schema as never },
  }) as unknown as TForm
  schemaForForm.set(form, schema)
  return (
    <FormCtx.Provider value={form}>
      <form
        className={className}
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          void form.handleSubmit().then(() => {
            const parsed = schemaForForm.get(form)?.safeParse(form.state.values)
            if (parsed?.success) onSubmit(parsed.data as z.output<S>)
          })
        }}
      >
        <TanstackFields schema={schema} />
        {children}
      </form>
    </FormCtx.Provider>
  )
}
