.PHONY: up down logs deploy reindex webhook backup restore-drill

# The same file docker compose substitutes from, so a build and the index that
# describes it cannot disagree about which lessons exist. `?=` keeps compose's
# own default for a file that does not set it.
-include .env
CONTENT_PREVIEW ?= 1
export CONTENT_PREVIEW

up:
	docker compose up -d --build

down:
	docker compose down

logs:
	docker compose logs -f

# Deployment is manual and lives here rather than in CI: one VPS, one operator.
# Reindexing is part of it, not a step to remember afterwards: a build that
# renames an h2 or unpublishes a lesson leaves `documents` naming anchors the
# page no longer has, and the tutor hands out locators that scroll nowhere.
#
# The labs run here, on the host, before the image is built: a lab that is not
# green stops the deploy before anything is replaced, the image validates with
# --no-labs instead of executing every lab a second time, and the build-labs
# in reindex finds them all stamped and executes none of them a third time.
deploy:
	git pull --ff-only
	npm run build-labs
	docker compose build
	docker compose up -d --remove-orphans
	$(MAKE) reindex
	$(MAKE) webhook
	docker compose ps

# Telegram keeps what setWebhook was last told — the URL and which update
# kinds to post — on its side, so a release that changes `allowed_updates`
# (app/telegram/api.py) is not live until this runs. Idempotent, hence every
# deploy rather than a step to remember. No bot configured, nothing to tell.
webhook:
	if [ -n "$(TELEGRAM_BOT_TOKEN)" ]; then docker compose exec -T backend python -m app.cli set-webhook "$(FRONTEND_HOST)/api/tg/webhook"; fi

# Node is required here, not just docker: the export runs the site's own MDX
# pipeline, which is the only way an indexed anchor and a page anchor cannot
# diverge. uv too, wherever a lab lesson exists — the labs are rebuilt rather
# than assumed, so the answer keys the API grades against are the ones the
# notebooks on the mirror were generated from.
reindex:
	npm run export-index
	npm run build-labs
	docker compose cp index.json backend:/tmp/index.json
	docker compose exec -T backend rm -rf /tmp/labs-private
	if [ -d labs-dist/private ]; then docker compose cp labs-dist/private backend:/tmp/labs-private; fi
	docker compose exec -T backend python -m app.content.ingest /tmp/index.json /tmp/labs-private

backup:
	docker compose exec backup /backup.sh

restore-drill:
	./ops/restore-drill.sh
