/**
 * insane — type surface.
 *
 * Every declaration here is COMPILE-TIME ONLY: `import type` everywhere, zero
 * runtime values, so this file emits nothing into the bundle. It is split out
 * from `insane.tsx` so the runtime module reads as pure logic and its line
 * count reflects the code that actually ships. The public types are re-exported
 * from `index.ts`; the internal ones (guards, shape-merge machinery) are used
 * only by `insane.tsx` and never leave the package.
 */
import type * as React from 'react'
import type { ReactElement, ReactNode } from 'react'
import type * as z from 'zod'

/* ------------------------------------------------------------------ */
/* Introspection types.                                                */
/* ------------------------------------------------------------------ */

/**
 * The slice of Zod's internal def we read, layered on Zod's own base def type.
 * Zod types its internals but exposes no per-type union for them, so the
 * optional fields are declared here — one assertion, one place to fix.
 */
export type Def = z.core.$ZodTypeDef & {
  type: string
  innerType?: z.ZodType
  getter?: () => z.ZodType
  defaultValue?: unknown
  shape?: Record<string, z.ZodType>
  element?: z.ZodType
  checks?: ReadonlyArray<{
    _zod?: { def?: { check?: string; minimum?: unknown; maximum?: unknown } }
  }>
}

/** Metadata an insane node may carry (stored via Zod's standard `.meta()`). */
export type FieldMeta = {
  component?: React.ComponentType<NodeProps>
  title?: string
  description?: string
  /** On-demand help — a shell may render it as an info-icon tooltip by the label
   *  (distinct from `description`, which is always-visible helper text). ReactNode
   *  so the tooltip can hold rich content (formatting, a Badge, code, etc.). */
  help?: ReactNode
}

/* ------------------------------------------------------------------ */
/* URL query-param codec types.                                        */
/* ------------------------------------------------------------------ */

export type QueryParam<T> = {
  parse: (raw: string) => T | null
  serialize: (value: T) => string
  eq: (a: T, b: T) => boolean
  defaultValue: T
}

/* ------------------------------------------------------------------ */
/* Render runtime types.                                               */
/* ------------------------------------------------------------------ */

export type NodeProps = {
  /** The original (possibly wrapped) schema — renderers resolve their own keys off it. */
  schema: z.ZodType
  /** The unwrapped structural schema (object shape / array element / leaf type). */
  inner: z.ZodType
  name: string
  required: boolean
  readonly: boolean
  /** The form-library bindings, threaded down the render tree from `Render`.
   *  This is how the engine reaches every node WITHOUT context, a global, or a
   *  factory — and lets two `Render` trees use two different engines at once. */
  engine: FieldEngine
}

/* ------------------------------------------------------------------ */
/* Leaf layer types.                                                   */
/* ------------------------------------------------------------------ */

/** Everything a leaf knows — handed to widget and shell alike. This is the
 *  engine-neutral contract: flat on purpose, so widgets depend on insane's
 *  shape, never on whatever the form engine nests its state into. */
export type FieldProps<T> = {
  name: string
  value: T
  onChange: (v: T) => void
  onBlur: () => void
  label?: string
  description?: string
  /** On-demand help (from `.meta({ help })`) — a shell may render it as an
   *  info-icon tooltip by the label. Distinct from `description` (always-visible). */
  help?: ReactNode
  error?: string
  required: boolean
  readonly: boolean
  /** The MATERIAL schema at this render site (after per-use derivations and
   *  wrappers). A widget that needs schema-derived config — enum options, number
   *  bounds, a fixed length, a placeholder — reads it from here with the resolve
   *  toolkit, instead of a separate `props` mapper. */
  schema: z.ZodType
}

/** The attributes `derive` produces — each maps 1:1 from the binding with no
 *  per-control decision (the pure `id={p.name}` boilerplate). */
type DerivedAttrs = {
  id: string
  name: string
  'aria-invalid': true | undefined
  'aria-required': true | undefined
  onBlur: () => void
  readOnly: boolean
}
/** `derive('id', 'name', …)` → exactly those attributes, typed precisely so the
 *  JSX spread stays checked. Bound to the field, so there's no `p` argument. */
export type Derive = <K extends keyof DerivedAttrs>(...keys: K[]) => Pick<DerivedAttrs, K>

