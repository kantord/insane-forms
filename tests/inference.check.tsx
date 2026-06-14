/**
 * inference.check.tsx — PROOF that an insane form is still a plain Zod schema for
 * type purposes: `z.input` / `z.output` / `z.infer` derive exactly what the
 * equivalent hand-written Zod schema would. This file is type-only; the
 * `typecheck` gate (tsc --noEmit) fails if any assertion below is wrong, so the
 * proof runs in CI. No runtime, no test runner.
 *
 * The strategy: build a stress-test form with the insane builders, build the
 * SAME shape with bare z.object/z.array/etc., and assert their inferred types are
 * EXACTLY equal. Because both sides go through Zod's own inference, the
 * comparison can't drift on `| undefined`/optional nuances — if insane mangled a
 * type, the two would diverge and this stops compiling.
 */
import type { ReactNode } from 'react'
import * as z from 'zod'
import * as insane from '../src'

/* Exact (not just assignable) type equality — the standard invariant trick. */
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
type Expect<T extends true> = T

const Section = ({ children }: { children: ReactNode }) => children

/* ------------------------------------------------------------------ */
/* A stress-test form, built the insane way (schema IS the form).      */
/*  - hidden field with a default       (id)                           */
/*  - plain default                     (age)                          */
/*  - optional                          (nickname)                     */
/*  - DATA nesting via a keyed group    (address)                      */
/*  - wrap(): DOM grouping, data stays FLAT  (note)                    */
/*  - list of a group                   (contacts)                     */
/* ------------------------------------------------------------------ */
const InsaneForm = insane.group(
  { id: insane.hidden(z.string().default('srv-0')) },
  { name: z.string() },
  { age: z.number().default(18) },
  { nickname: z.string().optional() },
  { address: insane.group({ city: z.string(), zip: z.string().optional() }) },
  insane.wrap(Section, { note: z.string().default('') }),
  {
    contacts: insane
      .list(insane.group({ email: z.string(), primary: z.boolean().default(false) }))
      .min(1),
  },
)

/* The SAME shape, hand-written in bare Zod. wrap() is data-flat, so `note` sits
 * at the top level — exactly where this plain schema puts it. */
const PlainForm = z.object({
  id: z.string().default('srv-0'),
  name: z.string(),
  age: z.number().default(18),
  nickname: z.string().optional(),
  address: z.object({ city: z.string(), zip: z.string().optional() }),
  note: z.string().default(''),
  contacts: z.array(z.object({ email: z.string(), primary: z.boolean().default(false) })).min(1),
})

/* THE PROOF: insane's inference is byte-for-byte Zod's inference. */
type _Input = Expect<Equal<z.input<typeof InsaneForm>, z.input<typeof PlainForm>>>
type _Output = Expect<Equal<z.output<typeof InsaneForm>, z.output<typeof PlainForm>>>
type _Infer = Expect<Equal<z.infer<typeof InsaneForm>, z.infer<typeof PlainForm>>>

/* ------------------------------------------------------------------ */
/* The input/output divergence is preserved — the heart of "one schema,    */
/* two types". Defaults + hidden are OPTIONAL in the draft, REQUIRED in     */
/* the parsed output.                                                       */
/* ------------------------------------------------------------------ */

/* z.input (the draft the form edits): id/age/note/primary may all be omitted. */
const draft: z.input<typeof InsaneForm> = {
  name: 'Ada',
  address: { city: 'BCN' },
  contacts: [{ email: 'ada@example.com' }],
}

/* z.output (what onSubmit receives): the same fields are now present + typed. */
const parsed: z.output<typeof InsaneForm> = {
  id: 'srv-0',
  name: 'Ada',
  age: 18,
  address: { city: 'BCN' },
  note: '',
  contacts: [{ email: 'ada@example.com', primary: false }],
}

// @ts-expect-error — output REQUIRES the hidden, defaulted `id` that input omits.
const parsedBad: z.output<typeof InsaneForm> = {
  name: 'Ada',
  age: 18,
  address: { city: 'BCN' },
  note: '',
  contacts: [{ email: 'ada@example.com', primary: false }],
}

// @ts-expect-error — input still REQUIRES `name` (no default, not optional).
const draftBad: z.input<typeof InsaneForm> = {
  address: { city: 'BCN' },
  contacts: [{ email: 'ada@example.com' }],
}

/* wrap() is data-FLAT: `section` is not a key of the form (note is top-level),
 * while `address` (a keyed group) IS nested. */
type _NoSectionKey = Expect<
  Equal<'section' extends keyof z.input<typeof InsaneForm> ? true : false, false>
>
type _AddressIsNested = Expect<
  Equal<z.output<typeof InsaneForm>['address'], { city: string; zip?: string | undefined }>
>
type _NoteIsFlat = Expect<Equal<z.output<typeof InsaneForm>['note'], string>>

/* ------------------------------------------------------------------ */
/* Recursion (z.lazy) infers a recursive type — the standard annotated      */
/* Zod pattern works unchanged through insane's group/list.                 */
/* ------------------------------------------------------------------ */
type CategoryNode = { name: string; children: CategoryNode[] }
const Category: z.ZodType<CategoryNode> = insane.group({
  name: z.string(),
  children: insane.list(z.lazy(() => Category)),
}) as unknown as z.ZodType<CategoryNode>

const tree: z.infer<typeof Category> = {
  name: 'root',
  children: [{ name: 'docs', children: [{ name: 'api', children: [] }] }],
}
// @ts-expect-error — recursion is typed: a child must have `children`, not `kids`.
const treeBad: z.infer<typeof Category> = { name: 'root', children: [{ name: 'x', kids: [] }] }

void [draft, parsed, parsedBad, draftBad, tree, treeBad]

export type { _AddressIsNested, _Infer, _Input, _NoSectionKey, _NoteIsFlat, _Output }
