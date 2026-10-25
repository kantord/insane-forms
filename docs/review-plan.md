# Plan: executable diagnosis, comparable solutions, then core changes

This is the current plan, replacing the earlier prescriptive two-schema/extraction
sequence. It follows the user's direction: expose the decision space through
existing examples before selecting and enforcing an architecture.

## Sources of truth

- [Diagnosis](diagnosis.md): stable finding IDs, causes, evidence, and scope.
- This document: one execution order and one owner for each work item.
- [Review rounds](design-review-rounds.md): reviewer findings and their disposition.
- [Site reference](../apps/docs/docs/guides/design-reference.md): concepts and
  status for readers. Detailed research notes remain evidence, not duplicate plans.

INIT-01/02, DISC-01, COMPAT-01, and SEG-01–11 retain their detailed scenarios.
The work items below reference them instead of repeating them as independent
parallel projects. Nothing here authorizes choosing a new public interface,
installing a particular distribution, or publishing a release.

## Work sequence

### 0. Repair the existing evidence before expanding it

**Owner:** the current discovery slice and its tests. **Status:** two review
rounds completed and corrections made for this checkpoint; verification is
recorded in the review log. This does not complete the EX-01–05 expansion below.

- Show shared specimen implementation in each explorer code panel, not just a
  helper invocation. Source exposure is generated from the actual file.
- Make min/max rejection distinguishable and assert exact current payloads;
  an old alert or earlier saved result must not satisfy a later assertion.
- Exercise confirmed-to-reset and hidden/reactivated confirmation, including
  a user dependency change. Do not generalize this to programmatic updates.
- Preserve the newly exposed removed-row/default-path reuse as a labelled
  characterization, not a silently approved append policy.
- Distinguish browser mount/accessibility coverage from interaction assertions.

### 1. Complete a compact set of fundamental specimen families

Each family must be runnable from the existing explorer where meaningful,
expose all integration code, and pair runtime interactions with type-level
consumers where typing is part of the claim. Use parameterized cases rather
than one independent demo per minor variation.

Generated testing is part of these families from the start, not an optional
follow-up after all hand-written cases. The user explicitly wants techniques
that expose inputs and operation orderings we did not anticipate individually:

- EX-01/02: property-based generation of values, initializer-source combinations,
  wrappers, derivation/check chains, and bounded composition. Compare against
  independent parser behavior or an explicit field contract as appropriate.
- EX-03: generate boundary/contradictory size constraints and append/remove/reset/
  replacement sequences; track distinguishable logical items, not just counts.
- EX-04/05: stateful/model-based generation of edits, conditions, reset,
  replacement, remount, and repeated-item operations across root/nested scopes.
  Compare actual state with a small independently defined model of the selected
  application policy. Do not model every application as having the same policy.

Share generator infrastructure through TEST-01 below. Each EX owner supplies its
properties and applicable commands, rather than building a separate harness.
Fast-check is the proposed tool to investigate for generation and shrinking;
this plan change does not install it or claim those properties already exist.
Use bounded ordinary runs in CI and an expandable longer-running fuzz mode.
Record versions, seeds, and replay information; minimize failures and promote
them into named deterministic specimens. Shared invariants and models must be
specified, but individual failing cases need not be predicted in advance.

