# esto → an agentic-codebase reconcile substrate: direction, reasons, minimal test

This repo (insane-forms) has been the proving ground for a new direction for **esto** (the reconcile
CLI in the `optative` repo). This doc records the direction, *why* we took it, and the **minimal
implementation + a concrete example to validate it here.** The full design lives in the optative
repo under `docs/ideas/agentic-codebase-substrate.md` and `docs/ideas/authoring-model.md`; this is
the consumer-side handoff.

## The direction (one line)

> Treat a codebase as a continuously-reconciled control plane: declare the non-type invariants it
> must hold, detect violations deterministically, and heal each one mechanically **or by an agent**
> — so changing a spec propagates like changing a type.

esto becomes the generic engine for that; tauler and this repo are two *embeddings* of it.

## Why (what the experiments here taught us)

1. **In a static repo, esto kept collapsing to a plain check.** We built `shadcn-drift`,
   `code-panel-coverage`, `widget-example-coverage`, and the `check:docs`/`check:api-tests` gates.
   The valuable ones were valuable as *plain checks*; esto's orchestration rarely earned its place,
   because insane-forms doesn't *drift on its own*.
2. **But its *context* drifts** — bug reports, dependency bumps, others' commits, upstream releases.
   An agent stewarding a codebase against those is a genuine reactive, continuous, self-healing
   domain. That's where esto belongs.
3. **The genuinely novel, unbuilt thing** (deep-research verdict: integration novelty; lineage =
   MAPE-K, Rainbow, fitness functions, GitOps) is the *union*: declarative non-type invariants +
   deterministic detection + **agentic remediation** + a reconcile/convergence loop +
   coordinate-through-shared-state. No shipping system has it.
4. **The config should be reactive, not a flat YAML list.** tauler already solved "desired state as
   a reactive, composable program" (JSX over streams). So esto's config = **tauler with an
   assertion backend**: same reactive component runtime, leaf node = `<assert>` not `<panel>`, sink
   = reconcile not draw. Reuse it; don't reinvent a worse, flatter thing.

## Load-bearing architecture decisions

- **esto is a *reducer*, not a loop.** The program reduces `(layout, inputs) → a supervisor tree`
  *when ticked*; the **embedder owns the tick**. esto = the *raw embedding* (ticks once / on a timer
  / on an event); tauler = a *domain embedding* (its display loop ticks the same reducer). This
  dissolves the "where do loops live" question.
- **Minimal core, integration-centric.** Only a few built-ins: the reducer/engine, the item/stream
  model, the reconcile combinator, and `defineTarget`. Everything else (`<assert>`, `<Each>`,
  `<Match>`, components, decorators, `useJSONStream`) is **userland partial-application, kept as
  optional stdlib sugar — not plugins.** Sources are *integrations* (sh/jq/ast-grep/semgrep/scripts),
  not features.
