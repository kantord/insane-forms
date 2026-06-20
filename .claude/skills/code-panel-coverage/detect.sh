#!/usr/bin/env bash
# Detect code-panel "black boxes": symbols shown in the panel that are neither
# linked (shadcn registry / crossref.json) nor exempt (exempt.json). Reconciles
# measured coverage (--from) against the invariant "everything is covered" (--to)
# via `esto --once`, emitting one classify task per black box.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
export COVERAGE_DIR="${COVERAGE_DIR:-/tmp/code-panel-coverage}"
export CODE_PANEL_TASKS="$COVERAGE_DIR/tasks"

command -v esto >/dev/null 2>&1 || {
  echo "esto not on PATH. Install it (e.g. cargo install --path <optative-esto>)." >&2
  exit 127
}

rm -rf "$CODE_PANEL_TASKS"; mkdir -p "$CODE_PANEL_TASKS"
esto --once --from "$HERE/from.sh" --to "$HERE/to.sh" --update "$HERE/worker.sh"

shopt -s nullglob
tasks=("$CODE_PANEL_TASKS"/*.md)
echo >&2
if [ ${#tasks[@]} -eq 0 ]; then
  echo "✓ No black boxes — every shown symbol is linked or exempt." >&2
  exit 0
fi
echo "⚠ ${#tasks[@]} black box(es) in $CODE_PANEL_TASKS:" >&2
for t in "${tasks[@]}"; do echo "  - $t" >&2; done
echo >&2
for t in "${tasks[@]}"; do echo "===== $t ====="; cat "$t"; echo; done
