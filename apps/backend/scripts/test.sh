#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
# conftest refuses any database whose name does not end in _test: the migration
# fixture downgrades to base on teardown, which drops every table it owns.
export POSTGRES_DB="${POSTGRES_DB:-distillcourse_test}"
uv run coverage run -m pytest "$@"
uv run coverage report
