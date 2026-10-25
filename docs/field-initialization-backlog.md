# Backlog: enforce field initialization at compile time

Captured 2026-10-25 from the field/binding design discussion. This is an
investigation item, not an approved implementation or new public interface.

## INIT-01 — A strict UI field can receive an absent initial value

**Status:** reproduced with the current one-go binding and RHF reference wrapper.

The user identified this as a compile-time contract problem: a form should not
compile if it can initially pass `undefined` to a UI field that requires a
concrete value. Treating the missing value merely as caller responsibility does
not provide the intended type guarantee.

Two paths were explicitly discussed; different fields may use different paths:

1. The UI field accepts and gracefully handles absence in its editable contract,
   such as `number | undefined`.
2. The UI field requires a concrete value, and the type checker requires an
   appropriate non-undefined initializer before the form can render it.

Caller-supplied form defaults are a valid source of initialization. A reusable
field need not necessarily supply its own default. A suitable schema default or
binding `initial` may also satisfy the requirement, provided the actual editable
input contract is respected.

## Full reproduction

These two example files can be placed under
`packages/examples/tests/initialization-repro/`. They use existing interfaces;
no new adapter or proposed type helper is required.

### `volume-slider.tsx` — ordinary UI, no insane-forms types

```tsx
export type VolumeSliderProps = {
  value: number
  onChange: (value: number) => void
}

export function VolumeSlider({ value, onChange }: VolumeSliderProps) {
  return (
    <>
      <output>{value.toFixed(0)}%</output>
      <input
        aria-label="Volume"
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </>
  )
}
```

The slider's interface requires a number. Its display legitimately calls a
numeric method; it does not declare support for an absent value.

### `forms.tsx` — reusable binding and consuming forms

```tsx
import * as insane from 'insane-forms'
import * as z from 'zod'
import { ZodForm } from '../../react-hook-form'
import { VolumeSlider, type VolumeSliderProps } from './volume-slider'

const Volume = insane.field({
  schema: z.number().min(0).max(100),
  widget: (props: VolumeSliderProps) => <VolumeSlider {...props} />,
})

const Settings = insane.group({ volume: Volume })

function saveSettings(_settings: z.output<typeof Settings>) {
  // Application submission handler.
}

// Valid: the caller supplies a concrete editable value.
export function InitializedForm() {
  return (
    <ZodForm
      schema={Settings}
      defaults={{ volume: 50 }}
      onSubmit={saveSettings}
    />
  )
}

// Currently compiles, but rendering throws when value.toFixed() receives
// undefined. Under the intended guarantee this should fail type checking.
export function MissingDefaultsForm() {
  return <ZodForm schema={Settings} onSubmit={saveSettings} />
}

// Also currently compiles and crashes; merely requiring a defaults prop
// would not be sufficient.
export function UndefinedDefaultForm() {
  return (
    <ZodForm
      schema={Settings}
      defaults={{ volume: undefined }}
      onSubmit={saveSettings}
    />
  )
}
```

Mount the last two forms separately to observe the rendering failure. No user
interaction or submission is needed: the missing initial value reaches the UI
on its first render.

## Verification recorded

Three temporary runtime checks exercised the same slider, schema, binding, and
wrapper: initialization with 50 displayed `50%`; missing defaults and an explicit
undefined default each threw at `toFixed`. The repository TypeScript check passed
with all three cases present, confirming that the invalid examples compile.

Commands used:

```sh
node_modules/.bin/vitest run packages/core/tests/initialization-backlog-temp.test.tsx
node_modules/.bin/tsc --noEmit
```

The temporary test was removed after recording the reproduction. No implementation
behavior was changed. This validates the current one-go example, not every
binding overload, form engine, or nested composition.

## Why the current types lose the requirement

- `packages/core/src/insane.tsx`: the annotated one-go overload independently
  infers schema and widget value types, and returns plain schema type `S`.
- `packages/core/src/types.ts`: the initialization guard operates at field
  construction, where consuming-form defaults are not available. The one-go
  overload does not apply the same guard as the curried overload.
- `packages/examples/react-hook-form.tsx`: the wrapper accepts optional,
  deeply partial `defaults`. It does not require values for the concrete-valued
  widgets nested in the schema.
- The current binding forwards the engine value to the widget without enforcing
  this initialization requirement. TypeScript widget types cannot be inspected
  at runtime to recover it automatically.

See the [site design reference](../apps/docs/docs/guides/design-reference.md)
for the agreed distinction between the UI field, binding, submission schema,
editable value, and initialization sources.

## Ideas and constraints to investigate

- Preserve or derive enough compile-time information about widget requirements
  for the consuming form to check initialization. A possible avenue is type-only
  metadata on bound schemas, but this is an idea, not a chosen encoding.
- Account for values already supplied by a suitable schema default or binding
  `initial`; require caller defaults only for obligations still unsatisfied.
- Allow absence-capable UI fields to render without forcing meaningless defaults.
  Do not solve the problem by automatically widening every strict UI contract.
- Check the initializer's value type, not just presence of the `defaults` key.
  Reject missing properties, explicit undefined, and incompatible values where
  a concrete value is required. Preserve valid falsy values such as 0 and false.
- Exercise both one-go and curried bindings. Do not close the one-go hole merely
  by imposing a field-local default when valid caller initialization exists.
- Preserve requirements through `group`, nested groups, reusable fragments,
  wrappers, and ordinary supported Zod chaining. Establish whether this can be
  achieved without compromising the plain-Zod schema experience or duplicating
  field declarations in a separate tree.
- Keep UI implementations independent of insane-forms types. Any additional
  typing machinery belongs to the binding/form integration.
- Initialization must use the editable representation. A transformed schema's
  output default cannot automatically satisfy a different input type. See the
  [transform probe](research-transform-probe.md).
- Investigate initial form values separately from newly appended array rows and
  reset/replacement values; a first-render guarantee alone does not prove safety
  across those operations. Do not claim those cases are covered by this repro.
- Runtime diagnostics may supplement the guarantee, but should not replace the
  requested compile-time rejection for the ordinary typed examples above.

## Acceptance examples for a future implementation

1. The initialized slider form compiles and renders correctly.
2. Missing defaults, an empty defaults object, and `{ volume: undefined }` fail
   type checking for this strict field.
3. A valid concrete binding initializer or suitable schema default removes the
   caller's obligation to supply that field.
4. An absence-capable version of the UI can render without a concrete initializer.
5. Defaults of the wrong editable type fail, while valid 0/false values survive.
6. Equivalent requirements remain effective after nested and fragment composition.
7. Existing useful schema/submission inference and UI ergonomics remain intact.

Before implementing, compare the available type encodings against these examples.
The desired guarantee is established; its representation and enforcement
mechanism remain the subject of this investigation.
