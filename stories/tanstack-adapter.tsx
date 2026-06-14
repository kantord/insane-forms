// useStore is the field-subscription primitive; the form instance itself exposes
// no equivalent in this version, so we read its `.store` directly.
import { useStore, useForm as useTanstackForm } from '@tanstack/react-form'
import { createContext, type ReactNode, useContext, useEffect, useRef } from 'react'
import type * as z from 'zod'
import type { FormAdapter } from '../src'

/**
 * A TanStack Form adapter for insane-forms — written entirely in USERLAND
 * against the exported `FormAdapter` port, with no privileged access to the
 * core. That it works is the proof the library is engine-agnostic: the same
 * schemas and widgets render unchanged under a completely different engine.
 *
 * The three render seams map cleanly, with two documented wrinkles handled here:
 *  - per-field seeding: TanStack seeds at form level, so leaves fill on mount;
 *  - array identity: TanStack keys array items by INDEX, so we synthesize stable
 *    ids and splice them on remove (RHF gives this for free via field.id).
 *
 * TanStack's `AnyFormApi` collapses field-name params to `never` and omits the
 * React `.useStore` extension, so we describe the exact surface we use as a
 * small structural type and cast the instance to it once, at creation.
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

// The schema is needed at submit time to produce z.output (defaults/transforms
// applied), matching RHF's resolver semantics. Keyed by the form instance.
const schemaForForm = new WeakMap<TForm, z.ZodType>()

const FormCtx = createContext<TForm | null>(null)
const useFormInstance = (): TForm => {
  const form = useContext(FormCtx)
  if (!form) throw new Error('tanstack adapter: a field rendered outside its Provider')
  return form
}

export const tanstackFormAdapter: FormAdapter<TForm> = {
  useForm(schema, { defaults }) {
    // The real instance carries far stricter generics; cast to the surface we use.
    const form = useTanstackForm({
      defaultValues: (defaults ?? {}) as Record<string, unknown>,
      validators: { onChange: schema as never, onSubmit: schema as never },
    }) as unknown as TForm
    schemaForForm.set(form, schema)
    return form
  },

  Provider: ({ form, children }: { form: TForm; children: ReactNode }) => (
    <FormCtx.Provider value={form}>{children}</FormCtx.Provider>
  ),

  onSubmit: (form, valid) => (e) => {
    e.preventDefault()
    e.stopPropagation()
    void form.handleSubmit().then(() => {
      const parsed = schemaForForm.get(form)?.safeParse(form.state.values)
      if (parsed?.success) valid(parsed.data)
    })
  },

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
}
