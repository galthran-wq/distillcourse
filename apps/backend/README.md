# apps/backend

FastAPI service: the API and the pydantic-ai tutor harness, a module inside
this same process. Forked from
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
    deps.py          # SessionDep, SessionFactoryDep, CurrentSession, CurrentUser
    routes/health.py # GET /api/v1/health (also the compose healthcheck)
    routes/auth.py   # signup / login / logout / me / password
    routes/chats.py  # chat CRUD + the Vercel AI data stream
  harness/
    agent.py         # the tutor agent, the model pool, the compaction threshold
    prompts.py       # module concatenation + context blocks
    prompts/         # the prompt modules themselves (see below)
    deps.py          # HarnessDeps — what a tool receives
    repository.py    # user-scoped reads and writes over chats and messages
    usage.py         # the shape of messages.usage, written once, read by caps
    limits.py        # the daily cap and the monthly cost ceiling
    runner.py        # claim, persist, stream, compact
  core/
    config.py        # pydantic-settings; env vars only, no .env reading
    db.py            # async engine + session factory
    security.py      # password hashing (argon2, bcrypt kept) + length policy
    sessions.py      # session lifecycle: token, row, cookie, sliding expiry
    rate_limit.py    # fixed-window limiter for signup and login
    observability.py # logfire: fastapi + sqlalchemy + httpx
  models.py          # SQLAlchemy 2.0 declarative tables
  crud.py            # user reads/writes
  content/           # the indexed corpus: ingest CLI + tier-1 FTS search
  cli.py             # operator commands (reset-password, delete-user)
  alembic/           # migrations; explicit, hand-reviewed, always reversible
  mail/              # SMTP sender + templates — dormant, see below
```

## Auth

Server-side sessions, not JWT: the browser holds an httpOnly cookie carrying a
256-bit random token, and the row holds `sha256(token)`. Every request already
reaches Postgres, revocation is a `DELETE`, and `EventSource` — which cannot
send an `Authorization` header — authenticates over the same cookie for free.

- Expiry slides: 30 days, refreshed on use at most once a day.
- Signup requires `INVITE_CODE`. Without billing or email verification, open
  registration would make the tutor harness a free LLM proxy.
- `users.timezone` is read from the browser at signup and at every login,
  because proactive messages are scheduled against the user's own clock.
- Password reset and email verification do not exist; the operator resets a
  password from the CLI below.
- `crud.py` and `core/sessions.py` stage writes and never commit. The route (or
  CLI command) owns the transaction and commits once, so a password change and
  the session revocation it implies cannot land apart.

```bash
uv run python -m app.cli reset-password someone@example.com   # prompts, then
                                                              # revokes their sessions
uv run python -m app.cli delete-user someone@example.com      # sessions cascade
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

## The harness

The tutor is a module, not a service. Isolation is by type: a tool never sees a
user id, it sees a `HarnessRepository` that was constructed with one, so the
only chats and messages it can reach are that user's.

A run is owned by the server, not by the client. The chat is claimed
atomically (`chats.active_run_id` with a deadline, so a worker that dies frees
the chat), the user's message is written before the model is called, and the
agent stream is drained by a task with its own session — a closed tab ends the
response, not the run. Messages are stored twice: as native pydantic-ai JSON,
which is what the next run replays, and as the Vercel AI projection the widget
renders. A failed run marks its rows, which keeps them on screen and out of
the model's context.

The history a run is given is the one in the database. A Vercel AI client
posts every message it holds on every turn; `POST /chats/{id}/stream` takes
only the last one from the request, so a client with a stale or edited
transcript cannot rewrite what the tutor remembers.

Prompts are assembled per run from `harness/prompts/`: `base.md`, the medium
(`web`, `telegram`), then the modules the run kind calls for, then context
blocks. They are content, so `docs/pedagogy.md` governs them the way it
governs lessons. Blocks carrying text from outside the platform are fenced
with their provenance, and `base.md` is where the tutor is told that anything
inside such a fence is data.

Caps are enforcement, not telemetry: messages per user per day, and an
instance-wide monthly ceiling computed from the cost recorded on every run.
Set a spend limit on the OpenRouter key too — that one holds even if this code
is wrong. The per-user web search cap belongs to the search tool that spends
it and lands with it.

## The content index

`documents` is the only route from the service to the courses: which files
exist and where they live is unknown here. Rows arrive from the frontend's
`npm run export-index`, which chunks lessons through the site's own MDX
pipeline, and are written by

```bash
python -m app.content.ingest <index.json>     # `make reindex` from the root
```

Ingest is a hash-based upsert: re-running it on an unchanged export writes
nothing, and a chunk the export no longer lists is deleted, so a locator can
never outlive the passage it names. It refuses an empty index rather than
emptying the table, and leaves corpora the file does not mention alone.

Search is tier 1: a generated `tsvector` (title weight A, body B), a GIN
index, `websearch_to_tsquery` and `ts_rank_cd`. No idf, deliberately — the
corpus is hundreds of chunks and the consumer is an agent that reformulates
its query, so recall matters more than the order of the top few. If that
stops being good enough, the next step is a BM25 rerank of the top 50 in
memory, and only then a vector tier.

## Dormant mail

`app/mail/` is wired to nothing. It is kept because the platform will send mail
(account and review notifications) and re-deriving the SMTP plumbing and the
MJML-built templates is pure waste; `emails` and `jinja2` stay in the
dependency set for the same reason. Nothing imports it today, and that is
deliberate rather than an oversight.
