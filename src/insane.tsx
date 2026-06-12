'use client'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
/**
 * insane — schema-driven forms on plain Zod + React Hook Form.
 *
 *  - Plain Zod schemas carry their renderer in `.meta({ component })`; no Proxy, no fusion.
 *  - Matchless rendering: each node invokes its own renderer; React does all traversal.
 *  - `resolve(visit)` is the one introspection primitive: a curried recursive walk down
 *    the wrapper chain. A wrapper is anything whose def has an `innerType` — the
 *    structural fact itself, not a maintained list. z.lazy is forced in passing;
 *    transforms/pipes have no innerType and are therefore opaque, by design.
 *  - The core emits ZERO DOM. Shells, list chrome, submit buttons: all user code.
 *  - undefined appears only where absence IS the information (no title, no error,
 *    no component). Where a total default exists, the API returns it instead
 *    (bounds → 0/Infinity, wrapper predicates → booleans).
 *  - Engine note: React Hook Form is deliberately hard-bound for v1, confined to three
 *    call sites (leaf → useController, list → useFieldArray, useZodForm → useForm).
 *    FieldProps is OUR consumer-driven contract — widgets and shells never see RHF.
 *
 * Terminology:
 *  - default — Zod's `.default(v)`. Data layer. Fills omitted values at parse time AND
 *              seeds the draft.
 *  - initial — `initial` on a field spec. Draft layer only; never alters parsing.
 *  - a widget's tolerance is its TYPE: value `T | undefined` means "I render the unset
 *    state"; a bare `T` makes the compiler demand `.default()` or `initial` at use site.
 */
import type * as React from 'react'
import { Fragment, isValidElement, type ReactElement, type ReactNode, useEffect } from 'react'
import {
  type DeepPartial,
  FormProvider,
  type UseFormProps,
  useController,
  useFieldArray,
  useForm,
} from 'react-hook-form'
import * as z from 'zod'

/* ------------------------------------------------------------------ */
/* Introspection. One typed boundary into Zod internals, one walk.     */
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
const def = (s: z.ZodType): Def => (s as unknown as { _zod: { def: Def } })._zod.def

/** Metadata an insane node may carry (stored via Zod's standard `.meta()`). */
export type FieldMeta = {
  component?: React.ComponentType<NodeProps>
  title?: string
  description?: string
}

/**
 * The introspection primitive. Curried: give it a visitor, get back a resolver.
 * Recurses from the outermost schema inward; the first non-undefined value the
 * visitor yields wins; an exhausted chain resolves to undefined (= absence).
 */
export const resolve = <T,>(visit: (s: z.ZodType, d: Def) => T | undefined) =>
  function go(schema: z.ZodType): T | undefined {
    const d = def(schema)
    if (d.getter) return go(d.getter()) // z.lazy: force and continue
    const hit = visit(schema, d)
    if (hit !== undefined) return hit
    return d.innerType ? go(d.innerType) : undefined // wrapper ⇔ has innerType
  }

/* All resolvers below are plain functions over `resolve` — declared, not called,
 * at module level, so they tree-shake with no /* @__PURE__ *​/ annotations needed. */

/** Per-key meta resolution: nearest definition outer→inner wins; merging is implicit. */
export const resolveMeta = <K extends keyof FieldMeta>(key: K) =>
  resolve<FieldMeta[K]>((s) => (s.meta() as FieldMeta | undefined)?.[key])

export const resolveComponent = (s: z.ZodType) => resolveMeta('component')(s)
export const resolveTitle = (s: z.ZodType) => resolveMeta('title')(s)
export const resolveDescription = (s: z.ZodType) => resolveMeta('description')(s)

/** The first non-wrapper schema in the chain (object / array / leaf type). */
export const resolveInner = (s: z.ZodType): z.ZodType =>
  resolve<z.ZodType>((n, d) => (d.innerType ? undefined : n))(s) ?? s

/** A `.default()` declared anywhere in the chain (thunks forced), else undefined. */
export const resolveDefault = (s: z.ZodType): unknown =>
  resolve<unknown>((_n, d) =>
    d.type === 'default' || d.type === 'prefault'
      ? typeof d.defaultValue === 'function'
        ? (d.defaultValue as () => unknown)()
        : d.defaultValue
      : undefined,
  )(s)

/** Does the chain contain one of these wrapper kinds? Total: always a boolean. */
const containsWrapper =
  (...kinds: string[]) =>
  (s: z.ZodType): boolean =>
    resolve<true>((_n, d) => (kinds.includes(d.type) ? true : undefined))(s) ?? false

