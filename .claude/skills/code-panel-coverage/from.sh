#!/usr/bin/env bash
# esto --from: current coverage state — each symbol shown in the code panel and
# whether it is "covered" (linked/exempt) or "uncovered" (a black box).
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE" && git rev-parse --show-toplevel)"
export REPO COVERAGE_DIR="${COVERAGE_DIR:-/tmp/code-panel-coverage}"
cd "$REPO" || exit 1
node "$HERE/enumerate.mjs"
