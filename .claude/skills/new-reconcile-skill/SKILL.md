---
name: new-reconcile-skill
description: Scaffold a new esto-based reconcile skill (a drift / coverage / migration detector). Use when you want to detect-and-react to a gap between a current set and a desired set that can both be enumerated programmatically.
---

# new-reconcile-skill (meta-skill)

Generates a new reconcile skill under `.claude/skills/<name>/` from two reference shapes:
- **fingerprint** — compare current vs a regenerated desired; value = content hash
  (reference: `shadcn-drift`).
- **invariant** — enforce a predicate; `--to` is a constant, value = predicate status
  (reference: `code-panel-coverage`).

Background: the reconcile-pattern memory and the esto `COOKBOOK.md`.

## 0. First: does this even need esto? (don't reach for it by default)
esto earns its keep only when **both sides genuinely vary** and the **enter/exit/update lifecycle
maps to real reactions** (e.g. `shadcn-drift`: upstream changes → re-vendor; component removed → flag).

If the **desired state is a constant** — an invariant like "every X must be covered / have a header /
match a pattern" — the diff degenerates to "filter the violators." Then:
- **Reaction is simple** (fail CI, or one mechanical fix) → **write a plain build-time check**, not esto.
  A single script that enumerates, filters, exits non-zero, wired into `ci`. Fewer moving parts. The
  `code-panel-coverage` skill is exactly this — it was rebuilt from esto into one `*.mjs` check.
- **Reaction is heavy** (an AI agent per violator, across many items, where you want task files +
  loop-until-dry + worker pooling) → the esto **invariant** shape still pays off as orchestration.

Reach for full esto (both sides vary) when enter/exit/update map to distinct real reactions.
When unsure, prefer the plain check — it's the cheaper default.

## 1. Confirm the 3 ingredients with the user (don't scaffold if any fails)
1. **Enumerable** — both "current" and "desired" can be listed as `key<TAB>value`.
2. **Fingerprintable** — the value captures *"has this changed"* (hash | predicate | version).
3. **Reactable** — a delta item is fixable mechanically OR via a per-item prompt.

Then decide:
- **Shape**: `fingerprint` (re-generate & compare) or `invariant` (enforce a predicate).
- **Reaction**: mechanical worker, or prompt → agent fan-out (use agents when the fix needs judgment).
- **Enumerator** (one tool, don't mix): the **TypeScript compiler** for code-aware checks
  (see `code-panel-coverage/enumerate.mjs`); **shell** (`sha256sum`/`grep`) for fingerprints and
  simple textual predicates. Reach for ast-grep only for multi-language match-only checks.

## 2. Scaffold
```bash
node .claude/skills/new-reconcile-skill/scaffold.mjs \
  --name=<kebab-slug> --shape=fingerprint|invariant \
  --desc="..." [--desired=ok]      # --desired = target status string for the invariant shape
```
Writes `detect.sh` (ready), `worker.sh` (edit the task body), `from.sh`/`to.sh` (stubs —
for the invariant shape `to.sh` is already complete). Refuses to overwrite (use `--force`).

## 3. Implement & verify
1. Implement `from.sh` (and `to.sh` for the fingerprint shape) — copy the matching reference
   skill (`shadcn-drift` or `code-panel-coverage`). Keep `--to` non-destructive (worktree, not
   in-place) if it regenerates.
2. Edit `worker.sh`'s task body (or make it apply the fix and ack, for a mechanical reconcile).
3. Dry-run `bash .claude/skills/<name>/detect.sh` and iterate until the task set is right. Tip:
   keep a log+ack worker as a pure planner while iterating (plan/apply separation).
4. **Verify convergence**: fix/exempt a couple of items, re-run, confirm they drop off.
5. Fill in the generated `SKILL.md` (it ships with TODOs).

## Design against these caveats
- **Unstable keys** — a rename reads as exit+enter, not update (history lost).
- **Ordering** — it's a *set* reconcile with parallel fan-out; sequenced work (ordered migrations)
  doesn't fit.
- **Idempotent workers** — loop-until-dry assumes re-running is safe.
- **Expensive `--to`** — if regeneration hits the network, keep it `--once` (a periodic check), not a loop.