/** The reverse-schema reader, bound to the field's schema: reads the facts the
 *  schema DECLARED — number bounds, a fixed length, enum options, an array's
 *  element, a `.meta` placeholder. Mirrors the Zod builder, inverted. */
export type SchemaReader = {
  number: () => { min: () => number | undefined; max: () => number | undefined }
  string: () => { length: () => number | undefined }
  enum: () => { options: () => readonly string[] }
  array: () => { element: () => SchemaReader }
  placeholder: () => string | undefined
}

/** A widget renders one control. Besides its FieldProps it gets two bound
 *  helpers: `derive` (boilerplate attributes) and `hint` (the schema reader);
 *  the value type IS its self-init declaration. */
export type Widget<T> = (p: FieldProps<T>, derive: Derive, hint: SchemaReader) => ReactNode
/** Constraint used in signatures: bottom-typed param so ANY widget matches (contravariance-safe). */
export type AnyWidget = (p: never, derive: Derive, hint: SchemaReader) => ReactNode

/** A shell arranges chrome around one widget: same knowledge + the rendered widget. */
export type ShellProps = FieldProps<unknown> & { children: ReactNode }
export type Shell = React.ComponentType<ShellProps>

export type FieldSpec = {
  schema?: z.ZodType
  widget: AnyWidget
  shell?: Shell
  initial?: unknown
}

/** Parametric field: a record of base-type methods, each building + binding a
 *  schema by calling the one-go field() and returning it. field() returns the
 *  record unchanged, so the methods keep their generics (enum literals survive):
 *    insane.field({ enum: (v) => field({ schema: z.enum(v), widget, shell }) })
 *  → `SelectField.enum(['A','B']).default('A')`. The `never[]` param is a
 *  bottom-typed constraint so any method matches (like AnyWidget). */
export type ParametricSpec = Record<string, (...args: never[]) => z.ZodType>

/** The DRAFT value a widget edits, derived from its schema: the schema's output
 *  WIDENED to its primitive base (so a widget handles raw DOM strings, not the
 *  narrow `'a'|'b'` enum), plus `| undefined` for the unset state UNLESS the
 *  schema carries a `.default` (then the value is always present → strict). Used
 *  as the default widget value type in field()'s one-go form, so the inline
 *  `widget: (p) => …` is typed without an annotation; a widget MAY narrow it. */
export type Widen<T> = [T] extends [string]
  ? string
  : [T] extends [number]
    ? number
    : [T] extends [boolean]
      ? boolean
      : T
export type DraftOf<S extends z.ZodType> =
  S extends z.ZodEnum<infer _M>
    ? // An enum (and array-of-enum) drafts as its widened base — `string` /
      // `string[]` — known regardless of the literal members, so this resolves even
      // when those members are still a generic (the parametric `.enum(values)` case)
      // where `Widen<z.output>` would defer.
      string | undefined
    : S extends z.ZodArray<z.ZodEnum<infer _M>>
      ? string[] | undefined
      : HasDefault<S> extends true
        ? Widen<z.output<S>>
        : Widen<z.output<S>> | undefined

/* Compile-time guard — evaluated where field() meets a schema (the form / field-
 * constant definition site), never inside the widget. Every field must be able
 * to render from blank: (a) widget value type admits undefined, or (b) the
 * schema carries .default(value), or (c) an explicit `initial` is in the spec. */
export type ValueOf<R> = R extends (p: infer P, ...args: never[]) => ReactNode
  ? P extends { value: infer V }
    ? V
    : never
  : never
export type SelfInitializing<R> = undefined extends ValueOf<R> ? true : false
export type HasDefault<S> = S extends z.ZodDefault<z.ZodType> ? true : false
export type Initialized<S, R, Sp> =
  SelfInitializing<R> extends true
    ? true
    : HasDefault<S> extends true
      ? true
      : Sp extends { initial: ValueOf<R> }
        ? true
        : false
export type GuardMsg =
  '⛔ this widget cannot render the unset state — add .default(value) to the schema or pass `initial` in the spec'
export type OneGoGuard<Sp> = Sp extends { schema: infer S extends z.ZodType; widget: infer R }
  ? Initialized<S, R, Sp> extends true
    ? unknown
    : { schema: GuardMsg }
  : never
