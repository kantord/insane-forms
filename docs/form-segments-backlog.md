# Backlog: form segments and hidden UI

Captured 2026-10-25 from product discovery and inspection of the current code.

This backlog concerns logical portions of a form presented as steps, tabs,
accordions, dialogs, conditional sections, or recursive editors. It records
problems to solve, not a proposed API or a commitment to built-in UI components.

See [the form-complexity framing](form-complexity-framing.md) for structural
challenges, familiar examples, and combinations that make useful stress tests.

Guiding requirement: consumers should be free to choose the interaction design,
while the library handles recurring structural bookkeeping that otherwise causes
bugs. Merely making a workaround possible is not sufficient support.

Product intent includes reusable support for these recurring challenges, not
only better examples. The precise core/adapter/presentation responsibilities
remain to be designed. These items are deferred behind the fundamental field and
collection investigations in the [current review plan](review-plan.md); “first
design slice” below means first within segment work, not immediate project priority.

## Evidence and scope

Source inspection, not browser reproduction, establishes the current baseline:

- [Multi-step example](../apps/storybook/stories/multistep.stories.tsx) renders
  reusable schema fragments, but separately lists their field names for scoped
  validation and step error indicators. Consumers coordinate navigation themselves.
- [Nested-dialog example](../apps/storybook/stories/nested-modals.stories.tsx)
  builds validation targets by walking current values, looks up subtree errors
  manually, and prevents closing an invalid dialog. It demonstrates a particular
  interaction, not a general segment lifecycle.
- [Core contracts](../packages/core/src/types.ts) expose field bindings, array
  operations, and value watching. There is no explicit segment contract for
  validation, error aggregation, reveal/focus, or edit transactions.
- [RHF integration](../packages/examples/react-hook-form.tsx) retains unmounted
  values with `shouldUnregister: false`. Retention is therefore already partially
  addressed; it does not distinguish temporarily hidden from no longer applicable.
- Core lists already use engine-provided stable row keys. The remaining identity
  questions below concern segment-level navigation, errors, and pending work.

“Open” means reusable support or a documented guarantee is missing in the inspected
code. It does not mean every example exhibits the failure, or that the engine
cannot support it. Existing draft/default/type findings remain in
[the review plan](review-plan.md); this document does not replace that work.

## First design slice: membership, validation, and reachable errors

### SEG-01 — Segment membership drifts from its schema

- **Failure:** a field added to a step renders, but is absent from its manually
  maintained validation targets or error indicator.
- **Current gap:** the wizard repeats field names. `Object.keys(schema.shape)`
  can fix this flat example, but is not a general nested-segment abstraction.
- **Required outcome:** a segment's schema and location establish its membership
  once, including when a reusable fragment appears at different nested paths.
- **Acceptance scenario:** add and rename a nested field; rendering, validation,
  and error aggregation follow without another list of paths being updated.

### SEG-02 — An error belongs to an invisible field

- **Failure:** final submission fails on another tab, a collapsed section, or a
  closed nested dialog. The user sees no actionable error, and focusing an
  unmounted input cannot help.
- **Current gap:** no general coordination between errors and presentation
  visibility. The wizard has clickable step indicators, but no automatic routing
  to the relevant step on failed submission.
- **Required outcome:** identify the owning segment and allow its presentation to
  reveal it, await mounting, then focus the appropriate control or error summary.
  The consumer chooses whether navigation is automatic or user initiated.
- **Acceptance scenario:** submit while an invalid field is inside a closed
  dialog on an inactive step; provide a working route through both boundaries.

### SEG-03 — Segment summaries miss or misattribute errors

- **Failure:** a tab appears valid despite a descendant error; an object-level
  error appears nowhere because it belongs to no individual input.
- **Current gap:** examples perform their own field-name and subtree lookups.
- **Required outcome:** aggregate field, descendant, and segment-level errors
  consistently, including server errors. Keep validity distinct from whether
  feedback should currently be shown.
- **Acceptance scenario:** a nested array error and a group-wide error both
  appear in the appropriate segment summary and remain actionable.

### SEG-04 — Local validation and whole-form validation disagree

- **Failure:** Next is blocked by unrelated future fields; alternatively, each
  step passes but a rule spanning steps fails with no clear place to show it.
  Walking present values can also omit a required field that is missing entirely.
- **Current gap:** callers choose paths and call engine validation directly;
  there is no shared contract for segment validation or cross-segment rules.
- **Required outcome:** define what local validation checks, when dependent rules
  run, and where their errors belong. Local success must not imply whole-form
  submission validity. Account for absent values and object/array-level rules.
- **Acceptance scenario:** validate an unfinished current step without reporting
  untouched future fields; later surface a booking-wide constraint involving both.

## Lifecycle and conditional structure

### SEG-05 — Hidden and inapplicable data receive the same treatment

- **Failure:** changing tabs loses entered values, or disabling an optional
  section leaves stale hidden values in the submitted booking. Hidden required
  fields can also make submission impossible.
- **Current gap:** the RHF example retains unmounted values globally. There is no
  segment-level distinction between temporary invisibility and inapplicability.
- **Required outcome:** explicitly define retention, validation, and submission
  policies for each condition, without inferring applicability solely from mount
  state. Policy choices must remain available to the application.
- **Acceptance scenario:** leaving a tab preserves its draft; switching off an
  optional group follows the chosen clear/preserve/omit policy and cannot leave
  an unexplained invisible validation blocker.

### SEG-06 — Previously completed segments become invalid

- **Failure:** changing the booking date invalidates availability selected in a
  later segment, but that segment remains marked complete and its old result is
  treated as current.
