# Backlog: make the decision space executable

The user clarified the order of work: discover the decision space, represent it
meaningfully in the existing examples, and let concrete code and interactions
put pressure on the design. Do not begin by selecting a theoretical policy and
enforcing it in core.

An example is evidence about behavior and consumer burden. It is not automatic
approval of the policy chosen for that particular application. A working
workaround is likewise not proof that the eventual library interface is adequate.

## DISC-01 — Contrast choices, defaults, and collection behavior

The first executable slice lives in `packages/examples/design-discovery.tsx`,
with stories in `apps/storybook/stories/design-discovery.stories.tsx`, interaction
tests in `packages/examples/tests/design-discovery.test.tsx`, and a docs page
under `examples/design-discovery`.

| Case | Pressure made visible | Evidence |
| --- | --- | --- |
| Save accepts an untouched suggestion | A default is data, not proof of per-field interaction. | Interactive story and passing submit assertion. |
| A choice starts unset | Selecting even the suggested option is sufficient; no separate history flag needed. | Failed empty submit followed by successful selection. |
| Conditional confirmation of a suggested value | Touched, dirty, and confirmed cannot substitute for one another. | Focus/blur does not confirm; confirmation can occur while the choice stays clean. |
| Change away and back | Current equality with the starting value does not establish confirmation. | Returning to Standard is clean, but changing the choice revoked its confirmation. |
| Clear a defaulted choice | Editable absence and parsed fallback can differ. | Save supplies Standard while the current choice stays unset. |
| Confirm after clearing | Confirmation can concern an unseen fallback unless application semantics prevent it. | Explicitly labelled characterization; policy remains unresolved. |
| Condition toggled and form reset | Visibility, retention, and baseline restoration are application decisions. | Conditional controls and reset behavior exercised. |
| Collection controls obey bounds | Current core blocks edits at min/max. | Existing implementation is exposed, not made the universal policy. |
| Collection edits may violate submission bounds | Removing every row and adding above max can be useful drafts; submission still rejects them. | Interactions at 0, 1, 3, and 4 rows; empty list has no per-item Remove. |
| Schema default rows are not materialized | A known initialization gap has an observable empty form and empty submission. | Explicitly labelled characterization assertion, not a desired contract. |
| Remove all initial rows and append new ones | Default values associated with old indexed paths can reappear in newly created rows. | Reuse of Ada/Bea rather than Guest is persistently characterized as a gap. |

The confirmation example intentionally implements one application policy: changing
the selected service clears its confirmation. Reset restores the original
unconfirmed state. Hiding the confirmation control does not itself clear a
previous confirmation; this follows the current form's retention behavior and is
not a general conditional-field policy.

## Consumer bookkeeping exposed by the first slice

- Free collection editing currently renders an unconstrained presentation schema
  while validating a bounded submission schema. They share row definitions, but
  the extra schema/wrapper wiring is real consumer burden to assess.
- Array-level RHF errors may live at `errors.travellers.root.message`, whereas
  ordinary field errors use `message`. The example explicitly handles both.
- The suggested-choice example supplies both a schema fallback and caller
  defaults. Caller defaults give dirty comparison an explicit starting baseline;
  repeating the starting value is a concern to examine, not an idealized new API.
- Conditional confirmation needs an explicit application fact and code revoking
  it when the choice changes. This demonstrates a real interaction, not a new
  schema category or a core feature proposal.
- Plain UI props work with the existing binding shape. No core redesign was
  necessary just to construct these specimens.

## Next slices, not yet represented by this first batch

- Compare schema-only initialization with caller initialization, including dirty
  baselines, programmatic updates, and reset. Do not silently assume materialized
  field defaults participate in every engine's baseline identically.
- Add type-level specimens of strict initialization obligations from INIT-01;
  intentionally crashing forms should be isolated rather than breaking discovery
  navigation.
- Make transform construction order, input/output initialization, and metadata
  visibility inspectable through existing examples; retain the probe's findings.
- Exercise explicit choices inside nested/repeated conditional fields, including
  hidden versus inapplicable, row movement, and reactivation of conditions.
- Add fixed/repeated/contradictory list-bound specimens and generated compatibility
  coverage from COMPAT-01. Keep real defects distinct from alternative policies.
- As the larger segment work is resumed, use the existing complexity framing to
  choose small interacting scenarios rather than inventing a large application.

## Working method

For each slice, state the competing behaviors, the task in familiar terms, the
trigger sequence, visible outcome, consumer code required, and unresolved policy.
Add reproducible assertions and clearly identify characterization of a known gap.
Add generated value/schema cases and model-based action sequences alongside the
hand-written specimens, using the shared TEST-01 infrastructure. The purpose is
to discover failures whose exact data or operation order we did not think of in
advance, then make minimized examples inspectable in this same example space.
Prefer extending the existing examples and explorer; avoid a parallel prototype
framework. Only after examining these specimens should a core policy/interface
be proposed, tested against them, and adopted.

The [current review plan](review-plan.md) owns sequencing and EX-01–05 consolidate
the next slices above; they are not additional parallel workstreams. The
[diagnosis](diagnosis.md) and [review log](design-review-rounds.md) own the latest
finding IDs, corrections, and verification status.

The initial six stories passed browser mounting/accessibility and the four
original play functions; the initial seven jsdom checks passed. Review then
strengthened coverage and exposed an additional append/default-path gap. See the
review log for the updated checks. This first slice is not full coverage of the
decision space or a promise that the remaining scenarios are implemented.
