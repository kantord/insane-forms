# Diagnosis: field contracts, schema behavior, and example coverage

This is the consolidated diagnosis from the project review and subsequent
discovery discussion. It is an evidence inventory, not a selected replacement
architecture. The immediate work is to make meaningful cases executable in the
existing examples, then compare solutions against the same cases.

## Evidence levels and scope

- **Reproduced:** a focused runtime or compile-time probe demonstrated the result.
- **Persistent:** an assertion remains in the repository and can be rerun normally.
- **Inspected:** supported by source inspection, without a dedicated reproduction.
- **Scenario:** a plausible interaction or product requirement to investigate;
  not a claim that the present implementation exhibits the failure.
- **Decision:** behavior the application/library needs to choose; an existing
  implementation is not by itself approval of that policy.

Historical probe files were removed after their results were recorded. Their
findings are reproduced in the linked research notes but are not all permanent
regressions yet. The first discovery slice adds six persistent stories and seven
jsdom tests. At that initial checkpoint the root suite had 64 passing tests,
the six browser cases passed mounting/accessibility (four included interaction
plays), and TypeScript/Storybook builds passed. The later review rounds add
stronger assertions; their final verification is recorded separately.
Those results do not establish comprehensive coverage or all-engine equivalence.

## Grounding requirements

- The schema represents the submission contract; editable representation and
  private display state belong to UI fields. Bindings connect these contracts.
- UI implementations should use ordinary props without requiring insane-forms
  imports. The current binding call shape can already express that separation.
- Preserve useful schema/submission precision without forcing meaningless casts
  in widget glue. String-based enum controls are not automatically a defect.
- Either a field handles absence or a valid concrete initializer must be supplied;
  ordinary typed forms that violate this should not compile. Caller defaults
  may satisfy initialization; fields need not always initialize themselves.
- Consumer control of editing policy should be preserved unless a concrete
  correctness constraint warrants a restriction. Collections nevertheless have
  nonnegative actual counts and require existing targets for removal.
- First materialize the decision space in examples. A specimen's policy is not
  a universal core decision, and a workaround's existence does not establish
  acceptable ergonomics.

## A. Field typing and initialization

| ID | Diagnosis / trigger | Evidence | Consequence / distinction |
| --- | --- | --- | --- |
| F01 | Annotated one-go `field` infers schema `S` and widget `W` independently. | Reproduced; `research-transform-probe.md`, initialization notes. | A string schema can bind an unrelated numeric/Date widget. Unlike practical enum widening, this can supply values the UI cannot consume. |
| F02 | Curried initialization guard checks absence tolerance/default/initial, not schema/widget representation compatibility. | Reproduced by the skeptic type probe; source in `types.ts`. | Merely applying that guard to the other overload is insufficient. |
| F03 | A strict numeric slider with no field initializer compiles when the consuming form omits defaults or supplies undefined. | Reproduced with `value.toFixed()` on first render; full repro in INIT-01. | Runtime value violates UI type. Caller `{ volume: 50 }` works, so forcing every reusable field to initialize itself is unnecessarily restrictive. |
| F04 | Bound schema returns plain `S`; the form wrapper accepts optional deep-partial input defaults. | Inspected. | The strict-widget initialization obligation is not preserved through the schema to the consuming form. Exact type encoding remains an investigation. |
| F05 | `initial?: unknown` permits an initializer unrelated to editable input. | Reproduced for numeric initial value supplied to string-input transform. | Check editable initialization, not just presence of a seed or output compatibility. |
| F06 | Nullish fallback chooses `initial` when a schema default is null. | Source-confirmed and validated by skeptics; `annotateLeaf` and `seedFor`. | Null is a meaningful value, distinct from absence. Null preservation needs a permanent regression. |
| F07 | `DraftOf` derives editing values from widened output and removes absence for certain defaults; enum paths have separate widening branches. | Inspected; transformed-input failure reproduced below. | Starting with a value does not establish that the UI can never clear it. Representation policy should not be confused with schema output extraction. |

Relevant edge cases: missing key, explicit undefined, null, 0, false, empty
string, schema default, binding initial, caller defaults, caller override,
wrapped/defaulted schemas, nested/fragment composition, appended rows, and reset.
Only some of those combinations have dedicated probes. INIT-01 records the
desired compile-time outcomes and investigation constraints.

An ordinary numeric `.default(42)` filling cleared/missing submission input is
intentional Zod behavior, not the stale-widget-value bug initially hypothesized.
Current numeric widgets explicitly emit undefined when cleared. A separate
binding `initial: 42` can express a starting suggestion without a parse fallback.

## B. Input/output transformations and introspection

