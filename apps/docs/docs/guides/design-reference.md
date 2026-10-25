---
sidebar_position: 5
description: The reasoning behind submission schemas, editable values, UI fields, bindings, and initialization.
---

# Field values and submission: design reference

This reference records the design discussion about field values, submission,
typing, and initialization. It distinguishes the direction discussed from the
current implementation and proposals that still need a decision. It does not
claim that every example already follows that direction.

## Submission contracts and editing representations

A submission schema is a runtime representation of the contract for acceptable
submitted data. It includes constraints and parsing behavior that a TypeScript
type alone cannot fully express.

```ts
const QuantitySchema = z.number().int().positive()
type Quantity = z.output<typeof QuantitySchema> // number
```

The schema's role matters more than the fact that it is a JavaScript object.
`Quantity` is the TypeScript approximation of its successful output; it does not
express the integer or positive-number constraints.

| Concept | Meaning |
| --- | --- |
| Submission schema | The runtime contract for acceptable submitted data, including parsing and conversion. |
| Submission value type | The TypeScript representation of the schema's successful output. |
| Editable value | The value a UI field contributes while the user is editing, including intentional absence where supported. |
| Editing state | State the UI field needs to render and edit, which may include private temporary display text. |

The discussion began with separate draft and submission schemas. A later
alternative puts editing representation in the UI field and uses its value
contract to describe unfinished values. A second runtime schema is not required
merely to name intentional absence. Whether independently validating drafts
requires a separate schema remains open.

### A type is not every runtime validation rule

```ts
const RequiredName = z.string().min(1)
type Name = z.input<typeof RequiredName> // string

const blank: Name = ''
RequiredName.safeParse(blank).success // false
```

The type allows a string that fails the runtime constraint. Consequently,
`z.input<Submission>` does not automatically provide a separate runtime validator
accepting every unfinished form state. Also, `z.string()` already accepts an
empty string: a blank text input does not inherently need `.optional()`.

