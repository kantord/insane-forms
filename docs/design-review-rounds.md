# Discovery review rounds

Scope: challenge the consolidated diagnosis, current examples, and the plan for
making the decision space executable before comparing solutions. Reviews are
not approval of the current implementation or a claim that the eventual example
suite is already complete.

## Round one

Three independent agents reviewed evidence accuracy, interaction coverage, and
ergonomic/product relevance. They inspected current source and research notes;
the diagnosis reviewer also ran and cleaned a temporary object-derivation probe.

| Finding | Disposition |
| --- | --- |
| Object combinators lose renderer lookup while parsing still works. | Added T08 to the diagnosis and EX-02 to the current plan. Continuity promise remains open; no automatic core fix selected. |
| Story code panels hide integration code behind helper invocations. | Added a source-file marker to the existing code-panel plugin and exposed the actual module for all six stories. Direct plugin execution verified every panel includes the implementation and story invocation. |
| Oversized list rejection and final success assertions can be satisfied by stale state. | Assert specific current min/max errors, unchanged Not saved output on rejected submissions, and exact named successful payload. |
| Stronger payload assertion uncovered deleted initial names reused in newly appended rows. | Added L11 and a persistent known-gap characterization. Boundary tests explicitly enter distinct new names so they test policy separately from seed behavior. Current data is visible in the example. No engine-wide blame or fix policy inferred. |
| Confirmation narrative conflates confirming a prefilled value with reselecting an already-selected option. | Narrowed C04 and kept same-value selection events as a pending control-specific case. |
| Reset test never starts from a confirmed, edited state. | Added those transitions and touched/dirty/value assertions. Added hide/reactivation and hidden user dependency changes. Programmatic changes remain missing. |
| Six browser cases included two without interaction assertions. | Added plays for bounded collection and default-gap characterization; rerun pending. Earlier mount/accessibility results are not relabelled as prior interaction proof. |
| Root-only specimens cannot demonstrate composition-supplied paths or row identity. | EX-05 explicitly requires root/shipping/repeated reuse with distinct values and state. It is not claimed complete. |
| Removed probes are not a permanent acceptance suite. | Current plan maps findings to compact EX families and makes persistent/missing/deferred status an exit criterion. |
| Different policies are mistaken for equivalent solution comparisons. | Plan separates policy specimens from candidate implementations and requires identical task, policy, outputs, and assertions for comparisons. |
| Old plan prescribes two-schema/interface choices ahead of discovery. | Replaced it with one execution sequence and shared evaluation criteria. Research/backlog detail remains linked rather than copied into multiple schedules. |

At this checkpoint ten focused discovery interaction tests pass. Complete root,
browser, type, and build checks will be recorded after the second review.

## Round two

Three fresh agents reviewed the revised evidence, the plan's coverage/exit
criteria, and the actual specimens/tests/source panel. None claimed that the
existing first slice is a complete suite or that solutions have been compared.

| Finding | Disposition |
| --- | --- |
| The discovery exit gate could be satisfied by labelling required cases missing. | Tightened it: selected EX-01–05 cases and high-risk interactions need persistent execution. Missing selected cases remain open; known-gap characterization is not approved support. |
| Lifecycle ownership omitted collection reset/replacement, actual field remount, and save-response scope. | Assigned operations explicitly to EX owners; save-response/partial-persistence races remain deferred SEG work rather than being claimed by reset tests. |
| Confirmation combined with clear-to-undefined can accept an unseen schema fallback. | Added C08, an explicit EX-04 cross-case, a persistent characterization, and a docs explanation. No core/app-policy fix was silently chosen. |
| A stale conditional error after switching the requirement off might need exploration. | Retained under EX-04/segment feedback policy. Reviewer classified this as an optional unverified probe, not a new confirmed defect or promise of immediate error clearing. |
| Prior fixes needed independent verification. | Specimen review found the revised payload/rejection/reset assertions discriminating, full source visible for all six story panels, and broader composition/programmatic/transform/type gaps honestly classified. |

The evidence reviewer found no blocking classification error beyond the new
cross-case. The plan reviewer judged the revised mapping credible after the
exit-gate/lifecycle changes. The specimen reviewer found no remaining blocking
issue for this repair checkpoint; its own pnpm command could not run because of
a read-only package-manager store, so executable verification is performed by
the primary agent and reported separately below.

## Final verification

After incorporating the second-round cross-case:

- Root Vitest suite: **68 tests passed**, including **11** persistent discovery
  interaction/characterization cases.
- Targeted Storybook Chrome suite: **6 stories passed**, now all with play
  assertions in addition to configured accessibility checks.
- Repository TypeScript check and Biome checks on changed implementation/test
  files passed; `git diff --check` passed.
- Storybook and documentation production builds passed. Existing CSS/chunk-size
  and Docusaurus configuration/update-check warnings do not represent new test
  failures and were not changed as part of this discovery work.
- Direct execution of the code-panel plugin verified that all six discovery
  panels contain the actual shared source and the story invocation.

The full example suite and equivalent candidate implementations are future work
explicitly listed in the canonical plan, not claimed completed by these two
review rounds. Most historical transform/type/bounds probes still need promotion
to the selected permanent EX fixtures; broader lifecycle/composition cases remain
open. No core behavior, initialization policy, or public binding interface was
changed by this repair checkpoint.