| ID | Case | Evidence and current result |
| --- | --- | --- |
| T01 | Bind a text widget after constructing a string-to-number transform. | Reproduced: string edits, numeric submission, invalid-text errors and blocked submission. No general lack of runtime transform support. |
| T02 | Contextually inferred widget on that schema calls numeric methods. | Reproduced: inferred output `number | undefined`, actual editable input string; `toFixed()` compiles then throws. |
| T03 | Bind first, then call `.transform(...)`. | Reproduced: renderer lookup fails and no control renders. The parser can still submit transformed caller values. |
| T04 | `.trim()` versus `.transform(s => s.trim())` after binding. | Reproduced: trim preserves rendering; the pipe transform hides it even though both sides remain strings. Construction structure matters, not only primitive type changes. |
| T05 | String-input/numeric-output schema has an outer `.default(7)`. | Reproduced: numeric output default seeds editable state; untouched submission fails its string input check. `.prefault('7')` works in the exercised case. |
| T06 | Input-side title, placeholder, checks, and default behind a pipe. | Reproduced: introspection does not reach them; metadata on the outer bound pipe is read. `resolve` follows `innerType`, not pipe input/output. |
| T07 | Caller defaults for the transform. | Reproduced: string caller defaults work; wrapper types reject numeric caller defaults. This existing input typing should be preserved. |
| T08 | Object derivation after binding: `.extend()`, `.pick()`, `.omit()`, `.partial()`, and `.partial().required()`. | Round-one reviewer reproduced renderer lookup loss while parsing remains valid. Existing interop assertions check parsing, not rendering continuity. The confirmation specimen works around `.extend()` with a separate presentation group. The continuity promise still needs an explicit case/decision. |

Open behavior includes renderer continuity under chaining and which schema
information hints should describe. Async transforms, reverse mapping parsed
records, and general pipe combinations were not tested. These need specimens,
not an assumed universal traversal or a mandatory new draft-schema interface.

## C. Collections

| ID | Diagnosis / case | Evidence and interpretation |
| --- | --- | --- |
| L01 | `.length(n)` check read as `minimum` instead of `length`. | Reproduced in helper and actual Add/Remove interactions. It reports unbounded sizes under the current gating contract. |
| L02 | Repeated min/max checks overwrite instead of intersecting. | Reproduced: `.min(3).min(1)` permits below 3; `.max(1).max(3)` permits above 1. Contradictory check chains also need explicit representation. |
| L03 | Ordinary optional/default wrappers around an array. | Reproduced working in rendering: Render unwraps before bounds extraction. Do not report this as a wrapper-rendering bug. Exported helper acceptance is a separate contract. |
| L04 | Array `.default([{ name: 'Ada' }])` without caller values. | Reproduced and persistently characterized: no rows; RHF materializes `[]`; untouched submission yields [] rather than applying a missing-input fallback. Nested array defaults also ignored in the probe. |
| L05 | Explicit caller rows or explicit []. | Reproduced working. A deliberately empty array is present data, not a missing value to overwrite. |
| L06 | Appended row initialization. | Reproduced working for tested element defaults, leaf defaults, and explicit seed overrides. `seed` is an append template, not an initial array. Primitive string rows also worked in exercised cases; do not assert universal primitive-array failure. |
| L07 | `.min(3)` with no initial rows. | Reproduced: starts at 0 with Add available. A validation minimum does not provide a row template or require automatic population. |
| L08 | Editing constraints versus submission constraints. | Decision exposed by persistent contrasting examples: current gated UI versus free editing with the same 2–3-row submission requirement. Free editing uses separate presentation/validation schemas as a consumer workaround. |
| L09 | Empty structure and repeated operations. | Persistent free-editing example reaches 0 rows, exposes no per-item Remove, and next Add creates one row. This is not a proof of all stale-index, reorder, or async deletion behavior. |
| L10 | Array-level validation errors. | First discovery tests exposed RHF root-message placement; example explicitly checks both `root.message` and `message`. Error presentation is not supplied by list chrome automatically. |
| L11 | Delete both initial Ada/Bea rows, append new object rows, then save. | Strengthened round-one assertions exposed and persistently characterized reuse of Ada/Bea from caller default paths instead of the declared Guest leaf seed. Newly appended identities need an initialization contract distinct from original indexed defaults. The exact interaction between RHF baseline fallback and incomplete object append values is an investigation; do not label it a universal engine defect. |

Array mount, append, removal, caller replacement, remote update, and reset are
different operations. Reapplying defaults every render could restore deleted
rows; this is a risk to test, not a reproduced fix-regression. Collection policy
must retain structural invariants without equating all submission-invalid edits
with unsafe operations.

## D. Values, interaction, and conditional explicitness

