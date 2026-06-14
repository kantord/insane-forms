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
  error?: string
  required: boolean
  readonly: boolean
}

/** A widget is just a render function. Its value type IS its self-init declaration.
 *  Widgets may declare EXTRA props beyond FieldProps (e.g. options) — a field's
 *  `props` mapper derives them from the schema. */
export type Widget<T> = (p: FieldProps<T>) => ReactNode
/** Constraint used in signatures: bottom-typed param so ANY widget matches (contravariance-safe). */
export type AnyWidget = (p: never) => ReactNode

/** A shell arranges chrome around one widget: same knowledge + the rendered widget. */
export type ShellProps = FieldProps<unknown> & { children: ReactNode }
export type Shell = React.ComponentType<ShellProps>

/** Maps schema facts → extra widget props (anything a widget's signature declares
 *  beyond FieldProps, e.g. `options`). Receives the MATERIAL schema — the one at
 *  the render site, after per-use derivations and wrappers — not the base the
 *  field was declared with. The resolve toolkit is the access it composes from. */
export type PropsMapper = (schema: z.ZodType) => object

export type FieldSpec = {
  schema?: z.ZodType
  widget: AnyWidget
  shell?: Shell
  initial?: unknown
  props?: PropsMapper
}

/* Compile-time guard — evaluated where field() meets a schema (the form / field-
 * constant definition site), never inside the widget. Every field must be able
 * to render from blank: (a) widget value type admits undefined, or (b) the
 * schema carries .default(value), or (c) an explicit `initial` is in the spec. */
export type ValueOf<R> = R extends (p: infer P) => ReactNode
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
   *  (e.g. an auto-add list watches its own last row via `useWatch`). */
  name: string
  label?: string
  items: CollectionItem[]
  /** Absent when adding would violate maxItems. */
  add?: () => void
  header?: ReactNode
  footer?: ReactNode
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
/* Form-engine adapter port. The ONE engine-specific surface — exactly */
/* one implementation per form library (react-hook-form, tanstack-form */
/* …). The core imports no engine; it reads the active adapter from     */
/* context. Both libraries reduce to the same three render seams.       */
/* ------------------------------------------------------------------ */

/** Local DeepPartial so the core needn't import a form library for a type. */
export type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T

/** Per-field binding the leaf renderer needs from the engine — the shape both
 *  RHF's useController and a TanStack field reduce to. */
export type FieldBinding = {
  value: unknown
  onChange: (v: unknown) => void
  onBlur: () => void
  error?: string
}

/** One array row's STABLE identity (stable across reorders). RHF gives
 *  `field.id`; the TanStack adapter must synthesize one, since TanStack keys
 *  array items by index. */
export type ArrayRow = { id: string }

/** Array operations the list renderer needs; bounds/gating stay in the core. */
export type ArrayBinding = {
  rows: ArrayRow[]
  append: (value: unknown) => void
  remove: (index: number) => void
}

/**
 * The port. Everything engine-specific lives behind these members; the core
 * reads the active adapter from context (`useAdapter`) and never imports a
 * form library. Members named `useX` are React hooks — called unconditionally
 * during render, so hook order stays stable.
 */
export type FormAdapter<Form = unknown> = {
  /** Create the form instance from a Standard-Schema + resolved defaults. */
  useForm(schema: z.ZodType, opts: { defaults?: unknown }): Form
  /** Make the instance available to nested field/array bindings below. */
  Provider: React.ComponentType<{ form: Form; children: ReactNode }>
  /** Wrap a valid-submit callback as a DOM <form> onSubmit handler. */
  onSubmit(form: Form, valid: (data: unknown) => void): React.ComponentProps<'form'>['onSubmit']
  /** Bind one leaf by name; `seed` is the core-resolved per-field default. */
  useField(name: string, seed: unknown): FieldBinding
  /** Bind one array by name (stable row ids guaranteed by the adapter). */
  useArray(name: string): ArrayBinding
  /** Reactively read the value at `name` (whole subtree). Powers wrappers that
   *  observe form state — auto-add lists, derived UI, live previews. */
  useWatch(name: string): unknown
}
