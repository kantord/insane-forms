# Validated observations and proposed work sequence

Status: the observations below have been reviewed; the architecture and API
proposals have not been approved by the user. The sequence is a planning aid,
not an authorization to implement those proposals. In particular, packaging,
draft value semantics, initialization ownership, and submission conversion are
still open. See `research-design-boundaries.md` and the accompanying research
notes before choosing a design.

Three independent skeptic agents reviewed field typing/initialization, lists/URL
state, and architecture/dependencies. This document separates observed behavior
from intended design and proposed implementation.

## Intended model versus current implementation

- The repository already is a pnpm monorepo.
- The core source is independent of a form engine: schema builders, `Render`,
  and `FieldEngine`. A maintained, separately published React Hook Form adapter
  is the proposed packaging direction discussed with the user.
- The user's intended model has separate form/draft and submission schemas.
  The draft schema must describe all possible editing states; the submission
  schema describes acceptable submissions.
- This separation is not implemented today. `packages/examples/react-hook-form.tsx`
  uses one schema for both rendering and its resolver. The existing core-concepts
  documentation instead describes one schema's `z.input` and `z.output`.
- Before changing field types, specify whether widgets edit `z.input<Draft>` or
  `z.output<Draft>`, and where conversion occurs. Defaults, prefaults, transforms,
  coercion, enum widening, and implicit `undefined` make these different contracts.

## Validated findings

| Finding | Assessment | Evidence and implication |
| --- | --- | --- |
| Strict one-go widget receives unset value | Confirmed, qualified; P2 | `insane.tsx:326` accepts strict string widgets without initialization; rendering with the example wrapper and no defaults can crash. Caller-supplied root defaults can legitimately initialize strict widgets, so requiring every field to have a schema default was an overprescriptive recommendation. |
| Schema/widget type compatibility | Confirmed additional bug; P2 | Both overload styles can pair a string schema with a numeric widget. The annotated one-go overload infers schema and widget independently; the curried guard checks initialization only. Adding that guard alone is insufficient. |
| Null defaults | Confirmed; P2 | `insane.tsx:353` and `:521` use nullish fallback, discarding valid `.default(null)` values. Declared defaults should take precedence over `initial`; only `undefined` should trigger fallback. |
| Fixed-length list bounds | Confirmed; P2 | `insane.tsx:513` reads `minimum` for `length_equals`, but Zod stores `length`. `.length(2)` reports bounds `0/Infinity`. |
| Repeated list bounds | Confirmed additional bug; P2 | `insane.tsx:511`–`:512` overwrite rather than intersect checks. `.min(3).min(1)` reports minimum 1; `.max(1).max(3)` reports maximum 3, unlike validation. |
| List defaults do not render initial rows | Confirmed, ownership qualified; P2 | `list(row).default([{ name: 'Ada' }])` with the example `ZodForm` renders no rows without separately supplied defaults. `FieldEngine.useArray` has no seed argument. This establishes an integration/initialization gap, not that core must globally parse the schema. |
| README uses absent exports | Confirmed documentation mismatch; P2 | `README.md:16` uses `insane.ZodForm`, which the package does not export. Keeping it out of the core is intentional; fix the documentation to use the adapter package. Stale source comments also advertise an absent `insane-forms/react-hook-form` subpath. |
| Engine-independent package | Qualified | Core has no runtime `dependencies`, but still declares mandatory RHF and resolver peer dependencies. Its install contract remains engine-coupled. |
| URL back-button behavior | Qualified follow-up | The hook documents one-way form-to-URL sync, and stories explicitly use `history: 'replace'`. Do not describe the hook itself as broken for omitting two-way sync. Documentation promises back-button-friendly filters, while URL changes are passed only as cached RHF defaults; navigation behavior needs a browser reproduction and an explicit contract. |

## Dependency facts

- 68 distinct external direct dependencies across manifests; 67 root development
  dependencies. The core has zero runtime dependencies and five peers.
- 1,826 locked package-version entries, including transitive dependencies and
  platform packages; this is not a count of distinct package names or imports.
- The saved live registry report lists 50 dependencies with newer `latest`
  releases, including seven major-version increases. Every reported `wanted`
  equals `current`; this does not establish eligibility under release-age policy.
- The user-requested three-day policy is applied: `minimumReleaseAge: 4320`.
  Recheck eligible versions under that policy before selecting upgrades.

## Implementation sequence

1. **Specify draft and submission contracts.** Record terminology and choose the
   exact widget/engine value type, initialization precedence, missing-state policy,
   conversion boundary, and submission-error mapping. Work through a blank text
   field, numeric input, nullable default, enum, nested object, and list. Propose a
   wrapper taking a draft schema for rendering and a separate submission schema
   for validation; type its callback from submission output. Avoid choosing
   `z.input` versus `z.output` implicitly.

2. **Fix the independent runtime defects.** Preserve null seeds; read fixed
   lengths correctly; intersect repeated bounds using the strongest minimum and
   maximum. Add focused regressions for null versus absent seeds, fallback
   precedence, fixed lengths, repeated bounds, and control gating.

3. **Make field bindings respect the draft contract.** Enforce schema/widget
   compatibility in both overload styles, including widget `onChange` behavior.
   Implement the initialization policy selected in step 1 rather than simply
   copying the existing curried guard. Add compile-time cases for incompatible
   types and nullable/optional states, plus runtime cases for caller defaults,
   defaults/initial values, missing seeds, and transformed draft values.

4. **Implement the two-schema RHF integration and initialization.** Render the
   draft schema and validate submissions against the submission schema. Establish
   one documented way to initialize containers and leaves, preserving explicit
   caller values and lazy recursion. An unset draft must render safely and fail
   submission when required; a completed draft must produce typed, parsed
   submission output. Cover nested and list defaults and field-path errors.

5. **Extract the publishable adapter.** Proposed name:
   `@insane-forms/react-hook-form`. Move the RHF binding, bound renderer, and form
   wrappers there; move RHF/resolver peers out of core. Check whether `react-dom`
   is needed by each published package. Keep `FieldEngine` and rendering in core;
   keep demos in examples. Update root build and package checks for both packages,
   declarations, exports, client directives, and packed-package consumption.

6. **Align examples and documentation.** Replace the README's absent exports,
   document the two schemas and initialization policy, and remove stale adapter
   subpath claims. Test browser back/forward and external URL changes; either
   implement URL-to-form reconciliation with loop protection if promised, or
   document the supported URL-seeding/replace-history behavior accurately.

7. **Maintain dependencies separately.** Recheck versions eligible under the
   three-day policy. Update related patch/minor packages together and review
   major tool upgrades separately; keep React/types, Storybook addons, and Vitest
   browser packages aligned. Run lint, type checking, unit/integration tests,
   builds/package checks, and affected browser suites for each group.

## Validation baseline and scope

The existing 57 unit/integration tests and repository TypeScript check pass.
The earlier temporary regressions reproduced the strict-widget crash, ignored
fixed length, and absent default list rows; those temporary files were removed.
Skeptics independently checked incompatible widget types, list bounds/defaults,
and dependency counts. No browser-navigation claim is considered fully verified
without a browser reproduction. No implementation changes are included in this
plan beyond the already requested three-day release-age setting.
