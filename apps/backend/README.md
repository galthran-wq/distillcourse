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
    routes/lessons.py # per-lesson user state: rating, bookmark
    routes/profile.py # visit history + bookmarks for the profile page
    routes/settings.py # the learner's own settings, pairing included
    routes/telegram.py # POST /api/tg/webhook — Telegram's only entry point
    routes/memories.py # what the tutor remembers: list, edit, delete
  harness/
    agent.py         # the tutor agent, the model pool, the compaction threshold
    prompts.py       # module concatenation + context blocks
    prompts/         # the prompt modules themselves (see below)
    deps.py          # HarnessDeps — what a tool receives
    tools.py         # the tools themselves; importing it registers them
    web_search.py    # the Perplexity call behind the web_search tool
    repository.py    # user-scoped reads and writes over chats and messages
    usage.py         # the shape of messages.usage, written once, read by caps
    limits.py        # the daily cap, the monthly ceiling, the web search cap
    runner.py        # claim, persist, stream, compact
  core/
    config.py        # pydantic-settings; env vars only, no .env reading
    db.py            # async engine + session factory
    clock.py         # users.timezone -> ZoneInfo, for every run and the poller
    security.py      # password hashing (argon2, bcrypt kept) + length policy
    sessions.py      # session lifecycle: token, row, cookie, sliding expiry
    rate_limit.py    # fixed-window limiter for signup and login
    observability.py # logfire: fastapi + sqlalchemy + httpx
  scheduling/
    policy.py        # quiet hours, the slot timeout, the budget, coalescing
    repository.py    # schedules: claim, lease, defer, slot, outcome
    worker.py        # the poller process + the daily housekeeping sweep
    tools.py         # reminder and mute tools, run by the tutor
  telegram/
    api.py           # the Bot API client: sendMessage, setWebhook
    repository.py    # links, pairing codes, update dedup
    outbox.py        # sending: length split, HTML fallback, blocked bot
    thread.py        # the one thread and the run that speaks into it
    updates.py       # one incoming message, end to end; bot commands
    tools.py         # send_message, run by the tutor
  memory/
    repository.py    # the learner profile: index, read, upsert, delete
    tools.py         # read_memory / save_memory / delete_memory
  models.py          # SQLAlchemy 2.0 declarative tables
  crud.py            # user reads/writes
  lessons/state.py   # what a user did to a lesson: history, rating, bookmark
  content/           # the indexed corpus: ingest CLI, FTS search, course spine
  telemetry/         # reading events, the lesson aggregate, completion
  cli.py             # operator commands (reset-password, delete-user,
                     # rebuild-progress)
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

Caps are enforcement, not telemetry: messages per user per day, an
instance-wide monthly ceiling computed from the cost recorded on every run,
web searches per user per day, and memory writes per run. Set a spend limit on
the OpenRouter key too — that one holds even if this code is wrong.

## The tutor's tools

`app/harness/tools.py`, registered on the agent by being imported. None of
them takes a user id: a tool is handed the repository the run was built with,
so the only chats it can write to are the ones that repository can see.

- `search_content` / `fetch_content` — the corpus. A locator that resolves to
  nothing comes back as `not_found` with the three closest locators, which is
  what lets the tutor correct its own typo instead of telling the learner the
  material does not exist. An anchor resolves to the section that contains it;
  a locator without one reads the whole document.
- `get_course_structure` — the spine of a course from the `course:` documents:
  modules and lessons in reading order, prerequisites, concepts.
- `report_content_incident` — a row in `incidents` when the tutor concludes the
  material is at fault rather than the learner. Triage is manual (`psql`);
  nothing else in the application reads that table.
- `web_search` — one Perplexity call, capped per user per day and counted in
  `messages.usage` beside the tokens. The answer reaches the model inside an
  `<untrusted source="web_search">` fence, where `base.md` has already told it
  that instructions are data. The attempt is what counts against the cap, not
  the answer, so a provider having a bad day cannot become a retry loop.
- `send_message` — one message into the learner's Telegram thread, before the
  answer is finished. It is the delivery once it is used: a run that sent
  nothing has its final answer delivered for it, and one that sent something
  does not get its answer sent on top. On the site the tool says there is
  nothing to send: the answer is the delivery there.
