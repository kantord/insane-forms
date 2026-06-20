#!/usr/bin/env bash
# __NAME__ — detect drift via `esto --once`, emit one task per delta item.
# Non-destructive unless from.sh/to.sh mutate the tree (avoid that — use a worktree).
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
export RECONCILE_DIR="${RECONCILE_DIR:-/tmp/__NAME__}"
export RECONCILE_TASKS="$RECONCILE_DIR/tasks"

command -v esto >/dev/null 2>&1 || {
  echo "esto not on PATH. Install it (cargo install --path <optative-esto>)." >&2
  exit 127
}

rm -rf "$RECONCILE_TASKS"; mkdir -p "$RECONCILE_TASKS"
# esto simple mode (default): worker invoked once per item with positional args.
# esto runs `sh -c "$cmd" _ key old new`, so forward "$@" to the script — a bare
# path would drop the args. (Use `esto --dry-run …` to preview the diff first.)
esto --once \
  --from "$HERE/from.sh" \
  --to   "$HERE/to.sh" \
  --update "$HERE/worker.sh update \"\$@\"" \
  --exit   "$HERE/worker.sh exit \"\$@\""

shopt -s nullglob
tasks=("$RECONCILE_TASKS"/*.md)
echo >&2
if [ ${#tasks[@]} -eq 0 ]; then
  echo "✓ converged — no tasks." >&2
  exit 0
fi
echo "⚠ ${#tasks[@]} task(s) in $RECONCILE_TASKS:" >&2
for t in "${tasks[@]}"; do echo "  - $t" >&2; done
echo >&2
for t in "${tasks[@]}"; do echo "===== $t ====="; cat "$t"; echo; done