export const isOptional = (s: z.ZodType): boolean => containsWrapper('optional', 'nullable')(s)
export const isReadonly = (s: z.ZodType): boolean => containsWrapper('readonly')(s)
export const isRequired = (s: z.ZodType): boolean => !isOptional(s)

/* ------------------------------------------------------------------ */
/* URL query-param codecs. One source of truth for URL-state libraries */
/* (nuqs et al.): each field validates its own value and already knows */
/* its default. Structurally compatible with nuqs parsers — no import, */
/* no dependency; pass `queryParams(schema)` straight to               */
/* `useQueryStates`.                                                   */
/* ------------------------------------------------------------------ */

export type QueryParam<T> = {
  parse: (raw: string) => T | null
  serialize: (value: T) => string
  eq: (a: T, b: T) => boolean
  defaultValue: T
}

/** A URL codec for one field: parse = coerce by kind + schema-validate;
 *  default = the schema's own `.default()`. A default is REQUIRED — a URL
 *  without the param must still map to a value (this is also what lets
 *  nuqs type the value as non-null). */
export function queryParam<S extends z.ZodType>(field: S): QueryParam<z.output<S>> {
  const fallback = resolveDefault(field)
  if (fallback === undefined)
    throw new Error(
      'queryParam: the field needs a .default(...) — absence from the URL must map to a value.',
    )
  const kind = def(resolveInner(field)).type
  const coerce = (raw: string): unknown =>
    kind === 'boolean' ? raw === 'true' : kind === 'number' ? Number(raw) : raw
  return {
    parse: (raw) => {
      const result = field.safeParse(coerce(raw))
      return result.success ? (result.data as z.output<S>) : null
    },
    serialize: (value) => String(value),
    eq: (a, b) => a === b,
    defaultValue: fallback as z.output<S>,
  }
}

/** Codecs for every field of an object schema, keyed like the shape. */
export function queryParams<S extends z.ZodObject<z.ZodRawShape>>(
  schema: S,
): { [K in keyof S['shape']]: QueryParam<z.output<S['shape'][K]>> } {
  return Object.fromEntries(
    Object.entries(schema.shape).map(([key, field]) => [key, queryParam(field as z.ZodType)]),
  ) as never
}

/** The live half of the bridge: push every form change into a URL-state
 *  setter (e.g. nuqs' setQueryStates). Pair with `queryParams(schema)`. */
export function useQueryParamsSync<Push extends (values: never) => unknown>(
  form: {
    watch: (onChange: (values: Record<string, unknown>) => void) => { unsubscribe: () => void }
  },
  push: Push,
): void {
  useEffect(() => {
    const subscription = form.watch(
      (values) => void (push as unknown as (v: unknown) => unknown)(values),
    )
    return () => subscription.unsubscribe()
  }, [form, push])
}

/* ------------------------------------------------------------------ */
/* Matchless render runtime. The core adds no DOM.                     */
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

/*
 * "Every node carries a renderer" is enforced STRUCTURALLY at build time, not by a
 * separate audit: `.meta()` doesn't change a schema's TypeScript type, so the rule
 * can't be static — instead each constructor validates its direct inputs the moment
 * it runs (group checks every child it splices; list checks its element). Nesting
 * gives recursion for free: an inner group checked its own children when IT was
 * built. A schema build that emits no warning cannot contain the mistake.
 * Render's warning below remains only as the last-resort net for hand-rolled trees.
 */
