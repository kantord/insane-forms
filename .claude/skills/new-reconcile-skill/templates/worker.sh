#!/usr/bin/env bash
# __NAME__ worker. $1 = mode: "update" (key<TAB>old<TAB>new) | "exit" (key<TAB>value).
# Emits one markdown task per delta item, then acks. EDIT the task bodies for your job.
# (For a mechanical reconcile, replace the cat/heredoc with the actual fix and still ack.)
mode="${1:-update}"
TASKS_DIR="${RECONCILE_TASKS:-/tmp/__NAME__/tasks}"
mkdir -p "$TASKS_DIR"

while IFS=$'\t' read -r key a b; do
  [ -z "$key" ] && continue
  safe="$(printf '%s' "$key" | tr '/. ' '___')"
  if [ "$mode" = "exit" ]; then
    cat >"$TASKS_DIR/$safe.md" <<TASK
# __NAME__: \`$key\` removed
value: $a
TODO: describe the reaction for a removed item.
TASK
  else
    cat >"$TASKS_DIR/$safe.md" <<TASK
# __NAME__: \`$key\` changed
old: $a
new: $b
TODO: describe the reaction for a changed item.
TASK
  fi
  printf 'done\t%s\n' "$key"
done
