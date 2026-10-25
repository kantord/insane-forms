# Collection initialization: validated behavior and design distinctions

Probed using Zod 4.4.3, React 19.2.7, React Hook Form 7.77.0,
@hookform/resolvers 5.4.0, and Vitest 4.1.8. This records observations and
design questions, not an approved initialization redesign. No implementation
code was changed.

## Confirmed integration gap

For an object row with an ordinary text widget:

```tsx
const Row = group({ name: TextField })
const Rows = list(Row, { wrapper: ListChrome }).default([{ name: 'Ada' }])
const Schema = group({ rows: Rows })

<ZodForm schema={Schema} onSubmit={save} />
```

The current RHF wrapper renders zero rows. More specifically, its mounted
`useFieldArray` initializes form state to an empty array: submitting this
untouched form produces `{ rows: [] }`, rather than the schema default row.
The empty array is a present value, so Zod does not apply the fallback for
missing input. This is not merely a hidden populated list or a display issue.

The same absence of schema-based initialization occurs for a nested list, such
as `group({ profile: group({ rows: Rows }) })`.

This conflicts with the broad rule documented in `packages/core/src/insane.tsx:22`
that `.default()` fills omitted values and "seeds the draft." The implementation
only supplies per-field seeds and append-row seeds; it does not supply an initial
array seed. As an inconsistency with that rule, this is a real integration gap
(P2). Whether the desired resolution is array seeding, another explicit binding
mechanism, or a narrower documented guarantee is a design decision.

## Caller values and precedence work in the exercised cases

| Caller defaults | Display | Untouched submission |
| --- | --- | --- |
| Not supplied | Zero rows | `{ rows: [] }` |
| `{ rows: [{ name: 'Bea' }] }` | One row containing Bea | `{ rows: [{ name: 'Bea' }] }` |
| `{ rows: [] }` | Zero rows | `{ rows: [] }` |

An explicitly empty list must not automatically be treated as missing input.
Preserving `[]` is consistent with the schema fallback's absence semantics and
with the discussed principle that caller defaults can initialize a field.
Likewise, a nonempty caller value should not be overwritten by the list's default
template. Those behaviors are not bugs in this probe.

## Appending and initial population are separate mechanisms

The current append behavior worked in these tests:

| Configuration | Result after Add |
| --- | --- |
| Object row; its `name` field has `.default('Leaf seed')` | Empty object row mounts, then its leaf renders and submits `Leaf seed`. |
| Element group has `.default({ name: 'Row seed' })` | New row renders `Row seed`. |
| Element has that default, but list `seed: () => ({ name: 'Override' })` | New row renders `Override`. |
| Primitive string list; caller defaults `['Ada']` | Existing primitive row renders Ada. |
| Primitive string list; no append seed | Add creates an editable empty row; typing Ada submits `['Ada']`. |
| Primitive string list; `seed: () => 'New'` | Add creates a row displaying New. |

These do not establish universal support for primitive arrays in every engine or
operation. They do refute a blanket assertion that primitive lists never work
with this integration. Reorder/remove identity, falsy primitive values, and all
engine capabilities were not exhaustively tested.

The list option named `seed` is an **append template**, not the initial array
value. Supplying it does not populate a list at mount. Initial population,
per-row append templates, and child-field initial values are different operations
and should remain distinguishable in documentation and any future interface.

## Where the behavior comes from

- `packages/core/src/insane.tsx:353` computes a per-leaf default/initial seed and
  passes it to `engine.useField`.
- `packages/core/src/insane.tsx:520`–`:521` chooses an append-row seed from the
  element default, otherwise `{}` for an object or `undefined` for other kinds.
- `packages/core/src/insane.tsx:535` calls `engine.useArray(name)` with no seed.
  `:549` passes `opts.seed()` or the element seed when Add is invoked.
- `packages/core/src/types.ts:323`–`:326` exposes a seeded leaf binding but no
  initial-value parameter for array bindings.
- `packages/examples/react-hook-form.tsx:32` forwards a leaf seed to RHF
  `useController`; `:42` calls `useFieldArray` without a default seed.
- `packages/examples/react-hook-form.tsx:69`–`:70` supplies the schema resolver
  and caller defaults without walking schema defaults to initialize containers.

The real examples already use caller defaults to create rows:
`packages/examples/profile.tsx:163` supplies `{ contacts: [{}] }`;
`apps/storybook/stories/collections.stories.tsx:45` and `:82` similarly create
initial object rows, and `:114` explicitly starts a list empty.

## What remains a design question

1. **Initialization ownership.** The established direction puts integration
   behavior in bindings. This result does not prove that core should recursively
   parse schemas, globally manufacture defaults, or own the full form lifecycle.
   The current array interface and RHF wrapper need an explicit initialization
   contract if schema defaults are meant to seed list UI.
2. **Submission bounds versus starting rows.** `.min(1)` describes a validation
   constraint and currently also gates removal. It does not by itself specify
   an initial row template or require automatic row creation. Do not introduce
   min-based population without deciding that UI behavior explicitly.
3. **Absence versus explicit empty.** Any schema-seeding behavior should define
   how omitted values are distinguished from `[]` before the adapter materializes
   an empty array. A fallback that overwrites explicit caller `[]` would change
   the semantics demonstrated above.
4. **Preserving user edits and lifecycle.** A fix that repeatedly reapplies the
   schema default could restore rows a user deliberately removed. Mount, reset,
   remote caller values, and append need distinct handling rather than a render-
   time unconditional append loop. This is a design risk, not a reproduced bug.

## Validation

Ten focused runtime checks passed using the real `list`, `group`, leaf renderer,
and `ZodForm` with Testing Library in jsdom. The repository TypeScript check
passed with those probes present. Commands:

```sh
node_modules/.bin/vitest run packages/core/tests/collection-initialization-probe-temp.test.tsx
node_modules/.bin/tsc --noEmit
```

The temporary test file was removed after recording the results. This probe did
not test a browser, TanStack integration, asynchronous defaults/reset, or every
primitive-list operation.
