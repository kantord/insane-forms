#!/usr/bin/env bash
# esto --update worker: a shown symbol flipped uncovered→covered in the invariant,
# i.e. it's a black box. Emit one classify task per symbol (reading the TSV sidecar
# enumerate.mjs wrote, so no JSON parsing here).
COVERAGE_DIR="${COVERAGE_DIR:-/tmp/code-panel-coverage}"
TASKS_DIR="${CODE_PANEL_TASKS:-$COVERAGE_DIR/tasks}"
mkdir -p "$TASKS_DIR"
sidecar="$COVERAGE_DIR/classify.tsv"

while IFS=$'\t' read -r key old new; do
  [ -z "$key" ] && continue
  row="$(awk -F'\t' -v k="$key" '$1==k{print;exit}' "$sidecar" 2>/dev/null)"
  IFS=$'\t' read -r _sym cls src exp sug <<<"$row"
  safe="$(printf '%s' "$key" | tr '/. ' '___')"
  cat >"$TASKS_DIR/$safe.md" <<TASK
# Code-panel coverage: \`$key\` is a black box

Shown in the code panel but neither linked nor exempt.
  class: ${cls:-?}   source: ${src:-?}   exported: ${exp:-n/a}
  $sug

Resolve ONE of:
- add  "$key": "<doc or Storybook story URL>"  to crossref.json  → the panel links it, or
- add  "$key"  to exempt.json  → it's an internal detail not worth documenting.

Then re-run detect.sh; this symbol drops off once covered.
TASK
  printf 'done\t%s\n' "$key"
done
