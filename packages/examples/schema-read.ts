/** The reverse of building a schema: read the facts a schema DECLARED — number
 * bounds, a fixed length, enum options, an array's element, a `.meta` placeholder.
 * Mirrors the Zod builder so a widget reads what it needs off its own `p.schema`:
 *
 *   readSchema(p.schema).number().min()                       // → number | undefined
 *   readSchema(p.schema).string().length()                    // → number | undefined
 *   readSchema(p.schema).enum().options()                     // → readonly string[]
 *   readSchema(p.schema).array().element().enum().options()   // multi-select
 *   readSchema(p.schema).placeholder()                        // → string | undefined
 *
 * Userland sugar over the core `resolve` toolkit — core ships only `p.schema`, and
 * how to read it back is a binding-layer concern, kept here. */

import { resolve, resolveInner } from 'insane-forms'
import * as z from 'zod'

type Check = { check?: string; value?: number; length?: number }

/** Validation checks on the schema's inner type (unwrapping default/optional). */
const checksOf = (s: z.ZodType): readonly Check[] =>
  (
    (resolveInner(s) as { _zod?: { def?: { checks?: readonly unknown[] } } })._zod?.def?.checks ??
    []
  ).map((c) => (c as { _zod?: { def?: Check } })._zod?.def ?? {})

const checkValue = (s: z.ZodType, check: string): number | undefined =>
  checksOf(s).find((c) => c.check === check)?.value

/** `.meta({ placeholder })` — a userland meta key; resolve walks wrappers for it. */
const placeholderOf = resolve<string>(
  (s) => (s.meta() as { placeholder?: string } | undefined)?.placeholder,
)

export const readSchema = (schema: z.ZodType) => ({
  // Zod 4 number .min()/.max() are greater_than/less_than checks.
  number: () => ({
    min: () => checkValue(schema, 'greater_than'),
    max: () => checkValue(schema, 'less_than'),
  }),
  // .length(n) is a length_equals check (stored under `length`, not value).
  string: () => ({
    length: () => checksOf(schema).find((c) => c.check === 'length_equals')?.length,
  }),
  enum: () => ({
    options: (): readonly string[] =>
      (resolveInner(schema) as { options?: readonly string[] }).options ?? [],
  }),
  array: () => ({
    element: () =>
      readSchema((resolveInner(schema) as { element?: z.ZodType }).element ?? z.never()),
  }),
  placeholder: () => placeholderOf(schema),
})
