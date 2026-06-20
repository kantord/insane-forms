---
name: shadcn-drift
description: Detect and reconcile drift between the vendored shadcn (Base UI) components in packages/ui and a fresh `shadcn add`. Use when checking whether vendored `packages/ui/components/ui/*` are stale, before/after bumping shadcn, or when asked to update/upgrade the vendored components.
---

# shadcn drift detection

The shadcn (Base UI) components under `packages/ui/components/ui/` are vendored via
the CLI and kept unchanged (see the quality-gates skill). Over time upstream changes
them; this skill finds which vendored files no longer match what `shadcn add` produces
now, and emits one reconcile **task per drifted component** for you to act on.

## Run it

```bash
bash .claude/skills/shadcn-drift/detect.sh
```

It prints a summary and writes one markdown task per drifted component to
`$SHADCN_DRIFT_TASKS` (default `/tmp/shadcn-drift-tasks/`), then cats them to stdout.
Requires `esto` on PATH and hits the network (it re-vendors). Nothing in the working
tree is modified — the re-vendor happens in a throwaway git worktree.

## What to do with the tasks

1. Run `detect.sh`. If it reports no drift, you're done.
2. Otherwise read each `*.md` task. Each is a self-contained prompt. Reconcile them —
   for more than ~2, fan out **one sub-agent per task** (the task file is its prompt);
   for one or two, handle inline.
3. Each task tells the agent to: re-vendor that one component, `git diff` it, classify
   every hunk as *intentional local edit to keep* vs *genuine upstream change to accept*,
   re-apply the keepers, grep usages across `packages/examples` + `apps`, then run the
   quality gates (see the **quality-gates** skill) before declaring done.
4. The user runs `git commit` themselves — stage + suggest a message, stop.

## How it works (and why it's not a naive hash)

`esto --once` reconciles two key→value (TSV) states; the value is a normalized content
hash per component:

- `--from` (`from.sh`) = each committed `components/ui/*.tsx`, Biome-normalized then SHA-256.
- `--to` (`to.sh`) = the **re-vendor output**: a detached worktree at HEAD, `shadcn add
  --overwrite` for every component we vendor, each Biome-normalized then SHA-256.
- `--update` fires when a component's hash differs (drift); `--exit` fires when a
  component we vendor no longer installs from upstream (removed/renamed).

The workers run in esto's **simple mode** (the default): each is invoked once per item with
positional args (`worker.sh <mode> key [old] [new]`), exit 0 = ok — no long-lived stdin/stdout
protocol. `detect.sh` forwards `"$@"` to the worker (a bare path would drop the args). Preview a
run without writing tasks via `esto --dry-run …`.

The desired state must be the *re-vendor output*, NOT the registry's per-item
`content`: that payload is a template — it ships `@/registry/<style>/lib/utils` aliases
and `<IconPlaceholder lucide=… tabler=… />` placeholders that the `shadcn add` CLI
rewrites on install. Hashing it directly = false drift on every component. Both sides
are run through the same Biome so only real content differences surface.

## Known case

`components.json` has `rsc: false`, so a fresh `shadcn add` strips `"use client"`.
A committed component that still carries `"use client"` will show as drift — decide
deliberately (set `rsc: true`, or keep the directive as an intentional local edit) when
a task surfaces it, rather than blindly accepting the upstream version.

## Continuous variant

`detect.sh` uses `esto --once` (one-shot, for manual/CI checks). The same `from.sh`/
`to.sh`/`worker.sh` work as a long-running watcher by dropping `--once` and adding
`--rate-limit` / `--reingest-every` — only worth it if you want live auto-reconcile.
