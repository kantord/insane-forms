#!/usr/bin/env bash
# Bookkeeping that converges the loop (the one NON-prompt step). Run AFTER resolving a task:
#   stamp.sh <widget>            — record the widget's CURRENT binding hash (enter/update done)
#   stamp.sh --remove <widget>   — drop the widget's record (exit done / orphan cleaned)
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
STATE="$HERE/state.tsv"
touch "$STATE"

if [ "${1:-}" = "--remove" ]; then
  widget="${2:?usage: stamp.sh --remove <widget>}"
  grep -v -P "^${widget}\t" "$STATE" > "$STATE.tmp" && mv "$STATE.tmp" "$STATE"
  echo "removed $widget from state"
  exit 0
fi

widget="${1:?usage: stamp.sh <widget> | stamp.sh --remove <widget>}"
hash="$(node "$HERE/widgets.mjs" --desired | awk -F'\t' -v w="$widget" '$1==w{print $2}')"
[ -z "$hash" ] && { echo "stamp: '$widget' is not a current widget (nothing to stamp)" >&2; exit 1; }
grep -v -P "^${widget}\t" "$STATE" > "$STATE.tmp" 2>/dev/null || true
printf '%s\t%s\n' "$widget" "$hash" >> "$STATE.tmp"
sort "$STATE.tmp" -o "$STATE.tmp" && mv "$STATE.tmp" "$STATE"
echo "stamped $widget @ $hash"