| Work item / sole scope owner | Diagnoses | Existing evidence | Missing discriminating cases |
| --- | --- | --- | --- |
| EX-01: initialization sources and compile-time obligations | F01–F06, C06; INIT-01 | Slider and type probes; ordinary defaulted controls; no complete persistent source comparison | Same field under schema default, binding initial, and caller defaults; absence/null/falsy/override; clear/reset/programmatic load; strict versus absence-capable UI; one-go versus curried; missing/undefined/wrong defaults and nested type preservation |
| EX-02: transformations and schema derivation | F07, T01–T08 | Removed runtime/type probes and current presentation workaround | One persistent string-input/numeric-output specimen covering bind order, trim versus transform, default versus prefault, input caller values, metadata/hints, and async result handling; object extend/pick/omit/partial render continuity; explicit versus contextual widget typing |
| EX-03: collections and structural bounds | L01–L11; collection part of DISC-01 | Contrasting gated/free/known-default-gap specimens; append/bounds probes; persistent removed-default reuse case | Fixed/repeated/contradictory bounds; omitted versus explicit empty versus nested defaults; initial-array/append/leaf seed precedence; collection reset/caller replacement after deletion; distinguish defaulted old paths from new row identities; min is not automatic population; boundary rejection and exact current payloads |
| EX-04: interaction intent and lifecycle | C01–C05, C08, lifecycle part of C07; INIT-02 | Suggestion/unset/confirmation/reset/hide specimens; fallback-plus-confirmation characterization | Actual same-value control events; programmatic dependency updates; reset/replacement after confirmation; one actual field unmount/remount; explicit retention/reconfirmation alternatives, including what confirmation means when parsing supplies an unseen fallback. Keep touched, dirty, confirmation, and save acceptance separate |
| EX-05: composition and identity cross-checks | compositional F04/L09/C07; first limited SEG interactions | Nested/recursive existing stories, primarily isolated assertions | Reuse the same group at root, under shipping, and in named rows; change only its own confirmation; edit second row/remove first/append and verify identities, values, errors and relevant state. Do not duplicate EX-01 source cases or EX-04 lifecycle setup |

A representative interaction basis is required, not an infinite Cartesian
product. For each dimension, record which single cases and high-risk pairs are
covered, why others are inapplicable/deferred, and what future discovery would
expand the basis. Use the same reusable definitions across contexts to expose
path or metadata drift; do not hide the problem by rewriting each case.

For strict initialization, the desired negative examples currently compile.
Keep characterization of current compiler acceptance separate from the future
expected rejection; do not add fake expected-error directives that break the
normal typecheck or approve the hole as a contract.

EX-02 also owns an edit-existing-record case: load parsed output back into an
input-shaped editor, contrasting an explicit reverse mapping or codec with a
one-way transform. Record the consumer glue and any unsupported direction;
do not assume ordinary transforms can be inverted. This follows the
[Zod research](research-zod-drafts.md), rather than a demonstrated current bug.

Lifecycle operation ownership is explicit to prevent both omissions and duplicate
fixtures: scalar initialization/baseline reset is EX-01; collection reset/caller
replacement is EX-03; confirmation updates and a bounded scalar unmount/remount
are EX-04; moved/repeated instance identity is EX-05. Save-response races and
partial-persistence baselines remain deferred to SEG-09/11; they are not silently
claimed by ordinary reset coverage. Reuse common setup/assertions across these
owners rather than building parallel scenario frameworks.

### 2. Grow compatibility evidence alongside the specimens

**Work item:** TEST-01, the sole implementation owner of COMPAT-01.

Start with deterministic bounds-oracle cases, then generated check sequences and
relevant schema wrappers/composition. Reuse the EX fixtures where applicable.
Inventory each built-in feature against known schema categories and distinguish
approved contract, known discrepancy, unsupported, inapplicable, and unexamined.
Snapshots record observations; differential assertions check observable relations.
Retain shrunk failures and dependency versions. The generator/file/JSON format is
an engineering choice, not a prerequisite product decision.

TEST-01 supplies shared seeded generation, shrinking/replay, and reporting for
the EX families in parallel with their deterministic examples. It must not become
a later phase that leaves initialization or lifecycle testing example-only.
Keep fixed regressions, bounded enumeration, generated properties, independent
differential checks, and model-based sequences complementary. Check that the
assertions are sensitive to representative deliberate faults before treating a
large run count as strong evidence.

Do not delay every UI specimen until this harness exists or build a parallel
example framework. Conversely, a handful of passing stories is not a substitute
for schema-case evidence. Compile-time fixtures and packed-package consumers are
separate evidence layers from runtime snapshots.

TEST-01 also owns an adapter-contract check using the same EX fixtures. The
[form-practices research](research-form-practices.md) identifies a tension:
our editable contract permits `undefined`, while RHF Controller documentation
prohibits undefined defaults and `onChange(undefined)`. Characterize initialization,
clear, submit, and reset through the actual adapter, then establish a supported
mapping or explicit capability limit. Passing current probes does not settle
upstream support, and the documentation mismatch alone is not a reproduced crash.
Record engine/version provenance and distinguish engine-specific behavior from
core guarantees; broader engine comparisons can follow without duplicating these
fixtures.

