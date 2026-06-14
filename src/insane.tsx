'use client'
/**
 * insane — schema-driven forms on plain Zod, engine-agnostic.
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
 *  - Engine-agnostic: the form library lives behind a FormAdapter port (./types),
 *    confined to three render seams (leaf → useField, list → useArray, host → useForm).
 *    The active adapter is read from context (useAdapter); the core imports NO engine.
 *    react-hook-form is the default adapter; a tanstack-form adapter ships alongside.
 *    FieldProps is OUR consumer-driven contract — widgets and shells never see the engine.
 *
 * Terminology:
 *  - default — Zod's `.default(v)`. Data layer. Fills omitted values at parse time AND
 *              seeds the draft.
 *  - initial — `initial` on a field spec. Draft layer only; never alters parsing.
 *  - a widget's tolerance is its TYPE: value `T | undefined` means "I render the unset
 *    state"; a bare `T` makes the compiler demand `.default()` or `initial` at use site.
 *
 * The type surface lives in `./types` (compile-time only — emits nothing).
 */
import type * as React from 'react'
import { Fragment, isValidElement, type ReactElement, type ReactNode, useEffect } from 'react'
import * as z from 'zod'
import { useAdapter } from './context'
import type {
  CollectionItem,
  CollectionWrapper,
  CurriedGuard,
  DeepPartial,
  Def,
  FieldGroup,
  FieldMeta,
  FieldProps,
  FieldSpec,
  ListOpts,
  NodeProps,
  OneGoGuard,
  Part,
  QueryParam,
  ShapeOf,
  Shell,
  Widget,
} from './types'

/* ------------------------------------------------------------------ */
/* Introspection. One typed boundary into Zod internals, one walk.     */
/* ------------------------------------------------------------------ */

const def = (s: z.ZodType): Def => (s as unknown as { _zod: { def: Def } })._zod.def

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

/** No-op shell: renders the widget bare. The default — the core owns no chrome. */
const BareShell: Shell = ({ children }) => <Fragment>{children}</Fragment>

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
    // per-field draft seeding: declared .default() wins, else the explicit initial.
    // Computed engine-neutrally and handed to the adapter's leaf binding.
    const seed = resolveDefault(p.schema) ?? spec.initial
    const binding = useAdapter().useField(p.name, seed)
    /* Flattening the engine's nested state into FieldProps is the seam, not an
     * accident: widgets/shells get insane's flat contract and never import the engine. */
    const props: FieldProps<unknown> = {
      name: p.name,
      value: binding.value,
      onChange: binding.onChange,
      onBlur: binding.onBlur,
      label: resolveTitle(p.schema),
      description: resolveDescription(p.schema),
      error: binding.error,
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

/** Append seed: the array's append needs SOME row value. The element's declared
 *  .default() if any, else a bare row whose leaves then self-seed on mount. */
const seedFor = (element: z.ZodType): unknown =>
  resolveDefault(element) ?? (def(resolveInner(element)).type === 'object' ? {} : undefined)

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
    const arr = useAdapter().useArray(p.name)
    const { min, max } = boundsOf(p.inner)
    const canAdd = arr.rows.length < max
    const canRemove = arr.rows.length > min
    const items: CollectionItem[] = arr.rows.map((row, i) => ({
      key: row.id, // stable identity — never the index
      node: <Render schema={element} name={`${p.name}.${i}`} />,
      remove: canRemove ? () => arr.remove(i) : undefined,
    }))
    return (
      <Wrap
        name={p.name}
        label={resolveTitle(p.schema)}
        items={items}
        add={canAdd ? () => arr.append(opts.seed ? opts.seed() : seedFor(element)) : undefined}
        header={opts.header}
        footer={opts.footer}
      />
    )
  }
  return z.array(element).meta({ component: ListRenderer } satisfies FieldMeta) as z.ZodArray<E>
}

/* ------------------------------------------------------------------ */
/* Host. The schema stays a live, composable Zod value — it is passed  */
/* as a PROP, never wrapped or consumed. ZodForm reads the active form  */
/* adapter from context, creates the instance, provides it, and renders */
/* NO chrome of its own. The RHF-specific `useZodForm` escape hatch     */
/* (react-hook-form's own methods) lives in that adapter's module.      */
/* ------------------------------------------------------------------ */

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
  const adapter = useAdapter()
  const form = adapter.useForm(schema, { defaults })
  const Provider = adapter.Provider
  return (
    <Provider form={form}>
      <form
        className={className}
        onSubmit={adapter.onSubmit(form, (d) => onSubmit(d as z.output<S>))}
      >
        <Render schema={schema} name="" />
        {children}
      </form>
    </Provider>
  )
}

/* Named exports only — no aggregate object, no default export — so bundlers can
 * tree-shake. `import * as insane from "insane"` gives the namespace ergonomics
 * (insane.field, insane.group, …) and still shakes statically-accessed members. */
