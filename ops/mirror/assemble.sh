#!/usr/bin/env bash
# Assembles the tree CI force-pushes to github.com/galthran-wq/distillcourse-labs:
# labs/ (the public half `npm run build-labs` wrote to labs-dist/public/),
# client/ (apps/lab-client verbatim), and the mirror's README — then refuses
# the tree if a solution marker is anywhere in it. build_lab.py already strips
# solutions and splits public from private; this guard is for the day it does
# not.
set -euo pipefail

cd "$(dirname "$0")/../.."

OUT=${1:?usage: assemble.sh <output-dir>}
mkdir -p "$OUT"
if [ -n "$(ls -A "$OUT")" ]; then
	echo "assemble: $OUT is not empty" >&2
	exit 1
fi

# No labs-dist/public yet just means no lab lesson is drafted: the mirror is
# still worth publishing for client/.
if [ -d labs-dist/public ]; then
	cp -R labs-dist/public "$OUT/labs"
fi
cp -R apps/lab-client "$OUT/client"
# Local runs carry build junk a clean CI checkout does not.
rm -rf "$OUT/client/.venv" "$OUT/client/.pytest_cache" "$OUT/client/.mypy_cache" "$OUT/client/.ruff_cache"
find "$OUT/client" -type d -name __pycache__ -exec rm -rf {} +
cp ops/mirror/README.md "$OUT/README.md"

# Only grep's clean no-match (exit 1) may publish: a match — or a tree it
# could not scan — must not.
status=0
grep -rn "BEGIN SOLUTION" "$OUT" || status=$?
if [ "$status" -ne 1 ]; then
	echo "assemble: solution marker in the mirror tree (or grep failed) — refusing to publish" >&2
	exit 1
fi
