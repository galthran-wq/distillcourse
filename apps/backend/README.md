# apps/backend

FastAPI service: the API, and from #10 onwards the pydantic-ai tutor harness as
a module inside this same process. Forked from
[full-stack-fastapi-template](https://github.com/fastapi/full-stack-fastapi-template)
(`backend/`, commit `750d3d0`) and then rewritten to be async end to end
(psycopg async driver, `AsyncSession`, async routes) with SQLAlchemy 2.0 typed
models instead of SQLModel.

## Layout

```
app/
  main.py            # FastAPI app: instrumentation, CORS, router mount
  api/
    main.py          # the router tree
    deps.py          # SessionDep — one AsyncSession per request
    routes/health.py # GET /api/v1/health (also the compose healthcheck)
  core/
    config.py        # pydantic-settings; env vars only, no .env reading
    db.py            # async engine + session factory
    security.py      # password hashing (argon2, bcrypt kept for verification)
    observability.py # logfire: fastapi + sqlalchemy + httpx
  models.py          # SQLAlchemy 2.0 declarative tables
  crud.py            # user reads/writes
  alembic/           # migrations; explicit, hand-reviewed, always reversible
  mail/              # SMTP sender + templates — dormant, see below
```

## Running

Everything below assumes `uv` and a reachable Postgres. `docker compose up db`
from the repo root gives one, plus the `distillcourse_test` database the suite
needs.

```bash
uv sync                       # create .venv
uv run alembic upgrade head   # apply migrations
uv run fastapi dev app/main.py
./scripts/lint.sh             # ruff + mypy strict
./scripts/test.sh             # pytest against POSTGRES_DB=distillcourse_test
```

Configuration comes from environment variables only (`app/core/config.py`); the
defaults are the local ones, and `ENVIRONMENT != local` rejects them. Compose
passes the repo-root `.env` through; to run a process on the host against that
same file use `uv run --env-file ../../.env ...`.

## Migrations

Autogenerate is a drafting aid, never the artefact: generate, then read the
diff and rewrite it explicitly. Every migration must have a working
`downgrade` — the test suite downgrades to base on teardown, so a broken
downgrade fails CI.

```bash
uv run alembic revision --autogenerate -m "<what changed>"
uv run alembic upgrade head
uv run alembic downgrade -1
```

## Dormant mail

`app/mail/` is wired to nothing. It is kept because the platform will send mail
(account and review notifications) and re-deriving the SMTP plumbing and the
MJML-built templates is pure waste; `emails` and `jinja2` stay in the
dependency set for the same reason. Nothing imports it today, and that is
deliberate rather than an oversight.
