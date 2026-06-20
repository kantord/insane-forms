#!/usr/bin/env bash
# esto --to: the invariant — every shown symbol should be "covered".
# (invariant-as-constant-target: --to is constant; --from measures reality.)
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
"$HERE/from.sh" | awk -F'\t' 'NF{print $1"\tcovered"}'
