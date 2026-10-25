# Deployment

One VPS, one operator, `docker compose`. There is no CD: nothing deploys
itself. `make deploy` is the whole procedure, reindexing included.

## Topology

```
              :80 / :443
                  │
               caddy ──── /api/*  ──> backend  :8000  ──┐
                  └────── everything else ──> frontend :3000
                                                        │
                          migrate (runs once, exits) ───┤
                                                        │
                          scheduler (proactive poller) ─┤
                                                        ▼
                                                   postgres:17
                                                        ▲
                                          backup (daily pg_dump) ──> ./backups
```

- `caddy` terminates TLS. `SITE_ADDRESS=:80` serves plain HTTP for local use;
  set it to the hostname and Caddy obtains and renews the certificate itself.
- `migrate` runs `scripts/prestart.sh` (wait for Postgres, `alembic upgrade
  head`) and exits; `backend` will not start until it has exited successfully,
  so a failed migration stops the deploy instead of half-applying it.
- `backend` is healthy only when `GET /api/v1/health` reaches Postgres.
- `scheduler` is the same image running the proactive poller instead of the
  API (`apps/backend/README.md` describes what it decides). It has no port and
  no healthcheck: what it does is visible in `schedules` and in logfire.
- The frontend image is built with `CONTENT_PREVIEW=1` by default, which
  renders drafted and reviewed lessons. Build the public site with
  `CONTENT_PREVIEW=0`.

## First install

```bash
cp .env.example .env      # set POSTGRES_PASSWORD, SITE_ADDRESS, LOGFIRE_TOKEN
make up
```

`ENVIRONMENT=production` with the default Postgres password is rejected at
startup rather than silently accepted.

## Deploying a change

```bash
make deploy      # git pull --ff-only, build, migrate, restart, reindex, status
make reindex     # the index alone, when only the corpus needs rebuilding
```

`make reindex` exports `index.json` from the content tree and feeds it to the
backend's ingest CLI. It runs as part of every deploy rather than beside it: a
build that renames an h2 or unpublishes a lesson leaves `documents` holding
anchors the page no longer has, and the tutor then hands out locators that
scroll nowhere. This is the step that needs Node on the box, not just Docker —
the export runs the site's own MDX pipeline, the only way an indexed anchor and
a page anchor cannot diverge. `CONTENT_PREVIEW` is read from the same `.env`
docker compose builds the frontend from, so the index and the site cannot
disagree about which lessons exist.

The export is the complete index, and ingest deletes every row of the corpora
it mentions that the file no longer lists — that is how a renamed heading or a
deleted lesson stops being a search result the tutor can quote.

Reindexing also rebuilds the labs (`npm run build-labs`) and loads their answer
keys, so the box needs `uv` as well wherever a lab lesson exists. `make deploy`
runs that build once before the image build — a red lab stops the deploy
before any container is replaced — and the image then validates with
`--no-labs`; a lab whose inputs have not changed since its last green run is
skipped by fingerprint, so the build in reindex executes nothing. The labs are
rebuilt rather than assumed: the checkpoint API must compare against the
outputs the notebooks on the mirror were generated from, and a stale key would
grade a correct answer wrong. A build that produces nothing leaves
`lab_challenges` alone rather than emptying it.

## The Telegram bot

The channel the platform writes to on its own. Without the three `TELEGRAM_*`
variables it simply does not exist: the settings page offers no pairing and
nothing is ever sent.

1. Create the bot with `@BotFather`, and put the token and the bot's `@name`
   (without the `@`) in `.env`.
2. Put any long random string in `TELEGRAM_WEBHOOK_SECRET` — Telegram echoes it
   back in a header on every call, and that header is the only thing that says
   a request is Telegram's.
3. Register the URL once, after the stack is up and reachable over TLS:

```bash
docker compose exec backend python -m app.cli set-webhook \
  https://<your host>/api/tg/webhook
```

Learners pair themselves from Settings on the site; the operator does nothing
per account. `tg_links.status` is `broken` for anyone who blocked the bot —
their schedules are paused until they write to it again.

## Accounts

Signup requires `INVITE_CODE` from `.env`; hand that string to whoever should
get an account. There is no password-reset mail and no email verification, so
account recovery is an operator command:

```bash
docker compose exec backend python -m app.cli reset-password someone@example.com
docker compose exec backend python -m app.cli delete-user someone@example.com
```

A reset revokes every session of that account, on the assumption that control
of it is in doubt; a delete takes the sessions with it.

## Reading the ratings

Lesson ratings are curation signal, not a product feature: there is no
dashboard and no public counter, and the reader who voted sees only their own
vote. The curator reads them in psql.

```bash
docker compose exec db psql -U postgres -d distillcourse -c "
  SELECT lesson,
         count(*) FILTER (WHERE value = 1)  AS useful,
         count(*) FILTER (WHERE value = -1) AS not_useful,
         max(updated_at)                    AS last_vote
  FROM lesson_ratings GROUP BY lesson ORDER BY not_useful DESC, useful DESC;"
```

`bookmarks` and `lesson_progress` are readable the same way. Deleting a user
takes all three with it.

## Backups and recovery

`prodrigestivill/postgres-backup-local` writes a compressed `pg_dump` to
`./backups` once a day and keeps 7 dailies and 4 weeklies.

**RPO is 24 hours**, chosen deliberately: the content of record — courses,
lessons, figures — lives in git, and what Postgres holds is user state that is
cheap to lose a day of relative to the cost of running continuous archiving on
a single box. Revisit when that stops being true.

```bash
make backup          # dump now instead of waiting for the daily run
make restore-drill   # restore the newest dump into a throwaway Postgres
```

`make restore-drill` is the part that matters: it restores into an empty
volume and fails unless `users` and `alembic_version` come back. Run it after
any change to the backup configuration — an untested backup is not a backup.

Real recovery is the same restore aimed at the live database. The dump is taken
with `--clean --if-exists`, so it drops each object before recreating it and can
be piped straight into a database that already has a schema:

```bash
docker compose stop backend
gunzip -c backups/last/<db>-latest.sql.gz \
  | docker compose exec -T db psql -v ON_ERROR_STOP=1 -U postgres -d <db>
docker compose up -d
```

## Observability

`logfire` instruments FastAPI, SQLAlchemy and httpx. Without `LOGFIRE_TOKEN`
the instrumentation stays local and the process still starts; with a token,
traces ship to logfire.