- `read_memory` / `save_memory` / `delete_memory` — the learner profile below.
- `get_user_progress` is specified with these but not implemented here: it
  reads the `lesson_progress` aggregate that telemetry owns, and lands with it
  (#37).

## Memory

`memories` is what the tutor knows about a learner — their background, the goal
that brought them here, notation that worked, a misconception it had to
correct. It is keyed by `(user_id, slug)` and belongs to the learner, not to a
chat or a medium: a fact stated on the site is in front of the tutor on
Telegram the same evening.

**The index is in context, the body is fetched.** Every run's prompt carries
one line per memory — slug and a one-line description — and `read_memory`
returns the bodies of the ones whose description bears on the question. That is
what lets a memory be a paragraph of real context without the profile growing
every prompt it rides in. The cost is the "didn't read it" risk, paid down by
requiring descriptions that are decidable at a glance (`prompts/memory.md`) and
by asking for a read before answering.

There is no vector store and no memory library. This is a profile of dozens of
lines, and retrieval over dozens of lines is a `SELECT`; the upgrade path, if a
learner's corpus ever becomes one, is the `documents` index that already
exists.

Nothing derivable from telemetry is stored here — what they opened, how far
they read, which solutions they revealed is `lesson_progress`, and the tutor
asks for it.

Writes happen two ways: `save_memory` during a dialogue, and the `/compact`
hook — the summarization run returns memory candidates alongside the summary,
which is the one moment the whole conversation is in front of the model. Both
are bounded by `MEMORY_WRITES_PER_RUN`: an injection guard, because the text a
run reads can talk it into rewriting the profile. Past
`MEMORY_INDEX_SOFT_CAP` lines the index carries an instruction to consolidate
rather than extend — a slug written again replaces what was there, which is how
two overlapping memories become one.

The learner reads the whole profile at `/profile/memories` and edits or deletes
any line of it; an edit marks the row `source = user`. A proactive tutor that
remembers things is only trustworthy if what it remembers is visible.

## Lesson user state

Three tables keyed by `(user_id, "lesson:<course-slug>/<lesson-slug>")` — the
content index's own locator, so a rating, a bookmark, a reading event and a
search hit all name a lesson with one string: `lesson_progress` (the reading
aggregate telemetry writes and the profile's visit history reads),
`lesson_ratings` (one changeable ±1 per lesson) and `bookmarks`. The service
does not know which lessons exist — that is the content index's business — so
the routes validate the shape of the two slugs (`locators.SLUG_LENGTH`) and
compose the locator themselves.

Every route requires a session: an anonymous visitor reads the site and leaves
no row anywhere. Ratings have no public counter and no dashboard; the curator
queries them in psql (`docs/deployment.md`).

## Proactive scheduling

`schedules` is the queue of everything the platform intends to say on its own:
reviews that come due and reminders a learner asked for. A second process of
this same image (`python -m app.scheduling.worker`, the `scheduler` compose
service) polls it every 30 seconds. There is no broker — Postgres is the queue,
and one table beats a Redis and a Celery for a handful of messages a day.

A cycle claims what is due in one statement (`FOR UPDATE SKIP LOCKED`, then a
lease) and commits before running anything, so a lock is never held for as long
as a model takes to answer and two pollers cannot pick up the same row. The
lease outlasts the run it holds inside it (`RUN_CLAIM_TTL_SECONDS` plus a
margin), or a second poller would reclaim a row whose run is still in flight
and send the same message twice. Every transition clears the lease, which makes
an expired lease exactly the set of rows a dead worker was holding: they go back
to pending, one attempt poorer, and a row that fails three times is failed with
a logfire error.

What reaches the learner is decided per user, in `policy.py`:

- **Quiet hours** `users.quiet_start`–`users.quiet_end` (09:00–22:00 by
  default) on `users.timezone`, both ends the learner's to move on the settings
  page; outside them the row waits for the next morning.
- **One open slot.** A delivered message sets `awaiting_reply`, and `due_at`
  then means the moment it counts as ignored — four *waking* hours later, so a
  message at 21:30 is not written off overnight. Everything else due waits for
  that slot to close.
- **Three initiations a day**, counted as messages rather than items: what is
  due for one learner is coalesced into a single message of at most three
  items, and the rest wait for tomorrow.
- **Rotation.** After a message the learner let time out, the next one leads
  with a different `payload.topic`.
- **Mute.** `users.muted_until` pauses everything the platform starts; the
  learner sets it in conversation (the tutor's mute tool), and answers to what
  they write are unaffected. A muted learner's rows are not claimed rather than
  pushed past the mute, so they keep the time they were meant for and an
  open-ended mute — a timestamp in the year 9999 — is undone by clearing one
  column.

Delivery goes into the learner's eternal Telegram thread through the ordinary
harness `run()`, with the `proactive` or `review` prompt module. Rows exist only
for a learner who has paired Telegram: the reminder tool refuses to create one
otherwise, and a row that reaches the poller with no thread behind it is
cancelled rather than rescheduled — a row with nowhere to go would come back
every morning forever. Whether they replied is read back from the thread, so the
outcome (`answered` / `ignored`) is recorded whichever way a message arrived.

The worker also owns the daily housekeeping sweep of rows nothing will read
again: expired sessions, spent pairing codes and update ids older than a week.

## Telegram

The second medium, and the only one the platform can write to first. One
learner, one Telegram account (`tg_links`, unique on both sides), one eternal
thread (`chats.kind = 'telegram'`) — no chat switching, deliberately unlike the
site.

Pairing starts on the settings page: a one-time code (10 minutes, spent on
first use) behind a `t.me/<bot>?start=<code>` link. The code is the credential,
so a leak is bounded by that TTL and that single use; a Telegram account that
already belongs to another learner is refused before the code is spent.
Unpairing deletes the link and keeps the thread, so pairing again resumes the
same conversation.

`POST /api/tg/webhook` is outside the versioned API: it is registered with
Telegram once and answers to Telegram alone, authenticated by the
`X-Telegram-Bot-Api-Secret-Token` header (a header, not a query string, which
would be written to every access log on the way). The route records the
`update_id`, answers 200 immediately and does the work in the background:
Telegram redelivers anything it does not get a prompt answer to, and the
recorded id is what keeps a redelivery from starting a second run.

Serialization is the thread's own claim, which is the only thing both processes
can see: a proactive run finds the thread held by an incoming message and comes
back later, and an incoming message waits for a proactive run to finish rather
than talking over it. A wait that outlasts the run is answered with a line
saying so — silence reads as a broken bot.

Formatting is the tutor's job (`prompts/medium/telegram.md`): it writes
Telegram HTML and keeps its own messages under the limit. The backend's two
safety nets are for when it does not — a message Telegram will not parse is
resent unformatted rather than dropped, and one over 4096 characters is split.

`/clear`, `/compact`, `/mute` and `/unmute` are bot commands, handled by the
backend rather than by the model: `/clear` writes the marker that cuts the
history, `/compact` is the same summarisation the site does, and the two mutes
set `users.muted_until`.

A 403 from Telegram means the bot was blocked. The link goes to `broken`, and a
broken link holds that learner's schedules exactly as a mute does — nothing is
retried into a dead channel, and the site shows a banner. Any message from them
proves the channel is back and reopens it.

## The content index

`documents` is the only route from the service to the courses: which files
exist and where they live is unknown here — the structure of a course is a
row in it (`course:<slug>`, the spine in `metadata`) exactly as its prose is.
Rows arrive from the frontend's `npm run export-index`, which chunks lessons
through the site's own MDX pipeline, and are written by

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

## Telemetry

`events` is append-only and is the truth about reading; `lesson_progress` is a
projection of it, upserted in the same transaction as the flush that changed
it. Only signed-in readers are tracked — an anonymous visitor reaches
`POST /telemetry/events` as a 401 and leaves no row.

The browser mints each event's id, so a retried flush lands on rows that are
already there. A batch is capped at 50 events and each payload is validated
against its type and re-emitted from the model, so what the aggregate casts in
SQL is always the declared shape; an event the server cannot read is dropped
rather than answered with an error, because telemetry must not interrupt
reading. A body larger than any legitimate batch is refused with 413 before it
is read at all, in the route class and again in caddy.

The `seconds` in a heartbeat are a claim, and the per-event cap bounds nothing
on its own — 50 events per batch times 60 batches a minute is more reading than
there are minutes. What bounds it is the server's clock: a flush is credited at
most the seconds that passed since this reader last flushed this lesson, and a
beat that is not covered is not stored. The first flush has nothing to be
measured against and is allowed one heartbeat's worth, below every threshold
there is.

The aggregate is a full recompute from the events of one (reader, lesson), not
an increment: the projection cannot drift from the log, and

```bash
python -m app.cli rebuild-progress    # every aggregate, from the events
```

is that same function over every pair. Rebuild recomputes aggregates only —
side effects are not replayed, so a completion a changed heuristic invents
starts no review ladder.

A lesson counts as complete at `max_scroll_pct >= 90` and `active_seconds`
past a threshold of `document_word_count / 250 wpm / 2`, clamped to 3–20
minutes and read from `documents` (5 minutes for a lesson the index has never
seen). The completion instant is derived from running totals over the events
rather than from `now()`, so deriving it twice gives the same answer. It is
recorded as a `lesson_completed` event with a random id — the ids in `events`
are the client's to choose, so a derived one could be squatted to suppress the
completion. What makes the emit exactly-once is the absence of the event,
checked under the same advisory lock the flush holds. That row is where spaced
repetition subscribes.

## Dormant mail

`app/mail/` is wired to nothing. It is kept because the platform will send mail
(account and review notifications) and re-deriving the SMTP plumbing and the
MJML-built templates is pure waste; `emails` and `jinja2` stay in the
dependency set for the same reason. Nothing imports it today, and that is
deliberate rather than an oversight.
