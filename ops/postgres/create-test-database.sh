#!/usr/bin/env bash
# Runs once, on an empty data directory. The backend test suite refuses any
# database whose name does not end in _test, so give it one next to the real
# database rather than a second Postgres.
set -euo pipefail

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
	CREATE DATABASE ${POSTGRES_DB}_test;
EOSQL
