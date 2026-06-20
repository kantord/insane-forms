#!/usr/bin/env bash
# --to: the invariant (constant) — every key should reach "__DESIRED__".
# invariant-as-constant-target: --to is constant; --from measures reality, the delta = violators.
# This file is READY; you only implement from.sh.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
"$HERE/from.sh" | awk -F'\t' 'NF{print $1"\t__DESIRED__"}'
