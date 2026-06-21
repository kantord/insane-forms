#!/usr/bin/env bash
# esto SIMPLE-mode prompt-emitter for all three events. Args ($1 = event, set by detect.sh):
#   enter:  $1=enter   $2=widget  $3=hash
#   update: $1=update  $2=widget  $3=old_hash  $4=new_hash
#   exit:   $1=exit    $2=widget  $3=value(old hash)
# Writes one task per widget. Resolving a task ends with `stamp.sh <widget>`
# (enter/update) or `stamp.sh --remove <widget>` (exit) to converge the loop.
set -u
event="$1"
widget="$2"
TASKS_DIR="${WIDGET_EXAMPLE_TASKS:-/tmp/widget-example-tasks}"
mkdir -p "$TASKS_DIR"
[ -z "$widget" ] && exit 0

case "$event" in
  enter)
    cat >"$TASKS_DIR/$widget.md" <<TASK
# widget example: \`$widget\` has no realistic example

\`$widget\` is showcased in isolation but never used in a realistic example
(Forms / Collections / Table / Multistep / a demo app). Binding hash: ${3:-}

Add a realistic example that exercises it. NOTE: the missing widgets are mostly
settings/config controls (radio, switch, slider, toggle, native-select) — prefer
ONE coherent "Settings/Preferences" example over shoehorning each into a checkout
form. Then run: \`.claude/skills/widget-example-coverage/stamp.sh $widget\`
TASK
    ;;
  update)
    cat >"$TASKS_DIR/$widget.md" <<TASK
# widget example: \`$widget\` binding changed — example may be stale

\`$widget\`'s binding definition in fields.tsx changed since its example was verified.
  old hash: ${3:-}
  new hash: ${4:-}

Review the realistic example that uses \`$widget\`: does it still demonstrate the
binding correctly (new/changed props, schema, options)? Update it if needed, then:
\`.claude/skills/widget-example-coverage/stamp.sh $widget\`
TASK
    ;;
  exit)
    cat >"$TASKS_DIR/$widget.md" <<TASK
# widget example: \`$widget\` is gone — orphaned example

The state file records a realistic example for \`$widget\`, but it is no longer a
showcased widget binding (removed or renamed). Its example now references a dead
binding. Remove or migrate that example, then drop the record:
\`.claude/skills/widget-example-coverage/stamp.sh --remove $widget\`
TASK
    ;;
esac
