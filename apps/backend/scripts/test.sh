#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
# conftest refuses any database whose name does not end in _test: the migration
# fixture downgrades to base on teardown, which drops every table it owns. The
# suffix is derived, not defaulted, so a POSTGRES_DB inherited from a shell
# pointed at the real database becomes its _test twin instead of aborting.
POSTGRES_DB="${POSTGRES_DB:-distillcourse}"
export POSTGRES_DB="${POSTGRES_DB%_test}_test"
uv run coverage run -m pytest "$@"
uv run coverage report