- **Current gap:** examples manage navigation and status locally; no shared
  dependency/invalidation behavior is specified.
- **Required outcome:** distinguish visited, edited, validated, complete, and
  pending states. Define how relevant changes invalidate earlier validation.
- **Acceptance scenario:** change a dependency after completing a segment;
  its status and submission eligibility reflect that change without discarding
  unrelated draft data.

### SEG-07 — Cancel does not cancel nested edits

- **Failure:** editing a group in a dialog immediately mutates the parent form;
  Cancel only hides the dialog. A broad reset can instead erase unrelated edits.
- **Current gap:** the nested-dialog example validates before closing and has
  no cancel/rollback contract. Transactional editing is not currently provided.
- **Required outcome:** support an explicit choice between live editing and
  staged editing. For staged editing, define commit/cancel scope, including
  added/removed descendants, errors, and dirty state.
- **Acceptance scenario:** edit a child group and cancel it; restore its agreed
  baseline while preserving changes made outside that editing scope.

### SEG-08 — Array mutations detach UI state from the intended item

- **Failure:** removing an earlier sibling shifts index paths, so an open editor,
  error link, or pending validation result now refers to a different person.
- **Current gap:** stable list render keys exist, but there is no corresponding
  segment identity contract for navigation and asynchronous work.
- **Required outcome:** keep logical item identity distinct from its current
  data path; discard work targeting deleted items and resolve surviving items
  at their current paths.
- **Acceptance scenario:** open the third group, remove the first, then resolve
  validation; the editor and errors still concern the original third group.

## Navigation, pending work, and persistence

### SEG-09 — Async results race with edits or navigation

- **Failure:** an old availability check approves a segment after its date has
  changed; repeated Next clicks advance twice; an error opens a dialog the user
  has since deliberately left.
- **Current gap:** examples await engine validation but do not specify shared
  navigation/pending-work coordination. Engine-level async handling may already
  cover some races and must be evaluated before adding new machinery.
- **Required outcome:** define result freshness and navigation behavior while
  validation is pending, with cancellation or stale-result rejection as needed.
- **Acceptance scenario:** start a slow check, edit its inputs, and navigate;
  the old result cannot mark the new draft complete or unexpectedly move focus.

### SEG-10 — Navigation makes errors or progress hard to understand

- **Failure:** after advancing, keyboard focus remains on removed content;
  screen-reader users cannot identify the active step; an error link selects a
  tab but focuses before its input mounts.
- **Current gap:** the wizard exposes `aria-current`, but no reusable lifecycle
  connects presentation transitions, announcements, and focus readiness.
- **Required outcome:** let presentation components coordinate accessible step
  identification, error discovery, and focus after transitions. Preserve the
  ability to review completed steps without losing entered data.
- **Acceptance scenario:** complete, revisit, and correct steps using only the
  keyboard, including a failed submission targeting an initially hidden field.

### SEG-11 — Partial saves confuse draft, valid, and persisted states

- **Failure:** a segment looks saved after validation alone; a slow save resets
  edits made after the request began; saving one segment clears another's dirty
  state. A partial response may not satisfy the full submission schema.
- **Current gap:** no segment persistence/baseline contract. Whole-form engine
  facilities exist, but partial-save semantics are left to consumers.
- **Required outcome:** distinguish local validation, local commit, and server
  persistence. Advance baselines only for data actually saved, preserving newer
  edits and unrelated segments. Keep application-specific save logic outside core.
- **Acceptance scenario:** save one segment, edit it again before the response,
  and receive a server error or success; the resulting state accurately represents
  both the saved snapshot and remaining edits.

## Design and verification constraints

- Do not solve these only by prescribing a wizard layout. Exercise the same
  capabilities through tabs, dialogs, conditional sections, and recursive lists.
- Decide which guarantees belong to core, adapters, and presentation bindings;
  engine independence must not require consumers to rebuild the tricky parts.
- Preserve Zod composition and reusable fragments. Do not introduce a second
  manually synchronized tree of fields as the segment model.
- Types, names, and examples should make the supported path easier to discover
  than manual path arrays and subtree walkers. Document any remaining policies
  the application must choose.
- Begin with SEG-01–04 as a connected design investigation, then exercise it
  against lifecycle and async scenarios before settling the interface.
- Verify behavior with interaction tests when implementing it. This backlog is
  based on inspection and has not reproduced each prospective failure.

## External grounding

These sources document underlying concerns; the backlog and proposed outcomes
above are project-specific synthesis, not claims about measured bug frequency.

- [W3C: multi-page forms](https://www.w3.org/WAI/tutorials/forms/multi-page/):
  logical grouping, progress, optional stages, and retaining data when revisiting.
- [W3C: user notifications](https://www.w3.org/WAI/tutorials/forms/notifications/):
  discoverable errors, actionable feedback, and links to affected controls.
- [RHF: trigger](https://react-hook-form.com/docs/useform/trigger): validation
  targeting, dependent fields, asynchronous results, and focus prerequisites.
- [RHF: useForm](https://react-hook-form.com/docs/useform): unmount retention,
  defaults, validation timing, and focus management.
- [RHF: useFieldArray](https://react-hook-form.com/docs/usefieldarray): stable
  identity and the effects of array operations and remounting.
- [RHF: resetDefaultValues](https://react-hook-form.com/docs/useform/resetdefaultvalues):
  saved baselines versus edits made while a save is pending.
- [TanStack: validation](https://tanstack.com/form/latest/docs/framework/react/guides/validation):
  field/form errors, validation timing, and asynchronous checks.
