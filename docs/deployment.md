# Deployment

One VPS, one operator, `docker compose`. There is no CD: nothing deploys
itself, and `make deploy` is the whole procedure.

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
```

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

Real recovery is the same restore aimed at the live database:

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