| ID | Case | Evidence / remaining question |
| --- | --- | --- |
| C01 | Untouched defaults accepted on submission. | Existing profile test and new suggestion example assert this working behavior. Save may intentionally mean acceptance of displayed defaults. |
| C02 | Choice starts unset. | Persistent example rejects missing choice and accepts a selected option; no extra interaction flag is necessary for this case. |
| C03 | Prefilled value requires a separate confirmation under a condition. | Persistent application specimen uses a confirmation fact; focus/blur does not confirm. It does not establish a new built-in schema category. |
| C04 | Confirm the current starting value; change A→B→A. | Persistent specimen: confirmation can be true while the choice is clean; changing the service revokes confirmation, and returning to the starting value does not restore it. Selecting an already-selected option is a different control-specific event case and remains untested. |
| C05 | Condition toggled or form reset. | Round-one revisions exercise confirmed→reset, dirty/touched reset, confirm→hide→reactivate, and a user dependency change while confirmation is hidden. Programmatic changes and alternative retention policies remain untested. |
| C06 | Schema-only seed versus caller baseline. | Gap: current suggestion specimen provides both, so it does not isolate schema-only default materialization/dirty-baseline behavior. |
| C07 | Programmatic update, refresh, save response, remount, nested/repeated choice. | Scenarios, not established guarantees. Distinguish value, comparison baseline, touched state, explicit confirmation, and identity across these operations. |
| C08 | Clear a defaulted choice, confirm while its displayed value is Unset, then save. | Round-two reviewer identified the cross-case; a permanent characterization records schema fallback Standard being submitted with confirmed=true while display remains unset. This exposes an application-policy gap, not an approved UX contract or a universal core bug. |

RHF's current engine binding exposes value/change/blur/error but not dirty or
touched through the core FieldBinding. Native form methods provide more state.
The example labelled “I accept the terms” is an ordinary default-false boolean,
not a required-true assertion. Labels do not establish validation policies.

## E. Broader gaps and deferred work

- **Segments:** SEG-01–11 inventory scoped membership/validation, hidden errors,
  summaries, applicability, completion invalidation, transactional edits, stable
  identity, stale async work, focus, and partial saves. These are primarily
  inspected gaps/scenarios, not eleven reproduced defects. Broader segment work
  is deferred until fundamentals are represented, then should resume through
  small combinations from the complexity framing.
- **Distribution:** core source is engine-independent but mandatory RHF/resolver
  peers remain. Separate published integrations and installable shadcn bindings
  are directions under discussion, not a finalized package/registry interface.
- **Documentation:** the README references absent core form-wrapper exports.
  Current design reference distinguishes ordinary UI from integration code.
- **URL state:** one-way updates/initial URL seed are inspected; reverse
  navigation synchronization is not demonstrated. Replace history is deliberate.
  Do not call the one-way helper broken for failing to promise two-way behavior.
- **Application/ergonomic evidence:** product-discovery notes report a real palette
  editor and copied adapter, including declaration/watch-value workarounds. Those
  are inspection/experience reports, not reproduced current package defects.
  A fair Address comparison with RHF lenses is planned, not performed; no
  superiority claim is established.
- **Maintenance:** dependency counts and newer-release inventory were measured;
  eligibility under the now-three-day release-age policy needs a fresh check.

## F. What comprehensive evidence would require

The existing API-test gate checks name references, not case coverage. The
compatibility corpus should identify schema factories, feature applicability,
input cases, dependency versions, expected versus observed behavior, and whether
the assertion establishes an approved contract or only characterizes a known gap.
Unknown/not-applicable/unsupported must not collapse into “passed.”

The bounded oracle experiment covered 343 schemas and 3,087 input lengths. It
found 1,072 mismatches in the current reader and 60 in the installed JSON Schema
exporter, with the latter confined to contradictory schemas in that sample.
Those are failing comparisons, not independent bug counts or proof over arbitrary
refinements. Arbitrary acceptance predicates need not form a length interval.

The [example discovery backlog](example-discovery-backlog.md) currently lists a
first slice, not a complete suite. The next plan must map each relevant diagnosis
to an existing/pending executable specimen, mark unsupported/deferred cases,
identify the alternative being compared, and measure the consumer code it needs.

## Evidence index

- [Initialization repro and INIT-02 scenarios](field-initialization-backlog.md)
- [Transform runtime/type probe](research-transform-probe.md)
- [Bounds probes and independent parser oracle](research-collection-bounds.md)
- [Collection initialization and append probe](research-collection-initialization.md)
- [Compatibility corpus backlog](zod-compatibility-backlog.md)
- [First executable discovery slice](example-discovery-backlog.md)
- [Segments backlog](form-segments-backlog.md)
- [Complexity scenarios](form-complexity-framing.md)
- [Product discovery and application evidence](product-discovery-notes.md)
- [Site design reference](../apps/docs/docs/guides/design-reference.md)

Review rounds and plan revisions are recorded in `design-review-rounds.md` once
the independent reviews have completed. This diagnosis will be corrected when
those reviews identify missing evidence, inaccurate scope, or redundant cases.
