#!/usr/bin/env bash
# Detect shadcn drift: reconcile committed vendored components (--from) against a
# fresh re-vendor (--to) via `esto --once`, emitting one task per drifted/removed
# component. Non-destructive (re-vendors in a throwaway worktree). Needs network.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
export SHADCN_DRIFT_TASKS="${SHADCN_DRIFT_TASKS:-/tmp/shadcn-drift-tasks}"

command -v esto >/dev/null 2>&1 || {
  echo "esto not on PATH. Install it (e.g. cargo install --path <optative-esto>)." >&2
  exit 127
}

rm -rf "$SHADCN_DRIFT_TASKS"; mkdir -p "$SHADCN_DRIFT_TASKS"
echo "Detecting shadcn drift — re-vendoring in a throwaway worktree (hits the network)…" >&2

esto --once \
  --from "$HERE/from.sh" \
  --to   "$HERE/to.sh" \
  --update "$HERE/worker.sh update" \
  --exit   "$HERE/worker.sh exit"

shopt -s nullglob
tasks=("$SHADCN_DRIFT_TASKS"/*.md)
echo >&2
if [ ${#tasks[@]} -eq 0 ]; then
  echo "✓ No drift — every vendored component matches a fresh shadcn add." >&2
  exit 0
fi

echo "⚠ ${#tasks[@]} drift task(s) in $SHADCN_DRIFT_TASKS:" >&2
for t in "${tasks[@]}"; do echo "  - $t" >&2; done
echo >&2
# Also stream the tasks to stdout so an invoking agent sees them directly.
for t in "${tasks[@]}"; do echo "===== $t ====="; cat "$t"; echo; done