See [Zod's checks](https://zod.dev/packages/core#checks) for the distinction
between checks and inferred types.

## Ownership of editing behavior

The direction discussed is that UI fields own their editing representation.
They should be usable through ordinary props without requiring imports of
insane-forms types. Bindings connect those props to schema information and a form
engine. The core remains independent of a particular form engine.

| Layer | Responsibility |
| --- | --- |
| UI field | Display, editing behavior, control-specific conversions, and its declared editable value type. |
| Binding | Form-engine wiring, schema-derived configuration, and checking that the field and schema can work together. |
| Submission schema | Validation and any declared submission conversion. |

A select can receive ordinary `options` props while its binding obtains the
options from the schema. The UI field need not understand Zod metadata or schema
introspection.

For example, a numeric UI field can declare ordinary props:

```tsx
type NumberInputProps = {
  value: number | undefined
  onChange: (value: number | undefined) => void
}

function NumberInput({ value, onChange }: NumberInputProps) {
  return (
    <input
      type="number"
      value={value ?? ''}
      onChange={(event) =>
        onChange(event.target.value === '' ? undefined : Number(event.target.value))
      }
    />
  )
}
```

This is an illustration of the discussed direction, not a complete numeric
editing policy. The existing examples already convert numeric DOM text inside
their widgets. Their bindings forward the resulting value; they do not perform
that conversion.

## Intentional absence

`undefined` can mean that a field currently has no representable value, for
example after clearing a number input. It does not mean that every present value
is valid for submission: `-5` can be a numeric editable value while a positive
quantity schema rejects it.

Private editing text need not become form data if the field can communicate an
appropriate editable value. A hypothetical field that retains only its last
valid number and emits nothing when cleared could submit an older value. This
was a design caution, not a demonstrated stale-value bug in this project. The
current numeric examples explicitly emit `undefined` when cleared.

`undefined`, `null`, and the empty string have different meanings. They should
not be treated as interchangeable without an explicit conversion. A widget can
display an absent application value as an empty string at the DOM control.

### Vocabulary proposal

A small alias was discussed to explain intentional absence:

```ts
type EditableValue<T> = T | undefined
```

This is proposed vocabulary, not a currently exported type. It is optional for a
UI implementation: writing `number | undefined` locally is reasonable. If a
shared alias is useful in a UI package, its use should not require that UI
package to import insane-forms.

The earlier proposed name `DraftValue<T>` was rejected alongside the existing
`DraftOf<S>` because their similar names obscure different responsibilities.
`DraftOf<S>` currently extracts and widens schema output types to choose a
widget representation. Simplifying or removing that policy is a proposal; it
has not been implemented.

Likewise, the current name `SelfInitializing` checks whether a widget accepts
`undefined`; it does not initialize a value. No replacement name has been agreed.
Accepting absence and obtaining a concrete initial value are distinct facts.

## Precision where it helps

The stated preference is to be as specific as practical and convenient, without
strictness that adds complexity for no useful benefit.

Submission inference should remain precise. For example, a select bound to
`z.enum(['Free', 'Pro', 'Enterprise'])` should preserve that union in the
submitted data type. Its UI implementation may reasonably work with strings:
the native select change event exposes a string, and its choices already come
from the enum.

| Existing example | Practical editing representation |
| --- | --- |
| Text, search, email, and textarea | Strings, including unfinished or submission-invalid text. |
| Numeric input | Numbers, with `undefined` when cleared. |
| Checkbox, switch, and boolean toggle | Booleans. |
| Native select | Strings, even when submission is an enum. |
| Multiple toggle group | Arrays of strings with the current UI wrapper. |

Some controls can preserve precise choice types cheaply; others expose broader
callbacks. Requiring casts everywhere does not necessarily improve safety. The
goal is a clear field contract with useful compatibility checks, rather than
making every widget repeat all submission constraints.

The current field overloads also accept genuinely mismatched schema/widget
types. That is separate from deliberately allowing a string-based enum widget;
the precise compatibility rule still needs to reflect the chosen representation.

## Initialization: current behavior

The curried binding's type guard currently accepts a field when one of these is
true:

- The widget accepts `undefined`.
- The schema has a `.default(...)` recognized by the guard.
- The binding supplies an appropriately typed `initial` value.

The examples use schema defaults for concrete-valued controls:

```tsx
// Existing checkbox binding:
schema: z.boolean().default(false)

// Existing strict select binding:
select(z.enum(['admin', 'user', 'guest']).default('user'))
```

A compile-time example supplies a binding-only initial value:

```tsx
field({
  schema: z.enum(['a', 'b']),
  widget: SelectWidget,
  initial: 'a',
})
```

At runtime, the core currently computes a per-field seed:

```ts
const seed = resolveDefault(p.schema) ?? spec.initial
```

The RHF adapter passes it to `useController` as `defaultValue`. Caller-supplied
form `defaults` are passed separately to RHF's form-level `defaultValues`.

Known inconsistencies discussed:

- The one-go overload does not enforce the same initialization guard.
- A field-level guard cannot see caller-supplied form defaults.
- The nullish fallback above incorrectly discards an explicit `null` default.
- Having an initial value does not prove that a widget cannot later emit absence.

This documents the existing policy; whether to retain every part of it and how
to enforce it consistently have not been decided.

### Starting values and submission fallbacks

An initial suggestion and a parse-time fallback have different meanings:

| Declaration | Initial numeric example | Submitting `undefined` |
| --- | --- | --- |
| `z.number().default(42)` | The current binding seeds 42. | Parsing supplies 42. |
| `z.number()` with binding `initial: 42` | The binding seeds 42. | Parsing fails. |

For a suggested order quantity, the second behavior can be useful: clearing the
suggestion requires entering a quantity. When absent input should mean 42, the
first behavior is correct. Restoring a declared submission default is not itself
a bug or a reason to override Zod's semantics.

Zod parsing defaults do not initialize a form engine by themselves. Schema-based
UI seeding is behavior supplied by this integration. Zod also distinguishes
output defaults from input prefaults; the general type-changing case needs a
consistent initialization rule. See [Zod defaults and prefaults](https://zod.dev/api#prefaults).

## Explicit bindings: examples checked against the implementation

The direction discussed is that the binding explicitly connects the UI field's
editable value contract to the submission schema. Different input/output types
are a normal case for that connection, not a reason to make the UI field depend
on insane-forms or to equate editable values with parsed output.

### Text editing with numeric submission

Given a plain `TextEntry` UI accepting these props:

```ts
type TextEntryProps = {
  value: string | undefined
  onChange: (value: string | undefined) => void
}
```

An explicit binding can connect it to a numeric submission:

```tsx
const Quantity = field({
  schema: z.string().regex(/^\d+$/, 'Digits required').transform(Number),
  widget: (props: TextEntryProps) => <TextEntry {...props} />,
})

const Order = group({ quantity: Quantity })

<ZodForm schema={Order} defaults={{ quantity: '12' }} onSubmit={saveOrder} />
```

This was exercised with the current RHF reference wrapper: editing `'42'`
submitted `{ quantity: 42 }` while the field continued displaying text. Invalid
text produced a field error and blocked submission. The schema performs the
conversion; the binding connects the two contracts without adding a second
conversion algorithm.

This explicit annotation works today, but it is not proof that the current
binding types enforce compatibility. Inline widget inference still incorrectly
uses numeric output for this string-input example. Binding before `.transform()`
also loses renderer lookup, unlike explicitly binding the transformed schema.

### Caller defaults for a concrete-valued field

Given a plain `BooleanEntry` UI requiring a boolean:

```tsx
const Enabled = field({
  schema: z.boolean(),
  widget: (props: { value: boolean; onChange: (value: boolean) => void }) => (
    <BooleanEntry {...props} />
  ),
})

const Settings = group({ enabled: Enabled })

<ZodForm schema={Settings} defaults={{ enabled: false }} onSubmit={saveSettings} />
```

The field does not need its own schema default or binding initial value for
this instance to work. Current runtime checks of the examples confirmed:

| Situation | Value received by the UI field |
| --- | --- |
| Caller supplies `true`, field has no initializer | `true` |
| Caller supplies `false`, schema has `.default(true)` | `false` |
| Caller supplies `false`, binding has `initial: true` | `false` |
| Neither caller nor field supplies an initial value | `undefined`, despite the UI's declared boolean type |

These examples support allowing caller defaults to satisfy initialization. The
enforcement mechanism remains incomplete: the reusable field definition cannot
see defaults supplied later by a consuming form. The per-form integration has
that information. Treating initialization as a binding/integration responsibility
does not mean the field constructor can check unseen caller values.

The final row is an observed contract violation, not an intended guarantee.
The requirement clarified from that example is compile-time safety: either the
UI field accepts absence, or its binding/form must guarantee a suitable concrete
initial value. A form with neither should fail type checking. Caller defaults
can satisfy that obligation; merely making a `defaults` prop required cannot,
because a required field could still be omitted or explicitly undefined.

The full slider reproduction, the two approaches discussed, and investigation
criteria are recorded in the repository backlog at
`docs/field-initialization-backlog.md`. The guarantee is the intended outcome;
the type machinery to preserve it through schema composition is not yet chosen.

Six focused runtime checks and the repository TypeScript check passed for the
examples above, including a check confirming that missing initialization is not
currently rejected. No implementation behavior was changed by those probes.

## Conversion and implementation questions still open

The ordinary numeric examples use this flow:

```text
DOM text -> widget conversion -> number or undefined in form state
         -> schema validation -> parsed submission
```

Submission parsing can also declare a conversion, as demonstrated above. The
direction discussed is to support that distinction through explicit bindings.
Consistent rendering, typing, metadata, and initialization still need work.
In particular, a transformed schema's output default is not automatically a
suitable initial input value; the probe found a numeric output default being
seeded into a field whose schema expects string input.

Other open points are the exact binding compatibility rule, consistent support
for caller defaults in initialization checks, and the final helper names. A
separately published RHF integration package has been suggested, but its name,
public interface, and release structure are not finalized.

These open points should be resolved through concrete fields and interactions,
rather than treating every unfinished value as either a schema error or a reason
to weaken submission types.
