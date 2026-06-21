#!/usr/bin/env bash
# Reconcile showcased widgets (--to: widget→binding-hash) against verified realistic
# examples (--from: persisted state.tsv) via `esto --once`. Full lifecycle:
#   enter  = widget with no realistic example      → prompt: add one
#   update = binding changed since example verified → prompt: review for staleness
#   exit   = recorded example for a gone widget     → prompt: remove/migrate orphan
# Each worker is a prompt-emitter; resolve a task then run stamp.sh to converge.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
export WIDGET_EXAMPLE_TASKS="${WIDGET_EXAMPLE_TASKS:-/tmp/widget-example-tasks}"

command -v esto >/dev/null 2>&1 || {
  echo "esto not on PATH. Install it (cargo install --path <optative-esto>)." >&2
  exit 127
}

rm -rf "$WIDGET_EXAMPLE_TASKS"; mkdir -p "$WIDGET_EXAMPLE_TASKS"
# Simple mode: forward "$@" so the worker gets (event, key, old, new) positionally.
esto --once \
  --from "$HERE/from.sh" \
  --to   "$HERE/to.sh" \
  --enter  "$HERE/worker.sh enter \"\$@\"" \
  --update "$HERE/worker.sh update \"\$@\"" \
  --exit   "$HERE/worker.sh exit \"\$@\""

shopt -s nullglob
tasks=("$WIDGET_EXAMPLE_TASKS"/*.md)
echo >&2
if [ ${#tasks[@]} -eq 0 ]; then
  echo "✓ every showcased widget has a current realistic example." >&2
  exit 0
fi
echo "⚠ ${#tasks[@]} task(s) in $WIDGET_EXAMPLE_TASKS:" >&2
for t in "${tasks[@]}"; do echo "  - $t" >&2; done
echo >&2
for t in "${tasks[@]}"; do echo "===== $t ====="; cat "$t"; echo; done
