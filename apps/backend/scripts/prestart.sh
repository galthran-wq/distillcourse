#!/usr/bin/env bash
set -euo pipefail

python -m app.backend_pre_start
alembic upgrade head
