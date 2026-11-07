# apps/backend

FastAPI service: the API and the pydantic-ai tutor harness, a module inside
this same process. Forked from
[full-stack-fastapi-template](https://github.com/fastapi/full-stack-fastapi-template)
(`backend/`, commit `750d3d0`) and then rewritten to be async end to end
(psycopg async driver, `AsyncSession`, async routes) with SQLAlchemy 2.0 typed
models instead of SQLModel. The fork and the surgery on it were meant to land
as separate commits so the diff against the template could be read; the PR was
squash-merged and that separation is gone, so the pinned commit above is what
a diff has to be reconstructed from.

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
    routes/profile.py # bookmarks for the profile page
    routes/progress.py # GET /progress: read/started per lesson, for the course pages
    routes/telemetry.py # reading events in, the activity grid and its feed out
    routes/settings.py # the learner's own settings, pairing included
    routes/telegram.py # POST /api/tg/webhook — Telegram's only entry point
    routes/memories.py # what the tutor remembers: list, edit, delete
    routes/labs.py   # pairing a notebook, and the checkpoints it submits
    size.py          # a ceiling on a request body, refused before it is read
  harness/
    agent.py         # the tutor agent, the toolless namer, the model pool, the compaction threshold
    prompts.py       # module concatenation + context blocks
    prompts/         # the prompt modules themselves (see below)
    deps.py          # HarnessDeps — what a tool receives
    tools.py         # the tools themselves; importing it registers them
    web_search.py    # the Perplexity call behind the web_search tool
    repository.py    # user-scoped reads and writes over chats and messages
    usage.py         # the shape of messages.usage, written once, read by caps; background_runs
    limits.py        # the daily cap, the monthly ceiling, the web search cap
    runner.py        # claim, persist, stream, stop, compact
    steering.py      # messages a web run takes while it answers
    title.py         # naming a chat, and naming it again as it moves on
  core/
    config.py        # pydantic-settings; env vars only, no .env reading
    db.py            # async engine + session factory
    clock.py         # users.timezone -> ZoneInfo, for every run and the poller
    security.py      # password hashing (argon2, bcrypt kept) + length policy
    sessions.py      # session lifecycle: token, row, cookie, sliding expiry
    rate_limit.py    # fixed-window limiter for signup, login and pairing
    observability.py # logfire: fastapi + sqlalchemy + httpx
  scheduling/
    policy.py        # quiet hours, the daily budget, the backoff
    repository.py    # schedules: claim, lease, defer; silence and initiations counted
    gates.py         # whether the platform may open the conversation now, as a sentence
    worker.py        # the poller process + the daily housekeeping sweep
    tools.py         # reminder and mute tools, run by the tutor
  coach/
    agent.py         # the deciding agent: its tools, its run, its Decision
    state.py         # the summary it is handed instead of the thread
    tools.py         # send_card: the only way it reaches the learner
    wake.py          # its one live wake-up row per learner, and what pulls it forward
    floor.py         # the card a silent week ends in, chosen by code
  telegram/
    api.py           # the Bot API client: messages, photos, edits, inline keyboards
    repository.py    # links, pairing codes, update dedup
    outbox.py        # sending and editing: length split, HTML fallback, blocked bot
    thread.py        # the one thread, its claim, and the run that speaks into it
    updates.py       # one incoming message or button press, end to end; bot commands
    speech.py        # a voice note as text, via OpenRouter transcription; audio never stored
    formula.py       # LaTeX math as a PNG, through matplotlib's mathtext
    tools.py         # send_message; the telegram toolset: send_figure, send_formula
  labs/
    repository.py    # pairing codes and tokens; challenges, state, submissions
    verify.py        # what a posted checkpoint is worth: comparison and metrics
    judge.py         # the third kind: a written answer, one model call, a verdict
    ingest.py        # the build's answer keys and solutions into `lab_challenges`/`lab_solutions`
    chat.py          # distill.ask: a question in, the answer out as four SSE events
    check_review.py  # the code review under a check's verdict: one toolless call, into the lab chat
    tools.py         # the lab toolset a lab chat's runs get, and the lab prompt
    schemas.py       # the wire shapes a notebook and the lab page speak
    deps.py          # LabUser — the learner a notebook is calling for
  memory/
    repository.py    # the learner profile: index, read, upsert, delete
    tools.py         # read_memory / save_memory / delete_memory
  review/
    ladder.py        # the intervals, the levels, and what an answer does to them
    repository.py    # review_state, what is due, grading a card
    cards.py         # pick, write on first need, send, grade a tap, expire
    controls.py      # the other buttons under a card: skip, pause, flag, follow-ups
    writer.py        # the two toolless calls a batch costs: write, then check
    subject.py       # what a review is about: the lesson's concepts; the cards sent
    tools.py         # report_review_outcome, run by the tutor on a written answer
  models.py          # SQLAlchemy 2.0 declarative tables
  crud.py            # user reads/writes
  lessons/state.py   # what a user did to a lesson: rating, bookmark
  lessons/progress.py # read/started per lesson: telemetry's completion, a lab's
                     # required checkpoints in place of it
  content/           # the indexed corpus: ingest CLI, FTS search, course spine
  telemetry/         # reading events, the lesson aggregate, completion, the
                     # reading days behind the activity grid and its feed
  cli.py             # operator commands (reset-password, delete-user,
                     # deactivate-user, rebuild-progress)
  alembic/           # migrations; explicit, hand-reviewed, always reversible
```

## Auth

Server-side sessions, not JWT: the browser holds an httpOnly cookie carrying a
256-bit random token, and the row holds `sha256(token)`. Every request already
reaches Postgres, revocation is a `DELETE`, and `EventSource` — which cannot
send an `Authorization` header — authenticates over the same cookie for free.

- Expiry slides: 30 days, refreshed on use at most once a day.
- Signup is open: an email and a password. With no billing and no email
  verification, what keeps the tutor from being a free LLM proxy is the
  per-learner daily caps (`DAILY_MESSAGE_CAP`, `WEB_SEARCH_DAILY_CAP`, the lab
  attempt caps), the per-IP limit on signup and login, and the instance-wide
  `MONTHLY_COST_CEILING_USD` backed by a spend limit on the OpenRouter key.
- `users.timezone` is read from the browser at signup and at every login,
  because proactive messages are scheduled against the user's own clock.
- Password reset and email verification do not exist; the operator resets a
  password from the CLI below.
- Notebooks do not use the cookie. A lab page issues a 10-minute single-use
  pairing code, `POST /api/v1/labs/pair` exchanges it for a bearer token, and
  `labs/deps.py:LabUser` is what the lab routes authenticate with. The token
  does not expire — a notebook left open over a weekend must still submit — so
  `lab_tokens.revoked_at` is the only way one ends, and everything that means
  "this account's credentials end here" writes it beside the sessions it
  revokes: signing out everywhere, `change-password`, the CLI password reset,
  deactivating an account. `change-password` spares the browser that asked and
  no notebook: a token pasted into a notebook that is shared or committed is the
  likeliest leak, and the password change is the only recovery a learner reaches
  without the operator.
- `crud.py` and `core/sessions.py` stage writes and never commit. The route (or
  CLI command) owns the transaction and commits once, so a password change and
  the session revocation it implies cannot land apart.

```bash
uv run python -m app.cli reset-password someone@example.com   # prompts, then revokes
                                                              # sessions and lab tokens
uv run python -m app.cli delete-user someone@example.com      # sessions cascade
uv run python -m app.cli deactivate-user someone@example.com  # revokes sessions and
                                                              # lab tokens, keeps what
                                                              # it wrote
uv run python -m app.cli activate-user someone@example.com    # opens it again
```

Chats are filed under the course of the page they were started on
(`chats.course`, NULL is "General"). The chats from before that column were
filed once, by hand: `propose-chat-courses` prints `chat_id, title, proposed
course, evidence, first question` tab-separated, with `?` wherever the locators
a chat carries disagree or are absent; a person settles every `?` to a course
slug or `general`, and `file-chats` applies the settled file — refusing it
whole while any row is undecided or names a course the index does not carry.

```bash
uv run python -m app.cli propose-chat-courses > chats.tsv
uv run python -m app.cli file-chats chats.tsv
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

A web run can be stopped and steered while it streams, both through requests
of their own — the stream stays one-way. The runs in flight are an in-process
registry (`runner._runs`), so the API is one process: `--workers 1` on the
`CMD` in `apps/backend/Dockerfile`. A stop or steer that lands on a process
not holding the run finds nothing to stop — raise that count only with a
cross-process stop. `POST
/chats/{id}/stop` cancels the agent's part of the run and returns once what it
had produced — the text streamed so far, the tool calls that completed — is
stored like the turn of a run that died, unmarked and with what it cost,
and the chat is free.
`POST /chats/{id}/steer` queues a message for the run: a history processor on
the tutor (`ProcessHistory`) appends it as a user request before the next model
request, it is stored as a `user` row between the model messages it came
between, and the stream announces it as a `data-steer` part. A steer still
queued when the run makes its last request goes back to the client as
`data-steer-unused`, ahead of the finish, to be sent as a turn; one sent with
no run in flight is a 409 and the same thing.

The history a run is given is the one in the database. A Vercel AI client
posts every message it holds on every turn; `POST /chats/{id}/stream` takes
only the last one from the request, so a client with a stale or edited
transcript cannot rewrite what the tutor remembers.

Context is rebuilt per run in `harness/context.py`: the learner's clock, the
index of what the tutor remembers, one line about what they have read, and —
when the widget sent a position — where that lesson sits in the course spine
and the full text of the section on their screen. The section is prefetched
rather than left to `fetch_content`, because the question the widget exists for
is "why is this true?" about something on screen with nothing selected: a model
that answers that without reading the section answers blind.

Prompts for a run are assembled from `harness/prompts/`: `base.md`, the medium
(`web`, `telegram`, `notebook`), then the modules the run kind calls for, then those context
blocks. They are content, so `docs/pedagogy.md` governs them the way it
governs lessons. Blocks carrying text from outside the platform are fenced
with their provenance, and `base.md` is where the tutor is told that anything
inside such a fence is data. The same directory also holds modules for the
passes that are not the tutor — `title.md` is the whole prompt of the namer and
`lab_review.md` the whole prompt of a lab's judge and `lab_check_review.md`
of the review under a check, none of which sees `base.md`; all are loaded by
`module()` rather than `assemble()`.

A web or lab chat is named from the learner's first question and named again by
`harness/title.py` once `TITLE_REFRESH_MESSAGES` more have gone by: one short
completion on a toolless agent, over the tail of the conversation, run after
the client's stream has closed rather than on the learner's reply path. It is
the platform's own bookkeeping: no daily-cap spend, and billed to the instance
through the usage row of the run it follows. The Telegram thread is never
renamed.

Every tool is a barrier (`sequential=True`): the tool calls of one model
response run as concurrent tasks, and all of them drive the run's single
`AsyncSession`, which two coroutines cannot use at once.

The model is the chat's for a dialogue the learner is having and the configured
default for anything the platform starts by itself — reminders,
compactions — which is why the web API refuses to run in, compact or
re-model the Telegram thread.

Caps are enforcement, not telemetry: messages per user per day, an
instance-wide monthly ceiling computed from the cost recorded on every run, on
every judged lab submission and on every model call with no message to hang
it on (`background_runs`: the card writer and checker, transcriptions), web
searches per user per day, and memory
writes per run. Set a spend limit on the OpenRouter key too — that one holds
even if this code is wrong.

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
- `send_figure` / `send_formula` — an image into the Telegram thread: a figure
  `fetch_content` lists for the passage named (`Passage.figures`, from the
  index's `metadata.figures`; any other `src` is refused), or 1–6 lines of
  LaTeX math typeset by `telegram/formula.py` — mathtext with the `cm`
  fontset, on a thread (`asyncio.to_thread`), at 200 dpi on white. mathtext has
  no environments: `aligned` and `pmatrix` come back to the model as the
  parser's message, and an aligned derivation is sent one step per line; a
  line too wide for a photo (Telegram refuses one past 20:1) is refused the
  same way, from the parse alone (`formula.check`), before anything is
  drawn. An
  SVG figure goes as its URL on the site's PNG route
  (`/course-assets-png/<course>/<lesson>/<file>`, which renders it with
  resvg), a raster as served. A photo is not counted as the delivery: the
  final answer still follows it. They are a toolset of their own, handed only
  to a run with an outbox, so no other medium is offered them.
- `read_memory` / `save_memory` / `delete_memory` — the learner profile below.
- `report_review_outcome` — the grade of a review card the learner answered
  in writing rather than with a tap, by its delivery id; it moves the ladder.
  See spaced repetition below.
- `get_user_progress` — the reading history: per lesson, how long they spent,
  how far they scrolled, when it counted as finished, and how many of its
  solutions they opened against how many it ships (`solutions_total`, from the
  index). It is what "no point hiding a solution that is already open" is
  decided from, and what an answer about what they have covered is grounded in.
  A lesson never opened has no entry.

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

`schedules` is the queue of everything the platform intends to do on its own:
reminders a learner asked for, and one wake-up (`kind = 'coach'`) per learner
with a working Telegram link — the moment the coach next looks at them (see
The coach). A second process of this same image (`python -m
app.scheduling.worker`, the `scheduler` compose service) polls it every 30
seconds. There is no broker — Postgres is the queue, and one table beats a
Redis and a Celery for a handful of messages a day.

A cycle claims what is due in one statement (`FOR UPDATE SKIP LOCKED`, then a
lease) and commits before running anything, so a lock is never held for as long
as a model takes to answer and two pollers cannot pick up the same row. The
lease outlasts the run it holds inside it (`RUN_CLAIM_TTL_SECONDS` plus a
margin), or a second poller would reclaim a row whose run is still in flight
and send the same message twice. Every transition clears the lease, which makes
an expired lease exactly the set of rows a dead worker was holding: they go back
to pending, one attempt poorer, and a row that fails three times is failed with
a logfire error.

The limits on what the platform starts are code the coach cannot talk its way
past. `scheduling/gates.py` states them, and the send tools return its refusal
to the model as a sentence:

- **Quiet hours** `users.quiet_start`–`users.quiet_end` (09:00–22:00 by
  default) on `users.timezone`, both ends the learner's to move on the settings
  page; outside them nothing is sent, and a wake-up or a reminder that comes
  due waits for the next morning. The window is same-day: it must open before
  it closes, so a night-shift window like 18:00–02:00 cannot be expressed.
  Everything that counts waking hours (the daily budget) reads it as one
  interval within a date, and wrapping it is a change to all of that, not to
  the constraint alone.
- **One initiation a day** (`policy.DAILY_INITIATIONS`): the cards sent on the
  platform's own account (`card_deliveries.initiated`) and the reminders
  delivered, counted on the learner's calendar.
- **Silence backoff.** Silence is the number of `card_deliveries` that ended
  `ignored` since the learner's latest message in the Telegram thread or
  latest answered card — derived, never stored. After the last card the
  platform waits 1, 2, 4, then 7 days for silence 1, 2, 3, 4+, and keeps
  writing weekly from there until `/mute`. Anything the learner writes or taps
  resets it to zero.
- **Not today.** `users.cards_paused_until` holds cards — never reminders —
  until the next morning; set by a card's own button.
- **Mute.** `users.muted_until` pauses everything the platform starts; the
  learner sets it in conversation (the tutor's mute tool), and answers to what
  they write are unaffected. A muted learner's rows are not claimed rather than
  pushed past the mute, so they keep the time they were meant for and an
  open-ended mute — a timestamp in the year 9999 — is undone by clearing one
  column. A broken link (a blocked bot) holds them the same way; both are
  `claim_due`'s, before anything runs.

**Reminders are not initiations of ours.** A reminder is the learner's
appointment, set for a time they named, so it goes out at that time
regardless of a spent budget, Not today or a backoff wait (quiet hours and mute
still hold), and the reminders due together go out as one message. It does
count as the day's message, which the coach then reads as spent. A reminder
goes into the eternal Telegram thread through the ordinary harness `run()`,
with the `reminder` prompt module, and its row is `done` once it is sent. A
reminder is held, never cancelled, for a learner with no link: unpairing to
move to another phone must not silently cancel what they asked for by name.

One replica, deliberately: `compose.yml` runs a single `scheduler`, and the
lease is sized for one run rather than for a whole batch of users, so a second
poller could sweep the lease of a row the first is still delivering and send it
twice. Scale it and that assumption has to be revisited first.

The worker also owns the daily housekeeping sweep of rows nothing will read
again: expired sessions, pairing codes past their ten minutes — Telegram's and
the labs' — and update ids older than a week.

## The coach

`app/coach/` decides whether the bot says anything to a learner, and when it
looks again. It is a pydantic-ai agent of its own (`COACH_MODEL`), not a tutor
run, and its one rule is the epic's: assume the learner does not want to
engage — everything the bot starts is easy or interesting, or it stays silent
(`prompts/coach.md`).

**What it is handed** is a summary built by code (`state.py`), never the
thread: replaying hundreds of unanswered cards is what made the old bot talk
about its own queue, and it is the costly part of a run. The summary carries
the last run's reason and what woke this one, whether a card can go out now,
days since the last answer and the silence count, the last ten cards with
their outcomes, taps and messages by hour of day over 30 days, the due ladders
(the ten most recent and the ten longest overdue) with step, level and last
outcome, the `review-*` memory descriptions, the `bot-*` memories in full, the
lessons read last with how far they scrolled, and the learner's last three
messages, fenced, for language and tone. A `bot-*` memory is what the learner
told the tutor about the bot itself — "only mornings", "less philosophy" —
saved under that prefix from any chat (`prompts/memory.md`), and binding.

**What it can do**: read with the tutor's own `search_content`,
`fetch_content`, `get_course_structure`, `get_user_progress`, `read_memory` and
`save_memory` (registered on it, not copied), and reach the learner with
`send_card(lesson, level=None, focus=None)` — a tap card of a lesson they
finished, at the ladder's level unless told otherwise; a `focus` has a card
written at one confusion, for that learner alone (`owner_id`). There is no
free-text send tool: "still waiting for your answer" cannot be said. Staying
silent is a run that calls no send tool, and no answer text is ever
delivered. What it returns is a `Decision`: `next_check_at`, on the learner's
clock, and a one-line `reason` handed to the next run. A run is limited to 8
requests; it costs a `background_runs` row of kind `coach`, written whether or
not it decided.

**When it wakes** is one live `schedules` row per learner (a unique partial
index on `kind = 'coach'` and a waiting status), `payload = {reason, note}`:

| Trigger | Effect |
|---|---|
| The run's own `next_check_at` | The next row, clamped to 4 hours – 7 days out, then into the waking window |
| A lesson finished (reading or a lab: `review.start` opening a ladder) | The row pulled to now + 1 hour |
| A tap, a message or a lesson opened after 7 days without any | The row pulled to now + 1 hour |
| No live row (a new link, a row that failed) | `wake.ensure` creates one, due now |

A pull only ever moves a row earlier and leaves one a run holds alone.
`COACH_RUNS_DAILY` runs a learner per day, counted from `background_runs`;
beyond it the row waits for tomorrow's open. A failed run goes through
`repository.retry`; a spent monthly ceiling defers it to the next morning with
nothing sent.

**The weekly floor** (`floor.py`): when a week has passed with no card sent on
the platform's own account — counted from pairing for a learner who has had
none — and a run ends silent, code sends one anyway, chosen with no model: the
lesson finished most recently whose ladder is due and had no card in three
days, at its level, with a card the learner has not seen in two weeks. The
gates hold for it too. The bot does not get to give up on a learner.

## Spaced repetition

`review_state` is where a learner stands on the ladder of one lesson:
`(user_id, lesson)`, the rung, the last outcome and when the next review is
due. It is state of its own rather than something read back out of
`schedules`, because a schedule row is one delivery and deliveries get
retried, coalesced, cancelled and rebuilt. The ladder survives all of that,
answers "which rung is this learner on for this lesson", and — being keyed by
`(user, lesson)` — makes a replayed completion start no second ladder. That is
what `rebuild-progress` leans on.

A ladder opens when telemetry derives `lesson_completed`, on the completion
instant rather than on the flush that noticed it. The intervals are 1, 3, 7
and 21 days, and a passed review on the last rung finishes the ladder:
`next_due_at` goes NULL, nothing is scheduled again, and the row stays as
history. A later stumble does not resurrect it.

The ladder is advice. Nothing turns a due ladder into a message by itself:
the coach reads the due ladders and decides (see The coach), and what is due
for a card the learner asks for — *Next*, *Another question* — leaves out a
lesson a card was sent for in the last three days (`repository.REST`): a card
left unanswered leaves its ladder due, and it must not come straight back as
the next message.

A review is a **tap card** (`review_cards`): one question about one main
point of one section, two to four options, one of them right. Cards are
written on first need and reused: `cards.pick` serves a card of the lesson at
the learner's level that they have not seen in 14 days, from a section whose
`documents.content_hash` still matches the card's, and only when there is
none does `cards.write` spend a model call. The writer is handed the lesson —
its chunks from the index, the concepts it introduces and the ones introduced
next door — and writes a batch of three at the requested level
(`writer.py`, `prompts/card_writer.md`, governed by `prompts/review.md`). A
second toolless call checks each card against the same text: the marked
answer is right, every other option is wrong, there is one answer, it is a
main point (`prompts/card_check.md`). A card that fails any of it is dropped;
when none survives, nothing is sent (the weekly floor puts that ladder off a
day, so it does not pay for the same batch every run). Both calls run on
`CARD_MODEL`, and what they cost goes to `background_runs`, which the monthly
ceiling sums; a spent ceiling defers the coach's run to the next morning. Cards are shared between learners unless `owner_id`
names one.

The writer is given each section's figures and may show a card with one —
`figure`, the `src` of one of its section's, or `formula`, one line of LaTeX
math — never both; a card whose figure its section does not list, or whose
formula does not parse or is too wide for a photo, is dropped before the
check. Such a card's prompt is at most 400 characters, and its feedback cuts
the explanation short where the whole would pass Telegram's 1024-character
caption.

A card goes out as a message with one button per option
(`k:<delivery_id>:<option>`), recorded in `card_deliveries`; a card with an
image goes out as a photo with its prompt as the caption, and its feedback
edits the caption. A photo Telegram refuses — the site's figure unreachable,
a picture past its limits — retires the card (`status = 'retired'`) and the
next card in line is sent instead, once. **A tap is
graded by code**: the delivery is locked, the option compared with the
marked answer, the ladder moved and the message edited into ✓ or ✗, the right
answer, the explanation and a link to the section — no model is asked. A card
answered once is answered: a second tap changes nothing. A card nobody taps
in a day is `ignored`, and the ladder does not move; the backoff is what
answers silence.

An **`order` card** (level 3, only for a lesson with a sequence its text
forces) lists three to five steps numbered under the prompt, in an order code
shuffled so it is never the answer; its buttons are the numbers
(`o:<delivery_id>:<step>`, and `o:<delivery_id>:r` to reset). Each tap edits
the message to show the order so far and drops that number; the order lives
in `card_deliveries.chosen`, so a restart mid-card loses nothing, and the
card stays unanswered until the last step is placed. That tap grades it, all
or nothing, exactly as a single tap grades any other card.

**The other buttons** (`controls.py`, `<prefix>:<delivery_id>`). Under an open
card: *Another question* (`a`) marks it `skipped` and edits the message in
place into a card one level lower on the same lesson, else one of the next due
lesson, else "Nothing else for now" — from cards already written only, since
the learner is waiting on a tap; level and ladder do not move. *Not today*
(`n`) skips it, takes the buttons off and sets `users.cards_paused_until` to
tomorrow's open — not `muted_until`, which would hold the learner's reminders
too. *This card is wrong* (`w`) retires the card on the first report, files an
`error` incident against its section (`HarnessRepository.file_incident`, on the
thread chat) and then behaves as Another question. Under the feedback on a
tapped card: *Next* (`x`) sends the next due card now — no initiation is spent,
`CARDS_PER_DAY` bounds it; *Harder one* (`h`, absent at level 3) sends a card
of the lesson a level up, written if none exists, and a right answer to it
sets the level while a wrong one changes nothing (`card_deliveries.harder`);
*Explain* (`e`) and *In my own words* (`m`) are `chat` runs on the thread with
the card in their context. Own words are graded by `report_review_outcome` as
recall: `passed` is a right answer at the level and climbs past `STEP_CAP`.
Each feedback button is spent once (`card_deliveries.follow_ups`) and given
back if what it started fails.

Two harder cards (level 2+) skipped in a row, within seven days of each other
and the later within seven days of now, mean only level 1 is served until
then, whatever the ladder's level says — derived from `card_deliveries`
(`repository.level_one_only`). When a new card goes out, any earlier card
still open is edited to one line, `<lesson title> — skipped`, without buttons;
an answered card is left as it is.

**Levels are per lesson** (`review_state.level`, `level_run`). Level 1 is the
main point itself, level 2 tells two ideas apart, level 3 spots the error in
a short argument or puts the steps of one in order. Three right answers in a
row raise the level, a wrong one lowers it. A right tap climbs the ladder only
up to its level's cap (`ladder.STEP_CAP`: rung 1 at level 1, rung 2 at level
2) and at the cap re-arms the interval it is on, so only level 3 can finish a
ladder. A wrong tap drops back a rung.

A learner may answer a card in writing instead. Every message they send is
handed the cards of the last day with their delivery ids and the review
module, and `report_review_outcome(delivery_id, …)` is how the tutor grades
the answer: `passed` climbs, `partial` repeats the interval, `failed` drops
back, uncapped — recall is not recognition — and the level stays. It grades a
card once, whichever of a tap and a written answer came first; its `notes`
become a memory, so the next conversation starts from the sore spot.

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
recorded id is what keeps a redelivery from starting a second run. The price of
that ordering is one message lost per crash between the 200 and the run — the
id is already recorded, so Telegram will not send it again. Accepted: the
alternative (answering after the run) turns every slow answer into duplicate
deliveries, which is the failure the learner would actually notice.

The eternal thread is created by the backend and by nothing else
(`telegram/thread.py`). The web API creates web chats only, and refuses to
stream into, compact or re-model a telegram chat (a lab chat it may continue), because the silence backoff reads any message
in that thread as the learner's own.

Serialization is the thread's own claim, which is the only thing both processes
can see: a reminder run or a card finds the thread held by an incoming
message and comes back later (a card the coach was sending is refused, and the
coach told so), and an incoming message waits for a reminder run to finish
rather than talking over it. A wait that outlasts the run is answered with a line
saying so — silence reads as a broken bot.

Formatting is the tutor's job (`prompts/medium/telegram.md`): it writes
Telegram HTML and keeps its own messages under the limit. The backend's two
safety nets are for when it does not — a message, caption or edit Telegram
will not parse is resent unformatted rather than dropped, and a message over
4096 characters is split.

A voice note in a private chat is an answer like a typed one: one over 120 s
is refused before download; otherwise, once the caps allow it, it is
downloaded, transcribed (`speech.py`, cost to `background_runs`), shown back as
a `Heard:` line and run as text. The audio is never stored or logged. A failed
or empty transcription gets "Couldn't make that out. Send it as text?" and
starts no run.

`/clear`, `/compact`, `/mute` and `/unmute` are bot commands, handled by the
backend rather than by the model: `/clear` writes the marker that cuts the
history, `/compact` is the same summarisation the site does, and the two mutes
set `users.muted_until`.

Buttons are inline keyboards, not quiz polls: a poll caps its explanation at
200 characters and cannot be edited into feedback. A button's `callback_data`
is `<prefix>:<payload>` (64 bytes at most, Telegram's limit), and a press
arrives as a `callback_query` update — deduplicated by `update_id` like a
message, private chats only — that is routed to `updates.TAP_HANDLERS` by its
prefix. The press is answered (`answerCallbackQuery`) before anything else,
since Telegram spins the button until it is, and a press nothing handles, or
from a chat nobody paired, ends there; so does one from a group, which is
answered and dropped. An edit that would change nothing — a
double tap — is Telegram's 400 "message is not modified", and is not an error.
Changing `allowed_updates` takes `python -m app.cli set-webhook <url>` again.

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
python -m app.content.ingest <index.json> [<labs-private-dir>]  # `make reindex`
```

Ingest is a hash-based upsert: re-running it on an unchanged export writes
nothing, and a chunk the export no longer lists is deleted, so a locator can
never outlive the passage it names. It refuses an empty index rather than
emptying the table, and leaves corpora the file does not mention alone.

The optional second argument is the lab build's `labs-dist/private/`, and it
is the one thing the content ingest loads that is not a `documents` row:
expected outputs, held-out labels and rubrics go to `lab_challenges` instead,
because search returns documents and the tutor quotes them, and each lab's
reference solution to `lab_solutions`, which only a lab chat's tools read.
Same command, so a
lab's brief and the challenges it is graded against cannot be one deploy
apart; an absent or empty directory means the labs were not built and leaves
the table alone rather than un-verifying every lab on the site.

Search is tier 1: a generated `tsvector` (title weight A, body B), a GIN
index, `websearch_to_tsquery` and `ts_rank_cd`. No idf, deliberately — the
corpus is hundreds of chunks and the consumer is an agent that reformulates
its query, so recall matters more than the order of the top few. If that
stops being good enough, the next step is a BM25 rerank of the top 50 in
memory, and only then a vector tier.

## Labs

A lab is a lesson the learner solves in their own Jupyter. The server executes
nothing they or the author wrote: `app/labs/verify.py` compares a posted output
against the one the build captured from the reference solution or scores
predictions against labels the learner never sees, and `app/labs/judge.py` hands
a written answer to a model. Three tables, keyed by the same lesson locator as
everything else: `lab_challenges` (the answer key, per checkpoint),
`lab_checkpoint_state` (attempts, first pass, best score, the last hint) and
`lab_submissions` (the append-only log).

```
GET  /labs/{course}/{lesson}/manifest    # public: what the notebook computes on
POST /labs/submissions                   # bearer: one attempt at one checkpoint
GET  /labs/{course}/{lesson}/progress    # cookie: what the lesson page draws, and `paired`
POST /labs/{course}/{lesson}/ask         # bearer: a question to the tutor, SSE back
POST /labs/{course}/{lesson}/chat        # bearer: a new lab chat (distill.clear_chat)
POST /labs/{course}/{lesson}/review      # bearer: the code review of a check, SSE back
```

- `ask` runs on the web chat's harness path — claim, daily cap and monthly
  ceiling (409 and 429 as on the site), storage, naming — in a chat of kind
  `lab`, the learner's latest in that lab unless the request names one. What
  is the notebook's is the two ends: the question arrives as text plus
  attachments, stored above it as fenced blocks, and the answer leaves as
  `step` / `text` / `done` | `error` events (`wire_shapes.json`). Any run in a
  lab chat, from the notebook or continued on the site, gets the lab prompt
  and the lab toolset; no other chat does.

- `review` follows every `distill.check` once its verdict is printed. It is
  not a tutor run: one toolless call (`check_review.py`, on
  `LAB_REVIEW_MODEL`, prompt `lab_check_review.md`) handed the checked
  function's source — `lab_submissions.source`, optional on the wire, so an older
  client is still graded — the verdict and the wrong answer's hint, the
  checkpoint's inputs and expected output, the next checkpoint and the
  reference solution. It streams `ask`'s events, holds the lab chat's claim
  (409 while a question runs there), honours the daily cap and the monthly
  ceiling (429), and on success stores two turns in the lab's latest chat, in
  one transaction — `check <id>: passed|failed` with the source fenced, then
  the review with its usage — so the next `ask` continues from it. A failed
  review stores no turn; what its call cost lands on the submission's
  `usage`, which the ceiling sums. The verdict is never touched.

- The manifest is the display half from `documents.metadata.lab` joined with
  `lab_challenges.spec["public"]`, and it is public by construction rather
  than by filtering: the answer key lives under a sibling key the route never
  reads. Serving it here rather than from the mirror is what keeps the inputs
  a learner computes on and the outputs they are compared against one ingest.
  A checkpoint's `kind` comes from the challenge rather than from the index,
  for the same reason: the two are separate ingests, and the notebook must
  build the payload the row that grades it takes.
- A submission carries the id its notebook minted, which is the primary key of
  the log: a post retried over a dropped connection is answered with the
  verdict it already earned and spends no second attempt. It also carries the
  manifest's `content_version`; a mismatch is 409 and means the lab was
  rebuilt under an open notebook.
- Feedback is coarse on purpose — a pass, and a hint only where the output
  matches a wrong variant the author declared, naming the bug and never the
  expected value. Nothing reports how far off an answer was. A `review`
  checkpoint is the exception, because feedback is all it is for: the judge's
  sentence comes back in the same field and is what the page shows.
- The judge (`app/labs/judge.py`, prompt `harness/prompts/lab_review.md`) is
  one call on a toolless agent, inside the submit request: the private rubric,
  the learner's answer fenced as untrusted, and a schema-validated
  `{passed, feedback}` back. It is lenient by instruction — a `review`
  checkpoint is `required: false` unless an author says otherwise, and the
  value is the sentence rather than the gate. Anything that stops it
  answering — an outage, a call that never comes back inside
  `judge.TIMEOUT_SECONDS`, output that will not validate twice, a spent monthly
  ceiling — leaves the submission `pending` rather than failing the learner,
  and what the call cost is stored on `lab_submissions.usage`, the second row
  that ceiling sums. A pending verdict overwrites nothing and stores nothing:
  the feedback the page shows is the last judgement that actually happened,
  never the hint that says none did. Nothing re-grades a stored submission —
  the log is append-only — so a pending verdict is not a queue, and both the
  hint and the page's own line say to post the answer again.
- The call is made between two transactions, never inside one. `submit` runs
  its checks under the per-(learner, lesson) lock, commits to hand back both
  the lock and the pooled connection, judges with nothing held, then takes the
  lock again to write — asking a second time whether this submission id has
  been answered, because a retry of it may have finished while the model was
  thinking. A judging that hangs must not be able to block this learner's
  telemetry flush or starve the connection pool, which is why the harness
  claims its chat and commits before running a model too.
- Passing every `required` checkpoint finishes the lesson: the same
  `lesson_completed` event reading one emits
  (`telemetry.ingest.emit_completion`) and the same review ladder, under the
  same per-(learner, lesson) advisory lock, so two submissions landing together
  finish it once. `lesson_progress` is re-derived in that transaction too,
  because it is the projection every reader of completion outside telemetry
  consults and a lab has no flush of its own coming.
- Rate limits: 60 submissions a minute per learner, and per checkpoint per day
  `LAB_METRIC_ATTEMPTS_PER_DAY` / `LAB_REVIEW_ATTEMPTS_PER_DAY` for the two
  kinds that cost the server real work. All of them are in-process fixed
  windows, so the real daily ceiling is that number times the worker count and
  a deploy resets it — the bound that actually stops model spend is the
  monthly cost ceiling, which is counted in the database. The day's attempt is spent before the
  grading it bounds — what bounds a model call has to be — and given back when
  nothing was graded, so a retried id, a stale `content_version`, a checkpoint
  nobody built, a payload the checkpoint refuses and a judging the platform
  could not do all cost the learner nothing.

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

is that same function over every pair, under the same per-pair lock, crediting
reading days in the same walk. Rebuild derives projections only — side effects
are not replayed, so a completion a changed heuristic invents starts no review
ladder.

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

Reading is not the only way to finish a lesson, though — passing a lab's
required checkpoints emits the same event (`app/labs/repository.py`), and a lab
is finished having met no reading bar at all. So the projection takes the
earliest `lesson_completed` of the pair wherever the running totals derive
nothing: the event is the statement that a lesson was finished, and
`lesson_progress.completed_at` is its projection either way.

A **reading day** is a lower bar over one calendar day of the reader's own
clock (`users.timezone`): five minutes of credited attention, no scroll depth
at all, and capped at that lesson's own completion threshold — a lesson that
can be *finished* in three minutes must not need five to earn its square.
`lesson_passes` holds one row per `(reader, lesson, day)` that clears it.
Completion is the whole lesson and happens once; a pass is a day of reading and
repeats, which is what the activity grid on the profile counts — reading a
lesson twice in one evening is one square, coming back to it next month is
another, and a long lesson read across a week is a square on each of those days
though it completes on none of them. The same flush writes it, in a savepoint
of its own so a square that cannot be written never fails the flush that
carries the reading; the day window is stated in UTC around the database's own
`now()`, so the query still reads `events` by its index and dates the day by
the clock that stamped `server_ts`. A pass emits no event and opens no ladder:
only completion does that. `rebuild-progress` re-derives passes in the same
walk, adding rows and removing none — `events` is pruned, and a day whose
events are gone is still a day that was read.

`GET /telemetry/activity` serves the profile's activity panel in one answer.
`days` is the days of a 53-week grid the reader touched, each carrying both
questions: `count`, the lessons that *earned* the day, straight from
`lesson_passes`, and `seconds`, everything the day was *spent* on, rolled up
from `events` in the reader's zone — a day under the bar has a count of zero
and is still a day that was read. `feed` is the 30 newest lines beneath it, one
per `(day, lesson)`, with the seconds and the span of the reader's own clock
the reading happened over; a lesson merely opened and abandoned is not a line,
and an abandoned tab does not stretch the span of the evening it was finally
read in. Clicking a square asks `GET /telemetry/activity/{date}` for that day's
lines alone. Durations go over the wire as seconds, never minutes: the browser
is the one place a duration is put into words, and two roundings would let a
tooltip and the line under it disagree by a minute. A reader who moves timezone
gets a grid cut two ways — the pass keeps the zone it was written in, the
seconds and the feed are bucketed in the zone held now — which the route states
and is why nothing re-derives a pass on demand: a square that was earned must
not stop existing.

The **recently read** list beside the panel is a different question with a
different source: `GET /profile` over `lesson_progress`, every lesson once by
when it was last opened, as it always has been. The panel answers "which
days"; that answers "which lessons".

The course list and the course page ask a third question — how far through a
course — of `GET /progress[?course=]`: every lesson the reader has started, as
`read` or `started`, most recently seen first. Read is `completed_at` as
telemetry wrote it, except on a lab, which is read only once its required
checkpoints have passed and is started by a submission as much as by a visit
(`app/lessons/progress.py`).

## Not here

- **Mail.** No SMTP plumbing, no templates, no `EMAILS_*` settings: nothing
  sends mail, and the fork's dormant module (with `emails` and `jinja2`) was
  deleted rather than carried. Account and review notifications are #25, and
  the template it came from is one `git log` away when that is scheduled.
- **A generated API client.** The site's clients are hand-written
  (`apps/frontend/lib/*/api.ts` over `lib/http.ts`); the OpenAPI generator is
  gone, and `/api/v1/openapi.json` is served for reading, not for codegen.
