#!/usr/bin/env bash
# __NAME__ esto SIMPLE-mode worker (one invocation per item; exit 0 = ok, nonzero = error).
# Args (esto runs it as `worker.sh <mode> key [old] [new]` via the "$@" in detect.sh):
#   update:  $1="update"  $2=key  $3=old_value  $4=new_value
#   exit:    $1="exit"    $2=key  $3=value
# Emits one markdown task per delta item. EDIT the bodies for your job.
# (For a MECHANICAL reconcile, replace the heredoc with the actual fix and just exit 0.)
set -u
mode="$1"
key="$2"
TASKS_DIR="${RECONCILE_TASKS:-/tmp/__NAME__/tasks}"
mkdir -p "$TASKS_DIR"
[ -z "$key" ] && exit 0

if [ "$mode" = "exit" ]; then
  value="${3:-}"
  cat >"$TASKS_DIR/$key.md" <<TASK
# __NAME__: \`$key\` removed
value: $value
TODO: describe the reaction for a removed item.
TASK
else
  old="${3:-}"
  new="${4:-}"
  cat >"$TASKS_DIR/$key.md" <<TASK
# __NAME__: \`$key\` changed
old: $old
new: $new
TODO: describe the reaction for a changed item.
TASK
fi