- **One effect primitive: shell-out** (simple per-item + stateful long-lived worker). Live resources
  live in external workers; the engine holds only opaque `key→value` data. A **Rust-native target
  (= optative `Lifecycle`) is an optional *perf* escape hatch** for hot paths (tauler's renderer);
  the codebase substrate needs **zero** native targets.
- **Two enumerations, the diff sits between them:**
  - **Desired** = the program (the reduced tree of `{key, value}`).
  - **Current** = supplied by the node type, two regimes: **observe the world** (the artifacts *are*
    the state — read them back; e.g. `from.sh` hashing committed files) or **persisted state** (when
    "satisfied" can't be read back). *(`observe()` is esto-today's `--from`.)*
  - `exit` (orphan removal) is *why* current must be enumerable independently of desired.
- **Composition = a recursive supervision tree.** A node is both an *item* (to its parent) and a
  *supervisor* (of its children). **Supervision is automatic — a node is a supervisor iff it has
  children.** A node has two orthogonal aspects: a self-assertion (`holds`) and a child-scope; read
  nesting as "children hold *given* the parent holds." **Nesting = dependency = ordering** ("B
  requires A" → B is a child of A). Down: context; up: `Outcome`; sideways: only the shared world
  (never pipe a delta).
- **Detection deterministic, reaction pluggable** (the spine — Infer's 0→70% diff-time lesson;
  SapFix's test-gate). Plan = the deterministic diff; apply = run reactions. Caveat: "check passes ≠
  fix correct" (overfitting) — verify the post-condition.
- **Cost = per-node-type concurrency**, not "don't do expensive things": diff phase cheap/batched;
  action phase bounded by per-type max-concurrent; over-budget items defer to the next tick.

## The minimal implementation to test (tiered)

### Tier 0 — runs on esto **today** (no esto change). Build this here, now.
The whole reconcile *core* (diff + shell-out + enter/update/exit + observe-the-world) already exists
in current esto. The validating example is the **api-docs** invariant: one generated stub per public
core export, with **full lifecycle** and **observe-the-world current** (no persisted state).

Three scripts in this repo:

```bash
# esto/gen-stub.sh — enter/update reaction (create/regenerate one stub; embeds its own sig)
name=$1; sig=$2; mkdir -p docs/api
printf '<!-- esto:sig=%s -->\n# `%s`\n\n_API reference for `%s`._\n' "$sig" "$name" "$name" > "docs/api/$name.md"
```
```bash
# esto/observe-stubs.sh — CURRENT (observe the world): key<TAB>value from the files on disk
for f in docs/api/*.md; do [ -e "$f" ] || continue
  name=$(basename "$f" .md)
  sig=$(sed -n 's/.*esto:sig=\([a-f0-9]*\).*/\1/p' "$f" | head -1)
  printf '%s\t%s\n' "$name" "$sig"; done
```
```bash
# esto/desired-exports.sh — DESIRED: every public core export + its signature hash
node packages/core/scripts/list-exports.mjs --json | jq -r '.[] | "\(.name)\t\(.sig)"'
```
*(`list-exports.mjs` ≈ a ~15-line TS-compiler script, sibling of `check-docs.mjs`, emitting
`[{name, file, sig}]`.)*

Run:
```bash
esto --once \
  --from  './esto/observe-stubs.sh' \      # current = observe the world
  --to    './esto/desired-exports.sh' \    # desired = the program
  --enter  './esto/gen-stub.sh "$@"' \
  --update './esto/gen-stub.sh "$@"' \
  --exit   'rm -f "docs/api/$1.md"'
```
This exercises enter (new export), update (sig changed), exit (deleted export → orphan removed) —
the lifecycle we've never run end-to-end — and proves the core + the observe-the-world model.

### Tier 1 — the first *new* esto capability (smallest step toward the direction)
**`esto run program.mjs`** — the source of truth becomes **one JS module**, not five flags + five
shell scripts. No JSX, no reactivity, no supervision tree yet — just `defineTarget`.

**Target interface (exact):**
```
defineTarget({
  key:     (item) => string,       // identity for the diff
  value:   (item) => string,       // fingerprint; differing value ⇒ update
  desired: () => item[],           // the DESIRED set (the program / today's --to)
  observe: () => item[],           // the CURRENT set, read from reality (today's --from)
  enter:   (item) => void,         // in desired, not current  → create
  update:  (item, prev) => void,   // in both, value differs    → fix (prev = observed item)
  exit:    (item) => void,         // in current, not desired   → remove (item = observed orphan)
})
```
**Algorithm:** run `desired()` + `observe()`; index both by `key`; `enter` = desired-only,
`update` = both-but-`value`-differs, `exit` = current-only; call the matching reaction (skip on
`--dry-run`); print `reconciled: N enter, N update, N exit (N unchanged)`.

**`sh` contract:** `sh\`cmd ${x}\`` runs via `sh -c`, shell-quoting each `${…}`, returns stdout
string, throws on nonzero (`… || true` to tolerate). Use Node `fs`/`crypto` for *parsing* (robust),
`sh` for *effects* and external tools.

The api-docs version of this — desired = exports+sig, observe = read each generated stub's embedded
`sig=` line **with Node fs (not `sed`)**, reactions = generate/remove the stub. The **engine's own
acceptance test** is a self-contained `mirror.mjs` (one file per `name=content` manifest line; full
enter/update/exit; observe-the-world current) — its exact code + expected output is in the handoff
prompt for the esto agent. A program exporting an *array* of targets = a flat multi-invariant
reconcile (no nesting yet).

### Tier 2+ (later, see optative docs)
The reactive JSX frontend (`useJSONStream`, components, `.map`, decorators), `plan`/`apply`/`watch`
verbs, the recursive supervision tree (nesting/dependency), per-type concurrency, event wakeup.

## Stress-test candidates (different shapes, to avoid over-fitting on coverage)

Both built consumers (`api.op.tsx`, `doc-coverage.op.tsx`) are the same shape: typedoc symbol-scope →
one kind → presence/sig. These deliberately exercise *different* axes:

1. **shadcn-drift in the DSL** — the *drift* shape (update-on-value-change). Reuse the existing skill's
   re-vendor (`.claude/skills/shadcn-drift/{from,to}.sh`): `observe` = committed component hashes,
   `desired` = re-vendor hashes, `update` = drifted, `exit` = removed upstream. Network/slow.
2. **no-any (ast-grep)** — the *filter + exit + empty-side* shape. `observe` = `as any` sites
   (`ast-grep '$X as any'`), `desired` = an allowlist of justified ones → non-allowlisted sites `exit`
   ("fix or justify"). Exercises ast-grep-as-a-scope and exit-as-the-point. ~10 real sites here.
3. **Test/Gherkin matcher** ⭐ (flagship agentic demo) — a 4th enumerator backend: **assert → test
   runner** (arbitrary runtime predicate, the thing ast-grep/typedoc can't express).
   - Each parametric case (`test.each`, or a Gherkin `Scenario`/`Examples` row) is an item; scope cmd =
     `vitest run --reporter=json | jq` / `cucumber-js --format json | jq`. `observe` = passing cases,
     `desired` = all cases → **failing cases are the diff** (`enter`/fix). Fingerprint = case input.
   - **Gherkin beats raw test.each:** the spec is already natural language, so a failing scenario *is*
     the agent prompt verbatim; it's the literal "spec ↔ code" reconciler (edit `.feature` = edit
     desired state in prose). Two-tier reaction from cucumber JSON: `undefined` step → agent scaffolds
     the step def; `failed` → agent repairs the impl.
   - **Layering (the prize):** the test can be *generated from* the Gherkin (generic — true for any
     test). That makes it a CHAIN composing through the world:
     `.feature ──R1:generate──▶ generated tests ──R2:satisfy──▶ implementation`.
     R1 = the api-docs-stub idiom (`desired = transform(spec)`, observe-the-world the generated files,
     reconcile-owned, do-not-edit, stable scenario-id keys). R2 = the assert matcher. First genuine
     **multi-stage pipeline** consumer → stress-tests *composition* (the axis never run). A spec edit
     then propagates *two hops* — the strongest form of "a spec change propagates like a type change."

## Acceptance tests that keep us honest

- **Tier 0:** the api-docs reconcile produces correct enter/update/exit on real exports here.
- **Tier 1:** the same example, re-expressed as one `program.mjs`, behaves identically.
- **The big one (eventual):** *tauler's current config runs unchanged on the extracted runtime*,
  with exactly **one** native target (its renderer). If it needs more, the boundary leaked.

## Pointers
- Full vision + authoring model: optative `docs/ideas/agentic-codebase-substrate.md`,
  `docs/ideas/authoring-model.md`, and `COOKBOOK.md`.
- Working precedents in this repo: `.claude/skills/{shadcn-drift,code-panel-coverage,widget-example-coverage}`
  (the prompt-emitter pattern, `observe`-as-`from.sh`, persisted-state-enables-exit).