const dev = (): boolean =>
  (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV !==
  'production'

/** Build-time check that NEVER forces z.lazy: a lazy child is deferred-and-fine —
 *  its inner group validates its own children the moment the getter runs (the
 *  earliest the information can exist). Forcing here would recurse forever on
 *  self-referential schemas. */
const rendersOrDeferred = (s: z.ZodType): boolean => {
  const d = def(s)
  if (d.getter) return true // lazy: deferred
  if ((s.meta() as FieldMeta | undefined)?.component) return true
  return d.innerType ? rendersOrDeferred(d.innerType) : false
}

export function Render({ schema, name }: { schema: z.ZodType; name: string }) {
  const ResolvedComponent = resolveComponent(schema)
  if (!ResolvedComponent) {
    if (typeof console !== 'undefined')
      console.warn(
        `[insane] no renderer for "${name || '(root)'}" — attach one via field(), group(), list(), or hidden().`,
      )
    return null
  }
  return (
    <ResolvedComponent
      schema={schema}
      inner={resolveInner(schema)}
      name={name}
      required={isRequired(schema)}
      readonly={isReadonly(schema)}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Leaf layer: field() stitches schema + widget + shell + initial +    */
/* a props mapper, in one named-argument spec.                         */
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
/* Constraint used in signatures: bottom-typed param so ANY widget matches (contravariance-safe). */
type AnyWidget = (p: never) => ReactNode

/** A shell arranges chrome around one widget: same knowledge + the rendered widget. */
export type ShellProps = FieldProps<unknown> & { children: ReactNode }
export type Shell = React.ComponentType<ShellProps>
/** No-op shell: renders the widget bare. The default — the core owns no chrome. */
const BareShell: Shell = ({ children }) => <Fragment>{children}</Fragment>

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
type ValueOf<R> = R extends (p: infer P) => ReactNode
  ? P extends { value: infer V }
    ? V
    : never
  : never
type SelfInitializing<R> = undefined extends ValueOf<R> ? true : false
type HasDefault<S> = S extends z.ZodDefault<z.ZodType> ? true : false
type Initialized<S, R, Sp> =
  SelfInitializing<R> extends true
    ? true
    : HasDefault<S> extends true
      ? true
      : Sp extends { initial: ValueOf<R> }
        ? true
        : false
type GuardMsg =
  '⛔ this widget cannot render the unset state — add .default(value) to the schema or pass `initial` in the spec'
type OneGoGuard<Sp> = Sp extends { schema: infer S extends z.ZodType; widget: infer R }
  ? Initialized<S, R, Sp> extends true
    ? unknown
    : { schema: GuardMsg }
  : never
type CurriedGuard<S extends z.ZodType, Sp> = Sp extends { widget: infer R }
  ? Initialized<S, R, Sp> extends true
    ? unknown
    : GuardMsg
  : never

/* Two call shapes, one name. The first two `function field` lines are overload
 * SIGNATURES — types only, no bodies; the third is the single implementation. */
export function field<const Sp extends FieldSpec & { schema: z.ZodType }>(
  spec: Sp & OneGoGuard<Sp>,
): Sp['schema'] // one go: field({ schema, widget, … })
export function field<const Sp extends FieldSpec & { schema?: never }>(
  spec: Sp,
): <S extends z.ZodType>(schema: S & CurriedGuard<S, Sp>) => S // curried: field({ widget, … }) → (schema) => schema
export function field(spec: FieldSpec): unknown {
  if (spec.schema) return annotateLeaf(spec.schema, spec)
  return (schema: z.ZodType) => annotateLeaf(schema, spec)
}

function annotateLeaf(schema: z.ZodType, spec: FieldSpec): z.ZodType {
  const ShellC = spec.shell ?? BareShell
  const widget = spec.widget as Widget<unknown>
  const Leaf = (p: NodeProps) => {
    const { field: f, fieldState } = useController({
      name: p.name,
      // per-field draft seeding: declared .default() wins, else the explicit initial
      defaultValue: resolveDefault(p.schema) ?? spec.initial,
    })
    /* Flattening the engine's nested state into FieldProps is the seam, not an
     * accident: widgets/shells get insane's flat contract and never import RHF. */
    const props: FieldProps<unknown> = {
      name: p.name,
      value: f.value,
      onChange: f.onChange,
      onBlur: f.onBlur,
      label: resolveTitle(p.schema),
      description: resolveDescription(p.schema),
      error: fieldState.error?.message,
      required: p.required,
      readonly: p.readonly,
    }
    const extra = spec.props?.(p.schema) ?? {}
    return <ShellC {...props}>{widget({ ...props, ...extra })}</ShellC>
  }
  return schema.meta({ component: Leaf } satisfies FieldMeta)
}

/**
 * Value the form keeps and submits, but never shows. Renders null — not an
 * <input type="hidden">: in a controlled form the value lives in JS state (and
 * .default() fills it at parse), so a DOM node adds nothing; hidden inputs only
 * matter for native (no-JS) posts, which a controlled library doesn't do. If you
 * need one (progressive enhancement), it's just a widget:
 *   field({ schema, widget: (p) => <input type="hidden" name={p.name} value={String(p.value)} /> })
 */
const HiddenRenderer = () => null
export const hidden = <S extends z.ZodType>(s: S): S =>
  s.meta({ component: HiddenRenderer } satisfies FieldMeta) as S

/* ------------------------------------------------------------------ */
/* Containers. Names encode the static/dynamic axis (group / list),    */
/* NOT the JSON type — deliberately distinct from z.object / z.array.  */
/*   group — static: fixed, heterogeneous, decorations interleave      */
/*           anywhere (per-slot authoring licenses positions).         */
/*   list  — dynamic: runtime-length, homogeneous, decorations are     */
/*           boundary-only (there are no authorable mid positions).    */
/* The other cells of the grid — dynamic keys (z.record), static       */
/* positions (z.tuple), unique items (z.set) — are the deferred kinds; */
/* at that point the shared mechanics below graduate into the          */
/* collection(ctor) higher-order builder.                              */
/* ------------------------------------------------------------------ */

type FieldGroup = Record<string, z.ZodType>
/** A part is a key→schema record, a decoration, or a BUILT group used as a
 *  fragment — its shape concatenates flat into the parent (no key nesting). */
type Part = FieldGroup | ReactElement | z.ZodObject<z.core.$ZodShape>

type U2I<U> = (U extends unknown ? (x: U) => void : never) extends (x: infer I) => void ? I : never
type ShapeOfPart<P> = P extends z.ZodObject<infer Sh> ? Sh : P extends ReactElement ? never : P
type Merged<A extends readonly Part[]> = U2I<ShapeOfPart<A[number]>>
type CleanShape<T> = {
  [K in keyof T as T[K] extends z.ZodType ? K : never]: T[K] extends z.ZodType ? T[K] : never
}
type ShapeOf<A extends readonly Part[]> =
  CleanShape<Merged<A>> extends z.core.$ZodShape ? CleanShape<Merged<A>> : never

/**
 * Static container. Args are fragments (key→schema records) and decorations
 * (JSX elements), in authored order. The fragments CONCATENATE into one flat
 * z.object — insertion order is render order, so the value looks like a single
 * collection to Zod while the segmentation exists only for rendering.
 * Decorations need no `key` props: each authored position is itself stable,
 * so the renderer keys them positionally.
 */
export function group<const A extends readonly Part[]>(...parts: A): z.ZodObject<ShapeOf<A>> {
  const shape: Record<string, z.ZodType> = {}
  const sections: Array<ReactElement | string[] | z.ZodType> = []
  const spliceKeys = (record: Record<string, z.ZodType>) => {
    const keys = Object.keys(record)
    for (const k of keys) {
      if (dev() && /^\d+$/.test(k))
        console.warn(
          `[insane] numeric field name "${k}" — JS enumerates integer-like keys first, breaking authored order.`,
        )
      if (dev() && !rendersOrDeferred(record[k]))
        console.warn(
          `[insane] group: "${k}" has no renderer — annotate it via field()/group()/list()/hidden().`,
        )
      shape[k] = record[k]
    }
    return keys
  }
  for (const part of parts) {
    if (isValidElement(part)) {
      sections.push(part)
      continue
    }
    if (part instanceof z.ZodType) {
      // built fragment: concatenate its shape flat; let it render its own segment
      const sub = def(part).shape ?? {}
      if (resolveComponent(part)) {
        for (const k of Object.keys(sub)) shape[k] = sub[k]
        sections.push(part) // rendered at the PARENT's path → children stay flat
      } else {
        sections.push(spliceKeys(sub)) // raw z.object: splice keys, check children
      }
      continue
    }
    sections.push(spliceKeys(part as FieldGroup))
  }
  const GroupRenderer = (p: NodeProps) => (
    <Fragment>
      {sections.map((sec, i) =>
        isValidElement(sec) ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: sections is an authored static sequence — positions never reorder at runtime
          <Fragment key={`deco:${i}`}>{sec}</Fragment>
        ) : sec instanceof z.ZodType ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: same authored static sequence
          <Render key={`frag:${i}`} schema={sec} name={p.name} />
        ) : (
          sec.map((k) => <Render key={k} schema={shape[k]} name={p.name ? `${p.name}.${k}` : k} />)
        ),
      )}
    </Fragment>
  )
  return z
    .object(shape)
    .meta({ component: GroupRenderer } satisfies FieldMeta) as unknown as z.ZodObject<ShapeOf<A>>
}

/** Visual grouping WITHOUT data nesting: same concatenation semantics as group,
 *  with a React wrapper around the rendered segment. Used as a fragment part,
 *  it adds DOM while the data stays flat. */
export function wrap<const A extends readonly Part[]>(
  Wrapper: React.ComponentType<{ children: ReactNode }>,
  ...parts: A
): z.ZodObject<ShapeOf<A>> {
  const g = group(...parts)
  const Inner = resolveComponent(g) ?? (() => null) // group() always stamps one
  return g.meta({
    component: (p: NodeProps) => (
      <Wrapper>
        <Inner {...p} />
      </Wrapper>
    ),
  } satisfies FieldMeta) as typeof g
}

export type CollectionItem = {
  key: string
  node: ReactNode
  /** Bound per-item handler; absent when removal would violate minItems. */
  remove?: () => void
}
export type CollectionProps = {
  label?: string
  items: CollectionItem[]
  /** Absent when adding would violate maxItems. */
  add?: () => void
  header?: ReactNode
  footer?: ReactNode
}
export type CollectionWrapper = React.ComponentType<CollectionProps>

/** Headless default: items in order, zero DOM, no controls. Supply a wrapper for chrome. */
const BareItems: CollectionWrapper = ({ items, header, footer }) => (
  <Fragment>
    {header}
    {items.map((it) => (
      <Fragment key={it.key}>{it.node}</Fragment>
    ))}
    {footer}
  </Fragment>
)

/** Length bounds read back from the array schema's own checks, so UI gating
 *  (hide add at max, hide remove at min) and validation share ONE source.
 *  Total: unbounded resolves to 0 / Infinity, never undefined. */
export const boundsOf = (arr: z.ZodType): { min: number; max: number } => {
  let min = 0
  let max = Infinity
  for (const c of def(arr).checks ?? []) {
    const cd = c?._zod?.def
    if (cd?.check === 'min_length' && typeof cd.minimum === 'number') min = cd.minimum
    if (cd?.check === 'max_length' && typeof cd.maximum === 'number') max = cd.maximum
    if (cd?.check === 'length_equals' && typeof cd.minimum === 'number') min = max = cd.minimum
  }
  return { min, max }
}

/** Append seed: useFieldArray.append needs SOME row value. The element's declared
 *  .default() if any, else a bare row whose leaves then self-seed on mount. */
const seedFor = (element: z.ZodType): unknown =>
  resolveDefault(element) ?? (def(resolveInner(element)).type === 'object' ? {} : undefined)

export type ListOpts = {
  wrapper?: CollectionWrapper
  header?: ReactElement
  footer?: ReactElement
  /** Override the append template (e.g. a prefilled row). Default: the element's
   *  declared .default(), else a bare row whose leaves self-seed on mount. */
  seed?: () => unknown
}

/**
 * Dynamic container. Decorations are named slots (header/footer) rather than
 * positional args: a homogeneous runtime-length list has no authorable middle
 * positions, so the only meaningful places already have names.
 */
export function list<E extends z.ZodType>(element: E, opts: ListOpts = {}): z.ZodArray<E> {
  if (dev() && !rendersOrDeferred(element))
    console.warn(
      `[insane] list: element has no renderer — annotate it via field()/group()/list()/hidden().`,
    )
  const Wrap = opts.wrapper ?? BareItems
  const ListRenderer = (p: NodeProps) => {
    const fa = useFieldArray({ name: p.name })
    const { min, max } = boundsOf(p.inner)
    const canAdd = fa.fields.length < max
    const canRemove = fa.fields.length > min
    const items: CollectionItem[] = fa.fields.map((f, i) => ({
      key: f.id, // stable identity — never the index
      node: <Render schema={element} name={`${p.name}.${i}`} />,
      remove: canRemove ? () => fa.remove(i) : undefined,
    }))
    return (
      <Wrap
        label={resolveTitle(p.schema)}
        items={items}
        add={
          canAdd
            ? () => fa.append((opts.seed ? opts.seed() : seedFor(element)) as never)
            : undefined
        }
        header={opts.header}
        footer={opts.footer}
      />
    )
  }
  return z.array(element).meta({ component: ListRenderer } satisfies FieldMeta) as z.ZodArray<E>
}

/* ------------------------------------------------------------------ */
/* Host. The schema stays a live, composable Zod value — it is passed  */
/* as a PROP, never wrapped or consumed. The hook is the real API:     */
/* RHF's config surface (mode, reset, programmatic submit…) exists for */
/* good reasons, so it passes through untouched. The component is the  */
/* 90%-case sugar over it, rendering NO chrome of its own.             */
/* ------------------------------------------------------------------ */

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
        <Render schema={schema} name="" />
        {children}
      </form>
    </FormProvider>
  )
}

/* Named exports only — no aggregate object, no default export — so bundlers can
 * tree-shake. `import * as insane from "insane"` gives the namespace ergonomics
 * (insane.field, insane.group, …) and still shakes statically-accessed members. */
