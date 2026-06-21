#!/usr/bin/env bash
# esto --to: DESIRED state = every showcased widget → a hash of its current binding
# definition. Driven from real code (widgets.mjs reads the showcase groups + fields.tsx).
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
node "$HERE/widgets.mjs" --desired
