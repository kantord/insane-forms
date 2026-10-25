# Form-state practices relevant to insane-forms

Research date: 2026-10-25. Primary sources only. TanStack references below are
the stable v1 documentation, not its separate alpha documentation. These examples
establish documented practices and tradeoffs; they do not establish a universal
industry convention or that maintainers regret their designs.

## Three values that should not be conflated

1. **Editable state:** what the user and widgets currently hold, including
   incomplete values.
2. **Validation result:** issues or success for a particular validator and time.
3. **Parsed submission:** possibly transformed data delivered to application code.

React Hook Form's resolver integration explicitly supports
`useForm<Input, Context, Output>()`; its Zod example supplies `z.input<S>` and
`z.output<S>` separately. A single schema can therefore express a parsing
boundary without requiring the editable and submitted TypeScript types to be
identical. This does not by itself make missing required fields members of
`z.input<S>`. [RHF resolvers documentation](https://github.com/react-hook-form/resolvers#typescript)

TanStack Form v1 makes a different choice: schema validation produces errors,
but `onSubmit` receives editable input rather than schema-transformed output.
Its documented example explicitly calls `schema.parse(value)` inside submission
handling to obtain the transformed result. An abstraction spanning both engines
must specify this behavior instead of assuming their schema integrations agree.
[TanStack submission handling](https://tanstack.com/form/latest/docs/framework/react/guides/submission-handling)

Historically, vee-validate v4's typed-schema integration explicitly typed form
values as potentially unfinished and submitted values as validated. Its Zod
examples also initialized fields from schema defaults. This is an example of
library-provided widening/initialization, rather than evidence that Zod itself
automatically creates a form draft model.
[vee-validate v4 typed schemas](https://vee-validate.logaretm.com/v4/guide/composition-api/typed-schema/)

## Initialization and resets are separate lifecycle operations

RHF recommends form-level `defaultValues`, caches them, and offers reactive
`values` separately. Replacing data can reset the form; `keepDirtyValues` protects
user edits during background refresh. Its validation `mode` independently chooses
when checks run. Thus initialization, remote updates, reset, and validation
timing are separate API decisions, even if one application initially uses the
same object for several purposes.
[RHF useForm](https://react-hook-form.com/docs/useform)

RHF distinguishes resetting current values/state from advancing only the default
baseline. The latter is useful when a save finishes after the user has made
further edits: saved values become the baseline without erasing new edits.
This documents a concrete race/dirty-state bug class relevant to any initializer
that is rerun after every parse or server response.
[RHF resetDefaultValues](https://react-hook-form.com/docs/useform/resetdefaultvalues)

## A schema-level empty state is not necessarily a valid DOM value

React controlled text inputs must keep a string value, rather than switching
from `undefined` to a string. Checkbox controls use booleans. A widget can map an
application-level missing value to `''` for display without claiming that the
application-level value is itself a string. React also documents caret problems
when controlled input updates replace the raw DOM value with transformed text
or update it asynchronously.
[React input reference](https://react.dev/reference/react-dom/components/input)

RHF's `Controller` integration is stricter than an arbitrary engine-neutral
value contract: its docs prohibit `undefined` defaults and `onChange(undefined)`
and recommend `null` or `''` as cleared values. A core contract that allows
`undefined` needs a deliberate adapter representation policy or documented
support limit; broadening widget types alone does not make the engine support it.
[RHF Controller](https://react-hook-form.com/docs/usecontroller/controller)

For registered native inputs, RHF documents that numeric conversion happens
before validation and may return `NaN`; it does not convert default values.
Disabled registered inputs can produce `undefined`. Consequently, a numeric
widget's clear action, initial number, invalid number, and disabled state need
explicit contracts. A plain `number` annotation does not guarantee that Zod's
number parser will accept every runtime number value.
[RHF register](https://react-hook-form.com/docs/useform/register)

## Arrays and conditional fields constrain adapters

RHF documents stable generated row keys; using indexes as keys can break field
identity. Its `update` operation unmounts/remounts rows. It requires complete row
objects for append/update, does not support primitive field arrays, and warns
against `shouldUnregister` with field arrays because reordering/remounting can
lose values. Async data passed only as initial defaults does not add rows later;
`values` or `reset` is needed.
[RHF useFieldArray](https://react-hook-form.com/docs/usefieldarray)

TanStack Form documents explicit array initial values and explicit objects passed
to `pushValue`. These are engine initialization practices, not a mandate that
insane-forms must or must not derive initial rows from Zod metadata.
[TanStack arrays](https://tanstack.com/form/latest/docs/framework/react/guides/arrays)

## Validation feedback is independent of submission eligibility

TanStack supports field/form validators, synchronous/asynchronous checks, and
separate change/blur/submit triggers. Its `canSubmit` can remain true before
interaction even when an untouched value is technically invalid. Submission
reruns validators. Thus a form's editing-state validity, visible errors,
untouched state, and eventual submission success should not be represented by a
single boolean or by forbidding invalid edits.
[TanStack validation](https://tanstack.com/form/latest/docs/framework/react/guides/validation)

## A documented interoperability tradeoff

vee-validate v5 moved to Standard Schema and deprecated companion adapters such
as `@vee-validate/zod`. Its migration guide explicitly says schema-derived
`required` metadata and default initialization are no longer supported because
the standard interface does not expose them. The guide does not call the old
design a mistake. The relevant lesson is that generic validation compatibility
does not automatically supply renderer introspection or initialization features.
[vee-validate v5 migration](https://vee-validate.logaretm.com/v5/guide/migration/)

## What this leaves open for this project

The discussion establishes distinct editing and submission semantics. The later
direction puts editing representation in UI fields and connects their declared
contracts to submission schemas through explicit bindings; it does not mandate
two runtime schema arguments. See the
[design reference](../apps/docs/docs/guides/design-reference.md). Adapter handling
of absence, initialization precedence, schema-derived hints, and feedback timing
still need concrete guarantees rather than assuming all engines agree.

The following are engineering inferences from the documented differences above:

- Specify the editable value set and initialization before claiming widget type
  safety. Read/write callback compatibility must cover values in both directions.
- Specify whether validation observes state or replaces it. Replacing each
  keystroke with parsed output risks lost text, caret jumps, and type changes.
- Keep initialized values, parse-time defaults, and dirty/reset baselines distinct
  unless their equality is an explicit policy.
- Specify adapter guarantees for missing values, primitive lists, unmounting,
  resets, and parsed submissions. Engine independence requires either normalization
  or capability limits where upstream engines differ.
- Test blank/cleared text, incomplete numeric editing, null versus missing values,
  transformed submissions, nested/array initialization, conditional unmount,
  reorder identity, asynchronous reset, and edits made while saving.

These are decisions and acceptance scenarios, not an approved architecture.