export type CurriedGuard<S extends z.ZodType, Sp> = Sp extends { widget: infer R }
  ? Initialized<S, R, Sp> extends true
    ? unknown
    : GuardMsg
  : never

/* ------------------------------------------------------------------ */
/* Container types and shape-merge machinery.                          */
/* ------------------------------------------------------------------ */

export type FieldGroup = Record<string, z.ZodType>
/** A part is a key→schema record, a decoration, or a BUILT group used as a
 *  fragment — its shape concatenates flat into the parent (no key nesting). */
export type Part = FieldGroup | ReactElement | z.ZodObject<z.core.$ZodShape>

export type U2I<U> = (U extends unknown ? (x: U) => void : never) extends (x: infer I) => void
  ? I
  : never
export type ShapeOfPart<P> =
  P extends z.ZodObject<infer Sh> ? Sh : P extends ReactElement ? never : P
export type Merged<A extends readonly Part[]> = U2I<ShapeOfPart<A[number]>>
export type CleanShape<T> = {
  [K in keyof T as T[K] extends z.ZodType ? K : never]: T[K] extends z.ZodType ? T[K] : never
}
export type ShapeOf<A extends readonly Part[]> =
  CleanShape<Merged<A>> extends z.core.$ZodShape ? CleanShape<Merged<A>> : never

export type CollectionItem = {
  key: string
  node: ReactNode
  /** Bound per-item handler; absent when removal would violate minItems. */
  remove?: () => void
}
export type CollectionProps = {
  /** The array's field path — wrappers use it to label or OBSERVE the array
   *  (e.g. an auto-add list watches its own last row via `engine.useWatch`). */
  name: string
  label?: string
  items: CollectionItem[]
  /** Absent when adding would violate maxItems. */
  add?: () => void
  header?: ReactNode
  footer?: ReactNode
  /** The form-library bindings, threaded from `Render` — lets a wrapper observe
   *  its own array (auto-add, live previews) without context or a global. */
  engine: FieldEngine
}
export type CollectionWrapper = React.ComponentType<CollectionProps>

export type ListOpts = {
  wrapper?: CollectionWrapper
  header?: ReactElement
  footer?: ReactElement
  /** Override the append template (e.g. a prefilled row). Default: the element's
   *  declared .default(), else a bare row whose leaves self-seed on mount. */
  seed?: () => unknown
}

/* ------------------------------------------------------------------ */
/* The FieldEngine — the ONE contract between insane and a form library. */
/* It is exactly "what it takes to connect fields to the engine": three  */
/* render-time bindings, nothing more. Form creation, submit wiring, and */
/* context live in the USER's form wrapper (engine-native, out of core   */
/* scope). The core imports no engine and holds no global/context — an   */
/* engine is threaded down the render tree from `Render` (see NodeProps). */
/* ------------------------------------------------------------------ */

/** Per-field binding the leaf renderer needs — the shape both RHF's
 *  useController and a TanStack field reduce to. */
export type FieldBinding = {
  value: unknown
  onChange: (v: unknown) => void
  onBlur: () => void
  error?: string
}

/** One array row's STABLE identity (stable across reorders). RHF gives
 *  `field.id`; a TanStack adapter must synthesize one, since TanStack keys
 *  array items by index. */
export type ArrayRow = { id: string }

/** Array operations the list renderer needs; bounds/gating stay in the core. */
export type ArrayBinding = {
  rows: ArrayRow[]
  append: (value: unknown) => void
  remove: (index: number) => void
}

/**
 * The whole contract. Three hooks, called at render time under whatever form
 * context the user's wrapper set up (RHF's FormProvider, a TanStack adapter's
 * own provider, …). insane never creates the form or knows the engine — it just
 * calls these. Implement them once per library; that adapter is the ONLY
 * boilerplate connecting insane to a form engine.
 */
export type FieldEngine = {
  /** Bind one leaf by name; `seed` is the core-resolved per-field default. */
  useField(name: string, seed: unknown): FieldBinding
  /** Bind one array by name (stable row ids guaranteed by the engine). */
  useArray(name: string): ArrayBinding
  /** Reactively read the value at `name` (whole subtree). Powers wrappers that
   *  observe form state — auto-add lists, derived UI, live previews. */
  useWatch(name: string): unknown
}
