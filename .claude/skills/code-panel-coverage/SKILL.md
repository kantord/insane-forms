---
name: code-panel-coverage
description: Detect "black boxes" in the Storybook code panel — symbols shown in displayed code that are neither linked to docs nor exempt. Use to enforce the "no black boxes" direction, when adding field bindings/widgets, or to drive the "cross-refs to our own pages" work.
---

# Code-panel coverage ("no black boxes")

The code panel (`apps/storybook/.storybook/code-panel.plugin.ts`) auto-links every shadcn
primitive shown in displayed code to its Base UI docs, derived from the vendored registry.
The "no black boxes" direction wants *every* meaningful symbol shown to be linked/hover-doc'd
— including our own bindings (→ their Storybook pages) and core symbols. This skill finds the
gaps and turns each into a task.

## Run it

```bash
bash .claude/skills/code-panel-coverage/detect.sh
```

Prints a summary and writes one task per black box to `$CODE_PANEL_TASKS`
(default `/tmp/code-panel-coverage/tasks/`), then cats them. Requires `esto` on PATH.
No network, nothing in the repo is modified (it only reads `fields.tsx` + the registry).

## What to do with the tasks

Each task names a shown symbol, its auto-classification (`class`/`source`/`exported`), and
asks you to resolve **one** of:
- **`crossref.json`** — `"Symbol": "<doc or Storybook story URL>"` → it should be linked.
- **`exempt.json`** — `"Symbol"` → it's an internal detail not worth documenting.

Re-run `detect.sh` after edits; resolved symbols drop off (the list converges to empty).
For more than a couple, fan out one sub-agent per task — but most cluster into bulk decisions
(e.g. "exempt all internal helpers", "cross-ref every exported `*Field` to its widget story").

## How it works

`esto --once` with the **invariant-as-constant-target** idiom:
- `--from` (`enumerate.mjs`) measures reality: parses `fields.tsx` with the TypeScript
  compiler API, collects every PascalCase identifier + `insane.*` call shown, and classifies
  each by import source / declaration:
  - `shadcn` (`@/components/ui/*`) → covered iff the file is in the registry (auto-linked)
  - `external` (react/lucide/zod) / `builtin` (JS/TS globals) → auto-exempt
  - `core` (`insane-forms`) / `local` (defined in `fields.tsx`) → **uncovered** unless in crossref/exempt
- `--to` (`to.sh`) is the constant invariant: every shown symbol → `covered`.
- `--update` fires for each `uncovered → covered` mismatch = a black box → one task.

We use the `typescript` compiler (already a dep) rather than adding `ts-morph`, to respect the
supply-chain policy (see quality-gates skill). `ts-morph` is a clean swap-in if deeper symbol
resolution is ever needed.

## Config

- `crossref.json` — `{ "Symbol": "url" }`, symbols that should link and where.
- `exempt.json` — `[ "Symbol", … ]`, symbols deliberately not documented (internal helpers).

## Scope & follow-up

- v1 enumerates symbols in `fields.tsx` (the binding/shell/widget definitions the panel shows
  for the widget & shell stories). Extending the enumerator to story render bodies is a follow-up.
- The reconcile produces the **coverage decisions**. Making `crossref.json` actually *render*
  links for our own symbols requires a small `code-panel.plugin.ts` change (read `crossref.json`,
  add `code-note` decorations the same way registry imports are linked today). That plugin wiring
  is the natural next PR — this skill gives it the exact, converging list of what to wire.
- This is the basis for the long-open "completeness test": a non-empty result = fail, gating the
  "no black boxes" invariant in CI.
