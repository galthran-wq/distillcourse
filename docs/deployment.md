# Deployment

One VPS, one operator, `docker compose`. There is no CD: nothing deploys
itself. `make deploy` is the whole procedure, plus `make reindex` when the
content changed.

## Topology

```
              :80 / :443
                  │
               caddy ──── /api/*  ──> backend  :8000  ──┐
                  └────── everything else ──> frontend :3000
                                                        │
                          migrate (runs once, exits) ───┤
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
make deploy      # git pull --ff-only, build, migrate, restart, show status
make reindex     # content changed: rebuild the search index the tutor reads
```

`make reindex` exports `index.json` from the content tree and feeds it to the
backend's ingest CLI. It is separate from `make deploy` because it needs Node
on the box, not just Docker: the export runs the site's own MDX pipeline, the
only way an indexed anchor and a page anchor cannot diverge. Set
`CONTENT_PREVIEW` to whatever the frontend image was built with, or the index
and the site will disagree about which lessons exist.

The export is the complete index, and ingest deletes every row of the corpora
it mentions that the file no longer lists — that is how a renamed heading or a
deleted lesson stops being a search result the tutor can quote.

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
