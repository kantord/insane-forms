# Backlog: a measured Zod compatibility corpus

Captured 2026-10-25 from the schema compatibility and testing discussion.

## COMPAT-01 — Account for schema cases across built-in functionality

Build a shared fixture corpus and testing harness that records whether each
relevant schema/feature case was measured, what behavior was observed, and what
behavior was asserted. The user wants machine-readable evidence in test code
or metadata, not necessarily a documentation page for every minute detail.

This is a backlog item, not an implementation or a claim that all schema
combinations can be finitely enumerated. Feature-specific support decisions
remain explicit rather than being silently chosen by the fixture runner.

## Direction discussed

- Stable named fixtures construct real schemas through public Zod interfaces.
- Account for schema families, checks, wrappers, composition, construction order,
  and meaningful input values. Make the supported taxonomy and limits visible.
- Use Zod's exported family/check unions where useful to detect missing categories
  after upgrades. This does not detect every behavioral nuance within a category.
- Supplement named fixtures with generated combinations, potentially using
  fast-check. Retain minimized counterexamples as named regressions.
- For relevant built-in operations, define supported results, deliberately
  unsupported responses, justified non-applicability, and unresolved cases.
  Unexamined cells must not silently count as demonstrated compatibility.
- Generate an evidence report from executed checks. Include fixture ID, feature,
  dependency version, expected result or assertion, observed result, and outcome.
- Normalize non-JSON values deliberately: undefined, Infinity, NaN, errors,
  functions, symbols, dates, recursive references, and async outcomes where relevant.
  Do not let JSON serialization silently erase or change their meaning.
- Keep observed characterization separate from the intended contract. A snapshot
  can document a known defect without declaring that behavior correct.
- Prefer independent behavioral oracles where available. Snapshot useful stable
  results elsewhere, avoiding volatile implementation internals.

An illustrative report entry, not a proposed mandatory file format:

```json
{
  "case": "array.length.fixed",
  "feature": "bounds",
  "zodVersion": "4.4.3",
  "expected": { "min": 2, "max": 2 },
  "observed": { "min": 0, "max": "Infinity" },
  "assertion": "failed"
}
```

## Investigation and implementation slices

1. Inventory existing built-in functions and related tests. The current API
   coverage script only checks that runtime exports are referenced in tests;
   it is not evidence of schema-case compatibility.
2. Establish fixture identities, taxonomy, factories, applicability rules, and
   source/version provenance. Start with array bounds, where failures and a
   parser oracle are already demonstrated.
3. Add deterministic named regressions and parser-based differential assertions.
   For length-only arrays with always-valid elements, compare extracted interval
   membership with actual parse success. Do not apply that equivalence to
   arbitrary element constraints, refinements, or transforms.
4. Investigate fast-check for longer check sequences, boundary values, wrappers,
   and composition. Preserve seeds/replay information for failures. Generation
   explores the declared vocabulary; it cannot discover every omitted category.
5. Produce the machine-readable evidence artifact and a coverage summary from
   the same execution. Choose the exact JSON layout and fixture organization
   during implementation; they need not be product-design decisions.
6. Apply the corpus to introspection, metadata, defaults, bindings, rendering,
   and submission as relevant. Keep compile-time assertions for typing guarantees
   separate from runtime snapshots.
7. Exercise actual integrations and stateful operations separately. Matching
   parser behavior in a helper does not establish that UI controls use it correctly.
8. Run against supported dependency versions and proposed updates. Distinguish
   disagreement with the installed parser from changes in public behavior on
   which the project intentionally relies.

## Behavior decisions the harness should expose, not make

- For each schema/feature combination, is correct behavior a supported result,
  a documented limitation, or an explicit unsupported response? A corpus covering
  every family does not imply every built-in feature fully supports every family.
- Where the current behavior has no established contract, what should it do?
  For example, which side of a type-changing pipe should a UI hint describe?
  Recording today's result does not answer that question.
- How should contradictions, opaque custom refinements, and unsupported schema
  forms be surfaced by each relevant feature? An interval cannot fully represent
  an arbitrary acceptance predicate such as even-length-only arrays.

These decisions can be made case by case as the corpus reveals gaps. They do
not block creating an inventory or characterization report. The initial report
should explicitly distinguish unresolved contracts and known defects from passing
support; rollout of strict CI coverage gates should not disguise those states.

## Existing grounding

- [Bounds investigation and independent oracle](research-collection-bounds.md):
  343 generated schemas and 3,087 input-length comparisons against parsing;
  both current extraction defects and a JSON Schema export discrepancy were observed.
- [Transform probe](research-transform-probe.md): rendering, inference,
  initialization, and metadata can differ by transformation construction order.
- [Initialization investigation](field-initialization-backlog.md): runtime behavior
  and compile-time guarantees need distinct assertions.
- `packages/core/tests/schema-reader.test.ts`: existing named reader expectations.
- `packages/core/tests/zod-interop.test.ts`: existing bare/enhanced schema checks.
- `packages/core/scripts/check-api-tests.mjs`: existing export-reference gate.
- [Fast-check core blocks](https://fast-check.dev/docs/core-blocks/): generators,
  properties, runners, shrinking, and failure reporting.

## Acceptance criteria

- A relevant case cannot disappear without an explicit coverage change.
- Reports identify what ran, against which dependency version, and what it asserted.
- Known defects and undecided behavior are distinguishable from supported behavior.
- The first slice detects the documented fixed/repeated-bound failures without
  reading Zod's internal check representation in its expected-value calculation.
- Replacing the implementation's extraction technique preserves useful tests.
- New failures become reproducible, preferably minimized named fixtures.
- Coverage claims state their taxonomy and generation limits rather than claiming
  proof over all arbitrary or future Zod schemas.
