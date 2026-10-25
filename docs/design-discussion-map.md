# Remaining design discussions

This map consolidates the review discussion and agent notes as of 2026-10-25.
It distinguishes user-facing behavior decisions from implementation investigations.
It is not authorization to implement every listed capability.

The [product discovery notes](product-discovery-notes.md) own the complementary
value/adoption framing and corrections: composition supplies binding paths,
RHF/lenses are overlapping tools rather than incapable alternatives, and shared
backend/resource/ORM schemas are explicitly deferred future exploration. The
[review plan](review-plan.md) remains the source for execution order.

Priority clarified by the user: materialize the decision space in the existing
example code and interactions before selecting and enforcing broad design
policies. See [the example discovery backlog](example-discovery-backlog.md) for
the first executable slice, its findings, and the remaining example gaps.

## Principles already established in the discussion

- Schemas represent submission contracts; UI fields own editing representation.
- UI implementations should be usable through ordinary props without requiring
  insane-forms type imports. The existing binding call shape already provides
  the relevant integration seam; a new abstraction is not inherently required.
- Keep submission inference precise and widget types as specific as useful,
  without forcing casts or strictness that offers no practical benefit.
- Explicit bindings can connect different editable input and submission output
  types. Initialization must respect editable values, not blindly use outputs.
- Caller form defaults are legitimate initialization sources. Either a UI field
  handles absence or consuming code must provide a suitable concrete initializer;
  ordinary typed forms violating that requirement should fail compilation.
- An initial suggestion and a Zod submission fallback have different meanings.
  Filling missing submitted input with an explicitly declared default is not
  itself a bug.
- The compatibility corpus should record measurements and assertions, distinguish
  observations from intended behavior, and make coverage gaps explicit.

See the [site design reference](../apps/docs/docs/guides/design-reference.md).

## Entire topics not yet worked through here

The user has deferred the following three topics until the more fundamental
field/binding and collection work is addressed. They are not immediate blockers.

### Form segments and complex-form coordination

The [segments backlog](form-segments-backlog.md) and
[complexity framing](form-complexity-framing.md) introduce a broader scope than
individual field bindings. They describe bookkeeping for steps, tabs, dialogs,
conditional groups, repeating items, and recursive editors. The evidence is
primarily inspection and acceptance scenarios, not reproduced failures for
every item.

Areas requiring product understanding:

- Segment membership, scoped validation, and summary errors (SEG-01, SEG-03,
  SEG-04): how much structural bookkeeping should reusable library support own?
- Hidden errors and focus/navigation (SEG-02, SEG-10): what must the library
  identify or coordinate so a consumer can reveal and reach an invalid field?
- Temporary hiding versus inapplicability (SEG-05): which retention, validation,
  and submission policies must consumers be able to express?
- Completion/invalidation and staged edits (SEG-06, SEG-07): distinguish validated
  from complete, and live dialog editing from transactional commit/cancel.
- Identity, pending work, and persistence (SEG-08, SEG-09, SEG-11): avoid attaching
  stale work to another row or overwriting newer edits with a save response.

The notes suggest starting with membership, validation, and reachable errors
rather than designing all eleven items at once. Presentation remains consumer
chosen; these notes do not prescribe a built-in wizard or dialog component.

### Published integration structure

A separate published RHF package was suggested but not finalized. Decide the
maintained/published integration surface and which engines are reference examples
versus supported packages. The current core source is engine-independent, while
its manifest still requires RHF/resolver peers. Package names and build wiring
can follow the distribution decision; they need not start a new framework design.

### URL-state behavior

The current examples seed from the URL and write form values back using replace
history. They do not demonstrate reverse synchronization into an already-mounted
form after navigation. Decide whether to promise reactive two-way/navigation
behavior or document the narrower scope. This was identified by inspection, not
confirmed through a browser-navigation reproduction.

## Unfinished parts of topics already discussed

### Lists: editing constraints

The user's direction is to preserve consumers' freedom to choose collection
editing behavior and make that choice discoverable. Submission limits should not
unavoidably restrict editing unless a concrete, compelling correctness reason
justifies the restriction. Stress-test that direction against real cases before
choosing an interface; do not invent restrictions from speculative risks.

Non-negotiable structural invariants still apply: counts represent actual items
and cannot be negative; deletion requires an existing target. Consumer control
over submission-bound gating does not imply support for impossible collection
states or a negative count that later Add actions must cancel.

The current core gates editing. For example `.min(1)` prevents removing the last row.
The [bounds probe](research-collection-bounds.md) separately reproduced real
extraction bugs under that existing policy; fixing them need not decide the
broader editing policy.

### Lists: initialization

The [initialization probe](research-collection-initialization.md) found that
schema list defaults do not create initial rows and RHF materializes an empty
array, bypassing the missing-input fallback on untouched submission. Caller
values and append seeds worked in the exercised examples.

Clarify whether schema-based initialization should cover containers as it does
leaves, and preserve the distinction between omitted values, explicit empty
arrays, initial rows, append templates, and child-field defaults. A minimum
constraint is not by itself a request to manufacture starting rows.

### Transforms: composition and introspection

Editable input versus submission output is understood; the remaining behavioral
question concerns ordinary chaining and derived UI information. The
[transform probe](research-transform-probe.md) confirmed explicit binding after a
transform works, whereas transforming an already-bound field loses renderer
lookup. Hints also cannot see through the pipe's input. Specify what is promised
about renderer continuity and which schema information a UI binding should use.
Do not treat current opacity as proof that parsing transforms is unsupported.

### Compatibility policy for previously undefined cases

The [compatibility backlog](zod-compatibility-backlog.md) can proceed without
settling every case. Its measurements should expose per-feature decisions about
supported behavior, explicit limitations, contradictions, and unsupported schemas.
Snapshots must not silently approve observed defects. A new general design for
the test runner is not a prerequisite.

## Investigation or implementation, not unresolved product intent

- [Compile-time initialization enforcement](field-initialization-backlog.md):
  investigate preserving requirements through composition and checking caller
  defaults. The ordinary missing-initializer examples should not compile; that
  desired outcome has been stated.
- Implement useful binding compatibility checks and input-aware inference while
  preserving practical UI representations. Type encoding alternatives can be
  evaluated against concrete examples before asking for further decisions.
- Fix discarded null defaults, fixed-length extraction, and repeated bounds.
- Investigate output-default/input-seeding mismatch without confusing it with
  the intentional same-type submission fallback behavior.
- Build the compatibility inventory, generators, assertions, and reports.
- Update documentation and package examples to match the chosen supported path.
- Maintain dependencies under the agreed three-day release-age policy.

## Documentation precedence

The current [review plan](review-plan.md) is the single execution sequence;
the [diagnosis](diagnosis.md) owns the finding/evidence inventory. It replaces
the old prescriptive two-schema sequence. The site reference and specific
backlogs retain concepts and detailed scenarios, not competing implementation
schedules. [Review rounds](design-review-rounds.md) records the independent
challenges and how they changed the diagnosis, examples, and plan.