### 3. Compare implementations under fixed requirements

**Work item:** COMPARE-01. Start per family once its discriminating examples exist;
there is no need to wait for all deferred segment features.

Keep task, application policy, input/output semantics, visible behavior, and
acceptance sequences identical across candidate implementations. Gated versus
free editing is policy discovery, not an ergonomics contest between equivalent
implementations. Choose a policy for a comparison before varying its interface.

Include the current supported path as a baseline. Prototype alternatives locally
without changing the default core. Candidates may change type encoding,
initialization ownership, explicit binding glue, or metadata lookup; those are
experiments rather than prescribed architecture. Do not mandate an extra draft
schema, provenance flag, or public initializer marker in advance.

Evaluate:

- observable correctness and recovery at boundaries;
- compiler rejection/acceptance and inference through composition;
- repeated schema/default/path declarations, casts, and manual error bookkeeping;
- initial setup versus repeated-use cost;
- changes needed when moving/reusing/specializing a group;
- UI freedom, accessible errors, state retention, and predictable reset;
- whether a person or coding agent can discover the supported path from the
  examples without inventing fragile parallel structure;
- declared dependencies, adapter capability limits, and significant runtime/type
  checking costs where relevant.

Line count and a working screen are insufficient by themselves. Record tradeoffs
and unresolved cases, not just a winner. Check a typed consumer against built
package declarations before claiming that source-level inference survives publishing.
The external palette-editor declaration workaround is evidence to investigate,
not a reproduced defect in the current package.

### 4. Choose bounded changes, implement, and rerun the unchanged specimens

Only after comparison choose the behavior/interface for the affected slice.
Implement independent proven defects with regressions without bundling unrelated
policy changes. Update an observation snapshot only with an explicit disposition
of the prior known discrepancy; do not erase counterexamples to obtain green tests.
Keep documentation generated or linked to the same evidence, and record decisions
that were actually made. Do not turn missing example coverage into a false support
promise or block useful bounded progress on universal completeness.

## Deferred work and relationships

- Broader segment validation/navigation, staged cancel, async races, and partial
  saves remain under SEG-01–11 after the fundamental EX-05 interactions. The
  complexity framing supplies scenario selection, not a demand to build a huge app.
- A fair RHF/lenses Address comparison, maintained shadcn distribution, package
  layout, URL-navigation scope, and release explanation remain later product work.
  Reference product-discovery notes; do not repeat these in each EX family.
- Dependency maintenance follows the established three-day policy and remains
  separate from architecture comparisons. No dependency upgrades are selected here.

## Exit criteria for the discovery/evaluation stage

- Every selected EX-01–05 case and representative high-risk interaction has
  persistent executable evidence. Missing selected cases remain open and cannot
  satisfy this exit gate merely by being labelled missing. Current failures may
  be explicitly characterized for discovery; that is not approved support.
- Every remaining diagnosis has an explicit deferred/out-of-scope/unsupported
  classification with rationale, without using those labels to silently remove
  an agreed requirement. Historical probes alone do not complete a selected case.
- At least one small composition/identity interaction exercises each fundamental
  family; examples with hard-coded root paths cannot prove reusable placement.
- Current versus desired outcomes and policy variants are distinguishable.
- Equivalent candidate implementations run the same discriminating assertions;
  code and setup costs remain visible to reviewers.
- Selected families include generated coverage in addition to named cases, with
  declared generator/command scope, independent properties or models, and
  reproducible failure replay. Run count alone cannot satisfy the coverage gate.
- Runtime, browser interaction/accessibility, compile-time, and package-consumer
  evidence are named separately. Report actual checks, not a general completeness
  claim. Gaps discovered during evaluation expand the corpus explicitly.

Passing this discovery gate means the selected questions are observable, not that
the implementation satisfies all desired outcomes. A solution passes comparison
only when it satisfies the agreed contracts for the same cases; approving current
bug snapshots or deleting counterexamples cannot substitute for that evidence.
