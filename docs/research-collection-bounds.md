# Collection bounds: independent validation

Checked against installed Zod 4.4.3 and the current RHF reference integration.
This records observed behavior and separates extraction defects from editing
policy. No implementation changes were made.

## Confirmed errors under the existing documented contract

`packages/core/src/insane.tsx:503`–`:515` says `boundsOf` reads the array's own
constraints so control gating and validation share one source. Three cases do
not satisfy that contract:

| Schema suffix | Effective Zod bounds | `boundsOf` result | Reproduced UI consequence |
| --- | --- | --- | --- |
| `.length(2)` | min 2, max 2 | min 0, max Infinity | At two rows, both Add and Remove remain available; clicking Add produces three rows. |
| `.min(3).min(1)` | min 3 | min 1 | Starting with three rows, Remove allows reducing the list to two. |
| `.max(1).max(3)` | max 1 | max 3 | Starting with one row, Add allows a second row. |

The resulting arrays fail the same schema's `safeParse`. This is an inaccurate
interpretation of constraints, not a Zod validation failure or proof that all
invalid editing states should be prohibited.

The fixed-length check is actually stored as:

```ts
{ check: 'length_equals', length: 2 }
```

Line 513 reads `minimum` instead. Lines 511–512 overwrite each previous bound,
although Zod retains and enforces all checks. Correct extraction needs the
strongest minimum and strongest maximum, including fixed-length checks. This
also matters when constraints are accumulated by reusable schema composition.

The UI consequence is direct: `ListRenderer` reads these results at lines
535–538 and decides whether to expose append/remove handlers at lines 542 and
549. A wrapper cannot recover a withheld operation and ordinarily trusts the
handlers it receives.

## Existing examples use this gating intentionally

- `apps/storybook/stories/collections.stories.tsx:33`–`:45` declares
  `.min(1).max(3)` and explicitly supplies `defaults: { contacts: [{}] }`.
  Its comment at line 40 specifies that Add disappears at three contacts and
  Remove at one. The story's interaction checks exercise this behavior.
- `packages/examples/profile.tsx:155` uses the same bounds; line 163 supplies
  the initial contact row explicitly.
- `packages/examples/tests/interact.test.tsx` exercises correct ordinary
  minimum/maximum gating, but does not cover fixed or repeated bounds.
- `apps/docs/docs/examples/collections.mdx:12`–`:13` states that schema bounds
  gate add/remove controls. The collection types also document absence of a
  remove handler when removal would breach the minimum.

Consequently, the extraction cases above are implementation defects even if
the project later revisits the editing policy.

## Minimum size does not initialize rows

A real `ZodForm` rendering `list(Row).min(3)` without caller defaults starts with
zero rows. Add is available and Remove is not. Nothing in Zod's minimum
constraint defines a row value or says three rows should be constructed.

That behavior is consistent with the existing examples' explicit caller
defaults. It is not evidence of a missing automatic minimum-row initializer.
It should remain distinct from the separate finding that an actual list
`.default([...])` is not passed to the array binding.

## Ordinary wrappers are not a live bounds bug

An array wrapped in `.optional().default(...)` still received correct ordinary
min/max control gating in the renderer probe. `Render` supplies
`inner={resolveInner(schema)}` at `insane.tsx:290`, and `ListRenderer` calls
`boundsOf(p.inner)` at line 536. Thus the render path unwraps these schemas
before reading checks.

`boundsOf` itself directly inspects its argument and does not independently
unwrap it. Whether that exported helper should accept wrapped arrays or clearly
require an unwrapped array is a helper-interface/documentation question; the
current list render path is not broken for that reason.

## Design issues to discuss separately

The existing policy connects submission constraints to allowed editing
operations. That is a documented design, not an unavoidable consequence of
using a submission schema. Given the agreed distinction between editable and
submitted values, it remains legitimate to ask whether a collection should be
allowed temporarily to have fewer or more rows than it may submit.

For example, `.min(1)` currently withholds removal of the last row. That may be
appropriate in one application; another may prefer to remove it, display an
empty draft, and block submission until a replacement is added. Neither behavior
is established as universally correct by the minimum constraint alone.

The current ownership is explicit in `types.ts:308`: bounds/gating stay in the
core; the wrapper receives available operations. A future binding design can
retain that policy or expose enough information for different editing policies.
Do not treat changing that ownership as part of the mechanical extraction fix.

Also, no global minimum-row seeding policy is needed merely to repair bounds.
Caller-supplied initial rows remain a demonstrated and valid source of values.

## Validation performed

Seven temporary runtime assertions covered fixed extraction, repeated
extraction, actual Add/Remove actions in three defective cases, ordinary
optional/default wrapping, and a minimum without caller initialization. All
seven passed, including assertions reproducing the defects. They used
Testing Library, userEvent, the real `Render`/list runtime, and the existing
`ZodForm` RHF wrapper with a simple collection chrome.

```sh
node_modules/.bin/vitest run packages/core/tests/collection-bounds-probe-temp.test.tsx
node_modules/.bin/tsc --noEmit
```

Both commands passed. The temporary probe file was removed afterward. No
browser suite or TanStack adapter was exercised; no generic guarantee about all
array refinements or custom checks is claimed.
